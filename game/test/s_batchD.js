// PLAY OF THE GAME, finishers, inspect by class: SHOTS=dir node run.js s_batchD.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const keep = () => p.evaluate(() => { const A = window.__A; if (A.G.state === 'paused') A.G.state = 'playing'; });
  const sim = async ms => { const t0 = Date.now(); while (Date.now() - t0 < ms) { await keep(); await p.waitForTimeout(150); } };
  const snap = n => p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 });
  await p.evaluate(() => { const s = document.getElementById('hcSplash'); if (s) s.remove(); });
  await p.evaluate(() => { const A = window.__A; A.startMatch('tdm', { map: 'stackyard', score: 999, time: 0, perTeam: 4, custom: true }); A.G.holdT = 0.05; A.G.loadT = 0.05; A.G.noRender = true; A.G.potgTest = true; A.G.health = A.G.maxHp = 1e6; });
  await sim(2500);
  const arena = (d = 12) => p.evaluate(d => { const A = window.__A; A.G.state = 'playing'; const sp = A.LAYOUT.spawn[0]; Object.assign(A.P, { x: sp.x, z: sp.z, y: sp.y || 0 }); A.P.yaw = Math.atan2(sp.x, sp.z); A.P.pitch = -0.05; A.M.respawnQ.length = 0;
    const fx = -Math.sin(A.P.yaw), fz = -Math.cos(A.P.yaw); A.enemies.forEach((e, i) => { const f = d + (i % 2) * 2, s = (i - 3.5) * 1.8; e.group.position.set(A.P.x + fx * f + fz * s, A.P.y, A.P.z + fz * f - fx * s); e.speed = 0; e.spawnProt = 0; e.cd = 99; }); }, d);
  // ---- a triple kill while recording
  await arena();
  await sim(2500);
  r.kills = await p.evaluate(async () => { const A = window.__A, w = ms => new Promise(q => setTimeout(q, ms)); const reds = A.enemies.filter(e => e.team === 1).slice(0, 3);
    for (const e of reds) { A.P.yaw = Math.atan2(-(e.group.position.x - A.P.x), -(e.group.position.z - A.P.z)); A.netShot && 0; for (let i = 0; i < 3; i++) { A.POTG.shots = (A.POTG.shots || 0) + 1; await w(120); } e.hp = 1; A.damageEnemy(e, 50, e === reds[1], null, false, 'player'); await w(500); if (A.G.state === 'paused') A.G.state = 'playing'; }
    await w(2200); return { pend: !!A.POTG.pend, best: A.POTG.best && A.POTG.best.kills, buf: A.POTG.buf.length }; });
  r.potg = await p.evaluate(() => { const A = window.__A; A.G.noRender = false; A.endMatch(0); return { playing: !!A.POTG.play, frames: A.POTG.play && A.POTG.play.frames.length, len: A.POTG.play && +A.POTG.play.len.toFixed(1) }; });
  await p.waitForTimeout(2500); await snap('potg_1');
  r.potgMid = await p.evaluate(() => { const A = window.__A; return A.POTG.play ? { t: +A.POTG.play.t.toFixed(1), ghosts: A.POTG.play.ghosts.size } : null; });
  await p.waitForTimeout(2500); await snap('potg_2');
  await p.evaluate(() => { const A = window.__A; A.G.noRender = true; if (A.POTG.play) A.POTG.play.t = A.POTG.play.len + 1; });
  for (let i = 0; i < 40; i++) { if (!(await p.evaluate(() => !!window.__A.POTG.play))) break; await p.waitForTimeout(500); }
  r.after = await p.evaluate(() => ({ playing: !!window.__A.POTG.play, results: !document.getElementById('results').classList.contains('hide') }));
  await p.evaluate(() => { const A = window.__A; A.G.noRender = true; A.actions('res-lobby'); });
  // ---- finisher
  await p.evaluate(() => { const A = window.__A; A.startMatch('tdm', { map: 'stackyard', score: 999, time: 0, perTeam: 4, custom: true }); A.G.holdT = 0.05; A.G.loadT = 0.05; A.G.noRender = true; A.G.health = A.G.maxHp = 1e6; });
  await sim(2500);
  await arena(20);
  r.fin = await p.evaluate(async () => { const A = window.__A, w = ms => new Promise(q => setTimeout(q, ms)); const e = A.enemies.find(e => e.team === 1), fx = -Math.sin(A.P.yaw), fz = -Math.cos(A.P.yaw);
    e.group.position.set(A.P.x + fx * 1.4, A.P.y, A.P.z + fz * 1.4); e.group.rotation.y = Math.atan2(fx, fz); e.tgt = null; e.speed = 0; const behind = A.finCheck(e);
    A.G.meleeT = 0; A.melee(); await w(700); A.G.noRender = false; await w(300); return { behind, finT: +(A.G.finT || 0).toFixed(2) }; });
  await snap('fin_1');
  await p.evaluate(() => { window.__A.G.noRender = true; }); await sim(2500);
  r.finAfter = await p.evaluate(() => { const A = window.__A; A.G.noRender = true; return { finishers: A.MS.finishers || 0, kills: A.MS.kills }; });
  // ---- inspect by class
  for (const [gun, ms] of [['sidearm', 1300], ['breacher', 1700], ['hawkeye', 900], ['marc', 1700]]) {
    await p.evaluate(g => { const A = window.__A; A.G.state = 'playing'; const pri = A.ARM[g] && A.CATS[A.ARM[g].cat].slot === 'primary'; A.equipClass({ p: pri ? g : 'marc', s: pri ? 'sidearm' : g, e: 'frag', k: 'none' }); if (!pri) A.switchWeapon(1); A.G.swapT = 0; A.P.pitch = 0; for (const e of A.enemies) e.group.position.x += 400; }, gun);
    await sim(700);
    await p.evaluate(() => { const A = window.__A; A.G.inspectT = 2.6; A.G.noRender = false; });
    await sim(ms); await snap('inspect_' + gun); await p.evaluate(() => { window.__A.G.noRender = true; });
  }
  return r;
};
