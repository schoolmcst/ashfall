// WELCOME for new players, READY after training, NEW MODES for returning players, FEATURED tile, twists
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); localStorage.removeItem('ashfall.onb'); localStorage.removeItem('ashfall.newmodes'); window.__A.PROG.xp = 0; window.__A.showScreen('menu'); });
  for (let i = 0; i < 12 && !(await p.evaluate(() => !!document.querySelector('[data-onb="go"]'))); i++) await p.waitForTimeout(500);
  r.welcome = await p.evaluate(() => { const o = document.querySelector('.onb-ov'); return o ? o.querySelector('b').textContent : null; });
  await p.screenshot({ path: path.join(out, 'onb_welcome.png') });
  r.tiles = await p.evaluate(() => [document.getElementById('featTile') && document.getElementById('featTile').textContent, !!document.getElementById('brTile')]);
  await p.evaluate(() => (document.querySelector('[data-onb="go"]') || { click() {} }).click());
  await p.waitForTimeout(6000); r.range = await p.evaluate(() => window.__A.M.mode);
  r.rg = await p.evaluate(() => { window.__A.RG.finished = true; return Object.keys(window.__A.RG); }); await p.waitForTimeout(3500); r.rgAfter = await p.evaluate(() => window.__A.RG.finished);
  r.ready = await p.evaluate(() => { const o = document.querySelector('.onb-ov'); return o ? o.querySelector('b').textContent : null; });
  await p.screenshot({ path: path.join(out, 'onb_ready.png') });
  await p.evaluate(() => { (document.querySelector('[data-onb="stay"]') || { click() {} }).click(); window.__A.leaveGame(); window.__A.PROG.xp = 5000; localStorage.removeItem('ashfall.newmodes'); window.__A.showScreen('menu'); });
  for (let i = 0; i < 12 && !(await p.evaluate(() => !!document.querySelector('[data-onb="ok"]'))); i++) await p.waitForTimeout(500);
  r.newModes = await p.evaluate(() => { const o = document.querySelector('.onb-ov'); return o ? o.querySelector('b').textContent : null; });
  r.playlist = await p.evaluate(() => window.__A.LOBBY.playlist);
  await p.screenshot({ path: path.join(out, 'onb_new.png') });
  await p.evaluate(() => (document.querySelector('[data-onb="ok"]') || { click() {} }).click());
  await p.waitForTimeout(500); await p.screenshot({ path: path.join(out, 'onb_menu.png') });
  // the featured tile
  await p.evaluate(() => document.getElementById('featTile').click()); await p.waitForTimeout(5000);
  r.feat = await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; return { mode: A.M.mode, feat: A.M.feat }; });
  await p.waitForTimeout(3000);
  r.twist = await p.evaluate(() => { const A = window.__A; return { bighead: A.enemies.filter(e => e.featBH).length, enemies: A.enemies.length }; });
  return r;
};
