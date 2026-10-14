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
  const out = {};
  for (const mode of ['octf', 'ohp', 'ogun']) {
    for (const [p, n] of [[A, 'ALPHA'], [B, 'BRAVO']]) { await ev(p, ([n, mode]) => { const A_ = window.__A; A_.toMenu(); A_.NET.nick = n; A_.G.noRender = true; A_.LOBBY.mode = mode; A_.startMatch(mode); }, [n, mode]); await A.waitForTimeout(n === 'ALPHA' ? 7000 : 9000); }
    await ev(A, () => { const G = window.__A.G; if (G.state === 'paused') G.state = 'playing'; window.__A.NET.warmEnd = 0; });
    await A.waitForTimeout(3000);
    const host = await ev(A, () => window.__A.NET.room && window.__A.NET.room.host);
    const H = host ? A : B, C = host ? B : A;
    await ev(H, () => { const A_ = window.__A, M = A_.M; if (M.hp) { M.hp.wait = 0; M.hp.idx = 1; } M.teamScore = [7, 3]; if (M.ctf) { M.ctf.flags[0].state = 'dropped'; M.ctf.flags[0].x = 3; M.ctf.flags[0].z = 4; M.ctf.flags[0].dropT = 30; } });
    await A.waitForTimeout(3000);
    const st = p => ev(p, () => { const A_ = window.__A, M = A_.M; return { mode: M.mode, online: M.online, ts: M.teamScore && M.teamScore.slice(), hp: M.hp && [M.hp.idx, Math.round(M.hp.t), M.hp.status], flag0: M.ctf && [M.ctf.flags[0].state, M.ctf.flags[0].x, M.ctf.flags[0].z], level: M.me.level, gun: A_.W[A_.G.cur] && A_.W[A_.G.cur].name, bots: M.entries.filter(e => e.botLabel).length, rem: [...A_.NET.rem.values()].filter(R => !R.isBot).length, map: A_.curMap, ob: A_.NET.ob, st: A_.G.state, peers: A_.NET.room ? A_.NET.room.peers().map(p => [p.sameTab ? 'me' : 'o', p.presence && p.presence.ho, p.presence && p.presence.mp, p.presence && !!p.presence.ob]) : null }; });
    out[mode] = { host: await st(H), client: await st(C), hosts: [await ev(A, () => !!(window.__A.NET.room && window.__A.NET.room.host)), await ev(B, () => !!(window.__A.NET.room && window.__A.NET.room.host))] };
  }
  await A.screenshot({ path: 'mp_obj_A.png' });
  console.log(JSON.stringify(out, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 20).join('\n') : 'NO ERRORS');
  for (const x of browsers) await x.close().catch(() => {}); process.exit(0);
})();
