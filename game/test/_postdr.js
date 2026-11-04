// dynamic resolution steps must not remake the BLOOM & COLOUR targets; the picture keeps filling the screen
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp';
  return await p.evaluate(() => { const A = window.__A; A.G.noRender = true; A.loadMap('dispensary'); const v = A.MAPS.dispensary.views[1];
    A.camera.position.set(v[0], v[1] + 0.3, v[2]); A.camera.lookAt(v[3], v[4], v[5]); A.camera.updateMatrixWorld(); A.S.post = 'high';
    const res = []; let rt0 = null, made = 0;
    for (const sc of [1, 0.88, 0.77, 0.68, 0.6, 0.68, 0.77, 1]) { A.DR.scale = sc; A.renderer.setPixelRatio(Math.max(0.4, A.DR.basePR * sc)); A.renderFrame();
      if (A.POST.rt !== rt0) { made++; rt0 = A.POST.rt; }
      const c = A.renderer.domElement, g = document.createElement('canvas'); g.width = 64; g.height = 36; const x = g.getContext('2d'); x.drawImage(c, 0, 0, 64, 36);
      const d = x.getImageData(0, 0, 64, 36).data; let edge = 0; for (let i = 0; i < 36; i++) edge += d[(i * 64 + 63) * 4] + d[(35 * 64 + (i % 64)) * 4];   // right column / bottom row not black
      res.push({ sc, w: A.POST.dw, W: A.POST.w, edge }); }
    return { made, res };
  });
};
