module.exports = async p => p.evaluate(async () => {
  const A = window.__A, out = {};
  A.startMatch('tdm', { map: 'ruins', custom: true, score: 999, time: 0, perTeam: 2, skill: 'regular' });
  const probe = atts => { A.ATTS.marc = atts; A.equipClass({ p: 'marc', s: 'sidearm', e: 'frag', k: 'none' }); const w = A.W[0]; return { mag: w.magSize, recoil: +w.recoil.toFixed(4), spread: +w.spread.toFixed(4), ads: +(w.adsTime).toFixed(3), move: +w.move.toFixed(3), reload: +w.reload.toFixed(2), dmg: +w.dmg.toFixed(1), eff: +w.eff.toFixed(1), laser: w.laser }; };
  out.stock = probe({}); out.drum = probe({ magazine: 'drum' }); out.comp = probe({ muzzle: 'comp' }); out.laser = probe({ underbarrel: 'laser' }); out.long = probe({ barrel: 'long' }); out.nostock = probe({ stock: 'nostock' });
  // was the player's live weapon really changed?  (respawn path)
  A.ATTS.marc = { magazine: 'drum' }; A.respawnPlayer && A.respawnPlayer();
  return out;
});
