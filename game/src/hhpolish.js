/* ================================================================== HOTBOX HORDE polish (1.2.108, the owner's list 58-60)
   58 LEADERBOARD: a HORDE tab on the leaderboard (you + friends): cash earned (s.earn, counted in a hhSave wrapper whenever
      cash goes up), hardest difficulty won, missions cleared, wins, burnouts down. Travels on the friend card as hz.
   59 SOUNDS: build clunks per material, trap snaps, a wave horn, a cash register, a plant alarm, a level-up jingle.
   60 FIRST STEPS: a card the first time you open HOTBOX HORDE and a checklist in THE HOMESTEAD (plant, harvest, sell,
      build, craft a trap, play a mission) worth $500 when it is done (s.tut = done steps, s.tutDone). */
const hhzCard = () => { try { const s = hhLoad(); return [s.earn | 0, hhzBestD(s), hhzCleared(s), s.wins | 0, s.kills | 0, s.likes | 0, s.hpres | 0]; } catch (e) { return [0, -1, 0, 0, 0, 0, 0]; } };
const hhzBestD = s => { let d = -1; for (const k in s.best || {}) { const b = s.best[k]; if (b && b.won) d = Math.max(d, b.d | 0); } return d; };
const hhzCleared = s => Object.values(s.best || {}).filter(b => b && b.won).length;
const _hhzCard = socMyCard;
socMyCard = function () { const c = _hhzCard.apply(this, arguments); c.hz = hhzCard(); return c; };
LB_COLS.horde = ['HORDE', (s, z, r, h) => h ? h[0] : 0];
const _hhzLB = renderLeaderboard;
renderLeaderboard = function () {
  if (SOC.lbSort !== 'horde') return _hhzLB.apply(this, arguments);
  const me = socMyCard(), rows = [{ n: me.n + ' (YOU)', h: me.hz, me: true, on: true }, ...FRIENDS.filter(f => Array.isArray(f.hz)).map(f => ({ n: f.n, h: f.hz, on: f.on }))];
  rows.sort((a, b) => (b.h[0] - a.h[0]) || (b.h[1] - a.h[1]));
  const dn = d => d >= 0 && HH_DIFF[d] ? HH_DIFF[d].n : '—';
  $('lbTabs').innerHTML = Object.entries(LB_COLS).map(([k, [l]]) => `<button class="tab${k === SOC.lbSort ? ' on' : ''}" data-lb="${k}">${l}</button>`).join('');
  $('lbBody').innerHTML = `<table class="st-table"><tr><th>#</th><th>PLAYER</th><th>CASH EARNED</th><th>HARDEST WIN</th><th>MISSIONS CLEARED</th><th>WINS</th><th>BURNOUTS DOWN</th><th>BASE LIKES</th></tr>` + rows.map((r, i) => `<tr class="${r.me ? 'me' : ''}"><td>${i + 1}</td><td><span class="dot ${r.on ? 'on' : ''}"></span> ${r.n}${r.h[6] ? ' <span style="color:#ffd24a">' + '★'.repeat(Math.min(5, r.h[6] | 0)) + '</span>' : ''}</td><td>$${(+r.h[0] || 0).toLocaleString()}</td><td>${dn(r.h[1] | 0)}</td><td>${r.h[2] | 0} / ${HH_MISSIONS.length}</td><td>${r.h[3] | 0}</td><td>${(+r.h[4] || 0).toLocaleString()}</td><td>${r.h[5] | 0}</td></tr>`).join('') + `</table><div class="net-hint" style="padding:10px 2px">HOTBOX HORDE: you and your friends, by cash earned. Friends' numbers update while they are online.</div>`;
  for (const b of $('lbTabs').children) b.onclick = () => { SOC.lbSort = b.dataset.lb; sfx.ui(); renderLeaderboard(); };
};
/* ---------- money in, the register rings; first-steps progress */
const _hhzSave = hhSave;
hhSave = function (s) {
  if (s && typeof s === 'object') {
    if (typeof s.cashSeen !== 'number') s.cashSeen = s.cash | 0;
    const d = (s.cash | 0) - s.cashSeen; if (d > 0) { s.earn = (s.earn | 0) + d; if (M && M.hh && M.hh.s === s && performance.now() - (HHZ.regT || 0) > 400) { HHZ.regT = performance.now(); hhzRegister(d); } } s.cashSeen = s.cash | 0;
    hhzTutCheck(s);
  }
  return _hhzSave.apply(this, arguments);
};
const HHZ = { regT: 0, plantHp: 0, alarmT: 0, lv: 0 };
function hhzRegister(d) { try { burst(0.05, 5000, 0.08, 'highpass'); tone(1320, 0.07, 0.06, 'square'); setTimeout(() => { tone(1760, 0.18, 0.06, 'triangle'); burst(0.25, 9000, 0.03, 'highpass'); }, 70); if (d >= 1000) setTimeout(() => tone(2093, 0.25, 0.05, 'sine'), 200); } catch (e) {} }
function hhzJingle() { try { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 0.07, 'triangle'), i * 110)); } catch (e) {} }
/* ---------- build clunks by material; the barricade slams */
const _hhzPM = hhPieceMake;
hhPieceMake = function (rec, quiet) {
  const p = _hhzPM.apply(this, arguments);
  if (!quiet && p && M && M.hh && !M.hh.loading) try { const o = at(p.cx, p.cz, 30), m = rec.mat;
    if (HH_TRAPS[rec.id] && rec.id !== 'barricade') { tone(880, 0.05, 0.04, 'square', 440, o); burst(0.04, 3000, 0.05, 'highpass', o); }
    else if (m === 'metal') { tone(620, 0.25, 0.05, 'square', 590, o); tone(930, 0.18, 0.03, 'sine', null, o); burst(0.05, 2400, 0.08, 'bandpass', o); }
    else if (m === 'stone') { burst(0.16, 420, 0.18, 'lowpass', o); tone(90, 0.14, 0.1, 'sine', 60, o); }
    else { burst(0.1, 900, 0.14, 'lowpass', o); tone(180, 0.08, 0.07, 'triangle', 120, o); setTimeout(() => burst(0.04, 1400, 0.05, 'lowpass', o), 90); }
  } catch (e) {}
  return p;
};
/* ---------- trap snaps (once a trap's uses go down) */
const _hhzTD = hhTrapDmg;
hhTrapDmg = function (e, dmg, p) {
  if (p && performance.now() - (p.sndT || 0) > 250) { p.sndT = performance.now(); try { const o = at(p.cx, p.cz, 22);
    if (p.id === 'spikes') { burst(0.05, 3200, 0.08, 'highpass', o); tone(260, 0.05, 0.05, 'square', 120, o); }
    else if (p.id === 'zapper' || p.id === 'ceilzap') { burst(0.14, 6000, 0.06, 'highpass', o); tone(120, 0.18, 0.05, 'sawtooth', 240, o); }
    else if (p.id === 'turret') tone(1400, 0.03, 0.03, 'square', 900, o);
    else if (p.id === 'gas') burst(0.3, 1200, 0.04, 'bandpass', o);
    else burst(0.08, 700, 0.07, 'lowpass', o); } catch (er) {} }
  return _hhzTD.apply(this, arguments);
};
/* ---------- a proper wave horn, a plant alarm, the level-up jingle */
const _hhzSW = hhStartWave;
hhStartWave = function () { const r = _hhzSW.apply(this, arguments); if (M && M.hh && M.hh.phase === 'wave') try { tone(110, 1.8, 0.1, 'sawtooth', 98); tone(165, 1.8, 0.06, 'sawtooth', 147); setTimeout(() => tone(82, 1.2, 0.1, 'sawtooth', 78), 900); } catch (e) {} return r; };
const _hhzTick = hhTick;
hhTick = function (dt) {
  const r = _hhzTick.apply(this, arguments), H = M && M.hh; if (!H || M.over) return r;
  if (H.plant) { const hp = H.plant.hp; if (HHZ.plantKey !== H && (HHZ.plantKey = H)) HHZ.plantHp = hp; if (hp < HHZ.plantHp - 0.5 && performance.now() - HHZ.alarmT > 3500) { HHZ.alarmT = performance.now(); try { tone(740, 0.16, 0.06, 'square'); setTimeout(() => tone(554, 0.22, 0.06, 'square'), 180); if (hp < H.plant.max * 0.35) setTimeout(() => tone(740, 0.16, 0.06, 'square'), 420); } catch (e) {} } HHZ.plantHp = hp; }
  if (H.base) { const lv = H.s.base.lv | 0; if (HHZ.lvKey !== H) { HHZ.lvKey = H; HHZ.lv = lv; } if (lv > HHZ.lv) hhzJingle(); HHZ.lv = lv; }
  return r;
};
/* ---------- 60 FIRST STEPS */
const HHZ_TUT = [
  { id: 'plant', n: 'PLANT A SEED', d: `in BUILD (H) open the GROW list (Q), place a plot, then USE it` , ok: s => Object.keys((s.base && s.base.plots) || {}).length > 0 || (s.grown | 0) > 0 },
  { id: 'harvest', n: 'HARVEST IT', d: 'water it, wait for it to grow, then USE it again', ok: s => (s.grown | 0) > 0 },
  { id: 'sell', n: 'SELL YOUR BUDS', d: 'walk to THE BUYER cart and press USE', ok: s => (s.sold | 0) > 0 },
  { id: 'build', n: 'BUILD A WALL', d: 'BUILD (H), pick WALL, click to place', ok: s => (s.built | 0) > 0 },
  { id: 'craft', n: 'CRAFT A TRAP', d: 'USE the WORKBENCH, craft SPIKES', ok: s => !!s.tutCraft },
  { id: 'mission', n: 'PLAY A MISSION', d: 'leave the base (ESC) and play any mission from the lobby', ok: s => (s.games | 0) > 0 }
];
function hhzTutCheck(s) {
  if (s.tutDone) return; s.tut = s.tut || {}; let n = 0;
  for (const t of HHZ_TUT) { if (!s.tut[t.id] && t.ok(s)) { s.tut[t.id] = 1; try { if (M && M.hh && M.hh.s === s) { showMsg(`FIRST STEPS · ${t.n} ✓`); tone(988, 0.1, 0.05, 'triangle', 1320); } } catch (e) {} } if (s.tut[t.id]) n++; }
  if (n >= HHZ_TUT.length) { s.tutDone = 1; s.cash = (s.cash | 0) + 500; try { showBanner('FIRST STEPS DONE · +$500', 'you know the loop now: grow, sell, build, defend'); hhzJingle(); } catch (e) {} }
}
function hhzTutHud(s) {
  let el = $('hhTut'); const show = !s.tutDone && G.state === 'playing' && !HH.menu;
  if (!show) { if (el) el.style.display = 'none'; return; }
  if (!el) { el = document.createElement('div'); el.id = 'hhTut'; document.body.appendChild(el); }
  const k = JSON.stringify(s.tut || {}); el.style.display = '';
  if (el.dataset.k === k) return; el.dataset.k = k;
  const next = HHZ_TUT.find(t => !(s.tut || {})[t.id]);
  el.innerHTML = `<b>FIRST STEPS · $500</b>` + HHZ_TUT.map(t => `<div class="${(s.tut || {})[t.id] ? 'ok' : t === next ? 'nx' : ''}"><i>${(s.tut || {})[t.id] ? '✓' : '·'}</i>${t.n}${t === next ? `<small>${t.d}</small>` : ''}</div>`).join('');
}
setInterval(() => { try { const H = M && M.mode === 'hh' && M.hh; if (H && H.base && !H.client) hhzTutHud(H.s); else { const el = $('hhTut'); if (el) el.style.display = 'none'; } } catch (e) {} }, 300);
const _hhzMD = hhMenuDo;
hhMenuDo = function (a, v) {
  const s = M && M.hh && M.hh.s, n0 = s ? Object.values(s.traps || {}).reduce((x, y) => x + (y | 0), 0) : 0, r = _hhzMD.apply(this, arguments);
  if (s && Object.values(s.traps || {}).reduce((x, y) => x + (y | 0), 0) > n0 && !s.tutCraft) { s.tutCraft = 1; hhSave(s); }
  return r;
};
// the first time the lobby opens: what the mode is about
const _hhzOpen = hhOpen;
hhOpen = function () {
  const r = _hhzOpen.apply(this, arguments), s = hhLoad();
  if (!s.tutSeen) { s.tutSeen = 1; hhSave(s); try { onbCard(`<small style="letter-spacing:.3em;color:#c8a0ff">NEW HERE</small><h2 style="margin:0">HOTBOX HORDE</h2>
<div class="hhz-steps"><div><b>1 · GROW</b><span>plant seeds on plots at THE HOMESTEAD, water and feed them</span></div><div><b>2 · SELL</b><span>THE BUYER pays cash for your buds</span></div><div><b>3 · BUILD</b><span>walls, floors, traps and gear: make the base yours</span></div><div><b>4 · DEFEND</b><span>missions bring materials; RAIDS on the base level it up</span></div></div>
<div class="onb-acts"><button class="btn primary" data-onb="base">GO TO THE HOMESTEAD</button><button class="btn" data-onb="x">LATER</button></div><small style="color:var(--dim)">A checklist in the base walks you through it · $500 when you finish it.</small>`, { base: () => { try { startMatch('hh', { map: 'homestead', hhKind: 'base' }); } catch (e) {} } }, false); } catch (e) {} }
  return r;
};
(() => { const s = document.createElement('style'); s.textContent = `#hhTut{position:fixed;left:14px;top:120px;z-index:30;width:230px;padding:9px 11px;background:rgba(10,12,10,.72);border-left:3px solid #c8a0ff;font-size:11px;letter-spacing:.08em;pointer-events:none}#hhTut>b{display:block;font-size:10px;letter-spacing:.28em;color:#c8a0ff;margin-bottom:4px}#hhTut div{color:var(--dim);padding:2px 0}#hhTut div.ok{color:#6fd16b;text-decoration:line-through}#hhTut div.nx{color:#fff}#hhTut i{display:inline-block;width:14px;font-style:normal}#hhTut small{display:block;margin-left:14px;color:#c8b8a0;font-size:10px;letter-spacing:.04em}
.hhz-steps{display:grid;grid-template-columns:1fr 1fr;gap:8px}.hhz-steps div{padding:8px 10px;border:1px solid var(--line);background:rgba(0,0,0,.25)}.hhz-steps b{display:block;letter-spacing:.2em;color:#9fe07a}.hhz-steps span{font-size:12px;color:var(--dim)}`; document.head.appendChild(s); })();
