// screenshots of the front end: main menu, lobby, mode picker, scorestreaks, in-game streak HUD
const path = require('path'), fs = require('fs');
module.exports = async p => {
  const out = process.env.SHOTS || path.join(__dirname, 'shots'); fs.mkdirSync(out, { recursive: true });
  const shot = n => p.screenshot({ path: path.join(out, n + '.png') });
  const ev = (f, a) => p.evaluate(f, a), act = a => ev(a => window.__A.actions(a), a);
  await p.waitForTimeout(800); await shot('m1_menu');
  await act('go-on'); await p.waitForTimeout(600); await shot('m2_lobby');
  await act('modes'); await p.waitForTimeout(400); await shot('m3_modes');
  await ev(() => document.querySelector('#modeGrid [data-mode="offa"]').click()); await p.waitForTimeout(400); await act('custom'); await p.waitForTimeout(400); await shot('m4_custom');  await act('cus-back');
  await act('streaks'); await p.waitForTimeout(400); await shot('m5_streaks');
  await act('stk-back'); await p.waitForTimeout(400); await shot('m6_lobby_ffa');
  // in game: earn streaks, call a UAV and a mortar
  const r = await ev(async () => {
    const A = window.__A; A.LOBBY.mode = 'tdm'; A.startMatch('tdm', { score: 999, time: 0, perTeam: 6, custom: true, map: 'docks' }); A.G.spawnProt = 1e9; A.G.health = 1e9;
    await new Promise(r => setTimeout(r, 2500));
    A.stkAdd(1300); const have = A.STK.have.slice();
    A.stkUse(); A.stkUse(); await new Promise(r => setTimeout(r, 300));
    return { have, after: A.STK.have.slice(), uav: A.STK.uavT, jobs: A.STK.jobs.length };
  });
  await p.waitForTimeout(1500); await shot('m7_game_streaks');
  await p.waitForTimeout(4000); await shot('m8_strike');
  const k = await ev(() => window.__A.M.entries.find(e => e.isPlayer).kills);
  return { r, killsAfterStrike: k };
};
