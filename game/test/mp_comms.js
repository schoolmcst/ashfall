// desktop-app chat + voice: two pages in a real WebRTC match (local stand-in signalling), fake microphones.
// Checks: ALL chat reaches the other player, voice frames from A are decoded on B, chat clears on the next match.
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const PORT = 39556; await require('./sigserver.js')(PORT);
  const html = fs.readFileSync(path.join(__dirname, '..', 'ashfall.html'), 'utf8'), three = fs.readFileSync(path.join(__dirname, '..', '..', 'tools', 'three.min.js'), 'utf8');
  const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=WebRtcHideLocalIpsWithMdns', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'];
  const initFn = port => {
    for (const t of ['blur', 'visibilitychange']) { window.addEventListener(t, e => e.stopImmediatePropagation(), true); document.addEventListener(t, e => e.stopImmediatePropagation(), true); }
    const W = window.WebSocket; window.WebSocket = function (u, p) { return new W(String(u).replace('wss://0.peerjs.com:443', 'ws://127.0.0.1:' + port), p); }; window.WebSocket.prototype = W.prototype;
    window.ASHFALL_APP = { version: '1.0.0', lan: { announce: () => {}, games: () => [] } };
    try { localStorage.setItem('dz_seen_update', '9'); } catch (e) {}
  };
  const route = r => { const u = r.request().url(); if (u.includes('three')) return r.fulfill({ body: three, contentType: 'application/javascript' }); if (u.startsWith('http://localhost:39777/')) return r.fulfill({ body: html, contentType: 'text/html' }); return r.abort(); };
  const pages = [], errs = [], bs = [];
  for (let i = 0; i < 2; i++) { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args }); bs.push(b);
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, permissions: ['microphone'] }); await ctx.addInitScript(initFn, PORT); await ctx.route('**/*', route);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(i + ' ' + e.message)); await p.goto('http://localhost:39777/index.html#debug'); pages.push(p); }
  for (const p of pages) await p.waitForFunction(() => window.__A && window.__A.G.state === 'menu', null, { timeout: 120000 });
  const [A, B] = pages, ev = (p, f, a) => p.evaluate(f, a);
  const sup = await ev(A, () => ({ enc: typeof AudioEncoder, proc: typeof MediaStreamTrackProcessor, md: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia), secure: isSecureContext }));
  for (const [p, n] of [[A, 'ALPHA'], [B, 'BRAVO']]) { await ev(p, n => { const X = window.__A; X.NET.nick = n; X.G.noRender = true; X.startMatch('otdm'); }, n); await A.waitForTimeout(n === 'ALPHA' ? 6000 : 1000); }
  await A.waitForTimeout(9000);
  for (const p of pages) await ev(p, () => { const G = window.__A.G; if (G.state === 'paused') G.state = 'playing'; G.holdT = 0; G.loadT = 0; });
  const linked = await ev(B, () => ({ host: !!window.__A.NET.room.host, rem: [...window.__A.NET.rem.values()].filter(R => !R.isBot).map(R => R.entry.name) }));
  // chat
  await ev(A, () => window.__A.chatSend('hello from alpha', 'all')); await A.waitForTimeout(2500);
  const chatB = await ev(B, () => window.__A.CHAT.log.map(m => m.who + ': ' + m.txt));
  // voice: both on open mic (the fake mic plays a tone)
  for (const p of pages) await ev(p, () => { window.__A.VOICE.sens = 100; window.__A.commsAct('vc-open'); });
  await A.waitForTimeout(6000);
  const vA = await ev(A, () => ({ on: window.__A.VOICE.on, err: window.__A.VOICE.err, talking: window.__A.VOICE.talking, level: +window.__A.VOICE.level.toFixed(3), seq: window.__A.VOICE.seq }));
  const vB = await ev(B, () => ({ on: window.__A.VOICE.on, speakers: [...window.__A.VOICE.spk.values()].map(s => s.name), hud: document.getElementById('voiceHud').textContent }));
  await B.screenshot({ path: process.env.OUT ? process.env.OUT + '/mp_voice_B.png' : 'mp_voice_B.png' });
  // a new match clears the match chat
  const cleared = await ev(B, () => { window.__A.chatNewMatch ? 0 : 0; const n0 = window.__A.CHAT.log.length; window.__A.startMatch('otdm'); return { before: n0, after: window.__A.CHAT.log.filter(m => m.ch === 'all').length }; });
  console.log(JSON.stringify({ sup, linked, chatB, vA, vB, cleared }, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  for (const b of bs) await b.close(); process.exit(0);
})();
