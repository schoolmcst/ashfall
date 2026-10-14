// scorestreaks: earn by points, use, strikes kill enemies, UAV reveals, death resets points
module.exports = async p => p.evaluate(async () => {
  const A = window.__A; A.G.noRender = true;
  A.startMatch('tdm', { score: 999, time: 0, perTeam: 6, custom: true, map: 'docks' }); A.G.spawnProt = 1e9; A.G.health = 1e9;
  for (const e of A.enemies) e.cd = 1e9;
  await new Promise(r => setTimeout(r, 1500));
  A.stkAdd(450); const r1 = A.STK.have.slice();
  A.stkAdd(900); const r2 = A.STK.have.slice();
  A.stkUse(); A.stkUse(); A.stkUse();
  const uav = A.STK.uavT;
  for (let i = 0; i < 80 && A.STK.jobs.length; i++) await new Promise(r => setTimeout(r, 250));
  const kills = A.M.entries.find(e => e.isPlayer).kills;
  A.stkAdd(300); const pts = A.STK.pts; A.G.health = 1; A.hurtPlayer(50, 0, 0); await new Promise(r => setTimeout(r, 500));
  A.G.noRender = false;
  return { r1, r2, uav, jobsLeft: A.STK.jobs.length, kills, ptsBefore: pts, ptsAfterDeath: A.STK.pts };
});
