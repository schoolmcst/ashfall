// PARTY INVITE from the friends list: A invites B -> B gets a toast, presses JOIN -> B is in A's party
const { mpPages } = require('./mp_lib.js');
(async () => {
  const { pages, errs, close, ev } = await mpPages(2, 39558), [A, B] = pages, log = {};
  const ca = await ev(A, () => window.__A.MYCODE), cb = await ev(B, () => window.__A.MYCODE);
  await ev(A, c => { window.__A.FRIENDS_ARR.push({ c, n: 'P2BRAVO', on: true }); window.__A.toLobby(); }, cb);
  await ev(B, c => { window.__A.FRIENDS_ARR.push({ c, n: 'P1ALPHA', on: true }); window.__A.toLobby(); }, ca);
  await A.waitForTimeout(8000);
  log.button = await ev(A, () => { const b = document.querySelector('[data-fi]'); return b ? b.textContent : 'none'; });
  A.on('console', m => { if (/INV/.test(m.text())) console.log('A>', m.text()); });
  await ev(A, c => { const A_ = window.__A; const t0 = performance.now(); A_.socInvite(c).then(() => console.log('INV done ' + Math.round(performance.now() - t0) + ' ' + A_.PARTY.status)).catch(e => console.log('INV err ' + e.message)); }, cb);
  await A.waitForTimeout(4000);
  log.dbg = { Ainv: await ev(A, () => [...window.__A.SOC.inviting.keys()].join(',') + ' st:' + window.__A.PARTY.status), Binbox: await ev(B, () => { const S = window.__A.SOC; return S.inbox ? S.inbox.peers().map(p => JSON.stringify(p.presence || {}).slice(0, 120)).join(' | ') : 'no inbox'; }) };
  await A.waitForTimeout(5000);
  log.toast = await ev(B, () => { const t = [...document.querySelectorAll('.fr-toast')].find(x => /PARTY INVITE/.test(x.innerText)); return t ? t.innerText.replace(/\n/g, ' ') : 'none'; });
  await ev(B, () => { const b = document.querySelector('.fr-toast [data-iv="1"]'); if (b) b.click(); });
  await A.waitForTimeout(8000);
  log.party = { A: await ev(A, () => window.__A.partyMembers().map(m => m.name + (m.lead ? '*' : '')).join(',')), B: await ev(B, () => window.__A.partyMembers().map(m => m.name + (m.lead ? '*' : '')).join(',')) };
  console.log(JSON.stringify(log, null, 1)); console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await close(); process.exit(0);
})();
