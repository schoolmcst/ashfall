module.exports = async p => p.evaluate(() => { const A = window.__A; A.G.noRender = true; const out = {};
  for (const id of ['metro', 'docks']) { const t0 = performance.now(); A.loadMap(id); const load = performance.now() - t0; let ff = 0; const n = 20;
    for (let i = 0; i < n; i++) { const t = performance.now(); A.flowField((Math.random() - 0.5) * 70, (Math.random() - 0.5) * 70, 0); ff += performance.now() - t; }
    out[id] = { load: Math.round(load), flowMs: +(ff / n).toFixed(2), NN: A.NN }; }
  return out; });
