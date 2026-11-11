/* ================================================================== HOTBOX HORDE: THE HOMESTEAD (1.2.99, free placement 1.2.100)
   The base on its open field. Everything in it is a PROP you can move: THE MOTHER PLANT, THE BUYER's cart (sell buds, buy
   seeds and nutrients), the WORKBENCH (craft traps and guns), THE PLANS board (expand the base by winning a RAID, buy
   upgrades), the AMMO CRATE and every GROW PLOT. Props sit anywhere (snapped to 25 cm, turned in quarter turns, on the
   ground or on a floor you built) inside the base area; walls, floors and stairs stay on the 3 m grid. In build mode,
   look at anything (a prop or a built piece) and press INSPECT (F) to pick it up; it follows your aim until you click to
   put it down (R turns it, F again puts it back). GROW PLOTS hold one plant each: PLANT a seed (R picks the strain), FEED
   it nutrients (+50% speed and buds), HARVEST it when it is ready. Plants grow in real time, game open or not.
   Saved in ashfall.hh.v1: base.props [{id, k, x, z, y, r}], base.plots {'p<id>': {st, t0, fed}}. */
const HH_PROPS = {
  plant: { n: 'THE MOTHER PLANT', w: 1.7, d: 1.7, h: 0.75, col: '#b070ff' },
  buyer: { n: 'THE BUYER', d0: 'sell buds · buy seeds and nutrients', w: 1.8, d: 1.1, h: 1.0, col: '#7aff8a', st: 1 },
  bench: { n: 'WORKBENCH', d0: 'craft traps and guns', w: 1.5, d: 0.7, h: 0.62, col: '#ffb84a', st: 1 },
  plans: { n: 'THE PLANS', d0: 'expand your base · upgrades', w: 1.4, d: 0.3, h: 1.4, col: '#8ad0ff', st: 1 },
  crate: { n: 'AMMO CRATE', w: 0.9, d: 0.6, h: 0.55, col: '#7aff6a' },
  plot: { n: 'GROW PLOT', w: 1.2, d: 1.2, h: 0.3, col: '#c8e8c0' },
};
const HH_PROP_DEF = [{ k: 'plant', x: 0, z: 0 }, { k: 'buyer', x: 7.5, z: 0, r: 1 }, { k: 'bench', x: -7, z: 0, r: 1 }, { k: 'plans', x: 0, z: -6.5 }, { k: 'crate', x: 2.5, z: 2.5 }];
function hhGrowK(st) { if (!st || !st.st) return 0; const S0 = HH_STR(st.st); return clamp((Date.now() - st.t0) * (HH.growK || 1) * (st.sp || 1) / (S0.min * 60000) * (st.fed ? 1.5 : 1), 0, 1); }
const hhPropWD = (k, r) => { const D = HH_PROPS[k]; return r % 2 ? [D.d, D.w] : [D.w, D.d]; };
// the meshes, all small
function hhPropMesh(k) {
  const g = new THREE.Group();
  if (k === 'plant') { const m = hhPlantMesh(); m.scale.setScalar(0.66); g.add(m); g.userData.plant = m; }
  else if (k === 'buyer') {   // a dealer's cart: a wooden barrow on two wheels, a striped umbrella, jars of buds
    const wood = hhStd({ color: 0x8a5a32, roughness: 0.8 }), dark = hhStd({ color: 0x1a1a1a, roughness: 0.7 }), cloth = hhStd({ color: 0x6a3aa8, roughness: 0.8, side: THREE.DoubleSide });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 0.85), wood); body.position.y = 0.62; g.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.95), hhStd({ color: 0x5a3a20, roughness: 0.7 })); top.position.y = 0.87; g.add(top);
    for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 16), dark); w.rotation.x = Math.PI / 2; w.position.set(0.2, 0.34, s * 0.48); g.add(w); }
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), wood); leg.position.set(-0.68, 0.2, 0); g.add(leg);
    for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), wood); h.position.set(-0.98, 0.78, s * 0.3); g.add(h); }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 6), dark); pole.position.set(0.45, 1.6, 0); g.add(pole);
    const um = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.4, 8, 1, true), cloth); um.position.set(0.45, 2.28, 0); g.add(um);
    const um2 = new THREE.Mesh(new THREE.ConeGeometry(0.955, 0.4, 8, 1, true), hhStd({ color: 0x7aff8a, roughness: 0.8, side: THREE.DoubleSide, wireframe: true })); um2.position.copy(um.position); g.add(um2);
    const jar = hhStd({ color: 0xc8f0d0, transparent: true, opacity: 0.55, roughness: 0.1 }), bud = hhStd({ color: 0x6ac84a, emissive: 0x2a6a1a, emissiveIntensity: 0.6, roughness: 0.6 });
    for (let i = 0; i < 4; i++) { const x = -0.5 + i * 0.3, j = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 10), jar); j.position.set(x, 1.0, -0.15 + (i % 2) * 0.25); g.add(j); const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 7, 5), bud); b.position.set(x, 0.96, j.position.z); g.add(b); }
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.7), hhStd({ color: 0x111111, emissive: 0x7aff8a, emissiveIntensity: 0.9 })); sign.position.set(0.77, 0.66, 0); g.add(sign);
  } else if (k === 'bench') {
    const wood = hhStd({ color: 0x7a5530, roughness: 0.8 }), steel = hhStd({ color: 0x5a6068, metalness: 0.7, roughness: 0.4 }), s = new THREE.Group(); s.scale.setScalar(0.62); g.add(s);
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.0), wood); top.position.y = 0.95; s.add(top); for (const [x, z] of [[-1.1, -0.42], [1.1, -0.42], [-1.1, 0.42], [1.1, 0.42]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.08), wood); l.position.set(x, 0.47, z); s.add(l); }
    const vise = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.2), steel); vise.position.set(0.8, 1.12, 0.2); s.add(vise); const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.35), hhStd({ color: 0xc83a2a, roughness: 0.5 })); box.position.set(-0.6, 1.15, -0.1); s.add(box);
    const pb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.05), hhStd({ color: 0x9a8a6a, roughness: 0.9 })); pb.position.set(0, 1.65, -0.5); s.add(pb); for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.04), steel); t.position.set(-0.9 + i * 0.45, 1.7, -0.45); s.add(t); }
  } else if (k === 'plans') {
    const wood = hhStd({ color: 0x5a4028, roughness: 0.9 }), s = new THREE.Group(); s.scale.setScalar(0.62); g.add(s);
    for (const x of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), wood); p.position.set(x, 1.1, 0); s.add(p); }
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.3, 0.08), hhStd({ color: 0x2a4a6a, roughness: 0.8 })); b.position.set(0, 1.55, 0); s.add(b);
    for (let i = 0; i < 4; i++) { const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.6), hhStd({ color: 0xe8eef0, roughness: 0.9, side: THREE.DoubleSide })); sh.position.set(-0.75 + i * 0.5, 1.55 + (i % 2) * 0.1, 0.05); sh.rotation.z = (i - 1.5) * 0.06; s.add(sh); }
  } else if (k === 'crate') {
    const m = hhStd({ color: 0x3a4a2a, roughness: 0.8 }), st = hhStd({ color: 0x111111, emissive: 0x7aff6a, emissiveIntensity: 1.4 }), s = new THREE.Group(); s.scale.setScalar(0.75); g.add(s);
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.8), m); b.position.y = 0.35; s.add(b); const s1 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.82), st); s1.position.y = 0.55; s.add(s1);
  } else {   // a grow plot: a small wooden planter
    const wood = hhStd({ color: 0x8a5a32, roughness: 0.85 }), D = HH_PROPS.plot;
    for (const [x, z, w, d] of [[0, -D.d / 2 + 0.04, D.w, 0.08], [0, D.d / 2 - 0.04, D.w, 0.08], [-D.w / 2 + 0.04, 0, 0.08, D.d], [D.w / 2 - 0.04, 0, 0.08, D.d]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, D.h, d), wood); b.position.set(x, D.h / 2, z); g.add(b); }
    const soil = new THREE.Mesh(new THREE.BoxGeometry(D.w - 0.14, 0.04, D.d - 0.14), hhPlantMats().soil); soil.position.y = D.h - 0.05; g.add(soil);
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
// add a prop to the world (from the save, or newly placed)
function hhPropAdd(rec) {
  const H = M.hh, D = HH_PROPS[rec.k], g = hhPropMesh(rec.k); H.grp.add(g);
  const pr = { rec, k: rec.k, n: D.n, d0: D.d0, col: D.col, g, key: 'p' + rec.id, h: D.h, box: null };
  H.props.push(pr); hhPropSet(pr, rec.x, rec.z, rec.y, rec.r | 0);
  if (rec.k === 'plant') { H.plant = { x: rec.x, z: rec.z, y: pr.y, hp: H.pmax, max: H.pmax, g: g.userData.plant, hitT: 0, pr }; }
  if (rec.k === 'crate') H.crate = { x: rec.x, z: rec.z, y: pr.y, g, pr };
  return pr;
}
function hhPropSet(pr, x, z, y, r) {
  const H = M.hh, [w, d] = hhPropWD(pr.k, r); if (y === undefined || y === null) y = groundAt(x, z, H.by + 0.6);
  Object.assign(pr.rec, { x: +x.toFixed(2), z: +z.toFixed(2), y: +y.toFixed(2), r }); Object.assign(pr, { x, z, y, r, w, d, cx: x, cz: z });
  pr.g.position.set(x, y, z); pr.g.rotation.y = r * Math.PI / 2;
  if (pr.box) { const i = boxes.indexOf(pr.box); if (i >= 0) boxes.splice(i, 1); }
  pr.box = mkBox(x, z, w, d, pr.h, { y, walk: true }); boxes.push(pr.box); try { rebuildBoxGrid(); } catch (e) {}
  if (H.plant && H.plant.pr === pr) { Object.assign(H.plant, { x, z, y }); try { H.field = flowField(x, z, y); } catch (e) {} }
  if (H.crate && H.crate.pr === pr) Object.assign(H.crate, { x, z, y });
}
function hhPropRemove(pr) {
  const H = M.hh; if (pr.k !== 'plot') { showMsg(`${pr.n} CAN'T BE REMOVED · ${actName('inspect')} TO MOVE IT`); return; }
  const st = H.s.base.plots[pr.key]; if (st && st.st && hhGrowK(st) < 1) { if (!pr.warnT || NOW - pr.warnT > 3) { pr.warnT = NOW; showMsg(`A PLANT IS GROWING HERE · ${actName('use')} AGAIN TO DIG IT UP`); return; } }
  if (pr.g.parent) pr.g.parent.remove(pr.g); if (pr.plant && pr.plant.parent) pr.plant.parent.remove(pr.plant);
  const i = boxes.indexOf(pr.box); if (i >= 0) boxes.splice(i, 1); try { rebuildBoxGrid(); } catch (e) {}
  H.props = H.props.filter(o => o !== pr); const j = H.s.base.props.indexOf(pr.rec); if (j >= 0) H.s.base.props.splice(j, 1); delete H.s.base.plots[pr.key];
  hhGive('wood', 5); hhSave(H.s); try { showMsg('GROW PLOT REMOVED · +5 WOOD'); } catch (e) {}
}
// where a prop would go: on the ground (or a floor) in front of me, snapped to 25 cm
function hhPropAim(k, r) {
  const H = M.hh, [w, d] = hhPropWD(k, r | 0), fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), dist = 1.4 + Math.max(w, d) / 2 + Math.max(0, -P.pitch) * -1.2, sn = v => Math.round(v * 4) / 4;
  const x = sn(P.x + fx * Math.max(1.3, dist)), z = sn(P.z + fz * Math.max(1.3, dist)), y = groundAt(x, z, (P.y || 0) + 0.6);
  return { prop: 1, k, r: r | 0, cx: x, cz: z, y, w, d, h: HH_PROPS[k].h, key: 'prop' };
}
function hhPropValid(a) {
  const H = M.hh, R = (HH_BASELV[H.s.base.lv - 1].r + 0.5) * HH_C, carried = HH.carry && HH.carry.pr;
  if (Math.abs(a.cx - H.org.x) > R || Math.abs(a.cz - H.org.z) > R) return false;
  if (a.k === 'plot' && !carried && H.props.filter(p => p.k === 'plot').length >= HH_BASELV[H.s.base.lv - 1].plots) return false;
  const x0 = a.cx - a.w / 2 + 0.03, x1 = a.cx + a.w / 2 - 0.03, z0 = a.cz - a.d / 2 + 0.03, z1 = a.cz + a.d / 2 - 0.03;
  for (const b of boxes) { if (carried && b === carried.box) continue; if (b.maxx <= x0 || b.minx >= x1 || b.maxz <= z0 || b.minz >= z1) continue; if (b.top <= a.y + 0.06 || b.bot >= a.y + a.h) continue; return false; }
  if (P.x > x0 - 0.3 && P.x < x1 + 0.3 && P.z > z0 - 0.3 && P.z < z1 + 0.3 && Math.abs((P.y || 0) - a.y) < 1.6) return false;
  return true;
}
// grid pieces must not go through props
function hhPropHit(a) { const H = M.hh; for (const pr of H.props || []) { if (HH.carry && HH.carry.pr === pr) continue; if (Math.abs(a.cx - pr.x) * 2 < a.w + pr.w - 0.05 && Math.abs(a.cz - pr.z) * 2 < a.d + pr.d - 0.05 && a.y < pr.y + pr.h && a.y + a.h > pr.y + 0.05) return true; } return false; }
function hhPropNew(a) { const H = M.hh, s = H.s, rec = { id: (s.base.pid = (s.base.pid | 0) + 1), k: a.k, x: a.cx, z: a.cz, y: a.y, r: a.r }; s.base.props.push(rec); const pr = hhPropAdd(rec); hhSave(s); H.built++; try { burst(0.08, 900, 0.12, 'lowpass'); tone(330, 0.06, 0.05, 'triangle'); } catch (e) {} return pr; }
/* ---------- picking things up and moving them */
function hhPickUp() {
  const H = M.hh, L = HH.look; if (!L || !H.base && L.prop) return;
  if (L.prop) { const pr = L.prop; if (H.raid && H.phase === 'wave') { showMsg('NOT DURING A RAID'); return; } HH.carry = { pr, r: pr.r, from: { x: pr.x, z: pr.z, y: pr.y, r: pr.r } }; const i = boxes.indexOf(pr.box); if (i >= 0) boxes.splice(i, 1); pr.box = null; try { rebuildBoxGrid(); } catch (e) {} }
  else { const p = L, rec = Object.assign({}, p.rec); if (p.id === 'spikes' || p.id === 'zapper' || p.id === 'launcher') rec.uses = p.uses; hhPieceRemove(p); HH.carry = { rec, from: Object.assign({}, rec) }; }
  HH.look = null; try { tone(520, 0.05, 0.05, 'triangle', 780); showMsg(`CARRYING ${L.prop ? L.prop.n : (hhPieceList().find(x => x.id === L.id) || { n: 'PIECE' }).n} · CLICK TO PUT IT DOWN`); } catch (e) {}
}
function hhCarryDrop(a) {
  const H = M.hh, C = HH.carry; HH.carry = null;
  if (C.pr) { hhPropSet(C.pr, a.cx, a.cz, a.y, a.r); if (C.pr.plant) C.pr.plant.position.set(a.cx, a.y + HH_PROPS.plot.h - 0.03, a.cz); hhSave(H.s); try { tone(330, 0.06, 0.05, 'triangle'); } catch (e) {} return C.pr; }
  const rec = Object.assign({}, C.rec, { ix: a.ix, iz: a.iz, lv: a.lv, dir: a.dir, up: a.up }); delete rec.uses; const p = hhPieceMake(rec); if (C.rec.uses !== undefined) p.uses = C.rec.uses; if (H.base) { H.s.base.pieces.push(rec); hhSave(H.s); } try { tone(330, 0.06, 0.05, 'triangle'); } catch (e) {} return p;
}
function hhCarryCancel() {
  const H = M.hh, C = HH.carry; if (!C) return; HH.carry = null;
  if (C.pr) { const f = C.from; hhPropSet(C.pr, f.x, f.z, f.y, f.r); if (C.pr.plant) C.pr.plant.position.set(f.x, f.y + HH_PROPS.plot.h - 0.03, f.z); }
  else { const rec = Object.assign({}, C.from); delete rec.uses; const p = hhPieceMake(rec, true); if (C.from.uses !== undefined) p.uses = C.from.uses; if (H.base) { H.s.base.pieces.push(rec); hhSave(H.s); } try { rebuildBoxGrid(); } catch (e) {} }
  try { showMsg('PUT BACK'); } catch (e) {}
}
/* ---------- the base: props from the save (old 1.2.99 grid plots become props) */
function hhBaseSetup(H) {
  const s = H.s; H.props = []; s.base.props = Array.isArray(s.base.props) ? s.base.props : [];
  if (!s.base.props.length) for (const d of HH_PROP_DEF) s.base.props.push({ id: (s.base.pid = (s.base.pid | 0) + 1), k: d.k, x: d.x, z: d.z, y: null, r: d.r | 0 });
  for (const rec of s.base.pieces.filter(p => p.id === 'plot')) { const id = (s.base.pid = (s.base.pid | 0) + 1), ok = `c${rec.ix},${rec.iz},0`; s.base.props.push({ id, k: 'plot', x: H.org.x + rec.ix * HH_C, z: H.org.z + rec.iz * HH_C, y: null, r: 0 }); if (s.base.plots[ok]) { s.base.plots['p' + id] = s.base.plots[ok]; delete s.base.plots[ok]; } }
  s.base.pieces = s.base.pieces.filter(p => p.id !== 'plot');
  for (const rec of s.base.props.slice()) try { hhPropAdd(rec); } catch (e) { reportError(e); }
  for (const rec of s.base.pieces.slice()) { try { const a = hhSpec(rec.id, rec.ix, rec.iz, rec.lv, rec.dir, rec.up); if (a.key.split('|').some(k => H.slots.has(k))) continue; hhPieceMake(rec, true); } catch (e) { reportError(e); } }
  try { rebuildBoxGrid(); } catch (e) {}
  for (const pr of H.props) if (pr.k === 'plot') hhPlotVis(pr);
  H.visT = 0; H.sel = null; hhSave(s);
}
// a plot's plant, sized by how far it has grown
function hhPlotVis(pr) {
  const H = M.hh, st = H.s.base.plots[pr.key], k = hhGrowK(st);
  if (!st || !st.st) { if (pr.plant) { pr.plant.parent && pr.plant.parent.remove(pr.plant); pr.plant = null; } return; }
  if (!pr.plant || pr.strain !== st.st) { if (pr.plant && pr.plant.parent) pr.plant.parent.remove(pr.plant); const g = hhWeed(14, 0.55, HH_STR(st.st).col); g.position.set(pr.x, pr.y + HH_PROPS.plot.h - 0.03, pr.z); g.rotation.y = (pr.rec.id * 1.7) % 6; H.grp.add(g); pr.plant = g; pr.strain = st.st; }
  if (!HH.carry || HH.carry.pr !== pr) pr.plant.position.set(pr.x, pr.y + HH_PROPS.plot.h - 0.03, pr.z); else pr.plant.position.set(pr.g.position.x, pr.g.position.y + HH_PROPS.plot.h - 0.03, pr.g.position.z);
  const g = pr.plant; g.scale.setScalar(0.18 + 0.82 * k); for (const b of g.userData.buds) b.visible = k > 0.5; g.userData.bud.emissiveIntensity = k >= 1 ? 0.9 + Math.sin(NOW * 3) * 0.4 : 0.2;
}
function hhBestSeed(s) { for (let i = HH_STRAINS.length - 1; i >= 0; i--) if ((s.seeds[HH_STRAINS[i].id] | 0) > 0) return HH_STRAINS[i].id; return null; }
function hhNearPlot() { const H = M.hh; let best = null, bd = 1.6; for (const pr of H.props) if (pr.k === 'plot') { const d = Math.hypot(pr.x - P.x, pr.z - P.z); if (d < bd && Math.abs(pr.y - (P.y || 0)) < 1.4) { bd = d; best = pr; } } return best; }
function hhPlotUse(p) {
  const H = M.hh, s = H.s, st = s.base.plots[p.key], k = hhGrowK(st);
  if (!st || !st.st) { const sd = H.sel && (s.seeds[H.sel] | 0) > 0 ? H.sel : hhBestSeed(s); if (!sd) { showMsg('NO SEEDS · BUY THEM FROM THE BUYER'); return; } s.seeds[sd]--; s.base.plots[p.key] = { st: sd, t0: Date.now(), fed: false }; hhPlotVis(p); try { showBanner(`PLANTED ${HH_STR(sd).n}`, `ready in about ${HH_STR(sd).min} minutes · feed it NUTRIENTS to speed it up`); burst(0.2, 600, 0.12, 'lowpass'); } catch (e) {} }
  else if (k >= 1) { const S0 = HH_STR(st.st), n = Math.round(S0.yld * (st.fed ? 1.5 : 1) * (1 + 0.2 * (H.lv.yield | 0)) * (st.yb || 1)); s.buds[st.st] = (s.buds[st.st] | 0) + n; s.grown = (s.grown | 0) + 1; delete s.base.plots[p.key]; hhPlotVis(p); try { showBanner(`+${n} ${S0.n} BUDS`, `worth about $${Math.round(n * S0.price * hhMarket()).toLocaleString()} at THE BUYER today`); sfx.pickup(); chunks('wood', new THREE.Vector3(p.x, p.y + 0.8, p.z), 10, 3, 0.6); } catch (e) {} }
  else if (!st.fed && (s.inv.nutri | 0) > 0) { s.inv.nutri--; const done = (Date.now() - st.t0) / (HH_STR(st.st).min * 60000); st.t0 = Date.now() - done * HH_STR(st.st).min * 60000 / 1.5; st.fed = true; try { showMsg('FED · +50% SPEED AND BUDS'); tone(660, 0.15, 0.05, 'sine', 990); } catch (e) {} }
  else { showMsg(st.fed ? 'STILL GROWING · ALREADY FED' : 'STILL GROWING · NO NUTRIENTS (MISSIONS OR THE BUYER)'); return; }
  hhSave(s);
}
function hhBaseTick(dt, u) {
  const H = M.hh, s = H.s;
  if ((H.visT -= dt) <= 0) { H.visT = 0.5; for (const pr of H.props) if (pr.k === 'plot') hhPlotVis(pr); }
  if (HH.carry && HH.carry.pr && HH.carry.pr.plant) hhPlotVis(HH.carry.pr);
  for (const n of H.nodes) if (n.hp <= 0 && n.regrow && NOW > n.regrow) { n.hp = n.max; n.regrow = 0; n.g.scale.setScalar(1); H.grp.add(n.g); }   // the yard's piles come back
  if (!playerAlive() || HH.build || HH.menu) return;
  let st = null; for (const pr of H.props) if (HH_PROPS[pr.k].st && Math.hypot(pr.x - P.x, pr.z - P.z) < 1.4 + Math.max(pr.w, pr.d) / 2) st = pr;
  if (st) { showMsgOnce(`${st.n} · PRESS ${actName('use')} · ${st.d0}`); if (u && !HH.uH) { if (H.raid && H.phase === 'wave') showMsg('NOT DURING A RAID'); else hhMenuOpen(st.k); } return; }
  const p = hhNearPlot(); HH.nearPlot = p;
  if (p) { const ps = s.base.plots[p.key], k = hhGrowK(ps);
    if (!ps || !ps.st) { const sd = H.sel && (s.seeds[H.sel] | 0) > 0 ? H.sel : hhBestSeed(s); showMsgOnce(sd ? `GROW PLOT · ${actName('use')} PLANT ${HH_STR(sd).n} (${s.seeds[sd]} SEEDS) · ${actName('reload')} OTHER STRAIN` : 'GROW PLOT · NO SEEDS · BUY THEM FROM THE BUYER'); }
    else if (k >= 1) showMsgOnce(`${HH_STR(ps.st).n} IS READY · ${actName('use')} HARVEST`);
    else { const left = (1 - k) * HH_STR(ps.st).min * 60 / (ps.fed ? 1.5 : 1) / (HH.growK || 1); showMsgOnce(`${HH_STR(ps.st).n} · ${Math.floor(k * 100)}% · READY IN ${fmtT(left)}${!ps.fed && (s.inv.nutri | 0) > 0 ? ` · ${actName('use')} FEED NUTRIENTS (${s.inv.nutri})` : ''}`); }
    if (u && !HH.uH) hhPlotUse(p); }
}
addEventListener('keydown', e => {
  if (!M || !M.hh || !M.hh.base || G.state !== 'playing' || curScreen || HH.menu || HH.build || !HH.nearPlot || e.code !== bind('reload')) return;
  const H = M.hh, ps = H.s.base.plots[HH.nearPlot.key]; if (ps && ps.st) return;
  const own = HH_STRAINS.filter(x => (H.s.seeds[x.id] | 0) > 0); if (!own.length) return; const i = own.findIndex(x => x.id === H.sel); H.sel = own[(i + 1) % own.length].id; e.stopImmediatePropagation(); try { tone(600, 0.03, 0.03, 'square'); } catch (er) {}
}, true);
function hhBaseMarkers(out) {
  const H = M.hh; for (const pr of H.props) if (HH_PROPS[pr.k].st && Math.hypot(pr.x - P.x, pr.z - P.z) < 45) out.push({ x: pr.x, y: pr.y + 2.3, z: pr.z, t: pr.n, c: pr.col });
  for (const pr of H.props) if (pr.k === 'plot') { const ps = H.s.base.plots[pr.key], k = hhGrowK(ps); if (ps && ps.st && k >= 1) out.push({ x: pr.x, y: pr.y + 1.6, z: pr.z, t: 'READY', c: '#7aff6a' }); else if (ps && ps.st && Math.hypot(pr.x - P.x, pr.z - P.z) < 10) out.push({ x: pr.x, y: pr.y + 1.4, z: pr.z, t: `${Math.floor(k * 100)}%`, c: '#c8e8c0' }); }
}

/* ---------- RAIDS: win one to expand the base */
function hhRaidStart() {
  const H = M.hh, s = H.s, lv = s.base.lv, nx = HH_BASELV[lv]; if (!nx || H.raid) return;
  if (s.cash < nx.cost) { showMsg(`YOU NEED $${nx.cost.toLocaleString()}`); return; }
  hhMenuClose(); H.raid = { to: lv + 1, cost: nx.cost }; H.phase = 'prep'; H.t = 40; H.wave = 0; H.waves = 2 + lv; H.D = HH_DIFF[Math.min(3, lv - 1)]; H.plant.hp = H.plant.max;
  for (const R of H.rifts) R.g.visible = true;
  try { showBanner('RAID INCOMING', `hold THE MOTHER PLANT for ${H.waves} waves to expand to level ${lv + 1} · first wave in 40 s · build!`); tone(60, 1.2, 0.16, 'sawtooth', 40); } catch (e) {}
}
function hhRaidEnd(won) {
  const H = M.hh, s = H.s, R = H.raid; if (!R) return;
  for (const e of H.mobs) { const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); scene.remove(e.group); } H.mobs = []; H.toSpawn = 0;
  for (const q of H.spits) scene.remove(q.s); H.spits = [];
  H.raid = null; H.phase = 'free'; H.wave = 0; H.plant.hp = H.plant.max; for (const r of H.rifts) r.g.visible = false;
  if (won) { s.cash -= R.cost; s.base.lv = R.to; try { showBanner(`THE HOMESTEAD IS LEVEL ${R.to}`, `more room to build · up to ${HH_BASELV[R.to - 1].plots} grow plots`); sfx.streak(); brpXP(1500 * R.to, 'HOTBOX HORDE · RAID WON'); } catch (e) {} }
  else try { showBanner('RAID LOST', 'the burnouts got to her · she pulls through · try again when you are ready'); } catch (e) {}
  hhSave(s);
}

/* ---------- the station menus */
function hhMenuOpen(kind) {
  if (HH.menu) return; HH.menu = kind; G.menuOpen = true; hhBuildMode(false);
  const o = document.createElement('div'); o.className = 'onb-ov hh-menu'; o.id = 'hhMenu'; document.body.appendChild(o);
  o.addEventListener('click', e => { const b = e.target.closest('[data-hm]'); if (!b) return; const [a, v] = b.dataset.hm.split(':'); hhMenuDo(a, v); });
  hhMenuRender(); try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  HH.mkey = e => { if (!HH.menu) return; if (e.code === 'Escape' || e.code === bind('use')) { e.preventDefault(); e.stopImmediatePropagation(); hhMenuClose(); } };
  addEventListener('keydown', HH.mkey, true); try { sfx.ui(); } catch (e) {}
}
function hhMenuClose() { if (!HH.menu) return; HH.menu = null; G.menuOpen = false; const o = $('hhMenu'); if (o) o.remove(); if (HH.mkey) removeEventListener('keydown', HH.mkey, true); HH.mkey = null; HH.uH = true; try { if (G.state === 'playing') lockPointer(); } catch (e) {} }
function hhMenuRender() {
  const o = $('hhMenu'), H = M && M.hh; if (!o || !H) return; const s = H.s, mk = hhMarket(), btn = (act, txt, off) => `<button class="mini${off ? ' off' : ''}" data-hm="${act}"${off ? ' disabled' : ''}>${txt}</button>`;
  const inv = `<div class="hh-minv"><span style="color:#7aff8a">$${s.cash.toLocaleString()}</span>${[...HH_MATS, ...HH_CMATS].map(k => `<span>${HH_ALLN(k)} <b>${s.inv[k] | 0}</b></span>`).join('')}</div>`;
  let body = '';
  if (HH.menu === 'buyer') {
    const buds = HH_STRAINS.filter(x => s.buds[x.id] > 0), total = buds.reduce((t, x) => t + Math.round(s.buds[x.id] * x.price * mk), 0);
    body = `<small>THE BUYER · TODAY HE PAYS ${Math.round(mk * 100)}%</small><b>SELL · BUY</b>${inv}<div class="hh-sec"><h4>SELL YOUR BUDS</h4>${buds.length ? buds.map(x => `<div class="hh-li"><b>${x.n}</b><span>${s.buds[x.id]} buds · $${Math.round(x.price * mk)} each</span>${btn('sell:' + x.id, `SELL · $${Math.round(s.buds[x.id] * x.price * mk).toLocaleString()}`)}</div>`).join('') + `<div class="hh-li"><b>EVERYTHING</b><span></span>${btn('sell:all', `SELL ALL · $${total.toLocaleString()}`)}</div>` : '<p>No buds yet. Plant seeds in GROW PLOTS (place them in build mode, key 4) and harvest them when they are ready.</p>'}</div>` +
      `<div class="hh-sec"><h4>SEEDS AND SUPPLIES</h4>${HH_STRAINS.filter(x => x.seed).map(x => `<div class="hh-li"><b>${x.n} SEED</b><span>grows in ${x.min} min · ${x.yld} buds · you have ${s.seeds[x.id] | 0}</span>${btn('seed:' + x.id, `$${x.seed}`, s.cash < x.seed)}</div>`).join('')}<div class="hh-li"><b>MOTHER'S MILK SEED</b><span>the best there is · only from missions (FRIED and up)</span><span></span></div><div class="hh-li"><b>NUTRIENTS</b><span>feed a plant: +50% speed and buds · you have ${s.inv.nutri | 0}</span>${btn('nutri:1', '$80', s.cash < 80)}</div></div>`;
  } else if (HH.menu === 'bench') {
    const bl = s.base.bench, nb = HH_BENCH[bl];
    body = `<small>WORKBENCH · LEVEL ${bl} · YOUR GUNS COME OUT ${HH_TIER[bl - 1].n}</small><b>CRAFT</b>${inv}` +
      `<div class="hh-sec"><h4>TRAPS</h4>${Object.entries(HH_TRAPS).map(([k, t]) => `<div class="hh-li"><b>${t.n} <i>×${s.traps[k] | 0}</i></b><span>${t.d} · ${hhCostTxt(t.cost, s)}</span>${btn('trap:' + k, 'CRAFT', !hhHas(s, t.cost))}${btn('trap5:' + k, '×5', !hhHas(s, Object.fromEntries(Object.entries(t.cost).map(([a, b]) => [a, b * 5]))))}</div>`).join('')}</div>` +
      `<div class="hh-sec"><h4>WEAPONS · LAST ${HH_GUN_DUR} MISSIONS</h4>${HH_GUNS.map(g => `<div class="hh-li"><b>${g.n}</b><span>${hhGunDef(g).name} · ${hhCostTxt(g.cost, s)}</span>${btn('gun:' + g.id, 'CRAFT', !hhHas(s, g.cost))}</div>`).join('')}</div>` +
      `<div class="hh-sec"><h4>YOUR ARSENAL</h4>${s.arsenal.length ? s.arsenal.map((g, i) => `<div class="hh-li"><b style="color:${HH_TIER[g.tier].css}">${HH_TIER[g.tier].n} ${HH_GUNS.find(x => x.id === g.id).n}</b><span>${g.dur} missions left${s.eq === i ? ' · EQUIPPED' : ''}</span>${btn('eq:' + i, s.eq === i ? 'UNEQUIP' : 'EQUIP')}${btn('scrapgun:' + i, 'SCRAP +3')}</div>`).join('') : '<p>Nothing yet. Craft a gun above, then equip it (here or in the lobby) and take it on a mission.</p>'}</div>` +
      (nb ? `<div class="hh-sec"><h4>UPGRADE THE BENCH</h4><div class="hh-li"><b>LEVEL ${bl + 1}</b><span>guns come out ${HH_TIER[bl].n} (+${Math.round((HH_TIER[bl].k - 1) * 100)}% damage)</span>${btn('bench:1', `$${nb.cost.toLocaleString()}`, s.cash < nb.cost)}</div></div>` : '');
  } else {
    const lv = s.base.lv, L = HH_BASELV[lv - 1], nx = HH_BASELV[lv], plots = H.props.filter(p => p.k === 'plot').length;
    body = `<small>THE PLANS · THE HOMESTEAD LEVEL ${lv}</small><b>EXPAND</b>${inv}<div class="hh-sec"><h4>YOUR BASE</h4><p>Build area ${L.r * 2 + 1} × ${L.r * 2 + 1} cells (${(L.r * 2 + 1) * 3} m) · grow plots ${plots} / ${L.plots} · ${H.pieces.length} pieces</p>` +
      (nx ? `<div class="hh-li"><b>EXPAND TO LEVEL ${lv + 1}</b><span>build area ${(nx.r * 2 + 1) * 3} m · ${nx.plots} grow plots · $${nx.cost.toLocaleString()} · you have to hold off a RAID: ${2 + lv} waves at your base</span>${btn('raid:1', 'START THE RAID', s.cash < nx.cost)}</div>` : '<p>Your base is as big as it gets.</p>') + `</div>` +
      `<div class="hh-sec"><h4>UPGRADES</h4>${HH_UPG.map(u => { const l = s.lv[u.id] | 0; return `<div class="hh-li"><b>${u.n} · ${l} / 5</b><span>${u.d}</span>${l >= 5 ? btn('x', 'MAX', true) : btn('up:' + u.id, `$${hhUpCost(l).toLocaleString()}`, s.cash < hhUpCost(l))}</div>`; }).join('')}</div>`;
  }
  o.innerHTML = `<div class="onb-box hh-mbox">${body}<div class="onb-acts"><button class="btn" data-hm="close">CLOSE (${actName('use')} / ESC)</button></div></div>`;
}
function hhMenuDo(a, v) {
  const H = M.hh, s = H.s, mk = hhMarket();
  if (a === 'close') { hhMenuClose(); return; }
  if (a === 'sell') { let got = 0; for (const x of HH_STRAINS) if ((v === 'all' || v === x.id) && s.buds[x.id] > 0) { got += Math.round(s.buds[x.id] * x.price * mk); s.buds[x.id] = 0; } s.cash += got; s.sold = (s.sold | 0) + got; try { showMsg(`SOLD · +$${got.toLocaleString()}`); sfx.pickup(); tone(880, 0.1, 0.05, 'triangle', 1320); } catch (e) {} }
  if (a === 'seed') { const x = HH_STR(v); if (s.cash >= x.seed) { s.cash -= x.seed; s.seeds[v] = (s.seeds[v] | 0) + 1; try { sfx.pickup(); } catch (e) {} } }
  if (a === 'nutri' && s.cash >= 80) { s.cash -= 80; s.inv.nutri = (s.inv.nutri | 0) + 1; }
  if (a === 'trap' || a === 'trap5') { const t = HH_TRAPS[v], n = a === 'trap5' ? 5 : 1; for (let i = 0; i < n; i++) if (hhPay(s, t.cost)) s.traps[v] = (s.traps[v] | 0) + 1; try { sfx.pickup(); burst(0.12, 2000, 0.08, 'bandpass'); } catch (e) {} }
  if (a === 'gun') { const g = HH_GUNS.find(x => x.id === v); if (hhPay(s, g.cost)) { s.arsenal.push({ id: v, tier: Math.min(2, s.base.bench - 1), dur: HH_GUN_DUR }); if (s.eq < 0) s.eq = s.arsenal.length - 1; try { showMsg(`CRAFTED ${HH_TIER[Math.min(2, s.base.bench - 1)].n} ${g.n}`); sfx.pickup(); } catch (e) {} } }
  if (a === 'eq') { const i = +v; s.eq = s.eq === i ? -1 : i; }
  if (a === 'scrapgun') { const i = +v; s.arsenal.splice(i, 1); s.inv.scrap = (s.inv.scrap | 0) + 3; if (s.eq === i) s.eq = -1; else if (s.eq > i) s.eq--; }
  if (a === 'bench') { const nb = HH_BENCH[s.base.bench]; if (nb && s.cash >= nb.cost) { s.cash -= nb.cost; s.base.bench++; try { showMsg(`WORKBENCH LEVEL ${s.base.bench}`); sfx.streak(); } catch (e) {} } }
  if (a === 'up') { const l = s.lv[v] | 0; if (l < 5 && s.cash >= hhUpCost(l)) { s.cash -= hhUpCost(l); s.lv[v] = l + 1; try { sfx.pickup(); } catch (e) {} } }
  if (a === 'raid') { hhSave(s); hhRaidStart(); return; }
  hhSave(s); hhMenuRender();
}
(() => { const s = document.createElement('style'); s.textContent = `.hh-menu .hh-mbox{width:min(760px,94vw);max-height:88vh;overflow:auto;text-align:left}
.hh-minv{display:flex;flex-wrap:wrap;gap:6px 12px;margin:8px 0 4px;font-size:11px;letter-spacing:.1em;opacity:.9}.hh-minv b{color:#fff}
.hh-sec{margin-top:12px}.hh-sec h4{margin:0 0 6px;font-size:11px;letter-spacing:.24em;color:#c8a0ff}.hh-sec p{font-size:12px;opacity:.8;margin:4px 0}
.hh-li{display:grid;grid-template-columns:200px 1fr auto auto;gap:8px;align-items:center;padding:6px 8px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);margin-bottom:4px}
.hh-li b{font-size:12px;letter-spacing:.08em}.hh-li b i{font-style:normal;color:#7aff8a;margin-left:4px}.hh-li span{font-size:11px;opacity:.8}.hh-li .mini{min-width:70px}.hh-li .mini.off{opacity:.4}`; document.head.appendChild(s); })();
