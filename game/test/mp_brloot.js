// ONLINE LAST TOKE floor loot: the same furniture and items for both, a taken item goes for the other too, a dropped gun shows
const { mpPages } = require('./mp_lib.js');
(async () => {
  const { pages, errs, close, ev } = await mpPages(2), [A, B] = pages;
  for (const p of pages) await ev(p, k => { const A_ = window.__A; for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); A_.showScreen('menu'); A_.actions('br-play'); const L = A_.BRLOB_GET(); L.net = 'on'; L.sq = k === 'obr4' ? 4 : k === 'obr2' ? 2 : 1; L.rk = k === 'rbr'; }, 'obr');   // through the LAST TOKE lobby (1.2.93)
  await A.waitForTimeout(1500);
  await ev(A, () => window.__A.actions('bl-start')); await A.waitForTimeout(9000);
  await ev(B, () => window.__A.actions('bl-start')); await A.waitForTimeout(9000);
  for (const p of pages) await ev(p, () => { const N = window.__A.NET; if (N.priv) N.priv.lt = 0.5; });
  await A.waitForTimeout(4000);
  for (const p of pages) await ev(p, () => { const A_ = window.__A; A_.G.holdT = Math.min(A_.G.holdT, 0.3); if (A_.curScreen === 'classpick') try { A_.showScreen(null); } catch (e) {} });
  await A.waitForTimeout(8000);
  const st = p => ev(p, () => { const A_ = window.__A, L = A_.BRL_GET(); return { host: !!(A_.NET.room && A_.NET.room.host), seed: L.seed, sets: L.sets.length, items: L.items.filter(i => !i.gone).length, ids: L.items.filter(i => !i.gone).slice(0, 5).map(i => i.id + ':' + (i.gun || i.t || i.h || i.a)).join(',') }; });
  const a = await st(A), b = await st(B); console.log('A', JSON.stringify(a)); console.log('B', JSON.stringify(b));
  const H = a.host ? A : B, C = a.host ? B : A;
  // the joiner takes two guns (the second puts the first down) and an ammo can
  const took = await ev(C, () => { const A_ = window.__A, L = A_.BRL_GET(), g = L.items.filter(i => !i.gone && i.k === 'gun'), am = L.items.find(i => !i.gone && i.k === 'ammo'); A_.brlTakeL(g[0]); A_.brlTakeL(g[1]); A_.brlTakeL(am); return [g[0].id, g[1].id, am.id, A_.W[0].def.id]; });
  await A.waitForTimeout(6000);
  const seen = await ev(H, ids => { const L = window.__A.BRL_GET(), f = id => { const i = L.items.find(i => i.id === id); return i ? (i.gone ? 'gone' : 'there') : 'none'; }; return { g0: f(ids[0]), g1: f(ids[1]), ammo: f(ids[2]), drops: L.items.filter(i => i.id.includes('~') && !i.gone).map(i => i.gun) }; }, took);
  console.log('took', JSON.stringify(took), 'host sees', JSON.stringify(seen));
  const ok = a.seed && a.seed === b.seed && a.sets === b.sets && a.ids === b.ids && seen.g0 === 'gone' && seen.g1 === 'gone' && seen.ammo === 'gone' && seen.drops.length >= 1;
  console.log(ok ? 'BRLOOT ONLINE OK' : 'BRLOOT ONLINE FAIL');
  console.log(errs.length ? 'ERRORS: ' + errs.slice(0, 5).join('\n') : 'NO ERRORS');
  await close(); process.exit(0);
})();
