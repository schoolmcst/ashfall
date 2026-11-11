// HOTBOX HORDE batch G (owner's 58-60): leaderboard tab, sounds, FIRST STEPS card + checklist
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp', shot = async (n, ms) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms || 1800); await p.screenshot({ path: SH + '/hh9_' + n + '.png' }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} window.__A.showScreen('menu'); window.__A.hhOpenL(); });
  await p.waitForTimeout(600);
  r.card = await p.evaluate(() => { const o = document.querySelector('.onb-ov'); return o ? o.innerText.slice(0, 80) : null; });
  r.coopBox = await p.evaluate(() => (document.getElementById('hcBox') || {}).innerText);
  await p.screenshot({ path: SH + '/hh9_card.png' });
  await p.evaluate(() => { const A = window.__A, s = A.hhL.load(); s.cash = 30000; Object.assign(s.inv, { wood: 400, stone: 200, metal: 200, scrap: 50, wire: 20, battery: 20, nutri: 20, sap: 20 }); A.hhL.save(s); document.querySelector('[data-onb="base"]').click(); A.G.noRender = true; });
  await p.waitForTimeout(9000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(1200);
  r.tutHud = await p.evaluate(() => (document.getElementById('hhTut') || {}).innerText);
  await shot('tut', 1500);
  // build a wall, craft a trap, sell: steps tick, the register counts cash earned
  r.steps = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(), s = H.s; A.hhL.build(true); const L = A.hhL.pieces(); A.HH_GET().piece = L.findIndex(x => x.id === 'wall'); A.P.x = H.org.x + 5; A.P.z = H.org.z + 7; A.P.yaw = 0; A.P.pitch = -0.4; const pc = A.hhPlaceL(); A.hhL.build(false);
    A.hhL.menu('bench'); const tr0 = JSON.stringify(s.traps); A.hhL.menuDo('trap', 'spikes'); A.hhL.close(); s.buds.haze = 10; A.hhL.menu('buyer'); A.hhL.menuDo('sell', 'all'); A.hhL.close(); A.G.state = 'playing'; A.showScreen(null);
    await new Promise(r => setTimeout(r, 600)); return { placed: !!pc, built: s.built, traps: tr0 + ' -> ' + JSON.stringify(s.traps), tutCraft: s.tutCraft, sold: s.sold, earn: s.earn, tut: s.tut }; });
  r.tutHud2 = await p.evaluate(() => (document.getElementById('hhTut') || {}).innerText);
  await shot('tut2', 1500);
  // finish the rest by hand: done -> +$500
  r.done = await p.evaluate(() => { const A = window.__A, s = A.HHM_GET().s, c0 = s.cash; s.grown = 1; s.games = 1; A.hhL.save(s); return { tutDone: s.tutDone, plus: s.cash - c0, hud: (document.getElementById('hhTut') || {}).style.display }; });
  // sounds: wave horn + a trap + the plant alarm run without errors
  r.snd = await p.evaluate(() => { const A = window.__A; try { A.hhL.raid(); A.HHM_GET().t = 0.01; return { raid: !!A.HHM_GET().raid }; } catch (e) { return String(e); } });
  await p.waitForTimeout(3000);
  r.wave = await p.evaluate(() => { const H = window.__A.HHM_GET(); return { phase: H.phase, wave: H.wave }; });
  // leaderboard HORDE tab
  r.card2 = await p.evaluate(() => window.__A.hhzCardL());
  await p.evaluate(() => { const A = window.__A; A.leaveGame(); }); await p.waitForTimeout(500);
  await p.evaluate(() => { const A = window.__A; A.FRIENDS_ARR.push({ n: 'DANK DAVE', c: 'XXXXXX', on: true, s: [1, 1, 1, 1, 1, 1], hz: [52000, 2, 9, 14, 3100] }); A.lbL('horde'); });
  await p.waitForTimeout(500);
  r.lb = await p.evaluate(() => document.getElementById('lbBody').innerText.slice(0, 300));
  await p.screenshot({ path: SH + '/hh9_lb.png' });
  return r;
};
