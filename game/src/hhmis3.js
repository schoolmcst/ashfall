/* ================================================================== HOTBOX HORDE missions 3 (1.2.112, the owner's list D = 29-36)
   29 EXPEDITIONS (s.exp): 3 missions in a row on different maps; if you win all three the cash is tripled.
   30 ESCORT THE SEED VAN ('escort'): the van drives its route by itself; burnouts go for it; it stops while they're on it.
   31 TWO PLANTS ('twin'): a second MOTHER PLANT; half of every wave goes for it; lose either and it's over.
   32 BUILD RACE ('race'): 3 minutes and +150 of each material to build from nothing, then 3 waves 15 s apart.
   33 RETAKE THE GROW ('retake'): the plant is overrun (35% health, burnouts round it): clear them, then hold 3 waves.
   34 NIGHT HARVEST ('stealth'): solo at night; burnouts sleep round the wild weed; walking close, shooting or hurting one
      wakes them (melee kills are silent). +40% pay if nobody woke up.
   35 THE OLD FUN FAIR (map_funfair.js): every mission type is on it.
   36 THE LONG NIGHT ('endless', lobby button): waves until THE MOTHER PLANT falls, a boss every 5th wave, pay grows with
      every wave; s.longBest is on the leaderboard. Never sets a mission best. */
Object.assign(HH_TYPES, {
  escort: { n: 'ESCORT THE SEED VAN', d: 'the van drives by itself · keep the burnouts off it' },
  twin: { n: 'TWO PLANTS', d: 'defend two MOTHER PLANTS at once · lose either and it is over' },
  race: { n: 'BUILD RACE', d: '3 minutes to build from nothing, then 3 fast waves' },
  retake: { n: 'RETAKE THE GROW', d: 'the plant is overrun: clear them out, then hold 3 waves' },
  stealth: { n: 'NIGHT HARVEST', d: 'sneak round sleeping burnouts and cut the wild weed · shooting wakes them' },
  endless: { n: 'THE LONG NIGHT', d: 'waves until the plant falls · a boss every 5th wave' },
});
HH_HUNTK.add('escort'); HH_RUNK.add('stealth');
HH_MAPS.push({ map: 'funfair', n: 'THE OLD FUN FAIR' });
const HH_NEWT = ['escort', 'twin', 'race', 'retake', 'stealth'];
for (const m of HH_MAPS.slice(0, 4)) for (const t of HH_NEWT) HH_MISSIONS.push({ map: m.map, n: m.n, type: t });
for (const t of ['defend', 'supply', 'wild', 'rescue', 'truck', 'signal', 'nests', ...HH_NEWT]) HH_MISSIONS.push({ map: 'funfair', n: 'THE OLD FUN FAIR', type: t });
const HHM3 = { exp: null };
/* ---------- setup */
const _hh3Supply = hhSupplySetup;
hhSupplySetup = function (H) { if (H.kind !== 'stealth') return _hh3Supply.apply(this, arguments); H.kind = 'wild'; try { _hh3Supply.apply(this, arguments); } finally { H.kind = 'stealth'; } };
const _hh3Setup = hhSetup;
hhSetup = function () {
  const r = _hh3Setup.apply(this, arguments), H = M.hh; if (!H || H.base) return r; const k = H.kind, s = H.s;
  if (k === 'endless' || (HHM3.exp && HHM3.exp.on)) H.noRec = { best: JSON.stringify(s.best[Math.max(0, H.mi)] || null), unl: s.unl[Math.max(0, H.mi)], mi: Math.max(0, H.mi) };
  if (k === 'endless') { H.waves = 999; H.t = 60; H.objTxt = ''; }
  if (k === 'race') { H.t = 180; H.waves = 3; for (const m of HH_MATS) hhGive(m, 150); H.raceFirst = true; }
  if (k === 'retake' || k === 'twin') H.waves = k === 'retake' ? 3 : 5;
  if (k === 'twin' && H.plant) { let best = null; for (let i = 0; i < 120; i++) { const o = openNear(H.plant.x + rnd(-26, 26), H.plant.z + rnd(-26, 26)), d = Math.hypot(o.x - H.plant.x, o.z - H.plant.z), y = groundAt(o.x, o.z, 0.6); if (d < 14 || d > 28 || Math.abs(groundAt(o.x, o.z, 40) - y) > 0.3) continue; best = { x: o.x, z: o.z, y }; break; }
    if (best) { const g = hhPlantMesh(); g.position.set(best.x, best.y, best.z); H.grp.add(g); const p2 = H.plant2 = { x: best.x, z: best.z, y: best.y, g, hp: H.plant.max, max: H.plant.max, n: 'THE SECOND PLANT', hitT: 0 }; p2.box = mkBox(best.x, best.z, 2.4, 2.4, 1.1, { y: best.y }); boxes.push(p2.box); H.sboxes.push(p2.box); try { p2.field = flowField(best.x, best.z, best.y); rebuildBoxGrid(); } catch (e) {} } }
  if (k === 'retake' && H.plant) { H.plant.hp = Math.round(H.plant.max * 0.35); H.t = 1e6; H.retake = true; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, o = openNear(H.plant.x + Math.cos(a) * rnd(5, 11), H.plant.z + Math.sin(a) * rnd(5, 11)); const e = hhMob(i % 5 === 0 ? 'smasher' : i % 3 === 0 ? 'sprinter' : 'burnout', o.x, o.z, groundAt(o.x, o.z, 0.6)); e.retakeMob = true; } }
  if (k === 'escort') { H.t = 420; const far = (x, z, a, b) => { for (let i = 0; i < 900; i++) { const o = openNear(rnd(PLAYRECT[0] + 5, PLAYRECT[1] - 5), rnd(PLAYRECT[2] + 5, PLAYRECT[3] - 5)), d = Math.hypot(o.x - x, o.z - z); if (d >= a && d <= b) return o; } return openNear(x + a, z); };
    const s0 = far(0, 0, 30, 70), e0 = far(-s0.x * 0.8, -s0.z * 0.8, 0, 14), g = hhVanMesh(0x3a8a4a); H.grp.add(g); const V = H.svan = { x: s0.x, z: s0.z, y: groundAt(s0.x, s0.z, 0.6), g, hp: Math.round(2200 * H.D.hp), max: Math.round(2200 * H.D.hp), to: e0, n: 'THE SEED VAN', hitT: 0 };
    try { V.toField = flowField(e0.x, e0.z, groundAt(e0.x, e0.z, 0.6)); } catch (e) {} V.d0 = Math.hypot(e0.x - s0.x, e0.z - s0.z); H.startAt = { x: s0.x + 3, z: s0.z + 3 }; H.objTxt = 'THE VAN IS ROLLING'; }
  if (k === 'stealth') { hhNight(true); H.t = 420; H.quiet = true; H.D = Object.assign({}, H.D);
    for (const e of enemies.slice()) if (e.entry && !e.entry.isPlayer && e.team === M.myTeam) { const i = enemies.indexOf(e); enemies.splice(i, 1); scene.remove(e.group); }
    M.entries = M.entries.filter(en => en.isPlayer);
    for (const c of H.caches) for (let j = 0; j < 2; j++) { const a = Math.random() * TAU, o = openNear(c.x + Math.cos(a) * rnd(3, 6), c.z + Math.sin(a) * rnd(3, 6)); if (Math.hypot(o.x - H.org.x, o.z - H.org.z) < 16) continue; const e = hhMob(Math.random() < 0.2 ? 'smasher' : 'burnout', o.x, o.z, groundAt(o.x, o.z, 0.6)); e.sleep = true; e.group.rotation.y = Math.random() * TAU; } }
  return r;
};
/* ---------- the burnouts: sleeping, picking a plant */
function hh3Alarm(x, z, R, why) { const H = M.hh; if (!H || H.kind !== 'stealth') return; let n = 0; for (const e of H.mobs) if (e.sleep && Math.hypot(e.group.position.x - x, e.group.position.z - z) < R) { e.sleep = false; e.tgtT = 0; n++; } if (n) { if (H.quiet) try { showBanner('THEY WOKE UP', why || 'the burnouts heard you'); sfx.zscreech && sfx.zscreech(); } catch (e) {} H.quiet = false; } }
const _hh3MobTick = hhMobTick;
hhMobTick = function (e, dt, i) {
  if (e.sleep) { const H = M.hh, g = e.group.position, d = playerAlive() ? Math.hypot(P.x - g.x, P.z - g.z) : 99, R = (P.eye || 1.7) < 1.35 ? 2.6 : 4.5;   // crouched or prone: closer
    if (d < R) { hh3Alarm(g.x, g.z, 9, 'you walked too close'); } else { e.phase = (e.phase || 0) + dt * 0.4; try { animZombie(e, dt, 0); } catch (er) {} e.group.rotation.x = 0; botGround(e.group, dt); return; } }
  return _hh3MobTick.apply(this, arguments);
};
const _hh3Mob = hhMob;
hhMob = function (kind, x, z, y) {
  const e = _hh3Mob.apply(this, arguments), H = M && M.hh; if (!e || !H || e.hcProx) return e;
  if (H.plant2 && H.plant2.hp > 0 && Math.random() < 0.5) e.obj = H.plant2;
  if (H.svan && H.svan.hp > 0) e.obj = H.svan;
  return e;
};
const _hh3Dmg = damageEnemy;
damageEnemy = function (e, dmg, head, dir, boom, by) {
  const sl = e && e.sleep, r = _hh3Dmg.apply(this, arguments);
  if (sl && M && M.hh) { const g = e.group.position, alive = enemies.includes(e), melee = G.meleeT > 0 && by === 'player'; if (alive || !melee) hh3Alarm(g.x, g.z, alive ? 12 : 8, alive ? 'one of them got hurt and screamed' : 'that was loud'); }
  return r;
};
// gunfire wakes them (melee is quiet)
const _hh3Shoot = shoot;
shoot = function () { const r = _hh3Shoot.apply(this, arguments); const H = M && M.hh; if (H && H.kind === 'stealth' && H.quiet) hh3Alarm(P.x, P.z, 26, 'they heard the shot'); return r; };
const _hh3Supply2 = hhSupplyTick;
hhSupplyTick = function (dt) { const H = M.hh; if (H && H.kind === 'stealth' && H.quiet) H.spawnT = Math.max(H.spawnT, 1); return _hh3Supply2.apply(this, arguments); };
/* ---------- every frame */
const _hh3Tick = hhTick;
hhTick = function (dt) {
  const H = M && M.hh, uH0 = HH.uH, r = _hh3Tick.apply(this, arguments); if (!H || M.over || H.over || H.client) return r; const k = H.kind;
  if (H.plant2) { if (H.plant2.hp <= 0) { hhEnd(false); return r; } H.plant2.g.rotation.y += dt * 0.2; }
  if (H.retake) { if (!H.mobs.some(e => e.retakeMob)) { H.retake = false; H.t = 30; try { showBanner('THE GROW IS YOURS AGAIN', 'build and hold 3 waves · the first in 30 s'); sfx.streak(); } catch (e) {} } else { H.t = 1e6; H.objTxt = `CLEAR THEM OUT · ${H.mobs.filter(e => e.retakeMob).length} LEFT`; } }
  if (k === 'escort') { const V = H.svan; hhHuntSpawn(dt, 4.5, 12); const blocked = H.mobs.some(e => Math.hypot(e.group.position.x - V.x, e.group.position.z - V.z) < 3.2);
    if (!blocked && V.hp > 0) { const d = V.toField && flowDir(V.toField, V.x, V.z, V.y); let mx = V.to.x - V.x, mz = V.to.z - V.z; if (d) { mx = d[0]; mz = d[1]; } const L = Math.hypot(mx, mz) || 1, q = { x: V.x + mx / L * 2.1 * dt, z: V.z + mz / L * 2.1 * dt }; resolve(q, 1.2, V.y); V.x = q.x; V.z = q.z; V.y = groundAt(V.x, V.z, V.y + 0.6); V.g.rotation.y = Math.atan2(mx, mz); }
    V.g.position.set(V.x, V.y, V.z); for (const e of H.mobs) if (!e.obj || e.obj.hp <= 0) e.obj = V;
    for (const e of H.mobs) { const g = e.group.position; if (Math.hypot(g.x - V.x, g.z - V.z) < 3.2) { if ((e.vanT = (e.vanT || 0) - dt) <= 0) { e.vanT = 1; hhObjHit(V, e.K.dmg); } } }
    const dEnd = Math.hypot(V.to.x - V.x, V.to.z - V.z); H.objK = 1 - dEnd / V.d0; H.objTxt = `${blocked ? 'STOPPED · ' : ''}${Math.round(Math.max(0, H.objK) * 100)}% THERE · VAN ${Math.max(0, Math.round(V.hp / V.max * 100))}%`;
    if (dEnd < 4) hhEnd(true); else if (V.hp <= 0) hhEnd(false); }
  if (k === 'stealth' && H.quiet) H.objTxt = 'NOBODY IS AWAKE';
  return r;
};
const _hh3WaveDone = hhWaveDone;
hhWaveDone = function () { const H = M.hh, r = _hh3WaveDone.apply(this, arguments); if (H && !H.over && H.phase === 'prep') { if (H.kind === 'race') H.t = 15; if (H.kind === 'endless') { H.t = 25; H.longPay = (H.longPay || 0) + 60 + 25 * H.wave; } } return r; };
const _hh3WL = hhWaveList;
hhWaveList = function (w) { const q = _hh3WL.apply(this, arguments), H = M && M.hh; if (H && H.kind === 'endless' && w % 5 === 0 && !q.includes('boss')) q.splice(Math.floor(q.length / 2), 0, 'boss'); return q; };
const _hh3PlantHit = hhPlantHit;
hhPlantHit = function (d) { const H = M && M.hh; if (H && H.kind === 'endless' && !H.over && H.plant && H.plant.hp - d <= 0) { H.plant.hp = 0; H.longDone = true; hhEnd(true); return; } return _hh3PlantHit.apply(this, arguments); };
/* ---------- the end */
const _hh3End = hhEnd;
hhEnd = function (won) {
  const H = M && M.hh, first = H && !H.over; if (!first) return _hh3End.apply(this, arguments); const s = H.s, k = H.kind;
  if (k === 'stealth' && won && H.quiet) H.D.pay *= 1.4;
  if (k === 'endless') { const held = Math.max(0, (H.wavesWon | 0)); H.D = Object.assign({}, H.D, { pay: H.D.pay * Math.max(0.3, held / 5) }); s.longBest = Math.max(s.longBest | 0, held); try { setTimeout(() => showBanner(`THE LONG NIGHT · ${held} WAVE${held === 1 ? '' : 'S'} HELD`, s.longBest === held && held ? 'a new best' : `your best: ${s.longBest}`), 400); } catch (e) {} }
  const cash0 = s.cash; const r = _hh3End.apply(this, arguments);
  if (H.noRec) { const b = JSON.parse(H.noRec.best); if (b) s.best[H.noRec.mi] = b; else delete s.best[H.noRec.mi]; if (H.noRec.unl === undefined) delete s.unl[H.noRec.mi]; else s.unl[H.noRec.mi] = H.noRec.unl; }
  const E = HHM3.exp; if (E && E.on) { E.cash += Math.max(0, s.cash - cash0); E.res.push(won ? 1 : 0);
    if (!won) { E.on = false; try { setTimeout(() => showBanner('EXPEDITION OVER', `you made it through ${E.i} of 3 · the pay so far is yours`), 900); } catch (e) {} }
    else if (E.i >= 2) { E.on = false; const bonus = E.cash * 2; s.cash += bonus; try { setTimeout(() => showBanner('EXPEDITION DONE · CASH TRIPLED', `+$${bonus.toLocaleString()} bonus`), 900); sfx.streak(); } catch (e) {} }
    else { E.i++; const nx = HH_MISSIONS[E.list[E.i]]; try { setTimeout(() => showBanner(`EXPEDITION · ${E.i + 1} OF 3 NEXT`, `${HH_TYPES[nx.type].n} · ${nx.n} · starts in 8 s`), 900); } catch (e) {} E.nextT = setTimeout(() => { if (!HHM3.exp || !HHM3.exp.on) return; try { HHL.on = true; const s2 = hhLoad(); s2.mis = E.list[E.i]; hhSave(s2); startMatch('hh', { map: nx.map, hhKind: nx.type }); } catch (e) { reportError(e); } }, 8000); } }
  hhSave(s); return r;
};
function hh3Expedition() {
  const pick = [], maps = new Set(), types = ['defend', 'supply', 'wild', 'rescue', 'nests', 'twin', 'escort', 'retake'];
  for (let i = 0; i < 200 && pick.length < 3; i++) { const mi = (Math.random() * HH_MISSIONS.length) | 0, m = HH_MISSIONS[mi]; if (maps.has(m.map) || !types.includes(m.type)) continue; maps.add(m.map); pick.push(mi); }
  HHM3.exp = { on: true, list: pick, i: 0, cash: 0, res: [] }; const m = HH_MISSIONS[pick[0]], s = hhLoad(); s.mis = pick[0]; hhSave(s);
  try { showBanner('EXPEDITION', pick.map(i => HH_TYPES[HH_MISSIONS[i].type].n).join(' → ')); } catch (e) {} startMatch('hh', { map: m.map, hhKind: m.type });
}
// leaving early ends an expedition
const _hh3Leave = leaveGame;
leaveGame = function () { if (HHM3.exp && HHM3.exp.on && M && M.hh && !M.hh.over) { HHM3.exp.on = false; clearTimeout(HHM3.exp.nextT); } return _hh3Leave.apply(this, arguments); };
/* ---------- markers, the top bar */
const _hh3Mk = hhMarkers;
hhMarkers = function (out) { _hh3Mk(out); const H = M && M.hh; if (!H) return;
  if (H.plant2) out.push({ x: H.plant2.x, y: H.plant2.y + 3, z: H.plant2.z, t: `SECOND PLANT ${Math.max(0, Math.round(H.plant2.hp / H.plant2.max * 100))}%`, c: '#c070ff' });
  if (H.svan) { out.push({ x: H.svan.x, y: H.svan.y + 3.2, z: H.svan.z, t: `SEED VAN ${Math.max(0, Math.round(H.svan.hp / H.svan.max * 100))}%`, c: '#7aff6a' }); out.push({ x: H.svan.to.x, y: groundAt(H.svan.to.x, H.svan.to.z, 0.6) + 3, z: H.svan.to.z, t: 'DROP-OFF', c: '#ffd24a' }); } };
const _hh3DT = hhDomTick;
hhDomTick = function () { const r = _hh3DT.apply(this, arguments), H = M && M.hh, b = $('hhBar'); if (!H || !b) return r;
  if (H.kind === 'stealth') { b.querySelector('small').textContent = 'NIGHT HARVEST' + (H.quiet ? ' · NOBODY IS AWAKE' : ' · THEY ARE AWAKE'); const sp = b.querySelector('span'); sp.textContent = sp.textContent.replace('CACHES SEARCHED', 'PLANTS CUT'); }
  if (H.kind === 'endless' && H.plant) b.querySelector('small').textContent = `THE LONG NIGHT · WAVE ${H.wave} · BEST ${H.s.longBest | 0}`;
  if ((H.plant2 || H.retake) && H.plant) { const sp = b.querySelector('span'); if (H.retake) sp.textContent = H.objTxt; else if (H.plant2) sp.textContent += ` · SECOND PLANT ${Math.max(0, Math.round(H.plant2.hp / H.plant2.max * 100))}%`; }
  return r; };
/* ---------- the lobby: EXPEDITION and THE LONG NIGHT */
const _hh3Render = hhRender;
hhRender = function () {
  const r = _hh3Render.apply(this, arguments), sel = $('lobSel'); if (!sel || !HHL.on) return r; const s = hhLoad(), mis = HH_MISSIONS[clamp(s.mis | 0, 0, HH_MISSIONS.length - 1)];
  const row = sel.querySelector('.hh-misrow'); if (row) row.insertAdjacentHTML('afterend', `<div class="cod-row hhm3-row"><small>EXPEDITION · 3 MISSIONS IN A ROW</small><b>WIN ALL 3 · CASH ×3</b><span>three maps, no base in between · lose one and it ends</span><div class="arw"><button class="mini" data-act="hhm3-exp">START</button></div></div><div class="cod-row hhm3-row"><small>THE LONG NIGHT · ${mis.n}</small><b>BEST: ${s.longBest | 0} WAVE${(s.longBest | 0) === 1 ? '' : 'S'}</b><span>waves until the plant falls · a boss every 5th</span><div class="arw"><button class="mini" data-act="hhm3-long">START</button></div></div>`);
  return r;
};
const _hh3Act = hhAct;
hhAct = function (act) {
  if (!/^hhm3-/.test(act) || !HHL.on) return _hh3Act.apply(this, arguments); if (typeof HC !== 'undefined' && HC.on && !hcHost()) { showMsg('THE HOST PICKS WHAT TO PLAY'); return true; } try { sfx.ui(); } catch (e) {}
  if (act === 'hhm3-exp') hh3Expedition(); else { const s = hhLoad(), m = HH_MISSIONS[clamp(s.mis | 0, 0, HH_MISSIONS.length - 1)]; startMatch('hh', { map: m.map, hhKind: 'endless' }); }
  return true;
};
