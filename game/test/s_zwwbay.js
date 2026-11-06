// THE GREEN LIGHTNING (BAYVIEW's wonder weapon): it chains through a pack of zombies
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { const A = window.__A; for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); A.ZL.net = 'solo'; A.ZL.map = 'bayview'; A.openZLobby(); A.zombAct('z-start'); A.G.health = 1e9; A.G.maxHp = 1e9; });
  await p.waitForTimeout(9000);
  r.give = await p.evaluate(() => { const A = window.__A; const ok = A.zwwGiveL('bayview'); const w = A.W[A.G.cur]; return { ok, name: w.name, ww: w.ww, mag: w.magSize }; });
  r.fire = await p.evaluate(() => { const A = window.__A; Object.assign(A.P, { x: 0, z: 40, y: 0 }); A.P.yaw = 0; A.P.pitch = 0; A.G.state = 'playing'; window.__z = [];
    for (let i = 0; i < 6; i++) { const e = A.makeZombie(-3 + i * 1.3, 34 - (i % 2) * 1.5, 0); e.speed = 0; window.__z.push(e); }
    const hp0 = window.__z.map(e => e.hp); const n = A.zwwFireL(A.W[A.G.cur]); const hurt = window.__z.filter((e, i) => !A.enemies.includes(e) || e.hp < hp0[i]).length; return { chained: n, hurt, bolts: A.zwwL() }; });
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(150); await p.screenshot({ path: SH + '/zww_lightning.png' });
  return r;
};
