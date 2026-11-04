// the plain UAV: enemies on the minimap only (no on-screen marks); ADVANCED UAV: on screen too; LAST TOKE loot is off the minimap
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.startMatch('tdm', { map: 'random' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; });
  await p.waitForTimeout(2000);
  const marks = () => p.evaluate(() => { const l = document.getElementById('uavMarks'); return l ? [...l.children].filter(i => i.style.display !== 'none').length : -1; });
  r.before = { seen: await p.evaluate(() => window.__A.enemies.filter(e => window.__A.stkSeen(e)).length), marks: await marks() };
  await p.evaluate(() => { const A = window.__A; A.STK.uavT = 25; A.STK.vuav = false; }); await p.waitForTimeout(1500);
  r.uav = { seen: await p.evaluate(() => window.__A.enemies.filter(e => window.__A.stkSeen(e)).length), marks: await marks() };
  await p.screenshot({ path: path.join(out, 'uav_plain.png'), timeout: 120000 });
  await p.evaluate(() => { const A = window.__A; A.STK.uavT = 35; A.STK.vuav = true; }); await p.waitForTimeout(1500);
  r.adv = { seen: await p.evaluate(() => window.__A.enemies.filter(e => window.__A.stkSeen(e)).length), marks: await marks() };
  // LAST TOKE: loot markers exist on screen but not on the minimap
  await p.evaluate(() => { window.__A.leaveGame(); }); await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__A.startMatch('br', { map: 'random' }); }); await p.waitForTimeout(5000);
  await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; }); await p.waitForTimeout(2500);
  r.br = await p.evaluate(() => ({ lootOnScreen: window.__A.markerList().filter(m => m.t === 'LOOT').length }));
  await p.screenshot({ path: path.join(out, 'br_radar.png'), timeout: 120000 });
  return r;
};
