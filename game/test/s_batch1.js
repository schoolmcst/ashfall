// batch 1 (1.2.83): loadout codes round trip, photo mode (free camera, filter, save, back), on a real match
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); });
  // loadout code: make from class 1, apply onto class 2, compare
  r.lc = await p.evaluate(() => { const A = window.__A; const code = A.lcMake(); A.setActive(1); const before = JSON.stringify([A.activeClass().p, A.activeClass().s]); const got = A.lcApply(code); A.setActive(0); return { code: code.slice(0, 14) + '…', len: code.length, before, got, bad: A.lcApply('hello') }; });
  await p.evaluate(() => { window.__A.openLoadout('menu'); }); await p.waitForTimeout(700);
  r.lcButtons = await p.evaluate(() => [...document.querySelectorAll('[data-lcb]')].map(b => b.textContent).join('/'));
  await p.evaluate(() => document.querySelector('[data-lcb="share"]').click()); await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(out, 'b1_share.png'), timeout: 120000 });
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov')) o.remove(); window.__A.showScreen('menu'); });
  // photo mode in a match
  await p.evaluate(() => window.__A.startMatch('tdm', { map: 'random' })); await p.waitForTimeout(5000);
  await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const A = window.__A; A.pauseGame(); }); await p.waitForTimeout(500);
  r.pauseBtn = await p.evaluate(() => !!document.querySelector('#pause [data-act="photo"], [data-act="photo"]'));
  await p.evaluate(() => window.__A.actions('photo')); await p.waitForTimeout(300);
  await p.evaluate(() => { const K = window.__A.PHOTO.keys; K.KeyW = true; K.KeyE = true; }); await p.waitForTimeout(1500);
  await p.keyboard.press('KeyF'); await p.keyboard.press('KeyF'); await p.waitForTimeout(400);
  r.photo = await p.evaluate(() => { const A = window.__A, P0 = A.PHOTO; P0.keys.KeyW = false; P0.keys.KeyE = false; return { on: P0.on, st: A.G.state, moved: +Math.hypot(P0.x - P0.from.px, P0.z - P0.from.pz).toFixed(1), up: +(P0.y - P0.from.py).toFixed(1), filt: A.PHOTO.filt, hud: document.getElementById('hud').style.visibility }; });
  await p.screenshot({ path: path.join(out, 'b1_photo.png'), timeout: 120000 });
  const dl = p.waitForEvent('download', { timeout: 20000 }).catch(() => null); await p.keyboard.press('Enter'); const d = await dl; r.saved = d ? d.suggestedFilename() : 'no download';
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  r.back = await p.evaluate(() => ({ st: window.__A.G.state, scr: window.__A.curScreen, hud: document.getElementById('hud').style.visibility }));
  return r;
};
