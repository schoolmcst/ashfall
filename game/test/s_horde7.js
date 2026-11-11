// HOTBOX HORDE batch E (owner's 36-44): rescue, truck, signal, nests missions; night; modifiers; daily; weekly; mission map
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp', shot = async (n, ms) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms || 1800); await p.screenshot({ path: SH + '/hh7_' + n + '.png' }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  const start = async (mi, night) => { await p.evaluate(async ([mi, night]) => { const A = window.__A; if (A.HHM_GET()) { A.leaveGame(); await new Promise(r => setTimeout(r, 400)); } const s = A.hhL.load(); s.mis = mi; s.nightMis = !!night; A.hhL.save(s); A.G.noRender = true; A.actions('hh-play'); A.actions('hh-start'); }, [mi, night]);
    await p.waitForTimeout(9000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e6; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } }); await p.waitForTimeout(1500); };
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} });
  // the lobby + mission map
  r.lobby = await p.evaluate(() => { const A = window.__A; A.showScreen('menu'); A.actions('hh-play'); A.actions('hh-map'); return { missions: document.querySelectorAll('.hh-mcard').length, rows: [...document.querySelectorAll('#lobSel .cod-row small')].map(x => x.textContent).slice(-3) }; });
  await p.waitForTimeout(500); await p.screenshot({ path: SH + '/hh7_map.png' });
  await p.evaluate(() => { const b = document.querySelector('.hh-mcard[data-mi="3"]'); b && b.click(); });
  await p.waitForTimeout(300); await p.screenshot({ path: SH + '/hh7_lobby.png' });
  // RESCUE (greenhouse = mission 3)
  await start(3);
  r.rescue = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); const st = { kind: H.kind, growers: H.growers.length, van: !!H.van, mod: H.mod };
    const g0 = H.growers[0]; A.P.x = g0.g.position.x + 1; A.P.z = g0.g.position.z; A.keys.KeyE = true; await new Promise(r => setTimeout(r, 1200)); A.keys.KeyE = false; st.follow = g0.follow;
    for (const g of H.growers) { g.follow = true; g.g.position.set(H.van.x + 1, H.van.y, H.van.z + 1); } await new Promise(r => setTimeout(r, 1500)); st.over = H.over; st.won = H.res && H.res.won; st.obj = H.objTxt; return st; });
  await start(3); await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(), g0 = H.growers[0]; g0.follow = true; const rg = g0.rig; rg.hips.position.y = 0.96; rg.legL.rotation.x = rg.legR.rotation.x = 0; rg.knL.rotation.x = rg.knR.rotation.x = 0.2; A.P.x = g0.g.position.x + 4; A.P.z = g0.g.position.z + 2; A.P.yaw = Math.atan2(4, 2); A.P.pitch = 0; await new Promise(r => setTimeout(r, 1200)); A.P.yaw = Math.atan2(A.P.x - g0.g.position.x, A.P.z - g0.g.position.z); });
  await shot('rescue', 1800);
  // TRUCK (greenhouse = 4)
  await start(4);
  r.truck = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(), T = H.truck; const st = { kind: H.kind, hp: T.hp, d: Math.round(Math.hypot(T.to.x - T.x, T.to.z - T.z)) }; const x0 = T.x, z0 = T.z; A.P.x = T.x + 2; A.P.z = T.z + 2; await new Promise(r => setTimeout(r, 3000)); st.moved = +Math.hypot(T.x - x0, T.z - z0).toFixed(2); A.P.x = T.x + 3; A.P.z = T.z + 3; A.P.yaw = Math.atan2(3, 3); return st; });
  await shot('truck', 1500);
  r.truck2 = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(), T = H.truck; T.x = T.to.x + 1; T.z = T.to.z; await new Promise(r => setTimeout(r, 1200)); return { over: H.over, won: H.res && H.res.won }; });
  // SIGNAL (stackyard = 12) at night
  await start(12, true);
  r.signal = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); const st = { kind: H.kind, boxes: H.boxes.length, night: A.HH_GET().night, pay: H.D.pay }; await new Promise(r => setTimeout(r, 8000)); st.mobs = H.mobs.length; st.withObj = H.mobs.filter(e => e.obj).length; st.boxHp = H.boxes.map(b => b.hp); const b = H.boxes[0]; A.P.x = b.x + 6; A.P.z = b.z + 4; A.P.yaw = Math.atan2(6, 4); A.P.pitch = -0.05; return st; });
  await shot('signal', 1800);
  r.signal2 = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); H.t = 0.5; await new Promise(r => setTimeout(r, 5000)); return { over: H.over, won: H.res && H.res.won }; });
  // NESTS (dustwater = 20)
  await start(20);
  r.nests = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); const st = { kind: H.kind, nests: H.huntNests.length }; await new Promise(r => setTimeout(r, 5000)); st.mobs = H.mobs.length; const n = H.huntNests[0].nest; A.P.x = n.group.position.x + 6; A.P.z = n.group.position.z + 3; A.P.yaw = Math.atan2(6, 3); return st; });
  await shot('nests', 1800);
  r.nests2 = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(); for (const R of H.huntNests) if (R.nest) A.damageEnemy(R.nest, 1e6, false, null, false, 'player'); await new Promise(r => setTimeout(r, 1500)); const s = A.hhL.load(); return { over: H.over, won: H.res && H.res.won, wk: s.wk }; });
  return r;
};
