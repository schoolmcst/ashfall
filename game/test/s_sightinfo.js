module.exports = async p => p.evaluate(() => {
  const A = window.__A, out = [];
  const v = new THREE.Vector3();
  for (const d of A.ARMORY) {
    const g = A.buildGunModel(d, true), u = g.userData; g.updateMatrixWorld(true);
    let info = null;
    if (u.irons) {
      const pts = []; u.irons.traverse(o => { if (o.isMesh) { const a = o.geometry.attributes.position; for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); pts.push([v.x, v.y, v.z]); } } });
      if (pts.length) { const zs = pts.map(p => p[2]), zmin = Math.min(...zs), zmax = Math.max(...zs), mid = (zmin + zmax) / 2; const fr = pts.filter(p => p[2] < mid), re = pts.filter(p => p[2] >= mid);
        info = { zmin: +zmin.toFixed(3), zmax: +zmax.toFixed(3), frontY: fr.length ? +Math.max(...fr.map(p => p[1])).toFixed(4) : null, rearY: re.length ? +Math.max(...re.map(p => p[1])).toFixed(4) : null, n: pts.length }; }
    }
    out.push([d.id, d.cat, !!u.hq, u.railY !== undefined ? +u.railY.toFixed(4) : null, u.sightY !== undefined ? +u.sightY.toFixed(4) : null, info, d.optic || '', u.opticZ !== undefined ? +u.opticZ.toFixed(3) : null, u.pistol ? 'P' : '']);
  }
  return out;
});
