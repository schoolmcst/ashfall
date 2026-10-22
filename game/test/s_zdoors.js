// zombies doors + gun upgrader on the hospital: SHOTS=dir node run.js s_zdoors.js
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp';
  const snap = async (n, setup) => { const u = await p.evaluate(setup => { const A = window.__A; const s = document.getElementById('hcSplash'); if (s) s.remove(); A.G.noRender = false; if (setup) new Function('A', setup)(A); return true; }, setup || ''); await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  const r = {};
  r.start = await p.evaluate(() => {
    const A = window.__A; A.openZLobby(); const lob = document.querySelector('#lobSel').innerText.replace(/\n/g, ' | ').slice(0, 200);
    A.zombAct('z-start'); A.G.noRender = true; A.G.health = 1e9; A.G.maxHp = 1e9;
    const reach = (x, z, y = 0) => { const f = A.flowField(x, z, y), n = A.nodeOf(A.P.x, A.P.z, A.P.y); return !!f && n >= 0 && f[n] >= 0; };
    return { lob, map: A.curMap, doors: A.ZD.list.length, closed: A.ZD.list.filter(o => !o.perm && !o.open).length, me: [A.P.x, A.P.z], reachLobby: reach(4, 20), reachCorridor: reach(-20, 12), reachNorth: reach(0, -25), reachUp: reach(20, 12, 4.2) };
  });
  await snap('zd_barricade', `const P = A.P; P.x = 0; P.z = 20; P.y = 0; P.yaw = 0; P.pitch = -0.05;`);
  // wait for round 1 zombies: they must spawn where the player can reach
  r.spawn = await p.evaluate(async () => {
    const A = window.__A; await new Promise(res => setTimeout(res, 14000));
    const zs = A.enemies.filter(e => e.zombie);
    return { round: A.Z.round, n: zs.length, where: zs.map(e => [Math.round(e.group.position.x), Math.round(e.group.position.z), +e.group.position.y.toFixed(1)]), allInside: zs.every(e => e.group.position.z > 13.5 && Math.abs(e.group.position.x) < 12.5) };
  });
  // buy the main corridor barricade
  r.buy = await p.evaluate(async () => {
    const A = window.__A; A.G.points = 2000; Object.assign(A.P, { x: 0, z: 15.4, y: 0 });
    const o = A.ZD.list.find(o => o.d.name === 'MAIN CORRIDOR'); await new Promise(res => setTimeout(res, 300));
    const prompt = document.getElementById('zPrompt').textContent; A.zdBuy(o);
    const f = A.flowField(-20, 12, 0), n = A.nodeOf(A.P.x, A.P.z, 0);
    return { prompt, pts: A.G.points, open: o.open, reachCorridor: !!f && f[n] >= 0, reachNorth: (() => { const g = A.flowField(0, -25, 0); return !!g && g[n] >= 0; })() };
  });
  await snap('zd_opened', `const P = A.P; P.x = 0; P.z = 19; P.y = 0; P.yaw = 0; P.pitch = -0.05;`);
  // open the north wing, walk to the upgrader, upgrade the pistol
  r.up = await p.evaluate(async () => {
    const A = window.__A; A.zdOpen(A.ZDOORS.find(d => d.name === 'NORTH WING').id, true); A.G.points = 6000; Object.assign(A.P, { x: -5.4, z: -27, y: 0, yaw: Math.PI / 2 });
    const w0 = A.W[A.G.cur], d0 = w0.dmg, m0 = w0.magSize; await new Promise(res => setTimeout(res, 1500));
    const t0 = A.G.time; await new Promise(res => setTimeout(res, 1000)); A.zombCrateTick(0.01); const prompt = document.getElementById('zPrompt').textContent + ' |near ' + A.zuNear() + ' dt ' + (A.G.time - t0).toFixed(2) + ' |P ' + [A.P.x.toFixed(2), A.P.z.toFixed(2), A.P.y.toFixed(2), A.G.state].join(','); A.zuBuy(); const w = A.W[A.G.cur];
    return { prompt, before: [w0.name, d0, m0], after: [w.name, w.dmg, w.magSize, w.reserve], pts: A.G.points };
  });
  await snap('zd_upgrader', `const P = A.P; P.x = -3.2; P.z = -26; P.y = 0; P.yaw = Math.atan2(-(-6.9 - P.x), -(-27 - P.z)); P.pitch = -0.1;`);
  // leaving zombies takes the doors away (multiplayer on the same map has none)
  r.leave = await p.evaluate(() => { const A = window.__A; A.toMenu(); return { doors: A.ZD.list.length, boxesWithDoors: A.boxes.filter(b => Math.abs(b.minz - 13.85) < 0.01 && b.maxx - b.minx > 15).length }; });
  return r;
};
