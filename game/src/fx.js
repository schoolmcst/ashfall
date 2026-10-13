/* ================================================================== effects: sprites, sparks, decals, casings, lights */
const spritePool = [], chunkPools = {}, decals = [], casings = [], tracers = [];
let decalIdx = 0;
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const raycaster = new THREE.Raycaster();

function buildFx() {
  for (let i = 0; i < 120; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, transparent: true, depthWrite: false, opacity: 0 }));
    s.visible = false; scene.add(s); spritePool.push({ s, on: false, life: 0, max: 1, vx: 0, vy: 0, vz: 0, grow: 0, op: 1, size: 1, spin: 0 });
  }
  const mk = (color, emissive) => emissive ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshStandardMaterial({ color: C(color), roughness: 1 });
  const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
  [['spark', mk(0xffb040, true), 50], ['dust', mk(0x8a7e66), 50], ['blood', mk(0x6a0a0a), 40], ['wood', mk(0x7a5a38), 24], ['metal', mk(0xb0b4b8, true), 24]].forEach(([k, mat, n]) => {
    const list = []; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); m.visible = false; scene.add(m); list.push({ m, on: false, life: 0, vx: 0, vy: 0, vz: 0 }); }
    chunkPools[k] = { list, i: 0 };
  });
  const dmat = { hole: new THREE.MeshBasicMaterial({ map: TEX.hole, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }),
    scorch: new THREE.MeshBasicMaterial({ map: TEX.scorch, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }),
    blood: new THREE.MeshBasicMaterial({ map: TEX.blood, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }) };
  decals.mats = dmat;
  const dg = new THREE.PlaneGeometry(1, 1);
  for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(dg, dmat.hole); m.visible = false; scene.add(m); decals.push(m); }
  const cg = new THREE.CylinderGeometry(0.008, 0.008, 0.04, 6), cm = new THREE.MeshStandardMaterial({ color: C(0xc9a24a), metalness: 0.9, roughness: 0.3 });
  for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(cg, cm); m.visible = false; scene.add(m); casings.push({ m, on: false, life: 0, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0 }); }
  for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); m.visible = false; scene.add(m); tracers.push({ m, on: false, life: 0, max: 0.06 }); }
}

// kind: 'smoke' (normal blend) or 'fire' (additive); returns nothing
function puff(x, y, z, o) {
  if (FX.mult < 0.5 && o.minor) return;
  let p = null; for (const q of spritePool) if (!q.on) { p = q; break; } if (!p) return;
  const m = p.s.material;
  m.map = o.fire ? TEX.fire : o.flash ? TEX.flash : TEX.smoke; m.blending = o.fire || o.flash ? THREE.AdditiveBlending : THREE.NormalBlending;
  if (o.color !== undefined) m.color.setHex(o.color); else m.color.setHex(0xffffff);
  p.on = true; p.life = p.max = o.life || 1; p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0; p.grow = o.grow || 0; p.op = o.op === undefined ? 0.6 : o.op; p.size = o.size || 0.5; p.spin = (Math.random() - 0.5) * (o.spin || 0.5);
  p.s.position.set(x, y, z); p.s.scale.set(p.size, p.size, 1); m.rotation = Math.random() * TAU; m.opacity = p.op; p.s.visible = true;
}
function chunks(kind, pos, n, speed = 4, life = 0.5, up = 1) {
  n = Math.ceil(n * Math.min(1, FX.mult + 0.3)); const pool = chunkPools[kind]; if (!pool) return;
  for (let i = 0; i < n; i++) {
    const c = pool.list[pool.i++ % pool.list.length];
    c.on = true; c.life = life * (0.6 + Math.random() * 0.8); c.m.position.copy(pos); c.m.visible = true;
    c.vx = (Math.random() - 0.5) * 2 * speed; c.vy = (0.3 + Math.random()) * speed * up; c.vz = (Math.random() - 0.5) * 2 * speed;
    c.m.scale.setScalar(0.5 + Math.random() * 1.2);
  }
}
const _n = new THREE.Vector3();
function addDecal(point, normal, kind, size, ground) {
  const m = decals[decalIdx++ % decals.length]; m.material = decals.mats[kind];
  m.visible = true; m.position.copy(point).addScaledVector(normal, 0.012 + Math.random() * 0.004);
  _v3.copy(point).add(normal); m.lookAt(_v3); m.rotateZ(Math.random() * TAU); m.scale.setScalar(size);
}
function hitEffects(h, enemyHit) {
  const obj = h.object;
  _n.set(0, 1, 0); if (h.face && h.face.normal) _n.copy(h.face.normal).transformDirection(obj.matrixWorld);
  if (enemyHit) { chunks('blood', h.point, 5, 2.4, 0.5); puff(h.point.x, h.point.y, h.point.z, { color: 0x6a0c0c, size: 0.3, grow: 0.5, life: 0.5, vy: 0.4, op: 0.5, minor: 1 }); return; }
  const m = obj.material, isMetal = m === MAT.metal || (m && m.metalness > 0.5), isWood = m === MAT.wood, isSand = m === MAT.sand;
  addDecal(h.point, _n, 'hole', isMetal ? 0.1 : 0.14);
  chunks(isMetal ? 'metal' : isWood ? 'wood' : 'dust', h.point, isMetal ? 6 : 4, 2.6, 0.4);
  if (isMetal) chunks('spark', h.point, 4, 3, 0.25);
  puff(h.point.x, h.point.y, h.point.z, { color: isSand ? 0xb0a070 : 0x9a9488, size: 0.25, grow: 0.9, life: 0.7, vy: 0.5, op: 0.45, minor: 1 });
}
function addTracer(a, b, life = 0.06, thick = 0.02) {
  let t = null; for (const q of tracers) if (!q.on) { t = q; break; } if (!t) return;
  _v.copy(b).sub(a); const len = _v.length(); if (len < 0.5) return;
  t.on = true; t.life = t.max = life; t.m.visible = true; t.m.position.copy(a).add(b).multiplyScalar(0.5); t.m.scale.set(thick, thick, len); t.m.lookAt(b);
}
function spawnCasing(origin, right, fwd, big) {
  const c = casings.find(q => !q.on) || casings[0];
  c.on = true; c.life = 2.8; c.m.visible = true; c.m.scale.setScalar(big ? 2.2 : 1);
  c.m.position.copy(origin).addScaledVector(right, 0.12).addScaledVector(fwd, 0.35); c.m.position.y -= 0.1;
  c.vx = right.x * (1.6 + Math.random()) + (Math.random() - 0.5); c.vy = 1.8 + Math.random() * 1.2; c.vz = right.z * (1.6 + Math.random()) + (Math.random() - 0.5);
  c.rx = (Math.random() - 0.5) * 20; c.rz = (Math.random() - 0.5) * 20;
}

/* lights: one pooled point light for blasts / muzzle fire in the world */
const lightFx = { t: 0, max: 0.05, i: 0 };
function flashLight(x, y, z, intensity, dur, range = 18) { muzzleLight.position.set(x, y, z); muzzleLight.distance = range; lightFx.i = intensity; lightFx.t = lightFx.max = dur; }

function explosionFx(p, power) {
  const R = 1;
  puff(p.x, p.y + 0.3, p.z, { fire: 1, size: 3.2, grow: 5, life: 0.35, op: 1 });
  for (let i = 0; i < 7; i++) puff(p.x + (Math.random() - 0.5) * 1.2, p.y + 0.3 + Math.random() * 0.8, p.z + (Math.random() - 0.5) * 1.2, { fire: 1, size: 1.6 + Math.random(), grow: 3, life: 0.5 + Math.random() * 0.3, vy: 1 + Math.random() * 2, vx: (Math.random() - 0.5) * 3, vz: (Math.random() - 0.5) * 3, op: 0.9 });
  for (let i = 0; i < 10; i++) puff(p.x + (Math.random() - 0.5) * 1.8, p.y + 0.5, p.z + (Math.random() - 0.5) * 1.8, { color: 0x3a3836, size: 2 + Math.random() * 1.5, grow: 2.6, life: 2.2 + Math.random() * 1.2, vy: 1.4 + Math.random() * 1.6, vx: (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 2, op: 0.65 });
  chunks('spark', p, 22, 9, 0.7); chunks('dust', p, 22, 7, 1.0);
  if (p.y < 1.2) { _n.set(0, 1, 0); _v3.set(p.x, 0, p.z); addDecal(_v3, _n, 'scorch', 3.6); }
  flashLight(p.x, p.y + 1, p.z, 14, 0.3, 30);
}

function updateFx(dt) {
  for (const p of spritePool) {
    if (!p.on) continue; p.life -= dt;
    if (p.life <= 0) { p.on = false; p.s.visible = false; continue; }
    const k = 1 - p.life / p.max;
    p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt;
    p.vx *= 1 - dt * 0.6; p.vz *= 1 - dt * 0.6; p.vy *= 1 - dt * 0.35;
    const sc = p.size + p.grow * k; p.s.scale.set(sc, sc, 1); p.s.material.opacity = p.op * (1 - k) * (k < 0.08 ? k / 0.08 : 1); p.s.material.rotation += p.spin * dt;
  }
  for (const k in chunkPools) for (const c of chunkPools[k].list) {
    if (!c.on) continue; c.life -= dt; if (c.life <= 0) { c.on = false; c.m.visible = false; continue; }
    c.vy -= 14 * dt; c.m.position.x += c.vx * dt; c.m.position.y += c.vy * dt; c.m.position.z += c.vz * dt;
    if (c.m.position.y < 0.02) { c.m.position.y = 0.02; c.vy *= -0.3; c.vx *= 0.6; c.vz *= 0.6; }
    c.m.rotation.x += dt * 8; c.m.rotation.z += dt * 6;
  }
  for (const c of casings) {
    if (!c.on) continue; c.life -= dt; if (c.life <= 0) { c.on = false; c.m.visible = false; continue; }
    c.vy -= 12 * dt; const pos = c.m.position; pos.x += c.vx * dt; pos.y += c.vy * dt; pos.z += c.vz * dt;
    c.m.rotation.x += c.rx * dt; c.m.rotation.z += c.rz * dt;
    if (pos.y < 0.02) { pos.y = 0.02; if (Math.abs(c.vy) > 1.2) sfx.casing(at(pos.x, pos.z, 6)); c.vy *= -0.35; c.vx *= 0.5; c.vz *= 0.5; c.rx *= 0.4; c.rz *= 0.4; }
  }
  for (const t of tracers) { if (!t.on) continue; t.life -= dt; if (t.life <= 0) { t.on = false; t.m.visible = false; } else t.m.material.opacity = 0.9 * (t.life / t.max); }
  if (lightFx.t > 0) { lightFx.t -= dt; muzzleLight.intensity = lightFx.i * Math.max(0, lightFx.t / lightFx.max); } else muzzleLight.intensity = 0;
  if (enemyFlashLight.userData.t > 0) { enemyFlashLight.userData.t -= dt; if (enemyFlashLight.userData.t <= 0) enemyFlashLight.intensity = 0; }
}

function updateFires(dt, t) {
  for (const f of fires) {
    f.t += dt;
    f.light.intensity = 1.3 + Math.sin(f.t * 17) * 0.25 + Math.sin(f.t * 7.3) * 0.2 + Math.random() * 0.15;
    f.em = (f.em || 0) - dt;
    if (f.em <= 0) {
      f.em = 0.07 + Math.random() * 0.05;
      puff(f.x + (Math.random() - 0.5) * 0.2, 1.0, f.z + (Math.random() - 0.5) * 0.2, { fire: 1, size: 0.55, grow: -0.2, life: 0.5, vy: 1.1, op: 0.9, minor: 1 });
      if (Math.random() < 0.35) puff(f.x, 1.4, f.z, { color: 0x333333, size: 0.5, grow: 2.2, life: 2.6, vy: 1.3, vx: 0.4, op: 0.45, minor: 1 });
    }
  }
}
