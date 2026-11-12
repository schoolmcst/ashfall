// HOTBOX HORDE batch D (29-36): new missions, THE OLD FUN FAIR, THE LONG NIGHT, expeditions
module.exports = async p => { const r = {}; try { await run(p, r); } catch (e) { r.FAIL = String(e).slice(0, 400); } return r; };
const run = async (p, r) => {
  const SH = process.env.SHOTS || '/tmp', ev = (f, a) => p.evaluate(f, a);
  const shot = async (n, ms) => { await ev(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms || 2000); await p.screenshot({ path: SH + '/hh13_' + n + '.png' }); await ev(() => { window.__A.G.noRender = true; }); };
  const boot = async () => { await p.waitForTimeout(9500); await ev(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } }); await p.waitForTimeout(1500); await ev(() => { const A = window.__A; if (A.G.state === 'paused') { A.G.state = 'playing'; A.showScreen(null); } A.G.health = A.G.maxHp = 1e9; }); };
  const start = async (type, map) => { await ev(([type, map]) => { const A = window.__A; try { A.leaveGame(); } catch (e) {} const L = A.HH_MISSIONS_L(), mi = L.findIndex(m => m.type === type && m.map === map), s = A.hhL.load(); s.mis = mi; A.hhL.save(s); A.hhOpenL(); A.G.noRender = true; A.actions('hh-start'); }, [type, map]); await boot(); };
  await ev(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} const A = window.__A; A.HHS_GET().force = ''; const s = A.hhL.load(); s.tutSeen = 1; s.tutDone = 1; s.cash = 5000; A.hhL.save(s); A.showScreen('menu'); A.hhOpenL(); for (const o of document.querySelectorAll('.onb-ov')) o.remove(); });
  r.list = await ev(() => { const L = window.__A.HH_MISSIONS_L(); return { n: L.length, funfair: L.filter(m => m.map === 'funfair').map(m => m.type).join(',') }; });
  await ev(() => window.__A.actions('hh-map')); await p.waitForTimeout(500); await p.screenshot({ path: SH + '/hh13_map.png' }); await ev(() => { const o = document.getElementById('hhMapOv'); if (o) o.remove(); });
  // ESCORT on the fun fair
  await start('escort', 'funfair');
  r.escort = await ev(async () => { const A = window.__A, H = A.HHM_GET(), V = H.svan; const x0 = V.x, z0 = V.z; await new Promise(r => setTimeout(r, 5000)); return { map: A.curMap, kind: H.kind, moved: Math.round(Math.hypot(V.x - x0, V.z - z0) * 10) / 10, hp: V.hp, txt: H.objTxt }; });
  await ev(() => { const A = window.__A, V = A.HHM_GET().svan; A.P.x = V.x - 6; A.P.z = V.z + 6; A.P.yaw = Math.atan2(-6, 6) + Math.PI; A.P.pitch = -0.1; }); await shot('escort', 2500);
  // TWO PLANTS
  await start('twin', 'stackyard');
  r.twin = await ev(() => { const A = window.__A, H = A.HHM_GET(); const ok = !!H.plant2; let n2 = 0; for (let i = 0; i < 20; i++) { const e = A.hhMobL('burnout', H.org.x + 25, H.org.z, H.by); if (e.obj === H.plant2) n2++; } H.plant2.hp = 0; return { plant2: ok, toPlant2: n2 + ' / 20' }; });
  await p.waitForTimeout(1500); r.twin.over = await ev(() => { const H = window.__A.HHM_GET(); return H ? H.over : 'gone'; });
  // BUILD RACE
  await start('race', 'stackyard');
  r.race = await ev(() => { const H = window.__A.HHM_GET(); return { t: Math.round(H.t), waves: H.waves, wood: H.s.inv.wood }; });
  // RETAKE
  await start('retake', 'stackyard');
  r.retake = await ev(async () => { const A = window.__A, H = A.HHM_GET(); const n = H.mobs.filter(e => e.retakeMob).length, hp = Math.round(H.plant.hp / H.plant.max * 100); for (const e of H.mobs.slice()) A.damageEnemy(e, 1e6, false, null, false, 'world'); await new Promise(r => setTimeout(r, 1500)); return { mobs: n, plantPct: hp, after: Math.round(H.t), retake: H.retake }; });
  // NIGHT HARVEST
  await start('stealth', 'stackyard');
  r.stealth = await ev(async () => { const A = window.__A, H = A.HHM_GET(); const asleep = H.mobs.filter(e => e.sleep).length, crew = A.enemies.filter(e => e.entry && !e.entry.isPlayer).length; await new Promise(r => setTimeout(r, 2500)); const still = H.mobs.filter(e => e.sleep).length; const q0 = H.quiet; A.hh3AlarmL(H.mobs[0].group.position.x, H.mobs[0].group.position.z, 26); return { asleep, crew, still, quietBefore: q0, quietAfter: H.quiet, awake: H.mobs.filter(e => !e.sleep).length, night: !!H.night || !!A.HH_GET().night }; });
  await ev(() => { const A = window.__A, H = A.HHM_GET(), e = H.mobs.find(m => m.sleep) || H.mobs[0]; A.P.x = e.group.position.x + 7; A.P.z = e.group.position.z + 7; A.P.yaw = Math.PI * 0.25; A.P.pitch = -0.15; }); await shot('stealth', 2500);
  // THE LONG NIGHT on the fun fair
  await ev(() => { const A = window.__A; A.leaveGame(); const L = A.HH_MISSIONS_L(), s = A.hhL.load(); s.mis = L.findIndex(m => m.map === 'funfair'); A.hhL.save(s); A.hhOpenL(); A.G.noRender = true; A.actions('hhm3-long'); }); await boot();
  r.long = await ev(async () => { const A = window.__A, H = A.HHM_GET(); const st = { kind: H.kind, waves: H.waves, map: A.curMap, boss5: A.hhWaveListL(5).includes('boss') }; H.wavesWon = 3; H.wave = 3; H.plant.hp = 5; A.hhPlantHitL(50); await new Promise(r => setTimeout(r, 1500)); const s = A.hhL.load(); return Object.assign(st, { over: H.over, longBest: s.longBest, best: s.best[s.mis] || null }); });
  await shot('long', 2000);
  // EXPEDITION: win the first, the next one starts by itself; lose the second
  await ev(() => { const A = window.__A; A.leaveGame(); A.hhOpenL(); A.G.noRender = true; A.hh3ExpL(); }); await boot();
  r.exp1 = await ev(() => { const A = window.__A, E = A.HHM3_GET().exp, H = A.HHM_GET(); const s0 = { list: E.list.map(i => A.HH_MISSIONS_L()[i].type + '@' + A.HH_MISSIONS_L()[i].map), first: H.kind + '@' + A.curMap }; for (const e of H.mobs.slice()) A.damageEnemy(e, 1e6, false, null, false, 'world'); A.hhEndL(true); return Object.assign(s0, { i: E.i, cash: E.cash }); });
  await p.waitForTimeout(9000); await boot();
  r.exp2 = await ev(() => { const A = window.__A, E = A.HHM3_GET().exp, H = A.HHM_GET(); const st = { on: E.on, i: E.i, now: H && H.kind + '@' + A.curMap }; A.hhEndL(false); return Object.assign(st, { after: E.on }); });
};
