/* ================================================================== performance helpers */
// dynamic resolution: drop the render scale when the frame rate sags, creep back up when there is headroom.
// If lowering the resolution does not actually speed things up (frame-capped display, battery saver), it backs off.
const DR = { scale: 1, prev: 1, ema: 1 / 60, slowT: 0, fastT: 0, basePR: 1, checkT: -1, emaBefore: 0, locked: false };
function applyPR() { renderer.setPixelRatio(Math.max(0.4, DR.basePR * (S.dynRes ? DR.scale : 1))); }
function setDynScale(s) { DR.prev = DR.scale; DR.scale = s; DR.emaBefore = DR.ema; DR.checkT = 2.5; applyPR(); }
function updateDynRes(raw) {
  if (!S.dynRes || G.state !== 'playing' || raw > 0.25 || raw <= 0) return;
  DR.ema = DR.ema * 0.95 + raw * 0.05;
  if (DR.checkT > 0) {           // judge the last change
    DR.checkT -= raw;
    if (DR.checkT <= 0 && DR.scale < DR.prev && DR.ema > DR.emaBefore * 0.93) { DR.scale = DR.prev; applyPR(); DR.locked = true; }
    return;
  }
  if (DR.locked) return;
  DR.slowT = DR.ema > 1 / 48 ? DR.slowT + raw : 0;
  DR.fastT = DR.ema < 1 / 57 ? DR.fastT + raw : 0;
  if (DR.slowT > 1.2 && DR.scale > 0.6) { DR.slowT = 0; setDynScale(Math.max(0.6, DR.scale * 0.88)); }
  else if (DR.fastT > 4 && DR.scale < 1) { DR.fastT = 0; DR.prev = DR.scale; DR.scale = Math.min(1, DR.scale * 1.06); applyPR(); }
}

// soldiers far away stop casting shadows (each one is ~12 shadow draw calls)
let shadowLodT = 0;
function updateShadowLod(dt) {
  if ((shadowLodT -= dt) > 0) return; shadowLodT = 0.2;
  const far = S.shadows === 'high' ? (qKey() === 'ultra' ? 50 : 38) : 28, cx = camera.position.x, cz = camera.position.z;
  const apply = (rig, x, z, holder) => {
    const want = S.shadows !== 'off' && Math.hypot(x - cx, z - cz) < far;
    if (holder._sh === want) return; holder._sh = want;
    rig.root.traverse(o => { if (o.isMesh && !o.userData.hitbox) o.castShadow = want; });
    if (rig.gun && rig.gun.parent !== rig.torso) rig.gun.traverse(o => { if (o.isMesh) o.castShadow = want; });
  };
  for (const e of enemies) apply(e.rig, e.group.position.x, e.group.position.z, e);
  for (const d of dying) apply(d.e.rig, d.e.group.position.x, d.e.group.position.z, d);
}

// the sun's shadow box follows the camera instead of covering the whole map: sharper shadows and fewer
// objects drawn into the shadow map. The centre snaps to whole shadow texels so edges don't shimmer.
let sunR = 0;
function updateSunFollow() {
  if (!sun.target || !sun.castShadow) return;
  const R = S.shadows === 'high' ? (QUALITY[qKey()] || QUALITY.high).shadowR : 30, cam = sun.shadow.camera;
  if (R !== sunR) { sunR = R; cam.left = -R; cam.right = R; cam.top = R; cam.bottom = -R; cam.updateProjectionMatrix && cam.updateProjectionMatrix(); }
  const texel = (2 * R) / (sun.shadow.mapSize.x || 2048);
  const cx = Math.round(camera.position.x / texel) * texel, cz = Math.round(camera.position.z / texel) * texel;
  sun.target.position.set(cx, 0, cz); sun.position.set(cx + SUN_POS.x, SUN_POS.y, cz + SUN_POS.z);
  sun.target.updateMatrixWorld();
}

/* ---------- wind: grass tufts and tree canopies sway (vertex shader, no CPU cost) */
const WIND_U = { value: 0 };
function addWind(mat, amp) {
  if (!mat) return; mat.userData = mat.userData || {}; if (mat.userData.wind) return; mat.userData.wind = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, r) => {
    if (prev) prev(shader, r);
    shader.uniforms.uWind = WIND_U; shader.uniforms.uWindAmp = { value: amp };
    shader.vertexShader = 'uniform float uWind;\nuniform float uWindAmp;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      {
      #ifdef USE_INSTANCING
        vec3 wpos = vec3(instanceMatrix[3][0], 0.0, instanceMatrix[3][2]);
        float wh = clamp(position.y / 0.7, 0.0, 1.0);
      #else
        vec3 wpos = position;
        float wh = clamp((position.y - 2.5) / 4.0, 0.0, 1.0);
      #endif
        float wv = sin(uWind * 1.6 + wpos.x * 0.35 + wpos.z * 0.22) + 0.5 * sin(uWind * 2.7 + wpos.z * 0.5 + wpos.x * 0.1);
        transformed.x += wv * 0.07 * wh * wh * uWindAmp;
        transformed.z += cos(uWind * 1.3 + wpos.x * 0.3) * 0.04 * wh * wh * uWindAmp;
      }`);
  };
  mat.customProgramCacheKey = () => 'wind' + amp;
  mat.needsUpdate = true;
}
