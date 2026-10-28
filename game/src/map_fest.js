/* ================================================================== CORE map: SMOKE OUT (a 4/20 music festival, sunny afternoon)
   64 x 64 m of trampled grass inside a chain-link fence. Spawns at the north and south gates by the ticket booths.
     MID  - the MAIN STAGE (1.8 m up, stairs at both ends) with speaker stacks and a drum riser for cover, its back
            wall blocking the west. In front of it the crowd barrier, the open pit and the sound booth (FOH) - lots of
            sightlines, not much cover
     WEST - the vendor village: two rows of tents with tables and crates, and THE BIG ONE, a giant inflatable joint
            lying across the middle of the field
     EAST - the bleachers (rows climbing to 2.4 m) look over the pit; food trucks and the porta-potty row below them
   Mirrors north/south. */
function buildFest() {
  buildMap2Materials();
  if (!MAT.festScreen) {
    MAT.festScreen = neonMat('SMOKE OUT', '#7dff6a', '4/20 · ALL DAY', '#101a10', 1024, 384);
    MAT.festBanner = neonMat('MAIN STAGE', '#ffd84a', '', '#2a1a40', 512, 128);
    MAT.festFOH = neonMat('FOH', '#ffffff', 'SOUND', '#202020', 256, 128);
    MAT.festGate = neonMat('WELCOME TO SMOKE OUT', '#ffffff', 'TICKETS · WRISTBANDS · NO GLASS', '#2a6a2a', 1024, 256);
    [neonMat('GLASS', '#5ad8ff', '', '#102030', 256, 96), neonMat('SEEDS', '#7dff6a', '', '#102010', 256, 96), neonMat('MERCH', '#ffd84a', '', '#2a2010', 256, 96), neonMat('CBD', '#ff7ad8', '', '#2a1020', 256, 96), neonMat('PAPERS', '#ffffff', '', '#202020', 256, 96), neonMat('TIE DYE', '#ff9a3a', '', '#301808', 256, 96)].forEach((m, i) => { MAT['festV' + i] = m; });
    [neonMat('MUNCHIES', '#ffb03a', '', '#2a1608', 512, 128), neonMat('FUNNEL CAKE', '#ff7ad8', '', '#2a1020', 512, 128)].forEach((m, i) => { MAT['festF' + i] = m; });
    MAT.joint = new THREE.MeshStandardMaterial({ color: C(0xf2ece0), roughness: 0.8 });
    MAT.jointTip = new THREE.MeshStandardMaterial({ color: C(0xc89a5a), roughness: 0.9 });
    MAT.jointEmber = new THREE.MeshBasicMaterial({ color: C(0xff6a1a), toneMapped: false });
    MAT.tentA = new THREE.MeshStandardMaterial({ color: C(0x3fa04a), roughness: 0.9, side: THREE.DoubleSide });
    MAT.tentB = new THREE.MeshStandardMaterial({ color: C(0xe8e0d0), roughness: 0.9, side: THREE.DoubleSide });
    MAT.tentC = new THREE.MeshStandardMaterial({ color: C(0x7a3ac0), roughness: 0.9, side: THREE.DoubleSide });
    MAT.potty = new THREE.MeshStandardMaterial({ color: C(0x2a8ad8), roughness: 0.7 });
    MAT.truss = new THREE.MeshStandardMaterial({ color: C(0x9aa0a6), roughness: 0.4, metalness: 0.8 });
  }
  floorQuad(0, 0, 80, 80, 0, 'ground', 5);
  floorQuad(0, 0, 6, 64, 0.01, 'mud', 4);                            // the trampled path down the middle
  for (const s of [-1, 1]) { fence(-32.4, s * 32.4, 32.4, s * 32.4, 0, 2.6); fence(s * 32.4, -32.4, s * 32.4, 32.4, 0, 2.6); }
  // a tent: a canopy on four posts, a table under it (cover) and a sign on the front; face 1 = sign toward +x
  const tent = (x, z, key, sign, face) => {
    canopy(x, z, 3.2, 3.2, 2.5, key); batchAdd(key, new THREE.ConeGeometry(2.3, 0.7, 4), mat4(x, 2.88, z, 0, Math.PI / 4, 0), true);
    blk(x + face * 0.9, z, 0.8, 2.6, 0.85, 'wood', { walk: false }); B('cloth1', 0.85, 0.02, 2.65, x + face * 0.9, 0.86, z, 0, 0, 0, false);
    if (sign) signAt(sign, x + face * 1.62, 2.2, z, 1.6, 0.6, face > 0 ? Math.PI / 2 : -Math.PI / 2);
    crate(x - face * 0.9, z + 0.8, 0.8);
  };
  // bunting: a line of little flags between two points
  const bunting = (ax, ay, az, bx, by, bz) => {
    beam('dark', ax, ay, az, bx, by, bz, 0.015, 0.015, false);
    const L = Math.hypot(bx - ax, bz - az), n = Math.floor(L / 0.7), ks = ['paintRed', 'paintYellow', 'paintGreen', 'paintBlue', 'paintOrange'];
    for (let i = 1; i < n; i++) { const t = i / n, sag = Math.sin(t * Math.PI) * 0.5; batchAdd(ks[i % 5], new THREE.ConeGeometry(0.16, 0.32, 3), mat4(ax + (bx - ax) * t, ay + (by - ay) * t - sag - 0.16, az + (bz - az) * t, Math.PI, Math.atan2(bx - ax, bz - az), 0), false); }
  };

  /* ---- MID: the main stage (x -9..1, z -6..6, 1.8 m up) */
  const ST = 1.8;
  blk(-4, 0, 10, 12, ST, 'wood', { walk: true }); B('dark', 10.05, 0.6, 12.05, -4, 0.3, 0, 0, 0, 0, false);
  // the back wall and the screen on it, truss towers, the banner
  wall(-9, -6, -9, 6, 6.5, 'dark', { y: ST, t: 0.4 });
  batchAdd('festScreen', new THREE.PlaneGeometry(9, 3.4), mat4(-8.78, ST + 3.6, 0, 0, Math.PI / 2, 0), false);
  for (const z of [-6, 6]) { B('truss', 0.5, 7.5, 0.5, -8.6, ST + 3.75, z * 0.98); B('truss', 0.5, 7.5, 0.5, 0.6, ST + 3.75, z * 0.98, 0, 0, 0, true); PZ(0.6, ST, z * 0.98, 0.5, 7.5, 0.5); }
  B('truss', 9.8, 0.5, 0.5, -4, ST + 7.3, 5.88); B('truss', 9.8, 0.5, 0.5, -4, ST + 7.3, -5.88); B('truss', 0.5, 0.5, 12, 0.6, ST + 7.3, 0);
  batchAdd('festBanner', new THREE.PlaneGeometry(5, 1.25), mat4(0.88, ST + 6.6, 0, 0, Math.PI / 2, 0), false);
  // speakers at the front corners, a drum riser, monitor wedges, the mic stand
  for (const z of [-4.6, 4.6]) { blk(-0.2, z, 1.3, 1.3, 2.4, 'dark', { y: ST, walk: false }); for (const y of [0.6, 1.4, 2.1]) batchAdd('steel', new THREE.CircleGeometry(0.4, 16), mat4(0.46, ST + y, z, 0, Math.PI / 2, 0), false); }
  blk(-6.2, 0, 2.8, 3.4, 0.5, 'wood', { y: ST, walk: true });
  CYL('paintRed', 0.35, 0.35, 0.5, 14, -6.2, ST + 0.75, 0.5); CYL('paintWhite', 0.55, 0.55, 0.45, 16, -6.6, ST + 0.75, -0.5, Math.PI / 2, 0, 0);
  for (const z of [-1.6, 1.6]) { batchAdd('dark', new THREE.BoxGeometry(0.5, 0.35, 0.8), mat4(-0.1, ST + 0.18, z, 0, 0, -0.5), false); }
  CYL('steel', 0.02, 0.02, 1.5, 6, -0.6, ST + 0.75, 0, 0, 0, 0, false);
  lampLight(-1.5, ST + 6, 0, 0xc070ff, 1.0, 14);
  // the crowd barrier in front of the stage, with gaps at the ends
  fence(3.2, -4.5, 3.2, 4.5, 0, 1.1);
  // the sound booth in the pit (FOH): a low desk wall to hide behind, a roof on posts
  blk(13, 0, 3.4, 0.4, 1.1, 'wood', { walk: false }); blk(14.6, 0, 0.4, 3.4, 1.1, 'wood', { walk: false });
  for (const z of [-1.5, 1.5]) blk(13, z, 3.4, 0.4, 1.1, 'wood', { walk: false });
  canopy(13.4, 0, 4.2, 4.2, 2.6, 'dark'); signAt('festFOH', 11.18, 2.2, 0, 1.2, 0.6, -Math.PI / 2);
  B('dark', 1.6, 0.08, 0.7, 13.6, 1.15, 0, 0, 0, 0, false);
  // THE BIG ONE: the giant inflatable joint in the west field (a long tube you can hide behind, not climb)
  CYL('joint', 1.15, 1.35, 11, 18, -22, 1.3, 0, 0, 0, Math.PI / 2); PZ(-22, 0, 0, 11, 2.5, 2.2);
  CYL('jointTip', 1.15, 0.9, 1.4, 18, -27.9, 1.3, 0, 0, 0, Math.PI / 2); CYL('jointEmber', 1.36, 1.36, 0.25, 18, -16.4, 1.3, 0, 0, 0, Math.PI / 2);
  for (const x of [-26, -18]) beam('dark', x, 2.5, 0, x, 0, 1.8, 0.02, 0.02, false);
  // bunting over the middle path
  bunting(-12, 4.5, -18, 12, 4.5, -18); bunting(-12, 4.5, 18, 12, 4.5, 18); bunting(-30, 4, 0, -12, 4.5, -10);
  symZ((s, Z, D) => {
    // stairs up to the stage from the north and south ends (west side, behind the speakers)
    stairs(-6.5, Z(6 + 7 * 0.42), D('n'), 1.6, 0, ST, 'wood', { run: 0.42 });
    stairs(-1.8, Z(6 + 7 * 0.42), D('n'), 1.4, 0, ST, 'wood', { run: 0.42 });
    // ---- WEST: the vendor village, two rows of tents
    const vk = ['tentA', 'tentB', 'tentC'];
    for (let i = 0; i < 3; i++) { tent(-27.5, Z(6.5 + i * 5.2), vk[i % 3], 'festV' + ((i + (s > 0 ? 0 : 3)) % 6), 1); tent(-15.5, Z(6.5 + i * 5.2), vk[(i + 1) % 3], 'festV' + ((i + (s > 0 ? 3 : 0)) % 6), -1); }
    blk(-21.5, Z(12), 2.2, 0.8, 0.8, 'wood', { walk: false }); barrelAt(-20, Z(17.6), 'blue'); cone(-21.5, Z(9.5)); cone(-21.5, Z(14.8));
    // hay bales along the walk to the gates
    for (const [x, z] of [[-10, 13], [-6.5, 15], [6.5, 15], [10, 13]]) blk(x, Z(z), 1.6, 0.9, 0.85, 'hay', { walk: false });
    for (const [x, z] of [[-3.2, 9.5], [3.2, 9.5]]) blk(x, Z(z), 0.9, 1.6, 0.85, 'hay', { walk: false });
    // ---- EAST: the bleachers, eight rows climbing east to 2.4 m, stairs on their gate end
    for (let r = 0; r < 8; r++) { blk(21 + r * 1.0, Z(10), 1.0, 8, 0.3 * (r + 1), 'steel', { walk: true }); B('paintBlue', 1.0, 0.06, 8, 21 + r, 0.3 * (r + 1) + 0.03, Z(10), 0, 0, 0, false); }
    wall(29, Z(6), 29, Z(14), 1.1, 'steel', { y: 2.4, t: 0.1 });
    rail(21, Z(6), 29, Z(6), 0, { h: 1.0 }); rail(21, Z(14), 29, Z(14), 0, { h: 1.0 });
    for (let r = 0; r < 8; r += 2) rail(21 + r, Z(14), 22 + r, Z(14), 0.3 * (r + 1), { h: 1.0 });
    // food trucks between the bleachers and the middle, porta-potties by the gate
    blk(24.5, Z(2.4), 6, 2.5, 2.8, 'paintWhite', { y: 0.35, walk: false }); PZ(24.5, 0, Z(2.4), 5.6, 0.35, 2.3);
    signAt('festF' + (s > 0 ? 0 : 1), 24.5, 2.5, Z(2.4) - 1.27 * s, 3.0, 0.75, s > 0 ? Math.PI : 0);
    for (const x of [22.4, 26.6]) for (const dz of [-0.9, 0.9]) CYL('rubber', 0.42, 0.42, 0.3, 12, x, 0.42, Z(2.4) + dz, Math.PI / 2, 0, 0);
    for (let i = 0; i < 5; i++) { blk(18 + i * 1.35, Z(20), 1.2, 1.2, 2.3, i % 2 ? 'potty' : 'paintGreen', { walk: false }); B('paintWhite', 1.22, 0.1, 1.22, 18 + i * 1.35, 2.35, Z(20), 0, 0, 0, false); }
    // ---- more cover between the lanes: a camper van, the merch trailer, a delay tower with its scaffold
    blk(10.5, Z(17.5), 2.4, 6, 2.9, 'paintWhite', { y: 0.3, walk: false }); PZ(10.5, 0, Z(17.5), 2.2, 0.3, 5.6); B('paintOrange', 2.42, 0.4, 6.02, 10.5, 1.6, Z(17.5), 0, 0, 0, false);
    blk(-10.5, Z(19.5), 5, 2.2, 2.4, 'paintYellow', { y: 0.3, walk: false }); PZ(-10.5, 0, Z(19.5), 4.6, 0.3, 2); signAt('festV2', -10.5, 2.0, Z(19.5) - 1.12 * s, 2.4, 0.9, s > 0 ? Math.PI : 0);
    blk(-12, Z(5.5), 1.5, 1.5, 4.5, 'truss', { walk: false }); B('dark', 1.2, 1.4, 1.2, -12, 5.2, Z(5.5), 0, 0, 0, false);
    blk(16, Z(9), 1.2, 3.2, 1.0, 'hay', { walk: false });
    // ---- the pit: coolers and a couple of picnic tables
    blk(8, Z(7), 0.6, 1.8, 0.75, 'wood', { walk: false }); blk(18.5, Z(11.5), 1.8, 0.6, 0.75, 'wood', { walk: false });
    for (const [x, z, k] of [[9.5, 11, 'paintRed'], [16, 6.2, 'paintBlue'], [5.5, 3.8, 'paintWhite']]) blk(x, Z(z), 0.8, 0.5, 0.5, k, { walk: false });
    // ---- the gate: ticket booths, the arch, a bus parked outside the line
    for (const x of [-4.6, 4.6]) { blk(x, Z(25), 2.2, 2.2, 2.4, 'paintWhite', { walk: false }); B('windowGlass', 1.6, 0.8, 0.05, x, 1.5, Z(25) - 1.11 * s, 0, 0, 0, false); B('awningRed', 2.6, 0.08, 2.6, x, 2.5, Z(25), 0, 0, 0, false); }
    for (const x of [-7.8, 7.8]) { B('truss', 0.4, 5, 0.4, x, 2.5, Z(23)); PZ(x, 0, Z(23), 0.4, 5, 0.4); }
    batchAdd('festGate', new THREE.PlaneGeometry(14, 3.5), mat4(0, 5.2, Z(23), 0, s > 0 ? Math.PI : 0, 0), false);
    batchAdd('festGate', new THREE.PlaneGeometry(14, 3.5), mat4(0, 5.2, Z(23) + 0.02 * s, 0, s > 0 ? 0 : Math.PI, 0), false);
    blk(-20, Z(27.5), 10, 2.6, 2.9, 'paintGreen', { y: 0.35, walk: false }); PZ(-20, 0, Z(27.5), 9.4, 0.35, 2.4);
    for (let i = 0; i < 5; i++) B('glassDark', 1.5, 0.9, 2.62, -23.6 + i * 1.8, 2.3, Z(27.5), 0, 0, 0, false);
    blk(20, Z(27.5), 3.2, 2.4, 1.2, 'wood', { walk: false }); palletLoad(16, Z(28.5), 0, 1.1, 'cloth2');
    // a light tower at each end
    floodlight(-31, Z(22), 0, 12); floodlight(31, Z(22), 0, 12);
  });
  // the ferris wheel outside the fence (scenery)
  const fw = new THREE.Group();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; beam('truss', -46, 12, 30, -46, 12 + Math.sin(a) * 10, 30 + Math.cos(a) * 10, 0.2, 0.2, false); B(['paintRed', 'paintYellow', 'paintBlue'][i % 3], 1.2, 1.2, 1.2, -46, 12 + Math.sin(a) * 10 - 1, 30 + Math.cos(a) * 10, 0, 0, 0, false); }
  batchAdd('truss', new THREE.TorusGeometry(10, 0.18, 6, 40), mat4(-46, 12, 30, 0, Math.PI / 2, 0), false);
  beam('truss', -46, 0, 24, -46, 12, 30, 0.4, 0.4, false); beam('truss', -46, 0, 36, -46, 12, 30, 0.4, 0.4, false);
  // trees and hills beyond the fence
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, r = 42 + (i % 3) * 6; tree(Math.cos(a) * r, Math.sin(a) * r, false, 1.4); }
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.2, r = 120 + (i % 3) * 15; batchAdd('leaf', new THREE.ConeGeometry(40 + (i % 4) * 8, 14 + (i % 5) * 4, 9), mat4(Math.cos(a) * r, 3, Math.sin(a) * r, 0, i, 0), false); }
}
defineMap({
  id: 'smokeout', size: 'core', name: 'SMOKE OUT', place: '4/20 music festival, sunny afternoon', desc: 'A festival field: the main stage in the middle, the vendor tents and a giant inflatable joint on one side, the bleachers and food trucks on the other.',
  play: [-32, 32, -32, 32], build: buildFest,
  env: { top: 0x3f7ac8, horizon: 0xe8e0c8, fog: 0.0055, sun: [-30, 55, 30], sunCol: 0xfff0d0, sunI: 2.5, skySun: 0xfff0c8, hemiSky: 0xd0e0f0, hemiGround: 0x6a6a3a, exposure: 1.02 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 29 }, { x: 0, z: -29 }],
    hp: [{ x: -4, z: 0, y: 1.8 }, { x: -22, z: 4.5 }, { x: 22, z: 0 }, { x: -10, z: -15 }, { x: 10, z: 15 }],
    flags: [{ x: 0, z: 29.5 }, { x: 0, z: -29.5 }],
    sites: [{ x: -21.5, z: -12, n: 'A' }, { x: 18, z: -8, n: 'B' }],
  },
  menu: { x: 0, z: 0, r: 12, y: 3 },
  navPts: [{ x: -4, z: 0, y: 1.8 }, { x: 28.5, z: 10, y: 2.4 }, { x: 13, z: 0 }, { x: -22, z: 4.5 }, { x: -21.5, z: 15 }, { x: 0, z: 20 }],
  views: [[0, 1.7, 27, 0, 1.6, 0], [10, 1.7, 3, -4, 2.5, 0], [28, 4.2, 12, -2, 1.5, 0], [-12, 1.7, 9, -26, 1.2, 9], [-12, 1.7, -2, -24, 1.2, 0.5]],
});
