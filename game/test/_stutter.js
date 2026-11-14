// STUTTER HUNT: a real match on ULTRA+ (turning, aiming, shooting, grenades, bots) with rendering on; every frame's time,
// and for slow frames what changed (new shader programs = compiles, new textures = uploads, new geometries)
module.exports = async p => {
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); });
  return p.evaluate(async () => { const A = window.__A, wait = ms => new Promise(r => setTimeout(r, ms)), Q = window.STQ || 'ultraplus';
    A.applyPreset(Q); A.S.quality = Q; A.renderer.setSize(800, 450, false); A.camera.aspect = 16 / 9; A.camera.updateProjectionMatrix();
    A.startGame(); A.G.breakT = 1e9; A.G.health = 1e9; A.G.noRender = true; await wait(200); A.G.noRender = false;
    const info = A.renderer.info, ft = [], ev = [], det = [], seen = new Set(info.programs || []); let prog = (info.programs || []).length, tex = info.memory.textures, geo = info.memory.geometries;
    for (let f = 0; f < (window.STN || 600); f++) { const t = f / 60;
      A.P.yaw += Math.sin(t * 1.3) * 0.05; A.P.pitch = Math.sin(t * 0.7) * 0.15; A.G.ads = (Math.floor(t / 1.5) % 2) ? 1 : 0; A.G.scoped = false;
      if (f % 7 === 0) { A.G.fireT = 0; try { A.shoot(false); } catch (e) {} } if (f % 150 === 75) try { A.throwGrenade(); } catch (e) {}
      A.G.state = 'playing'; const t0 = performance.now(); A.tickL(1 / 60); A.renderFrame(); const ms = performance.now() - t0; ft.push(ms); const PFv = A.PF_GET ? A.PF_GET() : {}; det.push({ calls: info.render.calls, tris: info.render.triangles, logic: +(PFv.logic || 0).toFixed(1), scene: +(PFv.scene || 0).toFixed(1), shadow: +(PFv.shadow || 0).toFixed(1), post: +(PFv.post || 0).toFixed(1), ads: A.G.ads, en: A.enemies.filter(e => e.group && e.group.visible).length, fx: (A.gunObjs || []).length });
      const p2 = (info.programs || []).length, t2 = info.memory.textures, g2 = info.memory.geometries; if (p2 !== prog || t2 !== tex) { const names = (info.programs || []).filter(q => !seen.has(q)).map(q => { const k = String(q.cacheKey).split(','); let best = null, bd = 1e9; for (const o of seen) { if (o.name !== q.name) continue; const k2 = String(o.cacheKey).split(','); let d = 0; const diffs = []; for (let i = 0; i < Math.max(k.length, k2.length); i++) if (k[i] !== k2[i]) { d++; diffs.push(i + ':' + k2[i] + '>' + k[i]); } if (d < bd) { bd = d; best = diffs.slice(0, 6).join(' '); } } return q.name + ' | ' + best; }); ev.push({ f, ms: Math.round(ms), prog: p2 - prog, tex: t2 - tex, names }); } for (const q of info.programs || []) seen.add(q); prog = p2; tex = t2; geo = g2; }
    const s = ft.slice().sort((a, b) => a - b), med = s[s.length >> 1], spikes = ft.map((ms, f) => [f, ms]).filter(x => x[1] > med * 2.5);
    return { frames: ft.length, medianMs: +med.toFixed(1), p99: +s[Math.floor(s.length * 0.99)].toFixed(1), max: +s[s.length - 1].toFixed(1), spikes: spikes.length, state: A.G.state, changes: ev.slice(0, 40), programs: (info.programs || []).length };
  });
};
