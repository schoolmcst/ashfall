/* ================================================================== lobby: pick a mode, check your class, custom games, stats */
function modeRules(k, cfg) {
  const d = MODES[k], c = cfg || matchCfg(k);
  if (k === 'surv') return 'SOLO · ENDLESS WAVES';
  if (d.online) return `REAL PLAYERS · ${d.teams ? 'TWO TEAMS' : 'EVERYONE VS EVERYONE'} · ${c.score} KILLS A ROUND`;
  const size = d.teams ? `${c.perTeam} V ${c.perTeam}` : `${c.players} PLAYERS`;
  const goal = k === 'gun' ? `${GUN_LADDER.length} GUNS` : k === 'snd' ? `FIRST TO ${c.score} ROUNDS` : `${c.score} ${d.unit}`;
  return `${size} · ${goal}${c.time && k !== 'snd' ? ` · ${c.time} MIN` : ''}`;
}
function openLobby() { G.state = G.state === 'over' ? 'menu' : G.state; renderLobby(); showScreen('lobby'); }
function renderLobby(focusSel) {
  const st = STATS, sel = LOBBY.mode, d = MODES[sel], c = activeClass(), p = ARM[c.p], s = ARM[c.s];
  $('lobPlayer').innerHTML = `<span>K/D <b>${kdS(st.kills, st.deaths)}</b></span><span>WINS <b>${st.wins}</b></span><span>MATCHES <b>${st.matches}</b></span>`;
  $('lobModes').innerHTML = MODE_ORDER.map(k => `<button class="lob-mode${k === sel ? ' on' : ''}" data-mode="${k}"><i>${MODES[k].icon}</i><div><b>${MODES[k].name}</b><small>${modeRules(k)}</small></div></button>`).join('');
  $('lobSel').innerHTML = `<div class="lob-mname">${d.name}</div><div class="lob-mdesc">${d.desc}</div><div class="lob-rules">${modeRules(sel)}${sel !== 'surv' && !d.online ? ` · BOTS ${SKILL[matchCfg(sel).skill].name}` : ''}</div><button class="btn primary lob-go" data-act="lob-start"${d.online && !netReady() ? ' disabled' : ''}>${d.online ? (NET.app ? 'QUICK PLAY' : 'JOIN ROOM') : 'START MATCH'}</button>${d.online ? netLobbyHtml() : ''}`;
  $('lobClass').innerHTML = `<div class="lob-ctop"><span>YOUR CLASS</span><div class="lob-cpick"><button class="mini" data-act="class-" aria-label="Previous class">&lsaquo;</button><b id="lobClassName">${c.name}</b><button class="mini" data-act="class+" aria-label="Next class">&rsaquo;</button></div></div>` +
    `<div class="lob-kit"><div><span>PRIMARY</span><b>${sel === 'gun' ? 'GUN GAME LADDER' : p.name}</b></div><div><span>SECONDARY</span><b>${sel === 'gun' ? '—' : s.name}</b></div><div><span>EQUIPMENT</span><b>${EQUIP[c.e].name}</b></div><div><span>PERK</span><b>${PERKS[c.k].name}</b></div></div>` +
    `<button class="btn" data-act="loadout">EDIT LOADOUT</button>`;
  for (const b of $('lobModes').children) { b.onclick = () => { LOBBY.mode = b.dataset.mode; saveLobby(); sfx.ui(); renderLobby(`#lobModes [data-mode="${LOBBY.mode}"]`); }; b.onfocus = () => { if (LOBBY.mode !== b.dataset.mode) { LOBBY.mode = b.dataset.mode; saveLobby(); renderLobby(`#lobModes [data-mode="${LOBBY.mode}"]`); } }; }
  const foot = $('lobGoFoot'); if (foot) { foot.textContent = d.online ? (NET.app ? 'QUICK PLAY' : 'JOIN ROOM') : 'START MATCH'; foot.disabled = !!(d.online && !netReady()); }
  if (d.online) netLobbyWire();
  if (focusSel) focusFirst(focusSel);
}
function lobbyTab(d) { const i = MODE_ORDER.indexOf(LOBBY.mode); LOBBY.mode = MODE_ORDER[(i + d + MODE_ORDER.length) % MODE_ORDER.length]; saveLobby(); sfx.ui(); renderLobby(`#lobModes [data-mode="${LOBBY.mode}"]`); }

/* ---------- custom game */
const CUS_KEY = 'ashfall.custom.v1';
let CUS = { mode: 'tdm', score: 50, time: 8, perTeam: 6, players: 8, skill: 'regular', hardcore: false };
try { const o = JSON.parse(localStorage.getItem(CUS_KEY) || 'null'); if (o && MODES[o.mode]) CUS = Object.assign(CUS, o); } catch (e) {}
const CUS_LIM = { tdm: [10, 150, 5], ffa: [5, 50, 5], hp: [50, 300, 10], ctf: [1, 10, 1], snd: [1, 8, 1] };
function cusSetMode(k) {
  CUS.mode = k; const d = MODES[k];
  if (CUS_LIM[k]) CUS.score = d.score; CUS.time = d.time || 0; if (d.perTeam) CUS.perTeam = d.perTeam; if (d.players) CUS.players = d.players;
}
function renderCustom() {
  const k = CUS.mode, d = MODES[k], rows = [];
  rows.push({ name: 'MODE', t: 'seg', opts: MODE_ORDER.filter(m => !MODES[m].online).map(m => [m, MODES[m].short]), get: () => CUS.mode, set: v => { cusSetMode(v); } });
  if (CUS_LIM[k]) rows.push({ name: k === 'snd' ? 'ROUNDS TO WIN' : `SCORE LIMIT (${d.unit})`, t: 'range', min: CUS_LIM[k][0], max: CUS_LIM[k][1], step: CUS_LIM[k][2], get: () => CUS.score, set: v => { CUS.score = v; }, fmt: v => v });
  if (k !== 'snd' && k !== 'surv') rows.push({ name: 'TIME LIMIT', hint: '0 = no limit', t: 'range', min: 0, max: 20, step: 1, get: () => CUS.time, set: v => { CUS.time = v; }, fmt: v => v ? v + ' MIN' : 'NONE' });
  if (d.teams) rows.push({ name: 'TEAM SIZE', hint: 'Players on each team, you included', t: 'range', min: 1, max: 8, step: 1, get: () => CUS.perTeam, set: v => { CUS.perTeam = v; }, fmt: v => `${v} V ${v}` });
  else if (k !== 'surv') rows.push({ name: 'PLAYERS', hint: 'You plus bots', t: 'range', min: 2, max: 12, step: 1, get: () => CUS.players, set: v => { CUS.players = v; }, fmt: v => v });
  if (k !== 'surv') rows.push({ name: 'BOT SKILL', t: 'seg', opts: Object.keys(SKILL).map(s => [s, SKILL[s].name]), get: () => CUS.skill, set: v => { CUS.skill = v; } });
  if (k !== 'surv') rows.push({ name: 'HARDCORE', hint: '30 health for everyone: one or two hits kill', t: 'toggle', get: () => CUS.hardcore, set: v => { CUS.hardcore = v; } });
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
  if (CUS.mode === 'surv') return startMatch('surv');
  startMatch(CUS.mode, { score: CUS.mode === 'gun' ? GUN_LADDER.length : CUS.score, time: CUS.time, perTeam: CUS.perTeam, players: CUS.players, skill: CUS.skill, hardcore: CUS.hardcore, custom: true });
}
