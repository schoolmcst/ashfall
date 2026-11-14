/* ================================================================== GRAPHICS: lighting (1.2.113, the owner's graphics list A = 1-10)
   1-3 and 10 are in gfxpost.js (occlusion, contact shadows, light shafts, lens glare).
   4  INDOOR LIGHT: under a roof the sky's fill light drops and your eyes adjust (exposure eases between inside and out).
   5  THE SKY: stars on dark skies, warmer horizons when the sun is low, clouds that move with a little wind.
   6  NIGHT LAMPS: on night maps some lamps flicker and the odd one is broken (it sparks now and then).
   7  MUZZLE FLASH LIGHT: your shots and nearby bots' shots light the walls round them for a moment.
   8  NEON SPILL: neon signs, grow lamps and coloured bulbs throw their colour on the ground near you.
   9  THE MOON on night skies (opposite the sun, with a soft halo).
   7 and 8 use a fixed set of 4 extra lights (DYNAMIC LIGHTS, HIGH and up), moved to where they matter, so the light
   count (and every shader) stays the same during play. */
const GL = { lamps: [], pool: [], neon: [], night: 0, indoor: 0, expo: 1, flashT: 0, scanT: 0, spots: [] };
if (S.dynLights === undefined) S.dynLights = /^(high|ultra|ultraplus)$/.test(qKey());
(() => { try { const V = SCHEMA.VIDEO, at = V.findIndex(it => it.k === 'ao'); if (!V.some(it => it.k === 'dynLights')) V.splice(at, 0, { k: 'dynLights', t: 'toggle', name: 'DYNAMIC LIGHTS', hint: 'Muzzle flashes and neon signs light up the walls and ground round them' }); VIDEO_KEYS.add('dynLights'); } catch (e) {} })();
const _glPreset = applyPreset; applyPreset = function (k) { const r = _glPreset.apply(this, arguments); S.dynLights = /^(high|ultra|ultraplus)$/.test(k); return r; };
/* ---------- 5 + 9: the sky shader */
(() => {
  const u = skyMat.uniforms; u.night = { value: 0 }; u.moonDir = { value: new THREE.Vector3(-0.4, 0.55, 0.7).normalize() }; u.low = { value: 0 };
  let fs = skyMat.fragmentShader.replace('uniform float cloudK;', 'uniform float cloudK; uniform float night; uniform vec3 moonDir; uniform float low;');
  fs = fs.replace("  col = mix(col, horizon * 0.92, smoothstep(0.0, -0.12, d.y));", [
    '  if (night > 0.01 && d.y > 0.0) {',
    '    vec2 sp = d.xz / (d.y + 0.35) * 90.0; vec2 cell = floor(sp); float h = hash(cell); vec2 f = fract(sp) - 0.5 - (vec2(hash(cell + 7.1), hash(cell + 3.3)) - 0.5) * 0.6;',
    '    float star = step(0.985, h) * smoothstep(0.08, 0.0, length(f)) * (0.6 + 0.4 * sin(time * 2.0 + h * 50.0));',
    '    float clear = 1.0 - smoothstep(0.35, 0.7, fbm((d.xz / (d.y + 0.22) * 0.8 + vec2(time * 0.006, time * 0.002)) * 1.7));',
    '    col += vec3(0.85, 0.9, 1.0) * star * night * clear * smoothstep(0.02, 0.2, d.y);',
    '    float md = max(dot(d, normalize(moonDir)), 0.0); col += vec3(0.85, 0.9, 1.0) * (smoothstep(0.9993, 0.9996, md) * 1.6 + pow(md, 60.0) * 0.12) * night; }',
    '  col = mix(col, col * vec3(1.18, 0.95, 0.82), low * (1.0 - smoothstep(0.0, 0.35, d.y)));',
    '  col = mix(col, horizon * 0.92, smoothstep(0.0, -0.12, d.y));'].join('\n'));
  skyMat.fragmentShader = fs; skyMat.needsUpdate = true;
})();
const _glEnv = applyEnv;
applyEnv = function (env) {
  const r = _glEnv.apply(this, arguments);
  try { const e = Object.assign({}, env || {}), t = new THREE.Color(skyMat.uniforms.top.value), h = new THREE.Color(skyMat.uniforms.horizon.value), L = 0.3 * (t.r + h.r) + 0.55 * (t.g + h.g) + 0.15 * (t.b + h.b);
    GL.night = clamp((0.45 - L) / 0.3, 0, 1); skyMat.uniforms.night.value = GL.night; const sd = SUN_POS.clone().normalize(); skyMat.uniforms.low.value = clamp((0.45 - sd.y) / 0.35, 0, 1) * (1 - GL.night) * 0.8;
    skyMat.uniforms.moonDir.value.set(-sd.x, Math.max(0.35, Math.abs(sd.y)), -sd.z).normalize(); GL.expo = 1; } catch (e) {}
  return r;
};
/* ---------- 6: map lamps on night maps */
const _glLamp = lampLight;
lampLight = function (x, y, z, col, i, dist) { const l = _glLamp.apply(this, arguments); try { GL.lamps.push({ l, i0: l.intensity, x, y, z, ph: Math.random() * 100, kind: 0 }); } catch (e) {} return l; };
const _glLoad = loadMap;
loadMap = function (id) {
  const L0 = GL.lamps, S0 = GL.spots; GL.lamps = []; GL.spots = []; const r = _glLoad.apply(this, arguments); if (r === false) { GL.lamps = L0; GL.spots = S0; return r; }
  const night = !!(MAPS[curMap] && (MAPS[curMap].night || /_night$/.test(curMap))) || GL.night > 0.6; let s = 1;
  for (const L of GL.lamps) { s = (s * 16807) % 2147483647; const q = s / 2147483647; L.kind = !night ? 0 : q < 0.06 ? 2 : q < 0.26 ? 1 : 0; }
  glScanNeon(); return r;
};
function glLampTick(dt) {
  for (const L of GL.lamps) { if (!L.kind || !L.l.parent) continue; L.ph += dt;
    if (L.kind === 1) { const n = Math.sin(L.ph * 23) * Math.sin(L.ph * 7.3) + Math.sin(L.ph * 61) * 0.3; L.l.intensity = L.i0 * (n > 0.85 ? 0.15 : 0.88 + 0.12 * Math.sin(L.ph * 40)); }
    else { L.l.intensity = 0; if (Math.random() < dt * 0.25) { L.l.intensity = L.i0 * 1.4; try { chunks('spark', new THREE.Vector3(L.x, L.y, L.z), 6, 3, 0.5); } catch (e) {} } } }
}
/* ---------- 8: where the neon is (from what the map batched) */
const GL_NEON = /neon|Neon|Glow|glow|Sign|Bulb|bulb|growLamp|redLight|blueLight|greenLight|hbxLamp|lighthouseLamp|fireGlow|furnaceGlow|chemGlow|screen|Screen/;
const _glBatch = batchAdd;
batchAdd = function (key, geo, m) { const r = _glBatch.apply(this, arguments); try { if (GL_NEON.test(key) && m && MAT[key] && GL.spots.length < 400) { const mat = MAT[key], c = (mat.emissive && mat.emissiveIntensity > 0.3 && (mat.emissive.r + mat.emissive.g + mat.emissive.b) > 0.4) ? mat.emissive : mat.isMeshBasicMaterial ? mat.color : null; if (c) { const e = m.elements; GL.spots.push({ x: e[12], y: e[13], z: e[14], c: new THREE.Color(c), fire: /fire|Fire|furnace/.test(key) }); } } } catch (e) {} return r; };
function glScanNeon() { /* spots come from batchAdd while the map is built; close ones are merged */ const out = []; for (const s of GL.spots) { const o = out.find(q => Math.hypot(q.x - s.x, q.y - s.y, q.z - s.z) < 3); if (o) continue; out.push(s); } GL.spots = out; }
/* ---------- 7 + 8: the pooled lights */
function glPool() {
  const want = S.dynLights && !S.perfMode ? 4 : 0;
  if (GL.pool.length === want) return; for (const p of GL.pool) scene.remove(p.l); GL.pool = [];
  for (let i = 0; i < want; i++) { const l = new THREE.PointLight(0xffffff, 0, 8, 2); l.castShadow = false; scene.add(l); GL.pool.push({ l, t: 0 }); }
}
function glFlash(x, y, z, col, k) { if (!GL.pool.length) return; const p = GL.pool[0]; p.l.position.set(x, y, z); p.l.color.setHex(col || 0xffb060); p.l.intensity = 2.6 * (k || 1); p.l.distance = 7; p.t = 0.06; }
const _glShoot = shoot;
shoot = function () { const f0 = G.flashT; const r = _glShoot.apply(this, arguments); if (G.flashT > 0 && G.flashT !== f0) try { const d = new THREE.Vector3(); camera.getWorldDirection(d); glFlash(camera.position.x + d.x * 0.9, camera.position.y + d.y * 0.9 - 0.15, camera.position.z + d.z * 0.9); } catch (e) {} return r; };
for (const nm of ['botShoot', 'enemyShoot']) { const f = window[nm]; if (typeof f !== 'function') continue; const w = function (e) { const r = f.apply(this, arguments); try { if (GL.pool.length && e && e.group && GL.pool[0].t <= 0 && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 22) { const m = enemyMuzzle(e, new THREE.Vector3()); glFlash(m.x, m.y, m.z, 0xffa850, 0.8); } } catch (er) {} return r; }; if (nm === 'botShoot') botShoot = w; else enemyShoot = w; }
function glPoolTick(dt) {
  glPool(); if (!GL.pool.length) return; const f = GL.pool[0]; if (f.t > 0) { f.t -= dt; if (f.t <= 0) f.l.intensity = 0; }
  if ((GL.scanT -= dt) > 0) return; GL.scanT = 0.4;
  const near = GL.spots.map(s => [s, Math.hypot(s.x - P.x, s.z - P.z)]).filter(q => q[1] < 30).sort((a, b) => a[1] - b[1]).slice(0, 3);
  for (let i = 1; i < 4; i++) { const p = GL.pool[i], q = near[i - 1]; if (!q) { p.l.intensity = 0; continue; } const s = q[0]; p.l.position.set(s.x, s.y - 0.2, s.z); p.l.color.copy(s.c); p.l.intensity = 1.1 * (1 - q[1] / 30); p.l.distance = 9; }
}
/* ---------- 4: indoor light and eyes that adjust */
function glIndoorTick(dt) {
  let roof = 0; if (M && G.state === 'playing') try { const y = camera.position.y; const top = groundAt(camera.position.x, camera.position.z, y + 14); roof = top > y + 0.3 ? 1 : 0; } catch (e) {}
  GL.indoor += (roof - GL.indoor) * Math.min(1, dt * 1.6);
  // scale whatever the map (or LAST TOKE's day and night) set, never replace it
  if (GL.hemiSet === undefined || Math.abs(hemi.intensity - GL.hemiSet) > 1e-4) GL.hemiBase = hemi.intensity;
  if (GL.expoSet === undefined || Math.abs(renderer.toneMappingExposure - GL.expoSet) > 1e-4) GL.expoBase = renderer.toneMappingExposure;
  const want = 1 + 0.18 * GL.indoor; GL.expo += (want - GL.expo) * Math.min(1, dt * 0.8);
  hemi.intensity = GL.hemiSet = GL.hemiBase * (1 - 0.45 * GL.indoor); renderer.toneMappingExposure = GL.expoSet = GL.expoBase * GL.expo;
}
/* ---------- every frame */
const _glTick = tick;
tick = function (dt) { const r = _glTick.apply(this, arguments); try { if (!G.noRender) { glLampTick(dt); glPoolTick(dt); glIndoorTick(dt); } } catch (e) {} return r; };
