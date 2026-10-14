module.exports = async p => {
  await p.evaluate(() => { const A = window.__A; A.startMatch('surv', { map: 'ruins' }); A.G.breakT = 1e9; for (const e of A.enemies.slice()) A.damageEnemy(e, 1e6, false, new THREE.Vector3(1, 0, 0), false, 'world'); });
  await p.waitForTimeout(800);
  const info = await p.evaluate(() => { const A = window.__A; delete A.ATTS.marc; A.equipClass({ p: 'marc', s: 'sidearm', e: 'frag', k: 'none' }); A.G.swapT = 0; A.G.look = { x: -3.5, z: 10.5, yaw: 0.05, pitch: -0.02 }; A.G.lookAds = true;
    const w = A.W[0], u = A.gunObjs[0].userData; return { optic: w.optic, factory: w.factory, dots: u.dots.length, stock: u.stockOptic ? u.stockOptic.map(o => o.visible) : null, sightY: w.sightY, atts: JSON.stringify(A.ATTS.marc || null) }; });
  for (let k = 0; k < 40; k++) { await p.waitForTimeout(250); if (await p.evaluate(() => window.__A.G.ads > 0.995)) break; }
  await p.waitForTimeout(400); await p.screenshot({ path: process.env.SHOTS + '/marc_default.png', clip: { x: 440, y: 160, width: 400, height: 400 } });
  const info2 = await p.evaluate(() => { const A = window.__A, u = A.gunObjs[0].userData; return u.dots.map(d => ({ vis: d.visible, y: +d.position.y.toFixed(4), z: +d.position.z.toFixed(4), par: !!d.parent })); });
  return { info, info2 };
};
