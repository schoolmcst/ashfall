// STASH ISLAND: LAST TOKE on 'random' picks it; nav covers the whole island; bots path; frame times; pictures
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); for (const o of document.querySelectorAll('.onb-ov')) o.remove(); window.__A.startMatch('br', { map: 'random' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; });
  await p.waitForTimeout(4000);
  r.s0 = await p.evaluate(() => { const A = window.__A, B = A.BR_API.BR; let walk = 0; for (let i = 0; i < A.NN * A.NN; i++) walk += A.lvN[i] ? 1 : 0;
    const t = performance.now(); A.FLOW.clear(); A.flowField(0, 0, 0); const ff = performance.now() - t;
    return { map: A.curMap, NN: A.NN, walkCells: walk, flowMs: +ff.toFixed(1), players: A.M.entries.length, bots: A.BR_API.brAliveBots().length, crates: B.crates.length, r: Math.round(B.r), buildMs: A.MAP_BUILD_MS }; });
  // the bots move about for a while (they spread out to crates)
  const pos0 = await p.evaluate(() => window.__A.BR_API.brAliveBots().map(e => [e.group.position.x, e.group.position.z]));
  await p.evaluate(() => { window.__A.G.health = window.__A.G.maxHp = 1e9; });
  await p.waitForTimeout(12000);
  r.s1 = await p.evaluate(p0 => { const A = window.__A, bs = A.BR_API.brAliveBots(); const moved = bs.map((e, i) => p0[i] ? Math.hypot(e.group.position.x - p0[i][0], e.group.position.z - p0[i][1]) : 0); return { bots: bs.length, movedAvg: +(moved.reduce((a, b) => a + b, 0) / Math.max(1, moved.length)).toFixed(1), movedMin: +Math.min(...moved).toFixed(1), open: A.BR_API.BR.crates.filter(c => c.open).length, fields: A.FLOW.size, mt: +A.M.t.toFixed(1) }; }, pos0);
  for (const [i, v] of (await p.evaluate(() => window.__A.MAPS.stashisle.views)).entries()) {
    await p.evaluate(v => { const A = window.__A; A.P.x = v[0]; A.P.z = v[2]; A.P.y = v[1] - 1.7; A.P.yaw = Math.atan2(-(v[3] - v[0]), -(v[5] - v[2])); A.P.pitch = Math.atan2(v[4] - v[1], Math.hypot(v[3] - v[0], v[5] - v[2])); }, v);
    await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, `isle_${i}.png`), timeout: 120000 });
  }
  return r;
};
