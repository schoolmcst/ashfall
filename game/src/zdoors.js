/* ================================================================== ZOMBIES: doors you buy to open the hospital, and the gun upgrader
   Zombies is played on BLACKWELL HOSPITAL. You start in the south lobby and the ambulance bay; boarded doors and
   barricades (a collider each, so players, zombies and bullets stop at them) open more of the building for points.
   Zombies only spawn where the survivors can walk to, so they come from the parts that are open. In co-op every door
   anyone buys opens for the whole squad (the host collects them and tells everyone).
   The GUN UPGRADER (north lobby, 5000 points): the gun in your hands does double damage, holds half again as many
   rounds, carries twice the reserve and glows purple. */
const ZOMB_MAP = 'blackwell', ZU_COST = 5000;
// ax 'x': a doorway along x at z = c, from x = a to b; ax 'z': along z at x = c
const ZDOORS = [
  { name: 'WEST LOBBY DOOR', cost: 750, ax: 'z', c: -8, a: 24.6, b: 26.4, y: 0, h: 2.4 },
  { name: 'EAST LOBBY DOOR', cost: 750, ax: 'z', c: 8, a: 24.6, b: 26.4, y: 0, h: 2.4 },
  { name: 'MAIN CORRIDOR', cost: 1250, ax: 'x', c: 14, a: -7.875, b: 7.875, y: 0, h: 3.9, wide: true },
  { name: 'WEST YARD', cost: 1000, ax: 'z', c: -12, a: 34.25, b: 44, y: 0, h: 3, wide: true },
  { name: 'EAST YARD', cost: 1000, ax: 'z', c: 12, a: 34.25, b: 44, y: 0, h: 3, wide: true },
  { name: 'NORTH WING', cost: 1500, ax: 'x', c: -10, a: -10, b: 10, y: 0, h: 3.85, wide: true },
  { name: 'WEST ATRIUM DOOR', cost: 1000, ax: 'z', c: -10, a: -5.8, b: -4.2, y: 0, h: 2.4 },
  { name: 'EAST ATRIUM DOOR', cost: 1000, ax: 'z', c: 10, a: -5.8, b: -4.2, y: 0, h: 2.4 },
  { name: 'WEST STAIRWELL', cost: 1000, ax: 'x', c: 10, a: -37.65, b: -36.35, y: 0, h: 2.4 },
  { name: 'EAST STAIRWELL', cost: 1000, ax: 'x', c: 10, a: 36.35, b: 37.65, y: 0, h: 2.4 },
  { name: 'BRIDGE · SOUTH END', cost: 1250, ax: 'x', c: 9.55, a: -1.3, b: 1.3, y: 4.2, h: 2.4 },
  { name: 'BRIDGE · NORTH END', cost: 1250, ax: 'x', c: -9.55, a: -1.3, b: 1.3, y: 4.2, h: 2.4 },
  ...[[-28, 0], [-16, 0], [16, 0], [28, 0], [-28, 4.2], [-16, 4.2], [16, 4.2], [28, 4.2]].map(([x, y]) => ({ name: y ? 'UPSTAIRS WARD DOOR' : 'WARD DOOR', cost: 1000, ax: 'x', c: 0, a: x - 0.7, b: x + 0.7, y, h: 2.4 })),
];
// the outside strips along the east and west walls are closed for good in zombies (no way round to the north)
const ZWALLS = [{ ax: 'x', c: 0, a: 40.2, b: 44, y: 0, h: 3.2 }, { ax: 'x', c: 0, a: -44, b: -40.2, y: 0, h: 3.2 }];
const ZU_SPOT = { x: -6.9, z: -27, y: 0 };
const ZD = { list: [], open: new Set(), mine: new Set(), anim: [], pts: null, up: null };
ZDOORS.forEach((d, i) => { d.id = i; });
const zdMats = () => ZD.mats || (ZD.mats = {
  board: new THREE.MeshStandardMaterial({ color: 0x4a3322, roughness: 0.95 }), dark: new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.8 }),
  tape: new THREE.MeshStandardMaterial({ color: 0xe2b13a, roughness: 0.6 }), plate: new THREE.MeshStandardMaterial({ color: 0x220405, emissive: new THREE.Color(0xff2a1a), emissiveIntensity: 1.3 }),
  bed: new THREE.MeshStandardMaterial({ color: 0x9aa0a2, roughness: 0.5, metalness: 0.5 }), sheet: new THREE.MeshStandardMaterial({ color: 0xb8a890, roughness: 1 }),
});

/* ---------- building and clearing the doors */
function zdGeom(d) {   // centre, size of the collider
  const L = d.b - d.a, mid = (d.a + d.b) / 2;
  return d.ax === 'x' ? { x: mid, z: d.c, w: L, dp: 0.3, L } : { x: d.c, z: mid, w: 0.3, dp: L, L };
}
function zdVisual(d, perm) {
  const M = zdMats(), g = new THREE.Group(), q = zdGeom(d), along = d.ax === 'x', rng = makeRng(17 + (d.id || 0) * 31 + (perm ? 999 : 0));
  const put = (mesh, a, y, off = 0) => { mesh.position.set(along ? q.x + a : q.x + off, d.y + y, along ? q.z + off : q.z + a); mesh.castShadow = true; g.add(mesh); return mesh; };
  const half = q.L / 2, posts = Math.max(2, Math.round(q.L / 2.2) + 1);
  for (let i = 0; i < posts; i++) { const a = -half + 0.08 + (q.L - 0.16) * i / (posts - 1); put(new THREE.Mesh(new THREE.BoxGeometry(along ? 0.12 : 0.14, d.h, along ? 0.14 : 0.12), M.board), a, d.h / 2, 0.05); }
  const n = Math.round(d.h / 0.42);
  for (let i = 0; i < n; i++) { const y = 0.25 + i * (d.h - 0.4) / Math.max(1, n - 1), m = new THREE.Mesh(new THREE.BoxGeometry(along ? q.L + 0.2 : 0.05, 0.2, along ? 0.05 : q.L + 0.2), M.board); put(m, (rng() - 0.5) * 0.2, y, -0.06); if (along) m.rotation.z = (rng() - 0.5) * 0.22; else m.rotation.x = (rng() - 0.5) * 0.22; }
  for (const k of [0.95, 1.55]) { const t = new THREE.Mesh(new THREE.BoxGeometry(along ? q.L + 0.1 : 0.02, 0.08, along ? 0.02 : q.L + 0.1), M.tape); put(t, 0, k, -0.11); if (along) t.rotation.z = 0.1; else t.rotation.x = 0.1; }
  if (d.wide) for (let i = 0; i < Math.floor(q.L / 3.4); i++) {   // beds and gurneys piled against the boards
    const a = -half + 1.7 + i * 3.4 + (rng() - 0.5) * 0.6, side = perm ? 0.45 : -0.55, bed = new THREE.Mesh(new THREE.BoxGeometry(along ? 2.0 : 0.9, 0.7, along ? 0.9 : 2.0), M.bed);
    put(bed, a, 0.55 + (i % 2) * 0.1, side); bed.rotation.set(along ? 0.5 : 0, rng(), along ? 0 : 0.5);
    const sh = new THREE.Mesh(new THREE.BoxGeometry(along ? 1.8 : 0.8, 0.1, along ? 0.8 : 1.8), M.sheet); put(sh, a, 0.95 + (i % 2) * 0.1, side); sh.rotation.copy(bed.rotation);
  }
  if (!perm) { const pl = new THREE.Mesh(new THREE.BoxGeometry(along ? 0.7 : 0.03, 0.22, along ? 0.03 : 0.7), M.plate); put(pl, 0, 1.25, -0.13); const pl2 = pl.clone(); put(pl2, 0, 1.25, 0.2); }
  scene.add(g); return g;
}
function zdAdd(d, perm) {
  const q = zdGeom(d), box = mkBox(q.x, q.z, q.w, q.dp, d.h, { y: d.y, walk: false });
  boxes.push(box);
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(q.w, d.h, q.dp), proxyMat); proxy.position.set(q.x, d.y + d.h / 2, q.z); proxy.visible = false; proxy.userData.ray = true; scene.add(proxy); proxy.updateMatrixWorld(); wallMeshes.push(proxy);
  return { d, box, proxy, g: zdVisual(d, perm), perm, open: false };
}
function zdRemove(o) {
  const i = boxes.indexOf(o.box); if (i >= 0) boxes.splice(i, 1);
  const j = wallMeshes.indexOf(o.proxy); if (j >= 0) wallMeshes.splice(j, 1);
  scene.remove(o.proxy); if (o.g) scene.remove(o.g);
}
// a new zombies game: every door closed again
function zdInit() {
  zdClear(true);
  if (curMap !== ZOMB_MAP) return;
  ZD.list = ZDOORS.map(d => zdAdd(d, false)).concat(ZWALLS.map(d => zdAdd(d, true)));
  ZD.open.clear(); ZD.mine.clear(); ZD.pts = null;
  ZD.up = zuBuild();
  boxGridDirty = true; buildNav(); SPAWNS = null;
}
function zdClear(keepNav) {
  if (!ZD.list.length && !ZD.up) return;
  for (const o of ZD.list) zdRemove(o); ZD.list = []; ZD.anim.length = 0;
  if (ZD.up) { zdRemove(ZD.up); ZD.up = null; }
  ZD.open.clear(); ZD.mine.clear();
  if (!keepNav) { boxGridDirty = true; buildNav(); SPAWNS = null; }
}
function zdOpen(id, bought) {
  const o = ZD.list.find(o => !o.perm && o.d.id === id); if (!o || o.open) return false;
  o.open = true; ZD.open.add(id); if (bought) ZD.mine.add(id);
  const i = boxes.indexOf(o.box); if (i >= 0) boxes.splice(i, 1);
  const j = wallMeshes.indexOf(o.proxy); if (j >= 0) wallMeshes.splice(j, 1); scene.remove(o.proxy);
  ZD.anim.push({ g: o.g, t: 0, o });
  boxGridDirty = true; buildNav();
  try { tone(140, 0.25, 0.12, 'square'); tone(90, 0.5, 0.1, 'sawtooth'); } catch (e) {}
  return true;
}
function zdAnim(dt) {
  for (let i = ZD.anim.length - 1; i >= 0; i--) {
    const a = ZD.anim[i]; a.t += dt;
    a.g.children.forEach((m, k) => { m.position.y -= dt * (2 + (k % 4)) * a.t * 3; m.rotation.x += dt * (k % 2 ? 2 : -2); });
    if (a.t > 0.9) { scene.remove(a.g); a.o.g = null; ZD.anim.splice(i, 1); }
  }
}
// where zombies can come from: every floor in the building (upstairs too); reachability is checked when spawning
function zdSpawnPts() {
  if (ZD.pts) return ZD.pts;
  if (curMap !== ZOMB_MAP) return (ZD.pts = buildSpawns());
  const pts = [];
  for (let z = -40; z <= 40; z += 2.5) for (let x = -42; x <= 42; x += 2.5) {
    const c = cellOf(z) * NN + cellOf(x);
    for (let l = 0; l < lvN[c]; l++) { const h = lvH[c * NL + l]; if (lvS[c * NL + l] || h > 6) continue; pts.push({ x: cellPos(cellOf(x)), z: cellPos(cellOf(z)), y: h }); }
  }
  return (ZD.pts = pts);
}

/* ---------- standing next to a door or the upgrader */
function zdDist(d) {
  const ax = d.ax === 'x', u = ax ? P.x : P.z, v = ax ? P.z : P.x, du = Math.max(d.a - u, 0, u - d.b);
  return Math.abs((P.y || 0) - d.y) < 1.6 ? Math.hypot(du, v - d.c) : 99;
}
function zdPrompt() {
  let best = null, bd = 1.9;
  for (const o of ZD.list) if (!o.perm && !o.open) { const dd = zdDist(o.d); if (dd < bd) { bd = dd; best = o; } }
  return best;
}
function zdBuy(o) {
  if (G.points < o.d.cost) return;
  G.points -= o.d.cost; zdOpen(o.d.id, true);
  showBanner(o.d.name, 'opened'); try { sfx.ui(); } catch (e) {}
}

/* ---------- the gun upgrader */
function zuBuild() {
  const s = ZU_SPOT, g = new THREE.Group(), body = new THREE.MeshStandardMaterial({ color: 0x1c1a24, roughness: 0.45, metalness: 0.7 }), glow = new THREE.MeshStandardMaterial({ color: 0x120420, emissive: new THREE.Color(0x9a3cff), emissiveIntensity: 1.8 });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  add(new THREE.BoxGeometry(1.0, 1.9, 1.3), body, 0, 0.95, 0);
  add(new THREE.BoxGeometry(0.04, 0.12, 0.9), glow, 0.52, 1.15, 0);                 // the slot the gun goes in
  add(new THREE.BoxGeometry(0.04, 0.5, 0.7), glow, 0.52, 1.6, 0).material = new THREE.MeshStandardMaterial({ color: 0x0a1018, emissive: new THREE.Color(0x5a8ab0), emissiveIntensity: 0.9 });
  for (const z of [-0.45, 0.45]) { add(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 10), body, -0.2, 1.2, z); add(new THREE.BoxGeometry(1.02, 0.05, 0.05), glow, 0, 0.3, z * 1.4); }
  for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), glow, 0.2, 1.95 + i * 0.12, -0.3 + i * 0.3);
  const beam = add(new THREE.CylinderGeometry(0.4, 0.7, 10, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0x9a3cff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }), 0, 5, 0); g.userData.beam = beam;
  const lt = new THREE.PointLight(0x9a3cff, 1.4, 7, 2); lt.position.set(0.8, 1.6, 0); g.add(lt);
  g.position.set(s.x, s.y, s.z); scene.add(g);
  const box = mkBox(s.x, s.z, 1.0, 1.3, 1.9, { y: s.y, walk: false }); boxes.push(box);
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 1.3), proxyMat); proxy.position.set(s.x, s.y + 0.95, s.z); proxy.visible = false; proxy.userData.ray = true; scene.add(proxy); proxy.updateMatrixWorld(); wallMeshes.push(proxy);
  return { g, box, proxy, t: 0 };
}
const zuName = n => n + ' ✦';
function zuBuy() {
  const w = WEAPONS[G.cur]; if (!w || !Z.up) return;
  if (Z.up.has(w.def.id)) { showMsg('THIS GUN IS ALREADY UPGRADED'); return; }
  if (G.points < ZU_COST) return;
  G.points -= ZU_COST; Z.up.add(w.def.id); ZD.up.t = 1.6;
  zombEquip(G.cur);
  showBanner(zuName(w.def.name), 'UPGRADED · double damage · bigger magazine'); try { sfx.streak(); tone(220, 0.6, 0.12, 'sawtooth'); tone(330, 0.8, 0.08, 'triangle'); } catch (e) {}
}
// after every re-equip: upgraded guns get their stats and the purple glow
function zuApply() {
  if (!Z.up || !Z.up.size) return;
  WEAPONS.forEach((w, i) => {
    if (!Z.up.has(w.def.id)) return;
    w.dmg *= 2; w.magSize = Math.ceil(w.magSize * 1.5); w.reserveMax = (w.reserveMax || w.def.reserve) * 2; w.ammo = w.magSize; w.reserve = w.reserveMax; w.name = zuName(w.def.name); w.upgraded = true;
    const g = gunObjs[i]; if (!g) return;
    g.traverse(m => { if (!m.isMesh || m.userData.zu) return; m.userData.zu = true; const tint = mt => { const c = mt.clone(); if (c.emissive) { c.emissive = new THREE.Color(0x7a2cff); c.emissiveIntensity = 0.55; } if (c.color) c.color.lerp(new THREE.Color(0x6a3aa8), 0.35); return c; }; m.material = Array.isArray(m.material) ? m.material.map(tint) : tint(m.material); });
  });
}
function zuNear() { const s = ZU_SPOT; return ZD.up && Math.hypot(P.x - s.x, P.z - s.z) < 2.2 && Math.abs((P.y || 0) - s.y) < 1.5; }
function zdTick(dt) {
  zdAnim(dt);
  if (ZD.up) { ZD.up.g.userData.beam.material.opacity = 0.1 + Math.sin(NOW * 3) * 0.05; if (ZD.up.t > 0) ZD.up.t -= dt; }
}
