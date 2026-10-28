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
  for (const mode of ['oru', 'opp']) {
    for (const [p, n] of [[A, 'ALPHA'], [B, 'BRAVO']]) { await ev(p, ([n, mode]) => { const A_ = window.__A; A_.toMenu(); A_.NET.nick = n; A_.G.noRender = true; A_.LOBBY.mode = mode; A_.startMatch(mode); }, [n, mode]); await A.waitForTimeout(n === 'ALPHA' ? 7000 : 9000); }
    await ev(A, () => { window.__A.NET.warmEnd = 0; });
    for (const p of pages) await ev(p, () => { const G = window.__A.G; if (G.state === 'paused') G.state = 'playing'; G.holdT = 0; G.health = G.maxHp = 1e6; });
    await A.waitForTimeout(3000);
    const host = await ev(A, () => window.__A.NET.room && window.__A.NET.room.host);
    const H = host ? A : B, C = host ? B : A;
    const keep = () => Promise.all(pages.map(p => ev(p, () => { const G = window.__A.G; if (G.state === 'paused') G.state = 'playing'; G.health = 1e6; })));
    const st = p => ev(p, () => { const A_ = window.__A, M = A_.M; return { mode: M.mode, map: A_.curMap, team: M.myTeam, me: A_.NET.me, ts: M.teamScore && M.teamScore.slice(), tags: M.ru && M.ru.tags.map(t => [t.id, t.team, t.n]), carry: M.ru && M.ru.carry, pp: M.pp && [M.pp.gun, M.pp.n, Math.round(M.pp.t)], gun: A_.W[A_.G.cur] && A_.W[A_.G.cur].id, score: A_.G.score, state: A_.G.state }; });
    const R = out[mode] = {};
    if (mode === 'oru') {
      R.start = { host: await st(H), client: await st(C) };
      // a pile of 3 from the other team dropped at the client's feet: the client carries 3
      const cp = await ev(C, () => { const A_ = window.__A; A_.P.vx = A_.P.vz = 0; return { x: A_.P.x, z: A_.P.z, y: A_.P.y, team: A_.M.myTeam, score: A_.G.score }; });
      await ev(H, c => { const A_ = window.__A; A_.M.ru.carry.dummy = 2; A_.ruDrop(c.x, c.y, c.z, 1 - c.team, 'dummy'); }, cp);
      for (let i = 0; i < 6; i++) { await A.waitForTimeout(700); await keep(); await ev(C, c => { const A_ = window.__A; A_.P.x = c.x; A_.P.z = c.z; }, cp); }
      R.picked = { host: await st(H), client: await st(C) };
      // the client walks into stash house A and banks them
      const b = await ev(H, () => { const q = window.__A.M.ru.banks[0]; return { x: q.x, z: q.z, y: q.y }; });
      for (let i = 0; i < 10; i++) { await ev(C, q => { const A_ = window.__A; A_.P.x = q.x; A_.P.z = q.z; A_.P.y = q.y; }, b); await keep(); await A.waitForTimeout(700); }
      R.banked = { host: await st(H), client: await st(C), clientGain: (await ev(C, () => window.__A.G.score)) - cp.score };
    } else {
      R.start = { host: await st(H), client: await st(C) };
      await ev(H, () => { window.__A.M.pp.t = 0.5; });
      for (let i = 0; i < 6; i++) { await keep(); await A.waitForTimeout(700); }
      R.passed = { host: await st(H), client: await st(C) };
      // the client respawns: it comes back with the shared gun
      await ev(C, () => { const A_ = window.__A; A_.G.health = 0; A_.S.deathCam = false; A_.die(); });
      for (let i = 0; i < 8; i++) { await keep(); await A.waitForTimeout(800); }
      R.respawn = { client: await st(C) };
    }
  }
  console.log(JSON.stringify(out, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 20).join('\n') : 'NO ERRORS');
  for (const x of browsers) await x.close().catch(() => {}); process.exit(0);
})();
