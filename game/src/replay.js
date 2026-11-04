/* ================================================================== replay: rewatch your last match
   While a match runs we record every soldier 5 times a second (position, facing, alive) plus the kill feed and the
   team score. When it ends we take a top-down picture of the map, and the whole thing is saved (IndexedDB), so the
   REPLAY tab in the main menu can play it back on a tactical map: trails, death markers, kill feed, timeline,
   speed and a camera that can follow you. */
const RP_HZ = 5, RP_MAX = 15 * 60 * RP_HZ, RP_KEY = 'dz_replay', RP_EXT = 46;
let REC = null, RPLAST = null;
const RV = { on: false, t: 0, play: true, speed: 1, follow: false, fid: -1, heat: false, heatPts: null, img: null, lastT: 0, raf: 0, in: -1, out: -1, latest: null };
// REPLAY THEATRE (1.2.68): the last 10 matches and up to 20 saved clips live in IndexedDB next to the last match
const RP_LIB = { matches: [], clips: [] };
sbGet('replays').then(a => { if (Array.isArray(a)) RP_LIB.matches = a; }); sbGet('clips').then(a => { if (Array.isArray(a)) RP_LIB.clips = a; });
function rpLibAdd(R) { RP_LIB.matches = [R].concat(RP_LIB.matches.filter(m => m.date !== R.date)).slice(0, 10); sbPut('replays', RP_LIB.matches); }
// the last replay lives in IndexedDB (see savebak.js); older versions kept it in localStorage, moved over once
sbGet('replay').then(r => { if (r && r.frames && !RPLAST) RPLAST = r; });
try { const old = localStorage.getItem(RP_KEY); if (old) { const o = JSON.parse(old); localStorage.removeItem(RP_KEY); if (o && o.frames) sbGet('replay').then(r => { if (!r) { sbPut('replay', o); if (!RPLAST) RPLAST = o; } }); } } catch (e) {}

/* ---------- recording */
function rpStart() {
  if (G.bench) return;
  REC = { v: 1, map: curMap, mode: M.mode, name: M.def ? M.def.name.replace(/^ONLINE /, '') : '', online: !!M.online, teams: !!(M.def && M.def.teams),
    date: Date.now(), ents: [], ids: new WeakMap(), frames: [], feed: [], score: [], acc: 0, t: 0, obj: rpObjectives() };
}
function rpObjectives() {
  const L = LAYOUT || {}, m = M.mode, o = [];
  if (m === 'hp' && L.hp) L.hp.forEach((h, i) => o.push([+h.x.toFixed(1), +h.z.toFixed(1), 'H' + (i + 1)]));
  if (m === 'ctf' && L.flags) L.flags.slice(0, 2).forEach((h, i) => o.push([+h.x.toFixed(1), +h.z.toFixed(1), i ? 'B' : 'A', i]));
  if (m === 'snd' && L.sites) L.sites.forEach((h, i) => o.push([+h.x.toFixed(1), +h.z.toFixed(1), i ? 'B' : 'A']));
  return o;
}
function rpId(key, name, rel, me) {
  let id = REC.ids.get(key);
  if (id === undefined) { id = REC.ents.length; REC.ids.set(key, id); REC.ents.push({ n: String(name || '?').slice(0, 16), r: rel, me: me ? 1 : 0 }); }
  return id;
}
function rpTick(dt) {
  if (!REC && M && M.def && G.state === 'playing' && !G.bench) rpStart();   // any match that started without the usual start screen still records
  if (!REC || !M || M.over || G.state === 'menu' || G.state === 'plobby' || G.state === 'over') return;
  // map picture once, while the loading screen still covers the hitch
  if (!REC.planTried && REC.t > 0.3 && RP_PLAN[curMap]) { REC.planTried = true; REC.plan = RP_PLAN[curMap]; }   // the picture itself is taken when the match ends
  // keep a copy saved as the match goes, so quitting mid-match (or closing the game) still leaves a replay
  REC.saveT = (REC.saveT || 0) + dt; if (REC.saveT > 30 && REC.frames.length >= RP_HZ * 5) { REC.saveT = 0; RPLAST = rpPack(0, true); sbPut('replay', RPLAST); }
  REC.t += dt; REC.acc += dt; if (REC.acc < 1 / RP_HZ || REC.frames.length >= RP_MAX) return;
  REC.acc = 0;
  const f = [Math.round(REC.t * 10)], q = v => Math.round(v * 10), hd = h => Math.round((((h % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) * 28);
  const meAlive = G.state === 'playing' || G.state === 'paused';
  f.push([rpId(P, (M.me && M.me.name) || 'YOU', 0, true), q(P.x), q(P.z), hd(P.yaw + Math.PI), meAlive ? 1 : 0]);
  for (const e of enemies) {
    if (!e.group) continue;
    const rel = REC.teams ? (e.team === M.myTeam ? 0 : 1) : 1;
    f.push([rpId(e.entry || e, e.name || (e.type || 'enemy').toUpperCase(), rel, false), q(e.group.position.x), q(e.group.position.z), hd(e.group.rotation.y), e.hp > 0 && e.group.visible !== false ? 1 : 0]);
  }
  REC.frames.push(f);
  if (REC.teams && M.teamScore) { const s = REC.score[REC.score.length - 1], a = M.teamScore[M.myTeam] | 0, b = M.teamScore[1 - M.myTeam] | 0; if (!s || s[1] !== a || s[2] !== b) REC.score.push([f[0], a, b]); }
}
function rpFeed(html) { if (REC && !M.over && REC.feed.length < 3000) REC.feed.push([Math.round(REC.t * 10), String(html).slice(0, 400)]); }
// top-down picture of the current map (entities hidden), drawn into its own small target so the game's canvas is never
// resized (1.2.71: resizing it cost a hitch at the start of every match and could leave it drawing at the wrong size);
// one picture per map, kept for the session
const RP_PLAN = {};
function rpPlanShot() {
  if (RP_PLAN[curMap]) return RP_PLAN[curMap];
  const r = renderer, sc = scene, cam = new THREE.OrthographicCamera(-RP_EXT, RP_EXT, RP_EXT, -RP_EXT, 1, 400), S2 = 512;
  cam.position.set(0, 200, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
  const hidden = []; for (const e of enemies.concat(typeof dying !== 'undefined' ? dying : [])) if (e.group && e.group.visible) { e.group.visible = false; hidden.push(e.group); }
  const fog = sc.fog ? sc.fog.density : 0; if (sc.fog) sc.fog.density = 0;
  const rt = new THREE.WebGLRenderTarget(S2, S2); rt.texture.encoding = THREE.sRGBEncoding; const prev = r.getRenderTarget(), px = new Uint8Array(S2 * S2 * 4);
  let url = null;
  try {
    r.setRenderTarget(rt); r.clear(); r.render(sc, cam); r.readRenderTargetPixels(rt, 0, 0, S2, S2, px);
    const cv = document.createElement('canvas'); cv.width = cv.height = S2; const cx = cv.getContext('2d'), img = cx.createImageData(S2, S2), row = S2 * 4;
    for (let y = 0; y < S2; y++) img.data.set(px.subarray((S2 - 1 - y) * row, (S2 - y) * row), y * row);
    cx.putImageData(img, 0, 0); url = cv.toDataURL('image/jpeg', 0.72);
  } finally { r.setRenderTarget(prev); rt.dispose(); for (const g of hidden) g.visible = true; if (sc.fog) sc.fog.density = fog; }
  if (url) RP_PLAN[curMap] = url;
  return url;
}
function rpPack(won, partial) {
  return { v: 1, map: REC.map, mode: REC.mode, name: REC.name, online: REC.online, teams: REC.teams, date: REC.date, len: REC.t, ents: REC.ents.slice(), frames: REC.frames.slice(), feed: REC.feed.slice(), score: REC.score.slice(), obj: REC.obj, won: won | 0, plan: REC.plan || null, partial: !!partial };
}
// match over (or left): save it as the last match
function rpFinish(won) {
  if (!REC || REC.frames.length < RP_HZ * 3) { REC = null; return; }
  if (!REC.plan) { try { REC.plan = rpPlanShot(); } catch (e) { REC.plan = null; } }
  RPLAST = rpPack(won, false); REC = null; RV.img = null;
  sbPut('replay', RPLAST); try { rpLibAdd(RPLAST); } catch (e) {}
}

/* ---------- viewer */
function openReplay(pick) {
  showScreen('replay');
  if (!RV.latest || (RPLAST && RPLAST !== RV.view && RPLAST.date !== (RV.latest && RV.latest.date))) RV.latest = RPLAST;
  if (pick) RPLAST = pick; else if (RV.latest) RPLAST = RV.latest;
  RV.view = RPLAST; RV.in = RV.out = -1; RV.heatPts = null; RV.fid = -1; rpLibHide();
  const R = RPLAST, has = !!(R && R.frames && R.frames.length);
  $('rpEmpty').classList.toggle('hide', has); $('rpMain').classList.toggle('hide', !has);
  if (!has) return;
  const m = MAPS[R.map] || {}, d = new Date(R.date);
  try { $('rpTitle').textContent = R.clip ? 'REPLAY THEATRE · CLIP' : R === RV.latest ? 'REPLAY THEATRE · LAST MATCH' : 'REPLAY THEATRE'; } catch (e) {}
  $('rpInfo').innerHTML = `<b>${R.clip ? R.clip : R.name || 'MATCH'}</b><span>${m.name || R.map}</span><span>${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>${R.won ? `<span class="${R.won > 0 ? 'rp-w' : 'rp-l'}">${R.won > 0 ? 'VICTORY' : 'DEFEAT'}</span>` : ''}`;
  RV.img = null; if (R.plan) { const im = new Image(); im.onload = () => { RV.img = im; }; im.src = R.plan; }
  RV.t = 0; RV.play = true; RV.speed = 1; RV.follow = false; RV.on = true; RV.lastT = performance.now();
  $('rpSeek').max = Math.ceil(R.len * 10); rpButtons();
  cancelAnimationFrame(RV.raf); RV.raf = requestAnimationFrame(rpLoop);
  setTimeout(() => { try { $('rpPlay').focus(); } catch (e) {} }, 0);
}
function closeReplay() { RV.on = false; cancelAnimationFrame(RV.raf); if (RV.latest) RPLAST = RV.latest; showScreen('menu'); }
function rpButtons() {
  $('rpPlay').textContent = RV.play ? '❚❚ PAUSE' : '▶ PLAY';
  $('rpSpeed').textContent = RV.speed + '×';
  const R = RPLAST, en = R && RV.fid >= 0 ? R.ents[RV.fid] : null;
  $('rpFollow').textContent = en ? 'FOLLOW: ' + (en.me ? 'YOU' : en.n) : 'FOLLOW: OFF';
  if ($('rpHeat')) $('rpHeat').textContent = RV.heat ? 'HEAT MAP: ON' : 'HEAT MAP: OFF';
  if ($('rpClip')) { const ok = RV.in >= 0 && RV.out > RV.in + 1; $('rpClip').disabled = !ok; $('rpClip').textContent = ok ? `SAVE CLIP ${rpFmt(RV.in)}-${rpFmt(RV.out)}` : RV.in >= 0 ? `IN ${rpFmt(RV.in)} · MARK OUT` : 'SAVE CLIP'; }
}
function rpSeekBy(s) { if (!RPLAST) return; RV.t = clamp(RV.t + s, 0, RPLAST.len); sfx.ui(); }
function rpToggle() { if (RPLAST && RV.t >= RPLAST.len - 0.05) RV.t = 0; RV.play = !RV.play; rpButtons(); sfx.ui(); }
const rpFmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
// index of the last frame at or before time t (tenths)
function rpFrameAt(t10) { const F = RPLAST.frames; let lo = 0, hi = F.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (F[m][0] <= t10) lo = m; else hi = m - 1; } return lo; }
function rpLoop(now) {
  if (!RV.on || curScreen !== 'replay') { RV.on = false; return; }
  RV.raf = requestAnimationFrame(rpLoop);
  const R = RPLAST, dt = Math.min(0.1, (now - RV.lastT) / 1000); RV.lastT = now;
  if (RV.play) { RV.t += dt * RV.speed; if (RV.t >= R.len) { RV.t = R.len; RV.play = false; rpButtons(); } }
  const seek = $('rpSeek'); if (document.activeElement !== seek || RV.play) seek.value = Math.round(RV.t * 10);
  $('rpTime').textContent = `${rpFmt(RV.t)} / ${rpFmt(R.len)}`;
  rpDraw(); rpSide();
}
function rpDraw() {
  const R = RPLAST, cv = $('rpCanvas'), box = cv.parentElement.getBoundingClientRect();
  const S2 = Math.max(200, Math.floor(Math.min(box.width, box.height))), dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== S2 * dpr) { cv.width = cv.height = S2 * dpr; cv.style.width = cv.style.height = S2 + 'px'; }
  const c = cv.getContext('2d'), W = cv.width; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#0b0d0e'; c.fillRect(0, 0, W, W);
  const t10 = RV.t * 10, F = R.frames, i = rpFrameAt(t10), a = F[i], b = F[Math.min(i + 1, F.length - 1)];
  const k = b[0] > a[0] ? clamp((t10 - a[0]) / (b[0] - a[0]), 0, 1) : 0;
  const pos = new Map();
  const bm = new Map(); for (let j = 1; j < b.length; j++) bm.set(b[j][0], b[j]);
  for (let j = 1; j < a.length; j++) {
    const e = a[j], f = bm.get(e[0]) || e, jump = Math.abs(f[1] - e[1]) + Math.abs(f[2] - e[2]) > 60;   // >6 m in one frame = respawn
    let dh = f[3] - e[3]; if (dh > 88) dh -= 176; if (dh < -88) dh += 176;
    pos.set(e[0], { x: (jump ? e[1] : e[1] + (f[1] - e[1]) * k) / 10, z: (jump ? e[2] : e[2] + (f[2] - e[2]) * k) / 10, h: (e[3] + dh * k) / 28, alive: e[4] });
  }
  // camera: whole map, or zoomed on you
  let zoom = 1, cx = 0, cz = 0;
  const me = RV.fid;
  if (me >= 0 && pos.has(me) && pos.get(me).alive) { zoom = 2.2; cx = pos.get(me).x; cz = pos.get(me).z; const lim = RP_EXT - RP_EXT / zoom; cx = clamp(cx, -lim, lim); cz = clamp(cz, -lim, lim); }
  const sc = W / (2 * RP_EXT) * zoom, X = x => (x - cx) * sc + W / 2, Z = z => (z - cz) * sc + W / 2;
  c.save();
  if (RV.img) { const s = 2 * RP_EXT * sc; c.globalAlpha = 0.9; c.drawImage(RV.img, X(-RP_EXT), Z(-RP_EXT), s, s); c.globalAlpha = 1; }
  else { c.strokeStyle = 'rgba(255,255,255,.06)'; for (let g = -40; g <= 40; g += 10) { c.beginPath(); c.moveTo(X(g), Z(-RP_EXT)); c.lineTo(X(g), Z(RP_EXT)); c.moveTo(X(-RP_EXT), Z(g)); c.lineTo(X(RP_EXT), Z(g)); c.stroke(); } }
  c.fillStyle = 'rgba(5,7,8,.25)'; c.fillRect(0, 0, W, W);
  const u = W / 640, col = r => r === 0 ? '#4ea6ff' : '#ff5246';
  // objectives
  for (const o of R.obj || []) { c.beginPath(); c.arc(X(o[0]), Z(o[1]), 16 * u * zoom, 0, 7); c.fillStyle = o[3] === undefined ? 'rgba(224,180,74,.18)' : o[3] ? 'rgba(255,82,70,.2)' : 'rgba(78,166,255,.2)'; c.fill(); c.strokeStyle = 'rgba(224,180,74,.8)'; c.lineWidth = 2 * u; c.stroke();
    c.fillStyle = '#e0b44a'; c.font = `700 ${13 * u * Math.sqrt(zoom)}px system-ui,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o[2], X(o[0]), Z(o[1])); }
  // HEAT MAP: every death in the whole match as a soft red blob (where the fights were)
  if (RV.heat) { if (!RV.heatPts) { RV.heatPts = []; for (let j = 1; j < F.length; j++) { const pm = new Map(); for (let n = 1; n < F[j - 1].length; n++) pm.set(F[j - 1][n][0], F[j - 1][n]); for (let n = 1; n < F[j].length; n++) { const e = F[j][n], p = pm.get(e[0]); if (p && p[4] && !e[4]) RV.heatPts.push([p[1] / 10, p[2] / 10]); } } }
    c.globalCompositeOperation = 'lighter'; for (const [hx, hz] of RV.heatPts) { const x = X(hx), z = Z(hz), rr = 26 * u * Math.sqrt(zoom), gr = c.createRadialGradient(x, z, 0, x, z, rr); gr.addColorStop(0, 'rgba(255,70,40,.32)'); gr.addColorStop(1, 'rgba(255,70,40,0)'); c.fillStyle = gr; c.fillRect(x - rr, z - rr, rr * 2, rr * 2); } c.globalCompositeOperation = 'source-over'; }
  // trails (last 2 s)
  const back = Math.max(0, i - RP_HZ * 2);
  for (const [id, p] of pos) {
    if (!p.alive) continue; c.beginPath(); let started = false, prev = null;
    for (let j = back; j <= i; j++) { const e = F[j].find((x, n) => n > 0 && x[0] === id); if (!e || !e[4]) { started = false; prev = null; continue; }
      if (prev && Math.abs(prev[1] - e[1]) + Math.abs(prev[2] - e[2]) > 60) started = false;
      if (!started) { c.moveTo(X(e[1] / 10), Z(e[2] / 10)); started = true; } else c.lineTo(X(e[1] / 10), Z(e[2] / 10)); prev = e; }
    c.lineTo(X(p.x), Z(p.z)); c.strokeStyle = R.ents[id].r === 0 ? 'rgba(78,166,255,.35)' : 'rgba(255,82,70,.35)'; c.lineWidth = 2 * u; c.stroke();
  }
  // deaths in the last 3 s: X where they fell
  for (let j = Math.max(1, i - RP_HZ * 3); j <= i; j++) {
    const prevM = new Map(); for (let n = 1; n < F[j - 1].length; n++) prevM.set(F[j - 1][n][0], F[j - 1][n]);
    for (let n = 1; n < F[j].length; n++) { const e = F[j][n], p = prevM.get(e[0]); if (p && p[4] && !e[4]) {
      const age = (t10 - F[j][0]) / 30, x = X(p[1] / 10), z = Z(p[2] / 10), s = 7 * u * Math.sqrt(zoom);
      c.globalAlpha = clamp(1 - age, 0, 1); c.strokeStyle = col(R.ents[e[0]].r); c.lineWidth = 3 * u; c.beginPath(); c.moveTo(x - s, z - s); c.lineTo(x + s, z + s); c.moveTo(x + s, z - s); c.lineTo(x - s, z + s); c.stroke(); c.globalAlpha = 1; } }
  }
  // soldiers: a dot with a view cone, names
  for (const [id, p] of pos) {
    if (!p.alive) continue; const en = R.ents[id], x = X(p.x), z = Z(p.z), r = (en.me ? 7.5 : 6) * u * Math.sqrt(zoom);
    const dx = Math.sin(p.h), dz = Math.cos(p.h);
    c.beginPath(); c.moveTo(x, z); c.arc(x, z, r * 3.4, Math.atan2(dz, dx) - 0.42, Math.atan2(dz, dx) + 0.42); c.closePath(); c.fillStyle = en.r === 0 ? 'rgba(78,166,255,.22)' : 'rgba(255,82,70,.22)'; c.fill();
    c.beginPath(); c.arc(x, z, r, 0, 7); c.fillStyle = col(en.r); c.fill(); c.lineWidth = (en.me || id === RV.fid ? 3 : 1.5) * u; c.strokeStyle = en.me ? '#fff' : id === RV.fid ? '#ffd23a' : 'rgba(0,0,0,.6)'; c.stroke();
    c.font = `${en.me ? 700 : 600} ${11 * u * Math.sqrt(zoom)}px system-ui,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.fillStyle = 'rgba(0,0,0,.65)'; c.fillText(en.me ? 'YOU' : en.n, x + 1, z - r - 3 * u + 1); c.fillStyle = en.me ? '#fff' : '#dfe3e6'; c.fillText(en.me ? 'YOU' : en.n, x, z - r - 3 * u);
  }
  c.restore();
}
function rpSide() {
  const R = RPLAST, t10 = RV.t * 10;
  let n = 0; while (n < R.feed.length && R.feed[n][0] <= t10) n++;
  if (RV.feedN !== n) {
    RV.feedN = n;
    $('rpFeed').innerHTML = R.feed.slice(Math.max(0, n - 9), n).reverse().map(f => `<div><i>${rpFmt(f[0] / 10)}</i> ${f[1]}</div>`).join('') || '<div class="dim">No kills yet</div>';
  }
  let s = null; for (const x of R.score || []) if (x[0] <= t10) s = x; else break;
  const sh = R.teams ? `<span class="rp-us">${s ? s[1] : 0}</span><em>–</em><span class="rp-them">${s ? s[2] : 0}</span>` : '';
  if (RV.scoreH !== sh) { RV.scoreH = sh; $('rpScore').innerHTML = sh; }
}
(() => {
  // screen markup
  const d = document.createElement('div'); d.id = 'replay'; d.className = 'screen hide';
  d.innerHTML = `<div class="rp-wrap"><div class="rp-top"><h2 id="rpTitle">REPLAY THEATRE · LAST MATCH</h2><button class="btn" id="rpLibBtn">LIBRARY</button><div class="rp-info" id="rpInfo"></div><div class="rp-score" id="rpScore"></div></div>
<div id="rpEmpty" class="rp-empty">No replay yet. Play a match and it will be here to rewatch.<br><br><button class="btn primary" id="rpBack0">BACK</button></div>
<div id="rpMain" class="rp-main"><div class="rp-stage"><canvas id="rpCanvas"></canvas></div>
<div class="rp-side"><div class="rp-sh">KILL FEED</div><div id="rpFeed" class="rp-feed"></div>
<div class="rp-keys">SPACE / X · PLAY<br>← → / LB RB · SKIP 5 s<br>ESC / B · BACK</div></div></div>
<div class="rp-bar" id="rpBar"><button class="btn" id="rpPlay">PLAY</button><input type="range" id="rpSeek" min="0" max="100" step="1" value="0"><span id="rpTime" class="rp-time">0:00</span>
<button class="btn" id="rpSpeed">1×</button><button class="btn" id="rpFollow">FOLLOW</button><button class="btn" id="rpHeat">HEAT MAP</button><button class="btn" id="rpIn">MARK IN</button><button class="btn" id="rpOut">MARK OUT</button><button class="btn" id="rpClip" disabled>SAVE CLIP</button><button class="btn primary" id="rpBack">BACK</button></div>
<div id="rpLib" class="rp-lib hide"></div></div>`;
  document.body.appendChild(d);
  $('rpBack0').onclick = $('rpBack').onclick = () => { sfx.ui(); closeReplay(); };
  $('rpPlay').onclick = rpToggle;
  $('rpSpeed').onclick = () => { const L = [0.5, 1, 2, 4]; RV.speed = L[(L.indexOf(RV.speed) + 1) % L.length]; rpButtons(); sfx.ui(); };
  $('rpFollow').onclick = () => { const R = RPLAST; if (!R) return; const n = R.ents.length, me = R.ents.findIndex(e => e.me); RV.fid = RV.fid < 0 ? (me >= 0 ? me : 0) : (RV.fid + 1) % (n + 1); if (RV.fid === n || (RV.fid === me && RV.fidLoop)) { RV.fid = -1; RV.fidLoop = false; } else if (RV.fid !== me) RV.fidLoop = true; RV.follow = RV.fid >= 0; rpButtons(); sfx.ui(); };
  $('rpHeat').onclick = () => { RV.heat = !RV.heat; rpButtons(); sfx.ui(); };
  $('rpIn').onclick = () => { RV.in = RV.t; if (RV.out <= RV.in) RV.out = -1; rpButtons(); sfx.ui(); };
  $('rpOut').onclick = () => { if (RV.in < 0) RV.in = Math.max(0, RV.t - 10); RV.out = RV.t; rpButtons(); sfx.ui(); };
  $('rpClip').onclick = () => { if (rpSaveClip()) { try { toast2('CLIP SAVED · OPEN IT FROM THE LIBRARY'); } catch (e) {} } rpButtons(); };
  $('rpLibBtn').onclick = () => { sfx.ui(); const L = $('rpLib'); if (L.classList.contains('hide')) rpLibShow(); else rpLibHide(); };
  $('rpSeek').oninput = e => { RV.t = clamp(+e.target.value / 10, 0, RPLAST ? RPLAST.len : 0); };
  const s = document.createElement('style');
  s.textContent = `#replay{position:fixed;inset:0;z-index:30;background:radial-gradient(circle at 50% 30%,#14191b,#07090a);display:flex;pointer-events:auto}#replay.hide{display:none}
.rp-wrap{display:flex;flex-direction:column;width:100%;height:100%;padding:18px 24px;gap:12px;box-sizing:border-box}
.rp-top{display:flex;align-items:center;gap:22px;flex-wrap:wrap}.rp-top h2{margin:0;font-size:18px;letter-spacing:.35em;color:var(--accent)}
.rp-info{display:flex;gap:16px;font-size:12px;letter-spacing:.18em;color:var(--dim);align-items:baseline}.rp-info b{color:#fff;font-size:14px}.rp-w{color:#7ddc6a}.rp-l{color:#ff5a4a}
.rp-score{margin-left:auto;font-size:26px;font-weight:800;display:flex;gap:10px}.rp-score em{color:var(--dim);font-style:normal}.rp-us{color:#4ea6ff}.rp-them{color:#ff5246}
.rp-main{flex:1;display:flex;gap:16px;min-height:0}.rp-main.hide,.rp-empty.hide{display:none}.rp-stage{flex:1;display:flex;align-items:center;justify-content:center;min-width:0;min-height:0}
#rpCanvas{border:1px solid var(--line);box-shadow:0 10px 40px rgba(0,0,0,.6)}
.rp-side{width:300px;display:flex;flex-direction:column;gap:8px}.rp-sh{font-size:12px;letter-spacing:.35em;color:var(--accent)}
.rp-feed{flex:1;overflow:hidden;display:flex;flex-direction:column;gap:6px;font-size:13px}.rp-feed>div{background:rgba(0,0,0,.35);padding:6px 9px;border-left:2px solid var(--line)}.rp-feed i{font-style:normal;color:var(--dim);font-size:11px;margin-right:4px}.rp-feed .fw{color:var(--dim);margin:0 4px}.rp-feed .ft{color:var(--accent);font-size:11px}.rp-feed .fp{display:none}
.rp-keys{font-size:11px;letter-spacing:.12em;color:var(--dim);line-height:1.8}
.rp-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.rp-bar .btn{min-width:0;width:auto;flex:0 0 auto;padding:8px 12px;white-space:nowrap;font-size:11px}#rpSeek{flex:1 1 100%;order:-1;accent-color:var(--accent)}.rp-time{font-variant-numeric:tabular-nums;font-size:13px;color:var(--dim);min-width:92px;text-align:center}
.rp-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--dim);letter-spacing:.12em;text-align:center}
.rp-lib{position:absolute;top:64px;right:24px;width:420px;max-height:70vh;overflow:auto;background:rgba(8,10,11,.96);border:1px solid var(--line);padding:12px;z-index:2;display:flex;flex-direction:column;gap:6px}.rp-lib.hide{display:none}
.rp-lib h3{margin:6px 0 2px;font-size:11px;letter-spacing:.3em;color:var(--accent)}.rp-li{display:flex;align-items:center;gap:8px;padding:7px 9px;border:1px solid var(--line);cursor:pointer;font-size:12px}.rp-li:hover,.rp-li:focus{border-color:#fff;outline:none}
.rp-li b{flex:1;color:#fff;letter-spacing:.08em}.rp-li span{color:var(--dim);font-size:11px}.rp-li .x{border:0;background:none;color:#ff7a6a;cursor:pointer;font-size:14px}.rp-bar #rpClip[disabled]{opacity:.4}
@media (max-width:800px){.rp-side{display:none}}`;
  document.head.appendChild(s);
})();

/* ---------- REPLAY THEATRE: clips and the library */
function rpSaveClip() {
  const R = RPLAST; if (!R || RV.in < 0 || RV.out <= RV.in + 1) return false;
  const a = RV.in * 10, b = RV.out * 10, sh = f => [f[0] - a].concat(f.slice(1));
  const frames = R.frames.filter(f => f[0] >= a && f[0] <= b).map(sh); if (frames.length < 3) return false;
  const clip = Object.assign({}, R, { clip: `${R.name || 'MATCH'} · ${rpFmt(RV.in)}-${rpFmt(RV.out)}`, cdate: Date.now(), len: RV.out - RV.in, frames,
    feed: R.feed.filter(f => f[0] >= a && f[0] <= b).map(f => [f[0] - a, f[1]]), score: (R.score || []).filter(s => s[0] >= a && s[0] <= b).map(sh) });
  RP_LIB.clips = [clip].concat(RP_LIB.clips).slice(0, 20); sbPut('clips', RP_LIB.clips); RV.in = RV.out = -1; return true;
}
function rpLibHide() { const L = $('rpLib'); if (L) L.classList.add('hide'); }
function rpLibShow() {
  const L = $('rpLib'); if (!L) return; const when = d => { const x = new Date(d); return x.toLocaleDateString() + ' ' + x.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  const row = (r, i, kind) => `<div class="rp-li" tabindex="0" data-rpk="${kind}" data-rpi="${i}"><b>${kind === 'c' ? r.clip : r.name || 'MATCH'}</b><span>${(MAPS[r.map] || {}).name || r.map} · ${rpFmt(r.len)} · ${when(kind === 'c' ? r.cdate : r.date)}</span>${kind === 'c' ? `<button class="x" data-rpdel="${i}" title="Delete clip">✕</button>` : ''}</div>`;
  L.innerHTML = `<h3>MATCHES · THE LAST 10</h3>${RP_LIB.matches.length ? RP_LIB.matches.map((r, i) => row(r, i, 'm')).join('') : '<span class="dim">no matches yet</span>'}<h3>CLIPS · ${RP_LIB.clips.length} OF 20</h3>${RP_LIB.clips.length ? RP_LIB.clips.map((r, i) => row(r, i, 'c')).join('') : '<span class="dim">mark IN and OUT on the timeline, then SAVE CLIP</span>'}`;
  L.classList.remove('hide');
  for (const el of L.querySelectorAll('.rp-li')) el.onclick = ev => { if (ev.target.dataset.rpdel !== undefined) return; const r = (el.dataset.rpk === 'c' ? RP_LIB.clips : RP_LIB.matches)[+el.dataset.rpi]; if (r) { sfx.ui(); openReplay(r); } };
  for (const b of L.querySelectorAll('[data-rpdel]')) b.onclick = () => { RP_LIB.clips.splice(+b.dataset.rpdel, 1); sbPut('clips', RP_LIB.clips); sfx.ui(); rpLibShow(); };
}
