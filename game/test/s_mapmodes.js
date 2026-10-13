module.exports = async p => p.evaluate(async () => {
  const A = window.__A, out = {};
  A.G.noRender = true;
  for (const id of ['docks', 'town', 'metro']) for (const mode of ['hp', 'ctf', 'snd', 'ffa', 'gun']) {
    A.startMatch(mode, { map: id, custom: true, score: 999, time: 0, perTeam: 5, players: 8, skill: 'regular' }); A.G.health = 1e9; A.G.maxHp = 1e9;
    await new Promise(r => setTimeout(r, 7000));
    out[id + '/' + mode] = { kills: A.M.entries.reduce((s, e) => s + e.kills, 0), team: A.M.teamScore.slice(), hp: A.M.hp ? A.M.hp.status : undefined };
  }
  A.G.noRender = false; return out;
});
