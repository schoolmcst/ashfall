// HOTBOX HORDE MORE: build categories, grow gear (sprinkler / grow light boosts, compost, auto-trimmer), decor, repair and
// upgrade, DRIFTER / BLOATER, THE BUYER's daily order, the WILD HARVEST mission
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp', shot = async (n, ms) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms || 1800); await p.screenshot({ path: SH + '/hh2_' + n + '.png' }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  const boot = async () => { await p.waitForTimeout(9000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e6; }); await p.waitForTimeout(1500); };
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} const A = window.__A, s = A.hhL.load(); s.cash = 9000; Object.assign(s.inv, { wood: 900, stone: 500, metal: 500, scrap: 60, wire: 20, battery: 20, nutri: 5, sap: 20 }); s.seeds.og = 6; s.seeds.blue = 2; A.hhL.save(s); A.G.noRender = true; A.actions('hh-play'); A.actions('hh-base'); });
  await boot();
  const place = (list) => p.evaluate(list => { const A = window.__A, H = A.HHM_GET(), HH = A.HH_GET(); if (!H) return 'no M.hh: ' + (A.M && A.M.mode) + ' ' + A.G.state + ' ' + A.curMap; A.hhL.build(true); let ok = 0; for (const [cat, id, x, z, yaw] of list) { HH.cat = cat; HH.piece = A.hhL.pieces().findIndex(q => q.id === id); A.P.x = H.org.x + x; A.P.z = H.org.z + z; A.P.y = H.by; A.P.yaw = yaw; A.P.pitch = 0; if (A.hhL.place()) ok++; } A.hhL.build(false); return ok; }, list);
  // GROW gear round two plots (south-west of the plant)
  r.grow = await place([[1, 'plot', -6, 4, Math.PI], [1, 'plot', -4.5, 4, Math.PI], [1, 'sprinkler', -5.2, 2.8, Math.PI], [1, 'lamp', -3.5, 2.8, Math.PI], [1, 'compost', -8.5, 3, Math.PI], [1, 'trimmer', -2.5, 4.5, Math.PI]]);
  if (typeof r.grow === "string") return r;
  r.boost = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(), s = H.s, plots = H.props.filter(q => q.k === 'plot'); for (const q of plots) { A.P.x = q.x; A.P.z = q.z + 1; A.hhL.plotUse(q); } await new Promise(r => setTimeout(r, 1500)); const st = plots.map(q => s.base.plots[q.key]); return { kinds: H.props.map(q => q.k).join(','), sp: st.map(x => x && x.sp), yb: st.map(x => x && x.yb) }; });
  r.trim = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(), s = H.s, plots = H.props.filter(q => q.k === 'plot'), b0 = JSON.stringify(s.buds); for (const q of plots) s.base.plots[q.key].t0 = Date.now() - 3600000; A.P.x = 20; A.P.z = 20; await new Promise(r => setTimeout(r, 7000)); return { before: b0, after: JSON.stringify(s.buds), left: plots.filter(q => s.base.plots[q.key]).length }; });
  r.compost = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s, c = H.props.find(q => q.k === 'compost'), n0 = s.inv.nutri; c.rec.t0 = Date.now() - 17 * 60000; const n = A.hhL.compostN(c); A.P.x = c.x + 1.2; A.P.z = c.z; A.HH_GET().menu = null; window.__A.hhL.menu('compost'); return { ready: n, got: s.inv.nutri - n0 }; });
  // DECOR
  r.decor = await p.evaluate(() => { const A = window.__A; return A.hhL.load().cash; });
  r.decorN = await place([[2, 'couch', 6, 6, Math.PI], [2, 'picnic', 9.5, 5.5, Math.PI], [2, 'bong', 4, 9, Math.PI], [2, 'neon', 7, 10, Math.PI], [2, 'lights', 10, 8.5, Math.PI], [2, 'rack', 12.5, 4, Math.PI], [2, 'torch', 3, 5.5, Math.PI], [2, 'flag', 13, 9, Math.PI]]);
  r.cash = await p.evaluate(() => window.__A.HHM_GET().s.cash);
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); A.P.x = 8; A.P.z = 1.5; A.P.y = H.by + 0.2; A.P.yaw = Math.PI * 1.05; A.P.pitch = -0.12; });
  await shot('decor', 2500);
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); A.P.x = -4.5; A.P.z = -0.5; A.P.y = H.by + 0.4; A.P.yaw = Math.PI * 0.97; A.P.pitch = -0.25; A.hhL.build(true); A.HH_GET().cat = 1; });
  await shot('grow', 2500);
  await p.evaluate(() => window.__A.hhL.build(false));
  // repair and upgrade a wall
  r.fix = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), HH = A.HH_GET(); A.hhL.build(true); HH.cat = 0; HH.piece = 0; HH.mat = 'wood'; A.P.x = H.org.x + 3; A.P.z = H.org.z - 9; A.P.yaw = 0; const w = A.hhL.place(); w.hp = 40; A.hhL.look(w); A.hhL.fix(); const rep = w.hp; const w2 = H.pieces[H.pieces.length - 1]; A.hhL.look(w2); A.hhL.fix(); const up = H.pieces[H.pieces.length - 1]; A.hhL.build(false); return { repaired: rep, max: w.max, mat: up.mat, saved: H.s.base.pieces.filter(q => q.id === 'wall').map(q => q.mat) }; });
  // DRIFTER and BLOATER
  r.mobs = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } const d = A.hhL.mob('drifter', H.plant.x + 9, H.plant.z + 4, H.by), b = A.hhL.mob('bloater', H.plant.x + 3, H.plant.z - 7.5, H.by); const y0 = d.group.position.y; await new Promise(r => setTimeout(r, 2500)); const wall = H.pieces.find(q => q.id === 'wall'), hp0 = wall ? wall.hp : 0; return { flyY: +(d.group.position.y - H.by).toFixed(2), dDist: +Math.hypot(d.group.position.x - H.plant.x, d.group.position.z - H.plant.z).toFixed(1), bloat: !!b.K.bloat, wallHp: hp0 }; });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); A.P.x = H.plant.x + 9; A.P.z = H.plant.z + 9; A.P.y = H.by; A.P.yaw = Math.atan2(9, 9) - 0.25; A.P.pitch = 0.05; });
  await shot('mobs', 1800);
  r.boom = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), wall = H.pieces.find(q => q.id === 'wall'), b = A.hhL.mob('bloater', wall.cx + 0.8, wall.cz + 0.8, H.by); b.group.position.set(wall.cx + 0.8, H.by, wall.cz + 0.8); const hp0 = wall.hp; A.hhL.bloat(b); return { hp0, hp1: wall.hp, alive: A.enemies.includes(b) }; });
  // THE BUYER's order
  r.order = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s, O = A.hhL.order(); s.buds[O.st] = O.n + 2; const c0 = s.cash; A.hhL.menu('buyer'); return { O, c0 }; });
  await shot('order', 1200);
  r.orderDone = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s; A.hhL.menuDo('order', '1'); A.hhL.close(); return { cash: s.cash, done: s.orderDone }; });
  // WILD HARVEST on THE GREENHOUSE (mission 3 of 12: greenhouse defend, supply, wild)
  await p.evaluate(async () => { const A = window.__A; A.leaveGame(); await new Promise(r => setTimeout(r, 400)); const s = A.hhL.load(); s.mis = 2; A.hhL.save(s); A.G.noRender = true; A.actions('hh-play'); A.actions('hh-start'); }); await boot();
  r.wild = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } return { kind: H.kind, plants: H.caches.filter(c => c.wild).length, st: H.caches.map(c => c.st).join(',') }; });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); let c = H.caches[0], dx = 3, dz = 0; for (const q of H.caches) for (const a of [0, 1.57, 3.14, 4.71]) { const x = Math.cos(a) * 3.5, z = Math.sin(a) * 3.5; if (A.gridClearL(q.x, q.z, q.x + x, q.z + z, q.y, q.y)) { c = q; dx = x; dz = z; break; } } A.P.x = c.x + dx; A.P.z = c.z + dz; A.P.y = c.y; A.P.yaw = Math.atan2(dx, dz); A.P.pitch = -0.05; });
  await shot('wild', 1800);
  r.wildEnd = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); for (const c of H.caches.slice(0, 6)) A.hhL.cache(c); await new Promise(r => setTimeout(r, 1500)); const v = H.van; A.P.x = v.x + 3.4; A.P.z = v.z + 2; A.P.y = v.y; await new Promise(r => setTimeout(r, 9000)); return { over: H.over, res: H.res && { won: H.res.won, got: H.res.got } }; });
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/hh2_results.png' });
  return r;
};
