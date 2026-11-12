// HOTBOX HORDE batch E (37-44): heroes, outfits, gun mods, ammo, gadgets, crew kit, the dog, morale
module.exports = async p => { const r = {}; try { await run(p, r); } catch (e) { r.FAIL = String(e).slice(0, 400); } return r; };
const run = async (p, r) => {
  const SH = process.env.SHOTS || '/tmp', ev = (f, a) => p.evaluate(f, a);
  const shot = async (n, ms) => { await ev(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms || 1800); await p.screenshot({ path: SH + '/hh12_' + n + '.png' }); await ev(() => { window.__A.G.noRender = true; }); };
  const boot = async () => { await p.waitForTimeout(9000); await ev(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; for (const e of A.enemies) if (e.entry) { e.acc = 0; } }); await p.waitForTimeout(1500); await ev(() => { const A = window.__A; if (A.G.state === 'paused') { A.G.state = 'playing'; A.showScreen(null); } A.G.health = A.G.maxHp = 1e9; }); };
  await ev(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} const A = window.__A; A.HHS_GET().force = ''; const s = A.hhL.load(); s.tutSeen = 1; s.tutDone = 1; s.cash = 90000; Object.assign(s.inv, { wood: 900, stone: 600, metal: 900, scrap: 200, wire: 60, battery: 60, nutri: 20, sap: 60 }); s.buds.og = 20; s.outfits = { out2: 1, out4: 1 }; s.morale = 25; s.mis = 7; s.hero = 'engineer'; A.hhL.save(s); A.showScreen('menu'); A.hhOpenL(); for (const o of document.querySelectorAll('.onb-ov')) o.remove(); });
  // the workbench in the base: craft a gun, mods, ammo, crew kit, a trap as the engineer (25% back)
  await ev(() => { window.__A.G.noRender = true; window.__A.actions('hh-base'); }); await boot();
  r.bench = await ev(() => { const A = window.__A, s = A.HHM_GET().s; A.hhL.menu('bench'); A.hhL.menuDo('gun', 'ar'); s.eq = s.arsenal.length - 1; for (const k of ['mag', 'scope', 'glue']) A.hhL.menuDo('gmod', k); A.hhL.menuDo('ammo', 'fire'); A.hhL.menuDo('ammo', 'shock'); A.hhL.menuDo('ckit', ''); A.hhL.menuDo('ckit', '');
    const m0 = s.inv.metal; A.hhL.menuDo('trap', 'spikes'); const paid = m0 - s.inv.metal; const txt = document.getElementById('hhMenu').innerText; A.hhL.close(); A.hhL.save(s); return { mods: s.arsenal[s.eq].mods, ammo: s.ammo, ckit: s.ckit, spikesPaidMetal: paid, sections: ['GUN MODS', 'SPECIAL AMMO', 'CREW KIT'].filter(h => txt.includes(h)) }; });
  await ev(() => { const A = window.__A; A.hhL.menu('bench'); }); await shot('bench', 1200); await ev(() => { const A = window.__A; A.hhL.close(); A.G.state = 'playing'; A.showScreen(null); A.leaveGame(); });
  // the lobby: gadget, ammo, outfit, dog, feed the crew
  await p.waitForTimeout(500); await ev(() => { window.__A.hhOpenL(); }); for (const a of ['hhg-ammo', 'hhg-out', 'hhg-dog', 'hhg-feed', 'hhg-gad']) await ev(a => window.__A.actions(a), a);
  r.lobby = await ev(() => { const s = window.__A.hhL.load(); return { gadget: s.gadget, ammoSel: s.ammoSel, outfit: s.outfit, dog: s.dog, morale: s.morale, rows: [...document.querySelectorAll('.hhg-row b')].map(b => b.textContent) }; });
  await p.screenshot({ path: SH + '/hh12_lobby.png' });
  // a mission as the engineer: mag mod, ammo pack, crew kit, the dog, the drone
  await ev(() => { window.__A.G.noRender = true; window.__A.actions('hh-start'); }); await boot(); await p.waitForTimeout(1000);
  r.start = await ev(() => { const A = window.__A, H = A.HHM_GET(), w = A.W.find(x => x.def && x.def.id === H.gunId), crew = A.enemies.filter(e => e.entry && !e.entry.isPlayer); return { ammo: H.ammo, packsLeft: H.s.ammo.fire, mag: w && w.magSize, base: w && w.def.mag, dog: !!A.HHG_GET().dog, crewHp: crew.map(e => Math.round(e.maxHp)), crewK: crew.map(e => e.hhDmgK), crewGun: crew.map(e => e.gunDef ? e.gunDef.id : e.gun && e.gun.id).slice(0, 1), sleeve: A.VM_SLEEVE ? 1 : 0 }; });
  r.drone = await ev(async () => { const A = window.__A, H = A.HHM_GET(); A.HH_GET().abT = 0; A.hhAbilityL(); const ms = []; for (let i = 0; i < 3; i++) { const e = A.hhMobL('burnout', A.P.x + 6 + i, A.P.z - 3, A.P.y); e.hp = e.maxHp = 400; e.speed = 0; ms.push(e); } await new Promise(r => setTimeout(r, 6000)); return { drone: !!A.HHG_GET().drone, hurt: ms.map(e => Math.round(400 - e.hp)) }; });
  // fire ammo burns, a loot orb for the dog
  r.fire = await ev(async () => { const A = window.__A, H = A.HHM_GET(), e = A.hhMobL('smasher', A.P.x - 5, A.P.z - 5, A.P.y); e.speed = 0; const hp0 = e.hp; A.damageEnemy(e, 10, false, null, false, 'player'); const hp1 = e.hp; await new Promise(r => setTimeout(r, 3500)); return { hit: Math.round(hp0 - hp1), burn: Math.round(hp1 - e.hp), burnT: e.burnT }; });
  await ev(() => { const A = window.__A, H = A.HHM_GET(); const m = new (A.scene.children[0].constructor === Object ? Object : Object)(); });
  // gadgets: sprinkler, then switch to grapple and decoy
  r.gad = await ev(async () => { const A = window.__A, H = A.HHM_GET(), G = A.HHG_GET(); A.G.maxHp = 100; A.G.health = 40; A.hhgGadgetL(); await new Promise(r => setTimeout(r, 2500)); const h = Math.round(A.G.health); H.s.gadget = 'decoy'; A.hhgGadgetL(); const dc = !!G.decoy; A.hhgGadgetL(); return { sprinklerHeal: h - 40, decoy: dc, left: G.gad }; });
  await ev(() => { const A = window.__A; A.P.pitch = -0.1; A.P.yaw += 0.6; }); await shot('mission', 2500);
  // the end: morale goes up on a win
  r.end = await ev(() => { const A = window.__A, H = A.HHM_GET(); for (const e of H.mobs.slice()) A.damageEnemy(e, 1e6, false, null, false, 'world'); const m0 = H.s.morale; A.hhEndL(true); return { morale: [m0, A.hhL.load().morale] }; });
  // the botanist: BLOOM and faster growth
  r.botanist = await ev(() => { const A = window.__A; A.leaveGame(); const s = A.hhL.load(); s.hero = 'botanist'; A.hhL.save(s); return A.hhL.load().hero; });
};
