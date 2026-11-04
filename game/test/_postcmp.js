// every map from two of its views, BLOOM & COLOUR off and high, through the real frame (SHOTS=dir MAPS=a,b node run.js _postcmp.js)
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', res = {};
  const ids = process.env.MAPS ? process.env.MAPS.split(',') : await p.evaluate(() => window.__A.MAP_ORDER.slice());
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); window.__A.G.noRender = true; });
  for (const id of ids) {
    const r = await p.evaluate(id => { const A = window.__A; try { A.loadMap(id); } catch (e) { return { err: String(e) }; }
      const vs = A.MAPS[id].views || [], pick = [vs[0], vs[Math.min(vs.length - 1, 3)]].filter(Boolean), shots = [];
      A.renderer.setSize(960, 540, false); A.camera.aspect = 16 / 9; A.camera.updateProjectionMatrix();
      for (const v of pick) for (const q of ['off', 'high']) {
        A.S.post = q; A.camera.position.set(v[0], v[1] + 0.3, v[2]); A.camera.lookAt(v[3], v[4], v[5]); A.camera.updateMatrixWorld();
        A.renderFrame(); A.renderFrame(); shots.push(A.renderer.domElement.toDataURL('image/jpeg', 0.85));
      }
      return { shots, failed: window.__A.POST ? window.__A.POST.failed : null };
    }, id);
    if (r.err) { res[id] = r.err; continue; }
    r.shots.forEach((u, i) => fs.writeFileSync(path.join(out, `${id}_${(i >> 1)}_${i % 2 ? 'high' : 'off'}.jpg`), Buffer.from(u.split(',')[1], 'base64')));
    res[id] = r.shots.length;
  }
  return res;
};
