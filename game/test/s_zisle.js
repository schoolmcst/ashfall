// MAUI WOWIE (zombies map 4): zones, reachability of everything, launch pads, the whole story (pictures): SHOTS=dir node run.js s_zworks.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const shot = async n => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  const look = async (n, x, z, y, tx, tz, ty = 0.5) => { await p.evaluate(({ x, z, y, tx, tz, ty }) => { const A = window.__A; Object.assign(A.P, { x, z, y }); A.P.yaw = Math.atan2(-(tx - x), -(tz - z)); A.P.pitch = Math.atan2(ty - (y + 1.7), Math.hypot(tx - x, tz - z)); A.G.state = 'playing'; }, { x, z, y, tx, tz, ty }); await shot(n); };
  const use = async (x, z, y = 0) => p.evaluate(({ x, z, y }) => { const A = window.__A; Object.assign(A.P, { x, z, y }); A.G.state = 'playing'; return A.zsPrompt(true); }, { x, z, y });
  const wait = async (fn, n = 30) => { for (let i = 0; i < n && !(await p.evaluate(fn)); i++) await p.waitForTimeout(1000); };
  await p.evaluate(() => { const A = window.__A; A.ZL.net = 'solo'; A.ZL.map = 'mauiwowie'; A.openZLobby(); const s = document.getElementById('hcSplash'); if (s) s.remove(); });
  await p.waitForTimeout(500); await p.screenshot({ path: path.join(out, 'is_lobby.png'), timeout: 120000 });
  r.lobby = await p.evaluate(() => document.getElementById('lobSel').textContent.slice(0, 400));
  await p.evaluate(() => { const A = window.__A; A.zombAct('z-start'); A.G.health = 1e9; A.G.maxHp = 1e9; A.G.noRender = false; });
  await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, 'is_intro.png'), timeout: 120000 });
  await p.waitForTimeout(5000);
  r.start = await p.evaluate(() => { const A = window.__A; return { map: A.curMap, doors: A.ZDOORS.map(d => d.name), items: A.ZS.objs.length, tapes: A.ZS.tapes.length, title: A.ZS_TEXT.title, perks: A.ZPERKS.map(p => [p.id, p.at.x, p.at.z]), crates: [A.Z.crate && A.Z.crate.position.toArray().map(v => +v.toFixed(1)), A.Z.ammo && A.Z.ammo.position.toArray().map(v => +v.toFixed(1))], P: [A.P.x, A.P.z] }; });
  // zones: what the start reaches with every door shut, then with all open
  const reach = async () => p.evaluate(() => { const A = window.__A; const F = A.flowField(0, 31, 0); const ok = (x, z, y = 0) => { for (const [dx, dz] of [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = A.nodeOf(x + dx, z + dz, y); if (n >= 0 && F && F[n] >= 0) return 1; } return 0; };
    const pts = { beach: [0, 31], house: [0, 2], fields: [-27.5, 10], sheds: [24, 9], curing: [24, -1], dock: [38, 8], north: [0, -20], light: [0, -31], lab: [-32, -30], mast: [34, -24] };
    const res = {}; for (const k in pts) res[k] = ok(pts[k][0], pts[k][1], pts[k][2] || 0);
    const all = []; for (const it of A.ZS_ITEMS) all.push([it.id, it.at]); A.ZS_TAPES.forEach((t, i) => all.push(['tape' + (i + 1), t.at])); for (const pk of A.ZPERKS) all.push(['perk:' + pk.id, { x: pk.at.x + [0, 1.2, 0, -1.2][pk.at.q] , z: pk.at.z + [1.2, 0, -1.2, 0][pk.at.q], y: pk.at.y }]);
    all.push(['panel', { x: A.ZS_FUSEBOX.x + 1, z: A.ZS_FUSEBOX.z, y: 0 }], ['vat', { x: A.ZS_COOK.x, z: A.ZS_COOK.z + 1.2, y: 0 }], ['upgrader', { x: A.ZU_SPOT.x, z: A.ZU_SPOT.z + 1.6, y: 0 }]);
    for (const pd of A.ZMAPCFG.mauiwowie.pads) all.push(['pad:' + pd.name, pd]);
    const bad = all.filter(([, q]) => !ok(q.x, q.z, q.y || 0)).map(a => a[0]);
    return { res, bad };
  });
  r.closed = await reach();
  for (let i = 0; i < 6; i++) { await p.evaluate(i => { const A = window.__A; A.zdOpen(i, true); }, i); r['door' + i] = (await reach()).res; }
  r.open = await reach();
  await p.evaluate(() => { const A = window.__A; A.Z.toSpawn = 0; A.Z.breakT = 999; for (const e of A.enemies.slice()) if (e.zombie) { e.hp = 1; A.damageEnemy(e, 100, false, 'player'); } });
  await shot('is_hud');
  // chapter 1: valves and the pressure panel
  const I = await p.evaluate(() => Object.fromEntries(window.__A.ZS_ITEMS.map(it => [it.id, it.at])));
  await look('is_valve', I.v1.x + 1.8, I.v1.z + 1.6, 0, I.v1.x, I.v1.z, 0.05);
  r.padOff = await p.evaluate(() => { const A = window.__A; return A.ZM.powered; });
  for (const f of ['v1', 'v2', 'v3']) await use(I[f].x + 0.4, I[f].z);
  r.panel = await use(-5.7, 1.5); r.powered = await p.evaluate(() => window.__A.ZM.powered);
  await look('is_panel', -4.2, 3.5, 0, -6.6, 1.5, 1.4);
  // launch pad: dock to the garden
  await p.evaluate(() => { const A = window.__A; Object.assign(A.P, { x: 8, z: 29, y: 0 }); A.P.onGround = true; A.G.state = 'playing'; });
  await wait(() => !!window.__A.ZM.fly, 8);
  r.fly0 = await p.evaluate(() => { const f = window.__A.ZM.fly; return f && { to: f.name }; });
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(500); await p.screenshot({ path: path.join(out, 'is_flight.png'), timeout: 120000 });
  await wait(() => !window.__A.ZM.fly, 40);
  r.landed = await p.evaluate(() => { const A = window.__A; return [+A.P.x.toFixed(1), +A.P.z.toFixed(1), +A.P.y.toFixed(1)]; });
  await p.evaluate(() => { window.__A.G.noRender = true; });
  await look('is_pad', -11, -16, 0, -10, -20, 0.3);
  // chapter 2..3
  await look('is_key', I.card.x + 2, I.card.z + 2.2, 0, I.card.x, I.card.z, 0.1);
  await use(I.card.x + 0.4, I.card.z);
  await look('is_patch', I.st1.x + 2.2, I.st1.z + 2.4, 0, I.st1.x, I.st1.z, 0.6);
  for (const s of ['st1', 'st2', 'st3']) await use(I[s].x + 0.5, I[s].z);
  r.ch3 = await p.evaluate(() => window.__A.zsChapterNow());
  // chapter 4: Harold
  await wait(() => !!window.__A.ZS.boss, 30);
  r.boss = await p.evaluate(() => { const b = window.__A.ZS.boss; return b && { hp: Math.round(b.hp), scale: b.group.scale.x, x: +b.group.position.x.toFixed(1), z: +b.group.position.z.toFixed(1) }; });
  if (r.boss) {
    await p.evaluate(() => { const b = window.__A.ZS.boss; b.speed = 0; b.atkCd = 99; });
    await look('is_boss', r.boss.x + 3.5, r.boss.z + 3, 0, r.boss.x, r.boss.z, 1.6);
    await p.evaluate(() => { const A = window.__A; A.ZS.boss.hp = 50; A.damageEnemy(A.ZS.boss, 200, true, 'player'); });
    await wait(() => !!window.__A.ZS.bloodItem, 15);
    const q = await p.evaluate(() => window.__A.ZS.bloodItem && window.__A.ZS.bloodItem.at);
    if (q) { await look('is_book', q.x + 1.5, q.z + 1.4, 0, q.x, q.z, 0.05); await use(q.x + 0.3, q.z); }
  }
  // chapter 5: the formula, then flood the lines
  await look('is_seeds', I.jar.x + 2, I.jar.z + 2, 0, I.jar.x, I.jar.z, 0.4);
  await use(I.jar.x + 0.3, I.jar.z + 0.6);
  r.ch5 = await p.evaluate(() => ({ chapter: window.__A.zsChapterNow(), flags: [...window.__A.ZS.flags] }));
  r.cookPrompt = await p.evaluate(() => { const A = window.__A; Object.assign(A.P, { x: 11, z: -19, y: 0 }); return A.zsPrompt(false); });
  await use(11, -19); await p.evaluate(() => { window.__A.ZS.cookT = 30; });
  await look('is_cook', 14, -15, 0, 10, -22, 1.5);
  await p.evaluate(() => { const A = window.__A; A.ZS.cookT = 59.9; Object.assign(A.P, { x: 12, z: -19, y: 0 }); });
  await wait(() => window.__A.ZS.done, 20);
  r.end = await p.evaluate(() => { const A = window.__A; return { done: A.ZS.done, saved: localStorage.getItem('ashfall.zstory.mauiwowie'), hospital: localStorage.getItem('ashfall.zstory'), hud: document.getElementById('zQuest').textContent }; });
  // a tour: pictures of each part with everything open
  for (const [n, v] of Object.entries({ is_t_beach: [-4, 0, 26, 6, 2, 37], is_t_court: [-9, 0, 22, 3, 2, 4], is_t_house: [4, 0, 6, -6, 1.5, -2], is_t_fields: [-16, 0, 16, -36, 1.5, 4], is_t_sheds: [16, 0, 20, 30, 2, 10], is_t_curing: [19, 0, -1, 30, 2, -2], is_t_dock: [36, 0, 23, 38, -8, 1], is_t_north: [-6, 0, -12, 4, 8, -30], is_t_light: [2.5, 0, -28.5, -2.6, 1.3, -31], is_t_lab: [-28, 0, -26, -35, 1.2, -33] }))
    await look(n, v[0], v[2], v[1], v[3], v[5], v[4]);
  r.vape = await p.evaluate(() => { const A = window.__A; const ok = A.zwwGive('mauiwowie'); const w = A.W[A.G.cur]; Object.assign(A.P, { x: 0, z: -14, y: 0 }); A.P.yaw = 0; A.P.pitch = -0.05; A.G.state = 'playing'; window.__c = []; for (let i = 0; i < 5; i++) { const e = A.makeZombie(-1 + i * 0.6, -19 - i * 0.8, 0); e.speed = 0; e.atkCd = 99; window.__c.push(e); } A.G.fireT = 0; A.shoot(false); return { ok, name: w.name }; });
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(250); await p.screenshot({ path: path.join(out, 'is_vape.png'), timeout: 120000 });
  for (let i = 0; i < 8; i++) await p.waitForTimeout(1000);
  r.vape.left = await p.evaluate(() => window.__c.filter(e => window.__A.enemies.includes(e)).length);
  await p.evaluate(() => { const A = window.__A; A.openZLobby(); });
  await p.waitForTimeout(400); await p.screenshot({ path: path.join(out, 'is_lobby_after.png'), timeout: 120000 });
  return r;
};
