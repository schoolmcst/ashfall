/* ================================================================== maps: registry, loader and the building kit
   Each map registers { id, name, place, desc, build(), layout, env, menu }. loadMap() tears the old one down (meshes,
   colliders, barrels, fires, nav) and builds the new one. Shared modes read LAYOUT (spawns, hardpoints, flags, sites). */
const MAPS = {}, MAP_ORDER = [];
let curMap = null, worldObjs = [];
function defineMap(m) { MAPS[m.id] = m; MAP_ORDER.push(m.id); }
const mapName = id => (MAPS[id] || MAPS.ruins).name;

/* ---------- invisible merged meshes for bullets and line of sight (chunked so rays can skip far chunks) */
const RAYC = new Map(), RAY_CHUNK = 16;
function rayAdd(geo, matrix) {
  const e = new THREE.Vector3().setFromMatrixPosition(matrix), k = Math.floor(e.x / RAY_CHUNK) + ',' + Math.floor(e.z / RAY_CHUNK);
  if (!RAYC.has(k)) RAYC.set(k, []);
  RAYC.get(k).push({ g: geo, m: matrix });
}
function rayFlush() {
  for (const [k, list] of RAYC) {
    const pos = [], idx = []; let base = 0;
    for (const p of list) { const g = p.g.clone(); g.applyMatrix4(p.m); const a = g.attributes.position.array; for (let i = 0; i < a.length; i++) pos.push(a[i]); if (g.index) for (const i of g.index.array) idx.push(i + base); base += a.length / 3; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, proxyMat); m.visible = false; m.userData.ray = true; scene.add(m); wallMeshes.push(m);
  }
  RAYC.clear();
}

/* ---------- the kit (y = height of the bottom; everything is axis-aligned so colliders match) */
// solid block: drawn in the merged batches, collides, stops bullets
function blk(x, z, w, d, h, key, o = {}) {
  const y = o.y || 0, m = mat4(x, y + h / 2, z);
  if (!o.noDraw) batchAdd(key, scaledBox(w, h, d, o.tile || TILES[key] || 2, Math.random(), Math.random()), m, o.shadow !== false);
  if (!o.noCol) boxes.push(mkBox(x, z, w, d, h, o));
  if (!o.noRay) rayAdd(new THREE.BoxGeometry(w, h, d), m);
}
// floor slab whose top is at `top`
function slab(x, z, w, d, top, key = 'concrete', th = 0.3, o = {}) { blk(x, z, w, d, th, key, Object.assign({ y: top - th, walk: true }, o)); }
// a wall from (x0,z0) to (x1,z1) (must be axis-aligned), height h from y, thickness t, with openings:
// holes: [{ at: distance from start to the opening's centre, w, b: sill height, h: opening height }]
function wall(x0, z0, x1, z1, h, key, o = {}) {
  const t = o.t || 0.4, y = o.y || 0, alongX = Math.abs(z1 - z0) < 0.01, L = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
  const sx = alongX ? Math.sign(x1 - x0) || 1 : 0, sz = alongX ? 0 : Math.sign(z1 - z0) || 1;
  const piece = (a, b, y0, y1) => { if (b - a < 0.05 || y1 - y0 < 0.05) return; const c = (a + b) / 2; blk(x0 + sx * c, z0 + sz * c, alongX ? b - a : t, alongX ? t : b - a, y1 - y0, key, Object.assign({}, o, { y: y + y0, walk: false })); };
  const holes = (o.holes || []).slice().sort((a, b) => a.at - b.at);
  let a = 0;
  for (const hl of holes) {
    const h0 = hl.at - hl.w / 2, h1 = hl.at + hl.w / 2;
    piece(a, h0, 0, h);
    piece(h0, h1, 0, hl.b || 0);                         // sill
    piece(h0, h1, (hl.b || 0) + hl.h, h);                // lintel
    if (hl.b > 0.5 && hl.h < 2 && o.glass !== false) {   // window: clear glass you can see through, but it stops bullets
      const c = hl.at, gm = mat4(x0 + sx * c, y + hl.b + hl.h / 2, z0 + sz * c), gw = alongX ? hl.w : 0.04, gd = alongX ? 0.04 : hl.w;
      batchAdd('windowGlass', new THREE.BoxGeometry(gw, hl.h, gd), gm, false); rayAdd(new THREE.BoxGeometry(gw, hl.h, gd), gm);
      boxes.push(mkBox(x0 + sx * c, z0 + sz * c, alongX ? hl.w : 0.1, alongX ? 0.1 : hl.w, hl.h, { y: y + hl.b, walk: false }));
      batchAdd('dark', new THREE.BoxGeometry(alongX ? hl.w + 0.06 : 0.08, 0.05, alongX ? 0.08 : hl.w + 0.06), mat4(x0 + sx * c, y + hl.b + hl.h / 2, z0 + sz * c), false);   // a frame bar
    }
    a = h1;
  }
  piece(a, L, 0, h);
}
// stairs going up from y0 to y1, starting at (x, z) (bottom edge, centre) and climbing toward dir: 'n' -z, 's' +z, 'e' +x, 'w' -x
const DIRV = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
function stairs(x, z, dir, w, y0, y1, key = 'concrete', o = {}) {
  const [dx, dz] = DIRV[dir], n = Math.max(1, Math.ceil((y1 - y0) / 0.27)), rise = (y1 - y0) / n, run = o.run || 0.42, L = n * run;
  // colliders: one box per step (solid down to y0, or a thin tread for open stairs)
  for (let i = 0; i < n; i++) {
    const c = (i + 0.5) * run, top = y0 + rise * (i + 1), base = o.open ? top - 0.22 : y0;
    blk(x + dx * c, z + dz * c, dx ? run : w, dx ? w : run, top - base, key, { y: base, walk: true, stair: dir, noDraw: true });
  }
  const sx = -dz, sz = dx;   // sideways (to the right of the climb direction)
  if (o.open) {   // steel stairs: thin treads on two sloped stringers
    const treads = [];
    for (let i = 0; i < n; i++) { const c = (i + 0.5) * run, top = y0 + rise * (i + 1); treads.push({ g: new THREE.BoxGeometry(dx ? run - 0.04 : w, 0.05, dx ? w : run - 0.04), m: mat4(x + dx * c, top - 0.025, z + dz * c) }); }
    batchAdd(key, mergeGeos(treads));
    for (const s of [-1, 1]) beam(key, x + sx * s * w / 2, y0 - 0.05, z + sz * s * w / 2, x + dx * L + sx * s * w / 2, y1 - 0.05, z + dz * L + sz * s * w / 2, 0.07, 0.3);
  } else {        // solid flight: one sawtooth piece with proper sides
    const sh = new THREE.Shape(); sh.moveTo(0, 0);
    for (let i = 0; i < n; i++) { sh.lineTo(i * run, (i + 1) * rise); sh.lineTo((i + 1) * run, (i + 1) * rise); }
    sh.lineTo(L, 0); sh.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false, steps: 1 });
    const uv = g.attributes.uv.array, tl = o.tile || 1.5; for (let k = 0; k < uv.length; k++) uv[k] /= tl;
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(dx, 0, dz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-dz, 0, dx));
    m.setPosition(x - (-dz) * w / 2, y0, z - dx * w / 2);
    batchAdd(key, g, m);
  }
  if (o.rails !== false) for (const s of [-1, 1]) {   // handrails with a post at each end
    const ox = sx * s * (w / 2 - 0.04), oz = sz * s * (w / 2 - 0.04), a = run * 0.5, b = L - run * 0.5;
    beam(o.railKey || 'dark', x + dx * a + ox, y0 + rise + 0.95, z + dz * a + oz, x + dx * b + ox, y1 + 0.95, z + dz * b + oz, 0.05, 0.05, false);
    for (const [c, hgt] of [[a, y0 + rise], [b, y1]]) batchAdd(o.railKey || 'dark', new THREE.BoxGeometry(0.05, 0.95, 0.05), mat4(x + dx * c + ox, hgt + 0.475, z + dz * c + oz), false);
    if (L > 3) { const c = L / 2, hgt = y0 + rise * Math.ceil(n / 2); batchAdd(o.railKey || 'dark', new THREE.BoxGeometry(0.05, 0.95, 0.05), mat4(x + dx * c + ox, hgt + 0.475, z + dz * c + oz), false); }
  }
  return { x: x + dx * L, z: z + dz * L, len: L };
}
// a box stretched between two points (beams, stringers, handrails, pipes); w sideways, h up
function beamMatrix(ax, ay, az, bx, by, bz) {
  const f = new THREE.Vector3(bx - ax, by - ay, bz - az), L = f.length(); f.divideScalar(L || 1);
  const sd = new THREE.Vector3(0, 1, 0).cross(f); if (sd.lengthSq() < 1e-6) sd.set(1, 0, 0); sd.normalize();
  const up = new THREE.Vector3().crossVectors(f, sd);
  const m = new THREE.Matrix4().makeBasis(sd, up, f); m.setPosition((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  return { m, L };
}
function beam(key, ax, ay, az, bx, by, bz, w, h, shadow = true, tile) {
  const { m, L } = beamMatrix(ax, ay, az, bx, by, bz);
  batchAdd(key, tile ? scaledBox(w, h, L, tile) : new THREE.BoxGeometry(w, h, L), m, shadow);
  return { m, L };
}
// a smooth ramp (drawn as a slope, collides as fine invisible steps)
function ramp(x, z, dir, w, len, y0, y1, key = 'concrete', o = {}) {
  const [dx, dz] = DIRV[dir], n = Math.max(2, Math.ceil(Math.abs(y1 - y0) / 0.12)), run = len / n, rise = (y1 - y0) / n;
  for (let i = 0; i < n; i++) { const c = (i + 0.5) * run, top = y0 + rise * (i + 1); boxes.push(mkBox(x + dx * c, z + dz * c, dx ? run : w, dx ? w : run, top - (o.base !== undefined ? o.base : 0), { y: o.base || 0, walk: true, stair: dir })); }
  const th = 0.3, { m, L } = beam(key, x, y0 - th / 2, z, x + dx * len, y1 - th / 2, z + dz * len, w, th, true, TILES[key] || 2);
  rayAdd(new THREE.BoxGeometry(w, th, L), m);
  if (o.sides !== false && o.base === undefined) {   // solid side walls under the slope (ramps standing on the ground)
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(len, 0); sh.lineTo(len, y1 > y0 ? y1 - th : y0 - th); sh.lineTo(0, y1 > y0 ? y0 - th : y1 - th); sh.lineTo(0, 0);
    const lo = Math.min(y0, y1); if (Math.max(y0, y1) - th - lo > 0.2) {
      const g = new THREE.ExtrudeGeometry(sh, { depth: w - 0.02, bevelEnabled: false }); const uv = g.attributes.uv.array; for (let k = 0; k < uv.length; k++) uv[k] /= (TILES[key] || 2);
      const mm = new THREE.Matrix4().makeBasis(new THREE.Vector3(dx, 0, dz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-dz, 0, dx)); mm.setPosition(x + dz * (w - 0.02) / 2, 0, z - dx * (w - 0.02) / 2);
      batchAdd(key, g, mm);
    }
  }
}
// railing: blocks walking, bullets pass
function rail(x0, z0, x1, z1, y = 0, o = {}) {
  const alongX = Math.abs(z1 - z0) < 0.01, L = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hh = o.h || 1.05;
  boxes.push(mkBox(cx, cz, alongX ? L : 0.12, alongX ? 0.12 : L, hh, { y, walk: false, rail: true }));
  const parts = [{ g: new THREE.BoxGeometry(alongX ? L : 0.06, 0.06, alongX ? 0.06 : L), m: mat4(cx, y + hh, cz) }, { g: new THREE.BoxGeometry(alongX ? L : 0.04, 0.04, alongX ? 0.04 : L), m: mat4(cx, y + hh * 0.5, cz) }];
  const n = Math.max(1, Math.round(L / 1.4));
  for (let i = 0; i <= n; i++) { const f = i / n - 0.5; parts.push({ g: new THREE.BoxGeometry(0.05, hh, 0.05), m: mat4(cx + (alongX ? f * L : 0), y + hh / 2, cz + (alongX ? 0 : f * L)) }); }
  batchAdd(o.key || 'dark', mergeGeos(parts), null, false);
}
// shipping container (6 x 2.6 x 2.4); `alongX` lays it east-west; colour key paintX
function container(x, z, alongX, y = 0, col = 'paintRed', o = {}) {
  const L = o.len || 6, W = 2.4, H = 2.6, w = alongX ? L : W, d = alongX ? W : L;
  if (hasModel('props', 'container')) placeProp('container', mat4(x, y, z, 0, 0, 0, w, H, d), { metal: col });
  else { batchAdd(col, scaledBox(w, H, d, 2), mat4(x, y + H / 2, z)); }
  boxes.push(mkBox(x, z, w, d, H, { y, walk: true })); rayAdd(new THREE.BoxGeometry(w, H, d), mat4(x, y + H / 2, z));
}
function crate(x, z, s = 1.1, y = 0, h = s) {
  if (hasModel('props', 'crate')) placeProp('crate', mat4(x, y, z, 0, 0, 0, s, h, s)); else batchAdd('wood', scaledBox(s, h, s, 1.2), mat4(x, y + h / 2, z));
  boxes.push(mkBox(x, z, s, s, h, { y, walk: s >= 0.9 })); rayAdd(new THREE.BoxGeometry(s, h, s), mat4(x, y + h / 2, z));
}
function barrelAt(x, z, col = 'blue', y = 0) {
  if (!y && col === 'red' && addExplosiveBarrel(x, z)) return;
  if (!placeProp('barrel', mat4(x, y, z, 0, Math.random() * TAU, 0), { paint: 'barrel_' + col, steel: 'metal' })) batchAdd('barrel_' + col, new THREE.CylinderGeometry(0.3, 0.3, 0.9, 14), mat4(x, y + 0.45, z));
  boxes.push(mkBox(x, z, 0.62, 0.62, 0.9, { y, walk: false })); rayAdd(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 8), mat4(x, y + 0.45, z));
}
function sandbags(cx, cz, len, alongX, rows = 3, y = 0) {
  const n = Math.floor(len / 0.62);
  for (let r = 0; r < rows; r++) for (let i = 0; i < n - (r % 2); i++) {
    const off = -len / 2 + 0.31 + i * 0.62 + (r % 2) * 0.31, j = (Math.random() - 0.5) * 0.04;
    const m = mat4(alongX ? cx + off : cx + j, y + 0.135 + r * 0.25, alongX ? cz + j : cz + off, (Math.random() - 0.5) * 0.08, (alongX ? 0 : Math.PI / 2) + (Math.random() - 0.5) * 0.16, (Math.random() - 0.5) * 0.08);
    if (!placeProp('sandbag', m)) batchAdd('sand', new THREE.BoxGeometry(0.6, 0.26, 0.4), m);
  }
  const h = rows * 0.27 + 0.1; boxes.push(mkBox(cx, cz, alongX ? len : 0.8, alongX ? 0.8 : len, h, { y, walk: false })); rayAdd(new THREE.BoxGeometry(alongX ? len : 0.8, h, alongX ? 0.8 : len), mat4(cx, y + h / 2, cz));
}
function jersey(x, z, alongX, y = 0) {
  if (!placeProp('barrier', mat4(x, y, z, 0, alongX ? 0 : Math.PI / 2, 0))) batchAdd('concrete', new THREE.BoxGeometry(alongX ? 3 : 0.7, 0.95, alongX ? 0.7 : 3), mat4(x, y + 0.48, z));
  boxes.push(mkBox(x, z, alongX ? 3 : 0.7, alongX ? 0.7 : 3, 0.95, { y, walk: false })); rayAdd(new THREE.BoxGeometry(alongX ? 3 : 0.7, 0.95, alongX ? 0.7 : 3), mat4(x, y + 0.48, z));
}
function carWreck(x, z, alongX, col, y = 0) {
  if (placeProp('car', mat4(x, y, z, 0, alongX ? 0 : Math.PI / 2, 0), col ? { car: col } : {})) { boxes.push(mkBox(x, z, alongX ? 4.4 : 1.9, alongX ? 1.9 : 4.4, 1.5, { y, walk: false })); rayAdd(new THREE.BoxGeometry(alongX ? 4.4 : 1.9, 1.5, alongX ? 1.9 : 4.4), mat4(x, y + 0.75, z)); return; }
  blk(x, z, alongX ? 4.4 : 1.9, alongX ? 1.9 : 4.4, 1.4, 'car', { y, walk: false });
}
function tree(x, z, dead = false, s = 1) {
  const h = (4.5 + Math.random() * 2.5) * s, k = h / 5.6;
  if (!placeProp(dead ? 'treeD' : 'treeA', mat4(x, 0, z, 0, Math.random() * TAU, 0, k * (0.85 + Math.random() * 0.3), k, k * (0.85 + Math.random() * 0.3)))) batchAdd('bark', new THREE.CylinderGeometry(0.1, 0.26, h, 8), mat4(x, h / 2, z));
  boxes.push(mkBox(x, z, 0.6, 0.6, h, { walk: false })); rayAdd(new THREE.CylinderGeometry(0.2, 0.25, h, 6), mat4(x, h / 2, z));
}
// flat decal-like quad lying on a floor (puddles, road markings); no collision
function floorQuad(x, z, w, d, y, key, tile = 4, ry = 0) { const g = scaledPlane(w, d, tile); batchAdd(key, g, mat4(x, y + 0.02, z, -Math.PI / 2, 0, ry), false); }
// distant skyline of simple blocks around the arena
function skyline(n, rMin, rMax, hMin, hMax, key = 'facade') {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + Math.random() * 0.1, r = rMin + Math.random() * (rMax - rMin), w = 8 + Math.random() * 14, h = hMin + Math.random() * (hMax - hMin), d = 8 + Math.random() * 12;
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv.array; for (let k = 0; k < uv.length; k += 2) { uv[k] *= w / 6; uv[k + 1] *= h / 6; }
    batchAdd(key, g, mat4(Math.cos(a) * r, h / 2 - 1, Math.sin(a) * r, 0, -a + (Math.random() - 0.5) * 0.4, 0), false);
  }
}
function lampLight(x, y, z, col = 0xffc27a, i = 1.0, dist = 14) { const l = new THREE.PointLight(C(col), i, dist, 2); l.position.set(x, y, z); scene.add(l); return l; }

/* ---------- extra materials the new maps use */
function buildMapMaterials() {
  if (MAT.plaster) return;
  const std = (set, o) => new THREE.MeshStandardMaterial(Object.assign({ map: set.map, bumpMap: set.bump, bumpScale: 0.012, roughness: 0.92, metalness: 0 }, o));
  MAT.plaster = std(TEX.concrete, { color: C(0xf1e6d2), roughness: 0.96 });
  MAT.plasterOchre = std(TEX.concrete, { color: C(0xe2b878), roughness: 0.96 });
  MAT.plasterRose = std(TEX.concrete, { color: C(0xdca596), roughness: 0.96 });
  MAT.terracotta = std(TEX.brick, { color: C(0xd27a4c), roughness: 0.85 });
  MAT.stone = std(TEX.concrete, { color: C(0xc9b89a), roughness: 0.95, bumpScale: 0.03 });
  MAT.tile = std(TEX.concrete, { color: C(0xd8d4cc), roughness: 0.55 });
  // painted steel: a light, grimy greyscale texture tinted per colour (clean enough to read the colour)
  const pt = paint(256, (u, v, x, y) => { const n = (Math.sin(x * 0.7) * 0.5 + 0.5) * 0.04, g = 205 + Math.random() * 22 - (y > 200 ? (y - 200) * 0.9 : 0) * Math.random(); return [g - n * 200, g - n * 200, g - n * 200, 0.5 + Math.random() * 0.1]; }, (cg, bg, sz) => {
    const r = makeRng(17); for (let i = 0; i < 26; i++) { const x = r() * sz, w = 2 + r() * 6, h = 20 + r() * 90; cg.fillStyle = `rgba(70,50,35,${0.06 + r() * 0.12})`; cg.fillRect(x, sz - h, w, h); }
    for (let i = 0; i < 40; i++) { cg.fillStyle = `rgba(110,70,40,${0.1 + r() * 0.2})`; cg.beginPath(); cg.arc(r() * sz, r() * sz, 1 + r() * 4, 0, TAU); cg.fill(); }
  });
  const ps = { map: toTex(pt.cc, true, 1), bump: toTex(blurHeight(pt.bc), false, 1) };
  const paintMat = (hex, o) => std(ps, Object.assign({ color: C(hex), roughness: 0.55, metalness: 0.35, bumpScale: 0.004 }, o));
  MAT.paintRed = paintMat(0xa8402e); MAT.paintBlue = paintMat(0x2f5f92); MAT.paintGreen = paintMat(0x4b7a42);
  MAT.paintOrange = paintMat(0xd57a2e); MAT.paintYellow = paintMat(0xe2b13a); MAT.paintWhite = paintMat(0xdfe3e0);
  MAT.steel = new THREE.MeshStandardMaterial({ color: C(0x5a5f63), roughness: 0.45, metalness: 0.8, map: TEX.metal.map, bumpMap: TEX.metal.bump, bumpScale: 0.004 });
  MAT.water = new THREE.MeshStandardMaterial({ color: C(0x1d3640), roughness: 0.12, metalness: 0.2, envMapIntensity: 1.4 });
  MAT.awningRed = new THREE.MeshStandardMaterial({ color: C(0xa8352c), roughness: 0.9, side: THREE.DoubleSide });
  MAT.awningGreen = new THREE.MeshStandardMaterial({ color: C(0x3d6b4a), roughness: 0.9, side: THREE.DoubleSide });
  MAT.awningStripe = new THREE.MeshStandardMaterial({ color: C(0xd8c9a0), roughness: 0.9, side: THREE.DoubleSide });
  MAT.tileFloor = std(TEX.concrete, { color: C(0xb9b4aa), roughness: 0.5 });
  MAT.signal = new THREE.MeshStandardMaterial({ color: C(0xffe6a8), emissive: C(0xffd27a), emissiveIntensity: 1.6, roughness: 0.6 });
  MAT.signalCold = new THREE.MeshStandardMaterial({ color: C(0xe6f0ff), emissive: C(0xcfe2ff), emissiveIntensity: 1.4, roughness: 0.6 });
  MAT.train = std(TEX.metal, { color: C(0xb7bcc0), roughness: 0.45, metalness: 0.6 });
  MAT.olive = new THREE.MeshStandardMaterial({ color: C(0x5d6b3a), roughness: 1, flatShading: true });
  MAT.windowGlass = new THREE.MeshStandardMaterial({ color: C(0xb8d0dc), roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.5 });
  buildPropMaterials();
  try { addFresnelAll({ a: MAT.paintRed, b: MAT.paintBlue, c: MAT.paintGreen, d: MAT.paintOrange, e: MAT.paintYellow, f: MAT.paintWhite, g: MAT.steel, h: MAT.water, i: MAT.train }); } catch (e) {}
}

/* ---------- environment (sky, sun, fog) per map */
const ENV_DEFAULT = { top: 0x5f86b4, horizon: 0xb9c2c4, fog: 0.0105, sun: [-38, 52, 26], sunCol: 0xffe9c8, sunI: 2.2, skySun: 0xffe2a8, hemiSky: 0xbcd0e4, hemiGround: 0x4b4433, exposure: 1.05 };
function applyEnv(env) {
  const e = Object.assign({}, ENV_DEFAULT, env || {});
  skyMat.uniforms.top.value = C(e.top); skyMat.uniforms.horizon.value = C(e.horizon); skyMat.uniforms.sunCol.value = C(e.skySun);
  SUN_POS.set(e.sun[0], e.sun[1], e.sun[2]); sun.position.copy(SUN_POS); skyMat.uniforms.sunDir.value.copy(SUN_POS).normalize();
  sun.color = C(e.sunCol); sun.intensity = e.sunI; vmSun.color = C(e.sunCol);
  hemi.color = C(e.hemiSky); hemi.groundColor = C(e.hemiGround);
  scene.fog.color.setHex(e.horizon); scene.fog.density = e.fog;
  ENV_EXPOSURE = e.exposure;
  try { buildEnvironment(); } catch (err) {}
  try { applyVideoSettings(); } catch (err) {}
}

/* ---------- loading and clearing */
function clearWorld() {
  const shared = new Set(); for (const id in MGEO) for (const mk in MGEO[id]) shared.add(MGEO[id][mk]);
  for (const o of worldObjs) {
    scene.remove(o);
    o.traverse && o.traverse(m => { if (m.isMesh && m.geometry && !shared.has(m.geometry)) m.geometry.dispose(); });
  }
  worldObjs = [];
  for (const b of barrels) scene.remove(b.g);
  boxes.length = 0; wallMeshes.length = 0; fires.length = 0; barrels.length = 0; boxGridDirty = true;
  for (const id in batches) delete batches[id]; RAYC.clear();
  for (const d of decals) d.visible = false;
  if (grassMesh) { scene.remove(grassMesh); grassMesh.geometry.dispose(); grassMesh = null; }
  SPAWNS = null; FLOW.clear(); navTarget = -1; navField = null;
}
let PLAYRECT = [-44, 44, -44, 44];
function loadMap(id) {
  if (!MAPS[id]) id = 'ruins';
  if (curMap === id && boxes.length) return false;
  const t0 = performance.now();
  clearWorld(); buildMapMaterials();
  const map = MAPS[id]; curMap = id; PLAYRECT = map.play || [-43.5, 43.5, -43.5, 43.5];
  applyEnv(map.env);
  const before = new Set(scene.children);
  map.build(); flushBatches(); rayFlush();
  boxGridDirty = true; buildNav();
  buildGrass(map.grass || {});
  try { addWind(grassMesh && grassMesh.material, 1); addWind(MAT.leaf, 3); } catch (e) {}
  for (const o of scene.children) if (!before.has(o)) worldObjs.push(o);
  const L = map.layout; for (const k of ['spawn', 'hp', 'flags', 'sites']) LAYOUT[k] = L[k].map(p => Object.assign({}, p));
  MENU_VIEW = map.menu || { x: 0, z: 0, r: 12.5, y: 2.1 };
  try { realTexRepatch(); } catch (e) {}
  try { if (renderer.shadowMap) renderer.shadowMap.needsUpdate = true; } catch (e) {}
  MAP_BUILD_MS = Math.round(performance.now() - t0);
  return true;
}
let MENU_VIEW = { x: 0, z: 0, r: 12.5, y: 2.1 }, MAP_BUILD_MS = 0;
// next map in the online rotation (deterministic per match number so everyone agrees)
function rotationMap(n) { const pool = MAP_ORDER.filter(id => !MAPS[id].hidden); return pool[((n % pool.length) + pool.length) % pool.length]; }

/* ---------- the original map */
defineMap({
  id: 'ruins', name: 'ASH RUINS', place: 'Bombed-out town square', desc: 'Open ruins around a crossroads. Five shells of buildings, a lot of open ground: long fights, flanks everywhere.',
  build: () => buildWorld(), env: {},
  grass: { avoid: (x, z) => Math.abs(z - 2) < 3.4 || (Math.abs(x) < 3.4 && z > -24 && z < 44) },
  layout: {
    spawn: [{ x: 0, z: 37 }, { x: 0, z: -37 }],
    hp: [{ x: 0, z: 2 }, { x: -24, z: -14 }, { x: 25, z: 20 }, { x: 26, z: -8 }, { x: -20, z: 22 }],
    flags: [{ x: 0, z: 36 }, { x: 0, z: -36 }],
    sites: [{ x: -22, z: -24, n: 'A' }, { x: 24, z: -30, n: 'B' }],
  },
  menu: { x: 0, z: 0, r: 12.5, y: 2.1 },
});
