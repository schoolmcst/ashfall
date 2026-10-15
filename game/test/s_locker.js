// levels, XP on results, locker (grid, preview, equip), rewards (daily, chance box), camo on the held gun; pictures of each
module.exports = async p => {
  const shots = process.env.SHOTS || '/tmp', out = {}, snap = n => p.screenshot({ path: shots + '/' + n + '.png' });
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); localStorage.setItem('dz_seen_update', '1.2.0'); });
  out.start = await p.evaluate(() => { const A = window.__A; return { xp: A.PROG.xp, lvl: A.lvlInfo(A.PROG.xp).l, dz: A.PROG.dz, owned: Object.keys(A.PROG.owned).length }; });
  // a TDM match: a few kills, then the end screen shows the XP
  await p.evaluate(() => { const A = window.__A; A.startMatch('tdm', {}); });
  await p.waitForFunction(() => window.__A.G.state === 'playing', null, { timeout: 60000 }); await p.evaluate(() => { window.__A.G.holdT = 0.01; window.__A.G.loadT = 0.01; }); await p.waitForTimeout(700); await p.waitForTimeout(500);
  out.match = await p.evaluate(() => { const A = window.__A; for (let i = 0; i < 14; i++) A.statKillAt(A.P.x + 20, A.P.z, i % 3 === 0); A.M.teamScore[A.M.myTeam] = 75; A.endMatch(A.M.myTeam); document.getElementById('loadscr').classList.add('hide'); const g = A.PROG.lastGain; return g && { xp: g.xp, from: g.from, to: g.to, rows: g.rows.length, dz: g.dz }; });
  await p.waitForTimeout(1600); await snap('pg_results');
  // lobby card
  await p.evaluate(() => window.__A.toLobby()); await p.waitForTimeout(800); await snap('pg_lobby');
  // give some progress so the locker has things in it
  await p.evaluate(() => { const A = window.__A; A.PROG.xp = A.XP_AT[52] + 400; for (const c of A.COSM) if (c.lvl && c.lvl <= 52) A.PROG.owned[c.id] = 1; for (const id of ['hexneon', 'plasma', 'dragon', 'tiger', 'woodland', 'carbon', 'digurban', 'rosegold']) A.PROG.owned[id] = 1; A.PROG.dz += 2000; A.saveProg(); });
  await p.evaluate(() => window.__A.actions('locker')); await p.waitForTimeout(2500); await snap('pg_locker');
  // pick DRAGON SCALE and equip it on all weapons
  await p.evaluate(() => { document.querySelector('#lkGrid [data-lk="dragon"]').click(); }); await p.waitForTimeout(1500);
  await p.evaluate(() => window.__A.actions('lk-all')); await p.waitForTimeout(1500); await snap('pg_locker_dragon');
  await p.evaluate(() => { document.querySelector('#lkGrid [data-lk="plasma"]').click(); }); await p.waitForTimeout(1500); await snap('pg_locker_plasma');
  await p.evaluate(() => { document.querySelector('#lkFilters [data-lkf="sticker"]').click(); }); await p.waitForTimeout(400);
  await p.evaluate(() => { document.querySelector('#lkGrid [data-lk="st_skull"]').click(); }); await p.waitForTimeout(300);
  await p.evaluate(() => window.__A.actions('lk-all')); await p.waitForTimeout(1800); await snap('pg_locker_stickers');
  out.equip = await p.evaluate(() => { const A = window.__A; return { all: A.PROG.equip.all, marc: A.camoFor('marc'), stk: A.PROG.stk.all, owned: Object.keys(A.PROG.owned).length }; });
  // rewards: claim the daily, open a box
  await p.evaluate(() => window.__A.actions('rewards')); await p.waitForTimeout(800); await snap('pg_rewards');
  out.daily = await p.evaluate(() => { const before = window.__A.PROG.dz; window.__A.actions('rw-daily'); return window.__A.PROG.dz - before; });
  await p.evaluate(() => window.__A.actions('rw-box')); await p.waitForTimeout(1500); await snap('pg_box_spin');
  await p.waitForTimeout(3600); await snap('pg_box_result');
  out.box = await p.evaluate(() => { const r = window.__A.BOXV.res; return r && { id: r.it.id, rar: r.it.r, dup: r.dup }; });
  await p.evaluate(() => window.__A.actions('rw-box-close')); await p.waitForTimeout(500);
  // odds check: 20k rolls
  out.odds = await p.evaluate(() => { const A = window.__A, n = [0, 0, 0, 0]; const save = JSON.stringify(A.PROG); A.PROG.dz = 1e9; for (let i = 0; i < 20000; i++) n[A.openBox().it.r]++; Object.assign(A.PROG, JSON.parse(save)); A.saveProg(); return n.map(x => (x / 200).toFixed(1) + '%'); });
  // the held gun in a match wears the camo
  await p.evaluate(() => { const A = window.__A; A.PROG.equip.all = 'dragon'; A.saveProg(); A.startMatch('tdm', {}); });
  await p.waitForFunction(() => window.__A.G.state === 'playing', null, { timeout: 60000 }); await p.evaluate(() => { window.__A.G.holdT = 0.01; window.__A.G.loadT = 0.01; }); await p.waitForTimeout(700); await p.waitForTimeout(800);
  out.held = await p.evaluate(() => { const A = window.__A, g = A.gunObjs[A.G.cur]; let n = 0; g.traverse(o => { if (o.isMesh && o.material && o.material.userData && o.material.userData.cosm) n++; }); return { camo: g.userData.camo, meshes: n, stickers: (g.userData.stk || []).length }; });
  await p.evaluate(() => { const A = window.__A; A.G.breakT = 1e9; for (const e of A.enemies) e.group.visible = false; }); await p.waitForTimeout(800); await snap('pg_held');
  return out;
};
