/* ================================================================== WELCOME, NEW MODES and the WEEKLY FEATURED MODE (1.2.72)
   WELCOME: the very first time a new player reaches the menu, a card offers THE STASH YARD training (the basics
   checklist: move, look, shoot, aim, headshot, reload, switch, crouch, jump, melee, grenade, scorestreak), with the
   prompts for the keyboard or the controller they are using. When every basic is ticked, a READY card points to Quick
   Play, Zombies and the Campaign.
   NEW MODES: returning players see once what came in 1.2.68-1.2.71 (LAST TOKE, PROP HUNT, THE HOTBOX, THE GROW OP), and
   ONLINE LAST TOKE and ONLINE PROP HUNT are put into their Quick Play playlist once.
   FEATURED: two tiles on the main menu: THIS WEEK'S FEATURED MODE (a mode with a twist, double XP, against bots; a new
   one every Monday) and LAST TOKE. */
const ONB_KEY = 'ashfall.onb', NEWM_KEY = 'ashfall.newmodes', NEWM_VER = '1.2.72';
const FEAT_WEEKS = [
  { mode: 'ph', name: 'LOW GRAVITY PROP HUNT', sub: 'props and hunters jump twice as high', mut: { lowgrav: 1 } },
  { mode: 'ffa', name: 'BIG HEAD FREE-FOR-ALL', sub: 'every head is twice the size', mut: { bighead: 1 } },
  { mode: 'br', name: 'PISTOL ROYALE', sub: 'LAST TOKE where every crate holds a pistol', mut: { pistols: 1 } },
  { mode: 'tdm', name: 'HARDCORE TEAM DEATHMATCH', sub: 'the bots hit 40% harder', cfg: { hardcore: true } },
  { mode: 'br', name: 'LOW GRAVITY LAST TOKE', sub: 'battle royale on the moon', mut: { lowgrav: 1 } },
  { mode: 'gun', name: 'BIG HEAD GUN GAME', sub: 'twenty guns, giant heads', mut: { bighead: 1 } },
];
const featNow = () => { const w = Math.floor((Date.now() / 864e5 + 3) / 7); return FEAT_WEEKS[((w % FEAT_WEEKS.length) + FEAT_WEEKS.length) % FEAT_WEEKS.length]; };
function featPlay() {
  const f = featNow(); LOBBY.featNext = f; sfx.ui();
  startMatch(f.mode, Object.assign({ map: 'random' }, f.cfg || {}));
}
// called when a match starts: a featured match carries its twist (startMatch reads LOBBY.featNext once)
function featApply() { const f = LOBBY.featNext; LOBBY.featNext = null; if (!M) return; M.feat = f && f.mode === M.mode && !M.online ? Object.assign({ name: f.name }, f.mut || {}) : null; }
// every frame of a featured match: big heads on everyone
function featTick() { if (!M || !M.feat || !M.feat.bighead) return; for (const e of enemies) if (e.rig && e.rig.head && !e.featBH) { e.featBH = true; e.rig.head.scale.multiplyScalar(2); } }
/* ---------- the cards */
function onbCard(html, acts, menuOnly = true) {
  const o = document.createElement('div'); o.className = 'onb-ov'; if (menuOnly) o.dataset.menu = '1'; o.innerHTML = `<div class="onb-box">${html}</div>`; document.body.appendChild(o);
  const close = () => { o.remove(); removeEventListener('keydown', key, true); };
  const key = e => { if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  addEventListener('keydown', key, true);
  for (const b of o.querySelectorAll('[data-onb]')) b.onclick = () => { try { sfx.ui(); } catch (e) {} close(); const f = acts[b.dataset.onb]; if (f) f(); };
  setTimeout(() => { const b = o.querySelector('[data-onb]'); if (b) b.focus(); }, 60);
  return o;
}
function onbWelcome() {
  const pad = typeof inputMode === 'function' && document.body.classList.contains('padnav');
  onbCard(`<small>WELCOME TO ASHFALL · BETA</small><b>NEW HERE?</b><p>Two minutes in THE STASH YARD teach you everything: moving, aiming, headshots, reloading, grenades and scorestreaks. ${pad ? 'Your controller prompts are on.' : 'Using a controller? Plug it in; the prompts switch over.'}</p>
<div class="onb-acts"><button class="btn primary" data-onb="go">TAKE THE TRAINING</button><button class="btn" data-onb="skip">SKIP · I KNOW SHOOTERS</button></div>`,
    { go: () => { ONBS.training = true; startRange(); }, skip: () => {} });
}
function onbReady() {
  onbCard(`<small>TRAINING DONE</small><b>YOU'RE READY</b><p>Everything ticked. Pick where to go next:</p>
<div class="onb-tiles"><button class="onb-t" data-onb="mp"><b>MULTIPLAYER</b><span>quick play with real people</span></button><button class="onb-t" data-onb="z"><b>ZOMBIES</b><span>survive the dead, solo or co-op</span></button><button class="onb-t" data-onb="c"><b>CAMPAIGN</b><span>FIRST HARVEST · the story</span></button></div>
<div class="onb-acts"><button class="btn" data-onb="stay">STAY IN THE STASH YARD</button></div>`,
    { mp: () => { try { leaveGame(); } catch (e) {} actions('go-on'); }, z: () => { try { leaveGame(); } catch (e) {} actions('go-zombies'); }, c: () => { try { leaveGame(); } catch (e) {} actions('campaign'); }, stay: () => {} }, false);
}
function onbNewModes() {
  onbCard(`<small>NEW IN THE BETA</small><b>FOUR NEW WAYS TO PLAY</b>
<div class="onb-tiles"><button class="onb-t" data-onb="br"><b>LAST TOKE</b><span>battle royale · loot crates · the closing Nightshade cloud</span></button><button class="onb-t" data-onb="ph"><b>PROP HUNT</b><span>hide as a crate or a bong, or hunt them</span></button>
<button class="onb-t" data-onb="hb"><b>THE HOTBOX</b><span>endless zombies, no story, no doors</span></button><button class="onb-t" data-onb="gr"><b>THE GROW OP</b><span>grow strains in real time for XP and camos</span></button></div>
<p>Online LAST TOKE and PROP HUNT are now on your QUICK PLAY playlist.</p><div class="onb-acts"><button class="btn primary" data-onb="ok">LET'S GO</button></div>`,
    { br: () => startMatch('br', { map: 'random' }), ph: () => startMatch('ph', { map: 'random' }), hb: () => { ZL.map = 'hotbox'; try { localStorage.setItem('ashfall.zmap', 'hotbox'); } catch (e) {} openZLobby(); }, gr: () => openGrow(), ok: () => {} });
}
const ONBS = { training: false, readyShown: false };
function onbCheck() {
  if (typeof G !== 'undefined' && G.state !== 'menu') for (const o of document.querySelectorAll('.onb-ov[data-menu]')) o.remove();   // a match started (from a key or the party): the menu cards go
  if (typeof G === 'undefined' || G.state !== 'menu' || !$('menu') || $('menu').classList.contains('hide') || document.querySelector('.onb-ov,#hcSplash')) return;
  let onb = null, nm = null; try { onb = localStorage.getItem(ONB_KEY); nm = localStorage.getItem(NEWM_KEY); } catch (e) {}
  const fresh = !(typeof PROG !== 'undefined' && PROG.xp > 0);
  if (!onb) { try { localStorage.setItem(ONB_KEY, '1'); localStorage.setItem(NEWM_KEY, NEWM_VER); } catch (e) {} featPlaylist(); if (fresh) onbWelcome(); return; }
  if (nm !== NEWM_VER && !fresh) { try { localStorage.setItem(NEWM_KEY, NEWM_VER); } catch (e) {} featPlaylist(); onbNewModes(); }
}
// once: the new online modes go into the Quick Play playlist
function featPlaylist() { try { if (!Array.isArray(LOBBY.playlist) || !LOBBY.playlist.length) LOBBY.playlist = ['otdm', 'offa']; for (const k of ['obr', 'oph']) if (MODES[k] && !LOBBY.playlist.includes(k)) LOBBY.playlist.push(k); saveLobby(); } catch (e) {} }
setInterval(() => { try { onbCheck(); if (ONBS.training && !ONBS.readyShown && typeof RG !== 'undefined' && RG.finished) { ONBS.readyShown = true; setTimeout(onbReady, 1500); } } catch (e) {} }, 1000);
/* ---------- the menu tiles */
function featTiles() {
  const row = document.querySelector('#menu .cod-tiles'); if (!row) return; const f = featNow();
  let a = $('featTile'); if (!a) { a = document.createElement('button'); a.id = 'featTile'; a.className = 'cod-tile feat-tile'; a.dataset.act = 'feat-play'; row.insertBefore(a, row.children[2] || null); }
  a.innerHTML = `<small>FEATURED THIS WEEK · 2× XP</small><b>${f.name}</b><span>${f.sub.toUpperCase()} · VS BOTS</span>`;
  let b = $('brTile'); if (!b) { b = document.createElement('button'); b.id = 'brTile'; b.className = 'cod-tile br-tile'; b.dataset.act = 'br-play'; row.insertBefore(b, a.nextSibling); }
  b.innerHTML = '<small>NEW · BATTLE ROYALE</small><b>LAST TOKE</b><span>LOOT · THE NIGHTSHADE CLOUD · LAST ONE STANDING</span>';
}
function featAct(act) {
  if (act === 'feat-play') { featPlay(); return true; }
  if (act === 'br-play') { sfx.ui(); sqPicker(); return true; }
  return false;
}
(() => { const s = document.createElement('style'); s.textContent = `.onb-ov{position:fixed;inset:0;z-index:240;display:flex;align-items:center;justify-content:center;background:rgba(3,4,5,.82)}
.onb-box{max-width:720px;width:92vw;padding:26px 30px;border:1px solid var(--line);background:linear-gradient(160deg,rgba(30,50,30,.55),rgba(8,10,11,.96));display:flex;flex-direction:column;gap:12px}
.onb-box small{font-size:11px;letter-spacing:.3em;color:#8fdc7a}.onb-box>b{font-size:34px;letter-spacing:.18em;color:#fff}.onb-box p{margin:0;color:#ccd;line-height:1.5;font-size:14px}
.onb-acts{display:flex;gap:10px;flex-wrap:wrap}.onb-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
.onb-t{text-align:left;padding:12px;border:1px solid var(--line);background:rgba(255,255,255,.04);color:#fff;cursor:pointer;font:inherit}.onb-t:hover,.onb-t:focus{border-color:#8fdc7a;outline:none;background:rgba(143,220,122,.1)}
.onb-t b{display:block;letter-spacing:.18em;font-size:14px}.onb-t span{font-size:11px;color:var(--dim)}
.cod-tile.feat-tile{border-color:#ffb03a;background:linear-gradient(90deg,rgba(255,176,58,.16),rgba(10,12,13,.7))}.cod-tile.feat-tile small{color:#ffb03a}
.cod-tile.br-tile{border-color:#b06cff;background:linear-gradient(90deg,rgba(176,108,255,.18),rgba(10,12,13,.7))}.cod-tile.br-tile small{color:#c49aff}`; document.head.appendChild(s); })();
