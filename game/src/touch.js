/* ================================================================== TOUCH CONTROLS (1.2.88)
   On a touch screen (or SETTINGS > CONTROLS > TOUCH CONTROLS on): the left half of the screen is a floating move
   stick (push it all the way to sprint), drag the right half to look, and buttons for FIRE (hold), AIM, JUMP,
   CROUCH, RELOAD, GRENADE, SWAP, SCORESTREAK and PAUSE. They press the same keys the keyboard does, so every mode
   works the same. Menus work by tapping. */
const TCH = { on: false, mv: null, lk: null, el: null, held: {} };
const touchWanted = () => S.touch === 'on' || (S.touch !== 'off' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && !matchMedia('(pointer:fine)').matches);
const TCH_BTN = [['fire', 'FIRE', 'r1'], ['ads', 'AIM', 'r2'], ['jump', 'JUMP', 'r3'], ['crouch', 'CROUCH', 'r4'], ['reload', 'RELOAD', 'r5'], ['grenade', 'NADE', 'r6'], ['swap', 'SWAP', 'r7'], ['streak', 'STREAK', 'r8'], ['pause', 'II', 'tp']];
function touchBuild() {
  if (TCH.el) return; const o = document.createElement('div'); o.id = 'touchUi';
  o.innerHTML = `<div class="tc-zone tc-l"></div><div class="tc-zone tc-r"></div><div class="tc-stick hide"><i></i></div>${TCH_BTN.map(([k, n, c]) => `<button class="tc-b ${c}" data-tc="${k}">${n}</button>`).join('')}`;
  document.body.appendChild(o); TCH.el = o;
  const L = o.querySelector('.tc-l'), R = o.querySelector('.tc-r'), st = o.querySelector('.tc-stick'), knob = st.querySelector('i');
  L.addEventListener('pointerdown', e => { e.preventDefault(); L.setPointerCapture(e.pointerId); TCH.mv = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 }; st.classList.remove('hide'); st.style.left = e.clientX + 'px'; st.style.top = e.clientY + 'px'; knob.style.transform = ''; });
  L.addEventListener('pointermove', e => { const m = TCH.mv; if (!m || m.id !== e.pointerId) return; let dx = (e.clientX - m.x) / 60, dy = (e.clientY - m.y) / 60; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } m.dx = dx; m.dy = dy; m.full = l > 1.15; knob.style.transform = `translate(${dx * 44}px,${dy * 44}px)`; });
  const endMv = e => { if (TCH.mv && TCH.mv.id === e.pointerId) { TCH.mv = null; st.classList.add('hide'); } };
  L.addEventListener('pointerup', endMv); L.addEventListener('pointercancel', endMv);
  R.addEventListener('pointerdown', e => { e.preventDefault(); R.setPointerCapture(e.pointerId); TCH.lk = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
  R.addEventListener('pointermove', e => { const k = TCH.lk; if (!k || k.id !== e.pointerId || G.state !== 'playing') return; const s = 0.0055 * ((S.sens || 100) / 100) * (mouseAds ? 0.55 : 1); P.yaw -= (e.clientX - k.x) * s; P.pitch = clamp(P.pitch - (e.clientY - k.y) * s, -1.5, 1.5); k.x = e.clientX; k.y = e.clientY; });
  const endLk = e => { if (TCH.lk && TCH.lk.id === e.pointerId) TCH.lk = null; }; R.addEventListener('pointerup', endLk); R.addEventListener('pointercancel', endLk);
  for (const b of o.querySelectorAll('[data-tc]')) {
    const k = b.dataset.tc;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('on'); touchPress(k, true); });
    const up = e => { e.preventDefault(); b.classList.remove('on'); touchPress(k, false); }; b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
  }
}
function touchPress(k, down) {
  TCH.held[k] = down; const playing = G.state === 'playing';
  if (k === 'fire') { mouseDown = down && playing; if (down && playing) clickQueued = true; return; }
  if (k === 'ads') { if (down && playing) { mouseAds = !mouseAds; if (mouseAds) try { startAdsSnap(); } catch (e) {} } return; }
  if (k === 'jump' || k === 'crouch') { keys[bind(k)] = down && playing; return; }
  if (!down) { if (k === 'grenade') try { nadeHold(false); } catch (e) {} return; }
  if (k === 'pause') { if (G.state === 'paused') resumeGame(); else if (inMatch()) pauseGame(); return; }
  if (!playing) return;
  if (k === 'reload') startReload(); else if (k === 'swap') cycleWeapon(1); else if (k === 'grenade') nadeHold(true); else if (k === 'streak') stkUse();
}
// every frame (after the controller poll): the stick drives the soldier like a controller's left stick
function touchTick() {
  const want = touchWanted(); if (want && !TCH.el) touchBuild(); if (!TCH.el) return;
  const show = want && inMatch() && (G.state === 'playing' || G.state === 'paused' || G.state === 'respawning') && !curScreen; TCH.el.classList.toggle('hide', !show); document.body.classList.toggle('touch-on', want);
  if (!show) { if (TCH.on) { mouseDown = false; for (const k of ['jump', 'crouch', 'sprint']) keys[bind(k)] = false; } TCH.on = false; return; }
  TCH.on = true; const m = TCH.mv;
  if (m) { pad.mx = clamp(pad.mx + m.dx, -1, 1); pad.my = clamp(pad.my + m.dy, -1, 1); keys[bind('sprint')] = !!m.full && m.dy < -0.6; } else keys[bind('sprint')] = false;
}
(() => { const old = pollPad; pollPad = function (dt) { old(dt); try { touchTick(); } catch (e) {} }; })();
(() => { const s = document.createElement('style'); s.textContent = `#touchUi{position:fixed;inset:0;z-index:30;pointer-events:none;touch-action:none;user-select:none;-webkit-user-select:none}#touchUi.hide{display:none}
.tc-zone{position:absolute;top:0;bottom:0;pointer-events:auto;touch-action:none}.tc-l{left:0;width:40%}.tc-r{left:40%;right:0}
.tc-stick{position:fixed;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(0,0,0,.2);pointer-events:none}.tc-stick.hide{display:none}.tc-stick i{position:absolute;left:36px;top:36px;width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.45)}
.tc-b{position:fixed;pointer-events:auto;touch-action:none;width:64px;height:64px;border-radius:50%;border:2px solid rgba(255,255,255,.4);background:rgba(10,14,12,.45);color:#fff;font:700 10px/1 inherit;letter-spacing:.12em}.tc-b.on{background:rgba(93,255,122,.35);border-color:#5dff7a}
.tc-b.r1{right:28px;bottom:120px;width:86px;height:86px;font-size:12px;border-color:rgba(255,90,60,.7)}.tc-b.r2{right:130px;bottom:170px}.tc-b.r3{right:28px;bottom:28px}.tc-b.r4{right:110px;bottom:40px}.tc-b.r5{right:200px;bottom:90px}.tc-b.r6{right:130px;bottom:250px;width:54px;height:54px}.tc-b.r7{right:40px;bottom:230px;width:54px;height:54px}.tc-b.r8{right:40px;bottom:300px;width:54px;height:54px}.tc-b.tp{left:50%;top:10px;margin-left:-22px;width:44px;height:44px}`; document.head.appendChild(s); })();
