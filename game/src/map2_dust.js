/* ================================================================== CORE map: DUSTWATER (desert village, midday)
   68 x 68 m. Spawns at the north and south gates. Three lanes run north-south:
     WEST - the wadi: a dry riverbed with rocks, a pump house and a wrecked truck - long sightlines
     MID  - the market street: stalls under awnings, the fountain plaza in the middle
     EAST - the rooftop route: outside stairs onto a row of flat roofs, plank bridges, the mosque roof
   Connectors: alleys at z = 0 and +-13 between the west houses (and doors straight through them), the plaza opening
   to the mosque yard. Power position: the minaret balcony (7 m) over the plaza - it sees the street and the yard,
   but the mosque roof, the east rooftops and the west houses' upper windows all have angles on it, and its only
   way up is one stair from the mosque roof. Mirrors north/south. */
function buildDust() {
  buildMap2Materials();
  floorQuad(0, 0, 80, 80, 0, 'sand', 4);
  floorQuad(0, 0, 22, 68, 0.01, 'stone', 3);                       // street paving
  floorQuad(-27, 0, 12, 68, 0.012, 'mud', 4);                      // the riverbed
  for (const s of [-1, 1]) { wall(-34.4, s * 34.4, 34.4, s * 34.4, 3.2, 'plasterOchre', { t: 0.5 }); wall(s * 34.4, -34.4, s * 34.4, 34.4, 3.2, 'plasterOchre', { t: 0.5 }); }
  const rock = (x, z, w, d, h) => { blk(x, z, w, d, h, 'rock', { walk: h < 1.3 }); B('rock', w * 0.7, h * 0.5, d * 0.8, x + w * 0.2, h + h * 0.2, z - d * 0.1, 0.2, 0.5, 0.1); };
  symZ((s, Z, D) => {
    // ---- WEST: the wadi
    for (const [z0, z1] of [[3, 11], [15, 24]]) blk(-20.6, Z((z0 + z1) / 2), 0.8, z1 - z0, 0.9, 'stone', { walk: false });   // low bank wall with gaps at the alleys
    blk(-33.4, Z(14), 1.2, 30, 0.7, 'sand', { walk: false });
    rock(-27.5, Z(5), 2.6, 2.0, 1.4); rock(-23.5, Z(20.5), 2.2, 1.8, 1.1); rock(-31, Z(19), 2.4, 2.6, 1.7);
    building({ x: -27, z: Z(12), w: 5, d: 4, floors: 1, fh: 3, key: 'plasterOchre', floor: 'concrete', roof: 'flat', doors: [['e', 2], ['w', 2]], win: 0.6, furnish: false, inner: false });   // pump house
    barrelAt(-24.2, Z(14.6), 'blue'); barrelAt(-24.8, Z(15.3), 'blue'); sandbags(-28, Z(26), 3.2, true, 3);
    palm(-31.5, Z(8), 6.5); palm(-22.5, Z(27), 5.8);
    // ---- west house row (2 floors): doors on the street and wadi sides are connectors too
    building({ x: -15.5, z: Z(7), w: 8, d: 8, floors: 2, fh: 3.2, key: 'plasterOchre', floor: 'tile', roof: 'flat', doors: [['e', 4], ['w', 4]], win: 0.9, stairSide: 'w', furnish: true });
    building({ x: -15.5, z: Z(19), w: 8, d: 8, floors: 2, fh: 3.2, key: 'plaster', floor: 'tile', roof: 'flat', doors: [['e', 4], ['w', 4], [s > 0 ? 's' : 'n', 4]], win: 0.9, stairSide: 'w', furnish: true });
    crate(-12.5, Z(12.4), 1.0); crate(-18.6, Z(13.8), 0.9, 0, 1.4);
    // ---- MID: market stalls along the street
    for (const [x, z, col] of [[-8, 8.5, 'awningRed'], [-8, 15, 'awningStripe'], [8, 9, 'awningGreen'], [8, 15.5, 'awningRed'], [-8, 21, 'awningGreen']]) {
      canopy(x, Z(z), 3.2, 2.4, 2.5, col);
      blk(x, Z(z), 2.6, 0.9, 0.9, 'wood', { walk: false });
      B('cloth3', 2.4, 0.05, 0.7, x, 0.93, Z(z), 0, 0, 0, false);
    }
    carWreck(-3.2, Z(12.5), false); crate(3.5, Z(19), 1.1); crate(4.4, Z(18.2), 0.8, 1.1);
    sandbags(4.5, Z(5.2), 2.6, true, 3); sandbags(-5, Z(4.6), 2.2, true, 3);
    // ---- spawn gates: a wall across the street with three arches (cuts the plaza-to-spawn sightline)
    wall(-11, Z(25), 11, Z(25), 3.4, 'plasterOchre', { t: 0.6, holes: [{ at: 3, w: 2.6, b: 0, h: 2.6 }, { at: 11, w: 3.2, b: 0, h: 2.8 }, { at: 19, w: 2.6, b: 0, h: 2.6 }] });
    palm(-9.5, Z(28), 6); palm(9.5, Z(28.5), 6.4);
    // ---- EAST: mosque yard, outside stairs, the house row with walkable roofs
    // mosque roof stair from the yard
    stairs(22.5, Z(11.72), D('n'), 1.2, 0, 4.25, 'plasterOchre', { railKey: 'wood' });
    // house nearest the middle (z 2..10) and the one by spawn (z 14..23); roofs at 4.25
    building({ x: 29.25, z: Z(6), w: 7.5, d: 8, floors: 1, fh: 4, key: 'plaster', floor: 'tile', roof: 'none', doors: [['w', 4], ['e', 4], [s > 0 ? 'n' : 's', 3.75]], win: 0.6, furnish: true, inner: false });
    building({ x: 29.25, z: Z(18.5), w: 7.5, d: 9, floors: 1, fh: 4, key: 'plasterOchre', floor: 'tile', roof: 'none', doors: [['w', s > 0 ? 2.5 : 6.5], ['e', 4.5], [s > 0 ? 's' : 'n', 3.75]], win: 0.6, furnish: true, inner: false });
    const zr = (a, b) => [Math.min(Z(a), Z(b)), Math.max(Z(a), Z(b))];
    { const [a, b] = zr(2, 10); flatRoof(25.5, a, 33, b, 4.25, 'concrete', 'plaster', [['w', Z(4), 1.6], [s > 0 ? 's' : 'n', 29, 1.6]]); }
    { const [a, b] = zr(14, 23); flatRoof(25.5, a, 33, b, 4.25, 'concrete', 'plasterOchre', [['w', Z(18.5), 1.6], [s > 0 ? 'n' : 's', 29, 1.6]]); }
    // outside stair up onto the spawn-side roof, plank bridges between the roofs and over to the mosque
    stairs(25.5 - 6.72, Z(18.5), 'e', 1.2, 0, 4.25, 'wood', { open: true, rails: false });
    slab(29, Z(12), 1.6, 4.6, 4.25, 'wood', 0.15); rail(28.2, Z(10), 28.2, Z(14), 4.25); rail(29.8, Z(10), 29.8, Z(14), 4.25);
    slab(25, Z(4), 1.6, 1.6, 4.25, 'wood', 0.15);
    // yard cover
    blk(14, Z(9.5), 4, 0.6, 1.1, 'plasterOchre', { walk: false }); palm(13, Z(14), 6.2);
    crate(19.5, Z(24), 1.1); crate(20.6, Z(24.6), 0.9); barrelAt(27, Z(26), 'red'); barrelAt(31.8, Z(11.8), 'blue');
    B('cloth1', 1.4, 0.04, 2.2, 31.5, 4.3, Z(20), 0, 0, 0, false);   // rugs drying on the roof
  });
  // ---- the mosque (one tall storey, open hall) with a walkable roof
  building({ x: 20.5, z: 0, w: 8, d: 10, floors: 1, fh: 4, key: 'plaster', floor: 'tile', roof: 'none', doors: [['w', 5], ['e', 5], ['n', 2], ['s', 2]], win: 0.5, furnish: false, inner: false });
  flatRoof(16.5, -5, 24.5, 5, 4.25, 'concrete', 'plaster', [['n', 22.5, 1.6], ['s', 22.5, 1.6], ['e', -4, 1.6], ['e', 4, 1.6]]);
  for (const z of [-2.2, 2.2]) blk(19, z, 0.6, 0.6, 4, 'plaster', { walk: false });
  for (const z of [-3.2, 3.2]) { batchAdd('tile', new THREE.SphereGeometry(1.3, 16, 8, 0, TAU, 0, Math.PI / 2), mat4(20.5, 4.25, z), true); PZ(20.5, 4.25, z, 2.0, 1.3, 2.0); }   // domes (clear of the minaret stair)
  // ---- the minaret: a 2.2 m tower with a balcony at 7 m, one stair up from the mosque roof
  blk(14, 0, 2.2, 2.2, 10.5, 'plasterOchre', { walk: false });
  CYL('plasterOchre', 0.9, 0.9, 1.2, 12, 14, 11.1, 0); batchAdd('tile', new THREE.ConeGeometry(1.0, 1.6, 12), mat4(14, 12.5, 0), true);
  slab(14, 0, 5, 5, 7.0, 'stone', 0.3);
  rail(11.5, -2.5, 16.5, -2.5, 7.0); rail(11.5, 2.5, 16.5, 2.5, 7.0); rail(11.5, -2.5, 11.5, 2.5, 7.0); rail(16.5, -2.5, 16.5, -0.75, 7.0); rail(16.5, 0.75, 16.5, 2.5, 7.0);
  stairs(16.5 + 4.62, 0, 'w', 1.2, 4.25, 7.0, 'stone', { railKey: 'wood' });
  // ---- the fountain plaza
  CYL('stone', 2.4, 2.5, 0.7, 20, 0, 0.35, 0); CYL('water', 2.1, 2.1, 0.05, 20, 0, 0.62, 0, 0, 0, 0, false); CYL('stone', 0.35, 0.45, 2.0, 10, 0, 1.0, 0); CYL('stone', 0.9, 0.5, 0.25, 12, 0, 2.0, 0);
  PZ(0, 0, 0, 4.4, 0.7, 4.4); PZ(0, 0, 0, 0.8, 2.1, 0.8);
  carWreck(-28.5, 0, false);   // truck stuck in the riverbed
  for (const [x, z] of [[-6, -1.5], [6, 1.5]]) blk(x, z, 0.8, 2.8, 0.75, 'stone', { walk: false });   // plaza benches
  // dressing
  B('cloth2', 0.03, 1.2, 2.0, -11.2, 2.0, 0, 0, 0, 0, false); B('cloth3', 0.03, 1.2, 2.0, -11.2, 2.0, 14, 0, 0, 0, false);
  for (const [x, z] of [[-29, -22], [27, 29], [-13, 30], [16, -28]]) rubbleScatter(x, z, 0, 1.5, 6);
  skyline(10, 75, 130, 4, 10, 'plasterOchre');
}
defineMap({
  id: 'dustwater', size: 'core', name: 'DUSTWATER', place: 'Desert village, midday', desc: 'A dry riverbed, a market street with a fountain plaza and a rooftop route. The minaret watches the plaza, and the rooftops watch the minaret.',
  play: [-34, 34, -34, 34], build: buildDust,
  env: { top: 0x4a86c8, horizon: 0xe8d8b8, fog: 0.006, sun: [-30, 70, 20], sunCol: 0xfff0d0, sunI: 2.6, skySun: 0xfff0c8, hemiSky: 0xd8e2ec, hemiGround: 0x8a7050, exposure: 1.05 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 30 }, { x: 0, z: -30 }],
    hp: [{ x: 0, z: 0 }, { x: -27, z: 0 }, { x: 20.5, z: 0 }, { x: -15.5, z: -13 }, { x: 15.5, z: 13 }],
    flags: [{ x: 0, z: 30.5 }, { x: 0, z: -30.5 }],
    sites: [{ x: -27, z: -15, n: 'A' }, { x: 18, z: -15, n: 'B' }],
  },
  menu: { x: 0, z: 0, r: 10, y: 2.2 },
  navPts: [{ x: 14, z: -2, y: 7.0 }, { x: 23, z: -2.5, y: 4.25 }, { x: 29, z: -18, y: 4.25 }, { x: -27, z: 20 }, { x: -15.5, z: 7, y: 3.2 }],
  views: [[0, 1.7, 30, 0, 1.4, 0], [14, 8.7, -2.2, 0, 1, 8], [-27, 1.7, 26, -27, 1.4, 0], [30, 5.9, -20, 20, 5, 0], [-13, 1.7, 0, 10, 4, 0]],
});
