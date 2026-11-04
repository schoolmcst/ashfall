// PROP HUNT offline: roles, disguises (bots and me), the hunters' blindfold, the swap, scores, pictures
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); const A = window.__A; A.startMatch('ph', { map: 'stackyard' }); });
  await p.waitForTimeout(4000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; });
  await p.waitForTimeout(6000);
  const st = () => p.evaluate(() => { const A = window.__A, ph = A.PH_API.PH, M = A.M; return { state: A.G.state, myTeam: M.myTeam, hunt: ph && ph.hunt, t: ph && Math.round(ph.t), meProp: A.PH_API.phMeProp(), hiding: A.PH_API.phHiding(), kind: ph && A.PH_API.PH_KINDS[ph.kind].n, score: M.teamScore.slice(),
    bots: A.enemies.filter(e => e.entry).map(e => [e.team, e.phK === null || e.phK === undefined ? -1 : e.phK, e.rig.hits.length]).slice(0, 10), blind: getComputedStyle(document.getElementById('phBlind')).display, hud: (document.getElementById('mInfo') || document.body).textContent.slice(0, 0) }; });
  r.s0 = await st();
  // be a prop: if we are hunting, force a swap
  await p.evaluate(() => { const A = window.__A, ph = A.PH_API.PH; if (!A.PH_API.phMeProp()) ph.t = 0.01; });
  await p.waitForTimeout(3000); r.s1 = await st();
  await p.evaluate(() => { const A = window.__A; A.G.state = 'playing'; A.G.health = A.G.maxHp = 1e9; A.P.pitch = -0.25; });
  await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, 'ph_prop.png'), timeout: 120000 });
  // change the prop (USE), then let 12 s of scoring run after the hiding phase
  await p.evaluate(() => { const A = window.__A, ph = A.PH_API.PH; ph.t = A.PH_API.PH && 90; ph.tick = 0.1; });
  await p.waitForTimeout(4000); r.s2 = await st();
  // as a hunter: blind at the start, then a missed shot hurts
  await p.evaluate(() => { const A = window.__A, ph = A.PH_API.PH; ph.t = 0.01; });
  await p.waitForTimeout(2500); r.s3 = await st();
  await p.screenshot({ path: path.join(out, 'ph_blind.png'), timeout: 120000 });
  r.miss = await p.evaluate(() => { const A = window.__A, ph = A.PH_API.PH; ph.t = 60; A.G.state = 'playing'; A.G.health = 100; A.G.maxHp = 100; A.P.pitch = 1.2; const w = A.W[A.G.cur]; w.ammo = 10; A.G.fireT = 0; A.shoot(false); return A.G.health; });
  await p.evaluate(() => { const A = window.__A; A.P.pitch = -0.05; for (const e of A.enemies) if (e.phG) { A.P.x = e.group.position.x + 4; A.P.z = e.group.position.z + 4; A.P.yaw = Math.atan2(-(e.group.position.x - A.P.x), -(e.group.position.z - A.P.z)); break; } });
  await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, 'ph_hunter.png'), timeout: 120000 });
  return r;
};
