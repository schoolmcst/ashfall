/* ================================================================== props: small set dressing for the maps
   All drawn into the merged batches (cheap). Props big enough to matter get a collider (and stop bullets); small
   clutter is decoration only. Every function takes a floor height y. */
const PZ = (x, y, z, w, h, d, o = {}) => { boxes.push(mkBox(x, z, w, d, h, Object.assign({ y, walk: false }, o))); if (!o.noRay) rayAdd(new THREE.BoxGeometry(w, h, d), mat4(x, y + h / 2, z)); };
const B = (key, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0, shadow = true) => batchAdd(key, new THREE.BoxGeometry(w, h, d), mat4(x, y, z, rx, ry, rz), shadow);
const CYL = (key, r0, r1, h, seg, x, y, z, rx = 0, ry = 0, rz = 0, shadow = true) => batchAdd(key, new THREE.CylinderGeometry(r0, r1, h, seg), mat4(x, y, z, rx, ry, rz), shadow);

function buildPropMaterials() {
  if (MAT.fence) return;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.clearRect(0, 0, 64, 64); g.strokeStyle = 'rgba(170,175,180,1)'; g.lineWidth = 3;
  for (let i = -64; i < 128; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding;
  MAT.fence = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 });
  MAT.rubber = new THREE.MeshStandardMaterial({ color: C(0x1c1c1c), roughness: 0.9 });
  MAT.cloth1 = new THREE.MeshStandardMaterial({ color: C(0xe8e2d4), roughness: 1, side: THREE.DoubleSide });
  MAT.cloth2 = new THREE.MeshStandardMaterial({ color: C(0x5f7fa8), roughness: 1, side: THREE.DoubleSide });
  MAT.cloth3 = new THREE.MeshStandardMaterial({ color: C(0xc0563f), roughness: 1, side: THREE.DoubleSide });
  MAT.hazard = (() => { const cc = document.createElement('canvas'); cc.width = cc.height = 64; const gg = cc.getContext('2d'); gg.fillStyle = '#d9a52a'; gg.fillRect(0, 0, 64, 64); gg.fillStyle = '#1b1b1b'; for (let i = -64; i < 128; i += 32) { gg.beginPath(); gg.moveTo(i, 0); gg.lineTo(i + 16, 0); gg.lineTo(i + 80, 64); gg.lineTo(i + 64, 64); gg.fill(); } const tt = new THREE.CanvasTexture(cc); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.encoding = THREE.sRGBEncoding; return new THREE.MeshStandardMaterial({ map: tt, roughness: 0.7 }); })();
  MAT.screen = new THREE.MeshStandardMaterial({ color: C(0x1a2630), emissive: C(0x5a8ab0), emissiveIntensity: 0.6, roughness: 0.3 });
  MAT.redLight = new THREE.MeshStandardMaterial({ color: C(0x400000), emissive: C(0xff3020), emissiveIntensity: 1.5 });
  MAT.greenLight = new THREE.MeshStandardMaterial({ color: C(0x003010), emissive: C(0x30ff60), emissiveIntensity: 1.2 });
  MAT.puddle = new THREE.MeshStandardMaterial({ color: C(0x6a7278), roughness: 0.04, metalness: 0.7, envMapIntensity: 1.8, transparent: true, opacity: 0.45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  try { addFresnelAll({ a: MAT.puddle }); } catch (e) {}
}

// a wooden pallet (1.2 x 1.0), optionally a stack of n
function pallet(x, z, y = 0, n = 1, alongX = true) {
  const w = alongX ? 1.2 : 1.0, d = alongX ? 1.0 : 1.2;
  for (let k = 0; k < n; k++) {
    const py = y + k * 0.15;
    for (let i = 0; i < 5; i++) { const o = -0.48 + i * 0.24; B('wood', alongX ? 1.2 : 0.1, 0.025, alongX ? 0.1 : 1.2, x + (alongX ? 0 : o), py + 0.137, z + (alongX ? o : 0)); }
    for (const o of [-0.5, 0, 0.5]) B('wood', alongX ? 0.1 : 1.0, 0.1, alongX ? 1.0 : 0.1, x + (alongX ? o : 0), py + 0.07, z + (alongX ? 0 : o));
  }
  if (n >= 2) PZ(x, y, z, w, n * 0.15, d); else boxes.push(mkBox(x, z, w, d, 0.15, { y, walk: true }));
}
// pallet with boxes shrink-wrapped on it
function palletLoad(x, z, y = 0, h = 1.1, col = 'cloth1') {
  pallet(x, z, y, 1); B('wood', 1.1, h, 0.9, x, y + 0.15 + h / 2, z); B(col, 1.14, h * 0.85, 0.94, x, y + 0.15 + h * 0.45, z, 0, 0, 0, false);
  PZ(x, y + 0.15, z, 1.1, h, 0.9);
}
function cone(x, z, y = 0) { CYL('paintOrange', 0.03, 0.17, 0.55, 10, x, y + 0.3, z); B('rubber', 0.36, 0.04, 0.36, x, y + 0.02, z); CYL('paintWhite', 0.075, 0.105, 0.08, 10, x, y + 0.36, z, 0, 0, 0, false); }
function lampPost(x, z, y = 0, h = 6, ax = 1, az = 0, light = false) {
  CYL('steel', 0.07, 0.11, h, 8, x, y + h / 2, z); CYL('steel', 0.16, 0.2, 0.5, 8, x, y + 0.25, z);
  beam('steel', x, y + h - 0.1, z, x + ax * 1.2, y + h, z + az * 1.2, 0.06, 0.06, false);
  B('dark', 0.5, 0.14, 0.26, x + ax * 1.25, y + h - 0.05, z + az * 1.25, 0, ax ? 0 : Math.PI / 2, 0);
  B('signal', 0.4, 0.04, 0.2, x + ax * 1.25, y + h - 0.13, z + az * 1.25, 0, ax ? 0 : Math.PI / 2, 0, false);
  PZ(x, y, z, 0.3, h, 0.3, { noRay: true });
  if (light) lampLight(x + ax * 1.25, y + h - 0.4, z + az * 1.25, 0xffd9a0, 0.9, 13);
}
function floodlight(x, z, y = 0, h = 14) {
  CYL('steel', 0.14, 0.25, h, 8, x, y + h / 2, z); B('steel', 2.4, 0.15, 0.15, x, y + h, z);
  for (const o of [-0.8, 0, 0.8]) { B('dark', 0.55, 0.4, 0.3, x + o, y + h + 0.3, z, -0.4, 0, 0); B('signal', 0.45, 0.3, 0.02, x + o, y + h + 0.22, z + 0.17, -0.4, 0, 0, false); }
  PZ(x, y, z, 0.5, h, 0.5);
}
function bench(x, z, y = 0, alongX = true) {
  const w = alongX ? 1.8 : 0.45, d = alongX ? 0.45 : 1.8;
  B('wood', w, 0.06, d, x, y + 0.45, z); B('wood', alongX ? 1.8 : 0.05, 0.35, alongX ? 0.05 : 1.8, x + (alongX ? 0 : -0.22), y + 0.7, z + (alongX ? -0.22 : 0), alongX ? -0.15 : 0, 0, alongX ? 0 : 0.15);
  for (const o of [-0.75, 0.75]) B('dark', alongX ? 0.06 : 0.42, 0.45, alongX ? 0.42 : 0.06, x + (alongX ? o : 0), y + 0.22, z + (alongX ? 0 : o));
  PZ(x, y, z, w, 0.5, d, { noRay: true });
}
function dumpster(x, z, y = 0, alongX = true, col = 'paintGreen') {
  const w = alongX ? 1.9 : 1.15, d = alongX ? 1.15 : 1.9;
  B(col, w, 1.15, d, x, y + 0.7, z); B('dark', w + 0.04, 0.08, d + 0.04, x, y + 1.3, z, alongX ? 0.06 : 0, 0, alongX ? 0 : 0.06);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) CYL('rubber', 0.07, 0.07, 0.06, 8, x + sx * (w / 2 - 0.15), y + 0.08, z + sz * (d / 2 - 0.15), Math.PI / 2, 0, 0, false);
  PZ(x, y, z, w, 1.32, d, { walk: true });
}
function trashBin(x, z, y = 0, col = 'paintGreen') { CYL(col, 0.28, 0.25, 0.85, 12, x, y + 0.43, z); CYL('dark', 0.3, 0.3, 0.05, 12, x, y + 0.88, z); PZ(x, y, z, 0.55, 0.9, 0.55, { noRay: true }); }
function hydrant(x, z, y = 0) { CYL('paintRed', 0.12, 0.14, 0.55, 10, x, y + 0.28, z); CYL('paintRed', 0.08, 0.13, 0.14, 10, x, y + 0.62, z); CYL('paintRed', 0.05, 0.05, 0.36, 8, x, y + 0.38, z, 0, 0, Math.PI / 2, false); }
function acUnit(x, z, y = 0, s = 1) { B('paintWhite', 1.0 * s, 0.75 * s, 0.7 * s, x, y + 0.38 * s, z); CYL('dark', 0.28 * s, 0.28 * s, 0.03, 16, x, y + 0.76 * s, z, 0, 0, 0, false); PZ(x, y, z, s, 0.75 * s, 0.7 * s); }
function tirePile(x, z, y = 0, n = 4) { for (let i = 0; i < n; i++) batchAdd('rubber', new THREE.TorusGeometry(0.32, 0.12, 6, 14), mat4(x + (Math.random() - 0.5) * 0.08, y + 0.12 + i * 0.22, z + (Math.random() - 0.5) * 0.08, Math.PI / 2, 0, Math.random())); PZ(x, y, z, 0.9, n * 0.22 + 0.05, 0.9); }
function gasBottles(x, z, y = 0) { for (const [dx, dz] of [[0, 0], [0.32, 0.05], [0.12, 0.3], [-0.2, 0.25]]) { CYL('paintBlue', 0.13, 0.13, 1.2, 10, x + dx, y + 0.6, z + dz); CYL('steel', 0.05, 0.08, 0.12, 8, x + dx, y + 1.26, z + dz, 0, 0, 0, false); } PZ(x + 0.06, y, z + 0.15, 0.75, 1.3, 0.7); }
// chain-link fence on posts (blocks walking, bullets pass)
function fence(x0, z0, x1, z1, y = 0, h = 2.2) {
  const alongX = Math.abs(z1 - z0) < 0.01, L = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const g = new THREE.PlaneGeometry(L, h), uv = g.attributes.uv.array; for (let i = 0; i < uv.length; i += 2) { uv[i] *= L / 0.6; uv[i + 1] *= h / 0.6; }
  batchAdd('fence', g, mat4(cx, y + h / 2, cz, 0, alongX ? 0 : Math.PI / 2, 0), false);
  const n = Math.max(1, Math.round(L / 2.5));
  for (let i = 0; i <= n; i++) { const f = i / n - 0.5; CYL('steel', 0.035, 0.035, h + 0.1, 6, cx + (alongX ? f * L : 0), y + h / 2, cz + (alongX ? 0 : f * L), 0, 0, 0, false); }
  B('steel', alongX ? L : 0.04, 0.04, alongX ? 0.04 : L, cx, y + h, cz, 0, 0, 0, false);
  boxes.push(mkBox(cx, cz, alongX ? L : 0.1, alongX ? 0.1 : L, h, { y, walk: false, rail: true }));
}
// a sign board on two posts or flat on a wall (face = direction it faces: 'n','s','e','w')
function billboard(x, z, y, w, h, face, key = 'signal', posts = 0) {
  const ry = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[face] || 0;
  B('dark', w + 0.2, h + 0.2, 0.12, x, y + posts + h / 2, z, 0, ry, 0, false);
  const [fx, fz] = DIRV[face] || [0, 1];
  B(key, w, h, 0.02, x + fx * 0.07, y + posts + h / 2, z + fz * 0.07, 0, ry, 0, false);
  if (posts) for (const o of [-w / 3, w / 3]) B('steel', 0.12, posts, 0.12, x + (fz ? o : 0), y + posts / 2, z + (fx ? o : 0));
}
function vending(x, z, y = 0, face = 's') {
  const ry = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[face], [fx, fz] = DIRV[face];
  B('paintRed', 0.9, 1.85, 0.75, x, y + 0.93, z, 0, ry, 0); B('screen', 0.6, 1.1, 0.02, x + fx * 0.38, y + 1.15, z + fz * 0.38, 0, ry, 0, false);
  PZ(x, y, z, fx ? 0.75 : 0.9, 1.85, fx ? 0.9 : 0.75);
}
function powerPole(x, z, y = 0, h = 8) { CYL('wood', 0.12, 0.16, h, 7, x, y + h / 2, z); B('wood', 1.6, 0.1, 0.1, x, y + h - 0.6, z); for (const o of [-0.7, 0, 0.7]) CYL('cloth1', 0.04, 0.04, 0.14, 6, x + o, y + h - 0.5, z, 0, 0, 0, false); PZ(x, y, z, 0.35, h, 0.35, { noRay: true }); }
function wire(ax, ay, az, bx, by, bz, sag = 0.6) { const n = 6; let px = ax, py = ay, pz = az; for (let i = 1; i <= n; i++) { const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, yy = ay + (by - ay) * t - Math.sin(t * Math.PI) * sag; beam('dark', px, py, pz, x, yy, z, 0.02, 0.02, false); px = x; py = yy; pz = z; } }
function parasol(x, z, y = 0, col = 'awningRed') { CYL('steel', 0.025, 0.025, 2.3, 6, x, y + 1.15, z, 0, 0, 0, false); batchAdd(col, new THREE.ConeGeometry(1.25, 0.45, 8, 1, true), mat4(x, y + 2.3, z), false); }
function cafeTable(x, z, y = 0) { CYL('steel', 0.35, 0.35, 0.04, 14, x, y + 0.74, z); CYL('steel', 0.03, 0.03, 0.72, 6, x, y + 0.37, z, 0, 0, 0, false); for (const a of [0.3, 2.4, 4.4]) { const cx = x + Math.cos(a) * 0.6, cz = z + Math.sin(a) * 0.6; B('wood', 0.38, 0.04, 0.38, cx, y + 0.45, cz, 0, a, 0); B('wood', 0.38, 0.4, 0.04, cx + Math.cos(a) * 0.18, y + 0.66, cz + Math.sin(a) * 0.18, 0, a + Math.PI / 2, 0); } PZ(x, y, z, 0.8, 0.76, 0.8, { noRay: true }); }
function laundry(ax, ay, az, bx, by, bz) {
  wire(ax, ay, az, bx, by, bz, 0.25);
  const n = Math.floor(Math.hypot(bx - ax, bz - az) / 0.9);
  for (let i = 1; i < n; i++) { const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, yy = ay + (by - ay) * t - Math.sin(t * Math.PI) * 0.25; const ry = Math.atan2(bx - ax, bz - az) + Math.PI / 2; batchAdd(['cloth1', 'cloth2', 'cloth3'][i % 3], new THREE.PlaneGeometry(0.55, 0.7 + (i % 2) * 0.2), mat4(x, yy - 0.4, z, 0, ry, (Math.random() - 0.5) * 0.1), false); }
}
function flowerBox(x, z, y, alongX = true, w = 1.1) { B('terracotta', alongX ? w : 0.25, 0.22, alongX ? 0.25 : w, x, y + 0.11, z); for (let i = 0; i < 3; i++) batchAdd(i % 2 ? 'leaf' : 'olive', new THREE.IcosahedronGeometry(0.2, 0), mat4(x + (alongX ? (i - 1) * w / 3 : 0), y + 0.3, z + (alongX ? 0 : (i - 1) * w / 3)), false); }
function wallLamp(x, y, z, face) { const [fx, fz] = DIRV[face]; B('dark', 0.12, 0.3, 0.12, x + fx * 0.1, y, z + fz * 0.1, 0, 0, 0, false); B('signal', 0.14, 0.18, 0.14, x + fx * 0.2, y - 0.1, z + fz * 0.2, 0, 0, 0, false); }
function drainpipe(x, z, y0, y1) { CYL('dark', 0.05, 0.05, y1 - y0, 6, x, (y0 + y1) / 2, z, 0, 0, 0, false); }
function balcony(x, z, y, face, w = 2.2) {
  const [fx, fz] = DIRV[face], cx = x + fx * 0.45, cz = z + fz * 0.45;
  B('concrete', fz ? w : 0.9, 0.12, fz ? 0.9 : w, cx, y, cz);
  const ox = fx * 0.85, oz = fz * 0.85;
  B('dark', fz ? w : 0.04, 0.04, fz ? 0.04 : w, x + ox, y + 0.95, z + oz, 0, 0, 0, false);
  for (let i = 0; i <= 8; i++) { const f = (i / 8 - 0.5) * w; B('dark', 0.025, 0.9, 0.025, x + ox + (fz ? f : 0), y + 0.5, z + oz + (fx ? f : 0), 0, 0, 0, false); }
}
function puddle(x, z, y, s = 1.5) { batchAdd('puddle', new THREE.CircleGeometry(s, 14), mat4(x, y + 0.012, z, -Math.PI / 2, 0, Math.random() * 3, 1, 0.6 + Math.random() * 0.5, 1), false); }
function manhole(x, z, y) { batchAdd('dark', new THREE.CircleGeometry(0.4, 16), mat4(x, y + 0.012, z, -Math.PI / 2), false); }
function stripes(x, z, y, alongX, n, len = 2.6, key = 'paintWhite') { for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 0.9; floorQuad(x + (alongX ? 0 : o), z + (alongX ? o : 0), alongX ? len : 0.45, alongX ? 0.45 : len, y + 0.004, key, 1); } }
function rubbleScatter(x, z, y, r = 2, n = 8) { for (let i = 0; i < n; i++) { const s = 0.08 + Math.random() * 0.22, px = x + (Math.random() - 0.5) * 2 * r, pz = z + (Math.random() - 0.5) * 2 * r; if (!placeProp('rock' + (i % 3), mat4(px, y + s * 0.2, pz, Math.random() * 3, Math.random() * 3, Math.random() * 3, s * 2, s * 1.3, s * 2), { rock: 'concrete' })) batchAdd('concrete', new THREE.DodecahedronGeometry(s, 0), mat4(px, y + s * 0.4, pz)); } }
function paperScatter(x, z, y, r = 2, n = 6) { for (let i = 0; i < n; i++) batchAdd('cloth1', new THREE.PlaneGeometry(0.21, 0.3), mat4(x + (Math.random() - 0.5) * 2 * r, y + 0.01 + i * 0.001, z + (Math.random() - 0.5) * 2 * r, -Math.PI / 2, 0, Math.random() * 6), false); }
function trafficLightOld(x, z, y, face) {   // the street kind (face n/s/e/w); props2 has the newer one called trafficLight
  const [fx, fz] = DIRV[face]; CYL('dark', 0.07, 0.08, 3.6, 8, x, y + 1.8, z);
  B('dark', 0.32, 0.9, 0.28, x, y + 3.9, z); for (const [k, h] of [['redLight', 4.2], ['dark', 3.9], ['greenLight', 3.6]]) B(k, 0.18, 0.18, 0.04, x + fx * 0.15, y + h, z + fz * 0.15, 0, 0, 0, false);
  PZ(x, y, z, 0.25, 3.6, 0.25, { noRay: true });
}
function forklift(x, z, y = 0, alongX = true, col = 'paintYellow') {
  const r = alongX ? 0 : Math.PI / 2, f = (a, b) => [x + (alongX ? a : b), z + (alongX ? b : -a)];
  let [px, pz] = f(0, 0); B(col, 2.0, 1.0, 1.15, px, y + 0.75, pz, 0, r, 0);
  [px, pz] = f(-0.35, 0); B('dark', 0.9, 0.06, 1.05, px, y + 2.1, pz, 0, r, 0, false);
  for (const s of [-0.48, 0.48]) for (const a of [-0.75, 0.05]) { [px, pz] = f(a, s); B('dark', 0.05, 1.0, 0.05, px, y + 1.65, pz, 0, r, 0, false); }
  for (const s of [-0.35, 0.35]) { [px, pz] = f(1.1, s); B('dark', 0.1, 2.3, 0.1, px, y + 1.15, pz, 0, r, 0); [px, pz] = f(1.55, s * 0.8); B('steel', 0.9, 0.05, 0.12, px, y + 0.2, pz, 0, r, 0); }
  for (const a of [-0.65, 0.7]) for (const s of [-0.55, 0.55]) { [px, pz] = f(a, s); CYL('rubber', 0.3, 0.3, 0.22, 12, px, y + 0.3, pz, Math.PI / 2, r, 0); }
  PZ(x, y, z, alongX ? 2.6 : 1.2, 1.4, alongX ? 1.2 : 2.6);
}
function scaffold(x0, z0, x1, z1, y, h, face) {
  const alongX = Math.abs(z1 - z0) < 0.01, L = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0), [fx, fz] = DIRV[face];
  for (const off of [0.2, 1.4]) for (let t = 0; t <= L + 0.01; t += 2) { const px = (alongX ? Math.min(x0, x1) + t : x0) + fx * off, pz = (alongX ? z0 : Math.min(z0, z1) + t) + fz * off; CYL('steel', 0.03, 0.03, h, 6, px, y + h / 2, pz, 0, 0, 0, false); }
  for (let ly = 2; ly < h; ly += 2) { const cx = (x0 + x1) / 2 + fx * 0.8, cz = (z0 + z1) / 2 + fz * 0.8; B('wood', alongX ? L : 1.2, 0.05, alongX ? 1.2 : L, cx, y + ly, cz, 0, 0, 0, false); B('steel', alongX ? L : 0.03, 0.03, alongX ? 0.03 : L, cx + fx * 0.6, y + ly + 1, cz + fz * 0.6, 0, 0, 0, false); }
}
