module.exports = async p => p.evaluate(async () => {
  const A = window.__A, out = {};
  for (const id of ['ruins', 'docks', 'town', 'metro']) {
    A.startMatch('tdm', { map: id, custom: true, score: 999, time: 0, perTeam: 6, skill: 'regular' });
    const pos = [{ x: A.P.x, z: A.P.z, t: 0 }, ...A.enemies.map(e => ({ x: e.group.position.x, z: e.group.position.z, t: e.team }))];
    let minD = 1e9, sum = 0, n = 0; for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) if (pos[i].t === pos[j].t) { const d = Math.hypot(pos[i].x - pos[j].x, pos[i].z - pos[j].z); minD = Math.min(minD, d); sum += d; n++; }
    out[id] = { spawns: A.buildSpawns().length, minTeamGap: +minD.toFixed(1), avgTeamGap: +(sum / n).toFixed(1) };
  }
  return out;
});
