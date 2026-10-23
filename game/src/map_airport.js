/* ================================================================== ZOMBIES map: TERMINAL 9 (chapter three of the story)
   The airport cargo terminal at night, where Flight 909 waits with the last of the NIGHTSHADE. Built for zombies:
     START   - the CARGO OFFICE (south): forms, a vending machine, the locked front doors.
     MIDDLE  - the BAGGAGE HALL: the hub, a baggage carousel in the middle to loop round, a departures board.
     WEST    - DEPARTURES: the gate lounge with rows of seats and the DUTY FREE shop in the middle (a loop).
     EAST    - CUSTOMS & QUARANTINE: x-ray lanes, sniffer-dog kennels and the room of confiscated drugs.
     NORTH   - THE APRON (outdoors): FLIGHT 909 itself - walk up the cargo ramp or the airstairs into its hold, where
               the gun upgrader is - with the control tower, cargo cans and baggage tugs. Three paid ways out to it.
   BAGGAGE CHUTES (the launch pads) shoot you between the office, departures, customs and the apron once the power
   is on. Only in zombies. Plane hold floor at 1.6 m; everything else on the ground. */
const AIRP = { flick: [], fx: [] };
function airpMaterials() {
  if (MAT.termFloor) return;
  const std = (set, o) => new THREE.MeshStandardMaterial(Object.assign({ map: set.map, bumpMap: set.bump, bumpScale: 0.01, roughness: 0.9, metalness: 0 }, o));
  const cv = (n, draw) => { const c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n); return c; };
  const r = makeRng(909);
  const tile = cv(256, (g, n) => { g.fillStyle = '#b8b6ae'; g.fillRect(0, 0, n, n); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 176 + r() * 18 | 0; g.fillStyle = `rgb(${v},${v - 2},${v - 8})`; g.fillRect(i * 64 + 1, j * 64 + 1, 62, 62); } for (let q = 0; q < 26; q++) { g.fillStyle = `rgba(60,50,40,${0.05 + r() * 0.15})`; g.beginPath(); g.arc(r() * n, r() * n, 6 + r() * 30, 0, TAU); g.fill(); } });
  MAT.termFloor = new THREE.MeshStandardMaterial({ map: toTex(tile, true, 1), roughness: 0.35 });
  MAT.termWall = std(TEX.concrete, { color: C(0xd8d6ce), roughness: 0.8 });
  MAT.termDark = std(TEX.concrete, { color: C(0x3a3e44), roughness: 0.7 });
  MAT.carpetBlue = std(TEX.concrete, { color: C(0x2e3c5c), roughness: 1, bumpScale: 0.02 });
  MAT.planeWhite = new THREE.MeshStandardMaterial({ color: C(0xe8eaec), roughness: 0.35, metalness: 0.3 });
  MAT.planeStripe = new THREE.MeshStandardMaterial({ color: C(0x2a8a3a), roughness: 0.4, metalness: 0.3 });
  MAT.planeGrey = new THREE.MeshStandardMaterial({ color: C(0x8a9096), roughness: 0.5, metalness: 0.6 });
  MAT.belt = new THREE.MeshStandardMaterial({ color: C(0x1a1a1c), roughness: 0.9 });
  MAT.blueLight = new THREE.MeshStandardMaterial({ color: C(0x000820), emissive: C(0x3a7aff), emissiveIntensity: 2.4 });
  MAT.redLight2 = new THREE.MeshStandardMaterial({ color: C(0x200000), emissive: C(0xff2a1a), emissiveIntensity: 2.4 });
  MAT.floodLight = new THREE.MeshStandardMaterial({ color: C(0x222018), emissive: C(0xfff0c0), emissiveIntensity: 2.2 });
  const board = cv(512, (g, n) => {
    g.fillStyle = '#0a0c10'; g.fillRect(0, 0, n, n); g.font = 'bold 30px monospace'; g.fillStyle = '#ffd24a'; g.fillText('DEPARTURES', 20, 50);
    const rows = [['909', 'EVERYWHERE', 'BOARDING'], ['412', 'CHICAGO', 'CANCELLED'], ['118', 'DENVER', 'CANCELLED'], ['733', 'MIAMI', 'CANCELLED'], ['260', 'SEATTLE', 'CANCELLED'], ['051', 'BOSTON', 'CANCELLED'], ['666', 'ROME', 'CANCELLED']];
    g.font = 'bold 24px monospace'; rows.forEach((rw, i) => { g.fillStyle = i ? '#c8c8c8' : '#7aff7a'; g.fillText(rw[0], 20, 110 + i * 52); g.fillText(rw[1], 110, 110 + i * 52); g.fillStyle = i ? '#ff5a4a' : '#7aff7a'; g.fillText(rw[2], 330, 110 + i * 52); });
  });
  MAT.depBoard = new THREE.MeshStandardMaterial({ map: toTex(board, true, 1), emissive: C(0xffffff), emissiveMap: toTex(board, true, 1), emissiveIntensity: 0.6 });
  const sign = (txt, col, sub) => { const c = cv(256, (g) => { g.fillStyle = '#101418'; g.fillRect(0, 0, 256, 256); g.fillStyle = col; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText(txt, 128, 120); if (sub) { g.font = '18px sans-serif'; g.fillStyle = '#ccc'; g.fillText(sub, 128, 160); } }); const t = toTex(c, true, 1); return new THREE.MeshStandardMaterial({ map: t, emissive: C(0xffffff), emissiveMap: t, emissiveIntensity: 0.5 }); };
  MAT.signDuty = sign('DUTY FREE', '#ffd24a', 'tax free · open 24h'); MAT.signCustoms = sign('CUSTOMS', '#ff7a5a', 'nothing to declare?'); MAT.signGate = sign('GATE 9', '#7adf6a', 'flight 909'); MAT.signBaggage = sign('BAGGAGE', '#5ab4ff', 'reclaim · carousel 9');
  const fuse = cv(512, (g, n) => { g.fillStyle = '#e8eaec'; g.fillRect(0, 0, n, n); g.fillStyle = '#2a8a3a'; g.fillRect(0, 300, n, 40); g.fillStyle = '#1a1a1a'; g.font = 'bold 72px sans-serif'; g.fillText('LAZARUS AIR CARGO', 20, 240); g.font = 'bold 48px sans-serif'; g.fillText('909', 420, 420); });
  MAT.planeLogo = new THREE.MeshStandardMaterial({ map: toTex(fuse, true, 1), roughness: 0.35, metalness: 0.3 });
  TILES.termFloor = 4; TILES.termWall = 3; TILES.termDark = 3; TILES.carpetBlue = 3;
}
function apLamp(x, z, h, col = 0xfff0d0, i = 1.0, dist = 14, flick = false) { B('floodLight', 0.5, 0.06, 0.5, x, h - 0.05, z, 0, 0, 0, false); const l = lampLight(x, h - 0.4, z, col, i, dist); if (flick) AIRP.flick.push({ l, i, t: rnd(0, 3), on: true }); return l; }
function apSeats(x, z, n, q) { const p = P2(x, z, 0, q); for (let i = 0; i < n; i++) { p.b('paintBlue', 0.5, 0.08, 0.5, (i - (n - 1) / 2) * 0.55, 0.45, 0); p.b('paintBlue', 0.5, 0.5, 0.06, (i - (n - 1) / 2) * 0.55, 0.72, -0.24); } p.b('steel', n * 0.55, 0.06, 0.1, 0, 0.3, 0); p.col(n * 0.55, 0.95, 0.6); }
function apSuitcase(x, z, y = 0, k = 0) { const cols = ['paintRed', 'paintBlue', 'dark', 'paintYellow', 'paintGreen']; B(cols[k % 5], 0.45, 0.62, 0.22, x, y + 0.31, z, 0, k * 0.7, 0); }
function apCart(x, z, q = 0) { const p = P2(x, z, 0, q); p.b('steel', 1.1, 0.06, 2.0, 0, 0.45, 0); for (const [dx, dz] of [[-0.5, -0.9], [0.5, -0.9], [-0.5, 0.9], [0.5, 0.9]]) p.lie('tire', 0.15, 0.1, 10, dx, 0.15, dz); for (let i = 0; i < 4; i++) p.b(['paintRed', 'paintBlue', 'dark', 'paintYellow'][i], 0.5, 0.4, 0.7, (i % 2 - 0.5) * 0.55, 0.7, (i < 2 ? -0.45 : 0.45)); p.col(1.1, 1.0, 2.0); }
function apULD(x, z, q = 0) { const p = P2(x, z, 0, q); p.b('sheet', 1.6, 1.6, 1.5, 0, 0.8, 0); p.b('steel', 1.62, 0.08, 1.52, 0, 0.04, 0); p.b('nightshade', 1.2, 0.5, 0.02, 0, 1.0, 0.76, false); p.col(1.6, 1.6, 1.5); }
function apTug(x, z, q = 0) { const p = P2(x, z, 0, q); p.b('paintYellow', 1.4, 0.9, 2.4, 0, 0.75, 0); p.b('dark', 1.2, 0.7, 0.8, 0, 1.5, 0.5); for (const [dx, dz] of [[-0.65, -0.8], [0.65, -0.8], [-0.65, 0.8], [0.65, 0.8]]) p.lie('tire', 0.3, 0.25, 12, dx, 0.3, dz); B('redLight2', 0.15, 0.1, 0.15, x, 2.0, z, 0, 0, 0, false); p.col(1.5, 1.9, 2.5); }
function apXray(x, z) { const p = P2(x, z, 0, 0); p.b('termDark', 1.4, 1.6, 2.0, 0, 0.8, 0); p.b('belt', 0.9, 0.06, 4.6, 0, 0.82, 0); p.b('dark', 1.0, 0.7, 0.04, 0, 1.1, -1.0); p.b('dark', 1.0, 0.7, 0.04, 0, 1.1, 1.0); p.b('screen', 0.5, 0.35, 0.05, 0.9, 1.5, 0.6, false); p.col(1.4, 1.6, 4.6); }
function apKennel(x, z) { const p = P2(x, z, 0, 0); p.b('steel', 1.4, 1.1, 0.06, 0, 0.55, 0.9); for (let i = -6; i <= 6; i++) p.b('steel', 0.03, 1.1, 0.03, i * 0.11, 0.55, -0.7, false); p.b('steel', 0.06, 1.1, 1.6, -0.7, 0.55, 0.1); p.b('steel', 0.06, 1.1, 1.6, 0.7, 0.55, 0.1); p.b('steel', 1.4, 0.06, 1.6, 0, 1.1, 0.1); p.col(1.5, 1.15, 1.7, 0, 0.1); }
// FLIGHT 909: fuselage along x (nose west), hold floor at 1.6, cargo ramp at the tail (east), airstairs on the south side
function apPlane() {
  const X0 = -17, X1 = 17, ZC = -28, R = 2.7, FY = 1.6;
  const tube = (r, L, key, sh) => batchAdd(key, new THREE.CylinderGeometry(r, r, L, 28, 1, true), mat4((X0 + X1) / 2, 3.4, ZC, 0, 0, Math.PI / 2), sh);   // open ended: the tail is the cargo door
  tube(R, X1 - X0, 'planeWhite', true); for (const sd of [-1, 1]) B('planeStripe', X1 - X0 - 2, 0.35, 0.06, 0, 3.0, ZC + sd * 2.69, 0, 0, 0, false);
  for (const s of [-1, 1]) batchAdd('planeLogo', new THREE.PlaneGeometry(12, 3), mat4(-2, 4.4, ZC + s * (R + 0.06), 0, s > 0 ? 0 : Math.PI, 0), false);
  // nose cone + cockpit glass
  batchAdd('planeWhite', new THREE.SphereGeometry(R, 24, 16), mat4(X0, 3.4, ZC, 0, 0, 0, 1.7, 1, 1), true);   // the nose
  B('glassDark', 0.9, 0.7, 2.6, X0 - 2.6, 4.5, ZC, 0, 0, 0.75, false);
  // tail cone and fin over the ramp
  B('planeWhite', 6, 0.3, 5.4, X1 + 1.5, 5.8, ZC, 0, 0, -0.15); B('planeWhite', 5, 6, 0.4, X1 + 1.8, 9.0, ZC, 0, 0, -0.35); B('planeStripe', 4.4, 1.2, 0.42, X1 + 2.2, 10.2, ZC, 0, 0, -0.35, false);
  for (const s of [-1, 1]) B('planeWhite', 4, 0.25, 6, X1 + 1.5, 6.0, ZC + s * 3.6, 0, 0, 0);
  // wings (overhead, no collision) and engines (collide)
  for (const s of [-1, 1]) {
    batchAdd('planeWhite', new THREE.BoxGeometry(7, 0.4, 16), mat4(-1, 2.6, ZC + s * 10.5, 0, s * 0.25, 0), true);
    CYL('planeGrey', 1.0, 0.9, 3.4, 18, -2.5, 1.6, ZC + s * 8.2, 0, 0, Math.PI / 2); CYL('dark', 0.8, 0.8, 0.1, 18, -4.2, 1.6, ZC + s * 8.2, 0, 0, Math.PI / 2, false); PZ(-2.5, 0.6, ZC + s * 8.2, 3.4, 2.0, 2.0);
    B('redLight2', 0.2, 0.2, 0.2, -1, 2.7, ZC + s * 18.4, 0, 0, 0, false);
  }
  // landing gear
  for (const [x, z] of [[X0 + 2, ZC], [3, ZC - 1.6], [3, ZC + 1.6]]) { CYL('dark', 0.1, 0.1, 1.1, 8, x, 0.95, z); CYL('tire', 0.45, 0.45, 0.4, 14, x, 0.45, z, Math.PI / 2, 0, 0); PZ(x, 0, z, 0.9, 1.0, 0.6); }
  // the hold: floor, side walls (inside the skin), a ceiling, the front bulkhead
  blk((X0 + 1 + X1 - 1) / 2, ZC, X1 - X0 - 2, 3.4, FY, 'planeGrey', { walk: true });
  wall(X0 + 1, ZC + 1.75, X1 - 1, ZC + 1.75, 3.2, 'termWall', { y: FY, t: 0.2, glass: false, holes: [{ at: (2 - (X0 + 1)), w: 1.6, b: 0, h: 2.4 }] });   // south side: the airstair door at x = 2
  wall(X0 + 1, ZC - 1.75, X1 - 1, ZC - 1.75, 3.2, 'termWall', { y: FY, t: 0.2, glass: false });
  blk(X0 + 1, ZC, 0.2, 3.5, 3.2, 'termDark', { y: FY });
  blk((X0 + X1) / 2, ZC, X1 - X0 - 2, 3.5, 0.15, 'termDark', { y: FY + 3.2, noCol: true });
  for (let x = X0 + 3; x < X1 - 2; x += 3) { lampLight(x, FY + 2.9, ZC, 0xd8e8ff, 0.5, 6); B('floodLight', 0.8, 0.04, 0.2, x, FY + 3.12, ZC, 0, 0, 0, false); }
  ramp(X1 + 6, ZC, 'w', 3.2, 7, 0, FY, 'planeGrey');   // the cargo ramp at the tail, up to the hold floor
  for (const s of [-1, 1]) rail(X1 + 6, ZC + s * 1.65, X1 - 1, ZC + s * 1.65, 0, { h: 1.0 });
  stairs(2, ZC + 1.85 + 2.52, 'n', 1.4, 0, FY, 'steel');   // the airstairs up to the side door (6 steps, 2.5 m)
  for (const s of [-1, 1]) rail(2 + s * 0.75, ZC + 4.4, 2 + s * 0.75, ZC + 1.95, 0, { h: 1.0 });
  for (let x = X0 + 4; x < X1 - 3; x += 1.6) wkPallet(x, ZC - 1.05, FY, (x * 3 | 0) % 2 + 1);
}

function buildAirport() {
  buildMap2Materials(); worksMaterials(); airpMaterials(); AIRP.flick = []; AIRP.fx = [];
  floorQuad(0, 0, 88, 84, 0, 'asphalt', 5);
  floorQuad(0, 33, 24, 14, 0.03, 'termFloor', 4); floorQuad(0, 5, 24, 42, 0.03, 'termFloor', 4);
  floorQuad(-27, 5, 30, 42, 0.03, 'carpetBlue', 3); floorQuad(27, 5, 30, 42, 0.03, 'termFloor', 4);
  for (let x = -40; x <= 40; x += 4) { B('paintYellow', 2, 0.01, 0.15, x, 0.02, -21, 0, 0, 0, false); }   // apron markings
  for (let z = -38; z <= -18; z += 4) B('paintYellow', 0.15, 0.01, 2, 24, 0.02, z, 0, 0, 0, false);
  // outside: solid, and the runway lights beyond the fence
  for (const [x, z, w, d] of [[0, -42.1, 92, 3.7], [0, 42.1, 92, 3.7], [-43.4, 0, 2.3, 92], [43.4, 0, 2.3, 92]]) blk(x, z, w, d, 9, 'dark', { noDraw: true });
  floorQuad(0, -52, 200, 14, -0.02, 'asphalt', 6);
  for (let x = -90; x <= 90; x += 6) { B(x % 12 ? 'blueLight' : 'floodLight', 0.25, 0.08, 0.25, x, 0.05, -46, 0, 0, 0, false); B('floodLight', 0.25, 0.08, 0.25, x, 0.05, -52, 0, 0, 0, false); }
  // ---- outer walls (terminal) and the apron fence
  wkZ(-42, -16, 40, 6, 'termWall', [[10, 1.6, 1.0, 1.4], [-4, 1.6, 1.0, 1.4]]); wkZ(42, -16, 40, 6, 'termWall', [[10, 1.6, 1.0, 1.4], [-4, 1.6, 1.0, 1.4]]);
  wkX(40, -42, 42, 4.5, 'termWall');
  for (const s of [-1, 1]) { blk(s * 42, -28, 0.2, 24, 3.2, 'fence', { noDraw: false }); }
  blk(0, -40, 84, 0.2, 3.2, 'fence');
  for (let x = -42; x <= 42; x += 4) CYL('steel', 0.05, 0.05, 3.3, 6, x, 1.65, -40, 0, 0, 0, false);
  // ---- inner walls
  wkZ(-12, 26, 40, 4.5, 'termWall'); wkZ(12, 26, 40, 4.5, 'termWall');                       // the cargo office sides
  wkX(26, -42, -12, 6, 'termWall'); wkX(26, 12, 42, 5, 'termWall');                           // departures / customs south walls
  wkX(26, -12, 12, 7, 'termWall', [[0, 8, 0, 4]]);                                            // office -> baggage hall (door)
  wkZ(-12, -16, 26, 7, 'termWall', [[5, 6, 0, 4]]); wkZ(12, -16, 26, 7, 'termWall', [[5, 6, 0, 4]]);   // the hall's side doors
  // the glass wall to the apron (north), with three ways out
  const glassHoles = (a, b, door) => { const h = []; for (let x = a + 2; x < b - 1; x += 3) if (Math.abs(x - door) > 3) h.push([x, 2.4, 0.9, 1.9]); h.push([door, door === 0 ? 6 : 4, 0, 4]); return h; };
  wkX(-16, -42, -12, 6, 'termWall', glassHoles(-42, -12, -27), { glass: true }); wkX(-16, -12, 12, 7, 'termWall', glassHoles(-12, 12, 0), { glass: true }); wkX(-16, 12, 42, 5, 'termWall', glassHoles(12, 42, 27), { glass: true });
  // roofs
  wkRoof(-12, 12, 26, 40, 4.5, 'termDark'); wkRoof(-12, 12, -16, 26, 7, 'termDark'); wkRoof(-42, -12, -16, 26, 6, 'termDark'); wkRoof(12, 42, -16, 26, 5, 'termDark');

  // ================= CARGO OFFICE (start)
  blk(-6, 37.5, 5, 1.2, 1.05, 'termDark'); B('steel', 5.1, 0.06, 1.3, -6, 1.08, 37.5);   // the front counter
  for (let i = 0; i < 6; i++) B('cloth1', 0.3, 0.02, 0.4, -7.5 + i * 0.5, 1.12, 37.5 + (i % 2) * 0.1, 0, i * 0.3, 0, false);
  vendingPair(8.5, 38.6, 0, 2); apSeats(-3, 30, 4, 0); apSeats(3, 30, 4, 0);
  for (let i = 0; i < 6; i++) apSuitcase(9 + (i % 3) * 0.6, 28 + (i / 3 | 0) * 0.5, 0, i);
  B('glassDark', 6, 3, 0.1, 0, 1.6, 39.75, 0, 0, 0, false);   // the locked front doors
  apLamp(-5, 33, 4.4); apLamp(5, 33, 4.4, 0xfff0d0, 0.9, 12, true);
  batchAdd('signBaggage', new THREE.PlaneGeometry(2.4, 2.4), mat4(0, 5.6, 26.27, 0, 0, 0), false);

  // ================= BAGGAGE HALL (the hub): carousel 9
  for (const z of [2, 8]) { blk(0, z, 10, 1.2, 0.6, 'termDark'); B('belt', 10, 0.04, 1.0, 0, 0.62, z, 0, 0, 0, false); }
  for (const x of [-5, 5]) { blk(x, 5, 1.2, 4.8, 0.6, 'termDark'); B('belt', 1.0, 0.04, 4.8, x, 0.62, 5, 0, 0, 0, false); }
  blk(0, 5, 8.8, 4.8, 0.4, 'termDark', { noCol: true }); B('steel', 1.0, 3.2, 1.0, 0, 2.0, 5); PZ(0, 0, 5, 9, 0.6, 5);
  for (let i = 0; i < 14; i++) apSuitcase(-4.5 + (i % 7) * 1.5, i < 7 ? 2 : 8, 0.62, i);
  batchAdd('depBoard', new THREE.PlaneGeometry(4.2, 4.2), mat4(-6, 4.2, 25.72, 0, Math.PI, 0), false);
  batchAdd('signGate', new THREE.PlaneGeometry(2.2, 2.2), mat4(0, 5.4, -15.72, 0, 0, 0), false);
  for (const [x, z] of [[-6, 16], [6, 16], [-6, -6], [6, -6]]) apLamp(x, z, 6.9, 0xe8f0ff, 1.0, 16, x > 0 && z < 0);
  for (const [x, z] of [[-9, 20], [9, -12], [-9, -12]]) apCart(x, z, (x * z > 0) ? 0 : 1);

  // ================= DEPARTURES (gate lounge)
  blk(-27, 5, 8, 7, 3.2, 'termWall'); B('glassDark', 8.1, 2.2, 7.1, -27, 1.4, 5, 0, 0, 0, false);   // the duty free shop
  batchAdd('signDuty', new THREE.PlaneGeometry(2.4, 2.4), mat4(-27, 4.4, 8.56, 0, 0, 0), false); batchAdd('signDuty', new THREE.PlaneGeometry(2.4, 2.4), mat4(-27, 4.4, 1.44, 0, Math.PI, 0), false);
  for (const z of [16, 19, 22]) for (const x of [-36, -30, -24, -18]) apSeats(x, z, 5, 2);
  for (const z of [-6, -10]) for (const x of [-36, -30, -20]) apSeats(x, z, 5, 0);
  for (const z of [-2, 12]) B('belt', 22, 0.04, 1.4, -27, 0.03, z, 0, 0, 0, false);   // moving walkways
  for (const [x, z] of [[-36, 12], [-18, 12], [-36, -2], [-18, -2], [-27, 20], [-27, -10]]) apLamp(x, z, 5.9, 0xfff0d0, 0.9, 13, x === -18 && z === -2);

  // ================= CUSTOMS & QUARANTINE
  for (const x of [18, 24, 30]) apXray(x, 6);
  for (const x of [17, 20, 23]) apKennel(x, -10);
  batchAdd('signCustoms', new THREE.PlaneGeometry(2.2, 2.2), mat4(27, 3.8, 25.72, 0, Math.PI, 0), false);
  wkX(14, 30, 42, 5, 'termWall', [[34, 2.4, 0, 2.6]]); wkZ(30, 14, 26, 5, 'termWall');          // the confiscation room
  for (let i = 0; i < 5; i++) wkPallet(32 + (i % 3) * 1.4, 22.5 + (i / 3 | 0) * 1.4, 0, 1 + i % 2);
  for (let i = 0; i < 4; i++) B('cloth1', 0.25, 0.1, 0.15, 38 + i * 0.3, 1.1, 24.5, 0, i, 0, false);
  for (const [x, z] of [[20, 14], [34, 2], [20, -4], [36, -10], [36, 20]]) apLamp(x, z, 4.9, 0xe8f0ff, 0.9, 12, x === 36 && z === -10);

  // ================= THE APRON and FLIGHT 909
  apPlane();
  blk(35, -34, 10, 8, 4, 'termWall'); B('termDark', 10.4, 0.3, 8.4, 35, 4.1, -34); blk(37, -36, 4, 4, 14, 'termWall', { noCol: true, y: 4.2 }); B('glassDark', 5, 2, 5, 37, 19.2, -36, 0, 0, 0, false); B('termDark', 5.6, 0.4, 5.6, 37, 20.4, -36);   // the control tower
  B('redLight2', 0.4, 0.4, 0.4, 37, 21.0, -36, 0, 0, 0, false);
  for (const [x, z, q] of [[-34, -20, 0], [-30, -34, 1], [-36, -30, 0], [10, -36, 1], [28, -20, 0], [-14, -20, 1]]) apULD(x, z, q);
  apTug(-22, -36, 1); apTug(26, -24, 0); apCart(-8, -20, 1); apCart(12, -20, 1);
  for (const [x, z] of [[-30, -24], [0, -38], [18, -36], [-38, -38]]) { CYL('steel', 0.2, 0.25, 12, 8, x, 6, z); B('floodLight', 1.6, 0.4, 0.8, x, 12, z + 0.3); lampLight(x, 11.6, z + 2, 0xffe0a0, 2.4, 30); }
  for (let x = -40; x <= 40; x += 5) B('blueLight', 0.15, 0.08, 0.15, x, 0.05, -18.5, 0, 0, 0, false);
}
defineMap({
  id: 'terminal9', size: 'large', hidden: true, zombiesOnly: true, planCut: 3.4, name: 'TERMINAL 9', place: 'Airport cargo terminal, night', desc: 'The cargo terminal where Flight 909 waits with the last of the NIGHTSHADE. Baggage hall, departures, customs - and the plane itself.',
  play: [-42, 42, -40, 40], build: buildAirport,
  env: { top: 0x0a0e1c, horizon: 0x2a3040, fog: 0.009, sun: [-30, 40, 30], sunCol: 0x9ab0d4, sunI: 0.75, skySun: 0x5a6a8a, hemiSky: 0x7a8498, hemiGround: 0x3a3630, exposure: 1.4 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: { spawn: [{ x: 0, z: 34 }, { x: 0, z: -24 }], hp: [{ x: 0, z: 14 }, { x: 7, z: 14 }, { x: -6, z: 31 }], flags: [{ x: 0, z: 34 }, { x: 0, z: -24 }], sites: [{ x: -27, z: 14 }, { x: 27, z: -4 }] },
  menu: { x: 0, z: 14, r: 8, y: 2.6 },
  navPts: [{ x: 0, z: 34 }, { x: 0, z: 14 }, { x: -27, z: 16 }, { x: 27, z: 0 }, { x: 0, z: -22 }, { x: 0, z: -28, y: 1.6 }, { x: 30, z: -26 }, { x: -30, z: -28 }],
  views: [[0, 1.7, 35, 0, 2, 20], [-9, 1.7, 22, 3, 1.5, 0], [-14, 1.7, 12, -30, 1.5, 4], [14, 1.7, 14, 30, 1.5, 0], [0, 1.7, -18, 0, 3, -30], [26, 1.7, -22, 10, 2.5, -28], [0, 3.3, -28, -12, 3, -28], [-38, 1.7, -20, -10, 3, -30]],
});
function airpTick(dt) {
  if (curMap !== 'terminal9') return;
  for (const f of AIRP.flick) { if (f.steady) continue; f.t -= dt; if (f.t <= 0) { f.on = !f.on; f.t = f.on ? rnd(0.4, 5) : rnd(0.03, 0.2); f.l.intensity = f.on ? f.i : f.i * 0.1; } }
}
function airpPower() { for (const f of AIRP.flick) { f.steady = true; f.l.intensity = f.i * 1.15; } }
