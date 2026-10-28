/* ================================================================== CORE map: DISPENSARY ROW (a city block at night, neon)
   64 x 64 m. Spawns in the parking lots at the north and south ends. Three lanes run north-south:
     WEST - the laundromats: one in each half, washers and folding tables inside, a back alley behind them (x -32..-29)
            and a dumpster alley between them (z -3..3) with a grow tent under a purple light
     MID  - the dispensary: glass counters, the shop floor, a concrete VAULT in the middle with a door east and west.
            One storefront window each side is smashed. Steel stairs on the east wall go up to the ROOF (4.4 m) - the
            power position, but the parapet is low and the whole street can see you up there
     EAST - the high street: parked cars, a bus stopped in the middle, a food truck, the bus shelters, shop fronts
   Mirrors north/south. Everything is built from the map's own numbers, so every machine gets the same colliders. */
// a glowing sign: canvas text on a plane (no collision); sub is a second smaller line
function neonMat(txt, col, sub, bg = '#0b0b10', w = 512, h = 128) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = col; g.shadowBlur = 18; g.fillStyle = col;
  g.font = `bold ${sub ? h * 0.42 : h * 0.6}px sans-serif`; g.fillText(txt, w / 2, sub ? h * 0.38 : h / 2);
  if (sub) { g.font = `bold ${h * 0.22}px sans-serif`; g.fillText(sub, w / 2, h * 0.78); }
  g.shadowBlur = 0; g.strokeStyle = col; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
}
// the green cross every dispensary hangs out front
function crossMat() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.shadowColor = '#3dff6a'; g.shadowBlur = 16; g.fillStyle = '#3dff6a';
  g.fillRect(44, 12, 40, 104); g.fillRect(12, 44, 104, 40);
  g.shadowBlur = 0; g.fillStyle = '#0f3a16'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('420', 64, 66);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, side: THREE.DoubleSide });
}
// a sign facing +z (rot 0), -z (PI), +x (PI/2), -x (-PI/2)
function signAt(key, x, y, z, w, h, ry) { batchAdd(key, new THREE.PlaneGeometry(w, h), mat4(x, y, z, 0, ry, 0), false); }
function buildDisp() {
  buildMap2Materials();
  if (!MAT.dispSign) {
    MAT.dispSign = neonMat('DISPENSARY', '#5dff7a', 'HIGH STREET · OPEN LATE');
    MAT.dispCross = crossMat();
    MAT.laundSign = neonMat('SPIN CYCLE', '#5ad8ff', 'COIN LAUNDRY · 24 HRS');
    MAT.smokeSign = neonMat('SMOKE SHOP', '#ff5ad0', 'PIPES · PAPERS · GLASS');
    MAT.tacoSign = neonMat('MUNCHIES', '#ffb03a', 'TACOS · 2AM', '#1a0f08');
    MAT.openSign = neonMat('OPEN', '#ff4a4a', '', '#100606', 256, 96);
    [neonMat('NAILS', '#ff7ad8'), neonMat('PAWN', '#ffd84a'), neonMat('LIQUOR', '#4ad0ff'), neonMat('PHONES', '#9a7aff')].forEach((m, i) => { MAT['dispShop' + i] = m; });
    MAT.neonGreen = new THREE.MeshBasicMaterial({ color: C(0x5dff7a), toneMapped: false });
    MAT.neonPink = new THREE.MeshBasicMaterial({ color: C(0xff5ad0), toneMapped: false });
    MAT.jarGlass = new THREE.MeshStandardMaterial({ color: C(0xc8e8d0), roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.55 });
    MAT.bud = new THREE.MeshStandardMaterial({ color: C(0x6a9a3a), roughness: 0.9, emissive: C(0x0a1a04) });
    if (!MAT.growLamp) MAT.growLamp = new THREE.MeshBasicMaterial({ color: C(0xd27aff) });
  }
  floorQuad(0, 0, 80, 80, 0, 'asphalt', 6);
  floorQuad(-12.5, 0, 7, 64, 0.008, 'concrete', 4);              // the plaza west of the shop
  floorQuad(12, 0, 6, 64, 0.008, 'concrete', 4);                 // the east sidewalk
  floorQuad(30.7, 0, 3.4, 64, 0.008, 'concrete', 4);             // the far sidewalk
  for (const s of [-1, 1]) { fence(-32.4, s * 32.4, 32.4, s * 32.4, 0, 2.8); fence(s * 32.4, -32.4, s * 32.4, 32.4, 0, 2.8); }
  // street markings down the middle of the high street
  for (let z = -30; z < 30; z += 4) floorQuad(22, z, 0.18, 2.2, 0.012, 'paintYellow', 1);

  /* ---- MID: the dispensary (x -9..9, z -7..7), walls 4.15 m, a walkable roof at 4.4 */
  const WH = 4.15, RT = 4.4;
  floorQuad(0, 0, 17.4, 13.4, 0.012, 'tileFloor', 3);
  symZ((s, Z, D) => {
    // storefront: the door in the middle, a smashed window on the west side, glass on the east side
    wall(-9, Z(7), 9, Z(7), WH, 'brick', { t: 0.3, holes: [{ at: 9, w: 2.4, b: 0, h: 2.6 }, { at: 4, w: 4, b: 0.9, h: 1.9, open: true }, { at: 14, w: 4, b: 0.9, h: 1.9 }] });
    wall(-9, Z(0), -9, Z(7), WH, 'brick', { t: 0.3, holes: [{ at: 4.2, w: 1.4, b: 0, h: 2.4 }, { at: 1.6, w: 1.6, b: 1.1, h: 1.0, open: true }] });
    wall(9, Z(0), 9, Z(7), WH, 'brick', { t: 0.3, holes: [{ at: 4.5, w: 1.6, b: 1.7, h: 0.9 }] });
    // the sign over the door, the cross on the corner, OPEN in the glass
    signAt('dispSign', 0, 3.35, Z(7.18), 5.2, 1.3, s > 0 ? 0 : Math.PI);
    signAt('dispCross', -9.3, 3.3, Z(5.6), 1.1, 1.1, -Math.PI / 2); signAt('dispCross', 9.3, 3.3, Z(5.6), 1.1, 1.1, Math.PI / 2);
    signAt('openSign', 5, 1.9, Z(7.2), 1.0, 0.38, s > 0 ? 0 : Math.PI);
    lampLight(0, 3.0, Z(8.4), 0x5dff7a, 1.2, 10);
    // inside: two glass counters, the register, wall shelves of jars
    for (const x of [-5.4, 5.4]) {
      blk(x, Z(4.4), 3.4, 0.8, 1.0, 'wood', { walk: false }); B('windowGlass', 3.3, 0.04, 0.7, x, 1.04, Z(4.4), 0, 0, 0, false);
      for (let i = 0; i < 4; i++) { CYL('jarGlass', 0.09, 0.09, 0.22, 8, x - 1.2 + i * 0.8, 0.82, Z(4.4), 0, 0, 0, false); CYL('bud', 0.06, 0.06, 0.1, 6, x - 1.2 + i * 0.8, 0.78, Z(4.4), 0, 0, 0, false); }
    }
    B('dark', 0.45, 0.3, 0.35, 3.8, 1.2, Z(4.4), 0, 0, 0, false); B('screen', 0.35, 0.22, 0.02, 3.8, 1.4, Z(4.2), 0, 0, 0, false);
    blk(8.4, Z(3.6), 0.6, 3.4, 2.0, 'wood', { walk: false });
    for (let k = 0; k < 3; k++) for (let i = 0; i < 6; i++) CYL('jarGlass', 0.08, 0.08, 0.2, 8, 8.05, 0.55 + k * 0.6, Z(2.2 + i * 0.55), 0, 0, 0, false);
    blk(-8.4, Z(6.1), 0.6, 1.2, 2.0, 'wood', { walk: false });
    // a waiting bench and a menu board by the door
    bench(-3.2, Z(6.1), 0, true); B('dark', 1.6, 1.0, 0.05, -6, 2.6, Z(6.8), 0, 0, 0, false);
    lampLight(0, 3.6, Z(4.5), 0xe8fff0, 0.9, 11);
    // the roof: AC units as cover, the stairs on the east wall
    acUnit(-5, Z(4), RT, 1.1); acUnit(4.5, Z(5), RT, 1.1); ventStack(-1, Z(2.4), RT, 1.4);
    stairs(9.75, Z(9.2), D('n'), 1.2, 0, RT, 'steel', { open: true });
    // ---- the plaza on the west side: planters, a bike rack, a bin
    planterBox(-12.5, Z(4.5), 0, Math.PI / 2, 2.6); planterBox(-12.5, Z(11.5), 0, Math.PI / 2, 2.6); bikeRack(-14.6, Z(8), 0, Math.PI / 2); trashBin(-10.2, Z(9.6));
    // ---- the lane between the shop and the spawn: a parked car, crates, an ATM
    carWreck(-4.5, Z(13.5), true, 'paintBlue'); crate(4.2, Z(12.4), 1.1); crate(5.2, Z(13.2), 0.9); palletLoad(6.6, Z(17.5), 0, 1.0, 'cloth2');
    blk(0, Z(18.5), 0.8, 0.6, 1.7, 'steel', { walk: false }); B('screen', 0.5, 0.35, 0.02, 0, 1.3, Z(18.5 - 0.31 * s), 0, 0, 0, false);

    /* ---- WEST: the laundromat (x -29..-17, z 3..13) */
    const LH = 3.6;
    wall(-29, Z(13), -17, Z(13), LH, 'plasterRose', { t: 0.3, holes: [{ at: 5.5, w: 1.6, b: 0, h: 2.4 }, { at: 9.8, w: 2.0, b: 1.0, h: 1.2, open: true }] });
    wall(-29, Z(3), -17, Z(3), LH, 'plasterRose', { t: 0.3, holes: [{ at: 9, w: 1.6, b: 0, h: 2.4 }, { at: 3.2, w: 1.4, b: 1.1, h: 1.0, open: true }] });
    wall(-17, Z(3), -17, Z(13), LH, 'plasterRose', { t: 0.3, holes: [{ at: 2.6, w: 1.6, b: 0, h: 2.4 }, { at: 6.4, w: 3.2, b: 0.9, h: 1.8 }] });
    wall(-29, Z(3), -29, Z(13), LH, 'plasterRose', { t: 0.3, holes: [{ at: 7.2, w: 1.4, b: 0, h: 2.3 }] });
    slab(-23, Z(8), 12.3, 10.3, LH + 0.25, 'concrete', 0.25, { walk: false });
    floorQuad(-23, Z(8), 11.6, 9.6, 0.012, 'whiteTile', 3);
    signAt('laundSign', -16.8, 2.9, Z(9.4), 3.6, 0.9, Math.PI / 2);
    // washers along the back wall, dryers stacked, a folding table down the middle
    for (let i = 0; i < 4; i++) { blk(-28.3, Z(4.4 + i * 1.3), 0.9, 1.0, 1.0, 'paintWhite', { walk: false }); batchAdd('dark', new THREE.CircleGeometry(0.28, 14), mat4(-27.84, 0.55, Z(4.4 + i * 1.3), 0, Math.PI / 2, 0), false); }
    for (let i = 0; i < 4; i++) blk(-24.5 + i * 1.3, Z(12.3), 1.0, 0.9, 1.9, 'paintWhite', { walk: false });
    blk(-22.5, Z(7.6), 4.6, 1.0, 0.9, 'steel', { walk: false }); for (const x of [-24, -21.5]) B('cloth1', 0.6, 0.15, 0.5, x, 0.98, Z(7.6), 0, 0.4, 0, false);
    lampLight(-23, 3.1, Z(8), 0xdff4ff, 0.9, 10);
    // ---- the parking lot by the spawn: a smoke shop, the van, lamps
    wall(-25, Z(22), -15, Z(22), 3.2, 'brick', { t: 0.3, holes: [{ at: 5, w: 1.6, b: 0, h: 2.4 }, { at: 2.2, w: 2, b: 1, h: 1.3 }, { at: 7.8, w: 2, b: 1, h: 1.3 }] });
    wall(-25, Z(26), -15, Z(26), 3.2, 'brick', { t: 0.3, holes: [{ at: 5, w: 1.6, b: 0, h: 2.4 }] });
    wall(-25, Z(22), -25, Z(26), 3.2, 'brick', { t: 0.3 }); wall(-15, Z(22), -15, Z(26), 3.2, 'brick', { t: 0.3, holes: [{ at: 2, w: 1.4, b: 1.0, h: 1.2, open: true }] });
    slab(-20, Z(24), 10.3, 4.3, 3.45, 'concrete', 0.25, { walk: false });
    signAt('smokeSign', -20, 2.85, Z(22) - 0.18 * s, 3.4, 0.85, s > 0 ? Math.PI : 0);
    blk(-20, Z(24.6), 4, 0.7, 1.0, 'wood', { walk: false });
    blk(13.5, Z(24), 2.2, 5.2, 2.4, 'paintWhite', { walk: false }); blk(13.5, Z(21), 2.1, 1.4, 1.7, 'paintWhite', { walk: false }); B('glassDark', 2.0, 0.6, 0.05, 13.5, 1.5, Z(20.3), 0, 0, 0, false);
    for (const x of [-8, 8]) { carWreck(x, Z(25), false, x < 0 ? 'paintRed' : 'paintWhite'); }
    for (let i = -2; i <= 2; i++) stripes(i * 4.5, Z(25), 0, false, 1, 4.6);
    lampPost(-11, Z(30.5), 0, 6, 1, 0, s > 0); lampPost(11, Z(30.5), 0, 6, -1, 0, s < 0);
    dumpster(-30.4, Z(18), 0, false); dumpster(-27, Z(31), 0, true, 'paintBlue');

    /* ---- EAST: the high street */
    carWreck(17.6, Z(9), false, 'paintWhite'); carWreck(17.6, Z(20), false, 'paintBlue'); carWreck(27.4, Z(14), false, 'paintRed');
    // the bus shelter on the sidewalk
    B('windowGlass', 0.05, 2.0, 3.0, 14.6, 1.1, Z(14.5), 0, 0, 0, false); PZ(14.6, 0, Z(14.5), 0.1, 2.1, 3.0);
    B('dark', 1.5, 0.08, 3.2, 14.0, 2.2, Z(14.5), 0, 0, 0, false); bench(14.1, Z(14.5), 0, false);
    // the food truck (MUNCHIES) and its serving hatch
    blk(26.6, Z(4.6), 2.5, 5.6, 2.8, 'paintWhite', { y: 0.35, walk: false }); PZ(26.6, 0, Z(4.6), 2.3, 0.35, 5.2);
    signAt('tacoSign', 25.33, 2.6, Z(4.6), 3.0, 0.75, -Math.PI / 2);
    for (const z of [2.8, 6.4]) for (const x of [25.4, 27.8]) CYL('rubber', 0.42, 0.42, 0.3, 12, x, 0.42, Z(z), 0, 0, Math.PI / 2);
    // shop fronts along the far side: a wall with lit windows and signs (the edge of the map)
    wall(31.6, Z(0), 31.6, Z(31), 7.5, 'brick', { t: 0.4, holes: [{ at: 5, w: 3, b: 0.9, h: 1.9 }, { at: 12, w: 3, b: 0.9, h: 1.9 }, { at: 19, w: 3, b: 0.9, h: 1.9 }, { at: 26, w: 3, b: 0.9, h: 1.9 }] });
    for (let i = 0; i < 4; i++) signAt('dispShop' + ((i + (s > 0 ? 0 : 2)) % 4), 31.38, 3.4, Z(5 + i * 7), 2.6, 0.65, -Math.PI / 2);
    lampPost(14.8, Z(4), 0, 6.5, 1, 0, true); lampPost(29.6, Z(24), 0, 6.5, -1, 0, true);
    hydrant(10.4, Z(18)); trashBin(14.8, Z(9.5)); newsBox(14.6, Z(20), 0, -Math.PI / 2);
  });
  // the roof landing at the top of both flights, a gap in the parapet onto the roof
  deck(9.75, 0, 1.2, 4.3, RT, 'steel', { posts: true, rails: ['e'] });
  flatRoof(-9, -7, 9, 7, RT, 'concrete', 'brick', [['e', 0, 2.4]], 0.9);
  // the vault in the middle: concrete walls, doors east and west, a safe and shelves of jars inside
  wall(-3, -2.6, 3, -2.6, WH, 'concrete', { t: 0.3 }); wall(-3, 2.6, 3, 2.6, WH, 'concrete', { t: 0.3 });
  wall(-3, -2.6, -3, 2.6, WH, 'concrete', { t: 0.3, holes: [{ at: 2.6, w: 1.4, b: 0, h: 2.3 }] });
  wall(3, -2.6, 3, 2.6, WH, 'concrete', { t: 0.3, holes: [{ at: 2.6, w: 1.4, b: 0, h: 2.3 }] });
  blk(0, -1.8, 1.2, 0.9, 1.4, 'dark', { walk: false }); B('steel', 0.3, 0.3, 0.05, 0.25, 0.9, -1.33, 0, 0, 0, false);
  for (const z of [-2.2, 2.2]) for (let k = 0; k < 3; k++) for (let i = 0; i < 7; i++) CYL('jarGlass', 0.08, 0.08, 0.2, 8, -2.2 + i * 0.7, 0.6 + k * 0.6, z, 0, 0, 0, false);
  for (const z of [-2.2, 2.2]) B('wood', 4.8, 0.05, 0.35, 0, 0.5, z, 0, 0, 0, false);
  lampLight(0, 3.4, 0, 0xfff0d0, 0.7, 6);
  // the bus stopped in the middle of the street
  blk(22.2, 0, 2.6, 10, 2.9, 'paintYellow', { y: 0.35, walk: false }); PZ(22.2, 0, 0, 2.4, 0.35, 9.4);
  for (const z of [-4.2, -1.4, 1.4, 4.2]) B('glassDark', 2.62, 0.9, 1.9, 22.2, 2.2, z, 0, 0, 0, false);
  for (const z of [-3.4, 3.4]) for (const x of [21.0, 23.4]) CYL('rubber', 0.5, 0.5, 0.35, 12, x, 0.5, z, 0, 0, Math.PI / 2);
  // the dumpster alley between the laundromats: dumpsters, pallets and a grow tent under purple light
  dumpster(-26.5, -1.3, 0, true); crate(-21.5, 1.6, 1.1); crate(-20.6, 0.8, 0.9); palletLoad(-18.6, -1.5, 0, 1.0, 'cloth1');
  B('cloth2', 1.6, 1.9, 1.6, -23.4, 0.95, 1.3, 0, 0, 0, true); PZ(-23.4, 0, 1.3, 1.6, 1.9, 1.6); B('growLamp', 1.0, 0.04, 1.0, -23.4, 1.92, 1.3, 0, 0, 0, false);
  lampLight(-23.4, 2.4, 1.3, 0xc070ff, 1.0, 8); lampLight(-30.8, 3, 0, 0xffb070, 0.8, 9);
  // the back alley behind the laundromats: a light and some trash
  trashBin(-31.4, -6); trashBin(-31.4, 6.5); paperScatter(-30.8, 0, 0, 1.5, 6);
  // the city around the block
  skyline(14, 70, 110, 18, 46, 'facade');
}
defineMap({
  id: 'dispensary', size: 'core', name: 'DISPENSARY ROW', place: 'High street, late at night', desc: 'A dispensary in the middle of a neon high street. A vault in the shop, a roof over everything, laundromats on one side and a bus parked across the street on the other.',
  play: [-32, 32, -32, 32], build: buildDisp,
  env: { top: 0x0c1022, horizon: 0x3a2a48, fog: 0.009, sun: [-30, 40, 30], sunCol: 0xa8b8e0, sunI: 0.85, skySun: 0x6a5a8a, hemiSky: 0x8a8ab0, hemiGround: 0x3a3436, exposure: 1.45 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 29 }, { x: 0, z: -29 }],
    hp: [{ x: 0, z: 0 }, { x: -23, z: 0 }, { x: 26.5, z: 0 }, { x: -12, z: -12 }, { x: 12, z: 12 }],
    flags: [{ x: 0, z: 29.5 }, { x: 0, z: -29.5 }],
    sites: [{ x: -23, z: -8 }, { x: 22, z: -10 }].map((p, i) => Object.assign(p, { n: 'AB'[i] })),
  },
  menu: { x: 0, z: 10, r: 10, y: 2.2 },
  navPts: [{ x: 4, z: -3.5, y: 4.4 }, { x: 9.75, z: 0, y: 4.4 }, { x: 0, z: 0 }, { x: -23, z: 8 }, { x: -30.7, z: 0 }, { x: 22, z: 12 }, { x: -20, z: 24 }],
  views: [[0, 1.7, 26, 0, 1.4, 0], [-7, 1.7, 6.2, 5, 1.1, 3], [6, 6.1, 5, -6, 4, -5], [24, 1.7, 16, 22, 1.4, 0], [-18, 1.7, 1, -28, 1.2, 0]],
});
