/* ================================================================== benchmark: a scripted heavy fight that measures this machine */
// Runs on its own (no input needed): 12+ soldiers, constant fire, ragdolls, explosions, a slow 360° pan.
// Dynamic resolution is held off during the run so the numbers reflect the chosen settings.
const BENCH_WARM = 2, BENCH_DUR = 20;
function startBench() {
  initAudio(); clearMenuSoldiers(); clearMatch(); resetGame();
  G.bench = { t: 0, skipped: 0, dts: [], calls: 0, tris: 0, maxCalls: 0, n: 0, killT: 3, boomT: 7, dynRes: S.dynRes };
  S.dynRes = false; applyPR();
  G.state = 'playing'; showScreen(null); mouseDown = true;
  if (renderer.info) renderer.info.autoReset = false;
  for (let i = 0; i < 12; i++) spawnEnemy();
  showBanner('BENCHMARK', `${BENCH_DUR} SECONDS · HANDS OFF`);
}
function endBenchState() {
  const b = G.bench; if (!b) return null;
  G.bench = null; mouseDown = false; S.dynRes = b.dynRes; applyPR();
  if (renderer.info) renderer.info.autoReset = true;
  return b;
}
// called by the frame loop before tick (raw = real seconds since the last frame)
function benchPre(raw) {
  const b = G.bench; if (!b || G.state !== 'playing') return;
  if (renderer.info && renderer.info.reset) renderer.info.reset();
  b.t += raw; G.health = 100; G.score = 0;
  const w = WEAPONS[G.cur]; w.ammo = w.magSize; G.reloading = false;
  P.yaw += raw * 0.33; P.pitch = -0.04;
  if (b.t >= b.killT) {       // keep bodies falling: kill three, top the squad back up
    b.killT += 3;
    for (let k = 0; k < 3 && enemies.length; k++) { const e = enemies[(Math.random() * enemies.length) | 0]; damageEnemy(e, 1e6, k === 0, _v.set(Math.sin(P.yaw), 0.1, Math.cos(P.yaw)).negate(), k === 2); }
    while (enemies.length < 12) spawnEnemy();
  }
  if (b.t >= b.boomT) {       // an explosion every 7 s near the squad
    b.boomT += 7; const e = enemies[0];
    if (e) explode({ x: e.group.position.x + 1, y: 0.5, z: e.group.position.z }, 'bench', 6);
  }
  // frames while the page is hidden or after a long stall (tab switch, window covered) are not the game's speed
  const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  if (b.t > BENCH_WARM) { if (hidden || raw > 0.5) b.skipped++; else b.dts.push(raw); }
}
function benchPost() {
  const b = G.bench; if (!b || G.state !== 'playing') return;
  if (b.t > BENCH_WARM && renderer.info && renderer.info.render) {
    const r = renderer.info.render; b.calls += r.calls; b.tris += r.triangles; b.n++; b.maxCalls = Math.max(b.maxCalls, r.calls);
  }
  if (b.t >= BENCH_WARM + BENCH_DUR) finishBench();
}
function gpuName() {
  try {
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).replace(/^ANGLE \((.*)\)$/, '$1');
  } catch (e) { return 'unknown'; }
}
function finishBench() {
  const b = endBenchState(); if (!b) return;
  if (b.dts.length < 60) {   // the page was hidden the whole time: nothing honest to report
    $('benchVerdict').textContent = 'NO DATA'; $('benchVerdict').className = 'bv mid';
    $('benchStats').innerHTML = `<div><span>FRAMES MEASURED</span><b>${b.dts.length}</b></div><div><span>FRAMES SKIPPED (HIDDEN / STALLED)</span><b>${b.skipped}</b></div><div><span>GPU</span><b>${gpuName()}</b></div>`;
    $('benchTip').textContent = 'The game window was hidden or minimised, so the browser throttled it. Run it again with the game visible.';
    clearWorldState(); G.state = 'benchdone'; G.score = 0; showScreen('bench'); return;
  }
  const d = b.dts.slice().sort((x, y) => x - y), n = d.length || 1, sum = d.reduce((s, x) => s + x, 0) || 1;
  const avg = n / sum, worst = d.slice(Math.floor(n * 0.99)), low1 = worst.length / (worst.reduce((s, x) => s + x, 0) || 1);
  const median = 1 / (d[Math.floor(n / 2)] || 1), p95 = d[Math.floor(n * 0.95)] * 1000, max = d[n - 1] * 1000, under30 = d.filter(x => x > 1 / 30).length / n * 100;
  const cv = renderer.domElement;
  const res = {
    avgFps: +avg.toFixed(1), medianFps: +median.toFixed(1), skipped: b.skipped, low1Fps: +low1.toFixed(1), p95ms: +p95.toFixed(1), maxMs: +max.toFixed(1), slowFramesPct: +under30.toFixed(1),
    frames: n, drawCalls: b.n ? Math.round(b.calls / b.n) : 0, maxDrawCalls: b.maxCalls, triangles: b.n ? Math.round(b.tris / b.n) : 0,
    resolution: `${cv.width}×${cv.height}`, preset: S.quality === 'auto' ? 'auto (' + qKey() + ')' : S.quality, shadows: S.shadows, renderScale: S.renderScale, gpu: gpuName(),
  };
  window.__benchResult = res; try { console.log('ASHFALL BENCHMARK', JSON.stringify(res)); } catch (e) {}
  const verdict = avg >= 55 ? ['SMOOTH', 'ok'] : avg >= 40 ? ['PLAYABLE', 'mid'] : ['SLOW', 'bad'];
  let tip = '';
  if (avg < 55) tip = S.shadows === 'high' ? 'Try SHADOWS: LOW or the MEDIUM preset, and leave DYNAMIC RESOLUTION on.' : S.renderScale > 80 ? 'Try a lower RENDER SCALE or the LOW preset.' : 'Close other tabs and apps that use the GPU, and check the browser is using hardware acceleration.';
  $('benchVerdict').textContent = verdict[0]; $('benchVerdict').className = 'bv ' + verdict[1];
  $('benchStats').innerHTML = [
    ['AVERAGE', res.avgFps + ' FPS'], ['MEDIAN', res.medianFps + ' FPS'], ['1% LOW', res.low1Fps + ' FPS'], ['95% OF FRAMES UNDER', res.p95ms + ' MS'], ['WORST FRAME', res.maxMs + ' MS'],
    ['FRAMES BELOW 30 FPS', res.slowFramesPct + '%'], ['DRAW CALLS / FRAME', res.drawCalls + ' (MAX ' + res.maxDrawCalls + ')'], ['TRIANGLES / FRAME', res.triangles.toLocaleString()],
    ['RESOLUTION', res.resolution], ['SETTINGS', `${res.preset.toUpperCase()} · SHADOWS ${res.shadows.toUpperCase()} · SCALE ${res.renderScale}%`], ['GPU', res.gpu],
  ].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  if (b.skipped > 30) tip = `The window was hidden or stalled for ${b.skipped} frames; those were left out. Keep the game visible while it runs. ` + tip;
  $('benchTip').textContent = tip;
  clearWorldState(); G.state = 'benchdone'; G.score = 0; showScreen('bench');
}
