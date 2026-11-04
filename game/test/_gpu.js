// one real frame per map: draw calls and triangles for the whole frame (shadows + world + gun + glow passes)
module.exports = async p => p.evaluate(() => {
  const A = window.__A, r = A.renderer, out = {}; A.G.noRender = true; const h = document.getElementById('hcSplash'); if (h) h.remove();
  for (const id of (window.NAVT || ['metro', 'dispensary', 'maryjane', 'hightide', 'mauiwowie', 'blackwell', 'ruins_night', 'stackyard'])) {
    A.loadMap(id); const v = A.MAPS[id].views[0]; A.camera.position.set(v[0], v[1] + 0.3, v[2]); A.camera.lookAt(v[3], v[4], v[5]); A.camera.updateMatrixWorld();
    A.renderFrame(); r.info.autoReset = false; r.info.reset(); r.shadowMap.needsUpdate = true; A.renderFrame(); const c = r.info.render.calls, t = r.info.render.triangles; r.info.autoReset = true;
    let lights = 0, casters = 0; A.scene.traverse(o => { if (o.isPointLight || o.isSpotLight) lights++; if (o.isMesh && o.castShadow) casters++; });
    out[id] = { calls: c, tris: t, lights, casters, programs: r.info.programs.length };
  }
  return out;
});
