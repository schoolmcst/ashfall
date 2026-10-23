/* ================================================================== ZOMBIES SPECIALS: strays, fiends, bloaters, barricaded windows
   STRAY ROUNDS: every 5th round only STRAYS come - junkie dogs that got into the Nightshade stash: fast, low, purple
     eyes, they bite. The fog thickens; the last stray drops a RE-UP.
   FIENDS (from round 4): crawlers that drag themselves along the floor. Low and easy to miss.
   BLOATERS (from round 6): swollen with Nightshade; when one dies it bursts into a cloud of purple smoke that hurts
     anyone standing in it for a few seconds.
   BARRICADED WINDOWS: windows in the outer walls are boarded up. Some zombies come in through them: they tear the
     boards off one by one, then climb in. Stand at a window and hold USE to nail boards back (+10 points a board).
     THE FIXER power-up boards up every window. Co-op: the host owns the boards (wb in its presence); a client nailing
     a board tells the host (event 'wr<window>'). */
const ZSP = { wins: [], clouds: [], fogBase: null };

/* ---------- STRAYS: a dog body that fits the zombie rig (parts the death / shadow code looks for) */
let ZDOG_MATS = null;
function zdogMats() {
  return ZDOG_MATS || (ZDOG_MATS = {
    fur: new THREE.MeshStandardMaterial({ color: 0x6a5846, roughness: 1 }), raw: new THREE.MeshStandardMaterial({ color: 0x6a1c1c, roughness: 0.8 }),
    bone: new THREE.MeshStandardMaterial({ color: 0xc8bca0, roughness: 0.7 }), eye: new THREE.MeshStandardMaterial({ color: 0x100018, emissive: new THREE.Color(0xb06cff), emissiveIntensity: 2.4 }),
    hit: new THREE.MeshBasicMaterial({ visible: false }),
  });
}
function zdogRig() {
  const M = zdogMats(), root = new THREE.Group(), body = new THREE.Group(); body.position.y = 0.62; root.add(body);
  const box = (par, w, h, d, x, y, z, m = M.fur) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; par.add(o); return o; };
  box(body, 0.34, 0.34, 0.62, 0, 0.02, -0.12); box(body, 0.3, 0.3, 0.42, 0, -0.01, 0.34); box(body, 0.2, 0.12, 0.3, 0.11, -0.08, 0.1, M.raw);   // chest, hindquarters, a raw patch
  for (let i = 0; i < 4; i++) box(body, 0.36, 0.03, 0.04, 0, 0.12, -0.3 + i * 0.09, M.bone);   // ribs showing
  const neck = new THREE.Group(); neck.position.set(0, 0.12, -0.42); body.add(neck);
  const head = new THREE.Group(); head.position.set(0, 0.06, -0.12); neck.add(head);
  box(head, 0.24, 0.22, 0.26, 0, 0, 0); box(head, 0.14, 0.12, 0.2, 0, -0.04, -0.2); box(head, 0.12, 0.04, 0.16, 0, -0.11, -0.18, M.raw);   // skull, snout, jaw
  for (const s of [-1, 1]) { box(head, 0.05, 0.12, 0.04, s * 0.08, 0.15, 0.04); box(head, 0.045, 0.045, 0.02, s * 0.065, 0.03, -0.13, M.eye); }
  const legs = [];
  for (const [x, z] of [[-0.12, -0.32], [0.12, -0.32], [-0.11, 0.42], [0.11, 0.42]]) {
    const hip = new THREE.Group(); hip.position.set(x, -0.08, z); body.add(hip);
    box(hip, 0.09, 0.3, 0.1, 0, -0.15, 0); const knee = new THREE.Group(); knee.position.y = -0.3; hip.add(knee); box(knee, 0.07, 0.26, 0.07, 0, -0.12, 0); box(knee, 0.09, 0.04, 0.12, 0, -0.25, -0.02);
    legs.push({ hip, knee });
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.1, 0.55); body.add(tail); box(tail, 0.05, 0.05, 0.3, 0, 0.05, 0.14);
  const hit = (par, w, h, d, x, y, z, ud) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.hit); o.position.set(x, y, z); o.visible = false; o.userData = Object.assign({ hitbox: true }, ud); par.add(o); return o; };
  const hits = [hit(body, 0.4, 0.42, 1.1, 0, 0, 0.05, { mult: 1, zone: 'torso' }), hit(head, 0.3, 0.28, 0.48, 0, 0, -0.08, { head: true, zone: 'head' })];
  const d = () => { const o = new THREE.Object3D(); root.add(o); return o; };   // parts the soldier death pose would move: harmless here
  return { root, body, neck, head, legs, tail, hits, flash: d(), hips: d(), torso: d(), armL: d(), armR: d(), elL: d(), elR: d(), legL: d(), legR: d(), knL: d(), knR: d(), gun: null, dog: true };
}
function makeDog(x, z, y) {
  const r = Math.max(1, Z.round), rig = zdogRig(), root = rig.root; root.rotation.order = 'YXZ'; root.position.set(x, y || 0, z); root.scale.setScalar(1.15); root.userData.scale = 1.15; scene.add(root);
  const hp = Math.round(zombHp(r) * 0.5 + 40);
  const e = { rig, group: root, type: 'zombie', zombie: true, dog: true, kind: 'run', hp, maxHp: hp, speed: rnd(5.6, 6.6), dmg: 20,
    phase: Math.random() * 6, phase0: Math.random() * 6, chk: 0.6, lastX: x, lastZ: z, avoidT: 0, avoidDir: 1, flinch: 0, aim: 0, crouchK: 0, hold: 0, atkT: 0, atkCd: rnd(0.2, 0.5), growlT: rnd(1, 4), lurch: 0, slowT: 0, noSeeT: 0 };
  e.zid = ++Z.zid; rig.hits.forEach(m => { m.userData.enemy = e; }); enemies.push(e);
  return e;
}
function animDog(e, dt, sp) {
  const r = e.rig, amp = clamp(sp / 3, 0, 1.3); e.phase += dt * (4 + sp * 2.2);
  const s = e.phase;
  r.legs.forEach((L, i) => { const ph = s + [0, 0.5, Math.PI, Math.PI + 0.5][i]; L.hip.rotation.x = Math.sin(ph) * 0.8 * amp; L.knee.rotation.x = Math.max(0, Math.sin(ph + 1.2)) * 0.9 * amp; });
  r.body.position.y = 0.62 + Math.abs(Math.sin(s)) * 0.05 * amp; r.body.rotation.x = Math.sin(s * 2) * 0.05 * amp;
  const bite = e.atkT > 0 ? Math.sin(clamp(1 - e.atkT / 0.55, 0, 1) * Math.PI) : 0;
  r.neck.rotation.x = -0.15 + bite * 0.5 + Math.sin(NOW * 6 + e.phase0) * 0.04; r.head.rotation.x = -bite * 0.4;
  r.tail.rotation.set(-0.4 + Math.sin(NOW * 9) * 0.2, Math.sin(NOW * 7 + e.phase0) * 0.3, 0);
  e.flinch = Math.max(0, e.flinch - dt * 4);
}
// FIENDS crawl: the whole body pitched forward along the floor, the arms pulling it along
function animCrawl(e, dt, sp) {
  const r = e.rig; e.phase += dt * (1.8 + sp * 2.4); const s = Math.sin(e.phase);
  e.group.rotation.x = 1.32; r.hips.position.y = 0.96;
  r.legL.rotation.set(0.1, 0, 0.12); r.legR.rotation.set(0.05, 0, -0.12); r.knL.rotation.x = 0.2 + Math.max(0, s) * 0.3; r.knR.rotation.x = 0.2 + Math.max(0, -s) * 0.3;
  r.torso.rotation.set(-0.2, s * 0.15, 0); r.head.rotation.set(-1.0, 0, 0);
  r.armR.rotation.set(-2.7 + s * 0.6, -0.2, 0.2); r.elR.rotation.set(-0.4 - Math.max(0, s) * 0.6, 0, 0);
  r.armL.rotation.set(-2.7 - s * 0.6, 0.2, -0.2); r.elL.rotation.set(-0.4 - Math.max(0, -s) * 0.6, 0, 0);
  e.flinch = Math.max(0, e.flinch - dt * 4);
}
// a zombie becomes a fiend or a bloater (later rounds)
function zspMake(e, kind) {
  if (kind === 'fiend') { e.crawl = true; e.kind = 'walk'; e.speed = rnd(1.1, 1.5); e.hp = e.maxHp = Math.round(e.maxHp * 0.8); }
  if (kind === 'bloat') {
    e.bloat = true; e.kind = 'walk'; e.speed = rnd(1.3, 1.6); e.hp = e.maxHp = Math.round(e.maxHp * 2.2); e.group.scale.set(1.45, 1.12, 1.45); e.group.userData.scale = 1.12;
    const tint = new Map(); e.group.traverse(o => { if (o.isMesh && !o.userData.hitbox) { const m = o.material; if (!tint.has(m)) { const c = (Array.isArray(m) ? m[0] : m).clone(); if (c.color) c.color.lerp(new THREE.Color(0x9aa04a), 0.5); if (c.emissive) { c.emissive.setHex(0x2a3008); c.emissiveIntensity = 0.7; } tint.set(m, c); } o.material = tint.get(m); } });
  }
}
function zspRoll(e) {
  const r = Z.round, x = Math.random();
  if (r >= 6 && x < Math.min(0.14, 0.06 + (r - 6) * 0.01)) zspMake(e, 'bloat');
  else if (r >= 4 && x < 0.3 && x > 0.16) zspMake(e, 'fiend');
}
// a stray arrives with a purple flash
function zdogSpawn(p) {
  const e = makeDog(p.x, p.z, p.y);
  try { for (let i = 0; i < 8; i++) puff(p.x + rnd(-0.5, 0.5), (p.y || 0) + 0.4 + i * 0.12, p.z + rnd(-0.5, 0.5), { color: 0xb06cff, size: 0.4, grow: 1.6, life: 1.0, vy: 1.4, op: 0.6 }); sfx.zscreech(at(p.x, p.z, 30, p.y)); } catch (err) {}
  return e;
}
// stray round start / end (called by the round code; the fog thickens while they hunt)
function zspRoundStart(r) {
  Z.dogRound = r >= 5 && r % 5 === 0;
  if (Z.dogRound) {
    const n = (typeof zcInGame === 'function' && zcInGame()) ? 1 + [...ZC.rem.values()].filter(R => R.inGame).length : 1;
    Z.toSpawn = Math.min(40, 6 + Math.round(r * 0.6) * n); Z.lastDog = null;
    showBanner(`ROUND ${r} · STRAYS`, 'junkie dogs got into the stash · watch your feet');
    try { tone(110, 2.4, 0.2, 'sawtooth', 60); tone(220, 1.6, 0.08, 'triangle', 90); } catch (e) {}
  }
  zspFog(Z.dogRound);
}
function zspFog(on) {
  if (!scene.fog) return; if (ZSP.fogBase === null) ZSP.fogBase = scene.fog.density;
  scene.fog.density = on ? ZSP.fogBase * 2.2 : ZSP.fogBase;
}
function zspRoundEnd() {
  if (Z.dogRound && Z.lastDog && typeof zpuMake === 'function') { ZPU.seq++; zpuMake(ZPU.seq, 'reup', Z.lastDog.x, Z.lastDog.z, Z.lastDog.y); }
  Z.dogRound = false; zspFog(false);
}

/* ---------- BLOATER smoke */
function zblCloud(x, z, y) {
  ZSP.clouds.push({ x, z, y: y || 0, t: 0, hurtT: 0 });
  try { sfx.explode(at(x, z, 24, y)); for (let i = 0; i < 16; i++) puff(x + rnd(-1.5, 1.5), (y || 0) + rnd(0.3, 1.6), z + rnd(-1.5, 1.5), { color: i % 2 ? 0x8a4ab0 : 0x6a8a4a, size: 0.8, grow: 2.2, life: 2.4, vy: 0.3, op: 0.55 }); } catch (e) {}
}
function zblTick(dt) {
  if (!ZSP.clouds.length) { zblTint(0); return; }
  let inside = 0;
  for (let i = ZSP.clouds.length - 1; i >= 0; i--) {
    const c = ZSP.clouds[i]; c.t += dt; if (c.t > 6) { ZSP.clouds.splice(i, 1); continue; }
    if (Math.random() < dt * 10) try { puff(c.x + rnd(-2.2, 2.2), c.y + rnd(0.2, 1.4), c.z + rnd(-2.2, 2.2), { color: Math.random() < 0.5 ? 0x8a4ab0 : 0x6a8a4a, size: 0.7, grow: 1.4, life: 2, vy: 0.15, op: 0.4 }); } catch (e) {}
    if (G.state === 'playing' && Math.hypot(P.x - c.x, P.z - c.z) < 3 && Math.abs((P.y || 0) - c.y) < 2) { inside = 1; if ((c.hurtT -= dt) <= 0) { c.hurtT = 0.5; G.killer = null; hurtPlayer(7, c.x, c.z); } }
  }
  zblTint(inside);
}
function zblTint(on) {
  let t = $('zGas'); if (!t) { if (!on) return; t = document.createElement('div'); t.id = 'zGas'; t.style.cssText = 'position:fixed;inset:0;z-index:4;pointer-events:none;background:radial-gradient(ellipse at center,rgba(120,60,160,.15),rgba(80,30,120,.55));opacity:0;transition:opacity .4s'; document.body.appendChild(t); }
  t.style.opacity = on ? 1 : 0;
}

/* ---------- BARRICADED WINDOWS */
const ZWIN_BOARDS = 5;
function zwinBuild() {
  zwinClear(); if (!zmapIs(curMap)) return;
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3e26, roughness: 0.95 }), nail = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, metalness: 0.8, roughness: 0.4 });
  (zmapCfg(curMap).windows || []).forEach((w, i) => {
    const a = w.q * Math.PI / 2, dx = Math.round(Math.sin(a)), dz = Math.round(Math.cos(a)), g = new THREE.Group(), boards = [];
    for (let k = 0; k < ZWIN_BOARDS; k++) {
      const b = new THREE.Group(), y = 1.15 + k * 0.27, tilt = [0.18, -0.12, 0.08, -0.2, 0.14][k];
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 0.05), wood); plank.castShadow = true; b.add(plank);
      for (const s of [-0.8, 0.8]) { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 6), nail); n.rotation.x = Math.PI / 2; n.position.set(s, 0, 0.03); b.add(n); }
      b.position.set(0, y - 1.15 - 0.55, 0); b.rotation.z = tilt; g.add(b); boards.push(b);
    }
    g.position.set(w.x + dx * 0.3, (w.y || 0) + 1.7, w.z + dz * 0.3); g.rotation.y = a; scene.add(g);
    ZSP.wins.push({ i, w, dx, dz, g, boards, n: ZWIN_BOARDS, occ: null, rep: 0,
      out: { x: w.x - dx * 0.75, z: w.z - dz * 0.75, y: w.y || 0 }, ins: { x: w.x + dx * 1.15, z: w.z + dz * 1.15, y: w.y || 0 } });
  });
}
function zwinClear() { for (const W of ZSP.wins) scene.remove(W.g); ZSP.wins = []; ZSP.clouds = []; zblTint(0); }
function zwinSet(W, n) { W.n = clamp(n, 0, ZWIN_BOARDS); W.boards.forEach((b, k) => { b.visible = k < W.n; }); }
function zwFixAll() { for (const W of ZSP.wins) zwinSet(W, ZWIN_BOARDS); }
// a window whose inside is close to someone (by the route) and free
function zwinPick() {
  const ok = ZSP.wins.filter(W => { if (W.occ && enemies.includes(W.occ)) return false; const d = zombRouteDist(W.ins.x, W.ins.z, W.ins.y); return d >= 8 && d <= 80; });
  return ok.length ? ok[(Math.random() * ok.length) | 0] : null;
}
function zwinSpawn(W) {
  const e = makeZombie(W.out.x, W.out.z, W.out.y); zspRoll(e);
  e.win = W; e.winT = 1.2; W.occ = e; e.group.rotation.y = Math.atan2(-W.dx, -W.dz) + Math.PI;
  return e;
}
// a zombie at a window: tear a board every 1.4 s, then climb through
function zwinThink(e, dt) {
  const W = e.win, g = e.group;
  if (e.climbT !== undefined) {
    e.climbT += dt; const k = Math.min(1, e.climbT / 0.9);
    g.position.set(W.out.x + (W.ins.x - W.out.x) * k, W.out.y + Math.sin(k * Math.PI) * 0.9, W.out.z + (W.ins.z - W.out.z) * k);
    animZombie(e, dt, 1.5);
    if (k >= 1) { g.position.y = W.ins.y; e.win = null; e.climbT = undefined; W.occ = null; e.navT = 0; e.mvx = undefined; }
    return;
  }
  g.position.set(W.out.x, W.out.y, W.out.z); g.rotation.y = Math.atan2(W.dx, W.dz) + Math.PI;
  if (W.n <= 0) { e.climbT = 0; return; }
  if ((e.winT -= dt) <= 0) {
    e.winT = 1.4; e.atkT = 0.75; zwinSet(W, W.n - 1);
    try { tone(140 + Math.random() * 40, 0.12, 0.12, 'square'); burst(0.2, 1800, 0.1, 'bandpass'); chunks('wood', new THREE.Vector3(W.w.x, (W.w.y || 0) + 1.6, W.w.z), 4, 2, 0.5); } catch (err) {}
  }
  if (e.atkT > 0) e.atkT = Math.max(0, e.atkT - dt);
  animZombie(e, dt, 0);
}
// nailing boards back on (hold USE at the window)
function zwinNear() { for (const W of ZSP.wins) { if (W.n >= ZWIN_BOARDS) continue; if (Math.hypot(P.x - W.ins.x, P.z - W.ins.z) < 1.9 && Math.abs((P.y || 0) - W.ins.y) < 1.5) return W; } return null; }
function zwinPrompt(W, held, dt) {
  if (!held) { W.rep = 0; return `BOARDED WINDOW · ${W.n} OF ${ZWIN_BOARDS} BOARDS · HOLD ${actName('use')} TO NAIL THEM BACK (+10 A BOARD)`; }
  W.rep += dt;
  if (W.rep >= 0.75) {
    W.rep = 0; zwinSet(W, W.n + 1);
    if (ZSP.repRound !== Z.round) { ZSP.repRound = Z.round; ZSP.repPts = 0; }
    if (ZSP.repPts < 500) { G.points += 10 * zpuPts(); ZSP.repPts += 10; }
    try { tone(520, 0.05, 0.12, 'square'); tone(260, 0.08, 0.1, 'square'); } catch (e) {}
    if (zcInGame() && !zcHost()) zcEvent('wr' + W.i, P);
  }
  return `NAILING BOARDS · ${W.n} OF ${ZWIN_BOARDS}`;
}
function zwinTick(dt) { zblTick(dt); }
// co-op: the host's boards, and a client's nailing
function zwinPresence(o) { o.wb = ZSP.wins.map(W => W.n); }
function zwinFromHost(H) { if (Array.isArray(H.wb)) H.wb.forEach((n, i) => { const W = ZSP.wins[i]; if (W && W.n !== (+n | 0)) zwinSet(W, +n | 0); }); }
function zwinFromEvent(type) { const m = /^wr(\d+)$/.exec(type); if (!m || !zcHost()) return; const W = ZSP.wins[+m[1]]; if (W) zwinSet(W, W.n + 1); }
