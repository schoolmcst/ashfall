/* ================================================================== CORE map: BLACKWATER PIER (fishing harbour, foggy dawn)
   68 x 68 m. Spawns on the quays at the north and south ends. Three lanes run north-south:
     WEST - the pier: a long wooden pier over the water with a two-storey boathouse in the middle and boats tied up
     MID  - the fish market: an open hall under a roof on posts, stalls and ice crates, a street beside it
     EAST - the cannery: a tall hall with vats, conveyors and a catwalk; the boatyard between it and the spawns
   Connectors: three footbridges from the pier to the market quay (z = 0 and +-14), the street between market and
   cannery, the cannery's doors. Power position: the cannery catwalk (4 m) behind open upper windows looking over the
   market. Shots from the market, the cannery floor and the boathouse's upper floor all reach it, and its two
   stairs come up from the open cannery floor. Mirrors north/south. */
function buildPier() {
  buildMap2Materials();
  // land: everything east of the market quay, plus the two spawn quays across the full width
  floorQuad(8.75, 0, 50.5, 70, 0, 'concrete', 4);
  for (const s of [-1, 1]) floorQuad(-25.25, s * 29.2, 18.5, 10.4, 0, 'concrete', 4);
  floorQuad(-30, 0, 120, 140, -0.7, 'water', 12);                        // the harbour
  floorQuad(-25.5, 0, 5, 48, 0.02, 'wood', 1.5);                         // pier deck
  const bar = (x0, z0, x1, z1) => blk((x0 + x1) / 2, (z0 + z1) / 2, Math.max(0.2, Math.abs(x1 - x0)), Math.max(0.2, Math.abs(z1 - z0)), 2.6, 'dark', { noDraw: true, noRay: true, walk: false });
  // the water's edges: you can't walk off the pier, the bridges or the quays (low rails / bollards show where)
  bar(-28.1, -24, -28.1, 24); rail(-28.1, -24, -28.1, 24, 0, { key: 'wood', h: 1.0 });
  for (const s of [-1, 1]) { bar(-34, s * 24, -28, s * 24); bar(-23, s * 24, -16.5, s * 24); B('stone', 18.5, 0.8, 0.5, -25.25, -0.4, s * 24.2); }
  B('stone', 0.5, 0.8, 48, -16.3, -0.4, 0);
  const segs = [[-24, -15.25], [-12.75, -1.25], [1.25, 12.75], [15.25, 24]];
  for (const [a, b] of segs) { bar(-22.9, a, -22.9, b); rail(-22.9, a, -22.9, b, 0, { key: 'wood', h: 1.0 }); bar(-16.5, a, -16.5, b); for (let z = a + 1; z < b; z += 3.2) CYL('dark', 0.18, 0.22, 0.6, 8, -16.8, 0.3, z); }
  // footbridges (2.5 m wide) from the pier to the quay
  for (const zc of [-14, 0, 14]) { floorQuad(-19.7, zc, 6.4, 2.5, 0.02, 'wood', 1.5); for (const e of [-1.25, 1.25]) { bar(-22.9, zc + e, -16.5, zc + e); rail(-22.9, zc + e, -16.5, zc + e, 0, { key: 'wood', h: 1.0 }); } }
  for (let z = -23; z <= 23; z += 2.4) for (const x of [-27.9, -23.1]) CYL('wood', 0.16, 0.16, 1.2, 6, x, -0.5, z, 0, 0, 0, false);   // pilings
  // ---- WEST: the boathouse on the pier (2 floors, windows over the water toward the market)
  building({ x: -25.5, z: 0, w: 5, d: 10, floors: 2, fh: 3.2, key: 'wood', floor: 'wood', roof: 'tile', doors: [['n', 2.5], ['s', 2.5], ['e', 5]], win: 1, stairSide: 'w', furnish: false, inner: false });
  const boat = (x, z, len, col) => {   // a moored fishing boat (cover only)
    blk(x, z, 2.8, len, 1.5, col, { y: -0.7, walk: false }); blk(x, z - len * 0.12, 2.0, len * 0.3, 1.6, 'paintWhite', { y: 0.8, walk: false });
    B('glassDark', 2.02, 0.5, len * 0.28, x, 2.0, z - len * 0.12, 0, 0, 0, false); CYL('steel', 0.06, 0.06, 4, 6, x, 3.4, z + len * 0.2);
  };
  symZ((s, Z, D) => {
    boat(-31.4, Z(9), 8, 'paintBlue'); boat(-31.4, Z(20.5), 6.5, 'paintRed'); boat(-19.8, Z(7), 6, 'paintGreen');
    crate(-26.8, Z(8), 1.1); crate(-24.2, Z(12.5), 1.0); barrelAt(-27.2, Z(17), 'blue'); barrelAt(-23.8, Z(20.5), 'blue'); palletLoad(-24.4, Z(5.6), 0, 1.0, 'cloth2');
    for (let k = 0; k < 2; k++) B('cloth1', 0.04, 1.2, 2.4, -27.95, 1.2, Z(14 + k * 3), 0, 0, 0, false);   // nets drying on the rail
    // ---- MID: the fish market (open hall x -11..3, z -9..9)
    for (const x of [-11, -4, 3]) for (const z of [3, 9]) { CYL('steel', 0.14, 0.14, 4.4, 8, x, 2.2, Z(z)); PZ(x, 0, Z(z), 0.3, 4.4, 0.3); }
    for (const [x, z] of [[-7.5, 3.5], [-0.5, 3.5], [-7.5, 7.5], [-0.5, 7.5]]) { blk(x, Z(z), 3.2, 1.0, 0.9, 'whiteTile', { walk: false }); B('ice', 3.0, 0.08, 0.8, x, 0.94, Z(z), 0, 0, 0, false); }
    blk(-12.5, Z(6), 0.6, 4, 1.1, 'stone', { walk: false }); blk(4.4, Z(5.5), 0.6, 3, 1.1, 'stone', { walk: false });   // low walls at the hall's edges
    crate(-9.5, Z(11.5), 1.0); crate(1.5, Z(12), 1.1); crate(2.4, Z(12.8), 0.8, 1.1);
    forklift(-5, Z(14.5), 0, true); palletLoad(-1, Z(16), 0, 1.2, 'cloth1');
    // spawn-side cover that cuts the long look down the street
    container(-4, Z(21.5), true, 0, 'paintBlue'); container(5.5, Z(21.5), true, 0, 'paintOrange', { len: 4 }); container(-4, Z(21.5), true, 2.6, 'paintRed', { len: 4.5 });
    jersey(-12, Z(25.5), true); jersey(12, Z(26), true);
    // ---- the street between market and cannery
    carWreck(7, Z(9), false); trashBin(8.6, Z(3.5)); barrelAt(6, Z(16.5), 'red');
    // ---- EAST: boatyard (boats up on cradles) between the cannery and the spawn quay
    for (const [x, z, len, col] of [[21, 17.5, 9, 'paintBlue'], [29.5, 18.5, 7, 'paintGreen']]) {
      blk(x, Z(z), 2.8, len, 2.0, col, { y: 0.6, walk: false }); for (const dz of [-len / 3, len / 3]) blk(x, Z(z) + dz, 3.2, 0.5, 0.6, 'wood', { walk: false });
      B('paintWhite', 2.0, 1.4, len * 0.3, x, 3.3, Z(z) - s * len * 0.15);
    }
    scaffold(14.6, Z(14.5), 14.6, Z(20.5), 0, 4, 'w'); tirePile(31.5, Z(15), 0, 4); gasBottles(21.5, Z(22.5));
    // ---- cannery catwalk stairs (they climb west onto the catwalk from the open floor)
    stairs(18.8, Z(4.5), 'w', 1.2, 0, 4.0, 'steel', { open: true });
    lampPost(-10, Z(31), 0, 6, 1, 0, true); lampPost(18, Z(31), 0, 6, -1, 0, true); lampPost(-22, Z(29), 0, 5, 1, 0, true);
  });
  // market roof
  B('panel', 15, 0.15, 19, -4, 4.45, 0); B('paintGreen', 15.3, 0.4, 0.15, -4, 4.3, -9.55, 0, 0, 0, false); B('paintGreen', 15.3, 0.4, 0.15, -4, 4.3, 9.55, 0, 0, 0, false);
  rayAdd(new THREE.BoxGeometry(15, 0.15, 19), mat4(-4, 4.45, 0));
  blk(-4, 0, 4, 1.2, 1.0, 'whiteTile', { walk: false }); B('ice', 3.8, 0.1, 1.0, -4, 1.02, 0, 0, 0, 0, false);   // the fish counter in the middle
  for (const [x, z] of [[-4, -5], [-4, 5]]) lampLight(x, 4.0, z, 0xfff0d0, 1.2, 12);
  // ---- EAST: the cannery (x 10..30, z -12..12, 8 m)
  const H = 8, upW = at => ({ at, w: 2.2, b: 4.4, h: 1.5 });
  wall(10, -12, 10, 12, H, 'brick', { t: 0.4, glass: false, holes: [{ at: 12, w: 3, b: 0, h: 3 }, { at: 4, w: 1.4, b: 0, h: 2.4 }, { at: 20, w: 1.4, b: 0, h: 2.4 }, upW(7), upW(10), upW(14), upW(17)] });
  wall(30, -12, 30, 12, H, 'brick', { t: 0.4, holes: [{ at: 12, w: 1.4, b: 0, h: 2.4 }, { at: 6, w: 2.4, b: 5, h: 1.6 }, { at: 18, w: 2.4, b: 5, h: 1.6 }] });
  for (const z of [-12, 12]) wall(10, z, 30, z, H, 'brick', { t: 0.4, holes: [{ at: 6, w: 4, b: 0, h: 3.6 }, { at: 15, w: 1.4, b: 0, h: 2.4 }, { at: 11, w: 2.4, b: 5, h: 1.6 }] });
  slab(20, 0, 20.4, 24.4, H + 0.3, 'sheet', 0.3); floorQuad(20, 0, 19.6, 23.6, 0.01, 'tileFloor', 2.5);
  deck(11.4, 0, 2.2, 12, 4.0, 'steel', { posts: true, rails: [] });
  rail(12.5, -6, 12.5, -5.1, 4.0); rail(12.5, -3.9, 12.5, 3.9, 4.0); rail(12.5, 5.1, 12.5, 6, 4.0); rail(10.3, -6, 12.5, -6, 4.0); rail(10.3, 6, 12.5, 6, 4.0);
  // vats, conveyors and packing tables on the floor
  for (const [x, z] of [[22, -6.5], [22, 6.5], [27, 0]]) { CYL('steel', 1.5, 1.5, 3.6, 18, x, 1.8, z); CYL('dark', 1.55, 1.55, 0.15, 18, x, 3.65, z); PZ(x, 0, z, 2.8, 3.6, 2.8); }
  blk(16, 0, 1.2, 7, 1.0, 'steel', { walk: false }); B('rubber', 1.0, 0.05, 7, 16, 1.03, 0, 0, 0, 0, false);   // conveyor
  blk(25.5, -9.5, 3, 1.2, 0.9, 'whiteTile', { walk: false }); blk(25.5, 9.5, 3, 1.2, 0.9, 'whiteTile', { walk: false });
  palletLoad(13.5, -9.6, 0, 1.2, 'cloth1'); palletLoad(13.5, 9.6, 0, 1.0, 'cloth2'); crate(28.4, -4.5, 1.1); crate(28.4, 4.8, 1.0);
  for (const [x, z] of [[15, -6], [15, 6], [24, 0], [27, -8], [27, 8]]) lampLight(x, 7, z, 0xffe8c8, 1.3, 14);
  // back alley behind the cannery
  crate(32, -6, 1.1); crate(32.4, 7, 1.2); barrelAt(32.2, 0, 'blue');
  // dressing: lighthouse and far shore
  CYL('paintWhite', 1.4, 2.0, 18, 12, -70, 9, -40); CYL('paintRed', 1.5, 1.5, 2, 12, -70, 14, -40, 0, 0, 0, false); B('signal', 1.6, 1.2, 1.6, -70, 18.6, -40, 0, 0, 0, false);
  skyline(12, 90, 150, 6, 18, 'brick');
}
defineMap({
  id: 'blackwater', size: 'core', planCut: 4.3, name: 'BLACKWATER PIER', place: 'Fishing harbour, foggy dawn', desc: 'A wooden pier with a boathouse, an open fish market and a cannery with a catwalk over it all. Footbridges link the pier to the market.',
  play: [-34, 34, -34, 34], build: buildPier,
  env: { top: 0x5e6e80, horizon: 0xc8b8a8, fog: 0.016, sun: [-60, 18, -25], sunCol: 0xffc8a0, sunI: 1.6, skySun: 0xffb890, hemiSky: 0xb0bcc8, hemiGround: 0x3a3c3e, exposure: 1.1 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 29.5 }, { x: 0, z: -29.5 }],
    hp: [{ x: -4, z: 0 }, { x: -25.5, z: 0 }, { x: 20, z: 0 }, { x: -25.5, z: -15 }, { x: 7, z: 14 }],
    flags: [{ x: 0, z: 30 }, { x: 0, z: -30 }],
    sites: [{ x: -25.5, z: -14, n: 'A' }, { x: 19, z: -8, n: 'B' }],
  },
  menu: { x: -4, z: 0, r: 12, y: 2.5 },
  navPts: [{ x: 11.4, z: 0, y: 4.0 }, { x: -25.5, z: 18 }, { x: -25.5, z: 0, y: 3.2 }, { x: 20, z: -9 }, { x: -4, z: 6 }],
  views: [[0, 1.7, 29.5, 0, 1.4, 0], [11.6, 5.6, -2, -8, 1.0, -1], [-25.5, 1.7, 22, -25.5, 1.4, 0], [-19.7, 1.7, -14, -4, 1.4, -3], [24, 1.7, 10, 12, 4.5, -3]],
});
