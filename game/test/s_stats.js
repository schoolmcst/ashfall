// career stats: a finished match, an early quit, an online-style kill without a body
module.exports = async p => p.evaluate(async () => {
  const A = window.__A, S0 = JSON.parse(JSON.stringify(A.STATSOBJ));
  A.startMatch('tdm', { map: 'ruins', custom: true, score: 999, time: 0, perTeam: 2, skill: 'regular' });
  A.statKillAt(5, 5, true); A.statKillAt(10, 0, false); A.statDeath();
  await new Promise(r => setTimeout(r, 1200));
  A.leaveGame();   // early quit: kills/deaths/time count, not a match
  const S1 = JSON.parse(JSON.stringify(A.STATSOBJ));
  A.startMatch('ffa', { map: 'ruins', custom: true, score: 999, time: 0, players: 3, skill: 'regular' });
  A.statKillAt(3, 3, false); A.finishMatchStats(1);
  const S2 = JSON.parse(JSON.stringify(A.STATSOBJ));
  const O0 = JSON.parse(JSON.stringify(A.STATSON)); A.M.online = true; A.M.mode = 'otdm'; A.startMatchStats(); A.statKillAt(2, 2, true); A.statDeath(); A.finishMatchStats(-1); const O1 = JSON.parse(JSON.stringify(A.STATSON)), S3 = JSON.parse(JSON.stringify(A.STATSOBJ));
  return { quit: { matches: S1.matches - S0.matches, kills: S1.kills - S0.kills, deaths: S1.deaths - S0.deaths, heads: S1.heads - S0.heads, time: +(S1.time - S0.time).toFixed(1) },
           online: { matches: O1.matches - O0.matches, losses: O1.losses - O0.losses, kills: O1.kills - O0.kills, offlineUnchanged: S3.kills === S2.kills }, finish: { matches: S2.matches - S1.matches, wins: S2.wins - S1.wins, kills: S2.kills - S1.kills, ffa: S2.modes.ffa } };
});
