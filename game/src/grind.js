/* ================================================================== CAMO GRIND: earn camos by playing each gun
   Every gun has 8 MILITARY camos, each behind a challenge with that gun (kills, headshots, longshots, hip-fire or
   crouched kills, double kills). All 8 unlock GOLD for that gun. GOLD on every gun in a class unlocks DIAMOND for
   the whole class. DIAMOND on every class unlocks NOVA for every gun. Progress counts in every mode, offline and
   online (not the benchmark), and is saved with the rest of your progress (PROG.grind). Grind camos belong to the
   gun they were earned on. */
const GRIND_MIL = [
  ['DUSTLINE', 'blobs', 0, [0xb59a6a, 0x8d7448, 0xd2bd8e, 0x5e4c30]],
  ['FIELD DRAB', 'digital', 0, [0x56603a, 0x3a4228, 0x7a7d4e, 0x262b1c]],
  ['SCRUBLAND', 'splinter', 0, [0x8a8456, 0x5f5a38, 0xa9a274, 0x3b3824]],
  ['SAVANNA', 'tiger', 1, [0xc49a52, 0x3a2a14, 0xe0c27a]],
  ['TIMBERLINE', 'multicam', 1, [0x5a4a34, 0x3a5030, 0x8a7a5a, 0x22261a]],
  ['COBALT', 'hex', 1, [0x1f3a66, 0x264878, 0x30588c, 0x162a4a], { line: 0x0a1426 }],
  ['VIPER', 'scales', 2, [0x2e5a24, 0x1a3614, 0x0e1e0a], {}, { rough: 0.45, metal: 0.25 }],
  ['CRIMSON', 'splat', 2, [0x6a0e0e, 0x9a1a14, 0x2a0606, 0xd8402a], {}, { rough: 0.5, metal: 0.15 }],
];
const GRIND_TOP = [
  { id: 'g_gold', name: 'GOLD', kind: 'skin', r: 3, grind: true, g: { t: 'solid', c: [0xe0b445], fx: 'engrave' }, m: { rough: 0.3, metal: 0.8 } },
  { id: 'g_diamond', name: 'DIAMOND', kind: 'skin', r: 3, grind: true, g: { t: 'facets', c: [0x7fb8e6, 0xffffff] }, m: { rough: 0.05, metal: 0.3, anim: 'twinkle', emis: 1.7 } },
  { id: 'g_nova', name: 'NOVA', kind: 'skin', r: 3, grind: true, g: { t: 'stars', c: [0x060208, 0xffc27a], dense: 0.014, nebula: 0x9a2a0c }, m: { rough: 0.22, metal: 0.35, anim: 'twinkle', emis: 2.2 } },
];
GRIND_MIL.forEach(([name, t, r, c, gx, mx], i) => { const it = { id: 'g_m' + i, name, kind: 'camo', r, grind: true, tier: i, g: Object.assign({ t, c }, gx || {}), m: mx }; COSM.push(it); COS[it.id] = it; });
for (const it of GRIND_TOP) { COSM.push(it); COS[it.id] = it; }
if (!PROG.grind) PROG.grind = {};

// the challenge behind each military camo, by class (launchers have no headshots)
const GRIND_LONG = { sg: 12, smg: 20, pi: 18, ar: 30, lmg: 30, mr: 40, sr: 45, la: 25 };
function grindTasks(cat) {
  if (cat === 'la') return [['k', 10, 'KILLS'], ['k', 25, 'KILLS'], ['ls', 5, 'LONGSHOT KILLS'], ['dbl', 3, 'DOUBLE KILLS'], ['k', 50, 'KILLS'], ['ls', 15, 'LONGSHOT KILLS'], ['dbl', 8, 'DOUBLE KILLS'], ['k', 100, 'KILLS']];
  const alt = cat === 'sr' || cat === 'mr' ? 'CROUCHED KILLS' : 'HIP-FIRE KILLS';
  return [['k', 25, 'KILLS'], ['hs', 10, 'HEADSHOT KILLS'], ['k', 50, 'KILLS'], ['ls', 10, 'LONGSHOT KILLS'], ['alt', 15, alt], ['dbl', 5, 'DOUBLE KILLS'], ['hs', 30, 'HEADSHOT KILLS'], ['k', 100, 'KILLS']];
}
const grindGuns = () => lockerGuns();
const grindKey = (id, gun) => id + '@' + gun;
const grindHas = (id, gun) => !!PROG.owned[grindKey(id, gun)];
const grindStat = gun => PROG.grind[gun] || (PROG.grind[gun] = { k: 0, hs: 0, ls: 0, alt: 0, dbl: 0 });
function grindMilDone(gun) { let n = 0; for (let i = 0; i < 8; i++) if (grindHas('g_m' + i, gun)) n++; return n; }
const grindClassGuns = cat => grindGuns().filter(d => d.cat === cat);
const grindClasses = () => [...new Set(grindGuns().map(d => d.cat))];

// a kill by the player: x/z of the victim, headshot, explosive (grenades don't count; launchers do)
const GRIND_DBL = {};
function grindKill(head, dist, boom) {
  if (G.bench) return;
  const w = WEAPONS[G.cur]; if (!w || !w.def) return;
  const d = w.def, gun = d.id; if (!grindGuns().some(x => x.id === gun)) return;
  if (boom && d.cat !== 'la') return;
  const s = grindStat(gun);
  s.k++; if (head && !boom) s.hs++;
  if (dist >= (GRIND_LONG[d.cat] || 30)) s.ls++;
  if (d.cat === 'sr' || d.cat === 'mr' ? P.eye < 1.4 : !(G.ads > 0.5 || G.adsOn)) s.alt++;
  const now = G.time; if (now - (GRIND_DBL[gun] || -99) < 3) { s.dbl++; GRIND_DBL[gun] = -99; } else GRIND_DBL[gun] = now;
  grindCheck(gun, true);
  saveProg();
}
// unlock whatever is now earned; loud = show it in the match
function grindCheck(gun, loud) {
  const d = ARM[gun]; if (!d) return [];
  const got = [], s = grindStat(gun), tasks = grindTasks(d.cat);
  const own = (id, g) => { if (grindHas(id, g)) return; PROG.owned[grindKey(id, g)] = Date.now(); got.push([id, g]); };
  tasks.forEach(([k, n], i) => { if (s[k] >= n) own('g_m' + i, gun); });
  if (grindMilDone(gun) >= 8) own('g_gold', gun);
  const cg = grindClassGuns(d.cat);
  if (cg.every(x => grindHas('g_gold', x.id))) for (const x of cg) own('g_diamond', x.id);
  if (grindClasses().every(c => grindClassGuns(c).every(x => grindHas('g_diamond', x.id)))) for (const x of grindGuns()) own('g_nova', x.id);
  if (got.length && loud) {
    const top = got.find(([id]) => !id.startsWith('g_m')) || got[0], c = COS[top[0]];
    try { showBanner(c.name + ' UNLOCKED', ARM[top[1]].name + (got.length > 1 ? ` · +${got.length - 1} MORE` : '')); sfx.streak(); } catch (e) {}
    try { toast2('CAMO UNLOCKED · ' + c.name + ' · ' + ARM[top[1]].name); } catch (e) {}
  }
  return got;
}
// progress of one row in the challenges list: [have, need, label]
function grindRow(gun, id) {
  const d = ARM[gun];
  if (id.startsWith('g_m')) { const i = +id.slice(3), [k, n, label] = grindTasks(d.cat)[i], s = grindStat(gun); return [Math.min(s[k], n), n, `${n} ${label}` + (k === 'ls' ? ` (${GRIND_LONG[d.cat] || 30} M+)` : '')]; }
  if (id === 'g_gold') return [grindMilDone(gun), 8, 'UNLOCK ALL 8 MILITARY CAMOS'];
  if (id === 'g_diamond') { const cg = grindClassGuns(d.cat); return [cg.filter(x => grindHas('g_gold', x.id)).length, cg.length, `GOLD ON EVERY ${CATS[d.cat].name.replace(/S$/, '')}`]; }
  const cl = grindClasses(); return [cl.filter(c => grindClassGuns(c).every(x => grindHas('g_diamond', x.id))).length, cl.length, 'DIAMOND IN EVERY WEAPON CLASS'];
}
const GRIND_IDS = ['g_m0', 'g_m1', 'g_m2', 'g_m3', 'g_m4', 'g_m5', 'g_m6', 'g_m7', 'g_gold', 'g_diamond', 'g_nova'];
// the gun's mastery badge for the weapon grid
function grindBadge(gun) { return grindHas('g_nova', gun) ? 'NOVA' : grindHas('g_diamond', gun) ? 'DIAMOND' : grindHas('g_gold', gun) ? 'GOLD' : grindMilDone(gun) + '/8'; }

// the CHALLENGES tab of one gun in the locker
function renderGrind(body, d) {
  const gun = d.id, cur = camoFor(gun);
  const sel = LK.sel && COS[LK.sel] && COS[LK.sel].grind ? COS[LK.sel] : null, has = sel && grindHas(sel.id, gun), on = sel && cur === sel.id;
  $('lkFilters').innerHTML = `<button class="cod-tab" data-act="lk-back">&lsaquo; WEAPONS</button>` + [['camo', 'CAMOS'], ['grind', 'CHALLENGES'], ['sticker', 'STICKERS'], ['charm', 'CHARMS']].map(([k, n]) => `<button class="cod-tab${LK.tab === k ? ' on' : ''}" data-lktab="${k}">${n}</button>`).join('');
  body.className = 'lk-body';
  const mil = grindMilDone(gun);
  body.innerHTML = `<div class="lk-left"><div class="lk-gun-h"><small>${CATS[d.cat].name}</small><b>${d.name}</b></div><canvas id="lkPrev" width="480" height="200"></canvas><div id="lkInfo"></div></div>
<div class="lk-right"><div class="lk-sub">CAMO CHALLENGES · ${mil}/8 MILITARY${grindBadge(gun).includes('/') ? '' : ' · ' + grindBadge(gun)}</div><div class="gr-list" id="lkGrid">${GRIND_IDS.map((id, i) => {
    const c = COS[id], [h, n, txt] = grindRow(gun, id), ok = grindHas(id, gun), top = !id.startsWith('g_m');
    return `${i === 8 ? '<div class="gr-h">MASTERY</div>' : i === 0 ? '<div class="gr-h">MILITARY</div>' : ''}<button class="gr-row${ok ? ' ok' : ''}${top ? ' top ' + id.slice(2) : ''}${LK.sel === id ? ' on' : ''}${cur === id ? ' eq' : ''}" data-lk="${id}"><span class="gr-sw" style="background-image:url(${swatchUrl(id)})">${ok ? '' : '<i>🔒</i>'}</span><span class="gr-t"><b>${c.name}</b><small>${txt}</small><span class="gr-bar"><span style="width:${Math.round(h / n * 100)}%"></span></span></span><em>${ok ? (cur === id ? 'EQUIPPED' : 'UNLOCKED') : h + ' / ' + n}</em></button>`;
  }).join('')}</div></div>`;
  $('lkInfo').innerHTML = sel ? `<div class="lk-name" style="--rc:${RAR[sel.r].col}"><small>${sel.tier !== undefined ? 'MILITARY CAMO ' + (sel.tier + 1) + ' / 8' : 'MASTERY CAMO'}</small><b>${sel.name}</b></div><p class="lk-note">${sel.tier !== undefined ? grindRow(gun, sel.id)[2] + ' with the ' + d.name + '.' : grindRow(gun, sel.id)[2] + '.'}</p>
<div class="lk-acts"><button class="btn primary" data-act="lk-apply"${!has || on ? ' disabled' : ''}>${on ? 'EQUIPPED' : has ? 'EQUIP ON ' + d.name : 'LOCKED · ' + grindRow(gun, sel.id)[0] + ' / ' + grindRow(gun, sel.id)[1]}</button></div>`
    : `<div class="lk-name"><small>CAMO GRIND</small><b>${d.name}</b></div><p class="lk-note">Each challenge with this gun unlocks a camo for it. All 8 unlock GOLD; GOLD on every gun in the class unlocks DIAMOND; DIAMOND in every class unlocks NOVA.</p>`;
  for (const b of $('lkGrid').querySelectorAll('[data-lk]')) b.onclick = () => { LK.sel = b.dataset.lk; sfx.ui(); renderLocker(); focusFirst('#lkGrid [data-lk="' + LK.sel + '"]'); };
  for (const b of $('lkFilters').querySelectorAll('[data-lktab]')) b.onclick = () => { LK.tab = b.dataset.lktab; LK.sel = LK.tab === 'sticker' ? stickerFor(gun) : LK.tab === 'charm' ? charmFor(gun) : cur; sfx.ui(); renderLocker(); focusFirst('#lkFilters .on'); };
  PV.key = ''; PV.want = { def: d, ovr: null, camo: sel ? sel.id : cur, stk: stickerFor(gun), chm: charmFor(gun) };
}
(() => {
  const st = document.createElement('style');
  st.textContent = `.gr-list{display:flex;flex-direction:column;gap:6px;padding-bottom:12px}
.gr-h{font:700 11px var(--font,system-ui);letter-spacing:.2em;color:#9aa3aa;margin:8px 0 2px}
.gr-row{display:grid;grid-template-columns:54px 1fr auto;align-items:center;gap:12px;padding:8px 12px 8px 8px;border:1px solid var(--line,#333);background:rgba(20,22,26,.75);color:#e8e2d0;text-align:left;cursor:pointer}
.gr-row:hover,.gr-row:focus{border-color:#ffd24a;outline:none}.gr-row.on{border-color:#ffd24a;background:rgba(60,48,14,.55)}
.gr-sw{width:54px;height:54px;background-size:cover;border:1px solid rgba(255,255,255,.18);position:relative;display:block}
.gr-row:not(.ok) .gr-sw{filter:grayscale(.85) brightness(.55)}.gr-sw i{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:20px;filter:none}
.gr-t{display:flex;flex-direction:column;gap:3px;min-width:0}.gr-t b{font-size:15px;letter-spacing:.08em}.gr-t small{font-size:11px;color:#aab2b8;letter-spacing:.06em}
.gr-bar{height:5px;background:rgba(255,255,255,.1);display:block}.gr-bar span{display:block;height:100%;background:#ffd24a}
.gr-row.ok .gr-bar span{background:#5adc7a}.gr-row em{font-style:normal;font:700 12px var(--font,system-ui);letter-spacing:.1em;color:#cfd6db;white-space:nowrap}
.gr-row.ok em{color:#5adc7a}.gr-row.eq em{color:#ffd24a}
.gr-row.top.gold{border-left:3px solid #d4a83a}.gr-row.top.diamond{border-left:3px solid #9fd6ff}.gr-row.top.nova{border-left:3px solid #ff5a14}
.lk-gun .gr-badge{position:absolute;right:6px;bottom:6px;font:700 10px var(--font,system-ui);letter-spacing:.12em;padding:2px 6px;background:rgba(0,0,0,.6);color:#cfd6db}
.lk-gun .gr-badge.GOLD{color:#f2c94c}.lk-gun .gr-badge.DIAMOND{color:#9fd6ff}.lk-gun .gr-badge.NOVA{color:#ff7a3a}`;
  document.head.appendChild(st);
})();
