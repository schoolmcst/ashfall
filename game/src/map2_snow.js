/* ================================================================== CORE map: WHITEOUT (arctic research base, overcast)
   68 x 68 m. Spawns at the north and south ends by the supply huts. Three lanes run north-south:
     WEST - the snowfield: snow berms like trench lines, a snowcat, fuel tanks - open and long
     MID  - the lab compound: spawn module -> glass corridor -> the lab -> corridor -> module, all indoors
     EAST - the hangar: a big open hall with a plane, crates and a catwalk, wide doors at both ends
   Connectors: side doors on the corridors and modules, three doors on each side of the lab, the yard between the lab
   and the hangar. Power position: the radar deck (5.5 m) between the snowfield and the lab. It sees across the field
   and into the lab windows, but it is open on every side, the berms and lab windows shoot back, and both stairs
   are long and in the open. Mirrors north/south. */
function buildSnow() {
  buildMap2Materials();
  floorQuad(0, 0, 90, 90, 0, 'snow', 5);
  for (const s of [-1, 1]) { fence(-34.4, s * 34.4, 34.4, s * 34.4, 0, 2.8); fence(s * 34.4, -34.4, s * 34.4, 34.4, 0, 2.8); }
  const H = 3.4, berm = (x, z, w, d, h = 1.1) => { blk(x, z, w, d, h, 'snow', { walk: true }); B('snow', w * 0.8, 0.3, d * 1.2, x, h, z, 0, 0, 0, false); };
  // ---- MID: the lab (x -9..9, z -6..6)
  const winO = (at) => ({ at, w: 1.4, b: 1.0, h: 1.0 });   // open window frame (you can shoot through)
  for (const x of [-9, 9]) wall(x, -6, x, 6, H, 'panel', { t: 0.3, glass: false, holes: [{ at: 6, w: 1.6, b: 0, h: 2.3 }, { at: 2, w: 1.3, b: 0, h: 2.3 }, { at: 10, w: 1.3, b: 0, h: 2.3 }, winO(4), winO(8)] });
  for (const z of [-6, 6]) wall(-9, z, 9, z, H, 'panel', { t: 0.3, holes: [{ at: 9, w: 2.0, b: 0, h: 2.4 }, { at: 3.5, w: 2.4, b: 1.0, h: 1.2 }, { at: 14.5, w: 2.4, b: 1.0, h: 1.2 }] });
  for (const x of [-4, 4]) wall(x, -6, x, 6, H, 'whiteTile', { t: 0.2, holes: [{ at: 3, w: 1.3, b: 0, h: 2.3 }, { at: 9, w: 1.3, b: 0, h: 2.3 }, { at: 6, w: 1.6, b: 1.0, h: 1.0 }] });
  slab(0, 0, 18.4, 12.4, H + 0.25, 'panel', 0.25); floorQuad(0, 0, 17.6, 11.6, 0.01, 'whiteTile', 2);
  for (const z of [-2.6, 2.6]) blk(0, z, 4, 1.0, 0.95, 'whiteTile', { walk: false });                  // lab benches
  blk(-6.5, 0, 1.0, 3, 1.9, 'steel', { walk: false }); blk(6.5, 0, 1.0, 3, 1.9, 'steel', { walk: false });   // server racks
  B('screen', 0.05, 0.8, 1.4, -6.0, 1.3, 0, 0, 0, 0, false); B('screen', 0.05, 0.8, 1.4, 6.0, 1.3, 0, 0, 0, 0, false);
  for (const [x, z] of [[0, 0], [-6.5, -3.5], [6.5, 3.5]]) lampLight(x, 3.0, z, 0xe8f2ff, 1.3, 12);
  symZ((s, Z, D) => {
    // glass corridor (x -1.5..1.5) to the module, with a side door each way
    for (const x of [-1.5, 1.5]) wall(x, Z(6), x, Z(12), H, 'panel', { t: 0.25, holes: [{ at: 3, w: 1.3, b: 0, h: 2.3 }, { at: 1.2, w: 1.0, b: 1.0, h: 1.4 }, { at: 4.8, w: 1.0, b: 1.0, h: 1.4 }] });
    slab(0, Z(9), 3.3, 6, H + 0.25, 'panel', 0.25); floorQuad(0, Z(9), 2.8, 6, 0.01, 'whiteTile', 2); lampLight(0, 3, Z(9), 0xe8f2ff, 0.9, 8);
    // module (x -6..6, z 12..19)
    wall(-6, Z(12), 6, Z(12), H, 'paintRed', { t: 0.3, holes: [{ at: 6, w: 2.0, b: 0, h: 2.4 }, { at: 2.5, w: 1.6, b: 1.0, h: 1.0 }, { at: 9.5, w: 1.6, b: 1.0, h: 1.0 }] });
    wall(-6, Z(19), 6, Z(19), H, 'paintRed', { t: 0.3, holes: [{ at: 6, w: 1.6, b: 0, h: 2.4 }, { at: 2.5, w: 1.6, b: 1.0, h: 1.0 }, { at: 9.5, w: 1.6, b: 1.0, h: 1.0 }] });
    for (const x of [-6, 6]) wall(x, Z(12), x, Z(19), H, 'paintRed', { t: 0.3, glass: false, holes: [{ at: 3.5, w: 1.4, b: 0, h: 2.3 }] });
    slab(0, Z(15.5), 12.4, 7.4, H + 0.25, 'panel', 0.25); floorQuad(0, Z(15.5), 11.6, 6.6, 0.01, 'carpet', 2); lampLight(0, 3, Z(15.5), 0xfff0dc, 1.0, 10);
    for (const x of [-4.6, 4.6]) blk(x, Z(17.8), 1.8, 0.6, 1.9, 'steel', { walk: false });   // lockers
    blk(-2.8, Z(14), 1.4, 0.8, 0.8, 'wood', { walk: false }); crate(3, Z(13.6), 0.9);
    // ---- WEST: the snowfield - berms laid out like trench lines
    berm(-26, Z(6), 6.5, 1.3); berm(-20.5, Z(13), 4.5, 1.3); berm(-30.5, Z(13.5), 4, 1.3); berm(-24.5, Z(21), 7, 1.3); berm(-31.5, Z(27), 4, 1.3, 1.3);
    CYL('paintWhite', 1.0, 1.0, 5, 16, -29.5, 1.1, Z(19.5), 0, 0, Math.PI / 2); PZ(-29.5, 0, Z(19.5), 5, 2.1, 2.0);   // fuel tank
    barrelAt(-21.5, Z(8.5), 'red'); barrelAt(-18.8, Z(19), 'blue');
    // ---- the radar deck stairs (long, in the open)
    stairs(-14, Z(10.82), D('n'), 1.2, 0, 5.5, 'steel', { open: true });
    // ---- yard between the lab and the hangar
    CYL('panel', 1.1, 1.1, 5, 16, 13, 1.2, Z(5.5), Math.PI / 2, 0, 0); PZ(13, 0, Z(5.5), 2.2, 2.3, 5);   // fuel tank
    blk(12.5, Z(15), 2.4, 1.6, 1.7, 'paintYellow', { walk: false }); B('dark', 0.5, 0.6, 0.5, 12.0, 2.0, Z(15));   // generator
    crate(10.8, Z(11), 1.1); crate(15, Z(19.5), 1.0); crate(15.8, Z(20.4), 0.8, 0, 1.4);
    // ---- spawn: supply huts and containers
    building({ x: -20, z: Z(28.5), w: 6, d: 4, floors: 1, fh: 3, key: 'paintRed', floor: 'wood', roof: 'flat', doors: [['n', 3], ['s', 3]], win: 0.5, furnish: true, inner: false });
    container(20, Z(27), true, 0, 'paintOrange'); container(-8, Z(26), true, 0, 'paintBlue', { len: 4 }); jersey(7, Z(24.5), true);
    berm(28, Z(24), 4, 1.4, 1.2);
    lampPost(-12, Z(31.5), 0, 6, 1, 0, true); lampPost(12, Z(31.5), 0, 6, -1, 0, true);
    // ---- the hangar catwalk stairs
    stairs(29.7, Z(8.46), D('n'), 1.2, 0, 3.4, 'steel', { open: true });
  });
  // ---- WEST: snowcat and a frozen pond
  blk(-25, 0, 2.4, 4.2, 1.2, 'paintOrange', { walk: false }); blk(-25, -0.8, 2.2, 2, 1.0, 'paintOrange', { y: 1.2, walk: false }); B('glassDark', 2.25, 0.6, 1.6, -25, 1.75, -0.8, 0, 0, 0, false);
  for (const x of [-26.3, -23.7]) B('rubber', 0.5, 0.7, 4.4, x, 0.35, 0);
  floorQuad(-30, 0, 5, 7, 0.015, 'ice', 2);
  CYL('steel', 0.06, 0.06, 7, 6, -32.5, 3.5, -8); B('paintWhite', 0.8, 0.1, 0.1, -32.5, 6.8, -8); CYL('steel', 0.06, 0.06, 7, 6, -32.5, 3.5, 8);   // weather masts
  // ---- the radar deck (5.5 m)
  deck(-14, 0, 4, 4, 5.5, 'steel', { posts: true, rails: ['w', 'e'] });
  for (const s of [-1, 1]) { rail(-16, s * 2, -14.7, s * 2, 5.5); rail(-13.3, s * 2, -12, s * 2, 5.5); }
  CYL('steel', 0.1, 0.1, 3, 8, -15.6, 7, -1.6); PZ(-15.6, 5.5, -1.6, 0.25, 3, 0.25);
  batchAdd('paintWhite', new THREE.SphereGeometry(1.0, 14, 8, 0, TAU, 0, Math.PI / 2), mat4(-15.6, 8.5, -1.6, Math.PI / 2.5, 0.6, 0), true);
  B('redLight', 0.2, 0.2, 0.2, -15.6, 8.6, -1.6, 0, 0, 0, false);
  // ---- EAST: the hangar (x 17..31, z -10..10, 7 m)
  const HH = 7;
  wall(17, -10, 17, 10, HH, 'panel', { t: 0.35, holes: [{ at: 10, w: 3, b: 0, h: 3 }, { at: 4, w: 1.4, b: 0, h: 2.3 }, { at: 16, w: 1.4, b: 0, h: 2.3 }, { at: 7, w: 1.6, b: 1.2, h: 1.0 }, { at: 13, w: 1.6, b: 1.2, h: 1.0 }] });
  wall(31, -10, 31, 10, HH, 'panel', { t: 0.35, holes: [{ at: 10, w: 1.4, b: 0, h: 2.3 }] });
  for (const z of [-10, 10]) wall(17, z, 31, z, HH, 'panel', { t: 0.35, holes: [{ at: 7, w: 8, b: 0, h: 5 }] });
  slab(24, 0, 14.4, 20.4, HH + 0.3, 'panel', 0.3); floorQuad(24, 0, 13.6, 19.6, 0.01, 'concrete', 3);
  for (const z of [-10.2, 10.2]) B('hazard', 8, 0.3, 0.1, 24, 5.15, z, 0, 0, 0, false);
  // the plane: fuselage, wings you can walk under, a tail
  blk(22, 0, 1.7, 9, 1.6, 'paintWhite', { y: 0.5, walk: false }); blk(22, -4.9, 1.2, 1.2, 1.2, 'paintRed', { y: 0.7, walk: false }); B('glassDark', 1.6, 0.5, 1.4, 22, 2.1, -3.2);
  blk(22, -1.2, 9, 1.8, 0.2, 'paintWhite', { y: 2.15, walk: false }); blk(22, 4.2, 0.2, 1.4, 1.8, 'paintRed', { y: 2.1, walk: false });
  for (const x of [20.6, 23.4]) blk(x, -1.2, 0.2, 0.2, 0.6, 'dark', { walk: false });
  crate(18.5, -6, 1.2); crate(19.2, -7.2, 1.0, 0, 1.4); crate(26.5, 5.5, 1.2); crate(26.2, 6.8, 0.9); palletLoad(19, 6.5, 0, 1.2, 'cloth2'); palletLoad(27, -6.5, 0, 1.0, 'cloth1');
  tirePile(25.5, -2, 0, 4); gasBottles(18.2, 2.2);
  deck(29.7, 0, 2.2, 6, 3.4, 'steel', { posts: true, rails: ['w'] });
  for (const [x, z] of [[24, -5], [24, 5], [24, 0]]) lampLight(x, 6.2, z, 0xfff4e0, 1.4, 16);
  // back alley behind the hangar
  berm(32.6, -14, 2, 3, 1.2); berm(32.6, 14, 2, 3, 1.2);
  // dressing: snow drifts against walls, distant ridges
  for (const [x, z, w, d] of [[-9.7, -9, 1, 5], [9.7, 9, 1, 5], [16.3, -14, 1, 4], [-6.6, 22, 1, 3]]) B('snow', w, 0.5, d, x, 0.2, z, 0, 0, 0.2, false);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = 95 + (i % 3) * 20; batchAdd('snow', new THREE.ConeGeometry(55 + (i % 4) * 12, 20 + (i % 5) * 6, 9), mat4(Math.cos(a) * (r + 40), 4, Math.sin(a) * (r + 40), 0, i, 0), false); }
}
defineMap({
  id: 'whiteout', size: 'core', planCut: 3.3, name: 'WHITEOUT', place: 'Arctic research base, overcast', desc: 'A research base in the snow. Fight across the snowfield berms, through the lab and its glass corridors, or around the plane in the hangar. The radar deck sees everything and everything sees it.',
  play: [-34, 34, -34, 34], build: buildSnow,
  env: { top: 0x8a9cb0, horizon: 0xdfe6ee, fog: 0.013, sun: [-40, 35, 30], sunCol: 0xeef2ff, sunI: 1.5, skySun: 0xf0f4ff, hemiSky: 0xdce6f2, hemiGround: 0x9aa4ae, exposure: 1.0 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 29 }, { x: 0, z: -29 }],
    hp: [{ x: 0, z: 0 }, { x: -26, z: 0 }, { x: 24, z: 0 }, { x: -14, z: -14 }, { x: 13, z: 12 }],
    flags: [{ x: 0, z: 29.5 }, { x: 0, z: -29.5 }],
    sites: [{ x: -26, z: -15, n: 'A' }, { x: 24.5, z: -6, n: 'B' }],
  },
  menu: { x: 0, z: 0, r: 12, y: 3 },
  navPts: [{ x: -14, z: -1, y: 5.5 }, { x: 29.7, z: 0, y: 3.4 }, { x: 0, z: 0 }, { x: 0, z: -15 }, { x: -26, z: 18 }],
  views: [[0, 1.7, 29, 0, 1.4, 0], [-14.5, 7.2, 1.2, -26, 1, 12], [0, 1.7, 15, 0, 1.4, -3], [24, 1.7, 13, 24, 1.6, 0], [29.7, 5.1, -2.5, 18, 1.5, 4]],
});
