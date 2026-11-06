/* ================================================================== PRIVATE TOURNAMENTS (1.2.88)
   THE CUP: an 8-player bracket (you and seven named rivals, or friends' names you type in). Every round is a 1v1
   duel to 7 kills on a random map: QUARTER-FINAL, SEMI-FINAL, FINAL; the bots get better each round. The other
   matches in the bracket are played out by the bots off-screen. Win the cup for 2,500 DZ, a CUP WINNER calling
   card and a trophy count. The bracket is saved, so you can stop between rounds. From CUSTOM > TOURNAMENT. */
const TOUR_KEY = 'ashfall.tour.v1', TOUR_ROUNDS = ['QUARTER-FINAL', 'SEMI-FINAL', 'FINAL'], TOUR_SKILL = ['regular', 'hardened', 'veteran'];
let TOUR = null;
try { TOUR = JSON.parse(localStorage.getItem(TOUR_KEY) || 'null'); } catch (e) {}
const tourSave = () => { try { localStorage.setItem(TOUR_KEY, JSON.stringify(TOUR)); } catch (e) {} };
(() => { const it = { id: 'ev_cup', name: 'CUP WINNER', kind: 'banner', r: 3, ev: 1, g: { t: 'rays', c: ['#1a1404', '#ffd23a', '#3a2a08'], em: ['crown', '#ffd23a', '#1a1404'] } }; COSM.push(it); COS[it.id] = it; })();
function tourNew(names) {
  const pool = BOT_NAMES.slice().sort(() => Math.random() - 0.5), list = (names || []).map(s => String(s).trim().toUpperCase().slice(0, 14)).filter(Boolean);
  const rivals = []; for (const n of list) if (rivals.length < 7 && !rivals.includes(n)) rivals.push(n); for (const n of pool) if (rivals.length < 7 && !rivals.includes(n)) rivals.push(n);
  const seeds = ['YOU', ...rivals].sort(() => Math.random() - 0.5);
  TOUR = { round: 0, bracket: [seeds], scores: [[]], done: false, won: false, maps: [] }; tourSave(); return TOUR;
}
// the pair you play this round, and the bots' results for the others
const tourPairs = r => { const L = TOUR.bracket[r], out = []; for (let i = 0; i < L.length; i += 2) out.push([L[i], L[i + 1]]); return out; };
const tourMine = () => tourPairs(TOUR.round).find(p => p.includes('YOU'));
function tourPlay() {
  if (!TOUR || TOUR.done) return false; const pr = tourMine(); if (!pr) return false; const opp = pr[0] === 'YOU' ? pr[1] : pr[0];
  TOUR.playing = 1; tourSave(); LOBBY.tourNext = 1;
  startMatch('ffa', { map: 'random', score: 7, time: 6, players: 2, skill: TOUR_SKILL[TOUR.round] || 'veteran', names: [opp], custom: true, tour: true });
  try { showBanner(`THE CUP · ${TOUR_ROUNDS[TOUR.round]}`, `YOU vs ${opp} · first to 7`); } catch (e) {}
  return true;
}
// the end of a cup match (from endMatch)
function tourResult(won) {
  if (!TOUR || !TOUR.playing || !M || !M.cfg || !M.cfg.tour) return; TOUR.playing = 0;
  const r = TOUR.round, pairs = tourPairs(r), next = [], sc = [];
  for (const p of pairs) {
    if (p.includes('YOU')) { const opp = p[0] === 'YOU' ? p[1] : p[0], en = M.entries.find(e => !e.isPlayer) || { kills: 0 }; next.push(won === 1 ? 'YOU' : opp); sc.push(won === 1 ? [7, en.kills | 0] : [M.me.kills | 0, 7]); }
    else { const a = Math.random() < 0.5, l = (Math.random() * 6) | 0; next.push(a ? p[0] : p[1]); sc.push(a ? [7, l] : [l, 7]); }
  }
  TOUR.scores[r] = sc; TOUR.bracket[r + 1] = next;
  if (won !== 1) { TOUR.done = true; TOUR.won = false; }
  else if (r >= 2) { TOUR.done = true; TOUR.won = true; PROG.dz += 2500; PROG.owned.ev_cup = 1; PROG.cups = (PROG.cups | 0) + 1; try { saveProg(); } catch (e) {} setTimeout(() => { try { showBanner('YOU WON THE CUP', '+2,500 DZ · CUP WINNER calling card'); sfx.streak(); } catch (e) {} }, 1500); }
  else TOUR.round = r + 1;
  tourSave();
}
function tourHtml() {
  if (!TOUR) return `<div class="tour-p"><p>An 8-player bracket of 1v1 duels to 7 kills. Type up to 7 friends' names to put them in it (the bots play as them), or leave it blank for rivals.</p><input id="tourNames" placeholder="NAMES, SPLIT BY COMMAS" maxlength="120"></div>`;
  const col = (r, title) => { const L = TOUR.bracket[r]; if (!L) return `<div class="tour-c"><h4>${title}</h4><div class="tour-m tbd">TBD</div></div>`; const sc = TOUR.scores[r] || [];
    let h = `<div class="tour-c"><h4>${title}</h4>`; for (let i = 0; i < L.length; i += 2) { const s = sc[i / 2], w = TOUR.bracket[r + 1] ? TOUR.bracket[r + 1][i / 2] : null;
      h += `<div class="tour-m">${[0, 1].map(j => `<div class="${L[i + j] === 'YOU' ? 'me ' : ''}${w && w === L[i + j] ? 'win' : w ? 'out' : ''}"><b>${L[i + j] || '—'}</b><em>${s ? s[j] : ''}</em></div>`).join('')}</div>`; }
    return h + '</div>'; };
  const champ = TOUR.bracket[3] ? TOUR.bracket[3][0] : null;
  return `<div class="tour-b">${col(0, 'QUARTER-FINALS')}${col(1, 'SEMI-FINALS')}${col(2, 'FINAL')}<div class="tour-c"><h4>CHAMPION</h4><div class="tour-m champ">${champ ? `<div class="${champ === 'YOU' ? 'me win' : 'win'}"><b>🏆 ${champ}</b></div>` : '<div><b>?</b></div>'}</div></div></div>
  <div class="tour-s">${TOUR.done ? (TOUR.won ? 'YOU WON THE CUP' : 'KNOCKED OUT · start a new cup') : `NEXT: ${TOUR_ROUNDS[TOUR.round]} vs ${(() => { const p = tourMine(); return p ? (p[0] === 'YOU' ? p[1] : p[0]) : ''; })()} · bots: ${SKILL[TOUR_SKILL[TOUR.round]].name}`} · cups won: ${PROG.cups | 0}</div>`;
}
function openTour() {
  let o = $('tourOv'); if (o) o.remove(); o = document.createElement('div'); o.id = 'tourOv';
  const live = TOUR && !TOUR.done;
  o.innerHTML = `<div class="tour-box"><h3>THE CUP · PRIVATE TOURNAMENT</h3>${tourHtml()}<div class="tour-a"><button class="btn" data-tr="x">CLOSE</button>${TOUR ? '<button class="btn" data-tr="new">NEW CUP</button>' : ''}<button class="btn primary" data-tr="${live ? 'play' : TOUR ? 'new' : 'make'}">${live ? 'PLAY ' + TOUR_ROUNDS[TOUR.round] : TOUR ? 'NEW CUP' : 'START THE CUP'}</button></div></div>`;
  document.body.appendChild(o); const i = o.querySelector('#tourNames'); if (i) i.onkeydown = e => e.stopPropagation();
  for (const b of o.querySelectorAll('[data-tr]')) b.onclick = () => { try { sfx.ui(); } catch (e) {} const a = b.dataset.tr;
    if (a === 'x') return o.remove();
    if (a === 'new') { TOUR = null; tourSave(); return openTour(); }
    if (a === 'make') { tourNew((i ? i.value : '').split(',')); return openTour(); }
    if (a === 'play') { o.remove(); tourPlay(); } };
}
(() => { const s = document.createElement('style'); s.textContent = `#tourOv{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;pointer-events:auto}
.tour-box{width:min(980px,94vw);padding:16px 20px;background:rgba(10,13,12,.97);border:1px solid var(--line)}.tour-box h3{margin:0 0 12px;letter-spacing:.3em;font-size:14px;color:var(--accent)}
.tour-p p{font-size:12px;color:var(--dim)}.tour-p input{width:100%;box-sizing:border-box;padding:8px;background:#0b0e0d;border:1px solid var(--line);color:#fff;font:inherit;letter-spacing:.1em}
.tour-b{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;align-items:center}.tour-c h4{margin:0 0 6px;font-size:10px;letter-spacing:.24em;color:var(--dim)}.tour-c{display:flex;flex-direction:column;justify-content:space-around;gap:8px;align-self:stretch}
.tour-m{border:1px solid var(--line);background:rgba(255,255,255,.03)}.tour-m>div{display:flex;justify-content:space-between;padding:4px 8px;font-size:11px;letter-spacing:.1em}.tour-m>div+div{border-top:1px solid rgba(255,255,255,.06)}.tour-m .me b{color:#5dff7a}.tour-m .win{background:rgba(93,255,122,.1)}.tour-m .out{opacity:.4}.tour-m em{font-style:normal;font-weight:700}.tour-m.tbd{padding:6px 8px;font-size:10px;color:var(--dim)}.tour-m.champ{border-color:#ffd23a}
.tour-s{margin-top:12px;font-size:11px;letter-spacing:.16em;color:var(--accent)}.tour-a{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}`; document.head.appendChild(s); })();
