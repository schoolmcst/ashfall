/* ================================================================== GRAPHICS: effects (1.2.113, the owner's graphics list D = 31-40)
   Already in the game before this: impacts by metal / wood / dust, bouncing casings with a sound, explosions with a
   fireball, smoke, sparks and a scorch mark, fires with flickering light, a muzzle light. Added on top:
   31 MUZZLE SMOKE: a puff of smoke drifts off the muzzle every few shots (yours and nearby bots').
   32 MORE IMPACTS: glass sparkles, water splashes, snow puffs, brown dirt off the ground, leaves off foliage.
   33 CASINGS stay longer and roll a little after they land.
   34 EXPLOSIONS: a shockwave ring on the ground, a dust ring and heavier lingering smoke.
   35 FIRE: burning molotovs and fire grenades give off smoke columns and embers.
   36 DECALS (bullet holes, blood, scorch) shrink away after 25 s instead of staying until reused.
   37 FOOTPRINTS on snow and sand (you and the bots), fading after 30 s (one instanced draw).
   38 TRACERS glow (they skip tone mapping, so the bloom catches them) and leave a short fading trail.
   39 BLASTS shake the screen and blur its edges for a moment when they go off near you (SCREEN SHAKE setting).
   40 GLOWING EFFECTS (muzzle flashes, fire, beams, wonder weapons, streak effects): every additive-blended effect skips
      tone mapping so it reaches the bloom. */
const GX = { shots: 0, trails: [], prints: null, pr: [], prI: 0, rings: [], blast: 0, decT: new WeakMap(), lastStep: new WeakMap() };
if (S.shakeFx === undefined) S.shakeFx = true;
(() => { try { const V = SCHEMA.VIDEO, at = V.findIndex(it => it.k === 'fxQ') + 1; if (!V.some(it => it.k === 'shakeFx')) V.splice(at, 0, { k: 'shakeFx', t: 'toggle', name: 'SCREEN SHAKE', hint: 'Blasts near you shake the screen and blur its edges' }); } catch (e) {} })();
const gxOn = () => !S.perfMode && S.fxQ !== 'low';
/* ---------- 31 */
function gxMuzzleSmoke(x, y, z) { if (!gxOn()) return; puff(x, y, z, { color: 0x9a9a98, size: 0.18, grow: 0.9, life: 1.1, vy: 0.35, vx: rnd(-0.1, 0.1), vz: rnd(-0.1, 0.1), op: 0.3, minor: 1 }); }
const _gxShoot = shoot;
shoot = function () { const f0 = G.flashT, r = _gxShoot.apply(this, arguments); if (G.flashT > 0 && G.flashT !== f0 && ++GX.shots % 3 === 0) try { const d = new THREE.Vector3(); camera.getWorldDirection(d); gxMuzzleSmoke(camera.position.x + d.x * 1.0, camera.position.y + d.y - 0.12, camera.position.z + d.z * 1.0); } catch (e) {} return r; };
for (const nm of ['botShoot', 'enemyShoot']) { const f = nm === 'botShoot' ? botShoot : enemyShoot, w = function (e) { const r = f.apply(this, arguments); try { if (e && e.group && Math.random() < 0.3 && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 25) { const m = enemyMuzzle(e, new THREE.Vector3()); gxMuzzleSmoke(m.x, m.y, m.z); } } catch (er) {} return r; }; if (nm === 'botShoot') botShoot = w; else enemyShoot = w; }
/* ---------- 32 + 36 */
const _gxHit = hitEffects;
hitEffects = function (h, enemyHit) {
  const r = _gxHit.apply(this, arguments); if (enemyHit || !gxOn()) return r;
  try { const m = h.object && h.object.material, p = h.point; if (!m || !p) return r;
    if (m === MAT.glass || m === MAT.windowGlass || m === MAT.glassDark || m === MAT.stashGlass || m === MAT.shipGlass) { chunks('metal', p, 8, 3.2, 0.5); chunks('spark', p, 3, 2, 0.15); }
    else if (m === MAT.water || m === MAT.sea || m === MAT.bayWater || m === MAT.tideWater || m === MAT.shipSea) { for (let i = 0; i < 3; i++) puff(p.x, p.y + 0.05, p.z, { color: 0xd8e8f0, size: 0.18, grow: 0.7, life: 0.45, vy: 2.2 + i * 0.8, op: 0.55 }); }
    else if (m === MAT.snow || m === MAT.ice) puff(p.x, p.y, p.z, { color: 0xf4f8ff, size: 0.3, grow: 1.1, life: 0.8, vy: 0.6, op: 0.6 });
    else if (m === MAT.ground || m === MAT.soil || m === MAT.mud || m === MAT.deadGrass || m === MAT.graveMud) { chunks('dust', p, 5, 2.4, 0.5); puff(p.x, p.y, p.z, { color: 0x6a5a40, size: 0.3, grow: 1, life: 0.8, vy: 0.7, op: 0.5 }); }
    else if (m === MAT.leaf || m === MAT.leafGreen || m === MAT.purpleLeaf) chunks('leaf', p, 6, 2, 0.8);
    gxDecalStamp(); } catch (e) {}
  return r;
};
function gxDecalStamp() { const m = decals[(decalIdx - 1 + decals.length) % decals.length]; if (m) GX.decT.set(m, NOW); }
const _gxDec = addDecal;
addDecal = function (point, normal, kind, size) { const r = _gxDec.apply(this, arguments); try { const m = decals[(decalIdx - 1 + decals.length) % decals.length]; if (m) { GX.decT.set(m, NOW); m.userData.gxS = size; } } catch (e) {} return r; };
function gxDecalTick() { for (const m of decals) { if (!m.visible) continue; const t = GX.decT.get(m); if (t === undefined) continue; const age = NOW - t; if (age > 25) { const k = Math.max(0, 1 - (age - 25) / 4); m.scale.setScalar((m.userData.gxS || 0.14) * k); if (k <= 0) m.visible = false; } } }
/* ---------- 33 casings roll */
function gxCasingTick(dt) { for (const c of casings) { if (!c.on) continue; if (c.life < 0.2 && !c.gxLong) { c.gxLong = true; c.life += gxOn() ? 4 : 0; } const pos = c.m.position; const fl = TERR.on ? TH(pos.x, pos.z) + 0.02 : 0.02; if (pos.y <= fl + 0.001 && Math.abs(c.vy) < 0.5) { c.vx *= 1 - dt * 0.8; c.vz *= 1 - dt * 0.8; c.m.rotation.y += Math.hypot(c.vx, c.vz) * dt * 6; } if (!c.on || c.life <= 0) c.gxLong = false; } }
/* ---------- 34 explosions */
const _gxBoom = explosionFx;
explosionFx = function (p, power) {
  const r = _gxBoom.apply(this, arguments); if (!gxOn()) return r;
  try { const y = p.y < 1.4 ? (TERR.on ? TH(p.x, p.z) : 0) + 0.05 : p.y; const g = (GX.ringPool = GX.ringPool || []).pop() || new THREE.Mesh(GX.ringGeo || (GX.ringGeo = new THREE.RingGeometry(0.6, 1.0, 40)), new THREE.MeshBasicMaterial({ color: 0xffe8c0, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false })); g.material.opacity = 0.6; g.scale.setScalar(1); g.rotation.x = -Math.PI / 2; g.position.set(p.x, y, p.z); scene.add(g); GX.rings.push({ m: g, t: 0 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; puff(p.x + Math.cos(a) * 1.2, y + 0.2, p.z + Math.sin(a) * 1.2, { color: 0x8a7a64, size: 0.9, grow: 2.6, life: 1.6, vx: Math.cos(a) * 5, vz: Math.sin(a) * 5, vy: 0.3, op: 0.5 }); }
    for (let i = 0; i < 4; i++) puff(p.x + rnd(-1, 1), y + 1 + i * 0.6, p.z + rnd(-1, 1), { color: 0x2a2826, size: 2.2, grow: 3, life: 5 + i, vy: 0.5 + i * 0.2, vx: 0.3, op: 0.42 });
    chunks('wood', p, 8, 7, 1.2); chunks('metal', p, 6, 8, 1.1);
    const d = Math.hypot(p.x - P.x, p.z - P.z); if (S.shakeFx && d < 14 && G.state === 'playing') { const k = 1 - d / 14; G.shake = Math.max(G.shake || 0, 0.05 * k); GX.blast = Math.max(GX.blast, k); } } catch (e) {}
  return r;
};
function gxRingTick(dt) { for (let i = GX.rings.length - 1; i >= 0; i--) { const q = GX.rings[i]; q.t += dt; const k = q.t / 0.45; q.m.scale.setScalar(1 + k * 9); q.m.material.opacity = 0.6 * Math.max(0, 1 - k); if (k >= 1) { scene.remove(q.m); GX.ringPool.push(q.m); GX.rings.splice(i, 1); } } GX.blast = Math.max(0, GX.blast - dt * 2.5); }
/* ---------- 35 fire smoke and embers */
function gxFireTick(dt) { if (!gxOn() || typeof BRFG === 'undefined') return; for (const f of BRFG.fires || []) { if ((f.gxT = (f.gxT || 0) - dt) > 0) continue; f.gxT = 0.25; const x = f.x + rnd(-1, 1) * (f.R || 2) * 0.5, z = f.z + rnd(-1, 1) * (f.R || 2) * 0.5, y = (f.y || 0) + 0.4; puff(x, y + 0.6, z, { color: 0x302c2a, size: 0.8, grow: 2.6, life: 3, vy: 1.6, vx: 0.4, op: 0.35, minor: 1 }); puff(x, y, z, { fire: 1, size: 0.6, grow: -0.1, life: 0.45, vy: 1.2, op: 0.85, minor: 1 }); if (Math.random() < 0.5) chunks('spark', new THREE.Vector3(x, y + 0.3, z), 2, 1.5, 1.2, 2); } }
/* ---------- 37 footprints */
function gxPrintsInit() {
  if (GX.prints) return; const c = document.createElement('canvas'); c.width = 32; c.height = 64; const x = c.getContext('2d'); x.fillStyle = 'rgba(40,40,45,0.55)'; x.beginPath(); x.ellipse(16, 20, 9, 14, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(16, 50, 7, 9, 0, 0, 7); x.fill();
  const g = new THREE.PlaneGeometry(0.14, 0.3); g.rotateX(-Math.PI / 2); GX.prints = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0.6, polygonOffset: true, polygonOffsetFactor: -3 }), 140); GX.prints.count = 0; GX.prints.frustumCulled = false;
  for (let i = 0; i < 140; i++) GX.pr.push({ x: 0, y: -999, z: 0, a: 0, t: -99 });
}
const gxSoft = () => { const id = String(curMap); if (/snow|whiteout|winter/.test(id) || (typeof AMB !== 'undefined' && AMB.kind === 'snow') || (typeof GM !== 'undefined' && GM.snow.value > 0.3)) return 'snow'; if (/dust|desert|sand|stashisle/.test(id)) return 'sand'; return ''; };
const _gxM = new THREE.Matrix4(), _gxQ = new THREE.Quaternion(), _gxS = new THREE.Vector3(1, 1, 1), _gxP = new THREE.Vector3(), _gxE = new THREE.Euler();
function gxPrint(x, y, z, a, side) { gxPrintsInit(); const q = GX.pr[GX.prI++ % GX.pr.length]; q.x = x + Math.cos(a) * 0.1 * side; q.z = z - Math.sin(a) * 0.1 * side; q.y = y + 0.015; q.a = a; q.t = NOW; }
function gxPrintsTick() {
  const kind = gxSoft(); if (!kind || !gxOn()) { if (GX.prints && GX.prints.parent) scene.remove(GX.prints); return; } gxPrintsInit(); if (!GX.prints.parent) scene.add(GX.prints);
  const step = (key, x, y, z, a) => { const L = GX.lastStep.get(key); if (!L || Math.hypot(L.x - x, L.z - z) > 0.75) { const side = L ? -L.side : 1; if (kind !== 'sand' || y < 3) gxPrint(x, y, z, a, side); GX.lastStep.set(key, { x, z, side }); } };
  try { if (G.state === 'playing' && P.onGround) step(P, P.x, groundAt(P.x, P.z, (P.y || 0) + 0.3), P.z, P.yaw); for (const e of enemies) if (e.entry && e.group && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 30) step(e, e.group.position.x, e.group.position.y, e.group.position.z, e.group.rotation.y + Math.PI); } catch (e) {}
  let n = 0; for (const q of GX.pr) { const age = NOW - q.t; if (age > 30 || q.y < -900) continue; _gxE.set(0, q.a, 0); _gxQ.setFromEuler(_gxE); _gxP.set(q.x, q.y, q.z); _gxM.compose(_gxP, _gxQ, _gxS); GX.prints.setMatrixAt(n++, _gxM); }
  GX.prints.count = n; GX.prints.instanceMatrix.needsUpdate = true; GX.prints.material.color.setHex(kind === 'snow' ? 0x8090a8 : 0x8a7050);
}
/* ---------- 38 tracers glow + trails */
function gxTracerSetup() { for (const t of tracers) { const m = t.m.material; if (m.gx) continue; m.gx = true; m.toneMapped = false; m.blending = THREE.AdditiveBlending; m.needsUpdate = true; } }
const _gxTr = addTracer;
addTracer = function (a, b, life, thick) { const r = _gxTr.apply(this, arguments); if (!gxOn()) return r; try { gxTracerSetup(); let t = GX.trails.find(q => !q.on); if (!t && GX.trails.length < 14) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffd8a0, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); scene.add(m); t = { m, on: false }; GX.trails.push(t); } if (!t) return r;
  const len = a.distanceTo(b); if (len < 0.5) return r; t.on = true; t.life = t.max = 0.3; t.m.visible = true; t.m.position.copy(a).add(b).multiplyScalar(0.5); t.m.scale.set(0.012, 0.012, len); t.m.lookAt(b); } catch (e) {} return r; };
function gxTrailTick(dt) { for (const t of GX.trails) { if (!t.on) continue; t.life -= dt; if (t.life <= 0) { t.on = false; t.m.visible = false; } else { t.m.material.opacity = 0.2 * t.life / t.max; t.m.scale.x = t.m.scale.y = 0.012 + (1 - t.life / t.max) * 0.02; } } }
/* ---------- 40 additive effects skip tone mapping */
function gxGlowScan() { scene.traverse(o => { const m = o.material; if (!m || Array.isArray(m) || m.gxG) return; m.gxG = true; if (m.blending === THREE.AdditiveBlending && m.toneMapped !== false && (m.isMeshBasicMaterial || m.isSpriteMaterial || m.isPointsMaterial)) { m.toneMapped = false; m.needsUpdate = true; } }); }
/* ---------- every frame */
const _gxTick = tick;
tick = function (dt) { const r = _gxTick.apply(this, arguments); if (!G.noRender) try { gxDecalTick(); gxCasingTick(dt); gxRingTick(dt); gxFireTick(dt); gxPrintsTick(); gxTrailTick(dt); if ((GX.scanT = (GX.scanT || 0) - dt) <= 0) { GX.scanT = 3; gxGlowScan(); } if (typeof GP !== 'undefined') GP.blastBlur = GX.blast; } catch (e) {} return r; };
