/* ================================================================== AIM TRAINER, HUD EDITOR (1.2.88)
   AIM TRAINER - in THE STASH YARD (the firing range) pause and pick a drill: GRIDSHOT (three targets on a wall, hit
     as many as you can in 30 s), FLICK (one target at a time anywhere in front of you: your average reaction), and
     TRACKING (keep your crosshair on a strafing ball: the % of time on it). Your best score for each is saved.
   HUD EDITOR - SETTINGS > INTERFACE > EDIT HUD (or the pause menu): drag the minimap, health, ammo, kill feed,
     scorestreaks, score and mode bar where you want them, mouse wheel to resize, RESET to put them back. Saved in S.hud. */
const AIM = { on: null, tg: [], shots0: 0, hits: 0, t: 0, react: [], spawnAt: 0, onT: 0, ray: new THREE.Raycaster() };
const AIM_DRILLS = { grid: { n: 'GRIDSHOT', d: 'three targets on a wall · 30 s', T: 30 }, flick: { n: 'FLICK', d: 'one target at a time · 20 targets', T: 0 }, track: { n: 'TRACKING', d: 'stay on the strafing ball · 30 s', T: 30 } };
function aimMat() { return new THREE.MeshBasicMaterial({ color: 0x5dff7a }); }
function aimTarget(x, y, z, r = 0.32) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), aimMat()); m.position.set(x, y, z); scene.add(m); m.updateMatrixWorld(true); const t = { m, r }; AIM.tg.push(t); return t; }
function aimFront(dist, spreadX, spreadY) { const yaw = AIM.on.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw), ox = rnd(-spreadX, spreadX), oy = rnd(-spreadY, spreadY);
  return { x: P.x + fx * dist + rx * ox, y: P.y + 1.6 + oy, z: P.z + fz * dist + rz * ox }; }
function aimStart(k) {
  if (!M || M.mode !== 'range' || !AIM_DRILLS[k]) return false; aimStop(true);
  AIM.on = { k, yaw: P.yaw, t0: NOW }; AIM.hits = 0; AIM.shots0 = G.shots; AIM.t = AIM_DRILLS[k].T; AIM.react = []; AIM.onT = 0; AIM.tot = 0; AIM.n = 0;
  for (const e of enemies) if (e.dummy) e.group.visible = false;
  if (k === 'grid') for (let i = 0; i < 3; i++) aimSpawn();
  else aimSpawn();
  try { showBanner(AIM_DRILLS[k].n, AIM_DRILLS[k].d); sfx.ui(); } catch (e) {} aimHud(); return true;
}
function aimSpawn() {
  const k = AIM.on.k;
  if (k === 'grid') { const p = aimFront(12, 3, 1.4); aimTarget(p.x, p.y, p.z, 0.36); }
  else if (k === 'flick') { const p = aimFront(rnd(9, 16), 6, 2); aimTarget(p.x, Math.max(P.y + 0.5, p.y), p.z, 0.3); AIM.spawnAt = NOW; AIM.n++; }
  else { const p = aimFront(11, 0, 0); const t = aimTarget(p.x, p.y, p.z, 0.45); t.base = p; }
}
function aimStop(quiet) {
  for (const t of AIM.tg) { scene.remove(t.m); t.m.geometry.dispose(); } AIM.tg = [];
  for (const e of enemies) if (e.dummy) e.group.visible = true;
  const A = AIM.on; AIM.on = null; const h = $('aimHud'); if (h) h.remove(); if (!A || quiet) return null;
  const k = A.k; let score, txt;
  if (k === 'grid') { const shots = Math.max(1, G.shots - AIM.shots0); score = AIM.hits; txt = `${AIM.hits} HITS · ${Math.round(AIM.hits / shots * 100)}% ACCURACY`; }
  else if (k === 'flick') { const avg = AIM.react.length ? AIM.react.reduce((a, b) => a + b, 0) / AIM.react.length : 9; score = Math.round(10000 / Math.max(0.1, avg)); txt = `AVERAGE ${Math.round(avg * 1000)} MS`; }
  else { score = Math.round(AIM.onT / Math.max(0.1, AIM.tot) * 100); txt = `${score}% ON TARGET`; }
  PROG.aim = PROG.aim || {}; const best = score > (PROG.aim[k] | 0); if (best) { PROG.aim[k] = score; try { saveProg(); } catch (e) {} }
  try { showBanner(`${AIM_DRILLS[k].n} · ${txt}`, best ? 'NEW BEST' : `best: ${PROG.aim[k]}`); sfx.streak(); } catch (e) {}
  return { k, score, txt, best };
}
// shots: every new shot is a ray from the camera at the targets
function aimTick(dt) {
  if (!AIM.on) return; if (!M || M.mode !== 'range' || !inMatch()) { aimStop(true); return; }
  if (G.state !== 'playing') return;
  const k = AIM.on.k; AIM.ray.setFromCamera({ x: 0, y: 0 }, camera); AIM.ray.far = 60;
  if (G.shots !== AIM.lastShots) { const fired = G.shots > (AIM.lastShots == null ? G.shots : AIM.lastShots); AIM.lastShots = G.shots;
    if (fired && k !== 'track') { const hit = AIM.ray.intersectObjects(AIM.tg.map(t => t.m))[0]; if (hit) { const t = AIM.tg.find(q => q.m === hit.object); scene.remove(t.m); AIM.tg.splice(AIM.tg.indexOf(t), 1); AIM.hits++;
      try { sfx.hit(false); chunks('spark', hit.point, 6, 3, 0.3); } catch (e) {}
      if (k === 'flick') { AIM.react.push(NOW - AIM.spawnAt); if (AIM.n >= 20) return aimStop(); }
      aimSpawn(); } } }
  if (k === 'track') { const t = AIM.tg[0]; if (t) { const yaw = AIM.on.yaw, rx = Math.cos(yaw), rz = -Math.sin(yaw), o = Math.sin(NOW * 1.3) * 3.2 + Math.sin(NOW * 2.9) * 1.1; t.m.position.set(t.base.x + rx * o, t.base.y + Math.sin(NOW * 1.7) * 0.6, t.base.z + rz * o); t.m.updateMatrixWorld(true);
      const on = !!AIM.ray.intersectObject(t.m)[0]; AIM.tot += dt; if (on && (mouseDown || G.fireT > 0)) AIM.onT += dt; t.m.material.color.setHex(on ? 0xffd23a : 0x5dff7a); } }
  if (AIM.t > 0) { AIM.t -= dt; if (AIM.t <= 0) return aimStop(); }
  aimHud();
}
function aimHud() {
  if (!AIM.on) return; let h = $('aimHud'); if (!h) { h = document.createElement('div'); h.id = 'aimHud'; document.body.appendChild(h); }
  const k = AIM.on.k, best = (PROG.aim || {})[k] | 0;
  h.innerHTML = `<b>${AIM_DRILLS[k].n}</b><span>${k === 'grid' ? `${AIM.hits} HITS` : k === 'flick' ? `${AIM.n} / 20` : `${Math.round(AIM.onT / Math.max(0.1, AIM.tot) * 100)}% ON TARGET`}${AIM.t > 0 ? ` · ${Math.ceil(AIM.t)} s` : ''}</span><small>BEST ${best}</small>`;
}
// the pause menu: the drills, only in the firing range
function aimPauseButtons() {
  const side = $('pzSide'); if (!side) return; let box = $('aimPz');
  if (!M || M.mode !== 'range') { if (box) box.remove(); return; }
  if (!box) { box = document.createElement('div'); box.id = 'aimPz'; side.parentNode.insertBefore(box, side); }
  box.innerHTML = `<div class="aim-pz-h">AIM TRAINER</div>${Object.entries(AIM_DRILLS).map(([k, d]) => `<button class="btn" data-aim="${k}">${d.n}<small> · best ${((PROG.aim || {})[k]) | 0}</small></button>`).join('')}`;
  for (const b of box.querySelectorAll('[data-aim]')) b.onclick = () => { try { resumeGame(); } catch (e) {} aimStart(b.dataset.aim); };
}
// ---------- HUD EDITOR
const HUD_PARTS = [['radar', 'MINIMAP'], ['health', 'HEALTH'], ['ammo', 'AMMO'], ['feed', 'KILL FEED'], ['stkHud', 'SCORESTREAKS'], ['stats', 'SCORE'], ['mhud', 'MODE BAR']];
function hudApply() {
  const H = S.hud || {};
  for (const [id] of HUD_PARTS) { const el = $(id); if (!el) continue; const o = H[id]; el.style.translate = o ? `${o[0]}px ${o[1]}px` : ''; el.style.scale = o && o[2] && o[2] !== 1 ? String(o[2]) : ''; }
}
function hudEdit() {
  if ($('hudEd')) return; const hud = $('hud'); if (!hud) return; const wasHide = hud.classList.contains('hide'), backTo = curScreen; if (backTo) showScreen(null); hud.classList.remove('hide');
  S.hud = S.hud || {}; const o = document.createElement('div'); o.id = 'hudEd';
  o.innerHTML = `<div class="hud-ed-bar"><b>EDIT HUD</b><span>drag a box to move it · mouse wheel to resize</span><button class="btn" data-he="reset">RESET</button><button class="btn primary" data-he="done">DONE</button></div>`;
  document.body.appendChild(o);
  const boxes = [];
  const place = () => { const used = []; for (const b of boxes) { const r = b.el.getBoundingClientRect(), w = Math.max(130, r.width), h = Math.max(36, r.height); let x = clamp(r.left, 4, innerWidth - w - 4), y = clamp(r.top, 4, innerHeight - h - 4); while (used.some(u => Math.abs(u[0] - x) < 60 && Math.abs(u[1] - y) < 30)) y += 40; used.push([x, y]); Object.assign(b.d.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }); } };
  window.__hudPlace = place;
  for (const [id, n] of HUD_PARTS) { const el = $(id); if (!el) continue; const prevD = el.style.display; if (getComputedStyle(el).display === 'none') { el.style.display = 'block'; el.dataset.heShown = '1'; el.dataset.heDisp = prevD; }
    const d = document.createElement('div'); d.className = 'hud-ed-box'; d.textContent = n; o.appendChild(d); boxes.push({ id, el, d });
    d.onpointerdown = ev => { ev.preventDefault(); d.setPointerCapture(ev.pointerId); const c = S.hud[id] || [0, 0, 1], sx = ev.clientX, sy = ev.clientY, ox = c[0], oy = c[1];
      d.onpointermove = mv => { S.hud[id] = [Math.round(ox + mv.clientX - sx), Math.round(oy + mv.clientY - sy), c[2] || 1]; hudApply(); place(); };
      d.onpointerup = () => { d.onpointermove = null; saveSettings(); }; };
    d.onwheel = ev => { ev.preventDefault(); const c = S.hud[id] || [0, 0, 1]; S.hud[id] = [c[0], c[1], Math.max(0.5, Math.min(2, Math.round(((c[2] || 1) - Math.sign(ev.deltaY) * 0.1) * 10) / 10))]; hudApply(); place(); saveSettings(); };
  }
  place();
  o.querySelector('[data-he="reset"]').onclick = () => { S.hud = {}; saveSettings(); hudApply(); place(); try { sfx.ui(); } catch (e) {} };
  o.querySelector('[data-he="done"]').onclick = () => { for (const b of boxes) if (b.el.dataset.heShown) { b.el.style.display = b.el.dataset.heDisp || ''; delete b.el.dataset.heShown; } o.remove(); if (wasHide) hud.classList.add('hide'); saveSettings(); if (backTo) showScreen(backTo); try { sfx.ui(); } catch (e) {} };
}
setTimeout(() => { try { hudApply(); } catch (e) {} }, 0);
(() => {
  const s = document.createElement('style'); s.textContent = `#aimHud{position:fixed;left:50%;top:120px;transform:translateX(-50%);z-index:40;padding:6px 14px;background:rgba(8,12,10,.8);border:1px solid #5dff7a;text-align:center;pointer-events:none}#aimHud b{display:block;font-size:12px;letter-spacing:.3em;color:#5dff7a}#aimHud span{font-size:16px;color:#fff;letter-spacing:.1em}#aimHud small{display:block;font-size:9px;color:var(--dim);letter-spacing:.2em}
#aimPz{display:flex;flex-direction:column;gap:6px;margin-top:10px}.aim-pz-h{font-size:10px;letter-spacing:.3em;color:var(--accent)}#aimPz small{font-size:9px;color:var(--dim)}
#hudEd{position:fixed;inset:0;z-index:95;background:rgba(0,0,0,.35);pointer-events:auto}.hud-ed-bar{position:absolute;left:50%;top:44%;transform:translateX(-50%);display:flex;gap:12px;align-items:center;padding:10px 16px;background:rgba(8,12,10,.95);border:1px solid var(--accent)}.hud-ed-bar b{letter-spacing:.3em;color:var(--accent)}.hud-ed-bar span{font-size:11px;color:var(--dim)}
.hud-ed-box{position:fixed;border:2px dashed #5dff7a;background:rgba(93,255,122,.12);color:#5dff7a;font-size:10px;letter-spacing:.2em;display:flex;align-items:flex-start;justify-content:flex-start;padding:2px 4px;box-sizing:border-box;cursor:move;user-select:none}`;
  document.head.appendChild(s);
})();
