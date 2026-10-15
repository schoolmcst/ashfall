/* ================================================================== renderer, sky, lighting */
// Fog is applied after tone mapping, so it takes a plain sRGB colour; materials and lights want linear colours.
const C = hex => new THREE.Color(hex).convertSRGBToLinear();
// anti-aliasing and which GPU to use are fixed when the page starts (Settings > VIDEO says 'applies on next launch')
const renderer = new THREE.WebGLRenderer({ antialias: S.aa !== 'off', powerPreference: S.gpuPref === 'low' ? 'low-power' : 'high-performance' });
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = false;
document.body.prepend(renderer.domElement);
// pick a preset for AUTO from the GPU name: current discrete cards get ULTRA, integrated / software GPUs get MEDIUM
let AUTO_TIER = 'high', GPU_NAME = '';
try {
  const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
  GPU_NAME = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  if (/RTX|RX\s?[5-9]\d{3}|RX\s?[6-9]\d{2}\b|Radeon Pro W|Arc.*A7|Apple M\d (Pro|Max|Ultra)|GTX 1[0-9]80|GTX 1070/i.test(GPU_NAME)) AUTO_TIER = 'ultra';
  else if (/Intel|UHD|Iris|Mali|Adreno|PowerVR|SwiftShader|llvmpipe|Microsoft Basic|Apple GPU/i.test(GPU_NAME)) AUTO_TIER = 'medium';
} catch (e) {}
if (NEED_AUTO_DERIVE && S.quality === 'auto') { applyPreset(AUTO_TIER); saveSettings(); }
else if (CFG5) {   // saved before 1.2.11: keep what they had, and fill the new detail settings from their preset
  const k = qKey(), q = QUALITY[k] || QUALITY.high;
  Object.assign(S, { anis: q.anis, grass: q.grass, fxQ: q.fx, texQ: q.tex >= 512 ? 'high' : 'low', shadowDist: 100 });
  if (k === 'ultra' && S.shadows === 'high') S.shadows = 'ultra';   // ULTRA already had 4096 shadows
  S.cfgVer = 5; saveSettings();
}
const MAXANIS = renderer.capabilities && renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4;
// what this computer can do (shown in Settings > VIDEO > YOUR HARDWARE, and used to cap the settings)
const HW = { maxTex: 4096, maxRB: 4096, cores: 0, mem: 0, hz: 60, hzN: 0 };
try { const gl = renderer.getContext(); HW.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) | 0; HW.maxRB = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) | 0, (gl.getParameter(gl.MAX_VIEWPORT_DIMS) || [16384])[0] | 0); } catch (e) {}
try { HW.cores = navigator.hardwareConcurrency | 0; HW.mem = +navigator.deviceMemory || 0; } catch (e) {}
// shadow resolution this GPU can actually hold
const shadowRes = k => Math.min((SHADOWQ[k] || SHADOWQ.high).res, HW.maxTex || 4096);
// display refresh rate, measured from the frame timing while the menu is up (rounded to a common rate)
const HZ_STD = [30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 170, 180, 200, 240, 280, 360, 500];
let hzSamples = [];
function sampleHz(raw) {
  if (HW.hzN > 3 || raw <= 0 || raw > 0.05) return;
  hzSamples.push(raw);
  if (hzSamples.length < 90) return;
  const s = hzSamples.sort((a, b) => a - b), med = s[s.length >> 1], hz = 1 / med; hzSamples = [];
  const best = HZ_STD.reduce((a, b) => Math.abs(b - hz) < Math.abs(a - hz) ? b : a, 60);
  if (Math.abs(best - hz) / best < 0.06) { if (best > HW.hz || HW.hzN === 0) HW.hz = best; HW.hzN++; }
}

const HORIZON_HEX = 0xb9c2c4, TOP_HEX = 0x5f86b4;
let ENV_EXPOSURE = 1.05;   // per-map exposure (maps.js applyEnv)
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(HORIZON_HEX, 0.0105);
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 500);
camera.rotation.order = 'YXZ';
scene.add(camera);

// the weapon is drawn in its own pass (same camera optics) so it never clips into walls
const vmScene = new THREE.Scene();
const vmCamera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.02, 10);
vmScene.add(vmCamera);

const SUN_POS = new THREE.Vector3(-38, 52, 26);
const sun = new THREE.DirectionalLight(C(0xffe9c8), 2.2);
sun.position.copy(SUN_POS);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -58, right: 58, top: 58, bottom: -58, near: 5, far: 160 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
scene.add(sun);
const hemi = new THREE.HemisphereLight(C(0xbcd0e4), C(0x4b4433), 0.5);
scene.add(hemi);

const vmSun = new THREE.DirectionalLight(C(0xffe9c8), 1.6); vmSun.position.set(-1, 2, 1.2); vmScene.add(vmSun);
const vmHemi = new THREE.HemisphereLight(C(0xbcd0e4), C(0x4b4433), 0.7); vmScene.add(vmHemi);
const muzzleLight = new THREE.PointLight(C(0xffb35a), 0, 18, 2); scene.add(muzzleLight);
const vmFlashLight = new THREE.PointLight(C(0xffb35a), 0, 2.5, 2); vmFlashLight.position.set(0.1, -0.05, -0.7); vmScene.add(vmFlashLight);
const enemyFlashLight = new THREE.PointLight(C(0xffb35a), 0, 14, 2); scene.add(enemyFlashLight);

// sky dome: gradient, sun and drifting clouds (authored in sRGB, output without tone mapping so it matches the fog)
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
  uniforms: {
    sunDir: { value: SUN_POS.clone().normalize() }, top: { value: C(TOP_HEX) }, horizon: { value: C(HORIZON_HEX) },
    sunCol: { value: C(0xffe2a8) }, time: { value: 0 },
  },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: [
    'uniform vec3 sunDir; uniform vec3 top; uniform vec3 horizon; uniform vec3 sunCol; uniform float time; varying vec3 vDir;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
    'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x), f.y); }',
    'float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*noise(p); p*=2.03; a*=0.5; } return s; }',
    'void main(){',
    '  vec3 d = normalize(vDir);',
    '  float h = clamp(d.y, 0.0, 1.0);',
    '  vec3 col = mix(horizon, top, pow(h, 0.5));',
    '  float sd = max(dot(d, normalize(sunDir)), 0.0);',
    '  col += sunCol * (pow(sd, 900.0) * 4.0 + pow(sd, 28.0) * 0.28 + pow(sd, 5.0) * 0.12);',
    '  if (d.y > 0.0) {',
    '    vec2 uv = d.xz / (d.y + 0.22) * 0.8 + vec2(time * 0.006, time * 0.002);',
    '    float c = fbm(uv * 1.7);',
    '    float cl = smoothstep(0.47, 0.8, c);',
    '    vec3 cc = mix(vec3(0.5, 0.52, 0.56), vec3(0.95), smoothstep(0.4, 0.95, c));',
    '    cc *= 0.85 + 0.35 * pow(sd, 2.0);',
    '    col = mix(col, cc, cl * smoothstep(0.0, 0.18, d.y) * 0.9);',
    '  }',
    '  col = mix(col, horizon * 0.92, smoothstep(0.0, -0.12, d.y));',
    '  gl_FragColor = vec4(col, 1.0);',
    '  #include <encodings_fragment>',
    '}',
  ].join('\n'),
});
const skyGeo = new THREE.SphereGeometry(300, 32, 16);
const sky = new THREE.Mesh(skyGeo, skyMat);
sky.renderOrder = -1000; sky.frustumCulled = false;
scene.add(sky);

// image-based lighting from the sky: soft ambient light and believable reflections on metal
let envTex = null;
function buildEnvironment() {
  try {
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(skyGeo, skyMat));
    const pm = new THREE.PMREMGenerator(renderer);
    const rt = pm.fromScene(envScene);
    envTex = rt.texture; scene.environment = envTex; vmScene.environment = envTex;
    pm.dispose();
    hemi.intensity = 0.28; vmHemi.intensity = 0.4;
  } catch (e) { envTex = null; hemi.intensity = 0.9; vmHemi.intensity = 1.0; }
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  vmCamera.aspect = camera.aspect; vmCamera.updateProjectionMatrix();
  try { if (typeof DR !== 'undefined') applyRes(); } catch (e) {}
});

/* ------------------------------------------------------------------ video settings */
const FX = { mult: 1, grass: 1 };
let grassMesh = null, grassMax = 0;
// render scale over 100% draws more pixels than the screen has (supersampling); capped by what the GPU can hold
function maxPR() { const w = Math.max(innerWidth, innerHeight, 1); return Math.max(0.5, Math.min(4, (HW.maxRB || 4096) / w)); }
let anisNow = -1;
function applyAnisotropy() {
  const a = Math.max(1, Math.min(S.anis | 0, MAXANIS)); if (a === anisNow) return; anisNow = a;
  const seen = new Set(), fix = t => { if (t && t.isTexture && !seen.has(t)) { seen.add(t); if (t.anisotropy !== a) { t.anisotropy = a; t.needsUpdate = true; } } };
  for (const sc of [scene, vmScene]) sc.traverse(o => { if (!o.material) return; for (const m of Array.isArray(o.material) ? o.material : [o.material]) for (const k of ['map', 'normalMap', 'bumpMap', 'roughnessMap', 'metalnessMap', 'aoMap']) fix(m[k]); });
}
function applyRes() {
  const dpr = window.devicePixelRatio || 1, sc = clamp(S.renderScale, 40, 200) / 100;
  const pr = sc > 1 ? dpr * sc : Math.min(dpr, qPreset().prCap || 2) * sc;
  DR.basePR = Math.min(pr, maxPR()); applyPR();
  renderer.setSize(innerWidth, innerHeight);
}
function applyVideoSettings() {
  const q = qPreset();
  SHEEN_U.value = clamp(S.sheen, 0, 150) / 100; setGunShader(S.gunShader);
  applyRes();
  const sq = SHADOWQ[S.shadows] ? S.shadows : 'high', res = shadowRes(sq);
  sun.castShadow = sq !== 'off';
  if (res && sun.shadow.mapSize.x !== res) { sun.shadow.mapSize.set(res, res); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  renderer.toneMappingExposure = ENV_EXPOSURE * S.brightness / 100;
  FX.mult = FXQ[S.fxQ] || 1; FX.grass = clamp(S.grass, 0, 100) / 100;
  if (grassMesh) grassMesh.count = Math.floor(grassMax * FX.grass);
  try { applyAnisotropy(); } catch (e) {}
  $('grain').style.display = S.grain ? 'block' : 'none';
  $('fps').style.display = S.showFps ? 'block' : 'none';
  $('radar').style.display = S.radar ? 'block' : 'none';
  const ch = $('cross');
  ch.className = S.crosshair === 'dot' ? 'dot' : S.crosshair === 'none' ? 'none' : '';
  const col = { white: '#ffffff', green: '#7dff7d', yellow: '#ffe45c', red: '#ff5252', cyan: '#5cf2ff' }[S.crosshairColor] || '#fff';
  ch.style.setProperty('--ch', col);
  baseFov = S.fov;
}
let baseFov = S.fov;

// animated film grain (tiny canvas, scaled up by CSS)
const grainCtx = $('grain').getContext('2d'); let grainT = 0;
function updateGrain(dt) {
  if (!S.grain) return;
  grainT -= dt; if (grainT > 0) return; grainT = 0.07;
  const w = 160, h = 90, img = grainCtx.createImageData(w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  grainCtx.putImageData(img, 0, 0);
}
