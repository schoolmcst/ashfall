const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS;
  await p.evaluate(() => { const A = window.__A; A.ZL.net = 'solo'; A.ZL.story = false; A.ZL.map = 'hightide'; A.openZLobby(); const s = document.getElementById('hcSplash'); if (s) s.remove(); A.zombAct('z-start'); A.G.health = A.G.maxHp = 1e9; });
  await p.waitForTimeout(7000);
  await p.evaluate(() => { const A = window.__A; A.Z.toSpawn = 0; A.Z.breakT = 999; for (const e of A.enemies.slice()) if (e.zombie) { e.hp = 1; A.damageEnemy(e, 100, false, 'player'); }
    A.zwwGive('hightide'); Object.assign(A.P, { x: 0, z: -3, y: 0 }); A.P.yaw = 0; A.P.pitch = 0.02; A.G.state = 'playing';
    for (let i = 0; i < 5; i++) { const e = A.makeZombie(-3 + i * 1.5, -11 - (i % 2) * 2, 0); e.speed = 0; e.atkCd = 99; e.hp = e.maxHp = 1e6; } A.G.noRender = true; A.G.fireT = 0; A.shoot(false); });
  await p.waitForTimeout(3000); await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(out, 'disco2.png') });
  await p.evaluate(() => { const A = window.__A; Object.assign(A.P, { x: -9.5, z: -8, y: 0 }); A.P.yaw = Math.atan2(-(-18 + 9.5), -(-15 + 8)); A.P.pitch = -0.05; A.zsApplyPower ? 0 : 0; window.__A.TIDE.on = true; });
  await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, 'club.png') });
  await p.evaluate(() => { const A = window.__A; Object.assign(A.P, { x: 6, z: 39, y: 0 }); A.P.yaw = Math.atan2(-(-8 - 6), -(31 - 39)); A.P.pitch = -0.1; });
  await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, 'lido.png') });
};
