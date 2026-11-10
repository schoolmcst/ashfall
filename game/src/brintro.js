/* ================================================================== LAST TOKE: WARM-UP, THE BONG HIT and THE FLOAT IN (1.2.90)
   Before a LAST TOKE round:
   1. WARM-UP (20 s offline, 30 s online): everyone is on the map with a random good gun, free respawns, kills don't
      count, no crates, no cloud. Offline, USE skips it.
   2. THE BONG HIT: the screen goes to a cinematic. Up on THE HOTBOX CLOUD above the map you (or your whole squad, passing
      it round) take a hit from a big glass bong: lighter, bubbles, the chamber fills, a huge exhale, the screen fills
      with smoke. JUMP / A skips it.
   3. THE FLOAT IN: you come out of the smoke high over the map on a little cloud and float down. Steer with WASD /
      the left stick, hold CROUCH to dive (faster down, slower across), close to the ground the cloud slows you for a
      soft landing. You can't shoot or be shot while floating. Bots float in too, each to its own spot; squads start
      together. Online the host runs the timeline (B.phase -3 warm-up, -2 the bong, -1 the float, in the 'b' pack) and
      every player runs their own cinematic and float. */
const BRF = { ph: null, cine: null, float: false, fT: 0, stage: null, hidden: [], puffs: [], trail: [], windT: 0, fog0: null, warmSkip: false };
const BRF_WARM = () => (M && M.online ? 30 : 20);
const brfCineDur = n => 0.9 + Math.max(0, n - 1) * 1.15 + 2.9 + 2.4 + 0.4;   // the same length as the cinematic (+ a moment)
const brfSkipAll = () => (typeof window !== 'undefined' && window.BR_SKIPINTRO) || (M && M.cfg && M.cfg.noIntro);
const brWarmNow = () => !!(M && M.br && M.br.phase === -3);
const brfSafe = () => !!(M && M.br && (M.br.phase === -3 ? false : (BRF.cine || BRF.float || M.br.phase === -2)));   // the bong and the float: nobody gets hurt
const brfHideLoot = () => !!(M && M.br && M.br.phase === -3);
const brfAltStart = () => (ARENA > 120 ? 150 : 70);
function brfReset() {
  brfCineEnd(true); BRF.ph = null; BRF.ran = false; BRF.float = false; BRF.warmSkip = false; brfFogBack();
  for (const p of BRF.trail) if (p.parent) p.parent.remove(p); BRF.trail = [];
  const w = $('brWhite'); if (w) w.style.opacity = 0;
}
// the phase the round starts in (called from brSetup)
function brfStartPhase(B) { brfReset(); if (brfSkipAll() || M.mode !== 'br') return; B.phase = -3; B.t = BRF_WARM(); }

/* ---------- the timeline: called at the top of brUpdate; true = a pre-round phase is running (skip the rest) */
function brPre(dt) {
  const B = M.br; if (!B) return false; const host = netHostNow();
  if (host && B.phase === -3) { B.t -= dt; if (!M.online && (kb('use') || pad.use) && B.t < BRF_WARM() - 1.5) B.t = 0; if (B.t <= 0) { B.phase = -2; B.t = brfCineDur(M.squad > 1 ? M.squad : 1); } }
  else if (host && B.phase === -2) { B.t -= dt; if (B.t <= 0) { B.phase = -1; B.t = 0; } }
  // react to the phase changing (the host's own changes, or the pack on a joiner)
  if (BRF.ph !== B.phase) {
    const was = BRF.ph; BRF.ph = B.phase;
    if (B.phase <= -2) BRF.ran = true;
    if (B.phase === -3) brWarmStart();
    else if (B.phase === -2) { if (was === -3) brWarmEnd(); brfCineStart(); }
    else if (B.phase >= -1 && (was === -3 || was === -2)) { if (was === -3) brWarmEnd(); if (!BRF.float) { brfCineEnd(); brfFloatStart(); } if (host) brfBotsFloat(); }
  }
  if (B.phase === -3) { brWarmTick(dt); return true; }
  if (B.phase === -2) { if (host) for (const e of enemies) if (e.entry && !e.net && !e.brFloat) e.brFloat = { wait: true }; return true; }
  return false;
}
/* ---------- 1. warm-up */
function brWarmGun() { const d = brGun(Math.random() < 0.55 ? 1 : 2); try { equipClass({ p: d.id, s: 'sidearm', e: 'frag', k: 'none', factory: true }); G.grenades = 1; } catch (e) {} }
function brWarmStart() {
  const B = M.br; for (const c of B.crates) c.g.visible = false; if (B.wall) B.wall.visible = false;
  if (playerAlive()) brWarmGun();
  try { showBanner('WARM-UP', `free respawns · kills don't count · the round starts in ${Math.ceil(B.t)} s${M.online ? '' : ' · ' + actName('use') + ' skips'}`); sfx.streak(); } catch (e) {}
}
function brWarmTick(dt) {
  const B = M.br; if (!netHostNow()) return;
  for (const e of enemies) if (e.entry && !e.net && e.entry.alive !== false && !e.brWG) { e.brWG = true; e.brTier = -1; try { botGunProfile(e, brGun(Math.random() < 0.55 ? 1 : 2).id); } catch (er) {} }
  for (const en of M.entries) if (!en.isPlayer && !en.net && en.alive === false && !M.respawnQ.some(r => r.en === en) && !(typeof enemies !== 'undefined' && enemies.some(e => e.entry === en))) M.respawnQ.push({ en, t: 2.5 });
}
function brWarmEnd() {
  const B = M.br; M.respawnQ = [];
  for (const en of M.entries) { en.kills = 0; en.deaths = 0; en.score = 0; }
  if (netHostNow()) for (const en of M.entries) if (!en.isPlayer && !en.net && en.alive === false && !enemies.some(e => e.entry === en)) try { spawnBot(en, pickSpawnFor(en.team, sideOf(en.team), true)); } catch (e) {}
  for (const e of enemies) { e.downed = false; e.brWG = false; e.brTier = undefined; if (e.entry && !e.net) e.hp = e.maxHp; }
  G.downed = false; if (DUEL.on) DUEL.on = null;
  if (!playerAlive() && !NET.spec) { try { G.dc = null; G.dcHold = false; respawnPlayer(); } catch (e) {} }
  G.health = G.maxHp || 100; for (const c of B.crates) c.g.visible = true; if (B.wall) B.wall.visible = true;
  try { feedClear && feedClear(); } catch (e) {}
}

/* ---------- 2. the bong hit, up on THE HOTBOX CLOUD */
function brfStageBuild() {
  const g = new THREE.Group(), pr = PLAYRECT, cx = (pr[0] + pr[1]) / 2, cz = (pr[2] + pr[3]) / 2, y = ARENA > 120 ? 210 : 110;
  g.position.set(cx, y, cz);
  const cloudM = new THREE.MeshStandardMaterial({ color: 0xdfe4ea, roughness: 1, emissive: 0x6a7480, emissiveIntensity: 0.18 });
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + rnd(-0.2, 0.2), r = i < 5 ? rnd(0, 1.5) : rnd(2.6, 4.4), s = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), cloudM); s.scale.set(rnd(1.8, 2.8), rnd(0.55, 0.9), rnd(1.8, 2.8)); s.position.set(Math.cos(a) * r, -0.45 - rnd(0, 0.3), Math.sin(a) * r); g.add(s); }
  for (let i = 0; i < 14; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false })); const a = i / 14 * TAU; sp.position.set(Math.cos(a) * rnd(5, 7), rnd(-0.6, 0.8), Math.sin(a) * rnd(5, 7)); sp.scale.setScalar(rnd(4, 6.5)); g.add(sp); }
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.04, 32), new THREE.MeshStandardMaterial({ color: 0x5a2a7a, roughness: 0.9 })); rug.position.y = 0.02; g.add(rug);
  const rug2 = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.05, 6, 40), new THREE.MeshStandardMaterial({ color: 0x8fff6a, emissive: 0x2a7a1a, emissiveIntensity: 0.6 })); rug2.rotation.x = Math.PI / 2; rug2.position.y = 0.05; g.add(rug2);
  // the bong: a glass beaker with water, a tall tube, a flared mouthpiece, a downstem and a bowl
  const bong = new THREE.Group(); bong.scale.setScalar(1.12); g.add(bong);
  const glass = new THREE.MeshStandardMaterial({ color: 0x7affa8, transparent: true, opacity: 0.32, roughness: 0.08, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const base = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), glass); base.scale.set(1, 0.85, 1); base.position.y = 0.24; bong.add(base);
  const water = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 10, 0, TAU, Math.PI * 0.45, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0x2aa070, transparent: true, opacity: 0.55, roughness: 0.2, depthWrite: false })); water.position.y = 0.24; bong.add(water);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.95, 18, 1, true), glass); tube.position.y = 0.82; bong.add(tube);
  const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.12, 18, 1, true), glass); mouth.position.y = 1.35; bong.add(mouth);
  const smoke = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.075, 0.93, 12), new THREE.MeshBasicMaterial({ color: 0x7f9a85, transparent: true, opacity: 0, depthWrite: false })); smoke.position.y = 0.82; smoke.renderOrder = 2; bong.add(smoke);
  for (const yy of [0.62, 1.12]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.083, 0.012, 6, 20), new THREE.MeshStandardMaterial({ color: 0x8fff6a, emissive: 0x3aa020, emissiveIntensity: 0.8 })); ring.rotation.x = Math.PI / 2; ring.position.y = yy; bong.add(ring); }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 8), glass); stem.position.set(0.17, 0.3, 0); stem.rotation.z = -0.8; bong.add(stem);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.025, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x3a8a5a, transparent: true, opacity: 0.6, roughness: 0.1 })); bowl.position.set(0.29, 0.41, 0); bong.add(bowl);
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 6), new THREE.MeshStandardMaterial({ color: 0x331a0a, emissive: 0xff5a10, emissiveIntensity: 0 })); ember.scale.y = 0.4; ember.position.set(0.29, 0.43, 0); bong.add(ember);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0xffa040, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); flame.scale.set(0.09, 0.16, 1); flame.position.set(0.31, 0.52, 0); flame.visible = false; bong.add(flame);
  const bubbles = []; for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.015 + Math.random() * 0.012, 6, 4), new THREE.MeshBasicMaterial({ color: 0xdfffee, transparent: true, opacity: 0.8 })); b.visible = false; bong.add(b); bubbles.push({ m: b, t: Math.random() }); }
  const lamp = new THREE.PointLight(0xb08aff, 1.6, 9); lamp.position.set(0, 2.4, 0); g.add(lamp);
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  scene.add(g);
  return { g, bong, smoke, ember, flame, bubbles, water };
}
function brfMates() {
  // who is in my squad (me first): names for the captions, one model each
  const out = [{ name: 'YOU', me: true }];
  if (M.squad > 1) for (const en of M.entries) if (!en.isPlayer && en.team === M.myTeam && out.length < M.squad) out.push({ name: en.name || 'MATE' });
  return out;
}
function brfCineStart() {
  if (BRF.cine) return; brfCineEnd(true);
  const st = brfStageBuild(), who = brfMates(), n = who.length, rigs = [];
  who.forEach((w, i) => {
    const r = cloneSoldier(i === 0 ? 'scout' : ['rifleman', 'heavy', 'scout'][i % 3]), a = Math.PI / 2 + i / n * TAU + (n > 1 ? 0 : 0);
    r.root.position.set(Math.cos(a) * 0.44, 0, Math.sin(a) * 0.44); r.root.rotation.order = 'YXZ'; r.root.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
    if (r.gun) r.gun.visible = false; st.g.add(r.root); r.root.traverse(o => { if (o.isMesh) o.castShadow = false; });
    rigs.push({ r, a, w });
  });
  // the order: the squad passes it round, me last (the long one)
  const segs = []; let t = 0.9; for (let i = 1; i < n; i++) { segs.push({ i, t0: t, dur: 1.15 }); t += 1.15; } segs.push({ i: 0, t0: t, dur: 2.9, me: true });
  BRF.cine = { t: 0, dur: t + 2.9 + 2.4, st, rigs, segs, puffs: [], bubT: 0, sndT: 0, cough: 0, last: -1 };
  BRF.hidden = []; for (const e of enemies) if (e.group && e.group.visible) { e.group.visible = false; BRF.hidden.push(e); }
  try { if (MAPV && MAPV.open) mapClose(); } catch (e) {}
  P.x = st.g.position.x; P.z = st.g.position.z + 3; P.y = st.g.position.y; P.vx = P.vy = P.vz = 0;
  document.body.classList.add('brcine');
  let c = $('brCine'); if (!c) { c = document.createElement('div'); c.id = 'brCine'; c.innerHTML = '<i class="bt"></i><i class="bb"></i><div class="cap"><b></b><small></small></div><div class="skip"></div>'; document.body.appendChild(c); }
  c.style.display = 'block'; c.querySelector('.skip').textContent = `${actName('jump')} · SKIP`;
  brfCaption(n > 1 ? 'PASS IT ROUND' : 'LIGHT IT UP', n > 1 ? who.map(w => w.name).join(' · ') : 'THE HOTBOX CLOUD');
  BRF.cine.skipArm = !!(kb('jump') || pad.jump);
}
function brfCaption(t, s) { const c = $('brCine'); if (!c) return; c.querySelector('.cap b').textContent = t; c.querySelector('.cap small').textContent = s || ''; }
function brfCineEnd(silent) {
  const C = BRF.cine; BRF.cine = null;
  if (C && C.st && C.st.g.parent) { C.st.g.parent.remove(C.st.g); C.st.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  for (const p of (C && C.puffs) || []) if (p.s.parent) p.s.parent.remove(p.s);
  for (const e of BRF.hidden) if (e.group) e.group.visible = true; BRF.hidden = [];
  document.body.classList.remove('brcine'); const c = $('brCine'); if (c) c.style.display = 'none';
}
const _bfv = new THREE.Vector3(), _bfv2 = new THREE.Vector3();
function brfPose(R, k, back, look) {   // k: leaning in to the bong (0..1), back: leaning back to blow it out
  const r = R.r; r.torso.rotation.set(0.5 * k - 0.16 * back, 0, 0); r.head.rotation.set(0.3 * k - 0.45 * back, look || 0, 0);
  r.armL.rotation.set(-0.95 * k - 0.1, 0.25 * k, 0.12); r.elL.rotation.set(-0.7 * k, 0, 0);
  r.armR.rotation.set(-0.55 * k - 0.1, -0.3 * k, -0.12); r.elR.rotation.set(-1.1 * k - 0.1 * back, 0, 0);
  if (r.legL) { r.legL.rotation.set(0, 0, 0); r.legR.rotation.set(0, 0, 0); }
}
function brfPuff(C, x, y, z, vx, vy, vz, size, life) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0x9fb8a4, transparent: true, opacity: 0.85, depthWrite: false })); s.position.set(x, y, z); s.scale.setScalar(size); s.renderOrder = 3; scene.add(s);
  C.puffs.push({ s, vx, vy, vz, t: 0, life, s0: size });
}
function brfCineTick(dt) {
  const C = BRF.cine, st = C.st; C.t += dt; const T = C.t, W = st.g.position;
  // skip: JUMP / A (a fresh press)
  const sk = !!(kb('jump') || pad.jump); if (!sk) C.skipArm = false; else if (!C.skipArm && T > 0.4) { C.t = C.dur; }
  let active = null; for (const s of C.segs) if (T >= s.t0 && T < s.t0 + s.dur + (s.me ? 1.6 : 0.5)) active = s;
  C.rigs.forEach((R, i) => {
    const s = C.segs.find(q => q.i === i), p = s ? (T - s.t0) / s.dur : -1;
    const k = p < 0 ? 0 : p < 0.18 ? smooth(0, 0.18, p) : p < 0.82 ? 1 : p < 1 ? 1 - smooth(0.82, 1, p) : 0;
    const back = p > 0.85 && p < 1 + (s && s.me ? 0.55 : 0.4) ? Math.sin(clamp((p - 0.85) / (s && s.me ? 0.7 : 0.55), 0, 1) * Math.PI) : 0;
    const look = active && active.i !== i ? clamp(Math.sin(C.rigs[active.i].a - R.a) * 0.5, -0.6, 0.6) : 0;
    brfPose(R, k, back, look + Math.sin(NOW * 0.8 + i) * 0.04);
    const rad = C.rigs.length > 1 ? 0.72 - 0.28 * Math.max(k, back * 0.6) : 0.44; R.r.root.position.set(Math.cos(R.a) * rad, Math.sin(NOW * 1.3 + i * 2) * 0.01, Math.sin(R.a) * rad);
    // the exhale: puffs from the mouth, forward and up
    if (back > 0.15 && Math.random() < dt * (s && s.me ? 40 : 22)) {
      R.r.head.getWorldPosition(_bfv); const fx = -Math.cos(R.a), fz = -Math.sin(R.a);
      brfPuff(C, _bfv.x + fx * 0.15, _bfv.y + 0.05, _bfv.z + fz * 0.15, -fx * rnd(0.3, 0.9) + rnd(-0.3, 0.3), rnd(0.4, 1.1), -fz * rnd(0.3, 0.9) + rnd(-0.3, 0.3), rnd(0.25, 0.45), rnd(1.6, 2.6));
    }
  });
  // the bong: lit while someone pulls, bubbles, the chamber fills, then it clears
  const pull = active ? clamp((T - active.t0) / active.dur, 0, 1) : 0, lit = active && pull > 0.12 && pull < 0.8;
  st.flame.visible = !!lit; if (lit) { st.flame.scale.set(0.08 + Math.random() * 0.03, 0.14 + Math.random() * 0.05, 1); }
  st.ember.material.emissiveIntensity = lerp(st.ember.material.emissiveIntensity, lit ? 3.2 : 0.4 * (active ? 1 : 0), clamp(dt * 6, 0, 1));
  const fill = active ? (pull < 0.78 ? smooth(0.15, 0.7, pull) : 1 - smooth(0.78, 0.9, pull)) : 0;
  st.smoke.material.opacity = 0.9 * fill; st.smoke.scale.y = Math.max(0.05, fill); st.smoke.position.y = 0.36 + 0.465 * Math.max(0.05, fill);
  for (const b of st.bubbles) { b.m.visible = !!lit; if (lit) { b.t += dt * rnd(1.5, 3); if (b.t > 1) b.t = 0; b.m.position.set(rnd(-0.06, 0.06), 0.14 + b.t * 0.18, rnd(-0.06, 0.06)); } }
  if (lit && (C.bubT -= dt) <= 0) { C.bubT = 0.05 + Math.random() * 0.05; try { tone(rnd(260, 520), 0.05, 0.035, 'sine', rnd(600, 900)); } catch (e) {} }
  if (active && active !== C.lastSeg) { C.lastSeg = active; try { burst(0.05, 5000, 0.08, 'highpass'); setTimeout(() => { try { burst(0.5, 2600, 0.025, 'bandpass'); } catch (e) {} }, 120); } catch (e) {} brfCaption(active.me ? 'YOUR TURN' : C.rigs[active.i].w.name, active.me ? (C.rigs.length > 1 ? 'last hit before the drop' : 'take it all in') : 'hits the bong'); }
  if (active && pull > 0.86 && !active.blown) { active.blown = true; try { burst(active.me ? 1.4 : 0.9, 700, active.me ? 0.12 : 0.07, 'lowpass'); } catch (e) {} if (active.me) { C.cough = 3; C.coughT = 0.9; brfCaption('THE DROP', 'float in · pick your spot'); } }
  if (C.cough > 0 && (C.coughT -= dt) <= 0) { C.cough--; C.coughT = 0.28; try { burst(0.12, 1300, 0.12, 'bandpass'); tone(rnd(160, 220), 0.1, 0.05, 'sawtooth', 120); } catch (e) {} }
  // the puffs drift, grow and fade
  for (let i = C.puffs.length - 1; i >= 0; i--) { const p = C.puffs[i]; p.t += dt; const q = p.t / p.life; p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt; p.vx *= 1 - dt * 0.6; p.vz *= 1 - dt * 0.6; p.s.scale.setScalar(p.s0 + q * 2.6); p.s.material.opacity = 0.85 * (1 - q * q); if (q >= 1) { scene.remove(p.s); C.puffs.splice(i, 1); } }
  // the camera: a slow orbit to start, then close on whoever's pulling, then into the cloud
  const me = C.segs[C.segs.length - 1], R0 = C.rigs[active ? active.i : 0];
  let cam, tgt;
  if (T >= 0.9 && C.rigs.length > 1) {   // squads: from above and to one side, so nobody stands in the way
    const ca = R0.a + 0.6, far = 2.8 + (active && active.me ? clamp(T - me.t0 - me.dur * 0.85, 0, 2) * 1.0 : 0);
    cam = _bfv.set(W.x + Math.cos(ca) * far, W.y + 2.5, W.z + Math.sin(ca) * far); tgt = _bfv2.set(W.x + Math.cos(R0.a) * 0.3, W.y + 1.15, W.z + Math.sin(R0.a) * 0.3);
  } else if (T < 0.9) { const a = Math.PI * 0.25 + T * 0.5; cam = _bfv.set(W.x + Math.cos(a) * 5.2, W.y + 2.6 - T * 0.6, W.z + Math.sin(a) * 5.2); tgt = _bfv2.set(W.x, W.y + 1.0, W.z); }
  else {
    const side = R0.a + 1.95, near = active && active.me ? 2.5 + clamp(T - me.t0 - me.dur * 0.85, 0, 2) * 0.9 : 2.8;
    cam = _bfv.set(W.x + Math.cos(R0.a) * 0.4 + Math.cos(side) * near, W.y + 1.5 + (active && active.me ? clamp(T - me.t0 - me.dur, 0, 2) * 0.6 : 0), W.z + Math.sin(R0.a) * 0.4 + Math.sin(side) * near);
    tgt = _bfv2.set(W.x + Math.cos(R0.a) * 0.2, W.y + 1.08, W.z + Math.sin(R0.a) * 0.2);
  }
  C.cam = C.cam || cam.clone(); C.cam.lerp(cam, clamp(dt * 2.5, 0, 1)); camera.position.copy(C.cam); camera.lookAt(tgt);
  if (Math.abs(camera.fov - 55) > 0.05) { camera.fov = 55; camera.updateProjectionMatrix(); }
  try { const gun = gunObjs[G.cur]; if (gun) gun.visible = false; } catch (e) {}
  listener.x = camera.position.x; listener.z = camera.position.z; listener.y = camera.position.y;
  // the smoke takes over the screen at the end
  const wh = $('brWhite'), endIn = C.dur - T; if (wh) wh.style.opacity = endIn < 1.2 ? clamp(1 - endIn / 1.2, 0, 1) : 0;
  if (T >= C.dur) { brfCineEnd(); brfFloatStart(); }
}

/* ---------- 3. the float in */
function brfStartSpot(team, solo) {
  const pr = PLAYRECT, cx = (pr[0] + pr[1]) / 2, cz = (pr[2] + pr[3]) / 2, half = Math.min(pr[1] - pr[0], pr[3] - pr[2]) / 2;
  const B = M.br, seed = B && B.crates && B.crates[0] ? Math.round(B.crates[0].x * 10 + B.crates[0].z * 7) : 7;
  const a = solo ? Math.random() * TAU : (seed * 0.37 + (team | 0) * 2.39996) % TAU, r = half * (solo ? rnd(0.15, 0.55) : 0.42);
  return { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r };
}
function brfFloatStart() {
  if (BRF.float || !M || !M.br) return; if (!playerAlive() && G.state !== 'playing') { const w = $('brWhite'); if (w) w.style.opacity = 0; return; }
  const sq = M.squad > 1, s = brfStartSpot(M.myTeam, !sq);
  P.x = s.x + (sq ? rnd(-3, 3) : 0); P.z = s.z + (sq ? rnd(-3, 3) : 0); P.y = brfAltStart() + rnd(0, 6); P.vx = P.vz = 0; P.vy = -4; P.onGround = false;
  const pr = PLAYRECT; P.yaw = Math.atan2(P.x - (pr[0] + pr[1]) / 2, P.z - (pr[2] + pr[3]) / 2); P.pitch = -0.62;
  BRF.float = true; BRF.fT = 0; G.health = G.maxHp || 100; G.downed = false;
  if (scene.fog) { BRF.fog0 = scene.fog.density; }
  const w = $('brWhite'); if (w) { w.style.transition = 'opacity 1.3s'; w.style.opacity = 1; requestAnimationFrame(() => { w.style.opacity = 0; setTimeout(() => { w.style.transition = ''; }, 1400); }); }
  try { showBanner('FLOAT IN', `steer: ${usingPad() ? 'left stick' : 'WASD'} · dive: hold ${actName('crouch')} · map: ${usingPad() ? 'D-pad down' : actName('map')}`); } catch (e) {}
}
function brfFogBack() { if (BRF.fog0 !== null && scene.fog) scene.fog.density = BRF.fog0; BRF.fog0 = null; }
function brfLand() {
  BRF.float = false; P.vy = 0; P.onGround = true; G.landT = 0.8; G.shake = Math.max(G.shake, 0.012); brfFogBack();
  try { sfx.thud({ vol: 0.9 }); } catch (e) {}
  try { const gun = gunObjs[G.cur]; if (gun) gun.visible = true; } catch (e) {}
  for (const p of BRF.trail) if (p.parent) p.parent.remove(p); BRF.trail = [];
  camera.fov = baseFov; camera.updateProjectionMatrix(); G.spawnProt = 1;
  let name = ''; try { const p = typeof mapPoiAt === 'function' ? mapPoiAt(P.x, P.z) : null; if (p) name = p.name; } catch (e) {}
  try { showBanner('LANDED', name ? name + ' · find a crate' : 'find a crate · watch the cloud'); } catch (e) {}
}
function brfFloatTick(dt) {
  BRF.fT += dt;
  const dive = !!(kb('crouch') || pad.crouch), fwd = clamp((kb('fwd') ? 1 : 0) - (kb('back') ? 1 : 0) - pad.my, -1, 1), str = clamp((kb('right') ? 1 : 0) - (kb('left') ? 1 : 0) + pad.mx, -1, 1);
  const gy = groundAt(P.x, P.z, P.y), agl = P.y - gy, soft = agl < 14;
  const top = dive && !soft ? 7 : soft ? 6 : 15, wx = -Math.sin(P.yaw) * fwd + Math.cos(P.yaw) * str, wz = -Math.cos(P.yaw) * fwd - Math.sin(P.yaw) * str, wl = Math.max(1, Math.hypot(wx, wz));
  P.vx = lerp(P.vx, wx / wl * top, clamp(dt * 1.8, 0, 1)); P.vz = lerp(P.vz, wz / wl * top, clamp(dt * 1.8, 0, 1));
  if (BRF.lift) { P.vy = lerp(P.vy, 16, clamp(dt * 3, 0, 1)); if (P.y >= BRF.lift) BRF.lift = 0; }   // a weed balloon going up (brfight.js)
  else P.vy = lerp(P.vy, soft ? -3.2 : dive ? -24 : -6.5, clamp(dt * (soft ? 4 : 2), 0, 1));
  P._ox = P.x; P._oz = P.z; P.x += P.vx * dt; P.z += P.vz * dt; resolve(P, 0.4, P.y, false);
  const pr = PLAYRECT, mx = (pr[1] - pr[0]) * 0.04, mz = (pr[3] - pr[2]) * 0.04; P.x = clamp(P.x, pr[0] + mx, pr[1] - mx); P.z = clamp(P.z, pr[2] + mz, pr[3] - mz);
  P.y += P.vy * dt; const g2 = groundAt(P.x, P.z, P.y + 0.5);
  if (P.y <= g2 + 0.02 || BRF.fT > 90) { P.y = Math.max(P.y, g2); if (BRF.fT > 90) P.y = g2; brfLand(); return; }
  P.eye = 1.7; G.swapT = Math.max(G.swapT, 0.3); G.nadeHold = null; G.adsOn = false; G.reloading = false;
  try { const gun = gunObjs[G.cur]; if (gun) gun.visible = false; } catch (e) {}
  // the view: wide, a lean into the turn, thinner fog up high so you can see where to go
  const fov = baseFov + (dive ? 16 : 9); camera.fov = lerp(camera.fov, fov, clamp(dt * 3, 0, 1)); camera.updateProjectionMatrix();
  camera.position.set(P.x, P.y + P.eye, P.z); BRF.roll = lerp(BRF.roll || 0, -str * 0.12, clamp(dt * 3, 0, 1)); camera.rotation.set(P.pitch, P.yaw, BRF.roll);
  if (scene.fog && BRF.fog0 !== null) scene.fog.density = BRF.fog0 * lerp(1, 0.35, clamp((agl - 10) / 60, 0, 1));
  // my little cloud under me and smoke streaking past
  if (BRF.trail.length < 26 && Math.random() < dt * (dive ? 30 : 16)) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0xf0fff2, transparent: true, opacity: 0.5, depthWrite: false })); s.position.set(P.x + rnd(-3, 3), P.y - rnd(1.5, 4), P.z + rnd(-3, 3)); s.scale.setScalar(rnd(0.6, 1.4)); s.userData.t = 0; scene.add(s); BRF.trail.push(s); }
  for (let i = BRF.trail.length - 1; i >= 0; i--) { const s = BRF.trail[i]; s.userData.t += dt; s.material.opacity = 0.5 * (1 - s.userData.t / 1.6); if (s.userData.t > 1.6 || s.position.y > P.y + 6) { scene.remove(s); BRF.trail.splice(i, 1); } }
  if (!BRF.myPuff) { BRF.myPuff = brfPuffMesh(); scene.add(BRF.myPuff); }
  BRF.myPuff.visible = true; BRF.myPuff.position.set(P.x, P.y - 0.15, P.z);
  if ((BRF.windT -= dt) <= 0) { BRF.windT = 0.32; try { burst(0.45, 380 + Math.abs(P.vy) * 30, 0.025 + Math.abs(P.vy) * 0.0015, 'lowpass'); } catch (e) {} }
  listener.x = P.x; listener.z = P.z; listener.yaw = P.yaw; listener.y = P.y + P.eye; listener.fy = P.y;
  try { $('cross').style.opacity = 0; } catch (e) {}
}
// a soft cloud to stand on (me and everyone floating)
function brfPuffMesh() {
  const g = new THREE.Group(); g.name = 'brPuff';
  for (let i = 0; i < 5; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false })); const a = i / 5 * TAU; s.position.set(i ? Math.cos(a) * 0.45 : 0, i ? -0.15 : -0.25, i ? Math.sin(a) * 0.45 : 0); s.scale.setScalar(i ? 1.0 : 1.5); g.add(s); }
  return g;
}
// updatePlayer: true = the bong or the float has the player this frame
function brfPlayer(dt) {
  if (!M || !M.br) { if (BRF.myPuff) BRF.myPuff.visible = false; return false; }
  if (BRF.cine) { brfCineTick(dt); return true; }
  if (BRF.float) { brfFloatTick(dt); return true; }
  if (BRF.myPuff) BRF.myPuff.visible = false;
  return false;
}
/* ---------- the bots float in too (the host's) */
function brfBotTarget() {
  let x, z; const pois = typeof mapPois === 'function' ? mapPois() : [];
  if (pois.length && Math.random() < 0.8) { const p = pois[(Math.random() * pois.length) | 0]; x = p.x + rnd(-p.w * 0.4, p.w * 0.4); z = p.z + rnd(-p.d * 0.4, p.d * 0.4); }
  else { const pr = PLAYRECT; x = rnd(pr[0] * 0.75, pr[1] * 0.75); z = rnd(pr[2] * 0.75, pr[3] * 0.75); }
  return openNear(x, z);
}
function brfBotsFloat() {
  const sq = M.squad > 1, lead = {};
  for (const e of enemies) {
    if (!e.entry || e.net || e.entry.alive === false) continue;
    const s = sq ? (lead[e.team] || (lead[e.team] = brfStartSpot(e.team, false))) : brfStartSpot(0, true), t = sq ? (lead['t' + e.team] || (lead['t' + e.team] = brfBotTarget())) : brfBotTarget();
    e.group.position.set(s.x + rnd(-4, 4), brfAltStart() + rnd(-4, 8), s.z + rnd(-4, 4));
    e.brFloat = { tx: t.x + (sq ? rnd(-4, 4) : 0), tz: t.z + (sq ? rnd(-4, 4) : 0), t: 0 }; e.goal = null; e.tgt = null; e.downed = false;
    if (!e.brPuff) { e.brPuff = brfPuffMesh(); e.group.add(e.brPuff); } e.brPuff.visible = true;
  }
}
// updateBots: true = this bot is floating (or waiting for the drop) this frame
function brfBot(e, dt) {
  const F = e.brFloat; if (!F) return false; if (F.wait) return true;
  const g = e.group.position; F.t += dt;
  const dx = F.tx - g.x, dz = F.tz - g.z, d = Math.hypot(dx, dz), gy = groundAt(g.x, g.z, g.y), agl = g.y - gy, soft = agl < 12;
  const sp = d < 3 ? 0 : soft ? 5 : d < 40 ? 6 : 14;
  if (d > 0.01) { g.x += dx / d * Math.min(d, sp * dt); g.z += dz / d * Math.min(d, sp * dt); e.group.rotation.y = Math.atan2(dx, dz); }
  g.y += (soft ? -3.2 : d < 40 ? -22 : -6.5) * dt;
  const r = e.rig; if (r) { r.armL.rotation.set(-0.2, 0, 1.1); r.armR.rotation.set(-0.2, 0, -1.1); r.legL.rotation.x = 0.15; r.legR.rotation.x = -0.1; }
  const g2 = groundAt(g.x, g.z, g.y + 0.5);
  if (g.y <= g2 + 0.02 || F.t > 90) {
    g.y = g2; e.brFloat = null; if (e.brPuff) e.brPuff.visible = false;
    try { if (nodeOf(g.x, g.z, g.y) < 0) { const o = openNear(g.x, g.z); g.x = o.x; g.z = o.z; g.y = groundAt(o.x, o.z, (o.y || TH(o.x, o.z)) + 1); } } catch (er) {}
    e.goal = null; e.spawnProt = 0.5;
  }
  return true;
}
// everyone else's little cloud: net players high above the ground in the first minute
function brfTick() {
  if (!M || !M.br) return; const B = M.br;
  for (const e of enemies) {
    if (!e.net || !e.group) continue; const g = e.group.position, up = B.phase >= -1 && M.t < 150 && g.y - groundAt(g.x, g.z, g.y) > 2.5;
    if (up && !e.brPuff) { e.brPuff = brfPuffMesh(); e.group.add(e.brPuff); } if (e.brPuff) e.brPuff.visible = up;
  }
}
function brfHud() {
  const B = M.br; if (!B) return null;
  if (B.phase === -3) return `<b style="color:#8fff6a">WARM-UP</b> · ${Math.ceil(B.t)} s · free respawns · kills don't count${M.online ? '' : ' · ' + actName('use') + ': start now'}`;
  if (B.phase === -2 || BRF.cine) return 'LIGHTING UP…';
  if (BRF.float) return `<b style="color:#8fff6a">FLOATING IN</b> · ${Math.max(0, Math.round(P.y - groundAt(P.x, P.z, P.y)))} m up · hold ${actName('crouch')} to dive`;
  return null;
}
(() => { const s = document.createElement('style'); s.textContent = `#brCine{position:fixed;inset:0;z-index:80;pointer-events:none;display:none}
#brCine .bt,#brCine .bb{position:absolute;left:0;right:0;height:11vh;background:#000}#brCine .bt{top:0}#brCine .bb{bottom:0}
#brCine .cap{position:absolute;left:0;right:0;bottom:12.5vh;text-align:center;font-family:inherit;text-shadow:0 2px 8px #000}
#brCine .cap b{display:block;font-size:44px;letter-spacing:6px;color:#8fff6a}#brCine .cap small{display:block;font-size:15px;letter-spacing:3px;color:#e8ffe8;opacity:.85;margin-top:4px}
#brCine .skip{position:absolute;right:24px;bottom:3.5vh;color:#aaa;font-size:13px;letter-spacing:2px}
body.brcine #hud,body.brcine #cross,body.brcine #radar,body.brcine #feed{opacity:0!important}
#brWhite{position:fixed;inset:0;z-index:79;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 55%,#f6fff6,#d8f0dc 70%,#b8d8c0)}`; document.head.appendChild(s);
  const w = document.createElement('div'); w.id = 'brWhite'; document.body.appendChild(w); })();
