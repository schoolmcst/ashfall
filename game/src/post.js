/* ================================================================== POST: bloom, colour grading, vignette, FXAA, sharpen
   The world and the gun are drawn into an off-screen picture first (the same tone-mapped, sRGB picture as before), then
   one pass finishes it for the screen:
     BLOOM   - the bright parts (neon, lamps, muzzle flashes, fire, wonder weapons, the sun) leak a soft glow. A chain of
               smaller and smaller copies is blurred (dual Kawase) and added back. Night maps glow more than day maps.
     GRADE   - a little more contrast and colour, cool shadows and warm highlights (a film look), a soft vignette.
     EDGES   - with ANTI-ALIASING on and WebGL2 the off-screen picture has 4x MSAA itself; otherwise FXAA smooths the edges.
               HIGH adds a light sharpen (keeps the picture crisp at render scales under 100%).
   Settings > VIDEO > EFFECTS: BLOOM & COLOUR (OFF / LOW / HIGH) and GLOW. OFF draws straight to the screen as before.
   Presets: LOW = OFF, MEDIUM = LOW, HIGH and ULTRA = HIGH. PERFORMANCE MODE turns it off. */
const POST = { rt: null, ms: false, w: 0, h: 0, lv: [], quad: null, cam: null, mats: null, half: false, failed: false,
  grade: { bloom: 0.5, th: 0.78, knee: 0.2, sat: 1.1, con: 1.05, warm: 0.035, vig: 0.18 } };
const POST_OK = () => !POST.failed && ((S.post && S.post !== 'off') || (S.cbFilter && S.cbFilter !== 'off')) && !G.bench;
const CBF = { off: 0, deut: 1, prot: 2, trit: 3 };
// the grade for a map: from how dark its sky is (night maps glow more), or the map's own env.grade
function postEnv(e) {
  const c = new THREE.Color(e.top), h = new THREE.Color(e.horizon), L = 0.3 * (c.r + h.r) + 0.55 * (c.g + h.g) + 0.15 * (c.b + h.b), night = clamp((0.55 - L) / 0.4, 0, 1);
  Object.assign(POST.grade, { bloom: 0.3 + 0.3 * night, th: 0.92 - 0.14 * night, knee: 0.2, sat: 1.1, con: 1.05, warm: 0.035, vig: 0.1 + 0.03 * night }, e.grade || {});
}
const POST_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
function postMats() {
  if (POST.mats) return POST.mats;
  const mk = (fs, u) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: POST_VS, fragmentShader: fs, depthTest: false, depthWrite: false, toneMapped: false });
  // bright pass + first downsample: the picture is sRGB, the glow is summed in linear light
  const bright = mk([
    'uniform sampler2D src; uniform vec2 px; uniform vec2 sc; uniform float th; uniform float knee; varying vec2 vUv;',
    'vec3 lin(vec3 c){ return c * c * (c * 0.305306 + 0.682171) + c * 0.012522; }',   // fast sRGB -> linear
    'vec3 bp(vec2 uv){ vec3 c = texture2D(src, min(uv * sc, sc - px)).rgb; float l = max(c.r, max(c.g, c.b)); float w = smoothstep(th, th + knee, l); return lin(c) * w; }',
    'void main(){ vec3 s = bp(vUv) * 4.0; s += bp(vUv + vec2(-px.x, -px.y)); s += bp(vUv + vec2(px.x, -px.y)); s += bp(vUv + vec2(-px.x, px.y)); s += bp(vUv + px); gl_FragColor = vec4(s / 8.0, 1.0); }',
  ].join('\n'), { src: { value: null }, px: { value: new THREE.Vector2() }, sc: { value: new THREE.Vector2(1, 1) }, th: { value: 0.8 }, knee: { value: 0.2 } });
  const down = mk([
    'uniform sampler2D src; uniform vec2 px; varying vec2 vUv;',
    'void main(){ vec3 s = texture2D(src, vUv).rgb * 4.0; s += texture2D(src, vUv - px).rgb; s += texture2D(src, vUv + px).rgb; s += texture2D(src, vUv + vec2(px.x, -px.y)).rgb; s += texture2D(src, vUv + vec2(-px.x, px.y)).rgb; gl_FragColor = vec4(s / 8.0, 1.0); }',
  ].join('\n'), { src: { value: null }, px: { value: new THREE.Vector2() } });
  // upsample (tent) and add onto the bigger level below
  const up = mk([
    'uniform sampler2D src; uniform sampler2D base; uniform vec2 px; uniform float k; varying vec2 vUv;',
    'void main(){ vec3 s = texture2D(src, vUv + vec2(-px.x * 2.0, 0.0)).rgb + texture2D(src, vUv + vec2(px.x * 2.0, 0.0)).rgb + texture2D(src, vUv + vec2(0.0, -px.y * 2.0)).rgb + texture2D(src, vUv + vec2(0.0, px.y * 2.0)).rgb;',
    '  s += (texture2D(src, vUv + vec2(-px.x, px.y)).rgb + texture2D(src, vUv + vec2(px.x, px.y)).rgb + texture2D(src, vUv + vec2(-px.x, -px.y)).rgb + texture2D(src, vUv + vec2(px.x, -px.y)).rgb) * 2.0;',
    '  gl_FragColor = vec4(texture2D(base, vUv).rgb + s / 12.0 * k, 1.0); }',
  ].join('\n'), { src: { value: null }, base: { value: null }, px: { value: new THREE.Vector2() }, k: { value: 1 } });
  // the final picture: FXAA (when the picture has no MSAA), sharpen, bloom, grade, vignette
  const fin = mk([
    'uniform sampler2D src; uniform sampler2D bloom; uniform vec2 px; uniform float bk; uniform float sat; uniform float con; uniform float warm; uniform float vig; uniform float sharp; uniform float fxaa; uniform float useBloom; uniform vec2 sc; uniform float lift; uniform float cbm; uniform float cbk; varying vec2 vUv;',
    // COLOUR FILTER: simulate the colour vision deficiency, then move the colour that is lost into channels that are seen (daltonize)
    'vec3 dalton(vec3 c, float m){ float L = 17.8824*c.r + 43.5161*c.g + 4.11935*c.b, M = 3.45565*c.r + 27.1554*c.g + 3.86714*c.b, S = 0.0299566*c.r + 0.184309*c.g + 1.46709*c.b;',
    '  if (m > 2.5) { vec3 st = vec3(dot(c, vec3(1.255528, -0.076749, -0.178779)), dot(c, vec3(-0.078411, 0.930809, 0.147602)), dot(c, vec3(0.004733, 0.691367, 0.3039))); vec3 et = c - st; return c + vec3(0.7*et.b + et.r, 0.7*et.b + et.g, 0.0) * 0.6; }',   // tritanopia (Machado 2009, full)
    '  if (m < 1.5) M = 0.494207*L + 1.24827*S; else L = 2.02344*M - 2.52581*S;',
    '  vec3 sim = vec3(0.0809444479*L - 0.130504409*M + 0.116721066*S, -0.0102485335*L + 0.0540193266*M - 0.113614708*S, -0.000365296938*L - 0.00412161469*M + 0.693511405*S);',
    '  vec3 e = c - sim; return c + vec3(0.0, 0.7*e.r + e.g, 0.7*e.r + e.b); }',
    'vec3 lin(vec3 c){ return c * c * (c * 0.305306 + 0.682171) + c * 0.012522; }',
    'vec3 srgb(vec3 c){ c = max(c, 0.0); vec3 s1 = sqrt(c), s2 = sqrt(s1), s3 = sqrt(s2); return 0.662002687 * s1 + 0.684122060 * s2 - 0.323583601 * s3 - 0.0225411470 * c; }',
    'float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }',
    'vec3 fxaaAt(vec2 uv){',
    '  vec3 rgbNW = texture2D(src, uv + vec2(-1.0, -1.0) * px).rgb, rgbNE = texture2D(src, uv + vec2(1.0, -1.0) * px).rgb, rgbSW = texture2D(src, uv + vec2(-1.0, 1.0) * px).rgb, rgbSE = texture2D(src, uv + vec2(1.0, 1.0) * px).rgb, rgbM = texture2D(src, uv).rgb;',
    '  float lNW = luma(rgbNW), lNE = luma(rgbNE), lSW = luma(rgbSW), lSE = luma(rgbSE), lM = luma(rgbM);',
    '  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));',
    '  if (lMax - lMin < max(0.0312, lMax * 0.125)) return rgbM;',
    '  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));',
    '  float red = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125), rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);',
    '  dir = clamp(dir * rcp, vec2(-8.0), vec2(8.0)) * px;',
    '  vec3 a = 0.5 * (texture2D(src, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(src, uv + dir * (2.0 / 3.0 - 0.5)).rgb);',
    '  vec3 b = a * 0.5 + 0.25 * (texture2D(src, uv + dir * -0.5).rgb + texture2D(src, uv + dir * 0.5).rgb);',
    '  float lB = luma(b); return (lB < lMin || lB > lMax) ? a : b; }',
    'void main(){',
    '  vec2 uv = min(vUv * sc, sc - px);',
    '  vec3 c = fxaa > 0.5 ? fxaaAt(uv) : texture2D(src, uv).rgb;',
    '  if (sharp > 0.0) { vec3 n = texture2D(src, uv + vec2(px.x, 0.0)).rgb + texture2D(src, uv - vec2(px.x, 0.0)).rgb + texture2D(src, uv + vec2(0.0, px.y)).rgb + texture2D(src, uv - vec2(0.0, px.y)).rgb;',
    '    vec3 d = c - n * 0.25; c = clamp(c + d * sharp, 0.0, 1.0); }',
    '  vec3 l = lin(c);',
    '  if (useBloom > 0.5) l += texture2D(bloom, vUv).rgb * bk;',
    '  vec3 ex = max(l - 0.8, 0.0); l = min(l, vec3(0.8)) + ex / (1.0 + ex / 0.25);',   // a soft shoulder: glow never clips hard
    '  c = srgb(l);',
    '  float y = luma(c);',
    '  c = mix(vec3(y), c, sat);',
    '  c = mix(c, c * c * (3.0 - 2.0 * c), (con - 1.0) * 4.0 * smoothstep(0.35, 0.65, y));',   // contrast only in the mid and bright tones
    '  c += lift * (1.0 - smoothstep(0.0, 0.5, y)) * (1.0 - c);',   // SHADOW BRIGHTNESS: lifts the dark tones (things in shadow stay visible)
    '  c *= mix(vec3(1.0 - warm * 0.5, 1.0, 1.0 + warm), vec3(1.0 + warm, 1.0, 1.0 - warm * 0.7), smoothstep(0.15, 0.85, y));',   // cool shadows, warm highlights
    '  vec2 q = vUv - 0.5; c *= 1.0 - vig * smoothstep(0.25, 0.85, dot(q, q) * 2.2);',
    '  if (cbm > 0.5) c = mix(c, dalton(clamp(c, 0.0, 1.0), cbm), cbk);',
    '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
    '}',
  ].join('\n'), { src: { value: null }, bloom: { value: null }, px: { value: new THREE.Vector2() }, bk: { value: 0.5 }, sat: { value: 1 }, con: { value: 1 }, warm: { value: 0 }, vig: { value: 0 }, sharp: { value: 0 }, fxaa: { value: 0 }, useBloom: { value: 1 }, sc: { value: new THREE.Vector2(1, 1) }, lift: { value: 0.04 }, cbm: { value: 0 }, cbk: { value: 1 } });
  const copy = mk('uniform sampler2D src; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(src, vUv).rgb, 1.0); }', { src: { value: null } });
  POST.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fin); POST.quad.frustumCulled = false;
  POST.scene = new THREE.Scene(); POST.scene.add(POST.quad); POST.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return (POST.mats = { bright, down, up, fin, copy });
}
function postFree() { if (POST.rt) POST.rt.dispose(); for (const l of POST.lv) l.dispose(); POST.rt = null; POST.lv = []; POST.w = POST.h = 0; }
// (re)make the targets when the drawing size, the setting or the anti-aliasing changes
const _pSz = new THREE.Vector2();
// The targets are made at the full size (render scale without DYNAMIC RESOLUTION's reduction) and kept: when dynamic
// resolution lowers the size, the frame is drawn into the bottom-left corner and the passes read just that corner.
// Remaking ~10 targets (one with 4x MSAA) on every resolution step was a hitch every few seconds.
function postTargets() {
  renderer.getDrawingBufferSize(_pSz); const dw = Math.max(2, _pSz.x | 0), dh = Math.max(2, _pSz.y | 0), q = S.post, ms = S.aa !== 'off' && !!renderer.capabilities.isWebGL2;
  const bp = (typeof DR !== 'undefined' && DR.basePR) || renderer.getPixelRatio(), fw = Math.max(dw, Math.round(innerWidth * bp)), fh = Math.max(dh, Math.round(innerHeight * bp));
  POST.dw = dw; POST.dh = dh;
  if (POST.rt && POST.w >= dw && POST.h >= dh && POST.q === q && POST.ms === ms && !(POST.w > fw * 1.05 || POST.h > fh * 1.05)) return;
  const w = fw, h = fh;
  postFree(); POST.w = w; POST.h = h; POST.q = q; POST.ms = ms; POST.dw = dw; POST.dh = dh;
  const o = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false };
  POST.rt = ms ? new THREE.WebGLMultisampleRenderTarget(w, h, o) : new THREE.WebGLRenderTarget(w, h, o);
  if (ms) POST.rt.samples = 4;
  POST.rt.texture.encoding = THREE.sRGBEncoding; POST.rt.texture.generateMipmaps = false;
  // bloom levels: half float when the card can draw into it (no banding in dark glows), else 8 bit
  const ext = renderer.extensions, half = renderer.capabilities.isWebGL2 ? !!(ext.get('EXT_color_buffer_float') || ext.get('EXT_color_buffer_half_float')) : false;
  const lo = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false, type: half ? THREE.HalfFloatType : THREE.UnsignedByteType };
  const first = q === 'low' ? 4 : 2, n = q === 'low' ? 3 : 5;
  for (let i = 0; i < n; i++) { const d = first << i, lw = Math.max(1, Math.round(w / d)), lh = Math.max(1, Math.round(h / d)); if (lw < 4 || lh < 4) break; const t = new THREE.WebGLRenderTarget(lw, lh, lo); t.texture.generateMipmaps = false; POST.lv.push(t); }
  // a second set for the way back up (each level adds the blurred smaller level onto itself)
  POST.up = POST.lv.map(t => { const u = new THREE.WebGLRenderTarget(t.width, t.height, lo); u.texture.generateMipmaps = false; return u; });
  for (const u of POST.up || []) POST.lv.push(u);   // freed together
  POST.nl = n > POST.up.length ? POST.up.length : n; POST.half = half;
}
function postPass(mat, out) { POST.quad.material = mat; renderer.setRenderTarget(out); renderer.render(POST.scene, POST.cam); }
// draw the frame: draw(rt) renders the world (and the gun) into the target; then the finishing passes go to the screen
function postFrame(draw) {
  const M = postMats(); postTargets();
  POST.rt.viewport.set(0, 0, POST.dw, POST.dh); POST.rt.scissor.set(0, 0, POST.dw, POST.dh); POST.rt.scissorTest = true;
  renderer.setRenderTarget(POST.rt); renderer.clear(); draw();
  const sx = POST.dw / POST.w, sy = POST.dh / POST.h;
  const g = POST.grade, glow = clamp(S.bloom == null ? 100 : S.bloom, 0, 200) / 100, L = POST.nl, D = POST.lv.slice(0, L), U = POST.up, useB = glow > 0 && L > 0 && !!S.post && S.post !== 'off';
  if (useB) {
    // down: bright pass into the first level, then smaller and smaller
    M.bright.uniforms.src.value = POST.rt.texture; M.bright.uniforms.px.value.set(1 / POST.w, 1 / POST.h).multiplyScalar(D[0].width < POST.w / 3 ? 1.5 : 1); M.bright.uniforms.sc.value.set(sx, sy); M.bright.uniforms.th.value = g.th; M.bright.uniforms.knee.value = g.knee;
    postPass(M.bright, D[0]);
    for (let i = 1; i < L; i++) { M.down.uniforms.src.value = D[i - 1].texture; M.down.uniforms.px.value.set(0.5 / D[i - 1].width, 0.5 / D[i - 1].height); postPass(M.down, D[i]); }
    // up: the smallest level, blurred, added onto the next bigger one (wide soft glow plus a tight core)
    let prev = D[L - 1];
    for (let i = L - 2; i >= 0; i--) { M.up.uniforms.src.value = prev.texture; M.up.uniforms.base.value = D[i].texture; M.up.uniforms.px.value.set(0.5 / prev.width, 0.5 / prev.height); M.up.uniforms.k.value = 1.0; postPass(M.up, U[i]); prev = U[i]; }
    POST.bloomTex = prev.texture;
  }
  const f = M.fin.uniforms;
  f.src.value = POST.rt.texture; f.bloom.value = useB ? POST.bloomTex : POST.rt.texture; f.useBloom.value = useB ? 1 : 0; f.px.value.set(1 / POST.w, 1 / POST.h); f.sc.value.set(sx, sy); f.lift.value = 0.1 * clamp(S.shadowLift == null ? 60 : S.shadowLift, 0, 100) / 100;
  f.bk.value = g.bloom * glow; f.sat.value = g.sat; f.con.value = g.con; f.warm.value = g.warm; f.vig.value = g.vig;
  f.cbm.value = CBF[S.cbFilter] || 0; f.cbk.value = clamp((S.cbFilterK == null ? 100 : S.cbFilterK) / 100, 0, 1);
  if (!S.post || S.post === 'off') { f.bk.value = 0; f.sat.value = 1; f.con.value = 1; f.warm.value = 0; f.vig.value = 0; f.lift.value = 0; }   // only the colour filter
  f.fxaa.value = POST.ms || S.aa === 'off' ? 0 : 1; f.sharp.value = S.post === 'high' ? 0.22 : 0;
  if (!S.post || S.post === 'off') f.useBloom.value = 0;
  postPass(M.fin, null);
}
// the frame through the finishing passes, or straight to the screen; a GPU that cannot do it falls back for good
function postRender(drawScene) {
  if (!POST_OK()) { if (POST.rt) postFree(); renderer.setRenderTarget(null); renderer.clear(); drawScene(); return; }
  try { postFrame(drawScene); }
  catch (e) { POST.failed = true; postFree(); renderer.setRenderTarget(null); try { reportError(e); } catch (er) {} renderer.clear(); drawScene(); }
}
