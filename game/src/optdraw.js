/* ================================================================== OPTIMISATION: drawing less (1.2.114, the owner's optimisation list O6-O20)
   O6  BIG MAPS IN CHUNKS: the scenery used to be merged into one mesh per material for the whole map, so nothing was
       ever skipped. On maps wider than 150 m (STASH ISLAND) it is merged per 64 m square instead, and the squares off
       screen are not drawn (frustum culling).
   O7  SIZE CULLING: loose small meshes (decorations, bulbs, props that aren't merged) are not drawn past a distance that
       grows with their size. (True occlusion culling needs GPU queries this renderer doesn't have.)
   O8  SOLDIER DETAIL: past 35 m the small parts of a soldier (eyes, scarf, sights, attachments) are hidden.
   O9  FAR SHADOWS: on big maps, scenery squares far from you stop casting shadows.
   O10 AUTO-INSTANCING: identical loose decorations (same shape, same material, 4 or more) become one instanced draw.
   O11 + O47 FAR BOTS animate every 3rd frame (with 3x the time step) past 40 m, and not at all off screen.
   O12 GRASS fades out with distance (the vertex shader shrinks far blades to nothing, so they cost no pixels).
   O13 PARTICLES: smoke/fire sprites and debris chunks were one draw call each (up to ~370); now 2 + 7 instanced draws.
   O14 decals were already pooled (70) and now fade (gfxfx.js). O16: shadows already follow you within SHADOW DISTANCE.
   O15 HORDE BASES: finished base pieces are merged by material (one draw per material); a piece that gets hit, edited
       or removed comes back out of the merge until things settle.
   O17 SHADOWS are redrawn every 2nd frame on MEDIUM and HIGH (every frame on ULTRA).
   O18 a separate static shadow cache isn't possible with this renderer's shadows; O17 covers most of the saving.
   O19 MAP LAMPS: maps with more than 8 lamps keep 6 real lights, moved to the lamps nearest you (every light costs
       every lit pixel on screen). The lamps' glowing bulbs stay.
   O20 SMALL THINGS (under 0.6 m) cast no shadows. */
const OD = { chunk: 0, lamps: [], lampPool: [], frame: 0, cull: [], inst: [], hhGroups: [], hhDirty: 0, sp: null, ch: {} };
/* ---------- O6 + O9: chunked batches on big maps */
const _odFlush = flushBatches;
flushBatches = function () {
  const pr = PLAYRECT || [-44, 44, -44, 44], span = Math.max(pr[1] - pr[0], pr[3] - pr[2]); if (span <= 150) { OD.chunk = 0; return _odFlush.apply(this, arguments); }
  OD.chunk = 80; const C2 = OD.chunk;
  for (const id in batches) { const b = batches[id], cells = new Map(); let tri = 0; for (const p of b.list) tri += (p.g.index ? p.g.index.count : p.g.attributes.position.count) / 3;
    if (tri < 20000) { const m = new THREE.Mesh(mergeGeos(b.list), MAT[b.key]); m.castShadow = b.shadow; m.receiveShadow = true; scene.add(m); delete batches[id]; continue; }
    for (const p of b.list) { let x = 0, z = 0; if (p.m) { x = p.m.elements[12]; z = p.m.elements[14]; } else { try { p.g.computeBoundingSphere(); x = p.g.boundingSphere.center.x; z = p.g.boundingSphere.center.z; } catch (e) {} } const k = Math.floor(x / C2) + ',' + Math.floor(z / C2); (cells.get(k) || cells.set(k, []).get(k)).push(p); }
    for (const [k, list] of cells) { const m = new THREE.Mesh(mergeGeos(list), MAT[b.key]); m.castShadow = b.shadow; m.receiveShadow = true; m.geometry.computeBoundingSphere(); m.userData.odChunk = true; m.userData.odShadow = b.shadow; scene.add(m); }
    delete batches[id]; }
};
function odFarShadows() { if (!OD.chunk) return; const cx = camera.position.x, cz = camera.position.z, far = Math.max(60, (S.shadowDist || 100) * 0.9); for (const o of scene.children) if (o.userData.odChunk && o.userData.odShadow) { const c = o.geometry.boundingSphere.center; o.castShadow = Math.hypot(c.x - cx, c.z - cz) - o.geometry.boundingSphere.radius < far; } }
/* ---------- O7 + O10 + O20: loose meshes after a map is built */
function odScan() {
  OD.cull = []; const groups = new Map();
  for (const o of scene.children.slice()) {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.children.length || o.userData.odChunk || !o.geometry || !o.material || Array.isArray(o.material) || o.material.transparent || o.visible === false) continue;
    if (o === sky || o.renderOrder < 0) continue; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const r = o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z); if (r > 6) continue;
    if (r < 0.6) o.castShadow = false;
    const gp = o.geometry.parameters && r < 1.0 && !o.name && !Object.keys(o.userData).length ? o.geometry.type + JSON.stringify(o.geometry.parameters) : null; if (gp) { const k = gp + '|' + o.material.uuid; (groups.get(k) || groups.set(k, []).get(k)).push(o); } else OD.cull.push({ o, r });
  }
  for (const [k, list] of groups) {
    if (list.length < 4) { for (const o of list) { o.geometry.computeBoundingSphere(); OD.cull.push({ o, r: o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z) }); } continue; }
    const im = new THREE.InstancedMesh(list[0].geometry, list[0].material, list.length); im.castShadow = list[0].castShadow; im.receiveShadow = list[0].receiveShadow;
    list.forEach((o, i) => { o.updateMatrix(); im.setMatrixAt(i, o.matrix); scene.remove(o); }); im.instanceMatrix.needsUpdate = true; im.userData.odInst = true; scene.add(im); OD.inst.push(im);
  }
}
function odCullTick() { const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z; for (const q of OD.cull) { const p = q.o.position, d = Math.hypot(p.x - cx, p.y - cy, p.z - cz), far = d > 25 + q.r * 140; if (far) { if (q.o.visible) { q.o.visible = false; q.hid = true; } } else if (q.hid) { q.o.visible = true; q.hid = false; } } }
/* ---------- O8 + O11: soldiers far away */
const _odAnim = animEnemy;
animEnemy = function (e, dt, sp) {
  const g = e.group; if (!g) return _odAnim.apply(this, arguments); const d = Math.hypot(g.position.x - camera.position.x, g.position.z - camera.position.z);
  if (d > 40 && !G.noRender) { e.odSkip = (e.odSkip || 0) + 1; e.odDt = (e.odDt || 0) + dt; if (e.odSkip % 3 !== 0) return; dt = e.odDt; e.odDt = 0; } else e.odDt = 0;
  const r = _odAnim.call(this, e, dt, sp);
  const far = d > 35; if (e.odFar !== far) { e.odFar = far; if (e.gcEyes) e.gcEyes.visible = !far; if (e.gcTail) e.gcTail.visible = !far; if (e.gunMesh || e.rig.gun) { const gun = e.rig.gun; if (gun) gun.traverse(o => { if (o.isMesh && o !== gun && o.geometry) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if (o.geometry.boundingSphere.radius < 0.06) o.visible = !far; } }); } }
  return r;
};
/* ---------- O12: grass fades with distance */
function odGrass() {
  if (!grassMesh || !grassMesh.material || grassMesh.material.odG) return; const m = grassMesh.material; m.odG = true; const prev = m.onBeforeCompile, pk = m.customProgramCacheKey;
  m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.uniforms.odGrassFar = OD.grassFar || (OD.grassFar = { value: 45 }); sh.vertexShader = 'uniform float odGrassFar;\n' + sh.vertexShader.replace('#include <project_vertex>', '#ifdef USE_INSTANCING\n{ vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]); float gd = distance((modelMatrix * vec4(ip, 1.0)).xz, cameraPosition.xz); transformed *= 1.0 - smoothstep(odGrassFar * 0.75, odGrassFar, gd); }\n#endif\n#include <project_vertex>'); };
  m.customProgramCacheKey = () => (pk ? pk.call(m) : '') + '|odg'; m.needsUpdate = true;
}
/* ---------- O13: particles in instanced draws */
function odChunks() {
  for (const k in chunkPools) { const P0 = chunkPools[k]; let im = OD.ch[k]; if (!im) { const m0 = P0.list[0].m; im = new THREE.InstancedMesh(m0.geometry, m0.material, P0.list.length); im.count = 0; im.frustumCulled = false; im.castShadow = false; scene.add(im); OD.ch[k] = im; }
    let n = 0; for (const c of P0.list) { if (!c.on) continue; c.m.updateMatrix(); im.setMatrixAt(n++, c.m.matrix); c.m.visible = false; } im.count = n; if (n) im.instanceMatrix.needsUpdate = true; }
}
const OD_SPR_VS = 'attribute vec4 iCol; attribute vec3 iMisc; varying vec4 vCol; varying vec2 vUv2; varying float vTex;\nvoid main(){ vCol = iCol; vTex = iMisc.z; float c = cos(iMisc.x), s = sin(iMisc.x); vec2 q = vec2(position.x * c - position.y * s, position.x * s + position.y * c) * iMisc.y; vUv2 = uv;\n  vec4 mv = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.0); mv.xy += q; gl_Position = projectionMatrix * mv; }';
const OD_SPR_FS = 'uniform sampler2D t0; uniform sampler2D t1; uniform sampler2D t2; varying vec4 vCol; varying vec2 vUv2; varying float vTex;\nvoid main(){ vec4 tx = vTex < 0.5 ? texture2D(t0, vUv2) : vTex < 1.5 ? texture2D(t1, vUv2) : texture2D(t2, vUv2); gl_FragColor = vec4(tx.rgb * vCol.rgb, tx.a * vCol.a); if (gl_FragColor.a < 0.004) discard;\n #include <encodings_fragment>\n}';
function odSprInit() {
  if (OD.sp) return; const mk = add => { const g = new THREE.InstancedBufferGeometry(); const q = new THREE.PlaneGeometry(1, 1); g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
    const n = spritePool.length; g.setAttribute('iCol', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4)); g.setAttribute('iMisc', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3));
    const mat = new THREE.ShaderMaterial({ uniforms: { t0: { value: TEX.smoke }, t1: { value: TEX.fire }, t2: { value: TEX.flash } }, vertexShader: OD_SPR_VS, fragmentShader: OD_SPR_FS, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: !add });
    const im = new THREE.InstancedMesh(g, mat, n); im.count = 0; im.frustumCulled = false; im.renderOrder = add ? 3 : 2; scene.add(im); return im; };
  OD.sp = { n: mk(false), a: mk(true) };
}
const _odM = new THREE.Matrix4();
function odSprites() {
  odSprInit(); const L = { n: [], a: [] };
  for (const p of spritePool) { if (!p.on) continue; const m = p.s.material, add = m.blending === THREE.AdditiveBlending; (add ? L.a : L.n).push(p); p.s.visible = false; }
  for (const k of ['n', 'a']) { const im = OD.sp[k], list = L[k], col = im.geometry.attributes.iCol, mi = im.geometry.attributes.iMisc; if (!im.parent) scene.add(im);
    list.forEach((p, i) => { const m = p.s.material; _odM.makeTranslation(p.s.position.x, p.s.position.y, p.s.position.z); im.setMatrixAt(i, _odM); col.setXYZW(i, m.color.r, m.color.g, m.color.b, m.opacity); mi.setXYZ(i, m.rotation, p.s.scale.x, m.map === TEX.fire ? 1 : m.map === TEX.flash ? 2 : 0); });
    im.count = list.length; if (list.length) { im.instanceMatrix.needsUpdate = true; col.needsUpdate = true; mi.needsUpdate = true; } }
}
/* ---------- O15: HORDE base pieces merged */
function odHH() {
  const H = typeof M !== 'undefined' && M && M.hh; if (!H || !H.base) { if (OD.hhGroups.length) odHHClear(); return; }
  for (const p of H.pieces) { if (p.odHp !== undefined && p.odHp !== p.hp) { OD.hhDirty = 2; } p.odHp = p.hp; }
  const key = H.pieces.length + ':' + H.pieces.filter(p => p.frozen).length; if (key !== OD.hhKey) { OD.hhKey = key; OD.hhDirty = Math.max(OD.hhDirty, 1.5); }
  if (OD.hhDirty > 0) { if (OD.hhGroups.length) odHHClear(); OD.hhDirty -= 1 / 4; return; }
  if (OD.hhGroups.length || H.pieces.length < 20) return;
  const groups = new Map();
  for (const p of H.pieces) { if (!p.frozen || p.id === 'plot' || HH_TRAPS[p.id]) continue; for (const m of p.meshes) { if (!m.isMesh || !m.material || !m.visible) continue; const k = m.material.color.getHexString() + '|' + (m.material.map ? m.material.map.uuid : ''); (groups.get(k) || groups.set(k, []).get(k)).push(m); } }
  for (const [k, list] of groups) { if (list.length < 3) continue; const parts = list.map(m => { m.updateMatrixWorld(); return { g: m.geometry, m: m.matrixWorld }; }); const mesh = new THREE.Mesh(mergeGeos(parts), list[0].material); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); for (const m of list) m.visible = false; OD.hhGroups.push({ mesh, list }); }
}
function odHHClear() { for (const g of OD.hhGroups) { scene.remove(g.mesh); g.mesh.geometry.dispose(); for (const m of g.list) m.visible = true; } OD.hhGroups = []; }
/* ---------- O19: map lamps pooled */
const _odLamp = lampLight;
lampLight = function (x, y, z, col, i, dist) { const l = _odLamp.apply(this, arguments); OD.lamps.push(l); return l; };
function odLampSetup() {
  for (const l of OD.lampPool) if (l.parent) l.parent.remove(l); OD.lampPool = [];
  const L = OD.lamps.filter(l => l.parent === scene && l.isPointLight); OD.mapLamps = []; if (L.length <= 8 || S.odLampsOff) return;
  for (const l of L) { OD.mapLamps.push({ x: l.position.x, y: l.position.y, z: l.position.z, col: l.color.clone(), i: l.intensity, d: l.distance, l }); scene.remove(l); }
  for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffffff, 0, 14, 2); scene.add(l); OD.lampPool.push(l); }
  odLampTick(true);
}
function odLampTick(force) {
  if (!OD.mapLamps || !OD.mapLamps.length) return; if (!force && (OD.lampT = (OD.lampT || 0) - 1) > 0) return; OD.lampT = 15;
  const cx = camera.position.x, cz = camera.position.z, near = OD.mapLamps.map(q => [q, Math.hypot(q.x - cx, q.z - cz)]).sort((a, b) => a[1] - b[1]).slice(0, 6);
  OD.lampPool.forEach((l, i) => { const q = near[i] && near[i][0]; if (!q) { l.intensity = 0; return; } l.position.set(q.x, q.y, q.z); l.color.copy(q.col); l.distance = q.d; l.intensity = q.l.intensity !== undefined ? q.l.intensity : q.i; });
}
/* ---------- O17: shadows every 2nd frame below ULTRA */
function odShadowTick() { const every = /^(ultra|ultraplus)$/.test(qKey()) ? 1 : 2; OD.frame++; renderer.shadowMap.autoUpdate = every === 1 || (OD.frame % every === 0) || G.state !== 'playing'; if (!renderer.shadowMap.autoUpdate) renderer.shadowMap.needsUpdate = false; }
/* ---------- hooks */
const _odLoad = loadMap;
loadMap = function () { OD.lamps = []; for (const im of OD.inst) { if (im.parent) im.parent.remove(im); } OD.inst = []; const r = _odLoad.apply(this, arguments); if (r !== false) try { odScan(); odLampSetup(); odGrass(); OD.hhGroups = []; } catch (e) { reportError(e); } return r; };
const _odFrame = renderFrame;
renderFrame = function () { try { odShadowTick(); odCullTick(); odFarShadows(); odLampTick(); odChunks(); odSprites(); } catch (e) {} return _odFrame.apply(this, arguments); };
const _odTick = tick;
tick = function (dt) { const r = _odTick.apply(this, arguments); try { if ((OD.hhT = (OD.hhT || 0) - dt) <= 0) { OD.hhT = 0.25; odHH(); } if (OD.grassFar) OD.grassFar.value = /^(ultra|ultraplus)$/.test(qKey()) ? 60 : qKey() === 'high' ? 45 : 32; } catch (e) {} return r; };
/* ---------- the map load, timed in parts (OD.lt; the frame graph and the tests read it) */
OD.lt = {};
for (const nm of ['clearWorld', 'buildMapMaterials', 'applyEnv', 'flushBatches', 'rayFlush', 'buildNav', 'buildGrass', 'realTexRepatch', 'audioMap', 'applyAnisotropy', 'odScan', 'gmRoofMap', 'gmDecals', 'gmPatchMap', 'buildEnvironment']) {
  try { const f = eval(nm); if (typeof f !== 'function') continue; const w = function () { const t = performance.now(); try { return f.apply(this, arguments); } finally { OD.lt[nm] = Math.round((OD.lt[nm] || 0) + performance.now() - t); } }; eval(nm + ' = w'); } catch (e) {}
}
const _odLoad2 = loadMap;
loadMap = function () { OD.lt = {}; const t = performance.now(); const r = _odLoad2.apply(this, arguments); OD.lt.total = Math.round(performance.now() - t); return r; };
