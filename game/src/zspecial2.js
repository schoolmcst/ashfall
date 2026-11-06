/* ================================================================== ZOMBIES: NEW TYPES, TRIALS, CUSTOM GAMES (1.2.88)
   NEW ZOMBIES
     SCREAMERS (from round 8): pale and thin; when one sees you it shrieks and every zombie near it runs faster for a
       few seconds. Kill it first.
     SPITTERS (from round 10): hang back and spit Nightshade. The glob lands where you were standing a moment ago:
       keep moving.
     BRUTES (from round 12): huge, five times the health, and they charge when they get close.
   TRIALS: from round 3, every round has a TRIAL on the HUD (headshots, melee kills, kills without getting hit, a
     kill streak, grenade kills...). Finish it before the round ends for points; every third one drops a power-up.
   CUSTOM GAME (solo): on the zombies lobby. Starting round, starting points, zombie health, zombie speed, specials,
     stray rounds and power-ups. A custom game doesn't count for your best round. */
const ZS2 = { trial: null, done: 0 };
let ZCUS = { on: false, start: 1, pts: 500, hp: 1, speed: 'normal', specials: true, strays: true, pups: true };
try { const o = JSON.parse(localStorage.getItem('ashfall.zcus') || 'null'); if (o) ZCUS = Object.assign(ZCUS, o); } catch (e) {}
const zcusSave = () => { try { localStorage.setItem('ashfall.zcus', JSON.stringify(ZCUS)); } catch (e) {} };
const zcusOn = () => ZCUS.on && !(typeof ZC !== 'undefined' && ZC.on) && M && M.mode === 'zomb';
// ---------- the new zombies
function zs2Tint(e, col, k, em) {
  const tint = new Map(); e.group.traverse(o => { if (o.isMesh && !o.userData.hitbox) { const m = o.material; if (!tint.has(m)) { const c = (Array.isArray(m) ? m[0] : m).clone(); if (c.color) c.color.lerp(new THREE.Color(col), k); if (c.emissive && em) { c.emissive.setHex(em); c.emissiveIntensity = 0.6; } tint.set(m, c); } o.material = tint.get(m); } });
}
function zs2Make(e, kind) {
  e.zk = kind;
  if (kind === 'scream') { e.hp = e.maxHp = Math.round(e.maxHp * 0.6); e.group.scale.set(0.92, 1.08, 0.92); zs2Tint(e, 0xe8e4f0, 0.6, 0x302040); e.kind = 'jog'; }
  if (kind === 'spit') { e.hp = e.maxHp = Math.round(e.maxHp * 0.9); zs2Tint(e, 0x6aff4a, 0.45, 0x1a4a08); e.spitT = rnd(2, 4); }
  if (kind === 'brute') { e.hp = e.maxHp = Math.round(e.maxHp * 5); e.group.scale.set(1.7, 1.45, 1.7); e.group.userData.scale = 1.45; zs2Tint(e, 0x6a1010, 0.5, 0x300404); e.kind = 'walk'; e.speed = Math.min(e.speed || 1.5, 1.4); e.baseSpeed = e.speed; }
}
(() => { const old = zspRoll; zspRoll = function (e) {
  if (zcusOn() && !ZCUS.specials) return; old(e); if (e.crawl || e.bloat) return; const r = Z.round, x = Math.random();
  if (r >= 12 && x < Math.min(0.08, 0.03 + (r - 12) * 0.005)) zs2Make(e, 'brute');
  else if (r >= 10 && x > 0.9 && x < 0.97) zs2Make(e, 'spit');
  else if (r >= 8 && x > 0.97) zs2Make(e, 'scream'); }; })();
function zs2Tick(dt) {
  if (!M || M.mode !== 'zomb') return;
  for (const e of enemies) { if (!e.zk || !e.group) continue; const p = e.group.position, d = Math.hypot(p.x - P.x, p.z - P.z);
    if (e.zk === 'scream' && !e.screamed && d < 16) { e.screamed = true; try { sfx.zscreech(at(p.x, p.z, 40, p.y)); showMsg('A SCREAMER SAW YOU'); for (let i = 0; i < 5; i++) puff(p.x, p.y + 1.6, p.z, { color: 0xe8e4f0, size: 0.3 + i * 0.2, grow: 2, life: 0.6, vy: 0.2, op: 0.4 }); } catch (er) {}
      for (const o of enemies) if (o.zombie && o !== e && Math.hypot(o.group.position.x - p.x, o.group.position.z - p.z) < 14) { o.rageT = NOW + 6; if (!o.rage) { o.rage = o.speed; o.speed *= 1.45; } } }
    if (e.zk === 'spit' && d < 15 && d > 3) { e.spitT -= dt; if (e.spitT <= 0) { e.spitT = rnd(3.5, 5); const tx = P.x, tz = P.z, ty = P.y; try { puff(p.x, p.y + 1.5, p.z, { color: 0x6aff4a, size: 0.4, grow: 0.8, life: 0.5, vy: 0.4, op: 0.7 }); } catch (er) {}
      setTimeout(() => { try { if (!M || M.mode !== 'zomb') return; for (let i = 0; i < 6; i++) puff(tx + rnd(-0.6, 0.6), ty + 0.2, tz + rnd(-0.6, 0.6), { color: 0x6aff4a, size: 0.6, grow: 1.4, life: 1.4, vy: 0.2, op: 0.55 }); if (Math.hypot(P.x - tx, P.z - tz) < 1.6 && playerAlive()) hurtPlayer(18, tx - P.x, tz - P.z); } catch (er) {} }, 700); } }
    if (e.zk === 'brute') { if (d < 7 && !e.charging && NOW > (e.chargeCd || 0)) { e.charging = NOW + 1.4; e.chargeCd = NOW + 6; e.speed = 5.2; try { sfx.zscreech(at(p.x, p.z, 30, p.y)); } catch (er) {} } if (e.charging && NOW > e.charging) { e.charging = 0; e.speed = e.baseSpeed || 1.4; } }
  }
  for (const o of enemies) if (o.rage && NOW > o.rageT) { o.speed = o.rage; o.rage = 0; }
  zs2TrialTick(dt);
}
(() => { const old = zwinTick; zwinTick = function (dt) { old(dt); try { zs2Tick(dt); } catch (e) {} }; })();
// ---------- TRIALS
const ZS2_TRIALS = [
  { id: 'head', t: 'HEADSHOT KILLS', n: r => 6 + (r >> 1), pts: 600 }, { id: 'melee', t: 'MELEE KILLS', n: r => 3 + (r >> 2), pts: 800 },
  { id: 'clean', t: 'KILLS WITHOUT GETTING HIT', n: r => 8 + (r >> 1), pts: 900 }, { id: 'boom', t: 'GRENADE OR BLAST KILLS', n: r => 3 + (r >> 2), pts: 700 },
  { id: 'streak', t: 'KILLS IN 10 SECONDS', n: r => Math.min(8, 4 + (r >> 3)), pts: 750 }, { id: 'any', t: 'KILLS', n: r => 12 + r, pts: 500 },
];
function zs2TrialStart(r) {
  ZS2.trial = null; if (r < 3) return; const T = ZS2_TRIALS[(r * 7 + ((Math.random() * 3) | 0)) % ZS2_TRIALS.length];
  ZS2.trial = { T, need: T.n(r), have: 0, done: false, times: [] }; zs2Hud();
}
function zs2TrialKill(head, boom, melee) {
  const t = ZS2.trial; if (!t || t.done) return; const id = t.T.id;
  if (id === 'any' || (id === 'head' && head) || (id === 'melee' && melee) || (id === 'boom' && boom)) t.have++;
  if (id === 'clean') t.have++;
  if (id === 'streak') { t.times.push(NOW); t.times = t.times.filter(x => NOW - x < 10); t.have = Math.max(t.have, t.times.length); }
  if (t.have >= t.need) { t.done = true; ZS2.done++; G.points += t.T.pts; G.score += t.T.pts;
    try { showBanner('TRIAL COMPLETE', `${t.T.t} · +${t.T.pts} POINTS${ZS2.done % 3 === 0 ? ' · a power-up dropped' : ''}`); sfx.streak(); popScore('+' + t.T.pts, 'big', 'TRIAL'); } catch (e) {}
    if (ZS2.done % 3 === 0) try { zpuMaybeDrop(P.x + 1.5, P.z, P.y, true); } catch (e) {} }
  zs2Hud();
}
function zs2TrialTick() { const t = ZS2.trial; if (!t || t.done || t.T.id !== 'clean') return; if (G.health < (ZS2.lastHp || G.health) - 0.5) { t.have = 0; zs2Hud(); } ZS2.lastHp = G.health; }
function zs2Hud() {
  let h = $('zTrial'); const t = ZS2.trial; if (!t || !M || M.mode !== 'zomb') { if (h) h.remove(); return; }
  if (!h) { h = document.createElement('div'); h.id = 'zTrial'; document.body.appendChild(h); }
  h.className = t.done ? 'done' : ''; h.innerHTML = `<small>TRIAL · ROUND ${Z.round}</small><b>${t.T.t}</b><span>${Math.min(t.have, t.need)} / ${t.need}${t.done ? ' · DONE' : ` · +${t.T.pts}`}</span>`;
}
(() => { const old = zombKill; zombKill = function (e, head, boom, melee) { const r = old.apply(this, arguments); try { zs2TrialKill(head, boom, melee); } catch (er) {} return r; }; })();
(() => { const old = zspRoundStart; zspRoundStart = function (r) { old(r); if (zcusOn() && !ZCUS.strays && Z.dogRound) { Z.dogRound = false; Z.toSpawn = Math.min(80, 6 + (r - 1) * 3); try { zspFog(false); } catch (e) {} }
  try { zs2TrialStart(r); ZS2.lastHp = G.health; } catch (e) {} }; })();
(() => { const old = zombClear; zombClear = function () { const r = old.apply(this, arguments); ZS2.trial = null; ZS2.done = 0; try { zs2Hud(); } catch (e) {} return r; }; })();
// ---------- CUSTOM GAME
(() => { const old = zombHp; zombHp = function (r) { return old(r) * (zcusOn() ? +ZCUS.hp || 1 : 1); }; })();
(() => { const old = zombSpeedType; zombSpeedType = function (r) { if (zcusOn()) { if (ZCUS.speed === 'run') return 'run'; if (ZCUS.speed === 'walk') return 'walk'; } return old(r); }; })();
(() => { const old = zpuMaybeDrop; zpuMaybeDrop = function () { if (zcusOn() && !ZCUS.pups) return; return old.apply(this, arguments); }; })();
(() => { const old = zombStart; zombStart = function (cfg) { const r = old.apply(this, arguments);
  if (zcusOn()) { G.points = +ZCUS.pts || 500; if (ZCUS.start > 1) Z.round = ZCUS.start - 1; Z.custom = true; try { showBanner('ZOMBIES · CUSTOM GAME', `round ${ZCUS.start} · ${G.points.toLocaleString()} points · it won't count for your best`); } catch (e) {} } else Z.custom = false;
  return r; }; })();
const ZCUS_ROWS = [['start', 'STARTING ROUND', [[1, '1'], [5, '5'], [10, '10'], [15, '15'], [20, '20'], [30, '30']]], ['pts', 'STARTING POINTS', [[500, '500'], [2500, '2,500'], [10000, '10,000'], [50000, '50,000']]],
  ['hp', 'ZOMBIE HEALTH', [[0.5, 'HALF'], [1, 'NORMAL'], [2, 'DOUBLE']]], ['speed', 'ZOMBIE SPEED', [['walk', 'WALKERS'], ['normal', 'NORMAL'], ['run', 'RUNNERS']]],
  ['specials', 'SPECIAL ZOMBIES', [[true, 'ON'], [false, 'OFF']]], ['strays', 'STRAY ROUNDS', [[true, 'ON'], [false, 'OFF']]], ['pups', 'POWER-UPS', [[true, 'ON'], [false, 'OFF']]]];
function zcusOpen() {
  let o = $('zcusOv'); if (o) o.remove(); o = document.createElement('div'); o.id = 'zcusOv';
  const draw = () => { o.innerHTML = `<div class="zcus-p"><h3>ZOMBIES · CUSTOM GAME</h3><div class="zcus-on"><button class="p2-s${ZCUS.on ? ' on' : ''}" data-zc="on:1"><b>CUSTOM RULES ON</b></button><button class="p2-s${ZCUS.on ? '' : ' on'}" data-zc="on:0"><b>OFF · NORMAL GAME</b></button></div>
    ${ZCUS_ROWS.map(([k, n, opts]) => `<div class="zcus-r${ZCUS.on ? '' : ' off'}"><small>${n}</small><div>${opts.map(([v, l], i) => `<button class="p2-s${ZCUS[k] === v ? ' on' : ''}" data-zc="${k}:${i}"><b>${l}</b></button>`).join('')}</div></div>`).join('')}
    <p>Solo only · a custom game doesn't count for your best round or the leaderboard.</p><button class="btn primary" data-zc="x">DONE</button></div>`;
    for (const b of o.querySelectorAll('[data-zc]')) b.onclick = () => { try { sfx.ui(); } catch (e) {} const [k, i] = b.dataset.zc.split(':'); if (k === 'x') { o.remove(); try { renderZLobby(); } catch (e) {} return; }
      if (k === 'on') ZCUS.on = i === '1'; else ZCUS[k] = ZCUS_ROWS.find(r => r[0] === k)[2][+i][0]; zcusSave(); draw(); }; };
  document.body.appendChild(o); draw();
}
(() => { const old = renderZLobby; renderZLobby = function () { const r = old.apply(this, arguments); try { const sel = $('lobSel'); if (sel && !sel.querySelector('[data-act="z-custom"]')) { const d = document.createElement('div'); d.className = 'cod-row';
  d.innerHTML = `<small>CUSTOM GAME · SOLO</small><b style="color:${ZCUS.on ? '#5dff7a' : ''}">${ZCUS.on ? `ROUND ${ZCUS.start} · ${(+ZCUS.pts).toLocaleString()} PTS · ${ZCUS.speed.toUpperCase()}` : 'OFF · NORMAL RULES'}</b><span>starting round, points, zombie health and speed, specials, power-ups</span><div class="arw"><button class="mini" data-act="z-custom">EDIT</button></div>`;
  const play = sel.querySelector('.cod-play'); if (play && play.nextSibling) sel.insertBefore(d, play.nextSibling.nextSibling || null); else sel.appendChild(d);
  d.querySelector('[data-act="z-custom"]').onclick = ev => { ev.stopPropagation(); zcusOpen(); }; } } catch (e) {} return r; }; })();
(() => { const s = document.createElement('style'); s.textContent = `#zTrial{position:fixed;right:18px;top:200px;z-index:20;padding:6px 12px;background:rgba(10,6,14,.75);border:1px solid #c070ff;text-align:right;pointer-events:none}#zTrial small{display:block;font-size:9px;letter-spacing:.3em;color:#c070ff}#zTrial b{display:block;font-size:12px;letter-spacing:.14em;color:#fff}#zTrial span{font-size:11px;color:var(--dim)}#zTrial.done{border-color:#5dff7a}#zTrial.done small{color:#5dff7a}
#zcusOv{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;pointer-events:auto}.zcus-p{width:min(760px,94vw);padding:16px 20px;background:rgba(12,8,16,.97);border:1px solid #c070ff}.zcus-p h3{margin:0 0 12px;letter-spacing:.3em;font-size:14px;color:#c070ff}
.zcus-on{display:flex;gap:6px;margin-bottom:10px}.zcus-r{display:grid;grid-template-columns:170px 1fr;align-items:center;gap:8px;margin:6px 0}.zcus-r.off{opacity:.4;pointer-events:none}.zcus-r small{font-size:10px;letter-spacing:.2em;color:var(--dim)}.zcus-r>div{display:flex;flex-wrap:wrap;gap:4px}.zcus-p p{font-size:11px;color:var(--dim)}`; document.head.appendChild(s); })();
