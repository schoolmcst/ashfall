// RAY TRACING stand-ins: the same views with 1.2.113's ULTRA (new), + bounce light and ray-traced shadows (rt), the upscaler (up),
// and the ray-traced photo mode after 64 frames (photo)
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', res = {}, ids = (process.env.MAPS || 'docks,funfair,stashisle').split(','), sets = (process.env.SETS || 'new,rt,up,photo').split(',');
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); window.__A.G.noRender = true; });
  const base = { post: 'high', ao: 'high', shafts: true, ssr: true, hfog: true, dof: false, mblur: 'off', lensFx: true, chroma: false, tone: 'filmic', dynLights: true, upscale: 'off', ssgi: false, rtShadows: false };
  const CFG = { new: base, rt: Object.assign({}, base, { ssgi: true, rtShadows: true }), gi: Object.assign({}, base, { ssgi: true }), rts: Object.assign({}, base, { rtShadows: true }),
    up: Object.assign({}, base, { upscale: 'performance' }), upq: Object.assign({}, base, { upscale: 'quality' }), half: Object.assign({}, base, { renderScale: 50 }), photo: Object.assign({}, base, { ssgi: true, rtShadows: true }) };
  for (const id of ids) {
    const r = await p.evaluate(([id, sets, CFG]) => { const A = window.__A; try { A.loadMapL(id); for (let i = 0; i < 3; i++) A.tickL(0.016); } catch (e) { return { err: String(e) }; }
      const vs = (A.MAPS[id].views || []).slice(), pick = [vs[0], vs[Math.min(vs.length - 1, 2)]], shots = [], errs = [], ms = {}; const GR = A.GR_GET();
      A.renderer.setSize(960, 540, false); A.camera.aspect = 16 / 9; A.camera.updateProjectionMatrix();
      for (const v of pick) for (const k of sets) { A.S.renderScale = 100; Object.assign(A.S, CFG[k]); GR.photo = k === 'photo'; A.camera.position.set(v[0], v[1] + 0.3, v[2]); A.camera.lookAt(v[3], v[4], v[5]); A.camera.updateMatrixWorld();
        const n = k === 'photo' ? 64 : 4; try { const t = performance.now(); for (let i = 0; i < n; i++) A.renderFrame(); ms[k] = ((ms[k] || 0) + (performance.now() - t) / n / pick.length); } catch (e) { errs.push(String(e)); } shots.push([k, A.renderer.domElement.toDataURL('image/jpeg', 0.9)]); }
      GR.photo = false; const gl = A.renderer.getContext(), e = gl.getError();
      return { shots, errs, failed: A.POST.failed, gp: A.GP_GET().failed, glErr: e, boxes: GR.grid && GR.grid.n, ms: Object.fromEntries(Object.entries(ms).map(([k, v]) => [k, Math.round(v)])) };
    }, [id, sets, CFG]);
    if (r.err) { res[id] = r.err; continue; }
    r.shots.forEach(([k, u], i) => fs.writeFileSync(path.join(out, `${id}_${Math.floor(i / sets.length)}_${k}.jpg`), Buffer.from(u.split(',')[1], 'base64')));
    delete r.shots; res[id] = r;
  }
  return res;
};
