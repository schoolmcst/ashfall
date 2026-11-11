// HOTBOX HORDE batch F (owner's 45-55): hero levels + skills, abilities, new schematics, perks, repair, melee, survivors,
// crew orders and crew work, named crew levels
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp', shot = async (n, ms) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms || 1800); await p.screenshot({ path: SH + '/hh8_' + n + '.png' }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  const boot = async () => { await p.waitForTimeout(9000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } }); await p.waitForTimeout(1500); };
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} const A = window.__A, s = A.hhL.load(); s.cash = 20000; Object.assign(s.inv, { wood: 900, stone: 500, metal: 900, scrap: 200, wire: 60, battery: 60, nutri: 20, sap: 60 }); s.hx = { builder: 3000 }; s.surv = 3; A.hhL.save(s); A.showScreen('menu'); A.actions('hh-play'); A.actions('hh-sk-armor'); A.actions('hh-sk-armor'); A.actions('hh-sk-fire'); });
  r.lobby = await p.evaluate(() => { const A = window.__A, s = A.hhL.load(); return { hero: A.hhHeroL(s), crewN: s.crewN }; });
  await p.waitForTimeout(400); await p.screenshot({ path: SH + '/hh8_lobby.png' });
  await p.evaluate(() => { const A = window.__A; A.G.noRender = true; A.actions('hh-base'); }); await boot();
  r.base = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); return { maxHp: A.G.maxHp, heroLv: H.heroLv, survivors: (H.survivors || []).length, crew: A.enemies.filter(e => e.entry).map(e => e.entry.name) }; });
  // abilities: builder wall
  r.wall = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); A.P.x = H.org.x + 6; A.P.z = H.org.z + 9; A.P.yaw = 0; const n = H.pieces.length; A.hhAbilL(); return { added: H.pieces.length - n, mat: H.pieces[H.pieces.length - 1] && H.pieces[H.pieces.length - 1].mat, cd: A.HH_GET().abT }; });
  // the workbench: new guns with perks, repair, melee
  r.bench = await p.evaluate(() => { const A = window.__A, s = A.HHM_GET().s; A.hhL.menu('bench'); A.hhL.menuDo('gun', 'xbow'); A.hhL.menuDo('gun', 'bong'); const d0 = s.arsenal[0].dur; A.hhL.menuDo('repair', '0'); A.hhL.menuDo('melee', 'machete'); return { arsenal: s.arsenal.map(g => g.id + ':' + g.perk + ':' + g.dur), d0, melee: s.melee }; });
  await shot('bench', 1200);
  r.crew = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(), s = H.s; A.hhL.close(); A.G.state = 'playing'; A.showScreen(null); const w = H.pieces[H.pieces.length - 1]; w.hp = 100; A.hhOrderL(); A.hhOrderL(); const o1 = A.HH_GET().order; const inv0 = s.inv.wood + s.inv.stone + s.inv.metal; await new Promise(r => setTimeout(r, 14000)); const inv1 = s.inv.wood + s.inv.stone + s.inv.metal; A.hhOrderL(); const o2 = A.HH_GET().order; await new Promise(r => setTimeout(r, 12000)); return { o1, harvested: inv1 - inv0, o2, wallHp: Math.round(w.hp), max: w.max }; });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); const sv = H.survivors[0]; A.P.x = sv.g.position.x + 3; A.P.z = sv.g.position.z + 3; A.P.y = H.by; A.P.yaw = Math.atan2(3, 3); A.P.pitch = -0.1; });
  await shot('survivors', 2000);
  // a mission with the crossbow, scrapper ground pound + medic later
  r.mission = await p.evaluate(async () => { const A = window.__A; A.leaveGame(); await new Promise(r => setTimeout(r, 400)); const s = A.hhL.load(); s.mis = 0; s.eq = 0; s.hero = 'scrapper'; A.hhL.save(s); A.G.noRender = true; A.actions('hh-play'); A.actions('hh-start'); });
  await boot();
  r.mission = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); const st = { gun: H.gunId, perk: H.gun && H.gun.perk, cur: A.WEAPONS_L ? '' : '' }; const ms = []; for (let i = 0; i < 4; i++) ms.push(A.hhL.mob('burnout', A.P.x + 2 + i * 0.5, A.P.z + 1, A.P.y)); for (const e of ms) e.hp = e.maxHp = 1000; A.hhAbilL(); st.pound = ms.map(e => 1000 - Math.round(e.hp)); for (const e of H.mobs.slice()) A.damageEnemy(e, 1e6, false, null, false, 'world'); return st; });
  return r;
};
