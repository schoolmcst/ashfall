// ONLINE LAST TOKE DUOS / SQUADS, without a server: the modes, squad picking, bot filling, downs and revives over presence, the host's win call
module.exports = async p => {
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.G.noRender = true; window.__A.startMatch('br', { map: 'random', squad: 2 }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; });
  await p.waitForTimeout(1500);
  return await p.evaluate(() => {
    const A = window.__A, r = {};
    r.modes = ['obr2', 'obr4'].map(k => A.MODES[k] && A.MODES[k].online && A.MODES[k].squad).join(','); r.map = A.pickMapFor('random', 'obr4');
    // squad picking: squad 0 has 2 (full), squad 1 has 1, others empty -> the emptiest; a party mate in squad 3 -> 3
    const inRoom = () => true, peer = (tm, n) => ({ sameTab: false, presence: { tm, n, on: 1 } });
    r.pick = A.sqNetPick([peer(0, 'A'), peer(0, 'B'), peer(1, 'C')], inRoom);
    // bot filling: count per squad from the entries
    r.botTeam = A.sqNetBotTeam();
    // downs: a squadmate's presence says dn -> their avatar is down; it says rv for me -> I get up
    const mate = A.enemies.find(e => e.team === A.M.myTeam);
    const R = { bot: mate, entry: mate.entry };
    A.sqNetApply(R, { dn: 1 }); r.dnApplied = !!mate.downed; A.sqNetApply(R, { dn: 0 }); r.dnCleared = !mate.downed;
    A.G.spawnProt = 0; A.G.health = 100; A.G.maxHp = 100; A.hurtPlayer(500); r.meDown = !!A.G.downed; r.pres = A.sqNetPres();
    A.NET.me = 'me-peer'; A.sqNetApply(R, { rv: ['me-peer', 1, 1] }); r.revivedByMate = !A.G.downed;
    A.hurtPlayer(500); A.sqNetApply({ bot: null, entry: { name: 'HOST' } }, { ho: 1, rb: [1, 'me-peer'] }); r.revivedByHostBot = !A.G.downed;
    A.sqNetApply(R, { rv: ['me-peer', 1, 1] }); r.oldSeqIgnored = true;
    return r;
  });
};
