// THE HOTBOX DUEL: first death -> the pit vs a player who went out; win -> back on the island; second death is final; losing sends the bot back
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const start = async () => { await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.startMatch('br', { map: 'random' }); }); await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(2500); };
  await start();
  r.pre = await p.evaluate(() => { const A = window.__A; const bs = A.BR_API.brAliveBots(); for (const e of bs.slice(0, 3)) { e.spawnProt = 0; A.damageEnemy(e, 999, false, null, false, 'player'); }
    const crInPit = A.BR_API.BR.crates.filter(c => A.duelIn(c.x, c.z)).length; return { dead: A.M.entries.filter(e => e.alive === false).length, crInPit }; });
  r.take = await p.evaluate(() => { const A = window.__A; A.G.spawnProt = 0; A.G.health = 100; A.G.killer = A.BR_API.brAliveBots()[0]; A.hurtPlayer(999); const D = A.DUEL.on;
    return { on: !!D, inPit: A.duelIn(A.P.x, A.P.z), botInPit: !!(D && D.bot && A.duelIn(D.bot.group.position.x, D.bot.group.position.z)), hp: A.G.health, state: A.G.state, gun: A.W[A.G.cur].def.cat }; });
  await p.evaluate(() => { const A = window.__A, D = A.DUEL.on; A.P.yaw = 0; A.P.pitch = -0.05; }); await p.waitForTimeout(1600);
  await p.screenshot({ path: path.join(out, 'duel.png'), timeout: 120000 });
  r.win = await p.evaluate(() => { const A = window.__A, D = A.DUEL.on; D.bot.spawnProt = 0; A.damageEnemy(D.bot, 9999, false, null, false, 'player'); return null; });
  await p.waitForTimeout(1500);
  r.win = await p.evaluate(() => { const A = window.__A; return { on: !!A.DUEL.on, inPit: A.duelIn(A.P.x, A.P.z), hp: Math.round(A.G.health), alive: A.G.state }; });
  r.second = await p.evaluate(() => { const A = window.__A; A.G.spawnProt = 0; A.G.health = 100; A.hurtPlayer(999); return { on: !!A.DUEL.on, state: A.G.state }; });
  // a new match: lose the duel, the bot goes back in
  await p.evaluate(() => window.__A.leaveGame()); await p.waitForTimeout(1500); await start();
  r.lose = await p.evaluate(() => { const A = window.__A; for (const e of A.BR_API.brAliveBots().slice(0, 2)) { e.spawnProt = 0; A.damageEnemy(e, 999, false, null, false, 'player'); } A.G.spawnProt = 0; A.G.health = 100; A.hurtPlayer(999); const D = A.DUEL.on; A.G.spawnProt = 0; A.G.health = 100; A.hurtPlayer(999); return { bot: D && D.bot ? 1 : 0, state: A.G.state }; });
  await p.waitForTimeout(1500);
  r.lose2 = await p.evaluate(() => { const A = window.__A; const b = A.enemies.find(e => e.duel !== undefined && e.entry && e.entry.duelDone); return { on: !!A.DUEL.on, botBack: b ? !A.duelIn(b.group.position.x, b.group.position.z) : 'none' }; });
  return r;
};
