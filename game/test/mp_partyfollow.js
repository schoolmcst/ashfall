// PARTY: B joins A's party; A (the leader) presses PLAY -> B follows into the same match; A leaves -> B goes back too.
// Also: the leader goes to zombies and back.
const { mpPages, mpState } = require('./mp_lib.js');
(async () => {
  const { pages, errs, close, ev } = await mpPages(2, 39556), [A, B] = pages, log = {};
  for (const p of pages) await ev(p, () => { const A_ = window.__A; A_.LOBBY.playlist = ['otdm']; A_.LOBBY.mode = 'otdm'; A_.toLobby(); });
  await A.waitForTimeout(6000);
  const code = await ev(A, () => window.__A.MYCODE);
  await ev(B, c => window.__A.partyJoin(c), code); await A.waitForTimeout(6000);
  const party = p => ev(p, () => { const A_ = window.__A; return { members: A_.partyMembers().map(m => m.name + (m.lead ? '*' : '')).join(','), waiting: A_.partyWaiting(), where: A_.partyWhere().w }; });
  log.party = [await party(A), await party(B)];
  await ev(A, () => window.__A.actions('lob-start'));
  const samples = []; for (let i = 0; i < 7; i++) { await A.waitForTimeout(4000); const a = await mpState(A), b = await mpState(B); samples.push({ A: [a.st, a.scr, a.mode, a.host, a.rem.join('/')].join(' '), B: [b.st, b.scr, b.mode, b.host, b.rem.join('/')].join(' ') }); }
  log.follow = samples;
  log.sameRoom = await ev(B, () => { const N = window.__A.NET; return !!(N.room && [...N.rem.values()].some(r => !r.isBot && /ALPHA/.test(r.entry.name))); });
  // the leader leaves the match: B goes back to the lobby too
  await ev(A, () => { window.__A.leaveGame(); window.__A.toLobby(); }); await A.waitForTimeout(8000);
  log.leave = [await mpState(A), await mpState(B)].map(s => [s.st, s.scr, s.online].join(' '));
  // the leader picks LAST TOKE DUOS on the menu tile (an offline mode): the whole party goes online together
  await A.waitForTimeout(3000);
  await ev(A, () => { window.__A.showScreen('menu'); window.__A.startMatch('br', { map: 'random', squad: 2 }); });
  const s2 = []; for (let i = 0; i < 6; i++) { await A.waitForTimeout(4000); const a = await mpState(A), b = await mpState(B); s2.push({ A: [a.st, a.def, a.host, a.rem.join('/')].join(' '), B: [b.st, b.def, b.host, b.rem.join('/')].join(' ') }); }
  log.tile = s2;
  log.tileSameRoom = await ev(B, () => { const N = window.__A.NET; return !!(N.room && [...N.rem.values()].some(r => !r.isBot && /ALPHA/.test(r.entry.name))); });
  console.log(JSON.stringify(log, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await close(); process.exit(0);
})();
