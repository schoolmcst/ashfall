module.exports = async p => {
  const S = process.env.SHOTS;
  await p.evaluate(() => { const A = window.__A; A.startMatch('tdm', { score: 999, time: 0, perTeam: 6, custom: true, map: 'town' }); });
  await p.waitForTimeout(1500); await p.screenshot({ path: S + '/b_loading.png' });
  const a = await p.evaluate(() => ({ hold: +window.__A.G.holdT.toFixed(1), x: window.__A.P.x }));
  await p.waitForTimeout(6000);
  const b = await p.evaluate(() => ({ hold: window.__A.G.holdT, vis: !document.getElementById('loadscr').classList.contains('hide'), mt: window.__A.M.t }));
  return { a, b };
};
