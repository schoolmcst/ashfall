/* ================================================================== HOTBOX HORDE: BURNOUTS 2 (1.2.105, the owner's list 29-35)
   SHIELD BEARERS (a steel door in front: 85% less damage from the front - flank them), THROWERS (lob rocks at your walls
   from 16 m), NESTS (a purple pod on every rift in DEFEND missions and raids: shoot it and that rift closes; all closed =
   the wave dries up), mini-bosses THE BIG BAKED (wave 3: huge, smashes walls) and THE COUGHER (wave 4: a choking cough that
   hurts walls and people round it), ELITES (one in ten from wave 2, gold smoke: FAST, ARMOURED or REGENERATING), THE ROOT
   KING (the boss of the raid to base level 5: roots slow you, he calls burnouts out of the ground) and LOOT ORBS (killed
   burnouts sometimes drop a glowing orb: crafting materials or a seed packet; walk over it). */
Object.assign(HH_KINDS, {
  shield: { n: 'SHIELD BEARER', hp: 220, sp: [1.3, 1.6], dmg: 16, bdmg: 30, sc: 1.1, shield: 1, tint: 0x5a5a6a },
  thrower: { n: 'THROWER', hp: 130, sp: [1.5, 1.8], dmg: 14, bdmg: 60, sc: 1.05, spit: 1, throw: 1, tint: 0x6a5a3a },
  bigbaked: { n: 'THE BIG BAKED', hp: 1800, sp: [1.0, 1.1], dmg: 40, bdmg: 190, sc: 1.6, mini: 1, tint: 0x5a4a6a },
  cougher: { n: 'THE COUGHER', hp: 1300, sp: [1.2, 1.3], dmg: 25, bdmg: 50, sc: 1.35, mini: 1, cough: 1, tint: 0x4a7a3a },
  rootking: { n: 'THE ROOT KING', hp: 9000, sp: [1.0, 1.1], dmg: 55, bdmg: 260, sc: 2.2, boss: 1, root: 1, tint: 0x4a3a1a },
});
const HH_ELITES = { fast: { n: 'FAST', c: 0xffd24a }, armor: { n: 'ARMOURED', c: 0xc8c8ff }, regen: { n: 'REGEN', c: 0x7aff8a } };
// the waves: shield bearers and throwers from wave 2, the mini-bosses, the root king
const _hhWL5 = hhWaveList;
hhWaveList = function (w) {
  const H = M.hh, out = _hhWL5.apply(this, arguments);
  for (let i = 0; i < out.length; i++) if (out[i] === 'burnout') { const r = Math.random(); if (w >= 2 && r < 0.1) out[i] = 'shield'; else if (w >= 2 && r < 0.18) out[i] = 'thrower'; }
  if (w === 3 && H.waves >= 3) out.splice(Math.floor(out.length * 0.6), 0, 'bigbaked');
  if (w === 4 && H.waves >= 4) out.splice(Math.floor(out.length * 0.6), 0, 'cougher');
  if (H.raid && H.raid.to >= 5 && w === H.waves) { const i = out.indexOf('boss'); if (i >= 0) out[i] = 'rootking'; else out.push('rootking'); }
  return out;
};
const _hhMob5 = hhMob;
hhMob = function (kind, x, z, y) {
  const e = _hhMob5.apply(this, arguments), K = e.K, H = M.hh;
  if (K.shield) { const pl = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.3, 0.08), hhStd({ color: 0x7a8088, metalness: 0.8, roughness: 0.35 })); pl.position.set(0, 1.0, 0.45); e.group.add(pl); const st = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.1), hhStd({ color: 0x111111, emissive: 0xffaa3a, emissiveIntensity: 1.2 })); st.position.set(0, 1.4, 0.5); e.group.add(st); }
  if (K.mini || kind === 'rootking') { e.boss = false; try { showBanner(K.n, kind === 'bigbaked' ? 'a mini-boss · it smashes walls' : kind === 'cougher' ? 'a mini-boss · stay out of its cough' : 'the king of the burnouts · his roots slow you down'); tone(55, 1.8, 0.18, 'sawtooth', 35); } catch (er) {} e.puff.scale.setScalar(2.2); }
  if (K.root) { const bark = hhStd({ color: 0x4a3018, roughness: 0.95 }); for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.1, 5), bark); const a = i / 6 * TAU; r.position.set(Math.cos(a) * 0.35, 0.3, Math.sin(a) * 0.35); r.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); e.group.add(r); } const crown = hhLeaf(hhStd({ color: 0x5aaf3a, emissive: 0x1a4a0a, side: THREE.DoubleSide }), 0.5); crown.position.y = 1.95; crown.rotation.x = -Math.PI / 2; e.group.add(crown); }
  if (!K.boss && !K.mini && H.wave >= 2 && Math.random() < 0.1) { const t = ['fast', 'armor', 'regen'][(Math.random() * 3) | 0]; e.elite = t; e.puff.material.color.setHex(HH_ELITES[t].c); e.puff.scale.setScalar(1.3); if (t === 'fast') e.speed *= 1.6; if (t === 'armor') { e.hp *= 2; e.maxHp *= 2; } }
  return e;
};
/* ---------- damage: shields, nests */
const _hhDmg5 = damageEnemy;
damageEnemy = function (e, dmg, head, dir, boom, by) {
  if (e && e.nest) return hhNestHit(e, dmg, by);
  if (e && e.hhMob && e.K.shield && by && by !== 'world') { const g = e.group.position, src = by === 'player' ? P : by.group ? by.group.position : null; if (src) { const fx = Math.sin(e.group.rotation.y), fz = Math.cos(e.group.rotation.y), dx = src.x - g.x, dz = src.z - g.z, L = Math.hypot(dx, dz) || 1; if ((fx * dx + fz * dz) / L > 0.45) { dmg *= 0.15; if (by === 'player' && (!e.tingT || NOW - e.tingT > 0.15)) { e.tingT = NOW; try { tone(rnd(1800, 2400), 0.05, 0.04, 'triangle', 1200); } catch (er) {} } } } }
  const res = _hhDmg5.apply(this, [e, dmg, head, dir, boom, by]);
  if (e && e.hhMob && !enemies.includes(e) && !e.lootDone && M && M.hh) { e.lootDone = true; if (Math.random() < 0.12) hhLootDrop(e.group.position); }
  return res;
};
function hhLootDrop(g) { const H = M.hh, seed = Math.random() < 0.15, k = seed ? 'seed' : HH_CMATS[(Math.random() * HH_CMATS.length) | 0], m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: seed ? 0x7aff6a : 0xffd24a })); m.position.set(g.x, groundAt(g.x, g.z, g.y + 0.6) + 0.5, g.z); H.grp.add(m); (H.loot = H.loot || []).push({ m, k, t: 0 }); }
/* ---------- NESTS on the rifts */
function hhNestMake(R) {
  const H = M.hh, g = new THREE.Group(), o = openNear(R.x + 2.2, R.z + 1), y = groundAt(o.x, o.z, R.y + 0.6); g.position.set(o.x, y, o.z); H.grp.add(g);
  const pod = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), hhStd({ color: 0x3a1a4a, emissive: 0x7a2aff, emissiveIntensity: 0.6, roughness: 0.6, flatShading: true })); pod.position.y = 0.85; pod.scale.set(1, 1.3, 1); g.add(pod);
  for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.0, 5), hhStd({ color: 0x2a1030, roughness: 0.9 })); const a = i / 5 * TAU; t.position.set(Math.cos(a) * 0.7, 0.3, Math.sin(a) * 0.7); t.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); g.add(t); }
  const hp = Math.round(900 * H.D.hp), e = { nest: true, R, group: g, team: 9, hp, maxHp: hp, entry: null, rig: { root: g, hits: [pod], head: pod, torso: pod, flash: { visible: false, material: {} } }, pod, K: { n: 'NEST' } };
  pod.userData.enemy = e; enemies.push(e); R.nest = e; return e;
}
function hhNestHit(e, dmg, by) {
  if (!enemies.includes(e)) return false; e.hp -= dmg; e.pod.material.emissiveIntensity = 2; setTimeout(() => { if (e.pod) e.pod.material.emissiveIntensity = 0.6; }, 80);
  if (by === 'player') try { sfx.hit && sfx.hit(); } catch (er) {}
  if (e.hp > 0) return false;
  enemies.splice(enemies.indexOf(e), 1); if (e.group.parent) e.group.parent.remove(e.group); e.R.closed = true; e.R.nest = null; if (e.R.g) e.R.g.visible = false;
  const H = M.hh; if (H) { hhGive('scrap', 4); hhGive(HH_CMATS[(Math.random() * HH_CMATS.length) | 0], 3); }
  try { explosionFx({ x: e.group.position.x, y: e.group.position.y + 1, z: e.group.position.z }, 1); showBanner('NEST DESTROYED', H && H.rifts.every(r => r.closed) ? 'every rift is closed · finish the ones that are out' : 'that rift is closed · +scrap'); sfx.streak(); } catch (er) {}
  return true;
}
function hhNestsClear(H) { for (const R of H.rifts) { if (R.nest) { const i = enemies.indexOf(R.nest); if (i >= 0) enemies.splice(i, 1); if (R.nest.group.parent) R.nest.group.parent.remove(R.nest.group); R.nest = null; } R.closed = false; } }
function hhPickRift(H) { const open = H.rifts.filter(r => !r.closed); if (!open.length) return null; return open[(H.toSpawn + H.wave) % open.length]; }
const _hhSetup5 = hhSetup;
hhSetup = function () { const r = _hhSetup5.apply(this, arguments), H = M.hh; if (H && H.kind === 'defend') for (const R of H.rifts) hhNestMake(R); return r; };
const _hhRS5 = hhRaidStart;
hhRaidStart = function () { const r = _hhRS5.apply(this, arguments), H = M.hh; if (H && H.raid) { hhNestsClear(H); for (const R of H.rifts) hhNestMake(R); } return r; };
const _hhRE5 = hhRaidEnd;
hhRaidEnd = function (won) { const H = M.hh; if (H) hhNestsClear(H); return _hhRE5.apply(this, arguments); };
/* ---------- every frame: coughs, roots, regen, loot orbs */
const _hhTick5 = hhTick;
hhTick = function (dt) {
  const r = _hhTick5.apply(this, arguments), H = M.hh; if (!H || M.over) return r;
  for (const e of H.mobs) {
    if (e.elite === 'regen') e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.03 * dt);
    if (e.K.cough && (e.coughT = (e.coughT || 3) - dt) <= 0) { e.coughT = 4; const g = e.group.position; try { for (let i = 0; i < 8; i++) chunks('dust', new THREE.Vector3(g.x + rnd(-1.5, 1.5), g.y + 1.5, g.z + rnd(-1.5, 1.5)), 2, 1.5, 0.8); burst(0.5, 300, 0.15, 'lowpass', at(g.x, g.z, 30)); } catch (er) {}
      for (const p of H.pieces.slice()) if (!p.trap && Math.hypot(p.cx - g.x, p.cz - g.z) < 3.5) hhPieceHit(p, 40); if (playerAlive() && Math.hypot(P.x - g.x, P.z - g.z) < 3.5) try { hurtPlayer(15, g.x, g.z); } catch (er) {} if (H.plant && Math.hypot(H.plant.x - g.x, H.plant.z - g.z) < 3.5) hhPlantHit(30); }
    if (e.K.root) { const g = e.group.position; if (playerAlive() && Math.hypot(P.x - g.x, P.z - g.z) < 6) { P.vx *= 0.9; P.vz *= 0.9; showMsgOnce('THE ROOTS ARE HOLDING YOU'); }
      if ((e.callT = (e.callT || 6) - dt) <= 0 && H.mobs.length < 30) { e.callT = 8; for (let i = 0; i < 3; i++) { const a = Math.random() * TAU, o = openNear(g.x + Math.cos(a) * 3, g.z + Math.sin(a) * 3); hhMob('burnout', o.x, o.z, groundAt(o.x, o.z, g.y + 0.6)); } try { burst(0.6, 200, 0.2, 'lowpass', at(g.x, g.z, 35)); } catch (er) {} } }
  }
  // loot orbs from the dead
  H.loot = H.loot || [];
  for (let i = H.loot.length - 1; i >= 0; i--) { const L = H.loot[i]; L.t += dt; L.m.position.y += Math.sin(NOW * 3 + i) * 0.003; L.m.rotation.y += dt * 2;
    if (playerAlive() && Math.hypot(L.m.position.x - P.x, L.m.position.z - P.z) < 1.6) { if (L.k === 'seed') { const sd = ['haze', 'blue', 'north'][(Math.random() * 3) | 0]; H.s.seeds[sd] = (H.s.seeds[sd] | 0) + 1; H.got['seed:' + sd] = (H.got['seed:' + sd] | 0) + 1; showMsg(`+1 ${HH_STR(sd).n} SEED`); } else { const n = 2 + ((Math.random() * 3) | 0); hhGive(L.k, n); showMsg(`+${n} ${HH_CMAT[L.k].n}`); } try { sfx.pickup(); } catch (er) {} if (L.m.parent) L.m.parent.remove(L.m); H.loot.splice(i, 1); continue; }
    if (L.t > 60) { if (L.m.parent) L.m.parent.remove(L.m); H.loot.splice(i, 1); } }
  return r;
};
// names over the big ones, ELITE tags, nests
const _hhMk5 = hhMarkers;
hhMarkers = function (out) {
  _hhMk5(out); const H = M.hh; if (!H) return;
  for (const e of H.mobs) { const g = e.group.position, d = Math.hypot(g.x - P.x, g.z - P.z); if ((e.K.mini || e.K.root) && d < 60) out.push({ x: g.x, y: g.y + 2.2 * e.K.sc + 0.6, z: g.z, t: `${e.K.n} ${Math.max(0, Math.round(e.hp / e.maxHp * 100))}%`, c: '#ff8a4a' }); else if (e.elite && d < 25) out.push({ x: g.x, y: g.y + 2.4, z: g.z, t: `ELITE · ${HH_ELITES[e.elite].n}`, c: '#' + HH_ELITES[e.elite].c.toString(16).padStart(6, '0') }); }
  for (const R of H.rifts) if (R.nest) out.push({ x: R.nest.group.position.x, y: R.nest.group.position.y + 2.6, z: R.nest.group.position.z, t: `NEST ${Math.max(0, Math.round(R.nest.hp / R.nest.maxHp * 100))}%`, c: '#c070ff' });
  for (const L of H.loot || []) if (Math.hypot(L.m.position.x - P.x, L.m.position.z - P.z) < 20) out.push({ x: L.m.position.x, y: L.m.position.y + 0.5, z: L.m.position.z, t: L.k === 'seed' ? 'SEED' : 'LOOT', c: L.k === 'seed' ? '#7aff6a' : '#ffd24a' });
};
// thrower rocks look like rocks
const _hhSp5 = hhSpit;
hhSpit = function (e, T) { _hhSp5.apply(this, arguments); const H = M.hh, q = H.spits[H.spits.length - 1]; if (q && q.rock) { q.s.material.color.setHex(0x8a8070); q.s.material.blending = THREE.NormalBlending; q.s.scale.setScalar(0.45); q.T = 1.2; } };
