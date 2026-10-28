// RE-UP and PUFF PUFF PASS offline: bots play, the player auto-aims; pictures: SHOTS=dir MAP=id node run.js s_modes3.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', map = process.env.MAP || 'greenhouse', r = {};
  const shot = async n => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(900); await p.screenshot({ path: path.join(out, 'm3_' + n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  await p.evaluate(() => { const s = document.getElementById('hcSplash'); if (s) s.remove(); });
  const play = (mode, ms) => p.evaluate(async ([mode, ms, map]) => {
    const A = window.__A, wait = q => new Promise(r => setTimeout(r, q)), log = [];
    A.G.noRender = true;
    A.startMatch(mode, { map, score: 99, time: 5, perTeam: 4, players: 6, skill: 'veteran', custom: true });
    const t0 = performance.now(); let guns = new Set();
    while (performance.now() - t0 < ms && A.G.state !== 'over') {
      await wait(100);
      if (A.G.state === 'paused') A.G.state = 'playing';
      if (A.G.state === 'playing') {
        A.G.health = 100;
        const foes = A.enemies.filter(e => !(A.M.def.teams && e.team === 0));
        foes.sort((a, b) => Math.hypot(a.group.position.x - A.P.x, a.group.position.z - A.P.z) - Math.hypot(b.group.position.x - A.P.x, b.group.position.z - A.P.z));
        const e = foes[0];
        if (e) { const dx = e.group.position.x - A.P.x, dz = e.group.position.z - A.P.z; A.P.yaw = Math.atan2(-dx, -dz); A.P.pitch = Math.atan2(1.2 - 1.7, Math.hypot(dx, dz)); A.G.fireT = Math.min(A.G.fireT, 0); if (A.W[A.G.cur] && A.W[A.G.cur].ammo > 0) A.shoot(false); else if (A.W[A.G.cur]) A.W[A.G.cur].ammo = 30; }
      }
      if (A.M.pp) { guns.add(A.M.pp.gun); if (A.M.pp.t > 6) A.M.pp.t = Math.min(A.M.pp.t, 6); }
    }
    const M = A.M;
    if (M.ru) Object.assign(log, { ts: M.teamScore, tags: M.ru.tags.length, carry: M.ru.carry, banks: M.ru.banks.map(b => [b.n, +b.x.toFixed(1), +b.z.toFixed(1)]), bagsCol: M.entries.map(e => e.name + ':' + e.obj).join(' ') });
    if (M.pp) Object.assign(log, { guns: [...guns], now: M.pp.gun, myGun: A.W[A.G.cur] && A.W[A.G.cur].id, n: M.pp.n, botGuns: A.enemies.slice(0, 3).map(e => e.gunId || e.gun || (e.gunDef && e.gunDef.id)) });
    return { mode, state: A.G.state, t: +M.t.toFixed(1), me: [M.me.kills, M.me.deaths], kills: M.entries.reduce((s, e) => s + e.kills, 0), log: Object.assign({}, log), err: (document.getElementById('err') || {}).textContent || '' };
  }, [mode, ms, map]);
  r.ru = await play('ru', +(process.env.T || 60000));
  // a picture with bags on the floor and a stash house in view
  await p.evaluate(() => { const A = window.__A, b = A.M.ru.banks[0]; Object.assign(A.P, { x: b.x + 5, z: b.z + 5, y: b.y }); A.P.yaw = Math.atan2(-(b.x - A.P.x), -(b.z - A.P.z)); A.P.pitch = -0.15; A.M.ru.carry[A.ruKey ? A.ruKey('player') : 'me'] = 3; });
  await shot('reup');
  r.ru2 = await p.evaluate(() => { const A = window.__A, b = A.M.ru.banks[0], ts0 = A.M.teamScore[0]; return new Promise(res => { Object.assign(A.P, { x: b.x, z: b.z, y: b.y }); const iv = setInterval(() => { if (A.G.state === 'paused') A.G.state = 'playing'; }, 100); setTimeout(() => { clearInterval(iv); res({ before: ts0, after: A.M.teamScore[0], carry: A.M.ru.carry.me, state: A.G.state, P: [A.P.x, A.P.z, A.P.y], b: [b.x, b.z, b.y] }); }, 9000); }); });
  await p.evaluate(() => window.__A.actions('res-lobby'));
  r.pp = await play('pp', +(process.env.T || 60000));
  await shot('pass');
  await p.evaluate(() => window.__A.actions('res-lobby'));
  return r;
};
