// every map x every mode, bots only: kills, objective progress, stuck / lost / broken bots. MAPS=a,b MODES=x,y SECS=20
module.exports = async p => p.evaluate(async ({ maps, modes, secs }) => {
  const A = window.__A, out = {}, ids = maps.length ? maps : A.MAP_ORDER.filter(id => !A.MAPS[id].hidden);
  A.G.noRender = true;
  for (const id of ids) for (const mode of modes) {
    A.startMatch(mode, { map: id, custom: true, score: 999, time: 0, perTeam: 6, players: 8, skill: 'regular' }); A.G.health = 1e9; A.G.maxHp = 1e9; A.G.spawnProt = 1e9; A.G.holdT = 0.01; A.G.loadT = 0.01;
    const pos = new Map(), still = new Map(), bad = [], t0 = performance.now(); let objEv = 0, lastObj = '';
    while (performance.now() - t0 < secs * 1000) {
      await new Promise(r => setTimeout(r, 1000));
      for (const e of A.enemies) {
        if (!e.entry) continue; const g = e.group.position, k = e.entry.name;
        if (!isFinite(g.x) || !isFinite(g.y) || !isFinite(g.z)) bad.push(k + ':NaN');
        else if (g.y < -1 || g.y > 30) bad.push(k + ':y=' + g.y.toFixed(1));
        const pr = A.MAPS[id].play; if (pr && (g.x < pr[0] - 1 || g.x > pr[1] + 1 || g.z < pr[2] - 1 || g.z > pr[3] + 1)) bad.push(k + ':out ' + g.x.toFixed(0) + ',' + g.z.toFixed(0));
        const q = pos.get(k); if (q && Math.hypot(q.x - g.x, q.z - g.z) < 0.4 && !e.tgt && !e.watching && !(e.holding)) still.set(k, (still.get(k) || 0) + 1); else still.set(k, 0);
        if ((still.get(k) || 0) >= 12) bad.push(k + ':stuck ' + g.x.toFixed(1) + ',' + g.z.toFixed(1) + ',' + g.y.toFixed(1) + ' ' + e.job), still.set(k, -999);
        pos.set(k, { x: g.x, z: g.z });
      }
      const ob = JSON.stringify([A.M.teamScore, A.M.snd && A.M.snd.state, A.M.ctf && A.M.ctf.flags.map(f => f.state)]); if (ob !== lastObj) { objEv++; lastObj = ob; }
    }
    out[id + '/' + mode] = { kills: A.M.entries.reduce((s, e) => s + (e.kills || 0), 0), score: A.M.teamScore.slice(), objEv, bad: [...new Set(bad)].slice(0, 6), gameT: +A.M.t.toFixed(0) };
  }
  A.G.noRender = false; return out;
}, { maps: (process.env.MAPS || '').split(',').filter(Boolean), modes: (process.env.MODES || 'tdm,hp,ctf,snd,ffa,gun').split(','), secs: +(process.env.SECS || 20) });
