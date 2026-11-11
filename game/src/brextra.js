/* ================================================================== LAST TOKE: WEED DECOY, END-OF-ROUND AWARDS, THE JOINT REVIVE (1.2.95)
   WEED DECOY (a throwable in the floor loot): where it lands a see-through green smoke copy of a soldier gets up and
     runs the way you threw it for 8 s. Bots near it think it's you: they turn and fire at it (no damage), then it
     bursts into smoke.
   AWARDS on the LAST TOKE results: MOST DAMAGE, BEST LANDING (the quickest first kill after landing), LOOT GOBLIN (the
     most things picked up: crates, floor loot, stash boxes) and, when the winner never fired a killing shot, PACIFIST.
   THE JOINT REVIVE: reviving a squadmate you crouch over them with a lit joint in your hand (your gun goes away); they
     lift their head, take a hit and blow out a cloud when they get up. When a bot picks you up, the joint comes in from
     the side of your screen and everything goes a little green and hazy. */
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
/* ---------- the joint revive */
function brxJointMesh() {
  const g = new THREE.Group(), paper = new THREE.MeshStandardMaterial({ color: 0xf2eee4, roughness: 0.9 }), tip = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, emissive: 0xff5a10, emissiveIntensity: 2.5 }), hand = new THREE.MeshStandardMaterial({ color: 0xc89a78, roughness: 0.8 });
  const j = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.009, 0.085, 10), paper); j.rotation.z = Math.PI / 2 - 0.25; g.add(j);
  const t = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 8, 6), tip); t.position.set(-0.042, -0.011, 0); g.add(t); g.userData.tip = t;
  const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.022, 0.03), hand); f.position.set(0.035, -0.012, 0); g.add(f);
  return g;
}
function brxReviveTick(dt) {
  const mine = typeof SQ !== 'undefined' && SQ.revT > 0 && SQ.revWho && SQ.revWho.downed, helped = G.downed && enemies.some(e => e.team === M.myTeam && !e.downed && e.revT > 0.05 && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 1.9);
  const on = playerAlive() && (mine || helped);
  if (on && !BRX.joint && typeof viewmodel !== 'undefined' && viewmodel) { BRX.joint = brxJointMesh(); viewmodel.add(BRX.joint); BRX.jT = 0; }
  if (BRX.joint) {
    BRX.jT += dt; const J = BRX.joint, k = Math.min(1, BRX.jT / 0.35);
    if (!on) { if (J.parent) J.parent.remove(J); BRX.joint = null; try { const gun = gunObjs[G.cur]; if (gun) gun.visible = true; } catch (e) {} }
    else {
      try { const gun = gunObjs[G.cur]; if (gun) gun.visible = false; } catch (e) {}
      if (mine) J.position.set(0.05, -0.13 + 0.03 * k, -0.28 - 0.08 * k); else J.position.set(0.32 - 0.24 * k, -0.1, -0.26);   // held out to them / coming in from the side
      J.rotation.set(0, 0.3, Math.sin(NOW * 2) * 0.05); J.userData.tip.material.emissiveIntensity = 2 + Math.sin(NOW * 13) * 0.8;
      if (Math.random() < dt * 6) try { brsqPuff((mine ? SQ.revWho.group.position.x : P.x), (mine ? SQ.revWho.group.position.y + 0.5 : P.y + 1.4), (mine ? SQ.revWho.group.position.z : P.z), 1); } catch (e) {}
    }
  }
  // the downed squadmate lifts their head and takes it
  if (mine) { const r = SQ.revWho.rig, pr = SQ.revT / (typeof SQ_REVIVE !== 'undefined' ? SQ_REVIVE : 2.4); if (r) { r.head.rotation.x = -0.7 * Math.min(1, pr * 2); r.armR.rotation.set(-2.2 * Math.min(1, pr * 1.6), 0, -0.3); r.elR.rotation.x = -1.6 * Math.min(1, pr * 1.6); } }
  // the haze when a bot is getting me up
  BRX.haze = lerp(BRX.haze, helped ? 0.35 : 0, clamp(dt * 3, 0, 1)); const h = $('brxHaze'); if (h) h.style.opacity = BRX.haze.toFixed(3);
}
/* ---------- every frame (from brUpdate) and the round's start */
function brxTick(dt) {
  if (!M || !M.br) return; brxPuppetTick(dt); brxReviveTick(dt);
  for (const en of M.entries) if ((en.kills | 0) > 0 && en.firstKillT === undefined) en.firstKillT = M.t;
}
function brxSetup() { for (const q of BRX.puppets) scene.remove(q.r.root); BRX.puppets = []; BRX.dmg.clear(); BRX.loot.clear(); if (M) for (const en of M.entries) { en.landT = undefined; en.firstKillT = undefined; } }
(() => { const s = document.createElement('style'); s.textContent = `.brx-aw{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0 0 12px}.brx-aw div{border:1px solid rgba(143,255,106,.35);background:rgba(20,40,20,.55);padding:8px 10px}.brx-aw small{display:block;color:#8fff6a;letter-spacing:2px;font-size:11px}.brx-aw b{display:block;font-size:17px;margin:2px 0}.brx-aw span{font-size:12px;opacity:.75}
#brxHaze{position:fixed;inset:0;pointer-events:none;z-index:5;opacity:0;background:radial-gradient(circle at 50% 50%,rgba(170,255,170,.25),rgba(80,160,80,.75))}`; document.head.appendChild(s);
  const h = document.createElement('div'); h.id = 'brxHaze'; document.body.appendChild(h); })();
