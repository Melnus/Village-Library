# Village Library — world → library converter

`worlds/` に建物のワールド(`.mcworld`)と設定(`同名.json`)を置いて push すると、GitHub Actions が

1. ワールドの DB を直接読み(水没の層も含む)、`Structure/<名前>.json` に変換
2. チェックリストの検証をして `Structure/<名前>.report.md` に出力
3. `pack/scripts/custom.js` の同じ id のエントリを置き換え(なければ追加)
4. `dist/VillageLibrary_BP_vX.Y.Z.mcpack` をビルド(成果物としてダウンロード可)

を自動で行います。ローカルでも `python tools/convert.py` → `python tools/build_pack.py` で同じです(Python 3.9+、外部パッケージ不要)。

## 設定ファイル `worlds/<名前>.json`
| キー | 意味 |
|---|---|
| `id` / `no` / `name` | ライブラリ上の id・番号・表示名 |
| `depth` | 原点より下に何段あるか(地面を掘る段) |
| `ground` | 地面として無視するブロック(depth 以下の段のこのブロックは出力しない) |
| `box` | `[x0,y0,z0,x1,y1,z1]` ワールド座標の範囲。省略すると、ブロックがある範囲を自動で使う |
| `dry` | 水没させない階段などのセル `[x,y,z]` |
| `extras` | ベッドの色・看板の文字・ミツバチなど、ブロックエンティティ/エンティティを `pack/structures/` の小構造物で再現する指定。**ワールドからはまだ自動で読めない** |
| `normalize` | `false` で状態の正規化を切る(既定は有効) |

## 変換のルール
* 水没(液体レイヤー)は `wet` として出力され、建てるときに最後に水没させます。回転にも追従します。
* 状態の正規化: フェンスなどの接続、レッドストーン線の向き(ゲームが再計算するもの)は捨て、サトウキビ/竹の成長、農地の湿り気は初期化します。
* ブロックの状態の真偽値は NBT の byte から `true/false` に直します(`stability_check` だけは従来どおり 1/0)。

## 検証(`tools/validate.py`)
* ラウンドトリップ(変換結果を戻して元と全セル一致するか)
* 内容の棚卸し: トラップドア/ドア、水ブロック、水没セル、農産物、農地、ホッパー、付着ブロック、落下ブロック
* 水: 水源の側面や下が空気に開いていないか(**warn**)
* 農地が水源から4マス以内か(**warn**)、サトウキビの土台の隣に水があるか・土台が植えられるか(**ERROR**)
* 回転 0〜3 で `wet`/`dry` の座標が同じブロックに乗るか(**ERROR**)
* いま `pack/` にある同じ id のエントリとの差分(セル数・変わったセル)
* ERROR があると Actions は失敗します(警告だけなら成功)。

## 出荷の前に
* `pack/manifest.json` の版(header・各モジュール)は**手で**上げてください(同じ版だと実機で更新されません)。
* ドア/トラップドアの向きは、回転 1〜3 で実機確認が必要です(データだけでは検証できません)。

## 構成
```
worlds/        ワールド(.mcworld)と設定(.json)
Structure/     変換結果(.json)と検証レポート(.report.md)
pack/          VillageLibrary_BP のソース (scripts/custom.js が建物データ)
tools/         bedrock_db.py(DB読み取り) convert.py validate.py build_pack.py
dist/          ビルドした .mcpack
```
