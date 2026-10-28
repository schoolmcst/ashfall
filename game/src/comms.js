/* ================================================================== pause menu CHAT / VOICE panel + lobby party chat
   Everything here is buttons, sliders and text boxes the controller can reach (A on a text box opens the on-screen
   keyboard), so chat and voice work without a keyboard or mouse. */
const PZV = { tab: 'chat' };
function commsPlayers() {
  const out = [];
  try { if (M && M.online) for (const en of M.entries) if (en.netPeer && !en.botLabel && en.name) out.push(en.name); } catch (e) {}
  try { if (typeof PARTY !== 'undefined' && PARTY.room) for (const m of partyMembers()) if (!m.me && m.name && !out.includes(m.name)) out.push(m.name); } catch (e) {}
  return out.slice(0, 16);
}
function renderPauseSide() {
  const el = $('pzSide'); if (!el) return;
  const party = typeof PARTY !== 'undefined' && PARTY.room, players = commsPlayers();
  const tabs = `<div class="pz-tabs"><button class="pz-tab${PZV.tab === 'chat' ? ' on' : ''}" data-act="pz-tab-chat">CHAT</button><button class="pz-tab${PZV.tab === 'voice' ? ' on' : ''}" data-act="pz-tab-voice">VOICE CHAT</button></div>`;
  let body = '';
  if (PZV.tab === 'chat') {
    body = `<div class="pz-chat" id="pzChatLog">${chatLinesHtml(14)}</div>
<div class="pz-row"><button class="btn mini" data-act="pz-ch">${CHAT.ch === 'party' && party ? 'PARTY' : 'ALL'}</button><input id="pzChatIn" maxlength="90" placeholder="Type a message" autocomplete="off"><button class="btn mini primary" data-act="pz-send">SEND</button></div>
<div class="pz-qc">${QUICK_CHAT.map((q, i) => `<button class="btn mini" data-act="qc-${i}">${q}</button>`).join('')}</div>
<div class="pz-row"><span>MATCH CHAT</span><button class="btn mini" data-act="pz-chatmode">${{ on: 'ON', party: 'PARTY ONLY', off: 'OFF' }[CHAT.mode]}</button></div>`;
  } else {
    const sup = voiceSupported();
    body = `${!sup ? '<div class="pz-note">Voice chat needs the desktop app.</div>' : VOICE.err ? `<div class="pz-note">${VOICE.err}</div>` : ''}
<div class="pz-row modes">${[['off', 'OFF'], ['ptt', 'PUSH TO TALK'], ['open', 'OPEN MIC']].map(([k, n]) => `<button class="btn mini${VOICE.mode === k ? ' primary on' : ''}" data-act="vc-${k}">${n}</button>`).join('')}</div>
<div class="pz-note">${VOICE.mode === 'ptt' ? 'Hold V (keyboard) or D-PAD LEFT (controller) to talk.' : VOICE.mode === 'open' ? 'Your mic sends whenever you speak louder than the sensitivity.' : 'Turn voice on to hear and talk to the other players.'}</div>
<label class="pz-sl">VOICE VOLUME <b id="vcVolV">${VOICE.vol}</b><input type="range" id="vcVol" min="0" max="100" value="${VOICE.vol}"></label>
<label class="pz-sl">MIC SENSITIVITY <b id="vcSensV">${VOICE.sens}</b><input type="range" id="vcSens" min="0" max="100" value="${VOICE.sens}"></label>
<div class="pz-meter"><i id="vcMeter"></i></div>`;
  }
  const mutes = players.length ? `<div class="pz-h">PLAYERS · MUTE TURNS OFF THEIR VOICE AND CHAT</div><div class="pz-pl">${players.map((n, i) => { const m = VOICE.muted.has(n) || CHAT.muted.has(n); return `<button class="btn mini${m ? ' on' : ''}" data-act="vm-${i}">${chatEsc(n)} · ${m ? 'MUTED' : 'MUTE'}</button><button class="btn mini${lnBlocked(n) ? ' on' : ''}" data-act="bk-p${i}">${lnBlocked(n) ? 'BLOCKED' : 'BLOCK'}</button>`; }).join('')}</div>` : '';
  el.innerHTML = tabs + body + mutes; el._players = players;
  const vv = $('vcVol'), vs = $('vcSens');
  if (vv) vv.oninput = () => { VOICE.vol = +vv.value; $('vcVolV').textContent = vv.value; voiceSave(); };
  if (vs) vs.oninput = () => { VOICE.sens = +vs.value; $('vcSensV').textContent = vs.value; voiceSave(); };
}
setInterval(() => { const m = $('vcMeter'); if (m && curScreen === 'pause') m.style.width = (VOICE.on ? Math.min(100, VOICE.level * 100) : 0).toFixed(0) + '%'; }, 80);
function commsAct(act) {
  const keep = sel => { renderPauseSide(); try { renderLobChat(); } catch (e) {} focusFirst(sel); };
  if (act === 'pz-tab-chat' || act === 'pz-tab-voice') { PZV.tab = act.slice(7); keep(`[data-act="${act}"]`); return true; }
  if (act === 'pz-send') { const i = $('pzChatIn'); if (i) { chatSend(i.value, CHAT.ch); i.value = ''; } keep('[data-act="pz-send"]'); return true; }
  if (act === 'pz-ch') { CHAT.ch = CHAT.ch === 'party' ? 'all' : 'party'; keep('[data-act="pz-ch"]'); return true; }
  if (act === 'pz-chatmode') { CHAT.mode = { on: 'party', party: 'off', off: 'on' }[CHAT.mode]; chatSave(); keep('[data-act="pz-chatmode"]'); return true; }
  if (/^qc-\d$/.test(act)) { chatSend(QUICK_CHAT[+act.slice(3)], curScreen === 'lobby' ? 'party' : CHAT.ch); keep(`[data-act="${act}"]`); return true; }
  if (/^lqc-\d$/.test(act)) { chatSend(QUICK_CHAT[+act.slice(4)], 'party'); keep(`[data-act="${act}"]`); return true; }
  if (act === 'lob-send') { const i = $('lobChatIn'); if (i) { chatSend(i.value, 'party'); i.value = ''; } keep('[data-act="lob-send"]'); return true; }
  if (/^vc-(off|ptt|open)$/.test(act)) { voiceSetMode(act.slice(3)); setTimeout(() => keep(`[data-act="${act}"]`), 300); return true; }
  if (/^vm-\d+$/.test(act)) { const n = ($('pzSide')._players || [])[+act.slice(3)]; if (n) { const on = !(VOICE.muted.has(n) || CHAT.muted.has(n)); for (const s of [VOICE.muted, CHAT.muted]) on ? s.add(n) : s.delete(n); voiceSave(); chatSave(); } keep(`[data-act="${act}"]`); return true; }
  return false;
}
// the lobby's party chat box (desktop app)
function lobChatHtml() {
  return `<div class="lob-chat"><div class="pz-h">PARTY CHAT</div><div class="pz-chat" id="lobChatLog">${chatLinesHtml(8, 'party')}</div>
<div class="pz-row"><input id="lobChatIn" maxlength="90" placeholder="Message your party" autocomplete="off"><button class="btn mini primary" data-act="lob-send">SEND</button></div>
<div class="pz-qc">${QUICK_CHAT.slice(0, 4).map((q, i) => `<button class="btn mini" data-act="lqc-${i}">${q}</button>`).join('')}</div></div>`;
}
function renderLobChat() { const l = $('lobChatLog'); if (l) l.innerHTML = chatLinesHtml(8, 'party'); }
(() => {
  const s = document.createElement('style');
  s.textContent = `#pause{display:grid!important;grid-template-columns:minmax(260px,320px) minmax(320px,460px);grid-auto-rows:min-content;justify-content:center;align-content:center;column-gap:40px}
#pause.hide{display:none!important}#pause>.big,#pause>.sub{grid-column:1}#pause>.btn{grid-column:1;width:100%;margin:6px 0}
.pz-side{grid-column:2;grid-row:1/span 8;align-self:start;text-align:left;display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid rgba(255,255,255,.18);background:rgba(10,12,13,.82);min-width:0}
.pz-tabs{display:flex;gap:4px}.pz-tab{flex:1;pointer-events:auto;cursor:pointer;font:700 12px inherit;font-family:inherit;letter-spacing:.16em;padding:10px;border:0;border-bottom:3px solid transparent;background:rgba(255,255,255,.04);color:#cfcfcf}
.pz-tab.on,.pz-tab:focus{outline:0;color:#fff;border-bottom-color:var(--accent)}
.pz-chat{height:200px;overflow:auto;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(0,0,0,.35);padding:6px;border:1px solid rgba(255,255,255,.08)}
.pz-row{display:flex;gap:6px;align-items:center}.pz-row input{flex:1;min-width:0;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.3);color:#fff;font:14px inherit;font-family:inherit;padding:9px 10px;pointer-events:auto}.pz-row span{flex:1;font-size:12px;letter-spacing:.14em;color:#d8d8d8}
.pz-side .btn.mini,.lob-chat .btn.mini{width:auto;min-width:0;margin:0;padding:8px 12px;font-size:12px;letter-spacing:.06em}
.pz-qc{display:flex;flex-wrap:wrap;gap:6px}.pz-row.modes .btn{flex:1}.pz-side .btn.on{background:rgba(224,180,74,.2);color:#fff}
.pz-note{font-size:12px;line-height:1.45;color:#d8d8d8}.pz-h{font-size:11px;letter-spacing:.2em;color:var(--accent)}
.pz-sl{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;font-size:12px;letter-spacing:.12em;color:#fff}.pz-sl b{margin-left:auto}.pz-sl input{flex-basis:100%;pointer-events:auto;accent-color:var(--accent)}
.pz-meter{height:6px;background:rgba(255,255,255,.12)}.pz-meter i{display:block;height:100%;width:0;background:#2fd16a;transition:width .08s}
.pz-pl{display:flex;flex-wrap:wrap;gap:6px}
.lob-chat{margin-top:10px;display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid var(--line);background:rgba(0,0,0,.42)}.lob-chat .pz-chat{height:120px}
@media (max-width:820px){#pause{grid-template-columns:1fr}.pz-side{grid-column:1;grid-row:auto}}`;
  document.head.appendChild(s);
})();
