/* ================================================================== custom PBR (Cook-Torrance GGX) gun shader + Fresnel sheen for standard materials */
// Shared uniforms (one object per value so every gun material updates at once).
const VMU = {
  uLightPos: { value: new THREE.Vector3(-4, 8, 4.8) },
  uLightColor: { value: new THREE.Vector3(5, 4.6, 3.9) },
  uFlashPos: { value: new THREE.Vector3(0.1, -0.05, -0.7) },
  uFlash: { value: 0 },
  uSky: { value: new THREE.Vector3(0.4, 0.5, 0.6) },
  uGround: { value: new THREE.Vector3(0.1, 0.09, 0.07) },
  uExposure: { value: 1 },
};
const SHEEN_U = { value: 1 };

// Written to run under both GLSL ES 1.00 and the 3.00 conversion three.js applies (varying / gl_FragColor).
const PBR_VERT = `
varying vec3 vNormal;
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const PBR_FRAG = `
varying vec3 vNormal;
varying vec3 vWorldPos;
uniform vec3  uBaseColor;
uniform float uMetallic;
uniform float uRoughness;
uniform vec3  uLightPos;
uniform vec3  uLightColor;
uniform vec3  uFlashPos;
uniform float uFlash;
uniform vec3  uSky;
uniform vec3  uGround;
uniform float uExposure;

const float PI = 3.14159265359;

// 1. Normal Distribution Function (Trowbridge-Reitz GGX): how many microfacets point at the half vector.
float DistributionGGX(vec3 N, vec3 H, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = max(dot(N, H), 0.0);
  float denom = (NdotH * NdotH * (a2 - 1.0) + 1.0);
  return a2 / (PI * denom * denom);
}
// 2. Geometry (Schlick-GGX): microfacet self-shadowing.
float GeometrySchlickGGX(float NdotV, float roughness) {
  float r = (roughness + 1.0);
  float k = (r * r) / 8.0;
  return NdotV / (NdotV * (1.0 - k) + k);
}
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  return GeometrySchlickGGX(max(dot(N, V), 0.0), roughness) * GeometrySchlickGGX(max(dot(N, L), 0.0), roughness);
}
// 3. Fresnel (Schlick): more reflection at grazing angles.
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// One analytic light's contribution (diffuse + specular)
vec3 shade(vec3 N, vec3 V, vec3 L, vec3 radiance, vec3 F0) {
  vec3 H = normalize(V + L);
  float D = DistributionGGX(N, H, uRoughness);
  float G = GeometrySmith(N, V, L, uRoughness);
  vec3  F = fresnelSchlick(max(dot(H, V), 0.0), F0);
  float NdotL = max(dot(N, L), 0.0);
  vec3 specular = (D * G * F) / (4.0 * max(dot(N, V), 0.0) * NdotL + 0.0001);
  vec3 kD = (vec3(1.0) - F) * (1.0 - uMetallic);
  return (kD * uBaseColor / PI + specular) * radiance * NdotL;
}

void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 F0 = mix(vec3(0.04), uBaseColor, uMetallic);

  // key light (sun)
  vec3 color = shade(N, V, normalize(uLightPos - vWorldPos), uLightColor, F0);

  // muzzle flash as a point light with falloff
  vec3 fd = uFlashPos - vWorldPos;
  float att = uFlash / (1.0 + dot(fd, fd) * 6.0);
  color += shade(N, V, normalize(fd), vec3(1.0, 0.7, 0.35) * att * PI, F0);

  // sky / ground ambient (diffuse) plus a cheap sky reflection (specular)
  float cosNV = max(dot(N, V), 0.0);
  vec3 Fa = F0 + (max(vec3(1.0 - uRoughness), F0) - F0) * pow(1.0 - cosNV, 5.0);
  vec3 hemi = mix(uGround, uSky, N.y * 0.5 + 0.5);
  color += (vec3(1.0) - Fa) * (1.0 - uMetallic) * uBaseColor * hemi;
  vec3 R = reflect(-V, N);
  float soft = 0.25 + uRoughness * 0.9;
  vec3 env = mix(uGround, uSky * 1.4, smoothstep(-soft, soft, R.y));
  color += env * Fa * (1.0 - uRoughness * 0.6);

  // ACES filmic (matches the renderer's tone mapping + brightness setting), then gamma
  color *= uExposure / 0.6;
  color = clamp((color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14), 0.0, 1.0);
  color = pow(color, vec3(1.0 / 2.2));
  gl_FragColor = vec4(color, 1.0);
}`;

function pbrMat(hex, metallic, roughness) {
  return new THREE.ShaderMaterial({
    vertexShader: PBR_VERT, fragmentShader: PBR_FRAG,
    uniforms: Object.assign({ uBaseColor: { value: C(hex) }, uMetallic: { value: metallic }, uRoughness: { value: roughness } }, VMU),
  });
}

// Per-frame feed for the gun shader (called before the viewmodel pass).
function updateGunShader() {
  VMU.uFlash.value = vmFlashLight.intensity;
  VMU.uFlashPos.value.copy(vmFlashLight.position);
  VMU.uExposure.value = renderer.toneMappingExposure;
}
function initGunShaderLights() {
  // Mirrors the viewmodel's sun + hemisphere lights; falls back to the defaults above if a value is missing.
  try {
    const k = vmSun.intensity * Math.PI, c = vmSun.color;
    VMU.uLightPos.value.copy(vmSun.position).multiplyScalar(4);
    VMU.uLightColor.value.set(c.r * k, c.g * k, c.b * k);
    const s = vmHemi.color, g = vmHemi.groundColor, i = vmHemi.intensity;
    VMU.uSky.value.set(s.r * i, s.g * i, s.b * i);
    VMU.uGround.value.set(g.r * i, g.g * i, g.b * i);
  } catch (e) { /* keep defaults */ }
}

// Swap the gun metal between the custom shader and the standard material (Settings → Video).
function setGunShader(on) {
  if (!VM.metalStd) return;
  const pairs = [[VM.metal, VM.metalStd], [VM.steel, VM.steelStd]];
  for (const g of gunObjs) g.traverse(o => {
    if (!o.isMesh) return;
    for (const [a, b] of pairs) { if (o.material === a || o.material === b) { o.material = on ? a : b; break; } }
  });
}

// Grazing-angle Fresnel sheen added to MeshStandardMaterial (keeps shadows, fog, textures and the sky reflections).
// Patches only a stable anchor (#include <tonemapping_fragment>) and uses only `normal` / `vViewPosition`, so if the
// anchor is ever absent the material simply renders as before.
function addFresnel(mat) {
  if (!mat || !mat.isMeshStandardMaterial || mat.transparent || mat.alphaTest > 0 || mat.userData.fresnel) return;
  const rough = mat.roughness, metal = mat.metalness;
  const s = (1 - rough) * 0.35 * (0.4 + metal);
  if (s < 0.02) return;
  mat.userData.fresnel = true;
  const strength = s.toFixed(3);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSheen = SHEEN_U;
    shader.fragmentShader = 'uniform float uSheen;\n' + shader.fragmentShader.replace('#include <tonemapping_fragment>',
      `{ float fcos = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
         float fr = pow(1.0 - fcos, 4.0);
         gl_FragColor.rgb += vec3(0.55, 0.66, 0.82) * fr * ${strength} * uSheen; }
       #include <tonemapping_fragment>`);
  };
  mat.customProgramCacheKey = () => 'fresnel' + strength;
}
function addFresnelAll(obj) {
  if (!obj) return;
  if (obj.isMaterial) addFresnel(obj);
  else if (Array.isArray(obj) || Object.getPrototypeOf(obj) === Object.prototype) for (const k in obj) addFresnelAll(obj[k]);
}
