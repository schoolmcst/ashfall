/* ================================================================== VEHICLES for LAST TOKE (1.2.74)
   GOLF CARTS and DIRT BIKES parked round the map (on STASH ISLAND by the roads, on other maps a few on open ground).
   USE next to one gets in; USE again gets out. W/S (or the left stick) throttle and reverse, A/D steer, JUMP is the
   handbrake. You can't shoot while you drive; you sit up high and the mouse still looks round.
     GOLF CART - slow (13 m/s), steady, 420 HP, a roof to keep the sun off.
     DIRT BIKE - fast (19 m/s), turns sharp, 220 HP, does wheelies.
   Hitting someone at speed runs them over (the faster, the harder). Crashing into walls hurts the vehicle; explosions
   hurt it a lot; at 0 HP it blows up (and so do you if you're still on it).
   Every machine builds the same vehicles in the same places (fixed per map); online, the driver's vehicle travels in
   their presence (vh: [id, x, z, yaw, speed, hp]) and everyone moves it there. */
const VH_TYPES = {
  cart: { name: 'GOLF CART', max: 13, acc: 9, turn: 1.9, hp: 420, r: 1.0, eye: 1.75, len: 2.4 },
  bike: { name: 'DIRT BIKE', max: 19, acc: 14, turn: 2.6, hp: 220, r: 0.6, eye: 1.9, len: 1.9 },
};
const VH = { list: [], me: null, uH: false, eng: null };
const VH_SPOTS = { stashisle: [['cart', 2, 60, 0], ['bike', -2, -60, 3.14], ['cart', 60, 2, 1.57], ['bike', -60, -2, -1.57], ['cart', 110, -80, 0], ['bike', 110, 80, 0], ['cart', -110, -80, 3.14], ['bike', -110, 80, 3.14], ['cart', -80, 110, 1.57], ['bike', 80, 110, -1.57], ['cart', -80, -110, 1.57], ['bike', 80, -110, 1.57], ['cart', 2, 150, 0], ['bike', -2, -170, 0], ['cart', 150, -2, 1.57], ['bike', -150, 2, 1.57], ['cart', 40, -110, 1.57], ['bike', -40, 110, 1.57]] };   // 1.2.89: on the roads of the 391 m island
function vhMat(c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55, metalness: 0.2 }, o || {})); }
function vhModel(type) {
  const g = new THREE.Group(), box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; };
  const tire = vhMat(0x151515, { roughness: 0.95 }), wheel = (x, y, z, r, w) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 14), tire); c.rotation.z = Math.PI / 2; c.position.set(x, y, z); c.castShadow = true; g.add(c); return c; };
  const wheels = [];
  if (type === 'cart') {
    const body = vhMat(0xeeeee6), roof = vhMat(0x2a8a3a), seat = vhMat(0x5a3a22, { roughness: 0.9 }), dark = vhMat(0x222222);
    box(1.3, 0.35, 2.3, body, 0, 0.5, 0); box(1.3, 0.55, 0.5, body, 0, 0.85, -0.95); box(1.1, 0.18, 0.7, seat, 0, 0.82, 0.25); box(1.1, 0.5, 0.12, seat, 0, 1.1, 0.62);
    for (const [x, z] of [[-0.6, -0.95], [0.6, -0.95], [-0.6, 0.85], [0.6, 0.85]]) box(0.06, 1.3, 0.06, dark, x, 1.5, z);
    box(1.45, 0.08, 2.1, roof, 0, 2.15, -0.05); box(0.04, 0.4, 0.3, dark, 0, 1.15, -0.7);   // the steering column
    const sw = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 6, 14), dark); sw.position.set(0, 1.36, -0.62); sw.rotation.x = -1.0; g.add(sw); g.userData.wheel = sw;
    box(1.1, 0.4, 0.5, vhMat(0x6a5a3a, { roughness: 0.9 }), 0, 0.85, 1.05);   // the bag rack
    for (const [x, z] of [[-0.62, -0.75], [0.62, -0.75], [-0.62, 0.75], [0.62, 0.75]]) wheels.push(wheel(x, 0.28, z, 0.28, 0.2));
  } else {
    const frame = vhMat(0xff7a1a, { metalness: 0.4 }), dark = vhMat(0x1a1a1a), chrome = vhMat(0xc8c8c8, { metalness: 0.9, roughness: 0.25 });
    box(0.18, 0.12, 1.2, dark, 0, 0.62, 0.05); box(0.36, 0.3, 0.5, frame, 0, 0.88, -0.25); box(0.28, 0.12, 0.7, dark, 0, 0.98, 0.3);   // frame, tank, seat
    box(0.12, 0.7, 0.08, chrome, 0, 0.75, -0.72); box(0.7, 0.05, 0.05, dark, 0, 1.15, -0.68);                                        // forks, bars
    box(0.32, 0.06, 0.4, frame, 0, 0.72, -0.82); box(0.3, 0.06, 0.4, frame, 0, 0.75, 0.75); box(0.12, 0.12, 0.45, chrome, 0.14, 0.45, 0.45);   // fenders, exhaust
    wheels.push(wheel(0, 0.34, -0.78, 0.34, 0.14)); wheels.push(wheel(0, 0.34, 0.68, 0.34, 0.16));
  }
  g.userData.wheels = wheels;
  return g;
}
function vhMake(id, type, x, z, yaw) {
  const T = VH_TYPES[type], o = openNear(x, z), v = { id, type, T, x: o.x, z: o.z, y: 0, yaw, spd: 0, hp: T.hp, driver: null, g: vhModel(type), lean: 0, pitch: 0, net: null, netT: 0, hitT: 0, dead: false };
  v.g.position.set(v.x, 0, v.z); v.g.rotation.y = yaw; (M.br && M.br.group || scene).add(v.g); return v;
}
// at the start of a LAST TOKE match: the same vehicles in the same places on every machine
function vhSetup() {
  vhClear(); const spots = VH_SPOTS[curMap];
  if (spots) spots.forEach((s, i) => VH.list.push(vhMake(i, s[0], s[1], s[2], s[3])));
  else { const pr = PLAYRECT, sr = stashRand(curMap.length * 977 + 13); for (let i = 0; i < 4; i++) VH.list.push(vhMake(i, i % 2 ? 'bike' : 'cart', pr[0] + 6 + sr() * (pr[1] - pr[0] - 12), pr[2] + 6 + sr() * (pr[3] - pr[2] - 12), sr() * TAU)); }
}
function vhClear() { vhExit(true); for (const v of VH.list) if (v.g.parent) v.g.parent.remove(v.g); VH.list = []; vhEngine(0); }
const vhIn = () => !!VH.me;
function vhNearest() { let best = null, bd = 2.6; for (const v of VH.list) { if (v.dead || v.driver) continue; const d = Math.hypot(P.x - v.x, P.z - v.z); if (d < bd) { bd = d; best = v; } } return best; }
function vhEnter(v) {
  if (!v || v.driver || !playerAlive()) return; VH.me = v; v.driver = 'me'; v.spd = 0; G.adsOn = false;
  try { const gun = gunObjs[G.cur]; if (gun) gun.visible = false; } catch (e) {}
  try { showBanner(v.T.name, `${actName('use')} to get out · ${actName('jump')} handbrake`); sfx.ui(); } catch (e) {}
}
function vhExit(silent) {
  const v = VH.me; if (!v) return; VH.me = null; v.driver = null; vhEngine(0);
  if (v.dead || silent) { try { const gun = gunObjs[G.cur]; if (gun) gun.visible = true; } catch (e) {} if (silent) return; }
  const sx = Math.cos(v.yaw), sz = -Math.sin(v.yaw), o = openNear(v.x + sx * 1.8, v.z + sz * 1.8); P.x = o.x; P.z = o.z; P.y = groundAt(P.x, P.z, v.y + 0.5); P.vx = P.vz = P.vy = 0;
  try { const gun = gunObjs[G.cur]; if (gun) gun.visible = true; } catch (e) {}
}
function vhDamage(v, dmg, remote) {
  if (v.dead) return; v.hp -= dmg; if (v.hp > 0) return;
  v.dead = true; const p = { x: v.x, y: v.y + 0.7, z: v.z }; const mine = v.driver === 'me';
  try { if (v.g.parent) v.g.parent.remove(v.g); } catch (e) {}
  if (mine) vhExit(true);
  if (remote) { try { explosionFx(p, 1); sfx.explode(at(p.x, p.z, 30)); const d = Math.hypot(P.x - p.x, P.z - p.z); if (d < 6 && playerAlive()) hurtPlayer(110 * (1 - d / 6), p.x, p.z, true); } catch (e) {} return; }   // someone else's: they did the damage on their machine
  try { explode(p, 'vehicle', 6, 1.2, 'player'); } catch (e) {}
  if (mine) try { hurtPlayer(70, p.x, p.z, true); } catch (e) {}
}
// explosions near a vehicle hurt it (grenades, streaks, other vehicles)
function vhBlast(p, R) { if (!VH.list.length) return; for (const v of VH.list) { if (v.dead) continue; const d = Math.hypot(v.x - p.x, v.z - p.z); if (d < R) vhDamage(v, 260 * (1 - d / R)); } }
// the engine: a low buzz that rises with speed (my vehicle only)
function vhEngine(k) {
  try {
    if (!k) { if (VH.eng) { VH.eng.g.gain.value = 0; } return; }
    if (!VH.eng) { if (typeof actx === 'undefined' || !actx) return; const o = actx.createOscillator(), f = actx.createBiquadFilter(), g = actx.createGain(); o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 600; g.gain.value = 0; o.connect(f); f.connect(g); g.connect(actx.destination); o.start(); VH.eng = { o, f, g }; }
    const vol = (typeof S !== 'undefined' && S.sfxVol !== undefined ? S.sfxVol / 100 : 1) * 0.05;
    VH.eng.o.frequency.value = (VH.me && VH.me.type === 'bike' ? 70 : 45) + k * (VH.me && VH.me.type === 'bike' ? 180 : 90); VH.eng.g.gain.value = vol * (0.35 + k * 0.65);
  } catch (e) {}
}
// the driving itself (the player's vehicle and the bots' share it): throttle, steering, walls, running people over
function vhPhys(v, thr, steer, brake, dt, who) {
  const T = v.T, me = who === 'me';
  if (thr > 0) v.spd += thr * T.acc * dt * (v.spd < 0 ? 2 : 1); else if (thr < 0) v.spd += thr * T.acc * dt * (v.spd > 0 ? 1.6 : 0.6);
  v.spd *= 1 - (thr ? 0.25 : 0.9) * dt; if (brake) v.spd *= 1 - 4 * dt;
  v.spd = clamp(v.spd, -5, T.max * (me ? 1 : 0.8) * (M && M.feat && M.feat.lowgrav ? 1.1 : 1)); if (Math.abs(v.spd) < 0.05 && !thr) v.spd = 0;
  const grip = clamp(Math.abs(v.spd) / 4, 0, 1) * (brake ? 1.35 : 1); v.yaw += -steer * T.turn * grip * Math.sign(v.spd || 1) * dt; v.steer = steer;
  const fx = -Math.sin(v.yaw), fz = -Math.cos(v.yaw), nx = v.x + fx * v.spd * dt, nz = v.z + fz * v.spd * dt;
  const q = { x: nx, z: nz }; resolve(q, T.r, v.y);
  q.x = clamp(q.x, PLAYRECT[0] + T.r, PLAYRECT[1] - T.r); q.z = clamp(q.z, PLAYRECT[2] + T.r, PLAYRECT[3] - T.r);
  let crash = false;
  if (Math.hypot(q.x - nx, q.z - nz) > 0.02 && Math.abs(v.spd) > 3) {   // crashed into something
    crash = true; const hard = Math.abs(v.spd);
    if (NOW - v.hitT > 0.4) { v.hitT = NOW; vhDamage(v, hard * 4); if (me) { G.shake = Math.max(G.shake, clamp(hard / 300, 0.01, 0.05)); try { rumble(0.8, 0.5, 200); } catch (e) {} } try { sfx.thud(Object.assign({ vol: clamp(hard / 12, 0.3, 1.2) }, me ? {} : at(v.x, v.z, 25))); } catch (e) {} }
    v.spd *= -0.25;
  }
  v.x = q.x; v.z = q.z; const gy = groundAt(v.x, v.z, v.y + 0.3); v.y = lerp(v.y, gy, clamp(dt * 12, 0, 1));
  if (Math.abs(v.spd) > 5) {   // running people over
    const hitK = Math.abs(v.spd) * (v.type === 'cart' ? 11 : 9);
    for (const e of enemies.slice()) {
      if (e === who || !e.entry || e.entry.alive === false || (me && isFriend(e)) || (!me && M.squad > 1 && e.team === who.team)) continue;
      const gp = e.group.position, d = Math.hypot(gp.x - v.x, gp.z - v.z); if (d > T.r + 0.55 || Math.abs(gp.y - v.y) > 1.4) continue;
      if (e.vhHitT && NOW - e.vhHitT < 0.6) continue; e.vhHitT = NOW;
      try { G.killSrc = me ? 'veh' : ''; damageEnemy(e, hitK, false, { x: fx, z: fz }, false, me ? 'player' : who); sfx.thud(me ? { vol: 1 } : Object.assign({ vol: 1 }, at(v.x, v.z, 25))); } catch (er) {} G.killSrc = '';
      v.spd *= 0.75;
    }
    if (!me && playerAlive() && !(M.squad > 1 && who.team === M.myTeam) && Math.hypot(P.x - v.x, P.z - v.z) < T.r + 0.55 && Math.abs(P.y - v.y) < 1.4 && (!G.vhHitT || NOW - G.vhHitT > 0.6)) { G.vhHitT = NOW; try { hurtPlayer(hitK, v.x, v.z, false); } catch (er) {} v.spd *= 0.75; }
  }
  return { fx, fz, crash };
}
// every frame of updatePlayer: true while I'm driving (the vehicle moves me instead of my legs)
function vhPlayer(dt) {
  const v = VH.me; if (!v) return false;
  if (!playerAlive() || v.dead) { vhExit(true); return false; }
  const T = v.T, thr = clamp((kb('fwd') ? 1 : 0) - (kb('back') ? 1 : 0) - pad.my, -1, 1), steer = clamp((kb('right') ? 1 : 0) - (kb('left') ? 1 : 0) + pad.mx, -1, 1), brake = kb('jump') || pad.jump;
  const yaw0 = v.yaw, { fx, fz } = vhPhys(v, thr, steer, brake, dt, 'me'); P.yaw += v.yaw - yaw0;   // the view turns with the vehicle; the mouse still looks round
  P.x = v.x; P.z = v.z; P.y = v.y; P.vx = fx * v.spd; P.vz = fz * v.spd; P.vy = 0; P.onGround = true; P.eye = lerp(P.eye, T.eye - 0.1, clamp(10 * dt, 0, 1));
  P.recoilAcc = 0; try { const gun = gunObjs[G.cur]; if (gun && gun.visible) gun.visible = false; } catch (e) {}
  vhEngine(clamp(Math.abs(v.spd) / T.max, 0, 1));
  // the camera (updatePlayer's own camera code is skipped while driving): the seat, a little roll on the bike, wider at speed
  const shk = G.shake * S.shake / 100; camera.position.set(P.x + rnd(-shk, shk), P.y + P.eye + rnd(-shk, shk), P.z + rnd(-shk, shk)); camera.rotation.set(P.pitch, P.yaw, v.lean * 0.6);
  G.shake = Math.max(0, G.shake - dt * 0.05); G.ads = 0; G.adsOn = false;
  const fov = baseFov + clamp(Math.abs(v.spd) / T.max, 0, 1) * 8; if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = lerp(camera.fov, fov, clamp(dt * 4, 0, 1)); camera.updateProjectionMatrix(); }
  listener.x = P.x; listener.z = P.z; listener.yaw = P.yaw; listener.y = P.y + P.eye; listener.fy = P.y;
  if (G.time - G.lastHit > 5 && G.health < (G.maxHp || 100)) G.health = Math.min(G.maxHp || 100, G.health + 28 * (G.maxHp || 100) / 100 * dt);
  return true;
}
// every frame of a LAST TOKE match: the models, the remote drivers, the get-in prompt
function vhUpdate(dt) {
  if (!VH.list.length) return;
  for (const v of VH.list) {
    if (v.dead) continue;
    if (v.bot && (!enemies.includes(v.bot) || v.bot.veh !== v)) { if (v.bot.veh === v) v.bot.veh = null; v.bot = null; v.driver = null; }   // its bot died at the wheel
    if (v.want && (!enemies.includes(v.want) || v.want.veh)) v.want = null;
    if (v.net && NOW - v.netT > 1.5) { v.net = null; v.driver = null; v.spd = 0; }   // the remote driver stopped sending: it stays parked there
    if (v.net) { v.x = lerp(v.x, v.nx, clamp(dt * 10, 0, 1)); v.z = lerp(v.z, v.nz, clamp(dt * 10, 0, 1)); let dyw = v.nyaw - v.yaw; dyw = Math.atan2(Math.sin(dyw), Math.cos(dyw)); v.yaw += dyw * clamp(dt * 10, 0, 1); v.y = groundAt(v.x, v.z, v.y + 0.3); }
    const k = v.spd / v.T.max; const st = v.driver ? v.steer || 0 : 0; v.lean = lerp(v.lean, v.type === 'bike' ? clamp(-st * k * 0.5, -0.4, 0.4) : 0, clamp(dt * 6, 0, 1));
    v.pitch = lerp(v.pitch, v.type === 'bike' && v.driver === 'me' && kb('fwd') && kb('sprint') && v.spd > 4 ? -0.35 : 0, clamp(dt * 4, 0, 1));   // SPRINT + forward on the bike: a wheelie
    v.g.position.set(v.x, v.y, v.z); v.g.rotation.set(v.pitch, v.yaw, v.lean, 'YXZ');
    for (const w of v.g.userData.wheels) w.rotation.x += v.spd * dt / 0.3;
    if (v.g.userData.wheel && v.driver === 'me') v.g.userData.wheel.rotation.z = -((kb('right') ? 1 : 0) - (kb('left') ? 1 : 0) + pad.mx) * 0.6;
  }
  const u = kb('use') || pad.use;
  if (VH.me) { if (u && !VH.uH) vhExit(); }
  else if (playerAlive() && G.state === 'playing') { const v = vhNearest(); if (v) { G.interactTxt = `${v.T.name} · ${Math.ceil(v.hp)} HP · PRESS ${actName('use')} TO DRIVE`; try { showMsg(G.interactTxt); } catch (e) {} if (u && !VH.uH) vhEnter(v); } }
  VH.uH = u;
}
function vhHud() { const v = VH.me; if (!v) return ''; return ` · <b>${v.T.name}</b> ${Math.round(Math.abs(v.spd) * 3.6)} KM/H · ${Math.ceil(v.hp)} HP`; }
/* ---------- online: my vehicle in my presence, other drivers' vehicles from theirs */
function vhPack() { const v = VH.me; if (!v) return undefined; const r1 = x => Math.round(x * 10) / 10; return [v.id, r1(v.x), r1(v.z), Math.round(v.yaw * 100) / 100, r1(v.spd), Math.ceil(v.hp)]; }
function vhRemote(R, a) {
  if (!Array.isArray(a) || !VH.list.length) return; const v = VH.list[a[0] | 0]; if (!v || v.dead) return;
  if (v.driver === 'me') { if (String(R.entry && R.entry.name) < String(NET.nick)) vhExit(); else return; }   // we both got in: the name that sorts first keeps it
  v.net = R; v.driver = R; v.netT = NOW; v.nx = netNum(a[1], -ARENA, ARENA, v.x); v.nz = netNum(a[2], -ARENA, ARENA, v.z); v.nyaw = +a[3] || 0; v.spd = netNum(a[4], -10, 30, 0);
  const hp = netNum(a[5], -1, 999, v.hp); if (hp <= 0 && !v.dead) vhDamage(v, 9999, true); else v.hp = Math.min(v.hp, hp);
}
/* ---------- BOTS (offline, and the host's bots online): a bot that has a long way to run to the circle takes a free
   vehicle close by, drives it there (steering round what is in the way, backing up when stuck), and gets out when it
   arrives, when a fight starts close by, or when it is stuck for good. Bots in a vehicle don't shoot. */
function vhBotWant(e, tx, tz) {
  if (e.veh || e.net || !VH.list.length || (e.vhNoT && M.t < e.vhNoT)) return null;
  const g = e.group.position; if (Math.hypot(tx - g.x, tz - g.z) < 35) return null;
  let best = null, bd = 22; for (const v of VH.list) { if (v.dead || v.driver || (v.want && v.want !== e)) continue; const d = Math.hypot(v.x - g.x, v.z - g.z); if (d < bd) { bd = d; best = v; } }
  if (!best) return null; best.want = e;
  if (bd < 2.4) { vhBotEnter(e, best); return null; }
  return { x: best.x, z: best.z, y: best.y || 0 };
}
function vhBotEnter(e, v) { e.veh = v; v.driver = e; v.bot = e; v.want = null; v.stuckN = 0; v.revT = 0; v.chkT = 1.2; v.cx0 = v.x; v.cz0 = v.z; e.goal = null; }
function vhBotExit(e) {
  const v = e.veh; e.veh = null; e.vhNoT = M.t + 12; e.goal = null; if (!v) return;
  v.driver = null; v.bot = null; v.spd *= 0.3;
  if (!enemies.includes(e)) return;
  const o = openNear(v.x + Math.cos(v.yaw) * 1.8, v.z - Math.sin(v.yaw) * 1.8); e.group.position.set(o.x, groundAt(o.x, o.z, v.y + 0.5), o.z);
}
// in the bots' loop (match.js): true while this bot is driving (it skips walking and shooting this frame)
function vhBotDrive(e, dt) {
  const v = e.veh; if (!v) return false;
  if (v.dead) { vhBotExit(e); return false; }
  const B = M.br; let tx, tz;
  if (B) { const t = B.to && B.closing ? B.to : { x: B.cx, z: B.cz }; tx = t.x; tz = t.z; } else if (e.goal) { tx = e.goal.x; tz = e.goal.z; } else { vhBotExit(e); return false; }
  const dist = Math.hypot(tx - v.x, tz - v.z), tp = e.tgt ? tpos(e.tgt) : null, fight = tp && Math.hypot(tp.x - v.x, tp.z - v.z) < 22 && M.t - (e.seenT || -9) < 0.6;
  if (dist < 10 || (fight && Math.random() < dt * 2) || v.stuckN >= 3) { vhBotExit(e); return false; }
  let want = Math.atan2(-(tx - v.x), -(tz - v.z)); const look = 4 + Math.abs(v.spd) * 0.35;
  const clear = a => gridClear(v.x, v.z, v.x - Math.sin(a) * look, v.z - Math.cos(a) * look, v.y, v.y);
  if (!clear(want)) for (const o of [0.5, -0.5, 1, -1, 1.6, -1.6]) if (clear(want + o)) { want += o; break; }
  const da = Math.atan2(Math.sin(want - v.yaw), Math.cos(want - v.yaw));
  let thr = Math.abs(da) > 1.3 ? 0.35 : dist < 25 ? 0.6 : 1, steer = clamp(-da * 2, -1, 1);
  if (v.revT > 0) { v.revT -= dt; thr = -1; steer = -steer; }
  if ((v.chkT -= dt) <= 0) { v.chkT = 1.2; if (Math.hypot(v.x - v.cx0, v.z - v.cz0) < 1.2 && v.revT <= 0) { v.revT = 0.9; v.stuckN++; } else if (v.stuckN > 0) v.stuckN -= 0.34; v.cx0 = v.x; v.cz0 = v.z; }
  vhPhys(v, thr, steer, false, dt, e);
  e.group.position.set(v.x, v.y + 0.3, v.z); e.group.rotation.y = v.yaw + Math.PI; e.moveSp = 0; e.goal = null;
  if (e.spawnProt > 0) e.spawnProt -= dt;
  return true;
}
// online: the host sends its bots' vehicles in its own presence (vb), the same way a driver sends theirs
function vhPackBots() { const out = []; for (const v of VH.list) if (v.bot && !v.dead) { const r1 = x => Math.round(x * 10) / 10; out.push([v.id, r1(v.x), r1(v.z), Math.round(v.yaw * 100) / 100, r1(v.spd), Math.ceil(v.hp)]); } return out.length ? out : undefined; }
const VH_BOTR = { entry: { name: '~bots' } };
function vhRemoteBots(list) { if (!Array.isArray(list)) return; for (const a of list.slice(0, 16)) vhRemote(VH_BOTR, a); }
