# python3 boxplan.py boxes.json out.png floorY   - draws boxes crossing floorY+1.0 (walls) and walkable tops near floorY
import json, sys
from PIL import Image, ImageDraw
r = json.load(open(sys.argv[1])); fy = float(sys.argv[3]); S = 12; pr = r['play']; W = int((pr[1] - pr[0] + 4) * S); Hh = int((pr[3] - pr[2] + 4) * S)
im = Image.new('RGB', (W, Hh), (30, 32, 36)); d = ImageDraw.Draw(im)
P = lambda x, z: ((x - pr[0] + 2) * S, (z - pr[2] + 2) * S)
for b in r['boxes']:
    x0, x1, z0, z1, bot, top, walk, st = b
    if walk and abs(top - fy) < 0.3: d.rectangle([P(x0, z0), P(x1, z1)], fill=(70, 90, 80))
for b in r['boxes']:
    x0, x1, z0, z1, bot, top, walk, st = b
    if st and fy - 0.2 <= top <= fy + 4.4: d.rectangle([P(x0, z0), P(x1, z1)], fill=(200, 160, 60))
    elif bot <= fy + 1.0 < top: d.rectangle([P(x0, z0), P(x1, z1)], fill=(230, 230, 230) if (x1 - x0 < 0.5 or z1 - z0 < 0.5) else (120, 140, 190))
L = r['layout']
for i, s in enumerate(L['spawn']): x, z = P(s['x'], s['z']); d.ellipse([x - 8, z - 8, x + 8, z + 8], fill=(255, 60, 60) if i else (60, 120, 255))
for h in L['hp']: x, z = P(h['x'], h['z']); d.ellipse([x - 5, z - 5, x + 5, z + 5], outline=(255, 255, 255), width=2)
for h in L['sites']: x, z = P(h['x'], h['z']); d.text((x - 4, z - 6), h['n'], fill=(255, 220, 0))
im.save(sys.argv[2])
