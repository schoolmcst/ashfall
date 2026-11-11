/* ================================================================== HOTBOX HORDE: TRAPS 2 (1.2.104, the owner's list 21-28)
   New traps (crafted at the WORKBENCH, placed from the BUILD list): PUSH WALL (a spring panel that throws burnouts back
   2.5 m round it), CEILING ZAPPER (hangs under a floor you built, zaps everything in the cell below), GAS VENT (a choking
   cloud every few seconds), TURRET (shoots the nearest burnout in 18 m it can see; 250 shots), BARRICADE (quick boards on a
   cell edge, gone after 12 s). TRAP LEVELS 1-3 per trap at the WORKBENCH (+35% damage a level). In build mode every trap
   shows its uses left. COMBO: a slowed burnout (resin, zap, push) takes 50% more damage from everything. */
Object.assign(HH_TRAPS, {
  pusher: { n: 'PUSH WALL', cost: { wood: 15, metal: 10, wire: 1 }, d: 'a spring panel: throws burnouts within 2.5 m back' },
  ceilzap: { n: 'CEILING ZAPPER', cost: { metal: 15, wire: 2, battery: 1 }, d: 'hangs under a floor you built · zaps the cell below' },
  gas: { n: 'GAS VENT', cost: { metal: 10, sap: 2, scrap: 2 }, d: 'a choking cloud every few seconds' },
  turret: { n: 'TURRET', cost: { metal: 40, scrap: 10, battery: 2, wire: 2 }, d: 'shoots the nearest burnout it can see · 250 shots' },
  barricade: { n: 'BARRICADE', cost: { wood: 15 }, d: 'quick boards on a cell edge · gone after 12 seconds' },
});
const HH_TUSES = { pusher: 30, ceilzap: 40, gas: 20, turret: 250 };
const HH_TLV_COST = lv => ({ metal: 20 * lv, scrap: 4 * lv, wire: lv });
// the spec: the ceiling zapper hangs from the floor above
const _hhSpec4 = hhSpec;
hhSpec = function (id, ix, iz, lv, dir, up) { const a = _hhSpec4.apply(this, arguments); if (id === 'ceilzap') { a.y = M.hh.by + lv * HH_LV + HH_LV - 0.45; a.h = 0.4; } return a; };
const _hhValid4 = hhValid;
hhValid = function (a) { if (a.id === 'ceilzap' && !M.hh.slots.has(`f${a.ix},${a.iz},${a.lv + 1}`)) return false; return _hhValid4.apply(this, arguments); };
const _hhPMk4 = hhPieceMake;
hhPieceMake = function (rec) { const p = _hhPMk4.apply(this, arguments); if (p && HH_TUSES[p.id]) p.uses = HH_TUSES[p.id]; if (p && p.id === 'barricade') { p.born = NOW; for (const m of p.meshes) if (m.material && m.material.color) m.material.color.setHex(0xc89a6a); } return p; };
const _hhTM4 = hhTrapMesh;
hhTrapMesh = function (p) {
  if (!HH_TUSES[p.id]) return _hhTM4.apply(this, arguments);
  const H = M.hh, g = new THREE.Group(); g.position.set(p.cx, p.y, p.cz); H.grp.add(g); p.g = g; const steel = hhStd({ color: 0x5a6068, metalness: 0.7, roughness: 0.4 }), dark = hhStd({ color: 0x222226, roughness: 0.6 });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  if (p.id === 'pusher') { add(new THREE.BoxGeometry(2.2, 0.08, 0.6), dark, 0, 0.04, 0); const pl = add(new THREE.BoxGeometry(2.0, 1.2, 0.12), hhStd({ color: 0xc87a2a, roughness: 0.5 }), 0, 0.75, 0); p.core = pl; for (const x of [-0.7, 0, 0.7]) add(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), steel, x, 0.3, 0); }
  else if (p.id === 'ceilzap') { add(new THREE.BoxGeometry(1.2, 0.08, 1.2), dark, 0, 0.36, 0); const c = add(new THREE.CylinderGeometry(0.25, 0.25, 0.3, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0x113355, emissive: 0x3a9aff, emissiveIntensity: 2, wireframe: true }), 0, 0.15, 0); p.core = add(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0x9ad8ff }), 0, 0.15, 0); }
  else if (p.id === 'gas') { add(new THREE.CylinderGeometry(0.45, 0.5, 0.25, 12), dark, 0, 0.12, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 6), hhStd({ color: 0x6aff4a, emissive: 0x2a8a1a, emissiveIntensity: 1 }), Math.cos(a) * 0.3, 0.3, Math.sin(a) * 0.3); }
    const cl = new THREE.Group(); for (let i = 0; i < 7; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0x8aff5a, transparent: true, opacity: 0, depthWrite: false })); s.position.set(rnd(-1.2, 1.2), rnd(0.4, 1.6), rnd(-1.2, 1.2)); s.scale.setScalar(rnd(1.5, 2.5)); cl.add(s); } g.add(cl); p.cloud = cl; }
  else { add(new THREE.CylinderGeometry(0.35, 0.45, 0.2, 12), dark, 0, 0.1, 0); add(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 8), steel, 0, 0.55, 0); const head = new THREE.Group(); head.position.y = 0.95; g.add(head);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.55), hhStd({ color: 0x3a5a3a, roughness: 0.5, metalness: 0.4 })); head.add(body); const brl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.6, 8), steel); brl.rotation.x = Math.PI / 2; brl.position.z = 0.5; head.add(brl); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3a3a })); eye.position.set(0, 0.1, 0.28); head.add(eye); p.head = head; }
  g.traverse(o => { if (o.isMesh) p.meshes.push(o); });
};
/* ---------- the new traps each frame */
const _hhTT4 = hhTrapTick;
hhTrapTick = function (dt) {
  _hhTT4.apply(this, arguments); const H = M.hh, tk = 1 + 0.2 * (H.lv.trap | 0);
  for (const p of H.traps.slice()) {
    if (!HH_TUSES[p.id]) continue; p.cd2 = (p.cd2 || 0) - dt;
    if (p.id === 'pusher') { if (p.core) p.core.position.z = Math.max(0, (p.core.position.z || 0) - dt * 2); if (p.cd2 > 0) continue; let any = false; for (const e of H.mobs) { const g = e.group.position, d = Math.hypot(g.x - p.cx, g.z - p.cz); if (d < 2.5 && Math.abs(g.y - p.y) < 1.5 && !e.K.boss) { any = true; const L = d || 1; for (let k = 0; k < 6; k++) { g.x += (g.x - p.cx) / L * 0.6; g.z += (g.z - p.cz) / L * 0.6; resolve(g, 0.42, g.y, true); } e.slowT = 1.2; hhTrapDmg(e, 22 * tk, p); } } if (any) { p.cd2 = 1.8; p.uses--; if (p.core) p.core.position.z = 0.3; try { burst(0.25, 500, 0.18, 'lowpass', at(p.cx, p.cz, 25)); } catch (e) {} } }
    else if (p.id === 'ceilzap') { if (p.cd2 > 0) continue; const hit = H.mobs.filter(e => Math.abs(e.group.position.x - p.cx) < 1.6 && Math.abs(e.group.position.z - p.cz) < 1.6 && e.group.position.y < p.y && e.group.position.y > p.y - HH_LV - 0.5); if (hit.length) { p.cd2 = 1.2; p.uses--; for (const e of hit) { hhTrapDmg(e, 45 * tk, p); e.slowT = 0.8; hhZapFx(new THREE.Vector3(p.cx, p.y + 0.15, p.cz), e.group.position.clone().setY(e.group.position.y + 1.3)); } } }
    else if (p.id === 'gas') { p.on = Math.max(0, (p.on || 0) - dt); for (const s of p.cloud.children) s.material.opacity = Math.min(0.5, p.on * 0.25); if (p.on > 0) { for (const e of H.mobs) if (Math.hypot(e.group.position.x - p.cx, e.group.position.z - p.cz) < 3 && Math.abs(e.group.position.y - p.y) < 2) hhTrapDmg(e, 20 * tk * dt, p); continue; } if (p.cd2 > 0) continue; if (H.mobs.some(e => Math.hypot(e.group.position.x - p.cx, e.group.position.z - p.cz) < 4)) { p.on = 3; p.cd2 = 6; p.uses--; try { burst(0.8, 1500, 0.1, 'bandpass', at(p.cx, p.cz, 25)); } catch (e) {} } }
    else if (p.id === 'turret') { let best = null, bd = 18; for (const e of H.mobs) { const g = e.group.position, d = Math.hypot(g.x - p.cx, g.z - p.cz); if (d < bd && gridClear(p.cx, p.cz, g.x, g.z, p.y, g.y)) { bd = d; best = e; } }
      if (best && p.head) { const g = best.group.position, want = Math.atan2(g.x - p.cx, g.z - p.cz); let dy = want - p.head.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); p.head.rotation.y += dy * Math.min(1, dt * 10); }
      if (!best || p.cd2 > 0) continue; p.cd2 = 0.25; p.uses--; const from = new THREE.Vector3(p.cx, p.y + 0.95, p.cz), to = new THREE.Vector3(best.group.position.x + rnd(-0.2, 0.2), best.group.position.y + 1.2, best.group.position.z + rnd(-0.2, 0.2));
      try { addTracer(from, to, 0.04, 0.02); tone(rnd(300, 360), 0.04, 0.03, 'square', 120, at(p.cx, p.cz, 30)); } catch (e) {} hhTrapDmg(best, 14 * tk, p); }
    if (p.uses <= 0) { hhPieceRemove(p); try { showMsg(`A ${HH_TRAPS[p.id].n} WORE OUT`); } catch (e) {} }
  }
  for (const p of H.pieces.slice()) if (p.id === 'barricade' && NOW - (p.born || NOW) > 12) { hhPieceRemove(p); try { chunks('wood', new THREE.Vector3(p.cx, p.y + 1, p.cz), 8, 3, 0.5); } catch (e) {} }
};
// COMBO: slowed burnouts take 50% more damage
const _hhDmg4 = damageEnemy;
damageEnemy = function (e, dmg, head, dir, boom, by) { if (e && e.hhMob && (e.slowT > 0 || e.inResin)) dmg *= 1.5; return _hhDmg4.apply(this, [e, dmg, head, dir, boom, by]); };
// barricades never go into the base save
const _hhBS4 = hhBaseSetup;
hhBaseSetup = function (H) { H.s.base.pieces = H.s.base.pieces.filter(r => r.id !== 'barricade'); return _hhBS4.apply(this, arguments); };
// uses left over each trap in build mode
const _hhMk4 = hhMarkers;
hhMarkers = function (out) { _hhMk4(out); const H = M.hh; if (!H || !HH.build) return; for (const p of H.traps) if (Math.hypot(p.cx - P.x, p.cz - P.z) < 16 && p.uses < 1e8) { const max = HH_TUSES[p.id] || (p.id === 'spikes' ? 50 : p.id === 'zapper' ? 40 : p.id === 'launcher' ? 30 : 0); if (!max) continue; const k = p.uses / max; out.push({ x: p.cx, y: p.y + (p.id === 'ceilzap' ? -0.3 : 1.1), z: p.cz, t: `${HH_TRAPS[p.id].n.split(' ')[0]} ${p.uses}/${max}`, c: k > 0.5 ? '#7aff8a' : k > 0.2 ? '#ffd24a' : '#ff6a4a' }); } };
/* ---------- trap levels at the WORKBENCH */
const _hhMR4 = hhMenuRender;
hhMenuRender = function () {
  _hhMR4.apply(this, arguments); if (HH.menu !== 'bench') return; const o = $('hhMenu'), H = M && M.hh; if (!o || !H) return; const s = H.s; s.tlv = s.tlv || {};
  const box = o.querySelector('.hh-mbox'), acts = box && box.querySelector('.onb-acts'); if (!acts) return; const sec = document.createElement('div'); sec.className = 'hh-sec';
  sec.innerHTML = `<h4>TRAP LEVELS · +35% DAMAGE A LEVEL</h4>${Object.keys(HH_TRAPS).filter(k => k !== 'chill' && k !== 'resin' && k !== 'barricade').map(k => { const lv = s.tlv[k] | 0, c = HH_TLV_COST(lv + 1); return `<div class="hh-li"><b>${HH_TRAPS[k].n} · LEVEL ${lv + 1}</b><span>${lv >= 2 ? 'max level' : hhCostTxt(c, s)}</span><button class="mini${lv >= 2 || !hhHas(s, c) ? ' off' : ''}" data-hm="tlv:${k}"${lv >= 2 || !hhHas(s, c) ? ' disabled' : ''}>${lv >= 2 ? 'MAX' : 'UPGRADE'}</button></div>`; }).join('')}`;
  box.insertBefore(sec, acts);
};
const _hhMD4 = hhMenuDo;
hhMenuDo = function (a, v) { if (a !== 'tlv') return _hhMD4.apply(this, arguments); const s = M.hh.s; s.tlv = s.tlv || {}; const lv = s.tlv[v] | 0; if (lv < 2 && hhPay(s, HH_TLV_COST(lv + 1))) { s.tlv[v] = lv + 1; try { showMsg(`${HH_TRAPS[v].n} · LEVEL ${lv + 2}`); sfx.pickup(); } catch (e) {} } hhSave(s); hhMenuRender(); };
