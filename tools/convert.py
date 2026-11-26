"""World (.mcworld) -> library entry (Structure/<name>.json) + validation report.

usage: python tools/convert.py [worlds/foo.mcworld ...]   (no args = every worlds/*.mcworld)
Each world needs a config next to it: worlds/foo.json
"""
import json, os, sys, glob, collections
sys.path.insert(0, os.path.dirname(__file__))
import bedrock_db
import validate

SYMBOLS = ([chr(c) for c in range(0x41, 0x5B)] + [chr(c) for c in range(0x61, 0x7B)] + [chr(c) for c in range(0x30, 0x3A)]
           + [chr(c) for c in range(0x3B1, 0x3CA) if c != 0x3C2] + [chr(c) for c in range(0x30A1, 0x30F7)]
           + [chr(c) for c in range(0x3041, 0x3094)] + [chr(c) for c in range(0x4E00, 0x4E00 + 600)])

def normalize(name, st):
    """Drop / reset state that only describes the moment the world was saved, as the library has always done:
    connections and redstone sides are recalculated by the game; growth timers and soil moisture restart."""
    st = dict(st); n = name.replace('minecraft:', '')
    for k in [k for k in st if k.startswith('minecraft:connection_')]: del st[k]
    if n == 'redstone_wire':
        st = {'redstone_signal': 0}
    elif n == 'reeds': st['age'] = 0
    elif n == 'bamboo': st['age_bit'] = False
    elif n == 'farmland': st['moisturized_amount'] = 7
    elif n == 'scaffolding' and 'stability_check' in st: st['stability_check'] = int(st['stability_check'])  # the library has always stored it as 1/0
    return st

def skey(name, states): return name + '|' + json.dumps(states, sort_keys=True, ensure_ascii=False)

def convert(cfg, blocks):
    """blocks: {(x,y,z,layer): (name, states)} in world coordinates -> (entry, cells, wet, origin)"""
    L0 = {k[:3]: v for k, v in blocks.items() if k[3] == 0}
    L1 = {k[:3]: v for k, v in blocks.items() if k[3] == 1}
    if 'box' in cfg: x0, y0, z0, x1, y1, z1 = cfg['box']
    else:
        pts = list(L0) + list(L1)
        x0, y0, z0 = (min(p[i] for p in pts) for i in range(3)); x1, y1, z1 = (max(p[i] for p in pts) for i in range(3))
    w, hh, d = x1 - x0 + 1, y1 - y0 + 1, z1 - z0 + 1
    depth = cfg.get('depth', 0); ground = cfg.get('ground')
    cells = {}
    for (x, y, z), (n, s) in L0.items():
        if not (x0 <= x <= x1 and y0 <= y <= y1 and z0 <= z <= z1): continue
        rel = (x - x0, y - y0, z - z0)
        if ground and rel[1] < depth and n == ground: continue   # ground under the building stays as is
        cells[rel] = (n, normalize(n, s) if cfg.get('normalize', True) else s)
    wet = sorted([(x - x0, y - y0, z - z0) for (x, y, z), (n, s) in L1.items()
                  if n == 'minecraft:water' and x0 <= x <= x1 and y0 <= y <= y1 and z0 <= z <= z1], key=lambda p: (p[1], p[2], p[0]))
    cnt = collections.Counter(skey(*v) for v in cells.values())
    order = sorted(cnt, key=lambda k: (-cnt[k], k))
    if len(order) > len(SYMBOLS): raise RuntimeError('palette too large')
    sym = {k: SYMBOLS[i] for i, k in enumerate(order)}
    palette = {}
    for k, ch in sym.items():
        n, s = k.split('|', 1); palette[ch] = [n, json.loads(s)]
    layers = []
    for y in range(hh):
        rows = []
        for z in range(d):
            rows.append(''.join(sym[skey(*cells[(x, y, z)])] if (x, y, z) in cells else '.' for x in range(w)))
        layers.append(rows)
    entry = {'id': cfg['id'], 'no': cfg.get('no', '00'), 'name': cfg['name'], 'w': w, 'h': hh - depth, 'd': d, 'depth': depth}
    if cfg.get('dry'): entry['dry'] = cfg['dry']
    if wet: entry['wet'] = [list(p) for p in wet]
    entry['palette'] = palette; entry['layers'] = layers
    entry['extras'] = cfg.get('extras', [])
    return entry, cells, wet, (x0, y0 + 0, z0)

def fmt_entry(e):
    """Same layout as pack/scripts/custom.js: one key per line, palette one entry per line, layers one row per line."""
    j = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    out = []
    for k, v in e.items():
        if k == 'palette': body = '{\n' + ',\n'.join('  ' + j(s) + ': ' + j(p) for s, p in v.items()) + '\n }'
        elif k == 'layers': body = '[\n' + ',\n'.join('  [\n' + ',\n'.join('   ' + j(r) for r in rows) + '\n  ]' for rows in v) + '\n ]'
        else: body = j(v)
        out.append(' ' + j(k) + ': ' + body)
    return '{\n' + ',\n'.join(out) + '\n}'

def main(argv):
    root = os.path.join(os.path.dirname(__file__), '..')
    worlds = argv or sorted(glob.glob(os.path.join(root, 'worlds', '*.mcworld')))
    ok = True
    for wp in worlds:
        stem = os.path.splitext(os.path.basename(wp))[0]
        cp = os.path.splitext(wp)[0] + '.json'
        if not os.path.exists(cp): print('skip (no config):', wp); continue
        cfg = json.load(open(cp, encoding='utf8'))
        print('==', stem)
        blocks = bedrock_db.load_blocks(wp)
        entry, cells, wet, origin = convert(cfg, blocks)
        outdir = os.path.join(root, 'Structure'); os.makedirs(outdir, exist_ok=True)
        text = fmt_entry(entry)
        open(os.path.join(outdir, stem + '.json'), 'w', encoding='utf8').write(text + '\n')
        existing = validate.load_pack_entry(os.path.join(root, 'pack', 'scripts', 'custom.js'), entry['id'])
        report, errors = validate.run_all(entry, cells, wet, blocks, origin, cfg, existing)
        open(os.path.join(outdir, stem + '.report.md'), 'w', encoding='utf8').write(report)
        print(report)
        if errors: ok = False
    return 0 if ok else 1

if __name__ == '__main__': sys.exit(main(sys.argv[1:]))
