/* ================================================================== LAST TOKE FIGHTS (1.2.93)
   WEED BALLOONS: balloon stands (three green balloons on a post) at the places on the map. USE grabs one: it lifts you
     about 60 m up, then you float down again like the drop (steer, CROUCH dives). Each stand has three balloons.
   LADDERS: on the side of the walkable-roof buildings and up the lighthouse tower. Walk into one pressing forward to
     climb, CROUCH to climb down from the top, JUMP to let go.
   FOOTSTEPS: grass and dirt sound soft and dull, floors and roofs hard and sharp; running is louder.
   DAMAGE NUMBERS: how much each of your hits did, floating off the target (yellow = head). Setting DAMAGE NUMBERS:
     OFF / LAST TOKE (default) / EVERY MODE.
   DEPLOYABLE COVER: a folded shield in the floor loot; key 6 (or the field upgrade button in LAST TOKE while you carry
     one) puts it up in front of you (it is the field-upgrade cover, so it shows online too).
   THROWABLES in the floor loot replace your grenade: MOLOTOV (a fire for 7 s, burns anyone in it), FLASHBANG (the
     stun), STICKY RESIN (the semtex), HEALING SMOKE (a green cloud for 10 s that heals you and your squad inside it).
     Molotov fire and healing smoke show online (with the other smokes).
   SNIPER GLINT: a bot with a sniper rifle looking your way shows a bright glint from far off. */
const BRFG = { stands: [], ladders: [], climb: null, nums: [], fires: [], heals: [], glints: new Map(), sfxT: 0, cH: false };
const BRFG_THROW = { molotov: { n: 'MOLOTOV', col: 0xff7a1a }, stun: { n: 'FLASHBANG', col: 0xe8e8ff }, semtex: { n: 'STICKY RESIN', col: 0x6aff3a }, healsmoke: { n: 'HEALING SMOKE', col: 0x8aff9a } };
EQUIP.molotov = { name: 'MOLOTOV', desc: 'A bottle of fire: 7 s of flames where it lands.', count: 2, max: 3, fuse: 1.0, color: 0x7a3a10, glow: 0xff7a1a, brOnly: true };
EQUIP.healsmoke = { name: 'HEALING SMOKE', desc: 'A green cloud for 10 s that heals you and your squad inside it.', count: 2, max: 3, fuse: 1.2, color: 0x4a7a4a, glow: 0x8aff9a, brOnly: true };
/* ---------- the round starts: balloon stands and ladders */
// an outdoor spot near (x, z): nothing overhead, nothing in the way (balloons, beacons)
function brfgOutdoor(x, z) {
  for (let k = 0; k < 40; k++) { const a = k * 2.399, r = k * 1.6, o = openNear(x + Math.cos(a) * r, z + Math.sin(a) * r), y = groundAt(o.x, o.z, (o.y || TH(o.x, o.z)) + 0.5);
    if (y - TH(o.x, o.z) > 0.6) continue; if (!boxesNear(o.x, o.z).some(b => o.x > b.minx - 1.2 && o.x < b.maxx + 1.2 && o.z > b.minz - 1.2 && o.z < b.maxz + 1.2 && b.top > y + 0.3)) return { x: o.x, z: o.z, y }; }
  const o = openNear(x, z); return { x: o.x, z: o.z, y: groundAt(o.x, o.z, (o.y || 0) + 1) };
}
function brfgSetup() {
  BRFG.stands = []; BRFG.ladders = []; BRFG.climb = null; BRFG.fires = []; BRFG.heals = []; BRFG.glints.clear();
  if (BRFG.group && BRFG.group.parent) BRFG.group.parent.remove(BRFG.group); BRFG.group = null;
  if (!M || !M.br) return; BRFG.group = new THREE.Group(); scene.add(BRFG.group);   // (its own group: the round's group gets thinned out)
  const pois = typeof mapPois === 'function' ? mapPois() : [], post = new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.8 });
  const balMat = new THREE.MeshStandardMaterial({ color: 0x5dff7a, roughness: 0.35, emissive: 0x1a4a1a, emissiveIntensity: 0.4 }), str = new THREE.LineBasicMaterial({ color: 0xdddddd });
  for (const p of pois) {
    const o = brfgOutdoor(p.x - p.w * 0.3, p.z + p.d * 0.3), y = o.y, g = new THREE.Group(); g.position.set(o.x, y, o.z); BRFG.group.add(g);
    const pm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.4, 8), post); pm.position.y = 0.7; g.add(pm);
    const bals = []; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU, b = new THREE.Group(); b.position.set(Math.cos(a) * 0.35, 2.4 + i * 0.25, Math.sin(a) * 0.35); const s = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), balMat); s.scale.y = 1.2; b.add(s);
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), new THREE.MeshStandardMaterial({ color: 0x2a6a1a })); leaf.position.y = 0.42; b.add(leaf);
      b.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -0.38, 0), new THREE.Vector3(-Math.cos(a) * 0.35, -(1.0 + i * 0.25), -Math.sin(a) * 0.35)]), str)); g.add(b); bals.push(b); }
    BRFG.stands.push({ x: o.x, z: o.z, y, g, bals, left: 3 });
  }
  // ladders: the buildings with a walkable roof, and the lighthouse
  const lad = new THREE.MeshStandardMaterial({ color: 0x8a8e92, roughness: 0.45, metalness: 0.7 });
  for (const L of (typeof STASH_LADDERS !== 'undefined' && curMap === 'stashisle' ? STASH_LADDERS : [])) {
    const y0 = groundAt(L.x + L.nx * 0.5, L.z + L.nz * 0.5, L.y1 - 0.5 > 0 ? Math.min(L.y1 - 2, TH(L.x, L.z) + 0.5) : 0.5), h = L.y1 - y0; if (h < 2 || h > 40) continue;
    const g = new THREE.Group(); g.position.set(L.x + L.nx * 0.3, y0, L.z + L.nz * 0.3); g.rotation.y = Math.atan2(L.nx, L.nz); BRFG.group.add(g);   // on the outside face of the wall
    for (const s of [-0.24, 0.24]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, h + 0.9, 0.05), lad); r.position.set(s, (h + 0.9) / 2, 0); g.add(r); }
    for (let yy = 0.3; yy < h + 0.6; yy += 0.32) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 6), lad); r.rotation.z = Math.PI / 2; r.position.set(0, yy, 0); g.add(r); }
    BRFG.ladders.push({ x: L.x + L.nx * 0.62, z: L.z + L.nz * 0.62, nx: L.nx, nz: L.nz, y0, y1: L.y1, wx: L.x, wz: L.z });
  }
}
/* ---------- ladders (from updatePlayer: true = I'm on one this frame) */
function brfgLadder(dt) {
  if (!M || !M.br || !BRFG.ladders.length || (typeof BRF !== 'undefined' && (BRF.float || BRF.cine))) { BRFG.climb = null; return false; }
  const fwd = kb('fwd') || pad.my < -0.5, back = kb('back') || pad.my > 0.5, crouch = kb('crouch') || pad.crouch, jump = kb('jump') || pad.jump;
  let C = BRFG.climb;
  if (!C) {
    if (!playerAlive() || G.downed) return false;
    for (const L of BRFG.ladders) {
      if (Math.abs(L.x - P.x) > 3 || Math.abs(L.z - P.z) > 3) continue; const d = Math.hypot(P.x - L.x, P.z - L.z);
      if (d < 0.75 && fwd && P.y < L.y1 - 0.4 && P.y > L.y0 - 0.5) { C = BRFG.climb = { L, dir: 1 }; break; }   // at the bottom (or partway), pushing in
      const tx = L.wx - L.nx * 0.7, tz = L.wz - L.nz * 0.7;   // at the top, on the roof side
      if (Math.hypot(P.x - tx, P.z - tz) < 0.9 && Math.abs(P.y - L.y1) < 0.4 && crouch) { C = BRFG.climb = { L, dir: -1 }; P.y = L.y1 - 0.6; break; }
    }
    if (!C) return false;
  }
  const L = C.L; P.x = L.x; P.z = L.z; P.vx = P.vz = 0; P.vy = 0; P.onGround = false;
  if (jump && !BRFG.cH) { BRFG.climb = null; P.vy = 2; P.x += L.nx * 0.4; P.z += L.nz * 0.4; BRFG.cH = true; return false; } BRFG.cH = jump;
  const v = (fwd ? 3.2 : 0) - (back || crouch ? 3.2 : 0) || (C.dir < 0 ? -3.2 : 0); P.y += v * dt;
  if (P.y >= L.y1 - 0.15) { BRFG.climb = null; P.y = L.y1 + 0.02; P.x = L.wx - L.nx * 0.85; P.z = L.wz - L.nz * 0.85; P.onGround = true; return false; }   // over the top
  if (P.y <= L.y0) { BRFG.climb = null; P.y = L.y0; P.onGround = true; P.x += L.nx * 0.2; P.z += L.nz * 0.2; return false; }
  if ((BRFG.sfxT -= dt) <= 0 && v) { BRFG.sfxT = 0.32; try { tone(rnd(900, 1200), 0.03, 0.03, 'square', 600); } catch (e) {} }
  G.swapT = Math.max(G.swapT, 0.25); P.eye = 1.7;
  camera.position.set(P.x, P.y + P.eye, P.z); camera.rotation.set(P.pitch, P.yaw, 0);
  listener.x = P.x; listener.z = P.z; listener.yaw = P.yaw; listener.y = P.y + P.eye; listener.fy = P.y;
  try { showMsgOnce(`LADDER · ${actName('fwd')} up · ${actName('crouch')} down · ${actName('jump')} let go`); } catch (e) {}
  return true;
}
/* ---------- balloons */
function brfgStandTick() {
  const u = kb('use') || pad.use; if (!playerAlive() || G.downed || (typeof BRF !== 'undefined' && BRF.float)) { BRFG.uH = u; return; }
  for (const s of BRFG.stands) {
    if (!s.left || Math.hypot(s.x - P.x, s.z - P.z) > 1.8 || Math.abs(s.y - P.y) > 2) continue;
    try { showMsgOnce(`WEED BALLOON · ${actName('use')} TO FLOAT · ${s.left} LEFT`); } catch (e) {}
    if (u && !BRFG.uH) { s.left--; try { brpEvt('balloon'); } catch (e) {} const b = s.bals[s.left]; if (b) { b.userData.fly = 1; } BRF.float = true; BRF.fT = 0; BRF.lift = P.y + 60; P.y += 0.6; P.vy = 6; P.onGround = false; if (scene.fog && BRF.fog0 === null) BRF.fog0 = scene.fog.density; try { showBanner('UP, UP AND AWAY', `steer · hold ${actName('crouch')} to dive`); sfx.pickup(); } catch (e) {} }
    break;
  }
  BRFG.uH = u;
  for (const s of BRFG.stands) for (const b of s.bals) if (b.userData.fly) { b.position.y += 0.15; b.userData.fly++; if (b.userData.fly > 200) { b.visible = false; b.userData.fly = 0; } }
}
/* ---------- damage numbers */
const brfgNumsOn = () => S.dmgNums === 'all' || ((S.dmgNums === undefined || S.dmgNums === 'br') && M && (M.br || M.hh));   // LAST TOKE and HOTBOX HORDE
const _brfgDmg = damageEnemy;
damageEnemy = function (e, dmg, head, dir, boom, by = 'player') {
  const hp0 = e && e.hp, r = _brfgDmg(e, dmg, head, dir, boom, by);
  try { if (by === 'player' && e && e.group && brfgNumsOn() && dmg > 0.5 && !e.brFloat) { const done = e.net ? dmg : Math.max(0, Math.min(dmg, hp0 === undefined ? dmg : hp0 + (r ? 0 : 0))); brfgNum(e.group.position.x, e.group.position.y + 1.95, e.group.position.z, Math.round(done || dmg), head); } } catch (er) {}
  return r;
};
function brfgNum(x, y, z, n, head) {
  if (!n) return; let box = $('dmgNums'); if (!box) { box = document.createElement('div'); box.id = 'dmgNums'; document.body.appendChild(box); }
  const el = document.createElement('b'); el.textContent = n; if (head) el.className = 'hd'; box.appendChild(el);
  BRFG.nums.push({ el, x: x + rnd(-0.3, 0.3), y, z: z + rnd(-0.3, 0.3), t: 0 }); if (BRFG.nums.length > 24) { const o = BRFG.nums.shift(); o.el.remove(); }
}
const _bfn = new THREE.Vector3();
function brfgNumTick(dt) {
  for (let i = BRFG.nums.length - 1; i >= 0; i--) { const n = BRFG.nums[i]; n.t += dt; if (n.t > 0.9) { n.el.remove(); BRFG.nums.splice(i, 1); continue; }
    _bfn.set(n.x, n.y + n.t * 0.9, n.z).project(camera); const vis = _bfn.z < 1; n.el.style.display = vis ? 'block' : 'none';
    if (vis) { n.el.style.left = ((_bfn.x + 1) / 2 * innerWidth) + 'px'; n.el.style.top = ((1 - _bfn.y) / 2 * innerHeight) + 'px'; n.el.style.opacity = String(1 - Math.max(0, n.t - 0.5) / 0.4); } }
}
/* ---------- molotov fire and healing smoke (my throws, and others' through the smoke list) */
const _brfgSmk = smkCloud;
smkCloud = function (p, kind, mine) {
  if (kind === 'molotov' || kind === 'heal') { brfgCloud(p, kind, mine); if (mine) { SMK.seq++; SMK.out.push([SMK.seq, Math.round(p.x * 10) / 10, Math.round((p.y || 0) * 10) / 10, Math.round(p.z * 10) / 10, kind === 'molotov' ? 2 : 3]); while (SMK.out.length > 3) SMK.out.shift(); } return; }
  return _brfgSmk(p, kind, mine);
};
function brfgCloud(p, kind, mine) {
  const fire = kind === 'molotov', R = fire ? 3.2 : 4.2, life = fire ? 7 : 10, sp = []; const y = groundAt(p.x, p.z, (p.y || 0) + 1);
  for (let i = 0; i < (fire ? 14 : 12); i++) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * R * 0.85; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fire ? TEX.fire : TEX.smoke, color: fire ? 0xffffff : (i % 2 ? 0xb8ffc0 : 0xdcffd8), transparent: true, opacity: 0, depthWrite: false, blending: fire ? THREE.AdditiveBlending : THREE.NormalBlending }));
    const sz = fire ? rnd(0.9, 1.6) : rnd(2.6, 3.6); s.scale.set(sz, sz * (fire ? 1.4 : 1), 1); s.position.set(p.x + Math.cos(a) * r, y + (fire ? sz * 0.6 : rnd(0.6, 2.2)), p.z + Math.sin(a) * r); scene.add(s); sp.push({ s, sz, ph: Math.random() * 6 }); }
  (fire ? BRFG.fires : BRFG.heals).push({ x: p.x, z: p.z, y, R, t: 0, life, sp, mine });
  if (fire) try { explode && sfx.thud({ vol: 0.6 }); burst(1.2, 900, 0.1, 'lowpass'); } catch (e) {}
}
function brfgCloudTick(dt) {
  for (const L of [BRFG.fires, BRFG.heals]) for (let i = L.length - 1; i >= 0; i--) {
    const c = L[i], fire = L === BRFG.fires; c.t += dt; const k = Math.min(1, c.t / 0.4) * (c.t > c.life - 1.5 ? Math.max(0, (c.life - c.t) / 1.5) : 1);
    for (const q of c.sp) { q.s.material.opacity = k * (fire ? 0.85 + Math.sin(NOW * 14 + q.ph) * 0.15 : 0.55); if (fire) q.s.scale.y = q.sz * (1.3 + Math.sin(NOW * 9 + q.ph) * 0.25); }
    if (c.t >= c.life) { for (const q of c.sp) scene.remove(q.s); L.splice(i, 1); continue; }
    const inMe = playerAlive() && Math.hypot(P.x - c.x, P.z - c.z) < c.R && Math.abs(P.y - c.y) < 2.5;
    if (fire) {
      if (inMe) { G.lastHit = G.time; G.killer = G.killer || 'fire'; G.spawnProt = 0; try { hurtPlayer(14 * dt, c.x, c.z, true); } catch (e) {} }
      if (c.mine || !M.online || netHostNow()) for (const e of enemies.slice()) if (!e.net && !e.brFloat && Math.hypot(e.group.position.x - c.x, e.group.position.z - c.z) < c.R && Math.abs(e.group.position.y - c.y) < 2.5 && !(c.mine && isFriend(e))) try { damageEnemy(e, 18 * dt, false, null, true, c.mine ? 'player' : 'world'); } catch (er) {}
    } else {
      if (inMe && (c.mine || M.squad > 1)) G.health = Math.min(G.maxHp || 100, G.health + 10 * dt);
      for (const e of enemies) if (!e.net && (c.mine ? isFriend(e) : true) && e.entry && Math.hypot(e.group.position.x - c.x, e.group.position.z - c.z) < c.R) e.hp = Math.min(e.maxHp || 100, e.hp + 10 * dt);
    }
  }
}
const _brfgDet = detonate;
detonate = function (g) {
  if (g.kind === 'molotov') { const p = g.m.position.clone(); smkCloud(p, 'molotov', g.by === undefined || g.by === 'player'); return; }
  if (g.kind === 'healsmoke') { const p = g.m.position.clone(); smkCloud(p, 'heal', g.by === undefined || g.by === 'player'); return; }
  return _brfgDet(g);
};
/* ---------- deployable cover: the field upgrade's cover, from a floor-loot item */
function brfgCover() {
  if (!M || !M.br || !(BRL.covers > 0) || !playerAlive() || G.downed) return false;
  const c = activeClass(), fu0 = c.fu, ch = FU.charge; c.fu = 'cover'; FU.charge = 1;
  try { _brfgFu(); } finally { c.fu = fu0; FU.charge = ch; }
  BRL.covers--; try { showMsg(`COVER UP · ${BRL.covers} LEFT`); } catch (e) {} return true;
}
const _brfgFu = fuUse;
fuUse = function () { if (M && M.br && BRL.covers > 0) { brfgCover(); return; } return _brfgFu(); };
/* ---------- sniper glint */
function brfgGlintTick() {
  const seen = new Set();
  for (const e of enemies) {
    if (!e.entry || isFriend(e) || e.downed || !e.gunId || !ARM[e.gunId] || ARM[e.gunId].cat !== 'sr') continue;
    const g = e.group.position, d = Math.hypot(P.x - g.x, P.z - g.z); if (d < 30 || d > 220) continue;
    const look = Math.atan2(P.x - g.x, P.z - g.z), dy = Math.abs(((e.group.rotation.y - look) % TAU + TAU + Math.PI) % TAU - Math.PI); if (dy > 0.35 || !(e.tgt === 'P' || e.aim > 0.5)) continue;
    seen.add(e); let s = BRFG.glints.get(e); if (!s) { s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0xfff6d0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: true })); scene.add(s); BRFG.glints.set(e, s); }
    s.position.set(g.x, g.y + 1.55, g.z); const k = d * 0.018 * (0.75 + Math.sin(NOW * 7) * 0.25); s.scale.set(k, k * 0.6, 1); s.material.opacity = 0.9;
  }
  for (const [e, s] of BRFG.glints) if (!seen.has(e)) { scene.remove(s); BRFG.glints.delete(e); }
}
/* ---------- footsteps by surface */
const _brfgStep = sfx.step;
sfx.step = function (v, o) {
  const r = _brfgStep.apply(this, arguments);
  try { if (!o && M && inMatch() && typeof TERR !== 'undefined') { const soft = TERR.on && P.y - TH(P.x, P.z) < 0.12; const run = Math.hypot(P.vx, P.vz) > 6.5, k = (v || 0.6) * (run ? 1.35 : 1);
    if (soft) burst(0.07, 520, 0.05 * k, 'lowpass'); else { burst(0.03, 3200, 0.035 * k, 'highpass'); tone(rnd(140, 190), 0.03, 0.02 * k, 'triangle', 90); } } } catch (e) {}
  return r;
};
/* ---------- every frame in a LAST TOKE round (from brUpdate) */
function brfgTick(dt) {
  if (!M || !M.br) return;
  brfgStandTick(); brfgCloudTick(dt); brfgGlintTick();
  const k6 = kb('deploy'); if (k6 && !BRFG.dH) brfgCover(); BRFG.dH = k6;
}
// the clouds and numbers go at the end of the round
function brfgClear() { if (BRFG.group && BRFG.group.parent) BRFG.group.parent.remove(BRFG.group); BRFG.group = null; for (const L of [BRFG.fires, BRFG.heals]) { for (const c of L) for (const q of c.sp) scene.remove(q.s); L.length = 0; } for (const [, s] of BRFG.glints) scene.remove(s); BRFG.glints.clear(); for (const n of BRFG.nums) n.el.remove(); BRFG.nums = []; BRFG.climb = null; }
{ let t0 = performance.now(); const loop = t => { const dt = Math.min(0.1, (t - t0) / 1000); t0 = t; try { if (BRFG.nums.length) brfgNumTick(dt); } catch (e) {} requestAnimationFrame(loop); }; requestAnimationFrame(loop); }   // the numbers move every frame, in any mode
(() => { const s = document.createElement('style'); s.textContent = `#dmgNums{position:fixed;inset:0;pointer-events:none;z-index:6}#dmgNums b{position:absolute;transform:translate(-50%,-50%);font-size:17px;font-weight:800;color:#fff;text-shadow:0 1px 3px #000,0 0 6px rgba(0,0,0,.6);letter-spacing:1px}#dmgNums b.hd{color:#ffd23a;font-size:20px}`; document.head.appendChild(s); })();
