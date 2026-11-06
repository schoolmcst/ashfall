/* ================================================================== CLIP SHARING (1.2.88)
   In the REPLAY THEATRE: SHARE CLIP saves what you're watching as a .dzclip file (small: it's the replay, not a video)
   to send to a friend; OPEN CLIP FILE loads one a friend sent you into your CLIPS; VIDEO records the replay from
   the start to a .webm video to post anywhere. */
async function clipBytes(obj) {
  const txt = JSON.stringify({ dz: 1, clip: obj });
  try { if (typeof CompressionStream !== 'undefined') return new Uint8Array(await new Response(new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); } catch (e) {}
  return new TextEncoder().encode(txt);
}
async function clipParse(buf) {
  let u = new Uint8Array(buf);
  if (u[0] === 0x1f && u[1] === 0x8b) u = new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  const o = JSON.parse(new TextDecoder().decode(u)); if (!o || o.dz !== 1 || !o.clip || !Array.isArray(o.clip.frames)) throw new Error('not a clip');
  return o.clip;
}
function clipSave(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }
const clipName = (R, ext) => `darkzone-${String(R.clip || R.name || 'match').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}.${ext}`;
async function clipShare() {
  const R = RPLAST; if (!R || !R.frames || !R.frames.length) return false;
  const b = await clipBytes(R); clipSave(new Blob([b], { type: 'application/octet-stream' }), clipName(R, 'dzclip'));
  try { toast2('CLIP FILE SAVED · SEND IT TO A FRIEND'); sfx.ui(); } catch (e) {} return b.length;
}
async function clipImport(buf) {
  const c = await clipParse(buf); c.clip = c.clip || ('SHARED · ' + (c.name || 'MATCH')); c.cdate = Date.now(); c.shared = 1;
  RP_LIB.clips = [c].concat(RP_LIB.clips).slice(0, 20); try { sbPut('clips', RP_LIB.clips); } catch (e) {} return c;
}
function clipOpenFile() {
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.dzclip,application/octet-stream';
  i.onchange = async () => { const f = i.files && i.files[0]; if (!f) return; try { const c = await clipImport(await f.arrayBuffer()); toast2('CLIP ADDED · ' + c.clip); openReplay(c); } catch (e) { try { toast2('THAT FILE IS NOT A DARKZONE CLIP'); } catch (er) {} } };
  i.click();
}
// VIDEO: play the replay from the start and record the canvas
function clipVideo() {
  const cv = $('rpCanvas'), R = RPLAST; if (!cv || !R || !cv.captureStream || typeof MediaRecorder === 'undefined') { try { toast2('VIDEO RECORDING IS NOT SUPPORTED HERE'); } catch (e) {} return false; }
  if (RV.recVid) return false;
  const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t)) || '';
  const rec = new MediaRecorder(cv.captureStream(30), type ? { mimeType: type, videoBitsPerSecond: 3e6 } : undefined), parts = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) parts.push(e.data); };
  rec.onstop = () => { RV.recVid = null; clipBtns(); if (parts.length) { clipSave(new Blob(parts, { type: 'video/webm' }), clipName(R, 'webm')); try { toast2('VIDEO SAVED'); } catch (e) {} } };
  RV.t = 0; RV.play = true; RV.speed = 1; RV.recVid = rec; rec.start(500); clipBtns();
  const end = () => { if (!RV.recVid) return; if (!RV.on || !RV.play || RV.t >= R.len - 0.05) { try { rec.stop(); } catch (e) {} return; } setTimeout(end, 250); }; setTimeout(end, 600);
  return true;
}
function clipBtns() {
  const back = $('rpBack'); if (!back) return; let w = $('rpShareRow');
  if (!w) { w = document.createElement('span'); w.id = 'rpShareRow'; w.innerHTML = '<button class="btn" id="rpShare">SHARE CLIP</button><button class="btn" id="rpOpenF">OPEN CLIP FILE</button><button class="btn" id="rpVid">VIDEO</button>'; back.parentNode.insertBefore(w, back);
    $('rpShare').onclick = () => clipShare(); $('rpOpenF').onclick = () => clipOpenFile(); $('rpVid').onclick = () => { if (RV.recVid) { try { RV.recVid.stop(); } catch (e) {} } else clipVideo(); }; }
  $('rpVid').textContent = RV.recVid ? '■ STOP VIDEO' : 'VIDEO';
}
(() => { const old = openReplay; openReplay = function (pick) { const r = old.apply(this, arguments); try { clipBtns(); } catch (e) {} return r; }; })();
