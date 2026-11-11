/* ================================================================== HOTBOX HORDE (1.2.98): co-op build and defend
   You and three crew bots guard THE MOTHER PLANT, a giant glowing grow, from five waves of THE BURNOUTS (smoke-sick
   husks that crawl out of purple SMOKE RIFTS). Between waves: HARVEST wood, stone and metal with your melee (pallet
   stacks, rock piles, scrap heaps), then BUILD walls, floors and stairs on a 3 m grid around the plant and set TRAPS
   (spike floors, bug zappers, sticky resin). In a wave the horde walks to the plant and smashes through whatever is in
   the way; SMASHERS wreck walls, SPITTERS lob goo over them, wave 5 brings THE OVERGROWN. Keep the plant alive.
   Its own lobby: mission (map), difficulty, hero (BUILDER / GUNNER / SCRAPPER / MEDIC), upgrades bought with SEEDS
   (earned from missions), stats. Offline with bots for now. */
const HH_MISSIONS = [
  { map: 'greenhouse', n: 'THE GREENHOUSE', sub: 'the first grow · learn to build' },
  { map: 'stackyard', n: 'STACKYARD', sub: 'containers everywhere · wall off the lanes' },
  { map: 'dustwater', n: 'DUSTWATER', sub: 'open desert · they come from every side' },
  { map: 'ruins_night', n: 'ASH RUINS · NIGHT', sub: 'in the dark · the burnouts see you first' },
];
const HH_DIFF = [{ n: 'CHILL', hp: 0.7, cnt: 0.8, seeds: 1, col: '#7adf6a' }, { n: 'BAKED', hp: 1, cnt: 1, seeds: 1.6, col: '#ffd24a' }, { n: 'FRIED', hp: 1.5, cnt: 1.25, seeds: 2.4, col: '#ff8a3a' }, { n: 'COOKED', hp: 2.2, cnt: 1.5, seeds: 3.5, col: '#ff4a6a' }];
const HH_HEROES = [
  { id: 'builder', n: 'BUILDER', col: '#ffb84a', d: 'builds cost 25% less and have 50% more health · starts with 100 extra wood' },
  { id: 'gunner', n: 'GUNNER', col: '#ff6a5a', d: '25% more damage to the horde · the supply crate refills twice as fast' },
  { id: 'scrapper', n: 'SCRAPPER', col: '#7adf6a', d: 'harvests twice as much · melee hits the horde three times as hard' },
  { id: 'medic', n: 'MEDIC', col: '#6ad0ff', d: 'you and your crew heal when close to you · the MOTHER PLANT heals between waves' },
];
const HH_UPG = [{ id: 'plant', n: 'MOTHER PLANT HEALTH', d: '+20% a level' }, { id: 'trap', n: 'TRAP DAMAGE', d: '+20% a level' }, { id: 'mats', n: 'STARTING MATERIALS', d: '+60 of each a level' }];
const HH_MAT = { wood: { n: 'WOOD', key: 'wood', css: '#d8a868', hp: 150 }, stone: { n: 'STONE', key: 'concrete', css: '#c8c8c8', hp: 300 }, metal: { n: 'METAL', key: 'metal', css: '#8ad0ff', hp: 500 } };
const HH_MATS = ['wood', 'stone', 'metal'];
const HH_PIECES = [
  { id: 'wall', n: 'WALL', cost: 10 }, { id: 'floor', n: 'FLOOR', cost: 10 }, { id: 'ramp', n: 'STAIRS', cost: 10 },
  { id: 'spikes', n: 'SPIKE TRAP', trap: 1, cost: { metal: 20, wood: 10 } }, { id: 'zapper', n: 'BUG ZAPPER', trap: 1, cost: { metal: 30, stone: 10 } }, { id: 'resin', n: 'STICKY RESIN', trap: 1, cost: { wood: 20, stone: 10 } },
];
const HH_KINDS = {
  burnout: { n: 'BURNOUT', hp: 120, sp: [1.5, 2.0], dmg: 14, bdmg: 24, sc: 1, tint: 0x5a6a4a },
  sprinter: { n: 'SPRINTER', hp: 70, sp: [4.0, 4.6], dmg: 9, bdmg: 12, sc: 0.92, run: 1, tint: 0x6a5a7a },
  smasher: { n: 'SMASHER', hp: 560, sp: [1.1, 1.3], dmg: 30, bdmg: 95, sc: 1.35, tint: 0x4a3a5a },
  spitter: { n: 'SPITTER', hp: 110, sp: [1.6, 1.9], dmg: 12, bdmg: 20, sc: 1, spit: 1, tint: 0x4a7a3a },
  boss: { n: 'THE OVERGROWN', hp: 4400, sp: [1.25, 1.35], dmg: 45, bdmg: 220, sc: 1.9, boss: 1, tint: 0x3a5a2a },
};
const HH_WAVES = 5, HH_C = 3, HH_LV = 3;
const HHL = { on: false };
const HH = { build: false, piece: 0, mat: 'wood', ghost: null, gok: false, gspec: null, meIn: false, uH: false, useHold: 0, lastMelee: 0, look: null };

/* ---------- save: seeds, upgrades, hero, unlocks, stats */
function hhLoad() { let s = null; try { s = JSON.parse(localStorage.getItem('ashfall.hh.v1') || 'null'); } catch (e) {} s = Object.assign({ seeds: 0, lv: {}, hero: 'builder', mis: 0, diff: 0, unl: {}, games: 0, wins: 0, kills: 0, best: {}, built: 0 }, s || {}); s.lv = Object.assign({ plant: 0, trap: 0, mats: 0 }, s.lv); return s; }
function hhSave(s) { try { localStorage.setItem('ashfall.hh.v1', JSON.stringify(s)); } catch (e) {} }
const hhUnl = (s, mi) => Math.max(1, s.unl[mi] | 0);   // highest difficulty index open on a mission (CHILL and BAKED from the start)
const hhUpCost = lv => 250 + lv * 250;
const hhHero = () => (M && M.hh ? M.hh.hero : hhLoad().hero);

/* ---------- the lobby */
function hhOpen() { HHL.on = true; try { BRLOB.on = false; ZL.on = false; } catch (e) {} if (G.state !== 'menu') leaveGame(); hhRender('.cod-go'); showScreen('lobby'); }
function hhOff() { HHL.on = false; const L = $('lobby'); if (L) L.classList.remove('zl', 'hhl'); }
function hhRender(focusSel) {
  const s = hhLoad(), st = careerOf(false), mi = clamp(s.mis | 0, 0, HH_MISSIONS.length - 1), mis = HH_MISSIONS[mi], di = Math.min(s.diff | 0, hhUnl(s, mi)), D = HH_DIFF[di], H = HH_HEROES.find(h => h.id === s.hero) || HH_HEROES[0], b = s.best[mis.map];
  $('lobKind').textContent = 'HOTBOX HORDE'; $('lobby').classList.add('zl', 'hhl'); $('lobPlayer').innerHTML = playerCard(st); cardBanner($('lobPlayer'));
  const ph = document.querySelector('#lobby .cod-foot .padhint'); if (ph) ph.innerHTML = 'START  PLAY';
  const row = (sm, bb, sp, act, wide, col) => `<div class="cod-row${wide ? ' wide' : ''}"><small>${sm}</small><b${col ? ` style="color:${col}"` : ''}>${bb}</b><span>${sp}</span>${act ? `<div class="arw"><button class="mini" data-act="${act}-" aria-label="Previous">&lsaquo;</button><button class="mini" data-act="${act}+" aria-label="Next">&rsaquo;</button></div>` : ''}</div>`;
  const up = HH_UPG.map(u => { const lv = s.lv[u.id] | 0, max = lv >= 5; return `<div class="hh-up"><small>${u.n}</small><b>LEVEL ${lv} / 5</b><span>${u.d}</span><button class="mini hh-buy" data-act="hh-up-${u.id}"${max || s.seeds < hhUpCost(lv) ? ' disabled' : ''}>${max ? 'MAX' : `${hhUpCost(lv).toLocaleString()} SEEDS`}</button></div>`; }).join('');
  $('lobSel').innerHTML = `<div class="cod-play"><button class="btn primary lob-go cod-go" data-act="hh-start"><small>CO-OP · YOU + 3 CREW BOTS</small><b>DEFEND THE GROW</b></button></div>` +
    row(`MISSION ${mi + 1} / ${HH_MISSIONS.length}`, mis.n, mis.sub + (b ? ` · best: ${b.won ? 'DEFENDED on ' + HH_DIFF[b.d].n : 'wave ' + b.w}` : ''), 'hh-mis') +
    row('DIFFICULTY', D.n, `the horde has ${Math.round(D.hp * 100)}% health · ${Math.round(D.seeds * 100)}% seeds · ${HH_DIFF.map((d, i) => i <= hhUnl(s, mi) ? d.n : d.n + ' 🔒').join(' · ')}`, 'hh-dif', false, D.col) +
    row('HERO', H.n, H.d, 'hh-hero', false, H.col) +
    `<div class="cod-row wide"><small>UPGRADES · YOU HAVE ${s.seeds.toLocaleString()} SEEDS</small><div class="hh-ups">${up}</div></div>` +
    `<div class="cod-row"><small>YOUR HORDE</small><b>${s.wins} DEFENDED · ${s.games} PLAYED</b><span>${s.kills.toLocaleString()} burnouts down · ${s.built.toLocaleString()} pieces built</span></div>` +
    `<div class="cod-row"><small>CONTROLS</small><b>${actName('build')} BUILD MODE</b><span>1-6 pick a piece · ${actName('reload')} material · click to place · ${actName('use')} remove · ${actName('melee')} harvest</span></div>`;
  $('lobRoster').innerHTML = `<div class="ros-info"><b>HOTBOX HORDE</b>Guard THE MOTHER PLANT with your crew. Five waves of THE BURNOUTS crawl out of the purple SMOKE RIFTS and walk straight for her. Between waves: smash pallet stacks, rock piles and scrap heaps with your melee for WOOD, STONE and METAL, then build walls, floors, stairs and traps on the grid. SMASHERS wreck walls, SPITTERS lob goo over them, and wave 5 brings THE OVERGROWN. Hold USE at the plant to start a wave early. Defend her to earn SEEDS for upgrades and unlock harder difficulties.</div>`;
  if (focusSel) focusFirst(focusSel);
}
function hhAct(act) {
  if (act === 'hh-play') { sfx.ui(); hhOpen(); return true; }
  if (/^(go-on|go-mp|deploy|play|go-zombies|br-play)$/.test(act)) { if (HHL.on) hhOff(); return false; }
  if (!HHL.on || curScreen !== 'lobby') return false;
  const s = hhLoad(), re = sel => { hhSave(s); sfx.ui(); hhRender(sel); };
  if (act === 'hh-start' || act === 'lob-start') { const m = HH_MISSIONS[clamp(s.mis | 0, 0, HH_MISSIONS.length - 1)]; startMatch('hh', { map: m.map }); return true; }
  if (act === 'hh-mis-' || act === 'hh-mis+') { s.mis = ((s.mis | 0) + (act.endsWith('+') ? 1 : HH_MISSIONS.length - 1)) % HH_MISSIONS.length; s.diff = Math.min(s.diff | 0, hhUnl(s, s.mis)); re('[data-act="hh-mis+"]'); return true; }
  if (act === 'hh-dif-' || act === 'hh-dif+') { const n = hhUnl(s, s.mis | 0) + 1; s.diff = ((s.diff | 0) + (act.endsWith('+') ? 1 : n - 1)) % n; re('[data-act="hh-dif+"]'); return true; }
  if (act === 'hh-hero-' || act === 'hh-hero+') { const i = Math.max(0, HH_HEROES.findIndex(h => h.id === s.hero)); s.hero = HH_HEROES[(i + (act.endsWith('+') ? 1 : HH_HEROES.length - 1)) % HH_HEROES.length].id; re('[data-act="hh-hero+"]'); return true; }
  if (act.startsWith('hh-up-')) { const id = act.slice(6), lv = s.lv[id] | 0; if (lv < 5 && s.seeds >= hhUpCost(lv)) { s.seeds -= hhUpCost(lv); s.lv[id] = lv + 1; try { sfx.pickup(); } catch (e) {} } re(`[data-act="${act}"]`); return true; }
  if (act === 'lobby-back') { hhOff(); showScreen('menu'); return true; }
  if (act === 'playlist' || act === 'streaks' || act === 'custom' || act === 'map-' || act === 'map+' || act === 'mode-' || act === 'mode+') return true;
  return false;
}
// the menu tile (next to LAST TOKE)
const _hhTiles = featTiles;
featTiles = function () {
  _hhTiles.apply(this, arguments);
  const row = document.querySelector('#menu .cod-tiles'), br = $('brTile'); if (!row) return;
  let t = $('hhTile'); if (!t) { t = document.createElement('button'); t.id = 'hhTile'; t.className = 'cod-tile hh-tile'; t.dataset.act = 'hh-play'; row.insertBefore(t, br ? br.nextSibling : null); }
  t.innerHTML = '<small>NEW · CO-OP · BUILD AND DEFEND</small><b>HOTBOX HORDE</b><span>GATHER · BUILD · TRAP · DEFEND THE MOTHER PLANT</span>';
};

/* ---------- meshes: the plant, the rifts, the harvest nodes */
const hhStd = o => new THREE.MeshStandardMaterial(o);
function hhLeaf(mat, len) {   // a seven-finger leaf, flat, pointing +z
  const g = new THREE.Group();
  [[0, 1], [0.38, 0.85], [-0.38, 0.85], [0.75, 0.62], [-0.75, 0.62], [1.1, 0.38], [-1.1, 0.38]].forEach(([a, k]) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.16 * len, len * k, 4), mat); f.scale.z = 0.12; f.rotation.x = Math.PI / 2; f.position.z = len * k / 2; const p = new THREE.Group(); p.rotation.y = a; p.add(f); g.add(p); });
  return g;
}
function hhPlantMesh() {
  const g = new THREE.Group(), pot = hhStd({ color: 0x9a4a2a, roughness: 0.9 }), soil = hhStd({ color: 0x2a1a10, roughness: 1 }), stalk = hhStd({ color: 0x3a6a2a, roughness: 0.8 }), leaf = hhStd({ color: 0x3f9a3a, roughness: 0.6, emissive: 0x0a2a08, side: THREE.DoubleSide }), bud = hhStd({ color: 0xb070ff, emissive: 0x9a3aff, emissiveIntensity: 1.4, roughness: 0.5 });
  const p = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.95, 1.1, 18), pot); p.position.y = 0.55; g.add(p);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.06, 18), soil); s.position.y = 1.08; g.add(s);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.14, 3.4, 8), stalk); st.position.y = 2.7; g.add(st);
  const buds = [];
  for (let i = 0; i < 36; i++) { const h = 1.25 + i * 0.085, a = i * 2.4, L = hhLeaf(leaf, 1.25 - i * 0.026); L.position.set(Math.cos(a) * 0.06, h, Math.sin(a) * 0.06); L.rotation.order = 'YXZ'; L.rotation.set(0.18 - i * 0.014, -a + Math.PI / 2, 0); g.add(L);
    if (i % 3 === 0) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.13 - i * 0.002, 8, 6), bud); b.scale.y = 1.5; b.position.set(Math.cos(a) * 0.14, h + 0.08, Math.sin(a) * 0.14); g.add(b); buds.push(b); } }
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bud); top.scale.y = 1.8; top.position.y = 4.5; g.add(top); buds.push(top);
  // the grow light on its frame
  const fr = hhStd({ color: 0x222222, metalness: 0.6, roughness: 0.4 });
  for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.6, 6), fr); l.position.set(x, 2.8, z); g.add(l); }
  const pan = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 2.8), fr); pan.position.y = 5.6; g.add(pan);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), new THREE.MeshBasicMaterial({ color: 0xff7ad8 })); glow.rotation.x = Math.PI / 2; glow.position.y = 5.53; g.add(glow);
  const lt = new THREE.PointLight(0xd070ff, 1.3, 14, 2); lt.position.y = 5.2; g.add(lt);
  g.userData.buds = buds; g.userData.light = lt; return g;
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
  else if (k === 'stone') { const m = hhStd({ color: 0x7a7a76, roughness: 0.95, flatShading: true }); [[0, 0.45, 0, 0.55], [0.5, 0.3, 0.2, 0.38], [-0.35, 0.28, 0.35, 0.32], [0.1, 0.25, -0.45, 0.3]].forEach(([x, y, z, r]) => { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), m); s.position.set(x, y, z); s.rotation.set(Math.random() * 3, Math.random() * 3, 0); g.add(s); }); }
  else { const rust = hhStd({ color: 0x7a4a2a, roughness: 0.8, metalness: 0.5 }), st = hhStd({ color: 0x6a7078, roughness: 0.5, metalness: 0.8 }); const a = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.7), rust); a.position.y = 0.25; a.rotation.y = 0.3; g.add(a); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.85, 12), st); b.position.set(0.55, 0.42, 0.35); g.add(b); const c = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.6), st); c.position.set(-0.2, 0.62, -0.1); c.rotation.set(0.3, 0.5, 0.2); g.add(c); const t = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 6, 12), hhStd({ color: 0x151515, roughness: 0.95 })); t.position.set(-0.6, 0.3, 0.4); t.rotation.y = 1.2; g.add(t); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ---------- the match */
// where the plant goes: the most open spot near the middle (no roof, room all round)
function hhSpot() {
  let best = openNear(0, 0), bs = -1e9;
  for (let r = 0; r <= 33; r += 3) for (let k = 0; k < (r ? 12 : 1); k++) {
    const a = k / 12 * TAU, o = openNear(Math.cos(a) * r, Math.sin(a) * r), y = groundAt(o.x, o.z, 0.6); if (Math.abs(groundAt(o.x, o.z, 40) - y) > 0.3) continue;   // a roof over it
    let open = 0; for (let j = 0; j < 16; j++) { const b = j / 16 * TAU; if (gridClear(o.x, o.z, o.x + Math.cos(b) * 6, o.z + Math.sin(b) * 6, y, y)) open++; }
    const sc = open * 3 - r * 0.25; if (sc > bs) { bs = sc; best = o; }
  }
  return best;
}
function hhSetup() {
  hhClear(); const s = hhLoad(), mi = HH_MISSIONS.findIndex(m => m.map === curMap), di = Math.min(s.diff | 0, hhUnl(s, Math.max(0, mi))), hero = s.hero;
  const c = hhSpot(), by = groundAt(c.x, c.z, 0.6), grp = new THREE.Group(); scene.add(grp);
  const H = M.hh = HH.cur = { grp, mi, di, D: HH_DIFF[di], hero, lv: s.lv, wave: 0, phase: 'prep', t: 90, toSpawn: 0, spawnT: 0, mobs: [], pieces: [], slots: new Map(), traps: [], nodes: [], spits: [], rifts: [], kills: 0, built: 0, crateT: 0, placed: false, over: false, wavesWon: 0, by };
  const pmax = Math.round(1500 * (1 + 0.2 * (s.lv.plant | 0)));
  H.plant = { x: c.x, z: c.z, y: by, hp: pmax, max: pmax, g: hhPlantMesh(), hitT: 0 }; H.plant.g.position.set(c.x, by, c.z); grp.add(H.plant.g);
  H.plantBox = mkBox(c.x, c.z, 2.4, 2.4, 1.1, { y: by }); boxes.push(H.plantBox);   // the pot is solid
  const ml = (s.lv.mats | 0) * 60; H.mats = { wood: 120 + ml + (hero === 'builder' ? 100 : 0), stone: 40 + ml, metal: 30 + ml };
  // the supply crate next to the plant
  const cr = openNear(c.x + 3.6, c.z + 1.5); H.crate = { x: cr.x, z: cr.z, y: groundAt(cr.x, cr.z, by + 0.6) };
  { const g = new THREE.Group(), m = hhStd({ color: 0x3a4a2a, roughness: 0.8 }), st = hhStd({ color: 0x111111, emissive: 0x7aff6a, emissiveIntensity: 1.4 }); const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.8), m); b.position.y = 0.35; g.add(b); const s1 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.82), st); s1.position.y = 0.55; g.add(s1); g.position.set(H.crate.x, H.crate.y, H.crate.z); grp.add(g); H.crate.g = g; }
  // the route map toward the plant (what the horde follows)
  try { H.field = flowField(c.x, c.z, by); } catch (e) { H.field = null; }
  const reach = (x, z, y) => { if (!H.field) return true; const n = nodeOf(x, z, y); return n >= 0 && H.field[n] >= 0; };
  // three SMOKE RIFTS far from the plant, spread round it
  const cand = []; const pr = PLAYRECT;
  for (let i = 0; i < 160; i++) { const o = openNear(rnd(pr[0] + 3, pr[1] - 3), rnd(pr[2] + 3, pr[3] - 3)), y = groundAt(o.x, o.z, 0.6), d = Math.hypot(o.x - c.x, o.z - c.z); if (d < 22 || d > 60 || !reach(o.x, o.z, y)) continue; cand.push({ x: o.x, z: o.z, y, a: Math.atan2(o.z - c.z, o.x - c.x), d }); }
  const a0 = Math.random() * TAU;
  for (let k = 0; k < 3; k++) { const want = a0 + k * TAU / 3; let best = null, bs = 1e9; for (const q of cand) { const da = Math.abs(Math.atan2(Math.sin(q.a - want), Math.cos(q.a - want))), sc = da * 30 - q.d * 0.2; if (sc < bs && !H.rifts.some(r => Math.hypot(r.x - q.x, r.z - q.z) < 14)) { bs = sc; best = q; } } if (best) { const g = hhRiftMesh(); g.position.set(best.x, best.y, best.z); grp.add(g); H.rifts.push(Object.assign(best, { g })); } }
  if (!H.rifts.length) { const o = openNear(c.x + 30, c.z); const g = hhRiftMesh(); g.position.set(o.x, 0, o.z); grp.add(g); H.rifts.push({ x: o.x, z: o.z, y: 0, g }); }
  // harvest nodes round the map
  for (let i = 0; i < 300 && H.nodes.length < 30; i++) { const o = openNear(c.x + rnd(-45, 45), c.z + rnd(-45, 45)), d = Math.hypot(o.x - c.x, o.z - c.z); if (d < 7 || d > 50 || o.x < pr[0] + 2 || o.x > pr[1] - 2 || o.z < pr[2] + 2 || o.z > pr[3] - 2) continue; if (H.nodes.some(n => Math.hypot(n.x - o.x, n.z - o.z) < 4.5) || H.rifts.some(r => Math.hypot(r.x - o.x, r.z - o.z) < 5)) continue;
    const k = HH_MATS[H.nodes.length % 3], y = groundAt(o.x, o.z, 0.6), g = hhNodeMesh(k); g.position.set(o.x, y, o.z); g.rotation.y = Math.random() * TAU; grp.add(g); H.nodes.push({ k, x: o.x, z: o.z, y, g, hp: 6, max: 6 }); }
  // the ghost piece for build mode
  const gm = new THREE.MeshBasicMaterial({ color: 0x5aff8a, transparent: true, opacity: 0.32, depthWrite: false }); HH.ghost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), gm); HH.ghost.visible = false; HH.ghost.renderOrder = 5; scene.add(HH.ghost);
  HH.ghostE = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xbaffd0 })); HH.ghost.add(HH.ghostE);
  HH.build = false; HH.meIn = false; HH.piece = 0; HH.mat = 'wood';
  hhDom(true); try { rebuildBoxGrid(); } catch (e) {}
}
function hhClear() {
  const H = HH.cur; hhBuildMode(false);
  if (HH.ghost) { scene.remove(HH.ghost); HH.ghost = null; }
  if (H) {
    if (H.grp.parent) H.grp.parent.remove(H.grp);
    for (const p of H.pieces) hhPieceRemove(p, true);
    for (const e of H.mobs) { const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); scene.remove(e.group); }
    for (const s of H.spits) scene.remove(s.s);
    const bi = boxes.indexOf(H.plantBox); if (bi >= 0) boxes.splice(bi, 1); try { rebuildBoxGrid(); } catch (e) {}
    HH.cur = null; if (M && M.hh === H) M.hh = null;
  }
  hhDom(false);
}
// the HUD: plant bar (top), materials + build bar (bottom right)
function hhDom(on) {
  for (const id of ['hhBar', 'hhMats']) { const o = $(id); if (o) o.remove(); }
  if (!on) return;
  const b = document.createElement('div'); b.id = 'hhBar'; b.innerHTML = '<small>THE MOTHER PLANT</small><div class="hh-bt"><i></i></div><span></span>'; ($('hud') || document.body).appendChild(b);
  const m = document.createElement('div'); m.id = 'hhMats'; ($('hud') || document.body).appendChild(m);
}
function hhDomTick() {
  const H = M.hh, b = $('hhBar'), m = $('hhMats'); if (!b || !m) return;
  const k = clamp(H.plant.hp / H.plant.max, 0, 1); b.querySelector('i').style.width = (k * 100).toFixed(1) + '%'; b.querySelector('i').style.background = k > 0.5 ? '#7adf6a' : k > 0.25 ? '#ffd24a' : '#ff4a4a'; b.classList.toggle('hit', NOW - H.plant.hitT < 0.3);
  b.querySelector('span').textContent = H.phase === 'prep' ? `WAVE ${H.wave + 1} OF ${HH_WAVES} IN ${Math.ceil(H.t)} s · BUILD!` : H.phase === 'wave' ? `WAVE ${H.wave} OF ${HH_WAVES} · ${H.mobs.length + H.toSpawn} BURNOUTS LEFT` : '';
  const key = HH_MATS.map(k2 => H.mats[k2]).join() + HH.build + HH.piece + HH.mat + (HH.gok ? 1 : 0);
  if (m._k === key) return; m._k = key;
  const P0 = HH_PIECES[HH.piece], cost = hhCost(P0);
  m.innerHTML = `<div class="hh-mrow">${HH_MATS.map(k2 => `<span class="${HH.build && HH.mat === k2 && !P0.trap ? 'on' : ''}" style="--c:${HH_MAT[k2].css}"><small>${HH_MAT[k2].n}</small><b>${H.mats[k2]}</b></span>`).join('')}</div>` +
    (HH.build ? `<div class="hh-prow">${HH_PIECES.map((p, i) => `<span class="${i === HH.piece ? 'on' : ''}"><small>${i + 1}</small>${p.n}</span>`).join('')}</div><div class="hh-cost">${P0.n} · ${Object.entries(cost).map(([k2, v]) => `${v} ${HH_MAT[k2].n}`).join(' + ')}${P0.trap ? '' : ` · ${actName('reload')} MATERIAL`} · CLICK PLACE · ${actName('use')} REMOVE · ${actName('build')} EXIT</div>` : `<div class="hh-tip">${actName('build')} BUILD MODE · ${actName('melee')} HARVEST</div>`);
}

/* ---------- costs and the build grid */
function hhCost(p) { const H = M.hh, k = H && H.hero === 'builder' ? 0.75 : 1, c = typeof p.cost === 'number' ? { [HH.mat]: p.cost } : p.cost, o = {}; for (const m in c) o[m] = Math.max(1, Math.round(c[m] * k)); return o; }
const hhCan = c => Object.entries(c).every(([k, v]) => M.hh.mats[k] >= v);
const hhCellPos = (ix, iz) => ({ x: M.hh.plant.x + ix * HH_C, z: M.hh.plant.z + iz * HH_C });
// what the ghost would place: from where I stand and look
function hhAim() {
  const H = M.hh, P0 = HH_PIECES[HH.piece], fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), ox = H.plant.x, oz = H.plant.z;
  const fl = Math.max(0, Math.round(((P.y || 0) - H.by) / HH_LV)), base = H.by + fl * HH_LV, dir = Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 1 : 3) : (fz > 0 ? 2 : 0);
  const cellOf = (x, z) => [Math.round((x - ox) / HH_C), Math.round((z - oz) / HH_C)];
  if (P0.id === 'wall') { const [ix, iz] = cellOf(P.x, P.z), c = hhCellPos(ix, iz), ex = [0, 1, 0, -1][dir], ez = [-1, 0, 1, 0][dir]; return { id: 'wall', ix, iz, lv: fl, dir, key: `w${ix},${iz},${fl},${dir}|w${ix + ex},${iz + ez},${fl},${(dir + 2) % 4}`, cx: c.x + ex * HH_C / 2, cz: c.z + ez * HH_C / 2, w: ex ? 0.25 : HH_C, d: ex ? HH_C : 0.25, y: base, h: HH_LV }; }
  const [ix, iz] = cellOf(P.x + fx * 2.6, P.z + fz * 2.6), c = hhCellPos(ix, iz);
  if (P0.id === 'floor') { const up = P.pitch > 0.3, top = base + (up ? HH_LV : 0); return { id: 'floor', ix, iz, lv: fl, key: `f${ix},${iz},${top.toFixed(1)}`, cx: c.x, cz: c.z, w: HH_C, d: HH_C, y: top - 0.25, h: 0.25, bad: top - H.by < 1 }; }
  if (P0.id === 'ramp') return { id: 'ramp', ix, iz, lv: fl, dir, key: `c${ix},${iz},${fl}`, cx: c.x, cz: c.z, w: HH_C, d: HH_C, y: base, h: HH_LV };
  return { id: P0.id, ix, iz, lv: fl, key: `t${ix},${iz},${fl}`, cx: c.x, cz: c.z, w: HH_C - 0.2, d: HH_C - 0.2, y: base + groundAt(c.x, c.z, base + 0.6) - base, h: P0.id === 'zapper' ? 2.2 : 0.15, trap: 1 };
}
function hhValid(a) {
  const H = M.hh; if (a.bad) return false; if (H.pieces.length >= 160) return false;
  if (a.key.split('|').some(k => H.slots.has(k))) return false;
  if (Math.abs(a.ix) < 1 && Math.abs(a.iz) < 1 && a.id !== 'wall' && a.lv === 0) return false;   // not on the plant
  const minx = a.cx - a.w / 2, maxx = a.cx + a.w / 2, minz = a.cz - a.d / 2, maxz = a.cz + a.d / 2;
  if (!a.trap && P.x > minx - 0.35 && P.x < maxx + 0.35 && P.z > minz - 0.35 && P.z < maxz + 0.35 && (P.y || 0) < a.y + a.h - 0.3 && (P.y || 0) + 1.7 > a.y + 0.05) return false;   // not inside me
  if (a.cx < PLAYRECT[0] || a.cx > PLAYRECT[1] || a.cz < PLAYRECT[2] || a.cz > PLAYRECT[3]) return false;
  return true;
}
function hhGhostTick() {
  const g = HH.ghost; if (!g) return; if (!HH.build || !playerAlive()) { g.visible = false; return; }
  const a = hhAim(); HH.gspec = a; HH.gok = hhValid(a) && hhCan(hhCost(HH_PIECES[HH.piece]));
  g.visible = true; g.material.color.setHex(HH.gok ? 0x5aff8a : 0xff4a4a); g.scale.set(a.w, a.h, a.d); g.position.set(a.cx, a.y + a.h / 2, a.cz); g.rotation.set(0, 0, 0);
  if (a.id === 'ramp') { const L = Math.hypot(HH_C, HH_LV); g.scale.set(a.dir % 2 ? L : HH_C, 0.2, a.dir % 2 ? HH_C : L); const t = Math.atan2(HH_LV, HH_C); if (a.dir === 0) g.rotation.x = t; else if (a.dir === 2) g.rotation.x = -t; else if (a.dir === 1) g.rotation.z = t; else g.rotation.z = -t; }
  // what I'm looking at (to remove it)
  HH.look = hhLookPiece();
}
function hhLookPiece() {
  const H = M.hh, ray = new THREE.Raycaster(); ray.set(camera.position, new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)); ray.far = 6;
  const ms = []; for (const p of H.pieces) for (const m of p.meshes) ms.push(m); const hit = ray.intersectObjects(ms, false)[0]; if (!hit) return null;
  return H.pieces.find(p => p.meshes.includes(hit.object)) || null;
}
function hhPlace() {
  const H = M.hh, a = hhAim(), P0 = HH_PIECES[HH.piece]; HH.gspec = a; HH.gok = hhValid(a) && hhCan(hhCost(P0)); if (!HH.gok) { try { showMsg(!hhCan(hhCost(P0)) ? 'NOT ENOUGH MATERIALS · HARVEST WITH ' + actName('melee') : "CAN'T BUILD THERE"); tone(160, 0.08, 0.05, 'square'); } catch (e) {} return; }
  const cost = hhCost(P0); for (const k in cost) H.mats[k] -= cost[k];
  const mat = P0.trap ? null : HH.mat, mx = mat ? HH_MAT[mat] : null, hpK = H.hero === 'builder' ? 1.5 : 1;
  const p = { id: a.id, key: a.key, mat, ix: a.ix, iz: a.iz, lv: a.lv, dir: a.dir, cx: a.cx, cz: a.cz, y: a.y, w: a.w, d: a.d, h: a.h, hp: (mx ? mx.hp : 1) * hpK, max: (mx ? mx.hp : 1) * hpK, meshes: [], boxes: [], t: 0, uses: a.id === 'spikes' ? 50 : a.id === 'zapper' ? 40 : 1e9, cd: 0 };
  const add = (cx, cz, w, d, h, y, o) => { const n = boxes.length, m = addBox(cx, cz, w, d, h, mx.key, Object.assign({ y }, o || {})); m.material = m.material.clone(); p.meshes.push(m); if (boxes.length > n) p.boxes.push(boxes[boxes.length - 1]); return m; };
  if (a.id === 'wall' || a.id === 'floor') add(a.cx, a.cz, a.w, a.d, a.h, a.y);
  else if (a.id === 'ramp') { const N = 10, st = ['n', 'e', 's', 'w'][a.dir]; for (let k = 0; k < N; k++) { const f = (k + 0.5) / N - 0.5, sx = [0, 1, 0, -1][a.dir], sz = [-1, 0, 1, 0][a.dir], h = (k + 1) * HH_LV / N; add(a.cx + sx * f * HH_C, a.cz + sz * f * HH_C, sx ? HH_C / N : HH_C, sz ? HH_C / N : HH_C, h, a.y, { stair: st }); } }
  else hhTrapMesh(p);
  for (const m of p.meshes) { m.userData.hhY = m.scale.y; m.scale.y = 0.05; }   // they grow in
  H.pieces.push(p); for (const k of a.key.split('|')) H.slots.set(k, p); if (P0.trap) H.traps.push(p); H.built++;
  try { rebuildBoxGrid(); } catch (e) {} try { burst(0.08, 900, 0.12, 'lowpass'); tone(mat === 'metal' ? 520 : mat === 'stone' ? 220 : 330, 0.06, 0.05, 'triangle'); } catch (e) {}
}
function hhTrapMesh(p) {
  const H = M.hh, g = new THREE.Group(); g.position.set(p.cx, p.y, p.cz); H.grp.add(g); p.g = g;
  if (p.id === 'spikes') { const base = new THREE.Mesh(new THREE.BoxGeometry(HH_C - 0.3, 0.06, HH_C - 0.3), hhStd({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.5 })); base.position.y = 0.03; g.add(base); const sm = hhStd({ color: 0xb8b8c0, metalness: 0.9, roughness: 0.3 }), cone = new THREE.ConeGeometry(0.07, 0.3, 5); for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const s = new THREE.Mesh(cone, sm); s.position.set(-1.1 + i * 0.55, 0.18, -1.1 + j * 0.55); g.add(s); } }
  else if (p.id === 'zapper') { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.8, 8), hhStd({ color: 0x333333, metalness: 0.6, roughness: 0.4 })); pole.position.y = 0.9; g.add(pole); const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.55, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0x113355, emissive: 0x3a9aff, emissiveIntensity: 2, wireframe: true })); cage.position.y = 1.95; g.add(cage); const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: 0x9ad8ff })); core.position.y = 1.95; g.add(core); p.core = core; }
  else { const pud = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.04, 20), hhStd({ color: 0xc87a1a, emissive: 0x3a1a00, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 })); pud.position.y = 0.03; pud.scale.z = 0.92; g.add(pud); }
  g.traverse(o => { if (o.isMesh) p.meshes.push(o); });
}
function hhPieceRemove(p, silent) {
  const H = HH.cur; for (const m of p.meshes) { if (m.parent) m.parent.remove(m); const i = wallMeshes.indexOf(m); if (i >= 0) wallMeshes.splice(i, 1); }
  for (const b of p.boxes) { const i = boxes.indexOf(b); if (i >= 0) boxes.splice(i, 1); } if (p.g && p.g.parent) p.g.parent.remove(p.g);
  if (silent || !H) return; H.pieces = H.pieces.filter(o => o !== p); H.traps = H.traps.filter(o => o !== p); for (const k of p.key.split('|')) if (H.slots.get(k) === p) H.slots.delete(k);
  try { rebuildBoxGrid(); } catch (e) {}
}
function hhPieceHit(p, dmg) {
  if (!p || p.hp <= 0) return; p.hp -= dmg; const k = clamp(p.hp / p.max, 0, 1);
  for (const m of p.meshes) if (m.material && m.material.color) { if (m.userData.c0 === undefined) m.userData.c0 = m.material.color.getHex(); m.material.color.setHex(m.userData.c0).multiplyScalar(0.45 + 0.55 * k); }
  try { chunks(p.mat === 'wood' ? 'wood' : 'dust', new THREE.Vector3(p.cx, p.y + Math.min(p.h, 1.5), p.cz), 4, 2.5, 0.4); sfx.thud(at(p.cx, p.cz, 22)); } catch (e) {}
  if (p.hp <= 0) { hhPieceRemove(p); try { burst(0.25, 500, 0.2, 'lowpass'); chunks(p.mat === 'wood' ? 'wood' : 'dust', new THREE.Vector3(p.cx, p.y + 1, p.cz), 14, 4, 0.7); } catch (e) {} }
}
// a piece in the way of a burnout walking to (tx, tz)
function hhBlocker(x, z, y, tx, tz) {
  const H = M.hh, dx = tx - x, dz = tz - z, L = Math.hypot(dx, dz) || 1, px = x + dx / L * 1.1, pz = z + dz / L * 1.1; let best = null, bd = 1e9;
  for (const p of H.pieces) { if (p.trap || p.hp <= 0) continue; if (y + 1 < p.y || y > p.y + p.h) continue; const cx = clamp(px, p.cx - p.w / 2, p.cx + p.w / 2), cz = clamp(pz, p.cz - p.d / 2, p.cz + p.d / 2), d = Math.hypot(px - cx, pz - cz); if (d < 1.1 && d < bd) { bd = d; best = p; } }
  return best;
}

/* ---------- build mode input */
function hhBuildMode(on) {
  if (HH.build === on) return; HH.build = on; if (HH.ghost) HH.ghost.visible = false;
  try { const gun = gunObjs[G.cur]; if (gun) gun.visible = !on; } catch (e) {}
  if (on) { mouseDown = false; try { sfx.ui(); } catch (e) {} }
}
addEventListener('keydown', e => {
  if (!M || !M.hh || G.state !== 'playing' || curScreen) return; const c = e.code;
  if (c === bind('build') && !e.repeat) { hhBuildMode(!HH.build); e.stopImmediatePropagation(); return; }
  if (!HH.build) return;
  const n = /^Digit([1-6])$/.exec(c); if (n) { HH.piece = +n[1] - 1; e.stopImmediatePropagation(); try { tone(700, 0.03, 0.03, 'square'); } catch (er) {} return; }
  if (c === bind('reload')) { HH.mat = HH_MATS[(HH_MATS.indexOf(HH.mat) + 1) % 3]; e.stopImmediatePropagation(); try { tone(500, 0.03, 0.03, 'square'); } catch (er) {} return; }
  if (c === bind('swap') || c === bind('prim') || c === bind('sec') || c === bind('grenade')) { e.stopImmediatePropagation(); return; }
}, true);
addEventListener('mousedown', e => {
  if (!M || !M.hh || !HH.build || G.state !== 'playing' || curScreen || !document.pointerLockElement) return;
  if (e.button === 0) { e.stopImmediatePropagation(); hhPlace(); }
}, true);
addEventListener('wheel', e => { if (!M || !M.hh || !HH.build || G.state !== 'playing') return; e.stopImmediatePropagation(); HH.piece = (HH.piece + (e.deltaY > 0 ? 1 : HH_PIECES.length - 1)) % HH_PIECES.length; }, true);

/* ---------- the horde */
const HH_MATC = new Map();
function hhMobMat(m, K) {
  const k = m.uuid + K.tint; let c = HH_MATC.get(k); if (c) return c;
  c = zombMat(m).clone(); if (c.color) c.color.lerp(new THREE.Color(K.tint), 0.3); if (c.emissive) c.emissive.setHex(K.boss ? 0x2a0a3a : K.spit ? 0x1a3a08 : 0x14240a); HH_MATC.set(k, c); return c;
}
const HH_EYE = new THREE.MeshBasicMaterial({ color: 0xb8ff5a });
function hhMob(kind, x, z, y) {
  const H = M.hh, K = HH_KINDS[kind], rig = cloneSoldier('rifleman'), root = rig.root;
  root.rotation.order = 'YXZ'; root.position.set(x, y, z); root.scale.setScalar(K.sc); root.userData.scale = K.sc; scene.add(root);
  root.traverse(o => { if (o.isMesh && !o.userData.hitbox) o.material = hhMobMat(o.material, K); });
  if (rig.gun) rig.gun.visible = false;
  for (const s of [-1, 1]) { const ey = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 4), HH_EYE); ey.position.set(s * 0.05, 0.12, 0.11); rig.head.add(ey); }
  const puff = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: K.boss ? 0x9a3aff : 0x7a4aaa, transparent: true, opacity: 0.35, depthWrite: false })); puff.scale.setScalar(K.boss ? 1.6 : 0.8); puff.position.y = 1.5; root.add(puff);
  const hp = Math.round(K.hp * H.D.hp * (1 + 0.12 * (H.wave - 1)));
  const e = { rig, group: root, hhMob: true, team: 9, kind: K.run ? 'run' : 'walk', K, hk: kind, hp, maxHp: hp, speed: rnd(K.sp[0], K.sp[1]), phase: Math.random() * 6, phase0: Math.random() * 6, lurch: rnd(-0.3, 0.3), flinch: 0, atkT: 0, atkCd: rnd(0.3, 0.7), aim: 0, crouchK: 0, chk: 0.6, lastX: x, lastZ: z, slowT: 0, spitT: rnd(1, 2), tgtT: 0, tg: null, bash: null, puff, boss: !!K.boss, dmg: K.dmg };
  rig.hits.forEach(m => { m.userData.enemy = e; });
  enemies.push(e); H.mobs.push(e);
  if (K.boss) try { showBanner('THE OVERGROWN', 'the biggest burnout of them all · protect the plant!'); tone(48, 2.4, 0.2, 'sawtooth', 30); } catch (er) {}
  return e;
}
function hhWaveList(w) {
  const D = M.hh.D, n = Math.round((6 + w * 5) * D.cnt), out = [];
  for (let i = 0; i < n; i++) { const r = Math.random(); out.push(w >= 3 && r < 0.1 ? 'smasher' : w >= 2 && r < 0.27 ? 'sprinter' : w >= 2 && r < 0.42 ? 'spitter' : 'burnout'); }
  if (w >= 3 && !out.includes('smasher')) out[0] = 'smasher';
  if (w >= HH_WAVES) out.splice(Math.floor(n / 2), 0, 'boss');
  return out;
}
function hhStartWave() {
  const H = M.hh; H.wave++; H.phase = 'wave'; H.queue = hhWaveList(H.wave); H.toSpawn = H.queue.length; H.spawnT = 1;
  try { showBanner(`WAVE ${H.wave} OF ${HH_WAVES}`, H.wave === HH_WAVES ? 'the last wave · THE OVERGROWN is coming' : `${H.toSpawn} burnouts are coming out of the rifts`); tone(70, 1.6, 0.18, 'sawtooth'); tone(52, 2.2, 0.14, 'triangle'); } catch (e) {}
  hhBuildMode(false);
}
function hhWaveDone() {
  const H = M.hh; H.wavesWon = H.wave; H.phase = 'prep'; H.t = 45; for (const k of HH_MATS) H.mats[k] += 30;
  if (H.hero === 'medic') H.plant.hp = Math.min(H.plant.max, H.plant.hp + H.plant.max * 0.25);
  if (H.wave >= HH_WAVES) { hhEnd(true); return; }
  try { showBanner(`WAVE ${H.wave} HELD`, `+30 of each material · wave ${H.wave + 1} in 45 s · build!`); sfx.streak(); } catch (e) {}
}
function hhMobTick(e, dt, i) {
  const H = M.hh, g = e.group.position, pl = H.plant, K = e.K;
  if ((e.tgtT -= dt) <= 0) {   // the nearest of us close by, else the plant
    e.tgtT = 0.4; e.tg = null; const R = K.spit ? 13 : 7; let bd = R;
    if (playerAlive()) { const d = Math.hypot(P.x - g.x, P.z - g.z); if (d < bd && Math.abs((P.y || 0) - g.y) < 2.6) { bd = d; e.tg = 'P'; } }
    for (const o of enemies) if (o.entry && o.team === M.myTeam && o.entry.alive !== false) { const d = Math.hypot(o.group.position.x - g.x, o.group.position.z - g.z); if (d < bd && Math.abs(o.group.position.y - g.y) < 2.6) { bd = d; e.tg = o; } }
  }
  if (e.tg && e.tg !== 'P' && !enemies.includes(e.tg)) e.tg = null; if (e.tg === 'P' && !playerAlive()) e.tg = null;
  const T = e.tg === 'P' ? { x: P.x, z: P.z, y: P.y || 0 } : e.tg ? e.tg.group.position : { x: pl.x, z: pl.z, y: pl.y };
  const dx = T.x - g.x, dz = T.z - g.z, dist = Math.max(0.001, Math.hypot(dx, dz)), nx = dx / dist, nz = dz / dist, reach = e.tg ? 1.5 * K.sc : 1.9 + 0.3 * K.sc;
  let mx = 0, mz = 0, hitting = null;
  if (e.bash && e.bash.hp <= 0) e.bash = null;
  if (K.spit && dist < 12.5 && gridClear(g.x, g.z, T.x, T.z, g.y, T.y)) { if ((e.spitT -= dt) <= 0) { e.spitT = rnd(2.2, 2.8); hhSpit(e, T); } }
  else if (e.bash) hitting = 'piece';
  else if (dist < reach) hitting = 'tgt';
  else {
    if (e.tg || dist < 4 || !H.field) { mx = nx; mz = nz; if (!e.tg && !gridClear(g.x, g.z, T.x, T.z, g.y, T.y) && H.field) { const d = flowDir(H.field, g.x, g.z, g.y); if (d) { mx = d[0]; mz = d[1]; } } }
    else { const d = flowDir(H.field, g.x, g.z, g.y); if (d) { mx = d[0]; mz = d[1]; } else { mx = nx; mz = nz; } }
  }
  if (hitting) {   // swing: at the piece in the way, or at the target
    if (e.atkT > 0) { e.atkT -= dt; if (!e.hitDone && e.atkT < 0.3) { e.hitDone = true;
      if (hitting === 'piece') hhPieceHit(e.bash, K.bdmg * (H.D.hp > 1 ? 1.15 : 1));
      else if (e.tg === 'P') { if (dist < reach + 0.4) try { hurtPlayer(K.dmg, g.x, g.z); sfx.melee && sfx.melee(); } catch (er) {} }
      else if (e.tg) { if (dist < reach + 0.4) try { damageEnemy(e.tg, K.dmg, false, null, false, 'world'); } catch (er) {} }
      else hhPlantHit(K.dmg * (K.boss ? 2 : 1)); } }
    else if ((e.atkCd -= dt) <= 0) { e.atkT = 0.75; e.hitDone = false; e.atkCd = rnd(0.6, 1.0) * (K.boss ? 1.3 : 1); if (Math.random() < 0.5) try { sfx.zscreech(at(g.x, g.z, 14, g.y)); } catch (er) {} }
  }
  const slow = H.traps.some(p => p.id === 'resin' && Math.abs(g.x - p.cx) < 1.5 && Math.abs(g.z - p.cz) < 1.5 && Math.abs(g.y - p.y) < 1) ? 0.4 : 1;
  const ml = Math.hypot(mx, mz), sp = ml > 0.01 ? e.speed * slow * (e.slowT > 0 ? 0.5 : 1) : 0; e.slowT = Math.max(0, e.slowT - dt);
  if (ml > 0.01) { const x0 = g.x, z0 = g.z; g.x += mx / ml * sp * dt; g.z += mz / ml * sp * dt; resolve(g, 0.42 * K.sc, g.y, true);
    const moved = Math.hypot(g.x - x0, g.z - z0); if (moved < sp * dt * 0.35) { e.stuckT = (e.stuckT || 0) + dt; if (e.stuckT > 0.35) { e.bash = hhBlocker(g.x, g.z, g.y, g.x + mx, g.z + mz); e.stuckT = 0; if (!e.bash) { e.avoidT = 0.8; } } } else e.stuckT = 0; }
  if (e.avoidT > 0) { e.avoidT -= dt; g.x += -mz / (ml || 1) * 1.2 * dt; g.z += mx / (ml || 1) * 1.2 * dt; resolve(g, 0.42 * K.sc, g.y, true); }
  botGround(e.group, dt);
  for (let j = 0; j < H.mobs.length; j++) { if (j === i) continue; const o = H.mobs[j].group.position, sx = g.x - o.x, sz = g.z - o.z, sd = Math.hypot(sx, sz), R = 0.8 * K.sc; if (sd < R && sd > 0.001) { const pu = (R - sd) * 0.5; g.x += sx / sd * pu; g.z += sz / sd * pu; } }
  const face = e.bash ? Math.atan2(e.bash.cx - g.x, e.bash.cz - g.z) : ml > 0.01 && dist > 2 ? Math.atan2(mx, mz) : Math.atan2(dx, dz); let dy = face - e.group.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; e.group.rotation.y += dy * Math.min(1, dt * 6);
  e.puff.material.opacity = 0.25 + Math.sin(NOW * 3 + e.phase0) * 0.1;
  animZombie(e, dt, sp);
}
function hhPlantHit(dmg) {
  const H = M.hh; if (H.over) return; H.plant.hp -= dmg; H.plant.hitT = NOW; try { tone(140, 0.12, 0.06, 'square', 90); } catch (e) {}
  if (!H.plantWarn || NOW - H.plantWarn > 6) { H.plantWarn = NOW; try { showMsg('THE MOTHER PLANT IS UNDER ATTACK!'); } catch (e) {} }
  if (H.plant.hp <= 0) hhEnd(false);
}
// SPITTERS lob goo: it lands on the first piece in the way, else on the target
function hhSpit(e, T) {
  const H = M.hh, g = e.group.position, from = new THREE.Vector3(g.x, g.y + 1.6 * e.K.sc, g.z); let hit = null, to = new THREE.Vector3(T.x, (T.y || 0) + 1.1, T.z);
  for (let k = 1; k <= 12 && !hit; k++) { const f = k / 12, x = from.x + (to.x - from.x) * f, z = from.z + (to.z - from.z) * f, y = from.y + (to.y - from.y) * f + Math.sin(f * Math.PI) * 2; for (const p of H.pieces) if (!p.trap && Math.abs(x - p.cx) < p.w / 2 + 0.1 && Math.abs(z - p.cz) < p.d / 2 + 0.1 && y > p.y && y < p.y + p.h) { hit = p; to.set(x, y, z); break; } }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0x9aff3a, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9, depthWrite: false })); s.scale.setScalar(0.5); s.position.copy(from); scene.add(s);
  H.spits.push({ s, from, to, t: 0, T: 0.9, hit, tg: e.tg, dmg: e.K.dmg }); try { burst(0.2, 700, 0.06, 'bandpass', at(g.x, g.z, 20)); } catch (er) {}
}
function hhSpitTick(dt) {
  const H = M.hh;
  for (let i = H.spits.length - 1; i >= 0; i--) { const q = H.spits[i]; q.t += dt; const f = Math.min(1, q.t / q.T); q.s.position.lerpVectors(q.from, q.to, f); q.s.position.y += Math.sin(f * Math.PI) * 2;
    if (f >= 1) { scene.remove(q.s); H.spits.splice(i, 1); try { chunks('dust', q.to.clone(), 5, 2, 0.5); } catch (e) {}
      if (q.hit) hhPieceHit(q.hit, 20); else if (q.tg === 'P') { if (playerAlive() && Math.hypot(P.x - q.to.x, P.z - q.to.z) < 1.6) try { hurtPlayer(q.dmg, q.from.x, q.from.z); } catch (e) {} } else if (q.tg && enemies.includes(q.tg)) { if (Math.hypot(q.tg.group.position.x - q.to.x, q.tg.group.position.z - q.to.z) < 1.6) try { damageEnemy(q.tg, q.dmg, false, null, false, 'world'); } catch (e) {} } else if (Math.hypot(q.to.x - H.plant.x, q.to.z - H.plant.z) < 2.5) hhPlantHit(q.dmg); } }
}
// traps
function hhTrapTick(dt) {
  const H = M.hh, tk = 1 + 0.2 * (H.lv.trap | 0);
  for (const p of H.traps.slice()) {
    if (p.id === 'resin') continue; p.cd -= dt; if (p.cd > 0) continue;
    if (p.id === 'spikes') { let any = false; for (const e of H.mobs) { const g = e.group.position; if (Math.abs(g.x - p.cx) < 1.5 && Math.abs(g.z - p.cz) < 1.5 && Math.abs(g.y - p.y) < 0.8) { any = true; hhTrapDmg(e, 28 * tk); } } if (any) { p.cd = 0.5; p.uses--; for (const m of p.meshes) if (m.geometry.type === 'ConeGeometry') m.position.y = 0.32; setTimeout(() => { for (const m of p.meshes) if (m.geometry.type === 'ConeGeometry') m.position.y = 0.18; }, 160); try { burst(0.06, 2500, 0.06, 'highpass', at(p.cx, p.cz, 18)); } catch (e) {} } }
    else if (p.id === 'zapper') { let best = null, bd = 5; for (const e of H.mobs) { const d = Math.hypot(e.group.position.x - p.cx, e.group.position.z - p.cz); if (d < bd && Math.abs(e.group.position.y - p.y) < 2.5) { bd = d; best = e; } } if (best) { p.cd = 1.1; p.uses--; hhTrapDmg(best, 60 * tk); best.slowT = 0.6; hhZapFx(new THREE.Vector3(p.cx, p.y + 1.95, p.cz), best.group.position.clone().setY(best.group.position.y + 1.2)); } }
    if (p.uses <= 0) { hhPieceRemove(p); try { showMsg(`A ${p.id === 'spikes' ? 'SPIKE TRAP' : 'BUG ZAPPER'} WORE OUT`); } catch (e) {} }
  }
}
function hhTrapDmg(e, dmg) { try { damageEnemy(e, dmg, false, null, false, 'world'); } catch (er) {} }
function hhZapFx(a, b) {
  const pts = []; for (let k = 0; k <= 8; k++) { const f = k / 8; pts.push(new THREE.Vector3(a.x + (b.x - a.x) * f + (k % 8 ? rnd(-0.2, 0.2) : 0), a.y + (b.y - a.y) * f + (k % 8 ? rnd(-0.2, 0.2) : 0), a.z + (b.z - a.z) * f + (k % 8 ? rnd(-0.2, 0.2) : 0))); }
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x9ad8ff })); scene.add(l); setTimeout(() => { scene.remove(l); l.geometry.dispose(); }, 110);
  try { tone(1200, 0.08, 0.04, 'sawtooth', 300, at(a.x, a.z, 20)); } catch (e) {}
}
// harvesting: a melee swing at a pallet stack / rock pile / scrap heap
function hhHarvest() {
  const H = M.hh, fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); let best = null, bd = 2.7;
  for (const n of H.nodes) { if (n.hp <= 0) continue; const dx = n.x - P.x, dz = n.z - P.z, d = Math.hypot(dx, dz); if (d < bd && (dx * fx + dz * fz) / (d || 1) > 0.4 && Math.abs(n.y - (P.y || 0)) < 1.6) { bd = d; best = n; } }
  if (!best) return; const n = best, got = Math.round(rnd(9, 14) * (H.hero === 'scrapper' ? 2 : 1)); n.hp--; H.mats[n.k] += got;
  n.g.scale.setScalar(0.55 + 0.45 * n.hp / n.max); n.g.rotation.z = rnd(-0.08, 0.08); setTimeout(() => { if (n.g) n.g.rotation.z = 0; }, 90);
  try { chunks(n.k === 'wood' ? 'wood' : 'dust', new THREE.Vector3(n.x, n.y + 0.5, n.z), 6, 3, 0.5); n.k === 'metal' ? tone(rnd(700, 900), 0.08, 0.06, 'square', 400) : burst(0.1, n.k === 'stone' ? 1500 : 900, 0.18, 'bandpass'); showMsg(`+${got} ${HH_MAT[n.k].n}`); } catch (e) {}
  if (n.hp <= 0) { n.g.parent && n.g.parent.remove(n.g); }
}
function hhEnd(won) {
  const H = M.hh; if (H.over) return; H.over = true; hhBuildMode(false);
  const s = hhLoad(), D = H.D, seeds = won ? Math.round((300 + H.kills * 3) * D.seeds) : Math.round(H.wavesWon * 50 * D.seeds + H.kills);
  s.games++; s.kills += H.kills; s.built += H.built; s.seeds += seeds; if (won) { s.wins++; const mi = Math.max(0, H.mi); s.unl[mi] = Math.max(hhUnl(s, mi), Math.min(HH_DIFF.length - 1, H.di + 1)); }
  const b = s.best[curMap] || { w: 0, won: false, d: 0 }; if (won && (!b.won || H.di > b.d)) s.best[curMap] = { w: HH_WAVES, won: true, d: H.di }; else if (!b.won && H.wavesWon > b.w) s.best[curMap] = { w: H.wavesWon, won: false, d: H.di }; hhSave(s);
  H.res = { won, seeds, kills: H.kills, built: H.built, waves: H.wavesWon, plant: Math.max(0, Math.round(H.plant.hp / H.plant.max * 100)) };
  try { if (won) brpXP(Math.round(2500 * D.seeds), 'HOTBOX HORDE · THE PLANT IS SAFE'); } catch (e) {}
  if (!won) try { showBanner('THE MOTHER PLANT IS GONE', 'the burnouts got her'); } catch (e) {}
  setTimeout(() => { try { if (M && M.hh === H) endMatch(won ? M.me : null); } catch (e) { reportError(e); } }, won ? 1500 : 2200);
}
// the results: what the mission paid
const _hhRes = showResults;
showResults = function (winner, won) {
  const r = _hhRes.apply(this, arguments);
  try { const R = M && M.hh && M.hh.res; if (R) { $('resTitle').textContent = R.won ? 'GROW DEFENDED' : 'GROW LOST'; $('resTitle').className = 'res-title ' + (R.won ? 'win' : 'lose'); $('resSub').textContent = `HOTBOX HORDE · ${HH_MISSIONS[Math.max(0, M.hh.mi)] ? HH_MISSIONS[Math.max(0, M.hh.mi)].n : ''} · ${M.hh.D.n}`;
    $('resBoard').insertAdjacentHTML('afterbegin', `<div class="hh-res">${[['WAVES HELD', `${R.waves} / ${HH_WAVES}`], ['MOTHER PLANT', R.plant + '%'], ['BURNOUTS DOWN', R.kills], ['PIECES BUILT', R.built], ['SEEDS EARNED', '+' + R.seeds.toLocaleString()]].map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('')}</div>`); } } catch (e) {}
  return r;
};
// bots: guard the plant
function hhGoal(e, keep, near, set) {
  const H = M.hh, pl = H.plant; if (keep && e.goal && Math.hypot(e.goal.x - pl.x, e.goal.z - pl.z) < 10) return e.goal;
  const a = Math.random() * TAU, r = H.phase === 'wave' ? rnd(4, 9) : rnd(3, 7); return set(near({ x: pl.x + Math.cos(a) * r, z: pl.z + Math.sin(a) * r, y: pl.y }, 2), rnd(3, 6));
}
// my hits on the horde: GUNNER +25%, SCRAPPER melee x3
const _hhDmg = damageEnemy;
damageEnemy = function (e, dmg, head, dir, boom, by) {
  if (e && e.hhMob && M && M.hh) { if (by === 'player' && M.hh.hero === 'gunner') dmg *= 1.25; if (by === 'player' && M.hh.hero === 'scrapper' && G.meleeT > 0) dmg *= 3; }
  return _hhDmg.apply(this, [e, dmg, head, dir, boom, by]);
};
function hhPlaceNear(o, isMe) {
  const H = M.hh, a = Math.random() * TAU, q = openNear(H.plant.x + Math.cos(a) * rnd(3.5, 6), H.plant.z + Math.sin(a) * rnd(3.5, 6)), y = groundAt(q.x, q.z, H.by + 0.6);
  if (isMe) { P.x = q.x; P.z = q.z; P.y = y; P.vx = P.vz = P.vy = 0; P.yaw = Math.atan2(q.x - H.plant.x, q.z - H.plant.z); } else { o.group.position.set(q.x, y, q.z); o.goal = null; }
}
/* ---------- every frame (from m2Update) */
function hhTick(dt) {
  const H = M.hh; if (!H || M.over) return;
  if (!H.placed) { H.placed = true; hhPlaceNear(null, true); for (const e of enemies) if (e.entry) { hhPlaceNear(e); e.hhIn = true; } showBanner('HOTBOX HORDE', `harvest with ${actName('melee')} · ${actName('build')} to build · wave 1 in 90 s`); }
  if (playerAlive()) { if (!HH.meIn) { HH.meIn = true; if (H.placed && M.t > 1) hhPlaceNear(null, true); } } else { HH.meIn = false; hhBuildMode(false); }
  for (const e of enemies) if (e.entry && !e.hhIn) { e.hhIn = true; hhPlaceNear(e); }
  // the phase
  if (H.phase === 'prep' && !H.over) {
    H.t -= dt; const near = playerAlive() && Math.hypot(P.x - H.plant.x, P.z - H.plant.z) < 3.4, u = kb('use') || pad.use;
    if (near && !HH.build) { if (u) { H.ready = (H.ready || 0) + dt; showMsgOnce(`STARTING WAVE ${H.wave + 1} · ${Math.min(100, Math.round(H.ready / 1.2 * 100))}%`); if (H.ready >= 1.2) H.t = 0; } else { H.ready = 0; showMsgOnce(`THE MOTHER PLANT · HOLD ${actName('use')} TO START WAVE ${H.wave + 1} NOW`); } }
    if (H.t <= 0) hhStartWave();
  } else if (H.phase === 'wave') {
    if (H.toSpawn > 0 && (H.spawnT -= dt) <= 0 && H.mobs.length < 26) { const R = H.rifts[(H.toSpawn + H.wave) % H.rifts.length], k = H.queue[H.queue.length - H.toSpawn]; hhMob(k, R.x + rnd(-1, 1), R.z + rnd(-1, 1), R.y); H.toSpawn--; H.spawnT = Math.max(0.45, 1.1 - H.wave * 0.1); }
    if (H.toSpawn <= 0 && !H.mobs.length) hhWaveDone();
  }
  // the horde
  for (let i = H.mobs.length - 1; i >= 0; i--) { const e = H.mobs[i]; if (!enemies.includes(e)) { H.mobs.splice(i, 1); H.kills++; if (Math.random() < 0.5) H.mats[HH_MATS[(Math.random() * 3) | 0]] += 4; continue; } }
  for (let i = 0; i < H.mobs.length; i++) hhMobTick(H.mobs[i], dt, i);
  hhSpitTick(dt); hhTrapTick(dt);
  // the scene: rifts spin, the plant breathes, pieces grow in, zapper cores flicker
  for (const R of H.rifts) { R.g.userData.ring.rotation.z += dt * (H.phase === 'wave' ? 2.5 : 0.6); R.g.userData.core.material.opacity = (H.phase === 'wave' ? 0.85 : 0.45) + Math.sin(NOW * 4) * 0.1; }
  const pg = H.plant.g; pg.userData.light.intensity = 1.2 + Math.sin(NOW * 1.5) * 0.15; pg.rotation.y += dt * 0.05; for (const b of pg.userData.buds) b.scale.x = b.scale.z = 1 + Math.sin(NOW * 2 + b.position.y) * 0.06;
  for (const p of H.pieces) { if (p.t < 0.35) { p.t += dt; const k = Math.min(1, p.t / 0.35); for (const m of p.meshes) if (m.userData.hhY !== undefined) m.scale.y = Math.max(0.05, m.userData.hhY * k); } if (p.core) p.core.material.color.setHex(p.cd > 0.9 ? 0xffffff : 0x9ad8ff); }
  // me: harvesting, the supply crate, the medic's healing, build mode
  if (G.meleeT > 0.4 && G.meleeT !== HH.lastMelee && !HH.swing) { HH.swing = true; setTimeout(() => { try { if (M && M.hh) hhHarvest(); } catch (e) {} }, 140); } if (G.meleeT <= 0) HH.swing = false; HH.lastMelee = G.meleeT;
  { const c = H.crate, u = kb('use') || pad.use; H.crateT = Math.max(0, H.crateT - dt); if (playerAlive() && Math.hypot(P.x - c.x, P.z - c.z) < 2 && !HH.build) { showMsgOnce(H.crateT > 0 ? `SUPPLY CRATE · READY IN ${Math.ceil(H.crateT)} s` : `SUPPLY CRATE · PRESS ${actName('use')} FOR AMMO`); if (u && !HH.uH && H.crateT <= 0) { H.crateT = H.hero === 'gunner' ? 15 : 30; WEAPONS.forEach(w => { w.ammo = w.magSize; w.reserve = w.reserveMax || w.def.reserve; }); G.grenades = Math.max(G.grenades, 2); try { showMsg('AMMO REFILLED'); sfx.pickup(); } catch (e) {} } } }
  if (H.hero === 'medic' && playerAlive()) { G.health = Math.min(G.maxHp || 100, G.health + 4 * dt); for (const e of enemies) if (e.entry && e.team === M.myTeam && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 8) e.hp = Math.min(e.maxHp, e.hp + 8 * dt); }
  if (HH.build) { G.swapT = Math.max(G.swapT, 0.15); mouseDown = false; try { const gun = gunObjs[G.cur]; if (gun) gun.visible = false; } catch (e) {} const u = kb('use') || pad.use; if (u && !HH.uH && HH.look) { const p = HH.look, r = p.mat ? { [p.mat]: 5 } : {}; for (const k in r) H.mats[k] += r[k]; hhPieceRemove(p); HH.look = null; try { showMsg('PIECE REMOVED'); } catch (e) {} } }
  HH.uH = kb('use') || pad.use;
  hhPadTick();
  hhGhostTick(); hhDomTick();
}
// controller: D-pad right toggles build mode; in it D-pad up / down pick the piece, Y the material, RT places
function hhPadTick() {
  let gp = null; try { gp = (navigator.getGamepads ? [...navigator.getGamepads()] : []).find(g => g && g.connected); } catch (e) {} if (!gp) return;
  const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed), was = HH.padB || {}, now = {}; for (const i of [3, 7, 12, 13, 15]) now[i] = b(i); HH.padB = now; const press = i => now[i] && !was[i];
  if (press(15) && playerAlive()) hhBuildMode(!HH.build);
  if (!HH.build) return;
  if (press(12)) HH.piece = (HH.piece + HH_PIECES.length - 1) % HH_PIECES.length; if (press(13)) HH.piece = (HH.piece + 1) % HH_PIECES.length;
  if (press(3)) HH.mat = HH_MATS[(HH_MATS.indexOf(HH.mat) + 1) % 3]; if (press(7)) hhPlace();
  pad.fire = false;
}
function hhHud() { const H = M.hh; if (!H) return ''; return `${H.D.n} · ${HH_HEROES.find(h => h.id === H.hero).n} · ${H.phase === 'prep' ? `<b>BUILD</b> · WAVE ${H.wave + 1} IN ${Math.ceil(H.t)} s` : `<b>WAVE ${H.wave}</b> · ${H.mobs.length + H.toSpawn} LEFT`} · ${H.kills} DOWN`; }
function hhMarkers(out) {
  const H = M.hh; if (!H) return;
  out.push({ x: H.plant.x, y: H.plant.y + 5.9, z: H.plant.z, t: `MOTHER PLANT ${Math.max(0, Math.round(H.plant.hp / H.plant.max * 100))}%`, c: '#b070ff' });
  for (const R of H.rifts) out.push({ x: R.x, y: R.y + 4, z: R.z, t: 'RIFT', c: '#a040ff' });
  for (const n of H.nodes) if (n.hp > 0 && Math.hypot(n.x - P.x, n.z - P.z) < 14) out.push({ x: n.x, y: n.y + 1.3, z: n.z, t: HH_MAT[n.k].n, c: HH_MAT[n.k].css });
  if (Math.hypot(H.crate.x - P.x, H.crate.z - P.z) < 30) out.push({ x: H.crate.x, y: H.crate.y + 1.2, z: H.crate.z, t: 'AMMO', c: '#7aff6a' });
  for (const e of H.mobs) if (e.boss) out.push({ x: e.group.position.x, y: e.group.position.y + 4, z: e.group.position.z, t: `THE OVERGROWN ${Math.max(0, Math.round(e.hp / e.maxHp * 100))}%`, c: '#ff4a6a' });
}
(() => { const s = document.createElement('style'); s.textContent = `#menu .cod-tile.hh-tile{order:4;grid-column:1/-1;background:linear-gradient(110deg,rgba(150,70,255,.25),rgba(90,220,110,.10) 60%,rgba(255,255,255,.02))}
#hhBar{position:fixed;top:64px;left:50%;transform:translateX(-50%);width:min(420px,70vw);text-align:center;pointer-events:none;z-index:6;font:600 11px/1.2 inherit;letter-spacing:.18em;color:#e8d8ff;text-shadow:0 1px 3px #000}
#hhBar small{display:block;font-size:9px;opacity:.85}#hhBar .hh-bt{height:9px;margin:4px 0;background:rgba(20,10,30,.7);border:1px solid rgba(190,140,255,.5)}#hhBar .hh-bt i{display:block;height:100%;transition:width .2s}#hhBar.hit .hh-bt{border-color:#ff4a4a;box-shadow:0 0 12px #ff4a4a}#hhBar span{font-size:10px}
#hhMats{position:fixed;right:18px;bottom:150px;pointer-events:none;z-index:6;text-align:right;font-family:inherit;color:#fff;text-shadow:0 1px 3px #000}
.hh-mrow{display:flex;gap:6px;justify-content:flex-end}.hh-mrow span{border:1px solid rgba(255,255,255,.18);background:rgba(10,10,14,.55);padding:3px 8px;min-width:52px}.hh-mrow span.on{border-color:var(--c);box-shadow:0 0 8px var(--c)}.hh-mrow small{display:block;font-size:8px;letter-spacing:.2em;color:var(--c)}.hh-mrow b{font-size:15px}
.hh-prow{display:flex;gap:4px;justify-content:flex-end;margin-top:6px}.hh-prow span{font-size:9px;letter-spacing:.1em;border:1px solid rgba(255,255,255,.15);background:rgba(10,10,14,.55);padding:4px 6px}.hh-prow span.on{border-color:#5aff8a;color:#5aff8a}.hh-prow small{display:block;font-size:8px;opacity:.6}
.hh-cost,.hh-tip{margin-top:5px;font-size:9px;letter-spacing:.14em;opacity:.85}
#lobby.hhl .hh-ups{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px}.hh-up{border:1px solid rgba(255,255,255,.12);padding:6px 8px;background:rgba(255,255,255,.03)}.hh-up small{display:block;font-size:9px;letter-spacing:.16em;opacity:.8}.hh-up b{display:block;font-size:13px;margin:2px 0}.hh-up span{display:block;font-size:10px;opacity:.7}.hh-up .hh-buy{margin-top:5px;width:100%}
.hh-res{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:0 0 12px}.hh-res div{border:1px solid rgba(176,112,255,.4);background:rgba(40,20,60,.55);padding:8px 10px}.hh-res small{display:block;color:#c8a0ff;letter-spacing:2px;font-size:11px}.hh-res b{display:block;font-size:19px;margin-top:2px}`; document.head.appendChild(s); })();
