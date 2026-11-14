/* ================================================================== OPTIMISATION: shaders, memory, CPU, the app (1.2.114, the owner's list O21-O60)
   SHADERS AND POST
   O21 the depth effects already run at half size (shafts at quarter size) - gfxpost.js. O26 effects that are off are
       compiled out (shader defines) - gfxpost.js.
   O23 LOW and MEDIUM skip the extra surface work (close-up detail, deeper brick, soldier shading); rain and snow stay.
   O24 SHADER WARM-UP: every material on a new map is compiled while the map loads (renderer.compile), not the first
       time it comes on screen in a fight.
   O25 the blur, light-shaft and depth-of-field passes run at medium precision.
   O28 SHARPEN that follows the resolution: the lower RENDER SCALE / DYNAMIC RESOLUTION go, the more sharpening.
   O30 SCOPES: while scoped in, occlusion and reflections are skipped (they are hidden by the scope anyway).
   O22 (merging passes), O27 (dynamic resolution was already adaptive), O29 (SMAA) were left as they are.
   MEMORY
   O35 the grime decals' textures and materials are freed with the map; O37 their textures are drawn once and reused.
   O36 MEMORY in Settings > VIDEO: geometries, textures, shader programs and an estimate of texture memory.
   O32/O34 every texture already uses mipmaps (smaller copies far away). O31 (compressed textures) and O33 (an atlas)
       need tools and an app update; O38 left as is.
   CPU
   O46 SOUND VOICES: at most 32 synthesized sounds at once; extra ones are dropped (no pile-ups in big fights).
   O47 characters off screen (and more than 8 m away) skip their animation; O48 far zombies and burnouts animate every
       3rd frame like far soldiers (optdraw.js).
   O39-O45 and O49: bot thinking (about 1 ms a frame for 10 bots here), the flow-field cache, the collision grid, HUD
       updates only on change and pooled effects were already there. O50 (online packets) left as is: it can't be tested
       against the real match service from here.
   THE APP
   O58 WINDOW NOT FOCUSED: menus draw at 15 FPS and a match at 30 FPS while the game window isn't focused.
   O59 SLOW-PART WARNINGS: after a minute of play, if shadows, effects or the GPU cost a lot, a hint says what to change
       (once per session).
   O60 LOW+ preset: the lightest settings, below LOW, for very weak PCs.
   O56 GRAPHICS CARD TO USE was already a setting. O51-O55 and O57 left as they are (map loads measure 0.1-1 s here;
       app flags would need a new app download). */
const OM = { voices: [], told: {}, playT: 0 };
const omLite = () => /^(low|lowplus|medium)$/.test(qKey()) || S.perfMode;
/* ---------- O60: LOW+ */
Object.assign(QUALITY, { lowplus: { scale: 55, shadows: 'off', fx: 'low', grass: 0, anis: 1, grain: false, tex: 256, prCap: 1, post: 'off' } });
if (typeof GP_PRESET !== 'undefined') GP_PRESET.lowplus = Object.assign({}, GP_PRESET.low);
const _omPreset = applyPreset; applyPreset = function (k) { const r = _omPreset.apply(this, arguments); if (k === 'lowplus') { S.dynLights = false; S.scopePip = false; S.shakeFx = true; } return r; };
(() => { try { const qi = SCHEMA.VIDEO.find(it => it.k === 'quality'); if (qi && !qi.opts.some(o => o[0] === 'lowplus')) qi.opts.splice(qi.opts.findIndex(o => o[0] === 'low'), 0, ['lowplus', 'LOW+']); } catch (e) {} })();
/* ---------- O23: lighter patches on LOW / MEDIUM */
const _omGm = gmPatch; gmPatch = function (mat, kind, key) { if (omLite() && kind !== 'map') return; return _omGm.apply(this, arguments); };
const _omGc = gcPatch; gcPatch = function () { if (omLite()) return; return _omGc.apply(this, arguments); };
/* ---------- O24: compile the map's shaders while it loads */
const _omLoad = loadMap;
loadMap = function () { const r = _omLoad.apply(this, arguments); if (r !== false) try { const t = performance.now(); gmPatchMap(); renderer.compile(scene, camera); if (typeof OD !== 'undefined') OD.lt.compile = Math.round(performance.now() - t); } catch (e) {} return r; };
/* ---------- O25 */
(() => { try { const M = gpMats(); for (const k of ['blur', 'shr', 'shm', 'dof']) { M[k].precision = 'mediump'; M[k].needsUpdate = true; } } catch (e) {} })();
/* ---------- O28 + O30 in the post pass */
const _omPF = postFrame;
postFrame = function () {
  const ao = S.ao, ssr = S.ssr; if (G.scoped) { S.ao = 'off'; S.ssr = false; }
  try { return _omPF.apply(this, arguments); } finally { S.ao = ao; S.ssr = ssr; }
};
GP.onFinal = f => { const eff = (S.renderScale || 100) / 100 * (S.dynRes && typeof DR !== 'undefined' ? DR.scale : 1); if (S.post && S.post !== 'off') f.sharp.value = Math.min(0.6, (S.post === 'high' ? 0.22 : 0.1) + Math.max(0, 1 - eff) * 0.6); };
/* ---------- O35 + O37: decal textures */
const OM_TEX = {};
const _omDecTex = gmDecalTex; gmDecalTex = function (kind) { return OM_TEX[kind] || (OM_TEX[kind] = _omDecTex.apply(this, arguments)); };
const _omDecals = gmDecals; gmDecals = function () { for (const m of GM.decals) { if (m.material) m.material.dispose(); } return _omDecals.apply(this, arguments); };
/* ---------- O36: memory in the settings */
function omMem() { const m = renderer.info.memory; let tex = 0; try { scene.traverse(o => { const mt = o.material; if (!mt || Array.isArray(mt)) return; for (const k of ['map', 'bumpMap', 'normalMap', 'roughnessMap', 'emissiveMap']) { const t = mt[k]; if (t && t.image && !t.omC) { t.omC = 1; tex += (t.image.width || 0) * (t.image.height || 0) * 4 * 1.33; } } }); scene.traverse(o => { const mt = o.material; if (!mt || Array.isArray(mt)) return; for (const k of ['map', 'bumpMap', 'normalMap', 'roughnessMap', 'emissiveMap']) if (mt[k]) mt[k].omC = 0; }); } catch (e) {}
  return `${m.geometries} meshes · ${m.textures} textures (~${Math.round(tex / 1048576)} MB) · ${(renderer.info.programs || []).length} shaders`; }
(() => { try { const V = SCHEMA.VIDEO; if (!V.some(it => it.name === 'MEMORY')) V.splice(V.findIndex(it => it.k === 'quality') + 1, 0, { t: 'info', small: true, name: 'MEMORY', hint: 'What the current map uses on the graphics card', val: () => omMem() }); } catch (e) {} })();
/* ---------- O46: a voice cap for the synthesized sounds */
for (const nm of ['tone', 'burst']) { const f = nm === 'tone' ? tone : burst, w = function () { const now = performance.now(); OM.voices = OM.voices.filter(t => t > now); if (OM.voices.length >= 32) return; const dur = (nm === 'tone' ? arguments[1] : arguments[0]) || 0.2; OM.voices.push(now + dur * 1000 + 30); return f.apply(this, arguments); }; if (nm === 'tone') tone = w; else burst = w; }
/* ---------- O47 + O48: off screen and far characters */
const _omFr = new THREE.Frustum(), _omM = new THREE.Matrix4(), _omS = new THREE.Sphere();
let omFrT = -1;
function omVisible(e) { if (omFrT !== OD.frame) { omFrT = OD.frame; _omM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _omFr.setFromProjectionMatrix(_omM); } const g = e.group.position; _omS.center.set(g.x, g.y + 1, g.z); _omS.radius = 1.4; return _omFr.intersectsSphere(_omS); }
const _omAnim = animEnemy;
animEnemy = function (e, dt) { if (!G.noRender && e.group && !omVisible(e) && Math.hypot(e.group.position.x - camera.position.x, e.group.position.z - camera.position.z) > 8) { e.omDt = (e.omDt || 0) + dt; return; } if (e.omDt) { arguments[1] = dt + Math.min(0.2, e.omDt); e.omDt = 0; } return _omAnim.apply(this, arguments); };
const _omZ = animZombie;
animZombie = function (e, dt) { if (!G.noRender && e.group) { const d = Math.hypot(e.group.position.x - camera.position.x, e.group.position.z - camera.position.z); if ((d > 8 && !omVisible(e)) || d > 40) { e.omDt = (e.omDt || 0) + dt; e.omN = (e.omN || 0) + 1; if (d <= 40 || e.omN % 3) return; arguments[1] = Math.min(0.2, e.omDt); e.omDt = 0; } } return _omZ.apply(this, arguments); };
/* ---------- O58: not focused */
const _omFrame = frame;
frame = function (now) { if (typeof document !== 'undefined' && !document.hasFocus() && !G.bench && !G.noRender && !navigator.webdriver) { const cap = G.state === 'playing' ? 30 : 15; if (now - (OM.lastF || 0) < 1000 / cap - 1) { requestAnimationFrame(frame); return; } OM.lastF = now; } return _omFrame.apply(this, arguments); };
/* ---------- O59: tell the player what's slow */
function omWarn(dt) {
  if (G.state !== 'playing' || G.bench || G.noRender || typeof PF === 'undefined') { OM.playT = 0; return; } OM.playT += dt; if (OM.playT < 60) return; OM.playT = 0;
  const fps = PG.n ? 1000 / (Array.from(PG.t).slice(0, PG.n).reduce((a, b) => a + b, 0) / PG.n) : 60; if (fps > 50) return;
  const say = (k, t) => { if (OM.told[k]) return false; OM.told[k] = true; try { toast2(t); } catch (e) {} return true; };
  if (PF.shadow > 5 && say('sh', `SHADOWS COST ABOUT ${PF.shadow.toFixed(0)} MS A FRAME · TRY SHADOW QUALITY LOW (SETTINGS > VIDEO)`)) return;
  if (PF.ext && PF.gpu > 22 && (S.ao !== 'off' || S.ssr) && say('fx', 'THE DEPTH EFFECTS ARE HEAVY ON THIS GPU · TRY AMBIENT OCCLUSION LOW AND REFLECTIONS OFF')) return;
  if (PF.ext && PF.gpu > 22 && S.renderScale > 80 && say('rs', 'YOUR GPU IS THE BOTTLENECK · TRY RENDER SCALE 80% WITH DYNAMIC RESOLUTION ON')) return;
  if (PF.logic > 8 && say('cpu', 'THE GAME LOGIC IS SLOW ON THIS CPU · CLOSE OTHER APPS OR PLAY WITH FEWER BOTS')) return;
}
const _omTick = tick;
tick = function (dt) { const r = _omTick.apply(this, arguments); try { omWarn(dt); } catch (e) {} return r; };
