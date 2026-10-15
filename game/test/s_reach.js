// can bots walk from the spawns into every new building (and up its stairs)?
module.exports = async p => p.evaluate(() => {
  const A = window.__A, M4 = 4.55, pts = {
    ruins: [[-12, -12, 3.4], [13, 14, 3.4], [37, -17, 3.4], [-30, 34, 3.4], [30, 34, 3.4], [12, -13, 0], [-35, -10, 0]],
    town: [[-18.5, 10, 6.0], [-33, 17, 3.2], [28.5, 32.5, 3.2], [-25, 34, 0], [10, 19.5, 1.5], [-18.5, -10, 6.0]],
    docks: [[-31, 35.5, 3.2], [22, 35, 3.2], [-30.6, 10, 0], [-31, -35.5, 3.2]],
    metro: [[-38.5, 6, M4 + 3.3], [-17.5, 20.5, M4 + 3.3], [-38.5, 32, M4], [-17.5, -20.5, M4 + 3.3]],
  }, out = {};
  for (const id of Object.keys(pts)) {
    A.loadMap(id); const L = A.LAYOUT, r = [];
    for (const [x, z, y] of pts[id]) {
      const f = A.flowField(x, z, y), n0 = A.nodeOf(L.spawn[0].x, L.spawn[0].z, L.spawn[0].y || 0), n1 = A.nodeOf(L.spawn[1].x, L.spawn[1].z, L.spawn[1].y || 0);
      r.push([x, z, y, f ? f[n0] : 'nofield', f ? f[n1] : 'nofield']);
    }
    out[id] = r;
  }
  return out;
});
