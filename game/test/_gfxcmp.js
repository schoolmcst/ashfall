// GRAPHICS: the same views with the old look (BLOOM & COLOUR HIGH) and with the new effects, plus rain, night vision and a menu blur
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', res = {}, ids = (process.env.MAPS || 'docks,funfair,town_night').split(','), sets = (process.env.SETS || 'old,new').split(',');
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); window.__A.G.noRender = true; });
  const CFG = { old: { post: 'high', ao: 'off', shafts: false, ssr: false, hfog: false, dof: false, mblur: 'off', lensFx: false, chroma: false, tone: 'classic' },
    new: { post: 'high', ao: 'high', shafts: true, ssr: true, hfog: true, dof: false, mblur: 'off', lensFx: true, chroma: false, tone: 'filmic' },
    ao: { post: 'high', ao: 'high', shafts: false, ssr: false, hfog: false, dof: false, mblur: 'off', lensFx: false, chroma: false, tone: 'classic' } };
  for (const id of ids) {
    const r = await p.evaluate(([id, sets, CFG, process_sky]) => { const A = window.__A; try { (A.loadMapL || A.loadMap)(id); A.S.dynLights = true; for (let i = 0; i < 3; i++) A.tickL(0.016); } catch (e) { return { err: String(e) }; }
      const vs = (A.MAPS[id].views || []).slice(); if (process_sky) vs.push([vs[0][0], vs[0][1], vs[0][2], vs[0][3] + 4, vs[0][4] + 18, vs[0][5] + 30]); const pick = [vs[0], vs[Math.min(vs.length - 1, 2)], process_sky ? vs[vs.length - 1] : null].filter(Boolean), shots = [], errs = [];
      A.renderer.setSize(960, 540, false); A.camera.aspect = 16 / 9; A.camera.updateProjectionMatrix();
      for (const v of pick) for (const k of sets) { Object.assign(A.S, CFG[k]); A.camera.position.set(v[0], v[1] + 0.3, v[2]); A.camera.lookAt(v[3], v[4], v[5]); A.camera.updateMatrixWorld();
        try { A.renderFrame(); A.renderFrame(); A.renderFrame(); } catch (e) { errs.push(String(e)); } shots.push([k, A.renderer.domElement.toDataURL('image/jpeg', 0.88)]); }
      return { shots, errs, failed: A.POST.failed, gp: A.GP_GET().failed, dep: !!(A.POST.rt && A.POST.rt.depthTexture) };
    }, [id, sets, CFG, !!process.env.SKY]);
    if (r.err) { res[id] = r.err; continue; }
    r.shots.forEach(([k, u], i) => fs.writeFileSync(path.join(out, `${id}_${Math.floor(i / sets.length)}_${k}.jpg`), Buffer.from(u.split(',')[1], 'base64')));
    res[id] = { n: r.shots.length, errs: r.errs, postFailed: r.failed, gpFailed: r.gp, depth: r.dep };
  }
  return res;
};
