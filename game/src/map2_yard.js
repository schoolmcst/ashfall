/* ================================================================== FLASH map: STACKYARD (tiny container yard, 6v6 chaos)
   36 x 36 m. Three north-south lanes (x = -11, 0, +11) between two rows of containers, joined by cross alleys at
   z = 0 and z = +-10. Power position: the stacked container tower in the middle (3.0 m) - reached by stairs on its
   east and west sides, open on all four sides so every lane can shoot back at it. Mirrors north/south. */
function buildYard() {
  floorQuad(0, 0, 44, 44, 0, 'concrete', 3);
  // painted bays and a low wall + fence around the yard (the play area stops at the fence)
  for (const s of [-1, 1]) { fence(-18.4, s * 18.4, 18.4, s * 18.4, 0, 3); fence(s * 18.4, -18.4, s * 18.4, 18.4, 0, 3); }
  floodlight(-17.5, -17.5, 0, 12); floodlight(17.5, 17.5, 0, 12); floodlight(17.5, -17.5, 0, 12); floodlight(-17.5, 17.5, 0, 12);
  const cols = ['paintRed', 'paintBlue', 'paintGreen', 'paintOrange', 'paintYellow', 'paintWhite'];
  for (const s of [-1, 1]) {
    const Z = z => z * s;
    // the two container rows between the lanes: a container either side of the middle alley, a gap at z = +-10
    for (const x of [-5.5, 5.5]) {
      container(x, Z(5.6), false, 0, cols[(x > 0 ? 1 : 0) + (s > 0 ? 0 : 2)]);
      container(x + (x > 0 ? 1.3 : -1.3), Z(14.6), false, 0, cols[(x > 0 ? 4 : 5)], { len: 4 });   // short ones at the spawn end
    }
    // outer rows: containers along the fence leave the side lanes 6 m wide
    container(-16.2, Z(7), false, 0, cols[3 - (s > 0 ? 0 : 1)]); container(16.2, Z(7), false, 0, cols[2]);
    container(-16.2, Z(7), false, 2.6, cols[1]);   // stacked: tall cover at the lane edge
    // lane cover: crates and barrels you can strafe between
    crate(-11, Z(4), 1.2); crate(-10.2, Z(3), 0.9); crate(11, Z(3.5), 1.2); crate(11.8, Z(4.6), 0.9, 0, 1.6);
    barrelAt(-12.3, Z(10.5), 'blue'); barrelAt(12.2, Z(11), 'blue'); barrelAt(0.6, Z(9.5), 'red');
    sandbags(0, Z(12.6), 3.2, true, 3);
    pallet(-9.3, Z(14.8), 0, 2); palletLoad(9.5, Z(15.6), 0, 1.0);
    // spawn end: a low wall to duck behind
    jersey(-8.5, Z(16.6), true); jersey(8.5, Z(16.6), true);
  }
  container(16.2, 0, false, 0, 'paintYellow');   // east edge middle
  // ---- the central tower: two containers stacked crosswise with a deck on top
  container(0, 0, true, 0, 'paintWhite', { len: 4.5 });
  slab(0, 0, 4.5, 2.4, 2.9, 'metal', 0.3);
  for (const s of [-1, 1]) rail(-2.25, s * 1.2, 2.25, s * 1.2, 2.9, { h: 0.9 });
  stairs(-7.2, 0, 'e', 1.1, 0, 2.9, 'metal', { open: true, rails: false });   // west stair climbs east onto the deck
  stairs(7.2, 0, 'w', 1.1, 0, 2.9, 'metal', { open: true, rails: false });
  // ---- dressing
  for (const [x, z] of [[-11, -7], [11, 8], [0, -6.5], [-3, 15], [5, -15]]) puddle(x, z, 0, 1 + Math.random());
  stripes(-11, -16, 0, false, 1, 3, 'paintYellow'); stripes(11, 16, 0, false, 1, 3, 'paintYellow');
  cone(-13.5, 2); cone(13.4, -2.5); tirePile(-14.5, 11.5, 0, 3); gasBottles(14.6, -11.8);
  skyline(14, 70, 110, 10, 30);
}
defineMap({
  id: 'stackyard', size: 'flash', name: 'STACKYARD', place: 'Container yard, overcast', desc: 'Tiny container yard. Three lanes between the stacks, cross alleys everywhere and a container tower in the middle that every lane can shoot at.',
  play: [-18, 18, -18, 18], build: buildYard,
  env: { top: 0x6b7a8a, horizon: 0xb8bec2, fog: 0.012, sun: [-30, 46, 20], sunCol: 0xf2ece2, sunI: 1.7, skySun: 0xe8e0d0, hemiSky: 0xc4ccd4, hemiGround: 0x4a4a48, exposure: 1.05 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 15 }, { x: 0, z: -15 }],
    hp: [{ x: 0, z: 0, y: 2.9 }, { x: -11, z: 0 }, { x: 11, z: 0 }, { x: -11, z: 9 }, { x: 11, z: -9 }],
    flags: [{ x: 0, z: 15.5 }, { x: 0, z: -15.5 }],
    sites: [{ x: -11, z: -8, n: 'A' }, { x: 11, z: -8, n: 'B' }],
  },
  menu: { x: 0, z: 0, r: 7, y: 1.8 },
  navPts: [{ x: 0, z: 0, y: 2.9 }, { x: -11, z: -12 }, { x: 11, z: 12 }],
  views: [[0, 1.7, 15, 0, 1.4, 0], [-11, 1.7, 14, -11, 1.4, -6], [-3, 4.5, -1, 8, 1, 6], [14, 1.7, -14, 0, 1.5, 0]],
});
