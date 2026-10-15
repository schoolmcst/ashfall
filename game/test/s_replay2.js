// replay saves when you quit mid-match, and is still there after restarting the game
const D = process.env.SHOTS || '/tmp';
module.exports = async p => {
  await p.waitForTimeout(2500); await p.evaluate(() => { const g = document.getElementById('hcGo'); g && g.click(); }); await p.waitForTimeout(600);
  await p.evaluate(() => { const A = window.__A; A.startMatch('tdm', { score: 999, time: 0, perTeam: 4, custom: true, map: 'docks' }); A.G.holdT = 0.05; A.G.loadT = 0.05; A._rr = A.renderer.render; });
  await p.waitForFunction(() => window.__A.REC && window.__A.REC.planTried, null, { timeout: 60000 }); await p.evaluate(() => { window.__A.renderer.render = () => {}; });
  await p.waitForTimeout(15000);
  const mid = await p.evaluate(() => { const A = window.__A; return { rec: A.REC ? A.REC.frames.length : null, plan: !!(A.REC && A.REC.plan) }; });
  await p.evaluate(() => { const A = window.__A; A.renderer.render = A._rr; A.leaveGame(); });
  await p.waitForTimeout(1500);
  await p.reload(); await p.waitForFunction(() => window.__A && window.__A.G.state === 'menu', null, { timeout: 120000 });
  await p.waitForTimeout(2500); await p.evaluate(() => { const g = document.getElementById('hcGo'); g && g.click(); });
  await p.evaluate(() => { const A = window.__A; A.actions('replay'); });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const A = window.__A; if (A.RPLAST) { A.RV.t = A.RPLAST.len * 0.8; A.RV.play = false; } });
  await p.waitForTimeout(800); await p.screenshot({ path: D + '/replay_fixed.png' });
  return { mid, afterRestart: await p.evaluate(() => { const R = window.__A.RPLAST; return R ? { frames: R.frames.length, len: Math.round(R.len), plan: !!R.plan } : null; }), empty: await p.evaluate(() => !document.getElementById('rpEmpty').classList.contains('hide')) };
};
