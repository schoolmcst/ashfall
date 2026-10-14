// end-of-match scoreboard + intermission, then the next match starts by itself with a full reset
module.exports = async p => {
  const r = await p.evaluate(async () => {
    const A = window.__A, out = {};
    A.startMatch('tdm', { score: 999, time: 0, perTeam: 4, custom: true, map: 'random', skill: 'regular' });
    out.map1 = A.curMap; await new Promise(r => setTimeout(r, 1500));
    A.endMatch(0);
    out.state = A.G.state; out.resVisible = !document.getElementById('results').classList.contains('hide');
    out.nextT = Math.round(A.M.nextT); await new Promise(r => setTimeout(r, 1200));
    out.text = document.getElementById('resNext').textContent;
    A.M.nextT = 0.05; await new Promise(r => setTimeout(r, 800));
    out.after = { state: A.G.state, over: A.M.over, map: A.curMap, kills: A.M.entries.reduce((s, e) => s + e.kills, 0), bots: A.enemies.length, perTeam: A.M.cfg.perTeam, sel: A.M.cfg.mapSel };
    return out;
  });
  if (!r.resVisible || r.state !== 'over' || r.nextT !== 45 || r.after.state !== 'playing' || r.after.over || r.after.perTeam !== 4 || r.after.map === r.map1) throw new Error('intermission failed ' + JSON.stringify(r));
  return r;
};
