/* ================================================================== CORE map: SPIRE (skyscraper rooftop at dusk)
   64 x 64 m roof, 300 m above the city. Spawns at the north and south ends behind the stair cores.
     WEST - plant deck: rows of AC units, solar arrays and ducts, and the water-tower walkway (4 m)
     MID  - the helipad (1.2 m, ramps north and south) between two elevator machine rooms
     EAST - the glass penthouse: two floors with doors on every side and an inside stair
   Power positions: the water-tower walkway (west) and the penthouse upper floor (east) - they watch each other, and
   the helipad sits between them as the contested middle. Mirrors north/south. */
function buildSpire() {
  buildMap2Materials();
  floorQuad(0, 0, 66, 66, 0, 'concrete', 3);
  // the city far below (the roof is the only floor you can reach)
  floorQuad(0, 0, 900, 900, -120, 'asphalt', 30);
  const R = makeRng(41);
  for (let i = 0; i < 70; i++) {
    const a = R() * TAU, r = 55 + R() * 260, w = 14 + R() * 26, d = 14 + R() * 26, top = -110 + R() * 150, h = top + 120;
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv.array; for (let k = 0; k < uv.length; k += 2) { uv[k] *= w / 6; uv[k + 1] *= h / 6; }
    batchAdd(R() < 0.5 ? 'facade' : 'glassDark', g, mat4(Math.cos(a) * r, -120 + h / 2, Math.sin(a) * r, 0, R() * 0.6, 0), false);
  }
  // roof edge: parapet with a glass screen on top
  for (const [x0, z0, x1, z1] of [[-32.6, -32.6, 32.6, -32.6], [-32.6, 32.6, 32.6, 32.6], [-32.6, -32.6, -32.6, 32.6], [32.6, -32.6, 32.6, 32.6]]) {
    wall(x0, z0, x1, z1, 1.1, 'concrete', { t: 0.5 });
    const alongX = z0 === z1; B('windowGlass', alongX ? 65 : 0.05, 1.2, alongX ? 0.05 : 65, (x0 + x1) / 2, 1.7, (z0 + z1) / 2, 0, 0, 0, false);
  }
  // ---- MID: helipad
  slab(0, 0, 14, 14, 1.2, 'concrete', 1.2);
  floorQuad(0, 0, 13.6, 13.6, 1.21, 'dark', 3); B('paintYellow', 9, 0.02, 9, 0, 1.23, 0, 0, 0, 0, false); B('dark', 8.2, 0.03, 8.2, 0, 1.24, 0, 0, 0, 0, false);
  B('paintWhite', 1, 0.04, 5, -2, 1.26, 0, 0, 0, 0, false); B('paintWhite', 1, 0.04, 5, 2, 1.26, 0, 0, 0, 0, false); B('paintWhite', 4, 0.04, 1, 0, 1.26, 0, 0, 0, 0, false);   // H
  for (const [x, z] of [[-6.8, -6.8], [6.8, -6.8], [-6.8, 6.8], [6.8, 6.8]]) B('signal', 0.3, 0.12, 0.3, x, 1.27, z, 0, 0, 0, false);
  symZ((s, Z, D) => {
    ramp(0, Z(10.6), D('n'), 4, 3.6, 0, 1.2, 'concrete');
    // pad edge cover: low crates of cargo nets
    crate(-5.6, Z(5.6), 1.0, 1.2); crate(5.4, Z(4.8), 0.9, 1.2, 1.4);
    // elevator machine room: blocks the spawn-to-pad sightline, doors east and west
    building({ x: 0, z: Z(17), w: 7, d: 5, floors: 1, fh: 3.6, key: 'concrete', floor: 'concrete', roof: 'flat', doors: [['e', 2.5], ['w', 2.5]], furnish: false, inner: false, win: 0.3 });
    acUnit(-1.8, Z(17), 3.85, 1.4); acUnit(1.8, Z(17), 3.85, 1.4);
    // ---- WEST: plant deck
    for (const z of [6, 12.5]) for (const x of [-28.5, -18.3]) { blk(x, Z(z), 3.4, 1.6, 1.3, 'sheet', { walk: false }); acUnit(x - 0.8, Z(z), 1.3, 0.8); acUnit(x + 0.8, Z(z), 1.3, 0.8); }
    for (let i = 0; i < 3; i++) { const z = 19 + i * 3; blk(-24, Z(z), 9, 1.4, 0.8, 'glassDark', { walk: false }); }   // solar arrays
    blk(-14.5, Z(9), 1.0, 9, 1.1, 'sheet', { walk: false });                                                       // duct along the lane edge
    blk(-31, Z(24), 2, 2, 2.4, 'sheet', { walk: false }); gasBottles(-30.2, Z(27.5));
    // ---- EAST: around the penthouse
    jersey(16.5, Z(15), false); crate(29.5, Z(15), 1.2); crate(30.4, Z(16.2), 0.9, 0, 1.6); bench(19, Z(23.5), 0, true);
    for (const x of [21, 26]) { B('terracotta', 1.6, 0.6, 0.6, x, 0.3, Z(12.4)); PZ(x, 0, Z(12.4), 1.6, 0.6, 0.6); for (let k = 0; k < 3; k++) B('leaf', 0.4, 0.5, 0.4, x - 0.5 + k * 0.5, 0.85, Z(12.4), 0, 0, 0, false); }   // planters
    // ---- spawn ends: stair cores you come up out of
    for (const x of [-20, 20]) { blk(x, Z(29.5), 6, 3.5, 3.4, 'concrete', { walk: false }); B('dark', 1.4, 2.3, 0.05, x, 1.15, Z(27.73), 0, 0, 0, false); }
    jersey(-8, Z(24), true); jersey(8, Z(24.5), true); lampPost(-11, Z(30.5), 0, 5, 1, 0); lampPost(11, Z(30.5), 0, 5, -1, 0);
  });
  // ---- WEST: water tower walkway (4 m) with stairs up from both sides
  deck(-24, 0, 7, 6, 4.0, 'steel', { posts: true, rails: ['w', 'e'] });
  CYL('sheet', 1.6, 1.6, 4.5, 20, -24, 6.25, 0); CYL('dark', 1.7, 1.7, 0.2, 20, -24, 8.6, 0); PZ(-24, 4.0, 0, 3.0, 4.5, 3.0);
  symZ((s, Z, D) => { stairs(-21.5, Z(9.3), D('n'), 1.2, 0, 4.0, 'steel', { open: true }); rail(-27.5, Z(3), -22.2, Z(3), 4.0); });
  // ---- EAST: the penthouse
  building({ x: 24, z: 0, w: 13, d: 20, floors: 2, fh: 3.6, key: 'whiteTile', floor: 'carpet', roof: 'flat', doors: [['n', 6.5], ['s', 6.5], ['w', 5], ['w', 15], ['e', 10]], win: 1, stairSide: 'e', furnish: true });
  for (const [y, z] of [[3.2, -5], [3.2, 5], [6.8, -5], [6.8, 5]]) lampLight(24, y, z, 0xffe6c4, 1.4, 14);
  // a tower crane over the north-east corner (scenery)
  for (let y = 0; y < 34; y += 2) { B('paintYellow', 0.12, 2, 0.12, 30.6, 8 + y, -30.6); B('paintYellow', 0.12, 2, 0.12, 32.2, 8 + y, -30.6); B('paintYellow', 0.12, 2, 0.12, 30.6, 8 + y, -32.2); B('paintYellow', 0.12, 2, 0.12, 32.2, 8 + y, -32.2); }
  B('paintYellow', 1.8, 25, 1.8, 31.4, -4, -31.4); PZ(31.4, 0, -31.4, 1.9, 8, 1.9); beam('paintYellow', 31.4, 42, -31.4, -12, 42, -10, 0.9, 0.9); beam('paintYellow', 31.4, 42, -31.4, 44, 42, -38, 0.9, 0.9); B('paintYellow', 2.4, 2, 2.4, 31.4, 40, -31.4);
  for (const [x, z] of [[-31.5, -31.5], [31.5, 31.5], [-31.5, 31.5]]) B('redLight', 0.25, 0.25, 0.25, x, 1.25, z, 0, 0, 0, false);
}
defineMap({
  id: 'spire', size: 'core', name: 'SPIRE', place: 'Skyscraper rooftop, dusk', desc: 'A rooftop 300 m up. Plant deck and water tower on one side, a glass penthouse on the other, the helipad between them.',
  play: [-32, 32, -32, 32], build: buildSpire,
  env: { top: 0x2c3c6a, horizon: 0xe0906a, fog: 0.0035, sun: [-60, 12, 30], sunCol: 0xffb07a, sunI: 2.2, skySun: 0xff9a5a, hemiSky: 0x9aa4c8, hemiGround: 0x3c3438, exposure: 1.12 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 27 }, { x: 0, z: -27 }],
    hp: [{ x: 0, z: 0, y: 1.2 }, { x: -24, z: 0 }, { x: 24, z: 0 }, { x: -20, z: -15 }, { x: 20, z: 15 }],
    flags: [{ x: 0, z: 27.5 }, { x: 0, z: -27.5 }],
    sites: [{ x: -24, z: -12, n: 'A' }, { x: 24, z: -7, n: 'B' }],
  },
  menu: { x: 0, z: 0, r: 9, y: 2.8 },
  navPts: [{ x: 0, z: 0, y: 1.2 }, { x: -24, z: -2.6, y: 4.0 }, { x: 24, z: 0, y: 3.6 }, { x: -24, z: 20 }],
  views: [[0, 1.7, 27, 0, 1.6, 0], [-24, 5.7, 2.4, 10, 1.5, 0], [19, 5.3, 4, -10, 2, 0], [-14, 1.7, 22, -26, 1.3, 4], [0, 2.9, -5, 0, 1, 20]],
});
