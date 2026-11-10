/* ================================================================== LAST TOKE BOTS 2.0 + THE VAULTS (1.2.93)
   THE VAULTS (STASH ISLAND): four small concrete bunkers with a steel door and a red keypad (at THE FARM, the bunker road,
     THE SCHOOL and the quarry rim). Inside: a LEGENDARY gun on a table, an EPIC gun on a rack, a medical joint and an
     attachment. KEY CARDS (gold) lie in six places on tables, shelves and pallets; walk up to a vault door with one and
     hold USE to open it (the keypad goes green, the door slides up). Offline a VAULT BOSS waits inside (lots of health,
     an LMG); it wakes when the door opens. Online the open doors travel at the end of the host's 'b' pack (players ask
     with presence bl.vo).
   BOTS: they take guns from the floor loot (a better rarity than theirs) as well as crates, eat a heal when hurt and out
     of a fight, take vehicles more often (from 25 m, cars up to 40 m away), hide in buildings inside the last circles
     instead of standing in the open, get sharper every phase (+5% accuracy a phase), revive each other faster and call
     out enemies in your squad. */
const BRV_SPOTS = [[-110, 148], [82, -38], [-2, -128], [154, 112]];
const BRB = { vaults: [], bosses: [], open: 0, keyT: 0, phase: -9 };
/* ---------- the vaults: built at the round start, taken away at the end */
function brbVaultsClear() {
  for (const v of BRB.vaults) { for (const m of v.meshes) { if (m.parent) m.parent.remove(m); const i = wallMeshes.indexOf(m); if (i >= 0) wallMeshes.splice(i, 1); } for (const b of v.boxes) { const i = boxes.indexOf(b); if (i >= 0) boxes.splice(i, 1); } }
  BRB.vaults = []; BRB.open = 0; try { rebuildBoxGrid(); } catch (e) {}
  for (const e of BRB.bosses) { const i = enemies.indexOf(e); if (i >= 0) { enemies.splice(i, 1); scene.remove(e.group); } } BRB.bosses = [];
}
function brbVaultsBuild() {
  brbVaultsClear(); if (curMap !== 'stashisle' || !M || !M.br) return;
  const steel = new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.35, metalness: 0.8 }), red = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff2a1a, emissiveIntensity: 1.6 }), gold = new THREE.MeshStandardMaterial({ color: 0x221a00, emissive: 0xffc83a, emissiveIntensity: 1.4 });
  BRV_SPOTS.forEach(([x, z], i) => {
    const y = TH(x, z) + 0.02, v = { i, x, z, y, meshes: [], boxes: [], open: false, openT: 0 };
    // the door faces the middle of the island
    const toC = Math.atan2(-x, -z), side = Math.abs(Math.sin(toC)) > Math.abs(Math.cos(toC)) ? (Math.sin(toC) > 0 ? 'e' : 'w') : (Math.cos(toC) > 0 ? 's' : 'n');
    v.side = side; const W = 6, T = 0.3, H = 3.2, gap = 1.7, add = (cx, cz, w, d, h, y0, key) => { const n = boxes.length; const m = addBox(cx, cz, w, d, h, key || 'concrete', { y: y0 }); v.meshes.push(m); if (boxes.length > n) v.boxes.push(boxes[boxes.length - 1]); return m; };
    const wall = (s) => {
      const hz = s === 'n' || s === 's', off = (s === 'n' || s === 'w' ? -1 : 1) * (W / 2 - T / 2), cx = hz ? x : x + off, cz = hz ? z + off : z;
      if (s !== side) { add(cx, cz, hz ? W : T, hz ? T : W, H, y); return; }
      const seg = (W - gap) / 2; for (const k of [-1, 1]) { const c = k * (gap / 2 + seg / 2); add(hz ? x + c : cx, hz ? cz : z + c, hz ? seg : T, hz ? T : seg, H, y); }
      add(cx, cz, hz ? gap : T, hz ? T : gap, H - 2.45, y + 2.45);   // above the door
      v.door = { cx, cz, w: hz ? gap : 0.14, d: hz ? 0.14 : gap, hz, nx: hz ? 0 : Math.sign(off), nz: hz ? Math.sign(off) : 0 };
    };
    for (const s of ['n', 's', 'e', 'w']) wall(s);
    add(x, z, W + 0.2, W + 0.2, 0.25, y + H, 'concrete');   // the roof
    // the steel door and the keypad
    const D = v.door, dm = new THREE.Mesh(new THREE.BoxGeometry(D.w, 2.4, D.d), steel); dm.position.set(D.cx, y + 1.2, D.cz); dm.castShadow = dm.receiveShadow = true; scene.add(dm); wallMeshes.push(dm); v.meshes.push(dm); v.doorM = dm;
    const db = mkBox(D.cx, D.cz, D.hz ? D.w : 0.3, D.hz ? 0.3 : D.d, 2.4, { y }); boxes.push(db); v.boxes.push(db); v.doorB = db;
    for (const k of [-0.5, 0.5]) { const s = new THREE.Mesh(new THREE.BoxGeometry(D.hz ? 0.05 : 0.02, 2.0, D.hz ? 0.02 : 0.05), gold); s.position.set(D.cx + (D.hz ? k * D.w * 0.8 : D.nx * 0.08), y + 1.2, D.cz + (D.hz ? D.nz * 0.08 : k * D.d * 0.8)); scene.add(s); v.meshes.push(s); }
    const kp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.16), red); kp.position.set(D.cx + (D.hz ? D.w / 2 + 0.35 : D.nx * 0.22), y + 1.3, D.cz + (D.hz ? D.nz * 0.22 : D.d / 2 + 0.35)); scene.add(kp); v.meshes.push(kp); v.keypad = kp;
    // the stencil over the door
    const sign = new THREE.Mesh(new THREE.BoxGeometry(D.hz ? 1.4 : 0.03, 0.3, D.hz ? 0.03 : 1.4), gold); sign.position.set(D.cx + D.nx * 0.17, y + 2.75, D.cz + D.nz * 0.17); scene.add(sign); v.meshes.push(sign);
    BRB.vaults.push(v);
  });
  try { rebuildBoxGrid(); } catch (e) {}
  // offline: a boss in each vault
  if (!M.online) for (const v of BRB.vaults) {
    const e = makeEnemy('heavy', v.x - (v.door.nx || 0) * 1.6, v.z - (v.door.nz || 0) * 1.6); e.group.position.y = v.y; e.team = 99; e.name = 'VAULT BOSS'; e.bossBR = v;
    try { const lmg = ARMORY.find(d => d.cat === 'lmg'); if (lmg) botApplyGun(e, lmg, {}), botGunVisual(e, lmg, {}, null); } catch (er) {}
    Object.assign(e, { hp: 650, maxHp: 650, acc: 0.3, dmg: 10, cdT: 0, awake: false, armor: 150 }); e.group.rotation.y = Math.atan2(v.door.nx, v.door.nz); enemies.push(e); BRB.bosses.push(e);
  }
}
const brbVaultMask = () => BRB.vaults.reduce((m, v, i) => m | (v.open ? 1 << i : 0), 0);
function brbVaultApply(mask) { mask = mask | 0; BRB.vaults.forEach((v, i) => { if (mask & (1 << i) && !v.open) brbVaultOpen(v, true); }); }
function brbVaultOpen(v, remote) {
  if (v.open) return; v.open = true; v.openT = 0; const i = boxes.indexOf(v.doorB); if (i >= 0) boxes.splice(i, 1); try { rebuildBoxGrid(); } catch (e) {}
  const j = wallMeshes.indexOf(v.doorM); if (j >= 0) wallMeshes.splice(j, 1);
  v.keypad.material = new THREE.MeshStandardMaterial({ color: 0x002200, emissive: 0x5dff7a, emissiveIntensity: 1.8 });
  try { sfx.thud({ vol: 0.9 }); tone(220, 0.4, 0.08, 'sawtooth', 120); } catch (e) {}
  if (!remote) try { showBanner('VAULT OPEN', M.online ? 'legendary loot inside' : 'the VAULT BOSS is awake'); } catch (e) {}
  for (const e of BRB.bosses) if (e.bossBR === v) e.awake = true;
}
// the loot inside a vault (from brlBuild, so it shares the round's seed and the online ids)
function brbVaultLoot() {
  if (!BRB.vaults.length || typeof brlItem !== 'function') return;
  for (const v of BRB.vaults) {
    const g = new THREE.Group(), set = { id: 'v' + v.i + '_', g, n: 0, x: v.x, z: v.z, y: v.y, kind: 'vault' }, r = brlRng((BRL.seed ^ (v.i * 7919)) >>> 0);
    g.position.set(v.x, v.y, v.z); g.rotation.y = Math.atan2(-v.door.nx, -v.door.nz); BRL.group.add(g); BRL.sets.push(set);
    const M0 = brlMats(), wz = 2.55;   // the back wall (away from the door) is +z in the set's frame
    brlMesh(g, 'box', M0.wood, -1, 0.77, wz - 0.45, 1.45, 0.06, 0.72); for (const [x, z] of [[-0.66, -0.3], [0.66, -0.3], [-0.66, 0.3], [0.66, 0.3]]) brlMesh(g, 'box', M0.dark, -1 + x, 0.37, wz - 0.45 + z, 0.06, 0.74, 0.06);
    const leg = brlRollGun(r, 3); brlItem(set, 'gun', { gun: leg.id, tier: 3 }, -1.05, 0.8, wz - 0.45, 'lie');
    const t = brlAmmoOf(leg); brlItem(set, 'ammo', { t, n: BRL_AMMO[t].can * 2 }, -0.45, 0.8, wz - 0.55);
    brlMesh(g, 'box', M0.wood, 1.2, 1.25, wz - 0.03, 1.3, 1.15, 0.05); const ep = brlRollGun(r, 2); brlItem(set, 'gun', { gun: ep.id, tier: 2 }, 1.2, 1.5, wz - 0.13, 'hang');
    brlMesh(g, 'box', M0.wood, 1.2, 0.5, wz - 0.3, 1.1, 0.04, 0.4); brlItem(set, 'heal', { h: 'joint' }, 0.95, 0.52, wz - 0.3); brlItem(set, 'att', { a: BRL_KIT[Math.floor(r() * BRL_KIT.length)].id }, 1.4, 0.52, wz - 0.3);
  }
}
/* ---------- every frame (from brUpdate) */
function brbTick(dt) {
  if (!M || !M.br) return; const B = M.br, host = netHostNow();
  // vault doors: me with a key card, holding USE
  for (const v of BRB.vaults) {
    if (v.open) { if (v.openT < 1) { v.openT = Math.min(1, v.openT + dt); v.doorM.position.y = v.y + 1.2 + v.openT * 2.3; } continue; }
    if (!playerAlive() || Math.hypot(P.x - v.door.cx, P.z - v.door.cz) > 2.4 || Math.abs(P.y - v.y) > 2) continue;
    const keys = (BRL.keys | 0), u = kb('use') || pad.use;
    if (!keys) { try { showMsgOnce('LOCKED VAULT · FIND A KEY CARD (gold, on tables and shelves)'); } catch (e) {} continue; }
    if (u) { BRB.keyT += dt; if (BRB.keyT >= 1.4) { BRB.keyT = 0; BRL.keys--; if (host) brbVaultOpen(v); else { BRL.vo = (BRL.vo || []).concat(v.i); brbVaultOpen(v); } } } else BRB.keyT = 0;
    try { G.interactTxt = u ? `OPENING · ${Math.round(BRB.keyT / 1.4 * 100)}%` : `LOCKED VAULT · HOLD ${actName('use')} TO USE A KEY CARD`; showMsgOnce(G.interactTxt); } catch (e) {}
  }
  // the bosses (offline)
  for (const e of BRB.bosses) {
    if (!enemies.includes(e)) { if (!e.downSaid) { e.downSaid = true; try { showBanner('VAULT BOSS DOWN', 'the vault is yours'); sfx.streak(); } catch (er) {} } continue; }
    try { animEnemy(e, dt, 0); } catch (er) {}
    if (!e.awake || !playerAlive()) continue;
    const dx = P.x - e.group.position.x, dz = P.z - e.group.position.z, dist = Math.hypot(dx, dz); if (dist > 30) continue;
    e.group.rotation.y = Math.atan2(dx, dz); e.aim = 1; e.holding = true;
    if ((e.cdT -= dt) <= 0) { e.cdT = 0.16; if (hasLOS(e, dist)) { if (!e.burst || e.burst <= 0) { e.burst = 5; e.cdT = 1.2; } else { e.burst--; enemyShoot(e, dist); } } }
  }
  // bots: sharper every phase
  if (host && B.phase !== BRB.phase) { BRB.phase = B.phase; const k = 1 + Math.max(0, B.phase) * 0.05; for (const e of enemies) if (e.entry && !e.net) { if (e.acc0 === undefined) e.acc0 = e.acc; e.acc = Math.min(0.85, e.acc0 * k); } }
  if (!host) return;
  for (const e of enemies) {
    if (!e.entry || e.net || e.downed || e.brFloat) continue;
    // a heal when hurt and nobody in sight
    if (!e.tgt && e.hp < e.maxHp * 0.5 && (e.heals === undefined ? (e.heals = 2) : e.heals) > 0 && M.t - (e.hitT || -99) > 3) { e.healT = (e.healT || 0) + dt; if (e.healT > 2.5) { e.healT = 0; e.heals--; e.hp = Math.min(e.maxHp, e.hp + 50); } } else e.healT = 0;
    // squad callouts: the first look at an enemy
    if (e.team === M.myTeam && e.tgt && !e.spotSaid) { e.spotSaid = true; try { if (typeof SQV_LINES !== 'undefined' && SQV_LINES.spot) sqvSay(e, 'spot'); } catch (er) {} } else if (!e.tgt) e.spotSaid = false;
  }
}
function brbMarkers(out) { for (const v of BRB.vaults) if (Math.hypot(v.x - P.x, v.z - P.z) < ((BRL.keys | 0) ? 400 : 60)) out.push({ x: v.door.cx, y: v.y + 3.2, z: v.door.cz, t: v.open ? 'VAULT · OPEN' : 'VAULT', c: '#ffc83a' }); }
// from brGoal: a better gun on the floor nearby (the host's bots take it like a crate)
function brbLootGoal(e, set) {
  if (typeof brlOn !== 'function' || !brlOn() || !BRL.items.length) return null; const g = e.group.position, B = M.br, mine = e.brTier === undefined ? -1 : e.brTier;
  let best = null, bd = 32;
  for (const it of BRL.items) { if (it.gone || it.k !== 'gun' || Math.min(2, it.tier) <= mine || Math.abs(it.set.x - g.x) > bd || Math.abs(it.set.z - g.z) > bd) continue; const d = Math.hypot(it.set.x - g.x, it.set.z - g.z); if (d < bd && Math.hypot(it.set.x - B.cx, it.set.z - B.cz) < B.r && (!it.set.kind || it.set.kind !== 'vault' || BRB.vaults[+it.set.id.slice(1, 2)].open)) { bd = d; best = it; } }
  if (!best) return null;
  if (bd < 1.6 && Math.abs(best.set.y - g.y) < 1.6) { try { botGunProfile(e, best.gun); e.brTier = Math.min(2, best.tier); e.dmg *= BRL_RAR[best.tier].dmg; e.hp = e.maxHp; brlRemove(best); BRL.taken.add(best.id); BRL.out.push(best.id); } catch (er) {} return null; }
  return set({ x: best.set.x, z: best.set.z, y: best.set.y }, 0.8);
}
// from brGoal: the last circles - into a building inside the next circle and hold there
function brbHideGoal(e, set) {
  const B = M.br; if (B.phase < 3 || e.tgt) return null; const to = B.to || { x: B.cx, z: B.cz, r: B.r };
  if (e.hide && Math.hypot(e.hide.x - to.x, e.hide.z - to.z) < to.r * 0.85) return set(e.hide, 1.0);
  const L = (MAPS[curMap] && MAPS[curMap].loot) || []; let best = null, bd = 60; const g = e.group.position;
  for (const s of L) { if (Math.hypot(s.x - to.x, s.z - to.z) > to.r * 0.8) continue; const d = Math.hypot(s.x - g.x, s.z - g.z); if (d < bd && !enemies.some(o => o !== e && o.hide === s)) { bd = d; best = s; } }
  if (!best) return null; e.hide = best; return set(best, 1.0);
}
