// PERFORMANCE MODE + frame graph, HOTBOX GRENADE + SKUNK BOMB: SHOTS=dir node run.js s_batchA.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const keep = () => p.evaluate(() => { const A = window.__A; if (A.G.state === 'paused') A.G.state = 'playing'; A.G.health = A.G.maxHp = 1e6; });
  const shot = async (n, ms = 900) => { await p.evaluate(() => { window.__A.G.noRender = false; }); for (let t = 0; t < ms; t += 150) { await keep(); await p.waitForTimeout(150); } await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  await p.evaluate(() => { const s = document.getElementById('hcSplash'); if (s) s.remove(); });
  // ---- performance mode
  r.perf = await p.evaluate(() => { const A = window.__A, S = A.S, before = { scale: S.renderScale, shadows: S.shadows, grass: S.grass, fx: S.fxQ, q: S.quality };
    A.perfModeSet(true); const on = { scale: S.renderScale, shadows: S.shadows, grass: S.grass, fx: S.fxQ, ragdoll: S.ragdoll, q: S.quality, mode: S.perfMode };
    A.perfModeSet(false); const off = { scale: S.renderScale, shadows: S.shadows, grass: S.grass, fx: S.fxQ, q: S.quality, mode: S.perfMode };
    return { before, on, off, restored: JSON.stringify(before) === JSON.stringify({ scale: off.scale, shadows: off.shadows, grass: off.grass, fx: off.fx, q: off.q }) }; });
  await p.evaluate(() => { const A = window.__A; A.perfModeSet(true); A.actions('settings'); });
  await shot('perf_settings', 700);
  await p.evaluate(() => { const A = window.__A; A.showScreen('menu'); });
  // ---- a match: the frame graph, the pause menu switch, then the grenades
  await p.evaluate(() => { const A = window.__A; A.S.perfGraph = true; A.startMatch('tdm', { map: 'town', score: 999, time: 0, perTeam: 4, custom: true }); A.G.holdT = 0.05; A.G.loadT = 0.05; A.G.noRender = true; });
  await p.waitForTimeout(3000);
  const arena = () => p.evaluate(() => { const A = window.__A; A.G.state = 'playing'; const sp = A.LAYOUT.spawn[0]; Object.assign(A.P, { x: sp.x, z: sp.z, y: sp.y || 0 }); A.P.yaw = Math.atan2(sp.x, sp.z); A.P.pitch = -0.06; A.M.respawnQ.length = 0;
    const fx = -Math.sin(A.P.yaw), fz = -Math.cos(A.P.yaw); A.enemies.forEach((e, i) => { const f = 12 + (i % 2) * 2, s = (i - 3.5) * 1.8; e.group.position.set(A.P.x + fx * f + fz * s, A.P.y, A.P.z + fz * f - fx * s); e.speed = 0; e.spawnProt = 99; }); return { fx, fz }; });
  await arena();
  await shot('perf_graph_game', 2500);
  await p.evaluate(() => { const A = window.__A; A.G.state = 'paused'; A.showScreen('pause'); });
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(700); await p.screenshot({ path: path.join(out, 'perf_pause.png') }); await p.evaluate(() => { const A = window.__A; A.G.noRender = true; A.showScreen(null); A.G.state = 'playing'; A.perfModeSet(false); A.S.perfGraph = false; });
  // hotbox: thrown at the middle of the squad
  await arena();
  r.hotbox = await p.evaluate(async () => { const A = window.__A, w = ms => new Promise(q => setTimeout(q, ms)); A.G.equip = 'hotbox'; A.G.grenades = 2; A.P.pitch = 0.12; A.throwGrenade(); for (let k = 0; k < 24; k++) { await w(120); if (A.G.state === 'paused') A.G.state = 'playing'; }
    const c = A.SMK.clouds[0]; if (!c) return { cloud: false };
    const eye = new THREE.Vector3(A.P.x, A.P.y + 1.6, A.P.z), far = new THREE.Vector3(c.x + (c.x - A.P.x) * 0.6, 1.2, c.z + (c.z - A.P.z) * 0.6);
    return { cloud: true, kind: c.kind, dist: Math.round(Math.hypot(c.x - A.P.x, c.z - A.P.z)), blocksThrough: A.smokeBlocks(eye, far), blocksBeside: A.smokeBlocks(eye, new THREE.Vector3(A.P.x + (c.z - A.P.z), 1.2, A.P.z - (c.x - A.P.x))) }; });
  await p.evaluate(() => { const A = window.__A; A.P.pitch = -0.04; });
  await shot('nade_hotbox', 1200);
  // skunk
  await p.evaluate(() => { const A = window.__A; for (const c of A.SMK.clouds) c.t = c.life; });
  await p.waitForTimeout(3000);
  await p.waitForTimeout(500);
  await arena();
  r.skunk = await p.evaluate(async () => { const A = window.__A, w = ms => new Promise(q => setTimeout(q, ms)); A.G.equip = 'skunk'; A.G.grenades = 2; A.P.pitch = 0.1; A.enemies.forEach(e => { e.group.rotation.y = Math.atan2(A.P.x - e.group.position.x, A.P.z - e.group.position.z); });
    A.G.state = 'playing'; A.G.throwT = 0; A.throwGrenade(); for (let k = 0; k < 100 && !A.SMK.clouds.some(c => c.kind === 'skunk'); k++) { await w(120); if (A.G.state === 'paused') A.G.state = 'playing'; } await w(300); return { st: A.G.state, fly: A.grenadesInFlight.length, gr: A.G.grenades, err: (document.getElementById('err') || {}).textContent, stunned: A.enemies.filter(e => e.stunT > 0).length, of: A.enemies.filter(e => e.team === 1).length, clouds: A.SMK.clouds.map(c => c.kind) }; });
  await p.evaluate(() => { const A = window.__A; A.P.pitch = -0.04; });
  await shot('nade_skunk', 600);
  r.loadout = await p.evaluate(() => Object.keys(window.__A.EQUIP));
  return r;
};
