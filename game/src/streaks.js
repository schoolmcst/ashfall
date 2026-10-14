/* ================================================================== scorestreaks
   Points from kills since your last death earn the streaks you picked (three, in the SCORESTREAKS tab). Earned streaks
   wait in the bottom-right until you use them with the SCORESTREAK key (X by default); dying resets the points but
   keeps what you already earned. UAVs show enemies on the radar and on screen; strikes drop shells / bombs on them. */
const STK_ICON = {
  uav: '<path d="M4 13 L20 13 M12 5 L12 21 M7 9 L17 9" stroke-width="2.2"/><circle cx="12" cy="13" r="2.4"/>',
  supply: '<rect x="4" y="7" width="16" height="13" rx="1"/><path d="M4 11 H20 M12 7 V20 M8 4 L12 7 L16 4"/>',
  armor: '<path d="M12 3 L20 6 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V6 Z"/><path d="M12 7 V17 M8 11 H16"/>',
  mortar: '<path d="M12 3 V9 M12 9 L8 21 M12 9 L16 21 M6 14 H18"/><circle cx="12" cy="3.5" r="1.6"/>',
  vuav: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2 V6 M12 18 V22 M2 12 H6 M18 12 H22"/>',
  air: '<path d="M2 13 L22 9 L22 11 L14 13 L16 20 L13 20 L10 14 L4 15 Z"/>',
};
const STREAKS = {
  uav:    { name: 'UAV', cost: 400, desc: 'A spy plane shows every enemy on your radar and screen for 30 seconds.' },
  supply: { name: 'SUPPLY DROP', cost: 500, desc: 'Refills all your ammo and grenades and heals you to full.' },
  armor:  { name: 'BODY ARMOR', cost: 600, desc: '+60 health until you die.' },
  mortar: { name: 'MORTAR STRIKE', cost: 750, desc: 'Three mortar shells land on enemy positions.' },
  vuav:   { name: 'ADVANCED UAV', cost: 1000, desc: 'Shows every enemy and the way they are facing for 45 seconds.' },
  air:    { name: 'AIRSTRIKE', cost: 1200, desc: 'A jet carpet-bombs a line straight through the enemy.' },
};
const STK_KEY = 'ashfall.streaks.v1';
let STK_SEL = ['uav', 'mortar', 'air'];
try { const a = JSON.parse(localStorage.getItem(STK_KEY) || 'null'); if (Array.isArray(a) && a.length && a.every(k => STREAKS[k])) STK_SEL = a.slice(0, 3); } catch (e) {}
const stkSave = () => { try { localStorage.setItem(STK_KEY, JSON.stringify(STK_SEL)); } catch (e) {} };
const stkIcon = (id, cls = '') => `<svg class="stk-ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${STK_ICON[id] || ''}</svg>`;
const stkOn = () => typeof M !== 'undefined' && M && inMatch() && M.mode !== 'gun' && M.mode !== 'snd' && !G.bench;
const STK = { pts: 0, got: new Set(), have: [], uavT: 0, vuav: false, jobs: [] };
function stkReset() { STK.pts = 0; STK.got.clear(); STK.have = []; STK.uavT = 0; STK.vuav = false; STK.jobs = []; stkHud(true); }
function stkDeath() { STK.pts = 0; STK.got.clear(); stkHud(true); }
function stkAdd(pts) {
  if (!stkOn()) return;
  STK.pts += pts * (perk('hard') ? 1.2 : 1);
  const list = STK_SEL.slice().sort((a, b) => STREAKS[a].cost - STREAKS[b].cost);
  for (const id of list) if (STK.pts >= STREAKS[id].cost && !STK.got.has(id)) {
    STK.got.add(id); STK.have.push(id);
    showBanner(STREAKS[id].name + ' READY', `press ${keyName(bind('streak'))} to use it`); try { sfx.streakReady(); } catch (e) { sfx.streak(); }
  }
  if (list.every(id => STK.got.has(id))) { STK.pts = 0; STK.got.clear(); }   // the whole set earned: start again
  stkHud(true);
}
function stkUse() {
  if (!stkOn() || !STK.have.length || !(G.state === 'playing')) return;
  const id = STK.have.pop(), en = () => enemies.filter(e => !isFriend(e) && (!e.entry || e.entry.alive !== false));
  sfx.ui();
  if (id === 'uav' || id === 'vuav') { STK.uavT = Math.max(STK.uavT, id === 'vuav' ? 45 : 30); STK.vuav = STK.vuav || id === 'vuav'; showBanner(STREAKS[id].name + ' ONLINE', 'enemies revealed'); stkRadio(); }
  else if (id === 'supply') { for (const w of WEAPONS) if (w) { w.ammo = w.magSize; w.reserve = w.reserveMax; } G.grenades = EQUIP[G.equip].count; G.health = G.maxHp; showBanner('SUPPLY DROP', 'ammo, grenades and health refilled'); sfx.pickup(); }
  else if (id === 'armor') { G.maxHp += 60; G.health = Math.min(G.maxHp, G.health + 60); showBanner('BODY ARMOR', '+60 health until you die'); sfx.pickup(); }
  else if (id === 'mortar') {
    const t = stkTargets(en(), 3); showBanner('MORTAR STRIKE', 'shells inbound'); stkRadio();
    t.forEach((p, i) => STK.jobs.push({ t: 1.4 + i * 0.6, whistle: true, fn: () => stkBoom(p.x + rnd(-1.5, 1.5), p.z + rnd(-1.5, 1.5), 7, 1.4) }));
  }
  else if (id === 'air') {
    const t = stkTargets(en(), 1)[0] || { x: P.x + 25 * -Math.sin(P.yaw), z: P.z + 25 * -Math.cos(P.yaw) };
    const a = Math.random() * TAU, dx = Math.cos(a), dz = Math.sin(a); showBanner('AIRSTRIKE', 'jet inbound'); stkRadio();
    STK.jobs.push({ t: 1.6, fn: () => stkJet(t.x, t.z, dx, dz) });
    for (let k = -3; k <= 3; k++) { const x = t.x + dx * k * 3.6, z = t.z + dz * k * 3.6; if (Math.hypot(x - P.x, z - P.z) > 6) STK.jobs.push({ t: 2.3 + (k + 3) * 0.13, fn: () => stkBoom(x, z, 6.5, 1.25) }); }
  }
  stkHud(true);
}
// up to n enemy spots, away from you (strikes never land on top of you)
function stkTargets(list, n) {
  const ok = list.filter(e => Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) > 9).sort(() => Math.random() - 0.5);
  const out = ok.slice(0, n).map(e => ({ x: e.group.position.x, z: e.group.position.z }));
  while (out.length < n && out.length) out.push(Object.assign({}, out[out.length - 1]));
  return out;
}
function stkBoom(x, z, R, k) { const y = groundAt(x, z, 20) + 0.3; explode({ x, y, z }, 'strike', R, k, 'player'); }
function stkRadio() { tone(880, 0.07, 0.07, 'square'); tone(660, 0.07, 0.07, 'square', undefined, { delay: 0.09 }); }
function stkJet(x, z, dx, dz) { const o = at(x, z, 40); burst(1.8, 900, 0.7, 'lowpass', o); tone(260, 1.6, 0.25, 'sawtooth', 90, o); }
function updateStreaks(dt) {
  if (STK.jobs.length) for (let i = STK.jobs.length - 1; i >= 0; i--) {
    const j = STK.jobs[i]; j.t -= dt;
    if (j.whistle && !j.ws && j.t < 1.0) { j.ws = true; tone(1500, 1.0, 0.08, 'sine', 380); }
    if (j.t <= 0) { STK.jobs.splice(i, 1); try { j.fn(); } catch (e) { reportError(e); } }
  }
  if (STK.uavT > 0) { STK.uavT -= dt; if (STK.uavT <= 0) { STK.uavT = 0; STK.vuav = false; } }
  stkMarks(); stkHud(false);
}
const stkSeen = e => STK.uavT > 0 && !isFriend(e);
// on-screen enemy diamonds while a UAV is up (the advanced one adds the way they face)
const _sv = new THREE.Vector3();
function stkMarks() {
  const lay = $('uavMarks'); if (!lay) return;
  const on = STK.uavT > 0 && (G.state === 'playing' || G.state === 'paused');
  if (!on) { if (lay._n) { lay.innerHTML = ''; lay._n = 0; } return; }
  const list = enemies.filter(e => !isFriend(e)), W = innerWidth, H = innerHeight;
  while (lay.children.length < list.length) { const d = document.createElement('i'); lay.appendChild(d); }
  lay._n = list.length;
  for (let i = 0; i < lay.children.length; i++) {
    const d = lay.children[i], e = list[i];
    if (!e) { d.style.display = 'none'; continue; }
    _sv.set(e.group.position.x, e.group.position.y + 1.95, e.group.position.z).project(camera);
    if (_sv.z > 1) { d.style.display = 'none'; continue; }
    d.style.display = ''; d.style.transform = `translate(${((_sv.x + 1) / 2 * W).toFixed(0)}px,${((1 - _sv.y) / 2 * H).toFixed(0)}px) rotate(45deg)`;
    d.className = STK.vuav ? 'adv' : '';
  }
}
function stkHud(force) {
  const box = $('stkHud'); if (!box) return;
  const on = stkOn() && (G.state === 'playing' || G.state === 'paused' || G.state === 'respawning' || G.state === 'deathcam');
  if (box._on !== on) { box._on = on; box.classList.toggle('hide', !on); }
  if (!on) return;
  const key = STK_SEL.join() + '|' + STK.pts + '|' + STK.have.join() + '|' + Math.ceil(STK.uavT);
  if (!force && box._k === key) return; box._k = key;
  const list = STK_SEL.slice().sort((a, b) => STREAKS[a].cost - STREAKS[b].cost);
  box.innerHTML = list.map(id => {
    const s = STREAKS[id], have = STK.have.includes(id), p = have ? 1 : STK.got.has(id) ? 0 : clamp(STK.pts / s.cost, 0, 1);
    return `<div class="stk${have ? ' ready' : ''}"><div class="stk-fill" style="height:${(p * 100).toFixed(0)}%"></div>${stkIcon(id)}<span>${have ? keyName(bind('streak')) : s.cost}</span></div>`;
  }).join('') + (STK.uavT > 0 ? `<div class="stk-uav">${STK.vuav ? 'ADV UAV' : 'UAV'} ${Math.ceil(STK.uavT)}</div>` : '') + `<div class="stk-pts">${STK.pts}</div>`;
}

/* ---------- SCORESTREAKS tab: pick three */
let stkReturn = 'menu';
function openStreaks(from) { stkReturn = from || curScreen || 'menu'; renderStreaks(); showScreen('streaks'); }
function renderStreaks() {
  const ids = Object.keys(STREAKS);
  $('stkSel').innerHTML = [0, 1, 2].map(i => { const id = STK_SEL.slice().sort((a, b) => STREAKS[a].cost - STREAKS[b].cost)[i]; return `<div class="stk-slot${id ? ' on' : ''}">${id ? stkIcon(id) + `<b>${STREAKS[id].name}</b><small>${STREAKS[id].cost}</small>` : '<b>EMPTY</b><small>pick a streak</small>'}</div>`; }).join('');
  $('stkGrid').innerHTML = ids.map(id => { const s = STREAKS[id], on = STK_SEL.includes(id);
    return `<button class="stk-card${on ? ' on' : ''}" data-stk="${id}">${stkIcon(id)}<div><b>${s.name}</b><span class="stk-cost">${s.cost} PTS</span><p>${s.desc}</p></div><em>${on ? 'EQUIPPED' : 'EQUIP'}</em></button>`; }).join('');
  for (const b of $('stkGrid').querySelectorAll('[data-stk]')) b.onclick = () => {
    const id = b.dataset.stk, i = STK_SEL.indexOf(id); sfx.ui();
    if (i >= 0) { if (STK_SEL.length > 1) STK_SEL.splice(i, 1); }
    else { if (STK_SEL.length >= 3) STK_SEL.shift(); STK_SEL.push(id); }
    stkSave(); renderStreaks(); focusFirst(`#stkGrid [data-stk="${id}"]`);
  };
}
(() => {
  const s = document.createElement('style');
  s.textContent = `#stkHud{position:absolute;right:28px;bottom:150px;display:flex;flex-direction:column;align-items:flex-end;gap:6px}
#stkHud .stk{position:relative;width:46px;height:46px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.45);overflow:hidden;display:flex;align-items:center;justify-content:center}
#stkHud .stk-fill{position:absolute;left:0;right:0;bottom:0;background:rgba(224,180,74,.28)}
#stkHud .stk.ready{border-color:var(--accent);box-shadow:0 0 12px rgba(224,180,74,.55);animation:stkp 1.2s infinite}#stkHud .stk.ready .stk-fill{background:rgba(224,180,74,.45)}
@keyframes stkp{50%{box-shadow:0 0 2px rgba(224,180,74,.2)}}
#stkHud .stk span{position:absolute;right:2px;bottom:1px;font-size:9px;letter-spacing:.05em;color:#fff;text-shadow:0 0 3px #000}
#stkHud .stk-uav,#stkHud .stk-pts{font-size:11px;letter-spacing:.2em;color:var(--accent);text-shadow:0 0 4px #000}#stkHud .stk-pts{color:rgba(255,255,255,.6)}
.stk-ic{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linejoin:round;color:#e9e6d8;position:relative}
#uavMarks i{position:absolute;left:-6px;top:-6px;width:10px;height:10px;border:2px solid #ff4a3a;background:rgba(255,74,58,.35);box-shadow:0 0 6px rgba(255,60,40,.8)}
#uavMarks i.adv{background:#ff4a3a}
.stkp{width:min(1100px,94vw)}.stk-top{display:flex;gap:10px;padding:16px 26px}.stk-slot{flex:1;display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px dashed var(--line);color:var(--dim)}
.stk-slot.on{border:1px solid var(--accent);color:var(--ink);background:rgba(224,180,74,.08)}.stk-slot b{letter-spacing:.18em;font-size:13px}.stk-slot small{margin-left:auto;color:var(--accent);letter-spacing:.1em}
#stkGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;padding:0 26px 16px;overflow:auto}
.stk-card{pointer-events:auto;cursor:pointer;display:flex;gap:14px;align-items:flex-start;text-align:left;padding:14px;border:1px solid var(--line);background:rgba(255,255,255,.03);color:var(--ink);font-family:inherit;position:relative}
.stk-card .stk-ic{width:40px;height:40px;flex:0 0 auto;margin-top:2px}.stk-card b{display:block;letter-spacing:.2em;font-size:14px}.stk-card .stk-cost{font-size:11px;letter-spacing:.2em;color:var(--accent)}
.stk-card p{margin:6px 0 0;font-size:12px;line-height:1.4;color:var(--dim);letter-spacing:.02em}.stk-card em{position:absolute;right:10px;top:10px;font-style:normal;font-size:10px;letter-spacing:.2em;color:var(--dim)}
.stk-card:hover,.stk-card:focus{outline:0;border-color:rgba(224,180,74,.6)}.stk-card.on{border-color:var(--accent);background:rgba(224,180,74,.1)}.stk-card.on em{color:var(--accent)}`;
  document.head.appendChild(s);
})();
