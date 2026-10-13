/* ================================================================== matches: game modes, teams, bots, objectives, scoreboard */
// Every mode except Survival is a bot match: the player and AI soldiers on teams (or every man for himself),
// with respawns, objectives and a score limit. Survival keeps the original wave defence.
const MODES = {
  tdm: { name: 'TEAM DEATHMATCH', short: 'TDM', icon: 'TDM', desc: 'Two teams, one goal: more kills than the other side. Respawn after every death.', teams: true, respawn: 3, score: 50, time: 8, perTeam: 6, unit: 'KILLS' },
  ffa: { name: 'FREE-FOR-ALL', short: 'FFA', icon: 'FFA', desc: 'Everyone is your enemy. First to the kill limit wins.', teams: false, respawn: 2.5, score: 20, time: 8, players: 8, unit: 'KILLS' },
  gun: { name: 'GUN GAME', short: 'GUN', icon: 'GUN', desc: 'Every kill swaps your gun for the next of 20, pistols to snipers. First to finish the ladder wins.', teams: false, respawn: 2.5, score: 20, time: 10, players: 8, unit: 'LEVELS' },
  hp: { name: 'HARDPOINT', short: 'HP', icon: 'HP', desc: 'Hold the marked zone to score a point a second. The zone moves every minute.', teams: true, respawn: 4, score: 150, time: 10, perTeam: 6, unit: 'POINTS' },
  ctf: { name: 'CAPTURE THE FLAG', short: 'CTF', icon: 'CTF', desc: 'Grab the enemy flag and run it back to yours. Your own flag has to be home to score.', teams: true, respawn: 5, score: 3, time: 10, perTeam: 6, unit: 'CAPTURES' },
  snd: { name: 'SEARCH & DESTROY', short: 'S&D', icon: 'S&D', desc: 'One life per round. Attackers plant the bomb at A or B, defenders stop them. First to 4 rounds.', teams: true, respawn: 0, score: 4, time: 0, perTeam: 5, unit: 'ROUNDS' },
  otdm: { name: 'ONLINE TEAM DEATHMATCH', short: 'ONLINE TDM', icon: 'NET', desc: 'Real people, two teams. Jump into a public match, or play with friends using a private code.', teams: true, respawn: 3, score: 40, time: 0, perTeam: 8, unit: 'KILLS', online: true },
  offa: { name: 'ONLINE FREE-FOR-ALL', short: 'ONLINE FFA', icon: 'NET', desc: 'Real people, every one for themselves. First to the kill limit wins the round, then a new one starts.', teams: false, respawn: 2.5, score: 20, time: 0, players: 12, unit: 'KILLS', online: true },
  surv: { name: 'SURVIVAL', short: 'SURV', icon: 'WAVE', desc: 'Hold out alone against endless waves. How far can you get?', teams: false, respawn: 0, score: 0, time: 0, unit: 'WAVES' },
};
const MODE_ORDER = ['otdm', 'offa', 'tdm', 'ffa', 'gun', 'hp', 'ctf', 'snd', 'surv'];
const GUN_LADDER = ['sidearm', 'magnum', 'stinger', 'hornet', 'viper', 'bulwark', 'kestrel', 'wasp', 'breacher', 'rampart', 'marc', 'kv47', 'talon', 'vanguard', 'anvil', 'hailstorm', 'arbiter', 'hawkeye', 'warden', 'deadeye'];
const BOT_NAMES = ['Ghost', 'Reaper', 'Havoc', 'Nomad', 'Kilo', 'Raven', 'Brick', 'Saint', 'Atlas', 'Rook', 'Ash', 'Hex', 'Wolf', 'Juno', 'Sparrow', 'Bishop', 'Tank', 'Echo', 'Mako', 'Vex', 'Flint', 'Onyx'];
const SKILL = {
  recruit: { name: 'RECRUIT', acc: 0.3, dmg: 7, aim: 3.5 }, regular: { name: 'REGULAR', acc: 0.4, dmg: 9, aim: 5 },
  veteran: { name: 'VETERAN', acc: 0.5, dmg: 11, aim: 7 }, hardened: { name: 'HARDENED', acc: 0.58, dmg: 13, aim: 9 },
};
const TEAM_COL = ['#5aaeff', '#ff5a4a'], TEAM_NAME = ['BLUE', 'RED'];
let M = { mode: 'surv', def: MODES.surv, entries: [] };
const inMatch = () => M && M.mode !== 'surv' && !G.bench;
const isFriend = e => M.def.teams && e.team === M.myTeam;

/* ---------- flow fields to any goal (cached), so bots can path anywhere on the map */
const FLOW = new Map(), flowQ = new Int32Array(NN * NN);
function goalCell(x, z) {
  let cx = cellOf(x), cz = cellOf(z);
  if (!navBlocked[cz * NN + cx]) return cz * NN + cx;
  for (let r = 1; r < 6; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const x2 = cx + dx, z2 = cz + dz; if (x2 >= 0 && z2 >= 0 && x2 < NN && z2 < NN && !navBlocked[z2 * NN + x2]) return z2 * NN + x2; }
  return cz * NN + cx;
}
function flowField(x, z) {
  const cell = goalCell(x, z);
  let f = FLOW.get(cell); if (f) { f.used = NOW; return f.d; }
  const d = new Int32Array(NN * NN).fill(-1), q = flowQ;
  let head = 0, tail = 0; q[tail++] = cell; d[cell] = 0;
  while (head < tail) {
    const c = q[head++], cx = c % NN, cz = (c / NN) | 0, nd = d[c] + 1;
    for (let k = 0; k < 8; k++) {
      const nx = cx + NX[k], nz = cz + NZ[k]; if (nx < 0 || nz < 0 || nx >= NN || nz >= NN) continue;
      const n = nz * NN + nx; if (d[n] >= 0 || navBlocked[n]) continue;
      if (k >= 4 && (navBlocked[cz * NN + nx] || navBlocked[nz * NN + cx])) continue;
      d[n] = nd; q[tail++] = n;
    }
  }
  if (FLOW.size > 48) { let ok = null, ou = 1e9; FLOW.forEach((v, k) => { if (v.used < ou) { ou = v.used; ok = k; } }); FLOW.delete(ok); }
  FLOW.set(cell, { d, used: NOW });
  return d;
}
function flowDir(d, x, z) {
  const cx = cellOf(x), cz = cellOf(z), c = cz * NN + cx;
  let best = d[c] >= 0 && !navBlocked[c] ? d[c] : 1e9, bk = -1;
  for (let k = 0; k < 8; k++) {
    const nx = cx + NX[k], nz = cz + NZ[k]; if (nx < 0 || nz < 0 || nx >= NN || nz >= NN) continue;
    const n = nz * NN + nx; if (d[n] < 0 || d[n] >= best) continue;
    if (k >= 4 && (navBlocked[cz * NN + nx] || navBlocked[nz * NN + cx])) continue;
    best = d[n]; bk = k;
  }
  if (bk < 0) return null;
  const tx = -ARENA + (cx + NX[bk] + 0.5) - x, tz = -ARENA + (cz + NZ[bk] + 0.5) - z, l = Math.hypot(tx, tz) || 1;
  return [tx / l, tz / l];
}
function openNear(x, z) { const c = goalCell(x, z); return { x: -ARENA + (c % NN) + 0.5, z: -ARENA + ((c / NN) | 0) + 0.5 }; }

/* ---------- map layout for the modes */
const LAYOUT = {
  spawn: [{ x: 0, z: 37 }, { x: 0, z: -37 }],   // team 0 south, team 1 north
  hp: [{ x: 0, z: 2 }, { x: -24, z: -14 }, { x: 25, z: 20 }, { x: 26, z: -8 }, { x: -20, z: 22 }],
  flags: [{ x: 0, z: 36 }, { x: 0, z: -36 }],
  sites: [{ x: -22, z: -24, n: 'A' }, { x: 24, z: -30, n: 'B' }],
};
let SPAWNS = null;
function buildSpawns() {
  if (SPAWNS) return SPAWNS;
  SPAWNS = [];
  for (let z = -38; z <= 38; z += 6) for (let x = -38; x <= 38; x += 6) { const p = openNear(x + rnd(-1, 1), z + rnd(-1, 1)); if (!navBlocked[cellOf(p.z) * NN + cellOf(p.x)]) SPAWNS.push(p); }
  for (const k of ['spawn', 'hp', 'flags', 'sites']) LAYOUT[k] = LAYOUT[k].map(p => Object.assign({}, p, openNear(p.x, p.z)));
  return SPAWNS;
}
// the alive positions of everyone hostile to `team`
function hostilesOf(team) {
  const out = [];
  if (playerAlive() && team !== M.myTeam) out.push({ x: P.x, z: P.z });
  for (const e of enemies) if (e.team !== team) out.push({ x: e.group.position.x, z: e.group.position.z });
  return out;
}
function pickSpawnFor(team, side) {
  const pts = buildSpawns(), hs = hostilesOf(team);
  let best = null, bs = -1e9;
  for (let i = 0; i < 26; i++) {
    const p = pts[(Math.random() * pts.length) | 0];
    let near = 1e9; for (const h of hs) near = Math.min(near, Math.hypot(h.x - p.x, h.z - p.z));
    let s = Math.min(near, 40) * 1.4 + rnd(0, 6);
    if (side !== undefined && side >= 0) s -= Math.hypot(p.x - LAYOUT.spawn[side].x, p.z - LAYOUT.spawn[side].z) * 0.9;
    if (near < 9) s -= 60;
    if (s > bs) { bs = s; best = p; }
  }
  return { x: best.x + rnd(-0.6, 0.6), z: best.z + rnd(-0.6, 0.6) };
}
const sideOf = team => !M.def.teams ? -1 : M.mode === 'snd' ? (team === M.snd.att ? 0 : 1) : team;

/* ---------- match setup */
const MATCH_CFG_KEY = 'ashfall.match.v1';
let LOBBY = { mode: 'tdm' };
try { const o = JSON.parse(localStorage.getItem(MATCH_CFG_KEY) || 'null'); if (o && MODES[o.mode]) LOBBY.mode = o.mode; } catch (e) {}
function saveLobby() { try { localStorage.setItem(MATCH_CFG_KEY, JSON.stringify(LOBBY)); } catch (e) {} }
// cfg: { mode, score, time (min), perTeam, players, skill, hardcore }
function matchCfg(mode, custom) {
  const d = MODES[mode], c = Object.assign({ mode, score: d.score, time: d.time, perTeam: d.perTeam || 0, players: d.players || 0, skill: S.difficulty === 'recruit' ? 'recruit' : S.difficulty === 'veteran' ? 'veteran' : 'regular', hardcore: false, custom: false }, custom || {});
  if (mode === 'gun') c.score = GUN_LADDER.length;
  return c;
}
function friendlyMarker() {
  if (!friendlyMarker.tex) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.fillStyle = TEAM_COL[0]; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 4; g.beginPath(); g.moveTo(32, 54); g.lineTo(12, 20); g.lineTo(52, 20); g.closePath(); g.stroke(); g.fill();
    friendlyMarker.tex = new THREE.CanvasTexture(c);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: friendlyMarker.tex, depthTest: false, transparent: true })); s.scale.set(0.32, 0.32, 1); s.position.y = 2.25; s.renderOrder = 5; s.name = 'mark';
  return s;
}
function spawnBot(en, pos) {
  const pvp = M.def.teams, type = !pvp ? ['rifleman', 'scout', 'heavy'][(Math.random() * 3) | 0] : en.team === M.myTeam ? 'scout' : Math.random() < 0.25 ? 'heavy' : 'rifleman';
  const e = makeEnemy(type, pos.x, pos.z), sk = SKILL[M.cfg.skill] || SKILL.regular;
  Object.assign(e, { team: en.team, entry: en, name: en.name, pvp: true, hp: M.maxHp, maxHp: M.maxHp, speed: 3.6 + rnd(-0.2, 0.4) + (type === 'scout' ? 0.25 : 0), dmg: sk.dmg * (M.cfg.hardcore ? 1.4 : 1), acc: sk.acc, aimRate: sk.aim,
    hold: rnd(9, 20), think: rnd(0, 0.3), tgt: null, goal: null, goalT: 0, role: en.role || 'hunt', act: 0, seenT: -9, lastShotT: -9 });
  e.group.rotation.y = Math.atan2(-pos.x, -pos.z);
  if (pvp && en.team === M.myTeam) e.group.add(friendlyMarker());
  en.bot = e; en.alive = true; enemies.push(e);
  return e;
}
function startMatch(mode, custom) {
  const cfg = matchCfg(mode, custom), def = MODES[mode];
  initAudio(); clearMenuSoldiers();
  M = { mode, def, cfg, entries: [], teamScore: [0, 0], t: 0, over: false, myTeam: 0, respawnQ: [], maxHp: cfg.hardcore ? 30 : 100, hpT: 0, events: [] };
  resetGame();
  if (mode === 'surv') { G.state = 'playing'; showScreen(null); lockPointer(); startMatchStats(); updateModeHud(true); return; }
  buildSpawns();
  G.breakT = 1e9; G.waveActive = false; G.maxHp = M.maxHp; G.health = M.maxHp;
  if (def.online) {   // real players over the room: no bots; you drop in once the room has answered
    M.online = true; const me = { name: 'YOU', team: 0, isPlayer: true, kills: 0, deaths: 0, score: 0, obj: 0, level: 0, alive: false };
    M.entries.push(me); M.me = me; G.state = 'respawning'; G.respT = 2.2; showScreen(null); lockPointer(); startMatchStats(); updateModeHud(true);
    netStart(mode); showBanner(def.name, NET.app ? (NET.kind === 'code' ? 'private match: ' + NET.code.toUpperCase() : NET.kind === 'slot' ? 'joining a game on your Wi-Fi' : 'quick play') : NET.ns ? 'room: ' + NET.code.toUpperCase() : 'offline'); return;
  }
  const names = BOT_NAMES.slice().sort(() => Math.random() - 0.5); let ni = 0;
  const me = { name: 'YOU', team: 0, isPlayer: true, kills: 0, deaths: 0, score: 0, obj: 0, level: 0, alive: true };
  M.entries.push(me); M.me = me;
  if (def.teams) {
    const n = clamp(cfg.perTeam, 1, 8);
    for (let t = 0; t < 2; t++) for (let i = 0; i < (t === 0 ? n - 1 : n); i++) M.entries.push({ name: names[ni++ % names.length], team: t, kills: 0, deaths: 0, score: 0, obj: 0, level: 0, role: i % 2 ? 'obj' : 'hunt' });
  } else {
    const n = clamp(cfg.players, 2, 12);
    for (let i = 1; i < n; i++) M.entries.push({ name: names[ni++ % names.length], team: i, kills: 0, deaths: 0, score: 0, obj: 0, level: 0, role: 'hunt' });
  }
  if (mode === 'hp') M.hp = { idx: 0, t: 60, owner: -1, status: 'neutral', mesh: null, wait: 5 };
  if (mode === 'ctf') M.ctf = { flags: LAYOUT.flags.map((h, t) => ({ team: t, home: h, x: h.x, z: h.z, state: 'home', carrier: null, dropT: 0, mesh: null })) };
  if (mode === 'snd') M.snd = { round: 0, wins: [0, 0], att: 0, state: 'freeze', t: 0, bomb: null, site: 0 };
  buildObjectiveMeshes();
  if (mode === 'snd') startRound(); else { placeEveryone(); }
  if (mode === 'gun') { M.me.level = 0; equipGunGame(0); }
  G.state = 'playing'; showScreen(null); lockPointer(); startMatchStats(); updateModeHud(true);
  showBanner(def.name, def.teams ? `${cfg.perTeam} v ${cfg.perTeam}  ·  ${modeGoalText()}` : modeGoalText());
}
function modeGoalText() {
  const c = M.cfg;
  if (M.mode === 'snd') return `first to ${c.score} rounds`;
  if (M.mode === 'gun') return `${GUN_LADDER.length} guns to finish`;
  return `first to ${c.score} ${M.def.unit.toLowerCase()}${c.time ? ` · ${c.time} min` : ''}`;
}
function placeEveryone() {
  for (const en of M.entries) {
    if (en.isPlayer) { const p = pickSpawnFor(en.team, sideOf(en.team)); placePlayer(p); continue; }
    spawnBot(en, pickSpawnFor(en.team, sideOf(en.team)));
  }
}
function placePlayer(p) {
  Object.assign(P, { x: p.x, z: p.z, y: 0, vx: 0, vz: 0, vy: 0, eye: 1.7, onGround: true, recoilAcc: 0, pitch: 0 });
  // face the middle of the map
  P.yaw = Math.atan2(p.x, p.z) + rnd(-0.2, 0.2);
  G.health = G.maxHp = M.maxHp || 100; G.lastHit = -99; G.spawnProt = 1.5; M.me.alive = true;
}
function equipGunGame(level) {
  const id = GUN_LADDER[Math.min(level, GUN_LADDER.length - 1)], d = ARM[id];
  equipClass({ p: CATS[d.cat].slot === 'primary' ? id : null, s: CATS[d.cat].slot === 'secondary' ? id : null, e: 'frag', k: 'none', only: id, factory: true });
  G.grenades = 0;
}
const playerAlive = () => G.state === 'playing' && M.me && M.me.alive;

/* ---------- respawning */
function respawnPlayer() {
  const p = pickSpawnFor(M.myTeam, sideOf(M.myTeam)); placePlayer(p);
  if (M.mode === 'gun') equipGunGame(M.me.level); else { equipClass(activeClass()); G.grenades = EQUIP[G.equip].count; }
  G.state = 'playing'; G.dc = null; G.dcHold = false; $('killcam').classList.add('hide'); vig.style.opacity = 0;
  camera.fov = baseFov; camera.updateProjectionMatrix(); lockPointer(); hideCenter();
}
function queueRespawn(en) { if (M.def.respawn) M.respawnQ.push({ en, t: M.def.respawn }); }

/* ---------- kills, scoring */
function weaponLabel(by) { if (by === 'player') return WEAPONS[G.cur] ? WEAPONS[G.cur].name : ''; if (by && by.entry) return 'RIFLE'; return '✹'; }
function nameHtml(en) {
  if (!en) return '';
  if (en.isPlayer) return '<b>YOU</b>';
  const col = !M.def.teams ? TEAM_COL[1] : TEAM_COL[en.team === M.myTeam ? 0 : 1];
  return `<span style="color:${col}">${en.name}</span>`;
}
// called for every bot death (killer: 'player', a bot, or a string for barrels/explosions)
function matchBotKilled(e, by, head, boom) {
  if (!inMatch() || !e.entry) return;
  const en = e.entry; en.deaths++; en.alive = false; en.bot = null;
  const ke = by === 'player' ? M.me : by && by.entry ? by.entry : null;
  if (ke && ke !== en) creditKill(ke, en);
  if (by !== 'player') feedLine(`${ke ? nameHtml(ke) : ''} <span class="fw">${boom ? '✹' : weaponLabel(by)}</span> ${nameHtml(en)}${head ? ' <span class="ft">HEADSHOT</span>' : ''}`);
  dropCtfFlag(e);
  if (M.mode !== 'snd') queueRespawn(en);
}
function creditKill(ke, victim) {
  ke.kills++; ke.score += 100;
  if (M.def.teams && M.mode === 'tdm') M.teamScore[ke.team]++;
  if (M.mode === 'gun') {
    ke.level++;
    if (ke.isPlayer) { if (ke.level < GUN_LADDER.length) { equipGunGame(ke.level); popScore(`LEVEL ${ke.level + 1}`, 'big', ARM[GUN_LADDER[ke.level]].name); sfx.streak(); } }
    if (ke.level >= GUN_LADDER.length) endMatch(ke);
  }
  checkScoreLimit();
}
function matchPlayerKilled(killer) {
  if (!inMatch()) return;
  M.me.deaths++; M.me.alive = false;
  const ke = killer && killer.entry ? killer.entry : null;
  if (ke) { creditKill(ke, M.me); feedLine(`${nameHtml(ke)} <span class="fw">RIFLE</span> <b>YOU</b>`); }
  dropCtfFlag('player');
  if (M.mode === 'snd') checkRoundEnd();
}
function checkScoreLimit() {
  if (M.over || M.online) return;
  const lim = M.cfg.score;
  if (M.mode === 'gun' || M.mode === 'snd' || !lim) return;
  if (M.def.teams) { for (let t = 0; t < 2; t++) if (M.teamScore[t] >= lim) return endMatch(t); }
  else for (const en of M.entries) if (en.kills >= lim) return endMatch(en);
}

/* ---------- bots */
const _bt = new THREE.Vector3(), _bd = new THREE.Vector3();
function botEye(e, out) { const s = e.group.userData.scale || e.rig.root.userData.scale || 1; return out.set(e.group.position.x, (1.45 - 0.4 * (e.crouchK || 0)) * s, e.group.position.z); }
function targetPoint(t, out) { if (t === 'P') return out.set(P.x, P.y + P.eye * 0.8, P.z); return botEye(t, out).setY(out.y - 0.25); }
function losTo(e, t) {
  botEye(e, _bt); targetPoint(t, _bd); _bd.sub(_bt); const d = _bd.length(); _bd.normalize();
  raycaster.set(_bt, _bd); raycaster.far = d - 0.3; return raycaster.intersectObjects(wallMeshes, false).length === 0;
}
function tpos(t) { return t === 'P' ? { x: P.x, z: P.z } : t.group.position; }
function botValidTarget(e, t) { if (t === 'P') return playerAlive() && e.team !== M.myTeam && !(G.spawnProt > 0); return enemies.includes(t) && t.team !== e.team; }
function botThink(e) {
  // target: nearest hostile in sight (checks the closest few)
  const ex = e.group.position.x, ez = e.group.position.z, cands = [];
  if (botValidTarget(e, 'P')) cands.push(['P', Math.hypot(P.x - ex, P.z - ez)]);
  for (const o of enemies) if (o !== e && o.team !== e.team) cands.push([o, Math.hypot(o.group.position.x - ex, o.group.position.z - ez)]);
  cands.sort((a, b) => a[1] - b[1]);
  let tgt = null;
  for (let i = 0; i < Math.min(4, cands.length); i++) { if (cands[i][1] > 60) break; if (losTo(e, cands[i][0])) { tgt = cands[i][0]; break; } }
  if (tgt !== e.tgt) { e.tgt = tgt; if (tgt) e.aim = Math.min(e.aim, 0.2); }
  if (tgt) e.seenT = M.t;
  e.goal = botGoal(e, cands);
}
function botGoal(e, cands) {
  const ex = e.group.position.x, ez = e.group.position.z;
  const keep = e.goal && M.t < e.goalT && Math.hypot(e.goal.x - ex, e.goal.z - ez) > 2;
  const near = (p, r) => ({ x: p.x + rnd(-r, r), z: p.z + rnd(-r, r) });
  const set = (p, hold) => { e.goalT = M.t + (hold || rnd(3, 6)); return p; };
  if (M.mode === 'hp' && M.hp && !M.hp.wait) {
    const z = LAYOUT.hp[M.hp.idx];
    if (e.role === 'obj' || Math.hypot(z.x - ex, z.z - ez) < 22 || Math.random() < 0.5) return keep && Math.hypot(e.goal.x - z.x, e.goal.z - z.z) < 6 ? e.goal : set(near(z, 3.5), 2.5);
  }
  if (M.mode === 'ctf' && M.ctf) {
    const mine = M.ctf.flags[e.team], theirs = M.ctf.flags[1 - e.team];
    if (theirs.carrier === e) return set(mine.home, 1);
    if (mine.state === 'dropped') return set(mine, 1);
    if (mine.state === 'carried' && mine.carrier) return set(tpos(mine.carrier), 1);
    if (e.role === 'obj') return set(theirs.state === 'carried' ? near(tpos(theirs.carrier), 3) : theirs, 2);
    return keep ? e.goal : set(near(mine.home, 8), rnd(4, 8));
  }
  if (M.mode === 'snd' && M.snd) {
    const sn = M.snd, site = LAYOUT.sites[sn.site], att = e.team === sn.att;
    if (sn.bomb) return att ? (keep ? e.goal : set(near(sn.bomb, 6), 4)) : set(sn.bomb, 1);
    if (att) return set(e.role === 'obj' || sn.t > 25 ? site : near(site, 10), 2);
    const s2 = LAYOUT.sites[e.entry.kills % 2 === 0 ? 0 : 1];
    return keep ? e.goal : set(near(s2, 7), rnd(4, 8));
  }
  // hunt: head for the nearest hostile (with some noise), sometimes patrol
  if (keep) return e.goal;
  if (cands.length && Math.random() < 0.8) { const c = cands[0][0], p = tpos(c); return set(near(p, 5)); }
  const sp = buildSpawns(); return set(sp[(Math.random() * sp.length) | 0], rnd(5, 9));
}
function botShoot(e, t, dist) {
  const from = enemyMuzzle(e, new THREE.Vector3());
  e.lastShotT = M.t; if (e.entry) e.entry.sh = (e.entry.sh || 0) + 1;
  if (t === 'P') { G.killer = e; if (!(G.spawnProt > 0)) enemyShoot(e, dist); return; }
  const chance = clamp(e.acc - dist * 0.008 - (t.crouchK || 0) * 0.06, 0.06, 0.65), hit = Math.random() < chance;
  targetPoint(t, _bd); const to = _bd.clone(); if (!hit) to.add(new THREE.Vector3(rnd(-1.4, 1.4), rnd(-0.6, 0.9), rnd(-1.4, 1.4)));
  addTracer(from, to, 0.05, 0.02);
  e.rig.flash.visible = true; e.flashT = 0.06; e.rig.flash.material.rotation = rnd(0, 6.28);
  const o = at(e.group.position.x, e.group.position.z, 20); sfx.enemy(o);
  if (hit) { const dir = new THREE.Vector3(to.x - from.x, 0, to.z - from.z).normalize(); damageEnemy(t, e.dmg * (Math.random() < 0.12 ? 2 : 1), false, dir, false, e); }
}
function updateBots(dt) {
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i], g = e.group;
    if (!e.entry || e.net) continue;
    if ((e.think -= dt) <= 0) { e.think = 0.28 + Math.random() * 0.12; botThink(e); }
    if (e.tgt && !botValidTarget(e, e.tgt)) e.tgt = null;
    const ex = g.position.x, ez = g.position.z;
    let face = null, holding = false, mx = 0, mz = 0;
    const tp = e.tgt ? tpos(e.tgt) : null, dist = tp ? Math.hypot(tp.x - ex, tp.z - ez) : 1e9;
    // objective work (plant / defuse) keeps them still
    const busy = sndBotAct(e, dt);
    if (tp) face = Math.atan2(tp.x - ex, tp.z - ez);
    const goal = e.goal;
    const goalD = goal ? Math.hypot(goal.x - ex, goal.z - ez) : 0;
    const objUrgent = goal && goalD > 3 && (M.mode === 'hp' || M.mode === 'ctf' || M.mode === 'snd') && (e.role === 'obj' || (M.ctf && M.ctf.flags[1 - e.team].carrier === e));
    if (busy) holding = true;
    else if (tp && dist <= e.hold && !objUrgent) {
      holding = true; e.strafeT -= dt; if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = rnd(0.8, 2.4); }
      const nx = (tp.x - ex) / dist, nz = (tp.z - ez) / dist;
      mx = -nz * e.strafe + (dist < e.hold * 0.45 ? -nx : 0); mz = nx * e.strafe + (dist < e.hold * 0.45 ? -nz : 0);
    } else if (goal && goalD > 0.7) {
      if (e.avoidT > 0) { e.avoidT -= dt; const nx = (goal.x - ex) / goalD, nz = (goal.z - ez) / goalD; mx = -nz * e.avoidDir; mz = nx * e.avoidDir; }
      else if (gridClear(ex, ez, goal.x, goal.z)) { mx = goal.x - ex; mz = goal.z - ez; }
      else { const d = flowDir(flowField(goal.x, goal.z), ex, ez); if (d) { mx = d[0]; mz = d[1]; } else { mx = goal.x - ex; mz = goal.z - ez; } }
    } else { holding = true; e.strafeT -= dt; if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = rnd(1, 3); } mx = Math.cos(e.phase0 + M.t * 0.3) * 0.4 * e.strafe; mz = Math.sin(e.phase0 + M.t * 0.3) * 0.4; }
    const ml = Math.hypot(mx, mz), stun = e.stunT > 0 ? 0.25 : 1;
    let sp = ml > 0.01 ? e.speed * (holding ? 0.5 : 1) * stun * ((e.slowT = Math.max(0, (e.slowT || 0) - dt)) > 0 ? 0.4 : 1) : 0;
    if (ml > 0.01) { g.position.x += mx / ml * sp * dt; g.position.z += mz / ml * sp * dt; if (!face) face = Math.atan2(mx, mz); }
    if (e.stunT > 0) { e.stunT -= dt; e.aim = 0; }
    resolve(g.position, 0.45, 0);
    for (let j = 0; j < enemies.length; j++) { if (j === i) continue; const o = enemies[j].group.position, sx = g.position.x - o.x, sz = g.position.z - o.z, sd = Math.hypot(sx, sz); if (sd < 0.85 && sd > 0.001) { const pu = (0.85 - sd) * 0.5; g.position.x += sx / sd * pu; g.position.z += sz / sd * pu; } }
    const pd = Math.hypot(P.x - g.position.x, P.z - g.position.z); if (pd < 0.9 && pd > 0.001 && G.state === 'playing') { g.position.x -= (P.x - g.position.x) / pd * (0.9 - pd); g.position.z -= (P.z - g.position.z) / pd * (0.9 - pd); }
    g.position.x = clamp(g.position.x, -ARENA + 0.6, ARENA - 0.6); g.position.z = clamp(g.position.z, -ARENA + 0.6, ARENA - 0.6);
    if (face !== null) { let dy = face - g.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; g.rotation.y += dy * Math.min(1, dt * 8); }
    e.chk -= dt;
    if (e.chk <= 0) { e.chk = 0.8; if (Math.hypot(g.position.x - e.lastX, g.position.z - e.lastZ) < 0.5 && !holding && goal) { e.avoidT = 1.0; e.avoidDir = Math.random() < 0.5 ? 1 : -1; } e.lastX = g.position.x; e.lastZ = g.position.z; }
    e.aim += ((e.tgt && dist < 60 ? 1 : 0) - e.aim) * Math.min(1, dt * e.aimRate * 0.6 * (e.tgt === 'P' ? (WEAPONS[G.cur] ? WEAPONS[G.cur].spot || 1 : 1) : 1));
    e.holding = holding && !!tp;
    animEnemy(e, dt, sp);
    if (e.tgt && e.aim > 0.6 && !(e.reloadT > 0) && !busy && !(e.stunT > 0)) {
      e.cd -= dt;
      if (e.cd <= 0) { botShoot(e, e.tgt, dist); if (--e.mag <= 0) { e.mag = e.magSize; e.reloadDur = e.reloadT = rnd(1.9, 2.5); e.reloadSnd = false; } e.shots--; if (e.shots <= 0) { e.shots = Math.floor(rnd(3, 7)); e.cd = rnd(0.35, 0.9); } else e.cd = 0.11; }
    }
  }
}

/* ---------- objectives: meshes */
const OBJ = { group: null };
function objMat(col, op) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }); }
function makeRing(r, col) { const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.25, r, 48), objMat(col, 0.55)); m.rotation.x = -Math.PI / 2; m.position.y = 0.04; return m; }
function makeFlag(team) {
  const g = new THREE.Group(), col = TEAM_COL[team === M.myTeam ? 0 : 1];
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.4, 8), new THREE.MeshStandardMaterial({ color: C(0x9a9a9a), metalness: 0.8, roughness: 0.3 })); pole.position.y = 1.2; g.add(pole);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55, 6, 3), new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.8, side: THREE.DoubleSide, emissive: new THREE.Color(col), emissiveIntensity: 0.25 }));
  cloth.position.set(0.47, 2.05, 0); g.add(cloth); g.userData.cloth = cloth;
  return g;
}
function buildObjectiveMeshes() {
  if (OBJ.group) scene.remove(OBJ.group);
  OBJ.group = new THREE.Group(); scene.add(OBJ.group);
  if (M.mode === 'hp') { OBJ.ring = makeRing(5, '#ffffff'); OBJ.group.add(OBJ.ring); }
  if (M.mode === 'ctf') for (const f of M.ctf.flags) { const col = TEAM_COL[f.team === M.myTeam ? 0 : 1]; const base = makeRing(1.6, col); base.position.set(f.home.x, 0.04, f.home.z); OBJ.group.add(base); f.mesh = makeFlag(f.team); OBJ.group.add(f.mesh); }
  if (M.mode === 'snd') { for (const s of LAYOUT.sites) { const r = makeRing(3, '#ffd24a'); r.position.set(s.x, 0.04, s.z); OBJ.group.add(r); }
    const b = new THREE.Group(); b.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.3), new THREE.MeshStandardMaterial({ color: C(0x2b2e22), roughness: 0.7 })));
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2020 })); led.position.set(0.12, 0.1, 0); b.add(led); b.userData.led = led; b.visible = false; OBJ.bomb = b; OBJ.group.add(b); }
}

/* ---------- hardpoint */
function updateHardpoint(dt) {
  const h = M.hp;
  if (h.wait) { h.wait -= dt; if (h.wait <= 0) { h.wait = 0; h.t = 60; showMsg('HARDPOINT ONLINE'); } else return; }
  h.t -= dt;
  if (h.t <= 0) { h.idx = (h.idx + 1) % LAYOUT.hp.length; h.t = 60; showBanner('HARDPOINT MOVED', 'find the new zone'); sfx.ui(); for (const e of enemies) e.goalT = 0; }
  const z = LAYOUT.hp[h.idx], cnt = [0, 0];
  if (playerAlive() && Math.hypot(P.x - z.x, P.z - z.z) < 5) cnt[M.myTeam]++;
  for (const e of enemies) if (Math.hypot(e.group.position.x - z.x, e.group.position.z - z.z) < 5) cnt[e.team]++;
  h.status = cnt[0] && cnt[1] ? 'contested' : cnt[0] ? 'team0' : cnt[1] ? 'team1' : 'neutral';
  h.acc = (h.acc || 0) + dt;
  if (h.acc >= 1) { h.acc -= 1; const t = cnt[0] && !cnt[1] ? 0 : cnt[1] && !cnt[0] ? 1 : -1; if (t >= 0) { M.teamScore[t]++; if (t === M.myTeam && playerAlive() && Math.hypot(P.x - z.x, P.z - z.z) < 5) { M.me.score += 5; M.me.obj++; MS.hpTime++; } for (const e of enemies) if (e.team === t && Math.hypot(e.group.position.x - z.x, e.group.position.z - z.z) < 5) { e.entry.score += 5; e.entry.obj++; } checkScoreLimit(); } }
  OBJ.ring.position.set(z.x, 0.04, z.z);
  OBJ.ring.material.color.set(h.status === 'contested' ? '#ffd24a' : h.status === 'neutral' ? '#ffffff' : TEAM_COL[h.status === 'team' + M.myTeam ? 0 : 1]);
  OBJ.ring.material.opacity = 0.4 + Math.sin(NOW * 4) * 0.15;
}

/* ---------- capture the flag */
function dropCtfFlag(who) {
  if (!M.ctf) return;
  for (const f of M.ctf.flags) if (f.carrier === who) { const p = who === 'player' ? { x: P.x, z: P.z } : who.group.position; f.state = 'dropped'; f.x = p.x; f.z = p.z; f.carrier = null; f.dropT = 20; showMsg(`${f.team === M.myTeam ? 'YOUR' : 'ENEMY'} FLAG DROPPED`); }
}
function updateCtf(dt) {
  const fl = M.ctf.flags;
  const actors = []; if (playerAlive()) actors.push({ who: 'player', team: M.myTeam, x: P.x, z: P.z, en: M.me }); for (const e of enemies) actors.push({ who: e, team: e.team, x: e.group.position.x, z: e.group.position.z, en: e.entry });
  for (const f of fl) {
    if (f.state === 'carried') { const p = f.carrier === 'player' ? { x: P.x, z: P.z } : f.carrier.group.position; f.x = p.x; f.z = p.z; }
    if (f.state === 'dropped') { f.dropT -= dt; if (f.dropT <= 0) { resetFlag(f); showMsg(`${f.team === M.myTeam ? 'YOUR' : 'ENEMY'} FLAG RETURNED`); continue; } }
    for (const a of actors) {
      const d = Math.hypot(a.x - f.x, a.z - f.z); if (d > 2.2) continue;
      if (a.team !== f.team && f.state !== 'carried') { f.state = 'carried'; f.carrier = a.who; showBanner(a.team === M.myTeam ? 'ENEMY FLAG TAKEN' : 'YOUR FLAG IS TAKEN', a.en.isPlayer ? 'get it home' : a.en.name); sfx.streak(); break; }
      if (a.team === f.team && f.state === 'dropped') { resetFlag(f); a.en.score += 50; if (a.en.isPlayer) { MS.returns++; popScore('+50', '', 'FLAG RETURN'); } showMsg(`${f.team === M.myTeam ? 'YOUR' : 'ENEMY'} FLAG RETURNED`); break; }
    }
  }
  // capture: carrying the enemy flag to your own base while your flag is home
  for (const f of fl) {
    if (f.state !== 'carried') continue;
    const t = 1 - f.team, home = fl[t];
    if (home.state === 'home' && Math.hypot(f.x - home.home.x, f.z - home.home.z) < 2.6) {
      const en = f.carrier === 'player' ? M.me : f.carrier.entry; M.teamScore[t]++; en.score += 300; en.obj++;
      if (en.isPlayer) { MS.caps++; popScore('+300', 'big', 'FLAG CAPTURE'); }
      showBanner(t === M.myTeam ? 'FLAG CAPTURED' : 'ENEMY CAPTURED YOUR FLAG', `${TEAM_NAME[0]} ${M.teamScore[M.myTeam]} · ${M.teamScore[1 - M.myTeam]} ${TEAM_NAME[1]}`); sfx.streak();
      resetFlag(f); checkScoreLimit();
    }
  }
  for (const f of fl) { f.mesh.position.set(f.x, f.state === 'carried' ? 0.3 : 0, f.z); f.mesh.visible = !(f.carrier === 'player'); const c = f.mesh.userData.cloth; c.rotation.y = Math.sin(NOW * 3 + f.team) * 0.3; }
}
function resetFlag(f) { f.state = 'home'; f.carrier = null; f.x = f.home.x; f.z = f.home.z; }

/* ---------- search and destroy */
function startRound() {
  const sn = M.snd; sn.round++;
  if (sn.round === Math.ceil(M.cfg.score) && sn.round > 1) { sn.att = 1 - sn.att; showMsg('SIDES SWITCHED'); }
  sn.state = 'freeze'; sn.t = 100; sn.freeze = 4; sn.bomb = null; sn.site = Math.random() < 0.5 ? 0 : 1; sn.plant = 0; sn.defuse = 0;
  for (const e of enemies.slice()) scene.remove(e.group); enemies.length = 0;
  for (const d of dying) { scene.remove(d.e.group); if (d.rd && d.rd.gun) scene.remove(d.rd.gun.o); } dying.length = 0;
  for (const g of grenadesInFlight) scene.remove(g.m); grenadesInFlight.length = 0;
  for (const en of M.entries) en.alive = true;
  placeEveryone();
  equipClass(activeClass()); G.grenades = EQUIP[G.equip].count;
  if (OBJ.bomb) OBJ.bomb.visible = false;
  G.state = 'playing'; G.dc = null; G.dcHold = false; $('killcam').classList.add('hide'); hideCenter(); camera.fov = baseFov; camera.updateProjectionMatrix();
  const myAtt = sn.att === M.myTeam;
  showBanner(`ROUND ${sn.round}`, myAtt ? 'ATTACK · plant the bomb at A or B' : 'DEFEND · protect A and B');
}
function aliveCount(team) { let n = team === M.myTeam && M.me.alive ? 1 : 0; for (const e of enemies) if (e.team === team) n++; return n; }
function sndBotAct(e, dt) {
  if (M.mode !== 'snd' || !M.snd || M.snd.state !== 'live' && M.snd.state !== 'planted') return false;
  const sn = M.snd, ex = e.group.position.x, ez = e.group.position.z;
  if (e.team === sn.att && !sn.bomb) {
    const s = LAYOUT.sites[sn.site];
    if (Math.hypot(s.x - ex, s.z - ez) < 2.6 && !e.tgt) { e.act += dt; if (e.act >= 4) plantBomb(s, e.entry); return true; }
  } else if (e.team !== sn.att && sn.bomb) {
    if (Math.hypot(sn.bomb.x - ex, sn.bomb.z - ez) < 1.8 && !e.tgt) { e.act += dt; if (e.act >= 6) defuseBomb(e.entry); return true; }
  }
  e.act = Math.max(0, e.act - dt * 2); return false;
}
function plantBomb(site, en) {
  const sn = M.snd; sn.bomb = { x: site.x + rnd(-0.8, 0.8), z: site.z + rnd(-0.8, 0.8), t: 35, n: site.n }; sn.state = 'planted';
  en.score += 200; en.obj++; if (en.isPlayer) { MS.plants++; popScore('+200', 'big', 'BOMB PLANTED'); }
  OBJ.bomb.position.set(sn.bomb.x, 0.09, sn.bomb.z); OBJ.bomb.visible = true;
  showBanner('BOMB PLANTED', `site ${site.n} · 35 seconds`); sfx.pin(); for (const e of enemies) { e.goalT = 0; e.act = 0; }
}
function defuseBomb(en) {
  const sn = M.snd; en.score += 200; en.obj++; if (en.isPlayer) { MS.defuses++; popScore('+200', 'big', 'BOMB DEFUSED'); }
  showBanner('BOMB DEFUSED', ''); sn.bomb = null; OBJ.bomb.visible = false; endRound(1 - sn.att, 'defused');
}
function updateSnd(dt) {
  const sn = M.snd;
  if (sn.state === 'freeze') { sn.freeze -= dt; if (sn.freeze <= 0) { sn.state = 'live'; showMsg('GO GO GO'); } else { for (const e of enemies) { e.cd = Math.max(e.cd, 0.5); } } }
  if (sn.state === 'live') { sn.t -= dt; if (sn.t <= 0) return endRound(1 - sn.att, 'time'); }
  if (sn.state === 'planted') {
    sn.bomb.t -= dt; const led = OBJ.bomb.userData.led; led.visible = Math.sin(NOW * (6 + (35 - sn.bomb.t) * 0.6)) > 0;
    if ((sn.beep = (sn.beep || 0) - dt) <= 0) { sn.beep = Math.max(0.15, sn.bomb.t / 35); tone(1900, 0.05, 0.08, 'square', null, at(sn.bomb.x, sn.bomb.z, 12)); }
    if (sn.bomb.t <= 0) { explode({ x: sn.bomb.x, y: 0.5, z: sn.bomb.z }, 'grenade', 14, 4); OBJ.bomb.visible = false; sn.bomb = null; return endRound(sn.att, 'detonated'); }
  }
  if (sn.state === 'post') { sn.post -= dt; if (sn.post <= 0) { if (sn.wins[0] >= M.cfg.score || sn.wins[1] >= M.cfg.score) endMatch(sn.wins[0] >= M.cfg.score ? 0 : 1); else startRound(); } }
  if (sn.state === 'live' || sn.state === 'planted') checkRoundEnd();
}
function checkRoundEnd() {
  const sn = M.snd; if (!sn || (sn.state !== 'live' && sn.state !== 'planted')) return;
  const a = aliveCount(sn.att), d = aliveCount(1 - sn.att);
  if (d === 0) endRound(sn.att, 'elim');
  else if (a === 0 && !sn.bomb) endRound(1 - sn.att, 'elim');
}
function endRound(winner, why) {
  const sn = M.snd; if (sn.state === 'post') return;
  sn.state = 'post'; sn.post = 4.5; sn.wins[winner]++; M.teamScore = sn.wins.slice();
  const txt = { elim: 'ENEMY ELIMINATED', time: 'TIME EXPIRED', defused: 'BOMB DEFUSED', detonated: 'TARGET DESTROYED' }[why];
  showBanner(winner === M.myTeam ? 'ROUND WON' : 'ROUND LOST', `${txt} · ${sn.wins[M.myTeam]} – ${sn.wins[1 - M.myTeam]}`);
  if (winner === M.myTeam) sfx.streak();
}
// the player's hold-to-interact (E / hold X): plant or defuse
function playerInteract(dt, held) {
  const bar = $('ihold'); let txt = '', prog = -1;
  if (M.mode === 'snd' && M.snd && playerAlive()) {
    const sn = M.snd, att = sn.att === M.myTeam;
    if (att && !sn.bomb && sn.state === 'live') { const s = LAYOUT.sites.find(s => Math.hypot(s.x - P.x, s.z - P.z) < 3); if (s) { txt = `HOLD ${pad.on ? '(X)' : '[E]'} TO PLANT AT ${s.n}`; if (held) { sn.plant += dt; prog = sn.plant / 4; if (sn.plant >= 4) { plantBomb(s, M.me); sn.plant = 0; } } else sn.plant = 0; } }
    if (!att && sn.bomb && sn.state === 'planted' && Math.hypot(sn.bomb.x - P.x, sn.bomb.z - P.z) < 2) { txt = `HOLD ${pad.on ? '(X)' : '[E]'} TO DEFUSE`; if (held) { sn.defuse += dt; prog = sn.defuse / 6; if (sn.defuse >= 6) { sn.defuse = 0; defuseBomb(M.me); } } else sn.defuse = 0; }
  }
  G.interactTxt = txt;
  if (bar) { const on = !!txt; if (bar._on !== on) { bar._on = on; bar.classList.toggle('hide', !on); } if (on) { bar.firstChild.textContent = txt; bar.lastChild.firstChild.style.width = Math.max(0, prog) * 100 + '%'; } }
  return !!txt;
}

/* ---------- per-frame match update */
function updateMatch(dt) {
  if (!inMatch() || M.over) return;
  M.t += dt;
  if (G.spawnProt > 0) G.spawnProt -= dt;
  for (let i = M.respawnQ.length - 1; i >= 0; i--) { const r = M.respawnQ[i]; r.t -= dt; if (r.t <= 0) { M.respawnQ.splice(i, 1); if (!r.en.isPlayer) spawnBot(r.en, pickSpawnFor(r.en.team, sideOf(r.en.team))); } }
  if (M.mode === 'hp') updateHardpoint(dt);
  if (M.mode === 'ctf') updateCtf(dt);
  if (M.mode === 'snd') updateSnd(dt);
  if (M.cfg.time && M.mode !== 'snd' && M.t >= M.cfg.time * 60) { timeUp(); return; }
  if (G.state === 'respawning') { G.respT -= dt; showCenter(M.online && !NET.teamSet ? (NET.app ? 'FINDING A MATCH' : 'JOINING ROOM') : 'RESPAWNING', Math.max(0, G.respT).toFixed(1)); if (G.respT <= 0 && !(M.online && !NET.teamSet)) respawnPlayer(); }
  if (G.state === 'spectate') updateSpectate(dt);
  updateModeHud(false); updateMarkers();
}
function timeUp() {
  if (M.def.teams) endMatch(M.teamScore[0] === M.teamScore[1] ? -1 : M.teamScore[0] > M.teamScore[1] ? 0 : 1);
  else { const best = M.entries.slice().sort((a, b) => (M.mode === 'gun' ? b.level - a.level : b.kills - a.kills))[0]; endMatch(best); }
}
// after the death cam in a match: respawn, or spectate a team-mate in S&D
function afterDeathInMatch() {
  $('killcam').classList.add('hide');
  if (M.mode === 'snd') { G.state = 'spectate'; G.specIdx = 0; G.dc = null; return; }
  G.state = 'respawning'; G.respT = 1.2; G.dcHold = !!G.dc;
}
function updateSpectate(dt) {
  const mates = enemies.filter(e => e.team === M.myTeam), sn = M.snd;
  if (G.specNext) { G.specIdx++; G.specNext = false; }
  const m = mates.length ? mates[G.specIdx % mates.length] : null;
  if (m) {
    const g = m.group, fx = Math.sin(g.rotation.y), fz = Math.cos(g.rotation.y);
    _bt.set(g.position.x - fx * 2.8, 2.3, g.position.z - fz * 2.8); camera.position.lerp(_bt, Math.min(1, dt * 6));
    camera.lookAt(g.position.x + fx * 4, 1.3, g.position.z + fz * 4);
    showCenter('SPECTATING ' + m.name, 'you are out until the next round');
  } else { const p = sn && sn.bomb ? sn.bomb : { x: 0, z: 0 }; camera.position.lerp(_bt.set(p.x + 10, 14, p.z + 10), Math.min(1, dt * 2)); camera.lookAt(p.x, 0, p.z); showCenter('ROUND IN PROGRESS', ''); }
  if (camera.fov !== baseFov) { camera.fov = baseFov; camera.updateProjectionMatrix(); }
}

/* ---------- match end */
function endMatch(winner) {
  if (M.over) return; M.over = true;
  const won = M.def.teams ? (winner === -1 ? 0 : winner === M.myTeam ? 1 : -1) : (winner === M.me ? 1 : -1);
  M.result = won; G.state = 'over'; mouseDown = false; mouseAds = false;
  hadLock = false; try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  hideCenter(); $('ihold').classList.add('hide');
  finishMatchStats(won);
  showResults(winner, won);
}
function showResults(winner, won) {
  const title = won > 0 ? 'VICTORY' : won < 0 ? 'DEFEAT' : 'DRAW';
  $('resTitle').textContent = title; $('resTitle').className = 'res-title ' + (won > 0 ? 'win' : won < 0 ? 'lose' : '');
  let sub = M.def.name;
  if (M.def.teams) sub += `  ·  ${M.teamScore[M.myTeam]} – ${M.teamScore[1 - M.myTeam]}`;
  else if (winner && winner.name) sub += `  ·  ${winner.isPlayer ? 'YOU WIN' : winner.name.toUpperCase() + ' WINS'}`;
  if (M.mode === 'surv') sub += `  ·  WAVE ${G.wave}`;
  $('resSub').textContent = sub;
  $('resBoard').innerHTML = scoreboardHtml();
  const kd = MS.deaths ? (MS.kills / MS.deaths).toFixed(2) : MS.kills.toFixed(2), acc = MS.shots ? Math.round(MS.hits / MS.shots * 100) : 0;
  $('resMine').innerHTML = [['KILLS', MS.kills], ['DEATHS', MS.deaths], ['K/D', kd], ['ACCURACY', acc + '%'], ['HEADSHOTS', MS.heads], ['BEST STREAK', MS.bestStreak], ['LONGEST KILL', Math.round(MS.longest) + ' M'], ['SCORE', M.me ? M.me.score : G.score]].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  showScreen('results');
}
function scoreboardHtml() {
  if (!M.entries || !M.entries.length) return '';
  const sortK = M.mode === 'gun' ? (a, b) => b.level - a.level || b.kills - a.kills : (a, b) => b.score - a.score || b.kills - a.kills;
  const row = (en, i) => `<tr class="${en.isPlayer ? 'me' : ''}"><td>${i + 1}</td><td>${nameHtml(en)}${en.alive === false && M.mode === 'snd' ? ' <i>✝</i>' : ''}</td><td>${M.mode === 'gun' ? en.level + 1 : en.score}</td><td>${en.kills}</td><td>${en.deaths}</td><td>${(en.kills / Math.max(1, en.deaths)).toFixed(2)}</td>${M.mode === 'hp' || M.mode === 'ctf' || M.mode === 'snd' ? `<td>${en.obj}</td>` : ''}</tr>`;
  const head = `<tr><th>#</th><th>PLAYER</th><th>${M.mode === 'gun' ? 'LEVEL' : 'SCORE'}</th><th>K</th><th>D</th><th>K/D</th>${M.mode === 'hp' || M.mode === 'ctf' || M.mode === 'snd' ? `<th>${M.mode === 'hp' ? 'TIME' : M.mode === 'ctf' ? 'CAPS' : 'OBJ'}</th>` : ''}</tr>`;
  if (!M.def.teams) return `<table class="sb">${head}${M.entries.slice().sort(sortK).map(row).join('')}</table>`;
  return [M.myTeam, 1 - M.myTeam].map((t, k) => `<div class="sb-team" style="--tc:${TEAM_COL[k]}"><div class="sb-h"><b>${k === 0 ? 'YOUR TEAM' : 'ENEMY TEAM'}</b><span>${M.teamScore[t]}</span></div><table class="sb">${head}${M.entries.filter(e => e.team === t).sort(sortK).map(row).join('')}</table></div>`).join('');
}

/* ---------- HUD: score bar, centre message, objective markers */
const fmtT = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;
function updateModeHud(force) {
  const el = $('mhud'), surv = M.mode === 'surv' || !!G.bench;
  const sv = $('stats'); if (sv && sv._surv !== surv) { sv._surv = surv; sv.style.display = surv ? '' : 'none'; }
  if (surv) { if (el._on !== false) { el._on = false; el.classList.add('hide'); } return; }
  if (el._on !== true) { el._on = true; el.classList.remove('hide'); }
  if (!force && (M.hudT = (M.hudT || 0) - 1 / 60) > 0) return; M.hudT = 0.1;
  const left = M.cfg.time && M.mode !== 'snd' ? fmtT(M.cfg.time * 60 - M.t) : M.mode === 'snd' && M.snd ? (M.snd.state === 'planted' ? fmtT(M.snd.bomb.t) : M.snd.state === 'freeze' ? fmtT(M.snd.freeze) : fmtT(M.snd.t)) : '';
  let mid = '', info = '';
  if (M.def.teams) {
    const a = M.teamScore[M.myTeam], b = M.teamScore[1 - M.myTeam], lim = M.cfg.score;
    mid = `<span class="ts a">${a}</span><span class="tm"><b>${left}</b><small>${M.def.short}${lim ? ' · ' + lim : ''}</small></span><span class="ts b">${b}</span>`;
    if (M.mode === 'hp' && M.hp) { const h = M.hp; info = h.wait ? `HARDPOINT IN ${Math.ceil(h.wait)}` : `${h.status === 'contested' ? 'CONTESTED' : h.status === 'neutral' ? 'ZONE EMPTY' : h.status === 'team' + M.myTeam ? 'HOLDING' : 'ENEMY HOLDING'} · MOVES IN ${Math.ceil(h.t)}`; }
    if (M.mode === 'ctf' && M.ctf) { const st = f => f.state === 'home' ? 'HOME' : f.state === 'dropped' ? 'DROPPED' : f.carrier === 'player' ? 'YOU HAVE IT' : 'TAKEN'; info = `YOUR FLAG ${st(M.ctf.flags[M.myTeam])} · ENEMY FLAG ${st(M.ctf.flags[1 - M.myTeam])}`; }
    if (M.mode === 'snd' && M.snd) { const sn = M.snd; info = `ROUND ${sn.round} · ${sn.att === M.myTeam ? 'ATTACK' : 'DEFEND'} · ALIVE ${aliveCount(M.myTeam)} v ${aliveCount(1 - M.myTeam)}${sn.bomb ? ' · BOMB AT ' + sn.bomb.n : ''}`; }
  } else {
    const key = M.mode === 'gun' ? e => e.level : e => e.kills;
    const lead = M.entries.slice().sort((a, b) => key(b) - key(a))[0], me = M.me;
    mid = `<span class="ts a">${M.mode === 'gun' ? me.level + 1 : me.kills}</span><span class="tm"><b>${left}</b><small>${M.def.short} · ${M.cfg.score}</small></span><span class="ts b">${M.mode === 'gun' ? lead.level + 1 : lead.kills}</span>`;
    info = lead === me ? 'YOU ARE IN THE LEAD' : `LEADER: ${lead.name.toUpperCase()}`;
    if (M.mode === 'gun') info = `GUN ${me.level + 1}/${GUN_LADDER.length}${me.level + 1 < GUN_LADDER.length ? ' · NEXT ' + ARM[GUN_LADDER[me.level + 1]].name : ' · FINAL GUN'} · ${info}`;
  }
  hudSet(el, 't', `<div class="mrow">${mid}</div><div class="minfo">${info}</div>`, true);
}
function showCenter(a, b) { const c = $('center'); const h = `<b>${a}</b>${b ? `<small>${b}</small>` : ''}`; if (c._h !== h) { c._h = h; c.innerHTML = h; } c.classList.remove('hide'); }
function hideCenter() { const c = $('center'); if (c) { c.classList.add('hide'); c._h = ''; } }
const _mk = new THREE.Vector3();
function markerList() {
  const out = [];
  if (M.mode === 'hp' && M.hp && !M.hp.wait) { const z = LAYOUT.hp[M.hp.idx], s = M.hp.status; out.push({ x: z.x, y: 1.5, z: z.z, t: 'P', c: s === 'contested' ? '#ffd24a' : s === 'neutral' ? '#ffffff' : TEAM_COL[s === 'team' + M.myTeam ? 0 : 1] }); }
  if (M.mode === 'ctf' && M.ctf) for (const f of M.ctf.flags) if (f.carrier !== 'player') out.push({ x: f.x, y: 2.8, z: f.z, t: f.team === M.myTeam ? (f.state === 'home' ? 'DEFEND' : 'RETURN') : (f.state === 'carried' ? 'ESCORT' : 'TAKE'), c: TEAM_COL[f.team === M.myTeam ? 0 : 1] });
  if (M.mode === 'ctf' && M.ctf && M.ctf.flags[1 - M.myTeam].carrier === 'player') { const h = M.ctf.flags[M.myTeam].home; out.push({ x: h.x, y: 2, z: h.z, t: 'CAPTURE', c: TEAM_COL[0] }); }
  if (M.mode === 'snd' && M.snd) { const sn = M.snd; if (sn.bomb) out.push({ x: sn.bomb.x, y: 0.8, z: sn.bomb.z, t: sn.att === M.myTeam ? 'DEFEND' : 'DEFUSE', c: '#ff5a4a' }); else for (const s of LAYOUT.sites) out.push({ x: s.x, y: 1.5, z: s.z, t: s.n, c: '#ffd24a' }); }
  return out;
}
function updateMarkers() {
  const box = $('marks'); if (!box) return;
  const list = G.state === 'playing' || G.state === 'respawning' || G.state === 'spectate' ? markerList() : [];
  while (box.children.length < list.length) { const d = document.createElement('div'); d.className = 'mk'; d.innerHTML = '<b></b><small></small>'; box.appendChild(d); }
  for (let i = 0; i < box.children.length; i++) {
    const d = box.children[i], m = list[i];
    if (!m) { if (d.style.display !== 'none') d.style.display = 'none'; continue; }
    _mk.set(m.x, m.y, m.z).project(camera);
    let x = _mk.x, y = _mk.y; const behind = _mk.z > 1;
    if (behind) { x = -x; y = -y; }
    const edge = behind || Math.abs(x) > 0.92 || Math.abs(y) > 0.86;
    if (edge) { const k = Math.max(Math.abs(x) / 0.92, Math.abs(y) / 0.86); x /= k; y /= k; }
    d.style.display = ''; d.style.transform = `translate(${((x + 1) / 2 * innerWidth).toFixed(0)}px,${((1 - y) / 2 * innerHeight).toFixed(0)}px)`;
    d.style.color = m.c; d.firstChild.textContent = m.t; d.lastChild.textContent = Math.round(Math.hypot(m.x - camera.position.x, m.z - camera.position.z)) + ' M';
  }
}
// hold Tab / View to see the scoreboard
function setScoreboard(on) {
  const sb = $('board'); if (!sb) return;
  on = !!on && inMatch() && (G.state !== 'over');
  if (sb._on !== on) { sb._on = on; sb.classList.toggle('hide', !on); }
  if (on && (sb._t = (sb._t || 0) - 1 / 60) <= 0) { sb._t = 0.25; sb.innerHTML = `<div class="sb-title">${M.def.name}${M.cfg.time && M.mode !== 'snd' ? ' · ' + fmtT(M.cfg.time * 60 - M.t) : ''}</div>` + scoreboardHtml(); }
}
