// zombies specials: strays (dog rounds), fiends, bloaters, barricaded windows - checks and pictures: SHOTS=dir node run.js s_zspecial.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const shot = async n => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  const wait = async (fn, n = 30) => { for (let i = 0; i < n && !(await p.evaluate(fn)); i++) await p.waitForTimeout(1000); };
  const clear = () => p.evaluate(() => { const A = window.__A; for (const e of A.enemies.slice()) if (e.zombie) { e.hp = 1; A.damageEnemy(e, 100, false, null, false, 'world'); } });
  await p.evaluate(() => { const A = window.__A; A.ZL.net = 'solo'; A.ZL.map = 'works'; A.ZL.story = false; A.openZLobby(); const s = document.getElementById('hcSplash'); if (s) s.remove(); A.zombAct('z-start'); A.G.health = 1e9; A.G.maxHp = 1e9; A.G.noRender = true; });
  await p.waitForTimeout(6000);
  await p.evaluate(() => { const A = window.__A; for (const d of A.ZDOORS) A.zdOpen(d.id, true); A.Z.toSpawn = 0; A.Z.breakT = 1e9; A.Z.active = false; });
  await clear();
  // ---- a stray up close (standing still), then a pack in the fog
  await p.evaluate(() => { const A = window.__A; Object.assign(A.P, { x: 0, z: 30, y: 0 }); A.P.yaw = 0; A.P.pitch = -0.25; A.G.state = 'playing'; const d = A.makeDog(0.3, 27.4, 0); d.speed = 0; d.atkCd = 99; d.group.rotation.y = 0.5; window.__d = d; });
  await p.evaluate(() => { const A = window.__A, d = window.__d; for (let i = 0; i < 9; i++) A.zombThink ? 0 : 0; });
  await shot('sp_stray_close');
  await clear();
  r.strays = await p.evaluate(() => { const A = window.__A; A.Z.round = 4; A.Z.active = false; A.Z.breakT = 0.01; return 1; });
  await wait(() => window.__A.Z.round === 5 && window.__A.enemies.filter(e => e.zombie).length >= 4, 40);
  r.strays = await p.evaluate(() => { const A = window.__A, z = A.enemies.filter(e => e.zombie); return { round: A.Z.round, dogRound: A.Z.dogRound, count: z.length, allDogs: z.every(e => e.dog), toSpawn: A.Z.toSpawn, banner: document.getElementById('banner') ? document.getElementById('banner').textContent : '' }; });
  await p.evaluate(() => { const A = window.__A; for (const e of A.enemies) if (e.dog) { const a = Math.random() * 6.28; e.group.position.set(A.P.x + Math.cos(a) * (4 + Math.random() * 3), 0, A.P.z - 5 - Math.random() * 4); } A.P.pitch = -0.12; });
  await shot('sp_stray_pack');
  // a bite does 20
  r.bite = await p.evaluate(() => { const A = window.__A; A.G.maxHp = 100; A.G.health = 100; const d = A.enemies.find(e => e.dog); return d ? d.dmg : null; });
  await p.evaluate(() => { const A = window.__A; A.G.health = 1e9; A.G.maxHp = 1e9; A.Z.toSpawn = 0; });
  await clear(); await p.waitForTimeout(2500);
  r.strayEnd = await p.evaluate(() => { const A = window.__A; return { reupDropped: [...A.ZPU.list.values()].some(q => q.type === 'reup'), dogRound: A.Z.dogRound }; });
  await p.evaluate(() => { const A = window.__A; for (const id of [...A.ZPU.list.keys()]) A.zpuRemove(id); A.Z.breakT = 1e9; A.Z.active = false; });
  // ---- a fiend and a bloater
  await p.evaluate(() => { const A = window.__A; Object.assign(A.P, { x: 20, z: 12, y: 0 }); A.P.yaw = Math.PI / 2 + 0.3; A.P.pitch = -0.2; const f = A.makeZombie(16.5, 12.6, 0); A.zspMake(f, 'fiend'); f.speed = 0; f.atkCd = 99; const b = A.makeZombie(15.8, 10.2, 0); A.zspMake(b, 'bloat'); b.speed = 0; b.atkCd = 99; window.__b = b; });
  await p.evaluate(() => { const A = window.__A; A.Z.active = true; });
  await shot('sp_fiend_bloater');
  r.mix = await p.evaluate(() => { const A = window.__A, n = { fiend: 0, bloat: 0, plain: 0 }; A.Z.round = 9; for (let i = 0; i < 300; i++) { const e = A.makeZombie(0, -90, 0); A.zspRoll(e); n[e.crawl ? 'fiend' : e.bloat ? 'bloat' : 'plain']++; A.enemies.splice(A.enemies.indexOf(e), 1); A.scene.remove(e.group); } return n; });
  await p.evaluate(() => { const A = window.__A, b = window.__b; b.hp = 1; A.damageEnemy(b, 100, false, null, false, 'player'); });
  await p.waitForTimeout(400);
  await shot('sp_bloater_cloud');
  r.cloud = await p.evaluate(() => ({ clouds: window.__A.ZSP.clouds.length }));
  await clear();
  // ---- windows: full boards, then a zombie tearing in
  r.windows = await p.evaluate(() => window.__A.ZSP.wins.map(W => [W.w.x, W.w.z, W.n]));
  await p.evaluate(() => { const A = window.__A, W = A.ZSP.wins[0]; Object.assign(A.P, { x: W.ins.x + W.dx * 2.6, z: W.ins.z + W.dz * 2.6 + 0.6, y: 0 }); A.P.yaw = Math.atan2(W.dx, W.dz) + 0.15; A.P.pitch = -0.05; A.G.state = 'playing'; });
  await shot('sp_window_full');
  await p.evaluate(() => { const A = window.__A, W = A.ZSP.wins[0]; const e = A.zwinSpawn(W); window.__w = e; A.Z.active = true; });
  await wait(() => window.__A.ZSP.wins[0].n <= 2, 20);
  await shot('sp_window_tearing');
  r.tear = await p.evaluate(() => ({ boards: window.__A.ZSP.wins[0].n, atWindow: !!window.__w.win }));
  await wait(() => !window.__w.win, 25);
  r.climbed = await p.evaluate(() => { const A = window.__A, e = window.__w, W = A.ZSP.wins[0]; return { inside: Math.hypot(e.group.position.x - W.ins.x, e.group.position.z - W.ins.z) < 2.5, win: !!e.win }; });
  await clear();
  // repair: hold USE at the window
  r.repair = await p.evaluate(() => { const A = window.__A, W = A.ZSP.wins[0]; Object.assign(A.P, { x: W.ins.x, z: W.ins.z, y: 0 }); const p0 = A.G.points, n0 = W.n; const near = A.zwinNear(); let t = ''; for (let i = 0; i < 40; i++) t = A.zwinPrompt(near, true, 0.1); return { before: n0, after: W.n, points: A.G.points - p0, prompt: t }; });
  await p.evaluate(() => { const A = window.__A; for (const W of A.ZSP.wins) A.zwinSet ? 0 : 0; A.ZSP.wins.forEach(W => { W.n = 1; W.boards.forEach((b, k) => { b.visible = k < 1; }); }); A.zwFixAll(); });
  r.fixer = await p.evaluate(() => window.__A.ZSP.wins.every(W => W.n === 5));
  return r;
};
