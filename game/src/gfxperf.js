/* ================================================================== GRAPHICS: measuring (1.2.113, the owner's optimisation list O1-O5)
   O1 THE BENCHMARK TOUR: Settings > VIDEO > RUN BENCHMARK TOUR runs the heavy-fight benchmark on 3 maps (12 s each) and
      gives a SCORE (average and 1% low together); the last 6 runs are kept (ashfall.bench.v1) so before/after is easy.
   O2 FRAME BREAKDOWN on the FRAME GRAPH: how many ms go to the game logic, the scene, the shadows, the gun and the post
      effects (CPU time spent asking the GPU to draw; the GPU's own time is O4).
   O3 COUNTERS: renderer.info used to be reset by every render pass, so the counts only showed the last pass (the post
      quad). Now it is reset once a frame and counts everything; SHOW FPS adds draw calls and triangles.
   O4 GPU TIME from EXT_disjoint_timer_query_webgl2 where the browser has it (the frame graph shows "gpu x ms").
   O5 AUTO, MEASURED: with GRAPHICS PRESET on AUTO, the first 40 s of real play are measured; under 40 FPS the preset
      steps down one tier (once per graphics card, then again after the next 40 s if still slow) and says so. */
const PF = { logic: 0, scene: 0, shadow: 0, vm: 0, post: 0, frame: 0, cur: null, t0: 0, gpu: 0, q: null, qs: [], ext: null, tried: false, auto: { t: 0, n: 0, done: false } };
const pfEma = (k, v) => { PF[k] = PF[k] * 0.9 + v * 0.1; };
/* ---------- O3: count the whole frame */
try { if (renderer.info) renderer.info.autoReset = false; } catch (e) {}
/* ---------- O2: time the parts */
const _pfTick = tick;
tick = function (dt) { const t = performance.now(); try { return _pfTick.apply(this, arguments); } finally { pfEma('logic', performance.now() - t); } };
const _pfRender = renderer.render.bind(renderer);
renderer.render = function (sc, cam) {
  const t = performance.now(), sh = PF.shadowAcc; const r = _pfRender(sc, cam), d = performance.now() - t;
  if (PF.cur) { if (sc === scene) PF.acc.scene += d - (PF.shadowAcc - sh); else if (typeof vmScene !== 'undefined' && sc === vmScene) PF.acc.vm += d; else PF.acc.post += d; }
  return r;
};
PF.shadowAcc = 0;
try { const sm = renderer.shadowMap, _smr = sm.render.bind(sm); sm.render = function () { const t = performance.now(); try { return _smr.apply(this, arguments); } finally { const d = performance.now() - t; PF.shadowAcc += d; if (PF.cur) PF.acc.shadow += d; } }; } catch (e) {}
const _pfFrame = renderFrame;
renderFrame = function () {
  try { if (renderer.info && renderer.info.reset) renderer.info.reset(); } catch (e) {}
  PF.cur = true; PF.acc = { scene: 0, shadow: 0, vm: 0, post: 0 }; const t = performance.now(); pfGpuBegin();
  try { return _pfFrame.apply(this, arguments); }
  finally { pfGpuEnd(); PF.cur = false; const tot = performance.now() - t; for (const k of ['scene', 'shadow', 'vm']) pfEma(k, PF.acc[k]); pfEma('post', Math.max(0, tot - PF.acc.scene - PF.acc.shadow - PF.acc.vm)); pfEma('frame', tot);
    try { const r = renderer.info.render; PF.calls = r.calls; PF.tris = r.triangles; } catch (e) {} }
};
/* ---------- O4: the GPU's own time */
function pfGpuBegin() {
  if (!PF.tried) { PF.tried = true; try { const gl = renderer.getContext(); PF.gl = gl; PF.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2'); } catch (e) { PF.ext = null; } }
  if (!PF.ext || PF.q || !PF.gl.createQuery) return; try { PF.q = PF.gl.createQuery(); PF.gl.beginQuery(PF.ext.TIME_ELAPSED_EXT, PF.q); } catch (e) { PF.ext = null; PF.q = null; }
}
function pfGpuEnd() {
  const gl = PF.gl; if (!PF.ext || !gl) return;
  if (PF.q) { try { gl.endQuery(PF.ext.TIME_ELAPSED_EXT); PF.qs.push(PF.q); } catch (e) {} PF.q = null; }
  while (PF.qs.length) { const q = PF.qs[0]; let ok = false; try { ok = gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE); } catch (e) { ok = true; }
    if (!ok) { if (PF.qs.length > 6) { gl.deleteQuery(PF.qs.shift()); continue; } break; }
    const bad = gl.getParameter(PF.ext.GPU_DISJOINT_EXT); if (!bad) pfEma('gpu', gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6); gl.deleteQuery(PF.qs.shift()); }
}
/* ---------- O2 + O4 on the frame graph */
const _pfGraph = perfFrame;
perfFrame = function (raw) {
  _pfGraph.apply(this, arguments); pfAuto(raw); if (!S.perfGraph || PG.acc !== 0) return; const c = $('perfGraph'); if (!c) return;
  if (c.height !== 156) { c.height = 156; }
  const g = c.getContext('2d'), W = c.width, y0 = 100; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 96, W, 60);
  const parts = [['logic', '#7fd16b'], ['scene', '#5ac8ff'], ['shadow', '#c070ff'], ['vm', '#ffd23a'], ['post', '#ff7a5a']], tot = Math.max(16.7, parts.reduce((s, [k]) => s + PF[k], 0));
  let x = 6; const bw = W - 12; for (const [k, col] of parts) { const w = PF[k] / tot * bw; g.fillStyle = col; g.fillRect(x, y0, Math.max(0, w), 8); x += w; }
  g.font = '9px monospace'; parts.forEach(([k, col], i) => { g.fillStyle = col; g.fillText(`${k} ${PF[k].toFixed(1)}`, 6 + (i % 3) * 78, y0 + 18 + Math.floor(i / 3) * 10); });
  g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText(`cpu ${(PF.logic + PF.frame).toFixed(1)} ms · gpu ${PF.ext ? PF.gpu.toFixed(1) + ' ms' : 'n/a'} · draws ${PF.calls | 0}`, 6, y0 + 40);
  g.fillText(`tris ${((PF.tris | 0) / 1000).toFixed(0)}k · geo ${renderer.info.memory.geometries} · tex ${renderer.info.memory.textures} · prog ${(renderer.info.programs || []).length}`, 6, y0 + 50);
};
// O3: SHOW FPS carries the counts
setInterval(() => { try { if (!S.showFps) return; const el = $('fps'); if (!el || !el.textContent) return; let x = $('fpsX'); if (!x) { x = document.createElement('small'); x.id = 'fpsX'; document.body.appendChild(x); } const rc = el.getBoundingClientRect(), cs = getComputedStyle(el); x.style.cssText = `position:fixed;left:${rc.left}px;top:${rc.bottom + 1}px;z-index:40;font:10px monospace;color:${cs.color};opacity:.85;pointer-events:none;display:${el.offsetParent ? 'block' : 'none'}`; x.textContent = `${PF.calls | 0} DRAWS · ${((PF.tris | 0) / 1e6).toFixed(2)}M TRIS${PF.ext ? ` · GPU ${PF.gpu.toFixed(1)} MS` : ''}`; } catch (e) {} }, 500);
/* ---------- O5: AUTO measures the first 40 s of play */
const PF_TIERS = ['low', 'medium', 'high', 'ultra'];
function pfAuto(raw) {
  const A = PF.auto; if (A.done || S.quality !== 'auto' || G.bench || G.noRender || G.state !== 'playing' || raw <= 0 || raw > 0.25) return;
  if (S.autoGpu === GPU_NAME && (S.autoSteps | 0) >= 2) { A.done = true; return; }
  A.t += raw; A.n++; if (A.t < 40) return; const fps = A.n / A.t; A.t = 0; A.n = 0;
  const i = PF_TIERS.indexOf(AUTO_TIER); if (S.autoGpu !== GPU_NAME) { S.autoGpu = GPU_NAME; S.autoSteps = 0; }
  if (fps < 40 && i > 0) { AUTO_TIER = PF_TIERS[i - 1]; S.autoTier = AUTO_TIER; S.autoSteps = (S.autoSteps | 0) + 1; applyPreset(AUTO_TIER); try { applyVideoSettings(); } catch (e) {} saveSettings(); try { toast2(`GRAPHICS SET TO ${AUTO_TIER.toUpperCase()} FOR A SMOOTHER GAME (${Math.round(fps)} FPS) · SETTINGS > VIDEO`); } catch (e) {} }
  else { A.done = true; S.autoSteps = 2; saveSettings(); }
}
if (S.quality === 'auto' && S.autoTier && S.autoGpu === GPU_NAME && PF_TIERS.includes(S.autoTier)) { AUTO_TIER = S.autoTier; }
/* ---------- O1: the 3-map tour, a score, the history */
const PFB = { tour: null };
const PFB_MAPS = [['ruins', 'ASH RUINS'], ['funfair', 'THE OLD FUN FAIR'], ['docks', 'THE DOCKS']];
const pfbScore = r => Math.round((r.avgFps * 0.6 + r.low1Fps * 0.4) * 100);
function pfbTour() { PFB.tour = { i: 0, res: [] }; BENCH_DUR = 12; BENCHX.map = PFB_MAPS[0][0]; startBench(); }
const _pfbFinish = finishBench;
finishBench = function () {
  const T = PFB.tour; if (!T) return _pfbFinish.apply(this, arguments);
  _pfbFinish.apply(this, arguments); const r = window.__benchResult; if (r) T.res.push(Object.assign({ map: PFB_MAPS[T.i][1] }, r));
  T.i++;
  if (T.i < PFB_MAPS.length) { BENCHX.map = PFB_MAPS[T.i][0]; setTimeout(() => { try { startBench(); } catch (e) { reportError(e); } }, 300); return; }
  PFB.tour = null; BENCH_DUR = 20; BENCHX.map = null; pfbShow(T.res);
};
function pfbShow(res) {
  if (!res.length) return; const avg = k => res.reduce((s, r) => s + r[k], 0) / res.length, all = { avgFps: +avg('avgFps').toFixed(1), low1Fps: +avg('low1Fps').toFixed(1) }, score = pfbScore(all);
  let hist = []; try { hist = JSON.parse(localStorage.getItem('ashfall.bench.v1') || '[]'); } catch (e) {}
  const prev = hist[0]; hist.unshift({ score, avg: all.avgFps, low: all.low1Fps, when: Date.now(), set: `${(S.quality === 'auto' ? 'AUTO ' + AUTO_TIER : S.quality).toUpperCase()} · SCALE ${S.renderScale}% · SHADOWS ${String(S.shadows).toUpperCase()}`, gpu: gpuName() }); hist = hist.slice(0, 6);
  try { localStorage.setItem('ashfall.bench.v1', JSON.stringify(hist)); } catch (e) {}
  window.__benchTour = { score, all, res };
  $('benchVerdict').textContent = `SCORE ${score.toLocaleString()}`; $('benchVerdict').className = 'bv ' + (all.avgFps >= 55 ? 'ok' : all.avgFps >= 40 ? 'mid' : 'bad');
  $('benchStats').innerHTML = res.map(r => `<div><span>${r.map}</span><b>${r.avgFps} FPS · 1% ${r.low1Fps} · ${r.drawCalls} DRAWS</b></div>`).join('') + `<div><span>ALL 3 MAPS</span><b>${all.avgFps} FPS AVERAGE · ${all.low1Fps} 1% LOW</b></div>` +
    (prev ? `<div><span>LAST RUN</span><b>${prev.score.toLocaleString()} (${score >= prev.score ? '+' : ''}${(score - prev.score).toLocaleString()}) · ${prev.set}</b></div>` : '') + `<div><span>GPU</span><b>${gpuName()}</b></div>`;
  $('benchTip').innerHTML = hist.length > 1 ? 'EARLIER RUNS: ' + hist.slice(1).map(h => `${h.score.toLocaleString()} (${h.set})`).join(' · ') : 'Run it again after changing a setting to compare.';
}
// the button: in the VIDEO settings next to RUN BENCHMARK, and on the results screen
(() => { try { const sec = SCHEMA.VIDEO || SCHEMA.GRAPHICS; const L = Object.values(SCHEMA).find(arr => Array.isArray(arr) && arr.some(it => it.act === 'bench')); if (L && !L.some(it => it.act === 'perf-tour')) { const i = L.findIndex(it => it.act === 'bench'); L.splice(i + 1, 0, { t: 'action', name: 'BENCHMARK TOUR', hint: 'The benchmark on 3 maps (about 40 s) with a SCORE you can compare after changing settings', label: 'RUN TOUR', act: 'perf-tour' }); } } catch (e) {}
  const b = document.querySelector('#bench .bbtns'); if (b && !b.querySelector('[data-act="perf-tour"]')) b.insertAdjacentHTML('afterbegin', '<button class="btn" data-act="perf-tour">RUN TOUR (3 MAPS)</button>'); })();
const _pfbAct = typeof perfAct === 'function' ? perfAct : null;
perfAct = function (act) { if (act === 'perf-tour') { pfbTour(); return true; } return _pfbAct ? _pfbAct.apply(this, arguments) : false; };
