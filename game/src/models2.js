/* ================================================================== Blender models: soldiers + props (ashfall_blender_build2.py) */
const MGEO = {};
function hasModel(group, part) { return typeof MODELS !== 'undefined' && !!(MODELS[group] && MODELS[group][part]); }
// { materialName: BufferGeometry } for one exported part (cached; callers clone before modifying)
function modelGeos(group, part) {
  const id = group + '/' + part;
  if (MGEO[id]) return MGEO[id];
  if (!hasModel(group, part)) return null;
  const src = MODELS[group][part], out = {};
  for (const mk in src) {
    const d = unpackMesh(src[mk]), geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(d.p.slice(), 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(d.n.slice(), 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(d.p.length / 3 * 2), 2));
    geo.setIndex(new THREE.BufferAttribute(d.i, 1));
    out[mk] = geo;
  }
  return (MGEO[id] = out);
}
// world-space box projection: each vertex takes the two axes perpendicular to its dominant normal
function boxUV(geo, tile) {
  const p = geo.attributes.position.array, n = geo.attributes.normal.array, uv = geo.attributes.uv.array;
  for (let i = 0, j = 0; i < p.length; i += 3, j += 2) {
    const ax = Math.abs(n[i]), ay = Math.abs(n[i + 1]), az = Math.abs(n[i + 2]);
    if (ax >= ay && ax >= az) { uv[j] = p[i + 2] / tile; uv[j + 1] = p[i + 1] / tile; }
    else if (ay >= az) { uv[j] = p[i] / tile; uv[j + 1] = p[i + 2] / tile; }
    else { uv[j] = p[i] / tile; uv[j + 1] = p[i + 1] / tile; }
  }
}
const PROP_MAT = { steel: 'metal', pickup: 'metal' };
// add a prop to the static batches (merged per material)
function placeProp(part, matrix, matMap = {}, shadow = true) {
  const geos = modelGeos('props', part); if (!geos) return false;
  for (const mk in geos) {
    const key = matMap[mk] || PROP_MAT[mk] || mk; if (!MAT[key]) continue;
    const g = geos[mk].clone(); g.applyMatrix4(matrix); boxUV(g, (TILES[key] || 1.5) * (key === 'bark' ? 0.5 : 1));
    batchAdd(key, g, null, shadow && key !== 'leaf');
  }
  return true;
}
// invisible box used for bullets / line-of-sight when the visible prop lives in a merged batch
const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
function proxyCollider(x, z, w, d, h, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), proxyMat); m.position.set(x, h / 2, z); m.rotation.y = ry; m.visible = false; scene.add(m);
  const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
  addCollider(x, z, w * c + d * s, w * s + d * c, h, m); return m;
}
// a free-standing mesh group from a prop (pickups, grenades)
function propGroup(part, mats) {
  const geos = modelGeos('props', part); if (!geos) return null;
  const g = new THREE.Group();
  for (const mk in geos) { const m = new THREE.Mesh(geos[mk], mats[mk] || mats.default); m.castShadow = true; g.add(m); }
  return g;
}

// soldier segment: all materials merged into one mesh that samples the soldier's texture atlas
const SOLCELL = { cloth: -1, skin: 0, vest: 1, pack: 2, helm: 3, goggle: 4, glove: 5, boot: 6, gun: 7, steel: 7, dark: 4 };
function solSeg(key, part, name, mat) {
  const geos = modelGeos(key, part); if (!geos) return null;
  const list = [];
  for (const mk in geos) {
    const g = geos[mk].clone(), p = g.attributes.position.array, uv = g.attributes.uv.array, cell = SOLCELL[mk] !== undefined ? SOLCELL[mk] : 1;
    if (cell < 0) { // camo: planar projection normalised to this segment's extent
      let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
      for (let i = 0; i < p.length; i += 3) { const u = p[i] * 0.8 + p[i + 2] * 0.6, v = p[i + 1]; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
      const su = 0.96 / Math.max(u1 - u0, 0.05), sv = 0.84 / Math.max(v1 - v0, 0.05);
      for (let i = 0, j = 0; i < p.length; i += 3, j += 2) { uv[j] = 0.02 + (p[i] * 0.8 + p[i + 2] * 0.6 - u0) * su; uv[j + 1] = 0.14 + (p[i + 1] - v0) * sv; }
    } else for (let j = 0; j < uv.length; j += 2) { uv[j] = (cell + 0.5) / 8; uv[j + 1] = 0.06; }
    list.push({ g });
  }
  const grp = new THREE.Group(); grp.name = name;
  const m = new THREE.Mesh(mergeGeos(list), mat); m.castShadow = true; m.receiveShadow = true; grp.add(m);
  return grp;
}

/* ---------- soldiers as one skinned mesh each: every body segment is rigidly weighted to its bone.
   One draw call (plus the rifle) instead of eleven, and the bones animate exactly as the segment groups did. */
const SKIN_BONES = ['hips', 'torso', 'head', 'armL', 'elbowL', 'armR', 'elbowR', 'legL', 'kneeL', 'legR', 'kneeR'];
SOLD.skinMats = {};
function skinify(root, key) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), rel = new THREE.Matrix4(), nm = new THREE.Matrix3();
  const pos = [], nor = [], uv = [], si = [], sw = [], idx = [], drop = [];
  let base = 0, mat = null;
  SKIN_BONES.forEach((bn, bi) => {
    const bone = root.getObjectByName(bn); if (!bone) return;
    for (const seg of bone.children) {
      if (seg.isBone || !seg.children || seg.name === 'gun') continue;
      for (const m of seg.children) {
        if (!m.isMesh || (m.userData && m.userData.hitbox)) continue;
        mat = mat || m.material;
        m.updateMatrixWorld(true); rel.multiplyMatrices(inv, m.matrixWorld); nm.getNormalMatrix(rel);
        const g = m.geometry, p = g.attributes.position.array, n = g.attributes.normal.array, u = g.attributes.uv ? g.attributes.uv.array : null;
        const v = new THREE.Vector3();
        for (let i = 0; i < p.length; i += 3) {
          v.set(p[i], p[i + 1], p[i + 2]).applyMatrix4(rel); pos.push(v.x, v.y, v.z);
          v.set(n[i], n[i + 1], n[i + 2]).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
          si.push(bi, 0, 0, 0); sw.push(1, 0, 0, 0);
        }
        if (u) for (let i = 0; i < u.length; i++) uv.push(u[i]); else for (let i = 0; i < p.length / 3; i++) uv.push(0, 0);
        if (g.index) { const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx.push(ia[i] + base); } else for (let i = 0; i < p.length / 3; i++) idx.push(base + i);
        base += p.length / 3;
        drop.push(seg);
      }
    }
  });
  if (!base) return;
  for (const s of new Set(drop)) s.parent.remove(s);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  geo.setIndex(idx);
  let sm = SOLD.skinMats[key];
  if (!sm) { sm = SOLD.skinMats[key] = mat.clone(); sm.skinning = true; }
  const mesh = new THREE.SkinnedMesh(geo, sm); mesh.name = 'skin'; mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.frustumCulled = false;   // ragdolls move the bones away from the bind-pose bounds
  root.add(mesh);
}
// a cloned soldier needs its own skeleton made from its own bones
function bindSkin(root) {
  const mesh = root.getObjectByName('skin'); if (!mesh || !mesh.isSkinnedMesh) return;
  const bones = SKIN_BONES.map(n => root.getObjectByName(n));
  const p = root.position.clone(), q = root.quaternion.clone(), s = root.scale.clone();
  root.position.set(0, 0, 0); root.quaternion.identity();   // bind in rest pose at the origin
  root.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));
  root.position.copy(p); root.quaternion.copy(q); root.scale.copy(s); root.updateMatrixWorld(true);
}
