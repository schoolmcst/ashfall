// keybinds editor + melee
const path = require('path');
module.exports = async p => {
  await p.evaluate(() => { document.querySelector('[data-act="settings"]').click(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { [...document.querySelectorAll('#tabs .tab')].find(b => b.textContent === 'KEYBINDS').click(); });
  await p.waitForTimeout(200);
  await p.evaluate(() => { const rows = [...document.querySelectorAll('#setBody .setrow')]; rows.find(r => r.textContent.startsWith('MELEE')).querySelector('button').click(); });
  await p.keyboard.press('KeyB');
  await p.waitForTimeout(200);
  if (process.env.SHOTS) await p.screenshot({ path: path.join(process.env.SHOTS, 'ui_keys.png') });
  const bound = await p.evaluate(() => ({ melee: window.__A.S.binds && window.__A.S.binds.melee, label: [...document.querySelectorAll('#setBody .setrow')].find(r => r.textContent.startsWith('MELEE')).querySelector('button').textContent }));
  // swap: bind melee to R (reload) -> reload moves to B
  await p.evaluate(() => { const rows = [...document.querySelectorAll('#setBody .setrow')]; rows.find(r => r.textContent.startsWith('MELEE')).querySelector('button').click(); });
  await p.keyboard.press('KeyR'); await p.waitForTimeout(100);
  const swapped = await p.evaluate(() => ({ melee: window.__A.S.binds.melee, reload: window.__A.S.binds.reload }));
  const mel = await p.evaluate(async () => {
    const A = window.__A; A.startMatch('surv', { map: 'ruins' }); A.G.breakT = 1e9;
    for (const e of A.enemies.slice()) A.damageEnemy(e, 1e6, false, new THREE.Vector3(1, 0, 0), false, 'world');
    await new Promise(r => setTimeout(r, 300));
    A.P.yaw = 0; const e = A.makeEnemy('rifleman', A.P.x, A.P.z - 1.6); A.enemies.push(e); e.hp = 120; e.speed = 0;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyR' }));
    await new Promise(r => setTimeout(r, 500));
    return { meleeT: A.G.meleeT, alive: A.enemies.includes(e), hp: e.hp };
  });
  await p.evaluate(() => { window.__A.S.binds = {}; });
  return { bound, swapped, mel };
};
