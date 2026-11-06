// REJOIN and STAND-IN BOTS: B drops out mid-match -> a bot stands in with B's name and score; B rejoins from the menu tile
const { mpPages, mpState } = require('./mp_lib.js');
(async () => {
  const { pages, errs, close, ev } = await mpPages(2, 39557), [A, B] = pages, log = {};
  for (const p of pages) await ev(p, () => { const A_ = window.__A; A_.LOBBY.playlist = ['otdm']; A_.LOBBY.mode = 'otdm'; A_.toLobby(); });
  await ev(A, () => window.__A.actions('lob-start')); await A.waitForTimeout(9000);
  await ev(B, () => window.__A.actions('lob-start')); await A.waitForTimeout(9000);
  for (const p of pages) await ev(p, () => { const N = window.__A.NET; if (N.priv) N.priv.lt = 0.5; }); await A.waitForTimeout(4000);
  for (const p of pages) await ev(p, () => { const A_ = window.__A; A_.G.holdT = Math.min(A_.G.holdT, 0.3); if (A_.curScreen === 'classpick') A_.showScreen(null); }); await A.waitForTimeout(6000);
  const hostEntries = () => ev(A, () => window.__A.M.entries.map(e => `${e.name}:${e.kills}/${e.deaths}${e.botLabel ? '(bot' + (e.takeOf ? ' for ' + e.takeOf : '') + ')' : ''}`).join(' '));
  log.before = await hostEntries();
  log.saved = await ev(B, () => !!window.__A.rjSaved());
  // B's kills as the host sees them, then B's connection drops
  await ev(B, () => { const A_ = window.__A; A_.NET.k = 7; A_.NET.d = 2; A_.G.kills = 7; }); await A.waitForTimeout(5000);
  await ev(B, () => { const A_ = window.__A; A_.RJ.lost = true; try { A_.NET.room.leave(); } catch (e) {} A_.leaveGame(); A_.showScreen('menu'); });
  await A.waitForTimeout(12000);
  log.standIn = await hostEntries();
  log.tile = await ev(B, () => { const t = document.getElementById('rjTile'); return t ? t.innerText.replace(/\n/g, ' ') : 'none'; });
  await ev(B, () => window.__A.actions('rejoin')); await A.waitForTimeout(14000);
  for (const p of pages) await ev(p, () => { const A_ = window.__A; if (A_.curScreen === 'classpick') A_.showScreen(null); });
  log.back = await hostEntries();
  log.bState = await mpState(B);
  console.log(JSON.stringify(log, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await close(); process.exit(0);
})();
