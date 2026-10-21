// camo grind: challenges tab, kills unlocking military camos, gold, diamond (class) and nova (everything), equip rules
module.exports = async p => {
  const shots = process.env.SHOTS || '/tmp', out = {}, snap = async n => { await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); }); return p.screenshot({ path: shots + '/' + n + '.png' }); };
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); localStorage.setItem('dz_seen_update', '9.9.9'); });
  out.before = await p.evaluate(() => { const A = window.__A; return { ids: A.COSM.filter(c => c.grind).map(c => c.id), owned: Object.keys(A.PROG.owned).length }; });
  // a match: kills with the M4A1 (hip fire, some headshots, some long, a double kill)
  await p.evaluate(() => window.__A.startMatch('tdm', {}));
  await p.waitForFunction(() => window.__A.G.state === 'playing', null, { timeout: 60000 }); await p.evaluate(() => { window.__A.G.holdT = 0.01; window.__A.G.loadT = 0.01; }); await p.waitForTimeout(700);
  out.gun = await p.evaluate(() => window.__A.W[window.__A.G.cur].def.id);
  out.kills = await p.evaluate(() => { const A = window.__A; A.G.ads = 0; A.G.adsOn = false;
    for (let i = 0; i < 26; i++) { A.G.time += i % 5 === 0 ? 0.5 : 5; A.statKillAt(A.P.x + (i % 3 === 0 ? 35 : 8), A.P.z, i % 2 === 0, false); }
    return { stat: A.grindStat(A.W[A.G.cur].def.id), banner: (document.getElementById('banner') || {}).textContent || '' };
  });
  await snap('gr_match_unlock');
  out.grenade = await p.evaluate(() => { const A = window.__A, g = A.W[A.G.cur].def.id, k0 = A.grindStat(g).k; A.statKillAt(A.P.x + 5, A.P.z, false, true); return A.grindStat(g).k - k0; });
  await p.evaluate(() => { window.__A.endMatch(window.__A.M.myTeam); }); await p.waitForTimeout(500);
  await p.evaluate(() => window.__A.toLobby()); await p.waitForTimeout(600);
  // the locker: weapon grid with badges, the gun's challenges
  await p.evaluate(gun => { const A = window.__A; A.actions('locker'); }, out.gun); await p.waitForTimeout(6000); await snap('gr_guns');
  await p.evaluate(gun => { document.querySelector(`[data-lkgun="${gun}"]`).click(); }, out.gun); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('[data-lktab="grind"]').click()); await p.waitForTimeout(1800); await snap('gr_challenges');
  out.rows = await p.evaluate(() => [...document.querySelectorAll('#lkGrid .gr-row')].map(b => b.dataset.lk + ':' + b.querySelector('em').textContent));
  // pick an unlocked one and equip it; a locked one can't be equipped
  await p.evaluate(() => document.querySelector('#lkGrid [data-lk="g_m1"]').click()); await p.waitForTimeout(1500);
  await p.evaluate(() => window.__A.actions('lk-apply')); await p.waitForTimeout(300);
  out.eq = await p.evaluate(gun => window.__A.camoFor(gun), out.gun);
  await p.evaluate(() => document.querySelector('#lkGrid [data-lk="g_m7"]').click()); await p.waitForTimeout(1500); await snap('gr_locked');
  out.lockedBtn = await p.evaluate(() => { const b = document.querySelector('[data-act="lk-apply"]'); return b && b.disabled + ' ' + b.textContent; });
  // GOLD: finish all 8
  await p.evaluate(gun => { const A = window.__A; Object.assign(A.grindStat(gun), { k: 100, hs: 30, ls: 10, alt: 15, dbl: 5 }); A.grindCheck(gun, false); A.renderLocker(); }, out.gun);
  await p.evaluate(() => document.querySelector('#lkGrid [data-lk="g_gold"]').click()); await p.waitForTimeout(2200); await snap('gr_gold');
  // DIAMOND: gold on every gun in the class
  out.diamond = await p.evaluate(gun => { const A = window.__A, cat = A.ARM[gun].cat; for (const d of A.ARMORY.filter(d => d.cat === cat)) { Object.assign(A.grindStat(d.id), { k: 100, hs: 30, ls: 15, alt: 15, dbl: 8 }); A.grindCheck(d.id, false); } A.renderLocker(); return A.ownsFor('g_diamond', gun); }, out.gun);
  await p.evaluate(() => document.querySelector('#lkGrid [data-lk="g_diamond"]').click()); await p.waitForTimeout(2200); await snap('gr_diamond');
  // NOVA: everything
  out.nova = await p.evaluate(gun => { const A = window.__A; for (const d of A.ARMORY) { Object.assign(A.grindStat(d.id), { k: 100, hs: 30, ls: 15, alt: 15, dbl: 8 }); A.grindCheck(d.id, false); } A.renderLocker(); return A.ownsFor('g_nova', gun); }, out.gun);
  await p.evaluate(() => document.querySelector('#lkGrid [data-lk="g_nova"]').click()); await p.waitForTimeout(2200); await snap('gr_nova');
  await p.evaluate(() => window.__A.actions('lk-apply')); await p.waitForTimeout(300);
  await p.evaluate(() => window.__A.actions('lk-back')); await p.waitForTimeout(5000); await snap('gr_guns_done');
  out.after = await p.evaluate(() => { const A = window.__A; return { count: document.querySelector('.lk-count') && document.querySelector('.lk-count').textContent, secretFlag: /SECRET/.test(document.querySelector('.lk-count').textContent) }; });
  // per-gun: a grind camo can't go on another gun or on all guns
  out.rules = await p.evaluate(gun => { const A = window.__A, other = A.ARMORY.find(d => d.id !== gun && d.cat === 'ar').id; A.PROG.equip.guns[other] = 'g_m0'; delete A.PROG.owned['g_m0@' + other]; const r = A.camoFor(other); A.LK.sel = 'g_nova'; const all = A.lockerAct('lk-all'); return { other: r, allRefused: !all || A.PROG.equip.all !== 'g_nova' }; }, out.gun);
  // the NOVA gun in hand
  await p.evaluate(() => { window.__A.startMatch('tdm', {}); });
  await p.waitForFunction(() => window.__A.G.state === 'playing', null, { timeout: 60000 }); await p.evaluate(() => { window.__A.G.holdT = 0.01; window.__A.G.loadT = 0.01; }); await p.waitForTimeout(9000);
  await snap('gr_held_nova');
  return out;
};
