/* ================================================================== REJOIN and STAND-IN BOTS (1.2.83)
   REJOIN: while you're in an online match your game remembers it (the slot, the mode). If you drop out (the connection
   is lost, the app closes or crashes), a REJOIN tile is on the main menu for 3 minutes and takes you straight back into
   that match. Leaving on purpose forgets it.
   STAND-IN BOTS: when a real player drops out of a match, the host's next bot takes their place: same team, same kills,
   deaths and score, named after them. When they come back (within 3 minutes, same name), they get their score back and
   the stand-in goes. */
const RJ_KEY = 'ashfall.rejoin', RJ_LIFE = 180;
const RJ = { t: 0, gone: new Map(), lost: false };
// every frame of an online match (net.js): remember where I am; notice the room dying under me
function rjTick(dt) {
  if (RJ.restore && M && M.online && NET.teamSet && M.me) { const o = RJ.restore; RJ.restore = null; NET.k = M.me.kills = o.k | 0; NET.d = M.me.deaths = o.d | 0; M.me.score = o.sc | 0; G.kills = o.k | 0; try { showBanner('BACK IN THE MATCH', `${o.k | 0} kills · ${o.d | 0} deaths`); } catch (e) {} }
  if ((RJ.t -= dt) > 0) return; RJ.t = 2;
  if (!M || !M.online || !NET.room || !NET.room.slot) return;
  if (NET.room.closed) { RJ.lost = true; return; }
  try { localStorage.setItem(RJ_KEY, JSON.stringify({ s: NET.room.slot, m: Object.keys(MODES).find(k => MODES[k] === M.def) || NET.mode, n: NET.nick, at: Date.now(), k: M.me ? M.me.kills | 0 : 0, d: M.me ? M.me.deaths | 0 : 0, sc: M.me ? M.me.score | 0 : 0 })); } catch (e) {}
}
// leaving a match (leaveGame -> netLeave): on purpose forgets the match; a lost connection keeps it for the REJOIN tile
function rjLeave() { if (RJ.lost) { RJ.lost = false; return; } try { localStorage.removeItem(RJ_KEY); } catch (e) {} }
function rjSaved() { try { const o = JSON.parse(localStorage.getItem(RJ_KEY) || 'null'); if (o && typeof o.s === 'string' && MODES[o.m] && MODES[o.m].online && Date.now() - o.at < RJ_LIFE * 1000) return o; } catch (e) {} return null; }
function rjGo() {
  const o = rjSaved(); if (!o || !NET.app) return false;
  try { localStorage.removeItem(RJ_KEY); } catch (e) {}
  if (G.state !== 'menu') leaveGame();
  showMsg('REJOINING YOUR MATCH'); try { achAdd('rejoins'); } catch (e) {}
  RJ.restore = o; LOBBY.mode = o.m; NET.kind = 'slot'; NET.slot = o.s; NET.pubNext = !/-priv-c-/.test(o.s);
  startMatch(o.m); NET.kind = 'quick'; return true;
}
// the main menu tile (featTiles calls this)
function rjTile(row) {
  const o = NET.app ? rjSaved() : null; let t = $('rjTile');
  if (!o) { if (t) t.remove(); return; }
  if (!t) { t = document.createElement('button'); t.id = 'rjTile'; t.className = 'cod-tile rj-tile'; t.dataset.act = 'rejoin'; row.insertBefore(t, row.children[1] || null); }
  const left = Math.max(0, Math.ceil(RJ_LIFE - (Date.now() - o.at) / 1000));
  t.innerHTML = `<small>YOU DROPPED OUT · ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} LEFT</small><b>REJOIN MATCH</b><span>${MODES[o.m].name.replace(/^ONLINE /, '')} · BACK WHERE YOU WERE</span>`;
}
setInterval(() => { try { if (typeof curScreen !== 'undefined' && curScreen === 'menu') { const row = document.querySelector('#menu .cod-tiles'); if (row) rjTile(row); } } catch (e) {} }, 1000);
/* ---------- the host's side */
// a real player dropped out: remember them, and let the next bot stand in for them
function rjLeft(R) {
  if (!R || R.isBot || !R.entry || !M || !M.online) return;
  const en = R.entry; RJ.gone.set(en.name, { team: en.team, kills: en.kills | 0, deaths: en.deaths | 0, score: en.score | 0, obj: en.obj | 0, at: performance.now(), used: false });
}
// netNewBot: a stand-in for someone who dropped out of this team (or anyone, in free-for-all)
function rjStandIn(en) {
  const now = performance.now();
  for (const [name, g] of RJ.gone) {
    if (now - g.at > RJ_LIFE * 1000) { RJ.gone.delete(name); continue; }
    if (g.used || (M.def.teams || M.squad > 1 ? g.team !== en.team : false)) continue;
    g.used = true; en.name = String(name).slice(0, 12) + ' BOT'; en.takeOf = name; Object.assign(en, { kills: g.kills, deaths: g.deaths, score: g.score, obj: g.obj });
    try { feedLine(`<b>${en.name}</b> <span class="fw">STANDS IN FOR ${name}</span>`); } catch (e) {}
    return true;
  }
  return false;
}
// a real player arrived: someone coming back gets their score back, and their stand-in goes
function rjJoined(R) {
  if (!R || R.isBot || !R.entry) return;
  const name = R.entry.name, g = RJ.gone.get(name); if (!g) return;
  RJ.gone.delete(name);
  if (performance.now() - g.at > RJ_LIFE * 1000) return;
  Object.assign(R.entry, { kills: g.kills, deaths: g.deaths, score: g.score, obj: g.obj });
  const sb = M.entries.find(en => en.botLabel && en.takeOf === name); if (sb) { const st = { kills: sb.kills, deaths: sb.deaths, score: sb.score }; Object.assign(R.entry, st); try { netRemoveBot(sb); } catch (e) {} }
  try { feedLine(`${nameHtml(R.entry)} <span class="fw">IS BACK</span>`); } catch (e) {}
}
(() => { const s = document.createElement('style'); s.textContent = '.cod-tile.rj-tile{border-color:#5dff7a;background:linear-gradient(90deg,rgba(93,255,122,.18),rgba(10,12,13,.7))}.cod-tile.rj-tile small{color:#7aff8a}'; document.head.appendChild(s); })();
