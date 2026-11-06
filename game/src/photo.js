/* ================================================================== PHOTO MODE (1.2.83)
   PAUSE -> PHOTO MODE: the HUD goes, the world holds still (offline; online it keeps going around you) and you fly a
   free camera: mouse to look (click to grab the mouse), WASD to move, Q / E down and up, SHIFT faster, the wheel zooms,
   F cycles the filters (NONE, MONO, WARM, COOL, VIVID, PURPLE HAZE, NOIR), H hides the help, ENTER saves a picture
   (with the filter) to a PNG, ESC goes back to the pause menu. The camera stays within 40 m of where you were. */
const PHOTO = { on: false, x: 0, y: 0, z: 0, yaw: 0, pitch: 0, fov: 70, filt: 0, help: true, keys: {}, from: null, raf: 0, last: 0 };
const PHOTO_FILT = [['NONE', ''], ['MONO', 'grayscale(1) contrast(1.15)'], ['WARM', 'sepia(.35) saturate(1.3) hue-rotate(-8deg)'], ['COOL', 'saturate(1.1) hue-rotate(18deg) brightness(1.02)'], ['VIVID', 'saturate(1.7) contrast(1.12)'], ['PURPLE HAZE', 'hue-rotate(-60deg) saturate(1.5) brightness(1.05)'], ['NOIR', 'grayscale(1) contrast(1.6) brightness(.85)']];
function photoStart() {
  if (PHOTO.on || !(G.state === 'paused' || G.state === 'playing')) return;
  PHOTO.on = true; PHOTO.from = { state: G.state === 'paused' ? (G.pausedFrom || 'playing') : G.state, px: P.x, py: P.y, pz: P.z };
  PHOTO.x = camera.position.x; PHOTO.y = camera.position.y; PHOTO.z = camera.position.z; PHOTO.yaw = P.yaw; PHOTO.pitch = P.pitch; PHOTO.fov = camera.fov; PHOTO.keys = {};
  G.state = 'photo'; showScreen(null); const h = $('hud'); if (h) h.style.visibility = 'hidden';
  let ui = $('photoUi'); if (!ui) { ui = document.createElement('div'); ui.id = 'photoUi'; document.body.appendChild(ui); } ui.style.display = '';
  photoUi(); try { renderer.domElement.requestPointerLock(); } catch (e) {}
  addEventListener('keydown', photoKey, true); addEventListener('keyup', photoKeyUp, true); addEventListener('mousemove', photoMouse, true); addEventListener('wheel', photoWheel, { capture: true, passive: false }); addEventListener('mousedown', photoClick, true);
  PHOTO.last = performance.now(); PHOTO.raf = requestAnimationFrame(photoLoop);
}
function photoEnd() {
  if (!PHOTO.on) return; PHOTO.on = false; cancelAnimationFrame(PHOTO.raf);
  removeEventListener('keydown', photoKey, true); removeEventListener('keyup', photoKeyUp, true); removeEventListener('mousemove', photoMouse, true); removeEventListener('wheel', photoWheel, true); removeEventListener('mousedown', photoClick, true);
  renderer.domElement.style.filter = ''; const ui = $('photoUi'); if (ui) ui.style.display = 'none'; const h = $('hud'); if (h) h.style.visibility = '';
  camera.fov = PHOTO.fov0 || camera.fov; camera.updateProjectionMatrix();
  G.pausedFrom = PHOTO.from.state; G.state = 'paused'; try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {} showScreen('pause');
}
function photoUi() {
  const ui = $('photoUi'); if (!ui) return;
  ui.innerHTML = PHOTO.help ? `<b>PHOTO MODE</b><span>MOUSE look · WASD move · Q/E down/up · SHIFT faster · WHEEL zoom · F filter: <i>${PHOTO_FILT[PHOTO.filt][0]}</i> · ENTER save · H hide · ESC back</span>` : '';
}
function photoKey(e) {
  if (!PHOTO.on) return; e.stopPropagation(); e.preventDefault();
  if (e.code === 'Escape') return photoEnd();
  if (e.code === 'Enter' || e.code === 'NumpadEnter') return photoSave();
  if (e.code === 'KeyF') { PHOTO.filt = (PHOTO.filt + 1) % PHOTO_FILT.length; renderer.domElement.style.filter = PHOTO_FILT[PHOTO.filt][1]; photoUi(); return; }
  if (e.code === 'KeyH') { PHOTO.help = !PHOTO.help; photoUi(); return; }
  PHOTO.keys[e.code] = true;
}
function photoKeyUp(e) { if (!PHOTO.on) return; e.stopPropagation(); PHOTO.keys[e.code] = false; }
function photoMouse(e) { if (!PHOTO.on || !document.pointerLockElement) return; e.stopPropagation(); const k = 0.0022 * ((S.sens || 5) / 5); PHOTO.yaw -= e.movementX * k; PHOTO.pitch = clamp(PHOTO.pitch - e.movementY * k, -1.5, 1.5); }
function photoWheel(e) { if (!PHOTO.on) return; e.preventDefault(); e.stopPropagation(); if (!PHOTO.fov0) PHOTO.fov0 = camera.fov; camera.fov = clamp(camera.fov + Math.sign(e.deltaY) * 4, 15, 110); camera.updateProjectionMatrix(); }
function photoClick(e) { if (!PHOTO.on) return; e.stopPropagation(); e.preventDefault(); if (!document.pointerLockElement) try { renderer.domElement.requestPointerLock(); } catch (er) {} }
function photoLoop(now) {
  if (!PHOTO.on) return; const dt = Math.min(0.05, (now - PHOTO.last) / 1000); PHOTO.last = now; const K = PHOTO.keys;
  const sp = (K.ShiftLeft || K.ShiftRight ? 12 : 4) * dt, f = (K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0), s = (K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0), u = (K.KeyE || K.Space ? 1 : 0) - (K.KeyQ || K.KeyC ? 1 : 0);
  const cy = Math.cos(PHOTO.pitch);
  PHOTO.x += (-Math.sin(PHOTO.yaw) * cy * f + Math.cos(PHOTO.yaw) * s) * sp; PHOTO.z += (-Math.cos(PHOTO.yaw) * cy * f - Math.sin(PHOTO.yaw) * s) * sp; PHOTO.y += (Math.sin(PHOTO.pitch) * f + u) * sp;
  const o = PHOTO.from, dx = PHOTO.x - o.px, dz = PHOTO.z - o.pz, d = Math.hypot(dx, dz); if (d > 40) { PHOTO.x = o.px + dx / d * 40; PHOTO.z = o.pz + dz / d * 40; }
  PHOTO.y = clamp(PHOTO.y, (o.py || 0) + 0.2, (o.py || 0) + 30);
  camera.position.set(PHOTO.x, PHOTO.y, PHOTO.z); camera.rotation.set(PHOTO.pitch, PHOTO.yaw, 0, 'YXZ');
  PHOTO.raf = requestAnimationFrame(photoLoop);
}
// save what's on screen, filter included, as a PNG
function photoSave() {
  try {
    renderFrame(); const src = renderer.domElement, c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const g = c.getContext('2d'); g.filter = PHOTO_FILT[PHOTO.filt][1] || 'none'; g.drawImage(src, 0, 0);
    const a = document.createElement('a'); a.download = `darkzone-${curMap}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`; a.href = c.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
    PHOTO.saved = (PHOTO.saved | 0) + 1; try { sfx.ui(); achAdd('photos'); } catch (e) {}
    const ui = $('photoUi'); if (ui) { ui.classList.add('flash'); setTimeout(() => ui.classList.remove('flash'), 300); }
  } catch (e) { reportError(e); }
}
(() => { const s = document.createElement('style'); s.textContent = '#photoUi{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:60;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 16px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.15);font-size:11px;letter-spacing:.14em;color:#ddd;text-align:center}#photoUi:empty{display:none!important}#photoUi b{color:var(--accent);letter-spacing:.3em}#photoUi i{font-style:normal;color:#fff}#photoUi.flash{background:rgba(255,255,255,.7)}'; document.head.appendChild(s); })();
