/* ================================================================== GRAPHICS: atmosphere and weather (1.2.113, the owner's graphics list C = 21-30)
   21 + 27 (height fog, haze) are in gfxpost.js; 23 (snow that settles) is in gfxmat.js's patch.
   22 RAIN: splash rings on open ground round you (one instanced draw) and drops that run down the lens when you're outside.
   24 SMOKE: smoke grenades get more, denser puffs, lit from above and darker underneath, turning slowly.
   25 DUST MOTES drift in the air indoors (and in the light from windows).
   26 WIND on cloth: banners, bunting, awnings, tents and sheets ripple (vertex shader, no CPU cost).
   28 PAPER and litter blown across open ground (the wind on maps without rain or snow).
   29 HEAT SHIMMER over fires, burning molotovs and fresh explosions (screen distortion in the post pass).
   30 LIGHTNING in the rain: the sky and the scene flash, thunder follows a moment later. */
const GA = { splash: null, sp: [], drops: [], dust: null, paper: null, pap: [], shim: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()], flash: 0, boltT: 25, booms: [], cloth: new WeakSet() };
const gaOn = () => !S.perfMode && S.fxQ !== 'low';
const gaRain = () => typeof AMB !== 'undefined' && AMB.kind === 'rain' && inMatch();
/* ---------- 22: splashes */
function gaSplashInit() {
  if (GA.splash) return; const tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.strokeStyle = 'rgba(220,235,255,0.9)'; x.lineWidth = 3; x.beginPath(); x.arc(32, 32, 24, 0, 7); x.stroke(); return new THREE.CanvasTexture(c); })();
  const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2); const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.55 });
  GA.splash = new THREE.InstancedMesh(g, m, 60); GA.splash.frustumCulled = false; GA.splash.count = 0; for (let i = 0; i < 60; i++) GA.sp.push({ x: 0, y: -999, z: 0, t: 1 });
}
const _gaM = new THREE.Matrix4(), _gaQ = new THREE.Quaternion(), _gaS = new THREE.Vector3(), _gaP = new THREE.Vector3();
function gaSplashTick(dt) {
  const on = gaRain() && gaOn(); if (!on) { if (GA.splash && GA.splash.parent) scene.remove(GA.splash); return; } gaSplashInit(); if (!GA.splash.parent) scene.add(GA.splash);
  for (const s of GA.sp) { s.t += dt; if (s.t >= 0.32) { const a = Math.random() * TAU, d = 1.5 + Math.random() * 11, x = camera.position.x + Math.cos(a) * d, z = camera.position.z + Math.sin(a) * d; let y = -999; try { const top = groundAt(x, z, camera.position.y + 30), fl = groundAt(x, z, camera.position.y + 0.5); if (Math.abs(top - fl) < 0.2) y = fl + 0.02; } catch (e) {} s.x = x; s.y = y; s.z = z; s.t = Math.random() * 0.1; } }
  let n = 0; for (const s of GA.sp) { if (s.y < -900) continue; const k = s.t / 0.32, sc = 0.05 + k * 0.32; _gaP.set(s.x, s.y, s.z); _gaS.set(sc, 1, sc); _gaM.compose(_gaP, _gaQ, _gaS); GA.splash.setMatrixAt(n++, _gaM); }
  GA.splash.count = n; GA.splash.instanceMatrix.needsUpdate = true; GA.splash.material.opacity = 0.5;
}
// drops on the lens: a light canvas over the picture
function gaDropsTick(dt) {
  let cv = $('gaDrops'); const out = gaRain() && gaOn() && G.state === 'playing' && (typeof GL === 'undefined' || GL.indoor < 0.4);
  if (!out) { if (cv) cv.style.opacity = '0'; GA.drops.length = 0; return; }
  if (!cv) { cv = document.createElement('canvas'); cv.id = 'gaDrops'; cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;transition:opacity .6s'; document.body.appendChild(cv); }
  cv.style.opacity = '1'; const W = Math.round(innerWidth / 2), H = Math.round(innerHeight / 2); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } const x = cv.getContext('2d'); x.clearRect(0, 0, W, H);
  const up = clamp(P.pitch * 2 + 0.3, 0, 1); if (GA.drops.length < 14 && Math.random() < dt * (2 + up * 10)) GA.drops.push({ x: Math.random() * W, y: Math.random() * H * 0.7, r: 2 + Math.random() * 5, v: 0, life: 0 });
  for (let i = GA.drops.length - 1; i >= 0; i--) { const d = GA.drops[i]; d.life += dt; if (d.life > 0.8) d.v += dt * 30 * (d.r / 4); d.y += d.v * dt * 20; if (d.y > H + 10 || d.life > 6) { GA.drops.splice(i, 1); continue; }
    const g = x.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, 0, d.x, d.y, d.r); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.7, 'rgba(200,215,230,0.12)'); g.addColorStop(1, 'rgba(60,70,80,0.25)'); x.fillStyle = g; x.beginPath(); x.ellipse(d.x, d.y, d.r, d.r * (1 + d.v * 0.02), 0, 0, 7); x.fill();
    if (d.v > 0) { x.strokeStyle = 'rgba(220,230,240,0.12)'; x.lineWidth = d.r * 0.6; x.beginPath(); x.moveTo(d.x, d.y - d.r); x.lineTo(d.x, d.y - d.r - d.v * 1.5); x.stroke(); } }
}
/* ---------- 24: smoke */
const _gaSmk = smkCloud;
smkCloud = function (p, kind) {
  const r = _gaSmk.apply(this, arguments); try { const c = SMK.clouds[SMK.clouds.length - 1]; if (!c || c.gaDone) return r; c.gaDone = true; const sunC = skyMat.uniforms.sunCol.value;
    if (gaOn()) for (let i = 0; i < (kind === 'hotbox' ? 8 : 5); i++) { const a = Math.random() * TAU, rr = Math.sqrt(Math.random()) * c.R * 0.6, sz = kind === 'hotbox' ? rnd(2.4, 3.4) : rnd(1.6, 2.2), base = c.sprites[0].s.material.color.getHex();
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smkTex(), color: base, transparent: true, depthWrite: false, opacity: 0 })); s.scale.set(sz, sz, 1); s.position.set(c.x + Math.cos(a) * rr, c.y + rnd(0.3, kind === 'hotbox' ? 3.2 : 2), c.z + Math.sin(a) * rr); scene.add(s); c.sprites.push({ s, vx: rnd(-0.1, 0.1), vz: rnd(-0.1, 0.1), sz }); }
    for (const q of c.sprites) { const h = clamp((q.s.position.y - c.y) / 3, 0, 1); q.s.material.color.multiplyScalar(0.72 + 0.38 * h).lerp(new THREE.Color(sunC), 0.08 * h); q.s.material.rotation = Math.random() * TAU; q.rs = rnd(-0.12, 0.12); } } catch (e) {}
  return r;
};
const _gaSmkT = smkTick;
smkTick = function (dt) { for (const c of SMK.clouds) for (const q of c.sprites) if (q.rs) q.s.material.rotation += q.rs * dt; return _gaSmkT.apply(this, arguments); };
/* ---------- 25: dust motes indoors */
function gaDustTick(dt) {
  const want = gaOn() && typeof GL !== 'undefined' && GL.indoor > 0.3 && G.state === 'playing';
  if (!want) { if (GA.dust) GA.dust.material.opacity = Math.max(0, GA.dust.material.opacity - dt); if (GA.dust && GA.dust.material.opacity <= 0 && GA.dust.parent) scene.remove(GA.dust); return; }
  if (!GA.dust) { const n = 220, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = rnd(-5, 5); pos[i * 3 + 1] = rnd(-1.5, 2.5); pos[i * 3 + 2] = rnd(-5, 5); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    GA.dust = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff2d8, size: 0.022, transparent: true, opacity: 0, depthWrite: false })); GA.dust.frustumCulled = false; }
  if (!GA.dust.parent) scene.add(GA.dust); GA.dust.material.opacity = Math.min(0.55, GA.dust.material.opacity + dt * 0.5) * GL.indoor; GA.dust.position.set(Math.round(camera.position.x / 10) * 10, camera.position.y, Math.round(camera.position.z / 10) * 10);
  const a = GA.dust.geometry.attributes.position; for (let i = 0; i < a.count; i++) { a.setY(i, a.getY(i) + Math.sin(NOW * 0.3 + i) * dt * 0.05); a.setX(i, a.getX(i) + Math.cos(NOW * 0.2 + i * 1.7) * dt * 0.04); } a.needsUpdate = true;
}
/* ---------- 26: cloth in the wind */
const GA_CLOTH = /festBanner|awning|cloth|sheet|tent|Banner|bayBoard|flag|Flag|curtain|velvet/;
function gaCloth() {
  for (const k in MAT) { const m = MAT[k]; if (!m || !m.isMaterial || !GA_CLOTH.test(k) || GA.cloth.has(m)) continue; GA.cloth.add(m); const prev = m.onBeforeCompile, pk = m.customProgramCacheKey, amp = /awning|tent/.test(k) ? 0.015 : 0.05;
    m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.uniforms.uWind = WIND_U; sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n{ float ph = position.x * 1.7 + position.z * 1.3 + position.y * 2.1; transformed.x += sin(uWind * 3.1 + ph) * ${amp}; transformed.z += cos(uWind * 2.6 + ph * 1.2) * ${amp}; transformed.y += sin(uWind * 4.0 + ph * 0.7) * ${(amp * 0.4).toFixed(3)}; }`); };
    m.customProgramCacheKey = () => (pk ? pk.call(m) : '') + '|cloth'; m.needsUpdate = true; }
}
/* ---------- 28: paper blowing across open ground */
function gaPaperTick(dt) {
  const want = gaOn() && typeof AMB !== 'undefined' && AMB.kind !== 'rain' && AMB.kind !== 'snow' && inMatch() && !(MAPS[curMap] || {}).indoor && G.state === 'playing';
  if (!want) { for (const q of GA.pap) if (q.m.parent) scene.remove(q.m); return; }
  if (!GA.pap.length) { const mats = [0xe8e2d0, 0xd8d0b8, 0xc8b898].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, side: THREE.DoubleSide })); for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), mats[i % 3]); m.castShadow = false; GA.pap.push({ m, x: 0, y: -99, z: 0, t: 9, vy: 0 }); } }
  const wx = 1.6, wz = 0.7;
  for (const q of GA.pap) { if (!q.m.parent) scene.add(q.m); q.t += dt;
    if (q.t > 8 || Math.hypot(q.x - camera.position.x, q.z - camera.position.z) > 28) { const a = Math.random() * TAU, d = 8 + Math.random() * 14; q.x = camera.position.x + Math.cos(a) * d - wx * 4; q.z = camera.position.z + Math.sin(a) * d - wz * 4; try { q.y = groundAt(q.x, q.z, camera.position.y + 1) + 0.02; } catch (e) { q.y = 0; } q.t = 0; q.vy = 0; }
    const gust = 0.5 + 0.5 * Math.sin(NOW * 0.9 + q.x), fl = (() => { try { return groundAt(q.x, q.z, q.y + 0.5); } catch (e) { return 0; } })();
    q.x += wx * gust * dt * (q.y > fl + 0.05 ? 1.4 : 0.8); q.z += wz * gust * dt; q.vy += (gust > 0.8 ? 2.5 : -4) * dt; q.y = Math.max(fl + 0.02, q.y + q.vy * dt); if (q.y <= fl + 0.02) q.vy = 0;
    q.m.position.set(q.x, q.y, q.z); q.m.rotation.set(q.y > fl + 0.05 ? NOW * 3 + q.x : -Math.PI / 2, NOW * 0.5 + q.z, q.y > fl + 0.05 ? NOW * 2 : 0); }
}
/* ---------- 29: heat shimmer */
const _gaBoom = explode;
explode = function (p) { const r = _gaBoom.apply(this, arguments); try { GA.booms.push({ x: p.x, y: (p.y || 0) + 0.8, z: p.z, t: 0 }); if (GA.booms.length > 4) GA.booms.shift(); } catch (e) {} return r; };
const _gaV = new THREE.Vector3();
function gaShimTick(dt) {
  const src = []; for (const b of GA.booms) { b.t += dt; if (b.t < 2.2) src.push({ x: b.x, y: b.y, z: b.z, k: 1 - b.t / 2.2, r: 4 }); } GA.booms = GA.booms.filter(b => b.t < 2.2);
  try { if (typeof BRFG !== 'undefined') for (const f of BRFG.fires || []) src.push({ x: f.x, y: (f.y || 0) + 1, z: f.z, k: 0.8, r: f.R || 3 }); } catch (e) {}
  try { if (typeof GL !== 'undefined') for (const s of GL.spots) if (s.fire) src.push({ x: s.x, y: s.y + 0.8, z: s.z, k: 0.6, r: 2 }); } catch (e) {}
  const cam = camera.position, near = src.map(s => [s, Math.hypot(s.x - cam.x, s.z - cam.z)]).filter(q => q[1] < 35).sort((a, b) => a[1] - b[1]).slice(0, 4);
  for (let i = 0; i < 4; i++) { const v = GA.shim[i], q = near[i]; if (!q || !gaOn()) { v.w = 0; continue; } const s = q[0]; _gaV.set(s.x, s.y, s.z).project(camera); if (_gaV.z > 1 || Math.abs(_gaV.x) > 1.3 || Math.abs(_gaV.y) > 1.3) { v.w = 0; continue; } v.set(_gaV.x * 0.5 + 0.5, _gaV.y * 0.5 + 0.5, clamp(s.r / Math.max(q[1], 1) * 0.6, 0.04, 0.35), s.k); }
}
/* ---------- 30: lightning */
function gaBoltTick(dt) {
  GA.flash = Math.max(0, GA.flash - dt * 4); if (!gaRain() || !gaOn() || G.state !== 'playing') return;
  if ((GA.boltT -= dt) <= 0) { GA.boltT = 18 + Math.random() * 25; GA.flash = 0.9; setTimeout(() => { GA.flash = 0.6; }, 120); setTimeout(() => { GA.flash = 0.35; }, 260);
    const d = 0.8 + Math.random() * 2.2; setTimeout(() => { try { burst(2.4, 160, 0.5, 'lowpass'); setTimeout(() => burst(1.6, 90, 0.35, 'lowpass'), 300); } catch (e) {} }, d * 1000); }
}
/* ---------- hooks */
const _gaPick = ambPick;
ambPick = function () { return GA.forceWx != null ? GA.forceWx : _gaPick.apply(this, arguments); };
const _gaLoad = loadMap;
loadMap = function () { const r = _gaLoad.apply(this, arguments); if (r !== false) try { gaCloth(); } catch (e) {} return r; };
const _gaTick = tick;
tick = function (dt) { const r = _gaTick.apply(this, arguments); if (!G.noRender) try { gaSplashTick(dt); gaDropsTick(dt); gaDustTick(dt); gaPaperTick(dt); gaShimTick(dt); gaBoltTick(dt); } catch (e) {} return r; };
