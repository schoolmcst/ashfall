// zombies co-op: three pages, real WebRTC, local signalling stand-in. SHOTS=dir node mp_zomb.js
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
  // everyone opens the zombies lobby in co-op and presses FIND A CO-OP GAME
  for (const [p, n, i] of [[A, 'ALPHA', 0], [B, 'BRAVO', 1], [C, 'CHARLIE', 2]]) {
    await ev(p, ([n, zm]) => { const A_ = window.__A; A_.NET.nick = n; A_.ZL.map = zm; A_.ZL.net = 'coop'; A_.openZLobby(); A_.zcJoin('code', 'zt1'); }, [n, process.env.ZMAP || 'blackwell']);
    await A.waitForTimeout(i === 0 ? 9000 : 6000);
  }
  await A.waitForTimeout(2000);
  const lob = [await st(A), await st(B), await st(C)];
  const roster = await ev(B, () => document.getElementById('zRoster').innerText.replace(/\n/g, ' | '));
  await shot(B, 'zc_lobby');
  // the host starts
  await ev(A, () => { window.__A.G.noRender = true; window.__A.zombAct('z-start'); });
  for (const p of [B, C]) await ev(p, () => { window.__A.G.noRender = true; });
  await A.waitForTimeout(12000);
  for (const p of pages) await unpause(p);
  const s1 = [await st(A), await st(B), await st(C)];
  // doors: a client buys one, the host buys one; everyone should see both open
  await ev(B, () => { const A_ = window.__A; A_.G.points = 5000; A_.zdBuy(A_.ZD.list.find(o => !o.perm && o.d.id === 0)); });
  await ev(A, () => { const A_ = window.__A; A_.G.points = 5000; A_.zdBuy(A_.ZD.list.find(o => !o.perm && o.d.id === 1)); });
  await A.waitForTimeout(5000);
  const doors = []; for (const p of pages) doors.push(await ev(p, () => window.__A.ZD.list.filter(o => o.open).map(o => o.d.name).sort().join(', ')));
  console.log('DOORS', JSON.stringify(doors));
  // invulnerable for the shooting part; B shoots the nearest zombie copy until a kill comes back from the host
  for (const p of pages) await ev(p, () => { window.__A.G.health = 1e9; window.__A.G.maxHp = 1e9; });
  const shoot = await ev(B, async () => {
    const A_ = window.__A, P = A_.P, G = A_.G, cam = A_.camera; let fired = 0; const k0 = G.kills, p0 = G.points;
    for (let i = 0; i < 160 && G.kills === k0; i++) {
      if (G.state === 'paused') G.state = 'playing';
      const zs = A_.enemies.filter(e => e.proxy); if (!zs.length) { await new Promise(r => setTimeout(r, 200)); continue; }
      zs.sort((a, b) => Math.hypot(a.group.position.x - P.x, a.group.position.z - P.z) - Math.hypot(b.group.position.x - P.x, b.group.position.z - P.z));
      const g = zs[0].group.position; P.x = g.x + 3; P.z = g.z; P.y = g.y;
      P.yaw = Math.atan2(-(g.x - P.x), -(g.z - P.z)); P.pitch = Math.atan2(g.y + 1.2 - (P.y + 1.7), Math.hypot(g.x - P.x, g.z - P.z));
      const w = A_.W[G.cur]; w.ammo = Math.max(w.ammo, 5); G.reloading = false; G.fireT = 0; cam.rotation.set(P.pitch, P.yaw, 0, 'YXZ'); cam.position.set(P.x, P.y + P.eye, P.z); A_.scene.updateMatrixWorld();
      A_.shoot(false); fired++; await new Promise(r => setTimeout(r, 120));
    }
    return { fired, kills: G.kills - k0, gained: G.points - p0 };
  });
  await A.waitForTimeout(1500);
  const s2 = [await st(A), await st(B), await st(C)];
  // shared drop: the host drops ammo at C, C picks it up, everyone gets ammo; and C's shots reach the others
  const before = []; for (const p of pages) before.push(await ev(p, () => { const w = window.__A.W[0]; w.reserve = 0; return 0; }));
  for (let i = 0; i < 10 && !(await ev(A, () => [...window.__A.ZC.rem.values()].some(r => r.n === 'CHARLIE'))); i++) await A.waitForTimeout(500);
  await ev(A, () => { const A_ = window.__A, R = [...A_.ZC.rem.values()].find(r => r.n === 'CHARLIE'); A_.zcDrop(R.x + 3, R.z, R.y); });
  await A.waitForTimeout(2500);
  const seen = await ev(C, () => window.__A.pickups ? window.__A.pickups.filter(k => k.sid).length : -1);
  await ev(C, () => { const A_ = window.__A, k = A_.pickups.find(k => k.sid); if (k) { A_.G.state = 'playing'; Object.assign(A_.P, { x: k.x, z: k.z, y: k.y || 0 }); } });
  await A.waitForTimeout(3000);
  const after = []; for (const p of pages) after.push(await ev(p, () => ({ reserve: window.__A.W[0].reserve, drops: window.__A.pickups.filter(k => k.sid).length })));
  const sh0 = await ev(A, () => { const R = [...window.__A.ZC.rem.values()].find(r => r.n === 'CHARLIE'); return R ? R.sh : -1; });
  await ev(C, () => { const A_ = window.__A; for (let i = 0; i < 3; i++) A_.netShot(); });
  await A.waitForTimeout(1500);
  const sh1 = await ev(A, () => { const R = [...window.__A.ZC.rem.values()].find(r => r.n === 'CHARLIE'); return R ? R.sh : -1; });
  console.log('SHARED', JSON.stringify({ seenOnC: seen, after, shotsSeenByHost: [sh0, sh1] }));
  console.log('DOORS2', JSON.stringify(await ev(C, () => ({ open: window.__A.ZD.list.filter(o => o.open).map(o => o.d.name), n: window.__A.ZD.list.length, inGame: window.__A.ZC.inGame, gid: window.__A.ZC.gid, hzd: (() => { for (const R of window.__A.ZC.rem.values()) if (R.ho) return [R.pr.zd, R.pr.gid]; })() }))));
  // pictures: C looks at B, zombies around
  await ev(C, () => { const A_ = window.__A, P = A_.P, R = [...A_.ZC.rem.values()].find(r => r.n === 'BRAVO'); if (R) { P.x = R.x + 4; P.z = R.z + 2; P.y = R.y; P.yaw = Math.atan2(-(R.x - P.x), -(R.z - P.z)); P.pitch = -0.05; } });
  await A.waitForTimeout(1500); await shot(C, 'zc_mates');
  // B goes down; C revives (holds E next to B)
  await ev(B, () => { const A_ = window.__A; A_.G.maxHp = 100; A_.G.health = 10; A_.G.spawnProt = 0; A_.G.state = 'playing'; A_.zcDown(); });
  await A.waitForTimeout(1500);
  const sDown = [await st(B), await st(C)];
  await shot(B, 'zc_down');
  await ev(C, () => { const A_ = window.__A, P = A_.P, R = [...A_.ZC.rem.values()].find(r => r.n === 'BRAVO'); P.x = R.x + 1; P.z = R.z; P.y = R.y; P.yaw = Math.atan2(-(R.x - P.x), -(R.z - P.z)); P.pitch = -0.6; A_.G.state = 'playing'; });
  await ev(C, () => { window.__A.ZC.revNeed = 0.6; }); await C.bringToFront(); await C.keyboard.down('KeyE');
  await A.waitForTimeout(1200); const dRev = await ev(C, () => ({ st: window.__A.G.state, revT: window.__A.ZC.revT, pr: document.getElementById('zPrompt').textContent, R: [...window.__A.ZC.rem.values()].map(R => [R.n, R.x, R.z, R.inGame, R.a, R.dn]), P: [window.__A.P.x, window.__A.P.z] })); console.log('DREV', JSON.stringify(dRev)); await shot(C, 'zc_revive');
  for (let i = 0; i < 4; i++) { await A.waitForTimeout(2000); console.log('HOLD', JSON.stringify(await ev(C, () => ({ st: window.__A.G.state, revT: +window.__A.ZC.revT.toFixed(2), pr: document.getElementById('zPrompt').textContent, rv: window.__A.ZC.rv, foc: document.activeElement && document.activeElement.id }))), JSON.stringify(await ev(B, () => ({ st: window.__A.G.state, down: window.__A.ZC.down, seen: [...window.__A.ZC.rem.values()].map(R => [R.n, R.seenRv, R.pr && R.pr.rv]) })))); }
  await C.keyboard.up('KeyE');
  await A.waitForTimeout(1500);
  const sRev = [await st(B), await st(C)];
  // after being revived, BRAVO must be able to take damage again (spawn protection runs out)
  await A.waitForTimeout(5000);
  console.log('DMG', JSON.stringify(await ev(B, () => { const A_ = window.__A; if (A_.G.state === 'paused') A_.G.state = 'playing'; const h0 = A_.G.health, sp = A_.G.spawnProt; A_.G.maxHp = 100; A_.G.health = 100; A_.hurtPlayer(10, A_.P.x + 1, A_.P.z); return { state: A_.G.state, spawnProt: +sp.toFixed(2), before: 100, after: A_.G.health }; })));
  // host leaves in the middle: B or C takes over the zombies
  await ev(A, () => window.__A.toMenu());
  await A.waitForTimeout(14000); for (const p of [B, C]) await unpause(p);
  const sMig = [await st(B), await st(C)];
  // everyone left goes down: game over
  for (const p of [B, C]) await ev(p, () => { const A_ = window.__A; A_.G.maxHp = 100; if (A_.G.state === 'paused') A_.G.state = 'playing'; if (A_.G.state === 'playing') A_.zcDown(); });
  await A.waitForTimeout(15000);
  console.log('DOVER', JSON.stringify(await ev(B, () => ({ overT: window.__A.ZC.overT, st: window.__A.ZC.st, state: window.__A.G.state, host: window.__A.zcHost(), t: window.__A.zombTargets().length }))));
  const sOver = [await st(B), await st(C), await ev(B, () => document.getElementById('overStats').textContent)];
  await shot(B, 'zc_over');
  console.log(JSON.stringify({ lob, roster, s1, shoot, s2, sDown, sRev, sMig, sOver }, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 20).join('\n') : 'NO ERRORS');
  for (const x of browsers) await x.close().catch(() => {}); process.exit(0);
})();
