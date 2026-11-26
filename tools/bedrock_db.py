"""Minimal Bedrock Edition world reader (LevelDB + SubChunk + little-endian NBT). No third-party packages.

Reads the world 'db' folder inside a .mcworld and returns every block of the overworld,
INCLUDING layer 1 (the liquid layer: waterlogged water of stairs/slabs etc.).
"""
import struct, zlib, glob, os, sys, collections

def varint(b, i):
    r = 0; s = 0
    while True:
        c = b[i]; i += 1
        r |= (c & 0x7f) << s; s += 7
        if not c & 0x80: break
    return r, i

def read_log(path):
    data = open(path,'rb').read()
    recs = []; i = 0; cur = b''
    while i + 7 <= len(data):
        blk_off = i % 32768
        if 32768 - blk_off < 7:
            i += 32768 - blk_off; continue
        crc, ln, t = struct.unpack_from('<IHB', data, i); i += 7
        payload = data[i:i+ln]; i += ln
        if t == 1: recs.append(payload)
        elif t == 2: cur = payload
        elif t == 3: cur += payload
        elif t == 4: cur += payload; recs.append(cur); cur = b''
        elif t == 0 and ln == 0: continue
    out = []
    for r in recs:
        if len(r) < 12: continue
        n = struct.unpack_from('<I', r, 8)[0]; j = 12
        for _ in range(n):
            if j >= len(r): break
            typ = r[j]; j += 1
            kl, j = varint(r, j); key = r[j:j+kl]; j += kl
            if typ == 1:
                vl, j = varint(r, j); val = r[j:j+vl]; j += vl
                out.append((key, val))
            else:
                out.append((key, None))
    return out

def read_block(data, off, size):
    raw = data[off:off+size]; ctype = data[off+size]
    if ctype == 0: return raw
    if ctype in (2,4): return zlib.decompress(raw, -15)
    raise Exception('ctype %d' % ctype)

def read_ldb(path):
    data = open(path,'rb').read()
    magic = data[-8:]
    footer = data[-48:]
    i = 0
    _, i = varint(footer, i); _, i = varint(footer, i)
    idx_off, i = varint(footer, i); idx_size, i = varint(footer, i)
    idx = read_block(data, idx_off, idx_size)
    def entries(blk):
        nrest = struct.unpack_from('<I', blk, len(blk)-4)[0]
        end = len(blk) - 4 - 4*nrest
        j = 0; key = b''; res = []
        while j < end:
            sh, j = varint(blk, j); ns, j = varint(blk, j); vl, j = varint(blk, j)
            key = key[:sh] + blk[j:j+ns]; j += ns
            val = blk[j:j+vl]; j += vl
            res.append((key, val))
        return res
    out = []
    for k, v in entries(idx):
        o, p = varint(v, 0); s, p = varint(v, p)
        blk = read_block(data, o, s)
        for k2, v2 in entries(blk):
            ik = k2[:-8]; tag = k2[-8]
            out.append((ik, v2 if tag == 1 else None))
    return out

def load_db(dbdir):
    kv = {}
    for f in sorted(glob.glob(dbdir + '/*.ldb')):
        for k, v in read_ldb(f): kv[k] = v
    for f in sorted(glob.glob(dbdir + '/*.log')):
        for k, v in read_log(f): kv[k] = v
    return {k: v for k, v in kv.items() if v is not None}

# --- little endian NBT ---
class Byte(int):
    """NBT byte (block-state booleans are bytes)."""

def nbt_read(b, i, tag=None, named=True):
    if tag is None:
        tag = b[i]; i += 1
        if tag == 0: return None, None, i
        nl = struct.unpack_from('<H', b, i)[0]; i += 2
        name = b[i:i+nl].decode(); i += nl
    else: name = None
    val, i = nbt_payload(b, i, tag)
    return name, val, i

def nbt_payload(b, i, tag):
    if tag == 1: return Byte(b[i]), i+1
    if tag == 2: return struct.unpack_from('<h', b, i)[0], i+2
    if tag == 3: return struct.unpack_from('<i', b, i)[0], i+4
    if tag == 4: return struct.unpack_from('<q', b, i)[0], i+8
    if tag == 5: return struct.unpack_from('<f', b, i)[0], i+4
    if tag == 6: return struct.unpack_from('<d', b, i)[0], i+8
    if tag == 7:
        n = struct.unpack_from('<i', b, i)[0]; i += 4; return b[i:i+n], i+n
    if tag == 8:
        n = struct.unpack_from('<H', b, i)[0]; i += 2; return b[i:i+n].decode(), i+n
    if tag == 9:
        t = b[i]; n = struct.unpack_from('<i', b, i+1)[0]; i += 5; r = []
        for _ in range(n):
            v, i = nbt_payload(b, i, t); r.append(v)
        return r, i
    if tag == 10:
        d = {}
        while True:
            t = b[i]; i += 1
            if t == 0: break
            nl = struct.unpack_from('<H', b, i)[0]; i += 2
            nm = b[i:i+nl].decode(); i += nl
            d[nm], i = nbt_payload(b, i, t)
        return d, i
    if tag == 11:
        n = struct.unpack_from('<i', b, i)[0]; i += 4
        return list(struct.unpack_from('<%di' % n, b, i)), i+4*n
    if tag == 12:
        n = struct.unpack_from('<i', b, i)[0]; i += 4
        return list(struct.unpack_from('<%dq' % n, b, i)), i+8*n
    raise Exception('nbt tag %d' % tag)

def norm_states(states):
    """NBT bytes arrive as ints. NBT bytes (and _bit properties) are booleans in the library data."""
    return {k: (bool(v) if (k.endswith('_bit') or isinstance(v, Byte)) else v) for k, v in states.items()}

def parse_subchunk(v):
    ver = v[0]; i = 1
    if ver == 9: nl = v[1]; yi = struct.unpack('b', bytes([v[2]]))[0]; i = 3
    elif ver == 8: nl = v[1]; yi = None; i = 2
    else: nl = 1; yi = None
    layers = []
    for _ in range(nl):
        hdr = v[i]; i += 1
        bits = hdr >> 1
        if bits == 0:
            idxs = [0]*4096
        else:
            per = 32 // bits; nw = (4096 + per - 1) // per
            words = struct.unpack_from('<%dI' % nw, v, i); i += 4*nw
            idxs = [0]*4096; n = 0; mask = (1 << bits) - 1
            for w in words:
                for k in range(per):
                    if n >= 4096: break
                    idxs[n] = (w >> (k*bits)) & mask; n += 1
        pn = struct.unpack_from('<i', v, i)[0]; i += 4
        pal = []
        for _ in range(pn):
            name, val, i = nbt_read(v, i)
            pal.append((val['name'], norm_states(val.get('states', {}))))
        layers.append((idxs, pal))
    return yi, layers

def blocks(kv):
    """yield (x,y,z,layer,name,states) for every non-air"""
    res = {}
    for k, v in kv.items():
        if len(k) in (10, 14) and k[8 if len(k)==10 else 12] == 0x2f:
            if len(k) == 14: continue  # other dim
            cx, cz = struct.unpack_from('<ii', k, 0); sy = struct.unpack('b', k[9:10])[0]
            yi, layers = parse_subchunk(v)
            if yi is None: yi = sy
            for li, (idxs, pal) in enumerate(layers):
                for n, pi in enumerate(idxs):
                    nm, st = pal[pi]
                    if nm == 'minecraft:air': continue
                    x = (n >> 8) & 15; z = (n >> 4) & 15; y = n & 15
                    res[(cx*16+x, yi*16+y, cz*16+z, li)] = (nm, st)
    return res


import zipfile, tempfile, shutil

def open_world(path):
    """path: .mcworld/.zip or an extracted world folder. Returns (db_dir, tmpdir_or_None)."""
    if os.path.isdir(path):
        for root, dirs, files in os.walk(path):
            if os.path.basename(root) == 'db' and 'CURRENT' in files: return root, None
        raise FileNotFoundError('no db folder in ' + path)
    tmp = tempfile.mkdtemp(prefix='mcworld_')
    with zipfile.ZipFile(path) as z: z.extractall(tmp)
    for root, dirs, files in os.walk(tmp):
        if os.path.basename(root) == 'db' and 'CURRENT' in files: return root, tmp
    shutil.rmtree(tmp, ignore_errors=True)
    raise FileNotFoundError('no db folder in ' + path)

def load_blocks(path):
    db, tmp = open_world(path)
    try: return blocks(load_db(db))
    finally:
        if tmp: shutil.rmtree(tmp, ignore_errors=True)
