/* ================================================================== HOTBOX HORDE: MISSIONS 2 (1.2.106, the owner's list 36-44)
   New mission types on every map: RESCUE THE GROWERS (find 3 growers, press USE, walk them to the van), DELIVER THE TRUCK
   (it only rolls while you are close; burnouts next to it wreck it), HOLD THE SIGNAL (3 radio boxes, 4 minutes), DESTROY
   THE NESTS (4 nests that keep spawning burnouts). NIGHT MISSIONS (a lobby switch: darker, harder, +40% pay), a daily
   MODIFIER on every mission (BIG HEADS, DOUBLE DRIFTERS, FAST BURNOUTS, EXPLOSIVE, RICH), the DAILY MISSION (double pay on
   its first win of the day), WEEKLY CHALLENGES (3 a week, cash and seeds) and the MISSION MAP (pick from cards). */
Object.assign(HH_TYPES, {
  rescue: { n: 'RESCUE THE GROWERS', d: 'find the 3 trapped growers and walk them to the van' },
  truck: { n: 'DELIVER THE TRUCK', d: 'stay close so the truck keeps rolling · keep the burnouts off it' },
  signal: { n: 'HOLD THE SIGNAL', d: 'keep at least one of the 3 radio boxes alive for 4 minutes' },
  nests: { n: 'DESTROY THE NESTS', d: 'shoot the 4 nests that keep spawning burnouts' },
});
HH_MISSIONS.length = 0; for (const m of HH_MAPS) for (const t of ['defend', 'supply', 'wild', 'rescue', 'truck', 'signal', 'nests']) HH_MISSIONS.push({ map: m.map, n: m.n, type: t });
const HH_MODS = [{ id: 'none', n: 'NO MODIFIER' }, { id: 'bighead', n: 'BIG HEADS' }, { id: 'drifters', n: 'DOUBLE DRIFTERS' }, { id: 'fast', n: 'FAST BURNOUTS' }, { id: 'explosive', n: 'EXPLOSIVE' }, { id: 'rich', n: 'RICH · +50% PAY' }];
const hhDay = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const hhHash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const hhModOf = mi => HH_MODS[hhHash(hhDay() + ':' + mi) % HH_MODS.length];
const hhDailyMi = () => hhHash(hhDay() + 'daily') % HH_MISSIONS.length;
const hhWeek = () => { const d = new Date(); return `${d.getFullYear()}-w${Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 604800000)}`; };
const HH_WK = [
  { id: 'fried', n: 'WIN 3 MISSIONS ON FRIED OR HARDER', goal: 3 }, { id: 'kills', n: 'TAKE DOWN 300 BURNOUTS', goal: 300 }, { id: 'harvest', n: 'HARVEST 20 PLANTS', goal: 20 },
  { id: 'nests', n: 'DESTROY 6 NESTS', goal: 6 }, { id: 'sold', n: 'SELL $10,000 OF BUDS', goal: 10000 }, { id: 'missions', n: 'FINISH 5 MISSIONS', goal: 5 }, { id: 'built', n: 'BUILD 60 PIECES', goal: 60 },
];
function hhWk(s) { const k = hhWeek(); if (!s.wk || s.wk.key !== k) { const h = hhHash(k); const ids = []; for (let i = 0; ids.length < 3; i++) { const c = HH_WK[(h + i * 3) % HH_WK.length].id; if (!ids.includes(c)) ids.push(c); } s.wk = { key: k, ids, c: {}, got: {}, sold0: s.sold | 0, built0: s.built | 0 }; } s.wk.c.sold = (s.sold | 0) - s.wk.sold0; s.wk.c.built = (s.built | 0) - s.wk.built0; return s.wk; }
function hhWkAdd(s, id, n) { const w = hhWk(s); w.c[id] = (w.c[id] | 0) + n; }

/* ---------- setting a mission up */
const _hhSetup6 = hhSetup;
hhSetup = function () {
  const r = _hhSetup6.apply(this, arguments), H = M.hh; if (!H) return r; const s = H.s;
  if (!H.base) {
    H.mod = hhModOf(H.mi).id; H.D = Object.assign({}, H.D);
    if (H.mod === 'rich') H.D.pay *= 1.5;
    if (H.mi === hhDailyMi() && s.dailyDone !== hhDay()) { H.daily = true; H.D.pay *= 2; }
    if (s.nightMis) { H.nightMis = true; H.D.pay *= 1.4; H.D.hp *= 1.2; hhNight(true); }
  }
  const k = H.kind, pr = PLAYRECT, far = (x, z, dmin, dmax) => { for (let i = 0; i < 300; i++) { const o = openNear(rnd(pr[0] + 4, pr[1] - 4), rnd(pr[2] + 4, pr[3] - 4)), d = Math.hypot(o.x - x, o.z - z); if (d >= dmin && d <= dmax && Math.abs(groundAt(o.x, o.z, 40) - groundAt(o.x, o.z, 0.6)) < 0.3) return o; } return openNear(x + dmin, z); };
  if (k === 'rescue') { H.growers = []; H.t = 480; for (let i = 0; i < 3; i++) { const o = far(H.org.x, H.org.z, 18 + i * 6, 55); H.growers.push(hhGrowerMake(o.x, o.z, groundAt(o.x, o.z, 0.6))); } const v = far(H.org.x, H.org.z, 8, 20); hhVanAt(H, v); H.objTxt = '0 / 3 RESCUED'; }
  if (k === 'truck') { const a = far(0, 0, 30, 70), b = far(a.x, a.z, 55, 120); const g = hhVanMesh(0x8a6a2a); g.scale.setScalar(1.15); H.grp.add(g); H.truck = { x: a.x, z: a.z, y: groundAt(a.x, a.z, 0.6), g, hp: Math.round(1500 * H.D.hp), max: Math.round(1500 * H.D.hp), to: b, hitT: 0 }; try { H.truck.field = flowField(b.x, b.z, groundAt(b.x, b.z, 0.6)); } catch (e) {} H.t = 480; const flag = hhRiftMesh(); flag.scale.setScalar(0.5); flag.position.set(b.x, groundAt(b.x, b.z, 0.6), b.z); H.grp.add(flag); H.truckEnd = flag; H.startAt = { x: a.x + 3, z: a.z + 3 }; H.objTxt = 'TRUCK 0%'; H.truck.d0 = Math.hypot(b.x - a.x, b.z - a.z); }
  if (k === 'signal') { H.boxes = []; H.t = 240; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + Math.random(), o = openNear(H.org.x + Math.cos(a) * 9, H.org.z + Math.sin(a) * 9), y = groundAt(o.x, o.z, 0.6), g = new THREE.Group(); g.position.set(o.x, y, o.z); H.grp.add(g);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.6), hhStd({ color: 0x3a4a3a, roughness: 0.6, metalness: 0.4 })); box.position.y = 0.55; g.add(box); const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 4), hhStd({ color: 0x888888, metalness: 0.8 })); ant.position.set(0.3, 1.9, 0); g.add(ant); const led = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: 0x7aff6a })); led.position.set(0.3, 2.7, 0); g.add(led);
      const B = { x: o.x, z: o.z, y, g, led, hp: Math.round(800 * H.D.hp), max: Math.round(800 * H.D.hp), n: 'RADIO ' + (i + 1), box: mkBox(o.x, o.z, 0.9, 0.6, 1.1, { y }) }; boxes.push(B.box); H.sboxes.push(B.box); try { B.field = flowField(o.x, o.z, y); } catch (e) {} H.boxes.push(B); } try { rebuildBoxGrid(); } catch (e) {} H.objTxt = '3 / 3 RADIOS'; }
  if (k === 'nests') { H.t = 480; H.huntNests = []; for (const R of H.rifts) R.g.visible = false; const spots = []; for (let i = 0; i < 80 && spots.length < 4; i++) { const o = far(H.org.x, H.org.z, 16, 60); if (!spots.some(q => Math.hypot(q.x - o.x, q.z - o.z) < 14)) spots.push(o); }
      for (const o of spots) { const R = { x: o.x, z: o.z, y: groundAt(o.x, o.z, 0.6), g: null }; const n = hhNestMake(R); n.hp = n.maxHp = Math.round(2200 * H.D.hp); H.huntNests.push(R); } H.objTxt = '0 / 4 NESTS'; }
  return r;
};
function hhVanAt(H, o) { const y = groundAt(o.x, o.z, 0.6), v = hhVanMesh(0x3a6a3a); v.position.set(o.x, y, o.z); v.rotation.y = Math.random() * TAU; H.grp.add(v); H.van = { x: o.x, z: o.z, y, g: v, t: 0, rescue: true }; }
function hhGrowerMake(x, z, y) {
  const rig = cloneSoldier('rifleman'), root = rig.root; root.position.set(x, y, z); scene.add(root); if (rig.gun) rig.gun.visible = false; M.hh.grp.attach(root);
  root.traverse(o => { if (o.isMesh && !o.userData.hitbox && o.material && o.material.color) { o.material = o.material.clone(); o.material.color.lerp(new THREE.Color(0xd8803a), 0.45); } });
  rig.hips.position.y = 0.55; rig.legL.rotation.x = -1.4; rig.legR.rotation.x = -1.4; rig.knL.rotation.x = 1.5; rig.knR.rotation.x = 1.5; rig.armL.rotation.x = -0.6; rig.armR.rotation.x = -0.6;
  return { rig, g: root, x, z, y, follow: false, saved: false, ph: Math.random() * 6 };
}
function hhObjHit(o, dmg) {
  const H = M.hh; if (!o || o.hp <= 0 || H.over) return; o.hp -= dmg; o.hitT = NOW; try { tone(200, 0.08, 0.05, 'square', 120); } catch (e) {}
  if (o.hp <= 0) { if (o.led) o.led.material.color.setHex(0xff3a3a); try { chunks('dust', new THREE.Vector3(o.x, o.y + 0.8, o.z), 12, 4, 0.6); showMsg(`${o.n || 'THE TRUCK'} IS DOWN`); } catch (e) {} }
}
/* ---------- every frame */
function hhHuntSpawn(dt, rate, cap, at) {
  const H = M.hh; if ((H.spawnT -= dt) > 0 || H.mobs.length >= cap) return; H.spawnT = rate;
  const R = at || H.rifts.filter(r => !r.closed)[(Math.random() * H.rifts.length) | 0] || H.rifts[0], r = Math.random(), w = Math.min(5, 1 + Math.floor((M.t || 0) / 60));
  const k = r < 0.08 && w >= 3 ? 'smasher' : r < 0.22 ? 'sprinter' : r < 0.3 ? 'spitter' : r < 0.36 ? 'shield' : r < 0.42 && w >= 2 ? 'drifter' : r < 0.47 && w >= 3 ? 'bloater' : 'burnout';
  const e = hhMob(k, R.x + rnd(-1, 1), R.z + rnd(-1, 1), R.y); return e;
}
const _hhTick6 = hhTick;
hhTick = function (dt) {
  const H = M.hh, uH0 = HH.uH, r = _hhTick6.apply(this, arguments); if (!H || M.over || H.over || !hhHunt(H.kind) || hhRun(H.kind)) return r;
  if (H.startAt && H.placed) { const o = openNear(H.startAt.x, H.startAt.z); P.x = o.x; P.z = o.z; P.y = groundAt(o.x, o.z, 0.6); for (const e of enemies) if (e.entry) { const q = openNear(o.x + rnd(-3, 3), o.z + rnd(-3, 3)); e.group.position.set(q.x, groundAt(q.x, q.z, 0.6), q.z); } H.startAt = null; }
  H.t -= dt; try { if (navTarget < 0 || !navField || H.navX === undefined || Math.hypot(P.x - H.navX, P.z - H.navZ) > 1.25) { H.navX = P.x; H.navZ = P.z; updateNav(P.x, P.z, P.y || 0); } } catch (e) {}
  const k = H.kind, u = kb('use') || pad.use;
  if (k === 'rescue') { hhHuntSpawn(dt, 5, 9);
    for (const G0 of H.growers) { const g = G0.g.position;
      if (!G0.follow && !G0.saved && playerAlive() && Math.hypot(P.x - g.x, P.z - g.z) < 2.2) { showMsgOnce(`A TRAPPED GROWER · PRESS ${actName('use')} · "GET ME OUT OF HERE!"`); if (u && !uH0) { G0.follow = true; const rg = G0.rig; rg.hips.position.y = 0.96; rg.legL.rotation.x = rg.legR.rotation.x = 0; rg.knL.rotation.x = rg.knR.rotation.x = 0.2; try { showBanner('GROWER FOUND', 'they follow you · walk them to the van'); sfx.ui(); } catch (e) {} } }
      if (G0.follow && !G0.saved) { const dx = P.x - g.x, dz = P.z - g.z, d = Math.hypot(dx, dz); if (d > 2.4) { let mx = dx / d, mz = dz / d; if (!gridClear(g.x, g.z, P.x, P.z, g.y, P.y || 0)) { const nd = navDir(g.x, g.z, g.y); if (nd) { mx = nd[0]; mz = nd[1]; } } const sp = Math.min(4.2, d * 1.2); g.x += mx * sp * dt; g.z += mz * sp * dt; resolve(g, 0.4, g.y, true); botGround(G0.g, dt); G0.g.rotation.y = Math.atan2(mx, mz); G0.ph += dt * sp * 2.2; }
        const s1 = Math.sin(G0.ph); G0.rig.legL.rotation.x = -s1 * 0.6; G0.rig.legR.rotation.x = s1 * 0.6; G0.rig.armL.rotation.x = s1 * 0.4; G0.rig.armR.rotation.x = -s1 * 0.4;
        if (Math.hypot(g.x - H.van.x, g.z - H.van.z) < 4.5) { G0.saved = true; G0.g.visible = false; try { showMsg('A GROWER IS SAFE IN THE VAN'); sfx.pickup(); } catch (e) {} } } }
    const n = H.growers.filter(x => x.saved).length; H.objTxt = `${n} / 3 RESCUED`; H.objK = n / 3; if (n >= 3) hhEnd(true); }
  if (k === 'truck') { const T = H.truck; hhHuntSpawn(dt, 5.5, 10);
    const near = playerAlive() && Math.hypot(P.x - T.x, P.z - T.z) < 12, dEnd = Math.hypot(T.to.x - T.x, T.to.z - T.z);
    if (near && T.hp > 0) { const d = T.field && flowDir(T.field, T.x, T.z, T.y); let mx = T.to.x - T.x, mz = T.to.z - T.z; if (d) { mx = d[0]; mz = d[1]; } const L = Math.hypot(mx, mz) || 1, q = { x: T.x + mx / L * 1.7 * dt, z: T.z + mz / L * 1.7 * dt }; resolve(q, 1.2, T.y); T.x = q.x; T.z = q.z; T.y = groundAt(T.x, T.z, T.y + 0.5); let dy = Math.atan2(-mx, -mz) - T.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); T.g.rotation.y += dy * Math.min(1, dt * 2); }
    else if (T.hp > 0 && playerAlive()) showMsgOnce('THE TRUCK ONLY ROLLS WHILE YOU ARE CLOSE');
    T.g.position.set(T.x, T.y, T.z);
    for (const e of H.mobs) { const g = e.group.position; if (Math.hypot(g.x - T.x, g.z - T.z) < 3.2) { if ((e.truckT = (e.truckT || 0) - dt) <= 0) { e.truckT = 1; hhObjHit(T, e.K.dmg); } } }
    H.objK = 1 - dEnd / T.d0; H.objTxt = `TRUCK ${Math.round(Math.max(0, H.objK) * 100)}% · ${Math.max(0, Math.round(T.hp / T.max * 100))}% HEALTH`;
    if (dEnd < 4) hhEnd(true); else if (T.hp <= 0) hhEnd(false); }
  if (k === 'signal') { hhHuntSpawn(dt, Math.max(0.7, 1.4 - (240 - H.t) / 400), 22);
    const alive = H.boxes.filter(b => b.hp > 0); for (const e of H.mobs) if (!e.obj || e.obj.hp <= 0) { let best = null, bd = 1e9; for (const b of alive) { const d = Math.hypot(b.x - e.group.position.x, b.z - e.group.position.z); if (d < bd) { bd = d; best = b; } } e.obj = best; }
    for (const b of H.boxes) b.led.visible = b.hp > 0 && Math.sin(NOW * 6) > -0.3;
    H.objTxt = `${alive.length} / 3 RADIOS · ${fmtT(H.t)}`; H.objK = H.t / 240;
    if (!alive.length) hhEnd(false); else if (H.t <= 0) { H.D.pay *= alive.length / 3; hhEnd(true); } }
  if (k === 'nests') { const open = H.huntNests.filter(R => !R.closed); for (const R of open) hhHuntSpawn(dt / open.length, 4, 10, R);
    H.objTxt = `${4 - open.length} / 4 NESTS`; H.objK = (4 - open.length) / 4; if (!open.length) hhEnd(true); }
  if (H.t <= 0 && !H.over && k !== 'signal') hhEnd(false);
  return r;
};
// the top bar for the new types
const _hhDT6 = hhDomTick;
hhDomTick = function () {
  _hhDT6.apply(this, arguments); const H = M.hh, b = $('hhBar'); if (!H || !b || !hhHunt(H.kind) || hhRun(H.kind)) return;
  b.style.display = ''; b.querySelector('small').textContent = HH_TYPES[H.kind].n + (H.mod && H.mod !== 'none' ? ' · ' + HH_MODS.find(m => m.id === H.mod).n : '') + (H.daily ? ' · DAILY' : '') + (H.nightMis ? ' · NIGHT' : '');
  b.querySelector('i').style.width = (clamp(H.objK || 0, 0, 1) * 100).toFixed(1) + '%'; b.querySelector('i').style.background = '#7adf6a'; b.querySelector('span').textContent = `${H.objTxt || ''} · ${fmtT(Math.max(0, H.t))} LEFT`;
};
const _hhMk6 = hhMarkers;
hhMarkers = function (out) {
  _hhMk6(out); const H = M.hh; if (!H) return;
  for (const G0 of H.growers || []) if (!G0.saved) out.push({ x: G0.g.position.x, y: G0.g.position.y + 2.1, z: G0.g.position.z, t: G0.follow ? 'GROWER' : 'TRAPPED GROWER', c: '#ffb84a' });
  if (H.van && H.van.rescue) out.push({ x: H.van.x, y: H.van.y + 3, z: H.van.z, t: 'THE VAN', c: '#7aff6a' });
  if (H.truck) { out.push({ x: H.truck.x, y: H.truck.y + 3.2, z: H.truck.z, t: `TRUCK ${Math.max(0, Math.round(H.truck.hp / H.truck.max * 100))}%`, c: '#ffd24a' }); out.push({ x: H.truck.to.x, y: groundAt(H.truck.to.x, H.truck.to.z, 0.6) + 3, z: H.truck.to.z, t: 'DELIVER HERE', c: '#7aff6a' }); }
  for (const b of H.boxes || []) out.push({ x: b.x, y: b.y + 3, z: b.z, t: b.hp > 0 ? `${b.n} ${Math.round(b.hp / b.max * 100)}%` : `${b.n} DOWN`, c: b.hp > 0 ? '#7aff8a' : '#ff6a4a' });
};
/* ---------- pay, the daily, the weekly */
const _hhEnd6 = hhEnd;
hhEnd = function (won) {
  const H = M.hh; if (!H || H.over) return _hhEnd6.apply(this, arguments); const s = H.s;
  hhWkAdd(s, 'kills', H.kills); if (won) { hhWkAdd(s, 'missions', 1); if (H.di >= 2) hhWkAdd(s, 'fried', 1); if (H.daily) s.dailyDone = hhDay(); }
  const r = _hhEnd6.apply(this, arguments); if (H.nightMis) hhNight(false); return r;
};
const _hhNH6 = hhNestHit;
hhNestHit = function (e, dmg, by) { const r = _hhNH6.apply(this, arguments); if (r && M.hh) hhWkAdd(M.hh.s, 'nests', 1); return r; };
const _hhPU6 = hhPlotUse;
hhPlotUse = function (p) { const s = M.hh.s, g0 = s.grown | 0, r = _hhPU6.apply(this, arguments); if ((s.grown | 0) > g0) { hhWkAdd(s, 'harvest', 1); hhSave(s); } return r; };
// a big-head modifier, double drifters, fast, explosive
const _hhMob6 = hhMob;
hhMob = function (kind, x, z, y) {
  const H = M.hh; if (H && !H.base) { if (H.mod === 'drifters' && kind === 'burnout' && Math.random() < 0.4) kind = 'drifter'; if (H.mod === 'explosive' && kind === 'burnout' && Math.random() < 0.25) kind = 'bloater'; }
  const e = _hhMob6.call(this, kind, x, z, y); if (H && H.mod === 'bighead') try { e.rig.head.scale.setScalar(2); } catch (er) {} if (H && H.mod === 'fast') e.speed *= 1.3; return e;
};
/* ---------- the lobby: modifier + daily on the mission row, night switch, weekly challenges, the mission map */
const _hhRender6 = hhRender;
hhRender = function () {
  const r = _hhRender6.apply(this, arguments), s = hhLoad(), mi = clamp(s.mis | 0, 0, HH_MISSIONS.length - 1), sel = $('lobSel'); if (!sel) return r;
  const row = sel.querySelector('.hh-misrow span'); if (row) { const md = hhModOf(mi); row.insertAdjacentHTML('afterbegin', `<b style="font-size:10px;color:#ffd24a">${md.id === 'none' ? '' : md.n + ' · '}${mi === hhDailyMi() && s.dailyDone !== hhDay() ? 'DAILY: DOUBLE PAY · ' : ''}</b>`); }
  const arw = sel.querySelector('.hh-misrow .arw'); if (arw && !arw.querySelector('[data-act="hh-map"]')) arw.insertAdjacentHTML('afterbegin', '<button class="mini" data-act="hh-map">MAP</button>');
  const w = hhWk(s); hhSave(s);
  sel.insertAdjacentHTML('beforeend', `<div class="cod-row"><small>NIGHT MISSIONS</small><b>${s.nightMis ? 'ON' : 'OFF'}</b><span>darker and tougher · +40% pay</span><div class="arw"><button class="mini" data-act="hh-night">${s.nightMis ? 'TURN OFF' : 'TURN ON'}</button></div></div>` +
    `<div class="cod-row wide"><small>WEEKLY CHALLENGES · $2,000 + 2 RARE SEEDS EACH</small><span>${w.ids.map(id => { const C = HH_WK.find(x => x.id === id), v = Math.min(C.goal, w.c[id] | 0), done = v >= C.goal; return `${w.got[id] ? '✓ CLAIMED' : done ? `<button class="mini" data-act="hh-wk-${id}">CLAIM</button>` : '○'} ${C.n} (${v.toLocaleString()} / ${C.goal.toLocaleString()})`; }).join('<br>')}</span></div>`);
  return r;
};
const _hhAct6 = hhAct;
hhAct = function (act) {
  if (HHL.on && curScreen === 'lobby') {
    if (act === 'hh-night') { const s = hhLoad(); s.nightMis = !s.nightMis; hhSave(s); sfx.ui(); hhRender('[data-act="hh-night"]'); return true; }
    if (act.startsWith('hh-wk-')) { const s = hhLoad(), id = act.slice(6), w = hhWk(s), C = HH_WK.find(x => x.id === id); if (C && !w.got[id] && (w.c[id] | 0) >= C.goal) { w.got[id] = 1; s.cash += 2000; const sd = Math.random() < 0.3 ? 'milk' : 'north'; s.seeds[sd] = (s.seeds[sd] | 0) + 2; try { sfx.streak(); } catch (e) {} } hhSave(s); hhRender(); return true; }
    if (act === 'hh-map') { hhMissionMap(); return true; }
  }
  return _hhAct6.apply(this, arguments);
};
function hhMissionMap() {
  const s = hhLoad(), o = document.createElement('div'); o.className = 'onb-ov hh-mapov'; o.id = 'hhMapOv';
  o.innerHTML = `<div class="onb-box hh-mbox"><small>HOTBOX HORDE</small><b>MISSION MAP</b><div class="hh-mgrid">${HH_MAPS.map(m => `<div class="hh-mcol"><h4>${m.n}</h4>${HH_MISSIONS.map((x, i) => [x, i]).filter(([x]) => x.map === m.map).map(([x, i]) => { const b = s.best[i], md = hhModOf(i); return `<button class="hh-mcard${i === (s.mis | 0) ? ' on' : ''}" data-mi="${i}"><b>${HH_TYPES[x.type].n}</b><span>${b && b.won ? '✓ ' + HH_DIFF[b.d].n : 'not done'}${md.id !== 'none' ? ' · ' + md.n : ''}${i === hhDailyMi() && s.dailyDone !== hhDay() ? ' · <i>DAILY ×2</i>' : ''}</span></button>`; }).join('')}</div>`).join('')}</div><div class="onb-acts"><button class="btn" data-mi="x">CLOSE</button></div></div>`;
  o.addEventListener('click', e => { const b = e.target.closest('[data-mi]'); if (!b) return; if (b.dataset.mi !== 'x') { const s2 = hhLoad(); s2.mis = +b.dataset.mi; s2.diff = Math.min(s2.diff | 0, hhUnl(s2, s2.mis)); hhSave(s2); try { sfx.ui(); } catch (er) {} } o.remove(); hhRender('[data-act="hh-start"]'); });
  document.body.appendChild(o);
}
(() => { const s = document.createElement('style'); s.textContent = `.hh-mgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.hh-mcol h4{margin:0 0 6px;font-size:11px;letter-spacing:.2em;color:#c8a0ff}.hh-mcard{display:block;width:100%;text-align:left;margin-bottom:5px;padding:7px 8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:inherit;cursor:pointer;font:inherit}.hh-mcard b{display:block;font-size:11px;letter-spacing:.08em}.hh-mcard span{font-size:10px;opacity:.75}.hh-mcard i{font-style:normal;color:#ffd24a}.hh-mcard.on{border-color:#7aff8a;background:rgba(122,255,138,.08)}.hh-mapov .hh-mbox{width:min(980px,96vw)}`; document.head.appendChild(s); })();
