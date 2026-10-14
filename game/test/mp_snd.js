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
  for (const [p, n] of [[A, 'ALPHA'], [B, 'BRAVO']]) { await ev(p, n => { const A_ = window.__A; A_.NET.nick = n; A_.G.noRender = true; A_.LOBBY.mode = 'osnd'; A_.startMatch('osnd'); }, n); await A.waitForTimeout(n === 'ALPHA' ? 9000 : 10000); }
  for (const p of [A, B]) await ev(p, () => { const G = window.__A.G; if (G.state === 'paused') G.state = 'playing'; window.__A.NET.warmEnd = 0; });
  await A.waitForTimeout(8000);
  const host = await ev(A, () => !!(window.__A.NET.room && window.__A.NET.room.host)), H = host ? A : B, C = host ? B : A;
  const st = p => ev(p, () => { const A_ = window.__A, M = A_.M, sn = M.snd; return { mode: M.mode, round: sn && sn.round, state: sn && sn.state, att: sn && sn.att, wins: sn && sn.wins, bomb: sn && !!sn.bomb, my: M.myTeam, gs: A_.G.state, alive: M.me.alive, rem: [...A_.NET.rem.values()].filter(R => !R.isBot).length, bots: M.entries.filter(e => e.botLabel).length }; });
  const s1 = { host: await st(H), client: await st(C) };
  // force the client onto the attacking side next to site A and finish a plant there
  await ev(H, () => { const A_ = window.__A, sn = A_.M.snd; sn.state = 'live'; sn.t = 90; for (const e of A_.enemies) e.cd = 1e9; });
  const cTeam = await ev(C, () => window.__A.M.myTeam);
  await ev(H, t => { window.__A.M.snd.att = t; }, cTeam);
  await A.waitForTimeout(1500);
  await ev(C, () => { const A_ = window.__A, s = A_.LAYOUT.sites[0]; Object.assign(A_.P, { x: s.x, z: s.z, y: s.y || 0 }); A_.G.spawnProt = 1e9; A_.G.health = 1e9; A_.NET.sa = ['p', 0, 99]; });
  await A.waitForTimeout(4000);
  const s2 = { host: await st(H), client: await st(C) };
  console.log(JSON.stringify({ s1, s2 }, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 20).join('\n') : 'NO ERRORS');
  for (const x of browsers) await x.close().catch(() => {}); process.exit(0);
})();
