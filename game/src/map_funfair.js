/* ================================================================== THE OLD FUN FAIR (1.2.112): a HOTBOX HORDE mission map
   An abandoned fun fair about 96 m square at dusk, an original layout: the GATE with its sign in the south, THE MIDWAY
   (a wide path with a row of game booths and food stands) through the middle, THE CAROUSEL (west, a round platform under
   a striped canopy, painted horses on poles), THE BIG WHEEL (north-east: two A-frame legs, a ring of gondolas, a ticket
   booth), THE FUNHOUSE (north-west: a dark two-room maze with doorways), THE COASTER (the east edge: a track on pillars you
   can walk under), benches, lamp posts with warm lights. HOTBOX HORDE only (hhOnly). */
function ffMaterials() {
  if (MAT.ffRed) return; const std = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: C(c), roughness: 0.75 }, o || {}));
  MAT.ffRed = std(0xb83a3a); MAT.ffCream = std(0xe8dcc0); MAT.ffTeal = std(0x2a8a8a); MAT.ffGold = std(0xc8a040, { metalness: 0.5, roughness: 0.4 }); MAT.ffPurple = std(0x6a3a8a); MAT.ffRust = std(0x7a4a32, { metalness: 0.4, roughness: 0.8 });
  MAT.ffBulb = new THREE.MeshBasicMaterial({ color: C(0xffd890), toneMapped: false }); MAT.ffDark = std(0x1a1418, { roughness: 0.95 });
  const c = document.createElement('canvas'); c.width = 1024; c.height = 192; const x = c.getContext('2d'); x.fillStyle = '#2a1a2e'; x.fillRect(0, 0, 1024, 192); x.strokeStyle = '#ffd24a'; x.lineWidth = 10; x.strokeRect(10, 10, 1004, 172);
  for (let i = 0; i < 26; i++) { x.fillStyle = i % 2 ? '#ffd890' : '#ff6a5a'; x.beginPath(); x.arc(30 + i * 37.5, 24, 7, 0, 7); x.fill(); x.beginPath(); x.arc(30 + i * 37.5, 168, 7, 0, 7); x.fill(); }
  x.fillStyle = '#ffe8a8'; x.font = 'bold 92px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('THE OLD FUN FAIR', 512, 100);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; MAT.ffSign = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false });
}
function buildFunFair() {
  buildMap2Materials(); isleMaterials(); ffMaterials();
  floorQuad(0, 0, 170, 170, 0, 'ground', 10);
  floorQuad(0, 2, 12, 84, 0.008, 'asphalt', 8); floorQuad(0, -2, 70, 10, 0.01, 'asphalt', 8);   // THE MIDWAY and the cross path
  const r = stashRand(7311);
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + r() * 0.12, d = 44 + r() * 6; treeAt(Math.cos(a) * d, Math.sin(a) * d, 0, 0.7 + r() * 0.4); }
  // THE GATE (south)
  for (const s of [-1, 1]) { blk(s * 6, 40, 1.2, 1.2, 6.5, 'ffRed'); blk(s * 6, 40, 1.5, 1.5, 0.4, 'ffGold', { y: 6.5, noCol: true }); }
  blk(0, 40, 13.2, 0.5, 0.6, 'ffGold', { y: 6.9, noCol: true }); deco(new THREE.PlaneGeometry(11, 2.1), MAT.ffSign, 0, 8.3, 40.3, 0, Math.PI, 0, false); deco(new THREE.PlaneGeometry(11, 2.1), MAT.ffSign, 0, 8.3, 39.7, 0, 0, 0, false);
  for (const s of [-1, 1]) { blk(s * 9, 40, 1.4, 1.2, 1.3, 'ffCream'); blk(s * 9, 40, 1.6, 1.4, 0.15, 'ffRed', { y: 1.3 }); }   // ticket stands
  // THE MIDWAY: game booths both sides of the path
  const booth = (x, z, fx, col) => { const h = 2.6;   // a stall 3 m deep, 4 m wide, open toward fx (+1 = +x)
    blk(x - fx * 1.5, z, 0.2, 4, h, col); blk(x, z - 2, 3, 0.2, h, col); blk(x, z + 2, 3, 0.2, h, col); blk(x + fx * 1.1, z, 0.5, 3.6, 1.0, 'wood');
    blk(x, z, 3.8, 4.4, 0.12, 'ffCream', { y: h, noCol: true }); for (let i = 0; i < 5; i++) blk(x + fx * 1.75, z - 1.6 + i * 0.8, 0.5, 0.8, 0.05, i % 2 ? 'ffRed' : 'ffCream', { y: h - 0.05, noCol: true });
    for (let i = 0; i < 3; i++) deco(new THREE.SphereGeometry(0.22, 10, 8), [MAT.ffRed, MAT.ffTeal, MAT.ffGold][i], x + fx * 1.1, 1.25, z - 1 + i, 0, 0, 0, true); };
  const cols = ['ffRed', 'ffTeal', 'ffPurple', 'ffRed', 'ffTeal', 'ffPurple'];
  for (let i = 0; i < 6; i++) { const z = 26 - i * 8.5; if (Math.abs(z + 2) < 6) continue; booth(-9, z, 1, cols[i]); }
  for (let i = 0; i < 6; i++) { const z = 22 - i * 8.5; if (Math.abs(z + 2) < 6) continue; booth(9, z, -1, cols[(i + 3) % 6]); }
  // food stands on the cross path, benches, lamp posts with lights
  for (const [x, z] of [[-24, -7], [22, 4]]) { blk(x, z, 5, 2.4, 2.4, 'ffCream'); blk(x, z, 5.6, 3.0, 0.15, 'ffRed', { y: 2.4, noCol: true }); blk(x, z + 1.4, 4.2, 0.5, 1.0, 'ffRed'); }
  for (const [x, z, ax] of [[-4, 14, 0], [4, 14, 0], [-4, -16, 0], [4, -16, 0], [-14, -6, 1], [14, 2, 1]]) blk(x, z, ax ? 0.6 : 1.8, ax ? 1.8 : 0.6, 0.5, 'wood');
  for (const [x, z] of [[-4.5, 28], [4.5, 28], [-4.5, 6], [4.5, 6], [-4.5, -12], [4.5, -12], [-4.5, -30], [4.5, -30], [-20, -2], [20, -2]]) { blk(x, z, 0.25, 0.25, 4.2, 'dark'); deco(new THREE.SphereGeometry(0.28, 10, 8), MAT.ffBulb, x, 4.4, z, 0, 0, 0, false); lampLight(x, 4.2, z, 0xffc27a, 0.9, 14); }
  // THE CAROUSEL (west)
  const cx = -26, cz = 14; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; slab(cx + Math.cos(a) * 3.2, cz + Math.sin(a) * 3.2, 3.2, 3.2, 0.32, 'ffCream', 0.32); }
  slab(cx, cz, 4, 4, 0.32, 'ffGold', 0.32); blk(cx, cz, 1.2, 1.2, 4.6, 'ffGold', { y: 0.32 });
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, x = cx + Math.cos(a) * 4.4, z = cz + Math.sin(a) * 4.4; deco(new THREE.CylinderGeometry(0.05, 0.05, 4.3, 6), MAT.ffGold, x, 2.5, z, 0, 0, 0, false); rayAdd(new THREE.BoxGeometry(0.12, 4.3, 0.12), mat4(x, 2.5, z));
    const hg = new THREE.Group(); hg.position.set(x, 1.4 + (i % 2) * 0.35, z); hg.rotation.y = -a; scene.add(hg); const hm = [MAT.ffCream, MAT.ffTeal, MAT.ffPurple][i % 3];
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 1.1), hm); hg.add(b); const n = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 0.25), hm); n.position.set(0, 0.35, 0.5); n.rotation.x = -0.4; hg.add(n); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.45), hm); hd.position.set(0, 0.62, 0.68); hg.add(hd);
    for (const [lx, lz] of [[-0.12, -0.4], [0.12, -0.4], [-0.12, 0.4], [0.12, 0.4]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.08), hm); l.position.set(lx, -0.42, lz); l.rotation.x = lz > 0 ? -0.5 : 0.5; hg.add(l); } }
  const can = new THREE.Mesh(new THREE.ConeGeometry(6.4, 2.2, 20, 1, true), MAT.ffRed); can.position.set(cx, 5.8, cz); scene.add(can); const can2 = new THREE.Mesh(new THREE.ConeGeometry(6.42, 2.2, 20, 1, true), MAT.ffCream); can2.position.set(cx, 5.8, cz); can2.rotation.y = Math.PI / 20; can2.scale.set(1, 1, 1); scene.add(can2);
  for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; deco(new THREE.SphereGeometry(0.12, 8, 6), MAT.ffBulb, cx + Math.cos(a) * 6.3, 4.7, cz + Math.sin(a) * 6.3, 0, 0, 0, false); }
  lampLight(cx, 4.2, cz, 0xffd08a, 1.1, 16);
  // THE BIG WHEEL (north-east)
  const wx = 24, wz = -26, R = 10.5, hy = 12.5; slab(wx, wz, 9, 5, 0.3, 'concrete', 0.3);
  for (const s of [-1, 1]) for (const lx of [-1, 1]) { const g = new THREE.Mesh(new THREE.BoxGeometry(0.5, 13.5, 0.5), MAT.ffRust); g.position.set(wx + lx * 3.2, 6.6, wz + s * 1.6); g.rotation.z = -lx * 0.24; scene.add(g); g.castShadow = true; rayAdd(new THREE.BoxGeometry(0.5, 13.5, 0.5), g.matrixWorld.clone().compose(g.position, g.quaternion, g.scale)); }
  blk(wx - 3.2, wz - 1.6, 0.6, 0.6, 1.2, 'ffRust'); blk(wx + 3.2, wz - 1.6, 0.6, 0.6, 1.2, 'ffRust'); blk(wx - 3.2, wz + 1.6, 0.6, 0.6, 1.2, 'ffRust'); blk(wx + 3.2, wz + 1.6, 0.6, 0.6, 1.2, 'ffRust');
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.18, 6, 48), MAT.ffRust); ring.position.set(wx, hy, wz); scene.add(ring); const ring2 = ring.clone(); ring2.scale.setScalar(0.55); scene.add(ring2);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3.6, 12), MAT.ffGold); hub.rotation.x = Math.PI / 2; hub.position.set(wx, hy, wz); scene.add(hub);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, sp = new THREE.Mesh(new THREE.BoxGeometry(0.12, R, 0.12), MAT.ffRust); sp.position.set(wx + Math.cos(a) * R / 2, hy + Math.sin(a) * R / 2, wz); sp.rotation.z = a - Math.PI / 2; scene.add(sp);
    const gx = wx + Math.cos(a) * R, gy = hy + Math.sin(a) * R - 1.1, gm = [MAT.ffRed, MAT.ffTeal, MAT.ffGold, MAT.ffPurple][i % 4]; const gd = new THREE.Group(); gd.position.set(gx, gy, wz); scene.add(gd);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.4), gm); gd.add(cab); const rf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.6), MAT.ffCream); rf.position.y = 0.95; gd.add(rf); const rod = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.06), MAT.dark); rod.position.y = 0.6; gd.add(rod);
    if (gy < 2.5) { boxes.push(mkBox(gx, wz, 1.6, 1.4, 1.0, { y: gy - 0.5 })); rayAdd(new THREE.BoxGeometry(1.6, 1.0, 1.4), mat4(gx, gy, wz)); } }
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; deco(new THREE.SphereGeometry(0.1, 6, 5), MAT.ffBulb, wx + Math.cos(a) * R, hy + Math.sin(a) * R, wz + 0.25, 0, 0, 0, false); }
  blk(wx - 7, wz + 4, 2.4, 2.0, 2.4, 'ffTeal'); blk(wx - 7, wz + 4, 2.8, 2.4, 0.15, 'ffRed', { y: 2.4, noCol: true }); lampLight(wx, 3.5, wz + 3, 0xffc27a, 1.0, 14);
  // THE FUNHOUSE (north-west): two dark rooms and a maze
  const fx = -22, fz = -22, W = 14, D = 12, Hh = 4;
  wall(fx - W / 2, fz + D / 2, fx + W / 2, fz + D / 2, Hh, 'ffPurple', { holes: [{ at: 4, w: 2.2, h: 2.6 }, { at: 10.5, w: 2.2, h: 2.6 }] });
  wall(fx - W / 2, fz - D / 2, fx + W / 2, fz - D / 2, Hh, 'ffPurple', { holes: [{ at: 7, w: 2.0, h: 2.4 }] });
  wall(fx - W / 2, fz - D / 2, fx - W / 2, fz + D / 2, Hh, 'ffPurple'); wall(fx + W / 2, fz - D / 2, fx + W / 2, fz + D / 2, Hh, 'ffPurple', { holes: [{ at: 6, w: 2.0, h: 2.4 }] });
  wall(fx, fz - D / 2, fx, fz + D / 2, Hh, 'ffDark', { t: 0.3, holes: [{ at: 3, w: 1.8, h: 2.4 }, { at: 9, w: 1.8, h: 2.4 }] });
  for (const [x0, z0, x1, z1] of [[fx - 5, fz - 2, fx - 1.5, fz - 2], [fx - 3.5, fz + 1.5, fx - 3.5, fz + 5], [fx + 2, fz - 3, fx + 5.5, fz - 3], [fx + 3.5, fz + 0.5, fx + 3.5, fz + 4]]) wall(x0, z0, x1, z1, 2.6, 'ffDark', { t: 0.25 });
  slab(fx, fz, W + 0.4, D + 0.4, Hh + 0.3, 'ffDark', 0.3);
  for (let i = 0; i < 7; i++) deco(new THREE.SphereGeometry(0.16, 8, 6), MAT.ffBulb, fx - 6 + i * 2, Hh + 0.6, fz + D / 2 + 0.2, 0, 0, 0, false);
  blk(fx, fz + D / 2 + 0.35, 6, 0.1, 1.4, 'ffGold', { y: Hh - 1.4, noCol: true }); lampLight(fx - 3.5, 2.4, fz, 0xc070ff, 0.9, 9); lampLight(fx + 3.5, 2.4, fz, 0xff6a9a, 0.9, 9);
  // THE COASTER (east edge): a track on pillars you can walk under
  for (let i = 0; i < 15; i++) { const z = -34 + i * 5, h = 5 + Math.sin(i * 0.7) * 2.5; blk(36, z, 0.5, 0.5, h, 'ffRust'); blk(36, z, 2.0, 0.6, 0.25, 'ffRust', { y: h, noCol: true }); if (i < 14) { const h2 = 5 + Math.sin((i + 1) * 0.7) * 2.5, L = Math.hypot(5, h2 - h), m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, L), MAT.ffRed); m.position.set(36, (h + h2) / 2 + 0.3, z + 2.5); m.rotation.x = -Math.atan2(h2 - h, 5); scene.add(m); m.castShadow = true; } }
  const car = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 2.2), MAT.ffTeal); car.position.set(36, 5 + Math.sin(3 * 0.7) * 2.5 + 0.8, -34 + 3 * 5); scene.add(car);
  // a few crates and barrels for cover round the yard
  for (const [x, z] of [[-30, 30], [28, 24], [30, 10], [-34, -4], [12, -38], [-10, -36], [16, 16], [-16, 22]]) blk(x, z, 1.3, 1.3, 1.1, 'wood');
}
defineMap({
  id: 'funfair', hidden: true, hhOnly: true, name: 'THE OLD FUN FAIR', place: 'An abandoned fun fair at dusk', desc: 'Rides, a funhouse, a big wheel and a coaster: a HOTBOX HORDE mission map.',
  play: [-46, 46, -46, 46], arena: 50, build: buildFunFair,
  env: { top: 0x2a2a5a, horizon: 0xe8906a, fog: 0.012, sun: [-60, 18, 30], sunCol: 0xffb07a, sunI: 0.9, skySun: 0xffa07a, hemiSky: 0x7a6aa0, hemiGround: 0x3a3028, exposure: 1.05 },
  grass: { count: 1800, avoid: (x, z) => Math.abs(x) < 8 || Math.abs(z + 2) < 6 }, spawnMaxY: 0.6,
  layout: {
    spawn: [{ x: 0, z: 34 }, { x: 0, z: -36 }],
    hp: [{ x: 0, z: -2 }, { x: -26, z: 14 }, { x: 24, z: -20 }],
    flags: [{ x: 0, z: 32 }, { x: 0, z: -34 }],
    sites: [{ x: -26, z: 14, n: 'A' }, { x: 24, z: -20, n: 'B' }],
  },
  menu: { x: 0, z: 30, r: 14, y: 2.4 },
  navPts: [{ x: 0, z: 34 }, { x: 0, z: -2 }, { x: -26, z: 20 }, { x: 24, z: -18 }, { x: -22, z: -22 }, { x: 33, z: 0 }, { x: -12, z: -36 }],
  views: [[0, 1.7, 36, 0, 3, 0], [-10, 2, 0, -26, 3, 14], [10, 2, -8, 24, 8, -26], [-22, 1.6, -12, -22, 1.6, -22]],
});
