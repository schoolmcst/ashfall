# ASHFALL HQ shared assemblies (AR-15 lower/upper, magazines, barrels, sights)
import os, math
exec(open(os.path.join(os.path.expanduser('~'), 'Documents', 'ashfall', 'hq', 'hqlib.py')).read(), globals())
BORE = 0.012

# ============================================================== shared AR-15 parts
def ar_lower(g, m='metal', grip='poly'):
    # lower receiver: magwell, trigger housing, buffer tower
    g.prof(m, [(0.062, 0.0), (0.062, -0.016), (0.05, -0.03), (0.012, -0.03), (-0.005, -0.036), (-0.058, -0.036), (-0.062, -0.058), (-0.128, -0.058), (-0.13, -0.036), (-0.14, -0.028), (-0.142, 0.0)], 0.022, bevel=0.0018)
    g.prof(m, [(-0.06, -0.034), (-0.064, -0.06), (-0.126, -0.06), (-0.128, -0.034)], 0.026, bevel=0.002)      # flared magwell
    g.prof(m, [(-0.052, -0.034), (-0.056, -0.05), (0.004, -0.05), (0.012, -0.036), (0.004, -0.041), (-0.046, -0.044), (-0.046, -0.036)], 0.007, bevel=0.0008)   # trigger guard
    g.prof('steel', [(-0.02, -0.03), (-0.022, -0.045), (-0.018, -0.046), (-0.014, -0.032)], 0.004, bevel=0.0004)  # trigger
    g.prof(grip, [(0.008, -0.03), (0.046, -0.03), (0.052, -0.04), (0.071, -0.112), (0.064, -0.122), (0.042, -0.124), (0.036, -0.112), (0.03, -0.094), (0.024, -0.09), (0.03, -0.082), (0.02, -0.07), (0.012, -0.052), (0.004, -0.04)], 0.026, bevel=0.003, segs=3)   # A2 grip
    for i in range(4): g.box(grip, (0.028, 0.0018, 0.004), (0, -0.07 - i * 0.011, 0.047 + i * 0.0035), 0, rx=0.32)
    g.xcyl('steel', 0.0032, 0.024, (0, -0.012, -0.128)); g.xcyl('steel', 0.0032, 0.024, (0, -0.012, 0.045))   # takedown pins
    g.prof('steel', [(-0.004, -0.008), (0.006, -0.012), (0.004, -0.016), (-0.006, -0.012)], 0.003, x=-0.012, bevel=0.0003)  # selector
    g.xcyl('steel', 0.004, 0.003, (-0.0125, -0.01, 0.0))
    g.box('steel', (0.004, 0.014, 0.02), (0.0125, -0.02, -0.07), 0.0005)   # mag release / bolt catch
def ar_upper(g, z0=0.042, z1=-0.142, m='metal'):
    g.prism(m, [(-0.011, -0.001), (0.011, -0.001), (0.0115, 0.022), (0.009, 0.029), (-0.009, 0.029), (-0.0115, 0.022)], z1, z0, 0.0012)
    g.prism(m, [(-0.0125, 0.0), (0.0125, 0.0), (0.0125, 0.012), (-0.0125, 0.012)], z1 + 0.06, z0 - 0.005, 0.0015)   # wider lower half
    g.rail(z0 - 0.002, z1, 0.029, m='metal')
    g.box('steel', (0.0015, 0.016, 0.052), (0.0128, 0.011, -0.052), 0.0003)      # ejection port cover
    g.box('metal', (0.003, 0.004, 0.006), (0.0137, 0.011, -0.03), 0.0003)
    g.lathe('steel', [(0.018, 0.0055), (0.004, 0.0055), (0.002, 0.0048)], x=0.015, y=0.02, seg=14)        # forward assist
    g.prism('poly', [(-0.004, 0.0), (0.004, 0.0), (0.004, 0.006), (-0.004, 0.006)], 0.03, z0 + 0.012, 0.0008, y=0.022)   # charging handle shaft
    g.prism('poly', [(-0.016, 0.0), (0.016, 0.0), (0.014, 0.007), (-0.014, 0.007)], z0 + 0.004, z0 + 0.014, 0.001, y=0.021)  # T-handle
def stanag(g, piv, n=30, m='metal'):
    g.use('mag', piv); px, py, pz = piv
    L = 0.145 if n == 30 else 0.11
    # gently curved box magazine, profile in z/y relative to pivot
    pts = [(0.03, 0.006), (-0.032, 0.006), (-0.036, -L * 0.55), (-0.043, -L), (0.019, -L - 0.004), (0.027, -L * 0.5)]
    g.prof(m, [(pz + z, py + y) for z, y in pts], 0.0215, x=0, bevel=0.0018)
    for i in range(6): g.box(m, (0.0228, 0.002, 0.052), (0, py - 0.02 - i * 0.02, pz - 0.003 - i * 0.0012), 0, rx=0.0)
    g.prof('poly', [(pz + 0.024, py - L - 0.002), (pz - 0.046, py - L - 0.006), (pz - 0.048, py - L - 0.016), (pz + 0.026, py - L - 0.012)], 0.026, bevel=0.0018)  # baseplate
    g.use('body')
def birdcage(g, z0, y=BORE):
    g.lathe('metal', [(z0, 0.0105), (z0 - 0.006, 0.0105), (z0 - 0.006, 0.0115), (z0 - 0.055, 0.0115), (z0 - 0.055, 0.0095)], y=y, seg=20)
    for k in range(5):
        a = k / 5 * math.tau + 0.6
        g.box('poly', (0.0035, 0.0035, 0.03), (math.cos(a) * 0.0108, y + math.sin(a) * 0.0108, z0 - 0.03), 0, rz=a)
def barrel(g, z0, z1, r=0.0075, y=BORE, m='metal'):
    g.lathe(m, [(z0, r + 0.003), (z0 - 0.02, r + 0.003), (z0 - 0.022, r), (z1 + 0.04, r), (z1 + 0.03, r - 0.0012), (z1, r - 0.0012)], y=y, seg=18)


def buis(g, zr, zf, ry):
    """folding rail sights: rear aperture at zr, front post at zf, sight line at ry + 0.034"""
    g.use('irons')
    g.prof('metal', [(zr + 0.012, ry), (zr - 0.012, ry), (zr - 0.008, ry + 0.012), (zr - 0.004, ry + 0.032), (zr + 0.006, ry + 0.032), (zr + 0.01, ry + 0.012)], 0.018, bevel=0.0009)
    g.xcyl('metal', 0.0045, 0.003, (0, ry + 0.034, zr)); g.xcyl('poly', 0.0014, 0.0035, (0, ry + 0.034, zr))
    g.prof('metal', [(zf + 0.01, ry), (zf - 0.01, ry), (zf - 0.006, ry + 0.022), (zf + 0.006, ry + 0.022)], 0.016, bevel=0.0009)
    for sx in (-0.006, 0.006): g.box('metal', (0.002, 0.014, 0.006), (sx, ry + 0.029, zf), 0.0003)
    g.box('steel', (0.0018, 0.012, 0.0018), (0, ry + 0.03, zf), 0.0002)
    g.use('body')
def ar15(g, hg_end=-0.33, muzzle=-0.465, stock='m4', fsb=True, hg='quad', mag=30, tan=False):
    """complete AR-15 (lower, upper, handguard, barrel, muzzle, stock, magazine). Returns rail top y."""
    ar_lower(g, m='tan' if tan else 'metal'); ar_upper(g, m='tan' if tan else 'metal')
    if hg == 'quad':
        oct8 = [(-0.022, -0.026), (0.022, -0.026), (0.027, -0.02), (0.027, 0.02), (0.022, 0.026), (-0.022, 0.026), (-0.027, 0.02), (-0.027, -0.02)]
        g.prism('metal', oct8, hg_end, -0.143, 0.0012, y=BORE)
        g.rail(-0.143, hg_end, BORE + 0.026, m='metal')
        g.rail(-0.15, hg_end + 0.01, BORE, m='metal', x=0.027, side=1); g.rail(-0.15, hg_end + 0.01, BORE, m='metal', x=-0.027, side=-1)
        g.prism('metal', [(-0.0106, 0), (0.0106, 0), (0.0106, -0.008), (-0.0106, -0.008)], hg_end + 0.01, -0.15, 0.0004, y=BORE - 0.026)
    else:   # slim round M-LOK handguard with slots and a full top rail
        ring = [(math.cos(a / 12 * math.tau) * 0.0225, math.sin(a / 12 * math.tau) * 0.024) for a in range(12)]
        g.prism('tan' if tan else 'metal', ring, hg_end, -0.143, 0.001, y=BORE + 0.002)
        g.rail(-0.143, hg_end, BORE + 0.026, m='metal')
        n = int((-0.15 - hg_end) / 0.04)
        for i in range(n):
            for sx in (-1, 1): g.box('poly', (0.003, 0.008, 0.026), (sx * 0.0222, BORE - 0.002, -0.165 - i * 0.04), 0)
            g.box('poly', (0.008, 0.003, 0.026), (0, BORE - 0.022, -0.165 - i * 0.04), 0)
    g.lathe('metal', [(-0.143, 0.028), (-0.149, 0.028)], y=BORE, seg=24)
    barrel(g, -0.142, muzzle)
    if fsb:
        fz = hg_end - 0.03
        g.prof('metal', [(fz + 0.013, 0.002), (fz + 0.013, 0.026), (fz + 0.003, 0.062), (fz - 0.003, 0.062), (fz - 0.013, 0.026), (fz - 0.013, 0.002)], 0.016, bevel=0.0012)
        g.lathe('metal', [(fz + 0.015, 0.012), (fz - 0.015, 0.012)], y=BORE, seg=18)
        g.prof('metal', [(fz + 0.003, 0.062), (fz - 0.003, 0.062), (fz - 0.003, 0.072), (fz + 0.003, 0.072)], 0.012, bevel=0.0006)
        g.box('steel', (0.002, 0.012, 0.002), (0, 0.078, fz), 0.0002)
    birdcage(g, muzzle)
    g.tube('metal', 0.0145, 0.06, 0.25, y=0.006, seg=20)
    g.lathe('metal', [(0.06, 0.018), (0.068, 0.018), (0.068, 0.0145)], y=0.006, seg=20)
    if stock == 'm4':
        g.prof('poly', [(0.15, 0.024), (0.27, 0.03), (0.272, -0.07), (0.255, -0.072), (0.215, -0.03), (0.17, -0.018), (0.15, -0.012)], 0.03, bevel=0.003, segs=3)
        g.prof('rubber', [(0.268, 0.032), (0.282, 0.032), (0.284, -0.074), (0.27, -0.074)], 0.034, bevel=0.003)
        g.box('steel', (0.012, 0.006, 0.02), (0, -0.022, 0.19), 0.0008)
    elif stock == 'a2':
        g.prof('poly', [(0.062, 0.022), (0.3, 0.022), (0.305, -0.085), (0.29, -0.09), (0.16, -0.045), (0.062, -0.02)], 0.034, bevel=0.0035, segs=3)
        g.prof('metal', [(0.3, 0.024), (0.312, 0.024), (0.314, -0.09), (0.302, -0.09)], 0.037, bevel=0.002)
    elif stock == 'prs':
        g.prof('poly', [(0.15, 0.03), (0.27, 0.03), (0.275, -0.09), (0.26, -0.092), (0.24, -0.05), (0.2, -0.04), (0.2, -0.065), (0.18, -0.068), (0.17, -0.03), (0.15, -0.015)], 0.032, bevel=0.003, segs=3)
        g.prof('poly', [(0.17, 0.034), (0.25, 0.034), (0.25, 0.046), (0.17, 0.046)], 0.03, bevel=0.003)
        g.prof('rubber', [(0.27, 0.032), (0.284, 0.032), (0.286, -0.094), (0.272, -0.094)], 0.036, bevel=0.003)
    stanag(g, (0, -0.04, -0.094), n=mag)
    return 0.0375
