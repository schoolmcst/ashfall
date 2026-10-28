// campaign mission check: MISSION=m1 SHOTS=dir node run.js s_camp.js
// 1) every place the mission uses is a real floor you can reach  2) plays it step by step (cheating the fights), with pictures
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', id = process.env.MISSION || 'm1', r = { id };
  const keep = () => p.evaluate(() => { const A = window.__A; if (A.G.state === 'paused') A.G.state = 'playing'; });
  const sim = async ms => { const t0 = Date.now(); while (Date.now() - t0 < ms) { await keep(); await p.waitForTimeout(150); } };
  const shot = async (n, ms = 1200) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await sim(ms); await p.screenshot({ path: path.join(out, id + '_' + n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  await p.evaluate(() => { const s = document.getElementById('hcSplash'); if (s) s.remove(); window.__A.campMenu(); });
  await shot('menu', 600);
  await p.evaluate(id => { const A = window.__A; A.CAMP.sel = id; A.campAct('cp-play'); A.G.noRender = true; }, id);
  await p.evaluate(() => { const A = window.__A, o = A.campStepDone; window.__cl = []; });
  await sim(3000);
  r.start = await p.evaluate(() => { const A = window.__A; return { mode: A.M.mode, map: A.curMap, step: A.CAMP.i, allies: A.CAMP.allies.length, state: A.G.state }; });
  // ---- reachability of everything
  r.reach = await p.evaluate(() => {
    const A = window.__A, m = A.CAMP.m, F = A.flowField(m.start.x, m.start.z, m.start.y || 0), bad = [];
    const ok = (x, z, y = 0) => { for (const [dx, dz] of [[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) { const n = A.nodeOf(x + dx, z + dz, y); if (n >= 0 && F && F[n] >= 0) return true; } return false; };
    const chk = (lab, q) => { if (q && !ok(q.x, q.z, q.y || 0)) bad.push(lab + ' ' + q.x + ',' + q.z); };
    m.tins.forEach((t, i) => chk('tin' + i, t));
    for (const [n, s] of Object.entries(m.squads)) (s.pts || s).forEach((q, i) => { chk('sq:' + n + i, q); for (const w of q.path || []) chk('sq:' + n + i + ' path', { x: w[0], z: w[1], y: w[2] || 0 }); });
    m.steps.forEach((s, i) => { chk('step' + i + ' at', s.at); chk('step' + i + ' to', s.to); for (const q of s.spots || []) chk('step' + i + ' spot', q); chk('step' + i + ' obj', s.obj); for (const w of s.path || []) chk('step' + i + ' path', { x: w[0], z: w[1], y: w[2] || 0 }); });
    return bad;
  });
  await shot('start', 2500);
  // ---- step by step
  r.steps = [];
  const N = await p.evaluate(() => window.__A.CAMP.m.steps.length);
  for (let i = 0; i < N; i++) {
    const info = await p.evaluate(() => { const A = window.__A, st = A.CAMP.st; A.G.spawnProt = 1e9; return { i: A.CAMP.i, type: st.type, goal: st.goal, P: [+A.P.x.toFixed(1), +A.P.z.toFixed(1)], log: (window.__cl || []).slice(-4) }; });
    // stand somewhere useful and look at it
    const look = await p.evaluate(() => {
      const A = window.__A, st = A.CAMP.st, P = A.P, G = A.G; G.health = G.maxHp = 1e6; A.CAMP.talking = false; A.CAMP.q.length = 0;
      const tg = st.at || st.to || (st.spots && st.spots[0]) || (st.obj) || (st.path && { x: st.path[0][0], z: st.path[0][1] }) || null;
      if (tg && st.type !== 'carry') { const a = Math.random() * 6.28; Object.assign(P, { x: tg.x + 3, z: tg.z + 3, y: tg.y || 0 }); P.yaw = Math.atan2(-(tg.x - P.x), -(tg.z - P.z)); P.pitch = -0.1; }
      return !!tg;
    });
    await sim(1500);
    await shot(String(i).padStart(2, '0') + '_' + info.type, 1500);
    // finish it the quick way
    const res = await p.evaluate(async () => {
      const A = window.__A, st = A.CAMP.st, P = A.P, w = ms => new Promise(q => setTimeout(q, ms)), i0 = A.CAMP.i;
      const kill = () => { for (const e of A.enemies.slice()) if (e.camp && !e.camp.ally) { e.hp = 1; A.damageEnemy(e, 1e6, false, null, false, 'player'); } };
      const tp = q => Object.assign(P, { x: q.x, z: q.z, y: q.y || 0 });
      if (st.type === 'go') tp(st.at);
      if (st.type === 'clear' || st.type === 'boss' || st.type === 'snipe' || st.type === 'chase') { await w(1200); kill(); }
      if (st.type === 'hold' || st.type === 'defend') { tp(st.at || st.obj); A.CAMP.stT = st.secs - 2; await w(800); kill(); }
      if (st.type === 'use' || st.type === 'pick') A.campStepDone();
      if (st.type === 'multi') { for (let j = 0; j < st.spots.length; j++) A.CAMP.multi.add(j); A.campStepDone(); }
      if (st.type === 'search') A.campStepDone();
      if (st.type === 'photo') { for (let j = 0; j < st.spots.length; j++) A.CAMP.photos.add(j); A.campStepDone(); }
      if (st.type === 'carry') { A.CAMP.carry = { item: 'X' }; tp(st.to); }
      if (st.type === 'escort') { const a = A.CAMP.allies.find(e => e.ally === st.who); const end = st.path[st.path.length - 1]; if (a) { a.group.position.set(end[0], end[2] || 0, end[1]); } tp({ x: end[0] + 1, z: end[1] }); A.CAMP.escI = st.path.length - 1; }
      if (st.type === 'talk') { A.CAMP.talking = false; A.CAMP.q.length = 0; }
      if (st.type === 'upload') { A.CAMP.upOn = true; A.CAMP.upP = 1; tp(st.at); }
      if (st.type === 'route') { A.CAMP.rtI = st.spots.length - 1; tp(st.spots[st.spots.length - 1]); }
      if (st.type === 'tail') { const rr = A.campAlive(st.squads[0])[0]; if (rr) { const end = rr.camp.path[rr.camp.path.length - 1]; rr.group.position.set(end[0], end[2] || 0, end[1]); rr.camp.pi = rr.camp.path.length - 1; tp({ x: end[0] + 10, z: end[1] }); } }
      for (let k = 0; k < 40 && A.CAMP.i === i0 && !A.CAMP.done; k++) { if (A.G.state === 'paused') A.G.state = 'playing'; A.CAMP.talking = false; A.CAMP.q.length = 0; await w(250); if (k === 20) kill(); }
      return { moved: A.CAMP.i !== i0 || A.CAMP.done, dead: A.CAMP.dead, state: A.G.state, enemies: A.enemies.filter(e => e.camp && !e.camp.ally).length, err: (document.getElementById('err') || {}).textContent || '' };
    });
    r.steps.push(Object.assign(info, res));
    if (!res.moved) break;
  }
  await sim(1500);
  r.end = await p.evaluate(() => { const A = window.__A; return { done: A.CAMP.done, prog: A.PROG.camp && A.PROG.camp.done }; });
  await shot('end', 800);
  return r;
};
