// class rename from the Weapons tab: pencil -> type -> Enter, name sticks and shows in the class pick
module.exports = async p => {
  await p.evaluate(() => window.__A.openLoadout());
  await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelector('[data-lo-ren1="2"]').click());
  await p.waitForTimeout(300);
  await p.fill('#loRenameIn', 'sniper <b>main');
  await p.press('#loRenameIn', 'Enter');
  await p.waitForTimeout(400);
  await p.screenshot({ path: (process.env.SHOTS || '/tmp') + '/rename.png' });
  return await p.evaluate(() => ({ tabs: [...document.querySelectorAll('#loTabs [data-lo-c]')].map(b => b.textContent), saved: JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /class/i.test(k))) || 'null') ? 'yes' : 'no', active: window.__A.CLASSES[2].name }));
};
