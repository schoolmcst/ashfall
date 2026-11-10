/* ================================================================== SQUAD VOICE LINES (1.2.88)
   Bot teammates talk, in the built-in voices of your computer (each bot keeps its own voice and pitch): when they go
   down, get picked up, pick you up, get a kill, see you get one, see you go down, when you're the last one standing,
   when the storm closes in and when a round ends. At most one line every few seconds, never over another line.
   SETTINGS > AUDIO > SQUAD VOICE LINES turns them off. */
const SQV = { t: 0, voices: null };
const SQV_LINES = {
  spot: ['Enemy spotted!', 'Contact!', 'Got eyes on one!', 'Enemy over there!'],
  down: ["I'm down!", 'Need a revive!', "I'm hit, I'm down!", 'Get me up!'],
  up: ['Thanks, I owe you.', "I'm back up.", 'Good looking out.'],
  revived: ['Got you, get up.', 'On your feet.', "You're good, go."],
  kill: ['Got one!', 'Enemy down.', 'Dropped him.', "He's done.", 'One less.'],
  nice: ['Nice shot!', 'Good kill.', "That's how it's done.", 'Clean.'],
  youdown: ["They got you! I'm coming!", 'Hold on, I got you!', 'Hang on!'],
  last: ["It's all on you now.", "You're the last one, make it count.", 'Clutch time.'],
  storm: ["Storm's closing, let's move.", 'We need to rotate.', 'Get out of the storm.'],
  win: ['We did it!', 'GG, easy.', "That's a win."], lose: ['Next one.', 'Shake it off.', 'We get them next time.'],
};
function sqvVoice(e) {
  try { if (!SQV.voices || !SQV.voices.length) SQV.voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)); } catch (er) { return null; }
  const V = SQV.voices; if (!V || !V.length) return null; let h = 0; for (const c of (e && e.name) || 'x') h = (h * 31 + c.charCodeAt(0)) | 0; h = Math.abs(h);
  return { v: V[h % V.length], pitch: 0.8 + (h % 7) * 0.07 };
}
function sqvSay(e, kind, force) {
  if (S.sqvox === false || !M || !inMatch() || M.mode === 'zomb' || M.mode === 'camp') return; if (!force && NOW < SQV.t) return; const L = SQV_LINES[kind]; if (!L) return;
  try { if (!window.speechSynthesis || speechSynthesis.speaking || speechSynthesis.pending) return;
    const u = new SpeechSynthesisUtterance(L[(Math.random() * L.length) | 0]), vo = sqvVoice(e); if (vo) { u.voice = vo.v; u.pitch = vo.pitch; } u.rate = 1.12;
    u.volume = clamp(((S.master !== undefined ? S.master : 80) / 100) * 0.75, 0, 1); speechSynthesis.speak(u); SQV.t = NOW + 4.5;
    if (e && e.name) try { showMsg(`${e.name}: ${u.text}`); } catch (er) {}
  } catch (er) {}
}
const sqvMates = () => enemies.filter(x => x.pvp && !x.net && isFriend(x) && !x.downed && (!x.entry || x.entry.alive !== false));
const sqvNear = () => { const L = sqvMates(); let b = null, bd = 1e9; for (const x of L) { const d = Math.hypot(x.group.position.x - P.x, x.group.position.z - P.z); if (d < bd) { bd = d; b = x; } } return bd < 45 ? b : null; };
// the hooks (wrapped, so the squad code doesn't change)
(() => {
  const dD = sqBotDown; sqBotDown = function (e) { const r = dD.apply(this, arguments); try { if (e && isFriend(e)) sqvSay(e, 'down', true); } catch (er) {} return r; };
  const dU = sqBotUp; sqBotUp = function (e, by) { const r = dU.apply(this, arguments); try { if (e && isFriend(e)) sqvSay(e, by === 'player' ? 'up' : 'up'); } catch (er) {} return r; };
  const pD = sqPlayerDown; sqPlayerDown = function () { const r = pD.apply(this, arguments); try { const m = sqvNear(); if (m) sqvSay(m, 'youdown', true); } catch (er) {} return r; };
  const dE = damageEnemy; damageEnemy = function (e, dmg, head, dir, boom, by = 'player') {
    const was = enemies.includes(e) && !e.downed, r = dE.apply(this, arguments);
    try { if (was && (!enemies.includes(e) || e.downed) && M && (M.def.teams || M.squad > 1) && !isFriend(e)) {
      if (by === 'player') { if (Math.random() < 0.45) { const m = sqvNear(); if (m) sqvSay(m, 'nice'); } }
      else if (by && by.group && isFriend(by) && Math.random() < 0.5) sqvSay(by, 'kill'); } } catch (er) {}
    return r; };
})();
// a few checks a second: the last one standing, the storm, the end of the match
function sqvTick() {
  if (!M || !inMatch() || !(M.def.teams || M.squad > 1)) { SQV.lastAlone = false; return; }
  if (M.over && !SQV.endSaid) { SQV.endSaid = true; const m = sqvMates()[0]; if (m) sqvSay(m, M.result === 1 ? 'win' : 'lose', true); return; } if (!M.over) SQV.endSaid = false;
  if (M.br && M.squad > 1) { const alone = playerAlive() && !sqvMates().length && enemies.some(x => isFriend(x)); if (alone && !SQV.lastAlone) { const d = enemies.find(x => isFriend(x)); if (d) sqvSay(d, 'last', true); } SQV.lastAlone = alone;
    const B = M.br; if (B.r && Math.hypot(P.x - B.cx, P.z - B.cz) > B.r && NOW > (SQV.stormT || 0)) { SQV.stormT = NOW + 25; const m = sqvNear(); if (m) sqvSay(m, 'storm'); } }
}
setInterval(() => { try { sqvTick(); } catch (e) {} }, 400);
