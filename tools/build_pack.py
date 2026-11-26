"""Structure/*.json -> pack/scripts/custom.js (replace by id, or append) -> dist/VillageLibrary_BP.mcpack

usage: python tools/build_pack.py [--no-zip]
The pack version in pack/manifest.json is NOT changed here: bump it by hand when you ship (Minecraft caches by version).
"""
import json, os, sys, glob, zipfile
sys.path.insert(0, os.path.dirname(__file__))

ROOT = os.path.join(os.path.dirname(__file__), '..')
CUSTOM = os.path.join(ROOT, 'pack', 'scripts', 'custom.js')

def span(s, entry_id):
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
            if depth == 0: return st, j + 1
        j += 1
    raise ValueError('unbalanced entry ' + entry_id)

def inject(s, entry_text, entry_id):
    sp = span(s, entry_id)
    if sp: return s[:sp[0]] + entry_text + s[sp[1]:], 'replaced'
    k = s.rstrip().rfind(']')                      # end of the CUSTOM array
    return s[:k].rstrip() + ',\n' + entry_text + '\n' + s[k:], 'added'

def main(argv):
    s = open(CUSTOM, encoding='utf8').read()
    for f in sorted(glob.glob(os.path.join(ROOT, 'Structure', '*.json'))):
        text = open(f, encoding='utf8').read().strip()
        eid = json.loads(text)['id']
        s, how = inject(s, text, eid)
        print(how, eid, 'from', os.path.basename(f))
    open(CUSTOM, 'w', encoding='utf8').write(s)
    if '--no-zip' in argv: return 0
    out = os.path.join(ROOT, 'dist'); os.makedirs(out, exist_ok=True)
    mf = json.load(open(os.path.join(ROOT, 'pack', 'manifest.json'), encoding='utf8'))
    v = '.'.join(str(x) for x in mf['header']['version'])
    path = os.path.join(out, 'VillageLibrary_BP_v%s.mcpack' % v)
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        for r, _, fs in os.walk(os.path.join(ROOT, 'pack')):
            for fn in fs:
                full = os.path.join(r, fn); z.write(full, os.path.relpath(full, os.path.join(ROOT, 'pack')))
    print('wrote', path)
    return 0

if __name__ == '__main__': sys.exit(main(sys.argv[1:]))
