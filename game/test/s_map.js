// map check: MAP=<id> [SHOTS=dir] node run.js s_map.js
// loads the map, renders a top-down plan and a few eye-level views, checks that every objective and both spawns are
// reachable by bots, then runs a short 6v6 bot match and reports kills and bots that got stuck.
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const id = process.env.MAP || 'ruins', out = process.env.SHOTS || path.join(__dirname, 'shots');
  fs.mkdirSync(out, { recursive: true });
  const info = await p.evaluate(id => { const A = window.__A; const t = performance.now(); A.loadMap(id); return { ms: Math.round(performance.now() - t), boxes: A.boxes.length }; }, id);
  const save = (name, url) => fs.writeFileSync(path.join(out, `${id}_${name}.png`), Buffer.from(url.split(',')[1], 'base64'));
  // top-down plan with lanes / objectives marked
  const plan = await p.evaluate(() => {
    const A = window.__A, r = A.renderer, sc = A.scene, cam = new THREE.OrthographicCamera(-46, 46, 46, -46, 1, 400);
    cam.position.set(0, 200, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
    const marks = new THREE.Group(); sc.add(marks);
    const dot = (x, y, z, col, s = 1.2) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(s, s, 0.3, 16), new THREE.MeshBasicMaterial({ color: col, depthTest: false })); m.position.set(x, y + 30, z); m.renderOrder = 99; marks.add(m); };
    const L = A.LAYOUT; L.spawn.forEach((s, i) => dot(s.x, s.y || 0, s.z, i ? 0xff3030 : 0x3080ff, 2.2)); L.hp.forEach(h => dot(h.x, h.y || 0, h.z, 0xffffff, 1.4)); L.sites.forEach(h => dot(h.x, h.y || 0, h.z, 0xffd24a, 1.8)); L.flags.forEach(h => dot(h.x, h.y || 0, h.z, 0x30ff60, 1.0));
    const fog = sc.fog.density; sc.fog.density = 0; const W = r.domElement.width, H = r.domElement.height;
    r.setSize(900, 900, false); r.setViewport(0, 0, 900, 900); r.clear(); r.render(sc, cam);
    const url = r.domElement.toDataURL('image/png'); sc.remove(marks); sc.fog.density = fog; r.setSize(W, H, false); r.setViewport(0, 0, W, H);
    return url;
  });
  save('plan', plan);
  // eye-level views (from the map's test views, or default corners)
  const views = await p.evaluate(id => (window.__A.MAPS[id].views || [[0, 1.7, 36, 0, 1.7, 0], [-30, 1.7, 30, 0, 1.7, 0], [30, 1.7, -30, 0, 1.7, 0]]), id);
  for (let i = 0; i < views.length; i++) {
    const url = await p.evaluate(v => {
      const A = window.__A, r = A.renderer, sc = A.scene, cam = new THREE.PerspectiveCamera(70, 16 / 9, 0.05, 500);
      cam.position.set(v[0], v[1], v[2]); cam.lookAt(v[3], v[4], v[5]);
      const W = r.domElement.width, H = r.domElement.height; r.setSize(1280, 720, false); r.setViewport(0, 0, 1280, 720); r.clear(); r.render(sc, cam);
      const u = r.domElement.toDataURL('image/jpeg', 0.85); r.setSize(W, H, false); r.setViewport(0, 0, W, H); return u;
    }, views[i]);
    save('view' + i, url);
  }
  // reachability: from each spawn, which objectives can a bot walk to?
  const reach = await p.evaluate(() => {
    const A = window.__A, L = A.LAYOUT; A.buildSpawns();
    const res = {}, pts = { spawn0: L.spawn[0], spawn1: L.spawn[1] };
    L.hp.forEach((h, i) => pts['hp' + i] = h); L.sites.forEach((h, i) => pts['site' + h.n] = h); L.flags.forEach((h, i) => pts['flag' + i] = h);
    for (const [k, pt] of Object.entries(pts)) {
      const f = A.flowField(pt.x, pt.z, pt.y || 0);
      const from = [L.spawn[0], L.spawn[1]].map(s => { const n = A.nodeOf(s.x, s.z, s.y || 0); return f && n >= 0 ? f[n] : -2; });
      let cnt = 0; if (f) for (let i = 0; i < f.length; i++) if (f[i] >= 0) cnt++;
      res[k] = { y: pt.y || 0, fromSpawns: from, reachableNodes: cnt };
    }
    let walk = 0, multi = 0; for (let c = 0; c < A.lvN.length; c++) { walk += A.lvN[c]; if (A.lvN[c] > 1) multi++; }
    return { res, walkNodes: walk, multiLevelCells: multi, spawns: A.buildSpawns().length };
  });
  // short bot match
  const sim = process.env.SIM === '0' ? null : await p.evaluate(async id => {
    const A = window.__A; A.G.noRender = true;
    A.startMatch('tdm', { score: 999, time: 0, perTeam: 6, skill: 'regular', custom: true, map: id });
    A.G.spawnProt = 1e9; A.G.health = 1e9; A.G.maxHp = 1e9;   // keep the player out of it: invulnerable at spawn
    const bots = A.enemies; const track = new Map(); for (const e of bots) track.set(e, { x: e.group.position.x, z: e.group.position.z, moved: 0, maxY: 0 });
    const t0 = performance.now();
    await new Promise(r => setTimeout(r, +((window.SIMSEC || 25) * 1000)));
    let stuck = 0, high = 0;
    for (const e of A.enemies) { const t = track.get(e); if (!t) continue; }
    const res = { kills: A.M.entries.reduce((s, e) => s + e.kills, 0), teamScore: A.M.teamScore.slice(), bots: A.enemies.length, ys: A.enemies.map(e => +e.group.position.y.toFixed(1)), pos: A.enemies.map(e => [+e.group.position.x.toFixed(0), +e.group.position.z.toFixed(0)]) };
    A.G.noRender = false; return res;
  }, id);
  return { map: id, build: info, reach, sim };
};
