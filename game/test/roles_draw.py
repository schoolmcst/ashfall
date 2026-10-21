# draw bot paths from s_roles.js over the map plan from s_map.js: python3 roles_draw.py roles.json plan.png out.png
import json, sys
from PIL import Image, ImageDraw
r = json.load(open(sys.argv[1])); im = Image.open(sys.argv[2]).convert('RGB'); W = im.size[0]
pr = r['play']; cx, cz = (pr[0] + pr[1]) / 2, (pr[2] + pr[3]) / 2; hw = max(pr[1] - pr[0], pr[3] - pr[2]) / 2 + 2
P = lambda x, z: ((x - (cx - hw)) / (2 * hw) * W, (z - (cz - hw)) / (2 * hw) * W)
COL = {'entry': (255, 70, 60), 'support': (255, 170, 40), 'anchor': (60, 140, 255), 'overwatch': (190, 90, 255), 'lurk': (40, 220, 120), 'slayer': (255, 255, 255)}
d = ImageDraw.Draw(im, 'RGBA')
for name, pts in r['trails']:
    if len(pts) < 2: continue
    job = pts[-1][3]; c = COL.get(job, (200, 200, 200)); team = pts[-1][2]
    seg = []
    for i, (x, z, t, j) in enumerate(pts):
        if seg and abs(x - seg[-1][0]) + abs(z - seg[-1][1]) > 8:   # respawn jump: start a new line
            if len(seg) > 1: d.line([P(*q) for q in seg], fill=c + (230,), width=4 if team == 0 else 2)
            seg = []
        seg.append((x, z))
    if len(seg) > 1: d.line([P(*q) for q in seg], fill=c + (230,), width=4 if team == 0 else 2)
    x, z = pts[-1][0], pts[-1][1]; px, pz = P(x, z); d.ellipse([px - 6, pz - 6, px + 6, pz + 6], fill=c + (255,), outline=(0, 0, 0))
y = 8
for k, c in COL.items():
    d.rectangle([8, y, 26, y + 14], fill=c); d.text((32, y), k.upper(), fill=(255, 255, 255)); y += 20
d.text((8, y + 4), 'thick = team 1   thin = team 2', fill=(255, 255, 255))
im.save(sys.argv[3])
