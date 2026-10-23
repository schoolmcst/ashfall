/* ================================================================== ZOMBIES map: THE WORKS (chapter two of the story)
   The old Lazarus Pharmaceutical Works, a soot-black Victorian factory from 1891 with a gothic chapel, at night.
   Harold's truck from the hospital story is parked in the loading dock. Built for round-based zombies:
     START   - the LOADING DOCK (south, outdoors): Harold's truck, a fire barrel, the gate chained shut.
     MIDDLE  - the BOTTLING HALL: the hub. A copper mixing vat in the middle, four bottling lines, a door each way.
     WEST    - the CHAPEL CLOISTER: a covered arcade around an open garden (a big loop to train zombies), the
               GRAVEYARD to the south and the gothic CHAPEL to the north (pews, altar, stained glass).
     EAST    - the FOUNDRY YARD: an open yard around the furnace and its smokestack (the second loop), the RAIL
               SIDING to the south and the NIGHTSHADE WAREHOUSE to the north (racks to loop round).
     NORTH   - the BOILER HOUSE: two huge boilers and the gun upgrader, reached from the hall, the chapel or the
               warehouse (three paid doors), so the map is one big ring with the hall in the middle: no dead ends.
   Four LAUNCH PADS (dock, garden, foundry, boiler house) fire you across the map once the power is on.
   Only in zombies (hidden from the multiplayer lists). Single floor; roofs are drawn but do not collide. */
const WORKS = { flick: [], fx: [], pads: [] };
function worksMaterials() {
  if (MAT.soot) return;
  const std = (set, o) => new THREE.MeshStandardMaterial(Object.assign({ map: set.map, bumpMap: set.bump, bumpScale: 0.02, roughness: 0.95, metalness: 0 }, o));
  const cv = (n, draw) => { const c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n); return c; };
  const r = makeRng(1891);
  MAT.soot = std(TEX.brick, { color: C(0x7a5444), roughness: 0.95, bumpScale: 0.03 });
  MAT.sootDark = std(TEX.brick, { color: C(0x3e2c26), roughness: 1, bumpScale: 0.03 });
  MAT.gothStone = std(TEX.brick, { color: C(0xb2ada2), roughness: 0.95, bumpScale: 0.03 });
  MAT.gothDark = std(TEX.brick, { color: C(0x6a655c), roughness: 0.95, bumpScale: 0.03 });
  MAT.foundryFloor = std(TEX.concrete, { color: C(0x6a645c), roughness: 0.9 });
  MAT.copper = new THREE.MeshStandardMaterial({ color: C(0xb8703e), roughness: 0.32, metalness: 0.85 });
  MAT.copperOld = new THREE.MeshStandardMaterial({ color: C(0x5e8a72), roughness: 0.6, metalness: 0.5 });
  MAT.rustIron = std(TEX.metal, { color: C(0x7a4228), roughness: 0.75, metalness: 0.5, bumpScale: 0.01 });
  MAT.ironBlack = new THREE.MeshStandardMaterial({ color: C(0x1c1c1e), roughness: 0.55, metalness: 0.7 });
  MAT.pew = std(TEX.wood, { color: C(0x5a3420), roughness: 0.7 });
  MAT.furnaceGlow = new THREE.MeshStandardMaterial({ color: C(0x200800), emissive: C(0xff6a1a), emissiveIntensity: 2.4 });
  MAT.sodium = new THREE.MeshStandardMaterial({ color: C(0x221400), emissive: C(0xffa440), emissiveIntensity: 2.0 });
  MAT.chemGlow = new THREE.MeshStandardMaterial({ color: C(0x02200a), emissive: C(0x3aff5a), emissiveIntensity: 1.6 });
  MAT.candle = new THREE.MeshStandardMaterial({ color: C(0xfff0d0), emissive: C(0xffc070), emissiveIntensity: 1.2 });
  MAT.nightshade = new THREE.MeshStandardMaterial({ color: C(0x3e1660), emissive: C(0x2a0848), emissiveIntensity: 0.55, roughness: 0.6 });
  MAT.graveMud = std(TEX.concrete, { color: C(0x3e3a2a), roughness: 1, bumpScale: 0.04 });
  MAT.deadGrass = std(TEX.concrete, { color: C(0x4e4a30), roughness: 1, bumpScale: 0.04 });
  // cobbles
  const cob = cv(256, (g, n) => { g.fillStyle = '#2e2b28'; g.fillRect(0, 0, n, n); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const ox = (y % 2) * 16, v = 70 + r() * 40 | 0; g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.beginPath(); g.ellipse(x * 32 + ox + 16, y * 32 + 16, 13 + r() * 2, 12 + r() * 2, r(), 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.ellipse(x * 32 + ox + 13, y * 32 + 12, 6, 4, 0, 0, TAU); g.fill(); } for (let q = 0; q < 30; q++) { g.fillStyle = `rgba(20,16,10,${0.15 + r() * 0.25})`; g.beginPath(); g.arc(r() * n, r() * n, 10 + r() * 30, 0, TAU); g.fill(); } });
  MAT.cobble = new THREE.MeshStandardMaterial({ map: toTex(cob, true, 1), roughness: 0.75 });
  // a factory sign
  const sign = cv(512, (g, n) => { g.fillStyle = '#16100c'; g.fillRect(0, 0, n, n); g.strokeStyle = '#b8903a'; g.lineWidth = 10; g.strokeRect(14, 150, n - 28, 212); g.textAlign = 'center'; g.fillStyle = '#d8b060'; g.font = 'bold 54px Georgia, serif'; g.fillText('LAZARUS', n / 2, 225); g.font = 'bold 34px Georgia, serif'; g.fillText('PHARMACEUTICAL WORKS', n / 2, 282); g.font = 'italic 26px Georgia, serif'; g.fillStyle = '#a88a50'; g.fillText('est. 1891  ·  "we end all pain"', n / 2, 332); });
  MAT.worksSign = new THREE.MeshStandardMaterial({ map: toTex(sign, true, 1), emissive: C(0xffffff), emissiveMap: toTex(sign, true, 1), emissiveIntensity: 0.35, roughness: 0.8 });
  // stained glass: a pointed window of coloured panes (glows from inside)
  const glass = cv(256, (g, n) => {
    g.clearRect(0, 0, n, n); const path = () => { g.beginPath(); g.moveTo(40, n); g.lineTo(40, 110); g.quadraticCurveTo(48, 30, 128, 6); g.quadraticCurveTo(208, 30, 216, 110); g.lineTo(216, n); g.closePath(); };
    path(); g.save(); g.clip();
    const cols = ['#7a1a2a', '#1a3a8a', '#a87a1a', '#2a6a3a', '#5a2a7a', '#a83a1a'];
    for (let y = 0; y < n; y += 22) for (let x = 40; x < 216; x += 22) { g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(x, y, 22, 22); }
    g.fillStyle = 'rgba(255,230,160,0.55)'; g.beginPath(); g.arc(128, 96, 34, 0, TAU); g.fill();
    g.strokeStyle = '#140c08'; g.lineWidth = 4; for (let y = 0; y < n; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(n, y); g.stroke(); } for (let x = 40; x < 216; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, n); g.stroke(); }
    g.lineWidth = 8; g.beginPath(); g.moveTo(128, 6); g.lineTo(128, n); g.stroke(); g.beginPath(); g.arc(128, 96, 34, 0, TAU); g.stroke();
    g.restore(); g.strokeStyle = '#140c08'; g.lineWidth = 12; path(); g.stroke();
  });
  const gt = toTex(glass, true, 1); gt.wrapS = gt.wrapT = THREE.ClampToEdgeWrapping;
  MAT.stained = new THREE.MeshStandardMaterial({ map: gt, emissive: C(0xffffff), emissiveMap: gt, emissiveIntensity: 0.9, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.4 });
  TILES.soot = 2.6; TILES.sootDark = 2.6; TILES.gothStone = 2.4; TILES.gothDark = 2.4; TILES.cobble = 3; TILES.foundryFloor = 4; TILES.graveMud = 4; TILES.deadGrass = 4; TILES.rustIron = 2;
}
// walls with holes given in world coordinates: [centre, width, sill = 0, height]
function wkX(z, xa, xb, h, key, holes = [], o = {}) { const a = Math.min(xa, xb), b = Math.max(xa, xb); wall(a, z, b, z, h, key, Object.assign({ t: 0.5, glass: false, holes: holes.map(q => ({ at: q[0] - a, w: q[1], b: q[2] || 0, h: q[3] || 3 })) }, o)); }
function wkZ(x, za, zb, h, key, holes = [], o = {}) { const a = Math.min(za, zb), b = Math.max(za, zb); wall(x, a, x, b, h, key, Object.assign({ t: 0.5, glass: false, holes: holes.map(q => ({ at: q[0] - a, w: q[1], b: q[2] || 0, h: q[3] || 3 })) }, o)); }
// a roof slab (drawn, stops bullets, does not collide: nobody walks on the roofs)
function wkRoof(x0, x1, z0, z1, top, key = 'sootDark') { blk((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0.35, key, { y: top - 0.35, noCol: true }); }
// a sodium lamp on a post or a wall bracket (flickers sometimes)
function wkLamp(x, z, h = 5, col = 0xffa440, i = 1.3, dist = 16, flick = false, post = true) {
  if (post) { CYL('ironBlack', 0.08, 0.11, h, 8, x, h / 2, z); B('ironBlack', 0.9, 0.08, 0.08, x + 0.4, h - 0.1, z, 0, 0, 0, false); }
  B('sodium', 0.32, 0.16, 0.32, x + (post ? 0.8 : 0), h - 0.25, z, 0, 0, 0, false);
  const l = lampLight(x + (post ? 0.8 : 0), h - 0.5, z, col, i, dist); if (flick) WORKS.flick.push({ l, i, t: rnd(0, 3), on: true }); return l;
}
// a gothic stained-glass window on a wall face (normal along +x/-x/+z/-z)
function wkWindow(x, y, z, w, h, ry) { batchAdd('stained', new THREE.PlaneGeometry(w, h), mat4(x, y, z, 0, ry, 0), false); }
// a pointed arch rib across a span (two leaning beams meeting at the top)
function wkArch(ax, az, bx, bz, y0, rise, key = 'gothStone', w = 0.35) {
  const mx = (ax + bx) / 2, mz = (az + bz) / 2;
  beam(key, ax, y0, az, mx, y0 + rise, mz, w, w, false); beam(key, bx, y0, bz, mx, y0 + rise, mz, w, w, false);
}
function wkGrave(x, z, q = 0) { const p = P2(x, z, 0, q); p.b('gothStone', 0.62, 0.9, 0.18, 0, 0.45, 0); p.b('gothStone', 0.7, 0.12, 0.24, 0, 0.06, 0, false); p.col(0.66, 0.95, 0.22); }
function wkCross(x, z) { B('gothDark', 0.16, 1.6, 0.16, x, 0.8, z); B('gothDark', 0.8, 0.16, 0.16, x, 1.15, z); PZ(x, 0, z, 0.3, 1.6, 0.3); }
function wkPallet(x, z, y = 0, n = 2, q = 0) {   // a stack of shrink-wrapped NIGHTSHADE boxes on a pallet
  const p = P2(x, z, y, q); p.b('wood', 1.2, 0.14, 1.0, 0, 0.07, 0);
  for (let i = 0; i < n; i++) { p.b('nightshade', 1.12, 0.48, 0.94, 0, 0.38 + i * 0.5, 0); p.b('cloth1', 0.4, 0.2, 0.01, 0.2, 0.42 + i * 0.5, 0.475, false); }
  p.col(1.2, 0.15 + n * 0.5, 1.0);
}
function wkBoiler(x, z0, z1) {
  const L = z1 - z0, zc = (z0 + z1) / 2;
  blk(x, zc, 4.2, L - 1, 1.0, 'sootDark');
  CYL('rustIron', 2.2, 2.2, L, 22, x, 3.2, zc, Math.PI / 2, 0, 0); for (let k = 0; k < L; k += 2.4) CYL('ironBlack', 2.27, 2.27, 0.18, 22, x, 3.2, z0 + 0.6 + k, Math.PI / 2, 0, 0, false);
  CYL('rustIron', 0.5, 0.5, 4.2, 12, x, 7.2, z0 + 2.5); CYL('copper', 0.22, 0.22, 3, 10, x + 1.6, 6.3, zc);
  B('furnaceGlow', 1.4, 0.9, 0.06, x, 1.6, z1 + 0.03, 0, 0, 0, false); B('ironBlack', 1.8, 1.3, 0.1, x, 1.6, z1 - 0.02);
  const l = lampLight(x, 1.6, z1 + 0.8, 0xff6a2a, 1.6, 9); WORKS.flick.push({ l, i: 1.6, t: 0.1, on: true, fire: true });
  PZ(x, 0, zc, 4.6, 5.4, L);
}
function wkTruck(x, z) {   // Harold's box truck, cab to the south, back doors open to the north
  const p = P2(x, z, 0, 0);
  p.b('paintWhite', 2.5, 2.7, 7.5, 0, 2.05, -0.8); p.b('dark', 2.3, 0.1, 7.3, 0, 0.72, -0.8);
  p.b('paintBlue', 2.4, 1.8, 2.2, 0, 1.6, 4.0); p.b('glassDark', 2.2, 0.8, 0.05, 0, 2.05, 5.1, false); p.b('dark', 2.5, 0.5, 0.3, 0, 0.65, 5.15);
  for (const [dx, dz] of [[-1.1, 4.0], [1.1, 4.0], [-1.1, -2.5], [1.1, -2.5], [-1.1, -3.6], [1.1, -3.6]]) p.lie('tire', 0.48, 0.32, 14, dx, 0.48, dz);
  p.b('paintWhite', 0.06, 2.5, 1.2, -1.85, 2.0, -5.2, false); p.b('paintWhite', 0.06, 2.5, 1.2, 1.85, 2.0, -5.2, false);   // the open back doors
  p.b('cloth1', 2.2, 0.03, 0.9, 0, 3.3, -0.8, false);
  // a canvas sign on the side: LAZARUS
  p.col(2.5, 3.4, 10.2, 0, -0.2);
}
function wkFireBarrel(x, z) {
  CYL('rustIron', 0.32, 0.3, 0.9, 12, x, 0.45, z); CYL('furnaceGlow', 0.27, 0.27, 0.05, 12, x, 0.88, z, 0, 0, 0, false); PZ(x, 0, z, 0.66, 0.9, 0.66);
  const l = lampLight(x, 1.4, z, 0xff7a2a, 1.4, 9); WORKS.flick.push({ l, i: 1.4, t: 0.1, on: true, fire: true }); WORKS.fx.push({ x, y: 1.0, z, k: 'fire' });
}

function buildWorks() {
  buildMap2Materials(); worksMaterials(); WORKS.flick = []; WORKS.fx = [];
  // ---- floors
  floorQuad(0, 0, 88, 84, 0, 'foundryFloor', 4);
  floorQuad(0, 28, 24, 24, 0.005, 'cobble', 3);                 // dock
  floorQuad(27, 12, 30, 56, 0.005, 'cobble', 3);                // foundry yard + siding
  floorQuad(-27, 28, 30, 24, 0.005, 'graveMud', 4);             // graveyard
  floorQuad(-27, 0, 17, 19, 0.008, 'deadGrass', 4);             // cloister garden
  floorQuad(-27, -28, 30, 24, 0.005, 'gothStone', 2.4);         // chapel
  // ---- outside the walls: solid, so nobody (and no path) gets round the outside
  for (const [x, z, w, d] of [[0, -42.1, 92, 3.7], [0, 42.1, 92, 3.7], [-43.4, 0, 2.3, 92], [43.4, 0, 2.3, 92]]) blk(x, z, w, d, 9, 'dark', { noDraw: true });
  // ---- outer walls
  wkZ(-42, -40, -16, 12, 'gothStone'); wkZ(-42, -16, 16, 6, 'soot', [[10, 1.6, 1.0, 1.4]]); wkZ(-42, 16, 40, 4.5, 'soot', [[28, 1.6, 1.0, 1.4]]);
  wkZ(42, -40, -16, 8, 'soot'); wkZ(42, -16, 40, 6, 'soot', [[-8, 1.6, 1.0, 1.4], [30, 1.6, 1.0, 1.4]]);
  wkX(-40, -42, -12, 12, 'gothStone'); wkX(-40, -12, 12, 9, 'soot', [[-6, 1.6, 1.0, 1.4]]); wkX(-40, 12, 42, 8, 'soot', [[24, 1.6, 1.0, 1.4]]);
  wkX(40, -42, -12, 4.5, 'soot'); wkX(40, -12, -5, 5, 'soot'); wkX(40, 5, 12, 5, 'soot'); wkX(40, 12, 42, 6, 'soot');
  blk(0, 40, 10, 0.3, 4, 'ironBlack', { noDraw: true });                                                          // the dock gate (chained)
  for (let x = -4.8; x <= 4.8; x += 0.4) CYL('ironBlack', 0.03, 0.03, 3.8, 6, x, 1.9, 40, 0, 0, 0, false);
  for (const y of [0.4, 2.0, 3.6]) B('ironBlack', 10, 0.08, 0.08, 0, y, 40, 0, 0, 0, false);
  B('steel', 0.8, 0.5, 0.15, 0, 1.9, 39.8, 0, 0, 0, false);                                                        // the padlock and chain
  // ---- inner walls
  wkZ(-12, 16, 40, 5, 'soot'); wkZ(12, 16, 40, 5, 'soot');                                                          // dock sides
  wkZ(-12, -16, 16, 7.5, 'soot', [[0, 6, 0, 4.5], [-10, 3, 4.6, 1.8], [10, 3, 4.6, 1.8]]);                         // hall west (door to the cloister)
  wkZ(12, -16, 16, 7.5, 'soot', [[0, 6, 0, 4.5], [-10, 3, 4.6, 1.8], [10, 3, 4.6, 1.8]]);                          // hall east (door to the foundry)
  wkZ(-12, -40, -16, 12, 'gothStone', [[-29, 4, 0, 4]]);                                                           // chapel | boiler house (vestry door)
  wkZ(12, -40, -16, 9, 'soot', [[-29, 4, 0, 4]]);                                                                  // boiler house | warehouse
  wkX(16, -42, -12, 4.5, 'soot', [[-27, 6, 0, 4]]);                                                                // cloister | graveyard
  wkX(16, -12, 12, 7.5, 'soot', [[0, 8, 0, 4.5]]);                                                                 // hall | dock (the big door)
  wkX(-16, -42, -12, 12, 'gothStone', [[-27, 6, 0, 5]]);                                                           // cloister | chapel
  wkX(-16, -12, 12, 9, 'soot', [[0, 6, 0, 4.5]]);                                                                  // hall | boiler house
  wkX(-16, 12, 42, 8, 'soot', [[27, 14, 0, 5.5]]);                                                                 // warehouse | foundry (open roller door)
  // ---- roofs
  wkRoof(-12, 12, -16, 16, 7.5); wkRoof(12, 42, -40, -16, 8);
  wkRoof(-12, 12, -40, -20.5, 9); wkRoof(-12, 7, -20.5, -16, 9); wkRoof(11, 12, -20.5, -16, 9);                     // boiler house (a skylight over the pad)
  wkRoof(-42, -12, -40, -16, 12, 'gothDark');
  // the chapel's pitched roof (two sloped planes over the slab) and a bell tower
  beam('sootDark', -42, 12.0, -28, -12, 12.0, -28, 0.3, 0.3, false);
  for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(30.4, 0.25, 13.6); batchAdd('gothDark', g, mat4(-27, 14.1, -28 + s * 5.7, s * 0.52, 0, 0), true); }
  blk(-38, -36, 4, 4, 10, 'gothStone', { noCol: true, y: 12 }); blk(-38, -36, 4.6, 4.6, 0.5, 'gothDark', { noCol: true, y: 22 }); CYL('gothDark', 0.01, 2.8, 6, 4, -38, 25.5, -36, 0, Math.PI / 4, 0);
  for (const [dx, dz, ry] of [[0, 2.02, 0], [0, -2.02, 0], [2.02, 0, Math.PI / 2], [-2.02, 0, Math.PI / 2]]) B('ironBlack', 1.4, 3.2, 0.05, -38 + dx, 19.5, -36 + dz, 0, ry, 0, false);
  // cloister arcade roof
  wkRoof(-42, -12, -16, -9.5, 4.2, 'gothDark'); wkRoof(-42, -12, 9.5, 16, 4.2, 'gothDark'); wkRoof(-42, -35.5, -9.5, 9.5, 4.2, 'gothDark'); wkRoof(-18.5, -12, -9.5, 9.5, 4.2, 'gothDark');

  // ================= LOADING DOCK (start)
  wkTruck(5.5, 27.5);
  for (const [x, z, n] of [[-8.5, 18.5, 2], [-10, 21, 1], [9.8, 36.6, 2], [-9.8, 37.4, 1]]) wkPallet(x, z, 0, n);
  wkFireBarrel(-5.5, 33.5);
  wkLamp(-11.4, 26, 5.2, 0xffa440, 1.3, 16, false, false); wkLamp(10.2, 19, 5.5); wkLamp(-3, 38.6, 4.5, 0xffa440, 1.0, 12, true);
  batchAdd('worksSign', new THREE.PlaneGeometry(6.4, 6.4), mat4(0, 6.2, 16.28, 0, 0, 0), false);                  // over the big door
  for (const x of [-4.4, 4.4]) B('hazard', 0.3, 4.5, 0.12, x, 2.25, 16.3, 0, 0, 0, false);
  CYL('ironBlack', 0.06, 0.06, 0.5, 6, -3.6, 0.25, 30, 0, 0, 0, false);

  // ================= BOTTLING HALL (the hub)
  CYL('copper', 2.4, 2.6, 4.2, 28, 0, 2.1, -1); CYL('copper', 2.6, 2.4, 0.5, 28, 0, 4.45, -1); CYL('copperOld', 1.2, 2.4, 1.2, 28, 0, 5.3, -1);
  CYL('copper', 0.35, 0.35, 2.4, 10, 0, 7.0, -1); for (const a of [0.4, 2.5, 4.6]) CYL('ironBlack', 0.08, 0.08, 4.3, 6, Math.cos(a) * 2.5, 2.15, -1 + Math.sin(a) * 2.5);
  B('chemGlow', 0.9, 0.5, 0.06, 0, 2.4, 1.42, 0, 0, 0, false); PZ(0, 0, -1, 4.8, 5, 4.8);
  WORKS.vatLight = lampLight(0, 3, 1.8, 0x3aff5a, 1.0, 10);
  for (const [x, z] of [[-7, 9.5], [7, 9.5], [-7, -9.5], [7, -9.5]]) {   // bottling lines
    B('steel', 6, 0.08, 1.2, x, 0.95, z); for (let k = -2.8; k <= 2.8; k += 0.4) CYL('ironBlack', 0.05, 0.05, 1.15, 6, x + k, 1.02, z, Math.PI / 2, 0, 0, false);
    for (const dx of [-2.8, 0, 2.8]) for (const dz of [-0.5, 0.5]) B('ironBlack', 0.08, 0.95, 0.08, x + dx, 0.47, z + dz, 0, 0, 0, false);
    for (let k = -2.5; k <= 2.5; k += 0.5) { CYL('glassDark', 0.06, 0.06, 0.24, 8, x + k, 1.17, z, 0, 0, 0, false); CYL('nightshade', 0.04, 0.04, 0.06, 8, x + k, 1.32, z, 0, 0, 0, false); }
    B('ironBlack', 1.4, 2.2, 1.4, x + 3.7 * Math.sign(x), 1.1, z); PZ(x + 3.7 * Math.sign(x), 0, z, 1.4, 2.2, 1.4);  // a capping machine at the end
    PZ(x, 0, z, 6, 1.1, 1.2);
  }
  for (const [x, z] of [[-6, -8], [6, -8], [-6, 8], [6, 8]]) wkLamp(x, z, 6.9, 0xffc27a, 0.9, 14, Math.abs(x + z) < 1, false);
  pipeRun(-12, -12, 12, -12, 6.2, 0.18, 'copper'); pipeRun(-12, 12, 12, 12, 6.2, 0.18, 'copper'); pipeRun(0, -16, 0, -3.4, 6.6, 0.22, 'rustIron');
  for (const z of [-14, -6, 6, 14]) beam('ironBlack', -12, 7.0, z, 12, 7.0, z, 0.25, 0.4, false);
  for (const [x, z] of [[-10.5, 14.4], [10.5, -14.4], [10.6, 14.2]]) drumRack(x, z, 0, 0);

  // ================= CHAPEL CLOISTER (the west loop)
  for (let x = -35.5; x <= -18.5; x += 4.25) for (const z of [-9.5, 9.5]) { blk(x, z, 0.6, 0.6, 3.9, 'gothStone'); B('gothDark', 0.85, 0.3, 0.85, x, 4.0, z, 0, 0, 0, false); }
  for (let z = -5.25; z <= 5.25; z += 3.5) for (const x of [-35.5, -18.5]) { blk(x, z, 0.6, 0.6, 3.9, 'gothStone'); B('gothDark', 0.85, 0.3, 0.85, x, 4.0, z, 0, 0, 0, false); }
  for (let x = -33.4; x <= -20; x += 4.25) for (const z of [-9.5, 9.5]) wkArch(x - 2.1, z, x + 2.1, z, 2.9, 1.0, 'gothStone', 0.22);
  // the fountain and its angel in the middle of the garden
  CYL('gothStone', 2.0, 2.1, 0.7, 24, -27, 0.35, 0); CYL('water', 1.75, 1.75, 0.05, 24, -27, 0.62, 0, 0, 0, 0, false); CYL('gothStone', 0.35, 0.45, 1.6, 10, -27, 1.4, 0);
  B('gothStone', 0.6, 1.3, 0.45, -27, 2.85, 0); CYL('gothStone', 0.2, 0.2, 0.32, 10, -27, 3.66, 0); for (const s of [-1, 1]) B('gothStone', 0.9, 1.1, 0.08, -27 + s * 0.6, 3.1, -0.15, 0, s * 0.5, s * 0.35);
  PZ(-27, 0, 0, 3.6, 1.0, 3.6);
  for (const [x, z] of [[-33, -7], [-21, 7.2], [-33.2, 6.6]]) tree(x, z, true, 0.8);
  for (const [x, z] of [[-24, -7], [-30, 7.3]]) wkCross(x, z);
  for (const [x, z] of [[-39, -12.8], [-15, -12.8], [-39, 12.8], [-15, 12.8], [-27, -12.8], [-27, 12.8], [-39, 0], [-15, 0]]) wkLamp(x, z, 3.9, 0xffb060, 1.1, 12, x < -30 && z > 0, false);
  lampLight(-27, 5, 0, 0x9ab0ff, 0.9, 18);

  // ================= GRAVEYARD (south of the cloister)
  for (let x = -38; x <= -16; x += 3) for (const z of [21, 25, 29]) if (!(x > -31 && x < -23)) wkGrave(x + (z % 2), z, 0);
  for (const [x, z] of [[-17.5, 35.5], [-28.5, 36], [-20.5, 23]]) wkCross(x, z);
  blk(-36, 34.5, 6, 5, 4, 'gothDark'); B('gothStone', 6.6, 0.4, 5.6, -36, 4.2, 34.5); B('ironBlack', 1.6, 2.4, 0.08, -36, 1.2, 31.97, 0, 0, 0, false);   // the crypt
  B('gothStone', 3.2, 1.2, 0.2, -36, 4.9, 32.0, 0, 0, 0, false);
  for (const [x, z] of [[-40, 19], [-15, 38], [-24, 18.5]]) tree(x, z, true, 1.0);
  for (let x = -40; x <= -14; x += 2) CYL('ironBlack', 0.03, 0.03, 1.4, 5, x, 0.7, 39.6, 0, 0, 0, false);
  wkLamp(-28, 31, 3.2, 0xffb060, 0.8, 12, true); wkLamp(-18, 24, 3.2, 0xffb060, 0.7, 11);

  // ================= THE CHAPEL (north of the cloister)
  blk(-27, -38.5, 12, 3, 0.3, 'gothDark', { walk: true });                                                          // the altar step
  B('gothStone', 3.4, 1.1, 1.2, -27, 0.85, -38.6); B('cloth3', 3.5, 0.04, 1.3, -27, 1.42, -38.6, 0, 0, 0, false); PZ(-27, 0.3, -38.6, 3.4, 1.1, 1.2);
  B('gothDark', 0.2, 3.4, 0.2, -27, 2.4, -39.6, 0, 0, 0, false); B('gothDark', 1.6, 0.2, 0.2, -27, 3.4, -39.6, 0, 0, 0, false);
  for (const x of [-28.4, -25.6]) { CYL('ironBlack', 0.08, 0.15, 1.6, 8, x, 1.1, -38.0); CYL('candle', 0.05, 0.05, 0.3, 8, x, 2.05, -38.0, 0, 0, 0, false); }
  for (const z of [-19.2, -21.6, -24, -26.4, -28.8, -31.2, -33.6]) for (const [x0, x1] of [[-39.5, -30.6], [-23.4, -14.6]]) {
    const xc = (x0 + x1) / 2, L = x1 - x0; B('pew', L, 0.08, 0.5, xc, 0.48, z); B('pew', L, 0.7, 0.07, xc, 0.85, z - 0.27); for (const xx of [x0 + 0.1, x1 - 0.1]) B('pew', 0.08, 0.95, 0.6, xx, 0.48, z - 0.02, 0, 0, 0, false);
    PZ(xc, 0, z - 0.05, L, 0.95, 0.62);
  }
  for (const z of [-19, -23.8, -28.6, -33.4]) for (const x of [-30.2, -23.8]) blk(x, z, 0.7, 0.7, 8.4, 'gothStone');
  for (const z of [-19, -23.8, -28.6, -33.4]) { wkArch(-30.2, z, -23.8, z, 8.4, 3.2); wkArch(-41.8, z, -30.2, z, 8.4, 2.4, 'gothDark'); wkArch(-23.8, z, -12.2, z, 8.4, 2.4, 'gothDark'); }
  for (const x of [-30.2, -23.8]) beam('gothStone', x, 8.4, -39.8, x, 8.4, -16.2, 0.45, 0.45, false);
  // stained glass: three tall windows behind the altar, three on the west wall, and one high over the cloister door
  for (const [x, w, h] of [[-27, 3.2, 7], [-32, 2.2, 5.5], [-22, 2.2, 5.5]]) wkWindow(x, 3.4 + h / 2, -39.73, w, h, 0);
  for (const z of [-21.4, -26.2, -31]) wkWindow(-41.73, 6.2, z, 2.0, 5.0, Math.PI / 2);
  wkWindow(-27, 8.6, -16.27, 3.2, 4.5, Math.PI);
  for (const [x, z, i] of [[-27, -36.5, 1.0], [-35, -26, 0.7], [-19, -26, 0.7]]) { const l = lampLight(x, 3.2, z, 0xffb070, i, 12); WORKS.flick.push({ l, i, t: rnd(0, 1), on: true, candle: true }); }
  for (const [x, z] of [[-28.4, -38], [-25.6, -38]]) WORKS.fx.push({ x, y: 2.25, z, k: 'candle' });
  lampLight(-27, 6.5, -39, 0xc080ff, 0.8, 16); lampLight(-40.5, 6, -26, 0x8090ff, 0.6, 12);
  for (const [x, z] of [[-40.4, -18], [-13.6, -37.5]]) for (let k = 0; k < 3; k++) wkPallet(x, z + k * 1.15 * (z < -30 ? 1 : 1), 0, 1);

  // ================= BOILER HOUSE (the upgrader)
  wkBoiler(-7, -36, -22); wkBoiler(7, -36, -22);
  pipeRun(-7, -29, 7, -29, 7.6, 0.25, 'rustIron'); pipeRun(-12, -38.5, 12, -38.5, 5.5, 0.2, 'copper'); pipeRun(-11.4, -16, -11.4, -40, 4.0, 0.15, 'copper');
  for (const x of [-10.8, 10.8]) for (const z of [-24, -33]) { valveWheel(x, z, 1.3, x > 0 ? 3 : 1); }
  B('ironBlack', 2.4, 0.06, 2.4, 9, 0.04, -18.4, 0, 0, 0, false);
  for (const [x, z] of [[-3.5, -18.5], [3.5, -18.5], [0, -24], [0, -30], [0, -35.5], [-10, -28], [10, -28]]) wkLamp(x, z, 8.6, 0xffb060, 1.2, 14, x === 3.5, false);
  lampLight(9, 7.5, -18.4, 0x9ab0ff, 0.6, 10);                                                                      // moonlight through the skylight
  B('steel', 1.2, 1.4, 0.9, -10, 0.7, -38.6); B('dark', 0.9, 1.1, 0.02, -10, 0.75, -38.14, 0, 0, 0, false); PZ(-10, 0, -38.6, 1.2, 1.4, 0.9);   // the foreman's safe
  elecBox(10.9, -36.5, 0, 3);

  // ================= NIGHTSHADE WAREHOUSE
  for (const z of [-24, -32]) {
    for (const y of [0.1, 2.0, 3.9]) B('paintOrange', 22, 0.12, 1.4, 27, y, z); for (let x = 16; x <= 38; x += 2.75) for (const dz of [-0.65, 0.65]) B('paintBlue', 0.1, 5, 0.1, x, 2.5, z + dz, 0, 0, 0, false);
    for (let x = 17.2; x <= 37; x += 1.45) for (const y of [0.16, 2.06]) if ((x * 7 + y * 3 + z) % 5 > 1) wkPallet(x, z, y, 1);
    PZ(27, 0, z, 22, 5, 1.4);
  }
  for (const [x, z, n] of [[15, -20, 2], [39.5, -19.5, 2], [39.2, -28, 3], [14.8, -36.5, 2], [21, -38.8, 1], [36, -36.8, 2]]) wkPallet(x, z, 0, n);
  for (const [x, z] of [[20, -28], [34, -28], [27, -36]]) wkLamp(x, z, 7.6, 0xd0e0ff, 0.7, 13, x === 34, false);
  lampLight(27, 3, -20, 0x9a3cff, 0.5, 10);

  // ================= FOUNDRY YARD (the east loop) and the rail siding
  blk(27, 0, 10, 10, 7, 'soot'); B('sootDark', 10.6, 0.5, 10.6, 27, 7.1, 0);
  CYL('soot', 1.9, 2.4, 30, 16, 27, 22, 0); CYL('sootDark', 2.1, 2.1, 0.8, 16, 27, 37.2, 0); for (const y of [12, 20, 28]) CYL('ironBlack', 2.05 - (y - 12) * 0.012, 2.05 - (y - 12) * 0.012, 0.25, 16, 27, y, 0, 0, 0, 0, false);
  B('furnaceGlow', 3.6, 2.4, 0.08, 27, 1.5, 5.06, 0, 0, 0, false); B('ironBlack', 4.4, 0.3, 0.3, 27, 2.85, 5.2, 0, 0, 0, false);
  for (const s of [-1, 1]) B('ironBlack', 0.3, 3.0, 0.3, 27 + s * 2.05, 1.5, 5.2, 0, 0, 0, false);
  const fl = lampLight(27, 1.6, 6.6, 0xff6a1a, 2.6, 16); WORKS.flick.push({ l: fl, i: 2.6, t: 0.1, on: true, fire: true }); WORKS.fx.push({ x: 27, y: 2.2, z: 5.4, k: 'furnace' }, { x: 27, y: 37.5, z: 0, k: 'stack' });
  for (const [x, z, q] of [[19.5, -9, 0], [35, -12, 1], [36.5, 9.5, 0]]) { const p = P2(x, z, 0, q); for (let i = 0; i < 3; i++) p.b('rustIron', 1.6, 0.4, 0.9, i * 1.7 - 1.7, 0.2, 0); p.col(5, 0.45, 0.9); }   // ingot moulds
  for (const [x, z] of [[16, -12.5], [38.5, -12.5]]) { B('paintYellow', 0.6, 10, 0.6, x, 5, z); PZ(x, 0, z, 0.6, 10, 0.6); }
  beam('paintYellow', 16, 10.2, -12.5, 38.5, 10.2, -12.5, 0.7, 0.9); B('dark', 1.2, 0.9, 1.2, 25, 9.4, -12.5); CYL('steel', 0.02, 0.02, 6, 4, 25, 6.1, -12.5, 0, 0, 0, false); B('rustIron', 1.6, 0.6, 1.6, 25, 2.9, -12.5);
  for (const [x, z, s] of [[39, 1, 1.1], [15.5, 6, 0.9]]) { const p = P2(x, z, 0, 0); p.b('rustIron', 2.2 * s, 1.0 * s, 1.6 * s, 0, 0.5 * s, 0); p.b('ironBlack', 1.4 * s, 0.7 * s, 1.0 * s, 0.3, 1.2 * s, 0.2, false); p.b('steel', 1.6, 0.1, 0.2, -0.4, 1.4 * s, -0.1, false); p.col(2.2 * s, 1.5 * s, 1.6 * s); }   // scrap heaps
  cableSpool(16, 13, 0, 1); ibcTote(40.5, -6, 0, 0); ibcTote(40.5, -4.6, 0, 0);
  for (const z of [29.25, 30.75]) B('steel', 30, 0.12, 0.12, 27, 0.08, z, 0, 0, 0, false); for (let x = 12.5; x <= 41.5; x += 0.9) B('wood', 0.25, 0.08, 2.4, x, 0.04, 30, 0, 0, 0, false);
  { const p = P2(25, 30, 0, 1); p.b('redBarn', 3.0, 3.2, 12, 0, 2.3, 0); p.b('dark', 2.6, 0.6, 11.4, 0, 0.5, 0); p.b('sootDark', 3.2, 0.25, 12.2, 0, 3.98, 0, false); p.b('dark', 0.06, 2.6, 2.4, 1.52, 2.2, 0, false); p.col(3.0, 4.0, 12); }   // the boxcar
  for (const [x, z] of [[14, 22], [40.6, 18], [14, -5], [40.6, -14]]) wkLamp(x, z, 6, 0xffa440, 1.2, 18, x > 40 && z < 0);
  wkFireBarrel(36, 37); wkFireBarrel(18, -14);
}
defineMap({
  id: 'works', size: 'large', hidden: true, zombiesOnly: true, planCut: 3.6, name: 'THE WORKS', place: 'Victorian drug factory, night', desc: 'The old Lazarus Pharmaceutical Works: soot-black brick, a gothic chapel, a foundry and the warehouse where the last NIGHTSHADE is made.',
  play: [-42, 42, -40, 40], build: buildWorks,
  env: { top: 0x0a0d18, horizon: 0x34382e, fog: 0.011, sun: [30, 46, -26], sunCol: 0x9ab0d4, sunI: 0.8, skySun: 0x6a7a9a, hemiSky: 0x7a8298, hemiGround: 0x3e342a, exposure: 1.45 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 36 }, { x: 0, z: -36 }],
    hp: [{ x: 0, z: 7 }, { x: 8, z: 5.5 }, { x: -6, z: 22 }],
    flags: [{ x: 0, z: 36 }, { x: 0, z: -36 }],
    sites: [{ x: -27, z: 0, n: 'A' }, { x: 27, z: 10, n: 'B' }],
  },
  menu: { x: 0, z: 10, r: 8, y: 2.6 },
  navPts: [{ x: 0, z: 34 }, { x: 0, z: 8 }, { x: -27, z: -12 }, { x: -27, z: 28 }, { x: -27, z: -22 }, { x: 0, z: -26 }, { x: 27, z: -20 }, { x: 27, z: 12 }, { x: 34, z: 34 }],
  views: [[0, 1.7, 37, 0, 2, 20], [0, 1.7, 12, 0, 2, -6], [-14, 1.7, -12, -30, 1.5, 6], [-27, 1.7, -18, -27, 2.5, -38], [0, 1.7, -18, 0, 2, -36], [16, 1.7, 14, 27, 3, 0], [16, 1.7, -18, 34, 2, -30], [-15, 1.7, 36, -30, 1.5, 22]],
});
// the map's living bits: flickering lamps, firelight, embers, candle smoke, smokestack (called from the zombies tick)
function worksTick(dt) {
  if (curMap !== 'works') return;
  for (const f of WORKS.flick) {
    if (f.fire || f.candle) { f.l.intensity = f.i * (0.82 + Math.sin(NOW * (f.candle ? 9 : 13) + f.i * 7) * 0.08 + Math.random() * 0.12); continue; }
    if (f.steady) continue;
    f.t -= dt; if (f.t <= 0) { f.on = !f.on; f.t = f.on ? rnd(0.4, 5) : rnd(0.03, 0.2); f.l.intensity = f.on ? f.i : f.i * 0.1; }
  }
  const cx = camera.position.x, cz = camera.position.z;
  for (const e of WORKS.fx) {
    if (e.k !== 'stack' && Math.abs(e.x - cx) + Math.abs(e.z - cz) > 26) continue;
    if (e.k === 'fire' && Math.random() < dt * 3) puff(e.x + rnd(-0.15, 0.15), e.y, e.z + rnd(-0.15, 0.15), { minor: true, color: 0xffa040, size: 0.05, grow: -0.02, life: 1.2, vy: 1.4, op: 0.9 });
    if (e.k === 'furnace' && Math.random() < dt * 5) puff(e.x + rnd(-1.5, 1.5), e.y, e.z + 0.2, { minor: true, color: 0xff7a2a, size: 0.04, grow: -0.01, life: 1.6, vy: 1.8, op: 0.9 });
    if (e.k === 'stack' && Math.random() < dt * 1.2) puff(e.x + rnd(-0.8, 0.8), e.y, e.z + rnd(-0.8, 0.8), { minor: true, color: 0x3a3a38, size: 1.2, grow: 1.4, life: 6, vy: 1.6, op: 0.4 });
    if (e.k === 'candle' && Math.random() < dt * 0.8) puff(e.x, e.y, e.z, { minor: true, color: 0x8a8a8a, size: 0.03, grow: 0.08, life: 2, vy: 0.35, op: 0.25 });
  }
}
// the power is on: the hall lamps stop flickering
function worksPower() { for (const f of WORKS.flick) if (!f.fire && !f.candle) { f.steady = true; f.l.intensity = f.i * 1.15; } if (WORKS.vatLight) WORKS.vatLight.intensity = 1.8; }
