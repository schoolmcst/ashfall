// STASH ISLAND, no rendering: do bots get around, and what does pathing cost?
module.exports = async p => {
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.G.noRender = true; window.__A.startMatch('br', { map: 'random' }); });
  await p.waitForTimeout(4000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; });
  await p.waitForTimeout(2000);
  const r = await p.evaluate(() => { const A = window.__A; A.G.health = A.G.maxHp = 1e9; A.FLOW.clear(); A.FLOWB.t = -2; const t = performance.now(); A.flowField(0, 0, 0); const one = performance.now() - t; A.FLOWB.t = -3; const t2 = performance.now(); A.flowField(-46, 3.6, 5); return { oneFieldMs: +one.toFixed(1), towerFieldMs: +(performance.now() - t2).toFixed(1), p0: A.BR_API.brAliveBots().map(e => [e.group.position.x, e.group.position.z]), t0: A.M.t }; });
  await p.waitForTimeout(40000);
  return await p.evaluate(r => { const A = window.__A, bs = A.BR_API.brAliveBots(); const mv = bs.map((e, i) => r.p0[i] ? Math.hypot(e.group.position.x - r.p0[i][0], e.group.position.z - r.p0[i][1]) : 0).sort((a, b) => a - b);
    return { oneFieldMs: r.oneFieldMs, towerFieldMs: r.towerFieldMs, simSecs: +(A.M.t - r.t0).toFixed(1), bots: bs.length, moved: mv.map(v => Math.round(v)), opened: A.BR_API.BR.crates.filter(c => c.open).length, fields: A.FLOW.size, kills: A.M.entries.reduce((a, e) => a + (e.kills || 0), 0) }; }, r);
};
