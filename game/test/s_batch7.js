// first load timing, colour-blind modes, FOV / ADS FOV, voice picking: SHOTS=dir node run.js s_batch7.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const shot = async (n, ms = 900, fn) => { await p.evaluate(() => { window.__A.G.noRender = false; }); const t0 = Date.now(); while (Date.now() - t0 < ms) { if (fn) await p.evaluate(fn); await p.waitForTimeout(120); } await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  r.boot = await p.evaluate(() => ({ steps: window.BOOT_T, total: window.BOOT_T.reduce((s, b) => s + b[1], 0) }));
  await p.waitForTimeout(3000);
  r.env = await p.evaluate(() => !!window.__A.scene.environment);
  await p.evaluate(() => { const s = document.getElementById('hcSplash'); if (s) s.remove(); });
  // ---- voices: a Mac's list (with the joke voices) and a Windows / Edge list
  r.voices = await p.evaluate(() => { const A = window.__A, V = n => ({ name: n, lang: /Google UK/.test(n) ? 'en-GB' : 'en-US', localService: !/Online|Google/.test(n) }), o = {};
    const lists = { mac: ['Albert', 'Bad News', 'Bubbles', 'Fred', 'Junior', 'Kathy', 'Ralph', 'Zarvox', 'Samantha', 'Alex', 'Daniel', 'Karen', 'Moira', 'Tessa', 'Google US English', 'Google UK English Male', 'Google UK English Female'],
      win: ['Microsoft David - English (United States)', 'Microsoft Mark - English (United States)', 'Microsoft Zira - English (United States)', 'Microsoft Aria Online (Natural) - English (United States)', 'Microsoft Guy Online (Natural) - English (United States)', 'Microsoft Jenny Online (Natural) - English (United States)', 'Microsoft Ryan Online (Natural) - English (United Kingdom)', 'Microsoft Sonia Online (Natural) - English (United Kingdom)'] };
    const real = speechSynthesis.getVoices.bind(speechSynthesis);
    for (const k in lists) { speechSynthesis.getVoices = () => lists[k].map(V); A.zvLoadVoices(); o[k] = Object.fromEntries(Object.entries(A.ZV.vmap).map(([c, v]) => [c, v && v.name])); }
    const u = A.zvUtter({ id: 'sparks', name: 'SPARKS', voice: { pitch: 1.12, rate: 1.08 } }, 'test', 1); o.sparksNatural = { pitch: +u.pitch.toFixed(2), rate: +u.rate.toFixed(2) };
    speechSynthesis.getVoices = real; A.zvLoadVoices(); return o; });
  // ---- a TDM match: first match start (the gun's shaders compile now), then colour-blind looks
  await p.evaluate(() => { const A = window.__A; A.startMatch('tdm', { map: 'town', score: 999, time: 0, perTeam: 4, custom: true }); A.G.holdT = 0.05; A.G.loadT = 0.05; A.G.noRender = true; });
  await p.waitForTimeout(3000);
  const setup = () => p.evaluate(() => { const A = window.__A; A.G.health = A.G.maxHp = 1e6; A.G.state = 'playing'; const sp = A.LAYOUT.spawn[0]; Object.assign(A.P, { x: sp.x, z: sp.z, y: sp.y || 0 }); A.P.yaw = Math.atan2(sp.x, sp.z); A.P.pitch = -0.05;
    const fx = -Math.sin(A.P.yaw), fz = -Math.cos(A.P.yaw); A.enemies.forEach((e, i) => { const f = 7 + (i % 4) * 2.5, s = (i - 3.5) * 1.6; e.group.position.set(A.P.x + fx * f + fz * s, A.P.y, A.P.z + fz * f - fx * s); e.speed = 0; e.cd = 99; e.spawnProt = 99; }); A.STK.uavT = 20; A.M.respawnQ.length = 0; });
  for (const m of ['off', 'deut', 'prot', 'trit']) {
    await p.evaluate(m => { const A = window.__A; A.S.cbMode = m; A.cbApply(); A.feedLine && 0; }, m);
    await setup();
    await shot('cb_' + m, 1200, () => { const A = window.__A; if (A.G.state === 'paused') A.G.state = 'playing'; A.setScoreboard(true); });
    await p.evaluate(() => window.__A.setScoreboard(false));
  }
  r.cb = await p.evaluate(() => window.__A.TEAM_COL.slice());
  await p.evaluate(() => { const A = window.__A; A.S.cbMode = 'off'; A.cbApply(); A.STK.uavT = 0; });
  // ---- FOV 60 / 90 / 110, hip and aiming, with each ADS FOV option
  r.fov = {};
  for (const f of [60, 90, 110]) {
    await p.evaluate(f => { const A = window.__A; A.S.fov = f; A.applyVideoSettings ? A.applyVideoSettings() : 0; }, f);
    await setup();
    await shot('fov_' + f, 900, () => { const A = window.__A; if (A.G.state === 'paused') A.G.state = 'playing'; A.G.adsOn = false; });
    for (const mode of ['affected', 'independent']) r.fov[f + '_' + mode] = await p.evaluate(m => { const A = window.__A; A.S.adsFov = m; return +A.adsFovFor(A.W[A.G.cur], A.S.fov).toFixed(1); }, mode);
  }
  r.fovHip = await p.evaluate(() => { const A = window.__A; A.G.adsOn = false; return +A.camera.fov.toFixed(1); });
  return r;
};
