// pictures of the main menu and the lobby (before/after the clean-up)
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); });
  await p.waitForTimeout(2500); await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); });
  await p.screenshot({ path: path.join(out, (process.env.TAG || '') + 'menu.png'), timeout: 120000 });
  for (const act of (process.env.ACTS || 'go-off,go-on').split(',')) {
    await p.evaluate(a => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.showScreen('menu'); window.__A.actions(a); }, act);
    await p.waitForTimeout(2000); await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); });
    await p.screenshot({ path: path.join(out, (process.env.TAG || '') + 'lobby_' + act + '.png'), timeout: 120000 });
  }
  return await p.evaluate(() => ({ screen: window.__A.curScreen }));
};
