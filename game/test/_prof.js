// CPU profile of play (Chrome DevTools profiler): self time per function and per file area, over 20 s
// SCEN=tdm|zomb|br  MAP=id
module.exports = async p => {
  const scen = process.env.SCEN || 'tdm', map = process.env.MAP || 'metro';
  await p.evaluate(([scen, map]) => { const h = document.getElementById('hcSplash'); if (h) h.remove(); const A = window.__A;
    if (scen === 'zomb') { A.ZL.net = 'solo'; A.ZL.map = map; A.openZLobby(); A.zombAct('z-start'); } else A.startMatch(scen, { map }); }, [scen, map]);
  await p.waitForTimeout(4000);
  await p.evaluate(scen => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; if (scen === 'zomb') { A.Z.round = 12; A.Z.toSpawn = 40; A.Z.active = true; } }, scen);
  await p.waitForTimeout(3000);
  const cdp = await p.context().newCDPSession(p); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  const f0 = await p.evaluate(() => window.__A.renderer.info.render.frame);
  await cdp.send('Profiler.start'); await p.waitForTimeout(20000); const { profile } = await cdp.send('Profiler.stop');
  const info = await p.evaluate(f0 => { const A = window.__A; return { frames: A.renderer.info.render.frame - f0, enemies: A.enemies.length, calls: A.renderer.info.render.calls, tris: A.renderer.info.render.triangles }; }, f0);
  const byId = new Map(profile.nodes.map(n => [n.id, n])), self = new Map();
  const dt = profile.timeDeltas; let total = 0;
  for (let i = 0; i < profile.samples.length; i++) { const n = byId.get(profile.samples[i]), d = dt[i] || 0; total += d; const cf = n.callFrame, k = (cf.functionName || '(anon)') + (cf.url.includes('three') ? ' [three]' : cf.url ? '' : ' [native]'); self.set(k, (self.get(k) || 0) + d); }
  const rows = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, v]) => [k, +(v / 1000 / Math.max(1, info.frames)).toFixed(2), +(v / total * 100).toFixed(1)]);
  return Object.assign(info, { msPerFrame: +(total / 1000 / Math.max(1, info.frames)).toFixed(1), top: rows });
};
