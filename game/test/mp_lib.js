// shared setup for the desktop-app multiplayer tests: N game pages (each in its own browser), real WebRTC between them,
// the local stand-in signalling server (sigserver.js) in place of the public PeerJS one.
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=WebRtcHideLocalIpsWithMdns,LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights', '--no-proxy-server'];
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let sigStarted = 0;
async function mpPages(n, port = 39555) {
  if (sigStarted !== port) { await require('./sigserver.js')(port); sigStarted = port; }
  const html = fs.readFileSync(path.join(__dirname, '..', 'ashfall.html'), 'utf8'), three = fs.readFileSync(path.join(__dirname, '..', '..', 'tools', 'three.min.js'), 'utf8');
  const initFn = ({ port, INTRO }) => {
    for (const t of ['blur', 'visibilitychange']) { window.addEventListener(t, e => e.stopImmediatePropagation(), true); document.addEventListener(t, e => e.stopImmediatePropagation(), true); }
    const W = window.WebSocket; window.WebSocket = function (u, p) { return new W(String(u).replace('wss://0.peerjs.com:443', 'ws://127.0.0.1:' + port), p); }; window.WebSocket.prototype = W.prototype; Object.assign(window.WebSocket, W);
    const lan = []; window.ASHFALL_APP = { version: '1.0.0', lan: { announce: g => { window.__ann = g; }, games: () => lan } };
    try { localStorage.setItem('ashfall.onb', '1'); localStorage.setItem('ashfall.newmodes', '9.9.9'); } catch (e) {}
    if (!INTRO) window.BR_SKIPINTRO = 1;   // LAST TOKE warm-up and bong intro off unless a test asks (INTRO=1)
  };
  const route = r => { const u = r.request().url(); if (u.includes('three')) return r.fulfill({ body: three, contentType: 'application/javascript' }); if (u.startsWith('http://game.test/') || u.startsWith('http://localhost:39990/')) return r.fulfill({ body: html, contentType: 'text/html' }); if (u.startsWith('ws')) return r.continue(); return r.abort(); };
  const errs = [], pages = [], browsers = [];
  for (let i = 0; i < n; i++) {
    const bb = await chromium.launch({ executablePath: EXE, args: ARGS }); browsers.push(bb);
    const ctx = await bb.newContext({ viewport: { width: 1280, height: 720 } }); await ctx.addInitScript(initFn, { port, INTRO: !!process.env.INTRO }); await ctx.route('**/*', route);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(i + ' PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::|WebSocket|peerjs|ERR_/.test(m.text())) errs.push(i + ' CONSOLE ' + m.text()); });
    await p.goto('http://localhost:39990/index.html#debug'); pages.push(p);
  }
  for (const p of pages) await p.waitForFunction(() => window.__A && window.__A.G.state === 'menu', null, { timeout: 180000 });
  for (const [i, p] of pages.entries()) await p.evaluate(n => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.NET.nick = n; A.G.noRender = true; }, 'P' + (i + 1) + ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'][i]);
  const close = async () => { for (const b of browsers) await b.close().catch(() => {}); };
  return { pages, errs, close, ev: (p, f, a) => p.evaluate(f, a) };
}
// the state of one page, for logging
const mpState = p => p.evaluate(() => { const A = window.__A, N = A.NET, M = A.M; return { st: A.G.state, scr: A.curScreen, mode: M && M.mode, def: M && M.def && M.def.name, online: !!(M && M.online), host: !!(N.room && N.room.host), rem: N.rem ? [...N.rem.values()].filter(r => !r.isBot).map(r => r.entry.name) : [], bots: N.rem ? [...N.rem.values()].filter(r => r.isBot).length : 0, lt: N.priv ? +(N.priv.lt || 0).toFixed(1) : null, started: N.priv ? !!N.priv.started : null, team: M && M.myTeam, map: A.curMap, hold: +(A.G.holdT || 0).toFixed(1), warm: N.hostWarm ? N.hostWarm.left : null }; });
module.exports = { mpPages, mpState };
