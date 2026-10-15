# The six secret-camo reveal animations. A job sets NAME and runs anim_lib.py then this file.
import bpy, math, random
from mathutils import Vector
R = random.Random(7)
TAU = math.pi * 2

def bloodline():
    sc = new_scene('bloodline', world=(0.012, 0.0, 0.0))
    cam = camera(sc, (0, -14, 1.6), (0, 0, 0.2), 40); kf(cam, 'location', 1, (0, -14, 1.6)); kf(cam, 'location', FRAMES, (0, -10.8, 1.0))
    mesh(sc, 'plane', 'floor', solid('floor', (0.04, 0.0, 0.0), metal=0.3, rough=0.12), s=60).location = (0, 0, -2)
    hm = emis('heart', (1.0, 0.02, 0.03), 2.0); heart = mesh(sc, 'sphere', 'heart', hm, r=1.15, seg=48, rings=24); heart.location = (0, 1.5, 0.6)
    for i, f in enumerate([8, 20, 32, 44, 56, 66]):
        kf_strength(hm, f, 2.5); kf_strength(hm, f + 3, 16 + i * 3); kf_strength(hm, f + 9, 3.0)
        kf(heart, 'scale', f, (1, 1, 1)); kf(heart, 'scale', f + 3, (1.12 + i * 0.03,) * 3); kf(heart, 'scale', f + 9, (1, 1, 1))
    kf(heart, 'location', 66, (0, 1.5, 0.6)); kf(heart, 'location', 80, (0, 2.5, 1.9))
    dm = emis('drop', (1.0, 0.03, 0.03), 4.0)
    for i in range(30):
        x, y, f0 = R.uniform(-6, 6), R.uniform(-2, 5), R.randint(1, 56); r = R.uniform(0.1, 0.2)
        d = mesh(sc, 'sphere', 'drop', dm, r=r, seg=16, rings=8)
        kf(d, 'location', f0, (x, y, 9 + R.uniform(0, 3))); kf(d, 'location', f0 + 12, (x, y, -1.95))
        kf(d, 'scale', f0 + 11, (0.8, 0.8, 1.4)); kf(d, 'scale', f0 + 13, (2.4, 2.4, 0.12))
        rm = emis('ring%d' % i, (1, 0.05, 0.05), 0.0); ring = mesh(sc, 'torus', 'ring', rm, R=0.2, r=0.025, seg=48, sides=6); ring.location = (x, y, -1.97)
        kf(ring, 'scale', f0 + 12, (0.2, 0.2, 1)); kf(ring, 'scale', f0 + 28, (6, 6, 1)); kf_strength(rm, f0 + 11, 0); kf_strength(rm, f0 + 13, 8); kf_strength(rm, f0 + 28, 0)
    light(sc, 'POINT', (0, 0, 2.5), 900, (1, 0.1, 0.1))
    title(sc, 'BLOODLINE', (1.0, 0.06, 0.05)); return sc

def eclipse():
    sc = new_scene('eclipse')
    cam = camera(sc, (0, -12, 0.4), (0, 0, 0.5), 42); kf(cam.data, 'lens', 1, 42); kf(cam.data, 'lens', FRAMES, 50)
    for i in range(170):
        m = emis('st%d' % (i % 6), (1, 0.95, 0.85), 2 + (i % 6)); s = mesh(sc, 'ico', 'star', m, r=R.uniform(0.02, 0.06)); s.location = (R.uniform(-26, 26), R.uniform(18, 30), R.uniform(-15, 15))
    sun = mesh(sc, 'sphere', 'sun', emis('sun', (1.0, 0.72, 0.28), 7.0), r=2.0, seg=48, rings=24); sun.location = (0, 6, 0.8)
    cm = emis('corona', (1.0, 0.78, 0.35), 0.0); cor = mesh(sc, 'torus', 'corona', cm, R=2.12, r=0.14, seg=96, sides=12); cor.location = (0, 5.4, 0.8); cor.rotation_euler = (math.pi / 2, 0, 0)
    kf_strength(cm, 48, 0); kf_strength(cm, 60, 45); kf_strength(cm, 75, 14); kf_strength(cm, FRAMES, 12)
    rm = emis('rays', (1.0, 0.8, 0.4), 0.0)
    for i in range(18):
        a = TAU * i / 18; p = mesh(sc, 'plane', 'ray', rm, s=1); p.location = (0, 5.6, 0.8)
        p.rotation_euler = (math.pi / 2, a, 0)
        kf(p, 'scale', 52, (0.001, 0.001, 1)); kf(p, 'scale', 64, (0.05, 5.5 + (i % 3) * 1.5, 1)); kf(p, 'scale', FRAMES, (0.04, 4.5 + (i % 3) * 1.2, 1))
        kf(p, 'location', 52, (0, 5.6, 0.8))
    kf_strength(rm, 52, 0); kf_strength(rm, 62, 12); kf_strength(rm, FRAMES, 4)
    moon = mesh(sc, 'sphere', 'moon', solid('moon', (0.0, 0.0, 0.0), rough=0.6), r=2.06, seg=48, rings=24)
    kf(moon, 'location', 1, (-8, 5.0, 1.4)); kf(moon, 'location', 56, (0, 5.0, 0.8))
    title(sc, 'ECLIPSE', (1.0, 0.78, 0.32)); return sc

def spectre():
    sc = new_scene('spectre', world=(0.0, 0.0, 0.012))
    pivot = link(sc, bpy.data.objects.new('pivot', None)); cam = camera(sc, (0, -11, 1.2), (0, 0, 0.4), 38); cam.parent = pivot
    kf(pivot, 'rotation_euler', 1, (0, 0, -0.5)); kf(pivot, 'rotation_euler', FRAMES, (0, 0, 0.5))
    for i in range(7):
        m = emis('sr%d' % i, (1, 1, 1), 5.0); t = mesh(sc, 'torus', 'ring', m, R=1.4 + i * 0.35, r=0.035, seg=96, sides=8); t.location = (0, 1.5, 0.6)
        ax = [(1, 0.3, 0), (0.2, 1, 0), (0.6, 0.1, 1)][i % 3]
        kf(t, 'rotation_euler', 1, (ax[0] * i, ax[1] * i, ax[2] * i)); kf(t, 'rotation_euler', FRAMES, (ax[0] * (i + 3), ax[1] * (i + 4), ax[2] * (i + 2)))
        for k, f in enumerate(range(1, FRAMES + 1, 15)):
            c = colorsys.hsv_to_rgb(((i * 0.14 + k * 0.12) % 1), 0.7, 1.0); kf_color(m, f, c)
    gm = emis('ghost', (0.6, 0.85, 1.0), 3.0); g = mesh(sc, 'sphere', 'ghost', gm, r=0.7, seg=32, rings=16); g.location = (0, 1.5, 0.6)
    for f in range(1, FRAMES, 4): kf_strength(gm, f, R.choice([1.0, 3.0, 7.0, 0.3]))
    orb = link(sc, bpy.data.objects.new('orb', None)); orb.location = (0, 1.5, 0.6)
    kf(orb, 'rotation_euler', 1, (0, 0, 0)); kf(orb, 'rotation_euler', FRAMES, (0.6, 0, TAU))
    pm = emis('pt', (0.75, 0.95, 1.0), 8.0)
    for i in range(80):
        a = TAU * i / 80 * 3; rr = 2.4 + math.sin(i) * 0.6; s = mesh(sc, 'ico', 'pt', pm, r=0.035)
        s.location = (math.cos(a) * rr, math.sin(a) * rr, (i / 80 - 0.5) * 3); s.parent = orb
    t = title(sc, 'SPECTRE', (0.75, 0.95, 1.0))
    tm = t.data.materials[0]
    for f in [74, 76, 79, 83, 88]: kf_strength(tm, f, 0.4); kf_strength(tm, f + 1, 26)
    return sc

def abyss():
    sc = new_scene('abyss', world=(0.0, 0.0, 0.004))
    cam = camera(sc, (0, -6, 0), (0, 10, 0), 30)
    kf(cam, 'location', 1, (0, -6, 0)); kf(cam, 'location', 92, (0, 86, 0)); kf(cam, 'location', FRAMES, (0, 87.2, 0))
    kf(cam, 'rotation_euler', 1, (math.pi / 2, 0, 0)); kf(cam, 'rotation_euler', 60, (math.pi / 2, 1.6, 0)); kf(cam, 'rotation_euler', 90, (math.pi / 2, 0, 0)); kf(cam, 'rotation_euler', FRAMES, (math.pi / 2, 0, 0))
    for i in range(46):
        m = emis('ab%d' % (i % 4), (0.08, 0.35, 1.0) if i % 4 else (0.4, 0.8, 1.0), [3, 6, 4, 10][i % 4])
        t = mesh(sc, 'torus', 'ring', m, R=2.3, r=0.05, seg=64, sides=6, arc=R.choice([1.0, 0.75, 0.5])); t.location = (0, i * 2.0, 0)
        t.rotation_euler = (math.pi / 2, 0, 0); kf(t, 'rotation_euler', 1, (math.pi / 2, R.uniform(0, TAU), 0)); kf(t, 'rotation_euler', FRAMES, (math.pi / 2, R.uniform(0, TAU) + (1 if i % 2 else -1) * 3, 0))
    sm = emis('streak', (0.5, 0.85, 1.0), 6.0)
    for i in range(60):
        a, rr = R.uniform(0, TAU), R.uniform(0.6, 1.9); c = mesh(sc, 'cube', 'streak', sm, s=1); c.scale = (0.02, R.uniform(1.5, 4), 0.02); c.location = (math.cos(a) * rr, R.uniform(0, 90), math.sin(a) * rr)
    core = mesh(sc, 'sphere', 'core', emis('core', (0.15, 0.4, 1.0), 25.0), r=0.6); core.location = (0, 120, 2.2)
    title(sc, 'ABYSS', (0.25, 0.55, 1.0))
    t = [o for o in sc.objects if o.name.startswith('t_ABYSS')][0]; t.location = (0, 91, -0.1)
    s = [o for o in sc.objects if o.name.startswith('t_SECRET')][0]; s.location = (0, 91, -0.95)
    return sc

def archangel():
    sc = new_scene('archangel', world=(0.025, 0.02, 0.012))
    cam = camera(sc, (0, -11, 1.4), (0, 0, 0.9), 36); kf(cam, 'location', 1, (0, -9, 1.2)); kf(cam, 'location', FRAMES, (0, -12.5, 1.6))
    core = mesh(sc, 'sphere', 'core', emis('core', (1.0, 0.92, 0.75), 25.0), r=0.45); core.location = (0, 1, 1.35)
    hm = emis('halo', (1.0, 0.8, 0.4), 0.0); halo = mesh(sc, 'torus', 'halo', hm, R=0.9, r=0.05, seg=64, sides=8); halo.location = (0, 1, 2.35)
    kf_strength(hm, 40, 0); kf_strength(hm, 56, 18); kf(halo, 'scale', 40, (0.2, 0.2, 0.2)); kf(halo, 'scale', 58, (1, 1, 1))
    fm = [emis('feather%d' % k, c, st) for k, (c, st) in enumerate([((1.0, 0.95, 0.85), 3.5), ((1.0, 0.82, 0.5), 5.0), ((1.0, 0.9, 0.7), 2.5)])]
    def feather(base, ang, ln, wd, mat):
        # a tapered feather in the XZ plane (facing the camera); origin at its root so it grows outward
        me = bpy.data.meshes.new('feather'); dx, dz = math.sin(ang), math.cos(ang); px, pz = -dz, dx
        v = [(0, 0, 0), (dx * ln * 0.35 + px * wd, 0, dz * ln * 0.35 + pz * wd), (dx * ln, 0, dz * ln), (dx * ln * 0.35 - px * wd, 0, dz * ln * 0.35 - pz * wd)]
        me.from_pydata(v, [], [(0, 1, 2, 3)]); me.materials.append(mat)
        ob = link(sc, bpy.data.objects.new('feather', me)); ob.location = base; return ob
    for side in (-1, 1):
        for row in range(3):
            for i in range(11):
                th = math.radians(18 + i * 8.5); ln = 1.3 + row * 0.85 - abs(i - 6) * 0.03
                p = feather((side * 0.35, 1.2 - row * 0.02, 1.35), side * th, ln, 0.13 + row * 0.03, fm[(i + row) % 3])
                f0 = 6 + i * 2 + row * 5
                kf(p, 'scale', 1, (0.001,) * 3); kf(p, 'scale', f0, (0.001,) * 3); kf(p, 'scale', f0 + 14, (1.05, 1.05, 1.05)); kf(p, 'scale', f0 + 20, (1, 1, 1))
    rm = emis('rays', (1.0, 0.85, 0.55), 1.2)
    for i in range(14):
        p = mesh(sc, 'plane', 'ray', rm, s=1); p.location = (0, 3, 1.35); a = TAU * i / 14
        p.rotation_euler = (math.pi / 2, a, 0); kf(p, 'scale', 1, (0.03, 0.001, 1)); kf(p, 'scale', 30, (0.03, 9, 1))
        kf(p, 'rotation_euler', 1, (math.pi / 2, a, 0)); kf(p, 'rotation_euler', FRAMES, (math.pi / 2, a + 0.5, 0))
    light(sc, 'POINT', (0, -1, 2), 600, (1, 0.9, 0.7))
    title(sc, 'ARCHANGEL', (1.0, 0.86, 0.55)); return sc

def reaper():
    sc = new_scene('reaper')
    cam = camera(sc, (0, -12, 0.3), (0, 0, 0.2), 36); kf(cam, 'location', 1, (0, -12, 0.3)); kf(cam, 'location', FRAMES, (0, -10.6, 0.2))
    tm = emis('trace', (1.0, 0.04, 0.04), 6.0)
    for i in range(90):
        horiz = R.random() < 0.6; ln = R.choice([1.0, 1.5, 2.0, 3.0]); x, z = round(R.uniform(-8, 8) * 2) / 2, round(R.uniform(-4.5, 4.5) * 2) / 2
        c = mesh(sc, 'cube', 'trace', tm, s=1); f0 = R.randint(1, 46)
        if horiz:
            c.location = (x + ln / 2, 2, z); kf(c, 'scale', f0, (0.001, 0.02, 0.03)); kf(c, 'scale', f0 + 10, (ln, 0.02, 0.03))
        else:
            c.location = (x, 2, z + ln / 2); kf(c, 'scale', f0, (0.03, 0.02, 0.001)); kf(c, 'scale', f0 + 10, (0.03, 0.02, ln))
        if R.random() < 0.35:
            n = mesh(sc, 'cube', 'node', tm, s=0.12); n.location = (x, 1.98, z); kf(n, 'scale', f0, (0.001,) * 3); kf(n, 'scale', f0 + 4, (1, 1, 1))
    bm = emis('blade', (1.0, 0.35, 0.3), 0.0); blade = mesh(sc, 'torus', 'blade', bm, R=4.2, r=0.07, seg=64, sides=8, arc=0.32); blade.location = (0, 0, 0)
    kf(blade, 'rotation_euler', 50, (math.pi / 2, math.radians(-120), 0)); kf(blade, 'rotation_euler', 62, (math.pi / 2, math.radians(70), 0))
    kf_strength(bm, 49, 0); kf_strength(bm, 52, 40); kf_strength(bm, 62, 30); kf_strength(bm, 72, 0)
    fm = emis('flash', (1.0, 0.6, 0.55), 0.0); fl = mesh(sc, 'plane', 'flash', fm, s=40); fl.location = (0, -4, 0); fl.rotation_euler = (math.pi / 2, 0, 0)
    kf_strength(fm, 58, 0); kf_strength(fm, 61, 2.5); kf_strength(fm, 67, 0)
    kf(fl, 'scale', 1, (0.001, 0.001, 0.001)); kf(fl, 'scale', 57, (0.001, 0.001, 0.001)); kf(fl, 'scale', 58, (1, 1, 1)); kf(fl, 'scale', 67, (1, 1, 1)); kf(fl, 'scale', 68, (0.001, 0.001, 0.001))
    t = title(sc, 'REAPER', (1.0, 0.06, 0.06))
    for k, f in enumerate(range(72, 90, 2)): kf(t, 'location', f, (R.uniform(-0.25, 0.25) if k % 2 else 0, -3.2, -0.2 + (R.uniform(-0.08, 0.08) if k % 3 == 0 else 0)))
    return sc


# ---- the PRIME reveal: all six secrets as orbs in a ring, spiralling into one gold core, then the PRIME you got
SECRET_LOOK = [('BLOODLINE', (1.0, 0.05, 0.05)), ('ECLIPSE', (1.0, 0.75, 0.3)), ('SPECTRE', (0.7, 0.95, 1.0)), ('ABYSS', (0.15, 0.4, 1.0)), ('ARCHANGEL', (1.0, 0.9, 0.7)), ('REAPER', (1.0, 0.06, 0.3))]
def prime_vault(base):
    sc = new_scene('prime_' + base, world=(0.004, 0.003, 0.002))
    cam = camera(sc, (0, -13, 0.4), (0, 0, 0.4), 38); kf(cam, 'location', 1, (0, -13, 0.4)); kf(cam, 'location', 70, (0, -10.5, 0.4)); kf(cam, 'location', FRAMES, (0, -11.5, 0.4))
    for i in range(140):   # dust
        m = emis('dust%d' % (i % 4), (1, 0.85, 0.6), 1 + i % 4); d = mesh(sc, 'ico', 'dust', m, r=R.uniform(0.01, 0.03)); d.location = (R.uniform(-14, 14), R.uniform(4, 16), R.uniform(-8, 8))
    mine = [n for n, c in SECRET_LOOK].index(base.upper())
    for k, (name, col) in enumerate(SECRET_LOOK):
        om = emis('orb%d' % k, col, 0.0); orb = mesh(sc, 'sphere', 'orb', om, r=0.42, seg=32, rings=16)
        rm = emis('orbring%d' % k, col, 0.0); ring = mesh(sc, 'torus', 'orbring', rm, R=0.7, r=0.022, seg=64, sides=6); ring.parent = orb
        kf(ring, 'rotation_euler', 1, (0.4 * k, 0.9, 0)); kf(ring, 'rotation_euler', FRAMES, (0.4 * k + 6, 0.9 + 4, 2))
        lm = emis('lab%d' % k, col, 0.0); lab = text(sc, name, lm, size=0.2, loc=(0, 0, 0), extrude=0.0); lab.parent = orb; lab.location = (0, -0.1, -0.75)
        f0 = 4 + k * 6
        kf_strength(om, f0 - 1, 0); kf_strength(om, f0 + 3, 6); kf_strength(om, f0 + 10, 2.6); kf_strength(rm, f0, 0); kf_strength(rm, f0 + 6, 3.5)
        kf_strength(lm, f0 + 2, 0); kf_strength(lm, f0 + 8, 4); kf_strength(lm, 40, 4); kf_strength(lm, 50, 0)
        if name == 'SPECTRE':
            for j, f in enumerate(range(1, FRAMES, 12)): kf_color(om, f, colorsys.hsv_to_rgb((j * 0.13) % 1, 0.45, 1.0))
        # ring position: slow turn, then a fast spiral into the centre
        for f in range(1, 73, 3):
            spin = 0.012 * f + (max(0, f - 38) / 34) ** 2 * 7.0; rad = 3.3 * (1 - (max(0, f - 40) / 32) ** 1.6) if f < 72 else 0
            a = TAU * k / 6 + spin; kf(orb, 'location', f, (math.cos(a) * rad, 0, math.sin(a) * rad * 0.82 + 0.4))
        kf(orb, 'scale', 1, (0.001,) * 3); kf(orb, 'scale', f0 - 1, (0.001,) * 3); kf(orb, 'scale', f0 + 4, (1.15,) * 3); kf(orb, 'scale', f0 + 9, (1, 1, 1))
        kf(orb, 'scale', 64, (0.8, 0.8, 0.8)); kf(orb, 'scale', 72, (0.001,) * 3)
    # fusion: gold core flash, ring burst and sparks, then a core in the colour of the PRIME you got
    gm = emis('core', (1.0, 0.8, 0.35), 0.0); core = mesh(sc, 'sphere', 'core', gm, r=1.0, seg=48, rings=24); core.location = (0, 0.6, 0.4)
    kf(core, 'scale', 1, (0.001,) * 3); kf(core, 'scale', 64, (0.001,) * 3); kf(core, 'scale', 70, (0.5, 0.5, 0.5)); kf(core, 'scale', 73, (2.2, 2.2, 2.2)); kf(core, 'scale', 82, (0.9, 0.9, 0.9)); kf(core, 'scale', FRAMES, (1.0, 1.0, 1.0))
    kf_strength(gm, 64, 0); kf_strength(gm, 71, 60); kf_strength(gm, 80, 8); kf_color(gm, 72, (1.0, 0.82, 0.4)); kf_color(gm, 84, SECRET_LOOK[mine][1])
    core.location = (0, 1.6, 1.9)
    bm = emis('burst', (1.0, 0.85, 0.45), 0.0); burst = mesh(sc, 'torus', 'burst', bm, R=0.5, r=0.05, seg=96, sides=8); burst.location = (0, 0.5, 0.4); burst.rotation_euler = (math.pi / 2, 0, 0)
    kf(burst, 'scale', 1, (0.001, 0.001, 1)); kf(burst, 'scale', 68, (0.001, 0.001, 1)); kf(burst, 'scale', 69, (0.1, 0.1, 1)); kf(burst, 'scale', 84, (22, 22, 1)); kf(burst, 'scale', 85, (0.001, 0.001, 1)); kf_strength(bm, 69, 0); kf_strength(bm, 71, 40); kf_strength(bm, 84, 2)
    sm = emis('spark', (1.0, 0.85, 0.45), 16.0)
    for i in range(70):
        a = R.uniform(0, TAU); dd = R.uniform(3, 9); sp = mesh(sc, 'ico', 'spark', sm, r=R.uniform(0.02, 0.05))
        kf(sp, 'location', 1, (0, 0.5, 0.4)); kf(sp, 'location', 70, (0, 0.5, 0.4)); kf(sp, 'location', 70 + R.randint(14, 30), (math.cos(a) * dd, 0.5 + R.uniform(-2, 2), math.sin(a) * dd * 0.7 + 0.4))
        kf(sp, 'scale', 1, (0.001,) * 3); kf(sp, 'scale', 69, (0.001,) * 3); kf(sp, 'scale', 71, (1, 1, 1)); kf(sp, 'scale', FRAMES, (0.001,) * 3)
    wm = emis('whiteout', (1.0, 0.9, 0.7), 0.0); wo = mesh(sc, 'sphere', 'whiteout', wm, r=1.0, seg=32, rings=16); wo.location = (0, 0.5, 0.4)   # flash: a light ball that swells past the camera
    kf(wo, 'scale', 1, (0.001,) * 3); kf(wo, 'scale', 69, (0.001,) * 3); kf(wo, 'scale', 72, (9, 9, 9)); kf(wo, 'scale', 76, (14, 14, 14)); kf(wo, 'scale', 77, (0.001,) * 3)
    kf_strength(wm, 69, 30); kf_strength(wm, 72, 8); kf_strength(wm, 76, 3)
    title(sc, SECRET_LOOK[mine][0], SECRET_LOOK[mine][1], start=74)
    return sc

BUILD = {'bloodline': bloodline, 'eclipse': eclipse, 'spectre': spectre, 'abyss': abyss, 'archangel': archangel, 'reaper': reaper}
PRIME = NAME.endswith('_prime')   # PRIME versions use the shared vault reveal with all six secrets
_sc = prime_vault(NAME.replace('_prime', '')) if PRIME else BUILD[NAME]()
ease_all(_sc)
render(_sc, NAME)
cleanup(_sc)
print('rendered', NAME)
