/* ================================================================== private matches (desktop app)
   A private code (or a private game found on your Wi-Fi) opens a pre-match lobby. Whoever hosts picks the mode, map,
   number of bots, time limit and kill limit; everyone who joins sees the settings and the player list, and the match
   starts when the host presses START. The host's settings travel in its presence (`pc`), so if the host leaves, the
   next host carries on with the same settings. */
const PRIV_KEY = 'ashfall.priv.v1';
let PRIVCFG = { md: 'tdm', mp: 'random', b: 6, tl: 10, sc: 40 };
try { const o = JSON.parse(localStorage.getItem(PRIV_KEY) || 'null'); if (o && typeof o === 'object') Object.assign(PRIVCFG, o); } catch (e) {}
const PRIV_SC = { tdm: [10, 150, 5], ffa: [5, 60, 5], gun: [20, 20, 1], hp: [50, 300, 10], ctf: [1, 10, 1], snd: [1, 8, 1] };
const PRIV_MODE = { tdm: 'otdm', ffa: 'offa', gun: 'ogun', hp: 'ohp', ctf: 'octf', snd: 'osnd' };
function privClean(c) {
  const md = PRIV_SC[c.md] ? c.md : 'tdm', L = PRIV_SC[md];
  return { md, mp: c.mp === 'random' || MAPS[c.mp] ? c.mp : 'random', b: clamp(+c.b | 0, 0, 11), tl: clamp(+c.tl | 0, 0, 30), sc: md === 'gun' ? GUN_LADDER.length : clamp(+c.sc | 0 || L[0], L[0], L[1]) };
}
PRIVCFG = privClean(PRIVCFG);
const privSave = () => { try { localStorage.setItem(PRIV_KEY, JSON.stringify(PRIVCFG)); } catch (e) {} };
const privWanted = () => NET.app && (NET.kind === 'code' || (NET.kind === 'slot' && /-priv-c-/.test(NET.slot || '')));
const privHost = () => !!(NET.room && NET.room.host);
// called by startMatch for an online match: private rooms wait in the lobby instead of dropping straight in
function privEnter() {
  NET.priv = { cfg: Object.assign({}, PRIVCFG), started: false, key: '', kind: NET.kind };
  G.state = 'plobby'; mouseDown = false; mouseAds = false;
  hadLock = false; try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  privApply(); renderPlobby(true); showScreen('plobby');
}
// the room settings -> this game (mode, limits); switching between teams and free-for-all redraws everyone
function privApply() {
  if (NET.priv.pub) return;
  const c = NET.priv.cfg, want = PRIV_MODE[c.md] || 'otdm';
  M.cfg.score = c.sc; M.cfg.time = c.md === 'snd' ? 0 : c.tl;
  if (M.def !== MODES[want]) {
    M.mode = MODES[want].base || want; M.def = MODES[want]; NET.mode = want; M.myTeam = 0; if (M.me) M.me.team = 0;
    M.hp = M.ctf = M.snd = null; M.teamScore = [0, 0]; if (OBJ.group) { scene.remove(OBJ.group); OBJ.group = null; } objSetup(); if (M.mode === 'gun') equipGunGame(0); else { equipClass(activeClass()); G.grenades = EQUIP[G.equip].count; }
    for (const [, R] of NET.rem) { netDropBot(R, false); const i = M.entries.indexOf(R.entry); if (i >= 0) M.entries.splice(i, 1); }
    NET.rem.clear(); netClearBots(); NET.quietT = performance.now() + 2500;
    NET.teamSet = false; NET.joinedAt = performance.now() / 1000 - 1.5;
  }
}
// what the host sends: [mode, map, bots, time, kills, started, round time]
const privPack = () => { const hl = Math.ceil(Math.max(0, G.holdT || 0)); if (NET.priv.pub) return ['P', Math.ceil(Math.max(0, NET.priv.lt)), NET.priv.started ? 1 : 0, Math.round(M.t), hl]; const c = NET.priv.cfg; return [c.md, c.mp, c.b, c.tl, c.sc, NET.priv.started ? 1 : 0, Math.round(M.t), hl]; };
// a player who arrives after the start waits only as long as the host still does (but always sees the loading screen)
function privHoldSync(hh) { if (NET.priv.holdSync || !NET.priv.started || !isFinite(hh)) return; NET.priv.holdSync = true; G.holdT = Math.max(G.loadT || 0, Math.min(G.holdT || 0, hh)); }
function privFromHost(pc) {
  if (!NET.priv || !Array.isArray(pc) || privHost()) return;
  if (pc[0] === 'P') { NET.priv.lt = +pc[1] || 0; if (pc[2] && !NET.priv.started) privBegin(); privHoldSync(+pc[4]); if (NET.priv.started && G.state !== 'over' && Math.abs((+pc[3] || 0) - M.t) > 2) M.t = +pc[3] || 0; return; }
  const c = privClean({ md: pc[0], mp: pc[1], b: pc[2], tl: pc[3], sc: pc[4] });
  if (JSON.stringify(c) !== JSON.stringify(NET.priv.cfg)) { NET.priv.cfg = c; privApply(); if (curScreen === 'plobby') renderPlobby(true); }
  if (pc[5] && !NET.priv.started) privBegin();
  privHoldSync(+pc[7]);
  if (NET.priv.started && G.state !== 'over' && Math.abs((+pc[6] || 0) - M.t) > 2) M.t = +pc[6] || 0;   // keep the round clock in step with the host
}
// host pressed START
function privStart() {
  if (!NET.priv || !privHost() || NET.priv.started) return;
  if (!NET.teamSet) { showMsg('STILL CONNECTING…'); return; }
  if (!NET.priv.pub) { const c = NET.priv.cfg; PRIVCFG = Object.assign({}, c); privSave(); netSwitchMap(pickMapFor(c.mp)); }
  NET.ep++; NET.k = NET.d = 0; G.kills = 0; NET.botT = 0; NET.addT = 0;
  privBegin();
}
function privBegin() {
  NET.priv.started = true; M.t = 0; M.over = false;
  for (const en of M.entries) { en.kills = en.deaths = en.score = 0; en.level = 0; }
  M.teamScore = [0, 0]; NET.ob = null; objSetup(); if (M.mode === 'gun') equipGunGame(0);
  commitPartialStats(); startMatchStats();
  G.state = 'respawning'; G.respT = 0.4; showScreen(null); lockPointer(); updateModeHud(true);
  showBanner(M.def.name.replace(/^ONLINE /, ''), `${mapName(curMap)} · ${modeGoalText()}`);
  matchHold(true); NET.priv.holdSync = false;
}
// how many bots each side should have: the host's count, put where they even out the teams
function privBotWant(humans) {
  const b = NET.priv.cfg.b;
  if (!M.def.teams) return b;
  const w = [0, 0], tot = [humans[0], humans[1]];
  for (let i = 0; i < b; i++) { const t = tot[0] <= tot[1] ? 0 : 1; w[t]++; tot[t]++; }
  return w;
}
function privTick(dt) {
  if (NET.priv.pub && !NET.priv.started && privHost() && NET.teamSet) { NET.priv.lt -= dt; if (NET.priv.lt <= 0) privStart(); }
  if ((NET.priv.uiT = (NET.priv.uiT || 0) - dt) > 0) return; NET.priv.uiT = 0.4;
  if (curScreen === 'plobby') renderPlobby(false);
}
function privPlayers() {
  const L = [{ name: NET.nick, me: true, host: privHost(), team: M.myTeam }];
  for (const R of NET.rem.values()) if (!R.isBot) L.push({ name: R.entry.name, team: R.entry.team, host: !!R.host });
  return L;
}
function renderPlobby(full) {
  if (!NET.priv) return;
  if (NET.priv.pub) return renderPubLobby();
  const host = privHost(), c = NET.priv.cfg, st = NET.room ? '' : (P2P.current ? String(P2P.current.status || 'connecting') : 'connecting');
  $('plTtl').textContent = 'PRIVATE MATCH'; $('plStart').style.display = '';
  $('plCode').textContent = NET.priv.kind === 'code' ? NET.code.toUpperCase() : 'WI-FI';
  const pl = privPlayers();
  $('plPlayers').innerHTML = pl.map(p => `<div class="pl-p${p.me ? ' me' : ''}"><b>${p.name}</b>${p.host ? '<i>HOST</i>' : ''}${p.me ? '<i class="you">YOU</i>' : ''}</div>`).join('') +
    (st ? `<div class="pl-st">${st.toUpperCase()}…</div>` : '') + `<div class="pl-n">${pl.length} PLAYER${pl.length > 1 ? 'S' : ''} · ${c.b} BOT${c.b === 1 ? '' : 'S'}</div>`;
  $('plHint').textContent = host ? `You are the host. Friends type the code ${NET.priv.kind === 'code' ? NET.code.toUpperCase() : ''} under PRIVATE MATCH CODE and press HOST / JOIN; players on your Wi-Fi see this game under ON YOUR WI-FI. Press START when everyone is in.`
    : NET.room ? 'Waiting for the host to start the match.' : 'Connecting to the room…';
  const sb = $('plStart'); sb.disabled = !host || !NET.room; sb.textContent = host ? 'START MATCH' : 'WAITING FOR HOST';
  const key = (host ? 'h' : 'g') + JSON.stringify(c);
  if (!full && NET.priv.key === key) return; NET.priv.key = key;
  const box = $('plSet'); box.innerHTML = '';
  const rows = [
    { name: 'MODE', t: 'seg', opts: [['tdm', 'TDM'], ['ffa', 'FFA'], ['gun', 'GUN GAME'], ['hp', 'HARDPOINT'], ['ctf', 'CTF'], ['snd', 'S&D']], get: () => c.md, set: v => { c.md = v; c.sc = clamp(MODES[PRIV_MODE[v]].score, PRIV_SC[v][0], PRIV_SC[v][1]); } },
    { name: 'MAP', t: 'seg', opts: MAP_CHOICES().map(id => [id, id === 'random' ? 'RANDOM' : MAPS[id].name]), get: () => c.mp, set: v => { c.mp = v; } },
    { name: 'BOTS', hint: 'On top of the real players', t: 'range', min: 0, max: 11, step: 1, get: () => c.b, set: v => { c.b = v; }, fmt: v => v || 'NONE' },
    ...(c.md === 'snd' ? [] : [{ name: 'TIME LIMIT', hint: 'The leader wins when time runs out', t: 'range', min: 0, max: 30, step: 1, get: () => c.tl, set: v => { c.tl = v; }, fmt: v => v ? v + ' MIN' : 'NONE' }]),
    ...(c.md === 'gun' ? [] : [{ name: c.md === 'snd' ? 'ROUNDS TO WIN' : c.md === 'hp' ? 'POINTS TO WIN' : c.md === 'ctf' ? 'CAPTURES TO WIN' : 'KILL LIMIT', hint: c.md === 'tdm' ? 'Team kills to win' : c.md === 'ffa' ? 'Kills to win' : '', t: 'range', min: PRIV_SC[c.md][0], max: PRIV_SC[c.md][1], step: PRIV_SC[c.md][2], get: () => c.sc, set: v => { c.sc = v; }, fmt: v => v }]),
  ];
  const changed = redraw => { NET.priv.cfg = privClean(c); Object.assign(c, NET.priv.cfg); PRIVCFG = Object.assign({}, c); privSave(); privApply(); if (c.mp !== 'random') netSwitchMap(c.mp); NET.priv.key = (host ? 'h' : 'g') + JSON.stringify(c); if (redraw) { renderPlobby(true); } };
  for (const it of rows) {
    const row = document.createElement('div'); row.className = 'setrow';
    const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = it.name; if (it.hint) { const h = document.createElement('span'); h.className = 'hint'; h.textContent = it.hint; nm.appendChild(h); }
    const ctl = document.createElement('div'); ctl.className = 'ctl';
    if (!host) { const v = document.createElement('span'); v.className = 'num pl-ro'; v.textContent = it.t === 'range' ? it.fmt(it.get()) : (it.opts.find(o => o[0] === it.get()) || ['', ''])[1]; ctl.appendChild(v); }
    else if (it.t === 'range') { const r = document.createElement('input'); r.type = 'range'; r.min = it.min; r.max = it.max; r.step = it.step; r.value = it.get(); const n = document.createElement('span'); n.className = 'num'; n.textContent = it.fmt(it.get()); r.oninput = () => { it.set(+r.value); n.textContent = it.fmt(+r.value); changed(false); }; ctl.append(r, n); }
    else { const seg = document.createElement('div'); seg.className = 'seg'; for (const [v, l] of it.opts) { const b = document.createElement('button'); b.textContent = l; b.className = it.get() === v ? 'on' : ''; b.onclick = () => { it.set(v); sfx.ui(); changed(it.name === 'MODE'); if (it.name !== 'MODE') [...seg.children].forEach(x => x.classList.toggle('on', x === b)); }; seg.appendChild(b); } ctl.appendChild(seg); }
    row.append(nm, ctl); box.appendChild(row);
  }
}
(() => {
  const s = document.createElement('style');
  s.textContent = `.plob{width:min(980px,calc(100vw - 32px));max-height:calc(100vh - 40px);overflow:auto;box-sizing:border-box}
.plob .ttl span{color:#ffd24a;margin-left:10px}.plob-body{display:grid;grid-template-columns:1.6fr 1fr;gap:18px;margin:12px 0}
.plob-h{font-size:11px;letter-spacing:.25em;opacity:.7;margin-bottom:8px}.pl-p{display:flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid rgba(255,255,255,.12);margin-bottom:6px;background:rgba(255,255,255,.03)}
.pl-p.me{border-color:rgba(255,210,74,.5)}.pl-p b{flex:1;letter-spacing:.08em}.pl-p i{font-style:normal;font-size:10px;letter-spacing:.2em;padding:2px 6px;border:1px solid #ffd24a;color:#ffd24a}.pl-p i.you{border-color:#7fd16b;color:#7fd16b}
.pl-st,.pl-n{font-size:11px;letter-spacing:.12em;opacity:.7;margin-top:8px}.plob-hint{font-size:12px;line-height:1.45;opacity:.75;margin-bottom:10px}.pl-ro{min-width:0!important;text-align:right;color:#e8e2d0}
.plob .seg{flex-wrap:wrap}@media (max-width:820px){.plob-body{grid-template-columns:1fr}}`;
  document.head.appendChild(s);
})();
