/* ================================================================== on-screen keyboard (controller)
   Pressing A on a text box (friend code, callsign, private match code) opens this. D-pad / stick moves, A types the
   key, X deletes, Y adds a space, B or START finishes. A mouse or a real keyboard works on it too. */
const OSK = { el: null, input: null, prevFocus: null };
const OSK_ROWS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL-', 'ZXCVBNM_.'];
const oskIsOpen = () => !!OSK.el;
function oskOpen(input) {
  if (OSK.el) oskClose();
  OSK.input = input; OSK.prevFocus = input;
  const b = document.createElement('div'); b.id = 'oskBox';
  b.innerHTML = `<div class="osk-p"><div class="osk-h">${(input.placeholder || input.getAttribute('aria-label') || 'TYPE').toUpperCase()}</div><div class="osk-val" id="oskVal"></div>` +
    OSK_ROWS.map(r => `<div class="osk-r">${[...r].map(c => `<button class="osk-k" data-k="${c}">${c}</button>`).join('')}</div>`).join('') +
    `<div class="osk-r"><button class="osk-k wide" data-k="space">SPACE <small>Y</small></button><button class="osk-k wide" data-k="back">⌫ DELETE <small>X</small></button><button class="osk-k wide done" data-k="done">DONE <small>B</small></button></div></div>`;
  document.body.appendChild(b); OSK.el = b;
  for (const k of b.querySelectorAll('[data-k]')) k.onclick = () => oskKey(k.dataset.k);
  b.onclick = e => { if (e.target === b) oskClose(); };
  oskShow(); setTimeout(() => { const f = b.querySelector('[data-k="1"]'); if (f) f.focus(); }, 0);
}
function oskShow() { const v = $('oskVal'); if (v && OSK.input) v.textContent = OSK.input.value || ' '; }
function oskKey(k) {
  const i = OSK.input; if (!i) return;
  const max = i.maxLength > 0 ? i.maxLength : 32;
  if (k === 'done') { oskClose(); return; }
  if (k === 'back') i.value = i.value.slice(0, -1);
  else if (i.value.length < max) i.value += k === 'space' ? ' ' : k;
  i.dispatchEvent(new Event('input', { bubbles: true })); oskShow(); try { sfx.ui(); } catch (e) {}
}
function oskClose() {
  if (!OSK.el) return;
  const i = OSK.input; OSK.el.remove(); OSK.el = null; OSK.input = null;
  if (i) { i.dispatchEvent(new Event('change', { bubbles: true })); try { i.focus(); } catch (e) {} }
}
// called from the controller poll; returns true while the keyboard is open (it takes the buttons)
function oskPad(press) {
  if (!OSK.el) return false;
  if (press(0)) { const a = document.activeElement; if (a && OSK.el.contains(a)) a.click(); }
  if (press(2)) oskKey('back');
  if (press(3)) oskKey('space');
  if (press(1) || press(9)) oskClose();
  return true;
}
(() => {
  const s = document.createElement('style');
  s.textContent = `#oskBox{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;padding-bottom:6vh}
.osk-p{background:#121518;border:1px solid rgba(224,180,74,.45);padding:16px 18px;box-shadow:0 20px 60px rgba(0,0,0,.6)}.osk-h{font-size:11px;letter-spacing:.35em;color:var(--accent)}
.osk-val{font-size:26px;letter-spacing:.2em;color:#fff;padding:8px 10px;margin:8px 0 12px;background:rgba(255,255,255,.05);border-bottom:2px solid var(--accent);min-height:34px;white-space:pre}
.osk-r{display:flex;gap:6px;margin-top:6px;justify-content:center}.osk-k{pointer-events:auto;cursor:pointer;font:700 16px system-ui,sans-serif;color:#e6e8ea;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);width:46px;height:44px}
.osk-k.wide{width:auto;flex:1;padding:0 14px;font-size:12px;letter-spacing:.2em}.osk-k small{opacity:.55;margin-left:6px}.osk-k.done{color:#111;background:var(--accent)}
.osk-k:hover,.osk-k:focus{outline:0;border-color:var(--accent);background:rgba(224,180,74,.25);color:#fff}`;
  document.head.appendChild(s);
  // a clear gold ring on whatever the controller / arrow keys are on; the mouse turns it off again
  const r = document.createElement('style');
  r.textContent = `body.padnav,body.padnav *{cursor:none!important}
body.padnav button:focus,body.padnav .sw:focus,body.padnav input:focus{outline:2px solid var(--accent)!important;outline-offset:2px;box-shadow:0 0 0 4px rgba(224,180,74,.18),0 0 18px rgba(224,180,74,.25)}`;
  document.head.appendChild(r);
  addEventListener('mousemove', e => { if (Math.abs(e.movementX) + Math.abs(e.movementY) > 3) document.body.classList.remove('padnav'); });
  addEventListener('keydown', e => { if (/^Arrow|^Tab$/.test(e.code) && curScreen) document.body.classList.add('padnav'); else inputMode('kb'); });
  addEventListener('mousedown', () => inputMode('kb')); addEventListener('wheel', () => inputMode('kb'), { passive: true });
})();
