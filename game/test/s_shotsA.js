const path = require('path'), fs = require('fs');
module.exports = async p => {
  const out = process.env.SHOTS; fs.mkdirSync(out, { recursive: true });
  const ev = (f, a) => p.evaluate(f, a), shot = n => p.screenshot({ path: path.join(out, n + '.png') });
  await ev(() => window.__A.actions('loadout')); await p.waitForTimeout(800); await shot('a_loadout'); await ev(() => { const r = document.querySelector('.lo-right'); r.scrollTop = 99999; }); await p.waitForTimeout(300); await shot('a_loadout_adv');
  await ev(() => { window.__A.actions('lo-back'); window.__A.actions('settings'); const t = [...document.querySelectorAll('#tabs .tab')].find(b => b.textContent === 'CONTROLS'); t && t.click(); }); await p.waitForTimeout(400); await shot('a_settings');
  await ev(() => { window.__A.actions('settings-back'); window.__A.LOBBY.mode = 'otdm'; window.__A.actions('stats'); }); await p.waitForTimeout(400);
  await ev(() => { const b = document.querySelector('[data-which="on"], [data-st="on"]'); b && b.click(); }); await p.waitForTimeout(300); await ev(() => { const t = [...document.querySelectorAll('#career button, #career .tab')].find(b => b.textContent.trim() === 'MODES'); t && t.click(); }); await p.waitForTimeout(300); await shot('a_stats');
  return 1;
};
