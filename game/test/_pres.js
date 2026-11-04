module.exports = async p => p.evaluate(() => { const A = window.__A; A.PROG.pres = 10; A.PROG.xp = A.XP_AT[A.MAXLVL]; A.presGo();
  const r = { pres: A.PROG.pres, xp: A.PROG.xp, charm: !!A.PROG.owned.pr_ch_11, banner: A.PROG.banner, inBoxes: A.BOX_POOL.some(c => /^pr_ch_|^gr_/.test(c.id)) };
  for (let n = 11; n <= 20; n++) { try { A.charmBuild('pr_ch_' + n); } catch (e) { r['err' + n] = e.message; } }
  A.PROG.pres = 20; A.PROG.xp = A.XP_AT[A.MAXLVL]; A.presGo(); r.capped = A.PROG.pres; return r; });
