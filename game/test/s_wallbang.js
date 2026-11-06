// WALLBANGS: a rifle through a 0.4 m house wall hits the bot inside; a pistol doesn't; a thick wall stops everything
module.exports = async p => {
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.G.noRender = false; window.__A.startMatch('br', { map: 'random' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; }); await p.waitForTimeout(2000);
  const shot = (cls) => p.evaluate(cls => {
    const A = window.__A, e = A.enemies.find(x => x.entry && x.entry.alive !== false); e.spawnProt = 0; e.hp = e.maxHp = 1000; e.group.position.set(-14, 0, -13.2); e.group.updateMatrixWorld(true); e.tgt = null; e.goal = null; e.reactT = 99;
    if (cls) A.equipClass(cls);
    A.P.x = -14; A.P.z = -19.5; A.P.y = 0; A.P.yaw = Math.PI; A.P.pitch = Math.atan2(1.15 - 1.7, 6.3); A.P.vx = A.P.vz = 0;
    A.camera.position.set(A.P.x, 1.7, A.P.z); A.camera.rotation.set(A.P.pitch, A.P.yaw, 0, 'YXZ'); A.camera.updateMatrixWorld();
    const w = A.W[A.G.cur]; w.ammo = 30; A.G.fireT = 0; A.G.swapT = 0; A.G.adsOn = true; A.G.ads = 1; A.G.bloom = 0; A.G.lastShotTime = -9;
    const hp0 = e.hp; for (let i = 0; i < 5; i++) { A.G.lastShotTime = -9; A.shoot(); }
    return { gun: w.def.id, cat: w.def.cat, dmg: Math.round(hp0 - e.hp) };
  }, cls);
  const r = {};
  r.rifle = await shot({ p: 'marc', s: 'sidearm', e: 'frag', k: 'none', factory: true });
  r.pistol = await p.evaluate(() => { const A = window.__A; A.switchWeapon(1); return A.W[A.G.cur].def.cat; });
  r.pistolShot = await shot(null);
  // the lighthouse (solid, 4.4 m wide): nothing goes through
  r.thick = await p.evaluate(() => { const A = window.__A, e = A.enemies.find(x => x.entry && x.entry.alive !== false); A.switchWeapon(0); e.hp = e.maxHp = 1000; e.group.position.set(48, 0, -44); e.group.updateMatrixWorld(true); A.P.x = 48; A.P.z = -53; A.P.yaw = Math.PI; A.P.pitch = Math.atan2(1.15 - 1.7, 9); A.camera.position.set(48, 1.7, -53); A.camera.rotation.set(A.P.pitch, A.P.yaw, 0, 'YXZ'); A.camera.updateMatrixWorld(); const w = A.W[A.G.cur]; w.ammo = 30; const hp0 = e.hp; for (let i = 0; i < 5; i++) { A.G.lastShotTime = -9; A.G.fireT = 0; A.shoot(); } return Math.round(hp0 - e.hp); });
  return r;
};
