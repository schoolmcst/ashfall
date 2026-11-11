// HOTBOX HORDE on a controller only (fake gamepad): menu tile -> lobby -> first-time card -> THE HOMESTEAD; build mode and every
// build button; a station menu (navigate, buy, B closes); ability, crew orders, seed strain; the mission map; leaderboard; hints
module.exports = async p => { const r = {}; try { await run(p, r); } catch (e) { r.FAIL = String(e).slice(0, 300); } return r; };
const run = async (p, r) => {
  const _x = 0, SH = process.env.SHOTS || '/tmp';
  await p.evaluate(() => {
    window.__pad = { buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] };
    navigator.getGamepads = () => [{ id: 'fake', index: 0, connected: true, mapping: 'standard', buttons: window.__pad.buttons, axes: window.__pad.axes, timestamp: performance.now() }];
    window.__btn = (i, on) => { window.__pad.buttons[i] = { pressed: on, value: on ? 1 : 0 }; };
  });
  const tap = async (i, ms = 900) => { await p.evaluate(i => window.__btn(i, true), i); await p.waitForTimeout(ms); await p.evaluate(i => window.__btn(i, false), i); await p.waitForTimeout(700); };
  const ev = (f, a) => p.evaluate(f, a);
  const focus = () => ev(() => { const a = document.activeElement; return a ? (a.dataset.act || a.dataset.hm || a.dataset.onb || a.dataset.mi || a.dataset.hc || a.textContent.trim().slice(0, 30)) : null; });
  await ev(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} const A = window.__A; A.showScreen('menu'); const s = A.hhL.load(); A.hhL.save(s); });
  // the HOTBOX HORDE tile with the D-pad: focus it and press A
  await p.waitForTimeout(800); r.tile = await ev(() => { const t = document.getElementById('hhTile') || document.querySelector('[data-act="hh-play"]'); if (t) { t.focus(); t.addEventListener('click', () => { window.__clk = (window.__clk || 0) + 1; }); } return [!!t && document.activeElement === t, String(window.__A.navModal ? '' : ''), [...document.querySelectorAll('#oskBox, #hcSplash:not(.out), .app-notes, #boxOv, #lnOv, .onb-ov, #bpSwOv')].map(e => e.id || e.className)]; }); await tap(0); await p.waitForTimeout(800);
  r.lobby = await ev(() => ({ clk: window.__clk, err: (document.querySelector('.err-box,#errBox') || {}).innerText, scr: window.__A.curScreen, card: !!document.querySelector('.onb-ov'), focus: document.activeElement && document.activeElement.dataset.onb }));
  await p.screenshot({ path: SH + '/hhpad_card.png' });
  // B on the first-time card = LATER (closes, stays in the lobby)
  await tap(1); await p.waitForTimeout(300);
  r.cardB = await ev(() => ({ card: !!document.querySelector('.onb-ov'), scr: window.__A.curScreen }));
  // walk the lobby with the D-pad: every control reachable
  const seen = new Set(); for (let i = 0; i < 24; i++) { await ev(() => window.__btn(13, true)); await p.waitForTimeout(600); await ev(() => window.__btn(13, false)); await p.waitForTimeout(500); seen.add(await focus()); }
  r.lobbyReach = [...seen].filter(Boolean);
  // Y in the HORDE lobby does not open the multiplayer playlist
  await tap(3); r.yLobby = await ev(() => window.__A.curScreen);
  // the mission map: focus MAP, A, D-pad, B closes
  await ev(() => { const b = document.querySelector('[data-act="hh-map"]'); if (b) b.focus(); }); await tap(0); await p.waitForTimeout(300);
  r.mapOpen = await ev(() => !!document.getElementById('hhMapOv'));
  await tap(15); await tap(1); r.mapClosed = await ev(() => !document.getElementById('hhMapOv'));
  // the co-op code box: A on the input opens the on-screen keyboard
  await ev(() => { const i = document.getElementById('hcCode'); if (i) i.focus(); }); await tap(0); await p.waitForTimeout(300);
  r.osk = await ev(() => !!document.getElementById('oskBox')); await tap(1); await p.waitForTimeout(300); await ev(() => { const o = document.getElementById('oskBox'); if (o) o.remove(); });
  // MENU starts THE HOMESTEAD
  await ev(() => { const s = window.__A.hhL.load(); s.cash = 9000; Object.assign(s.inv, { wood: 400, stone: 200, metal: 200, scrap: 40, wire: 20, battery: 20, nutri: 20, sap: 20 }); s.seeds.haze = 4; window.__A.hhL.save(s); window.__A.G.noRender = true; });
  await tap(9); await p.waitForTimeout(10000); await ev(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(1200);
  await ev(() => { const A = window.__A; if (A.G.state === 'paused') { A.G.state = 'playing'; A.showScreen(null); } A.G.health = A.G.maxHp = 1e9; });
  r.base = await ev(() => ({ mode: window.__A.M && window.__A.M.mode, base: !!(window.__A.HHM_GET() || {}).base, st: window.__A.G.state }));
  r.tipPad = await ev(() => ((document.querySelector('#hhMats .hh-tip') || {}).textContent || '') + ' | ' + ((document.querySelector('#hhMats .hh-abil') || {}).textContent || ''));
  // ability (LB) and crew orders (D-pad up)
  const o0 = await ev(() => window.__A.HH_GET().order);
  await tap(4); await tap(12);
  r.abil = await ev(o0 => ({ abT: Math.round(window.__A.HH_GET().abT || 0), order: window.__A.HH_GET().order !== o0, nade: window.__A.grenadesInFlight ? window.__A.grenadesInFlight.length : null }), o0);
  // build mode with D-pad right; every button
  await ev(() => { const A = window.__A, H = A.HHM_GET(); A.P.x = H.org.x + 5; A.P.z = H.org.z + 7; A.P.yaw = 0; A.P.pitch = -0.4; });
  await tap(15); r.build = await ev(() => window.__A.HH_GET().build);
  const st = () => ev(() => { const HH = window.__A.HH_GET(); return { piece: HH.piece, cat: HH.cat | 0, mat: HH.mat }; });
  const s0 = await st(); await tap(13); const s1 = await st(); await tap(14); const s2 = await st(); await tap(14); await tap(14); await tap(3); const s3 = await st();
  r.buildBtns = { pieceDown: s1.piece !== s0.piece, cat: s2.cat !== s1.cat, mat: s3.mat !== s2.mat };
  await ev(() => { window.__A.HH_GET().piece = 0; });
  const n0 = await ev(() => window.__A.HHM_GET().pieces.length); await tap(7); r.placed = (await ev(() => window.__A.HHM_GET().pieces.length)) - n0;
  r.hintsBuild = await ev(() => [...document.querySelectorAll('#hhMats .hh-cost, #hhMats .hh-cat small')].map(e => e.textContent).join(' | '));
  await ev(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/hhpad_build.png' }); await ev(() => { window.__A.G.noRender = true; });
  const n1 = await ev(() => window.__A.HHM_GET().pieces.length); await tap(8); r.undo = n1 - (await ev(() => window.__A.HHM_GET().pieces.length));
  await tap(7); await p.waitForTimeout(300);
  const last = () => ev(() => { const P = window.__A.HHM_GET().pieces; const w = P[P.length - 1]; return w && w.rec ? [w.rec.v | 0, w.rec.c | 0, w.rec.mat] : null; });
  await ev(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1200); const v0 = await last(); await tap(1); const v1 = await last(); await p.waitForTimeout(3000); await tap(5); const v2 = await last(); await p.waitForTimeout(3000); await tap(6); const v3 = await last(); await ev(() => { window.__A.G.noRender = true; });
  r.paintFixEdit = { start: v0, paint: v1, upgrade: v2, door: v3, crouch: await ev(() => !!window.__A.pad.crouch), nades: await ev(() => window.__A.grenadesInFlight.length) };
  await tap(15); r.buildOff = await ev(() => !window.__A.HH_GET().build);
  // a station menu: open the WORKBENCH, D-pad to a craft button, A, then B closes
  await ev(() => window.__A.hhL.menu('bench')); await p.waitForTimeout(300);
  r.menuFocus = await focus();
  const tr0 = await ev(() => JSON.stringify(window.__A.HHM_GET().s.traps));
  for (let i = 0; i < 4; i++) { await tap(13); r['mf' + i] = await focus(); }
  await ev(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(800); await p.screenshot({ path: SH + '/hhpad_menu.png' }); await ev(() => { window.__A.G.noRender = true; });
  await tap(0); r.menuA = { focus: await focus(), traps: tr0 + ' -> ' + (await ev(() => JSON.stringify(window.__A.HHM_GET().s.traps))) };
  await tap(1); await p.waitForTimeout(300); r.menuB = await ev(() => !document.getElementById('hhMenu'));
  r.errorsShown = await ev(() => !!document.querySelector('.err-box, #errBox'));
  // leaderboard HORDE tab reachable by pad (tabs are buttons)
  await ev(() => { window.__A.leaveGame(); }); await p.waitForTimeout(500); await ev(() => window.__A.lbL('horde')); await p.waitForTimeout(300);
  r.lb = await ev(() => ({ scr: window.__A.curScreen, tab: (document.querySelector('#lbTabs .on') || {}).textContent }));
  await tap(1); r.lbBack = await ev(() => window.__A.curScreen);
};
