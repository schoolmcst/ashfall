// play each mode for a while with logic only; the player auto-aims at the nearest visible bot
module.exports = async p => p.evaluate(async () => {
  const A = window.__A, wait = ms => new Promise(r => setTimeout(r, ms)), out = {};
  A.G.noRender = true;
  for (const mode of (window.__MODES || ['tdm', 'ffa', 'gun', 'hp', 'ctf', 'snd'])) {
    A.startMatch(mode, { score: mode === 'ctf' ? 1 : mode === 'snd' ? 2 : mode === 'hp' ? 40 : mode === 'gun' ? 20 : 12, time: 3, perTeam: 4, players: 6, skill: 'veteran', custom: true });
    const t0 = performance.now(); let ticks = 0;
    while (performance.now() - t0 < (window.__T || 20000) && A.G.state !== 'over') {
      await wait(100); ticks++;
      if (A.G.state === 'playing') {
        const foes = A.enemies.filter(e => !(A.M.def.teams && e.team === 0));
        foes.sort((a, b) => Math.hypot(a.group.position.x - A.P.x, a.group.position.z - A.P.z) - Math.hypot(b.group.position.x - A.P.x, b.group.position.z - A.P.z));
        const e = foes[0];
        if (e) { const dx = e.group.position.x - A.P.x, dz = e.group.position.z - A.P.z; A.P.yaw = Math.atan2(-dx, -dz); A.P.pitch = Math.atan2(1.2 - 1.7, Math.hypot(dx, dz)); A.G.fireT = Math.min(A.G.fireT, 0); if (A.W[A.G.cur].ammo > 0) A.shoot(false); else A.startReload(); }
      }
    }
    out[mode] = { state: A.G.state, t: +A.M.t.toFixed(1), score: A.M.teamScore, me: { k: A.M.me.kills, d: A.M.me.deaths, lvl: A.M.me.level }, bots: A.enemies.length, top: A.M.entries.slice().sort((a, b) => b.kills - a.kills).slice(0, 3).map(e => e.name + ':' + e.kills + '/' + e.deaths), extra: mode === 'snd' ? JSON.stringify({ r: A.M.snd.round, w: A.M.snd.wins, st: A.M.snd.state }) : mode === 'ctf' ? A.M.ctf.flags.map(f => f.state).join(',') : mode === 'hp' ? A.M.hp.status : '', result: A.M.result };
    A.actions('res-lobby');
  }
  return out;
});
