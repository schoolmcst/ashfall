/* ================================================================== models: weapons, hands, soldiers */
const VM = {};
// decode a packed mesh once: base64 -> int16 positions (/4000 m), int8 normals (/127), uint16/32 indices
function unb64(s) { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
function unpackMesh(d) {
  if (d._u) return d._u;
  const pi = new Int16Array(unb64(d.p)), ni = new Int8Array(unb64(d.n)), ib = unb64(d.i);
  const p = new Float32Array(pi.length), n = new Float32Array(ni.length);
  for (let k = 0; k < pi.length; k++) p[k] = pi[k] / 4000;
  for (let k = 0; k < ni.length; k++) n[k] = ni[k] / 127;
  return (d._u = { p, n, i: d.w === 4 ? new Uint32Array(ib) : new Uint16Array(ib) });
}
const Bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const Cy = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);
const Sp = (r, a = 10, b = 8, ...rest) => new THREE.SphereGeometry(r, a, b, ...rest);
const HALF = Math.PI / 2;

function seg(parts, name) {
  const grp = new THREE.Group(); if (name) grp.name = name;
  const byMat = new Map();
  for (const p of parts) { if (!byMat.has(p.mat)) byMat.set(p.mat, []); byMat.get(p.mat).push(p); }
  byMat.forEach((list, mat) => { const m = new THREE.Mesh(mergeGeos(list), mat); m.castShadow = true; m.receiveShadow = true; grp.add(m); });
  return grp;
}
const Pt = (g, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => ({ g, mat, m: mat4(x, y, z, rx, ry, rz, sx, sy, sz) });
const ZCyl = (r, len, mat, x, y, zStart, seg = 10) => Pt(Cy(r, r, len, seg), mat, x, y, zStart - len / 2, HALF); // cylinder lying along -z, starting at zStart
const _up = new THREE.Vector3(0, 1, 0), _dir = new THREE.Vector3(), _mid = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1), _qq = new THREE.Quaternion();
// a tube between two points (forearms)
function tube(a, b, r0, r1, mat) {
  _dir.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = _dir.length(); _dir.normalize();
  _qq.setFromUnitVectors(_up, _dir); _mid.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return { g: Cy(r1, r0, len, 10), mat, m: new THREE.Matrix4().compose(_mid.clone(), _qq.clone(), _one) };
}

function buildViewmodelMaterials() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  VM.metalStd = std({ color: C(0x2a2d31), metalness: 0.85, roughness: 0.38, envMapIntensity: 1.3 });
  VM.steelStd = std({ color: C(0x60656b), metalness: 0.9, roughness: 0.3, envMapIntensity: 1.3 });
  initGunShaderLights();
  VM.metal = pbrMat(0x2a2d31, 0.85, 0.34);   // custom Cook-Torrance GGX shader (pbr.js)
  VM.steel = pbrMat(0x60656b, 0.9, 0.26);
  VM.poly = std({ color: C(0x1a1b1d), metalness: 0.15, roughness: 0.6 });
  VM.wood = std({ color: C(0x6b4426), metalness: 0, roughness: 0.55, map: TEX.wood.map, bumpMap: TEX.wood.bump, bumpScale: 0.002 });
  VM.glove = std({ color: C(0x1d1f20), metalness: 0, roughness: 0.85 });
  VM.skin = std({ color: C(0x9c7355), roughness: 0.8 });
  VM.sleeve = std({ color: C(0x4b5240), roughness: 0.95, map: TEX.concrete.map, bumpMap: TEX.concrete.bump, bumpScale: 0.003 });
  VM.dot = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
  VM.lens = std({ color: C(0x223a44), metalness: 0.6, roughness: 0.05, transparent: true, opacity: 0.55 });
  VM.brass = std({ color: C(0xc9a24a), metalness: 0.9, roughness: 0.28, envMapIntensity: 1.3 });
}

// hands wrapped around a point; returns a group
function handPose(parts) { return seg(parts, 'hand'); }
function makeHandR(x, y, z) { // right hand gripping a pistol grip
  return seg([
    Pt(Bx(0.05, 0.075, 0.08), VM.glove, x + 0.03, y, z + 0.015),
    Pt(Bx(0.012, 0.022, 0.07), VM.glove, x - 0.012, y + 0.028, z, 0, 0, 0), Pt(Bx(0.012, 0.022, 0.07), VM.glove, x - 0.012, y + 0.004, z), Pt(Bx(0.012, 0.022, 0.065), VM.glove, x - 0.012, y - 0.02, z), Pt(Bx(0.012, 0.02, 0.055), VM.glove, x - 0.012, y - 0.042, z),
    Pt(Bx(0.02, 0.025, 0.07), VM.glove, x + 0.036, y + 0.045, z - 0.01, 0.2),
    tube([x + 0.04, y - 0.02, z + 0.04], [x + 0.12, y - 0.2, z + 0.52], 0.034, 0.05, VM.sleeve),
    tube([x + 0.04, y - 0.01, z + 0.04], [x + 0.052, y - 0.03, z + 0.07], 0.036, 0.04, VM.glove),
  ], 'handR');
}
function makeHandL(x, y, z, forward) { // left hand cupping a handguard / foregrip
  return seg([
    Pt(Bx(0.065, 0.045, 0.09), VM.glove, x, y - 0.045, z),
    Pt(Bx(0.012, 0.03, 0.06), VM.glove, x + 0.036, y + 0.0, z - forward * 0.03), Pt(Bx(0.012, 0.03, 0.06), VM.glove, x + 0.036, y + 0.0, z + forward * 0.0), Pt(Bx(0.012, 0.028, 0.055), VM.glove, x + 0.036, y + 0.0, z + forward * 0.03),
    Pt(Bx(0.022, 0.02, 0.07), VM.glove, x - 0.03, y + 0.03, z + 0.0, 0, 0, 0.3),
    tube([x - 0.02, y - 0.05, z + 0.05], [x - 0.15, y - 0.25, z + 0.46], 0.034, 0.05, VM.sleeve),
  ], 'handL');
}

// Build a part (group of meshes, one per material) from the Blender export; null if not available.
function blenderPart(gun, part, name) {
  const src = typeof GUNDATA !== 'undefined' && GUNDATA[gun] && GUNDATA[gun][part];
  if (!src) return null;
  const grp = new THREE.Group(); grp.name = name || part;
  for (const mk in src) {
    const d = unpackMesh(src[mk]), geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(d.p, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(d.n, 3));
    const uv = new Float32Array(d.p.length / 3 * 2);   // simple side projection so wood grain / textures map
    for (let i = 0, j = 0; i < d.p.length; i += 3, j += 2) { uv[j] = d.p[i + 2] * 4; uv[j + 1] = (d.p[i + 1] + d.p[i] * 0.5) * 4; }
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(new THREE.BufferAttribute(d.i, 1));
    const m = new THREE.Mesh(geo, VM[mk] || VM.metal); m.castShadow = true; m.receiveShadow = true; grp.add(m);
  }
  return grp;
}
const BP = (gun, part, fallback) => blenderPart(gun, part) || fallback();

function buildGuns() {
  const guns = [];
  // ---------- 0: M-ARC rifle
  { const g = new THREE.Group(), M = VM.metal, Pl = VM.poly, St = VM.steel;
    g.add(BP('rifle', 'body', () => seg([
      Pt(Bx(0.058, 0.075, 0.3), M, 0, 0.012, -0.12), Pt(Bx(0.054, 0.07, 0.2), M, 0, -0.035, -0.06),
      Pt(Bx(0.064, 0.07, 0.3), Pl, 0, 0.004, -0.42), Pt(Bx(0.026, 0.012, 0.58), St, 0, 0.05, -0.3), Pt(Bx(0.026, 0.01, 0.2), St, 0, 0.05, -0.55),
      ZCyl(0.011, 0.22, M, 0, 0.012, -0.57), ZCyl(0.018, 0.07, St, 0, 0.012, -0.71, 8),
      Pt(Bx(0.012, 0.04, 0.02), M, 0, 0.07, -0.58), Pt(Bx(0.05, 0.085, 0.2), Pl, 0, -0.012, 0.19), ZCyl(0.022, 0.14, M, 0, 0.0, 0.12),
      Pt(Bx(0.04, 0.1, 0.05), Pl, 0, -0.088, 0.02, 0.38), Pt(Bx(0.012, 0.03, 0.08), M, 0, -0.058, -0.02), Pt(Bx(0.008, 0.02, 0.012), M, 0, -0.055, -0.045),
      Pt(Bx(0.05, 0.03, 0.05), M, 0, 0.06, 0.1), Pt(Bx(0.022, 0.026, 0.05), M, 0.04, 0.02, -0.07),
      Pt(Bx(0.07, 0.012, 0.09), Pl, 0, 0.012, 0.25),
    ], 'body')));
    // red-dot optic
    const optic = BP('rifle', 'optic', () => seg([Pt(Bx(0.04, 0.05, 0.075), M, 0, 0.083, -0.1), ZCyl(0.021, 0.085, M, 0, 0.09, -0.07), Pt(Bx(0.032, 0.016, 0.05), M, 0, 0.06, -0.1)], 'optic')); g.add(optic);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.0175, 14), VM.lens); lens.position.set(0, 0.09, -0.06); g.add(lens);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.0022, 8), VM.dot); dot.position.set(0, 0.09, -0.0595); g.add(dot);
    const magG = new THREE.Group(); magG.position.set(0, -0.09, -0.12);
    magG.add(BP('rifle', 'mag', () => seg([Pt(Bx(0.034, 0.12, 0.062), Pl, 0, -0.04, 0, -0.14), Pt(Bx(0.036, 0.02, 0.066), M, 0, -0.1, -0.012, -0.14)], 'mag'))); g.add(magG);
    const handL = makeHandL(0.0, -0.01, -0.4, 1); g.add(handL); g.add(makeHandR(0.0, -0.095, 0.035));
    g.userData = { mag: magG, handL, handLBase: handL.position.clone(), len: 0.78, sightY: 0.09, adsZ: -0.3, stockOptic: [optic, lens, dot] };
    guns.push(g); }
  // ---------- 1: BREACHER shotgun
  { const g = new THREE.Group(), M = VM.metal, W = VM.wood, St = VM.steel;
    g.add(BP('shotgun', 'body', () => seg([
      Pt(Bx(0.06, 0.08, 0.3), M, 0, 0, -0.06), ZCyl(0.019, 0.62, M, 0, 0.018, -0.2), ZCyl(0.017, 0.5, St, 0, -0.026, -0.2), Pt(Bx(0.012, 0.012, 0.6), St, 0, 0.042, -0.5),
      Pt(Bx(0.056, 0.105, 0.3), W, 0, -0.025, 0.25, 0.08), Pt(Bx(0.05, 0.05, 0.12), W, 0, -0.01, 0.08),
      Pt(Bx(0.01, 0.016, 0.012), St, 0, 0.052, -0.82), Pt(Bx(0.012, 0.03, 0.09), M, 0, -0.055, 0.0), Pt(Bx(0.008, 0.02, 0.012), M, 0, -0.05, -0.03),
    ], 'body')));
    const pump = new THREE.Group(); pump.add(BP('shotgun', 'pump', () => seg([Pt(Bx(0.062, 0.052, 0.2), W, 0, -0.035, -0.46), Pt(Bx(0.066, 0.01, 0.2), VM.poly, 0, -0.012, -0.46)], 'pump')));
    const handL = makeHandL(0.0, -0.01, -0.46, 1); pump.add(handL); g.add(pump); g.add(makeHandR(0.0, -0.075, 0.07));
    g.userData = { pump, len: 0.86, sightY: 0.058, adsZ: -0.32 };
    guns.push(g); }
  // ---------- 2: SIDEARM pistol (two-handed grip)
  { const g = new THREE.Group(), M = VM.metal, Pl = VM.poly, St = VM.steel;
    const slide = BP('pistol', 'slide', () => seg([Pt(Bx(0.032, 0.042, 0.2), M, 0, 0.032, -0.06), Pt(Bx(0.034, 0.008, 0.02), St, 0, 0.056, 0.02), Pt(Bx(0.008, 0.014, 0.012), M, 0, 0.06, -0.15), ZCyl(0.008, 0.03, St, 0, 0.032, -0.16)], 'slide'));
    g.add(slide);
    g.add(BP('pistol', 'frame', () => seg([Pt(Bx(0.03, 0.03, 0.19), Pl, 0, 0.0, -0.05), Pt(Bx(0.032, 0.095, 0.052), Pl, 0, -0.062, 0.04, 0.2), Pt(Bx(0.01, 0.026, 0.07), Pl, 0, -0.025, -0.05), Pt(Bx(0.008, 0.02, 0.01), M, 0, -0.02, -0.015), Pt(Bx(0.034, 0.012, 0.056), M, 0, -0.112, 0.062, 0.2)], 'frame')));
    const handR = makeHandR(0.0, -0.05, 0.04); g.add(handR);
    const handL = seg([
      Pt(Bx(0.05, 0.075, 0.06), VM.glove, -0.04, -0.062, 0.045), Pt(Bx(0.012, 0.022, 0.06), VM.glove, 0.0, -0.035, 0.03), Pt(Bx(0.012, 0.022, 0.06), VM.glove, 0.0, -0.058, 0.03), Pt(Bx(0.012, 0.02, 0.05), VM.glove, 0.0, -0.08, 0.03),
      Pt(Bx(0.018, 0.02, 0.07), VM.glove, -0.02, -0.01, -0.03, 0, 0, 0.1),
      tube([-0.045, -0.07, 0.07], [-0.15, -0.22, 0.46], 0.034, 0.05, VM.sleeve),
    ], 'handL'); g.add(handL);
    g.userData = { slide, len: 0.2, sightY: 0.062, adsZ: -0.28, handL, handLBase: handL.position.clone() };
    guns.push(g); }
  return guns;
}

/* ------------------------------------------------------------------ soldiers */
const SOLD = { mats: {}, tpl: {} };
const CELL = { cloth: -1, skin: 0, vest: 1, pack: 2, helm: 3, goggle: 4, glove: 5, boot: 6, gun: 7 };
// one texture per soldier type: camouflage on top, flat colour swatches along the bottom row.
// Every body segment then merges into a single mesh (one draw call) whatever it is made of.
function seg1(parts, name, mat) {
  const grp = new THREE.Group(); if (name) grp.name = name;
  for (const p of parts) {
    const uv = p.g.attributes.uv.array;
    if (p.mat < 0) for (let i = 0; i < uv.length; i += 2) uv[i + 1] = 0.125 + 0.875 * uv[i + 1];
    else for (let i = 0; i < uv.length; i += 2) { uv[i] = (p.mat + 0.5) / 8; uv[i + 1] = 0.06; }
  }
  const m = new THREE.Mesh(mergeGeos(parts), mat); m.castShadow = true; m.receiveShadow = true; grp.add(m); return grp;
}
function soldierAtlas(camo, swatches) {
  const src = camoCanvas(camo[0], camo[1], camo[2], camo[3]);
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.drawImage(src, 0, 0, 128, 112);
  swatches.forEach((hx, i) => { g.fillStyle = '#' + hx.toString(16).padStart(6, '0'); g.fillRect(i * 16, 112, 16, 16); });
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
}
function buildSoldierTemplates() {
  const defs = {
    rifleman: { camo: [0x59604a, 0x3f4733, 0x2c3024, 21], sw: [0xc79a78, 0x2e332a, 0x3b3f31, 0x3d4535, 0x0d1214, 0x1c1d1e, 0x24201b, 0x1f2124] },
    scout: { camo: [0x8a7b5a, 0x6e6247, 0x51482f, 22], sw: [0xb98a68, 0x6b5f45, 0x5c5238, 0x7d704f, 0x0d1214, 0x1c1d1e, 0x3a3122, 0x1f2124] },
    heavy: { camo: [0x3c4043, 0x2c2f32, 0x202326, 23], sw: [0xa97c5c, 0x1c1e20, 0x25282a, 0x2a2d30, 0x0d1214, 0x1c1d1e, 0x141414, 0x1f2124] },
  };
  for (const k in defs) SOLD.mats[k] = new THREE.MeshStandardMaterial({ map: soldierAtlas(defs[k].camo, defs[k].sw), roughness: 0.85, metalness: 0.12 });
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hit = (geo, x, y, z, ud) => { const m = new THREE.Mesh(geo, hitMat); m.position.set(x, y, z); m.visible = false; m.userData = ud || {}; m.userData.hitbox = true; return m; };
  for (const key of ['rifleman', 'scout', 'heavy']) {
    const mat = SOLD.mats[key], v = CELL, heavy = key === 'heavy', scout = key === 'scout';
    const root = new THREE.Group(); root.name = 'root';
    const hips = new THREE.Bone(); hips.name = 'hips'; hips.position.y = 1.0; root.add(hips);
    hips.add(solSeg(key, 'pelvis', 'pelvis', mat) || seg1([Pt(Bx(0.34, 0.2, 0.22), v.cloth, 0, 0, 0), Pt(Bx(0.36, 0.05, 0.24), v.vest, 0, 0.08, 0)], 'pelvis', mat));
    hips.add(hit(Bx(0.4, 0.26, 0.3), 0, 0, 0, { mult: 0.9 }));
    const torso = new THREE.Bone(); torso.name = 'torso'; torso.position.y = 0.08; hips.add(torso);
    const tw = heavy ? 1.12 : 1;
    const tparts = [
      Pt(Bx(0.42 * tw, 0.52, 0.24), v.cloth, 0, 0.3, 0), Pt(Cy(0.055, 0.065, 0.1, 8), v.skin, 0, 0.6, 0), Pt(Bx(0.46 * tw, 0.46, 0.28), v.vest, 0, 0.32, 0),
      Pt(Bx(0.12, 0.14, 0.07), v.vest, -0.13, 0.2, 0.17), Pt(Bx(0.12, 0.14, 0.07), v.vest, 0.13, 0.2, 0.17), Pt(Bx(0.1, 0.12, 0.06), v.vest, 0, 0.2, 0.17),
      Pt(Bx(0.34, scout ? 0.3 : 0.42, 0.16), v.pack, 0, 0.34, -0.21), Pt(Bx(0.36 * tw, 0.08, 0.3), v.vest, 0, 0.56, 0),
    ];
    if (heavy) tparts.push(Pt(Bx(0.5, 0.3, 0.06), v.helm, 0, 0.38, 0.17), Pt(Bx(0.18, 0.2, 0.2), v.vest, -0.3, 0.55, 0), Pt(Bx(0.18, 0.2, 0.2), v.vest, 0.3, 0.55, 0));
    torso.add(solSeg(key, 'body', 'body', mat) || seg1(tparts, 'body', mat));
    torso.add(hit(Bx(0.5 * tw, 0.66, 0.34), 0, 0.3, 0, { mult: 1 }));
    const head = new THREE.Bone(); head.name = 'head'; head.position.set(0, 0.7, 0); torso.add(head);
    const hparts = [Pt(Sp(1, 12, 10), v.skin, 0, 0, 0, 0, 0, 0, 0.105, 0.13, 0.12), Pt(Bx(0.17, 0.045, 0.05), v.goggle, 0, 0.025, 0.105)];
    if (!scout) hparts.push(Pt(Sp(1, 14, 8, 0, TAU, 0, HALF), v.helm, 0, 0.035, 0, 0, 0, 0, 0.14, 0.125, 0.16), Pt(Cy(0.145, 0.15, 0.025, 14), v.helm, 0, 0.04, 0.0));
    else hparts.push(Pt(Sp(1, 12, 8, 0, TAU, 0, HALF), v.helm, 0, 0.04, -0.005, 0, 0, 0, 0.12, 0.085, 0.14), Pt(Bx(0.2, 0.02, 0.1), v.helm, 0, 0.045, 0.1));
    if (heavy) hparts.push(Pt(Bx(0.15, 0.1, 0.06), v.helm, 0, -0.07, 0.09));
    head.add(solSeg(key, 'head', 'headmesh', mat) || seg1(hparts, 'headmesh', mat));
    head.add(hit(Sp(0.16, 8, 6), 0, 0.02, 0, { head: true }));
    const arm = side => {
      const sx = side === 'L' ? -1 : 1, a = new THREE.Bone(); a.name = 'arm' + side; a.position.set(sx * 0.27 * tw, 0.5, 0); a.rotation.order = 'YXZ';
      a.add(solSeg(key, 'upper', 'upper', mat) || seg1([Pt(Cy(0.055, 0.05, 0.28, 8), v.cloth, 0, -0.14, 0), Pt(Sp(0.068, 8, 6), v.vest, 0, 0, 0)], 'upper', mat));
      a.add(hit(Bx(0.15, 0.3, 0.15), 0, -0.14, 0, { mult: 0.75 }));
      const el = new THREE.Bone(); el.name = 'elbow' + side; el.position.y = -0.28; el.rotation.order = 'YXZ'; a.add(el);
      el.add(solSeg(key, 'fore', 'fore', mat) || seg1([Pt(Cy(0.048, 0.04, 0.26, 8), v.cloth, 0, -0.13, 0), Pt(Bx(0.075, 0.09, 0.085), v.glove, 0, -0.3, 0)], 'fore', mat));
      el.add(hit(Bx(0.12, 0.34, 0.12), 0, -0.16, 0, { mult: 0.75 }));
      torso.add(a); return a;
    };
    arm('L'); arm('R');
    const leg = side => {
      const sx = side === 'L' ? -1 : 1, l = new THREE.Bone(); l.name = 'leg' + side; l.position.set(sx * 0.1, -0.02, 0);
      l.add(solSeg(key, 'thigh', 'thigh', mat) || seg1([Pt(Cy(0.08, 0.065, 0.46, 9), v.cloth, 0, -0.23, 0), Pt(Bx(0.1, 0.1, 0.05), v.vest, 0, -0.1, 0.09)], 'thigh', mat));
      l.add(hit(Bx(0.2, 0.48, 0.24), 0, -0.23, 0, { mult: 0.75 }));
      const k = new THREE.Bone(); k.name = 'knee' + side; k.position.y = -0.46; l.add(k);
      k.add(solSeg(key, 'shin', 'shin', mat) || seg1([Pt(Cy(0.065, 0.05, 0.44, 9), v.cloth, 0, -0.22, 0), Pt(Bx(0.1, 0.1, 0.22), v.boot, 0, -0.47, 0.05), Pt(Cy(0.06, 0.06, 0.13, 8), v.boot, 0, -0.4, 0), Pt(Bx(0.09, 0.07, 0.07), v.vest, 0, -0.04, 0.07)], 'shin', mat));
      k.add(hit(Bx(0.17, 0.54, 0.24), 0, -0.25, 0.02, { mult: 0.75 }));
      hips.add(l); return l;
    };
    leg('L'); leg('R');
    // rifle held at the hip/shoulder
    const gun = new THREE.Group(); gun.name = 'gun'; gun.position.set(0.1 * tw, 0.3, 0.2); torso.add(gun);
    gun.add(solSeg(key, 'gun', 'rifle', mat) || seg1([Pt(Bx(0.06, 0.1, 0.42), v.gun, 0, 0, 0.12), Pt(Bx(0.05, 0.1, 0.2), v.gun, 0, -0.01, -0.2), Pt(Cy(0.014, 0.014, 0.34, 8), v.gun, 0, 0.012, 0.6, HALF), Pt(Bx(0.034, 0.14, 0.06), v.gun, 0, -0.1, 0.1, -0.1), Pt(Bx(0.05, 0.05, 0.18), v.gun, 0, 0.012, 0.42), Pt(Bx(0.03, 0.04, 0.1), v.gun, 0, 0.075, 0.0)], 'rifle', mat));
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    fl.name = 'flash'; fl.position.set(0, 0.012, 0.95); fl.scale.set(0.55, 0.55, 1); fl.visible = false; gun.add(fl);
    skinify(root, key);
    root.userData.scale = scout ? 0.96 : heavy ? 1.12 : 1;
    root.scale.setScalar(root.userData.scale);
    SOLD.tpl[key] = root;
  }
}
function cloneSoldier(key) {
  const root = SOLD.tpl[key].clone(true), n = nm => root.getObjectByName(nm);
  bindSkin(root);
  const rig = { root, hips: n('hips'), torso: n('torso'), head: n('head'), armL: n('armL'), armR: n('armR'), elL: n('elbowL'), elR: n('elbowR'), legL: n('legL'), legR: n('legR'), knL: n('kneeL'), knR: n('kneeR'), gun: n('gun'), flash: n('flash'), hits: [] };
  root.traverse(o => { if (o.userData && o.userData.hitbox) rig.hits.push(o); });
  return rig;
}
