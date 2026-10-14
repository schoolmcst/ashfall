// ASHFALL desktop app: opens the game, keeps it patched from GitHub, finds games on the local network
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path'), fs = require('fs'), crypto = require('crypto'), dgram = require('dgram');

// the TEST app (packaged with "channel": "test") reads release-test/, keeps its own saves and says TEST everywhere
let PKG = {}; try { PKG = require('./package.json'); } catch (e) {}
const TEST = PKG.channel === 'test', APPNAME = TEST ? 'DARKZONE TEST' : 'DARKZONE';
const UPDATE_BASE = process.env.ASHFALL_UPDATE_BASE || ('https://raw.githubusercontent.com/schoolmcst/ashfall/main/' + (TEST ? 'release-test/' : 'release/'));
const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const LAN_PORT = 41234;
const bundledDir = path.join(__dirname, 'game');
const BUNDLED = JSON.parse(fs.readFileSync(path.join(bundledDir, 'version.json'), 'utf8'));
let dataDir = null, win = null, current = null, justUpdated = null;

const verCmp = (a, b) => { const pa = String(a).split('.').map(n => parseInt(n, 10) || 0), pb = String(b).split('.').map(n => parseInt(n, 10) || 0); for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0); } return 0; };
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');

// the newest copy on this computer: a downloaded patch if it is newer than the one inside the app
function installed() {
  try {
    const v = JSON.parse(fs.readFileSync(path.join(dataDir, 'version.json'), 'utf8'));
    if (fs.existsSync(path.join(dataDir, 'ashfall.html')) && verCmp(v.version, BUNDLED.version) > 0) return Object.assign({ dir: dataDir }, v);
  } catch (e) {}
  return Object.assign({ dir: bundledDir }, BUNDLED);
}
async function get(url, ms) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url + '?t=' + Date.now(), { signal: c.signal, cache: 'no-store' }); if (!r.ok) throw new Error('http ' + r.status); return r; } finally { clearTimeout(t); }
}
// download a newer game if GitHub has one; the app itself never changes, only the game inside it
async function checkUpdate(cur) {
  const v = await (await get(UPDATE_BASE + 'version.json', 6000)).json();
  if (!v || !v.version || verCmp(v.version, cur.version) <= 0) return null;
  if (v.minApp && verCmp(v.minApp, app.getVersion()) > 0) return null;   // this patch needs a newer app download
  status(`Downloading update ${v.version}…`);
  const html = await (await get(UPDATE_BASE + (v.file || 'ashfall.html'), 120000)).text();
  if (v.sha256 && sha256(html) !== v.sha256) throw new Error('update failed its check');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'ashfall.html.tmp'), html.split(THREE_CDN).join('three.min.js'));
  fs.copyFileSync(path.join(bundledDir, 'three.min.js'), path.join(dataDir, 'three.min.js'));
  fs.renameSync(path.join(dataDir, 'ashfall.html.tmp'), path.join(dataDir, 'ashfall.html'));
  fs.writeFileSync(path.join(dataDir, 'version.json'), JSON.stringify({ version: v.version, notes: v.notes || [] }));
  return v;
}

function status(t) { if (win && !win.isDestroyed()) win.webContents.executeJavaScript(`document.getElementById('s')&&(document.getElementById('s').textContent=${JSON.stringify(t)})`).catch(() => {}); }
const SPLASH = 'data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html><html><body style="margin:0;background:#0d0f12;color:#e8e2d0;font:600 14px system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:14px;letter-spacing:.2em"><div style="font-size:42px;letter-spacing:.35em;color:#ffd24a">${APPNAME}</div><div id="s">CHECKING FOR UPDATES…</div></body></html>`);

async function start() {
  dataDir = path.join(app.getPath('userData'), 'game');
  win = new BrowserWindow({ width: 1600, height: 900, minWidth: 960, minHeight: 540, backgroundColor: '#0d0f12', title: APPNAME, autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  await win.loadURL(SPLASH);
  current = installed();
  try { const v = await checkUpdate(current); if (v) { justUpdated = { version: v.version, notes: v.notes || [] }; current = installed(); } }
  catch (e) { status('Offline: playing the version you have'); await new Promise(r => setTimeout(r, 700)); }
  await win.loadFile(path.join(current.dir, 'ashfall.html'));
}

// ---- the game asks for these through preload.js
ipcMain.on('app-info', e => { e.returnValue = { channel: TEST ? 'test' : 'public', version: current ? current.version : BUNDLED.version, appVersion: app.getVersion(), justUpdated, notes: current ? current.notes || [] : [] }; justUpdated = null; });

// ---- games on your Wi-Fi: hosts shout a short message on the local network every 2 s, everyone listens
const lanGames = new Map(); let sock = null; const myId = crypto.randomBytes(6).toString('hex');
function lanStart() {
  try {
    sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    sock.on('message', buf => { try { const m = JSON.parse(String(buf)); if (m.g !== 'ashfall' || m.id === myId || m.v !== (current && current.version)) return; lanGames.set(m.slot, { slot: String(m.slot).slice(0, 80), name: String(m.name).slice(0, 16), mode: String(m.mode).slice(0, 8), n: m.n | 0, t: Date.now() }); } catch (e) {} });
    sock.on('error', () => {});
    sock.bind(LAN_PORT, () => { try { sock.setBroadcast(true); } catch (e) {} });
  } catch (e) { sock = null; }
}
ipcMain.on('lan-announce', (e, g) => { if (!sock || !g || typeof g.slot !== 'string') return; const b = Buffer.from(JSON.stringify({ g: 'ashfall', id: myId, v: current && current.version, slot: g.slot, name: g.name, mode: g.mode, n: g.n })); try { sock.send(b, LAN_PORT, '255.255.255.255'); } catch (err) {} });
ipcMain.on('lan-games', e => { const now = Date.now(); for (const [k, g] of lanGames) if (now - g.t > 7000) lanGames.delete(k); e.returnValue = [...lanGames.values()]; });

Menu.setApplicationMenu(Menu.buildFromTemplate([
  ...(process.platform === 'darwin' ? [{ label: 'DARKZONE', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] }] : []),
  { label: 'View', submenu: [{ role: 'togglefullscreen', accelerator: 'F11' }, { role: 'reload', accelerator: 'CmdOrCtrl+R' }, { role: 'toggleDevTools', accelerator: 'CmdOrCtrl+Shift+I' }] },
]));
app.whenReady().then(() => { lanStart(); start(); });
app.on('window-all-closed', () => app.quit());
