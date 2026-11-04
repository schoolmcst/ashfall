// LAST TOKE online pieces without a network: the host's pack rebuilds crates and cloud on a client, opened crates sync back
module.exports = async p => {
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); window.__A.startMatch('br', { map: 'stackyard' }); });
  await p.waitForTimeout(4000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.noRender = true; });
  await p.waitForTimeout(3000);
  return p.evaluate(() => { const A = window.__A, X = A.BR_API, B = X.BR;
    B.phase = 1; B.closing = true; B.t = 12; B.to = { x: 3, z: -4, r: 14 }; B.from = { x: 0, z: 0, r: 25 }; B.crates[2].open = true;
    const viaObj = X.netObjPack(), pk = X.brPack(), host = { n: B.crates.length, open: B.crates.filter(c => c.open).map(c => c.id) };
    // become a client: wipe the crates, apply the host's pack
    const M = A.M, NET = X.NET, room0 = NET.room; M.online = true; NET.room = { host: false, presence() {}, peers: () => [] };
    for (const c of B.crates) if (!c.open) B.group.remove(c.g); B.crates = []; B.phase = -1; B.closing = false;
    X.brApply(pk); const client = { n: B.crates.length, open: B.crates.filter(c => c.open).map(c => c.id), phase: B.phase, closing: B.closing, to: B.to, r: B.r };
    // the client opens one: it goes into its presence list
    X.brOpen(B.crates[0], 'player'); const mine = B.mine.slice();
    // back to host: the client's list marks it open
    NET.room = { host: true }; X.brRemoteOpened([5]); const hostOpen5 = B.crates[5].open;
    M.online = false; NET.room = room0;
    return { packCode: viaObj && viaObj[0], len: pk.length, host, client, mine, hostOpen5 }; });
};
