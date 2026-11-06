// FIELD UPGRADES: cover (blocks shots + sight), ammo crate, dead silence, rush; the FIELD button in Create a Class; a picture
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.openLoadout('menu'); });
  await p.waitForTimeout(600);
  r.btn = await p.evaluate(() => { const b = document.querySelector('[data-fub]'); const t0 = b.textContent; b.click(); return [t0, document.querySelector('[data-fub]').textContent].join(' -> '); });
  await p.evaluate(() => { const A = window.__A; A.activeClass().fu = 'cover'; A.showScreen('menu'); A.startMatch('tdm', { map: 'dispensary' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; }); await p.waitForTimeout(1500);
  r.hud = await p.evaluate(() => document.getElementById('fuHud').textContent);
  r.cover = await p.evaluate(() => { const A = window.__A; A.P.x = 0; A.P.z = 10; A.P.yaw = 0; A.FU.charge = 1; A.keys.KeyT = true; A.fuTick(0.016); A.keys.KeyT = false; A.fuTick(0.016); const c = A.FU.cover; return c ? { x: +c.x.toFixed(1), z: +c.z.toFixed(1), inWalls: A.wallMeshes.includes(c.hit), charge: A.FU.charge, pack: A.fuPack() } : null; });
  await p.evaluate(() => { const A = window.__A; A.P.z = 13; A.P.pitch = -0.1; }); await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, 'fu_cover.png'), timeout: 120000 });
  r.coverBreaks = await p.evaluate(() => { const A = window.__A, c = A.FU.cover; A.brkHit(c.id, 500); A.fuTick(0.016); return { broken: c.broken, gone: !A.FU.cover }; });
  r.ammo = await p.evaluate(() => { const A = window.__A; A.activeClass().fu = 'ammo'; const w = A.W[A.G.cur]; w.ammo = 1; w.reserve = 0; A.FU.charge = 1; A.fuUse(); return { ammo: w.ammo, reserve: w.reserve, crate: !!A.FU.ammo }; });
  r.silence = await p.evaluate(() => { const A = window.__A; A.activeClass().fu = 'silence'; A.FU.charge = 1; A.fuUse(); return A.FU.silenceT; });
  r.rush = await p.evaluate(() => { const A = window.__A; A.activeClass().fu = 'rush'; A.FU.charge = 1; A.fuUse(); return A.FU.rushT; });
  r.notReady = await p.evaluate(() => { const A = window.__A; A.FU.charge = 0.5; A.FU.rushT = 0; A.fuUse(); return A.FU.rushT; });
  await p.evaluate(() => { window.__A.activeClass().fu = 'cover'; });
  return r;
};
