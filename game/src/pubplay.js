/* ================================================================== quick play: playlist + pre-game lobby (desktop app)
   PLAY in the multiplayer lobby searches every mode on your playlist (Y / Q edits it) for a match someone is already
   hosting; if none, you host one in a random mode from the list. Everyone waits in a pre-game lobby with the player
   list while a 15 second countdown runs (the host's clock), then the match starts for everyone at once. Players who
   find the match after it started drop straight in. */
const ONLINE_MODES = () => MODE_ORDER.filter(k => MODES[k].online);
function playlist() {
  const ok = ONLINE_MODES(); let L = Array.isArray(LOBBY.playlist) ? LOBBY.playlist.filter(k => ok.includes(k)) : [];
  if (!L.length) L = ['otdm', 'offa'];
  return L;
}
const shortName = k => MODES[k].name.replace(/^ONLINE /, '');

/* ---------- playlist screen */
function openPlaylist() { renderPlaylist(); showScreen('playlist'); focusFirst('#plGrid .on'); }
function renderPlaylist() {
  const sel = playlist();
  $('plGrid').innerHTML = ONLINE_MODES().map(k => { const d = MODES[k], on = sel.includes(k);
    return `<button class="mode-card pl-card${on ? ' on' : ''}" data-pl="${k}"><i>${d.icon}</i><b>${shortName(k)}</b><p>${d.desc}</p><span>${modeRules(k)}</span><em>${on ? '✓ IN PLAYLIST' : '+ ADD'}</em></button>`; }).join('');
  $('plCount').textContent = `${sel.length} MODE${sel.length > 1 ? 'S' : ''} SELECTED · ONE IS PICKED AT RANDOM EACH TIME YOU PLAY`;
  for (const b of $('plGrid').children) b.onclick = () => {
    const k = b.dataset.pl, L = playlist().slice(), i = L.indexOf(k); sfx.ui();
    if (i >= 0) { if (L.length > 1) L.splice(i, 1); } else L.push(k);
    LOBBY.playlist = L; LOBBY.mode = L[0]; saveLobby(); renderPlaylist(); focusFirst(`#plGrid [data-pl="${k}"]`);
  };
}

/* ---------- searching -> pre-game lobby */
const QP = { busy: false, status: '' };
async function quickPlay() {
  if (QP.busy) return; QP.busy = true;
  const L = playlist().slice().sort(() => Math.random() - 0.5);
  NET.kind = 'quick'; NET.priv = { pub: true, searching: true, started: false, key: '', lt: 15 };
  QP.status = 'SEARCHING FOR A MATCH'; renderPubLobby(); showScreen('plobby'); G.state = 'plobby';
  let room = null, mode = null;
  for (const k of L) {
    QP.status = `SEARCHING · ${shortName(k)}`; renderPubLobby();
    try { room = await P2P.open('quick', k, '', { noHost: true }); mode = k; break; } catch (e) { if (curScreen !== 'plobby' || !QP.busy) { QP.busy = false; return; } }
  }
  if (!QP.busy || curScreen !== 'plobby') { if (room) room.leave(); QP.busy = false; return; }   // backed out while searching
  if (!mode) { mode = L[0]; QP.status = `NO MATCH FOUND · HOSTING ${shortName(mode)}`; }
  QP.busy = false;
  LOBBY.mode = mode; NET.preRoom = room; NET.pubNext = true; NET.kind = 'quick';
  startMatch(mode);
}
function privEnterPublic() {
  NET.priv = { pub: true, searching: false, started: false, key: '', lt: 15, kind: 'quick' };
  G.state = 'plobby'; mouseDown = false; mouseAds = false;
  hadLock = false; try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  renderPubLobby(); showScreen('plobby');
}
function renderPubLobby() {
  const pv = NET.priv; if (!pv) return;
  const searching = pv.searching || !M || !M.online, d = searching ? null : M.def;
  $('plTtl').textContent = 'MULTIPLAYER LOBBY';
  $('plCode').textContent = searching ? '' : shortName(Object.keys(MODES).find(k => MODES[k] === d) || 'otdm');
  const pl = searching ? [{ name: NET.nick, me: true, host: false }] : privPlayers();
  $('plPlayers').innerHTML = pl.map(p => `<div class="pl-p${p.me ? ' me' : ''}"><b>${p.name}</b>${p.host ? '<i>HOST</i>' : ''}${p.me ? '<i class="you">YOU</i>' : ''}</div>`).join('') +
    `<div class="pl-n">${pl.length} PLAYER${pl.length > 1 ? 'S' : ''}${searching ? '' : ' · BOTS FILL EMPTY SPOTS WHEN IT STARTS'}</div>`;
  const lt = Math.ceil(Math.max(0, pv.lt || 0)), conn = !searching && NET.room && NET.teamSet;
  const big = searching ? `<div class="pub-cd"><small>${QP.status || 'SEARCHING'}</small><b class="spin">···</b></div>`
    : conn ? `<div class="pub-cd"><small>MATCH STARTS IN</small><b>${lt}</b></div>` : `<div class="pub-cd"><small>${String((P2P.current && P2P.current.status) || 'connecting').toUpperCase()}</small><b class="spin">···</b></div>`;
  $('plSet').innerHTML = big + (searching ? `<div class="pub-info"><b>PLAYLIST</b>${playlist().map(shortName).join(' · ')}</div>` :
    `<div class="pub-info"><b>${d.name.replace(/^ONLINE /, '')}</b>${d.desc}</div><div class="pub-info"><b>MAP</b>${mapName(curMap)}</div>`);
  $('plHint').textContent = searching ? 'Looking for a match in your playlist. Press LEAVE to stop.' : 'Players can join until the countdown ends. Change your class with LOADOUT while you wait.';
  const sb = $('plStart'); sb.style.display = 'none';
}
(() => {
  const s = document.createElement('style');
  s.textContent = `.pub-cd{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:26px 10px;border:1px solid rgba(224,180,74,.4);background:rgba(224,180,74,.07);margin-bottom:10px}
.pub-cd small{font-size:11px;letter-spacing:.35em;color:var(--accent)}.pub-cd b{font-size:72px;line-height:1;margin-top:8px;font-variant-numeric:tabular-nums}
.pub-cd b.spin{font-size:40px;letter-spacing:.3em;animation:blink 1s infinite}
.pub-info{padding:10px 12px;border:1px solid var(--line);background:rgba(0,0,0,.35);margin-bottom:8px;font-size:12px;line-height:1.45;color:var(--dim);text-align:left}.pub-info b{display:block;color:var(--ink);letter-spacing:.2em;font-size:12px;margin-bottom:3px}
.pl-card em{position:absolute;right:12px;top:14px;font-style:normal;font-size:10px;letter-spacing:.2em;color:var(--dim)}.pl-card.on em{color:var(--accent)}
.plp{width:min(1100px,94vw)}.pl-count{padding:0 26px 6px;font-size:11px;letter-spacing:.25em;color:var(--dim);text-align:left}`;
  document.head.appendChild(s);
})();
