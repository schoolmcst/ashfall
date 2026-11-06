/* ================================================================== LOADOUT CODES (1.2.83)
   SHARE CODE (next to the class tabs in CREATE A CLASS) turns your class into a short code - the primary and secondary
   with their attachments, the equipment and the three perks - and copies it. PASTE CODE takes a friend's code and puts
   that build into the class you're editing (keeping your class name). Codes look like DZ1-xxxxxxxx. Anything in a code
   that doesn't exist (an old attachment, a weapon you can't use there) is skipped. */
const LC_PRE = 'DZ1-';
function lcMake(c) {
  c = c || activeClass(); const o = { p: c.p, s: c.s, e: c.e, a: {}, fu: c.fu };
  for (const k of PERK_KEYS) o[k] = c[k];
  for (const id of [c.p, c.s]) if (ATTS[id] && typeof ATTS[id] === 'object') o.a[id] = ATTS[id];
  const b = btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return LC_PRE + b;
}
function lcRead(code) {
  code = String(code || '').trim(); if (!code.toUpperCase().startsWith(LC_PRE)) return null;
  try { let b = code.slice(LC_PRE.length).replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '='; const o = JSON.parse(decodeURIComponent(escape(atob(b)))); return o && typeof o === 'object' ? o : null; } catch (e) { return null; }
}
// put a code's build into the class being edited; returns what was applied (or null)
function lcApply(code) {
  const o = lcRead(code); if (!o) return null; const c = activeClass(), got = [];
  if (ARM[o.p] && CATS[ARM[o.p].cat] && CATS[ARM[o.p].cat].slot === 'primary') { c.p = o.p; got.push(ARM[o.p].name); }
  if (ARM[o.s] && CATS[ARM[o.s].cat] && CATS[ARM[o.s].cat].slot === 'secondary') { c.s = o.s; got.push(ARM[o.s].name); }
  if (EQUIP[o.e]) c.e = o.e;
  if (typeof FU_TYPES !== 'undefined' && FU_TYPES[o.fu]) c.fu = o.fu;
  PERK_KEYS.forEach((k, i) => { if (PERKS[o[k]] && PERKS[o[k]].t === i + 1) c[k] = o[k]; });
  if (o.a && typeof o.a === 'object') for (const id of [c.p, c.s]) {
    const want = o.a[id]; if (!want || typeof want !== 'object') continue; const out = {};
    for (const s in want) { const a = ATT_BY_ID[want[s]]; if (a && a.slot === s && attOK(a, ARM[id])) out[s] = a.id; }
    ATTS[id] = out;
  }
  saveClasses(); return got;
}
// the two buttons and their overlays
function lcBox(html, wire) {
  const o = document.createElement('div'); o.className = 'onb-ov'; o.innerHTML = `<div class="onb-box">${html}</div>`; document.body.appendChild(o);
  const close = () => { o.remove(); removeEventListener('keydown', k, true); }, k = e => { if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  addEventListener('keydown', k, true); wire(o, close); return o;
}
function lcShare() {
  const code = lcMake(); try { achAdd('codes'); } catch (e) {} try { navigator.clipboard && navigator.clipboard.writeText(code); } catch (e) {}
  lcBox(`<small>CREATE A CLASS · ${activeClass().name}</small><b>SHARE THIS BUILD</b><p>The code is copied. Send it to a friend; they press PASTE CODE in Create a Class.</p><input class="lc-in" readonly value="${code}"><div class="onb-acts"><button class="btn primary" data-lc="ok">DONE</button></div>`,
    (o, close) => { const i = o.querySelector('input'); i.onkeydown = e => e.stopPropagation(); setTimeout(() => { i.focus(); i.select(); }, 50); o.querySelector('[data-lc="ok"]').onclick = close; });
}
function lcPaste() {
  lcBox(`<small>CREATE A CLASS · ${activeClass().name}</small><b>PASTE A BUILD</b><p>Paste a friend's code (DZ1-…). It replaces the weapons, attachments, equipment and perks of this class.</p><input class="lc-in" placeholder="DZ1-..." maxlength="600"><div class="lc-err"></div><div class="onb-acts"><button class="btn primary" data-lc="go">USE THIS BUILD</button><button class="btn" data-lc="no">CANCEL</button></div>`,
    (o, close) => {
      const i = o.querySelector('input'); i.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') go(); }; setTimeout(() => i.focus(), 50);
      const go = () => { const got = lcApply(i.value); if (!got) { o.querySelector('.lc-err').textContent = 'That is not a build code.'; return; } close(); try { sfx.streak(); showBanner('BUILD LOADED', got.join(' · ') || activeClass().name); renderLoadout(); } catch (e) {} };
      o.querySelector('[data-lc="go"]').onclick = go; o.querySelector('[data-lc="no"]').onclick = close;
    });
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-lcb]'); if (!b) return; try { sfx.ui(); } catch (er) {} if (b.dataset.lcb === 'share') lcShare(); else lcPaste(); });
(() => { const s = document.createElement('style'); s.textContent = '.lc-in{pointer-events:auto;width:100%;box-sizing:border-box;font:13px/1.4 monospace;padding:10px;background:rgba(0,0,0,.5);border:1px solid var(--line);color:#fff}.lc-err{color:#ff6a5a;font-size:12px;min-height:14px}.lo-lc{margin-left:auto;display:flex;gap:6px;align-items:center}.lo-lc .mini{width:auto;padding:0 10px;height:28px;font-size:10px;letter-spacing:.16em}'; document.head.appendChild(s); })();
