// BREAKABLE COVER: placed on the map, chipped and broken by bullets, blown up by explosions, back next match; a picture
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.startMatch('tdm', { map: 'dispensary' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; }); await p.waitForTimeout(1500);
  r.placed = await p.evaluate(() => { const A = window.__A; return { n: A.BRK.list.filter(Boolean).length, kinds: A.BRK.list.filter(Boolean).map(o => o.kind[0]).join('') }; });
  // look at the first one
  await p.evaluate(() => { const A = window.__A, o = A.BRK.list.find(Boolean); A.P.x = o.x + 3.5; A.P.z = o.z + 3.5; A.P.y = 0; A.P.yaw = Math.atan2(3.5, 3.5); A.P.pitch = -0.2; });
  await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, 'brk_before.png'), timeout: 120000 });
  // shoot it (aim at it and fire a magazine)
  r.shot = await p.evaluate(() => { const A = window.__A, o = A.BRK.list.find(Boolean), boxes0 = A.boxesArr.length; A.camera.position.set(A.P.x, 1.7, A.P.z); const dx = o.x - A.P.x, dz = o.z - A.P.z; A.P.yaw = Math.atan2(-dx, -dz); A.P.pitch = Math.atan2(0.5 - 1.7, Math.hypot(dx, dz)); A.camera.rotation.set(A.P.pitch, A.P.yaw, 0, 'YXZ'); A.camera.updateMatrixWorld(); const w = A.W[A.G.cur]; let n = 0; for (let i = 0; i < 40 && !o.broken; i++) { w.ammo = 30; A.G.lastShotTime = -9; A.G.fireT = 0; A.shoot(); n++; } return { broken: o.broken, shots: n, boxesGone: boxes0 - A.boxesArr.length, inWalls: A.wallMeshes.includes(o.hit) }; });
  await p.waitForTimeout(1200); await p.screenshot({ path: path.join(out, 'brk_after.png'), timeout: 120000 });
  // a grenade next to another one
  r.boom = await p.evaluate(() => { const A = window.__A, o = A.BRK.list.filter(Boolean).find(x => !x.broken); A.explode({ x: o.x + 1, y: 0.5, z: o.z }, 'grenade', 8, 1, 'player'); return o.broken; });
  // online: someone else's list breaks them here too
  r.apply = await p.evaluate(() => { const A = window.__A, o = A.BRK.list.filter(Boolean).find(x => !x.broken); A.brkApply([o.id]); return o.broken; });
  // the next match brings them back
  r.reset = await p.evaluate(() => { const A = window.__A; A.brkReset(); return A.BRK.list.filter(o => o && o.broken).length; });
  r.island = await p.evaluate(() => { const A = window.__A; A.loadMap('stashisle'); return A.BRK.list.filter(Boolean).length; });
  return r;
};
