/* ================================================================== voice chat (desktop app)
   Your mic is encoded to Opus with WebCodecs in 20 ms frames and sent over the same WebRTC link the match already uses
   (the host passes each frame on to everyone else, like the game state). Each speaker gets their own decoder and a
   small jitter buffer. Modes: OFF, PUSH TO TALK (V on keyboard, D-pad LEFT on a controller) or OPEN MIC (sends while
   you're louder than the sensitivity). Match voice goes to everyone in your match; in the lobby it goes to your party.
   Options live in the pause menu (and Settings > Audio): mode, voice volume, mic sensitivity, mute players. */
const VOICE = { mode: 'off', vol: 80, sens: 35, muted: new Set(), on: false, err: '', ptt: false, talking: false, level: 0, spk: new Map(), seq: 0 };
try { const o = JSON.parse(localStorage.getItem('ashfall.voice.v1') || 'null'); if (o) { VOICE.mode = ['off', 'ptt', 'open'].includes(o.mode) ? o.mode : 'off'; VOICE.vol = clamp(+o.vol || 80, 0, 100); VOICE.sens = clamp(+o.sens || 35, 0, 100); VOICE.muted = new Set((o.muted || []).slice(0, 50)); } } catch (e) {}
const voiceSave = () => { try { localStorage.setItem('ashfall.voice.v1', JSON.stringify({ mode: VOICE.mode, vol: VOICE.vol, sens: VOICE.sens, muted: [...VOICE.muted] })); } catch (e) {} };
const voiceSupported = () => typeof AudioEncoder === 'function' && typeof AudioDecoder === 'function' && typeof MediaStreamTrackProcessor === 'function' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
// the room voice goes through: the match while in one, else the party
const voiceRoom = () => (typeof NET !== 'undefined' && NET.on && NET.room && NET.room.voice ? NET.room : (typeof PARTY !== 'undefined' && PARTY.room && PARTY.room.voice ? PARTY.room : null));
let vCtx = null, vEnc = null, vStream = null, vReader = null;
function vAudio() { if (!vCtx) { try { vCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 }); } catch (e) { vCtx = null; } } if (vCtx && vCtx.state === 'suspended') vCtx.resume().catch(() => {}); return vCtx; }
async function voiceStart() {
  if (VOICE.on || VOICE.mode === 'off') return;
  if (!voiceSupported()) { VOICE.err = 'Voice chat needs the desktop app'; return; }
  try {
    vStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
  } catch (e) { VOICE.err = 'No microphone (or permission denied)'; VOICE.mode = 'off'; voiceSave(); return; }
  VOICE.err = ''; VOICE.on = true; vAudio();
  vEnc = new AudioEncoder({ output: ch => { const b = new Uint8Array(ch.byteLength); ch.copyTo(b); voiceOut(b); }, error: () => {} });
  vEnc.configure({ codec: 'opus', sampleRate: 48000, numberOfChannels: 1, bitrate: 24000, opus: { frameDuration: 20000 } });
  const track = vStream.getAudioTracks()[0]; vReader = new MediaStreamTrackProcessor({ track }).readable.getReader();
  (async () => {
    let hang = 0;
    while (VOICE.on) {
      let r; try { r = await vReader.read(); } catch (e) { break; } if (r.done) break; const ad = r.value;
      try {
        // loudness (for open mic + the meter)
        const n = ad.numberOfFrames, buf = new Float32Array(n); ad.copyTo(buf, { planeIndex: 0, format: 'f32-planar' });
        let sum = 0; for (let i = 0; i < n; i += 4) sum += buf[i] * buf[i]; const lvl = Math.min(1, Math.sqrt(sum / (n / 4)) * 8); VOICE.level = VOICE.level * 0.7 + lvl * 0.3;
        const want = VOICE.mode === 'ptt' ? VOICE.ptt : VOICE.mode === 'open' && (VOICE.level > (1 - VOICE.sens / 100) * 0.5 ? (hang = 15) : hang-- > 0);
        VOICE.talking = !!want && !!voiceRoom();
        if (VOICE.talking && vEnc.state === 'configured') vEnc.encode(ad);
      } catch (e) {}
      ad.close();
    }
  })();
}
function voiceStop() {
  VOICE.on = false; VOICE.talking = false;
  try { vReader && vReader.cancel(); } catch (e) {} vReader = null;
  try { vStream && vStream.getTracks().forEach(t => t.stop()); } catch (e) {} vStream = null;
  try { vEnc && vEnc.state !== 'closed' && vEnc.close(); } catch (e) {} vEnc = null;
}
function voiceSetMode(m) { VOICE.mode = m; voiceSave(); if (m === 'off') voiceStop(); else voiceStart(); }
// one frame out: base64 over the room's unreliable channel
function voiceOut(bytes) { const r = voiceRoom(); if (!r) return; let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); r.voice(btoa(s), ++VOICE.seq); }
// one frame in from `label`, with the speaker's name
function voiceIn(label, name, d, seq) {
  if (VOICE.mode === 'off' || !vAudio() || VOICE.muted.has(name) || (typeof lnBlocked === 'function' && lnBlocked(name))) return;
  let S0 = VOICE.spk.get(label);
  if (!S0) {
    S0 = { name, next: 0, gain: vCtx.createGain(), t: 0 };
    S0.gain.connect(vCtx.destination);
    S0.dec = new AudioDecoder({ output: ad => { try { const n = ad.numberOfFrames, buf = vCtx.createBuffer(1, n, ad.sampleRate); const f = new Float32Array(n); ad.copyTo(f, { planeIndex: 0, format: 'f32-planar' }); buf.copyToChannel(f, 0);
      const src = vCtx.createBufferSource(); src.buffer = buf; src.connect(S0.gain); const now = vCtx.currentTime; if (S0.next < now + 0.02 || S0.next > now + 0.5) S0.next = now + 0.08; src.start(S0.next); S0.next += buf.duration; } catch (e) {} ad.close(); }, error: () => {} });
    S0.dec.configure({ codec: 'opus', sampleRate: 48000, numberOfChannels: 1 });
    VOICE.spk.set(label, S0);
  }
  S0.name = name; S0.t = performance.now(); S0.gain.gain.value = VOICE.vol / 100 * 1.4;
  try { const raw = atob(d), b = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) b[i] = raw.charCodeAt(i); S0.dec.decode(new EncodedAudioChunk({ type: 'key', timestamp: (seq | 0) * 20000, data: b })); } catch (e) {}
}
// who is talking right now (top left of the HUD) + my own mic dot
function voiceHud() {
  const el = $('voiceHud'); if (!el) return;
  const now = performance.now(), talk = [...VOICE.spk.values()].filter(s => now - s.t < 300).map(s => s.name);
  const key = talk.join() + '|' + (VOICE.talking ? 1 : 0) + VOICE.mode;
  if (el._k === key) return; el._k = key;
  el.innerHTML = (VOICE.mode !== 'off' ? `<div class="vh me${VOICE.talking ? ' on' : ''}">${VOICE.mode === 'ptt' ? 'PUSH TO TALK · ' + (usingPad() ? 'D-PAD LEFT' : 'V') : 'OPEN MIC'}</div>` : '') + talk.map(n => `<div class="vh on">${chatEsc(n)}</div>`).join('');
}
setInterval(() => { try { voiceHud(); for (const [k, s] of VOICE.spk) if (performance.now() - s.t > 60000) { try { s.dec.close(); } catch (e) {} VOICE.spk.delete(k); } } catch (e) {} }, 120);
if (VOICE.mode !== 'off') setTimeout(() => voiceStart(), 1500);
(() => {
  const hud = document.getElementById('hud') || document.body, d = document.createElement('div'); d.id = 'voiceHud'; hud.appendChild(d);
  const s = document.createElement('style');
  s.textContent = `#voiceHud{position:absolute;left:28px;top:84px;display:flex;flex-direction:column;gap:4px;pointer-events:none}
#voiceHud .vh{font-size:12px;font-weight:700;letter-spacing:.06em;color:#fff;text-shadow:0 0 2px #000,0 1px 2px #000;padding:3px 8px 3px 22px;background:rgba(0,0,0,.4);position:relative;width:fit-content}
#voiceHud .vh::before{content:"";position:absolute;left:8px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:#777}#voiceHud .vh.on::before{background:#2fd16a;box-shadow:0 0 6px #2fd16a}
#voiceHud .vh.me{color:#d8d8d8;font-weight:600}`;
  document.head.appendChild(s);
})();
