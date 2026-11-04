const path = require('path');
module.exports = async p => {
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); window.__A.startMatch('tdm', { map: 'dispensary' }); });
  await p.waitForTimeout(7000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => { const A = window.__A; let real = 0; A.scene.traverse(o => { if (o.isPointLight) real++; }); return { real, poolOn: A.NAVDBG ? true : true, programs: A.renderer.info.programs.length }; });
  await p.screenshot({ path: path.join(process.env.SHOTS || '/tmp', 'pool_disp.png') });
  await p.evaluate(() => { const A = window.__A, v = new THREE.Vector3(A.P.x - Math.sin(A.P.yaw) * 6, 0.5, A.P.z - Math.cos(A.P.yaw) * 6); A.explode(v, 6, 'player', 0); for (const e of A.enemies.slice(0, 3)) { e.spawnProt = 0; A.damageEnemy(e, 9999, true, new THREE.Vector3(0, 0, 1), false, 'player'); } });
  await p.waitForTimeout(5000);
  r.programsAfter = await p.evaluate(() => window.__A.renderer.info.programs.length);
  return r;
};
