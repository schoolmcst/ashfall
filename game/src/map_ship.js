/* ================================================================== ZOMBIES map: THE MARY JANE (chapter five of the story)
   The boat on the horizon was the MARY JANE, the freighter that carried the Nightshade seeds from the island to the
   world. Its crew turned somewhere at sea. The survivors climb aboard at night. Built for zombies, all on one deck:
     START   - the STERN DECK (south): bollards, the lifeboat davits, the survivors' little boat tied up behind.
     MIDDLE  - the ACCOMMODATION block (the hub): the crew mess, the galley and the captain's desk; the bridge towers above.
     SIDES   - the PORT DECK (the lifeboat station) and the STARBOARD DECK (the crew's smoking spot, provisions).
     NORTH   - the CARGO DECK: the GROW CONTAINERS on the port side (lanes between stacks, some turned into grow rooms),
               the ENGINE ROOM house on the starboard side, the crane in the middle.
     BOW     - the FORECASTLE (the gun upgrader is in its locker), the anchor windlasses and the BALLAST VALVE (cook spot).
   CARGO SLINGS (the launch pads) swing you between the stern, the two side decks and the bow once the power is back. */
const SHIP = { flick: [], beam: null, piv: null, on: false, mastL: null };
function shipMaterials() {
  if (MAT.shipHull) return;
  const std = (set, o) => new THREE.MeshStandardMaterial(Object.assign({ map: set.map, bumpMap: set.bump, bumpScale: 0.015, roughness: 0.8, metalness: 0.3 }, o));
  MAT.shipHull = std(TEX.metal, { color: C(0x5a1a16), roughness: 0.7 });
  MAT.shipDeck = std(TEX.concrete, { color: C(0x4a5a4e), roughness: 0.85, metalness: 0.2 });
  MAT.shipWhite = std(TEX.concrete, { color: C(0xe6e4dc), roughness: 0.75, metalness: 0.1 });
  MAT.shipRust = std(TEX.metal, { color: C(0x8a4a26), roughness: 0.9 });
  MAT.shipYellow = std(TEX.metal, { color: C(0xe0b020), roughness: 0.6 });
  MAT.shipBlue = std(TEX.metal, { color: C(0x2a4a7a), roughness: 0.6 });
  MAT.shipSea = new THREE.MeshStandardMaterial({ color: C(0x0a1a2a), roughness: 0.05, metalness: 0.4 });
  MAT.shipGlass = new THREE.MeshStandardMaterial({ color: C(0x1a2a30), emissive: C(0xffd890), emissiveIntensity: 0.25, roughness: 0.1 });
  MAT.shipLamp = new THREE.MeshStandardMaterial({ color: C(0x302a10), emissive: C(0xfff0c0), emissiveIntensity: 0.2 });
  MAT.shipName = neonMat('MARY JANE', '#f0f0f0', 'PORT OF NOWHERE', '#3a0e0c', 1024, 256);
  MAT.shipSignMess = neonMat('CREW MESS', '#ffe0a0', 'no smoking · ha', '#1a2a3a', 512, 160);
  MAT.shipSignEng = neonMat('ENGINE ROOM', '#ffd040', 'authorised crew only', '#2a2a2a', 512, 160);
  MAT.shipSignGrow = neonMat('HOLD 3', '#c070ff', 'keep sealed · live cargo', '#1a1020', 512, 160);
  MAT.shipSignFwd = neonMat('FORECASTLE', '#ffffff', 'mind the chain', '#2a3a4a', 512, 160);
  TILES.shipDeck = 4; TILES.shipHull = 3; TILES.shipWhite = 3;
}
// a deck light on a short post (flickers until the power is back)
function shipLamp(x, z, h = 3.2, col = 0xfff0d0, i = 1.0, dist = 13, flick = true) {
  CYL('steel', 0.06, 0.08, h, 6, x, h / 2, z); B('shipLamp', 0.4, 0.2, 0.4, x, h + 0.05, z, 0, 0, 0, false); PZ(x, 0, z, 0.25, h, 0.25);
  const l = lampLight(x, h - 0.2, z, col, i, dist); if (flick) SHIP.flick.push({ l, i, t: rnd(0, 3), on: true }); return l;
}
// a lamp in a ceiling (no post)
function shipCeil(x, z, h, col = 0xfff0d0, i = 0.9, dist = 11, flick = true) { B('shipLamp', 1.2, 0.06, 0.3, x, h - 0.05, z, 0, 0, 0, false); const l = lampLight(x, h - 0.3, z, col, i, dist); if (flick) SHIP.flick.push({ l, i, t: rnd(0, 3), on: true }); return l; }
function shipBollard(x, z) { for (const d of [-0.35, 0.35]) CYL('dark', 0.18, 0.2, 0.6, 10, x + d, 0.3, z); B('dark', 1.1, 0.12, 0.45, x, 0.06, z, 0, 0, 0, false); PZ(x, 0, z, 1.1, 0.6, 0.45); }
function shipRope(x, z) { for (let i = 0; i < 3; i++) batchAdd('cloth1', new THREE.TorusGeometry(0.42 - i * 0.04, 0.06, 6, 16), mat4(x, 0.06 + i * 0.1, z, Math.PI / 2, 0, 0), false); }
// a lifeboat on chocks (orange, covered)
function shipLifeboat(x, z, alongZ = true) {
  const p = P2(x, z, 0, alongZ ? 0 : 1);
  p.b('paintOrange', 2.0, 1.1, 6.0, 0, 1.15, 0); p.b('paintWhite', 1.6, 0.5, 4.6, 0, 1.95, 0); p.b('dark', 2.05, 0.1, 6.05, 0, 0.75, 0, false);
  for (const dz of [-2, 2]) p.b('steel', 1.8, 0.6, 0.25, 0, 0.3, dz);
  p.col(2.0, 2.2, 6.0);
}
// a walk-in grow container: two sides and a back, open at one end (dir: +1 open to +z, -1 open to -z), purple inside
function shipGrowBox(x, z, dir, col = 'paintBlue') {
  const z0 = z - 3, z1 = z + 3, back = dir > 0 ? z0 : z1;
  wall(x - 1.2, z0, x - 1.2, z1, 2.6, col, { t: 0.15 }); wall(x + 1.2, z0, x + 1.2, z1, 2.6, col, { t: 0.15 }); wall(x - 1.2, back, x + 1.2, back, 2.6, col, { t: 0.15 });
  B(col, 2.55, 0.1, 6.1, x, 2.65, z, 0, 0, 0, true);
  for (let k = 0; k < 3; k++) { const zz = back + dir * (1.0 + k * 1.5); for (const dx of [-0.75, 0.75]) { CYL('soil', 0.25, 0.2, 0.35, 8, x + dx, 0.18, zz, 0, 0, 0, false); islePlant(x + dx, zz, 0.3, 0.75, k === 1 ? 'purpleLeaf' : 'leafGreen'); } }
  B('growLamp', 1.6, 0.04, 4.6, x, 2.5, z, 0, 0, 0, false);
  const l = lampLight(x, 2.2, z, 0xc070ff, 0.8, 7); SHIP.flick.push({ l, i: 0.8, t: rnd(0, 3), on: true });
}
function buildShip() {
  buildMap2Materials(); worksMaterials(); airpMaterials(); isleMaterials(); shipMaterials();
  SHIP.flick = []; SHIP.on = false; SHIP.beam = null; SHIP.piv = null; SHIP.mastL = null;
  floorQuad(0, 0, 52, 86, 0, 'shipDeck', 6);
  floorQuad(0, 0, 400, 400, -7, 'shipSea', 20);
  // ---- outside: solid all round, the hull plating down to the water
  for (const [x, z, w, d] of [[0, -43.4, 56, 2.5], [0, 43.2, 56, 2.5], [-27, 0, 3, 90], [27, 0, 3, 90]]) blk(x, z, w, d, 9, 'dark', { noDraw: true });
  for (const s of [-1, 1]) { B('shipHull', 0.6, 7.5, 72, s * 25.5, -3.4, 5.5, 0, 0, 0, false); B('shipHull', 0.6, 7.5, 13, s * 16.4, -3.4, -36, 0, 0, 0, false); B('paintWhite', 0.62, 0.3, 72, s * 25.52, -0.6, 5.5, 0, 0, 0, false); }
  B('shipHull', 52, 7.5, 0.6, 0, -3.4, 41.6, 0, 0, 0, false); batchAdd('shipName', new THREE.PlaneGeometry(10, 2.5), mat4(0, -2.2, 41.95, 0, 0, 0), false);
  for (const s of [-1, 1]) batchAdd('shipHull', new THREE.BoxGeometry(0.6, 7.5, 13.5), mat4(s * 20.7, -3.4, -36.2, 0, s * 0.62, 0), false);
  B('shipHull', 33, 7.5, 0.6, 0, -3.4, -42.3, 0, 0, 0, false);

  // ---- the hull walls (bulwarks) with boarded windows, the stern rail, the bow
  const winH = [[19, 1.6, 1.0, 1.4], [-8, 1.6, 1.0, 1.4]];
  wkZ(-25, -30, 41, 2.6, 'shipHull', winH); wkZ(25, -30, 41, 2.6, 'shipHull', winH);
  wkX(41, -25, 25, 1.2, 'shipHull'); for (let x = -24; x <= 24; x += 2) CYL('steel', 0.04, 0.04, 0.6, 6, x, 1.5, 41, 0, 0, 0, false); B('steel', 50, 0.06, 0.06, 0, 1.8, 41, 0, 0, 0, false);
  blk(0, 41.9, 52, 0.6, 5, 'dark', { noDraw: true });
  wkZ(-16, -42, -30, 2.6, 'shipHull'); wkZ(16, -42, -30, 2.6, 'shipHull'); wkX(-30, -25, -16, 2.6, 'shipHull'); wkX(-30, 16, 25, 2.6, 'shipHull'); wkX(-42, -16, 16, 2.6, 'shipHull');

  /* ================= STERN DECK (start) */
  for (const [x, z] of [[-21, 38.5], [21, 38.5], [-21, 29], [21, 29], [-8, 39], [8, 39]]) shipBollard(x, z);
  for (const [x, z] of [[-18.5, 38.6], [18.5, 38.6], [-5, 37]]) shipRope(x, z);
  shipLifeboat(-21.5, 33.5); shipLifeboat(21.5, 33.5);
  for (const s of [-1, 1]) for (const dz of [-2.5, 2.5]) { beam('steel', s * 23.4, 0, 33.5 + dz, s * 23.4, 4.2, 33.5 + dz, 0.2, 0.2, false); beam('steel', s * 23.4, 4.2, 33.5 + dz, s * 21.5, 4.6, 33.5 + dz, 0.15, 0.15, false); }
  // the capstan, crates the crew left, the flagpole
  CYL('dark', 0.7, 0.8, 0.9, 12, -12, 0.45, 34); PZ(-12, 0, 34, 1.5, 0.9, 1.5); CYL('steel', 0.85, 0.85, 0.1, 12, -12, 0.95, 34, 0, 0, 0, false);
  for (const [x, z, k] of [[12, 30, 0], [13, 30.2, 1], [12.4, 30.1, 2], [-4, 31, 1]]) isleCrate(x, z, k === 2 ? 0.9 : 0, k);
  CYL('steel', 0.05, 0.06, 7, 6, 0, 3.5, 40.4, 0, 0, 0, false); B('paintGreen', 1.6, 1.0, 0.02, 0.85, 6.3, 40.4, 0, 0, 0, false);
  // the survivors' boat tied up behind the stern (scenery)
  { const p = P2(-6, 47, -6.4, 0); p.b('isleWhite', 3.0, 1.4, 7.0, 0, 0.7, 0, false); p.b('isleTeal', 3.1, 0.25, 7.1, 0, 1.4, 0, false); p.b('wood', 2.0, 0.1, 2.0, 0, 1.5, 1.5, false); p.b('dark', 0.8, 1.0, 0.8, 0, 2.0, -2.4, false); }
  beam('cloth1', -6, -4.8, 43.6, -12, 1.4, 41.2, 0.05, 0.05, false);
  shipLamp(-14, 27.4); shipLamp(14, 27.4); shipLamp(0, 38, 3.4, 0xfff0d0, 1.0, 14, false);

  /* ================= THE ACCOMMODATION BLOCK (the hub, x -10..10, z 12..26) */
  const BH = 4.2;
  wkX(26, -25, 25, 3.4, 'shipWhite', [[0, 6, 0, 4]]);
  wkZ(-10, 12, 26, BH, 'shipWhite', [[19, 6, 0, 4]]); wkZ(10, 12, 26, BH, 'shipWhite', [[19, 6, 0, 4]]);
  wkX(12, -25, 25, BH, 'shipWhite', [[-20, 4, 0, 4], [0, 6, 0, 4], [20, 4, 0, 4]]);
  wkRoof(-10.3, 10.3, 11.7, 26.3, BH + 0.35, 'shipWhite');
  floorQuad(0, 19, 19.4, 13.4, 0.012, 'tileFloor', 3);
  // the superstructure above: decks of cabins, the bridge with its windows, the funnel (scenery)
  for (let k = 0; k < 3; k++) { const y = BH + 0.35 + k * 3, w = 20 - k * 1.2; B('shipWhite', w, 3, 13.4 - k * 0.6, 0, y + 1.5, 19.5, 0, 0, 0, false); for (let i = 0; i < 6; i++) for (const sd of [-1, 1]) B('shipGlass', 1.1, 0.8, 0.05, -w / 2 + 2 + i * (w - 4) / 5, y + 1.8, 19.5 + sd * (6.7 - k * 0.3 + 0.03), 0, 0, 0, false); }
  B('shipWhite', 24, 3, 6, 0, BH + 10.85, 17, 0, 0, 0, false); B('shipGlass', 23, 1.2, 0.05, 0, BH + 11.2, 13.97, 0, 0, 0, false);
  B('shipHull', 4, 6, 4, 0, BH + 13.5, 23, 0, 0, 0, false); B('paintWhite', 4.05, 0.8, 4.05, 0, BH + 15.4, 23, 0, 0, 0, false);
  CYL('steel', 0.08, 0.1, 5, 6, 3, BH + 14.8, 16, 0, 0, 0, false); B('redLight2', 0.25, 0.25, 0.25, 3, BH + 17.4, 16, 0, 0, 0, false);
  batchAdd('shipSignMess', new THREE.PlaneGeometry(2.4, 0.75), mat4(0, 3.6, 26.27, 0, 0, 0), false);
  // inside: the mess tables, the galley counter, the captain's desk, lockers
  for (const x of [-5.5, 5.5]) { blk(x, 19, 1.2, 4.6, 0.78, 'wood'); for (const dx of [-0.9, 0.9]) B('dark', 0.35, 0.45, 4.4, x + dx, 0.23, 19, 0, 0, 0, false); }
  blk(-6.2, 12.75, 5.4, 0.8, 0.95, 'steel'); B('dark', 1.2, 0.05, 0.6, -7.5, 0.98, 12.75, 0, 0, 0, false); CYL('steel', 0.2, 0.2, 0.3, 10, -5, 1.1, 12.75, 0, 0, 0, false);
  blk(7, 25.2, 2.4, 0.8, 0.8, 'wood'); B('cloth1', 0.4, 0.02, 0.3, 6.5, 0.81, 25.2, 0, 0.3, 0, false); B('paintGreen', 0.25, 0.3, 0.25, 7.6, 0.95, 25.2, 0, 0, 0, false);
  for (let i = 0; i < 4; i++) { B('steel', 0.5, 1.9, 0.5, 9.4, 0.95, 12.8 + i * 0.55); } PZ(9.4, 0, 13.6, 0.5, 1.9, 2.2);
  shipCeil(-4, 19, BH); shipCeil(4, 19, BH); shipCeil(0, 14, BH, 0xffe0b0, 0.8, 9);

  /* ================= PORT DECK (x -25..-10, z 12..26): the lifeboat station */
  shipLifeboat(-21.5, 21, true);
  for (const [x, z] of [[-14, 14.5], [-13, 15.3]]) isleCrate(x, z, 0, 1);
  B('paintOrange', 0.05, 0.7, 0.7, -24.72, 1.6, 15, 0, 0, 0, false); batchAdd('paintWhite', new THREE.TorusGeometry(0.28, 0.08, 6, 16), mat4(-24.68, 1.6, 15, 0, Math.PI / 2, 0), false);
  wkPallet(-15, 24, 0, 2); shipLamp(-17, 13.4, 3.2, 0xfff0d0, 0.9, 13); shipLamp(-12, 24.8, 3.2, 0xfff0d0, 0.9, 12, false);

  /* ================= STARBOARD DECK (x 10..25, z 12..26): smoking spot, provisions */
  for (const z of [22.5, 24.5]) bench(14, z, 0, true);
  CYL('steel', 0.18, 0.15, 0.7, 10, 16.5, 0.35, 23.5); PZ(16.5, 0, 23.5, 0.4, 0.7, 0.4);
  blk(22.6, 14, 3.4, 1.0, 1.9, 'steel'); for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) B(['paintRed', 'paintYellow', 'cloth1', 'paintGreen', 'paintBlue'][(i + r) % 5], 0.45, 0.4, 0.5, 21.2 + i * 0.7, 0.45 + r * 0.6, 13.95, 0, 0, 0, false);
  isleCrate(13, 14, 0, 0); isleCrate(13.4, 15.1, 0, 1); shipLamp(17, 13.4, 3.2, 0xfff0d0, 0.9, 13); shipLamp(12, 24.8, 3.2, 0xfff0d0, 0.9, 12, false);

  /* ================= CARGO DECK: the grow containers (port) */
  const C1 = ['paintBlue', 'paintRed', 'paintGreen', 'paintOrange'];
  for (const [z, open, k] of [[6, 0, 0], [-3, -1, 1], [-12, 0, 2], [-21, 1, 3]]) { if (open) shipGrowBox(-21, z, open, C1[k]); else container(-21, z, false, 0, C1[k]); }
  for (const [z, open, k] of [[2, 0, 3], [-7, 1, 2], [-16, 0, 1], [-25.5, 0, 0]]) { if (open) shipGrowBox(-13, z, open, C1[k]); else container(-13, z, false, 0, C1[k]); }
  container(-21, 6, false, 2.6, 'paintRed'); container(-13, -16, false, 2.6, 'paintBlue');
  batchAdd('shipSignGrow', new THREE.PlaneGeometry(1.8, 0.55), mat4(-11.78, 2.0, -16, 0, Math.PI / 2, 0), false);
  // the crane in the middle (pedestal you can hide behind, the jib overhead) and hatch covers either side of the lane
  CYL('shipYellow', 1.0, 1.2, 4, 12, -4, 2, -6); PZ(-4, 0, -6, 2.0, 4, 2.0); B('shipYellow', 2.4, 2.0, 2.4, -4, 5, -6, 0, 0, 0, false);
  beam('shipYellow', -4, 5.5, -6, 6, 12, -14, 0.6, 0.6, false); beam('steel', 6, 12, -14, 6, 4, -14, 0.03, 0.03, false); B('dark', 0.6, 0.4, 0.6, 6, 3.8, -14, 0, 0, 0, false);
  for (const z of [5, -18]) { blk(-3.8, z, 3.2, 5, 0.6, 'shipBlue'); blk(3.8, z, 3.2, 5, 0.6, 'shipBlue'); }
  for (const [x, z, k] of [[4, -1, 0], [-3, -25, 1], [3.6, -27, 0]]) isleCrate(x, z, 0, k);
  shipLamp(-9, 8, 3.4); shipLamp(-9, -10, 3.4); shipLamp(-17, -4.5, 3.4, 0xd8e0ff, 1.1, 14); shipLamp(-17, -20, 3.4, 0xd8e0ff, 1.1, 14, false); shipLamp(-23.4, 10, 3.2, 0xd8e0ff, 0.9, 12); shipLamp(-9, -26, 3.4, 0xfff0d0, 1.0, 13, false); shipLamp(-24, -14, 3.4);

  /* ================= THE ENGINE ROOM (x 8..25, z -26..-2) and the open deck in front of it */
  const EH = 4.0;
  wkZ(8, -26, -2, EH, 'shipWhite', [[-20, 2.4, 0, 2.6], [-8, 2.4, 0, 2.6]]);
  wkX(-2, 8, 25, EH, 'shipWhite', [[16, 2.4, 0, 2.6]]); wkX(-26, 8, 25, EH, 'shipWhite', [[16, 2.4, 0, 2.6]]);
  wkRoof(7.7, 25.3, -26.3, -1.7, EH + 0.35, 'shipWhite');
  floorQuad(16.5, -14, 16.5, 23.5, 0.012, 'concrete', 4);
  batchAdd('shipSignEng', new THREE.PlaneGeometry(2.0, 0.62), mat4(7.73, 3.1, -14, 0, -Math.PI / 2, 0), false);
  for (const x of [13, 19]) { blk(x, -14, 3, 8, 2.2, 'steel'); for (let i = 0; i < 4; i++) CYL('dark', 0.3, 0.3, 0.6, 10, x, 2.5, -17 + i * 2, 0, 0, 0, false); B('shipRust', 3.1, 0.1, 8.1, x, 2.21, -14, 0, 0, 0, false); }
  for (const z of [-5, -23]) pipeRun(8.5, z, 24.5, z, 3.3, 0.18, 'shipRust');
  pipeRun(16, -3, 16, -25, 3.6, 0.12, 'steel');
  blk(22.6, -4, 3, 1.4, 1.6, 'paintGreen'); B('greenLight', 0.2, 0.1, 0.02, 22.6, 1.2, -4.72, 0, 0, 0, false);
  shipCeil(13, -8, EH, 0xffe8b0, 0.9, 11); shipCeil(19, -20, EH, 0xffe8b0, 0.9, 11); lampLight(16, 1.2, -14, 0xff8a3a, 0.5, 8);
  // the open deck between the engine room and the side deck: a stack of containers and a pallet
  container(17, 6.5, true, 0, 'paintOrange'); container(17, 6.5, true, 2.6, 'paintBlue'); container(22, 1, false, 0, 'paintGreen');
  wkPallet(11.5, 3, 0, 2); shipLamp(12, 9, 3.4); shipLamp(9.5, -28, 3.4, 0xfff0d0, 1.0, 13, false);

  /* ================= THE BOW: the forecastle (gun upgrader), windlasses, the ballast valve, the mast */
  wkZ(-6, -42, -35, 3.4, 'shipWhite'); wkZ(6, -42, -35, 3.4, 'shipWhite'); wkX(-35, -6, 6, 3.4, 'shipWhite', [[0, 2.4, 0, 2.6]]);
  wkRoof(-6.3, 6.3, -42.3, -34.7, 3.75, 'shipWhite'); floorQuad(0, -38.5, 11.4, 6.6, 0.012, 'concrete', 3);
  batchAdd('shipSignFwd', new THREE.PlaneGeometry(2.0, 0.62), mat4(0, 3.0, -34.73, 0, 0, 0), false);
  shipCeil(0, -38.5, 3.4, 0xd0a0ff, 0.8, 9);
  for (const s of [-1, 1]) { blk(s * 10.5, -37.5, 2.2, 2.2, 1.2, 'shipBlue'); CYL('dark', 0.6, 0.6, 2.4, 12, s * 10.5, 1.5, -37.5, 0, 0, Math.PI / 2, false); for (let i = 0; i < 8; i++) B('dark', 0.25, 0.08, 0.4, s * 10.5, 0.05, -35.8 + i * 0.5, 0, 0, i % 2 ? 0 : 1.57, false); }
  CYL('steel', 0.18, 0.22, 12, 8, -3.5, 6, -31); PZ(-3.5, 0, -31, 0.5, 12, 0.5); B('steel', 2.6, 0.12, 0.12, -3.5, 9, -31, 0, 0, 0, false);
  SHIP.lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), MAT.shipLamp.clone()); SHIP.lamp.position.set(-3.5, 12.3, -31); scene.add(SHIP.lamp);
  SHIP.beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 22, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xc8ffb0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  SHIP.beam.geometry.translate(0, -11, 0); SHIP.beam.rotation.z = Math.PI / 2; SHIP.piv = new THREE.Group(); SHIP.piv.position.set(-3.5, 12.3, -31); SHIP.piv.add(SHIP.beam); scene.add(SHIP.piv);
  SHIP.mastL = lampLight(-3.5, 6, -31, 0xc8ffb0, 0.2, 14);
  shipLamp(-13, -31.5, 3.2); shipLamp(13.5, -31.5, 3.2, 0xfff0d0, 1.0, 13, false); shipLamp(-9, -40.5, 3.0);
  for (const [x, z] of [[-13, -40.5], [13, -40.5]]) shipBollard(x, z);
}
defineMap({
  id: 'maryjane', size: 'large', hidden: true, zombiesOnly: true, planCut: 3.0, name: 'THE MARY JANE', place: 'Cargo freighter at sea, night', desc: 'The freighter that carried the Nightshade seeds to the world. A stern deck, the crew block, grow containers and an engine room on the cargo deck, the forecastle at the bow.',
  play: [-25, 25, -42, 41], build: buildShip,
  env: { top: 0x0a1020, horizon: 0x2a3a50, fog: 0.012, sun: [-30, 40, -30], sunCol: 0xa0b8e0, sunI: 0.8, skySun: 0x6a7a9a, hemiSky: 0x7a88a0, hemiGround: 0x2a3030, exposure: 1.45 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: { spawn: [{ x: 0, z: 34 }, { x: 0, z: -20 }], hp: [{ x: 0, z: 19 }, { x: 0, z: 0 }, { x: -6, z: 34 }], flags: [{ x: 0, z: 34 }, { x: 0, z: -20 }], sites: [{ x: -17, z: -10 }, { x: 16, z: -14 }] },
  menu: { x: 0, z: 30, r: 9, y: 2.4 },
  navPts: [{ x: 0, z: 34 }, { x: 0, z: 19 }, { x: -18, z: 18 }, { x: 18, z: 18 }, { x: -17, z: -8 }, { x: -21, z: -3 }, { x: 0, z: -10 }, { x: 16, z: -14 }, { x: 22.5, z: -14 }, { x: 0, z: -33 }, { x: 0, z: -39 }, { x: 10, z: -32 }],
  views: [[0, 1.7, 38, 0, 3, 20], [-6, 1.7, 23, 4, 1.2, 15], [-22, 1.7, 13, -20, 1.5, 24], [20, 1.7, 13, 16, 1.2, 24], [0, 1.7, 9, -17, 1.5, -10], [-19.6, 1.7, -14.6, -21, 1.0, -22], [16, 1.7, -3.5, 16, 1.5, -20], [0, 1.7, -24, 0, 6, -38], [-1, 1.7, -36, -2.6, 1.2, -39], [6, 1.7, -28, 10, 1, -33]],
});
function mjTick(dt) {
  if (curMap !== 'maryjane') return;
  for (const f of SHIP.flick) { if (f.steady) continue; f.t -= dt; if (f.t <= 0) { f.on = !f.on; f.t = f.on ? rnd(0.4, 5) : rnd(0.03, 0.2); f.l.intensity = f.on ? f.i : f.i * 0.1; } }
  if (SHIP.piv) SHIP.piv.rotation.y += dt * (SHIP.on ? 1.1 : 0);
}
function mjPower() {
  SHIP.on = true; for (const f of SHIP.flick) { f.steady = true; f.l.intensity = f.i * 1.15; }
  if (SHIP.beam) SHIP.beam.material.opacity = 0.14; if (SHIP.lamp) SHIP.lamp.material.emissiveIntensity = 2.6; if (SHIP.mastL) SHIP.mastL.intensity = 1.0;
}
