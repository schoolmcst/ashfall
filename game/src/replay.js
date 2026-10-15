/* ================================================================== replay: rewatch your last match
   While a match runs we record every soldier 5 times a second (position, facing, alive) plus the kill feed and the
   team score. When it ends we take a top-down picture of the map, and the whole thing is saved (IndexedDB), so the
   REPLAY tab in the main menu can play it back on a tactical map: trails, death markers, kill feed, timeline,
   speed and a camera that can follow you. */
const RP_HZ = 5, RP_MAX = 15 * 60 * RP_HZ, RP_KEY = 'dz_replay', RP_EXT = 46;
let REC = null, RPLAST = null;
const RV = { on: false, t: 0, play: true, speed: 1, follow: false, img: null, lastT: 0, raf: 0 };
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
  if (!REC.planTried && REC.t > 0.3) { REC.planTried = true; try { REC.plan = rpPlanShot(); } catch (e) { REC.plan = null; } }
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
// top-down picture of the current map (entities hidden)
function rpPlanShot() {
  const r = renderer, sc = scene, cam = new THREE.OrthographicCamera(-RP_EXT, RP_EXT, RP_EXT, -RP_EXT, 1, 400);
  cam.position.set(0, 200, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
  const hidden = []; for (const e of enemies.concat(typeof dying !== 'undefined' ? dying : [])) if (e.group && e.group.visible) { e.group.visible = false; hidden.push(e.group); }
  const fog = sc.fog ? sc.fog.density : 0; if (sc.fog) sc.fog.density = 0;
  const W = r.domElement.width, H = r.domElement.height, S2 = 640;
  let url = null;
  try { r.setSize(S2, S2, false); r.setViewport(0, 0, S2, S2); r.clear(); r.render(sc, cam); url = r.domElement.toDataURL('image/jpeg', 0.72); }
  finally { for (const g of hidden) g.visible = true; if (sc.fog) sc.fog.density = fog; r.setSize(W, H, false); r.setViewport(0, 0, W, H); }
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
  sbPut('replay', RPLAST);
}

/* ---------- viewer */
function openReplay() {
  showScreen('replay');
  const R = RPLAST, has = !!(R && R.frames && R.frames.length);
  $('rpEmpty').classList.toggle('hide', has); $('rpMain').classList.toggle('hide', !has);
  if (!has) return;
  const m = MAPS[R.map] || {}, d = new Date(R.date);
  $('rpInfo').innerHTML = `<b>${R.name || 'MATCH'}</b><span>${m.name || R.map}</span><span>${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>${R.won ? `<span class="${R.won > 0 ? 'rp-w' : 'rp-l'}">${R.won > 0 ? 'VICTORY' : 'DEFEAT'}</span>` : ''}`;
  RV.img = null; if (R.plan) { const im = new Image(); im.onload = () => { RV.img = im; }; im.src = R.plan; }
  RV.t = 0; RV.play = true; RV.speed = 1; RV.follow = false; RV.on = true; RV.lastT = performance.now();
  $('rpSeek').max = Math.ceil(R.len * 10); rpButtons();
  cancelAnimationFrame(RV.raf); RV.raf = requestAnimationFrame(rpLoop);
  setTimeout(() => { try { $('rpPlay').focus(); } catch (e) {} }, 0);
}
function closeReplay() { RV.on = false; cancelAnimationFrame(RV.raf); showScreen('menu'); }
function rpButtons() {
  $('rpPlay').textContent = RV.play ? '❚❚ PAUSE' : '▶ PLAY';
  $('rpSpeed').textContent = RV.speed + '×';
  $('rpFollow').textContent = RV.follow ? 'FOLLOW YOU: ON' : 'FOLLOW YOU: OFF';
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
  const me = R.ents.findIndex(e => e.me);
  if (RV.follow && pos.has(me)) { zoom = 2.2; cx = pos.get(me).x; cz = pos.get(me).z; const lim = RP_EXT - RP_EXT / zoom; cx = clamp(cx, -lim, lim); cz = clamp(cz, -lim, lim); }
  const sc = W / (2 * RP_EXT) * zoom, X = x => (x - cx) * sc + W / 2, Z = z => (z - cz) * sc + W / 2;
  c.save();
  if (RV.img) { const s = 2 * RP_EXT * sc; c.globalAlpha = 0.9; c.drawImage(RV.img, X(-RP_EXT), Z(-RP_EXT), s, s); c.globalAlpha = 1; }
  else { c.strokeStyle = 'rgba(255,255,255,.06)'; for (let g = -40; g <= 40; g += 10) { c.beginPath(); c.moveTo(X(g), Z(-RP_EXT)); c.lineTo(X(g), Z(RP_EXT)); c.moveTo(X(-RP_EXT), Z(g)); c.lineTo(X(RP_EXT), Z(g)); c.stroke(); } }
  c.fillStyle = 'rgba(5,7,8,.25)'; c.fillRect(0, 0, W, W);
  const u = W / 640, col = r => r === 0 ? '#4ea6ff' : '#ff5246';
  // objectives
  for (const o of R.obj || []) { c.beginPath(); c.arc(X(o[0]), Z(o[1]), 16 * u * zoom, 0, 7); c.fillStyle = o[3] === undefined ? 'rgba(224,180,74,.18)' : o[3] ? 'rgba(255,82,70,.2)' : 'rgba(78,166,255,.2)'; c.fill(); c.strokeStyle = 'rgba(224,180,74,.8)'; c.lineWidth = 2 * u; c.stroke();
    c.fillStyle = '#e0b44a'; c.font = `700 ${13 * u * Math.sqrt(zoom)}px system-ui,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o[2], X(o[0]), Z(o[1])); }
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
    c.beginPath(); c.arc(x, z, r, 0, 7); c.fillStyle = col(en.r); c.fill(); c.lineWidth = (en.me ? 3 : 1.5) * u; c.strokeStyle = en.me ? '#fff' : 'rgba(0,0,0,.6)'; c.stroke();
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
  d.innerHTML = `<div class="rp-wrap"><div class="rp-top"><h2>REPLAY · LAST MATCH</h2><div class="rp-info" id="rpInfo"></div><div class="rp-score" id="rpScore"></div></div>
<div id="rpEmpty" class="rp-empty">No replay yet. Play a match and it will be here to rewatch.<br><br><button class="btn primary" id="rpBack0">BACK</button></div>
<div id="rpMain" class="rp-main"><div class="rp-stage"><canvas id="rpCanvas"></canvas></div>
<div class="rp-side"><div class="rp-sh">KILL FEED</div><div id="rpFeed" class="rp-feed"></div>
<div class="rp-keys">SPACE / X · PLAY<br>← → / LB RB · SKIP 5 s<br>ESC / B · BACK</div></div></div>
<div class="rp-bar" id="rpBar"><button class="btn" id="rpPlay">PLAY</button><input type="range" id="rpSeek" min="0" max="100" step="1" value="0"><span id="rpTime" class="rp-time">0:00</span>
<button class="btn" id="rpSpeed">1×</button><button class="btn" id="rpFollow">FOLLOW</button><button class="btn primary" id="rpBack">BACK</button></div></div>`;
  document.body.appendChild(d);
  $('rpBack0').onclick = $('rpBack').onclick = () => { sfx.ui(); closeReplay(); };
  $('rpPlay').onclick = rpToggle;
  $('rpSpeed').onclick = () => { const L = [0.5, 1, 2, 4]; RV.speed = L[(L.indexOf(RV.speed) + 1) % L.length]; rpButtons(); sfx.ui(); };
  $('rpFollow').onclick = () => { RV.follow = !RV.follow; rpButtons(); sfx.ui(); };
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
.rp-bar{display:flex;align-items:center;gap:10px}.rp-bar .btn{min-width:0;padding:10px 16px}#rpSeek{flex:1;accent-color:var(--accent)}.rp-time{font-variant-numeric:tabular-nums;font-size:13px;color:var(--dim);min-width:92px;text-align:center}
.rp-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--dim);letter-spacing:.12em;text-align:center}
@media (max-width:800px){.rp-side{display:none}}`;
  document.head.appendChild(s);
})();
