/* ================================================================== LAST TOKE map: STASH ISLAND
   1.2.73: the first island (120 m). 1.2.89: remade at 391 x 391 m - see map_stash2.js for the island itself (the
   building generator stashBld, the places, the loot spots). This file keeps the size, the small helpers and the definition. */
const STASH_A = 200, STASH_H = 195.49;   // the nav arena half-size and the play area half-size (1.2.89: 390.98 m square, 152,865 m²)
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
// (the island itself is built by buildStash in map_stash2.js)
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
