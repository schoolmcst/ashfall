// GARBAGE: which functions allocate the most memory per frame during a match (garbage collection pauses = stutter)
module.exports = async p => {
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); });
  await p.evaluate(async () => { const A = window.__A, Q = window.STQ || 'ultra'; A.applyPreset(Q); A.S.quality = Q; A.renderer.setSize(640, 360, false);
    A.startGame(); A.G.breakT = 1e9; A.G.health = 1e9; for (let i = 0; i < 60; i++) { A.G.state = 'playing'; A.tickL(1 / 60); A.renderFrame(); } });
  const cdp = await p.context().newCDPSession(p); await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.startSampling', { samplingInterval: 1024 });
  const N = 300; await p.evaluate(async N => { const A = window.__A; for (let f = 0; f < N; f++) { const t = f / 60; A.G.state = 'playing'; A.P.yaw += Math.sin(t * 1.3) * 0.05; A.G.ads = (Math.floor(t / 1.5) % 2) ? 1 : 0; if (f % 7 === 0) { A.G.fireT = 0; try { A.shoot(false); } catch (e) {} } A.tickL(1 / 60); A.renderFrame(); } }, N);
  const { profile } = await cdp.send('HeapProfiler.stopSampling'); const agg = {};
  (function walk(n) { const c = n.callFrame, k = (c.functionName || '(anon)') + ' @' + (c.lineNumber + 1); agg[k] = (agg[k] || 0) + n.selfSize; for (const ch of n.children || []) walk(ch); })(profile.head);
  const top = Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, v]) => `${Math.round(v / N / 1024 * 10) / 10} KB/frame  ${k}`);
  return { totalKBperFrame: Math.round(Object.values(agg).reduce((a, b) => a + b, 0) / N / 1024), top };
};
