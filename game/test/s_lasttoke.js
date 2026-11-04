// LAST TOKE: 16 players, pistols, crates, the cloud closing and choking, bots dying to it, the winner; pictures
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); window.__A.startMatch('br', { map: 'stackyard' }); });
  await p.waitForTimeout(4000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; });
  await p.waitForTimeout(5000);
  r.s0 = await p.evaluate(() => { const A = window.__A, B = A.BR_API.BR; return { players: A.M.entries.length, bots: A.BR_API.brAliveBots().length, crates: B.crates.length, tiers: [0, 1, 2].map(t => B.crates.filter(c => c.tier === t).length), gun: A.W[A.G.cur].def.id, botGuns: A.BR_API.brAliveBots().slice(0, 4).map(e => e.gunId), r: Math.round(B.r) }; });
  // open the nearest crate
  r.loot = await p.evaluate(() => { const A = window.__A, B = A.BR_API.BR; A.G.health = A.G.maxHp = 1e9; const c = B.crates.slice().sort((a, b) => Math.hypot(a.x - A.P.x, a.z - A.P.z) - Math.hypot(b.x - A.P.x, b.z - A.P.z))[0]; A.BR_API.brOpen(c, 'player'); return { tier: c.tier, gun: A.W[0].def.id, open: B.crates.filter(c => c.open).length }; });
  await p.evaluate(() => { const A = window.__A; A.P.pitch = -0.02; A.P.yaw = 0.8; }); await p.waitForTimeout(1200); await p.screenshot({ path: path.join(out, 'br_start.png'), timeout: 120000 });
  // jump to the last circle closing, stand outside it
  await p.evaluate(() => { const A = window.__A, B = A.BR_API.BR; B.phase = 2; B.closing = false; B.t = 0.01; });
  await p.waitForTimeout(1500); await p.evaluate(() => { const A = window.__A, B = A.BR_API.BR; B.closing = true; B.t = 0.5; A.G.health = 100; A.G.maxHp = 100; A.G.spawnProt = 0; const a = Math.atan2(A.P.z - B.cz, A.P.x - B.cx); Object.assign(A.P, A.openNear(B.cx + Math.cos(a) * 26, B.cz + Math.sin(a) * 26)); });
  await p.waitForTimeout(2500);
  r.s1 = await p.evaluate(() => { const A = window.__A, B = A.BR_API.BR; const out = Math.hypot(A.P.x - B.cx, A.P.z - B.cz) > B.r; return { phase: B.phase, r: Math.round(B.r), meOut: out, hp: Math.round(A.G.health), bots: A.BR_API.brAliveBots().length, cloud: getComputedStyle(document.getElementById('brCloud')).opacity }; });
  await p.evaluate(() => { const A = window.__A; A.P.pitch = 0.1; }); await p.waitForTimeout(800); await p.screenshot({ path: path.join(out, 'br_cloud.png'), timeout: 120000 });
  // everyone but me goes down: I win
  r.end = await p.evaluate(() => { const A = window.__A; A.G.health = A.G.maxHp = 1e9; for (const e of A.BR_API.brAliveBots().slice()) { e.hp = 1; e.spawnProt = 0; A.damageEnemy(e, 999, false, null, false, 'player'); } return { left: A.BR_API.brAliveBots().length, st: A.G.state, holdT: A.G.holdT, mt: +A.M.t.toFixed(1), over: A.M.over }; });
  await p.waitForTimeout(3000);
  r.over = await p.evaluate(() => ({ left: window.__A.BR_API.brAliveBots().length, st: window.__A.G.state, over: window.__A.M.over, result: window.__A.M.result, place: window.__A.BR_API.BR ? window.__A.BR_API.BR.place : 'cleared' }));
  return r;
};
