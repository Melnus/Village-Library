"""Checks for converted entries. run_all() returns (markdown_report, has_errors)."""
import json, re, collections

DIRS4 = [(1, 0), (-1, 0), (0, 1), (0, -1)]
CROPS = ('wheat', 'carrots', 'potatoes', 'beetroot', 'melon_stem', 'pumpkin_stem', 'nether_wart', 'reeds', 'bamboo', 'sweet_berry_bush', 'cocoa')
REED_BASE = ('dirt', 'grass_block', 'sand', 'red_sand', 'podzol', 'mud', 'coarse_dirt', 'rooted_dirt', 'moss_block', 'mycelium')
ATTACHED = ('torch', 'lantern', 'wall_sign', 'ladder', 'vine', 'button', 'lever', 'tripwire_hook', 'redstone_wire', 'carpet', 'flower_pot')
FALLING = ('anvil', 'sand', 'gravel', 'concrete_powder')
EXTRA_NEEDED = ('bed', 'shulker_box', '_sign', 'banner', 'skull', 'chest', 'barrel', 'furnace', 'lectern', 'beehive', 'bee_nest', 'campfire', 'decorated_pot', 'jukebox')

def rot_point(x, z, w, d, rot):
    r = rot & 3
    if r == 1: return d - 1 - z, x
    if r == 2: return w - 1 - x, d - 1 - z
    if r == 3: return z, w - 1 - x
    return x, z

def short(n): return n.replace('minecraft:', '')

def load_pack_entry(path, entry_id):
    """Extract the existing entry from pack/scripts/custom.js (entries are plain JSON objects)."""
    try: s = open(path, encoding='utf8').read()
    except OSError: return None
    i = s.find('"id": "' + entry_id + '"')
    if i < 0: return None
    st = s.rfind('\n{', 0, i) + 1
    depth = 0; instr = False; esc = False; j = st
    while j < len(s):
        ch = s[j]
        if instr:
            if esc: esc = False
            elif ch == '\\': esc = True
            elif ch == '"': instr = False
        elif ch == '"': instr = True
        elif ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0: break
        j += 1
    try: return json.loads(s[st:j + 1])
    except Exception: return None

def decode(entry):
    """entry -> ({(x,y,z): (name, states)}, set(wet))"""
    cells = {}
    for y, rows in enumerate(entry['layers']):
        for z, r in enumerate(rows):
            for x, ch in enumerate(r):
                if ch != '.': cells[(x, y, z)] = tuple(entry['palette'][ch])
    return cells

def skey(c): return (c[0], json.dumps(c[1], sort_keys=True))

def run_all(entry, cells, wet, blocks, origin, cfg, existing):
    L = []; errors = []; warns = []
    add = L.append
    def err(m): errors.append(m)
    def warn(m): warns.append(m)
    wetset = {tuple(p) for p in wet}
    depth = entry['depth']
    add('# ' + entry['name'] + ' (' + entry['id'] + ')\n')
    add('size %dx%dx%d (+depth %d) / blocks %d / palette %d / wet %d / world origin %s\n' % (entry['w'], entry['h'], entry['d'], depth, len(cells), len(entry['palette']), len(wet), origin))

    # --- 0. round trip: encoded entry decodes to the same cells
    dec = decode(entry)
    bad = [k for k in set(dec) | set(cells) if (k not in dec) or (k not in cells) or skey(dec[k]) != skey(cells[k])]
    if bad: err('round-trip mismatch in %d cells, e.g. %s' % (len(bad), sorted(bad)[:3]))

    # --- 1. inventory by checklist
    names = collections.Counter(short(v[0]) for v in cells.values())
    def count(pred): return sum(c for n, c in names.items() if pred(n))
    inv = collections.OrderedDict()
    inv['trapdoors'] = count(lambda n: n.endswith('trapdoor'))
    inv['doors'] = count(lambda n: n.endswith('_door'))
    inv['water blocks (layer 0)'] = names.get('water', 0) + names.get('flowing_water', 0)
    wl = collections.Counter(short(cells[p][0]) if p in cells else 'AIR' for p in wetset)
    inv['waterlogged cells (layer 1)'] = len(wetset)
    inv['crops'] = count(lambda n: n in CROPS)
    inv['farmland'] = names.get('farmland', 0)
    inv['hoppers'] = names.get('hopper', 0)
    inv['attached blocks'] = count(lambda n: any(a in n for a in ATTACHED))
    inv['falling blocks'] = count(lambda n: any(n.endswith(f) or n == f for f in FALLING))
    add('## Checklist: contents\n')
    for k, v in inv.items(): add('- %s: %d%s' % (k, v, '  <-- needs care' if v and k != 'hoppers' and k != 'attached blocks' else ''))
    if wl: add('- waterlogged by block: ' + ', '.join('%s %d' % (k, v) for k, v in wl.items()))
    add('')
    for p in wetset:
        if p not in cells: err('waterlogged cell %s has no block' % (p,))
        elif not re.search(r'(slab|stairs|trapdoor|fence|wall|lantern|chain)', cells[p][0]): warn('waterlogged cell %s is %s (can it hold water?)' % (p, cells[p][0]))
    if wet and 'wet' not in entry: err('wet missing from entry')

    needs = collections.Counter(short(v[0]) for v in cells.values() if any(e in v[0] for e in EXTRA_NEEDED))
    ex = [e[0] for e in entry.get('extras', [])]
    add('## Blocks that carry extra data (block entities)\n')
    add('- ' + (', '.join('%s %d' % kv for kv in needs.items()) if needs else 'none'))
    add('- extras in config: ' + (', '.join(ex) if ex else 'none') + '  (block-entity data such as bed colour / sign text / bees is NOT read from the world yet)\n')

    # --- 2. water: sources, flow, leaks
    water0 = {p for p, v in cells.items() if v[0] in ('minecraft:water', 'minecraft:flowing_water')}
    sources = {p for p in water0 if cells[p][1].get('liquid_depth', 0) == 0} | wetset
    allw = water0 | wetset
    add('## Water\n')
    add('- sources (depth 0 + waterlogged): %d / flowing: %d\n' % (len(sources), len(water0) - sum(1 for p in water0 if cells[p][1].get('liquid_depth', 0) == 0)))
    def solid(p): return p in cells and p not in water0
    leaks = []
    for (x, y, z) in sorted(sources):
        for dx, dz in DIRS4 + [(0, 0)]:
            dy = -1 if (dx, dz) == (0, 0) else 0
            q = (x + dx, y + dy, z + dz)
            if q in allw: continue
            if not solid(q) and not (y + dy < depth):
                leaks.append(((x, y, z), q))
    if leaks: warn('%d water source sides open to air (the water will spread there), e.g. %s' % (len(leaks), leaks[:3]))
    else: add('- no source side is open to air\n')

    # --- 3. farmland hydration & sugar cane
    farm = [p for p, v in cells.items() if v[0] == 'minecraft:farmland']
    dry = []
    for (x, y, z) in farm:
        ok = any((x + dx, y + dy, z + dz) in allw for dx in range(-4, 5) for dz in range(-4, 5) for dy in (0, 1))
        if not ok: dry.append((x, y, z))
    add('## Crops\n')
    add('- farmland %d, not hydrated within 4 blocks: %d' % (len(farm), len(dry)))
    if dry: warn('%d farmland cells have no water within 4 blocks, e.g. %s' % (len(dry), dry[:3]))
    reeds = [p for p, v in cells.items() if v[0] == 'minecraft:reeds' and cells.get((p[0], p[1] - 1, p[2]), ('',))[0] != 'minecraft:reeds']
    nowater = []; badbase = []
    for (x, y, z) in reeds:
        by = y - 1
        base = cells.get((x, by, z))
        if not base or short(base[0]) not in REED_BASE: badbase.append((x, y, z, short(base[0]) if base else 'AIR'))
        if not any((x + dx, by, z + dz) in allw for dx, dz in DIRS4): nowater.append((x, y, z))
    add('- sugar cane columns %d, base without adjacent water: %d, base not plantable: %d\n' % (len(reeds), len(nowater), len(badbase)))
    if nowater: err('%d sugar cane bases have no adjacent water (cane breaks when placed), e.g. %s' % (len(nowater), nowater[:3]))
    if badbase: err('%d sugar cane columns stand on a block cane cannot grow on, e.g. %s' % (len(badbase), badbase[:3]))

    # --- 4. rotation of the coordinate lists (wet / dry) and block-name preservation
    add('## Rotation (0..3)\n')
    w, d = entry['w'], entry['d']
    for rot in range(4):
        w2, d2 = (d, w) if rot % 2 else (w, d)
        rc = {}
        for (x, y, z), v in cells.items():
            nx, nz = rot_point(x, z, w, d, rot); rc[(nx, y, nz)] = v
        problems = 0
        for (x, y, z) in wetset:
            nx, nz = rot_point(x, z, w, d, rot)
            if not (0 <= nx < w2 and 0 <= nz < d2) or (nx, y, nz) not in rc or rc[(nx, y, nz)][0] != cells[(x, y, z)][0]: problems += 1
        for (x, y, z) in entry.get('dry', []):
            if (x, y, z) not in cells:
                if rot == 0: err('dry cell %s has no block' % ((x, y, z),))
                continue
            nx, nz = rot_point(x, z, w, d, rot)
            if (nx, y, nz) not in rc or rc[(nx, y, nz)][0] != cells[(x, y, z)][0]: problems += 1
        add('- rot %d: wet/dry cells landing on the wrong block: %d' % (rot, problems))
        if problems: err('rotation %d moves %d wet/dry cells off their blocks' % (rot, problems))
    add('')
    trap = [v for v in cells.values() if v[0].endswith('trapdoor') or v[0].endswith('_door')]
    if trap: add('- trapdoor/door facing differs from stairs ordering; verify in game for rot 1..3 (not checkable from data)\n')

    # --- 5. diff against the entry currently in pack/
    add('## Diff against the entry in pack/scripts/custom.js\n')
    if not existing: add('- no existing entry (new building)\n')
    else:
        ec = decode(existing)
        only_e = [k for k in ec if k not in cells]
        only_n = [k for k in cells if k not in ec]
        chg = [k for k in ec if k in cells and skey(ec[k]) != skey(cells[k])]
        add('- cells only in old: %d / only in new: %d / changed: %d' % (len(only_e), len(only_n), len(chg)))
        if chg:
            c = collections.Counter((short(ec[k][0]), short(cells[k][0])) for k in chg)
            add('  - changed (old -> new): ' + ', '.join('%s->%s %d' % (a, b, n) for (a, b), n in c.most_common(8)))
        ew = {tuple(p) for p in existing.get('wet', [])}
        add('- wet: old %d / new %d' % (len(ew), len(wetset)))
        add('- extras kept from config: %s ; old extras: %s' % (len(entry.get('extras', [])), len(existing.get('extras', []))))
        if ew != wetset: warn('wet list differs from the one in the pack')
        add('')

    add('## Result\n')
    for m in errors: add('- ERROR: ' + m)
    for m in warns: add('- warn: ' + m)
    if not errors and not warns: add('- all checks passed')
    return '\n'.join(L) + '\n', bool(errors)
