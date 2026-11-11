/* ================================================================== LAST TOKE (1.2.69): battle royale
   Sixteen players, one life each, everyone for themselves, everyone starting with a pistol. LOOT CRATES lie all over the
   map (white = common, blue = rare, purple = epic): USE opens one for a better gun and full health. The NIGHTSHADE
   CLOUD closes in four times on a spot inside the map; outside it you choke (harder every phase). Last one standing wins;
   if you go down you see where you placed and can watch the rest. Offline against bots, and online (ONLINE LAST TOKE):
   the host runs the cloud, the crates and the bots and sends ['b', ...]; a player's opened crates travel in their
   presence (bo) and the host marks them open for everyone; everyone handles the cloud's damage to themselves; the host
   names the last one standing and the round ends for all (then a fresh round, new crates). Late joiners watch. */
const BR_PHASES_N = [[45, 30, 0.62, 3], [35, 25, 0.38, 6], [30, 20, 0.18, 10], [25, 20, 0.04, 16]];
// STASH ISLAND (391 m) gets five longer phases: wait s, close s, radius share, damage a second
const BR_PHASES_BIG = [[45, 40, 0.6, 2], [40, 35, 0.36, 4], [35, 30, 0.2, 7], [30, 25, 0.09, 11], [20, 20, 0.03, 16]];   // (1.2.93: ~5 min for 16 players, was ~7)
let BR_PHASES = BR_PHASES_N;   // wait s, close s, radius (of the start), damage a second
const BR_TIERS = [{ n: 'COMMON', col: 0xe8e8e8, cats: ['smg', 'pi', 'sg'] }, { n: 'RARE', col: 0x3a9aff, cats: ['ar', 'sg', 'smg'] }, { n: 'EPIC', col: 0xb04aff, cats: ['lmg', 'mr', 'sr', 'ar'] }];
function brSetup() {
  BR_PHASES = ARENA > 120 ? BR_PHASES_BIG : BR_PHASES_N;
  const pr = PLAYRECT, cx0 = (pr[0] + pr[1]) / 2, cz0 = (pr[2] + pr[3]) / 2, R0 = Math.hypot(pr[1] - pr[0], pr[3] - pr[2]) / 2 + 4;
  M.br = { mine: [], winTxt: '', winName: '', phase: -1, t: 0, R0, r: R0, from: { x: cx0, z: cz0, r: R0 }, to: null, cx: cx0, cz: cz0, crates: [], place: 0, uH: false, group: new THREE.Group() };
  scene.add(M.br.group);
  // the cloud wall: an open cylinder, purple, seen from both sides
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 40, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0x9a3cff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  wall.position.y = 18; M.br.group.add(wall); M.br.wall = wall;
  // loot crates on open ground all over the map
  const used = [], want = ARENA > 120 ? 120 : ARENA > 44 ? 40 : 24, roll = () => { const r = Math.random(); return r < 0.12 ? 2 : r < 0.45 ? 1 : 0; };
  // a map with loot spots (STASH ISLAND: inside the buildings, upstairs, on the roofs) fills most of its crates there
  const spots = ((MAPS[curMap] && MAPS[curMap].loot) || []).slice().sort(() => Math.random() - 0.5);
  const hasSpots = spots.length >= want * 0.6, rollQ = q => { const r = Math.random(); return q >= 2 ? (r < 0.4 ? 2 : r < 0.85 ? 1 : 0) : q >= 1 ? (r < 0.15 ? 2 : r < 0.55 ? 1 : 0) : (r < 0.06 ? 2 : r < 0.35 ? 1 : 0); };   // better loot where it's harder to get
  for (const s of spots) { if (M.br.crates.length >= want || !netHostNow()) break; if (brlFloorSpot(s)) continue;   // (the other half is floor loot, brloot.js)
    if (used.some(u => Math.hypot(u.x - s.x, u.z - s.z) < 5 && Math.abs((u.y || 0) - (s.y || 0)) < 1)) continue; used.push(s); const c = brCrate(s.x, s.z, rollQ(s.q | 0), s.y || 0); c.id = M.br.crates.length; M.br.crates.push(c); }
  for (let i = 0; i < 600 && !hasSpots && M.br.crates.length < want && netHostNow(); i++) {   // (only maps without loot spots scatter crates on open ground)   // online, only the host makes the crates (everyone else gets them in the pack)
    const o = openNear(rnd(pr[0] + 3, pr[1] - 3), rnd(pr[2] + 3, pr[3] - 3)); if (duelIn(o.x, o.z, 1)) continue; if (used.some(u => Math.hypot(u.x - o.x, u.z - o.z) < 9)) continue; used.push(o);
    const roll = Math.random(), tier = roll < 0.12 ? 2 : roll < 0.45 ? 1 : 0; const c = brCrate(o.x, o.z, tier, TERR.on ? TH(o.x, o.z) : 0); c.id = M.br.crates.length; M.br.crates.push(c);
  }
  try { brbVaultsBuild(); } catch (e) { reportError(e); }   // the vaults (brbots.js)
  try { brfgSetup(); } catch (e) { reportError(e); }   // balloons, ladders (brfight.js)
  try { briSetup(); } catch (e) { reportError(e); }   // tents, sheds, tunnels, the train (brisle.js)
  try { brlSetup(); } catch (e) { reportError(e); }   // floor loot on tables, racks, shelves (brloot.js)
  try { brsqSetup(); brpSetup(); brxSetup(); } catch (e) { reportError(e); }   // re-up beacons (brsquad.js), stats and dailies (brprog.js)
  try { vhSetup(); } catch (e) {}
  try { ltSetup(); } catch (e) { reportError(e); }   // plates, cash, buy stations, contracts, storm (lasttoke2.js)
  try { brfStartPhase(M.br); } catch (e) { reportError(e); }   // WARM-UP, the bong and the float in (brintro.js)
  if (!$('brCloud')) { const d = document.createElement('div'); d.id = 'brCloud'; ($('hud') || document.body).appendChild(d); const s = document.createElement('style'); s.textContent = '#brCloud{position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .4s;background:radial-gradient(circle at 50% 50%,rgba(120,40,200,.15),rgba(90,20,160,.6));z-index:4}'; document.head.appendChild(s); }
}
function brCrate(x, z, tier, y = 0) {
  const T = BR_TIERS[tier], g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 }), glow = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(T.col), emissiveIntensity: 1.6 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.7), wood); b.position.y = 0.3; g.add(b);
  for (const sx of [-0.4, 0.4]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.72), glow); s.position.set(sx, 0.3, 0); g.add(s); }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 9, 10, 1, true), new THREE.MeshBasicMaterial({ color: T.col, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 4.5; g.add(beam);
  g.position.set(x, y, z); M.br.group.add(g);
  return { x, z, y, tier, g, open: false };
}
// everyone back to a pistol at the start
function brArmAll() { if (!M.br) return; try { equipClass({ only: 'sidearm', e: 'frag', k: 'none', factory: true }); G.grenades = 0; } catch (e) {} for (const e of enemies) if (e.entry && !e.net) { try { botGunProfile(e, 'sidearm'); } catch (er) {} e.brTier = -1; } M.br.myTier = -1; try { brlStart(); } catch (e) {} }
function brGun(tier) { const cats = M && M.feat && M.feat.pistols ? ['pi'] : BR_TIERS[tier].cats; const pool = ARMORY.filter(d => cats.includes(d.cat) && CATS[d.cat] && (CATS[d.cat].slot === 'primary' || d.cat === 'pi')); return pool.length ? pool[(Math.random() * pool.length) | 0] : ARM.marc; }
function brOpen(c, who) {
  if (c.open) return; c.open = true; M.br.group.remove(c.g); const d = brGun(c.tier), T = BR_TIERS[c.tier];
  if (who === 'player' && M.online && M.br.mine.indexOf(c.id) < 0) M.br.mine.push(c.id);
  try { ltCrate(c, who); } catch (e) {}
  if (who === 'player') { try { brlGive(d, c.tier); if (Math.random() < 0.5) BRL.heals.nug = Math.min(6, BRL.heals.nug + 1); G.grenades = 1; G.health = G.maxHp || 100; M.br.myTier = c.tier; showBanner(`${T.n} LOOT`, d.name); sfx.pickup(); } catch (e) {} }
  else { try { botGunProfile(who, d.id); who.hp = who.maxHp; who.brTier = c.tier; } catch (e) {} }
}
const brAliveBots = () => enemies.filter(e => e.entry && e.entry.alive !== false);
function brUpdate(dt) {
  const B = M.br; if (!B) return; if (M.online && !netHostNow()) netObjApply();   // the host's cloud and crates (1.2.82: was never applied on joiners)
  try { brfTick(); if (brPre(dt)) return; } catch (e) { reportError(e); }   // WARM-UP / the bong / the float (brintro.js)
  try { vhUpdate(dt); } catch (e) {} try { ltTick(dt); } catch (e) {} try { duelUpdate(dt); } catch (e) {}
  if (!B.armed) { B.armed = true; brArmAll(); if (sqOn() && !BRF.ran) sqGroup(); }   // (after the float in, squads already start together)   // the first frame of the match: everyone down to a pistol (after the class was equipped)
  // the cloud: wait, then close on the next circle (a spot inside the current one)
  B.t -= dt; const host = netHostNow();
  if (host && B.t <= 0) {
    if (B.phase < 0 || B.closing) { B.closing = false; B.phase++; if (B.phase === 1 || B.phase === 2) try { ltDrop(); } catch (e) {} const P0 = BR_PHASES[B.phase]; if (!P0) { B.t = 1e9; } else { B.t = P0[0]; const r = B.R0 * P0[2], a = Math.random() * TAU, d = Math.random() * Math.max(0, B.r - r); B.to = { x: B.cx + Math.cos(a) * d, z: B.cz + Math.sin(a) * d, r }; B.from = { x: B.cx, z: B.cz, r: B.r }; try { showBanner('THE CLOUD IS COMING', `it closes in ${P0[0]} s · get inside the circle`); } catch (e) {} } }
    else { B.closing = true; B.t = BR_PHASES[B.phase][1]; try { showBanner('THE CLOUD IS CLOSING', 'move!'); sfx.streak(); } catch (e) {} }
  }
  if (B.closing && B.to) { const P0 = BR_PHASES[B.phase], k = 1 - clamp(B.t / P0[1], 0, 1); B.cx = B.from.x + (B.to.x - B.from.x) * k; B.cz = B.from.z + (B.to.z - B.from.z) * k; B.r = B.from.r + (B.to.r - B.from.r) * k; }
  B.wall.position.x = B.cx; B.wall.position.z = B.cz; B.wall.scale.set(Math.max(0.5, B.r), 1, Math.max(0.5, B.r)); B.wall.material.opacity = 0.14 + Math.sin(NOW * 2) * 0.04;
  const dmg = B.phase >= 0 && BR_PHASES[B.phase] ? BR_PHASES[B.phase][3] : 1.5, out = (x, z) => Math.hypot(x - B.cx, z - B.cz) > B.r;
  // choking outside the circle
  const meOut = playerAlive() && !DUEL.on && out(P.x, P.z), cl = $('brCloud'); if (cl) cl.style.opacity = meOut ? 1 : 0;
  if (meOut) { G.lastHit = G.time; G.health -= dmg * dt; if (G.health <= 0) { G.health = 1; G.spawnProt = 0; try { hurtPlayer(999, P.x + 0.01, P.z); } catch (e) {} } }
  if (host) for (const e of brAliveBots()) if (!e.net && !e.duel && out(e.group.position.x, e.group.position.z)) try { damageEnemy(e, dmg * dt, false, null, false, 'cloud'); } catch (er) {}
  // crates: USE next to one opens it; bots open the one they reach
  const u = kb('use') || (typeof pad !== 'undefined' && pad.use);
  for (const c of B.crates) {
    if (c.open) continue; c.g.rotation.y += dt * 0.4;
    if (playerAlive() && Math.hypot(P.x - c.x, P.z - c.z) < 1.8 && Math.abs((P.y || 0) - (c.y || 0)) < 1.6) { G.interactTxt = `${BR_TIERS[c.tier].n} LOOT CRATE · PRESS ${actName('use')} TO OPEN`; try { showMsg(G.interactTxt); } catch (e) {} if (u && !B.uH) brOpen(c, 'player'); }
    else if (host) for (const e of brAliveBots()) if (!e.net && (e.brTier === undefined || e.brTier < c.tier) && Math.hypot(e.group.position.x - c.x, e.group.position.z - c.z) < 1.4 && Math.abs(e.group.position.y - (c.y || 0)) < 1.6) { brOpen(c, e); break; }
  }
  B.uH = u;
  try { brlTick(dt); brlNameCol(); } catch (e) { reportError(e); }   // floor loot, ammo, heals (brloot.js)
  try { brsqTick(dt); brbTick(dt); brfgTick(dt); briTick(dt); brpTick(dt); brnTick(dt); brxTick(dt); } catch (e) { reportError(e); }   // cards, beacons, callouts, carrying (brsquad.js)
  // the end: last one standing
  for (const e of brAliveBots()) if (!e.net && e.brTier === undefined) { try { botGunProfile(e, 'sidearm'); } catch (er) {} e.brTier = -1; }   // bots that just came in start with a pistol too
  if (sqOn()) {   // DUOS / SQUADS: last squad standing
    sqUpdate(dt); const T = sqTeamsLeft(); B.most = Math.max(B.most || 0, T.size);
    if (!B.place && !T.has(M.myTeam)) { B.place = T.size + 1; try { showBanner(`YOUR SQUAD PLACED #${B.place}`, `of ${Math.ceil(M.entries.length / M.squad)} · watch the rest or leave with ESC`); } catch (e) {} }
    if (M.online) { if (host && !B.winTxt && T.size <= 1 && B.most >= 2) { const t = [...T][0]; B.winTxt = t === undefined ? '-' : 'SQ:' + t; B.winName = t === undefined ? 'NOBODY' : (t === M.myTeam ? NET.nick + "'S SQUAD" : 'SQUAD ' + (t + 1)); } return; }
    if (!M.over && T.size <= 1 && B.most >= 2) { const win = T.has(M.myTeam); if (win) { B.place = 1; try { showBanner('LAST TOKE', 'your squad is the last one standing'); } catch (e) {} } endMatch(win ? M.me : ((brAliveBots()[0] || {}).entry || null)); }
    return;
  }
  const alive = brAliveBots().length + (playerAlive() ? 1 : 0);
  if (!B.place && !playerAlive() && G.state !== 'playing') { B.place = brAliveBots().length + 1; try { showBanner(`YOU PLACED #${B.place}`, `of ${M.entries.length} · watch the rest or leave with ESC`); } catch (e) {} }
  B.most = Math.max(B.most || 0, alive);
  if (M.online) {   // online: the host names the winner, net.js ends the round for everyone
    if (host && !B.winTxt && alive <= 1 && B.most >= 2) { const last = brAliveBots()[0]; if (playerAlive()) { B.winTxt = NET.me; B.winName = NET.nick; } else if (last) { B.winTxt = last.net || (last.entry && last.entry.botLabel) || 'bot'; B.winName = last.entry ? last.entry.name : 'A BOT'; } else { B.winTxt = '-'; B.winName = 'NOBODY'; } }
    return;
  }
  if (!M.over && alive <= 1 && B.most >= 2) { const w = playerAlive() ? M.me : (brAliveBots()[0] || {}).entry || null; if (w === M.me) B.place = 1; try { if (w === M.me) showBanner('LAST TOKE', 'winner winner, munchie dinner'); } catch (e) {} endMatch(w); }
}
// bots: run for the circle when they are outside (or it is closing on them), else go for a better crate nearby
function brGoal(e, keep, near, set) {
  if (brWarmNow()) return null;   // WARM-UP: just fight
  { const dg = duelGoal(e, set); if (dg) return dg; }   // the duel bot goes for me
  { const cg = brsqBotGoal(e, set); if (cg) return cg; }   // stash cards, beacons, callouts (brsquad.js)
  { const sg = sqBotGoal(e, set); if (sg) return sg; }   // squads: pick up a downed squadmate first
  const B = M.br, g = e.group.position, d = Math.hypot(g.x - B.cx, g.z - B.cz);
  if (d > B.r * 0.85 || (B.closing && B.to && Math.hypot(g.x - B.to.x, g.z - B.to.z) > B.to.r * 0.8)) { const tx = B.to && B.closing ? B.to.x : B.cx, tz = B.to && B.closing ? B.to.z : B.cz; const car = vhBotWant(e, tx, tz); if (car) return set(car, 1.2); return set(near({ x: tx + rnd(-3, 3), z: tz + rnd(-3, 3), y: 0 }, 3), 1.5); }
  { const hg = brbHideGoal(e, set); if (hg) return hg; }   // the last circles: inside a building (brbots.js)
  let best = null, bd = 30; for (const c of B.crates) { if (c.open || (e.brTier !== undefined && c.tier <= e.brTier)) continue; const dd = Math.hypot(c.x - g.x, c.z - g.z); if (dd < bd && Math.hypot(c.x - B.cx, c.z - B.cz) < B.r) { bd = dd; best = c; } }
  if (best) return set({ x: best.x, z: best.z, y: best.y || 0 }, 0.8);
  { const lg = brbLootGoal(e, set); if (lg) return lg; }   // a better gun on the floor (brbots.js)
  return null;
}
function brHud() {
  const B = M.br; if (!B) return ''; { const fh = brfHud(); if (fh) return fh + sqHud(); } const n = brAliveBots().length + (playerAlive() ? 1 : 0), out = playerAlive() && Math.hypot(P.x - B.cx, P.z - B.cz) > B.r;
  return `<b>${n}</b> ALIVE · ${B.phase < 0 ? 'THE CLOUD STARTS SOON' : B.closing ? 'THE CLOUD IS CLOSING' : BR_PHASES[B.phase] ? `CLOUD CLOSES IN ${Math.ceil(B.t)} s` : 'FINAL CIRCLE'}${out ? ' · <b style="color:#c070ff">GET INTO THE CIRCLE!</b>' : ''}${vhHud()}${sqHud()}${duelHud()}`;
}
function brMarkers(out) { const B = M.br; if (!B || brfHideLoot()) return; try { ltMarkers(out); brsqMarkers(out); brbMarkers(out); briMarkers(out); brpMarkers(out); } catch (e) {} for (const c of B.crates) if (!c.open && Math.hypot(c.x - P.x, c.z - P.z) < (ARENA > 44 ? 22 : 35)) out.push({ x: c.x, y: (c.y || 0) + 1.4, z: c.z, t: 'LOOT', c: '#' + BR_TIERS[c.tier].col.toString(16).padStart(6, '0') }); }
function brClear() { try { brfReset(); brlClear(); brbVaultsClear(); brfgClear(); briClear(); brnClear(); } catch (e) {} try { vhClear(); ltClear(); } catch (e) {} if (M && M.br && M.br.group && M.br.group.parent) M.br.group.parent.remove(M.br.group); const cl = $('brCloud'); if (cl) cl.style.opacity = 0; }

/* ---------- online */
function brPack() {
  const B = M.br, r1 = v => Math.round(v * 10) / 10, fr = B.from || { x: 0, z: 0, r: 0 }, to = B.to || { x: 0, z: 0, r: 0 };
  return ['b', B.phase, r1(B.t), B.closing ? 1 : 0, r1(B.cx), r1(B.cz), r1(B.r), r1(fr.x), r1(fr.z), r1(fr.r), r1(to.x), r1(to.z), r1(to.r), B.most | 0, B.winTxt || '', B.winName || '', B.crates.length, ...B.crates.flatMap(c => [r1(c.x), r1(c.z), c.tier, c.open ? 1 : 0, r1(c.y || 0)]), BRL.seed >>> 0, brbVaultMask(), Math.round(BRI.age * 10) / 10];
}
function brApply(o) {
  const B = M.br; if (!B || netHostNow()) return; const num = i => +o[i] || 0;
  B.phase = o[1] | 0; B.t = num(2); B.closing = !!o[3]; B.cx = num(4); B.cz = num(5); B.r = num(6) || B.r;
  B.from = { x: num(7), z: num(8), r: num(9) }; B.to = num(12) > 0 ? { x: num(10), z: num(11), r: num(12) } : null; B.most = o[13] | 0;
  B.winTxt = String(o[14] || ''); B.winName = String(o[15] || '');
  const n = Math.min(200, o[16] | 0);
  if (B.crates.length !== n || (n && B.crates.some((c, i) => Math.abs(c.x - num(17 + i * 5)) > 0.2))) { for (const c of B.crates) if (!c.open) B.group.remove(c.g); B.crates = []; for (let i = 0; i < n; i++) { const c = brCrate(num(17 + i * 5), num(18 + i * 5), clamp(o[19 + i * 5] | 0, 0, 3), clamp(num(21 + i * 5), 0, 30)); c.id = i; if (c.tier >= 3) try { ltDropFx(c); } catch (e) {} B.crates.push(c); } }
  for (let i = 0; i < n; i++) { const c = B.crates[i]; if (o[20 + i * 5] && !c.open) { c.open = true; B.group.remove(c.g); } }
  try { brlSeedIn(+o[17 + n * 5] || 0); brbVaultApply(+o[18 + n * 5] || 0); B.trainAge = +o[19 + n * 5] || 0; } catch (e) {}   // the floor loot's seed, the open vaults
}
// the host: crates other players opened
function brRemoteOpened(list) { const B = M.br; if (!B) return; for (const id of list) { const c = B.crates[id | 0]; if (c && !c.open) { c.open = true; B.group.remove(c.g); } } }
