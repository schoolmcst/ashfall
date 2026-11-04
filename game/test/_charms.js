const fs = require('fs'), path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp';
  const url = await p.evaluate(() => { const A = window.__A; A.G.noRender = true; const ids = ['ch_leaf', 'ch_jar', 'ch_joint', 'ch_bong', 'ch_lighter', 'ch_brownie', 'ch_grinder', 'ch_purple'];
    const sc = new THREE.Scene(); sc.environment = A.scene.environment; sc.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a3226, 1.6)); const d = new THREE.DirectionalLight(0xfff2e0, 2.6); d.position.set(1, 2, 2); sc.add(d);
    ids.forEach((id, i) => { const g = A.charmBuild(id); g.scale.setScalar(26); g.position.set((i % 4 - 1.5) * 0.85, i < 4 ? 0.75 : -0.35, 0); g.rotation.y = 0.35; sc.add(g); });
    const cam = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 20); cam.position.set(0, 0.1, 2.6); cam.lookAt(0, 0.05, 0);
    A.renderer.setSize(1280, 720, false); A.renderer.setRenderTarget(null); A.renderer.setClearColor(0x24242c, 1); A.renderer.clear(); A.renderer.render(sc, cam); return A.renderer.domElement.toDataURL('image/png'); });
  fs.writeFileSync(path.join(out, 'charms.png'), Buffer.from(url.split(',')[1], 'base64')); return 'ok';
};
