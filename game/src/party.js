/* ================================================================== friends + party (desktop app)
   Everyone has a friend code. While you are in the game you host a small party room under your own code; a friend
   who adds your code can JOIN it from their lobby. The party leader (whoever hosts the party room) presses PLAY and
   the rest of the party follows them into the same match (quick play, pre-game lobby or a private code match). */
const FCODE_KEY = 'ashfall.fcode.v1', FRIENDS_KEY = 'ashfall.friends.v1';
let MYCODE = ''; try { MYCODE = localStorage.getItem(FCODE_KEY) || ''; } catch (e) {}
if (!/^[A-Z2-9]{6}$/.test(MYCODE)) { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; MYCODE = Array.from({ length: 6 }, () => A[(Math.random() * A.length) | 0]).join(''); try { localStorage.setItem(FCODE_KEY, MYCODE); } catch (e) {} }
let FRIENDS = []; try { const a = JSON.parse(localStorage.getItem(FRIENDS_KEY) || '[]'); if (Array.isArray(a)) FRIENDS = a.filter(f => f && /^[A-Z2-9]{6}$/.test(f.c)).slice(0, 40); } catch (e) {}
const friendsSave = () => { try { localStorage.setItem(FRIENDS_KEY, JSON.stringify(FRIENDS)); } catch (e) {} };
const cleanFcode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
const PARTY = { room: null, busy: false, status: '', lastGo: '', key: '', retryT: 0 };
async function partyHostOwn() {
  if (!NET.app || PARTY.room || PARTY.busy || performance.now() < PARTY.retryT) return;
  PARTY.busy = true;
  try { PARTY.room = await P2P.aside('code', 'party', MYCODE.toLowerCase()); PARTY.status = ''; }
  catch (e) { PARTY.status = 'party service offline'; PARTY.retryT = performance.now() + 15000; }
  PARTY.busy = false; partyRender();
}
async function partyJoin(code) {
  code = cleanFcode(code); if (code.length !== 6 || code === MYCODE || PARTY.busy) return;
  PARTY.busy = true; PARTY.status = 'joining ' + code + '…'; partyRender();
  let r = null;
  try { r = await P2P.aside('code', 'party', code.toLowerCase(), { noHost: true }); } catch (e) { PARTY.status = (FRIENDS.find(f => f.c === code) || { n: code }).n + ' is not online'; }
  if (r) { if (PARTY.room) PARTY.room.leave(); PARTY.room = r; PARTY.status = ''; sfx.streak(); }
  PARTY.busy = false; partyRender();
}
function partyLeave() { if (PARTY.room) PARTY.room.leave(); PARTY.room = null; PARTY.lastGo = ''; PARTY.retryT = 0; partyHostOwn(); partyRender(); }
const partyLeader = () => !PARTY.room || PARTY.room.host;
function partyMembers() {
  if (!PARTY.room) return [{ name: NET.nick, me: true, lead: true }];
  return PARTY.room.peers().map(p => ({ name: p.sameTab ? NET.nick : cleanNick(p.presence && p.presence.n), me: !!p.sameTab, lead: p.sameTab ? !!PARTY.room.host : !!(p.presence && p.presence.ld) })).filter(m => m.me || (m.name && m.name !== 'PLAYER'));
}
const partyWaiting = () => !!(PARTY.room && !PARTY.room.host && partyMembers().length > 1);
// the match the leader is in, for everyone else to follow
function partyGo() { if (typeof zcPartyGo === 'function' && zcPartyGo()) return zcPartyGo(); return M && M.online && NET.on && NET.room && NET.room.slot ? { s: NET.room.slot, m: NET.mode } : null; }
function partyFollow(go) {
  if (go && go.m === 'zomb' && typeof zcPartyFollow === 'function') { zcPartyFollow(go); return; }
  if (!go || !MODES[go.m] || !MODES[go.m].online) return;
  if (M && M.online && NET.room && NET.room.slot === go.s) return;
  if (G.state !== 'menu') leaveGame();
  showMsg('JOINING YOUR PARTY LEADER');
  LOBBY.mode = go.m; NET.kind = 'slot'; NET.slot = go.s; NET.pubNext = !/-priv-c-/.test(go.s);
  startMatch(go.m); NET.kind = 'quick';
}
function partyTick() {
  if (!NET.app) return;
  if (!PARTY.room) { partyHostOwn(); return; }
  if (PARTY.room.closed) { PARTY.room = null; return; }
  PARTY.room.presence({ n: NET.nick, ld: PARTY.room.host ? 1 : 0, go: PARTY.room.host ? partyGo() : null });
  if (!PARTY.room.host) {
    const lead = PARTY.room.peers().find(p => !p.sameTab && p.presence && p.presence.ld), go = lead && lead.presence.go;
    if (go && typeof go.s === 'string' && go.s !== PARTY.lastGo) { PARTY.lastGo = go.s; partyFollow(go); }
  }
  const key = JSON.stringify(partyMembers()) + PARTY.status + JSON.stringify(FRIENDS.map(f => [f.on, f.d])) + [...SOC.incoming.keys()] + FR_PENDING + [...SOC.sending.values()];
  if (key !== PARTY.key) { PARTY.key = key; partyRender(); }
}
setInterval(() => { try { partyTick(); } catch (e) {} }, 500);
function partyRender() {
  if (typeof curScreen === 'undefined' || curScreen !== 'lobby') return;
  const a = document.activeElement, typing = a && a.tagName === 'INPUT' && a.closest && a.closest('#partyBox');
  if ($('partyBox') && !typing) { $('partyBox').innerHTML = partyHtml(); partyWire(); }
  if (typeof ZL !== 'undefined' && ZL.on) { ZC.rosterKey = ''; zcLobbyRefresh(false); return; }
  const b = document.querySelector('.cod-go'); if (b && MODES[LOBBY.mode].online) { const w = partyWaiting(); b.disabled = w || !netReady(); const t = b.querySelector('b'); if (t) t.textContent = w ? 'WAITING FOR LEADER' : 'QUICK PLAY'; }
}
function partyHtml() {
  if (!NET.app) return '';
  const mem = partyMembers();
  return `<div class="ros-h"><span>PARTY</span><b>${mem.length} / 6</b></div>` +
    `<div class="ros-team"><div class="tn">${partyLeader() ? 'YOUR PARTY · YOU LEAD' : 'IN A PARTY'}</div>${mem.map(m => `<div class="ros-p${m.me ? ' me' : ''}"><span class="lv">${m.lead ? '★' : '·'}</span>${m.name}${m.lead ? '<em>LEADER</em>' : m.me ? '<em>YOU</em>' : '<em>READY</em>'}</div>`).join('')}` +
    (PARTY.room && !PARTY.room.host ? `<div class="ros-p"><button class="lnk" id="partyLeave">LEAVE PARTY</button></div>` : '') + `</div>` +
    `<div class="ros-team"><div class="tn">YOUR FRIEND CODE <b class="fcode">${MYCODE}</b></div>` +
    `<div class="ros-p fr-add"><input id="frCode" maxlength="6" placeholder="FRIEND CODE TO ADD" autocomplete="off" spellcheck="false"><button class="mini" id="frAdd" style="width:auto;padding:0 10px">SEND REQUEST</button></div></div>` +
    `<div class="ros-team"><div class="tn soc-h">SOCIAL · ${FRIENDS.filter(f => f.on).length} ONLINE<button class="lnk" id="lbOpen">LEADERBOARD ›</button></div>` + socialHtml() +
    (PARTY.status ? `<div class="ros-p" style="color:var(--accent)">${PARTY.status.toUpperCase()}</div>` : '') + `</div>`;
}
function partyWire() {
  const add = $('frAdd'); if (!add) return;
  for (const id of ['frCode']) { const i = $(id); i.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') add.click(); }; i.onkeyup = e => e.stopPropagation(); }
  add.onclick = () => { const c = cleanFcode($('frCode').value); if (c.length !== 6 || c === MYCODE) { $('frCode').focus(); return; } sfx.ui(); socSendRequest(c); };
  socWire(); const lb = $('lbOpen'); if (lb) lb.onclick = () => { sfx.ui(); openLeaderboard(); };
  for (const b of document.querySelectorAll('[data-fj]')) b.onclick = () => { sfx.ui(); partyJoin(FRIENDS[+b.dataset.fj].c); };
  for (const b of document.querySelectorAll('[data-fd]')) b.onclick = () => { FRIENDS.splice(+b.dataset.fd, 1); friendsSave(); partyRender(); };
  const lv = $('partyLeave'); if (lv) lv.onclick = () => { sfx.ui(); partyLeave(); };
}
(() => {
  const s = document.createElement('style');
  s.textContent = `.fcode{color:#fff;letter-spacing:.3em;margin-left:6px}.ros-p .mini{width:auto;height:24px;padding:0 8px;font-size:11px;letter-spacing:.12em;margin-left:6px}.ros-p .mini.fr-join{margin-left:auto;border-color:rgba(224,180,74,.6);color:var(--accent)}
.fr-add{gap:6px}.fr-add input{pointer-events:auto;font:inherit;font-size:12px;letter-spacing:.12em;padding:5px 8px;background:rgba(0,0,0,.35);border:1px solid var(--line);color:#fff;min-width:0;flex:1;text-transform:uppercase}.fr-add input:focus{outline:0;border-color:var(--accent)}`;
  document.head.appendChild(s);
})();
