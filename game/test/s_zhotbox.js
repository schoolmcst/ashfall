// THE HOTBOX (endless zombies): no story, spawns only in the drying ring, everything reachable, the dead come in; pictures
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { const A = window.__A; A.ZL.net = 'solo'; A.ZL.map = 'hotbox'; A.ZL.story = true; A.openZLobby(); const s = document.getElementById('hcSplash'); if (s) s.remove(); });
  await p.waitForTimeout(500); const lobby = await p.evaluate(() => document.getElementById('lobSel').textContent.slice(0, 300));
  await p.evaluate(() => { const A = window.__A; A.zombAct('z-start'); A.G.health = A.G.maxHp = 1e9; });
  await p.waitForTimeout(9000);
  const r = await p.evaluate(() => { const A = window.__A, pts = A.zdSpawnPts(), F = A.flowField(0, 5.5, 0);
    const ok = (x, z) => { for (const [dx, dz] of [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = A.nodeOf(x + dx, z + dz, 0); if (n >= 0 && F && F[n] >= 0) return 1; } return 0; };
    const bad = []; for (const pk of A.ZPERKS) { const x = pk.at.x + [0, 1.2, 0, -1.2][pk.at.q], z = pk.at.z + [1.2, 0, -1.2, 0][pk.at.q]; if (!ok(x, z)) bad.push(pk.id); }
    if (!ok(A.ZU_SPOT.x, A.ZU_SPOT.z + 1.6)) bad.push('upgrader'); for (const s of A.ZMAPCFG.hotbox.stash) if (!ok(s.x + [0, 1.2, 0, -1.2][s.q], s.z + [1.2, 0, -1.2, 0][s.q])) bad.push('stash:' + s.gun);
    if (!ok(19, 19) || !ok(-19, -5)) bad.push('ring');
    const zs = A.enemies.filter(e => e.zombie).map(e => [Math.round(e.group.position.x), Math.round(e.group.position.z)]);
    return { map: A.curMap, storyOff: !!A.ZS.off, doors: A.ZDOORS.length, spawnPts: pts.length, inner: pts.filter(q => Math.max(Math.abs(q.x), Math.abs(q.z)) < 16.6).length, bad, round: A.Z.round, zombies: zs.length, zs: zs.slice(0, 6), crates: [A.Z.crate && A.Z.crate.position.toArray().map(Math.round), A.Z.ammo && A.Z.ammo.position.toArray().map(Math.round)] }; });
  r.lobby = lobby;
  for (const [n, v] of Object.entries({ hb_floor: [0, 13, 0, 1.2, 0], hb_corner: [-13, -13, 0, 1.2, 0], hb_ring: [0, 19, -18, 1.5, 19] })) {
    await p.evaluate(v => { const A = window.__A; Object.assign(A.P, { x: v[0], z: v[1], y: 0 }); A.P.yaw = Math.atan2(-(v[2] - v[0]), -(v[4] - v[1])); A.P.pitch = -0.05; A.G.state = 'playing'; }, v);
    await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 });
  }
  return r;
};
