// the same menu scene on LOW and on ULTRA + EXTREME shadows + 16x filtering (real rendering)
module.exports = async p => {
  const shots = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); localStorage.setItem('dz_seen_update', '1.2.0'); for (const id of ['menu', 'hud']) document.getElementById(id).classList.add('hide'); });
  const shot = async (name, fn) => { await p.evaluate(fn); await p.waitForTimeout(2500); await p.screenshot({ path: shots + '/' + name + '.png' }); };
  await shot('gfx_low', () => { const A = window.__A; A.S.quality = 'low'; A.applySetting('quality'); });
  await shot('gfx_ultra', () => { const A = window.__A; A.S.quality = 'ultra'; A.applySetting('quality'); A.S.shadows = 'extreme'; A.applySetting('shadows'); A.S.renderScale = 150; A.applySetting('renderScale'); });
  return await p.evaluate(() => ({ map: window.__A.sun.shadow.mapSize.x, pr: window.__A.renderer.getPixelRatio() }));
};
