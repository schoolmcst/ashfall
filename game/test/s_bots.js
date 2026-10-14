// smart bots: a 6v6 bot match on ELITE runs without errors; count kills, grenades, callouts, retreats
module.exports = async p => {
  await p.evaluate(() => { const A = window.__A; A.startMatch('tdm', { score: 999, time: 0, perTeam: 6, custom: true, map: 'town', skill: 'elite' }); A.G.holdT = 0.05; A.G.loadT = 0.05; A.G.health = 1e9; A.G.spawnProt = 1e9; A._rr = A.renderer.render; A.renderer.render = () => {}; });
  const samp = [];
  for (let i = 0; i < 6; i++) {
    await p.waitForTimeout(8000);
    samp.push(await p.evaluate(() => { const A = window.__A, b = A.enemies.filter(e => e.entry); return { t: Math.round(A.M.t), kills: A.M.entries.reduce((s, e) => s + (e.kills || 0), 0), nades: b.reduce((s, e) => s + (2 - (e.nades || 0)), 0), lkp: b.filter(e => e.lkp).length, tgt: b.filter(e => e.tgt).length, retreat: b.filter(e => e.retreat).length, bad: b.filter(e => !isFinite(e.group.position.x)).length, score: A.M.teamScore }; }));
  }
  await p.evaluate(() => { window.__A.renderer.render = window.__A._rr; });
  return samp;
};
