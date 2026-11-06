/* ================================================================== KNIFE FIGHT, ESCORT THE PLUG, THE HEIST, GROW WARS (1.2.86)
   KNIFE FIGHT ('kf' / 'okf'): free-for-all with melee and throwing knives only. You carry 2 knives (a kill gives one back,
     and one comes back every 10 s, up to 3). Bots charge in and stab. First to 25.
   ESCORT THE PLUG ('plug' / 'oplug'): two teams take turns attacking. Each round one attacker is THE PLUG (200 health, a
     pistol, marked for everyone): get the Plug into the enemy's base (the extraction ring) within 2 minutes. Defenders win
     the round by killing the Plug or running the clock out. Everyone else respawns. First to 4 rounds.
   THE HEIST ('heist' / 'oheist'): four rounds of 150 s, the teams swap each round. Six stash bags sit in the VAULT; the
     attackers grab one each (you carry it, a bit slower, and you're marked) and run it to their GETAWAY VAN. A carrier who
     dies drops the bag: an attacker can pick it up, a defender who touches it sends it back to the vault. Every bag
     delivered is a point; most points after four rounds wins.
   GROW WARS ('grow' / 'ogrow'): five grow spots (TURF WAR's), but a spot only scores once its plant has grown: nothing for
     the first 20 s after you take it, 1 point a second after that, 2 once it's been yours for 50 s. Losing a spot kills
     the plant. First to 300.
   Online: the host runs the rounds, the Plug, the bags and the clocks and sends them in the mode pack ('X' plug, 'Y'
   heist); GROW WARS uses TURF WAR's pack. */
/* ---------- KNIFE FIGHT */
function kfArm() { try { equipClass({ only: 'sidearm', e: 'knife', k: 'none', factory: true }); } catch (e) {} for (const w of WEAPONS) { w.ammo = 0; w.reserve = 0; } G.equip = 'knife'; G.grenades = 2; M.kf.armed = true; M.kf.k = G.kills; M.kf.refT = 10; }
function kfTick(dt) {
  const K = M.kf, alive = playerAlive();
  if (alive && !K.armed) kfArm(); if (!alive) K.armed = false;
  if (alive) { for (const w of WEAPONS) { w.ammo = 0; w.reserve = 0; } G.equip = 'knife'; if (G.kills > K.k) { G.grenades = Math.min(3, G.grenades + (G.kills - K.k)); K.k = G.kills; } if ((K.refT -= dt) <= 0) { K.refT = 10; G.grenades = Math.min(3, G.grenades + 1); } }
  for (const e of enemies) if (e.entry && !e.net) { e.hold = 1.0; e.speed = Math.max(e.speed || 0, 5.4); }
}
const kfCanFire = (e, dist) => !M.kf || dist < 2.2;
// a bot "fires": a stab, only up close, never misses
function kfStab(e, t) {
  e.lastShotT = M.t; e.cd = 0.7;
  try { sfx.melee ? sfx.melee(at(e.group.position.x, e.group.position.z, 12)) : sfx.thud({ vol: 0.6 }); } catch (er) {}
  if (t === 'P') { if (!(G.spawnProt > 0)) { G.killer = e; hurtPlayer(70, e.group.position.x, e.group.position.z); } return; }
  damageEnemy(t, 70, false, null, false, e);
}
/* ---------- ESCORT THE PLUG */
const PLUG_T = 120, PLUG_R = 3.2;
function plugBase(team) { const f = LAYOUT.flags[team] || LAYOUT.spawn[team] || { x: 0, z: 0 }; return { x: f.x, z: f.z, y: f.y || 0 }; }
function plugSetup() {
  if (!OBJ.group) { OBJ.group = new THREE.Group(); scene.add(OBJ.group); }
  M.plug = { round: 0, att: 0, t: PLUG_T, state: 'live', who: null, wait: 0, ring: null };
  const g = new THREE.Mesh(new THREE.RingGeometry(PLUG_R - 0.3, PLUG_R, 48), new THREE.MeshBasicMaterial({ color: 0xff6ad0, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })); g.rotation.x = -Math.PI / 2; (OBJ.group || scene).add(g); M.plug.ring = g;
  plugRound(true);
}
// the host picks the Plug at the start of each round
function plugRound(first) {
  const X = M.plug; if (!first) X.round++; X.att = X.round % 2; X.t = PLUG_T; X.state = 'live'; X.wait = 0;
  const host = !M.online || netHostNow();
  if (host) { const cands = M.entries.filter(en => en.team === X.att && (en.isPlayer ? true : en.alive !== false || true)); const c = cands[(Math.random() * cands.length) | 0]; X.who = c ? (c.isPlayer ? (M.online ? 'P:' + NET.me : 'me') : (c.botLabel || 'b:' + M.entries.indexOf(c))) : null; }
  const ex = plugBase(1 - X.att); X.ring.position.set(ex.x, (ex.y || 0) + 0.06, ex.z);
  if (!first) { try { if (playerAlive()) respawnPlayer(); } catch (e) {} for (const e of enemies) if (e.entry && !e.net && e.entry.alive !== false) try { relocateEnemy(e); e.goal = null; } catch (er) {} }
  plugAnnounce();
}
function plugIsMe() { const X = M.plug; return !!X && (X.who === 'me' || (M.online && X.who === 'P:' + NET.me)); }
function plugEntity() {
  const X = M.plug; if (!X || !X.who) return null; if (plugIsMe()) return 'player';
  if (X.who.startsWith('P:')) { const R = [...NET.rem.values()].find(r => !r.isBot && 'P:' + r.peer === X.who); return R && R.bot ? R.bot : null; }
  if (X.who.startsWith('b:')) { const en = M.entries[+X.who.slice(2)]; return en && en.bot && enemies.includes(en.bot) ? en.bot : null; }
  const en = M.entries.find(q => q.botLabel === X.who); return en && en.bot && enemies.includes(en.bot) ? en.bot : null;
}
function plugAnnounce() {
  const X = M.plug, mine = X.att === M.myTeam;
  if (plugIsMe()) { G.maxHp = 200; G.health = 200; try { equipClass({ only: 'sidearm', e: 'frag', k: 'none', factory: true }); } catch (e) {} }
  else if (G.maxHp === 200) { G.maxHp = M.maxHp || 100; G.health = Math.min(G.health, G.maxHp); }
  try { showBanner(`ROUND ${X.round + 1} · ${mine ? 'ATTACK' : 'DEFEND'}`, plugIsMe() ? 'YOU ARE THE PLUG · get to the pink ring' : mine ? 'get your Plug into their base' : 'kill the Plug before it gets out'); } catch (e) {}
}
function plugTick(dt) {
  const X = M.plug, host = !M.online || netHostNow();
  if (!host) { netObjApply(); return; }
  if (X.state === 'over') { X.wait -= dt; if (X.wait <= 0) plugRound(false); return; }
  X.t -= dt; const pe = plugEntity(), ex = plugBase(1 - X.att);
  let res = null;
  if (!pe || (pe === 'player' && !playerAlive())) res = 1 - X.att;   // the Plug is down
  else { const p = pe === 'player' ? P : pe.group.position; if (Math.hypot(p.x - ex.x, p.z - ex.z) < PLUG_R) res = X.att; }
  if (res === null && X.t <= 0) res = 1 - X.att;
  if (res !== null) {
    X.state = 'over'; X.wait = 5; M.teamScore[res]++; if (res === X.att && pe === 'player') try { achAdd('plugouts'); } catch (e) {}
    try { showBanner(res === M.myTeam ? 'ROUND WON' : 'ROUND LOST', res === X.att ? 'the Plug got out' : 'the Plug never made it'); (res === M.myTeam ? sfx.streak : sfx.ui)(); } catch (e) {}
    if (M.teamScore[res] >= (M.cfg.score || 4) && !M.online) endMatch(res);
  }
}
// bots: the Plug runs for the ring, its team escorts it, the defenders hunt it
function plugGoal(e, set) {
  const X = M.plug; if (!X || X.state !== 'live') return null; const pe = plugEntity(); if (!pe) return null;
  const pp = pe === 'player' ? { x: P.x, z: P.z, y: P.y } : pe.group.position, ex = plugBase(1 - X.att);
  if (pe === e) return set({ x: ex.x, z: ex.z, y: 0 }, 1.5);
  if (e.team === X.att) return set({ x: pp.x + rnd(-4, 4), z: pp.z + rnd(-4, 4), y: 0 }, 1.2);
  return set({ x: pp.x + rnd(-2, 2), z: pp.z + rnd(-2, 2), y: 0 }, 1);
}
function plugHud() { const X = M.plug; if (!X) return ''; return `ROUND ${X.round + 1} · ${X.att === M.myTeam ? 'ATTACK' : 'DEFEND'} · ${Math.max(0, Math.ceil(X.t))} s${plugIsMe() ? ' · <b style="color:#ff6ad0">YOU ARE THE PLUG</b>' : ''}`; }
function plugMarkers(out) { const X = M.plug; if (!X || X.state !== 'live') return; const pe = plugEntity(); if (pe && pe !== 'player') out.push({ x: pe.group.position.x, y: pe.group.position.y + 2.5, z: pe.group.position.z, t: 'PLUG', c: '#ff6ad0' }); const ex = plugBase(1 - X.att); out.push({ x: ex.x, y: 1.5, z: ex.z, t: 'EXTRACT', c: '#ff6ad0' }); }
function plugPack() { const X = M.plug, ts = M.teamScore; return ['X', X.round, X.att, Math.round(X.t), X.state === 'over' ? 1 : 0, ts[0], ts[1], X.who && X.who.startsWith('P:') ? X.who : (X.who || '')]; }
function plugApply(o) {
  const X = M.plug; if (!X) return; const r = o[1] | 0, newRound = r !== X.round;
  X.round = r; X.att = o[2] | 0; X.t = +o[3] || 0; X.state = o[4] ? 'over' : 'live'; M.teamScore[0] = o[5] | 0; M.teamScore[1] = o[6] | 0;
  let who = String(o[7] || ''); if (who === 'me') who = ''; X.who = who || X.who;
  if (newRound) { const ex = plugBase(1 - X.att); X.ring.position.set(ex.x, 0.06, ex.z); try { if (playerAlive()) respawnPlayer(); } catch (e) {} plugAnnounce(); }
}
/* ---------- THE HEIST */
const HEIST_BAGS = 6, HEIST_T = 150, HEIST_ROUNDS = 4;
function heistVault() { const s = (LAYOUT.sites || []).find(q => q && q.x !== undefined) || (LAYOUT.hp || [])[0] || { x: 0, z: 0 }; return { x: s.x, z: s.z, y: s.y || 0 }; }
function heistSetup() {
  if (!OBJ.group) { OBJ.group = new THREE.Group(); scene.add(OBJ.group); }
  const g = new THREE.Group(); (OBJ.group || scene).add(g);
  M.heist = { round: 0, att: 0, t: HEIST_T, state: 'live', wait: 0, group: g, bags: [], van: null, vault: heistVault() };
  heistRound(true);
}
function heistBagMesh() { const m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0x2a5a2a, emissive: 0x1a4a1a, emissiveIntensity: 0.5, roughness: 0.8 })); return m; }
function heistRound(first) {
  const H = M.heist; if (!first) H.round++; H.att = H.round % 2; H.t = HEIST_T; H.state = 'live'; H.wait = 0;
  for (const b of H.bags) if (b.m.parent) b.m.parent.remove(b.m); H.bags = [];
  const v = H.vault; for (let i = 0; i < HEIST_BAGS; i++) { const m = heistBagMesh(); const b = { id: i, st: 'vault', x: v.x + (i % 3 - 1) * 0.6, z: v.z + ((i / 3) | 0) * 0.5 - 0.25, y: (v.y || 0) + 0.2, who: null, m }; m.position.set(b.x, b.y, b.z); H.group.add(m); H.bags.push(b); }
  if (H.van && H.van.parent) H.van.parent.remove(H.van);
  const vb = plugBase(H.att); const van = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.9, 4.6), new THREE.MeshStandardMaterial({ color: 0xe8e8e0, roughness: 0.5, metalness: 0.3 })); body.position.y = 1.15; van.add(body);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.25, 4.62), new THREE.MeshBasicMaterial({ color: 0x5dff7a })); stripe.position.y = 1.3; van.add(stripe);
  const vo = openNear(vb.x + 3, vb.z); van.position.set(vo.x, 0, vo.z); H.group.add(van); H.van = van; H.vanP = { x: vo.x, z: vo.z };
  if (!first) { try { if (playerAlive()) respawnPlayer(); } catch (e) {} for (const e of enemies) if (e.entry && !e.net && e.entry.alive !== false) try { relocateEnemy(e); e.goal = null; e.heistBag = null; } catch (er) {} }
  try { showBanner(`ROUND ${H.round + 1} OF ${HEIST_ROUNDS} · ${H.att === M.myTeam ? 'ROB THE VAULT' : 'GUARD THE VAULT'}`, H.att === M.myTeam ? 'grab the bags and run them to your van' : 'stop them getting the bags out'); } catch (e) {}
}
// who can carry: the player ('me'), a bot, a remote player's avatar
const heistActors = () => m2Actors();
function heistTick(dt) {
  const H = M.heist, host = !M.online || netHostNow();
  if (!host) { netObjApply(); heistVisual(); return; }
  if (H.state === 'over') { H.wait -= dt; if (H.wait <= 0) { if (!M.online && H.round + 1 >= HEIST_ROUNDS) { if (!M.over) endMatch(M.teamScore[0] === M.teamScore[1] ? -1 : M.teamScore[0] > M.teamScore[1] ? 0 : 1); } else heistRound(false); } heistVisual(); return; }
  H.t -= dt; const acts = heistActors(), actorOf = w => acts.find(a => a.who === w);
  for (const b of H.bags) {
    if (b.st === 'carried') {
      const a = actorOf(b.who); if (!a) { b.st = 'dropped'; b.dropT = 15; b.who = null; continue; }   // the carrier went down
      b.x = a.x; b.z = a.z; b.y = (a.y || 0) + 1.3;
      if (Math.hypot(a.x - H.vanP.x, a.z - H.vanP.z) < 3.2) { b.st = 'done'; b.who = null; M.teamScore[H.att]++; a.en.score += 200; a.en.obj++; if (a.who === 'player') { try { achAdd('hbags'); } catch (e) {} G.score += 200; try { popScore('+200', 'big', 'BAG DELIVERED'); } catch (e) {} } try { showMsg(H.att === M.myTeam ? 'BAG DELIVERED' : 'THEY GOT A BAG OUT'); } catch (e) {} }
      continue;
    }
    if (b.st === 'dropped') { b.dropT -= dt; if (b.dropT <= 0) { b.st = 'vault'; heistHome(b); } }
    if (b.st === 'vault' || b.st === 'dropped') for (const a of acts) {
      if (Math.hypot(a.x - b.x, a.z - b.z) > 1.6) continue;
      if (a.team === H.att && !H.bags.some(q => q.st === 'carried' && q.who === a.who)) { b.st = 'carried'; b.who = a.who; if (a.who === 'player') try { showMsg('YOU HAVE A BAG · GET IT TO THE VAN'); } catch (e) {} break; }
      if (a.team !== H.att && b.st === 'dropped') { b.st = 'vault'; heistHome(b); try { showMsg('BAG RETURNED TO THE VAULT'); } catch (e) {} break; }
    }
  }
  const left = H.bags.filter(b => b.st !== 'done').length;
  if (!left || H.t <= 0) { H.state = 'over'; H.wait = 5; try { showBanner(left ? 'TIME' : 'THE VAULT IS EMPTY', `bags: ${M.teamScore[M.myTeam]} us · ${M.teamScore[1 - M.myTeam]} them`); } catch (e) {} }
  heistVisual();
}
function heistHome(b) { const v = M.heist.vault; b.x = v.x + (b.id % 3 - 1) * 0.6; b.z = v.z + ((b.id / 3) | 0) * 0.5 - 0.25; b.y = (v.y || 0) + 0.2; }
function heistVisual() { const H = M.heist; for (const b of H.bags) { b.m.visible = b.st !== 'done'; if (b.st === 'carried' && b.who === 'player') b.m.visible = false; b.m.position.set(b.x, b.y, b.z); b.m.rotation.y += 0.01; } }
const heistCarrying = w => !!(M.heist && M.heist.bags.some(b => b.st === 'carried' && b.who === w));
function heistGoal(e, set) {
  const H = M.heist; if (!H || H.state !== 'live') return null; const g = e.group.position;
  if (e.team === H.att) {
    if (heistCarrying(e)) return set({ x: H.vanP.x, z: H.vanP.z, y: 0 }, 1.5);
    let best = null, bd = 1e9; for (const b of H.bags) if (b.st === 'vault' || b.st === 'dropped') { const d = Math.hypot(b.x - g.x, b.z - g.z); if (d < bd) { bd = d; best = b; } }
    if (best) return set({ x: best.x, z: best.z, y: 0 }, 1.2);
    return null;
  }
  const car = H.bags.find(b => b.st === 'carried'), drop = H.bags.find(b => b.st === 'dropped');
  if (car) { const a = heistActors().find(q => q.who === car.who); if (a) return set({ x: a.x + rnd(-2, 2), z: a.z + rnd(-2, 2), y: 0 }, 1); }
  if (drop) return set({ x: drop.x, z: drop.z, y: 0 }, 1);
  return set({ x: H.vault.x + rnd(-6, 6), z: H.vault.z + rnd(-6, 6), y: 0 }, rnd(3, 6));
}
function heistHud() { const H = M.heist; if (!H) return ''; return `ROUND ${H.round + 1}/${HEIST_ROUNDS} · ${H.att === M.myTeam ? 'ROB' : 'GUARD'} · ${Math.max(0, Math.ceil(H.t))} s · ${H.bags.filter(b => b.st !== 'done').length} BAGS LEFT${heistCarrying('player') ? ' · <b style="color:#5dff7a">YOU HAVE A BAG</b>' : ''}`; }
function heistMarkers(out) {
  const H = M.heist; if (!H) return; out.push({ x: H.vault.x, y: 2.4, z: H.vault.z, t: 'VAULT', c: '#ffd24a' });
  if (H.att === M.myTeam) out.push({ x: H.vanP.x, y: 2.6, z: H.vanP.z, t: 'VAN', c: '#5dff7a' });
  for (const b of H.bags) if (b.st === 'carried' && b.who !== 'player') out.push({ x: b.x, y: b.y + 1.2, z: b.z, t: 'BAG', c: '#5dff7a' }); else if (b.st === 'dropped') out.push({ x: b.x, y: 1.2, z: b.z, t: 'BAG', c: '#ff8a3a' });
}
// online: the bags as [state, x, z, carrier]
function heistWho(w) { return w === 'player' ? 'P:' + NET.me : w && w.net ? 'P:' + w.net : w && w.entry && w.entry.botLabel ? w.entry.botLabel : ''; }
function heistPack() { const H = M.heist, ts = M.teamScore, r1 = v => Math.round(v * 10) / 10; return ['Y', H.round, H.att, Math.round(H.t), H.state === 'over' ? 1 : 0, ts[0], ts[1], r1(H.vanP.x), r1(H.vanP.z), ...H.bags.flatMap(b => [['vault', 'carried', 'dropped', 'done'].indexOf(b.st), r1(b.x), r1(b.z), heistWho(b.who)])]; }
function heistApply(o) {
  const H = M.heist; if (!H) return; const r = o[1] | 0; if (r !== H.round) { H.round = r - 1; heistRound(false); H.round = r; }
  H.att = o[2] | 0; H.t = +o[3] || 0; H.state = o[4] ? 'over' : 'live'; M.teamScore[0] = o[5] | 0; M.teamScore[1] = o[6] | 0; H.vanP = { x: +o[7] || 0, z: +o[8] || 0 }; if (H.van) H.van.position.set(H.vanP.x, 0, H.vanP.z);
  for (let i = 0; i < H.bags.length; i++) { const b = H.bags[i], k = 9 + i * 4; b.st = ['vault', 'carried', 'dropped', 'done'][o[k] | 0] || 'vault'; b.x = +o[k + 1] || 0; b.z = +o[k + 2] || 0; const w = String(o[k + 3] || ''); b.who = w === 'P:' + NET.me ? 'player' : w; b.y = b.st === 'carried' ? 1.4 : 0.2; }
}
const heistSlow = () => heistCarrying('player') ? 0.85 : 1;
/* ---------- GROW WARS on TURF WAR's spots */
function growExtraSpots(pts) {
  const out = pts.slice(); for (const h of (LAYOUT.hp || [])) { if (out.length >= 5) break; if (out.every(q => Math.hypot(q.x - h.x, q.z - h.z) > 12)) out.push({ x: h.x, z: h.z, y: h.y || 0 }); }
  while (out.length < 5) { const a = out.length * 1.3, o = openNear(Math.cos(a) * 22, Math.sin(a) * 22); out.push({ x: o.x, z: o.z, y: 0 }); }
  return out;
}
function growPts(t) { let s = 0; for (const p of M.dom.pts) if (p.own === t) { const age = M.t - (p.ownT || M.t); s += age < 20 ? 0 : age < 50 ? 1 : 2; } return s; }
function growVisual() { if (M.mode !== 'grow' || !M.dom) return; for (const p of M.dom.pts) { if (p._ow !== p.own) { p._ow = p.own; p.ownT = M.t; } const age = p.own === -1 ? 0 : M.t - (p.ownT || M.t), k = Math.min(1, age / 50); if (p.bud) p.bud.scale.setScalar(0.3 + k * 1.8); if (p.g) for (const c of p.g.children) if (c.userData.leafArm) c.scale.setScalar(0.35 + k * 0.75); } }
