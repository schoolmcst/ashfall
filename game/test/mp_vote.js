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
  for (let i = 0; i < 2; i++) { const bb = i === 0 ? b : await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=WebRtcHideLocalIpsWithMdns'] }); browsers.push(bb);
    const ctx = await bb.newContext({ viewport: { width: 1280, height: 720 } }); await ctx.addInitScript(initFn, PORT); await ctx.route('**/*', route); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(i + ' PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push(i + ' CONSOLE ' + m.text()); }); await p.goto('http://game.test/index.html#debug'); pages.push(p); }
  for (const p of pages) await p.waitForFunction(() => window.__A && window.__A.G.state === 'menu', null, { timeout: 120000 });
  const [A, B] = pages, ev = (p, f, a) => p.evaluate(f, a);
  const out = {};
  {
    const mode = 'otdm';
    for (const [p, n] of [[A, 'ALPHA'], [B, 'BRAVO']]) { await ev(p, ([n, mode]) => { const A_ = window.__A; A_.toMenu(); A_.NET.nick = n; A_.G.noRender = true; A_.LOBBY.mode = mode; A_.startMatch(mode); }, [n, mode]); await A.waitForTimeout(n === 'ALPHA' ? 7000 : 9000); }
    await ev(A, () => { window.__A.NET.warmEnd = 0; });
    for (const p of pages) await ev(p, () => { const G = window.__A.G; if (G.state === 'paused') G.state = 'playing'; G.holdT = 0; G.health = G.maxHp = 1e6; window.__A.M.cfg.score = 1; });
    await A.waitForTimeout(4000);
    const host = await ev(A, () => window.__A.NET.room && window.__A.NET.room.host);
    const H = host ? A : B, C = host ? B : A;
    out.map0 = await ev(H, () => window.__A.curMap);
    await ev(H, () => { window.__A.NET.k = 1; });
    await A.waitForTimeout(4000);
    const st = p => ev(p, () => { const A_ = window.__A; return { state: A_.G.state, endT: Math.round(A_.NET.endT), opts: A_.MV.opts, voHost: A_.NET.voHost, mine: A_.MV.mine, box: !!document.getElementById('mapVote'), map: A_.curMap }; });
    out.inter = { host: await st(H), client: await st(C) };
    const opts = out.inter.host.opts || [];
    if (opts.length) {
      await ev(C, id => { const b = document.querySelector('#mapVote [data-mv="' + id + '"]'); if (b) b.click(); else window.__A.mvRender(true); }, opts[2]);
      await ev(H, id => { const b = document.querySelector('#mapVote [data-mv="' + id + '"]'); if (b) b.click(); }, opts[2]);
      await A.waitForTimeout(2500);
      out.count = await ev(H, () => window.__A.mvCount());
      await ev(C, () => { window.__A.G.noRender = false; }); await A.waitForTimeout(1200); await C.screenshot({ path: '/tmp/claude-0/bA/vote_client.png' }); await ev(C, () => { window.__A.G.noRender = true; });
      await ev(H, () => { window.__A.NET.endT = 0.5; });
      await A.waitForTimeout(9000);
      out.after = { want: opts[2], host: await st(H), client: await st(C) };
      out.cdbg = await ev(C, () => ({ err: (document.getElementById('err') || {}).textContent, on: window.__A.NET.on, room: !!window.__A.NET.room, ep: window.__A.NET.ep, frames: window.__fr || 0, now: Math.round(performance.now()) }));
      await A.waitForTimeout(3000); out.cdbg2 = await ev(C, () => ({ endT: window.__A.NET.endT, map: window.__A.curMap, st: window.__A.G.state }));
    }
  }
  await A.screenshot({ path: '/tmp/claude-0/bA/mp_vote_A.png' });
  console.log(JSON.stringify(out, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 20).join('\n') : 'NO ERRORS');
  for (const x of browsers) await x.close().catch(() => {}); process.exit(0);
})();
