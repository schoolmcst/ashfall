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
  const st = p => ev(p, () => { const { NET, G } = window.__A, M = window.__A.M; return { host: !!(NET.room && NET.room.host), state: G.state, screen: window.__A.curScreen, mode: M.mode, cfg: NET.priv && NET.priv.cfg, started: NET.priv && NET.priv.started, rem: [...NET.rem.values()].map(R => R.entry.name + (R.isBot ? '' : '*')).join(' '), bots: M.entries.filter(e => e.botLabel).length, map: window.__A.curMap, t: Math.round(M.t), ep: NET.ep, plist: (document.getElementById('plPlayers') || {}).innerText }; });
  const join = (p, n) => ev(p, n => { const A_ = window.__A; A_.NET.nick = n; A_.NET.code = 'crew9'; A_.G.noRender = true; A_.LOBBY.mode = 'otdm'; A_.toLobby(); A_.actions('custom'); document.getElementById('netCodeGo').click(); }, n);
  await ev(A, () => { window.__A.toLobby(); window.__A.G.noRender = true; }); await A.waitForTimeout(500); await A.screenshot({ path: 'app_lobby.png' }); await ev(A, () => window.__A.actions('custom')); await A.waitForTimeout(500); await A.screenshot({ path: 'app_custom.png' });
  await join(A, 'ALPHA'); await A.waitForTimeout(7000);
  await ev(A, () => { const N = window.__A.NET; Object.assign(N.priv.cfg, { md: 'ffa', b: 3, tl: 1, sc: 30, mp: 'docks' }); window.__A.renderPlobby(true); });
  await ev(A, () => { const b = [...document.querySelectorAll('#plSet .seg button')].find(x => x.textContent === 'FREE-FOR-ALL'); b.click(); });
  await join(B, 'BRAVO'); await A.waitForTimeout(12000);
  const lobbyA = await st(A), lobbyB = await st(B);
  console.log('PEERS', JSON.stringify(await ev(A, () => window.__A.NET.room.peers().map(p => [p.peer, p.kind, p.presence && p.presence.on, p.presence && p.presence.n]))));
  console.log('FLAGS', JSON.stringify(await ev(A, () => { const A_ = window.__A; return { on: A_.NET.on, room: !!A_.NET.room, online: A_.M.online, mode: A_.M.mode, st: A_.G.state, rem: A_.NET.rem.size, me: A_.NET.me, teamSet: A_.NET.teamSet }; })));
  await A.screenshot({ path: 'priv_lobby_host.png' }); await B.screenshot({ path: 'priv_lobby_guest.png' });
  await ev(A, () => document.getElementById('plStart').click()); await A.waitForTimeout(6000);
  const playA = await st(A), playB = await st(B);
  await ev(A, () => { window.__A.M.t = 57; }); await A.waitForTimeout(6000);
  const overA = await st(A), overB = await st(B);
  await ev(A, () => { window.__A.NET.endT = 0.5; }); await A.waitForTimeout(12000);
  const dbg = await ev(A, () => ({ endT: window.__A.NET.endT, err: (document.getElementById('err') || {}).textContent, over: window.__A.M.over }));
  console.log('DBG', JSON.stringify(dbg));
  const nextA = await st(A), nextB = await st(B);
  console.log(JSON.stringify({ lobbyA, lobbyB, playA, playB, overA, overB, nextA, nextB }, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 20).join('\n') : 'NO ERRORS');
  for (const x of browsers) await x.close().catch(() => {}); process.exit(0);
})();
