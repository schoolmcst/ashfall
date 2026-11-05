// the desktop-app lobby (party box + chat) after the compact clean-up
const path = require('path');
module.exports = async p => {
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.NET.app = { version: '1.0.0' }; try { window.ASHFALL_APP = window.ASHFALL_APP || { version: '1.0.0' }; } catch (e) {} A.showScreen('menu'); A.actions('go-on'); });
  await p.waitForTimeout(2500); await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); });
  await p.screenshot({ path: path.join(process.env.SHOTS || '/tmp', 'applobby.png'), timeout: 120000 });
  return await p.evaluate(() => document.getElementById('lobRoster').innerText.slice(0, 300));
};
