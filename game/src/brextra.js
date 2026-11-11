/* ================================================================== LAST TOKE: WEED DECOY, END-OF-ROUND AWARDS, THE JOINT REVIVE (1.2.95)
   WEED DECOY (a throwable in the floor loot): where it lands a see-through green smoke copy of a soldier gets up and
     runs the way you threw it for 8 s. Bots near it think it's you: they turn and fire at it (no damage), then it
     bursts into smoke.
   AWARDS on the LAST TOKE results: MOST DAMAGE, BEST LANDING (the quickest first kill after landing), LOOT GOBLIN (the
     most things picked up: crates, floor loot, stash boxes) and, when the winner never fired a killing shot, PACIFIST.
   THE NIGHTBLOOM REVIVE (a made-up drug): reviving a squadmate you hold a glowing purple flower that only grows in the
     Nightshade cloud; your hand crushes it and its pollen drifts into their face; they twitch harder and harder, then
     jolt up in a burst of purple sparks and a zap. When a bot gets you up: purple sparkle, a heartbeat that speeds up,
     a white-purple flash. */
const BRX = { puppets: [], dmg: new Map(), loot: new Map(), joint: null, haze: 0 };
EQUIP.puppet = { name: 'WEED DECOY', desc: 'A smoke copy of a soldier runs off where it lands and draws the bots\' fire for 8 s.', count: 2, max: 3, fuse: 0.9, color: 0x3a6a2a, glow: 0x8aff6a, brOnly: true };
if (typeof BRFG_THROW !== 'undefined') BRFG_THROW.puppet = { n: 'WEED DECOY', col: 0x8aff6a };
/* ---------- the decoy */
function brxPuppet(p, yaw) {
  const r = cloneSoldier('scout'); if (r.gun) r.gun.visible = true;
  const mat = new THREE.MeshStandardMaterial({ color: 0x9aff8a, emissive: 0x2a6a1a, emissiveIntensity: 0.6, transparent: true, opacity: 0.45, depthWrite: false });
  r.root.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = false; } }); r.root.rotation.order = 'YXZ';
  const y = groundAt(p.x, p.z, (p.y || 0) + 1); r.root.position.set(p.x, y, p.z); r.root.rotation.y = yaw; scene.add(r.root);
  BRX.puppets.push({ r, x: p.x, z: p.z, y, yaw, t: 0, life: 8, ph: 0, shotT: 0 });
  try { sfx.thud({ vol: 0.5 }); burst(0.6, 1200, 0.06, 'lowpass'); } catch (e) {}
}
const _brxDet = detonate;
detonate = function (g) { if (g.kind === 'puppet') { const p = g.m.position.clone(); brxPuppet(p, P.yaw + Math.PI); return; } return _brxDet(g); };
function brxPuppetTick(dt) {
  for (let i = BRX.puppets.length - 1; i >= 0; i--) {
    const q = BRX.puppets[i], r = q.r; q.t += dt; q.ph += dt * 9;
    const fx = Math.sin(q.yaw), fz = Math.cos(q.yaw), pos = { x: q.x + fx * 4.5 * dt, z: q.z + fz * 4.5 * dt, _ox: q.x, _oz: q.z };
    resolve(pos, 0.4, q.y, true); if (Math.hypot(pos.x - q.x - fx * 4.5 * dt, pos.z - q.z - fz * 4.5 * dt) > 0.01) q.yaw += 1.2;   // a wall: turn away
    q.x = pos.x; q.z = pos.z; q.y = groundAt(q.x, q.z, q.y + 0.5); r.root.position.set(q.x, q.y, q.z); r.root.rotation.y = q.yaw;
    const s = Math.sin(q.ph); r.legL.rotation.x = s * 0.7; r.legR.rotation.x = -s * 0.7; r.armL.rotation.x = -0.9 - s * 0.2; r.armR.rotation.x = -1.0 + s * 0.2;
    // the bots near it shoot at it
    if ((q.shotT -= dt) <= 0) { q.shotT = 0.22;
      for (const e of enemies) { if (!e.entry || e.net || e.downed || e.brFloat || (e.tgt && e.tgt !== 'P')) continue; const g = e.group.position, d = Math.hypot(g.x - q.x, g.z - q.z); if (d > 38 || Math.random() > 0.35) continue;
        e.group.rotation.y = Math.atan2(q.x - g.x, q.z - g.z); e.lkp = { x: q.x, z: q.z, y: q.y }; e.lkpT = M.t;
        try { const from = enemyMuzzle(e, new THREE.Vector3()), to = new THREE.Vector3(q.x + rnd(-0.6, 0.6), q.y + rnd(0.8, 1.6), q.z + rnd(-0.6, 0.6)); addTracer(from, to, 0.05, 0.02); e.rig.flash.visible = true; e.flashT = 0.06; sfx.enemy(at(g.x, g.z, 20)); } catch (er) {} } }
    if (Math.random() < dt * 10) try { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0xb8ffb0, transparent: true, opacity: 0.5, depthWrite: false })); sp.position.set(q.x, q.y + 1, q.z); sp.scale.setScalar(0.7); scene.add(sp); setTimeout(() => scene.remove(sp), 900); } catch (e) {}
    if (q.t >= q.life) { scene.remove(r.root); BRX.puppets.splice(i, 1); try { brsqPuff(q.x, q.y + 1, q.z, 10); } catch (e) {} }
  }
}
/* ---------- awards: what everyone did this round */
const brxAdd = (map, en, n) => { if (en) map.set(en, (map.get(en) || 0) + n); };
const _brxDmg = damageEnemy;
damageEnemy = function (e, dmg, head, dir, boom, by = 'player') {
  const hp0 = e && e.hp, r = _brxDmg(e, dmg, head, dir, boom, by);
  try { if (M && M.br && e && e.entry && dmg > 0) { const done = e.net ? dmg : Math.max(0, Math.min(dmg, (hp0 || 0) - Math.max(0, e.hp || 0))) || (r ? hp0 : 0); brxAdd(BRX.dmg, by === 'player' ? M.me : by && by.entry ? by.entry : null, done || 0); } } catch (er) {}
  return r;
};
const _brxOpen = brOpen;
brOpen = function (c, who) { const was = c.open; const r = _brxOpen(c, who); if (!was && c.open) brxAdd(BRX.loot, who === 'player' ? M.me : who && who.entry, 1); return r; };
const _brxTake = brlTake;
brlTake = function (it) { const was = it.gone; const r = _brxTake(it); if (!was && it.gone) brxAdd(BRX.loot, M.me, 1); return r; };
const _brxBox = briBoxTake;
briBoxTake = function (b, i) { const was = b.items[i] && b.items[i].t; const r = _brxBox(b, i); if (!was && b.items[i] && b.items[i].t) brxAdd(BRX.loot, M.me, 1); return r; };
function brxAwards() {
  if (!M || !M.br) return []; const out = [], name = en => en ? (en.isPlayer ? 'YOU' : en.name) : '-';
  let best = null, bd = 0; for (const [en, d] of BRX.dmg) if (d > bd) { bd = d; best = en; } if (best) out.push(['MOST DAMAGE', name(best), Math.round(bd) + ' damage']);
  let land = null, lt = 1e9; for (const en of M.entries) if (en.landT !== undefined && en.firstKillT !== undefined && en.firstKillT >= en.landT && en.firstKillT - en.landT < lt) { lt = en.firstKillT - en.landT; land = en; } if (land) out.push(['BEST LANDING', name(land), `a kill ${Math.round(lt)} s after landing`]);
  let gob = null, gn = 0; for (const [en, n] of BRX.loot) if (n > gn) { gn = n; gob = en; } if (gob) out.push(['LOOT GOBLIN', name(gob), gn + ' things picked up']);
  const B = M.br, win = B.place === 1 ? M.me : (M.entries.find(en => en.alive !== false && !en.isPlayer && (!M.squad || M.squad < 2)) || null); if (win && (win.kills | 0) === 0 && (B.place === 1 || brAliveBots().length === 1)) out.push(['PACIFIST', name(win), 'won without a kill']);
  return out;
}
const _brxRes = showResults;
showResults = function (winner, won) {
  const r = _brxRes.apply(this, arguments);
  try { const a = brxAwards(); if (a.length) { const el = $('resBoard'); el.insertAdjacentHTML('afterbegin', `<div class="brx-aw">${a.map(([t, n, d]) => `<div><small>${t}</small><b>${n}</b><span>${d}</span></div>`).join('')}</div>`); } } catch (e) {}
  return r;
};
/* ---------- the NIGHTBLOOM revive (a made-up drug: a glowing purple flower that only grows in the Nightshade cloud) */
function brxBloomMesh() {
  const g = new THREE.Group(), glow = new THREE.MeshBasicMaterial({ color: 0xb04aff }), core = new THREE.MeshStandardMaterial({ color: 0xff9aff, emissive: 0xff7aff, emissiveIntensity: 3 }), stem = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.8 }), hand = new THREE.MeshStandardMaterial({ color: 0xc89a78, roughness: 0.8 });
  const flower = new THREE.Group(); g.add(flower); g.userData.flower = flower;
  for (let i = 0; i < 6; i++) { const pe = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), glow); const a = i / 6 * TAU; pe.scale.set(1, 0.35, 2); pe.position.set(Math.cos(a) * 0.014, 0.004, Math.sin(a) * 0.014); pe.rotation.y = -a; flower.add(pe); }
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 6), core); c.position.y = 0.008; flower.add(c); g.userData.core = c;
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.05, 6), stem); st.position.y = -0.025; flower.add(st);
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.018, 0.05), hand); palm.position.y = -0.03; g.add(palm); g.userData.palm = palm;
  const fingers = []; for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.035, 0.01), hand); f.position.set(-0.02 + i * 0.013, -0.012, 0.024); g.add(f); fingers.push(f); } g.userData.fingers = fingers;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0xc070ff, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.6, depthWrite: false })); halo.scale.setScalar(0.09); halo.position.y = 0.006; flower.add(halo); g.userData.halo = halo;
  g.scale.setScalar(1.7); return g;
}
// purple glitter (pollen in the air, sparks on the jolt)
function brxSparks(x, y, z, n, spread, toward) {
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: Math.random() < 0.5 ? 0xb04aff : 0xe07aff, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9, depthWrite: false })); s.position.set(x + rnd(-spread, spread), y + rnd(-spread, spread), z + rnd(-spread, spread)); s.scale.setScalar(rnd(0.06, 0.16)); scene.add(s);
    const v = toward ? { x: (toward.x - s.position.x) * 1.2 + rnd(-0.3, 0.3), y: (toward.y - s.position.y) * 1.2 + rnd(-0.2, 0.3), z: (toward.z - s.position.z) * 1.2 + rnd(-0.3, 0.3) } : { x: rnd(-2.5, 2.5), y: rnd(0.5, 3), z: rnd(-2.5, 2.5) };
    BRX.sparks = BRX.sparks || []; BRX.sparks.push({ s, v, t: 0, life: toward ? 0.9 : 0.7 }); }
}
function brxSparkTick(dt) { const L = BRX.sparks || []; for (let i = L.length - 1; i >= 0; i--) { const p = L[i]; p.t += dt; p.s.position.x += p.v.x * dt; p.s.position.y += p.v.y * dt; p.s.position.z += p.v.z * dt; p.s.material.opacity = 0.9 * (1 - p.t / p.life); if (p.t >= p.life) { scene.remove(p.s); L.splice(i, 1); } } }
// the jolt when someone comes back (from sqBotUp / sqPlayerUp)
function brxBloomUp(x, y, z, me) {
  brxSparks(x, y, z, 26, 0.3, null); try { tone(180, 0.25, 0.08, 'sawtooth', 900); burst(0.15, 4000, 0.07, 'highpass'); } catch (e) {}
  if (me) { const f = $('brxFlash'); if (f) { f.style.transition = 'none'; f.style.opacity = 0.85; requestAnimationFrame(() => { f.style.transition = 'opacity .8s'; f.style.opacity = 0; }); } }
}
function brxReviveTick(dt) {
  brxSparkTick(dt);
  const mine = typeof SQ !== 'undefined' && SQ.revT > 0 && SQ.revWho && SQ.revWho.downed, helper = G.downed ? enemies.find(e => e.team === M.myTeam && !e.downed && e.revT > 0.05 && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 1.9) : null, helped = !!helper;
  const on = playerAlive() && (mine || helped), REV = typeof SQ_REVIVE !== 'undefined' ? SQ_REVIVE : 2.4, pr = mine ? SQ.revT / REV : helped ? helper.revT / REV : 0;
  if (on && !BRX.joint) { BRX.joint = brxBloomMesh(); scene.add(BRX.joint);   // in the world just in front of the camera (the gun's own view washes its colours out)
    BRX.jT = 0; BRX.pollenT = 0; BRX.beatT = 0; }
  if (BRX.joint) {
    BRX.jT += dt; const J = BRX.joint, U = J.userData, k = Math.min(1, BRX.jT / 0.35);
    if (!on) { if (J.parent) J.parent.remove(J); BRX.joint = null; try { const gun = gunObjs[G.cur]; if (gun) gun.visible = true; } catch (e) {} }
    else {
      try { const gun = gunObjs[G.cur]; if (gun) gun.visible = false; } catch (e) {}
      if (mine) J.position.set(0.03, -0.11 + 0.04 * k, -0.27 - 0.06 * k); else J.position.set(0.3 - 0.22 * k, -0.08, -0.25);
      J.userData.local = J.position.clone();
      // 1: the flower pulses in the open hand; 2: the hand closes and crushes it; 3: pollen drifts out
      const crush = clamp((pr - 0.35) / 0.3, 0, 1), pulse = 1 + Math.sin(NOW * 9) * 0.12;
      U.flower.scale.setScalar(Math.max(0.05, (1 - crush * 0.9) * pulse)); U.core.material.emissiveIntensity = 3 + Math.sin(NOW * 9) * 1.5 + crush * 3; U.halo.material.opacity = 0.45 + Math.sin(NOW * 9) * 0.2 + crush * 0.3;
      U.fingers.forEach((f, i) => { f.rotation.x = -1.4 * crush; f.position.y = -0.012 + 0.02 * crush; });
      J.rotation.set(-0.2 * crush, 0.3, Math.sin(NOW * 2) * 0.04); camera.updateMatrixWorld(); J.quaternion.copy(camera.quaternion).multiply(new THREE.Quaternion().setFromEuler(J.rotation)); J.position.copy(J.userData.local).applyQuaternion(camera.quaternion).add(camera.position);
      if (mine && crush > 0.6 && (BRX.pollenT -= dt) <= 0) { BRX.pollenT = 0.08; const t = SQ.revWho.group.position; const hp = new THREE.Vector3(); J.getWorldPosition(hp); try { const c = camera.position, d = new THREE.Vector3(t.x, t.y + 0.4, t.z); brxSparks(c.x + (d.x - c.x) * 0.25, c.y - 0.3, c.z + (d.z - c.z) * 0.25, 3, 0.1, d); } catch (e) {} }
    }
  }
  // the downed squadmate: twitches harder as the pollen hits, then lifts its head
  if (mine) { const r = SQ.revWho.rig, e = SQ.revWho; if (r) { const tw = clamp((pr - 0.5) / 0.5, 0, 1); r.head.rotation.x = -0.5 * tw + Math.sin(NOW * 40) * 0.08 * tw; r.armR.rotation.set(-0.4 - Math.sin(NOW * 31) * 0.5 * tw, 0, -0.3); r.armL.rotation.set(-0.4 + Math.sin(NOW * 27) * 0.5 * tw, 0, 0.3); e.group.rotation.z = Math.sin(NOW * 35) * 0.04 * tw; } }
  // a bot getting me up: purple sparkle, a heartbeat
  BRX.haze = lerp(BRX.haze, helped ? 0.3 + pr * 0.4 : 0, clamp(dt * 3, 0, 1)); const h = $('brxHaze'); if (h) h.style.opacity = BRX.haze.toFixed(3);
  if (helped && (BRX.beatT -= dt) <= 0) { BRX.beatT = Math.max(0.35, 0.9 - pr * 0.55); try { tone(55, 0.14, 0.15, 'sine', 40); } catch (e) {} if (Math.random() < 0.7) brxSparks(P.x + rnd(-0.6, 0.6), P.y + 1.5, P.z + rnd(-0.6, 0.6), 2, 0.2, null); }
}
/* ---------- every frame (from brUpdate) and the round's start */
function brxTick(dt) {
  if (!M || !M.br) return; brxPuppetTick(dt); brxReviveTick(dt);
  for (const en of M.entries) if ((en.kills | 0) > 0 && en.firstKillT === undefined) en.firstKillT = M.t;
}
function brxSetup() { for (const q of BRX.puppets) scene.remove(q.r.root); BRX.puppets = []; BRX.dmg.clear(); BRX.loot.clear(); if (M) for (const en of M.entries) { en.landT = undefined; en.firstKillT = undefined; } }
(() => { const s = document.createElement('style'); s.textContent = `.brx-aw{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0 0 12px}.brx-aw div{border:1px solid rgba(143,255,106,.35);background:rgba(20,40,20,.55);padding:8px 10px}.brx-aw small{display:block;color:#8fff6a;letter-spacing:2px;font-size:11px}.brx-aw b{display:block;font-size:17px;margin:2px 0}.brx-aw span{font-size:12px;opacity:.75}
#brxHaze{position:fixed;inset:0;pointer-events:none;z-index:5;opacity:0;background:radial-gradient(circle at 50% 50%,rgba(220,150,255,.18),rgba(110,30,170,.75))}#brxFlash{position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;background:#f2d8ff}`; document.head.appendChild(s);
  const h = document.createElement('div'); h.id = 'brxHaze'; document.body.appendChild(h); const f = document.createElement('div'); f.id = 'brxFlash'; document.body.appendChild(f); })();
