// launch polish: error reports, save codes, block, word filter, controller reach: SHOTS=dir node run.js s_launch.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const shot = async (n, ms = 600) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms); await p.screenshot({ path: path.join(out, 'ln_' + n + '.png'), timeout: 120000 }); };
  await p.evaluate(() => { const s = document.getElementById('hcSplash'); if (s) s.remove(); });
  // word filter
  r.filter = await p.evaluate(() => { const { dzFilter, cleanNick, chatClean } = window.__A; return [dzFilter('you fucking n00b'), dzFilter('SH1T HEAD'), dzFilter('nice shot dude'), dzFilter('blaze it 420'), cleanNick('xXfuckXx'), chatClean('what the fuck')]; });
  // error report
  await p.evaluate(() => { setTimeout(() => { null.boom(); }, 10); });
  await p.waitForTimeout(500);
  r.err = await p.evaluate(() => { const e = document.getElementById('err'); return { shown: e.style.display, btns: e.querySelectorAll('button').length, log: JSON.parse(localStorage.getItem('ashfall.errlog') || '[]').length, where: (JSON.parse(localStorage.getItem('ashfall.errlog') || '[]').pop() || {}).where }; });
  await shot('error_box');
  await p.evaluate(() => document.querySelector('#err [data-errh]').click());
  r.errHidden = await p.evaluate(() => document.getElementById('err').style.display);
  // the settings ACCOUNT tab
  await p.evaluate(() => { window.__A.actions('settings'); });
  await p.waitForTimeout(400);
  await shot('settings_account');
  // save code: make it, change the save, load it back
  await p.evaluate(() => { localStorage.setItem('ashfall.test.marker', 'before'); window.__A.actions('sv-make'); });
  await p.waitForTimeout(1500);
  await shot('save_code');
  const code = await p.evaluate(() => document.querySelector('#lnOv textarea').value);
  r.code = { len: code.length, pre: code.slice(0, 10) };
  await p.evaluate(() => { document.getElementById('lnOv').remove(); localStorage.setItem('ashfall.test.marker', 'after'); window.__A.actions('sv-load'); });
  await p.waitForTimeout(400);
  await p.evaluate(c => { document.querySelector('#lnOv textarea').value = c; document.querySelector('#lnOv [data-lnload]').click(); }, code);
  await p.waitForTimeout(1500);
  r.confirm = await p.evaluate(() => document.querySelector('#lnOv .ln-msg').textContent);
  await shot('load_confirm');
  await p.evaluate(() => document.querySelector('#lnOv [data-lnload]').click());
  await p.waitForTimeout(4000);
  await p.waitForFunction(() => window.__A && window.__A.G.state === 'menu', null, { timeout: 120000 });
  r.afterLoad = await p.evaluate(() => localStorage.getItem('ashfall.test.marker'));
  // a bad code
  await p.evaluate(() => { const s = document.getElementById('hcSplash'); if (s) s.remove(); window.__A.actions('settings'); window.__A.actions('sv-load'); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { document.querySelector('#lnOv textarea').value = 'hello'; document.querySelector('#lnOv [data-lnload]').click(); });
  await p.waitForTimeout(600);
  r.badCode = await p.evaluate(() => document.querySelector('#lnOv .ln-msg').textContent);
  await p.evaluate(() => document.getElementById('lnOv').remove());
  // block from the pause menu list, then see it in settings
  r.block = await p.evaluate(() => { const A = window.__A; const side = document.getElementById('pzSide') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'pzSide' })); side._players = ['GRIEFER99', 'NICEGUY']; A.actions('bk-p0'); return { list: JSON.parse(localStorage.getItem('ashfall.block.v1')).names, blocked: A.lnBlocked('GRIEFER99'), other: A.lnBlocked('NICEGUY') }; });
  await p.evaluate(() => window.__A.actions('bk-list')); await p.waitForTimeout(400); await shot('blocked');
  await p.evaluate(() => { document.getElementById('lnOv').remove(); window.__A.actions('er-view'); }); await p.waitForTimeout(400); await shot('errors');
  // controller: the overlay is a nav modal
  r.pad = await p.evaluate(() => { const m = window.__A.navModal(); return { modal: m && m.id, n: window.__A.focusables().length }; });
  await p.evaluate(() => document.getElementById('lnOv').remove());
  return r;
};
