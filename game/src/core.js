/* ================================================================== core: helpers, settings, audio */
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
function reportError(e) { showErr('Game error: ' + (e && e.message ? e.message : e) + (e && e.stack ? '\n' + String(e.stack).split('\n').slice(1, 3).join('\n') : '')); }
function setLoad(p, txt) { try { $('ldbar').style.width = Math.round(p * 100) + '%'; if (txt) $('ldtxt').textContent = txt; } catch (e) {} }

/* ------------------------------------------------------------------ settings */
const QUALITY = {
  low:    { scale: 70,  shadows: 'off',  fx: 0.35, grass: 0,    anis: 1,  grain: false, tex: 256, shadowRes: 1024, prCap: 1.25, shadowR: 30 },
  medium: { scale: 85,  shadows: 'low',  fx: 0.65, grass: 0.4,  anis: 4,  grain: false, tex: 256, shadowRes: 1024, prCap: 1.5,  shadowR: 30 },
  high:   { scale: 100, shadows: 'high', fx: 1,    grass: 0.65, anis: 8,  grain: false, tex: 512, shadowRes: 2048, prCap: 1.5,  shadowR: 40 },
  ultra:  { scale: 100, shadows: 'high', fx: 1.5,  grass: 1,    anis: 16, grain: false, tex: 512, shadowRes: 4096, prCap: 2,    shadowR: 50 },
};
const DEFAULTS = {
  quality: 'auto', cfgVer: 4, dynRes: true, gunShader: true, realTex: true, realSnd: true, sheen: 100, renderScale: 100, shadows: 'high', fov: 75, brightness: 100, grain: false, shake: 100, showFps: false, bob: true,
  master: 80, sfx: 100, ambience: 60,
  sens: 100, adsSens: 70, invertY: false, toggleAds: false,
  padSens: 100, padAdsSens: 75, padCurve: 'dynamic', padAccel: 50, padSmooth: 25, padDeadzone: 12, padOuterDz: 92, padDrift: true, padInvertY: false,
  padAssist: 'standard', padSprint: 'toggle', padCrouch: 'toggle', padTrigger: 25, padVibration: true, padRumble: 100,
  crosshair: 'cross', crosshairColor: 'white', hitMarkers: true, ragdoll: true, deathCam: true, dmgIndicator: true, radar: true, difficulty: 'regular',
};
const S = Object.assign({}, DEFAULTS);
const STORE = 'ashfall.settings.v1', BEST = 'ashfall.best.v1';
let NEED_AUTO_DERIVE = false;
// AUTO resolves to a preset picked from the graphics card (set in gfx1 once the renderer exists)
function qKey() { return S.quality === 'auto' ? (typeof AUTO_TIER !== 'undefined' ? AUTO_TIER : 'high') : S.quality; }
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) { const o = JSON.parse(raw); for (const k in DEFAULTS) if (k in o && typeof o[k] === typeof DEFAULTS[k]) S[k] = o[k];
      if ((o.cfgVer | 0) < 2) { S.quality = 'auto'; NEED_AUTO_DERIVE = true; }
      if ((o.cfgVer | 0) < 3) { S.grain = false; S.cfgVer = 3; saveSettings(); }
      if ((o.cfgVer | 0) < 4) { if (o.padAimAssist === false) S.padAssist = 'off'; S.padDeadzone = Math.min(S.padDeadzone, 40); S.cfgVer = 4; saveSettings(); } }   // controller settings v2   // film grain is now off unless chosen   // older saves move to the auto preset once
    else NEED_AUTO_DERIVE = true;
  } catch (e) { NEED_AUTO_DERIVE = true; }
}
function saveSettings() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }
const best = { wave: 0, score: 0 };
function loadBest() { try { const o = JSON.parse(localStorage.getItem(BEST) || '{}'); best.wave = o.wave | 0; best.score = o.score | 0; } catch (e) {} }
function saveBest() { try { localStorage.setItem(BEST, JSON.stringify(best)); } catch (e) {} }
loadSettings(); loadBest();

const DIFFS = {
  recruit: { name: 'RECRUIT', hp: 0.75, dmg: 0.6, acc: 0.8, count: 0.8, regen: 1.4 },
  regular: { name: 'REGULAR', hp: 1, dmg: 1, acc: 1, count: 1, regen: 1 },
  veteran: { name: 'VETERAN', hp: 1.3, dmg: 1.4, acc: 1.15, count: 1.25, regen: 0.8 },
};
const diff = () => DIFFS[S.difficulty] || DIFFS.regular;

/* ------------------------------------------------------------------ audio */
let actx = null, bus = null, noiseBuf = null;
function initAudio() {
  if (!actx) {
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const master = actx.createGain();
      const comp = actx.createDynamicsCompressor();
      master.connect(comp); comp.connect(actx.destination);
      const sfxG = actx.createGain(), ambG = actx.createGain(), revSend = actx.createGain(), conv = actx.createConvolver();
      const len = Math.floor(actx.sampleRate * 1.8), ir = actx.createBuffer(2, len, actx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      conv.buffer = ir; revSend.gain.value = 0.35;
      sfxG.connect(master); sfxG.connect(revSend); revSend.connect(conv); conv.connect(master); ambG.connect(master);
      bus = { master, sfx: sfxG, amb: ambG };
      applyAudioSettings(); startAmbience(); try { loadSamples(); } catch (e) {}
    } catch (e) { actx = null; }
  }
  if (actx && actx.state === 'suspended') actx.resume();
}
function applyAudioSettings() {
  if (!bus) return;
  bus.master.gain.value = S.master / 100;
  bus.sfx.gain.value = S.sfx / 100;
  bus.amb.gain.value = S.ambience / 100;
}
function getNoise() {
  if (noiseBuf) return noiseBuf;
  noiseBuf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let b = 0; for (let i = 0; i < d.length; i++) { b = b * 0.2 + (Math.random() * 2 - 1); d[i] = b * 0.6; }
  return noiseBuf;
}
function outNode(o) {
  let n = o && o.bus === 'amb' ? bus.amb : bus.sfx;
  if (o && o.pan && actx.createStereoPanner) { const p = actx.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); p.connect(n); n = p; }
  return n;
}
// o: { vol, pan, delay }
function burst(dur, cutoff, gain, type = 'lowpass', o) {
  if (!actx) return; gain *= (o && o.vol !== undefined ? o.vol : 1); if (gain <= 0.002) return;
  const t = actx.currentTime + ((o && o.delay) || 0);
  const s = actx.createBufferSource(); s.buffer = getNoise(); s.loop = true;
  const f = actx.createBiquadFilter(); f.type = type; f.frequency.value = cutoff;
  const g = actx.createGain();
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(outNode(o));
  s.start(t, Math.random()); s.stop(t + dur + 0.02);
}
function tone(freq, dur, gain, type = 'sine', slideTo, o) {
  if (!actx) return; gain *= (o && o.vol !== undefined ? o.vol : 1); if (gain <= 0.002) return;
  const t = actx.currentTime + ((o && o.delay) || 0);
  const osc = actx.createOscillator(); osc.type = type; const g = actx.createGain();
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g); g.connect(outNode(o)); osc.start(t); osc.stop(t + dur + 0.02);
}
// positional helper: volume falls with distance, pan from the listener's facing
const listener = { x: 0, z: 0, yaw: 0 };
function at(x, z, ref = 18) {
  const dx = x - listener.x, dz = z - listener.z, d = Math.hypot(dx, dz) || 0.001;
  const rx = Math.cos(listener.yaw), rz = -Math.sin(listener.yaw);
  return { vol: clamp(ref / (ref + d * 1.1), 0.04, 1), pan: clamp((dx * rx + dz * rz) / d, -1, 1) * Math.min(1, d / 6), delay: d / 340 };
}
const sfx = {
  rifle: () => { burst(0.05, 5200, 0.55, 'highpass'); burst(0.2, 1800, 0.55); tone(140, 0.12, 0.5, 'sine', 45); },
  shotgun: () => { burst(0.07, 4200, 0.7, 'highpass'); burst(0.45, 1100, 1.0); tone(80, 0.3, 0.8, 'sine', 30); },
  pistol: () => { burst(0.04, 5800, 0.5, 'highpass'); burst(0.14, 2600, 0.4); tone(210, 0.09, 0.3, 'sine', 70); },
  gun: p => { burst(p.hd, p.hc, p.hg, 'highpass'); burst(p.bd, p.bc, p.bg); tone(p.tf, p.td, p.tg, 'sine', p.tf * 0.32); if (p.tl) { burst(p.tl, 380, 0.3 * p.bg, 'lowpass', { delay: 0.05 }); tone(p.tf * 0.6, p.tl * 0.7, 0.25, 'sine', 30, { delay: 0.04 }); } },
  stun: o => { burst(0.5, 5200, 0.8, 'highpass', o); burst(0.8, 900, 0.6, 'lowpass', o); tone(2600, 1.6, 0.12, 'sine', 2400, o); },
  enemy: o => { burst(0.04, 4600, 0.3, 'highpass', o); burst(0.16, 1500, 0.35, 'lowpass', o); },
  hit: head => tone(head ? 1700 : 1000, 0.05, 0.1, 'square'),
  kill: () => { tone(520, 0.12, 0.12, 'square', 260); },
  thud: o => { burst(0.09, 600, 0.35, 'lowpass', o); },
  explode: o => { burst(1.4, 420, 1.1, 'lowpass', o); burst(0.25, 3000, 0.5, 'highpass', o); tone(55, 0.9, 0.9, 'sine', 22, o); },
  reload: () => { burst(0.05, 3500, 0.3, 'highpass'); tone(300, 0.05, 0.1, 'square'); setTimeout(() => { burst(0.06, 2500, 0.4, 'highpass'); tone(220, 0.06, 0.12, 'square'); }, 750); },
  click: () => burst(0.03, 5000, 0.3, 'highpass'),
  hurt: () => { tone(110, 0.22, 0.3, 'sawtooth', 55); },
  pin: () => burst(0.06, 6000, 0.3, 'highpass'),
  step: v => burst(0.07, 520 + Math.random() * 200, 0.12 * v, 'lowpass'),
  casing: o => tone(3800 + Math.random() * 900, 0.05, 0.05, 'triangle', undefined, o),
  pickup: () => { tone(660, 0.08, 0.15, 'square'); setTimeout(() => tone(990, 0.1, 0.15, 'square'), 70); },
  ui: () => tone(880, 0.04, 0.06, 'square'),
  heart: k => { tone(58, 0.11, 0.55 * k, 'sine', 38); tone(52, 0.12, 0.42 * k, 'sine', 34, { delay: 0.16 }); },
  multi: n => { for (let i = 0; i < Math.min(n, 4); i++) tone(660 + i * 180, 0.07, 0.1, 'square', null, { delay: i * 0.06 }); },
  streak: () => { tone(440, 0.12, 0.12, 'triangle'); tone(660, 0.14, 0.12, 'triangle', null, { delay: 0.1 }); tone(880, 0.22, 0.12, 'triangle', null, { delay: 0.2 }); },
  estep: o => burst(0.05, 380 + Math.random() * 260, 0.32, 'lowpass', o),
  suppressed: big => { burst(0.05, big ? 1400 : 1900, big ? 0.32 : 0.22, 'lowpass'); burst(0.03, 4200, 0.06, 'highpass'); tone(110, 0.06, 0.12, 'sine', 60); },
  rack: () => { burst(0.04, 3200, 0.35, 'highpass'); tone(420, 0.05, 0.12, 'square', 180); burst(0.05, 2600, 0.3, 'highpass', { delay: 0.12 }); },
  ereload: o => { burst(0.04, 3000, 0.25, 'highpass', o); burst(0.05, 2200, 0.22, 'highpass', Object.assign({}, o, { delay: (o.delay || 0) + 0.25 })); },
  flyby: o => burst(0.1, 2600, 0.12, 'bandpass', o),
};
let ambNext = 0;
function startAmbience() {
  if (!actx) return;
  const s = actx.createBufferSource(); s.buffer = getNoise(); s.loop = true;
  const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.6;
  const g = actx.createGain(); g.gain.value = 0.16;
  const lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 0.07;
  lfo.connect(lg); lg.connect(g.gain);
  const lfo2 = actx.createOscillator(), lg2 = actx.createGain(); lfo2.frequency.value = 0.07; lg2.gain.value = 180;
  lfo2.connect(lg2); lg2.connect(f.frequency);
  s.connect(f); f.connect(g); g.connect(bus.amb); s.start(); lfo.start(); lfo2.start();
}
function updateAmbience(t) {
  if (!actx || t < ambNext) return;
  ambNext = t + rnd(6, 16); // distant artillery / rumble
  const d = rnd(0, 1);
  const o = { vol: 0.35 + d * 0.3, pan: rnd(-1, 1), delay: 0 };
  burst(2.4, 160 + d * 120, 0.35, 'lowpass', Object.assign({}, o, { bus: 'amb' }));
  tone(42 + d * 14, 1.6, 0.3, 'sine', 24, o);
}
