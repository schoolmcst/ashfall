// WEED DECOY, END-OF-ROUND AWARDS, THE JOINT REVIVE
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp', shot = async n => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1300); await p.screenshot({ path: SH + '/brx_' + n + '.png' }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.G.noRender = true; A.startMatch('br', { map: 'stashisle', squad: 4 }); });
  await p.waitForTimeout(12000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e6; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } }); await p.waitForTimeout(1500);
  // a decoy in front of a bot squad
  r.decoy = await p.evaluate(async () => { const A = window.__A, e = A.enemies.find(e => e.entry && e.team !== A.M.myTeam); const g = e.group.position; A.brxPuppetL({ x: g.x + 10, y: g.y, z: g.z }, 0); await new Promise(r => setTimeout(r, 2500)); const q = A.BRX_GET().puppets[0]; return { alive: !!q, moved: q ? +Math.hypot(q.x - g.x - 10, q.z - g.z).toFixed(1) : 0, botLooked: e.lkp ? Math.round(Math.hypot(e.lkp.x - g.x, e.lkp.z - g.z)) : null }; });
  await p.evaluate(() => { const A = window.__A, q = A.BRX_GET().puppets[0]; if (q) { A.P.x = q.x - 5; A.P.z = q.z - 5; A.P.y = q.y; A.P.yaw = Math.atan2(-5, -5) + Math.PI; A.P.pitch = -0.1; } }); await shot('decoy');
  // the joint revive: down a squad bot, hold USE next to it
  r.revive = await p.evaluate(async () => { const A = window.__A, e = A.enemies.find(e => e.entry && e.team === A.M.myTeam && !e.downed); e.spawnProt = 0; A.damageEnemy(e, 999, false, null, false, 'world'); if (!e.downed) return 'not downed'; const g = e.group.position; A.P.x = g.x + 1.2; A.P.z = g.z; A.P.y = g.y; A.P.yaw = Math.PI / 2; A.P.pitch = -0.6; await new Promise(r => setTimeout(r, 1000)); A.keys.KeyE = true; await new Promise(r => setTimeout(r, 1200)); const j = !!A.BRX_GET().joint; window.__shotNow = 1; return { joint: j }; });
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(900); await p.screenshot({ path: SH + '/brx_revive.png' }); await p.evaluate(() => { window.__A.G.noRender = true; });
  await p.waitForTimeout(2500); r.revived = await p.evaluate(() => { const A = window.__A; A.keys.KeyE = false; return { up: !A.enemies.find(e => e.entry && e.team === A.M.myTeam && e.downed), jointGone: !A.BRX_GET().joint }; });
  // awards: some damage and loot, then everyone else out
  await p.evaluate(() => { const A = window.__A; const es = A.enemies.filter(e => e.entry && e.team !== A.M.myTeam); for (const e of es) { e.spawnProt = 0; e.sqFinal = true; A.damageEnemy(e, 99999, false, null, false, 'player'); } });
  await p.waitForTimeout(12000);
  r.awards = await p.evaluate(() => ({ html: (document.querySelector('.brx-aw') || {}).textContent || null, list: window.__A.brxAwardsL().map(a => a.join(' | ')) }));
  await p.screenshot({ path: SH + '/brx_awards.png' });
  return r;
};
