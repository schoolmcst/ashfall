const dmgFall = (w, d) => { const e = w.eff || 1e9, m = w.fallMin === undefined ? 0.6 : w.fallMin; return d <= e ? 1 : Math.max(m, 1 - (d - e) / e * (1 - m)); };
/* ================================================================== gameplay: state, player, weapons */
const P = { x: 0, y: 0, z: 10, vx: 0, vz: 0, vy: 0, yaw: 0, pitch: 0, eye: 1.7, onGround: true, bob: 0, recoilAcc: 0, stepK: 0 };
const G = {
  state: 'loading', health: 100, lastHit: -99, wave: 0, kills: 0, score: 0, time: 0, grenades: 3,
  cur: 0, fireT: 0, reloadT: 0, reloading: false, swapT: 0, kick: 0, ads: 0, shake: 0, flashT: 0, shotT: 9, shots: 0,
  toSpawn: 0, spawnT: 0, breakT: 0, waveActive: false, adsOn: false, dmgDirT: 0,
};
let NOW = 0; // always-running clock (used for idle animation in menus)
const keys = {};
let mouseDown = false, clickQueued = false, mouseAds = false;
const pad = { on: false, gp: null, mx: 0, my: 0, lx: 0, ly: 0, fire: false, ads: false, jump: false, crouch: false, sprint: false };
const enemies = [], dying = [], pickups = [], grenadesInFlight = [], menuSoldiers = [];

// WEAPONS holds the two guns carried this life (primary, secondary), built from the active class (classes.js)
let WEAPONS = [];
function makeInstance(def) { const w = Object.assign({}, def); w.def = def; w.ammo = def.mag; w.magSize = def.mag; w.reserve = def.reserve; return w; }

let viewmodel = null, gunObjs = [];
const HIP = new THREE.Vector3(0.15, -0.17, -0.36);
function setupViewmodel() {
  viewmodel = new THREE.Group(); vmCamera.add(viewmodel);
  equipClass(activeClass(), true);   // its shaders compile when the first match starts, not on the loading screen
}
// put a class in the player's hands: two weapon instances, their models, equipment and perk
function equipClass(cls, noCompile) {
  const defs = cls.only ? [ARM[cls.only]] : [ARM[cls.p] || ARM.marc, ARM[cls.s] || ARM.sidearm];
  for (const g of gunObjs) { viewmodel.remove(g); g.userData.flash.visible = false; }
  WEAPONS = defs.map(makeInstance); if (cls.factory) WEAPONS.forEach(w => { w.factory = true; });
  gunObjs = defs.map(d => gunFor(d));
  gunObjs.forEach((g, i) => { g.visible = i === 0; viewmodel.add(g); });
  setGunShader(S.gunShader);
  WEAPONS.forEach((w, i) => applyLoadout(i));
  WEAPONS.forEach(w => { w.ammo = w.magSize; w.reserve = Math.min(w.reserveMax, w.def.reserve); });
  G.equip = EQUIP[cls.e] ? cls.e : 'frag'; G.perks = perksOf(cls); G.equipped = cls;
  G.cur = 0; G.burstLeft = 0;
  if (!noCompile) try { renderer.compile(vmScene, vmCamera); } catch (e) {}
}
const perk = k => !!(G.perks && G.perks.includes(k)) && !(typeof M !== 'undefined' && M && M.mode === 'gun' && false);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ------------------------------------------------------------------ rumble */
function rumble(strong, weak, ms) {
  if (!S.padVibration) return;
  const a = pad.gp && pad.gp.vibrationActuator; if (!a || !a.playEffect) return;
  const k = (S.padRumble === undefined ? 100 : S.padRumble) / 100; if (k <= 0) return;
  try { const r = a.playEffect('dual-rumble', { duration: ms, strongMagnitude: clamp(strong * k, 0, 1), weakMagnitude: clamp(weak * k, 0, 1) }); if (r && r.catch) r.catch(() => {}); } catch (e) {}
}

/* ------------------------------------------------------------------ player */
const vig = $('vignette'), dmgdir = $('dmgdir');
function hurtPlayer(dmg, fx, fz, boom) {
  if ((G.state !== 'playing' && !pausedOnline()) || G.spawnProt > 0 || G.holdT > 0) return;
  if (boom && perk('flak')) dmg *= 0.65;
  if (!boom && G.state === 'playing') { const kn = perk('iron') ? 0.3 : 1; P.pitch += rnd(0.004, 0.012) * kn; P.yaw += rnd(-0.008, 0.008) * kn; }   // getting shot knocks your aim
  G.health -= dmg; G.lastHit = G.time; G.shake = Math.max(G.shake, 0.012);
  vig.style.opacity = clamp(0.45 + ((G.maxHp || 100) - G.health) / 120 * (100 / (G.maxHp || 100)), 0, 1);
  setTimeout(() => { vig.style.opacity = G.health < 0.35 * (G.maxHp || 100) ? 0.5 : 0; }, 160);
  if (fx !== undefined && S.dmgIndicator) {
    const vx = fx - P.x, vz = fz - P.z, l = Math.hypot(vx, vz) || 1;
    const fwdx = -Math.sin(P.yaw), fwdz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    dmgdir.style.transform = `rotate(${Math.atan2((vx * rx + vz * rz) / l, (vx * fwdx + vz * fwdz) / l)}rad)`;
    dmgdir.style.opacity = 1; G.dmgDirT = 1.2;
  }
  sfx.hurt(); rumble(0.7, 0.4, 180);
  if (G.health <= 0) { G.health = 0; die(); }
}

function isFiring() { return mouseDown || pad.fire; }
let wasSprint = false;
function updatePlayer(dt) {
  const w = WEAPONS[G.cur];
  const crouch = kb('crouch') || pad.crouch;
  const hold = typeof holding === 'function' && holding();
  const fwd = hold ? 0 : clamp((kb('fwd') ? 1 : 0) - (kb('back') ? 1 : 0) - pad.my, -1, 1);
  const str = hold ? 0 : clamp((kb('right') ? 1 : 0) - (kb('left') ? 1 : 0) + pad.mx, -1, 1);
  const moving = fwd !== 0 || str !== 0;
  const sprint = !!(kb('sprint') || pad.sprint) && fwd > 0 && !G.adsOn && !crouch && !(isFiring() && !G.reloading);
  if (sprint) G.sprintEnd = G.time;   // a short moment to bring the gun up after a sprint (Endurance: shorter)
  let speed = (sprint ? 8 * (perk('endure') ? 1.06 : 1) : crouch ? 2.6 : G.adsOn ? 3.2 * (perk('prowl') ? 1.35 : 1) : 5.2) * (w.move || 1) * (perk('light') ? 1.07 : 1) * (M && M.infMe ? 1.2 : 1) * (typeof zpHas === 'function' && zpHas('zoom') ? 1.15 : 1);
  if (G.reloading) speed *= 0.85;
  const wx = -Math.sin(P.yaw) * fwd + Math.cos(P.yaw) * str, wz = -Math.cos(P.yaw) * fwd - Math.sin(P.yaw) * str;
  const wl = Math.hypot(wx, wz) || 1, mag = Math.min(1, wl);
  const tx = moving ? wx / wl * speed * mag : 0, tz = moving ? wz / wl * speed * mag : 0;
  const acc = P.onGround ? 14 : 3;
  P.vx = lerp(P.vx, tx, clamp(acc * dt, 0, 1)); P.vz = lerp(P.vz, tz, clamp(acc * dt, 0, 1));
  P.x += P.vx * dt; P.z += P.vz * dt;
  resolve(P, 0.4, P.y);
  P.x = clamp(P.x, PLAYRECT[0] + 0.45, PLAYRECT[1] - 0.45); P.z = clamp(P.z, PLAYRECT[2] + 0.45, PLAYRECT[3] - 0.45);
  if ((kb('jump') || pad.jump) && P.onGround && !hold) { P.vy = 7.4; P.onGround = false; sfx.thud({ vol: 0.5 }); }
  P.vy -= 22 * dt; const py0 = P.y; P.y += P.vy * dt;
  if (P.vy > 0) { const ce = ceilingAt(P.x, P.z, py0); if (P.y + 1.8 > ce) { P.y = Math.max(py0, ce - 1.8); P.vy = 0; } }
  const gy = groundAt(P.x, P.z, P.y);
  if (P.y <= gy) { if (!P.onGround && P.vy < -2) G.landT = clamp(-P.vy / 11, 0.25, 1); if (!P.onGround && P.vy < -4 && !perk('light')) { G.shake = Math.max(G.shake, 0.01); sfx.thud({ vol: 0.8 }); } P.y = gy; P.vy = 0; P.onGround = true; } else if (P.y > gy + 0.05) P.onGround = false;
  P.eye = lerp(P.eye, crouch ? 1.1 : 1.7, clamp(10 * dt, 0, 1));
  const hs = Math.hypot(P.vx, P.vz);
  if (P.onGround && hs > 0.5) { const prev = Math.floor(P.bob / Math.PI); P.bob += dt * hs * 1.6; if (Math.floor(P.bob / Math.PI) !== prev) sfx.step(clamp(hs / 6, 0.2, 1.2) * (perk('dead') ? 0.3 : 1)); }
  const rec = Math.min(P.recoilAcc, P.recoilAcc * dt * 4 + 0.0005); P.pitch -= rec; P.recoilAcc -= rec;
  if (G.time - G.lastHit > (perk('tough') ? 3 : 5) && G.health < (G.maxHp || 100)) G.health = Math.min(G.maxHp || 100, G.health + 28 * (inMatch() ? 1 : diff().regen) * (G.maxHp || 100) / 100 * dt);

  const shk = G.shake * S.shake / 100, bobOn = S.bob ? 1 : 0;
  camera.position.set(P.x + rnd(-shk, shk), P.y + P.eye + Math.sin(P.bob * 2) * 0.025 * (hs / 5) * bobOn + rnd(-shk, shk), P.z + rnd(-shk, shk));
  camera.rotation.set(P.pitch, P.yaw, Math.cos(P.bob) * 0.004 * (hs / 5) * bobOn);
  G.shake = Math.max(0, G.shake - dt * 0.05);
  G.ads = lerp(G.ads, G.adsOn && G.swapT <= 0 ? 1 : 0, clamp(dt * 11 * (perk('amped') ? 1.14 : 1) / Math.pow(w.adsTime || 1, 1.4), 0, 1));
  const fov = lerp(baseFov + (sprint ? 5 : 0), adsFovFor(w, baseFov), G.ads);
  if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }
  animateViewmodel(dt, hs, sprint, bobOn);
  listener.x = P.x; listener.z = P.z; listener.yaw = P.yaw; listener.y = P.y + P.eye; listener.fy = P.y;
  $('cross').style.opacity = 0.9 * (1 - G.ads);
  return { moving, sprint };
}

function animateViewmodel(dt, hs, sprint, bobOn) {
  const w = WEAPONS[G.cur], g = gunObjs[G.cur], u = g.userData;
  if (u.dots) for (const d of u.dots) d.visible = G.ads > 0.6;   // the reticle only shows when you look through the sight
  const adsX = 0, adsY = -w.sightY, adsZ = w.adsZ;
  let vx = lerp(HIP.x, adsX, G.ads), vy = lerp(HIP.y, adsY, G.ads), vz = lerp(HIP.z - (u.hipBack || 0), adsZ, G.ads);
  const bobAmt = (1 - G.ads * 0.85) * (hs / 5) * bobOn, idle = Math.sin(NOW * 1.6) * 0.0016 * (1 - G.ads * 0.7);
  const kAds = 1 - 0.75 * G.ads;
  vx += Math.cos(P.bob) * 0.008 * bobAmt; vy += Math.abs(Math.sin(P.bob)) * 0.01 * bobAmt + idle; vz += G.kick * 0.07 * (1 - 0.4 * G.ads); vy += G.kick * 0.008 * kAds;
  let rx = G.kick * 0.06 * kAds, ry = 0, rz = 0;
  if (sprint) { rx += -0.25; ry += 0.5; vy -= 0.04; vx -= 0.05; }
  // weapon lags behind fast turns, leans into strafes, dips on landing, lifts in the air
  let dYaw = P.yaw - (G.lastYaw === undefined ? P.yaw : G.lastYaw); while (dYaw > Math.PI) dYaw -= TAU; while (dYaw < -Math.PI) dYaw += TAU;
  const dPitch = P.pitch - (G.lastPitch === undefined ? P.pitch : G.lastPitch); G.lastYaw = P.yaw; G.lastPitch = P.pitch;
  const sk = clamp(dt * 10, 0, 1), sAmt = 1 - G.ads * 0.85;
  G.swayX = lerp(G.swayX || 0, clamp(dYaw * 2.2, -0.05, 0.05), sk); G.swayY = lerp(G.swayY || 0, clamp(-dPitch * 2.2, -0.04, 0.04), sk);
  vx += G.swayX * sAmt; vy += G.swayY * sAmt; rz += G.swayX * 1.6 * sAmt; ry += G.swayX * 0.6 * sAmt;
  const lat = P.vx * Math.cos(P.yaw) - P.vz * Math.sin(P.yaw); rz -= clamp(lat, -8, 8) * 0.012 * sAmt;
  if (G.landT > 0) { G.landT = Math.max(0, G.landT - dt * 3.2); const l = Math.sin(G.landT * Math.PI) * G.landT; vy -= l * 0.06; rx -= l * 0.08; }
  G.airK = lerp(G.airK || 0, P.onGround ? 0 : 1, clamp(dt * 6, 0, 1)); vy += G.airK * 0.018 * sAmt; rx += G.airK * 0.05 * sAmt;
  // grenade throw: rifle drops out of the way while the arm swings
  if (G.throwT > 0) { G.throwT = Math.max(0, G.throwT - dt); const t = Math.sin((1 - G.throwT / 0.6) * Math.PI); vy -= t * 0.28; rx -= t * 0.6; rz += t * 0.35; vx += t * 0.06; }
  // melee: a quick bash with the weapon
  if (G.meleeT > 0) { G.meleeT = Math.max(0, G.meleeT - dt); const t = Math.sin((1 - G.meleeT / 0.55) * Math.PI); vx -= t * 0.12; vz -= t * 0.16; vy += t * 0.03; ry += t * 0.9; rz += t * 0.5; rx -= t * 0.15; }
  // inspect (F / D-pad down): turn the weapon over, look at the other side, bring it back
  if (G.inspectT > 0) {
    if (isFiring() || G.reloading || G.adsOn || sprint || G.swapT > 0 || G.throwT > 0) G.inspectT = 0;
    else {
      G.inspectT = Math.max(0, G.inspectT - dt); const ip = 1 - G.inspectT / 2.6;
      const A = smooth(0, 0.22, ip) * (1 - smooth(0.42, 0.55, ip)), B = smooth(0.45, 0.6, ip) * (1 - smooth(0.82, 1, ip));
      ry += A * 0.95 - B * 0.55; rz += A * 0.55 - B * 0.35; rx += B * 0.3 + A * 0.08; vx -= A * 0.07 - B * 0.03; vy += A * 0.05 + B * 0.04; vz += (A + B) * 0.05;
    }
  }
  G.shotT += dt;
  if (G.reloading) {
    const p = clamp(1 - G.reloadT / (G.reloadDur || w.reload), 0, 1), a = Math.sin(p * Math.PI);
    vy -= a * 0.12; rx -= a * 0.35; rz += a * 0.25;
    if (u.mag && u.magBase) {
      u.mag.visible = !(p > 0.3 && p < 0.4);
      const off = p < 0.3 ? 0.2 * smooth(0.14, 0.3, p) : p < 0.4 ? 0.2 : 0.2 * (1 - smooth(0.4, 0.7, p));
      u.mag.position.copy(u.magBase).addScaledVector(u.magDir || DOWN, off); u.mag.position.z += p < 0.3 ? 0.03 * smooth(0.14, 0.3, p) : 0;
    }
    if (u.handL) { const b = Math.sin(clamp((p - 0.08) / 0.75, 0, 1) * Math.PI); u.handL.position.set(u.handLBase.x, u.handLBase.y - 0.1 * b, u.handLBase.z + (u.mag ? (u.magReach || 0.27) : 0.08) * b); }
    if (u.pump) u.pump.position.z = 0.1 * Math.max(0, Math.sin(p * Math.PI * 4));
    if (u.cyl && !u.cylSpin) { const a = smooth(0.08, 0.22, p) * (1 - smooth(0.78, 0.92, p)); u.cyl.rotation.z = a * 1.3; u.cyl.position.x = -0.035 * a; rz += a * 0.5; }
    if (u.cyl && u.cylSpin) { const a = smooth(0.1, 0.25, p) * (1 - smooth(0.8, 0.95, p)); u.cyl.position.x = -0.06 * a; u.cyl.rotation.z = p * TAU * 1.5; rz += a * 0.4; }
    if (u.brk) { const a = smooth(0.06, 0.2, p) * (1 - smooth(0.8, 0.94, p)); u.brk.rotation.x = -0.55 * a; rx += a * 0.2; }
    if (u.rocket) u.rocket.visible = !(p > 0.25 && p < 0.5) && (w.ammo > 0 || p > 0.5);
    if (u.lever) u.lever.rotation.x = 0;
    if (G.reloadEmpty && p > 0.74) {   // chamber a round: charging handle / slide
      const r = Math.sin(clamp((p - 0.74) / 0.22, 0, 1) * Math.PI);
      rz -= r * 0.22; rx += r * 0.05;
      if (u.handL && u.mag) u.handL.position.set(u.handLBase.x + 0.03 * r, u.handLBase.y + 0.1 * r, u.handLBase.z + 0.3 * r);
      if (u.slide) u.slide.position.z = 0.045 * r;
      if (!G.rackDone && p > 0.82) { G.rackDone = true; sfx.rack(); }
    }
  } else {
    if (u.mag && u.magBase) { u.mag.visible = true; u.mag.position.copy(u.magBase); }
    if (u.handL) u.handL.position.copy(u.handLBase);
    const t = G.shotT;
    if (u.pump) u.pump.position.z = (t > 0.22 && t < 0.62) ? 0.11 * Math.sin((t - 0.22) / 0.4 * Math.PI) : 0;
    if (u.lever) { const a = (t > 0.12 && t < 0.48) ? Math.sin((t - 0.12) / 0.36 * Math.PI) : 0; u.lever.rotation.x = -0.9 * a; rx -= a * 0.06; if (a > 0.9 && !G.cycled) { G.cycled = true; sfx.rack(); } }
    if (u.bolt) {   // lift, pull, push, lock
      const k = clamp((t - 0.18) / Math.min(0.75, w.interval * 0.7), 0, 1), up = smooth(0, 0.18, k) * (1 - smooth(0.82, 1, k)), back = smooth(0.2, 0.4, k) * (1 - smooth(0.6, 0.8, k));
      u.bolt.rotation.z = up * 1.1; u.bolt.position.z = u.boltZ + back * 0.075; rz -= up * 0.12; ry += back * 0.05; vy -= up * 0.012;
      if (back > 0.9 && !G.cycled) { G.cycled = true; sfx.rack(); }
    }
    if (u.cyl && !u.cylSpin) { u.cyl.rotation.z = 0; u.cyl.position.x = 0; }
    if (u.cyl && u.cylSpin) { u.cyl.position.x = 0; const k = clamp(t / 0.15, 0, 1); u.cyl.rotation.z = (u.cylBase || 0) + (k - 1) * TAU / 6; }
    if (u.brk) u.brk.rotation.x = 0;
    if (u.rocket) u.rocket.visible = w.ammo > 0;
  }
  if (u.slide && !G.reloading) u.slide.position.z = w.ammo === 0 && G.shotT >= 0.06 ? 0.04 : G.shotT < 0.12 ? 0.04 * Math.sin(Math.min(1, G.shotT / 0.12) * Math.PI) : 0;   // locks back when empty
  if (G.swapT > 0) { vy -= Math.sin((G.swapT / 0.35) * Math.PI * 0.5) * 0.3; rx -= G.swapT * 0.8; }
  viewmodel.position.set(vx, vy, vz); viewmodel.rotation.set(rx, ry, rz);
  G.kick = Math.max(0, G.kick - dt * 9);
  G.flashT -= dt;
  if (G.flashT <= 0) { u.flash.visible = false; vmFlashLight.intensity = 0; }
}

/* ------------------------------------------------------------------ shooting */
const _fwd = new THREE.Vector3(), _right = new THREE.Vector3(), _muz = new THREE.Vector3(), _org = new THREE.Vector3(), _sdir = new THREE.Vector3();
function shoot(moving) {
  if (M && M.infMe) { melee(); return; }
  const w = WEAPONS[G.cur], u = gunObjs[G.cur].userData;
  netShot(); w.ammo--; G.fireT = w.interval * (typeof zpHas === 'function' && zpHas('double') ? 0.75 : 1); G.shotT = 0; G.shots++; G.cycled = false;
  if (w.burst) { G.burstLeft = G.burstLeft > 0 ? G.burstLeft - 1 : w.burst - 1; if (G.burstLeft > 0 && w.ammo > 0) G.fireT = w.burstGap; else G.burstLeft = 0; }
  if (w.stealth) sfx.suppressed(w.pellets > 1); else sfx.gun(w.sfxP);
  const rm = w.rum || [0.1, 0.4, 60]; rumble(rm[0], rm[1], rm[2]);
  if (u.cylSpin) u.cylBase = (u.cylBase || 0) + TAU / 6;
  if (w.ww && typeof zwwFire === 'function') { zwwFire(w); return; }   // zombies wonder weapons fire their own way
  if (w.proj) { launchProjectile(w, u); return; }
  if (typeof botsHear === 'function') botsHear(P.x, P.z, M.myTeam, w.stealth ? 14 : 55, 'P');
  const fresh = G.time - (G.lastShotTime || -9) > Math.max(0.22, w.interval * 2.4); G.lastShotTime = G.time;
  G.bloom = fresh ? 0 : Math.min(1.6, (G.bloom || 0) + (w.pellets > 1 ? 0 : 0.2));
  let spread = G.adsOn ? (fresh && w.pellets === 1 ? 0 : w.adsSpread * (w.pellets > 1 ? 1 : 0.55 + G.bloom)) : w.spread * (perk('steady') ? 0.75 : 1) * (1 + G.bloom * 0.35);
  if (moving) spread *= 1.7; if (!P.onGround) spread *= 2.2; if (P.eye < 1.4) spread *= 0.75;
  camera.updateMatrixWorld();
  _org.copy(camera.position);
  const targets = wallMeshes.slice();
  for (const e of enemies) if (!isFriend(e)) for (const m of e.rig.hits) targets.push(m);
  _fwd.set(0, 0, -1).applyQuaternion(camera.quaternion); _right.set(Math.cos(P.yaw), 0, -Math.sin(P.yaw));
  _muz.set(viewmodel.position.x + 0.01, viewmodel.position.y + 0.012, viewmodel.position.z - w.len * 0.96).applyQuaternion(camera.quaternion).add(camera.position);
  let anyHit = false, anyKill = false, anyHead = false;
  for (let p = 0; p < w.pellets; p++) {
    _sdir.set(rnd(-1, 1) * spread, rnd(-1, 1) * spread, -1).normalize().applyQuaternion(camera.quaternion);
    raycaster.set(_org, _sdir); raycaster.far = w.range;
    const hits = raycaster.intersectObjects(targets, false);
    const h = hits[0];
    if (!h) { if (!w.stealth && p === 0 && w.pellets === 1 && (G.shots & 1)) addTracer(_muz, _v.copy(_org).addScaledVector(_sdir, 70), 0.05, 0.012); continue; }
    const ud = h.object.userData;
    // full damage up to the gun's MAX DAMAGE RANGE, then down to its floor (fallMin) at twice that distance
    const fall = dmgFall(w, h.distance);
    if (ud.barrel) damageBarrel(ud.barrel, w.dmg * fall);
    if (ud.enemy) {
      const head = !!ud.head, armour = ud.enemy.type === 'heavy' && !ud.enemy.pvp ? (w.vsHeavy || 1) : 1, killed = damageEnemy(ud.enemy, w.dmg * fall * armour * (head ? w.head : (ud.mult || 1)), head, _sdir);
      anyHit = true; anyKill = anyKill || killed; anyHead = anyHead || head; hitEffects(h, true); if (p === 0) try { sfx.flesh(); } catch (err) {}
    } else { hitEffects(h, false); if (p === 0 || p === 3) try { sfx.impact(at(h.point.x, h.point.z, 9, h.point.y - 1.1), Math.random() < 0.14); } catch (err) {} }
    if (!w.stealth && (w.pellets === 1 ? (!w.auto || (G.shots & 1)) : p < 3)) addTracer(_muz, h.point, 0.045, w.pellets > 1 ? 0.01 : 0.014);
  }
  statShot(anyHit);
  if (anyHit && S.hitMarkers) {
    const hm = $('hit'); hm.className = anyKill ? 'kill' : ''; hm.style.opacity = 1;
    clearTimeout(hm._t); hm._t = setTimeout(() => (hm.style.opacity = 0), 90);
    sfx.hit(anyHead);
  }
  // holding the trigger climbs: each shot of a spray kicks a bit more (LMGs most), with a steady sideways pull per gun
  const cat = w.def.cat, sprayN = G.sprayN = G.time - (G.lastKickT || -9) < Math.max(0.25, w.interval * 2.2) ? Math.min(14, (G.sprayN || 0) + 1) : 0; G.lastKickT = G.time;
  const climb = 1 + sprayN * (cat === 'lmg' ? 0.07 : cat === 'smg' ? 0.05 : cat === 'ar' ? 0.06 : 0);
  const kick = w.recoil * rnd(0.9, 1.1) * (G.adsOn ? 0.72 : 1) * climb, pull = (w.def.id.charCodeAt(0) % 3 - 1) * 0.45;
  P.pitch = clamp(P.pitch + kick, -1.5, 1.5); P.recoilAcc += kick * (cat === 'lmg' ? 0.35 : 0.42); P.yaw += (rnd(-1, 1) + pull * Math.min(1, sprayN / 4)) * w.recoil * (G.adsOn ? 0.42 : 0.6) * (cat === 'lmg' ? 1.3 : 1);   // less snaps back on its own: you pull down
  G.kick = clamp(w.recoil / ((w.def.recoil || w.recoil || 0.011) * recoilK(w.def)), 0.5, 2.2); G.shake = Math.max(G.shake, w.pellets > 1 ? 0.01 : 0.003);   // the gun visibly kicks harder or softer with recoil attachments
  // muzzle flash on the weapon, light on the world, smoke and a brass casing
  u.flash.visible = !w.stealth; const fs = rnd(0.22, 0.38) * (w.pellets > 1 ? 1.6 : 1) * (G.ads > 0.5 ? 0.38 : 1); u.flash.scale.set(fs, fs, 1); u.flash.material.rotation = rnd(0, 6.28); G.flashT = 0.045;
  vmFlashLight.position.set(viewmodel.position.x, viewmodel.position.y + 0.03, viewmodel.position.z - w.len - 0.1); vmFlashLight.intensity = w.stealth ? 0 : 2.2;
  if (!w.stealth) flashLight(_muz.x + _fwd.x, _muz.y + _fwd.y, _muz.z + _fwd.z, w.pellets > 1 ? 7 : 4.5, 0.06, 22);
  puff(_muz.x, _muz.y, _muz.z, { color: 0xb8b8b8, size: 0.12, grow: 0.55, life: 0.7, vy: 0.35, vx: _fwd.x * 1.2, vz: _fwd.z * 1.2, op: 0.3, minor: 1 });
  if (w.pellets === 1 || G.shotT === 0) spawnCasing(_org, _right, _fwd, w.pellets > 1);
}

function startReload() {
  const w = WEAPONS[G.cur];
  if (G.reloading || w.ammo >= w.magSize || w.reserve <= 0 || G.swapT > 0) return;
  G.reloadEmpty = w.ammo === 0; G.reloadDur = w.reload * (G.reloadEmpty && gunObjs[G.cur].userData.mag ? 1.3 : 1) * (perk('quick') ? 0.8 : 1) * (typeof zpHas === 'function' && zpHas('quick') ? 0.5 : 1); G.burstLeft = 0; G.reloadT = G.reloadDur; G.rackDone = false; G.inspectT = 0;
  G.reloading = true; sfx.reload();
}
function finishReload() {
  const w = WEAPONS[G.cur], take = Math.min(w.magSize - w.ammo, w.reserve);
  w.ammo += take; w.reserve -= take; G.reloading = false;
}
function switchWeapon(i) {
  if (i === G.cur || i < 0 || i >= WEAPONS.length || G.state !== 'playing') return;
  gunObjs[G.cur].visible = false; gunObjs[G.cur].userData.flash.visible = false;
  G.cur = i; gunObjs[i].visible = true; G.reloading = false; G.swapT = perk('amped') ? 0.23 : 0.35; G.fireT = G.swapT * 0.6; G.burstLeft = 0; G.inspectT = 0; sfx.click();
  rumble(0.05, 0.15, 50);
}
function cycleWeapon(d) { switchWeapon((G.cur + d + WEAPONS.length) % WEAPONS.length); }

/* ------------------------------------------------------------------ grenades, equipment and launcher rounds */
let gGeo = null, gMat = null;
const EQ_MAT = {};
// melee: anyone right in front of you (2.4 m, within about 50 degrees) takes a heavy hit
function melee() {
  if (G.state !== 'playing' || G.meleeT > 0 || G.swapT > 0 || G.throwT > 0) return;
  G.meleeT = 0.55; G.fireT = Math.max(G.fireT, 0.5); G.reloading = false; G.inspectT = 0; G.burstLeft = 0;
  burst(0.12, 1800, 0.25, 'bandpass'); rumble(0.3, 0.5, 90); if (typeof zcEvent === 'function') zcEvent('m', P);
  setTimeout(() => {
    if (G.state !== 'playing') return;
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); let best = null, bd = 2.4;
    for (const e of enemies) {
      if (M && M.def && isFriend(e)) continue;
      const p = e.group.position, dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz);
      if (d > bd || Math.abs(p.y - P.y) > 1.5) continue;
      if ((dx * fx + dz * fz) / (d || 1) < 0.62) continue;
      best = e; bd = d;
    }
    if (best) {
      const dir = new THREE.Vector3(best.group.position.x - P.x, 0, best.group.position.z - P.z).normalize();
      sfx.thud({ vol: 1 }); G.shake = Math.max(G.shake, 0.02);
      damageEnemy(best, 150, false, dir, false, 'player');
    }
  }, 130);
}
function throwGrenade() {
  if (G.grenades <= 0 || G.state !== 'playing' || (M && M.infMe)) return;
  if (!gGeo && hasModel('props', 'grenade')) { const gg = modelGeos('props', 'grenade'); gGeo = mergeGeos(Object.keys(gg).map(k => ({ g: gg[k] }))); gMat = new THREE.MeshStandardMaterial({ color: C(0x3a4630), metalness: 0.5, roughness: 0.5 }); }
  if (!gGeo) { gGeo = mergeGeos([{ g: Sp(0.055, 10, 8), m: mat4(0, 0, 0, 0, 0, 0, 1, 1.25, 1) }, { g: Cy(0.022, 0.022, 0.03, 8), m: mat4(0, 0.075, 0) }, { g: Bx(0.012, 0.012, 0.07), m: mat4(0.03, 0.08, 0) }]); gMat = new THREE.MeshStandardMaterial({ color: C(0x3a4630), metalness: 0.5, roughness: 0.55 }); }
  const eq = EQUIP[G.equip] || EQUIP.frag;
  if (!EQ_MAT[G.equip]) EQ_MAT[G.equip] = G.equip === 'frag' ? gMat : new THREE.MeshStandardMaterial({ color: C(eq.color), metalness: 0.4, roughness: 0.5, emissive: C(eq.glow || 0), emissiveIntensity: eq.glow ? 0.6 : 0 });
  G.grenades--; sfx.pin(); G.throwT = 0.6; G.inspectT = 0; rumble(0.15, 0.3, 80);
  const m = new THREE.Mesh(gGeo, EQ_MAT[G.equip]); m.castShadow = true;
  const L = nadeLaunch(); m.position.copy(L.p); scene.add(m);
  grenadesInFlight.push({ m, grav: 13, vx: L.v.x, vy: L.v.y, vz: L.v.z, fuse: eq.fuse, spin: rnd(6, 12), kind: G.equip, sticky: !!eq.sticky });
}
// where a throw starts and how fast it goes. It starts just in front of you, but never on the far side of a wall you're
// standing against (that is how grenades used to end up through walls and floors inside buildings)
const _nl = new THREE.Raycaster();
function nadeLaunch() {
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion), p = camera.position.clone();
  _nl.set(p, dir); _nl.far = 0.7; const hit = _nl.intersectObjects(wallMeshes, false)[0];
  p.addScaledVector(dir, hit ? Math.max(0, hit.distance - 0.25) : 0.5);
  const v = dir.clone(); v.y += 0.28; v.normalize();
  return { p, v: new THREE.Vector3(v.x * 17 + P.vx * 0.5, v.y * 17 + 1.2, v.z * 17 + P.vz * 0.5) };
}
// one physics step for a thrown grenade (also used to draw the aim arc). Boxes have a bottom now, so raised floors and
// ceilings bounce it instead of teleporting it on top; small sub-steps stop it slipping through thin walls
const NADE_R = 0.08;
function nadeStep(g, pos, dt, sim) {
  const n = Math.max(1, Math.ceil(Math.hypot(g.vx, g.vy, g.vz) * dt / 0.07)), h = dt / n; let hitAny = false;
  for (let k = 0; k < n; k++) {
    g.vy -= (g.grav || 20) * h;
    let nx = pos.x + g.vx * h, ny = pos.y + g.vy * h, nz = pos.z + g.vz * h, hit = false;
    for (const b of boxesNear(nx, nz)) {
      if (!(nx > b.minx - NADE_R && nx < b.maxx + NADE_R && nz > b.minz - NADE_R && nz < b.maxz + NADE_R && ny < b.top && ny > (b.bot || 0) - NADE_R)) continue;
      const wasX = pos.x > b.minx - NADE_R && pos.x < b.maxx + NADE_R, wasZ = pos.z > b.minz - NADE_R && pos.z < b.maxz + NADE_R;
      if (pos.y >= b.top - 0.02) { ny = b.top + 0.09; g.vy = Math.abs(g.vy) * 0.35; g.vx *= 0.7; g.vz *= 0.7; if (Math.abs(g.vy) < 1) g.vy = 0; }
      else if ((b.bot || 0) > 0.05 && pos.y <= (b.bot || 0) - NADE_R + 0.02) { ny = (b.bot || 0) - NADE_R - 0.01; g.vy = -Math.abs(g.vy) * 0.3; }   // a ceiling
      else if (!wasX) { nx = pos.x; g.vx *= -0.45; } else if (!wasZ) { nz = pos.z; g.vz *= -0.45; } else { nx = pos.x; nz = pos.z; g.vx *= -0.3; g.vz *= -0.3; }
      hit = true;
    }
    if (ny < 0.09) { ny = 0.09; g.vy = Math.abs(g.vy) * 0.38; g.vx *= 0.75; g.vz *= 0.75; if (Math.abs(g.vy) < 1) g.vy = 0; hit = hit || !sim; }
    pos.set(nx, ny, nz); if (hit) { hitAny = true; if (g.sticky) { g.vx = g.vy = g.vz = 0; break; } }
  }
  return hitAny;
}
// hold the grenade button to aim: a dotted arc and a ring where it will land; let go to throw (a quick tap still throws)
let nadeLine = null, nadeRing = null;
function nadeHold(on) {
  if (on) { if (G.grenades > 0 && G.state === 'playing' && !(G.holdT > 0) && G.nadeHold == null) G.nadeHold = G.time; return; }
  if (G.nadeHold != null) { G.nadeHold = null; nadeAimShow(false); throwGrenade(); }
}
function nadeAimShow(on) { if (nadeLine) nadeLine.visible = on; if (nadeRing) nadeRing.visible = false; }   // just the dotted path
function nadeAimTick() {
  if (G.nadeHold == null || G.state !== 'playing' || G.grenades <= 0) { if (G.nadeHold != null && G.state !== 'playing') G.nadeHold = null; nadeAimShow(false); return; }
  if (G.time - G.nadeHold < 0.12) return;
  if (!nadeLine) {
    const dc = document.createElement('canvas'); dc.width = dc.height = 32; const dx = dc.getContext('2d'); dx.fillStyle = '#fff'; dx.beginPath(); dx.arc(16, 16, 13, 0, 7); dx.fill();
    nadeLine = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xfff6b0, size: 0.13, map: new THREE.CanvasTexture(dc), alphaTest: 0.4, sizeAttenuation: true, transparent: true, opacity: 1, depthTest: false, toneMapped: false }));
    nadeLine.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 90), 3)); nadeLine.renderOrder = 9; nadeLine.frustumCulled = false; scene.add(nadeLine);
    nadeRing = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 32), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.85, depthTest: false, side: THREE.DoubleSide })); nadeRing.rotation.x = -Math.PI / 2; nadeRing.renderOrder = 9; scene.add(nadeRing);
  }
  camera.updateMatrixWorld();
  const L = nadeLaunch(), eq = EQUIP[G.equip] || EQUIP.frag, g = { vx: L.v.x, vy: L.v.y, vz: L.v.z, grav: 13, sticky: !!eq.sticky }, pos = L.p.clone(), arr = nadeLine.geometry.attributes.position.array;
  let n = 0, t = 0, still = 0;
  while (t < Math.min(eq.fuse || 3, 4) && n < 90) {
    const hit = nadeStep(g, pos, 1 / 30, true); t += 1 / 30;
    if (n < 90 && pos.distanceTo(camera.position) > 1.4) { arr[n * 3] = pos.x; arr[n * 3 + 1] = pos.y; arr[n * 3 + 2] = pos.z; n++; }   // no dots right in your face
    if ((g.sticky && hit) || Math.hypot(g.vx, g.vz) + Math.abs(g.vy) < 0.4 && ++still > 3) break;
  }
  nadeLine.geometry.setDrawRange(0, n); nadeLine.geometry.attributes.position.needsUpdate = true;
  nadeRing.position.set(pos.x, pos.y - 0.07, pos.z); const R = (eq.radius || 6) * 0.15; nadeRing.scale.setScalar(Math.max(1, R));
  nadeAimShow(true);
}
// launcher rounds: a rocket flies flat, a 40 mm shell arcs; both burst on contact
let projGeo = null, projMat = null;
const _pa = new THREE.Vector3(), _pb = new THREE.Vector3(), _pd = new THREE.Vector3();
function launchProjectile(w, u) {
  if (!projGeo) {
    projGeo = { rocket: mergeGeos([{ g: Cy(0.002, 0.04, 0.12, 10), m: mat4(0, 0, -0.1, -HALF) }, { g: Cy(0.04, 0.04, 0.3, 10), m: mat4(0, 0, 0.11, HALF) }]), grenade: mergeGeos([{ g: Cy(0.02, 0.02, 0.07, 10), m: mat4(0, 0, 0, HALF) }]) };
    projMat = new THREE.MeshStandardMaterial({ color: C(0x434a33), metalness: 0.4, roughness: 0.6 });
  }
  camera.updateMatrixWorld();
  const dir = new THREE.Vector3(rnd(-1, 1) * (G.adsOn ? w.adsSpread : w.spread), rnd(-1, 1) * (G.adsOn ? w.adsSpread : w.spread), -1).normalize().applyQuaternion(camera.quaternion);
  const m = new THREE.Mesh(projGeo[w.proj], projMat); m.castShadow = true;
  m.position.copy(camera.position).addScaledVector(dir, 0.9); m.position.y -= 0.08; m.lookAt(_pa.copy(m.position).sub(dir));
  scene.add(m);
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0xffb060, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  fl.scale.set(w.proj === 'rocket' ? 0.6 : 0.01, w.proj === 'rocket' ? 0.6 : 0.01, 1); fl.position.set(0, 0, 0.3); m.add(fl);
  grenadesInFlight.push({ m, proj: w.proj, vx: dir.x * w.speed, vy: dir.y * w.speed + (w.grav ? 1.5 : 0), vz: dir.z * w.speed, grav: w.grav || 0, life: 5, blast: w.blast, dmg: w.dmg, trailT: 0, armed: 0 });
  const kick = w.recoil * (G.adsOn ? 0.7 : 1); P.pitch = clamp(P.pitch + kick, -1.5, 1.5); P.recoilAcc += kick * 0.5; G.kick = 1; G.shake = Math.max(G.shake, 0.012);
  u.flash.visible = true; u.flash.scale.set(0.5, 0.5, 1); G.flashT = 0.06;
  const bx = camera.position.x - dir.x * 1.2, bz = camera.position.z - dir.z * 1.2;   // back-blast
  if (w.proj === 'rocket') for (let k = 0; k < 4; k++) puff(bx, camera.position.y - 0.1, bz, { color: 0xb0aaa0, size: 0.4, grow: 1.4, life: 1.4, vy: 0.4, vx: -dir.x * rnd(1, 3), vz: -dir.z * rnd(1, 3), op: 0.35 });
  flashLight(camera.position.x + dir.x, camera.position.y, camera.position.z + dir.z, 5, 0.08, 20);
}
function stunBlast(p) {
  sfx.stun(at(p.x, p.z, 30)); flashLight(p.x, p.y + 0.5, p.z, 14, 0.15, 30);
  for (const e of enemies) { const d = Math.hypot(e.group.position.x - p.x, e.group.position.z - p.z); if (d < 11 && blastClear(p, e.group.position.x, 1.4, e.group.position.z)) { const ex = p.x - e.group.position.x, ez = p.z - e.group.position.z, f = (Math.sin(e.group.rotation.y) * ex + Math.cos(e.group.rotation.y) * ez) / (Math.hypot(ex, ez) || 1); e.stunT = 4 * (1 - d / 16) * (f > 0.2 ? 1 : 0.35); e.flinch = 1; if (e.net) netStun(e, p); } }
  stunPlayerAt(p);
}
// a stun going off at p: whites out your screen if you were looking at it (Tactical Mask: 65% weaker)
function stunPlayerAt(p) {
  const dp = Math.hypot(P.x - p.x, P.z - p.z);
  if (dp < 12 && blastClear(p, P.x, P.y + P.eye, P.z)) {
    _pd.set(p.x - P.x, p.y + 0.2 - (P.y + P.eye), p.z - P.z).normalize(); _fwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
    const dot = _fwd.dot(_pd), face = clamp((dot - 0.35) / 0.55, 0, 1);   // 0 outside a ~70 degree cone, 1 looking straight at it
    const k = clamp((1 - dp / 12) * face * 1.15, 0, 1) * (perk('mask') ? 0.35 : 1), fl = $('flashW'); if (fl) { fl.style.transition = 'none'; fl.style.opacity = k; setTimeout(() => { fl.style.transition = `opacity ${1 + 2.5 * k}s ease-out`; fl.style.opacity = 0; }, 60); }
    rumble(k, k, 300);
  }
}
function blastClear(p, x, y, z) {
  _v.set(x - p.x, y - p.y, z - p.z); const dist = _v.length(); if (dist < 0.3) return true;
  _v.normalize(); _v2.copy(p); raycaster.set(_v2, _v); raycaster.far = dist - 0.1;
  return raycaster.intersectObjects(wallMeshes, false).length === 0;
}
function explode(p, src = 'grenade', R = 8, dmgK = 1, by = 'player') {
  const dp = Math.hypot(P.x - p.x, P.y + 1 - p.y, P.z - p.z);
  sfx.explode(at(p.x, p.z, 30)); explosionFx(p, 1); if (by === 'player' && typeof zcEvent === 'function') zcEvent('b', p);
  for (const e of enemies.slice()) {
    if (by === 'player' && isFriend(e)) continue;
    if (by && by.group && (e === by ? false : e.team === by.team)) continue;   // a bot's grenade spares its own team
    const d = Math.hypot(e.group.position.x - p.x, 1 - p.y, e.group.position.z - p.z);
    if (d < R && blastClear(p, e.group.position.x, 1, e.group.position.z)) (e.killedBy = src), damageEnemy(e, (170 * (1 - d / R) + 20) * dmgK, false, _v3.set(e.group.position.x - p.x, 0.3, e.group.position.z - p.z).normalize(), true, by === 'player' ? 'player' : by && by.group ? by : src);
  }
  if (dp < R && blastClear(p, P.x, P.y + 1, P.z) && !(by && by.group && M.def && M.def.teams && by.team === M.myTeam)) G.killer = by && by.group ? by : src, hurtPlayer(Math.round((110 * (1 - dp / R) + 5) * Math.min(1, dmgK)), p.x, p.z, true);
  for (const b of barrels) if (b.alive && Math.hypot(b.x - p.x, b.z - p.z) < R * 0.8) damageBarrel(b, 999, true);
  G.shake = Math.max(G.shake, 0.06 * clamp(1 - dp / 30, 0, 1) * (perk('mask') ? 0.3 : 1));
  const rk = clamp(1 - dp / 30, 0, 1); if (rk > 0.05) rumble(rk, rk * 0.8, 120 + 300 * rk);
}
function updateGrenades(dt) {
  try { nadeAimTick(); } catch (e) {}
  try { smkTick(dt); } catch (e) {}
  for (let i = grenadesInFlight.length - 1; i >= 0; i--) {
    const g = grenadesInFlight[i], m = g.m;
    if (g.proj) { if (updateProjectile(g, dt)) { scene.remove(m); grenadesInFlight.splice(i, 1); } continue; }
    if (g.stuck) {
      if (g.on) { if (enemies.includes(g.on) || dying.some(d => d.e === g.on)) m.position.copy(g.on.group.position).add(g.off); }
      g.fuse -= dt; if (g.fuse <= 0) { detonate(g); scene.remove(m); grenadesInFlight.splice(i, 1); }
      continue;
    }
    if (g.sticky) for (const e of enemies) { const ep = e.group.position; if (Math.hypot(ep.x - m.position.x, ep.z - m.position.z) < 0.5 && m.position.y < 1.9) { g.stuck = true; g.on = e; g.off = new THREE.Vector3(m.position.x - ep.x, clamp(m.position.y, 0.9, 1.5), m.position.z - ep.z); sfx.thud(at(ep.x, ep.z, 10)); break; } }
    if (g.stuck) continue;
    const sp0 = Math.abs(g.vx) + Math.abs(g.vy) + Math.abs(g.vz);
    if (nadeStep(g, m.position, dt, false)) { if (sp0 > 1.5) sfx.thud(at(m.position.x, m.position.z, 10)); if (g.sticky) { g.stuck = true; g.vx = g.vy = g.vz = 0; } } m.rotation.x += g.spin * dt; m.rotation.z += g.spin * 0.6 * dt;
    g.fuse -= dt;
    if (g.fuse <= 0) { detonate(g); scene.remove(m); grenadesInFlight.splice(i, 1); }
  }
}

function detonate(g) { if (g.kind === 'hotbox' || g.kind === 'skunk') { smkDetonate(g); return; } if (g.kind === 'stun') stunBlast(g.m.position.clone()); else explode(g.m.position.clone(), 'grenade', g.kind === 'semtex' ? 6.5 : 8, g.kind === 'semtex' ? 0.9 : 1, g.by || 'player'); }
const _pr = new THREE.Raycaster();
function updateProjectile(g, dt) {
  const m = g.m; g.life -= dt; g.armed += dt;
  g.vy -= g.grav * dt;
  _pa.copy(m.position); _pb.set(m.position.x + g.vx * dt, m.position.y + g.vy * dt, m.position.z + g.vz * dt);
  _pd.subVectors(_pb, _pa); const step = _pd.length(); _pd.normalize();
  _pr.set(_pa, _pd); _pr.far = step + 0.05;
  const targets = wallMeshes.slice(); for (const e of enemies) for (const h of e.rig.hits) targets.push(h);
  const hit = _pr.intersectObjects(targets, false)[0];
  let boom = null;
  if (hit) boom = hit.point.clone().addScaledVector(_pd, -0.1);
  else if (_pb.y <= groundAt(_pb.x, _pb.z, _pb.y) + 0.03) boom = _pb.clone().setY(groundAt(_pb.x, _pb.z, _pb.y) + 0.1);
  else if (g.life <= 0 || Math.abs(_pb.x) > ARENA + 30 || Math.abs(_pb.z) > ARENA + 30) return true;
  if (boom) { if (hit && hit.object.userData.enemy) damageEnemy(hit.object.userData.enemy, g.dmg * 0.35, false, _pd); explode(boom, 'grenade', g.blast, g.dmg / 150); return true; }
  m.position.copy(_pb); m.lookAt(_pa.copy(_pb).sub(_pd));
  if (g.proj === 'rocket' && (g.trailT -= dt) <= 0) { g.trailT = 0.025; puff(_pb.x, _pb.y, _pb.z, { color: 0xaaa69e, size: 0.2, grow: 0.9, life: 1.3, vy: 0.2, op: 0.3, minor: 1 }); }
  return false;
}
