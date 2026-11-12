/* ================================================================== HOTBOX HORDE quality of life (1.2.110, the owner's list G = 53-60)
   53 MINIMAP: base pieces (grey), stations (gold), THE MOTHER PLANT (green) and every burnout (red, bosses bigger).
   54 WAVE PREVIEW: in a build phase the next wave is rolled early (H.nextQ, handed to hhStartWave by a hhWaveList wrapper)
      and shown as chips under the top bar.
   55 DAMAGE NUMBERS: brfight.js's numbers now show in HORDE too (setting LAST TOKE + HORDE).
   56 BUILD GHOST: the cost line turns red when you can't pay; in THE HOMESTEAD a ring shows the edge of the base.
   57 CUSTOM GAMES: lobby switch (s.cus): waves 3-10, burnout speed, starting materials (handed back at the end). Pays half,
      never sets a best or unlocks a difficulty.
   58 SAVE BACKUP: EXPORT / IMPORT the whole save as a DZH1- code (the old save is kept in ashfall.hh.bak).
   59 BIG BASES: finished pieces stop recomputing their matrices every frame; floors don't cast shadows.
   60 TYPE MARKERS: shape + colour badges (colour-blind safe) over each burnout and on every trap (s.marks; on by default
      when a colour filter is set). */
const HHQ = { ring: null, ringR: 0 };
/* ---------- 53 the minimap */
const _hhq53 = drawRadar;
drawRadar = function () {
  _hhq53.apply(this, arguments); const H = M && M.mode === 'hh' && M.hh; if (!H || !S.radar || (typeof stkJammed === 'function' && stkJammed())) return;
  try { const c = rctx, W = 140, R = 62, sc = R / 45, cs = Math.cos(P.yaw), sn = Math.sin(P.yaw);
    const pt = (x, z) => { const dx = x - P.x, dz = z - P.z, px = (dx * cs - dz * sn) * sc, py = (dx * sn + dz * cs) * sc; return Math.hypot(px, py) > R ? null : [W / 2 + px, W / 2 + py]; };
    c.fillStyle = 'rgba(210,210,210,.5)'; for (const p of H.pieces) { if (p.cx === undefined) continue; const q = pt(p.cx, p.cz); if (q) c.fillRect(q[0] - 1.5, q[1] - 1.5, 3, 3); }
    c.fillStyle = '#ffd24a'; for (const pr of H.props || []) { if (pr.k === 'plot' || pr.k === 'plant') continue; const q = pt(pr.x, pr.z); if (q) c.fillRect(q[0] - 2.5, q[1] - 2.5, 5, 5); }
    const pl = H.plant; if (pl) { const q = pt(pl.x, pl.z); if (q) { c.fillStyle = '#5aff7a'; c.beginPath(); c.arc(q[0], q[1], 4, 0, 7); c.fill(); } }
    for (const e of H.mobs) { const g = e.group.position, q = pt(g.x, g.z); if (!q) continue; const r = e.K && (e.K.boss || e.K.mini) ? 4 : 2; c.fillStyle = e.elite ? '#ff9a3a' : '#ff3b30'; c.fillRect(q[0] - r, q[1] - r, r * 2, r * 2); }
  } catch (e) {}
};
/* ---------- 54 the next wave, rolled early */
const _hhq54 = hhWaveList;
hhWaveList = function (w) { const H = M && M.hh; if (H && H.nextQ && H.nextQ.w === w) { const q = H.nextQ.q; H.nextQ = null; return q.slice(); } return _hhq54.apply(this, arguments); };
function hhqPreview(H) {
  let el = $('hhPrev'); const show = H && H.phase === 'prep' && !hhHunt(H.kind) && !H.client && H.wave < H.waves && G.state === 'playing';
  if (!show) { if (el) el.style.display = 'none'; return; }
  if (!H.nextQ || H.nextQ.w !== H.wave + 1) H.nextQ = { w: H.wave + 1, q: _hhq54(H.wave + 1) };
  if (!el) { el = document.createElement('div'); el.id = 'hhPrev'; ($('hud') || document.body).appendChild(el); }
  const n = {}; for (const k of H.nextQ.q) n[k] = (n[k] | 0) + 1; const key = JSON.stringify(n) + H.wave; el.style.display = '';
  if (el.dataset.k === key) return; el.dataset.k = key;
  el.innerHTML = `<small>WAVE ${H.wave + 1} · COMING</small>` + Object.entries(n).sort((a, b) => b[1] - a[1]).map(([k, c]) => `<span style="--c:${hhqCol(k)}">${hhqShape(k)} ${c} ${(HH_KINDS[k] || { n: k }).n}</span>`).join('');
}
/* ---------- 56 the ghost's cost and the base ring */
const _hhq56 = hhDomTick;
hhDomTick = function () {
  const r = _hhq56.apply(this, arguments), H = M && M.hh, m = $('hhMats'); if (!H || !m) return r;
  const c = m.querySelector('.hh-cost:not(.hh-keys):not(.hh-abil)'); if (c && HH.build) { const L = hhPieceList(), P0 = L[HH.piece] || L[0]; c.classList.toggle('hhq-no', !HH.carry && !!P0 && !hhCan(P0)); }
  return r;
};
function hhqRing(H) {
  const on = H.base && HH.build && !H.client; if (!on) { if (HHQ.ring) HHQ.ring.visible = false; return; }
  const R = (HH_BASELV[H.s.base.lv - 1].r + 0.5) * HH_C;
  if (!HHQ.ring || HHQ.ring.parent !== H.grp || HHQ.ringR !== R) {
    if (HHQ.ring && HHQ.ring.parent) HHQ.ring.parent.remove(HHQ.ring);
    const pts = []; for (let i = 0; i <= 4; i++) { const a = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]][i]; pts.push(new THREE.Vector3(H.org.x + a[0] * R, H.by + 0.06, H.org.z + a[1] * R)); }
    HHQ.ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0x9aff6a, dashSize: 0.8, gapSize: 0.5, transparent: true, opacity: 0.85 })); HHQ.ring.computeLineDistances(); H.grp.add(HHQ.ring); HHQ.ringR = R;
  }
  HHQ.ring.visible = true;
}
/* ---------- 57 custom games */
const hhqCus = s => (s.cus = Object.assign({ on: 0, waves: 5, speed: 1, mats: 0 }, s.cus));
const HHQ_WAVES = [3, 5, 8, 10], HHQ_SPEED = [0.8, 1, 1.25, 1.5], HHQ_MATS = [0, 100, 250, 500];
const _hhqSetup = hhSetup;
hhSetup = function () {
  const r = _hhqSetup.apply(this, arguments), H = M.hh; if (!H || H.base || H.client) return r; const c = hhqCus(H.s);
  if (c.on) { H.cus = { speed: c.speed, mats: c.mats, best: JSON.stringify(H.s.best[H.mi] || null), unl: H.s.unl[H.mi] }; H.D = Object.assign({}, H.D, { pay: H.D.pay * 0.5 }); if (!hhHunt(H.kind)) H.waves = c.waves;
    if (c.mats) for (const k of HH_MATS) H.s.inv[k] = (H.s.inv[k] | 0) + c.mats; }
  return r;
};
const _hhqMob = hhMob;
hhMob = function () { const e = _hhqMob.apply(this, arguments), H = M && M.hh; if (e && H && H.cus) e.speed *= H.cus.speed; if (e && hhqMarksOn()) hhqBadge(e); return e; };
const _hhqEnd = hhEnd;
hhEnd = function (won) {
  const H = M && M.hh, cu = H && !H.over && H.cus; if (cu && cu.mats) for (const k of HH_MATS) H.s.inv[k] = Math.max(0, (H.s.inv[k] | 0) - cu.mats);
  const r = _hhqEnd.apply(this, arguments);
  if (cu) { const b = JSON.parse(cu.best); if (b) H.s.best[H.mi] = b; else delete H.s.best[H.mi]; if (cu.unl === undefined) delete H.s.unl[H.mi]; else H.s.unl[H.mi] = cu.unl; hhSave(H.s); }
  return r;
};
/* ---------- 58 save backup */
function hhqExport() { const raw = localStorage.getItem('ashfall.hh.v1') || JSON.stringify(hhLoad()); return 'DZH1-' + btoa(unescape(encodeURIComponent(raw))); }
function hhqImport(code) {
  code = String(code || '').trim().replace(/\s+/g, ''); if (!code.startsWith('DZH1-')) return 'THAT IS NOT A HORDE SAVE CODE (THEY START WITH DZH1-)';
  let s; try { s = JSON.parse(decodeURIComponent(escape(atob(code.slice(5))))); } catch (e) { return 'THAT CODE IS BROKEN · COPY ALL OF IT'; }
  if (!s || typeof s !== 'object' || !s.inv || !s.base) return 'THAT CODE HAS NO HORDE SAVE IN IT';
  try { const old = localStorage.getItem('ashfall.hh.v1'); if (old) localStorage.setItem('ashfall.hh.bak', old); localStorage.setItem('ashfall.hh.v1', JSON.stringify(s)); } catch (e) { return 'COULD NOT SAVE IT'; }
  return '';
}
function hhqBackup() {
  const o = document.createElement('div'); o.className = 'onb-ov'; o.id = 'hhqBk'; const code = hhqExport();
  o.innerHTML = `<div class="onb-box hhq-bk"><small>HOTBOX HORDE</small><h2 style="margin:0">SAVE BACKUP</h2><span>Your whole HORDE save (base, money, seeds, gear) as a code. Keep it somewhere safe, or load it on another computer.</span>
<textarea id="hhqCode" spellcheck="false">${code}</textarea><small id="hhqMsg"></small>
<div class="onb-acts"><button class="btn" data-hq="copy">COPY CODE</button><button class="btn" data-hq="load">LOAD A CODE</button><button class="btn" data-close data-hq="x">CLOSE</button></div></div>`;
  document.body.appendChild(o); const ta = $('hhqCode'), msg = $('hhqMsg'); ta.onkeydown = e => e.stopPropagation();
  o.addEventListener('click', e => { const b = e.target.closest('[data-hq]'); if (!b) return; try { sfx.ui(); } catch (er) {} const a = b.dataset.hq;
    if (a === 'x') o.remove();
    else if (a === 'copy') { ta.select(); try { navigator.clipboard.writeText(ta.value); } catch (er) {} try { document.execCommand('copy'); } catch (er) {} msg.textContent = 'COPIED · ' + ta.value.length.toLocaleString() + ' CHARACTERS'; }
    else if (a === 'load') { if (ta.value.trim() === code) { msg.textContent = 'PASTE A CODE INTO THE BOX FIRST, THEN PRESS LOAD'; ta.value = ''; ta.focus(); return; } const err = hhqImport(ta.value); msg.textContent = err || 'LOADED · YOUR OLD SAVE IS KEPT AS A BACKUP'; if (!err) { setTimeout(() => { o.remove(); hhRender(); }, 700); } } });
  setTimeout(() => { try { o.querySelector('[data-hq="copy"]').focus(); } catch (e) {} }, 40);
}
/* ---------- 59 big bases: freeze finished pieces */
function hhqFreeze(H) {
  for (const p of H.pieces) { if (p.frozen || p.t < 1 || HH_TRAPS[p.id] || p.id === 'barricade') continue; if (p.meshes.some(m => m.userData.hhY !== undefined && Math.abs(m.scale.y - m.userData.hhY) > 1e-3)) continue;
    p.frozen = true; for (const m of p.meshes) { m.updateMatrix(); m.matrixAutoUpdate = false; if (p.id === 'floor' || p.id === 'plot') m.castShadow = false; } }
}
/* ---------- 60 type markers */
const HHQ_COL = { burnout: '#E69F00', sprinter: '#56B4E9', smasher: '#D55E00', spitter: '#009E73', drifter: '#CC79A7', bloater: '#F0E442', boss: '#ffffff', shield: '#0072B2', thrower: '#009E73', bigbaked: '#D55E00', cougher: '#F0E442', rootking: '#ffffff' };
const HHQ_SHAPE = { burnout: '●', sprinter: '▲', smasher: '■', spitter: '◆', drifter: '✦', bloater: '⬟', boss: '★', shield: '⬢', thrower: '▼', bigbaked: '■', cougher: '⬟', rootking: '★' };
const hhqCol = k => HHQ_COL[k] || '#E69F00', hhqShape = k => HHQ_SHAPE[k] || '●';
const hhqMarksOn = () => { try { const s = HH.cur ? HH.cur.s : hhLoad(); return s.marks === undefined ? S.cbFilter && S.cbFilter !== 'off' : !!s.marks; } catch (e) { return false; } };
const HHQ_TEX = {};
function hhqTex(sym, col) {
  const k = sym + col; if (HHQ_TEX[k]) return HHQ_TEX[k]; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.65)'; x.beginPath(); x.arc(32, 32, 30, 0, 7); x.fill(); x.lineWidth = 4; x.strokeStyle = col; x.stroke();
  x.fillStyle = col; x.font = 'bold 38px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(sym, 32, 34);
  return (HHQ_TEX[k] = new THREE.CanvasTexture(c));
}
function hhqBadge(e) {
  if (!e || !e.group || e.hhqB) return; const k = e.nest ? 'nest' : e.hk, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: hhqTex(e.nest ? '⊗' : hhqShape(k), e.nest ? '#CC79A7' : hhqCol(k)), depthTest: false, transparent: true }));
  const sc = e.group.scale.y || 1; sp.scale.setScalar(0.42 / sc); sp.position.y = (e.nest ? 2.4 : 2.25) / (e.nest ? 1 : 1); sp.renderOrder = 6; e.group.add(sp); e.hhqB = sp;
}
const HHQ_TRAPC = { spikes: ['▦', '#E69F00'], zapper: ['⚡', '#56B4E9'], resin: ['≈', '#F0E442'], launcher: ['⇧', '#D55E00'], chill: ['+', '#009E73'], pusher: ['»', '#CC79A7'], ceilzap: ['⚡', '#0072B2'], gas: ['☁', '#009E73'], turret: ['◎', '#ffffff'] };
function hhqTrapBadge(p) {
  const d = HHQ_TRAPC[p.id]; if (!d || !p.g || p.hhqB) return; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: hhqTex(d[0], d[1]), depthTest: false, transparent: true }));
  sp.scale.setScalar(0.55); sp.position.y = p.id === 'zapper' || p.id === 'turret' ? 2.6 : 0.9; sp.renderOrder = 6; p.g.add(sp); p.hhqB = sp;
}
function hhqMarksAll(on) { const H = M && M.hh; if (!H) return; for (const e of enemies) if (e.hhMob || e.nest) { if (on) hhqBadge(e); else if (e.hhqB) { e.hhqB.parent && e.hhqB.parent.remove(e.hhqB); e.hhqB = null; } } for (const p of H.pieces) { if (on) hhqTrapBadge(p); else if (p.hhqB) { p.hhqB.parent && p.hhqB.parent.remove(p.hhqB); p.hhqB = null; } } }
const _hhqPM = hhPieceMake;
hhPieceMake = function () { const p = _hhqPM.apply(this, arguments); if (p && HH_TRAPS[p.id] && hhqMarksOn()) hhqTrapBadge(p); return p; };
const _hhqNest = hhNestMake;
hhNestMake = function () { const e = _hhqNest.apply(this, arguments); if (e && hhqMarksOn()) hhqBadge(e); return e; };
/* ---------- every frame */
const _hhqTick = hhTick;
hhTick = function (dt) {
  const r = _hhqTick.apply(this, arguments), H = M && M.hh; if (!H) return r;
  try { hhqPreview(H); hhqRing(H); if ((HHQ.frT = (HHQ.frT || 0) - dt) <= 0) { HHQ.frT = 1; hhqFreeze(H); } } catch (e) {}
  return r;
};
const _hhqClr = hhClear;
hhClear = function () { const H0 = HH.cur; if (H0 && H0.cus && H0.cus.mats && !H0.over && !H0.cusBack) { H0.cusBack = 1; for (const k of HH_MATS) H0.s.inv[k] = Math.max(0, (H0.s.inv[k] | 0) - H0.cus.mats); } const r = _hhqClr.apply(this, arguments); HHQ.ring = null; const el = $('hhPrev'); if (el) el.remove(); return r; };
/* ---------- the lobby rows */
const _hhqRender = hhRender;
hhRender = function () {
  const r = _hhqRender.apply(this, arguments), sel = $('lobSel'); if (!sel || !HHL.on) return r; const s = hhLoad(), c = hhqCus(s), mk = hhqMarksOn();
  sel.insertAdjacentHTML('beforeend', `<div class="cod-row wide hhq-row"><small>CUSTOM GAME · ${c.on ? 'ON · PAYS HALF · NO RECORDS' : 'OFF'}</small><b>${c.on ? `${c.waves} WAVES · SPEED ×${c.speed} · +${c.mats} MATERIALS` : 'NORMAL MISSIONS'}</b><span>your own rules for missions</span><div class="arw"><button class="mini" data-act="hhq-cus">${c.on ? 'TURN OFF' : 'TURN ON'}</button>${c.on ? `<button class="mini" data-act="hhq-wav">WAVES</button><button class="mini" data-act="hhq-spd">SPEED</button><button class="mini" data-act="hhq-mat">MATERIALS</button>` : ''}</div></div>` +
    `<div class="cod-row hhq-row"><small>SAVE BACKUP</small><b>EXPORT / IMPORT</b><span>your whole HORDE save as a code</span><div class="arw"><button class="mini" data-act="hhq-bk">OPEN</button></div></div>` +
    `<div class="cod-row hhq-row"><small>TYPE MARKERS</small><b>${mk ? 'ON' : 'OFF'}</b><span>shape and colour badges on burnouts and traps</span><div class="arw"><button class="mini" data-act="hhq-mk">${mk ? 'TURN OFF' : 'TURN ON'}</button></div></div>`);
  return r;
};
const _hhqAct = hhAct;
hhAct = function (act) {
  if (!/^hhq-/.test(act) || !HHL.on) return _hhqAct.apply(this, arguments);
  const s = hhLoad(), c = hhqCus(s), cyc = (L, v) => L[(L.indexOf(v) + 1) % L.length];
  if (act === 'hhq-cus') c.on = c.on ? 0 : 1; else if (act === 'hhq-wav') c.waves = cyc(HHQ_WAVES, c.waves); else if (act === 'hhq-spd') c.speed = cyc(HHQ_SPEED, c.speed); else if (act === 'hhq-mat') c.mats = cyc(HHQ_MATS, c.mats);
  else if (act === 'hhq-mk') { s.marks = hhqMarksOn() ? 0 : 1; }
  else if (act === 'hhq-bk') { try { sfx.ui(); } catch (e) {} hhqBackup(); return true; }
  hhSave(s); try { sfx.ui(); } catch (e) {} hhRender(`[data-act="${act}"]`); return true;
};
(() => { const s = document.createElement('style'); s.textContent = `#hhPrev{position:fixed;top:126px;left:50%;transform:translateX(-50%);display:flex;gap:5px;flex-wrap:wrap;justify-content:center;max-width:620px;z-index:5;pointer-events:none}#hhPrev small{width:100%;text-align:center;font-size:9px;letter-spacing:.3em;color:#c8a0ff}#hhPrev span{font-size:10px;letter-spacing:.1em;padding:3px 8px;background:rgba(10,10,14,.7);border:1px solid var(--c);color:#fff}
#hhMats .hhq-no{color:#ff6a6a}
.hhq-bk textarea{width:100%;height:120px;background:rgba(0,0,0,.45);color:#cfe8c0;border:1px solid var(--line);font:11px/1.3 monospace;padding:8px;resize:vertical;word-break:break-all}`; document.head.appendChild(s); })();
