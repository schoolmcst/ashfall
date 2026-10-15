// detailed graphics settings: presets, CUSTOM, supersampling, shadows, filtering, grass, effects, frame limit; pictures of the menu
module.exports = async p => {
  const shots = process.env.SHOTS || '/tmp', out = {};
  await p.evaluate(() => { const A = window.__A; A.renderer.render = () => {}; const h = document.getElementById('hcSplash'); if (h) h.remove(); localStorage.setItem('dz_seen_update', '1.2.0'); });
  // open settings > VIDEO
  await p.evaluate(() => { document.querySelector('[data-act="settings"]') ? document.querySelector('[data-act="settings"]').click() : null; });
  await p.waitForTimeout(300);
  await p.evaluate(() => { const A = window.__A; if (document.getElementById('settings').classList.contains('hide')) { document.getElementById('settings').classList.remove('hide'); document.getElementById('menu').classList.add('hide'); } A.buildTabs(); A.renderSettings(); });
  await p.waitForTimeout(1600);   // refresh-rate sampling
  out.heads = await p.evaluate(() => [...document.querySelectorAll('#setBody .sethead')].map(h => h.textContent));
  out.hw = await p.evaluate(() => [...document.querySelectorAll('#setBody .hwv')].map(h => h.textContent));
  await p.screenshot({ path: shots + '/gfx_menu1.png' });
  // presets
  out.presets = await p.evaluate(() => { const A = window.__A, r = {}; for (const k of ['low', 'medium', 'high', 'ultra']) { A.S.quality = k; A.applySetting('quality'); r[k] = { scale: A.S.renderScale, shadows: A.S.shadows, map: A.sun.shadow.mapSize.x, cast: A.sun.castShadow, anis: A.S.anis, grass: A.S.grass, fx: A.FX.mult, g: A.getGrass() }; } return r; });
  // a detail change turns the preset into CUSTOM, preset buttons follow
  out.custom = await p.evaluate(() => { const A = window.__A; A.S.quality = 'high'; A.applySetting('quality'); A.S.anis = 2; A.applySetting('anis'); const on = document.querySelector('#setBody .seg[data-k="quality"] .on'); return { q: A.S.quality, on: on && on.textContent }; });
  // supersampling: 200% doubles the pixel ratio (capped by GPU limits)
  out.ss = await p.evaluate(() => { const A = window.__A, r = {}; for (const v of [50, 100, 150, 200]) { A.S.renderScale = v; A.applySetting('renderScale'); r[v] = +A.renderer.getPixelRatio().toFixed(2) + ' px ' + A.renderer.domElement.width; } return r; });
  // shadows table and distance
  out.shadow = await p.evaluate(() => { const A = window.__A, r = {}; for (const k of ['off', 'low', 'medium', 'high', 'ultra', 'extreme']) { A.S.shadows = k; A.applySetting('shadows'); r[k] = A.sun.castShadow ? A.sun.shadow.mapSize.x : 'off'; } A.S.shadows = 'high'; A.applySetting('shadows'); return { r, maxTex: A.HW.maxTex }; });
  // texture filtering reaches existing textures
  out.anis = await p.evaluate(() => { const A = window.__A; A.S.anis = 16; A.applySetting('anis'); const vals = new Set(); A.scene.traverse(o => { const m = o.material; if (m && !Array.isArray(m) && m.map) vals.add(m.map.anisotropy); }); return [...vals]; });
  // frame limit: count rendered frames over 1 s at 30
  out.cap = await p.evaluate(async () => { const A = window.__A; let n = 0; const orig = A.renderer.clear; A.renderer.clear = function () { n++; }; A.S.fpsCap = 30; await new Promise(r => setTimeout(r, 1000)); const c30 = n; n = 0; A.S.fpsCap = 0; await new Promise(r => setTimeout(r, 1000)); A.renderer.clear = orig; return { cap30: c30, display: n, hz: A.HW.hz }; });
  // pictures: scroll the menu
  await p.evaluate(() => { const b = document.getElementById('setBody'); const h = [...b.querySelectorAll('.sethead')][2]; h && h.scrollIntoView(); });
  await p.waitForTimeout(200); await p.screenshot({ path: shots + '/gfx_menu_disp.png' });
  await p.evaluate(() => { const b = document.getElementById('setBody'); const h = [...b.querySelectorAll('.sethead')][3]; h && h.scrollIntoView(); });
  await p.waitForTimeout(200); await p.screenshot({ path: shots + '/gfx_menu2.png' });
  await p.evaluate(() => { const b = document.getElementById('setBody'); const h = [...b.querySelectorAll('.sethead')][4]; h && h.scrollIntoView(); });
  await p.waitForTimeout(200); await p.screenshot({ path: shots + '/gfx_menu3.png' });
  out.saved = await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('ashfall.settings.v1')); return { cfgVer: o.cfgVer, q: o.quality, anis: o.anis, fps: o.fpsCap }; });
  return out;
};
