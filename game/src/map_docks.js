/* ================================================================== map: KESSEL DOCKS (container port at golden hour)
   Three lanes run north-south between the two gatehouses:
     WEST  - the quay: long open waterfront under a gantry crane (deck at 7.5 m, two exposed stairs), harbour hut roof
     MID   - the container yard: stacks one to three high, alleys, stairs onto container tops, open plaza in the middle
     EAST  - the warehouse: racked ground floor, mezzanine with offices at 3.6 m, loading docks along its west wall
   The map mirrors north/south (z -> -z) so both teams get the same routes. */
function buildDocks() {
  // ---- ground, water, boundary
  floorQuad(4, 0, 85, 92, 0, 'concrete', 4);
  floorQuad(-150, 0, 222, 400, -1.2, 'water', 8);
  batchAdd('concrete', scaledBox(0.6, 1.2, 92, 3), mat4(-38.8, -0.6, 0));                      // quay wall face
  blk(-38.8, 0, 0.6, 92, 0.22, 'concrete', { walk: false, noRay: true });                         // kerb
  boxes.push(mkBox(-39.2, 0, 0.5, 92, 4, { walk: false }));                                       // invisible edge
  for (let z = -40; z <= 40; z += 5) { batchAdd('dark', new THREE.CylinderGeometry(0.22, 0.28, 0.6, 10), mat4(-38.2, 0.3, z)); boxes.push(mkBox(-38.2, z, 0.5, 0.5, 0.6, { walk: false })); }
  wall(-38.5, -43.6, 44.6, -43.6, 4.2, 'concrete', { t: 0.6 }); wall(-38.5, 43.6, 44.6, 43.6, 4.2, 'concrete', { t: 0.6 });
  wall(44.6, -43.6, 44.6, 43.6, 9, 'brick', { t: 0.8 });
  rail(-38.5, -43.2, 44.3, -43.2, 4.2, { h: 1.6 }); rail(-38.5, 43.2, 44.3, 43.2, 4.2, { h: 1.6 });
  // distant harbour: a moored ship to the west, far cranes and warehouses
  batchAdd('paintBlue', scaledBox(24, 9, 140, 4), mat4(-78, 3.3, 0), false);
  batchAdd('paintWhite', scaledBox(18, 10, 16, 3), mat4(-80, 12.8, 44), false);
  const cols = ['paintRed', 'paintGreen', 'paintOrange', 'paintBlue'];
  for (let i = 0; i < 12; i++) for (let k = 0; k < 2; k++) batchAdd(cols[(i + k) % 4], scaledBox(2.4, 2.6, 6, 2), mat4(-76 + (i % 3) * 2.5, 9.1 + k * 2.6, -48 + i * 8), false);
  for (const [x, z] of [[-120, -60], [-125, 30], [-95, 110], [70, -120], [90, 90]]) { batchAdd('paintOrange', new THREE.BoxGeometry(2, 34, 2), mat4(x, 17, z), false); batchAdd('paintOrange', new THREE.BoxGeometry(2, 2, 40), mat4(x, 33, z + 12), false); }
  skyline(30, 110, 170, 10, 30);

  for (const s of [1, -1]) halfDocks(s);

  // ---- centre: the gantry crane straddling the quay
  for (const x of [-35.5, -22.5]) for (const z of [-3.8, 3.8]) blk(x, z, 1, 1, 6.7, 'paintYellow', { walk: false });
  for (const x of [-35.5, -22.5]) batchAdd('paintYellow', scaledBox(1.2, 0.6, 9, 2), mat4(x, 0.3, 0));        // bogies
  slab(-29, 0, 16, 9.2, 7.5, 'paintYellow', 0.8);
  rail(-37, -4.6, -22.2, -4.6, 7.5, { key: 'paintYellow' }); rail(-37, 4.6, -22.2, 4.6, 7.5, { key: 'paintYellow' });
  rail(-37, -4.6, -37, 4.6, 7.5, { key: 'paintYellow' });
  // machinery house on the deck (doors both ends)
  wall(-33, -2.5, -27, -2.5, 3, 'paintWhite', { y: 7.5, holes: [{ at: 1.5, w: 1.2, b: 1.2, h: 0.8 }, { at: 4.5, w: 1.2, b: 1.2, h: 0.8 }] });
  wall(-33, 2.5, -27, 2.5, 3, 'paintWhite', { y: 7.5, holes: [{ at: 3, w: 1.2, b: 1.2, h: 0.8 }] });
  wall(-33, -2.5, -33, 2.5, 3, 'paintWhite', { y: 7.5, holes: [{ at: 2.5, w: 1.2, b: 0, h: 2.2 }] });
  wall(-27, -2.5, -27, 2.5, 3, 'paintWhite', { y: 7.5, holes: [{ at: 2.5, w: 1.2, b: 0, h: 2.2 }] });
  slab(-30, 0, 6.4, 5.4, 10.8, 'paintWhite', 0.3);
  // the spreader with a container hanging under it (cover from above the quay)
  for (const dx of [-2.6, 2.6]) batchAdd('dark', new THREE.BoxGeometry(0.06, 3.2, 0.06), mat4(-29 + dx, 5.1, 0), false);
  container(-29, 0, true, 3.0, 'paintBlue');
  // ---- centre of the yard: low cover around the plaza
  crate(-2.5, 0, 1.2); crate(2.8, 0.4, 1.0); crate(2.8, -0.8, 1.0, 1.0, 0.9);
  jersey(-7, 0, false); jersey(7.5, 0, false);
  // ---- warehouse (east lane)
  const X0 = 16, X1 = 42, Z = 18, H = 8.2;
  const westHoles = [{ at: 9, w: 4, b: 1.2, h: 3.4 }, { at: 27, w: 4, b: 1.2, h: 3.4 }, { at: 18, w: 3, b: 0, h: 3 }];
  for (let z = 3; z < 36; z += 6) if (Math.abs(z - 9) > 3 && Math.abs(z - 27) > 3 && Math.abs(z - 18) > 3) westHoles.push({ at: z, w: 1.8, b: 4.6, h: 1.5 });
  wall(X0, -Z, X0, Z, H, 'brick', { t: 0.5, holes: westHoles });
  const eastHoles = []; for (let z = 3; z < 36; z += 6) eastHoles.push({ at: z, w: 2.4, b: 5.4, h: 1.6 });
  wall(X1, -Z, X1, Z, H, 'brick', { t: 0.5, holes: eastHoles });
  for (const s of [1, -1]) wall(X0, s * Z, X1, s * Z, H, 'brick', { t: 0.5, holes: [{ at: 13, w: 6, b: 0, h: 5 }, { at: 22.5, w: 1.4, b: 0, h: 2.3 }, { at: 4, w: 2, b: 4.6, h: 1.5 }] });
  for (const [z0, z1] of [[-18, -7.3], [-5.7, 5.7], [7.3, 18]]) slab((X0 + X1) / 2, (z0 + z1) / 2, X1 - X0 + 0.6, z1 - z0, H + 0.3, 'metal', 0.3);   // roof with two skylight strips
  for (let x = X0 + 2.5; x < X1; x += 5) for (const z of [-6.5, 6.5]) batchAdd('steel', new THREE.BoxGeometry(0.25, 0.5, 1.5), mat4(x, H - 0.1, z), false);
  // mezzanine along the east wall with an office at each end
  slab(38, 0, 8, 35.4, 3.6, 'metal', 0.3);
  for (let z = -15; z <= 15; z += 5) blk(34.3, z, 0.35, 0.35, 3.3, 'steel', { walk: false });
  rail(34, -8.6, 34, 8.6, 3.6);
  for (const s of [1, -1]) {
    stairs(33.2, s * 4.6, s > 0 ? 's' : 'n', 1.4, 0, 3.6, 'steel', { open: true, run: 0.42 });
    wall(34, s * 12, 42, s * 12, 2.8, 'plaster', { y: 3.6, t: 0.2, holes: [{ at: 2, w: 1.1, b: 0, h: 2.1 }, { at: 5.5, w: 3, b: 1, h: 1.2 }] });
    wall(34, s * 12, 34, s * 17.7, 2.8, 'plaster', { y: 3.6, t: 0.2, holes: [{ at: 2.8, w: 2.6, b: 1, h: 1.2 }] });
    crate(39.5, s * 15.5, 1.0, 3.6, 0.8); crate(36.2, s * 16.6, 0.9, 3.6, 0.75);
    // pallet racks on the ground floor
    for (const x of [21.5, 26.5]) {
      const z0 = s * 3.5, z1 = s * 13.5, cz = (z0 + z1) / 2;
      blk(x, cz, 1.3, 10, 4.2, 'steel', { walk: false, tile: 1.2 });
      for (let k = 0; k < 4; k++) for (let lv = 0; lv < 3; lv++) if (Math.random() < 0.75) batchAdd('wood', scaledBox(1.35, 0.9, 2, 1.2), mat4(x, 0.5 + lv * 1.35, cz - 3.75 + k * 2.5), false);
    }
    // inside loading dock strip and its steps
    blk(17.2, s * 9, 1.9, 4.2, 1.2, 'concrete', { walk: true });
    stairs(20.3, s * 9, 'w', 2.4, 0, 1.2, 'concrete', { rails: false });
    crate(30.5, s * 9.5, 1.2); crate(30.5, s * 11, 1.0); barrelAt(37.5, s * 6, 'blue'); barrelAt(38.2, s * 7, 'red');
  }
  blk(20.5, -0.2, 3, 1.4, 1.1, 'paintYellow', { walk: false });   // forklift body (centre aisle)
  // loading docks outside the west wall
  slab(14.4, 0, 3, 28, 1.2, 'concrete', 1.2, { walk: true });
  for (const s of [1, -1]) ramp(14.4, s * 14, s > 0 ? 's' : 'n', 3, 4, 1.2, 0, 'concrete');
  stairs(10.8, 0, 'e', 3.4, 0, 1.2, 'concrete', { rails: false });
  for (const z of [-9, 9]) for (const dz of [-1.8, 1.8]) batchAdd('dark', new THREE.BoxGeometry(0.3, 0.6, 0.5), mat4(12.8, 0.9, z + dz));
}
// the south half (s = 1) and its mirror (s = -1)
function halfDocks(s) {
  const Z = z => z * s, N = s > 0 ? 'n' : 's', S = s > 0 ? 's' : 'n';
  // gatehouse spawn: booth, barrier arms, trailers
  blk(-6, Z(39.5), 3, 2.6, 2.8, 'plaster', { walk: true });
  slab(-6, Z(39.5), 3.6, 3.2, 3.0, 'metal', 0.2);
  for (const x of [-12, 6]) container(x, Z(37), true, 0, s > 0 ? 'paintWhite' : 'paintGreen', { len: 6 });
  for (const x of [-12, 6]) batchAdd('dark', scaledBox(6.2, 0.9, 2.2, 2), mat4(x, -0.2, Z(37)));
  // ---- quay (west lane)
  // harbour hut with a roof you reach by the outside stair
  wall(-34, Z(16), -28, Z(16), 3, 'brick', { holes: [{ at: 3, w: 1.6, b: 1, h: 1.1 }] });
  wall(-34, Z(22), -28, Z(22), 3, 'brick', { holes: [{ at: 2, w: 1.4, b: 1, h: 1.1 }] });
  wall(-34, Z(16), -34, Z(22), 3, 'brick', { holes: [{ at: 3, w: 1.4, b: 1, h: 1.1 }] });
  wall(-28, Z(16), -28, Z(22), 3, 'brick', { holes: [{ at: 3, w: 1.3, b: 0, h: 2.2 }, { at: 5, w: 1.2, b: 1.0, h: 1.0 }] });
  slab(-31, Z(19), 6.4, 6.4, 3.25, 'concrete', 0.25);
  rail(-34.2, Z(15.8), -27.8, Z(15.8), 3.25, { h: 0.9 }); rail(-34.2, Z(15.8), -34.2, Z(22.2), 3.25, { h: 0.9 });
  stairs(-26.6, Z(22.9), 'w', 1.3, 0, 3.25, 'concrete');
  // cargo on the quay
  crate(-31, Z(8), 1.2); crate(-29.8, Z(8.4), 1.0); crate(-31, Z(8), 1.0, 1.2, 0.9);
  crate(-25.5, Z(11), 1.4, 0, 1.4);
  for (const [x, z] of [[-35.5, 30], [-34.4, 31.2], [-24.5, 33]]) crate(x, Z(z), 1.2);
  container(-33.2, Z(28), true, 0, 'paintOrange');
  blk(-26.5, Z(26.5), 1.4, 2.6, 1.6, 'paintYellow', { walk: false });      // forklift
  for (const z of [7, 13]) { batchAdd('wood', new THREE.CylinderGeometry(1.0, 1.0, 1.4, 16), mat4(-36, 1.0, Z(z), Math.PI / 2, 0, 0)); boxes.push(mkBox(-36, Z(z), 2.0, 1.4, 2.0, { walk: false })); rayAdd(new THREE.BoxGeometry(2, 2, 1.4), mat4(-36, 1, Z(z))); }   // cable reels
  // the long crane stair (exposed) from the quay to the deck
  stairs(-21.4, Z(14.1), N, 1.3, 0, 7.5, 'paintYellow', { open: true, run: 0.34 });
  // ---- container yard (mid lane)
  container(-13.5, Z(8.6), false, 0, 'paintRed'); container(-13.5, Z(8.6), false, 2.6, 'paintBlue');
  container(-13.5, Z(22.5), false, 0, 'paintGreen');
  container(-11.1, Z(22.5), false, 0, 'paintWhite'); container(-11.1, Z(22.5), false, 2.6, 'paintOrange'); container(-11.1, Z(22.5), false, 5.2, 'paintRed');
  container(-7.2, Z(15), true, 0, 'paintBlue'); container(0.6, Z(15), true, 0, 'paintOrange');
  container(6.6, Z(15), true, 0, 'paintGreen'); container(6.6, Z(15), true, 2.6, 'paintRed');
  container(9.2, Z(8.5), false, 0, 'paintYellow');
  stairs(11.0, Z(13.0), N, 1.2, 0, 2.6, 'steel', { open: true });
  container(-4, Z(27), true, 0, 'paintRed');
  batchAdd('dark', scaledBox(6.4, 0.9, 2.2, 2), mat4(-4, -0.2, Z(27)));
  container(4.5, Z(31.5), false, 0, 'paintBlue');
  container(-8, Z(6.5), true, 0, 'paintGreen');
  stairs(-8, Z(11.6), N, 1.4, 0, 2.6, 'steel', { open: true, run: 0.38 });
  rail(-11, Z(5.3), -5, Z(5.3), 2.6, { h: 0.6 });
  crate(-1.5, Z(20), 1.2); crate(2, Z(21.5), 1.0); barrelAt(-9.2, Z(19), 'red'); barrelAt(9.5, Z(21), 'blue');
  jersey(3.5, Z(9), true);
  // ---- truck yard south of the warehouse (east lane approach)
  container(24, Z(24), false, 0, 'paintWhite'); batchAdd('dark', scaledBox(2.2, 0.9, 6.2, 2), mat4(24, -0.2, Z(24)));
  container(33, Z(27.5), true, 0, 'paintRed'); container(33, Z(27.5), true, 2.6, 'paintGreen');
  blk(39.5, Z(23), 3, 3, 1.4, 'concrete', { walk: true });          // generator plinth
  crate(28.5, Z(32), 1.2); crate(17.5, Z(30), 1.2); barrelAt(19, Z(21.5), 'red'); barrelAt(37, Z(34), 'blue');
  jersey(18.5, Z(26), false);
  for (const z of [20.5, 34]) for (const x of [40]) tree(x + 1.5, Z(z + 4), Math.random() < 0.5, 0.8);
}
defineMap({
  id: 'docks', name: 'KESSEL DOCKS', place: 'Container port, golden hour', desc: 'Quay, container yard and warehouse. A gantry crane looks down the waterfront; the warehouse mezzanine controls the east.',
  build: buildDocks,
  env: { top: 0x3f5f8f, horizon: 0xe2b48c, fog: 0.0085, sun: [-60, 22, 18], sunCol: 0xffc48a, sunI: 2.5, skySun: 0xffb070, hemiSky: 0xc0b8c0, hemiGround: 0x4a3c30, exposure: 1.08 },
  grass: { count: 600, avoid: (x, z) => x > -37 && x < 44 && Math.abs(z) < 43 && !(x > 38 && Math.abs(z) > 20) },
  spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 37 }, { x: 0, z: -37 }],
    hp: [{ x: 0, z: 0 }, { x: 29, z: 0, y: 0 }, { x: -29, z: 10 }, { x: -2, z: -21 }, { x: -29, z: -10 }, { x: -2, z: 21 }],
    flags: [{ x: -1, z: 36 }, { x: -1, z: -36 }],
    sites: [{ x: 28, z: -9, n: 'A' }, { x: -31, z: -12, n: 'B' }],
  },
  menu: { x: -3, z: 0, r: 9, y: 1.9 },
  navPts: [{ x: -29, z: 3.5, y: 7.5 }, { x: 38, z: 0, y: 3.6 }, { x: 9.2, z: 9, y: 2.6 }, { x: -8, z: -6.5, y: 2.6 }, { x: -31, z: 19, y: 3.25 }, { x: 38, z: -15, y: 3.6 }],
  views: [[0, 1.7, 33, 0, 1.4, 0], [-30, 1.7, 30, -28, 3, -4], [-29, 9.2, 3.5, 0, 0, 14], [24, 1.7, 15, 36, 2.5, -8], [37, 5.3, 10, 20, 1.5, -4], [-12, 4.3, 7, 10, 1, -14]],
});
