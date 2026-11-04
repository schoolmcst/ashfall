// LAST TOKE: 16 players on STASH ISLAND; the cloud closes far away; bots take the vehicles and drive to it; radar shows free ones
module.exports = async p => {
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.G.noRender = true; window.__A.startMatch('br', { map: 'random' }); });
  await p.waitForTimeout(4000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; });
  await p.waitForTimeout(1500);
  const r = {};
  r.s0 = await p.evaluate(() => { const A = window.__A; A.G.health = A.G.maxHp = 1e9; return { players: A.M.entries.length, bots: A.BR_API.brAliveBots().length, veh: A.VH.list.length }; });
  // the next circle is far in the north-east; every bot is put next to a vehicle in the south-west half, no fighting (no targets)
  r.set = await p.evaluate(() => { const A = window.__A, B = A.BR_API.BR; B.phase = 1; B.closing = true; B.t = 999; B.to = { x: 40, z: -40, r: 12 }; B.cx = 40; B.cz = -40; B.r = 14; A.P.x = 40; A.P.z = -38;
    const bots = A.BR_API.brAliveBots(), vs = A.VH.list.filter(v => Math.hypot(v.x - 40, v.z + 40) > 45); bots.forEach((e, i) => { const v = vs[i % vs.length]; e.group.position.set(v.x + 2.5, 0, v.z); e.goal = null; e.goalT = 0; e.tgt = null; e.iq = 0.01; e.vhNoT = 0; }); return { far: vs.length }; });
  const samp = [];
  for (let k = 0; k < 6; k++) { await p.waitForTimeout(5000); samp.push(await p.evaluate(() => { const A = window.__A; for (const e of A.enemies) { e.tgt = null; } const d = A.VH.list.filter(v => v.bot); return { t: +A.M.t.toFixed(1), driving: d.length, spd: d.map(v => +v.spd.toFixed(1)), stuck: d.map(v => +(v.stuckN || 0).toFixed(1)), dist: d.map(v => Math.round(Math.hypot(v.x - 40, v.z + 40))) }; })); }
  r.samp = samp;
  r.end = await p.evaluate(() => { const A = window.__A; const bs = A.BR_API.brAliveBots(); return { bots: bs.length, nearCircle: bs.filter(e => Math.hypot(e.group.position.x - 40, e.group.position.z + 40) < 30).length, dead: A.VH.list.filter(v => v.dead).length }; });
  return r;
};
