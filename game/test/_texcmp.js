// pictures of maps with the scanned textures (PHCACHE=dir of Poly Haven files): SHOTS=dir MAPS=a,b TAG=new node run.js _texcmp.js
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', tag = process.env.TAG || 'new', res = {};
  const ids = process.env.MAPS.split(',');
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); window.__A.G.noRender = true; });
  for (const id of ids) {
    await p.evaluate(id => { window.__A.loadMap(id); }, id);
    for (let i = 0; i < 40 && !(await p.evaluate(() => window.__A.REALTEX.applied)); i++) await p.waitForTimeout(500);
    await p.waitForTimeout(300);
    const r = await p.evaluate(id => { const A = window.__A; try { A.REALTEX.byMap && 0; } catch (e) {}
      const vs = A.MAPS[id].views || [], pick = [vs[0], vs[Math.min(vs.length - 1, 2)], vs[Math.min(vs.length - 1, 4)]].filter(Boolean), shots = [];
      A.renderer.setSize(960, 540, false); A.camera.aspect = 16 / 9; A.camera.updateProjectionMatrix(); A.S.post = 'high';
      for (const v of pick) { A.camera.position.set(v[0], v[1] + 0.3, v[2]); A.camera.lookAt(v[3], v[4], v[5]); A.camera.updateMatrixWorld(); A.renderFrame(); A.renderFrame(); shots.push(A.renderer.domElement.toDataURL('image/jpeg', 0.85)); }
      return { shots, n: A.REALTEX.count, done: A.REALTEX.done ? [...A.REALTEX.done] : null };
    }, id);
    r.shots.forEach((u, i) => fs.writeFileSync(path.join(out, `${id}_${i}_${tag}.jpg`), Buffer.from(u.split(',')[1], 'base64')));
    res[id] = { n: r.n, done: r.done };
  }
  return res;
};
