/* ================================================================== HOTBOX HORDE (1.2.98, base and economy 1.2.99): co-op grow, build and defend
   THE HOMESTEAD is your base: an open field (map_homestead.js) where THE MOTHER PLANT stands. Build GROW PLOTS, plant
   seeds, and the plants grow in real time (even when the game is closed). Harvest the buds and sell them to THE BUYER
   for cash. Cash buys seeds, base expansions (each one has to be won in a RAID: waves of THE BURNOUTS at your base),
   upgrades, and WORKBENCH levels. At the WORKBENCH you craft TRAPS (spikes, zappers, sticky resin, puff launchers, chill
   pads) and WEAPONS (schematics with a tier and a number of missions before they break) from what you bring back.
   MISSIONS on other maps get you the materials: DEFEND THE GROW (guard a plant through five waves) and SUPPLY RUN (search
   the caches, then get to the extraction van). WOOD / STONE / METAL are harvested with your melee everywhere and kept;
   SCRAP, WIRE, BATTERIES, NUTRIENTS and TREE SAP come from missions. You play with three crew bots; offline for now.
   The base itself (stations, plots, menus, raids) is in hhbase.js. */
const HH_MAPS = [
  { map: 'greenhouse', n: 'THE GREENHOUSE' }, { map: 'stackyard', n: 'STACKYARD' }, { map: 'dustwater', n: 'DUSTWATER' }, { map: 'ruins_night', n: 'ASH RUINS · NIGHT' },
];
const HH_TYPES = { defend: { n: 'DEFEND THE GROW', d: 'guard a plant through five waves' }, supply: { n: 'SUPPLY RUN', d: 'search the caches, then get to the extraction van' }, wild: { n: 'WILD HARVEST', d: 'cut the wild weed growing out there, then get to the van' } };
const hhRun = k => k === 'supply' || k === 'wild';   // the run-and-extract missions
const hhHunt = k => hhRun(k) || k === 'rescue' || k === 'truck' || k === 'signal' || k === 'nests';   // no MOTHER PLANT (hhmis2.js)
const HH_MISSIONS = []; for (const m of HH_MAPS) for (const t of ['defend', 'supply', 'wild']) HH_MISSIONS.push({ map: m.map, n: m.n, type: t });
const HH_DIFF = [{ n: 'CHILL', hp: 0.7, cnt: 0.8, pay: 1, col: '#7adf6a' }, { n: 'BAKED', hp: 1, cnt: 1, pay: 1.6, col: '#ffd24a' }, { n: 'FRIED', hp: 1.5, cnt: 1.25, pay: 2.4, col: '#ff8a3a' }, { n: 'COOKED', hp: 2.2, cnt: 1.5, pay: 3.5, col: '#ff4a6a' }];
const HH_HEROES = [
  { id: 'builder', n: 'BUILDER', col: '#ffb84a', d: 'builds cost 25% less and have 50% more health' },
  { id: 'gunner', n: 'GUNNER', col: '#ff6a5a', d: '25% more damage to the horde · the ammo crate refills twice as fast' },
  { id: 'scrapper', n: 'SCRAPPER', col: '#7adf6a', d: 'harvests twice as much · melee hits the horde three times as hard' },
  { id: 'medic', n: 'MEDIC', col: '#6ad0ff', d: 'you and your crew heal when close to you · the plant heals between waves' },
];
const HH_UPG = [{ id: 'plant', n: 'MOTHER PLANT HEALTH', d: '+20% a level' }, { id: 'trap', n: 'TRAP DAMAGE', d: '+20% a level' }, { id: 'yield', n: 'HARVEST YIELD', d: '+20% materials and buds a level' }];
const HH_MAT = { wood: { n: 'WOOD', key: 'wood', css: '#d8a868', hp: 150 }, stone: { n: 'STONE', key: 'concrete', css: '#c8c8c8', hp: 300 }, metal: { n: 'METAL', key: 'metal', css: '#8ad0ff', hp: 500 } };
const HH_MATS = ['wood', 'stone', 'metal'];
const HH_CMAT = { scrap: { n: 'SCRAP', css: '#c8a070' }, wire: { n: 'WIRE', css: '#ffb05a' }, battery: { n: 'BATTERIES', css: '#9aff6a' }, nutri: { n: 'NUTRIENTS', css: '#6ad8ff' }, sap: { n: 'TREE SAP', css: '#ffcf4a' } };
const HH_CMATS = Object.keys(HH_CMAT);
const HH_ALLN = k => k === 'cash' ? 'CASH' : (HH_MAT[k] || HH_CMAT[k] || {}).n || k.toUpperCase();
const HH_STRAINS = [
  { id: 'og', n: 'OG KUSH', min: 6, yld: 4, price: 45, seed: 60, col: 0x6ac84a },
  { id: 'haze', n: 'PURPLE HAZE', min: 10, yld: 5, price: 75, seed: 160, col: 0xa060ff },
  { id: 'blue', n: 'BLUE DREAM', min: 14, yld: 6, price: 100, seed: 320, col: 0x5a9aff },
  { id: 'north', n: 'NORTHERN LIGHTS', min: 20, yld: 7, price: 150, seed: 650, col: 0xd8f4ff },
  { id: 'milk', n: "MOTHER'S MILK", min: 30, yld: 8, price: 280, seed: 0, col: 0xffd8ff },   // missions only
];
const HH_STR = id => HH_STRAINS.find(s => s.id === id) || HH_STRAINS[0];
const HH_TRAPS = {
  spikes: { n: 'SPIKE TRAP', cost: { metal: 10, scrap: 2 }, d: 'a floor of spikes · hits everything on it' },
  zapper: { n: 'BUG ZAPPER', cost: { metal: 10, wire: 2, battery: 1 }, d: 'a pole that zaps the nearest burnout in 5 m' },
  resin: { n: 'STICKY RESIN', cost: { wood: 10, sap: 3 }, d: 'a puddle that slows them to a crawl' },
  launcher: { n: 'PUFF LAUNCHER', cost: { wood: 10, scrap: 2, wire: 1 }, d: 'a floor pad that blasts them back the way they came' },
  chill: { n: 'CHILL PAD', cost: { wood: 10, nutri: 2, battery: 1 }, d: 'heals you and your crew standing on it' },
};
const HH_GUNS = [
  { id: 'smg', n: 'SCRAP SMG', cat: 'smg', cost: { metal: 20, scrap: 6 } },
  { id: 'sg', n: 'BARN DOOR SHOTGUN', cat: 'sg', cost: { metal: 15, wood: 20, scrap: 6 } },
  { id: 'ar', n: "GROWER'S RIFLE", cat: 'ar', cost: { metal: 30, scrap: 10, wire: 2 } },
  { id: 'sr', n: 'LONG TOKE SNIPER', cat: 'sr', cost: { metal: 30, scrap: 10, battery: 1 } },
  { id: 'lmg', n: 'HEDGE TRIMMER LMG', cat: 'lmg', cost: { metal: 40, scrap: 14, wire: 2, battery: 2 } },
];
const HH_TIER = [{ n: 'COMMON', css: '#e8e8e8', k: 1 }, { n: 'RARE', css: '#4aa8ff', k: 1.15 }, { n: 'EPIC', css: '#c070ff', k: 1.3 }];
const HH_GUN_DUR = 6;
const HH_BASELV = [{ r: 4, plots: 4, cost: 0 }, { r: 6, plots: 6, cost: 1500 }, { r: 8, plots: 8, cost: 4000 }, { r: 10, plots: 11, cost: 9000 }, { r: 12, plots: 14, cost: 18000 }];
const HH_BENCH = [{ cost: 0 }, { cost: 1200 }, { cost: 3500 }];
const HH_KINDS = {
  burnout: { n: 'BURNOUT', hp: 120, sp: [1.5, 2.0], dmg: 14, bdmg: 24, sc: 1, tint: 0x5a6a4a },
  sprinter: { n: 'SPRINTER', hp: 70, sp: [4.0, 4.6], dmg: 9, bdmg: 12, sc: 0.92, run: 1, tint: 0x6a5a7a },
  smasher: { n: 'SMASHER', hp: 560, sp: [1.1, 1.3], dmg: 30, bdmg: 95, sc: 1.35, tint: 0x4a3a5a },
  spitter: { n: 'SPITTER', hp: 110, sp: [1.6, 1.9], dmg: 12, bdmg: 20, sc: 1, spit: 1, tint: 0x4a7a3a },
  drifter: { n: 'DRIFTER', hp: 60, sp: [2.4, 2.8], dmg: 8, bdmg: 0, sc: 0.85, fly: 1, tint: 0x6a4a9a },
  bloater: { n: 'BLOATER', hp: 180, sp: [1.2, 1.5], dmg: 55, bdmg: 160, sc: 1.15, bloat: 1, tint: 0x8a8a3a },
  boss: { n: 'THE OVERGROWN', hp: 4400, sp: [1.25, 1.35], dmg: 45, bdmg: 220, sc: 1.9, boss: 1, tint: 0x3a5a2a },
};
const HH_WAVES = 5, HH_C = 3, HH_LV = 3;
const HHL = { on: false };
const HH = { build: false, piece: 0, mat: 'wood', ghost: null, gok: false, gspec: null, meIn: false, uH: false, look: null, cur: null, growK: 1, menu: null };

/* ---------- the save: everything you own */
function hhLoad() {
  let s = null; try { s = JSON.parse(localStorage.getItem('ashfall.hh.v1') || 'null'); } catch (e) {}
  const fresh = !s; s = s || {};
  if (typeof s.seeds === 'number') { s.cash = (s.cash | 0) + s.seeds; s.seeds = {}; }   // 1.2.98 saves: SEEDS was the money
  s = Object.assign({ cash: 200, lv: {}, hero: 'builder', mis: 0, diff: 0, unl: {}, games: 0, wins: 0, kills: 0, best: {}, built: 0, sold: 0, grown: 0 }, s);
  s.lv = Object.assign({ plant: 0, trap: 0, yield: 0 }, s.lv);
  s.inv = Object.assign({ wood: 150, stone: 60, metal: 40, scrap: 0, wire: 0, battery: 0, nutri: 2, sap: 0 }, s.inv);
  s.seeds = Object.assign({ og: fresh ? 4 : 0, haze: fresh ? 1 : 0 }, s.seeds); s.buds = Object.assign({}, s.buds);
  s.traps = Object.assign({ spikes: fresh ? 3 : 0, zapper: 0, resin: 0, launcher: 0, chill: 0 }, s.traps);
  s.arsenal = Array.isArray(s.arsenal) ? s.arsenal : []; if (s.eq === undefined) s.eq = -1;
  s.base = Object.assign({ lv: 1, pieces: [], plots: {}, bench: 1 }, s.base);
  return s;
}
function hhSave(s) { try { localStorage.setItem('ashfall.hh.v1', JSON.stringify(s)); } catch (e) {} }
const hhUnl = (s, mi) => Math.max(1, s.unl[mi] | 0);
const hhUpCost = lv => 400 + lv * 400;
const hhGot = (s, k) => k === 'cash' ? s.cash : s.inv[k] | 0;
const hhPay = (s, cost) => { for (const k in cost) if (hhGot(s, k) < cost[k]) return false; for (const k in cost) { if (k === 'cash') s.cash -= cost[k]; else s.inv[k] -= cost[k]; } return true; };
const hhHas = (s, cost) => Object.entries(cost).every(([k, v]) => hhGot(s, k) >= v);
const hhCostTxt = (cost, s) => Object.entries(cost).map(([k, v]) => `<span style="color:${!s || (s.inv[k] | 0) >= v ? 'inherit' : '#ff6a6a'}">${v} ${HH_ALLN(k)}</span>`).join(' · ');
const hhMarket = () => { const d = new Date(), h = Math.imul(d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate(), 2654435761) >>> 0; return 0.85 + (h % 1000) / 1000 * 0.35; };   // today's price (85% to 120%)
const hhGunDef = g => ARMORY.find(d => d.cat === g.cat && CATS[d.cat] && CATS[d.cat].slot === 'primary') || ARM.marc;

/* ---------- the lobby */
function hhOpen() { HHL.on = true; try { BRLOB.on = false; ZL.on = false; } catch (e) {} if (G.state !== 'menu') leaveGame(); hhRender('.cod-go'); showScreen('lobby'); }
function hhOff() { HHL.on = false; const L = $('lobby'); if (L) L.classList.remove('zl', 'hhl'); }
function hhRender(focusSel) {
  const s = hhLoad(), st = careerOf(false), mi = clamp(s.mis | 0, 0, HH_MISSIONS.length - 1), mis = HH_MISSIONS[mi], di = Math.min(s.diff | 0, hhUnl(s, mi)), D = HH_DIFF[di], H = HH_HEROES.find(h => h.id === s.hero) || HH_HEROES[0], b = s.best[mi];
  $('lobKind').textContent = 'HOTBOX HORDE'; $('lobby').classList.add('zl', 'hhl'); $('lobPlayer').innerHTML = playerCard(st); cardBanner($('lobPlayer'));
  const ph = document.querySelector('#lobby .cod-foot .padhint'); if (ph) ph.innerHTML = 'START  THE HOMESTEAD';
  const row = (sm, bb, sp, act, wide, col) => `<div class="cod-row${wide ? ' wide' : ''}"><small>${sm}</small><b${col ? ` style="color:${col}"` : ''}>${bb}</b><span>${sp}</span>${act ? `<div class="arw"><button class="mini" data-act="${act}-" aria-label="Previous">&lsaquo;</button><button class="mini" data-act="${act}+" aria-label="Next">&rsaquo;</button></div>` : ''}</div>`;
  const plots = Object.values(s.base.plots).filter(p => p && p.st), ready = plots.filter(p => hhGrowK(p) >= 1).length;
  const g = s.arsenal[s.eq], gt = g ? HH_TIER[g.tier] : null;
  $('lobSel').innerHTML = `<div class="cod-play"><button class="btn primary lob-go cod-go" data-act="hh-base"><small>YOUR BASE · GROW · SELL · CRAFT · EXPAND</small><b>THE HOMESTEAD</b></button></div>` +
    `<div class="cod-row wide hh-misrow"><small>MISSION ${mi + 1} / ${HH_MISSIONS.length} · ${mis.n}</small><b>${HH_TYPES[mis.type].n}</b><span>${HH_TYPES[mis.type].d}${b ? ` · ${b.won ? 'done on ' + HH_DIFF[b.d].n : 'not done yet'}` : ''}</span><div class="arw"><button class="mini" data-act="hh-mis-" aria-label="Previous">&lsaquo;</button><button class="mini" data-act="hh-mis+" aria-label="Next">&rsaquo;</button><button class="mini hh-launch" data-act="hh-start">LAUNCH ›</button></div></div>` +
    row('DIFFICULTY', D.n, `pays ${Math.round(D.pay * 100)}% · ${HH_DIFF.map((d, i) => i <= hhUnl(s, mi) ? d.n : d.n + ' 🔒').join(' · ')}`, 'hh-dif', false, D.col) +
    row('HERO', H.n, H.d, 'hh-hero', false, H.col) +
    row('WEAPON', g ? `<span style="color:${gt.css}">${gt.n}</span> ${HH_GUNS.find(x => x.id === g.id).n}` : 'YOUR CLASS', g ? `${g.dur} missions left before it breaks · craft more at the WORKBENCH` : 'craft guns at the WORKBENCH in THE HOMESTEAD', 'hh-gun') +
    `<div class="cod-row wide"><small>STORAGE · $${s.cash.toLocaleString()}</small><div class="hh-inv">${[...HH_MATS, ...HH_CMATS].map(k => `<span style="--c:${(HH_MAT[k] || HH_CMAT[k]).css}"><small>${HH_ALLN(k)}</small><b>${s.inv[k] | 0}</b></span>`).join('')}</div><span>SEEDS ${HH_STRAINS.filter(x => s.seeds[x.id]).map(x => `${s.seeds[x.id]} ${x.n}`).join(' · ') || 'none'} · BUDS ${HH_STRAINS.filter(x => s.buds[x.id]).map(x => `${s.buds[x.id]} ${x.n}`).join(' · ') || 'none'} · TRAPS ${Object.keys(HH_TRAPS).filter(k => s.traps[k]).map(k => `${s.traps[k]} ${HH_TRAPS[k].n}`).join(' · ') || 'none'}</span></div>` +
    `<div class="cod-row"><small>THE HOMESTEAD · LEVEL ${s.base.lv}</small><b>${ready ? `<span style="color:#7aff6a">${ready} PLANT${ready > 1 ? 'S' : ''} READY</span>` : plots.length ? `${plots.length} GROWING` : 'NOTHING PLANTED'}</b><span>${s.base.pieces.length} pieces built · workbench level ${s.base.bench}</span></div>` +
    `<div class="cod-row"><small>YOUR HORDE</small><b>${s.wins} MISSIONS DONE · $${(s.sold | 0).toLocaleString()} SOLD</b><span>${s.kills.toLocaleString()} burnouts down · ${s.grown | 0} plants harvested</span></div>`;
  $('lobRoster').innerHTML = `<div class="ros-info"><b>HOTBOX HORDE</b><b style="font-size:12px;color:#c8a0ff">GROW · SELL · BUILD · DEFEND</b>THE HOMESTEAD is your base: build GROW PLOTS round THE MOTHER PLANT, plant seeds and come back when they are ready (they grow in real time, even with the game closed). Harvest the buds and sell them to THE BUYER. Spend the cash on seeds, upgrades and base EXPANSIONS - each one is won in a RAID at your base. Go on MISSIONS for SCRAP, WIRE, BATTERIES, NUTRIENTS and TREE SAP, then craft TRAPS and WEAPONS at the WORKBENCH. Hit anything wooden, stone or metal with your melee for building materials.<br><br><b style="font-size:11px">CONTROLS</b>${actName('build')} build mode · 1-9 pick a piece · ${actName('reload')} material / turn · click place · ${actName('inspect')} pick up and MOVE anything · ${actName('use')} use / remove · ${actName('melee')} harvest</div>`;
  if (focusSel) focusFirst(focusSel);
}
function hhAct(act) {
  if (act === 'hh-play') { sfx.ui(); hhOpen(); return true; }
  if (/^(go-on|go-mp|deploy|play|go-zombies|br-play)$/.test(act)) { if (HHL.on) hhOff(); return false; }
  if (!HHL.on || curScreen !== 'lobby') return false;
  const s = hhLoad(), re = sel => { hhSave(s); sfx.ui(); hhRender(sel); };
  if (act === 'hh-base' || act === 'lob-start') { startMatch('hh', { map: 'homestead', hhKind: 'base' }); return true; }
  if (act === 'hh-start') { const m = HH_MISSIONS[clamp(s.mis | 0, 0, HH_MISSIONS.length - 1)]; startMatch('hh', { map: m.map, hhKind: m.type }); return true; }
  if (act === 'hh-mis-' || act === 'hh-mis+') { s.mis = ((s.mis | 0) + (act.endsWith('+') ? 1 : HH_MISSIONS.length - 1)) % HH_MISSIONS.length; s.diff = Math.min(s.diff | 0, hhUnl(s, s.mis)); re('[data-act="hh-mis+"]'); return true; }
  if (act === 'hh-dif-' || act === 'hh-dif+') { const n = hhUnl(s, s.mis | 0) + 1; s.diff = ((s.diff | 0) + (act.endsWith('+') ? 1 : n - 1)) % n; re('[data-act="hh-dif+"]'); return true; }
  if (act === 'hh-hero-' || act === 'hh-hero+') { const i = Math.max(0, HH_HEROES.findIndex(h => h.id === s.hero)); s.hero = HH_HEROES[(i + (act.endsWith('+') ? 1 : HH_HEROES.length - 1)) % HH_HEROES.length].id; re('[data-act="hh-hero+"]'); return true; }
  if (act === 'hh-gun-' || act === 'hh-gun+') { const n = s.arsenal.length + 1; s.eq = (((s.eq | 0) + 1 + (act.endsWith('+') ? 1 : n - 1)) % n) - 1; re('[data-act="hh-gun+"]'); return true; }
  if (act === 'lobby-back') { hhOff(); showScreen('menu'); return true; }
  if (act === 'playlist' || act === 'streaks' || act === 'custom' || act === 'map-' || act === 'map+' || act === 'mode-' || act === 'mode+') return true;
  return false;
}
const _hhTiles = featTiles;
featTiles = function () {
  _hhTiles.apply(this, arguments);
  const row = document.querySelector('#menu .cod-tiles'), br = $('brTile'); if (!row) return;
  let t = $('hhTile'); if (!t) { t = document.createElement('button'); t.id = 'hhTile'; t.className = 'cod-tile hh-tile'; t.dataset.act = 'hh-play'; row.insertBefore(t, br ? br.nextSibling : null); }
  t.innerHTML = '<small>NEW · CO-OP · GROW, BUILD AND DEFEND</small><b>HOTBOX HORDE</b><span>YOUR OWN BASE · GROW AND SELL · CRAFT TRAPS AND GUNS · MISSIONS</span>';
};

/* ---------- meshes */
const hhStd = o => new THREE.MeshStandardMaterial(o);
function hhLeaf(mat, len) {
  const g = new THREE.Group();
  [[0, 1], [0.38, 0.85], [-0.38, 0.85], [0.75, 0.62], [-0.75, 0.62], [1.1, 0.38], [-1.1, 0.38]].forEach(([a, k]) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.16 * len, len * k, 4), mat); f.scale.z = 0.12; f.rotation.x = Math.PI / 2; f.position.z = len * k / 2; const p = new THREE.Group(); p.rotation.y = a; p.add(f); g.add(p); });
  return g;
}
const HH_PM = {};
function hhPlantMats() { if (HH_PM.leaf) return HH_PM; HH_PM.leaf = hhStd({ color: 0x3f9a3a, roughness: 0.6, emissive: 0x0a2a08, side: THREE.DoubleSide }); HH_PM.stalk = hhStd({ color: 0x3a6a2a, roughness: 0.8 }); HH_PM.pot = hhStd({ color: 0x9a4a2a, roughness: 0.9 }); HH_PM.soil = hhStd({ color: 0x2a1a10, roughness: 1 }); return HH_PM; }
// a weed plant: n leaves up a stalk, buds in the strain's colour (the MOTHER PLANT is a big one)
function hhWeed(n, size, col) {
  const M0 = hhPlantMats(), g = new THREE.Group(), bud = hhStd({ color: col, emissive: col, emissiveIntensity: 0.25, roughness: 0.5 }), buds = [];
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * size, 0.07 * size, 2.6 * size, 7), M0.stalk); st.position.y = 1.3 * size; g.add(st);
  for (let i = 0; i < n; i++) { const h = (0.25 + i / n * 2.25) * size, a = i * 2.4, L = hhLeaf(M0.leaf, (1.0 - i / n * 0.55) * size); L.position.set(0, h, 0); L.rotation.order = 'YXZ'; L.rotation.set(0.18 - i / n * 0.5, -a + Math.PI / 2, 0); g.add(L);
    if (i % 3 === 0 && i > n * 0.3) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1 * size, 8, 6), bud); b.scale.y = 1.6; b.position.set(Math.cos(a) * 0.1 * size, h + 0.06 * size, Math.sin(a) * 0.1 * size); g.add(b); buds.push(b); } }
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.17 * size, 10, 8), bud); top.scale.y = 1.9; top.position.y = 2.75 * size; g.add(top); buds.push(top);
  g.userData.buds = buds; g.userData.bud = bud; return g;
}
function hhPlantMesh() {
  const M0 = hhPlantMats(), g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.95, 1.1, 18), M0.pot); p.position.y = 0.55; g.add(p);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.06, 18), M0.soil); s.position.y = 1.08; g.add(s);
  const w = hhWeed(36, 1.45, 0xb070ff); w.position.y = 1.1; w.userData.bud.emissiveIntensity = 1.4; g.add(w); g.userData.buds = w.userData.buds;
  const fr = hhStd({ color: 0x222222, metalness: 0.6, roughness: 0.4 });
  for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.6, 6), fr); l.position.set(x, 2.8, z); g.add(l); }
  const pan = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 2.8), fr); pan.position.y = 5.6; g.add(pan);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), new THREE.MeshBasicMaterial({ color: 0xff7ad8 })); glow.rotation.x = Math.PI / 2; glow.position.y = 5.53; g.add(glow);
  const lt = new THREE.PointLight(0xd070ff, 1.3, 14, 2); lt.position.y = 5.2; g.add(lt); g.userData.light = lt;
  return g;
}
function hhRiftMesh() {
  const g = new THREE.Group(), ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.14, 8, 28), new THREE.MeshBasicMaterial({ color: 0xa040ff }));
  ring.position.y = 1.9; g.add(ring); g.userData.ring = ring;
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0x8a30ff, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.8, depthWrite: false })); core.scale.setScalar(3.4); core.position.y = 1.9; g.add(core); g.userData.core = core;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.4, 14, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0x9a3aff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 7; g.add(beam);
  return g;
}
function hhNodeMesh(k) {
  const g = new THREE.Group();
  if (k === 'wood') { const m = hhStd({ color: 0x8a6a42, roughness: 0.9 }), d = hhStd({ color: 0x5a4028, roughness: 0.9 }); for (let i = 0; i < 4; i++) { const y = 0.08 + i * 0.17; const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 1.0), m); top.position.y = y + 0.06; top.rotation.y = (i % 2) * 0.08; g.add(top); for (const z of [-0.42, 0, 0.42]) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.09, 0.1), d); b.position.set(0, y, z); g.add(b); } } }
  else if (k === 'stone') { const m = hhStd({ color: 0x7a7a76, roughness: 0.95, flatShading: true }); [[0, 0.45, 0, 0.55], [0.5, 0.3, 0.2, 0.38], [-0.35, 0.28, 0.35, 0.32], [0.1, 0.25, -0.45, 0.3]].forEach(([x, y, z, r]) => { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), m); s.position.set(x, y, z); s.rotation.set(x * 7, z * 5, 0); g.add(s); }); }
  else { const rust = hhStd({ color: 0x7a4a2a, roughness: 0.8, metalness: 0.5 }), st = hhStd({ color: 0x6a7078, roughness: 0.5, metalness: 0.8 }); const a = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.7), rust); a.position.y = 0.25; a.rotation.y = 0.3; g.add(a); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.85, 12), st); b.position.set(0.55, 0.42, 0.35); g.add(b); const c = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.6), st); c.position.set(-0.2, 0.62, -0.1); c.rotation.set(0.3, 0.5, 0.2); g.add(c); const t = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 6, 12), hhStd({ color: 0x151515, roughness: 0.95 })); t.position.set(-0.6, 0.3, 0.4); t.rotation.y = 1.2; g.add(t); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
// the van (THE BUYER, the extraction van)
function hhVanMesh(col) {
  const g = new THREE.Group(), paint = hhStd({ color: col, roughness: 0.45, metalness: 0.3 }), dark = hhStd({ color: 0x151518, roughness: 0.6 }), glass = hhStd({ color: 0x223344, roughness: 0.1, metalness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.0, 4.4), paint); body.position.y = 1.35; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.3, 1.2), paint); cab.position.set(0, 1.0, -2.75); g.add(cab);
  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.05), glass); ws.position.set(0, 1.35, -3.36); ws.rotation.x = -0.25; g.add(ws);
  for (const [x, z] of [[-0.95, -2.6], [0.95, -2.6], [-0.95, 1.4], [0.95, 1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14), dark); w.rotation.z = Math.PI / 2; w.position.set(x, 0.42, z); g.add(w); }
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.18, 4.2), hhStd({ color: 0x111111, emissive: 0x7aff6a, emissiveIntensity: 1.2 })); stripe.position.set(0, 1.5, 0); g.add(stripe);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ---------- a match: the base, a mission or a raid */
function hhSpot() {
  let best = openNear(0, 0), bs = -1e9;
  for (let r = 0; r <= 33; r += 3) for (let k = 0; k < (r ? 12 : 1); k++) {
    const a = k / 12 * TAU, o = openNear(Math.cos(a) * r, Math.sin(a) * r), y = groundAt(o.x, o.z, 0.6); if (Math.abs(groundAt(o.x, o.z, 40) - y) > 0.3) continue;
    let open = 0; for (let j = 0; j < 16; j++) { const b = j / 16 * TAU; if (gridClear(o.x, o.z, o.x + Math.cos(b) * 6, o.z + Math.sin(b) * 6, y, y)) open++; }
    const sc = open * 3 - r * 0.25; if (sc > bs) { bs = sc; best = o; }
  }
  return best;
}
function hhSetup() {
  hhClear(); const s = hhLoad(), kind = (M.cfg && M.cfg.hhKind) || (curMap === 'homestead' ? 'base' : HH.lastKind && HH.lastKind !== 'base' ? HH.lastKind : 'defend'), base = kind === 'base'; HH.lastKind = kind;
  const mi = base ? -1 : HH_MISSIONS.findIndex(m => m.map === curMap && m.type === kind), di = base ? Math.min(3, s.base.lv - 1) : Math.min(s.diff | 0, hhUnl(s, Math.max(0, mi)));
  const c = base ? { x: 0, z: 0 } : hhSpot(), by = groundAt(c.x, c.z, 0.6), grp = new THREE.Group(); scene.add(grp);
  const H = M.hh = HH.cur = { grp, kind, base, mi, di, D: HH_DIFF[di], hero: s.hero, lv: s.lv, s, mats: s.inv, wave: 0, waves: HH_WAVES, phase: base ? 'free' : hhHunt(kind) ? 'run' : 'prep', t: base ? 0 : 90, toSpawn: 0, spawnT: 0, mobs: [], pieces: [], slots: new Map(), res: new Set(), traps: [], nodes: [], spits: [], rifts: [], sboxes: [], kills: 0, built: 0, crateT: 0, placed: false, over: false, wavesWon: 0, found: 0, by, org: { x: c.x, z: c.z, y: by }, got: {} };
  const pmax = Math.round(1500 * (1 + 0.2 * (s.lv.plant | 0)));
  if (base) { H.pmax = pmax; hhBaseSetup(H); }   // the plant, the crate, the stations and plots are props you place (hhbase.js)
  if (!hhHunt(kind) && !base) { H.plant = { x: c.x, z: c.z, y: by, hp: pmax, max: pmax, g: hhPlantMesh(), hitT: 0 }; H.plant.g.position.set(c.x, by, c.z); grp.add(H.plant.g); H.plantBox = mkBox(c.x, c.z, 2.4, 2.4, 1.1, { y: by }); boxes.push(H.plantBox); H.res.add('0,0'); }
  const g = s.arsenal[s.eq]; if (g && !base) { H.gun = g; H.gunId = hhGunDef(HH_GUNS.find(x => x.id === g.id)).id; }
  if (!hhHunt(kind) && !base) { const cr = openNear(c.x + 4.6, c.z + 1.5); H.crate = { x: cr.x, z: cr.z, y: groundAt(cr.x, cr.z, by + 0.6) };
    const cg = new THREE.Group(), m = hhStd({ color: 0x3a4a2a, roughness: 0.8 }), st = hhStd({ color: 0x111111, emissive: 0x7aff6a, emissiveIntensity: 1.4 }); const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.8), m); b.position.y = 0.35; cg.add(b); const s1 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.82), st); s1.position.y = 0.55; cg.add(s1); cg.position.set(H.crate.x, H.crate.y, H.crate.z); grp.add(cg); H.crate.g = cg; }
  try { H.field = H.plant ? flowField(H.plant.x, H.plant.z, H.plant.y) : null; } catch (e) { H.field = null; }
  const reach = (x, z, y) => { if (!H.field) return true; const n = nodeOf(x, z, y); return n >= 0 && H.field[n] >= 0; };
  const cand = [], pr = PLAYRECT, dmin = base ? 32 : 22, dmax = base ? 46 : 60;
  for (let i = 0; i < 200; i++) { const o = openNear(rnd(pr[0] + 3, pr[1] - 3), rnd(pr[2] + 3, pr[3] - 3)), y = groundAt(o.x, o.z, 0.6), d = Math.hypot(o.x - c.x, o.z - c.z); if (d < dmin || d > dmax || !reach(o.x, o.z, y)) continue; cand.push({ x: o.x, z: o.z, y, a: Math.atan2(o.z - c.z, o.x - c.x), d }); }
  const a0 = Math.random() * TAU;
  for (let k = 0; k < 3; k++) { const want = a0 + k * TAU / 3; let best = null, bs = 1e9; for (const q of cand) { const da = Math.abs(Math.atan2(Math.sin(q.a - want), Math.cos(q.a - want))), sc = da * 30 - q.d * 0.2; if (sc < bs && !H.rifts.some(r => Math.hypot(r.x - q.x, r.z - q.z) < 14)) { bs = sc; best = q; } } if (best) { const rg = hhRiftMesh(); rg.position.set(best.x, best.y, best.z); grp.add(rg); rg.visible = !base; H.rifts.push(Object.assign(best, { g: rg })); } }
  if (!H.rifts.length) { const o = openNear(c.x + 30, c.z); const rg = hhRiftMesh(); rg.position.set(o.x, 0, o.z); grp.add(rg); H.rifts.push({ x: o.x, z: o.z, y: 0, g: rg }); }
  const nN = base ? 26 : 30, rmin = base ? 16 : 7;
  for (let i = 0; i < 400 && H.nodes.length < nN; i++) { const o = openNear(c.x + rnd(-45, 45), c.z + rnd(-45, 45)), d = Math.hypot(o.x - c.x, o.z - c.z); if (d < rmin || d > 50 || o.x < pr[0] + 2 || o.x > pr[1] - 2 || o.z < pr[2] + 2 || o.z > pr[3] - 2) continue; if (H.nodes.some(n => Math.hypot(n.x - o.x, n.z - o.z) < 4.5) || H.rifts.some(r => Math.hypot(r.x - o.x, r.z - o.z) < 5)) continue;
    const k = HH_MATS[H.nodes.length % 3], y = groundAt(o.x, o.z, 0.6), ng = hhNodeMesh(k); ng.position.set(o.x, y, o.z); ng.rotation.y = Math.random() * TAU; grp.add(ng); H.nodes.push({ k, x: o.x, z: o.z, y, g: ng, hp: 6, max: 6 }); }
  if (hhRun(kind)) hhSupplySetup(H);
  const gm = new THREE.MeshBasicMaterial({ color: 0x5aff8a, transparent: true, opacity: 0.32, depthWrite: false }); HH.ghost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), gm); HH.ghost.visible = false; HH.ghost.renderOrder = 5; scene.add(HH.ghost);
  HH.ghost.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xbaffd0 })));
  HH.build = false; HH.meIn = false; HH.piece = 0; HH.mat = 'wood';
  hhDom(true); try { rebuildBoxGrid(); } catch (e) {}
}
function hhClear() {
  const H = HH.cur; hhBuildMode(false); try { hhMenuClose(); } catch (e) {}
  if (HH.ghost) { scene.remove(HH.ghost); HH.ghost = null; }
  if (H) {
    if (H.base) hhSave(H.s);
    if (H.grp.parent) H.grp.parent.remove(H.grp);
    for (const p of H.pieces) hhPieceRemove(p, true);
    for (const e of H.mobs) { const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); scene.remove(e.group); }
    for (const sp of H.spits) scene.remove(sp.s);
    for (const b of [H.plantBox, ...H.sboxes, ...(H.props || []).map(p => p.box)]) { const i = boxes.indexOf(b); if (i >= 0) boxes.splice(i, 1); } try { rebuildBoxGrid(); } catch (e) {}
    HH.cur = null; if (M && M.hh === H) M.hh = null;
  }
  hhDom(false);
}
function hhDom(on) {
  for (const id of ['hhBar', 'hhMats']) { const o = $(id); if (o) o.remove(); }
  if (!on) return;
  const b = document.createElement('div'); b.id = 'hhBar'; b.innerHTML = '<small></small><div class="hh-bt"><i></i></div><span></span>'; ($('hud') || document.body).appendChild(b);
  const m = document.createElement('div'); m.id = 'hhMats'; ($('hud') || document.body).appendChild(m);
}
function hhDomTick() {
  const H = M.hh, b = $('hhBar'), m = $('hhMats'); if (!b || !m) return;
  const showBar = H.plant && (!H.base || H.phase !== 'free'); b.style.display = showBar || hhRun(H.kind) ? '' : 'none';
  if (hhRun(H.kind)) { b.querySelector('small').textContent = HH_TYPES[H.kind].n; b.querySelector('i').style.width = (H.found / 8 * 100).toFixed(1) + '%'; b.querySelector('i').style.background = '#ffb84a'; b.querySelector('span').textContent = H.phase === 'extract' ? `GET TO THE EXTRACTION VAN · ${Math.ceil(H.t)} s LEFT` : `${H.kind === 'wild' ? 'PLANTS CUT' : 'CACHES SEARCHED'} ${H.found} / 8 (6 call the van) · ${fmtT(H.t)} LEFT`; }
  else if (H.plant) { b.querySelector('small').textContent = 'THE MOTHER PLANT'; const k = clamp(H.plant.hp / H.plant.max, 0, 1); b.querySelector('i').style.width = (k * 100).toFixed(1) + '%'; b.querySelector('i').style.background = k > 0.5 ? '#7adf6a' : k > 0.25 ? '#ffd24a' : '#ff4a4a'; b.classList.toggle('hit', NOW - H.plant.hitT < 0.3);
    b.querySelector('span').textContent = H.phase === 'prep' ? `${H.raid ? 'RAID · ' : ''}WAVE ${H.wave + 1} OF ${H.waves} IN ${Math.ceil(H.t)} s · BUILD!` : H.phase === 'wave' ? `${H.raid ? 'RAID · ' : ''}WAVE ${H.wave} OF ${H.waves} · ${H.mobs.length + H.toSpawn} BURNOUTS LEFT` : ''; }
  const L = hhPieceList(), P0 = L[HH.piece] || L[0], cost = hhCost(P0), inv = H.s.inv;
  const key = [...HH_MATS, ...HH_CMATS].map(k => inv[k] | 0).join() + HH.build + HH.piece + (HH.cat | 0) + HH.mat + (HH.carry ? 1 : 0) + H.s.cash + JSON.stringify(H.s.traps);
  if (m._k === key) return; m._k = key;
  m.innerHTML = `<div class="hh-mrow">${H.base ? `<span style="--c:#7aff8a"><small>CASH</small><b>$${H.s.cash.toLocaleString()}</b></span>` : ''}${HH_MATS.map(k2 => `<span class="${HH.build && HH.mat === k2 && !P0.trap && !P0.prop ? 'on' : ''}" style="--c:${HH_MAT[k2].css}"><small>${HH_MAT[k2].n}</small><b>${inv[k2] | 0}</b></span>`).join('')}</div>` +
    `<div class="hh-crow">${HH_CMATS.map(k2 => `<span style="color:${HH_CMAT[k2].css}">${HH_CMAT[k2].n} <b>${inv[k2] | 0}</b></span>`).join('')}</div>` +
    (HH.build ? `${M.hh.base ? `<div class="hh-cat">${HH_CATN.map((n, i) => `<span class="${i === (HH.cat | 0) % 3 ? 'on' : ''}">${n}</span>`).join('')}<small>${actName('swap')} SWITCH · ${actName('grenade')} REPAIR / UPGRADE</small></div>` : `<div class="hh-cat"><small>${actName('grenade')} REPAIR / UPGRADE</small></div>`}<div class="hh-prow">${L.map((p, i) => `<span class="${i === HH.piece ? 'on' : ''}${p.trap && !(H.s.traps[p.id] > 0) ? ' off' : ''}"><small>${i + 1}${p.trap ? ' · ' + (H.s.traps[p.id] | 0) : ''}</small>${p.n}</span>`).join('')}</div><div class="hh-cost">${P0.n} · ${P0.trap ? `${H.s.traps[P0.id] | 0} CRAFTED (WORKBENCH)` : Object.entries(cost).map(([k2, v]) => k2 === 'cash' ? `$${v}` : `${v} ${HH_ALLN(k2)}`).join(' + ')}${HH.carry ? ` · CARRYING · ${actName('reload')} TURN · ${actName('inspect')} PUT BACK` : P0.trap ? '' : P0.prop ? ` · ${actName('reload')} TURN` : ` · ${actName('reload')} MATERIAL`} · CLICK PLACE · ${actName('inspect')} MOVE · ${actName('use')} REMOVE · ${actName('build')} EXIT</div>` : `<div class="hh-tip">${actName('build')} BUILD MODE · ${actName('melee')} HARVEST</div>`);
}

/* ---------- the build grid */
function hhPieceList() {
  const base = M.hh && M.hh.base, cat = base ? (HH.cat | 0) % 3 : 0;
  if (cat === 1) return HH_GROWP.map(id => ({ id, n: HH_PROPS[id].n, prop: 1, cost: HH_PROPS[id].cost }));
  if (cat === 2) return HH_DECOR.map(id => ({ id, n: HH_PROPS[id].n, prop: 1, cost: HH_PROPS[id].cost }));
  const L = [{ id: 'wall', n: 'WALL', cost: 10 }, { id: 'floor', n: 'FLOOR', cost: 10 }, { id: 'ramp', n: 'STAIRS', cost: 10 }];
  for (const k in HH_TRAPS) L.push({ id: k, n: HH_TRAPS[k].n, trap: 1 });
  return L;
}
const HH_CATN = ['BUILD', 'GROW', 'DECOR'];
function hhCost(p) { if (p.trap) return {}; const H = M.hh, k = H && H.hero === 'builder' ? 0.75 : 1, c = typeof p.cost === 'number' ? { [HH.mat]: p.cost } : p.cost, o = {}; for (const m in c) o[m] = m === 'cash' ? c[m] : Math.max(1, Math.round(c[m] * k)); return o; }
const hhCan = p => p.trap ? (M.hh.s.traps[p.id] | 0) > 0 : hhHas(M.hh.s, hhCost(p));
const hhCellPos = (ix, iz) => ({ x: M.hh.org.x + ix * HH_C, z: M.hh.org.z + iz * HH_C });
// a piece's box from its record (the same for a ghost, a placed piece and a piece loaded from the save)
function hhSpec(id, ix, iz, lv, dir, up) {
  const H = M.hh, base = H.by + lv * HH_LV, c = hhCellPos(ix, iz);
  if (id === 'half' || id === 'rail' || id === 'barricade') { const ex = [0, 1, 0, -1][dir], ez = [-1, 0, 1, 0][dir], t = id === 'rail' ? 0.1 : 0.25; return { id, ix, iz, lv, dir, key: `w${ix},${iz},${lv},${dir}|w${ix + ex},${iz + ez},${lv},${(dir + 2) % 4}`, cx: c.x + ex * HH_C / 2, cz: c.z + ez * HH_C / 2, w: ex ? t : HH_C, d: ex ? HH_C : t, y: base, h: id === 'rail' ? 1.0 : id === 'barricade' ? 2.0 : 1.5, trap: id === 'barricade' ? 0 : undefined }; }
  if (id === 'roof') return { id, ix, iz, lv, dir, key: `c${ix},${iz},${lv}`, cx: c.x, cz: c.z, w: HH_C, d: HH_C, y: base, h: HH_LV };
  if (id === 'wall') { const ex = [0, 1, 0, -1][dir], ez = [-1, 0, 1, 0][dir]; return { id, ix, iz, lv, dir, key: `w${ix},${iz},${lv},${dir}|w${ix + ex},${iz + ez},${lv},${(dir + 2) % 4}`, cx: c.x + ex * HH_C / 2, cz: c.z + ez * HH_C / 2, w: ex ? 0.25 : HH_C, d: ex ? HH_C : 0.25, y: base, h: HH_LV }; }
  if (id === 'floor') { const top = base + (up ? HH_LV : 0); return { id, ix, iz, lv, up, key: `f${ix},${iz},${lv + (up ? 1 : 0)}`, cx: c.x, cz: c.z, w: HH_C, d: HH_C, y: top - 0.25, h: 0.25, bad: top - H.by < 1 }; }
  if (id === 'ramp') return { id, ix, iz, lv, dir, key: `c${ix},${iz},${lv}`, cx: c.x, cz: c.z, w: HH_C, d: HH_C, y: base, h: HH_LV };
  if (id === 'plot') return { id, ix, iz, lv: 0, key: `c${ix},${iz},0`, cx: c.x, cz: c.z, w: 2.6, d: 2.6, y: H.by, h: 0.45, bad: lv > 0 };
  return { id, ix, iz, lv, key: `c${ix},${iz},${lv}`, cx: c.x, cz: c.z, w: HH_C - 0.2, d: HH_C - 0.2, y: lv ? base : groundAt(c.x, c.z, base + 0.6), h: id === 'zapper' ? 2.2 : 0.15, trap: 1 };
}
function hhAim() {
  const H = M.hh, L = hhPieceList(), P0 = L[HH.piece] || L[0], fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), o = H.org;
  if (HH.carry && HH.carry.pr) return hhPropAim(HH.carry.pr.k, HH.carry.r);
  if (!HH.carry && P0.prop) return hhPropAim(P0.id, HH.rot | 0);
  const pid = HH.carry && HH.carry.rec ? HH.carry.rec.id : P0.id;
  const fl = Math.max(0, Math.round(((P.y || 0) - H.by) / HH_LV)), dir = Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 1 : 3) : (fz > 0 ? 2 : 0), cellOf = (x, z) => [Math.round((x - o.x) / HH_C), Math.round((z - o.z) / HH_C)];
  if (pid === 'wall' || pid === 'half' || pid === 'rail' || pid === 'barricade') { const [ix, iz] = cellOf(P.x, P.z); return hhSpec(pid, ix, iz, fl, dir); }
  const [ix, iz] = cellOf(P.x + fx * 2.6, P.z + fz * 2.6);
  return hhSpec(pid, ix, iz, fl, dir, P.pitch > 0.3);
}
function hhValid(a) {
  const H = M.hh; if (a.prop) return hhPropValid(a); if (a.bad) return false; if (H.pieces.length >= 220) return false;
  if (H.base && hhPropHit(a)) return false;   // not through the plant, the stations, the plots
  if (a.key.split('|').some(k => H.slots.has(k))) return false;
  if (a.id !== 'wall' && a.lv === 0 && H.res.has(`${a.ix},${a.iz}`)) return false;   // the plant, the stations
  if (H.base) { const R = HH_BASELV[H.s.base.lv - 1].r; if (Math.max(Math.abs(a.ix), Math.abs(a.iz)) > R) return false; if (a.id === 'plot' && H.pieces.filter(p => p.id === 'plot').length >= HH_BASELV[H.s.base.lv - 1].plots) return false; }
  const minx = a.cx - a.w / 2, maxx = a.cx + a.w / 2, minz = a.cz - a.d / 2, maxz = a.cz + a.d / 2;
  if (!a.trap && P.x > minx - 0.35 && P.x < maxx + 0.35 && P.z > minz - 0.35 && P.z < maxz + 0.35 && (P.y || 0) < a.y + a.h - 0.3 && (P.y || 0) + 1.7 > a.y + 0.05) return false;
  if (a.cx < PLAYRECT[0] || a.cx > PLAYRECT[1] || a.cz < PLAYRECT[2] || a.cz > PLAYRECT[3]) return false;
  return true;
}
function hhGhostTick() {
  const g = HH.ghost; if (!g) return; if (!HH.build || !playerAlive()) { g.visible = false; return; }
  const a = hhAim(), L = hhPieceList(); HH.gspec = a; HH.gok = hhValid(a) && (HH.carry ? true : hhCan(L[HH.piece] || L[0]));
  if (HH.carry && HH.carry.pr) { const g0 = HH.carry.pr.g; g0.position.set(a.cx, a.y, a.cz); g0.rotation.y = a.r * Math.PI / 2; }
  g.visible = true; g.material.color.setHex(HH.gok ? 0x5aff8a : 0xff4a4a); g.scale.set(a.w, Math.max(a.h, 0.1), a.d); g.position.set(a.cx, a.y + a.h / 2, a.cz); g.rotation.set(0, 0, 0);
  if (a.id === 'ramp' || a.id === 'roof') { const Lr = Math.hypot(HH_C, HH_LV); g.scale.set(a.dir % 2 ? Lr : HH_C, 0.2, a.dir % 2 ? HH_C : Lr); const t = Math.atan2(HH_LV, HH_C); if (a.dir === 0) g.rotation.x = t; else if (a.dir === 2) g.rotation.x = -t; else if (a.dir === 1) g.rotation.z = t; else g.rotation.z = -t; }
  HH.look = hhLookPiece();
  if (M.hh.base) { const R = HH_BASELV[M.hh.s.base.lv - 1].r; if (Math.max(Math.abs(a.ix), Math.abs(a.iz)) > R) showMsgOnce('OUTSIDE YOUR BASE · EXPAND IT AT THE PLANS BOARD'); }
}
function hhLookPiece() {
  const H = M.hh, ray = new THREE.Raycaster(); ray.set(camera.position, new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)); ray.far = 6;
  const ms = []; for (const p of H.pieces) for (const m of p.meshes) ms.push(m); if (H.props) for (const pr of H.props) if (!HH.carry || HH.carry.pr !== pr) pr.g.traverse(o => { if (o.isMesh) { o.userData.hhProp = pr; ms.push(o); } });
  const hit = ray.intersectObjects(ms, false)[0]; if (!hit) return null;
  if (hit.object.userData.hhProp) return { prop: hit.object.userData.hhProp };
  return H.pieces.find(p => p.meshes.includes(hit.object)) || null;
}
function hhPlace() {
  const H = M.hh, L = hhPieceList(), P0 = L[HH.piece] || L[0], a = hhAim(); HH.gspec = a; HH.gok = hhValid(a) && (HH.carry ? true : hhCan(P0));
  if (HH.carry) { if (!HH.gok) { try { showMsg("CAN'T PUT IT THERE"); tone(160, 0.08, 0.05, 'square'); } catch (e) {} return null; } return hhCarryDrop(a); }
  if (a.prop && HH.gok) { hhPay(H.s, hhCost(P0)); return hhPropNew(a); }
  if (!HH.gok) { try { showMsg(!hhCan(P0) ? (P0.trap ? `NO ${P0.n}S · CRAFT THEM AT THE WORKBENCH` : 'NOT ENOUGH MATERIALS · HARVEST WITH ' + actName('melee')) : "CAN'T BUILD THERE"); tone(160, 0.08, 0.05, 'square'); } catch (e) {} return null; }
  if (P0.trap) H.s.traps[P0.id]--; else hhPay(H.s, hhCost(P0));
  const p = hhPieceMake({ id: a.id, ix: a.ix, iz: a.iz, lv: a.lv, dir: a.dir, up: a.up, mat: a.id === 'barricade' ? 'wood' : P0.trap ? null : P0.fixed ? 'wood' : HH.mat });
  if (H.base) { H.s.base.pieces.push(p.rec); hhSave(H.s); }
  H.built++; H.s.built = (H.s.built | 0) + 1;
  try { burst(0.08, 900, 0.12, 'lowpass'); tone(p.mat === 'metal' ? 520 : p.mat === 'stone' ? 220 : 330, 0.06, 0.05, 'triangle'); } catch (e) {}
  return p;
}
// build a piece from its record (placing, or loading the base)
function hhPieceMake(rec, quiet) {
  const H = M.hh, a = hhSpec(rec.id, rec.ix, rec.iz, rec.lv, rec.dir, rec.up), mx = rec.mat ? HH_MAT[rec.mat] : null, hpK = H.hero === 'builder' ? 1.5 : 1;
  const p = Object.assign({}, a, { rec, mat: rec.mat, hp: (mx ? mx.hp : 1) * hpK, max: (mx ? mx.hp : 1) * hpK, meshes: [], boxes: [], t: quiet ? 1 : 0, uses: a.id === 'spikes' ? 50 : a.id === 'zapper' ? 40 : a.id === 'launcher' ? 30 : 1e9, cd: 0 });
  const add = (cx, cz, w, d, h, y, o) => { const n = boxes.length, m = addBox(cx, cz, w, d, h, mx.key, Object.assign({ y }, o || {})); m.material = m.material.clone(); p.meshes.push(m); if (boxes.length > n) p.boxes.push(boxes[boxes.length - 1]); return m; };
  if (a.id === 'wall' && rec.v) hhWallParts(a, rec.v, add);   // a doorway or a window (hhbuild2.js)
  else if (a.id === 'wall' || a.id === 'floor' || a.id === 'half' || a.id === 'rail' || a.id === 'barricade') add(a.cx, a.cz, a.w, a.d, a.h, a.y);
  else if (a.id === 'roof') { const N = 10; for (let k = 0; k < N; k++) { const f = (k + 0.5) / N - 0.5, sx = [0, 1, 0, -1][a.dir], sz = [-1, 0, 1, 0][a.dir]; add(a.cx + sx * f * HH_C, a.cz + sz * f * HH_C, sx ? HH_C / N : HH_C, sz ? HH_C / N : HH_C, 0.22, a.y + (k + 1) * HH_LV / N - 0.22, { stair: ['n', 'e', 's', 'w'][a.dir] }); } }
  else if (a.id === 'ramp') { const N = 10, st = ['n', 'e', 's', 'w'][a.dir]; for (let k = 0; k < N; k++) { const f = (k + 0.5) / N - 0.5, sx = [0, 1, 0, -1][a.dir], sz = [-1, 0, 1, 0][a.dir]; add(a.cx + sx * f * HH_C, a.cz + sz * f * HH_C, sx ? HH_C / N : HH_C, sz ? HH_C / N : HH_C, (k + 1) * HH_LV / N, a.y, { stair: st }); } }
  else if (a.id === 'plot') { add(a.cx, a.cz, a.w, a.d, a.h, a.y); const soil = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.04, 2.3), hhPlantMats().soil); soil.position.set(a.cx, a.y + a.h + 0.01, a.cz); H.grp.add(soil); p.meshes.push(soil); p.plot = { soil }; }
  else hhTrapMesh(p);
  if (!quiet) for (const m of p.meshes) { m.userData.hhY = m.scale.y; m.scale.y = 0.05; }
  H.pieces.push(p); for (const k of a.key.split('|')) H.slots.set(k, p); if (a.trap) H.traps.push(p);
  if (!quiet) try { rebuildBoxGrid(); } catch (e) {}
  return p;
}
function hhTrapMesh(p) {
  const H = M.hh, g = new THREE.Group(); g.position.set(p.cx, p.y, p.cz); H.grp.add(g); p.g = g;
  if (p.id === 'spikes') { const base = new THREE.Mesh(new THREE.BoxGeometry(HH_C - 0.3, 0.06, HH_C - 0.3), hhStd({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.5 })); base.position.y = 0.03; g.add(base); const sm = hhStd({ color: 0xb8b8c0, metalness: 0.9, roughness: 0.3 }), cone = new THREE.ConeGeometry(0.07, 0.3, 5); for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const s = new THREE.Mesh(cone, sm); s.position.set(-1.1 + i * 0.55, 0.18, -1.1 + j * 0.55); s.userData.spike = 1; g.add(s); } }
  else if (p.id === 'zapper') { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.8, 8), hhStd({ color: 0x333333, metalness: 0.6, roughness: 0.4 })); pole.position.y = 0.9; g.add(pole); const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.55, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0x113355, emissive: 0x3a9aff, emissiveIntensity: 2, wireframe: true })); cage.position.y = 1.95; g.add(cage); const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: 0x9ad8ff })); core.position.y = 1.95; g.add(core); p.core = core; }
  else if (p.id === 'resin') { const pud = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.04, 20), hhStd({ color: 0xc87a1a, emissive: 0x3a1a00, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 })); pud.position.y = 0.03; pud.scale.z = 0.92; g.add(pud); }
  else if (p.id === 'launcher') { const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.16, 20), hhStd({ color: 0x3a2a4a, roughness: 0.5 })); pad.position.y = 0.08; g.add(pad); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 6, 24), hhStd({ color: 0x111111, emissive: 0xff7a2a, emissiveIntensity: 1.8 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.17; g.add(ring); }
  else { const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.1, 20), hhStd({ color: 0x1a3a2a, roughness: 0.5 })); pad.position.y = 0.05; g.add(pad); const cross = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.35), hhStd({ color: 0x111111, emissive: 0x6aff9a, emissiveIntensity: 1.6 })); cross.position.y = 0.11; g.add(cross); const c2 = cross.clone(); c2.rotation.y = Math.PI / 2; g.add(c2); }
  g.traverse(o => { if (o.isMesh) p.meshes.push(o); });
}
function hhPieceRemove(p, silent) {
  const H = HH.cur; for (const m of p.meshes) { if (m.parent) m.parent.remove(m); const i = wallMeshes.indexOf(m); if (i >= 0) wallMeshes.splice(i, 1); }
  for (const b of p.boxes) { const i = boxes.indexOf(b); if (i >= 0) boxes.splice(i, 1); } if (p.g && p.g.parent) p.g.parent.remove(p.g); if (p.plot && p.plot.g && p.plot.g.parent) p.plot.g.parent.remove(p.plot.g);
  if (silent || !H) return; H.pieces = H.pieces.filter(o => o !== p); H.traps = H.traps.filter(o => o !== p); for (const k of p.key.split('|')) if (H.slots.get(k) === p) H.slots.delete(k);
  if (H.base) { const i = H.s.base.pieces.indexOf(p.rec); if (i >= 0) H.s.base.pieces.splice(i, 1); if (p.id === 'plot') delete H.s.base.plots[p.key]; hhSave(H.s); }
  try { rebuildBoxGrid(); } catch (e) {}
}
function hhPieceHit(p, dmg) {
  if (!p || p.hp <= 0) return; p.hp -= dmg; const k = clamp(p.hp / p.max, 0, 1);
  for (const m of p.meshes) if (m.material && m.material.color) { if (m.userData.c0 === undefined) m.userData.c0 = m.material.color.getHex(); m.material.color.setHex(m.userData.c0).multiplyScalar(0.45 + 0.55 * k); }
  try { chunks(p.mat === 'wood' ? 'wood' : 'dust', new THREE.Vector3(p.cx, p.y + Math.min(p.h, 1.5), p.cz), 4, 2.5, 0.4); sfx.thud(at(p.cx, p.cz, 22)); } catch (e) {}
  if (p.hp <= 0) { hhPieceRemove(p); try { burst(0.25, 500, 0.2, 'lowpass'); chunks(p.mat === 'wood' ? 'wood' : 'dust', new THREE.Vector3(p.cx, p.y + 1, p.cz), 14, 4, 0.7); } catch (e) {} }
}
function hhBlocker(x, z, y, tx, tz) {
  const H = M.hh, dx = tx - x, dz = tz - z, L = Math.hypot(dx, dz) || 1, px = x + dx / L * 1.1, pz = z + dz / L * 1.1; let best = null, bd = 1e9;
  for (const p of H.pieces) { if (p.trap || p.hp <= 0) continue; if (y + 1 < p.y || y > p.y + p.h) continue; const cx = clamp(px, p.cx - p.w / 2, p.cx + p.w / 2), cz = clamp(pz, p.cz - p.d / 2, p.cz + p.d / 2), d = Math.hypot(px - cx, pz - cz); if (d < 1.1 && d < bd) { bd = d; best = p; } }
  return best;
}

/* ---------- build mode input */
function hhBuildMode(on) {
  if (HH.build === on) return; if (!on && HH.carry) try { hhCarryCancel(); } catch (e) {} HH.build = on; if (HH.ghost) HH.ghost.visible = false;
  try { const gun = gunObjs[G.cur]; if (gun) gun.visible = !on; } catch (e) {}
  if (on) { mouseDown = false; HH.piece = Math.min(HH.piece, hhPieceList().length - 1); try { sfx.ui(); } catch (e) {} }
}
addEventListener('keydown', e => {
  if (!M || !M.hh || G.state !== 'playing' || curScreen || HH.menu) return; const c = e.code;
  if (c === bind('build') && !e.repeat) { hhBuildMode(!HH.build); e.stopImmediatePropagation(); return; }
  if (!HH.build) return;
  const n = /^Digit([1-9])$/.exec(c); if (n) { if (+n[1] <= hhPieceList().length) HH.piece = +n[1] - 1; e.stopImmediatePropagation(); try { tone(700, 0.03, 0.03, 'square'); } catch (er) {} return; }
  if (c === bind('inspect') && !e.repeat) { e.stopImmediatePropagation(); if (HH.carry) hhCarryCancel(); else hhPickUp(); return; }
  if (c === bind('reload')) { const L = hhPieceList(), P0 = L[HH.piece] || L[0]; if (HH.carry && HH.carry.pr) HH.carry.r = (HH.carry.r + 1) % 4; else if (P0.prop && !HH.carry) HH.rot = ((HH.rot | 0) + 1) % 4; else HH.mat = HH_MATS[(HH_MATS.indexOf(HH.mat) + 1) % 3]; e.stopImmediatePropagation(); try { tone(500, 0.03, 0.03, 'square'); } catch (er) {} return; }
  if (c === bind('swap') && !e.repeat) { e.stopImmediatePropagation(); if (M.hh.base && !HH.carry) { HH.cat = ((HH.cat | 0) + 1) % 3; HH.piece = 0; try { tone(800, 0.04, 0.03, 'square'); showMsg(`${HH_CATN[HH.cat]} · ${hhPieceList().map((p, i) => i + 1 + ' ' + p.n).join(' · ')}`); } catch (er) {} } return; }
  if (c === bind('grenade') && !e.repeat) { e.stopImmediatePropagation(); try { hhFixLook(); } catch (er) { reportError(er); } return; }
  if (c === bind('prim') || c === bind('sec')) { e.stopImmediatePropagation(); return; }
}, true);
addEventListener('mousedown', e => {
  if (!M || !M.hh || !HH.build || G.state !== 'playing' || curScreen || HH.menu || !document.pointerLockElement) return;
  if (e.button === 0) { e.stopImmediatePropagation(); hhPlace(); HH.drag = true; HH.dragKey = null; }
}, true);
addEventListener('wheel', e => { if (!M || !M.hh || !HH.build || G.state !== 'playing') return; e.stopImmediatePropagation(); const n = hhPieceList().length; HH.piece = (HH.piece + (e.deltaY > 0 ? 1 : n - 1)) % n; }, true);
function hhPadTick() {
  let gp = null; try { gp = (navigator.getGamepads ? [...navigator.getGamepads()] : []).find(g => g && g.connected); } catch (e) {} if (!gp) return;
  const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed), was = HH.padB || {}, now = {}; for (const i of [3, 4, 7, 12, 13, 15]) now[i] = b(i); HH.padB = now; const press = i => now[i] && !was[i];
  if (press(15) && playerAlive() && !HH.menu) hhBuildMode(!HH.build);
  if (!HH.build) return; const n = hhPieceList().length;
  if (press(12)) HH.piece = (HH.piece + n - 1) % n; if (press(13)) HH.piece = (HH.piece + 1) % n;
  if (press(3)) { if (HH.carry && HH.carry.pr) HH.carry.r = (HH.carry.r + 1) % 4; else HH.mat = HH_MATS[(HH_MATS.indexOf(HH.mat) + 1) % 3]; } if (press(7)) hhPlace(); if (press(4)) { if (HH.carry) hhCarryCancel(); else hhPickUp(); }
  pad.fire = false;
}

/* ---------- the horde */
const HH_MATC = new Map();
function hhMobMat(m, K) { const k = m.uuid + K.tint; let c = HH_MATC.get(k); if (c) return c; c = zombMat(m).clone(); if (c.color) c.color.lerp(new THREE.Color(K.tint), 0.3); if (c.emissive) c.emissive.setHex(K.boss ? 0x2a0a3a : K.spit ? 0x1a3a08 : 0x14240a); HH_MATC.set(k, c); return c; }
const HH_EYE = new THREE.MeshBasicMaterial({ color: 0xb8ff5a });
function hhMob(kind, x, z, y) {
  const H = M.hh, K = HH_KINDS[kind], rig = cloneSoldier('rifleman'), root = rig.root;
  root.rotation.order = 'YXZ'; root.position.set(x, y, z); root.scale.setScalar(K.sc); root.userData.scale = K.sc; scene.add(root);
  root.traverse(o => { if (o.isMesh && !o.userData.hitbox) o.material = hhMobMat(o.material, K); });
  if (rig.gun) rig.gun.visible = false;
  for (const s of [-1, 1]) { const ey = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 4), HH_EYE); ey.position.set(s * 0.05, 0.12, 0.11); rig.head.add(ey); }
  const puff = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: K.boss ? 0x9a3aff : 0x7a4aaa, transparent: true, opacity: 0.35, depthWrite: false })); puff.scale.setScalar(K.boss ? 1.6 : 0.8); puff.position.y = 1.5; root.add(puff);
  const hp = Math.round(K.hp * H.D.hp * (1 + 0.12 * Math.max(0, H.wave - 1)));
  const e = { rig, group: root, hhMob: true, team: 9, kind: K.run ? 'run' : 'walk', K, hk: kind, hp, maxHp: hp, speed: rnd(K.sp[0], K.sp[1]), phase: Math.random() * 6, phase0: Math.random() * 6, lurch: rnd(-0.3, 0.3), flinch: 0, atkT: 0, atkCd: rnd(0.3, 0.7), aim: 0, crouchK: 0, chk: 0.6, lastX: x, lastZ: z, slowT: 0, spitT: rnd(1, 2), tgtT: 0, tg: null, bash: null, puff, boss: !!K.boss, dmg: K.dmg };
  rig.hits.forEach(m => { m.userData.enemy = e; });
  enemies.push(e); H.mobs.push(e);
  if (K.boss) try { showBanner('THE OVERGROWN', 'the biggest burnout of them all · protect the plant!'); tone(48, 2.4, 0.2, 'sawtooth', 30); } catch (er) {}
  return e;
}
function hhWaveList(w) {
  const H = M.hh, D = H.D, n = Math.round((6 + w * 5) * D.cnt), out = [];
  for (let i = 0; i < n; i++) { const r = Math.random(); out.push(w >= 3 && r < 0.1 ? 'smasher' : w >= 2 && r < 0.27 ? 'sprinter' : w >= 2 && r < 0.42 ? 'spitter' : w >= 2 && r < 0.52 ? 'drifter' : w >= 3 && r < 0.6 ? 'bloater' : 'burnout'); }
  if (w >= 3 && !out.includes('smasher')) out[0] = 'smasher';
  if (w >= H.waves && (!H.raid || H.waves >= 5)) out.splice(Math.floor(n / 2), 0, 'boss');
  return out;
}
function hhStartWave() {
  const H = M.hh; H.wave++; H.phase = 'wave'; H.queue = hhWaveList(H.wave); H.toSpawn = H.queue.length; H.spawnT = 1;
  for (const R of H.rifts) R.g.visible = true;
  try { showBanner(`${H.raid ? 'RAID · ' : ''}WAVE ${H.wave} OF ${H.waves}`, H.wave === H.waves ? 'the last wave' : `${H.toSpawn} burnouts are coming out of the rifts`); tone(70, 1.6, 0.18, 'sawtooth'); tone(52, 2.2, 0.14, 'triangle'); } catch (e) {}
  hhBuildMode(false);
}
function hhWaveDone() {
  const H = M.hh; H.wavesWon = H.wave; H.phase = 'prep'; H.t = 45; for (const k of HH_MATS) hhGive(k, 30);
  if (H.hero === 'medic') H.plant.hp = Math.min(H.plant.max, H.plant.hp + H.plant.max * 0.25);
  if (H.wave >= H.waves) { if (H.raid) hhRaidEnd(true); else hhEnd(true); return; }
  try { showBanner(`WAVE ${H.wave} HELD`, `+30 of each material · wave ${H.wave + 1} in 45 s · build!`); sfx.streak(); } catch (e) {}
}
function hhMobTick(e, dt, i) {
  const H = M.hh, g = e.group.position, pl = e.obj && e.obj.hp > 0 ? e.obj : H.plant, K = e.K, hunt = !pl, FLD = pl && pl.field ? pl.field : H.field;   // on a supply run they hunt you
  if (K.fly) { hhFlyTick(e, dt); return; }
  if ((e.tgtT -= dt) <= 0) {
    e.tgtT = 0.4; e.tg = null; const R = hunt ? 90 : K.spit ? 13 : 7; let bd = R;
    if (playerAlive()) { const d = Math.hypot(P.x - g.x, P.z - g.z); if (d < bd && (hunt || Math.abs((P.y || 0) - g.y) < 2.6)) { bd = d; e.tg = 'P'; } }
    for (const o of enemies) if (o.entry && o.team === M.myTeam && o.entry.alive !== false) { const d = Math.hypot(o.group.position.x - g.x, o.group.position.z - g.z); if (d < bd && (hunt || Math.abs(o.group.position.y - g.y) < 2.6)) { bd = d; e.tg = o; } }
  }
  if (e.tg && e.tg !== 'P' && !enemies.includes(e.tg)) e.tg = null; if (e.tg === 'P' && !playerAlive()) e.tg = null;
  if (!e.tg && !pl) { animZombie(e, dt, 0); botGround(e.group, dt); return; }
  const T = e.tg === 'P' ? { x: P.x, z: P.z, y: P.y || 0 } : e.tg ? e.tg.group.position : { x: pl.x, z: pl.z, y: pl.y };
  const dx = T.x - g.x, dz = T.z - g.z, dist = Math.max(0.001, Math.hypot(dx, dz)), nx = dx / dist, nz = dz / dist, reach = e.tg ? 1.5 * K.sc : 1.9 + 0.3 * K.sc;
  let mx = 0, mz = 0, hitting = null;
  if (e.bash && e.bash.hp <= 0) e.bash = null;
  if (K.spit && dist < 12.5 && gridClear(g.x, g.z, T.x, T.z, g.y, T.y)) { if ((e.spitT -= dt) <= 0) { e.spitT = rnd(2.2, 2.8); hhSpit(e, T); } }
  else if (e.bash) hitting = 'piece';
  else if (dist < reach) hitting = 'tgt';
  else if (e.tg === 'P' && hunt && !gridClear(g.x, g.z, T.x, T.z, g.y, T.y)) { const d = navDir(g.x, g.z, g.y); if (d) { mx = d[0]; mz = d[1]; } else { mx = nx; mz = nz; } }
  else if (e.tg || dist < 4 || !FLD) { mx = nx; mz = nz; if (!e.tg && !gridClear(g.x, g.z, T.x, T.z, g.y, T.y) && FLD) { const d = flowDir(FLD, g.x, g.z, g.y); if (d) { mx = d[0]; mz = d[1]; } } }
  else { const d = flowDir(FLD, g.x, g.z, g.y); if (d) { mx = d[0]; mz = d[1]; } else { mx = nx; mz = nz; } }
  if (hitting) {
    if (e.atkT > 0) { e.atkT -= dt; if (!e.hitDone && e.atkT < 0.3) { e.hitDone = true;
      if (hitting === 'piece') hhPieceHit(e.bash, K.bdmg * (H.D.hp > 1 ? 1.15 : 1));
      else if (e.tg === 'P') { if (dist < reach + 0.4) try { hurtPlayer(K.dmg, g.x, g.z); sfx.melee && sfx.melee(); } catch (er) {} }
      else if (e.tg) { if (dist < reach + 0.4) try { damageEnemy(e.tg, K.dmg, false, null, false, 'world'); } catch (er) {} }
      else if (pl && pl !== H.plant) hhObjHit(pl, K.dmg * (K.boss ? 2 : 1)); else hhPlantHit(K.dmg * (K.boss ? 2 : 1)); } }
    else if (K.bloat) { hhBloat(e); return; }
    else if ((e.atkCd -= dt) <= 0) { e.atkT = 0.75; e.hitDone = false; e.atkCd = rnd(0.6, 1.0) * (K.boss ? 1.3 : 1); if (Math.random() < 0.5) try { sfx.zscreech(at(g.x, g.z, 14, g.y)); } catch (er) {} }
  }
  const slow = H.traps.some(p => p.id === 'resin' && Math.abs(g.x - p.cx) < 1.5 && Math.abs(g.z - p.cz) < 1.5 && Math.abs(g.y - p.y) < 1) ? 0.4 : 1; e.inResin = slow < 1;
  const ml = Math.hypot(mx, mz), sp = ml > 0.01 ? e.speed * slow * (e.slowT > 0 ? 0.5 : 1) : 0; e.slowT = Math.max(0, e.slowT - dt);
  if (ml > 0.01) { const x0 = g.x, z0 = g.z; g.x += mx / ml * sp * dt; g.z += mz / ml * sp * dt; resolve(g, 0.42 * K.sc, g.y, true);
    const moved = Math.hypot(g.x - x0, g.z - z0); if (moved < sp * dt * 0.35) { e.stuckT = (e.stuckT || 0) + dt; if (e.stuckT > 0.35) { e.bash = hhBlocker(g.x, g.z, g.y, g.x + mx, g.z + mz); e.stuckT = 0; if (!e.bash) e.avoidT = 0.8; } } else e.stuckT = 0; }
  if (e.avoidT > 0) { e.avoidT -= dt; g.x += -mz / (ml || 1) * 1.2 * dt; g.z += mx / (ml || 1) * 1.2 * dt; resolve(g, 0.42 * K.sc, g.y, true); }
  botGround(e.group, dt);
  for (let j = 0; j < H.mobs.length; j++) { if (j === i) continue; const o = H.mobs[j].group.position, sx = g.x - o.x, sz = g.z - o.z, sd = Math.hypot(sx, sz), R = 0.8 * K.sc; if (sd < R && sd > 0.001) { const pu = (R - sd) * 0.5; g.x += sx / sd * pu; g.z += sz / sd * pu; } }
  const face = e.bash ? Math.atan2(e.bash.cx - g.x, e.bash.cz - g.z) : ml > 0.01 && dist > 2 ? Math.atan2(mx, mz) : Math.atan2(dx, dz); let dy = face - e.group.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; e.group.rotation.y += dy * Math.min(1, dt * 6);
  e.puff.material.opacity = 0.25 + Math.sin(NOW * 3 + e.phase0) * 0.1;
  animZombie(e, dt, sp);
}
function hhPlantHit(dmg) {
  const H = M.hh; if (H.over || !H.plant) return; H.plant.hp -= dmg; H.plant.hitT = NOW; try { tone(140, 0.12, 0.06, 'square', 90); } catch (e) {}
  if (!H.plantWarn || NOW - H.plantWarn > 6) { H.plantWarn = NOW; try { showMsg('THE MOTHER PLANT IS UNDER ATTACK!'); } catch (e) {} }
  if (H.plant.hp <= 0) { if (H.raid) hhRaidEnd(false); else hhEnd(false); }
}
function hhSpit(e, T) {
  const H = M.hh, g = e.group.position, from = new THREE.Vector3(g.x, g.y + 1.6 * e.K.sc, g.z); let hit = null; const to = new THREE.Vector3(T.x, (T.y || 0) + 1.1, T.z);
  for (let k = 1; k <= 12 && !hit; k++) { const f = k / 12, x = from.x + (to.x - from.x) * f, z = from.z + (to.z - from.z) * f, y = from.y + (to.y - from.y) * f + Math.sin(f * Math.PI) * 2; for (const p of H.pieces) if (!p.trap && Math.abs(x - p.cx) < p.w / 2 + 0.1 && Math.abs(z - p.cz) < p.d / 2 + 0.1 && y > p.y && y < p.y + p.h) { hit = p; to.set(x, y, z); break; } }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0x9aff3a, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9, depthWrite: false })); s.scale.setScalar(0.5); s.position.copy(from); scene.add(s);
  H.spits.push({ s, from, to, t: 0, T: 0.9, hit, tg: e.tg, dmg: e.K.dmg, pdmg: e.K.throw ? e.K.bdmg : 20, rock: !!e.K.throw }); try { burst(0.2, 700, 0.06, 'bandpass', at(g.x, g.z, 20)); } catch (er) {}
}
function hhSpitTick(dt) {
  const H = M.hh;
  for (let i = H.spits.length - 1; i >= 0; i--) { const q = H.spits[i]; q.t += dt; const f = Math.min(1, q.t / q.T); q.s.position.lerpVectors(q.from, q.to, f); q.s.position.y += Math.sin(f * Math.PI) * 2;
    if (f >= 1) { scene.remove(q.s); H.spits.splice(i, 1); try { chunks('dust', q.to.clone(), 5, 2, 0.5); } catch (e) {}
      if (q.hit) hhPieceHit(q.hit, q.pdmg || 20); else if (q.tg === 'P') { if (playerAlive() && Math.hypot(P.x - q.to.x, P.z - q.to.z) < 1.6) try { hurtPlayer(q.dmg, q.from.x, q.from.z); } catch (e) {} } else if (q.tg && enemies.includes(q.tg)) { if (Math.hypot(q.tg.group.position.x - q.to.x, q.tg.group.position.z - q.to.z) < 1.6) try { damageEnemy(q.tg, q.dmg, false, null, false, 'world'); } catch (e) {} } else if (H.plant && Math.hypot(q.to.x - H.plant.x, q.to.z - H.plant.z) < 2.5) hhPlantHit(q.dmg); } }
}
function hhTrapTick(dt) {
  const H = M.hh, tk = 1 + 0.2 * (H.lv.trap | 0), on = (g, p, r) => Math.abs(g.x - p.cx) < (r || 1.5) && Math.abs(g.z - p.cz) < (r || 1.5) && Math.abs(g.y - p.y) < 0.9;
  for (const p of H.traps.slice()) {
    if (p.id === 'resin') continue; p.cd -= dt;
    if (p.id === 'chill') { if (playerAlive() && on({ x: P.x, z: P.z, y: P.y || 0 }, p)) G.health = Math.min(G.maxHp || 100, G.health + 15 * dt); for (const e of enemies) if (e.entry && e.team === M.myTeam && on(e.group.position, p)) e.hp = Math.min(e.maxHp, e.hp + 15 * dt); continue; }
    if (p.cd > 0) continue;
    if (p.id === 'spikes') { let any = false; for (const e of H.mobs) if (on(e.group.position, p)) { any = true; hhTrapDmg(e, 28 * tk, p); } if (any) { p.cd = 0.5; p.uses--; for (const m of p.meshes) if (m.userData.spike) m.position.y = 0.32; setTimeout(() => { for (const m of p.meshes) if (m.userData.spike) m.position.y = 0.18; }, 160); try { burst(0.06, 2500, 0.06, 'highpass', at(p.cx, p.cz, 18)); } catch (e) {} } }
    else if (p.id === 'zapper') { let best = null, bd = 5; for (const e of H.mobs) { const d = Math.hypot(e.group.position.x - p.cx, e.group.position.z - p.cz); if (d < bd && Math.abs(e.group.position.y - p.y) < 2.5) { bd = d; best = e; } } if (best) { p.cd = 1.1; p.uses--; hhTrapDmg(best, 60 * tk, p); best.slowT = 0.6; hhZapFx(new THREE.Vector3(p.cx, p.y + 1.95, p.cz), best.group.position.clone().setY(best.group.position.y + 1.2)); } }
    else if (p.id === 'launcher') { let any = false; for (const e of H.mobs) if (on(e.group.position, p, 1.3) && !e.K.boss) { any = true; const g = e.group.position, o = H.plant || H.org, dx = g.x - o.x, dz = g.z - o.z, L = Math.hypot(dx, dz) || 1; for (let k = 0; k < 8; k++) { g.x += dx / L * 0.9; g.z += dz / L * 0.9; resolve(g, 0.42, g.y, true); } hhTrapDmg(e, 18 * tk, p); e.slowT = 1; } if (any) { p.cd = 2; p.uses--; try { burst(0.3, 400, 0.2, 'lowpass', at(p.cx, p.cz, 25)); chunks('dust', new THREE.Vector3(p.cx, p.y + 0.3, p.cz), 10, 5, 0.5); } catch (e) {} } }
    if (p.uses <= 0) { hhPieceRemove(p); try { showMsg(`A ${HH_TRAPS[p.id].n} WORE OUT`); } catch (e) {} }
  }
}
function hhTrapDmg(e, dmg, p) { const tl = p && M.hh && M.hh.s.tlv ? M.hh.s.tlv[p.id] | 0 : 0; try { damageEnemy(e, dmg * (1 + 0.35 * tl), false, null, false, 'world'); } catch (er) {} }
function hhZapFx(a, b) {
  const pts = []; for (let k = 0; k <= 8; k++) { const f = k / 8, j = k % 8 ? 0.2 : 0; pts.push(new THREE.Vector3(a.x + (b.x - a.x) * f + rnd(-j, j), a.y + (b.y - a.y) * f + rnd(-j, j), a.z + (b.z - a.z) * f + rnd(-j, j))); }
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x9ad8ff })); scene.add(l); setTimeout(() => { scene.remove(l); l.geometry.dispose(); }, 110);
  try { tone(1200, 0.08, 0.04, 'sawtooth', 300, at(a.x, a.z, 20)); } catch (e) {}
}
function hhGive(k, n) { const H = M.hh; H.s.inv[k] = (H.s.inv[k] | 0) + n; H.got[k] = (H.got[k] | 0) + n; }
function hhHarvest() {
  const H = M.hh, fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); let best = null, bd = 2.7;
  for (const n of H.nodes) { if (n.hp <= 0) continue; const dx = n.x - P.x, dz = n.z - P.z, d = Math.hypot(dx, dz); if (d < bd && (dx * fx + dz * fz) / (d || 1) > 0.4 && Math.abs(n.y - (P.y || 0)) < 1.6) { bd = d; best = n; } }
  if (!best) return; const n = best, got = Math.round(rnd(9, 14) * (H.hero === 'scrapper' ? 2 : 1) * (1 + 0.2 * (H.lv.yield | 0))); n.hp--; hhGive(n.k, got);
  n.g.scale.setScalar(0.55 + 0.45 * n.hp / n.max); n.g.rotation.z = rnd(-0.08, 0.08); setTimeout(() => { if (n.g) n.g.rotation.z = 0; }, 90);
  try { chunks(n.k === 'wood' ? 'wood' : 'dust', new THREE.Vector3(n.x, n.y + 0.5, n.z), 6, 3, 0.5); n.k === 'metal' ? tone(rnd(700, 900), 0.08, 0.06, 'square', 400) : burst(0.1, n.k === 'stone' ? 1500 : 900, 0.18, 'bandpass'); showMsg(`+${got} ${HH_MAT[n.k].n}`); } catch (e) {}
  if (n.hp <= 0) { if (n.g.parent) n.g.parent.remove(n.g); n.regrow = H.base ? NOW + 120 : 0; }
}

/* ---------- SUPPLY RUN: eight caches to search, then the extraction van */
function hhSupplySetup(H) {
  H.caches = []; H.found = 0; H.t = 600; const pr = PLAYRECT;
  for (let i = 0; i < 400 && H.caches.length < 8; i++) { const o = openNear(rnd(pr[0] + 3, pr[1] - 3), rnd(pr[2] + 3, pr[3] - 3)), y = groundAt(o.x, o.z, 0.6), d = Math.hypot(o.x - H.org.x, o.z - H.org.z); if (d < 8 || H.caches.some(c => Math.hypot(c.x - o.x, c.z - o.z) < 11) || H.rifts.some(r => Math.hypot(r.x - o.x, r.z - o.z) < 8)) continue;
    if (H.kind === 'wild') { const st = Math.random() < 0.08 ? 'north' : ['og', 'haze', 'blue'][(Math.random() * 3) | 0], w = hhWeed(18, rnd(0.7, 0.9), HH_STR(st).col); w.position.set(o.x, y, o.z); w.rotation.y = Math.random() * TAU; H.grp.add(w); H.caches.push({ x: o.x, z: o.z, y, g: w, wild: 1, st, done: false, hold: 0 }); continue; }
    const g = new THREE.Group(), m = hhStd({ color: [0x4a5a6a, 0x6a3a2a, 0x2a4a2a][H.caches.length % 3], roughness: 0.6, metalness: 0.4 }), st = hhStd({ color: 0x111111, emissive: 0xffb84a, emissiveIntensity: 1.6 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.6), m); b.position.y = 0.3; g.add(b); const lid = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.12, 0.62), m); lid.position.y = 0.66; g.add(lid); const s1 = new THREE.Mesh(new THREE.BoxGeometry(1.13, 0.05, 0.63), st); s1.position.y = 0.56; g.add(s1);
    g.position.set(o.x, y, o.z); g.rotation.y = Math.random() * TAU; H.grp.add(g); H.caches.push({ x: o.x, z: o.z, y, g, lid, done: false, hold: 0 }); }
}
function hhSupplyTick(dt) {
  const H = M.hh; H.t -= dt; if (H.t <= 0) { hhEnd(false); return; }
  if ((H.spawnT -= dt) <= 0 && H.mobs.length < 7 + H.found) { H.spawnT = Math.max(2.5, 6 - H.found * 0.4); const R = H.rifts[(Math.random() * H.rifts.length) | 0], r = Math.random(); hhMob(r < 0.15 && H.found > 2 ? 'smasher' : r < 0.35 ? 'sprinter' : r < 0.45 ? 'spitter' : 'burnout', R.x + rnd(-1, 1), R.z + rnd(-1, 1), R.y); }
  try { if (navTarget < 0 || !navField || H.navX === undefined || Math.hypot(P.x - H.navX, P.z - H.navZ) > 1.25) { H.navX = P.x; H.navZ = P.z; updateNav(P.x, P.z, P.y || 0); } } catch (e) {}
  const u = kb('use') || pad.use;
  for (const c of H.caches) {
    if (c.done || !playerAlive()) continue; if (Math.hypot(P.x - c.x, P.z - c.z) > 2 || Math.abs((P.y || 0) - c.y) > 1.6) { c.hold = 0; continue; }
    const HT = c.wild ? 2 : 1.2; if (u) { c.hold += dt; showMsgOnce(`${c.wild ? 'CUTTING' : 'SEARCHING'} · ${Math.min(100, Math.round(c.hold / HT * 100))}%`); if (c.hold >= HT) hhCacheOpen(c); } else showMsgOnce(c.wild ? `WILD ${HH_STR(c.st).n} · HOLD ${actName('use')} TO CUT IT` : `SUPPLY CACHE · HOLD ${actName('use')} TO SEARCH`);
  }
  if (H.phase === 'run' && H.found >= 6) { H.phase = 'extract'; H.t = Math.min(H.t, 150); let best = null, bd = -1; for (let i = 0; i < 60; i++) { const o = openNear(rnd(PLAYRECT[0] + 5, PLAYRECT[1] - 5), rnd(PLAYRECT[2] + 5, PLAYRECT[3] - 5)), d = Math.hypot(o.x - P.x, o.z - P.z); if (d > 25 && d < 55 && d > bd) { bd = d; best = o; } } best = best || openNear(0, 0);
    const vy = groundAt(best.x, best.z, 0.6), v = hhVanMesh(0x3a6a3a); v.position.set(best.x, vy, best.z); v.rotation.y = Math.random() * TAU; H.grp.add(v); H.van = { x: best.x, z: best.z, y: vy, g: v, t: 0 };
    try { showBanner('EXTRACTION VAN INBOUND', 'get to the van and hold the spot for 6 seconds'); sfx.streak(); } catch (e) {} }
  if (H.van) { const near = playerAlive() && Math.hypot(P.x - H.van.x, P.z - H.van.z) < 5; H.van.t = near ? H.van.t + dt : Math.max(0, H.van.t - dt * 0.5); if (near) showMsgOnce(`EXTRACTING · ${Math.min(100, Math.round(H.van.t / 6 * 100))}%`); if (H.van.t >= 6) hhEnd(true); }
}
function hhCacheOpen(c) {
  const H = M.hh; c.done = true; H.found++; const got = [];
  if (c.wild) { const n = Math.round(rnd(2, 4) * (1 + 0.2 * (H.lv.yield | 0))); H.s.buds[c.st] = (H.s.buds[c.st] | 0) + n; H.got['bud:' + c.st] = (H.got['bud:' + c.st] | 0) + n; got.push(`+${n} ${HH_STR(c.st).n} BUDS`); c.g.parent && c.g.parent.remove(c.g); try { chunks('wood', new THREE.Vector3(c.x, c.y + 0.8, c.z), 10, 3, 0.6); } catch (e) {} if (Math.random() < 0.3) { H.s.seeds[c.st] = (H.s.seeds[c.st] | 0) + 1; H.got['seed:' + c.st] = (H.got['seed:' + c.st] | 0) + 1; got.push(`+1 ${HH_STR(c.st).n} SEED`); } if (Math.random() < 0.5) { hhGive('sap', 2); got.push('+2 TREE SAP'); } try { showBanner(`PLANT ${H.found} / 8`, got.join(' · ')); sfx.pickup(); } catch (e) {} return; }
  c.lid.position.y = 0.9; c.lid.rotation.x = -0.9;
  for (let i = 0; i < 2; i++) { const k = HH_CMATS[(Math.random() * HH_CMATS.length) | 0], n = Math.round(rnd(2, 4) * H.D.pay); hhGive(k, n); got.push(`+${n} ${HH_CMAT[k].n}`); }
  const k = HH_MATS[(Math.random() * 3) | 0], n = Math.round(rnd(15, 30)); hhGive(k, n); got.push(`+${n} ${HH_MAT[k].n}`);
  if (Math.random() < 0.18) { const sd = Math.random() < 0.2 && H.di >= 2 ? 'milk' : ['haze', 'blue', 'north'][(Math.random() * 3) | 0]; H.s.seeds[sd] = (H.s.seeds[sd] | 0) + 1; H.got['seed:' + sd] = (H.got['seed:' + sd] | 0) + 1; got.push(`+1 ${HH_STR(sd).n} SEED`); }
  WEAPONS.forEach(w => { w.reserve = Math.min(w.reserveMax || w.def.reserve, (w.reserve | 0) + Math.ceil((w.magSize | 0) * 1.5)); });
  try { showBanner(`CACHE ${H.found} / 8`, got.join(' · ')); sfx.pickup(); } catch (e) {}
}

/* ---------- the end of a mission: what it paid */
function hhEnd(won) {
  const H = M.hh; if (H.over) return; H.over = true; hhBuildMode(false);
  const s = H.s, D = H.D, k = won ? 1 : 0.35, pay = {};
  const add = (key, n) => { n = Math.round(n * k); if (n <= 0) return; if (key === 'cash') s.cash += n; else s.inv[key] = (s.inv[key] | 0) + n; pay[key] = (pay[key] | 0) + n; };
  add('cash', (hhRun(H.kind) ? 220 : 320) * D.pay + H.kills * 4);
  if (H.kind === 'defend') { add('scrap', 8 * D.pay); add('wire', 3 * D.pay); add('battery', 2 * D.pay); add('nutri', 3 * D.pay); add('sap', 3 * D.pay); }
  else { add('scrap', 5 * D.pay); add('nutri', 2 * D.pay); }
  if (won && Math.random() < 0.6) { const sd = Math.random() < 0.12 * (H.di + 1) ? 'milk' : ['haze', 'blue', 'north'][Math.min(2, (Math.random() * (H.di + 2)) | 0)]; s.seeds[sd] = (s.seeds[sd] | 0) + 2; pay['seed:' + sd] = 2; }
  if (H.gun) { H.gun.dur--; if (H.gun.dur <= 0) { s.arsenal.splice(s.arsenal.indexOf(H.gun), 1); s.eq = -1; pay.broke = 1; } }
  s.games++; s.kills += H.kills; const mi = Math.max(0, H.mi);
  if (won) { s.wins++; s.unl[mi] = Math.max(hhUnl(s, mi), Math.min(HH_DIFF.length - 1, H.di + 1)); const b = s.best[mi]; if (!b || !b.won || H.di > b.d) s.best[mi] = { won: true, d: H.di }; } else if (!s.best[mi]) s.best[mi] = { won: false, d: H.di };
  hhSave(s);
  H.res = { won, pay, got: Object.assign({}, H.got), kills: H.kills, built: H.built, waves: H.wavesWon, found: H.found, plant: H.plant ? Math.max(0, Math.round(H.plant.hp / H.plant.max * 100)) : null };
  try { if (won) brpXP(Math.round(2000 * D.pay), 'HOTBOX HORDE · MISSION DONE'); } catch (e) {}
  if (!won) try { showBanner(hhRun(H.kind) ? 'OUT OF TIME' : 'THE PLANT IS GONE', 'you keep a third of the pay and everything you picked up'); } catch (e) {}
  setTimeout(() => { try { if (M && M.hh === H) endMatch(won ? M.me : null); } catch (e) { reportError(e); } }, won ? 1500 : 2200);
}
const _hhRes = showResults;
showResults = function (winner, won) {
  const r = _hhRes.apply(this, arguments);
  try { const H = M && M.hh, R = H && H.res; if (R) { $('resTitle').textContent = R.won ? 'MISSION DONE' : 'MISSION FAILED'; $('resTitle').className = 'res-title ' + (R.won ? 'win' : 'lose'); $('resSub').textContent = `HOTBOX HORDE · ${HH_TYPES[H.kind].n} · ${(HH_MISSIONS[Math.max(0, H.mi)] || {}).n || ''} · ${H.D.n}`;
    const items = [], all = Object.assign({}, R.got); for (const k in R.pay) if (k !== 'broke' && k !== 'cash') all[k] = (all[k] | 0) + R.pay[k];
    for (const k in all) items.push([k.startsWith('seed:') ? HH_STR(k.slice(5)).n + ' SEEDS' : k.startsWith('bud:') ? HH_STR(k.slice(4)).n + ' BUDS' : HH_ALLN(k), '+' + all[k]]);
    const head = [[H.kind === 'defend' ? 'WAVES HELD' : H.kind === 'wild' ? 'PLANTS CUT' : hhRun(H.kind) ? 'CACHES' : 'OBJECTIVE', H.kind === 'defend' ? `${R.waves} / ${HH_WAVES}` : hhRun(H.kind) ? `${R.found} / 8` : (H.objTxt || '-')], ['BURNOUTS DOWN', R.kills], ['CASH', '+$' + (R.pay.cash | 0).toLocaleString()]];
    $('resBoard').insertAdjacentHTML('afterbegin', `<div class="hh-res">${head.map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('')}</div><div class="hh-loot"><small>BROUGHT HOME</small>${items.map(([a, b]) => `<span>${a} <b>${b}</b></span>`).join('')}${R.pay.broke ? '<span style="color:#ff6a6a">YOUR CRAFTED GUN BROKE</span>' : ''}</div>`); } } catch (e) {}
  return r;
};
function hhGoal(e, keep, near, set) {
  const H = M.hh;
  if (!H.plant) { if (!playerAlive()) return null; if (keep && e.goal && Math.hypot(e.goal.x - P.x, e.goal.z - P.z) < 7) return e.goal; const a = Math.random() * TAU; return set(near({ x: P.x + Math.cos(a) * 3.5, z: P.z + Math.sin(a) * 3.5, y: P.y || 0 }, 2), rnd(1.5, 3)); }
  const pl = H.plant; if (keep && e.goal && Math.hypot(e.goal.x - pl.x, e.goal.z - pl.z) < 10) return e.goal;
  const a = Math.random() * TAU, r = H.phase === 'wave' ? rnd(4, 9) : rnd(3, 7); return set(near({ x: pl.x + Math.cos(a) * r, z: pl.z + Math.sin(a) * r, y: pl.y }, 2), rnd(3, 6));
}
const _hhDmg = damageEnemy;
damageEnemy = function (e, dmg, head, dir, boom, by) {
  if (e && e.hhMob && M && M.hh) { const H = M.hh; if (by === 'player' && H.hero === 'gunner') dmg *= 1.25; if (by === 'player' && H.hero === 'scrapper' && G.meleeT > 0) dmg *= 3; if (by === 'player' && H.gun && WEAPONS[G.cur] && WEAPONS[G.cur].def && WEAPONS[G.cur].def.id === H.gunId) dmg *= HH_TIER[H.gun.tier].k; }
  return _hhDmg.apply(this, [e, dmg, head, dir, boom, by]);
};
function hhPlaceNear(o, isMe) {
  const H = M.hh, c = H.plant || H.org, a = Math.random() * TAU, q = openNear(c.x + Math.cos(a) * rnd(3.5, 6), c.z + Math.sin(a) * rnd(3.5, 6)), y = groundAt(q.x, q.z, H.by + 0.6);
  if (isMe) { P.x = q.x; P.z = q.z; P.y = y; P.vx = P.vz = P.vy = 0; P.yaw = Math.atan2(q.x - c.x, q.z - c.z); } else { o.group.position.set(q.x, y, q.z); o.goal = null; }
}
/* ---------- every frame (from m2Update) */
function hhTick(dt) {
  const H = M.hh; if (!H || M.over) return;
  if (!H.placed) { H.placed = true; hhPlaceNear(null, true); for (const e of enemies) if (e.entry) { hhPlaceNear(e); e.hhIn = true; }
    if (H.gun) try { equipClass({ p: H.gunId, s: 'sidearm', e: 'frag', k: 'none', factory: true }); } catch (e) { reportError(e); }
    showBanner(H.base ? 'THE HOMESTEAD' : HH_TYPES[H.kind].n, H.base ? `grow · sell · build · ${actName('build')} to build, ${actName('use')} at the stations` : H.kind === 'wild' ? 'cut 6 of the wild weed plants, then get to the van' : H.kind === 'supply' ? 'search 6 of the 8 caches, then get to the van' : `harvest with ${actName('melee')} · ${actName('build')} to build · wave 1 in 90 s`); }
  if (playerAlive()) { if (!HH.meIn) { HH.meIn = true; if (M.t > 1) hhPlaceNear(null, true); } } else { HH.meIn = false; hhBuildMode(false); }
  for (const e of enemies) if (e.entry && !e.hhIn) { e.hhIn = true; hhPlaceNear(e); }
  const u = kb('use') || pad.use;
  if (hhRun(H.kind)) hhSupplyTick(dt);
  else if (H.phase === 'prep' && !H.over) {
    H.t -= dt; const near = playerAlive() && Math.hypot(P.x - H.plant.x, P.z - H.plant.z) < 3.4;
    if (near && !HH.build) { if (u) { H.ready = (H.ready || 0) + dt; showMsgOnce(`STARTING WAVE ${H.wave + 1} · ${Math.min(100, Math.round(H.ready / 1.2 * 100))}%`); if (H.ready >= 1.2) H.t = 0; } else { H.ready = 0; showMsgOnce(`THE MOTHER PLANT · HOLD ${actName('use')} TO START WAVE ${H.wave + 1} NOW`); } }
    if (H.t <= 0) hhStartWave();
  } else if (H.phase === 'wave') {
    if (H.toSpawn > 0 && (H.spawnT -= dt) <= 0 && H.mobs.length < 26) { const R = typeof hhPickRift === 'function' ? hhPickRift(H) : H.rifts[(H.toSpawn + H.wave) % H.rifts.length], k = H.queue[H.queue.length - H.toSpawn]; if (R) hhMob(k, R.x + rnd(-1, 1), R.z + rnd(-1, 1), R.y); H.toSpawn--; H.spawnT = Math.max(0.45, 1.1 - H.wave * 0.1); }
    if (H.toSpawn <= 0 && !H.mobs.length) hhWaveDone();
  }
  if (H.base) hhBaseTick(dt, u);
  for (let i = H.mobs.length - 1; i >= 0; i--) { const e = H.mobs[i]; if (!enemies.includes(e)) { H.mobs.splice(i, 1); H.kills++; if (Math.random() < 0.5) hhGive(HH_MATS[(Math.random() * 3) | 0], 4); if (!H.base && Math.random() < 0.12) hhGive(HH_CMATS[(Math.random() * HH_CMATS.length) | 0], 1); } }
  for (let i = 0; i < H.mobs.length; i++) hhMobTick(H.mobs[i], dt, i);
  hhSpitTick(dt); hhTrapTick(dt);
  for (const R of H.rifts) { R.g.userData.ring.rotation.z += dt * (H.phase === 'wave' ? 2.5 : 0.6); R.g.userData.core.material.opacity = (H.phase === 'wave' ? 0.85 : 0.45) + Math.sin(NOW * 4) * 0.1; }
  if (H.plant) { const pg = H.plant.g; pg.userData.light.intensity = 1.2 + Math.sin(NOW * 1.5) * 0.15; pg.rotation.y += dt * 0.05; for (const b of pg.userData.buds) b.scale.x = b.scale.z = 1 + Math.sin(NOW * 2 + b.position.y) * 0.06; }
  for (const p of H.pieces) { if (p.t < 0.35) { p.t += dt; const k = Math.min(1, p.t / 0.35); for (const m of p.meshes) if (m.userData.hhY !== undefined) m.scale.y = Math.max(0.05, m.userData.hhY * k); } if (p.core && p.id === 'zapper') p.core.material.color.setHex(p.cd > 0.9 ? 0xffffff : 0x9ad8ff); }
  if (G.meleeT > 0.4 && !HH.swing) { HH.swing = true; setTimeout(() => { try { if (M && M.hh) hhHarvest(); } catch (e) {} }, 140); } if (G.meleeT <= 0) HH.swing = false;
  if (H.crate) { const c = H.crate; H.crateT = Math.max(0, H.crateT - dt); if (playerAlive() && Math.hypot(P.x - c.x, P.z - c.z) < 2 && !HH.build) { showMsgOnce(H.crateT > 0 ? `AMMO CRATE · READY IN ${Math.ceil(H.crateT)} s` : `AMMO CRATE · PRESS ${actName('use')} FOR AMMO`); if (u && !HH.uH && H.crateT <= 0) { H.crateT = H.hero === 'gunner' ? 15 : 30; WEAPONS.forEach(w => { w.ammo = w.magSize; w.reserve = w.reserveMax || w.def.reserve; }); G.grenades = Math.max(G.grenades, 2); try { showMsg('AMMO REFILLED'); sfx.pickup(); } catch (e) {} } } }
  if (H.hero === 'medic' && playerAlive()) { G.health = Math.min(G.maxHp || 100, G.health + 4 * dt); for (const e of enemies) if (e.entry && e.team === M.myTeam && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 8) e.hp = Math.min(e.maxHp, e.hp + 8 * dt); }
  if (HH.build) { G.swapT = Math.max(G.swapT, 0.15); mouseDown = false; try { const gun = gunObjs[G.cur]; if (gun) gun.visible = false; } catch (e) {} if (u && !HH.uH && HH.look && HH.look.prop && !HH.carry) { hhPropRemove(HH.look.prop); HH.look = null; } else if (u && !HH.uH && HH.look && !HH.carry) { const p = HH.look; if (p.mat) hhGive(p.mat, 5); else if (HH_TRAPS[p.id] && p.uses > 20) H.s.traps[p.id] = (H.s.traps[p.id] | 0) + 1; hhPieceRemove(p); HH.look = null; try { showMsg('PIECE REMOVED'); } catch (e) {} } }
  HH.uH = u; hhPadTick();
  hhGhostTick(); hhDomTick();
}
function hhHud() {
  const H = M.hh; if (!H) return ''; const hero = HH_HEROES.find(h => h.id === H.hero).n;
  if (H.base) return `THE HOMESTEAD · LEVEL ${H.s.base.lv} · $${H.s.cash.toLocaleString()}${H.raid ? ` · <b>RAID</b> ${H.phase === 'prep' ? `WAVE ${H.wave + 1} IN ${Math.ceil(H.t)} s` : `WAVE ${H.wave}/${H.waves}`}` : ''}`;
  if (hhRun(H.kind)) return `${H.D.n} · ${hero} · <b>${HH_TYPES[H.kind].n}</b> · ${H.found}/8 · ${fmtT(H.t)}`;
  return `${H.D.n} · ${hero} · ${H.phase === 'prep' ? `<b>BUILD</b> · WAVE ${H.wave + 1} IN ${Math.ceil(H.t)} s` : `<b>WAVE ${H.wave}</b> · ${H.mobs.length + H.toSpawn} LEFT`} · ${H.kills} DOWN`;
}
function hhMarkers(out) {
  const H = M.hh; if (!H) return;
  if (H.plant) out.push({ x: H.plant.x, y: H.plant.y + (H.base ? 4.1 : 5.9), z: H.plant.z, t: H.base && !H.raid ? 'THE MOTHER PLANT' : `MOTHER PLANT ${Math.max(0, Math.round(H.plant.hp / H.plant.max * 100))}%`, c: '#b070ff' });
  if (!H.base || H.raid) for (const R of H.rifts) out.push({ x: R.x, y: R.y + 4, z: R.z, t: 'RIFT', c: '#a040ff' });
  for (const n of H.nodes) if (n.hp > 0 && Math.hypot(n.x - P.x, n.z - P.z) < 14) out.push({ x: n.x, y: n.y + 1.3, z: n.z, t: HH_MAT[n.k].n, c: HH_MAT[n.k].css });
  if (H.crate && Math.hypot(H.crate.x - P.x, H.crate.z - P.z) < 30) out.push({ x: H.crate.x, y: H.crate.y + 1.2, z: H.crate.z, t: 'AMMO', c: '#7aff6a' });
  for (const e of H.mobs) if (e.boss) out.push({ x: e.group.position.x, y: e.group.position.y + 4, z: e.group.position.z, t: `THE OVERGROWN ${Math.max(0, Math.round(e.hp / e.maxHp * 100))}%`, c: '#ff4a6a' });
  if (H.caches) for (const c of H.caches) if (!c.done) out.push({ x: c.x, y: c.y + (c.wild ? 2.6 : 1.3), z: c.z, t: c.wild ? 'WILD WEED' : 'CACHE', c: c.wild ? '#7aff6a' : '#ffb84a' });
  if (H.van) out.push({ x: H.van.x, y: H.van.y + 3, z: H.van.z, t: 'EXTRACT', c: '#7aff6a' });
  if (H.base) hhBaseMarkers(out);
}
(() => { const s = document.createElement('style'); s.textContent = `#menu .cod-tile.hh-tile{order:4;grid-column:1/-1;background:linear-gradient(110deg,rgba(150,70,255,.25),rgba(90,220,110,.10) 60%,rgba(255,255,255,.02))}
#hhBar{position:fixed;top:64px;left:50%;transform:translateX(-50%);width:min(420px,70vw);text-align:center;pointer-events:none;z-index:6;font:600 11px/1.2 inherit;letter-spacing:.18em;color:#e8d8ff;text-shadow:0 1px 3px #000}
#hhBar small{display:block;font-size:9px;opacity:.85}#hhBar .hh-bt{height:9px;margin:4px 0;background:rgba(20,10,30,.7);border:1px solid rgba(190,140,255,.5)}#hhBar .hh-bt i{display:block;height:100%;transition:width .2s}#hhBar.hit .hh-bt{border-color:#ff4a4a;box-shadow:0 0 12px #ff4a4a}#hhBar span{font-size:10px}
#hhMats{position:fixed;right:18px;bottom:150px;pointer-events:none;z-index:6;text-align:right;font-family:inherit;color:#fff;text-shadow:0 1px 3px #000}
.hh-mrow{display:flex;gap:6px;justify-content:flex-end}.hh-mrow span{border:1px solid rgba(255,255,255,.18);background:rgba(10,10,14,.55);padding:3px 8px;min-width:52px}.hh-mrow span.on{border-color:var(--c);box-shadow:0 0 8px var(--c)}.hh-mrow small{display:block;font-size:8px;letter-spacing:.2em;color:var(--c)}.hh-mrow b{font-size:15px}
.hh-crow{display:flex;gap:8px;justify-content:flex-end;margin-top:4px;font-size:8.5px;letter-spacing:.12em}.hh-crow b{color:#fff}
.hh-prow{display:flex;gap:4px;justify-content:flex-end;margin-top:6px;flex-wrap:wrap;max-width:560px;margin-left:auto}.hh-prow span{font-size:9px;letter-spacing:.1em;border:1px solid rgba(255,255,255,.15);background:rgba(10,10,14,.55);padding:4px 6px}.hh-prow span.on{border-color:#5aff8a;color:#5aff8a}.hh-prow span.off{opacity:.45}.hh-prow small{display:block;font-size:8px;opacity:.6}
.hh-cost,.hh-tip{margin-top:5px;font-size:9px;letter-spacing:.14em;opacity:.85}
#lobby.hhl .hh-inv{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;margin:6px 0}.hh-inv span{border:1px solid rgba(255,255,255,.1);padding:3px 5px;background:rgba(255,255,255,.03)}.hh-inv small{display:block;font-size:8px;letter-spacing:.12em;color:var(--c)}.hh-inv b{font-size:14px}
#lobby.hhl .hh-misrow .arw .hh-launch{min-width:84px;background:var(--accent);color:#111;font-weight:700}
.hh-res{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 8px}.hh-res div{border:1px solid rgba(176,112,255,.4);background:rgba(40,20,60,.55);padding:8px 10px}.hh-res small{display:block;color:#c8a0ff;letter-spacing:2px;font-size:11px}.hh-res b{display:block;font-size:19px;margin-top:2px}
.hh-loot{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px;align-items:center}.hh-loot small{color:#7aff8a;letter-spacing:2px;font-size:11px;margin-right:6px}.hh-loot span{border:1px solid rgba(255,255,255,.15);background:rgba(10,20,10,.5);padding:4px 8px;font-size:11px;letter-spacing:.1em}.hh-loot b{color:#7aff8a}`; document.head.appendChild(s); })();
