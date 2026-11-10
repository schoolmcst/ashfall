/* ================================================================== LAST TOKE DUOS and SQUADS (1.2.79)
   LAST TOKE in teams: SOLO (as before), DUOS (8 teams of 2) or SQUADS (4 teams of 4), you and your bot squadmates
   against the other squads. Squadmates share a team number, so bots already don't shoot their own squad; isFriend()
   makes them blue on the radar, gives them the friendly marker and stops your grenades hurting them.
   DOWNED: in a squad, the hit that would kill you (or a bot) knocks you down instead, as long as someone in your squad
   is still standing. Downed, you crawl slowly, can't shoot and bleed out in 15 s; enemies can finish you. A squadmate
   standing next to you for 3.5 s picks you back up (with 40 HP). Bots come to revive their downed squadmates (and you)
   when they are not in a fight; you revive a downed bot by holding USE next to it. When a whole squad is down at once
   they all bleed out. Last squad with anyone standing wins.
   Online too (ONLINE LAST TOKE DUOS / SQUADS, 1.2.81): squads come from presence tm, the host fills them with bots; each
   player runs their own down (dn in presence), a revive is sent as rv, the host's bots reviving a player as rb; the host's
   bots go down only on the host. Saved: nothing (M.squad lives for the match). */
const SQ = { revT: 0, revWho: null, rvOut: null, rvT: 0, rvSeq: 0, rbOut: null, rbT: 0, rbSeq: 0 };
const SQ_BLEED = 15, SQ_REVIVE = 2.4;   // the bong revive (1.2.93; was 3.5)
const sqOn = () => !!(M && M.squad > 1 && M.mode === 'br');
// someone in this team still standing (not downed, not dead), not counting `skip`
function sqStanding(team, skip) {
  if (team === M.myTeam && skip !== 'player' && playerAlive() && !G.downed) return true;
  for (const e of enemies) if (e !== skip && e.entry && e.entry.alive !== false && e.team === team && !e.downed) return true;
  return false;
}
/* ---------- going down */
// from hurtPlayer when the hit would kill me: true = I'm downed instead of dead
function sqPlayerDown() {
  if (!sqOn() || G.downed || brWarmNow() || !sqStanding(M.myTeam, 'player')) return false;
  G.downed = true; G.bleed = SQ_BLEED; G.health = 100; P.slideT = 0; P.mantle = null; G.adsOn = false;
  try { showBanner('DOWNED', 'a squadmate can pick you up · crawl to cover'); sfx.hurt(); } catch (e) {}
  return true;
}
// from damageEnemy when a bot would die: true = it's downed instead
function sqBotDown(e) {
  if (!sqOn() || brWarmNow() || e.net || e.downed || e.sqFinal || !e.entry || !sqStanding(e.team, e)) return false;
  e.downed = true; e.bleed = SQ_BLEED; e.hp = 100; e.tgt = null; e.goal = null; e.revBy = null;
  try { if (e.veh) vhBotExit(e); } catch (er) {}
  e.group.rotation.x = -1.25;   // lying down
  return true;
}
function sqPlayerUp() { try { brsqPuff(P.x, P.y + 1, P.z, 7); tone(320, 0.05, 0.04, 'sine', 700); } catch (e) {} G.downed = false; G.bleed = 0; G.health = 40; try { showBanner('BACK ON YOUR FEET', 'your squad picked you up'); sfx.ui(); } catch (e) {} }
function sqBotUp(e, by) { try { brsqPuff(e.group.position.x, e.group.position.y + 1, e.group.position.z, 7); e.carried = false; if (BRSQ.carry === e) BRSQ.carry = null; } catch (er) {} e.downed = false; e.bleed = 0; e.hp = 40; e.group.rotation.x = 0; e.revT = 0; if (by === 'player') try { achAdd('revives'); popScore('+50', '', 'REVIVE'); M.me.score += 50; } catch (er) {} }
/* ---------- every frame (from brUpdate) */
function sqUpdate(dt) {
  if (!sqOn()) return;
  // me, downed: bleed out, or get picked up by a bot standing next to me
  if (G.downed) {
    if (!playerAlive()) G.downed = false;
    else {
      G.bleed -= dt; const allDown = !sqStanding(M.myTeam, 'player');
      if (G.bleed <= 0 || allDown) { G.downed = false; G.health = 0; G.killer = G.killer || 'cloud'; try { die(); } catch (e) {} }
      else { const helper = enemies.find(e => e.team === M.myTeam && !e.downed && e.entry && e.entry.alive !== false && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 1.8);
        if (helper) { helper.revT = (helper.revT || 0) + dt; if (helper.revT >= SQ_REVIVE) { helper.revT = 0; sqPlayerUp(); } } }
      try { G.interactTxt = `DOWNED · ${Math.ceil(Math.max(0, G.bleed))} s · ${allDown ? 'NO ONE LEFT TO HELP' : 'WAIT FOR A SQUADMATE'}`; showMsg(G.interactTxt); } catch (e) {}
    }
  }
  // downed bots: bleed out (or all at once when their squad is wiped)
  for (const e of enemies.slice()) {
    if (!e.downed || e.net) continue;   // other players' downs (and the host's bots, online) are theirs to run
    e.bleed -= dt;
    if (e.bleed <= 0 || !sqStanding(e.team, e)) { e.downed = false; e.sqFinal = true; e.hp = 1; e.spawnProt = 0; const lb = e.entry && e.entry.lastBy; try { damageEnemy(e, 999, false, null, false, lb === 'player' || (lb && enemies.includes(lb)) ? lb : 'world'); } catch (er) {} continue; }
  }
  // me, reviving a downed bot squadmate: hold USE next to it
  const u = kb('use') || pad.use; let near = null;
  if (playerAlive() && !G.downed) for (const e of enemies) if (e.downed && e.team === M.myTeam && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 1.8) { near = e; break; }
  if (near) {
    if (u) { SQ.revT += dt; SQ.revWho = near; if (SQ.revT >= SQ_REVIVE) { SQ.revT = 0; if (near.net) { SQ.rvOut = [near.net, 1, ++SQ.rvSeq]; SQ.rvT = NOW + 2.5; try { popScore('+50', '', 'REVIVE'); M.me.score += 50; } catch (er) {} } else sqBotUp(near, 'player'); } }
    else SQ.revT = 0;
    try { G.interactTxt = u ? `REVIVING ${near.entry.name} · ${Math.round(SQ.revT / SQ_REVIVE * 100)}%` : `${near.entry.name} IS DOWN · HOLD ${actName('use')} TO REVIVE`; showMsg(G.interactTxt); } catch (e) {}
  } else SQ.revT = 0;
  if (SQ.rvOut && NOW > SQ.rvT) SQ.rvOut = null;
  // online host: my bots pick up downed players of their squad
  if (M.online && typeof netHostNow === 'function' && netHostNow()) for (const e of enemies) {
    if (!e.net || !e.downed) continue;
    const helper = enemies.find(o => !o.net && !o.downed && o.team === e.team && o.entry && o.entry.alive !== false && Math.hypot(o.group.position.x - e.group.position.x, o.group.position.z - e.group.position.z) < 1.8);
    if (!helper) { e.revT = 0; continue; } e.revT = (e.revT || 0) + dt;
    if (e.revT >= SQ_REVIVE) { e.revT = 0; SQ.rbSeq++; SQ.rbOut = [SQ.rbSeq, e.net]; SQ.rbT = NOW + 3; }
  }
  if (SQ.rbOut && NOW > SQ.rbT) SQ.rbOut = null;
}
/* ---------- online: downs and revives travel in presence (dn: I'm down, rv: I revived someone, rb: the host's bots revived someone) */
function sqNetPres() { if (!sqOn()) return {}; return { dn: G.downed ? 1 : 0, rv: SQ.rvOut || undefined, rb: SQ.rbOut || undefined }; }
function sqNetApply(R, pr) {
  if (!sqOn() || !R) return;
  const e = R.bot; if (e) { const dn = !!pr.dn; if (dn !== !!e.downed) { e.downed = dn; e.group.rotation.x = dn ? -1.25 : 0; } }
  const seen = R.sqSeen || (R.sqSeen = { rv: 0, rb: 0 });
  if (Array.isArray(pr.rv) && (pr.rv[2] | 0) > seen.rv) { seen.rv = pr.rv[2] | 0; const t = String(pr.rv[0]);
    if (t === String(NET.me) && G.downed) sqPlayerUp();
    else if (netHostNow()) { const b = enemies.find(o => !o.net && o.downed && o.entry && o.entry.botLabel === t); if (b) sqBotUp(b, null); } }
  if (pr.ho && Array.isArray(pr.rb) && (pr.rb[0] | 0) > seen.rb) { seen.rb = pr.rb[0] | 0; if (pr.rb.slice(1).map(String).includes(String(NET.me)) && G.downed) sqPlayerUp(); }
}
// online: my squad (the squad with the most free spots, or a party member's squad), picked once when the room answers
function sqNetPick(peers, inRoom) {
  const n = Math.floor(16 / M.squad), c = new Array(n).fill(0);
  for (const p of peers) if (!p.sameTab && p.presence && inRoom(p.presence) && !p.presence.bot) { const t = p.presence.tm | 0; if (t >= 0 && t < n) c[t]++; }
  try { const names = new Set(partyMembers().filter(m => !m.me).map(m => m.name)); const mate = peers.find(p => !p.sameTab && p.presence && inRoom(p.presence) && !p.presence.bot && names.has(cleanNick(p.presence.n))); if (mate && c[mate.presence.tm | 0] < M.squad) return mate.presence.tm | 0; } catch (e) {}
  let best = 0; for (let t = 1; t < n; t++) if (c[t] < c[best]) best = t; return best;
}
// online host: which squad the next bot joins (the one with the most room), or -1 when every squad is full
function sqNetBotTeam() {
  const n = Math.floor(16 / M.squad), c = new Array(n).fill(0); c[M.myTeam]++;
  for (const en of M.entries) if (!en.isPlayer && en.team >= 0 && en.team < n) c[en.team]++;
  let best = -1; for (let t = 0; t < n; t++) if (c[t] < M.squad && (best < 0 || c[t] < c[best])) best = t; return best;
}
// in the bots' loop: true while this bot is downed (it crawls toward a squadmate, no shooting)
function sqBotDowned(e, dt) {
  if (!e.downed) return false;
  if (e.carried) return true;   // on my shoulder (brsquad.js)
  const g = e.group.position; let tx = null, tz = null, bd = 1e9;
  if (e.team === M.myTeam && playerAlive() && !G.downed) { tx = P.x; tz = P.z; bd = Math.hypot(P.x - g.x, P.z - g.z); }
  for (const o of enemies) if (o !== e && o.team === e.team && !o.downed && o.entry && o.entry.alive !== false) { const d = Math.hypot(o.group.position.x - g.x, o.group.position.z - g.z); if (d < bd) { bd = d; tx = o.group.position.x; tz = o.group.position.z; } }
  if (tx !== null && bd > 1.4) { const l = bd || 1; g.x += (tx - g.x) / l * 0.9 * dt; g.z += (tz - g.z) / l * 0.9 * dt; resolve(g, 0.45, g.y); e.group.rotation.y = Math.atan2(tx - g.x, tz - g.z); }
  e.group.rotation.x = -1.25; e.moveSp = 0; e.aim = 0;
  return true;
}
// bots' goal (from brGoal): a downed squadmate (or me) close by comes first, when not in a fight
function sqBotGoal(e, set) {
  if (!sqOn() || e.downed || e.tgt) return null;
  const g = e.group.position; let best = null, bd = 45;
  if (e.team === M.myTeam && G.downed && playerAlive()) { const d = Math.hypot(P.x - g.x, P.z - g.z); if (d < bd) { bd = d; best = { x: P.x, z: P.z, y: P.y }; } }
  for (const o of enemies) if (o !== e && o.downed && o.team === e.team) { const d = Math.hypot(o.group.position.x - g.x, o.group.position.z - g.z); if (d < bd) { bd = d; best = { x: o.group.position.x, z: o.group.position.z, y: 0 }; } }
  if (!best) return null;
  if (bd < 1.6) {   // there: revive (a bot squadmate; me is handled in sqUpdate)
    for (const o of enemies) if (o !== e && o.downed && o.team === e.team && Math.hypot(o.group.position.x - g.x, o.group.position.z - g.z) < 1.8) { o.revT = (o.revT || 0) + 0.45; if (o.revT >= SQ_REVIVE) sqBotUp(o, e); break; }
  }
  return set(best, 0.3);
}
// the first frame: each squad lands together (round its first member, or round me for mine)
function sqGroup() {
  if (M.online) { const mate = enemies.find(e => e.team === M.myTeam && e.entry && e.entry.alive !== false && (!netHostNow() || e.net)); if (mate && !netHostNow()) { const o = openNear(mate.group.position.x + 2, mate.group.position.z + 2); P.x = o.x; P.z = o.z; return; } }
  const lead = {}; lead[M.myTeam] = { x: P.x, z: P.z };
  for (const e of enemies) { if (!e.entry || e.team === undefined) continue; const L = lead[e.team]; if (!L) { lead[e.team] = { x: e.group.position.x, z: e.group.position.z }; continue; }
    const a = Math.random() * TAU, o = openNear(L.x + Math.cos(a) * 3, L.z + Math.sin(a) * 3); e.group.position.set(o.x, groundAt(o.x, o.z, 1), o.z); }
}
/* ---------- teams, the end, the HUD */
function sqTeamsLeft() { const t = new Set(); if (playerAlive()) t.add(M.myTeam); for (const e of brAliveBots()) t.add(e.team); return t; }
function sqHud() { if (!sqOn()) return ''; const t = sqTeamsLeft(); return ` · <b>${t.size}</b> ${M.squad === 2 ? 'DUOS' : 'SQUADS'} LEFT`; }
const SQ_NAMES = { 1: 'SOLO', 2: 'DUOS', 4: 'SQUADS' };
// the LAST TOKE tile on the menu: SOLO / DUOS / SQUADS
function sqPicker() {
  onbCard(`<small>LAST TOKE · BATTLE ROYALE · VS BOTS</small><b>PICK YOUR SQUAD</b><p>Sixteen players on STASH ISLAND. In duos and squads you get knocked down instead of killed while a squadmate is standing, and they can pick you back up.</p>
<div class="onb-tiles"><button class="onb-t" data-onb="s1"><b>SOLO</b><span>every one for themselves</span></button><button class="onb-t" data-onb="s2"><b>DUOS</b><span>you and a bot · 8 teams of 2</span></button><button class="onb-t" data-onb="s4"><b>SQUADS</b><span>you and 3 bots · 4 teams of 4</span></button></div>`,
    { s1: () => startMatch('br', { map: 'random' }), s2: () => startMatch('br', { map: 'random', squad: 2 }), s4: () => startMatch('br', { map: 'random', squad: 4 }) });
}
