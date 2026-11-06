// ONLINE PROP HUNT with two players: both get into the match, and the joiner's hide countdown runs like the host's
const { mpPages, mpState } = require('./mp_lib.js');
(async () => {
  const { pages, errs, close, ev } = await mpPages(2), [A, B] = pages, log = {};
  for (const p of pages) await ev(p, () => { const A_ = window.__A; A_.LOBBY.playlist = ['oph']; A_.LOBBY.mode = 'oph'; A_.toLobby(); });
  await ev(A, () => window.__A.actions('lob-start')); await A.waitForTimeout(14000);
  await ev(B, () => window.__A.actions('lob-start')); await A.waitForTimeout(10000);
  log.pre = [await mpState(A), await mpState(B)];
  for (const p of pages) await ev(p, () => { const N = window.__A.NET; if (N.priv) N.priv.lt = 1; });
  await A.waitForTimeout(3000); for (const p of pages) await ev(p, () => { const A_ = window.__A; A_.G.holdT = Math.min(A_.G.holdT, 0.5); if (A_.curScreen === 'classpick') try { A_.showScreen(null); } catch (e) {} });
  const ph = p => ev(p, () => { const A_ = window.__A, P = A_.M && A_.M.ph; const blk = document.getElementById('phBlind') || document.querySelector('[id*="phBl"],[class*="ph-blind"]'); return P ? { phase: P.phase, t: +(P.t || 0).toFixed(1), hunt: P.hunt, myTeam: A_.M.myTeam, blind: blk ? getComputedStyle(blk).opacity + '/' + getComputedStyle(blk).display : 'none', st: A_.G.state, hold: +(A_.G.holdT || 0).toFixed(1), msg: (document.getElementById('msg') || {}).textContent } : { none: 1, st: A_.G.state }; });
  log.ph = [];
  for (let i = 0; i < 8; i++) { await A.waitForTimeout(4000); log.ph.push({ A: await ph(A), B: await ph(B) }); }
  // the swap: now the joiner hunts; its blindfold must count down and lift
  await ev(A, () => { window.__A.M.ph.t = 0.3; });
  log.swap = []; for (let i = 0; i < 7; i++) { await A.waitForTimeout(4000); log.swap.push({ A: await ph(A), B: await ph(B), Bblind: await ev(B, () => (document.getElementById('phBlind') || {}).innerText) }); }
  log.after = [await mpState(A), await mpState(B)];
  await A.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/mpph_A.png' : 'mpph_A.png' }); await B.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/mpph_B.png' : 'mpph_B.png' });
  console.log(JSON.stringify(log, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 20).join('\n') : 'NO ERRORS');
  await close(); process.exit(0);
})();
