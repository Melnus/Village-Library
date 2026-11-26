import { world, system, BlockPermutation, BlockVolume, ItemStack } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { BIOMES, BUILDINGS, DOORS, JOBS, JOB_LIST } from "./data.js";
import { CUSTOM } from "./custom.js";
import { startDungeonDriver, createRun, boardRun, isAtriumReady, genProgress, atriumRunAt, runAt, occupantsOf, runsForMine, annihilateRun, isUGDim, VARIANTS, variantById, drawVariant, PICKAXE_TIER, pendingOf, hasPendingForRun, ARR_Y, startCleanupSweep, setSweepNotify } from "./dungeon.js";

// 生成待ちの進捗ゲージ (10マス)
function gauge(pct) { const f = Math.max(0, Math.min(10, Math.round(pct / 10))); return "■".repeat(f) + "□".repeat(10 - f); }

// Village Library v055 (
// v055: 整地を追加。建物メニューから選ぶと 40x40x40 を全部空気にし、底は土か石に
// 揃える。範囲の鉱石・原木など取引所で扱われるものは近くのチェスト (無ければ角に
// 置く) へ回収。重なる登録済み建物は登録を畳んでから消す。ブラシでアンドゥ可能。
// Village Library v054 (
// v054: グリーンハウスの蜂の巣横のディスペンサー2つに、元ワールド通りハサミを入れて
// 建てられるようにした (中身はブロックエンティティなので extras 構造物で再現。
// 片方はスロット1・耐久3減、もう片方はスロット0・新品 — 元ワールドのまま)。
// Village Library v053 (
// v053: 窓口 = 建物コア。設置後の走査で鉄ブロックかワックス済み看板を窓口として検知し、
// 建物レコードに core/counters を記録する。窓口をタップすると何を生産するか表示する
// (モック: 表示のみ)。BMH/RVB が建物を検知して扱うときの核になる想定。
// Village Library v052 (
// v052: 鉱山 (地下のラン) と港 (登録) のようにブラシのアンドゥでは後始末できない建物は、アンドゥせず
// 「メイスで破壊してください」と案内する (メイスには確認・退避・ランの片付けがある)。アンドゥ記録は残す。
// v051 (
// v051: ブラシのアンドゥも、メイスと同じ「先に範囲全体を乾かす (水没と水を外す、2回)」を復元の前に行う。
// v050 (
// v050: メイス破壊の最初に、範囲 (最大40x40 と高さ) の全セルの水没と水ブロックを外して乾かしてから、更地にする
// (2回、間に20tick待つ)。水が残ったまま消すと、残った階段/ハーフの水が空きセルへ流れ込み直していた。
// v049 (
// v049 (1): サトウキビは建物の最後 (水・extras のあと) に置く。途中で置くと壊れてドロップがホッパー経由でチェストに入っていた。
// v049 (2): メイス破壊の最後に、更地の全セルで「水没できるブロックを置く → setWaterlogged(false) → 空気」を行い、
// 階段/ハーフに含まれていた液体レイヤーの水を確実に消す (空気に見えて検出できないため、検出せずに全セル実行)。
// v048: v047 の水没セル (wet) が建物の回転に追従せず、回して建てると関係ない階段/ハーフが水没していたのを修正
// (rotateCustomEntry で wet も回す)。メイスで更地にした後、空気に見えて液体だけ残るセルの掃除を追加。
// v047 (ツルハシ抽選 + ローグライクなラン制の地下 + マルチ対応 + メイス破壊)
// v047 (2): メイス破壊で、水没していた階段/ハーフブロックの水だけ空中に残る件を修正。段ごとに fill air で
// 液体レイヤーごと消す。アンドゥも水没/ハーフ/階段のセルは setblock air で液体を消してから復元する。
// v047 (1): グリーンハウスの水を元ワールドの通りに再現。元ワールドで水没していた階段/ハーフブロック 96 個
// (畑の両脇の用水路) を構造物データ (wet) に登録し、設置の最後に水没させる (サトウキビ隣の推測は廃止)。
// 流水路の水ブロックは壁と畑ができてから置く (先に置くと外へ溢れて周囲が水浸しになっていた)。
// v046: (1) メイスは「元に戻す」ではなく「更地にする」に変更 (ブラシのアンドゥが登録済みの
// 地形へ戻す機能)。建物の範囲を上の段から空にし、地下の段 (depth) は周囲の地面と同じ
// ブロックで埋める。重なって登録されていた古い建物の記録も一緒に消す (以前は前に建てた
// 同じ建物が復元されるだけで「何も壊れない」ように見えていた)。
// (2) 設置の最後に、サトウキビ用に選んだ階段以外の水没をすべて外す (入口の段差に水が出る件)。
// v045: (1) メイス破壊/アンドゥの撤去を共通処理 (startDemolish) に。上の段から先に、
// 落下ブロック (金床・砂利など) と付着ブロック (松明・ランタン・ドア等) を撤去してから
// 地形を復元する (下を先に消すと金床が落ちて撤去をすり抜けていた)。復元後に落ちたアイテム
// と落下中ブロックを片付ける (建設時の片付けと同じ)。水没していたブロックは水没を外してから
// 置き換える (置き換えても水が水源として残り、外へ溢れていた)。破壊は建物の範囲に
// ティッキングエリアを張ってから実行する。
// (2) グリーンハウスの入口の段差 4 段 (dry) は水没させない。水没させるのは畑の中の階段だけ。
// v044: (1) トラップドアが建物の回転に追従しなかったのを修正。トラップドアの direction は
// 0=東 1=西 2=南 3=北 (階段の weirdo_direction と同じ並び) で、ドアやベッドの
// 0=南 1=西 2=北 3=東 とは違うため、+1 では東→西のように反転/ずれていた。
// (2) グリーンハウスのサトウキビが建設後に消える件: 土台の泥の隣に水が無いと、付け直し後の
// ブロック更新でサトウキビが壊れてアイテム化 (→掃除で消える) していた。層データには水の
// 水没レイヤーが無いので、サトウキビを置く前に、土台の隣の階段/ハーフブロックを水没させる。
// v043: グリーンハウスを v4 書き出しで再登録 (ランタン位置修正、サクラの葉と木を撤去、
// 蜂の巣は2匹入りの巣が (20,8,18) へ移動)。3,684 ブロック。
// v042: 建設を固定 5 秒から実進捗 (ゲージ + %) 方式へ。設置はジョブで分割実行し、
// 仕上げは設置完了後。サトウキビ・竹・ランタン・壁看板・ドア等は付け直しパスで後付け。
// v041: 回転の修正 (実機報告): pillar_axis の入れ替え、facing_direction 表の誤り
// (南と東) の修正、文字列の minecraft:facing_direction (オブザーバー) の回転対応。
// あわせてグリーンハウスの水を元の liquid_depth に戻した (両端だけ水源の流水路)。
// v040: グリーンハウスの蜂の巣を蜂2匹に (構造物データのみ更新)。投資して建てるものなので
// モブ入りは可、という北斗の判断 (2026-11-25)。
// v039: カスタム「グリーンハウス」(custom:greenhouse、33x17x32 + depth 1、3,700ブロック) を追加。
// 北斗のワールド書き出しから変換。作物は生育段階混在のまま、ピストン/ホッパーの機構も
// スナップショットとして再現。入口看板 "Greenhouse" はワックス済みで extras 化、
// 植木鉢14種と蜂の巣 (蜂入り) も extras で再現。床下の回収ホッパー+チェストは depth 1。
// v038: カスタム「木工所」(custom:woodshop、38x21x35、3,806ブロック) を追加。
// 北斗のワールド書き出しから変換。前庭の植木鉢20個 (苗木9種) は extras の
// 1x1x1 ストラクチャー (vlib_pot_*) で植木鉢BEごと再現する。この建物は
// (ブロック, ステート) の組が111種あり、パレット記号をギリシャ文字+カタカナまで拡張した。
// v037: 倉庫の入口看板をワックス済み (IsWaxed=1) にした。プレイヤーは編集できず
// 編集画面も開かない。文字の変更はスクリプト側 (看板コンポーネントの setText) で行う想定。
// v036: 倉庫の入口看板の文字 ("Warehouse") を extras の小構造物
// (structures/vlib_warehouse_sign.mcstructure) で再現するようにした。
// ワールドの生NBTでは FrontText.Text に入っていたが、変換ツールの翻訳ビューでは
// 空に見えたため v035 では無地扱いになっていた (北斗の指摘で判明)。
// v035: 自分の制作物に「倉庫」(会社向けの巨大倉庫兼汎用施設、24x17x23) を追加。
// 北斗のワールド書き出し (Drive RVB フォルダの 倉庫.zip) から LevelDB を直接読み、
// 層テキスト形式へ変換したもの。壁・ガラス等の接続ステートは配置時にゲームが
// 再計算する前提で落としてある。看板は全て無地だったので extras は無し。
// v034: 残骸掃除が各プロットを消す直前に、実際のプレイヤー位置でも人がいないか
// 確認するようにした。人がいたらそのプロットは飛ばして掃除の最後にもう一度回す。
// 中に残ったモブやドロップも箱の消滅と同じく一緒に消す。
// v033: 過去の箱の残骸掃除。v031 以前の fill バグで残った、ラン記録の無い
// プロットのブロックを、ワールド読み込み時に一度 (と /scriptevent vlib:cleanup で)
// 全ディメンジョン分まとめて消す。生きている箱のプロットは飛ばす。判定は岩盤の殻。
// v032: 実機の待ち時間が長すぎた件への対処。出発ゲートは第1階全体から到着広間の
// 3x3 チャンクへ縮小 (残りは探索に先行して生成される)。生成待ちの表示は
// 「もう少し待ってください」ではなくゲージ + % で進捗を出す。銅のツルハシが
// 代金の表から漏れていたので追加 (木/石と同じプール)。dungeon.js の fill() で
// 終端 z が min になっていたバグを修正 — 体積フィルが z 最小面の板に潰れており、
// 空になった箱の消滅が面しか消せていなかった (残ったブロックが溜まる主因)。
// v031: 降下シークエンスの見直し。タップ -> 確認フォーム -> ツルハシを消費して抽選し、
// 洞窟名を告知 -> 30秒の準備フェーズ (その間に箱の全階を生成) -> 黒コンクリートの上に
// 集まった最大4人が出発する。代金は先払い、出発時に誰もいなければ取り消し (返金なし)。
// 生成はティッキングエリアを張って行い、未読み込みで失敗したチャンクはキューへ戻す。
// 封じ込めは2ティック間隔になり、足元が未生成の場所にいる場合も広間へ戻す。
// メイス破壊: 確認フォームの UserBusy リトライ、重なった建物は新しい方を優先、
// レジストリに無い鉱山/港は専用レジストリから引いて破壊、見つからない時は知らせる。
// v030: エンチャント付きのツルハシは代金として受け取らない (タップ時点で
// 「エンチャント付きのツルハシは受け取れません」と断る)。到着時の消費も
// エンチャント付きのスタックを飛ばして、無エンチャントのものから食べる。
// v029: 地下は「鉱山ごとの固定の部屋」から「降りるたびのラン」に変わった。ツルハシを
// 持って黒コンクリートをタップすると材質で洞窟の種類を抽選 (木/石=しょぼい、鉄=中間、
// 金/ダイヤ/ネザライト=レア)、10秒の猶予のあと範囲に立つ最大4人が同じ新しい箱へ出発し、
// ツルハシはタップした人の分が到着時に消費される。洞窟は9種 (通常/敵大量/水没/石炭/
// 水晶/ネザークォーツ/原石/鉱石/古代の残骸) で、テーマ系は生成時に洞窟の壁を差し替える
// (石炭は埋めたTNTがたまに起爆する)。帰りは鉄床に立つと箱の全員で投票し、全員一致で
// 全員帰還・否決なら誰も帰れない。誰もいなくなった箱は消滅する (ローグライク)。
// 建物はレジストリに地形ごと記録され、メイスのタップで破壊できる (中に人がいる鉱山は
// 地下の全員投票が先)。コマンド: /scriptevent vlib:cave_<種類> で各洞窟へ直接行ける。
// v028: 生成済みの地下へ再び降りるとき、チャンクが読めるまでの待ちが無言だったのを修正 (ティッキングエリアを定期的に張り直し + 案内表示)。到着後のエリア削除が別ディメンジョンを狙っていた漏れも修正。行き (地下へ降りる) はリードを1つ消費する (到着時に消費、失敗時は減らない)。帰りは無料。
// v026: 鉱山を建てると地下の種類がランダムで決まる (通常/敵大量/鉱石豊富/水没)。
// 種類ごとに専用ディメンジョン + その中で区画分離。当たった種類は建てた時に告知。
// v025: 地下の箱を地上座標から切り離し、鉱山ごとの専用プロット (px, pz) に
// 置くようにした。近い鉱山同士で箱が重なって混ざる問題の修正。
// v024: 建設時に建物の上の32段も上書きする (木の冠など。アンドゥで戻る)。
// 地下ダンジョンは箱の外に出たらスタート地点 (到着広間) に戻す。
// v023: 港のタップ対象をランタン柱から鉄コンテナ (port.tap の正確なセル) へ
// 変更し、そのセルは playerBreakBlock をキャンセルして壊せなくした。
// v022: 港のアンカーを北西の角からピース本来の原点 (苔むした石レンガ、
// ローカル [22,22]) に変更。骨ブロックを陸側の原点に置くと港は北西へ
// 展開する (CYBELE の展開仕様通り)。回転時はアンカーも回る。
// v021: 建物を選んだ後に正面の向き (北/東/南/西) を選び、建てる前に
// 完成像をパーティクルの枠で薄く表示する (プレビュー)。骨ブロックを
// 紙でタップすると確定、離れる/15秒で取消。回転は村の建物は
// structure load の回転指定、制作物は層データとステートを回して対応。
// 鉱山の黒コンクリ範囲・帰還位置、港の柱・着地点も向きに追随する。
// v020: 北斗が CYBELE 用に作った港ピース (work/port-piece/piece.json) を
// custom:port として取り込み、建てた港同士をランタン柱タップの一覧から
// 移動できるようにした。配置はピースの指定通り北西固定の展開に合わせ、
// 青氷は各列の表面1層だけ水源に置換する (placeCustom の blueIceToWater)。
// v019: CYBELE v0.0.20 の地下ダンジョン生成器 (ug_gen.js / elevator_data.js は
// 原文のまま) と生成ドライバ (dungeon.js) を移植。鉱山ごとに vlib:underground
// 内へ 96x96 の箱 (4階建て) が生成され、到着は第1階の到着広間 (エレベーター)
// になる。v015〜v018 の仮エレベーター室は廃止。登録には建てたディメンション
// (dim) を持たせ、帰りはそのディメンションの鉱山前へ戻す。
// v018: CYBELE 併用時の握手 (鉄床パッド) を試したが、単体で本物のダンジョンに
// 入れるよう v019 で移植方式に切り替えた (パッド方式は不採用)。
// v017: クッション方式をやめ、視線でアクションバー案内 + ブロックのタップで
// ワープする方式にした (対象は登録済み鉱山の黒コンクリート床と、地下の鉄床)。
// v016: warpDown を「読み込み待ち -> 生成 -> 床の読み戻し確認 -> テレポート」の
// 段階式にした (v015 は生成が空振りして虚空に落とす事故が実機で起きたため)。
// v015: 制作物「鉱山」を建てると原点がワールドの Dynamic Property (vlib:mines)
// に永続登録され、別ディメンション(vlib:underground)のエレベーター室と繋がる。
// アンドゥすると登録も消える。
// 骨ブロックに紙を持ってインタラクト -> 村(バイオーム)を選ぶ -> 施設を選ぶ。
// アンドゥ: 建設前に体積内の全ブロックを記録し、直近1件だけ元に戻せる (Wool Printer方式)。
// 骨ブロックが建物の角(原点)になり、建物の底面と同じ大きさの骨ブロックの
// 土台が広がって、5秒後に土台が消えて建物が建つ。
// 建物は structures/ に同梱の .mcstructure(名前は <biome>_<no>_<tag>)。
// ドアは構造物ロードでアイテム化して落ちるため、建てた後に DOORS の位置へ付け直す。

const BUILD_DELAY_TICKS = 100; // 5秒
const busy = new Set(); // 建設中の原点(二重実行の防止)
const CELLS_PER_TICK = 256; // 記録・復元の分割単位 (Wool Printerと同じ)
const CLEAR_UP = 32; // 建設時に建物の上も上書きする段数 (木の冠など被さるもの対策)
const undoByPlayer = new Map(); // player.id -> { dim, origin, w, h, d, labelJa, entries:[{x,y,z,perm}] } 直近1件のみ

// tickingarea はプレイヤーごとに固定名 (張る前に必ず消す。Wool Printer方式)
function areaNameFor(player) { return "vlib_" + player.name.replace(/[^A-Za-z0-9_]/g, "_"); }
function setupArea(dim, player, minP, maxP) {
    const name = areaNameFor(player);
    try { dim.runCommand(`tickingarea remove ${name}`); } catch {}
    try {
        let yMin = -64, yMax = 320;
        try { yMin = dim.heightRange.min; yMax = dim.heightRange.max; } catch {}
        dim.runCommand(`tickingarea add ${minP.x} ${Math.max(minP.y, yMin)} ${minP.z} ${maxP.x} ${Math.min(maxP.y, yMax - 1)} ${maxP.z} ${name}`);
        return name;
    } catch { return undefined; }
}
function clearArea(dim, name) { if (!name) return; try { dim.runCommand(`tickingarea remove ${name}`); } catch {} }

const wait = (ticks) => new Promise((res) => system.runTimeout(res, ticks));

// ---- 日英対応 (BMH方式: RPなし、スクリプト辞書でプレイヤーごとに判定) ----
// 言語は player.clientSystemInfo.locale で判定 (ja始まり→日本語、それ以外→英語)。
// メニュー内の言語切替ボタンで vlib:pref_lang に保存した指定があればそちら優先。
function getLang(player) {
    try {
        const pref = player.getDynamicProperty("vlib:pref_lang");
        if (pref === "ja" || pref === "en") return pref;
    } catch {}
    try {
        const loc = player.clientSystemInfo?.locale;
        if (typeof loc === "string" && loc.toLowerCase().startsWith("ja")) return "ja";
    } catch {}
    return "en";
}
function t(lang, record, ...args) {
    const v = record[lang] ?? record.en;
    return typeof v === "function" ? v(...args) : v;
}
const STR = {
    selectVillage: { ja: "村を選んでください", en: "Select a village" },
    selectFacility: { ja: "建てる施設を選んでください(番号 名前 横x奥行き)", en: "Select a facility to build (No. Name WxD)" },
    selectCategory: { ja: "分類を選んでください", en: "Select a category" },
    byJob: { ja: (n) => `[職業別] (${n})`, en: (n) => `[By Profession] (${n})` },
    otherCat: { ja: (n) => `[その他] (${n})`, en: (n) => `[Other] (${n})` },
    selectJob: { ja: "職業を選んでください", en: "Select a profession" },
    customCategory: { ja: "[自分の制作物]", en: "[My Creations]" },
    selectCustom: { ja: "建てる制作物を選んでください(番号 名前 横x奥行き)", en: "Select a creation to build (No. Name WxD)" },
    back: { ja: "[戻る]", en: "[Back]" },
    langToggle: { ja: "[言語切替 → English]", en: "[Language → 日本語]" },
    busy: { ja: "この場所は建設中です", en: "This spot is already under construction" },
    noBone: { ja: "骨ブロックがなくなっています", en: "The bone block is gone" },
    foundation: { ja: (name, w, d) => `土台(${w}x${d})を敷きました。5秒後に「${name}」を建てます`, en: (name, w, d) => `Foundation (${w}x${d}) laid. Building "${name}" in 5 seconds` },
    countdown: { ja: (i) => `あと ${i} 秒`, en: (i) => `${i}...` },
    loadFailed: { ja: (e) => `structure load に失敗しました: ${e}`, en: (e) => `structure load failed: ${e}` },
    built: { ja: (name, w, h, d) => `「${name}」を建てました(${w}x${h}x${d})`, en: (name, w, h, d) => `Built "${name}" (${w}x${h}x${d})` },
    doorFailed: { ja: (failed, ok, total) => `ドア ${failed} 枚の設置に失敗しました(成功 ${ok} / ${total} 枚)`, en: (failed, ok, total) => `Failed to place ${failed} door(s) (${ok}/${total} placed)` },
    cleaned: { ja: (n) => `周りのドロップを ${n} 個片付けました`, en: (n) => `Cleaned up ${n} dropped item(s) nearby` },
    startFailed: { ja: (e) => `建設を開始できませんでした: ${e}`, en: (e) => `Could not start building: ${e}` },
    finishFailed: { ja: (e) => `仕上げに失敗しました: ${e}`, en: (e) => `Finishing step failed: ${e}` },
    noBoneNear: { ja: "近くに骨ブロックがありません", en: "No bone block found nearby" },
    undoButton: { ja: (name) => `[元に戻す: ${name}]`, en: (name) => `[Undo: ${name}]` },
    undoNone: { ja: "元に戻せる記録がありません", en: "Nothing to undo" },
    undoDone: { ja: (name) => `「${name}」を元に戻しました`, en: (name) => `Undid "${name}"` },
    undoUseMace: { ja: (name) => `「${name}」は地下や登録など二次的に生まれるものがあるため、ブラシでは元に戻せません。メイスで破壊してください`, en: (name) => `"${name}" has secondary parts (underground, registrations), so it cannot be undone with the brush. Use the mace to destroy it` },
    undoWait: { ja: "建設中は元に戻せません", en: "Cannot undo while a build is in progress" },
    mineLinked: { ja: "鉱山を地下と繋ぎました。ツルハシを持って黒コンクリートをタップすると地下へ行けます", en: "Mine linked. Tap the black concrete with a pickaxe to go underground" },
    mineVariant: { ja: (name) => `掘り当てた地下は「${name}」！`, en: (name) => `This mine struck: ${name}!` },
    needPickaxe: { ja: "地下へ行くにはツルハシを持って黒コンクリートをタップしてください", en: "Hold a pickaxe and tap the black concrete to go underground" },
    enchantedPickaxe: { ja: "エンチャント付きのツルハシは受け取れません", en: "Enchanted pickaxes cannot be accepted" },
    gazeDown: { ja: "ツルハシでタップすると地下へ", en: "Tap with a pickaxe to go underground" },
    gazeUp: { ja: "上に立つと帰還 (1人なら即帰還、複数なら投票)", en: "Stand here to return (instant solo, vote with a party)" },
    gatherBar: { ja: (s) => `出発まで あと ${s} 秒: 黒コンクリートの上に立ってください (最大4人)`, en: (s) => `Departing in ${s}s: stand on the black concrete (max 4)` },
    gatherBusy: { ja: "出発の準備中です", en: "A departure is already being prepared" },
    gatherCancel: { ja: "黒コンクリートに乗らなかったため出発を中止しました", en: "Departure cancelled: the leader was not on the black concrete" },
    descentTitle: { ja: "地下へ行きますか？", en: "Go underground?" },
    descentBody: { ja: (pick) => `${pick}を1本消費して新しい洞窟を掘ります。掘り当てるまで種類は分かりません。出発は30秒後、黒コンクリートの上に集まった人 (最大4人) が一緒に降ります`, en: (pick) => `Consume 1 ${pick} to dig a new cave. Its kind is a surprise until dug. Departure is in 30s: everyone standing on the black concrete (max 4) goes down together` },
    building: { ja: (name, bar, pct) => `「${name}」を建てています… ${bar} ${pct}%`, en: (name, bar, pct) => `Building ${name}… ${bar} ${pct}%` },
    prepBar: { ja: (name, s, bar, pct) => `「${name}」へ出発まで あと ${s} 秒: 黒コンクリートの上に集まってください (最大4人) 生成 ${bar} ${pct}%`, en: (name, s, bar, pct) => `${name}: departing in ${s}s - gather on the black concrete (max 4) ${bar} ${pct}%` },
    prepGen: { ja: (name, bar, pct) => `「${name}」を生成中 ${bar} ${pct}%`, en: (name, bar, pct) => `Generating ${name} ${bar} ${pct}%` },
    descentNone: { ja: "誰も集まらなかったため、出発を取り消しました (ツルハシは消費済みです)", en: "Nobody gathered, so the departure was cancelled (the pickaxe was consumed)" },
    descentNoPick: { ja: "ツルハシが見つからなかったため、中止しました", en: "Cancelled: the pickaxe could not be found" },
    maceNotFound: { ja: "その場所に破壊できる建物が見つかりません", en: "No destructible building found there" },
    partyFull: { ja: "定員 (4人) を超えたため残ります", en: "The party is full (4), so you stay behind" },
    yes: { ja: "はい", en: "Yes" },
    no: { ja: "いいえ", en: "No" },
    retVoteTitle: { ja: "帰還の投票", en: "Return vote" },
    retVoteBody: { ja: (name) => `${name} が帰還を提案しています。全員で地上に戻りますか？`, en: (name) => `${name} proposes returning. Everyone goes back to the surface?` },
    retVotePassed: { ja: "全員の同意で地上に戻ります", en: "Everyone agreed: returning to the surface" },
    retVoteFailed: { ja: "帰還は否決されました", en: "The return was voted down" },
    destroyTitle: { ja: "建物の破壊", en: "Destroy building" },
    destroyConfirm: { ja: (name) => `「${name}」を破壊しますか？ 建物の範囲は更地になり、紐づいた地下の部屋も消滅します`, en: (name) => `Destroy "${name}"? The area is cleared to bare ground and its linked underground rooms are annihilated` },
    destroyVoteBody: { ja: (name) => `地上で「${name}」の破壊が提案されています。同意すると全員が地上へ避難し、建物と地下の部屋は消滅します`, en: (name) => `Destroying "${name}" was proposed on the surface. If everyone agrees, everyone evacuates and the building and its rooms are annihilated` },
    destroyDone: { ja: (name) => `「${name}」を破壊しました`, en: (name) => `Destroyed "${name}"` },
    destroyVetoed: { ja: "地下の投票で破壊は否決されました", en: "The destruction was voted down underground" },
    destroyBusy: { ja: "降下中の人がいるため破壊できません", en: "Someone is descending, so it cannot be destroyed now" },
    destroyEvac: { ja: "全員の同意で地上へ避難します", en: "Everyone agreed: evacuating to the surface" },
    portLinked: { ja: "港を登録しました。ランタンの柱をタップすると他の港へ移動できます", en: "Port registered. Tap a lantern pillar to travel to another port" },
    gazePort: { ja: "タップで港の一覧", en: "Tap to list ports" },
    gazeCore: { ja: "タップで建物の情報", en: "Tap for building info" },
    coreProduces: { ja: (s) => `生産：${s}`, en: (s) => `Produces: ${s}` },
    closeLabel: { ja: "閉じる", en: "Close" },
    gradeButton: { ja: "[整地] 40x40", en: "[Grade land] 40x40" },
    gradingBar: { ja: (bar, pct) => `整地しています… ${bar} ${pct}%`, en: (bar, pct) => `Grading… ${bar} ${pct}%` },
    graded: { ja: "整地しました (40x40)", en: "Land graded (40x40)" },
    harvestNote: { ja: (list) => `回収してチェストに入れました：${list}`, en: (list) => `Collected into a chest: ${list}` },
    noBreakPort: { ja: "このコンテナは壊せません", en: "This container cannot be broken." },
    portTitle: { ja: "港", en: "Ports" },
    portBody: { ja: "行き先の港を選んでください", en: "Choose a destination port" },
    portNone: { ja: "ほかに登録された港がありません", en: "No other ports are registered" },
    portName: { ja: (i, x, z) => `港 ${i} (${x}, ${z})`, en: (i, x, z) => `Port ${i} (${x}, ${z})` },
    portArrived: { ja: (name) => `${name} に着きました`, en: (name) => `Arrived at ${name}` },
    warpDown: { ja: "地下へ降ります", en: "Descending underground" },
    warpUp: { ja: "鉱山に戻りました", en: "Back at the mine" },
    ugPreparing: { ja: (bar, pct) => `地下を生成中 ${bar} ${pct}%`, en: (bar, pct) => `Generating the underground ${bar} ${pct}%` },
    ugFailed: { ja: "地下の生成が終わりませんでした。もう一度試してください", en: "The underground did not finish generating. Please try again" },
    cleanupStart: { ja: "過去の箱の残骸の掃除を始めます (裏で進みます)", en: "Started sweeping the remains of past boxes (runs in the background)" },
    cleanupBusy: { ja: "残骸の掃除はすでに進んでいます", en: "The cleanup sweep is already running" },
    cleanupNone: { ja: "掃除する残骸はありませんでした", en: "There were no box remains to clean" },
    cleanupDone: { ja: (n) => `過去の箱の残骸を掃除しました (${n} プロット分)`, en: (n) => `Swept the remains of past boxes (${n} plots)` },
    warpFail: { ja: (e) => `ワープに失敗しました: ${e}`, en: (e) => `Warp failed: ${e}` },
    warpNone: { ja: "繋がっている鉱山がありません", en: "No linked mine found" },
    dirTitle: { ja: "向きを選んでください", en: "Choose a direction" },
    dirBody: { ja: (name) => `「${name}」の正面の向きを選んでください`, en: (name) => `Choose which way "${name}" faces` },
    dirN: { ja: "北向き", en: "Facing north" },
    dirE: { ja: "東向き", en: "Facing east" },
    dirS: { ja: "南向き", en: "Facing south" },
    dirW: { ja: "西向き", en: "Facing west" },
    previewStart: { ja: (name) => `「${name}」のプレビューを表示中です`, en: (name) => `Previewing "${name}"` },
    previewHint: { ja: (s) => `プレビュー中: 骨ブロックを紙でタップすると確定 (あと${s}秒)`, en: (s) => `Preview: tap the bone block with paper to build (${s}s left)` },
    previewCancel: { ja: "プレビューを取り消しました", en: "Preview cancelled" },
};
const BIOME_EN = { plains: "Plains Village", desert: "Desert Village", savanna: "Savanna Village", snowy: "Snowy Village", taiga: "Taiga Village" };
const LABEL_EN = { "井戸": "Well", "建物": "Building", "牧場・柵": "Pasture & Fence", "街灯・小物": "Lamp & Props", "小物": "Props", "舗装・広場": "Paved Plaza", "鎧鍛冶": "Armorer", "民家": "House", "肉屋": "Butcher", "製図家": "Cartographer", "矢師": "Fletcher", "畑": "Farm Plot", "図書館": "Library", "石工": "Mason", "羊飼い": "Shepherd", "皮なめし": "Tannery", "釣り小屋": "Fisher Cottage", "聖職者": "Cleric", "道具鍛冶": "Toolsmith", "武器鍛冶": "Weaponsmith", "農家": "Farmhouse", "庭・小物": "Garden & Props", "シラカバのロッジ": "Birch Lodge", "鐘": "Bell", "鉱山": "Mine", "港": "Port" };
const biomeLabel = (lang, biome, jaLabel) => (lang === "en" ? (BIOME_EN[biome] ?? jaLabel) : jaLabel);
const buildingLabel = (lang, jaLabel) => (lang === "en" ? (LABEL_EN[jaLabel] ?? jaLabel) : jaLabel);

// ---- 向き (v021): rot = 時計回りの 90 度単位 (0=北向き=従来通り, 1=東, 2=南, 3=西) ----
// structure load の回転は時計回りで、配置先は回転後の北西の角が原点になる (Minecraft Wiki)。
function rotPoint(x, z, w, d, rot) {
    switch (rot & 3) {
        case 1: return [d - 1 - z, x];
        case 2: return [w - 1 - x, d - 1 - z];
        case 3: return [z, w - 1 - x];
        default: return [x, z];
    }
}
const rotDims = (w, d, rot) => (rot % 2 === 1 ? [d, w] : [w, d]);
function rotVec(x, z, rot) {
    switch (rot & 3) {
        case 1: return [-z, x];
        case 2: return [-x, -z];
        case 3: return [z, -x];
        default: return [x, z];
    }
}
const CARDINALS = ["north", "east", "south", "west"];
function rotCardinal(c, rot) {
    const i = CARDINALS.indexOf(c);
    return i < 0 ? c : CARDINALS[(i + (rot & 3)) % 4];
}
// 制作物のブロックステートを時計回りに 90 度ずつ回す。回転で変わらないものはそのまま。
const WEIRDO_CW = [2, 3, 1, 0]; // 階段 weirdo_direction: 0=東 1=西 2=南 3=北 → 東→南→西→北
const FACING_CW = [0, 1, 5, 4, 2, 3]; // facing_direction: 0=下 1=上 2=北 3=南 4=西 5=東 → 北→東→南→西→北 (v041 で表の誤りを修正)
function rotStatesOnce(states, name) {
    const s = { ...states };
    const isTrapdoor = typeof name === "string" && name.endsWith("_trapdoor");
    if (typeof s.weirdo_direction === "number") s.weirdo_direction = WEIRDO_CW[s.weirdo_direction] ?? s.weirdo_direction;
    if (typeof s.facing_direction === "number") s.facing_direction = FACING_CW[s.facing_direction] ?? s.facing_direction;
    if (typeof s["minecraft:facing_direction"] === "string") s["minecraft:facing_direction"] = rotCardinal(s["minecraft:facing_direction"], 1); // オブザーバー等 (v041)
    if (s.pillar_axis === "x") s.pillar_axis = "z"; else if (s.pillar_axis === "z") s.pillar_axis = "x"; // 原木の軸 (v041)
    if (typeof s.direction === "number") {
        // トラップドアだけ並びが違う: 0=東 1=西 2=南 3=北 (階段と同じ)。それ以外 (ドア・ベッド等) は 0=南 1=西 2=北 3=東 の時計回り順 (v044)
        if (isTrapdoor) s.direction = WEIRDO_CW[s.direction] ?? s.direction;
        else s.direction = (s.direction + 1) % 4;
    }
    if (typeof s["minecraft:cardinal_direction"] === "string") s["minecraft:cardinal_direction"] = rotCardinal(s["minecraft:cardinal_direction"], 1);
    if (typeof s.torch_facing_direction === "string") s.torch_facing_direction = rotCardinal(s.torch_facing_direction, 1);
    if (typeof s.ground_sign_direction === "number") s.ground_sign_direction = (s.ground_sign_direction + 4) % 16;
    const conn = (prefix) => {
        const n = s[prefix + "north"], e = s[prefix + "east"], so = s[prefix + "south"], w = s[prefix + "west"];
        if (n === undefined && e === undefined && so === undefined && w === undefined) return;
        if (n !== undefined) s[prefix + "east"] = n;
        if (e !== undefined) s[prefix + "south"] = e;
        if (so !== undefined) s[prefix + "west"] = so;
        if (w !== undefined) s[prefix + "north"] = w;
    };
    conn("minecraft:connection_");
    conn("wall_connection_type_");
    return s;
}
function rotStates(states, rot, name) {
    let s = states || {};
    for (let i = 0; i < (rot & 3); i++) s = rotStatesOnce(s, name);
    return s;
}
// 制作物エントリの回転コピーを作る (層・パレット・extras のアンカーを回す)。rot=0 なら元のまま。
function rotateCustomEntry(c, rot) {
    rot &= 3;
    if (!rot) return c;
    const [w2, d2] = rotDims(c.w, c.d, rot);
    const palette = {};
    for (const [sym, [name, states]] of Object.entries(c.palette)) palette[sym] = [name, rotStates(states, rot, name)];
    const layers = c.layers.map((rows) => {
        const out = Array.from({ length: d2 }, () => new Array(w2).fill("."));
        for (let z = 0; z < rows.length; z++) for (let x = 0; x < rows[z].length; x++) {
            const ch = rows[z][x];
            if (ch === ".") continue;
            const [nx, nz] = rotPoint(x, z, c.w, c.d, rot);
            out[nz][nx] = ch;
        }
        return out.map((r) => r.join(""));
    });
    const extras = (c.extras || []).map(([name, x, y, z, ew, ed]) => {
        if (!ew || !ed) return [name, x, y, z, ew, ed, rot];
        const corners = [[x, z], [x + ew - 1, z], [x, z + ed - 1], [x + ew - 1, z + ed - 1]].map(([cx, cz]) => rotPoint(cx, cz, c.w, c.d, rot));
        const nx = Math.min(...corners.map((p) => p[0])), nz = Math.min(...corners.map((p) => p[1]));
        return [name, nx, y, nz, ew, ed, rot];
    });
    const dry = (c.dry || []).map(([x, y, z]) => { const [nx, nz] = rotPoint(x, z, c.w, c.d, rot); return [nx, y, nz]; });
    const wet = c.wet ? c.wet.map(([x, y, z]) => { const [nx, nz] = rotPoint(x, z, c.w, c.d, rot); return [nx, y, nz]; }) : undefined; // v047
    return { ...c, w: w2, d: d2, palette, layers, extras, dry, ...(wet ? { wet } : {}) };
}

function getBlockSafe(dim, pos) {
    try { return dim.getBlock(pos); } catch { return undefined; }
}

// UI を開く。別の画面が開いていて UserBusy で返ってきたら少し待って再試行する。
async function showForm(player, form) {
    for (let i = 0; i < 12; i++) {
        const res = await form.show(player);
        if (res.cancelationReason !== "UserBusy") return res;
        await wait(10);
    }
    return undefined;
}

async function openBiomeMenu(player, origin, dim) {
    const lang = getLang(player);
    const undoRec = undoByPlayer.get(player.id);
    const offset = undoRec ? 1 : 0;
    const form = new ActionFormData().title("Village Library [v055]").body(t(lang, STR.selectVillage));
    if (undoRec) form.button(t(lang, STR.undoButton, buildingLabel(lang, undoRec.labelJa)));
    for (const [biome, label] of BIOMES) form.button(`[${biomeLabel(lang, biome, label)}]`);
    form.button(t(lang, STR.customCategory));
    form.button(t(lang, STR.gradeButton));
    form.button(t(lang, STR.langToggle));
    const res = await showForm(player, form);
    if (!res || res.canceled) return;
    if (undoRec && res.selection === 0) { startUndo(player); return; }
    if (res.selection === offset + BIOMES.length) { await openCustomMenu(player, origin, dim); return; }
    if (res.selection === offset + BIOMES.length + 1) { startPreview(player, dim, origin, ["grade", "", "整地", 40, 40, 40], 0); return; }
    if (res.selection === offset + BIOMES.length + 2) {
        try { player.setDynamicProperty("vlib:pref_lang", lang === "ja" ? "en" : "ja"); } catch {}
        await openBiomeMenu(player, origin, dim);
        return;
    }
    const biome = BIOMES[res.selection - offset]?.[0];
    if (!biome) return;
    await openFacilityMenu(player, origin, dim, biome);
}

async function openCustomMenu(player, origin, dim) {
    const lang = getLang(player);
    const form = new ActionFormData().title(t(lang, STR.customCategory)).body(t(lang, STR.selectCustom));
    form.button(t(lang, STR.back));
    for (const c of CUSTOM) form.button(`${c.no} ${buildingLabel(lang, c.name)} ${c.w}x${c.d}`);
    const res = await showForm(player, form);
    if (!res || res.canceled) return;
    if (res.selection === 0) { await openBiomeMenu(player, origin, dim); return; }
    const c = CUSTOM[res.selection - 1];
    if (!c) return;
    await openDirectionForm(player, dim, origin, [c.id, c.no, c.name, c.w, c.h, c.d], () => openCustomMenu(player, origin, dim));
}

// 向き選択 (v021): 建物を選んだ後に正面の向きを聞き、プレビューへ進む。
async function openDirectionForm(player, dim, origin, item, onBack) {
    const lang = getLang(player);
    const form = new ActionFormData().title(t(lang, STR.dirTitle)).body(t(lang, STR.dirBody, buildingLabel(lang, item[2])));
    form.button(t(lang, STR.back));
    form.button(t(lang, STR.dirN));
    form.button(t(lang, STR.dirE));
    form.button(t(lang, STR.dirS));
    form.button(t(lang, STR.dirW));
    const res = await showForm(player, form);
    if (!res || res.canceled) return;
    if (res.selection === 0) { if (onBack) await onBack(); return; }
    startPreview(player, dim, origin, item, res.selection - 1);
}

// ---- プレビュー (v021): 建てる前に完成像をパーティクルの枠で薄く表示する ----
// 地形は一切触らない。骨ブロックを紙でタップすると確定、8ブロック離れるか
// 15秒経つと取消。制作物は層データがあるので実際の形の輪郭も出す。
const previews = new Map(); // playerId -> { player, dim, origin, item, rot, expires }
const PREVIEW_TICKS = 300;
function startPreview(player, dim, origin, item, rot) {
    previews.set(player.id, { player, dim, origin: { ...origin }, item, rot, expires: system.currentTick + PREVIEW_TICKS });
    try { player.sendMessage("§b[Village Library]§r " + t(getLang(player), STR.previewStart, buildingLabel(getLang(player), item[2]))); } catch {}
}
function drawPreview(pv) {
    const { dim, item, rot } = pv;
    let { origin } = pv;
    const [id, , , bw, h, bd] = item;
    const [w, d] = rotDims(bw, bd, rot);
    const base = id.startsWith("custom:") ? CUSTOM.find((x) => x.id === id) : undefined;
    const depth = base ? (base.depth || 0) : 0;
    if (base && base.anchor) { // 描画は配置原点 (北西の角) 基準に直す
        const [ax, az] = rotPoint(base.anchor[0], base.anchor[1], bw, bd, rot);
        origin = { x: origin.x - ax, y: origin.y, z: origin.z - az };
    }
    const yBot = origin.y - depth, yTop = origin.y + h - 1;
    const pts = [];
    const P = (x, y, z) => pts.push([x + 0.5, y + 0.5, z + 0.5]);
    for (const y of [yBot, yTop]) {
        for (let x = 0; x < w; x++) { P(origin.x + x, y, origin.z); P(origin.x + x, y, origin.z + d - 1); }
        for (let z = 1; z < d - 1; z++) { P(origin.x, y, origin.z + z); P(origin.x + w - 1, y, origin.z + z); }
    }
    const vStep = h > 12 ? 2 : 1;
    for (let y = yBot; y <= yTop; y += vStep) for (const [cx, cz] of [[0, 0], [w - 1, 0], [0, d - 1], [w - 1, d - 1]]) P(origin.x + cx, y, origin.z + cz);
    if (base) {
        const rc = rotateCustomEntry(base, rot);
        for (let ly = 0; ly < rc.layers.length; ly++) {
            const rows = rc.layers[ly];
            for (let z = 0; z < rows.length; z++) for (let x = 0; x < rows[z].length; x++) {
                if (rows[z][x] === ".") continue;
                const edge = (rows[z - 1]?.[x] ?? ".") === "." || (rows[z + 1]?.[x] ?? ".") === "." || (rows[z][x - 1] ?? ".") === "." || (rows[z][x + 1] ?? ".") === ".";
                if (edge && (x + z + ly) % 2 === 0) P(origin.x + x, origin.y - depth + ly, origin.z + z);
            }
        }
    }
    const capped = pts.length > 900 ? pts.filter((_, i) => i % Math.ceil(pts.length / 900) === 0) : pts;
    try { for (const [x, y, z] of capped) dim.spawnParticle("minecraft:endrod", { x, y, z }); } catch {}
}
system.runInterval(() => {
    for (const [pid, pv] of [...previews]) {
        const p = pv.player;
        const dx = p.location.x - (pv.origin.x + 0.5), dz = p.location.z - (pv.origin.z + 0.5);
        if (system.currentTick > pv.expires || dx * dx + dz * dz > 64 || p.dimension?.id !== pv.dim.id) {
            previews.delete(pid);
            try { p.sendMessage("§7[Village Library]§r " + t(getLang(p), STR.previewCancel)); } catch {}
            try { p.onScreenDisplay.setActionBar(""); } catch {}
            continue;
        }
        drawPreview(pv);
        try { p.onScreenDisplay.setActionBar(t(getLang(p), STR.previewHint, Math.max(0, Math.ceil((pv.expires - system.currentTick) / 20)))); } catch {}
    }
}, 10);

// 自分の制作物(層テキスト)を原点から配置する。'.'は空気(structure load と同じく範囲内を空にする)。
// ステート付きの解決に失敗したブロックは、ステートなし(既定)で置き直す。
// c は rotateCustomEntry で回したコピー (rot=0 なら原本)。extras は回転済みアンカーを持つ。
// v042: 一括設置ではなくジョブ (generator) で分割設置し、prog.done で進捗を返す。
// 支え・付着が要るブロック (サトウキビ、竹、ぶら下がるランタン、壁看板、ドア等) は
// 本体を置き終えた後に付け直す。村の建物でドアが構造物ロードだけでは落ちてしまい、
// 付け直しが必要だったのと同じ発想 (先に置くと付着条件を満たせずアイテム化する)。
function isDeferredBlock(name, states) {
    if (name === "minecraft:reeds" || name === "minecraft:bamboo" || name === "minecraft:bamboo_sapling") return true;
    if (name === "minecraft:lantern" || name === "minecraft:soul_lantern") return true;
    if (name.endsWith("_wall_sign") || name.endsWith("_wall_torch") || name.endsWith("_wall_hanging_sign")) return true;
    if ((name === "minecraft:torch" || name === "minecraft:soul_torch") && states && states.torch_facing_direction && states.torch_facing_direction !== "up") return true;
    if (name.includes("trapdoor")) return true;
    if (name.includes("door")) return true;
    if (name.endsWith("_carpet")) return true;
    if (name === "minecraft:sunflower" || name === "minecraft:lilac" || name === "minecraft:rose_bush" || name === "minecraft:peony" || name === "minecraft:tall_grass" || name === "minecraft:large_fern" || name === "minecraft:pitcher_plant") return true;
    return false;
}

function* placeCustomGen(dim, origin, c, prog) {
    if (!c) throw new Error("custom entry missing");
    const cache = {};
    const perm = (sym) => {
        if (cache[sym] !== undefined) return cache[sym];
        let p;
        if (sym === ".") p = BlockPermutation.resolve("minecraft:air");
        else {
            const [name, states] = c.palette[sym];
            try { p = BlockPermutation.resolve(name, states); }
            catch { try { p = BlockPermutation.resolve(name); } catch { p = BlockPermutation.resolve("minecraft:air"); } }
        }
        cache[sym] = p;
        return p;
    };
    const depth = c.depth || 0; // 原点より下の段数(layers[0]は origin.y - depth)
    // 港ピースの配置ルール (北斗の想定): 青氷は各列の表面1層だけ水源に置換し、
    // それより下の青氷セルは置かない (実際の海では既存の水がそのまま残る)。
    let iceTop = null, waterPerm = null;
    if (c.blueIceToWater) {
        iceTop = new Map();
        for (let y = 0; y < c.layers.length; y++) for (let z = 0; z < c.layers[y].length; z++) for (let x = 0; x < c.layers[y][z].length; x++) {
            const s = c.layers[y][z][x];
            if (s !== "." && c.palette[s] && c.palette[s][0] === "minecraft:blue_ice") iceTop.set(x + "," + z, y);
        }
        waterPerm = BlockPermutation.resolve("minecraft:water");
    }
    const place = (x, y, z, sym) => {
        const b = getBlockSafe(dim, { x: origin.x + x, y: origin.y - depth + y, z: origin.z + z });
        if (!b) return false; // チャンク未読込 — 呼び出し側で回収して後で再試行する
        if (iceTop && sym !== "." && c.palette[sym] && c.palette[sym][0] === "minecraft:blue_ice") {
            if (y !== iceTop.get(x + "," + z)) return true; // 深い青氷は置かない
            try { b.setPermutation(waterPerm); } catch {}
            return true;
        }
        try { b.setPermutation(perm(sym)); } catch {}
        return true;
    };
    const missed = [];
    const deferred = [];
    const waters = []; // v047: 流水路の水ブロック (c.wet があるときだけ後置き)
    let sinceYield = 0;
    // パス1: 本体 (付け直し対象は集めるだけ)
    for (let y = 0; y < c.layers.length; y++) {
        const rows = c.layers[y];
        for (let z = 0; z < rows.length; z++) {
            for (let x = 0; x < rows[z].length; x++) {
                const sym = rows[z][x];
                if (y < depth && sym === ".") continue; // 地面より下の「.」は地面をそのまま残す
                if (sym !== "." && c.wet && c.palette[sym][0] === "minecraft:water") { waters.push([x, y, z, sym]); continue; } // v047: 水は壁と畑が全部できてから置く (先に置くと外へ溢れる)
                if (sym !== "." && isDeferredBlock(c.palette[sym][0], c.palette[sym][1])) { deferred.push([x, y, z, sym]); continue; }
                if (!place(x, y, z, sym)) missed.push([x, y, z, sym]);
                if (sym !== "." && prog) prog.done++;
                if (++sinceYield >= 256) { sinceYield = 0; yield; }
            }
        }
    }
    const caneWater = new Set(); // 水没させた階段のセル (x,y,z) — これ以外は最後に水没を外す
    // パス1.5 (v044): サトウキビの水。土台の隣に水が無いと、置いた直後のブロック更新で
    // サトウキビが壊れてしまう。層データは水没レイヤーを持たないので、データ上でも土台の
    // 隣に水が無い場合は、隣の階段/ハーフブロックを水没させる (元ワールドの作りの再現)。
    {
        const nameAt = (x, y, z) => { const s = c.layers[y]?.[z]?.[x]; return s && s !== "." ? c.palette[s][0] : null; };
        const worldBlock = (x, y, z) => getBlockSafe(dim, { x: origin.x + x, y: origin.y - depth + y, z: origin.z + z });
        let warned = false;
        for (const [x, y, z, sym] of (c.wet ? [] : deferred)) { // v047: 元ワールドの水没リスト (c.wet) があるときは推測しない
            if (c.palette[sym][0] !== "minecraft:reeds" || nameAt(x, y - 1, z) === "minecraft:reeds") continue; // 土台の1本だけ見る
            const by = y - 1;
            const nbrs = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
            if (nbrs.some(([nx, nz]) => nameAt(nx, by, nz) === "minecraft:water")) continue; // 水源/流水がデータにある
            let ok = false;
            for (const [nx, nz] of nbrs) {
                const nn = nameAt(nx, by, nz);
                if (!nn || !/_(stairs|slab)$/.test(nn)) continue;
                const nb = worldBlock(nx, by, nz);
                if (!nb) continue;
                try { if (!nb.isWaterlogged) nb.setWaterlogged(true); ok = true; caneWater.add(nx + "," + by + "," + nz); break; }
                catch (e) { if (!warned) { warned = true; console.warn("[VillageLibrary] sugar cane water (setWaterlogged): " + e); } }
            }
            if (!ok && !warned) { warned = true; console.warn("[VillageLibrary] sugar cane at " + x + "," + y + "," + z + ": no waterloggable neighbour"); }
        }
    }
    // パス2: 付け直し (下の段から順に — サトウキビや竹は下が先)
    deferred.sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[0] - b[0]);
    const reeds = []; // v048: サトウキビは建物ができあがった最後に置く (途中で壊れてドロップがホッパー経由でチェストに入るため)
    for (const [x, y, z, sym] of deferred) {
        if (c.palette[sym][0] === "minecraft:reeds") { reeds.push([x, y, z, sym]); continue; }
        if (!place(x, y, z, sym)) missed.push([x, y, z, sym]);
        if (prog) prog.done++;
        if (++sinceYield >= 256) { sinceYield = 0; yield; }
    }
    // 読めなかったセルの再試行 (読み込み待ちで数回まで粘る — 実機で1マスだけ抜ける対策)
    for (let round = 0; round < 3 && missed.length; round++) {
        yield;
        const retry = missed.splice(0, missed.length);
        for (const [x, y, z, sym] of retry) if (!place(x, y, z, sym)) missed.push([x, y, z, sym]);
    }
    // v047: 水の後置き。流水路 → 元ワールドで水没していた階段/ハーフブロック (c.wet) の順。
    // 以前は水没レイヤーを持たず、サトウキビの隣の階段しか水没させていなかったため、畑の端まで水が届かなかった。
    if (c.wet) {
        for (const [x, y, z, sym] of waters) {
            if (!place(x, y, z, sym)) missed.push([x, y, z, sym]);
            if (prog) prog.done++;
        }
        for (let round = 0; round < 3 && missed.length; round++) {
            yield;
            const retry = missed.splice(0, missed.length);
            for (const [x, y, z, sym] of retry) if (!place(x, y, z, sym)) missed.push([x, y, z, sym]);
        }
        let wetOk = 0, wetMiss = 0;
        for (const [x, y, z] of c.wet) {
            const b = getBlockSafe(dim, { x: origin.x + x, y: origin.y - depth + y, z: origin.z + z });
            if (!b) { wetMiss++; continue; }
            try { if (!b.isWaterlogged) b.setWaterlogged(true); caneWater.add(x + "," + y + "," + z); wetOk++; }
            catch (e) { wetMiss++; if (wetMiss === 1) console.warn("[VillageLibrary] wet setWaterlogged: " + e); }
            if (++sinceYield >= 256) { sinceYield = 0; yield; }
        }
        console.warn("[VillageLibrary] wet cells waterlogged " + wetOk + "/" + c.wet.length);
    }
    // v046: 設置した全セルを見て、サトウキビ用に選んだ階段以外の水没を外す (前の建物の水の残りや
    // 水の回り込みで、入口の段差などが水没していた)。水ブロックそのもの (流水路) には触らない。
    {
        let cleared = 0;
        for (let y = 0; y < c.layers.length; y++) {
            const rows = c.layers[y];
            for (let z = 0; z < rows.length; z++) for (let x = 0; x < rows[z].length; x++) {
                const sym = rows[z][x];
                if (sym === "." || c.palette[sym][0] === "minecraft:water") continue;
                const b = getBlockSafe(dim, { x: origin.x + x, y: origin.y - depth + y, z: origin.z + z });
                if (!b) continue;
                try { if (b.isWaterlogged && !caneWater.has(x + "," + y + "," + z)) { b.setWaterlogged(false); cleared++; } } catch {}
                if (++sinceYield >= 256) { sinceYield = 0; yield; }
            }
        }
        if (cleared > 0 || caneWater.size > 0) console.warn("[VillageLibrary] waterlogging: cane stairs " + caneWater.size + ", stray cleared " + cleared);
    }
    // v045: 水を要らない階段 (入口の段差など) は水没を外す。置き換えた場所に前の建物の水が
    // 残っていると、新しく置いた階段が水没してしまうため。
    for (const [x, y, z] of (c.dry || [])) {
        const b = getBlockSafe(dim, { x: origin.x + x, y: origin.y - depth + y, z: origin.z + z });
        if (b) { try { if (b.isWaterlogged) b.setWaterlogged(false); } catch {} }
    }
    // ブロックエンティティ(ベッドの色・シュルカーの向き)とエンティティ(クッション)は小さな構造物で再現
    for (const [name, x, y, z, , , erot] of (c.extras || [])) {
        try { dim.runCommand(`structure load ${name} ${origin.x + x} ${origin.y + y} ${origin.z + z}` + (erot ? ` ${erot * 90}_degrees` : "")); }
        catch (e) { console.warn("[VillageLibrary] extras " + name + ": " + e); }
    }
    // v048: 最後にサトウキビ。水・階段・土台がすべてできてから置く。
    {
        const missedReeds = [];
        for (const [x, y, z, sym] of reeds) {
            if (!place(x, y, z, sym)) missedReeds.push([x, y, z, sym]);
            if (prog) prog.done++;
            if (++sinceYield >= 256) { sinceYield = 0; yield; }
        }
        for (let round = 0; round < 3 && missedReeds.length; round++) {
            yield;
            const retry = missedReeds.splice(0, missedReeds.length);
            for (const [x, y, z, sym] of retry) if (!place(x, y, z, sym)) missedReeds.push([x, y, z, sym]);
        }
    }
}

// アンドゥ時: 自分の制作物が追加したエンティティ(クッション等)を範囲内から取り除く
function removeCustomEntities(rec) {
    try {
        const c = CUSTOM.find((x) => x.id === rec.customId);
        if (!c) return;
        const center = { x: rec.origin.x + rec.w / 2, y: rec.origin.y + rec.h / 2, z: rec.origin.z + rec.d / 2 };
        const r = Math.hypot(rec.w, rec.h, rec.d) / 2 + 2;
        for (const type of (c.entityTypes || [])) {
            for (const e of rec.dim.getEntities({ type, location: center, maxDistance: r })) {
                const l = e.location;
                if (l.x < rec.origin.x || l.x >= rec.origin.x + rec.w || l.y < rec.origin.y || l.y >= rec.origin.y + rec.h || l.z < rec.origin.z || l.z >= rec.origin.z + rec.d) continue;
                try { e.remove(); } catch {}
            }
        }
    } catch {}
}

// ---- 鉱山ワープ (v015 試作 / v017 で視線+タップ式 / v019 で本物のダンジョンへ) ----
// 鉱山 (custom:mine) を建てると原点を vlib:mines に登録する。登録済み鉱山の
// 黒コンクリート床に視線を向けるとアクションバーに案内が出て、そのまま
// タップすると dungeon.js の到着フローが走り、第1階の生成を待ってから
// vlib:underground の到着広間 (エレベーター) へ降りる。向こうのエレベーター
// の鉄床も同じ作法 (視線で案内、タップで鉱山の入口前へ戻る)。
// /scriptevent vlib:down / vlib:up でも往復できる。
const MINES_KEY = "vlib:mines";
const lastWarpTick = new Map(); // player.id -> tick (二重発火防止)

function loadMines() {
    let list = [];
    try {
        const s = world.getDynamicProperty(MINES_KEY);
        if (typeof s === "string" && s) { const v = JSON.parse(s); if (Array.isArray(v)) list = v; }
    } catch {}
    return list;
}
function saveMines(list) { try { world.setDynamicProperty(MINES_KEY, JSON.stringify(list)); } catch {} }
function findMine(ox, oy, oz) { return loadMines().find((m) => m.ox === ox && m.oy === oy && m.oz === oz); }

// 登録済み鉱山の黒コンクリート面 (原点の1段下、local x=2..4, z=2..6) に
// その座標が含まれていれば、その鉱山を返す (鉱山のあるディメンション内だけ)。
function minePatchAt(pos, dimId) {
    for (const m of loadMines()) {
        if (dimId && (m.dim || "minecraft:overworld") !== dimId) continue;
        if (pos.y !== m.oy - 1) continue;
        // 黒コンクリの範囲 (鉱山ローカル x 2..4, z 2..6) を建てた向きに回して判定する
        const [ax, az] = rotPoint(2, 2, 9, 9, m.rot || 0);
        const [bx, bz] = rotPoint(4, 6, 9, 9, m.rot || 0);
        const dx = pos.x - m.ox, dz = pos.z - m.oz;
        if (dx >= Math.min(ax, bx) && dx <= Math.max(ax, bx) && dz >= Math.min(az, bz) && dz <= Math.max(az, bz)) return m;
    }
    return undefined;
}


function registerMine(origin, dimId, rot = 0) {
    const list = loadMines();
    if (list.some((m) => m.ox === origin.x && m.oy === origin.y && m.oz === origin.z && (m.dim || "minecraft:overworld") === (dimId || "minecraft:overworld"))) return;
    const rec = { ox: origin.x, oy: origin.y, oz: origin.z, dim: dimId || "minecraft:overworld", rot: rot || 0 };
    list.push(rec);
    saveMines(list);
    return rec;
}
function unregisterMine(origin, dimId) {
    saveMines(loadMines().filter((m) => !(m.ox === origin.x && m.oy === origin.y && m.oz === origin.z && (!dimId || (m.dim || "minecraft:overworld") === dimId))));
}

// ---- 港 (v020): 建てた港を登録し、ランタン柱のタップで他の港へ移動する ----
const PORTS_KEY = "vlib:ports";
function loadPorts() {
    try {
        const s = world.getDynamicProperty(PORTS_KEY);
        if (typeof s === "string" && s) { const v = JSON.parse(s); if (Array.isArray(v)) return v; }
    } catch {}
    return [];
}
function savePorts(list) { try { world.setDynamicProperty(PORTS_KEY, JSON.stringify(list)); } catch {} }
function registerPort(origin, dimId, rot = 0) {
    const list = loadPorts();
    if (list.some((p) => p.ox === origin.x && p.oy === origin.y && p.oz === origin.z && (p.dim || "minecraft:overworld") === (dimId || "minecraft:overworld"))) return;
    list.push({ ox: origin.x, oy: origin.y, oz: origin.z, dim: dimId || "minecraft:overworld", rot: rot || 0 });
    savePorts(list);
}
function unregisterPort(origin, dimId) {
    savePorts(loadPorts().filter((p) => !(p.ox === origin.x && p.oy === origin.y && p.oz === origin.z && (!dimId || (p.dim || "minecraft:overworld") === dimId))));
}
// その座標が登録済み港の鉄コンテナ (custom.js の port.tap の正確なセル) なら、その港を返す。
// 破壊ガードも同じセル集合を使う。
function portTapAt(pos, dimId) {
    const c = CUSTOM.find((x) => x.id === "custom:port");
    if (!c || !c.port) return undefined;
    for (const p of loadPorts()) {
        if ((p.dim || "minecraft:overworld") !== dimId) continue;
        const w = pos.y - p.oy + (c.depth || 0);
        const hit = c.port.tap.some(([tx, ty, tz]) => {
            if (ty !== w) return false;
            const [rx, rz] = rotPoint(tx, tz, c.w, c.d, p.rot || 0);
            return p.ox + rx === pos.x && p.oz + rz === pos.z;
        });
        if (hit) return p;
    }
    return undefined;
}
async function showPortMenu(player, fromPort) {
    const lang = getLang(player);
    const msg = (s) => { try { player.sendMessage(s); } catch {} };
    const list = loadPorts();
    const same = (a, b) => a.ox === b.ox && a.oy === b.oy && a.oz === b.oz && (a.dim || "minecraft:overworld") === (b.dim || "minecraft:overworld");
    const others = list.filter((p) => !same(p, fromPort));
    if (!others.length) { msg("§b[Village Library]§r " + t(lang, STR.portNone)); return; }
    const form = new ActionFormData().title(t(lang, STR.portTitle)).body(t(lang, STR.portBody));
    for (const p of others) form.button(t(lang, STR.portName, list.indexOf(p) + 1, p.ox, p.oz));
    let res;
    try { res = await form.show(player); } catch { return; }
    if (!res || res.canceled || res.selection === undefined) return;
    const target = others[res.selection];
    if (!target) return;
    const c = CUSTOM.find((x) => x.id === "custom:port");
    const [blx, blz] = (c && c.port && c.port.landing) || [20, 20];
    const [lx, lz] = c ? rotPoint(blx, blz, c.w, c.d, target.rot || 0) : [blx, blz];
    let dim;
    try { dim = world.getDimension(target.dim || "minecraft:overworld"); } catch (e) { msg("§c[Village Library]§r " + t(lang, STR.warpFail, e)); return; }
    try { player.teleport({ x: target.ox + lx + 0.5, y: target.oy, z: target.oz + lz + 0.5 }, { dimension: dim, rotation: { x: 0, y: 135 + (target.rot || 0) * 90 } }); }
    catch (e) { msg("§c[Village Library]§r " + t(lang, STR.warpFail, e)); return; }
    msg("§b[Village Library]§r " + t(lang, STR.portArrived, t(lang, STR.portName, list.indexOf(target) + 1, target.ox, target.oz)));
}

// 帰り: 鉱山のあるディメンションの、入口 (北側) の前に立たせる。
function warpUp(player, m) {
    const lang = getLang(player);
    const msg = (s) => { try { player.sendMessage(s); } catch {} };
    let home;
    try { home = world.getDimension(m.dim || "minecraft:overworld"); } catch (e) { msg("§c[Village Library]§r " + t(lang, STR.warpFail, e)); return; }
    // 鉱山の入口は北向き (回廊が北の階段へ抜ける)。建てた向きに合わせて入口の前に立たせる。
    const [fx, fz] = rotVec(3.5, -2.5, m.rot || 0);
    try { player.teleport({ x: m.ox + fx, y: m.oy, z: m.oz + fz }, { dimension: home, rotation: { x: 0, y: (m.rot || 0) * 90 } }); } catch (e) { msg("§c[Village Library]§r " + t(lang, STR.warpFail, e)); return; }
    msg("§b[Village Library]§r " + t(lang, STR.warpUp));
}

// エンチャント付きかどうか (ItemEnchantableComponent.getEnchantments)。
// 大事なツルハシを代金として食べてしまわないための確認で、取れない場合は「無し」扱いに倒す。
function hasEnchantments(itemStack) {
    try {
        const ec = itemStack && itemStack.getComponent ? itemStack.getComponent("minecraft:enchantable") : undefined;
        const list = ec && ec.getEnchantments ? ec.getEnchantments() : undefined;
        return !!(list && list.length > 0);
    } catch { return false; }
}

// インベントリ操作 (ツルハシの消費など)
function invCount(player, typeId) {
    try {
        const inv = player.getComponent("minecraft:inventory")?.container;
        if (!inv) return 0;
        let n = 0;
        for (let i = 0; i < inv.size; i++) { const it = inv.getItem(i); if (it && it.typeId === typeId) n += it.amount; }
        return n;
    } catch { return 0; }
}
function invConsume(player, typeId, n) {
    try {
        const inv = player.getComponent("minecraft:inventory")?.container;
        if (!inv) return false;
        for (let i = 0; i < inv.size && n > 0; i++) {
            const it = inv.getItem(i);
            if (!it || it.typeId !== typeId) continue;
            if (hasEnchantments(it)) continue; // エンチャント付きは代金として食べない
            if (it.amount > n) { it.amount -= n; inv.setItem(i, it); n = 0; }
            else { n -= it.amount; inv.setItem(i, undefined); }
        }
        return n <= 0;
    } catch { return false; }
}

// ---- 集団降下 (v031): ツルハシでタップ -> 確認フォーム -> ツルハシを消費して抽選 ->
// 30秒の準備フェーズ (その間に箱を生成する) -> 黒コンクリートの上に集まった最大4人が出発。
// 代金は先払い (確認した時点で消費)。出発時に誰もいなければ取り消し (返金なし)。
const preps = new Map(); // mineKey -> { mine, tapperId, variant, run, endsAt }
const PREP_TICKS = 600; // 30秒
const PICK_NAME = {
    "minecraft:wooden_pickaxe": { ja: "木のツルハシ", en: "Wooden Pickaxe" },
    "minecraft:stone_pickaxe": { ja: "石のツルハシ", en: "Stone Pickaxe" },
    "minecraft:copper_pickaxe": { ja: "銅のツルハシ", en: "Copper Pickaxe" },
    "minecraft:iron_pickaxe": { ja: "鉄のツルハシ", en: "Iron Pickaxe" },
    "minecraft:golden_pickaxe": { ja: "金のツルハシ", en: "Golden Pickaxe" },
    "minecraft:diamond_pickaxe": { ja: "ダイヤモンドのツルハシ", en: "Diamond Pickaxe" },
    "minecraft:netherite_pickaxe": { ja: "ネザライトのツルハシ", en: "Netherite Pickaxe" },
};
function mineKeyOf(m) { return (m.dim || "minecraft:overworld") + "|" + m.ox + "," + m.oy + "," + m.oz; }
function patchRectOf(m) {
    const [ax, az] = rotPoint(2, 2, 9, 9, m.rot || 0);
    const [bx, bz] = rotPoint(4, 6, 9, 9, m.rot || 0);
    return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) };
}
function playersOnPatch(m) {
    const r = patchRectOf(m);
    const dimId = m.dim || "minecraft:overworld";
    return world.getAllPlayers().filter((p) => {
        if (!p.dimension || p.dimension.id !== dimId) return false;
        const l = p.location;
        const bx = Math.floor(l.x) - m.ox, bz = Math.floor(l.z) - m.oz;
        return bx >= r.x0 && bx <= r.x1 && bz >= r.z0 && bz <= r.z1 && l.y >= m.oy - 0.5 && l.y <= m.oy + 1.5;
    });
}
// パーティを既存のランへ乗せる (準備フェーズの出発とコマンド入口で共用)
function boardParty(run, party) {
    const cb = {
        onProgress: (p, sec, prog) => { try { const pct = prog && prog.total ? Math.floor(prog.done * 100 / prog.total) : 0; p.onScreenDisplay.setActionBar("§e" + t(getLang(p), STR.ugPreparing, gauge(pct), pct)); } catch {} },
        onArrived: (p) => { try { p.sendMessage("§b[Village Library]§r " + t(getLang(p), STR.warpDown)); } catch {} },
        onFailed: (p) => { try { p.sendMessage("§c[Village Library]§r " + t(getLang(p), STR.ugFailed)); } catch {} },
    };
    const eligible = party.filter((p) => !pendingOf(p.id) && !(p.dimension && isUGDim(p.dimension.id)));
    if (!eligible.length) return false;
    boardRun(run, eligible, cb);
    return true;
}
// コマンド入口: ランを作って即搭乗 (ツルハシ不要のデバッグ入口)
function startDescentParty(mine, variant, party, tapperId, pickType) {
    const run = createRun(mine, variant);
    if (!boardParty(run, party)) { annihilateRun(run); return undefined; }
    return run;
}
// タップ後の確認 -> 消費 -> 抽選 -> 告知 -> 準備フェーズ開始
async function confirmDescent(player, mine, pickType) {
    const lang = getLang(player);
    const msg = (s) => { try { player.sendMessage(s); } catch {} };
    const key = mineKeyOf(mine);
    if (preps.has(key)) { msg("§e[Village Library]§r " + t(lang, STR.gatherBusy)); return; }
    const pickName = (PICK_NAME[pickType] || {})[lang] || pickType;
    const ok = await askYesNo(player, t(lang, STR.descentTitle), t(lang, STR.descentBody, pickName));
    if (ok !== true) return;
    if (preps.has(key)) { msg("§e[Village Library]§r " + t(lang, STR.gatherBusy)); return; }
    if (!invConsume(player, pickType, 1)) { msg("§c[Village Library]§r " + t(lang, STR.descentNoPick)); return; }
    const variant = drawVariant(PICKAXE_TIER[pickType]);
    const run = createRun(mine, variant);
    preps.set(key, { mine, tapperId: player.id, variant, run, endsAt: system.currentTick + PREP_TICKS });
    const dimId = mine.dim || "minecraft:overworld";
    for (const p of world.getAllPlayers()) {
        if (!p.dimension || p.dimension.id !== dimId) continue;
        const dx = p.location.x - mine.ox, dz = p.location.z - mine.oz;
        if (p.id !== player.id && dx * dx + dz * dz > 32 * 32) continue;
        try { p.sendMessage("§d[Village Library]§r " + t(getLang(p), STR.mineVariant, getLang(p) === "en" ? variant.en : variant.ja)); } catch {}
    }
}
system.runInterval(() => {
    try {
        const now = system.currentTick;
        for (const [key, pr] of [...preps]) {
            const mine = loadMines().find((m) => mineKeyOf(m) === key);
            if (!mine || pr.run.dying || !runsForMine(mine).includes(pr.run)) { preps.delete(key); continue; }
            const dimId = mine.dim || "minecraft:overworld";
            const remain = Math.ceil((pr.endsAt - now) / 20);
            const genReady = isAtriumReady(pr.run) || now > pr.endsAt + 3600; // 広間ができ次第出発 (箱の残りは探索に先行して生成される)。長引く場合は見切り発車
            if (remain > 0 || !genReady) {
                for (const p of world.getAllPlayers()) {
                    if (!p.dimension || p.dimension.id !== dimId) continue;
                    const dx = p.location.x - mine.ox, dz = p.location.z - mine.oz;
                    if (dx * dx + dz * dz > 24 * 24) continue;
                    const vn = getLang(p) === "en" ? pr.variant.en : pr.variant.ja;
                    const prog = genProgress(pr.run); const pct = prog.total ? Math.floor(prog.done * 100 / prog.total) : 0;
                    try { p.onScreenDisplay.setActionBar("§e" + (remain > 0 ? t(getLang(p), STR.prepBar, vn, remain, gauge(pct), pct) : t(getLang(p), STR.prepGen, vn, gauge(pct), pct))); } catch {}
                }
                continue;
            }
            // 出発: 黒コンクリートの上にいる人 (タップした人優先、あとは中心に近い順) 最大4人
            preps.delete(key);
            const r = patchRectOf(mine);
            const cx = mine.ox + (r.x0 + r.x1 + 1) / 2, cz = mine.oz + (r.z0 + r.z1 + 1) / 2;
            const onPatch = playersOnPatch(mine);
            onPatch.sort((a, b) => {
                if (a.id === pr.tapperId) return -1;
                if (b.id === pr.tapperId) return 1;
                const da = (a.location.x - cx) ** 2 + (a.location.z - cz) ** 2;
                const db = (b.location.x - cx) ** 2 + (b.location.z - cz) ** 2;
                return da - db;
            });
            const party = onPatch.slice(0, 4);
            for (const p of onPatch.slice(4)) { try { p.sendMessage("§e[Village Library]§r " + t(getLang(p), STR.partyFull)); } catch {} }
            if (!party.length || !boardParty(pr.run, party)) {
                const tp = world.getAllPlayers().find((p) => p.id === pr.tapperId);
                if (tp) { try { tp.sendMessage("§c[Village Library]§r " + t(getLang(tp), STR.descentNone)); } catch {} }
                annihilateRun(pr.run);
            }
        }
    } catch (e) { console.warn("[VillageLibrary] prep: " + e); }
}, 10);

// ---- 帰還投票 (v029): 到着広間の鉄床に立つと、その箱の全員で投票する。
// 全員一致で全員が地上へ戻り箱は消える。否決なら誰も帰れない (個別の出口はない)。
// 到着直後の誤発を防ぐため、広間を一度離れた人だけが発動できる。
const standTrack = new Map(); // player.id -> { runKey, since }
const armedReturn = new Set(); // player.id + "|" + runKey
const returnVotes = new Map(); // runKey -> { run, initiatorId, answers, endsAt }
const returnCooldown = new Map(); // runKey -> tick
async function askYesNo(player, title, body) {
    const lang = getLang(player);
    const form = new ActionFormData().title(title).body(body);
    form.button(t(lang, STR.yes));
    form.button(t(lang, STR.no));
    // タップ直後はクライアントが UserBusy を返しやすいので、メニューと同じく少し待って再試行する。
    // (v030 までは単発で、実機では確認フォームが出ずに無言で終わることがあった)
    for (let i = 0; i < 12; i++) {
        try {
            const res = await form.show(player);
            if (res && res.cancelationReason === "UserBusy") { await wait(10); continue; }
            if (!res || res.canceled || res.selection === undefined) return undefined;
            return res.selection === 0;
        } catch { return undefined; }
    }
    return undefined;
}
function resolveReturnVote(runKey, timedOut) {
    const v = returnVotes.get(runKey);
    if (!v) return;
    const occupants = occupantsOf(v.run);
    const voters = occupants.filter((p) => p.id !== v.initiatorId);
    if (!timedOut && !voters.every((p) => v.answers.has(p.id))) return;
    returnVotes.delete(runKey);
    const passed = occupants.some((p) => p.id === v.initiatorId) && voters.every((p) => v.answers.get(p.id) === true);
    if (passed) {
        for (const p of occupants) { try { p.sendMessage("§b[Village Library]§r " + t(getLang(p), STR.retVotePassed)); } catch {} }
        for (const p of occupants) warpUp(p, v.run);
    } else {
        returnCooldown.set(runKey, system.currentTick + 600);
        for (const p of occupants) { try { p.sendMessage("§c[Village Library]§r " + t(getLang(p), STR.retVoteFailed)); } catch {} }
    }
}
function startReturnVote(run, initiator) {
    const occupants = occupantsOf(run);
    if (occupants.length <= 1) { warpUp(initiator, run); return; }
    const v = { run, initiatorId: initiator.id, answers: new Map(), endsAt: system.currentTick + 300 };
    returnVotes.set(run.key, v);
    for (const p of occupants) {
        if (p.id === initiator.id) continue;
        askYesNo(p, t(getLang(p), STR.retVoteTitle), t(getLang(p), STR.retVoteBody, initiator.name)).then((ans) => {
            if (ans !== undefined && returnVotes.get(run.key) === v) { v.answers.set(p.id, ans); resolveReturnVote(run.key, false); }
        }).catch(() => {});
    }
}
system.runInterval(() => {
    try {
        const now = system.currentTick;
        for (const [k] of [...returnVotes]) { const vv = returnVotes.get(k); if (vv) resolveReturnVote(k, now > vv.endsAt); }
        for (const p of world.getAllPlayers()) {
            if (!p.dimension || !isUGDim(p.dimension.id)) {
                standTrack.delete(p.id);
                for (const k of [...armedReturn]) if (k.startsWith(p.id + "|")) armedReturn.delete(k);
                continue;
            }
            const runHere = runAt(p.dimension.id, p.location);
            if (!runHere) { standTrack.delete(p.id); continue; }
            const loc = p.location;
            const onFloor = atriumRunAt(p.dimension.id, { x: Math.floor(loc.x), y: ARR_Y, z: Math.floor(loc.z) }) === runHere && loc.y >= ARR_Y + 0.9 && loc.y <= ARR_Y + 1.7;
            if (!onFloor) { armedReturn.add(p.id + "|" + runHere.key); standTrack.delete(p.id); continue; }
            if (!armedReturn.has(p.id + "|" + runHere.key)) { standTrack.delete(p.id); continue; }
            if (returnVotes.has(runHere.key)) continue;
            if ((returnCooldown.get(runHere.key) || 0) > now) continue;
            const tr = standTrack.get(p.id);
            if (!tr || tr.runKey !== runHere.key) { standTrack.set(p.id, { runKey: runHere.key, since: now }); continue; }
            if (now - tr.since >= 20) { standTrack.delete(p.id); startReturnVote(runHere, p); }
        }
    } catch (e) { console.warn("[VillageLibrary] return vote: " + e); }
}, 10);

// 視線プロンプト: ワープの口に視線が向いている間、アクションバーに案内を出す。
system.runInterval(() => {
    try {
        for (const player of world.getAllPlayers()) {
            let hit;
            try { hit = player.getBlockFromViewDirection({ maxDistance: 6 }); } catch {}
            const b = hit?.block;
            if (!b) continue;
            let text;
            if (b.typeId === "minecraft:black_concrete" && minePatchAt(b.location, player.dimension?.id)) text = t(getLang(player), STR.gazeDown);
            else if (b.typeId === "minecraft:iron_block" && isUGDim(player.dimension?.id) && atriumRunAt(player.dimension?.id, b.location)) text = t(getLang(player), STR.gazeUp);
            else if (portTapAt(b.location, player.dimension?.id)) text = t(getLang(player), STR.gazePort);
            else if (counterAt(b.location, player.dimension?.id)) text = t(getLang(player), STR.gazeCore);
            if (text) { try { player.onScreenDisplay.setActionBar("§b" + text); } catch {} }
        }
    } catch {}
}, 5);

// ワープの口: 港のコンテナは一覧、鉱山の黒コンクリートはツルハシで出発準備。
// 帰りはタップではなく到着広間の鉄床に立つ方式 (帰還投票) になった。
// 登録済みの範囲内だけが対象なので、通常の同種ブロックには反応しない。
world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    try {
        if (!ev.isFirstEvent) return;
        const { player, block, itemStack } = ev;
        if (!block) return;
        const port = portTapAt(block.location, block.dimension?.id);
        if (port) {
            ev.cancel = true;
            system.run(() => { showPortMenu(player, port).catch((e) => console.warn("[VillageLibrary] port menu: " + e)); });
            return;
        }
        if (block.typeId === "minecraft:black_concrete") {
            const m = minePatchAt(block.location, block.dimension?.id);
            if (!m) return;
            if (itemStack && itemStack.typeId === "minecraft:mace") return; // 破壊はメイス側の購読が処理する
            ev.cancel = true;
            if (itemStack && PICKAXE_TIER[itemStack.typeId]) {
                if (hasEnchantments(itemStack)) {
                    system.run(() => { try { player.sendMessage("§c[Village Library]§r " + t(getLang(player), STR.enchantedPickaxe)); } catch {} });
                } else {
                    system.run(() => { confirmDescent(player, m, itemStack.typeId).catch((e) => console.warn("[VillageLibrary] descent: " + e)); });
                }
            } else {
                system.run(() => { try { player.sendMessage("§e[Village Library]§r " + t(getLang(player), STR.needPickaxe)); } catch {} });
            }
        }
    } catch (e) { console.warn("[VillageLibrary] " + e); }
});

// 港の鉄コンテナ (port.guard) は壊せない。壊れると港の移動が二度と戻せなくなるため。
// 対象は登録済み港のコンテナセルだけで、通常の鉄ブロックには触らない。
world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    try {
        const c = CUSTOM.find((x) => x.id === "custom:port");
        if (!c || !c.port || !c.port.guard) return;
        if (portTapAt(ev.block.location, ev.block.dimension?.id)) {
            ev.cancel = true;
            try { ev.player.sendMessage("§c[Village Library]§r " + t(getLang(ev.player), STR.noBreakPort)); } catch {}
        }
    } catch (e) { console.warn("[VillageLibrary] " + e); }
});

// ---- 建物レジストリ + メイス破壊 (v029) ----
// 建てた建物と「建てる前の地形」を永続化しておき、メイスのタップで破壊できるようにする。
// 破壊 = 地形を元に戻す + 登録解除 + (鉱山なら) 紐づいた地下の部屋ごと消滅。
// 地下に人がいる鉱山は、まず地下の全員の投票 (全員一致) が必要で、通れば全員避難してから破壊する。
const BLD_KEY = "vlib:bld"; // index: [{id, ox,oy,oz, dim, w,h,d, depth, rot, customId, structId, labelJa, chunks, core?, counters?}]
const BLD_SEQ = "vlib:bldseq";
function loadBldIndex() {
    try { const s = world.getDynamicProperty(BLD_KEY); if (typeof s === "string" && s) { const v = JSON.parse(s); if (Array.isArray(v)) return v; } } catch {}
    return [];
}
function saveBldIndex(list) { try { world.setDynamicProperty(BLD_KEY, JSON.stringify(list)); } catch {} }
function permToData(perm) {
    let states = {};
    try { states = perm.getAllStates ? perm.getAllStates() : (perm.states || {}); } catch {}
    return [perm.typeId, states];
}
function dataToPerm(d) {
    if (!d) return null;
    try { return BlockPermutation.resolve(d[0], d[1]); } catch { try { return BlockPermutation.resolve(d[0]); } catch { return null; } }
}
// ---- 窓口 = 建物コア (v053) ----
// 設置後の走査で、鉄ブロックかワックス済み看板を「窓口」として検知し、建物レコードに
// core (代表セル) と counters (窓口セル全部) を記録する。窓口が実質的な建物コアで、
// BMH/RVB が建物を検知して扱うときの核になる想定。タップすると生産物を表示する (モック)。
// 鉱山と港は専用の窓口 (入口パッチ / 鉄コンテナ) が既にあるので対象外。
const PRODUCES_CUSTOM = {
    "custom:woodshop": { ja: "原木・板材・棒・苗木", en: "Logs, planks, sticks, saplings" },
    "custom:warehouse": { ja: "汎用 (植物系・鉱物系以外の資源)", en: "General purpose (all but plant/mineral resources)" },
    "custom:greenhouse": { ja: "農作物・種・花", en: "Crops, seeds, flowers" },
    "custom:mine": { ja: "鉱物 (地下で採掘)", en: "Minerals (mined underground)" },
    "custom:port": { ja: "なし (港への移動拠点)", en: "None (travel hub)" },
    "custom:bell": { ja: "なし", en: "None" },
    "custom:birch_lodge": { ja: "なし", en: "None" },
};
const PRODUCES_JOB = {
    farmer: { ja: "農作物", en: "Crops" }, fisherman: { ja: "魚介類", en: "Fish and seafood" },
    shepherd: { ja: "羊毛・畜産物", en: "Wool and animal products" }, butcher: { ja: "食肉", en: "Meat" },
    armorer: { ja: "防具", en: "Armor" }, weaponsmith: { ja: "武器", en: "Weapons" },
    toolsmith: { ja: "道具", en: "Tools" }, mason: { ja: "石材", en: "Stone materials" },
    leatherworker: { ja: "革製品", en: "Leather goods" }, fletcher: { ja: "弓・矢", en: "Bows and arrows" },
    cartographer: { ja: "地図", en: "Maps" }, librarian: { ja: "本", en: "Books" },
    cleric: { ja: "ポーションの素材", en: "Potion ingredients" },
};
const PRODUCES_NONE = { ja: "なし", en: "None" };
function producesOf(bld) {
    if (bld.customId) return PRODUCES_CUSTOM[bld.customId] || PRODUCES_NONE;
    const job = bld.structId && JOBS[bld.structId];
    return (job && PRODUCES_JOB[job]) || PRODUCES_NONE;
}
function* scanCoreGen(dim, bldId, rec, entry) {
    if (rec.customId === "custom:mine" || rec.customId === "custom:port") return;
    const signCells = new Set();
    for (const [name, x, y, z] of (entry?.extras || [])) if (name.includes("_sign")) signCells.add(`${rec.origin.x + x},${rec.origin.y + y},${rec.origin.z + z}`);
    const counters = [];
    let core = null, coreIsSign = false, sinceYield = 0;
    for (let y = rec.origin.y - (rec.depth || 0); y < rec.origin.y + rec.h; y++)
    for (let z = rec.origin.z; z < rec.origin.z + rec.d; z++)
    for (let x = rec.origin.x; x < rec.origin.x + rec.w; x++) {
        const b = getBlockSafe(dim, { x, y, z });
        if (b) {
            const isIron = b.typeId === "minecraft:iron_block";
            let isSign = false;
            if (!isIron && b.typeId.includes("sign")) {
                if (signCells.has(`${x},${y},${z}`)) isSign = true; // extras の名札看板はワックス済みで置かれる
                else { try { const sc = b.getComponent("minecraft:sign"); if (sc && sc.isWaxed) isSign = true; } catch {} }
            }
            if (isIron || isSign) {
                const rel = [x - rec.origin.x, y - rec.origin.y, z - rec.origin.z];
                if (counters.length < 64) counters.push(rel);
                if (isSign && !coreIsSign) { core = rel; coreIsSign = true; }
                else if (!core) core = rel;
            }
        }
        if (++sinceYield >= 256) { sinceYield = 0; yield; }
    }
    if (!core) return; // 窓口の無い建物はコアを持たない (ただのブロックの集まりとして扱う)
    const list = loadBldIndex();
    const recB = list.find((b) => b.id === bldId);
    if (!recB) return; // 走査の前に壊されていた
    recB.core = core; recB.counters = counters;
    saveBldIndex(list);
}
function counterAt(pos, dimId) {
    const list = loadBldIndex();
    for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        if (b.dim !== dimId || !b.counters) continue;
        for (const [dx, dy, dz] of b.counters) if (b.ox + dx === pos.x && b.oy + dy === pos.y && b.oz + dz === pos.z) return b;
    }
    return undefined;
}
async function showCoreInfo(player, bld) {
    const lang = getLang(player);
    const prod = producesOf(bld);
    const form = new MessageFormData()
        .title(buildingLabel(lang, bld.labelJa))
        .body(t(lang, STR.coreProduces, lang === "en" ? prod.en : prod.ja))
        .button1(t(lang, STR.closeLabel));
    await showForm(player, form);
}

function registerBuilding(rec) {
    const palette = [];
    const palIdx = new Map();
    const baseY = rec.origin.y - (rec.depth || 0);
    const entries = [];
    for (const e of rec.entries) {
        const d = permToData(e.perm);
        const k = JSON.stringify(d);
        let pi = palIdx.get(k);
        if (pi === undefined) { pi = palette.length; palette.push(d); palIdx.set(k, pi); }
        entries.push([e.x - rec.origin.x, e.y - baseY, e.z - rec.origin.z, pi]);
    }
    const json = JSON.stringify({ palette, entries });
    const CH = 15000;
    const chunks = Math.max(1, Math.ceil(json.length / CH));
    let seq = 0;
    try { const v = world.getDynamicProperty(BLD_SEQ); if (typeof v === "number") seq = v; } catch {}
    const id = seq + 1;
    try { world.setDynamicProperty(BLD_SEQ, id); } catch {}
    for (let i = 0; i < chunks; i++) { try { world.setDynamicProperty(`vlib:bld:${id}:${i}`, json.slice(i * CH, (i + 1) * CH)); } catch {} }
    const list = loadBldIndex().filter((b) => !(b.ox === rec.origin.x && b.oy === rec.origin.y && b.oz === rec.origin.z && b.dim === rec.dim.id));
    list.push({ id, ox: rec.origin.x, oy: rec.origin.y, oz: rec.origin.z, dim: rec.dim.id, w: rec.w, h: rec.h, d: rec.d, depth: rec.depth || 0, rot: rec.rot || 0, customId: rec.customId || null, structId: rec.structId || null, labelJa: rec.labelJa, chunks });
    saveBldIndex(list);
    return id;
}
function loadBldData(bld) {
    try {
        let json = "";
        for (let i = 0; i < (bld.chunks || 0); i++) { const s = world.getDynamicProperty(`vlib:bld:${bld.id}:${i}`); if (typeof s !== "string") return null; json += s; }
        const v = JSON.parse(json);
        if (!v || !Array.isArray(v.palette) || !Array.isArray(v.entries)) return null;
        return v;
    } catch { return null; }
}
function deleteBuildingRecord(b) {
    for (let i = 0; i < (b.chunks || 0); i++) { try { world.setDynamicProperty(`vlib:bld:${b.id}:${i}`, undefined); } catch {} }
    saveBldIndex(loadBldIndex().filter((x) => x.id !== b.id));
}
function deleteBuildingAt(origin, dimId) {
    const b = loadBldIndex().find((x) => x.ox === origin.x && x.oy === origin.y && x.oz === origin.z && x.dim === (dimId || "minecraft:overworld"));
    if (b) deleteBuildingRecord(b);
}
function buildingAt(pos, dimId) {
    // 重なった範囲では一番新しく建てた方を優先する (上に建てた建物をタップしているはず)
    const list = loadBldIndex();
    for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        if (b.dim === dimId && pos.x >= b.ox && pos.x < b.ox + b.w && pos.z >= b.oz && pos.z < b.oz + b.d && pos.y >= b.oy - (b.depth || 0) && pos.y < b.oy + b.h) return b;
    }
    return undefined;
}
// レジストリに無い建物 (v028以前に建てた分など) 向けの当たり付け:
// 鉱山と港は専用レジストリがあるので、そちらから仮レコードを作って破壊できるようにする。
function fallbackBuildingAt(pos, dimId) {
    for (const [list, customId] of [[loadMines(), "custom:mine"], [loadPorts(), "custom:port"]]) {
        const c = CUSTOM.find((x) => x.id === customId);
        if (!c) continue;
        for (const rec of list) {
            if ((rec.dim || "minecraft:overworld") !== dimId) continue;
            const [w, d] = rotDims(c.w, c.d, rec.rot || 0);
            if (pos.x >= rec.ox && pos.x < rec.ox + w && pos.z >= rec.oz && pos.z < rec.oz + d && pos.y >= rec.oy - (c.depth || 0) && pos.y < rec.oy + c.h) {
                return { id: -1, ox: rec.ox, oy: rec.oy, oz: rec.oz, dim: rec.dim || "minecraft:overworld", w, h: c.h, d, depth: c.depth || 0, rot: rec.rot || 0, customId, labelJa: c.name || customId, chunks: 0 };
            }
        }
    }
    return undefined;
}

// ---- 撤去の共通処理 (v045): メイス破壊とアンドゥで使う ----
// 落下するブロック (金床・砂・砂利など)。下の支えを先に消すと落下して撤去をすり抜けるので、先に消す。
function isFallingBlockName(n) {
    return n === "minecraft:anvil" || n === "minecraft:chipped_anvil" || n === "minecraft:damaged_anvil"
        || n === "minecraft:sand" || n === "minecraft:red_sand" || n === "minecraft:gravel"
        || n === "minecraft:suspicious_sand" || n === "minecraft:suspicious_gravel"
        || n === "minecraft:dragon_egg" || n.endsWith("_concrete_powder");
}
function permIsDeferred(perm) {
    try {
        const id = perm.type ? perm.type.id : perm.typeId;
        return isDeferredBlock(id, id.includes("torch") ? perm.getAllStates() : undefined);
    } catch { return false; }
}
// 範囲内に落ちたアイテムと落下中ブロックを消す。数を返す。
function sweepDrops(dim, ox, oz, w, d, yMin, yMax) {
    let n = 0;
    try {
        const center = { x: ox + w / 2, y: (yMin + yMax) / 2, z: oz + d / 2 };
        const r = Math.hypot(w, d, yMax - yMin) / 2 + 6;
        for (const e of dim.getEntities({ location: center, maxDistance: r })) {
            if (e.typeId !== "minecraft:item" && e.typeId !== "minecraft:falling_block") continue;
            const l = e.location;
            if (l.x < ox - 3 || l.x >= ox + w + 3 || l.z < oz - 3 || l.z >= oz + d + 3) continue;
            if (l.y < yMin - 2 || l.y > yMax + 2) continue;
            try { e.remove(); n++; } catch {}
        }
    } catch {}
    return n;
}
// cells: [{x,y,z,perm}] (絶対座標、復元後の姿)。box: 片付け範囲 {ox,oz,w,d,yMin,yMax}。完了で onDone(片付けた数)。
//   パス0 (上の段から): 水没を外し、落下ブロックと付着ブロック (松明・ランタン・ドア等) を先に消す
//   パス1 (下の段から): 付着しないブロックを復元
//   パス2 (下の段から): 付着ブロックを復元 (支えが先)
//   最後に落ちたアイテム・落下中ブロックを片付ける
function startDemolish(dim, cells, box, onDone) {
    const down = cells.slice().sort((a, b) => b.y - a.y);
    const up = cells.slice().sort((a, b) => a.y - b.y);
    const late = [];
    let phase = 0, idx = 0;
    const runId = system.runInterval(() => {
        if (phase === 0) {
            const end = Math.min(idx + CELLS_PER_TICK * 2, down.length);
            for (; idx < end; idx++) {
                const c = down[idx];
                const b = getBlockSafe(dim, c);
                if (!b) continue;
                let wasWet = false;
                try { if (b.isWaterlogged) wasWet = true; b.setWaterlogged(false); } catch {}
                try {
                    const id = b.typeId;
                    if (wasWet || /_(slab|stairs|trapdoor)$/.test(id)) { // v047: 液体レイヤーごと消す (復元は次のフェーズ)
                        try { dim.runCommand(`setblock ${c.x} ${c.y} ${c.z} air`); } catch {}
                        continue;
                    }
                    if (id === "minecraft:air") continue;
                    const st = id.includes("torch") ? b.permutation.getAllStates() : undefined;
                    if (isFallingBlockName(id) || isDeferredBlock(id, st)) b.setType("minecraft:air");
                } catch {}
            }
            if (idx >= down.length) { phase = 1; idx = 0; }
        } else if (phase === 1) {
            const end = Math.min(idx + CELLS_PER_TICK, up.length);
            for (; idx < end; idx++) {
                const c = up[idx];
                if (!c.perm) continue;
                if (permIsDeferred(c.perm)) { late.push(c); continue; }
                const b = getBlockSafe(dim, c);
                if (b) { try { b.setPermutation(c.perm); } catch {} }
            }
            if (idx >= up.length) { phase = 2; idx = 0; }
        } else {
            const end = Math.min(idx + CELLS_PER_TICK, late.length);
            for (; idx < end; idx++) {
                const c = late[idx];
                const b = getBlockSafe(dim, c);
                if (b) { try { b.setPermutation(c.perm); } catch {} }
            }
            if (idx >= late.length) {
                system.clearRun(runId);
                // 付着が外れたアイテムが落ちて落ち着くのを少し待ってから片付ける
                system.runTimeout(() => {
                    let n = sweepDrops(dim, box.ox, box.oz, box.w, box.d, box.yMin, box.yMax);
                    system.runTimeout(() => { n += sweepDrops(dim, box.ox, box.oz, box.w, box.d, box.yMin, box.yMax); onDone(n); }, 20);
                }, 10);
            }
        }
    }, 1);
}

// ---- 更地にする (v046): メイス破壊 ----
// 建物の範囲 (地下の段 + 建物 + 上の CLEAR_UP 段) を上の段から空にする。地下の段 (depth) は穴にせず、
// 範囲の外側の同じ高さにある地面と同じブロックで埋める。水没は外し、最後に落ちたアイテムを片付ける。
function sampleGround(dim, bld, y) {
    const mx = bld.ox + (bld.w >> 1), mz = bld.oz + (bld.d >> 1);
    const pts = [[bld.ox - 1, bld.oz - 1], [bld.ox + bld.w, bld.oz - 1], [bld.ox - 1, bld.oz + bld.d], [bld.ox + bld.w, bld.oz + bld.d],
        [bld.ox - 1, mz], [bld.ox + bld.w, mz], [mx, bld.oz - 1], [mx, bld.oz + bld.d]];
    for (const [x, z] of pts) {
        const b = getBlockSafe(dim, { x, y, z });
        if (b && b.typeId !== "minecraft:air") { try { return b.permutation; } catch {} }
    }
    return BlockPermutation.resolve("minecraft:dirt");
}
// v050: 先に範囲全体の水没と水ブロックをすべて外して「水浸し」を解除してから、更地にする。
// 水が残ったまま上から消していくと、残った水没ブロックの水が、消したあとの空きセルへ流れ込み直していたため。
// 範囲の全セルを2回 (間に少し待つ) 乾かす: 1回目で水源を止め、2回目で流れ直した分を拾う。
function startDrain(dim, box, waterMinY, onDone) { // box: {ox,oz,w,d,yMin,yMax}。waterMinY 以上の水ブロックは空気に、水没はすべて外す
    const bld = { ox: box.ox, oz: box.oz, w: box.w, d: box.d, oy: waterMinY };
    const baseY = box.yMin;
    const yHi = box.yMax;
    const per = bld.w * bld.d;
    const pass = (next) => {
        let y = baseY, idx = 0, dried = 0;
        const id = system.runInterval(() => {
            let budget = CELLS_PER_TICK * 4;
            while (budget > 0 && y <= yHi) {
                const n = Math.min(budget, per - idx);
                for (let i = 0; i < n; i++) {
                    const k = idx + i;
                    const b = getBlockSafe(dim, { x: bld.ox + (k % bld.w), y, z: bld.oz + Math.floor(k / bld.w) });
                    if (!b) continue;
                    try {
                        const t = b.typeId;
                        if (t === "minecraft:air") continue;
                        if (t === "minecraft:water" || t === "minecraft:flowing_water") { if (y >= bld.oy) { b.setType("minecraft:air"); dried++; } continue; }
                        b.setWaterlogged(false); dried++;
                    } catch {}
                }
                idx += n; budget -= n;
                if (idx >= per) { idx = 0; y++; }
            }
            if (y > yHi) { system.clearRun(id); next(dried); }
        }, 1);
    };
    pass(() => system.runTimeout(() => pass((d) => { console.warn("[VillageLibrary] drain done (2nd pass cells " + d + ")"); onDone(); }), 20));
}
function startClearArea(dim, bld, onDone) {
    startDrain(dim, { ox: bld.ox, oz: bld.oz, w: bld.w, d: bld.d, yMin: bld.oy - (bld.depth || 0), yMax: bld.oy + bld.h - 1 + CLEAR_UP }, bld.oy,
        () => startClearAreaMain(dim, bld, onDone));
}
function startClearAreaMain(dim, bld, onDone) {
    const baseY = bld.oy - (bld.depth || 0);
    const yHi = bld.oy + bld.h - 1 + CLEAR_UP;
    const per = bld.w * bld.d;
    let y = yHi, idx = 0, ground = null;
    const runId = system.runInterval(() => {
        let budget = CELLS_PER_TICK * 2;
        while (budget > 0 && y >= baseY) {
            if (idx === 0 && y < bld.oy) ground = sampleGround(dim, bld, y);
            const n = Math.min(budget, per - idx);
            for (let i = 0; i < n; i++) {
                const k = idx + i;
                const b = getBlockSafe(dim, { x: bld.ox + (k % bld.w), y, z: bld.oz + Math.floor(k / bld.w) });
                if (!b) continue;
                try {
                    if (y >= bld.oy) {
                        if (b.typeId === "minecraft:air") continue;
                        try { if (b.isWaterlogged) b.setWaterlogged(false); } catch {}
                        b.setType("minecraft:air");
                    } else {
                        try { if (b.isWaterlogged) b.setWaterlogged(false); } catch {}
                        b.setPermutation(ground);
                    }
                } catch {}
            }
            idx += n; budget -= n;
            if (idx >= per) {
                // v047: setType(air) は水没の水 (液体レイヤー) を残すことがある (空中に水源が浮く)。
                // 上の段 (y >= oy) は、段ごとに fill air で液体ごと消す。
                if (y >= bld.oy) {
                    try { dim.runCommand(`fill ${bld.ox} ${y} ${bld.oz} ${bld.ox + bld.w - 1} ${y} ${bld.oz + bld.d - 1} air`); }
                    catch (e) { console.warn("[VillageLibrary] clear fill air y=" + y + ": " + e); }
                }
                idx = 0; y--;
            }
        }
        if (y < baseY) {
            system.clearRun(runId);
            const box = { ox: bld.ox, oz: bld.oz, w: bld.w, d: bld.d, yMin: baseY, yMax: yHi };
            // v047: 空気になったセルに液体だけ残っていたら、一度固体にして液体を消してから空気に戻す
            let sy = bld.oy, sidx = 0, swept = 0;
            const sweepId = system.runInterval(() => {
                let budget = CELLS_PER_TICK * 4;
                while (budget > 0 && sy <= yHi) {
                    const n = Math.min(budget, per - sidx);
                    for (let i = 0; i < n; i++) {
                        const k = sidx + i;
                        const b = getBlockSafe(dim, { x: bld.ox + (k % bld.w), y: sy, z: bld.oz + Math.floor(k / bld.w) });
                        if (!b) continue;
                        try {
                            const id = b.typeId;
                            if (id === "minecraft:air" || id === "minecraft:water" || id === "minecraft:flowing_water" || b.isLiquid) {
                                // 液体レイヤーの水は空気に見えて検出できないことがある。水没できるブロックを一度置き、
                                // setWaterlogged(false) (水没を外す公式の操作) で液体ごと消してから空気に戻す
                                b.setType("minecraft:polished_andesite_slab");
                                try { b.setWaterlogged(false); } catch {}
                                b.setType("minecraft:air"); swept++;
                            }
                        } catch {}
                    }
                    sidx += n; budget -= n;
                    if (sidx >= per) { sidx = 0; sy++; }
                }
                if (sy > yHi) { system.clearRun(sweepId); console.warn("[VillageLibrary] liquid sweep cells: " + swept); }
            }, 1);
            system.runTimeout(() => {
                let cleaned = sweepDrops(dim, box.ox, box.oz, box.w, box.d, box.yMin, box.yMax);
                system.runTimeout(() => { cleaned += sweepDrops(dim, box.ox, box.oz, box.w, box.d, box.yMin, box.yMax); onDone(cleaned); }, 20);
            }, 10);
        }
    }, 1);
}

function destroyBuilding(player, bld) {
    const lang = getLang(player);
    const msg = (s) => { try { player.sendMessage(s); } catch {} };
    let dim;
    try { dim = world.getDimension(bld.dim); } catch { return; }
    const baseY = bld.oy - (bld.depth || 0);
    // 建物を登録から外す。更地にするので、範囲が重なる古い建物の記録も一緒に消す (v046)
    const retire = (o) => {
        if (o.customId) {
            try { removeCustomEntities({ customId: o.customId, origin: { x: o.ox, y: o.oy, z: o.oz }, w: o.w, h: o.h, d: o.d, dim }); } catch {}
        }
        if (o.customId === "custom:mine") {
            const mine = findMine(o.ox, o.oy, o.oz);
            if (mine) { for (const run of runsForMine(mine)) annihilateRun(run); }
            try { unregisterMine({ x: o.ox, y: o.oy, z: o.oz }, o.dim); } catch {}
        }
        if (o.customId === "custom:port") { try { unregisterPort({ x: o.ox, y: o.oy, z: o.oz }, o.dim); } catch {} }
        deleteBuildingRecord(o);
    };
    const overlaps = loadBldIndex().filter((o) => o.id !== bld.id && o.dim === bld.dim
        && o.ox < bld.ox + bld.w && o.ox + o.w > bld.ox && o.oz < bld.oz + bld.d && o.oz + o.d > bld.oz
        && o.oy + o.h > baseY && o.oy - (o.depth || 0) < bld.oy + bld.h);
    for (const o of overlaps) retire(o);
    retire(bld);
    for (const [pid, rec] of [...undoByPlayer]) {
        if (!rec.dim || rec.dim.id !== bld.dim) continue;
        if (rec.origin.x < bld.ox + bld.w && rec.origin.x + rec.w > bld.ox && rec.origin.z < bld.oz + bld.d && rec.origin.z + rec.d > bld.oz) undoByPlayer.delete(pid);
    }
    const yTop = bld.oy + bld.h - 1;
    // 範囲が読み込まれていないと撤去が飛ぶので、アンドゥと同じくティッキングエリアを張ってから始める
    const area = setupArea(dim, player, { x: bld.ox, y: baseY, z: bld.oz }, { x: bld.ox + bld.w - 1, y: yTop, z: bld.oz + bld.d - 1 });
    system.runTimeout(() => {
        startClearArea(dim, bld, (cleaned) => {
            clearArea(dim, area);
            msg("§a[Village Library]§r " + t(lang, STR.destroyDone, buildingLabel(lang, bld.labelJa)));
            if (cleaned > 0) msg("§7[Village Library]§r " + t(lang, STR.cleaned, cleaned));
        });
    }, area ? 20 : 1);
}

async function maceFlow(player, bld) {
    const lang = getLang(player);
    const msg = (s) => { try { player.sendMessage(s); } catch {} };
    const label = buildingLabel(lang, bld.labelJa);
    const ok = await askYesNo(player, t(lang, STR.destroyTitle), t(lang, STR.destroyConfirm, label));
    if (ok !== true) return;
    if (bld.customId === "custom:mine") {
        const mine = findMine(bld.ox, bld.oy, bld.oz);
        if (mine) {
            if (preps.has(mineKeyOf(mine))) { msg("§c[Village Library]§r " + t(lang, STR.destroyBusy)); return; }
            const runs = runsForMine(mine);
            if (runs.some((r) => hasPendingForRun(r))) { msg("§c[Village Library]§r " + t(lang, STR.destroyBusy)); return; }
            const occMap = new Map();
            for (const r of runs) for (const p of occupantsOf(r)) occMap.set(p.id, p);
            const occupants = [...occMap.values()];
            if (occupants.length) {
                const answers = new Map();
                await new Promise((resolve) => {
                    let settled = false;
                    const finish = () => { if (!settled) { settled = true; resolve(); } };
                    system.runTimeout(finish, 300);
                    for (const p of occupants) {
                        askYesNo(p, t(getLang(p), STR.destroyTitle), t(getLang(p), STR.destroyVoteBody, label)).then((ans) => {
                            if (ans !== undefined) answers.set(p.id, ans);
                            if (occupants.every((q) => answers.has(q.id))) finish();
                        }).catch(() => {});
                    }
                });
                const passed = occupants.every((p) => answers.get(p.id) === true);
                if (!passed) { msg("§c[Village Library]§r " + t(lang, STR.destroyVetoed)); return; }
                for (const p of occupants) { try { p.sendMessage("§b[Village Library]§r " + t(getLang(p), STR.destroyEvac)); } catch {} }
                for (const p of occupants) warpUp(p, mine);
            }
        }
    }
    destroyBuilding(player, bld);
}

// メイスで建物をタップすると破壊フロー (ブラシのアンドゥとは別の、完全な削除)
world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    try {
        if (!ev.isFirstEvent) return;
        const { player, block, itemStack } = ev;
        if (!itemStack || itemStack.typeId !== "minecraft:mace") return;
        if (!block) return;
        const bld = buildingAt(block.location, block.dimension?.id) || fallbackBuildingAt(block.location, block.dimension?.id);
        if (!bld) {
            // 無言で終わると実機で切り分けできないので、見つからない時も知らせる
            system.run(() => { try { player.sendMessage("§e[Village Library]§r " + t(getLang(player), STR.maceNotFound)); } catch {} });
            return;
        }
        ev.cancel = true;
        system.run(() => { maceFlow(player, bld).catch((e) => console.warn("[VillageLibrary] mace: " + e)); });
    } catch (e) { console.warn("[VillageLibrary] " + e); }
});

// 窓口 (建物コア) のタップ: 生産物の表示だけ (v053 モック)
world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    try {
        if (!ev.isFirstEvent || ev.cancel) return;
        const { player, block, itemStack } = ev;
        if (!block) return;
        if (itemStack && itemStack.typeId === "minecraft:mace") return; // 破壊はメイス側の購読が処理する
        const bld = counterAt(block.location, block.dimension?.id);
        if (!bld) return;
        ev.cancel = true;
        system.run(() => { showCoreInfo(player, bld).catch((e) => console.warn("[VillageLibrary] core info: " + e)); });
    } catch (e) { console.warn("[VillageLibrary] " + e); }
});

async function openFacilityMenu(player, origin, dim, biome) {
    const lang = getLang(player);
    const label = BIOMES.find((b) => b[0] === biome)[1];
    const list = BUILDINGS[biome];
    const jobs = list.filter((it) => JOBS[it[0]]);
    const others = list.filter((it) => !JOBS[it[0]]);
    const title = `[${biomeLabel(lang, biome, label)}]`;
    const form = new ActionFormData().title(title).body(t(lang, STR.selectCategory));
    form.button(t(lang, STR.back));
    form.button(t(lang, STR.byJob, jobs.length));
    form.button(t(lang, STR.otherCat, others.length));
    const res = await showForm(player, form);
    if (!res || res.canceled) return;
    if (res.selection === 0) { await openBiomeMenu(player, origin, dim); return; }
    if (res.selection === 1) { await openJobMenu(player, origin, dim, biome, jobs); return; }
    if (res.selection === 2) {
        await openBuildingList(player, origin, dim, title + " " + t(lang, STR.otherCat, others.length), others,
            () => openFacilityMenu(player, origin, dim, biome));
    }
}

// 職業別: 職業ブロックを持つ施設を職業ごとにまとめて表示する
async function openJobMenu(player, origin, dim, biome, jobs) {
    const lang = getLang(player);
    const label = BIOMES.find((b) => b[0] === biome)[1];
    const groups = JOB_LIST.map((j) => ({ j, items: jobs.filter((it) => JOBS[it[0]] === j[0]) })).filter((g) => g.items.length > 0);
    const title = `[${biomeLabel(lang, biome, label)}] ${t(lang, STR.byJob, jobs.length)}`;
    const form = new ActionFormData().title(title).body(t(lang, STR.selectJob));
    form.button(t(lang, STR.back));
    for (const { j, items } of groups) {
        form.button(lang === "en" ? `${j[2]} (${j[4]}) x${items.length}` : `${j[1]}(${j[3]}) x${items.length}`);
    }
    const res = await showForm(player, form);
    if (!res || res.canceled) return;
    if (res.selection === 0) { await openFacilityMenu(player, origin, dim, biome); return; }
    const g = groups[res.selection - 1];
    if (!g) return;
    const gname = lang === "en" ? g.j[2] : g.j[1];
    await openBuildingList(player, origin, dim, `${gname} - ${biomeLabel(lang, biome, label)}`, g.items,
        () => openJobMenu(player, origin, dim, biome, jobs));
}

// 施設の一覧(番号 名前 横x奥行き)。選ぶと建設開始、[戻る]で onBack。
async function openBuildingList(player, origin, dim, title, items, onBack) {
    const lang = getLang(player);
    const form = new ActionFormData().title(title).body(t(lang, STR.selectFacility));
    form.button(t(lang, STR.back));
    for (const [, no, name, w, , d] of items) form.button(`${no} ${buildingLabel(lang, name)} ${w}x${d}`);
    const res = await showForm(player, form);
    if (!res || res.canceled) return;
    if (res.selection === 0) { await onBack(); return; }
    const item = items[res.selection - 1];
    if (!item) return;
    await openDirectionForm(player, dim, origin, item, onBack);
}

// アンドゥ実行: 記録した permutation を分割して書き戻す (Wool Printer方式)
function startUndo(player) {
    const lang = getLang(player);
    const msg = (m) => { try { player.sendMessage(m); } catch {} };
    if (busy.size > 0) { msg("§c[Village Library]§r " + t(lang, STR.undoWait)); return; }
    const rec = undoByPlayer.get(player.id);
    if (!rec || rec.entries.length === 0) { msg("§c[Village Library]§r " + t(lang, STR.undoNone)); return; }
    // v052: 二次派生 (地下・登録) を持つ建物はブラシで戻さない。メイスの破壊フローには確認と退避と後片付けがある。記録は残す。
    if (rec.customId === "custom:mine" || rec.customId === "custom:port") { msg("§e[Village Library]§r " + t(lang, STR.undoUseMace, buildingLabel(lang, rec.labelJa))); return; }
    undoByPlayer.delete(player.id);
    const dim = rec.dim;
    const list = rec.entries;
    const maxP = { x: rec.origin.x + rec.w - 1, y: rec.origin.y + rec.h - 1, z: rec.origin.z + rec.d - 1 };
    const area = setupArea(dim, player, { x: rec.origin.x, y: rec.origin.y - (rec.depth || 0), z: rec.origin.z }, maxP);
    system.runTimeout(() => {
        if (rec.customId) removeCustomEntities(rec);
        if (rec.customId === "custom:mine") { try { unregisterMine(rec.origin, rec.dim?.id); } catch {} }
        if (rec.customId === "custom:port") { try { unregisterPort(rec.origin, rec.dim?.id); } catch {} }
        try { deleteBuildingAt(rec.origin, rec.dim?.id); } catch {}
        const box = { ox: rec.origin.x, oz: rec.origin.z, w: rec.w, d: rec.d, yMin: rec.origin.y - (rec.depth || 0), yMax: rec.origin.y + rec.h - 1 + CLEAR_UP };
        // v051: ブラシのアンドゥも、先に建物の範囲 (建物の高さまで) の水没と水を全部外して乾かしてから復元する (メイスと同じ方式)
        const drainBox = { ox: box.ox, oz: box.oz, w: box.w, d: box.d, yMin: box.yMin, yMax: rec.origin.y + rec.h - 1 };
        startDrain(dim, drainBox, rec.origin.y, () => startDemolish(dim, list, box, (cleaned) => {
            clearArea(dim, area);
            msg("§a[Village Library]§r " + t(lang, STR.undoDone, buildingLabel(lang, rec.labelJa)));
            if (cleaned > 0) msg("§7[Village Library]§r " + t(lang, STR.cleaned, cleaned));
        }));
    }, area ? 20 : 1);
}

// ---- 整地 (v055): 40x40x40 を全部空気にして、底は土か石に揃える ----
// 建物メニューから選べる (骨ブロックが北西の角、骨の高さが地面)。範囲で得られた
// 鉱石・原木など取引所で扱われるものは、近くのチェスト (無ければ角に置く) へ回収する。
// 本番 (BMH) ではお金を払って時間を買う作業になる想定。ライブラリでは無料のモック。
const GRADE_SIZE = 40;
const HARVEST = {
    "minecraft:coal_ore": ["minecraft:coal", 1], "minecraft:deepslate_coal_ore": ["minecraft:coal", 1],
    "minecraft:iron_ore": ["minecraft:raw_iron", 1], "minecraft:deepslate_iron_ore": ["minecraft:raw_iron", 1],
    "minecraft:gold_ore": ["minecraft:raw_gold", 1], "minecraft:deepslate_gold_ore": ["minecraft:raw_gold", 1],
    "minecraft:nether_gold_ore": ["minecraft:gold_nugget", 2],
    "minecraft:copper_ore": ["minecraft:raw_copper", 2], "minecraft:deepslate_copper_ore": ["minecraft:raw_copper", 2],
    "minecraft:diamond_ore": ["minecraft:diamond", 1], "minecraft:deepslate_diamond_ore": ["minecraft:diamond", 1],
    "minecraft:emerald_ore": ["minecraft:emerald", 1], "minecraft:deepslate_emerald_ore": ["minecraft:emerald", 1],
    "minecraft:lapis_ore": ["minecraft:lapis_lazuli", 4], "minecraft:deepslate_lapis_ore": ["minecraft:lapis_lazuli", 4],
    "minecraft:redstone_ore": ["minecraft:redstone", 4], "minecraft:deepslate_redstone_ore": ["minecraft:redstone", 4],
    "minecraft:nether_quartz_ore": ["minecraft:quartz", 1],
    "minecraft:ancient_debris": ["minecraft:ancient_debris", 1],
};
function harvestOf(typeId) {
    const h = HARVEST[typeId];
    if (h) return h;
    if (/_(log|wood|stem|hyphae)$/.test(typeId)) return [typeId, 1]; // 原木類はそのまま
    return null;
}
const ITEM_NAME_JA = {
    "minecraft:coal": "石炭", "minecraft:raw_iron": "鉄原石", "minecraft:raw_gold": "金原石",
    "minecraft:gold_nugget": "金塊", "minecraft:raw_copper": "銅原石", "minecraft:diamond": "ダイヤモンド",
    "minecraft:emerald": "エメラルド", "minecraft:lapis_lazuli": "ラピスラズリ", "minecraft:redstone": "レッドストーン",
    "minecraft:quartz": "ネザークォーツ", "minecraft:ancient_debris": "古代の残骸",
};
const DIRT_FAMILY = new Set(["minecraft:grass_block", "minecraft:dirt", "minecraft:coarse_dirt", "minecraft:podzol", "minecraft:mycelium", "minecraft:rooted_dirt", "minecraft:mud"]);
// 整地範囲と重なる登録済み建物は、先に登録だけ畳む (実体は整地が消す)。鉱山のランは消滅させる。
function retireOverlaps(dim, ox, oz, yMin, yMax) {
    const overlaps = loadBldIndex().filter((o) => o.dim === dim.id
        && o.ox < ox + GRADE_SIZE && o.ox + o.w > ox && o.oz < oz + GRADE_SIZE && o.oz + o.d > oz
        && o.oy + o.h > yMin && o.oy - (o.depth || 0) < yMax);
    for (const o of overlaps) {
        if (o.customId) { try { removeCustomEntities({ customId: o.customId, origin: { x: o.ox, y: o.oy, z: o.oz }, w: o.w, h: o.h, d: o.d, dim }); } catch {} }
        if (o.customId === "custom:mine") {
            const mine = findMine(o.ox, o.oy, o.oz);
            if (mine) { for (const run of runsForMine(mine)) annihilateRun(run); }
            try { unregisterMine({ x: o.ox, y: o.oy, z: o.oz }, o.dim); } catch {}
        }
        if (o.customId === "custom:port") { try { unregisterPort({ x: o.ox, y: o.oy, z: o.oz }, o.dim); } catch {} }
        deleteBuildingRecord(o);
    }
    return overlaps.length;
}
function startGrading(player, dim, origin) {
    const lang = getLang(player);
    const msg = (m) => { try { player.sendMessage(m); } catch {} };
    const bone = getBlockSafe(dim, origin);
    if (!bone || bone.typeId !== "minecraft:bone_block") { msg("§c[Village Library]§r " + t(lang, STR.noBone)); return; }
    const key = `${dim.id}:${origin.x},${origin.y},${origin.z}`;
    if (busy.has(key)) { msg("§c[Village Library]§r " + t(lang, STR.busy)); return; }
    busy.add(key);
    const release = () => busy.delete(key);
    const ox = origin.x, oz = origin.z, floorY = origin.y - 1, topY = origin.y + GRADE_SIZE - 1;
    const rec = { dim, origin: { x: ox, y: floorY, z: oz }, w: GRADE_SIZE, h: GRADE_SIZE + 1, d: GRADE_SIZE, labelJa: "整地", depth: 0, rot: 0, entries: [], customId: undefined, structId: undefined };
    const tally = new Map();
    const addTally = (typeId) => { const h = harvestOf(typeId); if (h) tally.set(h[0], (tally.get(h[0]) || 0) + h[1]); };
    let chestBlock = null;
    const state = { finished: false, error: null };
    const prog = { done: 0, total: 65600 + 15000 + 64000 + 1600 + 64000 };
    function* gradeGen() {
        try {
            retireOverlaps(dim, ox, oz, floorY, topY + 1);
            // 0) 記録: 変わるセルだけ記録する (アンドゥ用)
            for (let y = floorY; y <= topY; y++) for (let z = oz; z < oz + GRADE_SIZE; z++) for (let x = ox; x < ox + GRADE_SIZE; x++) {
                const b = getBlockSafe(dim, { x, y, z });
                if (b) {
                    const id = b.typeId;
                    const changes = y === floorY ? !(id === "minecraft:dirt" || id === "minecraft:stone" || id === "minecraft:bedrock") : id !== "minecraft:air";
                    if (changes) { try { rec.entries.push({ x, y, z, perm: b.permutation }); } catch {} }
                }
                if (++prog.done % 1024 === 0) yield;
            }
            // 範囲内の人・モブを外へ寄せる (落下防止)
            try {
                const center = { x: ox + 20, y: origin.y + 4, z: oz + 20 };
                for (const e of dim.getEntities({ location: center, maxDistance: 34 })) {
                    if (e.typeId === "minecraft:item") continue;
                    const l = e.location;
                    if (l.x < ox || l.x >= ox + GRADE_SIZE || l.z < oz || l.z >= oz + GRADE_SIZE || l.y < floorY || l.y > topY + 2) continue;
                    const rx = l.x - ox, rz = l.z - oz;
                    const to = { x: l.x, y: origin.y + 1, z: l.z };
                    if (Math.min(rx, GRADE_SIZE - rx) < Math.min(rz, GRADE_SIZE - rz)) to.x = ox + (rx < 20 ? -1.5 : GRADE_SIZE + 1.5);
                    else to.z = oz + (rz < 20 ? -1.5 : GRADE_SIZE + 1.5);
                    try { e.teleport(to); } catch {}
                }
            } catch {}
            // 1) 回収先チェスト探し: 範囲の外 8 マスまで、地面付近の高さだけ
            let bestD = Infinity;
            for (let y = floorY; y <= origin.y + 8; y++) for (let z = oz - 8; z < oz + GRADE_SIZE + 8; z++) for (let x = ox - 8; x < ox + GRADE_SIZE + 8; x++) {
                if (x >= ox && x < ox + GRADE_SIZE && z >= oz && z < oz + GRADE_SIZE) continue;
                const b = getBlockSafe(dim, { x, y, z });
                if (b && (b.typeId === "minecraft:chest" || b.typeId === "minecraft:trapped_chest")) {
                    const dd = (x - ox - 20) ** 2 + (z - oz - 20) ** 2;
                    if (dd < bestD) { bestD = dd; chestBlock = b; }
                }
                if (++prog.done % 1024 === 0) yield;
            }
            // 2) 空にする (上の段から)。岩盤は消さない。鉱石・原木は数える
            for (let y = topY; y >= origin.y; y--) for (let z = oz; z < oz + GRADE_SIZE; z++) for (let x = ox; x < ox + GRADE_SIZE; x++) {
                const b = getBlockSafe(dim, { x, y, z });
                if (b && b.typeId !== "minecraft:air" && b.typeId !== "minecraft:bedrock") { addTally(b.typeId); try { b.setType("minecraft:air"); } catch {} }
                if (++prog.done % 1024 === 0) yield;
            }
            // 3) 底: 土系は土に均し、石は石のまま、それ以外は土に置き換える
            for (let z = oz; z < oz + GRADE_SIZE; z++) for (let x = ox; x < ox + GRADE_SIZE; x++) {
                const b = getBlockSafe(dim, { x, y: floorY, z });
                if (b) {
                    const id = b.typeId;
                    if (id === "minecraft:stone" || id === "minecraft:bedrock" || id === "minecraft:dirt") { /* そのまま */ }
                    else if (DIRT_FAMILY.has(id)) { try { b.setType("minecraft:dirt"); } catch {} }
                    else { addTally(id); try { b.setType("minecraft:dirt"); } catch {} }
                }
                if (++prog.done % 1024 === 0) yield;
            }
            // 4) 流れ込んだ液体の掃除
            for (let y = origin.y; y <= topY; y++) for (let z = oz; z < oz + GRADE_SIZE; z++) for (let x = ox; x < ox + GRADE_SIZE; x++) {
                const b = getBlockSafe(dim, { x, y, z });
                if (b && (b.typeId === "minecraft:water" || b.typeId === "minecraft:flowing_water" || b.typeId === "minecraft:lava" || b.typeId === "minecraft:flowing_lava")) { try { b.setType("minecraft:air"); } catch {} }
                if (++prog.done % 1024 === 0) yield;
            }
            state.finished = true;
        } catch (e) { state.error = e; }
    }
    const finish = () => {
        // 回収物をチェストへ (無ければ北西の角に置く)。入り切らない分はその場に落とす
        let target = chestBlock;
        if (!target) {
            const corner = getBlockSafe(dim, { x: ox, y: origin.y, z: oz });
            if (corner) { try { corner.setType("minecraft:chest"); } catch {} }
            target = getBlockSafe(dim, { x: ox, y: origin.y, z: oz });
        }
        const left = new Map(tally);
        try {
            const container = target?.getComponent("minecraft:inventory")?.container;
            if (container) {
                for (const [item, total] of [...left]) {
                    let n = total;
                    while (n > 0) {
                        const want = Math.min(64, n);
                        let placed = 0;
                        try { const r = container.addItem(new ItemStack(item, want)); placed = want - (r ? r.amount : 0); } catch {}
                        n -= placed;
                        if (placed === 0 || (placed < want && n > 0)) break;
                    }
                    if (n > 0) left.set(item, n); else left.delete(item);
                }
            }
        } catch {}
        if (target) {
            const at = { x: target.location.x + 0.5, y: target.location.y + 0.5, z: target.location.z + 0.5 };
            for (const [item, total] of left) {
                let n = total;
                while (n > 0) { const c = Math.min(64, n); try { dim.spawnItem(new ItemStack(item, c), at); } catch {} n -= c; }
            }
        }
        undoByPlayer.set(player.id, rec);
        msg("§a[Village Library]§r " + t(lang, STR.graded));
        if (tally.size > 0) {
            let logs = 0; const parts = [];
            for (const [item, n] of tally) {
                if (/_(log|wood|stem|hyphae)$/.test(item)) { logs += n; continue; }
                parts.push(`${lang === "en" ? item.replace("minecraft:", "") : (ITEM_NAME_JA[item] || item.replace("minecraft:", ""))} x${n}`);
            }
            if (logs > 0) parts.unshift(`${lang === "en" ? "Logs" : "原木"} x${logs}`);
            msg("§7[Village Library]§r " + t(lang, STR.harvestNote, parts.slice(0, 6).join(lang === "en" ? ", " : "、") + (parts.length > 6 ? " …" : "")));
        }
        release();
    };
    const area = setupArea(dim, player, { x: ox, y: floorY, z: oz }, { x: ox + GRADE_SIZE - 1, y: topY, z: oz + GRADE_SIZE - 1 });
    const ticker = system.runInterval(() => {
        if (state.error) {
            system.clearRun(ticker);
            try { player.onScreenDisplay.setActionBar(""); } catch {}
            msg("§c[Village Library]§r " + t(lang, STR.loadFailed, state.error));
            clearArea(dim, area);
            release();
            return;
        }
        if (!state.finished) {
            const pct = Math.max(0, Math.min(100, Math.floor(prog.done * 100 / prog.total)));
            try { player.onScreenDisplay.setActionBar("§e" + t(lang, STR.gradingBar, gauge(pct), pct)); } catch {}
            return;
        }
        system.clearRun(ticker);
        try { player.onScreenDisplay.setActionBar(""); } catch {}
        try { finish(); } catch (e) { console.warn("[VillageLibrary] grading finish: " + e); release(); }
        clearArea(dim, area);
    }, 10);
    system.runTimeout(() => { system.runJob(gradeGen()); }, area ? 20 : 1);
}

function startBuild(player, dim, origin, item, rot = 0) {
    const [id, , name, bw, h, bd] = item;
    const [w, d] = rotDims(bw, bd, rot); // 回転後の占有寸法 (土台・記録・掃除はすべてこちら)
    const baseEntry = id.startsWith("custom:") ? CUSTOM.find((x) => x.id === id) : undefined;
    const customEntry = baseEntry ? rotateCustomEntry(baseEntry, rot) : undefined;
    const depth = baseEntry ? (baseEntry.depth || 0) : 0; // 原点より下に掘る段数
    // ドアは位置と向きを回転させて付け直す
    const doors = (DOORS[id] || []).map(([x, y, z, type, facing, hinge, open]) => {
        const [rx, rz] = rotPoint(x, z, bw, bd, rot);
        return [rx, y, rz, type, rotCardinal(facing, rot), hinge, open];
    });
    const lang = getLang(player);
    const dispName = buildingLabel(lang, name);
    const msg = (m) => { try { player.sendMessage(m); } catch {} };
    const bone = getBlockSafe(dim, origin);
    if (!bone || bone.typeId !== "minecraft:bone_block") { msg("§c[Village Library]§r " + t(lang, STR.noBone)); return; }
    // アンカー付きの制作物 (港): 骨ブロックの位置がピース原点のセルに重なるよう、
    // 配置原点 (=北西の角) をアンカー分だけ逆算する。以後の土台・記録・登録は配置原点基準。
    if (baseEntry && baseEntry.anchor) {
        const [ax, az] = rotPoint(baseEntry.anchor[0], baseEntry.anchor[1], bw, bd, rot);
        origin = { x: origin.x - ax, y: origin.y, z: origin.z - az };
    }
    const key = `${dim.id}:${origin.x},${origin.y},${origin.z}`;
    if (busy.has(key)) { msg("§c[Village Library]§r " + t(lang, STR.busy)); return; }
    busy.add(key);
    const release = () => busy.delete(key);
    // アンドゥ記録: 土台を敷く前に体積 (w x h x d) の全セルを記録する
    const rec = { dim, origin: { ...origin }, w, h, d, labelJa: name, depth, rot, entries: [], customId: id.startsWith("custom:") ? id : undefined, structId: id.startsWith("custom:") ? undefined : id };
    const aboveEntries = []; // 建物の上に被さっていた非空気セル (上書き対象。rec.entries にも入れてアンドゥで戻す)
    let loadOk = false;

    // 土台の上にいる物(モブ等)を土台の外へ寄せる
    const sweep = () => {
        try {
            const center = { x: origin.x + w / 2, y: origin.y + 1, z: origin.z + d / 2 };
            for (const e of dim.getEntities({ location: center, maxDistance: Math.hypot(w, d) / 2 + 3 })) {
                if (e.typeId === "minecraft:player" || e.typeId === "minecraft:item") continue;
                const l = e.location;
                const rx = l.x - origin.x, rz = l.z - origin.z;
                if (rx < 0 || rx >= w || rz < 0 || rz >= d || l.y < origin.y || l.y > origin.y + Math.max(h, 5)) continue;
                const penX = Math.min(rx, w - rx), penZ = Math.min(rz, d - rz);
                const to = { x: l.x, y: origin.y + 1, z: l.z };
                if (penX < penZ) to.x = origin.x + (rx < w / 2 ? -1.5 : w + 1.5);
                else to.z = origin.z + (rz < d / 2 ? -1.5 : d + 1.5);
                try { e.teleport(to); } catch {}
            }
        } catch {}
    };

    // v042: 固定 5 秒カウントダウンをやめ、実作業の進捗で進む方式にした (北斗の提案)。
    // 記録 → 上空記録 → 土台 → 土台撤去 → 設置 (付け直しパス込み) → 穴埋め・上空掃除を
    // 1 本のジョブで分割実行し、アクションバーにゲージ + % を出す。大きな施設ほど
    // 時間がかかるが、終わるまで待つ。仕上げ (ドア付け直し・片付け・登録) は設置が
    // 本当に完了してから行う。
    const state = { finished: false, error: null };
    const totalCells = w * (h + depth) * d;
    const aboveCells = w * CLEAR_UP * d;
    let placeCells = 0;
    if (customEntry) { for (const rows of customEntry.layers) for (const row of rows) for (const ch of row) if (ch !== ".") placeCells++; }
    const prog = { done: 0, total: totalCells + aboveCells + 2 * w * d + (customEntry ? placeCells : 1) };

    function* buildGen() {
        try {
            // 0) 記録フェーズ: 体積の全セルを記録 (アンドゥ用)
            let idx = 0;
            while (idx < totalCells) {
                const st = idx, end = Math.min(idx + 512, totalCells);
                for (; idx < end; idx++) {
                    const dx = idx % w, dz = Math.floor(idx / w) % d, dy = Math.floor(idx / (w * d));
                    const pos = { x: origin.x + dx, y: origin.y - depth + dy, z: origin.z + dz };
                    const b = getBlockSafe(dim, pos);
                    if (b) { try { rec.entries.push({ x: pos.x, y: pos.y, z: pos.z, perm: b.permutation }); } catch {} }
                }
                prog.done += idx - st;
                yield;
            }
            // 0.5) 上空フェーズ: 建物の上の CLEAR_UP 段にある非空気セルだけ記録
            idx = 0;
            while (idx < aboveCells) {
                const st = idx, end = Math.min(idx + 512, aboveCells);
                for (; idx < end; idx++) {
                    const dx = idx % w, dz = Math.floor(idx / w) % d, dy = Math.floor(idx / (w * d));
                    const pos = { x: origin.x + dx, y: origin.y + h + dy, z: origin.z + dz };
                    const b = getBlockSafe(dim, pos);
                    if (b && b.typeId !== "minecraft:air") {
                        try { const e = { x: pos.x, y: pos.y, z: pos.z, perm: b.permutation }; rec.entries.push(e); aboveEntries.push(e); } catch {}
                    }
                }
                prog.done += idx - st;
                yield;
            }
            // 1) 骨ブロックの土台を建物の底面サイズに広げる
            const footCells = w * d;
            idx = 0;
            while (idx < footCells) {
                const st = idx, end = Math.min(idx + 256, footCells);
                for (; idx < end; idx++) {
                    const dx = idx % w, dz = Math.floor(idx / w);
                    try { dim.runCommand(`setblock ${origin.x + dx} ${origin.y} ${origin.z + dz} minecraft:bone_block`); } catch {}
                }
                prog.done += idx - st;
                yield;
            }
            sweep();
            msg(`§e[Village Library]§r ` + t(lang, STR.foundation, dispName, w, d));
            // 2) 土台を消す
            sweep();
            idx = 0;
            while (idx < footCells) {
                const st = idx, end = Math.min(idx + 512, footCells);
                for (; idx < end; idx++) {
                    const dx = idx % w, dz = Math.floor(idx / w);
                    const fb = getBlockSafe(dim, { x: origin.x + dx, y: origin.y, z: origin.z + dz });
                    if (fb && fb.typeId === "minecraft:bone_block") { try { fb.setType("minecraft:air"); } catch {} }
                }
                prog.done += idx - st;
                yield;
            }
            // 3) 建物を建てる (カスタムは分割設置 + 付け直しパス、村の建物は構造物ロード)
            if (customEntry) { yield* placeCustomGen(dim, origin, customEntry, prog); }
            else { dim.runCommand(`structure load ${id} ${origin.x} ${origin.y} ${origin.z}` + (rot ? ` ${rot * 90}_degrees` : "")); prog.done += 1; }
            loadOk = true;
            // 3.5) 穴埋め: 底面(原点の高さ)で空気のまま残ったセルに、記録しておいた元の地形を戻す
            //      ドアの真下は仕上げでドアを置き直すので除外し、原点の骨ブロック(目印)も戻さない。
            try {
                const doorXZ = new Set(doors.map(([dx, , dz]) => dx + "," + dz));
                let hi = 0;
                while (hi < rec.entries.length) {
                    const end = Math.min(hi + 512, rec.entries.length);
                    for (; hi < end; hi++) {
                        const e = rec.entries[hi];
                        if (e.y !== origin.y) continue;
                        if (e.perm.typeId === "minecraft:bone_block") continue;
                        if (doorXZ.has((e.x - origin.x) + "," + (e.z - origin.z))) continue;
                        const b = getBlockSafe(dim, e);
                        if (b && b.typeId === "minecraft:air") { try { b.setPermutation(e.perm); } catch {} }
                    }
                    yield;
                }
            } catch {}
            // 3.6) 上空の上書き: 建物の上に被さっていたもの (木の冠など) を消す
            try {
                let ai = 0;
                while (ai < aboveEntries.length) {
                    const end = Math.min(ai + 512, aboveEntries.length);
                    for (; ai < end; ai++) { const b = getBlockSafe(dim, aboveEntries[ai]); if (b) { try { b.setType("minecraft:air"); } catch {} } }
                    yield;
                }
            } catch {}
            state.finished = true;
        } catch (e) { state.error = e; }
    }

    // 4) 仕上げ: ドアの付け直しと、落ちたアイテムの片付け、登録
    const finish = () => {
        try {
            const px = (x, y, z) => ({ x: origin.x + x, y: origin.y + y, z: origin.z + z });
            const tid = (p) => { const b = getBlockSafe(dim, p); return b ? b.typeId : ""; };
            let fixed = 0, failed = 0, native = 0;
            for (const [x, y, z, type, facing, hinge, open] of doors) {
                const lo = px(x, y, z), up = px(x, y + 1, z);
                if (tid(lo) === type && tid(up) === type) { native++; continue; }
                const full = `setblock ${lo.x} ${lo.y} ${lo.z} ${type} ["minecraft:cardinal_direction"="${facing}","door_hinge_bit"=${hinge ? "true" : "false"},"open_bit"=${open ? "true" : "false"}]`;
                const lite = `setblock ${lo.x} ${lo.y} ${lo.z} ${type} ["minecraft:cardinal_direction"="${facing}"]`;
                let ok = false;
                try { dim.runCommand(full); ok = true; } catch {}
                if (!ok) { try { dim.runCommand(lite); ok = true; } catch {} }
                if (ok && tid(lo) === type && tid(up) === type) fixed++; else failed++;
            }
            let cleaned = 0;
            try {
                const center = { x: origin.x + w / 2, y: origin.y + 1, z: origin.z + d / 2 };
                for (const e of dim.getEntities({ location: center, maxDistance: Math.hypot(w, d) / 2 + 5 })) {
                    if (e.typeId !== "minecraft:item") continue;
                    const l = e.location;
                    if (l.x < origin.x - 3 || l.x >= origin.x + w + 3 || l.z < origin.z - 3 || l.z >= origin.z + d + 3) continue;
                    if (l.y < origin.y - 1 || l.y > origin.y + h + CLEAR_UP) continue;
                    try { e.remove(); cleaned++; } catch {}
                }
            } catch {}
            msg(`§a[Village Library]§r ` + t(lang, STR.built, dispName, w, h, d));
            if (loadOk) undoByPlayer.set(player.id, rec); // アンドゥ記録は成功した建設だけ残す(直近1件)
            if (loadOk) { try { const bldId = registerBuilding(rec); if (bldId) system.runJob(scanCoreGen(dim, bldId, rec, customEntry)); } catch (e) { console.warn("[VillageLibrary] building registry: " + e); } }
            if (loadOk && rec.customId === "custom:mine") { // 鉱山は地下ダンジョンに登録する
                try {
                    registerMine(origin, dim.id, rot);
                    msg("§b[Village Library]§r " + t(lang, STR.mineLinked));
                } catch (e) { console.warn("[VillageLibrary] mine link: " + e); }
            }
            if (loadOk && rec.customId === "custom:port") { // 港は移動ネットワークに登録する
                try {
                    registerPort(origin, dim.id, rot);
                    msg("§b[Village Library]§r " + t(lang, STR.portLinked));
                } catch (e) { console.warn("[VillageLibrary] port link: " + e); }
            }
            const total = native + fixed + failed;
            if (failed > 0) msg(`§c[Village Library]§r ` + t(lang, STR.doorFailed, failed, native + fixed, total));
            if (cleaned > 0) msg(`§7[Village Library]§r ` + t(lang, STR.cleaned, cleaned));
        } catch (e) {
            msg("§c[Village Library]§r " + t(lang, STR.finishFailed, e));
        }
        release();
    };

    const ticker = system.runInterval(() => {
        if (state.error) {
            system.clearRun(ticker);
            try { player.onScreenDisplay.setActionBar(""); } catch {}
            msg("§c[Village Library]§r " + t(lang, STR.loadFailed, state.error));
            release();
            return;
        }
        if (!state.finished) {
            const pct = Math.max(0, Math.min(100, Math.floor(prog.done * 100 / prog.total)));
            try { player.onScreenDisplay.setActionBar("§e" + t(lang, STR.building, dispName, gauge(pct), pct)); } catch {}
            return;
        }
        system.clearRun(ticker);
        try { player.onScreenDisplay.setActionBar(""); } catch {}
        finish();
    }, 10);
    system.runJob(buildGen());
}

// 骨ブロックに紙を持ってインタラクト
// ※ afterEvents ではなく beforeEvents で受けること。
//   afterEvents.playerInteractWithBlock は「バニラのインタラクトが成功した後」にしか
//   発火しない定義で、骨ブロック＋紙のようなバニラ側に成功扱いの操作がない組み合わせでは
//   タッチしてもイベント自体が来ない。BMH／ニートちゃん寝袋など実機確認済みの
//   インタラクトはすべて beforeEvents 側で受けている。
world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    try {
        if (!ev.isFirstEvent) return;
        const { player, block, itemStack } = ev;
        if (!itemStack || itemStack.typeId !== "minecraft:paper") return;
        if (!block || block.typeId !== "minecraft:bone_block") return;
        ev.cancel = true;
        const origin = { x: block.location.x, y: block.location.y, z: block.location.z };
        const dim = block.dimension;
        const pv = previews.get(player.id);
        if (pv && pv.dim.id === dim.id && pv.origin.x === origin.x && pv.origin.y === origin.y && pv.origin.z === origin.z) {
            previews.delete(player.id);
            system.run(() => { try { if (pv.item[0] === "grade") startGrading(player, pv.dim, pv.origin); else startBuild(player, pv.dim, pv.origin, pv.item, pv.rot); } catch (e) { console.warn("[VillageLibrary] build: " + e); } });
            return;
        }
        system.run(() => { openBiomeMenu(player, origin, dim).catch((e) => console.warn("[VillageLibrary] " + e)); });
    } catch (e) {
        console.warn("[VillageLibrary] " + e);
    }
});

// アンドゥ: ブラシでどれかのブロックをタップ (Wool Printerと同じ作法)
// ただし怪しげな砂・砂利はバニラの発掘が本来の使い方なので横取りしない。
// 記録が無いときもイベントはキャンセルせず、メッセージだけ出す(バニラ動作を妨げない)。
world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    try {
        const { player, block, itemStack } = ev;
        if (!itemStack || itemStack.typeId !== "minecraft:brush") return;
        if (!block) return;
        if (block.typeId === "minecraft:suspicious_sand" || block.typeId === "minecraft:suspicious_gravel") return;
        if (!ev.isFirstEvent) return;
        const rec = undoByPlayer.get(player.id);
        if (!rec || rec.entries.length === 0) {
            system.run(() => { try { player.sendMessage("§c[Village Library]§r " + t(getLang(player), STR.undoNone)); } catch {} });
            return;
        }
        ev.cancel = true;
        system.run(() => { try { startUndo(player); } catch (e) { console.warn("[VillageLibrary] undo: " + e); } });
    } catch (e) {
        console.warn("[VillageLibrary] " + e);
    }
});

// デバッグ用: /scriptevent vlib:open / vlib:undo
// タッチが効かないときに切り分けるための予備入口。プレイヤーから16ブロック以内で
// 一番近い骨ブロックを原点にして同じメニューを開く(チート有効が必要)。
system.afterEvents.scriptEventReceive.subscribe((ev) => {
    if (ev.id === "vlib:undo") {
        const p = ev.sourceEntity;
        if (p && p.typeId === "minecraft:player") { try { startUndo(p); } catch (e) { console.warn("[VillageLibrary] undo: " + e); } }
        return;
    }
    if (ev.id === "vlib:ports") {
        const p = ev.sourceEntity;
        if (!p || p.typeId !== "minecraft:player") return;
        const list = loadPorts();
        try { p.sendMessage(`[Village Library] ports: ${list.length}` + (list.length ? " " + list.map((m) => `(${m.ox},${m.oy},${m.oz})`).join(" ") : "")); } catch {}
        return;
    }
    if (ev.id === "vlib:cleanup") {
        const p = ev.sourceEntity;
        if (!p || p.typeId !== "minecraft:player") return;
        const r = startCleanupSweep();
        try { p.sendMessage("§b[Village Library]§r " + t(getLang(p), r === -1 ? STR.cleanupBusy : r === 0 ? STR.cleanupNone : STR.cleanupStart)); } catch {}
        return;
    }
    if (ev.id === "vlib:caves") {
        const p = ev.sourceEntity;
        if (!p || p.typeId !== "minecraft:player") return;
        try { p.sendMessage("[Village Library] cave commands: " + VARIANTS.map((v) => "vlib:cave_" + v.id).join("  ")); } catch {}
        return;
    }
    if (ev.id === "vlib:warps" || ev.id === "vlib:down" || ev.id === "vlib:up" || ev.id.startsWith("vlib:cave_")) {
        const p = ev.sourceEntity;
        if (!p || p.typeId !== "minecraft:player") return;
        const list = loadMines();
        if (ev.id === "vlib:warps") {
            try { p.sendMessage(`[Village Library] mines: ${list.length}` + (list.length ? " " + list.map((m) => `(${m.ox},${m.oy},${m.oz})`).join(" ") : "")); } catch {}
            return;
        }
        if (list.length === 0) { try { p.sendMessage("§c[Village Library]§r " + t(getLang(p), STR.warpNone)); } catch {} return; }
        const pl = p.location;
        const m = list.map((mm) => ({ mm, d: (mm.ox - pl.x) ** 2 + (mm.oz - pl.z) ** 2 })).sort((a, b) => a.d - b.d)[0].mm;
        lastWarpTick.delete(p.id);
        if (ev.id === "vlib:up") { warpUp(p, m); return; }
        // vlib:down / vlib:cave_<種類>: コマンドは1人で即出発 (ツルハシ不要のデバッグ入口)
        if (p.dimension && isUGDim(p.dimension.id)) return;
        const variant = ev.id.startsWith("vlib:cave_") ? variantById(ev.id.slice("vlib:cave_".length)) : drawVariant("mid");
        try { p.sendMessage("§d[Village Library]§r " + t(getLang(p), STR.mineVariant, getLang(p) === "en" ? variant.en : variant.ja)); } catch {}
        startDescentParty(m, variant, [p], p.id, null);
        return;
    }
    if (ev.id !== "vlib:open") return;
    const player = ev.sourceEntity;
    if (!player || player.typeId !== "minecraft:player") return;
    try {
        const dim = player.dimension;
        const p = player.location;
        let best = undefined, bestD = Infinity;
        for (let dx = -16; dx <= 16; dx++) for (let dy = -8; dy <= 8; dy++) for (let dz = -16; dz <= 16; dz++) {
            const pos = { x: Math.floor(p.x) + dx, y: Math.floor(p.y) + dy, z: Math.floor(p.z) + dz };
            const b = getBlockSafe(dim, pos);
            if (!b || b.typeId !== "minecraft:bone_block") continue;
            const d = dx * dx + dy * dy + dz * dz;
            if (d < bestD) { bestD = d; best = pos; }
        }
        if (!best) { player.sendMessage("§c[Village Library]§r " + t(getLang(player), STR.noBoneNear)); return; }
        openBiomeMenu(player, best, dim).catch((e) => console.warn("[VillageLibrary] " + e));
    } catch (e) {
        console.warn("[VillageLibrary] " + e);
    }
});

setSweepNotify((n) => { if (n > 0) for (const p of world.getAllPlayers()) sendMsg(p, t(getLang(p), STR.cleanupDone, n)); });
startDungeonDriver(() => loadMines());
system.run(() => { console.warn("[VillageLibrary] v055 loaded"); });
