# ASHFALL HQ attachments. Each is modelled around its mount point:
#  optics:   origin = rail top at the optic's centre, sight line at y = OPTIC_H
#  muzzles:  origin = muzzle on the bore axis, device extends toward -z (rifle size; pistol variants end in _p)
#  under:    origin = underside of the handguard at the grip position (lasers: centre of the module)
#  mags:     origin = magazine pivot (top centre of the magazine)
#  stocks:   origin = rear of the receiver on the buffer-tube line
import os, math, json
exec(open(os.path.join(os.path.expanduser('~'), 'Documents', 'ashfall', 'hq', 'hqlib.py')).read(), globals())
MATCOL['dot'] = ((1.0, 0.05, 0.05), 0.0, 0.3)

def lens_disc(g, r, y, z, dot=True):
    g.lathe('lens', [(z + 0.0006, r), (z - 0.0006, r)], y=y, seg=20)
    if dot: g.lathe('dot', [(z + 0.0012, 0.0016), (z + 0.0009, 0.0016)], y=y, seg=8)
def rings(g, zs, y, r, h):
    for z in zs:
        g.lathe('metal', [(z + 0.007, r + 0.003), (z - 0.007, r + 0.003)], y=y, seg=20)
        g.prof('metal', [(z + 0.009, 0.0), (z - 0.009, 0.0), (z - 0.007, y - r), (z + 0.007, y - r)], 0.022, bevel=0.0012)
        g.xcyl('steel', 0.0022, 0.03, (0, 0.004, z))
def turrets(g, z, y, r):
    g.ycyl('metal', 0.008, 0.012, (0, y + r + 0.006, z)); g.ycyl('steel', 0.0085, 0.003, (0, y + r + 0.012, z))
    g.xcyl('metal', 0.008, 0.012, (r + 0.006, y, z)); g.xcyl('steel', 0.0085, 0.003, (r + 0.012, y, z))

def reddot():
    g = Gun('att_reddot'); y = 0.034
    g.prof('metal', [(0.024, 0.0), (-0.024, 0.0), (-0.02, 0.012), (-0.012, y - 0.014), (0.012, y - 0.014), (0.02, 0.012)], 0.03, bevel=0.0015)
    g.ycyl('steel', 0.0055, 0.008, (0.019, 0.006, 0.0)) if False else g.xcyl('steel', 0.006, 0.006, (0.018, 0.006, 0.0))
    g.lathe('metal', [(0.026, 0.0185), (0.022, 0.0185), (0.02, 0.0165), (-0.02, 0.0165), (-0.022, 0.0185), (-0.026, 0.0185)], y=y, seg=24, cap=False)
    g.lathe('metal', [(0.026, 0.0185), (0.026, 0.0145)], y=y, seg=24, cap=False); g.lathe('metal', [(-0.026, 0.0185), (-0.026, 0.0145)], y=y, seg=24, cap=False)
    g.ycyl('metal', 0.0065, 0.008, (0, y + 0.02, 0.004)); g.xcyl('metal', 0.0065, 0.008, (0.02, y, 0.004))
    lens_disc(g, 0.0148, y, -0.02, dot=False); lens_disc(g, 0.0148, y, 0.02, dot=False)
    g.lathe('dot', [(-0.0195, 0.0018), (-0.019, 0.0018)], y=y, seg=8)
    return g.save()
def holo():
    g = Gun('att_holo'); y = 0.035
    g.prof('metal', [(0.045, 0.0), (-0.035, 0.0), (-0.035, 0.012), (0.045, 0.012)], 0.036, bevel=0.002)
    g.prism('metal', [(-0.0195, 0.0), (-0.016, 0.0), (-0.016, 0.044), (-0.0195, 0.044)], -0.035, 0.01, 0.0012, y=0.012)
    g.prism('metal', [(0.016, 0.0), (0.0195, 0.0), (0.0195, 0.044), (0.016, 0.044)], -0.035, 0.01, 0.0012, y=0.012)
    g.prism('metal', [(-0.0195, 0.0), (0.0195, 0.0), (0.0195, 0.005), (-0.0195, 0.005)], -0.035, 0.01, 0.0012, y=0.056)
    g.prof('metal', [(0.045, 0.012), (0.012, 0.012), (0.012, 0.03), (0.04, 0.03)], 0.034, bevel=0.002)      # rear electronics
    for i, sx in enumerate((-0.007, 0.007)): g.box('rubber', (0.008, 0.004, 0.008), (sx, 0.031, 0.03), 0.0008)
    g.xcyl('metal', 0.008, 0.04, (0, 0.006, 0.03))                                                          # battery cap
    g.box('lens', (0.032, 0.03, 0.001), (0, y, -0.02), 0); g.box('lens', (0.032, 0.03, 0.001), (0, y, 0.008), 0)
    g.lathe('dot', [(-0.0185, 0.0024), (-0.0178, 0.0024)], y=y, seg=10)
    g.lathe('dot', [(-0.0185, 0.0105), (-0.0178, 0.0105)], y=y, seg=24, cap=False)   # 65 MOA ring
    return g.save()
def reflex():
    g = Gun('att_reflex'); y = 0.024
    g.prof('metal', [(0.022, 0.0), (-0.02, 0.0), (-0.02, 0.009), (0.022, 0.009)], 0.026, bevel=0.0018)
    g.prof('metal', [(-0.012, 0.009), (-0.019, 0.009), (-0.016, 0.036), (-0.01, 0.036)], 0.026, bevel=0.0015)
    for sx in (-0.012, 0.012): g.prof('metal', [(0.0, 0.009), (-0.016, 0.009), (-0.013, 0.034), (-0.004, 0.032)], 0.003, x=sx, bevel=0.0006)
    g.box('lens', (0.02, 0.018, 0.001), (0, y, -0.012), 0)
    g.lathe('dot', [(-0.0118, 0.0016), (-0.0114, 0.0016)], y=y, seg=8)
    g.box('rubber', (0.008, 0.003, 0.008), (0, 0.0105, 0.014), 0.0006)
    return g.save()
def scope(gid, y, L, ob, oc=0.019, r=0.0152, overlay_rings=True, prism=False):
    g = Gun(gid)
    if prism:   # ACOG-style prism body
        g.prof('metal', [(0.06, y - 0.02), (0.06, y + 0.018), (0.03, y + 0.024), (-0.06, y + 0.024), (-0.07, y + 0.016), (-0.07, y - 0.02)], 0.042, bevel=0.003)
        g.lathe('metal', [(-0.07, 0.019), (-0.105, 0.0205), (-0.11, 0.0205)], y=y, seg=24)
        g.lathe('metal', [(0.06, 0.018), (0.075, 0.018)], y=y, seg=24)
        g.prof('tan', [(0.04, y + 0.024), (-0.05, y + 0.024), (-0.05, y + 0.03), (0.04, y + 0.03)], 0.01, bevel=0.002)   # fibre optic
        g.prof('metal', [(0.05, 0.0), (-0.06, 0.0), (-0.06, y - 0.02), (0.05, y - 0.02)], 0.03, bevel=0.002)
        g.xcyl('steel', 0.006, 0.05, (0, 0.006, -0.03)); g.xcyl('steel', 0.006, 0.05, (0, 0.006, 0.03))
        lens_disc(g, 0.0175, y, -0.11, dot=False); lens_disc(g, 0.015, y, 0.075, dot=False)
        return g.save()
    zf, zr = -L * 0.5, L * 0.5
    g.lathe('metal', [(zr, oc), (zr - 0.05, oc), (zr - 0.07, r), (zf + 0.08, r), (zf + 0.06, ob), (zf, ob)], y=y, seg=28)
    g.lathe('rubber', [(zr + 0.004, oc + 0.001), (zr - 0.008, oc + 0.001)], y=y, seg=28)
    g.lathe('metal', [(-0.012, r + 0.004), (0.012, r + 0.004)], y=y, seg=24)                     # turret saddle
    turrets(g, 0.0, y, r + 0.004)
    rings(g, (zr - 0.085, zf + 0.09), y, r, y)
    lens_disc(g, ob - 0.003, y, zf - 0.0005, dot=False); lens_disc(g, oc - 0.003, y, zr + 0.0005, dot=False)
    return g.save()

def suppressor(gid='att_suppressor', r=0.021, L=0.17):
    g = Gun(gid)
    g.lathe('metal', [(0.0, r * 0.7), (-0.012, r * 0.7), (-0.014, r), (-L + 0.006, r), (-L, r - 0.004), (-L, 0.004)], seg=28)
    g.lathe('steel', [(-0.002, r * 0.75), (-0.012, r * 0.75)], seg=6)                            # hex collar
    for i in range(3): g.lathe('rubber', [(-0.04 - i * 0.045, r + 0.0006), (-0.044 - i * 0.045, r + 0.0006)], seg=28)
    return g.save()
def comp():
    g = Gun('att_comp')
    g.lathe('metal', [(0.0, 0.012), (-0.06, 0.014), (-0.062, 0.011)], seg=20)
    for k in range(3):
        g.box('rubber', (0.012, 0.004, 0.008), (0, 0.0135, -0.016 - k * 0.015), 0)
        for sx in (-1, 1): g.box('rubber', (0.004, 0.006, 0.008), (sx * 0.013, 0.006, -0.016 - k * 0.015), 0)
    return g.save()
def brake():
    g = Gun('att_brake')
    g.lathe('metal', [(0.0, 0.013), (-0.008, 0.016), (-0.064, 0.016), (-0.066, 0.012)], seg=20)
    g.prof('metal', [(-0.006, -0.012), (-0.06, -0.012), (-0.06, 0.012), (-0.006, 0.012)], 0.042, bevel=0.002)
    for k in range(3): g.box('rubber', (0.044, 0.016, 0.009), (0, 0, -0.016 - k * 0.016), 0)
    return g.save()
def choke():
    g = Gun('att_choke')
    g.lathe('metal', [(0.0, 0.0205), (-0.05, 0.0205), (-0.052, 0.018)], seg=24)
    for i in range(6): g.lathe('steel', [(-0.03 - i * 0.003, 0.0212), (-0.0315 - i * 0.003, 0.0212)], seg=24)
    return g.save()
def spreader():
    g = Gun('att_spreader')
    g.lathe('metal', [(0.0, 0.02), (-0.015, 0.02)], seg=24)
    g.prof('metal', [(-0.012, -0.012), (-0.06, -0.008), (-0.06, 0.008), (-0.012, 0.012)], 0.05, bevel=0.002)
    return g.save()

def vgrip():
    g = Gun('att_vgrip')
    g.prof('metal', [(0.022, 0.0), (-0.022, 0.0), (-0.02, -0.009), (0.02, -0.009)], 0.026, bevel=0.0012)
    g.lathe('poly', [(0, 0)], seg=4) if False else None
    g.prof('poly', [(0.014, -0.008), (-0.014, -0.008), (-0.016, -0.04), (-0.014, -0.085), (0.012, -0.085), (0.016, -0.04)], 0.026, bevel=0.004, segs=3)
    for i in range(5): g.box('poly', (0.028, 0.0025, 0.03), (0, -0.03 - i * 0.011, -0.001), 0.0008)
    g.prof('rubber', [(0.014, -0.083), (-0.016, -0.083), (-0.016, -0.09), (0.014, -0.09)], 0.03, bevel=0.002)
    return g.save()
def agrip():
    g = Gun('att_agrip')
    g.prof('poly', [(0.045, 0.0), (-0.045, 0.0), (-0.05, -0.012), (-0.03, -0.03), (0.04, -0.012)], 0.026, bevel=0.004, segs=3)
    g.prof('metal', [(0.035, 0.0), (-0.035, 0.0), (-0.035, -0.004), (0.035, -0.004)], 0.024, bevel=0.0008)
    return g.save()
def bipod():
    g = Gun('att_bipod')
    g.prof('metal', [(0.02, 0.0), (-0.02, 0.0), (-0.018, -0.016), (0.018, -0.016)], 0.034, bevel=0.002)
    g.xcyl('steel', 0.004, 0.044, (0, -0.012, -0.012))
    for sx in (-0.012, 0.012):
        g.prism('steel', [(-0.0035, -0.0035), (0.0035, -0.0035), (0.0035, 0.0035), (-0.0035, 0.0035)], -0.2, -0.012, 0.0008, x=sx, y=-0.018)
        g.prism('metal', [(-0.0045, -0.0045), (0.0045, -0.0045), (0.0045, 0.0045), (-0.0045, 0.0045)], -0.1, -0.012, 0.0008, x=sx, y=-0.018)
        g.box('rubber', (0.008, 0.008, 0.012), (sx, -0.018, -0.205), 0.002)
    return g.save()
def laser():
    g = Gun('att_laser')
    g.prof('od', [(0.028, -0.011), (-0.028, -0.011), (-0.028, 0.011), (0.028, 0.011)], 0.022, bevel=0.003, segs=3)
    g.lathe('metal', [(-0.028, 0.0045), (-0.031, 0.0045)], x=0.004, y=0.004, seg=14); g.lathe('lens', [(-0.031, 0.003), (-0.0315, 0.003)], x=0.004, y=0.004, seg=12)
    g.lathe('metal', [(-0.028, 0.0035), (-0.03, 0.0035)], x=-0.005, y=-0.004, seg=12); g.lathe('dot', [(-0.03, 0.0022), (-0.0305, 0.0022)], x=-0.005, y=-0.004, seg=10)
    for i in range(2): g.box('rubber', (0.006, 0.004, 0.006), (0, 0.012, 0.01 - i * 0.012), 0.0008)
    return g.save()

def drum():
    # drum hangs straight under the mag well, flat face toward the muzzle
    g = Gun('att_drum'); cy, R = -0.088, 0.062
    g.prof('metal', [(0.026, 0.004), (-0.03, 0.004), (-0.03, -0.035), (0.026, -0.035)], 0.024, bevel=0.0015)
    g.prism('metal', [(math.cos(a / 30 * math.tau) * R, math.sin(a / 30 * math.tau) * R) for a in range(30)], -0.03, 0.026, 0.005, y=cy)
    g.prism('steel', [(math.cos(a / 20 * math.tau) * 0.026, math.sin(a / 20 * math.tau) * 0.026) for a in range(20)], -0.032, 0.028, 0.002, y=cy)
    g.lathe('steel', [(0.034, 0.008), (-0.036, 0.008)], y=cy, seg=14)
    return g.save()
def pext():
    g = Gun('att_pext')
    g.prof('poly', [(0.022, 0.0), (-0.026, 0.0), (-0.03, -0.04), (0.018, -0.04)], 0.032, bevel=0.0025)
    for i in range(3): g.box('poly', (0.033, 0.002, 0.044), (0, -0.01 - i * 0.01, -0.004), 0)
    return g.save()
def speedloader():
    g = Gun('att_speedloader')
    g.ycyl('metal', 0.022, 0.024, (0, 0, 0), seg=18); g.ycyl('steel', 0.008, 0.02, (0, 0.02, 0), seg=12)
    for k in range(6):
        a = k / 6 * math.tau; g.ycyl('brass', 0.0045, 0.03, (math.cos(a) * 0.014, -0.02, math.sin(a) * 0.014), seg=8)
    return g.save()
def tacstock():
    g = Gun('att_tacstock')
    g.prof('poly', [(0.08, 0.018), (0.22, 0.026), (0.225, -0.074), (0.205, -0.078), (0.17, -0.03), (0.11, -0.02), (0.08, -0.014)], 0.034, bevel=0.003, segs=3)
    g.prof('poly', [(0.1, 0.017), (0.2, 0.023), (0.2, 0.037), (0.1, 0.031)], 0.03, bevel=0.003)
    g.prof('rubber', [(0.222, 0.03), (0.238, 0.03), (0.24, -0.08), (0.224, -0.08)], 0.04, bevel=0.003)
    g.box('steel', (0.01, 0.008, 0.024), (0, -0.022, 0.14), 0.001)
    return g.save()
def lightstock():
    g = Gun('att_lightstock')
    g.prism('steel', [(-0.004, -0.004), (0.004, -0.004), (0.004, 0.004), (-0.004, 0.004)], 0.04, 0.22, 0.0012, y=0.02)
    g.prof('steel', [(0.06, -0.02), (0.22, -0.065), (0.22, -0.074), (0.06, -0.028)], 0.008, bevel=0.002)
    g.prof('rubber', [(0.214, 0.026), (0.23, 0.026), (0.23, -0.078), (0.214, -0.078)], 0.03, bevel=0.003)
    return g.save()
def tube_ext():
    g = Gun('att_tube')
    g.lathe('metal', [(0.0, 0.0108), (-0.12, 0.0108), (-0.122, 0.009)], seg=16)
    g.box('steel', (0.016, 0.026, 0.012), (0, 0.012, -0.11), 0.001)
    return g.save()
def carrier():
    g = Gun('att_carrier')
    g.prof('poly', [(0.05, -0.018), (-0.05, -0.018), (-0.05, 0.018), (0.05, 0.018)], 0.008, bevel=0.0015)
    for k in range(4): g.lathe('brass', [(0.0, 0.0)], seg=3) if False else g.ycyl('wood' if False else 'tan', 0.0095, 0.032, (0.008, 0, -0.036 + k * 0.024), seg=12)
    return g.save()

res = {}
for f, a in ((reddot, ()), (holo, ()), (reflex, ()), (scope, ('att_scope25', 0.044, 0.24, 0.021)), (scope, ('att_acog4', 0.044, 0, 0, 0.019, 0.015, True, True)),
             (scope, ('att_scope6', 0.05, 0.3, 0.027)), (scope, ('att_scope10', 0.052, 0.34, 0.031)), (scope, ('att_scope35', 0.046, 0.22, 0.022)),
             (suppressor, ()), (suppressor, ('att_suppressor_p', 0.016, 0.15)), (comp, ()), (brake, ()), (choke, ()), (spreader, ()),
             (vgrip, ()), (agrip, ()), (bipod, ()), (laser, ()), (drum, ()), (pext, ()), (speedloader, ()), (tacstock, ()), (lightstock, ()), (tube_ext, ()), (carrier, ())):
    try: res[(a[0] if a else f.__name__)] = f(*a)
    except Exception as e:
        import traceback; traceback.print_exc(); res[(a[0] if a else f.__name__)] = 'ERR ' + str(e)
print('ATTACHMENTS', res)
