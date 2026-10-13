/* ================================================================== career stats (saved in this browser) */
const STATS_KEY = 'ashfall.stats.v1';
const blankStats = () => ({ matches: 0, wins: 0, losses: 0, draws: 0, kills: 0, deaths: 0, heads: 0, shots: 0, hits: 0, time: 0, bestStreak: 0, longest: 0, score: 0, plants: 0, defuses: 0, caps: 0, returns: 0, hpTime: 0, bestWave: 0, modes: {}, weapons: {} });
let STATS = blankStats();
try { const o = JSON.parse(localStorage.getItem(STATS_KEY) || 'null'); if (o && typeof o === 'object') STATS = Object.assign(blankStats(), o); } catch (e) {}
function saveStats() { try { localStorage.setItem(STATS_KEY, JSON.stringify(STATS)); } catch (e) {} }
// this match
let MS = null;
function blankMatch() { return { kills: 0, deaths: 0, heads: 0, shots: 0, hits: 0, streak: 0, bestStreak: 0, longest: 0, time: 0, plants: 0, defuses: 0, caps: 0, returns: 0, hpTime: 0, weapons: {} }; }
MS = blankMatch();
function startMatchStats() { MS = blankMatch(); MS.active = true; }
const wstat = id => MS.weapons[id] || (MS.weapons[id] = { kills: 0, shots: 0, hits: 0, heads: 0 });
function statShot(hit) { if (!MS.active || G.bench) return; const w = WEAPONS[G.cur]; MS.shots++; if (hit) MS.hits++; if (w) { const s = wstat(w.def.id); s.shots++; if (hit) s.hits++; } }
function statKill(e, head) {
  if (!MS.active || G.bench) return;
  const w = WEAPONS[G.cur], d = Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z);
  MS.kills++; if (head) MS.heads++; MS.streak++; MS.bestStreak = Math.max(MS.bestStreak, MS.streak); MS.longest = Math.max(MS.longest, d);
  if (w) { const s = wstat(w.def.id); s.kills++; if (head) s.heads++; }
}
function statDeath() { if (!MS.active || G.bench) return; MS.deaths++; MS.streak = 0; }
// won: 1 win, 0 draw, -1 loss; null for Survival (no winner)
function finishMatchStats(won) {
  if (!MS.active || G.bench) return; MS.active = false;
  const st = STATS, mode = M.mode;
  st.matches++; if (won === 1) st.wins++; else if (won === -1) st.losses++; else if (won === 0) st.draws++;
  for (const k of ['kills', 'deaths', 'heads', 'shots', 'hits', 'time', 'plants', 'defuses', 'caps', 'returns', 'hpTime']) st[k] += MS[k];
  st.bestStreak = Math.max(st.bestStreak, MS.bestStreak); st.longest = Math.max(st.longest, MS.longest); st.score += M.me ? M.me.score : G.score;
  if (mode === 'surv') st.bestWave = Math.max(st.bestWave, G.wave);
  const ms = st.modes[mode] || (st.modes[mode] = { played: 0, wins: 0, kills: 0, deaths: 0, best: 0 });
  ms.played++; if (won === 1) ms.wins++; ms.kills += MS.kills; ms.deaths += MS.deaths; ms.best = Math.max(ms.best, mode === 'surv' ? G.wave : MS.kills);
  for (const id in MS.weapons) { const a = MS.weapons[id], b = st.weapons[id] || (st.weapons[id] = { kills: 0, shots: 0, hits: 0, heads: 0 }); for (const k in a) b[k] += a[k]; }
  saveStats();
}
function tickStats(dt) { if (MS.active && !G.bench && (G.state === 'playing' || G.state === 'respawning' || G.state === 'spectate' || G.state === 'deathcam')) MS.time += dt; }

/* ---------- stats screen */
let statTab = 'OVERVIEW';
const pctS = (a, b) => b ? Math.round(a / b * 100) + '%' : '—';
const kdS = (k, d) => (k / Math.max(1, d)).toFixed(2);
function fmtDur(s) { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h}H ${m}M` : `${m}M ${Math.floor(s % 60)}S`; }
function renderStats() {
  const st = STATS;
  $('stTabs').innerHTML = ['OVERVIEW', 'WEAPONS', 'MODES'].map(t => `<button class="tab${t === statTab ? ' on' : ''}" data-st="${t}">${t}</button>`).join('');
  let h = '';
  if (statTab === 'OVERVIEW') {
    const tiles = [['K/D RATIO', kdS(st.kills, st.deaths)], ['WIN RATE', pctS(st.wins, st.wins + st.losses + st.draws)], ['ACCURACY', pctS(st.hits, st.shots)], ['HEADSHOT RATE', pctS(st.heads, st.kills)]];
    h += `<div class="st-tiles">${tiles.map(([k, v]) => `<div class="st-tile"><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
    const rows = [['MATCHES', st.matches], ['WINS / LOSSES / DRAWS', `${st.wins} / ${st.losses} / ${st.draws}`], ['KILLS', st.kills], ['DEATHS', st.deaths], ['HEADSHOTS', st.heads], ['SHOTS FIRED', st.shots], ['SHOTS HIT', st.hits],
      ['BEST KILL STREAK', st.bestStreak], ['LONGEST KILL', Math.round(st.longest) + ' M'], ['TOTAL SCORE', st.score], ['SCORE PER MINUTE', st.time > 30 ? Math.round(st.score / (st.time / 60)) : '—'], ['TIME PLAYED', fmtDur(st.time)],
      ['BOMBS PLANTED', st.plants], ['BOMBS DEFUSED', st.defuses], ['FLAGS CAPTURED', st.caps], ['FLAGS RETURNED', st.returns], ['HARDPOINT TIME', fmtDur(st.hpTime)], ['BEST SURVIVAL WAVE', Math.max(st.bestWave, best.wave)]];
    h += `<div class="st-grid">${rows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
  } else if (statTab === 'WEAPONS') {
    const list = ARMORY.map(d => ({ d, s: st.weapons[d.id] || { kills: 0, shots: 0, hits: 0, heads: 0 } })).sort((a, b) => b.s.kills - a.s.kills || b.s.shots - a.s.shots);
    const used = list.filter(x => x.s.shots > 0);
    h += used.length ? `<table class="st-table"><tr><th>WEAPON</th><th>TYPE</th><th>KILLS</th><th>HEADSHOTS</th><th>ACCURACY</th><th>SHOTS</th></tr>${used.map(({ d, s }) => `<tr><td>${d.name}</td><td>${CATS[d.cat].short}</td><td>${s.kills}</td><td>${s.heads}</td><td>${pctS(s.hits, s.shots)}</td><td>${s.shots}</td></tr>`).join('')}</table>` : '<div class="st-empty">Play a match and your weapon stats show up here.</div>';
  } else {
    h += `<table class="st-table"><tr><th>MODE</th><th>PLAYED</th><th>WINS</th><th>WIN RATE</th><th>KILLS</th><th>K/D</th><th>BEST</th></tr>${MODE_ORDER.map(k => { const m = st.modes[k] || { played: 0, wins: 0, kills: 0, deaths: 0, best: 0 }; return `<tr><td>${MODES[k].name}</td><td>${m.played}</td><td>${k === 'surv' ? '—' : m.wins}</td><td>${k === 'surv' ? '—' : pctS(m.wins, m.played)}</td><td>${m.kills}</td><td>${kdS(m.kills, m.deaths)}</td><td>${m.best}${k === 'surv' ? ' WAVES' : ' KILLS'}</td></tr>`; }).join('')}</table>`;
  }
  $('stBody').innerHTML = h;
  for (const b of $('stTabs').children) b.onclick = () => { statTab = b.dataset.st; sfx.ui(); renderStats(); };
}
function statsTab(d) { const t = ['OVERVIEW', 'WEAPONS', 'MODES']; statTab = t[(t.indexOf(statTab) + d + 3) % 3]; sfx.ui(); renderStats(); }
