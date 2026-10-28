/* ================================================================== RE-UP (grind) and PUFF PUFF PASS (rotating shared gun)
   RE-UP: every soldier drops a stash bag where they die (plus every bag they were carrying, in one fat pile). Grabbing a
   bag does NOT score: you carry it. Run your bags to one of the two STASH HOUSES (either team can use either) and stand
   in the ring to bank them: one point a bag. Grab your own team's bags to deny the enemy.
   PUFF PUFF PASS: free-for-all, and everyone holds the SAME gun. Every 40 seconds the gun is passed on to the next one,
   picked at random from the whole armory. Most kills wins.
   Offline the game runs both; online the host does and sends ['r', ...] / ['p', ...] in netObjPack. */
const RU_LIFE = 40, RU_R = 1.35, RU_BANK_R = 3.2, RU_BANK_T = 0.7, PP_EVERY = 40;

/* ---------- shared hooks (called from modes2.js and match.js) */
function m3Setup() {
  if (M.ru) { for (const t of M.ru.tags) if (t.g && t.g.parent) t.g.parent.remove(t.g); if (M.ru.group && M.ru.group.parent) M.ru.group.parent.remove(M.ru.group); }
  M.ru = null; if (M.mode !== 'pp') M.pp = null;
  if (M.mode === 'ru') ruSetup();
  if (M.mode === 'pp') ppSetup();
}
// the key that names an actor in the carry list (the same on every machine online)
function ruKey(who) {
  if (who === 'player') return M.online ? NET.me : 'me';
  if (who && who.net) return who.net;
  if (who && who.entry) return who.entry.botLabel || who.entry.name;
  return '';
}

/* ---------- RE-UP */
function ruBanks() {
  const L = LAYOUT, f0 = L.flags[0], f1 = L.flags[1], c = (L.hp || []).map(p => ({ x: p.x, z: p.z, y: p.y || 0 }));
  if (!f0 || !f1 || c.length < 2) return [Object.assign({ y: 0 }, openNear(-14, 0)), Object.assign({ y: 0 }, openNear(14, 0))];
  const d = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);
  // two spots, both about as far from each base, as far apart as possible
  let best = null, bs = -1e9;
  for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) {
    const A = c[i], B = c[j], s = Math.min(d(A, B), 40) - 0.8 * Math.abs(d(A, f0) - d(A, f1)) - 0.8 * Math.abs(d(B, f0) - d(B, f1)) - (A.y > 0.5 || B.y > 0.5 ? 4 : 0);
    if (s > bs) { bs = s; best = [A, B]; }
  }
  return best;
}
function ruSetup() {
  const group = new THREE.Group(); (OBJ.group || scene).add(group);
  M.ru = { tags: [], seq: 0, ev: [], evSeq: 0, seen: -1, carry: {}, bankT: {}, group, banks: ruBanks().map((b, i) => ({ n: 'AB'[i], x: b.x, y: b.y || 0, z: b.z })) };
  for (const b of M.ru.banks) ruBankMesh(b);
}
// a stash house: a pallet of cardboard boxes under a green light, a big ring to stand in
function ruBankMesh(b) {
  const g = new THREE.Group(); g.position.set(b.x, b.y, b.z);
  const std = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(c), roughness: 0.85 }, o || {}));
  const pal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 1.0), std(0x8a6a3a)); pal.position.y = 0.07; g.add(pal);
  for (const [x, y, z, s] of [[-0.3, 0.36, -0.2, 0.5], [0.3, 0.36, -0.2, 0.5], [0, 0.36, 0.25, 0.5], [0, 0.82, -0.05, 0.42]]) { const bx = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.9, s), std(0xb8915a)); bx.position.set(x, y, z); bx.rotation.y = x * 0.6; g.add(bx); }
  const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: ruLeafTex(), transparent: true })); leaf.position.set(0, 0.84, 0.47); g.add(leaf);
  const ring = new THREE.Mesh(new THREE.RingGeometry(RU_BANK_R - 0.2, RU_BANK_R, 56), objMat('#7dff6a', 0.55)); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; g.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(RU_BANK_R * 0.95, RU_BANK_R, 6, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x7dff6a, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 3; g.add(beam);
  const let_ = new THREE.Sprite(new THREE.SpriteMaterial({ map: domLetter(b.n), transparent: true, depthWrite: false })); let_.scale.set(0.8, 0.8, 1); let_.position.y = 2.4; g.add(let_);
  M.ru.group.add(g); Object.assign(b, { g, ring, beam });
}
function ruLeafTex() {
  if (ruLeafTex.t) return ruLeafTex.t;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.translate(64, 76); g.fillStyle = '#2f8a2a';
  for (let f = -3; f <= 3; f++) { g.save(); g.rotate(f * 0.4); const L = 54 * (1 - Math.abs(f) * 0.16); g.beginPath(); g.ellipse(0, -L / 2, 7, L / 2, 0, 0, TAU); g.fill(); g.restore(); }
  return (ruLeafTex.t = new THREE.CanvasTexture(c));
}
function ruTagMesh(t) {
  const mine = t.team === M.myTeam, col = new THREE.Color(TEAM_COL[mine ? 0 : 1]), g = new THREE.Group();
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: kcIcon(mine), transparent: true, depthWrite: false })); const s = 0.85 + Math.min(4, t.n - 1) * 0.12; sp.scale.set(s, s, 1); sp.position.y = 0.75; g.add(sp);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  g.position.set(t.x, t.y, t.z); M.ru.group.add(g); Object.assign(t, { g, sp, ring, mine });
}
// a death: one bag, plus everything the dead soldier carried (host / offline only)
function ruDrop(x, y, z, team, key) {
  const R = M.ru; if (!R || !netHostNow() || M.over) return;
  const n = 1 + (R.carry[key] | 0); R.carry[key] = 0; R.bankT[key] = 0;
  // a carried pile is worth points to whoever grabs it: it shows in the colour of the team that dropped it
  const t = { id: ++R.seq, team, n, x, z, y: groundAt(x, z, y + 0.4), born: NOW };
  R.tags.push(t); ruTagMesh(t);
}
function ruRemove(t) { if (t.g && t.g.parent) t.g.parent.remove(t.g); const i = M.ru.tags.indexOf(t); if (i >= 0) M.ru.tags.splice(i, 1); }
function ruVisual(dt) {
  for (const t of M.ru.tags) {
    if (!t.g) ruTagMesh(t);
    if (t.mine !== (t.team === M.myTeam)) { if (t.g.parent) t.g.parent.remove(t.g); ruTagMesh(t); }
    const age = NOW - t.born; t.sp.position.y = 0.75 + Math.sin(NOW * 3 + t.id) * 0.1; t.ring.rotation.z += dt * 2;
    t.g.visible = age < RU_LIFE - 6 || Math.sin(age * 16) > 0;
  }
  const mine = ruMine();
  for (const b of M.ru.banks) { b.ring.material.opacity = (mine ? 0.55 : 0.3) + Math.sin(NOW * 4) * 0.12; b.beam.material.opacity = mine ? 0.1 + Math.sin(NOW * 5) * 0.04 : 0.05; }
}
const ruMine = () => M.ru ? (M.ru.carry[ruKey('player')] | 0) : 0;
function ruUpdate(dt) {
  const R = M.ru;
  if (!netHostNow()) { netObjApply(); ruVisual(dt); return; }
  for (const t of R.tags.slice()) if (NOW - t.born > RU_LIFE) ruRemove(t);
  const acts = m2Actors();
  for (const a of acts) {
    const key = ruKey(a.who); if (!key) continue;
    for (const t of R.tags.slice()) {
      if (Math.hypot(a.x - t.x, a.z - t.z) > RU_R + a.r || Math.abs(a.y - t.y) > 1.8) continue;
      const grab = a.team !== t.team;
      if (grab) { R.carry[key] = (R.carry[key] | 0) + t.n; a.en.score += 25 * t.n; } else a.en.score += 50;
      R.ev.push([++R.evSeq, key, grab ? 1 : 0, t.n]); if (R.ev.length > 8) R.ev.shift();
      if (a.who === 'player') ruMineEv(grab ? 1 : 0, t.n);
      ruRemove(t);
    }
    // banking: stand in a stash house ring with bags
    const n = R.carry[key] | 0;
    const inBank = n > 0 && R.banks.some(b => Math.hypot(a.x - b.x, a.z - b.z) < RU_BANK_R + a.r && Math.abs(a.y - b.y) < 2.5);
    if (!inBank) { R.bankT[key] = 0; continue; }
    R.bankT[key] = (R.bankT[key] || 0) + dt;
    if (R.bankT[key] < RU_BANK_T) continue;
    R.bankT[key] = 0; R.carry[key] = 0;
    M.teamScore[a.team] += n; a.en.score += 100 * n; a.en.obj += n;
    R.ev.push([++R.evSeq, key, 2, n]); if (R.ev.length > 8) R.ev.shift();
    if (a.who === 'player') ruMineEv(2, n);
    else if (a.team === M.myTeam) showMsg(`${a.en.name || 'TEAMMATE'} BANKED ${n}`);
    checkScoreLimit();
  }
  ruVisual(dt);
}
function ruMineEv(kind, n) {
  if (kind === 2) { MS.bags = (MS.bags || 0) + n; G.score += 100 * n; popScore('+' + 100 * n, 'big', `BANKED ${n} BAG${n > 1 ? 'S' : ''}`); try { sfx.streak(); } catch (e) {} return; }
  if (kind === 1) { G.score += 25 * n; popScore('+' + 25 * n, '', n > 1 ? `GRABBED ${n} BAGS` : 'BAG GRABBED'); }
  else { MS.saves = (MS.saves || 0) + 1; G.score += 50; popScore('+50', '', 'STASH SAVED'); }
  try { sfx.pickup(); tone(kind ? 880 : 660, 0.1, 0.07, 'triangle'); } catch (e) {}
}
function ruPack() {
  const R = M.ru, ts = M.teamScore || [0, 0], cr = Object.entries(R.carry).filter(([, v]) => v > 0);
  return ['r', ts[0], ts[1], R.tags.length, ...R.tags.flatMap(t => [t.id, t.team, t.n, r2(t.x), r2(t.z), r2(t.y)]), cr.length, ...cr.flat(), ...R.ev.flat()];
}
function ruApply(o) {
  const R = M.ru; if (!R) return; M.teamScore = [+o[1] | 0, +o[2] | 0];
  const n = o[3] | 0, ids = new Set();
  for (let i = 0; i < n; i++) {
    const b = 4 + i * 6, id = o[b] | 0; ids.add(id);
    if (!R.tags.find(t => t.id === id)) { const t = { id, team: o[b + 1] | 0, n: clamp(o[b + 2] | 0, 1, 99), x: netNum(o[b + 3], -ARENA, ARENA), z: netNum(o[b + 4], -ARENA, ARENA), y: netNum(o[b + 5], -5, 30), born: NOW }; R.tags.push(t); ruTagMesh(t); }
  }
  for (const t of R.tags.slice()) if (!ids.has(t.id)) ruRemove(t);
  let k = 4 + n * 6; const cn = o[k++] | 0; R.carry = {};
  for (let i = 0; i < cn; i++, k += 2) if (typeof o[k] === 'string') R.carry[o[k]] = clamp(o[k + 1] | 0, 0, 99);
  const ev = o.slice(k);
  for (let i = 0; i + 3 < ev.length; i += 4) {
    const s = ev[i] | 0; if (s <= R.seen) continue;
    if (R.seen >= 0 && ev[i + 1] === NET.me) ruMineEv(ev[i + 2] | 0, clamp(ev[i + 3] | 0, 1, 99));
    R.seen = Math.max(R.seen, s);
  }
  if (R.seen < 0) R.seen = 0;
}
function ruHud() {
  const R = M.ru, c = ruMine(), near = R.tags.filter(t => Math.hypot(t.x - P.x, t.z - P.z) < 25), e = near.filter(t => t.team !== M.myTeam).reduce((s, t) => s + t.n, 0);
  return `${c ? `<b style="color:#7dff6a">CARRYING ${c} BAG${c > 1 ? 'S' : ''} · BANK THEM AT A STASH HOUSE</b>` : 'CARRYING NOTHING'}${e ? ` · ${e} TO GRAB NEARBY` : ''}`;
}
function ruMarkers(out) {
  const R = M.ru, c = ruMine();
  for (const t of R.tags) { if (Math.hypot(t.x - P.x, t.z - P.z) > 30) continue; out.push({ x: t.x, y: t.y + 1.1, z: t.z, t: t.team === M.myTeam ? 'SAVE' : t.n > 1 ? 'GRAB ×' + t.n : 'GRAB', c: TEAM_COL[t.team === M.myTeam ? 0 : 1] }); }
  for (const b of R.banks) out.push({ x: b.x, y: b.y + 2.9, z: b.z, t: c ? 'BANK ' + b.n + ' ×' + c : 'STASH ' + b.n, c: '#7dff6a' });
}
// bots: carrying bags makes them head for the nearest stash house; otherwise grab bags close by
function ruGoal(e, keep, near, set) {
  const R = M.ru, ex = e.group.position.x, ez = e.group.position.z, c = R.carry[ruKey(e)] | 0;
  if (c >= 3 || (c > 0 && (e.role === 'obj' || (e.ruRun !== undefined ? e.ruRun : (e.ruRun = Math.random() < 0.6))))) {
    let b = R.banks[0]; for (const q of R.banks) if (Math.hypot(q.x - ex, q.z - ez) < Math.hypot(b.x - ex, b.z - ez)) b = q;
    return keep && Math.hypot(e.goal.x - b.x, e.goal.z - b.z) < 2 ? e.goal : set({ x: b.x, z: b.z, y: b.y }, 1.2);
  }
  if (!c) e.ruRun = undefined;
  let best = null, bd = 1e9; for (const t of R.tags) { const d = Math.hypot(t.x - ex, t.z - ez) - t.n * 3; if (d < bd) { bd = d; best = t; } }
  if (best && (bd < 14 || (e.role === 'obj' && bd < 40 && Math.random() < 0.7))) return set({ x: best.x, z: best.z, y: best.y }, 1.5);
  return null;
}

/* ---------- PUFF PUFF PASS */
function ppPool() {
  return ARMORY.filter(d => CATS[d.cat] && (CATS[d.cat].slot === 'primary' || CATS[d.cat].slot === 'secondary') && !d.proj && d.cat !== 'la' && !d.secret && !d.hidden).map(d => d.id);
}
function ppNext(prev) { const p = ppPool().filter(id => id !== prev); return p[(Math.random() * p.length) | 0]; }
function ppSetup() {
  M.pp = { gun: ppNext(''), n: 1, t: PP_EVERY, seen: 0, eq: false };
  if (!M.online) { M.pp.eq = true; ppEquipAll(); }
}
function ppEquipMe() { const id = M.pp && M.pp.gun, d = ARM[id]; if (!d) return; equipClass({ p: CATS[d.cat].slot === 'primary' ? id : null, s: CATS[d.cat].slot === 'secondary' ? id : null, e: 'frag', k: 'none', only: id, factory: true }); G.grenades = 1; G.swapT = Math.max(G.swapT, 0.5); G.fireT = Math.max(G.fireT, 0.5); }
function ppEquipBot(e) { if (e && M.pp && ARM[M.pp.gun]) try { botGunProfile(e, M.pp.gun); } catch (err) {} }
function ppEquipAll() { if (M.me && M.me.alive !== false) ppEquipMe(); for (const e of enemies) if (!e.net && e.entry) ppEquipBot(e); }
function ppPassed() {
  const d = ARM[M.pp.gun]; ppEquipAll();
  showBanner('PUFF PUFF PASS', `everyone now has the ${d ? d.name : 'next gun'}`); try { sfx.streak(); } catch (e) {}
}
function ppUpdate(dt) {
  const p = M.pp;
  if (!netHostNow()) { netObjApply(); return; }
  if (!p.eq) { p.eq = true; ppEquipAll(); }
  p.t -= dt;
  if (p.t <= 0) { p.t = PP_EVERY; p.gun = ppNext(p.gun); p.n++; ppPassed(); }
}
const ppPack = () => ['p', M.pp.gun, M.pp.n, Math.ceil(M.pp.t)];
function ppApply(o) {
  const p = M.pp; if (!p || !ARM[o[1]]) return;
  p.t = +o[3] || 0;
  if ((o[2] | 0) !== p.seen) { const first = !p.eq; p.eq = true; p.seen = o[2] | 0; p.gun = o[1]; p.n = p.seen; if (first) ppEquipAll(); else ppPassed(); }
}
function ppHud() { const p = M.pp, d = ARM[p.gun]; return `${d ? d.name : ''} · NEXT GUN IN ${Math.max(0, Math.ceil(p.t))}`; }
