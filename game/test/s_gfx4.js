// GRAPHICS D + E in a match: bots up close (shading, rim, eyes, scarf), footprints on sand, an explosion ring, tracers, scope glass
module.exports = async p => { const r = {}; try { await run(p, r); } catch (e) { r.FAIL = String(e).slice(0, 400); } return r; };
const run = async (p, r) => {
  const SH = process.env.SHOTS || '/tmp', ev = (f, a) => p.evaluate(f, a);
  await ev(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); const A = window.__A; A.GA_GET().forceWx = ''; A.applyPreset('ultraplus'); A.S.quality = 'ultraplus'; A.applyVideoSettings(); A.startMatch('tdm', { map: 'dustwater' }); });
  await p.waitForTimeout(12000); await ev(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; for (const e of A.enemies) { e.acc = 0; e.dmg = 0; } }); await p.waitForTimeout(2500);
  await ev(() => { const A = window.__A; if (A.G.state === 'paused') { A.G.state = 'playing'; A.showScreen(null); } A.G.health = A.G.maxHp = 1e9; });
  // put two bots in front of the camera, standing
  await ev(() => { const A = window.__A, bots = A.enemies.filter(e => e.entry).slice(0, 3), fx = -Math.sin(A.P.yaw), fz = -Math.cos(A.P.yaw); bots.forEach((e, i) => { e.group.position.set(A.P.x + fx * (2.6 + i * 0.8) + (i - 1) * 0.9 * fz, A.P.y || 0, A.P.z + fz * (2.6 + i * 0.8) - (i - 1) * 0.9 * fx); e.group.rotation.y = A.P.yaw + (i - 1) * 0.6; e.speed = 0; e.frozen = true; }); A.P.pitch = -0.05; });
  await p.waitForTimeout(4000); await p.screenshot({ path: SH + '/gfx4_bots.png' });
  r.bots = await ev(() => { const A = window.__A, e = A.enemies.find(q => q.entry); return { eyes: !!e.gcEyes, tail: !!e.gcTail, patched: A.GC_GET().done.has(e.rig.torso.children.find(o => o.isMesh) ? e.rig.torso.children.find(o => o.isMesh).material : null) }; });
  // walk forward for prints, fire a few tracers, blow something up
  await ev(async () => { const A = window.__A; for (let i = 0; i < 12; i++) { A.P.x += 0.5; A.P.onGround = true; await new Promise(r => setTimeout(r, 120)); } const a = new A.THREE_V3(A.P.x, 1.5, A.P.z), b = new A.THREE_V3(A.P.x - 20, 1.4, A.P.z - 15); for (let i = 0; i < 4; i++) A.addTracerL(a, b.clone().add(new A.THREE_V3(i, 0, i))); A.explodeL({ x: A.P.x - Math.sin(A.P.yaw) * 9, y: 0.3, z: A.P.z - Math.cos(A.P.yaw) * 9 }, 'test', 0); A.P.pitch = -0.3; A.P.yaw += Math.PI; });
  await p.waitForTimeout(700); await p.screenshot({ path: SH + '/gfx4_fx.png' });
  r.fx = await ev(() => { const GX = window.__A.GX_GET(); return { prints: GX.prints ? GX.prints.count : 0, rings: GX.rings.length, trails: GX.trails.filter(t => t.on).length, blast: Math.round(GX.blast * 100) / 100 }; });
  await p.waitForTimeout(2000);
};
