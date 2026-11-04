/* ================================================================== ZOMBIES map: THE HIGH TIDE (chapter six of the story)
   The Mary Jane's logbook named a sister ship on the same route: the HIGH TIDE, a party cruise liner. Its "420 cruise"
   handed out free NIGHTSHADE pre-rolls to every passenger as a party favour. The survivors board it at night, still lit
   up, still playing music to nobody. Built like the Mary Jane (one deck, the same zones), dressed as a cruise ship:
     START   - the LIDO DECK (south): the pool, the hot tub, loungers, the pool bar, string lights.
     MIDDLE  - the GRAND ATRIUM (the hub): reception (the purser's desk and vault), a leaf sculpture, sofas.
     SIDES   - the MUNCHIES BUFFET (port) and the HIGH ROLLERS CASINO (starboard).
     NORTH   - CLUB 420 (port house: the dance floor, the DJ booth, the FOG MACHINE - the cure goes in there), the
               PROMENADE in the middle (tiki bar, planters, the slide tower), the KUSH THEATRE (starboard house: the stage,
               rows of seats, backstage).
     BOW     - the VIP LOUNGE (the gun upgrader), the windlasses, the party searchlights.
   LAUNCH PADS (the trampolines on deck) throw you between the lido, the buffet, the casino and the bow once the power
   is back. */
const TIDE = { flick: [], disco: null, tiles: [], beams: [], on: false, t: 0, pool: null };
function tideMaterials() {
  if (MAT.tideHull) return;
  const std = (set, o) => new THREE.MeshStandardMaterial(Object.assign({ map: set.map, bumpMap: set.bump, bumpScale: 0.015, roughness: 0.8, metalness: 0.2 }, o));
  MAT.tideHull = std(TEX.metal, { color: C(0xeceae4), roughness: 0.55, metalness: 0.25 });
  MAT.tideStripe = std(TEX.metal, { color: C(0x1a3a8a), roughness: 0.5 });
  MAT.tideTeak = std(TEX.wood || TEX.concrete, { color: C(0xb88a5a), roughness: 0.7, metalness: 0.0 });
  MAT.tideCarpet = std(TEX.concrete, { color: C(0x6a1430), roughness: 0.95, metalness: 0.0 });
  MAT.tideFelt = std(TEX.concrete, { color: C(0x1a6a3a), roughness: 0.95, metalness: 0.0 });
  MAT.tideVelvet = std(TEX.concrete, { color: C(0x8a1a2a), roughness: 0.9, metalness: 0.0 });
  MAT.tidePurple = std(TEX.metal, { color: C(0x4a2a7a), roughness: 0.5 });
  MAT.tidePink = std(TEX.metal, { color: C(0xe04a9a), roughness: 0.5 });
  MAT.tideTile = std(TEX.concrete, { color: C(0x8ad8e8), roughness: 0.3, metalness: 0.1 });
  MAT.tideWater = new THREE.MeshStandardMaterial({ color: C(0x1a8ab8), emissive: C(0x0a6aa8), emissiveIntensity: 0.55, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.88 });
  MAT.tideBulb = new THREE.MeshStandardMaterial({ color: C(0x302a10), emissive: C(0xffd8a0), emissiveIntensity: 1.6 });
  MAT.tideCabin = new THREE.MeshStandardMaterial({ color: C(0x1a2a30), emissive: C(0xffc880), emissiveIntensity: 0.6, roughness: 0.1 });
  MAT.tideMirror = new THREE.MeshStandardMaterial({ color: C(0xe0e0f0), roughness: 0.15, metalness: 1.0, emissive: C(0x30304a), emissiveIntensity: 0.4 });
  MAT.tideName = neonMat('HIGH TIDE', '#ff6ad0', '420 PARTY CRUISES', '#0a0a1a', 1024, 256);
  MAT.tideSignLido = neonMat('LIDO DECK', '#5ae8ff', 'pool · hot tub · pool bar', '#081420', 512, 160);
  MAT.tideSignAtrium = neonMat('GRAND ATRIUM', '#ffe0a0', 'reception · guest services', '#1a1410', 512, 160);
  MAT.tideSignBuffet = neonMat('MUNCHIES BUFFET', '#ffb03a', 'all you can eat · 24 hrs', '#1a0f08', 512, 160);
  MAT.tideSignCasino = neonMat('HIGH ROLLERS', '#ff4a6a', 'casino · cards · slots', '#1a060a', 512, 160);
  MAT.tideSignClub = neonMat('CLUB 420', '#c070ff', 'dance till you drop', '#100818', 512, 160);
  MAT.tideSignTheatre = neonMat('KUSH THEATRE', '#ffd890', 'tonight: the cloud nine revue', '#1a1008', 512, 160);
  MAT.tideSignVip = neonMat('VIP LOUNGE', '#5dff7a', 'members only', '#081a0c', 512, 160);
  MAT.tideSignTiki = neonMat('TIKI BAR', '#ff8a3a', 'mai tais · munchies', '#1a0c06', 512, 128);
  for (const [k, c] of [['tideDanceA', 0xff3ab0], ['tideDanceB', 0x3ab8ff], ['tideDanceC', 0x7aff3a], ['tideDanceD', 0xffc83a]])
    MAT[k] = new THREE.MeshStandardMaterial({ color: C(0x101010), emissive: C(c), emissiveIntensity: 0.25, roughness: 0.3 });
  TILES.tideHull = 3; TILES.tideTeak = 3; TILES.tideCarpet = 3; TILES.tideTile = 2;
}
// a string of party bulbs between two points (scenery)
function tideBulbs(ax, ay, az, bx, by, bz, n = 10) {
  beam('dark', ax, ay, az, bx, by, bz, 0.02, 0.02, false);
  for (let i = 0; i <= n; i++) { const f = i / n, sag = Math.sin(f * Math.PI) * 0.35; B('tideBulb', 0.09, 0.12, 0.09, ax + (bx - ax) * f, ay + (by - ay) * f - sag - 0.08, az + (bz - az) * f, 0, 0, 0, false); }
}
// a sun lounger (low, no collider except a small one so zombies walk round it)
function tideLounger(x, z, q = 0) { const p = P2(x, z, 0, q); p.b('paintWhite', 0.7, 0.08, 1.9, 0, 0.35, 0); p.b('paintWhite', 0.7, 0.06, 0.7, 0, 0.6, -0.75, false); p.b('tideStripe', 0.62, 0.04, 1.2, 0, 0.42, 0.3, false); for (const dz of [-0.8, 0.8]) p.b('steel', 0.6, 0.3, 0.05, 0, 0.15, dz, false); p.col(0.7, 0.5, 1.9); }
// a little round table with two stools
function tideTable(x, z, key = 'paintWhite') { CYL('steel', 0.06, 0.08, 0.72, 8, x, 0.36, z); CYL(key, 0.6, 0.6, 0.05, 16, x, 0.74, z); PZ(x, 0, z, 1.1, 0.76, 1.1); for (const dx of [-0.85, 0.85]) CYL('tideVelvet', 0.22, 0.22, 0.45, 10, x + dx, 0.22, z, 0, 0, 0, false); }
// a slot machine against a wall (q turns it)
function tideSlot(x, z, q = 0) { const p = P2(x, z, 0, q); p.b('tidePurple', 0.7, 1.6, 0.6, 0, 0.8, 0); p.b('screen', 0.5, 0.45, 0.02, 0, 1.15, 0.31, false); p.b('tideBulb', 0.6, 0.08, 0.02, 0, 1.55, 0.31, false); p.b('steel', 0.05, 0.4, 0.05, 0.38, 1.1, 0.1, false); p.col(0.7, 1.6, 0.6); }
// a card table: green felt, padded rim, stools
function tideCards(x, z, alongX = true) { const w = alongX ? 2.4 : 1.3, d = alongX ? 1.3 : 2.4; blk(x, z, w, d, 0.8, 'tideVelvet', { walk: false }); B('tideFelt', w - 0.2, 0.03, d - 0.2, x, 0.81, z, 0, 0, 0, false); for (let i = 0; i < 3; i++) B('paintWhite', 0.08, 0.005, 0.12, x - 0.4 + i * 0.4, 0.83, z, 0, i * 0.4, 0, false); }
function buildTide() {
  buildMap2Materials(); worksMaterials(); airpMaterials(); isleMaterials(); shipMaterials(); tideMaterials();
  TIDE.flick = []; TIDE.tiles = []; TIDE.beams = []; TIDE.on = false; TIDE.disco = null; TIDE.t = 0; TIDE.pool = null;
  floorQuad(0, 0, 52, 86, 0, 'tideTeak', 6);
  floorQuad(0, 0, 400, 400, -7, 'shipSea', 20);
  // ---- outside: solid all round, the white hull with its blue stripe down to the water
  for (const [x, z, w, d] of [[0, -43.4, 56, 2.5], [0, 43.2, 56, 2.5], [-27, 0, 3, 90], [27, 0, 3, 90]]) blk(x, z, w, d, 9, 'dark', { noDraw: true });
  for (const s of [-1, 1]) { B('tideHull', 0.6, 7.5, 72, s * 25.5, -3.4, 5.5, 0, 0, 0, false); B('tideHull', 0.6, 7.5, 13, s * 16.4, -3.4, -36, 0, 0, 0, false); B('tideStripe', 0.62, 0.6, 72, s * 25.52, -1.0, 5.5, 0, 0, 0, false); for (let i = 0; i < 16; i++) B('shipGlass', 0.05, 0.5, 0.5, s * 25.82, -2.6, -26 + i * 4.2, 0, 0, 0, false); }
  B('tideHull', 52, 7.5, 0.6, 0, -3.4, 41.6, 0, 0, 0, false); batchAdd('tideName', new THREE.PlaneGeometry(10, 2.5), mat4(0, -2.2, 41.95, 0, 0, 0), false);
  for (const s of [-1, 1]) batchAdd('tideHull', new THREE.BoxGeometry(0.6, 7.5, 13.5), mat4(s * 20.7, -3.4, -36.2, 0, s * 0.62, 0), false);
  B('tideHull', 33, 7.5, 0.6, 0, -3.4, -42.3, 0, 0, 0, false);
  // ---- the bulwarks (low white walls with glass rails on top at the stern), the bow
  const winH = [[19, 1.6, 1.0, 1.4], [-8, 1.6, 1.0, 1.4]];
  wkZ(-25, -30, 41, 2.6, 'tideHull', winH); wkZ(25, -30, 41, 2.6, 'tideHull', winH);
  wkX(41, -25, 25, 1.2, 'tideHull'); B('windowGlass', 50, 0.8, 0.04, 0, 1.6, 41, 0, 0, 0, false); B('steel', 50, 0.06, 0.08, 0, 2.03, 41, 0, 0, 0, false);
  blk(0, 41.9, 52, 0.6, 5, 'dark', { noDraw: true });
  wkZ(-16, -42, -30, 2.6, 'tideHull'); wkZ(16, -42, -30, 2.6, 'tideHull'); wkX(-30, -25, -16, 2.6, 'tideHull'); wkX(-30, 16, 25, 2.6, 'tideHull'); wkX(-42, -16, 16, 2.6, 'tideHull');

  /* ================= THE LIDO DECK (start, z 26..41): the pool, the hot tub, loungers, the pool bar */
  floorQuad(-9, 34, 13, 10, 0.011, 'tideTile', 2);
  blk(-9, 34, 9.2, 6.2, 0.9, 'tideHull', { walk: false });                                   // the raised pool (rim)
  TIDE.pool = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 5.6), MAT.tideWater); TIDE.pool.rotation.x = -Math.PI / 2; TIDE.pool.position.set(-9, 0.915, 34); scene.add(TIDE.pool);
  for (const s of [-1, 1]) { beam('steel', -9 + s * 4.3, 0.9, 30.9, -9 + s * 4.3, 1.9, 30.6, 0.05, 0.05, false); }
  lampLight(-9, 0.4, 34, 0x3ad8ff, 0.9, 9);
  // the hot tub
  CYL('tideHull', 1.6, 1.7, 0.85, 20, 16, 0.42, 37.5); PZ(16, 0, 37.5, 3.2, 0.85, 3.2); CYL('tideWater', 1.45, 1.45, 0.02, 20, 16, 0.8, 37.5, 0, 0, 0, false);
  // loungers in rows, the pool bar with stools, the slide (scenery, curling down the side of the superstructure)
  for (const x of [-19, -16.5]) for (const z of [30, 33, 36]) tideLounger(x, z);
  for (const x of [1, 3.5]) tideLounger(x, 39, 0);
  blk(18.5, 29.5, 6, 1.0, 1.1, 'tideTeak', { walk: false }); B('dark', 6.2, 0.06, 1.2, 18.5, 1.13, 29.5, 0, 0, 0, false);
  for (let i = 0; i < 4; i++) CYL('tideVelvet', 0.22, 0.22, 0.6, 10, 16.3 + i * 1.5, 0.3, 30.6, 0, 0, 0, false);
  for (let i = 0; i < 6; i++) B(['paintGreen', 'paintOrange', 'paintRed', 'paintBlue'][i % 4], 0.12, 0.3, 0.12, 16.2 + i * 0.9, 1.3, 29.3, 0, 0, 0, false);
  B('tideTeak', 6.4, 0.1, 2.0, 18.5, 2.9, 29.5, 0, 0, 0, false); for (const dx of [-3, 3]) CYL('tideTeak', 0.08, 0.08, 2.9, 6, 18.5 + dx, 1.45, 29.5 - 0.9, 0, 0, 0, false);
  for (let i = 0; i < 10; i++) { const a = i * 0.55, r = 2.2; beam('tidePink', -17 + Math.cos(a) * r, 13 - i * 1.2, 27.6 + Math.sin(a) * r * 0.4, -17 + Math.cos(a + 0.55) * r, 13 - (i + 1) * 1.2, 27.6 + Math.sin(a + 0.55) * r * 0.4, 1.0, 0.25, false); }
  // string lights over the lido, a flag pole, the survivors' boat tied up behind
  for (const z of [30, 35, 40]) tideBulbs(-24.5, 3.4, z, 24.5, 3.4, z, 16);
  CYL('steel', 0.05, 0.06, 7, 6, 0, 3.5, 40.4, 0, 0, 0, false); B('tidePink', 1.6, 1.0, 0.02, 0.85, 6.3, 40.4, 0, 0, 0, false);
  { const p = P2(-6, 47, -6.4, 0); p.b('isleWhite', 3.0, 1.4, 7.0, 0, 0.7, 0, false); p.b('isleTeal', 3.1, 0.25, 7.1, 0, 1.4, 0, false); p.b('wood', 2.0, 0.1, 2.0, 0, 1.5, 1.5, false); }
  for (const [x, z] of [[-21, 39], [21, 39]]) shipBollard(x, z);
  shipLamp(-14, 27.4, 3.2, 0xffd0f0); shipLamp(14, 27.4, 3.2, 0xffd0f0); shipLamp(6, 38, 3.4, 0xfff0d0, 1.0, 14, false);
  batchAdd('tideSignLido', new THREE.PlaneGeometry(2.4, 0.75), mat4(-5, 3.6, 26.27, 0, 0, 0), false);

  /* ================= THE GRAND ATRIUM (the hub, x -10..10, z 12..26) */
  const BH = 4.2;
  wkX(26, -25, 25, 3.4, 'tideHull', [[0, 6, 0, 4]]);
  wkZ(-10, 12, 26, BH, 'tideHull', [[19, 6, 0, 4]]); wkZ(10, 12, 26, BH, 'tideHull', [[19, 6, 0, 4]]);
  wkX(12, -25, 25, BH, 'tideHull', [[-20, 4, 0, 4], [0, 6, 0, 4], [20, 4, 0, 4]]);
  wkRoof(-10.3, 10.3, 11.7, 26.3, BH + 0.35, 'tideHull');
  floorQuad(0, 19, 19.4, 13.4, 0.012, 'tideCarpet', 3);
  // the superstructure above: four decks of lit cabins with balconies, the bridge, the funnel with the leaf
  for (let k = 0; k < 4; k++) { const y = BH + 0.35 + k * 3, w = 22 - k * 1.2, d = 15 - k * 0.6; B('tideHull', w, 3, d, 0, y + 1.5, 19, 0, 0, 0, false);
    for (let i = 0; i < 8; i++) for (const sd of [-1, 1]) { const x = -w / 2 + 1.6 + i * (w - 3.2) / 7; B('tideCabin', 1.3, 1.4, 0.05, x, y + 1.6, 19 + sd * (d / 2 + 0.03), 0, 0, 0, false); B('steel', 1.6, 0.05, 0.6, x, y + 0.9, 19 + sd * (d / 2 + 0.3), 0, 0, 0, false); } }
  B('tideHull', 26, 3, 6, 0, BH + 13.85, 16, 0, 0, 0, false); B('shipGlass', 25, 1.2, 0.05, 0, BH + 14.2, 12.97, 0, 0, 0, false);
  B('tideStripe', 4.2, 6, 4.2, 0, BH + 16.4, 22, 0, 0, 0, false); B('tidePink', 4.25, 0.8, 4.25, 0, BH + 18.8, 22, 0, 0, 0, false);
  { const lf = new THREE.Mesh(new THREE.CircleGeometry(1.4, 7), MAT.neonGreen || MAT.tideBulb); lf.position.set(0, BH + 16.6, 24.13); scene.add(lf); }
  CYL('steel', 0.08, 0.1, 5, 6, 4, BH + 17.5, 16, 0, 0, 0, false); B('redLight2', 0.25, 0.25, 0.25, 4, BH + 20.1, 16, 0, 0, 0, false);
  batchAdd('tideSignAtrium', new THREE.PlaneGeometry(2.4, 0.75), mat4(0, 3.6, 26.27, 0, 0, 0), false);
  // inside: reception (the purser's desk), the leaf sculpture, sofas, palms in pots, a chandelier
  blk(6, 24.6, 4.4, 0.9, 1.05, 'tideTeak', { walk: false }); B('paintWhite', 4.6, 0.06, 1.1, 6, 1.08, 24.6, 0, 0, 0, false); B('screen', 0.5, 0.35, 0.03, 5, 1.3, 24.4, 0, 0, 0, false);
  blk(-5, 19, 2.2, 2.2, 0.6, 'tidePurple', { walk: false }); islePlant(-5, 19, 0.6, 1.6, 'leafGreen'); lampLight(-5, 1.0, 19, 0x7aff7a, 0.7, 6);
  for (const [x, z, q] of [[5, 16.5, 0], [5, 20.5, 2]]) { const p = P2(x, z, 0, q); p.b('tideVelvet', 3.0, 0.45, 0.9, 0, 0.23, 0); p.b('tideVelvet', 3.0, 0.5, 0.2, 0, 0.7, -0.35, false); p.col(3.0, 0.7, 0.9); }
  blk(5, 18.5, 1.6, 0.8, 0.45, 'tideTeak', { walk: false });
  for (const [x, z] of [[-9.2, 13], [9.2, 13], [-3, 25.2]]) { CYL('paintWhite', 0.35, 0.28, 0.6, 10, x, 0.3, z); PZ(x, 0, z, 0.7, 0.6, 0.7); islePlant(x, z, 0.6, 1.2); }
  CYL('steel', 0.02, 0.02, 1.2, 4, 0, BH - 0.6, 19, 0, 0, 0, false); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; B('tideBulb', 0.1, 0.25, 0.1, Math.cos(a) * 0.9, BH - 1.3, 19 + Math.sin(a) * 0.9, 0, 0, 0, false); }
  shipCeil(-4, 15, BH, 0xffe0b0, 0.9, 11); shipCeil(4, 23, BH, 0xffe0b0, 0.9, 11); { const l = lampLight(0, BH - 1.4, 19, 0xffd8a0, 1.0, 12); TIDE.flick.push({ l, i: 1.0, t: 1, on: true }); }

  /* ================= THE MUNCHIES BUFFET (port, x -25..-10, z 12..26) */
  floorQuad(-17.5, 19, 14.6, 13.4, 0.011, 'tileFloor', 3);
  blk(-21.5, 19.5, 1.2, 7, 0.95, 'steel', { walk: false }); B('windowGlass', 1.0, 0.5, 6.8, -21.5, 1.35, 19.5, 0, 0, 0, false);
  for (let i = 0; i < 6; i++) B(['paintOrange', 'paintRed', 'paintGreen', 'paintYellow', 'paintWhite', 'paintBlue'][i], 0.7, 0.12, 0.8, -21.5, 1.0, 16.6 + i * 1.15, 0, 0, 0, false);
  for (const [x, z] of [[-14, 14.5], [-14, 23.5], [-18.5, 14.5]]) tideTable(x, z);
  batchAdd('tideSignBuffet', new THREE.PlaneGeometry(2.4, 0.75), mat4(-10.27, 3.2, 15, 0, -Math.PI / 2, 0), false);
  shipCeil(-17, 15, BH, 0xffe0b0, 0.9, 12); shipCeil(-15, 23, BH, 0xffe0b0, 0.9, 12, false);

  /* ================= THE HIGH ROLLERS CASINO (starboard, x 10..25, z 12..26) */
  floorQuad(17.5, 19, 14.6, 13.4, 0.011, 'tideCarpet', 3);
  tideCards(14, 15); tideCards(14, 22.6);
  for (let i = 0; i < 4; i++) tideSlot(11.2 + i * 0.9, 12.75, 0);
  CYL('tideTeak', 1.0, 1.1, 0.85, 20, 20.5, 0.42, 14.8); PZ(20.5, 0, 14.8, 2.0, 0.85, 2.0); CYL('tideFelt', 0.85, 0.85, 0.02, 20, 20.5, 0.86, 14.8, 0, 0, 0, false); CYL('tideMirror', 0.35, 0.4, 0.12, 16, 20.5, 0.93, 14.8, 0, 0, 0, false);
  for (let i = 0; i < 3; i++) tideSlot(12.5 + i * 0.9, 25.4, 2);
  batchAdd('tideSignCasino', new THREE.PlaneGeometry(2.4, 0.75), mat4(10.27, 3.2, 15, 0, Math.PI / 2, 0), false);
  { const l = lampLight(14, 3.4, 18.5, 0xff3a6a, 0.9, 12); TIDE.flick.push({ l, i: 0.9, t: 0.5, on: true }); } shipCeil(20, 23, BH, 0xffd0a0, 0.9, 11);

  /* ================= THE OPEN DECKS north of the block (z -2..12) */
  shipLifeboat(-21.5, 5, true); shipLifeboat(21.5, 5, true);
  for (const z of [8, 4]) tideLounger(-13.5, z, 1);
  blk(16, 6.5, 2.4, 3.2, 2.2, 'tidePink', { walk: false }); B('tideStripe', 2.6, 0.3, 3.4, 16, 2.4, 6.5, 0, 0, 0, false); B('paintWhite', 0.1, 0.8, 1.4, 14.75, 1.3, 6.5, 0, 0, 0, false);   // the ice cream stand
  shipLamp(-12, 10, 3.4, 0xffd0f0); shipLamp(12, 10, 3.4, 0xffd0f0); shipLamp(-17, 0, 3.4, 0xd8e0ff, 1.0, 13, false); shipLamp(17, 0, 3.4, 0xd8e0ff, 1.0, 13, false);

  /* ================= CLUB 420 (port house, x -25..-8, z -26..-2): the dance floor, the DJ booth, the fog machine */
  const EH = 4.0;
  wkZ(-8, -26, -2, EH, 'tidePurple', [[-20, 2.4, 0, 2.6], [-8, 2.4, 0, 2.6]]);
  wkX(-2, -25, -8, EH, 'tidePurple', [[-16, 2.4, 0, 2.6]]); wkX(-26, -25, -8, EH, 'tidePurple', [[-16, 2.4, 0, 2.6]]);
  wkRoof(-25.3, -7.7, -26.3, -1.7, EH + 0.35, 'tidePurple'); blk(-24.6, -14, 0.3, 24, EH - 2.6 + 0.35, 'tidePurple', { y: 2.6 });   // closes the gap over the low hull wall
  floorQuad(-16.5, -14, 16.5, 23.5, 0.011, 'dark', 4);
  batchAdd('tideSignClub', new THREE.PlaneGeometry(2.0, 0.62), mat4(-7.73, 3.1, -14, 0, Math.PI / 2, 0), false);
  // the dance floor: 6 x 6 light-up tiles (they chase once the power is back)
  const DK = ['tideDanceA', 'tideDanceB', 'tideDanceC', 'tideDanceD'];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const k = DK[(i + j) % 4]; B(k, 1.15, 0.04, 1.15, -19 + i * 1.2, 0.03, -17 + j * 1.2, 0, 0, 0, false); }
  for (const k of DK) TIDE.tiles.push(MAT[k]);
  blk(-23, -13, 1.4, 4, 1.1, 'dark', { walk: false }); B('tidePurple', 1.5, 0.1, 4.1, -23, 1.12, -13, 0, 0, 0, false); for (const dz of [-1, 1]) CYL('steel', 0.3, 0.3, 0.06, 16, -23, 1.2, -13 + dz, 0, 0, 0, false);   // the DJ booth
  for (const dz of [-3.2, 3.2]) { B('dark', 0.9, 1.8, 0.9, -23.6, 0.9, -13 + dz); PZ(-23.6, 0, -13 + dz, 0.9, 1.8, 0.9); }        // speakers
  blk(-11.5, -3.2, 4, 0.9, 1.05, 'dark', { walk: false }); B('tidePink', 4.1, 0.05, 1.0, -11.5, 1.07, -3.2, 0, 0, 0, false);   // the bar
  for (let i = 0; i < 5; i++) B(['paintGreen', 'tidePink', 'paintBlue'][i % 3], 0.1, 0.28, 0.1, -13 + i * 0.7, 1.24, -3.2, 0, 0, 0, false);
  for (const [x, z] of [[-11, -10], [-11, -20.5]]) tideTable(x, z, 'tidePurple');
  TIDE.disco = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), MAT.tideMirror); TIDE.disco.position.set(-16.6, 3.3, -14); scene.add(TIDE.disco);
  for (const [c, x, z] of [[0xff3ab0, -19, -17], [0x3ab8ff, -14, -11], [0x7aff3a, -14, -17], [0xc070ff, -19, -11]]) { const l = lampLight(x, 3.2, z, c, 0.8, 9); TIDE.flick.push({ l, i: 0.8, t: rnd(0, 2), on: true, club: true }); }
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.6, 4, 12, 1, true), new THREE.MeshBasicMaterial({ color: [0xff3ab0, 0x3ab8ff, 0x7aff3a, 0xc070ff][i], transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    m.geometry.translate(0, -2, 0); const g = new THREE.Group(); g.position.set(-16.6 + (i % 2 ? 4 : -4), 3.9, -14 + (i < 2 ? -4 : 4)); g.add(m); scene.add(g); TIDE.beams.push(g); }

  /* ================= THE PROMENADE (middle, x -8..8, z -26..12): the tiki bar, planters with palms, the slide tower */
  CYL('tideTeak', 1.2, 1.3, 1.1, 12, -4, 0.55, -6); PZ(-4, 0, -6, 2.4, 1.1, 2.4); B('thatch', 3.2, 0.2, 3.2, -4, 3.0, -6, 0, 0.4, 0, false); CYL('tideTeak', 0.1, 0.1, 3, 6, -4, 1.5, -6, 0, 0, 0, false);
  batchAdd('tideSignTiki', new THREE.PlaneGeometry(1.6, 0.4), mat4(-4, 2.4, -4.68, 0, 0, 0), false);
  for (const z of [5, -18]) for (const s of [-1, 1]) { blk(s * 3.8, z, 3.2, 5, 0.8, 'tideTeak', { walk: false }); B('soil', 3.0, 0.05, 4.8, s * 3.8, 0.81, z, 0, 0, 0, false); islePlant(s * 3.8, z - 1.2, 0.8, 1.6); islePlant(s * 3.8, z + 1.2, 0.8, 1.3); }
  CYL('tideStripe', 0.9, 0.9, 9, 12, 5, 4.5, -12, 0, 0, 0, false); PZ(5, 0, -12, 1.8, 9, 1.8); for (let i = 0; i < 6; i++) beam('tidePink', 5, 9 - i * 1.4, -12, 5 + Math.cos(i * 1.1) * 2.2, 9 - (i + 1) * 1.4, -12 + Math.sin(i * 1.1) * 2.2, 1.0, 0.25, false);
  tideBulbs(-7.5, 3.6, 10, -7.5, 3.6, -25, 20); tideBulbs(7.5, 3.6, 10, 7.5, 3.6, -25, 20);
  shipLamp(-6, -26, 3.4, 0xfff0d0, 1.0, 13, false); shipLamp(6, -26, 3.4, 0xfff0d0, 1.0, 13);

  /* ================= THE KUSH THEATRE (starboard house, x 8..25, z -26..-2): the stage, the seats, backstage */
  wkZ(8, -26, -2, EH, 'tideHull', [[-20, 2.4, 0, 2.6], [-8, 2.4, 0, 2.6]]);
  wkX(-2, 8, 25, EH, 'tideHull', [[16, 2.4, 0, 2.6]]); wkX(-26, 8, 25, EH, 'tideHull', [[16, 2.4, 0, 2.6]]);
  wkRoof(7.7, 25.3, -26.3, -1.7, EH + 0.35, 'tideHull'); blk(24.6, -14, 0.3, 24, EH - 2.6 + 0.35, 'tideHull', { y: 2.6 });
  floorQuad(16.5, -14, 16.5, 23.5, 0.011, 'tideCarpet', 4);
  batchAdd('tideSignTheatre', new THREE.PlaneGeometry(2.0, 0.62), mat4(7.73, 3.1, -14, 0, -Math.PI / 2, 0), false);
  blk(16.5, -24.25, 14, 3.5, 0.6, 'tideTeak', { walk: false });                                // the stage (cover; you shoot over it)
  B('tideVelvet', 14, 3.3, 0.1, 16.5, 2.25, -25.9, 0, 0, 0, false); for (const dx of [-6.5, 6.5]) B('tideVelvet', 1.4, 3.6, 0.15, 16.5 + dx, 2.4, -23, 0, 0, 0, false);
  for (const z of [-16, -13, -10, -6.4]) { blk(12.6, z, 4.8, 0.7, 0.55, 'tideVelvet', { walk: false }); blk(20.4, z, 4.8, 0.7, 0.55, 'tideVelvet', { walk: false }); B('tideVelvet', 4.8, 0.5, 0.15, 12.6, 0.8, z + 0.3, 0, 0, 0, false); B('tideVelvet', 4.8, 0.5, 0.15, 20.4, 0.8, z + 0.3, 0, 0, 0, false); }
  for (const [c, x] of [[0xffd890, 12], [0xff6ad0, 16.5], [0x5ae8ff, 21]]) { const l = lampLight(x, 3.4, -21.5, c, 0.9, 9); TIDE.flick.push({ l, i: 0.9, t: rnd(0, 3), on: true }); }
  shipCeil(13, -8, EH, 0xffe8b0, 0.7, 11); shipCeil(20, -12, EH, 0xffe8b0, 0.7, 11);

  /* ================= THE BOW: the VIP lounge (gun upgrader), windlasses, party searchlights */
  wkZ(-6, -42, -35, 3.4, 'tideHull'); wkZ(6, -42, -35, 3.4, 'tideHull'); wkX(-35, -6, 6, 3.4, 'tideHull', [[0, 2.4, 0, 2.6]]);
  wkRoof(-6.3, 6.3, -42.3, -34.7, 3.75, 'tideHull'); floorQuad(0, -38.5, 11.4, 6.6, 0.012, 'tideCarpet', 3);
  batchAdd('tideSignVip', new THREE.PlaneGeometry(2.0, 0.62), mat4(0, 3.0, -34.73, 0, 0, 0), false);
  { const p = P2(3.6, -40.4, 0, 0); p.b('tideVelvet', 3.4, 0.45, 0.9, 0, 0.23, 0); p.b('tideVelvet', 3.4, 0.5, 0.2, 0, 0.7, -0.35, false); p.col(3.4, 0.7, 0.9); }
  shipCeil(0, -38.5, 3.4, 0x7aff7a, 0.8, 9);
  for (const s of [-1, 1]) { blk(s * 10.5, -37.5, 2.2, 2.2, 1.2, 'tideStripe'); CYL('dark', 0.6, 0.6, 2.4, 12, s * 10.5, 1.5, -37.5, 0, 0, Math.PI / 2, false); }
  for (const s of [-1, 1]) { CYL('steel', 0.18, 0.22, 7, 8, s * 13, 3.5, -31); PZ(s * 13, 0, -31, 0.5, 7, 0.5); const m = new THREE.Mesh(new THREE.ConeGeometry(1.2, 30, 14, 1, true), new THREE.MeshBasicMaterial({ color: s < 0 ? 0xff6ad0 : 0x5ae8ff, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    m.geometry.translate(0, 15, 0); const g = new THREE.Group(); g.position.set(s * 13, 7.2, -31); g.add(m); m.rotation.x = 0.5; scene.add(g); TIDE.beams.push(g); }
  tideBulbs(-13, 7, -31, 13, 7, -31, 18);
  shipLamp(-13, -27, 3.2); shipLamp(9.5, -28, 3.4, 0xfff0d0, 1.0, 13, false); shipLamp(-9, -40.5, 3.0);
  for (const [x, z] of [[-13, -40.5], [13, -40.5]]) shipBollard(x, z);
}
defineMap({
  id: 'hightide', size: 'large', hidden: true, zombiesOnly: true, planCut: 3.0, name: 'THE HIGH TIDE', place: 'Party cruise liner at sea, night', desc: 'The Mary Jane\'s sister ship: a 420 party cruise. The lido deck and its pool, the grand atrium, the buffet and the casino, Club 420 and the Kush Theatre, the VIP lounge at the bow.',
  play: [-25, 25, -42, 41], build: buildTide,
  env: { top: 0x120a26, horizon: 0x3a2050, fog: 0.011, sun: [30, 40, -30], sunCol: 0xc0a8e0, sunI: 0.75, skySun: 0x8a6aaa, hemiSky: 0x8a7aa8, hemiGround: 0x2a2030, exposure: 1.5 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: { spawn: [{ x: 2, z: 34 }, { x: 0, z: -20 }], hp: [{ x: 0, z: 19 }, { x: 0, z: 0 }, { x: 4, z: 31 }], flags: [{ x: 2, z: 34 }, { x: 0, z: -20 }], sites: [{ x: -17, z: -10 }, { x: 16, z: -14 }] },
  menu: { x: 2, z: 30, r: 9, y: 2.4 },
  navPts: [{ x: 2, z: 34 }, { x: 0, z: 19 }, { x: -18, z: 18 }, { x: 18, z: 18 }, { x: -16, z: -14 }, { x: -17, z: 5 }, { x: 0, z: -10 }, { x: 16, z: -14 }, { x: 22.5, z: -14 }, { x: 0, z: -33 }, { x: 0, z: -39 }, { x: 10, z: -32 }],
  views: [[2, 1.7, 39, -8, 1, 30], [-6, 1.7, 23, 4, 1.2, 15], [-12, 1.7, 13, -21, 1.2, 22], [12, 1.7, 13, 20, 1.2, 22], [-9.5, 1.7, -8, -18, 1.5, -15], [0, 1.7, 8, 2, 2, -12], [16, 1.7, -3.5, 16, 1.5, -22], [0, 1.7, -24, 0, 6, -38], [-1, 1.7, -36, -2.6, 1.2, -39], [6, 1.7, -28, 10, 1, -33]],
});
function tideTick(dt) {
  if (curMap !== 'hightide') return;
  TIDE.t += dt;
  for (const f of TIDE.flick) { if (f.steady && !f.club) continue; f.t -= dt;
    if (f.club && TIDE.on) { f.l.intensity = f.i * (0.6 + 0.6 * Math.max(0, Math.sin(TIDE.t * 4 + f.l.position.x))); continue; }
    if (f.t <= 0) { f.on = !f.on; f.t = f.on ? rnd(0.4, 5) : rnd(0.03, 0.2); f.l.intensity = f.on ? f.i : f.i * 0.1; } }
  if (TIDE.disco) TIDE.disco.rotation.y += dt * (TIDE.on ? 1.2 : 0.05);
  if (TIDE.pool) TIDE.pool.material.emissiveIntensity = 0.5 + Math.sin(TIDE.t * 1.3) * 0.08;
  if (TIDE.on) {
    TIDE.tiles.forEach((m, i) => { m.emissiveIntensity = 0.3 + 1.6 * Math.max(0, Math.sin(TIDE.t * 3 + i * 1.57)); });
    TIDE.beams.forEach((g, i) => { g.rotation.y += dt * (0.8 + i * 0.15) * (i % 2 ? 1 : -1); g.rotation.z = Math.sin(TIDE.t * 0.9 + i) * 0.45; g.children[0].material.opacity = i < 4 ? 0.1 : 0.07; });
  }
}
function tidePower() {
  TIDE.on = true; for (const f of TIDE.flick) { f.steady = true; f.l.intensity = f.i * 1.15; }
  try { if (TIDE.pool) TIDE.pool.material.emissiveIntensity = 0.7; } catch (e) {}
}
