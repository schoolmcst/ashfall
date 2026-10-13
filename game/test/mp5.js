// desktop-app multiplayer: three pages, real WebRTC between them, a local stand-in signalling server
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const PORT = 39555; await require('./sigserver.js')(PORT);
  const html = fs.readFileSync('/home/claude/work/ashfall.html', 'utf8'), three = fs.readFileSync('/home/claude/work/three_repo/build/three.min.js', 'utf8');
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
  const unpause = p => ev(p, () => { const G = window.__A.G; if (G.state === 'paused') G.state = G.pausedFrom || 'playing'; });
  await ev(A, () => { window.__A.LOBBY.mode = 'otdm'; window.__A.toLobby(); });
  const lob = await ev(A, () => ({ btn: document.querySelector('#lobSel .lob-go').textContent, code: !!document.getElementById('netCodeGo'), count: document.getElementById('netCount').textContent }));
  await A.screenshot({ path: 'mp2_lobby.png' });
  const st = p => ev(p, () => { const { NET, G } = window.__A, M = window.__A.M; return { host: !!(NET.room && NET.room.host), status: NET.room && NET.room.status, team: M.myTeam, state: G.state, rem: [...NET.rem.values()].map(R => R.entry.name + (R.isBot ? '' : '*') + ':' + R.entry.team + (R.bot ? '+' : '')).join(' '), bots: M.entries.filter(e => e.botLabel).length, enemies: window.__A.enemies.length, k: NET.k, d: NET.d, hp: Math.round(G.health) }; });
  await ev(A, () => { window.__A.NET.nick = 'ALPHA'; window.__A.G.noRender = true; window.__A.startMatch('otdm'); });
  const hud = async () => ev(A, () => ({ hud: document.getElementById('mhud').innerText.replace(/\n/g, ' | '), bots: window.__A.M.entries.filter(e => e.botLabel).length, ep: window.__A.NET.ep }));
  const w1 = []; for (const t of [10, 20, 30, 40]) { await A.waitForTimeout(t === 10 ? 10000 : 10000); w1.push(await hud()); }
  console.log(JSON.stringify(w1, null, 1)); for (const x of browsers) await x.close().catch(() => {}); process.exit(0);
  for (const [p, n] of [[A, 'ALPHA'], [B, 'BRAVO']]) { await ev(p, n => { window.__A.NET.nick = n; window.__A.G.noRender = true; window.__A.startMatch('otdm'); }, n); await A.waitForTimeout(n === 'ALPHA' ? 9000 : 1000); }
  await A.waitForTimeout(9000); for (const p of pages) await unpause(p);
  const s1 = [await st(A), await st(B)];
  // A shoots B
  await A.bringToFront(); await unpause(B);
  await ev(B, () => { const P = window.__A.P, L = window.__A.LAYOUT; P.x = L.spawn[0].x + 6; P.z = L.spawn[0].z; P.y = 0; window.__A.G.spawnProt = 0; window.__A.G.health = 100; });
  await ev(A, () => { const P = window.__A.P, L = window.__A.LAYOUT; P.x = L.spawn[0].x; P.z = L.spawn[0].z; P.y = 0; for (const e of window.__A.enemies.slice()) if (e.entry && e.entry.botLabel) { e.group.position.set(-40, 0, -40); } });
  await A.waitForTimeout(2500);
  const shots = await ev(A, async () => {
    const A_ = window.__A, P = A_.P, G = A_.G, NET = A_.NET, camera = A_.camera; let fired = 0, bravo = null;
    for (let i = 0; i < 40 && NET.k === 0; i++) {
      bravo = [...NET.rem.values()].find(R => !R.isBot); if (!bravo || !bravo.bot) { await new Promise(r => setTimeout(r, 150)); continue; }
      const g = bravo.bot.group.position; P.yaw = Math.atan2(-(g.x - P.x), -(g.z - P.z)); P.pitch = Math.atan2(1.15 - 1.7, Math.hypot(g.x - P.x, g.z - P.z));
      const w = A_.W[G.cur]; w.ammo = Math.max(w.ammo, 5); G.reloading = false; camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ'); camera.position.set(P.x, P.y + P.eye, P.z); A_.scene.updateMatrixWorld();
      A_.shoot(false); fired++; await new Promise(r => setTimeout(r, 160));
    }
    return { fired, k: NET.k };
  });
  await A.waitForTimeout(2500);
  const s2 = [await st(A), await st(B)];
  // C joins with a private code that does not exist yet: hosts its own match
  await ev(C, () => { window.__A.NET.nick = 'CHARLIE'; window.__A.NET.code = 'squad7'; window.__A.G.noRender = true; window.__A.LOBBY.mode = 'otdm'; window.__A.toLobby(); document.getElementById('netCodeGo').click(); });
  await A.waitForTimeout(8000);
  const s3c = await st(C);
  // host A leaves: B should take over the quick play slot
  await ev(A, () => window.__A.toMenu());
  await A.waitForTimeout(9000); await B.bringToFront(); await unpause(B); await A.waitForTimeout(4000);
  const s4 = await st(B);
  await ev(B, () => { window.__A.G.noRender = false; window.__A.P.x += 0; }); await A.waitForTimeout(2000); await B.screenshot({ path: 'mp2_view.png' });
  const board = await ev(B, () => { window.__A.setScoreboard(true); return document.getElementById('board').innerText.replace(/\n/g, ' | ').slice(0, 600); });
  console.log(JSON.stringify({ lob, s1, shots, s2, s3c, s4, board }, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 20).join('\n') : 'NO ERRORS');
  for (const x of browsers) await x.close().catch(() => {}); process.exit(0);
})();
