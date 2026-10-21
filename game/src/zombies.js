/* ================================================================== ZOMBIES: rounds of the dead on the new maps (solo)
   Main menu ZOMBIES opens its own lobby (pick a map, start). You start with the SERVICE 9 and 500 points.
   Zombies shamble at first; later rounds bring joggers and runners, more of them and tougher. They path to you and
   swing when close (three hits put you down; health comes back when you get away). Points: 10 a hit, 60 a kill,
   100 a headshot kill, 130 a melee kill. Spend them at the MYSTERY CRATE (950: a random gun) and the AMMO CRATE
   (250: full ammo). No loadout: everyone starts the same. */
MODES.zomb = { name: 'ZOMBIES', short: 'ZOMBIES', icon: 'ZMB', desc: 'Survive round after round of the dead. Start with a pistol, earn points, and buy guns from the Mystery Crate.', teams: false, respawn: 0, score: 0, time: 0, unit: 'ROUNDS' };
const ZL = { on: false, map: 'blackwell', net: 'solo', code: '' };
try { ZL.net = localStorage.getItem('ashfall.znet') === 'coop' ? 'coop' : 'solo'; ZL.code = localStorage.getItem('ashfall.zcode') || ''; } catch (e) {}
const Z = { zid: 0, targets: [], round: 0, toSpawn: 0, spawnT: 0, breakT: 0, active: false, guns: [], crate: null, ammo: null, boxT: 0, best: { round: 0, pts: 0 } };
try { Object.assign(Z.best, JSON.parse(localStorage.getItem('ashfall.zbest') || '{}')); } catch (e) {}
const Z_BOX = 950, Z_AMMO = 250;
const Z_POOL = () => ARMORY.filter(d => ['ar', 'smg', 'lmg', 'mr', 'sr', 'sg'].includes(d.cat));

/* ---------- the lobby: like multiplayer, without the class / loadout */
function openZLobby() { ZL.on = true; if (G.state !== 'menu') leaveGame(); renderZLobby('.cod-go'); showScreen('lobby'); }
function renderZLobby(focusSel) {
  const st = careerOf(false), m = MAPS[ZL.map];
  $('lobKind').textContent = 'ZOMBIES';
  $('lobPlayer').innerHTML = playerCard(st); cardBanner($('lobPlayer'));
  for (const b of document.querySelectorAll('#lobby .cod-nav [data-act="loadout"], #lobby .cod-nav [data-act="streaks"]')) b.style.display = 'none';
  const ph = document.querySelector('#lobby .cod-foot .padhint'); if (ph) ph.innerHTML = 'START  PLAY';
  $('lobSel').innerHTML =
    `<div class="cod-play"><button class="btn primary lob-go cod-go" data-act="z-start"><small>${zcStartLabel()[0]}</small><b>${zcStartLabel()[1]}</b></button></div>` + zcLobbyRows() +
    `<div class="cod-row cod-map"><small>MAP</small><b>${m ? m.name : ''}</b><span>start in the lobby · buy doors to open the hospital</span></div>` +
    `<div class="cod-row"><small>STARTING GEAR</small><b>SERVICE 9 · 2 FRAGS</b><span>everyone starts the same · 500 points to spend</span></div>` +
    `<div class="cod-row"><small>MYSTERY CRATE · ${Z_BOX} POINTS</small><b>A RANDOM GUN</b><span>AMMO CRATE · ${Z_AMMO} POINTS · full ammo for your guns</span></div>` +
    `<div class="cod-row"><small>YOUR BEST</small><b>ROUND ${Z.best.round || 0}</b><span>${(Z.best.pts || 0).toLocaleString()} POINTS</span></div>`;
  $('lobRoster').innerHTML = zcRightHtml() +
    `<div class="ros-info"><b>ZOMBIES</b>Survive round after round of the dead. They walk at first, then jog, then run. 10 points a hit, 60 a kill, 100 a headshot kill, 130 a melee kill. Press USE (E / X) at the crates and doors to buy. Open doors to reach more of the hospital, and find the GUN UPGRADER (5000) in the north wing.${ZL.net === 'coop' ? ' In co-op, a downed teammate is revived by holding USE next to them.' : ''}</div>`;
  ZC.rosterKey = ''; zcWireLobby(); zcLobbyRefresh(false);
  if (ZL.net === 'coop' && NET.app) { try { partyWire(); netCheckService(); netLobbyCount(); netCheckVersion(); zcLanList(); } catch (e) {} }
  if (focusSel) focusFirst(focusSel);
}
function zombAct(act) {
  if (act === 'go-zombies') { sfx.ui(); openZLobby(); return true; }
  if (act === 'go-on' || act === 'go-mp' || act === 'deploy' || act === 'play') { zombLobbyOff(); return false; }
  if (!ZL.on || curScreen !== 'lobby') return false;
  if (act === 'z-start' || act === 'lob-start') {
    if (ZL.net !== 'coop') { startMatch('zomb', { map: ZL.map }); return true; }
    if (!ZC.on) { if (!(typeof partyWaiting === 'function' && partyWaiting())) zcJoin('quick'); }
    else if (zcHost()) zcHostStart();
    return true;
  }
  if (act === 'z-net-' || act === 'z-net+') { ZL.net = ZL.net === 'coop' ? 'solo' : 'coop'; if (ZL.net === 'solo' && ZC.on) zcLeave(); ZC.err = ''; try { localStorage.setItem('ashfall.znet', ZL.net); } catch (e) {} sfx.ui(); renderZLobby(`[data-act="${act}"]`); return true; }
  if (act === 'z-code') { const i = $('zCode'), c = i ? cleanCode(i.value) : ''; if (!c || c === 'public') { if (i) { i.focus(); i.placeholder = 'type a code first'; } return true; } ZL.code = c; zcJoin('code', c); return true; }
  if (act === 'z-leave') { zcLeave(); sfx.ui(); return true; }
  if ((act === 'z-map-' || act === 'z-map+' || act === 'map-' || act === 'map+' || act === 'mode-' || act === 'mode+') && ZC.on && !zcHost()) return true;
  if (act === 'z-map-' || act === 'z-map+' || act === 'map-' || act === 'map+' || act === 'mode-' || act === 'mode+') return true;
  if (false) { const L = MAP_CHOICES(), i = Math.max(0, L.indexOf(ZL.map)), d = act.endsWith('+') ? 1 : -1; ZL.map = L[(i + d + L.length) % L.length]; try { localStorage.setItem('ashfall.zmap', ZL.map); } catch (e) {} sfx.ui(); renderZLobby(`[data-act="z-map${d > 0 ? '+' : '-'}"]`); return true; }
  if (act === 'playlist' || act === 'loadout' || act === 'streaks' || act === 'custom') return true;
  if (act === 'lobby-back') { zombLobbyOff(); if (ZC.on) zcLeave(); showScreen('menu'); return true; }
  return false;
}
function zombLobbyOff() { ZL.on = false; for (const b of document.querySelectorAll('#lobby .cod-nav [data-act="loadout"], #lobby .cod-nav [data-act="streaks"]')) b.style.display = ''; const ph = document.querySelector('#lobby .cod-foot .padhint'); if (ph) ph.innerHTML = 'LB / RB  CHANGE MODE &middot; START  PLAY'; }

/* ---------- the game */
function zombStart(cfg) {
  buildSpawns();
  const sp = LAYOUT.spawn[0]; Object.assign(P, { x: sp.x, z: sp.z, y: sp.y || 0 }); P.yaw = Math.atan2(sp.x, sp.z);
  Object.assign(Z, { zid: 0, round: 0, toSpawn: 0, spawnT: 0, breakT: ZC.on && ZC.inGame ? 6 : 4, active: false, guns: ['sidearm'], boxT: 0 });
  zombEquip(); G.grenades = 2; G.points = 500; G.score = 0;
  Z.up = new Set(); zdInit(); zombEquip();
  zombCrates();
  if (ZC.on && ZC.inGame) zcStartLocal();
  G.state = 'playing'; showScreen(null); lockPointer(); startMatchStats(); updateModeHud(true);
  showBanner('ZOMBIES', 'survive · 500 points to spend'); zombHud(true);
}
function zombEquip(keepCur) {
  const g = Z.guns, gr = G.grenades;
  equipClass(g.length > 1 ? { p: g[0], s: g[1], e: 'frag', k: 'none', factory: true } : { p: null, s: g[0], e: 'frag', k: 'none', only: g[0], factory: true });
  if (gr !== undefined) G.grenades = gr;
  zuApply();
  if (keepCur !== undefined) { G.cur = Math.min(keepCur, WEAPONS.length - 1); gunObjs.forEach((o, i) => { o.visible = i === G.cur; }); }
  el.slots._cur = -1;
}
// the two crates, on the map's objective spots near the middle
function zombCrates() {
  if (OBJ.group) scene.remove(OBJ.group);
  OBJ.group = new THREE.Group(); scene.add(OBJ.group);
  const mk = (p, col, glow, label) => {
    const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }), lit = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(glow), emissiveIntensity: 1.6 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 0.8), wood); box.position.y = 0.38; box.castShadow = true; g.add(box);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.12, 0.86), wood); lid.position.y = 0.81; g.add(lid); g.userData.lid = lid;
    for (const sx of [-0.55, 0.55]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.82), lit); s.position.set(sx, 0.38, 0); g.add(s); }
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 12, 12, 1, true), new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 6; g.add(beam);
    g.position.set(p.x, p.y || 0, p.z); OBJ.group.add(g); g.userData.label = label;
    return g;
  };
  const near = q => { const o = openNear(q.x, q.z); return { x: o.x, z: o.z, y: q.y || 0 }; };
  const hp = LAYOUT.hp, a = near(hp[1] || hp[0]), b = near(hp[2] || hp[0]);
  Z.crate = mk(a, 0x5a3a1c, 0x9a3cff, 'MYSTERY CRATE'); Z.ammo = mk(b, 0x3a4630, 0x7dff5a, 'AMMO CRATE');
}
function zombHp(r) { return r <= 9 ? 100 + 60 * (r - 1) : (100 + 60 * 8) * Math.pow(1.1, r - 9); }
function zombSpeedType(r) { const x = Math.random(); if (r >= 6 && x < Math.min(0.85, 0.25 + (r - 6) * 0.12)) return 'run'; if (r >= 3 && x < Math.min(0.9, 0.35 + (r - 3) * 0.12)) return 'jog'; return 'walk'; }
const ZMAT = new Map();
function zombMat(m) {
  if (Array.isArray(m)) return m.map(zombMat);
  let z = ZMAT.get(m); if (z) return z;
  z = m.clone(); if (z.color) z.color.multiply(new THREE.Color(0x8fa06e)).multiplyScalar(0.8); z.roughness = 1; if (z.emissive) z.emissive.setRGB(0.02, 0.035, 0.01);
  ZMAT.set(m, z); return z;
}
function makeZombie(x, z, y) {
  const r = Z.round, kind = zombSpeedType(r), rig = cloneSoldier('rifleman'), root = rig.root;
  root.rotation.order = 'YXZ'; root.position.set(x, y || 0, z); scene.add(root);
  root.traverse(o => { if (o.isMesh && !o.userData.hitbox) o.material = zombMat(o.material); });
  if (rig.gun) rig.gun.visible = false;
  const e = {
    rig, group: root, type: 'zombie', zombie: true, kind, hp: zombHp(r), maxHp: zombHp(r),
    speed: kind === 'run' ? rnd(4.3, 4.9) : kind === 'jog' ? rnd(2.7, 3.2) : rnd(1.4, 1.9),
    phase: Math.random() * 6, phase0: Math.random() * 6, chk: 0.6, lastX: x, lastZ: z, avoidT: 0, avoidDir: 1, flinch: 0, aim: 0, crouchK: 0, hold: 0,
    atkT: 0, atkCd: rnd(0.2, 0.6), growlT: rnd(1, 6), lurch: rnd(-0.3, 0.3), slowT: 0, noSeeT: 0,
  };
  e.zid = ++Z.zid;
  rig.hits.forEach(m => { m.userData.enemy = e; });
  enemies.push(e);
  return e;
}
function zombSpawn() {
  const pts = zdSpawnPts(), T = Z.targets || []; if (!pts.length || !T.length) return null;
  for (let t = 0; t < 80; t++) {
    const p = pts[(Math.random() * pts.length) | 0], minD = t < 30 ? 16 : t < 60 ? 11 : 7;
    if (T.some(q => Math.hypot(p.x - q.x, p.z - q.z) < minD) || !T.some(q => Math.hypot(p.x - q.x, p.z - q.z) < 60)) continue;
    const n = nodeOf(p.x, p.z, p.y); if (n < 0 || !navField || navField[n] < 0) continue;
    return makeZombie(p.x, p.z, p.y);
  }
  return null;
}
function zombRound() {
  Z.round++; Z.toSpawn = Math.min(80, 6 + (Z.round - 1) * 3); Z.spawnT = 1; Z.active = true;
  G.wave = Z.round; if (!(ZC.on && ZC.down)) G.health = G.maxHp; if (ZC.on && ZC.dead) zcRespawn();
  showBanner(`ROUND ${Z.round}`, Z.round === 1 ? 'here they come' : Z.round % 5 === 0 ? 'they are getting faster' : `${Z.toSpawn} zombies`);
  try { tone(70, 1.6, 0.18, 'sawtooth'); tone(52, 2.2, 0.14, 'triangle'); } catch (e) {}
  zombHud(true);
}
function updateZombies(dt) {
  if (zcInGame()) zcFrame(dt);
  zdTick(dt);
  if (zcInGame() && !zcHost()) { zombHud(); zombCrateTick(dt); return; }
  Z.targets = zombTargets();
  if (!Z.active) { Z.breakT -= dt; if (Z.breakT <= 0) zombRound(); }
  else {
    const cap = Math.min(24, 10 + Z.round);
    if (Z.toSpawn > 0) { Z.spawnT -= dt; if (Z.spawnT <= 0 && enemies.length < cap) { if (zombSpawn()) Z.toSpawn--; Z.spawnT = Math.max(0.35, 1.9 - Z.round * 0.13); } }
    else if (!enemies.length) { Z.active = false; Z.breakT = 8; showBanner(`ROUND ${Z.round} SURVIVED`, 'next round in 8 seconds'); }
  }
  for (let i = 0; i < enemies.length; i++) zombThink(enemies[i], i, dt);
  zombHud();
  zombCrateTick(dt);
}
// the survivor a zombie goes for: the nearest one standing (keeps its pick unless another is much closer)
function zombPick(e) {
  const g = e.group.position, T = Z.targets || []; let best = null, bd = 1e9;
  for (const t of T) { let d = Math.hypot(t.x - g.x, t.z - g.z) + Math.abs(t.y - g.y) * 3; if (e.tgKey && (t.me ? 'me' : t.peer) === e.tgKey) d -= 4; if (d < bd) { bd = d; best = t; } }
  e.tgKey = best ? (best.me ? 'me' : best.peer) : ''; return best;
}
function zombThink(e, i, dt) {
  const T = zombPick(e), g = e.group;
  if (!T) { e.atkT = Math.max(0, e.atkT - dt); botGround(g, dt); animZombie(e, dt, 0); return; }
  const dx = T.x - g.position.x, dz = T.z - g.position.z, dist = Math.max(Math.hypot(dx, dz), 0.001), nx = dx / dist, nz = dz / dist;
  const up = Math.abs((T.y || 0) - g.position.y) < 1.6;
  let mx = 0, mz = 0;
  if (e.atkT > 0) {   // mid-swing: stand and hit
    e.atkT -= dt;
    if (!e.hitDone && e.atkT < 0.3) { e.hitDone = true; if (dist < 1.75 && up) { if (!T.me) zcSwing(T.peer, 34, e); else if (G.state === 'playing' || G.state === 'paused') { G.killer = null; hurtPlayer(34, g.position.x, g.position.z); try { sfx.melee && sfx.melee(); } catch (err) {} } } }
  } else {
    if (e.avoidT > 0) { e.avoidT -= dt; mx = -nz * e.avoidDir + nx * 0.3; mz = nx * e.avoidDir + nz * 0.3; }
    else if (gridClear(g.position.x, g.position.z, T.x, T.z, g.position.y, T.y)) { mx = nx + -nz * e.lurch * 0.3; mz = nz + nx * e.lurch * 0.3; }
    else { const nd = T.me ? navDir(g.position.x, g.position.z, g.position.y) : flowDir(flowField(T.x, T.z, T.y), g.position.x, g.position.z, g.position.y); if (nd) { mx = nd[0]; mz = nd[1]; } else { mx = nx; mz = nz; } }
    if (dist < 1.3 && up) { mx = mz = 0; e.atkCd -= dt; if (e.atkCd <= 0) { e.atkT = 0.75; e.hitDone = false; e.atkCd = rnd(0.7, 1.1); } }
  }
  const ml = Math.hypot(mx, mz), slow = (e.slowT = Math.max(0, (e.slowT || 0) - dt)) > 0 ? 0.45 : 1;
  const sp = ml > 0.01 ? e.speed * slow * (e.stunT > 0 ? 0.3 : 1) : 0;
  if (ml > 0.01) { g.position.x += mx / ml * sp * dt; g.position.z += mz / ml * sp * dt; }
  resolve(g.position, 0.42, g.position.y); botGround(g, dt);
  for (let j = 0; j < enemies.length; j++) { if (j === i) continue; const o = enemies[j].group.position, sx = g.position.x - o.x, sz = g.position.z - o.z, sd = Math.hypot(sx, sz); if (sd < 0.8 && sd > 0.001) { const pu = (0.8 - sd) * 0.5; g.position.x += sx / sd * pu; g.position.z += sz / sd * pu; } }
  if (dist < 0.95) { g.position.x -= nx * (0.95 - dist); g.position.z -= nz * (0.95 - dist); }
  g.position.x = clamp(g.position.x, PLAYRECT[0] + 0.5, PLAYRECT[1] - 0.5); g.position.z = clamp(g.position.z, PLAYRECT[2] + 0.5, PLAYRECT[3] - 0.5);
  const want = ml > 0.01 && dist > 2 ? Math.atan2(mx, mz) : Math.atan2(dx, dz); let dy = want - g.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; g.rotation.y += dy * Math.min(1, dt * 6);
  e.chk -= dt; if (e.chk <= 0) { e.chk = 0.7; if (sp > 0 && Math.hypot(g.position.x - e.lastX, g.position.z - e.lastZ) < 0.35) { e.avoidT = 0.9; e.avoidDir = Math.random() < 0.5 ? 1 : -1; } e.lastX = g.position.x; e.lastZ = g.position.z; }
  if (e.stunT > 0) e.stunT -= dt;
  if ((e.growlT -= dt) <= 0) { e.growlT = rnd(3, 8); try { const o = at(g.position.x, g.position.z, 16); tone(e.kind === 'run' ? rnd(120, 160) : rnd(70, 110), rnd(0.35, 0.7), 0.05 * o.vol, 'sawtooth', null, o); } catch (err) {} }
  animZombie(e, dt, sp);
}
function animZombie(e, dt, sp) {
  const r = e.rig, run = e.kind === 'run', amp = clamp(sp / 2.4, 0, 1.4);
  e.phase += dt * sp * (run ? 2.6 : 2.2);
  const s = Math.sin(e.phase), c = Math.cos(e.phase), sway = Math.sin(NOW * 1.3 + e.phase0) * 0.08;
  r.legL.rotation.x = -s * 0.7 * amp; r.legR.rotation.x = s * 0.7 * amp;
  r.knL.rotation.x = clamp(0.25 + Math.max(0, Math.sin(e.phase + 1.9)) * 0.9 * amp, 0, 1.5); r.knR.rotation.x = clamp(0.25 + Math.max(0, Math.sin(e.phase + 1.9 + Math.PI)) * 0.9 * amp, 0, 1.5);
  r.hips.position.y = 0.96 + Math.abs(c) * 0.04 * amp;
  r.torso.rotation.set((run ? 0.42 : 0.22) + e.flinch * 0.4, s * 0.12 * amp + sway, sway * 0.6 + e.lurch * 0.2);
  r.head.rotation.set(-0.2 + sway, sway * 2, e.lurch * 0.5);
  let ax = -1.45 + Math.sin(NOW * 2 + e.phase0) * 0.1, swing = 0;
  if (e.atkT > 0) { const p = 1 - e.atkT / 0.75; swing = Math.sin(clamp(p, 0, 1) * Math.PI); }
  r.armR.rotation.set(ax - swing * 0.9 + (run ? s * 0.4 : 0), -0.15, 0.1); r.elR.rotation.set(-0.25 - swing * 0.5, 0, 0);
  r.armL.rotation.set(ax - swing * 0.7 - (run ? s * 0.4 : 0), 0.15, -0.1); r.elL.rotation.set(-0.3 - swing * 0.4, 0, 0);
  e.flinch = Math.max(0, e.flinch - dt * 4);
}
// points (called from the damage and kill hooks)
function zombHit(e, head) { G.points += 10; }
function zombKill(e, head, boom, melee) {
  const pts = melee ? 130 : head ? 100 : 60; G.points += pts - 10; G.score += pts;
  popScore('+' + pts, head ? 'head' : '', head ? 'HEADSHOT' : melee ? 'MELEE' : '');
}
// crates: stand close and press USE
function zombCrateTick(dt) {
  const pr = $('zPrompt'); if (!pr) return;
  let msgTxt = zcInGame() ? zcReviveTick(dt) : '';
  for (const [c, cost, fn] of [[Z.crate, Z_BOX, zombBuyBox], [Z.ammo, Z_AMMO, zombBuyAmmo]]) {
    if (!c) continue;
    c.children[c.children.length - 1].material.opacity = 0.1 + Math.sin(NOW * 2) * 0.04;
    const d = Math.hypot(P.x - c.position.x, P.z - c.position.z);
    if (!msgTxt && d < 2.3 && Math.abs(P.y - c.position.y) < 1.5 && G.state === 'playing') { msgTxt = `${c.userData.label} · ${cost} POINTS · PRESS ${actName('use')}${G.points < cost ? ' · NOT ENOUGH POINTS' : ''}`; if ((kb('use') || pad.use) && !Z.useHeld && G.points >= cost) fn(); }
  }
  if (!msgTxt && G.state === 'playing') {
    const use = (kb('use') || pad.use) && !Z.useHeld, dr = zdPrompt();
    if (dr) { msgTxt = `${dr.d.name} · ${dr.d.cost} POINTS · PRESS ${actName('use')}${G.points < dr.d.cost ? ' · NOT ENOUGH POINTS' : ''}`; if (use && G.points >= dr.d.cost) zdBuy(dr); }
    else if (zuNear()) { const w = WEAPONS[G.cur], done = w && Z.up && Z.up.has(w.def.id); msgTxt = done ? 'GUN UPGRADER · THIS GUN IS UPGRADED' : `GUN UPGRADER · UPGRADE ${w ? w.def.name : ''} · ${ZU_COST} POINTS · PRESS ${actName('use')}${G.points < ZU_COST ? ' · NOT ENOUGH POINTS' : ''}`; if (use && !done && G.points >= ZU_COST) zuBuy(); }
  }
  Z.useHeld = kb('use') || pad.use;
  if (Z.boxT > 0) { Z.boxT -= dt; const lid = Z.crate.userData.lid; lid.position.y = 0.81 + Math.min(0.5, (1.4 - Z.boxT) * 1.2); lid.rotation.x = -Math.min(1.1, (1.4 - Z.boxT) * 2); if (Z.boxT <= 0) { lid.position.y = 0.81; lid.rotation.x = 0; } }
  if (pr.textContent !== msgTxt) { pr.textContent = msgTxt; pr.style.opacity = msgTxt ? 1 : 0; }
}
function zombBuyBox() {
  if (Z.boxT > 0) return;
  G.points -= Z_BOX; Z.boxT = 1.4;
  const have = new Set(Z.guns), pool = Z_POOL().filter(d => !have.has(d.id)), d = pool[(Math.random() * pool.length) | 0];
  if (Z.guns.length < 2) Z.guns.unshift(d.id); else Z.guns[G.cur] = d.id;
  zombEquip(Z.guns.indexOf(d.id));
  showBanner(d.name, CATS[d.cat].name); try { sfx.streak(); } catch (e) {}
}
function zombBuyAmmo() { G.points -= Z_AMMO; WEAPONS.forEach(w => { w.ammo = w.magSize; w.reserve = w.reserveMax || w.def.reserve; }); G.grenades = Math.max(G.grenades, 2); showMsg('AMMO REFILLED'); try { sfx.ui(); } catch (e) {} }
// HUD: the round in big red numbers bottom-left, points above it
function zombHud(force) {
  let h = $('zHud');
  if (!h) {
    h = document.createElement('div'); h.id = 'zHud'; h.innerHTML = '<div class="zh-pts"></div><div class="zh-round"></div>'; ($('hud') || document.body).appendChild(h);
    const p = document.createElement('div'); p.id = 'zPrompt'; ($('hud') || document.body).appendChild(p);
    const st = document.createElement('style'); st.textContent = `#zHud{position:absolute;left:28px;bottom:118px;pointer-events:none;text-align:left}#zHud .zh-round{font:900 72px/1 Georgia,serif;color:#b3161a;text-shadow:0 0 18px rgba(179,22,26,.6),0 2px 0 #000}#zHud .zh-pts{font:800 22px var(--font,system-ui);letter-spacing:.12em;color:#f2e6c8;text-shadow:0 2px 6px #000;margin-bottom:4px}
#zPrompt{position:absolute;left:50%;top:62%;transform:translateX(-50%);padding:8px 16px;background:rgba(0,0,0,.6);border-left:3px solid #9a3cff;color:#fff;font:700 13px var(--font,system-ui);letter-spacing:.14em;opacity:0;transition:opacity .15s;pointer-events:none;white-space:nowrap}`;
    document.head.appendChild(st);
  }
  const on = M.mode === 'zomb' && (G.state === 'playing' || G.state === 'paused' || G.state === 'zdown' || G.state === 'zspec');
  if (h.style.display !== (on ? '' : 'none')) h.style.display = on ? '' : 'none';
  if (!on) { const p = $('zPrompt'); if (p) p.style.opacity = 0; return; }
  const pts = (G.points | 0).toLocaleString() + ' PTS', rd = Z.round ? String(Z.round) : '';
  if (force || h._p !== pts) { h._p = pts; h.firstChild.textContent = pts; }
  if (force || h._r !== rd) { h._r = rd; h.lastChild.textContent = rd; }
}
function zombClear() { Z.active = false; Z.crate = Z.ammo = null; zombHud(); try { zdClear(); } catch (e) {} if (typeof ZC !== 'undefined' && ZC.on) { ZC.inGame = false; ZC.down = ZC.dead = false; zcClearProxies(); for (const R of ZC.rem.values()) zcDropAvatar(R); zcTeamHud(true); } }
function zombDeathText() {
  const nb = Z.round > (Z.best.round || 0) || (Z.round === Z.best.round && G.score > (Z.best.pts || 0));
  if (nb) { Z.best = { round: Z.round, pts: G.score }; try { localStorage.setItem('ashfall.zbest', JSON.stringify(Z.best)); } catch (e) {} }
  $('overStats').textContent = `YOU SURVIVED ${Z.round} ROUND${Z.round === 1 ? '' : 'S'}  ·  KILLS ${G.kills}  ·  SCORE ${G.score}`;
  $('overBest').textContent = nb ? 'NEW PERSONAL BEST' : `BEST  ·  ROUND ${Z.best.round}  ·  SCORE ${Z.best.pts}`;
}
