/* ================================================================== STASH ISLAND, REMADE (1.2.89): 391 x 391 m (152,865 m²)
   LAST TOKE's island, ten times the old one, built for fights indoors and up and down: almost every place to land is
   buildings you go into - two and three storeys, rooms and doorways, stairwells, windows to shoot out of, flat roofs you
   can walk on - plus raised ground (a cliff-top estate with a cellar complex and a tunnel under it, a terraced quarry,
   a radio hill) so there is always something above or below you.
     CENTRE - OLD TOWN: sixteen buildings on a street grid round a crossroads (the town hall, shops, flats).
     N      - THE SCHOOL: a long two-storey block of classrooms, a gym, the yard.
     NW     - GREENHOUSE ROW: four long greenhouses and the two-storey packing house.
     NE     - THE REFINERY: three tanks, the processing hall with its mezzanine, the control house. LIGHTHOUSE on the point.
     W      - THE HOTEL: three two-storey wings round a pool.
     E      - THE ESTATE: a cliff (5 m) with the mansion on top, THE CELLAR under it (rooms and a tunnel), ramps up.
     SW     - THE FARM: the barn with its hay loft, silos, the farmhouse.
     S      - THE DOCKS: two warehouses with mezzanines, stacked containers, the piers.
     SE     - THE QUARRY: three terraces stepping down into the pit, the office.
     mid S  - THE POWER STATION (turbine hall, cooling tower) and THE BUNKERS (pillboxes, sandbag trenches).
     mid NW - RADIO HILL: three tiers up to the radio hut and its mast.
   A ring road and a cross of roads join everything; carts and bikes wait on them. Every building is made by stashBld()
   from fixed numbers and a seed, so every machine builds the same island. Loot spots (STASH_LOOT) are inside, upstairs
   and on roofs; brSetup puts most of the crates there. */
const STASH_LOOT = [];
// a slab with a rectangular hole (for a stairwell): up to four pieces round the hole
function stashSlabHole(x0, x1, z0, z1, top, key, hole, walk = true) {
  const th = 0.25, piece = (a, b, c, d) => { if (b - a > 0.05 && d - c > 0.05) blk((a + b) / 2, (c + d) / 2, b - a, d - c, th, key, { y: top - th, walk }); };
  if (!hole) return piece(x0, x1, z0, z1);
  const [hx0, hx1, hz0, hz1] = hole;
  piece(x0, hx0, z0, z1); piece(hx1, x1, z0, z1); piece(hx0, hx1, z0, hz0); piece(hx0, hx1, hz1, z1);
}
/* a building you can go into. o: x z (centre), w d, f storeys (1-3), y (base height), key (walls), floor, doors (sides
   'n','s','e','w'), seed. The stairs switch back along the north wall; f <= 2 have a walkable roof with a parapet. */
const STASH_H3 = 3.6;
function stashBld(o) {
  const H = STASH_H3, f = o.f || 2, y0 = o.y || 0, w = o.w, d = o.d, x0 = o.x - w / 2, x1 = o.x + w / 2, z0 = o.z - d / 2, z1 = o.z + d / 2;
  const key = o.key || 'plaster', fl = o.floor || 'wood', sr = stashRand(o.seed || ((o.x * 31 + o.z * 17) | 0)), roofWalk = f <= 2 && o.roof !== false;
  const flights = roofWalk ? f : f - 1, n = Math.ceil(H / 0.27), L = n * 0.42, sx0 = x0 + 1.6, sx1 = sx0 + L;
  const bandA = [z0 + 0.3, z0 + 1.6], bandB = [z0 + 1.6, z0 + 2.9], doors = o.doors || ['s'];
  const winRow = (len, skipAt) => { const out = []; for (let a = 2; a < len - 1.5; a += 3.6) { if (skipAt !== null && Math.abs(a - skipAt) < 1.8) continue; out.push({ at: a, w: 1.2, b: 1.0, h: 1.2, open: true }); } return out; };
  // a north door goes at the east end of the wall: the stairs run along the inside of the north wall
  const sideHoles = (sd, len, s) => { const door = s === 0 && doors.includes(sd), at = sd === 'n' ? len - 2.2 : len / 2; const h = winRow(len, door ? at : null); if (door) h.push({ at, w: 1.8, b: 0, h: 2.4 }); return h; };
  for (let s = 0; s < f; s++) {
    const y = y0 + s * H;
    wall(x0, z0, x1, z0, H, key, { y, t: 0.3, holes: sideHoles('n', w, s) }); wall(x0, z1, x1, z1, H, key, { y, t: 0.3, holes: sideHoles('s', w, s) });
    wall(x0, z0, x0, z1, H, key, { y, t: 0.3, holes: sideHoles('w', d, s) }); wall(x1, z0, x1, z1, H, key, { y, t: 0.3, holes: sideHoles('e', d, s) });
    if (s === 0) floorQuad(o.x, o.z, w - 0.4, d - 0.4, y + 0.012, fl, 3);
    // rooms: walls across the building every ~8 m east of the stairs (a doorway in each), and one along it in deep buildings
    const pz = d >= 13 ? z0 + 3.2 + (d - 3.2) * 0.5 : null;
    const parts = []; for (let px = Math.max(sx1 + 1.2, x0 + 7.5); px < x1 - 4; px += 7 + sr() * 3) parts.push(px);
    for (const px of parts) { const dz = pz === null ? z0 + 3.2 + (d - 3.2) * (0.3 + sr() * 0.4) : sr() < 0.5 ? (z0 + 3.2 + pz) / 2 : (pz + z1) / 2; wall(px, z0 + 0.15, px, z1 - 0.15, H - 0.1, key, { y, t: 0.2, holes: [{ at: dz - z0 - 0.15, w: 1.8, b: 0, h: 2.3 }] }); }
    if (pz !== null) { const ex = parts.length ? parts[0] : x1 - 0.15; wall(x0 + 0.15, pz, ex, pz, H - 0.1, key, { y, t: 0.2, holes: [{ at: (ex - x0) * (0.3 + sr() * 0.4), w: 1.8, b: 0, h: 2.3 }] }); }
    // cover and loot in the rooms
    const edges = [x0, ...parts, x1];
    for (let r = 0; r < edges.length - 1; r++) {
      // the middle of the room, kept clear of the cross wall (pz) and its doorway
      const cx = (edges[r] + edges[r + 1]) / 2, zs = r === 0 ? z0 + 3.2 : z0 + 0.5, cz = pz !== null && r === 0 ? (pz + z1) / 2 : (zs + z1) / 2;
      if (edges[r + 1] - edges[r] < 3) continue;
      if (sr() < 0.7) blk(cx + (sr() - 0.5) * 1.2, cz + (sr() - 0.5) * 1.2, 1.2, 0.8, 0.9, sr() < 0.5 ? 'wood' : 'dark', { y, walk: false });
      if (sr() < 0.6) STASH_LOOT.push({ x: +(cx + (sr() - 0.5) * 1.5).toFixed(2), z: +(cz + 1.6).toFixed(2), y: y + 0.01 });
    }
  }
  // the stairs: flight k climbs to level k, switching between the two bands; each level has its hole over its flight
  for (let k = 1; k <= flights; k++) { const odd = k % 2 === 1, b = odd ? bandA : bandB; stairs(odd ? sx0 : sx1, (b[0] + b[1]) / 2, odd ? 'e' : 'w', 1.25, y0 + (k - 1) * H, y0 + k * H, 'concrete'); }
  for (let k = 1; k <= f; k++) { const hole = k <= flights ? [sx0, sx1, ...(k % 2 === 1 ? bandA : bandB)] : null; stashSlabHole(x0 + 0.15, x1 - 0.15, z0 + 0.15, z1 - 0.15, y0 + k * H, k === f ? (o.roofKey || 'concrete') : fl === 'wood' ? 'wood' : 'concrete', hole, k < f || roofWalk); }
  if (roofWalk) { for (const [ax, az, bx, bz] of [[x0, z0, x1, z0], [x0, z1, x1, z1], [x0, z0, x0, z1], [x1, z0, x1, z1]]) wall(ax, az, bx, bz, 1.0, key, { y: y0 + f * H, t: 0.3 }); STASH_LOOT.push({ x: +(o.x + w * 0.25).toFixed(2), z: +(o.z + d * 0.2).toFixed(2), y: y0 + f * H + 0.01 }); }
  return { x0, x1, z0, z1, top: y0 + f * H };
}
// a big hall (warehouse, barn, turbine hall): one tall room, big doors, a mezzanine along the north side with stairs
function stashHall(o) {
  const w = o.w, d = o.d, h = o.h || 7, x0 = o.x - w / 2, x1 = o.x + w / 2, z0 = o.z - d / 2, z1 = o.z + d / 2, key = o.key || 'panel', M = 3.6, md = o.md || 4.5;
  const big = (len) => [{ at: len / 2, w: 4.5, b: 0, h: 4.2 }], win = len => { const out = []; for (let a = 3; a < len - 2; a += 4) out.push({ at: a, w: 1.6, b: 4.6, h: 1.2, open: true }); return out; };
  wall(x0, z0, x1, z0, h, key, { t: 0.3, holes: win(w) }); wall(x0, z1, x1, z1, h, key, { t: 0.3, holes: big(w).concat(win(w).filter(q => Math.abs(q.at - w / 2) > 3)) });
  wall(x0, z0, x0, z1, h, key, { t: 0.3, holes: [{ at: d * 0.6, w: 1.8, b: 0, h: 2.4 }] }); wall(x1, z0, x1, z1, h, key, { t: 0.3, holes: [{ at: d * 0.6, w: 1.8, b: 0, h: 2.4 }] });
  blk(o.x, o.z, w + 0.4, d + 0.4, 0.3, o.roofKey || 'rustIron', { y: h, noCol: true });
  floorQuad(o.x, o.z, w - 0.4, d - 0.4, 0.012, o.floor || 'concrete', 4);
  // the mezzanine (rails on its open edge), stairs up at the west end
  deck(o.x + 1, z0 + 0.15 + md / 2, w - 2.3, md, M, 'steel', {});
  stairs(x0 + 3.2, z0 + 0.15 + md + Math.ceil(M / 0.27) * 0.42, 'n', 1.3, 0, M, 'steel', { open: true });
  STASH_LOOT.push({ x: +(o.x + w * 0.2).toFixed(2), z: +(z0 + md / 2).toFixed(2), y: M + 0.01 }, { x: +(o.x - w * 0.2).toFixed(2), z: +(o.z + d * 0.2).toFixed(2), y: 0.01 });
  // stacks of crates and pallets on the floor: cover
  const sr = stashRand((o.x * 13 + o.z * 7) | 0);
  for (let i = 0; i < Math.round(w * d / 70); i++) { const px = x0 + 3 + sr() * (w - 6), pz = z0 + md + 2 + sr() * (d - md - 4); if (Math.abs(pz - z1) < 4 && Math.abs(px - o.x) < 3.5) continue; blk(px, pz, 1.6, 1.6, 1.2 + (sr() < 0.4 ? 1.2 : 0), sr() < 0.5 ? 'wood' : 'dark', { walk: true }); }
}
// a stepped hill: tiers of solid ground with a ramp up each one (on the side given)
// a ramp you can see: the collision steps (ramp) and one sloped slab drawn over them
function stashRamp(x, z, dir, w, len, y0, y1, key) {
  ramp(x, z, dir, w, len, y0, y1, key);
  const [dx, dz] = DIRV[dir], a = Math.atan2(y1 - y0, len), L = Math.hypot(len, y1 - y0), cx = x + dx * len / 2, cz = z + dz * len / 2, cy = (y0 + y1) / 2 - 0.1;
  if (dx) B(key, L, 0.3, w, cx, cy, cz, 0, 0, dx > 0 ? a : -a, true); else B(key, w, 0.3, L, cx, cy, cz, dz > 0 ? -a : a, 0, 0, true);
}
function stashTiers(x, z, sizes, step, key, rampSide = 's') {
  sizes.forEach((s, i) => {
    const top = step * (i + 1); blk(x, z, s, s, top, key, { walk: true, tile: 6 });
    const len = step * 5, half = s / 2, off = (i % 2 ? -1 : 1) * s * 0.2;
    if (rampSide === 's') stashRamp(x + off, z + half + len, 'n', 3, len, top - step, top, key); else stashRamp(x + half + len, z + off, 'w', 3, len, top - step, top, key);
  });
}
function stashTank(x, z, r, h) { CYL('paintWhite', r, r, h, 20, x, h / 2, z); PZ(x, 0, z, r * 1.6, h, r * 1.6); CYL('rustIron', r + 0.05, r + 0.05, 0.4, 20, x, h * 0.7, z, 0, 0, 0, false); }
function buildStash() {
  buildMap2Materials(); worksMaterials(); airpMaterials(); isleMaterials();
  if (!MAT.stashGlass) MAT.stashGlass = new THREE.MeshStandardMaterial({ color: C(0xcfeedd), roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
  STASH_LOOT.length = 0;
  const sr = stashRand(4207), H = STASH_H;
  // ---- the ground, the beach, the sea, the water's edge
  floorQuad(0, 0, H * 2 + 4, H * 2 + 4, 0, 'ground', 30);
  for (const [x, z, w, d] of [[0, -H + 5, H * 2, 10], [0, H - 5, H * 2, 10], [-H + 5, 0, 10, H * 2], [H - 5, 0, 10, H * 2]]) floorQuad(x, z, w, d, 0.01, 'sand', 12);
  for (const [x, z, w, d] of [[0, -H - 150, 900, 300], [0, H + 150, 900, 300], [-H - 150, 0, 300, 900], [H + 150, 0, 300, 900]]) floorQuad(x, z, w, d, -0.35, 'sea', 30);
  for (const [x, z, w, d] of [[0, -H - 1.5, H * 2 + 6, 3], [0, H + 1.5, H * 2 + 6, 3], [-H - 1.5, 0, 3, H * 2 + 6], [H + 1.5, 0, 3, H * 2 + 6]]) blk(x, z, w, d, 9, 'dark', { noDraw: true });
  // ---- roads: the cross and the ring
  floorQuad(0, 0, 8, H * 2 - 20, 0.015, 'asphalt', 30); floorQuad(0, 0, H * 2 - 20, 8, 0.016, 'asphalt', 30);
  for (const [x, z, w, d] of [[0, -110, 228, 8], [0, 110, 228, 8], [-110, 0, 8, 228], [110, 0, 8, 228]]) floorQuad(x, z, w, d, 0.014, 'asphalt', 24);
  /* ======== CENTRE: OLD TOWN (16 buildings round the crossroads) */
  floorQuad(0, 0, 84, 84, 0.012, 'cobble', 14);
  const townKeys = ['plaster', 'brick', 'facade', 'plaster', 'brick', 'panel'];
  let ti = 0;
  for (const x of [-30, -10, 10, 30]) for (const z of [-30, -10, 10, 30]) {
    const big = Math.abs(x) === 30 && Math.abs(z) === 30, ds = [];
    ds.push(z < 0 ? 's' : 'n'); ds.push(x < 0 ? 'e' : 'w');
    stashBld({ x, z, w: big ? 15 : 12, d: big ? 14 : 12, f: big ? 3 : (ti % 3 === 0 ? 1 : 2), key: townKeys[ti % townKeys.length], doors: ds, seed: 100 + ti });
    ti++;
  }
  CYL('stone', 1.6, 1.8, 1.0, 16, 0, 0.5, 0); PZ(0, 0, 0, 3.4, 1.0, 3.4); CYL('stone', 0.4, 0.5, 3.4, 10, 0, 2.2, 0);   // the monument in the crossroads
  /* ======== N: THE SCHOOL */
  floorQuad(0, -140, 70, 40, 0.012, 'concrete', 10);
  stashBld({ x: 0, z: -146, w: 44, d: 16, f: 2, key: 'brick', doors: ['s', 'e', 'w'], seed: 7 });
  stashHall({ x: -30, z: -124, w: 18, d: 14, h: 6.5, key: 'brick', roofKey: 'dark', floor: 'wood' });   // the gym
  for (const x of [8, 18]) { blk(x, -126, 0.15, 3, 3, 'steel', { walk: false }); }
  /* ======== NW: GREENHOUSE ROW */
  for (const x of [-150, -138, -126, -114]) stashGreenhouse(x, -128, 7, 24);
  stashBld({ x: -132, z: -100, w: 26, d: 12, f: 2, key: 'panel', doors: ['n', 's'], seed: 21 });
  for (let i = 0; i < 4; i++) stashContainer(-160 + i * 3, -100, false, i % 2 ? 'paintGreen' : 'rustIron');
  /* ======== NW mid: RADIO HILL */
  stashTiers(-72, -64, [40, 28, 16], 2, 'ground', 's');
  stashBld({ x: -72, z: -64, w: 10, d: 8, f: 1, y: 6, key: 'concrete', doors: ['s'], seed: 31 });
  CYL('steel', 0.15, 0.25, 22, 6, -66, 17, -68, 0, 0, 0, false); PZ(-66, 6, -68, 0.6, 22, 0.6);
  /* ======== NE: THE REFINERY + THE LIGHTHOUSE */
  floorQuad(125, -125, 70, 60, 0.012, 'concrete', 10);
  for (const [x, z] of [[105, -140], [122, -142], [139, -140]]) stashTank(x, z, 6, 9);
  stashHall({ x: 128, z: -112, w: 30, d: 18, h: 8, key: 'panel' });
  stashBld({ x: 96, z: -112, w: 12, d: 10, f: 2, key: 'concrete', doors: ['s', 'e'], seed: 41 });
  for (let i = 0; i < 6; i++) beam('rustIron', 105 + i * 6, 6.5, -134, 105 + i * 6, 6.5, -120, 0.25, 0.25, false);
  stashBld({ x: 168, z: -170, w: 9, d: 9, f: 3, key: 'plaster', doors: ['s'], seed: 51, roofKey: 'redBarn' });   // the lighthouse keeper's tower
  CYL('paintWhite', 3.2, 3.6, 14, 16, 176, 7, -178); PZ(176, 0, -178, 7, 14, 7); CYL('redBarn', 3.25, 3.25, 1.4, 16, 176, 10, -178, 0, 0, 0, false); CYL('glass', 2.2, 2.2, 2.2, 12, 176, 15.1, -178, 0, 0, 0, false);
  /* ======== W: THE HOTEL (three wings round the pool) */
  stashBld({ x: -170, z: 20, w: 12, d: 40, f: 2, key: 'plaster', doors: ['e', 'w'], seed: 61 });
  stashBld({ x: -149, z: -6, w: 30, d: 12, f: 2, key: 'plaster', doors: ['s', 'n'], seed: 62 });
  stashBld({ x: -149, z: 46, w: 30, d: 12, f: 2, key: 'plaster', doors: ['n', 's'], seed: 63 });
  blk(-148, 20, 16, 10, 0.4, 'whiteTile', { walk: true }); floorQuad(-148, 20, 14.6, 8.6, 0.42, 'water', 2);
  for (const z of [10, 30]) for (const x of [-156, -140]) blk(x, z, 2.2, 0.8, 0.5, 'paintWhite', { walk: true });
  /* ======== E: THE ESTATE: a 5 m cliff, the mansion on top, THE CELLAR inside its west part, a tunnel through it */
  const EH = 5;
  blk(161, 6.25, 42, 22.5, EH, 'rock', { walk: true, tile: 8 }); blk(161, 33.75, 42, 22.5, EH, 'rock', { walk: true, tile: 8 });   // solid either side of the tunnel
  slab(161, 20, 42, 5, EH, 'rock', 0.6); floorQuad(161, 20, 42, 5, 0.013, 'concrete', 6);   // the tunnel (x 140..182, z 17.5..22.5) and its roof
  // the cellar block (x 122..140): outer walls with the tunnel mouths, rooms inside, the roof is the cliff top
  for (const [ax, az, bx, bz, holes] of [[122, -5, 140, -5, []], [122, 45, 140, 45, []], [122, -5, 122, 45, [{ at: 25, w: 4, b: 0, h: 3 }, { at: 8, w: 1.8, b: 0, h: 2.4 }]]]) wall(ax, az, bx, bz, EH, 'rock', { t: 1, holes });
  slab(131, 20, 18.6, 50.6, EH, 'rock', 0.4);
  wall(131, -5, 131, 45, EH - 0.4, 'concrete', { t: 0.3, holes: [{ at: 25, w: 3, b: 0, h: 3 }, { at: 9, w: 1.8, b: 0, h: 2.3 }, { at: 41, w: 1.8, b: 0, h: 2.3 }] });
  for (const z of [7, 33]) wall(131, z, 140, z, EH - 0.4, 'concrete', { t: 0.3, holes: [{ at: 4.5, w: 1.8, b: 0, h: 2.3 }] });
  for (const z of [7, 33]) wall(122, z, 131, z, EH - 0.4, 'concrete', { t: 0.3, holes: [{ at: 4.5, w: 1.8, b: 0, h: 2.3 }] });
  floorQuad(131, 20, 17.4, 49.4, 0.012, 'concrete', 6);
  for (const [x, z] of [[126, 0], [136, 2], [126, 40], [136, 38], [135, 20], [127, 16]]) { blk(x, z, 1.6, 1.0, 1.0, 'dark', { walk: false }); STASH_LOOT.push({ x: x + 1.6, z: z + 1.2, y: 0.01 }); }
  // ramps up the cliff: from the west road and from the south
  stashRamp(98, 32, 'e', 4.5, 24, 0, EH, 'rock'); stashRamp(162, 70, 'n', 4.5, 25, 0, EH, 'rock');
  stashBld({ x: 162, z: 6, w: 26, d: 18, f: 2, y: EH, key: 'plaster', doors: ['s', 'w'], seed: 71, floor: 'wood' });
  floorQuad(158, 30, 12, 7, EH + 0.02, 'water', 2); for (const x of [150, 166]) blk(x, 36, 2, 0.8, 0.5, 'paintWhite', { y: EH, walk: true });
  /* ======== SW: THE FARM */
  floorQuad(-140, 140, 70, 60, 0.012, 'ground', 8);
  stashHall({ x: -140, z: 132, w: 24, d: 16, h: 7.5, key: 'redBarn', roofKey: 'dark', floor: 'soil' });
  for (const z of [118, 130]) { CYL('rustIron', 3, 3, 11, 16, -115, 5.5, z); PZ(-115, 0, z, 6, 11, 6); }
  stashBld({ x: -166, z: 160, w: 13, d: 11, f: 2, key: 'plaster', doors: ['n', 'e'], seed: 81 });
  for (let i = 0; i < 10; i++) blk(-150 + (i % 5) * 7, 168 + ((i / 5) | 0) * 6, 1.6, 1.2, 1.2, 'hay', { walk: true });
  /* ======== S: THE DOCKS */
  floorQuad(0, 168, 120, 40, 0.012, 'concrete', 10);
  stashHall({ x: -32, z: 160, w: 28, d: 18, h: 8, key: 'panel' }); stashHall({ x: 30, z: 160, w: 28, d: 18, h: 8, key: 'rustIron', roofKey: 'dark' });
  for (let i = 0; i < 4; i++) { stashContainer(-6 + (i % 2) * 7, 150 + ((i / 2) | 0) * 8, false, ['paintBlue', 'rustIron', 'paintGreen', 'paintRed'][i]); blk(-6 + (i % 2) * 7, 150 + ((i / 2) | 0) * 8, 2.5, 6, 2.6, ['paintRed', 'paintBlue'][i % 2], { y: 2.6, walk: true }); }
  stairs(1, 147 - Math.ceil(5.2 / 0.27) * 0.42, 's', 1.2, 0, 5.2, 'steel', { open: true });
  for (const x of [-60, 60]) { blk(x, 186, 6, 18, 0.6, 'wood', { walk: true }); }
  /* ======== SE: THE QUARRY (three terraces down into the pit) */
  for (const [z, top] of [[112, 4.5], [120, 3], [128, 1.5]]) blk(130, z, 56, 8, top, 'rock', { walk: true, tile: 6 });
  for (const [x, top] of [[162, 4.5], [154, 3], [146, 1.5]]) blk(x, 150, 8, 36, top, 'rock', { walk: true, tile: 6 });
  for (const [x, z, y0] of [[108, 132, 0], [108, 124, 1.5], [108, 116, 3]]) stairs(x, z + Math.ceil(1.5 / 0.27) * 0.42, 'n', 2, y0, y0 + 1.5, 'rock');
  floorQuad(125, 150, 40, 36, 0.015, 'stone', 8);
  stashBld({ x: 100, z: 168, w: 12, d: 10, f: 2, key: 'panel', doors: ['n', 'e'], seed: 91 });
  for (const [x, z] of [[118, 146], [132, 158], [124, 164]]) stashRock(x, z, 1.8, 2.2);
  /* ======== mid S: THE POWER STATION + THE BUNKERS */
  stashHall({ x: -62, z: 92, w: 30, d: 18, h: 9, key: 'concrete', roofKey: 'dark' });
  CYL('concrete', 9, 7, 18, 24, -90, 9, 120); PZ(-90, 0, 120, 16, 18, 16);
  for (let i = 0; i < 6; i++) blk(-48 + (i % 3) * 5, 116 + ((i / 3) | 0) * 5, 2.2, 2.2, 2.6, 'dark', { walk: true });
  for (const [x, z] of [[52, 80], [72, 80], [52, 100], [72, 100]]) stashBld({ x, z, w: 12, d: 8, f: 1, key: 'concrete', doors: [z < 90 ? 's' : 'n'], seed: (x + z) | 0, roofKey: 'concrete' });
  for (const [x, z, w, al] of [[62, 70, 18, true], [62, 110, 18, true], [42, 90, 14, false], [82, 90, 14, false]]) stashSandbags(x, z, w, al);
  /* ======== houses along the roads (quick loot, cover between the big places) */
  const hs = [[60, -60, 2], [-38, -50, 1], [70, 50, 2], [-60, 46, 2], [-124, -40, 1], [124, -52, 2], [-40, -170, 1], [60, -170, 2], [-176, -60, 1], [176, 92, 1], [-100, 176, 1], [-22, 100, 2], [96, 60, 1], [-96, -150, 2]];
  hs.forEach(([x, z, f], i) => stashBld({ x, z, w: 12, d: 9, f, key: townKeys[(i + 2) % townKeys.length], doors: ['s', 'n'], seed: 200 + i }));
  /* ======== scatter: trees and rocks on the open ground (not on roads or places) */
  for (let i = 0, n = 0; i < 2000 && n < 150; i++) {
    const x = (sr() - 0.5) * (H * 2 - 30), z = (sr() - 0.5) * (H * 2 - 30); if (stashBusy(x, z, 4)) continue; n++;
    if (sr() < 0.75) tree(x, z, sr() < 0.08, 0.9 + sr() * 0.5); else stashRock(x, z, 1.2 + sr() * 1.6, 1.4 + sr() * 2);
  }
  try { duelBuild(DUEL_PEN.stashisle); } catch (e) {}
  try { moversMaterials(); moversBuild('stashisle'); } catch (e) {}
}
// where the trees, rocks and grass don't go
const STASH_PLACES = [[0, 0, 46], [0, -140, 40], [-132, -115, 38], [-72, -64, 24], [125, -125, 42], [172, -174, 14], [-158, 20, 36], [150, 20, 40], [-140, 142, 38], [0, 165, 64], [132, 142, 38], [-70, 104, 32], [62, 90, 26]];
function stashBusy(x, z, m = 0) {
  if (Math.abs(x) < 6 + m || Math.abs(z) < 6 + m || Math.abs(Math.abs(x) - 110) < 6 + m || Math.abs(Math.abs(z) - 110) < 6 + m) return true;
  if (Math.abs(x) > STASH_H - 12 || Math.abs(z) > STASH_H - 12) return true;
  if (STASH_PLACES.some(([px, pz, r]) => Math.abs(x - px) < r + m && Math.abs(z - pz) < r + m)) return true;
  return typeof duelIn === 'function' && duelIn(x, z, 2 + m);
}
// the old island's definition gets the new size, build and look
(() => {
  const m = MAPS.stashisle; if (!m) return;
  Object.assign(m, {
    arena: STASH_A, build: buildStash, play: [-STASH_H, STASH_H, -STASH_H, STASH_H], planCut: 3.8, loot: STASH_LOOT,
    desc: 'LAST TOKE\'s own island: 391 m across, the size of ten old islands. Old Town in the middle, a school, a hotel, a refinery, a cliff-top estate with a cellar and a tunnel under it, a farm, the docks, a quarry, a power station and bunkers - nearly all of it buildings you go into, two and three storeys high.',
    layout: { spawn: [{ x: 0, z: 120 }, { x: 0, z: -120 }], hp: [{ x: 0, z: 0 }, { x: -140, z: 140 }, { x: 125, z: -125 }, { x: 150, z: 20 }, { x: -150, z: 20 }], flags: [{ x: 0, z: 130 }, { x: 0, z: -130 }], sites: [{ x: -62, z: 92, n: 'A' }, { x: 128, z: -112, n: 'B' }] },
    menu: { x: 0, z: 0, r: 24, y: 4 },
    navPts: [{ x: 0, z: 0 }, { x: 0, z: -140 }, { x: -132, z: -100 }, { x: 125, z: -112 }, { x: -150, z: 20 }, { x: 131, z: 20 }, { x: 160, z: 20, y: 5 }, { x: -140, z: 140 }, { x: 0, z: 160 }, { x: 130, z: 145 }, { x: -62, z: 92 }, { x: 62, z: 90 }, { x: -72, z: -64, y: 6 }],
    views: [[22, 3, 22, 0, 2, 0], [0, 4, -110, 0, 4, -146], [-110, 3, -80, -132, 3, -110], [96, 3, -90, 128, 4, -112], [-128, 3, 20, -160, 3, 20], [110, 3, 34, 150, 6, 20], [-110, 3, 120, -140, 4, 132], [0, 3, 130, -30, 4, 160], [110, 6, 112, 130, 0, 150]],
  });
  m.grass = { count: 16000, avoid: (x, z) => stashBusy(x, z, 1) };
})();
