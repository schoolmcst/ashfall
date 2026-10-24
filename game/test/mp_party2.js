// party leader moves the party: matches, lobby, zombies <-> multiplayer; leaving on purpose sticks. SHOTS=dir node mp_party2.js
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const PORT = 39575; await require('./sigserver.js')(PORT);
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
  const where = p => ev(p, () => { const A_ = window.__A; return { state: A_.G.state, scr: A_.curScreen, z: !!A_.ZL.on, slot: A_.NET.room && A_.NET.room.slot || '', zc: A_.ZC.on && A_.ZC.room && A_.ZC.room.slot || '', w: A_.partyWhere().w }; });
  const all = async () => [await where(A), await where(B), await where(C)];
  for (const [p, n] of [[A, 'ALPHA'], [B, 'BRAVO'], [C, 'CHARLIE']]) await ev(p, n => { window.__A.NET.nick = n; window.__A.G.noRender = true; const s = document.getElementById('hcSplash'); if (s) s.remove(); }, n);
  await A.waitForTimeout(8000);
  const codeA = await ev(A, () => window.__A.MYCODE);
  for (const p of [B, C]) await ev(p, c => window.__A.partyJoin(c), codeA);
  await A.waitForTimeout(6000);
  const r = {};
  r.party = await ev(A, () => window.__A.partyMembers().map(m => m.name));
  for (const p of pages) await ev(p, () => { window.__A.LOBBY.mode = 'otdm'; window.__A.toLobby(); });
  await A.waitForTimeout(1500);
  // 1. the leader quick plays: everyone follows into the match
  await ev(A, () => window.__A.startMatch('otdm'));
  await A.waitForTimeout(18000); for (const p of pages) await unpause(p);
  r.inMatch = await all();
  await shot(B, 'pt_1_follow');
  // 2. BRAVO leaves the match on purpose and stays out (even when the match changes host)
  await ev(B, () => window.__A.toLobby());
  await A.waitForTimeout(3000);
  await ev(C, () => { window.__A.toLobby(); });   // charlie leaves too, so the match may change host / slot
  await A.waitForTimeout(3000);
  await ev(C, () => { window.__A.PARTY.seen = window.__A.PARTY.seen; });
  await A.waitForTimeout(12000);
  r.leftStaysOut = await all();
  // 3. the leader leaves: everyone ends up in the multiplayer lobby. First put everyone back in the match by a new move
  await ev(A, () => window.__A.toLobby()); await A.waitForTimeout(2500);
  await ev(A, () => window.__A.startMatch('otdm'));
  await A.waitForTimeout(18000); for (const p of pages) await unpause(p);
  r.backIn = await all();
  await ev(A, () => window.__A.toLobby());
  await A.waitForTimeout(5000);
  r.leaderLeft = await all();
  await shot(C, 'pt_3_lobby');
  // 4. leader -> zombies lobby: everyone goes to zombies
  await ev(A, () => { const A_ = window.__A; A_.ZL.net = 'solo'; A_.openZLobby(); });
  await A.waitForTimeout(4000);
  r.toZombies = await all();
  await shot(B, 'pt_4_zombies');
  // 5. leader -> multiplayer: everyone back
  await ev(A, () => { const A_ = window.__A; A_.zombLobbyOff(); A_.toLobby(); });
  await A.waitForTimeout(4000);
  r.toMulti = await all();
  await shot(B, 'pt_5_multi');
  // 6. leader starts zombies co-op: everyone joins the same co-op game
  await ev(A, () => { const A_ = window.__A; A_.ZL.net = 'coop'; A_.openZLobby(); A_.zombAct('z-start'); });
  await A.waitForTimeout(20000); for (const p of pages) await unpause(p);
  r.coop = await all();
  await shot(C, 'pt_6_coop');
  console.log(JSON.stringify(r, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 20).join('\n') : 'NO ERRORS');
  for (const x of browsers) await x.close().catch(() => {}); process.exit(0);
})();
