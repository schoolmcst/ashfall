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
    $('kcName').textContent = 'KILLED BY ' + name; kcBanner(k);
    $('kcSub').textContent = `${Math.round(dist)} M  ·  ${Math.max(0, Math.round(k.hp))} HP LEFT`;
  } else {
    end = E.clone().addScaledVector(fwd, -3.5); end.y = E.y + 3.2;
    kcBanner(null); $('kcName').textContent = G.killer === 'grenade' ? 'KILLED BY YOUR OWN GRENADE' : G.killer === 'barrel' ? 'KILLED BY AN EXPLODING BARREL' : 'K.I.A.';
    $('kcSub').textContent = inMatch() ? `${M.me.kills} KILLS  ·  ${M.me.deaths} DEATHS` : `WAVE ${G.wave}  ·  ${G.kills} KILLS`;
  }
  focus = k ? null : new THREE.Vector3(E.x, 0.4, E.z);
  G.dc = { t: 0, dur: inMatch() ? 2.6 : 3.6, E, look0, end, killer: k, focus, orbit: 0, done: false, kcT: k && S.killcam !== false ? KC_VIEW : 0 };
  $('killcam').classList.remove('hide'); $('killcam').classList.toggle('kcv', !!G.dc.kcT);
  if (G.dc.kcT) { $('kcName').textContent = 'KILLCAM · ' + (k.name || k.type || 'enemy').toUpperCase(); $('kcSub').textContent = `${weaponLabel(k) || 'their gun'}  ·  ${Math.round(Math.hypot(E.x - _dcK.x, E.z - _dcK.z))} M  ·  ${Math.max(0, Math.round(k.hp))} HP LEFT`; }
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
  if (dc.kcT > 0) {   // KILLCAM: over the killer's shoulder, looking at where you died
    dc.kcT -= dt; killcamView(dc, 1 - dc.kcT / KC_VIEW);
    if (dc.kcT <= 0) { kcYou(null); $('killcam').classList.remove('kcv'); camera.fov = baseFov; camera.updateProjectionMatrix(); if (inMatch()) { dc.done = true; finishDeath(); return; } kcBanner(dc.killer); $('kcName').textContent = 'KILLED BY ' + (dc.killer.name || dc.killer.type || 'enemy').toUpperCase(); }
    return;
  }
  dc.t += dt;
  aimDeathCam(dt, dc.t / dc.dur);
  if (dc.t >= dc.dur + 0.8) { dc.done = true; finishDeath(); }
}

// the killer's banner on the death cam card: a real player's own pick, bots get one from their name
function kcBanner(k) {
  const card = document.querySelector('.kc-card'); if (!card) return;
  if (!k || typeof bannerUrl !== 'function') { card.style.backgroundImage = ''; card.classList.remove('bn'); return; }
  let id = '', lv = 0;
  try { const R = k.net && NET.rem && NET.rem.get(k.net); if (R) { id = R.bn; lv = R.lv; } } catch (e) {}
  if (!id) { const pool = COSM.filter(c => c.kind === 'banner' && !c.bp); id = pool[strHash(String(k.name || k.type)) % pool.length].id; }
  card.style.backgroundImage = `linear-gradient(90deg,rgba(0,0,0,.55),rgba(0,0,0,.1)),url(${bannerUrl(id)})`; card.classList.add('bn');
}
(() => { const s = document.createElement('style'); s.textContent = '#killcam .kc-card.bn{padding:0 130px 0 22px;text-align:left;background-size:cover;background-position:center;min-width:420px;aspect-ratio:4/1;display:flex;flex-direction:column;justify-content:center;border:1px solid rgba(255,255,255,.25)}#killcam .kc-card.bn .kc-name,#killcam .kc-card.bn .kc-sub{text-shadow:0 1px 3px #000,0 0 8px #000}'; document.head.appendChild(s); })();

/* ---------- KILLCAM: the killer's view of your death, over their shoulder, zooming in on where you went down */
const KC_VIEW = 2.3, _kcF = new THREE.Vector3(), _kcP = new THREE.Vector3();
function killcamView(dc, k) {
  const e = dc.killer; e.rig.head.getWorldPosition(_dcK);
  _kcF.set(dc.E.x - _dcK.x, 0, dc.E.z - _dcK.z); const dist = _kcF.length() || 1; _kcF.divideScalar(dist);
  const side = new THREE.Vector3(-_kcF.z, 0, _kcF.x);
  _kcP.copy(_dcK).addScaledVector(_kcF, -1.25).addScaledVector(side, -0.62); _kcP.y += 0.22;
  // never through a wall behind them
  _dcA.subVectors(_kcP, _dcK); const len = _dcA.length(); _dcRay.set(_dcK, _dcA.normalize()); _dcRay.far = len;
  const hit = _dcRay.intersectObjects(wallMeshes, false)[0]; if (hit) _kcP.copy(_dcK).addScaledVector(_dcA, Math.max(0.2, hit.distance - 0.15));
  camera.position.copy(_kcP);
  kcYou(dc);
  _dcL.set(dc.E.x, dc.E.y - 0.45 - 0.5 * Math.min(1, k * 1.5), dc.E.z);   // the body drops
  camera.lookAt(_dcL);
  camera.fov = baseFov * (1 - 0.32 * dcEase(Math.min(1, k * 1.6)) * Math.min(1, dist / 18)); camera.updateProjectionMatrix();   // far kills zoom in more
}
(() => { const s = document.createElement('style'); s.textContent = '#killcam.kcv::before,#killcam.kcv::after{content:"";position:fixed;left:0;right:0;height:9vh;background:#000;z-index:-1}#killcam.kcv::before{top:0}#killcam.kcv::after{bottom:0}#killcam.kcv .kc-card{border-left:4px solid #ff4a3a}#killcam.kcv .kc-name::before{content:"\\25CF  ";color:#ff4a3a;animation:kcrec 1s steps(2) infinite}@keyframes kcrec{50%{opacity:0}}'; document.head.appendChild(s); })();
// where you were standing, marked in the killcam (you have no body of your own to see)
function kcYou(dc) {
  if (!kcYou.s) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = 'rgba(255,74,58,.85)'; g.strokeStyle = '#000'; g.lineWidth = 5; g.beginPath(); g.moveTo(64, 104); g.lineTo(40, 70); g.lineTo(88, 70); g.closePath(); g.fill(); g.stroke(); g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.lineWidth = 6; g.strokeText('YOU', 64, 52); g.fillStyle = '#fff'; g.fillText('YOU', 64, 52);
    kcYou.s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true })); kcYou.s.renderOrder = 9; }
  const sp = kcYou.s;
  if (!dc) { if (sp.parent) sp.parent.remove(sp); return; }
  if (!sp.parent) scene.add(sp);
  const d = Math.hypot(dc.E.x - camera.position.x, dc.E.z - camera.position.z), k = 0.05 * Math.max(6, d);
  sp.scale.set(k, k, 1); sp.position.set(dc.E.x, dc.E.y + 0.2, dc.E.z);
}
