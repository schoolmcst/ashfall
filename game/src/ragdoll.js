/* ================================================================== ragdoll physics (Verlet particles + stick constraints) */
// 16 particles at the soldier's joints, held together by distance constraints, collide with the ground,
// cover and walls. Each frame the rig's bones are re-aimed at the particles, so the Blender mesh follows.
const RD_P = ['pelvis', 'chest', 'neck', 'head', 'shL', 'elL', 'haL', 'shR', 'elR', 'haR', 'hipL', 'knL', 'ftL', 'hipR', 'knR', 'ftR'];
const RI = {}; RD_P.forEach((n, i) => { RI[n] = i; });
// [a, b, stiffness]
const RD_STICKS = [
  // torso block (rigid)
  ['pelvis', 'chest', 1], ['chest', 'neck', 1], ['pelvis', 'neck', 1], ['shL', 'shR', 1], ['shL', 'neck', 1], ['shR', 'neck', 1],
  ['shL', 'chest', 1], ['shR', 'chest', 1], ['shL', 'pelvis', 1], ['shR', 'pelvis', 1], ['hipL', 'hipR', 1], ['hipL', 'pelvis', 1],
  ['hipR', 'pelvis', 1], ['hipL', 'chest', 1], ['hipR', 'chest', 1], ['hipL', 'shR', 0.6], ['hipR', 'shL', 0.6],
  // head (slightly loose so it lolls)
  ['neck', 'head', 1], ['head', 'shL', 0.25], ['head', 'shR', 0.25], ['head', 'chest', 0.3],
  // limbs
  ['shL', 'elL', 1], ['elL', 'haL', 1], ['shR', 'elR', 1], ['elR', 'haR', 1],
  ['hipL', 'knL', 1], ['knL', 'ftL', 1], ['hipR', 'knR', 1], ['knR', 'ftR', 1],
];
// joints may bend but not fold flat: [a, b, minFractionOfRest]
const RD_MIN = [['shL', 'haL', 0.45], ['shR', 'haR', 0.45], ['hipL', 'ftL', 0.62], ['hipR', 'ftR', 0.62], ['haL', 'pelvis', 0.4], ['haR', 'pelvis', 0.4], ['ftL', 'ftR', 0.15], ['knL', 'knR', 0.3]];
const RD_RAD = { head: 0.12, pelvis: 0.12, chest: 0.13, neck: 0.08 };
const RD_DT = 1 / 90, RD_GRAV = -9.8;
const _rq = new THREE.Quaternion(), _rq2 = new THREE.Quaternion(), _rm = new THREE.Matrix4();
const _rx = new THREE.Vector3(), _ry = new THREE.Vector3(), _rz = new THREE.Vector3(), _rv = new THREE.Vector3();

function makeRagdoll(e, dir, boom, head) {
  const r = e.rig, root = r.root;
  root.rotation.x = 0; root.rotation.z = 0; root.updateMatrixWorld(true);
  const W = (obj, x = 0, y = 0, z = 0) => obj.localToWorld(new THREE.Vector3(x, y, z));
  const pos = [
    W(r.hips), W(r.torso, 0, 0.3, 0), W(r.torso, 0, 0.62, 0), W(r.head, 0, 0.02, 0),
    W(r.armL), W(r.elL), W(r.elL, 0, -0.3, 0), W(r.armR), W(r.elR), W(r.elR, 0, -0.3, 0),
    W(r.legL), W(r.knL), W(r.knL, 0, -0.46, 0), W(r.legR), W(r.knR), W(r.knR, 0, -0.46, 0),
  ];
  const n = pos.length, p = new Float32Array(n * 3), q = new Float32Array(n * 3), rad = new Float32Array(n);
  // initial velocity: the hit pushes the upper body, explosions throw everything
  const d = _rv.set(dir ? dir.x : 0, dir ? (dir.y || 0) : 0, dir ? dir.z : 0); if (d.lengthSq() > 1e-6) d.normalize();
  for (let i = 0; i < n; i++) {
    const name = RD_P[i], upper = i <= 9;
    let k = boom ? 7.5 : (upper ? 2.4 : 0.6);
    if (head && name === 'head') k += 3.5;
    const vx = d.x * k * (0.8 + Math.random() * 0.4), vz = d.z * k * (0.8 + Math.random() * 0.4), vy = boom ? 4.5 + Math.random() * 2 : (upper ? 0.4 : 0);
    p[i * 3] = pos[i].x; p[i * 3 + 1] = pos[i].y; p[i * 3 + 2] = pos[i].z;
    q[i * 3] = pos[i].x - vx * RD_DT; q[i * 3 + 1] = pos[i].y - vy * RD_DT; q[i * 3 + 2] = pos[i].z - vz * RD_DT;
    rad[i] = (RD_RAD[name] || 0.07) * (root.userData.scale || 1);
  }
  const sticks = RD_STICKS.map(([a, b, k]) => { const ia = RI[a], ib = RI[b]; return [ia, ib, pos[ia].distanceTo(pos[ib]), k]; });
  const mins = RD_MIN.map(([a, b, f]) => { const ia = RI[a], ib = RI[b]; return [ia, ib, pos[ia].distanceTo(pos[ib]) * f]; });
  // the rifle drops out of the hands and tumbles on its own
  let gun = null;
  if (r.gun) {
    scene.attach(r.gun); r.flash.visible = false;
    gun = { o: r.gun, vx: d.x * (boom ? 5 : 1.2) + rnd(-0.6, 0.6), vy: boom ? 4 : 1.2, vz: d.z * (boom ? 5 : 1.2) + rnd(-0.6, 0.6), sx: rnd(-4, 4), sz: rnd(-6, 6), rest: false };
  }
  return { p, q, rad, n, sticks, mins, acc: 0, t: 0, sleep: false, still: 0, gun };
}

function stepRagdoll(rd) {
  const { p, q, rad, n } = rd, dt2 = RD_DT * RD_DT;
  let motion = 0;
  for (let i = 0; i < n; i++) {
    const a = i * 3;
    for (let k = 0; k < 3; k++) {
      const cur = p[a + k], v = (cur - q[a + k]) * 0.993;
      q[a + k] = cur; p[a + k] = cur + v + (k === 1 ? RD_GRAV * dt2 : 0);
      motion = Math.max(motion, Math.abs(v));
    }
  }
  for (let it = 0; it < 8; it++) {
    for (const [ia, ib, len, k] of rd.sticks) {
      const a = ia * 3, b = ib * 3, dx = p[b] - p[a], dy = p[b + 1] - p[a + 1], dz = p[b + 2] - p[a + 2];
      const dd = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6, f = (dd - len) / dd * 0.5 * k;
      p[a] += dx * f; p[a + 1] += dy * f; p[a + 2] += dz * f; p[b] -= dx * f; p[b + 1] -= dy * f; p[b + 2] -= dz * f;
    }
    for (const [ia, ib, mn] of rd.mins) {
      const a = ia * 3, b = ib * 3, dx = p[b] - p[a], dy = p[b + 1] - p[a + 1], dz = p[b + 2] - p[a + 2];
      const dd = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6; if (dd >= mn) continue;
      const f = (dd - mn) / dd * 0.5;
      p[a] += dx * f; p[a + 1] += dy * f; p[a + 2] += dz * f; p[b] -= dx * f; p[b + 1] -= dy * f; p[b + 2] -= dz * f;
    }
    if (it % 2 === 1) collideRagdoll(rd);
  }
  return motion;
}
const _cp = { x: 0, z: 0 };
function collideRagdoll(rd) {
  const { p, q, rad, n } = rd;
  for (let i = 0; i < n; i++) {
    const a = i * 3, r = rad[i];
    // walls and cover: horizontal push-out from any box taller than this particle
    _cp.x = p[a]; _cp.z = p[a + 2]; resolve(_cp, r, p[a + 1] - STEP);
    p[a] = _cp.x; p[a + 2] = _cp.z;
    const gy = groundAt(p[a], p[a + 2], p[a + 1] - r + 0.05) + r;
    if (p[a + 1] < gy) {
      p[a + 1] = gy;
      // ground friction: bleed horizontal velocity, kill bounce
      q[a] = p[a] - (p[a] - q[a]) * 0.6; q[a + 2] = p[a + 2] - (p[a + 2] - q[a + 2]) * 0.6;
      if (q[a + 1] < p[a + 1]) q[a + 1] = p[a + 1];
    }
  }
}

// aim a bone so its local +y runs along `up` with `side` as the x hint; returns the world quaternion
function basisQ(out, up, side) {
  _ry.copy(up).normalize(); _rz.crossVectors(side, _ry); if (_rz.lengthSq() < 1e-8) _rz.set(0, 0, 1); _rz.normalize();
  _rx.crossVectors(_ry, _rz).normalize(); _rm.makeBasis(_rx, _ry, _rz); return out.setFromRotationMatrix(_rm);
}
const _rdTmp = new THREE.Vector3(), _hipsX = new THREE.Vector3(), _shX = new THREE.Vector3();
function poseRagdoll(rd, rig) {
  const p = rd.p, V = (i, out) => out.set(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
  const v = rd.tmp || (rd.tmp = Array.from({ length: 16 }, () => new THREE.Vector3()));
  for (let i = 0; i < 16; i++) V(i, v[i]);
  const Q = rd.q4 || (rd.q4 = Array.from({ length: 12 }, () => new THREE.Quaternion()));
  const sub = (a, b) => _rv.subVectors(v[RI[a]], v[RI[b]]);
  const root = rig.root, qRoot = root.quaternion, inv = q => _rq2.copy(q).invert();
  const hipsX = _hipsX.subVectors(v[RI.hipR], v[RI.hipL]);
  const shX = _shX.subVectors(v[RI.shR], v[RI.shL]);
  // hips
  basisQ(Q[0], sub('chest', 'pelvis'), hipsX);
  rig.hips.position.copy(root.worldToLocal(_rdTmp.copy(v[RI.pelvis])));
  rig.hips.quaternion.copy(inv(qRoot)).multiply(Q[0]);
  // torso + head
  basisQ(Q[1], sub('neck', 'pelvis'), shX); rig.torso.quaternion.copy(inv(Q[0])).multiply(Q[1]);
  basisQ(Q[2], sub('head', 'neck'), shX); rig.head.quaternion.copy(inv(Q[1])).multiply(Q[2]);
  // arms
  basisQ(Q[3], sub('shL', 'elL'), shX); rig.armL.quaternion.copy(inv(Q[1])).multiply(Q[3]);
  basisQ(Q[4], sub('elL', 'haL'), shX); rig.elL.quaternion.copy(inv(Q[3])).multiply(Q[4]);
  basisQ(Q[5], sub('shR', 'elR'), shX); rig.armR.quaternion.copy(inv(Q[1])).multiply(Q[5]);
  basisQ(Q[6], sub('elR', 'haR'), shX); rig.elR.quaternion.copy(inv(Q[5])).multiply(Q[6]);
  // legs
  basisQ(Q[7], sub('hipL', 'knL'), hipsX); rig.legL.quaternion.copy(inv(Q[0])).multiply(Q[7]);
  basisQ(Q[8], sub('knL', 'ftL'), hipsX); rig.knL.quaternion.copy(inv(Q[7])).multiply(Q[8]);
  basisQ(Q[9], sub('hipR', 'knR'), hipsX); rig.legR.quaternion.copy(inv(Q[0])).multiply(Q[9]);
  basisQ(Q[10], sub('knR', 'ftR'), hipsX); rig.knR.quaternion.copy(inv(Q[9])).multiply(Q[10]);
}

function updateGun(g, dt) {
  if (g.rest) return;
  const o = g.o; g.vy -= 9.8 * dt;
  o.position.x += g.vx * dt; o.position.y += g.vy * dt; o.position.z += g.vz * dt;
  o.rotation.x += g.sx * dt; o.rotation.z += g.sz * dt;
  const gy = groundAt(o.position.x, o.position.z, o.position.y) + 0.04;
  if (o.position.y < gy) {
    o.position.y = gy;
    if (Math.abs(g.vy) > 1.2) { g.vy = -g.vy * 0.3; g.vx *= 0.5; g.vz *= 0.5; g.sx *= 0.4; g.sz *= 0.4; }
    else { g.rest = true; o.rotation.x = 0; o.rotation.z = Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1); o.position.y = gy - 0.01; }
  }
}

// fixed-step simulation; goes to sleep once the body has settled
function updateRagdoll(rd, rig, dt) {
  rd.t += dt;
  if (rd.gun) updateGun(rd.gun, dt);
  if (rd.sleep) return;
  rd.acc = Math.min(rd.acc + dt, RD_DT * 6);
  let motion = 0;
  while (rd.acc >= RD_DT) { motion = Math.max(motion, stepRagdoll(rd)); rd.acc -= RD_DT; }
  poseRagdoll(rd, rig);
  rd.still = motion < 0.002 ? rd.still + dt : 0;
  if ((rd.still > 0.5 && rd.t > 1.2) || rd.t > 6) rd.sleep = true;
}
