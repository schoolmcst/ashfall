const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.startMatch('br', { map: 'random', squad: 4 }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const A = window.__A; const m = A.enemies.filter(e => e.team === 0); A.P.x = 2; A.P.z = 8; A.P.y = 0; A.P.yaw = 0; A.P.pitch = -0.2;
    m.forEach((e, i) => { e.spawnProt = 0; e.group.position.set(-2 + i * 2, 0, 3); }); m[0].spawnProt = 0; A.damageEnemy(m[0], 999, false, null, false, 'world'); m[0].group.position.set(0.8, 0, 6.6); });
  await p.waitForTimeout(1800); await p.screenshot({ path: path.join(out, 'sq_downed_mate.png'), timeout: 120000 });
};
