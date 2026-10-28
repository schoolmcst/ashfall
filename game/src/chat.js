/* ================================================================== text chat: ALL (everyone in your match) and PARTY
   Messages ride in presence (cm: the last few [seq, text] I sent), so they work in the app (P2P) and on claude.ai alike.
   The match chat is wiped when the next match starts; party chat stays while the party lasts. Enter opens chat (Tab
   switches ALL / PARTY), Escape closes; on a controller it lives in the pause menu and the lobby (quick chat + the
   on-screen keyboard). Mute anyone from the pause menu. Settings: chat on, party only, or off. */
const CHAT = { log: [], seq: 0, mine: { all: [], party: [] }, seen: new Map(), open: false, ch: 'all', muted: new Set(), mode: 'on' };
try { const o = JSON.parse(localStorage.getItem('ashfall.chat.v1') || 'null'); if (o) { CHAT.mode = ['on', 'party', 'off'].includes(o.mode) ? o.mode : 'on'; CHAT.muted = new Set((o.muted || []).slice(0, 50)); } } catch (e) {}
const chatSave = () => { try { localStorage.setItem('ashfall.chat.v1', JSON.stringify({ mode: CHAT.mode, muted: [...CHAT.muted] })); } catch (e) {} };
const QUICK_CHAT = ['Nice shot!', 'Thanks!', 'Need backup!', 'On my way', 'Enemy spotted', 'Push now!', 'Fall back', 'GG'];
const chatClean = t => dzFilter(String(t || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 90));
const chatEsc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// a new match: empty the match chat (party lines stay)
function chatNewMatch() { CHAT.log = CHAT.log.filter(m => m.ch === 'party'); CHAT.mine.all = []; for (const k of [...CHAT.seen.keys()]) if (k.startsWith('all|')) CHAT.seen.delete(k); chatRender(); }
function chatAdd(m) { CHAT.log.push(Object.assign({ t: performance.now() }, m)); if (CHAT.log.length > 60) CHAT.log.splice(0, CHAT.log.length - 60); chatRender(); try { if (!m.me) sfx.ui(); } catch (e) {} }
function chatSend(txt, ch) {
  txt = chatClean(txt); if (!txt) return;
  ch = ch === 'party' && typeof PARTY !== 'undefined' && PARTY.room ? 'party' : 'all';
  if (ch === 'all' && CHAT.mode !== 'on') { chatAdd({ ch: 'sys', who: '', txt: 'Match chat is off (Settings, or the pause menu)', me: true }); return; }
  const s = ++CHAT.seq, arr = CHAT.mine[ch]; arr.push([s, txt]); if (arr.length > 4) arr.shift();
  chatAdd({ ch, who: (typeof NET !== 'undefined' && NET.nick) || 'YOU', txt, me: true });
  chatPublish();
}
// my recent lines go out with my presence (the match room and the party room)
function chatPublish() {
  try { if (typeof NET !== 'undefined' && NET.room && NET.on) NET.room.presence({ cm: CHAT.mine.all.length ? CHAT.mine.all.slice() : null }); } catch (e) {}
  try { if (typeof PARTY !== 'undefined' && PARTY.room) PARTY.room.presence({ cm: CHAT.mine.party.length ? CHAT.mine.party.slice() : null }); } catch (e) {}
}
// someone's presence carried chat lines: show the ones we haven't seen
function chatIngest(ch, peer, name, cm) {
  const key = ch + '|' + peer, last = CHAT.seen.get(key);
  if (!Array.isArray(cm)) { if (last === undefined) CHAT.seen.set(key, 0); return; }   // seen them with nothing said yet: their first line will show
  let max = last || 0;
  for (const e of cm) {
    if (!Array.isArray(e)) continue; const s = +e[0] | 0, txt = chatClean(e[1]); if (!txt || s <= (last || 0)) continue;
    max = Math.max(max, s);
    if (last === undefined) continue;   // first time we see this player: don't replay their old lines
    if (CHAT.muted.has(name) || (typeof lnBlocked === 'function' && lnBlocked(name)) || (ch === 'all' && CHAT.mode !== 'on') || CHAT.mode === 'off') continue;
    chatAdd({ ch, who: name, txt });
  }
  CHAT.seen.set(key, max);
}
setInterval(() => { try { chatPublish(); if (typeof PARTY !== 'undefined' && PARTY.room) for (const p of PARTY.room.peers()) if (!p.sameTab && p.presence) chatIngest('party', p.peer, cleanNick(p.presence.n), p.presence.cm); } catch (e) {} }, 400);

/* ---------- the HUD chat box (bottom left) and the input */
function chatRender() {
  const box = $('chatLog'); if (!box) return;
  const now = performance.now(), show = CHAT.log.slice(-7);
  box.innerHTML = show.map(m => `<div class="cl ${m.ch}${CHAT.open || now - m.t < 10000 ? '' : ' old'}">${m.ch === 'sys' ? '' : `<em>[${m.ch === 'party' ? 'PARTY' : 'ALL'}]</em> <b>${chatEsc(m.who)}:</b> `}${chatEsc(m.txt)}</div>`).join('');
  box.classList.toggle('open', CHAT.open);
  const pz = $('pzChatLog'); if (pz) pz.innerHTML = chatLinesHtml(14);
  const lb = $('lobChatLog'); if (lb) lb.innerHTML = chatLinesHtml(8, 'party');
}
const chatLinesHtml = (n, only) => CHAT.log.filter(m => !only || m.ch === only || m.ch === 'sys').slice(-n).map(m => `<div class="cl ${m.ch}">${m.ch === 'sys' ? '' : `<em>[${m.ch === 'party' ? 'PARTY' : 'ALL'}]</em> <b>${chatEsc(m.who)}:</b> `}${chatEsc(m.txt)}</div>`).join('') || '<div class="cl sys">No messages yet.</div>';
setInterval(() => { if (CHAT.log.length && !CHAT.open) chatRender(); }, 2500);   // old lines fade
function chatOpen(ch) {
  if (CHAT.mode === 'off') { showMsg('CHAT IS OFF · TURN IT ON IN THE PAUSE MENU'); return; }
  const inp = $('chatIn'); if (!inp) return;
  CHAT.open = true; CHAT.ch = ch || (CHAT.mode === 'party' ? 'party' : 'all'); if (CHAT.ch === 'party' && !(typeof PARTY !== 'undefined' && PARTY.room)) CHAT.ch = 'all';
  $('chatBar').classList.remove('hide'); $('chatCh').textContent = CHAT.ch === 'party' ? 'PARTY' : 'ALL'; inp.value = ''; for (const k in keys) keys[k] = false;
  setTimeout(() => inp.focus(), 0); chatRender();
}
function chatClose() { CHAT.open = false; const inp = $('chatIn'); if (inp) inp.blur(); const b = $('chatBar'); if (b) b.classList.add('hide'); chatRender(); }
// keys while the chat box is open; true = handled (the game ignores the key)
function chatKey(e) {
  if (!CHAT.open || document.activeElement !== $('chatIn')) return false;
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); chatSend($('chatIn').value, CHAT.ch); chatClose(); }
  else if (e.code === 'Escape') { e.preventDefault(); chatClose(); }
  else if (e.code === 'Tab') { e.preventDefault(); if (typeof PARTY !== 'undefined' && PARTY.room) { CHAT.ch = CHAT.ch === 'all' ? 'party' : 'all'; $('chatCh').textContent = CHAT.ch === 'party' ? 'PARTY' : 'ALL'; } }
  return true;
}
(() => {
  const hud = document.getElementById('hud') || document.body, d = document.createElement('div');
  d.id = 'chatWrap'; d.innerHTML = `<div id="chatLog"></div><div id="chatBar" class="hide"><span id="chatCh">ALL</span><input id="chatIn" maxlength="90" autocomplete="off" spellcheck="false" placeholder="Say something · Enter sends · Tab: all / party"></div>`;
  hud.appendChild(d);
  const s = document.createElement('style');
  s.textContent = `#chatWrap{position:fixed;left:28px;bottom:120px;width:min(440px,40vw);z-index:6;pointer-events:none}
#chatLog .cl,.pz-chat .cl,.lob-chat .cl{font-size:13px;line-height:1.45;color:#fff;text-shadow:0 0 2px #000,0 1px 2px #000;padding:1px 8px;background:rgba(0,0,0,.35);margin-top:2px;width:fit-content;max-width:100%;word-break:break-word;transition:opacity .6s}
#chatLog .cl.old{opacity:0}#chatLog.open .cl{opacity:1}.cl em{font-style:normal;color:#d8d8d8;font-size:11px}.cl b{color:#4aa8ff}.cl.party b,.cl.party em{color:#7ef0a0}.cl.sys{color:#ffd23a}
#chatBar{display:flex;margin-top:6px;pointer-events:auto;background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.35)}#chatBar span{padding:8px 10px;font-size:12px;font-weight:700;letter-spacing:.1em;color:#111;background:#ffd23a}
#chatIn{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font:14px inherit;font-family:inherit;padding:8px 10px}`;
  document.head.appendChild(s);
})();
