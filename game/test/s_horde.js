// HOTBOX HORDE: lobby; THE HOMESTEAD (stations, grow plots, real-time growth, harvest, THE BUYER, WORKBENCH crafting,
// THE PLANS raid to expand); the base is saved and comes back; a SUPPLY RUN and a DEFEND THE GROW mission and their pay
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp', shot = async (n, ms) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms || 1600); await p.screenshot({ path: SH + '/hh_' + n + '.png' }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  const boot = async () => { await p.waitForTimeout(9000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e6; }); await p.waitForTimeout(1500); };
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} });
  r.lobby = await p.evaluate(() => { const A = window.__A; A.showScreen('menu'); const tile = !!document.getElementById('hhTile'); A.actions('hh-play'); return { tile, kind: document.getElementById('lobKind').textContent, rows: [...document.querySelectorAll('#lobSel .cod-row small')].map(x => x.textContent), save: A.hhL.load() }; });
  await p.waitForTimeout(500); await p.screenshot({ path: SH + '/hh_lobby.png' });
  // THE HOMESTEAD
  await p.evaluate(() => { const A = window.__A; A.G.noRender = true; A.actions('hh-base'); }); await boot();
  r.base = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); return { map: A.curMap, kind: H.kind, stations: H.props.map(s => s.k), nodes: H.nodes.length, plant: !!H.plant, crew: A.enemies.filter(e => e.entry).length, fences: 0 }; });
  // build: walls round a yard, four plots, traps; then plant, grow, harvest
  r.build = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), HH = A.HH_GET(), s = H.s; s.inv.wood += 600; s.inv.stone += 400; s.inv.metal += 300; s.seeds.og = 4; s.seeds.haze = 2; s.seeds.north = 1; A.hhL.build(true); let ok = 0;
    const L = A.hhL.pieces(), idx = id => L.findIndex(x => x.id === id);
    const at = (x, z, yaw, piece, mat) => { A.P.x = H.org.x + x; A.P.z = H.org.z + z; A.P.y = H.by; A.P.yaw = yaw; A.P.pitch = 0; HH.cat = piece === 'plot' ? 1 : 0; HH.piece = A.hhL.pieces().findIndex(q => q.id === piece); HH.mat = mat || 'wood'; const n = H.pieces.length; A.hhL.place(); if (H.pieces.length > n) ok++; };
    for (const [x, z] of [[-3.5, 5], [-2, 5], [-0.5, 5], [1, 5], [2.5, 6.5]]) at(x, z - 2.0, Math.PI, 'plot');   // small plots anywhere (looking +z = yaw PI)
    for (const ix of [-2, -1, 0, 1, 2]) at(ix * 3, 9, Math.PI, 'wall', 'stone');
    for (const iz of [-1, 0, 1]) { at(-12, iz * 3, Math.PI / 2, 'wall', 'wood'); }
    s.traps.spikes = 3; s.traps.zapper = 1; at(0, -6 + 2.6, 0, 'spikes'); at(-6, -6 + 2.6, 0, 'zapper');
    A.hhL.build(false);
    const plots = H.props.filter(q => q.k === 'plot'); const sd = ['og', 'haze', 'north', 'og'];
    plots.slice(0, 4).forEach((q, i) => { A.P.x = q.x; A.P.z = q.z + 1.2; H.sel = sd[i]; A.hhL.plotUse(q); });
    // jump growth along: 100%, 70%, 40%, 15%
    plots.slice(0, 4).forEach((q, i) => { const st = s.base.plots[q.key]; st.t0 = Date.now() - [1, 0.7, 0.4, 0.15][i] * 60000 * { og: 6, haze: 10, north: 20 }[st.st]; });
    return { ok, pieces: H.pieces.length, props: H.props.map(q => q.k + '@' + q.x + ',' + q.z).join(' '), plots: plots.length, planted: Object.keys(s.base.plots).length, saved: s.base.pieces.length, k: plots.slice(0, 4).map(q => A.hhL.growK(s.base.plots[q.key]).toFixed(2)) }; });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); A.P.x = H.org.x - 1; A.P.z = H.org.z + 1.6; A.P.y = H.by + 0.6; A.P.yaw = Math.PI * 1.04; A.P.pitch = -0.3; });
  await shot('plots', 2500);
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); A.P.x = H.org.x + 15; A.P.z = H.org.z - 17; A.P.y = H.by + 6; A.P.yaw = Math.atan2(15, -17) + 0.15; A.P.pitch = -0.33; });
  await shot('base', 2500);
  r.harvest = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s, q = H.props.filter(x => x.k === 'plot')[0], b0 = JSON.stringify(s.buds); A.hhL.plotUse(q); s.inv.nutri = 3; const q2 = H.props.filter(x => x.k === 'plot')[1]; A.hhL.plotUse(q2); return { before: b0, buds: Object.assign({}, s.buds), fed: s.base.plots[q2.key].fed, empty: !s.base.plots[q.key] }; });
  // MOVE things: the workbench to a new spot, a wall to another cell
  r.move = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), HH = A.HH_GET(), b = H.props.find(q => q.k === 'bench'), from = [b.x, b.z]; A.hhL.build(true);
    A.hhL.look({ prop: b }); A.hhL.pickUp(); const carrying = !!HH.carry; A.P.x = -4; A.P.z = -6; A.P.y = H.by; A.P.yaw = 0; A.P.pitch = -0.2; HH.carry.r = 0; A.hhL.place(); const to = [b.x, b.z];
    const w = H.pieces.find(q => q.id === 'wall'), wk = w.key; A.hhL.look(w); A.hhL.pickUp(); A.P.x = 6; A.P.z = -6; A.P.yaw = Math.PI / 2; A.hhL.place(); const w2 = H.pieces.filter(q => q.id === 'wall').map(q => q.key);
    // carry the BUYER for a picture
    const buyer = H.props.find(q => q.k === 'buyer'); A.hhL.look({ prop: buyer }); A.hhL.pickUp(); A.P.x = 4; A.P.z = -2; A.P.yaw = -2.3; A.P.pitch = -0.25;
    return { carrying, from, to, saved: A.hhL.load().base.props.find(q => q.k === 'bench'), wallMoved: !w2.includes(wk), walls: w2.length }; });
  await shot('carry', 2000);
  r.moveEnd = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); A.hhL.place(); A.hhL.build(false); const b = H.props.find(q => q.k === 'buyer'); return [b.x, b.z, b.r]; });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); A.P.x = H.org.x + 12; A.P.z = H.org.z - 13; A.P.y = H.by + 5; A.P.yaw = Math.atan2(12, -13) + 0.1; A.P.pitch = -0.36; });
  await shot('base2', 2500);
  // THE BUYER: sell, buy seeds
  r.buyer = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s; s.buds.blue = 12; const c0 = s.cash; A.hhL.menu('buyer'); A.hhL.menuDo('sell', 'all'); const c1 = s.cash; A.hhL.menuDo('seed', 'haze'); s.buds.haze = 6; s.buds.north = 3; A.hhL.menuDo('x'); return { sold: c1 - c0, cash: s.cash, seeds: Object.assign({}, s.seeds) }; });
  await shot('buyer', 1200);
  // WORKBENCH: traps and a gun
  r.bench = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s; A.hhL.close(); Object.assign(s.inv, { scrap: 40, wire: 12, battery: 8, nutri: 6, sap: 12 }); s.cash += 6000; A.hhL.menu('bench'); A.hhL.menuDo('trap5', 'spikes'); A.hhL.menuDo('trap', 'zapper'); A.hhL.menuDo('trap', 'launcher'); A.hhL.menuDo('bench', '1'); A.hhL.menuDo('gun', 'ar'); A.hhL.menuDo('x'); return { traps: Object.assign({}, s.traps), arsenal: s.arsenal, eq: s.eq, bench: s.base.bench }; });
  await shot('bench', 1200);
  r.plans = await p.evaluate(() => { const A = window.__A; A.hhL.close(); A.hhL.menu('plans'); return document.querySelector('#hhMenu .hh-mbox small').textContent; });
  await shot('plans', 1200);
  // a RAID to level 2
  r.raid = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(), s = H.s; A.hhL.menuDo('raid', '1'); const st = { phase: H.phase, waves: H.waves, raid: !!H.raid }; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } A.hhL.wave(); await new Promise(r => setTimeout(r, 12000)); st.mobs = H.mobs.length; st.close = H.mobs.length ? Math.min(...H.mobs.map(e => Math.hypot(e.group.position.x, e.group.position.z))).toFixed(1) : '-'; return st; });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), e = H.mobs[0]; if (e) { A.P.x = e.group.position.x * 0.5; A.P.z = e.group.position.z * 0.5 + 3; A.P.y = H.by; A.P.yaw = Math.atan2(-(e.group.position.x - A.P.x), -(e.group.position.z - A.P.z)) + Math.PI; A.P.pitch = -0.05; } });
  await shot('raid', 1500);
  r.raidEnd = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(), s = H.s; for (let w = 0; w < 6 && H.raid; w++) { for (const e of H.mobs.slice()) A.damageEnemy(e, 1e6, false, null, false, 'world'); H.toSpawn = 0; await new Promise(r => setTimeout(r, 800)); if (H.raid && H.phase === 'prep') A.hhL.wave(); } return { lv: s.base.lv, phase: H.phase, cash: s.cash }; });
  // leave and come back: the base is still there
  r.reload = await p.evaluate(async () => { const A = window.__A, n0 = A.HHM_GET().pieces.length; A.leaveGame(); await new Promise(r => setTimeout(r, 500)); A.actions('hh-play'); A.actions('hh-base'); return n0; });
  await boot();
  r.reload = await p.evaluate(n0 => { const A = window.__A, H = A.HHM_GET(); return { before: n0, after: H.pieces.length, bench: (H.props.find(q => q.k === 'bench') || {}).x + ',' + (H.props.find(q => q.k === 'bench') || {}).z, plots: H.props.filter(q => q.k === 'plot').length, growing: Object.keys(H.s.base.plots).length, lv: H.s.base.lv }; }, r.reload);
  // a SUPPLY RUN on THE GREENHOUSE
  await p.evaluate(async () => { const A = window.__A; A.leaveGame(); await new Promise(r => setTimeout(r, 400)); const s = A.hhL.load(); s.mis = 1; A.hhL.save(s); A.actions('hh-play'); A.actions('hh-start'); }); await boot();
  r.supply = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); const st = { kind: H.kind, map: A.curMap, caches: H.caches.length, gun: A.WEAPONS_GET ? '' : '', plant: !!H.plant }; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } await new Promise(r => setTimeout(r, 6000)); st.mobs = H.mobs.length; return st; });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), c = H.caches[0]; A.P.x = c.x + 2.2; A.P.z = c.z + 1.2; A.P.y = c.y; A.P.yaw = Math.atan2(2.2, 1.2); A.P.pitch = -0.3; });
  await shot('cache', 1500);
  r.supplyEnd = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); for (const c of H.caches.slice(0, 6)) A.hhL.cache(c); await new Promise(r => setTimeout(r, 1500)); const v = H.van; if (!v) return 'no van'; A.P.x = v.x + 3.4; A.P.z = v.z + 2; A.P.y = v.y; A.P.yaw = Math.atan2(3.4, 2); A.P.pitch = -0.05; window.__vanShot = { x: v.x, z: v.z }; return { van: true, phase: H.phase }; });
  await p.evaluate(() => { const A = window.__A, v = window.__vanShot, H = A.HHM_GET(); const o = A.openNearL(v.x + 9, v.z + 6); H.van.t = 0; A.P.x = o.x; A.P.z = o.z; A.P.yaw = Math.atan2(o.x - v.x, o.z - v.z); });
  await shot('van', 1500);
  await p.evaluate(() => { const A = window.__A, v = window.__vanShot; A.P.x = v.x + 3.4; A.P.z = v.z + 2; });
  await p.evaluate(async () => { await new Promise(r => setTimeout(r, 9000)); });
  r.supplyRes = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); return H ? { over: H.over, res: H.res, state: A.G.state } : 'cleared'; });
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1200); await p.screenshot({ path: SH + '/hh_results.png' });
  // a DEFEND THE GROW mission, won by force
  await p.evaluate(async () => { const A = window.__A; A.leaveGame(); await new Promise(r => setTimeout(r, 400)); const s = A.hhL.load(); s.mis = 3; A.hhL.save(s); A.G.noRender = true; A.actions('hh-play'); A.actions('hh-start'); }); await boot();
  r.defend = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); const st = { kind: H.kind, map: A.curMap, gun: H.gunId, plant: !!H.plant }; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; }
    for (let w = 0; w < 8 && !H.over; w++) { if (H.phase === 'prep') A.hhL.wave(); await new Promise(r => setTimeout(r, 1200)); for (const e of H.mobs.slice()) A.damageEnemy(e, 1e6, false, null, false, 'world'); H.toSpawn = 0; await new Promise(r => setTimeout(r, 600)); }
    await new Promise(r => setTimeout(r, 2500)); st.over = H.over; st.res = H.res && { won: H.res.won, pay: H.res.pay }; st.gunAfter = A.hhL.load().arsenal; return st; });
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1200); await p.screenshot({ path: SH + '/hh_results2.png' });
  return r;
};
