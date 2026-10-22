// zombies zones: open the doors one at a time and check what the start can reach (no way round a paid door)
module.exports = async p => p.evaluate(async () => {
  const A = window.__A; A.ZL.net = 'solo'; A.openZLobby(); A.zombAct('z-start'); A.G.noRender = true; A.G.health = 1e9;
  const pts = { lobby: [0, 20, 0], southCorr: [-25, 12, 0], atrium: [-5, -5, 0], southRoom: [28, 5, 0], northCorr: [-25, -12, 0], northRoom: [28, -5, 0], upgrader: [-4, -25, 0], upSouth: [20, 12, 4.2], upNorth: [-20, -12, 4.2], outsideN: [0, -38, 0] };
  const reach = () => { const out = {}; for (const [k, [x, z, y]] of Object.entries(pts)) { const f = A.flowField(x, z, y), n = A.nodeOf(0.25, 37.5, 0); out[k] = !!f && n >= 0 && f[n] >= 0 ? 1 : 0; } return out; };
  const steps = [['start', null], ['MAIN CORRIDOR'], ['NORTH WING'], ['UPGRADE ROOM'], ['UPSTAIRS']], res = {};
  for (const [name] of steps) { if (name !== 'start') A.zdOpen(A.ZDOORS.find(d => d.name === name).id, true); res[name] = reach(); }
  // upstairs alone (after the main corridor) must not reach the north ground floor
  A.startMatch('zomb', { map: 'blackwell' }); A.G.noRender = true; A.zdOpen(A.ZDOORS.find(d => d.name === 'MAIN CORRIDOR').id, true); A.zdOpen(A.ZDOORS.find(d => d.name === 'UPSTAIRS').id, true); res['MAIN+UPSTAIRS only'] = reach();
  return { doors: A.ZDOORS.map(d => d.name), res };
});
