module.exports = async p => {
  const ids = await p.evaluate(() => window.__A.ARMORY.map(d => d.id));
  await p.evaluate(() => { const A = window.__A; A.startGame(); A.G.look = { x: -3.5, z: 10.5, yaw: 0.05, pitch: -0.05 }; A.G.breakT = 1e9; });
  const out = {};
  const only = process.env.ONLY ? process.env.ONLY.split(',') : ids;
  for (const id of only) {
    const r = await p.evaluate(id => { const A = window.__A, d = A.ARM[id], pri = d.cat !== 'pi' && d.cat !== 'la';
      A.equipClass({ p: pri ? id : 'marc', s: pri ? 'sidearm' : id, e: 'frag', k: 'none' }); if (!pri) A.switchWeapon(1); A.G.swapT = 0; A.G.lookAds = false;
      const w = A.W[A.G.cur]; return { name: w.name, mag: w.magSize, sightY: w.sightY, len: w.len }; }, id);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `/home/claude/work/test/g_${id}.png`, clip: { x: 560, y: 300, width: 720, height: 420 } });
    if (process.env.ADS) { await p.evaluate(() => { window.__A.G.lookAds = true; }); await p.waitForTimeout(900); await p.screenshot({ path: `/home/claude/work/test/a_${id}.png`, clip: { x: 340, y: 160, width: 600, height: 400 } }); await p.evaluate(() => { window.__A.G.lookAds = false; dispatchEvent(new MouseEvent('mouseup', { button: 2 })); }); await p.waitForTimeout(800); }
    out[id] = r;
  }
  return out;
};
