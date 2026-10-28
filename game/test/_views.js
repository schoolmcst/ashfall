// render every view of a map (no HUD): MAP=id SHOTS=dir node run.js _views.js
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const id = process.env.MAP, out = process.env.SHOTS;
  const shots = await p.evaluate(id => { const A = window.__A; A.loadMap(id); const r = A.renderer, sc = A.scene, res = [];
    if (window.__BOSS) { const e = A.makeZombie(0, 6, 0); A.zsMakeBoss ? A.zsMakeBoss(e) : 0; }
    for (const v of A.MAPS[id].views) { const cam = new THREE.PerspectiveCamera(62, 16 / 9, 0.05, 600); cam.position.set(v[0], v[1] + 0.3, v[2]); cam.lookAt(v[3], v[4], v[5]); r.setSize(960, 540, false); r.setViewport(0, 0, 960, 540); r.clear(); r.render(sc, cam); res.push(r.domElement.toDataURL('image/jpeg', 0.85)); }
    return res; }, id);
  shots.forEach((u, i) => fs.writeFileSync(path.join(out, id + '_v' + i + '.jpg'), Buffer.from(u.split(',')[1], 'base64')));
  return shots.length;
};
