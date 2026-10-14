// damage range: loadout graph pictures + a table of every gun for the spreadsheet
const fs = require('fs'), D = process.env.SHOTS || '/tmp';
module.exports = async p => {
  await p.waitForTimeout(2500); await p.evaluate(() => { const g = document.getElementById('hcGo'); g && g.click(); }); await p.waitForTimeout(600);
  const shot = async (cls, name, prevId) => {
    await p.evaluate(([c, pid]) => { const A = window.__A; A.setActive(c); A.openLoadout(); if (pid) { const b = document.querySelector(`[data-lo-w="${pid}"]`); if (b) b.dispatchEvent(new Event('focus')); if (b) b.focus(); } }, [cls, prevId]);
    await p.waitForTimeout(700);
    await p.evaluate(() => { const r = document.querySelector('.lo-range'); if (r) r.scrollIntoView({ block: 'center' }); });
    await p.waitForTimeout(300); await p.screenshot({ path: `${D}/range_${name}.png` });
  };
  await shot(0, 'ar_m4', null);
  await shot(0, 'ar_vs_ak', 'kv47');
  await shot(1, 'smg_viper', null);
  await shot(3, 'recon', null);
  const rows = await p.evaluate(() => window.__A.ARMORY.filter(d => d.cat !== 'la').map(d => ({ id: d.id, name: d.name, cat: d.cat, dmg: d.dmg, head: d.head, pellets: d.pellets, rpm: Math.round(60 / d.interval), burst: d.burst || 0, eff: d.eff, fallMin: d.fallMin, mag: d.mag, ads: Math.round(d.ads * 180), move: d.move })));
  fs.writeFileSync(D + '/guns.json', JSON.stringify(rows));
  return rows.length;
};
