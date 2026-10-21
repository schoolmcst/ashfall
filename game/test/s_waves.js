// wave mode on each map: enemies spawn, reach the player, nothing throws
module.exports = async p => p.evaluate(async () => {
  const A = window.__A, out = {};
  for (const id of A.MAP_ORDER.filter(m => !A.MAPS[m].hidden)) {
    A.startMatch('surv', { map: id }); A.G.health = 1e9; A.G.maxHp = 1e9; A.G.noRender = true;
    await new Promise(r => setTimeout(r, 14000));
    const P = A.P, en = A.enemies;
    out[id] = { player: [+P.x.toFixed(1), +P.y.toFixed(1), +P.z.toFixed(1)], wave: A.G.wave, enemies: en.length, nearest: en.length ? +Math.min(...en.map(e => Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z))).toFixed(1) : null, ys: en.map(e => +e.group.position.y.toFixed(1)) };
  }
  A.G.noRender = false; return out;
});
