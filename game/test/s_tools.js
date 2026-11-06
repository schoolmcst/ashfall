// AIM TRAINER, HUD EDITOR, EVENTS CALENDAR, LIVING MAPS, RADIO
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  r.cal = await p.evaluate(() => { const A = window.__A; return A.evCalendar().map(c => c.e.id + (c.live ? ':LIVE' : ':' + c.days)); });
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.openEvCal(); }); await p.waitForTimeout(300);
  await p.screenshot({ path: SH + '/evcal.png' }); await p.evaluate(() => document.getElementById('evCal').remove());
  r.radio = await p.evaluate(() => { const A = window.__A, out = []; for (const s of A.RADIO) { A.radioSet(s.id); out.push(A.radioSt().id); } A.radioSet('fm'); return out; });
  // the range + aim trainer
  await p.evaluate(() => { const A = window.__A; A.G.noRender = false; A.startMatch('range'); }); await p.waitForTimeout(5000);
  await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(3000);
  r.aim = await p.evaluate(() => { const A = window.__A; A.G.state = 'playing'; const ok = A.aimStart('grid'); const n = A.AIM.tg.length; const t = A.AIM.tg[0].m.position; A.camera.lookAt(t.x, t.y, t.z); A.camera.updateMatrixWorld(true);
    A.AIM.lastShots = A.G.shots; A.G.shots++; A.aimTick(0.016); return { ok, n, hits: A.AIM.hits, after: A.AIM.tg.length }; });
  await p.waitForTimeout(500); await p.screenshot({ path: SH + '/aimgrid.png' });
  r.aimEnd = await p.evaluate(() => { const A = window.__A; A.AIM.t = 0.01; A.aimTick(0.05); return { on: !!A.AIM.on, best: (A.PROG.aim || {}).grid }; });
  r.flick = await p.evaluate(() => { const A = window.__A; A.aimStart('flick'); const n = A.AIM.tg.length; A.aimStop(true); A.aimStart('track'); for (let i = 0; i < 30; i++) A.aimTick(0.03); const tot = A.AIM.tot; A.aimStop(true); return { n, tot: +tot.toFixed(2) }; });
  r.amb = await p.evaluate(() => { const A = window.__A, out = {}; return { pick: A.ambPick(), kind: A.AMB.kind }; });
  // HUD editor
  r.hud = await p.evaluate(() => { const A = window.__A; A.hudEdit(); const n = document.querySelectorAll('.hud-ed-box').length; A.S && 0; return n; });
  await p.waitForTimeout(300); await p.screenshot({ path: SH + '/hudedit.png' });
  r.hudMove = await p.evaluate(() => { const A = window.__A; document.querySelector('[data-he="done"]').click(); localStorage; return { gone: !document.getElementById('hudEd') }; });
  return r;
};
