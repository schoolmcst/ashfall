// bots climb: a bot stuck against the 1.1 m crate on the docks climbs onto it; it won't climb a 2.6 m container
module.exports = async p => {
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.G.noRender = true; window.__A.startMatch('br', { map: 'random' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => { const A = window.__A, e = A.enemies.find(x => x.entry); const g = e.group.position;
    g.set(-3, 0, 46.3); const ok = A.mvBotTryClimb(e, { x: -3, z: 40, y: 0 }); const st = { started: ok };
    g.set(-8, 0, 43.9); st.tall = A.mvBotTryClimb(e, { x: -8, z: 50, y: 0 }) ; e.climb = null;
    g.set(-3, 0, 46.3); A.mvBotTryClimb(e, { x: -3, z: 40, y: 0 }); window._maxY = 0; const f = () => { window._maxY = Math.max(window._maxY, g.y); if (e.climb || window._maxY < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); return st; });
  await p.waitForTimeout(4000);
  r.after = await p.evaluate(() => ({ maxY: +window._maxY.toFixed(2) }));
  return r;
};
