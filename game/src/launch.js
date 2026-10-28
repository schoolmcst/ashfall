/* ================================================================== launch polish: error reports, save codes, blocking
   ERROR REPORTS: every red error is kept (the last 30, with the version, the mode, the map and the screen) and the red
   box gets COPY REPORT and HIDE buttons, so a player can send the developer exactly what went wrong. They are also in
   SETTINGS > ACCOUNT > ERROR REPORTS.
   SAVE CODES: your whole save (every ashfall.* key: levels, camos, battle pass, classes, stats, settings, friends) as
   one compressed code or a .txt file, to keep safe or move to another computer, and back. SETTINGS > ACCOUNT.
   BLOCK: a blocked player is muted (voice and chat) and their friend requests never reach you. Block from the pause
   menu's player list; the list (and UNBLOCK) is in SETTINGS > ACCOUNT. */
const LN = { errs: [], block: { names: [], codes: [] } };
try { const a = JSON.parse(localStorage.getItem('ashfall.errlog') || '[]'); if (Array.isArray(a)) LN.errs = a.slice(-30); } catch (e) {}
try { const b = JSON.parse(localStorage.getItem('ashfall.block.v1') || 'null'); if (b && Array.isArray(b.names)) LN.block = { names: b.names.slice(0, 100), codes: (b.codes || []).slice(0, 100) }; } catch (e) {}
const lnSaveBlock = () => { try { localStorage.setItem('ashfall.block.v1', JSON.stringify(LN.block)); } catch (e) {} };
const lnBlocked = (name, code) => !!((name && LN.block.names.includes(name)) || (code && LN.block.codes.includes(code)));
const lnVer = () => { try { return (window.ASHFALL_APP && window.ASHFALL_APP.version) || 'web'; } catch (e) { return 'web'; } };

/* ---------- error reports */
function lnWhere() {
  try {
    const mode = typeof M !== 'undefined' && M ? (M.mode === 'camp' && typeof CAMP !== 'undefined' && CAMP.m ? 'campaign ' + CAMP.m.id + ' step ' + CAMP.i : M.online ? 'online ' + M.mode : M.mode) : '?';
    return `${mode} · map ${typeof curMap !== 'undefined' ? curMap : '?'} · screen ${typeof curScreen !== 'undefined' ? curScreen || 'game' : '?'} · state ${typeof G !== 'undefined' ? G.state : '?'}`;
  } catch (e) { return '?'; }
}
function lnReport(list) {
  const L = list || LN.errs.slice(-6);
  return `DARKZONE ERROR REPORT · v${lnVer()} BETA · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}\n` + L.map(e => `[${e.t}] ${e.where}\n${e.msg}`).join('\n\n');
}
const _showErrOld = window.showErr;
window.showErr = function (msg) {
  try {
    msg = String(msg || '').slice(0, 900);
    const last = LN.errs[LN.errs.length - 1];
    if (!last || last.msg !== msg) {
      LN.errs.push({ t: new Date().toISOString().slice(0, 19).replace('T', ' '), v: lnVer(), where: lnWhere(), msg });
      if (LN.errs.length > 30) LN.errs.splice(0, LN.errs.length - 30);
      try { localStorage.setItem('ashfall.errlog', JSON.stringify(LN.errs)); } catch (e) {}
    }
    const e = document.getElementById('err'); if (!e) return;
    let body = e.querySelector('.err-body');
    if (!body) {
      e.innerHTML = '<div class="err-top"><b>SOMETHING WENT WRONG IN THE GAME</b><span>This is a bug in the game, not your computer. Press COPY REPORT and send it to the developer. You can keep playing.</span><button data-errc>COPY REPORT</button><button data-errh>HIDE</button></div><div class="err-body"></div>';
      body = e.querySelector('.err-body');
      e.querySelector('[data-errc]').onclick = ev => { ev.stopPropagation(); lnCopy(lnReport(), e.querySelector('[data-errc]')); };
      e.querySelector('[data-errh]').onclick = ev => { ev.stopPropagation(); e.style.display = 'none'; body.textContent = ''; };
    }
    e.style.display = 'block';
    if (body.textContent.indexOf(msg) < 0) body.textContent += msg + '\n';
  } catch (err) { try { _showErrOld && _showErrOld(msg); } catch (e2) {} }
};
function lnCopy(text, btn) {
  const done = ok => { if (btn) { const t = btn.textContent; btn.textContent = ok ? 'COPIED ✓' : 'SELECT AND COPY IT'; setTimeout(() => { btn.textContent = t; }, 1800); } };
  try { navigator.clipboard.writeText(text).then(() => done(true), () => { lnCopyOld(text); done(true); }); } catch (e) { lnCopyOld(text); done(true); }
}
function lnCopyOld(text) { try { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); } catch (e) {} }

/* ---------- save codes */
const LN_PRE = 'DZSAVE1:';
async function lnMakeCode() {
  const keys = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^ashfall\./.test(k) && k !== 'ashfall.errlog') keys[k] = localStorage.getItem(k); }
  const json = JSON.stringify({ v: 1, t: Date.now(), ver: lnVer(), keys });
  let bytes = new TextEncoder().encode(json), tag = 'r';
  try { if (typeof CompressionStream !== 'undefined') { bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); tag = 'z'; } } catch (e) { bytes = new TextEncoder().encode(json); tag = 'r'; }
  let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return LN_PRE + tag + btoa(bin);
}
async function lnReadCode(code) {
  code = String(code || '').trim().replace(/\s+/g, '');
  if (!code.startsWith(LN_PRE)) throw new Error('That is not a DarkZone save code (it should start with ' + LN_PRE + ')');
  const tag = code[LN_PRE.length], bin = atob(code.slice(LN_PRE.length + 1)), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  let json;
  if (tag === 'z') json = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  else json = new TextDecoder().decode(bytes);
  const o = JSON.parse(json); if (!o || o.v !== 1 || !o.keys || typeof o.keys !== 'object') throw new Error('The save code is damaged');
  return o;
}
async function lnLoadSave(o) {
  for (const k of Object.keys(localStorage)) if (/^ashfall\./.test(k) && k !== 'ashfall.errlog') localStorage.removeItem(k);
  for (const [k, v] of Object.entries(o.keys)) if (/^ashfall\./.test(k) && typeof v === 'string') localStorage.setItem(k, v);
  try { if (typeof sbPut === 'function') { SB.bak = Object.assign({}, o.keys); SB.last = ''; await sbPut('local', { t: Date.now(), keys: o.keys }); } } catch (e) {}   // the backup copy too, so it doesn't put the old save back
  setTimeout(() => location.reload(), 400);
}
function lnOverlay(html, wire) {
  let ov = $('lnOv'); if (ov) ov.remove();
  ov = document.createElement('div'); ov.className = 'pr-ov'; ov.id = 'lnOv'; ov.innerHTML = `<div class="pr-box ln-box">${html}</div>`; document.body.appendChild(ov);
  ov.querySelector('[data-lnx]') && (ov.querySelector('[data-lnx]').onclick = () => ov.remove());
  try { wire && wire(ov); } catch (e) { reportError(e); }
  setTimeout(() => { const f = ov.querySelector('button, textarea'); if (f) f.focus(); }, 0);
  return ov;
}
async function lnSaveUi() {
  const code = await lnMakeCode(), kb = Math.round(code.length / 1024);
  lnOverlay(`<small>YOUR SAVE</small><b>SAVE CODE</b><p>Everything: levels, camos, battle pass, classes, stats, settings, friends, campaign. Keep it somewhere safe, or load it on another computer. ${kb} KB.</p>
    <textarea readonly class="ln-code">${code}</textarea>
    <div class="ln-btns"><button class="btn primary" data-lncopy>COPY THE CODE</button><button class="btn" data-lnfile>SAVE AS A FILE</button><button class="btn" data-lnx>CLOSE</button></div>`, ov => {
    ov.querySelector('[data-lncopy]').onclick = e => lnCopy(code, e.target);
    ov.querySelector('[data-lnfile]').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' })); a.download = 'darkzone-save-' + new Date().toISOString().slice(0, 10) + '.txt'; document.body.appendChild(a); a.click(); a.remove(); };
    ov.querySelector('textarea').onclick = e => e.target.select();
  });
}
function lnLoadUi() {
  lnOverlay(`<small>YOUR SAVE</small><b>LOAD A SAVE</b><p>Paste a save code, or pick a save file. <em>It replaces the save on this computer.</em></p>
    <textarea class="ln-code" placeholder="DZSAVE1:..."></textarea><input type="file" accept=".txt,text/plain" hidden>
    <div class="ln-msg"></div>
    <div class="ln-btns"><button class="btn primary" data-lnload>LOAD THIS SAVE</button><button class="btn" data-lnpick>PICK A FILE</button><button class="btn" data-lnx>CANCEL</button></div>`, ov => {
    const ta = ov.querySelector('textarea'), msg = ov.querySelector('.ln-msg'), fi = ov.querySelector('input[type=file]');
    ta.onkeydown = e => e.stopPropagation(); ta.onkeyup = e => e.stopPropagation();
    ov.querySelector('[data-lnpick]').onclick = () => fi.click();
    fi.onchange = () => { const f = fi.files && fi.files[0]; if (f) f.text().then(t => { ta.value = t.trim(); }); };
    ov.querySelector('[data-lnload]').onclick = async () => {
      try {
        const o = await lnReadCode(ta.value), when = new Date(o.t).toLocaleString(), lv = (() => { try { const p = JSON.parse(o.keys['ashfall.prog.v1'] || 'null'); return p ? ' · level ' + (typeof lvlOf === 'function' ? lvlOf(p.xp || 0) : '?') : ''; } catch (e) { return ''; } })();
        if (ov.dataset.sure !== '1') { ov.dataset.sure = '1'; msg.textContent = `Save from ${when}${lv}. Press LOAD THIS SAVE again to replace your save with it.`; ov.querySelector('[data-lnload]').textContent = 'YES, REPLACE MY SAVE'; return; }
        msg.textContent = 'Loading… the game restarts in a moment.'; await lnLoadSave(o);
      } catch (e) { msg.textContent = e.message || String(e); ov.dataset.sure = ''; }
    };
  });
}
function lnBlockUi() {
  const names = LN.block.names;
  lnOverlay(`<small>SAFETY</small><b>BLOCKED PLAYERS</b><p>${names.length ? 'Blocked players are muted and their friend requests never reach you.' : 'Nobody is blocked. Block a player from the pause menu’s player list in an online match.'}</p>
    <div class="ln-list">${names.map((n, i) => `<div class="ln-row"><span>${chatEsc(n)}</span><button class="btn mini" data-lnub="${i}">UNBLOCK</button></div>`).join('')}</div>
    <div class="ln-btns"><button class="btn" data-lnx>CLOSE</button></div>`, ov => {
    for (const b of ov.querySelectorAll('[data-lnub]')) b.onclick = () => { names.splice(+b.dataset.lnub, 1); lnSaveBlock(); lnBlockUi(); };
  });
}
function lnErrUi() {
  const L = LN.errs.slice().reverse();
  lnOverlay(`<small>HELP</small><b>ERROR REPORTS</b><p>${L.length ? 'The last errors the game ran into. Press COPY ALL and send it to the developer.' : 'No errors so far.'}</p>
    <div class="ln-list ln-errs">${L.map(e => `<div class="ln-err"><em>${e.t} · v${e.v} · ${chatEsc(e.where)}</em>${chatEsc(e.msg)}</div>`).join('')}</div>
    <div class="ln-btns">${L.length ? '<button class="btn primary" data-lncopy>COPY ALL</button><button class="btn" data-lnclear>CLEAR</button>' : ''}<button class="btn" data-lnx>CLOSE</button></div>`, ov => {
    const c = ov.querySelector('[data-lncopy]'); if (c) c.onclick = e => lnCopy(lnReport(LN.errs), e.target);
    const k = ov.querySelector('[data-lnclear]'); if (k) k.onclick = () => { LN.errs = []; try { localStorage.removeItem('ashfall.errlog'); } catch (e) {} lnErrUi(); };
  });
}
function lnAct(act) {
  if (act === 'sv-make') { sfx.ui(); lnSaveUi(); return true; }
  if (act === 'sv-load') { sfx.ui(); lnLoadUi(); return true; }
  if (act === 'bk-list') { sfx.ui(); lnBlockUi(); return true; }
  if (act === 'er-view') { sfx.ui(); lnErrUi(); return true; }
  if (/^bk-p\d+$/.test(act)) {
    const n = (($('pzSide') || {})._players || [])[+act.slice(4)]; if (!n) return true;
    const i = LN.block.names.indexOf(n); if (i >= 0) LN.block.names.splice(i, 1); else { LN.block.names.push(n); const f = FRIENDS.find(x => x.n === n); if (f && !LN.block.codes.includes(f.c)) LN.block.codes.push(f.c); }
    lnSaveBlock(); try { renderPauseSide(); focusFirst(`[data-act="${act}"]`); } catch (e) {} sfx.ui(); return true;
  }
  return false;
}
// Escape closes the overlay
addEventListener('keydown', e => { if (e.key === 'Escape' && $('lnOv')) { e.stopPropagation(); $('lnOv').remove(); } }, true);
(() => { const s = document.createElement('style'); s.textContent = `
#err .err-top{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:6px;font-family:inherit}#err .err-top b{letter-spacing:.14em;font-size:13px}#err .err-top span{flex:1 1 300px;font-size:12px;opacity:.9}
#err .err-top button{pointer-events:auto;cursor:pointer;font:600 11px/1 sans-serif;letter-spacing:.12em;padding:6px 10px;background:#fff;color:#7a0c0c;border:0}#err .err-top button[data-errh]{background:rgba(255,255,255,.2);color:#fff}
#err .err-body{max-height:30vh;overflow:auto;font-size:12px}
.ln-box{width:min(680px,92vw)!important;text-align:left}.ln-box p{font-size:13px;line-height:1.5;color:#ccc}.ln-box p em{color:#ffb070;font-style:normal}
.ln-code{width:100%;height:120px;box-sizing:border-box;background:#0b0d10;color:#8adf6a;border:1px solid rgba(255,255,255,.2);font:11px/1.35 Consolas,monospace;padding:8px;resize:none;word-break:break-all;pointer-events:auto}
.ln-btns{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.ln-msg{min-height:18px;font-size:12px;color:#ffd070;margin-top:6px}
.ln-list{max-height:46vh;overflow:auto;display:flex;flex-direction:column;gap:6px;pointer-events:auto}.ln-row{display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border:1px solid rgba(255,255,255,.15)}.ln-row .btn.mini{width:auto;padding:0 12px;flex:0 0 auto}
.ln-err{font:11px/1.45 Consolas,monospace;white-space:pre-wrap;padding:8px;border:1px solid rgba(255,90,74,.35);background:rgba(120,10,10,.25);color:#fff}.ln-err em{display:block;font-style:normal;color:#ffb0a0;margin-bottom:4px}
`; document.head.appendChild(s); })();
