// how many shader programs get compiled AFTER a match starts (each one is a hitch): fight, explosions, ragdolls, smoke
module.exports = async p => {
  const mode = process.env.MODE || 'tdm', map = process.env.MAP || 'metro';
  await p.evaluate(([mode, map]) => { const h = document.getElementById('hcSplash'); if (h) h.remove(); window.__A.startMatch(mode, { map }); }, [mode, map]);
  await p.waitForTimeout(7000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; });
  await p.waitForTimeout(2500);
  const r = { atGo: await p.evaluate(() => window.__A.renderer.info.programs.length) };
  await p.evaluate(() => { const A = window.__A, v = new THREE.Vector3(A.P.x - Math.sin(A.P.yaw) * 6, 0.5, A.P.z - Math.cos(A.P.yaw) * 6); A.explode(v, 6, 'player', 0); for (const e of A.enemies.slice(0, 3)) { e.spawnProt = 0; A.damageEnemy(e, 9999, true, new THREE.Vector3(0, 0, 1), false, 'player'); } A.G.fireT = 0; const w = A.W[A.G.cur]; w.ammo = 30; A.shoot(false); A.throwGrenade && 0; });
  await p.waitForTimeout(6000);
  r.after = await p.evaluate(() => window.__A.renderer.info.programs.length); r.newDuringMatch = r.after - r.atGo;
  return r;
};
