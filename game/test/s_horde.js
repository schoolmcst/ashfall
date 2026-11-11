// HOTBOX HORDE: lobby, setup (plant, rifts, nodes), harvesting, building (walls, floor, stairs, traps), a wave that
// walks to the plant and bashes the walls, traps that hurt, the boss, losing / winning and the seeds paid
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} });
  // menu tile + lobby
  r.menu = await p.evaluate(() => { const A = window.__A; A.showScreen('menu'); try { A.featTilesL && A.featTilesL(); } catch (e) {} return !!document.getElementById('hhTile'); });
  await p.waitForTimeout(400); await p.screenshot({ path: SH + '/hh_menu.png' });
  r.lobby = await p.evaluate(() => { const A = window.__A; const s = A.hhL.load(); s.seeds = 1200; A.hhL.save(s); A.actions('hh-play'); return { scr: A.curScreen, kind: document.getElementById('lobKind').textContent, rows: [...document.querySelectorAll('#lobSel .cod-row small')].map(x => x.textContent) }; });
  await p.waitForTimeout(500); await p.screenshot({ path: SH + '/hh_lobby.png' });
  r.buy = await p.evaluate(() => { const A = window.__A; A.actions('hh-up-plant'); A.actions('hh-hero+'); A.actions('hh-hero-'); return A.hhL.load(); });
  // start
  await p.evaluate(() => { const A = window.__A; A.G.noRender = true; A.actions('hh-start'); });
  await p.waitForTimeout(9000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(1500);
  r.setup = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); return H ? { map: A.curMap, rifts: H.rifts.length, nodes: H.nodes.length, plant: H.plant.max, mats: Object.assign({}, H.mats), crew: A.enemies.filter(e => e.entry).length, field: !!H.field } : 'none'; });
  // the plant and a node close up
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); A.G.noRender = false; A.G.health = A.G.maxHp = 1e6; const o = A.openNearL ? A.openNearL(H.plant.x + 6, H.plant.z + 6) : { x: H.plant.x + 6, z: H.plant.z + 6 }; A.P.x = o.x; A.P.z = o.z; A.P.y = H.plant.y; A.P.yaw = Math.atan2(o.x - H.plant.x, o.z - H.plant.z); A.P.pitch = 0.2; });
  await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/hh_plant.png' });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), n = H.nodes.find(q => q.k === 'metal'); A.P.x = n.x + 2; A.P.z = n.z + 1; A.P.y = n.y; A.P.yaw = Math.atan2(2, 1); A.P.pitch = -0.35; });
  await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/hh_node.png' }); await p.evaluate(() => { window.__A.G.noRender = true; });
  // harvest a node
  r.harvest = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(), n = H.nodes[0], w0 = H.mats[n.k]; A.P.x = n.x + 1.2; A.P.z = n.z; A.P.y = n.y; A.P.yaw = Math.PI / 2; A.hhL.harvest(); A.hhL.harvest(); return { k: n.k, got: H.mats[n.k] - w0, hp: n.hp }; });
  // build a ring round the plant: walls on three sides, stairs, a floor, traps in front
  r.build = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), HH = A.HH_GET(), pl = H.plant; for (const k of ['wood', 'stone', 'metal']) H.mats[k] += 800; A.hhL.build(true); let ok = 0;
    const at = (x, z, yaw, pitch, piece, mat) => { A.P.x = pl.x + x; A.P.z = pl.z + z; A.P.y = pl.y; A.P.yaw = yaw; A.P.pitch = pitch || 0; HH.piece = piece; HH.mat = mat || 'wood'; A.camera.position.set(A.P.x, A.P.y + 1.7, A.P.z); A.camera.rotation.set(A.P.pitch, A.P.yaw, 0); A.camera.updateMatrixWorld(); const n = H.pieces.length; A.hhL.place(); if (H.pieces.length > n) ok++; };
    // walls on the edge of the 3x3 cells round the plant (yaw 0 = looking -z)
    for (const ix of [-1, 0, 1]) { at(ix * 3, -3, 0, 0, 0, 'wood'); at(ix * 3, 3, Math.PI, 0, 0, 'stone'); }
    for (const iz of [-1, 0, 1]) { at(-3, iz * 3, Math.PI / 2, 0, 0, 'metal'); }
    at(3, 0, -Math.PI / 2, 0, 2, 'wood');   // stairs going east
    at(6, -6, 0, 0, 3); at(6, 3, -Math.PI / 2, 0, 4); at(9, 0, -Math.PI / 2, 0, 5);   // spikes, zapper, resin
    return { ok, pieces: H.pieces.length, traps: H.traps.length, mats: Object.assign({}, H.mats), boxes: H.pieces.reduce((n, p) => n + p.boxes.length, 0) }; });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); A.G.noRender = false; A.G.health = A.G.maxHp = 1e6; A.P.x = H.plant.x + 8; A.P.z = H.plant.z + 8; A.P.y = H.plant.y + 0.1; A.P.yaw = Math.atan2(8, 8); A.P.pitch = -0.32; });
  await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/hh_build.png' });
  // build mode view: the ghost
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), HH = A.HH_GET(); A.P.x = H.plant.x - 6; A.P.z = H.plant.z + 9; A.P.yaw = Math.PI * 0.85; A.P.pitch = -0.2; HH.piece = 0; HH.mat = 'stone'; A.hhL.build(true); });
  await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/hh_ghost.png' });
  // the wave: everyone stands back, the burnouts walk in and hit the walls / traps
  r.wave = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); A.hhL.build(false); A.G.noRender = true; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; e.group.position.set(H.plant.x + 30, 0, H.plant.z + 30); }
    const hp0 = H.pieces.reduce((s, p) => s + p.hp, 0); A.hhL.wave(); await new Promise(r => setTimeout(r, 40000));
    return { wave: H.wave, mobs: H.mobs.length, spawned: H.queue.length - H.toSpawn, closest: H.mobs.length ? Math.min(...H.mobs.map(e => Math.hypot(e.group.position.x - H.plant.x, e.group.position.z - H.plant.z))).toFixed(1) : '-', bashing: H.mobs.filter(e => e.bash).length, pieceDmg: Math.round(hp0 - H.pieces.reduce((s, p) => s + p.hp, 0)), kills: H.kills, plant: H.plant.hp }; });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); const e = H.mobs[0]; if (e) { A.P.x = e.group.position.x + 5; A.P.z = e.group.position.z + 5; A.P.y = e.group.position.y; A.P.yaw = Math.atan2(5, 5); A.P.pitch = -0.15; } A.G.noRender = false; });
  await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/hh_wave.png' });
  // the boss + a spitter close up
  r.boss = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); const b = A.hhL.mob('boss', H.plant.x + 12, H.plant.z + 2, H.plant.y), s = A.hhL.mob('spitter', H.plant.x + 9, H.plant.z - 4, H.plant.y), m = A.hhL.mob('smasher', H.plant.x + 9, H.plant.z + 5, H.plant.y); A.P.x = H.plant.x + 19; A.P.z = H.plant.z + 1; A.P.y = H.plant.y; A.P.yaw = Math.PI / 2; A.P.pitch = 0.02; return { hp: b.hp, sc: b.K.sc }; });
  await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/hh_boss.png' });
  // finish the wave by force, the next waves, then the win
  r.win = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); A.G.noRender = true; const log = []; for (let w = 0; w < 8 && !H.over; w++) { log.push(H.wave + H.phase + H.mobs.length + '/' + H.toSpawn); for (const e of H.mobs.slice()) A.damageEnemy(e, 1e6, false, null, false, 'world'); H.toSpawn = 0; await new Promise(r => setTimeout(r, 1500)); if (H.phase === 'prep' && !H.over) A.hhL.wave(); }
    await new Promise(r => setTimeout(r, 3000)); A.G.noRender = false; return { log, wave: H.wave, phase: H.phase, over: H.over, res: H.res, state: A.G.state, save: A.hhL.load() }; });
  await p.waitForTimeout(800); await p.screenshot({ path: SH + '/hh_results.png' });
  return r;
};
