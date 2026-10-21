/* ================================================================== bot roles: bots play like a team of real players
   Every bot gets a job and a lane when it spawns, so a team spreads out over the map instead of running one line:
     entry     - first in: pushes hard and fast down the middle, takes fights up close
     support   - follows an entry or anchor a few metres back and trades their fights, throws the grenades
     anchor    - plays the objective (holds the hardpoint / site / flag); in TDM holds a strong spot on its half
     overwatch - goes to a power position (the map's high ground), crouches and holds long angles
     lurk      - waits a moment, then takes an outer lane alone, sets up an ambush and pushes behind the enemy
     slayer    - cares about kills more than the objective: roams where the fights are
   Bots only act on what they could know (what they saw, heard or were told) - no wall-hacks. In S&D the attackers
   gather, then hit the site together while a lurker cuts the rotation; defenders split over both sites.
   Free-for-all and gun game bots get a personality instead: rusher, camper, flanker or roamer. */
const JOB_ORDER = ['entry', 'anchor', 'support', 'overwatch', 'lurk', 'slayer', 'support', 'entry'];
const JOB = {
  entry: { obj: 0.65, pace: 1.12, hold: [6, 11], careful: 0.95 },
  support: { obj: 0.7, pace: 1.0, hold: [12, 20], careful: 0.8 },
  anchor: { obj: 0.95, pace: 0.95, hold: [14, 24], careful: 0.75 },
  overwatch: { obj: 0.45, pace: 1.0, hold: [34, 55], careful: 0.8 },
  lurk: { obj: 0.4, pace: 1.0, hold: [10, 18], careful: 0.7 },
  slayer: { obj: 0.12, pace: 1.08, hold: [8, 14], careful: 0.9 },
};
const FFA_PERS = ['rusher', 'camper', 'flanker', 'roamer'];
const FFA_JOB = { rusher: 'slayer', camper: 'overwatch', flanker: 'lurk', roamer: 'entry' };

function nearestPt(x, z, maxY = 99) { let best = null, bd = 1e9; for (const s of buildSpawns()) { if ((s.y || 0) > maxY) continue; const d = (s.x - x) * (s.x - x) + (s.z - z) * (s.z - z); if (d < bd) { bd = d; best = s; } } return best ? { x: best.x, z: best.z, y: best.y || 0 } : { x, z, y: 0 }; }
// high ground on this map: navPts and hardpoints that sit up off the floor
function powerSpots() { const m = MAPS[curMap] || {}, out = []; for (const p of (m.navPts || []).concat(LAYOUT.hp || [])) if ((p.y || 0) >= 1.1) out.push(p); return out; }

function botRoleInit(e, pos) {
  const en = e.entry, teams = M.def.teams;
  if (!teams) { if (!en.pers) en.pers = FFA_PERS[(Math.random() * FFA_PERS.length) | 0]; e.pers = en.pers; e.job = FFA_JOB[en.pers]; }
  else {
    if (!en.job) { const mates = M.entries.filter(o => o !== en && o.team === en.team && o.job); en.job = JOB_ORDER[mates.length % JOB_ORDER.length]; }
    e.job = en.job;
  }
  const J = JOB[e.job] || JOB.entry;
  e.objFocus = clamp(J.obj + rnd(-0.1, 0.1), 0, 1);
  e.hold = rnd(J.hold[0], J.hold[1]);
  e.home = { x: pos.x, z: pos.z };
  // lanes: spread a team over left / middle / right; lurkers and slayers take the outsides
  const used = [0, 0, 0]; for (const o of enemies) if (o !== e && o.team === e.team && o.lane !== undefined) used[o.lane + 1]++;
  let lane;
  if (!teams) lane = [-1, 0, 1][(Math.random() * 3) | 0];
  else if (e.job === 'entry' || e.job === 'anchor') lane = used[1] <= Math.min(used[0], used[2]) ? 0 : used[0] <= used[2] ? -1 : 1;
  else if (e.job === 'lurk' || e.job === 'slayer') lane = used[0] < used[2] ? -1 : used[2] < used[0] ? 1 : Math.random() < 0.5 ? -1 : 1;
  else { const m = Math.min(...used); const opts = [-1, 0, 1].filter(l => used[l + 1] === m); lane = opts[(Math.random() * opts.length) | 0]; }
  e.lane = lane; e.ri = 0; e.route = e.job === 'lurk' ? [0.3, 0.46, 0.75, 0.9] : e.job === 'overwatch' ? [0.35] : [0.28, 0.5, 0.72, 0.92];
  e.startT = M.t + (e.job === 'lurk' ? rnd(2, 5) : e.job === 'anchor' ? rnd(0, 1) : rnd(0, 0.6));
  e.ambushT = 0; e.spot = null; e.buddy = null; e.watching = false;
  e.role = e.objFocus > 0.6 ? 'obj' : 'hunt';
}
// the line from our side to theirs (FFA: from where we spawned, across the middle)
function botAxis(e) {
  let S, T;
  const side = sideOf(e.team);
  if (M.def.teams && side >= 0) { S = LAYOUT.spawn[side]; T = LAYOUT.spawn[1 - side]; }
  else { S = e.home || e.group.position; const r = Math.hypot(S.x, S.z); T = r > 8 ? { x: -S.x * 0.8, z: -S.z * 0.8 } : { x: Math.cos(e.phase0 || 1) * 24, z: Math.sin(e.phase0 || 1) * 24 }; }
  const dx = T.x - S.x, dz = T.z - S.z, L = Math.hypot(dx, dz) || 1, fx = dx / L, fz = dz / L;
  const half = Math.abs(fx) > Math.abs(fz) ? (PLAYRECT[3] - PLAYRECT[2]) / 2 : (PLAYRECT[1] - PLAYRECT[0]) / 2;
  return { S, T, L, fx, fz, lx: -fz, lz: fx, off: half * 0.74 };
}
function lanePoint(e, frac, lane = e.lane, jit = 2.5) {
  const a = botAxis(e), x = a.S.x + a.fx * a.L * frac + a.lx * lane * a.off + rnd(-jit, jit), z = a.S.z + a.fz * a.L * frac + a.lz * lane * a.off + rnd(-jit, jit);
  const g = nearestPt(x, z); if (Math.hypot(g.x - x, g.z - z) < 4) return g;
  // no ground spot there (a ridge, a roof route): any floor level at that spot we can actually walk to
  const f = flowField(e.group.position.x, e.group.position.z, e.group.position.y);   // one search from where we stand (cached), not one per candidate
  if (f) for (let r = 0; r <= 3; r++) for (let k = 0; k < 8; k++) {
    const cx = cellOf(x + Math.cos(k * 0.785) * r * 1.5), cz = cellOf(z + Math.sin(k * 0.785) * r * 1.5), c = cz * NN + cx;
    for (let l = lvN[c] - 1; l >= 0; l--) { if (lvS[c * NL + l]) continue; if (f[c * NL + l] >= 0) return { x: cellPos(cx), z: cellPos(cz), y: lvH[c * NL + l] }; }
  }
  return g;
}
const atPt = (e, p, r = 3) => p && Math.hypot(p.x - e.group.position.x, p.z - e.group.position.z) < r && Math.abs((p.y || 0) - e.group.position.y) < 1.2;
function faceEnemySide(e) { const a = botAxis(e); e.lookYaw = Math.atan2(a.fx, a.fz) + rnd(-0.7, 0.7); }

// walk this bot's own lane route; returns a goal
function botRoute(e, set) {
  if (e.ri >= e.route.length) { e.lane = e.job === 'entry' || e.job === 'slayer' ? [-1, 0, 1][(Math.random() * 3) | 0] : e.lane; e.ri = 0; e.route = e.route.slice().reverse().map(f => Math.max(0.25, f)); }
  if (!e.goal || atPt(e, e.goal, 3.2) || M.t > e.goalT) {
    const f = e.route[e.ri]; const g = lanePoint(e, f);
    if (atPt(e, e.goal, 3.2)) e.ri++;
    return set(g, rnd(5, 9));
  }
  return e.goal;
}
// a power position for overwatch (the one closest to our own half, so they get there first)
function botOverwatch(e, set, near) {
  if (!M.def.teams && e.spot && M.t > (e.spotT || 1e9)) e.spot = null;   // FFA campers move on after a while
  if (!e.spot) {
    e.spotT = M.t + rnd(20, 35);
    const a = botAxis(e), spots = powerSpots().filter(p => ((p.x - a.S.x) * a.fx + (p.z - a.S.z) * a.fz) / a.L < 0.62);
    const taken = new Set(enemies.filter(o => o !== e && o.team === e.team && o.spot).map(o => o.spot));
    const free = spots.filter(p => !taken.has(p));
    e.spot = free.length ? free[(Math.random() * free.length) | 0] : lanePoint(e, 0.38, e.lane, 1.5);
  }
  if (atPt(e, e.spot, 2.2)) { e.watching = true; if (!e.tgt && Math.random() < 0.15) faceEnemySide(e); e.crouchy = true; return set(e.goal && atPt(e, e.goal, 2.5) ? e.goal : near(e.spot, 0.6), rnd(8, 16)); }
  e.watching = false; return set({ x: e.spot.x, z: e.spot.z, y: e.spot.y || 0 }, 6);
}
// stay a few metres behind a teammate and trade their fights
function botSupport(e, set) {
  if (!e.buddy || !enemies.includes(e.buddy)) { let best = null, bd = 1e9; for (const o of enemies) { if (o === e || o.team !== e.team || !o.job || o.job === 'support' || o.job === 'overwatch') continue; const d = Math.hypot(o.group.position.x - e.group.position.x, o.group.position.z - e.group.position.z); if (d < bd) { bd = d; best = o; } } e.buddy = best; }
  const b = e.buddy; if (!b) return null;
  if (b.lkp && M.t - b.lkpT < 4) return set({ x: b.lkp.x + rnd(-2, 2), z: b.lkp.z + rnd(-2, 2), y: b.lkp.y || 0 }, 2);   // trade
  const a = botAxis(e), bp = b.group.position;
  return set(nearestPt(bp.x - a.fx * 4.5 + rnd(-2, 2), bp.z - a.fz * 4.5 + rnd(-2, 2), bp.y + 0.5), 1.2);
}
// lurk: outer lane, wait in ambush half way, then go behind them
function botLurk(e, set, near) {
  if (M.t < e.startT) return set(near(e.home, 1), 0.6);
  if (e.ri === 1 && atPt(e, e.goal, 3.2) && !e.ambushT) { e.ambushT = M.t + rnd(6, 12); e.crouchy = true; faceEnemySide(e); }
  if (e.ambushT && M.t < e.ambushT) { e.watching = true; return set(e.goal, 1); }
  if (e.ambushT && M.t >= e.ambushT) { e.ambushT = 0; e.watching = false; e.ri = 2; }
  return botRoute(e, set);
}

function botRoleGoal(e, cands, keep, near, set) {
  const ex = e.group.position.x, ez = e.group.position.z, job = e.job;
  e.watching = false;
  // footsteps: someone moving close by is heard (further in free-for-all, where everyone is a target)
  if ((!e.lkp || M.t - e.lkpT > 3) && cands.length && !e.tgt) { const [c, d] = cands[0], R = M.def.teams ? 14 : 26; if (d < R && Math.random() < 0.45 + e.iq * 0.35) { const p = tpos(c); e.lkp = { x: p.x + rnd(-2.5, 2.5), z: p.z + rnd(-2.5, 2.5), y: p.y || 0 }; e.lkpT = M.t; } }
  // react to what we know first: entries and slayers chase it, others check it out or hold
  const knows = e.lkp && M.t - e.lkpT < 6 && !e.tgt;
  const chase = knows && (job === 'entry' || job === 'slayer' || (job !== 'overwatch' && Math.hypot(e.lkp.x - ex, e.lkp.z - ez) < 16 + e.iq * 10));
  // ---- objective modes
  if (M.mode === 'snd' && M.snd) { const g = botSndGoal(e, set, near, chase); if (g) return g; }
  if (M.mode === 'ctf' && M.ctf) {
    const mine = M.ctf.flags[e.team], theirs = M.ctf.flags[1 - e.team];
    if (theirs.carrier === e || mine.state !== 'home') return null;   // the carrier runs home, everyone chases a stolen flag
    if (job === 'anchor') return keep && Math.hypot(e.goal.x - mine.home.x, e.goal.z - mine.home.z) < 9 ? e.goal : set(near(mine.home, 6), rnd(5, 9));
    if (job === 'support' && theirs.state === 'carried' && theirs.carrier && theirs.carrier !== 'player') return set(near(tpos(theirs.carrier), 3), 1);
    if ((job === 'entry' || job === 'lurk') && Math.random() < e.objFocus) { if (job === 'lurk' && M.t < e.startT) return set(near(e.home, 1), 0.6); return set(theirs.state === 'carried' ? near(tpos(theirs.carrier), 3) : theirs, 2); }
  }
  if (M.mode === 'hp' && M.hp && !M.hp.wait) {
    const z = LAYOUT.hp[M.hp.idx], dz = Math.hypot(z.x - ex, z.z - ez);
    if (job === 'anchor' || (job !== 'slayer' && job !== 'overwatch' && Math.random() < e.objFocus) || (dz < 14 && job !== 'overwatch')) {
      e.role = 'obj'; return keep && Math.hypot(e.goal.x - z.x, e.goal.z - z.z) < 5 ? e.goal : set(near(z, job === 'anchor' ? 2.5 : 4), 2.5);
    }
    e.role = 'hunt';
    if (job === 'overwatch') { const spots = powerSpots().filter(p => Math.hypot(p.x - z.x, p.z - z.z) < 32 && p !== z); if (spots.length && (!e.spot || Math.hypot(e.spot.x - z.x, e.spot.z - z.z) > 32)) e.spot = spots[(Math.random() * spots.length) | 0]; }
  }
  // ---- fighting by job (TDM, FFA, gun game, and the off-objective players of the other modes)
  if (chase) { if (job === 'lurk' && M.t > e.flankT && Math.random() < 0.6) { e.flankT = M.t + 8; const f = botFlank(e, e.lkp); if (f) return set(f, rnd(3, 5)); } return set(near(e.lkp, 1.5), 2.5); }
  if (job === 'overwatch') return botOverwatch(e, set, near);
  if (job === 'support') { const g = botSupport(e, set); if (g) return g; }
  if (job === 'lurk') return botLurk(e, set, near);
  if (job === 'anchor' && M.def.teams && M.mode === 'tdm') {   // TDM anchor: hold a strong spot on our half, move up now and then
    if (!e.spot || M.t > (e.spotT || 0)) { e.spotT = M.t + rnd(18, 30); const s = powerSpots(); e.spot = s.length && Math.random() < 0.5 ? s[(Math.random() * s.length) | 0] : lanePoint(e, rnd(0.35, 0.5), e.lane, 2); }
    if (atPt(e, e.spot, 2.5)) { e.watching = true; if (Math.random() < 0.12) faceEnemySide(e); return set(e.goal, rnd(4, 8)); }
    return set({ x: e.spot.x, z: e.spot.z, y: e.spot.y || 0 }, 5);
  }
  if (job === 'slayer' && Math.random() < 0.5) { try { const h = brainHotSpot(); if (h && !keep) return set(near(h, 4), rnd(5, 8)); } catch (err) {} }
  if (M.t < e.startT) return set(near(e.home, 1), 0.6);
  return botRoute(e, set);
}

// S&D: a plan per round
function botSndGoal(e, set, near, chase) {
  const sn = M.snd, job = e.job, att = e.team === sn.att, site = LAYOUT.sites[sn.site], other = LAYOUT.sites[1 - sn.site];
  if (!sn.plan || sn.plan.round !== sn.round) sn.plan = { round: sn.round, execT: M.t + rnd(10, 18), go: false };
  const pl = sn.plan, ex = e.group.position.x, ez = e.group.position.z;
  if (sn.bomb) {   // after the plant
    if (att) { if (chase && job !== 'anchor') return set(near(e.lkp, 1.5), 2); return e.goal && Math.hypot(e.goal.x - sn.bomb.x, e.goal.z - sn.bomb.z) < 11 && M.t < e.goalT ? e.goal : set(nearestPt(sn.bomb.x + rnd(-9, 9), sn.bomb.z + rnd(-9, 9), 3), rnd(4, 7)); }
    // defenders: retake together - wait for a teammate near the bomb before going in, unless time is short
    const d = Math.hypot(sn.bomb.x - ex, sn.bomb.z - ez);
    if (sn.bomb.t > 14 && d < 14 && d > 6) { let mates = 0; for (const o of enemies) if (o !== e && o.team === e.team && Math.hypot(o.group.position.x - sn.bomb.x, o.group.position.z - sn.bomb.z) < 14) mates++; if (!mates && Math.random() < 0.7) return set(e.goal || near(sn.bomb, 9), 1); }
    return set(sn.bomb, 1);
  }
  if (att) {
    if (job === 'slayer' && sn.t > 30) { e.role = 'hunt'; return null; }   // wants picks first
    if (job === 'lurk') { e.role = 'hunt'; if (!pl.go) return set(e.goal && M.t < e.goalT ? e.goal : nearestPt(other.x + rnd(-8, 8), other.z + rnd(-8, 8)), rnd(5, 8)); return set(near(site, 6), 2); }
    if (job === 'overwatch') { e.role = 'hunt'; return pl.go ? set(near(site, 9), 3) : null; }
    // the stack: gather at a staging point on the way to the site, then hit it together
    const a = botAxis(e), stage = pl.stage || (pl.stage = nearestPt(a.S.x + (site.x - a.S.x) * 0.62, a.S.z + (site.z - a.S.z) * 0.62));
    if (!pl.go) { let n = 0, tot = 0; for (const o of enemies) if (o.team === e.team && (o.job === 'entry' || o.job === 'support' || o.job === 'anchor')) { tot++; if (Math.hypot(o.group.position.x - stage.x, o.group.position.z - stage.z) < 7) n++; } if (M.t > pl.execT || (tot && n >= Math.min(tot, 3)) || sn.t < 45) { pl.go = true; for (const o of enemies) o.goalT = 0; } }
    if (!pl.go) { e.role = 'hunt'; return atPt(e, e.goal, 3) && M.t < e.goalT ? e.goal : set(nearestPt(stage.x + rnd(-3, 3), stage.z + rnd(-3, 3)), rnd(3, 6)); }
    e.role = 'obj'; return set(job === 'support' ? near(site, 4) : site, 2);
  }
  // defenders: split the sites; overwatch holds high ground, slayer and lurk play forward for picks
  if (job === 'overwatch') return null;
  if (job === 'slayer' || (job === 'lurk' && sn.t > 60)) { e.role = 'hunt'; return chase ? null : set(e.goal && M.t < e.goalT ? e.goal : lanePoint(e, rnd(0.4, 0.55), e.lane, 3), rnd(6, 10)); }
  const myIdx = ['anchor', 'entry', 'lurk'].includes(job) ? 0 : 1, s2 = LAYOUT.sites[(myIdx + sn.round) % 2];
  if (chase && Math.hypot(e.lkp.x - s2.x, e.lkp.z - s2.z) < 20) return set(near(e.lkp, 2), 2);
  e.role = 'hunt';
  if (atPt(e, e.goal, 2.5) && M.t < e.goalT) { e.watching = true; return e.goal; }
  return set(nearestPt(s2.x + rnd(-7, 7), s2.z + rnd(-7, 7), 3), rnd(6, 12));
}
// walking pace: entries sprint about, others slow down near danger to check corners, watchers stay put
function botPace(e, tp) {
  const J = JOB[e.job]; if (!J || tp) return 1;
  let k = J.pace;
  if (e.lkp && M.t - e.lkpT < 8) k *= J.careful;
  if (e.job === 'lurk' && e.ri >= 1) k *= 0.82;
  return k;
}
