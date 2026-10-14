// music: plays in the menu, fades in a match; also renders 40 s of it to a WAV
const fs = require('fs');
module.exports = async p => {
  const r = {};
  await p.evaluate(() => { window.__A.initAudio(); window.__A.G.state = 'menu'; });
  await p.waitForTimeout(2500);
  r.menu = await p.evaluate(() => { const M = window.__A.MUS; return { on: M.on, level: +M.level.toFixed(3), steps: M.step }; });
  await p.evaluate(() => window.__A.startGame());
  await p.waitForTimeout(9000);
  r.match = await p.evaluate(() => { const M = window.__A.MUS; return { on: M.on, level: +M.level.toFixed(3), hold: window.__A.G.holdT }; });
  const wav = await p.evaluate(async () => {
    const buf = await window.__A.musRender(44);
    const n = buf.length, out = new DataView(new ArrayBuffer(44 + n * 4)), L = buf.getChannelData(0), R = buf.getChannelData(1);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); ws(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true);
    out.setUint32(24, 44100, true); out.setUint32(28, 44100 * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); ws(36, 'data'); out.setUint32(40, n * 4, true);
    let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]));
    const k = peak > 0.95 ? 0.95 / peak : 1;
    for (let i = 0; i < n; i++) { out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i] * k)) * 32767, true); out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i] * k)) * 32767, true); }
    let s = ''; const u = new Uint8Array(out.buffer); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
    return { b64: btoa(s), peak };
  });
  fs.writeFileSync(process.env.WAV || '/tmp/music.wav', Buffer.from(wav.b64, 'base64'));
  r.peak = +wav.peak.toFixed(3);
  return r;
};
