// stats survive: back up, wipe localStorage (like a lost save), reload -> restored from the backup
module.exports = async p => {
  await p.evaluate(() => { localStorage.setItem('ashfall.stats.online.v1', JSON.stringify({ matches: 42, kills: 900, deaths: 400, modes: {}, weapons: {} })); localStorage.setItem('ashfall.nick.v1', 'TESTER'); });
  await p.waitForTimeout(7000);
  await p.evaluate(() => { localStorage.removeItem('ashfall.stats.online.v1'); localStorage.setItem('ashfall.nick.v1', 'TESTER'); localStorage.removeItem('ashfall.friends.v1'); });
  await p.reload(); await p.waitForFunction(() => window.__A && window.__A.G.state === 'menu', null, { timeout: 120000 });
  await p.waitForTimeout(3000);
  return await p.evaluate(() => ({ online: JSON.parse(localStorage.getItem('ashfall.stats.online.v1') || 'null'), inGame: window.__A.STATS && 0, reloaded: sessionStorage.getItem('dz_restored') }));
};
