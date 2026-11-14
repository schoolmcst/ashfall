/* ================================================================== GRAPHICS: the depth effects (1.2.113, the owner's graphics list)
   The world is drawn into POST's off-screen picture with a depth texture; straight after the world (before the gun) the
   depth is copied to a half-size LINEAR DEPTH picture (metres from the camera). From that:
     1  AMBIENT OCCLUSION + 3 CONTACT SHADOWS: soft dark corners and creases (two radii, half size, depth-aware blur).
     2  LIGHT SHAFTS: the sky round the sun is smeared toward the sun's place on screen (when you face the sun).
     10 LENS GLARE: a sideways streak and lens dirt lit by the glow (LENS EFFECTS).
     12 SCREEN-SPACE REFLECTIONS on flat floors and water: a short ray march in the depth; much stronger in the rain.
     21 HEIGHT FOG that pools low down, 27 DISTANT HAZE on the far edges.
     45 the gun blurs a little while aiming, 52 menus and the results blur the world behind them, 59 photo mode focus
        (DEPTH OF FIELD).
     51 MOTION BLUR from the camera's movement (OFF / LOW / HIGH; off by default, the gun stays sharp).
     53 CHROMATIC ABERRATION (with FILM GRAIN), 55 NIGHT VISION through scopes on night maps, 56 DAMAGE: colour drains from
        the edges when you are hit, 58 LOW HEALTH: the edges blur with your heartbeat.
     57 FILMIC LOOK (a gentle toe and shoulder), 54 a COLOUR GRADE for each map, 60 the ULTRA+ preset.
   Depth effects need the picture without MSAA (FXAA smooths the edges instead). Every effect is compiled in only when
   its setting is on (shader defines), so OFF costs nothing. A card without half-float pictures skips the depth effects. */
const GP = { lin: null, ao: null, ao2: null, sh: null, sh2: null, ssr: null, dof: null, mask: null, mb: null, w: 0, h: 0, mats: null, finKey: '', fin: null, prevVP: new THREE.Matrix4(), vp: new THREE.Matrix4(), wet: 0, nv: 0, dmg: 0, gradeMap: '', grade: null, failed: false, menuDof: 0 };
const GP_DEPTH = () => !GP.failed && POST.half !== false && renderer.capabilities.isWebGL2 && (S.ao && S.ao !== 'off' || S.shafts || S.ssr || S.hfog || S.dof || (S.mblur && S.mblur !== 'off'));
/* ---------- settings, presets */
Object.assign(QUALITY, { ultraplus: Object.assign({}, QUALITY.ultra, { scale: 100, prCap: 2 }) });
const GP_PRESET = { low: { ao: 'off', shafts: false, ssr: false, hfog: false, dof: false, mblur: 'off', lensFx: false, chroma: false, tone: 'classic' },
  medium: { ao: 'off', shafts: false, ssr: false, hfog: true, dof: false, mblur: 'off', lensFx: false, chroma: false, tone: 'classic' },
  high: { ao: 'low', shafts: true, ssr: false, hfog: true, dof: true, mblur: 'off', lensFx: true, chroma: false, tone: 'filmic' },
  ultra: { ao: 'high', shafts: true, ssr: true, hfog: true, dof: true, mblur: 'off', lensFx: true, chroma: false, tone: 'filmic' },
  ultraplus: { ao: 'high', shafts: true, ssr: true, hfog: true, dof: true, mblur: 'low', lensFx: true, chroma: true, tone: 'filmic', grain: true } };
const _gpPreset = applyPreset;
applyPreset = function (k) { const r = _gpPreset.apply(this, arguments); Object.assign(S, GP_PRESET[k] || GP_PRESET.high); return r; };
for (const k of Object.keys(GP_PRESET.high)) if (S[k] === undefined) S[k] = (GP_PRESET[qKey()] || GP_PRESET.high)[k];
(() => { try {
  const V = SCHEMA.VIDEO, qi = V.find(it => it.k === 'quality'); if (qi && !qi.opts.some(o => o[0] === 'ultraplus')) qi.opts.splice(qi.opts.findIndex(o => o[0] === 'custom'), 0, ['ultraplus', 'ULTRA+']);
  const at = V.findIndex(it => it.k === 'bloom') + 1, add = [
    { k: 'ao', t: 'seg', name: 'AMBIENT OCCLUSION', hint: 'Soft shadows in corners, creases and under things. Turns MSAA into FXAA', opts: [['off', 'OFF'], ['low', 'LOW'], ['high', 'HIGH']] },
    { k: 'shafts', t: 'toggle', name: 'LIGHT SHAFTS', hint: 'Rays of sunlight round edges when you face the sun' },
    { k: 'ssr', t: 'toggle', name: 'REFLECTIONS', hint: 'Screen-space reflections on floors and water, strong in the rain' },
    { k: 'hfog', t: 'toggle', name: 'HEIGHT FOG & HAZE', hint: 'Fog that sits low on the ground and haze on far edges' },
    { k: 'dof', t: 'toggle', name: 'DEPTH OF FIELD', hint: 'Blurs the world behind menus, the gun a little while aiming, photo mode focus' },
    { k: 'mblur', t: 'seg', name: 'MOTION BLUR', hint: 'Blur when you turn fast', opts: [['off', 'OFF'], ['low', 'LOW'], ['high', 'HIGH']] },
    { k: 'lensFx', t: 'toggle', name: 'LENS EFFECTS', hint: 'Glare streaks and lens dirt on bright lights' },
    { k: 'chroma', t: 'toggle', name: 'CHROMATIC ABERRATION', hint: 'Colour fringes at the edges of the screen' },
    { k: 'tone', t: 'seg', name: 'LOOK', hint: 'FILMIC: a softer, film-like contrast', opts: [['classic', 'CLASSIC'], ['filmic', 'FILMIC']] }];
  if (!V.some(it => it.k === 'ao')) V.splice(at, 0, ...add);
  for (const it of add) VIDEO_KEYS.add(it.k);
} catch (e) {} })();
/* ---------- the per-map colour grade (54) */
const GP_GRADE = {
  ruins: { tint: [1.03, 1.0, 0.95], sh: [0.0, 0.01, 0.03] }, docks: { tint: [0.97, 1.0, 1.04], sh: [0.0, 0.02, 0.04], sat: 1.05 }, town: { tint: [1.04, 1.01, 0.95], sh: [0.02, 0.0, 0.0] },
  metro: { tint: [0.96, 1.02, 1.0], sh: [0.0, 0.02, 0.02], sat: 0.95 }, stashisle: { tint: [1.02, 1.02, 0.97], sh: [0.0, 0.02, 0.01], sat: 1.12 }, funfair: { tint: [1.06, 0.98, 0.96], sh: [0.03, 0.0, 0.03], sat: 1.12 },
  homestead: { tint: [1.03, 1.02, 0.94], sh: [0.0, 0.02, 0.0], sat: 1.08 }, greenhouse: { tint: [0.98, 1.05, 0.97], sh: [0.0, 0.02, 0.0], sat: 1.1 }, stackyard: { tint: [1.02, 1.0, 0.97], sh: [0.0, 0.01, 0.03] },
  dustwater: { tint: [1.07, 1.0, 0.9], sh: [0.03, 0.01, 0.0], sat: 0.95 } };
function gpGradeFor(map) { const g = GP_GRADE[map] || GP_GRADE[String(map).replace(/_night$/, '')] || { tint: [1, 1, 1], sh: [0, 0, 0] }; const night = /_night$/.test(map) || (MAPS[map] || {}).night; return { tint: night ? [0.94, 0.98, 1.06] : g.tint, sh: night ? [0.0, 0.01, 0.05] : g.sh, sat: g.sat || 1 }; }
/* ---------- the targets */
const _gpTargets = postTargets;
postTargets = function () {
  const dep = GP_DEPTH(); if (POST.dep !== dep) { postFree(); POST.dep = dep; }
  const aa0 = S.aa; if (dep) S.aa = 'off'; const r = _gpTargets.apply(this, arguments); S.aa = aa0;
  if (dep && POST.rt && !POST.rt.depthTexture) { POST.rt.dispose(); const o = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false };
    POST.rt = new THREE.WebGLRenderTarget(POST.w, POST.h, o); POST.rt.texture.encoding = THREE.sRGBEncoding; POST.rt.texture.generateMipmaps = false; POST.rt.depthTexture = new THREE.DepthTexture(POST.w, POST.h); POST.rt.depthTexture.type = THREE.UnsignedIntType; POST.ms = false; }
  if (dep && (GP.w !== POST.w || GP.h !== POST.h || !GP.lin)) gpTargets();
  if (!dep && GP.lin) gpFree();
  return r;
};
function gpFree() { for (const k of ['lin', 'ao', 'ao2', 'sh', 'sh2', 'ssr', 'dof', 'mask', 'mb']) if (GP[k]) { GP[k].dispose(); GP[k] = null; } GP.w = GP.h = 0; }
function gpTargets() {
  gpFree(); GP.w = POST.w; GP.h = POST.h; const hw = Math.max(2, POST.w >> 1), hh = Math.max(2, POST.h >> 1), qw = Math.max(2, POST.w >> 2), qh = Math.max(2, POST.h >> 2);
  const mk = (w, h, half, near) => { const t = new THREE.WebGLRenderTarget(w, h, { minFilter: near ? THREE.NearestFilter : THREE.LinearFilter, magFilter: near ? THREE.NearestFilter : THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false, type: half ? THREE.HalfFloatType : THREE.UnsignedByteType }); t.texture.generateMipmaps = false; return t; };
  GP.lin = mk(hw, hh, true, true); GP.ao = mk(hw, hh); GP.ao2 = mk(hw, hh); GP.sh = mk(qw, qh); GP.sh2 = mk(qw, qh); GP.ssr = mk(hw, hh); GP.dof = mk(hw, hh); GP.mask = mk(qw, qh); GP.mb = mk(POST.w, POST.h);
  GP.mb.texture.encoding = THREE.sRGBEncoding;
}
/* ---------- the shaders */
const GP_VS = POST_VS;
const GP_LIB = [
  'uniform sampler2D dep; uniform vec2 px; uniform float tanY; uniform float asp; varying vec2 vUv;',
  'vec3 vpos(vec2 uv){ float z = texture2D(dep, uv).r; vec2 n = uv * 2.0 - 1.0; return vec3(n.x * tanY * asp * z, n.y * tanY * z, -z); }',
  'vec3 vnorm(vec2 uv, vec3 p){ vec3 a = vpos(uv + vec2(px.x, 0.0)) - p, b = vpos(uv + vec2(0.0, px.y)) - p, a2 = p - vpos(uv - vec2(px.x, 0.0)), b2 = p - vpos(uv - vec2(0.0, px.y));',
  '  if (abs(a2.z) < abs(a.z)) a = a2; if (abs(b2.z) < abs(b.z)) b = b2; vec3 n = normalize(cross(a, b)); return dot(n, p) > 0.0 ? -n : n; }',
  'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }'].join('\n');
function gpMats() {
  if (GP.mats) return GP.mats; const mk = (fs, u, d) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: GP_VS, fragmentShader: fs, defines: d || {}, depthTest: false, depthWrite: false, toneMapped: false });
  const U = () => ({ dep: { value: null }, px: { value: new THREE.Vector2() }, tanY: { value: 1 }, asp: { value: 1 } });
  // the depth buffer to metres
  const lin = mk('uniform sampler2D dt; uniform vec2 sc; uniform float near; uniform float far; varying vec2 vUv; void main(){ float d = texture2D(dt, vUv * sc).r; float z = d >= 0.99999 ? far : near * far / (far - d * (far - near)); gl_FragColor = vec4(z, 0.0, 0.0, 1.0); }',
    { dt: { value: null }, sc: { value: new THREE.Vector2(1, 1) }, near: { value: 0.05 }, far: { value: 500 } });
  // 1 + 3: occlusion at two radii (contact and room)
  const ao = mk(GP_LIB + '\nuniform float rad; uniform float k; uniform float far; void main(){ vec3 p = vpos(vUv); float z = -p.z; if (z > far * 0.9 || z > 120.0) { gl_FragColor = vec4(1.0); return; } vec3 n = vnorm(vUv, p);\n' +
    '  float occ = 0.0, con = 0.0, rnd0 = hash(vUv * 917.0) * 6.2832;\n' +
    '  for (int i = 0; i < SAMPLES; i++) { float f = (float(i) + 0.5) / float(SAMPLES), a = rnd0 + float(i) * 2.39996; float r = rad * f; vec2 o = vec2(cos(a), sin(a)) * r / (2.0 * z * tanY) * vec2(1.0 / asp, 1.0);\n' +
    '    vec3 v = vpos(vUv + o) - p; float l = length(v); occ += max(dot(n, v / max(l, 1e-4)) - 0.08, 0.0) * (1.0 - smoothstep(rad * 0.6, rad * 1.6, l));\n' +
    '    vec2 o2 = o * 0.22; vec3 v2 = vpos(vUv + o2) - p; float l2 = length(v2); con += max(dot(n, v2 / max(l2, 1e-4)) - 0.1, 0.0) * (1.0 - smoothstep(rad * 0.15, rad * 0.4, l2)); }\n' +
    '  float a = 1.0 - clamp(occ / float(SAMPLES) * k * 1.6 + con / float(SAMPLES) * k * 1.2, 0.0, 0.85); gl_FragColor = vec4(a, a, a, 1.0); }', Object.assign(U(), { rad: { value: 0.9 }, k: { value: 1 }, far: { value: 500 } }), { SAMPLES: 10 });
  // a depth-aware blur (x then y)
  const blur = mk('uniform sampler2D src; uniform sampler2D dep; uniform vec2 dir; varying vec2 vUv; void main(){ float z0 = texture2D(dep, vUv).r; float s = 0.0, w = 0.0; for (int i = -3; i <= 3; i++) { vec2 uv = vUv + dir * float(i); float z = texture2D(dep, uv).r; float k = 1.0 / (1.0 + abs(z - z0) * 4.0 / max(z0, 0.5)); s += texture2D(src, uv).r * k; w += k; } float a = s / w; gl_FragColor = vec4(a, a, a, 1.0); }',
    { src: { value: null }, dep: { value: null }, dir: { value: new THREE.Vector2() } });
  // 2: light shafts: bright sky near the sun, smeared toward it
  const shm = mk('uniform sampler2D src; uniform sampler2D dep; uniform vec2 sc; uniform vec2 sun; uniform float far; uniform float asp; varying vec2 vUv; void main(){ float sky = step(far * 0.9, texture2D(dep, vUv).r); vec3 c = texture2D(src, vUv * sc).rgb; float b = max(c.r, max(c.g, c.b)); vec2 d = (vUv - sun) * vec2(asp, 1.0); float near = 1.0 - smoothstep(0.0, 0.7, length(d)); gl_FragColor = vec4(c * sky * smoothstep(0.45, 1.0, b) * near, 1.0); }',
    { src: { value: null }, dep: { value: null }, sc: { value: new THREE.Vector2(1, 1) }, sun: { value: new THREE.Vector2() }, far: { value: 500 }, asp: { value: 1 } });
  const shr = mk('uniform sampler2D src; uniform vec2 sun; uniform float dens; varying vec2 vUv; void main(){ vec2 d = (vUv - sun) * dens / 32.0; vec2 uv = vUv; vec3 s = vec3(0.0); float w = 1.0; for (int i = 0; i < 32; i++) { uv -= d; s += texture2D(src, uv).rgb * w; w *= 0.955; } gl_FragColor = vec4(s / 14.0, 1.0); }',
    { src: { value: null }, sun: { value: new THREE.Vector2() }, dens: { value: 0.9 } });
  // 12: reflections on flat ground and water
  const ssr = mk(GP_LIB + '\nuniform sampler2D src; uniform vec2 sc; uniform mat3 camRot; uniform float k; uniform float far; void main(){ vec3 p = vpos(vUv); float z = -p.z; vec3 n = vnorm(vUv, p); vec3 nw = camRot * n; if (z > 80.0 || nw.y < 0.82) { gl_FragColor = vec4(0.0); return; }\n' +
    '  vec3 v = normalize(p), r = reflect(v, n); float t = 0.25, hit = 0.0; vec2 huv = vec2(0.0);\n' +
    '  for (int i = 0; i < 20; i++) { vec3 q = p + r * t; if (q.z > -0.06) break; vec2 uv = (q.xy / -q.z) / vec2(tanY * asp, tanY) * 0.5 + 0.5; if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) break; float sz = texture2D(dep, uv).r; float dz = -q.z - sz; if (dz > 0.03 && dz < 0.6 + t * 0.15) { hit = 1.0; huv = uv; break; } t *= 1.32; }\n' +
    '  if (hit < 0.5) { gl_FragColor = vec4(0.0); return; } vec2 e = smoothstep(0.0, 0.12, huv) * smoothstep(1.0, 0.88, huv); float fres = 0.15 + 0.85 * pow(1.0 - max(dot(-v, n), 0.0), 4.0);\n' +
    '  gl_FragColor = vec4(texture2D(src, huv * sc).rgb, e.x * e.y * fres * k * (1.0 - smoothstep(40.0, 80.0, z))); }', Object.assign(U(), { src: { value: null }, sc: { value: new THREE.Vector2(1, 1) }, camRot: { value: new THREE.Matrix3() }, k: { value: 0.3 }, far: { value: 500 } }));
  // 52 / 59: depth of field (gather blur by the circle of confusion)
  const dof = mk('uniform sampler2D src; uniform sampler2D dep; uniform vec2 sc; uniform vec2 px; uniform float focus; uniform float range; uniform float maxR; uniform float allb; varying vec2 vUv;\n' +
    'float coc(float z){ return allb > 0.5 ? 1.0 : clamp(abs(z - focus) / max(range, 0.01), 0.0, 1.0); }\n' +
    'void main(){ float c0 = coc(texture2D(dep, vUv).r); vec3 s = vec3(0.0); float w = 0.0; for (int i = 0; i < 16; i++) { float a = float(i) * 2.39996, r = sqrt((float(i) + 0.5) / 16.0); vec2 o = vec2(cos(a), sin(a)) * r * maxR * c0 * px; vec2 uv = vUv + o; float cz = coc(texture2D(dep, uv).r); float k = max(cz, 0.2); s += texture2D(src, uv * sc).rgb * k; w += k; }\n' +
    '  gl_FragColor = vec4(s / w, c0); }', { src: { value: null }, dep: { value: null }, sc: { value: new THREE.Vector2(1, 1) }, px: { value: new THREE.Vector2() }, focus: { value: 10 }, range: { value: 20 }, maxR: { value: 6 }, allb: { value: 0 } });
  // 51: motion blur from the camera's movement (the gun mask keeps the gun sharp)
  const mb = mk('uniform sampler2D src; uniform sampler2D dep; uniform sampler2D mask; uniform vec2 sc; uniform mat4 camW; uniform mat4 prevVP; uniform float tanY; uniform float asp; uniform float k; varying vec2 vUv;\n' +
    'void main(){ vec2 uv = vUv * sc; vec3 c = texture2D(src, uv).rgb; if (texture2D(mask, vUv).r > 0.5) { gl_FragColor = vec4(c, 1.0); return; } float z = min(texture2D(dep, vUv).r, 300.0); vec2 n = vUv * 2.0 - 1.0;\n' +
    '  vec4 w = camW * vec4(n.x * tanY * asp * z, n.y * tanY * z, -z, 1.0); vec4 pc = prevVP * w; vec2 puv = pc.xy / pc.w * 0.5 + 0.5; vec2 vel = clamp((vUv - puv) * k, vec2(-0.035), vec2(0.035));\n' +
    '  for (int i = 1; i < 8; i++) { vec2 o = vel * (float(i) / 7.0 - 0.5); c += texture2D(src, clamp(vUv + o, vec2(0.0), vec2(1.0)) * sc).rgb; } gl_FragColor = vec4(c / 8.0, 1.0); }',
    { src: { value: null }, dep: { value: null }, mask: { value: null }, sc: { value: new THREE.Vector2(1, 1) }, camW: { value: new THREE.Matrix4() }, prevVP: { value: new THREE.Matrix4() }, tanY: { value: 1 }, asp: { value: 1 }, k: { value: 0.6 } });
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  return (GP.mats = { lin, ao, blur, shm, shr, ssr, dof, mb, white });
}
// the finishing pass: post.js's look plus the new effects, compiled for the settings in use
function gpFin(D) {
  const key = JSON.stringify(D); if (GP.fin && GP.finKey === key) return GP.fin; if (GP.fin) GP.fin.dispose(); GP.finKey = key;
  const old = postMats().fin, fs = old.fragmentShader;
  const head = 'uniform sampler2D dep; uniform sampler2D aoT; uniform sampler2D shT; uniform sampler2D ssrT; uniform sampler2D dofT; uniform sampler2D maskT; uniform vec3 shCol; uniform float shK; uniform vec3 fogCol; uniform float fogDen; uniform float fogH0; uniform float fogFall; uniform float hazeK; uniform vec3 camPos; uniform mat3 camRot; uniform float tanY; uniform float asp; uniform float far; uniform float time; uniform float lensK; uniform float caK; uniform float nv; uniform float dmg; uniform float lowhp; uniform vec3 tint; uniform vec3 shTint; uniform float gsat; uniform float adsBlur; uniform float dofK; uniform vec4 shim[4]; uniform float flashK;\n' +
    'float hsh(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n';
  let body = fs.replace('void main(){', head + 'void main(){');
  // sampling: chromatic aberration, the aiming gun blur, low-health edge blur, then the depth effects on the linear colour
  body = body.replace('  vec2 uv = min(vUv * sc, sc - px);', '  vec2 uv = min(vUv * sc, sc - px);\n#ifdef SHIMMER\n  for (int i = 0; i < 4; i++) { vec4 h = shim[i]; if (h.w > 0.0) { vec2 d = (vUv - h.xy) * vec2(asp, 1.0); float k = h.w * (1.0 - smoothstep(0.0, h.z, length(d))) * smoothstep(-0.05, 0.1, vUv.y - h.y + h.z); uv += vec2(sin(vUv.y * 90.0 + time * 7.0), cos(vUv.x * 70.0 + time * 5.0)) * 0.0022 * k * sc; } }\n  uv = min(uv, sc - px);\n#endif');
  body = body.replace("  vec3 c = fxaa > 0.5 ? fxaaAt(uv) : texture2D(src, uv).rgb;", [
    '  vec3 c = fxaa > 0.5 ? fxaaAt(uv) : texture2D(src, uv).rgb;',
    '#ifdef CA', '  { vec2 d = (vUv - 0.5) * caK * dot(vUv - 0.5, vUv - 0.5) * 2.0; c.r = texture2D(src, min((vUv + d) * sc, sc - px)).r; c.b = texture2D(src, min((vUv - d) * sc, sc - px)).b; }', '#endif',
    '#ifdef ADSBLUR', '  if (adsBlur > 0.01) { float m = texture2D(maskT, vUv).r; if (m > 0.5) { vec3 b = vec3(0.0); for (int i = 0; i < 8; i++) { float a = float(i) * 0.785; b += texture2D(src, uv + vec2(cos(a), sin(a)) * px * 2.5).rgb; } c = mix(c, b / 8.0, adsBlur * m); } }', '#endif',
    '  if (lowhp > 0.01) { vec2 q = vUv - 0.5; float e = smoothstep(0.08, 0.35, dot(q, q)) * lowhp; if (e > 0.01) { vec3 b = vec3(0.0); for (int i = 0; i < 6; i++) { float a = float(i) * 1.047; b += texture2D(src, min(uv + vec2(cos(a), sin(a)) * px * 6.0 * e, sc - px)).rgb; } c = mix(c, b / 6.0, e); } }',
    '#ifdef DOF', '  { vec4 d = texture2D(dofT, vUv); c = mix(c, d.rgb, smoothstep(0.0, 1.0, d.a) * dofK); }', '#endif',
  ].join('\n'));
  body = body.replace('  vec3 l = lin(c);', [
    '  vec3 l = lin(c);',
    '  float zz = texture2D(dep, vUv).r;',
    '#ifdef AO', '  l *= mix(1.0, texture2D(aoT, vUv).r, 1.0 - smoothstep(60.0, 110.0, zz));', '#endif',
    '#ifdef SSR', '  { vec4 r = texture2D(ssrT, vUv); l = mix(l, lin(r.rgb), clamp(r.a, 0.0, 0.85)); }', '#endif',
    '#ifdef FOG', '  if (zz < far * 0.9) { vec2 n2 = vUv * 2.0 - 1.0; vec3 rd = camRot * normalize(vec3(n2.x * tanY * asp, n2.y * tanY, -1.0)); float dist = zz / max(-normalize(vec3(n2.x * tanY * asp, n2.y * tanY, -1.0)).z, 0.1); float wy = camPos.y + rd.y * dist, ha = 0.5 * (camPos.y + wy);',
    '    float f = 1.0 - exp(-dist * fogDen * exp(-max(ha - fogH0, 0.0) * fogFall)); f = clamp(f + smoothstep(110.0, 380.0, dist) * hazeK, 0.0, 0.9); l = mix(l, lin(fogCol), f); }', '#endif',
    '#ifdef SHAFTS', '  l += lin(texture2D(shT, vUv).rgb) * shCol * shK;', '#endif',
    '#ifdef LENS', '  if (useBloom > 0.5) { vec3 st = vec3(0.0); for (int i = -4; i <= 4; i++) st += texture2D(bloom, vUv + vec2(float(i) * 0.018, 0.0)).rgb; float dirt = smoothstep(0.55, 0.9, hsh(floor(vUv * vec2(9.0, 6.0)))) * 0.6 + 0.4 * smoothstep(0.3, 0.0, length(fract(vUv * vec2(9.0, 6.0)) - 0.5)); l += st / 9.0 * vec3(0.7, 0.85, 1.2) * 0.35 * lensK + texture2D(bloom, vUv).rgb * dirt * 0.4 * lensK; }', '#endif',
  ].join('\n'));
  body = body.replace('  vec3 ex = max(l - 0.8, 0.0); l = min(l, vec3(0.8)) + ex / (1.0 + ex / 0.25);', [
    '#ifdef FILMIC', '  l = l * l / (l + 0.015); l = l / (1.0 + l * 0.22) * 1.2; vec3 ex = max(l - 0.9, 0.0); l = min(l, vec3(0.9)) + ex / (1.0 + ex / 0.2);', '#else', '  vec3 ex = max(l - 0.8, 0.0); l = min(l, vec3(0.8)) + ex / (1.0 + ex / 0.25);', '#endif',
  ].join('\n'));
  body = body.replace('  vec2 q = vUv - 0.5; c *= 1.0 - vig * smoothstep(0.25, 0.85, dot(q, q) * 2.2);', [
    '  c *= tint; c += shTint * (1.0 - smoothstep(0.0, 0.45, y)); c = mix(vec3(luma(c)), c, gsat);',
    '  vec2 q = vUv - 0.5; c *= 1.0 - vig * smoothstep(0.25, 0.85, dot(q, q) * 2.2);',
    '  if (dmg > 0.01) { float e = smoothstep(0.05, 0.4, dot(q, q) * 2.0) * dmg; c = mix(c, vec3(luma(c)) * vec3(1.25, 0.45, 0.4), e); }',
    '  c += flashK * vec3(0.75, 0.82, 1.0) * (0.35 + 0.65 * step(far * 0.9, zz));',
    '  if (nv > 0.01) { float L2 = luma(c); vec3 g = vec3(0.12, 1.0, 0.25) * (L2 * 1.9 + 0.04) + (hsh(vUv * 734.0 + time) - 0.5) * 0.12; g *= 1.0 - smoothstep(0.18, 0.26, dot(q, q)); c = mix(c, g, nv); }',
  ].join('\n'));
  const D2 = {}; for (const k in D) if (D[k]) D2[k] = 1;
  const u = Object.assign({}, THREE.UniformsUtils.clone(old.uniforms), { dep: { value: null }, aoT: { value: null }, shT: { value: null }, ssrT: { value: null }, dofT: { value: null }, maskT: { value: null }, shCol: { value: new THREE.Color() }, shK: { value: 0 }, fogCol: { value: new THREE.Color() }, fogDen: { value: 0 }, fogH0: { value: 0 }, fogFall: { value: 0.5 }, hazeK: { value: 0 }, camPos: { value: new THREE.Vector3() }, camRot: { value: new THREE.Matrix3() }, tanY: { value: 1 }, asp: { value: 1 }, far: { value: 500 }, time: { value: 0 }, lensK: { value: 1 }, caK: { value: 0.01 }, nv: { value: 0 }, dmg: { value: 0 }, lowhp: { value: 0 }, tint: { value: new THREE.Vector3(1, 1, 1) }, shTint: { value: new THREE.Vector3() }, gsat: { value: 1 }, adsBlur: { value: 0 }, dofK: { value: 1 }, shim: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] }, flashK: { value: 0 } });
  if (body.split('#ifdef').length < 9) console.warn('gpFin: a post.js line changed, some effects were not added');
  GP.fin = new THREE.ShaderMaterial({ uniforms: u, vertexShader: old.vertexShader, fragmentShader: body, defines: D2, depthTest: false, depthWrite: false, toneMapped: false });
  return GP.fin;
}
/* ---------- depth: copied right after the world is drawn, before the gun */
const _gpRender = renderer.render.bind(renderer);
renderer.render = function (sc, cam) {
  const r = _gpRender(sc, cam);
  if (GP.capture && sc === scene && POST.rt && POST.rt.depthTexture && renderer.getRenderTarget() === POST.rt) { GP.capture = false; try { gpCopyDepth(cam); } catch (e) { GP.failed = true; reportError(e); } renderer.setRenderTarget(POST.rt); }
  return r;
};
function gpCopyDepth(cam) {
  const M = gpMats(), m = M.lin.uniforms; m.dt.value = POST.rt.depthTexture; m.sc.value.set(POST.dw / POST.w, POST.dh / POST.h); m.near.value = cam.near; m.far.value = cam.far;
  const vp = GP.lin.viewport; postPass(M.lin, GP.lin);
}
/* ---------- the frame */
const _v3a = new THREE.Vector3(), _m4a = new THREE.Matrix4();
function gpUpdateState(dt) {
  GP.wet += ((typeof AMB !== 'undefined' && AMB.kind === 'rain' ? 1 : 0) - GP.wet) * Math.min(1, dt * 0.5);
  const night = !!(MAPS[curMap] && (MAPS[curMap].night || /_night$/.test(curMap))); GP.nv += ((night && G.scoped && G.state === 'playing' ? 1 : 0) - GP.nv) * Math.min(1, dt * 8);
  const since = G.time - (G.lastHit || -99); GP.dmg = G.state === 'playing' ? Math.max(0, 1 - since / 0.6) * 0.8 : 0;
  const hpk = (G.maxHp || 100) > 0 ? G.health / (G.maxHp || 100) : 1; GP.lowhp = G.state === 'playing' && hpk < 0.3 && hpk > 0 ? (0.3 - hpk) / 0.3 * (0.6 + 0.4 * Math.max(0, Math.sin(NOW * 7))) : 0;
  if (GP.gradeMap !== curMap) { GP.gradeMap = curMap; GP.grade = gpGradeFor(curMap); }
  GP.menuDof += ((S.dof && curScreen && curScreen !== 'pause' && G.state !== 'menu' && G.state !== 'playing' ? 1 : (S.dof && curScreen === 'pause') ? 0.6 : 0) - GP.menuDof) * Math.min(1, dt * 5);
}
const _gpFrame = postFrame;
postFrame = function (draw) {
  const dep = GP_DEPTH(); if (!dep && !GP.fin) return _gpFrame.apply(this, arguments);
  const t0 = performance.now(), dt = Math.min(0.1, (t0 - (GP.lastT || t0)) / 1000); GP.lastT = t0; gpUpdateState(dt);
  // the original pipeline, but its final pass is swapped for ours
  const Mo = postMats(), oldFin = Mo.fin, ao = S.ao && S.ao !== 'off', mbl = S.mblur && S.mblur !== 'off', photo = G.state === 'photo';
  const ads = S.dof && G.state === 'playing' && (G.ads || 0) > 0.6 && !G.scoped;
  const D = { AO: dep && ao, SHAFTS: dep && S.shafts, SSR: dep && S.ssr, FOG: dep && S.hfog, DOF: dep && S.dof && (GP.menuDof > 0.02 || photo), ADSBLUR: dep && ads, LENS: S.lensFx && S.post && S.post !== 'off', CA: S.chroma, FILMIC: S.tone === 'filmic', SHIMMER: typeof GA !== 'undefined' && GA.shim.some(h => h.w > 0) };
  const fin = gpFin(D); Mo.fin = fin; POST.quad.material = fin;
  if (dep) GP.capture = true;
  // the wrapped call draws the world (depth copied mid-way), the bloom chain, then our final pass (with nothing new set yet: set below and re-run the final)
  const origPass = postPass; let finalOut = null;
  postPass = function (mat, out) { if (mat === fin && out === null) { finalOut = true; return; } return origPass(mat, out); };
  try { _gpFrame.apply(this, arguments); } finally { postPass = origPass; Mo.fin = oldFin; GP.capture = false; }
  const M = gpMats(), cam = camera, asp = cam.aspect, tanY = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2), sx = POST.dw / POST.w, sy = POST.dh / POST.h, f = fin.uniforms;
  f.dep.value = dep ? GP.lin.texture : POST.rt.texture; f.tanY.value = tanY; f.asp.value = asp; f.far.value = cam.far; f.time.value = NOW % 100;
  cam.updateMatrixWorld(); f.camPos.value.setFromMatrixPosition(cam.matrixWorld); f.camRot.value.setFromMatrix4(cam.matrixWorld);
  const lib = m => { m.uniforms.dep.value = GP.lin.texture; m.uniforms.px.value.set(1 / GP.lin.width, 1 / GP.lin.height); m.uniforms.tanY.value = tanY; m.uniforms.asp.value = asp; };
  // gun mask (for the aiming blur and to keep the gun out of motion blur)
  if (dep && (ads || mbl) && typeof vmScene !== 'undefined' && viewmodel && viewmodel.visible) { const om = vmScene.overrideMaterial, cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha(); vmScene.overrideMaterial = M.white; renderer.setRenderTarget(GP.mask); renderer.setClearColor(0x000000, 1); renderer.clear(); _gpRender(vmScene, vmCamera); vmScene.overrideMaterial = om; renderer.setClearColor(cc, ca); }
  else if (dep && GP.mask) { renderer.setRenderTarget(GP.mask); renderer.setClearColor(0x000000, 1); renderer.clear(); }
  if (D.AO) { lib(M.ao); M.ao.uniforms.far.value = cam.far; M.ao.uniforms.k.value = S.ao === 'high' ? 1.25 : 0.9; const want = S.ao === 'high' ? 14 : 8; if (M.ao.defines.SAMPLES !== want) { M.ao.defines.SAMPLES = want; M.ao.needsUpdate = true; } postPass(M.ao, GP.ao);
    const b = M.blur.uniforms; b.dep.value = GP.lin.texture; b.src.value = GP.ao.texture; b.dir.value.set(1 / GP.ao.width, 0); postPass(M.blur, GP.ao2); b.src.value = GP.ao2.texture; b.dir.value.set(0, 1 / GP.ao.height); postPass(M.blur, GP.ao); f.aoT.value = GP.ao.texture; }
  if (D.SHAFTS) { const sp = _v3a.copy(SUN_POS).normalize().multiplyScalar(400).add(cam.position).project(cam), face = cam.getWorldDirection(new THREE.Vector3()).dot(_v3a.copy(SUN_POS).normalize());
    if (face > 0.15 && sp.z < 1) { const su = new THREE.Vector2(sp.x * 0.5 + 0.5, sp.y * 0.5 + 0.5); const a = M.shm.uniforms; a.src.value = POST.rt.texture; a.dep.value = GP.lin.texture; a.sc.value.set(sx, sy); a.sun.value.copy(su); a.far.value = cam.far; a.asp.value = asp; postPass(M.shm, GP.sh);
      const b = M.shr.uniforms; b.src.value = GP.sh.texture; b.sun.value.copy(su); postPass(M.shr, GP.sh2); f.shT.value = GP.sh2.texture; f.shK.value = 0.55 * Math.min(1, (face - 0.15) * 2); f.shCol.value.copy(skyMat.uniforms.sunCol.value); }
    else { f.shK.value = 0; f.shT.value = GP.sh2.texture; } }
  if (D.SSR) { lib(M.ssr); const s = M.ssr.uniforms; s.src.value = POST.rt.texture; s.sc.value.set(sx, sy); s.camRot.value.setFromMatrix4(cam.matrixWorld); s.k.value = 0.12 + 0.5 * GP.wet; s.far.value = cam.far; postPass(M.ssr, GP.ssr); f.ssrT.value = GP.ssr.texture; }
  if (D.DOF) { const d = M.dof.uniforms; d.src.value = POST.rt.texture; d.dep.value = GP.lin.texture; d.sc.value.set(sx, sy); d.px.value.set(1 / GP.dof.width, 1 / GP.dof.height);
    if (photo) { d.focus.value = typeof PHOTO !== 'undefined' && PHOTO.focus ? PHOTO.focus : 8; d.range.value = typeof PHOTO !== 'undefined' && PHOTO.range ? PHOTO.range : 12; d.allb.value = 0; d.maxR.value = 7; f.dofK.value = typeof PHOTO !== 'undefined' && PHOTO.dofOff ? 0 : 1; }
    else { d.allb.value = 1; d.maxR.value = 5; f.dofK.value = GP.menuDof; }
    postPass(M.dof, GP.dof); f.dofT.value = GP.dof.texture; }
  f.maskT.value = GP.mask ? GP.mask.texture : POST.rt.texture; f.adsBlur.value = ads ? 0.55 * Math.min(1, ((G.ads || 0) - 0.6) / 0.4) : 0;
  if (D.FOG) { const fog = scene.fog, mp = MAPS[curMap] || {}; f.fogCol.value.copy(fog ? fog.color : new THREE.Color(0x888888)); f.fogDen.value = (mp.hfog || 0.004) * (1 + GP.wet * 1.2); f.fogH0.value = mp.hfogH !== undefined ? mp.hfogH : 0.2; f.fogFall.value = 1.2; f.hazeK.value = mp.indoor ? 0 : 0.12; }
  f.lensK.value = clamp((S.bloom == null ? 100 : S.bloom) / 100, 0, 2); f.caK.value = 0.012; f.nv.value = GP.nv; f.dmg.value = GP.dmg; f.lowhp.value = GP.lowhp;
  const g = GP.grade || gpGradeFor(curMap), on = S.post && S.post !== 'off'; f.tint.value.set(...(on ? g.tint : [1, 1, 1])); f.shTint.value.set(...(on ? g.sh : [0, 0, 0])); f.gsat.value = on ? g.sat : 1;
  try { if (typeof GA !== 'undefined') { for (let i = 0; i < 4; i++) f.shim.value[i].copy(GA.shim[i]); f.flashK.value = GA.flash; } } catch (e) {}
  let src = POST.rt.texture;
  if (dep && mbl) { const m = M.mb.uniforms; m.src.value = POST.rt.texture; m.dep.value = GP.lin.texture; m.mask.value = GP.mask.texture; m.sc.value.set(sx, sy); _m4a.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); GP.vp.copy(_m4a); m.camW.value.copy(cam.matrixWorld); m.tanY.value = tanY; m.asp.value = asp; m.prevVP.value.copy(GP.hasPrev ? GP.prevVP : _m4a); GP.hasPrev = true; m.k.value = (S.mblur === 'high' ? 1.0 : 0.5) * Math.min(1, 1 / 60 / Math.max(dt, 1 / 240));
    postPass(M.mb, GP.mb); GP.prevVP.copy(_m4a); src = GP.mb.texture; f.sc.value.set(1, 1); }
  f.src.value = src;
  if (finalOut) postPass(fin, null);
};
