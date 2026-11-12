/* ================================================================== HOTBOX HORDE heroes, crew and gear (1.2.111, the owner's list E = 37-44)
   37 Two new heroes: THE BOTANIST (plants grow 25% faster, the plant heals near you; BLOOM: heals the plant, you and the
      crew, slows burnouts round you) and THE ENGINEER (traps craft 25% cheaper and hit 20% harder; DRONE: a drone over
      you shoots burnouts for 20 s).
   38 OUTFITS from THE HORDE TRACK (s.outfits, s.outfit): your sleeves and gloves change colour in HORDE.
   39 GUN MODS at the WORKBENCH for the equipped gun (g.mods: mag = +50% magazine, scope = +25% headshots, glue = hits slow).
   40 SPECIAL AMMO packs (s.ammo, s.ammoSel; one pack a mission): FIRE (burns), SHOCK (jumps to a 2nd burnout), SAP (slows).
   41 GADGETS (s.gadget, 2 a mission; key 4 / pad D-PAD DOWN): HEAL SPRINKLER, GRAPPLE HOOK, DECOY PLANT.
   42 CREW KIT (s.ckit 0-3 at the WORKBENCH): better guns, more damage and health for your crew.
   43 BUDDY THE DOG (s.dog): follows you, fetches loot orbs, barks and pings burnouts near you.
   44 CREW MORALE (s.morale 0-100): wins raise it, losses drop it, FEED THE CREW (buds or a brownie) in the lobby; happy
      crews shoot and work better, grumpy ones worse. */
const HHG = { drone: null, decoy: null, spr: null, grap: null, dog: null, gad: 0, vm: null };
/* ---------- 37 heroes */
HH_HEROES.push({ id: 'botanist', n: 'BOTANIST', col: '#9aff6a', d: 'plants grow 25% faster · THE MOTHER PLANT heals when you are close' }, { id: 'engineer', n: 'ENGINEER', col: '#6ad8ff', d: 'traps cost 25% less to craft and hit 20% harder' });
Object.assign(HH_ABIL, { botanist: { n: 'BLOOM', cd: 35 }, engineer: { n: 'DRONE', cd: 45 } });
const _hhgAb = hhAbility;
hhAbility = function () {
  const H = M && M.hh; if (!H || !['botanist', 'engineer'].includes(H.hero)) return _hhgAb.apply(this, arguments);
  if (!playerAlive() || HH.build || HH.menu) return; const A = HH_ABIL[H.hero]; if (HH.abT > 0) { showMsg(`${A.n} · READY IN ${Math.ceil(HH.abT)} s`); return; }
  if (H.hero === 'botanist') { if (H.plant) H.plant.hp = Math.min(H.plant.max, H.plant.hp + H.plant.max * 0.3); G.health = Math.min(G.maxHp || 100, G.health + 40);
    for (const e of enemies) { const d = Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z); if (e.entry && e.team === M.myTeam && d < 9) e.hp = Math.min(e.maxHp, e.hp + 60); if (e.hhMob && d < 9) e.slowT = Math.max(e.slowT || 0, 4); }
    try { chunks('leaf', new THREE.Vector3(P.x, (P.y || 0) + 1, P.z), 24, 5, 0.8); } catch (e) { try { chunks('dust', new THREE.Vector3(P.x, (P.y || 0) + 1, P.z), 18, 4, 0.6); } catch (er) {} }
    try { showBanner('BLOOM', 'the plant, you and your crew heal · burnouts close by slow down'); tone(523, 0.3, 0.06, 'sine', 784); } catch (e) {} }
  else { hhgDrone(H); try { showBanner('DRONE UP', 'it shoots burnouts for 20 s'); tone(220, 0.4, 0.05, 'sawtooth', 440); } catch (e) {} }
  HH.abT = A.cd;
};
function hhgDrone(H) {
  if (HHG.drone && HHG.drone.g.parent) HHG.drone.g.parent.remove(HHG.drone.g); const g = new THREE.Group(), m = hhStd({ color: 0x2a3a4a, metalness: 0.6, roughness: 0.35 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.45), m); g.add(body); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0x6ad8ff })); eye.position.set(0, -0.08, 0.2); g.add(eye);
  const rot = []; for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.01, 0.04), new THREE.MeshBasicMaterial({ color: 0x111111 })); r.position.set(x, 0.08, z); g.add(r); rot.push(r); }
  g.position.set(P.x, (P.y || 0) + 3, P.z); H.grp.add(g); HHG.drone = { g, rot, t: 20, fire: 0 };
}
function hhgDroneTick(H, dt) {
  const D = HHG.drone; if (!D) return; D.t -= dt; for (const r of D.rot) r.rotation.y += dt * 40;
  const want = new THREE.Vector3(P.x + Math.sin(NOW) * 1.5, (P.y || 0) + 3.2, P.z + Math.cos(NOW) * 1.5); D.g.position.lerp(want, Math.min(1, dt * 3));
  if ((D.fire -= dt) <= 0) { let best = null, bd = 22; for (const e of H.mobs) { const g = e.group.position, d = Math.hypot(g.x - D.g.position.x, g.z - D.g.position.z); if (d < bd && gridClear(D.g.position.x, D.g.position.z, g.x, g.z, D.g.position.y - 1, g.y + 1)) { bd = d; best = e; } }
    if (best) { D.fire = 0.22; const to = best.group.position.clone().setY(best.group.position.y + 1.1); try { addTracer(D.g.position.clone(), to); } catch (e) {} damageEnemy(best, 12, false, null, false, 'drone'); try { tone(1400, 0.02, 0.02, 'square', 900, at(D.g.position.x, D.g.position.z, 18)); } catch (e) {} } else D.fire = 0.3; }
  if (D.t <= 0) { if (D.g.parent) D.g.parent.remove(D.g); HHG.drone = null; }
}
const _hhgRate = hhRate;
hhRate = function (st) { const r = _hhgRate.apply(this, arguments); try { const s = HH.cur ? HH.cur.s : null; if (s && s.hero === 'botanist') return r * 1.25; } catch (e) {} return r; };
const _hhgTD = hhTrapDmg;
hhTrapDmg = function (e, dmg, p) { const H = M && M.hh; if (H && H.hero === 'engineer') dmg *= 1.2; return _hhgTD.call(this, e, dmg, p); };
/* ---------- 38 outfits */
const HHG_OUT = { '': { n: 'STANDARD ISSUE' }, out1: { n: 'DIRT FARMER', s: 0x6a5232, g: 0x3a2a1a }, out2: { n: 'NEON BLOOM', s: 0x3a1a5a, g: 0x6aff5a }, out3: { n: 'NIGHT SHIFT', s: 0x1a1e2a, g: 0x0a0a0a }, out4: { n: 'GOLDEN LEAF', s: 0x8a6a1a, g: 0xd8b04a }, out5: { n: 'THE OVERGROWER', s: 0x2a5a2a, g: 0x5a3a7a } };
function hhgOutfit(on) {
  if (!VM.sleeve || !VM.glove) return; if (!HHG.vm) HHG.vm = { s: VM.sleeve.color.getHex(), g: VM.glove.color.getHex() };
  const s = on && HH.cur ? HH.cur.s : null, o = s && s.outfit && HHG_OUT[s.outfit] ? HHG_OUT[s.outfit] : null;
  VM.sleeve.color.setHex(o && o.s !== undefined ? o.s : HHG.vm.s); VM.glove.color.setHex(o && o.g !== undefined ? o.g : HHG.vm.g);
}
/* ---------- 39 gun mods, 40 ammo, 42 crew kit: the workbench */
const HHG_MODS = { mag: { n: 'EXTENDED MAG', d: '+50% magazine', cost: { metal: 25, scrap: 8 } }, scope: { n: 'SCOPE', d: '+25% headshot damage', cost: { metal: 20, wire: 2, battery: 1 } }, glue: { n: 'SAP-GLUE ROUNDS', d: 'every hit slows', cost: { sap: 6, scrap: 4 } } };
const HHG_AMMO = { fire: { n: 'FIRE ROUNDS', d: 'hits set burnouts alight', cost: { wood: 15, sap: 2 } }, shock: { n: 'SHOCK ROUNDS', d: 'a hit jumps to a second burnout', cost: { wire: 2, battery: 1 } }, sap: { n: 'SAP ROUNDS', d: 'hits slow burnouts down', cost: { sap: 3 } } };
const HHG_KIT = [null, { n: 'SCRAP KIT', cost: { metal: 40, scrap: 10 }, gun: 'smg' }, { n: 'FIELD KIT', cost: { metal: 80, scrap: 20, wire: 5 }, gun: 'ar' }, { n: 'HEAVY KIT', cost: { metal: 140, scrap: 30, battery: 5 }, gun: 'lmg' }];
const _hhgMD = hhMenuDo;
hhMenuDo = function (a, v) {
  const H = M.hh, s = H.s;
  if (a === 'gmod') { const g = s.arsenal[s.eq], m = HHG_MODS[v]; if (!g) { showMsg('EQUIP A CRAFTED GUN FIRST (LOBBY · WEAPON)'); return; } g.mods = g.mods || {}; if (m && !g.mods[v] && hhPay(s, m.cost)) { g.mods[v] = 1; try { showMsg(`FITTED · ${m.n}`); sfx.pickup(); } catch (e) {} } hhSave(s); hhMenuRender(); return; }
  if (a === 'ammo') { const m = HHG_AMMO[v]; s.ammo = s.ammo || {}; if (m && hhPay(s, m.cost)) { s.ammo[v] = (s.ammo[v] | 0) + 1; try { showMsg(`CRAFTED · ${m.n}`); sfx.pickup(); } catch (e) {} } hhSave(s); hhMenuRender(); return; }
  if (a === 'ckit') { const nx = HHG_KIT[(s.ckit | 0) + 1]; if (nx && hhPay(s, nx.cost)) { s.ckit = (s.ckit | 0) + 1; try { showMsg(`YOUR CREW GOT THE ${nx.n}`); sfx.pickup(); } catch (e) {} } hhSave(s); hhMenuRender(); return; }
  if ((a === 'trap' || a === 'trap5') && s.hero === 'engineer' && HH_TRAPS[v]) { const before = Object.assign({}, s.inv), r = _hhgMD.apply(this, arguments); for (const k in before) { const d = (before[k] | 0) - (s.inv[k] | 0); if (d > 0) s.inv[k] += Math.floor(d * 0.25); } hhSave(s); hhMenuRender(); return r; }
  return _hhgMD.apply(this, arguments);
};
const _hhgMR = hhMenuRender;
hhMenuRender = function () {
  _hhgMR.apply(this, arguments); if (HH.menu !== 'bench') return; const o = $('hhMenu'), H = M && M.hh; if (!o || !H) return; const s = H.s, box = o.querySelector('.hh-mbox'), acts = box && box.querySelector('.onb-acts'); if (!acts) return;
  const g = s.arsenal[s.eq], gm = (g && g.mods) || {}, btn = (act, txt, off) => `<button class="mini${off ? ' off' : ''}" data-hm="${act}"${off ? ' disabled' : ''}>${txt}</button>`, kit = HHG_KIT[(s.ckit | 0) + 1];
  const sec = document.createElement('div'); sec.className = 'hh-sec';
  sec.innerHTML = `<h4>GUN MODS · ${g ? HH_GUNS.find(x => x.id === g.id).n : 'NO CRAFTED GUN EQUIPPED'}</h4>${Object.entries(HHG_MODS).map(([k, m]) => `<div class="hh-li"><b>${m.n}</b><span>${m.d} · ${hhCostTxt(m.cost, s)}</span>${gm[k] ? '<span style="color:#7aff6a">FITTED</span>' : btn('gmod:' + k, 'FIT', !g || !hhHas(s, m.cost))}</div>`).join('')}
<h4>SPECIAL AMMO · ONE PACK A MISSION · PICK IT IN THE LOBBY</h4>${Object.entries(HHG_AMMO).map(([k, m]) => `<div class="hh-li"><b>${m.n} · ${(s.ammo || {})[k] | 0}</b><span>${m.d} · ${hhCostTxt(m.cost, s)}</span>${btn('ammo:' + k, 'CRAFT', !hhHas(s, m.cost))}</div>`).join('')}
<h4>CREW KIT · ${(s.ckit | 0) ? HHG_KIT[s.ckit].n : 'NONE'}</h4>${kit ? `<div class="hh-li"><b>${kit.n}</b><span>+15% crew damage and +25% crew health a level, a better gun · ${hhCostTxt(kit.cost, s)}</span>${btn('ckit', 'BUY', !hhHas(s, kit.cost))}</div>` : '<div class="hh-li"><span>your crew has the best kit</span></div>'}`;
  box.insertBefore(sec, acts);
};
/* ---------- 41 gadgets */
const HHG_GAD = { sprinkler: { n: 'HEAL SPRINKLER', d: 'heals you, your crew and the plant close to it for 15 s' }, grapple: { n: 'GRAPPLE HOOK', d: 'pulls you to where you aim (up to 25 m)' }, decoy: { n: 'DECOY PLANT', d: 'burnouts go for it instead for 12 s' } };
function hhgGadget() {
  const H = M && M.hh; if (!H || H.client || !playerAlive() || HH.build || HH.menu || G.state !== 'playing') return; const k = H.s.gadget || 'sprinkler', D = HHG_GAD[k];
  if (HHG.gad <= 0) { showMsg(`NO ${D.n}S LEFT THIS MISSION`); return; } const fx = -Math.sin(P.yaw) * Math.cos(P.pitch), fy = Math.sin(P.pitch), fz = -Math.cos(P.yaw) * Math.cos(P.pitch), ey = (P.y || 0) + 1.6;
  if (k === 'sprinkler') { if (HHG.spr && HHG.spr.g.parent) HHG.spr.g.parent.remove(HHG.spr.g); const g = new THREE.Group(), base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.2, 10), hhStd({ color: 0x2a5a8a, roughness: 0.5 })); base.position.y = 0.1; g.add(base);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6), hhStd({ color: 0x9aa0a8, metalness: 0.7 })); head.position.y = 0.45; g.add(head); const ring = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.5, 40), new THREE.MeshBasicMaterial({ color: 0x6ad8ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
    g.position.set(P.x, groundAt(P.x, P.z, (P.y || 0) + 0.6), P.z); H.grp.add(g); HHG.spr = { g, head, ring, t: 15, x: P.x, z: P.z }; }
  else if (k === 'grapple') { let x = P.x, y = ey, z = P.z, ok = null; for (let d = 0.5; d <= 25; d += 0.5) { const nx = P.x + fx * d, ny = ey + fy * d, nz = P.z + fz * d; const fl = groundAt(nx, nz, ny + 0.2); if (ny < fl || !gridClear(x, z, nx, nz, y - 0.5, ny - 0.5)) { ok = { x, y, z }; break; } x = nx; y = ny; z = nz; }
    if (!ok) { showMsg('NOTHING TO HOOK ONTO · AIM AT A WALL, A ROOF OR THE GROUND'); return; } const back = Math.hypot(ok.x - P.x, ok.z - P.z) || 1; ok.x -= (ok.x - P.x) / back * 0.6; ok.z -= (ok.z - P.z) / back * 0.6;
    HHG.grap = { x0: P.x, y0: P.y || 0, z0: P.z, x1: ok.x, y1: Math.max(groundAt(ok.x, ok.z, ok.y + 0.5), ok.y - 1.4), z1: ok.z, t: 0, T: Math.max(0.25, back / 30) }; try { tone(900, 0.15, 0.05, 'sawtooth', 300); } catch (e) {} }
  else { const d0 = 3.5, o = openNear(P.x + fx * d0, P.z + fz * d0), y = groundAt(o.x, o.z, (P.y || 0) + 0.6), g = hhPlantMesh(); g.scale.setScalar(0.55); g.position.set(o.x, y, o.z); H.grp.add(g);
    if (HHG.decoy && HHG.decoy.g.parent) HHG.decoy.g.parent.remove(HHG.decoy.g); const dc = { x: o.x, y, z: o.z, g, hp: 700, max: 700, t: 12, n: 'THE DECOY', hitT: 0 }; try { dc.field = flowField(o.x, o.z, y); } catch (e) {} HHG.decoy = dc;
    for (const e of H.mobs) if (Math.hypot(e.group.position.x - o.x, e.group.position.z - o.z) < 18) { e.obj = dc; e.tg = null; } }
  HHG.gad--; try { showMsg(`${D.n} · ${HHG.gad} LEFT`); } catch (e) {}
}
addEventListener('keydown', e => { if (e.code === bind('plate') && !e.repeat && M && M.hh && G.state === 'playing' && !curScreen && !HH.build && !HH.menu) { e.stopImmediatePropagation(); hhgGadget(); } }, true);
const _hhgPad = hhPadTick;
hhPadTick = function () { const was = HHG.padD; let gp = null; try { gp = (navigator.getGamepads ? [...navigator.getGamepads()] : []).find(g => g && g.connected); } catch (e) {} HHG.padD = !!(gp && gp.buttons[13] && gp.buttons[13].pressed);
  const H = M && M.hh; if (HHG.padD && !was && H && !H.client && !HH.build && !HH.menu && G.state === 'playing' && !curScreen) { const np = H.base && HH.nearPlot && !((H.s.base.plots[HH.nearPlot.key] || {}).st); if (!np) hhgGadget(); }
  return _hhgPad.apply(this, arguments); };
function hhgGadTick(H, dt) {
  const S0 = HHG.spr; if (S0) { S0.t -= dt; S0.head.rotation.y += dt * 8; const heal = 8 * dt; if (playerAlive() && Math.hypot(P.x - S0.x, P.z - S0.z) < 4.5) G.health = Math.min(G.maxHp || 100, G.health + heal);
    for (const e of enemies) if (e.entry && e.team === M.myTeam && Math.hypot(e.group.position.x - S0.x, e.group.position.z - S0.z) < 4.5) e.hp = Math.min(e.maxHp, e.hp + heal * 1.5);
    if (H.plant && Math.hypot(H.plant.x - S0.x, H.plant.z - S0.z) < 5) H.plant.hp = Math.min(H.plant.max, H.plant.hp + heal * 3);
    S0.ring.material.opacity = 0.2 + 0.2 * Math.sin(NOW * 6); S0.ring.scale.setScalar(0.96 + 0.04 * Math.sin(NOW * 6));
    if (S0.t <= 0) { if (S0.g.parent) S0.g.parent.remove(S0.g); HHG.spr = null; } }
  const R = HHG.grap; if (R) { R.t += dt; const k = Math.min(1, R.t / R.T), e = k * k * (3 - 2 * k); P.x = R.x0 + (R.x1 - R.x0) * e; P.z = R.z0 + (R.z1 - R.z0) * e; P.y = R.y0 + (R.y1 - R.y0) * e + Math.sin(k * Math.PI) * 1.2; P.vy = 0; P.vx = P.vz = 0; if (k >= 1) { HHG.grap = null; P.onGround = false; } }
  const D = HHG.decoy; if (D) { D.t -= dt; D.g.rotation.y += dt; if (D.t <= 0 || D.hp <= 0) { if (D.g.parent) D.g.parent.remove(D.g); for (const e of H.mobs) if (e.obj === D) e.obj = null; HHG.decoy = null; try { showMsg('THE DECOY IS GONE'); } catch (er) {} } }
}
/* ---------- 40 + 39 the shots */
const _hhgDmg = damageEnemy;
damageEnemy = function (e, dmg, head, dir, boom, by = 'player') {
  const H = M && M.hh, gunHit = e && e.hhMob && H && by === 'player' && !(G.meleeT > 0) && !boom;
  if (gunHit && H.gun && H.gun.mods && WEAPONS[G.cur] && WEAPONS[G.cur].def && WEAPONS[G.cur].def.id === H.gunId) { if (H.gun.mods.scope && head) dmg *= 1.25; if (H.gun.mods.glue) e.slowT = Math.max(e.slowT || 0, 0.8); }
  const r = _hhgDmg.call(this, e, dmg, head, dir, boom, by);
  if (gunHit && H.ammo) { if (H.ammo === 'fire') { e.burnT = 3; } else if (H.ammo === 'sap') e.slowT = Math.max(e.slowT || 0, 1.2); else if (H.ammo === 'shock' && !HHG.chain) { let best = null, bd = 5; for (const o of H.mobs) { if (o === e) continue; const d = o.group.position.distanceTo(e.group.position); if (d < bd) { bd = d; best = o; } }
      if (best) { HHG.chain = true; try { hhZapFx(e.group.position.clone().setY(e.group.position.y + 1.1), best.group.position.clone().setY(best.group.position.y + 1.1)); damageEnemy(best, dmg * 0.4, false, null, false, 'shock'); } catch (er) {} HHG.chain = false; } } }
  return r;
};
/* ---------- 43 the dog */
function hhgDogMake(H) {
  const rig = zdogRig(), root = rig.root; root.rotation.order = 'YXZ'; const o = openNear(P.x + 1.5, P.z + 1.5); root.position.set(o.x, groundAt(o.x, o.z, (P.y || 0) + 0.6), o.z); root.scale.setScalar(0.9); H.grp.add(root);
  const fur = [0xb8854a, 0x8a5a2a, 0xe8d0a0]; let i = 0; root.traverse(q => { if (q.isMesh && q.material && q.material.color && !q.userData.hitbox) { q.material = q.material.clone(); q.material.color.setHex(fur[i++ % 3]); if (q.material.emissive) q.material.emissive.setHex(0); } });
  for (const m of rig.hits) m.userData.enemy = null;
  HHG.dog = { rig, group: root, phase: 0, phase0: Math.random() * 6, atkT: 0, tgt: null, barkT: 0, sp: 0 };
}
function hhgDogTick(H, dt) {
  const D = HHG.dog; if (!D) return; const g = D.group.position; let tx = P.x + Math.sin(P.yaw + 2.2) * 2, tz = P.z + Math.cos(P.yaw + 2.2) * 2, run = 5.5;
  const L = (H.loot || []).filter(l => l.m.parent && Math.hypot(l.m.position.x - P.x, l.m.position.z - P.z) < 30); let best = null, bd = 25; for (const l of L) { const d = Math.hypot(l.m.position.x - g.x, l.m.position.z - g.z); if (d < bd) { bd = d; best = l; } }
  if (D.carry && D.carry.m.parent) { D.carry.m.position.set(g.x, g.y + 0.7, g.z); if (Math.hypot(P.x - g.x, P.z - g.z) < 1.4) { D.carry.m.position.set(P.x, D.carry.m.position.y, P.z); D.carry = null; try { tone(700, 0.08, 0.04, 'triangle', 900); } catch (e) {} } }
  else if (best) { tx = best.m.position.x; tz = best.m.position.z; run = 7; if (bd < 0.9) { D.carry = best; try { showMsg('BUDDY FETCHED SOMETHING'); } catch (e) {} } }
  const dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz); let sp = 0;
  if (d > 0.6) { if (d > 35) { const o = openNear(P.x + 1, P.z + 1); g.set(o.x, groundAt(o.x, o.z, (P.y || 0) + 0.6), o.z); } else { sp = Math.min(run, d * 2.5); let mx = dx / d, mz = dz / d; if (!gridClear(g.x, g.z, tx, tz, g.y, g.y)) { const nd = navDir(g.x, g.z, g.y); if (nd) { mx = nd[0]; mz = nd[1]; } }
    const q = { x: g.x + mx * sp * dt, z: g.z + mz * sp * dt }; resolve(q, 0.35, g.y); g.x = q.x; g.z = q.z; g.y = groundAt(g.x, g.z, g.y + 0.6); D.group.rotation.y = Math.atan2(mx, mz); } }
  D.sp += (sp - D.sp) * Math.min(1, dt * 6); try { animDog(D, dt, D.sp); } catch (e) {}
  if ((D.barkT -= dt) <= 0) { D.barkT = 0.8; for (const e of H.mobs) { const q = e.group.position; if (Math.hypot(q.x - g.x, q.z - g.z) < 13 && !e.dogSeen) { e.dogSeen = true; D.barkT = 5; D.atkT = 0.55; try { pingAdd({ kind: 'enemy', x: q.x, y: q.y + 1, z: q.z }, 'BUDDY', true); burst(0.06, 900, 0.1, 'bandpass', at(g.x, g.z, 25)); setTimeout(() => burst(0.06, 900, 0.08, 'bandpass', at(g.x, g.z, 25)), 140); } catch (er) {} break; } } }
  D.atkT = Math.max(0, D.atkT - dt);
}
/* ---------- 44 morale */
const hhgMorale = s => clamp(s.morale === undefined ? 50 : s.morale | 0, 0, 100);
const hhgMood = m => m >= 70 ? ['HAPPY', '#7aff6a'] : m <= 30 ? ['GRUMPY', '#ff6a5a'] : ['OK', '#ffd24a'];
/* ---------- mission start / every frame / end */
const _hhgSetup = hhSetup;
hhSetup = function () {
  const r = _hhgSetup.apply(this, arguments), H = M.hh; if (!H) return r; const s = H.s;
  HHG.gad = 2; HHG.drone = HHG.decoy = HHG.spr = HHG.grap = HHG.dog = null; HHG.started = false;
  if (!H.base && !H.client && s.ammoSel && (s.ammo || {})[s.ammoSel] > 0) { s.ammo[s.ammoSel]--; H.ammo = s.ammoSel; hhSave(s); }
  return r;
};
const _hhgTick = hhTick;
hhTick = function (dt) {
  const H = M && M.hh, r = _hhgTick.apply(this, arguments); if (!H || M.over) return r; const s = H.s;
  if (!HHG.started && H.placed) { HHG.started = true; hhgOutfit(true);
    if (s.dog && !H.client) try { hhgDogMake(H); } catch (e) {}
    const kit = s.ckit | 0, mo = hhgMorale(s), mk = mo >= 70 ? 1.1 : mo <= 30 ? 0.85 : 1;
    for (const e of enemies) if (e.entry && !e.entry.isPlayer && e.team === M.myTeam && !e.hcAv) { e.maxHp = (e.maxHp || 100) * (1 + 0.25 * kit); e.hp = e.maxHp; e.acc = (e.acc || 0.5) * mk; e.hhDmgK = (1 + 0.15 * kit) * (mo >= 90 ? 1.1 : 1); e.hhWork = mo >= 70 ? 1.3 : mo <= 30 ? 0.8 : 1;
      if (kit) try { const gd = hhGunDef(HH_GUNS.find(x => x.id === HHG_KIT[kit].gun)); botApplyGun(e, gd, {}); botGunVisual(e, gd, {}, null); } catch (er) {} }
    if (H.gun && H.gun.mods && H.gun.mods.mag) for (const w of WEAPONS) if (w.def && w.def.id === H.gunId) { w.magSize = Math.round(w.magSize * 1.5); w.ammo = w.magSize; }
    if (H.ammo) try { showMsg(`${HHG_AMMO[H.ammo].n} LOADED`); } catch (e) {} }
  try { hhgDroneTick(H, dt); hhgGadTick(H, dt); hhgDogTick(H, dt);
    for (const e of H.mobs) if (e.burnT > 0) { e.burnT -= dt; if ((e.burnK = (e.burnK || 0) - dt) <= 0) { e.burnK = 0.5; damageEnemy(e, 7, false, null, false, 'fire'); if (Math.random() < 0.6) try { chunks('spark', e.group.position.clone().setY(e.group.position.y + 1), 3, 2, 0.4); } catch (er) {} } }
    if (H.hero === 'botanist' && H.plant && playerAlive() && Math.hypot(P.x - H.plant.x, P.z - H.plant.z) < 6) H.plant.hp = Math.min(H.plant.max, H.plant.hp + H.plant.max * 0.02 * dt);
  } catch (e) {}
  return r;
};
// crew damage from the kit
const _hhgDmg2 = damageEnemy;
damageEnemy = function (e, dmg, head, dir, boom, by) { if (e && e.hhMob && by && typeof by === 'object' && by.hhDmgK) dmg *= by.hhDmgK; return _hhgDmg2.apply(this, [e, dmg, head, dir, boom, by]); };
const _hhgWork = hhCrewWork;
hhCrewWork = function (dt) { const k = (() => { for (const e of enemies) if (e.hhWork) return e.hhWork; return 1; })(); return _hhgWork.call(this, dt * k); };
const _hhgEnd = hhEnd;
hhEnd = function (won) { const H = M && M.hh, first = H && !H.over, r = _hhgEnd.apply(this, arguments); if (first) { const s = H.s; s.morale = clamp(hhgMorale(s) + (won ? 8 : -12), 0, 100); hhSave(s); } return r; };
const _hhgClr = hhClear;
hhClear = function () { hhgOutfit(false); HHG.drone = HHG.decoy = HHG.spr = HHG.grap = HHG.dog = null; return _hhgClr.apply(this, arguments); };
// the HUD line: gadget + ammo
const _hhgDT = hhDomTick;
hhDomTick = function () {
  const r = _hhgDT.apply(this, arguments), m = $('hhMats'), H = M && M.hh; if (!m || !H || H.client) return r; let t = m.querySelector('.hhg-l'); if (!t) { t = document.createElement('div'); t.className = 'hh-cost hhg-l'; m.appendChild(t); }
  const s = `${usingPad() ? 'D-PAD DOWN' : actName('plate')} ${HHG_GAD[H.s.gadget || 'sprinkler'].n} ×${HHG.gad}${H.ammo ? ' · ' + HHG_AMMO[H.ammo].n : ''}${HHG.dog ? ' · BUDDY' : ''}`; if (t.textContent !== s) t.textContent = s; return r;
};
/* ---------- the lobby */
const _hhgRender = hhRender;
hhRender = function () {
  const r = _hhgRender.apply(this, arguments), sel = $('lobSel'); if (!sel || !HHL.on) return r; const s = hhLoad(), mo = hhgMorale(s), md = hhgMood(mo), outs = ['', ...Object.keys(s.outfits || {}).filter(k => HHG_OUT[k])], am = s.ammoSel && HHG_AMMO[s.ammoSel] ? s.ammoSel : '';
  const crewFood = HH_STRAINS.filter(x => (s.buds[x.id] | 0) >= 5).length || (s.brownie | 0) > 0;
  sel.insertAdjacentHTML('beforeend', `<div class="cod-row hhg-row"><small>GADGET · 2 A MISSION · ${usingPad() ? 'D-PAD DOWN' : actName('plate')}</small><b>${HHG_GAD[s.gadget || 'sprinkler'].n}</b><span>${HHG_GAD[s.gadget || 'sprinkler'].d}</span><div class="arw"><button class="mini" data-act="hhg-gad">CHANGE</button></div></div>` +
    `<div class="cod-row hhg-row"><small>SPECIAL AMMO · ONE PACK A MISSION</small><b>${am ? `${HHG_AMMO[am].n} (${(s.ammo || {})[am] | 0} PACKS)` : 'NORMAL ROUNDS'}</b><span>craft packs at the WORKBENCH</span><div class="arw"><button class="mini" data-act="hhg-ammo">CHANGE</button></div></div>` +
    `<div class="cod-row hhg-row"><small>OUTFIT · ${outs.length - 1} UNLOCKED ON THE HORDE TRACK</small><b>${HHG_OUT[s.outfit || ''].n}</b><span>your sleeves and gloves in HORDE</span><div class="arw"><button class="mini" data-act="hhg-out"${outs.length > 1 ? '' : ' disabled'}>CHANGE</button></div></div>` +
    `<div class="cod-row hhg-row"><small>BUDDY THE DOG</small><b>${s.dog ? 'COMES ALONG' : 'STAYS HOME'}</b><span>fetches loot orbs, barks at burnouts</span><div class="arw"><button class="mini" data-act="hhg-dog">${s.dog ? 'LEAVE HIM' : 'TAKE HIM'}</button></div></div>` +
    `<div class="cod-row wide hhg-row"><small>CREW MORALE · ${mo} / 100 · CREW KIT ${(s.ckit | 0) ? HHG_KIT[s.ckit].n : 'NONE'}</small><b style="color:${md[1]}">${md[0]}</b><span>${mo >= 70 ? 'they shoot straighter and work faster' : mo <= 30 ? 'they shoot worse and work slower · feed them' : 'wins cheer them up · losses bring them down'}</span><div class="arw"><button class="mini" data-act="hhg-feed"${crewFood && mo < 100 ? '' : ' disabled'}>FEED THE CREW</button></div></div>`);
  return r;
};
const _hhgAct = hhAct;
hhAct = function (act) {
  if (!/^hhg-/.test(act) || !HHL.on) return _hhgAct.apply(this, arguments); const s = hhLoad(); try { sfx.ui(); } catch (e) {}
  const cyc = (L, v) => L[(L.indexOf(v) + 1) % L.length];
  if (act === 'hhg-gad') s.gadget = cyc(Object.keys(HHG_GAD), s.gadget || 'sprinkler');
  else if (act === 'hhg-ammo') s.ammoSel = cyc(['', ...Object.keys(HHG_AMMO).filter(k => (s.ammo || {})[k] > 0)], s.ammoSel || '');
  else if (act === 'hhg-out') s.outfit = cyc(['', ...Object.keys(s.outfits || {}).filter(k => HHG_OUT[k])], s.outfit || '');
  else if (act === 'hhg-dog') s.dog = s.dog ? 0 : 1;
  else if (act === 'hhg-feed') { const b = HH_STRAINS.find(x => (s.buds[x.id] | 0) >= 5); if (b) s.buds[b.id] -= 5; else if ((s.brownie | 0) > 0) s.brownie--; else return true; s.morale = Math.min(100, hhgMorale(s) + 15); try { showMsg(b ? `THE CREW ATE 5 ${b.n} BUDS · MORALE UP` : 'THE CREW SHARED A BROWNIE · MORALE UP'); } catch (e) {} }
  hhSave(s); hhRender(`[data-act="${act}"]`); return true;
};
