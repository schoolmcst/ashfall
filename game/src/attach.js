/* ================================================================== attachments: data, stats, visuals, loadout menu */
// mods are fractional changes: dmg +0.1 = +10% damage; spread/adsSpread/recoil/reload/ads are "less is better".
// Mods are measured against the weapon's factory part in that slot, so a gun that ships with a scope is not
// penalised twice for it. Absolute keys: zoom (ADS field of view), overlay (magnified scope view), stealth, laser.
const SLOTS = ['optic', 'muzzle', 'barrel', 'underbarrel', 'magazine', 'stock', 'ammo'];
const SLOT_NAME = { optic: 'SIGHT', muzzle: 'MUZZLE', barrel: 'BARREL', underbarrel: 'GRIP / LASER', magazine: 'MAGAZINE', stock: 'STOCK', ammo: 'AMMO TYPE' };
const CAT_SLOTS = { ar: SLOTS, smg: SLOTS, lmg: SLOTS, mr: SLOTS, sr: SLOTS, sg: SLOTS, pi: ['optic', 'muzzle', 'barrel', 'underbarrel', 'magazine', 'ammo'], la: ['ammo'] };
const ALLC = ['ar', 'smg', 'lmg', 'mr', 'sr', 'sg', 'pi', 'la'], RIF = ['ar', 'smg', 'lmg', 'mr'], GUNC = ['ar', 'smg', 'lmg', 'mr', 'sr', 'sg', 'pi'];
const ABS_KEYS = new Set(['zoom', 'overlay', 'stealth', 'laser']);
const ATT = [
  // ---------- optics
  { id: 'reddot', slot: 'optic', c: RIF, name: 'Red-Dot Sight', desc: 'A quick, clear 1.4× red dot.', mods: {} },
  { id: 'irons', slot: 'optic', c: RIF, name: 'Iron Sights', desc: 'No optic. Lighter and faster to raise, but the post covers distant targets.', mods: { ads: -0.12, adsSpread: 0.25, zoom: 66 } },
  { id: 'holo', slot: 'optic', c: RIF.concat('sg'), name: 'Holographic Sight', desc: 'Large window and crisp reticle. A little heavier than a red dot.', mods: { adsSpread: -0.12, zoom: 50, ads: 0.08 } },
  { id: 'reflex', slot: 'optic', c: ['smg', 'sg', 'pi'], name: 'Mini Reflex', desc: 'A small red dot. Tighter aimed shots for a little extra weight.', mods: { adsSpread: -0.18, zoom: 56, ads: 0.06 } },
  { id: 'scope25', slot: 'optic', c: ['ar', 'lmg', 'mr'], name: '2.5× Combat Scope', desc: 'Real magnification for mid range. Slow to raise and narrows your view.', mods: { zoom: 30, adsSpread: -0.25, range: 0.1, ads: 0.25, spread: 0.1, move: -0.02, overlay: 2.5 } },
  { id: 'acog4', slot: 'optic', c: ['ar', 'lmg', 'mr', 'smg'], name: '4× Battle Scope', desc: 'Compact 4× prism scope with a lit chevron reticle and bullet-drop marks. Great at mid to long range, slow up close.', mods: { zoom: 19, adsSpread: -0.35, range: 0.2, ads: 0.35, spread: 0.15, move: -0.03, overlay: 4 } },
  { id: 'scope6', slot: 'optic', c: ['sr'], name: '6× Sniper Scope', desc: 'The standard long-range scope.', mods: { zoom: 12.5, overlay: 6 } },
  { id: 'scope10', slot: 'optic', c: ['sr'], name: '10× Variable Scope', desc: 'Huge magnification for long sight lines. Slow and tunnel-visioned.', mods: { zoom: 7.5, overlay: 10, adsSpread: -0.3, ads: 0.15, move: -0.03 } },
  { id: 'scope35', slot: 'optic', c: ['sr'], name: '3.5× Scout Scope', desc: 'Low power, wide view, fast to aim. Less steady at distance.', mods: { zoom: 21, overlay: 3.5, ads: -0.18, adsSpread: 0.35, move: 0.02 } },
  { id: 'sirons', slot: 'optic', c: ['sr'], name: 'Iron Sights', desc: 'Strip the scope. Very fast and no lens glint, but no magnification at all.', mods: { zoom: 58, ads: -0.38, adsSpread: 1.6, spot: -0.1 } },
  { id: 'bead', slot: 'optic', c: ['sg'], name: 'Bead Sight', desc: 'A brass bead on the rib. Nothing to break.', mods: {} },
  { id: 'irons_p', slot: 'optic', c: ['pi', 'la'], name: 'Iron Sights', desc: 'Factory sights.', mods: {} },
  // ---------- muzzles
  { id: 'nomuzzle', slot: 'muzzle', c: ALLC, name: 'Standard', desc: 'Factory muzzle.', mods: {} },
  { id: 'suppressor', slot: 'muzzle', c: ['ar', 'smg', 'lmg', 'mr', 'sr', 'pi'], not: ['magnum'], name: 'Suppressor', desc: 'No muzzle flash or tracers, so enemies take longer to find you. Slows the bullet and adds length.', mods: { stealth: 1, spot: -0.4, range: -0.15, ads: 0.05, len: 0.15 } },
  { id: 'comp', slot: 'muzzle', c: ['ar', 'smg', 'lmg', 'mr', 'pi'], name: 'Compensator', desc: 'Vents gas upward to hold the muzzle down. The jet makes hip-fire a little looser.', mods: { recoil: -0.18, spread: 0.1, spot: 0.1, len: 0.05 } },
  { id: 'brake', slot: 'muzzle', c: ['ar', 'lmg', 'mr', 'sr'], name: 'Muzzle Brake', desc: 'Big recoil reduction, but the blast and flash give your position away.', mods: { recoil: -0.28, spot: 0.25, ads: 0.04, len: 0.06 } },
  { id: 'choke', slot: 'muzzle', c: ['sg'], name: 'Full Choke', desc: 'Tightens the pellet pattern so it carries further. Less forgiving up close.', mods: { spread: -0.3, adsSpread: -0.3, range: 0.25, ads: 0.05, move: -0.03, len: 0.05 } },
  { id: 'spreader', slot: 'muzzle', c: ['sg'], name: 'Spreader Choke', desc: 'Throws a wide pattern for room clearing. Falls apart at range.', mods: { spread: 0.35, adsSpread: 0.35, pellets: 2, range: -0.2, len: 0.04 } },
  // ---------- barrels
  { id: 'stdbarrel', slot: 'barrel', c: ALLC, name: 'Standard Barrel', desc: 'Factory length.', mods: {} },
  { id: 'long', slot: 'barrel', c: GUNC, not: ['coach'], name: 'Long Barrel', desc: 'More velocity and reach. Heavier and slower to swing.', mods: { dmg: 0.08, range: 0.3, adsSpread: -0.1, ads: 0.12, move: -0.05, spread: 0.1, len: 0.12 } },
  { id: 'short', slot: 'barrel', c: GUNC, name: 'Short Barrel', desc: 'Handy in tight spaces. Loses velocity and climbs more.', mods: { ads: -0.15, move: 0.05, spread: -0.15, range: -0.3, dmg: -0.06, recoil: 0.12 } },
  { id: 'heavy', slot: 'barrel', c: ['ar', 'lmg', 'mr', 'sr', 'sg'], not: ['coach'], name: 'Heavy Barrel', desc: 'Thick profile soaks up recoil and holds accuracy. Weighs a lot.', mods: { recoil: -0.15, range: 0.15, move: -0.07, ads: 0.15 } },
  // ---------- underbarrel
  { id: 'nounder', slot: 'underbarrel', c: ALLC, name: 'None', desc: 'Clean rail.', mods: {} },
  { id: 'vgrip', slot: 'underbarrel', c: RIF, name: 'Vertical Grip', desc: 'Better control on long bursts. Slower to bring to the eye.', mods: { recoil: -0.15, ads: 0.08 } },
  { id: 'agrip', slot: 'underbarrel', c: RIF, name: 'Angled Grip', desc: 'Faster to aim. Gives up a little recoil control.', mods: { ads: -0.12, recoil: 0.06 } },
  { id: 'bipod', slot: 'underbarrel', c: ['lmg', 'mr', 'sr'], name: 'Bipod', desc: 'Folded legs add mass up front: steadier aim and less kick, slower to move and aim.', mods: { recoil: -0.22, adsSpread: -0.12, ads: 0.1, move: -0.04 } },
  { id: 'laser', slot: 'underbarrel', c: GUNC, name: 'Laser Sight', desc: 'Tighter hip-fire and a visible aim point. The beam gives you away.', mods: { spread: -0.25, spot: 0.35, laser: 1 } },
  // ---------- magazines
  { id: 'stdmag', slot: 'magazine', c: ALLC, name: 'Standard Magazine', desc: 'Factory capacity.', mods: {} },
  { id: 'extmag', slot: 'magazine', c: ['ar', 'smg', 'mr', 'sr', 'sg'], not: ['breacher', 'rampart', 'kestrel'], name: 'Extended Mag', desc: 'More rounds per magazine. Longer to swap and a bit heavier.', mods: { mag: 0.5, reload: 0.15, ads: 0.05, move: -0.02 } },
  { id: 'drum', slot: 'magazine', c: ['ar', 'smg'], not: ['kestrel', 'wasp'], name: 'Drum Magazine', desc: 'Double capacity. Slow reloads and noticeably heavier.', mods: { mag: 1.0, reload: 0.4, ads: 0.12, move: -0.06 } },
  { id: 'fastmag', slot: 'magazine', c: ['ar', 'smg', 'lmg', 'mr', 'sr', 'sg'], not: ['breacher', 'rampart'], name: 'Fast Mag', desc: 'Pull-tab magazine for quick swaps. A stiffer spring means fewer rounds.', mods: { reload: -0.3, mag: -0.2 } },
  { id: 'lmgbig', slot: 'magazine', c: ['lmg'], name: 'Extended Belt', desc: 'Half again as many rounds. The box drags on reloads and movement.', mods: { mag: 0.5, reload: 0.25, move: -0.05, ads: 0.08 } },
  { id: 'tube', slot: 'magazine', c: ['sg'], only: ['breacher', 'rampart'], name: 'Tube Extension', desc: '+3 shells under the barrel. Adds weight up front.', mods: { magAdd: 3, move: -0.04, ads: 0.06 } },
  { id: 'speedload', slot: 'magazine', c: ['sg'], only: ['breacher', 'rampart'], name: 'Shell Carrier', desc: 'Side saddle for faster reloads. Short tube holds two fewer.', mods: { reload: -0.35, magAdd: -2 } },
  { id: 'pextmag', slot: 'magazine', c: ['pi'], not: ['magnum'], name: 'Extended Mag', desc: 'More rounds. Sticks out of the grip and slows reloads.', mods: { mag: 0.6, reload: 0.12, ads: 0.06 } },
  { id: 'speedloader', slot: 'magazine', c: ['pi'], only: ['magnum'], name: 'Speedloader', desc: 'All six rounds at once. Much faster reloads, a little bulk on the belt.', mods: { reload: -0.35, move: -0.02 } },
  // ---------- stocks
  { id: 'stdstock', slot: 'stock', c: ALLC, name: 'Standard Stock', desc: 'Factory stock.', mods: {} },
  { id: 'nostock', slot: 'stock', c: ['ar', 'smg', 'mr', 'sg'], name: 'No Stock', desc: 'Very fast and light. Nothing to brace against, so recoil and aim suffer.', mods: { ads: -0.2, move: 0.07, recoil: 0.25, adsSpread: 0.15 } },
  { id: 'tacstock', slot: 'stock', c: ['ar', 'smg', 'lmg', 'mr', 'sr', 'sg'], name: 'Tactical Stock', desc: 'Cheek riser and padded butt for a steady hold. Bulkier.', mods: { recoil: -0.1, adsSpread: -0.1, ads: 0.08, move: -0.02 } },
  { id: 'lightstock', slot: 'stock', c: ['ar', 'smg', 'lmg', 'mr', 'sr', 'sg'], name: 'Skeleton Stock', desc: 'Cut-down frame. Quicker handling, less damping.', mods: { move: 0.04, ads: -0.08, recoil: 0.1 } },
  // ---------- ammo
  { id: 'fmj', slot: 'ammo', c: ['ar', 'smg', 'lmg', 'mr', 'sr', 'pi'], name: 'Full Metal Jacket', desc: 'Standard ball ammunition.', mods: {} },
  { id: 'hollow', slot: 'ammo', c: ['ar', 'smg', 'lmg', 'mr', 'sr', 'pi'], name: 'Hollow Point', desc: 'Expands on impact for more damage. Sheds energy fast and splashes on armour.', mods: { dmg: 0.15, range: -0.25, vsHeavy: -0.15 } },
  { id: 'ap', slot: 'ammo', c: ['ar', 'smg', 'lmg', 'mr', 'sr', 'pi'], name: 'Armour Piercing', desc: 'Punches through Heavy armour. Passes through soft targets with less effect.', mods: { vsHeavy: 0.35, range: 0.1, dmg: -0.08 } },
  { id: 'subsonic', slot: 'ammo', c: ['ar', 'smg', 'lmg', 'mr', 'sr', 'pi'], name: 'Subsonic', desc: 'No supersonic crack, softer kick. Slow and weak at range.', mods: { spot: -0.15, recoil: -0.1, dmg: -0.12, range: -0.2 } },
  { id: 'buck', slot: 'ammo', c: ['sg'], name: '00 Buckshot', desc: 'The standard shell.', mods: {} },
  { id: 'slug', slot: 'ammo', c: ['sg'], name: 'Slugs', desc: 'One heavy projectile: rifle-like reach, but you have to actually hit.', mods: { pellets: -8, dmgX: 5.5, spread: -0.85, adsSpread: -0.88, range: 2.0, head: -0.3, recoil: 0.25 } },
  { id: 'flechette', slot: 'ammo', c: ['sg'], name: 'Flechette', desc: 'Darts that fly flatter and further. Each hits softer.', mods: { pellets: 3, dmg: -0.3, range: 0.4, spread: -0.1 } },
  { id: 'he', slot: 'ammo', c: ['la'], name: 'High Explosive', desc: 'The standard warhead.', mods: {} },
  { id: 'thermo', slot: 'ammo', c: ['la'], name: 'Thermobaric', desc: 'A much wider blast that is a little weaker at the centre. Bulky rounds load slowly.', mods: { blast: 0.35, dmg: -0.1, reload: 0.15 } },
  { id: 'shaped', slot: 'ammo', c: ['la'], name: 'Shaped Charge', desc: 'Focused jet: big damage and wrecks Heavies, but a tight blast you have to land.', mods: { dmg: 0.4, blast: -0.35, vsHeavy: 0.5 } },
];
const ATT_BY_ID = {}; ATT.forEach(a => { ATT_BY_ID[a.id] = a; });
const slotsFor = def => CAT_SLOTS[def.cat].filter(s => !(def.noSlots || []).includes(s));
function stockId(def, slot) {
  if (slot === 'optic') return def.optic || (def.cat === 'sg' ? 'bead' : def.cat === 'pi' || def.cat === 'la' ? 'irons_p' : 'irons');
  if (slot === 'ammo') return def.cat === 'sg' ? 'buck' : def.cat === 'la' ? 'he' : 'fmj';
  return { muzzle: 'nomuzzle', barrel: 'stdbarrel', underbarrel: 'nounder', magazine: 'stdmag', stock: 'stdstock' }[slot];
}
const attOK = (a, def) => a.c.includes(def.cat) && (!a.only || a.only.includes(def.id)) && !(a.not && a.not.includes(def.id)) && slotsFor(def).includes(a.slot);
function attFor(def, slot) { const st = ATT_BY_ID[stockId(def, slot)]; return [st].concat(ATT.filter(a => a.slot === slot && a !== st && attOK(a, def))); }
const stockFor = (def, slot) => ATT_BY_ID[stockId(def, slot)];
function equipped(def, slot) { const sel = ATTS[def.id] && ATTS[def.id][slot], a = sel && ATT_BY_ID[sel]; return a && a.slot === slot && (attOK(a, def) || a.id === stockId(def, slot)) ? a : stockFor(def, slot); }
// an attachment's effect measured against the factory part
function relMods(a, def) {
  const st = stockFor(def, a.slot), out = {};
  if (a === st) { for (const k in a.mods) if (ABS_KEYS.has(k)) out[k] = a.mods[k]; return out; }
  for (const k in a.mods) out[k] = a.mods[k];
  for (const k in st.mods) { if (ABS_KEYS.has(k)) continue; if (k === 'dmgX') out.dmgX = (out.dmgX || 1) / st.mods.dmgX; else out[k] = (out[k] || 0) - st.mods[k]; if (Math.abs(out[k]) < 1e-9) delete out[k]; }
  return out;
}

/* ---------- effective stats */
// handling changes are amplified so attachments are clearly felt in play (the pros/cons text shows the same numbers)
const ATT_AMP = { recoil: 1.7, spread: 1.6, adsSpread: 1.6, ads: 1.5, move: 1.4, reload: 1.2, range: 1.3, spot: 1.3 };
function computeStats(def, override, factory) {
  const b = def, m = { dmg: 0, rate: 0, spread: 0, adsSpread: 0, recoil: 0, reload: 0, mag: 0, magAdd: 0, range: 0, ads: 0, move: 0, spot: 0, pellets: 0, head: 0, vsHeavy: 0, len: 0, blast: 0, dmgX: 1 };
  let zoom = null, stealth = !!b.stealth, laser = false, overlay = 0, optic = null;
  for (const slot of slotsFor(def)) {
    const a = override && override.slot === slot ? override : factory ? stockFor(def, slot) : equipped(def, slot); if (!a) continue;
    const r = relMods(a, def);
    if (slot === 'optic') { optic = a.id; zoom = a.mods.zoom || null; overlay = a.mods.overlay || 0; }
    for (const k in r) { const v = r[k]; if (k === 'stealth') stealth = true; else if (k === 'laser') laser = true; else if (k === 'zoom' || k === 'overlay') {} else if (k === 'dmgX') m.dmgX *= v; else m[k] += v * (ATT_AMP[k] || 1); }
  }
  const eff = b.eff * Math.max(0.2, 1 + m.range);
  return {
    dmg: b.dmg * Math.max(0.2, 1 + m.dmg) * m.dmgX, pellets: Math.max(1, b.pellets + m.pellets), head: b.head * (1 + m.head),
    interval: b.interval / Math.max(0.2, 1 + m.rate), spread: b.spread * Math.max(0.05, 1 + m.spread), adsSpread: b.adsSpread * Math.max(0.05, 1 + m.adsSpread),
    recoil: b.recoil * Math.max(0.2, 1 + m.recoil), reload: b.reload * Math.max(0.3, 1 + m.reload),
    magSize: Math.max(1, Math.round(b.mag * (1 + m.mag)) + m.magAdd), eff, range: Math.max(b.range, eff * 3.2),
    adsTime: b.ads * Math.max(0.4, 1 + m.ads), move: b.move * Math.max(0.7, 1 + m.move), spot: (b.spot || 1) * Math.max(0.3, 1 + m.spot), vsHeavy: (b.vsHeavy || 1) * Math.max(0.3, 1 + m.vsHeavy),
    blast: (b.blast || 0) * Math.max(0.3, 1 + m.blast), adsFov: zoom || b.adsFov, stealth, laser, overlay, optic, lenAdd: m.len, burst: b.burst || 0, burstGap: b.burstGap || 0,
  };
}
// eye height of each optic above the rail it sits on
const OPTIC_H = { reddot: 0.034, holo: 0.035, reflex: 0.024, scope25: 0.044, acog4: 0.044, scope6: 0.05, scope10: 0.052, scope35: 0.046 };
// where the eye sits when aiming. Iron sights: just over the top of the sights, so you look past the rear sight and the
// front post tip sits at the centre. Red dot / holo / reflex: raised so the dot sits just above the front post.
const COWITNESS = new Set(['reddot', 'holo', 'reflex']);
function sightInfo(g) {
  const u = g.userData; if (u.sightInfo) return u.sightInfo;
  g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), v = new THREE.Vector3(), m = new THREE.Matrix4();
  const scan = (obj, fn) => obj.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; m.multiplyMatrices(inv, o.matrixWorld); const a = o.geometry.attributes.position; for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(m); fn(v); } });
  const len = u.len || 0.6;
  let top = -1, zmin = 1e9, zmax = -1e9;
  if (u.irons) scan(u.irons, p => { top = Math.max(top, p.y); zmin = Math.min(zmin, p.z); zmax = Math.max(zmax, p.z); });
  // split the factory irons: keep the front sight, drop the rear one (we draw a see-through aperture instead)
  let frontTop = -1, frontZ = -len * 0.62, rearZ = zmax > -1e8 ? zmax - 0.01 : -0.02, front = null;
  if (u.irons) {
    const split = zmin < -0.12 ? Math.min(zmax - 0.06, (zmin + zmax) / 2) : -1e9;
    u.irons.traverse(o => {
      if (!o.isMesh || split < -1e8) return;
      m.multiplyMatrices(inv, o.matrixWorld); const gsrc = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, a = gsrc.attributes.position, keep = [];
      for (let t = 0; t < a.count; t += 3) { let zc = 0; for (let k = 0; k < 3; k++) { v.fromBufferAttribute(a, t + k).applyMatrix4(m); zc += v.z; if (v.z < split) frontTop = Math.max(frontTop, v.y); } if (zc / 3 < split) keep.push(t); }
      if (!keep.length) return;
      const pos = new Float32Array(keep.length * 9), nor = new Float32Array(keep.length * 9), n = gsrc.attributes.normal;
      keep.forEach((t, q) => { for (let k = 0; k < 3; k++) { v.fromBufferAttribute(a, t + k).applyMatrix4(m); pos.set([v.x, v.y, v.z], q * 9 + k * 3); if (n) nor.set([n.getX(t + k), n.getY(t + k), n.getZ(t + k)], q * 9 + k * 3); } });
      const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.BufferAttribute(pos, 3)); if (n) ng.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); else ng.computeVertexNormals();
      front = front || new THREE.Group(); front.add(new THREE.Mesh(ng, o.material));
    });
    if (front) { frontZ = zmin + 0.01; front.name = 'ironsFront'; front.visible = false; g.add(front); u.ironsFront = front; }
  }
  // no front sight in the irons part (it is part of the body, e.g. on the gas block): find the tallest thing up front
  let bodyFront = -1, body = -1, bodyNear = -1; const bodyObj = g.children[0], camZ = -(u.adsZ || -0.3) - 0.04;
  const skip = new Set([u.irons, u.ironsFront, u.att, u.handL, u.handR, u.flash, u.mag, ...(u.stockOptic || [])].filter(Boolean));
  for (const ch of g.children) if (!skip.has(ch) && ch.name !== 'attachments' && !/hand|arm|flash|mag/i.test(ch.name || '')) scan(ch, p => { if (p.z < -len * 0.3 && p.z > -len * 0.95) bodyFront = Math.max(bodyFront, p.y); if (p.z > frontZ + 0.03 && p.z < 0.3) body = Math.max(body, p.y); if (p.z >= 0.3 && p.z < camZ) bodyNear = Math.max(bodyNear, p.y); });
  const tip = frontTop > 0 ? frontTop : bodyFront > (u.railY || 0) + 0.01 ? bodyFront : top > 0 ? top : (u.sightY || 0.06) + 0.004;
  // the iron sight line: a little over the receiver so nothing on the gun blocks the view; a tall front post built into
  // the body (AK-style) becomes the front sight itself
  const rail = u.railY || 0, base = Math.max(body, rail);
  let E = base + 0.016, bodyPost = false;
  if (bodyFront > E - 0.004 && bodyFront < E + 0.012) { E = bodyFront + 0.0012; bodyPost = true; }
  if (bodyNear > E - 0.004) E = bodyNear + 0.008;   // a launcher tube or tall stock right in front of the eye
  if (u.pistol) E = Math.max(body, rail) + 0.0065;
  return (u.sightInfo = { tip, ironTop: top > 0 ? top : tip, frontZ, rearZ, body, bodyFront, bodyNear, E, bodyPost, hasFront: frontTop > 0 || bodyFront > rail + 0.01 });
}
function ironEye(u, optic) {
  const si = u.sightInfo; if (!si) return u.sightY;
  if (optic === 'bead') return Math.max(si.body, si.bodyFront, si.bodyNear) + 0.0065;
  return si.E;   // the front post tip sits just under the centre
}
// red dot / holo / reflex: the dot sits in the middle of the optic's window, never below it, and just above the front post
const coEyeFor = (u, op) => Math.max(ironEye(u, 'irons') + 0.0028, (u.railY || 0) + OPTIC_H[op]);
function sightFor(def, u, optic) {
  if (u.sightInfo && IRON_IDS.has(optic)) return ironEye(u, optic);
  if (u.sightInfo && COWITNESS.has(optic)) return coEyeFor(u, optic);
  if (!OPTIC_H[optic] || (def.blender && !hasHQ(def) && optic === def.optic)) return u.sightY;
  return u.railY + OPTIC_H[optic];
}
function applyLoadout(wi) {
  const w = WEAPONS[wi]; if (!w) return;
  const def = w.def, u = gunObjs[wi] ? gunObjs[wi].userData : null, s = computeStats(def, null, w.factory), oldMag = w.magSize;
  Object.assign(w, { dmg: s.dmg, pellets: s.pellets, head: s.head, interval: s.interval, spread: s.spread, adsSpread: s.adsSpread, recoil: s.recoil, reload: s.reload, blast: s.blast,
    magSize: s.magSize, eff: s.eff, range: s.range, adsTime: s.adsTime, move: s.move, spot: s.spot, vsHeavy: s.vsHeavy, adsFov: s.adsFov, stealth: s.stealth, laser: s.laser, overlay: s.overlay, optic: s.optic });
  if (u) { sightInfo(gunObjs[wi]); w.sightY = sightFor(def, u, s.optic); w.adsZ = u.adsZ; w.len = u.len + s.lenAdd; buildAttachmentVisuals(wi); }
  if (w.magSize !== oldMag) { const extra = Math.max(0, w.ammo - w.magSize); w.ammo = Math.min(w.ammo, w.magSize); w.reserve = Math.min(w.reserveMax, w.reserve + extra); }
}
function initAttachments() { WEAPONS.forEach((w, i) => applyLoadout(i)); WEAPONS.forEach(w => { w.ammo = w.magSize; }); }

/* ---------- pros / cons text, generated from the numbers so they always match */
const STAT_TXT = {
  dmg: ['Damage', 1], spread: ['Hip-fire spread', -1], adsSpread: ['Aimed spread', -1], recoil: ['Recoil', -1], reload: ['Reload time', -1], mag: ['Magazine', 1],
  range: ['Effective range', 1], ads: ['Aim-down-sight time', -1], move: ['Movement speed', 1], spot: ['How fast enemies spot you', -1], vsHeavy: ['Damage vs Heavy', 1], head: ['Headshot multiplier', 1],
  blast: ['Blast radius', 1],
};
function prosCons(a, def) {
  const pros = [], cons = [], b = def, st = stockFor(def, a.slot), r = relMods(a, def);
  if (a === st) return { pros, cons };
  const unit = def.cat === 'sg' ? 'shells' : 'rounds';
  for (const k in r) {
    const v = r[k];
    if (STAT_TXT[k]) { const [label, good] = STAT_TXT[k], va = v * (ATT_AMP[k] || 1); const s = `${label} ${va > 0 ? '+' : ''}${Math.round(va * 100)}%`; (v * good > 0 ? pros : cons).push(s); }
    else if (k === 'magAdd') (v > 0 ? pros : cons).push(`Magazine ${v > 0 ? '+' : ''}${v} ${unit}`);
    else if (k === 'pellets') (v > 0 ? pros : cons).push(`Pellets ${b.pellets} → ${b.pellets + v}`);
    else if (k === 'dmgX') (v >= 1 ? pros : cons).push(`Damage per projectile ×${+v.toFixed(2)}`);
    else if (k === 'stealth') pros.push('No muzzle flash or tracers');
    else if (k === 'laser') pros.push('Visible laser aim point');
  }
  const z0 = st.mods.zoom || b.adsFov, z1 = a.mods.zoom || b.adsFov;
  if (Math.abs(z1 - z0) > 0.5) (z1 < z0 ? pros : cons).push(`Zoom ${(75 / z0).toFixed(1)}× → ${(75 / z1).toFixed(1)}×`);
  if (a.slot === 'optic' && (a.mods.overlay || 0) > (st.mods.overlay || 0) && !st.mods.overlay) cons.push('Narrow view while aiming');
  if (r.len > 0.04 && !cons.some(c => /Aim-down/.test(c))) cons.push('Longer weapon');
  if ((r.mag || r.magAdd) && def.mag) { const n = Math.max(1, Math.round(def.mag * (1 + (r.mag || 0))) + (r.magAdd || 0)); if (r.mag) { const i = pros.concat(cons).find(x => /^Magazine [+-]\d+%/.test(x)); const tgt = n > def.mag ? pros : cons; const idx = tgt.indexOf(i); if (idx >= 0) tgt[idx] = `Magazine ${def.mag} → ${n} ${unit}`; } }
  if (r.pellets || r.dmgX) {
    const t0 = b.dmg * b.pellets, t1 = b.dmg * (1 + (r.dmg || 0)) * (r.dmgX || 1) * Math.max(1, b.pellets + (r.pellets || 0));
    (t1 >= t0 ? pros : cons).push(`Damage per shell ${Math.round(t0)} → ${Math.round(t1)}`);
  }
  return { pros, cons };
}

/* ---------- visuals on the first-person guns (placed from each model's anchors) */
const AV = {};
function attMat() {
  if (AV.dark) return AV;
  AV.dark = new THREE.MeshStandardMaterial({ color: C(0x1b1d20), metalness: 0.7, roughness: 0.4, envMapIntensity: 1.2 });
  AV.poly = new THREE.MeshStandardMaterial({ color: C(0x232528), metalness: 0.1, roughness: 0.7 });
  AV.tan = new THREE.MeshStandardMaterial({ color: C(0x8a7b5a), metalness: 0.05, roughness: 0.8 });
  AV.brass = VM.brass;
  AV.laser = new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  AV.lens = VM.lens; AV.dot = VM.dot;
  AV.darkDS = AV.dark.clone(); AV.darkDS.side = THREE.DoubleSide;
  AV.fiber = new THREE.MeshBasicMaterial({ color: 0x9dff3a, toneMapped: false }); AV.fiberR = new THREE.MeshBasicMaterial({ color: 0xff7a1a, toneMapped: false });
  AV.dotTop = new THREE.MeshBasicMaterial({ color: 0xff3020, depthTest: false, depthWrite: false, transparent: true, toneMapped: false });
  return AV;
}
const IRON_IDS = new Set(['irons', 'irons_p', 'bead', 'sirons']);
// Blender-made attachment meshes (HQDATA['att_*']), built once and cloned (clones share geometry)
const ATT_HQ = {};
function hqAtt(name) {
  if (typeof HQDATA === 'undefined' || !HQDATA['att_' + name]) return null;
  if (!ATT_HQ[name]) { armoryMats(); const H = HQDATA['att_' + name], grp = new THREE.Group(); for (const p in H.parts) grp.add(hqPart(H.parts[p])); ATT_HQ[name] = grp; }
  const c = ATT_HQ[name].clone(); c.name = 'att_' + name; c.traverse(o => { if (o.isMesh && o.material === VM.dot) o.visible = false; }); return c;
}
function buildAttachmentVisuals(wi) { const w = WEAPONS[wi]; attachVisuals(gunObjs[wi], w.def, w.factory, w.len, null); }
// ovr: an attachment shown in place of the equipped one in its slot (loadout preview)
function attachVisuals(g, def, factory, wlen, ovr) {
  const u = g.userData, M = attMat(), w = { len: wlen };
  if (u.att) g.remove(u.att);
  const grp = new THREE.Group(); grp.name = 'attachments'; u.att = grp; g.add(grp);
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); grp.add(m); return m; };
  const tubeZ = (r, len, mat, x, y, z0, seg = 14) => add(new THREE.CylinderGeometry(r, r, len, seg), mat, x, y, z0 - len / 2, Math.PI / 2);
  // place a Blender attachment at a mount; sr scales it across the bore (x/y) to fit the barrel
  const HQ = (name, x, y, z, sr = 1, parent = grp, ry = 0) => { const m = hqAtt(name); if (!m) return null; m.position.set(x, y, z); m.rotation.y = ry; if (sr !== 1) m.scale.set(sr, sr, 1); parent.add(m); return m; };
  const fit = (want, have) => clamp(want / have, 0.6, 1.7);
  const slots = slotsFor(def), E = s => (slots.includes(s) ? (ovr && ovr.slot === s ? ovr : factory ? stockFor(def, s) : equipped(def, s)).id : null);
  const base = u.len, barrelExtra = E('barrel') === 'long' ? 0.12 : 0, my = u.muzzleY, br = u.barrelR || 0.011, R = y => y;
  const op = E('optic') || def.optic, oz = u.opticZ; sightInfo(g);
  // red dots / holos / reflexes ride on a riser so the dot lines up just above the front post
  const coEye = COWITNESS.has(op) && u.sightInfo ? coEyeFor(u, op) : null;
  const ry = coEye !== null ? Math.max(u.railY, coEye - OPTIC_H[op]) : u.railY;
  if (coEye !== null && op !== 'holo' && op !== 'reflex' && ry - u.railY > 0.003) add(new THREE.BoxGeometry(0.026, ry - u.railY, 0.05), M.dark, 0, u.railY + (ry - u.railY) / 2, oz);
  u.dots = [];
  if (u.stockOptic) u.stockOptic.forEach(o => { o.visible = op === 'reddot' && o.material !== VM.dot; });
  // factory irons: the bead / pistol sights stay as they are; rifle irons lose the solid rear sight (see-through aperture below)
  const rifleIrons = (op === 'irons' || op === 'sirons' || op === 'irons_p') && !u.pistol;
  if (u.irons) u.irons.visible = false;
  if (u.ironsFront) u.ironsFront.visible = false;
  // barrels
  const tip = -(base + barrelExtra);
  if (barrelExtra) { tubeZ(br * 0.95, barrelExtra + 0.02, M.dark, 0, my, -base + 0.01); if (def.blender === 'rifle') add(new THREE.BoxGeometry(0.06, 0.06, 0.1), M.poly, 0, 0.004, -0.6); }
  if (E('barrel') === 'heavy') tubeZ(Math.max(br * 1.55, 0.014), 0.16, M.dark, 0, my, -base + 0.24);
  // muzzle devices
  const mz = E('muzzle'), mr = Math.max(0.017, br * 1.9);
  if (mz === 'suppressor' && (u.pistol ? HQ('suppressor_p', 0, my, tip + 0.01) : HQ('suppressor', 0, my, tip + 0.01, clamp((br * 1.6 + 0.003) / 0.021, 0.85, 1.15)))) {}
  else if (mz === 'comp' && HQ('comp', 0, my, tip + 0.004, fit(u.pistol ? 0.013 : mr, 0.014))) {}
  else if (mz === 'brake' && HQ('brake', 0, my, tip + 0.004, fit(mr + 0.002, 0.016))) {}
  else if (mz === 'choke' && HQ('choke', 0, my, tip + 0.004, fit(br + 0.004, 0.0205))) {}
  else if (mz === 'spreader' && HQ('spreader', 0, my, tip + 0.004, fit(br + 0.004, 0.02))) {}
  else {
  if (mz === 'suppressor') { tubeZ(u.pistol ? 0.017 : mr + 0.004, 0.17, M.poly, 0, my, tip + 0.02, 18); tubeZ((u.pistol ? 0.017 : mr + 0.004) + 0.0006, 0.012, M.dark, 0, my, tip - 0.14, 18); }
  if (mz === 'comp') { const r = u.pistol ? 0.013 : mr; tubeZ(r, 0.06, M.dark, 0, my, tip + 0.005); for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.012, 0.006, 0.008), M.poly, 0, my + r, tip - 0.01 - k * 0.015); }
  if (mz === 'brake') { tubeZ(mr + 0.002, 0.065, M.dark, 0, my, tip + 0.005); for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.012, 0.03, 0.04), M.dark, s * (mr + 0.004), my, tip - 0.03); }
  if (mz === 'choke') tubeZ(br + 0.003, 0.05, M.dark, 0, my, tip + 0.005, 16);
  if (mz === 'spreader') add(new THREE.BoxGeometry(0.05, 0.016, 0.05), M.dark, 0, my, tip - 0.02);
  }
  // optics: everything sits on the rail at (railY, opticZ)
  const lensAt = (y, z, wdt, h) => { add(new THREE.PlaneGeometry(wdt, h), M.lens, 0, y, z); };
  const notStock = !(def.blender && !hasHQ(def) && op === def.optic);
  const OPT_DZ = { reddot: 0.02, scope25: 0.005, scope6: 0.015, scope10: 0.017, scope35: 0.011 };
  const hqOpt = OPTIC_H[op] !== undefined && op !== 'holo' && op !== 'reflex' && (op !== 'reddot' || notStock) && HQ(op, 0, ry, oz + (OPT_DZ[op] || 0));
  if (op === 'acog4') add(new THREE.BoxGeometry(0.0045, 0.0045, 0.075), M.fiberR, 0, ry + (hqOpt ? 0.0762 : 0.0715), oz - 0.01);   // the lit fibre on top
  if (!hqOpt) {
  if (notStock && op === 'reddot') {
    add(new THREE.BoxGeometry(0.034, 0.012, 0.07), M.dark, 0, ry + 0.006, oz); tubeZ(0.02, 0.07, M.dark, 0, ry + 0.034, oz + 0.035, 16);
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.0165, 16), M.lens); l.position.set(0, ry + 0.034, oz + 0.036); grp.add(l);
  }
  if (op === 'holo') {   // EOTech EXPS3-size holo (the kind Rainbow Six uses): 96 mm long, 30 x 23 mm window in a 70 mm hood tunnel, 4 mm walls
    const cy = coEye !== null ? coEye : ry + 0.035, wW = 0.030, wH = 0.023, t = 0.004, L = 0.096, hl = 0.07, hz = oz - L / 2 + hl / 2, bot = cy - wH / 2 - 0.003;
    add(new THREE.BoxGeometry(0.036, bot - u.railY, L), M.dark, 0, u.railY + (bot - u.railY) / 2, oz);                 // body + mount under the window
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.005, 0.012, 0.016), M.poly, s * 0.0195, bot - 0.008, oz + 0.026);   // side buttons
    add(new THREE.BoxGeometry(0.03, 0.006, 0.03), M.poly, 0, u.railY + 0.003, oz - 0.02);                               // QD lever
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(t, wH + t, hl), M.dark, s * (wW + t) / 2, cy + t / 2 - 0.0005, hz);  // hood sides
    add(new THREE.BoxGeometry(wW + 2 * t, t, hl), M.dark, 0, cy + wH / 2 + t / 2, hz);                                  // hood top
    add(new THREE.PlaneGeometry(wW, wH), M.lens, 0, cy, hz - hl / 2 + 0.003);                                           // front glass
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.004, 0.008, 0.012), M.dark, s * 0.009, bot + 0.004, oz + L / 2 - 0.008);   // rear buttons
  }
  if (op === 'reflex') {   // open mini reflex: slim base, thin frame, clear window around the dot
    const cy = coEye !== null ? coEye : ry + 0.024, wW = 0.022, wH = 0.017, t = 0.0025, wz = oz - 0.012, bot = cy - wH / 2 - t;
    add(new THREE.BoxGeometry(0.022, bot - u.railY, 0.04), M.dark, 0, u.railY + (bot - u.railY) / 2, oz);
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(t, wH + t, 0.006), M.dark, sx * (wW + t) / 2, cy, wz);
    add(new THREE.BoxGeometry(wW + 2 * t, t, 0.006), M.dark, 0, cy + wH / 2 + t / 2, wz);
    add(new THREE.PlaneGeometry(wW, wH), M.lens, 0, cy, wz - 0.002);
  }
  if (op === 'scope25' || op === 'acog4') {
    const big = op === 'acog4', y = ry + 0.044;
    if (big) { add(new THREE.BoxGeometry(0.042, 0.05, 0.13), M.dark, 0, ry + 0.039, oz - 0.01); tubeZ(0.021, 0.05, M.dark, 0, y, oz - 0.075, 16); add(new THREE.BoxGeometry(0.01, 0.006, 0.08), M.tan, 0, ry + 0.068, oz); add(new THREE.CircleGeometry(0.017, 16), M.lens, 0, y, oz - 0.101); }
    else { tubeZ(0.018, 0.22, M.dark, 0, y, oz + 0.12, 18); tubeZ(0.024, 0.05, M.dark, 0, y, oz - 0.06, 18); for (const z of [oz + 0.06, oz - 0.04]) add(new THREE.BoxGeometry(0.03, 0.04, 0.012), M.dark, 0, ry + 0.02, z); add(new THREE.CircleGeometry(0.017, 16), M.lens, 0, y, oz - 0.111); }
  }
  if (op === 'scope6' || op === 'scope10' || op === 'scope35') {
    const y = ry + OPTIC_H[op], L = op === 'scope10' ? 0.34 : op === 'scope6' ? 0.3 : 0.22, ob = op === 'scope10' ? 0.03 : op === 'scope6' ? 0.026 : 0.022;
    tubeZ(0.017, L, M.dark, 0, y, oz + L * 0.55, 18); tubeZ(ob, 0.08, M.dark, 0, y, oz - L * 0.45 + 0.08, 20); tubeZ(0.021, 0.06, M.dark, 0, y, oz + L * 0.55, 18);
    add(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 10), M.dark, 0, y + 0.024, oz + 0.02); add(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 10), M.dark, 0.024, y, oz + 0.02, 0, 0, Math.PI / 2);
    for (const z of [oz + L * 0.3, oz - L * 0.15]) add(new THREE.BoxGeometry(0.03, OPTIC_H[op] - 0.01, 0.014), M.dark, 0, ry + (OPTIC_H[op] - 0.01) / 2, z);
    add(new THREE.CircleGeometry(ob - 0.003, 18), M.lens, 0, y, oz - L * 0.45 - 0.0005);
  }
  }
  // aim points: the dot (and the holo ring) at eye height, and a front post under it when the irons are folded away
  if (coEye !== null) {
    const dz = op === 'reddot' ? oz + 0.03 : op === 'holo' ? oz - 0.012 : oz - 0.015;
    const dm = new THREE.Mesh(new THREE.CircleGeometry(op === 'holo' ? 0.0008 : 0.0016, 12), M.dotTop); dm.position.set(0, coEye, dz); dm.renderOrder = 20; grp.add(dm); u.dots.push(dm);
    if (op === 'holo') { const rg = new THREE.Mesh(new THREE.RingGeometry(0.0043, 0.0049, 48), M.dotTop); rg.position.set(0, coEye, dz); rg.renderOrder = 20; grp.add(rg); u.dots.push(rg); }
    if (!u.sightInfo.bodyPost) frontSight(coEye - 0.0028, u.sightInfo.frontZ);
  }
  // iron sights, built the same way on every gun so they line up exactly with where the bullets go
  function frontSight(top, fz) {   // protected front post: a tower off the barrel, two ears, a thin post with a fibre insert
    const foot = Math.min((u.muzzleY || 0) + (u.barrelR || 0.01) * 0.6, top - 0.02), h = top - foot;
    add(new THREE.BoxGeometry(0.006, Math.max(0.002, h - 0.02), 0.012), M.dark, 0, foot + (h - 0.02) / 2, fz);
    add(new THREE.BoxGeometry(0.018, 0.003, 0.01), M.dark, 0, top - 0.02, fz);
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.0018, 0.021, 0.008), M.dark, sx * 0.0078, top - 0.0095, fz);
    add(new THREE.BoxGeometry(0.0017, 0.019, 0.0022), M.dark, 0, top - 0.0095, fz);
    add(new THREE.BoxGeometry(0.0011, 0.0016, 0.0005), M.fiber, 0, top - 0.0012, fz + 0.0014);
  }
  function rearSight(eye, rz) {   // flip-up aperture: base on the rail, guard ears, a thin ring to look through
    const base = Math.min(u.railY, eye - 0.016);
    add(new THREE.BoxGeometry(0.026, 0.006, 0.022), M.dark, 0, base + 0.003, rz);
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.0018, Math.max(0.002, eye - base - 0.006), 0.003), M.dark, sx * 0.0055, base + 0.006 + (eye - base - 0.006) / 2, rz);
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.0025, eye + 0.0015 - base - 0.006, 0.01), M.dark, sx * 0.0115, base + 0.006 + (eye + 0.0015 - base - 0.006) / 2, rz);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.0038, 0.0058, 36), M.darkDS); ring.position.set(0, eye, rz); grp.add(ring);
  }
  const si = u.sightInfo;
  if (rifleIrons && si) {
    const eye = ironEye(u, op);
    if (!si.bodyPost) frontSight(eye - 0.0006, si.frontZ);
    rearSight(eye, Math.max(si.rearZ, si.frontZ + 0.2));
  }
  // pistols: a square-notch rear and a front post with a fibre dot, tops level with the sight line
  if (op === 'irons_p' && u.pistol && si) {
    const eye = ironEye(u, op), top = eye - 0.0006, sl = Math.max(si.body, u.railY), fz = -(u.len || 0.2) + 0.014, rz = Math.min(-0.01, si.rearZ);
    add(new THREE.BoxGeometry(0.0028, top - sl + 0.001, 0.005), M.dark, 0, sl + (top - sl) / 2, fz);
    add(new THREE.CircleGeometry(0.0009, 10), M.fiberR, 0, top - 0.0012, fz + 0.0026);
    for (const sx of [-1, 1]) { add(new THREE.BoxGeometry(0.0042, top - sl + 0.001, 0.005), M.dark, sx * 0.0038, sl + (top - sl) / 2, rz); add(new THREE.CircleGeometry(0.0007, 8), M.fiber, sx * 0.0038, top - 0.0014, rz + 0.0026); }
  }
  // shotgun bead: a brass bead at the muzzle on a short post, with a mid bead on the rib
  if (op === 'bead' && si) {
    const eye = ironEye(u, 'bead'), fz = -(u.len || 0.7) + 0.03, by = (u.muzzleY || u.railY) + (u.barrelR || 0.01) * 0.8;
    add(new THREE.BoxGeometry(0.005, Math.max(0.002, eye - 0.006 - by), 0.008), M.dark, 0, by + (eye - 0.006 - by) / 2, fz);
    add(new THREE.SphereGeometry(0.0062, 12, 10), M.fiberR, 0, eye - 0.0035, fz);   // bright fibre bead, centred just under the aim point
    add(new THREE.SphereGeometry(0.0013, 8, 6), M.brass, 0, eye - 0.0013 - (eye - by) * 0.45, fz * 0.55);
  }
  // underbarrel
  const ub = E('underbarrel'), uy = u.underY, uz = u.underZ;
  if (ub === 'vgrip' && HQ('vgrip', 0, uy, uz)) {}
  else if (ub === 'agrip' && HQ('agrip', 0, uy, uz + 0.02)) {}
  else if (ub === 'bipod' && HQ('bipod', 0, uy, uz, 1, grp, Math.PI)) {}   // legs folded back
  else if (ub === 'laser' && u.laser && HQ('laser', u.laser[0], u.laser[1], u.laser[2])) {
    const [lx, ly, lz] = u.laser;
    const beam = add(new THREE.CylinderGeometry(0.0012, 0.0012, 2.2, 6), M.laser, lx - 0.005, ly - 0.004, lz - 1.13, Math.PI / 2); beam.renderOrder = 2;
  } else {
  if (ub === 'vgrip') add(new THREE.BoxGeometry(0.028, 0.085, 0.032), M.poly, 0, uy - 0.042, uz, 0.15);
  if (ub === 'agrip') add(new THREE.BoxGeometry(0.03, 0.03, 0.08), M.poly, 0, uy - 0.012, uz + 0.16, -0.5);
  if (ub === 'bipod') { add(new THREE.BoxGeometry(0.03, 0.02, 0.03), M.dark, 0, uy - 0.008, uz); for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.008, 0.008, 0.2), M.dark, s * 0.012, uy - 0.018, uz + 0.1); }
  if (ub === 'laser' && u.laser) {
    const [lx, ly, lz] = u.laser;
    add(new THREE.BoxGeometry(0.022, 0.022, 0.055), M.dark, lx, ly, lz);
    add(new THREE.CircleGeometry(0.004, 8), M.dot, lx, ly, lz - 0.0285);
    const beam = add(new THREE.CylinderGeometry(0.0012, 0.0012, 2.2, 6), M.laser, lx, ly, lz - 1.13, Math.PI / 2); beam.renderOrder = 2;
  }
  }
  // magazines (they live in the mag group so the reload animation moves them)
  const mg = E('magazine');
  if (u.mag) {
    const inner = u.mag.children[0], tall = !u.magStyle || u.magStyle === 'straight' || u.magStyle === 'curved' || u.magStyle === 'short';
    if (inner) { inner.visible = true; inner.scale.set(1, tall ? (mg === 'extmag' ? 1.45 : mg === 'drum' ? 0.55 : mg === 'fastmag' ? 0.85 : 1) : (mg === 'lmgbig' || mg === 'extmag' ? 1.3 : 1), 1); }
    if (u.drum) { u.mag.remove(u.drum); u.drum = null; }
    if (u.magX) { u.mag.remove(u.magX); u.magX = null; }
    const hd = mg === 'drum' && tall && HQ('drum', 0, 0, 0, 1, u.mag); if (hd) { u.drum = hd; if (inner) inner.visible = false; }
    if (mg === 'pextmag' && u.pistol && inner) {   // base pad goes on the bottom of the pistol mag
      const bb = new THREE.Box3(); inner.updateMatrix();
      inner.traverse(o => { if (o.geometry) { o.geometry.computeBoundingBox(); bb.union(o.geometry.boundingBox); } }); bb.applyMatrix4(inner.matrix);
      const p = isFinite(bb.min.y) && HQ('pext', 0, bb.min.y + 0.004, (bb.min.z + bb.max.z) / 2 + 0.002, 1, u.mag); if (p) { p.rotation.x = 0.2; u.magX = p; }
    }
    if (mg === 'drum' && tall && !hd) { const d =new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.055, 22), M.dark); d.rotation.z = Math.PI / 2; d.position.set(0, -0.085, 0.005); u.mag.add(d); u.drum = d; }
    if (mg === 'fastmag' && tall) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.01), M.tan); t.position.set(0, u.magStyle === 'short' ? -0.06 : -0.105, -0.012); u.mag.add(t); u.magX = t; }
    if (mg === 'pextmag' && u.pistol && !u.magX) { const t =new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.05), M.poly); t.position.set(0, -0.02, 0.004); t.rotation.x = 0.2; u.mag.add(t); u.magX = t; }
  }
  if (mg === 'pextmag' && u.pistol && !u.mag) add(new THREE.BoxGeometry(0.03, 0.035, 0.05), M.poly, 0, -0.135, 0.068, 0.2);
  if (u.tube && mg === 'tube' && !HQ('tube', 0, my - 0.044, -base + 0.16)) tubeZ(0.0175, 0.12, M.dark, 0, my - 0.044, -base + 0.16);
  if (u.tube && mg === 'speedload' && !HQ('carrier', 0.032, my - 0.013, -0.06)) { add(new THREE.BoxGeometry(0.008, 0.035, 0.1), M.poly, 0.034, my - 0.013, -0.06); for (let k = 0; k < 4; k++) add(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 8), M.brass, 0.04, my - 0.013, -0.095 + k * 0.023); }
  if (mg === 'speedloader' && u.revolver && !HQ('speedloader', 0.06, -0.12, 0.12)) add(new THREE.CylinderGeometry(0.02, 0.02, 0.025, 10), M.dark, 0.06, -0.12, 0.12);
  if (mg === 'gldrum' && u.cyl) add(new THREE.BoxGeometry(0.03, 0.03, 0.12), M.tan, 0.06, -0.02, -0.0);
  // stocks
  const st = E('stock'), sz = u.stockZ !== undefined ? u.stockZ : 0.05, sy = u.stockY !== undefined ? u.stockY : 0.01;
  if (st === 'tacstock' && HQ('tacstock', 0, sy, sz)) {}
  else if (st === 'lightstock' && HQ('lightstock', 0, sy, sz)) {}
  else if (st === 'tacstock') { add(new THREE.BoxGeometry(0.044, 0.025, 0.12), M.poly, 0, sy + 0.04, sz + 0.14); add(new THREE.BoxGeometry(0.06, 0.1, 0.02), M.poly, 0, sy - 0.02, sz + 0.27); }
  else if (st === 'lightstock') add(new THREE.BoxGeometry(0.012, 0.012, 0.18), M.dark, 0, sy + 0.022, sz + 0.14);
  // muzzle flash follows the new muzzle
  if (u.flash) u.flash.position.z = -(w.len + 0.06);
}
/* ---------- scope overlay + laser dot (per frame) */
let laserDot = null; const _lr = new THREE.Raycaster(), _lv = new THREE.Vector3();
function updateAttachments() {
  const w = WEAPONS[G.cur], playing = G.state === 'playing' || G.state === 'paused';
  const scoped = playing && w.overlay && G.ads > 0.85;
  const sc = $('scope'); if (sc && sc._on !== scoped) { sc._on = scoped; sc.classList.toggle('hide', !scoped); }
  if (sc && scoped && sc._acog !== (w.optic === 'acog4')) { sc._acog = w.optic === 'acog4'; sc.classList.toggle('acog', sc._acog); }
  G.scoped = scoped;
  if (!laserDot) { laserDot = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0xff3030, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); laserDot.scale.set(0.09, 0.09, 1); laserDot.visible = false; scene.add(laserDot); }
  const show = playing && w.laser && G.ads < 0.5 && G.swapT <= 0 && !G.reloading;
  laserDot.visible = false;
  if (show) {
    _lv.set(0, 0, -1).applyQuaternion(camera.quaternion); _lr.set(camera.position, _lv); _lr.far = 60;
    const h = _lr.intersectObjects(wallMeshes, false)[0];
    if (h) { laserDot.position.copy(h.point).addScaledVector(_lv, -0.03); laserDot.visible = true; }
  }
}

/* ---------- loadout menu */
// Class tabs across the top. Left: what you can change. Middle: the choices. Right: a 3D look at the gun and
// its stats, with a green/red preview of whatever you are pointing at. A help line at the bottom says what to do.
let loRow = 'p', loSlot = 'optic', loPreview = null, loPrevW = null, loCat = null, loRename = false;
const STAT_BARS = [
  ['DAMAGE', s => s.dmg * s.pellets, 0, 160, s => s.pellets > 1 ? `${Math.round(s.dmg)} × ${s.pellets}` : `${Math.round(s.dmg)}`],
  ['FIRE RATE', s => 60 / (s.burst ? (s.interval + s.burstGap * (s.burst - 1)) / s.burst : s.interval), 0, 1100, s => s.burst ? `${Math.round(60 / s.interval)} BURSTS/MIN` : `${Math.round(60 / s.interval)} RPM`],
  ['RANGE', s => s.eff, 0, 130, s => s.blast ? `${s.blast.toFixed(1)} M BLAST` : `${Math.round(s.eff)} M`],
  ['ACCURACY (AIMING)', s => 1 / s.adsSpread, 0, 500, s => `${Math.round(clamp(1 / s.adsSpread / 5, 0, 100))}`],
  ['ACCURACY (HIP)', s => 1 / s.spread, 0, 110, s => `${Math.round(clamp(1 / s.spread / 1.1, 0, 100))}`],
  ['CONTROL', s => 1 / s.recoil, 0, 130, s => `${Math.round(clamp(1 / s.recoil / 1.3, 0, 100))}`],
  ['AIM SPEED', s => 1 / s.adsTime, 0.4, 1.6, s => `${Math.round(s.adsTime * 180)} MS`],
  ['MOVE SPEED', s => s.move, 0.78, 1.15, s => `${Math.round(s.move * 100)}%`],
  ['MAGAZINE', s => s.magSize, 0, 120, s => `${s.magSize} ROUNDS`],
];
const LO_ROWS = [['p', 'PRIMARY WEAPON'], ['pa', 'PRIMARY ATTACHMENTS'], ['s', 'SECONDARY WEAPON'], ['sa', 'SECONDARY ATTACHMENTS'], ['e', 'EQUIPMENT'], ['k', 'PERK']];
const LO_HELP = {
  p: 'Pick the main gun for this class. Use the tabs to switch weapon type. Bars on the right compare it with the gun you have now: green is better, red is worse.',
  s: 'Pick a backup: a pistol to switch to when your main gun runs dry, or a launcher for explosives.',
  pa: 'Choose a part slot along the top, then a part. Every part has a plus and a minus, listed under it and shown on the bars.',
  sa: 'Choose a part slot along the top, then a part. Every part has a plus and a minus, listed under it and shown on the bars.',
  e: 'Thrown with G (keyboard) or RB (controller). You get a few per life and more from ammo crates.',
  k: 'A passive bonus that is always on while you play this class.',
};
const roleOf = d => d.cat === 'la' ? 'EXPLOSIVE' : d.eff < 21 ? 'CLOSE RANGE' : d.eff < 50 ? 'MID RANGE' : 'LONG RANGE';
const inGame = () => G.state === 'paused' || G.state === 'playing';
function loDef(row) { const c = activeClass(); return ARM[row === 'p' || row === 'pa' ? c.p : c.s]; }
function openLoadout(from) { returnScreen = from || curScreen || 'menu'; loPreview = null; loPrevW = null; loCat = null; loRename = false; renderLoadout(); showScreen('loadout'); }
function fittedCount(d) { return slotsFor(d).filter(s => equipped(d, s) !== stockFor(d, s)).length; }
function loRowValue(r) {
  const c = activeClass();
  if (r === 'p' || r === 's') { const d = loDef(r); return `${d.name}<small>${CATS[d.cat].short}</small>`; }
  if (r === 'pa' || r === 'sa') { const d = loDef(r), n = fittedCount(d); return n ? `${n} OF ${slotsFor(d).length} FITTED` : 'FACTORY PARTS'; }
  if (r === 'e') return `${EQUIP[c.e].name}<small>×${EQUIP[c.e].count}</small>`;
  return PERKS[c.k].name;
}
const miniBar = (v, lo, hi) => `<i style="width:${(clamp((v - lo) / (hi - lo), 0.04, 1) * 100).toFixed(0)}%"></i>`;
function renderLoadout(focusSel) {
  const c = activeClass();
  $('loTabs').innerHTML = CLASSES.map((k, i) => (loRename && i === ACTIVE_CLASS ? `<input class="lo-rename" id="loRenameIn" maxlength="16" value="${k.name.replace(/"/g, '')}">` : `<button class="tab${i === ACTIVE_CLASS ? ' on' : ''}" data-lo-c="${i}">${k.name}</button>`)).join('') + `<button class="tab lo-pen" data-lo-ren="1" title="Rename this class">${loRename ? 'SAVE NAME' : 'RENAME'}</button>`;
  $('loSlots').innerHTML = LO_ROWS.map(([r, label]) => `<button class="lo-slot${r === loRow ? ' on' : ''}${r.length === 2 ? ' sub' : ''}" data-lo-r="${r}"><span>${label}</span><b>${loRowValue(r)}</b></button>`).join('');
  const note = $('loNote'); if (note) note.textContent = inGame() && G.equipped && (G.equipped.p !== c.p || G.equipped.s !== c.s || G.equipped.e !== c.e || G.equipped.k !== c.k) ? 'CLASS CHANGES APPLY WHEN YOU NEXT SPAWN' : '';
  const help = $('loHelp'); if (help) help.textContent = LO_HELP[loRow];
  let html = '';
  if (loRow === 'p' || loRow === 's') {
    const want = loRow === 'p' ? 'primary' : 'secondary', cur = ARM[loRow === 'p' ? c.p : c.s], cats = Object.keys(CATS).filter(k => CATS[k].slot === want);
    if (!loCat || !cats.includes(loCat)) loCat = cur.cat;
    html += `<div class="lo-chips">${cats.map(k => `<button class="lo-chip cat${k === loCat ? ' on' : ''}" data-lo-cat="${k}"><b>${CATS[k].name}</b></button>`).join('')}</div><div class="lo-grid">`;
    for (const d of armoryBy(loCat)) {
      const st = computeStats(d);
      html += `<button class="lo-card${d.id === cur.id ? ' on' : ''}" data-lo-w="${d.id}"><div class="lo-name">${d.name}${d.id === cur.id ? '<em>EQUIPPED</em>' : ''}</div><div class="lo-role">${roleOf(d)}${d.burst ? ' · BURST' : d.auto ? ' · AUTO' : d.action ? ' · ' + d.action.toUpperCase() : ' · SEMI'}</div>` +
        `<div class="lo-mini"><span>DMG</span><div>${miniBar(st.dmg * st.pellets, 0, 160)}</div><span>RATE</span><div>${miniBar(60 / st.interval, 0, 1100)}</div><span>RANGE</span><div>${miniBar(st.eff, 0, 130)}</div><span>MOVE</span><div>${miniBar(st.move, 0.78, 1.15)}</div></div><div class="lo-desc">${d.desc}</div></button>`;
    }
    html += '</div>';
  } else if (loRow === 'pa' || loRow === 'sa') {
    const d = loDef(loRow), slots = slotsFor(d); if (!slots.includes(loSlot)) loSlot = slots[0];
    html += `<div class="lo-chips">${slots.map(s => `<button class="lo-chip${s === loSlot ? ' on' : ''}" data-lo-s="${s}"><span>${SLOT_NAME[s]}</span><b>${equipped(d, s).name}</b></button>`).join('')}</div>`;
    html += attFor(d, loSlot).map(a => {
      const on = equipped(d, loSlot) === a, pc = prosCons(a, d);
      return `<button class="lo-opt${on ? ' on' : ''}" data-lo-a="${a.id}"><div class="lo-name">${a.name}${on ? '<em>EQUIPPED</em>' : a === stockFor(d, loSlot) ? '<em class="f">FACTORY</em>' : ''}</div><div class="lo-desc">${a.desc}</div>` +
        (pc.pros.length || pc.cons.length ? `<div class="lo-pc">${pc.pros.map(p => `<span class="pro">+ ${p}</span>`).join('')}${pc.cons.map(x => `<span class="con">− ${x}</span>`).join('')}</div>` : '') + '</button>';
    }).join('');
  } else if (loRow === 'e') html = Object.keys(EQUIP).map(k => `<button class="lo-opt${k === c.e ? ' on' : ''}" data-lo-e="${k}"><div class="lo-name">${EQUIP[k].name} <small>×${EQUIP[k].count}</small>${k === c.e ? '<em>EQUIPPED</em>' : ''}</div><div class="lo-desc">${EQUIP[k].desc}</div></button>`).join('');
  else html = Object.keys(PERKS).map(k => `<button class="lo-opt${k === c.k ? ' on' : ''}" data-lo-k="${k}"><div class="lo-name">${PERKS[k].name}${k === c.k ? '<em>EQUIPPED</em>' : ''}</div><div class="lo-desc">${PERKS[k].desc}</div></button>`).join('');
  $('loOpts').innerHTML = html;
  renderLoStats();
  const q = sel => $('loadout').querySelectorAll(sel);
  for (const b of q('[data-lo-c]')) b.onclick = () => selectClass(+b.dataset.loC);
  for (const b of q('[data-lo-ren]')) b.onclick = () => { if (loRename) saveRename(); else { loRename = true; renderLoadout(); setTimeout(() => { const i = $('loRenameIn'); if (i) { i.focus(); i.select(); } }, 0); } };
  const ri = $('loRenameIn'); if (ri) ri.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') { loRename = false; renderLoadout(); } };
  for (const b of q('[data-lo-r]')) { b.onclick = () => { loRow = b.dataset.loR; sfx.ui(); renderLoadout(); focusFirst('#loOpts .on'); }; b.onfocus = () => { if (loRow !== b.dataset.loR) { loRow = b.dataset.loR; loPreview = loPrevW = null; renderLoadout(`#loSlots [data-lo-r="${b.dataset.loR}"]`); } }; }
  for (const b of q('[data-lo-cat]')) b.onclick = () => { loCat = b.dataset.loCat; sfx.ui(); renderLoadout(`#loOpts [data-lo-cat="${loCat}"]`); };
  for (const b of q('[data-lo-w]')) {
    b.onclick = () => { if (loRow === 'p') c.p = b.dataset.loW; else c.s = b.dataset.loW; saveClasses(); loPrevW = null; sfx.ui(); renderLoadout(`#loOpts [data-lo-w="${b.dataset.loW}"]`); };
    b.onfocus = b.onmouseenter = () => { loPrevW = ARM[b.dataset.loW]; renderLoStats(); };
    b.onblur = b.onmouseleave = () => { loPrevW = null; renderLoStats(); };
  }
  for (const b of q('[data-lo-s]')) { b.onclick = () => { loSlot = b.dataset.loS; sfx.ui(); renderLoadout(`#loOpts [data-lo-s="${loSlot}"]`); }; }
  for (const b of q('[data-lo-a]')) {
    b.onclick = () => {
      const d = loDef(loRow); (ATTS[d.id] || (ATTS[d.id] = {}))[loSlot] = b.dataset.loA; saveClasses();
      WEAPONS.forEach((w, i) => { if (w.def === d && !w.factory) applyLoadout(i); }); sfx.ui(); renderLoadout(`#loOpts [data-lo-a="${b.dataset.loA}"]`);
    };
    b.onfocus = b.onmouseenter = () => { loPreview = ATT_BY_ID[b.dataset.loA]; renderLoStats(); };
    b.onblur = b.onmouseleave = () => { loPreview = null; renderLoStats(); };
  }
  for (const b of q('[data-lo-e]')) b.onclick = () => { c.e = b.dataset.loE; saveClasses(); sfx.ui(); renderLoadout(`#loOpts [data-lo-e="${c.e}"]`); };
  for (const b of q('[data-lo-k]')) b.onclick = () => { c.k = b.dataset.loK; saveClasses(); sfx.ui(); renderLoadout(`#loOpts [data-lo-k="${c.k}"]`); };
  if (focusSel) focusFirst(focusSel);
}
function saveRename() { const i = $('loRenameIn'); if (i) { const v = i.value.trim().toUpperCase().slice(0, 16); if (v) activeClass().name = v; saveClasses(); } loRename = false; sfx.ui(); renderLoadout(`#loTabs [data-lo-c="${ACTIVE_CLASS}"]`); }
function selectClass(i) { ACTIVE_CLASS = (i + CLASSES.length) % CLASSES.length; saveClasses(); loPreview = loPrevW = null; loCat = null; loRename = false; sfx.ui(); renderLoadout(`#loTabs [data-lo-c="${ACTIVE_CLASS}"]`); }
function focusFirst(sel) { setTimeout(() => { const el = document.querySelector && document.querySelector(sel); if (el && el.focus) try { el.focus(); el.scrollIntoView && el.scrollIntoView({ block: 'nearest' }); } catch (e) {} }, 0); }
function loShown() { const row = loRow, base = row === 'e' || row === 'k' ? ARM[activeClass().p] : loDef(row); return { base, shown: loPrevW || base }; }
function renderLoStats() {
  const row = loRow, { base, shown } = loShown();
  const cur = computeStats(base), pv = loPrevW ? computeStats(loPrevW) : loPreview && (row === 'pa' || row === 'sa') ? computeStats(base, loPreview) : null;
  const sh = pv || cur;
  $('loWName').innerHTML = `<b>${shown.name}</b><span>${CATS[shown.cat].name} · ${roleOf(shown)}</span>`;
  $('loStats').innerHTML = STAT_BARS.map(([label, f, lo, hi, fmt]) => {
    const pct = s => clamp((f(s) - lo) / (hi - lo), 0, 1) * 100, a = pct(cur), b = pv ? pct(pv) : a;
    const better = b > a + 0.5, worse = b < a - 0.5;
    return `<div class="lo-stat"><span>${label}</span><div class="bar"><i style="width:${Math.min(a, b).toFixed(1)}%"></i>` +
      (better ? `<i class="up" style="left:${a.toFixed(1)}%;width:${(b - a).toFixed(1)}%"></i>` : worse ? `<i class="down" style="left:${b.toFixed(1)}%;width:${(a - b).toFixed(1)}%"></i>` : '') +
      `</div><b class="${better ? 'up' : worse ? 'down' : ''}">${fmt(sh)}</b></div>`;
  }).join('') + (pv ? '<div class="lo-legend"><span class="up">GREEN = BETTER</span><span class="down">RED = WORSE</span></div>' : '');
  PV.want = { def: shown, ovr: !loPrevW && (row === 'pa' || row === 'sa') ? loPreview : null };
}
function resetLoadoutWeapon() {
  const d = loRow === 's' || loRow === 'sa' ? loDef('s') : loDef('p');
  delete ATTS[d.id]; saveClasses(); WEAPONS.forEach((w, i) => { if (w.def === d && !w.factory) applyLoadout(i); }); sfx.ui(); renderLoadout();
}
// LB / RB in the loadout: previous / next class
function loadoutTab(d) { selectClass(ACTIVE_CLASS + d); }

/* ---------- 3D preview of the selected gun (rendered off-screen by the main renderer, copied to a 2D canvas) */
const PV = { want: null, key: '', obj: null, scene: null, cam: null, rt: null, buf: null, img: null, t: 0, acc: 0 };
function previewKey(w) { return w.def.id + '|' + JSON.stringify(ATTS[w.def.id] || {}) + '|' + (w.ovr ? w.ovr.id : ''); }
function updatePreview(dt) {
  if (curScreen !== 'loadout' || !PV.want) return;
  const cv = $('loPrev'); if (!cv || !cv.getContext) return;
  PV.acc += dt; if (PV.acc < 1 / 30) return; PV.acc = 0; PV.t += 1 / 30;
  const W = 480, H = 200;
  if (!PV.scene) {
    PV.scene = new THREE.Scene(); PV.scene.environment = scene.environment || null;
    PV.scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a3226, 1.7));
    const d = new THREE.DirectionalLight(0xfff2e0, 3.2); d.position.set(1, 2, 2); PV.scene.add(d);
    const r = new THREE.DirectionalLight(0x9fc0ff, 1.6); r.position.set(-2, 0.5, -1); PV.scene.add(r);
    PV.cam = new THREE.PerspectiveCamera(28, W / H, 0.01, 10);
    PV.rt = new THREE.WebGLRenderTarget(W, H); PV.rt.texture.encoding = THREE.sRGBEncoding;
    PV.buf = new Uint8Array(W * H * 4); cv.width = W; cv.height = H; PV.ctx = cv.getContext('2d'); PV.img = PV.ctx.createImageData(W, H);
  }
  const key = previewKey(PV.want);
  if (key !== PV.key) {
    PV.key = key; if (PV.obj) PV.scene.remove(PV.obj);
    const def = PV.want.def, g = buildGunModel(def, true), st = computeStats(def, PV.want.ovr);
    attachVisuals(g, def, false, g.userData.len + st.lenAdd, PV.want.ovr);
    g.traverse(o => { if (o.name && /^hand/.test(o.name)) o.visible = false; });
    if (g.userData.flash) g.userData.flash.visible = false;
    const holder = new THREE.Group(); holder.add(g); PV.scene.add(holder); PV.obj = holder;
    const box = new THREE.Box3(); g.updateMatrixWorld(true);
    g.traverse(o => { if (o.isMesh && o.visible && !(o.material && o.material.blending === THREE.AdditiveBlending)) { let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) vis = false; if (vis) box.expandByObject(o); } });
    const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    g.position.sub(c); PV.size = Math.max(sz.z, sz.y * 2.4, 0.2); PV.dbg = [sz.x, sz.y, sz.z].map(v => +v.toFixed(2));
  }
  PV.obj.rotation.set(0.12, -Math.PI / 2 + Math.sin(PV.t * 0.7) * 0.35, 0);
  const hf = Math.atan(Math.tan(14 * Math.PI / 180) * PV.cam.aspect); PV.cam.position.set(0, 0.02, PV.size / (2 * Math.tan(hf)) * 1.12); PV.cam.lookAt(0, 0, 0);
  const prevT = renderer.getRenderTarget(), prevTM = renderer.toneMapping, prevCC = renderer.getClearColor(new THREE.Color()), prevCA = renderer.getClearAlpha();
  renderer.setRenderTarget(PV.rt); renderer.setClearColor(0x000000, 0); renderer.clear(); updateGunShader(); renderer.render(PV.scene, PV.cam);
  renderer.readRenderTargetPixels(PV.rt, 0, 0, W, H, PV.buf); renderer.setRenderTarget(prevT); renderer.toneMapping = prevTM; renderer.setClearColor(prevCC, prevCA);
  const d = PV.img.data, row = W * 4; for (let y = 0; y < H; y++) d.set(PV.buf.subarray((H - 1 - y) * row, (H - y) * row), y * row);
  PV.ctx.putImageData(PV.img, 0, 0);
}
