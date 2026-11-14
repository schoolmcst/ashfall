// GRAPHICS C (atmosphere) in a real match: rain (splashes, lens drops, wet ground, lightning), snow settling, smoke, shimmer, paper
module.exports = async p => { const r = {}; try { await run(p, r); } catch (e) { r.FAIL = String(e).slice(0, 400); } return r; };
const run = async (p, r) => {
  const SH = process.env.SHOTS || '/tmp', ev = (f, a) => p.evaluate(f, a);
  const go = async (map, wx) => { await ev(([map, wx]) => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); const A = window.__A; A.GA_GET().forceWx = wx; A.applyPreset('ultraplus'); A.S.quality = 'ultraplus'; A.applyVideoSettings(); try { A.leaveGame(); } catch (e) {} A.startMatch('tdm', { map }); }, [map, wx]);
    await p.waitForTimeout(12000); await ev(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; for (const e of A.enemies) { e.acc = 0; e.dmg = 0; } }); await p.waitForTimeout(2500); await ev(() => { const A = window.__A; if (A.G.state === 'paused') { A.G.state = 'playing'; A.showScreen(null); } A.G.health = A.G.maxHp = 1e9; }); };
  await go('town', 'rain'); await p.waitForTimeout(6000);
  r.rain = await ev(() => { const A = window.__A, GA = A.GA_GET(); return { amb: A.AMB.kind, wet: Math.round(A.GM_GET().wet.value * 100) / 100, splashes: GA.splash ? GA.splash.count : 0, drops: GA.drops.length }; });
  await ev(() => { const A = window.__A; A.GA_GET().boltT = 0.01; A.P.pitch = 0.05; }); await p.waitForTimeout(350); await p.screenshot({ path: SH + '/gfx3_lightning.png' });
  await p.waitForTimeout(2500); await ev(() => { const A = window.__A; A.GM_GET().wet.value = 1; A.P.pitch = -0.25; }); await p.waitForTimeout(3000); await p.screenshot({ path: SH + '/gfx3_rain.png' });
  // smoke and an explosion
  await ev(() => { const A = window.__A, f = new A.THREE_V3(A.P.x - Math.sin(A.P.yaw) * 7, 0, A.P.z - Math.cos(A.P.yaw) * 7); A.smkCloudL(f, 'hotbox'); A.explodeL({ x: A.P.x - Math.sin(A.P.yaw) * 10 + 3, y: 0.3, z: A.P.z - Math.cos(A.P.yaw) * 10 }, 'test', 0); A.P.pitch = 0; });
  await p.waitForTimeout(2500); await p.screenshot({ path: SH + '/gfx3_smoke.png' });
  r.shim = await ev(() => window.__A.GA_GET().shim.map(v => Math.round(v.w * 100) / 100));
  // snow
  await go('docks', 'snow'); await ev(() => { window.__A.GM_GET().snow.value = 0.85; }); await p.waitForTimeout(5000); await p.screenshot({ path: SH + '/gfx3_snow.png' });
  // clear weather: paper
  await go('docks', ''); await p.waitForTimeout(5000);
  r.paper = await ev(() => window.__A.GA_GET().pap.filter(q => q.m.parent).length);
  await p.screenshot({ path: SH + '/gfx3_clear.png' });
};
