module.exports = async p => p.evaluate(async () => {
  const A = window.__A, r = A.renderer, out = {};
  for (const id of (window.NAVT || ['ruins', 'docks', 'town', 'metro'])) {
    const t = performance.now(); A.loadMap(id); const ms = Math.round(performance.now() - t);
    const cam = new THREE.PerspectiveCamera(70, 16 / 9, 0.05, 500); const L = A.LAYOUT.spawn[0]; cam.position.set(L.x, (L.y || 0) + 1.7, L.z); cam.lookAt(0, (L.y || 0) + 1, 0);
    r.info.autoReset = false; r.info.reset(); r.render(A.scene, cam); const calls = r.info.render.calls, tris = r.info.render.triangles; r.info.autoReset = true;
    let meshes = 0; A.scene.traverse(o => { if (o.isMesh) meshes++; });
    out[id] = { loadMs: ms, calls, tris, meshes, rayMeshes: A.boxes.length };
  }
  return out;
});
