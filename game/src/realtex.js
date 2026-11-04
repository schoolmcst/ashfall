/* ------------------------------------------------------------------ real scanned surfaces (Poly Haven, CC0)
   The procedural textures from tex.js load instantly and stay as the fallback. When the game can reach Poly Haven's
   download server (the app can; the claude.ai page and offline play cannot), the colour image of each surface is
   swapped for a photo-scanned one and a normal map + roughness map are added. Files are cached by the browser, so
   after the first launch they load from disk. Textures by polyhaven.com, CC0. */
const REALTEX_BASE = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/';
const REALTEX_SETS = {
  ground:   { id: 'brown_mud_leaves_01', d: 'diff', ns: 0.9 },
  asphalt:  { id: 'asphalt_02', d: 'diff', ns: 0.6 },
  concrete: { id: 'concrete_wall_008', d: 'diff', ns: 0.7 },
  brick:    { id: 'red_brick_03', d: 'diff', ns: 1.0 },
  wood:     { id: 'weathered_brown_planks', d: 'diff', ns: 0.8 },
  metal:    { id: 'rusty_metal_02', d: 'diff', ns: 0.6 },
  // surface families (1.2.66): grey = turned to greyscale at that brightness, so each material's own colour stays
  paintm:   { id: 'blue_metal_plate', d: 'diff', ns: 0.45, rm: 0.28, grey: 0.82 },     // painted steel: containers, hulls, ships
  steelp:   { id: 'metal_plate_02', d: 'diff', ns: 0.5, rm: 0.66, grey: 0.7 },         // bare steel panels, sheet metal
  plaster:  { id: 'painted_plaster_wall', d: 'diff', ns: 0.5, rm: 0.92, grey: 0.9 },   // painted indoor and outdoor walls
  tile:     { id: 'floor_tiles_02', d: 'diff', ns: 0.6, rm: 0.38, grey: 0.85 },        // tiled floors
  fabric:   { id: 'velour_velvet', d: 'diff', ns: 0.7, rm: 0.73, grey: 0.85 },         // carpet, velvet, felt, cloth
  planks:   { id: 'wood_floor_deck', d: 'diff', ns: 0.8, rm: 0.44 },                   // clean deck and floor boards
};
// a photo as greyscale with its average brightness at L (the tint of the material decides the colour)
function realTexGrey(img, L) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data; let sum = 0;
  for (let i = 0; i < p.length; i += 4) { const y = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; p[i] = y; sum += y; }
  const k = (L * 255) / Math.max(1, sum / (p.length / 4));
  for (let i = 0; i < p.length; i += 4) { const y = Math.min(255, p[i] * k); p[i] = p[i + 1] = p[i + 2] = y; }
  g.putImageData(d, 0, 0); return c;
}
const REALTEX = { loaded: {}, applied: false, failed: 0, pending: 0 };
function realTexLoad(url) {
  return new Promise((res, rej) => {
    const im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
    const to = setTimeout(() => { im.src = ''; rej(new Error('timeout')); }, 45000);
    im.onload = () => { clearTimeout(to); res(im); }; im.onerror = () => { clearTimeout(to); rej(new Error('load')); };
    im.src = url;
  });
}
function realTexStart() {
  if ((typeof S !== 'undefined' && S.realTex === false) || window.NO_REALTEX) return;
  if (typeof location !== 'undefined' && /^#(bench|look)/.test(location.hash || '') && !/realtex/.test(location.hash)) return;  // keep test views deterministic
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  for (const key in REALTEX_SETS) {
    const s = REALTEX_SETS[key], f = m => REALTEX_BASE + s.id + '/' + s.id + '_' + m + '_1k.jpg';
    REALTEX.pending++;
    Promise.all([realTexLoad(f(s.d)), realTexLoad(f('nor_gl')), realTexLoad(f('rough'))])
      .then(([d, n, r]) => { REALTEX.loaded[key] = { d: s.grey ? realTexGrey(d, s.grey) : d, n, r }; })
      .catch(() => { REALTEX.failed++; })
      .finally(() => { REALTEX.pending--; });
  }
}
// make a texture that shares wrap/anisotropy settings with the procedural one it replaces
function realTexFrom(img, like, srgb) {
  const t = new THREE.Texture(img);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = like.anisotropy;
  t.repeat.copy(like.repeat); if (srgb) t.encoding = THREE.sRGBEncoding;
  t.needsUpdate = true; return t;
}
// Called from the main loop; swaps surfaces in once everything is downloaded, but never mid-match (adding maps
// recompiles shaders, which would hitch).
// A family made later (the painted-steel set is made with the first map) is swapped in on a later tick.
function realTexTick() {
  if (REALTEX.applied || REALTEX.pending > 0 || typeof G === 'undefined' || G.state === 'playing') return;
  REALTEX.done = REALTEX.done || new Set();
  const keys = Object.keys(REALTEX.loaded).filter(k => !REALTEX.done.has(k) && TEX[k] && TEX[k].map);
  if (Object.keys(REALTEX.loaded).every(k => REALTEX.done.has(k))) { REALTEX.applied = true; return; }
  if (!keys.length) return;
  for (const k of keys) REALTEX.done.add(k);
  const byMap = REALTEX.byMap || new Map();   // procedural colour texture -> { normal, rough, ns }
  // gun furniture and sleeves borrow the wood/concrete patterns as fine grain; planks and walls would look wrong there,
  // so they keep their own copy of the procedural texture
  try { for (const k in VM) { const m = VM[k]; if (!m || !m.map) continue; for (const key of keys) if (TEX[key] && m.map === TEX[key].map) { const c = m.map.clone(); c.needsUpdate = true; m.map = c; } } } catch (e) {}
  for (const key of keys) {
    const L = REALTEX.loaded[key], set = TEX[key]; if (!set || !set.map) continue;
    const old = set.map;
    old.image = L.d; old.needsUpdate = true;      // every material sharing this texture updates at once
    byMap.set(old, { normal: realTexFrom(L.n, old, false), rough: realTexFrom(L.r, old, false), ns: REALTEX_SETS[key].ns, rm: REALTEX_SETS[key].rm, grey: !!REALTEX_SETS[key].grey });
  }
  REALTEX.byMap = byMap;
  realTexRepatch();
  REALTEX.count = REALTEX.done.size;
}
// add the normal / roughness maps to every material that uses a swapped texture (again after each map load)
function realTexRepatch() {
  const byMap = REALTEX.byMap; if (!byMap) return;
  const seen = new Set();
  const patch = m => {
    if (!m || !m.isMeshStandardMaterial || seen.has(m)) return; seen.add(m);
    const e = byMap.get(m.map); if (!e || m.userData.realTex) return; m.userData.realTex = true;
    m.normalMap = e.normal; m.normalScale = new THREE.Vector2(e.ns, e.ns); m.bumpMap = null;
    // families with rm: the roughness photo is scaled so its average matches the material's own roughness (a glossy
    // scan no longer turns a painted wall into a wet one); older sets keep their tuning
    m.roughnessMap = e.rough; m.roughness = e.rm ? Math.min(3, m.roughness / e.rm) : Math.min(1, m.roughness * 1.15);
    if (!e.grey) m.color.lerp(new THREE.Color(1, 1, 1), 0.35);   // colour photos carry their own colour; soften the old tints (greyscale ones keep it)
    m.needsUpdate = true;
  };
  const walk = o => { if (!o) return; if (o.isMaterial) patch(o); else if (Array.isArray(o) || Object.getPrototypeOf(o) === Object.prototype) for (const k in o) walk(o[k]); };
  try { walk(MAT); } catch (e) {}
  try { scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(patch); }); } catch (e) {}
}
