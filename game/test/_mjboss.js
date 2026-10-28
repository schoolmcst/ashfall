const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS;
  await p.evaluate(() => { const A = window.__A; A.ZL.net = 'solo'; A.ZL.map = 'maryjane'; A.openZLobby(); const s = document.getElementById('hcSplash'); if (s) s.remove(); A.zombAct('z-start'); A.G.health = A.G.maxHp = 1e9; });
  await p.waitForTimeout(7000);
  const r = await p.evaluate(() => { const A = window.__A; A.Z.toSpawn = 0; for (const e of A.enemies.slice()) if (e.zombie) { e.hp = 1; A.damageEnemy(e, 100, false, 'player'); }
    Object.assign(A.P, { x: 0, z: 33, y: 0 }); A.G.state = 'playing'; A.zsBoss(); const b = A.ZS.boss; if (!b) return null; b.group.position.set(0, 0, 29); b.speed = 0; b.atkCd = 99;
    A.P.yaw = 0; A.P.pitch = 0.35; return { hp: b.hp, hat: !!b.rig.head.children.length }; });
  for (let i = 0; i < 3; i++) await p.evaluate(() => { const A = window.__A; const b = A.ZS.boss; if (b) { b.group.position.set(0, 0, 29.5); b.speed = 0; } A.G.state = 'playing'; });
  await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, 'mj_captain.png') });
  r.fx = await p.evaluate(() => JSON.stringify(window.__A.ZPU.fx) + ' NOW=' + window.__A.NOW + ' pu=' + document.getElementById('zPu').innerHTML.slice(0,300));
  return r;
};
