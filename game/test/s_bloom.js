// THE NIGHTBLOOM REVIVE: me reviving a bot (the flower, the crush, the pollen, the jolt), a bot reviving me (sparkle, heartbeat)
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.G.noRender = true; A.startMatch('br', { map: 'stashisle', squad: 4 }); });
  await p.waitForTimeout(12000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e6; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const A = window.__A, e = A.enemies.find(e => e.entry && e.team === A.M.myTeam && !e.downed); e.spawnProt = 0; A.damageEnemy(e, 999, false, null, false, 'world'); window.__rv = e; const g = e.group.position; A.P.x = g.x + 1.6; A.P.z = g.z; A.P.y = g.y; A.P.yaw = Math.PI / 2; A.P.pitch = -0.42; A.G.noRender = false; });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__A.keys.KeyE = true; });
  // jump the revive along (the test machine runs slow) and take a picture at each beat
  for (const [i, t] of [[1, 0.5], [2, 1.0], [3, 1.35], [5, 1.75], [6, 2.0], [7, 2.2]]) { await p.evaluate(t => { const A = window.__A; A.SQ_GET().revT = t; for (const e of A.enemies) if (e !== window.__rv && e.team === A.M.myTeam) { e.group.position.x = window.__rv.group.position.x - 12; e.group.position.z = window.__rv.group.position.z + 6; } }, t); await p.waitForTimeout(500); await p.screenshot({ path: SH + `/bloom_${i}.png` }); }
  await p.evaluate(() => { window.__A.SQ_GET().revT = 2.35; }); await p.waitForTimeout(1500); r.up = await p.evaluate(() => { window.__A.keys.KeyE = false; return !window.__rv.downed; });
  await p.waitForTimeout(300); await p.screenshot({ path: SH + '/bloom_4.png' });
  // a bot gets me up
  await p.evaluate(() => { const A = window.__A; A.G.maxHp = 100; A.G.health = 100; A.G.downed = true; A.G.bleed = 30; const b = A.enemies.find(e => e.entry && e.team === A.M.myTeam && !e.downed); b.group.position.set(A.P.x + 1, A.P.y, A.P.z); b.revT = 1.2; });
  await p.waitForTimeout(900); await p.screenshot({ path: SH + '/bloom_me.png' });
  return r;
};
