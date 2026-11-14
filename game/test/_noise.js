// "small black lines like film grain": the same ULTRA+ view with one effect off at a time; fine-noise score (mean |laplacian|)
// standing still and while turning, plus a zoomed crop of each
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); });
  const r = await p.evaluate(async (maps) => { const A = window.__A, res = {}, shots = []; A.G.noRender = true; A.renderer.setSize(960, 540, false); A.camera.aspect = 16 / 9; A.camera.updateProjectionMatrix();
    const c2 = document.createElement('canvas'); c2.width = 960; c2.height = 540; const cx = c2.getContext('2d', { willReadFrequently: true });
    const lap = () => { cx.drawImage(A.renderer.domElement, 0, 0); const d = cx.getImageData(0, 0, 960, 540).data, W = 960; let s = 0, n = 0; const L = i => d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      for (let y = 1; y < 539; y += 2) for (let x = 1; x < 959; x += 2) { const i = (y * W + x) * 4; s += Math.abs(4 * L(i) - L(i - 4) - L(i + 4) - L(i - W * 4) - L(i + W * 4)); n++; } return +(s / n).toFixed(2); };
    for (const id of maps) { A.loadMapL(id); A.tickL(0.016); A.applyPresetL('ultraplus'); A.S.quality = 'ultraplus'; A.S.grain = false; A.S.mblur = 'off'; const base = Object.assign({}, A.S); const v = A.MAPS[id].views[+(window.VIEWI || 0)] || A.MAPS[id].views[0];
      const sets = window.NSETS ? JSON.parse(window.NSETS) : { all: {}, noRT: { rtShadows: false }, noGI: { ssgi: false }, noAO: { ao: 'off' }, noSSR: { ssr: false }, noShafts: { shafts: false }, noUp: { upscale: 'off' }, none: { rtShadows: false, ssgi: false, ao: 'off', ssr: false, shafts: false, upscale: 'off', hfog: false, lensFx: false, chroma: false } };
      res[id] = {};
      for (const [k, o] of Object.entries(sets)) { Object.assign(A.S, base, o); const yaw0 = Math.atan2(v[3] - v[0], v[5] - v[2]);
        const place = yaw => { A.camera.position.set(v[0], v[1] + 0.3, v[2]); A.camera.lookAt(v[0] + Math.sin(yaw) * 10, v[1] + 0.1, v[2] + Math.cos(yaw) * 10); A.camera.updateMatrixWorld(); };
        place(yaw0); for (let i = 0; i < 6; i++) A.renderFrame(); const still = lap(); shots.push([id + '_' + k + '_still', A.renderer.domElement.toDataURL('image/png')]);
        for (let i = 0; i < 6; i++) { place(yaw0 + i * 0.01); A.renderFrame(); } const move = lap(); shots.push([id + '_' + k + '_move', A.renderer.domElement.toDataURL('image/png')]);
        res[id][k] = { still, move }; } }
    return { res, shots }; }, (process.env.MAPS || 'docks').split(','));
  for (const [k, u] of r.shots) fs.writeFileSync(path.join(out, k + '.png'), Buffer.from(u.split(',')[1], 'base64'));
  return r.res;
};
