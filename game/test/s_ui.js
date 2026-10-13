const path = require('path'), out = process.env.SHOTS || __dirname;
module.exports = async p => {
  await p.evaluate(() => { window.__A.toLobby(); });
  await p.waitForTimeout(800); await p.screenshot({ path: path.join(out, 'ui_lobby.png') });
  await p.evaluate(() => { document.querySelector('[data-act="map+"]').click(); document.querySelector('[data-act="map+"]').click(); });
  await p.waitForTimeout(300); await p.screenshot({ path: path.join(out, 'ui_lobby2.png') });
  await p.evaluate(() => { window.__A.toMenu(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelector('[data-act="credits"]').click(); });
  await p.waitForTimeout(400); await p.screenshot({ path: path.join(out, 'ui_credits.png') });
  return p.evaluate(() => ({ lobbyMap: document.querySelector('.lob-map b') ? 1 : 0 }));
};
