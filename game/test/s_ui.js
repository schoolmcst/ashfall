const path = require('path'), out = process.env.SHOTS || __dirname;
module.exports = async p => {
  await p.evaluate(() => { window.__A.toLobby(); });
  await p.waitForTimeout(800); await p.screenshot({ path: path.join(out, 'ui_lobby.png') });
  await p.evaluate(() => { window.__A.actions('custom'); });
  await p.waitForTimeout(400); await p.screenshot({ path: path.join(out, 'ui_custom.png') });
  await p.evaluate(() => { window.__A.toMenu(); });
  await p.waitForTimeout(300); await p.screenshot({ path: path.join(out, 'ui_menu.png') });
  await p.evaluate(() => { document.querySelector('[data-act="credits"]').click(); });
  await p.waitForTimeout(400); await p.screenshot({ path: path.join(out, 'ui_credits.png') });
  return p.evaluate(() => ({ news: document.querySelectorAll('#newsBody .cn-v').length, lobbyMap: document.querySelector('#lobSel [data-act="map+"]') ? 1 : 0 }));
};
