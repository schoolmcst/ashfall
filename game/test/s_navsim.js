// bots walk between random objective/spawn points; report how many arrive and where the failures stall
module.exports = async p => p.evaluate(async id => {
  const A = window.__A; A.G.noRender = true;
  A.startMatch('tdm', { score: 999, time: 0, perTeam: 6, skill: 'regular', custom: true, map: id });
  A.G.spawnProt = 1e9; A.G.health = 1e9;
  const L = A.LAYOUT, pts = [...L.spawn, ...L.hp, ...L.sites, ...(A.MAPS[id].navPts || [])].map(p => ({ x: p.x, z: p.z, y: p.y || 0 }));
  const bots = A.enemies.slice(), res = [];
  const assign = e => { let g; do { g = pts[(Math.random() * pts.length) | 0]; } while (Math.hypot(g.x - e.group.position.x, g.z - e.group.position.z) < 8); e._g = g; e._t = 0; e._from = [+e.group.position.x.toFixed(0), +e.group.position.z.toFixed(0), +e.group.position.y.toFixed(1)]; };
  bots.forEach(assign);
  for (let k = 0; k < 120; k++) {
    for (const e of bots) { if (!A.enemies.includes(e)) continue; e.goal = e._g; e.goalT = 1e9; e.tgt = null; e.think = 1e9; e.role = 'obj'; e.hold = 0; e.cd = 9; }
    await new Promise(r => setTimeout(r, 250));
    for (const e of bots) {
      e._t += 0.25; const g = e._g, P = e.group.position;
      if (Math.hypot(g.x - P.x, g.z - P.z) < 2.5 && Math.abs(g.y - P.y) < 1.2) { res.push({ ok: 1, t: e._t }); assign(e); }
      else if (e._t > 26) { res.push({ ok: 0, from: e._from, to: [g.x, g.z, g.y], at: [+P.x.toFixed(1), +P.z.toFixed(1), +P.y.toFixed(1)] }); assign(e); }
    }
  }
  A.G.noRender = false;
  const ok = res.filter(r => r.ok), bad = res.filter(r => !r.ok);
  return { trips: res.length, arrived: ok.length, avgT: +(ok.reduce((s, r) => s + r.t, 0) / Math.max(1, ok.length)).toFixed(1), failed: bad };
}, process.env.MAP || 'town');
