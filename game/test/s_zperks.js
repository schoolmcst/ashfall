// zombies perks (bowl / joint / edible animations), punch stagger, gun damage vs zombies: SHOTS=dir node run.js s_zperks.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const shot = async n => { await p.screenshot({ path: path.join(out, n + '.png') }); };
  r.start = await p.evaluate(() => { const A = window.__A; A.ZL.net = 'solo'; A.openZLobby(); A.zombAct('z-start'); A.G.noRender = true; const s = document.getElementById('hcSplash'); if (s) s.remove();
    return { machines: A.ZP.machines.length, hp: [1, 5, 10, 15].map(r => Math.round(A.zombHp(r))), mul: (() => { A.Z.round = 1; const a = A.zombGunMul(false); A.Z.round = 10; const b = A.zombGunMul(false); A.Z.round = 0; return [a, +b.toFixed(2)]; })() }; });
  // buy three perks, one of each animation; pictures in the middle of each
  for (const [id, n] of [['quick', 'bowl'], ['revive', 'joint'], ['tank', 'edible']]) {
    await p.evaluate(id => { const A = window.__A, m = A.ZP.machines.find(m => m.p.id === id), s = m.p.at, f = [Math.round(Math.sin(s.q * Math.PI / 2)), Math.round(Math.cos(s.q * Math.PI / 2))];
      Object.assign(A.P, { x: s.x + f[0] * 2.2, z: s.z + f[1] * 2.2, y: s.y, yaw: Math.atan2(f[0], f[1]), pitch: -0.05 }); A.G.points = 5000; A.G.state = 'playing'; A.zpBuy(m.p); A.G.noRender = false; }, id);
    await p.waitForTimeout(n === 'edible' ? 900 : 1100); await shot('zp_' + n);
    await p.waitForTimeout(1300); await shot('zp_' + n + '_2');
    await p.evaluate(() => { window.__A.G.noRender = true; });
    await p.waitForTimeout(2500);
  }
  r.perks = await p.evaluate(() => { const A = window.__A; return { have: [...A.ZP.have], maxHp: A.G.maxHp, anim: !!A.ZP.anim, gunVisible: A.gunObjs[A.G.cur].visible }; });
  // a machine, from a little way back
  await p.evaluate(() => { const A = window.__A, s = A.ZP.machines.find(m => m.p.id === 'quick').p.at; Object.assign(A.P, { x: s.x + 3.2, z: s.z + 1.2, y: 0, pitch: -0.05 }); A.P.yaw = Math.atan2(-(s.x - A.P.x), -(s.z - A.P.z)); A.G.noRender = false; });
  await p.waitForTimeout(1500); await shot('zp_machine');
  // punch a zombie that is about to swing
  r.punch = await p.evaluate(async () => {
    const A = window.__A; A.G.noRender = true; Object.assign(A.P, { x: 0, z: 22, y: 0, yaw: 0, pitch: 0 }); A.G.health = 1e9; A.G.maxHp = 1e9;
    const e = A.makeZombie(0, 21, 0); e.atkT = 0.6; e.hitDone = false; A.Z.round = 1;
    const before = { atkT: e.atkT, hp: e.hp }; A.zombStagger(e, { x: 0, z: -1 }); A.damageEnemy(e, 40, false, null, false, 'player');
    return { before, after: { atkT: e.atkT, stunT: e.stunT, hp: Math.round(e.hp), z: +e.group.position.z.toFixed(2) } };
  });
  // the upgrader room
  await p.evaluate(() => { const A = window.__A; Object.assign(A.P, { x: -1.5, z: -21.5, y: 0, pitch: -0.08 }); A.P.yaw = Math.atan2(-(-6.9 - A.P.x), -(-27 - A.P.z)); A.G.noRender = false; });
  await p.waitForTimeout(1500); await shot('zp_upgrader');
  await p.evaluate(() => { const A = window.__A; Object.assign(A.P, { x: 3.5, z: 21, y: 0, yaw: 0, pitch: -0.25 }); });
  await p.waitForTimeout(1500); await shot('zp_arrows');
  return r;
};
