/* ================================================================== death cam: slow-motion shot of whoever killed you */
const _dcK = new THREE.Vector3(), _dcL = new THREE.Vector3(), _dcA = new THREE.Vector3(), _dcB = new THREE.Vector3(), _dcRay = new THREE.Raycaster();
const dcEase = k => k * k * (3 - 2 * k);

function startDeathCam() {
  G.state = 'deathcam';
  const k = G.killer && typeof G.killer === 'object' && G.killer.rig ? G.killer : null;
  const E = camera.position.clone();
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const look0 = E.clone().addScaledVector(fwd, 4);
  let end, focus;
  if (k) {
    k.rig.head.getWorldPosition(_dcK);
    const away = new THREE.Vector3(E.x - _dcK.x, 0, E.z - _dcK.z); const dist = away.length(); away.normalize();
    const side = new THREE.Vector3(-away.z, 0, away.x);
    end = _dcK.clone().addScaledVector(away, Math.min(3.2, dist * 0.6)).addScaledVector(side, 0.9); end.y = _dcK.y + 0.35;
    // keep the camera on the near side of any wall between it and the killer
    _dcA.subVectors(end, _dcK); const len = _dcA.length(); _dcRay.set(_dcK, _dcA.normalize()); _dcRay.far = len;
    const hit = _dcRay.intersectObjects(wallMeshes, false)[0];
    if (hit) end.copy(_dcK).addScaledVector(_dcA, Math.max(0.8, hit.distance - 0.35));
    const name = (k.name || k.type || 'enemy').toUpperCase();
    $('kcName').textContent = 'KILLED BY ' + name;
    $('kcSub').textContent = `${Math.round(dist)} M  ·  ${Math.max(0, Math.round(k.hp))} HP LEFT`;
  } else {
    end = E.clone().addScaledVector(fwd, -3.5); end.y = E.y + 3.2;
    $('kcName').textContent = G.killer === 'grenade' ? 'KILLED BY YOUR OWN GRENADE' : G.killer === 'barrel' ? 'KILLED BY AN EXPLODING BARREL' : 'K.I.A.';
    $('kcSub').textContent = inMatch() ? `${M.me.kills} KILLS  ·  ${M.me.deaths} DEATHS` : `WAVE ${G.wave}  ·  ${G.kills} KILLS`;
  }
  focus = k ? null : new THREE.Vector3(E.x, 0.4, E.z);
  G.dc = { t: 0, dur: inMatch() ? 2.6 : 3.6, E, look0, end, killer: k, focus, orbit: 0, done: false };
  $('killcam').classList.remove('hide');
  sfx.hurt();
}
// k: 0..1 progress along the shot
function aimDeathCam(dt, k) {
  const dc = G.dc; if (!dc) return;
  if (dc.killer) dc.killer.rig.head.getWorldPosition(_dcK); else _dcK.copy(dc.focus);
  if (k >= 1) dc.orbit += dt * 0.12;
  const e = dcEase(Math.min(k / 0.75, 1));
  // quadratic arc: up out of the player's body, then down to the killer
  _dcA.copy(dc.E).lerp(dc.end, 0.5); _dcA.y += 1.8;
  const u = 1 - e;
  _dcB.copy(dc.E).multiplyScalar(u * u).addScaledVector(_dcA, 2 * u * e).addScaledVector(dc.end, e * e);
  if (dc.orbit) { const c = Math.cos(dc.orbit), s = Math.sin(dc.orbit), dx = _dcB.x - _dcK.x, dz = _dcB.z - _dcK.z; _dcB.x = _dcK.x + dx * c - dz * s; _dcB.z = _dcK.z + dx * s + dz * c; }
  camera.position.copy(_dcB);
  _dcL.copy(dc.look0).lerp(_dcK, dcEase(Math.min(k / 0.45, 1)));
  if (dc.killer) _dcL.y -= 0.12 * e;
  camera.lookAt(_dcL);
}
function updateDeathCam(dt) {
  const dc = G.dc; if (!dc) { finishDeath(); return; }
  dc.t += dt;
  aimDeathCam(dt, dc.t / dc.dur);
  if (dc.t >= dc.dur + 0.8) { dc.done = true; finishDeath(); }
}
