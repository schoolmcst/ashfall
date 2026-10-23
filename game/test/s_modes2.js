// BAGGED UP (kill confirmed), TURF WAR (domination), the killcam and the new scorestreaks: SHOTS=dir node run.js s_modes2.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {}, MAP = process.env.MAP || 'town';
  const shot = async (n, ms = 1200) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms); await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  const start = (mode, extra) => p.evaluate(([m, map, x]) => { const A = window.__A; const s = document.getElementById('hcSplash'); if (s) s.remove(); A.startMatch(m, Object.assign({ map, score: 500, time: 10, perTeam: 5, skill: 'veteran', custom: true }, x || {})); A.G.holdT = 0.05; A.G.loadT = 0.05; A.G.noRender = true; }, [mode, MAP, extra]);
  const sim = async (ms, fn) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { await p.waitForTimeout(250); await p.evaluate(() => { const A = window.__A; if (A.G.state === 'paused') A.G.state = 'playing'; }); if (fn) await p.evaluate(fn); } };
  const god = () => p.evaluate(() => { const A = window.__A; A.G.health = A.G.maxHp = 1e6; });

  // ---------------- mode menu
  await p.evaluate(() => { const A = window.__A; const s = document.getElementById('hcSplash'); if (s) s.remove(); });
  await p.evaluate(() => { const A = window.__A; A.actions && 0; });
  // ---------------- BAGGED UP
  await start('kc'); await p.waitForTimeout(2500); await god();
  r.kc = await p.evaluate(() => { const A = window.__A, M = A.M, o = {};
    o.modeOk = M.mode === 'kc' && !!M.kc;
    const red = A.enemies.find(e => e.team === 1), blue = A.enemies.find(e => e.team === 0);
    red.hp = 1; red.spawnProt = 0; blue.spawnProt = 0; A.G.holdT = 0; A.damageEnemy(red, 50, false, null, false, "player"); blue.hp = 1; A.damageEnemy(blue, 50, false, null, false, 'world');
    o.tags = M.kc.tags.map(t => t.team);
    return o; });
  // picture: a red bag and a blue bag in front of you
  await p.evaluate(() => { const A = window.__A, M = A.M; A.Z && 0; for (const e of A.enemies.slice()) { A.scene.remove(e.group); } A.enemies.length = 0; A.M.respawnQ.length = 0;
    const t = M.kc.tags; const sp = A.LAYOUT.spawn[0]; Object.assign(A.P, { x: sp.x, z: sp.z, y: sp.y || 0 }); A.P.yaw = 0; A.P.pitch = -0.28; A.G.state = 'playing';
    t[0].x = A.P.x - 0.9; t[0].z = A.P.z - 3.2; t[1].x = A.P.x + 1.0; t[1].z = A.P.z - 4.2; for (const q of t) { q.y = A.P.y; q.g.position.set(q.x, q.y, q.z); } });
  await shot('kc_bags');
  r.kcPick = await p.evaluate(() => { const A = window.__A, M = A.M, t = M.kc.tags, s0 = A.G.score; const red = t.find(q => q.team === 1), blue = t.find(q => q.team === 0);
    Object.assign(A.P, { x: red.x, z: red.z }); A.updateMatch(0.05); const a = { score: M.teamScore.slice(), left: t.length, pts: A.G.score - s0 };
    Object.assign(A.P, { x: blue.x, z: blue.z }); A.updateMatch(0.05); return Object.assign(a, { afterSave: M.teamScore.slice(), left2: t.length, pts2: A.G.score - s0 }); });
  // let the bots play it for a while (they should be picking bags up too)
  await p.evaluate(() => { const A = window.__A; A.M.respawnQ.length = 0; for (const en of A.M.entries) if (!en.isPlayer) A.M.respawnQ.push({ en, t: 0.1 }); });
  await sim(40000, () => { const A = window.__A; A.G.health = 1e6; A.P.x = 900; });
  r.kcSim = await p.evaluate(() => { const A = window.__A; return { score: A.M.teamScore, bagsOut: A.M.kc.tags.length, objs: A.M.entries.map(e => e.obj) }; });
  await p.evaluate(() => { const A = window.__A; const sp = A.LAYOUT.spawn[2] || A.LAYOUT.spawn[0]; Object.assign(A.P, { x: sp.x, z: sp.z, y: sp.y || 0 }); A.setScoreboard(true); });
  await shot('kc_board', 800); await p.evaluate(() => window.__A.setScoreboard(false));
  await p.evaluate(() => window.__A.actions('res-lobby'));

  // ---------------- TURF WAR
  await start('dom'); await p.waitForTimeout(2500); await god();
  r.dom = await p.evaluate(() => { const A = window.__A, D = A.M.dom; return { spots: D.pts.map(q => [q.n, +q.x.toFixed(1), +q.z.toFixed(1), q.y]) }; });
  for (let i = 0; i < 3; i++) {
    await p.evaluate(i => { const A = window.__A, q = A.M.dom.pts[i]; for (const e of A.enemies) if (Math.hypot(e.group.position.x - q.x, e.group.position.z - q.z) < 12) e.group.position.x += 30;
      Object.assign(A.P, { x: q.x + 4.5, z: q.z + 5.5, y: q.y }); A.P.yaw = Math.atan2(4.5, 5.5); A.P.pitch = -0.32; A.G.state = 'playing'; }, i);
    await shot('dom_' + 'abc'[i], 900);
  }
  // take A alone
  r.domCap = await p.evaluate(() => { const A = window.__A, D = A.M.dom, q = D.pts[0]; for (const e of A.enemies.slice()) A.scene.remove(e.group); A.enemies.length = 0; A.M.respawnQ.length = 0;
    Object.assign(A.P, { x: q.x, z: q.z, y: q.y }); const o = []; for (let i = 0; i < 90; i++) { A.updateMatch(0.1); if (i % 15 === 14) o.push([+q.prog.toFixed(2), q.own]); } return { steps: o, own: q.own, score: A.M.teamScore.slice() }; });
  await p.evaluate(() => { const A = window.__A, q = A.M.dom.pts[0]; Object.assign(A.P, { x: q.x + 3, z: q.z + 4.2 }); A.P.yaw = Math.atan2(3, 4.2); A.P.pitch = -0.35; });
  await shot('dom_taken', 900);
  await p.evaluate(() => { const A = window.__A; for (const en of A.M.entries) if (!en.isPlayer) A.M.respawnQ.push({ en, t: 0.1 }); });
  await sim(45000, () => { const A = window.__A; A.G.health = 1e6; A.P.x = 900; });
  r.domSim = await p.evaluate(() => { const A = window.__A; return { score: A.M.teamScore, own: A.M.dom.pts.map(q => q.own), caps: A.M.entries.map(e => e.obj) }; });
  await p.evaluate(() => { const A = window.__A; const sp = A.LAYOUT.spawn[1] || A.LAYOUT.spawn[0]; Object.assign(A.P, { x: sp.x, z: sp.z, y: sp.y || 0 }); A.P.pitch = 0; A.G.state = 'playing'; });
  await shot('dom_hud', 900);
  await p.evaluate(() => window.__A.actions('res-lobby'));

  // ---------------- killcam + the new streaks in TDM
  await start('tdm'); await p.waitForTimeout(2500);

  // an open spot: a spawn point and a direction with 16 m of clear ground in front (no walls)
  await p.evaluate(() => { window.__arena = A => { const rc = new THREE.Raycaster();
    for (const sp of A.LAYOUT.spawn) for (let k = 0; k < 16; k++) { const yaw = k * Math.PI / 8, d = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)); let ok = true;
      for (const h of [0.5, 1.3, 2.4]) for (const sx of [-5, 0, 5]) { const o = new THREE.Vector3(sp.x + Math.cos(yaw) * sx, (sp.y || 0) + h, sp.z - Math.sin(yaw) * sx); rc.set(o, d); rc.far = 18; if (rc.intersectObjects(A.wallMeshes, false).length) ok = false; }
      if (ok) return { x: sp.x, z: sp.z, y: sp.y || 0, yaw }; }
    return { x: A.LAYOUT.spawn[0].x, z: A.LAYOUT.spawn[0].z, y: 0, yaw: 0 }; }; });
  r.killcam = await p.evaluate(() => { const A = window.__A; A.S.deathCam = true; A.S.killcam = true; const k = A.enemies.find(e => e.team === 1); A.G.holdT = 0;
    const sp = window.__arena(A), fx = -Math.sin(sp.yaw), fz = -Math.cos(sp.yaw); Object.assign(A.P, { x: sp.x, z: sp.z, y: sp.y, yaw: sp.yaw }); A.P.yaw = sp.yaw; k.group.position.set(sp.x + fx * 13, sp.y, sp.z + fz * 13); k.speed = 0; k.cd = 99; k.group.rotation.y = Math.atan2(-fx, -fz) + Math.PI; k.group.updateMatrixWorld(true);
    for (const e of A.enemies) if (e !== k) e.group.position.x += 200;
    A.G.killer = k; A.G.health = 0; A.die(); return { state: A.G.state, kc: A.G.dc && A.G.dc.kcT }; });
  await p.evaluate(() => { const A = window.__A; for (let i = 0; i < 12; i++) A.updateDeathCam(0.1); A.G.noRender = false; });
  await p.waitForTimeout(400); await p.screenshot({ path: path.join(out, 'killcam.png'), timeout: 120000 });
  r.killcamAfter = await p.evaluate(() => { const A = window.__A; A.G.noRender = true; for (let i = 0; i < 14; i++) if (A.G.state === 'deathcam') A.updateDeathCam(0.1); return A.G.state; });
  await p.evaluate(() => { const A = window.__A; A.respawnPlayer(); A.G.state = 'playing'; });
  await p.waitForTimeout(2500); await god();

  // streak menu
  await p.evaluate(() => { const A = window.__A; A.openStreaks('menu'); });
  await shot('stk_menu', 600);
  await p.evaluate(() => { const A = window.__A; A.showScreen ? A.showScreen(null) : 0; A.G.state = 'playing'; });

  const streak = async (id, setup, ms, shots, lookShip) => {
    await p.evaluate(([id, setup]) => { const A = window.__A; A.G.health = A.G.maxHp = 1e6; A.G.state = 'playing'; if (setup) (new Function('A', setup))(A); A.STK.useCd = 0; A.STK.cd = {}; A.STK.have = [id]; A.stkUse(); }, [id, setup]);
    const R = {};
    for (const [n, t] of shots) { await p.evaluate(() => { window.__A.G.noRender = false; }); for (let q = 0; q < t; q += 200) { await p.evaluate(ls => { const A = window.__A; if (A.G.state === 'paused') A.G.state = 'playing'; const S = A.S2.ship; if (ls && S) { const g = S.g.position, dx = g.x - A.P.x, dz = g.z - A.P.z; A.P.yaw = Math.atan2(-dx, -dz); A.P.pitch = Math.atan2(g.y - A.P.y - 1.7, Math.hypot(dx, dz)); } }, !!lookShip); await p.waitForTimeout(200); } await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); }
    await p.evaluate(() => { window.__A.G.noRender = true; });
    const t0 = Date.now(); while (Date.now() - t0 < ms) { await p.evaluate(() => { const A = window.__A; if (A.G.state === 'paused') A.G.state = 'playing'; A.G.health = 1e6; }); await p.waitForTimeout(200); } return R;
  };
  // a red squad standing in the open in front of you
  const squad = `const sp = window.__arena(A); if (A.G.state !== 'playing') A.respawnPlayer(); A.G.state = 'playing'; Object.assign(A.P, { x: sp.x, z: sp.z, y: sp.y }); A.P.yaw = sp.yaw; A.P.pitch = -0.08; window.__k0 = A.M.me.kills;
    const fx = -Math.sin(sp.yaw), fz = -Math.cos(sp.yaw), rx = Math.cos(sp.yaw), rz = -Math.sin(sp.yaw);
    const reds = A.enemies.filter(e => e.team === 1); reds.forEach((e, i) => { const f = 13 + (i % 2) * 2, s = -4 + i * 2; e.group.position.set(A.P.x + fx * f + rx * s, sp.y, A.P.z + fz * f + rz * s); e.speed = 0; e.cd = 99; e.hp = e.maxHp; e.spawnProt = 0; });
    A.M.respawnQ.length = 0;
    for (const e of A.enemies) if (e.team === 0) e.group.position.x += 300;`;
  await streak('sentry', squad, 6000, [['stk_turret', 1600]]);
  r.sentry = await p.evaluate(() => { const A = window.__A; return { turrets: A.S2.turrets.length, kills: A.M.me.kills - window.__k0 }; });
  await streak('drone', squad, 7000, [['stk_drone_up', 900], ['stk_drone_fly', 1100]]);
  r.drone = await p.evaluate(() => { const A = window.__A; return { left: A.S2.drones.length, kills: A.M.me.kills - window.__k0 }; });
  await streak('cuav', squad + 'A.P.pitch = 0.3;', 1000, [['stk_smoke', 3200]]);
  r.cuav = await p.evaluate(() => { const A = window.__A; const red = A.enemies.find(e => e.team === 1); return { jamT: +A.STK.jamT.toFixed(1), hazy: red ? red.jamAcc !== undefined : null }; });
  await streak('gunship', squad, 14000, [['stk_gunship', 4000]], true);
  r.gunship = await p.evaluate(() => { const A = window.__A; return { up: !!A.S2.ship, kills: A.M.me.kills - window.__k0 }; });
  await p.evaluate(() => { const A = window.__A; A.stkHud(true); });
  await p.evaluate(() => window.__A.actions('res-lobby'));
  // mode menus
  await p.evaluate(() => { const A = window.__A; A.LOBBY.mode = 'kc'; A.openModes(); });
  await shot('modes_off', 600);
  await p.evaluate(() => { const A = window.__A; A.LOBBY.mode = 'okc'; A.openModes(); });
  await shot('modes_on', 600);
  return r;
};
