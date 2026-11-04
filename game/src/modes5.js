/* ================================================================== LAST TOKE (1.2.69): battle royale
   Sixteen players, one life each, everyone for themselves, everyone starting with a pistol. LOOT CRATES lie all over the
   map (white = common, blue = rare, purple = epic): USE opens one for a better gun and full health. The NIGHTSHADE
   CLOUD closes in four times on a spot inside the map; outside it you choke (harder every phase). Last one standing wins;
   if you go down you see where you placed and can watch the rest. Offline, against bots. */
const BR_PHASES = [[45, 30, 0.62, 3], [35, 25, 0.38, 6], [30, 20, 0.18, 10], [25, 20, 0.04, 16]];   // wait s, close s, radius (of the start), damage a second
const BR_TIERS = [{ n: 'COMMON', col: 0xe8e8e8, cats: ['smg', 'pi', 'sg'] }, { n: 'RARE', col: 0x3a9aff, cats: ['ar', 'sg', 'smg'] }, { n: 'EPIC', col: 0xb04aff, cats: ['lmg', 'mr', 'sr', 'ar'] }];
function brSetup() {
  const pr = PLAYRECT, cx0 = (pr[0] + pr[1]) / 2, cz0 = (pr[2] + pr[3]) / 2, R0 = Math.hypot(pr[1] - pr[0], pr[3] - pr[2]) / 2 + 4;
  M.br = { phase: -1, t: 0, R0, r: R0, from: { x: cx0, z: cz0, r: R0 }, to: null, cx: cx0, cz: cz0, crates: [], place: 0, uH: false, group: new THREE.Group() };
  scene.add(M.br.group);
  // the cloud wall: an open cylinder, purple, seen from both sides
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 40, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0x9a3cff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  wall.position.y = 18; M.br.group.add(wall); M.br.wall = wall;
  // loot crates on open ground all over the map
  const used = [];
  for (let i = 0; i < 160 && M.br.crates.length < 24; i++) {
    const o = openNear(rnd(pr[0] + 3, pr[1] - 3), rnd(pr[2] + 3, pr[3] - 3)); if (used.some(u => Math.hypot(u.x - o.x, u.z - o.z) < 9)) continue; used.push(o);
    const roll = Math.random(), tier = roll < 0.12 ? 2 : roll < 0.45 ? 1 : 0; M.br.crates.push(brCrate(o.x, o.z, tier));
  }
  if (!$('brCloud')) { const d = document.createElement('div'); d.id = 'brCloud'; ($('hud') || document.body).appendChild(d); const s = document.createElement('style'); s.textContent = '#brCloud{position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .4s;background:radial-gradient(circle at 50% 50%,rgba(120,40,200,.15),rgba(90,20,160,.6));z-index:4}'; document.head.appendChild(s); }
}
function brCrate(x, z, tier) {
  const T = BR_TIERS[tier], g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 }), glow = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(T.col), emissiveIntensity: 1.6 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.7), wood); b.position.y = 0.3; g.add(b);
  for (const sx of [-0.4, 0.4]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.72), glow); s.position.set(sx, 0.3, 0); g.add(s); }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 9, 10, 1, true), new THREE.MeshBasicMaterial({ color: T.col, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 4.5; g.add(beam);
  g.position.set(x, 0, z); M.br.group.add(g);
  return { x, z, y: 0, tier, g, open: false };
}
// everyone back to a pistol at the start
function brArmAll() { if (!M.br) return; try { equipClass({ only: 'sidearm', e: 'frag', k: 'none', factory: true }); G.grenades = 0; } catch (e) {} for (const e of enemies) if (e.entry && !e.net) { try { botGunProfile(e, 'sidearm'); } catch (er) {} e.brTier = -1; } M.br.myTier = -1; }
function brGun(tier) { const pool = ARMORY.filter(d => BR_TIERS[tier].cats.includes(d.cat) && CATS[d.cat] && (CATS[d.cat].slot === 'primary' || d.cat === 'pi')); return pool.length ? pool[(Math.random() * pool.length) | 0] : ARM.marc; }
function brOpen(c, who) {
  if (c.open) return; c.open = true; M.br.group.remove(c.g); const d = brGun(c.tier), T = BR_TIERS[c.tier];
  if (who === 'player') { try { equipClass({ p: d.id, s: 'sidearm', e: 'frag', k: 'none', factory: true }); G.grenades = 1; G.health = G.maxHp || 100; M.br.myTier = c.tier; showBanner(`${T.n} LOOT`, d.name); sfx.pickup(); } catch (e) {} }
  else { try { botGunProfile(who, d.id); who.hp = who.maxHp; who.brTier = c.tier; } catch (e) {} }
}
const brAliveBots = () => enemies.filter(e => e.entry && e.entry.alive !== false);
function brUpdate(dt) {
  const B = M.br; if (!B) return;
  if (!B.armed) { B.armed = true; brArmAll(); }   // the first frame of the match: everyone down to a pistol (after the class was equipped)
  // the cloud: wait, then close on the next circle (a spot inside the current one)
  B.t -= dt;
  if (B.t <= 0) {
    if (B.phase < 0 || B.closing) { B.closing = false; B.phase++; const P0 = BR_PHASES[B.phase]; if (!P0) { B.t = 1e9; } else { B.t = P0[0]; const r = B.R0 * P0[2], a = Math.random() * TAU, d = Math.random() * Math.max(0, B.r - r); B.to = { x: B.cx + Math.cos(a) * d, z: B.cz + Math.sin(a) * d, r }; B.from = { x: B.cx, z: B.cz, r: B.r }; try { showBanner('THE CLOUD IS COMING', `it closes in ${P0[0]} s · get inside the circle`); } catch (e) {} } }
    else { B.closing = true; B.t = BR_PHASES[B.phase][1]; try { showBanner('THE CLOUD IS CLOSING', 'move!'); sfx.streak(); } catch (e) {} }
  }
  if (B.closing && B.to) { const P0 = BR_PHASES[B.phase], k = 1 - clamp(B.t / P0[1], 0, 1); B.cx = B.from.x + (B.to.x - B.from.x) * k; B.cz = B.from.z + (B.to.z - B.from.z) * k; B.r = B.from.r + (B.to.r - B.from.r) * k; }
  B.wall.position.x = B.cx; B.wall.position.z = B.cz; B.wall.scale.set(Math.max(0.5, B.r), 1, Math.max(0.5, B.r)); B.wall.material.opacity = 0.14 + Math.sin(NOW * 2) * 0.04;
  const dmg = B.phase >= 0 && BR_PHASES[B.phase] ? BR_PHASES[B.phase][3] : 1.5, out = (x, z) => Math.hypot(x - B.cx, z - B.cz) > B.r;
  // choking outside the circle
  const meOut = playerAlive() && out(P.x, P.z), cl = $('brCloud'); if (cl) cl.style.opacity = meOut ? 1 : 0;
  if (meOut) { G.lastHit = G.time; G.health -= dmg * dt; if (G.health <= 0) { G.health = 1; G.spawnProt = 0; try { hurtPlayer(999, P.x + 0.01, P.z); } catch (e) {} } }
  for (const e of brAliveBots()) if (!e.net && out(e.group.position.x, e.group.position.z)) try { damageEnemy(e, dmg * dt, false, null, false, 'cloud'); } catch (er) {}
  // crates: USE next to one opens it; bots open the one they reach
  const u = kb('use') || (typeof pad !== 'undefined' && pad.use);
  for (const c of B.crates) {
    if (c.open) continue; c.g.rotation.y += dt * 0.4;
    if (playerAlive() && Math.hypot(P.x - c.x, P.z - c.z) < 1.8) { G.interactTxt = `${BR_TIERS[c.tier].n} LOOT CRATE · PRESS ${actName('use')} TO OPEN`; try { showMsg(G.interactTxt); } catch (e) {} if (u && !B.uH) brOpen(c, 'player'); }
    else for (const e of brAliveBots()) if (!e.net && (e.brTier === undefined || e.brTier < c.tier) && Math.hypot(e.group.position.x - c.x, e.group.position.z - c.z) < 1.4) { brOpen(c, e); break; }
  }
  B.uH = u;
  // the end: last one standing
  for (const e of brAliveBots()) if (!e.net && e.brTier === undefined) { try { botGunProfile(e, 'sidearm'); } catch (er) {} e.brTier = -1; }   // bots that just came in start with a pistol too
  const alive = brAliveBots().length + (playerAlive() ? 1 : 0);
  if (!B.place && !playerAlive() && G.state !== 'playing') { B.place = brAliveBots().length + 1; try { showBanner(`YOU PLACED #${B.place}`, `of ${M.entries.length} · watch the rest or leave with ESC`); } catch (e) {} }
  B.most = Math.max(B.most || 0, alive);
  if (!M.over && alive <= 1 && B.most >= 2) { const w = playerAlive() ? M.me : (brAliveBots()[0] || {}).entry || null; if (w === M.me) B.place = 1; try { if (w === M.me) showBanner('LAST TOKE', 'winner winner, munchie dinner'); } catch (e) {} endMatch(w); }
}
// bots: run for the circle when they are outside (or it is closing on them), else go for a better crate nearby
function brGoal(e, keep, near, set) {
  const B = M.br, g = e.group.position, d = Math.hypot(g.x - B.cx, g.z - B.cz);
  if (d > B.r * 0.85 || (B.closing && B.to && Math.hypot(g.x - B.to.x, g.z - B.to.z) > B.to.r * 0.8)) { const tx = B.to && B.closing ? B.to.x : B.cx, tz = B.to && B.closing ? B.to.z : B.cz; return set(near({ x: tx + rnd(-3, 3), z: tz + rnd(-3, 3), y: 0 }, 3), 1.5); }
  let best = null, bd = 30; for (const c of B.crates) { if (c.open || (e.brTier !== undefined && c.tier <= e.brTier)) continue; const dd = Math.hypot(c.x - g.x, c.z - g.z); if (dd < bd && Math.hypot(c.x - B.cx, c.z - B.cz) < B.r) { bd = dd; best = c; } }
  if (best) return set({ x: best.x, z: best.z, y: 0 }, 0.8);
  return null;
}
function brHud() {
  const B = M.br; if (!B) return ''; const n = brAliveBots().length + (playerAlive() ? 1 : 0), out = playerAlive() && Math.hypot(P.x - B.cx, P.z - B.cz) > B.r;
  return `<b>${n}</b> ALIVE · ${B.phase < 0 ? 'THE CLOUD STARTS SOON' : B.closing ? 'THE CLOUD IS CLOSING' : BR_PHASES[B.phase] ? `CLOUD CLOSES IN ${Math.ceil(B.t)} s` : 'FINAL CIRCLE'}${out ? ' · <b style="color:#c070ff">GET INTO THE CIRCLE!</b>' : ''}`;
}
function brMarkers(out) { const B = M.br; if (!B) return; for (const c of B.crates) if (!c.open && Math.hypot(c.x - P.x, c.z - P.z) < 35) out.push({ x: c.x, y: 1.4, z: c.z, t: 'LOOT', c: '#' + BR_TIERS[c.tier].col.toString(16).padStart(6, '0') }); }
function brClear() { if (M && M.br && M.br.group && M.br.group.parent) M.br.group.parent.remove(M.br.group); const cl = $('brCloud'); if (cl) cl.style.opacity = 0; }
