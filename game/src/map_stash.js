/* ================================================================== LAST TOKE map: STASH ISLAND (1.2.73)
   The battle royale's own map: a grow island about 120 m across (the other maps are 64-88 m), with eight places to land
   and loot, roads between them, and the sea all round. Only LAST TOKE plays it (offline and online: 'random' in LAST TOKE
   always picks it). The nav grid is bigger here (arena 64), so bots path over the whole island.
     CENTRE  - THE VILLAGE: six little houses round a square with a well, a shop with a counter.
     NW      - THE GROW FARM: three greenhouses full of plants, a red barn with a hay loft.
     NE      - THE LIGHTHOUSE: the tower on the point, the keeper's cottage, rocks.
     E       - THE QUARRY: big rocks and a crane, a gravel pit.
     SE      - THE BUNKER: concrete pillboxes, sandbags, a watch tower you can climb.
     S       - THE DOCKS: the pier, a boathouse, shipping containers.
     SW      - THE TRAILER PARK: trailers, picnic tables, a burnt-out car.
     W       - THE WATER TOWER: a tower on legs you can climb, a pump house.
   Everything is laid out from a fixed seed, so every machine online builds the same island. */
const STASH_A = 64, STASH_H = 60;   // the nav arena half-size and the play area half-size
function stashRand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// a small house: four walls with a door (side 'n','s','e','w') and windows, a flat roof
function stashHouse(x, z, w, d, key = 'plaster', door = 's', h = 3.2, roof = 'concrete') {
  const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, dw = 1.4, win = (L) => L > 5 ? [{ at: L * 0.25, w: 1.1, b: 1.0, h: 1.1, open: true }, { at: L * 0.75, w: 1.1, b: 1.0, h: 1.1, open: true }] : [];
  const holes = (sd, L) => sd === door ? [{ at: L / 2, w: dw, b: 0, h: 2.3 }] : win(L);
  wall(x0, z0, x1, z0, h, key, { holes: holes('n', w) }); wall(x0, z1, x1, z1, h, key, { holes: holes('s', w) });
  wall(x0, z0, x0, z1, h, key, { holes: holes('w', d) }); wall(x1, z0, x1, z1, h, key, { holes: holes('e', d) });
  slab(x, z, w + 0.3, d + 0.3, h + 0.25, roof, 0.25);
  floorQuad(x, z, w - 0.4, d - 0.4, 0.01, 'wood', 3);
}
// a greenhouse: glass walls on posts, open at both ends, rows of plants inside
function stashGreenhouse(x, z, w = 7, d = 16) {
  for (const sx of [-1, 1]) { blk(x + sx * w / 2, z, 0.12, d, 2.6, 'stashGlass', { walk: false, shadow: false }); for (let i = 0; i <= 4; i++) B('steel', 0.1, 2.7, 0.1, x + sx * w / 2, 1.35, z - d / 2 + i * d / 4); }
  B('stashGlass', w + 0.2, 0.06, d, x, 2.65, z, 0, 0, 0, false); B('steel', 0.1, 0.4, d, x, 2.85, z, 0, 0, 0, false);
  for (const lx of [-w / 4, w / 4]) {
    blk(x + lx, z, 1.0, d - 3, 0.35, 'soil', { walk: false });
    for (let i = 0; i < 6; i++) { const pz = z - d / 2 + 2.4 + i * (d - 4.8) / 5; for (let k = 0; k < 3; k++) beam('leafGreen', x + lx, 0.35, pz, x + lx + Math.cos(k * 2.1) * 0.45, 1.3, pz + Math.sin(k * 2.1) * 0.45, 0.32, 0.03, false); B('budDry', 0.16, 0.22, 0.16, x + lx, 1.35, pz, 0, 0, 0, false); }
  }
  floorQuad(x, z, w, d, 0.01, 'concrete', 3);
}
// a shipping container (closed), w along x or z
function stashContainer(x, z, alongX, key) { blk(x, z, alongX ? 6 : 2.5, alongX ? 2.5 : 6, 2.6, key, { walk: true, tile: 2 }); B('dark', alongX ? 6.05 : 0.06, 0.08, alongX ? 0.06 : 6.05, x, 2.55, z + (alongX ? 1.26 : 0), 0, 0, 0, false); }
// a trailer: a long box with a door on one side and a step
function stashTrailer(x, z, alongX, key) {
  const w = alongX ? 8 : 2.6, d = alongX ? 2.6 : 8; blk(x, z, w, d, 2.5, key, { y: 0.35, walk: true }); blk(x, z, w - 0.4, d - 0.4, 0.35, 'dark', { walk: false });
  B('glass', alongX ? 1.4 : 0.04, 0.6, alongX ? 0.04 : 1.4, x + (alongX ? 2 : 1.31), 1.9, z + (alongX ? 1.31 : 2), 0, 0, 0, false);
  B('dark', alongX ? 0.9 : 0.04, 1.8, alongX ? 0.04 : 0.9, x + (alongX ? -1.5 : 1.31), 1.3, z + (alongX ? 1.31 : -1.5), 0, 0, 0, false);
}
function stashRock(x, z, s, h) { batchAdd('rock', new THREE.DodecahedronGeometry(s, 0), mat4(x, h * 0.4, z, x, z, 0, 1, h / s, 1)); PZ(x, 0, z, s * 1.3, h, s * 1.3); }
function stashSandbags(x, z, w, alongX) { blk(x, z, alongX ? w : 0.7, alongX ? 0.7 : w, 1.0, 'hay', { walk: false }); }
function buildStash() {
  buildMap2Materials(); worksMaterials(); airpMaterials(); isleMaterials();
  if (!MAT.stashGlass) MAT.stashGlass = new THREE.MeshStandardMaterial({ color: C(0xcfeedd), roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
  const sr = stashRand(4207), H = STASH_H;
  // ---- the ground, the beach, the sea
  floorQuad(0, 0, H * 2 + 4, H * 2 + 4, 0, 'ground', 6);
  for (const [x, z, w, d] of [[0, -H + 3, H * 2, 7], [0, H - 3, H * 2, 7], [-H + 3, 0, 7, H * 2], [H - 3, 0, 7, H * 2]]) floorQuad(x, z, w, d, 0.01, 'sand', 4);
  for (const [x, z, w, d] of [[0, -H - 60, 400, 120], [0, H + 60, 400, 120], [-H - 60, 0, 120, 400], [H + 60, 0, 120, 400]]) floorQuad(x, z, w, d, -0.35, 'sea', 10);
  for (const [x, z, w, d] of [[0, -H - 1.5, H * 2 + 6, 3], [0, H + 1.5, H * 2 + 6, 3], [-H - 1.5, 0, 3, H * 2 + 6], [H + 1.5, 0, 3, H * 2 + 6]]) blk(x, z, w, d, 9, 'dark', { noDraw: true });   // the water's edge
  // ---- roads: a cross through the village and a ring road
  floorQuad(0, 0, 6, H * 2 - 14, 0.015, 'asphalt', 6); floorQuad(0, 0, H * 2 - 14, 6, 0.016, 'asphalt', 6);
  for (const [x, z, w, d] of [[0, -30, 66, 5], [0, 30, 66, 5], [-30, 0, 5, 66], [30, 0, 5, 66]]) floorQuad(x, z, w, d, 0.014, 'asphalt', 6);
  // ---- CENTRE: THE VILLAGE
  floorQuad(0, 0, 22, 22, 0.02, 'cobble', 4);
  CYL('stone', 1.1, 1.2, 0.9, 14, 0, 0.45, 0); CYL('water', 0.9, 0.9, 0.05, 14, 0, 0.8, 0, 0, 0, 0, false); PZ(0, 0, 0, 2.2, 0.9, 2.2);
  for (const [x, z] of [[-1, 0], [1, 0]]) B('wood', 0.12, 2.2, 0.12, x * 1.0, 1.9, z, 0, 0, 0, false); B('terracotta', 2.6, 0.12, 1.6, 0, 3.0, 0, 0, 0, 0.2, true);
  stashHouse(-14, -13, 9, 7, 'plaster', 's'); stashHouse(14, -13, 9, 7, 'plasterOchre', 's'); stashHouse(-14, 13, 9, 7, 'plasterRose', 'n'); stashHouse(14, 13, 9, 7, 'plaster', 'n');
  stashHouse(-16, 0, 6, 8, 'brick', 'e', 3.4, 'terracotta'); stashHouse(16, 0, 6, 8, 'brick', 'w', 3.4, 'terracotta');
  blk(14, -14.5, 5, 0.7, 1.05, 'wood', { walk: false }); canopy(14, -9, 6, 2.2, 2.6, 'awningGreen');   // the shop: a counter and an awning
  canopy(-14, -9, 5, 2, 2.6, 'awningStripe');
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.4; tree(Math.cos(a) * 24, Math.sin(a) * 24, false, 0.9); }
  // ---- NW: THE GROW FARM
  floorQuad(-38, -38, 30, 26, 0.012, 'soil', 5);
  for (const x of [-48, -38, -28]) stashGreenhouse(x, -42, 7, 16);
  // the red barn with a hay loft (stairs up inside)
  wall(-46, -22, -34, -22, 5, 'redBarn', { holes: [{ at: 6, w: 3.4, b: 0, h: 3.6 }] }); wall(-46, -14, -34, -14, 5, 'redBarn', { holes: [{ at: 3, w: 1.4, b: 0, h: 2.3 }, { at: 9, w: 1.2, b: 1.2, h: 1.0, open: true }] });
  wall(-46, -22, -46, -14, 5, 'redBarn', { holes: [{ at: 4, w: 1.2, b: 3.0, h: 1.0, open: true }] }); wall(-34, -22, -34, -14, 5, 'redBarn', { holes: [{ at: 4, w: 1.4, b: 0, h: 2.3 }] });
  B('redBarn', 12.6, 0.2, 4.6, -40, 5.6, -20.3, -0.45, 0, 0); B('redBarn', 12.6, 0.2, 4.6, -40, 5.6, -15.7, 0.45, 0, 0); slab(-40, -18, 12, 8, 5.05, 'wood', 0.15, { noDraw: true });
  deck(-43, -18, 5.5, 7.4, 2.6, 'wood'); stairs(-36.05, -15.2, 'w', 1.2, 0, 2.6, 'wood', { open: true, rails: false });
  for (const [x, z] of [[-44, -16], [-42.5, -20], [-36, -21], [-44.5, -21]]) blk(x, z, 1.4, 1.0, 1.0, 'hay', { walk: true });
  for (let i = 0; i < 4; i++) blk(-30 + (i % 2) * 1.6, -24 - i * 0.2, 1.4, 1.0, 1.0, 'hay', { walk: true });
  // ---- NE: THE LIGHTHOUSE
  floorQuad(42, -42, 22, 22, 0.012, 'stone', 3);
  for (let i = 0; i < 5; i++) CYL(i % 2 ? 'isleRed' : 'isleWhite', 2.2 - i * 0.18, 2.4 - i * 0.18, 3, 18, 48, 1.5 + i * 3, -48); PZ(48, 0, -48, 4.4, 15, 4.4);
  CYL('dark', 1.4, 1.4, 0.3, 14, 48, 15.2, -48); CYL('lighthouseLamp', 0.9, 0.9, 1.6, 12, 48, 16.2, -48, 0, 0, 0, false); CYL('isleRed', 0.2, 1.3, 1.2, 12, 48, 17.6, -48);
  stashHouse(38, -44, 8, 6, 'isleWhite', 'w', 3.0, 'isleRed');
  for (let i = 0; i < 10; i++) stashRock(52 - (i % 5) * 2.8 + sr() * 1.5, -34 + Math.floor(i / 5) * 3 + sr(), 1.2 + sr() * 1.1, 0.9 + sr() * 1.4);
  // ---- E: THE QUARRY
  floorQuad(46, 0, 22, 26, 0.012, 'sand', 3);
  for (let i = 0; i < 16; i++) { const a = sr() * TAU, r = 3 + sr() * 9; stashRock(46 + Math.cos(a) * r, Math.sin(a) * r * 1.1, 1.3 + sr() * 1.6, 1.2 + sr() * 2.4); }
  for (const [x, z] of [[40, -9], [52, 9]]) { blk(x, z, 3, 3, 1.4, 'concrete', { walk: true }); }
  beam('rustIron', 54, 0, 4, 54, 10, 4, 0.5, 0.5); beam('rustIron', 54, 10, 4, 42, 9, 2, 0.35, 0.5); PZ(54, 0, 4, 0.6, 10, 0.6);   // the crane
  B('rustIron', 2.4, 1.2, 1.6, 42, 6.5, 2, 0, 0, 0, true); beam('dark', 42, 9, 2, 42, 7.1, 2, 0.04, 0.04, false);
  // ---- SE: THE BUNKER
  floorQuad(38, 38, 26, 24, 0.012, 'concrete', 4);
  for (const [x, z, door] of [[34, 34, 'n'], [44, 44, 'w']]) { stashHouse(x, z, 7, 6, 'concrete', door, 2.6, 'concrete'); }
  for (const [x, z, w, ax] of [[28, 42, 6, true], [40, 30, 7, true], [48, 34, 6, false], [30, 48, 5, false]]) stashSandbags(x, z, w, ax);
  deck(46, 26, 3.6, 3.6, 5, 'wood', { posts: true, rails: ['n', 'e', 'w'] }); stairs(46, 35.7, 'n', 1.2, 0, 5, 'steel', { open: true });
  B('awningGreen', 4, 0.1, 4, 46, 7.2, 26); for (const [px, pz] of [[44.3, 24.3], [47.7, 24.3], [44.3, 27.7], [47.7, 27.7]]) B('wood', 0.1, 2.1, 0.1, px, 6.1, pz, 0, 0, 0, false);
  // ---- S: THE DOCKS
  floorQuad(0, 50, 30, 14, 0.02, 'wood', 3);
  slab(8, 64, 4, 10, 0.2, 'wood', 0.3, { noCol: true }); for (let i = 0; i < 5; i++) CYL('bark', 0.15, 0.15, 1.4, 6, 6.2 + (i % 2) * 3.6, -0.3, 60 + i * 2);   // the pier into the sea (outside the play area: scenery)
  stashContainer(-8, 46, true, 'paintRed'); stashContainer(-8, 49, true, 'paintOrange'); stashContainer(-12, 53, false, 'steel'); stashContainer(10, 44, false, 'paintYellow'); stashContainer(14, 47, true, 'paintRed');
  stashHouse(2, 52, 8, 6, 'isleTeal', 'n', 3.6, 'sheet');
  for (const [x, z] of [[-3, 45], [6, 47], [-14, 46], [12, 52]]) blk(x, z, 1.1, 1.1, 1.1, 'wood', { walk: true });
  // ---- SW: THE TRAILER PARK
  floorQuad(-38, 38, 26, 24, 0.012, 'ground', 4);
  stashTrailer(-46, 32, true, 'sheet'); stashTrailer(-46, 40, true, 'paintWhite'); stashTrailer(-32, 30, false, 'paintYellow'); stashTrailer(-28, 44, true, 'sheet'); stashTrailer(-40, 48, true, 'paintRed');
  for (const [x, z] of [[-38, 36], [-34, 40]]) { blk(x, z, 2.0, 0.9, 0.75, 'wood', { walk: false }); for (const s of [-1, 1]) B('wood', 2.0, 0.08, 0.35, x, 0.45, z + s * 0.75, 0, 0, 0, false); }
  blk(-24, 36, 4.2, 1.9, 1.3, 'dark', { walk: false }); B('dark', 2.2, 0.6, 1.7, -24.3, 1.6, 36, 0, 0, 0, true);   // the burnt-out car
  // ---- W: THE WATER TOWER
  floorQuad(-46, 0, 16, 16, 0.012, 'concrete', 4);
  for (const [px, pz] of [[-49.5, -3.5], [-42.5, -3.5], [-49.5, 3.5], [-42.5, 3.5]]) blk(px, pz, 0.35, 0.35, 5, 'rustIron', { walk: false });
  deck(-46, 0, 9, 9, 5, 'steel', { rails: ['n', 's', 'w'] }); CYL('rustIron', 2.3, 2.3, 4, 18, -46, 7, 0); PZ(-46, 5, 0, 4.2, 4, 4.2); CYL('rustIron', 0.4, 2.5, 1.2, 18, -46, 9.6, 0);
  stairs(-33.7, 0, 'w', 1.2, 0, 5, 'steel', { open: true });
  stashHouse(-50, 10, 5, 4, 'brick', 'e', 2.8, 'sheet');
  // ---- scatter: palms on the beach, trees and rocks inland (away from the places and the roads)
  const busy = (x, z) => Math.abs(x) < 5 || Math.abs(z) < 5 || (Math.abs(Math.abs(x) - 30) < 4 && Math.abs(z) < 34) || (Math.abs(Math.abs(z) - 30) < 4 && Math.abs(x) < 34) || Math.hypot(x, z) < 24 ||
    [[-38, -34, 16], [42, -42, 13], [46, 0, 14], [38, 38, 15], [0, 50, 15], [-38, 38, 15], [-46, 2, 11], [54, -20, 9], [-30, -3.6, 3], [40, 12, 3]].some(([px, pz, r]) => Math.hypot(x - px, z - pz) < r);
  for (let i = 0; i < 40; i++) { const side = i % 4, t = -H + 6 + sr() * (H * 2 - 12), o = H - 3 - sr() * 3; const x = side === 0 ? t : side === 1 ? t : side === 2 ? -o : o, z = side === 0 ? -o : side === 1 ? o : t; if (!busy(x, z)) palm(x, z, 5.5 + sr() * 2.5, (sr() - 0.5) * 0.4); }
  try { duelBuild(DUEL_PEN.stashisle); } catch (e) {}
  try { moversMaterials(); moversBuild('stashisle'); } catch (e) {}   // JUMP PADS and ZIPLINES (movers.js)   // THE HOTBOX DUEL pit (duel.js)
  for (let i = 0, n = 0; i < 300 && n < 44; i++) { const x = (sr() - 0.5) * (H * 2 - 18), z = (sr() - 0.5) * (H * 2 - 18); if (busy(x, z)) continue; n++; if (sr() < 0.7) tree(x, z, sr() < 0.1, 0.9 + sr() * 0.4); else stashRock(x, z, 1 + sr() * 1.2, 0.8 + sr() * 1.2); }
}
defineMap({
  id: 'stashisle', size: 'huge', hidden: true, brOnly: true, arena: STASH_A, planCut: 3.6, name: 'STASH ISLAND', place: 'Grow island, sunny afternoon', desc: 'LAST TOKE\'s own island, twice the size of any other map: a village in the middle, a grow farm, a lighthouse, a quarry, a bunker, the docks, a trailer park and a water tower, all joined up by roads.',
  play: [-STASH_H, STASH_H, -STASH_H, STASH_H], build: buildStash,
  env: { top: 0x3f7ac8, horizon: 0xe8e0c8, fog: 0.004, sun: [-40, 60, 30], sunCol: 0xfff0d0, sunI: 2.4, skySun: 0xfff0c8, hemiSky: 0xd0e0f0, hemiGround: 0x6a6a3a, exposure: 1.02 },
  grass: { count: 9000, avoid: (x, z) => duelIn(x, z, 0.5) || Math.abs(x) < 4 || Math.abs(z) < 4 || Math.hypot(x, z) < 12 || Math.abs(x) > STASH_H - 7 || Math.abs(z) > STASH_H - 7 }, spawnMaxY: 0.5, spawnOk: p => !duelIn(p.x, p.z, 1.5),
  layout: {
    spawn: [{ x: 0, z: 40 }, { x: 0, z: -40 }],
    hp: [{ x: 0, z: 0 }, { x: -38, z: -30 }, { x: 42, z: -40 }, { x: 38, z: 38 }, { x: -38, z: 38 }],
    flags: [{ x: 0, z: 44 }, { x: 0, z: -44 }],
    sites: [{ x: -40, z: -18, n: 'A' }, { x: 46, z: 2, n: 'B' }],
  },
  menu: { x: 0, z: 0, r: 16, y: 3 },
  navPts: [{ x: 0, z: 0 }, { x: -38, z: -42 }, { x: 40, z: -44 }, { x: 46, z: 0 }, { x: 38, z: 38 }, { x: 0, z: 46 }, { x: -38, z: 38 }, { x: -46, z: 3.6, y: 5 }, { x: 46, z: 26, y: 5 }, { x: -43, z: -18, y: 2.6 }],
  views: [[0, 2.2, 20, 0, 1.4, 0], [-30, 2, -30, -40, 1.4, -42], [30, 2, -30, 48, 8, -48], [30, 2, 30, 46, 4, 26], [-30, 2, 30, -40, 1.4, 40], [-30, 2, 4, -46, 6, 0], [0, 2, 36, 0, 1.4, 52]],
});
