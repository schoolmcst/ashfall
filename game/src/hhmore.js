/* ================================================================== HOTBOX HORDE: MORE (1.2.101)
   Build mode on THE HOMESTEAD has three categories (SWAP / Q switches): BUILD (walls, floors, stairs, traps), GROW (grow
   plots, SPRINKLER: plants within 3.5 m grow 30% faster, GROW LIGHT: 30% more buds within 3.5 m, COMPOST BIN: a free
   NUTRIENTS every 8 minutes, AUTO-TRIMMER: harvests ready plants within 5 m) and DECOR bought with cash (couch, picnic
   table, giant bong, neon sign, string lights, drying rack, tiki torch, flag). GRENADE (G) in build mode REPAIRS the piece
   you look at, or UPGRADES it wood -> stone -> metal. New burnouts: DRIFTERS float over walls, BLOATERS blow up on whatever
   stops them. THE BUYER puts up a DAILY ORDER: a strain and an amount, paid double plus crafting materials. */
Object.assign(HH_PROPS, {
  sprinkler: { n: 'SPRINKLER', w: 0.5, d: 0.5, h: 0.6, col: '#6ad8ff', cost: { metal: 15, wire: 2 }, buy: 1 },
  lamp: { n: 'GROW LIGHT', w: 0.6, d: 0.6, h: 2.2, col: '#ff7ad8', cost: { metal: 20, wire: 1, battery: 1 }, buy: 1 },
  compost: { n: 'COMPOST BIN', w: 1.0, d: 1.0, h: 1.0, col: '#c8a070', cost: { wood: 30, sap: 2 }, buy: 1, st: 1, d0: 'a free NUTRIENTS every 8 minutes' },
  trimmer: { n: 'AUTO-TRIMMER', w: 0.8, d: 0.8, h: 1.1, col: '#9aff6a', cost: { metal: 30, scrap: 8, battery: 2 }, buy: 1 },
  couch: { n: 'COUCH', w: 2.0, d: 0.9, h: 0.9, col: '#c8a0ff', cost: { cash: 250 }, buy: 1 },
  picnic: { n: 'PICNIC TABLE', w: 1.8, d: 1.6, h: 0.8, col: '#d8a868', cost: { cash: 150 }, buy: 1 },
  bong: { n: 'GIANT BONG', w: 1.2, d: 1.2, h: 2.6, col: '#7aff8a', cost: { cash: 600 }, buy: 1 },
  neon: { n: 'NEON SIGN', w: 2.0, d: 0.3, h: 2.4, col: '#ff5ad0', cost: { cash: 400 }, buy: 1 },
  lights: { n: 'STRING LIGHTS', w: 2.8, d: 0.3, h: 2.6, col: '#ffe08a', cost: { cash: 200 }, buy: 1 },
  rack: { n: 'DRYING RACK', w: 1.4, d: 0.6, h: 1.8, col: '#7adf6a', cost: { cash: 300 }, buy: 1 },
  torch: { n: 'TIKI TORCH', w: 0.3, d: 0.3, h: 1.9, col: '#ff9a3a', cost: { cash: 80 }, buy: 1 },
  flag: { n: 'HOMESTEAD FLAG', w: 0.3, d: 0.3, h: 3.6, col: '#b070ff', cost: { cash: 120 }, buy: 1 },
});
HH_PROPS.plot.cost = { wood: 10, stone: 4 };
const HH_GROWP = ['plot', 'sprinkler', 'lamp', 'compost', 'trimmer'];
const HH_DECOR = ['couch', 'picnic', 'bong', 'neon', 'lights', 'rack', 'torch', 'flag'];
const HH_COMPOST_MS = 8 * 60000;

/* ---------- the new meshes */
const _hhPM = hhPropMesh;
hhPropMesh = function (k) {
  if (!HH_PROPS[k] || !HH_PROPS[k].buy) return _hhPM(k);
  const g = new THREE.Group(), add = (geo, mat, x, y, z, rx, ry, rz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); g.add(m); return m; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (r0, r1, h, n) => new THREE.CylinderGeometry(r0, r1, h, n || 10);
  const wood = hhStd({ color: 0x8a5a32, roughness: 0.85 }), dark = hhStd({ color: 0x222226, roughness: 0.6, metalness: 0.4 }), steel = hhStd({ color: 0x8a9098, roughness: 0.35, metalness: 0.8 });
  if (k === 'sprinkler') { add(C(0.18, 0.2, 0.05), dark, 0, 0.025, 0); add(C(0.025, 0.025, 0.5), steel, 0, 0.3, 0); const h = add(C(0.06, 0.06, 0.06), hhStd({ color: 0x3a8adf, roughness: 0.4 }), 0, 0.57, 0); g.userData.spin = h; const arm = add(B(0.3, 0.02, 0.02), steel, 0, 0.6, 0); h.add(arm); arm.position.set(0, 0.03, 0); }
  else if (k === 'lamp') { add(C(0.22, 0.25, 0.06), dark, 0, 0.03, 0); add(C(0.025, 0.025, 2.1), dark, 0, 1.05, 0); add(B(0.7, 0.06, 0.45), dark, 0.2, 2.1, 0, 0, 0, -0.25); add(B(0.62, 0.02, 0.38), new THREE.MeshBasicMaterial({ color: 0xff8ae0 }), 0.21, 2.06, 0, 0, 0, -0.25); }
  else if (k === 'compost') { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; for (let j = 0; j < 4; j++) add(B(1.0, 0.16, 0.06), wood, Math.sin(a) * 0.47, 0.14 + j * 0.24, Math.cos(a) * 0.47, 0, a, 0); } add(B(0.88, 0.05, 0.88), hhPlantMats().soil, 0, 0.82, 0); for (let i = 0; i < 6; i++) add(new THREE.SphereGeometry(0.07, 6, 4), hhStd({ color: [0x5a8a2a, 0x8a6a2a, 0x3a6a1a][i % 3], roughness: 0.9 }), -0.25 + (i % 3) * 0.25, 0.87, -0.15 + ((i / 3) | 0) * 0.3); g.userData.fill = add(B(0.2, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0x6ad8ff }), 0, 0.6, 0.5); }
  else if (k === 'trimmer') { add(B(0.7, 0.8, 0.7), hhStd({ color: 0x2a5a2a, roughness: 0.5, metalness: 0.4 }), 0, 0.4, 0); const bl = add(C(0.3, 0.3, 0.03, 16), steel, 0, 0.86, 0); g.userData.spin = bl; for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(B(0.12, 0.03, 0.04), steel); t.position.set(Math.cos(i * 1.57) * 0.3, 0, Math.sin(i * 1.57) * 0.3); t.rotation.y = -i * 1.57; bl.add(t); } add(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x7aff6a }), 0.3, 0.7, 0.36); add(C(0.03, 0.03, 0.3), dark, -0.25, 1.0, -0.25); }
  else if (k === 'couch') { const f = hhStd({ color: 0x5a2a8a, roughness: 0.9 }), c2 = hhStd({ color: 0x7a4aaa, roughness: 0.95 }); add(B(2.0, 0.4, 0.85), f, 0, 0.25, 0); add(B(2.0, 0.55, 0.2), f, 0, 0.65, -0.33); for (const s of [-1, 1]) add(B(0.2, 0.3, 0.85), f, s * 0.9, 0.55, 0); for (const s of [-0.45, 0.45]) add(B(0.85, 0.14, 0.62), c2, s, 0.5, 0.06); for (const [x, z] of [[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]]) add(B(0.07, 0.06, 0.07), dark, x, 0.03, z); }
  else if (k === 'picnic') { add(B(1.8, 0.06, 0.8), wood, 0, 0.75, 0); for (const s of [-1, 1]) { add(B(1.8, 0.05, 0.3), wood, 0, 0.45, s * 0.65); add(B(0.08, 0.75, 1.5), wood, s * 0.7, 0.37, 0, 0.0, 0, 0); } add(C(0.06, 0.05, 0.12), hhStd({ color: 0x3a8a3a, roughness: 0.4 }), 0.3, 0.84, 0.1); }
  else if (k === 'bong') { const glass = hhStd({ color: 0x8affc8, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.45 }), water = hhStd({ color: 0x3a9aff, transparent: true, opacity: 0.55, roughness: 0.1 }); add(new THREE.SphereGeometry(0.55, 16, 12), glass, 0, 0.55, 0); add(new THREE.SphereGeometry(0.45, 14, 10, 0, TAU, Math.PI * 0.55, Math.PI * 0.45), water, 0, 0.55, 0); add(C(0.22, 0.25, 1.8, 16), glass, 0, 1.65, 0); add(C(0.28, 0.22, 0.12, 16), glass, 0, 2.6, 0); add(C(0.05, 0.05, 0.7), glass, 0.4, 0.95, 0, 0, 0, -0.8); add(C(0.13, 0.06, 0.14, 12), hhStd({ color: 0x3a3a3a, metalness: 0.6, roughness: 0.4 }), 0.66, 1.2, 0); add(C(0.6, 0.62, 0.06, 20), dark, 0, 0.03, 0); }
  else if (k === 'neon') { for (const s of [-1, 1]) add(C(0.04, 0.04, 2.4), dark, s * 0.95, 1.2, 0); const mat = typeof neonMat === 'function' ? neonMat('HOTBOX', '#ff5ad0', 'open 4:20 · grown here', '#0b0b10', 512, 192) : new THREE.MeshBasicMaterial({ color: 0xff5ad0 }); add(B(1.9, 0.72, 0.06), mat, 0, 1.9, 0); add(B(1.98, 0.8, 0.04), dark, 0, 1.9, -0.05); }
  else if (k === 'lights') { for (const s of [-1, 1]) add(C(0.04, 0.05, 2.6), wood, s * 1.3, 1.3, 0); const bulbs = []; for (let i = 0; i <= 10; i++) { const f = i / 10, x = -1.3 + f * 2.6, y = 2.45 - Math.sin(f * Math.PI) * 0.45; const b = add(new THREE.SphereGeometry(0.045, 6, 4), new THREE.MeshBasicMaterial({ color: [0xffe08a, 0xff8ad0, 0x8affc8][i % 3] }), x, y, 0); bulbs.push(b); if (i) { const p = bulbs[i - 1].position, L = Math.hypot(x - p.x, y - p.y); add(C(0.006, 0.006, L, 4), dark, (x + p.x) / 2, (y + p.y) / 2, 0, 0, 0, Math.atan2(x - p.x, -(y - p.y)) + Math.PI); } } g.userData.bulbs = bulbs; }
  else if (k === 'rack') { for (const s of [-1, 1]) for (const z of [-0.25, 0.25]) add(B(0.06, 1.8, 0.06), wood, s * 0.65, 0.9, z); const bud = hhStd({ color: 0x5a9a3a, roughness: 0.8 }); for (const y of [1.0, 1.4, 1.75]) { add(B(1.36, 0.04, 0.04), wood, 0, y, 0); for (let i = 0; i < 6; i++) { const x = -0.55 + i * 0.22; add(C(0.004, 0.004, 0.14, 3), dark, x, y - 0.07, 0); const b = add(new THREE.SphereGeometry(0.06, 6, 5), bud, x, y - 0.18, 0); b.scale.y = 1.6; } } }
  else if (k === 'torch') { add(C(0.04, 0.05, 1.6, 8), hhStd({ color: 0xb08a4a, roughness: 0.9 }), 0, 0.8, 0); add(C(0.09, 0.06, 0.2, 10), hhStd({ color: 0x6a4a2a, roughness: 0.9 }), 0, 1.66, 0); g.userData.flame = add(new THREE.ConeGeometry(0.08, 0.28, 8), new THREE.MeshBasicMaterial({ color: 0xffa040 }), 0, 1.88, 0); }
  else if (k === 'flag') { add(C(0.035, 0.04, 3.6, 8), steel, 0, 1.8, 0); const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75, 8, 2), hhStd({ color: 0x7a3ab8, roughness: 0.8, side: THREE.DoubleSide })); fl.position.set(0.62, 3.15, 0); g.add(fl); g.userData.flag = fl; const leaf = hhLeaf(hhStd({ color: 0x7aff6a, emissive: 0x2a8a1a, side: THREE.DoubleSide }), 0.3); leaf.rotation.set(-Math.PI / 2, 0, 0); leaf.position.set(0.62, 3.05, 0.01); g.add(leaf); g.userData.leaf = leaf; }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
};
// grow gear and decor can be removed (half of the cost back); the stations and the plant can't
const _hhPR = hhPropRemove;
hhPropRemove = function (pr) {
  const D = HH_PROPS[pr.k]; if (!D.buy) return _hhPR(pr);
  const H = M.hh; if (pr.g.parent) pr.g.parent.remove(pr.g); const i = boxes.indexOf(pr.box); if (i >= 0) boxes.splice(i, 1); try { rebuildBoxGrid(); } catch (e) {}
  H.props = H.props.filter(o => o !== pr); const j = H.s.base.props.indexOf(pr.rec); if (j >= 0) H.s.base.props.splice(j, 1);
  for (const k in D.cost) { const n = Math.floor(D.cost[k] / 2); if (!n) continue; if (k === 'cash') H.s.cash += n; else hhGive(k, n); }
  hhSave(H.s); try { showMsg(`${D.n} REMOVED · HALF OF IT BACK`); } catch (e) {}
};
const _hhPN = hhPropNew;
hhPropNew = function (a) { const pr = _hhPN(a); if (pr && pr.k === 'compost') { pr.rec.t0 = Date.now(); hhSave(M.hh.s); } return pr; };

/* ---------- every base frame: boosts, compost, the trimmer, things that move */
const _hhBT = hhBaseTick;
hhBaseTick = function (dt, u) {
  const H = M.hh, s = H.s;
  if ((H.moreT = (H.moreT || 0) - dt) <= 0) {
    H.moreT = 0.5; const near = (pr, k, R) => H.props.some(o => o.k === k && Math.hypot(o.x - pr.x, o.z - pr.z) < R && (!HH.carry || HH.carry.pr !== o));
    for (const pr of H.props) if (pr.k === 'plot') { const st = s.base.plots[pr.key]; if (st && st.st) { st.sp = near(pr, 'sprinkler', 3.5) ? 1.3 : 1; st.yb = near(pr, 'lamp', 3.5) ? 1.3 : 1; } }
    if ((H.trimT = (H.trimT || 0) - 0.5) <= 0) { H.trimT = 5; for (const t of H.props) if (t.k === 'trimmer') for (const pr of H.props) if (pr.k === 'plot' && Math.hypot(pr.x - t.x, pr.z - t.z) < 5) { const st = s.base.plots[pr.key]; if (st && st.st && hhGrowK(st) >= 1) { hhPlotUse(pr); try { showMsg(`AUTO-TRIMMER · HARVESTED ${HH_STR(st.st).n}`); } catch (e) {} } } }
  }
  for (const pr of H.props) { const ud = pr.g.userData;
    if (ud.spin) ud.spin.rotation.y += dt * (pr.k === 'trimmer' ? 9 : 3);
    if (ud.flame) { ud.flame.scale.set(1 + Math.sin(NOW * 17 + pr.x) * 0.15, 1 + Math.sin(NOW * 13 + pr.z) * 0.25, 1); }
    if (ud.flag) { const p = ud.flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 0.6; p.setZ(i, Math.sin(NOW * 4 + x * 4) * 0.08 * x); } p.needsUpdate = true; }
    if (ud.bulbs) ud.bulbs.forEach((b, i) => { b.visible = Math.sin(NOW * 2 + i * 1.3) > -0.7; });
    if (ud.fill) ud.fill.visible = hhCompostN(pr) > 0; }
  return _hhBT.apply(this, arguments);
};
function hhCompostN(pr) { if (!pr.rec.t0) pr.rec.t0 = Date.now(); return Math.min(5, Math.floor((Date.now() - pr.rec.t0) / HH_COMPOST_MS)); }
// USE at the compost bin empties it (it is a "station" without a menu)
const _hhMO = hhMenuOpen;
hhMenuOpen = function (kind) {
  if (kind !== 'compost') return _hhMO.apply(this, arguments);
  const H = M.hh, pr = H.props.filter(o => o.k === 'compost').sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0]; if (!pr) return;
  const n = hhCompostN(pr); if (!n) { const left = HH_COMPOST_MS - (Date.now() - pr.rec.t0) % HH_COMPOST_MS; showMsg(`COMPOST BIN · NEXT NUTRIENTS IN ${fmtT(left / 1000)}`); return; }
  hhGive('nutri', n); pr.rec.t0 = n >= 5 ? Date.now() : pr.rec.t0 + n * HH_COMPOST_MS; hhSave(H.s); try { showMsg(`+${n} NUTRIENTS FROM THE COMPOST`); sfx.pickup(); } catch (e) {}
};
const _hhBM = hhBaseMarkers;
hhBaseMarkers = function (out) {
  _hhBM(out); const H = M.hh;
  for (const pr of H.props) { if (pr.k === 'compost' && Math.hypot(pr.x - P.x, pr.z - P.z) < 20) { const n = hhCompostN(pr); out.push({ x: pr.x, y: pr.y + 1.5, z: pr.z, t: n ? `COMPOST · ${n} READY` : 'COMPOST', c: n ? '#6ad8ff' : '#c8a070' }); }
    if ((pr.k === 'sprinkler' || pr.k === 'lamp' || pr.k === 'trimmer') && HH.build && Math.hypot(pr.x - P.x, pr.z - P.z) < 12) out.push({ x: pr.x, y: pr.y + pr.h + 0.4, z: pr.z, t: pr.n, c: pr.col }); }
};

/* ---------- repair / upgrade in build mode (GRENADE key) */
function hhFixLook() {
  const H = M.hh, p = HH.look; if (!p) { showMsg('LOOK AT A WALL, FLOOR OR STAIRS'); return; }
  if (p.prop || !p.mat) { showMsg(p.prop ? `${p.prop.n} · ${actName('inspect')} TO MOVE IT` : 'TRAPS CAN\'T BE UPGRADED'); return; }
  if (p.hp < p.max - 0.5) { const c = { [p.mat]: 5 }; if (!hhPay(H.s, c)) { showMsg(`REPAIR NEEDS 5 ${HH_MAT[p.mat].n}`); return; } p.hp = p.max; for (const m of p.meshes) if (m.userData.c0 !== undefined) m.material.color.setHex(m.userData.c0); try { showMsg('REPAIRED'); tone(500, 0.08, 0.05, 'triangle', 700); } catch (e) {} return; }
  const nx = p.mat === 'wood' ? 'stone' : p.mat === 'stone' ? 'metal' : null; if (!nx) { showMsg('ALREADY METAL'); return; }
  if (!hhPay(H.s, { [nx]: 10 })) { showMsg(`UPGRADING TO ${HH_MAT[nx].n} NEEDS 10 ${HH_MAT[nx].n}`); return; }
  const rec = Object.assign({}, p.rec, { mat: nx }); hhPieceRemove(p); hhPieceMake(rec); if (H.base) { H.s.base.pieces.push(rec); } hhSave(H.s); HH.look = null;
  try { showMsg(`UPGRADED TO ${HH_MAT[nx].n}`); tone(330, 0.06, 0.05, 'triangle', 660); burst(0.1, 1200, 0.1, 'bandpass'); } catch (e) {}
}

/* ---------- DRIFTERS and BLOATERS */
const _hhMob = hhMob;
hhMob = function (kind, x, z, y) {
  const e = _hhMob.apply(this, arguments);
  if (e.K.bloat) { try { e.rig.torso.scale.set(1.55, 1.25, 1.55); } catch (er) {} e.puff.material.color.setHex(0xc8c84a); e.puff.scale.setScalar(1.3); }
  if (e.K.fly) { e.group.position.y += 2.2; e.puff.scale.setScalar(1.4); e.puff.position.y = 0.9; }
  return e;
};
function hhFlyTick(e, dt) {
  const H = M.hh, g = e.group.position, K = e.K;
  if ((e.tgtT -= dt) <= 0) { e.tgtT = 0.4; e.tg = null; let bd = H.plant ? 8 : 90; if (playerAlive()) { const d = Math.hypot(P.x - g.x, P.z - g.z); if (d < bd) { bd = d; e.tg = 'P'; } } for (const o of enemies) if (o.entry && o.team === M.myTeam && o.entry.alive !== false) { const d = Math.hypot(o.group.position.x - g.x, o.group.position.z - g.z); if (d < bd) { bd = d; e.tg = o; } } }
  if (e.tg && e.tg !== 'P' && !enemies.includes(e.tg)) e.tg = null; if (e.tg === 'P' && !playerAlive()) e.tg = null;
  const T = e.tg === 'P' ? { x: P.x, z: P.z, y: P.y || 0 } : e.tg ? e.tg.group.position : H.plant ? { x: H.plant.x, z: H.plant.z, y: H.plant.y } : null;
  if (T) { const dx = T.x - g.x, dz = T.z - g.z, d = Math.hypot(dx, dz) || 1;
    if (d > 1.4) { g.x += dx / d * e.speed * dt; g.z += dz / d * e.speed * dt; }
    else if ((e.atkCd -= dt) <= 0) { e.atkCd = 1.0; e.atkT = 0.75; e.hitDone = false; }
    if (e.atkT > 0) { e.atkT -= dt; if (!e.hitDone && e.atkT < 0.3) { e.hitDone = true; if (d < 2) { if (e.tg === 'P') try { hurtPlayer(K.dmg, g.x, g.z); } catch (er) {} else if (e.tg) try { damageEnemy(e.tg, K.dmg, false, null, false, 'world'); } catch (er) {} else hhPlantHit(K.dmg); } } }
    e.group.rotation.y = Math.atan2(dx, dz); }
  const floor = groundAt(g.x, g.z, g.y + 1), want = Math.max(floor, (T ? T.y : floor)) + 1.6 + Math.sin(NOW * 2.5 + e.phase0) * 0.35; g.y += (want - g.y) * Math.min(1, dt * 2);
  e.group.rotation.x = 0.35; e.puff.material.opacity = 0.45 + Math.sin(NOW * 3 + e.phase0) * 0.1;
  animZombie(e, dt, 0.6);
}
function hhBloat(e) {
  const H = M.hh, g = e.group.position, K = e.K, p = { x: g.x, y: g.y + 1, z: g.z };
  try { explosionFx(p, 1.2); } catch (er) { try { chunks('dust', new THREE.Vector3(p.x, p.y, p.z), 20, 6, 0.8); } catch (e2) {} }
  try { sfx.explode(at(g.x, g.z, 40)); } catch (er) {}
  for (const pc of H.pieces.slice()) if (!pc.trap && Math.hypot(pc.cx - g.x, pc.cz - g.z) < 3.4 && Math.abs(pc.y - g.y) < 3) hhPieceHit(pc, K.bdmg);
  if (H.plant && Math.hypot(H.plant.x - g.x, H.plant.z - g.z) < 3.6) hhPlantHit(K.dmg);
  if (playerAlive() && Math.hypot(P.x - g.x, P.z - g.z) < 3.6) try { hurtPlayer(K.dmg * 0.6, g.x, g.z, true); } catch (er) {}
  for (const o of enemies.slice()) if (o.entry && o.team === M.myTeam && Math.hypot(o.group.position.x - g.x, o.group.position.z - g.z) < 3.6) try { damageEnemy(o, K.dmg * 0.6, false, null, true, 'world'); } catch (er) {}
  try { damageEnemy(e, 1e6, false, null, true, 'world'); } catch (er) {}
}

/* ---------- THE BUYER's daily order */
function hhOrder() {
  const d = new Date(), key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, h = Math.imul(d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate(), 2246822519) >>> 0;
  const st = ['og', 'haze', 'blue', 'north'][h % 4], n = 6 + (h >>> 3) % 9, S0 = HH_STR(st), cm = HH_CMATS[(h >>> 7) % HH_CMATS.length];
  return { key, st, n, pay: Math.round(n * S0.price * 2), cm, cmn: 4 + (h >>> 11) % 5 };
}
const _hhMR = hhMenuRender;
hhMenuRender = function () {
  _hhMR.apply(this, arguments);
  if (HH.menu !== 'buyer') return; const o = $('hhMenu'), H = M && M.hh; if (!o || !H) return; const s = H.s, O = hhOrder(), done = s.orderDone === O.key, have = s.buds[O.st] | 0;
  const sec = document.createElement('div'); sec.className = 'hh-sec hh-order'; sec.innerHTML = `<h4>TODAY'S ORDER</h4><div class="hh-li"><b>${O.n} ${HH_STR(O.st).n}</b><span>${done ? 'delivered today · a new order tomorrow' : `pays $${O.pay.toLocaleString()} (double) + ${O.cmn} ${HH_CMAT[O.cm].n} · you have ${have}`}</span><button class="mini${done || have < O.n ? ' off' : ''}" data-hm="order:1"${done || have < O.n ? ' disabled' : ''}>${done ? 'DONE' : 'DELIVER'}</button></div>`;
  const box = o.querySelector('.hh-mbox'), first = box && box.querySelector('.hh-sec'); if (first) box.insertBefore(sec, first);
};
const _hhMD = hhMenuDo;
hhMenuDo = function (a, v) {
  if (a !== 'order') return _hhMD.apply(this, arguments);
  const H = M.hh, s = H.s, O = hhOrder(); if (s.orderDone === O.key || (s.buds[O.st] | 0) < O.n) return;
  s.buds[O.st] -= O.n; s.cash += O.pay; s.sold = (s.sold | 0) + O.pay; s.inv[O.cm] = (s.inv[O.cm] | 0) + O.cmn; s.orderDone = O.key; hhSave(s);
  try { showBanner('ORDER DELIVERED', `+$${O.pay.toLocaleString()} · +${O.cmn} ${HH_CMAT[O.cm].n}`); sfx.streak(); } catch (e) {}
  hhMenuRender();
};
(() => { const s = document.createElement('style'); s.textContent = `.hh-cat{display:flex;gap:4px;justify-content:flex-end;align-items:center;margin-top:6px}.hh-cat span{font-size:9px;letter-spacing:.18em;padding:3px 8px;border:1px solid rgba(255,255,255,.15);background:rgba(10,10,14,.55)}.hh-cat span.on{border-color:#ffd24a;color:#ffd24a}.hh-cat small{font-size:8px;letter-spacing:.12em;opacity:.7;margin-left:6px}
.hh-order .hh-li{border-color:rgba(255,210,74,.5);background:rgba(60,50,10,.35)}`; document.head.appendChild(s); })();
