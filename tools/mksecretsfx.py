#!/usr/bin/env python3
"""Sound for the six secret-camo reveal clips, timed to their animation (hq/anim_secrets.py, 30 fps, 4 s).
Writes <out>/secret_<name>.wav (48 kHz stereo). The random event times are rebuilt with the same seed the
Blender scenes used, so splashes and circuit blips land on the frames they appear."""
import sys, os, random, numpy as np
from scipy import signal
SR, DUR, FPS = 48000, 4.0, 30
N = int(SR * DUR)
T = lambda f: (f - 1) / FPS
rng = np.random.default_rng(3)

def silence(): return np.zeros((N, 2))
def mixl(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def tt(d): return np.arange(int(SR * d)) / SR
def env(d, a=0.005, r=None, curve=3.0):
    t = tt(d); r = d - a if r is None else r
    e = np.clip(t / max(a, 1e-4), 0, 1) * np.exp(-curve * np.clip(t - a, 0, None) / max(r, 1e-4)); return e
def sine(f, d, f2=None):
    t = tt(d); f = np.full_like(t, f) if f2 is None else np.geomspace(f, f2, len(t)); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def saw(f, d): t = tt(d); return 2 * ((t * f) % 1) - 1
def noise(d): return rng.standard_normal(int(SR * d))
def bp(x, lo, hi, o=2): b, a = signal.butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def put(buf, x, at, gain=1.0, pan=0.0):
    i = int(at * SR); x = x[: max(0, N - i)]
    if i >= N or len(x) == 0: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(x), 0] += x * gain * l * 1.41; buf[i:i + len(x), 1] += x * gain * r * 1.41
def reverb(buf, size=1.6, mix=0.3):
    ir_t = tt(size); out = buf.copy()
    for ch in range(2):
        ir = rng.standard_normal(len(ir_t)) * np.exp(-4.5 * ir_t / size); ir = lp(ir, 6000); ir /= np.sqrt((ir ** 2).sum())
        out[:, ch] = buf[:, ch] * (1 - mix) + signal.fftconvolve(buf[:, ch], ir)[:N] * mix * 0.9
    return out
def boom(d=2.0, f0=90, f1=32): return sine(f0, d, f1) * env(d, 0.004, d, 4) + lp(noise(d), 180) * env(d, 0.002, 0.4, 6) * 0.6
def whoosh(d, lo=300, hi=4000, up=True):
    x = noise(d); t = tt(d); k = np.linspace(0, 1, len(t)) if up else np.linspace(1, 0, len(t))
    y = np.zeros_like(x); seg = 2400
    for s in range(0, len(x), seg):
        c = lo + (hi - lo) * k[s]; y[s:s + seg] = bp(x[s:s + seg], max(40, c * 0.6), min(20000, c * 1.4))
    return y * np.sin(np.pi * np.linspace(0, 1, len(t))) ** 1.5
def chord(freqs, d, wobble=0.003, soft=True):
    t = tt(d); x = np.zeros_like(t)
    for f in freqs:
        for det in (-wobble, 0, wobble): x += np.sin(2 * np.pi * f * (1 + det) * t + rng.uniform(0, 6)) + (0.3 * saw(f * (1 + det), d) if not soft else 0)
    return x / (len(freqs) * 3)
def bell(f, d=2.5): t = tt(d); return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * (1.2 + m)) for m, a in ((1, 1), (2.76, 0.5), (5.4, 0.25), (8.9, 0.12)))
def master(buf, peak=0.89):
    m = np.abs(buf).max() or 1; buf = np.tanh(buf / m * 1.1) / np.tanh(1.1) * peak
    fade = np.ones(N); fade[-int(SR * 0.3):] = np.linspace(1, 0, int(SR * 0.3)); return buf * fade[:, None]

# ---------------------------------------------------------------------------- each camo
def bloodline():
    b = silence()
    # low red drone that swells into the title
    d = chord([55, 82.5], DUR, 0.004, soft=False); put(b, lp(d, 500) * np.linspace(0.3, 1, len(d)), 0, 0.25)
    for i, f in enumerate([8, 20, 32, 44, 56, 66]):   # heartbeats: lub-dub
        for k, (dt, g) in enumerate(((0, 1.0), (0.17, 0.7))): put(b, boom(0.45, 70 - k * 8, 34) , T(f) + dt, (0.55 + i * 0.07) * g)
    R = random.Random(7)   # same calls as anim_secrets.bloodline -> splash frames
    for i in range(30):
        x, y, f0 = R.uniform(-6, 6), R.uniform(-2, 5), R.randint(1, 56); R.uniform(0.1, 0.2)
        drip = sine(900 + (i % 5) * 120, 0.06, 300) * env(0.06, 0.001, 0.05, 4)
        splat = bp(noise(0.25), 500, 3500) * env(0.25, 0.002, 0.2, 7)
        put(b, mixl(drip, splat * 0.8), T(f0 + 12), 0.22, pan=max(-1, min(1, x / 6)))
    put(b, boom(2.6, 110, 28), T(72), 1.1); put(b, whoosh(0.6, 2000, 200, up=False), T(70), 0.4)
    put(b, chord([110, 164.8, 220], 1.6, 0.006, soft=False) * env(1.6, 0.02, 1.5, 2), T(72), 0.35)
    return reverb(b, 1.8, 0.35)

def eclipse():
    b = silence()
    put(b, chord([65.4, 98, 130.8], 1.9) * np.linspace(0.2, 1, int(SR * 1.9)), 0, 0.35)       # tension as the moon slides in
    put(b, lp(whoosh(1.8, 200, 1500), 2000), T(1), 0.35, -0.6)
    put(b, sine(1200, 0.5, 2400) * env(0.5, 0.01, 0.45, 2), T(52), 0.15)                       # the last glint
    put(b, boom(2.2, 60, 30), T(56), 0.9)                                                       # totality
    shimmer = chord([523.3, 659.3, 784, 1046.5], 2.4, 0.008) * env(2.4, 0.15, 2.2, 1.6); put(b, hp(shimmer, 300), T(58), 0.55)   # the corona flares
    put(b, chord([130.8, 196, 261.6, 329.6], 2.0, 0.005) * env(2.0, 0.4, 1.6, 1.2), T(60), 0.5)                                   # choir-like pad
    put(b, bell(392, 2.0), T(72), 0.6, 0.2); put(b, bell(587.3, 1.8), T(72.5), 0.4, -0.2)       # gong on the title
    return reverb(b, 2.4, 0.45)

def spectre():
    b = silence()
    wh = bp(noise(DUR), 900, 2600) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.7 * tt(DUR))); put(b, wh, 0, 0.12, -0.3)   # ghostly breath
    t = tt(DUR); theremin = np.sin(2 * np.pi * np.cumsum(440 + 120 * np.sin(2 * np.pi * 0.9 * t) + 30 * np.sin(2 * np.pi * 6 * t)) / SR)
    put(b, theremin * np.linspace(0.6, 1, len(t)), 0, 0.13, 0.3)
    for i, f in enumerate(range(4, 70, 6)): put(b, bell(880 * (1.0, 1.25, 1.5, 1.875)[i % 4], 1.4), T(f), 0.16, ((i % 3) - 1) * 0.7)   # orbiting chimes
    for f in [74, 76, 79, 83, 88]:                                                                                                       # glitch zaps on the flicker
        put(b, (np.sign(sine(180, 0.07, 1800)) * 0.4 + bp(noise(0.07), 2000, 8000)) * env(0.07, 0.001, 0.06, 3), T(f), 0.35)
    put(b, sine(220, 2.0, 110) * env(2.0, 0.01, 2.0, 2) + sine(330, 2.0, 165) * env(2.0, 0.01, 2.0, 2) * 0.6, T(72), 0.45)
    return reverb(b, 2.8, 0.5)

def abyss():
    b = silence()
    put(b, whoosh(3.0, 150, 3000), 0, 0.55)                                                  # the dive
    for i in range(1, 46):                                                                  # each ring rushing past
        f = 1 + 91 * i / 46; put(b, sine(90, 0.12, 50) * env(0.12, 0.002, 0.1, 4), T(f), 0.18, (-0.5 if i % 2 else 0.5))
    put(b, lp(saw(41.2, DUR), 140) * np.linspace(0.3, 1, N), 0, 0.3)                          # deep pressure
    put(b, boom(2.5, 70, 22), T(90), 1.1)                                                     # the bottom
    for k, at in enumerate((92, 102, 112)): put(b, sine(1320, 1.2, 1300) * env(1.2, 0.002, 1.1, 5), T(at), 0.32 * (0.6 ** k))   # sonar pings
    return reverb(b, 3.0, 0.5)

def archangel():
    b = silence()
    harp = [261.6, 329.6, 392, 523.3, 659.3, 784, 1046.5, 1318.5]
    for i, f in enumerate(range(6, 52, 3)):                                                  # a harp run as the feathers unfold
        n = harp[i % len(harp)] * (1 if i < len(harp) else 1.0); x = sum(np.sin(2 * np.pi * n * m * tt(1.2)) / m ** 1.6 for m in (1, 2, 3)) * env(1.2, 0.002, 1.1, 4)
        put(b, x, T(f), 0.22, ((i % 5) - 2) / 3)
    put(b, chord([261.6, 329.6, 392, 523.3], 3.2, 0.006) * env(3.2, 0.8, 2.4, 1.2), T(10), 0.45)   # choir
    put(b, hp(noise(1.0), 6000) * env(1.0, 0.3, 0.7, 2), T(40), 0.08)                                 # air
    put(b, bell(1046.5, 2.4), T(72), 0.55); put(b, bell(784, 2.4), T(72), 0.45, -0.3); put(b, bell(1318.5, 2.0), T(73), 0.35, 0.3)
    return reverb(b, 3.2, 0.55)

def reaper():
    b = silence()
    R = random.Random(7)   # same calls as anim_secrets.reaper -> when each trace starts growing
    for i in range(90):
        horiz = R.random() < 0.6; R.choice([1.0, 1.5, 2.0, 3.0]); x = round(R.uniform(-8, 8) * 2) / 2; R.uniform(-4.5, 4.5); f0 = R.randint(1, 46)
        node = R.random() < 0.35
        if i % 2 == 0: put(b, np.sign(sine(1200 + (i % 7) * 260, 0.03)) * env(0.03, 0.001, 0.025, 3), T(f0), 0.07, x / 8)
    put(b, lp(saw(55, 1.7), 300) * np.linspace(0, 1, int(SR * 1.7)), 0, 0.3)                     # building hum
    put(b, whoosh(0.45, 600, 7000), T(50), 0.7, -0.4)                                             # the scythe
    slash = mixl(hp(noise(0.5), 3000) * env(0.5, 0.002, 0.4, 5), bell(2400, 0.8) * 0.4)
    put(b, slash, T(57), 0.6, 0.4); put(b, boom(2.2, 80, 26), T(60), 1.2)                          # impact on the flash
    for k, f in enumerate(range(72, 90, 2)):                                                       # glitch stutter on the title
        put(b, (bp(noise(0.05), 300, 4000) + np.sign(sine(90 + k * 15, 0.05)) * 0.5) * env(0.05, 0.001, 0.045, 2), T(f), 0.3, (k % 2) * 0.8 - 0.4)
    put(b, chord([55, 58.3, 82.4], 1.8, 0.004, soft=False) * env(1.8, 0.01, 1.7, 2), T(72), 0.4)   # dissonant sting
    return reverb(b, 1.6, 0.35)

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    from scipy.io import wavfile
    for name, fn in [('bloodline', bloodline), ('eclipse', eclipse), ('spectre', spectre), ('abyss', abyss), ('archangel', archangel), ('reaper', reaper)]:
        x = master(fn()); wavfile.write(os.path.join(out, 'secret_%s.wav' % name), SR, (x * 32767).astype(np.int16)); print('wrote', name)
