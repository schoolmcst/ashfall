// zombies story, all seven chapters (pictures along the way): SHOTS=dir node run.js s_zstory.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const shot = async n => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1400); await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  const look = async (n, x, z, y, tx, tz, ty = 0.5) => { await p.evaluate(({ x, z, y, tx, tz, ty }) => { const A = window.__A; Object.assign(A.P, { x, z, y }); A.P.yaw = Math.atan2(-(tx - x), -(tz - z)); A.P.pitch = Math.atan2(ty - (y + 1.7), Math.hypot(tx - x, tz - z)); A.G.state = 'playing'; }, { x, z, y, tx, tz, ty }); await shot(n); };
  const at = async (x, z, y) => p.evaluate(({ x, z, y }) => { const A = window.__A; Object.assign(A.P, { x, z, y }); A.G.state = 'playing'; return A.zsPrompt(false); }, { x, z, y });
  const use = async (x, z, y) => p.evaluate(({ x, z, y }) => { const A = window.__A; Object.assign(A.P, { x, z, y }); A.G.state = 'playing'; return A.zsPrompt(true); }, { x, z, y });
  await p.evaluate(() => { const A = window.__A; A.ZL.net = 'solo'; A.openZLobby(); const s = document.getElementById('hcSplash'); if (s) s.remove(); });
  await p.waitForTimeout(500); await p.screenshot({ path: path.join(out, 'zs_lobby.png'), timeout: 120000 });
  await p.evaluate(() => { const A = window.__A; A.zombAct('z-start'); A.G.health = 1e9; A.G.maxHp = 1e9; A.G.noRender = false; });
  await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, 'zs_intro.png'), timeout: 120000 });
  await p.waitForTimeout(6000);
  r.start = await p.evaluate(() => { const A = window.__A; return { items: A.ZS.objs.length, tapes: A.ZS.tapes.length, chapter: A.ZS.chapter, hud: document.getElementById('zQuest').textContent }; });
  // every item and tape stands on a floor the nav grid knows (somewhere a player can walk to)
  r.walk = await p.evaluate(() => { const A = window.__A, bad = []; for (const o of A.ZS_ITEMS.map(it => [it.id, it.at]).concat(A.ZS_TAPES.map((t, i) => ['tape' + (i + 1), t.at]))) { const [id, q] = o; let ok = false; for (const [dx, dz] of [[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (A.nodeOf(q.x + dx, q.z + dz, q.y > 2.5 ? q.y : 0) >= 0) ok = true; if (!ok) bad.push(id); } return bad; });
  await p.evaluate(() => { const A = window.__A; for (const d of A.ZDOORS) A.zdOpen(d.id, true); A.Z.toSpawn = 0; for (const e of A.enemies.slice()) if (e.zombie) { e.hp = 1; A.damageEnemy(e, 100, false, 'player'); } });
  await shot('zs_hud');
  // chapter 1: fuses
  const I = await p.evaluate(() => Object.fromEntries(window.__A.ZS_ITEMS.map(it => [it.id, it.at])));
  await look('zs_fuse', I.f2.x + 1.8, I.f2.z + 1.6, 0, I.f2.x, I.f2.z, 0.05);
  r.cardEarly = await at(I.card.x + 0.5, I.card.z, 0);
  r.boxEarly = await at(-8.6, -2.6, 0);
  for (const f of ['f1', 'f2', 'f3']) await use(I[f].x + 0.4, I[f].z, 0);
  await look('zs_fusebox_off', -6.5, -1.2, 0, -9.6, -2.6, 1.4);
  r.boxReady = await at(-8.6, -2.6, 0); await use(-8.6, -2.6, 0);
  await look('zs_fusebox_on', -6.5, -1.2, 0, -9.6, -2.6, 1.4);
  r.ch1 = await p.evaluate(() => ({ power: window.__A.ZS.flags.has('power'), chapter: window.__A.zsChapterNow() }));
  // chapter 2: keycard
  await look('zs_card', I.card.x + 2.2, I.card.z + 1.8, 0, I.card.x, I.card.z, 0.1);
  await use(I.card.x + 0.4, I.card.z, 0);
  // chapter 3: stashes
  await look('zs_stash', I.st1.x + 2, I.st1.z + 1.5, 0, I.st1.x, I.st1.z, 0.9);
  r.jarEarly = await p.evaluate(() => { const A = window.__A; A.ZS.flags.delete('card'); return 0; });
  r.jarEarly = await at(I.jar.x + 0.4, I.jar.z, 0); await p.evaluate(() => window.__A.ZS.flags.add('card'));
  for (const s of ['st1', 'st2', 'st3']) await use(I[s].x + 0.4, I[s].z, I[s].y > 3 ? 4.2 : 0);
  r.ch3 = await p.evaluate(() => window.__A.zsChapterNow());
  // chapter 4: Patient Zero comes out a few seconds later
  await p.evaluate(() => { window.__A.G.noRender = true; });
  for (let i = 0; i < 30 && !(await p.evaluate(() => !!window.__A.ZS.boss)); i++) await p.waitForTimeout(1000);
  r.boss = await p.evaluate(() => { const A = window.__A, b = A.ZS.boss; return b ? { hp: Math.round(b.hp), scale: b.group.scale.x, kind: b.kind, x: +b.group.position.x.toFixed(1), z: +b.group.position.z.toFixed(1), y: +b.group.position.y.toFixed(1) } : null; });
  if (r.boss) {
    await p.evaluate(() => { const A = window.__A, b = A.ZS.boss; b.speed = 0; b.atkCd = 99; });
    const b = r.boss; await look('zs_boss', b.x + 3.5, b.z + 3, b.y, b.x, b.z, b.y + 1.3);
    await p.evaluate(() => { const A = window.__A; A.ZS.boss.hp = 50; A.damageEnemy(A.ZS.boss, 200, true, 'player'); });
    for (let i = 0; i < 15 && !(await p.evaluate(() => !!window.__A.ZS.bloodItem)); i++) await p.waitForTimeout(1000);
    r.bossDiag = await p.evaluate(() => { const A = window.__A; return { inE: A.enemies.includes(A.ZS.boss), boss: !!A.ZS.boss, state: A.G.state, mode: A.M && A.M.mode }; });
    r.blood = await p.evaluate(() => { const A = window.__A; return A.ZS.bloodItem ? A.ZS.bloodItem.at : null; });
    if (r.blood) { const q = r.blood; await look('zs_blood', q.x + 1.6, q.z + 1.4, q.y, q.x, q.z, q.y); await use(q.x + 0.3, q.z, q.y); }
  }
  // chapter 5: the jar
  await look('zs_jar', I.jar.x + 2, I.jar.z + 1.5, 0, I.jar.x, I.jar.z, 0.2);
  await use(I.jar.x + 0.4, I.jar.z, 0);
  r.ch5 = await p.evaluate(() => ({ chapter: window.__A.zsChapterNow(), flags: [...window.__A.ZS.flags] }));
  // tapes: listen to one, the subtitle shows
  await p.evaluate(() => { window.__A.ZS.playing = false; });
  const T = await p.evaluate(() => window.__A.ZS_TAPES[11].at);
  await look('zs_tape', T.x + 1.6, T.z + 1.4, T.y, T.x, T.z, T.y);
  await use(T.x + 0.5, T.z + 0.5, T.y); await p.waitForTimeout(600);
  r.tapeSub = await p.evaluate(() => (document.getElementById('zSub') || {}).textContent);
  // chapter 6: cook
  r.cookPrompt = await at(-28, -3.6, 0); await use(-28, -3.6, 0);
  await p.evaluate(() => { window.__A.ZS.cookT = 30; });
  await look('zs_cook', -25.5, -3.2, 0, -28, -5.5, 1.0);
  r.cooking = await p.evaluate(() => ({ cook: window.__A.ZS.cook, bar: document.getElementById('zCook').style.display }));
  await p.evaluate(() => { const A = window.__A; A.ZS.cookT = 59.9; Object.assign(A.P, { x: -27, z: -3.6, y: 0 }); });
  for (let i = 0; i < 20 && !(await p.evaluate(() => window.__A.ZS.done)); i++) await p.waitForTimeout(1000);
  r.end = await p.evaluate(() => { const A = window.__A; return { done: A.ZS.done, perks: [...A.ZP.have].length, saved: localStorage.getItem('ashfall.zstory'), hud: document.getElementById('zQuest').textContent }; });
  await look('zs_end', -25.5, -3.2, 0, -28, -5.5, 1.0);
  await p.evaluate(() => { const A = window.__A; A.toLobby && 0; A.openZLobby(); });
  await p.waitForTimeout(400); await p.screenshot({ path: path.join(out, 'zs_lobby_after.png'), timeout: 120000 });
  return r;
};
