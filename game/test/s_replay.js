// replay: record a bot TDM match, end it, open the REPLAY screen and look at it
const fs = require('fs'), D = process.env.SHOTS || '/tmp';
module.exports = async p => {
  await p.evaluate(() => { const A = window.__A; A.startMatch('hp', { score: 999, time: 0, perTeam: 5, custom: true, map: 'town', skill: 'veteran' }); A.G.holdT = 0.05; A.G.loadT = 0.05; A.G.health = 1e9; A._rr = A.renderer.render; A.renderer.render = () => {}; });   // skip drawing so the match runs fast
  await p.waitForTimeout(45000);
  const rec = await p.evaluate(() => { const R = window.__A.REC; return R ? { st: window.__A.G.state, frames: R.frames.length, ents: R.ents.length, feed: R.feed.length, t: +R.t.toFixed(1) } : { st: window.__A.G.state, over: window.__A.M.over, scr: window.__A.curScreen, last: !!window.__A.RPLAST }; });
  await p.evaluate(() => { const A = window.__A; A.renderer.render = A._rr; A.endMatch(A.M.myTeam); });
  await p.waitForTimeout(500);
  const last = await p.evaluate(() => { const R = window.__A.RPLAST; return { frames: R.frames.length, plan: R.plan ? R.plan.length : 0, len: R.len, feed: R.feed.length, stored: (localStorage.getItem('dz_replay') || '').length }; });
  await p.evaluate(() => { window.__A.leaveGame(); window.__A.openReplay(); });
  await p.waitForTimeout(800);
  await p.evaluate(() => { const A = window.__A; A.RV.t = A.RPLAST.len * 0.7; A.RV.play = false; });
  await p.waitForTimeout(600);
  await p.screenshot({ path: D + '/replay_full.png' });
  await p.evaluate(() => { const A = window.__A; A.RV.follow = true; });
  await p.waitForTimeout(600);
  await p.screenshot({ path: D + '/replay_follow.png' });
  const scr = await p.evaluate(() => window.__A.curScreen);
  return { rec, last, scr };
};
