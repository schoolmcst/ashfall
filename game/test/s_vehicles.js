// LAST TOKE vehicles: get in, drive (W), steer, crash, run over a bot, get out, blow one up; online pack; pictures
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.startMatch('br', { map: 'random' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; });
  await p.waitForTimeout(3000);
  r.s0 = await p.evaluate(() => { const A = window.__A; A.G.health = A.G.maxHp = 1e9; return { map: A.curMap, n: A.VH.list.length, types: A.VH.list.map(v => v.type).join(','), pos: A.VH.list.slice(0, 3).map(v => [Math.round(v.x), Math.round(v.z)]) }; });
  // stand next to the cart in the village and look at it
  await p.evaluate(() => { const A = window.__A, v = A.VH.list[0]; A.P.x = v.x + 1.6; A.P.z = v.z + 1.6; A.P.yaw = Math.atan2(1.6, 1.6); A.P.pitch = -0.25; for (const e of A.enemies) if (e.entry) e.group.position.x += 0; });
  await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, 'veh_cart.png'), timeout: 120000 });
  r.prompt = await p.evaluate(() => window.__A.G.interactTxt);
  // get in and drive forward
  r.enter = await p.evaluate(() => { const A = window.__A, v = A.VH.list[0]; A.P.x = v.x + 1; A.P.z = v.z; A.vhEnter(v); A.P.yaw = v.yaw; A.P.pitch = -0.05; A.keys[A.S.keys && A.S.keys.fwd || 'KeyW'] = true; return { in: !!A.VH.me, x0: +v.x.toFixed(1), z0: +v.z.toFixed(1) }; });
  await p.waitForTimeout(6000);
  r.drive = await p.evaluate(() => { const A = window.__A, v = A.VH.me; return v ? { spd: +v.spd.toFixed(1), x: +v.x.toFixed(1), z: +v.z.toFixed(1), meOnIt: Math.hypot(A.P.x - v.x, A.P.z - v.z) < 0.1, hp: Math.round(v.hp), firing: false, hud: A.M.br ? 1 : 0 } : { out: true }; });
  await p.screenshot({ path: path.join(out, 'veh_drive.png'), timeout: 120000 });
  // steer (D) for a bit
  await p.evaluate(() => { const A = window.__A; A.keys.KeyD = true; }); await p.waitForTimeout(2500);
  r.steer = await p.evaluate(() => { const A = window.__A, v = A.VH.me; A.keys.KeyD = false; return v ? { yaw: +v.yaw.toFixed(2), spd: +v.spd.toFixed(1) } : null; });
  // run over a bot: put one right in front at speed
  r.ram = await p.evaluate(() => { const A = window.__A, v = A.VH.me; const e = A.enemies.find(e => e.entry && e.entry.alive !== false); if (!v || !e) return null; v.spd = 12; e.spawnProt = 0; const fx = -Math.sin(v.yaw), fz = -Math.cos(v.yaw); e.group.position.set(v.x + fx * 1.2, v.y, v.z + fz * 1.2); e.hp0 = e.hp; A.vhPlayer(0.016); return { hpBefore: e.hp0, hpAfter: e.hp, alive: A.enemies.includes(e) }; });
  // the online pack while driving
  r.pack = await p.evaluate(() => window.__A.vhPack());
  // a crash: drive at a wall (the lighthouse) fast
  r.crash = await p.evaluate(() => { const A = window.__A, v = A.VH.me; if (!v) return null; v.x = 48; v.z = -42; v.yaw = 0; v.spd = 12; const hp0 = v.hp; for (let i = 0; i < 30; i++) A.vhPlayer(0.03); return { hp0, hp: Math.round(v.hp), spd: +v.spd.toFixed(1), z: +v.z.toFixed(1) }; });
  // get out
  r.exit = await p.evaluate(() => { const A = window.__A; A.keys.KeyW = false; const v = A.VH.me; A.vhExit(); return { in: !!A.VH.me, dist: v ? +Math.hypot(A.P.x - v.x, A.P.z - v.z).toFixed(1) : -1, gun: A.gunObjs[A.G.cur].visible }; });
  // a grenade next to the bike blows it up
  r.boom = await p.evaluate(() => { const A = window.__A, v = A.VH.list[1]; A.explode({ x: v.x + 0.5, y: 0.5, z: v.z }, 'grenade', 8, 1, 'player'); return { hp: Math.round(v.hp), dead: v.dead }; });
  await p.waitForTimeout(600); r.boom2 = await p.evaluate(() => { const A = window.__A, v = A.VH.list[1]; A.vhDamage(v, 9999); return { dead: v.dead, inScene: !!v.g.parent }; });
  // the bike: get in, picture from the seat
  await p.evaluate(() => { const A = window.__A, v = A.VH.list[3]; A.P.x = v.x; A.P.z = v.z; A.vhEnter(v); A.P.yaw = v.yaw; A.P.pitch = -0.15; A.keys.KeyW = true; });
  await p.waitForTimeout(3500); await p.screenshot({ path: path.join(out, 'veh_bike.png'), timeout: 120000 });
  r.bike = await p.evaluate(() => { const A = window.__A, v = A.VH.me; A.keys.KeyW = false; return v ? { type: v.type, spd: +v.spd.toFixed(1) } : null; });
  // a remote driver takes the cart in the pack
  r.remote = await p.evaluate(() => { const A = window.__A, v = A.VH.list[2]; A.vhRemote({ entry: { name: 'zz' } }, [2, v.x + 5, v.z, 1, 8, 300]); return { driver: !!v.net, nx: +(v.nx - v.x).toFixed(1), hp: v.hp }; });
  return r;
};
