/* ================================================================== GRAPHICS: characters and guns (1.2.113, the owner's graphics list E = 41-50)
   41 SOLDIER SHADING: the soldier atlas is one texture, so the shader tells skin (warm, softer, a little glow from
      within), cloth (a soft sheen and a weave) and gear (dark, glossier, a bit metallic) apart by colour.
   16 (from B) RIM LIGHT: characters get a cool rim from the sky so they read against dark backgrounds.
   42 IDLE: standing soldiers shift their weight and sway a little (breathing was already there).
   43 CLOTH: a scarf tail on soldiers' backs swings with how fast they move (HIGH and up).
   44 EYES that blink, and heads that turn toward what the soldier is aiming at.
   45 and 48 are in gfxpost.js / gfxmat.js; 47 (hands on the magazine while reloading) was already in the game.
   46 SCOPE GLASS: a red-dot or holo sight's lens shows a real, slightly zoomed picture while you aim (ULTRA and up).
   49 ZOMBIES and BURNOUTS: rotting, wet-looking skin with dark veins; zombies get glowing eyes.
   50 FOOTSTEPS kick up dust on dusty maps and splash in the rain (you and the bots near you). */
const GC = { done: new WeakSet(), eyeGeo: null, eyeMat: null, tailGeo: null, tailMat: null, pip: null, pipCam: null, lens0: null, steps: new WeakMap(), sky: { value: new THREE.Color(0x8aa0c0) } };
const gcHi = () => !S.perfMode && /^(high|ultra|ultraplus|custom)$/.test(qKey()) && S.fxQ !== 'low';
if (S.scopePip === undefined) S.scopePip = /^(ultra|ultraplus)$/.test(qKey());
(() => { try { const V = SCHEMA.VIDEO, at = V.findIndex(it => it.k === 'ao'); if (!V.some(it => it.k === 'scopePip')) V.splice(at, 0, { k: 'scopePip', t: 'toggle', name: 'LIVE SCOPE GLASS', hint: 'Red-dot and holo lenses show a zoomed picture while aiming (draws the world a second time, small)' }); VIDEO_KEYS.add('scopePip'); } catch (e) {} })();
const _gcPreset = applyPreset; applyPreset = function (k) { const r = _gcPreset.apply(this, arguments); S.scopePip = /^(ultra|ultraplus)$/.test(k); return r; };
/* ---------- 41 + 16: the character shader */
function gcPatch(mat, kind) {
  if (!mat || !mat.isMeshStandardMaterial || GC.done.has(mat) || mat.transparent) return; GC.done.add(mat); const prev = mat.onBeforeCompile, pk = mat.customProgramCacheKey;
  mat.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.uniforms.gcSky = GC.sky;
    const noise = 'float gcH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float gcN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(gcH(i), gcH(i + vec2(1.0, 0.0)), f.x), mix(gcH(i + vec2(0.0, 1.0)), gcH(i + vec2(1.0, 1.0)), f.x), f.y); }\n';
    let a = '', b = '';
    if (kind === 'soldier') {
      a = '{ vec3 c = diffuseColor.rgb; float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), sat = (mx - mn) / max(mx, 1e-3);\n' +
        '  float skin = step(c.g, c.r) * step(c.b, c.g) * smoothstep(0.18, 0.3, sat) * (1.0 - smoothstep(0.62, 0.78, sat)) * smoothstep(0.22, 0.38, mx) * step(c.r - c.b, 0.6);\n' +
        '  float gear = (1.0 - skin) * (1.0 - smoothstep(0.08, 0.2, mx)) ; float cloth = (1.0 - skin) * (1.0 - gear);\n' +
        '  roughnessFactor = mix(roughnessFactor, 0.55, skin); roughnessFactor = mix(roughnessFactor, 0.42, gear); metalnessFactor = mix(metalnessFactor, 0.35, gear);\n' +
        '#ifdef USE_UV\n  diffuseColor.rgb *= 1.0 - cloth * 0.07 * gcN(vUv * 900.0);\n#endif\n  gcSkin = skin; gcCloth = cloth; }';
      b = '{ float ndv = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0); gl_FragColor.rgb += gcSky * pow(1.0 - ndv, 3.0) * 0.22 + vec3(0.9, 0.85, 0.8) * pow(1.0 - ndv, 2.0) * 0.05 * gcCloth + vec3(0.5, 0.12, 0.06) * 0.06 * gcSkin; }';
    } else {
      a = '{ vec3 wp = vec3(vUv * 40.0, 0.0); float rot = gcN(vUv * 37.0), vein = smoothstep(0.47, 0.5, gcN(vUv * 90.0)) * (1.0 - smoothstep(0.5, 0.53, gcN(vUv * 90.0)));\n' +
        '  diffuseColor.rgb *= mix(vec3(1.0), vec3(0.62, 0.55, 0.62), smoothstep(0.55, 0.85, rot)); diffuseColor.rgb *= 1.0 - vein * 0.45; roughnessFactor = mix(roughnessFactor, 0.32, smoothstep(0.6, 0.9, gcN(vUv * 23.0 + 5.0)) * 0.8); gcSkin = 0.0; gcCloth = 0.0; }';
      b = '{ float ndv = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0); gl_FragColor.rgb += gcSky * pow(1.0 - ndv, 3.0) * 0.15; }';
    }
    sh.fragmentShader = 'uniform vec3 gcSky; float gcSkin = 0.0; float gcCloth = 0.0;\n' + noise + sh.fragmentShader.replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n' + a).replace('#include <tonemapping_fragment>', b + '\n#include <tonemapping_fragment>');
  };
  mat.customProgramCacheKey = () => (pk ? pk.call(mat) : '') + '|gc' + kind; mat.needsUpdate = true;
}
/* ---------- 42-44: the soldiers' animation extras */
const _gcAnim = animEnemy;
animEnemy = function (e, dt, sp) {
  const r = _gcAnim.apply(this, arguments); const g = e.rig; if (!g || !g.hips) return r;
  try {
    if (sp < 0.3 && !(e.crouchK > 0.3)) { const t = NOW * 0.55 + (e.phase0 || 0); g.hips.rotation.z = Math.sin(t) * 0.025; g.torso.rotation.z = -Math.sin(t) * 0.02; g.head.rotation.z = Math.sin(t * 0.7) * 0.03; } else { g.hips.rotation.z *= 0.9; g.torso.rotation.z *= 0.9; }
    if (!gcHi() || e.zombie || e.hhMob || e.dog) return r;
    if (!e.gcEyes && g.head) { if (!GC.eyeGeo) { const a = new THREE.SphereGeometry(0.017, 6, 4), b2 = a.clone(); a.translate(-0.05, 0, 0); b2.translate(0.05, 0, 0); GC.eyeGeo = gmMerge ? gmMerge([a, b2]) : a; GC.eyeMat = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.2 }); }
      const m = new THREE.Mesh(GC.eyeGeo, GC.eyeMat); m.position.set(0, 0.12, 0.112); g.head.add(m); e.gcEyes = m; e.gcBlink = rnd(1, 4); }
    if (e.gcEyes) { e.gcBlink -= dt; e.gcEyes.scale.y = e.gcBlink < 0.12 && e.gcBlink > 0 ? 0.15 : 1; if (e.gcBlink <= 0) e.gcBlink = rnd(2, 5); }
    if (e.tg && e.tg !== 'P' && e.tg.group) { /* bots aiming at a bot */ }
    const tgt = e.lkp || (e.target && e.target.group ? e.target.group.position : null) || (e.los && typeof P !== 'undefined' ? P : null);
    if (tgt && e.group) { const dx = tgt.x - e.group.position.x, dz = tgt.z - e.group.position.z, want = Math.atan2(dx, dz) - e.group.rotation.y; let d = want; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; g.head.rotation.y = clamp(d, -0.7, 0.7) * 0.6 + g.head.rotation.y * 0.4; }
    if (!e.gcTail && g.torso) { if (!GC.tailGeo) { GC.tailGeo = new THREE.PlaneGeometry(0.12, 0.42); GC.tailGeo.translate(0, -0.21, 0); GC.tailMat = new THREE.MeshStandardMaterial({ color: 0x3a3a30, roughness: 0.95, side: THREE.DoubleSide }); }
      const t = new THREE.Mesh(GC.tailGeo, GC.tailMat); t.position.set(0.06, 0.42, -0.14); g.torso.add(t); e.gcTail = t; }
    if (e.gcTail) { const swing = clamp(sp / 4, 0, 1); e.gcTail.rotation.x = -0.15 - swing * 0.9 + Math.sin(NOW * (3 + sp * 2) + (e.phase0 || 0)) * (0.08 + swing * 0.2); e.gcTail.rotation.z = Math.sin(NOW * 2.3 + (e.phase0 || 0)) * 0.1; }
  } catch (er) {}
  return r;
};
/* ---------- 49: zombies get glowing eyes */
function gcZombieEyes(e) {
  if (e.gcZE || !e.rig || !e.rig.head || e.dog || e.hhMob) return; e.gcZE = true; const m = new THREE.MeshBasicMaterial({ color: 0xffd23a, toneMapped: false });
  for (const s of [-1, 1]) { const q = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), m); q.position.set(s * 0.05, 0.12, 0.112); e.rig.head.add(q); }
}
/* ---------- 50: footsteps kick up dust or splash */
function gcSteps() {
  const rain = typeof AMB !== 'undefined' && AMB.kind === 'rain', dusty = /dust|desert|sand|stashisle|ruins|homestead|funfair/.test(String(curMap)); if ((!rain && !dusty) || S.fxQ === 'low' || S.perfMode) return;
  const step = (key, x, y, z) => { const L = GC.steps.get(key); if (L && Math.hypot(L.x - x, L.z - z) < 0.8) return; GC.steps.set(key, { x, z }); if (!L) return;
    if (rain) puff(x, y + 0.05, z, { color: 0xc8d4e0, size: 0.12, grow: 0.5, life: 0.35, vy: 1.2, op: 0.45, minor: 1 }); else puff(x, y + 0.08, z, { color: 0x9a8a6a, size: 0.2, grow: 0.8, life: 0.8, vy: 0.25, op: 0.28, minor: 1 }); };
  try { if (G.state === 'playing' && P.onGround) step(P, P.x, groundAt(P.x, P.z, (P.y || 0) + 0.3), P.z); for (const e of enemies) if (e.group && (e.entry || e.zombie || e.hhMob) && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 18) step(e, e.group.position.x, e.group.position.y, e.group.position.z); } catch (e) {}
}
/* ---------- 46: live scope glass */
function gcPip() {
  const u = gunObjs && gunObjs[G.cur], ads = (G.ads || 0) > 0.35 && !G.scoped && G.state === 'playing' && S.scopePip && !S.perfMode;
  let lens = null; if (ads && u) u.traverse(o => { if (!lens && o.isMesh && o.material === VM.lens && o.visible) lens = o; });
  if (!lens) { if (GC.lensOn) { Object.assign(VM.lens, GC.lens0); VM.lens.needsUpdate = true; GC.lensOn = false; } return; }
  if (!GC.pip) { GC.pip = new THREE.WebGLRenderTarget(256, 256, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); GC.pip.texture.encoding = THREE.sRGBEncoding; GC.pipCam = new THREE.PerspectiveCamera(20, 1, 0.1, 400); }
  if (!GC.lensOn) { GC.lens0 = { map: VM.lens.map, emissiveMap: VM.lens.emissiveMap, opacity: VM.lens.opacity, transparent: VM.lens.transparent }; GC.lens0.emissive = VM.lens.emissive.clone(); GC.lens0.color = VM.lens.color.clone(); VM.lens.emissiveMap = GC.pip.texture; VM.lens.emissive = new THREE.Color(0xffffff); VM.lens.color = new THREE.Color(0x000000); VM.lens.opacity = 0.95; VM.lens.needsUpdate = true; GC.lensOn = true; }
  const c = GC.pipCam; c.position.copy(camera.position); c.quaternion.copy(camera.quaternion); c.fov = Math.max(6, camera.fov / 1.6); c.updateProjectionMatrix();
  const prev = renderer.getRenderTarget(), au = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false; renderer.setRenderTarget(GC.pip); renderer.clear(); renderer.render(scene, c); renderer.setRenderTarget(prev); renderer.shadowMap.autoUpdate = au;
}
const _gcFrame = renderFrame;
renderFrame = function () { try { gcPip(); } catch (e) { S.scopePip = false; } return _gcFrame.apply(this, arguments); };
/* ---------- hooks */
const _gcTick = tick;
tick = function (dt) {
  const r = _gcTick.apply(this, arguments); if (G.noRender) return r;
  try { if ((GC.scanT = (GC.scanT || 0) - dt) <= 0) { GC.scanT = 1;
      for (const k in SOLD.mats) gcPatch(SOLD.mats[k], 'soldier');
      for (const e of enemies) { if (!e.group || e.gcP) continue; e.gcP = true; const z = e.zombie || e.hhMob; e.group.traverse(o => { if (o.isMesh && o.material && !o.userData.hitbox) gcPatch(o.material, z && !e.dog ? 'zombie' : 'soldier'); }); if (e.zombie) gcZombieEyes(e); } }
    try { GC.sky.value.copy(hemi.color).multiplyScalar(0.8); } catch (e) {}
    gcSteps(); } catch (e) {}
  return r;
};
