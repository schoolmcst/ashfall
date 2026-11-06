// zombies co-op on the current harness (mp_lib): host + friend, the host starts, the friend sees the zombies and kills one
const { mpPages } = require('./mp_lib.js');
(async () => {
  const { pages, errs, close, ev } = await mpPages(2, 39562), [A, B] = pages, log = {};
  for (const p of pages) await ev(p, () => { const A_ = window.__A; A_.ZL.map = 'blackwell'; A_.ZL.net = 'coop'; A_.openZLobby(); A_.zcJoin('code', 'zt9'); });
  await A.waitForTimeout(12000);
  log.lobby = { A: await ev(A, () => ({ conn: window.__A.ZC.conn, host: window.__A.zcHost() })), B: await ev(B, () => ({ conn: window.__A.ZC.conn, host: window.__A.zcHost() })) };
  const host = log.lobby.A.host ? A : B, cli = host === A ? B : A;
  await ev(host, () => window.__A.zombAct('z-start'));
  await A.waitForTimeout(25000);
  for (const p of pages) await ev(p, () => { const G = window.__A.G; if (G.state === 'paused') G.state = 'playing'; });
  log.game = { host: await ev(host, () => ({ in: window.__A.ZC.inGame, st: window.__A.G.state, round: window.__A.Z.round, z: window.__A.enemies.filter(e => e.zombie && !e.proxy).length })), cli: await ev(cli, () => ({ in: window.__A.ZC.inGame, st: window.__A.G.state, prox: window.__A.ZC.prox.size, trial: !!window.__A.ZS2 })) };
  const id = await ev(cli, () => { const A_ = window.__A, e = [...A_.ZC.prox.values()][0]; if (!e) return null; for (let i = 0; i < 20; i++) A_.damageEnemy(e, 400, true, null, false, 'player'); return e.zid; });
  await A.waitForTimeout(5000);
  log.kill = { id, goneOnHost: await ev(host, id => !window.__A.enemies.some(e => e.zid === id && !e.proxy), id) };
  console.log(JSON.stringify(log, null, 1)); console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await close(); process.exit(0);
})();
