// REPLAY THEATRE: a short match is recorded into the library, follow any player, heat map, a clip saved and played
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); window.__A.startMatch('tdm', { map: 'stackyard' }); });
  await p.waitForTimeout(3000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; A.G.noRender = true; });
  await p.waitForTimeout(25000);
  r.rec = await p.evaluate(() => { const A = window.__A; const n = A.REC ? A.REC.frames.length : -1; A.endMatch(0); return n; });
  await p.waitForTimeout(3000);
  r.lib = await p.evaluate(() => { const A = window.__A; A.G.noRender = false; A.showScreen('menu'); A.openReplay(); return { matches: A.RP_LIB.matches.length, len: A.RPLAST && +A.RPLAST.len.toFixed(1) }; });
  await p.evaluate(() => { document.getElementById('rpFollow').click(); document.getElementById('rpFollow').click(); document.getElementById('rpHeat').click(); const A = window.__A; A.RV.t = 1; document.getElementById('rpIn').click(); A.RV.t = Math.min(A.RPLAST.len, 5); document.getElementById('rpOut').click(); A.RV.play = false; });
  r.btn = await p.evaluate(() => ['rpFollow', 'rpHeat', 'rpClip'].map(id => document.getElementById(id).textContent));
  await p.waitForTimeout(800); await p.screenshot({ path: path.join(out, 'th_view.png') });
  r.clip = await p.evaluate(() => { document.getElementById('rpClip').click(); return window.__A.RP_LIB.clips.length; });
  await p.evaluate(() => document.getElementById('rpLibBtn').click()); await p.waitForTimeout(500); await p.screenshot({ path: path.join(out, 'th_lib.png') });
  r.openClip = await p.evaluate(() => { const el = document.querySelector('.rp-li[data-rpk="c"]'); if (el) el.click(); const A = window.__A; return { title: document.getElementById('rpTitle').textContent, len: +A.RPLAST.len.toFixed(1) }; });
  r.back = await p.evaluate(() => { document.getElementById('rpBack').click(); const A = window.__A; return A.RPLAST && !A.RPLAST.clip; });
  return r;
};
