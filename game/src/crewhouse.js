/* ================================================================== CREW STASH HOUSE (1.2.68)
   Your crew's hideout, on the CREW tab of the leaderboard. With no server it works like the crew itself: every member
   earns CREW POINTS from their own matches (10 a match, 2 a kill, 20 a win, 3 a zombies round) and shares them on their
   status card; the house is built from the crew's total, so everyone in the crew (who sees the same members) sees the
   same hideout. Eight upgrades at fixed totals. The trophy shelf holds one trophy per zombies story the crew has finished.
   WEEKLY CREW GOAL: kills by the whole crew this week (Monday to Sunday); reaching it pays every member who claims it
   1,000 DZ and a free ELITE chance box. Saved in PROG.cr = { id, cp, wk, k, claimed }. */
const CH_UPS = [[0, 'THE EMPTY ROOM', 'a bare room with a bulb'], [500, 'THE COUCH', 'a beaten-up couch and a rug'], [1500, 'THE NEON', 'your crew tag in neon on the wall'],
  [3000, 'THE POOL TABLE', 'green felt and a lamp over it'], [6000, 'THE GROW TENT', 'a purple-lit tent in the corner'], [10000, 'THE ARCADE', 'an arcade cabinet that still works'],
  [16000, 'THE DJ BOOTH', 'decks, speakers and lights'], [25000, 'THE PENTHOUSE', 'gold records? no. green ones. and a view']];
function chState() {
  const C = PROG.crew; if (!C) return null;
  if (!PROG.cr || PROG.cr.id !== C.id) PROG.cr = { id: C.id, cp: 0, wk: wkKey(), k: 0, claimed: '' };
  if (PROG.cr.wk !== wkKey()) { PROG.cr.wk = wkKey(); PROG.cr.k = 0; }
  return PROG.cr;
}
// after every match (from growMatch, so once per match)
function crewMatch(won, kills, zr) {
  const s = chState(); if (!s) return; s.cp += 10 + 2 * (kills | 0) + (won === 1 ? 20 : 0) + 3 * (zr | 0); s.k += kills | 0; try { saveProg(); } catch (e) {}
}
// the crew's totals: me plus the friends in my crew (from their cards)
function chTotals() {
  const C = PROG.crew, s = chState(); if (!C || !s) return null;
  const mates = (typeof FRIENDS !== 'undefined' ? FRIENDS : []).filter(f => Array.isArray(f.cw) && f.cw[0] === C.id);
  const cp = s.cp + mates.reduce((t, f) => t + (+f.cp || 0), 0), k = s.k + mates.reduce((t, f) => t + (f.ckw === wkKey() ? +f.ck || 0 : 0), 0);
  const story = Math.min(6, (typeof zstCard === 'function' ? zstCard()[3] : 0) + mates.reduce((t, f) => t + (Array.isArray(f.z) ? +f.z[3] || 0 : 0), 0));
  const members = 1 + mates.length, goal = Math.min(600, 150 * members), lvl = CH_UPS.filter(u => cp >= u[0]).length - 1;
  return { cp, k, story, members, goal, lvl, next: CH_UPS[lvl + 1] || null };
}
function chClaim() { const s = chState(), T = chTotals(); if (!s || !T || T.k < T.goal || s.claimed === s.wk) return false; s.claimed = s.wk; PROG.dz += 1000; PROG.tok = PROG.tok || { std: 0, elite: 0, prestige: 0 }; PROG.tok.elite = (PROG.tok.elite | 0) + 1; saveProg(); try { showBanner('WEEKLY CREW GOAL', '+1,000 DZ · a free ELITE chance box'); sfx.streak(); } catch (e) {} return true; }
// the hideout picture: each upgrade adds its piece
function chDraw(cv, T) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, L = T.lvl, tag = (PROG.crew && PROG.crew.tag) || 'CREW';
  const wall = g.createLinearGradient(0, 0, 0, H * 0.72); wall.addColorStop(0, L >= 7 ? '#1a2a22' : '#22201e'); wall.addColorStop(1, L >= 7 ? '#0e1a14' : '#151312'); g.fillStyle = wall; g.fillRect(0, 0, W, H * 0.72);
  g.fillStyle = L >= 1 ? '#3a2a20' : '#2a2622'; g.fillRect(0, H * 0.72, W, H * 0.28);
  if (L >= 7) { g.fillStyle = '#0a1420'; g.fillRect(W * 0.62, H * 0.1, W * 0.3, H * 0.32); g.fillStyle = '#ffd890'; for (let i = 0; i < 26; i++) g.fillRect(W * 0.63 + (i * 37 % 100) / 100 * W * 0.28, H * 0.2 + (i * 53 % 100) / 100 * H * 0.2, 2, 3); g.strokeStyle = '#555'; g.lineWidth = 3; g.strokeRect(W * 0.62, H * 0.1, W * 0.3, H * 0.32); }
  // the bulb
  g.strokeStyle = '#444'; g.beginPath(); g.moveTo(W * 0.5, 0); g.lineTo(W * 0.5, H * 0.12); g.stroke(); const bl = g.createRadialGradient(W * 0.5, H * 0.14, 2, W * 0.5, H * 0.14, W * 0.35); bl.addColorStop(0, 'rgba(255,220,160,.5)'); bl.addColorStop(1, 'rgba(255,220,160,0)'); g.fillStyle = bl; g.fillRect(0, 0, W, H); g.fillStyle = '#ffe8b0'; g.beginPath(); g.arc(W * 0.5, H * 0.14, 6, 0, TAU); g.fill();
  if (L >= 2) { g.save(); g.shadowColor = '#5dff7a'; g.shadowBlur = 18; g.fillStyle = '#7aff8a'; g.font = `bold ${H * 0.13}px sans-serif`; g.textAlign = 'center'; g.fillText('[' + tag + ']', W * 0.3, H * 0.3); g.restore(); }
  if (L >= 1) { g.fillStyle = '#5a1a20'; g.fillRect(W * 0.08, H * 0.56, W * 0.32, H * 0.14); g.fillRect(W * 0.08, H * 0.48, W * 0.32, H * 0.09); g.fillStyle = '#6a2a24'; g.fillRect(W * 0.06, H * 0.5, W * 0.04, H * 0.2); g.fillRect(W * 0.38, H * 0.5, W * 0.04, H * 0.2); g.fillStyle = 'rgba(160,60,40,.5)'; g.beginPath(); g.ellipse(W * 0.3, H * 0.86, W * 0.22, H * 0.06, 0, 0, TAU); g.fill(); }
  if (L >= 3) { g.fillStyle = '#3a2412'; g.fillRect(W * 0.46, H * 0.62, W * 0.3, H * 0.08); g.fillStyle = '#1a6a3a'; g.fillRect(W * 0.47, H * 0.6, W * 0.28, H * 0.04); for (const x of [0.48, 0.73]) g.fillRect(W * x, H * 0.7, W * 0.02, H * 0.1); g.fillStyle = '#ffe0a0'; g.fillRect(W * 0.55, H * 0.44, W * 0.12, H * 0.02); }
  if (L >= 4) { g.fillStyle = '#2a1a3a'; g.fillRect(W * 0.82, H * 0.38, W * 0.15, H * 0.36); const pg = g.createLinearGradient(0, H * 0.38, 0, H * 0.74); pg.addColorStop(0, 'rgba(192,112,255,.7)'); pg.addColorStop(1, 'rgba(192,112,255,.1)'); g.fillStyle = pg; g.fillRect(W * 0.83, H * 0.4, W * 0.13, H * 0.32); g.fillStyle = '#3a8a2a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(W * (0.845 + i * 0.03), H * 0.72); g.lineTo(W * (0.86 + i * 0.03), H * 0.5); g.lineTo(W * (0.875 + i * 0.03), H * 0.72); g.fill(); } }
  if (L >= 5) { g.fillStyle = '#1a1a2a'; g.fillRect(W * 0.02, H * 0.3, W * 0.06, H * 0.42); g.fillStyle = '#3ab8ff'; g.fillRect(W * 0.025, H * 0.36, W * 0.05, H * 0.08); g.fillStyle = '#ff3ab0'; g.fillRect(W * 0.03, H * 0.48, W * 0.04, H * 0.02); }
  if (L >= 6) { g.fillStyle = '#111'; g.fillRect(W * 0.44, H * 0.36, W * 0.16, H * 0.08); for (const x of [0.47, 0.56]) { g.fillStyle = '#333'; g.beginPath(); g.arc(W * x, H * 0.4, H * 0.025, 0, TAU); g.fill(); } for (const x of [0.42, 0.6]) { g.fillStyle = '#0c0c0c'; g.fillRect(W * x, H * 0.3, W * 0.03, H * 0.14); } }
  // the trophy shelf (one per zombies story the crew finished)
  g.fillStyle = '#4a3020'; g.fillRect(W * 0.6, H * 0.24, W * 0.2, H * 0.015); for (let i = 0; i < T.story; i++) { g.fillStyle = '#c8d0d8'; g.fillRect(W * (0.61 + i * 0.031), H * 0.2, W * 0.018, H * 0.04); g.fillStyle = '#7aff8a'; g.fillRect(W * (0.612 + i * 0.031), H * 0.19, W * 0.014, H * 0.012); }
}
function chHtml() {
  const T = chTotals(); if (!T) return ''; const s = chState(), done = T.k >= T.goal, claimed = s.claimed === s.wk;
  return `<div class="ch-wrap"><canvas id="chCv" width="560" height="260"></canvas><div class="ch-info"><b>THE STASH HOUSE · ${CH_UPS[T.lvl][1]}</b>
<span>${T.cp.toLocaleString()} CREW POINTS · ${T.members} MEMBER${T.members > 1 ? 'S' : ''} · YOU ADDED ${s.cp.toLocaleString()}</span>
${T.next ? `<div class="gr-bar"><s style="width:${Math.min(100, (T.cp - CH_UPS[T.lvl][0]) / (T.next[0] - CH_UPS[T.lvl][0]) * 100).toFixed(1)}%;background:#7adf6a"></s></div><small>NEXT: ${T.next[1]} (${T.next[2]}) at ${T.next[0].toLocaleString()}</small>` : '<small>EVERY UPGRADE BUILT</small>'}
<b style="margin-top:8px">WEEKLY CREW GOAL</b><span>${Math.min(T.k, T.goal)} / ${T.goal} KILLS BY THE CREW THIS WEEK · 1,000 DZ + AN ELITE BOX EACH</span><div class="gr-bar"><s style="width:${Math.min(100, T.k / T.goal * 100).toFixed(1)}%;background:#ffb03a"></s></div>
<button class="mini" id="chClaim"${done && !claimed ? '' : ' disabled'}>${claimed ? 'CLAIMED THIS WEEK' : done ? 'CLAIM' : 'NOT YET'}</button>
<small>crew points come from every match you play · the trophy shelf holds a trophy for every zombies story the crew has finished</small></div></div>`;
}
function chWire() { const cv = $('chCv'), T = chTotals(); if (cv && T) chDraw(cv, T); const b = $('chClaim'); if (b) b.onclick = () => { if (chClaim()) renderLeaderboard(); }; }
(() => { const s = document.createElement('style'); s.textContent = `.ch-wrap{display:flex;gap:14px;align-items:stretch;margin:4px 0 12px;padding:10px;border:1px solid var(--line);background:rgba(10,12,13,.7)}#chCv{width:560px;max-width:55%;height:auto;border:1px solid var(--line)}
.ch-info{flex:1;display:flex;flex-direction:column;gap:5px}.ch-info b{letter-spacing:.2em;color:#fff;font-size:13px}.ch-info span{font-size:11px;color:#ddd;letter-spacing:.08em}.ch-info small{font-size:10px;color:var(--dim)}.ch-info .gr-bar{width:100%;height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden}.ch-info .gr-bar s{display:block;height:100%}.ch-info .mini{align-self:flex-start;width:auto;padding:0 12px;height:26px}.ch-info .mini[disabled]{opacity:.4}`; document.head.appendChild(s); })();
