# pack Blender HQ gun exports into src/hqdata.js (int16 positions /4000, int8 normals, uint16/32 indices, base64)
import json, base64, struct, glob, os, sys
src = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/uploads/Documents/ashfall/hq/out'
out = {}
tot = 0
for f in sorted(glob.glob(os.path.join(src, '*.json'))):
    gid = os.path.basename(f)[:-5]
    if gid.startswith('batch'): continue
    d = json.load(open(f))
    parts = {}
    for part, mats in d['parts'].items():
        parts[part] = {}
        for m, g in mats.items():
            p, n, i = g['p'], g['n'], g['i']
            assert max(abs(v) for v in p) < 32767
            w = 4 if len(p) // 3 > 65535 else 2
            pb = struct.pack('<%dh' % len(p), *p); nb = struct.pack('<%db' % len(n), *[max(-127, min(127, v)) for v in n])
            ib = struct.pack('<%d%s' % (len(i), 'I' if w == 4 else 'H'), *i)
            parts[part][m] = {'p': base64.b64encode(pb).decode(), 'n': base64.b64encode(nb).decode(), 'i': base64.b64encode(ib).decode(), 'w': w}
            tot += len(pb) + len(nb) + len(ib)
    out[gid] = {'parts': parts, 'pivots': d.get('pivots', {}), 'anch': d.get('anch', {})}
js = '/* ================================================================== HQ weapon meshes modelled in Blender (hq/guns_*.py) */\nconst HQDATA = ' + json.dumps(out, separators=(',', ':')) + ';\n'
open('/home/claude/work/src/hqdata.js', 'w').write(js)
print(len(out), 'guns', tot // 1024, 'KB raw', len(js) // 1024, 'KB js', sorted(out))
