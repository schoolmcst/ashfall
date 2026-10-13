/* ------------------------------------------------------------------ recorded sounds
   Real recorded gunshots, reloads, casings, footsteps and explosions (CC0, see tools/sounds/build_sounds.py) layered
   over the old synthesised sounds, which stay as the fallback (and as low-end weight under the recordings).
   Settings > Audio > RECORDED SOUNDS switches back to the synthesised set. */
const SMP = {};
let smpLoading = false;
function loadSamples() {
  if (!actx || smpLoading || typeof SAMPLE_B64 === 'undefined') return; smpLoading = true;
  for (const k in SAMPLE_B64) {
    try {
      const bin = atob(SAMPLE_B64[k]), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const pr = actx.decodeAudioData(u.buffer, b => { SMP[k] = b; }, () => {});
      if (pr && pr.catch) pr.catch(() => {});
    } catch (e) {}
  }
}
const smpOn = () => S.realSnd !== false;
// play a sample; o = { vol, pan, delay } as from at(); returns false when the sample isn't available
function smp(name, o, rate = 1, gain = 1, jitter = 0.04) {
  const b = SMP[name]; if (!b || !actx || !smpOn()) return false;
  gain *= (o && o.vol !== undefined ? o.vol : 1); if (gain <= 0.002) return true;
  const t = actx.currentTime + ((o && o.delay) || 0);
  const s = actx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * jitter);
  const g = actx.createGain(); g.gain.value = gain;
  s.connect(g); g.connect(outNode(o)); s.start(t);
  return true;
}
const pick = (...names) => names[Math.floor(Math.random() * names.length)];
// gun profile name (armory SND key) -> [sample, playback rate, gain, how much of the synthesised shot to keep]
const SHOT_SMP = {
  rifle: ['shot_ak', 1.1, 0.85, 0.35], akm: ['shot_ak', 1.0, 0.95, 0.35], battle: ['shot_ak', 0.88, 1.0, 0.4],
  carbine: ['shot_ak', 1.18, 0.8, 0.3], lmg: ['shot_ak', 0.93, 0.95, 0.4], dmr: ['shot_ak', 0.82, 1.0, 0.45],
  sniper: ['shot_ak', 0.7, 1.1, 0.55], fifty: ['shot_ak', 0.6, 1.2, 0.6], shotgun: ['shot_ak', 0.62, 1.1, 0.7],
  autosg: ['shot_ak', 0.7, 1.0, 0.6], smg: ['shot_smg', 1.06, 0.8, 0.3], smg45: ['shot_smg', 0.92, 0.85, 0.35],
  mpistol: ['shot_smg', 1.16, 0.7, 0.3], pistol: ['shot_pistol', 1.0, 0.8, 0.35], magnum: ['shot_pistol', 0.8, 1.0, 0.45],
};
(function wrapSfx() {
  const P = Object.assign({}, sfx);   // the synthesised originals
  const scaled = (p, k) => Object.assign({}, p, { hg: p.hg * k * 0.6, bg: p.bg * k, tg: p.tg * Math.min(1, k * 1.6) });
  sfx.gun = p => {
    if (p.__s === undefined) { p.__s = null; try { for (const k in SND) if (SND[k] === p) p.__s = SHOT_SMP[k] || null; } catch (e) {} }
    const m = p.__s;
    if (m && smp(m[0], null, m[1], m[2])) { P.gun(scaled(p, m[3])); return; }
    P.gun(p);
  };
  sfx.suppressed = big => { if (smp('shot_sup', null, big ? 0.8 : 1, 0.55)) { P.suppressed(big); return; } P.suppressed(big); };
  sfx.enemy = o => {
    const far = o && o.vol < 0.3;
    if (far ? smp(pick('far_1', 'far_2'), o, 1, 0.9) : smp('shot_ak', o, 1.05, 0.6)) { P.enemy(Object.assign({}, o, { vol: (o.vol || 1) * 0.3 })); return; }
    P.enemy(o);
  };
  sfx.explode = o => { const near = !o || o.vol > 0.35; if (smp(near ? 'boom' : 'boom_far', o, 1, 1.0, 0.06)) { tone(55, 0.9, 0.6, 'sine', 22, o); return; } P.explode(o); };
  sfx.reload = () => { if (smp('reload_out', null, 1, 0.6) && smp('reload_in', { delay: 0.75 }, 1, 0.7)) return; P.reload(); };
  sfx.click = () => { if (!smp('dry', null, 1, 0.5)) P.click(); };
  sfx.rack = () => { if (!smp('reload_in', null, 1.2, 0.55)) P.rack(); };
  sfx.ereload = o => { if (smp('reload_out', o, 1, 0.5) && smp('reload_in', Object.assign({}, o, { delay: (o.delay || 0) + 0.25 }), 1, 0.55)) return; P.ereload(o); };
  sfx.casing = o => { if (!smp('casing', o, 1 + Math.random() * 0.25, 0.35, 0.08)) P.casing(o); };
  sfx.step = v => { if (!smp(pick('step1', 'step2', 'step3', 'step4'), null, 1, 0.22 * v, 0.08)) P.step(v); };
  sfx.estep = o => { if (!smp(pick('step1', 'step2', 'step3', 'step4'), o, 0.95, 0.5, 0.08)) P.estep(o); };
})();
