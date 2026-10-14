// MAP=<id> VIEWS='[[x,y,z,tx,ty,tz],...]' : render custom views to SHOTS/<id>_cv<i>.jpg
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const id = process.env.MAP, out = process.env.SHOTS, views = JSON.parse(process.env.VIEWS);
  await p.evaluate(id => window.__A.loadMap(id), id);
  await p.waitForTimeout(300);
  for (let i = 0; i < views.length; i++) {
    const url = await p.evaluate(v => {
      const A = window.__A, r = A.renderer, sc = A.scene, cam = new THREE.PerspectiveCamera(70, 16 / 9, 0.05, 500);
      cam.position.set(v[0], v[1], v[2]); cam.lookAt(v[3], v[4], v[5]);
      const W = r.domElement.width, H = r.domElement.height; r.setSize(960, 540, false); r.setViewport(0, 0, 960, 540); r.clear(); r.render(sc, cam);
      const u = r.domElement.toDataURL('image/jpeg', 0.85); r.setSize(W, H, false); r.setViewport(0, 0, W, H); return u;
    }, views[i]);
    fs.writeFileSync(path.join(out, `${id}_cv${i}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  }
  return views.length;
};
