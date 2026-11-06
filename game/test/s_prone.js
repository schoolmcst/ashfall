// PRONE and DIVE, stepped at 60 fps
module.exports = async p => {
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.startMatch('br', { map: 'random' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; }); await p.waitForTimeout(1500);
  return await p.evaluate(() => {
    const A = window.__A, P = A.P, K = A.keys, r = {}; const step = n => { for (let i = 0; i < n; i++) A.updatePlayer(1 / 60); };
    const put = () => { P.x = 0; P.z = 22; P.y = 0; P.yaw = 0; P.vx = P.vz = P.vy = 0; P.onGround = true; P.prone = false; P.slideT = 0; P.diveT = 0; for (const k in K) K[k] = false; step(5); };
    put(); K.KeyB = true; step(2); K.KeyB = false; step(40); r.prone = { on: !!P.prone, eye: +P.eye.toFixed(2) };
    K.KeyW = true; step(60); r.crawl = +Math.hypot(P.vx, P.vz).toFixed(2); K.KeyW = false;
    K.Space = true; step(2); K.Space = false; step(30); r.up = { prone: !!P.prone, y: +P.y.toFixed(2), eye: +P.eye.toFixed(2) };
    put(); K.KeyW = true; K.ShiftLeft = true; step(60); const z0 = P.z; K.KeyB = true; step(2); K.KeyB = false; step(4); r.dive = { air: !P.onGround, prone: !!P.prone, sp: +Math.hypot(P.vx, P.vz).toFixed(1) }; K.ShiftLeft = false; K.KeyW = false; step(50); r.diveEnd = { prone: !!P.prone, went: +(z0 - P.z).toFixed(1), ground: P.onGround };
    for (const k in K) K[k] = false; P.prone = false; return r;
  });
};
