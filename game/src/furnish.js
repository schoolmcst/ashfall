/* ================================================================== furnish: fill every room with believable furniture
   fillRoom(x0, z0, x1, z1, y, theme) walks the inside of each wall and places themed furniture against it. A piece
   only goes where: nothing is already there, a solid wall stands behind it (so doorways - and a margin either side
   of them - stay open, and tall pieces skip windows), the floor exists under it (upper floors have stair holes),
   0.9 m in front of it is free (walkways stay open) and it is well away from the foot of any stair. Then rugs,
   ceiling lights and pictures. Deterministic: every machine builds the same rooms. */
const ROOMS = [];   // filled by building() while a map builds: { x0, z0, x1, z1, y, fh }
// ---------------------------------------------------------------- furniture (20)
function bed(x, z, y = 0, q = 0, col = 'cloth2') { const p = P2(x, z, y, q); p.b('wood', 1.5, 0.35, 2.0, 0, 0.18, 0.05); p.b('cloth1', 1.42, 0.18, 1.9, 0, 0.44, 0.08); p.b(col, 1.44, 0.06, 1.3, 0, 0.55, 0.38, false); p.b('cloth1', 0.55, 0.12, 0.35, -0.35, 0.58, -0.68, false); p.b('cloth1', 0.55, 0.12, 0.35, 0.35, 0.58, -0.68, false); p.b('wood', 1.55, 0.9, 0.08, 0, 0.45, -0.98); p.col(1.55, 0.6, 2.05, 0, 0.03); }
function wardrobe(x, z, y = 0, q = 0) { const p = P2(x, z, y, q); p.b('wood', 1.2, 2.0, 0.6, 0, 1.0, 0); p.b('dark', 0.02, 1.8, 0.01, 0, 1.0, 0.305, false); for (const dx of [-0.08, 0.08]) p.b('steel', 0.02, 0.2, 0.03, dx, 1.05, 0.31, false); p.col(1.2, 2.0, 0.6); }
function dresser(x, z, y = 0, q = 0) { const p = P2(x, z, y, q); p.b('wood', 1.1, 0.85, 0.5, 0, 0.43, 0); for (let i = 0; i < 3; i++) p.b('steel', 0.2, 0.02, 0.02, 0, 0.2 + i * 0.26, 0.26, false); p.b('windowGlass', 0.6, 0.7, 0.02, 0, 1.3, -0.22, false); p.b('cloth3', 0.15, 0.2, 0.1, 0.35, 0.95, 0, false); p.col(1.1, 0.85, 0.5); }
function kitchenRun(x, z, y = 0, q = 0) { const p = P2(x, z, y, q); p.b('paintWhite', 2.2, 0.85, 0.6, 0, 0.43, 0); p.b('stone', 2.25, 0.05, 0.62, 0, 0.88, 0); p.b('steel', 0.5, 0.02, 0.36, -0.5, 0.905, 0, false); p.cyl('steel', 0.02, 0.02, 0.3, 6, -0.5, 1.05, -0.2, false); p.b('dark', 0.55, 0.02, 0.5, 0.6, 0.905, 0, false); for (const dx of [0.45, 0.75]) p.cyl('dark', 0.08, 0.08, 0.01, 10, dx, 0.92, 0, false); p.b('paintWhite', 2.2, 0.7, 0.35, 0, 1.85, -0.12); for (let i = 0; i < 4; i++) p.b('steel', 0.02, 0.15, 0.02, -0.85 + i * 0.55, 0.65, 0.31, false); p.col(2.25, 0.9, 0.62); }
function fridge(x, z, y = 0, q = 0) { const p = P2(x, z, y, q); p.b('paintWhite', 0.7, 1.8, 0.65, 0, 0.9, 0); p.b('dark', 0.68, 0.02, 0.02, 0, 1.2, 0.33, false); p.b('steel', 0.03, 0.4, 0.04, 0.28, 1.5, 0.34, false); p.col(0.7, 1.8, 0.65); }
function diningSet(x, z, y = 0, q = 0) { const p = P2(x, z, y, q); p.b('wood', 1.3, 0.05, 0.8, 0, 0.74, 0); for (const [dx, dz] of [[-0.58, -0.33], [0.58, -0.33], [-0.58, 0.33], [0.58, 0.33]]) p.b('wood', 0.05, 0.72, 0.05, dx, 0.36, dz, false); for (const dx of [-0.35, 0.35]) { p.b('wood', 0.42, 0.04, 0.42, dx, 0.45, 0.62, false); p.b('wood', 0.42, 0.45, 0.04, dx, 0.68, 0.82, false); } p.b('paintWhite', 0.25, 0.1, 0.25, 0.1, 0.8, 0, false); p.col(1.3, 0.78, 0.8); }
function armchair(x, z, y = 0, q = 0, col = 'cloth2') { const p = P2(x, z, y, q); p.b(col, 0.85, 0.42, 0.8, 0, 0.21, 0.05); p.b(col, 0.85, 0.55, 0.18, 0, 0.62, -0.3); for (const dx of [-0.38, 0.38]) p.b(col, 0.12, 0.6, 0.8, dx, 0.3, 0.05); p.col(0.85, 0.8, 0.85); }
function sideLamp(x, z, y = 0, q = 0) { const p = P2(x, z, y, q); p.b('wood', 0.5, 0.55, 0.45, 0, 0.28, 0); p.cyl('steel', 0.02, 0.06, 0.4, 6, 0, 0.75, 0, false); p.cyl('cloth1', 0.12, 0.2, 0.25, 10, 0, 1.05, 0, false); p.col(0.5, 0.55, 0.45); }
function goodsShelf(x, z, y = 0, q = 0) { const p = P2(x, z, y, q), ks = ['paintRed', 'paintYellow', 'paintBlue', 'paintGreen', 'paintOrange', 'paintWhite', 'cloth3']; p.b('steel', 1.8, 1.8, 0.04, 0, 0.9, -0.23); for (let r = 0; r < 4; r++) { p.b('steel', 1.8, 0.03, 0.5, 0, 0.12 + r * 0.45, 0, false); for (let i = 0; i < 6; i++) p.b(ks[(r * 3 + i) % 7], 0.22, 0.24 + ((r + i) % 3) * 0.05, 0.3, -0.72 + i * 0.29, 0.27 + r * 0.45, 0.02, false); } for (const dx of [-0.88, 0.88]) p.b('steel', 0.04, 1.8, 0.5, dx, 0.9, 0, false); p.col(1.8, 1.8, 0.5); }
function workbench(x, z, y = 0, q = 0) { const p = P2(x, z, y, q); p.b('wood', 2.0, 0.08, 0.75, 0, 0.9, 0); for (const [dx, dz] of [[-0.9, -0.3], [0.9, -0.3], [-0.9, 0.3], [0.9, 0.3]]) p.b('steel', 0.06, 0.86, 0.06, dx, 0.43, dz, false); p.b('wood', 1.9, 0.04, 0.6, 0, 0.25, 0, false); p.b('wood', 2.0, 0.9, 0.04, 0, 1.45, -0.36, false); for (let i = 0; i < 6; i++) p.b(i % 2 ? 'dark' : 'paintRed', 0.05, 0.3, 0.03, -0.75 + i * 0.3, 1.45, -0.32, false); p.b('paintBlue', 0.3, 0.15, 0.2, 0.6, 1.02, 0.05, false); p.col(2.0, 0.95, 0.75); }
function serverRack(x, z, y = 0, q = 0) { const p = P2(x, z, y, q); p.b('dark', 0.65, 2.0, 0.9, 0, 1.0, 0); for (let i = 0; i < 8; i++) p.b(i % 3 ? 'greenLight' : 'signal', 0.04, 0.02, 0.01, -0.2 + (i % 2) * 0.1, 0.3 + i * 0.2, 0.455, false); p.b('glassDark', 0.55, 1.8, 0.01, 0, 1.0, 0.452, false); p.col(0.65, 2.0, 0.9); }
function copier(x, z, y = 0, q = 0) { const p = P2(x, z, y, q); p.b('paintWhite', 0.8, 1.0, 0.6, 0, 0.5, 0); p.b('dark', 0.6, 0.05, 0.4, 0, 1.03, 0, false); p.b('screen', 0.15, 0.08, 0.02, 0.25, 0.9, 0.31, false); p.col(0.8, 1.05, 0.6); }
function labBench(x, z, y = 0, q = 0) { const p = P2(x, z, y, q); p.b('panel', 2.0, 0.9, 0.7, 0, 0.45, 0); p.b('dark', 2.05, 0.05, 0.72, 0, 0.92, 0); p.cyl('windowGlass', 0.06, 0.06, 0.22, 8, -0.6, 1.06, 0.05, false); p.cyl('windowGlass', 0.09, 0.05, 0.2, 8, -0.3, 1.05, 0.1, false); p.b('paintWhite', 0.4, 0.3, 0.3, 0.5, 1.1, -0.1, false); p.b('screen', 0.3, 0.2, 0.01, 0.5, 1.12, 0.051, false); p.b('steel', 1.8, 0.03, 0.25, 0, 1.6, -0.22, false); p.col(2.05, 0.95, 0.72); }
function fumeHood(x, z, y = 0, q = 0) { const p = P2(x, z, y, q); p.b('panel', 1.4, 0.9, 0.75, 0, 0.45, 0); p.b('panel', 1.4, 1.2, 0.2, 0, 1.5, -0.28); for (const dx of [-0.68, 0.68]) p.b('panel', 0.05, 1.2, 0.75, dx, 1.5, 0); p.b('panel', 1.4, 0.15, 0.75, 0, 2.15, 0); p.b('windowGlass', 1.3, 0.6, 0.02, 0, 1.55, 0.36, false); p.col(1.4, 2.2, 0.75); }
function seatRow(x, z, y = 0, q = 0, n = 4) { const p = P2(x, z, y, q); p.b('steel', n * 0.6, 0.05, 0.08, 0, 0.3, 0, false); for (let i = 0; i < n; i++) { const dx = (i - (n - 1) / 2) * 0.6; p.b('paintBlue', 0.52, 0.06, 0.48, dx, 0.45, 0.02); p.b('paintBlue', 0.52, 0.5, 0.05, dx, 0.72, -0.22); } for (const dx of [-(n * 0.3) + 0.1, n * 0.3 - 0.1]) p.b('steel', 0.05, 0.42, 0.4, dx, 0.21, 0, false); p.col(n * 0.6, 0.95, 0.55); }
function pictureFrame(x, y, z, q = 0, k = 'cloth3') { const p = P2(x, z, 0, q); p.b('wood', 0.7, 0.55, 0.03, 0, y, 0, false); p.b(k, 0.6, 0.45, 0.01, 0, y, 0.02, false); }
function ceilLight(x, y, z, w = 1.2) { B('signal', w, 0.04, 0.3, x, y - 0.03, z, 0, 0, 0, false); B('steel', w + 0.06, 0.03, 0.36, x, y - 0.005, z, 0, 0, 0, false); }
function rug(x, z, y, w, d, k = 'cloth3') { B(k, w, 0.012, d, x, y + 0.012, z, 0, 0, 0, false); B('cloth1', w - 0.2, 0.013, d - 0.2, x, y + 0.013, z, 0, 0, 0, false); B(k, w - 0.4, 0.014, d - 0.4, x, y + 0.014, z, 0, 0, 0, false); }
function wallClock(x, y, z, q = 0) { const p = P2(x, z, 0, q), [px, pz] = p.at(0, 0.02); batchAdd('paintWhite', new THREE.CircleGeometry(0.18, 16), mat4(px, y, pz, 0, p.a, 0), false); p.b('dark', 0.015, 0.13, 0.01, 0, y + 0.05, 0.03, false); p.b('dark', 0.09, 0.015, 0.01, 0.04, y, 0.03, false); }
function crateStack(x, z, y = 0, q = 0) { const p = P2(x, z, y, q); p.b('wood', 0.8, 0.6, 0.6, -0.42, 0.3, 0); p.b('wood', 0.8, 0.6, 0.6, 0.42, 0.3, 0); p.b('cloth2', 0.7, 0.45, 0.55, -0.2, 0.83, 0); p.col(1.65, 1.05, 0.6); }

// ---------------------------------------------------------------- themes: [width along the wall, depth, height, place(x, z, y, q)]
const FURN = {
  home: [[2.0, 0.9, 0.9, (x, z, y, q) => sofa(x, z, y, q, 'cloth3')], [2.25, 0.62, 2.2, kitchenRun], [0.7, 0.65, 1.8, fridge], [1.3, 0.8, 0.8, diningSet], [0.85, 0.85, 0.9, armchair], [1.6, 0.45, 1.4, tvWall],
    [1.2, 0.35, 2.0, bookshelf], [0.45, 0.45, 0.9, (x, z, y) => pottedPlant(x, z, y, 1.1)], [0.5, 0.45, 0.55, sideLamp]],
  bedroom: [[1.55, 2.1, 0.9, bed], [1.2, 0.6, 2.0, wardrobe], [1.1, 0.5, 0.85, dresser], [0.5, 0.45, 0.55, sideLamp], [0.85, 0.85, 0.9, (x, z, y, q) => armchair(x, z, y, q, 'cloth3')], [1.2, 0.35, 2.0, bookshelf], [1.5, 0.75, 1.2, deskPC], [0.45, 0.45, 0.9, (x, z, y) => pottedPlant(x, z, y, 1.1)]],
  office: [[1.5, 0.75, 1.2, deskPC], [0.5, 0.62, 1.35, fileCab], [1.2, 0.35, 2.0, bookshelf], [0.8, 0.6, 1.05, copier], [0.35, 0.35, 1.4, waterCooler], [1.5, 0.75, 1.2, deskPC], [0.65, 0.9, 2.0, serverRack],
    [0.45, 0.45, 0.9, (x, z, y) => pottedPlant(x, z, y, 1.1)], [1.86, 0.5, 2.0, fuseCabinets], [2.0, 0.9, 0.9, (x, z, y, q) => sofa(x, z, y, q, 'cloth2')]],
  lab: [[2.05, 0.72, 1.7, labBench], [1.4, 0.75, 2.2, fumeHood], [0.65, 0.9, 2.0, serverRack], [0.5, 0.62, 1.35, fileCab], [2.05, 0.72, 1.7, labBench], [1.5, 0.75, 1.2, deskPC], [0.7, 0.65, 1.8, fridge]],
  shop: [[1.8, 0.5, 1.8, goodsShelf], [1.8, 0.5, 1.8, goodsShelf], [0.7, 0.65, 1.8, fridge], [1.65, 0.6, 1.05, crateStack], [1.8, 0.5, 1.8, goodsShelf], [0.45, 0.45, 0.9, (x, z, y) => pottedPlant(x, z, y, 1.1)]],
  work: [[2.0, 0.75, 1.9, workbench], [0.9, 0.5, 1.05, toolChest], [2.4, 0.9, 2.0, drumRack], [1.8, 0.5, 1.8, goodsShelf], [1.65, 0.6, 1.05, crateStack], [0.6, 0.45, 1.4, weldCart], [1.86, 0.5, 2.0, fuseCabinets], [1.2, 1.2, 1.2, (x, z, y, q) => ibcTote(x, z, y, q)]],
  farm: [[2.0, 0.75, 1.9, workbench], [1.3, 1.2, 0.75, woodPile], [1.2, 1.2, 1.2, (x, z, y) => blk(x, z, 1.15, 1.15, 1.15, 'hay', { y, walk: false })], [1.65, 0.6, 1.05, crateStack], [0.9, 0.5, 1.05, toolChest], [0.8, 0.8, 0.7, (x, z, y) => milkCans(x - 0.15, z - 0.15, y)]],
  boat: [[2.0, 0.75, 1.9, workbench], [2.2, 0.6, 0.9, lobsterTraps], [1.25, 0.9, 0.6, (x, z, y, q) => fishCrates(x - 0.3, z - 0.2, y, q)], [1.65, 0.6, 1.05, crateStack], [0.9, 0.5, 1.05, toolChest], [1.8, 0.5, 1.8, goodsShelf]],
  gate: [[2.4, 0.55, 0.95, (x, z, y, q) => seatRow(x, z, y, q, 4)], [1.8, 0.55, 0.95, (x, z, y, q) => seatRow(x, z, y, q, 3)], [1.9, 0.8, 1.9, vendingPair], [0.45, 0.45, 0.9, (x, z, y) => pottedPlant(x, z, y, 1.2)], [2.4, 0.55, 0.95, (x, z, y, q) => seatRow(x, z, y, q, 4)]],
  locker: [[1.86, 0.5, 2.0, fuseCabinets], [2.0, 0.9, 0.9, (x, z, y, q) => sofa(x, z, y, q, 'cloth2')], [0.7, 0.65, 1.8, fridge], [1.3, 0.8, 0.8, diningSet], [0.35, 0.35, 1.4, waterCooler], [1.8, 0.5, 1.8, goodsShelf]],
  mosque: [[1.8, 1.0, 0.65, rugRolls], [1.2, 0.35, 2.0, bookshelf], [1.0, 1.0, 0.6, clayPots]],
};
const ART = ['cloth3', 'cloth2', 'paintGreen', 'paintOrange', 'awningStripe', 'paintBlue'];

function furnHash(a, b, c) { let h = (Math.round(a * 7) * 73856093) ^ (Math.round(b * 7) * 19349663) ^ (c * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0); }
function furnHit(minx, maxx, minz, maxz, y0, y1, pad = 0) {
  for (const b of boxes) {
    if (b.top <= y0 || b.bot >= y1) continue;
    const p = b.stair ? 1.5 : pad;
    if (b.maxx + p > minx && b.minx - p < maxx && b.maxz + p > minz && b.minz - p < maxz) return true;
  }
  return false;
}
function furnSolid(px, pz, y0, y1) { for (const b of boxes) if (b.bot <= y0 && b.top >= y1 && px > b.minx && px < b.maxx && pz > b.minz && pz < b.maxz) return true; return false; }
function furnFloor(px, pz, y) { if (y < 0.1) return true; for (const b of boxes) if (Math.abs(b.top - y) < 0.08 && px > b.minx && px < b.maxx && pz > b.minz && pz < b.maxz) return true; return false; }

// try to place one piece against side sd at position u along it; returns true if placed
function furnTry(R, sd, u, it) {
  const [w, d, h, fn] = it, y = R.y;
  const q = { n: 0, s: 2, w: 1, e: 3 }[sd], alongX = sd === 'n' || sd === 's';
  const cx = alongX ? u : sd === 'w' ? R.x0 + d / 2 + 0.06 : R.x1 - d / 2 - 0.06;
  const cz = alongX ? (sd === 'n' ? R.z0 + d / 2 + 0.06 : R.z1 - d / 2 - 0.06) : u;
  const hx = alongX ? w / 2 : d / 2, hz = alongX ? d / 2 : w / 2;
  if (cx - hx < R.x0 - 0.01 || cx + hx > R.x1 + 0.01 || cz - hz < R.z0 - 0.01 || cz + hz > R.z1 + 0.01) return false;
  if (furnHit(cx - hx, cx + hx, cz - hz, cz + hz, y + 0.05, y + Math.max(h, 0.3), 0.02)) return false;
  // a solid wall behind, reaching the piece's height (windows pass for low pieces), with a door margin either side
  const need = Math.max(1.0, Math.min(h, 2.0)), back = 0.08;
  for (let t = -w / 2 - 0.6; t <= w / 2 + 0.6 + 1e-6; t += 0.25) {
    const px = alongX ? u + t : sd === 'w' ? R.x0 - back : R.x1 + back, pz = alongX ? (sd === 'n' ? R.z0 - back : R.z1 + back) : u + t;
    if (!furnSolid(px, pz, y + 0.3, y + need)) return false;
  }
  // floor under it (upper floors) and a free strip in front of it
  for (const [ax, az] of [[cx - hx + 0.1, cz - hz + 0.1], [cx + hx - 0.1, cz - hz + 0.1], [cx - hx + 0.1, cz + hz - 0.1], [cx + hx - 0.1, cz + hz - 0.1]]) if (!furnFloor(ax, az, y)) return false;
  const f = 0.9, fx0 = alongX ? cx - hx : sd === 'w' ? cx + hx : cx - hx - f, fx1 = alongX ? cx + hx : sd === 'w' ? cx + hx + f : cx - hx;
  const fz0 = alongX ? (sd === 'n' ? cz + hz : cz - hz - f) : cz - hz, fz1 = alongX ? (sd === 'n' ? cz + hz + f : cz - hz) : cz + hz;
  if (furnHit(fx0, fx1, fz0, fz1, y + 0.05, y + 1.9, 0)) return false;
  for (const [ax, az] of [[(fx0 + fx1) / 2, (fz0 + fz1) / 2]]) if (!furnFloor(ax, az, y)) return false;
  fn(cx, cz, y, q);
  return true;
}
// fill one room: o.theme picks the furniture; o.max caps pieces; o.lights/o.art/o.rug toggle dressing
function fillRoom(x0, z0, x1, z1, y, theme, o = {}) {
  const R = { x0, z0, x1, z1, y }, list = FURN[theme] || FURN.home, max = o.max || 99;
  let n = 0, seed = furnHash(x0 + x1, z0 + z1, Math.round(y * 3) + 7); const used = new Map(), cap = o.cap || 2;
  for (const sd of ['n', 'e', 's', 'w']) {
    const alongX = sd === 'n' || sd === 's', a = alongX ? x0 : z0, b = alongX ? x1 : z1;
    for (let u = a + 0.4; u < b - 0.4 && n < max;) {
      let placed = false;
      for (let k = 0; k < list.length && !placed; k++) {
        const it = list[(seed + k) % list.length], uc = u + it[0] / 2;
        if (uc + it[0] / 2 > b - 0.05 || (used.get(it) || 0) >= cap) continue;
        if (furnTry(R, sd, uc, it)) { placed = true; n++; used.set(it, (used.get(it) || 0) + 1); u = uc + it[0] / 2 + 0.25; seed = (seed * 1103515245 + 12345) >>> 0; }
      }
      if (!placed) u += 0.5;
    }
  }
  const W = x1 - x0, D = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, H = o.h || 3.2;
  if (o.rug !== false && W > 3.2 && D > 3.2 && theme !== 'work' && theme !== 'gate' && theme !== 'farm') rug(cx, cz, y, Math.min(3.2, W * 0.45), Math.min(2.2, D * 0.4), ART[seed % ART.length]);
  if (o.lights !== false) { const nx = Math.max(1, Math.round(W / 5)), nz = Math.max(1, Math.round(D / 5)); for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) ceilLight(x0 + W * (i + 0.5) / nx, y + H, z0 + D * (j + 0.5) / nz, 1.0); }
  if (o.art !== false && theme !== 'work' && theme !== 'farm') {
    for (const [sd, i] of [['n', 0], ['s', 1], ['e', 2], ['w', 3]]) {
      const alongX = sd === 'n' || sd === 's', L = alongX ? W : D; if (L < 2.4) continue;
      for (let t = 1.2; t < L - 1.0; t += 2.6) {
        const px = alongX ? x0 + t : sd === 'w' ? x0 + 0.02 : x1 - 0.02, pz = alongX ? (sd === 'n' ? z0 + 0.02 : z1 - 0.02) : z0 + t;
        const bx = alongX ? px : sd === 'w' ? x0 - 0.08 : x1 + 0.08, bz = alongX ? (sd === 'n' ? z0 - 0.08 : z1 + 0.08) : pz;
        if (!furnSolid(bx, bz, y + 1.2, y + 2.1)) continue;   // windows and doors stay clear
        const nx = sd === 'w' ? 1 : sd === 'e' ? -1 : 0, nz = sd === 'n' ? 1 : sd === 's' ? -1 : 0, qx = px + nx * 0.3, qz = pz + nz * 0.3;
        if (furnHit(qx - (nx ? 0.22 : 0.4), qx + (nx ? 0.22 : 0.4), qz - (nz ? 0.22 : 0.4), qz + (nz ? 0.22 : 0.4), y + 1.1, y + 2.1, 0)) continue;
        if (((seed >>> i) + Math.round(t)) % 3 === 0) wallClock(px, y + 2.0, pz, { n: 0, s: 2, w: 1, e: 3 }[sd]);
        else pictureFrame(px, y + 1.65, pz, { n: 0, s: 2, w: 1, e: 3 }[sd], ART[(seed + Math.round(t * 3) + i) % ART.length]);
      }
    }
  }
  return n;
}
// every building() room recorded while the map was built (one per floor)
function fillBuildings(theme, o = {}) { let n = 0; for (const r of ROOMS) for (let f = 0; f < r.fl; f++) n += fillRoom(r.x0, r.z0, r.x1, r.z1, r.y + f * r.fh, (typeof theme === 'function' ? theme(r, f) : theme), Object.assign({ h: r.fh - 0.05 }, o)); return n; }

// record every building()'s inside (one entry, with its floors) so the dress pass can furnish it
{ const _building = building; building = function (o) { _building(o); const t = 0.35, y = o.y || 0; ROOMS.push({ w: o.w, x0: o.x - o.w / 2 + t / 2, x1: o.x + o.w / 2 - t / 2, z0: o.z - o.d / 2 + t / 2, z1: o.z + o.d / 2 - t / 2, y, fl: Math.max(1, o.floors || 1), fh: o.fh || 3.4, key: o.key }); }; }
