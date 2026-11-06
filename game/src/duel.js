/* ================================================================== THE HOTBOX DUEL (1.2.81)
   LAST TOKE's second chance (offline, on STASH ISLAND). The first time you die before the last two circles, you don't
   go out: you wake up in THE HOTBOX, a closed concrete pit on the east beach, facing someone else who already went out.
   Pistols only, 3 seconds to get ready, no cloud in there. Win and you drop back onto the island near the circle with
   60 HP and a pistol; lose and you're out for good. Once a match. The bot can win too: then it drops back in instead.
   The pit's walls are 4 m high (too high to climb), so nobody on the island gets in or shoots in. */
const DUEL_PEN = { stashisle: { x: 182, z: -70, w: 8, d: 12 } };
const DUEL = { on: null };
const duelPen = () => DUEL_PEN[curMap] || null;
const duelIn = (x, z, pad = 0) => { const p = duelPen(); return !!p && Math.abs(x - p.x) < p.w / 2 + pad && Math.abs(z - p.z) < p.d / 2 + pad; };
// the pit itself (built with the map)
function duelBuild(pen) {
  const { x, z, w, d } = pen, x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, h = 4;
  for (const [ax, az, bx, bz] of [[x0, z0, x1, z0], [x0, z1, x1, z1], [x0, z0, x0, z1], [x1, z0, x1, z1]]) wall(ax, az, bx, bz, h, 'concrete', { t: 0.4 });
  floorQuad(x, z, w - 0.4, d - 0.4, 0.02, 'concrete', 3);
  blk(x - 1.6, z - 1.2, 1.4, 0.8, 1.0, 'wood', { walk: true }); blk(x + 1.6, z + 1.2, 1.4, 0.8, 1.0, 'wood', { walk: true });   // two crates of cover
  try { MAT.duelSign = MAT.duelSign || neonMat('THE HOTBOX', '#ff6a3a', 'win and you go back in', '#140806', 512, 160); B('duelSign', 0.05, 1.1, 3.4, x0 - 0.23, 3.1, z, 0, 0, 0, false); } catch (e) {}
}
// from hurtPlayer when the hit would kill me (after the squads check): true = off to the duel instead
function duelTake() {
  const B = M && M.br, pen = duelPen();
  if (!B || !pen || M.online || B.duelUsed || B.phase >= 2 || DUEL.on) return false;
  const pool = M.entries.filter(en => !en.isPlayer && en.alive === false && !en.duelDone && !(M.squad > 1 && en.team === M.myTeam)); if (!pool.length) return false;
  B.duelUsed = true; const en = pool[pool.length - 1]; en.duelDone = true; en.alive = true;
  const ke = G.killer && G.killer.entry; if (ke) try { creditKill(ke, M.me); feedLine(`${nameHtml(ke)} <span class="fw">${botGunName(ke.bot)}</span> <b>YOU</b> <span class="fw">· TO THE HOTBOX</span>`); } catch (e) {}
  try { if (VH.me) vhExit(true); } catch (e) {}
  G.downed = false; P.slideT = 0; P.mantle = null;
  Object.assign(P, { x: pen.x, z: pen.z + pen.d / 2 - 1.2, y: groundAt(pen.x, pen.z + pen.d / 2 - 1.2, 1e3), vx: 0, vz: 0, vy: 0, onGround: true }); P.yaw = 0; P.pitch = 0;
  G.health = G.maxHp || 100; G.spawnProt = 0;
  try { equipClass({ only: 'sidearm', e: 'frag', k: 'none', factory: true }); G.grenades = 0; } catch (e) {}
  let bot = null; try { bot = spawnBot(en, { x: pen.x, z: pen.z - pen.d / 2 + 1.2, y: groundAt(pen.x, pen.z - pen.d / 2 + 1.2, 1e3) }); } catch (e) {}
  if (!bot) bot = enemies.find(e => e.entry === en) || null;
  if (bot) { bot.duel = true; bot.hp = bot.maxHp; bot.brTier = 99; bot.reactT = 3.2; bot.spawnProt = 0; bot.group.rotation.y = 0; try { botGunProfile(bot, 'sidearm'); } catch (e) {} }
  DUEL.on = { bot, en, wait: 3, t: 0 };
  try { showBanner('THE HOTBOX DUEL', `win it and you go back in · ${en.name} is in here with you`); sfx.streak(); } catch (e) {}
  return true;
}
// every frame of LAST TOKE (from brUpdate)
function duelUpdate(dt) {
  const D = DUEL.on; if (!D) return;
  D.t += dt; if (D.wait > 0) { D.wait -= dt; if (D.bot) D.bot.reactT = Math.max(D.bot.reactT || 0, D.wait); try { showMsg(D.wait > 0 ? `GET READY · ${Math.ceil(D.wait)}` : 'FIGHT!'); } catch (e) {} }
  const B = M.br; if (!B) { DUEL.on = null; return; }
  const botAlive = D.bot && enemies.includes(D.bot) && D.en.alive !== false;
  if (!playerAlive()) {   // I lost: the bot goes back in
    DUEL.on = null; if (botAlive) duelSendBack(D.bot); return;
  }
  if (!botAlive) {   // I won: back onto the island
    DUEL.on = null; B.duelWon = 1; try { achAdd('duelwins'); } catch (e) {}
    const a = Math.random() * TAU, r = Math.max(0, B.r * 0.55), o = openNear(B.cx + Math.cos(a) * r * Math.random(), B.cz + Math.sin(a) * r * Math.random());
    Object.assign(P, { x: o.x, z: o.z, y: groundAt(o.x, o.z, 2), vx: 0, vz: 0, vy: 0 }); G.health = Math.min(G.maxHp || 100, 60); G.spawnProt = 1.5;
    try { showBanner('YOU WON THE DUEL', 'back on the island · find a better gun'); sfx.streak(); } catch (e) {}
  }
}
function duelSendBack(e) {
  const B = M.br; e.duel = false; e.brTier = -1;
  const a = Math.random() * TAU, o = openNear(B.cx + Math.cos(a) * B.r * 0.4, B.cz + Math.sin(a) * B.r * 0.4); e.group.position.set(o.x, groundAt(o.x, o.z, 2), o.z); e.goal = null;
}
// bots: the duel bot only goes for me; nobody's goal is inside the pit
function duelGoal(e, set) { if (!e.duel) return null; return set({ x: P.x, z: P.z, y: 0 }, 0.4); }
const duelHud = () => DUEL.on ? ' · <b style="color:#ff8a4a">THE HOTBOX DUEL</b>' : '';
function duelClear() { DUEL.on = null; }
