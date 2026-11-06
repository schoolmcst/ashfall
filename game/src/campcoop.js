/* ================================================================== CAMPAIGN CO-OP (desktop app, 1.2.86): two players
   On the CAMPAIGN screen: HOST CO-OP makes a 5-letter code; your friend types it and presses JOIN. The host picks the
   mission and presses PLAY; both of you load in. The host runs the mission (the squads, the crew, the steps, the
   checkpoints); the friend sees copies of the host's enemies and crew ("proxies"), hears the same lines, sees the same
   goals, and their hits go to the host as records, which the host applies. Enemies that are hunting shoot at the friend
   too. If the friend goes down they get back up next to the host after 6 seconds. When the host finishes the mission,
   it is finished for both, and both get the rewards. The friend can finish the action steps too (reach a place, USE
   something, pick up or carry something): their game tells the host, and the host moves both of you on. Up to 2 players for now.
   Presence: cc 1, n, g (game id), x y z yw, a (alive), hs hits [id, dmg, head, seq]
   Host adds: ho, st 'wait'|'play'|'done', mi (mission), df (difficulty), si (step), en [id, x, z, y, yaw*100, team, alert, boss, hp%] */
const CC_MAX = 2;
// steps the friend can finish for both (the ones that are about where you are and what you do, not about the host's enemies)
const CC_ACT = new Set(['go', 'use', 'multi', 'pick', 'carry', 'search', 'photo']);
const CC = { on: false, room: null, conn: 'off', err: '', me: '', code: '', gid: 0, st: 'wait', inGame: false, rem: new Map(), prox: new Map(), pend: new Map(), hs: [], hseq: 0, eid: 0, timer: null, deadT: 0, fireT: 0 };
const ccHost = () => !!(CC.room && CC.room.host);
const ccClient = () => CC.on && CC.inGame && !ccHost() && typeof M !== 'undefined' && M && M.mode === 'camp';
const ccHosting = () => CC.on && CC.inGame && ccHost() && typeof M !== 'undefined' && M && M.mode === 'camp';
const ccCode = () => { const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; let s = ''; for (let i = 0; i < 5; i++) s += L[(Math.random() * L.length) | 0]; return s; };
async function ccJoin(code) {
  if (CC.on || CC.conn === 'connecting') return;
  if (!NET.app) { CC.err = 'CO-OP NEEDS THE DESKTOP APP'; campRender(); return; }
  code = String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5); if (code.length !== 5) { CC.err = 'TYPE THE 5-LETTER CODE'; campRender(); return; }
  CC.err = ''; CC.conn = 'connecting'; campRender(); let room = null;
  try { room = await P2P.aside('code', 'camp', 'cc' + code.toLowerCase()); }
  catch (e) { CC.conn = 'off'; CC.err = 'COULD NOT REACH THE MATCH SERVICE'; campRender(); return; }
  Object.assign(CC, { on: true, room, conn: 'in', me: room.me, code, inGame: false, gid: 0, st: 'wait', joinedT: performance.now() });
  CC.rem.clear(); clearInterval(CC.timer); CC.timer = setInterval(ccTick, 50); ccPublish(); campRender(); try { sfx.ui(); } catch (e) {}
}
function ccLeave() {
  clearInterval(CC.timer); CC.timer = null; const r = CC.room; CC.room = null; if (r) try { r.leave(); } catch (e) {}
  for (const R of CC.rem.values()) ccDropAvatar(R); CC.rem.clear(); ccClearProx();
  Object.assign(CC, { on: false, conn: 'off', inGame: false, gid: 0, st: 'wait' }); try { if (curScreen === 'campaign') campRender(); } catch (e) {}
}
function ccTick() {
  if (!CC.on || !CC.room) return;
  try {
    if (CC.room.closed) { ccLeave(); return; }
    if (!ccHost() && performance.now() - CC.joinedT > 2500 && CC.room.order.indexOf(CC.me) >= CC_MAX) { ccLeave(); CC.err = 'THAT GAME IS FULL'; return; }
    if (!CC.inGame && G.state !== 'menu') return;
    if (CC.inGame && (!M || M.mode !== 'camp')) { CC.inGame = false; }
    ccRead(); ccPublish();
  } catch (e) { try { reportError(e); } catch (er) {} }
}
function ccRead() {
  const host = ccHost(), seen = new Set(); let H = null;
  for (const p of CC.room.peers()) {
    if (p.sameTab) continue; const pr = p.presence || {}; if (!pr.cc) continue; seen.add(p.peer);
    let R = CC.rem.get(p.peer); if (!R) { R = { peer: p.peer, av: null, seenHit: 0 }; CC.rem.set(p.peer, R); try { if (CC.inGame) feedLine(`<b>${cleanNick(pr.n)}</b> <span class="fw">JOINED</span>`); } catch (e) {} }
    R.pr = pr; R.n = cleanNick(pr.n); R.ho = !!pr.ho; R.inGame = CC.inGame && pr.g === CC.gid && CC.gid;
    R.x = netNum(pr.x, -ARENA, ARENA); R.y = netNum(pr.y, -5, 30); R.z = netNum(pr.z, -ARENA, ARENA); R.yw = netNum(pr.yw, -1e4, 1e4); R.a = !!pr.a;
    if (R.ho) H = pr;
    // the friend finished an action step: the host finishes it for both
    if (host && R.inGame && Array.isArray(pr.rq) && (pr.rq[1] | 0) > (R.seenRq | 0)) { R.seenRq = pr.rq[1] | 0; if ((pr.rq[0] | 0) === CAMP.i && CAMP.st && CC_ACT.has(CAMP.st.type) && !CAMP.dead) { try { showMsg(`${R.n || 'YOUR FRIEND'} DID IT`); campStepDone(); } catch (e) { reportError(e); } } }
    // the host applies the friend's hits
    if (host && R.inGame && Array.isArray(pr.hs)) for (const h of pr.hs) { const seq = +h[3] | 0; if (seq <= R.seenHit) continue; R.seenHit = seq; const e = enemies.find(q => q.ccId === (h[0] | 0)); if (e && enemies.includes(e)) try { damageEnemy(e, clamp(+h[1] || 0, 0, 400), !!h[2], null, false, ccBy(R)); } catch (er) {} }
  }
  for (const [k, R] of CC.rem) if (!seen.has(k)) { ccDropAvatar(R); CC.rem.delete(k); }
  const key = [...CC.rem.values()].map(R => R.n).join(','); if (key !== CC.boxKey) { CC.boxKey = key; try { if (curScreen === 'campaign') ccLobbyBox(); } catch (e) {} }
  if (!host && H) ccFollowHost(H);
}
// the friend as a killer the host's code understands (an avatar with a scoreboard entry)
function ccBy(R) { if (!R.av) return 'world'; R.av.entry = R.av.entry || { name: R.n || 'FRIEND', team: 0, kills: 0, deaths: 0, score: 0 }; R.av.name = R.n || 'FRIEND'; R.av.team = 0; return R.av; }
function ccPublish() {
  const inG = CC.inGame && M && M.mode === 'camp';
  for (const [id, h] of CC.pend) { CC.hseq++; CC.hs.push([id, Math.round(h.d), h.h ? 1 : 0, CC.hseq]); } CC.pend.clear(); while (CC.hs.length > 24) CC.hs.shift();
  const o = { cc: 1, n: NET.nick, g: inG ? CC.gid : 0, x: r2(P.x), y: r2(P.y || 0), z: r2(P.z), yw: r3(P.yaw), a: inG && G.state === 'playing' ? 1 : 0, hs: CC.hs, rq: inG ? CC.rq : undefined };
  if (ccHost()) {
    Object.assign(o, { ho: 1, st: CC.st, gid: CC.gid, mi: CC.mi || '', df: CC.df || 'regular', si: inG ? CAMP.i : -1 });
    if (inG) { o.en = []; for (const e of enemies) { if (e.ccProx || !e.group || !e.entry) continue; if (!e.ccId) e.ccId = ++CC.eid; const g = e.group.position, ally = e.camp && e.camp.ally;
      o.en.push([e.ccId, r2(g.x), r2(g.z), r2(g.y), Math.round(g.y * 0 + e.group.rotation.y * 100), ally ? 0 : 1, e.camp && e.camp.alert ? 1 : 0, e.boss ? 1 : 0, Math.round(clamp(e.hp / (e.maxHp || 100), 0, 1) * 100)]); if (o.en.length >= 40) break; } }
  }
  CC.room.presence(o);
}
// ---------- the host: start a mission for both
function ccHostPlay(id, diff) { CC.mi = id; CC.df = diff; CC.st = 'play'; CC.gid = 1 + ((Math.random() * 1e9) | 0); CC.inGame = true; CC.eid = 0; }
// ---------- the friend: follow the host into the mission, its steps and its end
function ccFollowHost(H) {
  if (H.st === 'play' && H.gid && H.gid !== CC.gid && H.mi && campMission(H.mi)) { CC.gid = H.gid; CC.inGame = true; ccClearProx(); CAMP.sel = H.mi; campPlay(H.mi, CAMP_DIFF[H.df] ? H.df : 'regular'); return; }
  if (!ccClient()) return;
  const si = H.si | 0; if (si >= 0 && si !== CAMP.i && CAMP.m && si < CAMP.m.steps.length) { CC.rqFor = -1; try { campBegin(si); } catch (e) { reportError(e); } }
  if (H.st === 'done' && !CAMP.done) { CC.inGame = false; try { CAMP.done = false; ccDone = true; campComplete(); } catch (e) {} }
  // the host's enemies and crew as proxies
  const live = new Set();
  for (const q of (Array.isArray(H.en) ? H.en : []).slice(0, 40)) { const id = q[0] | 0; live.add(id); let e = CC.prox.get(id);
    if (!e) { e = makeEnemy(q[7] ? 'heavy' : 'rifleman', +q[1] || 0, +q[2] || 0); Object.assign(e, { ccProx: true, ccId: id, team: q[5] ? 1 : 0, hp: 1e9, maxHp: 1e9, speed: 0, aim: 0, holding: true, spawnProt: 0 }); if (q[7]) e.group.scale.setScalar(1.15); if (!q[5]) try { e.group.add(friendlyMarker()); } catch (er) {} e.group.position.y = +q[3] || 0; enemies.push(e); CC.prox.set(id, e); }
    e.tx = +q[1] || 0; e.tz = +q[2] || 0; e.ty = +q[3] || 0; e.tyaw = (+q[4] || 0) / 100; e.ccAlert = !!q[6]; e.ccHp = q[8] | 0; }
  for (const [id, e] of CC.prox) if (!live.has(id)) ccDropProx(id, e);
}
let ccDone = false;
function ccDropProx(id, e) {
  CC.prox.delete(id); const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1);
  if (e.team === 1 && e.ccHp > 0 && e.ccHp <= 100) { const dd = { e, t: 0, boom: false, dx: 0, dz: 0, head: false, a: [rnd(0.5, 1.4), rnd(0.5, 1.4), rnd(-0.4, 0.4), rnd(-0.4, 0.4)] }; try { dying.push(dd); } catch (er) { scene.remove(e.group); } }
  else scene.remove(e.group);
}
function ccClearProx() { for (const [id, e] of CC.prox) { const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); scene.remove(e.group); } CC.prox.clear(); }
// every frame: move the proxies, the friend's avatar on the host, enemy fire at the friend
function ccFrame(dt) {
  if (!CC.on || !M || M.mode !== 'camp') return;
  if (ccClient()) {
    for (const e of CC.prox.values()) { const g = e.group, ox = g.position.x, oz = g.position.z, k = Math.min(1, dt * 10);
      if (Math.hypot(e.tx - ox, e.tz - oz) > 5) g.position.set(e.tx, e.ty, e.tz); else { g.position.x += (e.tx - ox) * k; g.position.z += (e.tz - oz) * k; g.position.y += (e.ty - g.position.y) * k; }
      let dy = e.tyaw - g.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; g.rotation.y += dy * Math.min(1, dt * 10);
      const sp = dt > 0 ? Math.min(6, Math.hypot(g.position.x - ox, g.position.z - oz) / dt) : 0; try { animEnemy(e, dt, sp); } catch (er) {} }
    // the hunting enemies shoot at me too (the host's game only aims at the host and the crew)
    if (G.state === 'playing' && (CC.fireT -= dt) <= 0) { CC.fireT = 0.35;
      const D = CAMP_DIFF[CAMP.diff] || CAMP_DIFF.regular;
      for (const e of CC.prox.values()) { if (e.team !== 1 || !e.ccAlert) continue; const g = e.group.position, d = Math.hypot(g.x - P.x, g.z - P.z); if (d > 32) continue;
        if (Math.random() > 0.16) continue; let los = true; try { los = hasLOS(e, d); } catch (er) {} if (!los) continue;
        try { addTracer(new THREE.Vector3(g.x, g.y + 1.45, g.z), new THREE.Vector3(P.x + rnd(-0.4, 0.4), P.y + 1.4, P.z + rnd(-0.4, 0.4)), 0.05, 0.02); sfx.shot && sfx.shot(at(g.x, g.z, 40)); } catch (er) {}
        if (Math.random() < 0.55 - d / 90) hurtPlayer(7 * ((D.dmg || 1)), g.x - P.x, g.z - P.z); } }
    // down: back up next to the host after 6 s
    if (G.state === 'campdead' || CAMP.dead) { CC.deadT += dt; if (CC.deadT > 6) { CC.deadT = 0; ccRespawn(); } } else CC.deadT = 0;
  }
  if (ccHosting()) for (const R of CC.rem.values()) ccAvatar(R, dt);
}
function ccRespawn() {
  const o = $('campFailEl'); if (o) o.remove(); CAMP.dead = false; let H = null; for (const R of CC.rem.values()) if (R.ho) H = R;
  const p = H ? openNear(H.x + 1.5, H.z + 1.5) : { x: P.x, z: P.z }; placePlayer({ x: p.x, z: p.z, y: H ? H.y : P.y }); G.health = G.maxHp; G.state = 'playing'; G.dc = null;
  try { $('killcam').classList.add('hide'); vig.style.opacity = 0; hideCenter(); lockPointer(); campRefill(); showMsg('BACK IN THE FIGHT'); } catch (e) {}
}
function ccAvatar(R, dt) {
  if (!R.inGame || !R.a) { ccDropAvatar(R); return; }
  if (!R.av) { const e = makeEnemy('rifleman', R.x, R.z); e.group.position.y = R.y; try { e.group.add(friendlyMarker()); } catch (er) {} e.aim = 1; e.holding = true; e.team = 0; R.av = e; }
  const g = R.av.group, ox = g.position.x, oz = g.position.z, k = Math.min(1, dt * 14);
  if (Math.hypot(R.x - ox, R.z - oz) > 6) g.position.set(R.x, R.y, R.z); else { g.position.x += (R.x - ox) * k; g.position.z += (R.z - oz) * k; g.position.y += (R.y - g.position.y) * k; }
  let dy = R.yw + Math.PI - g.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; g.rotation.y += dy * Math.min(1, dt * 16);
  const sp = dt > 0 ? Math.min(9, Math.hypot(g.position.x - ox, g.position.z - oz) / dt) : 0; try { animEnemy(R.av, dt, Math.min(6, sp)); } catch (er) {}
}
function ccDropAvatar(R) { if (R.av) { scene.remove(R.av.group); R.av = null; } }
// ---------- the hooks
(() => {
  const sq0 = campSpawnSquad; campSpawnSquad = function () { if (ccClient()) return []; return sq0.apply(this, arguments); };
  const al0 = campAlly; campAlly = function () { if (ccClient()) return null; return al0.apply(this, arguments); };
  const sd0 = campStepDone; campStepDone = function () {
    if (ccClient()) { const st = CAMP.st; if (st && CC_ACT.has(st.type) && CC.rqFor !== CAMP.i) { CC.rqFor = CAMP.i; CC.rqSeq = (CC.rqSeq | 0) + 1; CC.rq = [CAMP.i, CC.rqSeq]; try { showMsg('DONE · TELLING THE HOST'); } catch (e) {} } return; }
    return sd0.apply(this, arguments); };
  const fa0 = campFail; campFail = function (why, died) { if (ccClient() && !died) return; return fa0.apply(this, arguments); };
  const rs0 = campRestart; campRestart = function () { if (ccClient()) { ccRespawn(); return; } return rs0.apply(this, arguments); };
  const cm0 = campComplete; campComplete = function () { if (ccClient() && !ccDone) return; ccDone = false; if (ccHosting()) { CC.st = 'done'; try { ccPublish(); } catch (e) {} } return cm0.apply(this, arguments); };
  const pl0 = campPlay; campPlay = function (id, diff) { if (CC.on && ccHost()) ccHostPlay(id, diff); return pl0.apply(this, arguments); };
  const dm0 = damageEnemy; damageEnemy = function (e, dmg, head, dir, boom, by = 'player') {
    if (e && e.ccProx) { if (by === 'player' && e.team === 1) { const h = CC.pend.get(e.ccId) || { d: 0, h: false }; h.d += dmg; h.h = h.h || !!head; CC.pend.set(e.ccId, h); e.flinch = 1; try { fbMarker(true, false, head); sfx.hit(head); } catch (er) {} } return false; }
    return dm0.apply(this, arguments); };
  const cr0 = campRender; campRender = function () { const r = cr0.apply(this, arguments); try { ccLobbyBox(); } catch (e) {} return r; };
})();
setInterval(() => { try { if (CC.on) ccFrame(0.05); } catch (e) {} }, 50);
function ccLobbyBox() {
  const s = $('campaign'); if (!s) return; let b = $('ccBox'); if (!b) { b = document.createElement('div'); b.id = 'ccBox'; const host = s.querySelector('.cp-main') || s; host.appendChild(b); }
  const peers = [...CC.rem.values()].map(R => R.n).filter(Boolean);
  b.innerHTML = !CC.on ? `<b>CO-OP · 2 PLAYERS</b><span>play the story with a friend (desktop app)</span><div class="cc-row"><button class="btn" data-cc="host">HOST CO-OP</button><input id="ccCode" maxlength="5" placeholder="CODE"><button class="btn" data-cc="join">JOIN</button></div>${CC.conn === 'connecting' ? '<small>CONNECTING…</small>' : ''}${CC.err ? `<small class="cc-err">${CC.err}</small>` : ''}`
    : `<b>CO-OP · CODE ${CC.code}</b><span>${ccHost() ? (peers.length ? `${peers[0]} is with you · pick a mission and press PLAY` : 'give your friend this code · waiting for them…') : `in ${peers[0] || 'the host'}'s game · the host picks the mission`}</span><div class="cc-row"><button class="btn" data-cc="leave">LEAVE CO-OP</button></div>`;
  const i = $('ccCode'); if (i) i.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') ccJoin(i.value); };
  for (const x of b.querySelectorAll('[data-cc]')) x.onclick = () => { try { sfx.ui(); } catch (e) {} const a = x.dataset.cc; if (a === 'host') ccJoin(ccCode()); else if (a === 'join') ccJoin(i && i.value); else if (a === 'leave') ccLeave(); };
}
(() => { const s = document.createElement('style'); s.textContent = `#ccBox{margin-top:12px;padding:10px 12px;border:1px solid rgba(90,200,255,.35);background:rgba(90,200,255,.05);text-align:left}#ccBox>b{display:block;font-size:12px;letter-spacing:.24em;color:#5ac8ff}#ccBox>span{font-size:11px;color:var(--dim)}#ccBox small{display:block;font-size:10px;color:var(--dim);margin-top:4px}#ccBox .cc-err{color:#ff7a6a}
.cc-row{display:flex;gap:6px;margin-top:8px;align-items:center}.cc-row .btn{padding:7px 12px;font-size:11px}.cc-row input{width:90px;padding:7px;background:#0b0e0d;border:1px solid var(--line);color:#fff;font:inherit;letter-spacing:.3em;text-transform:uppercase}`; document.head.appendChild(s); })();
