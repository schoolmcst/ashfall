// ADS screenshots: GUNS='[["marc","irons"],["marc","reddot"],...]'
const path = require('path'), fs = require('fs');
module.exports = async p => {
  const list = JSON.parse(process.env.GUNS), out = process.env.SHOTS;
  await p.evaluate(() => { const A = window.__A; A.startMatch('surv', { map: 'ruins' }); A.G.breakT = 1e9; for (const e of A.enemies.slice()) A.damageEnemy(e, 1e6, false, new THREE.Vector3(1, 0, 0), false, 'world'); });
  await p.waitForTimeout(800);
  for (const [id, optic] of list) {
    await p.evaluate(([id, optic]) => {
      const A = window.__A, d = A.ARM[id], pri = A.ARMORY.find(x => x.id === id) && ['ar', 'smg', 'lmg', 'mr', 'sr', 'sg'].includes(d.cat);
      A.ATTS[id] = optic ? { optic } : {};
      A.equipClass({ p: pri ? id : 'marc', s: pri ? 'sidearm' : id, e: 'frag', k: 'none' }); if (!pri) A.switchWeapon(1);
      A.G.swapT = 0; A.G.look = { x: -3.5, z: 10.5, yaw: 0.05, pitch: -0.02 }; A.G.lookAds = true; A.G.health = 1e9;
    }, [id, optic]);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(out, `ads_${id}_${optic || 'def'}.png`), clip: { x: 440, y: 160, width: 400, height: 400 } });
  }
  return list.length;
};
