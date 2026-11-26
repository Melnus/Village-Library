import { world, system, BlockPermutation, BlockVolume } from "@minecraft/server";
import { UG, FLOORS, floorOfY, poolX, genUGFloorChunk, hash3 } from "./ug_gen.js";
import { ELEVATOR, ELEVATOR_H } from "./elevator_data.js";

// 地下ダンジョンのドライバ。CYBELE v0.0.20 (Melnus) からの移植:
// ug_gen.js / elevator_data.js は原文のまま。このファイルは生成器の外側
// (生成キュー・到着待ち・テーマ差し替え・箱の管理) を受け持つ。
//
// v029 でモデル変更 (北斗の設計): 地下は「鉱山に固定の部屋」ではなく
// 「降りるたびのラン」。ツルハシの材質で洞窟の種類を抽選し、パーティ
// (最大4人) ごとに新しい区画 (箱) を割り当てる。中に誰もいなくなった
// 箱は消滅する (ローグライク)。違うパーティが同じ箱に入ることはない。
export const ARR_Y = UG.ARR_Y;

// ===== 洞窟の種類 (バリエーション) =====
// ディメンジョンはパックで宣言した分しか使えないので、種類ごとに固定IDを用意し、
// その中では区画 (プロット) で分離する。
export const VARIANTS = [
    { id: "normal", dim: "vlib:underground", ja: "ふつうの洞窟", en: "a normal cave" },
    { id: "horde", dim: "vlib:ug_horde", ja: "敵が大量の洞窟", en: "a monster-infested cave" },
    { id: "flooded", dim: "vlib:ug_flooded", ja: "水没した洞窟", en: "a flooded cave" },
    { id: "coal", dim: "vlib:ug_coal", ja: "石炭の洞窟", en: "a coal cave" },
    { id: "crystal", dim: "vlib:ug_crystal", ja: "水晶の洞窟", en: "an amethyst cave" },
    { id: "quartz", dim: "vlib:ug_quartz", ja: "ネザークォーツの洞窟", en: "a nether quartz cave" },
    { id: "raw", dim: "vlib:ug_raw", ja: "原石ブロックの洞窟", en: "a raw-block cave" },
    { id: "ore", dim: "vlib:ug_ore", ja: "鉱石の洞窟", en: "an ore cave" },
    { id: "debris", dim: "vlib:ug_debris", ja: "古代の残骸の洞窟", en: "an ancient debris cave" },
];
export function variantById(id) { return VARIANTS.find((v) => v.id === id) || VARIANTS[0]; }
export function dimIdOf(run) { return variantById(run.variant).dim; }
export function isUGDim(id) { return VARIANTS.some((v) => v.dim === id); }

// ツルハシの材質 -> 抽選プール (重み)
export const PICKAXE_TIER = {
    "minecraft:wooden_pickaxe": "shabby",
    "minecraft:stone_pickaxe": "shabby",
    "minecraft:copper_pickaxe": "shabby",
    "minecraft:iron_pickaxe": "mid",
    "minecraft:golden_pickaxe": "rare",
    "minecraft:diamond_pickaxe": "rare",
    "minecraft:netherite_pickaxe": "rare",
};
const POOLS = {
    shabby: [["normal", 40], ["flooded", 25], ["coal", 25], ["horde", 10]],
    mid: [["normal", 25], ["flooded", 10], ["coal", 15], ["horde", 5], ["crystal", 15], ["quartz", 15], ["raw", 15]],
    rare: [["normal", 10], ["crystal", 20], ["quartz", 15], ["raw", 20], ["ore", 25], ["debris", 10]],
};
export function drawVariant(tier) {
    const pool = POOLS[tier] || POOLS.shabby;
    let total = 0; for (const [, w] of pool) total += w;
    let r = Math.random() * total;
    for (const [id, w] of pool) { r -= w; if (r < 0) return variantById(id); }
    return variantById(pool[pool.length - 1][0]);
}

const DONE_KEY = "vlib:ugd";
const RUNS_KEY = "vlib:runs";
const SLOT_KEY = "vlib:ugslot"; // 地下プロットの通し番号 (使い回さない)
const RAD_UG = 5;

function isUnloaded(e) {
    const s = String(e && (e.name || "")) + " " + String(e && (e.message || ""));
    return /unloaded|LocationInUnloadedChunk|LocationOutOfWorld/i.test(s);
}
function report(tag, e) { console.warn("[VillageLibrary:" + tag + "] " + String(e && e.message ? e.message : e)); }

// ===== ブロック設置 (CYBELE main.js から) =====
let fillMode = "volume";
function fill(dim, x1, y1, z1, x2, y2, z2, type) {
    if (y2 < y1) return;
    const a = { x: Math.min(x1, x2), y: y1, z: Math.min(z1, z2) };
    const b = { x: Math.max(x1, x2), y: y2, z: Math.max(z1, z2) }; // v032: ここが min だったため、体積フィルが z 最小面の板に潰れていた (箱の消滅が面しか消せなかった主因)
    if (fillMode === "volume") {
        try { dim.fillBlocks(new BlockVolume(a, b), type); return; }
        catch (e) {
            if (isUnloaded(e)) throw e;
            if (e && e.name === "TypeError") fillMode = "legacy";
            else throw e;
        }
    }
    dim.fillBlocks(a, b, type);
}
const badBlocks = new Set();
function trySet(dim, x, y, z, name, states) {
    const id = name.includes(":") ? name : "minecraft:" + name;
    if (badBlocks.has(id)) return;
    try {
        const b = dim.getBlock({ x, y, z });
        if (!b) return;
        let perm;
        if (states) { try { perm = BlockPermutation.resolve(id, states); } catch { perm = BlockPermutation.resolve(id); } }
        else perm = BlockPermutation.resolve(id);
        b.setPermutation(perm);
    } catch (e) {
        if (isUnloaded(e)) return;
        badBlocks.add(id); report("ブロック " + id, e);
    }
}

// ===== プロット割り当て =====
function plotForSlot(n) { return { px: 12000 + (n % 64) * 256, pz: 12000 + Math.floor(n / 64) * 256 }; }
function allocPlot() {
    let n = 0;
    try { const v = world.getDynamicProperty(SLOT_KEY); if (typeof v === "number" && v >= 0) n = Math.floor(v); } catch {}
    try { world.setDynamicProperty(SLOT_KEY, n + 1); } catch {}
    return plotForSlot(n);
}

// ===== ラン (1回の降下 = 1つの箱) =====
// run = { key, variant, px, pz, ox, oy, oz, dim, rot, born, restored, dying, annihilating, genActive }
// (ox..rot は帰り先の鉱山。key は px,pz で一意)
const runs = new Map();
let runsLoaded = false;
function saveRuns() {
    try {
        const list = [...runs.values()].map((r) => ({ key: r.key, variant: r.variant, px: r.px, pz: r.pz, ox: r.ox, oy: r.oy, oz: r.oz, dim: r.dim, rot: r.rot }));
        world.setDynamicProperty(RUNS_KEY, JSON.stringify(list));
    } catch {}
}
function loadRuns() {
    if (runsLoaded) return;
    runsLoaded = true;
    try {
        const s = world.getDynamicProperty(RUNS_KEY);
        if (typeof s === "string" && s) {
            const list = JSON.parse(s);
            if (Array.isArray(list)) for (const r of list) {
                if (r && typeof r.px === "number") runs.set(r.key, { ...r, born: system.currentTick, restored: true, dying: false, annihilating: false, genActive: 0, prep: false });
            }
        }
    } catch {}
}
export function runsList() { loadRuns(); return [...runs.values()]; }
export function runsForMine(mine) {
    loadRuns();
    return [...runs.values()].filter((r) => r.ox === mine.ox && r.oy === mine.oy && r.oz === mine.oz && r.dim === (mine.dim || "minecraft:overworld"));
}
export function boxFor(run) {
    const cx = run.px - UG.ARR_OFF, cz = run.pz;
    return { x0: cx - UG.BOX_HALF, x1: cx + UG.BOX_HALF - 1, z0: cz - UG.BOX_HALF, z1: cz + UG.BOX_HALF - 1, ox: cx, oz: cz };
}
function boxContainsXZ(run, x, z) { const b = boxFor(run); return x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1; }
export function runAt(dimId, loc) {
    loadRuns();
    for (const r of runs.values()) {
        if (dimIdOf(r) !== dimId) continue;
        if (boxContainsXZ(r, loc.x, loc.z)) return r;
    }
    return undefined;
}
export function occupantsOf(run) {
    return world.getAllPlayers().filter((p) => p.dimension && p.dimension.id === dimIdOf(run) && boxContainsXZ(run, p.location.x, p.location.z) && p.location.y >= UG.BOT && p.location.y <= UG.TOP);
}
// 到着広間の鉄床 (エレベーター床 3x3) に含まれるランを返す (帰還用)
export function atriumRunAt(dimId, pos) {
    loadRuns();
    for (const r of runs.values()) {
        if (dimIdOf(r) !== dimId) continue;
        if (pos.y === ARR_Y && Math.abs(pos.x - r.px) <= 1 && Math.abs(pos.z - r.pz) <= 1) return r;
    }
    return undefined;
}

// ===== 生成済み管理 (ランごと) =====
const doneSets = new Map(); // run.key -> Set<"f:cx,cz">
let doneDirty = false;
function doneSet(run) {
    let s = doneSets.get(run.key);
    if (!s) {
        s = new Set();
        try {
            const raw = world.getDynamicProperty(DONE_KEY);
            if (typeof raw === "string" && raw) { const all = JSON.parse(raw); if (Array.isArray(all[run.key])) for (const v of all[run.key]) s.add(v); }
        } catch {}
        doneSets.set(run.key, s);
    }
    return s;
}
function saveDone() {
    if (!doneDirty) return;
    doneDirty = false;
    try {
        const all = {};
        for (const [k, s] of doneSets) if (s.size) all[k] = [...s];
        world.setDynamicProperty(DONE_KEY, JSON.stringify(all));
    } catch {}
}
function isDone(run, f, cx, cz) { return doneSet(run).has(f + ":" + cx + "," + cz); }
function setDone(run, f, cx, cz) { doneSet(run).add(f + ":" + cx + "," + cz); doneDirty = true; }
function inBox(box, cx, cz) {
    return cx >= Math.floor(box.x0 / 16) && cx <= Math.floor(box.x1 / 16) && cz >= Math.floor(box.z0 / 16) && cz <= Math.floor(box.z1 / 16);
}

// ===== 生成キューとジョブ =====
const queue = [];
const queued = new Set();
const failUntil = new Map();
let jobRunning = false;
function qKey(run, f, cx, cz) { return run.key + "|" + f + ":" + cx + "," + cz; }

function ensureFloor(run, f, fx, fz) {
    const box = boxFor(run);
    const items = [];
    const cx0 = Math.floor(box.x0 / 16), cx1 = Math.floor(box.x1 / 16), cz0 = Math.floor(box.z0 / 16), cz1 = Math.floor(box.z1 / 16);
    for (let cz = cz0; cz <= cz1; cz++) for (let cx = cx0; cx <= cx1; cx++) {
        if (isDone(run, f, cx, cz)) continue;
        const k = qKey(run, f, cx, cz);
        if (queued.has(k)) continue;
        const dx = cx * 16 + 8 - fx, dz = cz * 16 + 8 - fz;
        items.push({ run, f, cx, cz, d: dx * dx + dz * dz });
        queued.add(k);
    }
    items.sort((a, b) => a.d - b.d);
    for (const it of items) queue.push(it);
}

// flooded: 生成済みチャンクの空気を、天井の下に余白を残して水で満たす。
// 1セルずつ setType すると実機で遅いので、柱ごとに空気の連続区間をまとめて fill する。
function* floodChunk(dim, f, cx, cz) {
    const F = FLOORS[f - 1];
    const top = F.y1 - 16; // 到着階 (第1階) では到着台が水面より上に出る
    let n = 0;
    for (let x = cx * 16; x < cx * 16 + 16; x++) for (let z = cz * 16; z < cz * 16 + 16; z++) {
        let runStart = -1;
        for (let y = F.y0; y <= top + 1; y++) {
            let isAir = false;
            if (y <= top) { try { const b = dim.getBlock({ x, y, z }); isAir = !!b && b.typeId === "minecraft:air"; } catch {} }
            if (isAir && runStart < 0) runStart = y;
            if (!isAir && runStart >= 0) { fill(dim, x, runStart, z, x, y - 1, z, "minecraft:water"); runStart = -1; }
            if (++n % 2048 === 0) yield;
        }
    }
}

// テーマ洞窟: 洞窟の壁 (空気に接した岩) をテーマブロックに差し替える。
// 表面を一巡したあと、差し替えたブロックに接した岩も少しだけ差し替えて厚みを持たせる。
const THEME_HOSTS = ["minecraft:stone", "minecraft:deepslate"];
function themePick(variant, host) {
    const r = Math.random();
    switch (variant) {
        case "coal":
            if (r < 0.015) return "minecraft:tnt";
            if (r < 0.175) return "minecraft:coal_block";
            return null;
        case "crystal":
            if (r < 0.03) return "minecraft:budding_amethyst";
            if (r < 0.13) return "minecraft:amethyst_block";
            return null;
        case "quartz":
            if (r < 0.12) return "minecraft:quartz_ore";
            return null;
        case "raw":
            if (r < 0.06) return "minecraft:raw_iron_block";
            if (r < 0.105) return "minecraft:raw_gold_block";
            if (r < 0.15) return "minecraft:raw_copper_block";
            return null;
        case "ore": {
            const p = host === "minecraft:deepslate" ? "deepslate_" : "";
            if (r < 0.012) return "minecraft:" + p + "diamond_ore";
            if (r < 0.018) return "minecraft:" + p + "emerald_ore";
            if (r < 0.036) return "minecraft:" + p + "gold_ore";
            if (r < 0.066) return "minecraft:" + p + "iron_ore";
            if (r < 0.078) return "minecraft:" + p + "lapis_ore";
            if (r < 0.090) return "minecraft:" + p + "redstone_ore";
            if (r < 0.102) return "minecraft:" + p + "copper_ore";
            if (r < 0.110) return "minecraft:" + p + "coal_ore";
            return null;
        }
        case "debris":
            if (r < 0.008) return "minecraft:ancient_debris";
            return null;
    }
    return null;
}
const THEME_IDS = {
    coal: ["minecraft:coal_block", "minecraft:tnt"],
    crystal: ["minecraft:amethyst_block", "minecraft:budding_amethyst"],
    quartz: ["minecraft:quartz_ore"],
    raw: ["minecraft:raw_iron_block", "minecraft:raw_gold_block", "minecraft:raw_copper_block"],
    ore: ["minecraft:diamond_ore", "minecraft:emerald_ore", "minecraft:gold_ore", "minecraft:iron_ore", "minecraft:lapis_ore", "minecraft:redstone_ore", "minecraft:copper_ore", "minecraft:coal_ore", "minecraft:deepslate_diamond_ore", "minecraft:deepslate_emerald_ore", "minecraft:deepslate_gold_ore", "minecraft:deepslate_iron_ore", "minecraft:deepslate_lapis_ore", "minecraft:deepslate_redstone_ore", "minecraft:deepslate_copper_ore", "minecraft:deepslate_coal_ore"],
    debris: ["minecraft:ancient_debris"],
};
function* themeChunk(dim, run, f, cx, cz, tntOut) {
    const ids = THEME_IDS[run.variant];
    if (!ids) return;
    const F = FLOORS[f - 1];
    const idSet = new Set(ids);
    const typeAt = (x, y, z) => { try { const b = dim.getBlock({ x, y, z }); return b ? b.typeId : null; } catch { return null; } };
    const isSurface = (x, y, z) => {
        for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
            const t = typeAt(x + dx, y + dy, z + dz);
            if (t === "minecraft:air" || t === "minecraft:water") return true;
        }
        return false;
    };
    const touchesTheme = (x, y, z) => {
        for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
            if (idSet.has(typeAt(x + dx, y + dy, z + dz))) return true;
        }
        return false;
    };
    let n = 0;
    for (let pass = 0; pass < 2; pass++) {
        for (let y = F.y0; y <= F.y1; y++) for (let x = cx * 16; x < cx * 16 + 16; x++) for (let z = cz * 16; z < cz * 16 + 16; z++) {
            const t = typeAt(x, y, z);
            if (t && THEME_HOSTS.includes(t)) {
                const hit = pass === 0 ? isSurface(x, y, z) : touchesTheme(x, y, z);
                if (hit) {
                    const pick = themePick(run.variant, t);
                    if (pick && (pass === 0 || Math.random() < 0.6)) {
                        trySet(dim, x, y, z, pick);
                        if (pick === "minecraft:tnt" && tntOut) tntOut.push({ x, y, z });
                    }
                }
            }
            if (++n % 2048 === 0) yield;
        }
    }
}

function* genJob(run, f, cx, cz) {
    const k = "ug" + f + ":" + cx + "," + cz + "@" + run.key;
    queued.delete(qKey(run, f, cx, cz));
    run.genActive = (run.genActive || 0) + 1;
    try {
        if (runs.get(run.key) !== run || run.dying) return;
        const box = boxFor(run);
        const dim = world.getDimension(dimIdOf(run));
        const env = { fill, trySet, box, isDone: (ff, ccx, ccz) => !inBox(box, ccx, ccz) || isDone(run, ff, ccx, ccz) };
        yield* genUGFloorChunk(dim, f, cx, cz, env);
        setDone(run, f, cx, cz);
        const tnts = [];
        if (run.variant === "flooded") yield* floodChunk(dim, f, cx, cz);
        else if (THEME_IDS[run.variant]) yield* themeChunk(dim, run, f, cx, cz, tnts);
        // 石炭の洞窟: 埋めた TNT のうち1つがたまに本当に起爆して地形をえぐる
        if (run.variant === "coal" && tnts.length && Math.random() < 0.10) {
            const t = tnts[Math.floor(Math.random() * tnts.length)];
            try { dim.spawnEntity("minecraft:tnt", { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 }); } catch {}
            trySet(dim, t.x, t.y, t.z, "minecraft:air");
        }
        // ポケット: 降り口プールのチャンクなら、下の階の着き場チャンクを先に作る (CYBELE と同じ)
        if (f < 4) {
            const dep = poolX(f, "dep", box.ox);
            if (dep != null && cx === Math.floor(dep / 16) && cz === Math.floor(box.oz / 16)) {
                const arrX = poolX(f + 1, "arr", box.ox);
                const pcx0 = Math.floor((arrX - 9) / 16), pcx1 = Math.floor((arrX + 9) / 16);
                const pcz0 = Math.floor((box.oz - 9) / 16), pcz1 = Math.floor((box.oz + 9) / 16);
                for (let pcx = pcx0; pcx <= pcx1; pcx++) for (let pcz = pcz0; pcz <= pcz1; pcz++) {
                    if (!inBox(box, pcx, pcz) || isDone(run, f + 1, pcx, pcz)) continue;
                    yield* genUGFloorChunk(dim, f + 1, pcx, pcz, env);
                    setDone(run, f + 1, pcx, pcz);
                    if (run.variant === "flooded") yield* floodChunk(dim, f + 1, pcx, pcz);
                    else if (THEME_IDS[run.variant]) yield* themeChunk(dim, run, f + 1, pcx, pcz, null);
                }
            }
        }
    } catch (e) {
        if (isUnloaded(e)) {
            failUntil.set(k, system.currentTick + 40);
            // 未読み込みは一時的な失敗なので、自分でキューへ戻す。
            // (準備中のランは ensureFloor を呼び直す人がいないため、戻さないと二度と生成されない)
            const qk = qKey(run, f, cx, cz);
            if (runs.get(run.key) === run && !run.dying && !queued.has(qk)) { queued.add(qk); queue.push({ run, f, cx, cz }); }
        }
        else { failUntil.set(k, system.currentTick + 600); report("地下生成", e); }
    } finally {
        run.genActive = Math.max(0, (run.genActive || 1) - 1);
        jobRunning = false;
    }
}

// ===== 到着待ち =====
const pending = new Map(); // player.id -> { run, since, cb, area }
function areaName(player) { return "vlib_ug_" + String(player.id).slice(-5); }
function addArea(player, run) {
    const name = areaName(player);
    const gcx = Math.floor(run.px / 16), gcz = Math.floor(run.pz / 16);
    const dim = world.getDimension(dimIdOf(run));
    try { dim.runCommand("tickingarea remove " + name); } catch {}
    try {
        dim.runCommand("tickingarea add " + ((gcx - 2) * 16) + " 150 " + ((gcz - 2) * 16) + " " + ((gcx + 2) * 16 + 15) + " 319 " + ((gcz + 2) * 16 + 15) + " " + name);
    } catch (e) { report("先読み", e); }
    return name;
}
function removeArea(name, run) {
    try { world.getDimension(run ? dimIdOf(run) : "vlib:underground").runCommand("tickingarea remove " + name); } catch {}
}
export function pendingOf(playerId) { return pending.get(playerId); }
export function hasPendingForRun(run) { for (const st of pending.values()) if (st.run === run) return true; return false; }

// ラン作成 (v031): 箱を用意して全階の生成をキューに入れるところまで。
// prep の間は誰も降りていない (出発準備中)。生成は地上で待っている間に進む。
export function createRun(mine, variant) {
    loadRuns();
    const pl = allocPlot();
    const run = {
        key: pl.px + "," + pl.pz, variant: variant.id, px: pl.px, pz: pl.pz,
        ox: mine.ox, oy: mine.oy, oz: mine.oz, dim: mine.dim || "minecraft:overworld", rot: mine.rot || 0,
        born: system.currentTick, restored: false, dying: false, annihilating: false, genActive: 0, prep: true,
    };
    runs.set(run.key, run);
    saveRuns();
    // 生成にはチャンクの読み込みが要る。誰も地下にいない準備中でも生成が進むよう、
    // 箱の範囲に生成用のティッキングエリアを張る (搭乗時に外す)。
    try {
        const dim = world.getDimension(dimIdOf(run));
        const gcx = Math.floor(run.px / 16), gcz = Math.floor(run.pz / 16);
        dim.runCommand("tickingarea add " + ((gcx - 3) * 16) + " -64 " + ((gcz - 3) * 16) + " " + ((gcx + 3) * 16 + 15) + " 319 " + ((gcz + 3) * 16 + 15) + " vlib_ug_gen_" + run.px + "_" + run.pz);
    } catch {}
    for (let f = 1; f <= 4; f++) ensureFloor(run, f, run.px, run.pz);
    return run;
}

// 搭乗: prep 中のランにプレイヤーを乗せる。到着広間ができていればすぐ、
// まだなら生成完了を待ってからテレポートする (arrivalTick が見る)。
// cb = { onProgress(player, sec, progress{done,total}), onArrived(player), onFailed(player) }
export function boardRun(run, players, cb) {
    run.prep = false;
    saveRuns();
    for (const p of players) {
        if (pending.has(p.id)) continue;
        const area = addArea(p, run);
        pending.set(p.id, { run, since: system.currentTick, cb, area });
    }
    // 生成用エリアは搭乗側のエリアに引き継いで外す
    try { world.getDimension(dimIdOf(run)).runCommand("tickingarea remove vlib_ug_gen_" + run.px + "_" + run.pz); } catch {}
    return run;
}

// ラン開始 (コマンド入口用): 作成して即搭乗。
export function startRun(mine, variant, players, cb) {
    const run = createRun(mine, variant);
    return boardRun(run, players, cb);
}

// 指定した階の全チャンクが生成済みか
export function isFloorDone(run, f) {
    const box = boxFor(run);
    for (let cz = Math.floor(box.z0 / 16); cz <= Math.floor(box.z1 / 16); cz++)
        for (let cx = Math.floor(box.x0 / 16); cx <= Math.floor(box.x1 / 16); cx++)
            if (!isDone(run, f, cx, cz)) return false;
    return true;
}

// 第1階の生成進捗 {done, total} (待ち時間のゲージ表示用)
export function genProgress(run) {
    const box = boxFor(run);
    let done = 0, total = 0;
    for (let cz = Math.floor(box.z0 / 16); cz <= Math.floor(box.z1 / 16); cz++)
        for (let cx = Math.floor(box.x0 / 16); cx <= Math.floor(box.x1 / 16); cx++) { total++; if (isDone(run, 1, cx, cz)) done++; }
    return { done, total };
}

// 到着広間の 3x3 チャンク (第1階) が生成済みか (出発ゲートの判定用)。
// 箱全体の完成を待つと実機では数分かかるため、出発は広間ができ次第にする。
// 残りのチャンクはキューが近い順に生成し続けるので、探索より先行する。
export function isAtriumReady(run) {
    const gcx = Math.floor(run.px / 16), gcz = Math.floor(run.pz / 16);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (inBox(boxFor(run), gcx + dx, gcz + dz) && !isDone(run, 1, gcx + dx, gcz + dz)) return false;
    }
    return true;
}

function arrivalTick() {
    for (const [id, st] of [...pending]) {
        const p = world.getAllPlayers().find((q) => q.id === id);
        if (!p) { pending.delete(id); continue; }
        const run = st.run;
        try {
            if (runs.get(run.key) !== run || run.dying) { pending.delete(id); continue; }
            const ready = isAtriumReady(run);
            if (!ready) {
                const elapsed = system.currentTick - st.since;
                if (elapsed > 2400) { st.cb.onFailed && st.cb.onFailed(p); removeArea(st.area, run); pending.delete(id); }
                else if (elapsed % 20 === 0) { st.cb.onProgress && st.cb.onProgress(p, Math.floor(elapsed / 20), genProgress(run)); }
                continue;
            }
            const dim = world.getDimension(dimIdOf(run));
            let b;
            try { b = dim.getBlock({ x: run.px, y: ARR_Y, z: run.pz }); } catch { b = undefined; }
            if (!b) {
                const elapsed = system.currentTick - st.since;
                if (elapsed > 2400) { st.cb.onFailed && st.cb.onFailed(p); removeArea(st.area, run); pending.delete(id); }
                else {
                    // 生成済みでもチャンクがまだ読めない間は無言で待たせない。
                    // ティッキングエリアを定期的に張り直し、生成中と同じ案内を出し続ける。
                    if (elapsed % 100 === 0) st.area = addArea(p, run);
                    if (elapsed % 20 === 0) st.cb.onProgress && st.cb.onProgress(p, Math.floor(elapsed / 20), genProgress(run));
                }
                continue;
            }
            if (b.typeId !== "minecraft:iron_block") buildAtrium(dim, run.px, run.pz);
            p.teleport({ x: run.px + 0.5, y: ARR_Y + 1, z: run.pz + 0.5 }, { dimension: dim });
            st.cb.onArrived && st.cb.onArrived(p);
            pending.delete(id);
            const name = st.area;
            system.runTimeout(() => removeArea(name, run), 200);
        } catch (e) {
            if (isUnloaded(e)) continue;
            report("地下到着", e); removeArea(st.area, run); pending.delete(id);
        }
    }
}

// ===== エレベーターと到着の広間 (CYBELE main.js から) =====
function placeElevator(dim, cx, base, cz) {
    fill(dim, cx - 2, base + 1, cz - 2, cx + 2, base + ELEVATOR_H - 1, cz + 2, "minecraft:air");
    for (const [dx, dy, dz, name, states] of ELEVATOR) {
        const blk = dim.getBlock({ x: cx + dx, y: base + dy, z: cz + dz });
        if (!blk) throw Object.assign(new Error("chunk not loaded"), { name: "LocationInUnloadedChunkError" });
        let perm;
        try { perm = BlockPermutation.resolve(name, states); }
        catch { perm = BlockPermutation.resolve(name); }
        blk.setPermutation(perm);
    }
}

function buildAtrium(dim, gx, gz) {
    const Y = UG.ARR_Y, TOP = UG.TOP;
    for (let dx = -15; dx <= 15; dx++) {
        for (let dz = -15; dz <= 15; dz++) {
            const r2 = dx * dx + dz * dz;
            if (r2 > 225) continue;
            const x = gx + dx, z = gz + dz;
            const d = Math.sqrt(r2);
            const mouthR = 9 + hash3(x, 7, z, 991) * 5;
            const platR = 8 + hash3(x, 21, z, 993) * 4;
            if (d <= platR) {
                const step = d > platR - 1.5 && hash3(x, 27, z, 999) < 0.4 ? 1 : 0;
                const fy = Y - step;
                fill(dim, x, Y - 8, z, x, fy - 1, z, "minecraft:dirt");
                fill(dim, x, fy + 1, z, x, TOP - 1, z, "minecraft:air");
                fill(dim, x, fy, z, x, fy, z, hash3(x, 33, z, 1001) < 0.8 ? "minecraft:moss_block" : "minecraft:dirt");
            } else if (d <= mouthR) {
                if (hash3(x, 31, z, 995) < 0.82) fill(dim, x, Y + 1, z, x, TOP - 1, z, "minecraft:air");
            } else if (d <= mouthR + 1.5) {
                fill(dim, x, TOP - 3, z, x, TOP - 1, z, "minecraft:stone");
                const h = hash3(x, 13, z, 997);
                if (h < 0.3) trySet(dim, x, TOP - 5, z, "pointed_dripstone", { hanging: true, dripstone_thickness: "tip" });
                else if (h < 0.55) trySet(dim, x, TOP - 5, z, "cave_vines");
            }
        }
    }
    for (let dx = -13; dx <= 13; dx++) {
        for (let dz = -13; dz <= 13; dz++) {
            const r2 = dx * dx + dz * dz;
            if (r2 > 169) continue;
            const x = gx + dx, z = gz + dz;
            const d = Math.sqrt(r2);
            const platR = 8 + hash3(x, 21, z, 993) * 4;
            if (d > platR) continue;
            const step = d > platR - 1.5 && hash3(x, 27, z, 999) < 0.4 ? 1 : 0;
            const fy = Y - step;
            const dens = d > platR - 3.5 ? 0.5 : 0.2;
            const h = hash3(x, 41, z, 1003);
            if (h >= dens) {
                if (h < dens + 0.12) trySet(dim, x, fy + 1, z, "moss_carpet");
                continue;
            }
            if (h < dens * 0.35) {
                trySet(dim, x, fy + 1, z, "large_fern", { upper_block_bit: false });
                trySet(dim, x, fy + 2, z, "large_fern", { upper_block_bit: true });
            } else {
                trySet(dim, x, fy + 1, z, "fern");
            }
        }
    }
    placeElevator(dim, gx, Y, gz);
}

// ===== 生成トリガー =====
function triggerTick() {
    loadRuns();
    for (const p of world.getAllPlayers()) {
        if (!p.dimension || !isUGDim(p.dimension.id)) continue;
        const run = runAt(p.dimension.id, p.location);
        if (!run || run.dying) continue;
        const loc = p.location;
        const f = floorOfY(loc.y);
        ensureFloor(run, f, loc.x, loc.z);
        if (f < 4) {
            const box = boxFor(run);
            const dep = poolX(f, "dep", box.ox);
            if (dep != null) {
                const dx = loc.x - dep, dz = loc.z - box.oz;
                if (dx * dx + dz * dz <= 36 && loc.y < FLOORS[f - 1].base + 6) ensureFloor(run, f + 1, poolX(f + 1, "arr", box.ox), box.oz);
            }
        }
    }
}

function pickNext(getMines) {
    const now = system.currentTick;
    const failed = (run, f, cx, cz) => { const fu = failUntil.get("ug" + f + ":" + cx + "," + cz + "@" + run.key); return fu && fu > now; };
    // 1) 到着準備中の 3x3 (第1階) を最優先
    for (const st of pending.values()) {
        const run = st.run;
        if (runs.get(run.key) !== run || run.dying) continue;
        const gcx = Math.floor(run.px / 16), gcz = Math.floor(run.pz / 16);
        let best = null, bd = Infinity;
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
            const d = dx * dx + dz * dz;
            const cx = gcx + dx, cz = gcz + dz;
            if (d < bd && inBox(boxFor(run), cx, cz) && !isDone(run, 1, cx, cz) && !failed(run, 1, cx, cz)) { bd = d; best = { run, f: 1, cx, cz }; }
        }
        if (best) return best;
    }
    // 2) 階の生成キュー (失敗中の一時的なものは捨てずに後ろへ回す:
    //     準備中のランは再キューする人がいないので、捨てると二度と生成されない)
    let spins = queue.length;
    while (queue.length && spins-- > 0) {
        const it = queue.shift();
        if (runs.get(it.run.key) !== it.run || it.run.dying) { queued.delete(qKey(it.run, it.f, it.cx, it.cz)); continue; }
        if (isDone(it.run, it.f, it.cx, it.cz)) { queued.delete(qKey(it.run, it.f, it.cx, it.cz)); continue; }
        if (failed(it.run, it.f, it.cx, it.cz)) { queue.push(it); continue; }
        return it;
    }
    // 3) 地下にいるプレイヤーの今いる階の周り
    let best = null, bd = Infinity;
    for (const p of world.getAllPlayers()) {
        if (!p.dimension || !isUGDim(p.dimension.id)) continue;
        const run = runAt(p.dimension.id, p.location);
        if (!run || run.dying) continue;
        const box = boxFor(run);
        const f = floorOfY(p.location.y);
        const cxc = Math.floor(p.location.x / 16), czc = Math.floor(p.location.z / 16);
        for (let dz = -RAD_UG; dz <= RAD_UG; dz++) for (let dx = -RAD_UG; dx <= RAD_UG; dx++) {
            const d = dx * dx + dz * dz;
            const cx = cxc + dx, cz = czc + dz;
            if (d > RAD_UG * RAD_UG || d >= bd) continue;
            if (!inBox(box, cx, cz) || isDone(run, f, cx, cz) || failed(run, f, cx, cz)) continue;
            bd = d; best = { run, f, cx, cz };
        }
    }
    return best;
}

// ===== 箱の封じ込め: 天井の隙間や奈落など、箱の外に出たらスタート地点に戻す =====
const homeRun = new Map(); // player.id -> 最後に箱の中にいたラン
function inRunBox(run, x, y, z) {
    const b = boxFor(run);
    return x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && y >= UG.BOT && y <= UG.TOP;
}
function containmentTick(getMines) {
    loadRuns();
    for (const p of world.getAllPlayers()) {
        if (!p.dimension || !isUGDim(p.dimension.id)) { homeRun.delete(p.id); continue; }
        const here = runsList().filter((r) => dimIdOf(r) === p.dimension.id && !r.dying);
        const l = p.location;
        const inside = here.find((r) => inRunBox(r, l.x, l.y, l.z));
        if (inside) {
            // 箱の内側でも、足元のチャンクが未生成なら奈落の上にいるのと同じ。
            // 落ち切る前に広間へ戻す (v031: 生成前乗り込みへの保険)。
            const f = Math.min(4, Math.max(1, floorOfY(l.y)));
            if (isDone(inside, f, Math.floor(l.x / 16), Math.floor(l.z / 16))) { homeRun.set(p.id, inside); continue; }
            try {
                p.teleport({ x: inside.px + 0.5, y: ARR_Y + 1, z: inside.pz + 0.5 }, { dimension: world.getDimension(dimIdOf(inside)) });
                homeRun.set(p.id, inside);
                try { p.onScreenDisplay.setActionBar("§b[Village Library]§r 箱の外に出たのでスタート地点に戻しました"); } catch {}
            } catch (e) { report("封じ込め", e); }
            continue;
        }
        let target = homeRun.get(p.id);
        if (target && !here.some((r) => r.key === target.key)) target = undefined;
        if (!target && here.length) { // 記録がなければ一番近い箱のスタート地点へ
            let bd = Infinity;
            for (const r of here) { const dx = l.x - r.px, dz = l.z - r.pz; const dd = dx * dx + dz * dz; if (dd < bd) { bd = dd; target = r; } }
        }
        if (target) {
            try {
                p.teleport({ x: target.px + 0.5, y: ARR_Y + 1, z: target.pz + 0.5 }, { dimension: world.getDimension(dimIdOf(target)) });
                homeRun.set(p.id, target);
                try { p.onScreenDisplay.setActionBar("§b[Village Library]§r 箱の外に出たのでスタート地点に戻しました"); } catch {}
            } catch (e) { report("封じ込め", e); }
            continue;
        }
        // どの箱にも属さない孤児 (再読み込みで消えたラン等): 一番近い鉱山の前へ逃がす
        const mines = getMines();
        if (mines.length) {
            const m = mines[0];
            try { p.teleport({ x: m.ox + 3.5, y: m.oy, z: m.oz - 2.5 }, { dimension: world.getDimension(m.dim || "minecraft:overworld") }); } catch {}
        }
    }
}

// ===== horde: 中にいる間、敵が湧き続ける =====
const HORDE_TYPES = ["minecraft:zombie", "minecraft:skeleton", "minecraft:spider", "minecraft:creeper", "minecraft:husk", "minecraft:stray"];
function hordeTick() {
    loadRuns();
    for (const run of runs.values()) {
        if (run.variant !== "horde" || run.dying) continue;
        const dim = world.getDimension(dimIdOf(run));
        const box = boxFor(run);
        for (const p of occupantsOf(run)) {
            const l = p.location;
            let near = 0;
            try { for (const e of dim.getEntities({ location: l, maxDistance: 40 })) if (HORDE_TYPES.includes(e.typeId)) near++; } catch {}
            if (near >= 24) continue;
            for (let i = 0; i < 2; i++) {
                const ang = Math.random() * Math.PI * 2, dist = 12 + Math.random() * 10;
                const sx = Math.floor(l.x + Math.cos(ang) * dist), sz = Math.floor(l.z + Math.sin(ang) * dist);
                if (sx < box.x0 || sx > box.x1 || sz < box.z0 || sz > box.z1) continue;
                for (let y = Math.min(Math.floor(l.y) + 6, UG.TOP); y > l.y - 12 && y > UG.BOT; y--) {
                    try {
                        const b = dim.getBlock({ x: sx, y, z: sz });
                        const above = dim.getBlock({ x: sx, y: y + 1, z: sz });
                        if (b && above && b.typeId !== "minecraft:air" && b.typeId !== "minecraft:water" && above.typeId === "minecraft:air") {
                            dim.spawnEntity(HORDE_TYPES[Math.floor(Math.random() * HORDE_TYPES.length)], { x: sx + 0.5, y: y + 1, z: sz + 0.5 });
                            break;
                        }
                    } catch { break; }
                }
            }
        }
    }
}

// ===== 箱の消滅: 誰もいなくなった箱は空気に戻す (ローグライク) =====
export function annihilateRun(run) {
    loadRuns();
    if (runs.get(run.key) === run) run.dying = true;
}
function* annihilateJob(run) {
    const dim = world.getDimension(dimIdOf(run));
    const name = "vlib_ug_dead_" + run.px + "_" + run.pz;
    const gcx = Math.floor(run.px / 16), gcz = Math.floor(run.pz / 16);
    try { dim.runCommand("tickingarea remove vlib_ug_gen_" + run.px + "_" + run.pz); } catch {}
    try { dim.runCommand("tickingarea remove " + name); } catch {}
    try { dim.runCommand("tickingarea add " + ((gcx - 3) * 16) + " -64 " + ((gcz - 3) * 16) + " " + ((gcx + 3) * 16 + 15) + " 319 " + ((gcz + 3) * 16 + 15) + " " + name); } catch {}
    const box = boxFor(run);
    // 中に残ったドロップやモブも一緒に消す
    try {
        for (const e of dim.getEntities({ location: { x: run.px, y: 128, z: run.pz }, maxDistance: 200 })) {
            if (e.typeId === "minecraft:player") continue;
            const l = e.location;
            if (l.x >= box.x0 && l.x <= box.x1 && l.z >= box.z0 && l.z <= box.z1) { try { e.remove(); } catch {} }
        }
    } catch {}
    for (let cx = Math.floor(box.x0 / 16); cx <= Math.floor(box.x1 / 16); cx++) {
        for (let cz = Math.floor(box.z0 / 16); cz <= Math.floor(box.z1 / 16); cz++) {
            for (let y = UG.BOT; y <= 256; y += 48) {
                let tries = 0;
                while (true) {
                    try { fill(dim, cx * 16, y, cz * 16, cx * 16 + 15, Math.min(y + 47, 256), cz * 16 + 15, "minecraft:air"); break; }
                    catch (e) { if (isUnloaded(e) && ++tries < 100) { yield; continue; } break; }
                }
                yield;
            }
        }
    }
    try { dim.runCommand("tickingarea remove " + name); } catch {}
    doneSets.delete(run.key);
    doneDirty = true; saveDone();
    runs.delete(run.key);
    saveRuns();
}
function lifecycleTick() {
    loadRuns();
    const now = system.currentTick;
    for (const run of [...runs.values()]) {
        if (run.dying) {
            if (!run.annihilating && (run.genActive || 0) === 0) {
                run.annihilating = true;
                system.runJob(annihilateJob(run));
            }
            continue;
        }
        if (run.prep) continue; // 出発準備中はまだ誰も乗っていないのが正常
        if (hasPendingForRun(run)) continue;
        const grace = run.restored ? 1200 : 200;
        if (now - run.born < grace) continue;
        if (occupantsOf(run).length === 0) run.dying = true;
    }
}

// ===== 過去の箱の残骸掃除 =====
// v031 以前は fill() のバグで空箱の消滅が z 最小面しか消せていなかったため、
// ラン記録の無いプロットに生成済みブロックが残っていることがある。プロットは
// 通し番号で決まり、地下ディメンジョンに存在するのは箱だけなので、生きている
// ランが使っていないプロットは全ディメンジョン分まとめて空気に戻せる。
// 掃除の要否は箱の岩盤の殻を数点探って判定する (生成された箱には必ず殻がある)。
let sweepActive = false;
let sweepNotify = null; // (掃除したプロット数) => void
export function setSweepNotify(fn) { sweepNotify = fn; }
export function startCleanupSweep() {
    if (sweepActive) return -1;
    loadRuns();
    let slot = 0;
    try { const v = world.getDynamicProperty(SLOT_KEY); if (typeof v === "number" && v > 0) slot = Math.floor(v); } catch {}
    const live = new Set([...runs.values()].map((r) => r.key));
    const jobs = [];
    for (let n = 0; n < slot; n++) {
        const { px, pz } = plotForSlot(n);
        if (live.has(px + "," + pz)) continue;
        for (const v of VARIANTS) jobs.push({ px, pz, dim: v.dim });
    }
    if (!jobs.length) return 0;
    sweepActive = true;
    system.runJob(sweepJob(jobs));
    return jobs.length;
}
// 1プロット×1ディメンジョン分の掃除。戻り値: "cleared" | "skip" | "occupied"
function* sweepOne(job) {
    loadRuns();
    if ([...runs.values()].some((r) => r.px === job.px && r.pz === job.pz)) return "skip"; // 掃除中にランが始まったプロットは飛ばす
    const dim = world.getDimension(job.dim);
    if (!dim) return "skip";
    const box = boxFor(job);
    const name = "vlib_ug_sweep_" + job.px + "_" + job.pz;
    const gcx = Math.floor(job.px / 16), gcz = Math.floor(job.pz / 16);
    try { dim.runCommand("tickingarea remove " + name); } catch {}
    try { dim.runCommand("tickingarea add " + ((gcx - 3) * 16) + " -64 " + ((gcz - 3) * 16) + " " + ((gcx + 3) * 16 + 15) + " 319 " + ((gcz + 3) * 16 + 15) + " " + name); } catch {}
    for (let i = 0; i < 20; i++) yield; // ティッキングエリアが効くまで待つ
    // 岩盤の殻があるか探る (無ければそのディメンジョンでは未生成 = 掃除不要)
    let shell = false, readable = true;
    const probes = [[box.x0, 0, box.z0], [box.x1, 0, box.z0], [box.x0, 0, box.z1], [box.x1, 0, box.z1], [box.x0, 200, box.z0], [box.x1, 200, box.z0], [box.x0, 200, box.z1], [box.x1, 200, box.z1]];
    for (const [x, y, z] of probes) {
        try { const b = dim.getBlock({ x, y, z }); if (b && b.typeId !== "minecraft:air") { shell = true; break; } }
        catch { readable = false; break; }
    }
    if (readable && !shell) { try { dim.runCommand("tickingarea remove " + name); } catch {} return "skip"; }
    // 中に人がいたら消さない (記録ではなく実際のプレイヤー位置で判定する)。
    // 記録の無い場所に居続けることは封じ込めが許さないので、通常は一瞬で空く。
    const occupied = world.getAllPlayers().some((p) => p.dimension && p.dimension.id === job.dim
        && p.location.x >= box.x0 && p.location.x <= box.x1 + 1
        && p.location.z >= box.z0 && p.location.z <= box.z1 + 1
        && p.location.y >= UG.BOT && p.location.y <= 257);
    if (occupied) { try { dim.runCommand("tickingarea remove " + name); } catch {} return "occupied"; }
    // 中に残ったドロップやモブも一緒に消す (箱の消滅と同じ)
    try {
        for (const e of dim.getEntities({ location: { x: job.px, y: 128, z: job.pz }, maxDistance: 200 })) {
            if (e.typeId === "minecraft:player") continue;
            const l = e.location;
            if (l.x >= box.x0 && l.x <= box.x1 && l.z >= box.z0 && l.z <= box.z1) { try { e.remove(); } catch {} }
        }
    } catch {}
    for (let cx = Math.floor(box.x0 / 16); cx <= Math.floor(box.x1 / 16); cx++) {
        for (let cz = Math.floor(box.z0 / 16); cz <= Math.floor(box.z1 / 16); cz++) {
            for (let y = UG.BOT; y <= 256; y += 48) {
                let tries = 0;
                while (true) {
                    try { fill(dim, cx * 16, y, cz * 16, cx * 16 + 15, Math.min(y + 47, 256), cz * 16 + 15, "minecraft:air"); break; }
                    catch (e) { if (isUnloaded(e) && ++tries < 100) { yield; continue; } break; }
                }
            }
            yield;
        }
    }
    try { dim.runCommand("tickingarea remove " + name); } catch {}
    return "cleared";
}
function* sweepJob(jobs) {
    const clearedPlots = new Set();
    try {
        const occupied = [];
        for (const job of jobs) {
            const r = yield* sweepOne(job);
            if (r === "cleared") clearedPlots.add(job.px + "," + job.pz);
            else if (r === "occupied") occupied.push(job);
        }
        // 人がいて飛ばした分は、掃除の最後にもう一度だけ回す (大抵はもう空いている)
        for (const job of occupied) {
            const r = yield* sweepOne(job);
            if (r === "cleared") clearedPlots.add(job.px + "," + job.pz);
        }
    } catch (e) { report("残骸掃除", e); }
    finally {
        sweepActive = false;
        if (sweepNotify) { try { sweepNotify(clearedPlots.size); } catch {} }
    }
}

// ドライバ開始 (main.js から getMines を渡して一度だけ呼ぶ)
export function startDungeonDriver(getMines) {
    loadRuns();
    try { startCleanupSweep(); } catch {} // 過去の残骸は読み込み時に一度掃除する
    system.runInterval(() => {
        try {
            if (!jobRunning) {
                const u = pickNext(getMines);
                if (u) { jobRunning = true; system.runJob(genJob(u.run, u.f, u.cx, u.cz)); }
            }
        } catch (e) { jobRunning = false; report("地下ドライバ", e); }
    }, 1);
    system.runInterval(() => { try { arrivalTick(); } catch (e) { report("地下到着", e); } }, 5);
    system.runInterval(() => { try { containmentTick(getMines); } catch (e) { report("封じ込め", e); } }, 2);
    system.runInterval(() => { try { hordeTick(); } catch (e) { report("horde", e); } }, 100);
    system.runInterval(() => { try { triggerTick(); } catch (e) { report("地下トリガー", e); } }, 20);
    system.runInterval(() => { try { lifecycleTick(); } catch (e) { report("箱の消滅", e); } }, 20);
    system.runInterval(() => { try { saveDone(); } catch {} }, 100);
}

