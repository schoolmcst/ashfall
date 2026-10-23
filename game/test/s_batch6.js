// weekly challenges (THE PLUG'S LIST), prestige, THE GROW HOUSE firing range: SHOTS=dir node run.js s_batch6.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const shot = async (n, ms = 900) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms); await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  await p.evaluate(() => { const s = document.getElementById('hcSplash'); if (s) s.remove(); const A = window.__A; A.PROG.wk = null; A.PROG.pres = 0; A.PROG.range = 0; });
  // ---- weekly
  r.week = await p.evaluate(() => { const A = window.__A, W = A.wkState(); return W.list.map(q => q.id + ':' + q.n); });
  r.weekPay = await p.evaluate(() => { const A = window.__A, W = A.wkState(), xp0 = A.PROG.xp, dz0 = A.PROG.dz;
    A.startMatch('tdm', { map: 'town', score: 999, time: 0, perTeam: 2, custom: true }); A.G.holdT = 0; A.G.noRender = true;
    Object.assign(A.MS, { kills: 70, heads: 18, bags: 12, turf: 7, caps: 7, plants: 2, defuses: 2, hpTime: 100, streaks: 6, longest: 48, bestStreak: 7 });
    A.wkMatch(1, false); const a = W.list.map(q => [q.id, q.have, q.n, q.done]);
    return { list: a, xp: A.PROG.xp - xp0, dz: A.PROG.dz - dz0, bonus: W.bonus }; });
  await p.evaluate(() => { const A = window.__A; A.actions('tomenu'); });
  await p.waitForTimeout(800);
  await p.evaluate(() => { const A = window.__A; const W = A.wkState(); W.list[W.list.length - 1].done = false; W.list[W.list.length - 1].have = Math.floor(W.list[W.list.length - 1].n / 2); W.bonus = false; A.openWeekly(); });
  await shot('wk_screen');
  // ---- prestige
  await p.evaluate(() => { const A = window.__A; A.showScreen('menu'); A.PROG.xp = A.XP_AT[A.MAXLVL]; A.renderMenuCard(); });
  await shot('pr_menu_ready');
  await p.evaluate(() => { window.__A.presOpen(); });
  await shot('pr_confirm', 600);
  r.pres = await p.evaluate(() => { const A = window.__A, dz0 = A.PROG.dz; A.presGo(); return { pres: A.PROG.pres, xp: A.PROG.xp, banner: A.PROG.banner, owned: !!A.PROG.owned.pr_bn_1, dz: A.PROG.dz - dz0, tok: A.PROG.tok && A.PROG.tok.prestige }; });
  await shot('pr_after', 1500);
  // all ten cards, and the three finishes
  r.pres10 = await p.evaluate(() => { const A = window.__A; for (let i = 0; i < 9; i++) { A.PROG.xp = A.XP_AT[A.MAXLVL]; A.presGo(); } return { pres: A.PROG.pres, fins: ['pr_chrome', 'pr_resin', 'pr_frost'].map(k => !!A.PROG.owned[k]) }; });
  await p.evaluate(() => { const A = window.__A; A.openLocker(); A.lockerAct('lk-banners'); });
  await shot('pr_banners', 1200);
  await p.evaluate(() => { const A = window.__A; A.LK.gun = A.activeClass().p; A.LK.view = 'gun'; A.LK.tab = 'camo'; A.LK.sel = 'pr_frost'; A.renderLocker(); });
  await shot('pr_frost', 2500);
  await p.evaluate(() => { const A = window.__A; A.LK.sel = 'pr_resin'; A.renderLocker(); });
  await shot('pr_resin', 2500);
  // ---- the range
  await p.evaluate(() => { const A = window.__A; A.showScreen('menu'); A.PROG.pres = 0; A.PROG.xp = 5000; A.renderMenuCard(); });
  await shot('menu_tiles', 600);
  await p.evaluate(() => { const A = window.__A; A.startRange(); A.G.noRender = true; });
  await p.waitForTimeout(2500);
  r.range = await p.evaluate(() => { const A = window.__A; return { mode: A.M.mode, map: A.curMap, targets: A.RG.dummies.length, spots: A.RG.spots.map(s => Math.round(Math.hypot(s.x - A.P.x, s.z - A.P.z))) }; });
  await p.evaluate(() => { const A = window.__A; A.G.state = 'playing'; const s = A.RG.spots[0]; A.P.yaw = Math.atan2(-(s.x - A.P.x), -(s.z - A.P.z)); A.P.pitch = -0.05; });
  await shot('range_view', 1500);
  // do the basics by hand
  r.basics = await p.evaluate(async () => { const A = window.__A, w = ms => new Promise(q => setTimeout(q, ms)), keep = () => { if (A.G.state === 'paused') A.G.state = 'playing'; };
    keep(); A.P.x += 3; A.P.z += 3; await w(300); keep(); A.P.yaw += 3; await w(300);
    // shoot the nearest target in the head with the first gun
    const s = A.RG.spots[0], e = s.e; e.hp = 1; A.damageEnemy(e, 50, true, null, false, 'player'); await w(300);
    keep(); A.G.adsOn = true; await w(1400); A.G.adsOn = false; keep();
    A.G.reloading = true; await w(300); A.G.reloading = false; A.G.cur = A.G.cur ? 0 : 1; await w(300); A.P.eye = 1.1; await w(300); A.P.eye = 1.7; A.P.onGround = false; A.P.vy = 4; await w(300); A.P.onGround = true; A.P.vy = 0;
    A.G.meleeT = 0.3; await w(300); keep(); A.G.grenades = 3; A.throwGrenade ? A.throwGrenade() : 0; await w(500); keep();
    const got = A.STK.have.slice(); A.STK.useCd = 0; A.stkUse(); await w(800); keep();
    return { done: Object.keys(A.RG.done), streakGiven: got, finished: A.RG.finished, kills: A.MS.kills, heads: A.MS.heads }; });
  await p.waitForTimeout(3500);
  r.respawned = await p.evaluate(() => window.__A.RG.spots[0].e ? 'yes' : 'no');
  await p.evaluate(() => { const A = window.__A; A.G.state = 'playing'; });
  await shot('range_done', 1200);
  r.noXp = await p.evaluate(() => { const A = window.__A, xp0 = A.PROG.xp; A.leaveGame(); return { xpGain: A.PROG.xp - xp0, mode: A.M.mode, rgOn: A.RG.on, rangeBonus: A.PROG.range }; });
  return r;
};
