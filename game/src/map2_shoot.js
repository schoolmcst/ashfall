/* ================================================================== FLASH map: KILLHOUSE (training shoot house, no roof)
   40 x 40 m. Plywood walls 2.8 m high with an open top.
     WEST  - the long hallway (x -18..-8): staggered half walls, doorways into the rooms at z = 0 and +-9
     MID   - the room chain (x -8..8): rooms split by walls at z = +-5 and +-12 with offset doors
     EAST  - the outdoor track (x 8..18): barriers, a car and tyre stacks, doorways at z = +-4 and +-12
   Power position: the instructor's overwatch platform (3.1 m) over the middle room. It sees over every wall, but
   it is open on all sides, so all three lanes can shoot it. Stairs on its west and east sides. Mirrors north/south. */
function buildShoot() {
  floorQuad(0, 0, 46, 46, 0, 'concrete', 3);
  floorQuad(13, 0, 10, 36, 0.005, 'sand', 3);                       // the track is gravel
  for (const [x0, z0, x1, z1] of [[-20, -20, 20, -20], [-20, 20, 20, 20], [-20, -20, -20, 20], [20, -20, 20, 20]]) wall(x0, z0, x1, z1, 3.4, 'concrete', { t: 0.5 });
  const H = 2.8;
  // lane walls (full length, doorways are the cross connectors)
  wall(-8, -17, -8, 17, H, 'wood', { t: 0.2, holes: [{ at: 17, w: 1.6, b: 0, h: 2.3 }, { at: 8, w: 1.4, b: 0, h: 2.3 }, { at: 26, w: 1.4, b: 0, h: 2.3 }, { at: 21, w: 1.2, b: 1.0, h: 0.9 }, { at: 13, w: 1.2, b: 1.0, h: 0.9 }] });
  wall(8, -17, 8, 17, H, 'wood', { t: 0.2, holes: [{ at: 13, w: 1.4, b: 0, h: 2.3 }, { at: 21, w: 1.4, b: 0, h: 2.3 }, { at: 5, w: 1.4, b: 0, h: 2.3 }, { at: 29, w: 1.4, b: 0, h: 2.3 }, { at: 17, w: 1.2, b: 1.0, h: 0.9 }] });
  for (const s of [-1, 1]) {
    const Z = z => z * s;
    // room walls across the middle lane
    wall(-8, Z(5), 8, Z(5), H, 'wood', { t: 0.2, holes: [{ at: s > 0 ? 4 : 12, w: 1.4, b: 0, h: 2.3 }, { at: s > 0 ? 11 : 5, w: 1.2, b: 1.0, h: 0.9 }] });
    wall(-8, Z(12), 8, Z(12), H, 'wood', { t: 0.2, holes: [{ at: 8, w: 1.6, b: 0, h: 2.3 }, { at: 3, w: 1.2, b: 0, h: 2.3 }, { at: 13, w: 1.2, b: 0, h: 2.3 }] });
    // west hallway: staggered half walls
    wall(-18, Z(14), -13, Z(14), 1.15, 'wood', { t: 0.25 }); wall(-13, Z(7), -9.5, Z(7), 1.15, 'wood', { t: 0.25 }); wall(-18, Z(3), -14.5, Z(3), 1.15, 'wood', { t: 0.25 });
    crate(-11.5, Z(10.5), 1.1); crate(-16.8, Z(9), 0.9, 0, 1.6);
    // middle rooms: furniture-style cover
    blk(-4.5, Z(8.5), 1.6, 0.8, 0.9, 'wood', { walk: false }); blk(4, Z(9), 0.8, 2.0, 1.1, 'wood', { walk: false }); crate(0, Z(15.5), 1.1);
    // east track
    jersey(12, Z(6), true); jersey(15.5, Z(10.5), false); tirePile(11, Z(14.5), 0, 4); tirePile(16.5, Z(2.5), 0, 3);
    // spawn end: a wall with three openings so you leave spawn into any lane
    wall(-18, Z(17), 18, Z(17), 1.3, 'wood', { t: 0.3, holes: [{ at: 4.5, w: 4, b: 0, h: 1.3 }, { at: 18, w: 4, b: 0, h: 1.3 }, { at: 31.5, w: 4, b: 0, h: 1.3 }] });
    // targets on the walls (dressing)
    for (const x of [-15, -5, 3]) B('paintWhite', 0.5, 0.8, 0.05, x, 1.5, Z(17.85), 0, 0, 0, false);
  }
  carWreck(13.5, 0, false);
  // ---- overwatch platform over the middle room (z -5..5)
  slab(0, 0, 3, 3.2, 3.1, 'metal', 0.25);
  for (const [x, z] of [[-1.3, -1.4], [1.3, -1.4], [-1.3, 1.4], [1.3, 1.4]]) blk(x, z, 0.2, 0.2, 2.85, 'steel', { walk: false });
  for (const s of [-1, 1]) rail(-1.5, s * 1.6, 1.5, s * 1.6, 3.1, { h: 0.95 });
  stairs(-6.6, 0, 'e', 1.0, 0, 3.1, 'metal', { open: true, rails: false });
  stairs(6.6, 0, 'w', 1.0, 0, 3.1, 'metal', { open: true, rails: false });
  // the room walls next to the platform can't be walked along from up there
  for (const s of [-1, 1]) blk(0, s * 5, 16.4, 0.5, 2.0, 'dark', { y: 2.8, noDraw: true, noRay: true, walk: false });
  // dressing: lights on poles at the corners, signs
  for (const [x, z] of [[-19, -19], [19, 19], [19, -19], [-19, 19]]) lampPost(x, z, 0, 6, x > 0 ? -1 : 1, 0, false);
  paperScatter(-3, 2, 0, 2.5, 6); paperScatter(-13, -10, 0, 2, 4); cone(14, -16); cone(12.5, 16);
  skyline(10, 60, 100, 6, 18, 'facade');
}
defineMap({
  id: 'killhouse', size: 'flash', name: 'KILLHOUSE', place: 'Training shoot house, midday', desc: 'Roofless training house. A hallway, a chain of rooms and an outdoor track, all cut through with doorways. The overwatch platform sees over every wall, and everyone can see it.',
  play: [-19.6, 19.6, -19.6, 19.6], build: buildShoot,
  env: { top: 0x4f7fb6, horizon: 0xc4ccd0, fog: 0.008, sun: [-25, 60, 15], sunCol: 0xfff0d8, sunI: 2.3, skySun: 0xffe8c0, hemiSky: 0xc8d6e4, hemiGround: 0x5a5040, exposure: 1.05 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 18.5 }, { x: 0, z: -18.5 }],
    hp: [{ x: 0, z: 0 }, { x: -13, z: 0 }, { x: 13, z: -4 }, { x: 0, z: 8.5 }, { x: 0, z: -8.5 }],
    flags: [{ x: 0, z: 18.5 }, { x: 0, z: -18.5 }],
    sites: [{ x: -13, z: -9, n: 'A' }, { x: 13, z: -9, n: 'B' }],
  },
  menu: { x: 0, z: 0, r: 7, y: 1.8 },
  navPts: [{ x: 0, z: 0, y: 3.1 }, { x: -13, z: -12 }, { x: 13, z: 12 }],
  views: [[0, 1.7, 18.5, 0, 1.4, 0], [-13, 1.7, 16, -13, 1.4, -4], [-1.5, 4.8, 1, 6, 1, 9], [13, 1.7, -16, 13, 1.4, 0]],
});
