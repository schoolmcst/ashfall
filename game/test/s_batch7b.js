// winter STASH ISLAND, the walk-in Crew Stash House
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  const hold = async () => { await p.waitForTimeout(6000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(3000); };
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.ISLE_W.force = true; A.startMatch('br', { map: 'stashisle' }); }); await hold();
  r.winter = await p.evaluate(() => { const A = window.__A, M = A.MAPS.stashisle; let snowMesh = 0, grassMesh = 0; A.scene.traverse(o => { if (o.isMesh && o.material === A.MAT.snow) snowMesh++; }); return { on: A.isleWinter(), name: M.name, grass: M.grass.count, snowMeshes: snowMesh, amb: A.AMB.kind }; });
  await p.evaluate(() => { const A = window.__A, v = A.MAPS.stashisle.views[0]; A.G.state = 'paused'; A.camera.position.set(v[0], v[1] + 6, v[2] + 10); A.camera.lookAt(v[3], v[4], v[5]); document.getElementById('hud').classList.add('hide'); for (const s of document.querySelectorAll('.screen')) s.classList.add('hide'); });
  await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/isle_winter.png' });
  // the house
  r.house = await p.evaluate(() => { const A = window.__A; try { A.leaveGame(); } catch (e) {} A.ISLE_W.force = null; A.PROG.crew = { id: 'X-1', name: 'TEST CREW', tag: 'TST', own: 1 }; A.PROG.cr = { id: 'X-1', cp: 30000, wk: '', k: 0, claimed: '' }; return A.chwOpen(); });
  await hold();
  r.inHouse = await p.evaluate(() => { const A = window.__A; return { map: A.curMap, mode: A.M.mode, house: !!A.M.cfg.house, enemies: A.enemies.length, spots: A.CHW_GET().spots.map(s => s.k), state: A.G.state }; });
  await p.evaluate(() => { const A = window.__A; A.G.state = 'paused'; A.camera.position.set(0, 1.7, 4.6); A.camera.lookAt(0, 1.2, -3); document.getElementById('hud').classList.add('hide'); for (const s of document.querySelectorAll('.screen')) s.classList.add('hide'); });
  await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/house.png' });
  await p.evaluate(() => { const A = window.__A; A.camera.position.set(-3, 1.7, 3); A.camera.lookAt(7, 1.3, -2); }); await p.waitForTimeout(800); await p.screenshot({ path: SH + '/house2.png' });
  return r;
};
