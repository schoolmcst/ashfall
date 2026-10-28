/* ================================================================== online play
   Real players fight each other in ONLINE TDM / ONLINE FFA. Everyone who has this page open on claude.ai and picks the
   same room code lands in the same match. It runs on the artifact's `room` capability: each player publishes their own
   state as presence (position, aim, alive, kills, shots, and the hits they landed); every page draws the others as
   soldiers. The victim's page owns their health: a hit is a record in the shooter's presence that the victim applies. */
const NET = { ns: null, room: null, on: false, mode: 'otdm', code: 'public', nick: '', me: '', joinedAt: 0, teamSet: false,
  k: 0, d: 0, ds: 0, kb: '', kh: 0, sh: 0, hseq: 0, hs: [], ep: 0, endT: 0, lastAtk: '', lastAtkT: -9, wasAlive: false,
  rem: new Map(), app: false, kind: 'quick', slot: '', botT: 0, botPres: [], botN: 0, ffaN: 0, lastEp: 0, lanT: 0 };
// in the desktop app, online play is player-hosted (p2p.js) and needs no claude.ai
NET.app = !!(window.ASHFALL_APP && typeof P2P !== 'undefined' && P2P.available());   // peer -> { entry, bot, seen, ds, sh, ep, x, y, z, yw, pt }
const NICK_KEY = 'ashfall.nick.v1', ROOMC_KEY = 'ashfall.roomcode.v1';
try { NET.nick = localStorage.getItem(NICK_KEY) || ''; NET.code = localStorage.getItem(ROOMC_KEY) || 'public'; } catch (e) {}
if (!NET.nick) NET.nick = 'PLAYER' + ((Math.random() * 900 + 100) | 0);
const cleanNick = s => dzFilter(String(s || '').toUpperCase().replace(/[^A-Z0-9 _-]/g, '').trim().slice(0, 14)) || 'PLAYER';
const cleanCode = s => String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20) || 'public';
NET.nick = cleanNick(NET.nick); NET.code = cleanCode(NET.code);
const netRoomName = () => `ashfall-${NET.mode}-${NET.code}`;
const netReady = () => NET.app || !!NET.ns;
(async () => {
  try { if (window.claude && typeof window.claude.use === 'function') NET.ns = await window.claude.use('room'); } catch (e) { NET.ns = null; }
  if (NET.ns) { try { NET.ns.onPeers(() => { if (typeof LOBBY !== 'undefined' && curScreen === 'lobby' && MODES[LOBBY.mode].online) netLobbyCount(); }); } catch (e) {} }
  setTimeout(() => { try { if (curScreen === 'lobby') renderLobby(); } catch (e) {} }, 0);
})();

/* ---------- lobby panel for the online modes */
function netLobbyHtml() {
  if (NET.app) return     `<div class="net-hint">Quick Play finds a public match; bots fill empty spots. Private code matches are under CUSTOM.</div>` +
    `<div class="net-lan" id="netLan"></div><div class="net-svc" id="netSvc">MATCH SERVICE: CHECKING…</div><div class="net-count" id="netCount"></div>`;
  if (!NET.ns) return `<div class="net-off">Online play runs when this game is open on claude.ai. Share the page with friends (they need a Claude account), then everyone picks the same room code.</div>`;
  return `<div class="net-form">` +
    `<label>ROOM CODE<input id="netCode" maxlength="20" value="${NET.code}" autocomplete="off" spellcheck="false"></label></div><div class="net-count" id="netCount"></div>`;
}
function netLobbyWire() {
  for (const id of ['netNick', 'netCode']) {
    const i = $(id); if (!i) continue;
    i.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') { i.blur(); if (NET.app && id === 'netCode') netGo('code'); else actions('lob-start'); } };
    i.onkeyup = e => e.stopPropagation();
    i.oninput = () => { if (id === 'netNick') NET.nick = cleanNick(i.value); else NET.code = cleanCode(i.value); try { localStorage.setItem(NICK_KEY, NET.nick); localStorage.setItem(ROOMC_KEY, NET.code); } catch (e) {} };
  }
  const cg = $('netCodeGo'); if (cg) cg.onclick = () => { sfx.ui(); netGo('code'); };
  NET.kind = 'quick';
  netLobbyCount(); netLanList(); netCheckService(); netCheckVersion();
  if (NET.app && !NET.lanTimer) NET.lanTimer = setInterval(() => { if (curScreen === 'lobby') netLanList(); }, 2000);
}
// start a match a particular way (the big lobby button is Quick Play)
function netGo(kind, slot) {
  if (!MODES[LOBBY.mode].online) LOBBY.mode = LOBBY.lastOn || 'otdm';
  if (kind === 'code' && (!NET.code || NET.code === 'public')) { const i = $('netCode'); if (i) { i.focus(); i.placeholder = 'type a code first'; } return; }
  NET.kind = kind; NET.slot = slot || ''; startMatch(LOBBY.mode); NET.kind = 'quick';
}
// green "online" or red "can't reach" so a connection problem is visible before pressing Quick Play
function netCheckService() {
  const el = $('netSvc'); if (!el || !NET.app) return;
  if (NET.svc && performance.now() - NET.svc.t < 20000) return netShowService();
  el.textContent = 'MATCH SERVICE: CHECKING…'; el.className = 'net-svc';
  P2P.ping().then(ms => { NET.svc = { ok: true, ms, t: performance.now() }; netShowService(); })
    .catch(e => { NET.svc = { ok: false, why: e.message, t: performance.now() }; netShowService(); });
}
function netShowService() {
  const el = $('netSvc'), s = NET.svc; if (!el || !s) return;
  el.className = 'net-svc ' + (s.ok ? 'ok' : 'bad');
  el.textContent = s.ok ? `MATCH SERVICE: ONLINE (${s.ms} MS)` : `MATCH SERVICE: CAN'T REACH IT (${s.why === 'timeout' ? 'no answer' : 'blocked'}) - check your internet or firewall`;
}
// a newer game version is out but this copy has not updated: you would never meet players on the new one
const UPD_URL = 'https://raw.githubusercontent.com/schoolmcst/ashfall/main/release/version.json';
const verNum = v => String(v).split('.').map(n => parseInt(n, 10) || 0).reduce((a, n) => a * 1000 + n, 0);
function netCheckVersion() {
  const el = $('netCount'); if (!el || !NET.app) return;
  const show = () => { if (NET.latest && verNum(NET.latest) > verNum(window.ASHFALL_APP.version)) { el.className = 'net-count bad'; el.textContent = `A NEWER VERSION (${NET.latest}) IS OUT - CLOSE AND REOPEN ASHFALL TO UPDATE. UNTIL THEN YOU WON'T MEET PLAYERS ON IT.`; } };
  if (NET.latest !== undefined) return show();
  fetch(UPD_URL + '?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).then(j => { NET.latest = j && j.version || null; show(); }).catch(() => { NET.latest = null; });
}
function netLanList() {
  const box = $('netLan'); if (!box || !NET.app) return;
  let games = []; try { games = (window.ASHFALL_APP.lan && window.ASHFALL_APP.lan.games()) || []; } catch (e) {}
  games = games.filter(g => g && typeof g.slot === 'string' && MODES[g.mode] && MODES[g.mode].online).slice(0, 4);
  const key = JSON.stringify(games); if (box._k === key) return; box._k = key;
  box.innerHTML = games.length ? `<span>ON YOUR WI-FI</span>` + games.map((g, i) => `<button class="btn net-lanbtn" data-lan="${i}">${cleanNick(g.name)}'S ${MODES[g.mode].short} · ${Math.min(16, g.n | 0)} PLAYERS</button>`).join('') : '';
  for (const b of box.querySelectorAll('[data-lan]')) b.onclick = () => { const g = games[+b.dataset.lan]; sfx.ui(); LOBBY.mode = g.mode; netGo('slot', g.slot); };
}
function netLobbyCount() {
  const c = $('netCount'); if (!c) return;
  if (NET.app) { c.textContent = `BETA ${(window.ASHFALL_APP.version || '').toUpperCase()} · YOU ONLY MEET PLAYERS ON THE SAME VERSION`; return; }
  if (!NET.ns) return;
  let n = 0; try { n = NET.ns.peers().length; } catch (e) {}
  c.textContent = n > 1 ? `${n} PLAYERS HAVE THE GAME OPEN RIGHT NOW` : 'NOBODY ELSE HAS THE GAME OPEN YET';
}

/* ---------- joining and leaving */
async function netStart(mode) {
  const pv = NET.priv; netLeave(); NET.priv = pv;
  NET.mode = mode; NET.on = true; NET.teamSet = false; NET.joinedAt = 0; NET.k = NET.d = NET.ds = NET.sh = NET.hseq = 0; NET.hs = []; NET.kb = ''; NET.ep = 0; NET.endT = 0; NET.wasAlive = false;
  if (NET.app) {
    const kind = NET.kind, code = kind === 'slot' ? NET.slot : NET.code; NET.joinKind = kind;
    let room = null;
    try { if (NET.preRoom) { room = NET.preRoom; NET.preRoom = null; } else room = await P2P.open(kind, kind === 'code' ? 'priv' : mode, code); }
    catch (e) { if (NET.on && NET.mode === mode) { NET.on = false; showBanner('COULD NOT JOIN', e.message === 'timeout' || e.message === 'fail' ? 'no internet connection to the match service' : e.message); setTimeout(() => { if (M.online && !NET.room) toLobby(); }, 6000); } return; }
    if (!NET.on || NET.mode !== mode) { room.leave(); return; }
    room.extras = () => NET.botPres;
    NET.room = room; NET.joinedAt = performance.now() / 1000; NET.botT = 2;
    NET.warmEnd = room.host && !NET.priv ? performance.now() / 1000 + WARMUP : 0;   // a new match waits for people before bots come in (private: the lobby does that)
    if (room.host) netSwitchMap(pickMapFor(NET.priv && NET.priv.cfg ? NET.priv.cfg.mp : 'random'));   // the host picks the map; everyone else follows it
    return;
  }
  if (!NET.ns) { NET.on = false; showMsg('OFFLINE: ONLINE PLAY NEEDS CLAUDE.AI'); return; }
  let room = null;
  try { room = await NET.ns.join(netRoomName()); } catch (e) { room = NET.ns; }   // named rooms unavailable: share the lobby, filtered by room name
  if (!NET.on || NET.mode !== mode) { if (room && room !== NET.ns && room.leave) room.leave().catch(() => {}); return; }
  NET.room = room; NET.joinedAt = performance.now() / 1000;
}
// load another map in the middle of an online match (host's choice): respawn me and my bots on it
function netSwitchMap(id) {
  if (!MAPS[id] || id === curMap) return;
  loadMap(id);
  if (!M || !M.online) return;
  if (M.hp || M.ctf || M.snd || M.kc || M.dom || M.inf || M.gf) objSetup();
  if (M.me && M.me.alive && G.state === 'playing') placePlayer(pickSpawnFor(M.myTeam, sideOf(M.myTeam)));
  for (const en of M.entries) if (en.bot && !en.bot.net && enemies.includes(en.bot)) { const p = pickSpawnFor(en.team, sideOf(en.team)); en.bot.group.position.set(p.x, p.y || 0, p.z); en.bot.goal = null; }
  showBanner(mapName(id), MAPS[id].place.toLowerCase());
}
function netLeave() {
  const r = NET.room; NET.room = null; NET.on = false; NET.priv = null;
  if (r) { try { if (r !== NET.ns && r.leave) r.leave().catch(() => {}); else r.presence({ on: null, rm: null }).catch(() => {}); } catch (e) {} }
  for (const [, R] of NET.rem) netDropBot(R, false);
  NET.rem.clear(); netClearBots();
}
function netPeers() { try { return NET.room ? NET.room.peers() : []; } catch (e) { return []; } }
function netSelf() { for (const p of netPeers()) if (p.sameTab) return p.peer; return ''; }

/* ---------- my state out */
const r2 = v => Math.round(v * 100) / 100, r3 = v => Math.round(v * 1000) / 1000;
function netPublish() {
  const w = WEAPONS[G.cur], alive = !!(M.me && M.me.alive && (G.state === 'playing' || pausedOnline()));
  NET.room.presence({ v: 1, on: 1, rm: netRoomName(), n: NET.nick, cm: typeof CHAT !== 'undefined' && CHAT.mine.all.length ? CHAT.mine.all.slice() : undefined, bn: typeof bannerFor === 'function' ? bannerFor() : '', lv: typeof lvlInfo === 'function' ? lvlInfo(PROG.xp).l : 1, tm: M.myTeam, x: r2(P.x), y: r2(P.y), z: r2(P.z), yw: r3(P.yaw), pt: r3(P.pitch), cr: P.eye < 1.4 ? 1 : 0, sl: perk('dead') ? 1 : 0, gh: perk('ghost') ? 1 : 0,
    a: alive ? 1 : 0, wu: NET.room && NET.room.host ? Math.ceil(warmLeft()) : 0, wn: w ? w.name : '', k: NET.k, d: NET.d, ds: NET.ds, kb: NET.kb, kh: NET.kh, sh: NET.sh, hs: NET.hs, ep: NET.ep, mp: curMap, sa: NET.sa, ct: crewTag() || undefined, mv: NET.mv || undefined, vo: NET.room && NET.room.host && MV.opts && NET.endT > 0 ? MV.opts : undefined, sk: SMK.out.length ? SMK.out : undefined, cj: STK.jamT > 0 ? 1 : 0, ho: NET.room && NET.room.host ? 1 : 0, ob: NET.room && NET.room.host ? netObjPack() : undefined, pc: NET.priv && NET.room && NET.room.host ? privPack() : undefined }).catch(() => {});
}
// called by shoot(): one per trigger pull, for the others' muzzle flashes
function netShot() { try { potgShot(); } catch (e) {} if (NET.on) NET.sh++; if (typeof ZC !== 'undefined' && ZC.on) ZC.sh++; }
// called by damageEnemy() for a remote soldier: record the hit for its owner to apply
// hit records: [victim, damage, head, seq, kind] - kind 1 = explosion (Blast Vest), 2 = stun at [x, y, z] (Tactical Mask)
function netHit(e, dmg, head, by, boom) {
  if (!NET.on || !e.net) return;
  if (by === 'player') { if (isFriend(e)) return; NET.hseq++; NET.hs.push([e.net, Math.round(dmg), head ? 1 : 0, NET.hseq, boom ? 1 : 0]); if (NET.hs.length > 8) NET.hs.shift(); }
  else if (by && by.entry && by.entry.botLabel) { const en = by.entry; if (M.def.teams && en.team === e.team) return; en.hseq++; en.hs.push([e.net, Math.round(dmg), head ? 1 : 0, en.hseq, boom ? 1 : 0]); if (en.hs.length > 8) en.hs.shift(); }
  else return;
  e.flinch = 1;
}

// my stun grenade went off next to another player: tell their game where, it blinds them if they were looking
function netStun(e, p) {
  if (!NET.on || !e.net || isFriend(e)) return;
  NET.hseq++; NET.hs.push([e.net, 0, 0, NET.hseq, 2, Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.z * 10) / 10]); if (NET.hs.length > 8) NET.hs.shift();
}

/* ---------- other players in */
function netNum(v, lo, hi, d = 0) { v = +v; return isFinite(v) ? clamp(v, lo, hi) : d; }
function netMakeBot(R, pr) {
  const e = makeEnemy('rifleman', R.x, R.z);
  Object.assign(e, { team: R.entry.team, entry: R.entry, name: R.entry.name, pvp: true, net: R.peer, hp: 1e9, maxHp: 100, aim: 1, crouchy: false, los: true, holding: true, lastShotT: -9 });
  e.silent = !!R.sl; e.ghost = !!R.gh; e.group.position.set(R.x, R.y, R.z); e.group.rotation.y = R.yw + Math.PI;
  if (M.def.teams && R.entry.team === M.myTeam) e.group.add(friendlyMarker());
  enemies.push(e); R.bot = e; R.entry.alive = true; R.entry.bot = e;
}
function netDropBot(R, dead, head) {
  const e = R.bot; if (!e) return; R.bot = null; R.entry.bot = null; R.entry.alive = false;
  const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1);
  if (!dead) { scene.remove(e.group); return; }
  const k = NET.rem.get(R.kb), kx = R.kb === NET.me ? P.x : k ? k.x : e.group.position.x, kz = R.kb === NET.me ? P.z : k ? k.z : e.group.position.z + 1;
  const dir = new THREE.Vector3(e.group.position.x - kx, 0, e.group.position.z - kz); if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1); dir.normalize();
  const dd = { e, t: 0, boom: false, dx: dir.x, dz: dir.z, head: !!head, a: [rnd(0.5, 1.4), rnd(0.5, 1.4), rnd(-0.4, 0.4), rnd(-0.4, 0.4)] };
  if (S.ragdoll) { try { dd.rd = makeRagdoll(e, dir, false, head); } catch (err) { dd.rd = null; } }
  dying.push(dd); e.rig.flash.visible = false;
  chunks('blood', _v.set(e.group.position.x, 1.2, e.group.position.z), 8, 3, 0.6);
}
const _nf = new THREE.Vector3(), _nm = new THREE.Vector3();
function netRemoteShot(R) {
  const e = R.bot; if (!e) return;
  e.lastShotT = M.t; e.rig.flash.visible = true; e.flashT = 0.06; e.rig.flash.material.rotation = rnd(0, 6.28);
  const from = enemyMuzzle(e, _nm), cp = Math.cos(R.pt);
  _nf.set(-Math.sin(R.yw) * cp, Math.sin(R.pt), -Math.cos(R.yw) * cp).normalize();
  raycaster.set(from, _nf); raycaster.far = 80; const h = raycaster.intersectObjects(wallMeshes, false)[0];
  addTracer(from, h ? h.point : from.clone().addScaledVector(_nf, 80), 0.05, 0.016);
  enemyFlashLight.position.copy(from); enemyFlashLight.intensity = 3; enemyFlashLight.userData.t = 0.05;
  sfx.enemy(at(e.group.position.x, e.group.position.z, R.far || 24));
}
function netFeedName(R) { return R ? nameHtml(R.entry) : '?'; }
function netTick(dt) {
  if (!NET.on || !NET.room || !inMatch() || !M.online) return;
  NET.me = NET.me || netSelf();
  const peers = netPeers(), seenNow = new Set(), rn = netRoomName(), inRoom = pr => (NET.app || pr.rm === rn) && pr.on;
  const isHost = NET.app && NET.room.host, botBy = lbl => isHost && lbl ? M.entries.find(en => en.botLabel === lbl) : null;
  // pick a team once the room has answered (the side with fewer players)
  if (!NET.teamSet && performance.now() / 1000 - NET.joinedAt > 1.4) {
    NET.teamSet = true; NET.me = netSelf();
    if (M.def.teams) {
      const c = [0, 0]; for (const p of peers) if (!p.sameTab && p.presence && inRoom(p.presence) && !p.presence.bot) c[p.presence.tm === 1 ? 1 : 0]++;
      M.myTeam = M.me.team = M.mode === 'inf' ? 0 : c[1] < c[0] ? 1 : 0;
      // in a party: join the team a party member is already on
      try { const names = new Set(partyMembers().filter(m => !m.me).map(m => m.name)); const mate = peers.find(p => !p.sameTab && p.presence && inRoom(p.presence) && !p.presence.bot && names.has(cleanNick(p.presence.n))); if (mate) M.myTeam = M.me.team = mate.presence.tm === 1 ? 1 : 0; } catch (e) {}
    }
    else M.myTeam = M.me.team = 0;
    for (const [, R] of NET.rem) netDropBot(R, false);   // redraw with the right friend markers
  }
  // my death: who did it
  const alive = !!(M.me.alive && (G.state === 'playing' || pausedOnline()));
  if (NET.wasAlive && !M.me.alive) {
    const k = G.killer && typeof G.killer === 'object' ? (G.killer.net || (G.killer.entry && G.killer.entry.botLabel) || '') : '';
    NET.d++; NET.ds++; NET.kb = k || (NOW - NET.lastAtkT < 4 ? NET.lastAtk : ''); NET.kh = NET.kb ? NET.lastHead || 0 : 0;
  }
  NET.wasAlive = M.me.alive;
  let maxEp = NET.ep;
  for (const p of peers) {
    if (p.sameTab || p.kind !== 'viewer') continue;
    const pr = p.presence || {};
    if (!inRoom(pr)) continue;
    seenNow.add(p.peer);
    let R = NET.rem.get(p.peer);
    const team = M.def.teams ? (pr.tm === 1 ? 1 : 0) : R ? R.entry.team : 100 + (++NET.ffaN);   // free-for-all: everyone on their own team
    if (!R) {
      const hs = Array.isArray(pr.hs) ? pr.hs : [];
      R = { peer: p.peer, entry: { name: cleanNick(pr.n), team, kills: 0, deaths: 0, score: 0, obj: 0, level: 0, alive: false, netPeer: p.peer }, bot: null,
        seen: hs.reduce((m, h) => Math.max(m, +(h && h[3]) || 0), 0), ds: +pr.ds || 0, sh: +pr.sh || 0, ep: 0, x: 0, y: 0, z: 0, yw: 0, pt: 0, kb: '' };
      NET.rem.set(p.peer, R); M.entries.push(R.entry); R.isBot = !!pr.bot;
      if (!pr.bot && !(performance.now() < (NET.quietT || 0))) feedLine(`${nameHtml(R.entry)} <span class="fw">JOINED</span>`);
    }
    R.entry.name = cleanNick(pr.n); R.host = !!pr.ho; R.sa = pr.sa; if (pr.ho && !pr.bot && !isHost && Array.isArray(pr.ob)) NET.ob = pr.ob; if (pr.ho && !pr.bot && NET.priv) privFromHost(pr.pc); if (!pr.bot && pr.wu > 0) NET.hostWarm = { left: +pr.wu, t: performance.now() };
    if (pr.ho && !pr.bot && !isHost && typeof pr.mp === 'string' && MAPS[pr.mp] && pr.mp !== curMap && !NET.mapBusy) { NET.mapBusy = true; setTimeout(() => { NET.mapBusy = false; if (NET.on) netSwitchMap(pr.mp); }, 0); }
    if (R.entry.team !== team) { R.entry.team = team; if (R.bot) netDropBot(R, false); }
    if (!pr.bot) chatIngest('all', p.peer, R.entry.name, pr.cm);
    R.bn = typeof pr.bn === 'string' && COS[pr.bn] && COS[pr.bn].kind === 'banner' ? pr.bn : ''; R.lv = netNum(pr.lv, 1, 100, 1);
    R.cj = pr.cj ? 1 : 0; R.entry.tag = typeof pr.ct === 'string' ? pr.ct.replace(/[^A-Z0-9]/g, '').slice(0, 4) : ''; R.mv = typeof pr.mv === 'string' ? pr.mv : ''; if (pr.ho && !pr.bot && !isHost) NET.voHost = Array.isArray(pr.vo) && pr.vo.every(id => MAPS[id]) ? pr.vo.slice(0, 3) : null; try { smkFromNet(R, pr.sk); } catch (e) {} R.sl = pr.sl ? 1 : 0; R.gh = pr.gh ? 1 : 0; if (R.bot) { R.bot.silent = !!R.sl; R.bot.ghost = !!R.gh; } R.x = netNum(pr.x, -ARENA, ARENA); R.y = netNum(pr.y, 0, 12); R.z = netNum(pr.z, -ARENA, ARENA); R.yw = netNum(pr.yw, -1e4, 1e4); R.pt = netNum(pr.pt, -1.6, 1.6);
    R.ep = +pr.ep || 0; if (R.ep > maxEp) maxEp = R.ep;
    R.entry.kills = R.ep === NET.ep ? (+pr.k | 0) : 0; R.entry.deaths = R.ep === NET.ep ? (+pr.d | 0) : 0; R.entry.score = R.entry.kills * 100;
    // a death since last time: drop them, credit the killer
    const ds = +pr.ds | 0;
    if (ds > R.ds) {
      R.ds = ds; R.kb = typeof pr.kb === 'string' ? pr.kb : ''; const head = !!pr.kh;
      const bot = R.bot;
      if (isHost && M.kc && R.ep === NET.ep) kcDrop(R.x, R.y, R.z, R.entry.team);
      if (R.kb && R.kb === NET.me) {
        NET.k++; G.kills++; G.score += 100 + (head ? 50 : 0); sfx.kill(head); if (!bot) stkAdd(100 + (head ? 50 : 0));
        if (bot) { statKill(bot, head); try { onKill(bot, head, false); } catch (err) {} }
        else { statKillAt(R.x, R.z, head); perkOnKill(); }
        if (!bot) feedLine(`<b>YOU</b> <span class="fw">${WEAPONS[G.cur].name}</span> ${nameHtml(R.entry)}`);
      } else if (botBy(R.kb)) { const ke = botBy(R.kb); try { brainHumanKilled(ke.bot, R.x, R.z); } catch (err) {} ke.kills++; ke.score += 100; feedLine(`${nameHtml(ke)} <span class="fw">${botGunName(ke.bot)}</span> ${nameHtml(R.entry)}`); }
      else if (R.kb && NET.rem.get(R.kb)) feedLine(`${netFeedName(NET.rem.get(R.kb))} <span class="fw">✦</span> ${nameHtml(R.entry)}${head ? ' <span class="ft">HEADSHOT</span>' : ''}`);
      netDropBot(R, true, head);
    }
    // hits on me
    if (Array.isArray(pr.hs)) for (const h of pr.hs) {
      if (!Array.isArray(h) || (+h[3] || 0) <= R.seen) continue;
      R.seen = +h[3] || 0;
      if (h[0] === NET.me && alive && R.ep === NET.ep && !(M.def.teams && team === M.myTeam)) {
        NET.lastAtk = p.peer; NET.lastAtkT = NOW; NET.lastHead = h[2] ? 1 : 0;
        G.killer = R.bot || null;
        if (+h[4] === 2) stunPlayerAt({ x: netNum(h[5], -ARENA, ARENA), y: netNum(h[6], -5, 20), z: netNum(h[7], -ARENA, ARENA) });
        else hurtPlayer(netNum(h[1], 0, 250), R.x, R.z, +h[4] === 1);
      } else if (isHost && R.ep === NET.ep) {   // a hit on one of my bots
        const be = botBy(h[0]);
        if (be && be.bot && !(M.def.teams && be.team === team) && +h[4] === 2) be.bot.stunT = 3;
        else if (be && be.bot && !(M.def.teams && be.team === team)) { const d = new THREE.Vector3(be.bot.group.position.x - R.x, 0, be.bot.group.position.z - R.z).normalize(); be.lastHead = h[2] ? 1 : 0; damageEnemy(be.bot, netNum(h[1], 0, 250), !!h[2], d, +h[4] === 1, R.bot || { net: p.peer, entry: R.entry }); }
      }
    }
    // body
    if (pr.a && !R.bot) netMakeBot(R, pr);
    else if (!pr.a && R.bot) netDropBot(R, false);
    const e = R.bot;
    if (e) {
      const g = e.group, ox = g.position.x, oz = g.position.z, k = Math.min(1, dt * 14);
      if (Math.hypot(R.x - ox, R.z - oz) > 6) g.position.set(R.x, R.y, R.z); else { g.position.x += (R.x - ox) * k; g.position.z += (R.z - oz) * k; g.position.y += (R.y - g.position.y) * k; }
      let dy = R.yw + Math.PI - g.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; g.rotation.y += dy * Math.min(1, dt * 16);
      e.crouchy = !!pr.cr; e.holding = true; e.los = true; e.aim = 1;
      animEnemy(e, dt, dt > 0 ? Math.min(6, Math.hypot(g.position.x - ox, g.position.z - oz) / dt) : 0);
    }
    const sh = +pr.sh | 0;
    if (sh > R.sh) { const n = Math.min(2, sh - R.sh); R.sh = sh; for (let i = 0; i < n; i++) netRemoteShot(R); }
  }
  // people who left
  for (const [peer, R] of NET.rem) if (!seenNow.has(peer)) {
    netDropBot(R, false); NET.rem.delete(peer); const i = M.entries.indexOf(R.entry); if (i >= 0) M.entries.splice(i, 1);
    if (!R.isBot) feedLine(`${nameHtml(R.entry)} <span class="fw">LEFT</span>`);
  }
  if (isHost) netBots(dt); else if (NET.botPres.length || M.entries.some(en => en.botLabel)) netClearBots();
  if (NET.app && isHost && (NET.lanT -= dt) <= 0) { NET.lanT = 2; try { window.ASHFALL_APP.lan.announce({ slot: NET.room.slot, name: NET.nick, mode: M.mode, n: NET.room.players }); } catch (e) {} }
  // someone already started the next round
  if (maxEp > NET.ep) {   // someone else's game moved on first: count the round we were in from the scores we saw
    const lim = M.cfg.score, ts = M.teamScore || [0, 0], played = NET.ep > 0 && !NET.endT && MS.time >= 60;
    if (played && NET.lastNear) finishMatchStats(NET.lastNear); else commitPartialStats();
    NET.ep = maxEp; NET.k = NET.d = 0; NET.endT = 0; G.kills = 0; NET.lastNear = 0; startMatchStats(); netNewRound();
  }
  M.me.kills = NET.k; M.me.deaths = NET.d; M.me.score = NET.k * 100; M.me.name = 'YOU';
  if (M.mode === 'gun') {   // gun game: your level is your kill count this round
    for (const en of M.entries) { const lv = Math.min(en.kills | 0, GUN_LADDER.length); if (en.level !== lv) { en.level = lv; if (en.isPlayer && lv < GUN_LADDER.length) { equipGunGame(lv); if (lv) { popScore(`LEVEL ${lv + 1}`, 'big', ARM[GUN_LADDER[lv]].name); sfx.streak(); } } else if (en.botLabel && en.bot && lv < GUN_LADDER.length) botGunProfile(en.bot, GUN_LADDER[lv]); } }
  }
  if (M.def.teams && !M.hp && !M.ctf && !M.snd && !M.kc && !M.dom && !M.inf && !M.gf) { M.teamScore = [0, 0]; for (const en of M.entries) M.teamScore[en.team] += en.kills; }
  // remember who was about to win, in case another game ends the round a moment before ours does
  { const lim = M.cfg.score || 1; if (M.def.teams) { const a = M.teamScore[M.myTeam], b = M.teamScore[1 - M.myTeam]; NET.lastNear = Math.max(a, b) >= lim * 0.9 ? (a > b ? 1 : a < b ? -1 : 0) : NET.lastNear && Math.max(a, b) ? NET.lastNear : 0; } else { const top = M.entries.reduce((m, e) => Math.max(m, e.kills), 0); NET.lastNear = top >= lim * 0.9 ? (M.me.kills >= top ? 1 : -1) : 0; } }
  // score limit: show the winner, then everyone starts a fresh round
  if (NET.ep !== NET.lastEp) { NET.lastEp = NET.ep; for (const en of M.entries) if (en.botLabel) { en.kills = en.deaths = en.score = 0; } }
  if (NET.endT > 0) { NET.endT -= dt; if (NET.endT <= 0) { NET.ep++; NET.k = NET.d = 0; G.kills = 0; if (isHost) { let w = null; try { w = mvWinner(); } catch (e) {} netSwitchMap(w || pickMapFor(NET.priv && NET.priv.cfg ? NET.priv.cfg.mp : 'random')); } try { mvEnd(); } catch (e) {} netNewRound(); } else try { mvRender(); } catch (e) {} }
  else {
    const lim = M.cfg.score; let win = null;
    if (M.def.teams) { for (let t = 0; t < 2; t++) if (M.teamScore[t] >= lim) win = t === M.myTeam ? 'YOUR TEAM WINS' : 'ENEMY TEAM WINS'; }
    else for (const en of M.entries) if (en.kills >= lim) win = en.isPlayer ? 'YOU WIN' : en.name + ' WINS';
    if (NET.priv && !NET.priv.started) win = null;
    else if (!win && M.cfg.time && M.t >= M.cfg.time * 60) {   // time limit (private matches): the leader wins
      if (M.def.teams) { const a = M.teamScore[M.myTeam], b = M.teamScore[1 - M.myTeam]; win = a === b ? 'TIME · DRAW' : a > b ? 'TIME · YOUR TEAM WINS' : 'TIME · ENEMY TEAM WINS'; NET.timeWon = a === b ? 0 : a > b ? 1 : -1; }
      else { const top = M.entries.slice().sort((x, y) => y.kills - x.kills)[0]; win = 'TIME · ' + (top.isPlayer ? 'YOU WIN' : top.name + ' WINS'); NET.timeWon = top.isPlayer ? 1 : -1; }
    }
    if (win) {
      NET.endT = INTERMISSION_ON; sfx.streak();
      // a round to the score limit counts as a match in your career stats
      const won = NET.timeWon !== undefined ? NET.timeWon : M.def.teams ? (M.teamScore[M.myTeam] >= lim ? 1 : -1) : (M.me.kills >= lim ? 1 : -1); NET.timeWon = undefined;
      finishMatchStats(won); netIntermission(won, win); startMatchStats();
    }
  }
  netPublish();
}

// round won online: everyone sees the scoreboard for the intermission, nobody can be hurt, then a fresh round
function netIntermission(won, txt) {
  try { mvStart(); } catch (e) {}
  try { rpFinish(won); } catch (e) {}
  if (G.state === 'paused') showScreen(null);
  G.netPrevState = G.state; G.state = 'over'; mouseDown = false; mouseAds = false;
  hadLock = false; try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  hideCenter(); clearWorldFx();
  showResults(won > 0 ? (M.def.teams ? M.myTeam : M.me) : null, won); $('resSub').textContent += '  ·  ' + txt;
}
function netNewRound() {
  try { mvEnd(); } catch (e) {}
  showBanner('NEW ROUND', mapName(curMap) + ' · scores reset');
  for (const en of M.entries) { en.kills = en.deaths = en.score = 0; en.level = 0; }
  M.t = 0; M.teamScore = [0, 0]; NET.ob = null; objSetup(); if (M.mode === 'gun') equipGunGame(0);
  if (G.state === 'over') matchHold(true);
  if (G.state !== 'over') return;
  M.over = false; showScreen(null); clearWorldFx();
  if (M.me) M.me.alive = true; respawnPlayer();
}
function clearWorldFx() { for (const g of grenadesInFlight) scene.remove(g.m); grenadesInFlight.length = 0; for (const d of decals) d.visible = false; }

/* ---------- bots that fill empty spots (the host runs them; everyone else sees them like players) */
const BOT_FILL = { teams: 6, ffa: 8 }, WARMUP = 15;
const botFillTeams = () => M.def && M.def.perTeam && M.def.perTeam < BOT_FILL.teams ? M.def.perTeam : BOT_FILL.teams;
const warmLeft = () => Math.max(0, (NET.warmEnd || 0) - performance.now() / 1000);
function netNewBot(team) {
  const names = BOT_NAMES.filter(n => !M.entries.some(e => e.name === n.toUpperCase() + ' BOT'));
  const en = { name: (names[(Math.random() * names.length) | 0] || 'BOT').toUpperCase() + ' BOT', team, kills: 0, deaths: 0, score: 0, obj: 0, level: 0, role: Math.random() < 0.5 ? 'obj' : 'hunt',
    botLabel: 'bot-' + (++NET.botN) + '-' + ((Math.random() * 1e6) | 0), ds: 0, sh: 0, hs: [], hseq: 0, kb: '', kh: 0, wasAlive: true };
  M.entries.push(en); spawnBot(en, pickSpawnFor(team, sideOf(team)));
}
function netRemoveBot(en) {
  if (en.bot) { scene.remove(en.bot.group); const i = enemies.indexOf(en.bot); if (i >= 0) enemies.splice(i, 1); en.bot = null; }
  M.respawnQ = M.respawnQ.filter(r => r.en !== en); const j = M.entries.indexOf(en); if (j >= 0) M.entries.splice(j, 1);
}
function netClearBots() { for (const en of M.entries.slice()) if (en.botLabel) netRemoveBot(en); NET.botPres = []; }
const botLbl = by => by === 'player' ? NET.me : by && by.net ? by.net : by && by.entry && by.entry.botLabel ? by.entry.botLabel : '';
function netBots(dt) {
  const bots = M.entries.filter(en => en.botLabel);
  // deaths: tell everyone who did it
  for (const en of bots) {
    if (en.wasAlive && !en.alive) { en.ds++; en.kb = botLbl(en.lastBy); en.kh = en.lastHead || 0; if (en.kb === NET.me) NET.k++; }
    en.wasAlive = !!en.alive;
  }
  // keep the teams topped up: real players always come first, bots only fill what is left (and not during the warm-up)
  const wl = warmLeft();
  if (NET.warmWas > 0 && wl <= 0) { NET.ep++; NET.k = NET.d = 0; G.kills = 0; commitPartialStats(); startMatchStats(); M.teamScore = [0, 0]; objSetup(); showBanner('MATCH STARTED', 'bots fill the empty spots'); }   // warm-up over: fresh scores
  NET.warmWas = wl;
  if ((NET.botT -= dt) <= 0 && NET.teamSet) {
    NET.botT = 0.5;
    const humans = [0, 0]; let hum = 1; humans[M.myTeam]++;
    for (const R of NET.rem.values()) if (!R.isBot) { hum++; if (M.def.teams) humans[R.entry.team]++; }
    const add = wl <= 0 && (NET.addT = (NET.addT || 0) - 0.5) <= 0;   // add one bot every 1.5 s; remove extras at once
    const pw = NET.priv ? (!NET.priv.started || G.holdT > 0 ? (M.def.teams ? [0, 0] : 0) : NET.priv.pub ? null : privBotWant(humans)) : null;
    if (M.def.teams) for (let t = 0; t < 2; t++) {
      const mine = bots.filter(b => b.team === t), want = pw ? pw[t] : wl > 0 ? 0 : M.mode === 'inf' ? (t === 0 ? Math.max(0, 2 * BOT_FILL.teams - hum - bots.filter(b => b.team === 1).length) : bots.filter(b => b.team === 1).length) : Math.max(0, botFillTeams() - humans[t]);
      for (let i = mine.length - 1; i >= want; i--) netRemoveBot(mine[i]);
      if (mine.length < want && add) { netNewBot(t); NET.addT = NET.priv ? 0.3 : 1.5; }
    } else {
      const want = pw !== null ? pw : wl > 0 ? 0 : Math.max(0, BOT_FILL.ffa - hum);
      for (let i = bots.length - 1; i >= want; i--) netRemoveBot(bots[i]);
      if (bots.length < want && add) { netNewBot(1000 + NET.botN); NET.addT = NET.priv ? 0.3 : 1.5; }
    }
  }
  NET.botPres = M.entries.filter(en => en.botLabel).map(en => {
    const e = en.bot, g = e && e.group;
    return [en.botLabel, { v: 1, on: 1, bot: 1, n: en.name, tm: M.def.teams ? en.team : 0, x: g ? r2(g.position.x) : 0, y: g ? r2(g.position.y) : 0, z: g ? r2(g.position.z) : 0, yw: g ? r3(g.rotation.y - Math.PI) : 0, pt: 0,
      cr: e && e.crouchK > 0.5 ? 1 : 0, a: e && en.alive ? 1 : 0, wn: botGunName(e), k: en.kills, d: en.deaths, ds: en.ds, kb: en.kb, kh: en.kh, sh: en.sh, hs: en.hs, ep: NET.ep }];
  });
}

/* ---------- styles for the lobby form */
(() => {
  const s = document.createElement('style');
  s.textContent = `.net-form{display:flex;gap:10px;margin:8px 0 4px}#lobSel .lob-go{margin:10px 0 4px}.net-form label{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:4px;font-size:11px;letter-spacing:.12em;opacity:.85}
.net-form input{font:inherit;font-size:15px;letter-spacing:.06em;padding:8px 10px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.25);color:#fff;border-radius:4px;min-width:0;width:100%;box-sizing:border-box}
.net-form input:focus{outline:none;border-color:#ffd24a}.net-count{font-size:11px;letter-spacing:.1em;opacity:.7;margin-bottom:8px}
.net-hint{font-size:12px;line-height:1.4;opacity:.7;margin:2px 0 4px}.net-codebtn{align-self:flex-end;white-space:nowrap;padding:8px 14px;width:auto!important;flex:0 0 auto;margin:0!important}
.net-lan{display:flex;flex-direction:column;gap:6px;margin:6px 0}.net-lan span{font-size:11px;letter-spacing:.12em;opacity:.7}.net-lanbtn{text-align:left;font-size:13px;padding:8px 12px}
.net-svc{font-size:11px;letter-spacing:.1em;margin:6px 0 2px;opacity:.85}.net-svc.ok{color:#7fd16b}.net-svc.bad{color:#ff6a5a}.net-count.bad{color:#ff6a5a;opacity:1}
.net-off{font-size:13px;line-height:1.45;opacity:.85;margin:10px 0;padding:10px;border:1px dashed rgba(255,255,255,.3);border-radius:4px}`;
  document.head.appendChild(s);
})();

/* ---------- desktop app: version tag and the patch notes after an update */
setTimeout(() => {
  try {
    const A = window.ASHFALL_APP; if (!A) return;
    const tag = document.createElement('div'); tag.className = 'app-ver'; tag.textContent = 'v' + A.version + ' BETA' + (A.channel === 'test' ? ' · TEST APP' : ''); document.body.appendChild(tag);
    if (A.channel === 'test') { const t = document.createElement('div'); t.className = 'app-testtag'; t.textContent = 'TEST APP · NOT THE LIVE GAME'; document.body.appendChild(t); }
    const u = A.justUpdated; if (!u || (typeof HC_VER !== 'undefined' && String(u.version) === HC_VER)) return;   // the Homecoming splash shows instead
    const m = document.createElement('div'); m.className = 'app-notes';
    const box = document.createElement('div'), h = document.createElement('b'), ul = document.createElement('ul'), ok = document.createElement('button');
    h.textContent = 'BETA UPDATE ' + String(u.version).toUpperCase();
    for (const n of (u.notes || []).slice(0, 12)) { const li = document.createElement('li'); li.textContent = String(n); ul.appendChild(li); }
    if (!ul.children.length) { const li = document.createElement('li'); li.textContent = 'Fixes and improvements.'; ul.appendChild(li); }
    ok.className = 'btn primary'; ok.textContent = 'OK'; ok.onclick = () => m.remove();
    box.append(h, ul, ok); m.appendChild(box); document.body.appendChild(m); setTimeout(() => ok.focus(), 50);
  } catch (e) {}
}, 600);
(() => {
  const s = document.createElement('style');
  s.textContent = `.beta-tag{display:inline-block;vertical-align:top;margin-left:14px;margin-top:.35em;font-size:.22em;letter-spacing:.2em;padding:.25em .6em;border:2px solid #ffd24a;color:#ffd24a;border-radius:4px;font-style:normal}
.app-testtag{position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:60;pointer-events:none;font:700 11px system-ui,sans-serif;letter-spacing:.3em;color:#111;background:#ff6a3d;padding:4px 12px;border-radius:3px}
.app-ver{position:fixed;right:10px;bottom:6px;font:11px monospace;opacity:.45;z-index:5;pointer-events:none;color:#fff}
.app-notes{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:200}
.app-notes>div{background:#14171b;border:1px solid rgba(255,210,74,.5);padding:22px 26px;max-width:520px;width:calc(100% - 32px);box-sizing:border-box;color:#e8e2d0}
.app-notes b{display:block;font-size:18px;letter-spacing:.14em;color:#ffd24a;margin-bottom:12px}.app-notes ul{margin:0 0 18px;padding-left:20px;line-height:1.55;font-size:14px}`;
  document.head.appendChild(s);
})();
