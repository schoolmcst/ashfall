// colour filter pictures, subtitle size, aim assist scaling
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp';
  const r = await p.evaluate(() => { const A = window.__A; A.G.noRender = true; A.loadMap('dispensary'); const v = A.MAPS.dispensary.views[0];
    A.renderer.setSize(640, 360, false); A.camera.aspect = 16 / 9; A.camera.updateProjectionMatrix(); A.camera.position.set(v[0], v[1] + 0.3, v[2]); A.camera.lookAt(v[3], v[4], v[5]); A.camera.updateMatrixWorld();
    const shots = {}; for (const [post, cb] of [['high', 'off'], ['high', 'deut'], ['high', 'prot'], ['high', 'trit'], ['off', 'deut']]) { A.S.post = post; A.S.cbFilter = cb; A.renderFrame(); A.renderFrame(); shots[post + '_' + cb] = A.renderer.domElement.toDataURL('image/jpeg', 0.85); }
    A.S.post = 'high'; A.S.cbFilter = 'off';
    A.S.subSize = 'xl'; A.S.subBg = true; A.applyVideoSettings(); A.zvSubtitle({ col: '#7adf6a', name: 'SMOKES' }, 'Subtitle test line, man.'); const fsz = getComputedStyle(document.getElementById('zSub')).fontSize;
    return { shots, fsz }; });
  for (const k in r.shots) fs.writeFileSync(path.join(out, 'cb_' + k + '.jpg'), Buffer.from(r.shots[k].split(',')[1], 'base64'));
  return { fsz: r.fsz };
};
