// OPTIMISATION numbers: fixed views on 3 maps, draw calls / triangles / CPU ms to draw, plus game logic ms in a 12-bot match
module.exports = async p => {
  const res = {}, ids = (process.env.MAPS || 'docks,funfair,stashisle').split(','), Q = process.env.Q || 'high';
  await p.evaluate(Q => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); const A = window.__A; A.G.noRender = true; A.applyPreset(Q); A.S.quality = Q; A.applyVideoSettings(); }, Q);
  for (const id of ids) {
    res[id] = await p.evaluate(id => { const A = window.__A; const t0 = performance.now(); (A.loadMapL || A.loadMap)(id); const load = Math.round(performance.now() - t0); for (let i = 0; i < 3; i++) A.tickL(0.016);
      A.renderer.setSize(960, 540, false); A.camera.aspect = 16 / 9; A.camera.updateProjectionMatrix(); const vs = (A.MAPS[id].views || []).slice(0, 4), out = { load, views: [] };
      for (const v of vs) { A.camera.position.set(v[0], v[1] + 0.3, v[2]); A.camera.lookAt(v[3], v[4], v[5]); A.camera.updateMatrixWorld(); A.renderFrame(); A.renderFrame();
        A.renderer.info.reset(); const t = performance.now(); A.renderFrame(); const ms = performance.now() - t; const r = A.renderer.info.render; out.views.push([r.calls, Math.round(r.triangles / 1000), Math.round(ms)]); }
      out.mem = [A.renderer.info.memory.geometries, A.renderer.info.memory.textures, (A.renderer.info.programs || []).length]; out.scene = A.scene.children.length; return out; }, id);
  }
  // game logic cost: a 12-bot TDM, ticks only
  res.logic = await p.evaluate(async () => { const A = window.__A; A.startMatch('tdm', { map: 'docks', perTeam: 6 }); await new Promise(r => setTimeout(r, 9000)); A.G.holdT = 0.01; A.G.loadT = 0; await new Promise(r => setTimeout(r, 1500)); if (A.G.state === 'paused') { A.G.state = 'playing'; A.showScreen(null); } A.G.health = A.G.maxHp = 1e9;
    for (let i = 0; i < 30; i++) A.tickL(1 / 60); const t = performance.now(); for (let i = 0; i < 300; i++) A.tickL(1 / 60); return { msPerTick: +((performance.now() - t) / 300).toFixed(2), bots: A.enemies.length }; });
  return res;
};
