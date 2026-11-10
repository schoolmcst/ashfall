/* ================================================================== THE MAP (1.2.90): M on the keyboard, D-pad down on a controller
   A full-screen map of the island: the hills shaded, the roads, every building, the names of the places, where you are
   and which way you face, your squad, the pings, the cloud (now, and where it closes next), supply drops and vehicles.
   Click (or move the cursor with the left stick and press A) to put a waypoint there - your squad sees it too.
   Esc / M / B closes it. In LAST TOKE, walking into a named place shows its name. */
const MAPV = { open: false, base: null, baseKey: '', cur: { x: 0, z: 0 }, hoverOk: false, timer: null, poi: '', poiT: 0 };
const mapPois = () => curMap === 'stashisle' && typeof STASH_POIS !== 'undefined' ? STASH_POIS.filter(p => p.name) : ((MAPS[curMap] && MAPS[curMap].pois) || []);
function mapRect() { return (MAPS[curMap] && MAPS[curMap].play) || PLAYRECT; }
// the picture of the land (made once per map): height colours, hill shading, roads, buildings
function mapBase() {
  const key = curMap + ':' + (TERR.on ? 't' : 'f') + ':' + boxes.length; if (MAPV.base && MAPV.baseKey === key) return MAPV.base;
  const N = 720, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), img = g.createImageData(N, N), pr = mapRect();
  const W = pr[1] - pr[0], D = pr[3] - pr[2], road = curMap === 'stashisle' && typeof stashRoad === 'function' ? stashRoad : null;
  for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
    const x = pr[0] + (px + 0.5) / N * W, z = pr[2] + (py + 0.5) / N * D, h = TH(x, z), i = (py * N + px) * 4;
    let r, gg, b;
    if (TERR.on && h < 0.25) { r = 40; gg = 110; b = 140; }
    else if (TERR.on && h < 1.6) { r = 205; gg = 190; b = 140; }
    else { const k = Math.min(1, h / 28); r = 70 + k * 90; gg = 105 + k * 40; b = 55 + k * 55; }
    if (TERR.on) { const sx = TH(x + 1.5, z) - TH(x - 1.5, z), sz = TH(x, z + 1.5) - TH(x, z - 1.5), shade = clamp(1 - (sx * 0.6 + sz * 0.6) * 0.18, 0.55, 1.35); r *= shade; gg *= shade; b *= shade;
      if (Math.hypot(sx, sz) / 3 > 0.7) { r = r * 0.6 + 60; gg = gg * 0.6 + 55; b = b * 0.6 + 52; } }
    if (road && road(x, z) && h > 0.3) { r = 64; gg = 64; b = 66; }
    img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // buildings and walls: anything tall that stands on the ground, seen from above
  g.fillStyle = 'rgba(28,30,34,0.85)';
  for (const b of boxes) { if (b.top - b.bot < 1.6 || (b.maxx - b.minx) * (b.maxz - b.minz) > 4000) continue; const x0 = (b.minx - pr[0]) / W * N, z0 = (b.minz - pr[2]) / D * N, w = (b.maxx - b.minx) / W * N, d = (b.maxz - b.minz) / D * N; if (x0 + w < 0 || z0 + d < 0 || x0 > N || z0 > N) continue; g.fillRect(x0, z0, Math.max(1, w), Math.max(1, d)); }
  MAPV.base = c; MAPV.baseKey = key; return c;
}
function mapOpen() {
  if (MAPV.open || !M || !inMatch()) return; MAPV.open = true; MAPV.cur = { x: P.x, z: P.z }; G.menuOpen = true;
  try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  let o = $('mapOv'); if (o) o.remove(); o = document.createElement('div'); o.id = 'mapOv';
  o.innerHTML = `<div class="mp-box"><canvas id="mapCv" width="900" height="900"></canvas><div class="mp-side"><b>${(MAPS[curMap] && MAPS[curMap].name) || 'MAP'}</b><span id="mapInfo"></span><small>click or A: set a waypoint · ${usingPad() ? 'D-PAD DOWN' : actName('map')} / Esc / B: close</small><div class="mp-key"><i style="background:#ffd23a"></i>YOU <i style="background:#5ac8ff"></i>SQUAD <i style="background:#ffffff"></i>CLOUD <i style="background:#ff4a3a"></i>SUPPLY DROP <i style="background:#5dff7a"></i>WAYPOINT</div></div></div>`;
  document.body.appendChild(o);
  const cv = $('mapCv');
  cv.onmousemove = e => { const p = mapFromScreen(cv, e); MAPV.cur = p; };
  cv.onclick = e => { const p = mapFromScreen(cv, e); mapWaypoint(p.x, p.z); };
  o.addEventListener('contextmenu', e => e.preventDefault());
  MAPV.key = e => { if (e.code === 'Escape' || e.code === bind('map')) { e.preventDefault(); e.stopPropagation(); mapClose(); } }; addEventListener('keydown', MAPV.key, true);
  clearInterval(MAPV.timer); MAPV.timer = setInterval(() => { try { mapDraw(); } catch (e) {} }, 100); mapDraw();
  try { sfx.ui(); } catch (e) {}
}
function mapClose() {
  if (!MAPV.open) return; MAPV.open = false; G.menuOpen = false; clearInterval(MAPV.timer); const o = $('mapOv'); if (o) o.remove();
  if (MAPV.key) removeEventListener('keydown', MAPV.key, true); MAPV.key = null;
  try { if (G.state === 'playing') lockPointer(); } catch (e) {}
}
const mapToggle = () => MAPV.open ? mapClose() : mapOpen();
function mapFromScreen(cv, e) { const r = cv.getBoundingClientRect(), pr = mapRect(); return { x: pr[0] + (e.clientX - r.left) / r.width * (pr[1] - pr[0]), z: pr[2] + (e.clientY - r.top) / r.height * (pr[3] - pr[2]) }; }
function mapWaypoint(x, z) {
  const y = groundAt(x, z, 999), p = pingAdd({ kind: 'go', x, y, z }, 'me'); if (!p) return;
  PING.seq++; PING.out = { seq: PING.seq, k: PING_ORDER.indexOf('go'), x, y, z, until: NOW + 6 };
  try { sfx.ui(); } catch (e) {}
}
function mapDraw() {
  const cv = $('mapCv'); if (!cv) return; const g = cv.getContext('2d'), N = cv.width, pr = mapRect(), W = pr[1] - pr[0], D = pr[3] - pr[2];
  const X = x => (x - pr[0]) / W * N, Z = z => (z - pr[2]) / D * N;
  g.drawImage(mapBase(), 0, 0, N, N);
  // the cloud: outside it shaded purple, the next circle dashed
  const B = M && M.br;
  if (B && B.r) {
    g.save(); g.fillStyle = 'rgba(120,40,200,0.28)'; g.beginPath(); g.rect(0, 0, N, N); g.arc(X(B.cx), Z(B.cz), B.r / W * N, 0, TAU, true); g.fill('evenodd'); g.restore();
    g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.arc(X(B.cx), Z(B.cz), B.r / W * N, 0, TAU); g.stroke();
    if (B.to) { g.setLineDash([8, 6]); g.beginPath(); g.arc(X(B.to.x), Z(B.to.z), B.to.r / W * N, 0, TAU); g.stroke(); g.setLineDash([]); }
    for (const c of B.crates) if (!c.open && c.tier >= 3) { g.fillStyle = '#ff4a3a'; g.fillRect(X(c.x) - 5, Z(c.z) - 5, 10, 10); }
  }
  // the names of the places
  g.textAlign = 'center'; g.textBaseline = 'middle';
  { const placed = [], W0 = g.canvas.width; g.font = 'bold 15px sans-serif';   // names: kept inside the picture, nudged apart when two would overlap
    for (const p of mapPois()) { const w = g.measureText(p.name).width, al = g.textAlign || 'start', cx = al === 'center' ? 0 : w / 2; let x = clamp(X(p.x) + cx, w / 2 + 6, W0 - w / 2 - 6) - cx, y = clamp(Z(p.z), 18, W0 - 8);
      for (let k = 0; k < 6 && placed.some(q => Math.abs(q.x - (x + cx)) < (q.w + w) / 2 + 4 && Math.abs(q.y - y) < 17); k++) y += 18;
      placed.push({ x: x + cx, y, w }); g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(p.name, x, y); g.fillStyle = '#ffffff'; g.fillText(p.name, x, y); } }
  // vehicles, pings, the squad, me
  try { for (const v of VH.list) if (!v.dead) { g.fillStyle = '#d8d8d8'; g.fillRect(X(v.x) - 3, Z(v.z) - 3, 6, 6); } } catch (e) {}
  try { for (const p of PING.list) { g.fillStyle = p.kind === 'enemy' ? '#ff4a3a' : '#5dff7a'; g.beginPath(); g.arc(X(p.x), Z(p.z), 6, 0, TAU); g.fill(); } } catch (e) {}
  try { if (typeof BRF !== 'undefined' && BRF.float && BRF.land) { g.strokeStyle = '#8fff6a'; g.lineWidth = 3; g.beginPath(); g.arc(X(BRF.land.x), Z(BRF.land.z), 9, 0, TAU); g.stroke(); g.fillStyle = '#8fff6a'; g.font = 'bold 12px sans-serif'; g.fillText('LANDING', X(BRF.land.x), Z(BRF.land.z) - 16); } } catch (e) {}   // the float in (brprog.js)
  try { const kl = typeof BRP !== 'undefined' && BRP.kl; if (kl && !kl.isPlayer && kl.bot && kl.bot.group) { const q = kl.bot.group.position; g.fillStyle = '#ff4a3a'; g.beginPath(); g.arc(X(q.x), Z(q.z), 7, 0, TAU); g.fill(); g.fillText('KILL LEADER', X(q.x), Z(q.z) - 14); } } catch (e) {}
  for (const e of enemies) if (e.group && typeof isFriend === 'function' && isFriend(e) && (!e.entry || e.entry.alive !== false)) { g.fillStyle = '#5ac8ff'; g.beginPath(); g.arc(X(e.group.position.x), Z(e.group.position.z), 5, 0, TAU); g.fill(); }
  const px = X(P.x), pz = Z(P.z), fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
  g.fillStyle = '#ffd23a'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.moveTo(px + fx * 12, pz + fz * 12); g.lineTo(px - fz * 7 - fx * 6, pz + fx * 7 - fz * 6); g.lineTo(px + fz * 7 - fx * 6, pz - fx * 7 - fz * 6); g.closePath(); g.fill(); g.stroke();
  // the cursor (the controller moves it; the mouse just hovers)
  const cx = X(MAPV.cur.x), cz = Z(MAPV.cur.z); g.strokeStyle = '#5dff7a'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 10, cz); g.lineTo(cx + 10, cz); g.moveTo(cx, cz - 10); g.lineTo(cx, cz + 10); g.stroke();
  const info = $('mapInfo'); if (info) { const here = mapPoiAt(P.x, P.z), d = Math.round(Math.hypot(MAPV.cur.x - P.x, MAPV.cur.z - P.z)); info.innerHTML = `${here ? `you are at <b>${here.name}</b>` : 'out in the open'}${B && B.r ? ` · ${Math.round(Math.max(0, Math.hypot(P.x - B.cx, P.z - B.cz) - B.r))} m to the cloud's edge` : ''}<br>cursor: ${d} m away${mapPoiAt(MAPV.cur.x, MAPV.cur.z) ? ' · ' + mapPoiAt(MAPV.cur.x, MAPV.cur.z).name : ''}`; }
}
function mapPoiAt(x, z) { for (const p of mapPois()) if (Math.abs(x - p.x) < p.w / 2 && Math.abs(z - p.z) < p.d / 2) return p; return null; }
// the controller on the map: the left stick moves the cursor, A sets a waypoint, B closes
function mapPad(dt, mx, my, press) {
  if (!MAPV.open) return false; const pr = mapRect(), sp = (pr[1] - pr[0]) * 0.55 * dt;
  MAPV.cur.x = clamp(MAPV.cur.x + mx * sp, pr[0], pr[1]); MAPV.cur.z = clamp(MAPV.cur.z + my * sp, pr[2], pr[3]);
  if (press(0)) mapWaypoint(MAPV.cur.x, MAPV.cur.z);
  if (press(1) || press(13) || press(9)) mapClose();
  return true;
}
// walking into a named place (LAST TOKE)
function mapPoiTick() {
  if (!M || !M.br || !inMatch() || G.state !== 'playing') return; if (NOW < MAPV.poiT) return; MAPV.poiT = NOW + 0.5;
  const p = mapPoiAt(P.x, P.z), id = p ? p.id : '';
  if (id !== MAPV.poi) { MAPV.poi = id; if (p) try { showBanner(p.name, (MAPS[curMap] && MAPS[curMap].name) || ''); } catch (e) {} }
}
setInterval(() => { try { mapPoiTick(); if (MAPV.open && (!M || !inMatch() || (G.state !== 'playing' && G.state !== 'paused'))) mapClose(); } catch (e) {} }, 250);
(() => { const s = document.createElement('style'); s.textContent = `#mapOv{position:fixed;inset:0;z-index:85;background:rgba(4,6,8,.78);display:flex;align-items:center;justify-content:center;pointer-events:auto}
.mp-box{display:flex;gap:16px;align-items:flex-start}#mapCv{width:min(86vh,62vw);height:min(86vh,62vw);border:1px solid var(--line);cursor:crosshair;image-rendering:auto}
.mp-side{width:240px;text-align:left;display:flex;flex-direction:column;gap:8px}.mp-side b{font-size:16px;letter-spacing:.24em;color:var(--accent)}.mp-side span{font-size:12px;color:#ddd;line-height:1.5}.mp-side small{font-size:10px;color:var(--dim);letter-spacing:.1em}
.mp-key{font-size:10px;letter-spacing:.12em;color:var(--dim);line-height:2}.mp-key i{display:inline-block;width:10px;height:10px;margin:0 5px 0 8px;vertical-align:middle;border-radius:50%}`; document.head.appendChild(s); })();
