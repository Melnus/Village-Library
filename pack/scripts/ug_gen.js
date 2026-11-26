// 地下ディメンションの生成機(ダンジョン形式)。
// 地下は「階」の積み重ねで、各階は岩盤で囲った箱(水平 96x96、中心は最初のゲート位置から西へ32ずらした点)。
//   第1階 入口階(繁茂+鍾乳洞)   : エレベーターで到着する階。最初に生成されるのはこの階だけ
//   第2階 鍾乳洞階              : 背の高い空洞、鍾乳石。鉄・銅
//   第3階 深層                  : 空洞が巨大化、天然光なし。金・ダイヤの開始
//   第4階 底(マグマ階)          : 床が平らで、マグマの湖。レッドストーン、ダイヤはマグマ際
// 階同士の接続は水路だけ(岩盤の床・天井・外周は掘り抜けない)。
// 水路は「上の階の降り口プール → 水の柱(石レンガの筒) → 下の階の着き場プール」で、
// 降り口と着き場は階ごとに左右交互(中心から ±40)。各階には着き場と降り口をつなぐ横断通路を必ず掘る。
// 下の階は、上の階の降り口チャンクを生成する時に「着き場チャンク」だけ先に生成し(ポケット)、
// 本体は水路の入口でトリガーが引かれてから生成する(潜っている間に生成を終わらせる前提)。
// 各階の中身(空洞・装飾・鉱石)は v0.0.10 の生成器(帯書き・柱・局所水位・苔統合・蔓・鍾乳石3点セット)を階の帯に絞って使う。
// v0.0.12: 鉱石は生成器の状態判定で実際に石になる場所にだけ置く(構造物・外周・チャンク外は禁止)。
// 仮壁は構造物と重なる列に書かない。第1階は帯を Y192〜に戻し水位を床下に抑える(到着広間の水没対策)。
// v0.0.14: 第1階の地盤を斜面にした(baseAt)。到着端が +F1_RISE 高く、到着は帯の最上部(Y232、口のすぐ下)。
// 第1階は「洞窟を下る」階: 通路がそのまま下りのランプになる。水は低い降り口側に溜まる。
// v0.0.15: 直線の斜面は「斜めすぎる」との評で、間隔の不揃いな1段ずつの段差に変更し、通路の天井高もばらつかせた。
// 水路の接合部(両端のプールの水面の高さ)で筒の壁が水の柱を塞いでいた不具合を修正: 接合部は壁を書かず水で開ける。
// v0.0.16: 第1・2階の横断を「骨格」に置き換えた。平面で蛇行する道+広間+道沿いの床プロファイル
// (平坦・斜面・滝)+中央の川。カルスト/鍾乳洞の実図への北斗の評「もうちょっと自然なのがいいな」を受けたもの。
// 第3・4階は従来の直線通路のまま。
// 岩盤隠し: 外周の1列内側を石の化粧層にし、天井スラブの下に石の皮を1枚入れる。

export const UG = {
  TOP: 250,
  BOT: -64,
  ARR_Y: 232, // 第1階の到着の高さ(地盤の斜面の最上部、口のすぐ下)
  FLOOR4: -48,
  LAVA_Y: -44,
  SEED: 7331,
  BOX_HALF: 48,
  POOL_OFF: 40,
  ARR_OFF: 32, // 第1階だけ: 到着点(ゲート)は箱の中心ではなく東の端(中心+32)に置く
  F1_RISE: 32, // 第1階だけ: 地盤は到着端がこの高さだけ高く、降り口端へ向けて斜面になる
};

export const FLOORS = [
  { id: 1, y0: 192, y1: 246, base: 200, water: 198 },
  { id: 2, y0: 115, y1: 188, base: 115, water: 124 },
  { id: 3, y0: 23,  y1: 108, base: 23,  water: null },
  { id: 4, y0: -61, y1: 16,  base: -47, water: null },
];
export function slabBot(f) { return FLOORS[f - 1].y0 - 3; }
export function slabTop(f) { return FLOORS[f - 1].y1 + 3; }
export function floorOfY(y) {
  for (let f = 1; f <= 4; f++) if (y <= slabTop(f) && y >= slabBot(f)) return f;
  for (let f = 1; f <= 4; f++) if (slabTop(f) < y) return f;
  return 4;
}
// その列の地盤の高さ。第1階だけ到着端(中心+ARR_OFF)が高く、降り口端(中心-POOL_OFF)へ向けて下る。
// 下りは直線の斜面ではなく、間隔の不揃いな1段ずつの段差(自然の洞窟の床の段差)にする。
// 段差の位置は ox だけで決まる表にしておくので、チャンクをまたいでも同じ値になる
const slopeTables = new Map();
function slopeTable(ox) {
  let t = slopeTables.get(ox);
  if (t) return t;
  const depX = ox - UG.POOL_OFF, arrX = ox + UG.ARR_OFF;
  const bounds = []; // この x から地盤が1段上がる、という境界の並び
  let x = depX;
  for (let i = 0; i < UG.F1_RISE; i++) {
    let gap = 1 + Math.floor(hash3(i, 77, ox, 733) * 3); // 段差の間隔 1〜3
    const remain = UG.F1_RISE - i;
    if (x + gap > arrX - (remain - 1)) gap = Math.max(1, arrX - (remain - 1) - x); // 到着端までに収める
    x += gap;
    bounds.push(x);
  }
  t = { depX, arrX, bounds };
  slopeTables.set(ox, t);
  return t;
}

export function baseAt(F, layout, x) {
  if (F.id !== 1) return F.base;
  const t = slopeTable(layout.ox);
  if (x <= t.depX) return F.base;
  if (x >= t.arrX) return F.base + UG.F1_RISE;
  let h = 0;
  for (const b of t.bounds) { if (x >= b) h++; else break; }
  return F.base + h;
}

// ---------- 横断路の骨格(第1・2階だけ。第3・4階は従来の直線通路) ----------
// 到着点から降り口まで、平面で蛇行する道を骨格として先に決め、ノイズの空洞はその周りの質感に回す。
// 道沿いの床は、平坦・斜面・滝(落差と下の水溜まり)が不規則に連なり、途中で広間になって幅と天井が広がる。
// 道の中央3列は川(床を1段掘った水路)で、滝では水が落差いっぱいに流れ落ちる。
// 土手(川以外の道の床)は滝でも1段ずつ下がるので、歩いて戻れる。
// 骨格は ox と階だけで決まる表にしておくので、チャンクをまたいでも同じ形になる
function vnoise1(i, period, seed, ox) {
  const t = i / period, i0 = Math.floor(t), f = t - i0;
  const a = hash3(i0, 3, ox, seed) * 2 - 1, b = hash3(i0 + 1, 3, ox, seed) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

const pathTables = new Map();
export function pathTable(F, layout) {
  if (F.id > 2) return null;
  const key = F.id + ":" + layout.ox;
  let T = pathTables.get(key);
  if (T) return T;
  const A = poolX(F.id, "arr", layout.ox), D = poolX(F.id, "dep", layout.ox);
  const x0 = Math.min(A, D), x1 = Math.max(A, D), n = x1 - x0 + 1;
  const startH = F.id === 1 ? UG.ARR_Y : F.base, endH = F.base;
  const seed = UG.SEED + F.id * 131 + 7;
  const at = (i) => (A > D ? A - i : A + i); // A からの距離 i に対応する x

  // 広間の位置(距離 i)
  const hallIdx = [0.35, 0.68].map((fr) => Math.round((n - 1) * fr) + Math.floor(hash3(Math.round(fr * 100), 43, layout.ox, seed) * 5) - 2);

  // 段差 s[i]: A から i 列目の、前列からの高さの変化
  const s = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const dens = 0.3 + 0.45 * (vnoise1(i, 11, seed + 41, layout.ox) * 0.5 + 0.5); // 下りの密度(場所で変わる)
    const r = hash3(i, 37, layout.ox, seed);
    if (F.id === 1) { if (r < dens) s[i] = -1; }
    else if (r < 0.34) s[i] = 1;
    else if (r < 0.52) s[i] = -1;
  }
  const target = endH - startH;
  // 合計を目標に合わせる。反転は候補全体に均等に散らす(片側に寄せると長い平坦ができる)
  const adjust = (excl) => {
    let sum = s.reduce((a, b) => a + b, 0);
    while (sum !== target) {
      const cands = [];
      for (let i = 1; i < n; i++) {
        if (excl && excl(i)) continue;
        if (sum > target && ((s[i] === 0 && F.id === 1) || s[i] === 1)) cands.push(i);
        else if (sum < target && (s[i] === -1 || (s[i] === 0 && F.id === 2))) cands.push(i);
      }
      if (!cands.length) break;
      const need = Math.min(Math.abs(sum - target), cands.length);
      for (let j = 0; j < need; j++) {
        const i = cands[Math.floor(j * cands.length / need)];
        if (sum > target) { s[i] = F.id === 1 && s[i] === 0 ? -1 : 0; sum--; }
        else { s[i] = s[i] === -1 ? 0 : 1; sum++; }
      }
    }
  };
  const buildH = () => {
    const H = new Array(n), B = new Array(n);
    H[0] = startH; B[0] = startH;
    for (let i = 1; i < n; i++) { H[i] = H[i - 1] + s[i]; B[i] = Math.max(H[i], B[i - 1] - 1); }
    if (F.id === 2) { // 川底が帯の下(岩盤スラブ)に食い込まないよう、本体では base+1 を下限にする
      for (let i = 0; i < n; i++) { if (H[i] < F.base) H[i] = F.base; if (B[i] < F.base) B[i] = F.base; }
      for (let i = 3; i <= n - 4; i++) { if (H[i] < F.base + 1) H[i] = F.base + 1; }
      for (let i = 3; i <= n - 4; i++) { if (B[i] < H[i]) B[i] = H[i]; }
    }
    return { H, B };
  };
  let H, B;
  if (F.id === 2) {
    // 第2階は「盛り上がった台地」型: base から滑らかに上がって高原になり、降り口で base に戻る。
    // ランダムな段差の寄せ集めだと高さが育たないので、輪郭を曲線で先に決めて段差を逆算する
    const amp = 3 + Math.floor(hash3(5, 51, layout.ox, seed) * 3); // 高原の高さ 3〜5
    H = new Array(n); B = new Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const bump = Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.08) / 0.84)));
      const rough = 0.6 * vnoise1(i, 9, seed + 59, layout.ox);
      H[i] = F.base + Math.max(0, Math.round(amp * Math.pow(Math.max(0, bump), 1.2) + rough));
    }
    H[0] = F.base; H[n - 1] = F.base;
    for (let i = 3; i <= n - 4; i++) if (H[i] < F.base + 1) H[i] = F.base + 1;
    for (let i = 1; i < n; i++) s[i] = H[i] - H[i - 1];
    B[0] = H[0];
    for (let i = 1; i < n; i++) B[i] = Math.max(H[i], B[i - 1] - 1);
  } else {
    adjust(null);
    ({ H, B } = buildH());
  }

  // 中心線の蛇行・道の幅・天井高
  const wander = new Array(n), hw = new Array(n), ceil = new Array(n);
  for (let i = 0; i < n; i++) {
    const env = Math.pow(Math.sin(Math.PI * i / (n - 1)), 0.75); // 両端では中心に戻る
    wander[i] = Math.round(12 * vnoise1(i, 16, seed + 43, layout.ox) * env);
    hw[i] = 1 + Math.floor((vnoise1(i, 13, seed + 47, layout.ox) * 0.5 + 0.5) * 3.0); // 半幅 1〜4
    ceil[i] = 5 + Math.floor((vnoise1(i, 15, seed + 53, layout.ox) * 0.5 + 0.5) * 3.0); // 天井高 5〜8
  }
  const halls = hallIdx.map((hi) => ({
    i: hi, x: at(hi), z: layout.oz + wander[hi],
    r: 8 + Math.floor(hash3(hi, 47, layout.ox, seed) * 3),
    ceil: 11 + Math.floor(hash3(hi, 49, layout.ox, seed) * 3),
  }));

  // 滝: 1列で3下がる。広間の円盤と重ならず、第2階では十分に高い場所を、表が決まってから探す
  const falls = new Set();
  const fallN = F.id === 1 ? 2 : 1;
  const inHallDisc = (i) => halls.some((h) => {
    const dx = at(i) - h.x, dz = layout.oz + wander[i] - h.z;
    return dx * dx + dz * dz <= h.r * h.r; // 広間の円盤の中だと pathGeom の広間側に上書きされて滝にならない
  });
  for (let k = 0; k < fallN; k++) {
    let fi = -1;
    for (let i = 14; i <= n - 8; i++) {
      if (falls.size && [...falls].some((f) => Math.abs(f - i) < 12)) continue;
      if (inHallDisc(i)) continue;
      if (F.id === 2 && H[i - 1] < F.base + 3) continue;
      fi = i; break;
    }
    if (fi < 0) break;
    s[fi] = -3; s[fi + 1] = 0; s[fi + 2] = 0;
    falls.add(fi);
    adjust((i) => i >= fi - 1 && i <= fi + 3);
    ({ H, B } = buildH());
  }
  T = { A, D, x0, x1, n, H, B, wander, hw, ceil, halls, falls, oz: layout.oz };
  pathTables.set(key, T);
  return T;
}

export function pathCentreZ(F, layout, x) {
  const T = pathTable(F, layout);
  if (!T || x < T.x0 || x > T.x1) return layout.oz;
  const i = T.A > T.D ? T.A - x : x - T.A;
  return T.oz + T.wander[i];
}

// その列が道の骨格に含まれるなら { floor: 床の高さ, ceil: 天井までの高さ, waterY: 川の水面(なければ -1), fallTop: 滝の水の上端(なければ -1) } を返す
export function pathGeom(F, layout, x, z) {
  const T = pathTable(F, layout);
  if (!T || x < T.x0 || x > T.x1) return null;
  const i = T.A > T.D ? T.A - x : x - T.A;
  const zc = T.oz + T.wander[i];
  const d = Math.abs(z - zc);
  for (const h of T.halls) {
    const dx = x - h.x, dz = z - h.z;
    if (dx * dx + dz * dz <= h.r * h.r) {
      const chan = d <= 2; // 広間では川も少し広がる
      return { floor: chan ? T.H[h.i] - 1 : T.H[h.i], ceil: h.ceil, waterY: chan ? T.H[h.i] : -1, fallTop: -1 };
    }
  }
  if (d > T.hw[i]) return null;
  const prof = T.H[i];
  if (d <= 1) { // 川の水路: 床は prof-1、水は prof。滝の下の列では落差の上まで水が満ちる
    let fallTop = -1;
    if (i > 0 && T.H[i - 1] - prof >= 2) fallTop = T.H[i - 1];
    return { floor: prof - 1, ceil: T.ceil[i], waterY: prof, fallTop };
  }
  return { floor: T.B[i], ceil: T.ceil[i], waterY: -1, fallTop: -1 };
}

export function poolX(f, kind, ox) {
  if (kind === "arr") {
    if (f === 1) return ox + UG.ARR_OFF; // 第1階の到着は端(地上と繋がる階だけの形)
    return f % 2 === 0 ? ox - UG.POOL_OFF : ox + UG.POOL_OFF;
  }
  if (f >= 4) return null;
  return f % 2 === 1 ? ox - UG.POOL_OFF : ox + UG.POOL_OFF;
}

export const LAYERS = [
  { id: 1, name: "入口層",     y0: 192, y1: 250, thr: 0.630, sx: 26, sy: 13, ts: 22, tw: 0.075, water: 198 },
  { id: 2, name: "鍾乳洞層",   y0: 112, y1: 192, thr: 0.615, sx: 30, sy: 24, ts: 26, tw: 0.07, water: 124 },
  { id: 3, name: "深層",       y0: 20,  y1: 112, thr: 0.570, sx: 44, sy: 34, ts: 34, tw: 0.075, water: null },
  { id: 4, name: "底",         y0: -64, y1: 20,  thr: 0.500, sx: 56, sy: 40, ts: 44, tw: 0.08, water: null },
];

// ---------- ノイズ(外部ライブラリなし) ----------
function h3(ix, iy, iz, seed) {
  let h = Math.imul(ix, 73856093) ^ Math.imul(iy, 19349663) ^ Math.imul(iz, 83492791) ^ Math.imul(seed + 1, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function sm(t) { return t * t * (3 - 2 * t); }
function vnoise(x, y, z, seed) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = sm(x - ix), fy = sm(y - iy), fz = sm(z - iz);
  const a = h3(ix, iy, iz, seed), b = h3(ix + 1, iy, iz, seed), c = h3(ix, iy + 1, iz, seed), d = h3(ix + 1, iy + 1, iz, seed);
  const e = h3(ix, iy, iz + 1, seed), f = h3(ix + 1, iy, iz + 1, seed), g = h3(ix, iy + 1, iz + 1, seed), h = h3(ix + 1, iy + 1, iz, seed);
  const x1 = a + (b - a) * fx, x2 = c + (d - c) * fx, x3 = e + (f - e) * fx, x4 = g + (h - g) * fx;
  const y1 = x1 + (x2 - x1) * fy, y2 = x3 + (x4 - x3) * fy;
  return y1 + (y2 - y1) * fz;
}
export function hash2(x, z, seed) { return h3(x, 0, z, seed); }
export function hash3(x, y, z, seed) { return h3(x, y, z, seed); }

export function layerAt(y) {
  for (const L of LAYERS) if (y >= L.y0 && y < L.y1) return L;
  return y >= UG.TOP ? LAYERS[0] : LAYERS[LAYERS.length - 1];
}
// しきい値を層の中心どうしで滑らかにつなぐ(層の境目で空洞が急に変わらないように)
function thrAt(y) {
  const cs = LAYERS.map((L) => ({ c: (L.y0 + L.y1) / 2, t: L.thr })).sort((a, b) => a.c - b.c);
  if (y <= cs[0].c) return cs[0].t;
  for (let i = 0; i < cs.length - 1; i++) {
    if (y <= cs[i + 1].c) { const t = (y - cs[i].c) / (cs[i + 1].c - cs[i].c); return cs[i].t + (cs[i + 1].t - cs[i].t) * t; }
  }
  return cs[cs.length - 1].t;
}
// 空洞のスコア(正なら空気)。大きな空洞(連続ノイズ)、それらをつなぐ細い通路(2つのノイズが同時に0.5に近い所)、
// 入口層寄りでは縦に潰れた層状の空洞、の最大値。大きな空洞の中には柱(石)を差し戻す。
function rawScore(x, y, z) {
  const L = layerAt(y);
  const n = 0.65 * vnoise(x / L.sx, y / L.sy, z / L.sx, UG.SEED) + 0.35 * vnoise(2 * x / L.sx, 2 * y / L.sy, 2 * z / L.sx, UG.SEED + 11);
  const cav = n - thrAt(y);
  const a = vnoise(x / L.ts, y / (L.ts * 0.8), z / L.ts, UG.SEED + 21);
  const b = vnoise(x / L.ts + 31.7, y / (L.ts * 0.8) + 17.3, z / L.ts + 9.1, UG.SEED + 22);
  const tube = L.tw - Math.max(Math.abs(a - 0.5), Math.abs(b - 0.5));
  let s = cav > tube ? cav : tube;
  // 層状の空洞(縦に潰れた広がり)。入口層で強く、鍾乳洞層で弱く混ざる
  if (L.id === 1 || L.id === 2) {
    const lay = (vnoise(x / 34, y / 5.5, z / 34, UG.SEED + 41) - 0.70) * (L.id === 1 ? 0.35 : 0.15);
    if (lay > s) s = lay;
  }
  // 柱: 大きな空洞(cav が支配的)の中だけ、2Dノイズの帯に当たる列を石に戻す
  if (cav > 0.015 && cav >= tube) {
    const p = vnoise(x / 20, 0, z / 20, UG.SEED + 31);
    if (p > 0.465 && p < 0.545) return -0.05;
  }
  return s;
}
export function scoreAt(x, y, z) {
  if (y > UG.TOP - 8 || y < UG.BOT + 6 || y <= UG.FLOOR4) return -1;
  return rawScore(x, y, z);
}
export function isAir(x, y, z) { return scoreAt(x, y, z) > 0; }
function waterLevelAt(x, z, F) {
  if (F.water == null) return null;
  const n = vnoise(x / 170, 0, z / 170, UG.SEED + 51);
  let wl = F.water + Math.round((n - 0.5) * 14);
  // 第1階は水面を低い側の地盤(200)より下に抑える。到着広間は斜面の最上部(232)にあるので水没しない
  const cap = F.id === 1 ? F.base - 1 : F.base + 13;
  if (wl > cap) wl = cap;
  return wl;
}

// ---------- 鉱石表(層ごと)。prob は「チャンクあたりの試行回数」 ----------
const ORES = [
  // 入口層: 石炭・銅
  { layer: 1, name: "coal_ore", n: 26, vein: 5 }, { layer: 1, name: "copper_ore", n: 12, vein: 5 },
  // 鍾乳洞層: 鉄がここから。銅も
  { layer: 2, name: "iron_ore", n: 20, vein: 5 }, { layer: 2, name: "copper_ore", n: 8, vein: 5 }, { layer: 2, name: "coal_ore", n: 8, vein: 4 },
  // 深層: 金・ダイヤの開始
  { layer: 3, name: "gold_ore", n: 8, vein: 4 }, { layer: 3, name: "diamond_ore", n: 4, vein: 3 }, { layer: 3, name: "iron_ore", n: 8, vein: 4 },
  // 底: レッドストーン(少量・塊で)、ダイヤはマグマ際
  { layer: 4, name: "redstone_ore", n: 10, vein: 6 }, { layer: 4, name: "diamond_ore", n: 5, vein: 3, nearLava: true },
];

// ---------- 階チャンク生成 ----------
// env: { fill, trySet, isDone(f,cx,cz), box: {x0,x1,z0,z1,ox,oz} }
export function* genUGFloorChunk(dim, f, cx, cz, env) {
  const { fill, isDone, box } = env;
  const F = FLOORS[f - 1];
  const sBot = slabBot(f), sTop = slabTop(f);
  const x0 = cx * 16, z0 = cz * 16;
  const ix0 = Math.max(x0, box.x0), ix1 = Math.min(x0 + 15, box.x1);
  const iz0 = Math.max(z0, box.z0), iz1 = Math.min(z0 + 15, box.z1);
  if (ix0 > ix1 || iz0 > iz1) return; // 箱の外は生成しない(虚空のまま)
  const probe = dim.getBlock({ x: ix0 + ((ix1 - ix0) >> 1), y: F.base + 4, z: iz0 + ((iz1 - iz0) >> 1) });
  if (!probe) throw Object.assign(new Error("chunk not loaded"), { name: "LocationInUnloadedChunkError" });

  // 岩盤スラブ(上下)と外周の壁
  fill(dim, ix0, sBot, iz0, ix1, F.y0 - 1, iz1, "minecraft:bedrock");
  fill(dim, ix0, F.y1 + 1, iz0, ix1, sTop, iz1, "minecraft:bedrock");
  if (ix0 === box.x0) fill(dim, ix0, sBot, iz0, ix0, sTop, iz1, "minecraft:bedrock");
  if (ix1 === box.x1) fill(dim, ix1, sBot, iz0, ix1, sTop, iz1, "minecraft:bedrock");
  if (iz0 === box.z0) fill(dim, ix0, sBot, iz0, ix1, sTop, iz0, "minecraft:bedrock");
  if (iz1 === box.z1) fill(dim, ix0, sBot, iz1, ix1, sTop, iz1, "minecraft:bedrock");
  const layout = makeLayout(box, F);
  // まだ作っていない隣チャンクとの境目に石の壁(水・マグマの流出止め、内側の帯だけ)。
  // ただし水路・プール・広間・通路と重なる列には書かない(完成済みの構造を後から塞がないため)
  const walls = [[-1, 0, x0 - 1, z0, x0 - 1, z0 + 15], [1, 0, x0 + 16, z0, x0 + 16, z0 + 15], [0, -1, x0, z0 - 1, x0 + 15, z0 - 1], [0, 1, x0, z0 + 16, x0 + 15, z0 + 16]];
  for (const [dx, dz, ax, az, bx, bz] of walls) {
    if (isDone(f, cx + dx, cz + dz)) continue;
    if (ax < box.x0 - 1 || bx > box.x1 + 1 || az < box.z0 - 1 || bz > box.z1 + 1) continue;
    for (let wx = ax; wx <= bx; wx++) for (let wz = az; wz <= bz; wz++) {
      if (inStructure(layout, F, wx, wz)) continue;
      try { fill(dim, wx, F.y0, wz, wx, F.y1, wz, "minecraft:stone"); } catch (_) { /* 隣が未読み込みなら省略 */ }
    }
  }
  yield;

  // 粗い格子(4ブロックごと)で空洞のスコアを求め、列ごとに補間する(帯は階の内側だけ)
  const KY = Math.ceil((F.y1 - F.y0) / 4) + 1;
  const grid = new Float32Array(5 * 5 * KY);
  for (let gz = 0; gz < 5; gz++) for (let gx = 0; gx < 5; gx++) for (let k = 0; k < KY; k++) {
    grid[(gz * 5 + gx) * KY + k] = rawScore(x0 + gx * 4, F.y0 + k * 4, z0 + gz * 4);
  }
  yield;

  const runs = [];
  const prof = new Float32Array(KY);
  for (let lz = 0; lz < 16; lz++) {
    const z = z0 + lz;
    if (z < box.z0 || z > box.z1) continue;
    for (let lx = 0; lx < 16; lx++) {
      const x = x0 + lx;
      if (x < box.x0 || x > box.x1) continue;
      if (x === box.x0 || x === box.x1 || z === box.z0 || z === box.z1) continue; // 外周は岩盤済み
      // 岩盤隠し: 外周の1列内側は帯の全高を石で塗り、中からは石の崖に見せる
      if (x === box.x0 + 1 || x === box.x1 - 1 || z === box.z0 + 1 || z === box.z1 - 1) {
        const lo = Math.min(39, F.y1);
        if (F.y0 <= lo) fill(dim, x, F.y0, z, x, lo, z, "minecraft:deepslate");
        if (lo + 1 <= F.y1) fill(dim, x, lo + 1, z, x, F.y1, z, "minecraft:stone");
        continue;
      }
      const gx = lx >> 2, gz = lz >> 2, fx = (lx & 3) / 4, fz = (lz & 3) / 4;
      for (let k = 0; k < KY; k++) {
        const a = grid[(gz * 5 + gx) * KY + k], b = grid[(gz * 5 + gx + 1) * KY + k];
        const c = grid[((gz + 1) * 5 + gx) * KY + k], d = grid[((gz + 1) * 5 + gx + 1) * KY + k];
        prof[k] = (a + (b - a) * fx) * (1 - fz) + (c + (d - c) * fx) * fz;
      }
      writeColumn(dim, x, z, prof, F, layout, fill, runs);
    }
    if ((lz & 3) === 3) yield;
  }

  yield* placeOres(dim, cx, cz, x0, z0, env.trySet, F, layout, box);
  yield* decorate(dim, runs, env.trySet, F, layout);
  stampStructures(dim, cx, cz, F, box, fill);
}

// 通路・広間・プールの配置(階ごと)。すべて base の高さを基準にする
function makeLayout(box, F) {
  const ox = box.ox, oz = box.oz;
  const arrX = poolX(F.id, "arr", ox), depX = poolX(F.id, "dep", ox);
  const corrX0 = Math.min(arrX, depX == null ? ox : depX), corrX1 = Math.max(arrX, depX == null ? ox : depX);
  const pts = [];
  if (F.id >= 2) pts.push(arrX);
  if (depX != null) pts.push(depX);
  return { ox, oz, arrX, depX, corrX0, corrX1, pts };
}
// その列が構造物(プール・水路・広間・通路)にかかっているか。仮壁や鉱石が構造を塞がないための判定
function inStructure(layout, F, x, z) {
  for (const px of layout.pts) {
    const dx = x - px, dz = z - layout.oz;
    if (Math.abs(dx) <= 4 && Math.abs(dz) <= 4) return true; // プールの水盤と水路の筒
    if (dx * dx + dz * dz <= 81) return true; // 広間
  }
  if (F.id <= 2) return pathGeom(F, layout, x, z) !== null; // 蛇行する道の骨格
  return inCorridor(layout, x, z);
}
function inChamber(layout, F, x, z) {
  const pts = [];
  if (F.id >= 2) pts.push(layout.arrX);
  if (layout.depX != null) pts.push(layout.depX);
  for (const px of pts) {
    const dx = x - px, dz = z - layout.oz;
    if (dx * dx + dz * dz <= 81) return true;
  }
  return false;
}
function inCorridor(layout, x, z) {
  return z >= layout.oz - 2 && z <= layout.oz + 2 && x >= layout.corrX0 && x <= layout.corrX1;
}
function poolHole(layout, F, x, z) {
  const pts = [];
  if (F.id >= 2) pts.push(layout.arrX);
  if (layout.depX != null) pts.push(layout.depX);
  for (const px of pts) if (Math.abs(x - px) <= 1 && Math.abs(z - layout.oz) <= 1) return true;
  return false;
}

function writeColumn(dim, x, z, prof, F, layout, fill, runs) {
  const wl = waterLevelAt(x, z, F);
  const baseC = baseAt(F, layout, x); // 第1階は列ごとに地盤が傾く(他階は F.base と同じ)
  const chamber = inChamber(layout, F, x, z), hole = poolHole(layout, F, x, z);
  const corridor = F.id >= 3 && inCorridor(layout, x, z); // 第1・2階の横断は蛇行する道の骨格が担う
  const pg = F.id <= 2 ? pathGeom(F, layout, x, z) : null;
  const stateAt = (y) => {
    if (y === F.y1) return 0; // 岩盤隠し: 天井スラブの下に石の皮を1枚
    if (y === baseC && hole) return 1; // プールの底の穴(水路の通り道)
    if (pg) { // 道の骨格: 床・川・滝・天井を保証し、天井より上は通常の空洞判定に任せる
      if (y <= pg.floor) return 0;
      if (pg.waterY >= 0 && y >= pg.waterY && y <= Math.max(pg.waterY, pg.fallTop)) return 2;
      if (y <= pg.floor + pg.ceil) return 1;
    }
    // base より下は地盤(第4階の平らな床まわり)。第1階だけは窪みに水が溜まるよう自然の凹凸を残す
    if (y < baseC && !(F.id === 1 && !chamber && !corridor && !pg)) return 0;
    if (y === baseC) {
      if (chamber || corridor) return 0; // 通路と広間の床は石で均す
    }
    if (y === F.y0) return 0; // 岩盤隠し: 帯の最下段も石の皮(第1階の窪みの底で床スラブを見せない)
    if (chamber && y <= baseC + 13) return 1;
    if (corridor && y <= baseC + 5 + Math.floor(hash3(x, 9, z, 555) * 3)) return 1; // 通路の天井高は列ごとに 5〜7 とばらつかせる(均一な管にしない)
    const t = (y - F.y0) / 4, k = Math.floor(t), f = t - k;
    const s = prof[k] + (prof[k + 1] - prof[k]) * f;
    if (s <= 0) return 0;
    if (y <= UG.LAVA_Y && F.id === 4) return 3;
    if (wl != null && y <= wl) return 2;
    return 1;
  };
  let y = F.y0;
  while (y <= F.y1) {
    const st = stateAt(y);
    let y2 = y;
    while (y2 + 1 <= F.y1 && stateAt(y2 + 1) === st) y2++;
    if (st === 0) {
      writeStoneRun(dim, x, z, y, y2, stateAt, fill, F);
      y = y2 + 1;
    } else if (st === 1) {
      fill(dim, x, y, z, x, y2, z, "minecraft:air");
      runs.push({ x, z, a: y, b: y2, airFrom: y, wTop: null });
      y = y2 + 1;
    } else {
      fill(dim, x, y, z, x, y2, z, st === 2 ? "minecraft:water" : "minecraft:lava");
      let ab = y2;
      while (ab + 1 <= F.y1 && stateAt(ab + 1) === 1) ab++;
      if (ab > y2) fill(dim, x, y2 + 1, z, x, ab, z, "minecraft:air");
      runs.push({ x, z, a: y, b: ab, airFrom: y2 + 1, wTop: y2 });
      y = ab + 1;
    }
  }
}

function writeStoneRun(dim, x, z, a, b, stateAt, fill, F) {
  let topMat = null;
  const above = b + 1 <= F.y1 ? stateAt(b + 1) : 0;
  if (above === 1 || above === 2) {
    if (F.id === 1) {
      const h = hash3(x, b, z, UG.SEED + 61);
      topMat = above === 2 ? (h < 0.55 ? "minecraft:clay" : "minecraft:moss_block") : (h < 0.85 ? "minecraft:moss_block" : null);
    }
  }
  const end = topMat ? b - 1 : b;
  if (end >= a) {
    const segs = [[F.y0, 39, "minecraft:deepslate"], [40, F.y1, "minecraft:stone"]];
    for (const [s0, s1, mat] of segs) {
      const lo = Math.max(a, s0), hi = Math.min(end, s1);
      if (lo <= hi) fill(dim, x, lo, z, x, hi, z, mat);
    }
  }
  if (topMat) fill(dim, x, b, z, x, b, z, topMat);
}

// ---------- 装飾 ----------
function* decorate(dim, runs, trySet, F, layout) {
  let ops = 0;
  const MAX = 700;
  const byCol = new Map();
  for (const r of runs) {
    const k = r.x + "," + r.z;
    if (!byCol.has(k)) byCol.set(k, []);
    byCol.get(k).push(r);
  }
  const dripDone = new Set();

  for (let i = 0; i < runs.length; i++) {
    if (ops >= MAX) break;
    const r = runs[i];
    const hasFloorAir = r.airFrom <= r.b;
    const height = r.b - r.a + 1;

    if (F.id === 1) {
      if (hasFloorAir && r.wTop === null) {
        const hs = hash3(r.x, r.a, r.z, UG.SEED + 5);
        if (hs < 0.16) { trySet(dim, r.x, r.airFrom, r.z, "moss_carpet"); ops++; }
        else if (hs < 0.175) { trySet(dim, r.x, r.airFrom, r.z, hs < 0.168 ? "red_mushroom" : "brown_mushroom"); ops++; }
      }
      if (hasFloorAir && height >= 3) {
        const hc = hash3(r.x, r.b, r.z, UG.SEED + 9);
        if (hc < 0.055) {
          const lr = hash3(r.x, r.b, r.z, UG.SEED + 3);
          const len = lr < 0.45 ? 1 + Math.floor(lr * 4.5) : lr < 0.8 ? 3 + Math.floor((lr - 0.45) * 6) : 5 + Math.floor((lr - 0.8) * 10);
          const n = Math.min(len, height - 1);
          for (let k = 0; k < n; k++) {
            const yy = r.b - k;
            if (k === n - 1) trySet(dim, r.x, yy, r.z, "cave_vines_head_with_berries");
            else trySet(dim, r.x, yy, r.z, "cave_vines_body_with_berries");
            ops++;
          }
        } else if (hc < 0.075) {
          const n = 1 + Math.floor(hash3(r.x, r.b, r.z, UG.SEED + 3) * 3);
          for (let k = 0; k < n && r.b - k > r.airFrom; k++) { trySet(dim, r.x, r.b - k, r.z, "hanging_roots"); ops++; }
        } else if (hc < 0.079) {
          trySet(dim, r.x, r.b, r.z, "spore_blossom"); ops++;
        }
      }
    }

    if ((F.id === 2 || F.id === 1) && hasFloorAir && height >= 5) {
      const ck = r.x + "," + r.z;
      const density = F.id === 2 ? 0.045 : 0.012;
      // 鍾乳石の塊は ±2 に広がる。当たり判定のある鍾乳石が保証路に食い込まないよう、道/通路の近くでは置かない
      let nearCorr = false;
      for (const ddx of [-2, 0, 2]) for (const ddz of [-2, 0, 2]) {
        if (F.id <= 2 ? pathGeom(F, layout, r.x + ddx, r.z + ddz) !== null : inCorridor(layout, r.x + ddx, r.z + ddz)) nearCorr = true;
      }
      if (!nearCorr && !dripDone.has(ck) && hash3(r.x, r.a, r.z, UG.SEED + 77) < density) {
        dripDone.add(ck);
        ops += placeDripCluster(dim, byCol, r, trySet, F);
      }
    }

    if (F.id === 4 && hasFloorAir && r.a <= UG.FLOOR4 + 2) {
      if (hash3(r.x, r.a, r.z, UG.SEED + 5) < 0.12) { trySet(dim, r.x, r.a - 1, r.z, "magma"); ops++; }
    }
    if ((i & 63) === 63) yield;
  }
}

function placeDripCluster(dim, byCol, center, trySet, F) {
  let ops = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const dist = Math.max(Math.abs(dx), Math.abs(dz));
    const fall = 1 - dist / 3;
    const cols = byCol.get((center.x + dx) + "," + (center.z + dz));
    if (!cols) continue;
    for (const c of cols) {
      if (c.a < center.a - 8 || c.a > center.a + 8) continue;
      if (c.airFrom > c.b) continue;
      const x = c.x, z = c.z;
      const h = hash3(x, c.a, z, UG.SEED + 71);
      if (h < fall * 0.85 && c.b + 1 <= F.y1) { trySet(dim, x, c.b + 1, z, "dripstone_block"); ops++; }
      if (h < fall * 0.4 && c.b + 2 <= F.y1) { trySet(dim, x, c.b + 2, z, "dripstone_block"); ops++; }
      if (h < fall * 0.75 && c.airFrom - 1 >= F.base) { trySet(dim, x, c.airFrom - 1, z, "dripstone_block"); ops++; }
      if (h < fall * 0.9) {
        const len = 1 + Math.floor(hash3(x, c.b, z, UG.SEED + 73) * 5 * fall);
        for (let k = 0; k < len && c.b - k >= c.airFrom; k++) {
          const th = len === 1 ? "tip" : k === len - 1 ? "tip" : k === 0 ? (len >= 4 ? "base" : "frustum") : "middle";
          trySet(dim, x, c.b - k, z, "pointed_dripstone", { hanging: true, dripstone_thickness: th }); ops++;
        }
      }
      const h2 = hash3(x, c.a, z, UG.SEED + 79);
      if (h2 < fall * 0.6) {
        const len = 1 + Math.floor(hash3(x, c.a, z, UG.SEED + 83) * 4 * fall);
        for (let k = 0; k < len && c.airFrom + k <= c.b; k++) {
          const th = len === 1 ? "tip" : k === len - 1 ? "tip" : k === 0 ? (len >= 4 ? "base" : "frustum") : "middle";
          trySet(dim, x, c.airFrom + k, z, "pointed_dripstone", { hanging: false, dripstone_thickness: th }); ops++;
        }
      }
    }
  }
  return ops;
}

// ---------- 構造(プールと水路)。帯の後に重ねるので、生成の順序に依らず同じ形になる ----------
function stampStructures(dim, cx, cz, F, box, fill) {
  const x0 = cx * 16, z0 = cz * 16, x1 = x0 + 15, z1 = z0 + 15;
  const hit = (ax, az, bx, bz) => !(bx < x0 || ax > x1 || bz < z0 || az > z1);
  const clip = (ax, az, bx, bz) => [Math.max(ax, x0), Math.max(az, z0), Math.min(bx, x1), Math.min(bz, z1)];
  const pools = [];
  if (F.id >= 2) pools.push(poolX(F.id, "arr", box.ox));
  const dep = poolX(F.id, "dep", box.ox);
  if (dep != null) pools.push(dep);
  for (const px of pools) {
    if (!hit(px - 4, box.oz - 4, px + 4, box.oz + 4)) continue;
    const [ax, az, bx, bz] = clip(px - 4, box.oz - 4, px + 4, box.oz + 4);
    fill(dim, ax, F.base + 1, az, bx, F.base + 2, bz, "minecraft:stone_bricks");
    const [wx0, wz0, wx1, wz1] = clip(px - 3, box.oz - 3, px + 3, box.oz + 3);
    fill(dim, wx0, F.base + 1, wz0, wx1, F.base + 2, wz1, "minecraft:water");
  }
  const shafts = [];
  if (dep != null) shafts.push({ px: dep, from: FLOORS[F.id].base, to: F.base + 2, jLo: FLOORS[F.id].base, jHi: F.base });
  if (F.id >= 2) shafts.push({ px: poolX(F.id, "arr", box.ox), from: F.base, to: FLOORS[F.id - 2].base + 2, jLo: F.base, jHi: FLOORS[F.id - 2].base });
  for (const s of shafts) {
    if (!hit(s.px - 2, box.oz - 2, s.px + 2, box.oz + 2)) continue;
    const [ax, az, bx, bz] = clip(s.px - 2, box.oz - 2, s.px + 2, box.oz + 2);
    const [wx0, wz0, wx1, wz1] = clip(s.px - 1, box.oz - 1, s.px + 1, box.oz + 1);
    // 接合部(両端のプールの水面の高さ base+1..+2)では筒の壁を書かず、水で開ける。
    // 壁を一周書くと水の柱がプールから隔てられ、出入り口が塞がってしまうため。
    // どちらの階の生成が後に来ても、接合部は必ず水になる(順序に依らない)
    const juncs = [[s.jLo + 1, s.jLo + 2], [s.jHi + 1, s.jHi + 2]];
    const inJunc = (y) => (y >= juncs[0][0] && y <= juncs[0][1]) || (y >= juncs[1][0] && y <= juncs[1][1]);
    let y = s.from;
    while (y <= s.to) {
      if (inJunc(y)) { y++; continue; }
      let y2 = y;
      while (y2 + 1 <= s.to && !inJunc(y2 + 1)) y2++;
      fill(dim, ax, y, az, bx, y2, bz, "minecraft:stone_bricks");
      fill(dim, wx0, y, wz0, wx1, y2, wz1, "minecraft:water");
      y = y2 + 1;
    }
    for (const [ja, jb] of juncs) {
      const ya = Math.max(ja, s.from), yb = Math.min(jb, s.to);
      if (ya <= yb) fill(dim, ax, ya, az, bx, yb, bz, "minecraft:water");
    }
  }
}

// writeColumn がその列に実際に書く状態(0=石/1=空気/2=水/3=マグマ)を、同じ補間計算で再現する。
// 粗い格子の標本はワールド座標の4ブロック格子に揃っているので、チャンクをまたいでも同じ値になる
function columnState(x, y, z, F, layout, cache) {
  if (y === F.y1) return 0; // 天井の皮
  const baseC = baseAt(F, layout, x);
  const chamber = inChamber(layout, F, x, z);
  const corridor = F.id >= 3 && inCorridor(layout, x, z);
  const pg = F.id <= 2 ? pathGeom(F, layout, x, z) : null;
  if (y === baseC && poolHole(layout, F, x, z)) return 1;
  if (pg) {
    if (y <= pg.floor) return 0;
    if (pg.waterY >= 0 && y >= pg.waterY && y <= Math.max(pg.waterY, pg.fallTop)) return 2;
    if (y <= pg.floor + pg.ceil) return 1;
  }
  if (y < baseC && !(F.id === 1 && !chamber && !corridor && !pg)) return 0;
  if (y === baseC) {
    if (chamber || corridor) return 0;
  }
  if (y === F.y0) return 0; // 帯の最下段の皮
  if (chamber && y <= baseC + 13) return 1;
  if (corridor && y <= baseC + 5 + Math.floor(hash3(x, 9, z, 555) * 3)) return 1;
  const rs = (sx, k, sz) => {
    const key = sx + "," + k + "," + sz;
    let v = cache.get(key);
    if (v === undefined) { v = rawScore(sx, F.y0 + k * 4, sz); cache.set(key, v); }
    return v;
  };
  const gx = Math.floor(x / 4) * 4, gz = Math.floor(z / 4) * 4;
  const fx = (x - gx) / 4, fz = (z - gz) / 4;
  const t = (y - F.y0) / 4, k = Math.floor(t), fr = t - k;
  const profAt = (sx, sz) => rs(sx, k, sz) + (rs(sx, k + 1, sz) - rs(sx, k, sz)) * fr;
  const p00 = profAt(gx, gz), p10 = profAt(gx + 4, gz), p01 = profAt(gx, gz + 4), p11 = profAt(gx + 4, gz + 4);
  const s = (p00 + (p10 - p00) * fx) * (1 - fz) + (p01 + (p11 - p01) * fx) * fz;
  if (s <= 0) return 0;
  if (y <= UG.LAVA_Y && F.id === 4) return 3;
  const wl = waterLevelAt(x, z, F);
  if (wl != null && y <= wl) return 2;
  return 1;
}

// 鉱石を置いてよい場所か。実際に石として書かれる場所にだけ置き、
// 全周が空気・水になる場所(浮き鉱石)には置かない。
// 外周・化粧層・スラブ際・構造物(プール/水路/広間/通路)・プールの穴も避ける
function oreOk(x, y, z, F, layout, box, cache) {
  if (x <= box.x0 + 1 || x >= box.x1 - 1 || z <= box.z0 + 1 || z >= box.z1 - 1) return false;
  if (y < F.y0 + 1 || y > F.y1 - 1) return false;
  if (y >= baseAt(F, layout, x) && inStructure(layout, F, x, z)) return false;
  if (y === baseAt(F, layout, x) && poolHole(layout, F, x, z)) return false;
  if (columnState(x, y, z, F, layout, cache) !== 0) return false;
  const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  for (const [dx, dy, dz] of DIRS) {
    const ny = y + dy;
    if (ny < F.y0 || ny > F.y1) return true; // 帯の外は岩盤スラブが支える
    const ns = columnState(x + dx, ny, z + dz, F, layout, cache);
    if (ns === 0 || ns === 3) return true; // 石かマグマに接している
  }
  return false;
}

function* placeOres(dim, cx, cz, x0, z0, trySet, F, layout, box) {
  const cache = new Map();
  let seed = UG.SEED + 100 + cx * 31 + cz * 17 + F.id * 7;
  const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };
  for (const o of ORES) {
    if (o.layer !== F.id) continue;
    const L = LAYERS[o.layer - 1];
    for (let i = 0; i < o.n; i++) {
      let x = x0 + Math.floor(rnd() * 16), z = z0 + Math.floor(rnd() * 16);
      let y = o.nearLava ? UG.FLOOR4 + 1 + Math.floor(rnd() * 10) : L.y0 + 4 + Math.floor(rnd() * (L.y1 - L.y0 - 8));
      if (o.layer === 4 && !o.nearLava) y = UG.FLOOR4 + 12 + Math.floor(rnd() * 40);
      if (y < F.base + 1) y = F.base + 1 + Math.floor(rnd() * 6);
      if (y > F.y1 - 4) y = F.y1 - 4;
      for (let k = 0; k < o.vein; k++) {
        if (oreOk(x, y, z, F, layout, box, cache)) trySet(dim, x, y, z, (y < 40 ? "deepslate_" : "") + o.name);
        x += Math.floor(rnd() * 3) - 1; y += Math.floor(rnd() * 3) - 1; z += Math.floor(rnd() * 3) - 1;
        if (x < x0 || x > x0 + 15 || z < z0 || z > z0 + 15) break; // 隣チャンク(完成済みの場所を含む)へは歩いていかない
      }
    }
    yield;
  }
}
