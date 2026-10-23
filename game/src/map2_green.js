/* ================================================================== CORE map: THE GREENHOUSE (indoor grow operation, late afternoon)
   64 x 64 m. Spawns at the north and south ends by the irrigation tanks. Three lanes run north-south:
     WEST - the drying barn: a long shed with buds hanging on racks, trim tables, and a mezzanine at each end
     MID  - the greenhouse: a glass hall with four rows of grow benches under purple lamps; low cover, plants to hide
            behind, a cross aisle in the middle. Some panes are broken out, so not every angle is behind glass
     EAST - the loading dock: an open yard with a box truck and pallets, and the raised dock along the warehouse
   Connectors: the yards at z = +-13 (planter boxes) and doors on every side of the greenhouse and barn. Power position:
   the barn mezzanines (2.8 m) see into the greenhouse through the barn's east windows, but they are lit up, open to
   the greenhouse's broken panes, and each has one stair. Mirrors north/south. */
function buildGreen() {
  buildMap2Materials();
  if (!MAT.growLamp) {
    MAT.growLamp = new THREE.MeshBasicMaterial({ color: C(0xd27aff) });
    MAT.leafGreen = new THREE.MeshStandardMaterial({ color: C(0x3f8f2c), roughness: 0.8, side: THREE.DoubleSide, emissive: C(0x0a2208) });
    MAT.budDry = new THREE.MeshStandardMaterial({ color: C(0x7a8a3a), roughness: 0.9 });
    MAT.soil = new THREE.MeshStandardMaterial({ color: C(0x3a2a1a), roughness: 1 });
  }
  floorQuad(0, 0, 80, 80, 0, 'ground', 5);
  floorQuad(0, 0, 26, 64, 0.008, 'concrete', 4);                  // the concrete apron around the greenhouse
  floorQuad(24, 0, 16, 64, 0.01, 'asphalt', 4);                   // the dock yard
  for (const s of [-1, 1]) { fence(-32.4, s * 32.4, 32.4, s * 32.4, 0, 2.8); fence(s * 32.4, -32.4, s * 32.4, 32.4, 0, 2.8); }
  const H = 4.6;
  // a weed plant on a bench: a stem and three tiers of fan leaves (decoration only)
  const plant = (x, z, y, s = 1) => {
    CYL('leafGreen', 0.02 * s, 0.03 * s, 0.9 * s, 5, x, y + 0.45 * s, z, 0, 0, 0, false);
    for (let t = 0; t < 3; t++) for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + t * 0.6, r = (0.32 - t * 0.07) * s; beam('leafGreen', x, y + (0.3 + t * 0.22) * s, z, x + Math.cos(a) * r, y + (0.42 + t * 0.22) * s, z + Math.sin(a) * r, 0.14 * s, 0.01, false); }
    batchAdd('leafGreen', new THREE.ConeGeometry(0.09 * s, 0.3 * s, 6), mat4(x, y + 1.0 * s, z), false);
  };
  // a grow bench (low cover, 0.9 m) with plants on it
  const bench = (x, z0, z1) => {
    const zc = (z0 + z1) / 2, L = Math.abs(z1 - z0);
    blk(x, zc, 1.4, L, 0.8, 'sheet', { walk: false }); B('soil', 1.3, 0.06, L - 0.1, x, 0.83, zc, 0, 0, 0, false);
    for (let z = Math.min(z0, z1) + 0.5; z < Math.max(z0, z1) - 0.3; z += 0.9) { plant(x - 0.35, z, 0.86, 1.0 + ((z * 7) % 3) * 0.1); plant(x + 0.35, z + 0.45, 0.86, 1.05); }
  };
  // ---- MID: the greenhouse (x -11..11, z -9..9)
  const pane = (at, open) => ({ at, w: 2.2, b: 0.9, h: 3.1, open });
  for (const x of [-11, 11]) wall(x, -9, x, 9, H, 'paintWhite', { t: 0.15, holes: [{ at: 9, w: 2.2, b: 0, h: 2.6 }, { at: 3.5, w: 1.4, b: 0, h: 2.4 }, { at: 14.5, w: 1.4, b: 0, h: 2.4 }, pane(1.4, x < 0), pane(6.2), pane(11.8, x > 0), pane(16.6)] });
  for (const z of [-9, 9]) wall(-11, z, 11, z, H, 'paintWhite', { t: 0.15, holes: [{ at: 11, w: 2.6, b: 0, h: 2.8 }, { at: 4, w: 1.4, b: 0, h: 2.4 }, { at: 18, w: 1.4, b: 0, h: 2.4 }, pane(7.3, z > 0), pane(14.7, z < 0), pane(1.5), pane(20.5)] });
  // the glass roof: a ridge frame you can see the sky through (no collision: nobody walks up there)
  for (const s of [-1, 1]) { batchAdd('windowGlass', new THREE.BoxGeometry(11.2, 0.04, 18.2), mat4(s * 5.5, H + 0.9, 0, 0, 0, -s * 0.16), false); }
  for (let z = -9; z <= 9; z += 3) { beam('steel', -11, H, z, 0, H + 1.8, z, 0.08, 0.08, false); beam('steel', 11, H, z, 0, H + 1.8, z, 0.08, 0.08, false); }
  B('steel', 0.12, 0.12, 18.2, 0, H + 1.8, 0, 0, 0, 0, false);
  blk(0, 0, 22.4, 18.4, 0.2, 'dark', { y: H + 1.9, noDraw: true, walk: false });   // keeps grenades and players under the glass
  floorQuad(0, 0, 21.6, 17.6, 0.012, 'tileFloor', 3);
  for (const x of [-7.5, -2.5, 2.5, 7.5]) { bench(x, -7.4, -1.2); bench(x, 1.2, 7.4); for (const z of [-4.3, 4.3]) { B('growLamp', 0.25, 0.06, 5.4, x, 3.3, z, 0, 0, 0, false); B('dark', 0.03, 0.9, 0.03, x, 3.75, z, 0, 0, 0, false); } }
  for (const [x, z] of [[-5, -4.3], [5, 4.3], [5, -4.3], [-5, 4.3]]) lampLight(x, 3.1, z, 0xc070ff, 1.1, 11);
  lampLight(0, 3.6, 0, 0xfff0dc, 0.8, 12);
  // the cross aisle: a hose reel, fertiliser sacks
  CYL('paintGreen', 0.4, 0.4, 0.5, 12, -9.8, 0.25, 0, Math.PI / 2, 0, 0); PZ(-9.8, 0, 0, 0.6, 0.8, 0.8);
  palletLoad(9.6, 0, 0, 0.9, 'cloth1');
  symZ((s, Z, D) => {
    // ---- WEST: the drying barn (x -29..-17, z 0..9 each half; the middle is open)
    wall(-29, Z(9.5), -17, Z(9.5), 5, 'redBarn', { t: 0.3, holes: [{ at: 6, w: 3, b: 0, h: 3 }, { at: 2, w: 1.4, b: 1.2, h: 1.0 }, { at: 10, w: 1.4, b: 1.2, h: 1.0 }] });
    wall(-17, Z(0), -17, Z(9.5), 5, 'redBarn', { t: 0.3, holes: [{ at: 2.6, w: 1.6, b: 0, h: 2.4 }, { at: 6.4, w: 1.6, b: 1.1, h: 1.1, open: true }] });
    wall(-29, Z(0), -29, Z(9.5), 5, 'redBarn', { t: 0.3, holes: [{ at: 4.5, w: 1.6, b: 0, h: 2.4 }] });
    slab(-23, Z(4.75), 12.6, 9.8, 5.3, 'wood', 0.3);
    floorQuad(-23, Z(4.75), 11.6, 9.2, 0.012, 'wood', 3);
    // drying racks: lines strung across with buds hanging, a trim table
    for (const x of [-26, -23, -20]) { for (let z = 1.5; z < 6.5; z += 0.7) { B('budDry', 0.18, 0.4, 0.18, x, 3.6, Z(z), 0, 0, 0, false); B('budDry', 0.14, 0.32, 0.14, x + 0.35, 3.55, Z(z + 0.3), 0, 0, 0, false); } B('dark', 0.03, 0.03, 6, x, 3.85, Z(4), 0, 0, 0, false); }
    blk(-23, Z(2.5), 3.2, 1.0, 0.85, 'wood', { walk: false }); for (const x of [-24.2, -22.8, -21.5]) B('budDry', 0.4, 0.15, 0.3, x, 0.95, Z(2.5), 0, 0, 0, false);
    // the mezzanine (2.8 m) at the far end, its stair along the west wall
    deck(-23, Z(7.6), 11.4, 3.2, 2.8, 'wood', { posts: true, rails: [s > 0 ? 'n' : 's'] });
    stairs(-28, Z(1.4), D('s'), 1.1, 0, 2.8, 'wood', { open: true });
    crate(-18.6, Z(8.2), 1.0, 2.8); lampLight(-23, 2.4, Z(3.5), 0xffd09a, 1.3, 12); lampLight(-23, 4.6, Z(7.6), 0xffd09a, 1.0, 9);
    // ---- the yards at z = 13: planter boxes as cover between the lanes
    for (const [x, z, w] of [[-13, 13.5, 3], [-5, 12.5, 3.5], [5, 14, 3], [13, 12.5, 2.6]]) { blk(x, Z(z), w, 1.0, 0.85, 'terracotta', { walk: false }); for (let i = 0; i < w / 0.8 - 0.5; i++) plant(x - w / 2 + 0.5 + i * 0.8, Z(z), 0.86, 0.9); }
    // ---- spawn: irrigation tanks, the office trailer, nutrient pallets
    for (const x of [-9, 9]) { CYL('paintWhite', 1.5, 1.5, 3.4, 16, x, 1.7, Z(27)); PZ(x, 0, Z(27), 2.9, 3.4, 2.9); B('paintGreen', 3.1, 0.15, 3.1, x, 3.45, Z(27), 0, 0, 0, false); }
    building({ x: -20, z: Z(25), w: 7, d: 4, floors: 1, fh: 3, key: 'paintWhite', floor: 'carpet', roof: 'flat', doors: [['n', 3.5], ['s', 3.5]], win: 0.6, furnish: true, inner: false });
    palletLoad(3, Z(22), 0, 1.1, 'cloth2'); palletLoad(-3.5, Z(21), 0, 1.0, 'cloth1'); barrelAt(14.5, Z(23), 'blue'); barrelAt(15.2, Z(23.8), 'blue');
    lampPost(-12, Z(30.5), 0, 6, 1, 0, true); lampPost(12, Z(30.5), 0, 6, -1, 0, true);
    // ---- EAST: the loading dock - warehouse wall, raised dock with ramps, containers
    deck(28.5, Z(5), 4, 10, 1.2, 'concrete', { rails: [] });
    ramp(28.5, Z(11.9), D('n'), 3, 2, 0, 1.2, 'concrete');
    for (const z of [3, 7]) B('rubber', 0.3, 0.6, 0.6, 26.4, 0.9, Z(z), 0, 0, 0, false);   // dock bumpers
    container(18, Z(19), false, 0, s > 0 ? 'paintGreen' : 'paintOrange');
    crate(23, Z(15), 1.2); crate(24.2, Z(15.8), 0.9); palletLoad(21, Z(9), 0, 1.2, 'cloth2'); palletLoad(29, Z(17), 0, 1.1, 'cloth1');
  });
  // warehouse wall along the dock (a big closed building face), roller doors
  wall(31, -16, 31, 16, 7, 'sheet', { t: 0.4, glass: false, holes: [{ at: 8, w: 1.4, b: 1.2, h: 2.3 }, { at: 24, w: 1.4, b: 1.2, h: 2.3 }] });
  for (const z of [-9, -1, 7]) B('steel', 0.1, 3.4, 3.4, 30.75, 2.9, z + 1, 0, 0, 0, false);
  B('worksSign', 0.1, 1.2, 8, 30.7, 5.6, 0, 0, 0, 0, false);
  // the box truck in the middle of the yard: walk round it, crouch behind the wheels
  blk(21.5, 0, 2.5, 6, 2.6, 'paintWhite', { y: 0.7, walk: false }); blk(21.5, -4, 2.4, 2, 1.9, 'paintGreen', { y: 0.7, walk: false }); B('glassDark', 2.3, 0.7, 0.1, 21.5, 2.2, -5.0, 0, 0, 0, false);
  for (const z of [-4, -1.8, 1.8]) for (const x of [20.2, 22.8]) CYL('rubber', 0.45, 0.45, 0.35, 12, x, 0.45, z, 0, 0, Math.PI / 2);
  PZ(21.5, 0, -0.5, 2.5, 0.7, 7.5);
  // the barn's middle is a covered breezeway between its halves
  floorQuad(-23, 0, 12, 4, 0.012, 'wood', 2);
  // distant scenery: rows of field crops and hills
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = 110 + (i % 3) * 15; batchAdd('leafGreen', new THREE.ConeGeometry(40 + (i % 4) * 8, 14 + (i % 5) * 4, 9), mat4(Math.cos(a) * r, 3, Math.sin(a) * r, 0, i, 0), false); }
}
defineMap({
  id: 'greenhouse', size: 'core', name: 'THE GREENHOUSE', place: 'Indoor grow operation, late afternoon', desc: 'A glass greenhouse full of grow benches between a drying barn and a loading dock. Low cover and broken panes inside, the barn mezzanines watching the glass, the truck yard on the flank.',
  play: [-32, 32, -32, 32], build: buildGreen,
  env: { top: 0x5a8ac0, horizon: 0xf0d8b0, fog: 0.008, sun: [-40, 45, 25], sunCol: 0xffe0b0, sunI: 2.2, skySun: 0xffe2b8, hemiSky: 0xd8e4ee, hemiGround: 0x6a5a3a, exposure: 1.0 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 29 }, { x: 0, z: -29 }],
    hp: [{ x: 0, z: 0 }, { x: -23, z: 0 }, { x: 22, z: 8 }, { x: -6, z: -13 }, { x: 6, z: 13 }],
    flags: [{ x: 0, z: 29.5 }, { x: 0, z: -29.5 }],
    sites: [{ x: -23, z: -5, n: 'A' }, { x: 24, z: -10, n: 'B' }],
  },
  menu: { x: 0, z: 0, r: 9, y: 2.2 },
  navPts: [{ x: -23, z: 7.6, y: 2.8 }, { x: 28.5, z: 5, y: 1.2 }, { x: 0, z: 0 }, { x: -23, z: 4 }, { x: 22, z: 12 }],
  views: [[0, 1.7, 28, 0, 1.4, 0], [0, 1.7, 8, 0, 1.2, -6], [-23, 4.5, 8.5, -11, 2, 0], [22, 1.7, 14, 22, 1.4, 0], [-9, 1.7, 13, 9, 1.5, 13]],
});
