// two pages in one browser, a mock `room` capability over BroadcastChannel: checks online play end to end
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs = require('fs');
const MOCK = () => {
  for (const t of ['blur', 'visibilitychange', 'pagehide']) { window.addEventListener(t, e => e.stopImmediatePropagation(), true); document.addEventListener(t, e => e.stopImmediatePropagation(), true); }
  try { Object.defineProperty(document, 'hidden', { get: () => false }); Object.defineProperty(document, 'visibilityState', { get: () => 'visible' }); } catch (e) {}
  const me = 'p' + Math.random().toString(36).slice(2, 10), bc = new BroadcastChannel('mock-room'), rooms = {};
  function mk(name) {
    const R = { pres: new Map(), ls: new Set(), snap: null };
    const peers = () => R.snap || (R.snap = Object.freeze([...R.pres].map(([peer, presence]) => Object.freeze({ peer, presence: Object.freeze(Object.assign({}, presence)), isMe: peer === me, sameTab: peer === me, kind: 'viewer', guest: false, by: null, updatedAt: Date.now() }))));
    R.api = { name, peers,
      presence: async patch => { const cur = Object.assign({}, R.pres.get(me) || {}); for (const k in patch) { if (patch[k] === null) delete cur[k]; else cur[k] = patch[k]; } R.pres.set(me, cur); R.snap = null; bc.postMessage({ room: name, peer: me, presence: JSON.parse(JSON.stringify(cur)) }); },
      onPeers: fn => { R.ls.add(fn); return () => R.ls.delete(fn); }, on: () => () => {}, emit: async () => {}, connected: () => true, onConnection: fn => { setTimeout(() => fn(true)); return () => {}; },
      leave: async () => { bc.postMessage({ room: name, peer: me, left: true }); delete rooms[name]; } };
    R.pres.set(me, {}); rooms[name] = R; return R;
  }
  bc.onmessage = ev => { const m = ev.data, R = rooms[m.room]; if (!R) return; if (m.left) R.pres.delete(m.peer); else R.pres.set(m.peer, m.presence); R.snap = null; R.ls.forEach(f => f({})); };
  const lobby = mk('lobby').api; lobby.join = async name => (rooms[name] || mk(name)).api;
  window.claude = { use: async n => (n === 'room' ? lobby : null) };
};
(async () => {
  const html = fs.readFileSync(require('path').join(__dirname, '..', 'ashfall.html'), 'utf8'), three = fs.readFileSync(require('path').join(__dirname, '..', '..', 'tools', 'three.min.js'), 'utf8');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(MOCK);
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.includes('three')) return r.fulfill({ body: three, contentType: 'application/javascript' }); if (u.startsWith('http://game.test/')) return r.fulfill({ body: html, contentType: 'text/html' }); return r.abort(); });
  const errs = [], pages = [];
  for (let i = 0; i < 2; i++) {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(i + ' PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(i + ' CONSOLE ' + m.text()); });
    await p.goto('http://game.test/index.html#debug'); pages.push(p);
  }
  for (const p of pages) await p.waitForFunction(() => window.__A && window.__A.G.state === 'menu', null, { timeout: 120000 });
  const [A, B] = pages;
  const ev = (p, f, a) => p.evaluate(f, a);
  // the lobby shows the online panel
  await ev(A, () => { window.__A.LOBBY.mode = 'otdm'; window.__A.toLobby(); });
  const lob = await ev(A, () => ({ btn: document.querySelector('#lobSel .lob-go').textContent, form: !!document.getElementById('netNick'), count: document.getElementById('netCount').textContent }));
  await A.screenshot({ path: 'mp_lobby.png' });
  await ev(A, () => { window.__A.NET.nick = 'ALPHA'; window.__A.G.noRender = true; window.__A.startMatch('otdm'); });
  await A.waitForTimeout(1500);
  await ev(B, () => { window.__A.NET.nick = 'BRAVO'; window.__A.G.noRender = true; window.__A.startMatch('otdm'); });
  await A.waitForTimeout(5000);
  const st = p => ev(p, () => { const { NET, G } = window.__A, M = window.__A.M; return { team: M.myTeam, state: G.state, rem: [...NET.rem.values()].map(R => ({ name: R.entry.name, team: R.entry.team, bot: !!R.bot })), hp: G.health, k: NET.k, d: NET.d, me: NET.me }; });
  const s1 = [await st(A), await st(B)];
  await A.bringToFront(); await A.waitForFunction(() => window.__A.G.state === 'playing', null, { timeout: 20000 });
  // put them face to face in the open and let A shoot B
  await ev(B, () => { const P = window.__A.P; const L = window.__A.LAYOUT; P.x = L.spawn[0].x + 6; P.z = L.spawn[0].z; P.y = 0; window.__A.G.spawnProt = 0; window.__A.G.health = 100; });
  await ev(A, () => { const P = window.__A.P; const L = window.__A.LAYOUT; P.x = L.spawn[0].x; P.z = L.spawn[0].z; P.y = 0; });
  await A.bringToFront(); await A.waitForTimeout(500); await ev(B, () => { const G = window.__A.G; if (G.state === 'paused') { G.state = 'playing'; document.getElementById('pause') && document.getElementById('pause').classList.add('hide'); } }); await A.waitForTimeout(2500);
  const dbg = await ev(A, () => { const A_ = window.__A, P = A_.P, NET = A_.NET; const R = [...NET.rem.values()][0]; if (!R || !R.bot) return 'nobot'; const g = R.bot.group.position;
    const T = THREE, o = new T.Vector3(P.x, P.y + P.eye, P.z), d = new T.Vector3(g.x - P.x, 1.15 - (P.y + P.eye), g.z - P.z).normalize(); const rc = new T.Raycaster(o, d); rc.camera = A_.camera;
    const hits = rc.intersectObjects(A_.scene.children, true).slice(0, 4).map(h => [h.object.name || h.object.type, +h.distance.toFixed(2), !!h.object.userData.enemy]);
    return { P: [P.x, P.z, P.eye], bot: [g.x, g.y, g.z], R: [R.x, R.z], hits, nHits: R.bot.rig.hits.length }; });
  console.log('DBG', JSON.stringify(dbg));
  const shots = await ev(A, async () => {
    const A_ = window.__A, P = A_.P, G = A_.G, NET = A_.NET, camera = A_.camera; let fired = 0;
    for (let i = 0; i < 40 && NET.k === 0; i++) {
      const R = [...NET.rem.values()][0]; if (!R || !R.bot) { await new Promise(r => setTimeout(r, 100)); continue; }
      const g = R.bot.group.position; P.yaw = Math.atan2(-(g.x - P.x), -(g.z - P.z)); P.pitch = Math.atan2(1.15 - 1.7, Math.hypot(g.x - P.x, g.z - P.z));
      const w = A_.W[G.cur]; w.ammo = Math.max(w.ammo, 5); G.reloading = false; A_.renderFrame && 0; camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ'); camera.position.set(P.x, P.y + P.eye, P.z); camera.updateMatrixWorld();
      A_.scene.updateMatrixWorld(); A_.shoot(false); fired++; await new Promise(r => setTimeout(r, 160));
    }
    return { fired, hs: NET.hs.length };
  });
  await A.waitForTimeout(2500);
  const s2 = [await st(A), await st(B)];
  // render a look from A at B for the record
  await ev(B, () => { window.__A.G.health = 100; });
  await A.waitForTimeout(5000);
  await A.bringToFront(); await ev(A, () => { window.__A.G.noRender = false; });
  await A.waitForTimeout(1500);
  await A.screenshot({ path: 'mp_view.png' });
  const board = await ev(A, () => { window.__A.setScoreboard(true); return document.getElementById('board').innerText.slice(0, 400); });
  // B leaves: A should drop them
  const lv = await ev(B, () => { try { window.__A.toMenu(); } catch (e) { return 'ERR ' + e.message; } return { room: !!window.__A.NET.room, on: window.__A.NET.on, st: window.__A.G.state }; });
  await A.waitForTimeout(800);
  console.log('LEAVE', JSON.stringify(lv), await ev(A, () => window.__A.NET.room.peers().length));
  await B.close();
  await A.waitForTimeout(500);
  const s3 = await st(A); s3.err = await ev(A, () => (document.getElementById('err') || {}).textContent || ''); s3.gs = await ev(A, () => [window.__A.G.state, !!window.__A.NET.room, window.__A.NET.on]);
  console.log(JSON.stringify({ lob, s1, shots, s2, board, s3 }, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  await b.close();
})();
