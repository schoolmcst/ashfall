/* ================================================================== HOTBOX HORDE on a controller (1.2.108)
   Outside build mode: D-PAD RIGHT build mode · LB hero ability · D-PAD UP crew orders · D-PAD DOWN next seed strain at an
   empty plot · X use · R3 harvest.
   In build mode: RT place · D-PAD UP / DOWN piece · D-PAD LEFT category (base) · Y material, or turn a prop · LB pick up /
   put back · RB repair / upgrade · LT door / window · B paint · VIEW undo · X remove · D-PAD RIGHT leave.
   Station menus, the mission map and the first-time card close on B. */
hhPadTick = function () {
  let gp = null; try { gp = (navigator.getGamepads ? [...navigator.getGamepads()] : []).find(g => g && g.connected); } catch (e) {} if (!gp) return;
  const b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5)), was = HH.padB || {}, now = {};
  for (const i of [1, 3, 4, 5, 6, 7, 8, 12, 13, 14, 15]) now[i] = b(i); HH.padB = now; const press = i => now[i] && !was[i];
  if (HH.menu || curScreen || G.state !== 'playing' || navModal()) return;
  const H = M.hh; if (!H) return;
  if (press(15) && playerAlive()) { hhBuildMode(!HH.build); return; }
  if (!HH.build) {
    if (press(4)) try { hhAbility(); } catch (e) {}
    if (press(13) && H.base && HH.nearPlot) { const ps = H.s.base.plots[HH.nearPlot.key]; if (!ps || !ps.st) { const own = HH_STRAINS.filter(x => (H.s.seeds[x.id] | 0) > 0); if (own.length) { const i = own.findIndex(x => x.id === H.sel); H.sel = own[(i + 1) % own.length].id; G.inspectT = 0; try { tone(600, 0.03, 0.03, 'square'); showMsg(`SEED · ${HH_STR(H.sel).n}`); } catch (e) {} } } }
    return;
  }
  const n = hhPieceList().length, L = hhPieceList(), P0 = L[HH.piece] || L[0];
  if (press(12)) HH.piece = (HH.piece + n - 1) % n; if (press(13)) HH.piece = (HH.piece + 1) % n;
  if (press(14) && H.base && !HH.carry) { HH.cat = ((HH.cat | 0) + 1) % 3; HH.piece = 0; try { tone(800, 0.04, 0.03, 'square'); showMsg(HH_CATN[HH.cat]); } catch (e) {} }
  if (press(3)) { if (HH.carry && HH.carry.pr) HH.carry.r = (HH.carry.r + 1) % 4; else if (P0 && P0.prop && !HH.carry) HH.rot = ((HH.rot | 0) + 1) % 4; else HH.mat = HH_MATS[(HH_MATS.indexOf(HH.mat) + 1) % 3]; try { tone(500, 0.03, 0.03, 'square'); } catch (e) {} }
  if (press(7)) hhPlace();
  if (press(4)) { if (HH.carry) hhCarryCancel(); else hhPickUp(); }
  if (press(5)) try { hhFixLook(); } catch (e) { reportError(e); }
  if (press(6)) try { hhEditLook(); } catch (e) {}
  if (press(1)) { try { hhPaintLook(); } catch (e) {} pad.crouch = false; }
  if (press(8)) try { hhUndo(); } catch (e) {}
  // drag-build: hold RT and sweep
  if (now[7] && !HH.carry) { const a = hhAim(); if (!HH.padDrag) HH.padDrag = a.key; else if (a.key !== HH.padDrag) { HH.padDrag = a.key; if (hhValid(a)) hhPlace(); } } else HH.padDrag = null;
  pad.fire = false; pad.ads = false; pad.crouch = false;
};
// the buttons those take from the shooter: no field upgrade (D-PAD RIGHT is build mode), no grenade while building,
// D-PAD UP gives crew orders, no ping / emote wheel while building (D-PAD LEFT is the category)
const _hhpFu = fuUse; fuUse = function () { if (M && M.hh) return; return _hhpFu.apply(this, arguments); };
const _hhpStk = stkUse; stkUse = function () { if (M && M.hh) { if (!HH.build && !HH.menu) try { hhOrderNext(); } catch (e) {} return; } return _hhpStk.apply(this, arguments); };
const _hhpNade = nadeHold; nadeHold = function (on) { if (M && M.hh && HH.build) return; return _hhpNade.apply(this, arguments); };
const _hhpPing = padPingEmote; padPingEmote = function (dt, held) { if (M && M.hh && HH.build) { PADX.pingT = -1; return; } return _hhpPing.apply(this, arguments); };
const _hhpPl = openPlaylist; openPlaylist = function () { if (HHL.on && curScreen === 'lobby') return; return _hhpPl.apply(this, arguments); };
// station menus keep the controller's place when they redraw
const _hhpMR = hhMenuRender;
hhMenuRender = function () {
  const a = document.activeElement, o = $('hhMenu'), k = a && o && o.contains(a) && a.dataset ? a.dataset.hm : null, sc = o && o.querySelector('.hh-mbox') ? o.querySelector('.hh-mbox').scrollTop : 0;
  const r = _hhpMR.apply(this, arguments); const o2 = $('hhMenu'); if (o2) { const bx = o2.querySelector('.hh-mbox'); if (bx) bx.scrollTop = sc;
    if (usingPad()) { const t = (k && o2.querySelector(`[data-hm="${CSS.escape(k)}"]:not([disabled])`)) || o2.querySelector('button:not([disabled])'); if (t) try { t.focus({ preventScroll: true }); } catch (e) {} } }
  return r;
};
const _hhpMO = hhMenuOpen;
hhMenuOpen = function () { const r = _hhpMO.apply(this, arguments); if (usingPad()) setTimeout(() => { const o = $('hhMenu'), t = o && o.querySelector('button:not([disabled])'); if (t) try { t.focus(); } catch (e) {} }, 30); return r; };
// the hints say the controller's buttons
const HHP_TXT = {
  tip: () => 'D-PAD RIGHT BUILD · R3 HARVEST · X USE',
  keys: () => 'LT DOOR / WINDOW · B PAINT · VIEW UNDO · HOLD RT TO DRAG',
  cat: () => `D-PAD LEFT SWITCH · RB REPAIR / UPGRADE`,
  abil: (A, H) => `LB ${A.n} ${HH.abT > 0 ? Math.ceil(HH.abT) + ' s' : 'READY'}${HH.burstT > 0 ? ' · BURST!' : ''} · D-PAD UP CREW: ${HH_ORDN[HH.order]}`
};
const _hhpDT = hhDomTick;
hhDomTick = function () {
  const r = _hhpDT.apply(this, arguments); const m = $('hhMats'), H = M && M.hh; if (!m || !H || !usingPad()) return r;
  const set = (sel, s) => { const e = m.querySelector(sel); if (e && e.textContent !== s) e.textContent = s; };
  set('.hh-tip', HHP_TXT.tip()); set('.hh-keys', HHP_TXT.keys()); set('.hh-cat small', HHP_TXT.cat()); try { set('.hh-abil', HHP_TXT.abil(HH_ABIL[H.hero], H)); } catch (e) {}
  const c = [...m.querySelectorAll('.hh-cost')].find(e => !e.classList.contains('hh-keys') && !e.classList.contains('hh-abil'));
  if (c && HH.build) { const L = hhPieceList(), P0 = L[HH.piece] || L[0], head = c.textContent.split(' · ')[0], cost = c.textContent.split(' · ')[1] || '';
    const s = `${head} · ${cost} · ${HH.carry ? 'CARRYING · Y TURN · LB PUT BACK' : P0.trap ? 'D-PAD UP / DOWN PIECE' : P0.prop ? 'Y TURN' : 'Y MATERIAL'} · RT PLACE · LB MOVE · X REMOVE · D-PAD RIGHT EXIT`; if (c.textContent !== s) c.textContent = s; }
  return r;
};
