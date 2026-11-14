/* ================================================================== GRAPHICS: the ray tracing and DLSS stand-ins (1.2.114)
   NVIDIA's DLSS and RTX ray tracing can't be reached from WebGL (the game draws through Chromium's WebGL; neither the
   DLSS SDK nor the RT cores are exposed there). These do the same jobs in shaders, on every graphics card:
   1 UPSCALER (OFF / QUALITY 77% / BALANCED 67% / PERFORMANCE 50%): the world is drawn smaller and blown back up with a
     sharp bicubic (Catmull-Rom) filter and contrast-adaptive sharpening (the idea behind AMD's FSR 1). The upscale happens
     in the final pass, so the HUD and menus stay full size.
   2 BOUNCE LIGHT (screen-space global illumination): every pixel gathers the light of the surfaces round it, so a sunlit
     floor lights the walls and a red container tints the ground. Half size, depth-aware blur.
   3 RAY-TRACED SHADOWS: the map's collision boxes go to the GPU (a box texture and a 4 m grid of which boxes are in each
     cell), and real rays are traced against them: a ray to the sun (soft, jittered) and one into the sky per pixel. The sun
     ray adds shadows past SHADOW DISTANCE (the shadow map stops there); the sky ray adds true sky occlusion. Half size,
     averaged over frames while you stand still.
   4 RAY-TRACED PHOTO MODE: in photo mode, RAY TRACE traces many rays per pixel over a few seconds (soft shadows, sky light,
     bounce light) until the picture settles; SAVE takes the finished picture. */
const GR = { photo: false, n: 0, grid: null, dirty: true, accA: null, accB: null, gi: null, gi2: null, rtNew: null, mats: null, lastCam: new THREE.Matrix4(), still: 0, frame: 0 };
const GR_UPS = { off: 1, quality: 0.77, balanced: 0.67, performance: 0.5 };
for (const [k, v] of Object.entries({ upscale: 'off', ssgi: false, rtShadows: false })) if (S[k] === undefined) S[k] = /^(ultraplus)$/.test(qKey()) ? (k === 'upscale' ? 'quality' : true) : k === 'ssgi' && qKey() === 'ultra' ? true : v;
if (typeof GP_PRESET !== 'undefined') { const P2 = { lowplus: ['performance', false, false], low: ['off', false, false], medium: ['off', false, false], high: ['off', false, false], ultra: ['off', true, false], ultraplus: ['quality', true, true] }; for (const k in P2) if (GP_PRESET[k]) Object.assign(GP_PRESET[k], { upscale: P2[k][0], ssgi: P2[k][1], rtShadows: P2[k][2] }); }
(() => { try { const V = SCHEMA.VIDEO, at = V.findIndex(it => it.k === 'ao'); const add = [
  { k: 'upscale', t: 'seg', name: 'UPSCALER', hint: 'Draws the world smaller and sharpens it back up (like FSR): more FPS. HUD stays sharp', opts: [['off', 'OFF'], ['quality', 'QUALITY'], ['balanced', 'BALANCED'], ['performance', 'PERFORMANCE']] },
  { k: 'ssgi', t: 'toggle', name: 'BOUNCE LIGHT', hint: 'Light bounces off nearby surfaces (screen-space global illumination)' },
  { k: 'rtShadows', t: 'toggle', name: 'RAY-TRACED SHADOWS', hint: 'Rays traced against the map for far shadows and sky occlusion. Heavy: ULTRA+' }];
  if (!V.some(it => it.k === 'upscale')) V.splice(at, 0, ...add); for (const it of add) VIDEO_KEYS.add(it.k); } catch (e) {} })();
/* ---------- 1: the upscaler: the world is drawn into a smaller corner of the picture */
const _grTargets = postTargets;
postTargets = function () { const r = _grTargets.apply(this, arguments); const k = GR_UPS[S.upscale] || 1; if (k < 1 && POST.rt) { POST.dw = Math.max(2, Math.round(POST.dw * k)); POST.dh = Math.max(2, Math.round(POST.dh * k)); } GR.ups = k; return r; };
/* ---------- the final pass: upscale, bounce light, ray-traced occlusion */
GP.moreD = dep => ({ UPSCALE: (GR_UPS[S.upscale] || 1) < 1, GI: dep && S.ssgi && !!GR.gi, RT: dep && (S.rtShadows || GR.photo) && !!GR.accA });
GP.moreU = u => Object.assign(u, { giT: { value: null }, giK: { value: 0.9 }, rtT: { value: null }, rtSun: { value: 0 }, rtSky: { value: 0.8 }, rtAll: { value: 0 }, shFar: { value: 100 }, casK: { value: 0.5 } });
GP.moreFin = body => {
  body = body.replace('uniform sampler2D dep;', 'uniform sampler2D giT; uniform float giK; uniform sampler2D rtT; uniform float rtSun; uniform float rtSky; uniform float rtAll; uniform float shFar; uniform float casK;\nuniform sampler2D dep;');
  body = body.replace('void main(){', [
    '#ifdef UPSCALE',
    'vec3 cr(vec2 uv){ vec2 ts = 1.0 / px; vec2 sp = uv * ts, tc = floor(sp - 0.5) + 0.5, f = sp - tc; vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f)), w1 = 1.0 + f * f * (-2.5 + 1.5 * f), w2 = f * (0.5 + f * (2.0 - 1.5 * f)), w3 = f * f * (-0.5 + 0.5 * f), w12 = w1 + w2, o12 = w2 / w12;',
    '  vec2 t0 = (tc - 1.0) * px, t3 = (tc + 2.0) * px, t12 = (tc + o12) * px; vec3 r = vec3(0.0);',
    '  r += texture2D(src, vec2(t12.x, t0.y)).rgb * w12.x * w0.y; r += texture2D(src, vec2(t0.x, t12.y)).rgb * w0.x * w12.y; r += texture2D(src, t12).rgb * w12.x * w12.y; r += texture2D(src, vec2(t3.x, t12.y)).rgb * w3.x * w12.y; r += texture2D(src, vec2(t12.x, t3.y)).rgb * w12.x * w3.y;',
    '  return max(r / (w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y), 0.0); }',
    'vec3 cas(vec2 uv, vec3 c){ vec3 a = texture2D(src, uv + vec2(0.0, -px.y)).rgb, b = texture2D(src, uv + vec2(-px.x, 0.0)).rgb, d = texture2D(src, uv + vec2(px.x, 0.0)).rgb, e = texture2D(src, uv + vec2(0.0, px.y)).rgb;',
    '  vec3 mn = min(c, min(min(a, b), min(d, e))), mx = max(c, max(max(a, b), max(d, e))); vec3 amp = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, 1e-4), 0.0, 1.0)); vec3 w = amp * -mix(0.125, 0.2, casK);',
    '  return clamp((c + (a + b + d + e) * w) / (1.0 + 4.0 * w), 0.0, 1.0); }',
    '#endif', 'void main(){'].join('\n'));
  body = body.replace('  vec3 c = fxaa > 0.5 ? fxaaAt(uv) : texture2D(src, uv).rgb;', '#ifdef UPSCALE\n  vec3 c = cas(uv, fxaa > 0.5 ? mix(cr(uv), fxaaAt(uv), 0.6) : cr(uv));\n#else\n  vec3 c = fxaa > 0.5 ? fxaaAt(uv) : texture2D(src, uv).rgb;\n#endif');
  body = body.replace("  float zz = texture2D(dep, vUv).r;", [
    '  float zz = texture2D(dep, vUv).r;',
    '#ifdef RT', '  if (zz < 400.0) { vec4 rt = texture2D(rtT, vUv); l *= mix(1.0, rt.g, rtSky); l *= mix(1.0, mix(0.45, 1.0, rt.r), rtSun * max(rtAll, smoothstep(shFar * 0.8, shFar, zz))); }', '#endif',
    '#ifdef GI', '  if (zz < 120.0) { vec3 g = texture2D(giT, vUv).rgb; l += g * giK * clamp(l * 1.6 + 0.12, 0.0, 1.0) * (1.0 - smoothstep(80.0, 120.0, zz)); }', '#endif'].join('\n'));
  return body;
};
/* ---------- the box scene on the GPU (3, 4) */
function grBuild() {
  GR.dirty = false; const pr = PLAYRECT, cs = 4, gw = Math.min(160, Math.ceil((pr[1] - pr[0]) / cs) + 2), gh = Math.min(160, Math.ceil((pr[3] - pr[2]) / cs) + 2), x0 = pr[0] - cs, z0 = pr[2] - cs;
  const B = boxes.filter(b => b.top - b.bot > 0.25 && (b.maxx - b.minx) * (b.maxz - b.minz) > 0.02).slice(0, 16000); let maxY = 0;
  const bw = Math.ceil(Math.sqrt(B.length * 2 + 1)), bd = new Float32Array(bw * bw * 4);
  B.forEach((b, i) => { bd.set([b.minx, b.bot, b.minz, 0], i * 8); bd.set([b.maxx, b.top, b.maxz, 0], i * 8 + 4); maxY = Math.max(maxY, b.top); });
  const cells = Array.from({ length: gw * gh }, () => []);
  B.forEach((b, i) => { const ia = Math.max(0, Math.floor((b.minx - x0) / cs)), ib = Math.min(gw - 1, Math.floor((b.maxx - x0) / cs)), ja = Math.max(0, Math.floor((b.minz - z0) / cs)), jb = Math.min(gh - 1, Math.floor((b.maxz - z0) / cs)); for (let j = ja; j <= jb; j++) for (let k = ia; k <= ib; k++) { const L = cells[j * gw + k]; if (L.length < 24) L.push(i); } });
  let total = 0; for (const L of cells) total += L.length; const lw = Math.ceil(Math.sqrt(total + 1)), ld = new Float32Array(lw * lw * 4), cd = new Float32Array(gw * gh * 4); let off = 0;
  cells.forEach((L, c) => { cd[c * 4] = off; cd[c * 4 + 1] = L.length; for (const i of L) { ld[off * 4] = i; off++; } });
  const tx = (d, w, h) => { const t = new THREE.DataTexture(d, w, h, THREE.RGBAFormat, THREE.FloatType); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; };
  if (GR.grid) for (const k of ['box', 'list', 'cell']) GR.grid[k].dispose();
  GR.grid = { box: tx(bd, bw, bw), list: tx(ld, lw, lw), cell: tx(cd, gw, gh), bw, lw, gw, gh, x0, z0, cs, maxY: maxY + 0.5, n: B.length };
}
const GR_TRACE = [
  'uniform sampler2D boxT; uniform sampler2D listT; uniform sampler2D cellT; uniform vec4 grid; uniform vec2 gsz; uniform float boxW; uniform float listW; uniform float maxY;',
  'vec4 fetchT(sampler2D t, float i, float w){ return texture2D(t, vec2((mod(i, w) + 0.5) / w, (floor(i / w) + 0.5) / w)); }',
  'float traceBoxes(vec3 o, vec3 d, float tmax){',
  '  vec3 dd = d; dd.x = abs(dd.x) < 1e-5 ? 1e-5 : dd.x; dd.y = abs(dd.y) < 1e-5 ? 1e-5 : dd.y; dd.z = abs(dd.z) < 1e-5 ? 1e-5 : dd.z; vec3 inv = 1.0 / dd;',
  '  vec2 g = (o.xz - grid.xy) / grid.z, cell = floor(g), stp = sign(dd.xz), tDel = abs(grid.z / dd.xz); vec2 nxt = ((cell + max(stp, 0.0)) * grid.z + grid.xy - o.xz) / dd.xz; float t = 0.0;',
  '  for (int i = 0; i < 40; i++) { if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= gsz.x || cell.y >= gsz.y || t > tmax) break; if (d.y > 0.0 && o.y + d.y * t > maxY) break;',
  '    vec4 c = texture2D(cellT, (cell + 0.5) / gsz);',
  '    for (int k = 0; k < 24; k++) { if (float(k) >= c.g) break; float bi = fetchT(listT, c.r + float(k), listW).r; vec3 a = fetchT(boxT, bi * 2.0, boxW).xyz, b = fetchT(boxT, bi * 2.0 + 1.0, boxW).xyz;',
  '      vec3 t0 = (a - o) * inv, t1 = (b - o) * inv, tn = min(t0, t1), tf = max(t0, t1); float ta = max(max(tn.x, tn.y), tn.z), tb = min(min(tf.x, tf.y), tf.z); if (tb >= max(ta, 0.0) && ta < tmax) return 0.0; }',
  '    if (nxt.x < nxt.y) { t = nxt.x; nxt.x += tDel.x; cell.x += stp.x; } else { t = nxt.y; nxt.y += tDel.y; cell.y += stp.y; } }',
  '  return 1.0; }'].join('\n');
function grMats() {
  if (GR.mats) return GR.mats; const mk = (fs, u) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: POST_VS, fragmentShader: fs, depthTest: false, depthWrite: false, toneMapped: false });
  const U = () => ({ dep: { value: null }, px: { value: new THREE.Vector2() }, tanY: { value: 1 }, asp: { value: 1 } });
  // 2: gather bounce light
  const gi = mk(GP_LIB + '\nuniform sampler2D src; uniform vec2 sc; uniform float rad; uniform float seed; vec3 lin3(vec3 c){ return c * c * (c * 0.305306 + 0.682171) + c * 0.012522; }\nvoid main(){ vec3 p = vpos(vUv); float z = -p.z; if (z > 110.0) { gl_FragColor = vec4(0.0); return; } vec3 n = vnorm(vUv, p); vec3 acc = vec3(0.0); float r0 = hash(vUv * 731.0 + seed) * 6.2832;\n' +
    '  for (int i = 0; i < 10; i++) { float f = (float(i) + 0.5) / 10.0, a = r0 + float(i) * 2.39996; vec2 o = vec2(cos(a), sin(a)) * rad * f / (2.0 * z * tanY) * vec2(1.0 / asp, 1.0); vec2 uv = vUv + o; if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) continue;\n' +
    '    vec3 q = vpos(uv), v = q - p; float L = length(v); float w = max(dot(n, v / max(L, 1e-3)), 0.0) * (1.0 - smoothstep(rad * 0.5, rad * 1.4, L)); vec3 qn = vnorm(uv, q); w *= max(dot(qn, -v / max(L, 1e-3)), 0.0) * 0.8 + 0.2; acc += lin3(texture2D(src, uv * sc).rgb) * w; }\n' +
    '  gl_FragColor = vec4(acc / 10.0 * 2.2, 1.0); }', Object.assign(U(), { src: { value: null }, sc: { value: new THREE.Vector2(1, 1) }, rad: { value: 2.5 }, seed: { value: 0 } }));
  const blur3 = mk('uniform sampler2D src; uniform sampler2D dep; uniform vec2 dir; varying vec2 vUv; void main(){ float z0 = texture2D(dep, vUv).r; vec3 s = vec3(0.0); float w = 0.0; for (int i = -4; i <= 4; i++) { vec2 uv = vUv + dir * float(i); float z = texture2D(dep, uv).r; float k = 1.0 / (1.0 + abs(z - z0) * 4.0 / max(z0, 0.5)); s += texture2D(src, uv).rgb * k; w += k; } gl_FragColor = vec4(s / w, 1.0); }',
    { src: { value: null }, dep: { value: null }, dir: { value: new THREE.Vector2() } });
  // 3 + 4: trace rays against the boxes; r = sun visibility, g = sky visibility (averaged over frames in acc)
  const rt = mk(GP_LIB + '\n' + GR_TRACE + '\nuniform mat4 camW; uniform mat3 camRot; uniform vec3 sunDir; uniform float seed; uniform float spp; uniform float soft; uniform sampler2D prev; uniform float blend;\n' +
    'void main(){ vec3 p = vpos(vUv); float z = -p.z; vec4 old = texture2D(prev, vUv); if (z > 400.0) { gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); return; } vec3 n = vnorm(vUv, p); vec3 w = (camW * vec4(p, 1.0)).xyz, nw = normalize(camRot * n); vec3 o = w + nw * 0.06;\n' +
    '  float sun = 0.0, sky = 0.0; for (int s = 0; s < 8; s++) { if (float(s) >= spp) break; float h1 = hash(vUv * 517.0 + seed + float(s) * 7.13), h2 = hash(vUv * 331.0 + seed * 1.7 + float(s) * 3.71);\n' +
    '    vec3 sd = normalize(sunDir + (vec3(h1, h2, hash(vUv + seed + float(s))) - 0.5) * soft); sun += dot(nw, sd) > 0.0 ? traceBoxes(o, sd, 150.0) : 0.0;\n' +
    '    vec3 t1 = normalize(abs(nw.y) < 0.9 ? cross(nw, vec3(0.0, 1.0, 0.0)) : cross(nw, vec3(1.0, 0.0, 0.0))), t2 = cross(nw, t1); float ph = h1 * 6.2832, ct = sqrt(1.0 - h2), st = sqrt(h2); vec3 hd = normalize(t1 * cos(ph) * st + t2 * sin(ph) * st + nw * ct); sky += traceBoxes(o, hd, 6.0); }\n' +
    '  vec4 nw4 = vec4(sun / spp, sky / spp, 0.0, 1.0); gl_FragColor = mix(old, nw4, blend); }',
    Object.assign(U(), { boxT: { value: null }, listT: { value: null }, cellT: { value: null }, grid: { value: new THREE.Vector4() }, gsz: { value: new THREE.Vector2() }, boxW: { value: 1 }, listW: { value: 1 }, maxY: { value: 20 }, camW: { value: new THREE.Matrix4() }, camRot: { value: new THREE.Matrix3() }, sunDir: { value: new THREE.Vector3() }, seed: { value: 0 }, spp: { value: 1 }, soft: { value: 0.04 }, prev: { value: null }, blend: { value: 1 } }));
  return (GR.mats = { gi, blur3, rt });
}
function grTargets() {
  const hw = Math.max(2, POST.w >> 1), hh = Math.max(2, POST.h >> 1); if (GR.gi && GR.gi.width === hw && GR.gi.height === hh) return;
  for (const k of ['gi', 'gi2', 'accA', 'accB']) if (GR[k]) GR[k].dispose();
  const mk = half => { const t = new THREE.WebGLRenderTarget(hw, hh, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false, type: half ? THREE.HalfFloatType : THREE.UnsignedByteType }); t.texture.generateMipmaps = false; return t; };
  GR.gi = mk(true); GR.gi2 = mk(true); GR.accA = mk(true); GR.accB = mk(true); GR.n = 0;
}
GP.morePasses = (f, X) => {
  const want = S.ssgi || S.rtShadows || GR.photo; if (!want) return; grTargets(); const R = grMats(), cam = X.cam;
  if (S.ssgi || GR.photo) { const g = R.gi.uniforms; X.lib(R.gi); g.src.value = POST.rt.texture; g.sc.value.set(X.sx, X.sy); g.seed.value = (GR.frame++ % 64) * 0.37; postPass(R.gi, GR.gi);
    const b = R.blur3.uniforms; b.dep.value = GP.lin.texture; b.src.value = GR.gi.texture; b.dir.value.set(1.5 / GR.gi.width, 0); postPass(R.blur3, GR.gi2); b.src.value = GR.gi2.texture; b.dir.value.set(0, 1.5 / GR.gi.height); postPass(R.blur3, GR.gi); f.giT.value = GR.gi.texture; f.giK.value = GR.photo ? 1.1 : 0.9; }
  if (S.rtShadows || GR.photo) { if (GR.dirty || !GR.grid) grBuild(); const G2 = GR.grid, r = R.rt.uniforms; X.lib(R.rt);
    // still camera -> keep averaging; moving -> take mostly the new frame
    const moved = !GR.lastCam.equals(cam.matrixWorld); GR.lastCam.copy(cam.matrixWorld); if (moved) { GR.n = 0; } GR.n = Math.min(GR.photo ? 1024 : 16, GR.n + 1);
    Object.assign(r.boxT, { value: G2.box }); r.listT.value = G2.list; r.cellT.value = G2.cell; r.grid.value.set(G2.x0, G2.z0, G2.cs, 0); r.gsz.value.set(G2.gw, G2.gh); r.boxW.value = G2.bw; r.listW.value = G2.lw; r.maxY.value = G2.maxY;
    r.camW.value.copy(cam.matrixWorld); r.camRot.value.setFromMatrix4(cam.matrixWorld); r.sunDir.value.copy(SUN_POS).normalize(); r.seed.value = Math.random() * 100; r.spp.value = GR.photo ? 4 : 1; r.soft.value = GR.photo ? 0.06 : 0.035;
    r.prev.value = GR.accA.texture; r.blend.value = 1 / GR.n; postPass(R.rt, GR.accB); const t = GR.accA; GR.accA = GR.accB; GR.accB = t;
    f.rtT.value = GR.accA.texture; f.rtSun.value = GR.photo ? 1.0 : 0.55; f.rtSky.value = GR.photo ? 0.9 : 0.6; f.rtAll.value = GR.photo ? 1 : 0; f.shFar.value = S.shadowDist || 100; }
  f.casK.value = S.upscale === 'performance' ? 1 : S.upscale === 'balanced' ? 0.75 : 0.5;
};
// the box scene changes with the map, HORDE building and broken cover
const _grLoad = loadMap; loadMap = function () { const r = _grLoad.apply(this, arguments); GR.dirty = true; return r; };
const _grGrid = rebuildBoxGrid; rebuildBoxGrid = function () { const r = _grGrid.apply(this, arguments); GR.dirty = true; return r; };
/* ---------- 4: the photo mode button */
function grPhotoUI() {
  const on = typeof G !== 'undefined' && G.state === 'photo'; let b = $('grRT');
  if (!on) { if (b) b.remove(); if (GR.photo) { GR.photo = false; GR.n = 0; } return; }
  if (!b) { b = document.createElement('button'); b.id = 'grRT'; b.className = 'btn'; b.style.cssText = 'position:fixed;right:18px;bottom:86px;z-index:60'; b.onclick = () => { GR.photo = !GR.photo; GR.n = 0; try { sfx.ui(); } catch (e) {} }; document.body.appendChild(b); }
  const t = GR.photo ? (GR.n >= 256 ? 'RAY TRACED · DONE (SAVE IT)' : `RAY TRACING · ${Math.min(100, Math.round(GR.n / 256 * 100))}%`) : 'RAY TRACE'; if (b.textContent !== t) b.textContent = t;
}
setInterval(() => { try { grPhotoUI(); } catch (e) {} }, 200);
