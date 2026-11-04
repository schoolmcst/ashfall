/* ================================================================== FEEDBACK (1.2.68): hit markers, kill sounds, streak glow
   HIT MARKERS: white for a body hit, yellow and bigger for a headshot, red with a pop for a kill (a white rim on a headshot
   kill). KILL SOUNDS: a short confirm on every kill, a sharper crack on headshot kills, rising with a multi-kill.
   STREAK GLOW: every kill pulses a soft glow round the screen edge; it gets warmer and stronger as your streak grows
   (green, then orange at 5, then purple at 10). Settings > GAMEPLAY > KILL EFFECTS turns the glow and sounds off. */
function fbMarker(hit, kill, head) {
  const hm = $('hit'); if (!hm) return;
  hm.className = (kill ? 'kill' : '') + (head ? ' head' : '');
  hm.style.opacity = 1; hm.style.transform = kill ? 'scale(1.55)' : head ? 'scale(1.25)' : 'scale(1)';
  clearTimeout(hm._t); clearTimeout(hm._s);
  hm._s = setTimeout(() => { hm.style.transform = 'scale(1)'; }, kill ? 70 : 40);
  hm._t = setTimeout(() => (hm.style.opacity = 0), kill ? 260 : 110);
}
function fbKillSound(head, multi) {
  if (S.killFx === false) return;
  try { const up = Math.min(4, (multi || 1) - 1) * 90;
    if (head) { tone(1320 + up, 0.07, 0.07, 'square'); tone(660 + up, 0.12, 0.06, 'triangle'); burst(0.05, 5000, 0.05, 'highpass'); }
    else { tone(980 + up, 0.08, 0.06, 'triangle'); tone(490 + up, 0.1, 0.04, 'sine'); } } catch (e) {}
}
function fbKillGlow(streak, head) {
  if (S.killFx === false) return; const el = $('killGlow'); if (!el) return;
  const col = streak >= 10 ? '170,80,255' : streak >= 5 ? '255,140,40' : '90,255,120', k = Math.min(1, 0.25 + streak * 0.06 + (head ? 0.1 : 0));
  el.style.transition = 'none'; el.style.boxShadow = `inset 0 0 ${60 + streak * 6}px ${10 + streak * 2}px rgba(${col},${k.toFixed(2)})`; el.style.opacity = 1;
  void el.offsetWidth; el.style.transition = 'opacity .6s ease-out'; el.style.opacity = 0;
}
