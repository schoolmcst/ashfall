// CREW STASH HOUSE: crew points from matches, a friend's points from their card, the house level, the weekly goal and claim
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp';
  const r = await p.evaluate(() => { const A = window.__A, C = A.CH_API; const h = document.getElementById('hcSplash'); if (h) h.remove();
    C.crewMake('GREEN THUMBS', 'GT'); for (let i = 0; i < 20; i++) C.crewMatch(i % 2 ? 1 : -1, 12, 0); C.crewMatch(-1, 0, 25);
    const wk = C.chState().wk; A.FRIENDS.push({ c: 'BUDDY2', n: 'BUDDY', on: true, cw: [A.PROG.crew.id, 'GREEN THUMBS', 'GT'], cp: 9000, ck: 120, ckw: wk, z: [12, 6, 300, 2], s: [500, 300, 40, 90, 3600, 50000], r: 1200 });
    const t = C.chTotals(), dz0 = A.PROG.dz, claim = C.chClaim(), claim2 = C.chClaim();
    A.openLeaderboard(); A.SOC.lbSort = 'crew'; A.renderLeaderboard();
    return { mine: C.chState().cp, totals: t, claim, claim2, dz: A.PROG.dz - dz0, elite: A.PROG.tok.elite, tab: !!document.getElementById('chCv') }; });
  await p.waitForTimeout(800); await p.screenshot({ path: path.join(out, 'crewhouse.png') });
  return r;
};
