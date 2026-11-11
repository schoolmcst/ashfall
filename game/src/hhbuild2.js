/* ================================================================== HOTBOX HORDE: BUILDING 2 (1.2.103, the owner's list 11-20)
   New pieces: HALF WALL, RAILING, ROOF (a thin walkable slope). In build mode: STREAK (X) EDITS the wall you look at
   (solid -> doorway -> window), PRONE (B) PAINTS it (7 colours), U UNDOES your last 10 placements (cost back), and holding
   the fire button DRAGS a line of pieces. THE PLANS: 3 BLUEPRINT slots (save your layout, rebuild what's missing later -
   handy after a raid), NIGHT RAIDS (darker, a quarter off the expansion price) and your base's DEFENCE SCORE. New decor:
   LAMP POST. Records gain v (wall variant) and c (paint). */
const HH_PAINT = [null, 0xd04848, 0x8a4ad0, 0x4ab04a, 0x4a7ad0, 0x3a3a3a, 0xe0c040, 0xf0f0f0];
const HH_PAINTN = ['NATURAL', 'RED', 'PURPLE', 'GREEN', 'BLUE', 'BLACK', 'YELLOW', 'WHITE'];
Object.assign(HH_PROPS, { lamppost: { n: 'LAMP POST', w: 0.4, d: 0.4, h: 3.0, col: '#ffe08a', cost: { cash: 120 }, buy: 1 } });
HH_DECOR.push('lamppost');
// the new grid pieces in the BUILD list (after the stairs)
const _hhPL3 = hhPieceList;
hhPieceList = function () { const L = _hhPL3.apply(this, arguments); if (L[0] && L[0].id === 'wall') L.splice(3, 0, { id: 'half', n: 'HALF WALL', cost: 6 }, { id: 'rail', n: 'RAILING', cost: 4 }, { id: 'roof', n: 'ROOF', cost: 10 }); return L; };
// a doorway (1.2 m wide, 2.2 m high) or a window (1.2 m wide, 1.0 to 2.1 m) in a wall
function hhWallParts(a, v, add) {
  const alongX = a.w > a.d, L = HH_C, t = alongX ? a.d : a.w, part = (off, len, y0, h) => alongX ? add(a.cx + off, a.cz, len, t, h, a.y + y0) : add(a.cx, a.cz + off, t, len, h, a.y + y0), side = (L - 1.2) / 2;
  part(-(L / 2 - side / 2), side, 0, a.h); part(L / 2 - side / 2, side, 0, a.h);
  if (v === 1) part(0, 1.2, 2.2, a.h - 2.2);
  else { part(0, 1.2, 0, 1.0); part(0, 1.2, 2.1, a.h - 2.1); }
}
// paint after a piece is made
const _hhPMk = hhPieceMake;
hhPieceMake = function (rec, quiet) {
  const p = _hhPMk.apply(this, arguments);
  if (p && rec.id === 'roof' && p.meshes.length) {   // a smooth sloped panel over the (hidden) walkable steps
    const L = Math.hypot(HH_C, HH_LV), t = Math.atan2(HH_LV, HH_C), alongZ = rec.dir % 2 === 0, slab = new THREE.Mesh(new THREE.BoxGeometry(alongZ ? HH_C : L, 0.16, alongZ ? L : HH_C), p.meshes[0].material.clone());
    if (rec.dir === 0) slab.rotation.x = t; else if (rec.dir === 2) slab.rotation.x = -t; else if (rec.dir === 1) slab.rotation.z = t; else slab.rotation.z = -t;
    slab.position.set(p.cx, p.y + HH_LV / 2 - 0.05, p.cz); slab.castShadow = slab.receiveShadow = true; for (const m of p.meshes) m.visible = false; M.hh.grp.add(slab); p.meshes.push(slab);
  }
  if (rec.c && HH_PAINT[rec.c] && p) for (const m of p.meshes) if (m.material && m.material.color) { m.material.color.setHex(HH_PAINT[rec.c]); m.userData.c0 = HH_PAINT[rec.c]; }
  return p;
};
/* ---------- edit, paint, undo, drag */
function hhRemake(p, ch) { const H = M.hh, rec = Object.assign({}, p.rec, ch); hhPieceRemove(p); const np = hhPieceMake(rec); if (H.base) { H.s.base.pieces.push(rec); hhSave(H.s); } return np; }
function hhEditLook() { const p = HH.look; if (!p || p.prop || p.id !== 'wall') { showMsg('LOOK AT A WALL TO MAKE A DOORWAY OR A WINDOW'); return; } const v = ((p.rec.v | 0) + 1) % 3; hhRemake(p, { v }); HH.look = null; try { showMsg(['SOLID WALL', 'DOORWAY', 'WINDOW'][v]); tone(600, 0.05, 0.04, 'triangle'); } catch (e) {} }
function hhPaintLook() { const p = HH.look; if (!p || p.prop || !p.mat) { showMsg('LOOK AT A WALL, FLOOR, STAIRS OR ROOF TO PAINT IT'); return; } const c = ((p.rec.c | 0) + 1) % HH_PAINT.length; hhRemake(p, { c }); HH.look = null; try { showMsg(`PAINT · ${HH_PAINTN[c]}`); burst(0.15, 3000, 0.05, 'highpass'); } catch (e) {} }
HH.undo = [];
const _hhPlace3 = hhPlace;
hhPlace = function () {
  const H = M.hh, L = hhPieceList(), P0 = L[HH.piece] || L[0], carrying = !!HH.carry, cost = carrying ? {} : P0.trap ? { trap: P0.id } : hhCost(P0);
  const p = _hhPlace3.apply(this, arguments);
  if (p && !carrying) { HH.undo.push({ p, cost }); if (HH.undo.length > 10) HH.undo.shift(); H.s.dscore = 0; }
  return p;
};
function hhUndo() {
  const H = M.hh, u = HH.undo.pop(); if (!u) { showMsg('NOTHING TO UNDO'); return; } const p = u.p;
  if (p.rec && p.rec.id !== undefined && H.pieces.includes(p)) hhPieceRemove(p);
  else if (p.rec && H.props && H.props.includes(p)) { if (p.g.parent) p.g.parent.remove(p.g); if (p.plant && p.plant.parent) p.plant.parent.remove(p.plant); const i = boxes.indexOf(p.box); if (i >= 0) boxes.splice(i, 1); try { rebuildBoxGrid(); } catch (e) {} H.props = H.props.filter(o => o !== p); const j = H.s.base.props.indexOf(p.rec); if (j >= 0) H.s.base.props.splice(j, 1); delete H.s.base.plots[p.key]; }
  else { showMsg('THAT PIECE IS ALREADY GONE'); return; }
  if (u.cost.trap) H.s.traps[u.cost.trap] = (H.s.traps[u.cost.trap] | 0) + 1; else for (const k in u.cost) { if (k === 'cash') H.s.cash += u.cost[k]; else H.s.inv[k] = (H.s.inv[k] | 0) + u.cost[k]; }
  hhSave(H.s); try { showMsg('UNDONE · COST BACK'); tone(400, 0.06, 0.04, 'triangle', 300); } catch (e) {}
}
addEventListener('keydown', e => {
  if (!M || !M.hh || !HH.build || G.state !== 'playing' || curScreen || HH.menu || e.repeat) return; const c = e.code;
  if (c === bind('streak')) { e.stopImmediatePropagation(); hhEditLook(); }
  else if (c === bind('prone')) { e.stopImmediatePropagation(); hhPaintLook(); }
  else if (c === 'KeyU') { e.stopImmediatePropagation(); hhUndo(); }
}, true);
addEventListener('mouseup', e => { if (e.button === 0) HH.drag = false; }, true);
const _hhTick3 = hhTick;
hhTick = function (dt) {
  const r = _hhTick3.apply(this, arguments);
  if (M.hh && HH.build && HH.drag && !HH.carry && !HH.menu) { const a = hhAim(); if (!HH.dragKey) HH.dragKey = a.key; else if (a.key !== HH.dragKey) { HH.dragKey = a.key; if (hhValid(a)) hhPlace(); } }
  return r;
};
/* ---------- blueprints, night raids, the defence score (THE PLANS) */
function hhDefScore(H) {
  let n = 0; for (const p of H.pieces) n += p.trap ? 60 : Math.round((p.max || 0) / 10) * (p.id === 'half' || p.id === 'rail' ? 0.5 : 1);
  for (const pr of H.props || []) if (pr.k === 'sprinkler' || pr.k === 'lamp') n += 5; return Math.round(n + (H.lv.plant | 0) * 50 + (H.lv.trap | 0) * 40);
}
function hhBpSave(slot) { const H = M.hh, s = H.s; s.bp = s.bp || {}; s.bp[slot] = s.base.pieces.map(r => Object.assign({}, r)); hhSave(s); showMsg(`BLUEPRINT ${slot} SAVED · ${s.bp[slot].length} PIECES`); }
function hhBpBuild(slot) {
  const H = M.hh, s = H.s, bp = (s.bp || {})[slot]; if (!bp) { showMsg('THAT BLUEPRINT IS EMPTY'); return; } let built = 0, broke = 0;
  for (const rec of bp) { const a = hhSpec(rec.id, rec.ix, rec.iz, rec.lv, rec.dir, rec.up); if (a.key.split('|').some(k => H.slots.has(k)) || hhPropHit(a)) continue;
    const trap = HH_TRAPS[rec.id], cost = trap ? null : { [rec.mat || 'wood']: rec.id === 'half' ? 6 : rec.id === 'rail' ? 4 : 10 };
    if (trap ? !(s.traps[rec.id] > 0) : !hhHas(s, cost)) { broke++; continue; } if (trap) s.traps[rec.id]--; else hhPay(s, cost);
    const nr = Object.assign({}, rec); hhPieceMake(nr, true); s.base.pieces.push(nr); built++; }
  try { rebuildBoxGrid(); } catch (e) {} hhSave(s); showMsg(`BLUEPRINT ${slot} · BUILT ${built}${broke ? ` · ${broke} MORE NEED MATERIALS OR TRAPS` : ''}`);
}
function hhNight(on) {
  const base = Object.assign({}, ENV_DEFAULT, MAPS[curMap] && MAPS[curMap].env), k = on ? 1 : 0, mix = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), k);
  try { skyMat.uniforms.top.value = mix(base.top, 0x0b1428); hemi.color = mix(base.hemiSky, 0x4a5a80); hemi.groundColor = mix(base.hemiGround, 0x1a1a22); sun.color = mix(base.sunCol, 0x9ab0ff); sun.intensity = base.sunI * (1 - 0.68 * k);
    scene.fog.color.copy(mix(base.horizon, 0x1a2038)); ENV_EXPOSURE = base.exposure * (1 - 0.1 * k); renderer.toneMappingExposure = ENV_EXPOSURE * S.brightness / 100; } catch (e) {}
  HH.night = on;
}
const _hhRS = hhRaidStart;
hhRaidStart = function () {
  const H = M.hh, s = H.s, nx = HH_BASELV[s.base.lv]; if (!nx) return; const night = !!s.nightRaid, cost0 = nx.cost;
  if (night) nx.cost = Math.round(cost0 * 0.75);
  _hhRS.apply(this, arguments); nx.cost = cost0;
  if (H.raid) { H.raid.cost = night ? Math.round(cost0 * 0.75) : cost0; if (night) { hhNight(true); H.D = HH_DIFF[Math.min(3, s.base.lv)]; } }
};
const _hhRE = hhRaidEnd;
hhRaidEnd = function (won) { const r = _hhRE.apply(this, arguments); if (HH.night) hhNight(false); return r; };
const _hhClr3 = hhClear;
hhClear = function () { if (HH.night) hhNight(false); HH.undo = []; return _hhClr3.apply(this, arguments); };
const _hhMR3 = hhMenuRender;
hhMenuRender = function () {
  _hhMR3.apply(this, arguments); if (HH.menu !== 'plans') return; const o = $('hhMenu'), H = M && M.hh; if (!o || !H) return; const s = H.s, box = o.querySelector('.hh-mbox'), acts = box && box.querySelector('.onb-acts'); if (!acts) return;
  const sec = document.createElement('div'); sec.className = 'hh-sec';
  sec.innerHTML = `<h4>DEFENCE SCORE · ${hhDefScore(H).toLocaleString()}</h4><p>walls by material, traps, gear and upgrades · a raid at level ${s.base.lv + 1} wants about ${(s.base.lv * 900).toLocaleString()}</p>
    <h4>NIGHT RAIDS</h4><div class="hh-li"><b>${s.nightRaid ? 'ON' : 'OFF'}</b><span>raids happen at night: darker and a step harder, but the expansion costs 25% less</span><button class="mini" data-hm="night:1">${s.nightRaid ? 'TURN OFF' : 'TURN ON'}</button></div>
    <h4>BLUEPRINTS</h4>${[1, 2, 3].map(i => { const bp = (s.bp || {})[i]; return `<div class="hh-li hh-li4"><b>SLOT ${i}</b><span>${bp ? bp.length + ' pieces' : 'empty'}</span><button class="mini" data-hm="bpsave:${i}">SAVE LAYOUT</button><button class="mini${bp ? '' : ' off'}" data-hm="bpbuild:${i}"${bp ? '' : ' disabled'}>REBUILD</button><span></span></div>`; }).join('')}`;
  box.insertBefore(sec, acts);
};
const _hhMD3 = hhMenuDo;
hhMenuDo = function (a, v) {
  const H = M.hh, s = H.s;
  if (a === 'night') { s.nightRaid = !s.nightRaid; hhSave(s); hhMenuRender(); return; }
  if (a === 'bpsave') { hhBpSave(v); hhMenuRender(); return; }
  if (a === 'bpbuild') { hhBpBuild(v); hhMenuRender(); return; }
  return _hhMD3.apply(this, arguments);
};
const _hhHud3 = hhHud;
hhHud = function () { const t = _hhHud3.apply(this, arguments), H = M.hh; return H && H.base ? `${t} · DEFENCE ${hhDefScore(H).toLocaleString()}` : t; };
// the lamp post
const _hhPM3 = hhPropMesh;
hhPropMesh = function (k) {
  if (k !== 'lamppost') return _hhPM3(k);
  const g = new THREE.Group(), dark = hhStd({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.5 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.8, 8), dark); pole.position.y = 1.4; g.add(pole);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.15, 10), dark); base.position.y = 0.075; g.add(base);
  const lan = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.35, 6), new THREE.MeshBasicMaterial({ color: 0xffe0a0 })); lan.position.y = 2.95; g.add(lan);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 6), dark); cap.position.y = 3.2; g.add(cap);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0xffd080, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.55, depthWrite: false })); glow.scale.setScalar(1.6); glow.position.y = 2.95; g.add(glow); g.userData.glow = glow;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
};
// build-mode tips: the new keys
const _hhDT3 = hhDomTick;
hhDomTick = function () { _hhDT3.apply(this, arguments); const m = $('hhMats'); if (!m || !HH.build) return; let t = m.querySelector('.hh-keys'); if (!t) { t = document.createElement('div'); t.className = 'hh-cost hh-keys'; m.appendChild(t); } const s = `${actName('streak')} DOOR / WINDOW · ${actName('prone')} PAINT · U UNDO · HOLD CLICK TO DRAG`; if (t.textContent !== s) t.textContent = s; };
