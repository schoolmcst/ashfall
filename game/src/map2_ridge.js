/* ================================================================== LARGE map: RIDGELINE (farm valley, late afternoon)
   86 x 86 m - the big one for FFA and long-range fights. A river crosses the middle east-west; each lane has its own
   crossing, so every push has to commit to one:
     WEST - farmland: hedgerows, hay bales, a farmhouse each side; the narrow footbridge
     MID  - the old mill barn standing over the river (walk through its ground floor) and the road bridge beside it
     EAST - the ridge: a long plateau 2.6 m up with rocks and pines, crossing the river on a wooden trestle
   Power position: the barn loft (4.2 m). Hay doors on all four sides see both banks, the road bridge and the
   footbridge - but the ridge looks straight back into it, the farmhouses' upper floors cover it, and each team has
   its own stair up from the ground floor. Mirrors north/south. */
function buildRidge() {
  buildMap2Materials();
  for (const s of [-1, 1]) floorQuad(0, s * 24, 92, 41, 0, 'ground', 6);
  floorQuad(0, 0, 200, 7.4, -0.8, 'water', 6);
  floorQuad(6, 0, 6, 92, 0.012, 'asphalt', 4);                                  // the road
  for (const s of [-1, 1]) { fence(-43.4, s * 43.4, 43.4, s * 43.4, 0, 2.4); fence(s * 43.4, -43.4, s * 43.4, 43.4, 0, 2.4); }
  const bar = (x0, z0, x1, z1) => blk((x0 + x1) / 2, (z0 + z1) / 2, Math.max(0.2, Math.abs(x1 - x0)), Math.max(0.2, Math.abs(z1 - z0)), 2.6, 'dark', { noDraw: true, noRay: true, walk: false });
  const hay = (x, z, along) => { CYL('hay', 0.75, 0.75, 1.3, 14, x, 0.75, z, along ? 0 : Math.PI / 2, 0, along ? Math.PI / 2 : 0); PZ(x, 0, z, along ? 1.3 : 1.5, 1.5, along ? 1.5 : 1.3); };
  const hedge = (x, z, w, d) => { blk(x, z, w, d, 1.7, 'leaf', { walk: false }); };
  const pine = (x, z, h = 7, y = 0) => { CYL('bark', 0.12, 0.2, h * 0.4, 6, x, y + h * 0.2, z); batchAdd('leaf', new THREE.ConeGeometry(h * 0.22, h * 0.75, 7), mat4(x, y + h * 0.55, z), true); PZ(x, y, z, 0.5, h, 0.5); };
  // ---- the river banks (you can't walk into the water) and the crossings
  for (const s of [-1, 1]) {
    for (const [a, b] of [[-43, -33.25], [-30.75, -14], [-6, 3], [9, 20]]) { bar(a, s * 3.7, b, s * 3.7); B('stone', b - a, 0.9, 0.4, (a + b) / 2, -0.4, s * 3.8); }
  }
  bar(20, -3.7, 20, 3.7);
  // footbridge (west)
  slab(-32, 0, 2.5, 8, 0.15, 'wood', 0.15); rail(-33.25, -3.9, -33.25, 3.9, 0.15, { key: 'wood' }); rail(-30.75, -3.9, -30.75, 3.9, 0.15, { key: 'wood' }); bar(-33.25, -3.7, -33.25, 3.7); bar(-30.75, -3.7, -30.75, 3.7);
  // road bridge (mid)
  for (const x of [2.8, 9.2]) { blk(x, 0, 0.5, 9, 1.0, 'stone', { walk: false }); }
  floorQuad(6, 0, 6, 8, 0.02, 'asphalt', 3); carWreck(4.5, -1.5, false); jersey(7.6, 2.4, false);
  // ---- MID: the mill barn over the river (x -14..-6, z -6..6), loft at 4.2
  const BH = 7.2, LF = 4.2;
  for (const z of [-6, 6]) { wall(-14, z, -6, z, LF, 'redBarn', { t: 0.3, holes: [{ at: 4, w: 3, b: 0, h: 3.2 }] }); wall(-14, z, -6, z, BH - LF, 'redBarn', { y: LF, t: 0.3, glass: false, holes: [{ at: 4, w: 2.2, b: 0.5, h: 1.5 }] }); }
  for (const x of [-14, -6]) wall(x, -6, x, 6, BH, 'redBarn', { t: 0.3, glass: false, holes: [{ at: 6, w: 3, b: LF + 0.1, h: 2.0 }, { at: 2.2, w: 1.0, b: 1.2, h: 1.0 }, { at: 9.8, w: 1.0, b: 1.2, h: 1.0 }] });
  floorQuad(-10, 0, 7.6, 11.6, 0.02, 'wood', 2);
  const ls = (x0, x1, z0, z1) => slab((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, LF, 'wood', 0.25);
  ls(-12.6, -7.4, -5.85, 5.85); ls(-13.85, -12.6, -5.85, -3.35); ls(-13.85, -12.6, 3.45, 5.85); ls(-7.4, -6.15, -5.85, -3.45); ls(-7.4, -6.15, 3.35, 5.85);
  stairs(-13.2, 3.4, 'n', 1.15, 0, LF, 'wood', { rails: false }); stairs(-6.8, -3.4, 's', 1.15, 0, LF, 'wood', { rails: false });
  rail(-12.6, -3.35, -12.6, 3.45, LF); rail(-7.4, -3.45, -7.4, 3.35, LF);
  slab(-10, 0, 8.6, 12.6, BH + 0.25, 'redBarn', 0.25);
  batchAdd('terracotta', new THREE.ConeGeometry(7.8, 2.6, 4), mat4(-10, BH + 1.5, 0, 0, Math.PI / 4, 0, 0.62, 1, 1), true);
  for (const [x, z] of [[-10, -2], [-10, 2.5]]) hay(x, z, true); blk(-8.6, -4.6, 1.2, 1.2, 1.2, 'hay', { y: LF, walk: false }); blk(-11.6, 4.4, 1.2, 1.2, 1.2, 'hay', { y: LF, walk: false });
  lampLight(-10, 3.5, 0, 0xffd8a0, 0.8, 10); lampLight(-10, 6.6, 0, 0xffd8a0, 0.8, 10);
  CYL('wood', 2.2, 2.2, 0.5, 16, -14.6, 1.4, 0, 0, 0, Math.PI / 2); PZ(-14.6, 0, 0, 0.6, 3.6, 3.6);   // the mill wheel
  // ---- EAST: the ridge plateau (x 20..43, 2.6 m) and its trestle over the river
  const RH = 2.6;
  symZ((s, Z, D) => {
    blk(31.5, Z(23.6), 23, 39.8, RH, 'rock', { walk: true }); floorQuad(31.5, Z(23.6), 23, 39.8, RH + 0.01, 'ground', 5);
    for (const z of [12, 31]) ramp(13.6, Z(z), 'e', 3.2, 6.4, 0, RH, 'rock');
    // ridge cover: rocks, pines, a ruined wall, a radio shack
    for (const [x, z, w, d, h] of [[24, 8, 2.4, 1.8, 1.2], [33, 14, 3, 2, 1.5], [26.5, 22, 2, 2.6, 1.3], [38, 26, 2.6, 2, 1.6], [30, 33, 2.2, 2, 1.1]]) { blk(x, Z(z), w, d, h, 'rock', { y: RH, walk: h < 1.3 }); B('rock', w * 0.6, h * 0.4, d * 0.7, x + 0.3, RH + h + h * 0.15, Z(z), 0.2, 0.4, 0.1); }
    for (const [x, z, h] of [[36, 7, 8], [22, 17, 7], [41, 18, 9], [29, 28, 7.5], [40, 36, 8]]) pine(x, Z(z), h, RH);
    wall(31, Z(19), 37, Z(19), 1.6, 'stone', { y: RH, t: 0.5, holes: [{ at: 3, w: 1.2, b: 0.8, h: 0.5 }] });
    // ---- WEST: farmland - a farmhouse, hedgerows, hay bales
    building({ x: -28, z: Z(21), w: 9, d: 7, floors: 2, fh: 3.2, key: 'plaster', floor: 'wood', roof: 'tile', doors: [['e', 3.5], ['w', 3.5], [s > 0 ? 'n' : 's', 4.5]], win: 0.9, stairSide: 'w', furnish: true });
    hedge(-37, Z(11), 8, 1.2); hedge(-22, Z(11), 6, 1.2); hedge(-16.5, Z(17), 1.2, 8); hedge(-36.5, Z(31), 9, 1.2);
    for (const [x, z, a] of [[-31, 7.5, true], [-25, 15, false], [-38.5, 17, true], [-19, 26, true], [-33, 27.5, false]]) hay(x, Z(z), a);
    blk(-20.5, Z(6.5), 3.6, 0.6, 0.9, 'stone', { walk: false });
    // tractor in the field
    blk(-24, Z(32), 1.8, 3, 1.4, 'paintGreen', { walk: false }); blk(-24, Z(32) - s * 0.6, 1.4, 1.4, 1.2, 'glassDark', { y: 1.4, walk: false });
    // ---- MID: roadside - a burnt truck, a checkpoint, a bus shelter
    carWreck(4.6, Z(14), false); carWreck(7.8, Z(24), false, 'paintRed'); sandbags(10.8, Z(8.5), 3.2, true, 3); sandbags(-2.5, Z(9), 2.6, true, 3);
    blk(-1.5, Z(19), 3, 1.2, 2.4, 'glassDark', { walk: false }); B('steel', 3.2, 0.1, 1.5, -1.5, 2.45, Z(19));
    hedge(-3.5, Z(28), 7, 1.2); hedge(13, Z(21.5), 1.2, 6);
    // spawn ends: stone walls and a shed to break the long sightlines
    wall(-12, Z(35), 12, Z(35), 1.4, 'stone', { t: 0.5, holes: [{ at: 6, w: 3, b: 0, h: 1.4 }, { at: 18, w: 6, b: 0, h: 1.4 }] });
    building({ x: -18, z: Z(39.5), w: 5, d: 4, floors: 1, fh: 3, key: 'wood', floor: 'wood', roof: 'tile', doors: [['e', 2], ['w', 2]], win: 0.5, furnish: true, inner: false });
    lampPost(3, Z(5.5), 0, 6, 1, 0, true);
  });
  // trestle across the river at ridge height
  slab(27, 0, 5, 7.6, RH, 'wood', 0.3); rail(24.5, -3.8, 24.5, 3.8, RH, { key: 'wood' }); rail(29.5, -3.8, 29.5, 3.8, RH, { key: 'wood' });
  for (const z of [-2, 2]) for (const x of [24.8, 29.2]) CYL('wood', 0.18, 0.18, RH + 0.8, 6, x, RH / 2 - 0.4, z);
  B('rock', 0.4, RH + 0.8, 7.4, 20.2, RH / 2 - 0.4, 0); B('rock', 0.4, RH + 0.8, 7.4, 43.2, RH / 2 - 0.4, 0);
  // far hills
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r = 130 + (i % 3) * 25; batchAdd('leaf', new THREE.ConeGeometry(50 + (i % 4) * 10, 14 + (i % 5) * 5, 8), mat4(Math.cos(a) * r, 2, Math.sin(a) * r, 0, i, 0), false); }
}
defineMap({
  id: 'ridgeline', size: 'large', planCut: 4.0, name: 'RIDGELINE', place: 'Farm valley, late afternoon', desc: 'A big farm valley split by a river. Cross on the footbridge, through the old mill barn, over the road bridge or along the ridge. The barn loft watches every crossing.',
  play: [-43, 43, -43, 43], build: buildRidge,
  env: { top: 0x5a8ac0, horizon: 0xe8d4b0, fog: 0.005, sun: [-50, 28, 35], sunCol: 0xffd8a0, sunI: 2.4, skySun: 0xffcf90, hemiSky: 0xc8d8e8, hemiGround: 0x4a5034, exposure: 1.08 },
  grass: { count: 1400, color: 0xb8c070, avoid: (x, z) => Math.abs(z) < 4.6 || Math.abs(x - 6) < 3.6 || x > 19 || (x > -15 && x < -5 && Math.abs(z) < 7) },
  spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 39 }, { x: 0, z: -39 }],
    hp: [{ x: -10, z: 0 }, { x: -32, z: 0 }, { x: 27, z: 0, y: 2.6 }, { x: -24, z: -18 }, { x: 12, z: 18 }],
    flags: [{ x: 0, z: 39.5 }, { x: 0, z: -39.5 }],
    sites: [{ x: -26, z: -14, n: 'A' }, { x: 12, z: -15, n: 'B' }],
  },
  menu: { x: -10, z: 0, r: 16, y: 4 },
  navPts: [{ x: -10, z: -5, y: 4.2 }, { x: -10, z: 5, y: 4.2 }, { x: 27, z: 0, y: 2.6 }, { x: -32, z: 0 }, { x: -28, z: 21, y: 3.2 }],
  views: [[0, 1.7, 39, 0, 1.4, 0], [-10, 5.9, 4.6, 4, 2, -4], [27, 4.3, 14, 27, 3, -10], [-32, 1.7, 16, -32, 1.4, -10], [-6.6, 5.9, 0, 30, 3.5, 0]],
});
