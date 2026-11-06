// ONLINE LAST TOKE: the WARM-UP, THE BONG and THE FLOAT IN with two real players (INTRO=1 is set here)
process.env.INTRO = '1';
const { mpPages } = require('./mp_lib.js');
(async () => {
  const { pages, errs, close, ev } = await mpPages(2), [A, B] = pages, out = {};
  const k = process.env.MODE || 'obr';
  for (const p of pages) await ev(p, k => { const A_ = window.__A; for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); A_.LOBBY.playlist = [k]; A_.LOBBY.mode = k; A_.showScreen('menu'); }, k);
  await A.waitForTimeout(1500);
  await ev(A, () => window.__A.actions('lob-start')); await A.waitForTimeout(9000);
  await ev(B, () => window.__A.actions('lob-start')); await A.waitForTimeout(9000);
  for (const p of pages) await ev(p, () => { const N = window.__A.NET; if (N.priv) N.priv.lt = 0.5; });
  await A.waitForTimeout(4000);
  for (const p of pages) await ev(p, () => { const A_ = window.__A; A_.G.holdT = Math.min(A_.G.holdT, 0.3); if (A_.curScreen === 'classpick') try { A_.showScreen(null); } catch (e) {} });
  await A.waitForTimeout(6000);
  const st = p => ev(p, () => { const A_ = window.__A, M = A_.M, B = M && M.br, F = A_.BRF_GET(); return { host: !!(A_.NET.room && A_.NET.room.host), mode: M && M.mode, map: A_.curMap, ph: B ? B.phase : null, t: B ? Math.round(B.t) : null, st: A_.G.state, gun: A_.W[A_.G.cur] && A_.W[A_.G.cur].name, cine: !!F.cine, float: F.float, py: Math.round(A_.P.y), crates: B ? B.crates.filter(c => c.g.visible).length : 0, botsUp: A_.enemies.filter(e => e.entry && e.group.position.y - A_.TH(e.group.position.x, e.group.position.z) > 20).length, bots: A_.enemies.filter(e => e.entry).length }; });
  out.warmA = await st(A); out.warmB = await st(B);
  const H = out.warmA.host ? A : B, C = out.warmA.host ? B : A;
  await ev(H, () => { window.__A.M.br.t = 0.05; }); await A.waitForTimeout(2500);
  out.cineH = await st(H); out.cineC = await st(C);
  await A.waitForTimeout(9000);
  out.floatH = await st(H); out.floatC = await st(C);
  await A.waitForTimeout(40000);
  out.landH = await st(H); out.landC = await st(C);
  for (const [k2, v] of Object.entries(out)) console.log(k2, JSON.stringify(v));
  const ok = out.warmA.ph === -3 && out.warmB.ph === -3 && out.cineH.ph === -2 && out.cineC.ph === -2 && out.cineC.cine && (out.floatH.float || out.floatH.py > 30) && (out.floatC.float || out.floatC.py > 30) && out.landH.ph >= 0 && !out.landH.float && !out.landC.float;
  console.log(ok ? 'INTRO ONLINE OK' : 'INTRO ONLINE FAIL');
  console.log(errs.length ? 'ERRORS: ' + errs.slice(0, 5).join('\n') : 'NO ERRORS');
  await close(); process.exit(0);
})();
