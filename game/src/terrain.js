/* ================================================================== TERRAIN (1.2.90): real hills, valleys and cliffs
   A height field for maps that want one (STASH ISLAND): a grid of heights every TERR.cs metres, smooth between points.
   Off (TERR.on false) on every other map, so they stay exactly as they were.
   - groundAt() starts from the terrain height instead of 0, so players, bots, crates and everything that stands on the
     ground follow the hills; buildNav() uses it as the bottom floor of every cell.
   - terrSlope(): nothing walks or drives up a slope steeper than ~42 degrees (cliffs): it slides along it instead.
     Bots path round cliffs on their own (the nav steps are limited the same way).
   - The ground is drawn as one mesh (grass, dirt, rock on steep faces, sand by the sea, the roads painted on) and is
     added to the ray chunks, so hills block bullets and sight.
   - BUILD_YOFF: while a map is being built, everything placed (blocks, colliders, batches, rays, props, lights) is
     raised by this much, so a place can be built at its own height without changing its numbers. */
const TERR = { on: false, cs: 2, n: 0, x0: 0, z0: 0, h: null, mesh: null };
let BUILD_YOFF = 0;
function TH(x, z) {
  if (!TERR.on) return 0;
  const fx = (x - TERR.x0) / TERR.cs, fz = (z - TERR.z0) / TERR.cs, n = TERR.n;
  const ix = Math.max(0, Math.min(n - 2, Math.floor(fx))), iz = Math.max(0, Math.min(n - 2, Math.floor(fz))), tx = Math.max(0, Math.min(1, fx - ix)), tz = Math.max(0, Math.min(1, fz - iz));
  const h = TERR.h, a = h[iz * n + ix], b = h[iz * n + ix + 1], c = h[(iz + 1) * n + ix], d = h[(iz + 1) * n + ix + 1];
  return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
}
function terrOff() { TERR.on = false; TERR.h = null; if (TERR.mesh) { scene.remove(TERR.mesh); TERR.mesh.geometry.dispose(); TERR.mesh = null; } }
// fill the grid from fn(x, z) over [-half, half] (a little beyond, for the sea floor)
function terrDefine(fn, half, cs = 2) {
  const n = Math.ceil(half * 2 / cs) + 1; TERR.cs = cs; TERR.n = n; TERR.x0 = -half; TERR.z0 = -half; TERR.h = new Float32Array(n * n);
  for (let iz = 0; iz < n; iz++) for (let ix = 0; ix < n; ix++) TERR.h[iz * n + ix] = fn(-half + ix * cs, -half + iz * cs);
  TERR.on = true;
}
// a seeded value noise and a few octaves of it
function terrNoise(seed) {
  const hash = (x, z) => { let h = (x * 374761393 + z * 668265263 + seed * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const sm = t => t * t * (3 - 2 * t);
  const v = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = sm(x - ix), fz = sm(z - iz); const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1); return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz; };
  return (x, z, oct = 4, base = 120) => { let s = 0, amp = 1, tot = 0, f = 1 / base; for (let i = 0; i < oct; i++) { s += (v(x * f, z * f) * 2 - 1) * amp; tot += amp; amp *= 0.5; f *= 2; } return s / tot; };
}
// the slope rule: called with the position before the move
function terrSlope(pos, ox, oz, feetY) {
  if (!TERR.on) return;
  const d = Math.hypot(pos.x - ox, pos.z - oz); if (d < 1e-5 || d > 2) return;   // not moving, or a teleport
  const hn = TH(pos.x, pos.z); if (hn <= feetY + 0.03 || (feetY < hn - 2.5 && typeof briUnder === 'function' && briUnder(pos.x, pos.z))) return;   // (under the ground: the tunnels)   // not climbing the terrain (going down, or on a floor above it)
  const ho = Math.max(TH(ox, oz), feetY - 0.05), steep = (h, dd) => dd > 1e-5 && (h - ho) / dd > 0.9 && h > feetY + 0.03;
  if (!steep(hn, d)) return;
  const hx = TH(pos.x, oz), hz = TH(ox, pos.z);
  if (!steep(hx, Math.abs(pos.x - ox))) pos.z = oz; else if (!steep(hz, Math.abs(pos.z - oz))) pos.x = ox; else { pos.x = ox; pos.z = oz; }
}
/* the ground mesh: colours by height, slope and the map's own paint (roads etc.); colourFn(x, z, h, slope) -> [r, g, b] */
function terrBuildMesh(colourFn, half) {
  const n = TERR.n, cs = TERR.cs, pos = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), idx = [];
  for (let iz = 0; iz < n; iz++) for (let ix = 0; ix < n; ix++) {
    const i = iz * n + ix, x = TERR.x0 + ix * cs, z = TERR.z0 + iz * cs, h = TERR.h[i];
    const sx = (TERR.h[iz * n + Math.min(n - 1, ix + 1)] - TERR.h[iz * n + Math.max(0, ix - 1)]) / (2 * cs), sz = (TERR.h[Math.min(n - 1, iz + 1) * n + ix] - TERR.h[Math.max(0, iz - 1) * n + ix]) / (2 * cs);
    const c = colourFn(x, z, h, Math.hypot(sx, sz));
    pos[i * 3] = x; pos[i * 3 + 1] = h; pos[i * 3 + 2] = z; col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; uv[i * 2] = x / 6; uv[i * 2 + 1] = z / 6;
  }
  for (let iz = 0; iz < n - 1; iz++) for (let ix = 0; ix < n - 1; ix++) { const a = iz * n + ix, b = a + 1, c = a + n, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const set = TEX.ground || TEX.concrete, mat = new THREE.MeshStandardMaterial({ map: set.map, vertexColors: true, roughness: 0.95, metalness: 0 });
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.castShadow = false; scene.add(m); TERR.mesh = m;
  // the same ground for bullets and sight, cut into 16 m pieces (the ray chunks)
  const step = 8; for (let iz = 0; iz < n - 1; iz += step) for (let ix = 0; ix < n - 1; ix += step) {
    const ex = Math.min(n - 1, ix + step), ez = Math.min(n - 1, iz + step), p = [], ii = []; let k = 0;
    for (let z = iz; z <= ez; z++) for (let x = ix; x <= ex; x++) { const i = z * n + x; p.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); }
    const w = ex - ix + 1; for (let z = 0; z < ez - iz; z++) for (let x = 0; x < ex - ix; x++) { const a = z * w + x; ii.push(a, a + w, a + 1, a + 1, a + w, a + w + 1); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); rg.setIndex(ii);
    const cx = TERR.x0 + (ix + step / 2) * cs, cz = TERR.z0 + (iz + step / 2) * cs; rg.translate(-cx, 0, -cz);
    const sv = BUILD_YOFF; BUILD_YOFF = 0; rayAdd(rg, new THREE.Matrix4().makeTranslation(cx, 0, cz)); BUILD_YOFF = sv;
  }
}
