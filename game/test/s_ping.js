// PINGS: enemy / loot / go here, bots answer, same spot again removes it, bot squadmates ping, online pack; a picture
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.startMatch('br', { map: 'random', squad: 4 }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; });
  await p.waitForTimeout(2500);
  const look = (o) => p.evaluate(o => { const A = window.__A; A.P.x = o.px; A.P.z = o.pz; A.P.y = 0; const dx = o.x - o.px, dz = o.z - o.pz, d = Math.hypot(dx, dz); A.P.yaw = Math.atan2(-dx, -dz); A.P.pitch = Math.atan2((o.y || 1.2) - 1.7, d); A.camera.position.set(A.P.x, 1.7, A.P.z); A.camera.rotation.set(A.P.pitch, A.P.yaw, 0, 'YXZ'); A.camera.updateMatrixWorld(); }, o);
  // an enemy (team 1) placed 15 m ahead on the road
  await p.evaluate(() => { const A = window.__A; const e = A.enemies.find(x => x.team === 1); e.group.position.set(0, 0, 5); e.dbg = 1; for (const m of A.enemies.filter(x => x.team === 0)) m.group.position.set(3, 0, 22); });
  await look({ px: 0, pz: 20, x: 0, z: 5, y: 1.2 });
  r.enemy = await p.evaluate(() => { const A = window.__A; A.PING.cd = 0; A.pingDo(); const pg = A.PING.list[A.PING.list.length - 1]; const mates = A.enemies.filter(x => x.team === 0); return { kind: pg && pg.kind, onE: !!(pg && pg.e && pg.e.dbg), matesLook: mates.filter(m => m.lkp && Math.abs(m.lkp.z - 5) < 1).length, marker: A.markerList().filter(m => m.ping).map(m => m.t).join('|') }; });
  // the ground 12 m ahead, off to the side: GO HERE; bots head there
  await look({ px: 0, pz: 20, x: 8, z: 10, y: 0 });
  r.go = await p.evaluate(() => { const A = window.__A; A.PING.cd = 0; A.pingDo(); const pg = A.PING.mine; const mates = A.enemies.filter(x => x.team === 0); return { kind: pg && pg.kind, x: pg && Math.round(pg.x), z: pg && Math.round(pg.z), matesGo: mates.filter(m => m.goal && Math.hypot(m.goal.x - pg.x, m.goal.z - pg.z) < 4).length, pack: A.pingPack() }; });
  await p.waitForTimeout(1200); await p.screenshot({ path: path.join(out, 'ping.png'), timeout: 120000 });
  // the same spot again takes it off
  r.again = await p.evaluate(() => { const A = window.__A; A.PING.cd = 0; A.pingDo(); return { mine: !!A.PING.mine, go: A.PING.list.filter(x => x.kind === 'go').length }; });
  // a loot crate
  const c = await p.evaluate(() => { const A = window.__A, cr = A.BR_API.BR.crates.filter(c => !c.open).sort((a, b) => Math.hypot(a.x, a.z - 20) - Math.hypot(b.x, b.z - 20))[0]; return { x: cr.x, z: cr.z }; });
  await look({ px: c.x + 6, pz: c.z + 2, x: c.x, z: c.z, y: 0.4 });
  r.loot = await p.evaluate(() => { const A = window.__A; A.PING.cd = 0; A.pingDo(); const pg = A.PING.list[A.PING.list.length - 1]; return { kind: pg && pg.kind }; });
  // a bot squadmate spots an enemy: it pings it
  r.botPing = await p.evaluate(() => { const A = window.__A; const mate = A.enemies.find(x => x.team === 0), foe = A.enemies.find(x => x.team === 2); const n0 = A.PING.list.length; A.PING.botCd.clear(); window.__A.botCalloutTest ? 0 : 0; try { A.pingAdd && 0; } catch (e) {} return { n0 }; });
  // the online side: a teammate's ping arrives
  r.remote = await p.evaluate(() => { const A = window.__A; const M = A.M; const save = M.def; M.def = Object.assign({}, M.def, { teams: true }); const n0 = A.PING.list.length; A.pingRemote({ entry: { name: 'BUDDY', team: 0 }, peer: 'p1' }, [3, 3, 10, 1, -10]); A.pingRemote({ entry: { name: 'BUDDY', team: 0 }, peer: 'p1' }, [3, 3, 10, 1, -10]); A.pingRemote({ entry: { name: 'FOE', team: 1 }, peer: 'p2' }, [1, 3, 5, 1, 5]); const n1 = A.PING.list.length; M.def = save; return { added: n1 - n0, last: A.PING.list[A.PING.list.length - 1].who }; });
  return r;
};
