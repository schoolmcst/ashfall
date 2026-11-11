// HOTBOX HORDE batch A (owner's 1-10): water, bugs, feeding, stars, breeding hybrids, greenhouse, curing, three buyers + prices,
// price board, kitchen + brownies on missions, big contracts
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp', shot = async (n, ms) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms || 1800); await p.screenshot({ path: SH + '/hh3_' + n + '.png' }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  const boot = async () => { await p.waitForTimeout(9000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e6; }); await p.waitForTimeout(1500); };
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} const A = window.__A, s = A.hhL.load(); s.cash = 20000; Object.assign(s.inv, { wood: 900, stone: 500, metal: 500, scrap: 60, wire: 20, battery: 20, nutri: 20, sap: 20 }); s.seeds.og = 20; s.seeds.haze = 20; A.hhL.save(s); A.G.noRender = true; A.actions('hh-play'); A.actions('hh-base'); });
  await boot();
  r.place = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), HH = A.HH_GET(); A.hhL.build(true); HH.cat = 1; let ok = []; const put = (id, x, z, yaw) => { HH.piece = A.hhL.pieces().findIndex(q => q.id === id); A.P.x = H.org.x + x; A.P.z = H.org.z + z; A.P.y = H.by; A.P.yaw = yaw; A.P.pitch = 0; ok.push(id + ':' + !!A.hhL.place()); };
    put('greenhouse', -6, 8.4, Math.PI); put('plot', -6.8, 10, Math.PI); put('plot', -5.2, 10, Math.PI); put('plot', -6, 11.2, Math.PI); put('cure', 6, 7, Math.PI); put('kitchen', 9, 7, Math.PI); put('prices', 7.5, 3.5, Math.PI); A.hhL.build(false); return ok.join(' '); });
  r.care = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s, pl = H.props.filter(q => q.k === 'plot'); const sel = ['og', 'haze', 'og']; pl.forEach((q, i) => { H.sel = sel[i]; A.P.x = q.x; A.P.z = q.z + 1; A.hhL.plotUse(q); }); const st = s.base.plots[pl[0].key];
    const wet = Date.now() < st.wt; st.wt = Date.now() - 1000; A.hhL.plotUse(pl[0]); const watered = Date.now() < st.wt; st.bug = 1; st.bugged = 1; const sap0 = s.inv.sap; A.hhL.plotUse(pl[0]); const sprayed = !st.bug && s.inv.sap === sap0 - 1; A.hhL.plotUse(pl[0]); return { wet, watered, sprayed, fed: st.fed }; });
  await p.waitForTimeout(1500);
  r.gh = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s, pl = H.props.filter(q => q.k === 'plot'); return pl.map(q => s.base.plots[q.key].gh); });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s, pl = H.props.filter(q => q.k === 'plot'); s.base.plots[pl[1].key].bug = 1; s.base.plots[pl[2].key].wt = Date.now() - 1000; for (const q of pl) { const st = s.base.plots[q.key]; st.p = [0.35, 0.6, 0.85][pl.indexOf(q)]; st.lt = Date.now(); } A.P.x = H.org.x - 6; A.P.z = H.org.z + 4.6; A.P.y = H.by + 0.5; A.P.yaw = Math.PI; A.P.pitch = -0.28; });
  await shot('greenhouse', 2500);
  // breeding: og next to haze, both ready
  r.breed = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s, pl = H.props.filter(q => q.k === 'plot'); let tries = 0, hy = null; const stars = [];
    while (tries++ < 20 && !hy) { for (const q of pl.slice(0, 2)) { const st = s.base.plots[q.key] || (H.sel = q === pl[0] ? 'og' : 'haze', A.hhL.plotUse(q), s.base.plots[q.key]); st.p = 1; st.lt = Date.now(); st.bug = 0; } A.hhL.plotUse(pl[0]); A.hhL.plotUse(pl[1]); hy = Object.keys(s.seeds).find(k => k.startsWith('x:') && s.seeds[k] > 0); }
    return { tries, hybrid: hy, name: hy && A.hhL.load && (window.__A.HHM_GET().s.seeds[hy] > 0) ? hy : null, buds: Object.assign({}, s.buds), bq: Object.assign({}, s.bq) }; });
  // plant the hybrid, harvest it
  r.hyGrow = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s, q = H.props.filter(o => o.k === 'plot')[0], hy = Object.keys(s.seeds).find(k => k.startsWith('x:') && s.seeds[k] > 0); if (!hy) return 'none'; if (s.base.plots[q.key]) delete s.base.plots[q.key]; H.sel = hy; A.hhL.plotUse(q); const st = s.base.plots[q.key]; st.p = 1; st.lt = Date.now(); A.hhL.plotUse(q); return { id: hy, buds: s.buds[hy] }; });
  // curing
  r.cure = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s; s.buds.north = 30; s.bq.north = 120; A.hhL.menu('cure'); const c = s.cure && Object.assign({}, s.cure); s.cure.t0 -= 11 * 60000; A.hhL.menu('cure'); return { started: c, cured: Object.assign({}, s.cbud) }; });
  // three buyers
  r.buyers = await p.evaluate(() => { const A = window.__A; return ['og', 'blue', 'north'].map(id => id + ' ' + ['buyer', 'doc', 'auntie'].map(b => A.hhL.price(id, b)).join('/')); });
  r.sell = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s; s.buds.blue = 10; s.bq.blue = 45; A.hhL.menu('buyer'); const c0 = s.cash; A.hhL.menuDo('sellb', 'doc|blue|0'); const c1 = s.cash; A.hhL.menuDo('sellb', 'buyer|north|1'); return { doc: c1 - c0, curedSale: s.cash - c1 }; });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s; s.buds.og = 30; s.buds.haze = 12; A.hhL.close(); A.hhL.menu('buyer'); });
  await shot('buyer', 1200);
  r.contract = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s, C = s.contract; for (const id of C.ids) s.buds[id] = 25; const c0 = s.cash; A.hhL.menuDo('contract', '1'); return { ids: C.ids, done: !s.contract, paid: s.cash - c0 }; });
  r.kitchen = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s; A.hhL.close(); s.buds.og = 20; A.hhL.menu('kitchen'); A.hhL.menuDo('bake', '5'); A.hhL.menuDo('eat', '1'); return { brownies: s.brownie, eat: s.eat }; });
  await shot('kitchen', 1200);
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), b = H.props.find(q => q.k === 'prices'); A.hhL.close(); A.P.x = b.x; A.P.z = b.z + 2.6; A.P.y = H.by; A.P.yaw = 0; A.P.pitch = 0.1; });
  await shot('prices', 2200);
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), b = H.props.find(q => q.k === 'cure'); A.P.x = b.x - 0.3; A.P.z = b.z + 2.4; A.P.yaw = 0; A.P.pitch = -0.1; });
  await shot('cure', 1800);
  // a brownie on a mission
  r.brownie = await p.evaluate(async () => { const A = window.__A; A.leaveGame(); await new Promise(r => setTimeout(r, 400)); const s = A.hhL.load(); s.mis = 0; A.hhL.save(s); A.G.noRender = true; A.actions('hh-play'); A.actions('hh-start'); });
  await p.waitForTimeout(9000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(2000);
  r.brownie = await p.evaluate(() => { const A = window.__A; return { maxHp: A.G.maxHp, left: A.hhL.load().brownie }; });
  return r;
};
