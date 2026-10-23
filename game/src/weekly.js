/* ================================================================== PRESTIGE, THE PLUG'S LIST (weekly challenges), THE STASH YARD (firing range)
   PRESTIGE: at level 100 you can go back to level 1 (keeping everything you own) for a prestige emblem, a calling card,
   2,000 DZ and a free PRESTIGE box; prestiges 3, 6 and 10 add a finish. Ten prestiges.
   THE PLUG'S LIST: six jobs a week (Monday to Sunday, picked the same for everyone from the week's date), each paying
   XP and DZ; all six pay a free PRESTIGE box. Counted when a match ends.
   THE STASH YARD: a firing range and tutorial in the STACKYARD: targets that stand (and some that strafe), a list of basics
   to tick off, live accuracy. Nothing there counts for XP, stats or camo challenges. Saved in PROG (pres, wk, range). */
const PRES_MAX = 10;

/* ---------- prestige */
const PRES_EM = {};
function presEmblem(n) {
  if (PRES_EM[n]) return PRES_EM[n];
  const c = stickerPaint({ id: 'pr_em_' + n, g: { t: 'sticker', d: 'leaf', c: [PRES_COL[n - 1], '#0b0c0d'], txt: String(n) } }, 96).cc;
  return (PRES_EM[n] = c.toDataURL());
}
function presRewards(n) {
  const out = [`${PRES_NAMES[n - 1]} emblem`, `P${n} calling card`, '2,000 DZ', 'a free PRESTIGE chance box'];
  if (PRES_FIN[n]) out.push(`${COS[PRES_FIN[n]].name} ${COS[PRES_FIN[n]].kind}`);
  return out;
}
function presOpen() {
  const pr = PROG.pres | 0; if (lvlOf(PROG.xp) < MAXLVL || pr >= PRES_MAX) return;
  const n = pr + 1, ov = document.createElement('div'); ov.className = 'pr-ov'; ov.id = 'presOv';
  ov.innerHTML = `<div class="pr-box"><img src="${presEmblem(n)}" alt=""><small>PRESTIGE ${n} OF ${PRES_MAX}</small><b>${PRES_NAMES[n - 1]}</b>
<p>Your level goes back to 1. You keep every gun, camo, skin, sticker, charm, banner and all your DZ.</p>
<ul>${presRewards(n).map(t => `<li>${t}</li>`).join('')}</ul>
<div class="pr-acts"><button class="btn primary" data-act="pr-go">PRESTIGE NOW</button><button class="btn" data-act="pr-close">NOT YET</button></div></div>`;
  document.body.appendChild(ov); try { sfx.ui(); } catch (e) {} setTimeout(() => { const b = ov.querySelector('[data-act="pr-close"]'); if (b) b.focus(); }, 30);
}
function presClose() { const o = $('presOv'); if (o) o.remove(); }
function presGo() {
  const pr = PROG.pres | 0; if (lvlOf(PROG.xp) < MAXLVL || pr >= PRES_MAX) return presClose();
  const n = pr + 1; PROG.pres = n; PROG.xp = 0; PROG.dz += 2000; PROG.tok = PROG.tok || { std: 0, elite: 0, prestige: 0 }; PROG.tok.prestige = (PROG.tok.prestige | 0) + 1;
  PROG.owned['pr_bn_' + n] = 1; PROG.banner = 'pr_bn_' + n; if (PRES_FIN[n]) PROG.owned[PRES_FIN[n]] = 1;
  saveProg(); presClose();
  showBanner(`PRESTIGE ${n}`, PRES_NAMES[n - 1]); try { sfx.streak(); } catch (e) {}
  toast2(`PRESTIGE ${n} · ${PRES_NAMES[n - 1]} · CALLING CARD EQUIPPED`);
  presRefresh();
}
function presRefresh() {
  try { if (curScreen === 'locker') renderLocker(); else if (curScreen === 'rewards') renderRewards(); else if (curScreen === 'bpass') renderBattlePass(); else if (curScreen === 'weekly') renderWeekly(); renderMenuCard(); if (curScreen === 'lobby') renderLobby(); } catch (e) {}
}

/* ---------- THE PLUG'S LIST */
const WK_POOL = [
  { id: 'kills', name: "SMOKE 'EM OUT", d: 'Get {n} kills in multiplayer', n: [60, 120, 10], xp: 3000, dz: 250 },
  { id: 'heads', name: 'HEADY STUFF', d: 'Get {n} headshot kills', n: [15, 30, 5], xp: 3500, dz: 250 },
  { id: 'wins', name: 'BIG DEAL', d: 'Win {n} matches', n: [3, 6, 1], xp: 4000, dz: 300 },
  { id: 'played', name: 'PUFF PUFF PASS', d: 'Finish {n} multiplayer matches', n: [5, 10, 1], xp: 2500, dz: 200 },
  { id: 'online', name: 'SMOKE SESH', d: 'Finish {n} online matches', n: [3, 6, 1], xp: 4000, dz: 300 },
  { id: 'bags', name: 'BAG RUN', d: 'Bag {n} enemy stash bags in BAGGED UP', n: [10, 20, 5], xp: 3500, dz: 250 },
  { id: 'turf', name: 'TURF BOSS', d: 'Take {n} grow spots in TURF WAR', n: [6, 12, 2], xp: 3500, dz: 250 },
  { id: 'obj', name: 'PLUG IT IN', d: 'Plant or defuse a bomb, or capture a flag, {n} times', n: [3, 6, 1], xp: 3500, dz: 250 },
  { id: 'hpTime', name: 'HOLD THE CORNER', d: 'Hold the hardpoint for {n} seconds', n: [90, 180, 30], xp: 3000, dz: 250 },
  { id: 'streaks', name: 'HIGH TIMES', d: 'Call in {n} scorestreaks', n: [5, 10, 1], xp: 3000, dz: 250 },
  { id: 'zkills', name: 'UNDEAD HARVEST', d: 'Kill {n} zombies', n: [200, 400, 50], xp: 3500, dz: 250 },
  { id: 'zround', name: 'THE MUNCHIES', d: 'Reach round {n} in zombies', n: [12, 20, 2], xp: 4000, dz: 300, max: true },
  { id: 'longest', name: 'LONG HAUL', d: 'Get a kill from {n} m or further', n: [40, 60, 5], xp: 2500, dz: 200, max: true },
  { id: 'bestStreak', name: 'ON A ROLL', d: 'Get {n} kills in a row without dying', n: [6, 10, 1], xp: 3000, dz: 250, max: true },
];
const WKD = Object.fromEntries(WK_POOL.map(w => [w.id, w]));
// the Monday of this week (local time) names the week
function wkKey(d) { const x = new Date(d || Date.now()); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return dayKey(x); }
function wkEnds() { const x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7) + 7); return x.getTime(); }
function wkState() {
  const k = wkKey();
  if (!PROG.wk || PROG.wk.week !== k) {
    const R = makeRng(strHash('plug-' + k)), pool = WK_POOL.slice(), list = [];
    // never two zombie jobs, never both kill-count jobs
    while (list.length < 6 && pool.length) {
      const w = pool.splice((R() * pool.length) | 0, 1)[0];
      if ((w.id === 'zkills' && list.some(q => q.id === 'zround')) || (w.id === 'zround' && list.some(q => q.id === 'zkills'))) continue;
      const [a, b, st] = w.n, n = a + Math.round((R() * (b - a)) / st) * st;
      list.push({ id: w.id, n, have: 0, done: false });
    }
    PROG.wk = { week: k, list, bonus: false }; saveProg();
  }
  return PROG.wk;
}
// a match just ended (partial: you left early) - add what happened to this week's jobs
function wkMatch(won, partial) {
  if (!MS || G.bench || !M || M.mode === 'range') return;
  const W = wkState(), zomb = M.mode === 'zomb', mp = !zomb && M.mode !== 'surv', got = [];
  const v = {
    kills: mp ? MS.kills : 0, heads: mp ? MS.heads : 0, wins: mp && won === 1 && !partial ? 1 : 0, played: mp && !partial ? 1 : 0, online: mp && M.online && !partial ? 1 : 0,
    bags: MS.bags | 0, turf: MS.turf | 0, obj: (MS.plants | 0) + (MS.defuses | 0) + Math.max(0, (MS.caps | 0) - (MS.turf | 0)), hpTime: MS.hpTime | 0, streaks: MS.streaks | 0,
    zkills: zomb ? MS.kills : 0, zround: zomb ? (Z.round | 0) : 0, longest: mp ? Math.floor(MS.longest || 0) : 0, bestStreak: mp ? MS.bestStreak | 0 : 0,
  };
  for (const q of W.list) {
    if (q.done) continue; const d = WKD[q.id]; if (!d) continue;
    q.have = d.max ? Math.max(q.have, v[q.id] | 0) : q.have + (v[q.id] | 0);
    if (q.have >= q.n) { q.have = q.n; q.done = true; got.push(d); wkPay(d.xp, d.dz); }
  }
  if (!W.bonus && W.list.every(q => q.done)) { W.bonus = true; PROG.tok = PROG.tok || { std: 0, elite: 0, prestige: 0 }; PROG.tok.prestige = (PROG.tok.prestige | 0) + 1; got.push({ name: "THE PLUG'S BONUS", xp: 0, dz: 0, box: 1 }); }
  saveProg();
  got.forEach((d, i) => setTimeout(() => toast2(d.box ? "ALL SIX JOBS DONE · FREE PRESTIGE BOX IN REWARDS" : `WEEKLY JOB DONE · ${d.name} · +${d.xp.toLocaleString()} XP · +${d.dz} DZ`), 400 + i * 2600));
  WK.lastGot = got;
}
const WK = { lastGot: [] };
function wkPay(xp, dz) {
  const before = PROG.xp; PROG.xp = Math.min(XP_AT[MAXLVL], PROG.xp + xp); PROG.dz += dz;
  try { grantLevels(before, PROG.xp); } catch (e) {} try { if (typeof bpGain === 'function') bpGain(xp); } catch (e) {}
}
let wkReturn = 'menu';
function openWeekly() { if (curScreen !== 'weekly') wkReturn = curScreen || 'menu'; renderWeekly(); showScreen('weekly'); focusFirst('#wkBack'); }
function wkBack() { showScreen(wkReturn || 'menu'); if (wkReturn === 'lobby') try { renderLobby(); } catch (e) {} }
function renderWeekly() {
  const W = wkState(), left = Math.max(0, wkEnds() - Date.now()), dd = Math.floor(left / 864e5), hh = Math.floor(left / 36e5) % 24, done = W.list.filter(q => q.done).length;
  $('wkTop').innerHTML = progCardHtml();
  $('wkHead').innerHTML = `<div class="wk-h"><b>${done} / 6</b><small>JOBS DONE</small></div><div class="wk-plug"><b>THE PLUG'S LIST</b><p>Six jobs from your plug, new every Monday. Each pays XP and DZ when the match ends; do all six for a free PRESTIGE chance box.</p></div><div class="wk-t"><small>NEW LIST IN</small><b>${dd}D ${hh}H</b></div>`;
  $('wkList').innerHTML = W.list.map(q => { const d = WKD[q.id]; if (!d) return ''; const f = Math.min(1, q.have / q.n);
    return `<div class="wk-c${q.done ? ' done' : ''}"><div class="wk-ic">${wkIcon(q.id)}</div><div class="wk-m"><b>${d.name}</b><p>${d.d.replace('{n}', q.n)}</p><div class="pg-bar"><s style="width:${f * 100}%"></s></div><small>${q.done ? 'DONE' : `${q.have} / ${q.n}`}</small></div><div class="wk-r"><span>+${d.xp.toLocaleString()} XP</span><span>${dzIcon()}+${d.dz}</span></div></div>`; }).join('') +
    `<div class="wk-c bonus${W.bonus ? ' done' : ''}"><div class="wk-ic"><span class="bp-crate" style="--bc:#f2b84b"><span>P</span></span></div><div class="wk-m"><b>THE PLUG'S BONUS</b><p>Finish all six jobs this week</p><div class="pg-bar"><s style="width:${done / 6 * 100}%"></s></div><small>${W.bonus ? 'PAID · OPEN IT IN REWARDS' : done + ' / 6'}</small></div><div class="wk-r"><span>FREE PRESTIGE BOX</span></div></div>`;
}
function wkIcon(id) {
  const P = { kills: 'M4 12h12M16 9l4 3-4 3M7 9v6', heads: 'M12 4a6 6 0 1 1 0 12a6 6 0 1 1 0-12M12 1v4M12 15v4M1 10h4M19 10h4', wins: 'M7 4h10v5a5 5 0 0 1-10 0zM12 14v4M8 20h8M4 5h3M17 5h3', played: 'M5 4l14 8-14 8z',
    online: 'M3 12a9 9 0 0 1 18 0M7 12a5 5 0 0 1 10 0M12 12v8', bags: 'M6 6h12l1 14H5zM6 9h12', turf: 'M12 21V9M12 13c-4 0-6-3-6-6 4 0 6 3 6 6zM12 11c0-4 3-7 7-7 0 4-3 7-7 7z', obj: 'M6 21V3l12 5-12 5',
    hpTime: 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18M12 7v5l3 3', streaks: 'M13 2L5 14h6l-1 8 8-12h-6z', zkills: 'M8 9a1 1 0 1 1 0 .1M16 9a1 1 0 1 1 0 .1M6 4h12v9l-3 4H9l-3-4zM10 17v3M14 17v3', zround: 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18M8 12h8',
    longest: 'M2 12h20M5 9l-3 3 3 3M19 9l3 3-3 3', bestStreak: 'M4 18l5-6 4 3 7-9M15 6h5v5' };
  return `<svg viewBox="0 0 24 24" class="stk-ic"><path d="${P[id] || P.played}"/></svg>`;
}
(() => {
  const d = document.createElement('div'); d.id = 'weekly'; d.className = 'screen cod pg-scr hide';
  d.innerHTML = `<div class="cod-top"><div class="cod-title"><small>WEEKLY CHALLENGES</small><b>THE PLUG'S LIST</b></div><div style="flex:1"></div><div class="cod-card" id="wkTop"></div></div>
<div class="wk-body"><div class="wk-head" id="wkHead"></div><div class="wk-list" id="wkList"></div></div>
<div class="cod-foot"><button class="btn" id="wkBack" data-act="wk-back">&lsaquo; BACK</button><span class="padhint">B BACK</span></div>`;
  document.body.appendChild(d);
  const s = document.createElement('style');
  s.textContent = `.wk-body{flex:1;display:flex;flex-direction:column;gap:14px;padding:14px 3vw;min-height:0;overflow:auto;pointer-events:auto}
.wk-head{display:flex;align-items:center;gap:22px;padding:14px 18px;border:1px solid var(--line);background:linear-gradient(90deg,rgba(80,200,90,.16),rgba(10,12,13,.8) 50%)}
.wk-h,.wk-t{text-align:center;min-width:90px}.wk-h b{display:block;font-size:40px;line-height:1;color:#fff}.wk-h small,.wk-t small{display:block;font-size:10px;letter-spacing:.24em;color:#8fdc7a}.wk-t b{font-size:22px;color:#fff}
.wk-plug{flex:1}.wk-plug b{letter-spacing:.24em;color:#fff;font-size:15px}.wk-plug p{margin:4px 0 0;font-size:12px;color:var(--dim);line-height:1.45}
.wk-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:10px}
.wk-c{display:flex;gap:14px;align-items:center;padding:14px;border:1px solid var(--line);background:rgba(10,12,13,.8)}
.wk-c.done{border-color:rgba(126,240,160,.5);background:linear-gradient(90deg,rgba(60,180,90,.16),rgba(10,12,13,.85))}.wk-c.bonus{border-color:rgba(242,184,75,.45)}
.wk-ic{width:52px;height:52px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);background:#15181b}.wk-ic .stk-ic{width:32px;height:32px;color:#8fdc7a}
.wk-m{flex:1;min-width:0}.wk-m b{letter-spacing:.18em;font-size:14px;color:#fff}.wk-m p{margin:3px 0 7px;font-size:12px;color:var(--dim)}.wk-m small{display:block;margin-top:4px;font-size:11px;letter-spacing:.14em;color:#fff}.wk-c.done .wk-m small{color:#7ef0a0}
.wk-r{display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-size:11px;letter-spacing:.12em;color:var(--accent);white-space:nowrap}
.pg-pres{display:inline-block;width:40px;height:40px;flex:0 0 auto;background-size:contain;background-repeat:no-repeat;background-position:center;filter:drop-shadow(0 0 4px rgba(0,0,0,.8))}
.pg-presbtn{pointer-events:auto;cursor:pointer;font:inherit;font-size:10px;letter-spacing:.18em;padding:3px 8px;border:1px solid #7fd16b;background:rgba(80,200,90,.2);color:#fff;animation:prp 1.4s infinite}.pg-presbtn:hover,.pg-presbtn:focus{outline:0;background:#7fd16b;color:#06150c}
@keyframes prp{50%{box-shadow:0 0 10px rgba(127,209,107,.8)}}
.pr-ov{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);pointer-events:auto}
.pr-box{width:min(460px,92vw);padding:26px;text-align:center;border:1px solid rgba(127,209,107,.5);background:linear-gradient(180deg,#0f1a10,#0a0c0d)}.pr-box img{width:120px;height:120px}
.pr-box small{display:block;font-size:11px;letter-spacing:.3em;color:#8fdc7a;margin-top:6px}.pr-box b{display:block;font-size:30px;letter-spacing:.12em;color:#fff}.pr-box p{font-size:13px;color:var(--dim);line-height:1.5}
.pr-box ul{list-style:none;padding:0;margin:10px 0 18px;display:flex;flex-direction:column;gap:5px}.pr-box li{font-size:12px;letter-spacing:.14em;color:#fff}.pr-box li::before{content:"+ ";color:#7fd16b}
.pr-acts{display:flex;gap:10px;justify-content:center}.pr-acts .btn{width:auto;padding:10px 18px}`;
  document.head.appendChild(s);
})();

/* ---------- THE STASH YARD (firing range + tutorial) */
const RANGE_STEPS = [
  ['move', 'MOVE', () => `walk around (${actName('fwd')} ${actName('left')} ${actName('back')} ${actName('right')})`],
  ['look', 'LOOK', () => 'look around with the mouse / right stick'],
  ['shoot', 'SHOOT', () => 'take down a target'],
  ['ads', 'AIM', () => 'aim down your sights (right mouse / LT) for a second'],
  ['head', 'HEADSHOT', () => 'drop a target with a shot to the head'],
  ['reload', 'RELOAD', () => `reload (${actName('reload')})`],
  ['swap', 'SWITCH', () => `switch weapons (${actName('swap')}, ${actName('prim')} / ${actName('sec')} or scroll)`],
  ['crouch', 'CROUCH / SLIDE', () => `crouch (${actName('crouch')}); while sprinting it slides`],
  ['jump', 'JUMP', () => `jump (${actName('jump')})`],
  ['melee', 'MELEE', () => `melee (${actName('melee')})`],
  ['nade', 'GRENADE', () => `throw a grenade (${actName('grenade')})`],
  ['streak', 'SCORESTREAK', () => `call in the free DEALER DRONE (${actName('streak')})`],
];
const RG = { on: false, dummies: [], spots: [], done: {}, look: 0, lastYaw: 0, moved: 0, lx: 0, lz: 0, adsT: 0, cur: -1, gaveStreak: false, finished: false };
function startRange() {
  initAudio(); clearMenuSoldiers();
  startMatch('range', { map: MAPS.stackyard ? 'stackyard' : DEFAULT_MAP });
}
function rangeStart(cfg) {
  buildSpawns(); G.breakT = 1e9; G.waveActive = false; G.maxHp = G.health = 100;
  const me = { name: 'YOU', team: 0, isPlayer: true, kills: 0, deaths: 0, score: 0, obj: 0, level: 0, alive: true }; M.entries.push(me); M.me = me;
  // stand where the most targets can be seen: try every spawn point and 8 directions, targets fanned out 7-40 m away in sight
  const rc = new THREE.Raycaster(), eye = new THREE.Vector3(), to = new THREE.Vector3();
  const fan = (h, yaw) => { const out = [];
    for (const d of [7, 10, 13, 17, 21, 26, 32, 40]) for (const da of [0, -0.35, 0.35, -0.65, 0.65]) {
      const a = yaw + da, c = openNear(h.x - Math.sin(a) * d, h.z - Math.cos(a) * d), y = groundAt(c.x, c.z, (h.y || 0) + 1);
      if (Math.abs(y - (h.y || 0)) > 0.6 || Math.hypot(c.x - h.x, c.z - h.z) < 6 || out.some(o => Math.hypot(o.x - c.x, o.z - c.z) < 3.2)) continue;
      eye.set(h.x, (h.y || 0) + 1.6, h.z); to.set(c.x, y + 1.2, c.z); const dir = to.clone().sub(eye), L = dir.length(); rc.set(eye, dir.divideScalar(L)); rc.far = L - 0.3;
      if (rc.intersectObjects(wallMeshes, false).length) continue;
      out.push({ x: c.x, z: c.z, y }); break;
    }
    return out; };
  let home = LAYOUT.spawn[0], best = [], byaw = 0;
  for (const h of LAYOUT.spawn) for (let k = 0; k < 8; k++) { const f = fan(h, k * Math.PI / 4); if (f.length > best.length) { best = f; home = h; byaw = k * Math.PI / 4; } }
  placePlayer(home); P.yaw = byaw;
  RG.spots = best.slice(0, 9).map((p, i) => ({ x: p.x, z: p.z, y: p.y, strafe: i === 2 || i === 5, t: 0 }));
  RG.dummies = []; RG.on = true; RG.done = {}; RG.look = 0; RG.lastYaw = P.yaw; RG.moved = 0; RG.lx = P.x; RG.lz = P.z; RG.adsT = 0; RG.gaveStreak = false; RG.finished = false; RG.cur0 = G.cur; RG.k0 = 0;
  for (const s of RG.spots) rangeDummy(s);
  G.state = 'playing'; showScreen(null); lockPointer(); startMatchStats(); updateModeHud(true);
  showBanner('THE STASH YARD', 'firing range · learn the basics'); rangeHud(true);
}
function rangeLabel(txt) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 48; const g = c.getContext('2d'); g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText(txt, 64, 34); g.fillStyle = '#9ef07a'; g.fillText(txt, 64, 34);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); s.scale.set(0.9, 0.34, 1); return s;
}
function rangeDummy(s) {
  const e = makeEnemy('rifleman', s.x, s.z);
  Object.assign(e, { team: 1, pvp: true, hp: 100, maxHp: 100, speed: 0, dummy: true, aim: 0, holding: true, spawnProt: 0 });
  e.group.position.set(s.x, s.y, s.z); e.group.rotation.y = Math.atan2(P.x - s.x, P.z - s.z);
  if (!s.label) { s.label = rangeLabel(Math.round(Math.hypot(s.x - P.x, s.z - P.z)) + ' M'); s.label.position.set(s.x, s.y + 2.35, s.z); scene.add(s.label);
    s.ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.7, 32), new THREE.MeshBasicMaterial({ color: 0x7fd16b, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide })); s.ring.rotation.x = -Math.PI / 2; s.ring.position.set(s.x, s.y + 0.03, s.z); scene.add(s.ring); }
  enemies.push(e); s.e = e; s.t = 0; RG.dummies.push(e); return e;
}
function rangeClear() {
  for (const s of RG.spots) { if (s.label) scene.remove(s.label); if (s.ring) scene.remove(s.ring); s.label = s.ring = null; }
  RG.spots = []; RG.dummies = []; RG.on = false; const h = $('rangeHud'); if (h) h.classList.add('hide');
}
function rangeTick(dt) {
  if (!RG.on) return;
  if (M.mode !== 'range') { rangeClear(); return; }
  for (const s of RG.spots) {
    if (s.e && !enemies.includes(s.e)) { s.e = null; s.t = 2.2; }
    if (!s.e) { if ((s.t -= dt) <= 0) rangeDummy(s); continue; }
    const e = s.e;
    if (s.strafe) { const x = s.x + Math.sin(NOW * 1.1 + s.z) * 2.6; e.group.position.x = x; animEnemy(e, dt, 2.2); } else animEnemy(e, dt, 0);
    if (e.hp < e.maxHp && NOW - (e.hitAt || 0) > 3) e.hp = e.maxHp;
  }
  // the checklist
  const D = RG.done, mark = id => { if (!D[id]) { D[id] = true; try { sfx.pickup(); } catch (e) {} rangeHud(true); } };
  if (G.state === 'playing') {
    RG.moved += Math.hypot(P.x - RG.lx, P.z - RG.lz); RG.lx = P.x; RG.lz = P.z; if (RG.moved > 4) mark('move');
    let dy = P.yaw - RG.lastYaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; RG.look += Math.abs(dy); RG.lastYaw = P.yaw; if (RG.look > 2.5) mark('look');
    if (MS.kills > 0) mark('shoot'); if (MS.heads > 0) mark('head');
    if (G.adsOn) { RG.adsT += dt; if (RG.adsT > 1) mark('ads'); }
    if (G.reloading) mark('reload'); if (G.cur !== RG.cur0) mark('swap'); if (P.eye < 1.35) mark('crouch'); if (!P.onGround && P.vy > 1) mark('jump');
    if (G.meleeT > 0 || G.knifeT > 0) mark('melee'); if (grenadesInFlight.length) mark('nade');
    if (!RG.gaveStreak && RANGE_STEPS.slice(0, -1).filter(s => D[s[0]]).length >= 6) { RG.gaveStreak = true; STK.have = ['drone']; STK.useCd = 0; STK.cd = {}; stkHud(true); showBanner('FREE SCORESTREAK', `DEALER DRONE · press ${actName('streak')}`); }
    if (RG.gaveStreak && !STK.have.length) mark('streak');
  }
  if (!RG.finished && RANGE_STEPS.every(s => D[s[0]])) {
    RG.finished = true; showBanner('TRAINING COMPLETE', 'you know the basics · stay as long as you like'); try { sfx.streak(); } catch (e) {}
    if (!PROG.range) { PROG.range = 1; PROG.dz += 500; saveProg(); toast2('THE STASH YARD · FIRST TIME BONUS +500 DZ'); }
  }
  rangeHud(false);
}
function rangeHud(force) {
  let h = $('rangeHud');
  if (!h) { h = document.createElement('div'); h.id = 'rangeHud'; h.className = 'hide'; ($('hud') || document.body).appendChild(h); }
  const on = RG.on && (G.state === 'playing' || G.state === 'paused');
  if (h._on !== on) { h._on = on; h.classList.toggle('hide', !on); }
  if (!on) return;
  const acc = MS.shots ? Math.round(MS.hits / MS.shots * 100) : 0, key = Object.keys(RG.done).join() + '|' + MS.kills + '|' + MS.heads + '|' + acc + '|' + Math.round(MS.longest || 0);
  if (!force && h._k === key) return; h._k = key;
  const next = RANGE_STEPS.findIndex(s => !RG.done[s[0]]);
  h.innerHTML = `<div class="rg-h">THE STASH YARD <small>${RANGE_STEPS.filter(s => RG.done[s[0]]).length}/${RANGE_STEPS.length}</small></div>` +
    RANGE_STEPS.map((s, i) => `<div class="rg-s${RG.done[s[0]] ? ' ok' : i === next ? ' now' : ''}"><i>${RG.done[s[0]] ? '✓' : i + 1}</i><b>${s[1]}</b>${i === next ? `<span>${s[2]()}</span>` : ''}</div>`).join('') +
    `<div class="rg-st"><span>TARGETS<b>${MS.kills}</b></span><span>HEADSHOTS<b>${MS.heads}</b></span><span>ACCURACY<b>${acc}%</b></span><span>LONGEST<b>${Math.round(MS.longest || 0)} M</b></span></div><div class="rg-tip">Change guns and attachments from the pause menu. Nothing here counts for XP or stats.</div>`;
}
(() => { const s = document.createElement('style'); s.textContent = `#rangeHud{position:absolute;left:22px;top:130px;width:280px;padding:8px 12px;background:rgba(6,10,6,.72);border:1px solid rgba(127,209,107,.35);font-size:12px;letter-spacing:.06em;color:#dfe8da;pointer-events:none}
#rangeHud .rg-h{font-weight:800;letter-spacing:.24em;color:#9ef07a;margin-bottom:6px}#rangeHud .rg-h small{float:right;color:#fff}
#rangeHud .rg-s{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:2px 0;opacity:.55}#rangeHud .rg-s i{width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-size:10px;border:1px solid rgba(255,255,255,.3)}
#rangeHud .rg-s.ok{opacity:.8}#rangeHud .rg-s.ok i{background:#2fbf6a;border-color:#2fbf6a;color:#06150c}#rangeHud .rg-s.now{opacity:1}#rangeHud .rg-s.now i{border-color:#9ef07a;color:#9ef07a}
#rangeHud .rg-s span{flex:1 0 100%;padding-left:24px;font-size:11px;color:#9ef07a}#rangeHud .rg-s b{letter-spacing:.14em;font-size:11px}
#rangeHud .rg-st{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.15)}#rangeHud .rg-st span{font-size:10px;letter-spacing:.14em;color:var(--dim,#aaa)}#rangeHud .rg-st b{display:block;font-size:16px;color:#fff;letter-spacing:.04em}
#rangeHud .rg-tip{margin-top:6px;font-size:10px;color:rgba(255,255,255,.55);line-height:1.4}`; document.head.appendChild(s); })();

/* ---------- actions */
function wkAct(act) {
  if (act === 'weekly') { openWeekly(); return true; }
  if (act === 'wk-back') { wkBack(); return true; }
  if (act === 'pr-open') { presOpen(); return true; }
  if (act === 'pr-close') { presClose(); return true; }
  if (act === 'pr-go') { presGo(); return true; }
  if (act === 'range') { startRange(); return true; }
  return false;
}
