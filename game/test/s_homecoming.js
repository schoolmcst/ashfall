// Project Homecoming splash shows once on the menu, closes with Enter, news shows the update name
const D = process.env.SHOTS || '/tmp';
module.exports = async p => {
  await p.waitForTimeout(2500);
  const shown = await p.evaluate(() => !!document.getElementById('hcSplash'));
  await p.waitForTimeout(7000);
  const still = await p.evaluate(() => { const m = document.getElementById('hcSplash'); return m ? [m.className, getComputedStyle(m).opacity, getComputedStyle(m).display, m.getBoundingClientRect().height] : null; });
  await p.screenshot({ path: D + '/homecoming.png' });
  await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  const gone = await p.evaluate(() => !document.getElementById('hcSplash'));
  await p.screenshot({ path: D + '/homecoming_menu.png' });
  const again = await p.evaluate(() => window.__A.hcShow(false));
  return { still, shown, gone, again, news: await p.evaluate(() => document.querySelector('.cn-name') && document.querySelector('.cn-name').textContent) };
};
