/* ================================================================== ZOMBIES CO-OP (desktop app): up to 4 survivors
   A P2P room of its own (the 'zomb' Quick Play slots, or a private code). The host runs the zombies and the rounds;
   everyone else draws copies of the host's zombies ("proxies") and sends their hits as records, which the host applies.
   Each survivor keeps their own points and guns. At 0 health a survivor goes DOWN; a teammate holds USE next to them for
   3 s to revive them. A survivor who bleeds out (30 s) comes back at the start of the next round. Everyone down = over.
   Presence (each player): n name, g game id (0 = lobby), x y z yw pt, a (in the game, not bled out), dn (down), sh shots,
     wn gun, pts, k kills, hs hits [zid, dmg, head, seq, boom, melee], rv revives [peer, seq]
   Host adds: ho, st 'wait'|'play'|'over', gid, mp map, ml lobby map choice, zr round, zl zombies left to spawn, za round
     running, zs zombies [zid, x, z, y, yaw*100, kind, swinging, hp%], zk kills [zid, killer, head, melee, seq],
     zt swings that hit a survivor [peer, dmg, seq, zid] */
const ZC_MAX = 4, ZC_DOWN = 30, ZC_REV = 3;
const ZC = { on: false, room: null, conn: 'off', err: '', me: '', inGame: false, gid: 0, st: 'wait', mp: '',
  hs: [], hseq: 0, pend: new Map(), rv: [], rvseq: 0, zk: [], kseq: 0, zt: [], aseq: 0,
  rem: new Map(), prox: new Map(), down: false, downT: 0, dead: false, revT: 0, revWho: '', sh: 0, k: 0,
  revNeed: ZC_REV, round: 0, left: 0, active: false, overT: 0, seenK: 0, seenA: 0, fresh: false, wasHost: false, timer: null, rosterKey: '' };
const zcHost = () => !!(ZC.room && ZC.room.host);
const zcInGame = () => ZC.on && ZC.inGame && M && M.mode === 'zomb';

/* ---------- joining and leaving the co-op room */
async function zcJoin(kind, code) {
  if (ZC.on || ZC.conn === 'connecting') return;
  if (!NET.app) { ZC.err = 'ONLINE CO-OP NEEDS THE DESKTOP APP'; zcLobbyRefresh(true); return; }
  ZC.err = ''; ZC.conn = 'connecting'; zcLobbyRefresh(true);
  let room = null;
  try { room = await P2P.aside(kind, 'zomb', code || ''); }
  catch (e) { ZC.conn = 'off'; ZC.err = e.message === 'timeout' || e.message === 'fail' ? 'COULD NOT REACH THE MATCH SERVICE' : String(e.message || 'COULD NOT JOIN').toUpperCase(); zcLobbyRefresh(true); return; }
  if (ZC.conn !== 'connecting') { room.leave(); return; }
  Object.assign(ZC, { on: true, room, conn: 'in', me: room.me, kind, code: code || '', inGame: false, gid: 0, st: 'wait', joinedT: performance.now() });
  ZC.rem.clear(); clearInterval(ZC.timer); ZC.timer = setInterval(zcTick, 50);
  zcPublish(); zcLobbyRefresh(true); try { sfx.ui(); } catch (e) {}
  if (kind !== 'code' && room.host) zcHostStart();   // Quick Play: no waiting room, others drop into your game
}
function zcLeave() {
  clearInterval(ZC.timer); ZC.timer = null;
  const r = ZC.room; ZC.room = null; if (r) try { r.leave(); } catch (e) {}
  for (const R of ZC.rem.values()) zcDropAvatar(R); ZC.rem.clear(); zcClearProxies();
  Object.assign(ZC, { on: false, conn: 'off', inGame: false, gid: 0, st: 'wait', down: false, dead: false });
  zcLobbyRefresh(true);
}

/* ---------- 20 times a second: read the room, apply what changed, publish my state */
function zcTick() {
  if (!ZC.on || !ZC.room) return;
  try {
    if (ZC.room.closed) { zcLeave(); return; }
    // the room is capped at four survivors: the fifth in line leaves
    if (!zcHost() && performance.now() - ZC.joinedT > 2500 && ZC.room.order.indexOf(ZC.me) >= ZC_MAX) { zcLeave(); ZC.err = 'THAT GAME IS FULL'; zcLobbyRefresh(true); return; }
    // left the game for the main menu: leave the room too
    if (!ZC.inGame && typeof curScreen !== 'undefined' && curScreen !== 'lobby' && curScreen !== 'over' && G.state === 'menu') { zcLeave(); return; }
    zcRead();
    if (zcHost() && !ZC.wasHost && ZC.inGame) zcBecomeHost();
    ZC.wasHost = zcHost();
    zcPublish();
    if (zcHost() && (ZC.lanT = (ZC.lanT || 0) - 0.05) <= 0) { ZC.lanT = 2; try { window.ASHFALL_APP.lan.announce({ slot: ZC.room.slot, name: NET.nick, mode: 'zomb', n: 1 + ZC.rem.size }); } catch (e) {} }
    if (!ZC.inGame && typeof curScreen !== 'undefined' && curScreen === 'lobby' && ZL.on) zcLobbyRefresh(false);
  } catch (e) { try { reportError(e); } catch (err) {} }
}
function zcHostPres() { if (zcHost()) return null; for (const R of ZC.rem.values()) if (R.ho) return R.pr; return null; }
function zcRead() {
  const peers = ZC.room.peers(), seen = new Set(), host = zcHost();
  for (const p of peers) {
    if (p.sameTab) continue;
    const pr = p.presence || {}; if (!pr.zc) continue;
    seen.add(p.peer);
    let R = ZC.rem.get(p.peer);
    if (!R) {
      R = { peer: p.peer, av: null, seenHit: zcMaxSeq(pr.hs, 3), seenRv: zcMaxSeq(pr.rv, 1), x: 0, y: 0, z: 0, yw: 0, pt: 0, sh: +pr.sh || 0 };
      ZC.rem.set(p.peer, R);
      if (ZC.inGame) feedLine(`<b>${cleanNick(pr.n)}</b> <span class="fw">JOINED</span>`);
    }
    R.pr = pr; R.n = cleanNick(pr.n); R.ho = !!pr.ho;
    R.inGame = ZC.inGame && ZC.gid && pr.g === ZC.gid;
    R.x = netNum(pr.x, -ARENA, ARENA); R.y = netNum(pr.y, -5, 20); R.z = netNum(pr.z, -ARENA, ARENA); R.yw = netNum(pr.yw, -1e4, 1e4); R.pt = netNum(pr.pt, -1.6, 1.6);
    const wasDn = R.dn, wasA = R.a; R.a = !!pr.a; R.dn = !!pr.dn; R.pts = +pr.pts | 0; R.k = +pr.k | 0; R.wn = String(pr.wn || '').slice(0, 24);
    if (R.inGame) {
      if (R.dn && !wasDn) feedLine(`<b>${R.n}</b> <span class="ft">IS DOWN</span>`);
      if (!R.a && wasA && wasDn) feedLine(`<b>${R.n}</b> <span class="ft">BLED OUT</span>`);
    }
    if (R.inGame) zvRemote(R);
    zcReadShared(R, !host && R.ho);
    if (R.inGame) { if (host) zsFromPeer(R); else if (R.ho) zsFromHost(R.pr); }
    // revives aimed at me
    if (Array.isArray(pr.rv)) for (const v of pr.rv) { if (!Array.isArray(v) || (+v[1] || 0) <= R.seenRv) continue; R.seenRv = +v[1] || 0; if (v[0] === ZC.me && ZC.down && !ZC.dead) zcRevived(R); }
    // doors someone else bought (the host collects them; everyone follows the host's list)
    if (host && R.inGame && Array.isArray(pr.od)) for (const id of pr.od) if (!ZD.open.has(+id)) zdOpen(+id, false);
    // the host applies everyone's hits on its zombies
    if (Array.isArray(pr.hs)) for (const h of pr.hs) {
      if (!Array.isArray(h) || (+h[3] || 0) <= R.seenHit) continue; R.seenHit = +h[3] || 0;
      if (!host || !R.inGame) continue;
      const e = enemies.find(z => z.zombie && !z.proxy && z.zid === +h[0]); if (!e) continue;
      const d = new THREE.Vector3(e.group.position.x - R.x, 0, e.group.position.z - R.z); if (d.lengthSq() < 1e-4) d.set(0, 0, 1); d.normalize();
      damageEnemy(e, netNum(h[1], 0, 2000), !!h[2], d, !!h[4], { zc: p.peer, melee: !!h[5] });
    }
    // their shots: muzzle flash and tracer from their soldier
    const sh = +pr.sh | 0; if (sh > R.sh) { const n = Math.min(2, sh - R.sh); R.sh = sh; if (R.av && R.inGame) for (let i = 0; i < n; i++) try { netRemoteShot({ bot: R.av, yw: R.yw, pt: R.pt, far: 70 }); } catch (e) {} }
  }
  for (const [peer, R] of ZC.rem) if (!seen.has(peer)) { zcDropAvatar(R); ZC.rem.delete(peer); if (ZC.inGame && R.n) feedLine(`<b>${R.n}</b> <span class="fw">LEFT</span>`); }
  if (host) return;
  // ---- as a client: follow the host
  const H = zcHostPres(); if (!H) return;
  ZC.hostLobbyMap = typeof H.ml === 'string' ? H.ml : ''; ZC.hostStory = H.so !== 0;
  if (H.st === 'play' && +H.gid && +H.gid !== ZC.gid && typeof H.mp === 'string' && MAPS[H.mp]) { zcEnterGame(H.mp, +H.gid); return; }
  if (!ZC.inGame || +H.gid !== ZC.gid) return;
  if (ZC.fresh) { ZC.fresh = false; ZC.seenK = zcMaxSeq(H.zk, 4); ZC.seenA = zcMaxSeq(H.zt, 2); }
  const zr = Math.max(ZC.round, +H.zr | 0);
  if (zr > ZC.round) zcClientRound(zr);
  if (ZC.active && !H.za && zr === ZC.round && zr > 0) { showBanner(`ROUND ${zr} SURVIVED`, 'next round in 8 seconds'); zvSay('roundEnd', 0.3); }
  if (Array.isArray(H.zd)) for (const id of H.zd) if (!ZD.open.has(+id)) zdOpen(+id, false);
  ZC.round = zr; ZC.left = +H.zl | 0; ZC.active = !!H.za; Z.round = zr; G.wave = zr;
  // kills (mine get the points)
  const killed = new Set();
  if (Array.isArray(H.zk)) for (const k of H.zk) {
    if (!Array.isArray(k) || (+k[4] || 0) <= ZC.seenK) continue; ZC.seenK = +k[4] || 0;
    const e = ZC.prox.get(+k[0]); killed.add(+k[0]);
    if (k[1] === ZC.me) zcMyKill(e, !!k[2], !!k[3]);
    if (e) zcProxyDie(e, !!k[2]);
  }
  // swings that hit me
  if (Array.isArray(H.zt)) for (const a of H.zt) {
    if (!Array.isArray(a) || (+a[2] || 0) <= ZC.seenA) continue; ZC.seenA = +a[2] || 0;
    if (a[0] !== ZC.me) continue;
    const e = ZC.prox.get(+a[3]); G.killer = null;
    hurtPlayer(netNum(a[1], 0, 200), e ? e.group.position.x : P.x, e ? e.group.position.z : P.z + 1);
    try { sfx.melee && sfx.melee(); } catch (err) {}
  }
  // the zombie list
  const list = Array.isArray(H.zs) ? H.zs : [], ids = new Set();
  for (const z of list) {
    if (!Array.isArray(z)) continue;
    const id = +z[0]; if (killed.has(id)) continue; ids.add(id);
    let e = ZC.prox.get(id);
    if (!e) e = zcMakeProxy(id, z);
    e.tx = netNum(z[1], -ARENA, ARENA); e.tz = netNum(z[2], -ARENA, ARENA); e.ty = netNum(z[3], -5, 20); e.tyaw = (+z[4] || 0) / 100;
    if (z[6] && !(e.atkT > 0)) { e.atkT = 0.75; if (Math.random() < 0.6) try { sfx.zscreech(at(e.group.position.x, e.group.position.z, 14, e.group.position.y)); } catch (err) {} }
    e.frac = netNum(z[7], 0, 100, 100) / 100; if (e.php === undefined || e.php > e.maxHp * e.frac + 1) e.php = e.maxHp * e.frac;
  }
  for (const [id, e] of ZC.prox) if (!ids.has(id) && !killed.has(id)) { ZC.prox.delete(id); const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); scene.remove(e.group); }
  if (H.st === 'over' && ZC.inGame && G.state !== 'dead') zcGameOver();
}
const zcMaxSeq = (list, i) => Array.isArray(list) ? list.reduce((m, h) => Math.max(m, Array.isArray(h) ? (+h[i] || 0) : 0), 0) : 0;

function zcPublish() {
  const inG = zcInGame(), w = inG ? WEAPONS[G.cur] : null;
  // my hits since the last publish, one record per zombie
  for (const [zid, h] of ZC.pend) { ZC.hseq++; ZC.hs.push([zid, Math.round(h.d), h.h ? 1 : 0, ZC.hseq, h.b ? 1 : 0, h.m ? 1 : 0]); }
  ZC.pend.clear(); while (ZC.hs.length > 24) ZC.hs.shift();
  const o = { zc: 1, n: NET.nick, g: inG ? ZC.gid : 0, x: r2(P.x), y: r2(P.y || 0), z: r2(P.z), yw: r3(P.yaw), pt: r3(P.pitch),
    a: inG && !ZC.dead && G.state !== 'dead' ? 1 : 0, dn: inG && ZC.down ? 1 : 0, sh: ZC.sh, wn: w ? w.name : '', pts: G.points | 0, k: ZC.k, hs: ZC.hs, rv: ZC.rv, od: inG ? [...ZD.mine] : [], ch: ZL.char, vl: ZV.out, pk: inG ? ZC.pk : [], ev: inG ? ZC.ev : [], qi: inG ? [...ZS.mine] : [] };
  if (zcHost()) {
    Object.assign(o, { ho: 1, st: ZC.st, gid: ZC.gid, mp: ZC.mp, ml: ZL.map, so: ZL.story ? 1 : 0, zr: Z.round, qf: inG ? [...ZS.flags] : [], qc: inG ? +ZS.cook.toFixed(3) : -1, qb: inG && ZS.bloodItem && ZS.bloodItem.g ? [r2(ZS.bloodItem.at.x), r2(ZS.bloodItem.at.z), r2(ZS.bloodItem.at.y)] : 0, zd: inG ? [...ZD.open] : [], dp: inG ? [...ZC.drops].filter(([, d]) => performance.now() - d.t < 40000).map(([id, d]) => [id, r2(d.x), r2(d.z), r2(d.y)]) : [], zl: inG ? Z.toSpawn : 0, za: inG && Z.active ? 1 : 0, zk: ZC.zk, zt: ZC.zt });
    o.zs = inG ? enemies.filter(e => e.zombie && !e.proxy).map(e => { const g = e.group.position; return [e.zid, r2(g.x), r2(g.z), r2(g.y), Math.round(e.group.rotation.y * 100), e.boss ? 3 : e.kind === 'run' ? 2 : e.kind === 'jog' ? 1 : 0, e.atkT > 0 ? 1 : 0, Math.round(clamp(e.hp / e.maxHp, 0, 1) * 100)]; }) : [];
  }
  ZC.room.presence(o);
}

/* ---------- starting, ending */
function zcHostStart() {
  if (!zcHost()) return;
  const mp = zmapIs(ZL.map) ? ZL.map : 'blackwell';
  ZC.mp = mp; ZC.st = 'play'; ZC.zk = []; ZC.zt = [];
  zcEnterGame(mp, 1 + ((Math.random() * 1e9) | 0));
}
function zcEnterGame(mp, gid) {
  ZC.gid = gid; ZC.inGame = true; ZC.down = ZC.dead = false; zcResetShared(); ZC.round = 0; ZC.active = false; ZC.fresh = true; ZC.k = 0; ZC.overT = 0;
  zcClearProxies();
  for (const R of ZC.rem.values()) zcDropAvatar(R);
  startMatch('zomb', { map: mp, coop: true });
}
// called by zombStart in co-op: spread the survivors out, clients wait for the host's rounds
function zcStartLocal() {
  const i = Math.max(0, ZC.room.order.indexOf(ZC.me)), a = i * 1.9;
  P.x += Math.cos(a) * Math.min(1, i) * 1.4; P.z += Math.sin(a) * Math.min(1, i) * 1.4;
  if (!zcHost()) { Z.active = false; Z.breakT = 1e9; }
  else { Z.zid = 0; }
  zcTeamHud(true);
}
function zcGameOver() {
  ZC.inGame = false; ZC.down = false;
  if (zcHost()) ZC.st = 'over';
  if (G.state !== 'playing') G.state = 'playing';
  finishDeath();
  const mates = [...ZC.rem.values()].filter(R => R.pr && R.pr.g === ZC.gid);
  $('overStats').textContent = `SQUAD WIPED ON ROUND ${Z.round}  ·  YOUR KILLS ${G.kills}  ·  SCORE ${G.score}` + (mates.length ? '  ·  ' + mates.map(R => `${R.n} ${R.k}`).join('  ·  ') : '');
  zcClearProxies();
  for (const R of ZC.rem.values()) zcDropAvatar(R);
}
// REDEPLOY on the game-over screen: the host starts a new game for everyone; others go back to the lobby to wait
function zcRedeploy() { if (zcHost()) zcHostStart(); else { toLobby(); } }
// the old host left in the middle of a game and I was next in line: take over their zombies and rounds
function zcBecomeHost() {
  let maxId = 0;
  for (const e of ZC.prox.values()) { e.proxy = false; e.maxHp = zombHp(Math.max(1, ZC.round)); e.hp = e.maxHp * (e.frac || 1); maxId = Math.max(maxId, e.zid); }
  ZC.prox.clear();
  Object.assign(Z, { round: ZC.round, toSpawn: ZC.left, active: ZC.active, breakT: 6, spawnT: 1, zid: maxId + 1000 });
  ZC.st = 'play'; ZC.mp = curMap; ZC.zk = []; ZC.zt = [];
  showBanner('YOU ARE THE HOST NOW', 'the old host left');
}

/* ---------- the host's side: who the zombies chase, their swings, kills */
function zombTargets() {
  const t = [];
  if (!ZC.on || (!ZC.down && !ZC.dead && (G.state === 'playing' || G.state === 'paused'))) t.push({ x: P.x, y: P.y || 0, z: P.z, me: true });
  if (zcInGame()) for (const R of ZC.rem.values()) if (R.inGame && R.a && !R.dn) t.push({ x: R.x, y: R.y, z: R.z, peer: R.peer });
  return t;
}
function zcSwing(peer, dmg, e) { ZC.aseq++; ZC.zt.push([peer, dmg, ZC.aseq, e.zid]); while (ZC.zt.length > 12) ZC.zt.shift(); }
function zcKilled(e, by, head) {
  if (!zcHost() || !e.zid) return;
  const killer = by === 'player' ? ZC.me : by && by.zc ? by.zc : '', melee = by === 'player' ? G.meleeT > 0 : !!(by && by.melee);
  ZC.kseq++; ZC.zk.push([e.zid, killer, head ? 1 : 0, melee ? 1 : 0, ZC.kseq]); while (ZC.zk.length > 16) ZC.zk.shift();
  if (by === 'player') ZC.k++;
}
function zcHostFrame(dt) {
  // everyone down or bled out: game over for the whole squad
  const meUp = !ZC.down && !ZC.dead, anyUp = meUp || [...ZC.rem.values()].some(R => R.inGame && R.a && !R.dn);
  if (!anyUp && ZC.st === 'play') { ZC.overT += dt; if (ZC.overT > 1.2) zcGameOver(); } else ZC.overT = 0;
}

/* ---------- the client's side: copies of the host's zombies */
function zcMakeProxy(id, z) {
  const e = makeZombie(+z[1] || 0, +z[2] || 0, +z[3] || 0);
  e.kind = ['walk', 'jog', 'run', 'run'][+z[5] | 0] || 'walk'; if (+z[5] === 3) try { zsMakeBoss(e); } catch (err) {} e.proxy = true; e.zid = id; e.hp = 1e9; e.maxHp = zombHp(Math.max(1, ZC.round));
  e.group.rotation.y = (+z[4] || 0) / 100; e.tx = e.group.position.x; e.tz = e.group.position.z; e.ty = e.group.position.y; e.tyaw = e.group.rotation.y;
  ZC.prox.set(id, e); return e;
}
function zcClientFrame(dt) {
  for (const e of ZC.prox.values()) {
    const g = e.group, ox = g.position.x, oz = g.position.z, k = Math.min(1, dt * 10);
    if (Math.hypot(e.tx - ox, e.tz - oz) > 4) g.position.set(e.tx, e.ty, e.tz);
    else { g.position.x += (e.tx - ox) * k; g.position.z += (e.tz - oz) * k; g.position.y += (e.ty - g.position.y) * k; }
    let dy = e.tyaw - g.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; g.rotation.y += dy * Math.min(1, dt * 10);
    const sp = dt > 0 ? Math.min(6, Math.hypot(g.position.x - ox, g.position.z - oz) / dt) : 0;
    e.spS = lerp(e.spS || 0, sp, Math.min(1, dt * 6));
    if (e.atkT > 0) e.atkT -= dt;
    if ((e.growlT -= dt) <= 0) { e.growlT = rnd(3, 8); try { sfx.zgroan(at(g.position.x, g.position.z, 16, g.position.y), e.kind === 'run'); } catch (err) {} }
    animZombie(e, dt, e.spS);
  }
}
// my shot hit a copy: queue the hit for the host, show the hit at once
function zcProxyHit(e, dmg, head, boom) {
  const h = ZC.pend.get(e.zid) || { d: 0, h: false, b: false, m: false };
  h.d += dmg; h.h = h.h || !!head; h.b = h.b || !!boom; h.m = h.m || G.meleeT > 0; ZC.pend.set(e.zid, h);
  e.flinch = 1; if (e.php === undefined) e.php = e.maxHp; e.php -= dmg;
  if (e.php > 0) zombHit(e, head);
}
function zcProxyDie(e, head) {
  ZC.prox.delete(e.zid);
  const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1);
  const dd = { e, t: 0, boom: false, dx: 0, dz: 0, head, a: [rnd(0.5, 1.4), rnd(0.5, 1.4), rnd(-0.4, 0.4), rnd(-0.4, 0.4)] };
  if (S.ragdoll) { try { dd.rd = makeRagdoll(e, new THREE.Vector3(0, 0, 1), false, head); } catch (err) { dd.rd = null; } }
  dying.push(dd); if (e.rig.flash) e.rig.flash.visible = false; try { sfx.zgurgle(at(e.group.position.x, e.group.position.z, 14, e.group.position.y)); } catch (err) {}
  chunks('blood', _v.set(e.group.position.x, 1.2, e.group.position.z), 8, 3, 0.6);
}
function zcMyKill(e, head, melee) {
  G.kills++; ZC.k++; sfx.kill(head);
  zombKill(e, head, false, melee);
  try { statKillAt(e ? e.group.position.x : P.x, e ? e.group.position.z : P.z, head); } catch (err) {}
}
function zcClientRound(r) {
  Z.round = r; G.wave = r; G.health = G.maxHp;
  if (ZC.dead) zcRespawn();
  showBanner(`ROUND ${r}`, r === 1 ? 'here they come' : r % 5 === 0 ? 'they are getting faster' : 'survive together'); if (r > 1) setTimeout(() => zvSay('round', 0.3), 1200); try { zsRoundTalk(r); } catch (e) {}
  try { tone(70, 1.6, 0.18, 'sawtooth'); tone(52, 2.2, 0.14, 'triangle'); } catch (e) {}
  zombHud(true);
}
function zcClearProxies() { for (const e of ZC.prox.values()) { const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); scene.remove(e.group); } ZC.prox.clear(); }

/* ---------- going down, reviving, bleeding out */
function zcDown() {
  try { zpLose(); } catch (e) {}
  ZC.down = true; ZC.downT = ZC_DOWN; G.health = 0; mouseDown = false; mouseAds = false;
  zvSay('down');
  G.state = 'zdown'; showCenter('YOU ARE DOWN', 'a teammate can revive you · hold on'); try { sfx.hurt(); } catch (e) {}
}
function zcRevived(R) {
  ZC.down = false; G.state = 'playing'; G.health = G.maxHp; G.spawnProt = 1.5; hideCenter(); vig.style.opacity = 0;
  showBanner('REVIVED', R ? 'by ' + R.n : ''); try { sfx.streak(); } catch (e) {} setTimeout(() => zvSay('revived'), 700);
  feedLine(`<b>${R ? R.n : '?'}</b> <span class="fw">REVIVED</span> <b>YOU</b>`);
}
function zcRespawn() {
  ZC.dead = ZC.down = false; buildSpawns();
  const sp = LAYOUT.spawn[0]; Object.assign(P, { x: sp.x + rnd(-1.5, 1.5), z: sp.z + rnd(-1.5, 1.5), y: sp.y || 0, vy: 0 });
  Z.guns = ['sidearm']; zombEquip(); G.grenades = 2; G.health = G.maxHp; G.spawnProt = 2; G.state = 'playing'; hideCenter(); vig.style.opacity = 0;
  showBanner('BACK IN', 'you respawned with a pistol'); try { lockPointer(); } catch (e) {}
}
// the world keeps going while I am down, dead or paused (and the host keeps the zombies running)
function zcBackTick(dt) {
  P.vy = (P.vy || 0) - 22 * dt; P.y += P.vy * dt; const gy = groundAt(P.x, P.z, P.y); if (P.y <= gy) { P.y = gy; P.vy = 0; }
  if (G.state === 'zdown') {
    ZC.downT -= dt;
    showCenter('YOU ARE DOWN', `a teammate can revive you · ${Math.max(0, Math.ceil(ZC.downT))}`);
    camera.position.set(P.x, P.y + 0.45, P.z); camera.rotation.set(lerp(camera.rotation.x, -0.15, dt * 2), P.yaw, lerp(camera.rotation.z, 0.35, dt * 2), 'YXZ');
    if (ZC.downT <= 0) { ZC.dead = true; ZC.down = false; G.state = 'zspec'; showCenter('YOU BLED OUT', 'you come back at the start of the next round'); }
  } else if (G.state === 'zspec') {
    const mate = [...ZC.rem.values()].find(R => R.inGame && R.a && !R.dn && R.av);
    if (mate) { const g = mate.av.group.position, yw = mate.yw; camera.position.set(g.x + Math.sin(yw) * 3.2, g.y + 2.4, g.z + Math.cos(yw) * 3.2); camera.lookAt(g.x, g.y + 1.2, g.z); }
  }
  updateNav(P.x, P.z, P.y); updateZombies(dt); updateGrenades(dt); updateHud();
}
// revive a teammate: stand next to them and hold USE
function zcReviveTick(dt) {
  if (G.state !== 'playing') { ZC.revT = 0; return ''; }
  let best = null, bd = 1.9;
  for (const R of ZC.rem.values()) if (R.inGame && R.dn && R.a) { const d = Math.hypot(R.x - P.x, R.z - P.z); if (d < bd && Math.abs(R.y - P.y) < 1.4) { bd = d; best = R; } }
  if (!best) { ZC.revT = 0; return ''; }
  if (kb('use') || pad.use) {
    if (ZC.revWho !== best.peer) { ZC.revWho = best.peer; ZC.revT = 0; }
    ZC.revT += dt;
    if (ZC.revT >= (zpHas('revive') ? ZC.revNeed / 2 : ZC.revNeed)) { ZC.revT = 0; ZC.rvseq++; ZC.rv.push([best.peer, ZC.rvseq]); while (ZC.rv.length > 6) ZC.rv.shift(); feedLine(`<b>YOU</b> <span class="fw">REVIVED</span> <b>${best.n}</b>`); G.points += 50; zvSay('reviving'); return ''; }
    return `REVIVING ${best.n} · ${Math.round(ZC.revT / (zpHas('revive') ? ZC.revNeed / 2 : ZC.revNeed) * 100)}%`;
  }
  ZC.revT = 0;
  return `HOLD ${actName('use')} TO REVIVE ${best.n}`;
}

/* ---------- teammates' soldiers */
function zcAvatars(dt) {
  for (const R of ZC.rem.values()) {
    const show = R.inGame && R.a;
    if (!show) { zcDropAvatar(R); continue; }
    if (!R.av) { const e = makeEnemy('rifleman', R.x, R.z); e.group.position.y = R.y; e.group.add(friendlyMarker()); e.aim = 1; e.holding = true; e.los = true; R.av = e; }
    const e = R.av, g = e.group, ox = g.position.x, oz = g.position.z, k = Math.min(1, dt * 14);
    if (Math.hypot(R.x - ox, R.z - oz) > 6) g.position.set(R.x, R.y, R.z); else { g.position.x += (R.x - ox) * k; g.position.z += (R.z - oz) * k; g.position.y += (R.y - g.position.y) * k; }
    let dy = R.yw + Math.PI - g.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; g.rotation.y += dy * Math.min(1, dt * 16);
    const sp = dt > 0 ? Math.min(9, Math.hypot(g.position.x - ox, g.position.z - oz) / dt) : 0;
    animEnemy(e, dt, Math.min(6, sp));
    e.fsD = (e.fsD || 0) + dt * sp; if (sp > 1 && e.fsD > (sp > 6 ? 2.0 : 1.6) && !R.dn) { e.fsD = 0; const d = Math.hypot(g.position.x - P.x, g.position.z - P.z); if (d < 45) try { sfx.estep(at(g.position.x, g.position.z, 12)); } catch (err) {} }
    g.rotation.x = lerp(g.rotation.x, R.dn ? -1.35 : 0, Math.min(1, dt * 6)); if (R.dn) g.position.y = R.y + 0.25;
  }
}
function zcDropAvatar(R) { if (R.av) { scene.remove(R.av.group); R.av = null; } }

/* ---------- the in-game frame (called from updateZombies) */
function zcFrame(dt) {
  zcAvatars(dt);
  if (!zcHost()) zcClientFrame(dt); else zcHostFrame(dt);
  zcTeamHud();
}
function zcTeamHud(force) {
  let t = $('zTeam');
  if (!t) { t = document.createElement('div'); t.id = 'zTeam'; ($('hud') || document.body).appendChild(t); const st = document.createElement('style'); st.textContent = `#zTeam{position:absolute;left:28px;bottom:262px;pointer-events:none;font:700 13px var(--font,system-ui);letter-spacing:.1em;color:#d8e8c8;text-shadow:0 1px 4px #000;line-height:1.6}#zTeam .dn{color:#ff6a5a}#zTeam .out{opacity:.45}`; document.head.appendChild(st); }
  const on = zcInGame() && G.state !== 'dead';
  const html = on ? [...ZC.rem.values()].filter(R => R.inGame).map(R => `<div class="${R.dn ? 'dn' : !R.a ? 'out' : ''}">${R.n} <span style="color:${zvChar(R.pr && R.pr.ch).col}">${zvChar(R.pr && R.pr.ch).name}</span> · ${R.pts.toLocaleString()}${R.dn ? ' · DOWN' : !R.a ? ' · OUT' : ''}</div>`).join('') : '';
  if (force || t._h !== html) { t._h = html; t.innerHTML = html; }
}

/* ---------- the zombies lobby: solo / online co-op */
function zcLobbyRows() {
  const coop = ZL.net === 'coop';
  let h = `<div class="cod-row"><small>PLAY</small><b>${coop ? 'ONLINE CO-OP' : 'SOLO'}</b><span>${coop ? 'up to 4 survivors · your party comes with you' : 'just you against the dead'}</span><div class="arw"><button class="mini" data-act="z-net-" aria-label="Solo or co-op">&lsaquo;</button><button class="mini" data-act="z-net+" aria-label="Solo or co-op">&rsaquo;</button></div></div>`;
  if (!coop) return h;
  if (!NET.app) return h + `<div class="net-off">Online co-op runs in the desktop app.</div>`;
  if (ZC.on) h += `<div class="cod-row"><small>${ZC.kind === 'code' ? 'PRIVATE CODE ' + ZC.code.toUpperCase() : 'ONLINE CO-OP'}</small><b>${zcHost() ? 'YOU ARE THE HOST' : 'JOINED'}</b><span>${zcHost() ? 'press START when your squad is in' : 'waiting for the host to start'}</span><div class="arw"><button class="mini z-leave" data-act="z-leave">LEAVE</button></div></div>`;
  else h += `<div class="net-hint">Quick Play drops you into a co-op game that is already running, or starts one that others can join. Play with friends: party up on the right, or use a private code.</div>` +
    `<div class="net-form z-code"><label>PRIVATE CODE MATCH<input id="zCode" maxlength="20" value="${ZL.code || ''}" autocomplete="off" spellcheck="false" placeholder="e.g. squad7"></label><button class="btn net-codebtn" data-act="z-code">HOST / JOIN</button></div>`;
  h += `<div class="net-lan" id="zLan"></div><div class="net-svc" id="netSvc">MATCH SERVICE: CHECKING…</div><div class="net-count" id="netCount"></div>`;
  if (ZC.err) h += `<div class="net-count bad">${ZC.err}</div>`;
  return h;
}
function zcStartLabel() {
  if (ZL.net !== 'coop') return ['SOLO · ROUND BASED', 'START ZOMBIES'];
  if (ZC.conn === 'connecting') return ['ONLINE CO-OP', 'CONNECTING…'];
  if (!ZC.on) return NET.app && typeof partyWaiting === 'function' && partyWaiting() ? ['ONLINE CO-OP · IN A PARTY', 'WAITING FOR LEADER'] : ['ONLINE CO-OP · UP TO 4 SURVIVORS', 'QUICK PLAY'];
  const n = 1 + [...ZC.rem.values()].length;
  return zcHost() ? [`PRIVATE CO-OP · ${n} SURVIVOR${n === 1 ? '' : 'S'}`, 'START GAME'] : ['PRIVATE CO-OP', 'WAITING FOR HOST'];
}
function zcRosterHtml() {
  if (ZL.net === 'coop' && !ZC.on) return '';
  const rows = [`<div class="ros-p me"><span class="lv">★</span>${NET.nick || 'YOU'}<em>${ZC.on && zcHost() ? 'HOST' : 'READY'}</em></div>`];
  if (ZC.on) for (const R of ZC.rem.values()) rows.push(`<div class="ros-p"><span class="lv">·</span>${R.n}<em>${R.ho ? 'HOST' : R.pr && R.pr.g ? 'IN GAME' : 'READY'}</em></div>`);
  const n = rows.length;
  return `<div class="ros-h"><span>SQUAD</span><b>${ZL.net === 'coop' ? `${n} / ${ZC_MAX}` : 'SOLO'}</b></div><div class="ros-team" style="--tc:#7dbb4a"><div class="tn">SURVIVORS</div>${rows.join('')}</div>`;
}
// the right-hand side: survivors in this game, then the same party / friends / chat panel as multiplayer
function zcRightHtml() {
  const coop = ZL.net === 'coop' && NET.app;
  return `<div id="zRoster">${zcRosterHtml()}</div>` + (coop && typeof partyHtml === 'function' ? `<div id="partyBox">${partyHtml()}</div>` + (typeof lobChatHtml === 'function' ? lobChatHtml() : '') : '');
}
// keep the lobby up to date without rebuilding the code box while someone types in it
function zcLobbyRefresh(full) {
  if (typeof curScreen === 'undefined' || curScreen !== 'lobby' || !ZL.on) return;
  if (full) { renderZLobby(); return; }
  const key = zcStartLabel().join('|') + '|' + [...ZC.rem.values()].map(R => R.n + (R.pr && R.pr.g ? 1 : 0)).join(',');
  if (key === ZC.rosterKey) return; ZC.rosterKey = key;
  const r = $('zRoster'); if (r) r.innerHTML = zcRosterHtml();
  const b = document.querySelector('#lobSel .cod-go'); if (b) { const [s, t] = zcStartLabel(); b.innerHTML = `<small>${s}</small><b>${t}</b>`; b.disabled = t === 'WAITING FOR LEADER' || t === 'WAITING FOR HOST' || t === 'CONNECTING…'; }
}
// co-op games on the same Wi-Fi (the host announces them, like multiplayer)
function zcLanList() {
  const box = $('zLan'); if (!box || !NET.app || ZC.on) { if (box) box.innerHTML = ''; return; }
  let games = []; try { games = (window.ASHFALL_APP.lan && window.ASHFALL_APP.lan.games()) || []; } catch (e) {}
  games = games.filter(g => g && typeof g.slot === 'string' && g.mode === 'zomb').slice(0, 4);
  const key = JSON.stringify(games); if (box._k === key) return; box._k = key;
  box.innerHTML = games.length ? `<span>ON YOUR WI-FI</span>` + games.map((g, i) => `<button class="btn net-lanbtn" data-zlan="${i}">${cleanNick(g.name)}'S ZOMBIES · ${Math.min(4, g.n | 0)} SURVIVORS</button>`).join('') : '';
  for (const b of box.querySelectorAll('[data-zlan]')) b.onclick = () => { const g = games[+b.dataset.zlan]; sfx.ui(); zcJoin('slot', g.slot); };
}
setInterval(() => { try { if (typeof curScreen !== 'undefined' && curScreen === 'lobby' && ZL.on && ZL.net === 'coop') zcLanList(); } catch (e) {} }, 2000);
// the party follows its leader into Zombies the same way as into a multiplayer match
function zcPartyGo() { return ZC.on && ZC.room && ZC.room.slot ? { s: ZC.room.slot, m: 'zomb' } : null; }
function zcPartyFollow(go) {
  if (ZC.on && ZC.room && ZC.room.slot === go.s) return;
  if (G.state !== 'menu') leaveGame();
  if (ZC.on) zcLeave();
  showMsg('JOINING YOUR PARTY LEADER');
  ZL.net = 'coop'; if (!ZL.on || curScreen !== 'lobby') openZLobby(); else renderZLobby();
  zcJoin('slot', go.s);
}
function zcWireLobby() {
  const i = $('zCode'); if (!i) return;
  i.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') { i.blur(); zombAct('z-code'); } };
  i.onkeyup = e => e.stopPropagation();
  i.oninput = () => { ZL.code = cleanCode(i.value); try { localStorage.setItem('ashfall.zcode', ZL.code); } catch (e) {} };
}
(() => { const s = document.createElement('style'); s.textContent = `.z-code{align-items:flex-end}.z-leave{width:auto!important;padding:0 10px;font-size:11px;letter-spacing:.12em}`; document.head.appendChild(s); })();

/* ---------- shared drops and sounds in co-op
   Drops: the host decides when a dead zombie drops ammo and lists the drops (dp); everyone sees them. Whoever walks
   over one picks it up for the whole squad: they list it (pk) and every survivor gets the ammo.
   The ammo crate refills the whole squad too. Sounds: teammates' gunshots (the shot counter), footsteps (from their
   movement), grenade blasts and punches (events, ev) are played where they happen. */
Object.assign(ZC, { drops: new Map(), dropSeq: 0, taken: new Set(), pk: [], ev: [], evSeq: 0 });
function zcResetShared() { ZC.drops.clear(); ZC.taken.clear(); ZC.pk = []; ZC.ev = []; for (const R of ZC.rem.values()) { R.seenEv = undefined; } }
function zcDrop(x, z, y) {
  const id = ++ZC.dropSeq; ZC.drops.set(id, { x, z, y, t: performance.now() }); zcSpawnDrop(id, x, z, y);
}
function zcSpawnDrop(id, x, z, y) { if (ZC.taken.has(id) || pickups.some(k => k.sid === id)) return; dropPickup(x, z, y); const k = pickups[pickups.length - 1]; if (k) { k.sid = id; k.life = 40; } }
function zcRemoveDrop(id) { for (let i = pickups.length - 1; i >= 0; i--) if (pickups[i].sid === id) { scene.remove(pickups[i].m); pickups.splice(i, 1); } if (zcHost()) ZC.drops.delete(id); }
// a drop's ammo: everyone gets it, whoever picked it up
function zcDropAmmo(who) {
  const eqMax = EQUIP[G.equip] ? EQUIP[G.equip].max : 2;
  for (const w of WEAPONS) w.reserve = Math.min(w.reserveMax || w.reserve, w.reserve + Math.ceil(w.magSize * 1.2));
  if (G.grenades < eqMax) G.grenades++;
  try { sfx.pickup(); } catch (e) {} showMsg(who ? `${who} PICKED UP AMMO FOR THE SQUAD` : 'AMMO FOR THE WHOLE SQUAD');
}
// I walked over a shared drop
function zcTakeDrop(k) {
  if (ZC.taken.has(k.sid)) return; ZC.taken.add(k.sid); ZC.pk.push(k.sid); while (ZC.pk.length > 10) ZC.pk.shift();
  zcRemoveDrop(k.sid); zcDropAmmo('');
}
function zcEvent(type, p) { if (!zcInGame()) return; ZC.evSeq++; ZC.ev.push([type, r2(p.x), r2(p.y || 0), r2(p.z), ZC.evSeq]); while (ZC.ev.length > 8) ZC.ev.shift(); }
// called from zcRead for each teammate (and from the client's host read for the drop list)
function zcReadShared(R, host) {
  const pr = R.pr || {};
  if (Array.isArray(pr.pk)) for (const id of pr.pk) { const n = +id; if (!n || ZC.taken.has(n)) continue; ZC.taken.add(n); zcRemoveDrop(n); if (R.inGame) zcDropAmmo(R.n); }
  if (Array.isArray(pr.ev)) {
    if (R.seenEv === undefined) R.seenEv = pr.ev.reduce((m, v) => Math.max(m, +v[4] || 0), 0);
    for (const v of pr.ev) {
      if (!Array.isArray(v) || (+v[4] || 0) <= R.seenEv) continue; R.seenEv = +v[4] || 0;
      if (!R.inGame) continue;
      const p = { x: netNum(v[1], -ARENA, ARENA), y: netNum(v[2], -5, 20), z: netNum(v[3], -ARENA, ARENA) };
      try {
        if (v[0] === 'b') { sfx.explode(at(p.x, p.z, 34)); explosionFx(new THREE.Vector3(p.x, p.y, p.z), 1); }
        else if (v[0] === 'm') sfx.thud(at(p.x, p.z, 14));
        else if (v[0] === 'cook' && zcHost()) zsStartCook();
        else if (v[0] === 'ammo') { WEAPONS.forEach(w => { w.ammo = w.magSize; w.reserve = w.reserveMax || w.def.reserve; }); G.grenades = Math.max(G.grenades, 2); showMsg(`${R.n} BOUGHT AMMO FOR THE SQUAD`); sfx.ui(); }
      } catch (e) {}
    }
  }
  if (host && Array.isArray(pr.dp)) {   // the host's drop list: show new ones, clear the ones that are gone
    const ids = new Set();
    for (const d of pr.dp) { if (!Array.isArray(d)) continue; const id = +d[0]; ids.add(id); zcSpawnDrop(id, netNum(d[1], -ARENA, ARENA), netNum(d[2], -ARENA, ARENA), netNum(d[3], -5, 20)); }
    for (let i = pickups.length - 1; i >= 0; i--) if (pickups[i].sid && !ids.has(pickups[i].sid)) { scene.remove(pickups[i].m); pickups.splice(i, 1); }
  }
}
