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
  { name: 'MAIN CORRIDOR', cost: 1250, ax: 'x', c: 14, a: -7.875, b: 7.875, y: 0, h: 3.9, wide: true, path: true },
  { name: 'NORTH WING', cost: 1500, ax: 'x', c: -10, a: -10, b: 10, y: 0, h: 3.85, wide: true, path: true },
  { name: 'UPGRADE ROOM', cost: 2000, ax: 'x', c: -14, a: -7.875, b: 7.875, y: 0, h: 3.9, wide: true, path: true },
  { name: 'UPSTAIRS', cost: 1500, ax: 'x', c: 9.55, a: -1.3, b: 1.3, y: 4.2, h: 2.4 },
];
// boarded for good in zombies: every other way between the zones, so no paid door can be walked around
//   start (south lobby + ambulance bay) | MAIN CORRIDOR | south ground floor + atrium | NORTH WING | north ground floor
//   | UPGRADE ROOM | north lobby (the upgrader); the whole upper floor is behind UPSTAIRS (the bridge's south end)
const ZWALLS = [
  { ax: 'x', c: 0, a: 40.2, b: 44, y: 0, h: 3.2 }, { ax: 'x', c: 0, a: -44, b: -40.2, y: 0, h: 3.2 },   // outside strips: no way round north
  { ax: 'x', c: -34, a: -2.4, b: 2.4, y: 0, h: 3.3 },                                                     // north main entrance
  { ax: 'z', c: -8, a: 24.6, b: 26.4, y: 0, h: 2.4 }, { ax: 'z', c: 8, a: 24.6, b: 26.4, y: 0, h: 2.4 },   // south lobby side doors
  { ax: 'z', c: -12, a: 34.25, b: 44, y: 0, h: 3, wide: true }, { ax: 'z', c: 12, a: 34.25, b: 44, y: 0, h: 3, wide: true },   // the yards
  { ax: 'z', c: -10, a: -5.8, b: -4.2, y: 0, h: 2.4 }, { ax: 'z', c: 10, a: -5.8, b: -4.2, y: 0, h: 2.4 }, // atrium side doors (north half)
  ...[-28, -16, 16, 28].map(x => ({ ax: 'x', c: 0, a: x - 0.7, b: x + 0.7, y: 0, h: 2.4 })),              // ward doors between the halves
  ...[[-37, 10], [37, 10], [-37, -10], [37, -10]].map(([x, z]) => ({ ax: 'x', c: z, a: x - 0.65, b: x + 0.65, y: 0, h: 2.4 })),   // stairwells
  { ax: 'z', c: -8, a: -26.4, b: -24.6, y: 0, h: 2.4 }, { ax: 'z', c: 8, a: -26.4, b: -24.6, y: 0, h: 2.4 }, // north lobby side doors
  { ax: 'x', c: -9.55, a: -1.3, b: 1.3, y: 4.2, h: 2.4 },                                                  // the bridge's north end
  // invisible: you cannot jump off the bridge or over the balcony rails to get round the bridge doors
  { ax: 'z', c: -1.45, a: -10, b: -1.15, y: 4.2, h: 3.6, ghost: true }, { ax: 'z', c: -1.45, a: 1.15, b: 10, y: 4.2, h: 3.6, ghost: true },
  { ax: 'z', c: 1.45, a: -10, b: -1.15, y: 4.2, h: 3.6, ghost: true }, { ax: 'z', c: 1.45, a: 1.15, b: 10, y: 4.2, h: 3.6, ghost: true },
  ...[10.05, -10.05].flatMap(z => [{ ax: 'x', c: z, a: -10, b: -1.6, y: 4.2, h: 3.6, ghost: true }, { ax: 'x', c: z, a: 1.6, b: 10, y: 4.2, h: 3.6, ghost: true }]),
];
// purple arrows on the floor from the start to the gun upgrader
const ZU_PATH = [[4.5, 31], [4.5, 27.5], [4.5, 24], [4.5, 20], [2.5, 16.4], [0.7, 12], [0.7, 9], [0.7, 5], [0.7, 2], [0.7, -1.5], [0.7, -4.5], [0.7, -8], [0.7, -12], [-1.5, -16.5], [-3.2, -20], [-4.6, -23.6], [-5.6, -26.2]];
const ZU_SPOT = { x: -6.9, z: -27, y: 0 };
const ZU_STRIPS = [[-7.82, -24, 0.04, 18], [7.82, -24, 0.04, 18]];   // purple light strips on the upgrader room's walls
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
  if (!perm) {
    const sg = new THREE.MeshBasicMaterial({ map: zdSignTex(d), transparent: true }), w = d.path ? 1.3 : 1.0, hh = w / 2;
    for (const side of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), sg); put(m, 0, Math.min(d.h - 0.45, 1.75), side * 0.2); m.rotation.y = along ? (side > 0 ? 0 : Math.PI) : (side > 0 ? Math.PI / 2 : -Math.PI / 2); }
  }
  scene.add(g); return g;
}
// the board on a door: its price, its name, and an arrow on the doors that lead to the upgrader
function zdSignTex(d) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgba(14,10,8,.92)'; g.fillRect(0, 0, 256, 128); g.strokeStyle = d.path ? '#b06cff' : '#d8b04a'; g.lineWidth = 6; g.strokeRect(4, 4, 248, 120);
  g.textAlign = 'center'; g.fillStyle = '#f2e6c8'; g.font = 'bold 46px sans-serif'; g.fillText(d.cost, 128, 54);
  g.fillStyle = '#c8b890'; g.font = 'bold 15px sans-serif'; g.fillText(d.name.replace(' · ', ' '), 128, 80);
  if (d.path) { g.fillStyle = '#c48aff'; g.font = 'bold 18px sans-serif'; g.fillText('▶ TO THE GUN UPGRADER', 128, 108); } else { g.fillStyle = '#9a8a6a'; g.font = '14px sans-serif'; g.fillText('PRESS USE TO OPEN', 128, 106); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
function zdArrows() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.shadowColor = '#c27bff'; g.shadowBlur = 14; g.fillStyle = '#8f2cff'; g.beginPath(); g.moveTo(64, 10); g.lineTo(116, 70); g.lineTo(84, 70); g.lineTo(84, 118); g.lineTo(44, 118); g.lineTo(44, 70); g.lineTo(12, 70); g.closePath(); g.fill();
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }), grp = new THREE.Group();
  for (let i = 0; i < ZU_PATH.length - 1; i++) {
    const [x0, z0] = ZU_PATH[i], [x1, z1] = ZU_PATH[i + 1], m = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25), mat);
    m.rotation.set(-Math.PI / 2, 0, Math.atan2(-(x1 - x0), -(z1 - z0))); m.position.set(x0, 0.06, z0); grp.add(m);
  }
  grp.userData.mat = mat; scene.add(grp); return grp;
}
function zdAdd(d, perm) {
  const q = zdGeom(d), box = mkBox(q.x, q.z, q.w, q.dp, d.h, { y: d.y, walk: false });
  boxes.push(box);
  if (d.ghost) return { d, box, proxy: null, g: null, perm, open: false };
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(q.w, d.h, q.dp), proxyMat); proxy.position.set(q.x, d.y + d.h / 2, q.z); proxy.visible = false; proxy.userData.ray = true; scene.add(proxy); proxy.updateMatrixWorld(); wallMeshes.push(proxy);
  return { d, box, proxy, g: d.ghost ? null : zdVisual(d, perm), perm, open: false };
}
function zdRemove(o) {
  const i = boxes.indexOf(o.box); if (i >= 0) boxes.splice(i, 1);
  if (o.proxy) { const j = wallMeshes.indexOf(o.proxy); if (j >= 0) wallMeshes.splice(j, 1); scene.remove(o.proxy); }
  if (o.g) scene.remove(o.g);
}
// a new zombies game: every door closed again
function zdInit() {
  zdClear(true);
  if (!zmapIs(curMap)) return;
  zmapUse(curMap);
  ZD.list = ZDOORS.map(d => zdAdd(d, false)).concat(ZWALLS.map(d => zdAdd(d, true)));
  ZD.open.clear(); ZD.mine.clear(); ZD.pts = null;
  ZD.up = zuBuild(); ZD.arrows = zdArrows(); try { zpBuild(); } catch (e) { reportError(e); } try { zsBuild(); } catch (e) { reportError(e); } try { zmapBuildPads(); } catch (e) { reportError(e); } try { zwbBuild(); zpuClear(); } catch (e) { reportError(e); }
  try { zlpStart(); } catch (e) { reportError(e); }
  boxGridDirty = true; buildNav(); SPAWNS = null;
}
function zdClear(keepNav) {
  zuRestore(); try { zpClear(); } catch (e) {} try { zsClear(); } catch (e) {} try { zmapClearPads(); } catch (e) {} try { zlpStop(); } catch (e) {} try { zwbClear(); zpuClear(); } catch (e) {}
  if (ZD.arrows) { scene.remove(ZD.arrows); ZD.arrows = null; }
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
  boxGridDirty = true; buildNav(); Z.navGen = (Z.navGen || 0) + 1;
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
  if (!zmapIs(curMap)) return (ZD.pts = buildSpawns());
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
  let best = null, bd = 2.3;
  for (const o of ZD.list) if (!o.perm && !o.open) { const dd = zdDist(o.d); if (dd < bd) { bd = dd; best = o; } }
  return best;
}
function zdBuy(o) {
  if (G.points < o.d.cost) return;
  G.points -= o.d.cost; zdOpen(o.d.id, true); zvSay('door', 0.5);
  showBanner(o.d.name, 'opened'); try { sfx.ui(); } catch (e) {}
}

/* ---------- the gun upgrader */
function zuBuild() {
  const s = ZU_SPOT, g = new THREE.Group(), body = new THREE.MeshStandardMaterial({ color: 0x16141c, roughness: 0.35, metalness: 0.8 }), trim = new THREE.MeshStandardMaterial({ color: 0x3a3448, roughness: 0.3, metalness: 0.9 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x120420, emissive: new THREE.Color(0xa04cff), emissiveIntensity: 2 });
  const add = (geo, mat, x, y, z, par = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; par.add(m); return m; };
  add(new THREE.BoxGeometry(1.3, 0.3, 1.6), trim, 0, 0.15, 0);                                  // plinth
  add(new THREE.BoxGeometry(1.0, 1.5, 1.3), body, 0, 1.05, 0);                                  // the cabinet
  add(new THREE.BoxGeometry(0.06, 0.16, 1.0), glow, 0.52, 1.15, 0);                              // the slot the gun goes in
  for (const z of [-0.66, 0.66]) { add(new THREE.BoxGeometry(1.04, 1.5, 0.04), trim, 0, 1.05, z); add(new THREE.BoxGeometry(0.05, 1.3, 0.05), glow, 0.52, 1.05, z * 0.9); }
  const core = add(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a0830, emissive: new THREE.Color(0xa04cff), emissiveIntensity: 1.6, transparent: true, opacity: 0.85, side: THREE.DoubleSide }), 0, 2.15, 0);
  add(new THREE.CylinderGeometry(0.34, 0.4, 0.1, 20), trim, 0, 1.82, 0); add(new THREE.CylinderGeometry(0.34, 0.3, 0.1, 20), trim, 0, 2.52, 0);
  const ring = new THREE.Group(); ring.position.set(0, 2.15, 0); g.add(ring);
  for (const r of [0.48, 0.6]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 8, 40), glow); t.rotation.x = Math.PI / 2 + (r - 0.5); ring.add(t); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; add(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), trim, Math.cos(a) * 0.4, 2.3, Math.sin(a) * 0.4).rotation.z = 0.25 * Math.cos(a); }
  // the sign over the slot
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const cg = c.getContext('2d'); cg.fillStyle = '#0c0812'; cg.fillRect(0, 0, 256, 96); cg.strokeStyle = '#b06cff'; cg.lineWidth = 5; cg.strokeRect(4, 4, 248, 88); cg.textAlign = 'center'; cg.fillStyle = '#d8b0ff'; cg.font = 'bold 30px Georgia, serif'; cg.fillText('GUN UPGRADER', 128, 44); cg.fillStyle = '#f2e6c8'; cg.font = 'bold 20px sans-serif'; cg.fillText(ZU_COST + ' POINTS', 128, 74);
  const st = new THREE.CanvasTexture(c); st.encoding = THREE.sRGBEncoding; const sign = add(new THREE.PlaneGeometry(0.95, 0.36), new THREE.MeshBasicMaterial({ map: st }), 0.54, 1.62, 0); sign.rotation.y = Math.PI / 2;
  const beam = add(new THREE.CylinderGeometry(0.35, 0.6, 8, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xa04cff, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }), 0, 6.5, 0); g.userData.beam = beam;
  const lt = new THREE.PointLight(0xa04cff, 1.6, 9, 2); lt.position.set(1.0, 1.8, 0); g.add(lt);
  // purple light strips along the room's walls
  for (const [x, z, w, d] of ZU_STRIPS) add(new THREE.BoxGeometry(w, 0.06, d), glow, x - s.x, 3.4 - s.y, z - s.z);
  g.position.set(s.x, s.y, s.z); scene.add(g);
  const box = mkBox(s.x, s.z, 1.3, 1.6, 2.6, { y: s.y, walk: false }); boxes.push(box);
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.6, 1.6), proxyMat); proxy.position.set(s.x, s.y + 1.3, s.z); proxy.visible = false; proxy.userData.ray = true; scene.add(proxy); proxy.updateMatrixWorld(); wallMeshes.push(proxy);
  return { g, box, proxy, t: 0, ring, core, lt, glow };
}
const zuName = n => n + ' ✦';
function zuBuy() {
  const w = WEAPONS[G.cur]; if (!w || !Z.up) return;
  if (Z.up.has(w.def.id)) { showMsg('THIS GUN IS ALREADY UPGRADED'); return; }
  if (G.points < ZU_COST) return;
  G.points -= ZU_COST; Z.up.add(w.def.id); ZD.up.t = 1.6;
  zombEquip(G.cur); setTimeout(() => zvSay('upgrade'), 1400);
  showBanner(zuName(w.def.name), 'UPGRADED · double damage · bigger magazine'); try { sfx.streak(); tone(220, 0.6, 0.12, 'sawtooth'); tone(330, 0.8, 0.08, 'triangle'); } catch (e) {}
}
// after every re-equip: upgraded guns get their stats and the purple glow (on a copy of the materials, put back later:
// the gun models are shared with every other mode)
function zuRestore() { for (const [m, mat] of ZD.tinted || []) m.material = mat; ZD.tinted = []; }
function zuApply() {
  if (!Z.up || !Z.up.size) return;
  ZD.tinted = ZD.tinted || [];
  WEAPONS.forEach((w, i) => {
    if (!Z.up.has(w.def.id)) return;
    w.dmg *= 2; w.magSize = Math.ceil(w.magSize * 1.5); w.reserveMax = (w.reserveMax || w.def.reserve) * 2; w.ammo = w.magSize; w.reserve = w.reserveMax; w.name = zuName(w.def.name); w.upgraded = true;
    const g = gunObjs[i]; if (!g) return;
    const tint = mt => { const c = mt.clone(); if (c.emissive) { c.emissive = new THREE.Color(0x7a2cff); c.emissiveIntensity = 0.55; } if (c.color) c.color.lerp(new THREE.Color(0x6a3aa8), 0.35); return c; };
    g.traverse(m => { if (!m.isMesh || ZD.tinted.some(t => t[0] === m)) return; ZD.tinted.push([m, m.material]); m.material = Array.isArray(m.material) ? m.material.map(tint) : tint(m.material); });
  });
}
function zuNear() { const s = ZU_SPOT; return ZD.up && Math.hypot(P.x - s.x, P.z - s.z) < 2.4 && Math.abs((P.y || 0) - s.y) < 1.5; }
function zdTick(dt) {
  zdAnim(dt); try { worksTick(dt); zmapTick(dt); zlpTick(dt); zpuTick(dt); } catch (e) { reportError(e); }
  if (ZD.up) { const u = ZD.up, busy = u.t > 0; u.g.userData.beam.material.opacity = 0.08 + Math.sin(NOW * 3) * 0.04; if (busy) u.t -= dt;
    u.ring.rotation.y += dt * (busy ? 9 : 0.8); u.core.material.emissiveIntensity = 1.3 + Math.sin(NOW * 4) * 0.4 + (busy ? 2 : 0); u.lt.intensity = 1.4 + Math.sin(NOW * 4) * 0.3 + (busy ? 2.5 : 0); }
  if (ZD.arrows) ZD.arrows.userData.mat.opacity = 0.85 + Math.sin(NOW * 3) * 0.15;
}
