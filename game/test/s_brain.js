// bot learning: a bot match teaches the brain (tactic weights per map, fights, kill range), it is saved, and settings show it
const D = process.env.SHOTS || '/tmp';
module.exports = async p => {
  await p.waitForTimeout(2500); await p.evaluate(() => { const g = document.getElementById('hcGo'); g && g.click(); }); await p.waitForTimeout(600);
  await p.evaluate(() => { localStorage.removeItem('ashfall.botbrain.v1'); });
  await p.evaluate(() => { const A = window.__A; A.startMatch('tdm', { score: 999, time: 0, perTeam: 6, custom: true, map: 'docks', skill: 'veteran' }); A.G.holdT = 0.05; A.G.loadT = 0.05; A._rr = A.renderer.render; A.renderer.render = () => {}; });
  const samp = [];
  for (let i = 0; i < 5; i++) { await p.waitForTimeout(10000); samp.push(await p.evaluate(() => { const B = window.__A.BRAIN, m = B.maps.docks; return { fights: +B.fights.toFixed(1), lvl: window.__A.brainLevel(), tac: m ? Object.fromEntries(Object.entries(m.tac).map(([k, v]) => [k, +v.toFixed(2)])) : null, heat: m ? Object.keys(m.heat).length : 0, die: m ? Object.keys(m.die).length : 0, killDist: +B.killDist.toFixed(1), kdN: B.kdN }; })); }
  await p.evaluate(() => { const A = window.__A; A.renderer.render = A._rr; A.endMatch(A.M.myTeam); });
  await p.waitForTimeout(800);
  await p.screenshot({ path: D + '/brain_results.png' });
  const saved = await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('ashfall.botbrain.v1') || 'null'); return o ? +o.fights.toFixed(1) : null; });
  await p.evaluate(() => { const A = window.__A; A.leaveGame(); A.actions('settings'); const t = [...document.querySelectorAll('#tabs button')].find(b => /GAMEPLAY/.test(b.textContent)); t && t.click(); });
  await p.waitForTimeout(600); await p.screenshot({ path: D + '/brain_settings.png' });
  return { samp, saved, summary: await p.evaluate(() => window.__A.brainSummary()) };
};
