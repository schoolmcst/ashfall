/* ================================================================== CONTROLLER FOR THE NEWER SCREENS (1.2.90)
   Everything added lately works on a controller:
     MAP (D-pad down in LAST TOKE): left stick moves the cursor, A sets a waypoint, B / D-pad down closes.
     EMOTES: hold D-pad left (a tap still pings), then pick with the D-pad / stick and A.
     MAP EDITOR: left stick moves the cursor, A uses the tool (walls: A at the start, A at the end), LB / RB change the
       tool, Y changes the look, D-pad up / down the slot, D-pad left / right the mode, START plays it, B saves and closes.
     HUD EDITOR: LB / RB pick a part, the left stick moves it, D-pad up / down makes it bigger / smaller, X resets, A / B done.
     The cup, custom zombies, the events calendar, the buy menu, paste boxes: the D-pad moves, A presses, B closes, and
     A on a text box opens the on-screen keyboard. */
const PADX = { pingT: -1, emoted: false, ed: null, hud: 0, hudSel: 0 };
function padPingEmote(dt, held) {
  if (held) { if (PADX.pingT < 0) { PADX.pingT = 0; PADX.emoted = false; } PADX.pingT += dt; if (PADX.pingT > 0.45 && !PADX.emoted) { PADX.emoted = true; try { emoteWheel(); } catch (e) {} } return; }
  if (PADX.pingT >= 0 && !PADX.emoted) try { pingDo(); } catch (e) {}
  PADX.pingT = -1;
}
// a close / back / done / cancel button in an overlay
function padCloseBtn(modal) {
  const sel = '[data-tr="x"],[data-ed="x"],[data-zc="x"],[data-evc],[data-he="done"],[data-lc="no"],[data-lc="ok"],[data-close],[data-hm="close"],[data-mi="x"],[data-onb="x"]';
  return modal.querySelector(sel) || [...modal.querySelectorAll('button')].find(b => /^(CLOSE|BACK|DONE|CANCEL|OK|‹ BACK)$/i.test(b.textContent.trim()));
}
function padModal(modal, dt, mx, my, press, down) {
  if (modal.id === 'mapOv') return mapPad(dt, mx, my, press);
  if (modal.id === 'edOv') return padEditor(dt, mx, my, press);
  if (modal.id === 'hudEd') return padHud(dt, mx, my, press);
  if (modal.id === 'emoteWheel') { if (press(1)) { modal.remove(); return true; } return false; }
  if (press(1)) { const b = padCloseBtn(modal); if (b) { b.click(); return true; } if (modal.id === 'ltBuy') { try { ltCloseBuy(); } catch (e) {} return true; } }
  if (press(0)) { const a = document.activeElement; if (a && a.tagName === 'INPUT' && a.type !== 'range' && modal.contains(a) && typeof oskOpen === 'function') { oskOpen(a); return true; } }
  return false;
}
// ---------- the map editor on a controller
function padEditor(dt, mx, my, press) {
  const m = ED.map; if (!m) return true; const H = edH(m.size);
  if (!ED.padCur) ED.padCur = { x: 0, z: 0 };
  const c = ED.padCur, sp = m.size * 0.45 * dt; c.x = clamp(c.x + mx * sp, -H, H); c.z = clamp(c.z + my * sp, -H, H);
  const p = { x: Math.round(c.x), z: Math.round(c.z) };
  if (ED.drag) { const a = ED.drag.a; ED.drag.b = Math.abs(p.x - a.x) >= Math.abs(p.z - a.z) ? { x: p.x, z: a.z } : { x: a.x, z: p.z }; }
  const cyc = (list, cur, d) => list[(list.indexOf(cur) + d + list.length) % list.length];
  let redraw = true;
  if (press(4) || press(5)) { ED.tool = cyc(ED_TOOLS.map(t => t[0]), ED.tool, press(5) ? 1 : -1); ED.drag = null; edRender(); try { showMsg('TOOL · ' + ED_TOOLS.find(t => t[0] === ED.tool)[1]); } catch (e) {} return true; }
  if (press(3)) { m.look = cyc(Object.keys(ED_LOOKS), m.look, 1); edSave(); edRender(); return true; }
  if (press(12) || press(13)) { edSave(); edLoad((ED.slot + (press(12) ? 4 : 1)) % 5); edRender(); return true; }
  if (press(14) || press(15)) { const ms = ['tdm', 'ffa', 'kc', 'hp', 'dom'].filter(k => MODES[k]); ED.mode = cyc(ms, ED.mode, press(15) ? 1 : -1); edRender(); return true; }
  if (press(9)) { edPlay(); return true; }
  if (press(1)) { edSave(); const o = $('edOv'); if (o) o.remove(); ED.drag = null; return true; }
  if (press(0)) {
    const t = ED.tool;
    if (t === 'wall') { if (!ED.drag) ED.drag = { a: p, b: p }; else { const D = ED.drag; ED.drag = null; if (Math.hypot(D.b.x - D.a.x, D.b.z - D.a.z) >= 1 && m.items.length < 400) m.items.push({ t: 'wall', x0: D.a.x, z0: D.a.z, x1: D.b.x, z1: D.b.z }); } }
    else if (t === 'erase') { let best = -1, bd = 1.6; m.items.forEach((q, i) => { const d = q.t === 'wall' ? edSegDist(p, q) : Math.hypot(q.x - p.x, q.z - p.z); if (d < bd) { bd = d; best = i; } }); if (best >= 0) m.items.splice(best, 1); }
    else if (t === 'spawnA') m.A = p; else if (t === 'spawnB') m.B = p; else if (t === 'point') m.P = p;
    else if (m.items.length < 400) m.items.push({ t, x: p.x, z: p.z, r: false });
    edSave(); try { sfx.ui(); } catch (e) {}
  }
  if (press(2)) { const it = m.items.find(q => q.t === 'low' && Math.hypot(q.x - p.x, q.z - p.z) < 1.5); if (it) { it.r = !it.r; edSave(); } }
  if (redraw) edDraw();
  return true;
}
// ---------- the HUD editor on a controller
function padHud(dt, mx, my, press) {
  const boxes = document.querySelectorAll('.hud-ed-box'); if (!boxes.length) return true;
  if (press(4) || press(5)) { PADX.hudSel = (PADX.hudSel + (press(5) ? 1 : -1) + boxes.length) % boxes.length; }
  boxes.forEach((b, i) => b.classList.toggle('sel', i === PADX.hudSel));
  const part = HUD_PARTS.filter(([id]) => $(id))[PADX.hudSel]; if (!part) return true; const id = part[0];
  S.hud = S.hud || {}; const c = S.hud[id] || [0, 0, 1];
  if (Math.abs(mx) > 0.15 || Math.abs(my) > 0.15) { S.hud[id] = [Math.round(c[0] + mx * 420 * dt), Math.round(c[1] + my * 420 * dt), c[2] || 1]; hudApply(); }
  if (press(12) || press(13)) { const k = Math.max(0.5, Math.min(2, Math.round(((c[2] || 1) + (press(12) ? 0.1 : -0.1)) * 10) / 10)); S.hud[id] = [c[0], c[1], k]; hudApply(); }
  if (press(2)) { const b = document.querySelector('[data-he="reset"]'); if (b) b.click(); }
  if (press(0) || press(1)) { const b = document.querySelector('[data-he="done"]'); if (b) b.click(); try { saveSettings(); } catch (e) {} return true; }
  try { if (window.__hudPlace) window.__hudPlace(); } catch (e) {}
  return true;
}
(() => { const s = document.createElement('style'); s.textContent = `.hud-ed-box.sel{border-color:#ffd23a!important;background:rgba(255,210,58,.22)!important;color:#ffd23a}`; document.head.appendChild(s); })();
