// zombies extras: wall stashes (pictures + buying) and the six power-ups (pictures + effects): SHOTS=dir node run.js s_zextras.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const shot = async n => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  for (const map of ['blackwell', 'works']) {
    const R = r[map] = {};
    await p.evaluate(m => { const A = window.__A; A.ZL.net = 'solo'; A.ZL.map = m; A.ZL.story = false; A.openZLobby(); const s = document.getElementById('hcSplash'); if (s) s.remove(); A.zombAct('z-start'); A.G.health = 1e9; A.G.maxHp = 1e9; A.G.noRender = true; }, map);
    await p.waitForTimeout(6000);
    await p.evaluate(() => { const A = window.__A; for (const d of A.ZDOORS) A.zdOpen(d.id, true); A.Z.toSpawn = 0; A.Z.breakT = 1e9; A.Z.active = false; for (const e of A.enemies.slice()) if (e.zombie) { e.hp = 1; A.damageEnemy(e, 100, false, null, false, 'world'); } });
    R.stashes = await p.evaluate(() => window.__A.ZWB.list.map(o => o.st.gun));
    // a picture of every stash, and buy each
    const N = R.stashes.length; R.buys = [];
    for (let i = 0; i < N; i++) {
      await p.evaluate(i => { const A = window.__A, o = A.ZWB.list[i], s = o.st; Object.assign(A.P, { x: s.x + o.fx * 2.4, z: s.z + o.fz * 2.4, y: s.y || 0 }); A.P.yaw = Math.atan2(o.fx, o.fz); A.P.pitch = -0.08; A.G.state = 'playing'; }, i);
      await shot(`wb_${map}_${i}`);
      R.buys.push(await p.evaluate(i => { const A = window.__A, o = A.ZWB.list[i], s = o.st; Object.assign(A.P, { x: s.x + o.fx * 1.2, z: s.z + o.fz * 1.2, y: s.y || 0 }); A.G.points = 99999;
        const near = A.zwbNear(); if (!near) return 'NOT NEAR'; const t1 = A.zwbPrompt(near, false); A.zwbPrompt(near, true); const got = A.Z.guns.slice();
        const w = A.W[A.Z.guns.indexOf(s.gun)]; if (w) w.reserve = 0; const t2 = A.zwbPrompt(near, false); A.zwbPrompt(near, true); return { prompt: t1.slice(0, 60), guns: got, ammoPrompt: t2.slice(0, 40), refilled: w ? w.reserve > 0 : null }; }, i));
    }
    // the six power-ups, side by side
    await p.evaluate(() => { const A = window.__A; Object.assign(A.P, { x: A.curMap === 'works' ? 0 : 0, z: A.curMap === 'works' ? 30 : 30, y: 0 }); A.P.yaw = 0; A.P.pitch = -0.12; A.G.state = 'playing';
      A.ZPU_TYPES.forEach((t, i) => A.zpuMake(900 + i, t.id, A.P.x - 3.75 + i * 1.5, A.P.z - 5, 0)); });
    await shot(`pu_${map}_all`);
    // effects
    R.effects = await p.evaluate(() => { const A = window.__A, o = {};
      const take = id => { const e = [...A.ZPU.list.values()].find(q => q.type === id); if (e) A.zpuTake(e.id); };
      A.W.forEach(w => { w.ammo = 1; w.reserve = 0; }); take('reup'); o.reup = A.W.every(w => w.reserve > 0);
      take('hotbox'); const z1 = A.makeZombie(A.P.x + 6, A.P.z, 0); z1.hp = z1.maxHp = 5000; A.damageEnemy(z1, 10, false, null, false, 'player'); o.hotbox = !A.enemies.includes(z1);
      take('dbl'); const p0 = A.G.points; const z2 = A.makeZombie(A.P.x + 6, A.P.z, 0); z2.hp = 1; A.damageEnemy(z2, 10, false, null, false, 'player'); o.dblPoints = A.G.points - p0;
      take('sale'); o.saleCost = A.zboxCost();
      for (let i = 0; i < 5; i++) A.makeZombie(A.P.x + 8, A.P.z + i, 0); const pb = A.G.points; take('bomb'); o.bomb = { left: A.enemies.filter(e => e.zombie).length, points: A.G.points - pb };
      const pf = A.G.points; take('fixer'); o.fixer = A.G.points - pf;
      o.timers = document.getElementById('zPu').textContent;
      return o; });
    await shot(`pu_${map}_hud`);
    // drop rate: 400 kills over 10 rounds
    R.drops = await p.evaluate(() => { const A = window.__A; let n = 0; const before = A.ZPU.seq; for (let r = 1; r <= 10; r++) { A.Z.round = r; for (let k = 0; k < 40; k++) A.zpuMaybeDrop(0, 0, 0); } n = A.ZPU.seq - before; for (const id of [...A.ZPU.list.keys()]) A.zpuRemove(id); return n; });
    await p.evaluate(() => window.__A.leaveGame()); await p.waitForTimeout(800);
  }
  return r;
};
