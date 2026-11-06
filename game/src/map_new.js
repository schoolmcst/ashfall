/* ================================================================== CORE maps (1.2.88): THE TRIM HOUSE and SKATE PARK
   THE TRIM HOUSE - 56 x 56 m, a grow farm on the edge of town, daytime. Spawns at the north and south gates.
     MID  - the GREENHOUSE: glass on every side (you can see through it, bullets stop), doors on all four sides, three
            long grow tables inside to fight over
     WEST - the DRYING BARN: a red barn with big sliding doors, hay bales and drying racks; dark inside
     EAST - the LOADING YARD: a shipping container, a box truck, pallets and a forklift, long sight lines
   SKATE PARK - 52 x 52 m, a concrete park at sunset. Spawns at the north and south ends.
     MID  - the FUNBOX: a raised block with ramps at both ends (the high ground) and rails around it
     WEST - the SNACK SHACK: a little building you can run through, graffiti walls as cover lanes
     EAST - the QUARTER PIPES and the RESTROOMS block, benches and planters
   Both mirror north / south; every collider comes from fixed numbers so every machine builds the same map. */
function newMapMats() {
  if (MAT.thSign) return;
  MAT.thSign = neonMat('THE TRIM HOUSE', '#7fd16b', 'family farm · est. 1974', '#0b140a', 1024, 256);
  MAT.spSign = neonMat('SKATE PARK', '#ff5ad0', 'no bikes · no cops', '#140a12', 1024, 256);
  const tags = [['DANK', '#5dff7a'], ['420', '#ffd23a'], ['SESH', '#5ac8ff'], ['BLAZE', '#ff7a2a']];
  tags.forEach(([t, c], i) => { MAT['spTag' + i] = neonMat(t, c, '', '#1a1a1e', 512, 192); });
}
/* ---------------------------------------------------------------- THE TRIM HOUSE */
function buildTrim() {
  buildMap2Materials(); isleMaterials(); newMapMats();
  floorQuad(0, 0, 70, 70, 0, 'ground', 8);
  floorQuad(0, 0, 18, 14, 0.01, 'concrete', 4);
  floorQuad(22, 0, 14, 40, 0.008, 'asphalt', 5);
  for (const s of [-1, 1]) { fence(-28, s * 28, 28, s * 28, 0, 2.6); fence(s * 28, -28, s * 28, 28, 0, 2.6); }
  // ---- MID: the greenhouse (x -8..8, z -6..6), glass windows all round, a door in the middle of every side
  const GH = 3.2, win = (a, w) => [a, w, 0.9, 1.3];
  for (const s of [-1, 1]) {
    wkX(s * 6, -8, 8, GH, 'panel', [[0, 2.2, 0, 2.4], win(-5, 2.4), win(5, 2.4), win(-2.6, 1.4), win(2.6, 1.4)]);
    wkZ(s * 8, -6, 6, GH, 'panel', [[0, 2.0, 0, 2.4], win(-3.6, 2.2), win(3.6, 2.2)]);
  }
  for (const z of [-3.2, 0, 3.2]) { blk(0, z, 10, 1.1, 0.9, 'wood', { walk: false }); B('soil', 9.8, 0.06, 0.9, 0, 0.93, z, 0, 0, 0, false); for (let i = 0; i < 8; i++) islePlant(-4.4 + i * 1.25, z, 0.95, 1.05, i % 3 ? 'leafGreen' : 'purpleLeaf'); }
  for (const x of [-5, 0, 5]) lampLight(x, 2.9, 0, 0xd27aff, 0.5, 8);
  // ---- WEST: the drying barn (x -24..-13, z -8..8)
  const BH = 4.6;
  wkZ(-13, -8, 8, BH, 'redBarn', [[0, 4, 0, 3.4]]);               // the big sliding door into mid
  wkZ(-24, -8, 8, BH, 'redBarn', [[3, 1.6, 0, 2.3]]);
  for (const s of [-1, 1]) wkX(s * 8, -24, -13, BH, 'redBarn', [[-18.5, 2, 0, 2.4]]);
  blk(-18.5, 0, 11.5, 16.5, 0.3, 'redBarn', { y: BH, noCol: true });
  for (const [x, z] of [[-21.5, -5.5], [-21.5, 5.5], [-16, -3], [-16, 3], [-22, 0]]) blk(x, z, 1.6, 1.1, 1.1, 'hay', { walk: true });
  blk(-19, 0, 0.6, 5, 2.2, 'wood', { walk: false });              // a drying rack down the middle
  lampLight(-18.5, 3.6, 0, 0xffc27a, 0.45, 10);
  // ---- EAST: the loading yard
  blk(22, 0, 2.5, 6.2, 2.6, 'metal', { walk: false });              // the shipping container (you can climb the crates onto it)
  crate(19.6, 2.2, 1.1); crate(19.6, 3.3, 1.1, 1.1, 1.1);
  for (const s of [-1, 1]) carWreck(16, s * 9, false);
  blk(25, -11, 2.2, 5.5, 2.9, 'metal', { walk: false });            // the box truck
  pallet(14, 2, 0, 2, true); pallet(14, -2, 0, 2, true); forklift(24, 10.5, 0, false);
  // ---- the north and south halves: sheds, dumpsters and cover on the lanes
  symZ((s, Z) => {
    blk(-16, Z(19), 4, 3.2, 2.7, 'wood', { walk: false }); blk(15, Z(20), 3.6, 3, 2.7, 'wood', { walk: false });
    dumpster(-4, Z(18), 0, true); dumpster(5, Z(15.5), 0, false);
    crate(-9, Z(11), 1.2); crate(9.5, Z(10.5), 1.2); crate(0, Z(11.5), 1.1);
    barrelAt(-24, Z(13), 'blue'); barrelAt(-23.2, Z(13.6), 'red'); barrelAt(24.5, Z(17), 'blue');
    blk(-6, Z(23), 6, 0.4, 1.1, 'concrete', { walk: false }); blk(6, Z(23), 6, 0.4, 1.1, 'concrete', { walk: false });
    for (const x of [-26, 26]) for (let z = 14; z <= 24; z += 3.3) islePlant(x, Z(z), 0, 1.4, 'leafGreen');
  });
  batchAdd('thSign', new THREE.PlaneGeometry(5, 1.25), mat4(0, 3.9, 6.27, 0, 0, 0), false);
  batchAdd('thSign', new THREE.PlaneGeometry(5, 1.25), mat4(0, 3.9, -6.27, 0, Math.PI, 0), false);
}
defineMap({
  id: 'trimhouse', size: 'core', name: 'THE TRIM HOUSE', place: 'A grow farm outside town, midday', desc: 'A glass greenhouse in the middle, a dark drying barn on one side and a loading yard with a shipping container on the other.',
  play: [-27.5, 27.5, -27.5, 27.5], arena: 34, build: buildTrim,
  env: { top: 0x5a8ac8, horizon: 0xc8d8e0, fog: 0.006, sun: [30, 60, 20], sunCol: 0xfff0d8, sunI: 1.25, skySun: 0xffe8c0, hemiSky: 0xb8d0e8, hemiGround: 0x5a5a40, exposure: 1.1 },
  grass: { count: 1400, avoid: (x, z) => (Math.abs(x) < 9 && Math.abs(z) < 7) || (x < -12 && x > -25 && Math.abs(z) < 9) || (x > 14 && Math.abs(z) < 14) }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 25 }, { x: 0, z: -25 }],
    hp: [{ x: 0, z: 0 }, { x: -18.5, z: 0 }, { x: 21, z: 6 }, { x: -10, z: -14 }, { x: 10, z: 14 }],
    flags: [{ x: 0, z: 25.5 }, { x: 0, z: -25.5 }],
    sites: [{ x: -18.5, z: -4 }, { x: 22, z: 6 }].map((p, i) => Object.assign(p, { n: 'AB'[i] })),
  },
  menu: { x: 0, z: 12, r: 12, y: 2.4 },
  navPts: [{ x: 0, z: 0 }, { x: -18.5, z: 0 }, { x: 22, z: 6 }, { x: -10, z: 14 }, { x: 10, z: -14 }],
  views: [[0, 1.7, 22, 0, 1.4, 0], [-9, 1.7, 0, -18, 1.4, 0], [14, 1.7, 14, 22, 1.4, 0], [3, 1.7, -4, -3, 1.2, 4]],
});
/* ---------------------------------------------------------------- SKATE PARK */
function buildSkate() {
  buildMap2Materials(); isleMaterials(); newMapMats();
  floorQuad(0, 0, 64, 64, 0, 'concrete', 7);
  for (const s of [-1, 1]) { fence(-26, s * 26, 26, s * 26, 0, 3); fence(s * 26, -26, s * 26, 26, 0, 3); }
  // ---- MID: the funbox (x -4..4, z -2.5..2.5, 1.2 m) with ramps north and south, rails east and west
  const FB = 1.2; blk(0, 0, 8, 5, FB, 'concrete', { walk: true });
  for (const s of [-1, 1]) { ramp(0, s * 2.5, s > 0 ? 's' : 'n', 6, 4, FB, 0); B('concrete', 6, 0.2, 4.1, 0, FB / 2, s * 4.5, s * Math.atan2(FB, 4), 0, 0, false); }
  for (const s of [-1, 1]) { blk(s * 6.5, 0, 0.1, 6, 0.55, 'metal', { walk: false }); }
  // ---- WEST: the snack shack (x -20..-14, z -3..3), doors east and west, a serving window north and south
  const SH = 3;
  for (const s of [-1, 1]) wkX(s * 3, -20, -14, SH, 'facade', [[-17, 2.2, 1.0, 1.0]]);
  wkZ(-14, -3, 3, SH, 'facade', [[0, 1.6, 0, 2.3]]); wkZ(-20, -3, 3, SH, 'facade', [[0, 1.6, 0, 2.3]]);
  blk(-17, 0, 6.2, 6.2, 0.25, 'dark', { y: SH, noCol: true }); blk(-17, -1.8, 4, 0.6, 1, 'wood', { walk: false });
  // graffiti walls: lanes of cover between the shack and mid
  symZ((s, Z) => { blk(-9, Z(7), 5, 0.4, 2.2, 'brick', { walk: false }); blk(-17, Z(12), 0.4, 6, 2.2, 'brick', { walk: false }); });
  batchAdd('spTag0', new THREE.PlaneGeometry(4.6, 1.7), mat4(-9, 1.2, 7.21, 0, 0, 0), false); batchAdd('spTag1', new THREE.PlaneGeometry(4.6, 1.7), mat4(-9, 1.2, -7.21, 0, Math.PI, 0), false);
  // ---- EAST: quarter pipes along the fence, the restrooms block
  for (const s of [-1, 1]) { ramp(23.5, s * 12, 'e', 6, 2.5, 0, 1.6); blk(25.3, s * 12, 1.1, 6, 1.6, 'concrete', { walk: true }); }
  wkZ(14, -4, 4, 3, 'whiteTile', [[0, 1.6, 0, 2.3]]); wkZ(20, -4, 4, 3, 'whiteTile', [[2.4, 1.4, 0, 2.3]]); for (const s of [-1, 1]) wkX(s * 4, 14, 20, 3, 'whiteTile');
  blk(17, 0, 6.2, 8.2, 0.25, 'dark', { y: 3, noCol: true }); blk(17, 0, 0.2, 5, 2.2, 'whiteTile', { walk: false });
  batchAdd('spTag2', new THREE.PlaneGeometry(4, 1.5), mat4(13.74, 1.6, 0, 0, -Math.PI / 2, 0), false);
  // ---- north and south: the spawn plazas, benches, planters, a ledge to grind, the sign
  symZ((s, Z) => {
    for (const x of [-12, 12]) blk(x, Z(17), 3, 3, 0.7, 'brick', { walk: true });
    for (const x of [-12, 12]) islePlant(x, Z(17), 0.7, 1.8, 'leafGreen');
    blk(0, Z(13), 6, 1, 0.5, 'concrete', { walk: true }); bench(-5, Z(21), 0, true); bench(5, Z(21), 0, true);
    blk(9, Z(8.5), 0.4, 4, 1.6, 'brick', { walk: false }); trashBin(-3, Z(22.5)); trashBin(3, Z(22.5));
    crate(-22, Z(20), 1.1); crate(21, Z(21), 1.1); barrelAt(-23.5, Z(5), 'red');
  });
  batchAdd('spTag3', new THREE.PlaneGeometry(4, 1.5), mat4(-17, 1.6, 12.21 + 0.01, 0, 0, 0), false);
  batchAdd('spSign', new THREE.PlaneGeometry(6, 1.5), mat4(0, 2.6, 25.8, 0, Math.PI, 0), false);
  batchAdd('spSign', new THREE.PlaneGeometry(6, 1.5), mat4(0, 2.6, -25.8, 0, 0, 0), false);
  for (const [x, z] of [[-24, -24], [24, 24], [-24, 24], [24, -24]]) lampPost(x, z, 0, 6);
}
defineMap({
  id: 'skatepark', size: 'core', name: 'SKATE PARK', place: 'A concrete skate park, sunset', desc: 'A funbox in the middle to fight over, a snack shack and graffiti walls on one side, quarter pipes and the restrooms on the other.',
  play: [-25.5, 25.5, -25.5, 25.5], arena: 32, build: buildSkate,
  env: { top: 0x3a4a8a, horizon: 0xff9a5a, fog: 0.007, sun: [-40, 22, -10], sunCol: 0xffb070, sunI: 1.1, skySun: 0xffa060, hemiSky: 0xc0a0b0, hemiGround: 0x5a4a40, exposure: 1.2 },
  grass: { count: 0 }, spawnMaxY: 0.8,
  layout: {
    spawn: [{ x: 0, z: 23 }, { x: 0, z: -23 }],
    hp: [{ x: 0, z: 0 }, { x: -17, z: 0 }, { x: 17, z: 6 }, { x: -12, z: -14 }, { x: 12, z: 14 }],
    flags: [{ x: 0, z: 23.5 }, { x: 0, z: -23.5 }],
    sites: [{ x: -17, z: 0 }, { x: 22, z: -12 }].map((p, i) => Object.assign(p, { n: 'AB'[i] })),
  },
  menu: { x: 0, z: 10, r: 10, y: 2.2 },
  navPts: [{ x: 0, z: 0, y: 1.2 }, { x: -17, z: 0 }, { x: 17, z: 6 }, { x: -9, z: 12 }, { x: 9, z: -12 }],
  views: [[0, 1.7, 20, 0, 1.4, 0], [-10, 1.7, 4, -17, 1.4, 0], [10, 1.7, 10, 20, 1.4, 12], [0, 2.9, -2, 0, 1.4, 8]],
});
