// STASH ISLAND remade (391 m): build, size, crates inside and upstairs, every place reachable, pictures
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.G.noRender = true; window.__t0 = performance.now(); A.startMatch('br', { map: 'stashisle' }); });
  await p.waitForTimeout(12000);
  await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(4000);
  r.map = await p.evaluate(() => { const A = window.__A, m = A.MAPS.stashisle, pr = m.play; return { cur: A.curMap, area: Math.round((pr[1] - pr[0]) * (pr[3] - pr[2])), arena: A.ARENA, buildMs: A.MAP_BUILD_MS, boxes: A.boxes.length, loot: m.loot.length, bots: A.enemies.length }; });
  r.crates = await p.evaluate(() => { const B = window.__A.M.br; return { n: B.crates.length, up: B.crates.filter(c => c.y > 1).length, phases: window.__A.M.br && B.R0 | 0 }; });
  // reachability: a full field from a few hubs (the bots' fields stop at ~95 m, so join them up)
  await p.evaluate(() => { window.__F = []; });
  for (const [x, z] of [[0, 0], [0, -120], [-120, -100], [-72, -64], [120, -110], [160, -160], [-150, 32], [110, 20], [130, 30], [150, 20], [-140, 140], [0, 150], [120, 140], [-62, 100], [62, 90], [-56, -36], [176, 80], [-30, -150], [30, -150], [168, -165]]) {
    for (let k = 0; k < 6; k++) { const got = await p.evaluate(([x, z]) => { const F = window.__A.flowField(x, z, 0); if (F) { window.__F.push(F.slice()); return 1; } return 0; }, [x, z]); if (got) break; await p.waitForTimeout(60); } }
  r.reach = await p.evaluate(() => {
    const A = window.__A, pts = { town: [0, 0, 0], school: [0, -146, 0], schoolRoof: [10, -143, 7.2], packing: [-132, -100, 3.6], radioHut: [-72, -64, 6], refineryMezz: [128, -118, 3.6], lighthouse: [168, -170, 7.2], hotel: [-170, 20, 3.6], hotelRoof: [-149, -6, 7.2], cellar: [126, 20, 0], tunnel: [160, 20, 0], cliffTop: [130, 30, 5], mansion: [162, 10, 8.6], mansionRoof: [168, 4, 12.2], farmLoft: [-140, 126, 3.6], docksMezz: [-32, 154, 3.6], containerTop: [1, 150, 5.2], quarryPit: [125, 150, 0], quarryTop: [130, 112, 4.5], power: [-62, 96, 0], bunker: [52, 80, 3.6] };
    const hubs = [[0, 0], [0, -120], [-120, -100], [-72, -64], [120, -110], [160, -160], [-150, 20], [110, 20], [150, 20], [-140, 140], [0, 150], [120, 140], [-62, 100], [62, 90]];
    const out = {}; const ok = (F, x, z, y) => { for (const [dx, dz] of [[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) { const n = A.nodeOf(x + dx, z + dz, y); if (n >= 0 && F && F[n] >= 0) return true; } return false; };
    const fields = window.__F;
    for (const [k, [x, z, y]] of Object.entries(pts)) out[k] = fields.some(F => ok(F, x, z, y)) ? 1 : 0;
    const L = A.MAPS.stashisle.loot, bad = L.filter(q => !fields.some(F => ok(F, q.x, q.z, q.y))); out.loot = L.length - bad.length + ' / ' + L.length; out.lootBad = bad.slice(0, 12).map(q => [q.x, q.z, q.y]);
    out.fields = fields.length; return out; });
  const t0 = Date.now(); r.fieldMs = await p.evaluate(() => { const A = window.__A, t = performance.now(); A.FLOW && A.FLOW.clear && A.FLOW.clear(); let f = null; for (let i = 0; i < 3 && !f; i++) f = A.flowField(-30, 30, 0); return Math.round(performance.now() - t); });
  // pictures
  await p.evaluate(() => { window.__A.G.noRender = false; document.getElementById('hud').classList.add('hide'); for (const s of document.querySelectorAll('.screen')) s.classList.add('hide'); });
  const views = [['town', [24, 14, 40], [0, 2, 0]], ['air', [0, 160, 260], [0, 0, 0]], ['estate', [100, 8, 40], [150, 6, 20]], ['tunnel', [139, 1.6, 20], [170, 1.4, 20]], ['interior', [-31, 1.7, -28], [-25, 1.5, -34]], ['quarry', [110, 9, 170], [140, 0, 130]], ['docks', [-32, 1.7, 168], [-32, 2.5, 150]], ['school', [0, 6, -110], [0, 4, -146]]];
  for (const [n, c, t] of views) { await p.evaluate(([c, t]) => { const A = window.__A; A.G.state = 'paused'; A.camera.position.set(c[0], c[1], c[2]); A.camera.lookAt(t[0], t[1], t[2]); A.camera.far = 2000; A.camera.updateProjectionMatrix(); }, [c, t]); await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/isle2_' + n + '.png' }); }
  return r;
};
