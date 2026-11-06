// CAMPAIGN CO-OP: A hosts, B joins by code; A plays NEW ROOTS; B follows in, sees A's enemies, hits them, follows the steps and the end
const { mpPages } = require('./mp_lib.js');
(async () => {
  const { pages, errs, close, ev } = await mpPages(2, 39561), [A, B] = pages, log = {};
  await ev(A, () => { window.__A.campMenu(); window.__A.ccJoin('QWERT'); });
  await A.waitForTimeout(5000);
  await ev(B, () => { window.__A.campMenu(); window.__A.ccJoin('QWERT'); });
  await A.waitForTimeout(8000);
  log.room = { A: await ev(A, () => ({ on: window.__A.CC_GET().on, host: window.__A.ccHost(), rem: window.__A.CC_GET().rem.size, box: (document.getElementById('ccBox') || {}).innerText })), B: await ev(B, () => ({ on: window.__A.CC_GET().on, host: window.__A.ccHost(), rem: window.__A.CC_GET().rem.size })) };
  for (const p of pages) await ev(p, () => { const A = window.__A; A.PROG.camp = A.PROG.camp || { done: {}, tins: {}, last: '' }; for (const m of A.CAMP_MISSIONS) A.PROG.camp.done[m.id] = A.PROG.camp.done[m.id] || { best: 1 }; });
  await ev(A, () => { window.__A.ccPlayL('c2m1', 'regular'); });
  await A.waitForTimeout(20000);
  log.inA = await ev(A, () => { const A_ = window.__A; return { mode: A_.M && A_.M.mode, map: A_.curMap, step: A_.CAMP.i, enemies: A_.enemies.filter(e => e.entry).length }; });
  log.inB = await ev(B, () => { const A_ = window.__A; return { mode: A_.M && A_.M.mode, map: A_.curMap, step: A_.CAMP.i, client: A_.ccClient(), prox: A_.CC_GET().prox.size }; });
  // the host moves on two steps (talk, go): B follows
  await ev(A, () => { window.__A.ccStepL(); });
  await A.waitForTimeout(4000); await ev(A, () => { window.__A.ccStepL(); });
  await A.waitForTimeout(6000);
  log.steps = { A: await ev(A, () => window.__A.CAMP.i), B: await ev(B, () => window.__A.CAMP.i) };
  // fast forward the host to the hold step: enemies spawn, B sees them and shoots one
  await ev(A, () => { window.__A.ccSpawnL('n1'); });
  await A.waitForTimeout(6000);
  log.fight = { A: await ev(A, () => ({ step: window.__A.CAMP.i, foes: window.__A.enemies.filter(e => e.entry && e.camp && !e.camp.ally).length })), B: await ev(B, () => ({ step: window.__A.CAMP.i, prox: [...window.__A.CC_GET().prox.values()].filter(e => e.team === 1).length })) };
  const hit = await ev(B, () => { const A_ = window.__A, e = [...A_.CC_GET().prox.values()].find(q => q.team === 1); if (!e) return null; A_.ccDmgL(e, 999, true, null, false, 'player'); return e.ccId; });
  await A.waitForTimeout(4000);
  log.hit = { id: hit, goneOnHost: await ev(A, id => !window.__A.enemies.some(e => e.ccId === id), hit) };
  // the host finishes: B finishes too
  await ev(A, () => { window.__A.ccDoneL(); });
  await A.waitForTimeout(6000);
  log.end = { A: await ev(A, () => ({ st: window.__A.G.state, done: !!(window.__A.PROG.camp.done.c2m1) })), B: await ev(B, () => ({ st: window.__A.G.state, scr: window.__A.curScreen })) };
  console.log(JSON.stringify(log, null, 1)); console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await close(); process.exit(0);
})();
