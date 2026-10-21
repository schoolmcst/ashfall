// floor plans with everything above a height cut away: MAP=<id> CUTS=3.6,7.9 node run.js s_plancut.js
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const id = process.env.MAP || 'blackwell', out = process.env.SHOTS || '/tmp', cuts = (process.env.CUTS || '3.6,7.9').split(',').map(Number);
  const info = await p.evaluate(id => { const A = window.__A; A.loadMap(id); return { boxes: A.boxes.length }; }, id);
  for (const c of cuts) {
    const url = await p.evaluate(c => {
      const A = window.__A, r = A.renderer, sc = A.scene, pr = A.MAPS[A.curMap].play, hw = Math.max(pr[1] - pr[0], pr[3] - pr[2]) / 2 + 2;
      const cam = new THREE.OrthographicCamera(-hw, hw, hw, -hw, 1, 400); cam.position.set(0, 200, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
      r.localClippingEnabled = true; r.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), c)];
      const fog = sc.fog.density; sc.fog.density = 0; const W = r.domElement.width, H = r.domElement.height;
      const L = A.LAYOUT, g = new THREE.Group(); sc.add(g);
      const dot = (x, y, z, col, s) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(s, s, 0.2, 16), new THREE.MeshBasicMaterial({ color: col, depthTest: false })); m.position.set(x, Math.min(c - 0.3, (y || 0) + 0.5), z); m.renderOrder = 9; g.add(m); };
      L.spawn.forEach((s, i) => dot(s.x, s.y, s.z, i ? 0xff3030 : 0x3080ff, 1.6)); L.hp.forEach(h => dot(h.x, h.y, h.z, 0xffffff, 1)); L.sites.forEach(h => dot(h.x, h.y, h.z, 0xffcc00, 1.2));
      r.setSize(1000, 1000, false); r.setViewport(0, 0, 1000, 1000); r.clear(); r.render(sc, cam);
      const u = r.domElement.toDataURL('image/png'); r.clippingPlanes = []; sc.remove(g); sc.fog.density = fog; r.setSize(W, H, false); r.setViewport(0, 0, W, H); return u;
    }, c);
    fs.writeFileSync(path.join(out, `${id}_cut${c}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  return info;
};
