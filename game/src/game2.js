/* ================================================================== gameplay: enemies, waves, pickups, HUD, flow */
const TYPES = {
  rifleman: { hp: 90, speed: 2.8, dmg: 6, hold: [12, 24], acc: 0.42 },
  scout: { hp: 60, speed: 4.1, dmg: 4.5, hold: [7, 14], acc: 0.38 },
  heavy: { hp: 230, speed: 2.0, dmg: 9, hold: [14, 26], acc: 0.46 },
};
function pickType() {
  const w = G.wave, r = Math.random();
  if (w >= 5) return r < 0.2 ? 'heavy' : r < 0.45 ? 'scout' : 'rifleman';
  if (w >= 3 && r < 0.28) return 'scout';
  return 'rifleman';
}
function makeEnemy(type, x, z) {
  const T = TYPES[type], d = diff(), w = G.wave, rig = cloneSoldier(type), root = rig.root;
  root.rotation.order = 'YXZ'; root.position.set(x, 0, z); scene.add(root);
  const e = {
    rig, group: root, type, hp: (T.hp + Math.min(w * 9, 110)) * d.hp, speed: T.speed + Math.min(w * 0.18, 1.6) + rnd(-0.3, 0.5),
    hold: rnd(T.hold[0], T.hold[1]), strafe: Math.random() < 0.5 ? 1 : -1, strafeT: rnd(1, 3), cd: rnd(1.2, 2.5), shots: 3,
    los: false, losT: 0, phase: Math.random() * 6, chk: 0.6, lastX: x, lastZ: z, avoidT: 0, avoidDir: 1, noLosT: 0,
    magSize: { rifleman: 24, scout: 18, heavy: 40 }[type] || 24, mag: 0, reloadT: 0, reloadDur: 1, crouchy: Math.random() < 0.5, crouchK: 0, holding: false,
    dmg: Math.min(T.dmg + w * 0.5, T.dmg * 2) * d.dmg, acc: Math.min(T.acc + w * 0.02, 0.62) * d.acc, aim: 0, flinch: 0, flashT: 0, phase0: Math.random() * 6,
  };
  e.mag = e.magSize; rig.hits.forEach(m => { m.userData.enemy = e; });
  return e;
}
// a spawn spot (any floor) far from the player that can reach the player
function pickSpawn() {
  updateNav(P.x, P.z, P.y);
  const pts = buildSpawns();
  for (let tries = 0; tries < 60; tries++) {
    const p = pts[(Math.random() * pts.length) | 0];
    if (Math.hypot(p.x - P.x, p.z - P.z) < 24) continue;
    const n = nodeOf(p.x, p.z, p.y); if (n < 0 || !navField || navField[n] < 0) continue;
    return p;
  }
  return randomOpenSpot(20, 30);
}
function spawnEnemy() { const sp = pickSpawn(), e = makeEnemy(pickType(), sp.x, sp.z); e.group.position.y = sp.y || 0; enemies.push(e); }
function relocateEnemy(e) { const sp = pickSpawn(); e.group.position.set(sp.x, sp.y || 0, sp.z); e.noLosT = 0; e.avoidT = 0; e.lastX = sp.x; e.lastZ = sp.z; }

function hasLOS(e, dist) {
  _v.set(e.group.position.x, e.group.position.y + 1.5 - 0.4 * (e.crouchK || 0), e.group.position.z);
  _v2.set(P.x, P.y + P.eye * 0.85, P.z).sub(_v).normalize();
  raycaster.set(_v, _v2); raycaster.far = dist;
  return raycaster.intersectObjects(wallMeshes, false).length === 0;
}
function enemyMuzzle(e, out) {
  const g = e.group, s = g.userData.scale || 1, ry = g.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry);
  return out.set(g.position.x + (fx * 0.95 + fz * 0.1) * s, g.position.y + (1.38 - 0.4 * (e.crouchK || 0)) * s, g.position.z + (fz * 0.95 - fx * 0.1) * s);
}
function enemyShoot(e, dist) {
  const from = enemyMuzzle(e, new THREE.Vector3());
  const iq = e.iq || 0.5, track = Math.hypot(P.vx || 0, P.vz || 0) > 4 ? 0.85 + (e.hum || 0.4) * 0.12 : 1;   // a fast-moving player is harder to track
  const chance = clamp((e.acc - dist * 0.009 * (e.rangeK || 1) * (1 - iq * 0.35) - (G.adsOn ? 0.05 : 0) - (P.eye < 1.4 ? 0.08 * (1 - iq * 0.5) : 0)) * (typeof botSettle === 'function' && inMatch() ? botSettle(e) : 1) * track, 0.06, 0.78);
  const hit = Math.random() < chance;
  const to = new THREE.Vector3(P.x, P.y + P.eye * 0.8, P.z);
  if (!hit) to.add(new THREE.Vector3(rnd(-1.6, 1.6), rnd(-0.8, 1.0), rnd(-1.6, 1.6)));
  if (!e.stealth) addTracer(from, to, 0.05, 0.022);
  e.rig.flash.visible = !e.stealth; e.flashT = 0.06; e.rig.flash.material.rotation = rnd(0, 6.28);
  enemyFlashLight.position.copy(from); enemyFlashLight.intensity = e.stealth ? 0 : 3.2; enemyFlashLight.userData.t = 0.05;
  const o = at(e.group.position.x, e.group.position.z, 20); sfx.enemy(o);
  if (hit) { G.killer = e; hurtPlayer(e.dmg * (inMatch() && Math.random() < (e.hs || 0) ? 1.7 : 1) * (typeof botFall === 'function' ? botFall(e, dist) : 1), e.group.position.x, e.group.position.z); }
  else if (dist > 4) { const f = at(to.x, to.z, 8); f.vol *= 0.8; sfx.flyby(f); }
}

// put the rifle in the soldier's hands: grip in the right hand, pointing ahead of the body
const _hR = new THREE.Vector3(), _hL = new THREE.Vector3(), _gf = new THREE.Vector3(), _gu = new THREE.Vector3(), _gs = new THREE.Vector3(), _gm = new THREE.Matrix4(), _gq = new THREE.Quaternion();
function seatGun(e) {
  const r = e.rig; if (!r.gun || !r.elR || !r.elL) return;
  r.torso.updateWorldMatrix(true, true);
  r.elR.localToWorld(_hR.set(0, -0.29, 0.02)); r.torso.worldToLocal(_hR);
  const f = _gf.set(-0.1, lerp(-0.32, -0.03, e.aim || 0), 1).normalize();   // pointing ahead: lowered when relaxed, level when aiming
  _gu.set(0, 1, 0); _gs.crossVectors(_gu, f).normalize(); _gu.crossVectors(f, _gs);
  _gm.makeBasis(_gs, _gu, f); _gq.setFromRotationMatrix(_gm);
  r.gun.quaternion.copy(_gq); if (e.gunCant) r.gun.rotateZ(e.gunCant);
  r.gun.position.copy(_hR).addScaledVector(f, -0.06).addScaledVector(_gu, 0.03);   // grip sits in the palm, the receiver just above it
}
function animEnemy(e, dt, sp) {
  const r = e.rig, amp = clamp(sp / 2.8, 0, 1.3), a = e.aim;
  e.phase += dt * sp * 2.4;
  const s = Math.sin(e.phase), c = Math.cos(e.phase), br = Math.sin(NOW * 1.7 + e.phase0) * 0.012;
  r.legL.rotation.x = -s * 0.65 * amp; r.legR.rotation.x = s * 0.65 * amp;
  r.knL.rotation.x = clamp(0.2 + Math.max(0, Math.sin(e.phase + 1.9)) * 0.9 * amp, 0, 1.4);
  r.knR.rotation.x = clamp(0.2 + Math.max(0, Math.sin(e.phase + 1.9 + Math.PI)) * 0.9 * amp, 0, 1.4);
  r.hips.position.y = 0.98 + Math.abs(c) * 0.035 * amp;
  r.torso.rotation.x = 0.08 + e.flinch * 0.35 + br - a * 0.04; r.torso.rotation.y = s * 0.07 * amp + 0.18 * a;
  r.head.rotation.x = -0.05 - e.flinch * 0.3; r.head.rotation.y = -0.18 * a;
  r.armR.rotation.set(lerp(-0.95, -1.4, a) + br, lerp(-0.2, -0.12, a), 0); r.elR.rotation.set(lerp(-0.95, -0.75, a), 0, 0);
  r.armL.rotation.set(lerp(-1.2, -1.45, a) + br, lerp(0.55, 0.42, a), 0); r.elL.rotation.set(lerp(-0.35, -0.2, a), 0, 0);
  // crouch while holding a firing position (about half the squad does)
  const ck = e.crouchK = lerp(e.crouchK || 0, e.holding && e.crouchy && e.los ? 1 : 0, Math.min(1, dt * 5));
  if (ck > 0.01) {
    r.hips.position.y = lerp(r.hips.position.y, 0.6, ck);
    r.legL.rotation.x = lerp(r.legL.rotation.x, -1.25, ck); r.legR.rotation.x = lerp(r.legR.rotation.x, -0.3, ck);
    r.knL.rotation.x = lerp(r.knL.rotation.x, 1.7, ck); r.knR.rotation.x = lerp(r.knR.rotation.x, 1.85, ck);
    r.torso.rotation.x += 0.12 * ck;
  }
  // magazine change: support hand drops to the mag well, rifle cants over
  if (e.reloadT > 0) {
    e.reloadT -= dt; const p = clamp(1 - e.reloadT / e.reloadDur, 0, 1), k = Math.sin(p * Math.PI);
    r.armL.rotation.x = lerp(r.armL.rotation.x, -0.55, k); r.armL.rotation.y = lerp(r.armL.rotation.y, 0.25, k); r.elL.rotation.x = lerp(r.elL.rotation.x, -1.35, k);
    e.gunCant = 0.55 * k; r.head.rotation.x += 0.25 * k;
    if (!e.reloadSnd && p > 0.55) { e.reloadSnd = true; const o = at(e.group.position.x, e.group.position.z, 10); sfx.ereload(o); }
  } else e.gunCant = 0;
  seatGun(e);
  e.flinch = Math.max(0, e.flinch - dt * 4);
  if (e.flashT > 0) { e.flashT -= dt; if (e.flashT <= 0) r.flash.visible = false; }
}

function updateEnemies(dt) {
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i], g = e.group;
    const dx = P.x - g.position.x, dz = P.z - g.position.z, dist = Math.max(Math.hypot(dx, dz), 0.001), nx = dx / dist, nz = dz / dist;
    const want = Math.atan2(dx, dz); let dy = want - g.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU;
    g.rotation.y += dy * Math.min(1, dt * 9);
    e.losT -= dt; if (e.losT <= 0) { e.losT = 0.2 + Math.random() * 0.1; e.los = hasLOS(e, dist); }
    e.strafeT -= dt; if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = rnd(1, 3.2); }
    e.noLosT = e.los ? 0 : e.noLosT + dt;
    if (e.noLosT > 40) relocateEnemy(e);
    let mx, mz; const holding = e.los && dist <= e.hold;
    if (e.avoidT > 0) { e.avoidT -= dt; mx = -nz * e.avoidDir; mz = nx * e.avoidDir; }
    else if (!holding) {
      if (gridClear(g.position.x, g.position.z, P.x, P.z, g.position.y, P.y)) { mx = nx - nz * e.strafe * 0.25; mz = nz + nx * e.strafe * 0.25; }
      else { const nd = navDir(g.position.x, g.position.z, g.position.y); if (nd) { mx = nd[0]; mz = nd[1]; } else { mx = nx; mz = nz; } }
    } else { mx = -nz * e.strafe + (dist < e.hold * 0.55 ? -nx : 0); mz = nx * e.strafe + (dist < e.hold * 0.55 ? -nz : 0); }
    const ml = Math.hypot(mx, mz) || 1, sp = e.speed * (holding ? 0.55 : 1) * ((e.slowT = Math.max(0, (e.slowT || 0) - 1 / 60)) > 0 ? 0.35 : 1);
    g.position.x += mx / ml * sp * dt; g.position.z += mz / ml * sp * dt;
    resolve(g.position, 0.45, g.position.y); botGround(g, dt);
    for (let j = 0; j < enemies.length; j++) {
      if (j === i) continue;
      const o = enemies[j].group.position, sx = g.position.x - o.x, sz = g.position.z - o.z, sd = Math.hypot(sx, sz);
      if (sd < 0.9 && sd > 0.001) { const push = (0.9 - sd) * 0.5; g.position.x += sx / sd * push; g.position.z += sz / sd * push; }
    }
    if (dist < 1.1) { g.position.x -= nx * (1.1 - dist); g.position.z -= nz * (1.1 - dist); }
    g.position.x = clamp(g.position.x, -ARENA + 0.6, ARENA - 0.6); g.position.z = clamp(g.position.z, -ARENA + 0.6, ARENA - 0.6);
    e.chk -= dt;
    if (e.chk <= 0) { e.chk = 0.7; if (Math.hypot(g.position.x - e.lastX, g.position.z - e.lastZ) < 0.6 && !holding) { e.avoidT = 1.2; e.avoidDir = Math.random() < 0.5 ? 1 : -1; } e.lastX = g.position.x; e.lastZ = g.position.z; }
    e.aim += ((e.los && dist < 55 ? 1 : 0) - e.aim) * Math.min(1, dt * 6 * (WEAPONS[G.cur].spot || 1));
    if (e.stunT > 0) { e.stunT -= dt; e.aim = 0; e.flinch = Math.max(e.flinch, 0.25); g.position.x -= mx / ml * sp * dt * 0.75; g.position.z -= mz / ml * sp * dt * 0.75; }   // suppressors slow this, lasers/brakes speed it up
    e.holding = holding;
    animEnemy(e, dt, sp);
    if (e.los && dist < 55 && e.aim > 0.6 && !(e.reloadT > 0)) {
      e.cd -= dt;
      if (e.cd <= 0) { enemyShoot(e, dist); if (--e.mag <= 0) { e.mag = e.magSize; e.reloadDur = e.reloadT = rnd(1.9, 2.6); e.reloadSnd = false; } e.shots--; if (e.shots <= 0) { e.shots = Math.floor(rnd(3, 6)); e.cd = rnd(0.9, 1.8); } else e.cd = 0.13; }
    }
  }
}

function damageEnemy(e, dmg, head, dir, boom, by = 'player') {
  if (!enemies.includes(e)) return false;
  if (e.zombie && by === 'player' && typeof zombGunMul === 'function') dmg *= zombGunMul(boom);
  if (e.proxy) { if (by === 'player') zcProxyHit(e, dmg, head, boom); return false; }
  if (e.entry) { e.entry.lastBy = by; e.entry.lastHead = head ? 1 : 0; }
  if (e.net) { netHit(e, dmg, head, by, boom); return false; }
  if ((e.spawnProt > 0 || G.holdT > 0) && inMatch() && by !== 'world') return false;   // spawn protection / pre-match hold
  if (e.zombie && typeof zpuOn === 'function' && zpuOn('hotbox')) dmg = e.boss ? dmg * 3 : Math.max(dmg, e.hp + 1);   // HOTBOX: one hit kills (bosses take triple)
  e.hp -= dmg; e.flinch = 1; if (e.zombie && (by === 'player' ? G.meleeT > 0 : by && by.melee)) zombStagger(e, dir); if (e.zombie && by === 'player' && e.hp > 0) zombHit(e, head); if (typeof botWasHit === 'function' && M && M.def && inMatch()) botWasHit(e, by);
  if (e.hp > 0 && dir) { const pk = boom ? 0.5 : 0.07; e.group.position.x += dir.x * pk; e.group.position.z += dir.z * pk; e.slowT = boom ? 0.8 : 0.3; }
  if (e.hp <= 0) {
    enemies.splice(enemies.indexOf(e), 1);
    const dd = { e, t: 0, boom: !!boom, dx: dir ? dir.x : 0, dz: dir ? dir.z : 0, head, a: [rnd(0.5, 1.4), rnd(0.5, 1.4), rnd(-0.4, 0.4), rnd(-0.4, 0.4)] };
    if (S.ragdoll && !e.dog) { try { dd.rd = makeRagdoll(e, dir, boom, head); } catch (err) { dd.rd = null; reportError(err); } }
    dying.push(dd);
    if (e.zombie) try { if (e.bloat) zblCloud(e.group.position.x, e.group.position.z, e.group.position.y); if (e.dog) Z.lastDog = { x: e.group.position.x, z: e.group.position.z, y: groundAt(e.group.position.x, e.group.position.z, e.group.position.y + 0.3) }; if (e.win && e.win.occ === e) e.win.occ = null; } catch (err) {}
    e.rig.flash.visible = false;
    if (by === 'player') {
      G.kills++; G.score += 100 + (head ? 50 : 0); statKill(e, head, !!boom);
      try { onKill(e, head, !!boom); } catch (err) { reportError(err); }
      sfx.kill(head);
    }
    if (e.zombie) try { sfx.zgurgle(at(e.group.position.x, e.group.position.z, 14, e.group.position.y)); } catch (err) {}
    if (e.zombie && typeof ZC !== 'undefined' && ZC.on) zcKilled(e, by, head);
    try { matchBotKilled(e, by, head, boom); } catch (err) { reportError(err); }
    { const gx = e.group.position.x, gz = e.group.position.z, gy = groundAt(gx, gz, e.group.position.y + 0.3), coop = e.zombie && typeof zcInGame === 'function' && zcInGame();
      if (coop) { if (Math.random() < 0.22) zcDrop(gx, gz, gy); } else if (Math.random() < 0.28 || totalAmmo() < 40) dropPickup(gx, gz, gy);
      if (e.zombie && !e.boss && by !== 'world' && typeof zpuMaybeDrop === 'function' && (!coop || zcHost())) zpuMaybeDrop(gx, gz, gy); }   // co-op: the host's drops are shared
    _n.set(0, 1, 0); _v3.set(e.group.position.x, 0, e.group.position.z - 0.2); addDecal(_v3, _n, 'blood', 1.3);
    chunks('blood', _v.set(e.group.position.x, 1.2, e.group.position.z), 8, 3, 0.6);
    return true;
  }
  return false;
}
function updateDying(dt) {
  for (let i = dying.length - 1; i >= 0; i--) {
    const d = dying[i], r = d.e.rig, root = d.e.group, s = root.userData.scale || 1; d.t += dt;
    if (d.rd) {
      updateRagdoll(d.rd, r, dt);
      if (d.t > 14) { scene.remove(root); if (d.rd.gun) scene.remove(d.rd.gun.o); dying.splice(i, 1); }
      continue;
    }
    const k = Math.min(d.t / 0.6, 1), ease = k * k * (3 - 2 * k);
    if (d.e.dog) { root.rotation.z = (Math.PI / 2) * ease; root.position.y = 0.05 * ease; if (d.t > 12) { scene.remove(root); dying.splice(i, 1); } continue; }   // a stray falls on its side
    root.rotation.x = -(Math.PI / 2) * ease * 1.02; root.position.y = 0.3 * s * ease;
    if (d.boom && d.t < 0.45) { root.position.x += d.dx * 5 * dt * (1 - d.t / 0.45); root.position.z += d.dz * 5 * dt * (1 - d.t / 0.45); }
    r.armL.rotation.set(lerp(-1.2, -0.3, ease), 0.3, d.a[0] * ease); r.armR.rotation.set(lerp(-0.95, -0.2, ease), -0.3, -d.a[1] * ease);
    r.elL.rotation.x = lerp(-0.35, -0.2, ease); r.elR.rotation.x = lerp(-0.95, -0.3, ease);
    r.legL.rotation.set(0.1 * ease, 0, d.a[2] * ease); r.legR.rotation.set(-0.05 * ease, 0, d.a[3] * ease);
    r.knL.rotation.x = 0.15 * ease; r.knR.rotation.x = 0.3 * ease; r.torso.rotation.x = 0.05 * (1 - ease); r.head.rotation.x = d.head ? 0.5 * ease : 0; r.hips.position.y = 0.98;
    if (d.t > 12) { scene.remove(root); dying.splice(i, 1); }
  }
}

/* ------------------------------------------------------------------ ammo crates */
const crateGeo = { body: null };
function dropPickup(x, z, y = 0) {
  if (!crateGeo.body) crateGeo.body = mergeGeos([{ g: Bx(0.42, 0.26, 0.56), m: mat4(0, 0, 0) }, { g: Bx(0.44, 0.04, 0.2), m: mat4(0, 0.1, 0) }, { g: Bx(0.2, 0.03, 0.05), m: mat4(0, 0.16, 0) }]);
  const grp = new THREE.Group(); const pm = propGroup('ammo', { pickup: MAT.pickup, dark: MAT.dark, default: MAT.pickup });
  if (pm) grp.add(pm); else { const m = new THREE.Mesh(crateGeo.body, MAT.pickup); m.castShadow = true; grp.add(m); }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0x66ff77, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.4 })); glow.scale.set(1.4, 1.4, 1); glow.position.y = 0.1; grp.add(glow);
  grp.position.set(x, y + 0.3, z); scene.add(grp); pickups.push({ m: grp, x, z, y, t: 0, life: 35 });
}
function totalAmmo() { let n = 0; for (const w of WEAPONS) n += w.ammo + w.reserve; return n; }
// an open spot between minR and maxR from the player, on about the player's floor if possible
function randomOpenSpot(minR, maxR) {
  const pts = buildSpawns();
  let best = null, bs = 1e9;
  for (const p of pts) { const d = Math.hypot(p.x - P.x, p.z - P.z), s = (d < minR ? minR - d : d > maxR ? d - maxR : 0) * 2 + Math.abs((p.y || 0) - P.y) * 3 + Math.random(); if (s < bs) { bs = s; best = p; } }
  return best ? { x: best.x, z: best.z, y: best.y || 0 } : { x: P.x, z: P.z + 2, y: P.y };
}
function updatePickups(dt) {
  if (G.waveActive && totalAmmo() === 0 && pickups.length === 0) { const sp = randomOpenSpot(5, 10); dropPickup(sp.x, sp.z, sp.y); showMsg('SUPPLY DROP NEARBY'); }
  for (let i = pickups.length - 1; i >= 0; i--) {
    const k = pickups[i]; k.t += dt; k.m.rotation.y += dt * 1.5; k.m.position.y = (k.y || 0) + 0.3 + Math.sin(k.t * 3) * 0.05;
    if (k.sid && Math.hypot(k.x - P.x, k.z - P.z) < 1.4 && Math.abs(P.y - (k.y || 0)) < 1.5 && G.state === 'playing') { zcTakeDrop(k); continue; }
    if (Math.hypot(k.x - P.x, k.z - P.z) < 1.4 && Math.abs(P.y - (k.y || 0)) < 1.5) {
      const sc = perk('scavenger'), eqMax = EQUIP[G.equip].max;
      for (const w of WEAPONS) w.reserve = Math.min(w.reserveMax, w.reserve + Math.ceil(w.magSize * (sc ? 1.6 : 0.8)));
      if (G.grenades < eqMax && (sc || Math.random() < 0.4)) G.grenades++;
      sfx.pickup(); showMsg('AMMO RESUPPLIED'); scene.remove(k.m); pickups.splice(i, 1);
    } else if (k.t > k.life && !k.sid) { scene.remove(k.m); pickups.splice(i, 1); }
  }
}

/* ------------------------------------------------------------------ waves */
const banner = $('banner'), msg = $('msg');
function showBanner(t, sub) { banner.innerHTML = t + (sub ? `<small>${sub}</small>` : ''); banner.style.opacity = 1; clearTimeout(banner._t); banner._t = setTimeout(() => (banner.style.opacity = 0), 3200); }
function showMsg(t) { msg.textContent = t; msg.style.opacity = 1; clearTimeout(msg._t); msg._t = setTimeout(() => (msg.style.opacity = 0), 2200); }
function startWave() { G.wave++; G.toSpawn = Math.round((4 + G.wave * 2) * diff().count); G.spawnT = 1.5; G.waveActive = true; showBanner(`WAVE ${G.wave}`, `${G.toSpawn} hostiles inbound`); sfx.ui(); }
function updateWaves(dt) {
  if (!G.waveActive) { G.breakT -= dt; if (G.breakT <= 0) startWave(); return; }
  const alive = enemies.length, cap = Math.min(6 + G.wave, 14);
  if (G.toSpawn > 0) { G.spawnT -= dt; if (G.spawnT <= 0 && alive < cap) { spawnEnemy(); G.toSpawn--; G.spawnT = rnd(0.8, 1.8); } }
  else if (alive === 0) {
    G.waveActive = false; G.breakT = 7; G.health = 100; G.grenades = Math.min(G.grenades + 2, EQUIP[G.equip].max);
    WEAPONS.forEach(w => { w.reserve = Math.min(w.reserveMax, w.reserve + Math.round(w.magSize * 2)); });
    G.score += G.wave * 250; showBanner('WAVE CLEARED', `+${G.wave * 250} bonus · resupplied`);
  }
}

/* ------------------------------------------------------------------ HUD */
const rctx = $('radar').getContext('2d');
function drawRadar() {
  if (!S.radar) return;
  const c = rctx, W = 140, R = 62, scale = R / 45;
  if (typeof stkJammed === 'function' && stkJammed()) { stkRadarJam(c, W); return; }
  c.clearRect(0, 0, W, W);
  c.strokeStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(W / 2, W / 2, R / 2, 0, 7); c.stroke();
  c.fillStyle = '#9ec45f'; c.beginPath(); c.moveTo(W / 2, W / 2 - 6); c.lineTo(W / 2 - 4, W / 2 + 4); c.lineTo(W / 2 + 4, W / 2 + 4); c.fill();
  const cs = Math.cos(P.yaw), sn = Math.sin(P.yaw);
  const dot = (x, z) => { const dx = x - P.x, dz = z - P.z; let px = (dx * cs - dz * sn) * scale, py = (dx * sn + dz * cs) * scale; const l = Math.hypot(px, py); if (l > R) { px *= R / l; py *= R / l; } c.fillRect(W / 2 + px - 2, W / 2 + py - 2, 4, 4); };
  const pvp = inMatch();
  for (const e of enemies) { const fr = isFriend(e); if (pvp && !fr && !stkSeen(e) && !(M.t - (e.lastShotT || -9) < 2.5 && !e.stealth)) continue; c.fillStyle = fr ? '#5aaeff' : '#e04a3a'; dot(e.group.position.x, e.group.position.z); }
  if (pvp) { c.fillStyle = '#ffd24a'; for (const m of markerList()) dot(m.x, m.z); }
  c.fillStyle = '#6fcf5a'; for (const k of pickups) dot(k.x, k.z);
}
const el = { hp: $('hpnum'), fill: $('hpfill'), mag: $('mag'), name: $('wname'), gren: $('gren'), slots: $('slots'), wave: $('sWave'), kills: $('sKills'), score: $('sScore'), left: $('sLeft') };
let lastMsg = '';
function showMsgOnce(t) { if (t !== lastMsg) { lastMsg = t; showMsg(t); } }
// DOM writes only when a value actually changes (they trigger style/layout work in the browser)
function hudSet(node, key, val, html) {
  const c = node._hc || (node._hc = {}); if (c[key] === val) return; c[key] = val;
  if (key === 't') { if (html) node.innerHTML = val; else node.textContent = val; } else node.style[key] = val;
}
let radarT = 0;
function updateHud() {
  const w = WEAPONS[G.cur], hp = Math.ceil(G.health);
  hudSet(el.hp, 't', hp); hudSet(el.fill, 'width', clamp(G.health, 0, 100).toFixed(1) + '%');
  hudSet(el.fill, 'background', G.health > 60 ? '#ffffff' : G.health > 30 ? '#ffd23a' : '#ff3b30');
  hudSet(el.mag, 't', `${w.ammo}<small> / ${w.reserve}</small>`, true);
  hudSet(el.name, 't', w.name + (G.reloading ? '  ·  RELOADING' : ''));
  hudSet(el.gren, 't', EQUIP[G.equip].name + ' ' + '● '.repeat(G.grenades).trim());
  if (el.slots._cur !== G.cur || el.slots._pad !== pad.on) { el.slots._cur = G.cur; el.slots._pad = pad.on; el.slots.innerHTML = WEAPONS.map((x, i) => (i === G.cur ? `<b>[${pad.on ? 'Y' : i + 1}] ${x.name}</b>` : `[${pad.on ? 'Y' : i + 1}] ${x.name}`)).join('  '); }
  hudSet(el.wave, 't', G.wave); hudSet(el.kills, 't', G.kills); hudSet(el.score, 't', G.score); hudSet(el.left, 't', enemies.length + G.toSpawn);
  if (G.dmgDirT > 0) { G.dmgDirT -= 1 / 60; dmgdir.style.opacity = clamp(G.dmgDirT, 0, 1); }
  if (!G.waveActive && G.state === 'playing' && G.wave > 0) showMsgOnce(`NEXT WAVE IN ${Math.ceil(G.breakT)}`);
  hudSet($('hud'), 'filter', G.health < 30 && G.state === 'playing' ? 'saturate(.7)' : '');
  // the radar redraws at 30 Hz
  radarT += 1 / 60; if (radarT >= 1 / 30) { radarT = 0; drawRadar(); }
}

/* ------------------------------------------------------------------ flow */
function recordBest() {
  let nb = false;
  if (G.wave > best.wave) { best.wave = G.wave; nb = true; }
  if (G.score > best.score) { best.score = G.score; nb = true; }
  if (nb) saveBest(); updateBestUI(); return nb;
}
function updateBestUI() { $('bestWave').textContent = best.wave; $('bestScore').textContent = best.score; }
function clearWorldState() {
  for (const e of enemies) scene.remove(e.group); enemies.length = 0;
  for (const d of dying) { scene.remove(d.e.group); if (d.rd && d.rd.gun) scene.remove(d.rd.gun.o); } dying.length = 0;
  for (const g of grenadesInFlight) scene.remove(g.m); grenadesInFlight.length = 0;
  for (const k of pickups) scene.remove(k.m); pickups.length = 0;
  if (G.bench) endBenchState();
  for (const d of decals) d.visible = false; for (const c of casings) { c.on = false; c.m.visible = false; }
  navTarget = -1; G.streak = 0; if (typeof stkReset === 'function') stkReset(); G.multi = 0; restoreBarrels(); G.killer = null; G.dc = null; G.dcHold = false; $('killcam').classList.add('hide');
}
function resetGame() {
  clearWorldState();
  Object.assign(P, { x: 0, y: 0, z: 10, vx: 0, vz: 0, vy: 0, yaw: 0, pitch: 0, eye: 1.7, onGround: true, recoilAcc: 0 });
  Object.assign(G, { maxHp: 100, spawnProt: 0, health: 100, lastHit: -99, wave: 0, kills: 0, score: 0, grenades: 3, fireT: 0, reloading: false, swapT: 0, toSpawn: 0, waveActive: false, breakT: 2.5, adsOn: false, ads: 0, kick: 0, shake: 0, shotT: 9 });
  equipClass(activeClass()); G.grenades = EQUIP[G.equip].count; el.slots._cur = -1;
  mouseAds = false; mouseDown = false;
  vig.style.opacity = 0; lastMsg = ''; camera.fov = baseFov; camera.updateProjectionMatrix(); hideCenter(); FLOW.clear();
  showBanner('DARKZONE', 'hold the line');
}
const MENU_SPOTS = [[-3.2, 3.0, 0.6, 'rifleman'], [3.0, 2.0, -0.5, 'heavy'], [0.2, -3.5, 3.3, 'scout'], [-7, -6, 1.0, 'rifleman']];
function spawnMenuSoldiers() {
  clearMenuSoldiers();
  for (const [x, z, ry, type] of MENU_SPOTS) { const rig = cloneSoldier(type); rig.root.rotation.order = 'YXZ'; rig.root.position.set(x + MENU_VIEW.x, MENU_VIEW.by || 0, z + MENU_VIEW.z); rig.root.rotation.y = ry; scene.add(rig.root); rig.e = { rig, aim: 0.35, phase: Math.random() * 6, phase0: Math.random() * 6, flinch: 0, flashT: 0 }; menuSoldiers.push(rig); }
}
function clearMenuSoldiers() { for (const m of menuSoldiers) scene.remove(m.root); menuSoldiers.length = 0; }
function updateMenuSoldiers(dt) { for (const m of menuSoldiers) animEnemy(m.e, dt, 0); }

function die() {
  if (G.state === 'paused') { showScreen(null); G.state = G.pausedFrom || 'playing'; }
  mouseDown = false; mouseAds = false; G.streak = 0; statDeath(); stkDeath();
  try { matchPlayerKilled(G.killer); } catch (err) { reportError(err); }
  if (M.over) return;
  if (M.mode === 'zomb' && zpSelfRevive()) { G.state = 'playing'; return; }
  if (M.mode === 'zomb' && zcInGame()) { zcDown(); return; }
  if (M.mode === 'zomb') { try { zvSay('down'); } catch (e) {} finishDeath(); return; }
  if (inMatch() && !S.deathCam) { G.state = 'deathcam'; afterDeathInMatch(); return; }
  if (S.deathCam && G.state === 'playing') { startDeathCam(); return; }
  finishDeath();
}
function finishDeath() {
  if (inMatch()) { if (!M.over) afterDeathInMatch(); return; }
  finishMatchStats(null);
  G.state = 'dead'; mouseDown = false; mouseAds = false; G.dcHold = !!G.dc;
  $('killcam').classList.add('hide');
  try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  if (M.mode === 'zomb') zombDeathText(); else {
  const nb = recordBest();
  $('overStats').textContent = `WAVE ${G.wave}  ·  KILLS ${G.kills}  ·  SCORE ${G.score}`;
  $('overBest').textContent = nb ? 'NEW PERSONAL BEST' : `BEST  ·  WAVE ${best.wave}  ·  SCORE ${best.score}`; }
  showScreen('over');
}
function pauseGame() {
  if (G.state !== 'playing' && G.state !== 'respawning' && G.state !== 'spectate' && G.state !== 'zdown' && G.state !== 'zspec') return;
  G.pausedFrom = G.state; G.state = 'paused'; mouseDown = false; mouseAds = false;
  try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  $('pauseSub').textContent = M.mode === 'zomb' ? `ROUND ${Z.round}  ·  ${(G.points | 0).toLocaleString()} POINTS  ·  KILLS ${G.kills}` : `WAVE ${G.wave}  ·  KILLS ${G.kills}  ·  SCORE ${G.score}`;
  showScreen('pause'); try { renderPauseSide(); } catch (e) {}
}
function resumeGame() { if (G.state !== 'paused') return; G.state = G.pausedFrom || 'playing'; showScreen(null); lockPointer(); }
// Scavenger: every kill tops up one magazine of reserve ammo
function perkOnKill() { if (!perk('scavenger')) return; for (const w of WEAPONS) w.reserve = Math.min(w.reserveMax, w.reserve + w.magSize); }
function startGame() { startMatch('surv'); }
function restartMatch() { if (M.over && typeof nextMatch === 'function') { nextMatch(); return; } if (M.mode === 'zomb' && ZC.on) { zcRedeploy(); return; } if (M.mode === 'zomb') startMatch('zomb', { map: ZL.map === 'random' ? 'random' : curMap }); else if (M.mode === 'surv') startMatch('surv', { map: curMap }); else startMatch(M.mode, Object.assign({}, M.cfg.custom ? M.cfg : {}, { map: curMap })); }
// leave whatever is running and go back to the menu scene (soldiers posing behind the menus)
function leaveGame() {
  if (G.state === 'playing' || G.state === 'paused' || G.state === 'dead') recordBest();
  if (MS.active && G.state !== 'over') commitPartialStats();
  if (typeof REC !== 'undefined' && REC && G.state !== 'over') try { rpFinish(0); } catch (e) {}   // leaving early: your kills, deaths and time still count (not as a match)
  clearWorldState(); clearMatch(); G.holdT = 0; G.loadT = 0; try { hideLoadScreen(); } catch (e) {} G.state = 'menu'; G.health = 100; vig.style.opacity = 0; hideCenter();
  hadLock = false; try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  spawnMenuSoldiers();
}
function clearMatch() { try { netLeave(); } catch (e) {} try { zombClear(); } catch (e) {} if (OBJ.group) { scene.remove(OBJ.group); OBJ.group = null; } M = { mode: 'surv', def: MODES.surv, entries: [] }; const mh = $('mhud'); if (mh) { mh.classList.add('hide'); mh._on = false; } const st = $('stats'); if (st) { st.style.display = ''; st._surv = true; } const ih = $('ihold'); if (ih) ih.classList.add('hide'); setScoreboard(false); }
function toMenu() { leaveGame(); showScreen('menu'); }
function toLobby() { if (G.state !== 'menu') leaveGame(); renderLobby(); showScreen('lobby'); }
