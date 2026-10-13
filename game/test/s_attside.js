// side views of guns carrying the Blender attachments: sv_<id>.png
module.exports = async p => {
  await p.evaluate(() => { const A = window.__A; A.startGame(); A.G.noRender = true; });
  const sets = JSON.parse(process.env.SETS || 'null') || {
    marc: { optic: 'acog4', muzzle: 'suppressor', underbarrel: 'vgrip', magazine: 'drum', stock: 'tacstock' },
    kv47: { optic: 'holo', muzzle: 'brake', underbarrel: 'agrip', magazine: 'drum' },
    talon: { optic: 'reddot', underbarrel: 'laser', muzzle: 'comp', stock: 'lightstock' },
    anvil: { optic: 'scope25', underbarrel: 'bipod', muzzle: 'brake' },
    hawkeye: { optic: 'scope10', muzzle: 'suppressor', underbarrel: 'bipod' },
    sentinel: { optic: 'scope6', muzzle: 'comp' },
    viper: { optic: 'reflex', muzzle: 'suppressor', underbarrel: 'agrip', stock: 'tacstock' },
    sidearm: { optic: 'reflex', muzzle: 'suppressor', magazine: 'pextmag', underbarrel: 'laser' },
    magnum: { optic: 'scope35', magazine: 'speedloader' },
    breacher: { muzzle: 'choke', magazine: 'tube', optic: 'holo' },
    rampart: { muzzle: 'spreader', magazine: 'speedload' },
  };
  const out = [];
  for (const id in sets) {
    const r = await p.evaluate(([id, s]) => {
      const A = window.__A, T = THREE, d = A.ARM[id]; A.ATTS[id] = {};
      const ok = {}; for (const k in s) { const a = A.attFor(d, k).find(x => x.id === s[k]); if (a) { A.ATTS[id][k] = s[k]; ok[k] = s[k]; } }
      const g = A.buildGunModel(d, true); g.traverse(o => { if (o.name === 'handR' || o.name === 'handL' || (o.userData && o.userData.hand)) o.visible = false; });
      A.attachVisuals(g, d, false, A.computeStats(d).len || g.userData.len, null);
      const sc = new T.Scene(); sc.environment = A.scene.environment; sc.background = new T.Color(0x9aa4ad);
      sc.add(new T.HemisphereLight(0xffffff, 0x444444, 1.6)); const L = new T.DirectionalLight(0xffffff, 2.5); L.position.set(2, 2, 1); sc.add(L);
      sc.add(g); g.updateMatrixWorld(true);
      g.userData.att.children.forEach(o => { if (o.geometry && o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.height > 2) o.visible = false; }); const bb = new T.Box3().setFromObject(g), c = bb.getCenter(new T.Vector3()), sz = bb.getSize(new T.Vector3());
      const W = 900, H = 420, half = Math.max(sz.z / 2 / (W / H), sz.y / 2) * 1.1;
      const cam = new T.OrthographicCamera(-half * W / H, half * W / H, half, -half, 0.01, 10); cam.position.set(c.x + 2, c.y, c.z); cam.lookAt(c);
      const rt = new T.WebGLRenderTarget(W, H); rt.texture.encoding = T.sRGBEncoding;
      A.renderer.setRenderTarget(rt); A.renderer.render(sc, cam); const buf = new Uint8Array(W * H * 4); A.renderer.readRenderTargetPixels(rt, 0, 0, W, H, buf); A.renderer.setRenderTarget(null);
      let cv = document.getElementById('svcv'); if (!cv) { cv = document.createElement('canvas'); cv.id = 'svcv'; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:9999'; document.body.appendChild(cv); }
      cv.width = W; cv.height = H; const ctx = cv.getContext('2d'), img = ctx.createImageData(W, H);
      for (let y = 0; y < H; y++) img.data.set(buf.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
      ctx.putImageData(img, 0, 0); ctx.fillStyle = '#000'; ctx.font = '16px monospace'; ctx.fillText(id + ' ' + JSON.stringify(ok), 8, 20);
      const names = []; g.userData.att.traverse(o => { if (o.name && o.name.startsWith('att_')) names.push(o.name); }); if (g.userData.mag) g.userData.mag.traverse(o => { if (o.name && o.name.startsWith('att_')) names.push(o.name); });
      rt.dispose(); return id + ': ' + names.join(',');
    }, [id, sets[id]]);
    out.push(r);
    await p.screenshot({ path: `sv_${id}.png`, clip: { x: 0, y: 0, width: 900, height: 420 } });
  }
  return out.join('\n');
};
