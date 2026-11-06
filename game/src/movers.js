/* ================================================================== JUMP PADS and ZIPLINES (1.2.84)
   STASH ISLAND only (the 6v6 maps keep their lines). JUMP PADS (green rings on the ground) throw you in an arc onto a
   high spot: the water tower deck and the bunker's watch tower. ZIPLINES run from those towers back down across the
   island: USE at the top to clip on, you slide down at speed (you can shoot on the way), JUMP lets go early.
   Built with the map; the pads and lines are the same on every machine. */
const MOVERS = {
  stashisle: {
    pads: [{ x: -30, z: -3.6, to: { x: -42.6, y: 5, z: -3.6 } }, { x: 40, z: 12, to: { x: 46, y: 5, z: 26.5 } }],
    zips: [{ a: { x: -44.6, y: 7.4, z: 4.2 }, b: { x: -14, y: 2.6, z: 24 } }, { a: { x: 47.6, y: 7.2, z: 27.6 }, b: { x: 30, y: 2.6, z: -10 } }],
  },
};
const MV2 = { fly: null, zip: null, cd: 0, uH: false };
// built with the map (buildStash calls this)
function moversBuild(id) {
  const d = MOVERS[id]; if (!d) return;
  for (const p of d.pads) {
    CYL('steel', 1.1, 1.2, 0.1, 24, p.x, 0.05, p.z, 0, 0, 0, false);
    batchAdd('stashPad', new THREE.TorusGeometry(0.85, 0.06, 8, 32), mat4(p.x, 0.13, p.z, Math.PI / 2, 0, 0), false);
    batchAdd('stashPad', new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8), mat4(p.x, 0.35, p.z - 1.3), false);
  }
  for (const z of d.zips) {
    for (const e of [z.a, z.b]) { const gy = groundAt(e.x, e.z, e.y); CYL('rustIron', 0.08, 0.1, e.y + 0.4 - gy, 8, e.x, gy + (e.y + 0.4 - gy) / 2, e.z); }
    beam('dark', z.a.x, z.a.y + 0.3, z.a.z, z.b.x, z.b.y + 0.3, z.b.z, 0.035, 0.035, false);
  }
}
function moversMaterials() { if (!MAT.stashPad) MAT.stashPad = new THREE.MeshBasicMaterial({ color: 0x5dff7a }); }
// every frame of a match on the map
function moversTick(dt) {
  const d = MOVERS[curMap]; if (!d || !playerAlive()) { MV2.fly = MV2.zip = null; return; }
  MV2.cd = Math.max(0, MV2.cd - dt);
  if (MV2.zip) return;   // (the ride itself runs in updatePlayer: moversZip)
  // pads: step on one to fly
  if (!MV2.fly && MV2.cd <= 0 && P.onGround) for (const p of d.pads) {
    if (Math.hypot(P.x - p.x, P.z - p.z) > 1.0 || P.y > 0.6) continue;
    const T = 1.15 + Math.hypot(p.to.x - p.x, p.to.z - p.z) / 40, dx = p.to.x - P.x, dz = p.to.z - P.z, dy = p.to.y - P.y;
    MV2.fly = { vx: dx / T, vz: dz / T, t: T }; P.vy = (dy + 0.5 * 22 * T * T) / T; P.onGround = false; MV2.cd = 1.5;
    try { sfx.thud({ vol: 0.9 }); sfx.streak(); achAdd('pads'); } catch (e) {}
  }
  // ziplines: USE at the top
  const u = kb('use') || pad.use;
  if (!MV2.zip && u && !MV2.uH) for (const z of d.zips) if (Math.hypot(P.x - z.a.x, P.z - z.a.z) < 1.8 && Math.abs(P.y + 1.9 - z.a.y) < 2.2) { achAdd('zips'); MV2.zip = { z, k: 0, len: Math.hypot(z.b.x - z.a.x, z.b.y - z.a.y, z.b.z - z.a.z) }; try { sfx.ui(); } catch (e) {} break; }
  if (!MV2.zip) for (const z of d.zips) if (Math.hypot(P.x - z.a.x, P.z - z.a.z) < 1.8 && Math.abs(P.y + 1.9 - z.a.y) < 2.2) { G.interactTxt = `ZIPLINE · PRESS ${actName('use')} TO RIDE`; try { showMsg(G.interactTxt); } catch (e) {} }
  MV2.uH = u;
}
function moversZip(dt) {
  const Z = MV2.zip, z = Z.z; Z.k = Math.min(1, Z.k + 14 * dt / Z.len);
  const x = z.a.x + (z.b.x - z.a.x) * Z.k, y = z.a.y + (z.b.y - z.a.y) * Z.k, zz = z.a.z + (z.b.z - z.a.z) * Z.k;
  P.vx = (z.b.x - z.a.x) / Z.len * 14; P.vz = (z.b.z - z.a.z) / Z.len * 14; P.x = x; P.z = zz; P.y = y - 1.95; P.vy = 0; P.onGround = false;
  if (Z.k >= 1 || ((kb('jump') || pad.jump) && Z.k > 0.08)) { MV2.zip = null; P.vy = 1.5; MV2.cd = 0.8; }
}
const moversRiding = () => !!MV2.zip;
// in updatePlayer, after the walking velocity: a pad's arc keeps its line until you land
function moversFly(dt) { const F = MV2.fly; if (!F) return; F.t -= dt; P.vx = F.vx; P.vz = F.vz; if ((F.t <= 0.3 && P.onGround) || F.t < -1.5) MV2.fly = null; }
