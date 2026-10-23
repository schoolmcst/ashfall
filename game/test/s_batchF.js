// MUNCHIE CANDY and upgrade camos: SHOTS=dir node run.js s_batchF.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const keep = () => p.evaluate(() => { const A = window.__A; if (A.G.state === 'paused') A.G.state = 'playing'; });
  const sim = async ms => { const t0 = Date.now(); while (Date.now() - t0 < ms) { await keep(); await p.waitForTimeout(150); } };
  const shot = async (n, ms = 900) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await sim(ms); await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  await p.evaluate(() => { const s = document.getElementById('hcSplash'); if (s) s.remove(); const A = window.__A; A.ZL.net = 'solo'; A.ZL.map = 'blackwell'; A.ZL.story = false; A.openZLobby(); });
  await shot('mc_lobby', 600);
  await p.evaluate(() => window.__A.mcPicker());
  await shot('mc_picker', 500);
  await p.evaluate(() => { const o = document.getElementById('mcPick'); if (o) o.remove(); });
  // ---- a game
  await p.evaluate(() => { const A = window.__A; A.zombAct('z-start'); A.G.noRender = true; });
  await sim(6000);
  await p.evaluate(() => { const A = window.__A; A.G.health = A.G.maxHp = 100; for (const d of A.ZDOORS) A.zdOpen(d.id, true); A.Z.toSpawn = 0; A.Z.breakT = 1e9; A.Z.active = true; A.Z.round = 5; A.mcRound(5); });
  r.pocket = await p.evaluate(() => window.__A.MC.pocket);
  await shot('mc_hud', 800);
  r.effects = await p.evaluate(async () => { const A = window.__A, w = ms => new Promise(q => setTimeout(q, ms)), o = {}, eat = id => { A.MC.pocket = id; A.G.state = 'playing'; return A.mcEat(); };
    for (let i = 0; i < 4; i++) { const z = A.makeZombie(A.P.x + 3 + i * 0.5, A.P.z + 2, 0); z.speed = 0; }
    const n0 = A.enemies.filter(e => e.zombie).length; eat('sour'); await w(300); o.sour = [n0, A.enemies.filter(e => e.zombie).length];
    const p0 = A.G.points; eat('jack'); o.jack = A.G.points - p0;
    eat('lolly'); o.lollyCost = A.zboxCost();
    eat('rock'); A.G.health = 100; A.G.spawnProt = 0; A.G.state = 'playing'; A.hurtPlayer(40, A.P.x + 1, A.P.z); o.rock = 100 - A.G.health; A.G.health = 100;
    eat('rush'); o.rush = A.ZPU.fx.dbl > performance.now() / 1000 - 1e9;
    eat('cloud'); A.G.state = 'playing'; await w(400); o.cloudTargets = (A.Z.targets || []).length;
    for (const W of A.W) if (W) { W.ammo = 1; W.reserve = 0; } eat('rope'); o.rope = A.W.every(W => !W || W.reserve > 0);
    eat('angel'); A.G.spawnProt = 0; A.G.health = 1; A.G.state = 'playing'; A.G.killer = null; A.die(); o.angel = { state: A.G.state, hp: A.G.health };
    eat('fizz'); o.fizz = A.MC.fizz > 0;
    return o; });
  await sim(2500);
  r.noErr = await p.evaluate(() => (document.getElementById('err') || {}).textContent || '');
  // ---- upgrade camos on each map
  for (const map of ['blackwell', 'works', 'terminal9']) {
    await p.evaluate(m => { const A = window.__A; A.leaveGame(); A.ZL.map = m; A.openZLobby(); A.zombAct('z-start'); A.G.noRender = true; }, map);
    await sim(6000);
    await p.evaluate(() => { const A = window.__A; A.G.health = A.G.maxHp = 1e6; A.Z.toSpawn = 0; A.Z.breakT = 1e9; for (const e of A.enemies.slice()) if (e.zombie) { e.hp = 1; A.damageEnemy(e, 100, false, null, false, 'world'); } A.Z.up = A.Z.up || new Set(); A.Z.up.add(A.W[A.G.cur].def.id); A.zombEquip(); A.P.pitch = -0.3; A.G.inspectT = 2.6; });
    await shot('zu_' + map, 1400);
    r['zu_' + map] = await p.evaluate(() => ({ name: window.__A.W[window.__A.G.cur].name, upg: !!window.__A.W[window.__A.G.cur].upgraded }));
  }
  return r;
};
