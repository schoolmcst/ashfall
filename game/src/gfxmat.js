/* ================================================================== GRAPHICS: materials (1.2.113, the owner's graphics list B = 11-20)
   One shader patch on the map's materials (chained after the surface sheen and wind patches already there):
     11 WET: in the rain surfaces darken and turn glossy (tops more than walls) and PUDDLES form on flat ground (mirror
        smooth; the screen-space reflections pick them up).
     13 DEPTH on brick, cobbles, stone, tiles and rock: the bump map's low parts (mortar, gaps) are darkened.
     14 DETAIL close up: the surface's own texture at 7x scale, faded in within 7 m, so walls stay crisp when you're near.
   15 + 48 THE GUN: rubbed-shiny edges (wear) and grime; after kills it gets dirtier and spattered until you respawn.
   17 GLASS: glossier, stronger sky reflections and a bright edge.
   18 REFLECTIONS: the reflection map now has the map's ground and horizon in it, not just the sky.
   19 GRIME DECALS: rust streaks, moss and grime on walls (one merged draw per kind).
   20 SCREENS and SIGNS glow brighter (bloom) and screens get a faint moving scanline.
   12 (reflections) is in gfxpost.js. */
const GM = { wet: { value: 0 }, time: { value: 0 }, fight: { value: 0 }, wear: { value: 1 }, snow: { value: 0 }, roof: { value: null }, rect: { value: new THREE.Vector4(-50, -50, 100, 100) }, done: new WeakSet(), decals: [] };
const GM_CAV = /brick|Brick|cobble|tile|Tile|stone|Stone|rock|cliff|Cliff|plaster/, GM_SCREEN = /screen|Screen|chwScreen|festScreen/, GM_GLASS = /glass|Glass/;
const GM_NOISE = 'float gmH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float gmN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(gmH(i), gmH(i + vec2(1.0, 0.0)), f.x), mix(gmH(i + vec2(0.0, 1.0)), gmH(i + vec2(1.0, 1.0)), f.x), f.y); }\n';
function gmPatch(mat, kind, key) {
  if (!mat || !mat.isMeshStandardMaterial || GM.done.has(mat)) return; GM.done.add(mat);
  const prev = mat.onBeforeCompile, pk = mat.customProgramCacheKey, cav = kind === 'map' && GM_CAV.test(key || ''), scr = GM_SCREEN.test(key || ''), glass = GM_GLASS.test(key || '');
  if (glass) { mat.roughness = Math.min(mat.roughness, 0.08); mat.envMapIntensity = Math.max(mat.envMapIntensity || 1, 2.2); mat.metalness = Math.max(mat.metalness, 0.4); }
  if (scr || (/Sign|sign|neon|Neon/.test(key || '') && mat.emissive)) mat.emissiveIntensity = (mat.emissiveIntensity || 1) * 1.3;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.uniforms.gmWet = GM.wet; sh.uniforms.gmSnow = GM.snow; sh.uniforms.gmRoof = GM.roof; sh.uniforms.gmRect = GM.rect; sh.uniforms.gmTime = GM.time; sh.uniforms.gmFight = GM.fight; sh.uniforms.gmWear = GM.wear;
    sh.vertexShader = 'varying vec3 vGmW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n#ifdef USE_INSTANCING\n vGmW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#else\n vGmW = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#endif');
    let code = '';
    if (kind === 'map') code = [
      '{ vec3 upV = (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz; float up = clamp(dot(normal, upV), 0.0, 1.0);',
      '#ifdef USE_MAP', '  float dd = length(vViewPosition); if (dd < 7.0) { float dl = dot(texture2D(map, vUv * 6.7 + 0.37).rgb, vec3(0.333)); diffuseColor.rgb *= mix(1.0, 0.84 + dl * 0.36, (1.0 - dd / 7.0) * 0.55); }', '#endif',
      cav ? '#ifdef USE_BUMPMAP\n  { float hh = texture2D(bumpMap, vUv).r; diffuseColor.rgb *= mix(0.6, 1.05, smoothstep(0.12, 0.7, hh)); }\n#endif' : '',
      '  if (gmWet > 0.01) { vec2 ruv = (vGmW.xz - gmRect.xy) / gmRect.zw; float rh = texture2D(gmRoof, ruv).r * 80.0 - 10.0; float open = (ruv.x < 0.0 || ruv.y < 0.0 || ruv.x > 1.0 || ruv.y > 1.0) ? 1.0 : step(rh - 0.35, vGmW.y); float wet = gmWet * open * mix(0.3, 1.0, up); float pud = smoothstep(0.58, 0.74, gmN(vGmW.xz * 0.32)) * step(0.92, up) * gmWet * open;',
      '    diffuseColor.rgb *= 1.0 - 0.32 * wet - 0.22 * pud; roughnessFactor = mix(roughnessFactor, 0.2, wet * 0.75); roughnessFactor = mix(roughnessFactor, 0.03, pud); }',
      '  if (gmSnow > 0.01) { vec2 ruv = (vGmW.xz - gmRect.xy) / gmRect.zw; float rh = texture2D(gmRoof, ruv).r * 80.0 - 10.0; float open = (ruv.x < 0.0 || ruv.y < 0.0 || ruv.x > 1.0 || ruv.y > 1.0) ? 1.0 : step(rh - 0.35, vGmW.y); float sn = smoothstep(0.55, 0.85, up) * open * gmSnow * (0.75 + 0.25 * gmN(vGmW.xz * 1.7)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.94, 0.98), sn); roughnessFactor = mix(roughnessFactor, 0.85, sn); } }'].join('\n');
    if (kind === 'gun') code = [
      '{ float edge = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 3.0) * gmWear; roughnessFactor = mix(roughnessFactor, 0.22, edge * 0.6); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.6, 0.57), edge * 0.22);',
      '  float g = gmN(vGmW.xz * 18.0 + vGmW.y * 7.0); diffuseColor.rgb *= 0.92 + 0.08 * g;',
      '  if (gmFight > 0.01) { float sp = smoothstep(0.72, 0.8, gmN(vGmW.xz * 40.0 + vGmW.yz * 23.0)); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.55, 0.47, 0.4), gmFight * 0.6 * g); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.28, 0.03, 0.02), sp * gmFight * 0.7); roughnessFactor = mix(roughnessFactor, 0.85, gmFight * 0.4); } }'].join('\n');
    sh.fragmentShader = 'uniform float gmSnow; uniform sampler2D gmRoof; uniform vec4 gmRect; uniform float gmWet; uniform float gmTime; uniform float gmFight; uniform float gmWear; varying vec3 vGmW;\n' + GM_NOISE + sh.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + code);
    if (scr) sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= 0.9 + 0.1 * sin(vGmW.y * 140.0 - gmTime * 9.0);');
    if (glass) sh.fragmentShader = sh.fragmentShader.replace('#include <tonemapping_fragment>', '{ float fr = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.0); gl_FragColor.rgb += vec3(0.6, 0.72, 0.85) * fr * 0.35; }\n#include <tonemapping_fragment>');
  };
  mat.customProgramCacheKey = () => (pk ? pk.call(mat) : '') + '|gm' + kind + (cav ? 'c' : '') + (scr ? 's' : '') + (glass ? 'g' : '');
  mat.needsUpdate = true;
}
function gmPatchMap() {
  for (const k in MAT) { const v = MAT[k]; if (!v) continue; if (v.isMaterial) { if (!v.transparent || GM_GLASS.test(k)) gmPatch(v, 'map', k); } else if (typeof v === 'object') for (const k2 in v) if (v[k2] && v[k2].isMaterial && !v[k2].transparent) gmPatch(v[k2], 'map', k + k2); }
}
function gmPatchGun() { for (const k in VM) { const m = VM[k]; if (m && m.isMeshStandardMaterial && !m.transparent && !/glove|sleeve|skin/.test(k)) gmPatch(m, 'gun', k); } try { for (const g of gunObjs) g.traverse(o => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial && !o.material.transparent) gmPatch(o.material, 'gun', 'g'); }); } catch (e) {} }
/* ---------- 18: the reflection map sees the ground and the horizon */
const _gmEnv = buildEnvironment;
buildEnvironment = function () {
  try { if (!scene.background && typeof skyMat !== 'undefined') {
    const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(skyGeo, skyMat));
    const gcol = (MAT.ground && MAT.ground.color) ? MAT.ground.color.clone().multiplyScalar(0.55) : new THREE.Color(0x3a3a32), gm = new THREE.MeshBasicMaterial({ color: gcol, side: THREE.DoubleSide });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(250, 32), gm); disc.rotation.x = -Math.PI / 2; disc.position.y = -6; envScene.add(disc);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(240, 240, 18, 32, 1, true), new THREE.MeshBasicMaterial({ color: skyMat.uniforms.horizon.value.clone().multiplyScalar(0.7), side: THREE.BackSide })); ring.position.y = 2; envScene.add(ring);
    const pm = new THREE.PMREMGenerator(renderer), rt = pm.fromScene(envScene); if (envTex && envTex.dispose) envTex.dispose(); envTex = rt.texture; scene.environment = envTex; vmScene.environment = envTex; pm.dispose(); hemi.intensity = 0.28; vmHemi.intensity = 0.4; return; } } catch (e) {}
  return _gmEnv.apply(this, arguments);
};
/* ---------- 19: grime decals on walls */
function gmDecalTex(kind) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d'), rr = (a, b) => a + Math.random() * (b - a);
  if (kind === 'rust') { for (let i = 0; i < 9; i++) { const X = rr(10, 118), w = rr(4, 14), g = x.createLinearGradient(0, rr(0, 40), 0, rr(150, 256)); g.addColorStop(0, 'rgba(110,52,20,0.85)'); g.addColorStop(0.5, 'rgba(130,64,26,0.45)'); g.addColorStop(1, 'rgba(120,60,24,0)'); x.fillStyle = g; x.fillRect(X - w / 2, 0, w, 256); } }
  else if (kind === 'moss') { for (let i = 0; i < 70; i++) { const X = rr(0, 128), Y = rr(150, 256), r = rr(4, 16), g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, 'rgba(58,82,30,0.8)'); g.addColorStop(1, 'rgba(50,72,26,0)'); x.fillStyle = g; x.fillRect(X - r, Y - r, r * 2, r * 2); } }
  else { for (let i = 0; i < 40; i++) { const X = rr(10, 118), Y = rr(20, 236), r = rr(10, 40), g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, 'rgba(20,18,15,0.35)'); g.addColorStop(1, 'rgba(20,18,15,0)'); x.fillStyle = g; x.fillRect(X - r, Y - r, r * 2, r * 2); } }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
function gmDecals() {
  for (const m of GM.decals) { if (m.parent) m.parent.remove(m); m.geometry.dispose(); } GM.decals = [];
  if (S.perfMode || (MAPS[curMap] || {}).indoor === undefined && false) return; const n = /^(ultra|ultraplus)$/.test(qKey()) ? 70 : /high/.test(qKey()) ? 45 : qKey() === 'medium' ? 24 : 0; if (!n) return;
  const walls = boxes.filter(b => !b.walk && b.top - b.bot > 2.2 && Math.max(b.maxx - b.minx, b.maxz - b.minz) > 2.5 && !b.rail);
  const inside = (x, y, z) => { for (const b of boxes) if (x > b.minx && x < b.maxx && z > b.minz && z < b.maxz && y > b.bot && y < b.top) return true; return false; };
  const kinds = ['rust', 'moss', 'grime'], geos = { rust: [], moss: [], grime: [] };
  for (let i = 0; i < n * 3 && geos.rust.length + geos.moss.length + geos.grime.length < n; i++) { const b = walls[(Math.random() * walls.length) | 0]; if (!b) break; const side = (Math.random() * 4) | 0, alongX = side < 2, len = alongX ? b.maxx - b.minx : b.maxz - b.minz;
    const k = kinds[(Math.random() * 3) | 0], w = 0.8 + Math.random() * 1.6, h = k === 'moss' ? 1.2 : 1.8 + Math.random() * 1.2, at = (alongX ? b.minx : b.minz) + w / 2 + Math.random() * Math.max(0, len - w), y = k === 'moss' ? b.bot + h / 2 : Math.min(b.top - h / 2, b.bot + h / 2 + Math.random() * Math.max(0, b.top - b.bot - h));
    const x = alongX ? at : side === 2 ? b.minx - 0.012 : b.maxx + 0.012, z = alongX ? (side === 0 ? b.minz - 0.012 : b.maxz + 0.012) : at, ox = alongX ? 0 : side === 2 ? -0.3 : 0.3, oz = alongX ? (side === 0 ? -0.3 : 0.3) : 0;
    if (inside(x + ox, y, z + oz) || y < -1) continue;
    const g = new THREE.PlaneGeometry(w, h); g.rotateY(alongX ? (side === 0 ? Math.PI : 0) : (side === 2 ? -Math.PI / 2 : Math.PI / 2)); g.translate(x, y, z); geos[k].push(g); }
  for (const k of kinds) { if (!geos[k].length) continue; const merged = gmMerge(geos[k]); const m = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ map: gmDecalTex(k), transparent: true, depthWrite: false, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.renderOrder = 2; m.receiveShadow = true; scene.add(m); GM.decals.push(m); }
}
function gmMerge(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count; const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = []; let o = 0;
  for (const g of list) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array, o * 2); for (const i of g.index.array) idx.push(i + o); o += g.attributes.position.count; g.dispose(); }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); m.setIndex(idx); m.computeBoundingSphere(); return m;
}
/* ---------- 11: what's under a roof (highest surface over each cell, so rain only wets what the sky sees) */
function gmRoofMap() {
  const pr = PLAYRECT, W = pr[1] - pr[0], H = pr[3] - pr[2], n = Math.min(256, Math.max(32, Math.ceil(Math.max(W, H)))), data = new Uint8Array(n * n * 4);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = pr[0] + (i + 0.5) / n * W, z = pr[2] + (j + 0.5) / n * H; let h = -10; try { h = groundAt(x, z, 70); } catch (e) {} const v = clamp(Math.round((h + 10) / 80 * 255), 0, 255), o = (j * n + i) * 4; data[o] = data[o + 1] = data[o + 2] = v; data[o + 3] = 255; }
  if (GM.roof.value) GM.roof.value.dispose(); const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.needsUpdate = true; GM.roof.value = t; GM.rect.value.set(pr[0], pr[2], W, H);
}
/* ---------- hooks */
const _gmLoad = loadMap;
loadMap = function () { const r = _gmLoad.apply(this, arguments); if (r !== false) try { gmRoofMap(); gmPatchMap(); gmDecals(); } catch (e) { reportError(e); } return r; };
let gmKills0 = 0;
const _gmTick = tick;
tick = function (dt) {
  const r = _gmTick.apply(this, arguments);
  try { GM.time.value = NOW % 1000; GM.wet.value += ((typeof AMB !== 'undefined' && AMB.kind === 'rain' && inMatch() ? 1 : 0) - GM.wet.value) * Math.min(1, dt * 0.15); GM.snow.value += ((typeof AMB !== 'undefined' && AMB.kind === 'snow' && inMatch() ? 0.85 : 0) - GM.snow.value) * Math.min(1, dt * 0.04);
    if ((GM.gT = (GM.gT || 0) - dt) <= 0) { GM.gT = 2; gmPatchGun(); gmPatchMap(); }
    if (G.state === 'playing') { const k = G.kills | 0; if (k > gmKills0) GM.fight.value = Math.min(1, GM.fight.value + 0.12 * (k - gmKills0)); gmKills0 = k; } else if (G.state === 'respawning' || G.state === 'menu') { GM.fight.value = 0; gmKills0 = G.kills | 0; } } catch (e) {}
  return r;
};
