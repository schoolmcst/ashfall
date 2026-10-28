/* ================================================================== CAMPAIGN: FIRST HARVEST (engine)
   Twelve story missions against VANTAGE (Lazarus Pharma's private army), three weeks before the night Blackwell fell.
   A mission is data (camp_story.js): a map, where you start, the crew that comes with you, squads of enemies, three
   hidden stash tins and a list of STEPS. Each step is one task with its own rules:
     go       reach a place                      clear    take out the squads
     hold     stay in a zone while waves come     use      hold USE at something (hack, plant, burn, open...)
     multi    several USE spots in any order      pick     take something
     carry    take it somewhere (you are slowed)  escort   keep a crew member alive while they walk
     defend   keep a thing in one piece           chase    catch a runner before they get away
     snipe    take out marked targets from a spot photo    aim at things and hold ADS to photograph them
     search   find the real one among many        boss     a big one with a health bar
     talk     a scene (lines, then go on)
   Any step can have a time limit (t), be stealthy (stealth: being seen fails it; quiet: being seen calls help),
   spawn squads, move the crew, say lines before and after, and be a CHECKPOINT (cp): die and you start again there.
   Enemies stand at their post or walk a patrol until they see, hear or get shot at; then the squad hunts you. */
const CCHARS = [
  { id: 'june', name: 'JUNE', col: '#ff9ad0', voice: { want: ['jenny', 'aria', 'samantha', 'ava', 'female'], female: true, pitch: 1.02, rate: 1.0 } },
  { id: 'mara', name: 'MARA', col: '#9adf6a', voice: { want: ['susan', 'karen', 'moira', 'female'], female: true, pitch: 0.9, rate: 0.96 } },
  { id: 'harold', name: 'HAROLD VOSS', col: '#c8a0ff', voice: { want: ['george', 'daniel', 'arthur', 'male'], female: false, pitch: 0.76, rate: 0.9 } },
  { id: 'radio', name: 'VANTAGE RADIO', col: '#ff5a4a', voice: { want: ['guy', 'eric', 'male'], female: false, pitch: 0.7, rate: 1.12 } },
  { id: 'grower', name: 'THE GROWER', col: '#e8b04a', voice: { want: ['fred', 'ralph', 'male'], female: false, pitch: 0.6, rate: 0.82 } },
];
const campChar = id => CCHARS.find(c => c.id === id) || (typeof ZCHARS !== 'undefined' && ZCHARS.find(c => c.id === id)) || CCHARS[0];
function campVoice(c) {
  if (typeof ZV === 'undefined') return null;
  if (ZV.vmap && ZV.vmap[c.id]) return ZV.vmap[c.id];
  CAMP.vmap = CAMP.vmap || {}; if (CAMP.vmap[c.id] !== undefined) return CAMP.vmap[c.id];
  const all = (ZV.voices || []).filter(v => /^en/i.test(v.lang || '') && zvScore(v) > -100), g = c.voice.female ? ZV_FEM : ZV_MAL, o = c.voice.female ? ZV_MAL : ZV_FEM;
  const used = new Set(Object.values(ZV.vmap || {}).filter(Boolean).map(v => v.name).concat(Object.values(CAMP.vmap).filter(Boolean).map(v => v.name)));
  const rank = v => zvScore(v) + (g.test(v.name) ? 40 : o.test(v.name) ? -60 : 0) + (c.voice.want.some(w => v.name.toLowerCase().includes(w)) ? 12 : 0) - (used.has(v.name) ? 30 : 0);
  return (CAMP.vmap[c.id] = all.slice().sort((a, b) => rank(b) - rank(a))[0] || null);
}
const CAMP_DIFF = {
  recruit: { name: 'RECRUIT', skill: 'recruit', hp: 0.75, xp: 0.8, d: 'enemies miss more and go down faster' },
  regular: { name: 'REGULAR', skill: 'regular', hp: 1, xp: 1, d: 'the way it is meant to be played' },
  veteran: { name: 'VETERAN', skill: 'veteran', hp: 1.25, xp: 1.4, d: 'sharp, smart and tough · for the brave' },
};
const CAMP_GUN = { rifleman: 'marc', scout: 'viper', heavy: 'hailstorm', sniper: 'hawkeye', shotgun: 'breacher', smg: 'kestrel', officer: 'deadeye' };
const CAMP_MISSIONS = [];   // filled by camp_story.js
// all twelve, so the list shows what is still to come
const CAMP_PLAN = ['LAST DELIVERY', 'THE PLUG', 'PAPER TRAIL', 'HIGH RISE', 'PURPLE DUST', 'COLD STORAGE', 'THE PASS', 'WHEELS UP', 'THE WORKS', 'SOURCE', 'LAST STAND', 'LIGHTS OUT'];
const CAMP = { m: null, i: -1, st: null, cp: null, t0: 0, said: new Set(), sq: new Map(), allies: [], tins: [], tinObjs: [], props: [], q: [], talking: false, dead: false, restartT: 0, failT: 0, failWhy: '', done: false, carry: null, kills: 0, deaths: 0, diff: 'regular', vmap: null };
const campOn = () => typeof M !== 'undefined' && M && M.mode === 'camp' && !!CAMP.m;
const campMission = id => CAMP_MISSIONS.find(m => m.id === id);
const campProg = () => PROG.camp || (PROG.camp = { done: {}, tins: {}, last: '' });
function campUnlocked(i) { if (i === 0) return true; const prev = CAMP_MISSIONS[i - 1]; return !!(prev && campProg().done[prev.id]); }

/* ---------- talking: lines play one after another, in the crew's voices, with subtitles */
function campSay(lines, done) {
  if (!lines || !lines.length) { if (done) done(); return; }
  CAMP.q.push({ lines: lines.slice(), done }); if (!CAMP.talking) campSayNext();
}
function campSayNext() {
  const job = CAMP.q[0]; if (!job) { CAMP.talking = false; return; }
  CAMP.talking = true;
  if (!job.lines.length) { CAMP.q.shift(); try { if (job.done) job.done(); } catch (e) { reportError(e); } campSayNext(); return; }
  const [ch, text] = job.lines.shift(), c = campChar(ch), gen = CAMP.gen;
  try { zvSubtitle(c, text); } catch (e) {}
  let fired = false; const go = () => { if (fired || gen !== CAMP.gen) return; fired = true; setTimeout(campSayNext, 280); };
  const ms = 1500 + text.length * 60;
  try {
    if (typeof ZV !== 'undefined' && ZV.enabled && window.speechSynthesis) {
      const u = zvUtter(c, text, 1), v = campVoice(c); if (v) try { u.voice = v; } catch (e) {}
      u.onend = go; speechSynthesis.speak(u); setTimeout(go, ms * 1.6);
    } else setTimeout(go, ms);
  } catch (e) { setTimeout(go, ms); }
}
function campHush() { CAMP.q.length = 0; CAMP.talking = false; CAMP.gen = (CAMP.gen || 0) + 1; try { speechSynthesis.cancel(); } catch (e) {} }

/* ---------- starting a mission */
function campPlay(id, diff) {
  const m = campMission(id); if (!m) return;
  CAMP.diff = CAMP_DIFF[diff] ? diff : 'regular';
  startMatch('camp', { map: m.map, camp: id, skill: CAMP_DIFF[CAMP.diff].skill });
}
function campStart(cfg) {
  const m = campMission(cfg.camp); if (!m) { toMenu(); return; }
  campClear();
  CAMP.m = m; CAMP.t0 = M.t; CAMP.kills = 0; CAMP.deaths = 0; CAMP.done = false; CAMP.said.clear(); CAMP.tins = []; CAMP.carry = null; CAMP.dead = false; CAMP.stealthFails = 0;
  M.cfg.skill = CAMP_DIFF[CAMP.diff].skill; M.cfg.score = 0;
  buildSpawns(); G.breakT = 1e9; G.waveActive = false; G.maxHp = G.health = 100; M.maxHp = 100;
  try { if (m.env) applyEnv(Object.assign({}, MAPS[curMap].env, m.env)); } catch (e) {}
  const me = { name: 'YOU', team: 0, isPlayer: true, kills: 0, deaths: 0, score: 0, obj: 0, level: 0, alive: true }; M.entries.push(me); M.me = me;
  placePlayer(m.start); P.yaw = m.start.yaw || 0; P.pitch = 0;
  campLoadout(m.loadout);
  for (const id of m.allies || []) campAlly(id);
  campBuildTins();
  CAMP.mprops = []; for (const x of m.props || []) { const before = CAMP.props.length; campPropsFor({ props: [x] }); CAMP.mprops.push(...CAMP.props.splice(before)); }
  campHud(true);
  G.state = 'playing'; showScreen(null); lockPointer(); startMatchStats(); updateModeHud(true);
  campCard(m);
  CAMP.cp = { i: 0, x: P.x, z: P.z, y: P.y, yaw: P.yaw };
  campBegin(0);
}
function campLoadout(lo) {
  const L = Object.assign({ p: 'marc', s: 'sidearm', e: 'frag', k: 'none' }, lo || {});
  try { equipClass({ p: L.p, s: L.s, e: L.e, k: L.k, factory: true }); G.grenades = L.n !== undefined ? L.n : 2; } catch (e) { reportError(e); }
}
function campRefill() { for (const w of WEAPONS) if (w) { w.ammo = w.magSize; w.reserve = w.reserveMax; } G.grenades = Math.max(G.grenades, 2); }
// the intro card at the start of a mission
function campCard(m) {
  let c = $('campCardEl'); if (c) c.remove();
  c = document.createElement('div'); c.id = 'campCardEl';
  c.innerHTML = `<small>FIRST HARVEST · MISSION ${CAMP_MISSIONS.indexOf(m) + 1} OF ${CAMP_MISSIONS.length}</small><b>${m.title}</b><span>${m.place}</span><em>${m.when || ''}</em>`;
  document.body.appendChild(c); setTimeout(() => c.classList.add('out'), 4200); setTimeout(() => c.remove(), 5400);
}

/* ---------- the crew: they follow you, fight, and can't be killed (they go down and get back up) */
function campAlly(id) {
  const c = campChar(id), en = { name: c.name, team: 0, kills: 0, deaths: 0, score: 0, obj: 0, level: 0, role: 'hunt', ally: id };
  M.entries.push(en);
  const a = Math.random() * TAU, p = { x: P.x + Math.cos(a) * 2, z: P.z + Math.sin(a) * 2, y: P.y };
  const e = spawnBot(en, p); campAllyPrep(e, id); return e;
}
function campAllyPrep(e, id) {
  e.camp = { ally: id, alert: true }; e.job = null; e.hp = e.maxHp = 900; e.dmg *= 0.55; e.speed = 4.4; e.ally = id;
  const gun = { tank: 'anvil', doc: 'sentinel', smokes: 'kv47', sparks: 'kestrel', mara: 'marc' }[id]; if (gun) try { botGunProfile(e, gun); } catch (err) {}
  CAMP.allies.push(e);
}
const campAllyOf = id => CAMP.allies.find(e => e.ally === id && enemies.includes(e));

/* ---------- squads */
function campSpawnSquad(name, opt = {}) {
  const def = CAMP.m.squads[name]; if (!def) { reportError(new Error('camp: no squad ' + name)); return []; }
  const D = CAMP_DIFF[CAMP.diff], list = [];
  for (const pt of def.pts || def) {
    const kind = pt.kind || def.kind || 'rifleman', type = kind === 'heavy' ? 'heavy' : kind === 'scout' || kind === 'smg' ? 'scout' : 'rifleman';
    const en = { name: pt.name || def.name || 'VANTAGE', team: 1, kills: 0, deaths: 0, score: 0, obj: 0, level: 0, role: 'hunt' };
    M.entries.push(en);
    const y = pt.y !== undefined ? pt.y : groundAt(pt.x, pt.z, 30);
    const e = spawnBot(en, { x: pt.x, z: pt.z, y });
    e.job = null; e.spawnProt = 0;
    const hp = (pt.hp || (kind === 'heavy' ? 160 : 100)) * D.hp * (pt.boss ? 1 : 1);
    e.hp = e.maxHp = hp;
    try { botGunProfile(e, pt.gun || CAMP_GUN[kind] || 'marc'); } catch (err) {}
    if (kind === 'sniper') { e.hold = 60; e.rangeK = 0.4; }
    e.camp = { sq: name, post: { x: pt.x, z: pt.z, y }, path: pt.path || null, pi: 0, look: pt.look, mode: pt.mode || def.mode || 'post', alert: !!(opt.alert || def.alert || pt.alert), r: pt.r || def.r || 7, runner: pt.runner, boss: pt.boss, tag: pt.tag };
    if (pt.look !== undefined) { e.group.rotation.y = pt.look; e.lookYaw = pt.look; }
    if (pt.boss) { e.boss = true; e.name = pt.name || 'BOSS'; e.group.scale.setScalar(pt.scale || 1.15); e.group.userData.scale = pt.scale || 1.15; }
    if (pt.runner) { e.camp.mode = 'run'; e.speed = pt.speed || 5; e.dmg = 0; e.hold = 0; }
    if (pt.target) e.camp.target = true;
    if (e.camp.target) campTag(e, pt.mark || 'TARGET');
    list.push(e);
  }
  let s = CAMP.sq.get(name); if (!s) { s = { name, list: [] }; CAMP.sq.set(name, s); }
  s.list.push(...list);
  return list;
}
const campAlive = name => { const s = CAMP.sq.get(name); return s ? s.list.filter(e => enemies.includes(e)) : []; };
function campTag(e, txt) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d'); g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText('▼ ' + txt, 128, 40); g.fillStyle = '#ff4a3a'; g.fillText('▼ ' + txt, 128, 40);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false })); s.scale.set(1.6, 0.4, 1); s.position.y = 2.6; s.renderOrder = 6; s.name = 'campTag'; e.group.add(s);
}
// a bot noticed someone: unaware guards only see what is in front of them, not far, and not in the dark corners
function campNotice(e, t) {
  if (e.camp && e.camp.ally) return !(CAMP.st && (CAMP.st.stealth || CAMP.st.quiet) && !CAMP.alarmed);   // the crew holds fire while you sneak
  if (!e.camp || e.camp.alert) return true;
  const p = tpos(t), g = e.group.position, dx = p.x - g.x, dz = p.z - g.z, d = Math.hypot(dx, dz);
  if (d < 3.2) return true;
  const range = (CAMP.st && CAMP.st.see) || 26, crouch = t === 'P' && G.crouchK > 0.5 ? 0.65 : 1;
  if (d > range * crouch) return false;
  const fx = Math.sin(e.group.rotation.y), fz = Math.cos(e.group.rotation.y);
  if ((fx * dx + fz * dz) / (d || 1) < 0.42) return false;   // about 130 degrees in front
  e.camp.sus = (e.camp.sus || 0) + 0.35 * (1 + (range - d) / range); if (e.camp.sus < 1) { e.camp.lookAt = { x: p.x, z: p.z }; return false; }   // a moment to be sure
  return true;
}
function campAlert(e, why) {
  if (!e || !e.camp || e.camp.ally || e.camp.alert || e.camp.mode === 'run') return;
  e.camp.alert = true;
  const s = CAMP.sq.get(e.camp.sq);
  if (s) for (const o of s.list) if (o.camp && !o.camp.alert && enemies.includes(o)) { o.camp.alert = true; o.lkp = e.lkp ? Object.assign({}, e.lkp) : { x: P.x, z: P.z, y: P.y }; o.lkpT = M.t; }
  campSpotted(e);
}
function campSpotted(e) {
  const st = CAMP.st; if (!st || CAMP.alarmed) return;
  if (st.stealth) { CAMP.alarmed = true; showBanner('YOU WERE SPOTTED', 'stay out of sight'); setTimeout(() => { if (campOn() && CAMP.st === st && !CAMP.dead) campFail(st.failSpot || 'you were spotted'); }, 1800); return; }
  if (st.quiet) {
    CAMP.alarmed = true; showBanner('ALARM', st.alarmTxt || 'they know you are here · more are coming');
    try { tone(880, 0.25, 0.12, 'square'); tone(660, 0.25, 0.12, 'square', undefined, { delay: 0.3 }); } catch (err) {}
    for (const n of st.onAlarm || []) setTimeout(() => { if (campOn() && CAMP.st === st) campSpawnSquad(n, { alert: true }); }, 4000);
    if (st.sayAlarm) campSay(st.sayAlarm);
  }
}
// where a campaign bot wants to be
function campGoal(e, keep, near, set) {
  const c = e.camp; if (!c) return null;
  if (c.ally) {
    const st = CAMP.st, esc = st && st.type === 'escort' && st.who === c.ally;
    if (esc) return set(CAMP.escPt || { x: P.x, z: P.z, y: P.y }, 0.6);
    const hold = st && st.allyAt && st.allyAt[c.ally]; if (hold) return set(hold, 1);
    const d = Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z);
    if (d > 6 || !keep) { const a = TAU * (CAMP.allies.indexOf(e) / Math.max(1, CAMP.allies.length)) + P.yaw + Math.PI; return set({ x: P.x + Math.sin(a) * 2.6, z: P.z + Math.cos(a) * 2.6, y: P.y }, 1.2); }
    return e.goal;
  }
  if (c.mode === 'run') { const p = c.path && c.path[c.pi]; if (p) { if (Math.hypot(p[0] - e.group.position.x, p[1] - e.group.position.z) < 1.5) c.pi++; const q = c.path[Math.min(c.pi, c.path.length - 1)]; e.tgt = null; return set({ x: q[0], z: q[1], y: q[2] || 0 }, 0.3); } return null; }
  if (!c.alert) {
    if (c.path) { const p = c.path[c.pi % c.path.length]; if (Math.hypot(p[0] - e.group.position.x, p[1] - e.group.position.z) < 1.2) c.pi++; const q = c.path[c.pi % c.path.length]; return set({ x: q[0], z: q[1], y: q[2] !== undefined ? q[2] : c.post.y }, 1.5); }
    if (c.lookAt) { e.lookYaw = Math.atan2(c.lookAt.x - e.group.position.x, c.lookAt.z - e.group.position.z); }
    return set(c.post, 3);
  }
  if (c.mode === 'hold') { if (e.lkp && M.t - e.lkpT < 6 && Math.hypot(e.lkp.x - c.post.x, e.lkp.z - c.post.z) < c.r + 6) return set(near(e.lkp, 2), 2); return keep && Math.hypot(e.goal.x - c.post.x, e.goal.z - c.post.z) < c.r ? e.goal : set(near(c.post, c.r * 0.6), rnd(3, 6)); }
  // hunting: towards the last place they knew, else at the player
  if (e.lkp && M.t - e.lkpT < 8) return keep ? e.goal : set(near(e.lkp, 2.5), rnd(2, 4));
  const tgtP = CAMP.st && CAMP.st.type === 'defend' && CAMP.defObj && Math.random() < 0.5 ? CAMP.defObj : { x: P.x, z: P.z, y: P.y };
  return keep ? e.goal : set(near(tgtP, 6), rnd(3, 6));
}

/* ---------- steps */
function campBegin(i) {
  const m = CAMP.m, st = m.steps[i];
  if (!st) { campComplete(); return; }
  CAMP.i = i; CAMP.st = st; CAMP.stT = 0; CAMP.alarmed = false; CAMP.useP = 0; CAMP.useK = null; CAMP.phP = 0; CAMP.phK = null; CAMP.multi = new Set(); CAMP.photos = new Set(); CAMP.searched = new Set(); CAMP.escI = 0; CAMP.escPt = null; CAMP.stepDone = false; CAMP.waveI = 0; CAMP.outT = 0;
  CAMP.defObj = null; CAMP.spawned = []; campIn(); CAMP.outing = false; hideCenter();
  campPropsClear();
  for (const id of st.join || []) if (!campAllyOf(id)) campAlly(id);
  for (const id of st.leave || []) { const a = campAllyOf(id); if (a) { scene.remove(a.group); enemies.splice(enemies.indexOf(a), 1); CAMP.allies.splice(CAMP.allies.indexOf(a), 1); } }
  if (st.realSearch === undefined && st.type === 'search') st._real = (Math.random() * st.spots.length) | 0; else st._real = st.realSearch;
  for (const n of st.spawn || []) CAMP.spawned.push(...campSpawnSquad(n));
  if (st.type === 'defend') CAMP.defObj = { x: st.obj.x, z: st.obj.z, y: st.obj.y || 0, hp: st.obj.hp || 100, max: st.obj.hp || 100, name: st.obj.name };
  if (st.type === 'escort') { const a = campAllyOf(st.who) || campAlly(st.who); a.camp.esc = true; a.hp = a.maxHp = st.hp || 600; CAMP.escPt = { x: st.path[0][0], z: st.path[0][1], y: st.path[0][2] || 0 }; }
  if (st.type === 'snipe' && st.gun) { try { const w = WEAPONS.findIndex(x => x && x.def.id === st.gun); if (w < 0) campLoadout({ p: st.gun, s: (WEAPONS[1] && WEAPONS[1].def.id) || 'sidearm' }); } catch (e) {} }
  if (st.loadout) campLoadout(st.loadout);
  campPropsFor(st);
  if (st.say) campSay(st.say);
  if (st.banner) showBanner(st.banner[0], st.banner[1] || '');
  campHud(true);
}
function campStepDone() {
  if (CAMP.stepDone) return; CAMP.stepDone = true;
  const st = CAMP.st, i = CAMP.i;
  try { sfx.ui(); tone(660, 0.12, 0.06, 'triangle'); tone(990, 0.16, 0.06, 'triangle', undefined, { delay: 0.1 }); } catch (e) {}
  if (st.after) campSay(st.after);
  const next = () => {
    if (!campOn() || CAMP.i !== i) return;
    if (st.cp !== false && (st.cp || (CAMP.m.steps[i + 1] && CAMP.m.steps[i + 1].cp0))) { CAMP.cp = { i: i + 1, x: P.x, z: P.z, y: P.y, yaw: P.yaw }; campRefill(); showMsg('CHECKPOINT'); }
    campBegin(i + 1);
  };
  if (st.waitSay && st.after) campSay([], next); else setTimeout(next, (st.pause || 0.8) * 1000);
}
function campUpdate(dt) {
  if (!campOn() || CAMP.done) return;
  const st = CAMP.st; if (!st) return;
  CAMP.stT += dt;
  campTins();
  campProps(dt);
  if (CAMP.dead) { if ((CAMP.restartT -= dt) <= 0) campRestart(); return; }
  // the crew: never left behind
  for (const a of CAMP.allies) { if (!enemies.includes(a)) continue; if (a.hp < a.maxHp * 0.3 && !a.camp.esc) a.hp = a.maxHp; const d = Math.hypot(a.group.position.x - P.x, a.group.position.z - P.z); if (d > 30 && !a.camp.esc && !(st.allyAt && st.allyAt[a.ally])) { const p = campBehind(3); a.group.position.set(p.x, p.y, p.z); a.goal = null; } }
  if (st.t && CAMP.stT > st.t && !CAMP.stepDone) { campFail(st.failTime || 'out of time'); return; }
  const near = (p, r) => Math.hypot(P.x - p.x, P.z - p.z) < (r || p.r || 3) && Math.abs((P.y || 0) - (p.y || 0)) < 2.2;
  const left = names => (names || st.spawn || []).reduce((n, s) => n + campAlive(s).length, 0);
  switch (st.type) {
    case 'go': if (near(st.at)) campStepDone(); break;
    case 'talk': if (!CAMP.talking && CAMP.stT > (st.secs || 0.5)) campStepDone(); break;
    case 'clear': case 'boss': if (left(st.squads) <= (st.min || 0) && CAMP.stT > 1) campStepDone(); break;
    case 'snipe': if (left(st.squads) <= 0 && CAMP.stT > 1) campStepDone(); else if (st.at && !near(st.at, (st.at.r || 3) + 4) && CAMP.stT > 2) campOut(dt, 'GET BACK TO THE OVERWATCH SPOT'); else campIn(); break;
    case 'hold': case 'defend': {
      for (; CAMP.waveI < (st.waves || []).length && CAMP.stT >= st.waves[CAMP.waveI].t; CAMP.waveI++) campSpawnSquad(st.waves[CAMP.waveI].sq, { alert: true });
      if (st.type === 'hold' && st.at && !near(st.at, st.at.r || 8)) campOut(dt, 'GET BACK TO THE ZONE'); else campIn();
      if (st.type === 'defend') campDefendTick(dt);
      if (CAMP.stT >= st.secs && (!st.clearToo || left(st.waves.map(w => w.sq)) === 0)) campStepDone();
      break;
    }
    case 'escort': campEscortTick(dt); break;
    case 'chase': {
      const r = campAlive(st.squads[0]);
      if (!r.length && CAMP.stT > 1) { campStepDone(); break; }
      for (const e of r) { const c = e.camp, end = c.path[c.path.length - 1]; if (c.pi >= c.path.length - 1 && Math.hypot(end[0] - e.group.position.x, end[1] - e.group.position.z) < 2) { campFail(st.failRun || 'they got away'); break; } }
      break;
    }
    case 'carry': if (CAMP.carry && near(st.to, st.to.r || 3)) { CAMP.carry = null; campStepDone(); } break;
    case 'photo': campPhotoTick(dt); break;
  }
}
function campOut(dt, txt) { CAMP.outing = true; CAMP.outT += dt; showCenter(txt, Math.max(0, Math.ceil(10 - CAMP.outT)) + ' s'); if (CAMP.outT > 10) { hideCenter(); campFail('you left the area'); } else if (CAMP.outT < dt * 1.5) {} }
function campIn() { CAMP.outT = 0; if (CAMP.outing) { CAMP.outing = false; hideCenter(); } }
function campBehind(r) {
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
  for (const k of [1, 0.6, 0.3]) { const x = P.x - fx * r * k, z = P.z - fz * r * k, n = nodeOf(x, z, P.y); if (n >= 0) return { x, z, y: groundAt(x, z, P.y + 1) }; }
  return { x: P.x, z: P.z, y: P.y };
}
// escort: they walk the path while you are close; they stop and wait when you fall behind
function campEscortTick(dt) {
  const st = CAMP.st, a = campAllyOf(st.who);
  if (!a) { campFail(st.failDie || campChar(st.who).name + ' went down'); return; }
  const p = st.path[CAMP.escI], ap = a.group.position, dP = Math.hypot(ap.x - P.x, ap.z - P.z);
  if (dP > (st.lead || 14)) { CAMP.escPt = { x: ap.x, z: ap.z, y: ap.y }; if (!CAMP.escWait) { CAMP.escWait = true; showMsg(campChar(st.who).name + ' IS WAITING FOR YOU'); } return; }
  CAMP.escWait = false;
  if (Math.hypot(ap.x - p[0], ap.z - p[1]) < 1.6) { CAMP.escI++; if (CAMP.escI >= st.path.length) { a.camp.esc = false; campStepDone(); return; } }
  const q = st.path[CAMP.escI]; CAMP.escPt = { x: q[0], z: q[1], y: q[2] || 0 };
  a.goal = CAMP.escPt; a.goalT = M.t + 0.5;
}
// defend: enemies close to it wreck it, faster with more of them
function campDefendTick(dt) {
  const o = CAMP.defObj; if (!o) return;
  let n = 0; for (const e of enemies) if (e.team === 1 && Math.hypot(e.group.position.x - o.x, e.group.position.z - o.z) < (CAMP.st.obj.r || 9)) n++;
  if (n) { o.hp -= dt * n * (CAMP.st.obj.dps || 2.2) * CAMP_DIFF[CAMP.diff].hp; if ((CAMP.defWarn = (CAMP.defWarn || 0) - dt) <= 0) { CAMP.defWarn = 6; showMsg(`${o.name} IS UNDER ATTACK`); } }
  if (o.hp <= 0) campFail(CAMP.st.failObj || o.name.toLowerCase() + ' was destroyed');
}
// photo: aim down sights at it, close enough and in sight, for a second
const _cmR = new THREE.Raycaster();
function campPhotoTick(dt) {
  const st = CAMP.st; let best = -1;
  if (G.ads > 0.8) {
    const fx = -Math.sin(P.yaw) * Math.cos(P.pitch), fy = Math.sin(P.pitch), fz = -Math.cos(P.yaw) * Math.cos(P.pitch);
    st.spots.forEach((s, k) => {
      if (CAMP.photos.has(k)) return; const dx = s.x - P.x, dy = (s.y || 0) + (s.h || 1) - (P.y + P.eye), dz = s.z - P.z, d = Math.hypot(dx, dy, dz);
      if (d > (s.r || 30) || (dx * fx + dy * fy + dz * fz) / d < 0.985) return;
      _cmR.set(new THREE.Vector3(P.x, P.y + P.eye, P.z), new THREE.Vector3(dx / d, dy / d, dz / d)); _cmR.far = Math.max(0.1, d - 0.8); if (_cmR.intersectObjects(wallMeshes, false).length) return; best = k;
    });
  }
  if (best >= 0) { CAMP.phP += dt; CAMP.phK = best; showCenter('PHOTOGRAPHING · ' + st.spots[best].label, Math.round(Math.min(1, CAMP.phP / 1.1) * 100) + '%'); if (CAMP.phP >= 1.1) { CAMP.photos.add(best); CAMP.phP = 0; hideCenter(); campFlash(); showMsg(`PHOTO ${CAMP.photos.size} OF ${st.spots.length} · ${st.spots[best].label}`); if (st.spots[best].say) campSay(st.spots[best].say); if (CAMP.photos.size >= st.spots.length) campStepDone(); } }
  else if (CAMP.phK !== null) { CAMP.phP = 0; CAMP.phK = null; hideCenter(); }
}
function campFlash() { const f = document.createElement('div'); f.className = 'camp-flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 400); try { burst(0.15, 4000, 0.2, 'highpass'); tone(2400, 0.05, 0.05, 'square'); } catch (e) {} }
// USE: the interaction bar (match.js playerInteract shows it)
function campInteract(dt, held) {
  if (!campOn() || CAMP.dead || !playerAlive()) return null;
  const st = CAMP.st; if (!st) return null;
  const k = usingPad() ? '(' + actName('reload') + ')' : '[' + actName('use') + ']';
  const close = (p, r) => Math.hypot(P.x - p.x, P.z - p.z) < (r || 1.9) && Math.abs((P.y || 0) - (p.y || 0)) < 2;
  let spot = null, key = null, secs = st.secs || 2, verb = st.verb || 'USE';
  if (st.type === 'use' || st.type === 'pick') { if (!CAMP.stepDone && close(st.at, st.at.r)) { spot = st.at; key = 'u'; if (st.type === 'pick') { secs = st.secs || 0.6; verb = st.verb || 'TAKE ' + (st.item || 'IT'); } } }
  if (st.type === 'carry' && !CAMP.carry && close(st.at, st.at.r)) { spot = st.at; key = 'c'; secs = 0.8; verb = 'PICK UP ' + (st.item || 'IT'); }
  if (st.type === 'multi') st.spots.forEach((s, j) => { if (!spot && !CAMP.multi.has(j) && close(s, s.r)) { spot = s; key = 'm' + j; verb = s.verb || st.verb || 'USE'; } });
  if (st.type === 'search') st.spots.forEach((s, j) => { if (!spot && !CAMP.searched.has(j) && close(s, s.r)) { spot = s; key = 's' + j; secs = st.secs || 1.4; verb = s.verb || st.verb || 'SEARCH'; } });
  if (!spot) { if (CAMP.useK) { CAMP.useK = null; CAMP.useP = 0; } return null; }
  if (CAMP.useK !== key) { CAMP.useK = key; CAMP.useP = 0; }
  if (held) CAMP.useP += dt; else CAMP.useP = Math.max(0, CAMP.useP - dt * 2);
  if (CAMP.useP >= secs) {
    CAMP.useP = 0; CAMP.useK = null;
    if (key === 'u') { campPropUsed(st.at); if (st.type === 'pick') showMsg((st.item || 'GOT IT') + ''); campStepDone(); }
    else if (key === 'c') { CAMP.carry = { item: st.item || 'THE BAG' }; campPropUsed(st.at); showBanner('CARRYING ' + (st.item || 'THE BAG'), 'you are slower · no sprinting'); campHud(true); }
    else if (key[0] === 'm') { const j = +key.slice(1); CAMP.multi.add(j); campPropUsed(st.spots[j]); try { if (st.boom) { sfx.explode(at(spot.x, spot.z, 30, spot.y)); explosionFx(new THREE.Vector3(spot.x, (spot.y || 0) + 0.4, spot.z), 0.5); } } catch (e) {}
      if (st.spots[j].say) campSay(st.spots[j].say); showMsg(`${CAMP.multi.size} OF ${st.spots.length}`); if (CAMP.multi.size >= st.spots.length) campStepDone(); }
    else if (key[0] === 's') { const j = +key.slice(1); CAMP.searched.add(j); campPropUsed(st.spots[j]); if (j === st._real || CAMP.searched.size >= st.spots.length) { showBanner(st.found || 'FOUND IT', ''); campStepDone(); } else { showMsg(st.spots[j].nope || 'NOTHING HERE'); if (st.spawnOnSearch && CAMP.searched.size === 2) for (const n of st.spawnOnSearch) campSpawnSquad(n, { alert: true }); } }
    return null;
  }
  return [`HOLD ${k} TO ${verb}`, CAMP.useP / secs];
}
// carrying: slower, no sprint (game1 reads this)
const campCarrySlow = () => campOn() && CAMP.carry ? 0.72 : 1;

/* ---------- dying, failing and the checkpoint */
function campDied() {
  if (CAMP.dead) return; CAMP.deaths++; campFail('you were killed', true);
}
function campFail(why, died) {
  if (CAMP.dead || CAMP.done) return;
  CAMP.dead = true; CAMP.restartT = 3.2; campHush(); hideCenter();
  G.state = 'campdead';
  mouseDown = false; mouseAds = false;
  let o = $('campFailEl'); if (o) o.remove(); o = document.createElement('div'); o.id = 'campFailEl';
  o.innerHTML = `<b>MISSION FAILED</b><span>${why.toUpperCase()}</span><small>BACK TO THE LAST CHECKPOINT…</small>`; document.body.appendChild(o);
}
function campRestart() {
  const o = $('campFailEl'); if (o) o.remove();
  CAMP.dead = false; CAMP.carry = null;
  for (const e of enemies.slice()) if (e.camp && !e.camp.ally) { scene.remove(e.group); enemies.splice(enemies.indexOf(e), 1); }
  CAMP.sq.clear();
  for (const g of grenadesInFlight) scene.remove(g.m); grenadesInFlight.length = 0;
  const c = CAMP.cp; placePlayer({ x: c.x, z: c.z, y: c.y }); P.yaw = c.yaw; P.pitch = 0;
  G.state = 'playing'; G.dc = null; G.dcHold = false; $('killcam').classList.add('hide'); vig.style.opacity = 0; camera.fov = baseFov; camera.updateProjectionMatrix(); hideCenter(); lockPointer();
  campRefill(); G.health = G.maxHp;
  for (const a of CAMP.allies) if (enemies.includes(a)) { const p = campBehind(2.5); a.group.position.set(p.x, p.y, p.z); a.hp = a.maxHp; a.goal = null; a.tgt = null; }
  campBegin(c.i);
}

/* ---------- the end of a mission */
function campComplete() {
  if (CAMP.done) return; CAMP.done = true; campHush();
  const m = CAMP.m, secs = Math.round(M.t - CAMP.t0), P0 = campProg(), prev = P0.done[m.id], first = !prev, D = CAMP_DIFF[CAMP.diff];
  const rank = ['recruit', 'regular', 'veteran'];
  P0.done[m.id] = { best: prev ? Math.min(prev.best, secs) : secs, diff: prev && rank.indexOf(prev.diff) > rank.indexOf(CAMP.diff) ? prev.diff : CAMP.diff };
  const tins = new Set([...(P0.tins[m.id] || []), ...CAMP.tins]); P0.tins[m.id] = [...tins]; P0.last = m.id;
  const xp = Math.round((2500 + MS.kills * 20 + CAMP.tins.length * 250) * D.xp), dz = first ? 400 : 0;
  try { wkPay(xp, dz); } catch (e) {} saveProg();
  MS.active = false;
  M.over = true; G.state = 'over'; mouseDown = false; mouseAds = false; hadLock = false; try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  const acc = MS.shots ? Math.round(MS.hits / MS.shots * 100) : 0, idx = CAMP_MISSIONS.indexOf(m), next = CAMP_MISSIONS[idx + 1];
  let o = $('campEndEl'); if (o) o.remove(); o = document.createElement('div'); o.id = 'campEndEl'; o.className = 'camp-end';
  o.innerHTML = `<div class="ce-box"><small>MISSION ${idx + 1} COMPLETE · ${D.name}</small><b>${m.title}</b>
    <div class="ce-grid">${[['TIME', fmtT(secs)], ['KILLS', MS.kills], ['HEADSHOTS', MS.heads], ['ACCURACY', acc + '%'], ['DEATHS', CAMP.deaths], ['STASH TINS', `${tins.size} / 3`]].map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('')}</div>
    <div class="ce-xp">+${xp.toLocaleString()} XP${dz ? ` · +${dz} DZ` : ''}</div>
    <div class="ce-btns">${next ? `<button class="btn primary" data-act="cp-next">NEXT MISSION · ${next.title}</button>` : `<button class="btn primary" data-act="cp-menu">${CAMP_MISSIONS.length < CAMP_PLAN.length ? 'MORE MISSIONS COMING SOON' : 'THE END · BACK TO THE CAMPAIGN'}</button>`}<button class="btn" data-act="cp-menu">MISSION SELECT</button></div></div>`;
  document.body.appendChild(o);
  try { sfx.streak(); } catch (e) {}
  if (m.end) campSay(m.end);
}
function campClear() {
  campHush(); campPropsClear(); for (const o of CAMP.mprops || []) { scene.remove(o.g); if (o.g.userData.box) { const i = boxes.indexOf(o.g.userData.box); if (i >= 0) boxes.splice(i, 1); boxGridDirty = true; } if (o.g.userData.proxy) { scene.remove(o.g.userData.proxy); const j = wallMeshes.indexOf(o.g.userData.proxy); if (j >= 0) wallMeshes.splice(j, 1); } } CAMP.mprops = [];
  for (const t of CAMP.tinObjs) scene.remove(t.g); CAMP.tinObjs = [];
  CAMP.sq.clear(); CAMP.allies = []; CAMP.st = null; CAMP.m = null; CAMP.dead = false; CAMP.carry = null; CAMP.done = false;
  for (const id of ['campHudEl', 'campMarkEl', 'campFailEl', 'campEndEl', 'campCardEl', 'campBarEl']) { const el = $(id); if (el) el.remove(); }
  try { campPauseBtns(); } catch (e) {}
}

/* ---------- stash tins: three hidden in every mission */
function campBuildTins() {
  const m = CAMP.m, have = new Set(campProg().tins[m.id] || []);
  (m.tins || []).forEach((p, k) => {
    const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0x2a7a3a, metalness: 0.6, roughness: 0.35, emissive: new THREE.Color(0x1a5a1a), emissiveIntensity: 0.5 });
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 16), mat); can.position.y = 0.05; g.add(can);
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.06, 5), new THREE.MeshBasicMaterial({ color: 0xb0ff7a })); leaf.rotation.x = -Math.PI / 2; leaf.position.y = 0.076; g.add(leaf);
    const lt = new THREE.PointLight(0x7aff5a, 0.5, 2.5, 2); lt.position.y = 0.3; g.add(lt);
    g.position.set(p.x, p.y !== undefined ? p.y : groundAt(p.x, p.z, 30), p.z); scene.add(g);
    if (have.has(k)) g.children[0].material.opacity = 0.35, g.children[0].material.transparent = true;
    CAMP.tinObjs.push({ g, k, had: have.has(k) });
  });
}
function campTins() {
  for (const t of CAMP.tinObjs) {
    if (t.got) continue; t.g.rotation.y += 0.03;
    const p = t.g.position; if (Math.hypot(P.x - p.x, P.z - p.z) < 1.3 && Math.abs(P.y - p.y) < 1.6) {
      t.got = true; scene.remove(t.g); if (!CAMP.tins.includes(t.k)) CAMP.tins.push(t.k);
      const total = new Set([...(campProg().tins[CAMP.m.id] || []), ...CAMP.tins]).size;
      showBanner('STASH TIN', `${total} of 3 in this mission`); try { sfx.pickup(); tone(1320, 0.1, 0.06, 'triangle'); } catch (e) {}
    }
  }
}

/* ---------- props: the things you use, burn, carry, photograph or defend */
const CAMP_PROPS = {
  laptop: g => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.3), new THREE.MeshStandardMaterial({ color: 0x22262a, metalness: 0.5, roughness: 0.4 })); b.position.y = 0.92; g.add(b); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.26), new THREE.MeshBasicMaterial({ color: 0x3aff8a })); s.position.set(0, 1.06, -0.14); s.rotation.x = -0.25; g.add(s); const t = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.6), new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 })); t.position.y = 0.45; g.add(t); },
  charge: g => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.12), new THREE.MeshStandardMaterial({ color: 0x5a5a3a, roughness: 0.8 })); b.position.y = 1.0; g.add(b); const l = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a1a })); l.position.set(0.1, 1.12, 0.06); g.add(l); g.userData.blink = l; },
  crop: g => { const m = new THREE.MeshStandardMaterial({ color: 0x5a2a7a, emissive: new THREE.Color(0x6a1aff), emissiveIntensity: 0.7, roughness: 0.7, side: THREE.DoubleSide }); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, c = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.3, 6), m); c.position.set(Math.cos(a) * 0.7, 0.65, Math.sin(a) * 0.7); g.add(c); } },
  bag: g => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.35), new THREE.MeshStandardMaterial({ color: 0x1c2a1a, roughness: 0.8 })); b.position.y = 0.18; g.add(b); const s = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.05), new THREE.MeshStandardMaterial({ color: 0x8adf5a })); s.position.y = 0.3; g.add(s); },
  box: g => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.95 })); b.position.y = 0.2; g.add(b); },
  panel: g => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.14), new THREE.MeshStandardMaterial({ color: 0x5a6068, metalness: 0.6, roughness: 0.45 })); b.position.y = 1.35; g.add(b); const l = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshBasicMaterial({ color: 0xff3a2a })); l.position.set(0, 1.5, 0.075); g.add(l); g.userData.blink = l; },
  drive: g => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.09), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7 })); b.position.y = 0.95; g.add(b); const t = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.6), new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.6 })); t.position.y = 0.45; g.add(t); },
  van: g => {
    const body = new THREE.MeshStandardMaterial({ color: 0xe8e6dc, roughness: 0.45, metalness: 0.25 }), glass = new THREE.MeshStandardMaterial({ color: 0x1a2630, roughness: 0.1, metalness: 0.6 }), dark = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const box = (m, w, h, d, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    box(body, 2.1, 1.9, 3.4, 0, 1.35, -0.6); box(body, 2.1, 1.25, 1.3, 0, 1.0, 1.75); box(glass, 1.9, 0.6, 0.05, 0, 1.55, 2.38).rotation.x = -0.35;
    for (const s of [-1, 1]) box(glass, 0.05, 0.5, 0.8, s * 1.06, 1.55, 1.6);
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#3a9a4a'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#fff'; x.font = 'bold 54px sans-serif'; x.textAlign = 'center'; x.fillText('GREEN COAST', 256, 66); x.font = '26px sans-serif'; x.fillText('collective · est. 1981', 256, 104);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; const lm = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.75), lm); p.position.set(s * 1.056, 1.45, -0.6); p.rotation.y = s * Math.PI / 2; g.add(p); }
    for (const [x2, z] of [[-1, 1.5], [1, 1.5], [-1, -1.6], [1, -1.6]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16), dark); w.rotation.z = Math.PI / 2; w.position.set(x2, 0.38, z); g.add(w); }
    box(dark, 2.14, 0.2, 4.9, 0, 0.5, 0.1); g.userData.solid = [2.1, 2.3, 4.7];
  },
  server: g => { const m = new THREE.MeshStandardMaterial({ color: 0x1a1d22, metalness: 0.5, roughness: 0.4 }); for (const x of [-0.35, 0.35]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.0, 0.8), m); b.position.set(x, 1.0, 0); g.add(b); } const l = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), new THREE.MeshBasicMaterial({ color: 0x2aff6a, transparent: true, opacity: 0.25 })); l.position.set(0, 1.0, 0.41); g.add(l); g.userData.solid = [1.3, 2.0, 0.8]; },
  door: g => { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.15), new THREE.MeshStandardMaterial({ color: 0x6a6e74, metalness: 0.6 })); b.position.y = 1.1; g.add(b); },
  sign: () => {},
};
function campPropsFor(st) {
  const mk = (p, kind) => {
    if (!kind || !CAMP_PROPS[kind]) return; const g = new THREE.Group(); CAMP_PROPS[kind](g); g.position.set(p.x, p.y !== undefined ? p.y : groundAt(p.x, p.z, 30), p.z); g.rotation.y = p.q || 0; scene.add(g);
    if (g.userData.solid) { const s = g.userData.solid, b = mkBox(p.x, p.z, s[0], s[2], s[1], { y: g.position.y, walk: false }); boxes.push(b); boxGridDirty = true; g.userData.box = b;
      const px = new THREE.Mesh(new THREE.BoxGeometry(s[0], s[1], s[2]), new THREE.MeshBasicMaterial({ visible: false })); px.position.set(p.x, g.position.y + s[1] / 2, p.z); scene.add(px); px.updateMatrixWorld(); wallMeshes.push(px); g.userData.proxy = px; }
    CAMP.props.push({ g, p, kind }); return g;
  };
  if ((st.type === 'use' || st.type === 'pick' || st.type === 'carry') && st.at) mk(st.at, st.prop || (st.type === 'carry' ? 'bag' : null));
  if (st.type === 'multi' || st.type === 'search') for (const s of st.spots) mk(s, s.prop || st.prop);
  if (st.type === 'defend' && st.obj) mk(st.obj, st.obj.prop);
  for (const x of st.props || []) mk(x, x.prop);
}
function campPropUsed(p) {
  const o = CAMP.props.find(q => q.p === p); if (!o) return;
  if (o.kind === 'crop') { try { explosionFx(new THREE.Vector3(p.x, (p.y || 0) + 0.5, p.z), 0.6); } catch (e) {} o.burn = 6; }
  else if (o.kind === 'bag' || o.kind === 'drive' && CAMP.st.type !== 'use') { scene.remove(o.g); o.gone = true; }
  else if (o.kind === 'panel' || o.kind === 'laptop') o.g.traverse(m => { if (m.material && m.material.color && m.material.isMeshBasicMaterial) m.material.color.setHex(0x3aff6a); });
  o.used = true;
}
function campProps(dt) {
  for (const o of CAMP.props) {
    if (o.g.userData.blink) o.g.userData.blink.visible = (NOW * 2 % 1) < 0.5 || o.used;
    if (o.burn > 0) { o.burn -= dt; if (Math.random() < dt * 12) try { puff(o.p.x + rnd(-0.8, 0.8), (o.p.y || 0) + rnd(0.3, 1.6), o.p.z + rnd(-0.8, 0.8), { color: Math.random() < 0.5 ? 0x7a3aff : 0x3a3a3a, size: 0.6, grow: 1.8, life: 1.6, vy: 0.8, op: 0.5 }); } catch (e) {} if (o.burn <= 0) o.g.visible = false; }
  }
}
function campPropsClear() { for (const o of CAMP.props) { scene.remove(o.g); if (o.g.userData.box) { const i = boxes.indexOf(o.g.userData.box); if (i >= 0) boxes.splice(i, 1); boxGridDirty = true; } if (o.g.userData.proxy) { scene.remove(o.g.userData.proxy); const j = wallMeshes.indexOf(o.g.userData.proxy); if (j >= 0) wallMeshes.splice(j, 1); } } CAMP.props = []; }

/* ---------- the HUD: objective, the marker in the world, bars */
function campTargets() {
  const st = CAMP.st; if (!st || CAMP.stepDone) return [];
  if (st.type === 'go' || st.type === 'use' || st.type === 'pick') return st.at ? [st.at] : [];
  if (st.type === 'carry') return CAMP.carry ? [st.to] : [st.at];
  if (st.type === 'multi') return st.spots.filter((s, j) => !CAMP.multi.has(j));
  if (st.type === 'search') return st.spots.filter((s, j) => !CAMP.searched.has(j));
  if (st.type === 'photo') return st.spots.filter((s, j) => !CAMP.photos.has(j)).map(s => Object.assign({ y: (s.y || 0) + (s.h || 1) }, s, { y: (s.y || 0) + (s.h || 1) - 1 }));
  if (st.type === 'hold' || st.type === 'snipe') return st.at ? [st.at] : [];
  if (st.type === 'defend') return CAMP.defObj ? [CAMP.defObj] : [];
  if (st.type === 'escort') { const a = campAllyOf(st.who); return a ? [{ x: a.group.position.x, z: a.group.position.z, y: a.group.position.y + 1.2, label: campChar(st.who).name }] : []; }
  if (st.type === 'chase' || st.type === 'boss' || (st.type === 'clear' && st.mark)) return (st.squads || st.spawn || []).flatMap(n => campAlive(n)).map(e => ({ x: e.group.position.x, z: e.group.position.z, y: e.group.position.y + 1.0, enemy: true }));
  return [];
}
function campHud(force) {
  let h = $('campHudEl'); if (!campOn()) { if (h) h.remove(); return; }
  if (!h) { h = document.createElement('div'); h.id = 'campHudEl'; ($('hud') || document.body).appendChild(h); }
  const st = CAMP.st, m = CAMP.m; if (!st) return;
  const extra = st.type === 'multi' ? ` (${CAMP.multi.size}/${st.spots.length})` : st.type === 'photo' ? ` (${CAMP.photos.size}/${st.spots.length})` : st.type === 'clear' || st.type === 'snipe' ? (() => { const n = (st.squads || st.spawn || []).reduce((a, s) => a + campAlive(s).length, 0); return n ? ` (${n} left)` : ''; })() : '';
  const timer = st.t ? ` · ${fmtT(Math.max(0, st.t - CAMP.stT))}` : (st.type === 'hold' || st.type === 'defend') ? ` · ${fmtT(Math.max(0, st.secs - CAMP.stT))}` : '';
  const key = st.goal + extra + timer + (CAMP.carry ? '|c' : '') + (CAMP.defObj ? Math.ceil(CAMP.defObj.hp) : '') + (st.stealth || st.quiet ? (CAMP.alarmed ? 'A' : 'q') : '');
  if (!force && h._k === key) return; h._k = key;
  const bar = CAMP.defObj ? `<div class="ch-bar"><span>${CAMP.defObj.name}</span><s style="width:${Math.max(0, CAMP.defObj.hp / CAMP.defObj.max * 100)}%"></s></div>` : '';
  const boss = (st.type === 'boss' ? (st.squads || st.spawn || []).flatMap(n => campAlive(n)).filter(e => e.boss) : []).map(e => `<div class="ch-bar boss"><span>${e.name}</span><s style="width:${Math.max(0, e.hp / e.maxHp * 100)}%"></s></div>`).join('');
  const esc = st.type === 'escort' ? (() => { const a = campAllyOf(st.who); return a ? `<div class="ch-bar ally"><span>${campChar(st.who).name}</span><s style="width:${Math.max(0, a.hp / a.maxHp * 100)}%"></s></div>` : ''; })() : '';
  h.innerHTML = `<small>${m.title}</small><b>${st.goal}${extra}${timer}</b>${st.stealth ? `<em class="${CAMP.alarmed ? 'bad' : ''}">${CAMP.alarmed ? 'SPOTTED' : 'STAY HIDDEN · CROUCH TO STAY UNSEEN'}</em>` : st.quiet ? `<em class="${CAMP.alarmed ? 'bad' : ''}">${CAMP.alarmed ? 'ALARM RAISED' : 'QUIET · DON\'T GET SEEN'}</em>` : ''}${CAMP.carry ? `<em>CARRYING ${CAMP.carry.item}</em>` : ''}${bar}${boss}${esc}`;
}
const _cmV = new THREE.Vector3();
function campMarkers() {
  let box = $('campMarkEl'); if (!campOn() || CAMP.dead || CAMP.done || G.state !== 'playing') { if (box) box.style.display = 'none'; return; }
  if (!box) { box = document.createElement('div'); box.id = 'campMarkEl'; document.body.appendChild(box); }
  box.style.display = '';
  const T = campTargets().slice(0, 6), W = innerWidth, H = innerHeight;
  while (box.children.length < T.length) { const d = document.createElement('div'); d.className = 'cm'; d.innerHTML = '<i></i><span></span>'; box.appendChild(d); }
  [...box.children].forEach((d, k) => {
    const t = T[k]; if (!t) { d.style.display = 'none'; return; } d.style.display = '';
    _cmV.set(t.x, (t.y || 0) + (t.enemy ? 0.9 : 1.4), t.z).project(camera);
    let x = (_cmV.x + 1) / 2 * W, y = (1 - _cmV.y) / 2 * H; const behind = _cmV.z > 1;
    if (behind) { x = W - x; y = H - 30; }
    x = clamp(x, 30, W - 30); y = clamp(y, 40, H - 40);
    d.style.transform = `translate(${x}px,${y}px)`; d.classList.toggle('en', !!t.enemy);
    const dist = Math.round(Math.hypot(t.x - P.x, t.z - P.z)); d.lastChild.textContent = (t.label ? t.label + ' · ' : '') + dist + ' M';
  });
}
function campPauseBtns() {
  const p = $('pause'); if (!p) return; let b = $('cpRestartBtn');
  if (!b) { b = document.createElement('button'); b.className = 'btn'; b.id = 'cpRestartBtn'; b.dataset.act = 'cp-restart'; b.textContent = 'RESTART FROM CHECKPOINT'; const r = p.querySelector('[data-act="restart"]'); p.insertBefore(b, r); }
  const on = campOn(); b.style.display = on ? '' : 'none';
  const lo = p.querySelector('[data-act="loadout"]'); if (lo) lo.style.display = on ? 'none' : '';
  const rs = p.querySelector('[data-act="restart"]'); if (rs) rs.textContent = on ? 'RESTART MISSION' : 'RESTART';
}
function campTick(dt) {
  if ((CAMP.pbT = (CAMP.pbT || 0) - dt) <= 0) { CAMP.pbT = 0.5; campPauseBtns(); }
  if (!campOn()) return;
  campHud(false); campMarkers();
}

/* ---------- the CAMPAIGN screen */
function campMenu() {
  let s = $('campaign');
  if (!s) { s = document.createElement('div'); s.id = 'campaign'; s.className = 'screen cod pg-scr hide'; document.body.appendChild(s); }
  if (!SCREENS.includes('campaign')) SCREENS.push('campaign');
  campRender(); showScreen('campaign');
}
function campRender() {
  const s = $('campaign'); if (!s) return;
  const P0 = campProg(), sel = CAMP.sel || P0.last && CAMP_MISSIONS.findIndex(m => m.id === P0.last) + 1 < CAMP_MISSIONS.length && campUnlocked(CAMP_MISSIONS.findIndex(m => m.id === P0.last) + 1) ? CAMP.sel || CAMP_MISSIONS[CAMP_MISSIONS.findIndex(m => m.id === P0.last) + 1].id : CAMP.sel || CAMP_MISSIONS[0].id;
  CAMP.sel = sel; const m = campMission(sel), idx = CAMP_MISSIONS.indexOf(m), done = P0.done[m.id], tinsAll = Object.values(P0.tins).reduce((a, t) => a + t.length, 0);
  const pic = id => (typeof MAPSHOTS !== 'undefined' && MAPSHOTS[id] && MAPSHOTS[id][0]) || '';
  s.innerHTML = `<div class="cod-top"><div class="logo cod-logo">FIRST <em>HARVEST</em><span class="beta-tag">CAMPAIGN</span></div><nav class="cod-nav"><button class="cod-tab" data-act="cp-back">‹ BACK</button></nav><div class="cp-sum">${Object.keys(P0.done).length} / ${CAMP_PLAN.length} MISSIONS · ${tinsAll} / ${CAMP_PLAN.length * 3} STASH TINS</div></div>
  <div class="cp-main"><div class="cp-list">${CAMP_MISSIONS.map((q, i) => { const un = campUnlocked(i), d = P0.done[q.id]; return `<button class="cp-m${q.id === sel ? ' on' : ''}${un ? '' : ' lock'}" data-act="cp-sel-${q.id}"${un ? '' : ' disabled'}><em>${String(i + 1).padStart(2, '0')}</em><b>${un ? q.title : 'LOCKED'}</b><small>${un ? q.place : 'finish the mission before it'}</small>${d ? `<i>✓ ${CAMP_DIFF[d.diff].name} · ${(P0.tins[q.id] || []).length}/3</i>` : ''}</button>`; }).join('')}${CAMP_PLAN.slice(CAMP_MISSIONS.length).map((t, k) => `<button class="cp-m lock" disabled><em>${String(CAMP_MISSIONS.length + k + 1).padStart(2, '0')}</em><b>${t}</b><small>coming soon</small></button>`).join('')}</div>
  <div class="cp-detail" style="${pic(m.map) ? `background-image:linear-gradient(180deg,rgba(8,10,12,.2),rgba(8,10,12,.95) 60%),url(${pic(m.map)})` : ''}">
    <small>MISSION ${idx + 1} · ${m.place}${m.when ? ' · ' + m.when : ''}</small><b>${m.title}</b><p>${m.brief}</p>
    <div class="cp-tasks">${(m.tasks || []).map(t => `<span>${t}</span>`).join('')}</div>
    <div class="cp-crew">${(m.allies || []).length ? 'WITH YOU: ' + m.allies.map(a => `<span style="color:${campChar(a).col}">${campChar(a).name}</span>`).join(' · ') : 'ON YOUR OWN'}</div>
    ${done ? `<div class="cp-best">BEST TIME ${fmtT(done.best)} · ${CAMP_DIFF[done.diff].name} · STASH TINS ${(P0.tins[m.id] || []).length}/3</div>` : ''}
    <div class="cp-diff">${Object.entries(CAMP_DIFF).map(([k, d]) => `<button class="cp-d${k === CAMP.diff ? ' on' : ''}" data-act="cp-diff-${k}"><b>${d.name}</b><small>${d.d}</small></button>`).join('')}</div>
    <button class="btn primary cp-go" data-act="cp-play">PLAY MISSION ${idx + 1}</button>
  </div></div>`;
  try { focusFirst('#campaign .cp-go'); } catch (e) {}
}
function campAct(act) {
  if (act === 'campaign') { sfx.ui(); campMenu(); return true; }
  if (act === 'cp-back') { sfx.ui(); showScreen('menu'); return true; }
  if (act.startsWith('cp-sel-')) { const id = act.slice(7), i = CAMP_MISSIONS.findIndex(m => m.id === id); if (i >= 0 && campUnlocked(i)) { CAMP.sel = id; sfx.ui(); campRender(); } return true; }
  if (act.startsWith('cp-diff-')) { CAMP.diff = act.slice(8); try { localStorage.setItem('ashfall.campdiff', CAMP.diff); } catch (e) {} sfx.ui(); campRender(); return true; }
  if (act === 'cp-play') { sfx.ui(); campPlay(CAMP.sel, CAMP.diff); return true; }
  if (act === 'cp-next') { const i = CAMP_MISSIONS.findIndex(m => m.id === CAMP.m.id), n = CAMP_MISSIONS[i + 1], d = CAMP.diff; campClear(); leaveGame(); if (n) { CAMP.sel = n.id; campPlay(n.id, d); } else campMenu(); return true; }
  if (act === 'cp-menu') { const id = CAMP.m && CAMP.m.id; campClear(); leaveGame(); CAMP.sel = id || CAMP.sel; campMenu(); return true; }
  if (act === 'cp-restart') { if (campOn()) { showScreen(null); G.state = 'playing'; campFail('restarting from the checkpoint'); CAMP.restartT = 0.6; } return true; }
  return false;
}
try { const d = localStorage.getItem('ashfall.campdiff'); if (CAMP_DIFF[d]) CAMP.diff = d; } catch (e) {}
// the main menu tile
setTimeout(() => {
  try {
    const tiles = document.querySelector('#menu .cod-tiles'); if (!tiles || document.querySelector('.cp-tile')) return;
    const b = document.createElement('button'); b.className = 'cod-tile cp-tile'; b.dataset.act = 'campaign';
    b.innerHTML = '<small>STORY &middot; 12 MISSIONS</small><b>CAMPAIGN</b><span>FIRST HARVEST &middot; HOW IT ALL STARTED</span>';
    tiles.insertBefore(b, tiles.children[1] || null);
  } catch (e) {}
}, 0);
(() => { const s = document.createElement('style'); s.textContent = `
#campHudEl{position:absolute;left:24px;top:120px;max-width:380px;pointer-events:none;font-family:inherit}
#campHudEl small{display:block;font-size:10px;letter-spacing:.3em;color:#e0b44a}#campHudEl b{display:block;font-size:15px;letter-spacing:.06em;color:#fff;text-shadow:0 1px 3px #000;margin:3px 0}
#campHudEl em{display:block;font-style:normal;font-size:11px;letter-spacing:.18em;color:#8adf6a;text-shadow:0 1px 2px #000}#campHudEl em.bad{color:#ff5a4a}
.ch-bar{position:relative;width:280px;height:16px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.25);margin-top:6px}.ch-bar s{position:absolute;left:0;top:0;bottom:0;background:#e0b44a}.ch-bar.boss s{background:#ff4a3a}.ch-bar.ally s{background:#5aaeff}.ch-bar span{position:relative;z-index:1;font-size:10px;letter-spacing:.18em;padding-left:6px;line-height:16px;color:#fff;text-shadow:0 1px 2px #000}
#campMarkEl{position:fixed;left:0;top:0;pointer-events:none;z-index:6}#campMarkEl .cm{position:absolute;left:0;top:0;margin:-14px 0 0 -40px;width:80px;text-align:center}
#campMarkEl .cm i{display:block;width:14px;height:14px;margin:0 auto;border:2px solid #e0b44a;transform:rotate(45deg);background:rgba(224,180,74,.25)}#campMarkEl .cm.en i{border-color:#ff4a3a;background:rgba(255,74,58,.3)}
#campMarkEl .cm span{display:block;font-size:10px;letter-spacing:.12em;color:#fff;text-shadow:0 1px 2px #000;margin-top:4px}
#campCardEl{position:fixed;left:50%;top:26%;transform:translateX(-50%);text-align:center;pointer-events:none;z-index:7;transition:opacity 1s}#campCardEl.out{opacity:0}
#campCardEl small{display:block;font-size:12px;letter-spacing:.4em;color:#e0b44a}#campCardEl b{display:block;font-size:46px;letter-spacing:.14em;color:#fff;text-shadow:0 2px 12px #000;margin:6px 0}
#campCardEl span{display:block;font-size:14px;letter-spacing:.2em;color:#ddd;text-shadow:0 1px 4px #000}#campCardEl em{display:block;font-style:normal;font-size:12px;letter-spacing:.3em;color:#9a9;margin-top:4px}
#campFailEl{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(40,0,0,.55);z-index:8;pointer-events:none}
#campFailEl b{font-size:44px;letter-spacing:.2em;color:#ff5a4a;text-shadow:0 2px 12px #000}#campFailEl span{font-size:16px;letter-spacing:.2em;color:#fff;margin-top:8px}#campFailEl small{font-size:11px;letter-spacing:.3em;color:#ccc;margin-top:18px}
.camp-flash{position:fixed;inset:0;background:#fff;opacity:.85;z-index:9;pointer-events:none;animation:cflash .4s forwards}@keyframes cflash{to{opacity:0}}
.camp-end{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(6,8,10,.86);z-index:20;pointer-events:auto}
.ce-box{width:min(720px,92vw);text-align:center}.ce-box>small{font-size:12px;letter-spacing:.35em;color:#e0b44a}.ce-box>b{display:block;font-size:42px;letter-spacing:.14em;color:#fff;margin:8px 0 18px}
.ce-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}.ce-grid div{border:1px solid rgba(255,255,255,.15);padding:10px;background:rgba(255,255,255,.04)}.ce-grid small{display:block;font-size:10px;letter-spacing:.24em;color:#aaa}.ce-grid b{font-size:22px;color:#fff}
.ce-xp{font-size:16px;letter-spacing:.2em;color:#8adf6a;margin-bottom:16px}.ce-btns{display:flex;gap:10px;justify-content:center}
#campaign .cp-sum{margin-left:auto;font-size:12px;letter-spacing:.2em;color:#e0b44a;align-self:center}
#campaign .cp-main{display:grid;grid-template-columns:minmax(260px,360px) 1fr;gap:16px;padding:12px 28px 24px;height:calc(100% - 90px);box-sizing:border-box}
#campaign .cp-list{overflow:auto;display:flex;flex-direction:column;gap:6px;pointer-events:auto}
#campaign .cp-m{position:relative;text-align:left;font-family:inherit;padding:8px 10px 8px 52px;border:1px solid var(--line,rgba(255,255,255,.15));background:rgba(12,14,16,.75);color:#fff;cursor:pointer;min-height:50px}
#campaign .cp-m em{position:absolute;left:10px;top:8px;font-style:normal;font-size:22px;font-weight:800;color:#e0b44a}#campaign .cp-m b{display:block;font-size:13px;letter-spacing:.12em}#campaign .cp-m small{display:block;font-size:10px;letter-spacing:.06em;color:#aaa}
#campaign .cp-m i{position:absolute;right:8px;top:8px;font-style:normal;font-size:10px;letter-spacing:.1em;color:#8adf6a}#campaign .cp-m.on{border-color:#e0b44a;box-shadow:0 0 10px rgba(224,180,74,.35)}#campaign .cp-m.lock{opacity:.45;cursor:default}
#campaign .cp-detail{pointer-events:auto;border:1px solid rgba(255,255,255,.15);padding:22px 26px;background:#0c0e10 center/cover;display:flex;flex-direction:column;justify-content:flex-end;overflow:auto}
#campaign .cp-detail>small{font-size:11px;letter-spacing:.3em;color:#e0b44a}#campaign .cp-detail>b{font-size:40px;letter-spacing:.12em;color:#fff;margin:4px 0 8px}#campaign .cp-detail p{font-size:14px;line-height:1.55;color:#ddd;max-width:640px;margin:0 0 10px}
#campaign .cp-tasks{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}#campaign .cp-tasks span{font-size:10px;letter-spacing:.16em;padding:4px 8px;border:1px solid rgba(138,223,106,.5);color:#bfe8a8}
#campaign .cp-crew,#campaign .cp-best{font-size:11px;letter-spacing:.18em;color:#bbb;margin-bottom:10px}
#campaign .cp-diff{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}#campaign .cp-d{font-family:inherit;text-align:left;padding:8px 10px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.45);color:#fff;cursor:pointer}
#campaign .cp-d b{display:block;font-size:13px;letter-spacing:.16em}#campaign .cp-d small{font-size:10px;color:#aaa}#campaign .cp-d.on{border-color:#e0b44a;background:rgba(224,180,74,.15)}
#campaign .cp-go{align-self:flex-start;min-width:260px}
.cp-tile b{color:#e0b44a}
`; document.head.appendChild(s); })();
