/* ================================================================== the newer scorestreaks
   DEALER DRONE (a kamikaze drone with a package), SMOKE OUT (counter-UAV: jams the enemy radar and UAVs),
   TRAP HOUSE TURRET (a sentry gun) and HIGH FLYER (a gunship circling over the map). All their hits count as yours,
   so online they hurt real players the same way your bullets do. */
var STK2 = {}, S2 = { drones: [], turrets: [], ship: null, jamPuffs: [], jamCheck: 0 };
const stkHostiles = () => enemies.filter(e => !isFriend(e) && (!e.entry || e.entry.alive !== false) && !e.dead);
const _s2a = new THREE.Vector3(), _s2b = new THREE.Vector3(), _s2r = new THREE.Raycaster();
function stkLos(a, b) { _s2b.subVectors(b, a); const d = _s2b.length(); if (d < 0.01) return true; _s2r.set(a, _s2b.divideScalar(d)); _s2r.far = d - 0.25; return _s2r.intersectObjects(wallMeshes, false).length === 0; }
const stkChest = (e, out) => out.set(e.group.position.x, e.group.position.y + 1.25 * (e.group.userData.scale || 1), e.group.position.z);
function stkMat(c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(c), roughness: 0.6, metalness: 0.3 }, o || {})); }
// a weed leaf decal (the turret, the drone's package, the gunship's tail)
function stkLeafTex() {
  if (stkLeafTex.t) return stkLeafTex.t;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.translate(64, 76); g.fillStyle = '#5fd33a'; g.strokeStyle = '#123'; g.lineWidth = 3;
  for (let i = -3; i <= 3; i++) { g.save(); g.rotate(i * 0.42); g.beginPath(); g.ellipse(0, -24, 6, 24 * (1 - Math.abs(i) * 0.12), 0, 0, TAU); g.fill(); g.stroke(); g.restore(); }
  g.fillRect(-2, 0, 4, 22);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return (stkLeafTex.t = t);
}
const stkDecal = (s) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: stkLeafTex(), transparent: true, depthWrite: false })); return m; };
function stkSpot() { const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); let x = P.x + fx * 1.8, z = P.z + fz * 1.8; _s2a.set(P.x, (P.y || 0) + 0.6, P.z); _s2b.set(x, (P.y || 0) + 0.6, z); if (!stkLos(_s2a, _s2b)) { x = P.x + fx * 0.6; z = P.z + fz * 0.6; } return { x, z, y: groundAt(x, z, (P.y || 0) + 0.4) }; }

/* ---------- TRAP HOUSE TURRET */
STK2.sentry = () => {
  const p = stkSpot(), g = new THREE.Group(); g.position.set(p.x, p.y, p.z);
  const dark = stkMat(0x22261e), green = stkMat(0x2f5a24, { roughness: 0.5 });
  for (let i = 0; i < 3; i++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.9, 6), dark); const a = i * TAU / 3; leg.position.set(Math.cos(a) * 0.22, 0.4, Math.sin(a) * 0.22); leg.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45); g.add(leg); }
  const head = new THREE.Group(); head.position.y = 0.88; g.add(head);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.55), green); head.add(body);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.25), dark); box.position.set(0.3, -0.02, 0.05); head.add(box);   // the ammo can
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.7, 8), dark); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.03, -0.6); head.add(barrel);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x66ff44 })); eye.position.set(0, 0.07, -0.28); head.add(eye);
  for (const s of [-1, 1]) { const d = stkDecal(0.22); d.position.set(s * 0.212, 0.01, 0); d.rotation.y = s * Math.PI / 2; head.add(d); }
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffd27a })); flash.position.set(0, 0.03, -0.98); flash.visible = false; head.add(flash);
  scene.add(g);
  S2.turrets.push({ g, head, eye, flash, t: 30, fireT: 0.6, scanT: 0, tgt: null, x: p.x, z: p.z, y: p.y });
  showBanner('TRAP HOUSE TURRET', 'guarding this spot for 30 seconds'); try { sfx.pickup(); tone(520, 0.1, 0.08, 'square'); tone(780, 0.12, 0.08, 'square', undefined, { delay: 0.12 }); } catch (e) {}
};
function turretTick(T, dt) {
  T.t -= dt; T.eye.material.color.setHex(T.t < 4 && Math.sin(NOW * 20) > 0 ? 0x220000 : T.tgt ? 0xff4422 : 0x66ff44);
  const muzzle = _s2a.set(T.x, T.y + 0.95, T.z);
  if ((T.scanT -= dt) <= 0) {
    T.scanT = 0.25; T.tgt = null; let bd = 40;
    for (const e of stkHostiles()) { const d = Math.hypot(e.group.position.x - T.x, e.group.position.z - T.z); if (d < bd && stkLos(muzzle, stkChest(e, new THREE.Vector3()))) { bd = d; T.tgt = e; } }
  }
  const e = T.tgt && enemies.includes(T.tgt) ? T.tgt : null;
  if (!e) { T.head.rotation.y += dt * 0.8; T.flash.visible = false; return; }
  const want = Math.atan2(-(e.group.position.x - T.x), -(e.group.position.z - T.z)); let d = want - T.head.rotation.y; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
  T.head.rotation.y += d * Math.min(1, dt * 10); T.flash.visible = T.flash.visible && (T.fireT > 0.12);
  if (Math.abs(d) > 0.25 || (T.fireT -= dt) > 0) return;
  T.fireT = 0.18; T.flash.visible = true; T.flash.rotation.z = Math.random() * 6;
  const to = stkChest(e, new THREE.Vector3()), dist = Math.hypot(to.x - T.x, to.z - T.z), hit = Math.random() < 0.62 - dist * 0.006;
  if (!hit) to.add(new THREE.Vector3(rnd(-1, 1), rnd(-0.5, 0.8), rnd(-1, 1)));
  addTracer(muzzle.clone(), to, 0.05, 0.02); try { sfx.enemy(at(T.x, T.z, 22)); } catch (err) {}
  if (hit) damageEnemy(e, 15, Math.random() < 0.08, new THREE.Vector3(to.x - T.x, 0, to.z - T.z).normalize(), false, 'player');
}

/* ---------- DEALER DRONE */
STK2.drone = () => {
  const g = new THREE.Group(), dark = stkMat(0x1e1e22), arms = stkMat(0x444448);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.34), dark));
  const rotors = [];
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.42), arms); arm.position.set(sx * 0.15, 0.02, sz * 0.15); arm.rotation.y = Math.atan2(sx, sz); g.add(arm);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 14), new THREE.MeshBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.35 })); r.position.set(sx * 0.3, 0.07, sz * 0.3); g.add(r); rotors.push(r);
  }
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0x55ff33 })); led.position.set(0, 0.02, -0.18); g.add(led);
  const pkg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.2), stkMat(0x9a7a4a, { metalness: 0 })); pkg.position.y = -0.2; g.add(pkg);   // the package: a taped-up brick with a leaf on it
  const d1 = stkDecal(0.16); d1.position.set(0, -0.2, 0.101); g.add(d1);
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
  g.position.set(P.x + fx * 0.8, (P.y || 0) + P.eye + 0.3, P.z + fz * 0.8); scene.add(g);
  S2.drones.push({ g, rotors, led, t: 16, tgt: null, phase: 'up', buzz: 0 });
  showBanner('DEALER DRONE', 'package on its way'); stkRadio();
};
function droneTick(D, dt) {
  D.t -= dt; const p = D.g.position;
  for (const r of D.rotors) r.rotation.y += dt * 60;
  if ((D.buzz -= dt) <= 0) { D.buzz = 0.22; try { tone(210 + Math.random() * 30, 0.2, 0.025, 'sawtooth', undefined, at(p.x, p.z, 12, p.y)); } catch (e) {} }
  if (!D.tgt || !enemies.includes(D.tgt) || (D.tgt.entry && D.tgt.entry.alive === false)) { let bd = 1e9; D.tgt = null; for (const e of stkHostiles()) { const d = Math.hypot(e.group.position.x - p.x, e.group.position.z - p.z); if (d < bd) { bd = d; D.tgt = e; } } }
  const e = D.tgt;
  if (!e) { p.y += dt * 2; if (D.t <= 0) droneBoom(D); return; }
  const tp = stkChest(e, _s2b), dx = tp.x - p.x, dz = tp.z - p.z, hd = Math.hypot(dx, dz), cruise = Math.max((P.y || 0), e.group.position.y) + 6.5;
  let vx = 0, vy = 0, vz = 0;
  if (D.phase === 'up') { vy = 7; if (p.y >= cruise - 0.3) D.phase = 'fly'; }
  else if (D.phase === 'fly') { const s = 12 / (hd || 1); vx = dx * s; vz = dz * s; vy = (cruise - p.y) * 2; if (hd < 4) D.phase = 'dive'; }
  else { const dy = tp.y - p.y, l = Math.hypot(dx, dy, dz) || 1, s = 15 / l; vx = dx * s; vy = dy * s; vz = dz * s; D.led.material.color.setHex(Math.sin(NOW * 40) > 0 ? 0xff2222 : 0x220000); }
  const step = new THREE.Vector3(vx * dt, vy * dt, vz * dt), len = step.length();
  if (len > 0.001) { _s2r.set(p, step.clone().divideScalar(len)); _s2r.far = len + 0.25; const hit = _s2r.intersectObjects(wallMeshes, false)[0]; if (hit && D.phase !== 'up') { p.copy(hit.point); return droneBoom(D); } if (hit && D.phase === 'up') { D.phase = 'fly'; } else p.add(step); }
  D.g.rotation.y = Math.atan2(-vx, -vz) || D.g.rotation.y; D.g.rotation.x = D.phase === 'dive' ? -0.5 : -0.15;
  if (Math.hypot(tp.x - p.x, tp.y - p.y, tp.z - p.z) < 1.2 || D.t <= 0 || p.y < groundAt(p.x, p.z, p.y + 0.5) + 0.15) droneBoom(D);
}
function droneBoom(D) {
  const i = S2.drones.indexOf(D); if (i < 0) return; S2.drones.splice(i, 1); scene.remove(D.g);
  const p = D.g.position; explode({ x: p.x, y: p.y, z: p.z }, 'strike', 4.5, 1.3, 'player');
}

/* ---------- SMOKE OUT (counter-UAV) */
function stkPuffTex() {
  if (stkPuffTex.t) return stkPuffTex.t;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  for (let i = 0; i < 9; i++) { const x = 64 + rnd(-24, 24), y = 64 + rnd(-18, 18), r = rnd(26, 44), gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, 'rgba(200,205,195,.55)'); gr.addColorStop(1, 'rgba(200,205,195,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  return (stkPuffTex.t = new THREE.CanvasTexture(c));
}
STK2.cuav = () => {
  STK.jamT = 30; showBanner('SMOKE OUT', 'enemy radar and UAVs jammed for 30 seconds'); stkRadio();
  // a big haze over where the enemy is
  const list = stkHostiles(), cx = list.length ? list.reduce((s, e) => s + e.group.position.x, 0) / list.length : P.x, cz = list.length ? list.reduce((s, e) => s + e.group.position.z, 0) / list.length : P.z;
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: stkPuffTex(), transparent: true, depthWrite: false, opacity: 0, color: new THREE.Color(i % 3 ? 0x6c6c72 : 0x5c6e4c) }));
    const sc = rnd(14, 26); s.scale.set(sc, sc * 0.6, 1); s.position.set(cx + rnd(-30, 30), rnd(14, 24), cz + rnd(-30, 30)); scene.add(s);
    S2.jamPuffs.push({ s, vx: rnd(-0.6, 0.6), vz: rnd(-0.6, 0.6), born: NOW });
  }
  try { burst(2.2, 500, 0.35, 'lowpass'); } catch (e) {}
};
function stkJammed() {
  if (!inMatch() || !M.online || typeof NET === 'undefined') return false;
  for (const R of NET.rem.values()) if (R.cj && (!M.def.teams || R.entry.team !== M.myTeam)) return true;
  return false;
}
// offline (and the online host's bots): the enemy's aim gets hazy and they stop calling out where you are
function jamBots(on) {
  for (const e of enemies) {
    if (!e.entry || e.net) continue;
    if (on && !isFriend(e) && e.jamAcc === undefined) { e.jamAcc = e.acc; e.acc *= 0.72; e.lkp = null; }
    if (!on && e.jamAcc !== undefined) { e.acc = e.jamAcc; delete e.jamAcc; }
  }
}

/* ---------- HIGH FLYER (gunship) */
STK2.gunship = () => {
  const g = new THREE.Group(), body = stkMat(0x3b3f44, { metalness: 0.5 }), dark = stkMat(0x22252a);
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.7, 11, 12), body); fus.rotation.x = Math.PI / 2; g.add(fus);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), body); nose.scale.z = 1.6; nose.position.z = -5.5; g.add(nose);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(16, 0.18, 2.2), body); wing.position.set(0, 0.4, -0.8); g.add(wing);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.14, 1.4), body); tail.position.set(0, 0.3, 5); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.4, 1.8), body); fin.position.set(0, 1.4, 5); g.add(fin);
  for (const s of [-1, 1]) for (const k of [3, 6]) { const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.6, 10), dark); eng.rotation.x = Math.PI / 2; eng.position.set(s * k, 0.1, -1.2); g.add(eng); }
  for (const s of [-1, 1]) { const d = stkDecal(1.6); d.position.set(s * 0.08, 1.5, 5); d.rotation.y = s * Math.PI / 2; g.add(d); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3020 })); lamp.position.set(0, 2.6, 5.4); g.add(lamp);
  scene.add(g);
  // circle over the middle of where the enemy is (the map's centre if there is nobody)
  const list = stkHostiles(), cx = list.length ? list.reduce((s, e) => s + e.group.position.x, 0) / list.length * 0.6 : 0, cz = list.length ? list.reduce((s, e) => s + e.group.position.z, 0) / list.length * 0.6 : 0;
  S2.ship = { g, lamp, t: 22, a: Math.random() * TAU, cx, cz, R: 34, h: 42, fireT: 2.2, hum: 0, shells: [] };
  showBanner('HIGH FLYER', 'gunship overhead for 22 seconds'); stkRadio();
};
function shipTick(S, dt) {
  S.t -= dt; S.a += dt * 0.32;
  const x = S.cx + Math.cos(S.a) * S.R, z = S.cz + Math.sin(S.a) * S.R;
  S.g.position.set(x, S.h, z); S.g.rotation.set(0, -S.a, 0); S.g.rotateZ(0.35);   // banked into the turn, nose along the circle
  S.lamp.visible = Math.sin(NOW * 6) > 0;
  if ((S.hum -= dt) <= 0) { S.hum = 1.1; try { tone(70, 1.2, 0.07, 'sawtooth', 65, at(x, z, 60, S.h)); } catch (e) {} }
  for (let i = S.shells.length - 1; i >= 0; i--) { const sh = S.shells[i]; if ((sh.t -= dt) <= 0) { S.shells.splice(i, 1); explode({ x: sh.x, y: sh.y + 0.3, z: sh.z }, 'strike', 4.5, 1.15, 'player'); } }
  if (S.t <= 0 || (S.fireT -= dt) > 0) return;
  S.fireT = 1.15;
  const from = new THREE.Vector3(x, S.h - 1, z), seen = stkHostiles().filter(e => stkLos(from, stkChest(e, new THREE.Vector3())));
  if (!seen.length) return;
  const e = seen[(Math.random() * seen.length) | 0], tx = e.group.position.x + rnd(-1.2, 1.2), tz = e.group.position.z + rnd(-1.2, 1.2), ty = groundAt(tx, tz, e.group.position.y + 0.5);
  if (Math.hypot(tx - P.x, tz - P.z) < 5) return;   // never on top of you
  addTracer(from, new THREE.Vector3(tx, ty, tz), 0.12, 0.08); S.shells.push({ t: 0.35, x: tx, y: ty, z: tz });
  try { tone(140, 0.25, 0.12, 'square', 60, at(x, z, 60, S.h)); } catch (err) {}
}

/* ---------- per frame, HUD, clean-up */
function stk2Update(dt) {
  if (!S2) return;
  for (const T of S2.turrets.slice()) { turretTick(T, dt); if (T.t <= 0) { scene.remove(T.g); S2.turrets.splice(S2.turrets.indexOf(T), 1); } }
  for (const D of S2.drones.slice()) droneTick(D, dt);
  if (S2.ship) { shipTick(S2.ship, dt); const S = S2.ship; if (S.t <= 0) { S.h += dt * 6; S.R += dt * 12; if (S.t < -6 && !S.shells.length) { scene.remove(S.g); S2.ship = null; } } }
  if (STK.jamT > 0) { STK.jamT -= dt; if ((S2.jamCheck -= dt) <= 0) { S2.jamCheck = 0.5; jamBots(true); } if (STK.jamT <= 0) { STK.jamT = 0; jamBots(false); } }
  for (let i = S2.jamPuffs.length - 1; i >= 0; i--) {
    const q = S2.jamPuffs[i], age = NOW - q.born; q.s.position.x += q.vx * dt; q.s.position.z += q.vz * dt;
    q.s.material.opacity = Math.min(0.9, age * 0.6) * (age > 27 ? Math.max(0, (30 - age) / 3) : 1);
    if (age > 30) { scene.remove(q.s); S2.jamPuffs.splice(i, 1); }
  }
}
function stk2Hud() {
  if (!S2) return '';
  const bits = [];
  if (S2.turrets.length) bits.push(`TURRET ${Math.ceil(Math.max(...S2.turrets.map(t => t.t)))}`);
  if (S2.ship && S2.ship.t > 0) bits.push(`HIGH FLYER ${Math.ceil(S2.ship.t)}`);
  if (STK.jamT > 0) bits.push(`SMOKE OUT ${Math.ceil(STK.jamT)}`);
  if (stkJammed()) bits.push('YOUR RADAR IS JAMMED');
  return bits.map(b => `<div class="stk-uav">${b}</div>`).join('');
}
function stk2Clear() {
  if (!S2) return;
  for (const T of S2.turrets) scene.remove(T.g); S2.turrets.length = 0;
  for (const D of S2.drones) scene.remove(D.g); S2.drones.length = 0;
  if (S2.ship) scene.remove(S2.ship.g); S2.ship = null;
  for (const q of S2.jamPuffs) scene.remove(q.s); S2.jamPuffs.length = 0;
  if (STK.jamT) jamBots(false); STK.jamT = 0;
}
// the jammed radar: static
function stkRadarJam(c, W) {
  c.clearRect(0, 0, W, W); c.save(); c.beginPath(); c.arc(W / 2, W / 2, W / 2 - 4, 0, TAU); c.clip();
  for (let i = 0; i < 260; i++) { const v = (Math.random() * 200) | 0; c.fillStyle = `rgba(${v},${v},${v},.55)`; c.fillRect(Math.random() * W, Math.random() * W, 3, 2); }
  c.restore(); c.fillStyle = '#ff6a5a'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText('JAMMED', W / 2, W / 2 + 4); c.textAlign = 'start';
}
