/* ================================================================== MAP EDITOR (1.2.86)
   CUSTOM > MAP EDITOR: draw your own map from above on a 1 m grid and play it against bots.
     WALL   - drag a line (it snaps straight, along x or z): a 3 m wall
     LOW    - click: waist-high cover (2 x 1)        TALL - click: a 2 x 2 pillar
     CRATE  - click: a wooden crate                  RAMP - click: a 2 m platform with a ramp up to it
     SPAWN A / SPAWN B - click: where each team starts   POINT - click: the hardpoint / the middle
     ERASE  - click anything to remove it
   SIZE 40 / 48 / 60 m, a LOOK (day, night, snow, dusk), five save slots, PLAY (TDM, FFA, KILL CONFIRMED, HARDPOINT,
   DOMINATION) and SHARE / PASTE CODE (DZM1-...) to swap maps with friends. Also
   ... online: pick MY MAP in a private match (the host sends the map code to everyone). Saved in ashfall.maps.v1. */
const ED_KEY = 'ashfall.maps.v1', ED_TOOLS = [['wall', 'WALL'], ['low', 'LOW'], ['tall', 'TALL'], ['crate', 'CRATE'], ['ramp', 'RAMP'], ['spawnA', 'SPAWN A'], ['spawnB', 'SPAWN B'], ['point', 'POINT'], ['erase', 'ERASE']];
const ED_LOOKS = {
  day: { n: 'DAY', floor: 'concrete', wall: 'brick', env: { top: 0x4a7ac8, horizon: 0xd8e0e8, fog: 0.006, sun: [30, 60, 20], sunCol: 0xfff0d8, sunI: 1.3, skySun: 0xffe8c0, hemiSky: 0xb8d0e8, hemiGround: 0x5a5a40, exposure: 1.1 } },
  night: { n: 'NIGHT', floor: 'asphalt', wall: 'bayTower', env: { top: 0x070b18, horizon: 0x26203a, fog: 0.012, sun: [40, 55, -30], sunCol: 0x9ab0e8, sunI: 0.85, skySun: 0x6a7aa8, hemiSky: 0x5a6a9a, hemiGround: 0x2a2018, exposure: 1.5 } },
  snow: { n: 'SNOW', floor: 'snow', wall: 'panel', env: { top: 0xb4c0cc, horizon: 0xe8eef4, fog: 0.009, sun: [-40, 45, 30], sunCol: 0xe8f0ff, sunI: 1.4, skySun: 0xe0e8f0, hemiSky: 0xd8e4f0, hemiGround: 0x9aa4ae, exposure: 1.05 } },
  dusk: { n: 'DUSK', floor: 'ground', wall: 'redBarn', env: { top: 0x3a4a8a, horizon: 0xff9a5a, fog: 0.007, sun: [-40, 22, -10], sunCol: 0xffb070, sunI: 1.1, skySun: 0xffa060, hemiGround: 0x5a4a40, hemiSky: 0xc0a0b0, exposure: 1.2 } },
};
const ED = { tool: 'wall', slot: 0, map: null, drag: null, mode: 'tdm' };
const edBlank = () => ({ name: 'MY MAP', size: 48, look: 'day', items: [], A: { x: 0, z: 20 }, B: { x: 0, z: -20 }, P: { x: 0, z: 0 } });
function edAll() { try { const a = JSON.parse(localStorage.getItem(ED_KEY) || 'null'); if (Array.isArray(a)) return a; } catch (e) {} return []; }
function edSave() { const a = edAll(); a[ED.slot] = ED.map; try { localStorage.setItem(ED_KEY, JSON.stringify(a)); } catch (e) {} }
function edLoad(i) { ED.slot = i; const a = edAll(); ED.map = a[i] ? Object.assign(edBlank(), a[i]) : edBlank(); if (!a[i]) ED.map.name = 'MY MAP ' + (i + 1); }
// ---------- the map from the drawing
const edH = s => s / 2 - 1;
function edBuildFrom(m) {
  const L = ED_LOOKS[m.look] || ED_LOOKS.day, H = m.size / 2;
  try { buildMap2Materials(); bayMaterials(); } catch (e) {}
  floorQuad(0, 0, m.size + 30, m.size + 30, 0, L.floor, 8);
  for (const [x, z, w, d] of [[0, -H - 0.2, m.size + 0.8, 0.4], [0, H + 0.2, m.size + 0.8, 0.4], [-H - 0.2, 0, 0.4, m.size + 0.8], [H + 0.2, 0, 0.4, m.size + 0.8]]) blk(x, z, w, d, 4, L.wall, { walk: false });
  for (const it of m.items) {
    if (it.t === 'wall') { const along = Math.abs(it.z1 - it.z0) < 0.01, len = Math.hypot(it.x1 - it.x0, it.z1 - it.z0); if (len < 0.5) continue; blk((it.x0 + it.x1) / 2, (it.z0 + it.z1) / 2, along ? len : 0.4, along ? 0.4 : len, 3, L.wall, { walk: false }); }
    else if (it.t === 'low') blk(it.x, it.z, it.r ? 1 : 2, it.r ? 2 : 1, 1.1, 'concrete', { walk: false });
    else if (it.t === 'tall') blk(it.x, it.z, 2, 2, 3, L.wall, { walk: false });
    else if (it.t === 'crate') crate(it.x, it.z, 1.2);
    else if (it.t === 'ramp') { blk(it.x, it.z, 3, 3, 2, 'concrete', { walk: true }); ramp(it.x, it.z + 1.5, 's', 2, 3.6, 2, 0); }
  }
  for (const [p, c] of [[m.A, 0x5ab8ff], [m.B, 0xff5a5a]]) { const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 24), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.position.set(p.x, 0.03, p.z); scene.add(r); }
  if (m.look === 'night') for (const p of [m.A, m.B, m.P]) lampLight(p.x, 4, p.z, 0xffd0a0, 0.8, 16);
}
function edDefine(m) {
  const H = edH(m.size), A = m.A, B = m.B, P = m.P, mid = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k });
  const side = (k) => { const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz) || 1; return { x: clamp(P.x - dz / L * k, -H + 2, H - 2), z: clamp(P.z + dx / L * k, -H + 2, H - 2) }; };
  const map = { id: 'edit_map', hidden: true, name: String(m.name || 'MY MAP').toUpperCase().slice(0, 24), place: 'Your own map', desc: 'A map you made in the editor.', play: [-H, H, -H, H], arena: Math.ceil(m.size / 2 + 6), build: () => edBuildFrom(m),
    env: Object.assign({}, (ED_LOOKS[m.look] || ED_LOOKS.day).env), grass: { count: 0 }, spawnMaxY: 2.5,
    layout: { spawn: [{ x: A.x, z: A.z }, { x: B.x, z: B.z }], hp: [{ x: P.x, z: P.z }, side(H * 0.5), side(-H * 0.5)], flags: [{ x: A.x, z: A.z }, { x: B.x, z: B.z }], sites: [Object.assign(side(H * 0.45), { n: 'A' }), Object.assign(side(-H * 0.45), { n: 'B' })] },
    menu: { x: P.x, z: P.z, r: 10, y: 2.2 }, navPts: [A, B, P, mid(A, P, 0.5), mid(B, P, 0.5)], views: [[A.x, 1.7, A.z, P.x, 1.2, P.z]] };
  map._code = edCode(m); MAPS.edit_map = map; if (!MAP_ORDER.includes('edit_map')) MAP_ORDER.push('edit_map'); return map;
}
function edPlay() {
  edSave(); edDefine(ED.map); if (curMap === 'edit_map') curMap = null; const o = $('edOv'); if (o) o.remove();
  const d = MODES[ED.mode]; startMatch(ED.mode, { map: 'edit_map', custom: true, perTeam: d && d.teams ? 4 : 0, players: 6 });
}
// ---------- ONLINE: a private match can be played on your map. The host sends the map's code with its state (every
// tenth update, it is a few hundred letters); everyone else builds the same map from it before they load it.
function edNetCode() { if (!MAPS.edit_map || curMap !== 'edit_map' || !MAPS.edit_map._code) return undefined; ED.netN = ((ED.netN | 0) + 1) % 10; return ED.netN === 0 ? MAPS.edit_map._code : undefined; }
function edNetGot(code) {
  if (!code || code === ED.netCode || code.length > 30000) return; const m = edUncode(code); if (!m) return; ED.netCode = code; edDefine(m);
  if (curMap === 'edit_map') curMap = null; setTimeout(() => { try { if (NET.on) netSwitchMap('edit_map'); } catch (e) {} }, 0);
}
// the private match MAP list gets your map (the one in the editor's current slot)
function edPrivOpt() { const a = edAll(), m = a[ED.slot] || a.find(Boolean); return m ? ['edit_map', 'MY MAP · ' + String(m.name || 'MY MAP').toUpperCase().slice(0, 18)] : null; }
function edPrivPick() { const a = edAll(), m = a[ED.slot] || a.find(Boolean); if (m) edDefine(Object.assign(edBlank(), m)); }
// ---------- share codes: DZM1- + base64 of the JSON, made compact
function edCode(m) { const c = { n: m.name, s: m.size, l: m.look, a: [m.A.x, m.A.z], b: [m.B.x, m.B.z], p: [m.P.x, m.P.z], i: m.items.map(it => it.t === 'wall' ? ['w', it.x0, it.z0, it.x1, it.z1] : [it.t[0] + (it.t === 'tall' ? 'a' : ''), it.x, it.z, it.r ? 1 : 0]) }; return 'DZM1-' + btoa(unescape(encodeURIComponent(JSON.stringify(c)))); }
function edUncode(s) {
  s = String(s || '').trim(); if (!s.startsWith('DZM1-')) return null; let c; try { c = JSON.parse(decodeURIComponent(escape(atob(s.slice(5))))); } catch (e) { return null; }
  const T = { w: 'wall', l: 'low', ta: 'tall', c: 'crate', r: 'ramp' }, num = v => clamp(+v || 0, -40, 40);
  const m = edBlank(); m.name = String(c.n || 'SHARED MAP').slice(0, 24); m.size = [40, 48, 60].includes(+c.s) ? +c.s : 48; m.look = ED_LOOKS[c.l] ? c.l : 'day';
  for (const k of ['a', 'b', 'p']) if (Array.isArray(c[k])) m[k === 'a' ? 'A' : k === 'b' ? 'B' : 'P'] = { x: num(c[k][0]), z: num(c[k][1]) };
  m.items = (Array.isArray(c.i) ? c.i : []).slice(0, 400).map(q => q[0] === 'w' ? { t: 'wall', x0: num(q[1]), z0: num(q[2]), x1: num(q[3]), z1: num(q[4]) } : T[q[0]] ? { t: T[q[0]], x: num(q[1]), z: num(q[2]), r: !!q[3] } : null).filter(Boolean);
  return m;
}
// ---------- the editor screen
function edOpen() {
  if (!ED.map) edLoad(0); let o = $('edOv'); if (o) o.remove(); o = document.createElement('div'); o.id = 'edOv'; document.body.appendChild(o); edRender();
}
function edRender() {
  const o = $('edOv'); if (!o) return; const m = ED.map, all = edAll();
  o.innerHTML = `<div class="ed-p"><div class="ed-top"><b>MAP EDITOR</b><input id="edName" maxlength="24" value="${String(m.name).replace(/"/g, '')}"><span>${m.items.length} pieces</span></div>
  <div class="ed-main"><canvas id="edCv" width="600" height="600"></canvas><div class="ed-side">
    <small>TOOL</small><div class="ed-g">${ED_TOOLS.map(([k, n]) => `<button class="p2-s${ED.tool === k ? ' on' : ''}" data-ed="tool:${k}"><b>${n}</b></button>`).join('')}</div>
    <small>SIZE</small><div class="ed-g">${[40, 48, 60].map(s => `<button class="p2-s${m.size === s ? ' on' : ''}" data-ed="size:${s}"><b>${s} M</b></button>`).join('')}</div>
    <small>LOOK</small><div class="ed-g">${Object.entries(ED_LOOKS).map(([k, L]) => `<button class="p2-s${m.look === k ? ' on' : ''}" data-ed="look:${k}"><b>${L.n}</b></button>`).join('')}</div>
    <small>SLOT</small><div class="ed-g">${[0, 1, 2, 3, 4].map(i => `<button class="p2-s${ED.slot === i ? ' on' : ''}" data-ed="slot:${i}"><b>${i + 1}${all[i] ? '' : ' ·'}</b></button>`).join('')}</div>
    <small>PLAY AS</small><div class="ed-g">${['tdm', 'ffa', 'kc', 'hp', 'dom'].filter(k => MODES[k]).map(k => `<button class="p2-s${ED.mode === k ? ' on' : ''}" data-ed="mode:${k}"><b>${MODES[k].short}</b></button>`).join('')}</div>
    <div class="ed-g ed-a"><button class="btn" data-ed="share">SHARE CODE</button><button class="btn" data-ed="paste">PASTE CODE</button><button class="btn" data-ed="clear">CLEAR</button></div>
    <div class="ed-g ed-a"><button class="btn" data-ed="x">CLOSE</button><button class="btn primary" data-ed="play">PLAY IT</button></div>
    <p class="ed-tip">drag for walls · click for the rest · right-click to rotate low cover</p></div></div></div>`;
  const nm = $('edName'); nm.onkeydown = e => e.stopPropagation(); nm.oninput = () => { m.name = nm.value; edSave(); };
  for (const b of o.querySelectorAll('[data-ed]')) b.onclick = () => { const [k, v] = b.dataset.ed.split(':'); try { sfx.ui(); } catch (e) {}
    if (k === 'tool') ED.tool = v; else if (k === 'size') { m.size = +v; edClampAll(); } else if (k === 'look') m.look = v; else if (k === 'slot') { edSave(); edLoad(+v); } else if (k === 'mode') ED.mode = v;
    else if (k === 'clear') { m.items = []; } else if (k === 'x') { edSave(); o.remove(); return; } else if (k === 'play') return edPlay();
    else if (k === 'share') { const c = edCode(m); try { navigator.clipboard && navigator.clipboard.writeText(c); } catch (e) {} try { toast2('MAP CODE COPIED · ' + c.length + ' letters'); } catch (e) {} }
    else if (k === 'paste') { lcBox(`<small>MAP EDITOR</small><b>PASTE A MAP</b><p>Paste a friend's map code (DZM1-…). It goes in slot ${ED.slot + 1}.</p><input class="lc-in" placeholder="DZM1-..." maxlength="20000"><div class="lc-err"></div><div class="onb-acts"><button class="btn primary" data-lc="go">LOAD THIS MAP</button><button class="btn" data-lc="no">CANCEL</button></div>`, (bx, close) => {
        const i = bx.querySelector('input'); const go = () => { const n = edUncode(i.value); if (!n) { bx.querySelector('.lc-err').textContent = 'That is not a map code.'; return; } close(); ED.map = n; edSave(); edRender(); try { toast2('MAP LOADED · ' + n.name); } catch (e) {} };
        i.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') go(); }; setTimeout(() => i.focus(), 50); bx.querySelector('[data-lc="go"]').onclick = go; bx.querySelector('[data-lc="no"]').onclick = close; }); return; }
    edSave(); edRender(); };
  edWireCanvas(); edDraw();
}
function edClampAll() { const H = edH(ED.map.size), c = v => clamp(v, -H, H); for (const it of ED.map.items) { for (const k of ['x', 'z', 'x0', 'z0', 'x1', 'z1']) if (it[k] !== undefined) it[k] = c(it[k]); } for (const k of ['A', 'B', 'P']) { ED.map[k].x = c(ED.map[k].x); ED.map[k].z = c(ED.map[k].z); } }
const edToWorld = (cv, e) => { const r = cv.getBoundingClientRect(), s = ED.map.size, k = s / r.width; return { x: Math.round((e.clientX - r.left) * k - s / 2), z: Math.round((e.clientY - r.top) * k - s / 2) }; };
function edWireCanvas() {
  const cv = $('edCv'); if (!cv) return; const m = ED.map, H = edH(m.size), cl = p => ({ x: clamp(p.x, -H, H), z: clamp(p.z, -H, H) });
  cv.oncontextmenu = e => { e.preventDefault(); const p = cl(edToWorld(cv, e)); const it = m.items.find(q => q.t === 'low' && Math.hypot(q.x - p.x, q.z - p.z) < 1.5); if (it) { it.r = !it.r; edSave(); edDraw(); } };
  cv.onpointerdown = e => { if (e.button !== 0) return; const p = cl(edToWorld(cv, e)); const t = ED.tool;
    if (t === 'wall') { ED.drag = { a: p, b: p }; cv.setPointerCapture(e.pointerId); return; }
    if (t === 'erase') { let best = -1, bd = 1.6; m.items.forEach((q, i) => { const d = q.t === 'wall' ? edSegDist(p, q) : Math.hypot(q.x - p.x, q.z - p.z); if (d < bd) { bd = d; best = i; } }); if (best >= 0) m.items.splice(best, 1); }
    else if (t === 'spawnA') m.A = p; else if (t === 'spawnB') m.B = p; else if (t === 'point') m.P = p;
    else if (m.items.length < 400) m.items.push({ t, x: p.x, z: p.z, r: false });
    edSave(); edDraw(); };
  cv.onpointermove = e => { if (!ED.drag) return; const p = cl(edToWorld(cv, e)), a = ED.drag.a; ED.drag.b = Math.abs(p.x - a.x) >= Math.abs(p.z - a.z) ? { x: p.x, z: a.z } : { x: a.x, z: p.z }; edDraw(); };
  cv.onpointerup = () => { const D = ED.drag; ED.drag = null; if (D && Math.hypot(D.b.x - D.a.x, D.b.z - D.a.z) >= 1 && m.items.length < 400) { m.items.push({ t: 'wall', x0: D.a.x, z0: D.a.z, x1: D.b.x, z1: D.b.z }); edSave(); } edRender(); };
}
function edSegDist(p, w) { const dx = w.x1 - w.x0, dz = w.z1 - w.z0, L2 = dx * dx + dz * dz || 1, t = clamp(((p.x - w.x0) * dx + (p.z - w.z0) * dz) / L2, 0, 1); return Math.hypot(p.x - (w.x0 + t * dx), p.z - (w.z0 + t * dz)); }
function edDraw() {
  const cv = $('edCv'); if (!cv) return; const g = cv.getContext('2d'), m = ED.map, W = cv.width, k = W / m.size, X = x => (x + m.size / 2) * k, Z = z => (z + m.size / 2) * k;
  g.fillStyle = { day: '#2a2e2a', night: '#0e1018', snow: '#c8d0d8', dusk: '#3a2a24' }[m.look] || '#2a2e2a'; g.fillRect(0, 0, W, W);
  g.strokeStyle = m.look === 'snow' ? 'rgba(0,0,0,.1)' : 'rgba(255,255,255,.06)'; g.lineWidth = 1; for (let i = 0; i <= m.size; i++) { g.beginPath(); g.moveTo(i * k, 0); g.lineTo(i * k, W); g.moveTo(0, i * k); g.lineTo(W, i * k); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i <= m.size; i += 4) { g.beginPath(); g.moveTo(i * k, 0); g.lineTo(i * k, W); g.moveTo(0, i * k); g.lineTo(W, i * k); g.stroke(); }
  const box = (x, z, w, d, c) => { g.fillStyle = c; g.fillRect(X(x - w / 2), Z(z - d / 2), w * k, d * k); };
  for (const it of m.items) {
    if (it.t === 'wall') { g.strokeStyle = '#d8a070'; g.lineWidth = Math.max(3, 0.4 * k); g.beginPath(); g.moveTo(X(it.x0), Z(it.z0)); g.lineTo(X(it.x1), Z(it.z1)); g.stroke(); }
    else if (it.t === 'low') box(it.x, it.z, it.r ? 1 : 2, it.r ? 2 : 1, '#8a9a8a'); else if (it.t === 'tall') box(it.x, it.z, 2, 2, '#c87a50'); else if (it.t === 'crate') box(it.x, it.z, 1.2, 1.2, '#a07a40');
    else if (it.t === 'ramp') { box(it.x, it.z, 3, 3, '#7a8aa0'); g.fillStyle = '#5a6a80'; g.fillRect(X(it.x - 1), Z(it.z + 1.5), 2 * k, 3.6 * k); }
  }
  if (ED.drag) { g.strokeStyle = '#ffd23a'; g.lineWidth = Math.max(3, 0.4 * k); g.beginPath(); g.moveTo(X(ED.drag.a.x), Z(ED.drag.a.z)); g.lineTo(X(ED.drag.b.x), Z(ED.drag.b.z)); g.stroke(); }
  if (ED.padCur && document.body.classList.contains('padnav')) { g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(X(Math.round(ED.padCur.x)) - k * 0.6, Z(Math.round(ED.padCur.z)) - k * 0.6, k * 1.2, k * 1.2); }   // the controller's cursor
  for (const [p, c, t] of [[m.A, '#5ab8ff', 'A'], [m.B, '#ff5a5a', 'B'], [m.P, '#ffd23a', '◆']]) { g.fillStyle = c; g.beginPath(); g.arc(X(p.x), Z(p.z), 0.9 * k, 0, TAU); g.fill(); g.fillStyle = '#000'; g.font = `bold ${Math.round(k)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, X(p.x), Z(p.z)); }
}
(() => { const s = document.createElement('style'); s.textContent = `#edOv{position:fixed;inset:0;z-index:92;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;pointer-events:auto}
.ed-p{padding:14px 18px;background:rgba(10,13,12,.97);border:1px solid var(--line);max-width:96vw}.ed-top{display:flex;gap:12px;align-items:center;margin-bottom:10px}.ed-top b{letter-spacing:.3em;color:var(--accent)}.ed-top input{flex:1;padding:6px 8px;background:#0b0e0d;border:1px solid var(--line);color:#fff;font:inherit;letter-spacing:.12em}.ed-top span{font-size:10px;color:var(--dim)}
.ed-main{display:flex;gap:14px}#edCv{width:min(600px,62vh);height:min(600px,62vh);border:1px solid var(--line);cursor:crosshair;touch-action:none}.ed-side{width:300px;display:flex;flex-direction:column;gap:5px;text-align:left}.ed-side small{font-size:9px;letter-spacing:.25em;color:var(--dim);margin-top:4px}.ed-g{display:flex;flex-wrap:wrap;gap:4px}.ed-a{margin-top:8px}.ed-a .btn{flex:1;padding:7px 8px;font-size:11px;min-width:0}.ed-tip{font-size:10px;color:var(--dim)}`; document.head.appendChild(s); })();
