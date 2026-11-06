// CONTROLLER on the newer screens, with a fake gamepad: the map, the emote wheel, the map editor, the HUD editor, the cup
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  await p.evaluate(() => {
    window.__pad = { buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] };
    navigator.getGamepads = () => [{ id: 'fake', index: 0, connected: true, mapping: 'standard', buttons: window.__pad.buttons, axes: window.__pad.axes, timestamp: performance.now() }];
    window.__btn = (i, on) => { window.__pad.buttons[i] = { pressed: on, value: on ? 1 : 0 }; };
  });
  const tap = async (i, ms = 400) => { await p.evaluate(i => window.__btn(i, true), i); await p.waitForTimeout(ms); await p.evaluate(i => window.__btn(i, false), i); await p.waitForTimeout(260); };
  const stick = async (x, y, ms) => { await p.evaluate(([x, y]) => { window.__pad.axes[0] = x; window.__pad.axes[1] = y; }, [x, y]); await p.waitForTimeout(ms); await p.evaluate(() => { window.__pad.axes[0] = 0; window.__pad.axes[1] = 0; }); await p.waitForTimeout(200); };
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.G.noRender = true; A.startMatch('br', { map: 'stashisle' }); });
  await p.waitForTimeout(12000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const A = window.__A; A.G.state = 'playing'; A.G.health = A.G.maxHp = 1e9; });
  // the map: D-pad down opens it, the stick moves the cursor, A sets a waypoint, B closes
  await tap(13);
  r.mapOpen = await p.evaluate(() => !!document.getElementById('mapOv'));
  const c0 = await p.evaluate(() => Object.assign({}, window.__A.MAPV_GET().cur));
  await stick(0.9, 0.5, 900);
  const c1 = await p.evaluate(() => Object.assign({}, window.__A.MAPV_GET().cur));
  r.cursorMoved = Math.round(Math.hypot(c1.x - c0.x, c1.z - c0.z));
  const n0 = await p.evaluate(() => window.__A.PING_GET().list.length);
  await tap(0);
  r.waypoint = (await p.evaluate(() => window.__A.PING_GET().list.length)) - n0;
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(600); await p.screenshot({ path: SH + '/pad_map.png' }); await p.evaluate(() => { window.__A.G.noRender = true; });
  await tap(1);
  r.mapClosed = await p.evaluate(() => !document.getElementById('mapOv'));
  // emotes: hold D-pad left
  await p.evaluate(() => window.__btn(14, true)); await p.waitForTimeout(900); await p.evaluate(() => window.__btn(14, false)); await p.waitForTimeout(300);
  r.wheel = await p.evaluate(() => !!document.getElementById('emoteWheel'));
  await tap(15); await tap(0);
  r.emote = await p.evaluate(() => window.__A.emotePack() || null);
  // a quick tap still pings
  const pn = await p.evaluate(() => window.__A.PING_GET().seq); await tap(14, 150); r.tapPing = (await p.evaluate(() => window.__A.PING_GET().seq)) - pn;
  // the map editor
  await p.evaluate(() => { const A = window.__A; try { A.leaveGame(); } catch (e) {} A.showScreen('menu'); A.edOpen(); const E = A.ED_GET(); E.map.items = []; E.tool = 'wall'; E.padCur = { x: -8, z: 0 }; });
  await p.waitForTimeout(300);
  await tap(0); await stick(1, 0, 700); await tap(0);
  r.edWall = await p.evaluate(() => window.__A.ED_GET().map.items.filter(i => i.t === 'wall').length);
  await tap(5); r.edTool = await p.evaluate(() => window.__A.ED_GET().tool);
  await tap(0); r.edItems = await p.evaluate(() => window.__A.ED_GET().map.items.length);
  await tap(1); r.edClosed = await p.evaluate(() => !document.getElementById('edOv'));
  // the HUD editor
  await p.evaluate(() => window.__A.hudEdit()); await p.waitForTimeout(300);
  await tap(5); await stick(1, 0.3, 600); await tap(12);
  r.hud = await p.evaluate(() => JSON.stringify(window.__A.S.hud || {}));
  await tap(0); r.hudClosed = await p.evaluate(() => !document.getElementById('hudEd'));
  // the cup: B closes it
  await p.evaluate(() => window.__A.openTour()); await p.waitForTimeout(300); await tap(1);
  r.cupClosed = await p.evaluate(() => !document.getElementById('tourOv'));
  return r;
};
