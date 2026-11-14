/* ================================================================== GRAPHICS FIXES (1.2.116, the owner's report)
   - "the textures bug when I look around, fine when I stop": ULTRA+ had MOTION BLUR on, which smears the picture while
     you turn. It is off in ULTRA+ now (and switched off once for players on ULTRA+; it can still be turned on).
   - "the light is too bright on my gun, my camo glows way too much": the gun's own sun is softer, guns and camos take
     less from the sky reflection map (1.2.113 made it brighter), worn edges are subtler, and glowing camos/skins glow at
     about a third of the old strength (they were blooming to white).
   - The see-through gun is fixed in gfxpost.js (the depth effects no longer draw over the gun). */
if (typeof GP_PRESET !== 'undefined' && GP_PRESET.ultraplus) GP_PRESET.ultraplus.mblur = 'off';
try { if (!S.fix116) { S.fix116 = 1; if (qKey() === 'ultraplus' && S.mblur && S.mblur !== 'off') S.mblur = 'off'; saveSettings(); } } catch (e) {}
const GFX_FIX = { vmSun: 1.2, gunEnv: 0.6, camoEnv: 0.55, glow: 0.35 };
try { vmSun.intensity = GFX_FIX.vmSun; } catch (e) {}
// guns: less sky reflection (each material scaled once)
function gfxGunEnv(m) { if (!m || !m.isMeshStandardMaterial || m.userData.gfEnv) return; m.userData.gfEnv = 1; m.envMapIntensity = (m.envMapIntensity == null ? 1 : m.envMapIntensity) * (m.userData.cosm ? 1 : GFX_FIX.gunEnv); }
const _gfGun = gmPatchGun;
gmPatchGun = function () { const r = _gfGun.apply(this, arguments); try { for (const k in VM) if (!/glove|sleeve|skin|lens/.test(k)) gfxGunEnv(VM[k]); for (const g of gunObjs) g && g.traverse(o => { if (o.isMesh && !o.material.transparent) gfxGunEnv(o.material); }); } catch (e) {} return r; };
// camos and skins: softer reflections, a third of the glow
const _gfCosm = cosmMat;
cosmMat = function (id) {
  const had = !!COS_MAT[id], m = _gfCosm.apply(this, arguments); if (had || !m || m.userData.gfGlow) return m; m.userData.gfGlow = 1;
  m.envMapIntensity = GFX_FIX.camoEnv; m.userData.gfEnv = 1;
  if (m.emissiveMap) { m.emissiveIntensity *= GFX_FIX.glow; for (const a of COS_ANIM) if (a.mat === m) a.base *= GFX_FIX.glow; }
  return m;
};
/* ---------- STUTTER: shaders that used to compile in the middle of a fight
   - the gun's look (worn edges, grime) was put on by a 2-second timer, so its shaders compiled up to 2 s after you spawned or
     swapped guns; now it is done when the gun is made, and the gun's shaders are compiled right then (gfxWarmGun)
   - the live scope glass edited the lens material (a shader rebuild on every scope in and out): it swaps materials now (gfxchar.js)
   - explosion rings were made and thrown away (the shader was deleted and rebuilt every grenade): pooled now (gfxfx.js)
   - the final post shader was rebuilt when aiming, in menus and near heat shimmer: one shader now (gfxpost.js) */
function gfxWarmGun() {
  try { gmPatchGun(); } catch (e) {}
  try { const u = gunObjs && gunObjs[G.cur]; let lens = null; if (u && S.scopePip && typeof gcPipMat === 'function') u.traverse(o => { if (!lens && o.isMesh && o.material === VM.lens) lens = o; });
    if (lens) { lens.material = gcPipMat(); renderer.compile(vmScene, vmCamera); lens.material = VM.lens; }
    renderer.compile(vmScene, vmCamera); } catch (e) {}
}
// compiled inside the real scene: in three.js r128 even unlit materials carry the scene's light count and fog in their shader
function gfxWarmFx() {
  try { const t = scene; if (!GX.ringPool) GX.ringPool = []; if (!GX.ringPool.length) GX.ringPool.push(new THREE.Mesh(GX.ringGeo || (GX.ringGeo = new THREE.RingGeometry(0.6, 1.0, 40)), new THREE.MeshBasicMaterial({ color: 0xffe8c0, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false })));
    const m = GX.ringPool[0]; t.add(m); const g = new THREE.PlaneGeometry(1, 1), ex = []; if (typeof decals !== 'undefined' && decals.mats) for (const k in decals.mats) { const q = new THREE.Mesh(g, decals.mats[k]); t.add(q); ex.push(q); }
    renderer.compile(t, camera); t.remove(m); for (const q of ex) t.remove(q); g.dispose(); } catch (e) {}
}
const _gfEquip = equipClass;
equipClass = function () { const r = _gfEquip.apply(this, arguments); gfxWarmGun(); return r; };
const _gfSwitch = switchWeapon;
switchWeapon = function () { const r = _gfSwitch.apply(this, arguments); try { gmPatchGun(); } catch (e) {} return r; };
const _gfLoad = loadMap;
loadMap = function () { const r = _gfLoad.apply(this, arguments); if (r !== false) { gfxWarmGun(); gfxWarmFx(); } return r; };
