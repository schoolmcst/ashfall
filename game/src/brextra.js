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
/* ---------- the NIGHTBLOOM revive (a made-up drug: a glowing purple flower that only grows in the Nightshade cloud)
   a real hand (sleeve, glove, jointed fingers) holds the flower, slowly closes and crushes it; petals break off and fall,
   fine pollen dust drifts to the downed mate, who breathes it in, coughs, props up on the elbows and gets up staggering */
function brxBloomMesh(bot) {
  const g = new THREE.Group(), vm = typeof VM !== 'undefined' ? VM : {}, std = o => new THREE.MeshStandardMaterial(o);
  const sleeve = bot ? std({ color: 0x3a3f33, roughness: 0.95 }) : (vm.sleeve || std({ color: 0x4b5240, roughness: 0.95 })), glove = vm.glove || std({ color: 0x1d1f20, roughness: 0.85 }), skin = vm.skin || std({ color: 0x9c7355, roughness: 0.8 });
  // the hand: palm up, fingers pointing away from the camera (-z); +x rotation on a joint curls it up into the palm
  const hand = new THREE.Group(); g.add(hand); g.userData.hand = hand;
  const cyl = (r0, r1, l, m) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, l, 10), m); c.rotation.x = Math.PI / 2; c.position.z = -l / 2; const w = new THREE.Group(); w.add(c); return w; };
  const ball = (r, m) => new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m);
  const armP = new THREE.Group(); armP.position.set(0.004, -0.012, 0.035); armP.rotation.set(1.1, 0.12, 0); hand.add(armP);   // the forearm runs down and back out of the screen
  const fa = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.2, 12), sleeve); fa.rotation.x = Math.PI / 2; fa.position.z = 0.115; armP.add(fa);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.026, 0.03, 12), glove); cuff.rotation.x = Math.PI / 2; cuff.position.z = 0.012; armP.add(cuff);
  const wrist = ball(0.024, glove); wrist.scale.set(1.15, 0.7, 1); wrist.position.set(0, -0.01, 0.03); hand.add(wrist);
  const palm = ball(0.034, glove); palm.scale.set(1.08, 0.42, 1.12); palm.position.set(0, -0.006, -0.004); hand.add(palm);
  const heel = ball(0.02, glove); heel.scale.set(1, 0.7, 1); heel.position.set(-0.018, 0.0, 0.016); hand.add(heel);
  // fingers: fingerless gloves, so the first bone is glove and the tip is skin
  const fingers = [];
  [[-0.024, 0.024, 0.0075], [-0.008, 0.028, 0.008], [0.008, 0.026, 0.0078], [0.022, 0.021, 0.0068]].forEach(([x, len, r], i) => {
    const f0 = new THREE.Group(); f0.position.set(x, -0.002, -0.032); hand.add(f0);
    const k = ball(r * 1.05, glove); f0.add(k); const b0 = cyl(r, r * 0.95, len * 0.45, glove); f0.add(b0);
    const f1 = new THREE.Group(); f1.position.z = -len * 0.45; f0.add(f1); f1.add(ball(r * 0.95, skin)); f1.add(cyl(r * 0.95, r * 0.88, len * 0.32, skin));
    const f2 = new THREE.Group(); f2.position.z = -len * 0.32; f1.add(f2); f2.add(ball(r * 0.88, skin)); f2.add(cyl(r * 0.88, r * 0.78, len * 0.26, skin)); const tip = ball(r * 0.8, skin); tip.position.z = -len * 0.26; f2.add(tip);
    f0.rotation.y = (i - 1.5) * -0.08; fingers.push([f0, f1, f2]);
  });
  const th0 = new THREE.Group(); th0.position.set(-0.03, -0.002, 0.008); th0.rotation.set(0.1, 0.75, 0.35); hand.add(th0); th0.add(ball(0.0095, glove)); th0.add(cyl(0.0095, 0.0088, 0.022, glove));
  const th1 = new THREE.Group(); th1.position.z = -0.022; th0.add(th1); th1.add(ball(0.0088, skin)); th1.add(cyl(0.0088, 0.0078, 0.02, skin)); const tt = ball(0.0078, skin); tt.position.z = -0.02; th1.add(tt);
  g.userData.fingers = fingers; g.userData.thumb = [th0, th1];
  // the flower: two rings of cupped petals (deep violet, pale at the base, faint glow at the tips), stamens, a stem with leaves
  const flower = new THREE.Group(); flower.position.set(0.0, 0.006, -0.012); g.add(flower); g.userData.flower = flower;
  const petGeo = (r, w) => { const geo = new THREE.SphereGeometry(r, 10, 8, -w / 2, w, 0.15, 1.25), p = geo.attributes.position, col = []; for (let i = 0; i < p.count; i++) { const t = clamp((p.getY(i) + r * 0.25) / (r * 1.1), 0, 1); col.push(0.95 - 0.55 * (1 - t), 0.82 - 0.7 * (1 - t), 1.0 - 0.25 * (1 - t)); } geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return geo; };
  const petM = std({ color: 0xffffff, vertexColors: true, emissive: 0x6a1ab0, emissiveIntensity: 0.55, roughness: 0.55, side: THREE.DoubleSide }), petM2 = std({ color: 0xffffff, vertexColors: true, emissive: 0x8a3ad0, emissiveIntensity: 0.7, roughness: 0.5, side: THREE.DoubleSide });
  const petals = [];
  [[6, 0.03, 0.9, 1.05, petM, 0], [5, 0.022, 1.0, 0.6, petM2, 0.5]].forEach(([n, r, w, tilt, m, off]) => { for (let i = 0; i < n; i++) { const a = (i + off) / n * TAU, piv = new THREE.Group(); piv.rotation.y = a; flower.add(piv); const pe = new THREE.Mesh(petGeo(r, w), m); pe.rotation.x = Math.PI - tilt; pe.position.y = 0.002; pe.scale.set(1, 1, 0.55); piv.add(pe); petals.push({ piv, pe, a }); } });
  g.userData.petals = petals;
  const stM = std({ color: 0xe8d0ff, emissive: 0xc080ff, emissiveIntensity: 0.6, roughness: 0.6 }), anM = std({ color: 0xfff0b0, emissive: 0xffd080, emissiveIntensity: 1.6 });
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, sl = 0.012 + (i % 2) * 0.004, s = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, sl, 4), stM); s.position.set(Math.cos(a) * 0.003, 0.004 + sl / 2, Math.sin(a) * 0.003); s.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); flower.add(s); const an = new THREE.Mesh(new THREE.SphereGeometry(0.0018, 6, 4), anM); an.position.set(Math.cos(a) * (0.003 + sl * 0.34), 0.004 + sl * 0.95, Math.sin(a) * (0.003 + sl * 0.34)); an.scale.set(1, 0.6, 1.6); flower.add(an); }
  const core = ball(0.0045, std({ color: 0xffe8ff, emissive: 0xff9aff, emissiveIntensity: 1.2 })); core.position.y = 0.004; flower.add(core); g.userData.core = core;
  const stemM = std({ color: 0x2c4a22, roughness: 0.8 }), st = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.002, 0.05, 6), stemM); st.position.set(0, -0.006, 0.022); st.rotation.x = 1.25; flower.add(st);
  for (const s of [-1, 1]) { const lf = ball(0.012, std({ color: 0x3a6a2a, roughness: 0.7, side: THREE.DoubleSide })); lf.scale.set(0.45, 0.08, 1); lf.position.set(s * 0.008, -0.01, 0.03); lf.rotation.set(0.2, s * 0.6, s * 0.3); flower.add(lf); }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0x9a50ff, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.22, depthWrite: false })); halo.scale.setScalar(0.11); halo.position.y = 0.01; flower.add(halo); g.userData.halo = halo;
  g.scale.setScalar(1.35); g.userData.bot = !!bot; return g;
}
// pollen: fine slow dust that drifts and slows down (not sparkles); burst = the cough cloud
function brxSparks(x, y, z, n, spread, toward, big) {
  BRX.sparks = BRX.sparks || [];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: big ? 0x8a5ab8 : Math.random() < 0.6 ? 0xa060f0 : 0xc890ff, blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false })); s.position.set(x + rnd(-spread, spread), y + rnd(-spread, spread), z + rnd(-spread, spread)); const sc = big ? rnd(0.12, 0.3) : rnd(0.012, 0.035); s.scale.setScalar(sc); scene.add(s);
    const v = toward ? { x: (toward.x - s.position.x) * 0.7 + rnd(-0.08, 0.08), y: (toward.y - s.position.y) * 0.7 + rnd(-0.05, 0.1), z: (toward.z - s.position.z) * 0.7 + rnd(-0.08, 0.08) } : { x: rnd(-0.5, 0.5), y: rnd(0.1, 0.6), z: rnd(-0.5, 0.5) };
    BRX.sparks.push({ s, v, t: 0, life: big ? rnd(1.4, 2.2) : rnd(1.3, 2), sc, big, op: big ? 0.1 : 0.6, ph: Math.random() * 9 }); }
}
function brxSparkTick(dt) {
  const L = BRX.sparks || [];
  for (let i = L.length - 1; i >= 0; i--) { const p = L[i]; p.t += dt; const dr = Math.exp(-dt * (p.big ? 1.6 : 1.1)); p.v.x *= dr; p.v.z *= dr; p.v.y = p.v.y * dr + (p.big ? 0.05 : -0.02) * dt;
    p.s.position.x += (p.v.x + Math.sin(NOW * 2 + p.ph) * 0.03) * dt; p.s.position.y += p.v.y * dt; p.s.position.z += (p.v.z + Math.cos(NOW * 1.7 + p.ph) * 0.03) * dt;
    const k = p.t / p.life; p.s.material.opacity = p.op * Math.min(1, k * 6) * (1 - k); if (p.big) p.s.scale.setScalar(p.sc * (1 + k * 1.8));
    if (p.t >= p.life) { scene.remove(p.s); p.s.material.dispose(); L.splice(i, 1); } }
  // petals that broke off: tumble down and fade
  const F = BRX.fall || [];
  for (let i = F.length - 1; i >= 0; i--) { const f = F[i]; f.t += dt; f.v.y -= 2.2 * dt; f.v.x *= 0.97; f.v.z *= 0.97; if (f.v.y < -0.5) f.v.y = -0.5; f.m.position.x += (f.v.x + Math.sin(f.t * 5 + f.ph) * 0.1) * dt; f.m.position.y += f.v.y * dt; f.m.position.z += f.v.z * dt; f.m.rotation.x += f.w.x * dt; f.m.rotation.z += f.w.z * dt; f.m.material.opacity = clamp(1.8 - f.t, 0, 1);
    if (f.t > 1.8) { scene.remove(f.m); f.m.material.dispose(); F.splice(i, 1); } }
}
// a petal breaks off the flower into the world
function brxDropPetal(p) {
  if (p.gone) return; p.gone = true; const m = p.pe, wp = new THREE.Vector3(), wq = new THREE.Quaternion(), ws = new THREE.Vector3(); m.updateMatrixWorld(); m.matrixWorld.decompose(wp, wq, ws);
  p.pe.parent.remove(m); m.material = m.material.clone(); m.material.transparent = true; m.position.copy(wp); m.quaternion.copy(wq); m.scale.copy(ws); scene.add(m);
  (BRX.fall = BRX.fall || []).push({ m, t: 0, ph: Math.random() * 9, v: { x: rnd(-0.25, 0.25), y: rnd(0.05, 0.3), z: rnd(-0.25, 0.25) }, w: { x: rnd(-6, 6), z: rnd(-6, 6) } });
}
// sounds (built from the game's own noise/tone voices)
function brxSnd(k, vol) {
  try { const o = { vol: vol === undefined ? 1 : vol };
    if (k === 'crush') { for (let i = 0; i < 7; i++) burst(0.035 + Math.random() * 0.03, 2500 + Math.random() * 3500, 0.05, 'highpass', Object.assign({ delay: i * 0.05 + Math.random() * 0.03 }, o)); burst(0.18, 600, 0.04, 'lowpass', o); }
    else if (k === 'inhale') { for (let i = 0; i < 6; i++) burst(0.2, 900 + i * 260, 0.012 + i * 0.008, 'bandpass', Object.assign({ delay: i * 0.08 }, o)); }
    else if (k === 'cough') { for (let i = 0; i < 2; i++) { burst(0.16, 700, 0.09, 'bandpass', Object.assign({ delay: i * 0.26 }, o)); tone(150 - i * 20, 0.12, 0.04, 'triangle', 90, Object.assign({ delay: i * 0.26 }, o)); } }
    else if (k === 'gasp') { burst(0.45, 1400, 0.07, 'bandpass', o); tone(220, 0.3, 0.02, 'sine', 330, o); }
    else if (k === 'beat') { tone(58, 0.12, 0.16, 'sine', 42, o); tone(52, 0.1, 0.1, 'sine', 40, Object.assign({ delay: 0.16 }, o)); }
  } catch (e) {}
}
// someone comes back up (from sqBotUp / sqPlayerUp): a deep gasp, the last of the pollen, a stagger
function brxBloomUp(x, y, z, me) {
  brxSparks(x, y + 0.4, z, 5, 0.15, null, true); brxSnd('gasp', me ? 1 : 0.6);
  if (me) { const f = $('brxFlash'); if (f) { f.style.transition = 'none'; f.style.opacity = 0.35; requestAnimationFrame(() => { f.style.transition = 'opacity 1.6s ease-out'; f.style.opacity = 0; }); } BRX.wake = 1.6; }
  else { const e = enemies.find(o => Math.hypot(o.group.position.x - x, o.group.position.z - z) < 0.3); if (e) BRX.stag = { e, t: 0 }; }
}
const brxEase = t => t * t * (3 - 2 * t);
function brxReviveTick(dt) {
  brxSparkTick(dt);
  const mine = typeof SQ !== 'undefined' && SQ.revT > 0 && SQ.revWho && SQ.revWho.downed, helper = G.downed ? enemies.find(e => e.team === M.myTeam && !e.downed && e.revT > 0.05 && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 1.9) : null, helped = !!helper;
  const on = playerAlive() && (mine || helped), REV = typeof SQ_REVIVE !== 'undefined' ? SQ_REVIVE : 2.4, pr = mine ? SQ.revT / REV : helped ? helper.revT / REV : 0;
  if (on && BRX.joint && BRX.joint.userData.bot !== !mine) { scene.remove(BRX.joint); BRX.joint = null; }
  if (on && !BRX.joint) { BRX.joint = brxBloomMesh(!mine); scene.add(BRX.joint);   // in the world just in front of the camera (the gun's own view washes its colours out)
    BRX.jT = 0; BRX.pollenT = 0; BRX.beatT = 0; BRX.snd = {}; }
  if (BRX.joint) {
    BRX.jT += dt; const J = BRX.joint, U = J.userData, k = brxEase(Math.min(1, BRX.jT / 0.5));
    if (!on) { if (J.parent) J.parent.remove(J); BRX.joint = null; try { const gun = gunObjs[G.cur]; if (gun) gun.visible = true; } catch (e) {} }
    else {
      try { const gun = gunObjs[G.cur]; if (gun) gun.visible = false; } catch (e) {}
      // 1 (0-0.3): raise the hand, the flower breathes in the open palm; 2 (0.3-0.62): the fingers close slowly and crush it,
      // petals break off; 3 (0.55-0.95): the hand opens towards the mate and the pollen drifts off the palm
      const close = brxEase(clamp((pr - 0.3) / 0.32, 0, 1)), open = brxEase(clamp((pr - 0.68) / 0.2, 0, 1)), grip = close * (1 - open * 0.75), breathe = Math.sin(NOW * 2.2);
      const sw = Math.sin(NOW * 1.3) * 0.004, bob = Math.sin(NOW * 2.6) * 0.003;
      if (mine) J.userData.local = new THREE.Vector3(0.04 - 0.02 * k + sw, -0.2 + 0.08 * k + bob - 0.012 * close + 0.02 * open, -0.3 - 0.04 * k - 0.07 * open);
      else J.userData.local = new THREE.Vector3(0.32 - 0.24 * k + sw, -0.05 - 0.04 * k + bob, -0.26 + 0.03 * k);
      U.fingers.forEach((f, i) => { const g2 = clamp(grip * 1.15 - i * 0.05, 0, 1), tw = Math.sin(NOW * 3 + i) * 0.03; f[0].rotation.x = 0.08 + 1.25 * g2 + tw; f[1].rotation.x = 0.1 + 1.4 * g2; f[2].rotation.x = 0.06 + 1.0 * g2; });
      U.thumb[0].rotation.x = 0.1 + 0.7 * grip; U.thumb[1].rotation.x = 0.1 + 0.9 * grip;
      // the flower: breathes, then squashes and sinks into the fist
      const fl = U.flower, sq = Math.max(0.12, 1 - close * 0.85); fl.scale.set(sq * (1 + breathe * 0.03) * (1 + close * 0.15), sq * (1 + breathe * 0.04) * (1 - close * 0.3), sq * (1 + close * 0.1)); fl.position.y = 0.006 - 0.004 * close; fl.visible = close < 0.98 || open < 0.2;
      U.petals.forEach((p, i) => { if (p.gone) return; p.piv.rotation.z = Math.sin(NOW * 1.7 + i) * 0.04 * (1 - close); p.pe.rotation.x = Math.PI - (i < 6 ? 1.05 : 0.6) + breathe * 0.04 + close * 0.6; if (close > 0.15 + (i % 6) * 0.11 && i % 3 !== 2) brxDropPetal(p); });
      U.core.material.emissiveIntensity = 1.2 + breathe * 0.25 + close * 1.4; U.halo.material.opacity = (0.18 + breathe * 0.04 + close * 0.12) * (1 - open);
      J.rotation.set(0.25 - 0.3 * open, mine ? 0.08 : 0.6, (mine ? -0.15 : 0.3) + sw * 3 - 0.25 * open); camera.updateMatrixWorld(); J.quaternion.copy(camera.quaternion).multiply(new THREE.Quaternion().setFromEuler(J.rotation)); J.position.copy(J.userData.local).applyQuaternion(camera.quaternion).add(camera.position);
      if (close > 0.05 && !BRX.snd.crush) { BRX.snd.crush = 1; brxSnd('crush', mine ? 1 : 0.7); }
      // pollen off the opening palm, drifting to the mate's face (me) / to my face (a bot reviving me)
      if (grip > 0.3 || open > 0.05) if ((BRX.pollenT -= dt) <= 0) { BRX.pollenT = 0.035; const hp = new THREE.Vector3(); U.flower.getWorldPosition(hp);
        let to; if (mine) { const t = SQ.revWho.group.position; to = new THREE.Vector3(t.x, t.y + 0.35, t.z); } else to = new THREE.Vector3(camera.position.x, camera.position.y - 0.05, camera.position.z);
        brxSparks(hp.x, hp.y + 0.01, hp.z, open > 0.05 ? 4 : 1, 0.012, open > 0.05 ? to : null); }
    }
  }
  // the downed squadmate: shallow breaths, breathes the pollen in, coughs, props up on the elbows, looks at me
  if (mine) { const e = SQ.revWho, r = e.rig; if (r) {
    const inh = brxEase(clamp((pr - 0.62) / 0.12, 0, 1)), cough = clamp((pr - 0.74) / 0.12, 0, 1), up = brxEase(clamp((pr - 0.84) / 0.16, 0, 1));
    const br = Math.sin(NOW * (2.2 + inh * 3)) * (0.04 + inh * 0.08), ck = cough > 0 && cough < 1 ? Math.max(0, Math.sin(cough * Math.PI * 4)) * 0.35 : 0;
    if (r.torso) { r.torso.rotation.x = br - inh * 0.15 + ck * 0.5 - up * 0.2; r.torso.scale.set(1 + br * 0.15, 1, 1 + br * 0.25); }
    r.head.rotation.x = -0.15 + br * 0.5 - inh * 0.35 + ck * 0.8 - up * 0.45; r.head.rotation.y = up * 0.3;
    r.armR.rotation.set(-0.4 - up * 1.1 + ck * 0.3, 0, -0.3 - up * 0.2); r.armL.rotation.set(-0.4 - up * 1.1 - ck * 0.2, 0, 0.3 + up * 0.2);
    if (r.elR) r.elR.rotation.x = -up * 1.2; if (r.elL) r.elL.rotation.x = -up * 1.2;
    e.revLift = -1.25 + up * 0.75; e.group.rotation.x = e.revLift; e.group.rotation.z = Math.sin(NOW * 7) * 0.012 * cough * (1 - up);
    if (inh > 0.02 && !BRX.snd.inh) { BRX.snd.inh = 1; brxSnd('inhale', 0.7); } if (cough > 0.02 && !BRX.snd.cough) { BRX.snd.cough = 1; brxSnd('cough', 0.7); const h = e.group.position; brxSparks(h.x, h.y + 0.4, h.z, 3, 0.1, null, true); }
  } } else for (const e of enemies) if (e.revLift !== undefined && !(e.revT > 0) && (!SQ || SQ.revWho !== e)) { e.revLift = undefined; if (e.rig && e.rig.torso) e.rig.torso.scale.set(1, 1, 1); }
  // after getting up: a stagger for a second, then it settles
  if (BRX.stag) { const s = BRX.stag, e = s.e; s.t += dt; const d = Math.max(0, 1 - s.t / 1.3); e.revLift = undefined; if (e.rig && e.rig.torso) e.rig.torso.scale.set(1, 1, 1); e.group.rotation.z = Math.sin(s.t * 6) * 0.09 * d; e.group.rotation.x = 0.12 * d; if (e.rig) e.rig.head.rotation.x = 0.3 * d * Math.abs(Math.sin(s.t * 3)); if (s.t > 1.3) { e.group.rotation.z = 0; e.group.rotation.x = 0; BRX.stag = null; } }
  // a bot getting me up: the screen comes back from dark and blurry, the heartbeat is weak and slow then strong, a gasp at the end
  BRX.wake = Math.max(0, (BRX.wake || 0) - dt);
  const dark = helped ? 0.85 - pr * 0.6 : BRX.wake > 0 ? BRX.wake / 1.6 * 0.2 : 0; BRX.haze = lerp(BRX.haze || 0, dark, clamp(dt * 2.5, 0, 1)); const h = $('brxHaze'); if (h) { h.style.opacity = BRX.haze.toFixed(3); h.style.backdropFilter = h.style.webkitBackdropFilter = BRX.haze > 0.02 ? `blur(${(BRX.haze * 6).toFixed(1)}px)` : ''; }
  if (helped && (BRX.beatT -= dt) <= 0) { BRX.beatT = Math.max(0.55, 1.5 - pr * 0.95) + (pr < 0.4 && Math.random() < 0.3 ? 0.4 : 0); brxSnd('beat', 0.35 + pr * 0.65); if (pr > 0.4 && !BRX.snd.inh) { BRX.snd.inh = 1; brxSnd('inhale'); } }
}
/* ---------- every frame (from brUpdate) and the round's start */
function brxTick(dt) {
  if (!M || !M.br) return; brxPuppetTick(dt); brxReviveTick(dt);
  for (const en of M.entries) if ((en.kills | 0) > 0 && en.firstKillT === undefined) en.firstKillT = M.t;
}
function brxSetup() { for (const q of BRX.puppets) scene.remove(q.r.root); BRX.puppets = []; BRX.dmg.clear(); BRX.loot.clear(); if (M) for (const en of M.entries) { en.landT = undefined; en.firstKillT = undefined; } }
(() => { const s = document.createElement('style'); s.textContent = `.brx-aw{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0 0 12px}.brx-aw div{border:1px solid rgba(143,255,106,.35);background:rgba(20,40,20,.55);padding:8px 10px}.brx-aw small{display:block;color:#8fff6a;letter-spacing:2px;font-size:11px}.brx-aw b{display:block;font-size:17px;margin:2px 0}.brx-aw span{font-size:12px;opacity:.75}
#brxHaze{position:fixed;inset:0;pointer-events:none;z-index:5;opacity:0;background:radial-gradient(ellipse at 50% 50%,rgba(60,20,80,.25) 20%,rgba(20,4,30,.92) 75%,#05010a)}#brxFlash{position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;background:#efe6ff}`; document.head.appendChild(s);
  const h = document.createElement('div'); h.id = 'brxHaze'; document.body.appendChild(h); const f = document.createElement('div'); f.id = 'brxFlash'; document.body.appendChild(f); })();
