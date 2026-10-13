/* ================================================================== world: materials, geometry helpers, map */
const ARENA = 44;
const boxes = [];      // collision boxes
const wallMeshes = []; // raycast targets (bullets, line of sight, blasts)
const MAT = {};
// static scenery is merged per material so the whole map costs a few dozen draw calls instead of hundreds
const batches = {}, IDENT = new THREE.Matrix4();
function batchAdd(key, geo, matrix, shadow = true) { const id = key + (shadow ? '+s' : ''); (batches[id] || (batches[id] = { key, shadow, list: [] })).list.push({ g: geo, m: matrix || IDENT }); }
function flushBatches() {
  for (const id in batches) { const b = batches[id]; const m = new THREE.Mesh(mergeGeos(b.list), MAT[b.key]); m.castShadow = b.shadow; m.receiveShadow = true; scene.add(m); delete batches[id]; }
}

function mergeGeos(parts) {
  const pos = [], nor = [], uv = [], idx = []; let base = 0;
  for (const p of parts) {
    const g = p.g.clone(); if (p.m) g.applyMatrix4(p.m);
    const pa = g.attributes.position.array, na = g.attributes.normal.array, ua = g.attributes.uv.array;
    for (let i = 0; i < pa.length; i++) { pos.push(pa[i]); nor.push(na[i]); }
    for (let i = 0; i < ua.length; i++) uv.push(ua[i]);
    if (g.index) { const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx.push(ia[i] + base); } else for (let i = 0; i < pa.length / 3; i++) idx.push(base + i);
    base += pa.length / 3;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function mat4(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
}

// box with UVs in world units so textures keep their real-world scale on big walls
function scaledBox(w, h, d, tile, ox = 0, oy = 0) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv.array;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = (f * 4 + v) * 2; uv[i] = uv[i] * dims[f][0] / tile + ox; uv[i + 1] = uv[i + 1] * dims[f][1] / tile + oy; }
  return g;
}
function scaledPlane(w, h, tile) {
  const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv.array;
  for (let i = 0; i < uv.length; i += 2) { uv[i] *= w / tile; uv[i + 1] *= h / tile; }
  return g;
}

function buildMaterials() {
  const std = (set, o) => new THREE.MeshStandardMaterial(Object.assign({ map: set.map, bumpMap: set.bump, bumpScale: 0.015, roughness: 0.92, metalness: 0 }, o));
  MAT.ground = std(TEX.ground, { bumpScale: 0.035, roughness: 1 });
  MAT.ground.map.repeat.set(14, 14); MAT.ground.bumpMap.repeat.set(14, 14);
  MAT.asphalt = std(TEX.asphalt, { roughness: 0.74, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  MAT.concrete = std(TEX.concrete, { roughness: 0.95 });
  MAT.brick = std(TEX.brick, { roughness: 0.9, bumpScale: 0.025 });
  MAT.wood = std(TEX.wood, { roughness: 0.8 });
  MAT.metal = std(TEX.metal, { roughness: 0.46, metalness: 0.65, bumpScale: 0.006, envMapIntensity: 1.3 });
  MAT.sand = std(TEX.sand, { roughness: 1 });
  MAT.lane = new THREE.MeshStandardMaterial({ map: TEX.lane.map, transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, depthWrite: false });
  MAT.rock = new THREE.MeshStandardMaterial({ color: C(0x75726a), roughness: 1, flatShading: true, map: TEX.concrete.map, bumpMap: TEX.concrete.bump, bumpScale: 0.04 });
  MAT.dark = new THREE.MeshStandardMaterial({ color: C(0x2c2a27), roughness: 0.9, metalness: 0.2 });
  MAT.bark = new THREE.MeshStandardMaterial({ color: C(0x3d3128), roughness: 1, map: TEX.concrete.map, bumpMap: TEX.concrete.bump, bumpScale: 0.03 });
  MAT.leaf = new THREE.MeshStandardMaterial({ color: C(0x3f5a2a), roughness: 1, flatShading: true });
  MAT.glass = new THREE.MeshStandardMaterial({ color: C(0x0c1013), roughness: 0.25, metalness: 0.3 });
  MAT.car = new THREE.MeshStandardMaterial({ color: C(0x5a4a3c), roughness: 0.5, envMapIntensity: 1.3, metalness: 0.6, map: TEX.metal.map, bumpMap: TEX.metal.bump, bumpScale: 0.005 });
  MAT.tire = new THREE.MeshStandardMaterial({ color: C(0x151515), roughness: 0.95 });
  MAT.pickup = new THREE.MeshStandardMaterial({ color: C(0x4c7a3c), roughness: 0.6, metalness: 0.3, emissive: C(0x1c5a14), emissiveIntensity: 0.9 });
  MAT.barrel_red = null; MAT.barrel = {
    red: new THREE.MeshStandardMaterial({ color: C(0xa8442c), roughness: 0.55, metalness: 0.6, map: TEX.metal.map, bumpMap: TEX.metal.bump, bumpScale: 0.005 }),
    blue: new THREE.MeshStandardMaterial({ color: C(0x35567a), roughness: 0.55, metalness: 0.6, map: TEX.metal.map, bumpMap: TEX.metal.bump, bumpScale: 0.005 }),
    green: new THREE.MeshStandardMaterial({ color: C(0x56693a), roughness: 0.55, metalness: 0.6, map: TEX.metal.map, bumpMap: TEX.metal.bump, bumpScale: 0.005 }),
  };
  MAT.barrel_red = MAT.barrel.red; MAT.barrel_blue = MAT.barrel.blue; MAT.barrel_green = MAT.barrel.green;
  // distant skyline facade
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#4a4f55'; g.fillRect(0, 0, 128, 128);
  for (let y = 6; y < 128; y += 22) for (let x = 6; x < 128; x += 20) { g.fillStyle = Math.random() < 0.22 ? '#2c3035' : '#1b1e22'; g.fillRect(x, y, 11, 14); }
  const ft = new THREE.CanvasTexture(c); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.encoding = THREE.sRGBEncoding;
  MAT.facade = new THREE.MeshStandardMaterial({ map: ft, roughness: 1, color: C(0xb8bcc0) });
}

/* ------------------------------------------------------------------ collidable boxes */
const TILES = { concrete: 3, brick: 1.2, wood: 1.2, metal: 2, sand: 1 };
function addBox(cx, cz, w, d, h, key, o = {}) {
  const tile = TILES[key] || 2;
  const m = new THREE.Mesh(scaledBox(w, h, d, tile, Math.random(), Math.random()), MAT[key]);
  m.position.set(cx, (o.y || 0) + h / 2, cz);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  if (!o.deco) { wallMeshes.push(m); boxes.push({ minx: cx - w / 2, maxx: cx + w / 2, minz: cz - d / 2, maxz: cz + d / 2, top: h }); }
  return m;
}
function deco(geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = shadow; m.receiveShadow = true; scene.add(m); return m;
}
function addCollider(cx, cz, w, d, h, mesh) {
  if (mesh) wallMeshes.push(mesh);
  boxes.push({ minx: cx - w / 2, maxx: cx + w / 2, minz: cz - d / 2, maxz: cz + d / 2, top: h });
}

/* ------------------------------------------------------------------ collision */
const STEP = 0.35;
// uniform grid over the arena so collision queries only look at nearby boxes (was: every box, every call)
const GCELL = 4, GMARGIN = 1.0, GORIG = -ARENA - 6, GN = Math.ceil((ARENA * 2 + 12) / GCELL);
let boxGrid = null, boxGridN = -1, boxGridDirty = true;
const EMPTY = [];
function rebuildBoxGrid() {
  boxGrid = Array.from({ length: GN * GN }, () => []);
  const cl = v => clamp(Math.floor((v - GORIG) / GCELL), 0, GN - 1);
  for (const b of boxes) {
    const x0 = cl(b.minx - GMARGIN), x1 = cl(b.maxx + GMARGIN), z0 = cl(b.minz - GMARGIN), z1 = cl(b.maxz + GMARGIN);
    for (let gx = x0; gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) boxGrid[gx * GN + gz].push(b);
  }
  boxGridN = boxes.length; boxGridDirty = false;
}
function boxesNear(x, z) {
  if (boxGridDirty || boxGridN !== boxes.length) rebuildBoxGrid();
  const gx = Math.floor((x - GORIG) / GCELL), gz = Math.floor((z - GORIG) / GCELL);
  if (gx < 0 || gz < 0 || gx >= GN || gz >= GN) return EMPTY;
  return boxGrid[gx * GN + gz];
}
function resolve(pos, r, feetY) {
  for (const b of boxesNear(pos.x, pos.z)) {
    if (b.top <= feetY + STEP) continue;
    const cx = clamp(pos.x, b.minx, b.maxx), cz = clamp(pos.z, b.minz, b.maxz);
    const dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2), push = r - d; pos.x += dx / d * push; pos.z += dz / d * push; }
    else {
      const l = pos.x - b.minx, rr = b.maxx - pos.x, t = pos.z - b.minz, bt = b.maxz - pos.z, m = Math.min(l, rr, t, bt);
      if (m === l) pos.x = b.minx - r; else if (m === rr) pos.x = b.maxx + r; else if (m === t) pos.z = b.minz - r; else pos.z = b.maxz + r;
    }
  }
}
function groundAt(x, z, feetY) {
  let g = 0;
  for (const b of boxesNear(x, z)) if (x > b.minx - 0.25 && x < b.maxx + 0.25 && z > b.minz - 0.25 && z < b.maxz + 0.25 && b.top <= feetY + STEP) g = Math.max(g, b.top);
  return g;
}

/* ------------------------------------------------------------------ the map */
const fires = [];
function buildWorld() {
  // ground + roads
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(ARENA * 2 + 60, ARENA * 2 + 60), MAT.ground);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const road = (cx, cz, w, l, alongX) => {
    const m = new THREE.Mesh(scaledPlane(alongX ? l : w, alongX ? w : l, 4), MAT.asphalt);
    m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.02, cz); m.receiveShadow = true; scene.add(m);
    const ln = new THREE.Mesh(new THREE.PlaneGeometry(0.18, l), MAT.lane); const uv = ln.geometry.attributes.uv.array;
    for (let i = 1; i < uv.length; i += 2) uv[i] *= l / 4;
    ln.rotation.x = -Math.PI / 2; ln.rotation.z = alongX ? Math.PI / 2 : 0; ln.position.set(cx, 0.03, cz); scene.add(ln);
  };
  road(0, 2, 6, ARENA * 2, true);
  road(0, 10, 6, 68, false);

  // perimeter wall with buttresses
  addBox(0, -ARENA - 0.5, ARENA * 2 + 2, 1, 7, 'concrete');
  addBox(0, ARENA + 0.5, ARENA * 2 + 2, 1, 7, 'concrete');
  addBox(-ARENA - 0.5, 0, 1, ARENA * 2, 7, 'concrete');
  addBox(ARENA + 0.5, 0, 1, ARENA * 2, 7, 'concrete');
  for (let t = -ARENA + 6; t < ARENA; t += 11) {
    batchAdd('concrete', scaledBox(1.1, 7.6, 0.7, 3, Math.random(), 0), mat4(t, 3.8, -ARENA + 0.3)); batchAdd('concrete', scaledBox(1.1, 7.6, 0.7, 3, Math.random(), 0), mat4(t, 3.8, ARENA - 0.3));
    batchAdd('concrete', scaledBox(0.7, 7.6, 1.1, 3, Math.random(), 0), mat4(-ARENA + 0.3, 3.8, t)); batchAdd('concrete', scaledBox(0.7, 7.6, 1.1, 3, Math.random(), 0), mat4(ARENA - 0.3, 3.8, t));
  }

  // ruined buildings
  const building = (cx, cz, w, d, h, key) => {
    const t = 0.6, gap = 3.2;
    addBox(cx, cz + d / 2, w, t, h, key);
    addBox(cx - w / 2, cz, t, d, h, key);
    const sw = (w - gap) / 2, ew = (d - gap) / 2;
    addBox(cx - gap / 2 - sw / 2, cz - d / 2, sw, t, h, key);
    addBox(cx + gap / 2 + sw / 2, cz - d / 2, sw, t, h, key);
    addBox(cx + w / 2, cz - gap / 2 - ew / 2, t, ew, h, key);
    addBox(cx + w / 2, cz + gap / 2 + ew / 2, t, ew, h, key);
    addBox(cx, cz - d / 2, gap + 0.4, t, 0.9, key);
    // interior slab
    batchAdd('concrete', scaledPlane(w - 1, d - 1, 3), mat4(cx, 0.04, cz, -Math.PI / 2, 0, 0), false);
    // broken parapet: random chunks along the tops
    const chunks = [];
    const strip = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / 0.9);
      for (let i = 0; i < n; i++) { if (Math.random() < 0.3) continue; const f = (i + 0.5) / n, hh = 0.2 + Math.random() * 0.9; const wdt = 0.5 + Math.random() * 0.5;
        const horizontal = Math.abs(z1 - z0) < 0.01;
        chunks.push({ g: new THREE.BoxGeometry(horizontal ? wdt : 0.55, hh, horizontal ? 0.55 : wdt), m: mat4(x0 + (x1 - x0) * f, h + hh / 2 - 0.02, z0 + (z1 - z0) * f, 0, (Math.random() - 0.5) * 0.3, 0) }); } };
    strip(cx - w / 2, cz + d / 2, cx + w / 2, cz + d / 2); strip(cx - w / 2, cz - d / 2, cx - w / 2, cz + d / 2);
    strip(cx - w / 2, cz - d / 2, cx - gap / 2, cz - d / 2); strip(cx + gap / 2, cz - d / 2, cx + w / 2, cz - d / 2);
    if (chunks.length) batchAdd(key, mergeGeos(chunks));
    // windows on the two solid faces (dark recess + frame)
    const win = [];
    for (let x = cx - w / 2 + 2.2; x < cx + w / 2 - 1.5; x += 3.6) { win.push({ g: new THREE.BoxGeometry(1.3, 1.5, 0.12), m: mat4(x, 2.4, cz + d / 2 + 0.31) }); }
    for (let z = cz - d / 2 + 2.2; z < cz + d / 2 - 1.5; z += 3.6) { win.push({ g: new THREE.BoxGeometry(0.12, 1.5, 1.3), m: mat4(cx - w / 2 - 0.31, 2.4, z) }); }
    if (win.length) batchAdd('glass', mergeGeos(win), null, false);
    const frames = [];
    for (let x = cx - w / 2 + 2.2; x < cx + w / 2 - 1.5; x += 3.6) { frames.push({ g: new THREE.BoxGeometry(1.5, 0.12, 0.22), m: mat4(x, 1.62, cz + d / 2 + 0.36) }); frames.push({ g: new THREE.BoxGeometry(1.5, 0.12, 0.22), m: mat4(x, 3.18, cz + d / 2 + 0.36) }); }
    for (let z = cz - d / 2 + 2.2; z < cz + d / 2 - 1.5; z += 3.6) { frames.push({ g: new THREE.BoxGeometry(0.22, 0.12, 1.5), m: mat4(cx - w / 2 - 0.36, 1.62, z) }); frames.push({ g: new THREE.BoxGeometry(0.22, 0.12, 1.5), m: mat4(cx - w / 2 - 0.36, 3.18, z) }); }
    if (frames.length) batchAdd('concrete', mergeGeos(frames));
    // rubble spilling out of the doorways
    rubble(cx, cz - d / 2 - 1.6, 6); rubble(cx + w / 2 + 1.6, cz, 6);
  };
  building(-24, -22, 14, 11, 4.2, 'brick');
  building(24, -26, 12, 12, 4.2, 'concrete');
  building(-26, 20, 12, 10, 4.2, 'concrete');
  building(26, 18, 14, 10, 4.2, 'brick');
  building(0, -30, 10, 8, 4.2, 'brick');

  // cover: crates and steel containers
  const cover = [
    [-8, -6, 2, 2, 1.0], [-9, -4.5, 1.6, 1.6, 2.0], [8, -8, 3, 1.2, 1.2], [10, 0, 1.2, 4, 1.2],
    [-12, 6, 4, 1.2, 1.2], [0, -14, 5, 1, 1.4], [14, -14, 2, 2, 2.0], [-16, -8, 1.5, 6, 1.4],
    [16, 10, 2.5, 2.5, 1.0], [6, 14, 1.4, 5, 1.4], [-6, 16, 3, 3, 1.0], [0, 24, 8, 1, 1.4],
    [-34, 2, 2, 2, 2], [34, -2, 2, 2, 2], [-2, 34, 3, 2, 1.2], [3, -38, 3, 2, 1.2], [20, 30, 2, 2, 1.0],
    [-20, 34, 2, 2, 1.0], [32, 34, 6, 1, 1.4], [-34, -34, 6, 1, 1.4], [38, -10, 1, 8, 1.4], [-38, 12, 1, 8, 1.4],
  ];
  cover.forEach(([x, z, w, d, h]) => {
    const metal = h > 1.5 || w * d > 6;
    if (hasModel('props', metal ? 'container' : 'crate')) { proxyCollider(x, z, w, d, h); placeProp(metal ? 'container' : 'crate', mat4(x, 0, z, 0, 0, 0, w, h, d)); return; }
    const m = addBox(x, z, w, d, h, metal ? 'metal' : 'wood');
    if (metal) { // container ribs
      const ribs = []; const horiz = w >= d;
      for (let i = 0; i < Math.floor((horiz ? w : d) / 0.5); i++) { const o = -(horiz ? w : d) / 2 + 0.25 + i * 0.5;
        ribs.push({ g: new THREE.BoxGeometry(horiz ? 0.08 : w + 0.08, h * 0.9, horiz ? d + 0.08 : 0.08), m: mat4(x + (horiz ? o : 0), h / 2, z + (horiz ? 0 : o)) }); }
      if (ribs.length < 40) batchAdd('metal', mergeGeos(ribs));
    } else { // crate edge trim
      const t = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) t.push({ g: new THREE.BoxGeometry(0.1, h + 0.04, 0.1), m: mat4(x + sx * (w / 2), h / 2, z + sz * (d / 2)) });
      batchAdd('wood', mergeGeos(t));
    }
  });

  // barrels (some burning), sandbags, barriers, wrecks
  const barrel = (x, z, col = 'red') => {
    if (col === 'red' && addExplosiveBarrel(x, z)) return;
    if (placeProp('barrel', mat4(x, 0, z, 0, Math.random() * TAU, 0), { paint: 'barrel_' + col, steel: 'metal' })) return proxyCollider(x, z, 0.62, 0.62, 0.9);
    const m = deco(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 14), MAT.barrel[col], x, 0.45, z);
    batchAdd('barrel_' + col, new THREE.CylinderGeometry(0.315, 0.315, 0.05, 14), mat4(x, 0.28, z)); batchAdd('barrel_' + col, new THREE.CylinderGeometry(0.315, 0.315, 0.05, 14), mat4(x, 0.62, z));
    addCollider(x, z, 0.62, 0.62, 0.9, m); return m;
  };
  [[-11, -2, 'red'], [-11.7, -1.2, 'blue'], [12, 8, 'green'], [11, 8.9, 'red'], [-4, 28, 'blue'], [21, -8, 'red'], [-22, 4, 'green'], [-21.2, 4.8, 'red'], [30, 4, 'blue'], [4, -20, 'red']].forEach(b => barrel(b[0], b[1], b[2]));
  const fire = (x, z) => {
    const light = new THREE.PointLight(C(0xff8a3a), 1.2, 11, 2); light.position.set(x, 1.5, z); scene.add(light);
    fires.push({ x, z, light, t: Math.random() * 10, sprites: [] });
  };
  fire(-10.3, -2); fire(12.8, 8.2);

  const sandWall = (cx, cz, len, alongX, rows = 3) => {
    if (hasModel('props', 'sandbag')) {
      const n = Math.floor(len / 0.62);
      for (let r = 0; r < rows; r++) for (let i = 0; i < n - (r % 2); i++) {
        const o = -len / 2 + 0.31 + i * 0.62 + (r % 2) * 0.31, jx = (Math.random() - 0.5) * 0.04;
        placeProp('sandbag', mat4(alongX ? cx + o : cx + jx, 0.135 + r * 0.25, alongX ? cz + jx : cz + o, (Math.random() - 0.5) * 0.08, (alongX ? 0 : Math.PI / 2) + (Math.random() - 0.5) * 0.16, (Math.random() - 0.5) * 0.08));
      }
      proxyCollider(cx, cz, alongX ? len : 0.8, alongX ? 0.8 : len, rows * 0.27 + 0.1); return;
    }
    const parts = []; const n = Math.floor(len / 0.62);
    for (let r = 0; r < rows; r++) for (let i = 0; i < n - (r % 2); i++) {
      const o = -len / 2 + 0.31 + i * 0.62 + (r % 2) * 0.31, jx = (Math.random() - 0.5) * 0.04;
      parts.push({ g: new THREE.SphereGeometry(0.5, 8, 6), m: mat4(alongX ? cx + o : cx + jx, 0.16 + r * 0.27, alongX ? cz + jx : cz + o, 0, alongX ? 0 : Math.PI / 2, 0, 0.62, 0.27, 0.42) });
    }
    const m = deco(mergeGeos(parts), MAT.sand, 0, 0, 0);
    addCollider(cx, cz, alongX ? len : 0.8, alongX ? 0.8 : len, rows * 0.27 + 0.1, m);
  };
  sandWall(-3, 8, 4.4, true); sandWall(5, 20, 4.4, true, 2); sandWall(-18, -2, 4, false); sandWall(18, 2.5, 3.7, false, 2); sandWall(10, -22, 5, true); sandWall(-8, -26, 4, true, 2);

  const barrier = (x, z, alongX) => {
    if (placeProp('barrier', mat4(x, 0, z, 0, alongX ? 0 : Math.PI / 2, 0))) { proxyCollider(x, z, alongX ? 3 : 0.7, alongX ? 0.7 : 3, 0.95); return; }
    const parts = [{ g: new THREE.BoxGeometry(alongX ? 3 : 0.7, 0.45, alongX ? 0.7 : 3), m: mat4(x, 0.225, z) }, { g: new THREE.BoxGeometry(alongX ? 3 : 0.4, 0.5, alongX ? 0.4 : 3), m: mat4(x, 0.7, z) }];
    const m = deco(mergeGeos(parts), MAT.concrete, 0, 0, 0); addCollider(x, z, alongX ? 3 : 0.7, alongX ? 0.7 : 3, 0.95, m);
  };
  [[-5, 5, true], [-2, 5, true], [4, 5.5, true], [7, 5.5, true], [13, -3, false], [13, -6, false], [-14, 12, false], [-14, 15, false]].forEach(b => barrier(b[0], b[1], b[2]));

  const wreck = (x, z, yaw, sx = 4.4, sz = 1.9) => {
    const alongX = Math.abs(Math.sin(yaw)) < 0.7, W = alongX ? sx : sz, D = alongX ? sz : sx;
    if (placeProp('car', mat4(x, 0, z, 0, alongX ? 0 : Math.PI / 2, 0))) { proxyCollider(x, z, W, D, 1.5); return; }
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = alongX ? 0 : Math.PI / 2;
    const add = (geo, mat, px, py, pz, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.rotation.set(rx, 0, rz); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    add(new THREE.BoxGeometry(sx, 0.7, sz), MAT.car, 0, 0.62, 0);
    add(new THREE.BoxGeometry(sx * 0.5, 0.6, sz * 0.9), MAT.car, -sx * 0.06, 1.25, 0);
    add(new THREE.BoxGeometry(sx * 0.46, 0.5, sz * 0.92), MAT.glass, -sx * 0.06, 1.26, 0).scale.set(1.01, 0.85, 0.99);
    add(new THREE.BoxGeometry(sx * 0.3, 0.12, sz * 0.96), MAT.car, sx * 0.3, 0.98, 0, 0, 0.18);
    for (const wx of [-sx * 0.32, sx * 0.32]) for (const wz of [-sz * 0.5, sz * 0.5]) { const t = add(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 14), MAT.tire, wx, 0.36, wz, Math.PI / 2); t.position.z = wz; }
    scene.add(g);
    addCollider(x, z, W, D, 1.5, g.children[0]);
  };
  wreck(-17, 6, 0); wreck(18, -12, Math.PI / 2); wreck(-30, -5, 0.3); wreck(34, 25, Math.PI / 2);

  // trees: dead and living
  const trees = [[-40, -14, 1], [40, 6, 0], [-30, -40, 0], [30, -42, 1], [14, 38, 0], [-12, 40, 1], [41, 34, 0], [-41, -30, 1], [8, -22, 1], [-6, 28, 0], [-40, 40, 0], [36, -36, 1], [-24, 8, 1], [23, 6, 0]];
  trees.forEach(([x, z, dead]) => {
    if (hasModel('props', 'treeA')) { const h = 4.5 + Math.random() * 2.5, s = h / 5.6; placeProp(dead ? 'treeD' : 'treeA', mat4(x, 0, z, 0, Math.random() * TAU, 0, s * (0.85 + Math.random() * 0.3), s, s * (0.85 + Math.random() * 0.3))); proxyCollider(x, z, 0.6, 0.6, h); return; }
    const h = 4.5 + Math.random() * 2.5, trunk = [{ g: new THREE.CylinderGeometry(0.1, 0.26, h, 8), m: mat4(0, h / 2, 0) }];
    const leaves = [];
    for (let i = 0; i < 5; i++) { const a = Math.random() * TAU, bl = 1.2 + Math.random() * 1.4, by = h * (0.5 + Math.random() * 0.45), tilt = 0.7 + Math.random() * 0.5;
      trunk.push({ g: new THREE.CylinderGeometry(0.02, 0.07, bl, 5), m: mat4(Math.cos(a) * bl * 0.4, by + bl * 0.3, Math.sin(a) * bl * 0.4, Math.sin(a) * tilt, 0, -Math.cos(a) * tilt) });
      if (!dead) leaves.push({ g: new THREE.IcosahedronGeometry(0.9 + Math.random() * 0.6, 0), m: mat4(Math.cos(a) * bl * 0.8, by + bl * 0.55, Math.sin(a) * bl * 0.8, Math.random(), Math.random(), 0) }); }
    if (!dead) { leaves.push({ g: new THREE.IcosahedronGeometry(1.5, 0), m: mat4(0, h + 0.6, 0) }); leaves.push({ g: new THREE.IcosahedronGeometry(1.2, 0), m: mat4(0.7, h - 0.2, 0.4, 0.4, 0.2, 0) }); }
    const tm = deco(mergeGeos(trunk), MAT.bark, x, 0, z);
    if (!dead) deco(mergeGeos(leaves), MAT.leaf, x, 0, z).receiveShadow = false;
    addCollider(x, z, 0.6, 0.6, h, tm);
  });

  // rocks and scattered debris
  for (let i = 0; i < 46; i++) {
    const x = rnd(-ARENA + 2, ARENA - 2), z = rnd(-ARENA + 2, ARENA - 2), s = 0.15 + Math.random() * (i < 8 ? 0.8 : 0.3);
    const rm = mat4(x, s * 0.25, z, (Math.random() - 0.5) * 0.6, Math.random() * TAU, (Math.random() - 0.5) * 0.6, s * 2 * (1 + Math.random() * 0.5), s * 2 * (0.6 + Math.random() * 0.4), s * 2 * (1 + Math.random() * 0.5));
    if (!placeProp('rock' + (i % 3), rm)) batchAdd('rock', new THREE.DodecahedronGeometry(s, 0), mat4(x, s * 0.4, z, Math.random() * 3, Math.random() * 3, Math.random() * 3, 1 + Math.random() * 0.5, 0.6 + Math.random() * 0.4, 1 + Math.random() * 0.5));
  }

  // distant skyline and smoke plumes to give the horizon some depth
  for (let i = 0; i < 38; i++) {
    const a = (i / 38) * TAU + Math.random() * 0.1, r = 95 + Math.random() * 60, w = 8 + Math.random() * 14, h = 14 + Math.random() * 42, d = 8 + Math.random() * 12;
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv.array; for (let k = 0; k < uv.length; k += 2) { uv[k] *= w / 6; uv[k + 1] *= h / 6; }
    const px = Math.cos(a) * r, pz = Math.sin(a) * r, ry = -a + (Math.random() - 0.5) * 0.4;
    batchAdd('facade', g, mat4(px, h / 2 - 1, pz, 0, ry, 0), false);
    if (Math.random() < 0.5) batchAdd('facade', new THREE.BoxGeometry(w * 0.5, h * 0.4, d * 0.5), mat4(px + 4, h + h * 0.2 - 1, pz, 0, ry + 0.3, 0), false);
  }
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6 + 0.4, r = 130;
    for (let j = 0; j < 9; j++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: C(0x2c2c2e), transparent: true, opacity: 0.55, depthWrite: false }));
      sp.position.set(Math.cos(a) * r + Math.sin(j) * 5, 10 + j * 11, Math.sin(a) * r); sp.scale.set(34 + j * 5, 34 + j * 5, 1); scene.add(sp); }
  }
  flushBatches();
}

function rubble(x, z, n) {
  for (let i = 0; i < n; i++) {
    const s = 0.1 + Math.random() * 0.28;
    const rk = Math.random() < 0.5 ? 'concrete' : 'brick';
    if (placeProp('rock' + (i % 3), mat4(x + (Math.random() - 0.5) * 3, s * 0.2, z + (Math.random() - 0.5) * 3, Math.random() * 3, Math.random() * 3, Math.random() * 3, s * 2, s * 2 * (0.55 + Math.random() * 0.3), s * 2), { rock: rk })) continue;
    batchAdd(rk, new THREE.DodecahedronGeometry(s, 0), mat4(x + (Math.random() - 0.5) * 3, s * 0.35, z + (Math.random() - 0.5) * 3, Math.random() * 3, Math.random() * 3, Math.random() * 3, 1, 0.55 + Math.random() * 0.3, 1));
  }
}

/* ------------------------------------------------------------------ navigation (flow field toward the player) */
const NN = ARENA * 2;
const NX = [1, -1, 0, 0, 1, 1, -1, -1], NZ = [0, 0, 1, -1, 1, -1, 1, -1];
const navBlocked = new Uint8Array(NN * NN), navDist = new Int32Array(NN * NN), navQueue = new Int32Array(NN * NN);
let navTarget = -1;
const cellOf = v => clamp(Math.floor(v + ARENA), 0, NN - 1);
function buildNav() {
  for (let cz = 0; cz < NN; cz++) for (let cx = 0; cx < NN; cx++) {
    const x = -ARENA + cx + 0.5, z = -ARENA + cz + 0.5; let blocked = 0;
    for (const b of boxes) { if (b.top <= STEP) continue; if (x > b.minx - 0.75 && x < b.maxx + 0.75 && z > b.minz - 0.75 && z < b.maxz + 0.75) { blocked = 1; break; } }
    navBlocked[cz * NN + cx] = blocked;
  }
}
function updateNav(px, pz) {
  const cx = cellOf(px), cz = cellOf(pz), key = cz * NN + cx;
  if (key === navTarget) return;
  let start = key;
  if (navBlocked[start]) {
    start = -1;
    for (let r = 1; r <= 4 && start < 0; r++) for (let dz = -r; dz <= r && start < 0; dz++) for (let dx = -r; dx <= r; dx++) {
      const x = cx + dx, z = cz + dz; if (x < 0 || z < 0 || x >= NN || z >= NN) continue;
      if (!navBlocked[z * NN + x]) { start = z * NN + x; break; }
    }
    if (start < 0) return;
  }
  navTarget = key; navDist.fill(-1);
  let head = 0, tail = 0; navQueue[tail++] = start; navDist[start] = 0;
  while (head < tail) {
    const c = navQueue[head++], x = c % NN, z = (c / NN) | 0, d = navDist[c] + 1;
    for (let k = 0; k < 8; k++) {
      const nx = x + NX[k], nz = z + NZ[k]; if (nx < 0 || nz < 0 || nx >= NN || nz >= NN) continue;
      const n = nz * NN + nx; if (navDist[n] >= 0 || navBlocked[n]) continue;
      if (k >= 4 && (navBlocked[z * NN + nx] || navBlocked[nz * NN + x])) continue;
      navDist[n] = d; navQueue[tail++] = n;
    }
  }
}
function navDir(x, z) {
  const cx = cellOf(x), cz = cellOf(z), c = cz * NN + cx;
  let bestD = navDist[c] >= 0 && !navBlocked[c] ? navDist[c] : 1e9, bk = -1;
  for (let k = 0; k < 8; k++) {
    const nx = cx + NX[k], nz = cz + NZ[k]; if (nx < 0 || nz < 0 || nx >= NN || nz >= NN) continue;
    const n = nz * NN + nx; if (navDist[n] < 0 || navDist[n] >= bestD) continue;
    if (k >= 4 && (navBlocked[cz * NN + nx] || navBlocked[nz * NN + cx])) continue;
    bestD = navDist[n]; bk = k;
  }
  if (bk < 0) return null;
  const tx = -ARENA + (cx + NX[bk] + 0.5) - x, tz = -ARENA + (cz + NZ[bk] + 0.5) - z, l = Math.hypot(tx, tz) || 1;
  return [tx / l, tz / l];
}
function gridClear(x0, z0, x1, z1) {
  const dx = x1 - x0, dz = z1 - z0, n = Math.ceil(Math.hypot(dx, dz) / 0.5);
  for (let i = 1; i < n; i++) { const t = i / n; if (navBlocked[cellOf(z0 + dz * t) * NN + cellOf(x0 + dx * t)]) return false; }
  return true;
}

/* grass tufts: crossed alpha cards, instanced, scaled by the quality setting */
function buildGrass() {
  const cards = [{ g: new THREE.PlaneGeometry(0.9, 0.7), m: mat4(0, 0.35, 0) }, { g: new THREE.PlaneGeometry(0.9, 0.7), m: mat4(0, 0.35, 0, 0, Math.PI / 2, 0) }, { g: new THREE.PlaneGeometry(0.9, 0.7), m: mat4(0, 0.35, 0, 0, Math.PI / 4, 0) }];
  const mat = new THREE.MeshStandardMaterial({ map: TEX.grass.map, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, color: C(0xd8e0c0) });
  grassMax = 4000;
  grassMesh = new THREE.InstancedMesh(mergeGeos(cards), mat, grassMax);
  const dummy = new THREE.Object3D(); let n = 0, guard = 0;
  while (n < grassMax && guard++ < grassMax * 6) {
    const x = rnd(-ARENA + 1, ARENA - 1), z = rnd(-ARENA + 1, ARENA - 1);
    if (navBlocked[cellOf(z) * NN + cellOf(x)] || (Math.abs(z - 2) < 3.4) || (Math.abs(x) < 3.4 && z > -24 && z < 44)) continue;
    const s = 0.7 + Math.random() * 0.9;
    dummy.position.set(x, 0, z); dummy.rotation.set(0, Math.random() * TAU, 0); dummy.scale.set(s, s * (0.8 + Math.random() * 0.6), s); dummy.updateMatrix();
    grassMesh.setMatrixAt(n++, dummy.matrix);
  }
  grassMax = n; grassMesh.count = Math.floor(n * FX.grass); grassMesh.frustumCulled = false; scene.add(grassMesh);
}
