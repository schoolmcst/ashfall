// reads the ray-trace buffer: share of pixels in sun shadow / sky-occluded, per map view
module.exports = async p => p.evaluate(() => { const A = window.__A, out = {}; A.G.noRender = true;
  for (const id of ['docks', 'funfair']) { A.loadMapL(id); A.tickL(0.016); Object.assign(A.S, { post: 'high', ao: 'off', rtShadows: true, ssgi: true, upscale: 'off' }); const GR = A.GR_GET(); GR.photo = true;
    const v = A.MAPS[id].views[0]; A.camera.position.set(v[0], v[1] + 0.3, v[2]); A.camera.lookAt(v[3], v[4], v[5]); A.camera.updateMatrixWorld();
    for (let i = 0; i < 20; i++) A.renderFrame(); const t = GR.accA, w = t.width, h = t.height, buf = new Uint16Array(w * h * 4); A.renderer.readRenderTargetPixels(t, 0, 0, w, h, buf);
    const hf = x => { const e = (x >> 10) & 31, m = x & 1023; return e === 0 ? m / 1024 / 16384 : Math.pow(2, e - 15) * (1 + m / 1024); };
    let sh = 0, oc = 0, n = 0; for (let i = 0; i < w * h; i++) { const r = hf(buf[i * 4]), g = hf(buf[i * 4 + 1]); n++; if (r < 0.5) sh++; if (g < 0.7) oc++; }
    out[id] = { n: GR.n, boxes: GR.grid.n, sunShadowPct: Math.round(sh / n * 100), skyOccPct: Math.round(oc / n * 100), size: [w, h] }; GR.photo = false; }
  return out; });
