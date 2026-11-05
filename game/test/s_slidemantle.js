// SLIDE (sprint + crouch) and MANTLE (jump at a ledge) on STASH ISLAND: movement stepped at a fixed 60 fps, plus pictures
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.startMatch('br', { map: 'random' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; });
  await p.waitForTimeout(2000);
  const r = await p.evaluate(() => {
    const A = window.__A, P = A.P, K = A.keys, r = {}; A.G.health = A.G.maxHp = 1e9;
    const step = n => { for (let i = 0; i < n; i++) A.updatePlayer(1 / 60); };
    const put = (x, z, yaw) => { P.x = x; P.z = z; P.y = 0; P.yaw = yaw; P.pitch = 0; P.vx = P.vz = P.vy = 0; P.onGround = true; P.mantle = null; P.slideT = 0; for (const k in K) K[k] = false; step(2); };
    // 1 mantle onto the 1.1 m crate on the docks
    put(-3, 46.3, 0); K.KeyW = true; step(10); K.Space = true; step(3); r.crateStart = { mantling: !!P.mantle }; step(40); K.Space = false; K.KeyW = false; step(5);
    r.crate = { y: +P.y.toFixed(2), z: +P.z.toFixed(2) };
    // 2 the 2.6 m container is too high: a plain jump, no climb
    put(-8, 43.9, Math.PI); K.KeyW = true; step(6); K.Space = true; step(3); r.tall = { mantle: !!P.mantle }; step(60); K.Space = false; K.KeyW = false; step(30); r.tall.y = +P.y.toFixed(2);
    // 3 a sandbag wall at the bunker (1.0 m) mid-air: jump first, then reach it
    put(40, 31.6, 0); K.KeyW = true; K.Space = true; step(50); K.Space = false; K.KeyW = false; step(20); r.sandbag = { y: +P.y.toFixed(2), z: +P.z.toFixed(2) };
    // 4 slide down the north road
    put(0, 22, 0); K.KeyW = true; K.ShiftLeft = true; step(60); r.sprint = +Math.hypot(P.vx, P.vz).toFixed(1);
    K.KeyC = true; step(2); r.slide = { t: +(P.slideT || 0).toFixed(2), sp: +Math.hypot(P.vx, P.vz).toFixed(1) }; const z0 = P.z; step(30);
    r.slideMid = { sp: +Math.hypot(P.vx, P.vz).toFixed(1), eye: +P.eye.toFixed(2), tilt: +(P.tilt || 0).toFixed(3) };
    step(40); r.slideEnd = { t: +(P.slideT || 0).toFixed(2), sp: +Math.hypot(P.vx, P.vz).toFixed(1), dist: +(z0 - P.z).toFixed(1) };
    // 5 slide-jump keeps the speed
    K.KeyC = false; step(30); K.KeyC = true; step(2); K.Space = true; step(2); r.slideJump = { sp: +Math.hypot(P.vx, P.vz).toFixed(1), air: !P.onGround }; K.Space = false;
    for (const k in K) K[k] = false;
    // a picture mid-slide
    put(0, 22, 0); K.KeyW = true; K.ShiftLeft = true; step(60); K.KeyC = true; step(12); P.pitch = -0.04;
    return r;
  });
  await p.screenshot({ path: path.join(out, 'slide.png'), timeout: 120000 });
  await p.evaluate(() => { const A = window.__A; for (const k in A.keys) A.keys[k] = false; });
  return r;
};
