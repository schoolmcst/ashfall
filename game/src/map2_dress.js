/* ================================================================== map details: the props2 set placed on each 2026 map
   One dress function per map, called at the end of that map's build. Big props sit against walls and in corners so
   the lanes, doors and the feet of stairs stay clear. 'propyard' is a hidden showroom of every prop (for checking). */
const PROP_SHOW = [
  ['hydrant', (x, z) => hydrant(x, z)], ['mailbox', (x, z) => mailbox(x, z)], ['newsBox', (x, z) => newsBox(x, z)], ['phoneBooth', (x, z) => phoneBooth(x, z)],
  ['streetSign', (x, z) => streetSign(x, z)], ['trafficLight', (x, z) => trafficLight(x, z)], ['bollards', (x, z) => bollards(x - 1, z, x + 1, z)], ['planterBox', (x, z) => planterBox(x, z)],
  ['bikeRack', (x, z) => bikeRack(x, z)], ['manhole', (x, z) => manhole(x, z)], ['wetSign', (x, z) => wetSign(x, z)], ['vendingPair', (x, z) => vendingPair(x, z)],
  ['pipeRun', (x, z) => pipeRun(x - 1.5, z, x + 1.5, z, 1.2)], ['valveWheel', (x, z) => { blk(x, z - 0.3, 1, 0.2, 2, 'concrete'); valveWheel(x, z - 0.2); }], ['elecBox', (x, z) => elecBox(x, z)], ['fuseCabinets', (x, z) => fuseCabinets(x, z)],
  ['cableSpool', (x, z) => cableSpool(x, z)], ['ibcTote', (x, z) => ibcTote(x, z)], ['drumRack', (x, z) => drumRack(x, z)], ['wallLadder', (x, z) => wallLadder(x, z)],
  ['ventFan', (x, z) => ventFan(x, z)], ['toolChest', (x, z) => toolChest(x, z)], ['weldCart', (x, z) => weldCart(x, z)], ['chainHoist', (x, z) => chainHoist(x, z, 3.5)],
  ['deskPC', (x, z) => deskPC(x, z)], ['officeChair', (x, z) => officeChair(x, z)], ['fileCab', (x, z) => fileCab(x, z)], ['waterCooler', (x, z) => waterCooler(x, z)],
  ['whiteboard', (x, z) => whiteboard(x, z)], ['bookshelf', (x, z) => bookshelf(x, z)], ['sofa', (x, z) => sofa(x, z)], ['coffeeTable', (x, z) => coffeeTable(x, z)],
  ['tvWall', (x, z) => tvWall(x, z)], ['pottedPlant', (x, z) => pottedPlant(x, z)], ['luggageCart', (x, z) => luggageCart(x, z)], ['suitcases', (x, z) => suitcases(x, z)],
  ['departBoard', (x, z) => departBoard(x, z)], ['stanchions', (x, z) => stanchions(x - 1.2, z, x + 1.2, z)], ['metalDetector', (x, z) => metalDetector(x, z)], ['clayPots', (x, z) => clayPots(x, z)],
  ['rugRolls', (x, z) => rugRolls(x, z)], ['fruitCrates', (x, z) => fruitCrates(x, z)], ['jerrycans', (x, z) => jerrycans(x, z)], ['satDish', (x, z) => satDish(x, z)],
  ['laundryLine', (x, z) => laundryLine(x - 1.5, z, x + 1.5, z, 2.2)], ['snowmobile', (x, z) => snowmobile(x, z)], ['radioMast', (x, z) => radioMast(x, z, 0, 6)], ['sledLoad', (x, z) => sledLoad(x, z)],
  ['researchTent', (x, z) => researchTent(x, z)], ['skiRack', (x, z) => skiRack(x, z)], ['fuelBladder', (x, z) => fuelBladder(x, z)], ['lobsterTraps', (x, z) => lobsterTraps(x, z)],
  ['buoys', (x, z) => buoys(x, z)], ['anchorProp', (x, z) => anchorProp(x, z)], ['lifeRing', (x, z) => { blk(x, z - 0.1, 1, 0.1, 2, 'wood'); lifeRing(x, 1.2, z); }], ['ropeCoil', (x, z) => ropeCoil(x, z)],
  ['fishCrates', (x, z) => fishCrates(x, z)], ['woodFence', (x, z) => woodFence(x - 1.5, z, x + 1.5, z)], ['wheelbarrow', (x, z) => wheelbarrow(x, z)], ['trough', (x, z) => trough(x, z)],
  ['woodPile', (x, z) => woodPile(x, z)], ['scarecrow', (x, z) => scarecrow(x, z)], ['milkCans', (x, z) => milkCans(x, z)], ['antenna', (x, z) => antenna(x, z)],
  ['ventStack', (x, z) => ventStack(x, z)], ['chimney', (x, z) => chimney(x, z)], ['skylight', (x, z) => skylight(x, z)],
];
function buildPropYard() {
  buildMap2Materials();
  floorQuad(0, 0, 60, 60, 0, 'concrete', 4);
  PROP_SHOW.forEach(([, f], i) => { const c = i % 8, r = (i / 8) | 0; f(-14 + c * 4, -16 + r * 4); });
}
defineMap({
  id: 'propyard', hidden: true, name: 'PROP YARD', place: 'Showroom', desc: 'Every prop.', play: [-20, 20, -20, 20], build: buildPropYard,
  env: { top: 0x6a8aac, horizon: 0xd8dce0, fog: 0.004, sun: [-30, 50, 25], sunCol: 0xfff4e4, sunI: 2.2, skySun: 0xfff0d8, hemiSky: 0xd0d8e0, hemiGround: 0x5a5650, exposure: 1.05 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: { spawn: [{ x: 0, z: 19 }, { x: 0, z: -19 }], hp: [{ x: 0, z: 0 }], flags: [{ x: 0, z: 19 }, { x: 0, z: -19 }], sites: [{ x: -10, z: -18, n: 'A' }, { x: 10, z: -18, n: 'B' }] },
  menu: { x: 0, z: 0, r: 9, y: 2 },
  views: [[-15, 3.2, -21, -3, 0.5, -10], [3, 3.2, -21, 14, 0.5, -10], [-15, 3.2, -9, -3, 0.5, 2], [3, 3.2, -9, 14, 0.5, 2], [-15, 3.2, 3, -3, 0.5, 14], [3, 3.2, 3, 14, 0.5, 14]],
});

// mirror helper for the dress functions: Q flips a facing for the north half
function symZQ(fn) { symZ((s, Z, D) => fn(s, Z, q => (s > 0 ? q : q === 0 ? 2 : q === 2 ? 0 : q))); }

function dressYard() {
  symZQ((s, Z, Q) => {
    elecBox(-17.6, Z(13), 0, 1); fuseCabinets(17.55, Z(15), 0, 3); cableSpool(14.3, Z(12.4), 0, 0); ibcTote(-14.6, Z(2.2));
    drumRack(0, Z(17.7), 0, Q(2)); jerrycans(-12.8, Z(12.4), 0, 1); weldCart(-3.9, Z(10.8), 0, 1); toolChest(3.95, Z(10.6), 0, 3);
    manhole(0, Z(6.5)); antenna(-16.2, Z(8.5), 5.2, 3); hydrant(17.5, Z(2.2)); wetSign(-11, Z(6.5), 0, 1);
  });
  chainHoist(1.6, 0, 6.5); pipeRun(-17.9, -10, -17.9, 10, 2.4, 0.12, 'paintYellow');
}
function dressShoot() {
  symZQ((s, Z, Q) => {
    whiteboard(-2.6, Z(11.75), 0, Q(2)); officeChair(-4.5, Z(7.6), 0, Q(2)); fileCab(7.45, Z(6.2), 0, 3); waterCooler(-18.9, Z(11), 0, 1);
    toolChest(18.95, Z(7), 0, 3); jerrycans(16.8, Z(15.6), 0, 0); elecBox(19.5, Z(1.6), 0, 3); wallLadder(-10, Z(19.7), 0, Q(2), 3.2);
    bikeRack(-6, Z(18.9), 0, 0); manhole(13, Z(8)); wetSign(-15.5, Z(5.5), 0, 0); pottedPlant(-18.9, Z(16.2));
  });
}
function dressTerminal() {
  symZQ((s, Z, Q) => {
    departBoard(-15.6, Z(9.5), 0, 1); stanchions(-7, Z(18.5), -2.5, Z(18.5), 0, 4); metalDetector(4, Z(19.6), 0, 0);
    luggageCart(19, Z(12.5), 0, 1); luggageCart(26.2, Z(13.6), 0, 0); suitcases(24.6, Z(5.4), 0, 0); suitcases(17.4, Z(17.4), 0, 1);
    vendingPair(13.6, Z(17.5), 0, 1); pottedPlant(-15, Z(20.6)); pottedPlant(12.2, Z(3.8)); wetSign(3, Z(8)); waterCooler(-15.4, Z(3.2), 0, 1);
    newsBox(-6, Z(21), 0, Q(2)); jerrycans(-21.4, Z(17.6), 0, 1); antenna(30, Z(18), 8.3, 4); ventStack(10, Z(10), 8.3, 1.2);
  });
  phoneBooth(32.3, 0, 0, 3);
}
function dressSpire() {
  symZQ((s, Z, Q) => {
    skylight(-9.6, Z(9)); skylight(10.5, Z(9), 0, 1); ventStack(-12, Z(16.5)); ventStack(12.5, Z(19));
    satDish(-30.8, Z(2.6), 0, 1); antenna(-31, Z(30), 0, 5); antenna(31, Z(28), 0, 4); elecBox(-4.0, Z(15), 0, 3);
    fuseCabinets(-32.0, Z(9.5), 0, 1); vendingPair(-21.8, Z(27.2), 0, Q(2)); chimney(28.5, Z(30.5), 0, 1.2, 'concrete');
  });
  // penthouse: living room downstairs, office upstairs
  sofa(21, 6.2, 0, 0); coffeeTable(21, 7.6); tvWall(21, 9.4, 0, 2); pottedPlant(18.3, 3.2, 0, 1.2); pottedPlant(27.8, -9.2, 0, 1.2);
  deskPC(21.5, -7.6, 3.6, 0); officeChair(21.5, -6.6, 3.6, 0); bookshelf(18.0, -3, 3.6, 1); waterCooler(26.5, 9.4, 3.6, 2); whiteboard(24.5, -9.75, 3.6, 0);
}
function dressDust() {
  symZQ((s, Z, Q) => {
    fruitCrates(-8, Z(8.5), 0.9, 0); fruitCrates(8, Z(15.5), 0.9, 2); fruitCrates(-8, Z(21), 0.9, 0); clayPots(-10.2, Z(9.2)); clayPots(10.0, Z(12.2));
    rugRolls(9.6, Z(19.5), 0, 1); jerrycans(-24.6, Z(17.6), 0, 0, 'paintGreen'); satDish(-18.8, Z(4.0), 6.65, Q(2)); satDish(-12.4, Z(22), 6.65, Q(0));
    laundryLine(-17.5, Z(11.3), -17.5, Z(14.7), 4.8); laundryLine(-13.6, Z(11.3), -13.6, Z(14.7), 5.2); antenna(-14, Z(5), 6.65, 3);
    streetSign(-11.2, Z(2.6), 0, 0, 'paintBlue'); pottedPlant(17.3, Z(5.7), 0, 1.2); chimney(-18.5, Z(9.5), 6.65, 1.0, 'plasterOchre'); satDish(32, Z(9.2), 4.25, Q(2), 0.8);
  });
}
function dressSnow() {
  symZQ((s, Z, Q) => {
    snowmobile(-17.5, Z(21), 0, 0); snowmobile(10.5, Z(21.5), 0, 1); sledLoad(-22.5, Z(25.5), 0, 1); researchTent(-30.5, Z(9.5), 0, 1);
    skiRack(-3.5, Z(20.2), 0, Q(0)); fuelBladder(-29.5, Z(24)); radioMast(-32.5, Z(32), 0, 9); ventStack(-5, Z(3), 3.65, 1); ventStack(3.5, Z(16), 3.65, 1);
    deskPC(-6.5, Z(5.3), 0, Q(2)); officeChair(-6.5, Z(4.4), 0, Q(2)); whiteboard(2.6, Z(5.75), 0, Q(2)); fileCab(8.4, Z(5.3), 0, 3);
    pottedPlant(5.2, Z(12.9)); elecBox(9.4, Z(5.3), 0, 1); jerrycans(-26, Z(3.2), 0, 0, 'paintRed');
  });
  toolChest(18.0, 3.6, 0, 1); weldCart(28.0, -8.6, 0, 0); chainHoist(24, -7.5, 7.0); chainHoist(24, 7.5, 7.0); drumRack(17.65, -3.6, 0, 1);
}
function dressPier() {
  symZQ((s, Z, Q) => {
    lobsterTraps(-27.4, Z(21.2), 0, 1); buoys(-23.6, Z(16)); ropeCoil(-27.3, Z(6.6)); ropeCoil(-17.3, Z(5)); lifeRing(-22.8, 1.6, Z(3), 1);
    anchorProp(-14.2, Z(17.5), 0, 1); fishCrates(-14.5, Z(9.5), 0, 0); fishCrates(1.8, Z(1.5), 0, 1);
    pipeRun(10.6, Z(11.4), 29.4, Z(11.4), 6.2); ventFan(12, Z(12.45), 5.2, Q(0)); valveWheel(22, Z(4.95), 1.2, Q(2)); fuseCabinets(29.5, Z(10.5), 0, 3);
    toolChest(13.2, Z(7.3), 0, 1); ibcTote(25, Z(23.5)); drumRack(-10.5, Z(23.8), 0, Q(2)); elecBox(9.6, Z(9.5), 0, 3); hydrant(9.3, Z(14.5));
    wallLadder(30.35, Z(3), 0, 1, 7.6); antenna(27, Z(9), 8.3, 4);
  });
  chainHoist(16, 2, 7.6); chainHoist(16, -2, 7.6); chimney(13, -8, 8.3, 3.0); trafficLight(9.6, 2.6, 0, 3); phoneBooth(11.0, 19, 0, 3);
}
function dressRidge() {
  symZQ((s, Z, Q) => {
    woodFence(-40, Z(36), -28, Z(36)); woodFence(-22, Z(36.5), -14, Z(36.5)); woodFence(-41.5, Z(24), -41.5, Z(34));
    wheelbarrow(-22.5, Z(25.6), 0, 1); trough(-36, Z(22), 0, 1); woodPile(-33.4, Z(19), 0, 1); scarecrow(-30, Z(13), 0, Q(0)); milkCans(-23, Z(17));
    mailbox(2.4, Z(30), 0, 1); streetSign(9.8, Z(6.2)); bollards(3.0, Z(6.2), 3.0, Z(9.2), 0, 3); jerrycans(10.3, Z(10.2), 0, 0);
    radioMast(40.5, Z(9), 2.6, 9); elecBox(41.3, Z(10.8), 2.6, 3); chimney(-25.5, Z(20), 6.7, 1.6); woodPile(25, Z(30.5), 2.6, 0);
  });
  wheelbarrow(-8.2, 4.8, 0, 2); milkCans(-12.0, -4.8); toolChest(-8.0, -5.3, 0, 0);
}
// hook each dress into its map's build
// ---- furnishing: every room gets furniture that fits it (furnish.js)
const FILL = {
  stackyard: () => {},
  killhouse: () => symZ((s, Z) => { const [a, b] = [Math.min(Z(5.1), Z(11.9)), Math.max(Z(5.1), Z(11.9))]; fillRoom(-7.9, a, 7.9, b, 0, 'office', { lights: false, max: 6 }); }),
  skyport: () => { fillBuildings('shop'); fillRoom(-15.8, -21.75, 12.85, 21.75, 0, 'gate', { lights: false, max: 16 }); fillRoom(13.15, -21.75, 29.35, 21.75, 0, 'gate', { lights: false, max: 8, art: false }); },
  spire: () => fillBuildings((r, f) => r.key === 'whiteTile' ? (f ? 'office' : 'home') : 'work'),
  dustwater: () => fillBuildings((r, f) => r.w < 6 ? 'work' : Math.abs(r.x1 + r.x0) / 2 > 18 && Math.abs(r.x1 + r.x0) / 2 < 23 ? 'mosque' : Math.abs((r.z0 + r.z1) / 2) < 10 && r.x0 > 20 ? 'shop' : f ? 'bedroom' : 'home'),
  whiteout: () => {
    fillBuildings('locker');
    fillRoom(-8.85, -5.85, -4.1, 5.85, 0, 'lab', { h: 3.4 }); fillRoom(4.1, -5.85, 8.85, 5.85, 0, 'lab', { h: 3.4 }); fillRoom(-3.9, -5.85, 3.9, 5.85, 0, 'lab', { h: 3.4, rug: false });
    symZ((s, Z) => { const [a, b] = [Math.min(Z(12.15), Z(18.85)), Math.max(Z(12.15), Z(18.85))]; fillRoom(-5.85, a, 5.85, b, 0, 'locker', { h: 3.4 }); });
    fillRoom(17.18, -9.82, 30.82, 9.82, 0, 'work', { lights: false, art: false, max: 10 });
  },
  blackwater: () => { fillBuildings('boat'); fillRoom(10.2, -11.8, 29.8, 11.8, 0, 'work', { lights: false, art: false, max: 12 }); },
  ridgeline: () => { fillBuildings((r, f) => r.w < 6 ? 'work' : f ? 'bedroom' : 'home'); fillRoom(-13.85, -5.85, -6.15, 5.85, 0, 'farm', { h: 4.1, rug: false }); fillRoom(-13.85, -5.85, -6.15, 5.85, 4.2, 'farm', { h: 3.0, rug: false }); },
};
for (const [id, f] of [['stackyard', dressYard], ['killhouse', dressShoot], ['skyport', dressTerminal], ['spire', dressSpire], ['dustwater', dressDust], ['whiteout', dressSnow], ['blackwater', dressPier], ['ridgeline', dressRidge]]) {
  const b = MAPS[id].build; MAPS[id].build = () => { ROOMS.length = 0; b(); f(); FILL[id](); };
}
// close-up views of the details (s_map renders them; the loading screen only uses the first four views)
for (const [id, vs] of Object.entries({
  stackyard: [[-15, 1.7, 16, -15, 0.8, 9], [2, 1.7, 15, 3.9, 0.8, 9], [12, 1.7, 9, 16.5, 0.8, 14]],
  killhouse: [[-1, 1.7, 7, -3, 1.4, 12], [-16, 1.7, 7, -18.5, 1, 13], [15, 1.7, 3, 18.5, 0.8, 9]],
  skyport: [[-4, 1.7, 13, 0, 1, 20], [20, 1.7, 6, 22, 0.6, 15], [-11, 1.7, 13, -15.6, 3, 9.5]],
  spire: [[24, 1.7, 2, 21, 0.6, 9], [24, 5.3, -4, 20, 4.2, -9], [-25, 1.7, 12, -31.5, 0.8, 6]],
  dustwater: [[-4, 1.7, 13, -8.5, 0.8, 9], [-11.8, 1.7, 13, -17, 4.4, 13], [6, 1.7, 23, 10, 0.6, 18]],
  whiteout: [[-6, 1.7, 1, -6.5, 0.9, 5], [-24, 1.7, 15, -30, 0.8, 9.5], [-13, 1.7, 26, -19, 0.6, 22]],
  blackwater: [[-21, 1.7, 18, -26, 0.6, 21], [16, 1.7, 0, 22, 1.2, 5], [-11, 1.7, 13, -14.5, 0.6, 9.5]],
  ridgeline: [[-38, 1.7, 13.5, -34, 0.6, 20], [35, 4.3, 14, 40.5, 6, 9], [-11.6, 1.7, -1.2, -8, 0.6, 5]],
})) MAPS[id].views = MAPS[id].views.concat(vs);
// interior views (furnished rooms)
for (const [id, vs] of Object.entries({
  killhouse: [[-6.5, 1.7, 6, 6, 1, 11]],
  skyport: [[-14, 1.7, -3, -10, 0.8, -14], [7.5, 1.7, 14, 10.5, 1, 17]],
  spire: [[27, 1.7, -8, 19, 1, -2], [1.8, 1.7, 16, -3, 1, 18]],
  dustwater: [[-12.5, 1.7, 7, -19, 0.8, 5], [-12.5, 4.9, 7.5, -19, 4, 5], [28, 1.7, 6, 32, 0.8, 9]],
  whiteout: [[4, 1.7, 15.5, -5, 1, 17.5], [5, 1.7, -4.5, 8, 1, 4]],
  blackwater: [[-25.5, 1.7, 4.2, -25.5, 0.8, -4], [-25.5, 4.9, 4.2, -25.5, 4, -4]],
  ridgeline: [[-24.5, 1.7, 20, -31, 0.8, 22.5], [-24.5, 4.9, 20, -31, 4, 22.5]],
})) MAPS[id].views = MAPS[id].views.concat(vs);
