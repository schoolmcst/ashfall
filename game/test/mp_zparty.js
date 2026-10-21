// zombies party + quick play drop-in: three pages, real WebRTC, local signalling stand-in. SHOTS=dir node mp_zomb.js
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
  for (let i = 0; i < 3; i++) { const bb = i === 0 ? b : await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-features=WebRtcHideLocalIpsWithMdns'] }); browsers.push(bb);
    const ctx = await bb.newContext({ viewport: { width: 1280, height: 720 } }); await ctx.addInitScript(initFn, PORT); await ctx.route('**/*', route); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(i + ' PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push(i + ' CONSOLE ' + m.text()); }); await p.goto('http://game.test/index.html#debug'); pages.push(p); }
  for (const p of pages) await p.waitForFunction(() => window.__A && window.__A.G.state === 'menu', null, { timeout: 120000 });
  const [A, B, C] = pages, ev = (p, f, a) => p.evaluate(f, a);
  const OUT = process.env.SHOTS || '.';
  const shot = async (p, n) => { await ev(p, () => { window.__A.G.noRender = false; const s = document.getElementById('hcSplash'); if (s) s.remove(); }); await p.waitForTimeout(700); await p.screenshot({ path: OUT + '/' + n + '.png', timeout: 60000 }).catch(() => console.log('SHOT FAILED ' + n)); await ev(p, () => { window.__A.G.noRender = true; }); };
  const st = p => ev(p, () => { const A_ = window.__A, ZC = A_.ZC; return { conn: ZC.conn, host: A_.zcHost(), inGame: ZC.inGame, state: A_.G.state, map: A_.curMap, round: A_.Z.round, pts: A_.G.points, kills: A_.G.kills, zombies: A_.enemies.filter(e => e.zombie).length, proxies: ZC.prox.size, mates: [...ZC.rem.values()].map(R => R.n + (R.inGame ? '+' : '') + (R.dn ? ' DOWN' : '') + (R.av ? ' (seen)' : '')), down: ZC.down, dead: ZC.dead }; });

  const unpause = p => ev(p, () => { const G = window.__A.G; if (G.state === 'paused') G.state = G.pausedFrom || 'playing'; });
  // B joins A's party with A's friend code
  for (const [p, n] of [[A, 'ALPHA'], [B, 'BRAVO'], [C, 'CHARLIE']]) await ev(p, n => { window.__A.NET.nick = n; window.__A.G.noRender = true; }, n);
  await A.waitForTimeout(8000);   // everyone hosts their own party room first
  const codeA = await ev(A, () => window.__A.MYCODE);
  await ev(B, c => window.__A.partyJoin(c), codeA);
  await A.waitForTimeout(6000);
  const party = [await ev(A, () => window.__A.partyMembers().map(m => m.name)), await ev(B, () => window.__A.partyMembers().map(m => m.name + (m.lead ? '*' : '')))];
  // both open the zombies lobby in co-op: B (not the leader) must wait
  for (const p of [A, B]) await ev(p, () => { const A_ = window.__A; A_.ZL.net = 'coop'; A_.openZLobby(); });
  await A.waitForTimeout(2500);
  const lobB = await ev(B, () => ({ btn: document.querySelector('#lobSel .cod-go').innerText.replace(/\n/g, ' '), dis: document.querySelector('#lobSel .cod-go').disabled, party: !!document.getElementById('partyBox'), chat: !!document.getElementById('lobChatIn'), svc: (document.getElementById('netSvc') || {}).textContent }));
  await ev(B, () => { const s = document.getElementById('hcSplash'); if (s) s.remove(); window.__A.G.noRender = false; }); await A.waitForTimeout(800); await B.screenshot({ path: OUT + '/zp_lobby_member.png', timeout: 60000 }).catch(() => {});
  await ev(A, () => { const s = document.getElementById('hcSplash'); if (s) s.remove(); window.__A.G.noRender = false; }); await A.waitForTimeout(800); await A.screenshot({ path: OUT + '/zp_lobby_leader.png', timeout: 60000 }).catch(() => {});
  for (const p of [A, B]) await ev(p, () => { window.__A.G.noRender = true; });
  // the leader presses QUICK PLAY: hosts a game and starts at once; the party member follows
  await ev(A, () => window.__A.zombAct('z-start'));
  await A.waitForTimeout(16000);
  for (const p of [A, B]) await unpause(p);
  const s1 = [await st(A), await st(B)];
  // a stranger presses QUICK PLAY: drops into the running game
  await ev(C, () => { const A_ = window.__A; A_.ZL.net = 'coop'; A_.openZLobby(); A_.zombAct('z-start'); });
  await A.waitForTimeout(16000);
  for (const p of pages) await unpause(p);
  const s2 = [await st(A), await st(B), await st(C)];
  console.log(JSON.stringify({ party, lobB, s1, s2 }, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 20).join('\n') : 'NO ERRORS');
  for (const x of browsers) await x.close().catch(() => {}); process.exit(0);
})();
