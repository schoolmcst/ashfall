/* ================================================================== PROP HUNT (1.2.68)
   Two teams, HUNTERS and PROPS, and every two minutes they swap. A prop is a crate, a barrel, a stash jar, a bong, a
   potted plant... (USE changes it, RELOAD turns it) seen from behind (third person), and it cannot shoot. The hunters
   are blind for the first 20 seconds of every swap while the props hide, and every shot that hits nothing costs a hunter
   4 health. A prop caught is a point for the hunters; every 10 seconds each prop still standing is a point for the props.
   Props respawn as props, hunters as hunters. Highest score when the time runs out wins.
   Bots: props walk to a hiding spot and freeze (turning now and then); hunters wander and only shoot a prop they have
   watched long enough to suspect (moving props are spotted much faster).
   Online: the host runs the clock and the scores and sends ['q', hunting team, time left, score A, score B]; everyone
   sends what they are disguised as in their presence (ph), so every machine draws the same props. */
const PH_SWAP = 120, PH_HIDE = 20, PH_TICK = 10, PH_MISS = 4;
const PH_KINDS = [
  { n: 'CRATE', w: 0.9, h: 0.9, d: 0.9 }, { n: 'BARREL', w: 0.62, h: 0.9, d: 0.62 }, { n: 'TRASH CAN', w: 0.56, h: 0.82, d: 0.56 }, { n: 'TIRE STACK', w: 0.72, h: 0.66, d: 0.72 },
  { n: 'POTTED PLANT', w: 0.7, h: 1.15, d: 0.7 }, { n: 'STASH JAR', w: 0.6, h: 0.78, d: 0.6 }, { n: 'MINI FRIDGE', w: 0.62, h: 0.95, d: 0.62 }, { n: 'TRAFFIC CONE', w: 0.5, h: 0.72, d: 0.5 }, { n: 'BIG BONG', w: 0.5, h: 1.2, d: 0.5 },
];
const PHM = {};
function phMats() {
  if (PHM.wood) return PHM; const s = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75 }, o || {}));
  Object.assign(PHM, { wood: MAT.wood || s(0x8a6a40), red: (MAT.barrel && MAT.barrel.red) || s(0xa8442c), steel: MAT.steel || s(0x6a7076, { metalness: 0.7 }), rubber: s(0x1a1a1a, { roughness: 0.95 }), pot: s(0xb85a34), leaf: MAT.leaf || s(0x3a7a2a),
    glass: s(0xbfe8d8, { transparent: true, opacity: 0.45, roughness: 0.05 }), bud: s(0x4a8a2a), lid: s(0x1a1a1a), white: s(0xe8e8e4, { roughness: 0.5 }), orange: s(0xe86a1a), stripe: s(0xf2f2f2) });
  return PHM;
}
// a prop as a mesh group (origin on the floor)
function phMesh(k) {
  const M_ = phMats(), g = new THREE.Group(), add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y, z || 0); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  switch (k) {
    case 0: add(new THREE.BoxGeometry(0.9, 0.9, 0.9), M_.wood, 0, 0.45); for (const y of [0.15, 0.75]) add(new THREE.BoxGeometry(0.92, 0.08, 0.92), M_.wood, 0, y); break;
    case 1: add(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 16), M_.red, 0, 0.45); for (const y of [0.28, 0.62]) add(new THREE.CylinderGeometry(0.315, 0.315, 0.04, 16), M_.red, 0, y); break;
    case 2: add(new THREE.CylinderGeometry(0.27, 0.24, 0.78, 14), M_.steel, 0, 0.39); add(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 14), M_.steel, 0, 0.8); break;
    case 3: for (let i = 0; i < 3; i++) { const t = add(new THREE.TorusGeometry(0.26, 0.1, 8, 18), M_.rubber, 0, 0.1 + i * 0.21); t.rotation.x = Math.PI / 2; } break;
    case 4: add(new THREE.CylinderGeometry(0.3, 0.24, 0.45, 14), M_.pot, 0, 0.22); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, c = add(new THREE.ConeGeometry(0.13, 0.7, 6), M_.leaf, Math.cos(a) * 0.12, 0.75, Math.sin(a) * 0.12); c.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); } add(new THREE.ConeGeometry(0.16, 0.6, 6), M_.leaf, 0, 0.85); break;
    case 5: add(new THREE.CylinderGeometry(0.28, 0.28, 0.68, 18), M_.glass, 0, 0.34); add(new THREE.SphereGeometry(0.2, 12, 9), M_.bud, 0, 0.3); add(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 18), M_.lid, 0, 0.73); break;
    case 6: add(new THREE.BoxGeometry(0.62, 0.95, 0.62), M_.white, 0, 0.475); add(new THREE.BoxGeometry(0.04, 0.3, 0.04), M_.steel, 0.22, 0.6, 0.32); break;
    case 7: add(new THREE.BoxGeometry(0.5, 0.05, 0.5), M_.orange, 0, 0.025); add(new THREE.ConeGeometry(0.2, 0.68, 14), M_.orange, 0, 0.38); add(new THREE.CylinderGeometry(0.12, 0.14, 0.08, 14), M_.stripe, 0, 0.42); break;
    default: add(new THREE.SphereGeometry(0.24, 14, 10), M_.glass, 0, 0.24); add(new THREE.CylinderGeometry(0.09, 0.1, 0.9, 12), M_.glass, 0, 0.72); { const s = add(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8), M_.steel, 0.12, 0.3); s.rotation.z = -0.8; } add(new THREE.SphereGeometry(0.18, 12, 9), new THREE.MeshStandardMaterial({ color: 0x3a8a3a, transparent: true, opacity: 0.6 }), 0, 0.22);
  }
  g.userData.ph = k; return g;
}
const phRoleOf = team => (M.ph && team === M.ph.hunt ? 'hunt' : 'prop');
const phMeProp = () => !!(M && M.ph && phRoleOf(M.myTeam) === 'prop');
const phHiding = () => !!(M && M.ph && M.ph.t > PH_SWAP - PH_HIDE);
function phSetup() {
  M.ph = { hunt: 0, t: PH_SWAP, tick: PH_TICK, kind: (Math.random() * PH_KINDS.length) | 0, rot: 0, me: null, swaps: 0 };
  if (!$('phBlind')) { const d = document.createElement('div'); d.id = 'phBlind'; d.innerHTML = '<b></b><small></small>'; ($('hud') || document.body).appendChild(d);
    const s = document.createElement('style'); s.textContent = '#phBlind{position:fixed;inset:0;background:#000;display:none;align-items:center;justify-content:center;flex-direction:column;z-index:6;pointer-events:none}#phBlind b{font-size:44px;letter-spacing:.2em;color:#fff}#phBlind small{margin-top:10px;font-size:14px;letter-spacing:.24em;color:#9aa}'; document.head.appendChild(s); }
  phAnnounce();
}
function phAnnounce() { try { const me = phRoleOf(M.myTeam); showBanner(me === 'hunt' ? 'YOU ARE HUNTING' : 'YOU ARE A PROP', me === 'hunt' ? `find the props · the props hide for ${PH_HIDE} s · a missed shot costs ${PH_MISS} health` : `hide! ${actName('use')} changes your prop · ${actName('reload')} turns it`); sfx.streak(); } catch (e) {} }
// dress or undress an actor (a bot or another player): the soldier's meshes hidden and a prop with one hitbox in their place
function phDress(e, k) {
  if (e.phK === k) return; const root = e.group;
  if (e.phG) { root.remove(e.phG); e.phG = null; }
  if (k === null || k === undefined || k < 0) { root.traverse(o => { if (o.isMesh && o.userData.phHid) { o.visible = true; o.userData.phHid = false; } }); if (e.phHits0) { e.rig.hits = e.phHits0; e.phHits0 = null; } e.phK = null; return; }
  root.traverse(o => { if (o.isMesh && o.visible && !o.userData.hitbox) { o.visible = false; o.userData.phHid = true; } });
  const pk = PH_KINDS[k] || PH_KINDS[0], pg = phMesh(k), sc = 1 / ((root.userData && root.userData.scale) || root.scale.x || 1);
  pg.scale.setScalar(sc); root.add(pg); e.phG = pg;
  const hb = new THREE.Mesh(new THREE.BoxGeometry(pk.w, pk.h, pk.d), new THREE.MeshBasicMaterial({ visible: false })); hb.position.y = pk.h / 2; hb.userData = { enemy: e, mult: 1, hitbox: true }; pg.add(hb);
  if (!e.phHits0) e.phHits0 = e.rig.hits; e.rig.hits = [hb]; e.phK = k;
  if (e.rig.flash) e.rig.flash.visible = false;
}
// my own prop: a mesh in the world that follows me (I see it from behind)
function phMeDress(k) {
  const ph = M.ph; if (ph.me && ph.me.userData.ph === k) return;
  if (ph.me) { scene.remove(ph.me); ph.me = null; }
  if (k === null) return; ph.me = phMesh(k); scene.add(ph.me);
}
function phUpdate(dt) {
  const ph = M.ph; if (!ph) return; const host = !M.online || (NET.room && NET.room.host);
  if (!host) netObjApply();   // the host's clock, roles and scores (1.2.82: this was missing, so a joiner's hide countdown never moved)
  if (host) {
    ph.t -= dt;
    if (ph.t <= 0) { ph.t = PH_SWAP; ph.hunt = 1 - ph.hunt; ph.swaps++; phSwapRespawn(); }
    if (!phHiding() && (ph.tick -= dt) <= 0) { ph.tick = PH_TICK; const props = 1 - ph.hunt; let n = (M.myTeam === props && playerAlive() ? 1 : 0); for (const e of enemies) if (e.entry && e.entry.alive !== false && e.team === props) n++; M.teamScore[props] += n; if (n) try { if (M.myTeam === props) popScore('+' + n, '', 'PROPS STILL STANDING'); } catch (er) {} }
  }
  if (ph.lastHunt !== undefined && ph.lastHunt !== ph.hunt) { phAnnounce(); if (!host) phSwapRespawn(); }
  ph.lastHunt = ph.hunt;
  // dress everyone the right way
  for (const e of enemies) {
    if (!e.entry) continue; let k = null;
    if (phRoleOf(e.team) === 'prop' && e.entry.alive !== false) { if (e.net) { const R = NET.rem.get(e.net); k = R && R.ph >= 0 ? R.ph : null; } else { if (e.phPick === undefined || e.phPickSwap !== ph.swaps) { e.phPick = (Math.random() * PH_KINDS.length) | 0; e.phPickSwap = ph.swaps; e.phRot = ((Math.random() * 4) | 0) * Math.PI / 2; } k = e.phPick; } }
    phDress(e, k); if (e.phG) e.phG.rotation.y = (e.phRot || 0) - e.group.rotation.y;
  }
  const meProp = phMeProp() && playerAlive();
  const u = kb('use') || (typeof pad !== 'undefined' && pad.use), r = kb('reload'); if (meProp && u && !ph.uH) phKey('use'); if (meProp && r && !ph.rH) phKey('reload'); ph.uH = u; ph.rH = r;
  for (const e of enemies) { const p = e.group.position; e.phMove = e.phLx === undefined ? 0 : Math.hypot(p.x - e.phLx, p.z - e.phLz) / Math.max(dt, 1e-3); e.phLx = p.x; e.phLz = p.z; }
  phMeDress(meProp ? ph.kind : null);
  if (ph.me) { ph.me.position.set(P.x, P.y || 0, P.z); ph.me.rotation.y = ph.rot; }
  // the hunters' blindfold
  const bl = $('phBlind'), blind = phHiding() && phRoleOf(M.myTeam) === 'hunt' && G.state === 'playing';
  if (bl) { bl.style.display = blind ? 'flex' : 'none'; if (blind) { bl.children[0].textContent = Math.ceil(ph.t - (PH_SWAP - PH_HIDE)); bl.children[1].textContent = 'THE PROPS ARE HIDING · YOU ARE RELEASED IN'; } }
  if (blind) { P.vx = 0; P.vz = 0; mouseDown = false; }
}
// a swap: everyone back to a spawn with their new role
function phSwapRespawn() {
  try { if (playerAlive()) respawnPlayer(); } catch (e) {}
  for (const e of enemies) if (e.entry && !e.net && e.entry.alive !== false) { try { relocateEnemy(e); e.tgt = null; e.goal = null; e.phSpot = null; e.phSus = new Map(); } catch (er) {} }
}
// my controls as a prop (USE changes it, RELOAD turns it); returns true when the key was used
function phKey(act) {
  if (!phMeProp() || !playerAlive()) return false;
  if (act === 'use') { M.ph.kind = (M.ph.kind + 1) % PH_KINDS.length; showMsg(`YOU ARE A ${PH_KINDS[M.ph.kind].n}`); try { sfx.ui(); } catch (e) {} return true; }
  if (act === 'reload') { M.ph.rot += Math.PI / 2; return true; }
  return false;
}
// a hunter's shot that hit no one
function phMissed() { if (!M.ph || phRoleOf(M.myTeam) !== 'hunt' || phHiding() || !playerAlive()) return; G.lastHit = G.time; if (G.health - PH_MISS > 0) { G.health -= PH_MISS; try { vig.style.opacity = 0.35; setTimeout(() => { vig.style.opacity = 0; }, 120); } catch (e) {} } else { G.spawnProt = 0; try { hurtPlayer(999, P.x + 0.01, P.z + 0.01); } catch (e) {} } }   // spawn protection does not save you from your own misses
/* ---------- bots */
function phBotAct(e, dt) {
  if (!M.ph || e.net) return false; const ph = M.ph, role = phRoleOf(e.team), g = e.group.position;
  if (role === 'prop') {
    e.tgt = null;
    if (!e.phSpot) { const pts = [].concat(LAYOUT.hp || [], LAYOUT.sites || [], (MAPS[curMap] && MAPS[curMap].navPts) || []).filter(q => q && q.x !== undefined); const q = pts[(Math.random() * pts.length) | 0] || { x: g.x, z: g.z }; const o = openNear(q.x + rnd(-4, 4), q.z + rnd(-4, 4)); e.phSpot = { x: o.x, z: o.z, y: q.y || 0 }; }
    const d = Math.hypot(e.phSpot.x - g.x, e.phSpot.z - g.z);
    if (d > 1.2 && phHiding()) { e.goal = e.phSpot; return false; }   // still getting there
    e.goal = null; if (Math.random() < dt * 0.04) e.phRot = (e.phRot || 0) + Math.PI / 2;
    return true;   // frozen in place
  }
  // hunter: blind at first, then suspicious of props it watches (moving ones much faster)
  if (phHiding()) { e.tgt = null; e.goal = null; return true; }
  e.phSus = e.phSus || new Map();
  const cands = []; if (playerAlive() && M.myTeam !== e.team) cands.push(['P', P.x, P.z, P.y || 0, Math.hypot(P.vx || 0, P.vz || 0)]);
  for (const o of enemies) if (o.entry && o.team !== e.team && o.entry.alive !== false) { const p = o.group.position; cands.push([o, p.x, p.z, p.y, o.phMove || 0]); }
  let best = null, bs = 0;
  for (const [t, x, z, y, mv] of cands) {
    const dd = Math.hypot(x - g.x, z - g.z); if (dd > 18) { e.phSus.delete(t); continue; }
    if (!gridClear(g.x, g.z, x, z, g.y, y)) continue;
    const s = (e.phSus.get(t) || 0) + dt * (mv > 0.5 ? 1.4 : 0.16) * (1 + (e.iq || 0.5)) * (dd < 5 ? 2 : 1); e.phSus.set(t, s);
    if (s > bs) { bs = s; best = t; }
  }
  if (bs < 1) e.tgt = null; else if (best) e.tgt = best;
  if (!e.tgt && (!e.goal || Math.random() < dt * 0.1)) { const pts = [].concat(LAYOUT.hp || [], (MAPS[curMap] && MAPS[curMap].navPts) || []).filter(q => q && q.x !== undefined); const q = pts[(Math.random() * pts.length) | 0]; if (q) e.goal = { x: q.x, z: q.z, y: q.y || 0 }; }
  return false;
}
function phHud() {
  const ph = M.ph, me = phRoleOf(M.myTeam), left = Math.ceil(ph.t), hide = phHiding();
  return me === 'prop' ? `YOU ARE A <b>${PH_KINDS[ph.kind].n}</b> · ${actName('use')} CHANGE · ${actName('reload')} TURN · ${hide ? 'HIDE NOW' : 'STAY STILL'} · SWAP IN ${left} s`
    : `${hide ? 'BLIND' : 'HUNTING'} · ${PH_MISS} HP A MISSED SHOT · SWAP IN ${left} s`;
}
function phPack() { const ph = M.ph; return ['q', ph.hunt, Math.round(ph.t * 10) / 10, M.teamScore[0], M.teamScore[1], ph.swaps]; }
function phApply(o) { const ph = M.ph; if (!ph) return; ph.hunt = o[1] | 0; ph.t = +o[2] || 0; M.teamScore[0] = o[3] | 0; M.teamScore[1] = o[4] | 0; ph.swaps = o[5] | 0; }
function phClear() { if (M && M.ph && M.ph.me) scene.remove(M.ph.me); const bl = $('phBlind'); if (bl) bl.style.display = 'none'; }
