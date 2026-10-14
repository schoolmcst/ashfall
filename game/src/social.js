/* ================================================================== social: online status, friend requests, friends leaderboard
   While the game is open you host a tiny "inbox" room under your friend code. Friends peek into it (join for a
   moment, read what you publish, leave) to see that you are online, what you are doing and your online stats.
   A friend request is a visitor that stays in your inbox with a request flag until you accept or decline; the
   answer travels back the same way. With no server, both players have to have the game open. */
const SOC = { inbox: null, busy: false, retryT: 0, peekT: 0, peeking: false, incoming: new Map(), answered: {}, sending: new Map(), lbSort: 'kd', key: '' };
const PENDING_KEY = 'ashfall.frpending.v1';
let FR_PENDING = []; try { const a = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); if (Array.isArray(a)) FR_PENDING = a.filter(c => /^[A-Z2-9]{6}$/.test(c)).slice(0, 20); } catch (e) {}
const pendingSave = () => { try { localStorage.setItem(PENDING_KEY, JSON.stringify(FR_PENDING)); } catch (e) {} };
// what friends see about you
function socMyCard() {
  const st = careerOf(true), doing = M && M.online && NET.on ? (NET.priv && !NET.priv.started ? 'IN A LOBBY' : 'IN A MATCH · ' + (M.def ? M.def.short.replace(/^ONLINE /, '') : '')) : curScreen === 'lobby' ? 'IN THE LOBBY' : 'IN THE MENUS';
  return { n: NET.nick, c: MYCODE, d: doing, p: partyMembers().length, s: [st.kills, st.deaths, st.wins, st.matches, Math.round(st.time), st.score] };
}
async function socHostInbox() {
  if (!NET.app || SOC.inbox || SOC.busy || performance.now() < SOC.retryT) return;
  SOC.busy = true;
  try { SOC.inbox = await P2P.aside('code', 'inbox', MYCODE.toLowerCase()); } catch (e) { SOC.retryT = performance.now() + 20000; }
  SOC.busy = false;
}
// join a friend's inbox for a moment; resolves their card (or null when they are offline)
async function socPeek(code, extra) {
  let r = null;
  try { r = await P2P.aside('code', 'inbox', code.toLowerCase(), { noHost: true }); } catch (e) { return null; }
  r.presence(Object.assign({ peek: 1, n: NET.nick, c: MYCODE }, extra || {}));
  let card = null;
  for (let i = 0; i < 30 && !card; i++) { await new Promise(res => setTimeout(res, 100)); const h = r.peers().find(p => !p.sameTab && p.presence && p.presence.card); if (h) card = h.presence; }
  return { room: r, card };
}
// refresh every friend's status and stats (one at a time, every 30 s while the lobby is open)
async function socPeekAll() {
  if (SOC.peeking || !NET.app) return; SOC.peeking = true;
  for (const f of FRIENDS.slice()) {
    const r = await socPeek(f.c);
    if (r && r.card) { const cd = r.card.card; f.on = true; f.seen = Date.now(); f.n = cleanNick(cd.n) || f.n; f.d = String(cd.d || '').slice(0, 40); f.s = Array.isArray(cd.s) ? cd.s.map(v => +v || 0).slice(0, 6) : f.s; }
    else f.on = false;
    if (r) r.room.leave();
    socRender();
  }
  // outgoing requests that never reached them: try again
  for (const c of FR_PENDING.slice()) if (!SOC.sending.has(c)) socSendRequest(c, true);
  friendsSave(); SOC.peeking = false; socRender();
}
async function socSendRequest(code, quiet) {
  code = cleanFcode(code); if (code.length !== 6 || code === MYCODE || FRIENDS.some(f => f.c === code) || SOC.sending.has(code)) return;
  if (!FR_PENDING.includes(code)) { FR_PENDING.push(code); pendingSave(); }
  SOC.sending.set(code, 'sending'); if (!quiet) PARTY.status = 'friend request sent to ' + code; socRender();
  const r = await socPeek(code, { req: 1 });
  if (!r) { SOC.sending.delete(code); if (!quiet) PARTY.status = code + ' is offline · the request will be sent when they are online'; socRender(); return; }
  SOC.sending.set(code, 'waiting');
  for (let i = 0; i < 600; i++) {   // wait up to a minute for their answer
    await new Promise(res => setTimeout(res, 100));
    const h = r.room.peers().find(p => !p.sameTab && p.presence && p.presence.card), ans = h && h.presence.ans && h.presence.ans[MYCODE];
    if (ans === 1 || ans === 0) {
      FR_PENDING = FR_PENDING.filter(c => c !== code); pendingSave();
      if (ans === 1) { const cd = h.presence.card; FRIENDS.push({ c: code, n: cleanNick(cd.n) || code, on: true, s: cd.s, d: cd.d }); friendsSave(); PARTY.status = cleanNick(cd.n) + ' accepted your friend request'; sfx.streak(); }
      else PARTY.status = code + ' declined your friend request';
      break;
    }
  }
  r.room.leave(); SOC.sending.delete(code); socRender();
}
function socAnswer(code, yes) {
  const q = SOC.incoming.get(code); SOC.incoming.delete(code); SOC.answered[code] = yes ? 1 : 0;
  if (yes && q && !FRIENDS.some(f => f.c === code)) { FRIENDS.push({ c: code, n: q.n, on: true }); friendsSave(); sfx.streak(); }
  setTimeout(() => { delete SOC.answered[code]; }, 20000);
  socRender();
}
function socTick() {
  if (!NET.app) return;
  if (!SOC.inbox) { socHostInbox(); return; }
  if (SOC.inbox.closed) { SOC.inbox = null; return; }
  SOC.inbox.presence({ card: socMyCard(), ans: SOC.answered });
  // visitors asking to be friends
  for (const p of SOC.inbox.peers()) {
    const pr = p.presence; if (p.sameTab || !pr || !pr.req) continue;
    const c = cleanFcode(pr.c); if (c.length !== 6 || SOC.answered[c] !== undefined || FRIENDS.some(f => f.c === c)) continue;
    if (!SOC.incoming.has(c)) { SOC.incoming.set(c, { n: cleanNick(pr.n), t: Date.now() }); showFriendToast(c); socRender(); }
  }
  if ((SOC.peekT -= 0.5) <= 0 && (curScreen === 'lobby' || curScreen === 'leaderboard')) { SOC.peekT = 30; socPeekAll(); }
}
setInterval(() => { try { socTick(); } catch (e) {} }, 500);
function showFriendToast(code) {
  const q = SOC.incoming.get(code); if (!q) return;
  const t = document.createElement('div'); t.className = 'fr-toast';
  t.innerHTML = `<b>FRIEND REQUEST</b><span>${q.n} (${code}) wants to be friends</span><div><button class="mini" data-fa="1">ACCEPT</button><button class="mini" data-fa="0">DECLINE</button></div>`;
  for (const b of t.querySelectorAll('[data-fa]')) b.onclick = () => { socAnswer(code, b.dataset.fa === '1'); t.remove(); };
  document.body.appendChild(t); sfx.ui(); setTimeout(() => t.remove(), 55000);
}
function socRender() { if (typeof partyRender === 'function') partyRender(); if (curScreen === 'leaderboard') renderLeaderboard(); }
// the social block under the friend code in the lobby
function socialHtml() {
  const inc = [...SOC.incoming.entries()], fr = FRIENDS.slice().sort((a, b) => (b.on ? 1 : 0) - (a.on ? 1 : 0) || a.n.localeCompare(b.n));
  return (inc.length ? inc.map(([c, q]) => `<div class="ros-p fr-in"><span class="lv">✉</span>${q.n}<em>WANTS TO BE FRIENDS</em><button class="mini fr-join" data-acc="${c}">ACCEPT</button><button class="mini" data-dec="${c}">✕</button></div>`).join('') : '') +
    (fr.length ? fr.map(f => `<div class="ros-p"><span class="dot ${f.on ? 'on' : ''}"></span><div class="fr-nm"><b>${f.n}</b><small>${f.on ? (f.d || 'ONLINE') : 'OFFLINE'}</small></div><button class="mini fr-join" data-fj="${FRIENDS.indexOf(f)}" ${f.on ? '' : 'disabled'} title="Join their party">JOIN</button><button class="mini fr-del" data-fd="${FRIENDS.indexOf(f)}" title="Remove friend">✕</button></div>`).join('')
      : `<div class="ros-p" style="color:var(--dim)">No friends yet. Send a request with their friend code below.</div>`) +
    FR_PENDING.map(c => `<div class="ros-p" style="color:var(--dim)"><span class="lv">…</span>${c}<em>${SOC.sending.get(c) === 'waiting' ? 'WAITING FOR THEM TO ACCEPT' : 'REQUEST PENDING'}</em><button class="mini" data-pc="${c}" title="Cancel">✕</button></div>`).join('');
}
function socWire() {
  for (const b of document.querySelectorAll('[data-acc]')) b.onclick = () => socAnswer(b.dataset.acc, true);
  for (const b of document.querySelectorAll('[data-dec]')) b.onclick = () => socAnswer(b.dataset.dec, false);
  for (const b of document.querySelectorAll('[data-pc]')) b.onclick = () => { FR_PENDING = FR_PENDING.filter(c => c !== b.dataset.pc); pendingSave(); socRender(); };
}

/* ---------- friends leaderboard */
const LB_COLS = { kd: ['K/D', s => s[1] ? s[0] / s[1] : s[0]], kills: ['KILLS', s => s[0]], wins: ['WINS', s => s[2]], wr: ['WIN %', s => s[3] ? s[2] / s[3] * 100 : 0], spm: ['SCORE / MIN', s => s[4] > 30 ? s[5] / (s[4] / 60) : 0] };
function openLeaderboard() { renderLeaderboard(); showScreen('leaderboard'); SOC.peekT = 0; }
function renderLeaderboard() {
  const me = socMyCard(), rows = [{ n: me.n + ' (YOU)', s: me.s, me: true, on: true }, ...FRIENDS.filter(f => Array.isArray(f.s)).map(f => ({ n: f.n, s: f.s, on: f.on }))];
  const [label, f] = LB_COLS[SOC.lbSort]; rows.sort((a, b) => f(b.s) - f(a.s));
  $('lbTabs').innerHTML = Object.entries(LB_COLS).map(([k, [l]]) => `<button class="tab${k === SOC.lbSort ? ' on' : ''}" data-lb="${k}">${l}</button>`).join('');
  $('lbBody').innerHTML = `<table class="st-table"><tr><th>#</th><th>PLAYER</th><th>K/D</th><th>KILLS</th><th>WINS</th><th>MATCHES</th><th>WIN %</th><th>SCORE / MIN</th></tr>` + rows.map((r, i) => {
    const s = r.s; return `<tr class="${r.me ? 'me' : ''}"><td>${i + 1}</td><td><span class="dot ${r.on ? 'on' : ''}"></span> ${r.n}</td><td>${kdS(s[0], s[1])}</td><td>${s[0]}</td><td>${s[2]}</td><td>${s[3]}</td><td>${pctS(s[2], s[3])}</td><td>${Math.round(LB_COLS.spm[1](s))}</td></tr>`;
  }).join('') + `</table><div class="net-hint" style="padding:10px 2px">Online stats of you and your friends, sorted by ${label}. Friends' numbers update while they are online; offline friends show what they had last time you saw them. A worldwide leaderboard needs an online server; this one only uses your friends.</div>`;
  for (const b of $('lbTabs').children) b.onclick = () => { SOC.lbSort = b.dataset.lb; sfx.ui(); renderLeaderboard(); };
}
(() => {
  const s = document.createElement('style');
  s.textContent = `.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#555;flex:0 0 auto}.dot.on{background:#6fd16b;box-shadow:0 0 6px #6fd16b}
.fr-nm{display:flex;flex-direction:column;gap:2px;min-width:0}.fr-nm b{font-weight:600;letter-spacing:.12em}.fr-nm small{font-size:10px;letter-spacing:.12em;color:var(--dim)}
.ros-p .mini[disabled]{opacity:.35;cursor:default}.fr-in{background:rgba(224,180,74,.1)}
.fr-toast{position:fixed;right:20px;top:80px;z-index:60;width:300px;padding:14px;background:rgba(10,12,13,.95);border:1px solid var(--accent);display:flex;flex-direction:column;gap:6px;font-size:12px;letter-spacing:.06em;color:var(--ink);box-shadow:0 10px 40px rgba(0,0,0,.6)}
.fr-toast b{font-size:11px;letter-spacing:.3em;color:var(--accent)}.fr-toast div{display:flex;gap:8px;margin-top:4px}.fr-toast .mini{width:auto;padding:0 12px;height:28px;pointer-events:auto}
.lbp{width:min(1000px,94vw)}#lbBody{padding:6px 26px 10px;overflow:auto}#lbBody td:nth-child(2),#lbBody th:nth-child(2){text-align:left}#lbBody tr.me td{color:var(--accent)}`;
  document.head.appendChild(s);
})();
