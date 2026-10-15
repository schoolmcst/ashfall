// locker (gun picker -> gun page with owned camos only -> other cosmetics), boxes (3 kinds, contents, secret drops), camo sheet
module.exports = async p => {
  const shots = process.env.SHOTS || '/tmp', out = {}, snap = n => { console.log('T:' + n); return p.screenshot({ path: shots + '/' + n + '.png' }); };
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); localStorage.setItem('dz_seen_update', '1.2.0'); });
  out.counts = await p.evaluate(() => { const A = window.__A, by = [0, 0, 0, 0, 0]; for (const c of A.COSM) if (c.kind !== 'sticker') by[c.r]++; return { total: A.COSM.length, camos: A.COSM.filter(c => c.kind === 'camo' && !c.secret).length, skins: A.COSM.filter(c => c.kind === 'skin').length, stickers: A.COSM.filter(c => c.kind === 'sticker').length, secret: A.COSM.filter(c => c.secret).length, byRarity: by }; });
  // a TDM match for XP (results)
  await p.evaluate(() => window.__A.startMatch('tdm', {}));
  await p.waitForFunction(() => window.__A.G.state === 'playing', null, { timeout: 60000 }); await p.evaluate(() => { window.__A.G.holdT = 0.01; window.__A.G.loadT = 0.01; }); await p.waitForTimeout(700);
  out.match = await p.evaluate(() => { const A = window.__A; for (let i = 0; i < 14; i++) A.statKillAt(A.P.x + 20, A.P.z, i % 3 === 0); A.M.teamScore[A.M.myTeam] = 75; A.endMatch(A.M.myTeam); document.getElementById('loadscr').classList.add('hide'); const g = A.PROG.lastGain; return g && { xp: g.xp, from: g.from, to: g.to }; });
  await p.evaluate(() => window.__A.toLobby()); await p.waitForTimeout(600);
  // some owned items + one secret for the M4A1
  await p.evaluate(() => { const A = window.__A; A.PROG.xp = A.XP_AT[52] + 400; for (const c of A.COSM) if (c.lvl && c.lvl <= 52) A.PROG.owned[c.id] = 1;
    for (const id of ['diamond', 'dragon', 'tiger', 'woodland', 'carbon', 'rosegold', 'chrome', 'c_prism', 'c_neon_waves', 'c_lava_crack', 'c_forest_fleck', 'c_ruby', 'c_glitch', 'c_tiger_zebra']) A.PROG.owned[id] = 1;
    A.PROG.owned['x_bloodline@marc'] = 1; A.PROG.dz = 9000; A.saveProg(); });
  await p.evaluate(() => window.__A.actions('locker')); await p.waitForTimeout(8000); await snap('lk2_guns');
  await p.evaluate(() => document.querySelector('[data-lkgun="marc"]').click()); await p.waitForTimeout(2200); await snap('lk2_gun');
  await p.evaluate(() => document.querySelector('#lkGrid [data-lk="diamond"]').click()); await p.waitForTimeout(2200); await snap('lk2_diamond');
  await p.evaluate(() => document.querySelector('#lkGrid [data-lk="x_bloodline"]').click()); await p.waitForTimeout(2200); await snap('lk2_secret');
  out.gunTiles = await p.evaluate(() => [...document.querySelectorAll('#lkGrid [data-lk]')].map(b => b.dataset.lk).filter(Boolean).length);
  await p.evaluate(() => window.__A.actions('lk-apply')); await p.waitForTimeout(300);
  out.secretEq = await p.evaluate(() => ({ marc: window.__A.camoFor('marc'), other: (() => { window.__A.PROG.equip.guns.kv47 = 'x_bloodline'; const r = window.__A.camoFor('kv47'); delete window.__A.PROG.equip.guns.kv47; return r; })() }));
  await p.evaluate(() => document.querySelector('[data-lktab="other"]').click()); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#lkGrid [data-lk="st_wings"]').click()); await p.waitForTimeout(2200); await snap('lk2_other');
  // rewards + contents + opening
  await p.evaluate(() => window.__A.actions('rewards')); await p.waitForTimeout(800); await snap('rw2');
  await p.evaluate(() => window.__A.actions('rw-see-prestige')); await p.waitForTimeout(800); await snap('rw2_contents');
  await p.evaluate(() => window.__A.actions('rw-see-close'));
  await p.evaluate(() => window.__A.actions('rw-box-elite')); await p.waitForTimeout(6500); await snap('rw2_open');
  await p.evaluate(() => window.__A.actions('rw-box-close'));
  // force a secret drop to see its reveal
  await p.evaluate(() => { const A = window.__A, orig = Math.random; let n = 0; Math.random = () => (n++ === 0 ? 0.9999 : orig()); A.actions('rw-box-std'); Math.random = orig; }); await p.waitForTimeout(6500); await snap('rw2_secret');
  out.secretDrop = await p.evaluate(() => { const r = window.__A.BOXV.res; return r && { id: r.it.id, gun: r.gun, r: r.it.r }; });
  await p.evaluate(() => window.__A.actions('rw-box-close'));
  // odds per box (20k each)
  out.odds = await p.evaluate(() => { const A = window.__A, res = {}; for (const b of A.BOXES) { const n = [0, 0, 0, 0, 0]; for (let i = 0; i < 20000; i++) n[A.rollBox(b.id).it.r]++; res[b.id] = n.map(x => (x / 200).toFixed(2) + '%'); } return res; });
  // the secret camo on the held M4A1
  await p.evaluate(() => { const A = window.__A; A.PROG.equip.guns.marc = 'x_bloodline'; A.saveProg(); A.startMatch('tdm', {}); });
  await p.waitForFunction(() => window.__A.G.state === 'playing', null, { timeout: 60000 }); await p.evaluate(() => { window.__A.G.holdT = 0.01; window.__A.G.loadT = 0.01; }); await p.waitForTimeout(1500);
  await snap('lk2_held_secret');
  return out;
};
