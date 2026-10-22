/* ================================================================== sound pass: 3D sound, walls, rooms, surfaces, zombies
   Sits on top of core.js (synth + buses) and samples.js (recordings):
   - at() now also says where the sound is (x, y, z) and whether a wall or floor is in the way (the bots' walk grid);
     outNode() turns that into a 3D (HRTF) panner, a muffling filter through walls, and more reverb far away.
   - every map gets its own acoustics: a long hall reverb in the hospital and the terminal, tight rooms in the killhouse,
     open air with a slap-back echo outside. Indoor maps get their own ambience (hum, drips, creaks, screams).
   - the master chain: a little warmth, a filter that muffles the world (close explosions, low health) and a limiter.
   - footsteps by surface, bullet impacts and ricochets, a body hit thud, ear ringing after a close blast,
     and proper zombie voices (moans, screeches when they swing, gurgles when they die). */
const AUD = { revIn: null, conv: null, revOut: null, echo: null, mfilt: null, windBus: null, ir: {}, prof: null, deafT: 0, amb: [], ringT: 0 };
listener.y = 1.7; listener.fy = 0;
const AUD_PROF = {
  blackwell: { len: 3.0, pow: 2.4, wet: 0.5, echo: 0, dark: 0.55, amb: 'hosp', surf: 'tile' },
  skyport: { len: 2.5, pow: 2.6, wet: 0.42, echo: 0, dark: 0.35, amb: 'hall', surf: 'tile' },
  killhouse: { len: 1.0, pow: 3.2, wet: 0.36, echo: 0, dark: 0.3, amb: 'room', surf: 'concrete' },
  metro: { len: 2.2, pow: 2.6, wet: 0.45, echo: 0, dark: 0.45, amb: 'hall', surf: 'concrete' },
  whiteout: { len: 1.2, pow: 3.6, wet: 0.16, echo: 0.42, dark: 0.2, amb: 'wind', surf: 'snow' },
  ridgeline: { len: 1.4, pow: 3.4, wet: 0.18, echo: 0.5, dark: 0.3, amb: 'wind', surf: 'grass' },
  dustwater: { len: 1.3, pow: 3.4, wet: 0.2, echo: 0.36, dark: 0.15, amb: 'wind', surf: 'sand' },
  blackwater: { len: 1.4, pow: 3.2, wet: 0.2, echo: 0.3, dark: 0.35, amb: 'wind', surf: 'wood' },
  spire: { len: 1.1, pow: 3.8, wet: 0.12, echo: 0.6, dark: 0.1, amb: 'wind', surf: 'concrete' },
  _out: { len: 1.4, pow: 3.4, wet: 0.2, echo: 0.34, dark: 0.25, amb: 'wind', surf: 'concrete' },
};
const audProf = id => AUD_PROF[id] || AUD_PROF._out;

/* ---------- impulse responses: early reflections, then a decaying (and darkening) noise tail */
function audIR(p) {
  const key = p.len + ':' + p.pow + ':' + p.dark; if (AUD.ir[key]) return AUD.ir[key];
  const sr = actx.sampleRate, len = Math.floor(sr * p.len), ir = actx.createBuffer(2, len, sr), rng = makeRng(99);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c); let lp = 0;
    for (let i = 0; i < len; i++) { const k = i / len, n = rng() * 2 - 1; lp = lp + (n - lp) * (1 - p.dark * Math.min(1, k * 1.6) * 0.9); d[i] = lp * Math.pow(1 - k, p.pow); }
    for (let e = 0; e < 7; e++) { const at = Math.floor(sr * (0.008 + rng() * 0.05)), g = (0.6 - e * 0.07) * (rng() < 0.5 ? -1 : 1); if (at < len) d[at] += g; }
  }
  return (AUD.ir[key] = ir);
}
// set up the extra chain once the context exists (wraps initAudio)
function audExtras() {
  // master: warmth -> world filter -> limiter
  bus.master.disconnect();
  const warm = actx.createBiquadFilter(); warm.type = 'lowshelf'; warm.frequency.value = 150; warm.gain.value = 2.5;
  const air = actx.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 7000; air.gain.value = 1.5;
  const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 20000; f.Q.value = 0.4;
  const lim = actx.createDynamicsCompressor(); lim.threshold.value = -12; lim.knee.value = 10; lim.ratio.value = 8; lim.attack.value = 0.002; lim.release.value = 0.2;
  bus.master.connect(warm); warm.connect(air); air.connect(f); f.connect(lim); lim.connect(actx.destination);
  AUD.mfilt = f;
  // effects: our own reverb (swapped per map) and an outdoor slap-back echo
  bus.sfx.disconnect(); bus.sfx.connect(bus.master);
  AUD.revIn = actx.createGain(); bus.sfx.connect(AUD.revIn);
  AUD.conv = actx.createConvolver(); AUD.revOut = actx.createGain(); AUD.revIn.connect(AUD.conv); AUD.conv.connect(AUD.revOut); AUD.revOut.connect(bus.master);
  const dl = actx.createDelay(1.5), dlf = actx.createBiquadFilter(), fb = actx.createGain(), eg = actx.createGain();
  dlf.type = 'lowpass'; dlf.frequency.value = 1400; fb.gain.value = 0.32; eg.gain.value = 0;
  AUD.revIn.connect(eg); eg.connect(dl); dl.connect(dlf); dlf.connect(fb); fb.connect(dl); dlf.connect(bus.master);
  AUD.echo = { dl, eg };
}
// a new map: its acoustics and ambience
function audioMap(id) {
  if (!actx || !AUD.revIn) return;
  const p = audProf(id); AUD.prof = p;
  try { AUD.conv.buffer = audIR(p); } catch (e) {}
  AUD.revIn.gain.setTargetAtTime(p.wet, actx.currentTime, 0.1); AUD.revOut.gain.value = 1;
  AUD.echo.eg.gain.setTargetAtTime(p.echo ? 0.5 : 0, actx.currentTime, 0.1); AUD.echo.dl.delayTime.value = p.echo || 0.3;
  if (AUD.windBus) AUD.windBus.gain.setTargetAtTime(p.amb === 'wind' ? 1 : 0.12, actx.currentTime, 0.5);
  audAmbBed(p.amb);
}
{ const _init = initAudio; initAudio = function () { const fresh = !actx; _init(); if (fresh && actx && bus) { try { audExtras(); audioMap(typeof curMap !== 'undefined' ? curMap : ''); } catch (e) {} } }; }
// the wind bed goes through its own gain so indoor maps can turn it down
startAmbience = function () {
  if (!actx) return;
  AUD.windBus = actx.createGain(); AUD.windBus.connect(bus.amb);
  const s = actx.createBufferSource(); s.buffer = getNoise(); s.loop = true;
  const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.6;
  const g = actx.createGain(); g.gain.value = 0.16;
  const lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 0.07; lfo.connect(lg); lg.connect(g.gain);
  const lfo2 = actx.createOscillator(), lg2 = actx.createGain(); lfo2.frequency.value = 0.07; lg2.gain.value = 180; lfo2.connect(lg2); lg2.connect(f.frequency);
  s.connect(f); f.connect(g); g.connect(AUD.windBus); s.start(); lfo.start(); lfo2.start();
};
// indoor beds: a mains hum and a buzzing light for the hospital, a low room tone for halls
function audAmbBed(kind) {
  for (const n of AUD.amb) { try { n.stop(); } catch (e) {} } AUD.amb = [];
  if (!actx || kind === 'wind') return;
  const out = actx.createGain(); out.gain.value = kind === 'hosp' ? 1 : 0.6; out.connect(bus.amb);
  const osc = (type, f, g, to = out) => { const o = actx.createOscillator(), gg = actx.createGain(); o.type = type; o.frequency.value = f; gg.gain.value = g; o.connect(gg); gg.connect(to); o.start(); AUD.amb.push(o); return { o, gg }; };
  osc('sine', 60, 0.018); osc('sine', 120, 0.012);
  if (kind === 'hosp') { const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 3; bp.connect(out); const b = osc('square', 120, 0.006, bp); const fl = actx.createOscillator(), flg = actx.createGain(); fl.frequency.value = 0.37; flg.gain.value = 0.005; fl.connect(flg); flg.connect(b.gg.gain); fl.start(); AUD.amb.push(fl); }
  const s = actx.createBufferSource(); s.buffer = getNoise(); s.loop = true; const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260; const g = actx.createGain(); g.gain.value = 0.05; s.connect(f); f.connect(g); g.connect(out); s.start(); AUD.amb.push(s);
}
// occasional sounds of the place (replaces the distant artillery indoors)
{ const _amb = updateAmbience; updateAmbience = function (t) {
  const p = AUD.prof; if (!actx || !p || p.amb === 'wind') { _amb(t); return; }
  if (t < ambNext) return; ambNext = t + rnd(4, 11);
  const o = { vol: rnd(0.25, 0.6), pan: rnd(-1, 1), bus: 'amb' }, k = Math.random();
  if (k < 0.4) { for (let i = 0; i < (Math.random() * 3 | 0) + 1; i++) tone(rnd(1300, 2100), 0.09, 0.05, 'sine', rnd(500, 800), Object.assign({}, o, { delay: i * rnd(0.3, 0.7) })); }   // drips
  else if (k < 0.7) { tone(rnd(70, 110), rnd(0.8, 1.6), 0.07, 'sawtooth', rnd(50, 70), o); burst(1.2, 300, 0.08, 'lowpass', o); }   // a creak
  else if (k < 0.85 && p.amb === 'hosp') zGroan(Object.assign({}, o, { vol: o.vol * 0.4 }), Math.random() < 0.5, 1.6);            // something far off
  else burst(0.6, 900, 0.06, 'bandpass', o);   // a rattle in the vents
}; }

/* ---------- where a sound is: position, distance, walls */
at = function (x, z, ref = 18, y) {
  const fy = y === undefined ? listener.fy : y, dx = x - listener.x, dz = z - listener.z, dy = fy - listener.fy, d = Math.hypot(dx, dz, dy * 0.8) || 0.001;
  const rx = Math.cos(listener.yaw), rz = -Math.sin(listener.yaw);
  let vol = clamp(ref / (ref + d * 1.1), 0.04, 1), occ = 0;
  if (Math.abs(dy) > 2.5) { occ = 1; vol *= 0.6; }   // another floor: through the slab
  else if (d > 3 && typeof gridClear === 'function') { try { if (!gridClear(listener.x, listener.z, x, z, listener.fy, fy)) { occ = 1; vol *= 0.55; } } catch (e) {} }
  return { vol, pan: clamp((dx * rx + dz * rz) / d, -1, 1) * Math.min(1, d / 6), delay: d / 340, x, y: fy + 1.1, z, occ, far: d };
};
outNode = function (o) {
  let n = o && o.bus === 'amb' ? bus.amb : bus.sfx;
  if (!o) return n;
  if (o.occ) { const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 850; f.connect(n); n = f; }
  if (o.x !== undefined && S.hrtf !== false && actx.createPanner) {
    const p = actx.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 1; p.rolloffFactor = 0;
    const dx = o.x - listener.x, dz = o.z - listener.z, dy = (o.y || listener.y) - listener.y, c = Math.cos(listener.yaw), s = Math.sin(listener.yaw);
    const lx = dx * c - dz * s, lf = -dx * s - dz * c, L = Math.hypot(lx, lf, dy) || 1, k = 2 / L;
    if (p.positionX) { p.positionX.value = lx * k; p.positionY.value = dy * k; p.positionZ.value = -lf * k; } else p.setPosition(lx * k, dy * k, -lf * k);
    p.connect(n); n = p;
  } else if (o.pan && actx.createStereoPanner) { const p = actx.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); p.connect(n); n = p; }
  if (o.far > 8 && AUD.revIn && o.bus !== 'amb') { const head = actx.createGain(), w = actx.createGain(); w.gain.value = Math.min(0.6, (o.far - 8) / 60); head.connect(n); head.connect(w); w.connect(AUD.revIn); return head; }
  return n;
};

/* ---------- new sounds */
function zGroan(o, run, k = 1) {
  if (!actx) return; const vol = (o && o.vol !== undefined ? o.vol : 1) * 0.2; if (vol < 0.004) return;
  const t = actx.currentTime + ((o && o.delay) || 0), dur = rnd(0.6, 1.3) * (run ? 0.75 : 1) * k, f0 = run ? rnd(130, 190) : rnd(70, 115);
  const osc = actx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(f0 * 1.18, t); osc.frequency.exponentialRampToValueAtTime(f0 * 0.72, t + dur);
  const vib = actx.createOscillator(), vg = actx.createGain(); vib.frequency.value = rnd(4, 8); vg.gain.value = f0 * 0.07; vib.connect(vg); vg.connect(osc.frequency);
  const f1 = actx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = rnd(420, 700); f1.Q.value = 5;
  const f2 = actx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = rnd(950, 1500); f2.Q.value = 7; const g2 = actx.createGain(); g2.gain.value = 0.55;
  const env = actx.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(vol, t + 0.09); env.gain.setValueAtTime(vol, t + dur * 0.6); env.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  osc.connect(f1); f1.connect(env); osc.connect(f2); f2.connect(g2); g2.connect(env); env.connect(outNode(o));
  osc.start(t); vib.start(t); osc.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
  burst(dur * 0.8, 900, vol * 0.5, 'bandpass', o);
}
sfx.zgroan = (o, run) => zGroan(o, run);
sfx.zscreech = o => { if (!actx) return; const v = (o && o.vol !== undefined ? o.vol : 1); tone(rnd(360, 440), 0.35, 0.12 * v, 'sawtooth', rnd(200, 240), o); burst(0.25, 2200, 0.14 * v, 'bandpass', o); };
sfx.zgurgle = o => {
  if (!actx) return; const v = (o && o.vol !== undefined ? o.vol : 1) * 0.18; if (v < 0.004) return; const t = actx.currentTime + ((o && o.delay) || 0);
  const osc = actx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(rnd(85, 110), t); osc.frequency.exponentialRampToValueAtTime(45, t + 0.8);
  const trem = actx.createOscillator(), tg = actx.createGain(), env = actx.createGain(), lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
  trem.frequency.value = rnd(14, 22); tg.gain.value = v * 0.8; env.gain.setValueAtTime(v, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.85); trem.connect(tg); tg.connect(env.gain);
  osc.connect(lp); lp.connect(env); env.connect(outNode(o)); osc.start(t); trem.start(t); osc.stop(t + 0.9); trem.stop(t + 0.9);
  burst(0.6, 500, v * 0.7, 'lowpass', o);
};
sfx.impact = (o, ric) => {   // a bullet hitting a wall: a tick and some grit, sometimes a ricochet whine
  burst(0.03, 3200, 0.16, 'highpass', o); burst(0.06, 900, 0.1, 'bandpass', o);
  if (ric) tone(rnd(2200, 3400), rnd(0.18, 0.32), 0.035, 'sine', rnd(900, 1400), o);
};
sfx.flesh = () => { burst(0.05, 700, 0.18, 'lowpass'); tone(90, 0.06, 0.12, 'sine', 50); };
// surfaces underfoot
function audSurface(x, z, fy) {
  try { const c = cellOf(z) * NN + cellOf(x), l = levelAt(c, fy); if (l >= 0 && lvS[c * NL + l]) return 'stair'; } catch (e) {}
  return (AUD.prof || AUD_PROF._out).surf;
}
function audStepLayer(surf, v, o) {
  if (surf === 'tile') burst(0.025, 4200, 0.07 * v, 'highpass', o);
  else if (surf === 'snow') burst(0.13, 1700, 0.09 * v, 'bandpass', o);
  else if (surf === 'grass') burst(0.11, 2600, 0.05 * v, 'highpass', o);
  else if (surf === 'sand') burst(0.1, 3000, 0.06 * v, 'bandpass', o);
  else if (surf === 'wood') { burst(0.06, 380, 0.12 * v, 'lowpass', o); tone(rnd(160, 210), 0.05, 0.04 * v, 'triangle', undefined, o); }
  else if (surf === 'stair') { burst(0.05, 300, 0.12 * v, 'lowpass', o); tone(rnd(140, 190), 0.07, 0.05 * v, 'triangle', undefined, o); }
  else burst(0.04, 1800, 0.05 * v, 'bandpass', o);
}
{ const _step = sfx.step, _estep = sfx.estep, _gun = sfx.gun, _exp = sfx.explode;
  sfx.step = v => { _step(v); audStepLayer(audSurface(P.x, P.z, P.y), v); };
  sfx.estep = o => { _estep(o); if (o) audStepLayer(audSurface(o.x, o.z, (o.y || 1.1) - 1.1), 0.9 * (o.vol || 1), o); };
  sfx.gun = p => { _gun(p); tone(52, 0.2, 0.16, 'sine', 32); burst(0.05, 160, 0.18, 'lowpass'); };   // a heavier low end on every shot
  sfx.explode = o => { _exp(o); const close = !o || o.vol > 0.55; if (close) { AUD.deafT = Math.max(AUD.deafT, !o ? 2.6 : 1.6 + o.vol * 1.4); tone(rnd(3300, 3900), 2.8, 0.035, 'sine', undefined); } };
}
// every frame: the world gets muffled after a close blast and when you are nearly dead
function audioTick(dt) {
  if (!actx || !AUD.mfilt) return;
  if (AUD.deafT > 0) AUD.deafT -= dt;
  let target = 20000;
  if (AUD.deafT > 0) target = 450 + (1 - Math.min(1, AUD.deafT / 2)) * 4000;
  else if (typeof G !== 'undefined' && G.state === 'playing' && G.maxHp && G.health < G.maxHp * 0.3) target = 2400;
  else if (typeof G !== 'undefined' && (G.state === 'zdown' || G.state === 'dead')) target = 1200;
  AUD.mfilt.frequency.setTargetAtTime(target, actx.currentTime, AUD.deafT > 0 ? 0.08 : 0.35);
}
