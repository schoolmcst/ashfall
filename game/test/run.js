// usage: node run.js <scenario.js> [hash]  -- loads ashfall.html in headless chromium with real three r128
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const scen = process.argv[2], hash = process.argv[3] || '#debug';
  const html = fs.readFileSync(process.env.GAME || require('path').join(__dirname, '..', 'ashfall.html'), 'utf8');
  const three = fs.readFileSync(process.env.THREE || require('path').join(__dirname, '..', '..', 'tools', 'three.min.js'), 'utf8');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  if (process.env.NOREALTEX) await p.addInitScript(() => { window.NO_REALTEX = 1; });
  if (process.env.NCS) await p.addInitScript(v => { window.NCS = v; }, process.env.NCS);
  if (process.env.NAVT) await p.addInitScript(v => { window.NAVT = JSON.parse(v); }, process.env.NAVT);
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); if (m.text().startsWith('T:')) console.log(m.text()); });
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('three')) return r.fulfill({ body: three, contentType: 'application/javascript' });
    if (u.startsWith('https://dl.polyhaven.org/')) { const f = /nor_gl/.test(u) ? 'nor' : /_rough_/.test(u) ? 'rough' : 'diff'; return r.fulfill({ body: fs.readFileSync(path.join(__dirname, 'fx', f + '.jpg')), contentType: 'image/jpeg', headers: { 'Access-Control-Allow-Origin': '*' } }); }
    if (u.startsWith('http://game.test/')) return r.fulfill({ body: html, contentType: 'text/html' });
    return r.abort();
  });
  await p.goto('http://game.test/index.html' + hash);
  await p.waitForFunction(() => window.__A && window.__A.G.state === 'menu', null, { timeout: 120000 }).catch(e => errs.push('BOOT TIMEOUT'));
  let res = null;
  try { res = await require(path.resolve(scen))(p); } catch (e) { errs.push('SCEN ' + e.message); }
  const errText = await p.evaluate(() => document.getElementById('err') && document.getElementById('err').textContent);
  if (errText) errs.push('ERRBOX ' + errText);
  console.log(JSON.stringify(res, null, process.env.COMPACT ? 0 : 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  await b.close();
})();
