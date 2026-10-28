/* ================================================================== RANKED PLAY, DAILY JOBS, CREWS, EVENTS
   RANKED: two online playlists (RANKED HARDPOINT and RANKED S&D, 4 v 4). Each finished match moves your skill rating
   (SR): a win adds, a loss takes, how you played nudges it (kills, deaths, objectives); leaving early costs 25. The first
   5 matches move it double (placement). Divisions: SEED, SPROUT, BUD, FLOWER, TOP SHELF, KUSH KING.
   DAILY JOBS: three small jobs a day next to THE PLUG'S LIST, 1,200 XP and 100 DZ each.
   CREWS: make a crew (name + 2-4 letter tag) or join a friend's; your tag shows by your name online, and the friends
   leaderboard has a CREW tab (you and the friends in your crew). With no server, a crew is just the tag your friends share.
   EVENTS: dates with bonus XP and an event calling card for playing 3 matches during them (HAUNTED HARVEST in late
   October, the 4/20 FESTIVAL, the SEASON FINALE, and a DOUBLE XP WEEKEND on the first weekend of each month).
   Saved in PROG (rank, dj, crew, ev). */

/* ---------- ranked */
const RANKS = [
  { n: 'SEED', sr: 0, col: '#9aa3a9' }, { n: 'SPROUT', sr: 1000, col: '#7fd16b' }, { n: 'BUD', sr: 2000, col: '#3fae5a' },
  { n: 'FLOWER', sr: 3000, col: '#c14bff' }, { n: 'TOP SHELF', sr: 4000, col: '#ff7a2a' }, { n: 'KUSH KING', sr: 5000, col: '#ffd23a' },
];
const rankOf = sr => { let r = 0; for (let i = 0; i < RANKS.length; i++) if (sr >= RANKS[i].sr) r = i; return r; };
const RKE = {};
function rankEmblem(i) {
  if (RKE[i]) return RKE[i];
  const c = stickerPaint({ id: 'rk_em_' + i, g: { t: 'sticker', d: i >= 5 ? 'crown' : 'leaf', c: [RANKS[i].col, '#0b0c0d'], txt: i >= 5 ? '' : String(i + 1) } }, 96).cc;
  return (RKE[i] = c.toDataURL());
}
const rankState = () => PROG.rank || (PROG.rank = { sr: 500, best: 500, played: 0, wins: 0, last: null });
function rankMatch(won, partial) {
  if (!M || !M.def || !M.def.ranked || !M.online) return null;
  const R = rankState(), before = R.sr, obj = (MS.plants | 0) + (MS.defuses | 0) + (MS.caps | 0) + Math.floor((MS.hpTime | 0) / 15);
  let d;
  if (partial) { if (MS.time < 60) return null; d = -25; }
  else { const perf = clamp((MS.kills - MS.deaths) * 1.5 + obj * 2, -12, 12); d = won === 1 ? 28 + perf : won === -1 ? -22 + perf * 0.6 : perf * 0.5; }
  if (R.played < 5) d *= 2;
  d = Math.round(d); R.sr = Math.max(0, R.sr + d); R.best = Math.max(R.best, R.sr); if (!partial) { R.played++; if (won === 1) R.wins++; }
  const up = rankOf(R.sr) > rankOf(before), down = rankOf(R.sr) < rankOf(before);
  R.last = { d, before, after: R.sr, up, down, t: Date.now() }; saveProg();
  if (up) setTimeout(() => { showBanner('PROMOTED · ' + RANKS[rankOf(R.sr)].n, `SR ${R.sr}`); try { sfx.streak(); } catch (e) {} }, 800);
  return R.last;
}
function rankResHtml() {
  const R = rankState(), L = R.last; if (!M.def.ranked || !L || Date.now() - L.t > 60000) return '';
  const i = rankOf(L.after), nx = RANKS[i + 1], lo = RANKS[i].sr, f = nx ? (L.after - lo) / (nx.sr - lo) : 1;
  return `<div class="rk-res"><img src="${rankEmblem(i)}" alt=""><div><small>RANKED · ${RANKS[i].n}${R.played <= 5 ? ' · PLACEMENT ' + Math.min(5, R.played) + '/5' : ''}</small><b>SR ${L.after} <em class="${L.d >= 0 ? 'up' : 'dn'}">${L.d >= 0 ? '+' : ''}${L.d}</em></b><div class="pg-bar sm"><s style="width:${f * 100}%"></s></div><span>${nx ? `${nx.sr - L.after} SR TO ${nx.n}` : 'TOP DIVISION'}</span></div></div>`;
}
function rankCardHtml() { const R = rankState(), i = rankOf(R.sr); return `<span class="rk-chip" title="RANKED ${RANKS[i].n} · SR ${R.sr}"><img src="${rankEmblem(i)}" alt="">${RANKS[i].n} · ${R.sr}</span>`; }

/* ---------- daily jobs */
const DJ_POOL = [
  { id: 'kills', name: 'QUICK SMOKE', d: 'Get {n} kills in multiplayer', n: [15, 25, 5] }, { id: 'heads', name: 'HEAD CHANGE', d: 'Get {n} headshot kills', n: [4, 8, 1] },
  { id: 'wins', name: 'ONE GOOD DEAL', d: 'Win {n} match', n: [1, 1, 1] }, { id: 'played', name: 'SESSION', d: 'Finish {n} multiplayer matches', n: [2, 3, 1] },
  { id: 'streaks', name: 'SKY HIGH', d: 'Call in {n} scorestreaks', n: [2, 3, 1] }, { id: 'zkills', name: 'MUNCHIES', d: 'Kill {n} zombies', n: [60, 100, 20] },
  { id: 'finishers', name: 'LIGHTS OUT', d: 'Get {n} finisher from behind', n: [1, 2, 1] }, { id: 'bags', name: 'BAG A FEW', d: 'Bag {n} stash bags in BAGGED UP', n: [3, 5, 1] },
  { id: 'turf', name: 'CORNER STORE', d: 'Take {n} grow spots in TURF WAR', n: [2, 4, 1] }, { id: 'obj', name: 'HANDLE BUSINESS', d: 'Plant, defuse or capture {n} times', n: [1, 2, 1] },
];
const DJD = Object.fromEntries(DJ_POOL.map(w => [w.id, w])), DJ_XP = 1200, DJ_DZ = 100;
function djState() {
  const k = dayKey();
  if (!PROG.dj || PROG.dj.day !== k) {
    const R = makeRng(strHash('dj-' + k)), pool = DJ_POOL.slice(), list = [];
    while (list.length < 3 && pool.length) { const w = pool.splice((R() * pool.length) | 0, 1)[0], [a, b, st] = w.n; list.push({ id: w.id, n: a + Math.round(R() * (b - a) / st) * st, have: 0, done: false }); }
    PROG.dj = { day: k, list }; saveProg();
  }
  return PROG.dj;
}
function djMatch(v) {
  const D = djState(), got = [];
  for (const q of D.list) { if (q.done) continue; q.have = Math.min(q.n, q.have + (v[q.id] | 0)); if (q.have >= q.n) { q.done = true; got.push(DJD[q.id]); wkPay(DJ_XP, DJ_DZ); } }
  if (got.length) { saveProg(); got.forEach((d, i) => setTimeout(() => toast2(`DAILY JOB DONE · ${d.name} · +${DJ_XP.toLocaleString()} XP · +${DJ_DZ} DZ`), 300 + i * 2400)); }
}
function djHtml() {
  const D = djState(), now = new Date(), mid = new Date(now); mid.setHours(24, 0, 0, 0); const h = Math.floor((mid - now) / 36e5), m = Math.floor((mid - now) / 6e4) % 60;
  return `<div class="dj-h"><b>TODAY'S JOBS</b><small>NEW JOBS IN ${h}H ${m}M</small></div><div class="dj-list">` + D.list.map(q => { const d = DJD[q.id]; return `<div class="wk-c dj${q.done ? ' done' : ''}"><div class="wk-ic">${wkIcon(q.id === 'finishers' ? 'bestStreak' : q.id)}</div><div class="wk-m"><b>${d.name}</b><p>${d.d.replace('{n}', q.n)}</p><div class="pg-bar"><s style="width:${q.have / q.n * 100}%"></s></div><small>${q.done ? 'DONE' : q.have + ' / ' + q.n}</small></div><div class="wk-r"><span>+${DJ_XP.toLocaleString()} XP</span><span>${dzIcon()}+${DJ_DZ}</span></div></div>`; }).join('') + '</div>';
}

/* ---------- crews */
const crewTag = () => PROG.crew && PROG.crew.tag ? PROG.crew.tag : '';
function crewMake(name, tag) {
  name = String(name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().slice(0, 18); tag = String(tag || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  if (name.length < 3 || tag.length < 2) { toast2('A CREW NEEDS A NAME (3+ LETTERS) AND A TAG (2-4)'); return false; }
  PROG.crew = { id: (MYCODE || 'X') + '-' + Date.now().toString(36), name, tag, own: 1 }; saveProg(); toast2(`CREW MADE · [${tag}] ${name}`); return true;
}
function crewJoin(cw) { if (!Array.isArray(cw) || !cw[0]) return; PROG.crew = { id: String(cw[0]).slice(0, 40), name: String(cw[1] || '').slice(0, 18), tag: String(cw[2] || '').slice(0, 4) }; saveProg(); toast2(`JOINED [${PROG.crew.tag}] ${PROG.crew.name}`); }
function crewLeave() { PROG.crew = null; saveProg(); toast2('YOU LEFT YOUR CREW'); }
function renderCrewBoard() {
  const C = PROG.crew, me = socMyCard(), mates = FRIENDS.filter(f => C && Array.isArray(f.cw) && f.cw[0] === C.id), joinable = FRIENDS.filter(f => Array.isArray(f.cw) && f.cw[0] && (!C || f.cw[0] !== C.id));
  $('lbTabs').innerHTML = Object.entries(LB_COLS).map(([k, [l]]) => `<button class="tab${k === SOC.lbSort ? ' on' : ''}" data-lb="${k}">${l}</button>`).join('');
  let h = '';
  if (!C) h += `<div class="cw-make"><b>MAKE A CREW</b><p>Pick a name and a 2-4 letter tag. Friends see your crew and can join it from here; your tag shows by your name in online matches.</p><div class="net-form"><label>CREW NAME<input id="cwName" maxlength="18" placeholder="GREEN THUMBS"></label><label>TAG<input id="cwTag" maxlength="4" placeholder="GRN"></label><button class="btn net-codebtn" id="cwMake">MAKE CREW</button></div></div>`;
  else {
    const rows = [{ n: me.n + ' (YOU)', s: me.s, z: me.z, r: rankState().sr, on: true, me: true }, ...mates.map(f => ({ n: f.n, s: f.s || [0, 0, 0, 0, 0, 0], z: f.z, r: f.r || 0, on: f.on }))].sort((a, b) => b.s[0] - a.s[0]);
    const tot = rows.reduce((t, r) => [t[0] + r.s[0], t[1] + r.s[2], t[2] + r.s[3]], [0, 0, 0]);
    h += `<div class="cw-head"><b>[${C.tag}] ${C.name}</b><span>${rows.length} MEMBER${rows.length > 1 ? 'S' : ''} · ${tot[0]} KILLS · ${tot[1]} WINS</span><button class="mini" id="cwLeave">LEAVE</button></div>
<table class="st-table"><tr><th>#</th><th>MEMBER</th><th>RANK</th><th>KILLS</th><th>K/D</th><th>WINS</th><th>MATCHES</th></tr>` + rows.map((r, i) => `<tr class="${r.me ? 'me' : ''}"><td>${i + 1}</td><td><span class="dot ${r.on ? 'on' : ''}"></span> ${r.n}</td><td>${RANKS[rankOf(r.r)].n} · ${r.r}</td><td>${r.s[0]}</td><td>${kdS(r.s[0], r.s[1])}</td><td>${r.s[2]}</td><td>${r.s[3]}</td></tr>`).join('') + '</table>';
  }
  if (joinable.length) h += `<div class="cw-join"><b>FRIENDS' CREWS</b>` + joinable.map(f => `<div class="ros-p"><span class="dot ${f.on ? 'on' : ''}"></span><div class="fr-nm"><b>[${f.cw[2]}] ${f.cw[1]}</b><small>${f.n}'S CREW</small></div><button class="mini fr-join" data-cwj="${FRIENDS.indexOf(f)}">JOIN</button></div>`).join('') + '</div>';
  else if (!FRIENDS.length) h += `<div class="net-hint" style="padding:10px 2px">Add friends with their friend code to grow your crew.</div>`;
  $('lbBody').innerHTML = h;
  for (const b of $('lbTabs').children) b.onclick = () => { SOC.lbSort = b.dataset.lb; sfx.ui(); renderLeaderboard(); };
  const mk = $('cwMake'); if (mk) { for (const i of [$('cwName'), $('cwTag')]) { i.onkeydown = e => e.stopPropagation(); i.onkeyup = e => e.stopPropagation(); } mk.onclick = () => { if (crewMake($('cwName').value, $('cwTag').value)) renderLeaderboard(); }; }
  const lv = $('cwLeave'); if (lv) lv.onclick = () => { crewLeave(); renderLeaderboard(); };
  for (const b of document.querySelectorAll('[data-cwj]')) b.onclick = () => { const f = FRIENDS[+b.dataset.cwj]; if (f) { crewJoin(f.cw); renderLeaderboard(); } };
}

/* ---------- events */
const EVENTS = [
  { id: 'haunt', name: 'HAUNTED HARVEST', sub: 'Double XP · play 3 matches for the HAUNTED HARVEST calling card', xp: 2, from: [10, 24], to: [11, 2], card: 'ev_haunt', col: '#ff7a2a' },
  { id: '420', name: '4/20 FESTIVAL', sub: 'Double XP and +420 DZ a match · play 3 matches for the 4/20 FEST calling card', xp: 2, dz: 420, from: [4, 18], to: [4, 21], card: 'ev_420', col: '#7fd16b' },
  { id: 'finale', name: 'SEASON FINALE', sub: 'Double XP to close out the season', xp: 2, from: [12, 26], to: [12, 31], col: '#ffd23a' },
];
const EVT = { fake: null };
const evNow = () => EVT.fake ? new Date(EVT.fake) : new Date();
function evActive() {
  const d = evNow(), md = (d.getMonth() + 1) * 100 + d.getDate();
  for (const e of EVENTS) { const a = e.from[0] * 100 + e.from[1], b = e.to[0] * 100 + e.to[1]; if (a <= b ? md >= a && md <= b : md >= a || md <= b) return e; }
  // first weekend of the month: Friday to Sunday, the first Friday falls on day 1-7
  const dow = d.getDay(), fri = d.getDate() - ((dow + 2) % 7);   // the date of this weekend's Friday
  if ((dow === 5 || dow === 6 || dow === 0) && fri >= 1 && fri <= 7) return { id: 'dxp', name: 'DOUBLE XP WEEKEND', sub: 'Double XP all weekend', xp: 2, col: '#4aa3ff' };
  return null;
}
function evLeft(e) { if (!e.to) { const d = evNow(), end = new Date(d); end.setDate(d.getDate() + ((7 - d.getDay()) % 7)); end.setHours(23, 59, 59, 0); return end - d; } const d = evNow(), end = new Date(d.getFullYear() + (e.to[0] < e.from[0] && d.getMonth() + 1 >= e.from[0] ? 1 : 0), e.to[0] - 1, e.to[1], 23, 59, 59); return end - d; }
function evMatch(partial) {
  const e = evActive(); if (!e || partial) return;
  PROG.ev = PROG.ev || {}; const k = e.id + '-' + evNow().getFullYear(), n = (PROG.ev[k] | 0) + 1; PROG.ev[k] = n;
  if (e.dz) { PROG.dz += e.dz; setTimeout(() => toast2(`${e.name} · +${e.dz} DZ`), 2600); }
  if (e.card && n === 3 && !PROG.owned[e.card]) { PROG.owned[e.card] = 1; setTimeout(() => toast2(`${e.name} CALLING CARD UNLOCKED · EQUIP IT IN THE LOCKER`), 3200); }
  saveProg();
}
function evStrip() {
  let el = $('evStrip'); const e = evActive(), menu = $('menu');
  if (!e) { if (el) el.remove(); return; }
  if (!el && menu) { el = document.createElement('div'); el.id = 'evStrip'; const t = menu.querySelector('.cod-main'); menu.insertBefore(el, t); }
  if (!el) return;
  const ms = Math.max(0, evLeft(e)), dd = Math.floor(ms / 864e5), hh = Math.floor(ms / 36e5) % 24, k = e.id + '-' + evNow().getFullYear(), n = (PROG.ev && PROG.ev[k]) | 0;
  el.style.setProperty('--ec', e.col);
  el.innerHTML = `<b>EVENT · ${e.name}</b><span>${e.sub}${e.card ? ` · ${Math.min(3, n)}/3` : ''}</span><em>ENDS IN ${dd}D ${hh}H</em>`;
}
(() => { setInterval(() => { try { if (curScreen === 'menu' || curScreen === 'lobby') evStrip(); } catch (e) {} }, 5000); })();
(() => { const s = document.createElement('style'); s.textContent = `.rk-res{display:flex;gap:12px;align-items:center;margin-top:8px;padding:8px 12px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.35)}.rk-res img{width:54px;height:54px}.rk-res small{display:block;font-size:10px;letter-spacing:.24em;color:var(--dim)}.rk-res b{display:block;font-size:20px;color:#fff;letter-spacing:.08em}.rk-res em{font-style:normal;font-size:14px;margin-left:6px}.rk-res em.up{color:#7ef0a0}.rk-res em.dn{color:#ff6a5a}.rk-res span{font-size:10px;letter-spacing:.14em;color:var(--dim)}.rk-res>div{flex:1}
.rk-chip{display:inline-flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.14em;color:#fff;padding:2px 8px 2px 2px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.35)}.rk-chip img{width:22px;height:22px}
.dj-h{display:flex;justify-content:space-between;align-items:baseline;margin:2px 0 6px}.dj-h b{letter-spacing:.24em;color:#fff;font-size:13px}.dj-h small{font-size:10px;letter-spacing:.18em;color:var(--dim)}.dj-list{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:6px}.wk-c.dj{padding:10px}
.cw-make,.cw-join{margin:8px 0;padding:12px;border:1px solid var(--line)}.cw-make b,.cw-join b{letter-spacing:.24em;font-size:12px;color:var(--accent)}.cw-make p{font-size:12px;color:var(--dim);margin:6px 0}
.cw-head{display:flex;align-items:center;gap:14px;padding:10px 0}.cw-head b{font-size:18px;letter-spacing:.12em;color:#fff}.cw-head span{flex:1;font-size:11px;letter-spacing:.14em;color:var(--dim)}
#evStrip{display:flex;gap:16px;align-items:center;margin:0 3vw 8px;padding:8px 14px;border:1px solid var(--ec);background:linear-gradient(90deg,color-mix(in srgb,var(--ec) 22%,transparent),rgba(10,12,13,.75) 60%);pointer-events:none}
#evStrip b{letter-spacing:.24em;font-size:13px;color:#fff}#evStrip span{flex:1;font-size:11px;letter-spacing:.06em;color:var(--ink)}#evStrip em{font-style:normal;font-size:11px;letter-spacing:.18em;color:var(--ec)}`; document.head.appendChild(s); })();
