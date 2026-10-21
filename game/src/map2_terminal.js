/* ================================================================== CORE map: SKYPORT (airport terminal, late afternoon)
   68 x 68 m. Spawns on the north and south aprons. Three lanes run north-south:
     WEST - the tarmac: a walk-through fuselage section under a wing, baggage trains and a stairs truck
     MID  - the concourse: gate seating, kiosks, and the food-court mezzanine (4.2 m) in the middle
     EAST - baggage claim: carousels, pillars and a back corridor
   Connectors: three doors and two open window frames in the glass facade (tarmac <-> concourse), three doors in the
   wall between the concourse and baggage claim. Power position: the mezzanine sees the whole concourse and out
   through the open frames, but the stairs, the facade frames and the baggage doorways all have angles on it. */
function buildTerminal() {
  buildMap2Materials();
  floorQuad(0, 0, 80, 80, 0, 'asphalt', 5);
  floorQuad(8.5, 0, 49, 44, 0.01, 'whiteTile', 2.5);                // terminal floor
  for (const x of [-30, -20]) floorQuad(x, 0, 0.25, 60, 0.015, 'paintYellow', 1);
  for (const s of [-1, 1]) { fence(-34.4, s * 34.4, 34.4, s * 34.4, 0, 2.6); fence(s * 34.4, -34.4, s * 34.4, 34.4, 0, 2.6); }
  // ---- terminal shell: x -16..33, z -22..22, 8 m high, flat roof
  const H = 8;
  wall(-16, -22, -16, 22, H, 'glassDark', { t: 0.4, holes: [{ at: 22, w: 3.2, b: 0, h: 3 }, { at: 8, w: 2.6, b: 0, h: 2.8 }, { at: 36, w: 2.6, b: 0, h: 2.8 },
    { at: 17, w: 2, b: 1.0, h: 2.2 }, { at: 27, w: 2, b: 1.0, h: 2.2 }, { at: 3, w: 2.4, b: 1.0, h: 1.8 }, { at: 13, w: 2.4, b: 1.0, h: 1.8 }, { at: 31, w: 2.4, b: 1.0, h: 1.8 }, { at: 41, w: 2.4, b: 1.0, h: 1.8 }] });
  wall(33, -22, 33, 22, H, 'concrete', { t: 0.5 });
  for (const s of [-1, 1]) wall(-16, s * 22, 33, s * 22, H, 'concrete', { t: 0.5, holes: [{ at: 8, w: 4, b: 0, h: 3.2 }, { at: 40, w: 3, b: 0, h: 2.8 }, { at: 16, w: 4, b: 1.0, h: 1.8 }, { at: 30, w: 4, b: 1.0, h: 1.8 }] });
  slab(8.5, 0, 49.4, 44.4, H + 0.3, 'concrete', 0.3);
  // concourse | baggage divider
  wall(13, -22, 13, 22, H, 'whiteTile', { t: 0.3, holes: [{ at: 22, w: 2.6, b: 0, h: 2.8 }, { at: 10, w: 2.4, b: 0, h: 2.8 }, { at: 34, w: 2.4, b: 0, h: 2.8 }, { at: 16, w: 2, b: 1.0, h: 2.0 }, { at: 28, w: 2, b: 1.0, h: 2.0 }] });
  // pillars
  for (const x of [-9, 6, 20, 27]) for (const z of [-15, -6, 6, 15]) if (!(x === 6 && Math.abs(z) === 6)) blk(x, z, 0.8, 0.8, H, 'whiteTile', { walk: false });
  // ---- mezzanine (food court) over the middle of the concourse
  deck(-1.5, 0, 12, 14, 4.2, 'tileFloor', { th: 0.35, posts: true, postKey: 'whiteTile', rails: ['w', 'e'] });
  symZ((s, Z, D) => {
    rail(-7.5, Z(7), -2.6, Z(7), 4.2); rail(-0.4, Z(7), 4.5, Z(7), 4.2);
    stairs(-1.5, Z(13.8), D('n'), 2.0, 0, 4.2, 'tileFloor', { railKey: 'steel' });
    // food court tables up top
    blk(-5, Z(3), 1.4, 0.8, 0.75, 'wood', { y: 4.2, walk: false }); blk(2.5, Z(4), 0.8, 1.4, 0.75, 'wood', { y: 4.2, walk: false });
    blk(-1.5, Z(0.8), 3, 0.6, 1.1, 'whiteTile', { y: 4.2, walk: false });   // counter
    // ---- concourse: gate seating rows, kiosks
    for (const z of [10.5, 17.5]) { blk(-12.5, Z(z), 4.5, 0.6, 0.5, 'carpet', { walk: false }); blk(-12.5, Z(z + 0.45), 4.5, 0.12, 1.0, 'steel', { walk: false }); }
    building({ x: 9, z: Z(15.5), w: 5, d: 5, floors: 1, fh: 3.2, key: 'whiteTile', floor: 'tileFloor', roof: 'flat', doors: [['w', 2.5]], furnish: true, inner: false });
    blk(-12, Z(2.5), 1.2, 3, 1.2, 'paintBlue', { walk: false });                    // gate desk
    vending(-15.2, Z(6.5), 0, 'e'); trashBin(-6.5, Z(19.5), 0, 'paintWhite');
    // ---- baggage claim: carousels and a back corridor wall
    blk(22.5, Z(8.5), 8, 3, 0.7, 'steel', { walk: false }); blk(22.5, Z(8.5), 7.2, 2.2, 0.75, 'rubber', { walk: false, noCol: true, noRay: true });
    blk(22.5, Z(17), 6, 2.4, 0.7, 'steel', { walk: false });
    wall(29.5, Z(3), 29.5, Z(13), H, 'concrete', { t: 0.3, holes: [{ at: 5, w: 1.6, b: 0, h: 2.6 }] });   // service corridor along the east wall
    crate(31.5, Z(18), 1.1); palletLoad(31.2, Z(7), 0, 1.2, 'cloth2'); crate(16, Z(3.5), 1.0); crate(16.5, Z(20.5), 1.2);
    // ---- tarmac
    for (let i = 0; i < 3; i++) blk(-19.5, Z(13 + i * 2.2), 1.2, 1.8, 1.1, 'paintBlue', { walk: false });   // baggage train
    blk(-31, Z(15.5), 1.4, 2.2, 1.0, 'paintYellow', { walk: false });
    cone(-21, Z(10)); cone(-28.5, Z(11.5)); cone(-23, Z(19));
    // ---- aprons (spawns): shuttle bus, barriers
    blk(16, Z(29), 11, 2.6, 3.0, 'paintWhite', { walk: false }); B('glassDark', 10.6, 0.9, 2.62, 16, 2.0, Z(29), 0, 0, 0, false);
    jersey(-8, Z(26), true); jersey(-1.5, Z(25.5), true); jersey(24, Z(25), false); jersey(-24, Z(27), true);
    lampPost(-14, Z(31), 0, 7, 1, 0); lampPost(31, Z(31), 0, 7, -1, 0);
  });
  // ---- the fuselage section (walk through it) under a wing, engines as cover
  for (const x of [-27.3, -22.7]) wall(x, -9, x, 9, 3.2, 'paintWhite', { t: 0.3, holes: [{ at: 9, w: 1.6, b: 0, h: 2.4 }, { at: 3, w: 0.6, b: 1.3, h: 0.6 }, { at: 5, w: 0.6, b: 1.3, h: 0.6 }, { at: 13, w: 0.6, b: 1.3, h: 0.6 }, { at: 15, w: 0.6, b: 1.3, h: 0.6 }] });
  slab(-25, 0, 5, 18, 3.5, 'paintWhite', 0.3); floorQuad(-25, 0, 4.2, 18, 0.01, 'carpet', 2);
  B('paintBlue', 0.05, 0.4, 18, -27.47, 2.6, 0, 0, 0, 0, false); B('paintBlue', 0.05, 0.4, 18, -22.53, 2.6, 0, 0, 0, 0, false);
  blk(-25, 1.5, 16, 3.2, 0.3, 'paintWhite', { y: 2.4, walk: false });                           // the wing (walk under it)
  for (const x of [-31.5, -18.5]) { CYL('steel', 0.9, 0.9, 3, 16, x, 1.2, 1.5, Math.PI / 2, 0, 0); PZ(x, 0.2, 1.5, 1.8, 2, 3); }
  // stairs truck by the fuselage door: a small platform (2.4 m) looking down the tarmac
  deck(-20.2, -4.5, 2, 2.4, 2.4, 'steel', { posts: true, rails: ['e', 'n'] }); stairs(-20.2, 0.5, 'n', 1.2, 0, 2.4, 'steel', { open: true });
  // lights inside
  for (const [x, z] of [[-1.5, -12], [-1.5, 12], [22, 0], [-10, 0], [22, -14], [22, 14], [-10, -15], [-10, 15], [6, 0]]) { lampLight(x, 6.8, z, 0xfff2dc, 1.5, 22); B('signalCold', 3, 0.08, 0.6, x, 7.95, z, 0, 0, 0, false); }
  skyline(12, 80, 130, 8, 22, 'facade');
}
defineMap({
  id: 'skyport', size: 'core', planCut: 8.1, name: 'SKYPORT', place: 'Airport terminal, late afternoon', desc: 'Tarmac, concourse and baggage claim. Walk through the fuselage under the wing, hold the food-court mezzanine, or flank through the baggage hall.',
  play: [-34, 34, -34, 34], build: buildTerminal,
  env: { top: 0x4a6f9e, horizon: 0xe0c4a0, fog: 0.007, sun: [-55, 30, 25], sunCol: 0xffd8a8, sunI: 2.4, skySun: 0xffc890, hemiSky: 0xc4ccd8, hemiGround: 0x4c4a44, exposure: 1.1 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 29 }, { x: 0, z: -29 }],
    hp: [{ x: -1.5, z: 0 }, { x: -25, z: 0 }, { x: 22, z: 0 }, { x: -4, z: -15 }, { x: -4, z: 15 }],
    flags: [{ x: 0, z: 29 }, { x: 0, z: -29 }],
    sites: [{ x: -25, z: -14, n: 'A' }, { x: 22.5, z: -13, n: 'B' }],
  },
  menu: { x: -1.5, z: 0, r: 9, y: 1.8 },
  navPts: [{ x: -1.5, z: 0, y: 4.2 }, { x: -20.2, z: -4.5, y: 2.4 }, { x: -25, z: 6 }, { x: 22, z: 12 }],
  views: [[0, 1.7, 30, 0, 1.4, 0], [-10, 1.7, 18, 0, 3, -4], [3, 5.9, -5.5, -14, 2, 2], [-25, 1.7, 14, -25, 1.4, -4], [22, 1.7, 20, 22, 1.4, 0]],
});
