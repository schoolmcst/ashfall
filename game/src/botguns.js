/* ================================================================== bot loadouts: every bot carries a real gun
   Each bot gets a class that fits its job (overwatch: sniper or marksman rifle, entry: SMG or shotgun, support: AR or
   LMG...), random attachments from that gun's real attachment list, and sometimes a camo. The gun shows in its
   hands (the same models as yours, with the attachments on), and it fights like that gun: damage, fire rate, bursts,
   magazine, effective range and damage drop-off, and a suppressor really makes it quieter (no tracer, heard from
   less far away). A bot keeps its class between lives, and now and then swaps to a new one. */
const BOT_GUN_PREF = { entry: ['smg', 'sg', 'ar'], support: ['ar', 'lmg', 'ar'], anchor: ['ar', 'lmg', 'mr'], overwatch: ['sr', 'mr', 'sr'], lurk: ['smg', 'ar', 'smg'], slayer: ['ar', 'smg', 'sg'] };
const BOT_LEN = { pi: 0.26, smg: 0.62, sg: 0.95, ar: 0.86, lmg: 1.0, mr: 1.02, sr: 1.15, la: 1.0 };
const BOTGUN_CACHE = new Map();
// run fn with this attachment set standing in for the player's own for that gun
function withAtts(def, set, fn) {
  const had = Object.prototype.hasOwnProperty.call(ATTS, def.id), old = ATTS[def.id];
  ATTS[def.id] = set || {};
  try { return fn(); } finally { if (had) ATTS[def.id] = old; else delete ATTS[def.id]; }
}
function botRandomAtts(def, quiet) {
  const set = {};
  for (const slot of slotsFor(def)) {
    const opts = attFor(def, slot);   // [factory part, ...options]
    if (quiet && slot === 'muzzle') { const s = opts.find(a => a.id === 'suppressor'); if (s) { set[slot] = s.id; continue; } }
    if (opts.length > 1 && Math.random() < 0.65) set[slot] = opts[1 + ((Math.random() * (opts.length - 1)) | 0)].id;
  }
  return set;
}
function botPickGun(e) {
  const prefs = BOT_GUN_PREF[e.job] || ['ar', 'smg'], cat = prefs[(Math.random() * prefs.length) | 0];
  const list = ARMORY.filter(d => d.cat === cat);
  return list.length ? list[(Math.random() * list.length) | 0] : ARMORY.find(d => d.cat === 'ar');
}
// stats from the gun and its attachments
function botApplyGun(e, def, atts) {
  const st = withAtts(def, atts, () => computeStats(def, null)), sk = SKILL[M.cfg.skill] || SKILL.regular;
  const per = st.dmg * (st.pellets > 1 ? st.pellets * 0.55 : 1), semi = st.interval > 0.3 || def.auto === false;
  e.gunId = def.id; e.atts = atts || {};
  e.dmg = sk.dmg * (M.cfg.hardcore ? 1.4 : 1) * clamp(per / 34, 0.55, 3.2);
  e.gap = clamp(st.interval, 0.06, 1.3); e.burstMin = semi ? 1 : 3; e.burstMax = semi ? 3 : 7;
  e.magSize = Math.max(1, st.magSize); e.mag = Math.min(e.mag || e.magSize, e.magSize) || e.magSize;
  e.eff = st.eff; e.fallMin = st.fallMin; e.rangeK = clamp(28 / Math.max(6, st.eff), 0.35, 2.2); e.stealth = !!st.stealth;
}
// the gun in the bot's hands
function botGunVisual(e, def, atts, camo) {
  const rig = e.rig; if (!rig || !rig.gun) return;
  if (e.gunVis) { rig.gun.remove(e.gunVis); e.gunVis = null; }
  const key = def.id + '|' + JSON.stringify(atts || {}) + '|' + (camo || '');
  let tpl = BOTGUN_CACHE.get(key);
  if (!tpl) {
    const g = buildGunModel(def, true);
    withAtts(def, atts, () => { const st = computeStats(def, null); attachVisuals(g, def, false, g.userData.len + st.lenAdd, null); });
    try { if (camo) applyCamo(g, camo); } catch (err) {}
    g.traverse(o => { if (o.name && /^hand/.test(o.name)) o.visible = false; }); if (g.userData.flash) g.userData.flash.visible = false;
    const holder = new THREE.Group(); holder.add(g); g.updateMatrixWorld(true);
    const box = new THREE.Box3();
    g.traverse(o => { if (!o.isMesh || (o.material && o.material.blending === THREE.AdditiveBlending)) return; for (let p = o; p; p = p.parent) if (!p.visible) return; box.expandByObject(o); });
    const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()), L = BOT_LEN[def.cat] || 0.86;
    g.position.sub(c); holder.scale.setScalar(L / Math.max(sz.z, sz.x, 0.1)); holder.rotation.y = Math.PI;   // view models point down -z, the rig's gun points +z
    tpl = botGunMerge(holder); tpl.userData.len = L; BOTGUN_CACHE.set(key, tpl);
    if (BOTGUN_CACHE.size > 48) BOTGUN_CACHE.delete(BOTGUN_CACHE.keys().next().value);
  }
  const vis = tpl.clone(), L = tpl.userData.len, cz = def.cat === 'pi' ? 0.06 : L / 2 - 0.22;
  vis.position.set(0, 0, cz);
  for (const ch of rig.gun.children) if (ch !== rig.flash) ch.visible = false;
  rig.gun.add(vis); e.gunVis = vis;
  if (rig.flash) rig.flash.position.z = cz + L / 2 + 0.04;
}
// bake the gun into one mesh per material (about 28 parts -> 10 draw calls per bot)
function botGunMerge(holder) {
  holder.updateMatrixWorld(true);
  const groups = new Map(), out = new THREE.Group();
  holder.traverse(o => {
    if (!o.isMesh || (o.material && o.material.blending === THREE.AdditiveBlending)) return;
    for (let p = o; p; p = p.parent) if (!p.visible) return;
    const g = o.geometry, ok = g && g.attributes.position && g.attributes.normal && g.attributes.uv && !Array.isArray(o.material);
    if (!ok) { const m = o.clone(); m.userData = {}; o.matrixWorld.decompose(m.position, m.quaternion, m.scale); out.add(m); return; }
    if (!groups.has(o.material)) groups.set(o.material, []);
    groups.get(o.material).push({ g, m: o.matrixWorld.clone() });
  });
  for (const [mat, parts] of groups) { const m = new THREE.Mesh(mergeGeos(parts), mat); m.castShadow = true; out.add(m); }
  out.traverse(o => { o.userData = {}; if (o.isMesh) o.raycast = () => {}; });   // clone() deep-copies userData, and the view model's has loops
  return out;
}
// a bot's class: kept between lives, sometimes changed
function botLoadout(e) {
  const en = e.entry; if (!en) return;
  if (!en.loadout || Math.random() < 0.2) {
    const def = botPickGun(e), quiet = e.job === 'lurk' && Math.random() < 0.7;
    let camo = null; if (Math.random() < 0.4) { const pool = BOX_POOL.filter(c => c.kind === 'camo' || c.kind === 'skin'); camo = pool.length ? pool[(Math.random() * pool.length) | 0].id : null; }
    en.loadout = { gun: def.id, atts: botRandomAtts(def, quiet), camo };
  }
  const L = en.loadout, def = ARM[L.gun]; if (!def) return;
  botApplyGun(e, def, L.atts);
  try { botGunVisual(e, def, L.atts, L.camo); } catch (err) { reportError(err); }
}
// damage drop-off past the gun's effective range (bot shots)
const botFall = (e, dist) => !e.eff || dist <= e.eff ? 1 : Math.max(e.fallMin || 0.5, e.eff / dist);
const botGunName = e => (e && e.gunId && ARM[e.gunId] ? ARM[e.gunId].name : 'RIFLE');
