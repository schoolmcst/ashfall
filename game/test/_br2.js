module.exports = async p => {
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); window.__A.startMatch('br', { map: 'stackyard' }); });
  await p.waitForTimeout(4000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; });
  await p.waitForTimeout(4000);
  return p.evaluate(() => { const A = window.__A, B = A.BR_API.BR; const errs = []; for (const e of A.BR_API.brAliveBots().slice()) { e.hp = 1; e.spawnProt = 0; try { A.damageEnemy(e, 999, false, null, false, "player"); } catch (x) { errs.push(x.message); } }
    const left = A.BR_API.brAliveBots().length, ents = A.M.entries.filter(en => en.alive !== false).length; let err = ''; try { window.__A.M.t = 10; } catch (x) {}
    return new Promise(res => setTimeout(() => res({ left, ents, errs: errs.slice(0, 2), mt: A.M.t, st: A.G.state, over: A.M.over, ent2: A.M.entries.filter(en => en.alive !== false).map(en => en.name), bots2: A.BR_API.brAliveBots().length, me: A.M.me.alive }), 3000)); });
};
