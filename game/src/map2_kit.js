/* ================================================================== shared helpers for the 2026 map set
   symZ: build the north and south halves the same way (z mirrored, stair directions flipped) so both teams get
   identical routes. deck: a raised floor with optional posts and rails. Extra materials: snow, ice, carpet, sheet
   metal, dark glass, white tile. */
const FLIPZ = { n: 's', s: 'n', e: 'e', w: 'w' };
function symZ(fn) { for (const s of [1, -1]) fn(s, z => z * s, d => (s > 0 ? d : FLIPZ[d])); }
// raised floor whose top is at `top`; o.rails: list of sides 'n','s','e','w' to fence; o.posts: legs down to the ground
function deck(x, z, w, d, top, key = 'metal', o = {}) {
  slab(x, z, w, d, top, key, o.th || 0.25);
  if (o.posts) for (const [px, pz] of [[x - w / 2 + 0.2, z - d / 2 + 0.2], [x + w / 2 - 0.2, z - d / 2 + 0.2], [x - w / 2 + 0.2, z + d / 2 - 0.2], [x + w / 2 - 0.2, z + d / 2 - 0.2]]) blk(px, pz, 0.25, 0.25, top - (o.th || 0.25), o.postKey || 'steel', { walk: false });
  const R = { n: [x - w / 2, z - d / 2, x + w / 2, z - d / 2], s: [x - w / 2, z + d / 2, x + w / 2, z + d / 2], w: [x - w / 2, z - d / 2, x - w / 2, z + d / 2], e: [x + w / 2, z - d / 2, x + w / 2, z + d / 2] };
  for (const sd of o.rails || []) { const [a, b, c, e] = R[sd]; rail(a, b, c, e, top, { h: 1.0 }); }
}
// an open-sided lean-to roof on posts (shade over market stalls, gates, fuel stands); no collision on the roof
function canopy(x, z, w, d, h, key = 'awningRed') {
  B(key, w, 0.08, d, x, h, z, 0, 0, 0, true);
  for (const [px, pz] of [[x - w / 2 + 0.1, z - d / 2 + 0.1], [x + w / 2 - 0.1, z - d / 2 + 0.1], [x - w / 2 + 0.1, z + d / 2 - 0.1], [x + w / 2 - 0.1, z + d / 2 - 0.1]]) { B('dark', 0.08, h, 0.08, px, h / 2, pz); PZ(px, 0, pz, 0.12, h, 0.12); }
}
// a walkable flat roof (top at `top`) over x0..x1, z0..z1 with a parapet; gaps: [[side, world coordinate along the side, width]]
function flatRoof(x0, z0, x1, z1, top, key = 'concrete', pkey = 'plaster', gaps = [], ph = 0.8) {
  slab((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, top, key, 0.25);
  const sides = { n: [x0, z0, x1, z0, x0], s: [x0, z1, x1, z1, x0], w: [x0, z0, x0, z1, z0], e: [x1, z0, x1, z1, z0] };
  for (const sd of ['n', 's', 'w', 'e']) {
    const [a, b, c, e, st] = sides[sd];
    wall(a, b, c, e, ph, pkey, { y: top, t: 0.3, holes: gaps.filter(g => g[0] === sd).map(g => ({ at: g[1] - st, w: g[2], b: 0, h: ph })) });
  }
}
// a date palm (trunk collider only; same on every machine)
function palm(x, z, h = 6, lean = 0) {
  CYL('bark', 0.14, 0.22, h, 8, x, h / 2, z, 0, 0, lean);
  const tx = x - Math.sin(lean) * h;
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.3, ex = tx + Math.cos(a) * 1.4, ez = z + Math.sin(a) * 1.4; beam('leaf', tx, h, z, ex, h + 0.15, ez, 0.55, 0.05, false); beam('leaf', ex, h + 0.15, ez, tx + Math.cos(a) * 2.6, h - 0.9, z + Math.sin(a) * 2.6, 0.45, 0.05, false); }
  PZ(x, 0, z, 0.45, h, 0.45);
}
function buildMap2Materials() {
  if (MAT.snow) return;
  const std = (set, o) => new THREE.MeshStandardMaterial(Object.assign({ map: set.map, bumpMap: set.bump, bumpScale: 0.02, roughness: 0.95, metalness: 0 }, o));
  MAT.snow = std(TEX.concrete, { color: C(0xf4f7fa), roughness: 0.9, bumpScale: 0.035 });
  MAT.ice = new THREE.MeshStandardMaterial({ color: C(0xbfdcea), roughness: 0.15, metalness: 0.05 });
  MAT.carpet = std(TEX.concrete, { color: C(0x3d4a5c), roughness: 1, bumpScale: 0.01 });
  MAT.sheet = std(TEX.metal, { color: C(0xa9b0b5), roughness: 0.5, metalness: 0.6, bumpScale: 0.004 });
  MAT.glassDark = new THREE.MeshStandardMaterial({ color: C(0x2a3a48), roughness: 0.05, metalness: 0.6, envMapIntensity: 1.6 });
  MAT.whiteTile = std(TEX.concrete, { color: C(0xe8eaec), roughness: 0.45, bumpScale: 0.005 });
  MAT.mud = std(TEX.concrete, { color: C(0x8a6a48), roughness: 1, bumpScale: 0.03 });
  MAT.hay = std(TEX.wood, { color: C(0xd8b860), roughness: 1 });
  MAT.redBarn = std(TEX.wood, { color: C(0x9c3a2c), roughness: 0.9 });
}
