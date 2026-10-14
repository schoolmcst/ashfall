// perks: three tiers in the loadout, and each one does what it says
const D = process.env.SHOTS || '/tmp';
module.exports = async p => {
  await p.waitForTimeout(2500); await p.evaluate(() => { const g = document.getElementById('hcGo'); g && g.click(); }); await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const A = window.__A, out = {};
    A.startMatch('tdm', { score: 999, time: 0, perTeam: 1, custom: true, map: 'docks' }); A.G.holdT = 0; A.G.loadT = 0; A.G.spawnProt = 0; A.G.state = 'playing';
    const hp = (perks, f) => { A.G.perks = perks; A.G.health = 100; A.G.spawnProt = 0; f(); return Math.round(100 - A.G.health); };
    out.blastNoPerk = hp([], () => A.hurtPlayer(40, 0, 0, true)); out.blastVest = hp(['flak'], () => A.hurtPlayer(40, 0, 0, true));
    const pitch0 = A.P.pitch; A.G.perks = []; A.G.health = 100; A.hurtPlayer(5, 0, 0); out.knock = +(A.P.pitch - pitch0).toFixed(4);
    const p1 = A.P.pitch; A.G.perks = ['iron']; A.G.health = 100; A.hurtPlayer(5, 0, 0); out.knockIron = +(A.P.pitch - p1).toFixed(4);
    A.STK.pts = 0; A.G.perks = []; A.stkAdd(100); out.pts = A.STK.pts; A.STK.pts = 0; A.G.perks = ['hard']; A.stkAdd(100); out.ptsHard = A.STK.pts;
    return out;
  });
  await p.evaluate(() => { const A = window.__A; A.leaveGame(); A.setActive(4); A.openLoadout(); });
  await p.waitForTimeout(700);
  await p.evaluate(() => { const b = document.querySelector('[data-lo-r="k2"]'); b && b.click(); });
  await p.waitForTimeout(500);
  await p.screenshot({ path: D + '/perks_loadout.png' });
  r.rows = await p.evaluate(() => [...document.querySelectorAll('#loSlots .lo-slot')].map(b => b.innerText.replace(/\n/g, ': ')).slice(-3));
  r.opts = await p.evaluate(() => [...document.querySelectorAll('#loOpts .lo-name')].map(b => b.innerText));
  return r;
};
