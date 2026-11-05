/* ================================================================== SLIDE and MANTLE (1.2.78)
   SLIDE: sprinting, press CROUCH: you drop low and shoot forward (a burst of speed that fades over 0.7 s), steering a
   little. JUMP out of a slide to keep the speed. Can't slide again for half a second.
   MANTLE: JUMP at a ledge from waist high up to a bit over head height (a wall, a crate, a container, a window sill
   you can stand on) and you climb up onto it, as long as there is room to stand on top. It works from a standing
   jump, mid-air (jump into a ledge and keep holding JUMP) and out of a slide. No shooting while you climb.
   Both are the player's (the camera tilts a little with them); everyone else sees you move like any other position. */
const MOV = { slideCd: 0, crouchH: false, sprintPrev: false, jumpH: false };
// is there a ledge in front of me to climb? returns where to end up, or null
function mvLedge() {
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), maxTop = P.y + 2.15, minTop = P.y + 0.55;
  for (const d of [0.6, 0.85]) {
    const px = P.x + fx * d, pz = P.z + fz * d; let top = -1, blocked = false;
    for (const b of boxesNear(px, pz)) {
      if (px < b.minx || px > b.maxx || pz < b.minz || pz > b.maxz) continue;
      if (b.top <= maxTop && b.top > top) top = b.top;
    }
    if (top < minTop) continue;
    // nothing above the ledge where I'd stand (or on the way there)
    for (const [qx, qz] of [[px, pz], [P.x + fx * d * 0.5, P.z + fz * d * 0.5], [px + fx * 0.35, pz + fz * 0.35]]) {
      for (const b of boxesNear(qx, qz)) { if (qx < b.minx - 0.25 || qx > b.maxx + 0.25 || qz < b.minz - 0.25 || qz > b.maxz + 0.25) continue; if (b.top > top + 0.05 && b.bot < top + 1.8) { blocked = true; break; } }
      if (blocked) break;
    }
    if (blocked) continue;
    if (Math.abs(groundAt(px, pz, top) - top) > 0.05) continue;   // a real floor up there, not the side of something
    return { x: px + fx * 0.25, y: top, z: pz + fz * 0.25, h: top - P.y };
  }
  return null;
}
// called from updatePlayer after the walking velocity is worked out; may take over the velocity (slide)
function mvSlide(dt, fwd, crouch, sprint) {
  MOV.slideCd = Math.max(0, MOV.slideCd - dt);
  const press = crouch && !MOV.crouchH; MOV.crouchH = crouch;
  const hs = Math.hypot(P.vx, P.vz);
  if (press && MOV.sprintPrev && P.onGround && hs > 5.5 && MOV.slideCd <= 0 && !P.mantle) {
    P.slideT = 0.7; P.slideDx = P.vx / hs; P.slideDz = P.vz / hs; P.slideV = Math.max(hs, 8) * 1.32; MOV.slideCd = 1.2;
    try { sfx.thud({ vol: 0.45 }); sfx.step(0.9); } catch (e) {}
  }
  MOV.sprintPrev = sprint;
  if (!(P.slideT > 0)) return false;
  P.slideT -= dt;
  if (!crouch || P.slideT <= 0) { P.slideT = 0; return false; }
  // steer a little toward where I look
  const lx = -Math.sin(P.yaw), lz = -Math.cos(P.yaw), k = clamp(dt * 1.6, 0, 1);
  P.slideDx = lerp(P.slideDx, lx, k * 0.35); P.slideDz = lerp(P.slideDz, lz, k * 0.35); const l = Math.hypot(P.slideDx, P.slideDz) || 1; P.slideDx /= l; P.slideDz /= l;
  const sp = lerp(2.8, P.slideV, clamp(P.slideT / 0.7, 0, 1));
  if (P.onGround) { P.vx = P.slideDx * sp; P.vz = P.slideDz * sp; }
  return true;
}
// called before the position update: true while climbing (the climb moves me instead of physics)
function mvMantle(dt, fwd, hold) {
  const jump = !hold && (kb('jump') || pad.jump), press = jump && !MOV.jumpH; MOV.jumpH = jump;
  if (P.mantle) {
    const m = P.mantle; m.t += dt; const k = clamp(m.t / m.dur, 0, 1), up = smooth(0, 0.65, k), fw = smooth(0.35, 1, k);
    P.x = m.x0 + (m.x1 - m.x0) * fw; P.z = m.z0 + (m.z1 - m.z0) * fw; P.y = m.y0 + (m.y1 - m.y0) * up; P.vx = P.vz = P.vy = 0;
    if (k >= 1) { P.mantle = null; P.onGround = true; P.y = groundAt(P.x, P.z, m.y1 + 0.05); }
    return true;
  }
  if (!jump || fwd <= 0 || G.downed || (typeof VH !== 'undefined' && VH.me)) return false;
  if (!press && (P.onGround || P.vy > 3)) return false;   // a fresh press on the ground, or holding JUMP in the air (on the way down / at the top)
  const L = mvLedge(); if (!L) return false;
  P.mantle = { t: 0, dur: L.h > 1.3 ? 0.42 : 0.3, x0: P.x, y0: P.y, z0: P.z, x1: L.x, y1: L.y, z1: L.z }; P.slideT = 0; P.vy = 0;
  try { sfx.thud({ vol: 0.35 }); } catch (e) {}
  return true;
}
// the camera's extra roll / dip for both
function mvTilt(dt) { P.tilt = lerp(P.tilt || 0, P.slideT > 0 ? 0.06 : 0, clamp(dt * 10, 0, 1)); return P.tilt; }
