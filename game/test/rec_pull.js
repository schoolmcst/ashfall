// records a real chance box opening that lands a secret camo (REAPER for the M4A1), then the Locker
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2];
(async () => {
  const html = fs.readFileSync('/home/claude/repo/game/ashfall.html', 'utf8'), three = fs.readFileSync('/home/claude/repo/tools/three.min.js', 'utf8');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: OUT, size: { width: 1280, height: 720 } } });
  await ctx.addInitScript(() => { try { localStorage.setItem('dz_seen_update', '1.2.0'); localStorage.setItem('ashfall.prog.v1', JSON.stringify({ v: 1, xp: 64000, dz: 1700, owned: { woodland: 1, tiger: 1, c_forest_fleck: 1 }, equip: { all: null, guns: {} }, stk: { all: null, guns: {} }, daily: { last: '', streak: 0 }, boxes: 3, drops: [], init: true })); } catch (e) {} });
  const p = await ctx.newPage(); const t0 = Date.now(); const marks = {};
  await p.route('**/*', r => { const u = r.request().url(); if (u.includes('three')) return r.fulfill({ body: three, contentType: 'application/javascript' }); if (u.startsWith('http://game.test/')) return r.fulfill({ body: html, contentType: 'text/html' }); return r.abort(); });
  await p.goto('http://game.test/index.html#debug');
  await p.waitForFunction(() => window.__A && window.__A.G.state === 'menu', null, { timeout: 120000 });
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); const A = window.__A, rr = A.renderer.render.bind(A.renderer); A.renderer.render = (s, c) => (s === A.scene ? undefined : rr(s, c)); window.__A.toLobby(); });
  await p.waitForTimeout(1200);
  await p.click('#lobby [data-act="rewards"]'); await p.waitForTimeout(1800);
  await p.hover('[data-act="rw-box-std"]'); await p.waitForTimeout(700);
  // the next three random numbers: secret tier, REAPER, the M4A1 (first gun)
  await p.evaluate(() => window.__A.forceBox('x_reaper', 'marc'));
  await p.click('[data-act="rw-box-std"]'); marks.click = (Date.now() - t0) / 1000;
  await p.waitForSelector('#secVid', { timeout: 15000 }); marks.video = (Date.now() - t0) / 1000;
  await p.waitForSelector('#secVid', { state: 'detached', timeout: 15000 }); marks.videoEnd = (Date.now() - t0) / 1000;
  await p.waitForTimeout(2200);
  await p.click('[data-act="rw-box-equip"]'); await p.waitForTimeout(1500);
  await p.click('[data-act="rw-back"]'); await p.waitForTimeout(800);
  await p.click('#lobby [data-act="locker"]'); await p.waitForTimeout(6000);
  await p.click('[data-lkgun="marc"]'); await p.waitForTimeout(4500);
  await p.click('[data-act="lk-reveal"]').catch(() => {}); await p.waitForTimeout(400);
  await p.keyboard.press('Escape'); await p.waitForTimeout(2500);
  marks.end = (Date.now() - t0) / 1000;
  const res = await p.evaluate(() => window.__A.BOXV.res ? window.__A.BOXV.res.it.id : (window.__A.PROG.drops[0] || {}).id);
  await ctx.close(); await b.close();
  fs.writeFileSync(path.join(OUT, 'marks.json'), JSON.stringify(Object.assign(marks, { res })));
  console.log(JSON.stringify(marks), res);
})();
