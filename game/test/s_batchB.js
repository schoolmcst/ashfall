// CONTACT HIGH (infected) and BACK ALLEY (2v2): SHOTS=dir node run.js s_batchB.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const keep = () => p.evaluate(() => { const A = window.__A; if (A.G.state === 'paused') A.G.state = 'playing'; });
  const sim = async ms => { const t0 = Date.now(); while (Date.now() - t0 < ms) { await keep(); await p.waitForTimeout(200); } };
  const shot = async (n, ms = 900) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await sim(ms); await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  await p.evaluate(() => { const s = document.getElementById('hcSplash'); if (s) s.remove(); });
  // ---------------- CONTACT HIGH
  await p.evaluate(() => { const A = window.__A; A.startMatch('inf', { map: 'town', perTeam: 4, time: 2, skill: 'veteran', custom: true }); A.G.holdT = 0.05; A.G.loadT = 0.05; A.G.noRender = true; A.G.health = A.G.maxHp = 1e6; });
  r.start = await p.evaluate(() => { const A = window.__A; return { teams: A.M.entries.map(e => e.team), state: A.M.inf.state, len: A.M.inf.left }; });
  await sim(10000);
  r.turned = await p.evaluate(() => { const A = window.__A; return { state: A.M.inf.state, n: A.infCount(), first: A.M.inf.first, infBots: A.enemies.filter(e => e.inf).length, gunHidden: A.enemies.filter(e => e.inf).every(e => !e.rig.gun || !e.rig.gun.visible) }; });
  // let it spread among the bots (you stay safe far away)
  await p.evaluate(() => { const A = window.__A; A.G.spawnProt = 1e9; });
  await sim(25000);
  r.spread = await p.evaluate(() => { const A = window.__A; return { n: A.infCount(), left: Math.round(A.M.inf.left) }; });
  // a picture of the infected coming at you
  await p.evaluate(() => { const A = window.__A; A.G.spawnProt = 0; A.G.state = 'playing'; const sp = A.LAYOUT.spawn[0]; Object.assign(A.P, { x: sp.x, z: sp.z, y: sp.y || 0 }); A.P.yaw = Math.atan2(sp.x, sp.z); A.P.pitch = -0.05;
    const fx = -Math.sin(A.P.yaw), fz = -Math.cos(A.P.yaw); A.enemies.filter(e => e.inf).forEach((e, i) => { e.group.position.set(A.P.x + fx * (6 + i * 1.5) + fz * (i - 1) * 1.4, A.P.y, A.P.z + fz * (6 + i * 1.5) - fx * (i - 1) * 1.4); e.speed = 0; }); });
  await shot('inf_horde', 1200);
  // you get infected
  r.me = await p.evaluate(async () => { const A = window.__A, w = ms => new Promise(q => setTimeout(q, ms)); const k = A.enemies.find(e => e.inf); A.G.health = A.G.maxHp = 100; A.G.killer = k; A.G.health = 0; A.S.deathCam = false; A.die();
    for (let i = 0; i < 40 && A.G.state !== 'playing'; i++) { await w(150); if (A.G.state === 'paused') A.G.state = 'playing'; }
    A.G.health = A.G.maxHp = 1e6; return { team: A.M.myTeam, infMe: !!A.M.infMe, vm: A.viewmodel ? A.viewmodel.visible : null, state: A.G.state }; });
  await p.evaluate(() => { const A = window.__A; const surv = A.enemies.find(e => e.team === 0); if (surv) { const fx = -Math.sin(A.P.yaw), fz = -Math.cos(A.P.yaw); surv.group.position.set(A.P.x + fx * 4, A.P.y, A.P.z + fz * 4); surv.speed = 0; surv.cd = 99; } });
  await shot('inf_me', 1200);
  r.end = await p.evaluate(async () => { const A = window.__A, w = ms => new Promise(q => setTimeout(q, ms)); A.M.inf.left = 0.1; for (let i = 0; i < 30 && A.G.state !== 'over'; i++) { await w(150); if (A.G.state === 'paused') A.G.state = 'playing'; } return { state: A.G.state, end: A.M.inf.end, title: (document.getElementById('resTitle') || {}).textContent }; });
  await p.evaluate(() => window.__A.actions('res-lobby'));
  // ---------------- BACK ALLEY
  await p.evaluate(() => { const A = window.__A; A.startMatch('gf', { map: 'stackyard', skill: 'veteran' }); A.G.holdT = 0.05; A.G.loadT = 0.05; A.G.noRender = true; });
  await sim(1500);
  r.gf = await p.evaluate(() => { const A = window.__A, g = A.M.gf; return { teams: A.M.entries.map(e => e.team), round: g.round, state: g.state, lo: g.lo, mine: A.W.map(w => w.def.id), bots: A.enemies.map(e => A.botGunName(e)) }; });
  await p.evaluate(() => { const A = window.__A; A.G.state = 'playing'; A.P.pitch = -0.04; });
  await shot('gf_round', 1500);
  // win rounds: the enemy pair drops
  r.rounds = [];
  for (let k = 0; k < 3; k++) {
    await sim(4000);
    r.rounds.push(await p.evaluate(async () => { const A = window.__A, w = ms => new Promise(q => setTimeout(q, ms)); A.G.health = A.G.maxHp = 1e6;
      for (const e of A.enemies.filter(e => e.team === 1)) { e.hp = 1; e.spawnProt = 0; A.damageEnemy(e, 50, false, null, false, 'player'); }
      await w(800); return { round: A.M.gf.round, wins: A.M.gf.wins.slice(), state: A.M.gf.state, lo: A.M.gf.lo.p }; }));
  }
  await sim(5000);
  r.after = await p.evaluate(() => { const A = window.__A; return { round: A.M.gf.round, wins: A.M.gf.wins, lo: A.M.gf.lo, mine: A.W.map(w => w.def.id), alive: A.enemies.length }; });
  // time out: more health wins
  r.timeout = await p.evaluate(async () => { const A = window.__A, w = ms => new Promise(q => setTimeout(q, ms)); const g = A.M.gf; for (let i = 0; i < 40 && g.state !== 'live'; i++) { await w(150); if (A.G.state === 'paused') A.G.state = 'playing'; }
    const before = g.wins.slice(); for (const e of A.enemies.filter(e => e.team === 1)) e.hp = 20; A.G.health = A.G.maxHp = 100; g.t = 0.05; await w(900); return { before, after: g.wins.slice(), why: g.why }; });
  return r;
};
