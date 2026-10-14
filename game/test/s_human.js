// human-like bots: a fast bot match, behaviour counters, learning carried to the next match, then pictures
const D = process.env.SHOTS || '/tmp';
module.exports = async p => {
  await p.waitForTimeout(2500); await p.evaluate(() => { const g = document.getElementById('hcGo'); g && g.click(); }); await p.waitForTimeout(600);
  await p.evaluate(() => { const A = window.__A; A.startMatch('tdm', { score: 999, time: 0, perTeam: 6, custom: true, map: 'town', skill: 'veteran' }); A.G.holdT = 0.05; A.G.loadT = 0.05; A.G.health = 1e9; A.G.spawnProt = 1e9; A._rr = A.renderer.render; A.renderer.render = () => {}; });
  const out = [];
  for (let i = 0; i < 3; i++) {
    await p.waitForTimeout(9000);
    out.push(await p.evaluate(() => { const A = window.__A, b = A.enemies.filter(e => e.entry); return { t: Math.round(A.M.t), kills: A.M.entries.reduce((s, e) => s + (e.kills || 0), 0), pausing: b.filter(e => e.pauseT > 0).length, looking: b.filter(e => e.lookYaw != null).length, crouch: b.filter(e => e.crouchK > 0.5).length, hum: +(b.reduce((s, e) => s + (e.hum || 0), 0) / b.length).toFixed(2), fights: Math.floor(A.BRAIN.fights) }; }));
  }
  await p.evaluate(() => { const A = window.__A; A.renderer.render = A._rr; });
  await p.waitForTimeout(1500); await p.screenshot({ path: D + '/human_ingame.png' });
  await p.evaluate(() => { const A = window.__A; A.endMatch(A.M.myTeam); });
  await p.waitForTimeout(800);
  const carried = await p.evaluate(() => { const A = window.__A; A.leaveGame(); const saved = JSON.parse(localStorage.getItem('ashfall.botbrain.v1') || 'null'); A.startMatch('tdm', { score: 999, time: 0, perTeam: 3, custom: true, map: 'docks', skill: 'veteran' }); const b = A.enemies.filter(e => e.entry); const r = { savedFights: saved && Math.floor(saved.fights), nextMatchBotLevel: b[0] && b[0].brainLv, nextMatchHum: b[0] && +b[0].hum.toFixed(2) }; A.leaveGame(); return r; });
  await p.evaluate(() => { const A = window.__A; A.openReplay(); A.RV.t = A.RPLAST ? A.RPLAST.len * 0.75 : 0; A.RV.play = false; });
  await p.waitForTimeout(1200); await p.screenshot({ path: D + '/human_replay.png' });
  return { out, carried };
};
