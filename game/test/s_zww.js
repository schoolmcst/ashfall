// wonder weapons (bong cannon, pressure gun) + zombies stats and the leaderboard tab: SHOTS=dir node run.js s_zww.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const shot = async (n, ms = 1500) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms); await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  for (const map of ['blackwell', 'works']) {
    const R = r[map] = {};
    await p.evaluate(m => { const A = window.__A; localStorage.removeItem('ashfall.zstats'); A.ZL.net = 'solo'; A.ZL.map = m; A.ZL.story = false; A.openZLobby(); const s = document.getElementById('hcSplash'); if (s) s.remove(); A.zombAct('z-start'); A.G.health = 1e9; A.G.maxHp = 1e9; A.G.noRender = true; }, map);
    await p.waitForTimeout(6000);
    await p.evaluate(() => { const A = window.__A; for (const d of A.ZDOORS) A.zdOpen(d.id, true); A.Z.toSpawn = 0; A.Z.breakT = 1e9; A.Z.active = true; A.Z.round = 8; for (const e of A.enemies.slice()) if (e.zombie) { e.hp = 1; A.damageEnemy(e, 100, false, null, false, 'world'); } });
    R.give = await p.evaluate(m => { const A = window.__A; const ok = A.zwwGive(m); const w = A.W[A.G.cur]; return { ok, name: w.name, ww: w.ww, mag: w.magSize }; }, map);
    // a crowd in front, then fire
    await p.evaluate(() => { const A = window.__A, sp = A.curMap === 'works' ? { x: 27, z: 22 } : { x: 0, z: 20 }; Object.assign(A.P, { x: sp.x, z: sp.z, y: 0 }); A.P.yaw = 0; A.P.pitch = A.curMap === 'works' ? -0.02 : 0.05; A.G.state = 'playing';
      window.__crowd = []; for (let i = 0; i < 7; i++) { const e = A.makeZombie(sp.x - 2 + (i % 4) * 1.3, sp.z - 8 - Math.floor(i / 4) * 1.4, 0); e.speed = 0; e.atkCd = 99; window.__crowd.push(e); } });
    await shot(`ww_${map}_hold`, 1200);
    const before = await p.evaluate(() => window.__A.enemies.filter(e => e.zombie).length);
    await p.evaluate(() => { const A = window.__A; A.G.fireT = 0; A.shoot(false); A.G.noRender = false; });
    await p.waitForTimeout(map === 'works' ? 150 : 350);
    await p.screenshot({ path: path.join(out, `ww_${map}_fire.png`), timeout: 120000 });
    await p.waitForTimeout(2500);
    await shot(`ww_${map}_after`, 300);
    R.result = await p.evaluate(b => { const A = window.__A, z = A.enemies.filter(e => e.zombie); return { before: b, left: z.length, stunned: z.filter(e => e.stunT > 0).length }; }, before);
    // stats: end the game
    await p.evaluate(() => { const A = window.__A; A.G.kills = 37; A.G.score = 4321; A.Z.round = 8; A.zombDeathText ? A.zombDeathText() : 0; });
    R.stats = await p.evaluate(m => JSON.parse(localStorage.getItem('ashfall.zstats') || '{}')[m], map);
    await p.evaluate(() => window.__A.leaveGame()); await p.waitForTimeout(800);
  }
  await p.evaluate(() => { const A = window.__A; A.ZL.map = 'works'; A.openZLobby(); });
  await p.waitForTimeout(500); await p.screenshot({ path: path.join(out, 'ww_lobby_best.png'), timeout: 120000 });
  r.card = await p.evaluate(() => window.__A.zstCard());
  await p.evaluate(() => { const A = window.__A; A.openLeaderboard(); window.__A.SOC.lbSort = 'zomb'; A.renderLeaderboard(); });
  await p.waitForTimeout(500); await p.screenshot({ path: path.join(out, 'ww_board.png'), timeout: 120000 });
  r.board = await p.evaluate(() => document.getElementById('lbBody').textContent.slice(0, 200));
  return r;
};
