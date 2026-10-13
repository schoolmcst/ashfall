// MAP=town: put bots at given spots with a fixed goal and trace where they go
module.exports = async p => p.evaluate(async id => {
  const A = window.__A; A.G.noRender = true;
  A.startMatch('tdm', { score: 999, time: 0, perTeam: 2, skill: 'regular', custom: true, map: id });
  A.G.spawnProt = 1e9; A.G.health = 1e9;
  const tests = window.NAVT || [[-30, -4, 0, -6, 5, 3], [0, 30, 0, -6, 5, 3], [30, 30, 0, 40, 3, 6.6], [-38, 30, 0, -18, 20, 1.5]];
  const bots = A.enemies.slice(0, tests.length), out = [];
  bots.forEach((e, i) => { const t = tests[i]; e.group.position.set(t[0], t[2], t[1]); e.tgtLock = true; });
  // freeze thinking: fixed goals, no targets
  const t0 = performance.now(); const trace = bots.map(() => []);
  for (let k = 0; k < 40; k++) {
    bots.forEach((e, i) => { const t = tests[i]; e.goal = { x: t[3], z: t[4], y: t[5] }; e.goalT = 1e9; e.tgt = null; e.think = 1e9; e.role = 'obj'; e.hold = 0; });
    await new Promise(r => setTimeout(r, 500));
    bots.forEach((e, i) => trace[i].push([+e.group.position.x.toFixed(1), +e.group.position.z.toFixed(1), +e.group.position.y.toFixed(1)]));
  }
  A.G.noRender = false;
  return trace.map((tr, i) => ({ test: tests[i], end: tr[tr.length - 1], path: tr.filter((_, j) => j % 5 === 4) }));
}, process.env.MAP || 'town');
