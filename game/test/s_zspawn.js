// zombies: spawn spots (open parts only, near you), far zombies recalled, every perk bought at its machine on both maps
// (with pictures of the three animations), and how many voice lines play at the start: SHOTS=dir node run.js s_zspawn.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const wait = async (fn, n = 30) => { for (let i = 0; i < n && !(await p.evaluate(fn)); i++) await p.waitForTimeout(1000); };
  for (const map of ['blackwell', 'works']) {
    const R = r[map] = {};
    await p.evaluate(m => { const A = window.__A; localStorage.removeItem(m === 'works' ? 'ashfall.zstory.works.intro' : 'ashfall.zstory.intro'); A.ZL.net = 'solo'; A.ZL.map = m; A.ZL.story = true; A.S.zvoice = true; A.openZLobby(); const s = document.getElementById('hcSplash'); if (s) s.remove();
      window.__subs = 0; const el = () => document.getElementById('zSub'); window.__subT = setInterval(() => { const s = el(); const t = s ? s.textContent : ''; if (t && t !== window.__lastSub) { window.__lastSub = t; window.__subs++; } }, 150);
      A.zombAct('z-start'); A.G.health = 1e9; A.G.maxHp = 1e9; A.G.noRender = true; }, map);
    await p.waitForTimeout(20000);
    R.linesFirst20s = await p.evaluate(() => window.__subs);
    // spawn spots with only the start open
    R.spawnClosed = await p.evaluate(() => { const A = window.__A; A.Z.targets = A.zombTargets(); A.zombNav(); const o = []; for (let i = 0; i < 40; i++) { const q = A.zombSpawnPoint(); if (!q) { o.push(null); continue; } o.push([+(Math.hypot(q.x - A.P.x, q.z - A.P.z)).toFixed(1), A.zombRouteDist(q.x, q.z, q.y)]); }
      const ok = o.filter(Boolean); return { got: ok.length, straight: [Math.min(...ok.map(a => a[0])), Math.max(...ok.map(a => a[0]))], route: [Math.min(...ok.map(a => a[1])), Math.max(...ok.map(a => a[1]))], unreachable: ok.filter(a => a[1] < 0).length }; });
    // open everything: spots are still near, never far
    await p.evaluate(() => { const A = window.__A; for (const d of A.ZDOORS) A.zdOpen(d.id, true); A.zombNav(); });
    R.spawnOpen = await p.evaluate(() => { const A = window.__A; A.Z.targets = A.zombTargets(); const o = []; for (let i = 0; i < 40; i++) { const q = A.zombSpawnPoint(); if (q) o.push([+(Math.hypot(q.x - A.P.x, q.z - A.P.z)).toFixed(1), A.zombRouteDist(q.x, q.z, q.y)]); }
      return { got: o.length, straight: [Math.min(...o.map(a => a[0])), Math.max(...o.map(a => a[0]))], route: [Math.min(...o.map(a => a[1])), Math.max(...o.map(a => a[1]))] }; });
    // a zombie far away gets recalled near
    await p.evaluate(() => { const A = window.__A; A.Z.toSpawn = 0; A.Z.breakT = 999; for (const e of A.enemies.slice()) if (e.zombie) { e.hp = 1; A.damageEnemy(e, 100, false, 'player'); } });
    await p.waitForTimeout(1500);
    R.recall = await p.evaluate(() => { const A = window.__A, far = A.curMap === 'works' ? { x: 38, z: -37 } : { x: -36, z: -30 }; const e = A.makeZombie(far.x, far.z, 0); e.speed = 0; window.__far = e; return { startDist: +Math.hypot(far.x - A.P.x, far.z - A.P.z).toFixed(1), route: A.zombRouteDist(far.x, far.z, 0) }; });
    await p.evaluate(() => { window.__A.Z.active = true; });
    await wait(() => { const A = window.__A, e = window.__far; return Math.hypot(e.group.position.x - A.P.x, e.group.position.z - A.P.z) < 30; }, 25);
    R.recall.after = await p.evaluate(() => { const A = window.__A, e = window.__far; return { dist: +Math.hypot(e.group.position.x - A.P.x, e.group.position.z - A.P.z).toFixed(1), hpKept: e.hp === e.maxHp, recalled: A.Z.recalled || 0 }; });
    // every perk, bought at its machine: which animation plays
    R.perks = await p.evaluate(() => { const A = window.__A, res = []; A.ZP.have.clear(); A.G.points = 1e6;
      for (const pk of A.ZPERKS) { const s = pk.at, fx = Math.round(Math.sin(s.q * Math.PI / 2)), fz = Math.round(Math.cos(s.q * Math.PI / 2)); Object.assign(A.P, { x: s.x + fx * 1.3, z: s.z + fz * 1.3, y: s.y }); A.G.state = 'playing';
        const m = A.zpNear(); let anim = null; if (m) { A.zpPrompt(m, true); anim = A.ZP.anim && A.ZP.anim.p.anim; let k = 0; A.ZP.freeze = false; while (A.ZP.anim && k++ < 2000) A.zpTick(1 / 30); }
        res.push([pk.id, m ? 'machine ok' : 'NO MACHINE NEAR', anim, A.ZP.have.has(pk.id)]); }
      return res; });
    await p.evaluate(() => { clearInterval(window.__subT); window.__A.leaveGame(); }); await p.waitForTimeout(800);
  }
  // pictures: each animation, bought for real on THE WORKS
  await p.evaluate(() => { const A = window.__A; A.ZL.map = 'works'; A.openZLobby(); A.zombAct('z-start'); A.G.health = 1e9; A.G.noRender = true; });
  await p.waitForTimeout(6000);
  for (const [id, t] of [['double', 1.4], ['zoom', 0.9], ['revive', 1.2]]) {
    await p.evaluate(({ id, t }) => { const A = window.__A, pk = A.ZPERKS.find(q => q.id === id), s = pk.at, fx = Math.round(Math.sin(s.q * Math.PI / 2)), fz = Math.round(Math.cos(s.q * Math.PI / 2));
      for (const d of A.ZDOORS) A.zdOpen(d.id, true); A.ZP.have.clear(); A.G.points = 1e6; Object.assign(A.P, { x: s.x + fx * 1.3, z: s.z + fz * 1.3, y: s.y }); A.P.yaw = Math.atan2(fx, fz); A.P.pitch = -0.05; A.G.state = 'playing';
      A.zpPrompt(A.zpNear(), true); A.ZP.freeze = false; let k = 0; while (A.ZP.anim && A.ZP.anim.t < t && k++ < 1000) A.zpTick(1 / 60); A.ZP.freeze = true; A.G.noRender = false; }, { id, t });
    await p.waitForTimeout(1200); await p.screenshot({ path: path.join(out, `zp_${id}.png`), timeout: 120000 });
    await p.evaluate(() => { const A = window.__A; A.ZP.freeze = false; A.G.noRender = true; });
  }
  return r;
};
