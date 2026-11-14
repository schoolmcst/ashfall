// the gun in a match on ULTRA+: plain, with the glowing TOXIC camo, and the ULTRA picture on another map (gun brightness / see-through check)
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', tag = process.env.TAG || 'x';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); });
  const r = await p.evaluate(async () => { const A = window.__A, wait = ms => new Promise(r => setTimeout(r, ms)), shots = [];
    A.applyPreset('ultraplus'); A.S.quality = 'ultraplus'; A.applySetting && A.applySetting('quality', 'ultraplus');
    A.startGame(); A.G.breakT = 1e9; A.G.health = 1e9; await wait(300); A.renderer.setSize(960, 540, false); A.camera.aspect = 16 / 9; A.camera.updateProjectionMatrix();
    for (const e of A.enemies) e.group && (e.group.visible = false);
    for (const [camo, gun] of [[null, 'marc'], ['toxic', 'marc'], ['inferno', 'marc']]) {
      A.equipClass({ p: gun, s: 'sidearm', e: 'frag', k: 'none' }); A.G.swapT = 0; await wait(50);
      const g = A.gunObjs[A.G.cur] || A.gunObjs[0]; try { A.applyCamo && A.applyCamo(g, camo); } catch (e) {}
      A.P.yaw = 0.6; A.P.pitch = -0.05; for (let i = 0; i < 10; i++) { A.tickL(0.016); A.renderFrame(); }
      shots.push([camo || 'plain', A.renderer.domElement.toDataURL('image/jpeg', 0.9)]); }
    return shots; });
  r.forEach(([k, u]) => fs.writeFileSync(path.join(out, `gun_${tag}_${k}.jpg`), Buffer.from(u.split(',')[1], 'base64')));
  return r.map(x => x[0]);
};
