// GRAPHICS O1-O5: counters over the whole frame, the breakdown, GPU timer, the 3-map tour
module.exports = async p => { const r = {}; try { await run(p, r); } catch (e) { r.FAIL = String(e).slice(0, 400); } return r; };
const run = async (p, r) => {
  const SH = process.env.SHOTS || '/tmp', ev = (f, a) => p.evaluate(f, a);
  await ev(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); const A = window.__A; A.S.perfGraph = true; A.S.showFps = true; A.applyVideoSettings(); A.startMatch('tdm', { map: 'docks' }); });
  await p.waitForTimeout(12000); await ev(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(2000);
  await ev(() => { const A = window.__A; if (A.G.state === 'paused') { A.G.state = 'playing'; A.showScreen(null); } A.G.health = A.G.maxHp = 1e9; });
  await p.waitForTimeout(8000);
  r.pf = await ev(() => { const P = window.__A.PF_GET(); const o = {}; for (const k of ['logic', 'scene', 'shadow', 'vm', 'post', 'frame', 'gpu', 'calls', 'tris']) o[k] = Math.round((P[k] || 0) * 10) / 10; o.gpuExt = !!P.ext; o.fpsX = (document.getElementById('fpsX') || {}).textContent; return o; });
  await p.screenshot({ path: SH + '/gfx1_graph.png' });
  // the tour (12 s a map); this container draws only a few frames a second, so a map may report NO DATA
  await ev(() => { const A = window.__A; A.leaveGame(); A.pfbTourL(); });
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(5000); const done = await ev(() => !window.__A.PFB_GET().tour && window.__A.curScreen === 'bench'); if (done) break; }
  r.tour = await ev(() => ({ scr: window.__A.curScreen, verdict: document.getElementById('benchVerdict').textContent, stats: document.getElementById('benchStats').innerText.split('\n').slice(0, 10), res: window.__benchTour && window.__benchTour.score }));
  await p.screenshot({ path: SH + '/gfx1_tour.png' });
};
