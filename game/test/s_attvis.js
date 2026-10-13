module.exports = async p => {
  await p.evaluate(() => { const A = window.__A; A.startGame(); A.G.look = { x: -3.5, z: 10.5, yaw: 0.05, pitch: -0.05 }; A.G.breakT = 1e9; });
  const sets = { marc: { optic: 'acog4', muzzle: 'suppressor', underbarrel: 'vgrip', magazine: 'extmag' }, sidearm2: null, kv47: { optic: 'holo', muzzle: 'suppressor', underbarrel: 'vgrip', magazine: 'drum' }, talon: { optic: 'acog4', underbarrel: 'laser', muzzle: 'comp' }, anvil: { optic: 'scope25', underbarrel: 'bipod', muzzle: 'brake' }, hawkeye: { optic: 'scope10', muzzle: 'suppressor', underbarrel: 'bipod' }, viper: { optic: 'reflex', muzzle: 'suppressor', underbarrel: 'agrip', stock: 'tacstock' }, deadeye: { optic: 'reflex', muzzle: 'comp', underbarrel: 'laser' } };
  for (const id in sets) { if (!sets[id]) continue;
    await p.evaluate(([id, s]) => { const A = window.__A, d = A.ARM[id], pri = d.cat !== 'pi'; A.ATTS[id] = s; A.equipClass({ p: pri ? id : 'marc', s: pri ? 'sidearm' : id, e: 'frag', k: 'none' }); if (!pri) A.switchWeapon(1); A.G.swapT = 0; }, [id, sets[id]]);
    await p.waitForTimeout(800);
    await p.screenshot({ path: `v_${id}.png`, clip: { x: 560, y: 300, width: 720, height: 420 } });
  }
  return 'ok';
};
