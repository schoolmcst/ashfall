/* ================================================================== bot brain: bots learn from every gunfight
   Saved on this computer (and in the save backup), so the bots keep getting smarter from match to match.
   What they learn:
   - TACTICS: every fight a bot picks a tactic (rush, hold, flank, heal early, grenade). Winning the fight makes that
     tactic more likely next time, losing makes it less likely - per map, so they learn what works where.
   - YOUR RANGE: how far away real players usually get their kills. Bots then fight you at the range you're worst at.
   - HOT ZONES: where real players fight and where bots keep dying. Bots patrol and pre-aim the hot zones and route
     around the spots where they die.
   - EXPERIENCE: every fight adds experience; each level gives a little more aim, reaction speed and smarts (capped). */
const BRAIN_KEY = 'ashfall.botbrain.v1', BRAIN_TACS = ['rush', 'hold', 'flank', 'heal', 'nade'], BRAIN_CELL = 8;
let BRAIN = null, BRAIN_DIRTY = false, BRAIN_MATCH0 = 0;
function brainBlank() { return { v: 1, fights: 0, wins: 0, killDist: 18, kdN: 0, maps: {} }; }
try { BRAIN = JSON.parse(localStorage.getItem(BRAIN_KEY) || 'null'); } catch (e) { BRAIN = null; }
if (!BRAIN || BRAIN.v !== 1) BRAIN = brainBlank();
function brainSave() { if (!BRAIN_DIRTY) return; BRAIN_DIRTY = false; try { localStorage.setItem(BRAIN_KEY, JSON.stringify(BRAIN)); } catch (e) {} }
setInterval(brainSave, 15000);
function brainReset() { BRAIN = brainBlank(); BRAIN_DIRTY = true; brainSave(); }
function brainMap() {
  const m = BRAIN.maps[curMap] || (BRAIN.maps[curMap] = { tac: {}, heat: {}, die: {} });
  for (const t of BRAIN_TACS) if (!(m.tac[t] > 0)) m.tac[t] = 1;
  return m;
}
const brainCell = (x, z) => Math.floor(x / BRAIN_CELL) + ',' + Math.floor(z / BRAIN_CELL);
// experience level 0-10 from the number of fights (slows down as it climbs)
const brainLevel = () => Math.min(10, Math.floor(Math.sqrt(BRAIN.fights / 6)));
function brainSummary() {
  const lv = brainLevel(), m = BRAIN.maps[curMap], best = m ? BRAIN_TACS.slice().sort((a, b) => m.tac[b] - m.tac[a])[0] : null;
  return `LEVEL ${lv} · ${Math.floor(BRAIN.fights)} FIGHTS LEARNED${best ? ` · FAVOURITE HERE: ${best.toUpperCase()}` : ''}`;
}
// skill bonus from experience, applied when a bot spawns
function brainBoost(e) {
  const lv = brainLevel();
  e.acc = Math.min(0.8, e.acc + lv * 0.008); e.iq = Math.min(1, (e.iq || 0.5) + lv * 0.03); e.aimRate += lv * 0.45; e.hs = Math.min(0.35, (e.hs || 0.12) + lv * 0.006);
  e.brainLv = lv;
  // how human the bot plays: grows with experience (reaction, aim settling, checking corners, peeking)
  e.hum = Math.min(1, 0.35 + lv * 0.065 + (e.iq || 0.5) * 0.15);
}
// pick this fight's tactic: mostly the ones that have worked on this map, sometimes something new to keep learning
function brainPickTactic(e) {
  const m = brainMap();
  if (Math.random() > 0.25 + (e.iq || 0.5) * 0.65) return BRAIN_TACS[(Math.random() * BRAIN_TACS.length) | 0];
  let sum = 0; for (const t of BRAIN_TACS) sum += m.tac[t];
  let r = Math.random() * sum; for (const t of BRAIN_TACS) { r -= m.tac[t]; if (r <= 0) return t; }
  return 'hold';
}
const brainHuman = t => t === 'P' || !!(t && t.net && t.entry && !t.entry.botLabel);
// a bot starts fighting someone
function brainEngage(e, t) {
  if (!inMatch() || !e.entry || e.net) return;
  if (e.fightWith === t && M.t - (e.fightT || -9) < 8) return;
  e.fightWith = t; e.fightT = M.t; e.tac = brainPickTactic(e);
  const vsHuman = brainHuman(t), kd = BRAIN.killDist;
  // fight real players at the range they're weakest at
  if (vsHuman && BRAIN.kdN >= 5) e.hold = kd < 14 ? rnd(20, 28) : kd > 30 ? rnd(6, 10) : rnd(12, 18);
  else e.hold = rnd(9, 20);
  if (e.tac === 'rush') e.hold = rnd(4, 8);
  else if (e.tac === 'hold') e.hold = Math.max(e.hold, rnd(18, 26));
  else if (e.tac === 'nade') e.nadeT = Math.min(e.nadeT, M.t + 1);
  else if (e.tac === 'flank') { const f = botFlank(e, tpos(t)); if (f) { e.goal = f; e.goalT = M.t + rnd(3, 5); e.hold = rnd(4, 7); e.flankT = M.t + 8; } }
}
// a fight ended: reward or punish the tactic the bot used (bot vs bot fights count for less)
function brainResult(e, won, vsHuman) {
  if (!e || !e.tac || !inMatch()) return;
  const m = brainMap(), w = vsHuman ? 1 : 0.35, lr = 0.18 * w;
  m.tac[e.tac] = clamp(m.tac[e.tac] * (won ? 1 + lr : 1 - lr), 0.25, 8);
  BRAIN.fights += vsHuman ? 1 : 0.34; if (won) BRAIN.wins += w;
  e.tac = null; e.fightWith = null; BRAIN_DIRTY = true;
}
// where things happen: real players' positions in their fights, and where bots die
function brainHeat(x, z, n) { const m = brainMap(), k = brainCell(x, z); m.heat[k] = Math.min(999, (m.heat[k] || 0) + n); BRAIN_DIRTY = true; }
function brainDie(x, z) { const m = brainMap(), k = brainCell(x, z); m.die[k] = Math.min(999, (m.die[k] || 0) + 1); BRAIN_DIRTY = true; }
function brainKillDist(d) { BRAIN.killDist = BRAIN.killDist * 0.9 + d * 0.1; BRAIN.kdN++; BRAIN_DIRTY = true; }
// the hottest spot on this map (where players fight most) as a real floor point, or null
function brainHotSpot() {
  const m = brainMap(); let best = null, bn = 3;
  for (const k in m.heat) if (m.heat[k] > bn) { bn = m.heat[k]; best = k; }
  if (!best) return null;
  const [cx, cz] = best.split(',').map(Number), x = (cx + 0.5) * BRAIN_CELL, z = (cz + 0.5) * BRAIN_CELL;
  let sp = null, bd = 1e9; for (const s of buildSpawns()) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; sp = s; } }
  return sp && bd < BRAIN_CELL * 1.5 ? { x: sp.x, z: sp.z, y: sp.y || 0 } : null;
}
const brainDanger = (x, z) => { const m = brainMap(); return m.die[brainCell(x, z)] || 0; };

/* ---------- hooks from the match code */
// a bot died: whoever it was fighting won; learn where it died and how far the player was
function brainBotKilled(e, by) {
  if (!inMatch() || !e.entry) return;
  const p = e.group.position; brainDie(p.x, p.z);
  const human = by === 'player' || !!(by && by.net && !(by.entry && by.entry.botLabel));
  if (human) {
    const hp = by === 'player' ? P : (by.group ? by.group.position : null);
    if (hp) { brainHeat(hp.x, hp.z, 1); brainKillDist(Math.hypot(hp.x - p.x, hp.z - p.z)); }
  }
  brainResult(e, false, human);
  if (by && by.entry && by.group && !by.net) brainResult(by, true, false);
}
// a bot killed a real player (me, or another player online)
function brainHumanKilled(bot, x, z) {
  if (!bot || !bot.entry) return;
  brainHeat(x, z, 1); brainResult(bot, true, true);
}
// match over: save, and tell the player how much the bots learned
function brainMatchEnd() {
  const gained = Math.round(BRAIN.fights - BRAIN_MATCH0); BRAIN_MATCH0 = BRAIN.fights; BRAIN_DIRTY = true; brainSave();
  return gained > 0 ? `BOTS LEARNED FROM ${gained} FIGHTS · BOT BRAIN LEVEL ${brainLevel()}` : '';
}
function brainMatchStart() { BRAIN_MATCH0 = BRAIN.fights; }
