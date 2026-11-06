/* ================================================================== WINTER STASH ISLAND (1.2.86)
   From December 1 to the end of February (and all through FROSTY NUGS) LAST TOKE's island is snowed in: snow on the
   fields and the beaches, a grey winter sky, snow falling all match, a frozen sea, no tall grass. Same island, same
   places, same colliders, so nothing else changes; it is picked by the date, so everyone in an online match gets the
   same island. ISLE_W.force (tests) can turn it on or off. */
const ISLE_W = { force: null };
function isleWinter() {
  if (ISLE_W.force !== null) return !!ISLE_W.force;
  const d = typeof evNow === 'function' ? evNow() : new Date(), m = d.getMonth() + 1;
  if (m === 12 || m === 1 || m === 2) return true;
  try { const e = evActive(); return !!(e && e.id === 'winter'); } catch (er) { return false; }
}
const ISLE_WENV = { top: 0xb4c0cc, horizon: 0xe8eef4, fog: 0.007, sun: [-40, 45, 30], sunCol: 0xe8f0ff, sunI: 1.5, skySun: 0xe0e8f0, hemiSky: 0xd8e4f0, hemiGround: 0x9aa4ae, exposure: 1.05 };
const ISLE_WSWAP = { ground: 'snow', sand: 'snow', soil: 'snow', cobble: 'snow', sea: 'ice', hay: 'snow' };
(() => {
  const m = MAPS.stashisle; if (!m) return;
  const env0 = m.env, grass0 = m.grass, name0 = m.name, place0 = m.place, build0 = m.build;
  Object.defineProperty(m, 'env', { get: () => isleWinter() ? ISLE_WENV : env0, configurable: true });
  Object.defineProperty(m, 'grass', { get: () => isleWinter() ? { count: 0 } : grass0, configurable: true });
  Object.defineProperty(m, 'name', { get: () => isleWinter() ? 'STASH ISLAND · WINTER' : name0, configurable: true });
  Object.defineProperty(m, 'place', { get: () => isleWinter() ? 'Grow island, snowed in' : place0, configurable: true });
  m.build = function () {
    const r = build0.apply(this, arguments); if (!isleWinter()) return r;
    try { buildMap2Materials(); } catch (e) {}
    for (const id in batches) { const b = batches[id], to = ISLE_WSWAP[b.key]; if (to && MAT[to]) b.key = to; }
    return r;
  };
})();
