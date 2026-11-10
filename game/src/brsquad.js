/* ================================================================== LAST TOKE SQUADS 2.0 (1.2.93)
   RE-UP BEACONS: when someone in a squad dies while a squadmate still stands, they drop a green STASH CARD. A squadmate
     (you or a bot) picks it up by walking over it and takes it to one of the RE-UP BEACONS (tall green towers at the
     places on the map); hold USE there for 3 s and they float back in from the sky above it, with a pistol. Cards go
     stale after 90 s. Offline (and the host's bots online).
   CALLOUTS on the emote wheel (J / hold D-pad left) in duos and squads: NEED AMMO, NEED HEALS, ON ME, LET'S GO, ENEMY,
     LOOT. Your squad's bots answer: they bring ammo or a nug, regroup on you or push to the circle. Spoken with the
     built-in voices.
   SQUAD WIPED: a banner when your squad finishes off the last of a squad. LAST ONE STANDING: when you are the only one
     of your squad left, a slow heartbeat plays.
   CARRY: press MELEE next to a downed squadmate to put them on your shoulder (slower, no shooting); MELEE again to put
     them down. Revive while carrying.
   THE DROP: your squad's bots follow you down in the float in (they land where you land).
   BONG REVIVE: a revive takes 2.4 s (was 3.5) and ends in a puff of smoke.
   SPECTATE: when you are out, you watch your own squad first (JUMP / A for the next one); the camera follows the hills. */
const BRSQ = { cards: [], beacons: [], dead: new Set(), carry: null, mH: false, beatT: 0, lastAlone: false, teams: null, call: null, calls: [], puffs: [], fT: 0 };
const BRSQ_CALLS = [
  { k: 'ammo', n: 'NEED AMMO', i: '🔫', say: ['I need ammo!', "I'm low on ammo!", 'Anyone got ammo?'] },
  { k: 'heals', n: 'NEED HEALS', i: '🍃', say: ['I need a heal!', "I'm hurt, need heals!"] },
  { k: 'onme', n: 'ON ME', i: '📍', say: ['On me!', 'Regroup on me!', 'Group up!'] },
  { k: 'go', n: "LET'S GO", i: '➡️', say: ["Let's go!", 'Move, move!', 'Push the circle!'] },
  { k: 'enemy', n: 'ENEMY', i: '⚠️', say: ['Enemy there!', 'Contact!', 'Enemy spotted!'] },
  { k: 'loot', n: 'LOOT HERE', i: '📦', say: ['Loot over here!', 'Got loot here!'] },
];
const BRSQ_REPLY = ['On my way!', 'Coming!', 'Got you!', 'Copy that!', 'Heading to you!'];
const brsqOn = () => !!(M && M.br && typeof sqOn === 'function' && sqOn());
function brsqSay(txt, who) {
  try { showMsg(`${who || 'YOU'}: ${txt}`); } catch (e) {}
  if (S.sqvox === false) return;
  try { if (!window.speechSynthesis || speechSynthesis.speaking) return; const u = new SpeechSynthesisUtterance(txt), vo = typeof sqvVoice === 'function' ? sqvVoice(who ? { name: who } : null) : null; if (vo) { u.voice = vo.v; u.pitch = vo.pitch; } u.rate = 1.1; u.volume = clamp(((S.master !== undefined ? S.master : 80) / 100) * 0.75, 0, 1); speechSynthesis.speak(u); } catch (e) {}
}
/* ---------- the round starts: beacons at the places */
function brsqSetup() {
  BRSQ.cards = []; BRSQ.beacons = []; BRSQ.dead = new Set(); BRSQ.carry = null; BRSQ.lastAlone = false; BRSQ.teams = null; BRSQ.call = null; BRSQ.puffs = [];
  if (!M || !M.br || !(M.squad > 1)) return;
  const pois = typeof mapPois === 'function' ? mapPois() : [], pr = PLAYRECT, spots = [];
  if (pois.length) for (const p of pois) { if (spots.length >= 10) break; const o = typeof brfgOutdoor === 'function' ? brfgOutdoor(p.x + p.w * 0.3, p.z - p.d * 0.3) : openNear(p.x + p.w * 0.3, p.z - p.d * 0.3); if (!spots.some(s => Math.hypot(s.x - o.x, s.z - o.z) < 30)) spots.push(o); }
  else for (let i = 0; i < 6; i++) spots.push(openNear(pr[0] + (pr[1] - pr[0]) * (0.2 + 0.6 * ((i * 0.37) % 1)), pr[2] + (pr[3] - pr[2]) * (0.2 + 0.6 * ((i * 0.61) % 1))));
  const pole = new THREE.MeshStandardMaterial({ color: 0x2a2e30, roughness: 0.5, metalness: 0.6 }), glow = new THREE.MeshStandardMaterial({ color: 0x113311, emissive: 0x5dff7a, emissiveIntensity: 1.8 });
  for (const o of spots) {
    const y = groundAt(o.x, o.z, (o.y || 0) + 1), g = new THREE.Group(); g.position.set(o.x, y, o.z); M.br.group.add(g);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.4, 12), pole); base.position.y = 0.2; g.add(base);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 4.2, 8), pole); p.position.y = 2.3; g.add(p);
    for (const yy of [1.4, 2.6, 3.8]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 6, 20), glow); r.rotation.x = Math.PI / 2; r.position.y = yy; g.add(r); }
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.4, 30, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0x5dff7a, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 19; g.add(beam);
    BRSQ.beacons.push({ x: o.x, z: o.z, y, g, holdT: 0 });
  }
}
// the nearest beacon inside the cloud to a point
function brsqBeacon(x, z) { const B = M.br; let best = null, bd = 1e9; for (const b of BRSQ.beacons) { const inC = Math.hypot(b.x - B.cx, b.z - B.cz) < B.r; const d = Math.hypot(b.x - x, b.z - z) + (inC ? 0 : 400); if (d < bd) { bd = d; best = b; } } return best; }
/* ---------- cards */
function brsqCardDrop(en, x, y, z) {
  if (BRSQ.cards.some(c => c.en === en)) return;
  const g = new THREE.Group(); g.position.set(x, y + 0.9, z); M.br.group.add(g);
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.02), new THREE.MeshStandardMaterial({ color: 0x113311, emissive: 0x5dff7a, emissiveIntensity: 1.4 })); g.add(card);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 6, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0x5dff7a, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 3; g.add(beam);
  BRSQ.cards.push({ en, team: en.team, x, y, z, g, t: 90, by: null });
  if (en.team === M.myTeam && !en.isPlayer) try { showMsg(`${en.name}'S STASH CARD DROPPED · TAKE IT TO A RE-UP BEACON`); } catch (e) {}
}
function brsqCardGone(c) { if (c.g && c.g.parent) c.g.parent.remove(c.g); BRSQ.cards = BRSQ.cards.filter(o => o !== c); if (BRSQ.carry === c) BRSQ.carry = null; }
// bring someone back: they float in above the beacon
function brsqReup(c, b) {
  brsqCardGone(c); const en = c.en; brsqPuff(b.x, b.y + 1, b.z, 10);
  if (en.isPlayer) {
    try { G.dc = null; G.dcHold = false; respawnPlayer(); } catch (e) {}
    if (playerAlive()) { try { brfFloatStart(); } catch (e) {} P.x = b.x; P.z = b.z; P.y = b.y + 70; P.vx = P.vz = 0; try { showBanner('RE-UP', 'your squad brought you back · float in'); } catch (e) {} }
  } else {
    let e = null; try { e = spawnBot(en, { x: b.x, z: b.z, y: b.y }); } catch (er) {}
    if (e) { e.group.position.y = b.y + 60; e.brFloat = { tx: b.x + rnd(-3, 3), tz: b.z + rnd(-3, 3), t: 0 }; e.brTier = -1; try { botGunProfile(e, 'sidearm'); } catch (er) {} if (!e.brPuff && typeof brfPuffMesh === 'function') { e.brPuff = brfPuffMesh(); e.group.add(e.brPuff); } }
    if (en.team === M.myTeam) try { showBanner('RE-UP', `${en.name} is floating back in`); sfx.streak(); } catch (er) {}
  }
}
/* ---------- puffs of smoke (the bong revive, the re-up) */
function brsqPuff(x, y, z, n) {
  for (let i = 0; i < (n || 6); i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0xd8f0dc, transparent: true, opacity: 0.8, depthWrite: false })); s.position.set(x + rnd(-0.4, 0.4), y + rnd(-0.2, 0.4), z + rnd(-0.4, 0.4)); s.scale.setScalar(rnd(0.6, 1.1)); scene.add(s); BRSQ.puffs.push({ s, t: 0, vy: rnd(0.3, 0.9) }); }
}
function brsqPuffTick(dt) { for (let i = BRSQ.puffs.length - 1; i >= 0; i--) { const p = BRSQ.puffs[i]; p.t += dt; p.s.position.y += p.vy * dt; p.s.scale.multiplyScalar(1 + dt * 0.8); p.s.material.opacity = 0.8 * (1 - p.t / 2); if (p.t > 2) { scene.remove(p.s); BRSQ.puffs.splice(i, 1); } } }
/* ---------- callouts (the emote wheel in squads) */
function brsqCall(i) {
  const C = BRSQ_CALLS[i]; if (!C || !brsqOn()) return; brsqSay(C.say[(Math.random() * C.say.length) | 0]);
  try { if (C.k === 'enemy' || C.k === 'loot') pingDo(); } catch (e) {}
  const mates = enemies.filter(e => !e.net && e.team === M.myTeam && e.entry && e.entry.alive !== false && !e.downed);
  BRSQ.call = { k: C.k, t: NOW + (C.k === 'onme' ? 20 : 14), x: P.x, z: P.z };
  if (C.k === 'ammo' || C.k === 'heals') { const b = mates.sort((a, c) => Math.hypot(a.group.position.x - P.x, a.group.position.z - P.z) - Math.hypot(c.group.position.x - P.x, c.group.position.z - P.z))[0]; BRSQ.call.who = b || null; }
  const r = mates[0]; if (r) setTimeout(() => { try { brsqSay(BRSQ_REPLY[(Math.random() * BRSQ_REPLY.length) | 0], r.entry.name); } catch (e) {} }, 1300);
}
const _brsqWheel = emoteWheel;
emoteWheel = function () {
  _brsqWheel(); const w = $('emoteWheel'); if (!w || !brsqOn()) return;
  const row = document.createElement('div'); row.className = 'sq-calls'; row.innerHTML = '<small>SQUAD</small>' + BRSQ_CALLS.map((c, i) => `<button data-co="${i}"><i>${c.i}</i><span>${c.n}</span></button>`).join('');
  w.appendChild(row); for (const b of row.querySelectorAll('[data-co]')) b.onclick = () => { w.remove(); brsqCall(+b.dataset.co); };
};
// bots: a card to fetch, a beacon to carry it to, or an answer to a callout (called from brGoal, before the squad revive goal)
function brsqBotGoal(e, set) {
  if (!brsqOn() || e.downed || e.net) return null; const g = e.group.position;
  // carrying a card: to the beacon, then wait there
  const mine = BRSQ.cards.find(c => c.by === e);
  if (mine) { const b = brsqBeacon(g.x, g.z); if (!b) return null; if (Math.hypot(b.x - g.x, b.z - g.z) < 1.6) { b.holdT += 0.3; if (b.holdT >= 3) { b.holdT = 0; brsqReup(mine, b); } } return set({ x: b.x, z: b.z, y: b.y }, 0.6); }
  if (e.tgt) return null;
  // a squadmate's card nobody has yet
  const c = BRSQ.cards.filter(c => !c.by && c.team === e.team).sort((a, b) => Math.hypot(a.x - g.x, a.z - g.z) - Math.hypot(b.x - g.x, b.z - g.z))[0];
  if (c && Math.hypot(c.x - g.x, c.z - g.z) < 90) return set({ x: c.x, z: c.z, y: c.y }, 0.6);
  // my callouts
  const C = BRSQ.call; if (C && NOW < C.t && e.team === M.myTeam) {
    if ((C.k === 'ammo' || C.k === 'heals') && C.who === e) {
      if (Math.hypot(P.x - g.x, P.z - g.z) < 2.2) { brsqGive(C.k, e); BRSQ.call = null; return null; }
      return set({ x: P.x, z: P.z, y: P.y }, 1.2);
    }
    if (C.k === 'onme' && Math.hypot(P.x - g.x, P.z - g.z) > 5) return set({ x: P.x + rnd(-2, 2), z: P.z + rnd(-2, 2), y: P.y }, 2);
  }
  return null;
}
function brsqGive(k, e) {
  try {
    if (k === 'ammo') { const w = WEAPONS[G.cur], t = w && w.def ? brlAmmoOf(w.def) : 'light'; BRL.ammo[t] = Math.min(BRL_AMMO[t].max, BRL.ammo[t] + BRL_AMMO[t].can); brlAmmoSync(true); showMsg(`${e.entry.name} GAVE YOU ${BRL_AMMO[t].can} ${BRL_AMMO[t].n} AMMO`); }
    else { BRL.heals.nug = Math.min(BRL_HEAL.nug.max, BRL.heals.nug + 1); showMsg(`${e.entry.name} GAVE YOU A NUG · ${actName('heal')} TO USE`); }
    sfx.pickup(); brsqSay('Here you go.', e.entry.name);
  } catch (er) {}
}
/* ---------- carrying a downed squadmate */
const brsqSlow = () => (BRSQ.carry ? 0.68 : 1);
function brsqCarryTick() {
  const m = kb('melee') || (pad.gp && pad.gp.buttons && pad.gp.buttons[pb('melee')] && pad.gp.buttons[pb('melee')].pressed), press = m && !BRSQ.mH; BRSQ.mH = m;
  const C = BRSQ.carry;
  if (C && (!C.downed || !enemies.includes(C) || !playerAlive() || G.downed)) { BRSQ.carry = null; if (C) C.carried = false; }
  else if (C && press) { BRSQ.carry = null; C.carried = false; C.group.position.set(P.x - Math.sin(P.yaw) * 0.6, groundAt(P.x, P.z, P.y + 0.5), P.z - Math.cos(P.yaw) * 0.6); try { showMsg(`PUT ${C.entry.name} DOWN`); } catch (e) {} return; }
  else if (!C && press && playerAlive() && !G.downed) {
    const d = enemies.find(e => e.downed && e.team === M.myTeam && !e.net && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 1.9);
    if (d) { BRSQ.carry = d; d.carried = true; G.meleeT = 0; try { showBanner(`CARRYING ${d.entry.name}`, `${actName('melee')} to put down · hold ${actName('use')} to revive`); } catch (e) {} }
  }
  if (BRSQ.carry) { const e = BRSQ.carry, bx = Math.sin(P.yaw), bz = Math.cos(P.yaw); e.group.position.set(P.x + bx * 0.25, P.y + 0.95, P.z + bz * 0.25); e.group.rotation.set(-1.45, P.yaw + Math.PI / 2, 0); e.bleed = Math.max(e.bleed, 3); G.swapT = Math.max(G.swapT, 0.2); }
}
/* ---------- every frame in a LAST TOKE round (from brUpdate) */
function brsqTick(dt) {
  if (!M || !M.br) return; brsqPuffTick(dt);
  // spectating: say how to come back
  if (G.state === 'spectate' && brsqOn() && !M.online) { const mine = BRSQ.cards.find(c => c.en === M.me); try { showMsgOnce(mine ? (mine.by ? `${mine.by === 'player' ? 'YOU' : mine.by.entry.name} HAS YOUR STASH CARD · ${Math.ceil(mine.t)} s` : `YOUR STASH CARD IS ON THE GROUND · ${Math.ceil(mine.t)} s`) : 'OUT · WATCHING YOUR SQUAD'); } catch (e) {} }
  if (!brsqOn()) return;
  // deaths: a card when the squad still has someone standing (offline, or the host's bots)
  for (const en of M.entries) {
    const dead = en.alive === false; if (dead && !BRSQ.dead.has(en)) {
      BRSQ.dead.add(en);
      if (!M.online || (netHostNow() && !en.isPlayer && !en.net)) { const standing = (en.team === M.myTeam && !en.isPlayer && playerAlive()) || enemies.some(e => e.entry && e.entry !== en && e.entry.alive !== false && e.team === en.team);
        if (standing) { const p = en.isPlayer ? { x: P.x, y: P.y, z: P.z } : en.lastPos || (en.bot ? { x: en.bot.group.position.x, y: en.bot.group.position.y, z: en.bot.group.position.z } : null); if (p) brsqCardDrop(en, p.x, p.y, p.z); } }
    } else if (!dead) BRSQ.dead.delete(en);
  }
  for (const e of enemies) if (e.entry && e.entry.alive !== false) e.entry.lastPos = { x: e.group.position.x, y: e.group.position.y, z: e.group.position.z };
  // cards: spin, get picked up, go stale
  const u = kb('use') || pad.use;
  for (const c of BRSQ.cards.slice()) {
    c.t -= dt; if (c.t <= 0) { if (c.team === M.myTeam) try { showMsg(`${c.en.isPlayer ? 'YOUR' : c.en.name + "'S"} STASH CARD WENT STALE`); } catch (e) {} brsqCardGone(c); continue; }
    if (c.by === 'player') { if (!playerAlive()) c.by = null; else { c.x = P.x; c.y = P.y; c.z = P.z; } }
    else if (c.by && c.by.group) { if (!enemies.includes(c.by) || c.by.downed || (c.by.entry && c.by.entry.alive === false)) c.by = null; else { c.x = c.by.group.position.x; c.y = c.by.group.position.y; c.z = c.by.group.position.z; } }
    c.g.position.set(c.x, c.y + (c.by ? 2.1 : 0.9), c.z); c.g.rotation.y += dt * 2; c.g.visible = !(c.by === 'player');
    if (!c.by) {
      if (playerAlive() && !G.downed && c.team === M.myTeam && Math.hypot(P.x - c.x, P.z - c.z) < 1.5 && Math.abs(P.y - c.y) < 2) { c.by = 'player'; try { showBanner(`${c.en.name}'S STASH CARD`, 'take it to a RE-UP BEACON (green tower) · on the map too'); sfx.pickup(); } catch (e) {} }
      else for (const e of enemies) if (!e.net && !e.downed && e.team === c.team && e.entry && e.entry.alive !== false && Math.hypot(e.group.position.x - c.x, e.group.position.z - c.z) < 1.5) { c.by = e; break; }
    }
  }
  // me at a beacon with a card: hold USE
  const mine = BRSQ.cards.filter(c => c.by === 'player');
  if (mine.length && playerAlive()) { const b = brsqBeacon(P.x, P.z);
    if (b && Math.hypot(b.x - P.x, b.z - P.z) < 2.2) { if (u) { b.holdT += dt; if (b.holdT >= 3) { b.holdT = 0; for (const c of mine) brsqReup(c, b); } } else b.holdT = 0;
      try { G.interactTxt = u ? `RE-UP · ${Math.round(b.holdT / 3 * 100)}%` : `HOLD ${actName('use')} TO BRING BACK ${mine.map(c => c.en.isPlayer ? 'YOU' : c.en.name).join(', ')}`; showMsgOnce(G.interactTxt); } catch (e) {} } }
  brsqCarryTick();
  // the float in: my squad's bots follow me down
  if (typeof BRF !== 'undefined' && BRF.float && (BRSQ.fT -= dt) <= 0) { BRSQ.fT = 0.5; for (const e of enemies) if (!e.net && e.team === M.myTeam && e.brFloat && !e.brFloat.wait) { const lead = clamp((P.y - groundAt(P.x, P.z, P.y)) / 7, 0, 12); e.brFloat.tx = P.x + P.vx * lead + rnd(-3, 3); e.brFloat.tz = P.z + P.vz * lead + rnd(-3, 3); } }
  // squad wiped / last one standing
  const T = typeof sqTeamsLeft === 'function' ? sqTeamsLeft() : null;
  if (T && BRSQ.teams) for (const t of BRSQ.teams) if (!T.has(t) && t !== M.myTeam) { const by = M.entries.filter(en => en.team === t).map(en => en.lastBy).find(b => b === 'player' || (b && b.team === M.myTeam)); if (by) try { showBanner('SQUAD WIPED', `squad ${t + 1} is out · ${T.size} left`); sfx.streak(); } catch (e) {} }
  if (T) BRSQ.teams = new Set(T);
  const alone = playerAlive() && !enemies.some(e => e.team === M.myTeam && e.entry && e.entry.alive !== false && !e.downed);
  if (alone && !BRSQ.lastAlone) try { showBanner('LAST ONE STANDING', 'the rest of your squad is down or out · get their cards to a beacon'); } catch (e) {}
  BRSQ.lastAlone = alone;
  if (alone && (BRSQ.beatT -= dt) <= 0) { BRSQ.beatT = 1.05; try { tone(52, 0.16, 0.16, 'sine', 38); setTimeout(() => { try { tone(48, 0.14, 0.11, 'sine', 36); } catch (e) {} }, 190); } catch (e) {} }
}
// the beacons on the map screen and as markers
function brsqMarkers(out) { if (!brsqOn()) return; const carrying = BRSQ.cards.some(c => c.by === 'player'); for (const b of BRSQ.beacons) if (carrying || Math.hypot(b.x - P.x, b.z - P.z) < 40) out.push({ x: b.x, y: b.y + 4.5, z: b.z, t: 'RE-UP', c: '#5dff7a' }); for (const c of BRSQ.cards) if (c.team === M.myTeam && !c.by) out.push({ x: c.x, y: c.y + 1.5, z: c.z, t: 'CARD', c: '#5dff7a' }); }
(() => { const s = document.createElement('style'); s.textContent = `#emoteWheel .sq-calls{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px;padding-top:8px;border-top:1px solid rgba(143,255,106,.3)}
#emoteWheel .sq-calls small{width:100%;text-align:center;color:#8fff6a;letter-spacing:3px;font-size:11px}#emoteWheel .sq-calls button{min-width:92px}`; document.head.appendChild(s); })();
