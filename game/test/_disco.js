module.exports = async p => {
  await p.evaluate(() => { const A = window.__A; A.ZL.net = 'solo'; A.ZL.story = false; A.ZL.map = 'hightide'; A.openZLobby(); const s = document.getElementById('hcSplash'); if (s) s.remove(); A.zombAct('z-start'); A.G.health = A.G.maxHp = 1e9; });
  await p.waitForTimeout(7000);
  const r = await p.evaluate(() => { const A = window.__A; A.Z.toSpawn = 0; A.Z.breakT = 999; for (const e of A.enemies.slice()) if (e.zombie) { e.hp = 1; A.damageEnemy(e, 100, false, 'player'); }
    const ok = A.zwwGive('hightide'); const w = A.W[A.G.cur]; Object.assign(A.P, { x: 0, z: -3, y: 0 }); A.P.yaw = 0; A.P.pitch = 0.02; A.G.state = 'playing'; window.__c = [];
    for (let i = 0; i < 5; i++) { const e = A.makeZombie(-3 + i * 1.5, -11 - (i % 2) * 2, 0); e.speed = 0; e.atkCd = 99; window.__c.push(e); }
    A.G.noRender = true; A.G.fireT = 0; A.shoot(false); return { ok, ww: w.ww, balls: A.ZWWD.length, hp: window.__c.map(e => e.hp), round: A.Z.round }; });
  const s = [];
  for (let i = 0; i < 8; i++) { await p.waitForTimeout(2500); s.push(await p.evaluate(() => { const A = window.__A, d = A.ZWWD[0]; return { d: d && { hang: +d.hang.toFixed(2), p: d.m.position.toArray().map(v => +v.toFixed(1)), las: d.lasers.length }, hp: window.__c.map(e => Math.round(e.hp)), alive: window.__c.filter(e => A.enemies.includes(e)).length, err: (document.getElementById('err') || {}).textContent }; })); }
  return { r, s };
};
