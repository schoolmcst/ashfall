/* ================================================================== lobby: pick a mode, check your class, custom games, stats */
function modeRules(k, cfg) {
  const d = MODES[k], c = cfg || matchCfg(k);
  if (k === 'surv') return 'SOLO · ENDLESS WAVES';
  if (d.online) return `REAL PLAYERS · ${d.teams ? 'TWO TEAMS' : 'EVERYONE VS EVERYONE'} · ${d.base === 'gun' ? GUN_LADDER.length + ' GUNS' : c.score + ' ' + d.unit} A ROUND`;
  const size = d.teams ? `${c.perTeam} V ${c.perTeam}` : `${c.players} PLAYERS`;
  const goal = k === 'gun' ? `${GUN_LADDER.length} GUNS` : k === 'snd' ? `FIRST TO ${c.score} ROUNDS` : `${c.score} ${d.unit}`;
  return `${size} · ${goal}${c.time && k !== 'snd' ? ` · ${c.time} MIN` : ''}`;
}
function openLobby() { G.state = G.state === 'over' ? 'menu' : G.state; renderLobby(); showScreen('lobby'); }
function playerCard(st) {
  const kd = kdS(st.kills, st.deaths), nick = (typeof NET !== 'undefined' && NET.nick) || 'PLAYER';
  const pg = typeof lvlInfo === 'function' ? lvlInfo(PROG.xp) : null;
  if (!pg) return `<div class="em">${nick.slice(0, 1)}</div><div><div class="cs">${nick}</div><span>K/D<b>${kd}</b></span> &nbsp; <span>WINS<b>${st.wins}</b></span> &nbsp; <span>MATCHES<b>${st.matches}</b></span></div>`;
  const pr = PROG.pres | 0;
  return `${pr ? `<span class="pg-pres" title="PRESTIGE ${pr}" style="background-image:url(${presEmblem(pr)})"></span>` : ''}<span class="pg-badge" title="Level ${pg.l}">${pg.l}</span>${pg.l >= MAXLVL && pr < PRES_MAX ? '<button class="pg-presbtn" data-act="pr-open">PRESTIGE</button>' : ''}<div class="pg-cardm" title="K/D ${kd} · WINS ${st.wins} · MATCHES ${st.matches}"><div class="cs">${nick}</div><div class="pg-bar sm pg-cardbar"><s style="width:${pg.frac * 100}%"></s></div></div><span class="pg-dz">${dzIcon()}${PROG.dz.toLocaleString()}</span>`;
}
// your banner behind your player card (menu and lobby)
function cardBanner(el) { try { if (el && typeof bannerUrl === 'function') { el.style.backgroundImage = `linear-gradient(90deg,rgba(0,0,0,.6),rgba(0,0,0,.2)),url(${bannerUrl(bannerFor())})`; el.style.backgroundSize = 'cover'; el.style.backgroundPosition = 'center'; } } catch (e) {} }
function renderMenuCard() {
  const c = $('menuCard'); if (c) { c.innerHTML = playerCard(careerOf(true)); cardBanner(c); }
  const nb = $('newsBody'); if (nb && typeof NEWS !== 'undefined' && !nb._done) { nb._done = 1; nb.innerHTML = NEWS.map((v, i) => `<div class="cn-v"><b>${v.v} BETA${i === 0 ? '<em>NEW</em>' : ''}</b><small>${v.d}</small>${v.name ? `<div class="cn-name">${v.name}</div>` : ''}<ul>${v.n.map(n => `<li>${String(n).replace(/[<&]/g, ch => ch === '<' ? '&lt;' : '&amp;')}</li>`).join('')}</ul></div>`).join(''); }
  const q = $('quitBtn'); if (q) q.style.display = window.ASHFALL_APP ? '' : 'none';
  renderMenuClasses();
}
// home screen class list: click a name to rename it (Enter saves, Escape cancels)
function renderMenuClasses(edit = -1) {
  const box = $('menuClasses'); if (!box) return;
  box.innerHTML = CLASSES.map((c, i) => `<div class="mc-r${i === ACTIVE_CLASS ? ' on' : ''}">${i === edit ? `<input id="mcIn" maxlength="16" value="${c.name.replace(/"/g, '')}" spellcheck="false">` : `<button class="mc-n" data-mc="${i}" title="Rename">${c.name}</button>`}<span>${ARM[c.p].name} · ${ARM[c.s].name}</span></div>`).join('');
  for (const b of box.querySelectorAll('[data-mc]')) b.onclick = () => { sfx.ui(); renderMenuClasses(+b.dataset.mc); };
  const inp = $('mcIn'); if (inp) {
    setTimeout(() => { inp.focus(); inp.select(); }, 0);
    const save = () => { const v = inp.value.trim().toUpperCase().slice(0, 16); if (v) { CLASSES[edit].name = v; saveClasses(); updateClassUI(); } renderMenuClasses(); };
    inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') save(); if (e.key === 'Escape') renderMenuClasses(); }; inp.onkeyup = e => e.stopPropagation(); inp.onblur = save;
  }
}
function privCodeHtml() {
  if (!NET.app) return `<div class="cus-priv"><div class="cp-h">PRIVATE MATCH &middot; ONLINE</div><div class="net-hint">Private code matches run in the desktop app.</div></div>`;
  return `<div class="cus-priv"><div class="cp-h">PRIVATE MATCH &middot; ONLINE</div><div class="net-hint">Type a code and press HOST / JOIN. Friends type the same code. You get a lobby where the host picks the mode, map, bots and time limit.</div>` +
    `<div class="net-form"><label>PRIVATE MATCH CODE<input id="netCode" maxlength="20" value="${NET.code === 'public' ? '' : NET.code}" placeholder="e.g. squad7" autocomplete="off" spellcheck="false"></label><button class="btn net-codebtn" id="netCodeGo">HOST / JOIN</button></div><div class="net-lan" id="netLan"></div></div>`;
}
const modeGroup = k => MODES[k].online ? 'on' : 'off';
function renderLobby(focusSel) {
  if (typeof ZL !== 'undefined' && ZL.on) return renderZLobby(focusSel);
  if (!MODES[LOBBY.mode].online || !playlist().includes(LOBBY.mode)) LOBBY.mode = playlist()[0];
  const sel = LOBBY.mode, d = MODES[sel], online = !!d.online, st = careerOf(online), c = activeClass(), p = ARM[c.p], s = ARM[c.s];
  if (online) LOBBY.lastOn = sel; else LOBBY.lastOff = sel;
  $('lobKind').textContent = 'MULTIPLAYER';
  $('lobPlayer').innerHTML = playerCard(st); cardBanner($('lobPlayer'));
  const gun = sel === 'gun', stk = sel !== 'surv' && !gun;
  const goTxt = online ? (NET.app ? 'QUICK PLAY' : 'JOIN ROOM') : 'START MATCH';
  const m = MAPS[LOBBY.map];
  $('lobSel').innerHTML =
    `<div class="cod-play"><button class="btn primary lob-go cod-go" data-act="lob-start"${online && (!netReady() || (NET.app && partyWaiting())) ? ' disabled' : ''}><small>PLAYLIST · ${playlist().length} MODE${playlist().length > 1 ? 'S' : ''} · Y / Q TO EDIT</small><b>${NET.app ? (partyWaiting() ? 'WAITING FOR LEADER' : 'QUICK PLAY') : 'JOIN ROOM'}</b><span>${playlist().map(k => MODES[k].short.replace(/^ONLINE /, '')).join(' · ')}</span></button>` +
    `<button class="cod-arrow" data-act="playlist" aria-label="Edit playlist" title="Edit playlist (Y / Q)">&#9776;</button></div>` +
    `<div class="cod-row cod-class" data-act="loadout" tabindex="-1"><small>CREATE A CLASS</small><b>${c.name}</b><span>${gun ? 'GUN GAME LADDER · everyone uses the same guns' : `${p.name} · ${s.name} · ${EQUIP[c.e].name} · ${perksOf(c).map(k => PERKS[k].name).join(" · ")}`}</span><div class="arw"><button class="mini" data-act="class-" aria-label="Previous class">&lsaquo;</button><button class="mini" data-act="class+" aria-label="Next class">&rsaquo;</button><button class="mini" data-act="loadout" aria-label="Edit class">&#9998;</button></div></div>` +
    (stk ? `<button class="cod-row" data-act="streaks"><small>SCORESTREAKS</small><b>${STK_SEL.slice().sort((a, b) => STREAKS[a].cost - STREAKS[b].cost).map(id => stkIcon(id)).join('')}</b><span>${STK_SEL.slice().sort((a, b) => STREAKS[a].cost - STREAKS[b].cost).map(id => `${STREAKS[id].name} ${STREAKS[id].cost}`).join(' · ')}</span><i>&rsaquo;</i></button>` : '') +
    (!online && sel !== 'surv' ? `<div class="cod-row"><small>BOT SKILL</small><b>${SKILL[matchCfg(sel).skill].name}</b><span>change it here or in Settings</span><div class="arw"><button class="mini" data-act="diff-" aria-label="Easier">&lsaquo;</button><button class="mini" data-act="diff+" aria-label="Harder">&rsaquo;</button></div></div>` : '') +
    `<button class="cod-row" data-act="custom"><small>PRIVATE CODE MATCHES &middot; SOLO VS BOTS</small><b>CUSTOM</b><span>host or join with a code, or play any mode and map against bots</span><i>&rsaquo;</i></button>` + (online ? netLobbyHtml() : '');
  $('lobRoster').innerHTML = rosterHtml(sel); if (online && NET.app) partyWire();
  if (online) netLobbyWire();
  if (focusSel) focusFirst(focusSel);
}
function rosterHtml(k) {
  const d = MODES[k], cfg = matchCfg(k), names = BOT_NAMES.slice(0, 16), me = (NET.nick || 'YOU');
  const p = (n, cls = '', tag = '') => `<div class="ros-p ${cls}"><span class="lv">${cls === 'me' ? '★' : 'AI'}</span>${n}${tag ? `<em>${tag}</em>` : ''}</div>`;
  const info = `<div class="ros-info"><b>${d.name}</b>${d.desc}</div>`;
  if (k === 'surv') return `<div class="ros-h"><span>SQUAD</span><b>SOLO</b></div><div class="ros-team"><div class="tn">YOU</div>${p(me, 'me', 'READY')}</div>` + info;
  if (d.online && NET.app) return `<div id="partyBox">${partyHtml()}</div>` + (typeof lobChatHtml === 'function' ? lobChatHtml() : '') + info;
  if (d.online) return `<div class="ros-h"><span>${NET.app ? 'QUICK PLAY' : 'ROOM'}</span><b>${d.teams ? '6 V 6' : 'FREE-FOR-ALL'}</b></div><div class="ros-team"><div class="tn">YOUR PARTY</div>${p(me, 'me', 'READY')}<div class="ros-p"><span class="lv">+</span>real players join here &middot; bots fill empty spots</div></div>` + info;
  if (d.teams) { const n = clamp(cfg.perTeam, 1, 8);
    return `<div class="ros-h"><span>LOBBY</span><b>${n} V ${n}</b></div>` +
      `<div class="ros-team" style="--tc:${TEAM_COL[0]}"><div class="tn">YOUR TEAM</div>${p(me, 'me', 'READY')}${names.slice(0, n - 1).map(x => p(x.toUpperCase(), '', 'READY')).join('')}</div>` +
      `<div class="ros-team" style="--tc:${TEAM_COL[1]}"><div class="tn">ENEMY TEAM</div>${names.slice(8, 8 + n).map(x => p(x.toUpperCase(), '', 'READY')).join('')}</div>` + info; }
  const n = clamp(cfg.players, 2, 12);
  return `<div class="ros-h"><span>LOBBY</span><b>${n} PLAYERS</b></div><div class="ros-team"><div class="tn">FREE-FOR-ALL</div>${p(me, 'me', 'READY')}${names.slice(0, n - 1).map(x => p(x.toUpperCase(), '', 'READY')).join('')}</div>` + info;
}
function openModes() {
  const g = modeGroup(LOBBY.mode), list = MODE_ORDER.filter(k => modeGroup(k) === g);
  $('modesTtl').textContent = g === 'on' ? 'ONLINE · GAME MODE' : 'GAME MODE';
  $('modeGrid').innerHTML = list.map(k => `<button class="mode-card${k === LOBBY.mode ? ' on' : ''}" data-mode="${k}"><i>${MODES[k].icon}</i><b>${MODES[k].name}</b><p>${MODES[k].desc}</p><span>${modeRules(k)}</span></button>`).join('');
  for (const b of $('modeGrid').children) b.onclick = () => { LOBBY.mode = b.dataset.mode; saveLobby(); sfx.ui(); renderLobby('.cod-go'); showScreen('lobby'); focusFirst('.cod-go'); };
  showScreen('modes'); focusFirst('#modeGrid .on');
}
// MAP: random or a fixed map (online: used when you end up hosting)
const MAP_CHOICES = () => ['random', ...MAP_ORDER.filter(id => !MAPS[id].hidden)];
function lobbyMapRow(d) {
  const id = LOBBY.map, m = MAPS[id];
  const name = m ? m.name : 'RANDOM', sub = m ? (m.size ? { flash: 'SMALL', core: 'MEDIUM', large: 'LARGE' }[m.size] + ' · ' : '') + m.place : d.online && NET.app ? 'the host picks; you pick when you host' : 'a different map each match';
  return `<div class="lob-map"><span>MAP${d.online && NET.app ? ' (IF YOU HOST)' : ''}</span><div class="lob-cpick"><button class="mini" data-act="map-" aria-label="Previous map">&lsaquo;</button><b>${name}</b><button class="mini" data-act="map+" aria-label="Next map">&rsaquo;</button></div><small>${sub}</small></div>`;
}
function cycleMap(dir) { const L = MAP_CHOICES(), i = Math.max(0, L.indexOf(LOBBY.map)); LOBBY.map = L[(i + dir + L.length) % L.length]; saveLobby(); sfx.ui(); renderLobby('.cod-map [data-act="map' + (dir > 0 ? '+' : '-') + '"]'); }
function lobbyTab(d) { const L = MODE_ORDER.filter(k => modeGroup(k) === modeGroup(LOBBY.mode)), i = L.indexOf(LOBBY.mode); LOBBY.mode = L[(i + d + L.length) % L.length]; saveLobby(); sfx.ui(); renderLobby('.cod-go'); }

/* ---------- custom game */
const CUS_KEY = 'ashfall.custom.v1';
let CUS = { mode: 'tdm', score: 50, time: 8, perTeam: 6, players: 8, skill: 'regular', hardcore: false, map: 'random' };
try { const o = JSON.parse(localStorage.getItem(CUS_KEY) || 'null'); if (o && MODES[o.mode]) CUS = Object.assign(CUS, o); } catch (e) {}
const CUS_LIM = { tdm: [10, 150, 5], ffa: [5, 50, 5], hp: [50, 300, 10], ctf: [1, 10, 1], snd: [1, 8, 1] };
function cusSetMode(k) {
  CUS.mode = k; const d = MODES[k];
  if (CUS_LIM[k]) CUS.score = d.score; CUS.time = d.time || 0; if (d.perTeam) CUS.perTeam = d.perTeam; if (d.players) CUS.players = d.players;
}
function renderCustom() {
  const k = CUS.mode, d = MODES[k], rows = [];
  rows.push({ name: 'MODE', t: 'seg', opts: MODE_ORDER.filter(m => !MODES[m].online).map(m => [m, MODES[m].short]), get: () => CUS.mode, set: v => { cusSetMode(v); } });
  rows.push({ name: 'MAP', t: 'seg', opts: MAP_CHOICES().map(id => [id, id === 'random' ? 'RANDOM' : MAPS[id].name]), get: () => CUS.map || 'random', set: v => { CUS.map = v; } });
  if (CUS_LIM[k]) rows.push({ name: k === 'snd' ? 'ROUNDS TO WIN' : `SCORE LIMIT (${d.unit})`, t: 'range', min: CUS_LIM[k][0], max: CUS_LIM[k][1], step: CUS_LIM[k][2], get: () => CUS.score, set: v => { CUS.score = v; }, fmt: v => v });
  if (k !== 'snd' && k !== 'surv') rows.push({ name: 'TIME LIMIT', hint: '0 = no limit', t: 'range', min: 0, max: 20, step: 1, get: () => CUS.time, set: v => { CUS.time = v; }, fmt: v => v ? v + ' MIN' : 'NONE' });
  if (d.teams) rows.push({ name: 'TEAM SIZE', hint: 'Players on each team, you included', t: 'range', min: 1, max: 8, step: 1, get: () => CUS.perTeam, set: v => { CUS.perTeam = v; }, fmt: v => `${v} V ${v}` });
  else if (k !== 'surv') rows.push({ name: 'PLAYERS', hint: 'You plus bots', t: 'range', min: 2, max: 12, step: 1, get: () => CUS.players, set: v => { CUS.players = v; }, fmt: v => v });
  if (k !== 'surv') rows.push({ name: 'BOT SKILL', t: 'seg', opts: Object.keys(SKILL).map(s => [s, SKILL[s].name]), get: () => CUS.skill, set: v => { CUS.skill = v; } });
  if (k !== 'surv') rows.push({ name: 'HARDCORE', hint: '30 health for everyone: one or two hits kill', t: 'toggle', get: () => CUS.hardcore, set: v => { CUS.hardcore = v; } });
  const cp = $('cusPriv'); if (cp) { cp.innerHTML = privCodeHtml(); if (NET.app) { netLobbyWire(); const g = $('netCodeGo'); if (g) g.onclick = () => { sfx.ui(); if (!MODES[LOBBY.mode].online) LOBBY.mode = LOBBY.lastOn || 'otdm'; netGo('code'); }; } }
  const body = $('cusBody'); body.innerHTML = `<div class="cus-desc">${d.desc}</div>`;
  for (const it of rows) {
    const row = document.createElement('div'); row.className = 'setrow';
    const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = it.name; if (it.hint) { const h = document.createElement('span'); h.className = 'hint'; h.textContent = it.hint; nm.appendChild(h); }
    const ctl = document.createElement('div'); ctl.className = 'ctl';
    if (it.t === 'range') { const r = document.createElement('input'); r.type = 'range'; r.min = it.min; r.max = it.max; r.step = it.step; r.value = it.get(); const n = document.createElement('span'); n.className = 'num'; n.textContent = it.fmt(it.get()); r.oninput = () => { it.set(+r.value); n.textContent = it.fmt(+r.value); saveCus(); }; ctl.append(r, n); }
    else if (it.t === 'toggle') { const sw = document.createElement('div'); sw.className = 'sw' + (it.get() ? ' on' : ''); sw.tabIndex = 0; sw.onclick = () => { it.set(!it.get()); sw.classList.toggle('on', it.get()); saveCus(); sfx.ui(); }; sw.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sw.click(); } }; ctl.appendChild(sw); }
    else { const seg = document.createElement('div'); seg.className = 'seg'; for (const [v, l] of it.opts) { const b = document.createElement('button'); b.textContent = l; b.className = it.get() === v ? 'on' : ''; b.onclick = () => { it.set(v); saveCus(); sfx.ui(); if (it.name === 'MODE') { renderCustom(); focusFirst('#cusBody .seg .on'); } else [...seg.children].forEach(c => c.classList.toggle('on', c === b)); }; seg.appendChild(b); } ctl.appendChild(seg); }
    row.append(nm, ctl); body.appendChild(row);
  }
}
function saveCus() { try { localStorage.setItem(CUS_KEY, JSON.stringify(CUS)); } catch (e) {} }
function startCustom() {
  if (CUS.mode === 'surv') return startMatch('surv', { map: CUS.map });
  startMatch(CUS.mode, { map: CUS.map, score: CUS.mode === 'gun' ? GUN_LADDER.length : CUS.score, time: CUS.time, perTeam: CUS.perTeam, players: CUS.players, skill: CUS.skill, hardcore: CUS.hardcore, custom: true });
}
