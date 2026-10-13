/* ================================================================== renderer, sky, lighting */
// Fog is applied after tone mapping, so it takes a plain sRGB colour; materials and lights want linear colours.
const C = hex => new THREE.Color(hex).convertSRGBToLinear();
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
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
if (NEED_AUTO_DERIVE && S.quality === 'auto') { const q = QUALITY[AUTO_TIER]; S.renderScale = q.scale; S.shadows = q.shadows; S.grain = q.grain; saveSettings(); }
const MAXANIS = renderer.capabilities && renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4;

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
});

/* ------------------------------------------------------------------ video settings */
const FX = { mult: 1, grass: 1 };
let grassMesh = null, grassMax = 0;
function applyVideoSettings() {
  const q = QUALITY[qKey()] || QUALITY.high;
  SHEEN_U.value = clamp(S.sheen, 0, 150) / 100; setGunShader(S.gunShader);
  const pr = Math.min(window.devicePixelRatio || 1, q.prCap) * clamp(S.renderScale, 40, 100) / 100;
  DR.basePR = pr; applyPR();
  renderer.setSize(innerWidth, innerHeight);
  const res = S.shadows === 'high' ? Math.max(2048, q.shadowRes) : 1024;
  sun.castShadow = S.shadows !== 'off';
  if (sun.shadow.mapSize.x !== res) { sun.shadow.mapSize.set(res, res); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  renderer.toneMappingExposure = ENV_EXPOSURE * S.brightness / 100;
  FX.mult = q.fx; FX.grass = q.grass;
  if (grassMesh) grassMesh.count = Math.floor(grassMax * q.grass);
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
