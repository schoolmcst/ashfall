/* ================================================================== LAST TOKE LOOT 2.0 (1.2.92)
   RARITY: every gun you find is COMMON (white), RARE (blue), EPIC (purple) or LEGENDARY (gold). Better ones hit harder,
     reload faster and kick less (BRL_RAR); the gun itself glows in its colour and its name on the HUD is coloured.
   ATTACHMENTS ON THE GROUND: a red dot, a 4x scope, a holo, a suppressor, a compensator, an extended mag, a grip or a
     laser. Picking one up puts it in your KIT: it snaps onto every gun it fits (now and later); one per slot.
   AMMO TYPES: LIGHT (pistols, SMGs), HEAVY (rifles, LMGs), SHELLS (shotguns), SNIPER (snipers, marksman). Each type is
     one shared pool (BRL.ammo); the guns' reserve is that pool. Ammo cans on the floor, crates give the gun's type.
   HEALS (key 5 / D-pad up in LAST TOKE): a NUG (+25), a BROWNIE (+50 over 5 s), a MEDICAL JOINT (full). The best
     one for what you're missing is used; firing cancels it.
   FLOOR LOOT that looks like it belongs: about half the loot spots get furniture instead of a crate - a TABLE with a
     gun on it and an ammo can, a WALL RACK with one or two guns, a SHELF with heals, ammo and an attachment, or (in the
     open) a PALLET. Furniture backs onto the nearest wall. A thin light strip in the item's rarity colour sits under it.
     Taking a gun puts your old one down in its place.
   Online: the host's seed (end of the 'b' pack) builds the same floor loot everywhere; what you take goes out as presence
     fl, the gun you put down as fd. */
const BRL_RAR = [
  { n: 'COMMON', col: 0xe8e8e8, css: '#e8e8e8', dmg: 1, rel: 1, rec: 1 },
  { n: 'RARE', col: 0x3a9aff, css: '#5ab0ff', dmg: 1.07, rel: 0.95, rec: 0.95 },
  { n: 'EPIC', col: 0xb04aff, css: '#c47aff', dmg: 1.14, rel: 0.9, rec: 0.9 },
  { n: 'LEGENDARY', col: 0xffc83a, css: '#ffd25a', dmg: 1.22, rel: 0.82, rec: 0.84 },
];
const BRL_AMMO = { light: { n: 'LIGHT', col: 0xd8b03a, can: 30, max: 240 }, heavy: { n: 'HEAVY', col: 0x5a8a3a, can: 30, max: 240 }, shells: { n: 'SHELLS', col: 0xc0402a, can: 12, max: 60 }, sniper: { n: 'SNIPER', col: 0x3a6ac0, can: 10, max: 60 } };
const BRL_KIT = [
  { id: 'reddot', n: 'RED DOT' }, { id: 'holo', n: 'HOLO SIGHT' }, { id: 'acog4', n: '4× SCOPE' }, { id: 'suppressor', n: 'SUPPRESSOR' },
  { id: 'comp', n: 'COMPENSATOR' }, { id: 'extmag', n: 'EXTENDED MAG' }, { id: 'vgrip', n: 'VERTICAL GRIP' }, { id: 'laser', n: 'LASER' },
];
const BRL_HEAL = { nug: { n: 'NUG', hp: 25, t: 1.2, max: 6 }, brownie: { n: 'BROWNIE', hp: 50, t: 2.4, max: 3, over: 5 }, joint: { n: 'MEDICAL JOINT', hp: 999, t: 4.5, max: 2 } };
const BRL = { items: [], sets: [], group: null, seed: 0, rar: {}, kit: {}, ammo: { light: 36, heavy: 0, shells: 0, sniper: 0 }, heals: { nug: 0, brownie: 0, joint: 0 }, heal: null, regen: 0, uH: false, hH: false, taken: new Set(), out: [], drops: [], dropSeen: new Set(), visT: 0, tpl: {}, near: null };
const brlAmmoOf = def => { const c = def && def.cat; return c === 'pi' || c === 'smg' ? 'light' : c === 'sg' ? 'shells' : c === 'sr' || c === 'mr' ? 'sniper' : 'heavy'; };
const brlOn = () => !!(M && M.br && MAPS[curMap] && MAPS[curMap].loot);
const brlHash = (x, z, y) => { let h = Math.imul(Math.round(x * 10) ^ 0x9e37, 2654435761) ^ Math.imul(Math.round(z * 10) + 7, 1597334677) ^ Math.imul(Math.round((y || 0) * 10) + 3, 374761393); h = Math.imul(h ^ (h >>> 15), 2246822519); return ((h ^ (h >>> 13)) >>> 0); };
// about half of a map's loot spots are floor loot (the same half everywhere, so the host's crates skip them)
const brlFloorSpot = s => brlOn() && brlHash(s.x, s.z, s.y) % 100 < 48;
function brlRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- stats: rarity and the kit, through the attachment system */
const _brlCompute = computeStats;
computeStats = function (def, override, factory) {
  if (!(factory && M && M.br && def) || override) return _brlCompute(def, override, factory);
  const save = ATTS[def.id], map = {}; let any = false;
  for (const slot of slotsFor(def)) { const k = BRL.kit[slot], a = k && ATT_BY_ID[k]; if (a && attOK(a, def)) { map[slot] = k; any = true; } }
  let s; if (any) { ATTS[def.id] = map; try { s = _brlCompute(def, null, false); } finally { if (save === undefined) delete ATTS[def.id]; else ATTS[def.id] = save; } } else s = _brlCompute(def, null, true);
  const R = BRL_RAR[BRL.rar[def.id] | 0]; if (R) { s.dmg *= R.dmg; s.reload *= R.rel; s.recoil *= R.rec; }
  return s;
};
const _brlVis = buildAttachmentVisuals;
buildAttachmentVisuals = function (wi) {
  const w = WEAPONS[wi]; if (!(w && w.factory && M && M.br)) return _brlVis(wi);
  const def = w.def, save = ATTS[def.id], map = {}; let any = false;
  for (const slot of slotsFor(def)) { const k = BRL.kit[slot], a = k && ATT_BY_ID[k]; if (a && attOK(a, def)) { map[slot] = k; any = true; } }
  if (!any) return _brlVis(wi);
  ATTS[def.id] = map; try { attachVisuals(gunObjs[wi], def, false, w.len, null); } finally { if (save === undefined) delete ATTS[def.id]; else ATTS[def.id] = save; }
};
// the gun glows in its rarity colour (its own copies of the materials, put back outside LAST TOKE)
function brlTint(g, tier) {
  if (!g) return; const on = M && M.br && tier > 0, col = on ? new THREE.Color(BRL_RAR[tier].col) : null;
  const skip = new Set(); for (const h of [g.userData.handL, g.userData.handR]) if (h && h.traverse) h.traverse(o => skip.add(o));   // not the hands
  g.traverse(o => { if (/hand|arm|glove|sleeve|skin/i.test(o.name || '')) o.traverse(c => skip.add(c)); });
  g.traverse(o => {
    if (!o.isMesh || !o.material || o.userData.brlSkip || skip.has(o)) return;
    if (!on) { if (o.userData.brlMat0) { o.material = o.userData.brlMat0; o.userData.brlMat0 = null; } return; }
    if (!o.userData.brlMat0) { o.userData.brlMat0 = o.material; o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); }
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m.emissive) { m.emissive.copy(col); m.emissiveIntensity = [0, 0.07, 0.09, 0.14][tier]; }   // a sheen, not paint
  });
}
const _brlEquip = equipClass;
equipClass = function (cls, noCompile) {
  const r = _brlEquip(cls, noCompile);
  try { WEAPONS.forEach((w, i) => brlTint(gunObjs[i], M && M.br ? BRL.rar[w.def.id] | 0 : 0)); } catch (e) {}
  return r;
};
// a gun into my hands as the primary (the pistol stays the secondary)
function brlGive(d, tier) {
  BRL.rar[d.id] = clamp(tier | 0, 0, 3);
  equipClass({ p: d.id, s: 'sidearm', e: 'frag', k: 'none', factory: true }); G.grenades = Math.max(G.grenades | 0, 1);
  const t = brlAmmoOf(d); BRL.ammo[t] = Math.min(BRL_AMMO[t].max, BRL.ammo[t] + BRL_AMMO[t].can * 2); brlAmmoSync(true);
  M.br.myTier = Math.max(M.br.myTier, Math.min(2, tier));
}
// the guns' reserve is the shared pool of their ammo type
function brlAmmoSync(force) {
  for (const w of WEAPONS) {
    if (!w || !w.def) continue; const t = brlAmmoOf(w.def);
    if (!force && w._brlRes !== undefined && w.reserve !== w._brlRes) BRL.ammo[t] = clamp(BRL.ammo[t] + (w.reserve - w._brlRes), 0, BRL_AMMO[t].max);
  }
  for (const w of WEAPONS) { if (!w || !w.def) continue; const t = brlAmmoOf(w.def); w.reserve = BRL.ammo[t]; w._brlRes = w.reserve; }
}
// the start of the round (brArmAll): a pistol, a little light ammo, an empty kit
function brlStart() {
  BRL.rar = {}; BRL.kit = {}; BRL.ammo = { light: 36, heavy: 0, shells: 0, sniper: 0 }; BRL.heals = { nug: 1, brownie: 0, joint: 0 }; BRL.keys = 0; BRL.heal = null; BRL.regen = 0;
  try { WEAPONS.forEach((w, i) => brlTint(gunObjs[i], 0)); brlAmmoSync(true); } catch (e) {}
}

/* ---------- the floor loot */
const BRL_G = {}; let BRL_M = null;
function brlMats() {
  if (BRL_M) return BRL_M;
  BRL_G.box = new THREE.BoxGeometry(1, 1, 1); BRL_G.cyl = new THREE.CylinderGeometry(1, 1, 1, 14); BRL_G.sph = new THREE.SphereGeometry(1, 10, 8);
  const std = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}));
  BRL_M = { wood: std(0x6a4a30), dark: std(0x3e2c1c), metal: std(0x3a3e42, { roughness: 0.45, metalness: 0.6 }), pallet: std(0x9a7a50, { roughness: 0.95 }),
    glass: std(0xbfffd0, { transparent: true, opacity: 0.45, roughness: 0.05 }), bud: std(0x5aa03a, { roughness: 0.95 }), lid: std(0x2a2a2a), brownie: std(0x3a2412, { roughness: 0.95 }), tray: std(0x9a9a9a, { metalness: 0.6, roughness: 0.4 }),
    paper: std(0xf0ece0, { roughness: 0.9 }), lens: std(0x3a8aff, { emissive: 0x1a4aaa, emissiveIntensity: 0.8 }), cans: {}, strips: {} };
  for (const k in BRL_AMMO) BRL_M.cans[k] = std(BRL_AMMO[k].col, { roughness: 0.55, metalness: 0.35 });
  BRL_RAR.forEach((r, i) => { BRL_M.strips[i] = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: r.col, emissiveIntensity: 2.2 }); });
  return BRL_M;
}
function brlMesh(parent, geo, mat, x, y, z, sx, sy, sz, rx, ry, rz) { const m = new THREE.Mesh(BRL_G[geo], mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = sy > 0.03; m.receiveShadow = true; parent.add(m); return m; }
// the light strip in a rarity colour + a soft glow
function brlStrip(parent, tier, x, y, z, w, d) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  brlMesh(g, 'box', BRL_M.strips[tier], 0, 0, 0, w, 0.018, d);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: BRL_RAR[tier].col, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.35, depthWrite: false })); s.scale.set(Math.max(w, d) * 1.2, 0.35, 1); s.position.y = 0.08; g.add(s);
  return g;
}
// a gun model sized to about 0.95 m, one template per gun, cloned for each item
function brlGunModel(id) {
  let t = BRL.tpl[id];
  if (!t) { const d = ARM[id]; if (!d) return null; const m = buildGunModel(d, true); if (m.userData.flash) m.remove(m.userData.flash); m.traverse(o => { o.userData = {}; });   // (clone() copies userData as JSON; the gun's holds itself)
    const bb = new THREE.Box3().setFromObject(m), sz = bb.getSize(new THREE.Vector3()); m.scale.multiplyScalar(0.95 / Math.max(0.2, sz.x, sz.y, sz.z)); t = BRL.tpl[id] = m; }
  const c = t.clone(true); c.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.brlSkip = false; } }); return c;
}
// where the nearest wall is (for the furniture to back onto): {nx, nz, d} or null
function brlWall(x, z, y) {
  let best = null;
  for (const b of boxesNear(x, z)) {
    if (b.bot > y + 1.6 || b.top < y + 0.6 || b.top - b.bot < 0.5) continue;   // a wall, or the sill under a window
    const m = 0.45, tests = [[1, 0, b.minx - x, z > b.minz - m && z < b.maxz + m], [-1, 0, x - b.maxx, z > b.minz - m && z < b.maxz + m], [0, 1, b.minz - z, x > b.minx - m && x < b.maxx + m], [0, -1, z - b.maxz, x > b.minx - m && x < b.maxx + m]];
    for (const [nx, nz, d, over] of tests) if (over && d >= -0.05 && d < 1.7 && (!best || d < best.d - 0.05 || (Math.abs(d - best.d) < 0.05 && b.top > best.top))) best = { nx, nz, d: Math.max(0.05, d), top: b.top, tall: b.top >= y + 1.9 };
  }
  return best;
}
// what a set holds: rolled from the round's seed and the spot
function brlRollTier(r, q) { const p = q >= 2 ? [0.15, 0.4, 0.33] : q >= 1 ? [0.35, 0.4, 0.2] : [0.6, 0.3, 0.09], x = r(); return x < p[0] ? 0 : x < p[0] + p[1] ? 1 : x < p[0] + p[1] + p[2] ? 2 : 3; }
function brlRollGun(r, tier) { const cats = tier >= 3 ? ['ar', 'lmg', 'sr', 'mr'] : BR_TIERS[Math.min(2, tier)].cats, pool = ARMORY.filter(d => cats.includes(d.cat) && CATS[d.cat] && (CATS[d.cat].slot === 'primary' || d.cat === 'pi')); return pool.length ? pool[Math.floor(r() * pool.length)] : ARM.marc; }
function brlRollHeal(r) { const x = r(); return x < 0.6 ? 'nug' : x < 0.9 ? 'brownie' : 'joint'; }
// one item on a set: k 'gun' | 'ammo' | 'heal' | 'att'; at (x, y, z) in the set's frame
function brlItem(set, k, data, x, y, z, how) {
  const it = Object.assign({ id: set.id + k[0] + set.n++, k, set, lx: x, ly: y, lz: z, how: how || 'lie', mesh: null }, data);
  BRL.items.push(it); if (BRL.taken.has(it.id)) { it.gone = true; return it; } brlItemMesh(it); return it;
}
function brlItemMesh(it) {
  const S0 = it.set.g, M0 = BRL_M, g = new THREE.Group(); g.position.set(it.lx, it.ly, it.lz); S0.add(g); it.mesh = g;
  if (it.k === 'gun') {
    it.pend = true;   // the model comes when someone is near (brlVis)
    brlStrip(g, it.tier, 0, it.how === 'hang' ? -0.12 : -0.03, it.how === 'hang' ? -0.02 : 0.16, it.how === 'hang' ? 1.1 : 1.0, 0.03);
  } else if (it.k === 'ammo') {
    brlMesh(g, 'box', M0.cans[it.t], 0, 0.1, 0, 0.3, 0.2, 0.16); brlMesh(g, 'box', M0.metal, 0, 0.205, 0, 0.12, 0.02, 0.05); brlMesh(g, 'box', M0.paper, 0, 0.1, -0.081, 0.18, 0.07, 0.004);
  } else if (it.k === 'heal') {
    if (it.h === 'nug') { brlMesh(g, 'cyl', M0.glass, 0, 0.08, 0, 0.07, 0.16, 0.07); brlMesh(g, 'sph', M0.bud, 0, 0.06, 0, 0.05, 0.045, 0.05); brlMesh(g, 'cyl', M0.lid, 0, 0.17, 0, 0.075, 0.03, 0.075); }
    else if (it.h === 'brownie') { brlMesh(g, 'box', M0.tray, 0, 0.012, 0, 0.32, 0.025, 0.24); for (let i = 0; i < 4; i++) brlMesh(g, 'box', M0.brownie, -0.06 + (i % 2) * 0.12, 0.05, -0.05 + ((i / 2) | 0) * 0.1, 0.1, 0.05, 0.08); }
    else { brlMesh(g, 'cyl', M0.paper, 0, 0.02, 0, 0.014, 0.16, 0.014, 0, 0, Math.PI / 2); brlMesh(g, 'box', M0.lens, 0.09, 0.02, 0, 0.02, 0.02, 0.02); brlMesh(g, 'box', new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff3a3a, emissiveIntensity: 0.6 }), 0, 0.005, 0.05, 0.12, 0.01, 0.06); }
    brlStrip(g, it.h === 'joint' ? 3 : it.h === 'brownie' ? 2 : 1, 0, -0.005, 0.12, 0.3, 0.02);
  } else if (it.k === 'key') {
    brlMesh(g, 'box', new THREE.MeshStandardMaterial({ color: 0x221a00, emissive: 0xffc83a, emissiveIntensity: 1.2 }), 0, 0.006, 0, 0.16, 0.012, 0.1); brlMesh(g, 'box', M0.lid, 0.04, 0.014, 0, 0.04, 0.004, 0.06);
    brlStrip(g, 3, 0, -0.005, 0.09, 0.22, 0.02);
  } else if (it.k === 'att') {
    brlMesh(g, 'box', M0.dark, 0, 0.06, 0, 0.32, 0.12, 0.2);
    if (/dot|holo/.test(it.a)) { brlMesh(g, 'box', M0.metal, 0, 0.16, 0, 0.08, 0.06, 0.1); brlMesh(g, 'box', M0.lens, 0, 0.17, -0.051, 0.05, 0.03, 0.004); }
    else if (it.a === 'acog4') { brlMesh(g, 'cyl', M0.metal, 0, 0.16, 0, 0.035, 0.24, 0.035, Math.PI / 2, 0, 0); brlMesh(g, 'cyl', M0.lens, 0, 0.16, -0.121, 0.03, 0.004, 0.03, Math.PI / 2, 0, 0); }
    else if (it.a === 'suppressor' || it.a === 'comp') brlMesh(g, 'cyl', M0.metal, 0, 0.15, 0, it.a === 'comp' ? 0.03 : 0.028, it.a === 'comp' ? 0.1 : 0.22, it.a === 'comp' ? 0.03 : 0.028, Math.PI / 2, 0, 0);
    else if (it.a === 'extmag') brlMesh(g, 'box', M0.metal, 0, 0.18, 0, 0.05, 0.2, 0.08, 0.2, 0, 0);
    else brlMesh(g, 'box', M0.metal, 0, 0.16, 0, 0.05, 0.1, 0.05);
    brlStrip(g, 1, 0, -0.005, 0.12, 0.3, 0.02);
  }
}
function brlGunPlace(it) {
  const m = brlGunModel(it.gun); if (!m) return; it.pend = false;
  if (it.how === 'hang') m.rotation.set(0, Math.PI / 2, 0);   // on a rack: barrel along the wall, the side facing out
  else { m.rotation.set(0, Math.PI / 2, Math.PI / 2); m.position.y = 0.035; }   // lying on its side
  brlTint(m, it.tier); it.mesh.add(m); it.model = m;
}
// the furniture: a set backs onto the wall in its +z
function brlSet(s, i, r) {
  const M0 = brlMats(), w = brlWall(s.x, s.z, s.y), g = new THREE.Group(), set = { id: 's' + i + '_', g, n: 0, x: s.x, z: s.z, y: s.y };
  g.position.set(s.x, s.y, s.z); BRL.group.add(g); BRL.sets.push(set);
  let kind;
  if (w) { g.rotation.y = Math.atan2(w.nx, w.nz); const wz = w.d; const x = r(); kind = !w.tall || x < 0.42 ? 'table' : x < 0.72 ? 'rack' : 'shelf'; /* racks and shelves only on a full wall, not a sill or a roof's parapet */ set.wz = wz; }
  else { g.rotation.y = r() * TAU; kind = 'pallet'; }
  const tier = () => brlRollTier(r, s.q | 0), gunIt = (x, y, z, how) => { const t = tier(), d = brlRollGun(r, t); return brlItem(set, 'gun', { gun: d.id, tier: t }, x, y, z, how); };
  if (kind === 'table') {
    const cz = set.wz - 0.42; brlMesh(g, 'box', M0.wood, 0, 0.77, cz, 1.45, 0.06, 0.72); for (const [x, z] of [[-0.66, -0.3], [0.66, -0.3], [-0.66, 0.3], [0.66, 0.3]]) brlMesh(g, 'box', M0.dark, x, 0.37, cz + z, 0.06, 0.74, 0.06);
    const it = gunIt(-0.05, 0.8, cz, 'lie'); const t = brlAmmoOf(ARM[it.gun]); brlItem(set, 'ammo', { t, n: BRL_AMMO[t].can }, 0.52, 0.8, cz - 0.15);
    if (r() < 0.5) brlItem(set, 'heal', { h: brlRollHeal(r) }, -0.55, 0.8, cz - 0.18); else brlItem(set, 'ammo', { t, n: BRL_AMMO[t].can }, -0.45, 0, cz + 0.05);
  } else if (kind === 'rack') {
    const bz = set.wz - 0.03; brlMesh(g, 'box', M0.wood, 0, 1.25, bz, 1.5, 1.15, 0.05);
    for (const y of [1.55, 1.0]) for (const x of [-0.4, 0.4]) brlMesh(g, 'cyl', M0.metal, x, y - 0.06, bz - 0.06, 0.012, 0.1, 0.012, Math.PI / 2, 0, 0);
    gunIt(0, 1.55, bz - 0.1, 'hang'); if (r() < 0.6) gunIt(0, 1.0, bz - 0.1, 'hang');
    brlMesh(g, 'box', M0.wood, 0, 0.42, bz - 0.25, 1.2, 0.04, 0.42); brlMesh(g, 'box', M0.dark, -0.56, 0.21, bz - 0.25, 0.04, 0.42, 0.4); brlMesh(g, 'box', M0.dark, 0.56, 0.21, bz - 0.25, 0.04, 0.42, 0.4);
    const t = ['light', 'heavy', 'shells', 'sniper'][Math.floor(r() * 4)]; brlItem(set, 'ammo', { t, n: BRL_AMMO[t].can }, -0.3, 0.44, bz - 0.25); brlItem(set, 'ammo', { t, n: BRL_AMMO[t].can }, 0.25, 0.44, bz - 0.25);
  } else if (kind === 'shelf') {
    const bz = set.wz - 0.2; for (const y of [0.45, 0.95, 1.45]) brlMesh(g, 'box', M0.wood, 0, y, bz, 1.25, 0.04, 0.4); for (const x of [-0.6, 0.6]) brlMesh(g, 'box', M0.dark, x, 0.85, bz, 0.04, 1.7, 0.4);
    brlItem(set, 'heal', { h: brlRollHeal(r) }, -0.35, 0.97, bz); brlItem(set, 'heal', { h: brlRollHeal(r) }, 0.05, 0.97, bz);
    const t = ['light', 'heavy', 'shells', 'sniper'][Math.floor(r() * 4)]; brlItem(set, 'ammo', { t, n: BRL_AMMO[t].can }, 0.38, 0.97, bz);
    brlItem(set, 'att', { a: BRL_KIT[Math.floor(r() * BRL_KIT.length)].id }, -0.2, 1.47, bz); if (r() < 0.5) brlItem(set, 'heal', { h: brlRollHeal(r) }, 0.3, 0.47, bz);
  } else {
    brlMesh(g, 'box', M0.pallet, 0, 0.07, 0, 1.2, 0.03, 0.8); for (const z of [-0.33, 0, 0.33]) brlMesh(g, 'box', M0.dark, 0, 0.03, z, 1.2, 0.06, 0.1);
    const it = gunIt(-0.1, 0.09, 0.05, 'lie'); const t = brlAmmoOf(ARM[it.gun]); brlItem(set, 'ammo', { t, n: BRL_AMMO[t].can }, 0.42, 0.09, -0.22);
    if (r() < 0.35) brlItem(set, 'att', { a: BRL_KIT[Math.floor(r() * BRL_KIT.length)].id }, -0.42, 0.09, -0.25);
  }
  set.kind = kind;
}
function brlBuild(seed) {
  brlClear(); if (!brlOn()) return; BRL.seed = seed >>> 0; BRL.group = new THREE.Group(); scene.add(BRL.group);
  const spots = MAPS[curMap].loot.filter(brlFloorSpot);
  spots.forEach((s, i) => { if (typeof duelIn === 'function' && duelIn(s.x, s.z, 1)) return; brlSet(s, i, brlRng(BRL.seed ^ brlHash(s.x, s.z, s.y))); });
  // six KEY CARDS for the vaults, on tables, shelves and pallets
  { const r = brlRng(BRL.seed ^ 0x51ed), cand = BRL.sets.filter(s => s.kind !== 'rack' && s.kind !== 'vault'); for (let k = 0; k < 6 && cand.length; k++) { const s = cand.splice(Math.floor(r() * cand.length), 1)[0], f = BRL.items.find(i => i.set === s); if (f) brlItem(s, 'key', {}, f.lx + (f.lx > 0 ? -0.3 : 0.3), f.ly, f.lz + 0.12); } }
  try { brbVaultLoot(); } catch (e) { reportError(e); }   // the vaults' loot (brbots.js)
  for (const d of BRL.drops) brlDropMake(d);
  for (const id of new Set(BRL.items.filter(i => i.k === 'gun').map(i => i.gun))) try { brlGunModel(id); } catch (e) {}   // every gun model now, not when someone walks up (a stutter)
  brlVis(true);
}
function brlClear() { if (BRL.group && BRL.group.parent) BRL.group.parent.remove(BRL.group); BRL.group = null; BRL.items = []; BRL.sets = []; BRL.near = null; }
// the round starts (brSetup): a fresh seed, nothing taken
function brlSetup() { BRL.rar = {}; BRL.kit = {}; BRL.keys = 0; BRL.vo = []; BRL.taken = new Set(); BRL.out = []; BRL.drops = []; BRL.dropSeen = new Set(); BRL.dn = 0; BRL.seed = 0; if (netHostNow()) brlBuild((Math.random() * 4294967296) >>> 0); }
// the floor loot near me: shown, guns built (furniture far away is hidden)
function brlVis(force) {
  if (!BRL.group || (!force && (BRL.visT -= 1 / 60) > 0)) return; BRL.visT = 0.4;
  const hide = typeof brfHideLoot === 'function' && brfHideLoot(); BRL.group.visible = !hide;
  for (const s of BRL.sets) { const d = Math.hypot(s.x - P.x, s.z - P.z); s.g.visible = d < 75; }
  for (const it of BRL.items) if (it.k === 'gun' && it.pend && !it.gone && Math.hypot(it.set.x - P.x, it.set.z - P.z) < 45) brlGunPlace(it);
}
const _bw = new THREE.Vector3();
function brlWorld(it) { it.mesh.updateWorldMatrix(true, false); return it.mesh.getWorldPosition(_bw); }
function brlName(it) { return it.k === 'gun' ? `${BRL_RAR[it.tier].n} ${ARM[it.gun].name}` : it.k === 'ammo' ? `${BRL_AMMO[it.t].n} AMMO ×${it.n}` : it.k === 'heal' ? BRL_HEAL[it.h].n : it.k === 'key' ? 'VAULT KEY CARD' : (BRL_KIT.find(a => a.id === it.a) || {}).n || 'ATTACHMENT'; }
function brlRemove(it) { it.gone = true; if (it.mesh && it.mesh.parent) it.mesh.parent.remove(it.mesh); if (BRL.near === it) BRL.near = null; }
// take it
function brlTake(it) {
  if (it.gone) return; let ok = true;
  if (it.k === 'gun') {
    const old = WEAPONS.length > 1 && WEAPONS[0] && WEAPONS[0].def && WEAPONS[0].def.id !== 'sidearm' ? { gun: WEAPONS[0].def.id, tier: BRL.rar[WEAPONS[0].def.id] | 0 } : null;
    brlGive(ARM[it.gun], it.tier);
    try { showBanner(`${BRL_RAR[it.tier].n}`, ARM[it.gun].name); sfx.pickup(); } catch (e) {}
    if (old) { const d = { id: it.id + '~' + (++BRL.dn) + (NET.me ? NET.me.slice(-3) : ''), base: it.id, gun: old.gun, tier: old.tier }; BRL.drops.push(d); BRL.dropSeen.add(d.id); brlDropMake(d); }
  } else if (it.k === 'ammo') { const A = BRL_AMMO[it.t]; if (BRL.ammo[it.t] >= A.max) ok = false; else { BRL.ammo[it.t] = Math.min(A.max, BRL.ammo[it.t] + it.n); brlAmmoSync(true); try { showMsg(`+${it.n} ${A.n} AMMO`); sfx.pickup(); } catch (e) {} } }
  else if (it.k === 'heal') { const H = BRL_HEAL[it.h]; if (BRL.heals[it.h] >= H.max) ok = false; else { BRL.heals[it.h]++; try { showMsg(`+1 ${H.n} · ${actName('heal')} TO USE`); sfx.pickup(); } catch (e) {} } }
  else if (it.k === 'key') { BRL.keys = (BRL.keys | 0) + 1; try { showBanner('VAULT KEY CARD', 'opens one of the four VAULTS (on the map) · hold ' + actName('use') + ' at the door'); sfx.pickup(); } catch (e) {} }
  else if (it.k === 'att') {
    const a = ATT_BY_ID[it.a]; BRL.kit[a.slot] = it.a; WEAPONS.forEach((w, i) => applyLoadout(i));
    const fits = WEAPONS.some(w => attOK(a, w.def)); try { showBanner(brlName(it), fits ? 'snapped onto your gun' : 'in your kit · goes on the next gun it fits'); sfx.pickup(); } catch (e) {}
  }
  if (!ok) { try { showMsg('FULL'); } catch (e) {} return; }
  brlRemove(it); BRL.taken.add(it.id); BRL.out.push(it.id); if (BRL.out.length > 80) BRL.out.shift();
}
// a gun someone put down: in the place of the one they took
function brlDropMake(d) {
  const base = BRL.items.find(i => i.id === d.base); if (!base || BRL.items.some(i => i.id === d.id)) return;
  const it = Object.assign({}, base, { id: d.id, gun: d.gun, tier: d.tier, gone: false, mesh: null, model: null, pend: true }); BRL.items.push(it);
  if (BRL.taken.has(it.id)) { it.gone = true; return; } brlItemMesh(it); brlVis(true);
}
/* ---------- heals */
function brlHealPick() {
  const miss = (G.maxHp || 100) - G.health; if (miss < 1) return null; const H = BRL.heals;
  if (miss >= 60 && H.joint) return 'joint'; if (miss >= 40 && H.brownie) return 'brownie'; if (H.nug) return 'nug'; if (H.brownie) return 'brownie'; if (H.joint) return 'joint'; return null;
}
function brlHealStart() {
  if (!brlOn() || BRL.heal || !playerAlive() || G.downed) return false; const h = brlHealPick();
  if (!h) { try { showMsg(Object.values(BRL.heals).some(n => n) ? 'HEALTH IS FULL' : 'NO HEALS · FIND NUGS, BROWNIES OR A MEDICAL JOINT'); } catch (e) {} return false; }
  BRL.heal = { h, t: 0 }; try { sfx.ui(); } catch (e) {} return true;
}
// D-pad up in LAST TOKE: a heal when you have one and are hurt (else the scorestreak as before)
function brlPadHeal() { if (!brlOn() || !brlHealPick()) return false; return brlHealStart(); }
function brlHealTick(dt) {
  if (BRL.regen > 0) { const a = Math.min(BRL.regen, 10 * dt); BRL.regen -= a; G.health = Math.min(G.maxHp || 100, G.health + a); }
  const H = BRL.heal; if (!H) return;
  if (!playerAlive() || G.downed || mouseDown || pad.fire) { BRL.heal = null; try { showMsg('HEAL CANCELLED'); } catch (e) {} return; }
  const D = BRL_HEAL[H.h]; H.t += dt; G.swapT = Math.max(G.swapT, 0.2);
  try { showMsgOnce(`USING A ${D.n} · ${Math.round(H.t / D.t * 100)}%`); } catch (e) {}
  if (H.t >= D.t) { BRL.heal = null; BRL.heals[H.h] = Math.max(0, BRL.heals[H.h] - 1); if (D.over) BRL.regen += D.hp; else G.health = Math.min(G.maxHp || 100, G.health + D.hp); try { showMsg(`${D.n} · +${D.hp >= 999 ? 'FULL' : D.hp} HP${D.over ? ' over ' + D.over + ' s' : ''}`); sfx.pickup(); } catch (e) {} }
}
/* ---------- every frame in a LAST TOKE round (from brUpdate, after the crates) */
function brlTick(dt) {
  if (!brlOn()) return; const B = M.br;
  if (!BRL.group && BRL.seed) brlBuild(BRL.seed);
  brlVis(); brlAmmoSync(false); brlHealTick(dt);
  const hk = kb('heal'); if (hk && !BRL.hH) brlHealStart(); BRL.hH = hk;
  // the nearest thing I'm looking at, within reach
  BRL.near = null; const u = kb('use') || pad.use;
  if (playerAlive() && !(typeof BRF !== 'undefined' && BRF.float) && !(B.crates || []).some(c => !c.open && Math.hypot(P.x - c.x, P.z - c.z) < 1.8 && Math.abs((P.y || 0) - (c.y || 0)) < 1.6)) {
    const cp = Math.cos(P.pitch), fx = -Math.sin(P.yaw) * cp, fy = Math.sin(P.pitch), fz = -Math.cos(P.yaw) * cp, ey = P.y + (P.eye || 1.7); let best = null, bs = 1e9;   // what's under the crosshair wins
    for (const it of BRL.items) {
      if (it.gone || !it.mesh || Math.abs(it.set.x - P.x) > 4 || Math.abs(it.set.z - P.z) > 4) continue;
      const p = brlWorld(it), dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz), dy = p.y - P.y; if (d > 1.9 || dy < -0.6 || dy > 2.1) continue;
      const vy = p.y + 0.08 - ey, l3 = Math.hypot(dx, vy, dz) || 1, ang = Math.acos(clamp((dx * fx + vy * fy + dz * fz) / l3, -1, 1)); if (ang > 0.75 && d > 0.7) continue;
      const sc = ang + d * 0.12; if (sc < bs) { bs = sc; best = it; }
    }
    if (best) { BRL.near = best; G.interactTxt = `${brlName(best)} · PRESS ${actName('use')} TO TAKE`; try { showMsgOnce(G.interactTxt); } catch (e) {} if (u && !BRL.uH) brlTake(best); }
  }
  BRL.uH = u;
  // the item I'm looking at pulses
  if (BRL.near && BRL.near.mesh) { const k = 1 + Math.sin(NOW * 8) * 0.04; BRL.near.mesh.scale.setScalar(k); }
}
// the HUD line (added to LAST TOKE's money / plates line)
function brlHud() {
  if (!brlOn()) return ''; const H = BRL.heals, w = WEAPONS[G.cur], t = w && w.def ? brlAmmoOf(w.def) : 'light';
  const heals = ['nug', 'brownie', 'joint'].filter(k => H[k]).map(k => `${H[k]} ${BRL_HEAL[k].n}${H[k] > 1 && k !== 'joint' ? 'S' : ''}`).join(', ');
  return ` · ${BRL_AMMO[t].n} AMMO ${BRL.ammo[t]}${heals ? ` · ${heals} (${actName('heal')})` : ''}`;
}
// the HUD gun name in its rarity colour
function brlNameCol() { try { const el = $('wname'), w = WEAPONS[G.cur], t = brlOn() && w && w.def ? BRL.rar[w.def.id] | 0 : -1, c = t > 0 ? BRL_RAR[t].css : ''; if (el && el._brc !== c) { el._brc = c; el.style.color = c; } } catch (e) {} }
/* ---------- online */
function brlPres() { return brlOn() && (BRL.out.length || BRL.drops.length || (BRL.vo && BRL.vo.length)) ? { vo: BRL.vo && BRL.vo.length ? BRL.vo.slice(-4) : undefined, fl: BRL.out.slice(-60), fd: BRL.drops.filter(d => d.id.endsWith(NET.me ? NET.me.slice(-3) : '')).slice(-20).map(d => [d.id, d.base, d.gun, d.tier]) } : null; }
function brlRemote(o) {
  if (!brlOn() || !o) return;
  if (Array.isArray(o.vo) && netHostNow()) for (const i of o.vo) { const v = BRB.vaults[i | 0]; if (v && !v.open) brbVaultOpen(v); }
  if (Array.isArray(o.fd)) for (const a of o.fd) { if (!Array.isArray(a) || BRL.dropSeen.has(String(a[0])) || !ARM[a[2]]) continue; const d = { id: String(a[0]).slice(0, 40), base: String(a[1]).slice(0, 30), gun: a[2], tier: clamp(a[3] | 0, 0, 3) }; BRL.dropSeen.add(d.id); BRL.drops.push(d); brlDropMake(d); }
  if (Array.isArray(o.fl)) for (const id0 of o.fl) { const id = String(id0).slice(0, 40); if (BRL.taken.has(id)) continue; BRL.taken.add(id); const it = BRL.items.find(i => i.id === id); if (it) brlRemove(it); }
}
// the seed travels at the end of the host's 'b' pack
function brlSeedIn(seed) { seed = seed >>> 0; if (!seed || seed === BRL.seed) return; BRL.seed = seed; brlBuild(seed); }
