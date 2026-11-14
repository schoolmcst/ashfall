// turning the camera with the ray-traced settings on: frame-to-frame flicker (mean pixel change) with them on vs off
module.exports = async p => p.evaluate(() => { const A = window.__A, out = {}; A.G.noRender = true; A.renderer.setSize(640, 360, false); A.camera.aspect = 16 / 9; A.camera.updateProjectionMatrix();
  const c2 = document.createElement('canvas'); c2.width = 640; c2.height = 360; const cx = c2.getContext('2d', { willReadFrequently: true });
  const grab = () => { cx.drawImage(A.renderer.domElement, 0, 0, 640, 360); return cx.getImageData(0, 0, 640, 360).data; };
  for (const id of (window.RTM_MAPS || ['docks', 'funfair'])) { A.loadMapL(id); A.tickL(0.016); const v = A.MAPS[id].views[0], res = {};
    for (const on of [false, true]) { Object.assign(A.S, { post: 'high', ao: 'high', ssgi: on, rtShadows: on, upscale: 'off', mblur: 'off', dof: false }); const yaw0 = Math.atan2(v[3] - v[0], v[5] - v[2]); let prev = null, sum = 0, n = 0;
      for (let i = 0; i < 40; i++) { const yaw = yaw0 + i * 0.006; A.camera.position.set(v[0], v[1] + 0.3, v[2]); A.camera.lookAt(v[0] + Math.sin(yaw) * 10, v[1] + 0.1, v[2] + Math.cos(yaw) * 10); A.camera.updateMatrixWorld(); A.renderFrame();
        const d = grab(); if (prev && i > 5) { let s = 0; for (let k = 0; k < d.length; k += 4) s += Math.abs(d[k] - prev[k]) + Math.abs(d[k + 1] - prev[k + 1]) + Math.abs(d[k + 2] - prev[k + 2]); sum += s / (d.length / 4) / 3; n++; } prev = d; }
      res[on ? 'rtOn' : 'rtOff'] = +(sum / n).toFixed(2); }
    out[id] = res; }
  return out; });
