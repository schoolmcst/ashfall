/* ================================================================== LARGE map: BLACKWELL HOSPITAL (dusk, power flickering)
   A two-storey hospital, 80 x 68 m, almost all of it indoors. The two halves (north and south) are built the same way so
   both teams get identical routes; the furniture tells them apart (south: emergency, x-ray, wards; north: surgery,
   morgue, labs).
     MIDDLE  - the atrium: two storeys high with a bridge across it on the upper floor, reached by two grand stairs.
     CORRIDOR A - the main east-west corridor on both floors, past the atrium.
     ROW 1 / CORRIDOR B / ROW 2 - wards and offices between the main corridor and the outer wall, with a back corridor.
     ENDS - a stairwell in each corner wing, plus side doors out to a narrow strip along the east and west walls.
   Spawns are just outside the two main entrances (ambulance bays). Upper floor at 4.2 m, roof at 8.4 m (not reachable). */
const HOSP = { H: 4.2, OUT: 40, ZO: 34 };
// wall helpers that take holes in world coordinates: [centre, width, sill = 0, height = 2.4]
function hWX(z, xa, xb, y, key, holes = [], t = 0.25, h = HOSP.H) {
  const a = Math.min(xa, xb), b = Math.max(xa, xb);
  wall(a, z, b, z, h, key, { y, t, glass: true, holes: holes.map(q => ({ at: q[0] - a, w: q[1], b: q[2] || 0, h: q[3] || 2.4 })) });
}
function hWZ(x, za, zb, y, key, holes = [], t = 0.25, h = HOSP.H) {
  const a = Math.min(za, zb), b = Math.max(za, zb);
  wall(x, a, x, b, h, key, { y, t, glass: true, holes: holes.map(q => ({ at: q[0] - a, w: q[1], b: q[2] || 0, h: q[3] || 2.4 })) });
}

// ---------------------------------------------------------------- hospital props (all (x, z, y, q); back of the piece is local -z)
function hospBed(x, z, y = 0, q = 0, sheet = 'cloth1') {
  const p = P2(x, z, y, q);
  p.b('steel', 0.95, 0.06, 2.0, 0, 0.5, 0.05); p.b(sheet, 0.88, 0.16, 1.9, 0, 0.61, 0.07); p.b('cloth2', 0.9, 0.05, 1.1, 0, 0.71, 0.45, false);
  p.b('cloth1', 0.6, 0.12, 0.35, 0, 0.75, -0.7, false); p.b('panel', 0.98, 0.9, 0.06, 0, 0.75, -0.98); p.b('panel', 0.98, 0.5, 0.05, 0, 0.62, 1.05, false);
  for (const s of [-1, 1]) { p.b('steel', 0.03, 0.22, 0.9, s * 0.5, 0.78, -0.25, false); for (const dz of [-0.9, 0.95]) p.b('steel', 0.04, 0.45, 0.04, s * 0.42, 0.25, dz, false); for (const dz of [-0.9, 0.95]) p.cyl('rubber', 0.05, 0.05, 0.04, 8, s * 0.42, 0.05, dz, false); }
  p.cyl('steel', 0.015, 0.015, 1.9, 6, 0.62, 0.95, -0.85, false); p.b('windowGlass', 0.14, 0.22, 0.05, 0.62, 1.75, -0.85, false);     // IV stand
  p.b('panel', 0.45, 0.6, 0.45, -0.85, 0.3, -0.7); p.b('steel', 0.25, 0.02, 0.02, -0.85, 0.45, -0.47, false);                          // bedside cabinet
  p.col(0.98, 0.8, 2.1, 0, 0.05);
}
function gurney(x, z, y = 0, q = 0) {
  const p = P2(x, z, y, q);
  p.b('steel', 0.62, 0.05, 1.9, 0, 0.85, 0); p.b('cloth1', 0.58, 0.08, 1.8, 0, 0.92, 0, false); p.b('cloth2', 0.6, 0.04, 0.9, 0, 0.97, 0.35, false);
  p.b('steel', 0.5, 0.04, 1.6, 0, 0.3, 0, false); for (const [dx, dz] of [[-0.26, -0.85], [0.26, -0.85], [-0.26, 0.85], [0.26, 0.85]]) { p.b('steel', 0.03, 0.8, 0.03, dx, 0.45, dz, false); p.cyl('rubber', 0.05, 0.05, 0.04, 8, dx, 0.05, dz, false); }
  p.col(0.62, 0.95, 1.9);
}
function crashCart(x, z, y = 0, q = 0) {
  const p = P2(x, z, y, q); p.b('paintRed', 0.75, 0.95, 0.5, 0, 0.55, 0); for (let i = 0; i < 4; i++) p.b('dark', 0.68, 0.015, 0.01, 0, 0.3 + i * 0.2, 0.255, false);
  p.b('paintWhite', 0.4, 0.22, 0.3, -0.1, 1.15, 0, false); p.b('screen', 0.3, 0.14, 0.01, -0.1, 1.16, 0.151, false); p.b('steel', 0.8, 0.03, 0.55, 0, 1.03, 0, false); p.col(0.8, 1.05, 0.55);
}
function medCabinet(x, z, y = 0, q = 0) {
  const p = P2(x, z, y, q); p.b('paintWhite', 1.0, 1.9, 0.42, 0, 0.95, 0); p.b('windowGlass', 0.92, 0.9, 0.01, 0, 1.4, 0.215, false);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) p.b(['paintWhite', 'paintOrange', 'paintBlue', 'cloth1', 'paintGreen'][(r + i) % 5], 0.1, 0.16, 0.12, -0.34 + i * 0.17, 1.06 + r * 0.3, 0.1, false);
  p.b('dark', 0.9, 0.01, 0.01, 0, 0.9, 0.215, false); p.col(1.0, 1.9, 0.42);
}
function vitals(x, z, y = 0, q = 0) {
  const p = P2(x, z, y, q); p.cyl('steel', 0.02, 0.02, 1.3, 6, 0, 0.65, 0, false); p.cyl('dark', 0.22, 0.22, 0.04, 10, 0, 0.04, 0, false);
  p.b('dark', 0.36, 0.28, 0.12, 0, 1.35, 0, false); p.b('screen', 0.3, 0.2, 0.01, 0, 1.36, 0.061, false); p.b('greenLight', 0.2, 0.01, 0.005, 0, 1.38, 0.067, false); PZ(...p.at(0, 0), y, 0.35, 1.4, 0.35, { noRay: true });
}
function curtain(x, z, y = 0, q = 0, len = 2.2, col = 'cloth2') {
  const p = P2(x, z, y, q); p.b('steel', 0.03, 0.03, len, 0, 2.35, 0, false);
  for (let i = 0; i < Math.round(len / 0.36); i++) p.b(col, 0.06, 1.75, 0.34, (i % 2) * 0.05 - 0.025, 1.4, -len / 2 + 0.18 + i * 0.36, false);
}
function opTable(x, z, y = 0, q = 0) {
  const p = P2(x, z, y, q); p.cyl('steel', 0.18, 0.28, 0.75, 12, 0, 0.38, 0); p.b('dark', 0.6, 0.12, 2.0, 0, 0.82, 0); p.b('paintGreen', 0.56, 0.06, 1.9, 0, 0.91, 0, false);
  p.b('steel', 0.7, 0.04, 0.5, 0, 0.02, 0, false); p.col(0.65, 0.95, 2.0);
  // surgical lamp hanging from the ceiling
  p.cyl('steel', 0.03, 0.03, 1.1, 6, 0.4, 3.4, 0.2, false); p.beam('steel', 0.4, 2.85, 0.2, 0.15, 2.5, 0.0, 0.05, 0.05);
  p.cyl('paintWhite', 0.42, 0.3, 0.16, 16, 0.15, 2.42, 0.0, false); p.cyl('signalCold', 0.28, 0.28, 0.02, 16, 0.15, 2.33, 0.0, false);
  p.b('steel', 0.7, 0.04, 0.45, 1.0, 0.95, 0.4, false); p.b('steel', 0.03, 0.93, 0.03, 1.0, 0.47, 0.4, false); for (let i = 0; i < 5; i++) p.b('steel', 0.02, 0.01, 0.16, 0.8 + i * 0.1, 0.98, 0.4, false);
}
function morgueWall(x, z, y = 0, q = 0) {
  const p = P2(x, z, y, q); p.b('sheet', 2.6, 2.1, 0.9, 0, 1.05, 0);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { p.b('steel', 0.76, 0.6, 0.02, -0.85 + c * 0.85, 0.4 + r * 0.68, 0.455, false); p.b('dark', 0.2, 0.04, 0.03, -0.85 + c * 0.85, 0.6 + r * 0.68, 0.47, false); p.b('paintWhite', 0.12, 0.06, 0.01, -1.1 + c * 0.85, 0.62 + r * 0.68, 0.467, false); }
  p.col(2.6, 2.1, 0.9);
}
function autopsyTable(x, z, y = 0, q = 0) {
  const p = P2(x, z, y, q); p.cyl('steel', 0.14, 0.2, 0.8, 10, 0, 0.4, 0); p.b('sheet', 0.85, 0.08, 2.1, 0, 0.84, 0); for (const s of [-1, 1]) p.b('sheet', 0.04, 0.08, 2.1, s * 0.42, 0.9, 0, false);
  p.b('cloth1', 0.55, 0.16, 1.7, 0, 0.96, 0.05, false); p.b('cloth1', 0.25, 0.14, 0.25, 0, 0.98, -0.82, false); p.col(0.85, 0.95, 2.1);
}
function xrayMachine(x, z, y = 0, q = 0) {
  const p = P2(x, z, y, q); p.b('panel', 2.2, 0.75, 0.9, 0, 0.38, 0.45); p.b('cloth1', 2.0, 0.05, 0.75, 0, 0.78, 0.45, false);
  p.b('panel', 0.35, 2.4, 0.35, -1.25, 1.2, -0.25); p.b('panel', 0.3, 0.3, 1.4, -1.25, 2.3, 0.3, false); p.b('paintWhite', 0.5, 0.25, 0.5, -1.0, 2.05, 0.45, false);
  p.b('panel', 0.7, 1.7, 0.08, 1.4, 1.1, -0.35); p.b('screen', 0.5, 0.6, 0.01, 1.4, 1.4, -0.305, false); p.col(2.9, 0.8, 1.3, 0.15, 0.25);
}
function wheelchair(x, z, y = 0, q = 0) {
  const p = P2(x, z, y, q); p.b('dark', 0.5, 0.05, 0.45, 0, 0.5, 0, false); p.b('dark', 0.5, 0.45, 0.04, 0, 0.75, -0.22, false);
  for (const s of [-1, 1]) { p.lie('rubber', 0.3, 0.04, 14, s * 0.3, 0.3, -0.05, true, false); p.b('steel', 0.03, 0.3, 0.03, s * 0.25, 0.65, 0.2, false); p.cyl('rubber', 0.06, 0.06, 0.04, 8, s * 0.2, 0.06, 0.3, false); }
  PZ(...p.at(0, 0), y, 0.65, 0.9, 0.65, { noRay: true });
}
function nurseDesk(x, z, y = 0, q = 0) {
  const p = P2(x, z, y, q); p.b('panel', 3.2, 1.05, 0.7, 0, 0.53, 0); p.b('wood', 3.3, 0.05, 0.4, 0, 1.08, 0.2); p.b('panel', 3.0, 0.05, 0.6, 0, 0.75, -0.1, false);
  for (const dx of [-0.9, 0.6]) { p.b('dark', 0.5, 0.32, 0.03, dx, 1.0, -0.2, false); p.b('screen', 0.45, 0.27, 0.01, dx, 1.0, -0.185, false); }
  p.b('paintBlue', 3.2, 0.12, 0.02, 0, 0.9, 0.36, false); p.col(3.3, 1.1, 0.75);
}
function hospSign(x, y, z, q = 0, col = 'paintBlue', w = 1.4) { const p = P2(x, z, 0, q); p.b(col, w, 0.32, 0.04, 0, y, 0, false); p.b('paintWhite', w * 0.7, 0.06, 0.01, 0, y, 0.025, false); }
function redCross(x, y, z, q = 0, s = 1) { const p = P2(x, z, 0, q); p.b('paintWhite', 1.3 * s, 1.3 * s, 0.06, 0, y, 0, false); p.b('redLight', 0.9 * s, 0.28 * s, 0.02, 0, y, 0.04, false); p.b('redLight', 0.28 * s, 0.9 * s, 0.02, 0, y, 0.04, false); }
function ambulance(x, z, q = 0) {
  const p = P2(x, z, 0, q); p.b('paintWhite', 2.2, 2.3, 4.0, 0, 1.45, -0.6); p.b('paintWhite', 2.1, 1.5, 1.6, 0, 1.05, 2.15); p.b('glassDark', 1.9, 0.6, 0.05, 0, 1.55, 2.96, false);
  p.b('paintRed', 2.22, 0.25, 4.02, 0, 1.25, -0.6, false); p.b('paintRed', 2.12, 0.2, 1.62, 0, 1.1, 2.15, false); p.b('redLight', 1.2, 0.12, 0.3, 0, 2.66, 1.0, false); p.b('glassDark', 2.12, 0.5, 0.9, 0, 1.6, 2.0, false);
  for (const s of [-1, 1]) for (const dz of [-1.7, 1.9]) p.lie('tire', 0.42, 0.3, 14, s * 1.0, 0.42, dz, true, false);
  p.col(2.2, 2.6, 5.6, 0, 0.1);
}
// furniture themes for fillRoom: [width along the wall, depth, height, fn]
Object.assign(FURN, {
  ward: [[1.6, 2.15, 1.0, hospBed], [1.6, 2.15, 1.0, (x, z, y, q) => hospBed(x, z, y, q, 'cloth3')], [1.0, 0.45, 1.9, medCabinet], [0.85, 0.85, 0.9, armchair], [1.6, 2.15, 1.0, hospBed], [0.5, 0.45, 0.9, (x, z, y) => pottedPlant(x, z, y, 1.0)]],
  er: [[1.6, 2.15, 1.0, hospBed], [0.8, 0.55, 1.1, crashCart], [0.7, 1.95, 1.0, gurney], [1.0, 0.45, 1.9, medCabinet], [1.6, 2.15, 1.0, hospBed], [0.4, 0.4, 1.4, vitals]],
  surgery: [[1.0, 0.45, 1.9, medCabinet], [0.8, 0.55, 1.1, crashCart], [0.4, 0.4, 1.4, vitals], [2.05, 0.72, 1.7, labBench], [1.0, 0.45, 1.9, medCabinet]],
  morgue: [[2.6, 0.95, 2.1, morgueWall], [2.6, 0.95, 2.1, morgueWall], [0.7, 1.95, 1.0, gurney], [1.0, 0.45, 1.9, medCabinet], [2.05, 0.72, 1.7, labBench]],
  xray: [[2.9, 1.4, 2.5, xrayMachine], [1.5, 0.75, 1.2, deskPC], [1.0, 0.45, 1.9, medCabinet], [0.5, 0.62, 1.35, fileCab], [0.7, 1.95, 1.0, gurney]],
  nurse: [[3.3, 0.8, 1.1, nurseDesk], [0.5, 0.62, 1.35, fileCab], [1.0, 0.45, 1.9, medCabinet], [0.35, 0.35, 1.4, waterCooler], [0.8, 0.6, 1.05, copier], [0.65, 0.7, 0.9, wheelchair]],
  supply: [[1.8, 0.5, 1.8, goodsShelf], [1.0, 0.45, 1.9, medCabinet], [1.8, 0.5, 1.8, goodsShelf], [1.65, 0.6, 1.05, crateStack], [0.7, 1.95, 1.0, gurney], [0.65, 0.7, 0.9, wheelchair]],
  waiting: [[2.4, 0.55, 0.95, (x, z, y, q) => seatRow(x, z, y, q, 4)], [1.8, 0.55, 0.95, (x, z, y, q) => seatRow(x, z, y, q, 3)], [1.9, 0.8, 1.9, vendingPair], [0.45, 0.45, 0.9, (x, z, y) => pottedPlant(x, z, y, 1.2)], [0.35, 0.35, 1.4, waterCooler], [0.65, 0.7, 0.9, wheelchair]],
});


// ---------------------------------------------------------------- hospital materials: vinyl floor tiles, painted walls, ceiling tiles
function hospMaterials() {
  if (MAT.hospFloor) return;
  const cv = (n, draw) => { const c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n); return c; };
  const r = makeRng(77);
  const floor = cv(256, (g, n) => {
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const k = (i + j) % 2 ? 216 : 226; g.fillStyle = `rgb(${k},${k - 4},${k - 14})`; g.fillRect(i * n / 2, j * n / 2, n / 2, n / 2); }
    for (let q = 0; q < 1400; q++) { const v = 150 + r() * 70; g.fillStyle = `rgba(${v},${v - 6},${v - 18},0.5)`; g.fillRect(r() * n, r() * n, 1.5, 1.5); }
    g.fillStyle = 'rgba(90,86,76,0.55)'; for (const t of [0, n / 2]) { g.fillRect(t, 0, 2, n); g.fillRect(0, t, n, 2); }
  });
  const wallC = cv(128, (g, n) => { g.fillStyle = '#d9dccf'; g.fillRect(0, 0, n, n); for (let q = 0; q < 500; q++) { const v = 200 + r() * 30; g.fillStyle = `rgba(${v},${v + 2},${v - 8},0.35)`; g.fillRect(r() * n, r() * n, 2, 2); } });
  const ceil = cv(128, (g, n) => { g.fillStyle = '#e6e6e0'; g.fillRect(0, 0, n, n); g.fillStyle = 'rgba(150,150,140,0.5)'; for (let q = 0; q < 260; q++) g.fillRect(r() * n, r() * n, 1, 1); g.fillStyle = '#9a9a92'; g.fillRect(0, 0, n, 3); g.fillRect(0, 0, 3, n); });
  MAT.hospFloor = new THREE.MeshStandardMaterial({ map: toTex(floor, true, 1), roughness: 0.38, metalness: 0 });
  MAT.hospWall = new THREE.MeshStandardMaterial({ map: toTex(wallC, true, 1), roughness: 0.85, metalness: 0 });
  MAT.hospCeil = new THREE.MeshStandardMaterial({ map: toTex(ceil, true, 1), roughness: 0.9, metalness: 0 });
  MAT.hospBand = new THREE.MeshStandardMaterial({ color: C(0x5d8c7b), roughness: 0.6 });
  TILES.hospFloor = 2.4; TILES.hospWall = 2.5; TILES.hospCeil = 1.2;
}
// a floor slab with a ceiling-tile underside
function hSlab(x, z, w, d, top, th = 0.25, key = 'hospFloor') { slab(x, z, w, d, top, key, th); batchAdd('hospCeil', scaledPlane(w, d, 1.2), mat4(x, top - th - 0.012, z, Math.PI / 2, 0, 0), false); }
// a strip along a corridor wall (wainscot band, handrail) broken at the doorways: gaps [[x, width]]
function hStrip(z, xa, xb, gaps, fn) {
  const a = Math.min(xa, xb), b = Math.max(xa, xb), cut = gaps.map(g => [g[0] - g[1] / 2 - 0.1, g[0] + g[1] / 2 + 0.1]).sort((p, q) => p[0] - q[0]);
  let u = a; for (const [g0, g1] of cut.concat([[b, b]])) { if (g0 - u > 0.2) fn((u + g0) / 2, g0 - u, z); u = Math.max(u, g1); }
}

function buildHospital() {
  buildMap2Materials(); hospMaterials();
  const H = HOSP.H, OUT = HOSP.OUT, ZO = HOSP.ZO, OK = 'hospWall', IK = 'hospWall';
  for (const q of [-1, 1]) { floorQuad(0, q * 42, 100, 16, 0, 'asphalt', 5); floorQuad(q * 45, 0, 10, 68, 0, 'asphalt', 5); }
  floorQuad(0, 0, OUT * 2, ZO * 2, 0.01, 'hospFloor', 2.4);
  // ---- the two halves (s = 1 south, -1 north), each built for the east and west side (sx)
  symZ((s, Z, D) => {
    for (const y of [0, H]) {
      const up = y > 0;
      // outer wall along z = 34 (main entrance on the ground floor)
      const winS = [-36, -29, -23, -17, -11, 11, 17, 23, 29, 36].map(c => [c, 1.6, 1.1, 1.4]);
      hWX(Z(ZO), -OUT, OUT, y, OK, up ? winS.concat([[-5, 2.4, 1.1, 1.4], [0, 2.4, 1.1, 1.4], [5, 2.4, 1.1, 1.4]]) : winS.concat([[0, 4.4, 0, 3.2], [-5, 2.6, 0.6, 1.9], [5, 2.6, 0.6, 1.9]]), 0.4);
      for (const sx of [1, -1]) {
        const X = v => v * sx;
        // outer side wall x = +-40 (ground: an exit at the end of each corridor)
        hWZ(X(OUT), 0, Z(ZO), y, OK, (up ? [[12, 2, 1.1, 1.4], [25.5, 1.6, 1.1, 1.4]] : [[12, 2.2, 0, 2.6], [25.5, 1.6, 0, 2.4]]).concat([[5, 1.6, 1.1, 1.4], [19, 1.6, 1.1, 1.4], [30.5, 1.6, 1.1, 1.4]]).map(q => [Z(q[0]), q[1], q[2], q[3]]), 0.4);
        // corridor A, south side (z = 14): a door into each row-1 room
        hWX(Z(14), X(8), X(OUT), y, IK, [12, 20, 28, 36].map(c => [X(c), 1.4]));
        // corridor A, north side (z = 10): rooms A, B and the stairwell
        hWX(Z(10), X(10), X(OUT), y, IK, [[X(16), 1.4], [X(28), 1.4], [X(up ? 35 : 37), 1.3]]);
        // corridor B (z 24..27)
        hWX(Z(24), X(8), X(OUT), y, IK, [12, 20, 28, 36].map(c => [X(c), 1.3]));
        hWX(Z(27), X(8), X(OUT), y, IK, [11, 17, 23, 29, 36].map(c => [X(c), 1.3]));
        // room dividers
        for (const c of [16, 24, 32]) hWZ(X(c), Z(14), Z(24), y, IK);
        for (const c of [14, 20, 26, 32]) hWZ(X(c), Z(27), Z(ZO), y, IK);
        // lobby side walls (x = +-8), with a door to corridor B
        hWZ(X(8), Z(14), Z(ZO), y, IK, [[Z(25.5), 1.8]]);
        // rooms A | B | stairwell between the atrium and corridor A
        hWZ(X(22), Z(0), Z(10), y, IK, [[Z(5), 1.3]]);
        hWZ(X(34), Z(0), Z(10), y, IK);
        // the atrium side wall: a door on the ground floor, open windows looking into the atrium upstairs
        hWZ(X(10), Z(0), Z(10), y, IK, up ? [[Z(5), 3.2, 1.0, 1.4]] : [[Z(5), 1.6], [Z(8.3), 1.6, 1.0, 1.4]], 0.3);
        // corridor handrail bumpers and a wayfinding stripe
        if (!up) floorQuad(X(25), Z(12), 30, 0.18, 0.012, s > 0 ? 'paintBlue' : 'paintGreen', 1);
        else floorQuad(X(25), Z(12), 30, 0.18, H + 0.012, s > 0 ? 'paintOrange' : 'paintYellow', 1);
        const gA = { 13.86: [12, 20, 28, 36].map(c => [X(c), 1.4]), 10.14: [16, 28, up ? 35 : 37].map(c => [X(c), 1.4]) };
        for (const zz of [10.14, 13.86]) hStrip(Z(zz), X(zz < 12 ? 10.2 : 8.2), X(39.8), gA[zz], (cx, len, z) => { B('hospBand', len, 1.0, 0.02, cx, y + 0.5, z, 0, 0, 0, false); B('wood', len, 0.1, 0.06, cx, y + 1.0, z, 0, 0, 0, false); });
        hStrip(Z(24.14), X(8.2), X(39.8), [12, 20, 28, 36].map(c => [X(c), 1.3]), (cx, len, z) => B('hospBand', len, 1.0, 0.02, cx, y + 0.5, z, 0, 0, 0, false));
        hStrip(Z(26.86), X(8.2), X(39.8), [11, 17, 23, 29, 36].map(c => [X(c), 1.3]), (cx, len, z) => B('hospBand', len, 1.0, 0.02, cx, y + 0.5, z, 0, 0, 0, false));
        // stairwell: ground floor up to the upper floor, climbing toward the middle of the map
        if (!up) {
          stairs(X(37), Z(9.0), D('n'), 2.0, 0, H, 'hospFloor', { railKey: 'steel' });
          rail(X(36), Z(2.2), X(36), Z(8.0), H, { key: 'steel' }); rail(X(38), Z(2.2), X(38), Z(8.0), H, { key: 'steel' }); rail(X(36), Z(8.0), X(38), Z(8.0), H, { key: 'steel' });
        }
      }
      // the upper lobby: a day room with two doors onto corridor A
      if (up) hWX(Z(14), -8, 8, y, IK, [[-4, 1.6], [4, 1.6]]);
      // the atrium edge on the upper floor: a balcony rail either side of the bridge
      if (up) { rail(-10, Z(10), -1.35, Z(10), H, { key: 'steel' }); rail(1.35, Z(10), 10, Z(10), H, { key: 'steel' }); }
    }
    // ---- upper floor slab for this half (holes: the atrium and the stairwells)
    hSlab(0, Z(22), OUT * 2, 24, H);
    for (const sx of [1, -1]) {
      const X = v => v * sx;
      hSlab(X(22), Z(5), 24, 10, H); hSlab(X(35), Z(5), 2, 10, H); hSlab(X(39), Z(5), 2, 10, H);
      hSlab(X(37), Z(1.1), 2, 2.2, H); hSlab(X(37), Z(9), 2, 2, H);
    }
    // ---- ground-floor lobby: reception, entrance doors frame, signs
    nurseDesk(0, Z(22), 0, s > 0 ? 0 : 2);
    hospSign(0, 3.4, Z(33.7), s > 0 ? 2 : 0, 'paintBlue', 3.2); redCross(0, 5.9, Z(ZO + 0.25), s > 0 ? 0 : 2, 1.4);
    for (const c of [-6.5, 6.5]) B('steel', 0.12, 3.2, 0.5, c, 1.6, Z(ZO), 0, 0, 0, false);
    // ---- outside: ambulance bay with a canopy, barriers and parking
    canopy(0, Z(37), 10, 4.6, 3.6, 'sheet');
    ambulance(-8.5, Z(37.4), s > 0 ? 1 : 3); ambulance(13, Z(37.6), s > 0 ? 3 : 1);
    jersey(-20, Z(38.5), true); jersey(24, Z(38.2), true); jersey(-31, Z(37), false);
    bollards(-4, Z(35.2), 4, Z(35.2), 0, 5); trashBin(6.2, Z(35.4), 0, 'paintGreen'); cone(-14, Z(36.2)); cone(-15.2, Z(38.4)); cone(18.5, Z(36));
    for (let i = 0; i < 6; i++) floorQuad(28 + i * 2.6, Z(38.5), 0.12, 4, 0.012, 'paintWhite', 1);
    lampPost(-26, Z(40), 0, 6.5, 1, 0); lampPost(30, Z(40), 0, 6.5, -1, 0);
  });
  // ---- the middle line (z = 0) between the halves: one wall per side, doors between the matching rooms
  for (const sx of [1, -1]) {
    const X = v => v * sx;
    for (const y of [0, H]) {
      hWX(0, X(10), X(OUT), y, IK, [[X(16), 1.4], [X(28), 1.4]]);
    }
  }
  // ---- atrium: two grand stairs up to the bridge, the bridge, a skylight
  stairs(-8.05, 0, 'e', 2.2, 0, H, 'hospFloor', { railKey: 'steel' });
  stairs(8.05, 0, 'w', 2.2, 0, H, 'hospFloor', { railKey: 'steel' });
  hSlab(0, 0, 2.7, 20, H, 0.3);
  for (const x of [-1.35, 1.35]) { rail(x, -10, x, -1.1, H, { key: 'steel' }); rail(x, 1.1, x, 10, H, { key: 'steel' }); }
  for (const z of [-6, 6]) CYL('whiteTile', 0.22, 0.22, H - 0.3, 10, 0, (H - 0.3) / 2, z);
  for (const z of [-6, 6]) PZ(0, 0, z, 0.44, H - 0.3, 0.44);
  planterBox(-5.5, 6.5, 0, 0, 2.4); planterBox(5.5, -6.5, 0, 0, 2.4); seatRow(5.5, 7.8, 0, 2, 4); seatRow(-5.5, -7.8, 0, 0, 4);
  // roof: solid except a glass skylight over the atrium
  const RT = H * 2 + 0.3;
  hSlab(0, -22.1, OUT * 2 + 0.4, 24.2, RT, 0.3, 'concrete'); hSlab(0, 22.1, OUT * 2 + 0.4, 24.2, RT, 0.3, 'concrete');
  hSlab(-25.1, 0, 30.2, 20, RT, 0.3, 'concrete'); hSlab(25.1, 0, 30.2, 20, RT, 0.3, 'concrete');
  slab(0, 0, 20, 20, RT, 'windowGlass', 0.1);
  for (let i = -2; i <= 2; i++) { B('dark', 0.12, 0.2, 20, i * 4, RT - 0.2, 0, 0, 0, 0, false); B('dark', 20, 0.2, 0.12, 0, RT - 0.2, i * 4, 0, 0, 0, false); }
  // parapet on the roof (seen from outside)
  for (const s of [-1, 1]) { B('panel', OUT * 2 + 0.4, 0.9, 0.3, 0, RT + 0.45, s * (ZO + 0.05)); B('panel', 0.3, 0.9, ZO * 2, s * (OUT + 0.05), RT + 0.45, 0); }
  redCross(OUT + 0.25, 6, 0, 1, 1.6); redCross(-OUT - 0.25, 6, 0, 3, 1.6);
  // ---- lights (dim, cold, a few warm emergency lamps)
  for (const [x, y, z, c, i, d] of [[0, 7.2, 0, 0xdfe8ff, 1.8, 26], [0, 3.4, 24, 0xfff0d8, 1.3, 16], [0, 3.4, -24, 0xfff0d8, 1.3, 16],
    [-25, 3.5, 12, 0xd8e4ff, 1.1, 18], [25, 3.5, 12, 0xd8e4ff, 1.1, 18], [-25, 3.5, -12, 0xd8e4ff, 1.1, 18], [25, 3.5, -12, 0xd8e4ff, 1.1, 18],
    [-25, 7.7, 12, 0xffd0a0, 1.0, 18], [25, 7.7, -12, 0xffd0a0, 1.0, 18], [-25, 7.7, -12, 0xff9a7a, 0.9, 16], [25, 7.7, 12, 0xff9a7a, 0.9, 16]]) lampLight(x, y, z, c, i * 1.35, d * 1.15);
  for (const z of [-12, 12]) for (const y of [0, H]) for (let x = -37; x <= 37; x += 6) ceilLight(x, y ? 2 * H - 0.03 : H - 0.27, z, 1.0);
  // ---- boundary fence around the outside strip
  for (const s of [-1, 1]) { fence(-43, s * 41, 43, s * 41, 0, 2.6); fence(s * 43, -41, s * 43, 41, 0, 2.6); }
  skyline(12, 90, 140, 10, 26, 'facade');
  // ---- clutter in the corridors (cover), then furnish every room
  for (const [x, z, q, f] of [[-18.5, 11, 1, gurney], [31, -12.8, 1, gurney], [-30, 25.5, 1, wheelchair], [20.5, -25.6, 3, gurney], [-12.5, -11.2, 0, wheelchair], [14, 12.9, 0, crashCart], [-3.5, 12.3, 1, gurney], [38.5, 25.2, 1, crashCart], [-38.5, -25.4, 1, wheelchair]])
    f(x, z, 0, q);
  for (const [x, z, q, f] of [[-20, -11, 1, gurney], [18, 12.8, 1, gurney], [-33, 12.6, 0, wheelchair], [32.5, -25.5, 1, gurney], [-14, 25.5, 1, crashCart]]) f(x, z, H, q);
  hospFurnish();
}
// themes per room, per half (south s = 1 is the emergency side, north s = -1 the surgery side)
function hospFurnish() {
  const H = HOSP.H, gh = H - 0.27, uh = H - 0.03, OUT = HOSP.OUT, ZO = HOSP.ZO;
  const R = (xa, xb, za, zb, y, th, o = {}) => fillRoom(Math.min(xa, xb), Math.min(za, zb), Math.max(xa, xb), Math.max(za, zb), y, th, Object.assign({ rug: false, h: y ? uh : gh }, o));
  for (const s of [1, -1]) for (const sx of [1, -1]) {
    const X = v => v * sx, Z = v => v * s, south = s > 0;
    // rooms A and B (z 0..10)
    if (!south) { opTable(X(16), Z(5), 0, 1); autopsyTable(X(28), Z(5), 0, sx > 0 ? 1 : 0); }
    else { curtain(X(13.4), Z(5), 0, 0, 3.2); curtain(X(18.6), Z(5), 0, 0, 3.2); }
    R(X(10.15), X(21.875), Z(0.125), Z(9.875), 0, south ? 'er' : 'surgery', { art: false });
    R(X(22.125), X(33.875), Z(0.125), Z(9.875), 0, south ? (sx > 0 ? 'xray' : 'nurse') : (sx > 0 ? 'morgue' : 'lab'), { art: false });
    R(X(10.15), X(21.875), Z(0.125), Z(9.875), H, south ? 'ward' : 'lab');
    R(X(22.125), X(33.875), Z(0.125), Z(9.875), H, south ? 'ward' : 'office');
    // row 1 (z 14..24), row 2 (z 27..34) on both floors
    const r1 = [[8, 16], [16, 24], [24, 32], [32, 40]], r2 = [[8, 14], [14, 20], [20, 26], [26, 32], [32, 40]];
    r1.forEach(([a, b], i) => {
      for (const y of [0, H]) R(X(a + 0.125), X(b - (b === OUT ? 0.2 : 0.125)), Z(14.125), Z(23.875), y, y ? (i % 2 ? 'office' : 'ward') : south ? (i === 1 ? 'nurse' : 'ward') : (i % 2 ? 'lab' : 'ward'));
    });
    r2.forEach(([a, b], i) => {
      for (const y of [0, H]) R(X(a + 0.125), X(b - (b === OUT ? 0.2 : 0.125)), Z(27.125), Z(ZO - 0.2), y, (i + (y ? 1 : 0)) % 3 === 0 ? 'supply' : (i + (y ? 1 : 0)) % 3 === 1 ? 'office' : 'ward', { max: 6 });
    });
  }
  // lobbies: waiting seats on the ground floor, a day room upstairs
  for (const s of [1, -1]) {
    fillRoom(-7.875, s > 0 ? 24.5 : -33.8, 7.875, s > 0 ? 33.8 : -24.5, 0, 'waiting', { rug: false, h: gh, lights: false, max: 8 });
    fillRoom(-7.875, s > 0 ? 14.125 : -33.8, 7.875, s > 0 ? 33.8 : -14.125, H, 'waiting', { rug: false, h: uh, max: 10 });
  }
}
defineMap({
  id: 'blackwell', size: 'large', planCut: 4.0, name: 'BLACKWELL HOSPITAL', place: 'Abandoned hospital, dusk', desc: 'A huge two-storey hospital, almost all indoors. Fight down the long corridors, through the wards, the ER and the morgue, or take the bridge over the atrium.',
  play: [-43, 43, -41, 41], build: buildHospital,
  env: { top: 0x2e3a52, horizon: 0xb08a6a, fog: 0.009, sun: [-40, 14, 30], sunCol: 0xffb07a, sunI: 1.5, skySun: 0xff9a60, hemiSky: 0xc8d0e0, hemiGround: 0x6a665e, exposure: 1.25 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 37.5 }, { x: 0, z: -37.5 }],
    hp: [{ x: -5, z: -5 }, { x: 4, z: 18.5 }, { x: 5, z: 5 }, { x: -4, z: -18.5 }, { x: 0, z: -5, y: 4.2 }],
    flags: [{ x: 0, z: 37.5 }, { x: 0, z: -37.5 }],
    sites: [{ x: -16, z: -5, n: 'A' }, { x: 28, z: -19, n: 'B' }],
  },
  menu: { x: 0, z: 0, r: 8, y: 2.6 },
  navPts: [{ x: 0, z: -5, y: 4.2 }, { x: 30, z: 12, y: 4.2 }, { x: -37, z: 1, y: 4.2 }, { x: -30, z: 30 }, { x: 28, z: -5 }, { x: 36, z: -25.5 }, { x: -20, z: -25.5, y: 4.2 }],
  views: [[0, 1.7, 39, 0, 2, 20], [0, 5.9, -9, 0, 3, 9], [-36, 1.7, 12, 10, 1.5, 12], [-6, 1.7, 15, 3, 1.2, 30], [12, 1.7, -2, 20, 1, -9], [-38, 5.9, -12, 10, 5.4, -12], [-27, 5.9, 18, -20, 4.8, 23], [26, 1.7, 2, 31, 0.8, 8]],
});
