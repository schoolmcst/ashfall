// new weapons: crossbow (bolt kills a bot with a body hit, sticks in walls), THE BONG (stink cloud), knife, the two new streaks, blueprints; pictures
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.openLoadout('menu'); });
  await p.waitForTimeout(500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('.lo-chip.cat')].find(x => /MARKSMAN/.test(x.textContent)); if (b) b.click(); }); await p.waitForTimeout(500);
  r.inList = await p.evaluate(() => [...document.querySelectorAll('.lo-card .lo-name')].map(x => x.textContent).filter(t => /CROSSBOW/.test(t)).length);
  await p.screenshot({ path: path.join(out, 'w2_loadout.png'), timeout: 120000 });
  r.bp = await p.evaluate(() => { const A = window.__A; document.querySelector('[data-bpb]').click(); const n = document.querySelectorAll('[data-bp]').length; const ok = A.bpApply(A.BLUEPRINTS[0]); const c = A.activeClass(); for (const o of document.querySelectorAll('.onb-ov')) o.remove(); return { tiles: n - 1, applied: ok, gun: c.p }; });
  await p.evaluate(() => { const A = window.__A; A.showScreen('menu'); A.startMatch('tdm', { map: 'dispensary' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const A = window.__A; for (const e of A.enemies) { e.speed = 0; e.reactT = 999; e.tgt = null; } window._frz = setInterval(() => { for (const e of A.enemies) { e.speed = 0; e.reactT = 999; e.cd = 9; } }, 100); });
  // crossbow at a bot 12 m away
  r.xbow = await p.evaluate(() => { const A = window.__A; A.equipClass({ p: 'crossbow', s: 'sidearm', e: 'knife', k: 'none', factory: true }); A.switchWeapon(0); const e = A.enemies.find(x => x.team !== A.M.myTeam); e.spawnProt = 0; e.hp = e.maxHp = 100; e.reactT = 99; e.group.position.set(0, 0, 4); e.group.updateMatrixWorld(true); A.P.x = 0; A.P.z = 10; A.P.y = 0; A.P.yaw = 0; A.P.pitch = Math.atan2(1.1 - 1.7, 6); A.camera.position.set(0, 1.7, 10); A.camera.rotation.set(A.P.pitch, 0, 0, 'YXZ'); A.camera.updateMatrixWorld(); window._xe = e; const w = A.W[A.G.cur]; w.ammo = 1; A.G.fireT = 0; A.G.adsOn = true; A.shoot(); return { gun: w.def.id, flying: A.grenadesInFlight.filter(g => g.proj === 'bolt').length }; });
  await p.waitForTimeout(2500);
  r.xbowHit = await p.evaluate(() => ({ dead: !window.__A.enemies.includes(window._xe), hp: window._xe.hp }));
  // a bolt into a wall sticks
  r.stick = await p.evaluate(() => { const A = window.__A; A.P.yaw = Math.PI / 2; A.camera.rotation.set(0, Math.PI / 2, 0, 'YXZ'); A.camera.updateMatrixWorld(); const w = A.W[A.G.cur]; w.ammo = 1; A.G.fireT = 0; A.shoot(); return null; });
  await p.waitForTimeout(3000); r.stick = await p.evaluate(() => window.__A.W2_STUCK.length);
  // the knife
  r.knife = await p.evaluate(() => { const A = window.__A; A.G.grenades = 2; const e = A.enemies.find(x => x.team !== A.M.myTeam); e.spawnProt = 0; e.reactT = 99; e.group.position.set(0, 0, 4); e.group.updateMatrixWorld(true); A.P.yaw = 0; A.P.pitch = Math.atan2(1.2 - 1.7, 6); A.camera.position.set(0, 1.7, 10); A.camera.rotation.set(A.P.pitch, 0, 0, 'YXZ'); A.camera.updateMatrixWorld(); window._ke = e; A.throwGrenade(); return { left: A.G.grenades, flying: A.grenadesInFlight.filter(g => g.proj === 'knife').length }; });
  await p.waitForTimeout(2000); r.knifeHit = await p.evaluate(() => !window.__A.enemies.includes(window._ke));
  // THE BONG
  r.bong = await p.evaluate(() => { const A = window.__A; A.equipClass({ p: 'marc', s: 'bongcannon', e: 'frag', k: 'none', factory: true }); A.switchWeapon(1); const w = A.W[A.G.cur]; w.ammo = 2; A.G.fireT = 0; A.P.yaw = 0; A.P.pitch = -0.2; A.camera.rotation.set(-0.2, 0, 0, 'YXZ'); A.camera.updateMatrixWorld(); const c0 = A.SMK ? A.SMK.clouds.length : 0; A.shoot(); window._c0 = c0; return { id: w.def.id, inFlight: A.grenadesInFlight.filter(g => g.proj === 'stink').length }; });
  r.bongCloud = await p.evaluate(() => { const A = window.__A, T = THREE, c0 = A.SMK.clouds.length; const m = new T.Mesh(new T.SphereGeometry(0.05)); A.scene.add(m); A.w2ProjHit({ proj: 'stink', m, dmg: 90, blast: 3.5 }, null, new T.Vector3(3, 0.2, 2), new T.Vector3(0, -1, 0)); return A.SMK.clouds.length - c0; });
  await p.screenshot({ path: path.join(out, 'w2_bong.png'), timeout: 120000 });
  // streaks
  r.watcher = await p.evaluate(() => { const A = window.__A; A.STK.have.push('watcher'); A.STK.useCd = 0; A.stkUse(); const e = A.enemies.find(x => x.team !== A.M.myTeam); e.group.position.set(A.P.x + 8, 0, A.P.z); return { t: A.STK.watchT, seen: A.stkSeen(e) }; });
  r.hot = await p.evaluate(() => { const A = window.__A; A.STK.have.push('hotstrike'); A.STK.useCd = 0; A.stkUse(); return A.STK.jobs.length; });
  return r;
};
