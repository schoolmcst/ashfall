// zombies: menu tab -> zombies lobby (no loadout) -> a game: rounds, zombies chase and hit, points, crates, death
module.exports = async p => {
  const shots = process.env.SHOTS || '/tmp', out = {}, snap = async n => { await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); }); return p.screenshot({ path: shots + '/' + n + '.png' }); };
  await p.waitForTimeout(1500); await snap('z_menu');
  out.menuTab = await p.evaluate(() => !!document.querySelector('#menu [data-act="go-zombies"]'));
  await p.evaluate(() => window.__A.actions('go-zombies')); await p.waitForTimeout(800); await snap('z_lobby');
  out.lobby = await p.evaluate(() => ({ kind: document.getElementById('lobKind').textContent, loadoutTab: getComputedStyle(document.querySelector('#lobby .cod-nav [data-act="loadout"]')).display, classRow: !!document.querySelector('#lobSel .cod-class') }));
  await p.evaluate(() => window.__A.actions('z-map+')); await p.evaluate(() => window.__A.actions('z-start'));
  await p.waitForFunction(() => window.__A.G.state === 'playing', null, { timeout: 60000 });
  out.start = await p.evaluate(() => { const A = window.__A; return { guns: A.W.map(w => w.def.id), pts: A.G.points, map: A.curMap }; });
  await p.evaluate(() => { window.__A.G.health = 1e9; window.__A.G.maxHp = 1e9; window.__A.G.noRender = true; });
  await p.waitForTimeout(20000); await p.evaluate(() => { window.__A.G.noRender = false; });
  out.mid = await p.evaluate(() => { const A = window.__A, z = A.enemies.filter(e => e.zombie); return { round: A.Z.round, zombies: z.length, kinds: z.map(e => e.kind), nearest: z.length ? +Math.min(...z.map(e => Math.hypot(e.group.position.x - A.P.x, e.group.position.z - A.P.z))).toFixed(1) : null, hp: A.G.health < 1e9 }; });
  // face the nearest zombie for a picture
  await p.evaluate(() => { const A = window.__A, z = A.enemies.filter(e => e.zombie).sort((a, b) => Math.hypot(a.group.position.x - A.P.x, a.group.position.z - A.P.z) - Math.hypot(b.group.position.x - A.P.x, b.group.position.z - A.P.z))[0]; if (z) { A.P.yaw = Math.atan2(A.P.x - z.group.position.x, A.P.z - z.group.position.z); A.P.pitch = -0.05; } });
  await p.waitForTimeout(400); await snap('z_game');
  // kill zombies (points), then buy from the crates
  out.points = await p.evaluate(() => { const A = window.__A, p0 = A.G.points; let n = 0; for (const e of A.enemies.slice()) if (e.zombie && n < 3) { A.damageEnemy(e, 20, false, null, false, 'player'); A.damageEnemy(e, 5000, n === 0, null, false, 'player'); n++; } return A.G.points - p0; });
  out.box = await p.evaluate(() => { const A = window.__A, c = A.Z.crate; A.G.points = 2000; A.P.x = c.position.x + 1.2; A.P.z = c.position.z; A.P.y = c.position.y; A.zombBuyBox(); return { guns: A.W.map(w => w.def.id), pts: A.G.points }; });
  await p.evaluate(() => { const A = window.__A, c = A.Z.crate; A.P.yaw = Math.atan2(A.P.x - c.position.x, A.P.z - c.position.z); A.P.pitch = -0.35; }); await p.waitForTimeout(700); await snap('z_crate');
  out.ammo = await p.evaluate(() => { const A = window.__A; A.W.forEach(w => { w.reserve = 0; }); A.zombBuyAmmo(); return A.W.map(w => w.reserve); });
  // let them hit you: death -> game over screen
  await p.evaluate(() => { const A = window.__A; A.G.maxHp = 100; A.G.health = 100; A.G.noRender = true; for (const e of A.enemies) if (e.zombie) { e.group.position.x = A.P.x + 1.1; e.group.position.z = A.P.z; } }); await p.waitForTimeout(12000); await p.evaluate(() => { window.__A.G.noRender = false; });
  out.end = await p.evaluate(() => ({ state: window.__A.G.state, over: document.getElementById('overStats') && document.getElementById('overStats').textContent }));
  await snap('z_over');
  return out;
};
