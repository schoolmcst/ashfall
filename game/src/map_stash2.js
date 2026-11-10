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
const STASH_LADDERS = [];   // ladders up to the walkable roofs (+ the lighthouse), placed in LAST TOKE by brfight.js
STASH_LOOT.push = function (...a) { for (const o of a) o.y = +((o.y || 0) + BUILD_YOFF).toFixed(2); return Array.prototype.push.apply(this, a); };
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
      if (sr() < 0.65) { const left = sr() < 0.5, lx = left ? edges[r] + 1.1 : edges[r + 1] - 1.1; STASH_LOOT.push({ x: +lx.toFixed(2), z: +(z1 - 0.95).toFixed(2), y: y + 0.01, q: s > 0 ? 1 : 0 }); }   // against the back wall, in a corner
    }
  }
  // the stairs: flight k climbs to level k, switching between the two bands; each level has its hole over its flight
  for (let k = 1; k <= flights; k++) { const odd = k % 2 === 1, b = odd ? bandA : bandB; stairs(odd ? sx0 : sx1, (b[0] + b[1]) / 2, odd ? 'e' : 'w', 1.25, y0 + (k - 1) * H, y0 + k * H, 'concrete'); }
  for (let k = 1; k <= f; k++) { const hole = k <= flights ? [sx0, sx1, ...(k % 2 === 1 ? bandA : bandB)] : null; stashSlabHole(x0 + 0.15, x1 - 0.15, z0 + 0.15, z1 - 0.15, y0 + k * H, k === f ? (o.roofKey || 'concrete') : fl === 'wood' ? 'wood' : 'concrete', hole, k < f || roofWalk); }
  if (roofWalk) { for (const [ax, az, bx, bz] of [[x0, z0, x1, z0], [x0, z1, x1, z1], [x0, z0, x0, z1], [x1, z0, x1, z1]]) wall(ax, az, bx, bz, 1.0, key, { y: y0 + f * H, t: 0.3 }); STASH_LOOT.push({ x: +(x1 - 1.2).toFixed(2), z: +(z1 - 1.2).toFixed(2), y: y0 + f * H + 0.01, q: 1 });
    const side = ['w', 'e', 's', 'n'].find(s => !doors.includes(s)) || 'w', cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;   // a ladder up an outside wall with no door
    const L = side === 'w' ? { x: x0, z: cz + 1.5, nx: -1, nz: 0 } : side === 'e' ? { x: x1, z: cz + 1.5, nx: 1, nz: 0 } : side === 's' ? { x: cx + 2, z: z1, nx: 0, nz: 1 } : { x: cx + 2, z: z0, nx: 0, nz: -1 };
    STASH_LADDERS.push(Object.assign(L, { y1: +(BUILD_YOFF + y0 + f * H + 0.02).toFixed(2) })); }
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
  STASH_LOOT.push({ x: +(o.x + w * 0.2).toFixed(2), z: +(z0 + md / 2).toFixed(2), y: M + 0.01, q: 1 }, { x: +(x1 - 1.4).toFixed(2), z: +(o.z + d * 0.15).toFixed(2), y: 0.01, q: 0 });
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
/* ---------- the land: places sit on flat pads at heights that suit them, natural hills between, cliffs where a pad
   meets low ground with a short blend. y: the pad's height; b: how far (m) it blends into the hills (2-4 = a cliff). */
const STASH_POIS = [
  { id: 'town', name: 'OLD TOWN', x: 0, z: 0, w: 96, d: 96, y: 8, b: 26 },
  { id: 'school', name: 'THE SCHOOL', x: 0, z: -140, w: 76, d: 46, y: 12, b: 18 },
  { id: 'green', name: 'GREENHOUSE ROW', x: -132, z: -112, w: 72, d: 58, y: 7, b: 18 },
  { id: 'radio', name: 'RADIO HILL', x: -72, z: -64, w: 20, d: 18, y: 26, b: 8 },
  { id: 'refinery', name: 'THE REFINERY', x: 125, z: -122, w: 78, d: 66, y: 3, b: 14 },
  { id: 'light', name: 'THE LIGHTHOUSE', x: 172, z: -176, w: 30, d: 30, y: 18, b: 3 },
  { id: 'hotel', name: 'THE HOTEL', x: -158, z: 20, w: 50, d: 70, y: 3, b: 16 },
  { id: 'cellar', name: 'THE CELLAR', x: 122, z: 20, w: 36, d: 62, y: 9, b: 12 },
  { id: 'estate', name: 'THE ESTATE', x: 164, z: 20, w: 42, d: 56, y: 14, b: 3 },
  { id: 'farm', name: 'THE FARM', x: -140, z: 142, w: 78, d: 68, y: 5, b: 18 },
  { id: 'docks', name: 'THE DOCKS', x: 0, z: 165, w: 132, d: 46, y: 1.2, b: 12 },
  { id: 'quarryRim', name: '', x: 128, z: 146, w: 92, d: 82, y: 15, b: 18 },
  { id: 'quarry', name: 'THE QUARRY', x: 128, z: 148, w: 60, d: 50, y: 9, b: 2.5 },
  { id: 'power', name: 'POWER STATION', x: -66, z: 100, w: 72, d: 58, y: 6, b: 16 },
  { id: 'bunkers', name: 'THE BUNKERS', x: 62, z: 90, w: 56, d: 48, y: 16, b: 14 },
];
// ramps: a strip whose height runs from y0 (at a) to y1 (at b); y0 'nat' takes the hill's height there
const STASH_RAMPS = [
  { ax: 122, az: -176, bx: 157, bz: -176, w: 8, y0: 'nat', y1: 18 },      // the road up to the lighthouse
  { ax: 162, az: 78, bx: 162, bz: 48, w: 8, y0: 'nat', y1: 14 },          // the drive up to the estate
];
const STASH_HOUSES = [[60, -60, 2], [-38, -50, 1], [70, 50, 2], [-60, 46, 2], [-124, -40, 1], [124, -52, 2], [-40, -170, 1], [60, -170, 2], [-176, -60, 1], [176, 92, 1], [-100, 176, 1], [-22, 100, 2], [96, 60, 1], [-96, -150, 2]];
const stashSmooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const stashRoad = (x, z) => Math.abs(x) < 4.5 || Math.abs(z) < 4.5 || ((Math.abs(Math.abs(x) - 110) < 4.5 && Math.abs(z) < 114) || (Math.abs(Math.abs(z) - 110) < 4.5 && Math.abs(x) < 114));
function stashNat(x, z) {
  const H = STASH_H, nz = STASH_NOISE || (STASH_NOISE = terrNoise(4207));
  const e = Math.min(H - Math.abs(x), H - Math.abs(z)) + nz(x + 900, z - 300, 3, 60) * 7;   // distance to the coast, ragged
  const land = stashSmooth(e / 30), hills = 7 + nz(x, z, 4, 110) * 6 + Math.max(0, nz(x - 400, z + 200, 3, 70)) * 6;
  const peak = 22 * Math.exp(-((x + 72) ** 2 + (z + 64) ** 2) / (2 * 34 * 34));          // Radio Hill
  const ridge = 7 * Math.exp(-((x - 62) ** 2 / (2 * 40 * 40) + (z - 92) ** 2 / (2 * 22 * 22)));   // the bunker ridge
  return -2.5 + land * (2.5 + Math.max(0.6, hills + peak + ridge));
}
let STASH_NOISE = null;
// THE RIVER (1.2.93 follow-up): a lake in the open ground west of OLD TOWN, a river west to the sea south of THE HOTEL
// (found by a path search that keeps clear of every place and building), a bridge where the west road crosses it
const STASH_RIVER = [[-100, -24], [-120, -28], [-152, -28], [-188, -32], [-210, -33]], STASH_LAKE = { x: -100, z: -24, r: 9 };
function stashRiverD(x, z) {
  let d = Math.hypot(x - STASH_LAKE.x, z - STASH_LAKE.z) - STASH_LAKE.r;
  for (let i = 0; i < STASH_RIVER.length - 1; i++) { const [ax, az] = STASH_RIVER[i], [bx, bz] = STASH_RIVER[i + 1], lx = bx - ax, lz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * lx + (z - az) * lz) / (lx * lx + lz * lz))); d = Math.min(d, Math.hypot(x - ax - lx * t, z - az - lz * t)); }
  return d;
}
function stashHeight(x, z) {
  const h = stashHeight0(x, z), rd = stashRiverD(x, z); if (rd >= 17) return h;
  const k = rd < 5 ? 1 : 1 - stashSmooth((rd - 5) / 12); return h + (Math.min(h, -2.6) - h) * k;   // the bed 2.6 m down, banks over 12 m
}
function stashHeight0(x, z) {
  let h = stashNat(x, z);
  const pads = STASH_POIS.concat(STASH_HOUSES.map(([hx, hz]) => ({ x: hx, z: hz, w: 18, d: 15, y: 'nat', b: 7 })), [{ x: DUEL_PEN.stashisle.x, z: DUEL_PEN.stashisle.z, w: 14, d: 18, y: 'nat', b: 5 }]);
  for (const p of pads) {
    const dx = Math.max(0, Math.abs(x - p.x) - p.w / 2), dz = Math.max(0, Math.abs(z - p.z) - p.d / 2), dd = Math.hypot(dx, dz); if (dd >= p.b) continue;
    const py = p.y === 'nat' ? (p._ny !== undefined ? p._ny : (p._ny = stashNat(p.x, p.z))) : p.y;
    h = h + (py - h) * (1 - stashSmooth(dd / p.b));
  }
  for (const r of STASH_RAMPS) {
    const lx = r.bx - r.ax, lz = r.bz - r.az, L = Math.hypot(lx, lz), t = ((x - r.ax) * lx + (z - r.az) * lz) / (L * L), off = Math.abs((x - r.ax) * lz - (z - r.az) * lx) / L;
    if (t < -0.05 || t > 1.05 || off > r.w) continue;
    const y0 = r.y0 === 'nat' ? (r._ny !== undefined ? r._ny : (r._ny = stashNat(r.ax, r.az))) : r.y0, ry = y0 + (r.y1 - y0) * Math.max(0, Math.min(1, t));
    h = h + (ry - h) * (1 - stashSmooth((off - r.w / 2) / (r.w / 2)));
  }
  return h;
}
const stashPoi = id => STASH_POIS.find(p => p.id === id);
function stashColour(x, z, h, slope) {
  const W = typeof isleWinter === 'function' && isleWinter(), n = (STASH_NOISE || terrNoise(4207))(x * 3, z * 3, 2, 8) * 0.06;
  if (h < 0.3) return W ? [0.78, 0.82, 0.86] : [0.78 + n, 0.7 + n, 0.5];                                     // sand (and under the sea)
  if (stashRoad(x, z) && slope < 0.5) return [0.32, 0.32, 0.33];                                            // the roads
  if (slope > 0.6) return [0.46 + n, 0.43 + n, 0.4 + n];                                                    // rock faces
  if (W) return slope > 0.45 ? [0.7, 0.72, 0.76] : [0.93 + n, 0.95 + n, 0.98];
  if (h < 1.6) return [0.72 + n, 0.66 + n, 0.46];                                                            // the beach above the waterline
  const g = Math.min(1, slope * 1.6); return [0.36 + g * 0.18 + n, 0.5 - g * 0.06 + n, 0.24 + g * 0.08];   // grass, browner as it steepens
}
function stashAt(id, fn) { const p = stashPoi(id); BUILD_YOFF = p ? p.y : 0; try { fn(); } finally { BUILD_YOFF = 0; } }
function buildStash() {
  buildMap2Materials(); worksMaterials(); airpMaterials(); isleMaterials();
  if (!MAT.stashGlass) MAT.stashGlass = new THREE.MeshStandardMaterial({ color: C(0xcfeedd), roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
  STASH_LOOT.length = 0; STASH_LADDERS.length = 0; BUILD_YOFF = 0;
  const sr = stashRand(4207), H = STASH_H;
  // ---- the land and the sea
  if (MAT.sea) { MAT.sea.polygonOffset = true; MAT.sea.polygonOffsetFactor = 2; MAT.sea.polygonOffsetUnits = 8; }   // the shallows never flicker through the beach from far up
  terrDefine(stashHeight, H + 24, 2);
  terrBuildMesh(stashColour, H + 24);
  for (const [x, z, w, d] of [[0, -H - 170, 1000, 300], [0, H + 170, 1000, 300], [-H - 170, 0, 300, 1000], [H + 170, 0, 300, 1000], [0, -H + 4, H * 2 + 50, 50], [0, H - 4, H * 2 + 50, 50], [-H + 4, 0, 50, H * 2 - 40], [H - 4, 0, 50, H * 2 - 40]]) floorQuad(x, z, w, d, -0.35, 'sea', 30);   // the sea all round and over the shallows (never under the island itself)
  // the river's water: a ribbon along it and a disc for the lake, at the sea's level
  { const pos = [], idx = []; let n = 0; for (let i = 0; i < STASH_RIVER.length - 1; i++) { const [ax, az] = STASH_RIVER[i], [bx, bz] = STASH_RIVER[i + 1], L = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / L * 11, nz = (bx - ax) / L * 11;
      pos.push(ax + nx, -0.35, az + nz, ax - nx, -0.35, az - nz, bx + nx, -0.35, bz + nz, bx - nx, -0.35, bz - nz); idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); n += 4; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const wm = MAT.sea || MAT.water, rv = new THREE.Mesh(g, wm); rv.receiveShadow = true; scene.add(rv);
    const lk = new THREE.Mesh(new THREE.CircleGeometry(STASH_LAKE.r + 12, 40), wm); lk.rotation.x = -Math.PI / 2; lk.position.set(STASH_LAKE.x, -0.35, STASH_LAKE.z); lk.receiveShadow = true; scene.add(lk);
    // the bridge where the west road crosses
    const ya = stashHeight0(-110, -50), yb = stashHeight0(-110, 2);   // a sloped deck in 2 m pieces (small steps), following the road from bank to bank
    for (let i = 0; i < 26; i++) { const z = -50 + i * 2 + 1, y = ya + (yb - ya) * (i + 0.5) / 26; blk(-110, z, 8, 2.02, 0.5, 'wood', { y: y - 0.5, walk: true }); for (const sd of [-1, 1]) blk(-110 + sd * 3.85, z, 0.2, 2.02, 1.0, 'wood', { y, walk: false }); if (i % 4 === 1) for (const sd of [-1, 1]) blk(-110 + sd * 3.2, z, 0.6, 0.6, y + 2.6, 'concrete', { y: -3.1, walk: false }); } }
  for (const [x, z, w, d] of [[0, -H - 1.5, H * 2 + 6, 3], [0, H + 1.5, H * 2 + 6, 3], [-H - 1.5, 0, 3, H * 2 + 6], [H + 1.5, 0, 3, H * 2 + 6]]) blk(x, z, w, d, 40, 'dark', { noDraw: true, y: -5 });
  /* ======== CENTRE: OLD TOWN, on the rise in the middle of the island */
  const townKeys = ['plaster', 'brick', 'facade', 'plaster', 'brick', 'panel'];
  stashAt('town', () => {
    floorQuad(0, 0, 90, 90, 0.012, 'cobble', 14);
    let ti = 0;
    for (const x of [-30, -10, 10, 30]) for (const z of [-30, -10, 10, 30]) { const big = Math.abs(x) === 30 && Math.abs(z) === 30; stashBld({ x, z, w: big ? 15 : 12, d: big ? 14 : 12, f: big ? 3 : (ti % 3 === 0 ? 1 : 2), key: townKeys[ti % townKeys.length], doors: [z < 0 ? 's' : 'n', x < 0 ? 'e' : 'w'], seed: 100 + ti }); ti++; }
    CYL('stone', 1.6, 1.8, 1.0, 16, 0, 0.5, 0); PZ(0, 0, 0, 3.4, 1.0, 3.4); CYL('stone', 0.4, 0.5, 3.4, 10, 0, 2.2, 0);
  });
  /* ======== N: THE SCHOOL, on the north hill */
  stashAt('school', () => {
    floorQuad(0, -140, 70, 40, 0.012, 'concrete', 10);
    stashBld({ x: 0, z: -146, w: 44, d: 16, f: 2, key: 'brick', doors: ['s', 'e', 'w'], seed: 7 });
    stashHall({ x: -30, z: -124, w: 18, d: 14, h: 6.5, key: 'brick', roofKey: 'dark', floor: 'wood' });
    for (const x of [8, 18]) blk(x, -126, 0.15, 3, 3, 'steel', { walk: false });
  });
  /* ======== NW: GREENHOUSE ROW */
  stashAt('green', () => {
    floorQuad(-132, -112, 66, 52, 0.012, 'concrete', 10);
    for (const x of [-150, -138, -126, -114]) stashGreenhouse(x, -128, 7, 24);
    stashBld({ x: -132, z: -100, w: 26, d: 12, f: 2, key: 'panel', doors: ['n', 's'], seed: 21 });
    for (let i = 0; i < 4; i++) stashContainer(-160 + i * 3, -100, false, i % 2 ? 'paintGreen' : 'rustIron');
  });
  /* ======== RADIO HILL: the top of the island */
  stashAt('radio', () => {
    floorQuad(-72, -64, 18, 16, 0.012, 'concrete', 4);
    stashBld({ x: -72, z: -64, w: 10, d: 8, f: 1, key: 'concrete', doors: ['s'], seed: 31 });
    CYL('steel', 0.15, 0.25, 22, 6, -66, 11, -69.5, 0, 0, 0, false); PZ(-66, 0, -69.5, 0.6, 22, 0.6);
  });
  /* ======== NE: THE REFINERY by the shore, THE LIGHTHOUSE on its headland */
  stashAt('refinery', () => {
    floorQuad(125, -122, 74, 62, 0.012, 'concrete', 10);
    for (const [x, z] of [[105, -140], [122, -142], [139, -140]]) stashTank(x, z, 6, 9);
    stashHall({ x: 128, z: -112, w: 30, d: 18, h: 8, key: 'panel' });
    stashBld({ x: 96, z: -112, w: 12, d: 10, f: 2, key: 'concrete', doors: ['s', 'e'], seed: 41 });
    for (let i = 0; i < 6; i++) beam('rustIron', 105 + i * 6, 6.5, -134, 105 + i * 6, 6.5, -120, 0.25, 0.25, false);
  });
  stashAt('light', () => {
    stashBld({ x: 168, z: -170, w: 9, d: 9, f: 3, key: 'plaster', doors: ['s'], seed: 51, roofKey: 'redBarn' });
    CYL('paintWhite', 3.2, 3.6, 14, 16, 176, 7, -178); PZ(176, 0, -178, 7, 14, 7); CYL('redBarn', 3.25, 3.25, 1.4, 16, 176, 10, -178, 0, 0, 0, false); CYL('glass', 2.2, 2.2, 2.2, 12, 176, 15.1, -178, 0, 0, 0, false);
    STASH_LADDERS.push({ x: 179.5, z: -178, nx: 1, nz: 0, y1: +(BUILD_YOFF + 14.02).toFixed(2) });   // up the tower to the gallery
  });
  /* ======== W: THE HOTEL on the west shore */
  stashAt('hotel', () => {
    floorQuad(-156, 20, 46, 66, 0.012, 'concrete', 10);
    stashBld({ x: -170, z: 20, w: 12, d: 40, f: 2, key: 'plaster', doors: ['e', 'w'], seed: 61 });
    stashBld({ x: -149, z: -6, w: 30, d: 12, f: 2, key: 'plaster', doors: ['s', 'n'], seed: 62 });
    stashBld({ x: -149, z: 46, w: 30, d: 12, f: 2, key: 'plaster', doors: ['n', 's'], seed: 63 });
    blk(-148, 20, 16, 10, 0.4, 'whiteTile', { walk: true }); floorQuad(-148, 20, 14.6, 8.6, 0.42, 'water', 2);
    for (const z of [10, 30]) for (const x of [-156, -140]) blk(x, z, 2.2, 0.8, 0.5, 'paintWhite', { walk: true });
  });
  /* ======== E: THE CELLAR dug into the foot of the cliff, THE ESTATE on top */
  stashAt('cellar', () => {
    const EH = 5;
    for (const [ax, az, bx, bz, holes] of [[122, -5, 140, -5, []], [122, 45, 140, 45, []], [122, -5, 122, 45, [{ at: 25, w: 4, b: 0, h: 3 }, { at: 8, w: 1.8, b: 0, h: 2.4 }, { at: 42, w: 1.8, b: 0, h: 2.4 }]], [140, -5, 140, 45, []]]) wall(ax, az, bx, bz, EH, 'rock', { t: 1, holes });
    slab(131, 20, 18.6, 50.6, EH, 'rock', 0.4);
    wall(131, -5, 131, 45, EH - 0.4, 'concrete', { t: 0.3, holes: [{ at: 25, w: 3, b: 0, h: 3 }, { at: 9, w: 1.8, b: 0, h: 2.3 }, { at: 41, w: 1.8, b: 0, h: 2.3 }] });
    for (const z of [7, 33]) { wall(131, z, 140, z, EH - 0.4, 'concrete', { t: 0.3, holes: [{ at: 4.5, w: 1.8, b: 0, h: 2.3 }] }); wall(122, z, 131, z, EH - 0.4, 'concrete', { t: 0.3, holes: [{ at: 4.5, w: 1.8, b: 0, h: 2.3 }] }); }
    floorQuad(131, 20, 17.4, 49.4, 0.012, 'concrete', 6);
    for (const [x, z] of [[126, 0], [136, 2], [126, 40], [136, 38], [135, 20], [127, 16]]) { blk(x, z, 1.6, 1.0, 1.0, 'dark', { walk: false }); STASH_LOOT.push({ x: x + 1.6, z: z + 1.2, y: 0.01, q: 2 }); }
    blk(141.75, 20, 3.5, 54, EH, 'rock', { walk: true, tile: 4 });   // fills the gap between the cellar roof and the cliff top
  });
  stashAt('estate', () => {
    floorQuad(164, 20, 40, 52, 0.012, 'stone', 8);
    stashBld({ x: 162, z: 6, w: 26, d: 18, f: 2, key: 'plaster', doors: ['s', 'w'], seed: 71, floor: 'wood' });
    floorQuad(158, 30, 12, 7, 0.02, 'water', 2); for (const x of [150, 166]) blk(x, 36, 2, 0.8, 0.5, 'paintWhite', { walk: true });
  });
  /* ======== SW: THE FARM in the valley */
  stashAt('farm', () => {
    stashHall({ x: -140, z: 132, w: 24, d: 16, h: 7.5, key: 'redBarn', roofKey: 'dark', floor: 'soil' });
    for (const z of [118, 130]) { CYL('rustIron', 3, 3, 11, 16, -115, 5.5, z); PZ(-115, 0, z, 6, 11, 6); }
    stashBld({ x: -166, z: 160, w: 13, d: 11, f: 2, key: 'plaster', doors: ['n', 'e'], seed: 81 });
    for (let i = 0; i < 10; i++) blk(-150 + (i % 5) * 7, 168 + ((i / 5) | 0) * 6, 1.6, 1.2, 1.2, 'hay', { walk: true });
  });
  /* ======== S: THE DOCKS on the water */
  stashAt('docks', () => {
    floorQuad(0, 165, 126, 42, 0.012, 'concrete', 10);
    stashHall({ x: -32, z: 160, w: 28, d: 18, h: 8, key: 'panel' }); stashHall({ x: 30, z: 160, w: 28, d: 18, h: 8, key: 'rustIron', roofKey: 'dark' });
    for (let i = 0; i < 4; i++) { stashContainer(-6 + (i % 2) * 7, 150 + ((i / 2) | 0) * 8, false, ['paintBlue', 'rustIron', 'paintGreen', 'paintRed'][i]); blk(-6 + (i % 2) * 7, 150 + ((i / 2) | 0) * 8, 2.5, 6, 2.6, ['paintRed', 'paintBlue'][i % 2], { y: 2.6, walk: true }); }
    stairs(1, 147 - Math.ceil(5.2 / 0.27) * 0.42, 's', 1.2, 0, 5.2, 'steel', { open: true });
    for (const x of [-60, 60]) blk(x, 192, 6, 22, 0.6, 'wood', { walk: true, y: -0.4 });
  });
  /* ======== SE: THE QUARRY: a pit cut into the high ground, terraces stepping down its north side */
  stashAt('quarry', () => {
    for (const [z, top] of [[126, 6], [132, 4.5], [138, 3], [144, 1.5]]) blk(128, z, 56, 6, top, 'rock', { walk: true, tile: 6 });
    for (const [e, y0] of [[147, 0], [141, 1.5], [135, 3], [129, 4.5]]) stairs(103, e + Math.ceil(1.5 / 0.27) * 0.42, 'n', 2, y0, y0 + 1.5, 'rock');
    floorQuad(128, 158, 56, 28, 0.015, 'stone', 8);
    for (const [x, z] of [[118, 156], [138, 164], [126, 168]]) stashRock(x, z, 1.8, 2.2);
  });
  stashAt('quarryRim', () => stashBld({ x: 100, z: 112, w: 12, d: 10, f: 2, key: 'panel', doors: ['s', 'e'], seed: 91 }));
  /* ======== THE POWER STATION and THE BUNKERS on their ridge */
  stashAt('power', () => {
    floorQuad(-66, 100, 66, 52, 0.012, 'concrete', 10);
    stashHall({ x: -62, z: 92, w: 30, d: 18, h: 9, key: 'concrete', roofKey: 'dark' });
    CYL('concrete', 9, 7, 18, 24, -90, 9, 120); PZ(-90, 0, 120, 16, 18, 16);
    for (let i = 0; i < 6; i++) blk(-48 + (i % 3) * 5, 116 + ((i / 3) | 0) * 5, 2.2, 2.2, 2.6, 'dark', { walk: true });
  });
  stashAt('bunkers', () => {
    for (const [x, z] of [[52, 80], [72, 80], [52, 100], [72, 100]]) stashBld({ x, z, w: 12, d: 8, f: 1, key: 'concrete', doors: [z < 90 ? 's' : 'n'], seed: (x + z) | 0, roofKey: 'concrete' });
    for (const [x, z, w, al] of [[62, 70, 18, true], [62, 110, 18, true], [42, 90, 14, false], [82, 90, 14, false]]) stashSandbags(x, z, w, al);
  });
  /* ======== loot outside, where a stash would be: by the containers, in the greenhouses, on the hay, by the tanks, in the
     sandbag nests, on the terraces, on the container stacks and the piers ([place, x, z, height above it, quality]) */
  for (const [id, x, z, y, q] of [['school', 10, -124, 0, 0], ['green', -150, -128, 0, 0], ['green', -138, -120, 0, 0], ['green', -126, -136, 0, 0], ['green', -114, -128, 0, 0], ['green', -158.5, -100, 2.6, 1],
    ['radio', -66, -66.5, 0, 1], ['refinery', 111, -132, 0, 0], ['refinery', 128, -134, 0, 0], ['light', 176, -172, 0, 2], ['hotel', -156, 11, 0, 0], ['hotel', -140, 29, 0, 0],
    ['estate', 158, 35, 0, 1], ['estate', 180, 40, 0, 1], ['farm', -150, 168, 1.2, 0], ['farm', -129, 174, 1.2, 0], ['farm', -111, 124, 0, 1], ['docks', 1, 150, 5.2, 1], ['docks', -2.5, 154, 0, 0],
    ['docks', -60, 194, 0.2, 0], ['docks', 60, 194, 0.2, 0], ['quarry', 116, 126, 6, 1], ['quarry', 140, 132, 4.5, 0], ['quarry', 150, 144, 1.5, 0], ['quarry', 128, 166, 0, 0],
    ['power', -44, 113, 0, 1], ['power', -79, 120, 0, 0], ['bunkers', 62, 72.5, 0, 0], ['bunkers', 44.5, 90, 0, 0], ['bunkers', 80, 90, 0, 1]]) stashAt(id, () => STASH_LOOT.push({ x, z, y, q }));
  /* ======== houses along the roads, each on its own little level patch */
  STASH_HOUSES.forEach(([x, z, f], i) => { BUILD_YOFF = stashNat(x, z); stashBld({ x, z, w: 12, d: 9, f, key: townKeys[(i + 2) % townKeys.length], doors: ['s', 'n'], seed: 200 + i }); BUILD_YOFF = 0; });
  /* ======== trees and rocks on the open hills (not on roads, places or steep faces) */
  for (let i = 0, n = 0; i < 3000 && n < 170; i++) {
    const x = (sr() - 0.5) * (H * 2 - 30), z = (sr() - 0.5) * (H * 2 - 30); if (stashBusy(x, z, 4)) continue;
    const h = TH(x, z), sl = Math.hypot(TH(x + 1, z) - TH(x - 1, z), TH(x, z + 1) - TH(x, z - 1)) / 2; if (h < 1.5 || sl > 0.45) continue; n++;
    BUILD_YOFF = h - 0.1; if (sr() < 0.75) tree(x, z, sr() < 0.08, 0.9 + sr() * 0.5); else stashRock(x, z, 1.2 + sr() * 1.6, 1.4 + sr() * 2); BUILD_YOFF = 0;
  }
  BUILD_YOFF = stashNat(DUEL_PEN.stashisle.x, DUEL_PEN.stashisle.z); try { duelBuild(DUEL_PEN.stashisle); } catch (e) {} BUILD_YOFF = 0;
  // jump pads and ziplines, at the heights of where they are now
  const gy = (x, z) => TH(x, z), roofY = (id, f) => stashPoi(id).y + f * STASH_H3;
  MOVERS.stashisle = {
    pads: [{ x: 104, z: 6, y: gy(104, 6), to: { x: 146, y: 14, z: 24 } }, { x: 128, z: 162, y: 9, to: { x: 128, y: 15, z: 116 } }, { x: -92, z: -40, y: gy(-92, -40), to: { x: -63.5, y: 26, z: -62 } }],
    zips: [{ a: { x: 18, y: roofY('school', 2) + 1.9, z: -142 }, b: { x: 46, y: gy(46, -104) + 2.6, z: -104 } }, { a: { x: 170, y: roofY('estate', 2) + 1.9, z: 10 }, b: { x: 112, y: gy(112, 46) + 2.6, z: 46 } }, { a: { x: -70, y: roofY('radio', 1) + 1.9, z: -64 }, b: { x: -40, y: gy(-40, -20) + 2.6, z: -20 } }],
  };
  try { moversMaterials(); moversBuild('stashisle'); } catch (e) {}
}
// where the trees, rocks and grass don't go
const STASH_PLACES = [[0, 0, 50], [0, -140, 40], [-132, -112, 38], [-72, -64, 14], [125, -122, 42], [172, -176, 18], [-158, 20, 30], [123, 20, 22], [164, 20, 24], [-140, 142, 40], [0, 165, 68], [128, 146, 48], [-66, 100, 36], [62, 90, 30]];
function stashBusy(x, z, m = 0) {
  if (stashRiverD(x, z) < 18 + m) return true;   // the river and the lake
  if (Math.abs(x) < 6 + m || Math.abs(z) < 6 + m || Math.abs(Math.abs(x) - 110) < 6 + m || Math.abs(Math.abs(z) - 110) < 6 + m) return true;
  if (Math.abs(x) > STASH_H - 12 || Math.abs(z) > STASH_H - 12) return true;
  if (STASH_PLACES.some(([px, pz, r]) => Math.abs(x - px) < r + m && Math.abs(z - pz) < r + m)) return true;
  if (STASH_HOUSES.some(([hx, hz]) => Math.abs(x - hx) < 10 + m && Math.abs(z - hz) < 9 + m)) return true;
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
  m.grass = { count: 16000, avoid: (x, z) => stashBusy(x, z, 1) || TH(x, z) < 1.4 || Math.hypot(TH(x + 1, z) - TH(x - 1, z), TH(x, z + 1) - TH(x, z - 1)) > 1.1 };
})();
