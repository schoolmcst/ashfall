/* ================================================================== WALLBANGS (1.2.84)
   Bullets go through thin cover. When a shot hits a wall, the game finds the block it hit and how thick it is along the
   bullet's path. If the gun can punch through that much (snipers 0.65 m, LMGs 0.6 m, marksman rifles 0.55 m, assault
   rifles 0.5 m, SMGs and pistols 0.25 m, shotguns 0.12 m), the bullet carries on and can hit someone behind it, with its
   damage cut by how much wall it went through (65% left through a sliver, 30% through the thickest it can manage). One wall per bullet. A puff of dust comes out of the
   far side, and the hit counts as a WALLBANG on your hit marker. */
const WB_PEN = { sr: 0.65, lmg: 0.6, mr: 0.55, ar: 0.5, smg: 0.25, pi: 0.25, sg: 0.12 };
const _wbP = new THREE.Vector3();
// the block at a hit point, and the distance along the ray where the ray leaves it
function wbExit(o, d, h) {
  const p = h.point; let best = null;
  for (const b of boxesNear(p.x, p.z)) {
    if (p.x < b.minx - 0.03 || p.x > b.maxx + 0.03 || p.z < b.minz - 0.03 || p.z > b.maxz + 0.03 || p.y < b.bot - 0.03 || p.y > b.top + 0.03) continue;
    // slab method: where the ray leaves this box
    let tmax = Infinity;
    for (const [oo, dd, lo, hi] of [[o.x, d.x, b.minx, b.maxx], [o.y, d.y, b.bot, b.top], [o.z, d.z, b.minz, b.maxz]]) {
      if (Math.abs(dd) < 1e-6) continue; const t1 = (lo - oo) / dd, t2 = (hi - oo) / dd; tmax = Math.min(tmax, Math.max(t1, t2));
    }
    if (!isFinite(tmax)) continue;
    if (!best || tmax > best) best = tmax;
  }
  return best;
}
// a shot hit a wall: does it go through to someone? -> { hit, k (damage left), exit }
function wbPierce(w, o, d, h, hits) {
  const pen = (WB_PEN[w.def.cat] || 0.2) * (w.pierce || 1); if (pen <= 0.05) return null;
  const tExit = wbExit(o, d, h); if (tExit === null) return null;
  const thick = tExit - h.distance; if (thick <= 0 || thick > pen) return null;
  for (const n of hits) {
    if (n.distance <= tExit + 0.02) continue;
    const ud = n.object.userData;
    if (ud.enemy) return { hit: n, k: 0.65 - 0.35 * (thick / pen), exit: _wbP.copy(o).addScaledVector(d, tExit) };
    if (!ud.barrel) return null;   // another wall first: stops there
  }
  return null;
}
