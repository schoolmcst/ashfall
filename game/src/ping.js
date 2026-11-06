/* ================================================================== PINGS (1.2.80)
   Press PING (Z, middle mouse, D-PAD LEFT) to mark what you're looking at for your team:
     ENEMY   - an enemy near your crosshair: a red marker that follows them for 5 s ("Enemy spotted!")
     LOOT    - a LAST TOKE loot crate: its colour, until someone opens it ("Loot here.")
     VEHICLE - a golf cart or dirt bike ("Got a ride here.")
     GO HERE - anywhere else you're aiming: a yellow marker for 10 s ("Going here." / "Let's go here.")
   The marker shows on screen (with its distance) and on the minimap, with a short line in a built-in voice. A new
   GO HERE replaces your last one; ping the same spot again to take it off.
   Bot teammates (your squad in LAST TOKE DUOS / SQUADS, your team in team modes) answer: they look where you ping an
   enemy and head for a GO HERE when they're not fighting. Bot squadmates ping the enemies they spot for you too.
   Online your pings travel in your presence (pg) and your teammates see them. */
const PING = { list: [], seq: 0, mine: null, cd: 0, seen: {}, botCd: new Map() };
const PING_KINDS = {
  enemy: { t: 'ENEMY', c: '#ff4a3a', life: 5, say: ['Enemy spotted!', 'Enemy here!', 'Contact!'] },
  loot: { t: 'LOOT HERE', c: '#c070ff', life: 30, say: ['Loot here.', 'Crate over here.'] },
  vehicle: { t: 'RIDE', c: '#ffffff', life: 20, say: ['Got a ride here.', 'Vehicle here.'] },
  go: { t: 'GO HERE', c: '#ffd24a', life: 10, say: ['Going here.', "Let's go here.", 'Over here.'] },
};
const PING_ORDER = ['enemy', 'loot', 'vehicle', 'go'];
const _pgRay = new THREE.Raycaster(), _pgV = new THREE.Vector3(), _pgD = new THREE.Vector3();
// a short line in a built-in voice (never queued behind another line)
function pingSay(text) {
  try {
    if (!window.speechSynthesis || speechSynthesis.speaking || speechSynthesis.pending) return;
    const u = new SpeechSynthesisUtterance(text); u.rate = 1.15; u.pitch = 1; u.volume = clamp(((S.master !== undefined ? S.master : 80) / 100) * 0.8, 0, 1);
    speechSynthesis.speak(u);
  } catch (e) {}
}
function pingTone(kind) {
  try { if (typeof actx === 'undefined' || !actx) return; const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime; o.type = 'sine'; o.frequency.setValueAtTime(kind === 'enemy' ? 880 : 660, t); o.frequency.exponentialRampToValueAtTime(kind === 'enemy' ? 1320 : 990, t + 0.09);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 * ((S.master !== undefined ? S.master : 80) / 100), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.3); } catch (e) {}
}
// what am I aiming at?
function pingPick() {
  camera.getWorldDirection(_pgD); const ox = camera.position.x, oy = camera.position.y, oz = camera.position.z;
  _pgRay.set(camera.position, _pgD); _pgRay.far = 150; let wallD = 150;
  try { const h = _pgRay.intersectObjects(wallMeshes, false)[0]; if (h) wallD = h.distance; } catch (e) {}
  const ang = (x, y, z) => { const dx = x - ox, dy = y - oy, dz = z - oz, d = Math.hypot(dx, dy, dz) || 1; return { d, a: Math.acos(clamp((dx * _pgD.x + dy * _pgD.y + dz * _pgD.z) / d, -1, 1)) }; };
  // an enemy close to the crosshair, in front of the first wall
  let best = null, bs = 1e9;
  for (const e of enemies) {
    if (isFriend(e) || !e.entry || e.entry.alive === false || e.dead) continue;
    const g = e.group.position, q = ang(g.x, g.y + 1.2, g.z); if (q.d > wallD + 1 || q.d > 120) continue;
    const tol = Math.max(0.035, Math.atan(1.1 / q.d)); if (q.a < tol && q.a / tol < bs) { bs = q.a / tol; best = e; }
  }
  if (best) return { kind: 'enemy', e: best, x: best.group.position.x, y: best.group.position.y + 2.3, z: best.group.position.z };
  // a loot crate or a vehicle near the crosshair
  if (M && M.br) for (const c of M.br.crates) { if (c.open) continue; const q = ang(c.x, 0.4, c.z); if (q.d < wallD + 1.5 && q.d < 80 && q.a < Math.max(0.05, Math.atan(1.2 / q.d))) return { kind: 'loot', crate: c, x: c.x, y: 1.6, z: c.z }; }
  if (typeof VH !== 'undefined') for (const v of VH.list) { if (v.dead || v.driver) continue; const q = ang(v.x, v.y + 0.7, v.z); if (q.d < wallD + 1.5 && q.d < 90 && q.a < Math.max(0.05, Math.atan(1.6 / q.d))) return { kind: 'vehicle', veh: v, x: v.x, y: v.y + 2.4, z: v.z }; }
  // anywhere else: where the aim meets a wall or the ground
  let d = wallD; if (_pgD.y < -0.01) d = Math.min(d, (oy - 0) / -_pgD.y);
  if (d >= 150) d = 60;
  _pgV.copy(camera.position).addScaledVector(_pgD, Math.max(1, d - 0.2));
  return { kind: 'go', x: _pgV.x, y: Math.max(0.2, _pgV.y) + 0.6, z: _pgV.z };
}
function pingAdd(o, who, quiet) {
  const K = PING_KINDS[o.kind]; if (!K) return null;
  if (o.kind === 'go' && who === 'me' && PING.mine) { const m = PING.mine; PING.list = PING.list.filter(p => p !== m); PING.mine = null; if (Math.hypot(m.x - o.x, m.z - o.z) < 2.5) return null; }   // same spot again: take it off
  const p = Object.assign({ who, until: NOW + K.life, born: NOW }, o); PING.list.push(p); if (PING.list.length > 24) PING.list.shift();
  if (o.kind === 'go' && who === 'me') PING.mine = p;
  if (!quiet) { pingTone(o.kind); pingSay(K.say[(Math.random() * K.say.length) | 0]); }
  return p;
}
// PING pressed
function pingDo() {
  if (!M || G.state !== 'playing' || !playerAlive() || NOW < PING.cd) return;
  PING.cd = NOW + 0.35;
  const o = pingPick(); const p = pingAdd(o, 'me'); if (!p) { try { sfx.ui(); } catch (e) {} return; }
  try { achAdd('pings'); } catch (e) {} PING.seq++; PING.out = { seq: PING.seq, k: PING_ORDER.indexOf(o.kind), x: o.x, y: o.y, z: o.z, until: NOW + 6 };
  // bot teammates answer
  for (const e of enemies) {
    if (e.net || !isFriend(e) || !e.entry || e.downed) continue;
    if (o.kind === 'enemy') { e.lkp = { x: o.x, z: o.z, y: o.e.group.position.y }; e.lkpT = M.t; }
    else if (o.kind === 'go' && !e.tgt && Math.hypot(e.group.position.x - o.x, e.group.position.z - o.z) < 90) { e.goal = { x: o.x + rnd(-2.5, 2.5), z: o.z + rnd(-2.5, 2.5), y: 0 }; e.goalT = M.t + 9; }
  }
}
// a bot squadmate spots someone (from botCallout): it pings them for me now and then
function pingFromBot(e, t) {
  if (!M || !isFriend(e) || e.net) return; const last = PING.botCd.get(e) || 0; if (NOW - last < 8) return; PING.botCd.set(e, NOW);
  const tp = t === 'P' ? null : t; if (!tp || !tp.group) return;
  if (PING.list.some(p => p.kind === 'enemy' && p.e === tp && p.until > NOW)) return;
  pingAdd({ kind: 'enemy', e: tp, x: tp.group.position.x, y: tp.group.position.y + 2.3, z: tp.group.position.z }, e.entry ? e.entry.name : 'bot', true); pingTone('enemy');
}
// on screen and on the minimap (from markerList)
function pingMarkers(out) {
  if (!PING.list.length) return;
  PING.list = PING.list.filter(p => p.until > NOW && !(p.e && (!enemies.includes(p.e) || (p.e.entry && p.e.entry.alive === false))) && !(p.crate && p.crate.open) && !(p.veh && (p.veh.dead || p.veh.driver)));
  for (const p of PING.list) {
    if (p.e) { p.x = p.e.group.position.x; p.y = p.e.group.position.y + 2.3; p.z = p.e.group.position.z; }
    const K = PING_KINDS[p.kind]; out.push({ x: p.x, y: p.y, z: p.z, t: K.t + (p.who !== 'me' ? ' · ' + String(p.who).toUpperCase().slice(0, 10) : ''), c: K.c, ping: 1 });
  }
}
function pingClear() { PING.list = []; PING.mine = null; PING.out = null; PING.seen = {}; }
/* ---------- online */
function pingPack() { const o = PING.out; if (!o || o.until < NOW) return undefined; const r1 = v => Math.round(v * 10) / 10; return [o.seq, o.k, r1(o.x), r1(o.y), r1(o.z)]; }
function pingRemote(R, a) {
  if (!Array.isArray(a) || !M || !M.def || !M.def.teams || !R.entry || R.entry.team !== M.myTeam) return;
  const key = R.peer || R.entry.name, seq = a[0] | 0; if ((PING.seen[key] | 0) >= seq) return; PING.seen[key] = seq;
  const kind = PING_ORDER[a[1] | 0]; if (!kind) return;
  pingAdd({ kind, x: netNum(a[2], -ARENA, ARENA), y: netNum(a[3], -5, 40), z: netNum(a[4], -ARENA, ARENA) }, R.entry.name || 'mate', true); pingTone(kind);
}
