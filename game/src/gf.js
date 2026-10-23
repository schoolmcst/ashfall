/* ================================================================== BACK ALLEY (2v2 gunfight)
   Two against two, one life a round, 40 seconds. Everyone gets the SAME random loadout, which changes every two rounds.
   Time out: the team with more health left wins the round (equal: nobody scores). First to 6 rounds.
   Offline with bots; online the host runs the rounds and sends ['g', round, wins0, wins1, state, t, primary, secondary,
   equipment, why]; everyone puts themselves back in when the round number changes. */
const GF = { freeze: 3, live: 40, post: 3.5 };
const GF_EQ = ['frag', 'semtex', 'stun', 'hotbox', 'skunk'];
function gfPickLoadout() {
  const pri = ARMORY.filter(d => CATS[d.cat] && CATS[d.cat].slot === 'primary' && !d.proj && d.cat !== 'la'), sec = ARMORY.filter(d => CATS[d.cat] && CATS[d.cat].slot === 'secondary' && !d.proj && d.cat !== 'la');
  const r = a => a[(Math.random() * a.length) | 0];
  return { p: r(pri).id, s: r(sec).id, e: r(GF_EQ) };
}
function gfSetup() {
  if (M.mode !== 'gf') { M.gf = null; return; }
  M.gf = { round: 0, wins: [0, 0], state: M.online ? 'wait' : 'freeze', t: 0, lo: gfPickLoadout(), why: '' };
}
function gfEquipMe() { const L = M.gf.lo; equipClass({ p: L.p, s: L.s, e: L.e, k: 'none', factory: true }); G.grenades = 1; }
function gfEquipBot(e) { if (e && M.gf) try { botGunProfile(e, M.gf.lo.p); } catch (err) {} }
function gfStartRound() {
  const g = M.gf; g.round++;
  if (g.round > 1 && (g.round - 1) % 2 === 0) g.lo = gfPickLoadout();
  g.state = 'freeze'; g.t = GF.freeze; g.why = '';
  if (!M.online) {
    for (const e of enemies.slice()) scene.remove(e.group); enemies.length = 0;
    for (const d of dying) { scene.remove(d.e.group); if (d.rd && d.rd.gun) scene.remove(d.rd.gun.o); } dying.length = 0;
    for (const n of grenadesInFlight) scene.remove(n.m); grenadesInFlight.length = 0;
    for (const en of M.entries) en.alive = true;
    placeEveryone(); for (const e of enemies) gfEquipBot(e);
  } else {
    for (const en of M.entries) if (en.botLabel) { if (en.bot && enemies.includes(en.bot)) { scene.remove(en.bot.group); enemies.splice(enemies.indexOf(en.bot), 1); } gfEquipBot(spawnBot(en, pickSpawnFor(en.team, sideOf(en.team), true))); }
  }
  gfRespawnMe();
}
function gfRespawnMe() {
  const g = M.gf; if (M.online && !NET.teamSet) return;
  M.me.alive = true; G.state = 'playing'; G.dc = null; G.dcHold = false; $('killcam').classList.add('hide'); hideCenter(); camera.fov = baseFov; camera.updateProjectionMatrix();
  placePlayer(pickSpawnFor(M.myTeam, sideOf(M.myTeam), true)); gfEquipMe(); lockPointer();
  const L = g.lo; showBanner(`ROUND ${g.round}`, `${ARM[L.p].name} · ${ARM[L.s].name} · ${EQUIP[L.e].name}${(g.round - 1) % 2 === 0 ? ' · NEW LOADOUT' : ''}`);
}
const gfAlive = t => aliveCount(t);
function gfHp(t) { let h = t === M.myTeam && M.me.alive ? Math.max(0, G.health) / (G.maxHp || 100) : 0; for (const e of enemies) if (e.team === t) h += Math.max(0, e.hp) / (e.maxHp || 100); return h; }
function gfUpdate(dt) {
  const g = M.gf; if (!g) return;
  if (M.online && !netHostNow()) { netObjApply(); return; }
  if (g.state === 'wait') { if (NET.teamSet && (!NET.priv || NET.priv.started) && !(G.holdT > 0)) gfStartRound(); return; }
  if (g.state === 'freeze') { g.t -= dt; for (const e of enemies) e.cd = Math.max(e.cd, 0.4); if (g.t <= 0) { g.state = 'live'; g.t = GF.live; showMsg('FIGHT'); } return; }
  if (g.state === 'live') {
    g.t -= dt; const a = gfAlive(0), b = gfAlive(1);
    if (!a || !b) return gfEndRound(!a && !b ? -1 : a ? 0 : 1, 'elim');
    if (g.t <= 0) { const ha = gfHp(0), hb = gfHp(1); return gfEndRound(Math.abs(ha - hb) < 0.01 ? -1 : ha > hb ? 0 : 1, 'time'); }
  }
  if (g.state === 'post') { g.t -= dt; if (g.t <= 0) { if (g.wins[0] >= M.cfg.score || g.wins[1] >= M.cfg.score) { if (M.online) { M.teamScore = g.wins.slice(); g.state = 'done'; } else endMatch(g.wins[0] >= M.cfg.score ? 0 : 1); } else gfStartRound(); } }
}
function gfEndRound(w, why) {
  const g = M.gf; if (g.state === 'post') return;
  g.state = 'post'; g.t = GF.post; g.why = why; if (w >= 0) g.wins[w]++; M.teamScore = g.wins.slice();
  gfRoundBanner(w, why);
}
function gfRoundBanner(w, why) {
  const g = M.gf, txt = why === 'time' ? 'TIME · MORE HEALTH LEFT' : 'TEAM ELIMINATED';
  showBanner(w < 0 ? 'ROUND DRAWN' : w === M.myTeam ? 'ROUND WON' : 'ROUND LOST', `${w < 0 && why === 'time' ? 'TIME · EVEN' : txt} · ${g.wins[M.myTeam]} – ${g.wins[1 - M.myTeam]}`); if (w === M.myTeam) try { sfx.streak(); } catch (e) {}
}
function gfPack() { const g = M.gf; return ['g', g.round, g.wins[0], g.wins[1], ['wait', 'freeze', 'live', 'post', 'done'].indexOf(g.state), Math.ceil(g.t), g.lo.p, g.lo.s, g.lo.e, g.why]; }
function gfApply(o) {
  const g = M.gf; if (!g) return;
  const round = o[1] | 0, st = ['wait', 'freeze', 'live', 'post', 'done'][o[4] | 0] || 'wait', old = g.wins.slice();
  if (ARM[o[6]] && ARM[o[7]] && EQUIP[o[8]]) g.lo = { p: o[6], s: o[7], e: o[8] };
  g.wins = [o[2] | 0, o[3] | 0]; M.teamScore = g.wins.slice(); g.t = +o[5] || 0;
  if (round !== g.round) { g.round = round; if (round > 0) gfRespawnMe(); }
  if (st === 'live' && g.state === 'freeze') showMsg('FIGHT');
  if (st === 'post' && g.state !== 'post') { const w = g.wins[0] > old[0] ? 0 : g.wins[1] > old[1] ? 1 : -1; gfRoundBanner(w, o[9] || ''); }
  g.state = st;
}
function gfHud() {
  const g = M.gf; if (!g) return '';
  const L = g.lo, lo = `${ARM[L.p].name} · ${ARM[L.s].name}`;
  if (g.state === 'wait') return 'WAITING FOR PLAYERS';
  return `ROUND ${g.round} · ${g.state === 'freeze' ? 'GET READY' : g.state === 'live' ? Math.ceil(g.t) + 's' : 'ROUND OVER'} · ALIVE ${gfAlive(M.myTeam)} v ${gfAlive(1 - M.myTeam)} · ${lo}`;
}
