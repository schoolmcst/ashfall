/* ================================================================== ZOMBIES map: MAUI WOWIE (chapter four of the story)
   Flight 909 never landed. It came down on a little island with a grow plantation on it, at sunset. Built for zombies:
     START   - the CRASH SITE (south): the broken fuselage of Flight 909 on the beach, burning, cliffs either side.
     MIDDLE  - the PLANTATION HOUSE and its courtyard: the hub, a dry fountain in front, doors on every side of the house.
     WEST    - THE FIELDS: long rows of tall plants with lanes between them; a scarecrow and a water tower.
     EAST    - THE SHEDS: an open drying shed, a closed curing shed you can loop through, and the dock on the water.
     NORTH   - THE LIGHTHOUSE (the gun upgrader is inside it), the keeper's garden (the cook spot) and the old LAB.
   COCONUT CANNONS (the launch pads) shoot you between the beach, the fields, the sheds and the lighthouse once the
   radio is working. Only in zombies. Everything is on the ground. */
const ISLE = { flick: [], beam: null, lamp: null, lampL: null, fires: [] };
function isleMaterials() {
  if (!MAT.growLamp) {
    MAT.growLamp = new THREE.MeshBasicMaterial({ color: C(0xd27aff) });
    MAT.leafGreen = new THREE.MeshStandardMaterial({ color: C(0x3f8f2c), roughness: 0.8, side: THREE.DoubleSide, emissive: C(0x0a2208) });
    MAT.budDry = new THREE.MeshStandardMaterial({ color: C(0x7a8a3a), roughness: 0.9 });
    MAT.soil = new THREE.MeshStandardMaterial({ color: C(0x3a2a1a), roughness: 1 });
  }
  if (MAT.isleWhite) return;
  const std = (set, o) => new THREE.MeshStandardMaterial(Object.assign({ map: set.map, bumpMap: set.bump, bumpScale: 0.02, roughness: 0.9, metalness: 0 }, o));
  MAT.isleWhite = std(TEX.concrete, { color: C(0xf0ebe0), roughness: 0.85 });
  MAT.isleRed = std(TEX.concrete, { color: C(0xb8382a), roughness: 0.8 });
  MAT.isleTeal = std(TEX.wood, { color: C(0x4a9a94), roughness: 0.85 });
  MAT.isleCliff = new THREE.MeshStandardMaterial({ color: C(0x6e5e4c), roughness: 1, flatShading: true, map: TEX.concrete.map, bumpMap: TEX.concrete.bump, bumpScale: 0.05 });
  MAT.thatch = new THREE.MeshStandardMaterial({ color: C(0xb59a5a), roughness: 1, map: TEX.wood.map });
  MAT.sea = new THREE.MeshStandardMaterial({ color: C(0x1a5a74), roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.92 });
  MAT.purpleLeaf = new THREE.MeshStandardMaterial({ color: C(0x5a2a7a), roughness: 0.7, side: THREE.DoubleSide, emissive: C(0x3a0a6a), emissiveIntensity: 0.8 });
  MAT.fireGlow = new THREE.MeshBasicMaterial({ color: C(0xff8a2a) });
  MAT.lighthouseLamp = new THREE.MeshStandardMaterial({ color: C(0x302a10), emissive: C(0xffe8a0), emissiveIntensity: 0.15 });
  const cv = (n, draw) => { const c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n); return c; };
  const sign = (txt, col, sub) => { const c = cv(256, g => { g.fillStyle = '#2a1c10'; g.fillRect(0, 0, 256, 256); g.strokeStyle = col; g.lineWidth = 8; g.strokeRect(10, 10, 236, 236); g.fillStyle = col; g.font = 'bold 34px serif'; g.textAlign = 'center'; g.fillText(txt, 128, 120); if (sub) { g.font = 'italic 20px serif'; g.fillText(sub, 128, 160); } }); return new THREE.MeshStandardMaterial({ map: toTex(c, true, 1), roughness: 0.9 }); };
  MAT.signHouse = sign('MAUI WOWIE', '#e8d08a', 'plantation · est. 1971');
  MAT.signFields = sign('THE FIELDS', '#8adf6a', 'no picking');
  MAT.signSheds = sign('CURING SHED', '#e8a06a', 'keep door shut');
  MAT.signLab = sign('LAB', '#c8a0ff', 'authorised staff');
  TILES.isleWhite = 3; TILES.isleRed = 3; TILES.isleCliff = 4; TILES.thatch = 2;
}
// a weed plant (decoration only): a stem and three tiers of fan leaves
function islePlant(x, z, y = 0, s = 1, key = 'leafGreen') {
  CYL(key, 0.02 * s, 0.035 * s, 1.2 * s, 5, x, y + 0.6 * s, z, 0, 0, 0, false);
  for (let t = 0; t < 3; t++) for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + t * 0.6 + x, r = (0.42 - t * 0.09) * s; beam(key, x, y + (0.45 + t * 0.3) * s, z, x + Math.cos(a) * r, y + (0.6 + t * 0.3) * s, z + Math.sin(a) * r, 0.18 * s, 0.01, false); }
  batchAdd(key, new THREE.ConeGeometry(0.12 * s, 0.42 * s, 6), mat4(x, y + 1.4 * s, z), false);
}
// a field row: a raised bed of plants (blocks walking, low enough to shoot over the soil, the plants hide you)
function isleRow(x0, x1, z) {
  const xc = (x0 + x1) / 2, L = x1 - x0;
  blk(xc, z, L, 1.0, 0.35, 'soil'); PZ(xc, 0, z, L, 1.5, 1.0);
  for (let x = x0 + 0.5; x < x1 - 0.3; x += 0.85) islePlant(x + ((x * 13) % 0.3), z + ((x * 7) % 2 ? 0.2 : -0.2), 0.35, 1.35 + ((x * 3) % 1) * 0.4);
}
function islePalm(x, z, h = 7, lean = 0.12) { palm(x, z, h, lean); }
function isleRock(x, z, s = 1.6, h = 1.2) { batchAdd('isleCliff', new THREE.DodecahedronGeometry(s, 0), mat4(x, h * 0.4, z, x, z, 0, 1, h / s, 1)); PZ(x, 0, z, s * 1.4, h, s * 1.4); }
function isleFire(x, z, y = 0, i = 1.6) {
  for (let k = 0; k < 3; k++) batchAdd('fireGlow', new THREE.ConeGeometry(0.28 - k * 0.06, 0.8 + k * 0.25, 6), mat4(x + (k - 1) * 0.25, y + 0.4 + k * 0.1, z + (k % 2) * 0.2), false);
  const l = lampLight(x, y + 1.2, z, 0xff7a2a, i, 11); ISLE.flick.push({ l, i, t: rnd(0, 1), on: true, fire: true }); return l;
}
function isleLamp(x, z, h = 3.2, col = 0xffc070, i = 1.0, dist = 13, flick = false) {
  CYL('wood', 0.07, 0.09, h, 6, x, h / 2, z); B('fireGlow', 0.25, 0.32, 0.25, x, h + 0.1, z, 0, 0, 0, false); B('dark', 0.34, 0.06, 0.34, x, h + 0.3, z, 0, 0, 0, false);
  const l = lampLight(x, h, z, col, i, dist); if (flick) ISLE.flick.push({ l, i, t: rnd(0, 3), on: true }); PZ(x, 0, z, 0.3, h, 0.3); return l;
}
function isleCrate(x, z, y = 0, k = 0) { B(k % 2 ? 'wood' : 'thatch', 0.9, 0.9, 0.9, x, y + 0.45, z, 0, k * 0.4, 0); PZ(x, y, z, 1.0, 0.9, 1.0); }
function isleSuitcase(x, z, k = 0) { const cols = ['paintRed', 'paintBlue', 'dark', 'paintYellow', 'paintGreen']; B(cols[k % 5], 0.62, 0.22, 0.45, x, 0.11, z, 0, k * 0.9, 0); }
function isleHangRack(x, z, L, y = 2.6) {   // a line of drying buds hanging from a wire
  B('steel', 0.04, 0.04, L, x, y, z, 0, 0, 0, false);
  for (let k = 0; k < L / 0.45; k++) { const zz = z - L / 2 + 0.2 + k * 0.45; B('budDry', 0.12, 0.5, 0.12, x, y - 0.3, zz, 0, k, 0, false); B('leafGreen', 0.2, 0.04, 0.2, x, y - 0.52, zz, 0, k, 0, false); }
}
// the broken fuselage of Flight 909 (reuses the airport's plane paint)
function isleWreck() {
  const fx = 9, fz = 36.6;
  CYL('planeWhite', 1.7, 1.7, 9.5, 18, fx, 1.5, fz, 0, 0, Math.PI / 2 + 0.06);
  CYL('planeStripe', 1.72, 1.72, 0.6, 18, fx - 2, 1.5, fz, 0, 0, Math.PI / 2 + 0.06, false);
  CYL('dark', 1.6, 1.6, 0.1, 18, fx - 4.75, 1.3, fz, 0, 0, Math.PI / 2, false);   // the torn open end (dark inside)
  for (let i = 0; i < 5; i++) B('planeGrey', 0.4, 0.3, 0.05, fx - 3 + i * 1.6, 2.2, fz - 1.68, 0, 0, 0, false);   // windows
  blk(fx, fz, 9.6, 3.2, 3.0, 'planeWhite', { noDraw: true });
  B('planeWhite', 6.5, 0.25, 2.4, -6, 0.4, 37, 0.1, 0.5, 0.08); PZ(-6, 0, 37, 5.4, 0.8, 3.6);                       // a wing in the sand
  B('planeGrey', 1.2, 1.2, 2.2, -4, 0.6, 36.2, 0, 0.5, 0.3); PZ(-4, 0, 36.2, 1.6, 1.2, 2.2);                        // its engine
  B('planeWhite', 0.25, 3.6, 3.0, -11, 1.4, 31, 0.4, 0.3, 0.2); B('planeStripe', 0.27, 0.8, 3.0, -11, 2.6, 31, 0.4, 0.3, 0.2, false); PZ(-11, 0, 31, 1.4, 2.5, 3);   // the tail fin
  isleFire(4.8, 36.5, 0, 1.8); isleFire(-4.6, 37.6, 0.6, 1.2); isleFire(12, 33.8, 0, 1.2);
  for (let i = 0; i < 9; i++) isleSuitcase(-7 + (i * 3.1) % 15, 27.5 + (i * 2.3) % 6, i);
}
function buildIsland() {
  buildMap2Materials(); worksMaterials(); airpMaterials(); isleMaterials();
  ISLE.flick = []; ISLE.fires = []; ISLE.on = false; ISLE.beam = null; ISLE.lamp = null; ISLE.lampL = null;
  floorQuad(0, 0, 88, 84, 0, 'ground', 6);
  floorQuad(0, 32, 28, 17, 0.01, 'sand', 4);                                 // the beach
  floorQuad(0, 7, 28, 34, 0.012, 'cobble', 4);                                // the courtyard
  floorQuad(0, 2, 14, 12, 0.02, 'wood', 3);                                   // the house floor
  floorQuad(-28, 7, 28, 34, 0.014, 'soil', 5);                                // the fields
  floorQuad(38, 7, 8, 34, 0.02, 'wood', 3);                                   // the dock boards
  floorQuad(0, -31, 8, 8, 0.02, 'stone', 2); floorQuad(-32, -30, 12, 12, 0.02, 'concrete', 3);
  floorQuad(0, 62, 260, 40, -0.35, 'sea', 8); floorQuad(70, 0, 50, 200, -0.35, 'sea', 8); floorQuad(-70, 0, 50, 200, -0.35, 'sea', 8); floorQuad(0, -70, 260, 50, -0.35, 'sea', 8);
  floorQuad(0, 44, 100, 8, -0.15, 'sand', 4);
  // ---- outside: solid all round, cliffs south of the fields and the sheds
  for (const [x, z, w, d] of [[0, -42.1, 92, 3.7], [0, 42.1, 92, 3.7], [-43.4, 0, 2.3, 92], [43.4, 0, 2.3, 92]]) blk(x, z, w, d, 9, 'dark', { noDraw: true });
  for (const s of [-1, 1]) {
    blk(s * 28, 32.5, 28, 17, 7, 'isleCliff');
    for (let i = 0; i < 7; i++) batchAdd('isleCliff', new THREE.DodecahedronGeometry(2.6 + (i % 3) * 0.7, 0), mat4(s * (16 + i * 3.8), 7 + (i % 2), 26 + (i % 3) * 3, i, i * 2, 0), false);
    for (let i = 0; i < 4; i++) islePalm(s * (19 + i * 6), 30 + (i % 2) * 4, 6 + i % 2, 0, 0.1);
  }
  for (let i = 0; i < 18; i++) batchAdd('isleCliff', new THREE.DodecahedronGeometry(3 + (i % 3), 0), mat4(-44 + i * 5.2, 4, -45 - (i % 2) * 2, i, i, 0), false);   // the north cliffs
  for (let i = 0; i < 4; i++) { islePalm(-17 + i * 0.6, 39 - i * 0.3, 7 + i * 0.4, 0.25); islePalm(17 - i * 0.6, 39.5 - i * 0.4, 7 - i * 0.3, -0.2); }
  // ---- outer walls: the plantation's stone wall (with boarded windows) and the cliff wall in the north
  const win = [[16, 1.6, 1.0, 1.4], [-4, 1.6, 1.0, 1.4]];
  wkZ(-42, -40, 24, 4.6, 'stone', win); wkZ(42, -40, 24, 4.6, 'stone', win);
  wkX(-40, -42, 42, 6, 'isleCliff');
  // ---- inner walls
  wkX(24, -14, 14, 4.6, 'stone', [[0, 6, 0, 4]]);                                        // beach -> courtyard (the garden gate)
  wkZ(-14, -10, 24, 4.6, 'stone', [[15, 6, 0, 4]]); wkZ(14, -10, 24, 4.6, 'stone', [[15, 6, 0, 4]]);   // the courtyard's side gates
  wkX(-10, -42, 42, 4.6, 'stone', [[0, 6, 0, 4], [-28, 4, 0, 4], [28, 4, 0, 4]]);       // the north wall: three ways up
  for (const [x, z] of [[-14, 24], [14, 24], [-14, -10], [14, -10], [-3, 24], [3, 24], [-3, -10], [3, -10]]) { B('isleWhite', 0.8, 5.0, 0.8, x, 2.5, z); B('isleRed', 1.0, 0.25, 1.0, x, 5.1, z, 0, 0, 0, false); }

  // ================= CRASH SITE (start)
  isleWreck();
  for (const [x, z] of [[-9, 26.5], [9, 27], [-12.5, 38.5]]) isleRock(x, z, 1.2, 1.0);
  isleLamp(-6, 25.4, 3.0, 0xffc070, 0.8, 12, true); isleLamp(6, 25.4, 3.0, 0xffc070, 0.8, 12);
  batchAdd('signHouse', new THREE.PlaneGeometry(2.4, 2.4), mat4(0, 5.2, 24.27, 0, 0, 0), false);

  // ================= THE PLANTATION HOUSE (the hub)
  const HH = 4.2;
  wkX(8, -7, 7, HH, 'isleWhite', [[0, 2.8, 0, 3], [-4.5, 1.6, 1.0, 1.4], [4.5, 1.6, 1.0, 1.4]]);
  wkX(-4, -7, 7, HH, 'isleWhite', [[0, 2.8, 0, 3], [-4.5, 1.6, 1.0, 1.4], [4.5, 1.6, 1.0, 1.4]]);
  wkZ(-7, -4, 8, HH, 'isleWhite', [[5, 2.4, 0, 3], [-1.5, 1.4, 1.0, 1.4]]); wkZ(7, -4, 8, HH, 'isleWhite', [[2, 2.4, 0, 3], [6, 1.4, 1.0, 1.4]]);
  wkRoof(-7.6, 7.6, -4.6, 8.6, HH + 0.35, 'isleRed');
  for (const s of [-1, 1]) batchAdd('isleRed', new THREE.BoxGeometry(15.4, 0.2, 7.4), mat4(0, HH + 1.3, 2 + s * 3.2, s * 0.32, 0, 0), false);
  // the veranda along the front
  B('wood', 15, 0.2, 2.4, 0, 3.4, 9.4, 0.08, 0, 0, false);
  for (const x of [-7, -3.5, 3.5, 7]) { B('isleWhite', 0.2, 3.4, 0.2, x, 1.7, 10.5); PZ(x, 0, 10.5, 0.3, 3.4, 0.3); }
  // inside: the radio table, a long table, the boss's chair, bookcases
  blk(0, 2, 4, 1.4, 0.8, 'wood'); for (const x of [-1.4, 0, 1.4]) B('cloth1', 0.3, 0.02, 0.4, x, 0.82, 2, 0, x, 0, false);
  B('isleTeal', 0.7, 1.2, 0.7, 0, 0.6, 4, 0, 0.3, 0); PZ(0, 0, 4, 0.8, 1.2, 0.8);
  for (const x of [-5, 5]) { blk(x, -3.5, 2.4, 0.5, 2.4, 'wood'); for (let r = 0; r < 4; r++) B(r % 2 ? 'paintRed' : 'paintGreen', 2.2, 0.36, 0.3, x, 0.4 + r * 0.55, -3.3, 0, 0, 0, false); }
  B('wood', 1.0, 0.8, 0.6, -6.4, 0.4, -1.2); PZ(-6.4, 0, -1.2, 1.0, 0.8, 0.6);
  lampLight(0, 3.6, 2, 0xffd8a0, 0.9, 11); B('fireGlow', 0.3, 0.2, 0.3, 0, 3.8, 2, 0, 0, 0, false);
  // the dry fountain in the courtyard (loop round it)
  CYL('stone', 1.9, 2.1, 0.7, 16, 0, 0.35, 16); CYL('stone', 0.3, 0.4, 1.6, 10, 0, 1.1, 16); CYL('stone', 0.8, 0.5, 0.2, 12, 0, 1.9, 16); PZ(0, 0, 16, 3.6, 0.8, 3.6);
  for (const [x, z] of [[-10, 18], [10, 18], [-10, -7], [10, -7]]) islePalm(x, z, 6.5, 0.1);
  for (const [x, z] of [[-11, 4], [11, 0], [-6, 21], [6, 13]]) isleCrate(x, z, 0, x > 0 ? 1 : 0);
  for (const [x, z] of [[-9, 12], [9, 12], [-9, -2], [9, 6]]) isleLamp(x, z, 3.2, 0xffc070, 0.9, 13, x > 0 && z < 8);

  // ================= THE FIELDS
  for (const z of [19.5, 13, 6.5, 0, -6]) { isleRow(-39.5, -29.5, z); isleRow(-26, -17.5, z); }
  // the scarecrow
  CYL('wood', 0.06, 0.06, 2.6, 6, -27.5, 1.3, 9.75); B('wood', 1.6, 0.08, 0.08, -27.5, 2.1, 9.75); B('cloth1', 0.6, 0.7, 0.3, -27.5, 1.8, 9.75); batchAdd('thatch', new THREE.ConeGeometry(0.5, 0.4, 8), mat4(-27.5, 2.75, 9.75), false); PZ(-27.5, 0, 9.75, 0.4, 2.6, 0.4);
  // the water tower
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { CYL('wood', 0.1, 0.12, 5, 6, -38 + dx, 2.5, 22.5 + dz); }
  PZ(-38, 0, 22.5, 2.4, 5, 2.4); CYL('wood', 1.5, 1.5, 2.2, 14, -38, 6.1, 22.5); batchAdd('thatch', new THREE.ConeGeometry(1.7, 0.9, 14), mat4(-38, 7.65, 22.5), false);
  batchAdd('signFields', new THREE.PlaneGeometry(2.0, 2.0), mat4(-14.27, 3.4, 20, 0, -Math.PI / 2, 0), false);
  for (const [x, z] of [[-33, 22.5], [-20, 22.5], [-33, -8.5], [-20, -8.5], [-27.5, 16]]) isleLamp(x, z, 3.0, 0xffb060, 0.9, 13, x === -20 && z < 0);

  // ================= THE SHEDS and THE DOCK
  // the open drying shed (posts and a thatch roof, buds hanging on wires)
  for (const x of [18, 24, 30]) for (const z of [12, 22]) { CYL('wood', 0.12, 0.14, 3.6, 6, x, 1.8, z); PZ(x, 0, z, 0.35, 3.6, 0.35); }
  B('thatch', 13.4, 0.25, 11.4, 24, 3.75, 17, 0, 0, 0.0);
  for (const x of [19.5, 22.5, 25.5, 28.5]) isleHangRack(x, 17, 9);
  blk(24, 17, 4, 1.2, 0.85, 'wood'); for (let i = 0; i < 6; i++) B('budDry', 0.3, 0.12, 0.3, 22.6 + i * 0.55, 0.92, 17, 0, i, 0, false);
  // the closed curing shed (loop through it: doors west and east)
  wkX(4, 18, 30, 4, 'isleTeal', [[24, 1.6, 1.0, 1.2]]); wkX(-6, 18, 30, 4, 'isleTeal', [[21, 1.6, 1.0, 1.2], [27, 1.6, 1.0, 1.2]]);
  wkZ(18, -6, 4, 4, 'isleTeal', [[-1, 2.6, 0, 3]]); wkZ(30, -6, 4, 4, 'isleTeal', [[-1, 2.6, 0, 3]]);
  wkRoof(17.6, 30.4, -6.4, 4.4, 4.35, 'isleRed');
  for (const x of [21, 24, 27]) isleHangRack(x, -1, 8.6, 3.2);
  for (let i = 0; i < 3; i++) wkPallet(19.6, -4.4 + i * 1.3, 0, 1 + i % 2);
  lampLight(24, 3.4, -1, 0xd27aff, 0.9, 10); B('growLamp', 8, 0.06, 0.1, 24, 3.6, -1, 0, 0, 0, false);
  batchAdd('signSheds', new THREE.PlaneGeometry(1.6, 1.6), mat4(17.73, 3.2, 1.6, 0, -Math.PI / 2, 0), false);
  // the dock: boards, posts, crates, a boat tied up
  for (let z = -9; z <= 23; z += 4) { CYL('wood', 0.14, 0.14, 1.4, 6, 34, 0.2, z, 0, 0, 0, false); }
  for (const [x, z, k] of [[37, 21, 0], [38.2, 21, 1], [37.6, 21.1, 2], [36, 10, 1], [37, -8, 0], [38.1, -7.6, 1]]) isleCrate(x, z, k === 2 ? 0.9 : 0, k);
  { const p = P2(38.5, 2.5, 0, 0); p.b('isleWhite', 2.2, 1.0, 5.6, 0, 0.5, 0); p.b('isleTeal', 2.3, 0.2, 5.7, 0, 0.95, 0, false); p.b('wood', 1.6, 0.1, 1.2, 0, 1.0, -1, false); p.b('dark', 0.5, 0.7, 0.5, 0, 1.2, 2.4, false); p.col(2.3, 1.1, 5.7); }
  for (const [x, z] of [[20, 7], [32, 7], [33, -9], [32, 24], [20, 24.6]]) isleLamp(x, z, 3.2, 0xffc070, 0.9, 13, x === 33);
  for (const [x, z] of [[39, 14], [39, -2]]) islePalm(x + 1.6, z, 7, -0.2);

  // ================= THE NORTH: lighthouse, garden, lab
  // the lighthouse base (8 x 8, door south) and the tower over it
  wkX(-27, -4, 4, 4.6, 'isleWhite', [[0, 2.6, 0, 3]]); wkX(-35, -4, 4, 4.6, 'isleWhite'); wkZ(-4, -35, -27, 4.6, 'isleWhite'); wkZ(4, -35, -27, 4.6, 'isleWhite');
  wkRoof(-4.3, 4.3, -35.3, -26.7, 4.95, 'isleRed');
  for (let k = 0; k < 5; k++) CYL(k % 2 ? 'isleRed' : 'isleWhite', 3.2 - k * 0.3, 3.5 - k * 0.3, 3, 20, 0, 6.5 + k * 3, -31, 0, 0, 0, k === 0);
  B('dark', 4.4, 0.25, 4.4, 0, 21.1, -31, 0, 0, 0, false);
  ISLE.lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.8, 14), MAT.lighthouseLamp.clone()); ISLE.lamp.position.set(0, 22.2, -31); scene.add(ISLE.lamp);
  batchAdd('isleRed', new THREE.ConeGeometry(1.8, 1.4, 14), mat4(0, 23.8, -31), false);
  ISLE.beam = new THREE.Mesh(new THREE.ConeGeometry(2.4, 26, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  ISLE.beam.geometry.translate(0, -13, 0); ISLE.beam.rotation.z = Math.PI / 2; const piv = new THREE.Group(); piv.position.set(0, 22.2, -31); piv.add(ISLE.beam); scene.add(piv); ISLE.piv = piv;
  ISLE.lampL = lampLight(0, 3.6, -31, 0xffd8a0, 0.5, 9);
  for (let i = 0; i < 6; i++) B('wood', 0.9, 0.12, 0.3, 3.2, 0.15 + i * 0.6, -34 + i * 0.4, 0, 0, 0, false);   // the spiral stair (closed off)
  // the keeper's garden: a picket fence, a few plants, the potting bench (the cook spot)
  for (const z of [-17, -24]) for (let x = 6; x <= 16; x += 0.5) B('isleWhite', 0.08, 0.9, 0.08, x, 0.45, z, 0, 0, 0, false);
  for (const z of [-19, -22]) for (let x = 7; x < 15.5; x += 1.6) islePlant(x, z, 0, 0.8, (x | 0) % 3 ? 'leafGreen' : 'purpleLeaf');
  isleLamp(6.2, -17, 3.0, 0x9aff8a, 0.9, 12); isleLamp(15.8, -24, 3.0, 0x9aff8a, 0.9, 12, true);
  // the lab (north-west): concrete box with a door, a vault and benches
  wkX(-24, -38, -26, 4.2, 'concrete', [[-32, 2.6, 0, 3]]); wkZ(-26, -36, -24, 4.2, 'concrete', [[-30, 1.6, 1.0, 1.2]]); wkZ(-38, -36, -24, 4.2, 'concrete');
  wkRoof(-38.3, -25.7, -36.3, -23.7, 4.55, 'termDark');
  blk(-35.5, -30, 1.0, 4.0, 0.95, 'steel'); blk(-28.5, -32, 1.0, 3.0, 0.95, 'steel');
  for (let i = 0; i < 5; i++) B(['paintGreen', 'paintBlue', 'paintYellow'][i % 3], 0.1, 0.25, 0.1, -35.5, 1.07, -31.6 + i * 0.7, 0, 0, 0, false);
  B('termDark', 2.6, 2.8, 0.4, -32, 1.4, -35.6); B('steel', 1.2, 1.2, 0.08, -32, 1.4, -35.38, 0, 0, 0, false); CYL('steel', 0.3, 0.3, 0.1, 12, -32, 1.4, -35.32, Math.PI / 2, 0, 0, false);   // the seed vault door
  lampLight(-32, 3.6, -30, 0xc8e8ff, 0.9, 11); B('floodLight', 3, 0.06, 0.3, -32, 4.1, -30, 0, 0, 0, false);
  batchAdd('signLab', new THREE.PlaneGeometry(1.4, 1.4), mat4(-29, 3.3, -23.73, 0, 0, 0), false);
  // generator and radio mast (north-east), rocks and palms to break the yard up
  blk(32, -30, 3, 2, 1.6, 'paintGreen'); CYL('steel', 0.08, 0.12, 12, 6, 36, 6, -34); for (let k = 1; k < 6; k++) B('steel', 1.4 - k * 0.2, 0.05, 0.05, 36, k * 2, -34, 0, 0, 0, false); PZ(36, 0, -34, 0.5, 12, 0.5);
  B('redLight2', 0.25, 0.25, 0.25, 36, 12.1, -34, 0, 0, 0, false);
  for (const [x, z, s] of [[-14, -20, 1.6], [18, -32, 1.8], [-20, -34, 1.4], [26, -20, 1.2], [-8, -36, 1.2]]) isleRock(x, z, s, 1.3);
  for (const [x, z] of [[-16, -28], [-10, -16], [12, -36], [24, -27], [-40, -14], [40, -16], [8, -12.5], [-22, -14]]) islePalm(x, z, 7 + (x % 3), 0.15 * Math.sign(x));
  for (const [x, z] of [[-6, -18], [6, -28], [-20, -24], [22, -14], [30, -38], [-40, -38]]) isleLamp(x, z, 3.2, 0xffc070, 0.9, 13, x === 22);
  for (const [x, z] of [[-17, -12.5], [17, -38], [-26, -38]]) isleCrate(x, z, 0, x > 0 ? 1 : 0);
}
defineMap({
  id: 'mauiwowie', size: 'large', hidden: true, zombiesOnly: true, planCut: 3.4, name: 'MAUI WOWIE', place: 'Island grow plantation, sunset', desc: 'Flight 909 came down on a grow island. A plantation house, fields of tall plants, curing sheds, a dock - and a lighthouse at the top of the hill.',
  play: [-42, 42, -40, 40], build: buildIsland,
  env: { top: 0x2a2a6a, horizon: 0xff9a5a, fog: 0.0075, sun: [-40, 14, -30], sunCol: 0xffa060, sunI: 1.1, skySun: 0xffc080, hemiSky: 0x9a8ab8, hemiGround: 0x4a3a2a, exposure: 1.25 },
  grass: { count: 2600, color: 0xb8d090, avoid: (x, z) => z > 23.5 || (Math.abs(x) < 14.5 && z > -10.5) || (x < -14 && z > -10.5 && z < 23.5) || (x > 33 && z > -10.5) || (Math.abs(x) < 4.6 && z < -26.4) || (x < -25.5 && x > -38.5 && z > -36.5 && z < -23.5) || (x > 17.5 && x < 30.5 && z > -6.5 && z < 4.5) },
  spawnMaxY: 0.5,
  layout: { spawn: [{ x: 0, z: 31 }, { x: 0, z: -18 }], hp: [{ x: 0, z: 14 }, { x: 7, z: 14 }, { x: -6, z: 31 }], flags: [{ x: 0, z: 31 }, { x: 0, z: -18 }], sites: [{ x: -27.5, z: 3 }, { x: 24, z: 9 }] },
  menu: { x: 0, z: 16, r: 9, y: 2.4 },
  navPts: [{ x: 0, z: 31 }, { x: 0, z: 14 }, { x: 0, z: 2 }, { x: -27.5, z: 10 }, { x: -40, z: 3 }, { x: 24, z: 9 }, { x: 24, z: -1 }, { x: 38, z: 8 }, { x: 0, z: -20 }, { x: 0, z: -31 }, { x: -32, z: -30 }, { x: 11, z: -20.5 }, { x: 34, z: -24 }],
  views: [[0, 1.7, 33, 3, 2, 20], [-5, 1.7, 22, 0, 2.5, 6], [-2, 1.7, 6, -6, 1.5, 0], [-15, 1.7, 15, -32, 1.5, 6], [15, 1.7, 15, 30, 2, 8], [0, 1.7, -14, 0, 10, -31], [1.5, 1.7, -29, -3, 1.5, -31], [12, 1.7, -14, 11, 1, -20], [-28, 1.7, -14, -32, 2, -26], [6, 1.7, -6, -20, 2, 10]],
});
function isleTick(dt) {
  if (curMap !== 'mauiwowie') return;
  for (const f of ISLE.flick) {
    if (f.fire) { f.l.intensity = f.i * (0.75 + Math.random() * 0.4); continue; }
    if (f.steady) continue; f.t -= dt; if (f.t <= 0) { f.on = !f.on; f.t = f.on ? rnd(0.4, 5) : rnd(0.03, 0.2); f.l.intensity = f.on ? f.i : f.i * 0.1; }
  }
  if (ISLE.piv) ISLE.piv.rotation.y += dt * (ISLE.on ? 0.9 : 0);
}
function islePower() {
  ISLE.on = true; for (const f of ISLE.flick) if (!f.fire) { f.steady = true; f.l.intensity = f.i * 1.15; }
  if (ISLE.beam) ISLE.beam.material.opacity = 0.16; if (ISLE.lamp) ISLE.lamp.material.emissiveIntensity = 2.6; if (ISLE.lampL) ISLE.lampL.intensity = 1.2;
}
