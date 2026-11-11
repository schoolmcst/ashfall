/* ================================================================== HOTBOX HORDE CO-OP (1.2.108, the owner's list 56-57): up to 4 players
   In the HOTBOX HORDE lobby: HOST CO-OP makes a 5-letter code; friends type it and JOIN (desktop app). Whatever the host
   starts - a mission or THE HOMESTEAD - the friends follow into it. The host runs everything (the burnouts, the waves, the
   plant, the objective, the end); friends see copies of the burnouts and nests ("proxies") and their hits go to the host
   as records. Friends can BUILD: their piece is sent to the host, who places it (the friend pays the materials). Burnouts
   that hit a friend's avatar on the host hurt the friend. At the end every player gets their own pay. Visiting a friend's
   HOMESTEAD shows the host's base (nothing of it is saved on the friend's side); friends help with raids and building but
   can't use the host's stations, plots or move things.
   Presence: hc 1, n, g (game id), x y z yw, a, hs hits [id, dmg, head, seq], br build requests [seq, rec]
   Host adds: ho, st 'wait'|'play'|'done', w (won), k (kind), mp (map), mi, gid, en [id, x, z, y, yaw*100, kind, hp%],
   pc (pieces) + pv (their version), ui [bar small, bar width, bar text, plant%], ht [peer, dmg, seq] (hits on friends), bl (base layout, base only) */
const HC_MAX = 4;
const HC = { on: false, room: null, conn: 'off', err: '', me: '', code: '', gid: 0, st: 'wait', inGame: false, rem: new Map(), prox: new Map(), pend: new Map(), hs: [], hseq: 0, eid: 0, timer: null, br: [], brSeq: 0, ht: [], htSeq: 0, pv: 0, pcKey: '', seenHt: 0 };
const hcHost = () => !!(HC.room && HC.room.host);
const hcClient = () => HC.on && HC.inGame && !hcHost() && M && M.hh && M.hh.client;
const hcHosting = () => HC.on && HC.inGame && hcHost() && M && M.hh;
async function hcJoin(code) {
  if (HC.on || HC.conn === 'connecting') return;
  if (!NET.app) { HC.err = 'CO-OP NEEDS THE DESKTOP APP'; hhRender(); return; }
  code = String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5); if (code.length !== 5) { HC.err = 'TYPE THE 5-LETTER CODE'; hhRender(); return; }
  HC.err = ''; HC.conn = 'connecting'; hhRender(); let room = null;
  try { room = await P2P.aside('code', 'horde', 'hh' + code.toLowerCase()); } catch (e) { HC.conn = 'off'; HC.err = 'COULD NOT REACH THE MATCH SERVICE'; hhRender(); return; }
  Object.assign(HC, { on: true, room, conn: 'in', me: room.me, code, inGame: false, gid: 0, st: 'wait', joinedT: performance.now() });
  HC.rem.clear(); clearInterval(HC.timer); HC.timer = setInterval(hcTick, 50); hcPublish(); hhRender(); try { sfx.ui(); } catch (e) {}
}
function hcLeave() { clearInterval(HC.timer); HC.timer = null; const r = HC.room; HC.room = null; if (r) try { r.leave(); } catch (e) {} for (const R of HC.rem.values()) hcDropAv(R); HC.rem.clear(); hcClearProx(); Object.assign(HC, { on: false, conn: 'off', inGame: false, gid: 0, st: 'wait' }); try { if (HHL.on && curScreen === 'lobby') hhRender(); } catch (e) {} }
const hcCode = () => { const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; let s = ''; for (let i = 0; i < 5; i++) s += L[(Math.random() * L.length) | 0]; return s; };
function hcTick() {
  if (!HC.on || !HC.room) return;
  try {
    if (HC.room.closed) { hcLeave(); return; }
    if (!hcHost() && performance.now() - HC.joinedT > 2500 && HC.room.order.indexOf(HC.me) >= HC_MAX) { hcLeave(); HC.err = 'THAT GAME IS FULL'; return; }
    if (HC.inGame && (!M || M.mode !== 'hh')) { HC.inGame = false; if (hcHost()) HC.st = 'wait'; }
    hcRead(); hcPublish();
  } catch (e) { try { reportError(e); } catch (er) {} }
}
const HC_KINDS = Object.keys(HH_KINDS);
function hcRead() {
  const host = hcHost(), seen = new Set(); let Hp = null;
  for (const p of HC.room.peers()) {
    if (p.sameTab) continue; const pr = p.presence || {}; if (!pr.hc) continue; seen.add(p.peer);
    let R = HC.rem.get(p.peer); if (!R) { R = { peer: p.peer, av: null, seenHit: 0, seenBr: 0 }; HC.rem.set(p.peer, R); try { if (HC.inGame) feedLine(`<b>${cleanNick(pr.n)}</b> <span class="fw">JOINED</span>`); } catch (e) {} }
    R.pr = pr; R.n = cleanNick(pr.n); R.ho = !!pr.ho; R.inGame = HC.inGame && pr.g === HC.gid && HC.gid;
    R.x = netNum(pr.x, -ARENA, ARENA); R.y = netNum(pr.y, -5, 40); R.z = netNum(pr.z, -ARENA, ARENA); R.yw = netNum(pr.yw, -1e4, 1e4); R.a = !!pr.a;
    if (R.ho) Hp = pr;
    if (host && R.inGame && M.hh) {
      if (Array.isArray(pr.hs)) for (const h of pr.hs) { const seq = +h[3] | 0; if (seq <= R.seenHit) continue; R.seenHit = seq; const e = enemies.find(q => q.hcId === (h[0] | 0)); if (e && enemies.includes(e)) try { damageEnemy(e, clamp(+h[1] || 0, 0, 600), !!h[2], null, false, hcBy(R)); } catch (er) {} }
      if (Array.isArray(pr.br)) for (const b of pr.br) { const seq = +b[0] | 0; if (seq <= R.seenBr) continue; R.seenBr = seq; hcApplyBuild(b[1], R); }
    }
  }
  for (const [k, R] of HC.rem) if (!seen.has(k)) { hcDropAv(R); HC.rem.delete(k); }
  const key = [...HC.rem.values()].map(R => R.n).join(','); if (key !== HC.boxKey) { HC.boxKey = key; try { if (HHL.on && curScreen === 'lobby') hhRender(); } catch (e) {} }
  if (!host && Hp) hcFollowHost(Hp);
}
function hcBy(R) { if (!R.av) return 'world'; return R.av; }
// the host places a friend's piece (the friend already paid)
function hcApplyBuild(rec, R) {
  const H = M.hh; if (!H || !rec || typeof rec !== 'object') return; const id = String(rec.id || '');
  if (!['wall', 'floor', 'ramp', 'half', 'rail', 'roof', 'barricade', ...Object.keys(HH_TRAPS)].includes(id)) return;
  const r2 = { id, ix: clamp(rec.ix | 0, -20, 20), iz: clamp(rec.iz | 0, -20, 20), lv: clamp(rec.lv | 0, 0, 4), dir: clamp(rec.dir | 0, 0, 3), up: !!rec.up, mat: HH_MAT[rec.mat] ? rec.mat : (HH_TRAPS[id] && id !== 'barricade' ? null : 'wood') };
  const a = hhSpec(r2.id, r2.ix, r2.iz, r2.lv, r2.dir, r2.up); if (a.key.split('|').some(k => H.slots.has(k)) || (H.base && hhPropHit(a))) return;
  hhPieceMake(r2); if (H.base && id !== 'barricade') { H.s.base.pieces.push(r2); hhSave(H.s); } try { showMsg(`${R.n || 'A FRIEND'} BUILT A ${(hhPieceList().find(x => x.id === id) || { n: 'PIECE' }).n}`); } catch (e) {}
}
const hcPk = r => [r.id, r.ix, r.iz, r.lv | 0, r.dir | 0, r.up ? 1 : 0, r.mat || '', r.v | 0, r.c | 0];
const hcUnpk = a => ({ id: String(a[0]), ix: a[1] | 0, iz: a[2] | 0, lv: a[3] | 0, dir: a[4] | 0, up: !!a[5], mat: a[6] || null, v: a[7] | 0, c: a[8] | 0 });
function hcPublish() {
  const H = M && M.hh, inG = HC.inGame && H;
  for (const [id, h] of HC.pend) { HC.hseq++; HC.hs.push([id, Math.round(h.d), h.h ? 1 : 0, HC.hseq]); } HC.pend.clear(); while (HC.hs.length > 24) HC.hs.shift(); while (HC.br.length > 12) HC.br.shift();
  const o = { hc: 1, n: NET.nick, g: inG ? HC.gid : 0, x: r2(P.x), y: r2(P.y || 0), z: r2(P.z), yw: r3(P.yaw), a: inG && playerAlive() ? 1 : 0, hs: HC.hs, br: HC.br };
  if (hcHost()) {
    Object.assign(o, { ho: 1, st: HC.st, gid: HC.gid, k: HC.k, mp: HC.mp, mi: HC.mi, w: HC.won ? 1 : 0, ht: HC.ht });
    if (inG) {
      o.en = []; for (const e of enemies) { if (!(e.hhMob || e.nest) || e.hcProx) continue; if (!e.hcId) e.hcId = ++HC.eid; const g = e.group.position; o.en.push([e.hcId, r2(g.x), r2(g.z), r2(g.y), Math.round(e.group.rotation.y * 100), e.nest ? -1 : HC_KINDS.indexOf(e.hk), Math.round(clamp(e.hp / (e.maxHp || 1), 0, 1) * 100)]); if (o.en.length >= 45) break; }
      const recs = H.pieces.filter(p => p.rec).map(p => hcPk(p.rec)), key = JSON.stringify(recs); if (key !== HC.pcKey) { HC.pcKey = key; HC.pv++; HC.pcs = recs; } o.pv = HC.pv; o.pc = HC.pcs;
      const b = $('hhBar'); o.ui = b ? [b.querySelector('small').textContent, b.querySelector('i').style.width, b.querySelector('span').textContent, H.plant ? Math.round(H.plant.hp / H.plant.max * 100) : -1, b.style.display === 'none' ? 0 : 1] : null;
      if (H.base && (HC.blT = (HC.blT || 0) - 1) <= 0) { HC.blT = 40; o.bl = H.s.base.props.map(p => [p.id, p.k, r2(p.x), r2(p.z), r2(p.y || 0), p.r | 0]); o.blv = H.s.base.lv; }
    }
  }
  HC.room.presence(o);
}
/* ---------- the host: start whatever HOTBOX HORDE match it starts, for everyone */
const _hcStart = startMatch;
startMatch = function (mode, custom) {
  const hosting = mode === 'hh' && HC.on && hcHost(), cl = mode === 'hh' && custom && custom.hcClient;
  if (hosting) { const c = custom || {}; HC.st = 'play'; HC.gid = 1 + ((Math.random() * 1e9) | 0); HC.k = c.hhKind || 'base'; HC.mi = hhLoad().mis | 0; HC.inGame = true; HC.eid = 0; HC.pv = 0; HC.pcKey = ''; HC.won = false; HC.blT = 0; HC.pcT = 0; }
  const r = _hcStart.apply(this, arguments);
  if ((hosting || cl) && M && M.mode === 'hh') { if (hosting) HC.mp = curMap;
    // friends take the crew bots' places: the host keeps 3 minus friends, a friend keeps none
    const keep = cl ? 0 : Math.max(0, 3 - [...HC.rem.values()].length); let n = 0;
    M.entries = M.entries.filter(en => { if (en.isPlayer) return true; if (n++ < keep) return true; if (en.bot) { const i = enemies.indexOf(en.bot); if (i >= 0) enemies.splice(i, 1); scene.remove(en.bot.group); } return false; }); }
  return r;
};
/* ---------- a friend: follow the host */
function hcFollowHost(Hp) {
  if (Hp.st === 'play' && Hp.gid && Hp.gid !== HC.gid && Hp.mp) {
    if (Hp.k === 'base' && !Array.isArray(Hp.bl)) return;   // wait for the host's base layout
    HC.gid = Hp.gid; HC.inGame = true; hcClearProx(); HC.allowEnd = false; HC.seenHt = 0; HC.myPv = -1;
    HC.visit = Hp.k === 'base' ? { props: Hp.bl.map(a => ({ id: a[0] | 0, k: String(a[1]), x: +a[2], z: +a[3], y: +a[4], r: a[5] | 0 })).filter(p => HH_PROPS[p.k]), lv: clamp(Hp.blv | 0, 1, 5) } : null;
    try { HHL.on = true; startMatch('hh', { map: Hp.mp, hhKind: Hp.k, hcClient: true }); } catch (e) { reportError(e); } return;
  }
  if (!hcClient()) return; const H = M.hh;
  if (Hp.st === 'done' && !H.over && Hp.gid === HC.gid) { HC.allowEnd = true; try { hhEnd(!!Hp.w); } catch (e) { reportError(e); } return; }
  // hits on me from the host's burnouts
  if (Array.isArray(Hp.ht)) for (const h of Hp.ht) { const seq = h[2] | 0; if (h[0] !== HC.me || seq <= HC.seenHt) continue; HC.seenHt = seq; if (playerAlive()) try { hurtPlayer(clamp(+h[1] || 0, 0, 200), Hp.x || P.x, Hp.z || P.z); } catch (e) {} }
  // the burnouts as proxies
  const live = new Set();
  for (const q of (Array.isArray(Hp.en) ? Hp.en : []).slice(0, 45)) { const id = q[0] | 0; live.add(id); let e = HC.prox.get(id);
    if (!e) { if ((q[5] | 0) < 0) { e = hhNestMake({ x: +q[1], z: +q[2], y: +q[3], g: null }); } else { e = hhMob(HC_KINDS[q[5] | 0] || 'burnout', +q[1], +q[2], +q[3]); H.mobs.splice(H.mobs.indexOf(e), 1); } Object.assign(e, { hcProx: true, hcId: id }); HC.prox.set(id, e); }
    e.tx = +q[1]; e.tz = +q[2]; e.ty = +q[3]; e.tyaw = (+q[4] || 0) / 100; e.hcHp = q[6] | 0; }
  for (const [id, e] of HC.prox) if (!live.has(id)) hcDropProx(id, e);
  // the pieces
  if ((Hp.pv | 0) !== HC.myPv && Array.isArray(Hp.pc)) { HC.myPv = Hp.pv | 0; hcSyncPieces(Hp.pc.map(hcUnpk)); }
  HC.ui = Hp.ui;
}
function hcSyncPieces(list) {
  const H = M.hh, want = new Map(); for (const r of list) { try { const a = hhSpec(r.id, r.ix, r.iz, r.lv, r.dir, r.up); want.set(a.key, r); } catch (e) {} }
  for (const p of H.pieces.slice()) { const r = want.get(p.key); if (!r || r.mat !== (p.rec.mat || null) || (r.v | 0) !== (p.rec.v | 0) || (r.c | 0) !== (p.rec.c | 0)) hhPieceRemove(p); else want.delete(p.key); }
  for (const r of want.values()) try { hhPieceMake(r, true); } catch (e) {} try { rebuildBoxGrid(); } catch (e) {}
}
function hcDropProx(id, e) { HC.prox.delete(id); const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); if (e.nest) { if (e.group.parent) e.group.parent.remove(e.group); return; } if (e.hcHp > 0) { try { dying.push({ e, t: 0, boom: false, dx: 0, dz: 0, head: false, a: [1, 1, 0, 0] }); } catch (er) { scene.remove(e.group); } } else scene.remove(e.group); }
function hcClearProx() { for (const [id, e] of HC.prox) { const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); if (e.group.parent) e.group.parent.remove(e.group); } HC.prox.clear(); }
/* ---------- the friend's match: the host's base (not saved here), no spawning, no ending of its own */
const _hcLoad = hhLoad;
hhLoad = function () { const s = _hcLoad.apply(this, arguments); if (HC.visitNow) { s.base = Object.assign({}, s.base, { props: HC.visit.props.map(p => Object.assign({}, p)), pieces: [], plots: {}, lv: HC.visit.lv }); } return s; };
const _hcSetup = hhSetup;
hhSetup = function () {
  const cl = !!(M.cfg && M.cfg.hcClient); HC.visitNow = cl && !!HC.visit;
  const r = _hcSetup.apply(this, arguments); HC.visitNow = false; const H = M.hh; if (!H) return r;
  if (cl) { H.client = true; H.noSave = !!HC.visit; H.phase = 'client'; H.t = 1e9; for (const p of H.pieces.slice()) hhPieceRemove(p); for (const R of H.rifts) { R.g.visible = false; if (R.nest) { const i = enemies.indexOf(R.nest); if (i >= 0) enemies.splice(i, 1); if (R.nest.group.parent) R.nest.group.parent.remove(R.nest.group); R.nest = null; } }
    for (const R of H.huntNests || []) if (R.nest) { const i = enemies.indexOf(R.nest); if (i >= 0) enemies.splice(i, 1); if (R.nest.group.parent) R.nest.group.parent.remove(R.nest.group); R.nest = null; R.closed = true; }
    H.caches = H.caches && []; H.growers = []; if (H.truck) { H.truck.g.parent && H.truck.g.parent.remove(H.truck.g); H.truck = null; } if (H.boxes) H.boxes = []; }
  return r;
};
const _hcSave = hhSave;
hhSave = function (s) { if (HH.cur && HH.cur.noSave && s === HH.cur.s) return; return _hcSave.apply(this, arguments); };
const _hcEnd = hhEnd;
hhEnd = function (won) { const H = M.hh; if (H && H.client && !HC.allowEnd) return; if (hcHosting() && !H.over) { HC.st = 'done'; HC.won = !!won; try { hcPublish(); } catch (e) {} } return _hcEnd.apply(this, arguments); };
const _hcHS = hhHuntSpawn; hhHuntSpawn = function () { if (M && M.hh && M.hh.client) return; return _hcHS.apply(this, arguments); };
const _hcST = hhSupplyTick; hhSupplyTick = function () { if (M && M.hh && M.hh.client) return; return _hcST.apply(this, arguments); };
const _hcRS = hhRaidStart; hhRaidStart = function () { if (M && M.hh && M.hh.client) { showMsg('ONLY THE HOST STARTS A RAID'); return; } return _hcRS.apply(this, arguments); };
const _hcSW = hhStartWave; hhStartWave = function () { if (M && M.hh && M.hh.client) return; return _hcSW.apply(this, arguments); };
const _hcMO = hhMenuOpen;
hhMenuOpen = function (kind) { if (M.hh && M.hh.client && M.hh.base) { showMsg("THIS IS YOUR FRIEND'S BASE · ONLY THEY USE THE STATIONS"); return; } return _hcMO.apply(this, arguments); };
const _hcPU = hhPlotUse;
hhPlotUse = function (p) { if (M.hh && M.hh.client) { showMsg("YOUR FRIEND'S PLANTS · HANDS OFF"); return; } return _hcPU.apply(this, arguments); };
const _hcPick = hhPickUp;
hhPickUp = function () { if (M.hh && M.hh.client) { showMsg('ONLY THE HOST MOVES THINGS'); return; } return _hcPick.apply(this, arguments); };
// a friend's build goes to the host
const _hcPlace = hhPlace;
hhPlace = function () {
  const H = M.hh; if (!H || !H.client) return _hcPlace.apply(this, arguments);
  const L = hhPieceList(), P0 = L[HH.piece] || L[0], a = hhAim(); if (a.prop) { showMsg('ONLY THE HOST PLACES PLOTS AND GEAR'); return null; }
  if (!hhValid(a) || !hhCan(P0)) { try { showMsg(!hhCan(P0) ? 'NOT ENOUGH MATERIALS' : "CAN'T BUILD THERE"); } catch (e) {} return null; }
  if (P0.trap) H.s.traps[P0.id]--; else hhPay(H.s, hhCost(P0)); if (!H.noSave) hhSave(H.s);
  HC.brSeq++; HC.br.push([HC.brSeq, { id: a.id, ix: a.ix, iz: a.iz, lv: a.lv, dir: a.dir, up: !!a.up, mat: a.id === 'barricade' ? 'wood' : P0.trap ? null : HH.mat }]); try { tone(330, 0.06, 0.05, 'triangle'); } catch (e) {} return null;
};
/* ---------- damage: friends' hits on proxies go to the host; the host's burnouts hitting a friend's avatar hurt the friend */
const _hcDmg = damageEnemy;
damageEnemy = function (e, dmg, head, dir, boom, by = 'player') {
  if (e && e.hcProx) { if (by === 'player') { const h = HC.pend.get(e.hcId) || { d: 0, h: false }; h.d += dmg; h.h = h.h || !!head; HC.pend.set(e.hcId, h); e.flinch = 1; try { fbMarker(true, false, head); sfx.hit(head); } catch (er) {} } return false; }
  if (e && e.hcAv) { HC.htSeq++; HC.ht.push([e.hcAv, Math.round(dmg), HC.htSeq]); while (HC.ht.length > 16) HC.ht.shift(); return false; }
  return _hcDmg.apply(this, arguments);
};
/* ---------- every frame: proxies move, avatars on the host, the friend's top bar */
function hcFrame(dt) {
  if (!HC.on || !M || M.mode !== 'hh' || !M.hh) return; const H = M.hh;
  if (hcClient()) {
    for (const e of HC.prox.values()) { const g = e.group, ox = g.position.x, oz = g.position.z, k = Math.min(1, dt * 10);
      if (Math.hypot(e.tx - ox, e.tz - oz) > 5) g.position.set(e.tx, e.ty, e.tz); else { g.position.x += (e.tx - ox) * k; g.position.z += (e.tz - oz) * k; g.position.y += (e.ty - g.position.y) * k; }
      if (e.nest) continue; let dy = e.tyaw - g.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; g.rotation.y += dy * Math.min(1, dt * 10);
      const sp = dt > 0 ? Math.min(6, Math.hypot(g.position.x - ox, g.position.z - oz) / dt) : 0; try { animZombie(e, dt, sp); } catch (er) {} e.hp = Math.max(1, e.hcHp); e.maxHp = 100; }
    const b = $('hhBar'), U = HC.ui; if (b && Array.isArray(U)) { b.style.display = U[4] ? '' : 'none'; b.querySelector('small').textContent = String(U[0] || ''); b.querySelector('i').style.width = String(U[1] || '0%'); b.querySelector('span').textContent = String(U[2] || ''); if (H.plant && U[3] >= 0) H.plant.hp = H.plant.max * U[3] / 100; }
  }
  if (hcHosting()) for (const R of HC.rem.values()) hcAvatar(R, dt);
}
setInterval(() => { try { hcFrame(0.05); } catch (e) {} }, 50);
function hcAvatar(R, dt) {
  if (!R.inGame || !R.a) { hcDropAv(R); return; }
  if (!R.av) { const e = makeEnemy('rifleman', R.x, R.z); e.group.position.y = R.y; try { e.group.add(friendlyMarker()); } catch (er) {} e.aim = 1; e.holding = true; e.team = M.myTeam; e.hcAv = R.peer; e.net = 'hc:' + R.peer; e.entry = { name: R.n || 'FRIEND', team: M.myTeam, kills: 0, deaths: 0, score: 0, alive: true }; R.av = e; enemies.push(e); }
  const g = R.av.group, ox = g.position.x, oz = g.position.z, k = Math.min(1, dt * 14);
  if (Math.hypot(R.x - ox, R.z - oz) > 6) g.position.set(R.x, R.y, R.z); else { g.position.x += (R.x - ox) * k; g.position.z += (R.z - oz) * k; g.position.y += (R.y - g.position.y) * k; }
  let dy = R.yw + Math.PI - g.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; g.rotation.y += dy * Math.min(1, dt * 16);
  const sp = dt > 0 ? Math.min(9, Math.hypot(g.position.x - ox, g.position.z - oz) / dt) : 0; try { animEnemy(R.av, dt, Math.min(6, sp)); } catch (er) {}
}
function hcDropAv(R) { if (R.av) { const i = enemies.indexOf(R.av); if (i >= 0) enemies.splice(i, 1); scene.remove(R.av.group); R.av = null; } }
/* ---------- the lobby box */
const _hcRender = hhRender;
hhRender = function () {
  const r = _hcRender.apply(this, arguments), ros = $('lobRoster'); if (!ros) return r; let b = $('hcBox'); if (!b) { b = document.createElement('div'); b.id = 'hcBox'; } ros.prepend(b);
  const peers = [...HC.rem.values()].map(R => R.n).filter(Boolean);
  b.innerHTML = !HC.on ? `<b>CO-OP · UP TO ${HC_MAX} PLAYERS</b><span>missions, raids and visits with friends (desktop app)</span><div class="cc-row"><button class="btn" data-hc="host">HOST CO-OP</button><input id="hcCode" maxlength="5" placeholder="CODE"><button class="btn" data-hc="join">JOIN</button><button class="btn" data-hc="lb">LEADERBOARD</button></div>${HC.conn === 'connecting' ? '<small>CONNECTING…</small>' : ''}${HC.err ? `<small style="color:#ff6a6a">${HC.err}</small>` : ''}`
    : `<b>CO-OP · CODE ${HC.code}</b><span>${hcHost() ? (peers.length ? `${peers.join(', ')} ${peers.length > 1 ? 'are' : 'is'} with you · start a mission or THE HOMESTEAD and they follow` : 'give your friends this code · waiting for them…') : `in ${peers.find(Boolean) || 'the host'}'s game · the host picks what to play`}</span><div class="cc-row"><button class="btn" data-hc="leave">LEAVE CO-OP</button><button class="btn" data-hc="lb">LEADERBOARD</button></div>`;
  const i = $('hcCode'); if (i) i.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') hcJoin(i.value); };
  for (const x of b.querySelectorAll('[data-hc]')) x.onclick = () => { try { sfx.ui(); } catch (e) {} const a = x.dataset.hc; if (a === 'host') hcJoin(hcCode()); else if (a === 'join') hcJoin(i && i.value); else if (a === 'leave') hcLeave(); else if (a === 'lb') { SOC.lbSort = 'horde'; openLeaderboard(); } };
  return r;
};
(() => { const s = document.createElement('style'); s.textContent = `#hcBox{margin-bottom:10px;padding:10px 12px;border:1px solid rgba(176,112,255,.4);background:rgba(176,112,255,.06);text-align:left}#hcBox>b{display:block;font-size:12px;letter-spacing:.24em;color:#c8a0ff}#hcBox>span{font-size:11px;color:var(--dim)}#hcBox small{display:block;margin-top:4px}#hcBox .cc-row{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}#hcBox .cc-row .btn{padding:6px 12px;font-size:11px}#hcBox input{width:90px;padding:6px 8px;background:rgba(0,0,0,.4);border:1px solid var(--line);color:#fff;letter-spacing:.3em;text-transform:uppercase}`; document.head.appendChild(s); })();
const _hcAct = hhAct;
hhAct = function (act) { if (HC.on && !hcHost() && (act === 'hh-start' || act === 'hh-base' || act === 'lob-start')) { try { showMsg('THE HOST PICKS WHAT TO PLAY'); HC.err = ''; } catch (e) {} return true; } return _hcAct.apply(this, arguments); };
