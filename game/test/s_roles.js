// bot roles: MAP=<id> MODE=tdm|snd|gun|hp|ctf [SECS=40] node run.js s_roles.js
// runs a bot-only match (the player is parked out of the way), records every bot's path, job and lane, and reports
// how the team spread out, kills and objective events. Writes roles_<map>_<mode>.json next to the shots.
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const id = process.env.MAP || 'dustwater', mode = process.env.MODE || 'tdm', secs = +(process.env.SECS || 40);
  const out = process.env.SHOTS || path.join(__dirname, 'shots'); fs.mkdirSync(out, { recursive: true });
  const r = await p.evaluate(async ({ id, mode, secs, NOROLES }) => {
    const A = window.__A;
    A.G.noRender = true; A.G.noRoles = !!NOROLES;
    A.startMatch(mode, { score: 999, time: 0, perTeam: 6, players: 8, skill: 'regular', custom: true, map: id });
    A.G.spawnProt = 1e9; A.G.health = 1e9;
    const trails = new Map(), info = new Map(), events = [];
    const t0 = performance.now(); let lastS = null;
    while ((performance.now() - t0) / 1000 < secs) {
      await new Promise(res => setTimeout(res, 400));
      for (const e of A.enemies) {
        if (!e.entry) continue;
        const k = e.entry.name; if (!trails.has(k)) trails.set(k, []);
        trails.get(k).push([+e.group.position.x.toFixed(1), +e.group.position.z.toFixed(1), e.team, e.job]);
        info.set(k, { team: e.team, job: e.job, pers: e.pers || '', lane: e.lane, kills: e.entry.kills, deaths: e.entry.deaths });
      }
      if (A.M.snd) { const s = A.M.snd.state + (A.M.snd.bomb ? ':bomb' : ''); if (s !== lastS) { events.push([+((performance.now() - t0) / 1000).toFixed(1), s, A.M.snd.wins.slice()]); lastS = s; } }
    }
    A.G.noRender = false; const pr = A.MAPS[A.curMap].play;
    return { gameT: +A.M.t.toFixed(1), play: pr, trails: [...trails.entries()], info: [...info.entries()], score: A.M.teamScore, events, mode: A.M.mode };
  }, { id, mode, secs, NOROLES: !!process.env.NOROLES });
  fs.writeFileSync(path.join(out, `roles_${id}_${mode}.json`), JSON.stringify(r));
  const jobs = {}; for (const [, v] of r.info) { const k = v.team + ':' + v.job; jobs[k] = (jobs[k] || 0) + 1; }
  const lanes = {}; for (const [, v] of r.info) { const k = v.team + ':' + v.lane; lanes[k] = (lanes[k] || 0) + 1; }
  const kills = r.info.reduce((s, [, v]) => s + v.kills, 0);
  return { mode: r.mode, gameT: r.gameT, jobs, lanes, kills, score: r.score, events: r.events.slice(0, 12) };
};
