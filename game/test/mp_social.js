// desktop-app multiplayer: three pages, real WebRTC between them, a local stand-in signalling server
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const PORT = 39555; await require('./sigserver.js')(PORT);
  const html = fs.readFileSync(require('path').join(__dirname, '..', 'ashfall.html'), 'utf8'), three = fs.readFileSync(require('path').join(__dirname, '..', '..', 'tools', 'three.min.js'), 'utf8');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const initFn = port => {
    for (const t of ['blur', 'visibilitychange']) { window.addEventListener(t, e => e.stopImmediatePropagation(), true); document.addEventListener(t, e => e.stopImmediatePropagation(), true); }
    const W = window.WebSocket; window.WebSocket = function (u, p) { return new W(String(u).replace('wss://0.peerjs.com:443', 'ws://127.0.0.1:' + port), p); }; window.WebSocket.prototype = W.prototype; Object.assign(window.WebSocket, { OPEN: 1, CLOSED: 3 });
    const lan = []; window.ASHFALL_APP = { version: '1.0.0', lan: { announce: g => { window.__ann = g; }, games: () => lan } };
  };
  const browsers = [b];
  const route = r => { const u = r.request().url(); if (u.includes('three')) return r.fulfill({ body: three, contentType: 'application/javascript' }); if (u.startsWith('http://game.test/')) return r.fulfill({ body: html, contentType: 'text/html' }); return r.abort(); };
  const errs = [], pages = [];
  for (let i = 0; i < 2; i++) { const bb = i === 0 ? b : await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-features=WebRtcHideLocalIpsWithMdns'] }); browsers.push(bb);
    const ctx = await bb.newContext({ viewport: { width: 1280, height: 720 } }); await ctx.addInitScript(initFn, PORT); await ctx.route('**/*', route); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(i + ' PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push(i + ' CONSOLE ' + m.text()); }); await p.goto('http://game.test/index.html#debug'); pages.push(p); }
  for (const p of pages) await p.waitForFunction(() => window.__A && window.__A.G.state === 'menu', null, { timeout: 120000 });
  const [A, B] = pages, ev = (p, f, a) => p.evaluate(f, a);
  for (const [p, n] of [[A, 'ALPHA'], [B, 'BRAVO']]) await ev(p, n => { const A_ = window.__A; A_.NET.nick = n; A_.G.noRender = true; A_.LOBBY.playlist = ['otdm']; A_.toLobby(); }, n);
  await A.waitForTimeout(8000);
  const codeA = await ev(A, () => document.querySelector('.fcode').textContent);
  await ev(B, c => { document.getElementById('frCode').value = c; document.getElementById('frAdd').click(); }, codeA);
  await A.waitForTimeout(7000);
  const toast = await ev(A, () => { const t = document.querySelector('.fr-toast'); return t ? t.innerText : null; });
  await A.screenshot({ path: 'soc_request_A.png' });
  await ev(A, () => { const b = document.querySelector('.fr-toast [data-fa="1"]'); b && b.click(); });
  await A.waitForTimeout(5000);
  const fa = await ev(A, () => JSON.parse(localStorage.getItem('ashfall.friends.v1') || '[]').map(f => f.n));
  const fb = await ev(B, () => JSON.parse(localStorage.getItem('ashfall.friends.v1') || '[]').map(f => f.n));
  await ev(B, () => { window.__A.toLobby(); }); await A.waitForTimeout(12000);
  await B.screenshot({ path: 'soc_lobby_B.png' });
  const onB = await ev(B, () => document.getElementById('partyBox').innerText.split('\n').slice(0, 14).join(' | '));
  await ev(B, () => document.getElementById('lbOpen').click()); await A.waitForTimeout(800); await B.screenshot({ path: 'soc_lb_B.png' });
  console.log(JSON.stringify({ codeA, toast, fa, fb, onB }, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 20).join('\n') : 'NO ERRORS');
  for (const x of browsers) await x.close().catch(() => {}); process.exit(0);
})();
