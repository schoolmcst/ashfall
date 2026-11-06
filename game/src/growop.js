/* ================================================================== THE GROW OP (1.2.68): your own grow room in the menu
   Pots, seeds and six strains. Plants grow in real time (even while the game is closed) as long as they have water.
   Matches pay the supplies: WATER for every match played (and long ones), LIGHT for kills, NUTRIENTS for wins and
   zombie rounds. LIGHT pushes a plant an hour ahead, NUTRIENTS raise the harvest by half. A harvest pays XP (it counts
   for the battle pass too), DZ and seeds back, sometimes a seed of the next strain, and the FIRST harvest of every strain
   unlocks its strain camo (only from here, never from boxes). More pots open as you harvest. Saved in ashfall.grow. */
const GROW_KEY = 'ashfall.grow', HOUR = 36e5;
const STRAINS = [
  { id: 'og', name: 'OG KUSH', h: 3, col: '#5fc24a', leaf: '#3a8a2a', bud: '#9ad86a', xp: 600, dz: 150, desc: 'The classic. Quick, forgiving, always a good first pot.' },
  { id: 'blue', name: 'BLUE DREAM', h: 4, col: '#4aa3ff', leaf: '#2f7a4a', bud: '#7ab8ff', xp: 850, dz: 200, desc: 'Frosty blue buds. A little longer, a little more XP.' },
  { id: 'sour', name: 'SOUR DIESEL', h: 6, col: '#d8d040', leaf: '#4a8a20', bud: '#e8e070', xp: 1300, dz: 300, desc: 'Smells like a gas station. Big yield for the patient.' },
  { id: 'haze', name: 'PURPLE HAZE', h: 8, col: '#b06cff', leaf: '#3a5a2a', bud: '#a050ff', xp: 1900, dz: 450, desc: 'Deep purple. Rare seeds only drop from Sour Diesel.' },
  { id: 'north', name: 'NORTHERN LIGHTS', h: 10, col: '#5ae8d8', leaf: '#2a6a4a', bud: '#b8fff0', xp: 2600, dz: 600, desc: 'Glows a little in the dark. A long grow, a big payday.' },
  { id: 'cure', name: 'THE GREEN CURE', h: 12, col: '#3aff6a', leaf: '#1a8a3a', bud: '#7aff9a', xp: 3600, dz: 900, desc: 'The Grower\'s strain from the zombies story. The rarest seed there is.' },
];
const STRAIN = Object.fromEntries(STRAINS.map(s => [s.id, s]));
const GROW_POTS = [3, 3, 3, 4, 4, 5, 6];   // pots open at 0, 5, 15, 30 harvests (see growPots)
// the strain camos (first harvest of each strain): added to the cosmetics after the chance-box pool was made
const GROW_CAMO = [['og', 'OG KUSH', 'blobs', [0x2a5a1a, 0x4a8a2a, 0x7ac04a, 0x1a3a12]], ['blue', 'BLUE DREAM', 'blobs', [0x1a3a6a, 0x3a7ac8, 0x9ad0ff, 0x0f2240]],
  ['sour', 'SOUR DIESEL', 'splinter', [0x5a5a1a, 0xc8c040, 0x2a2a10, 0xe8e070]], ['haze', 'PURPLE HAZE', 'hex', [0x2a0a4a, 0x6a2aaa, 0xb06cff, 0x150626]],
  ['north', 'NORTHERN LIGHTS', 'cracked', [0x0a1a22, 0x5ae8d8, 0x1a3a4a]], ['cure', 'THE GREEN CURE', 'hex', [0x0a2a12, 0x1a8a3a, 0x3aff6a, 0x061a0a]]];
for (const [id, name, t, c] of GROW_CAMO) { const it = { id: 'gr_' + id, name: name + ' STRAIN', kind: 'camo', r: STRAINS.findIndex(s => s.id === id) < 3 ? 1 : id === 'cure' ? 3 : 2, grow: id, g: Object.assign({ t, c }, t === 'hex' ? { line: c[2] } : {}) }; COSM.push(it); COS[it.id] = it; }
let GROW = null;
function growLoad() {
  if (GROW) return GROW;
  try { GROW = JSON.parse(localStorage.getItem(GROW_KEY) || 'null'); } catch (e) { GROW = null; }
  if (!GROW || !GROW.pots) GROW = { pots: [], seeds: { og: 3 }, res: { w: 3, l: 1, n: 1 }, harvests: 0, done: {}, last: Date.now(), log: [] };
  return GROW;
}
function growSave() { try { localStorage.setItem(GROW_KEY, JSON.stringify(GROW)); } catch (e) {} }
const growPots = () => { const h = growLoad().harvests; return h >= 30 ? 6 : h >= 15 ? 5 : h >= 5 ? 4 : 3; };
// real time: each plant grows while it has water left (water runs out as time passes)
function growTick() {
  const g = growLoad(), now = Date.now(), dt = Math.max(0, now - (g.last || now)); g.last = now;
  for (const p of g.pots) { if (!p || !p.s) continue; const s = STRAIN[p.s], need = s.h * HOUR, use = Math.min(dt, p.wet); p.grown = Math.min(need, p.grown + use); p.wet = Math.max(0, p.wet - dt); }
}
const growStage = p => clamp(p.grown / (STRAIN[p.s].h * HOUR), 0, 1);
function growFmt(ms) { const m = Math.ceil(ms / 6e4); return m >= 60 ? `${Math.floor(m / 60)}H ${m % 60}M` : `${m}M`; }
/* ---------- supplies from matches (called when a match ends) */
function growMatch(won) {
  try {
    if (typeof M !== 'undefined' && M) { if (M.growDone) return; M.growDone = true; }   // once per match (zombies ends through two paths)
    const g = growLoad(), k = (typeof MS !== 'undefined' && MS) ? MS.kills | 0 : 0, zr = (typeof M !== 'undefined' && M && M.mode === 'zomb' && typeof Z !== 'undefined') ? Z.round | 0 : 0;
    const w = 1 + (k >= 15 || zr >= 10 ? 1 : 0), l = Math.floor(k / 8) + Math.floor(zr / 8), n = (won === 1 ? 1 : 0) + Math.floor(zr / 5);
    g.res.w += w; g.res.l += l; g.res.n += n; growSave(); try { crewMatch(won, k, zr); } catch (e) {}
    const parts = [`+${w} WATER`, l ? `+${l} LIGHT` : '', n ? `+${n} NUTRIENTS` : ''].filter(Boolean).join(' · ');
    setTimeout(() => { try { toast2('GROW OP · ' + parts); } catch (e) {} }, 2600);
    growDot();
  } catch (e) {}
}
/* ---------- actions */
function growPlant(i, sid) { const g = growLoad(); growTick(); if ((g.seeds[sid] | 0) < 1 || (g.pots[i] && g.pots[i].s) || i >= growPots()) return false; g.seeds[sid]--; g.pots[i] = { s: sid, grown: 0, wet: 2 * HOUR, lit: 0, fed: 0 }; growSave(); try { sfx.ui(); } catch (e) {} return true; }
function growWater(i) { const g = growLoad(), p = g.pots[i]; growTick(); if (!p || !p.s || g.res.w < 1 || growStage(p) >= 1) return false; g.res.w--; p.wet = Math.min(p.wet + 6 * HOUR, 24 * HOUR); growSave(); try { burst(0.25, 2500, 0.08, 'lowpass'); } catch (e) {} return true; }
function growLight(i) { const g = growLoad(), p = g.pots[i]; growTick(); if (!p || !p.s || g.res.l < 1 || p.lit >= 3 || growStage(p) >= 1) return false; g.res.l--; p.lit++; p.grown = Math.min(STRAIN[p.s].h * HOUR, p.grown + HOUR); growSave(); try { tone(660, 0.15, 0.06, 'triangle'); } catch (e) {} return true; }
function growFeed(i) { const g = growLoad(), p = g.pots[i]; growTick(); if (!p || !p.s || g.res.n < 1 || p.fed >= 2) return false; g.res.n--; p.fed++; growSave(); try { tone(440, 0.12, 0.05, 'sine'); } catch (e) {} return true; }
function growHarvest(i) {
  const g = growLoad(), p = g.pots[i]; growTick(); if (!p || !p.s || growStage(p) < 1) return null;
  const s = STRAIN[p.s], k = 1 + 0.5 * p.fed, xp = Math.round(s.xp * k), dz = Math.round(s.dz * k), idx = STRAINS.indexOf(s);
  const back = 1 + (Math.random() < 0.5 + 0.2 * p.fed ? 1 : 0); g.seeds[s.id] = (g.seeds[s.id] | 0) + back;
  let next = null; const nx = !s.hy && STRAINS[idx + 1] && !STRAINS[idx + 1].hy ? STRAINS[idx + 1] : null; if (nx && Math.random() < (idx < 2 ? 0.45 : 0.3) + 0.1 * p.fed) { next = nx; g.seeds[nx.id] = (g.seeds[nx.id] | 0) + 1; }
  const first = !g.done[s.id]; g.done[s.id] = (g.done[s.id] | 0) + 1; g.harvests++; g.pots[i] = null;
  // XP and DZ (the battle pass counts the XP too), the strain camo on a first harvest
  try { const before = PROG.xp; PROG.xp = Math.min(XP_AT[MAXLVL], PROG.xp + xp); grantLevels(before, PROG.xp); if (typeof bpGain === 'function') bpGain(xp); } catch (e) {}
  PROG.dz += dz; if (first) PROG.owned['gr_' + s.id] = 1; try { saveProg(); } catch (e) {}
  g.log.unshift({ s: s.id, xp, dz, t: Date.now() }); g.log.length = Math.min(g.log.length, 8); growSave();
  const msg = [`+${xp.toLocaleString()} XP`, `+${dz} DZ`, `${back} ${s.name} SEED${back > 1 ? 'S' : ''}`, next ? `A ${next.name} SEED!` : '', first ? `${s.name} STRAIN CAMO UNLOCKED` : ''].filter(Boolean);
  try { showBanner('HARVEST · ' + s.name, msg.join(' · ')); sfx.streak(); } catch (e) {}
  return { xp, dz, back, next: next && next.id, first };
}
/* ---------- the plant picture (drawn on a canvas, by stage) */
function growDraw(cv, p) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.clearRect(0, 0, W, H);
  const rg = g.createRadialGradient(W / 2, H * 0.1, 10, W / 2, H * 0.4, H); rg.addColorStop(0, p && p.s ? 'rgba(200,120,255,.22)' : 'rgba(255,255,255,.05)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
  // the pot
  g.fillStyle = '#7a3a22'; g.beginPath(); g.moveTo(W * 0.28, H * 0.78); g.lineTo(W * 0.72, H * 0.78); g.lineTo(W * 0.66, H * 0.98); g.lineTo(W * 0.34, H * 0.98); g.fill();
  g.fillStyle = '#8a4a2a'; g.fillRect(W * 0.26, H * 0.75, W * 0.48, H * 0.05); g.fillStyle = '#2a1a10'; g.fillRect(W * 0.29, H * 0.75, W * 0.42, H * 0.02);
  if (!p || !p.s) { g.fillStyle = 'rgba(255,255,255,.35)'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.fillText('EMPTY POT', W / 2, H * 0.5); return; }
  const s = STRAIN[p.s], st = growStage(p), dry = p.wet <= 0 && st < 1, hgt = H * (0.06 + 0.6 * Math.pow(st, 0.8)), base = H * 0.76, cx = W / 2;
  const leaf = dry ? '#7a7a3a' : s.leaf;
  g.strokeStyle = dry ? '#6a6a30' : '#3a6a22'; g.lineWidth = 2 + st * 3; g.beginPath(); g.moveTo(cx, base); g.quadraticCurveTo(cx + (dry ? 8 : 2), base - hgt / 2, cx + (dry ? 14 : 0), base - hgt); g.stroke();
  // a fan leaf: seven leaflets
  const fan = (x, y, sz, a) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = leaf; for (let i = -3; i <= 3; i++) { g.save(); g.rotate(i * 0.38); const L = sz * (1 - Math.abs(i) * 0.16); g.beginPath(); g.ellipse(0, -L / 2, L * 0.13, L / 2, 0, 0, TAU); g.fill(); g.restore(); } g.restore(); };
  const nodes = Math.max(1, Math.round(1 + st * 6));
  for (let i = 0; i < nodes; i++) { const f = (i + 1) / (nodes + 1), y = base - hgt * f, x = cx + (dry ? 14 * f : 0), sz = (10 + st * 26) * (1 - f * 0.45); fan(x - 2, y, sz, -1.0 - (dry ? 0.4 : 0)); fan(x + 2, y, sz, 1.0 + (dry ? 0.4 : 0)); }
  fan(cx + (dry ? 14 : 0), base - hgt, 10 + st * 18, 0);
  if (st > 0.55) {   // flowering: buds up the top of the stem, then frosty sparkles when ready
    const nb = Math.round((st - 0.5) * 12); g.fillStyle = s.bud;
    for (let i = 0; i < nb; i++) { const f = 0.55 + i / Math.max(1, nb) * 0.45, y = base - hgt * f, x = cx + (dry ? 14 * f : 0) + (i % 2 ? 5 : -5); g.beginPath(); g.ellipse(x, y, 4 + st * 4, 6 + st * 5, 0, 0, TAU); g.fill(); }
    if (st >= 1) { g.fillStyle = '#ffffff'; for (let i = 0; i < 18; i++) { const a = i * 2.4, r = 6 + (i * 7) % 22; g.globalAlpha = 0.5 + 0.5 * Math.sin(NOW * 4 + i); g.fillRect(cx + Math.cos(a) * r, base - hgt * 0.8 + Math.sin(a) * r * 1.4, 2, 2); } g.globalAlpha = 1; }
  }
}
/* ---------- the screen */
let growRet = 'menu', growSel = -1;
function openGrow() { if (curScreen !== 'growop') growRet = curScreen || 'menu'; growLoad(); growTick(); growSave(); if (!SCREENS.includes('growop')) SCREENS.push('growop'); growRender(); showScreen('growop'); }
function growRender(focusSel) {
  const g = growLoad(), el = $('growop'); if (!el) return; growTick();
  const n = growPots(), nextPot = g.harvests < 5 ? 5 : g.harvests < 15 ? 15 : g.harvests < 30 ? 30 : 0;
  $('grRes').innerHTML = [['w', 'WATER', '#5ab8ff', 'every match · long ones pay 2'], ['l', 'LIGHT', '#ffd23a', '1 for every 8 kills or 8 zombie rounds'], ['n', 'NUTRIENTS', '#7adf6a', 'every win · every 5 zombie rounds']].map(([k, nm, c, how]) => `<div class="gr-r" style="--c:${c}"><b>${g.res[k]}</b><small>${nm}</small><span>${how}</span></div>`).join('') +
    `<div class="gr-r" style="--c:#c070ff"><b>${g.harvests}</b><small>HARVESTS</small><span>${nextPot ? `pot ${n + 1} at ${nextPot}` : 'all six pots open'}</span></div>`;
  let pots = '';
  for (let i = 0; i < 6; i++) {
    const p = g.pots[i], lock = i >= n;
    if (lock) { pots += `<div class="gr-pot lock"><canvas width="160" height="190"></canvas><b>LOCKED</b><small>${i === 3 ? 5 : i === 4 ? 15 : 30} HARVESTS</small></div>`; continue; }
    if (!p || !p.s) {
      const have = STRAINS.filter(s => g.seeds[s.id] > 0);
      pots += `<div class="gr-pot"><canvas width="160" height="190" data-gr="${i}"></canvas><b>EMPTY</b><small>${have.length ? 'PLANT A SEED' : 'NO SEEDS · HARVEST TO GET MORE'}</small><div class="gr-acts">${have.map(s => `<button class="gr-b" style="--c:${s.col}" data-act="gr-plant-${i}-${s.id}">${s.name} ×${g.seeds[s.id]}</button>`).join('')}</div></div>`;
      continue;
    }
    const s = STRAIN[p.s], st = growStage(p), left = s.h * HOUR - p.grown, ready = st >= 1, dry = p.wet <= 0 && !ready;
    pots += `<div class="gr-pot${ready ? ' ready' : dry ? ' dry' : ''}" style="--c:${s.col}"><canvas width="160" height="190" data-gr="${i}"></canvas><b style="color:${s.col}">${s.name}</b>
<small data-grt="${i}">${ready ? 'READY TO HARVEST' : dry ? 'THIRSTY · GROWTH PAUSED' : `${growFmt(left)} LEFT · WATER ${growFmt(p.wet)}`}</small><div class="gr-bar"><s style="width:${(st * 100).toFixed(1)}%;background:${s.col}"></s></div>
<div class="gr-acts">${ready ? `<button class="gr-b big" data-act="gr-harv-${i}">HARVEST</button>` : `<button class="gr-b"${g.res.w < 1 ? ' disabled' : ''} data-act="gr-water-${i}">WATER</button><button class="gr-b"${g.res.l < 1 || p.lit >= 3 ? ' disabled' : ''} data-act="gr-light-${i}">LIGHT ${p.lit}/3</button>`}<button class="gr-b"${g.res.n < 1 || p.fed >= 2 ? ' disabled' : ''} data-act="gr-feed-${i}">FEED ${p.fed}/2</button></div></div>`;
  }
  $('grPots').innerHTML = pots;
  $('grStrains').innerHTML = `<div class="gr-sh"><b>STRAINS</b><small>the first harvest of each one unlocks its strain camo</small></div>` + STRAINS.map(s => `<div class="gr-s${g.done[s.id] ? ' got' : ''}" style="--c:${s.col}"><span class="lk-sw" style="background-image:url(${swatchUrl('gr_' + s.id)})"></span><div><b>${s.name}</b><small>${s.h} HOURS · ${s.xp.toLocaleString()} XP · ${g.seeds[s.id] | 0} SEEDS${g.done[s.id] ? ` · HARVESTED ${g.done[s.id]}×` : ''}</small><p>${s.desc}</p></div></div>`).join('');
  for (const cv of el.querySelectorAll('canvas[data-gr]')) growDraw(cv, g.pots[+cv.dataset.gr]);
  for (const cv of el.querySelectorAll('.gr-pot.lock canvas')) growDraw(cv, null);
  growDot();
  if (focusSel) focusFirst(focusSel);
}
// the GROW OP tab gets a dot when something is ready to harvest
function growDot() { try { const g = growLoad(); growTick(); const r = g.pots.some(p => p && p.s && growStage(p) >= 1); for (const b of document.querySelectorAll('.gr-tab')) b.classList.toggle('ready', r); } catch (e) {} }
function growAct(act) {
  if (act === 'growop') { openGrow(); return true; }
  if (act === 'gr-back') { showScreen(growRet || 'menu'); if (growRet === 'lobby') try { renderLobby(); } catch (e) {} return true; }
  let m = /^gr-plant-(\d)-(\w+)$/.exec(act); if (m) { growPlant(+m[1], m[2]); growRender(`[data-act="gr-water-${m[1]}"]`); return true; }
  m = /^gr-(water|light|feed|harv)-(\d)$/.exec(act); if (m) { const i = +m[2]; ({ water: growWater, light: growLight, feed: growFeed, harv: growHarvest })[m[1]](i); growRender(`[data-act="gr-${m[1]}-${i}"]`); return true; }
  return false;
}
// while the screen is open: timers every second, pictures (and the ready sparkle) a few times a second
setInterval(() => { try { if (curScreen !== 'growop') return; const g = growLoad(), before = g.pots.map(p => p && p.s && growStage(p) >= 1); growTick();
  if (g.pots.some((p, i) => (p && p.s && growStage(p) >= 1) !== !!before[i] || (p && p.s && p.wet <= 0 && growStage(p) < 1))) { growSave(); }
  for (const el of document.querySelectorAll('[data-grt]')) { const p = g.pots[+el.dataset.grt]; if (!p || !p.s) continue; const s = STRAIN[p.s], st = growStage(p); el.textContent = st >= 1 ? 'READY TO HARVEST' : p.wet <= 0 ? 'THIRSTY · GROWTH PAUSED' : `${growFmt(s.h * HOUR - p.grown)} LEFT · WATER ${growFmt(p.wet)}`; }
  for (const cv of document.querySelectorAll('#growop canvas[data-gr]')) growDraw(cv, g.pots[+cv.dataset.gr]); } catch (e) {} }, 500);
setInterval(growDot, 30000);
(() => {
  const d = document.createElement('div'); d.id = 'growop'; d.className = 'screen cod pg-scr hide';
  d.innerHTML = `<div class="cod-top"><div class="cod-title"><small>YOUR GROW ROOM</small><b>THE GROW OP</b></div><div style="flex:1"></div><div class="gr-res" id="grRes"></div></div>
<div class="gr-body"><div class="gr-pots" id="grPots"></div><div class="gr-strains" id="grStrains"></div></div>
<div class="cod-foot"><button class="btn" id="grBack" data-act="gr-back">&lsaquo; BACK</button><span class="padhint">B BACK</span></div>`;
  document.body.appendChild(d);
  const s = document.createElement('style');
  s.textContent = `.gr-body{flex:1;display:flex;gap:16px;padding:14px 3vw;min-height:0;overflow:auto;pointer-events:auto}
.gr-pots{flex:2;display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:12px;align-content:start}
.gr-pot{border:1px solid var(--line);background:linear-gradient(180deg,rgba(60,20,90,.35),rgba(10,12,13,.85));padding:10px;text-align:center;display:flex;flex-direction:column;gap:6px;align-items:center}
.gr-pot canvas{width:160px;height:190px}.gr-pot b{letter-spacing:.18em;font-size:13px}.gr-pot small{font-size:10px;letter-spacing:.14em;color:var(--dim)}
.gr-pot.ready{border-color:var(--c);box-shadow:0 0 18px -4px var(--c)}.gr-pot.dry small{color:#ffb03a}.gr-pot.lock{opacity:.45}
.gr-bar{width:100%;height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden}.gr-bar s{display:block;height:100%}
.gr-acts{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;width:100%}
.gr-b{font:600 10px var(--font,system-ui);letter-spacing:.14em;color:#eee;background:rgba(255,255,255,.06);border:1px solid var(--c,rgba(255,255,255,.3));padding:6px 9px;cursor:pointer;white-space:nowrap;pointer-events:auto}
.gr-b:hover,.gr-b:focus{background:rgba(255,255,255,.16);outline:none;border-color:#fff}.gr-b[disabled]{opacity:.35;cursor:default}
.gr-b.big{font-size:13px;padding:9px 22px;background:var(--c);color:#06150c;border-color:var(--c);box-shadow:0 0 16px -2px var(--c)}
.gr-res{display:flex;gap:10px}.gr-r{min-width:96px;padding:6px 10px;border:1px solid var(--line);border-left:3px solid var(--c);background:rgba(10,12,13,.7)}
.gr-r b{display:block;font-size:24px;color:#fff;line-height:1}.gr-r small{display:block;font-size:10px;letter-spacing:.2em;color:var(--c)}.gr-r span{display:block;font-size:9px;color:var(--dim);max-width:130px}
.gr-strains{flex:1;display:flex;flex-direction:column;gap:8px;min-width:280px}.gr-sh b{letter-spacing:.24em;color:#fff}.gr-sh small{display:block;font-size:10px;color:var(--dim)}
.gr-s{display:flex;gap:10px;align-items:center;padding:8px;border:1px solid var(--line);opacity:.7;background:rgba(8,10,11,.88)}.gr-s.got{opacity:1;border-color:var(--c)}.gr-s .lk-sw{width:44px;height:44px;flex:0 0 44px;background-size:cover;border-radius:4px}
.gr-s b{color:var(--c);letter-spacing:.14em;font-size:12px}.gr-s small{display:block;font-size:10px;color:#ddd;letter-spacing:.1em}.gr-s p{margin:2px 0 0;font-size:11px;color:var(--dim)}
.gr-tab.ready{position:relative}.gr-tab.ready:after{content:'';position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:#7adf6a;box-shadow:0 0 8px #7adf6a}`;
  document.head.appendChild(s);
})();

/* ---------- 1.2.72 ZOMBIES SEEDS: bosses and high rounds drop seeds for the grow room (solo and co-op, everyone gets theirs) */
const GROW_ZBOSS = { blackwell: 'sour', works: 'sour', terminal9: 'haze', mauiwowie: 'haze', maryjane: 'north', hightide: 'cure', bayview: 'cure' };
function growSeed(id, why) {
  const s = STRAIN[id]; if (!s) return; const g = growLoad(); g.seeds[id] = (g.seeds[id] | 0) + 1; growSave(); growDot();
  try { showBanner(`${s.name} SEED`, `${why} · it is in your GROW OP`); sfx.pickup(); } catch (e) {}
}
// a zombies round reached: round 10, 20, 30... pays a seed (rarer the higher you get)
function growZRound(r) { if (!r || r % 10) return; const pool = r >= 40 ? ['north', 'cure'] : r >= 30 ? ['haze', 'north'] : r >= 20 ? ['sour', 'haze'] : ['blue', 'sour']; growSeed(pool[(Math.random() * pool.length) | 0], `round ${r}`); }
