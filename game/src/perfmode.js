/* ================================================================== PERFORMANCE MODE and the frame graph
   PERFORMANCE MODE is one switch for slow computers (base MacBooks, laptops with built-in graphics): lower render scale,
   no shadows, few effects, no grass, no ragdolls, a cheaper gun shader and fewer lamps in zombies. Turning it off puts
   back exactly what you had. FRAME GRAPH shows the last few seconds of frame times with FPS, the slowest frames and
   the draw calls, so a slow spot can be pointed at. After 20 s under 35 FPS in a match, the game suggests the mode once. */
const PERF_SET = { quality: 'custom', renderScale: 65, shadows: 'off', fxQ: 'low', grass: 0, anis: 1, grain: false, gunShader: false, ragdoll: false, dynRes: true, shadowDist: 50 };
function perfModeSet(on) {
  if (!!S.perfMode === !!on) return;
  if (on) { S.perfSaved = {}; for (const k in PERF_SET) S.perfSaved[k] = S[k]; Object.assign(S, PERF_SET); S.perfMode = true; }
  else { if (S.perfSaved) Object.assign(S, S.perfSaved); S.perfSaved = null; S.perfMode = false; }
  try { applyVideoSettings(); } catch (e) {} saveSettings();
  try { if (typeof ZLP !== 'undefined' && ZLP.on) { zlpStop(); zlpStart(); } } catch (e) {}
  try { if (curScreen === 'settings') renderSettings(); } catch (e) {}
  perfBtn();
}
const zlPoolSize = () => S.perfMode ? 4 : ZL_POOL;
function perfBtn() { const b = $('perfBtn'); if (b) b.textContent = 'PERFORMANCE MODE: ' + (S.perfMode ? 'ON' : 'OFF'); }

/* ---------- the frame graph */
const PG = { t: new Float32Array(180), i: 0, n: 0, acc: 0, low: { t: 0, n: 0, told: false } };
function perfFrame(raw) {
  if (raw <= 0 || raw > 1) return;
  PG.t[PG.i] = raw * 1000; PG.i = (PG.i + 1) % PG.t.length; PG.n = Math.min(PG.n + 1, PG.t.length);
  // a gentle hint for slow machines: 20 s of play under 35 FPS
  if (!S.perfMode && !PG.low.told && G.state === 'playing' && !G.bench && !G.noRender) {
    PG.low.t += raw; PG.low.n++;
    if (PG.low.t >= 20) { const fps = PG.low.n / PG.low.t; PG.low.t = 0; PG.low.n = 0; if (fps < 35) { PG.low.told = true; try { toast2('LOW FRAME RATE · TRY PERFORMANCE MODE (PAUSE MENU OR SETTINGS > VIDEO)'); } catch (e) {} } }
  }
  if (!S.perfGraph) { const c = $('perfGraph'); if (c && c.style.display !== 'none') c.style.display = 'none'; return; }
  if ((PG.acc += raw) < 0.1) return; PG.acc = 0;
  let c = $('perfGraph');
  if (!c) { c = document.createElement('canvas'); c.id = 'perfGraph'; c.width = 240; c.height = 96; document.body.appendChild(c); }
  c.style.display = 'block';
  const g = c.getContext('2d'), W = 240, H = 96, top = 40, gh = H - top - 4, maxMs = 50;
  g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, W, H);
  const vals = []; for (let k = 0; k < PG.n; k++) vals.push(PG.t[(PG.i - PG.n + k + PG.t.length) % PG.t.length]);
  const avg = vals.reduce((s, v) => s + v, 0) / (vals.length || 1), sorted = vals.slice().sort((a, b) => b - a), worst = sorted[Math.floor(sorted.length * 0.01)] || 0;
  const Y = ms => top + gh - Math.min(1, ms / maxMs) * gh;
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.font = '9px monospace'; g.fillStyle = 'rgba(255,255,255,.5)';
  for (const [ms, lab] of [[16.7, '60'], [33.3, '30']]) { g.beginPath(); g.moveTo(0, Y(ms) + 0.5); g.lineTo(W, Y(ms) + 0.5); g.stroke(); g.fillText(lab, W - 14, Y(ms) - 2); }
  const bw = W / PG.t.length;
  vals.forEach((v, k) => { g.fillStyle = v > 33.3 ? '#ff5a4a' : v > 18 ? '#ffd23a' : '#7fd16b'; g.fillRect(k * bw, Y(v), Math.max(1, bw - 0.3), top + gh - Y(v)); });
  const inf = renderer.info && renderer.info.render ? renderer.info.render : {};
  g.font = 'bold 13px monospace'; g.fillStyle = '#fff'; g.fillText(`${Math.round(1000 / (avg || 16.7))} FPS`, 6, 15);
  g.font = '10px monospace'; g.fillStyle = 'rgba(255,255,255,.8)';
  g.fillText(`avg ${avg.toFixed(1)} ms  1% ${worst.toFixed(1)} ms`, 80, 14);
  g.fillText(`draws ${inf.calls || 0}  tris ${Math.round((inf.triangles || 0) / 1000)}k  res ${Math.round((S.dynRes ? DR.scale : 1) * S.renderScale)}%${S.perfMode ? '  PERF' : ''}`, 6, 30);
}
(() => {
  const s = document.createElement('style'); s.textContent = '#perfGraph{position:fixed;left:12px;top:56px;z-index:40;pointer-events:none;border:1px solid rgba(255,255,255,.2);display:none}'; document.head.appendChild(s);
  // the one-tap switch in the pause menu
  setTimeout(() => { try { const p = $('pause'); if (p && !$('perfBtn')) { const b = document.createElement('button'); b.className = 'btn'; b.id = 'perfBtn'; b.dataset.act = 'perf-toggle'; const set = p.querySelector('[data-act="settings"]'); p.insertBefore(b, set ? set.nextSibling : null); perfBtn(); } } catch (e) {} }, 0);
})();
function perfAct(act) { if (act === 'perf-toggle') { perfModeSet(!S.perfMode); toast2('PERFORMANCE MODE ' + (S.perfMode ? 'ON' : 'OFF')); return true; } return false; }
