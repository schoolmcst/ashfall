// progress pictures: loadout advanced stats (zone damage, max damage range) + controller focus ring + on-screen keyboard
const D = process.env.SHOTS || '/tmp';
module.exports = async p => {
  await p.waitForTimeout(2500); await p.evaluate(() => { const g = document.getElementById('hcGo'); g && g.click(); }); await p.waitForTimeout(700);
  await p.evaluate(() => { const A = window.__A; A.setActive(0); A.openLoadout(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { const a = document.querySelector('.lo-adv'); if (a) a.scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(300);
  await p.screenshot({ path: D + '/prog_stats.png' });
  await p.evaluate(() => { window.__A.toLobby(); });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { document.body.classList.add('padnav'); const b = document.querySelector('#lobby .cod-go'); b && b.focus(); });
  await p.waitForTimeout(300);
  await p.screenshot({ path: D + '/prog_padfocus.png' });
  const r = await p.evaluate(() => { const A = window.__A; let i = document.getElementById('frCode'); if (!i) { A.actions('settings'); const t = [...document.querySelectorAll('#tabs button')].find(b => /ACCOUNT/.test(b.textContent)); t && t.click(); i = document.querySelector('#settings input[type=text], #settings input:not([type])'); } if (!i) return 'no input'; i.focus(); A.oskOpen(i); A.oskKey('A'); A.oskKey('B'); A.oskKey('7'); return i.value; }).catch(e => 'err ' + e.message);
  await p.waitForTimeout(300);
  await p.screenshot({ path: D + '/prog_osk.png' });
  return { typed: r };
};
