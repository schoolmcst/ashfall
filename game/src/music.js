/* ================================================================== lobby music
   Original music made live with WebAudio (no recordings, so no copyright issues). A dark synth track in A minor at
   100 BPM: a slow pad, a pulsing bass, drums and an arpeggio. It runs as a 32-bar song (intro, main, breakdown) and
   picks a new arpeggio and bass pattern every 8 bars so it doesn't sound like a short loop.
   It plays in the menus, lobbies and results, quieter on the loading / class pick screen, and fades out in a match. */
const MUS = { g: null, on: false, next: 0, step: 0, bar: 0, arp: 0, bassP: 0, level: 0 };
const MUS_BPM = 100, MUS_STEP = 60 / MUS_BPM / 4;            // one 16th note in seconds
// chords as MIDI notes (Am, F, C, G, then Am, F, Dm, E)
const MUS_CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]];
const MUS_ROOT = [45, 41, 36, 43, 45, 41, 38, 40];
const MUS_ARPS = [[0, 1, 2, 1, 0, 1, 2, 3], [0, 2, 1, 2, 3, 2, 1, 2], [2, 1, 0, 1, 2, 3, 2, 1], [0, 1, 2, 3, 2, 1, 2, 0]];
const MUS_BASS = [[1, 0, 1, 1, 0, 1, 1, 0], [1, 0, 0, 1, 0, 0, 1, 1], [1, 1, 0, 1, 1, 0, 1, 0]];
const mhz = m => 440 * Math.pow(2, (m - 69) / 12);
function musWanted() {
  if (S.music <= 0) return 0;
  const st = G.state;
  if (st === 'menu' || st === 'plobby' || st === 'over' || st === 'benchdone') return 1;
  if (G.holdT > 0) return 0.45;                              // loading screen + class pick
  return 0;
}
function musOsc(type, f, t, dur, vol, cut, o) {
  const osc = actx.createOscillator(), g = actx.createGain(), fl = actx.createBiquadFilter();
  osc.type = type; osc.frequency.value = f; if (o && o.det) osc.detune.value = o.det;
  fl.type = 'lowpass'; fl.frequency.value = cut; fl.Q.value = (o && o.q) || 0.7;
  const a = (o && o.a) || 0.005, r = (o && o.r) || dur * 0.6;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, t + Math.max(a, dur - r)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (o && o.sweep) { fl.frequency.setValueAtTime(cut * 0.4, t); fl.frequency.linearRampToValueAtTime(cut, t + dur * 0.5); fl.frequency.linearRampToValueAtTime(cut * 0.5, t + dur); }
  osc.connect(fl); fl.connect(g); g.connect(MUS.g); osc.start(t); osc.stop(t + dur + 0.05);
}
function musNoise(t, dur, vol, type, f, q) {
  const s = actx.createBufferSource(), fl = actx.createBiquadFilter(), g = actx.createGain();
  s.buffer = getNoise(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.7;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(MUS.g); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
}
function musKick(t, vol) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
  o.connect(g); g.connect(MUS.g); o.start(t); o.stop(t + 0.4);
}
// schedules one 16th-note step at time t
function musStep(t) {
  const s = MUS.step % 16, bar = MUS.bar % 32, ci = MUS.bar % 8, ch = MUS_CH[ci];
  const intro = bar < 8, brk = bar >= 24, last = bar % 8 === 7;
  if (s === 0) {
    if (bar % 8 === 0) { MUS.arp = (Math.random() * MUS_ARPS.length) | 0; MUS.bassP = (Math.random() * MUS_BASS.length) | 0; }
    for (const n of ch) for (const d of [-9, 9]) musOsc('sawtooth', mhz(n), t, MUS_STEP * 16 + 0.3, 0.022, brk ? 1400 : 950, { det: d, a: 0.5, r: 0.8, sweep: true });
    musOsc('sine', mhz(ch[0] - 12), t, MUS_STEP * 16, 0.05, 2000, { a: 0.3, r: 0.6 });
  }
  // bass on 8th notes
  if (!brk && s % 2 === 0 && MUS_BASS[MUS.bassP][s / 2]) {
    const oct = (s === 6 || s === 14) ? 12 : 0;
    musOsc('sawtooth', mhz(MUS_ROOT[ci] + oct), t, MUS_STEP * 1.6, intro ? 0.07 : 0.1, 420, { q: 4, r: MUS_STEP });
  }
  // drums
  if (!intro && !brk) {
    if (s === 0 || s === 8 || (s === 10 && last) || (s === 7 && bar % 2)) musKick(t, 0.5);
    if (s === 4 || s === 12) musNoise(t, 0.18, 0.12, 'bandpass', 1800, 0.9);
    if (s % 2 === 0) musNoise(t, s % 4 === 2 ? 0.07 : 0.035, s % 4 === 2 ? 0.05 : 0.025, 'highpass', 7500);
    if (last && s >= 12) musNoise(t, 0.09, 0.05 + (s - 12) * 0.02, 'bandpass', 2400, 1.2);   // fill
  } else if (intro && bar >= 4 && s % 4 === 2) musNoise(t, 0.05, 0.02, 'highpass', 8000);
  // arpeggio (main section and breakdown)
  if (!intro && s % 2 === 0) {
    const k = MUS_ARPS[MUS.arp][s / 2], n = k === 3 ? ch[0] + 12 : ch[k];
    musOsc('square', mhz(n + 12), t, MUS_STEP * 1.8, brk ? 0.03 : 0.022, brk ? 2600 : 1900, { r: MUS_STEP * 1.4 });
    if (brk) musOsc('triangle', mhz(n + 24), t + MUS_STEP * 3, MUS_STEP * 1.5, 0.012, 4000);   // echo
  }
  MUS.step++; if (MUS.step % 16 === 0) MUS.bar++;
}
function musicTick() {
  if (!actx || !bus) return;
  if (!MUS.g) { MUS.g = actx.createGain(); MUS.g.gain.value = 0; MUS.g.connect(bus.master); }
  const want = musWanted() * (S.music / 100) * 0.9;
  MUS.level += (want - MUS.level) * 0.12;                    // ~1.5 s fades
  MUS.g.gain.setTargetAtTime(MUS.level, actx.currentTime, 0.05);
  if (MUS.level < 0.004 && want === 0) { MUS.on = false; return; }
  if (!MUS.on) { MUS.on = true; MUS.next = actx.currentTime + 0.08; if (MUS.level < 0.02) { MUS.step = 0; MUS.bar = 0; } }
  if (MUS.next < actx.currentTime - 0.1) MUS.next = actx.currentTime + 0.05;   // tab was in the background
  while (MUS.next < actx.currentTime + 0.3) { musStep(MUS.next); MUS.next += MUS_STEP; }
}
setInterval(() => { try { musicTick(); } catch (e) {} }, 100);
// renders the song offline (used by the test to make a sample to listen to)
async function musRender(secs) {
  const real = actx, rg = MUS.g, rn = noiseBuf, off = new OfflineAudioContext(2, 44100 * secs, 44100);
  actx = off; noiseBuf = null; MUS.g = off.createGain(); MUS.g.gain.value = 0.7; MUS.g.connect(off.destination);
  const st = MUS.step, bar = MUS.bar; MUS.step = 0; MUS.bar = 0;
  try { for (let t = 0.05; t < secs - 0.5; t += MUS_STEP) musStep(t); } finally { actx = real; noiseBuf = rn; }
  MUS.g = rg; MUS.step = st; MUS.bar = bar;
  return off.startRendering();
}
