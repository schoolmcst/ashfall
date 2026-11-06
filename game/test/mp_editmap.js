// MAP EDITOR online: A makes a map, hosts a private match on it, B joins by code and gets the same map
const { mpPages } = require('./mp_lib.js');
(async () => {
  const { pages, errs, close, ev } = await mpPages(2, 39563), [A, B] = pages, log = {};
  await ev(A, () => { const m = { name: 'ONLINE YARD', size: 40, look: 'night', A: { x: 0, z: 16 }, B: { x: 0, z: -16 }, P: { x: 0, z: 0 }, items: [{ t: 'wall', x0: -8, z0: 6, x1: 8, z1: 6 }, { t: 'wall', x0: -8, z0: -6, x1: 8, z1: -6 }, { t: 'tall', x: 12, z: 0 }, { t: 'tall', x: -12, z: 0 }, { t: 'ramp', x: 0, z: 0 }, { t: 'low', x: 5, z: 10 }, { t: 'crate', x: -5, z: -10 }] };
    localStorage.setItem('ashfall.maps.v1', JSON.stringify([m])); });
  const join = (p, n) => ev(p, n => { const A_ = window.__A; A_.NET.nick = n; A_.NET.code = 'edmap9'; A_.G.noRender = true; A_.LOBBY.mode = 'otdm'; A_.toLobby(); A_.actions('custom'); document.getElementById('netCodeGo').click(); }, n);
  await join(A, 'ALPHA'); await A.waitForTimeout(8000);
  log.opt = await ev(A, () => { const A_ = window.__A; A_.edPrivPick(); Object.assign(A_.NET.priv.cfg, { md: 'tdm', b: 2, tl: 3, sc: 30, mp: 'edit_map' }); A_.renderPlobby(true); return [...document.querySelectorAll('#plSet .seg button')].map(b => b.textContent).filter(t => /MY MAP/.test(t)); });
  await join(B, 'BRAVO'); await A.waitForTimeout(12000);
  await ev(A, () => document.getElementById('plStart').click()); await A.waitForTimeout(20000);
  const st = p => ev(p, () => { const A_ = window.__A; return { map: A_.curMap, name: A_.MAPS.edit_map && A_.MAPS.edit_map.name, boxes: A_.boxes.length, rem: A_.NET.rem.size, state: A_.G.state }; });
  log.A = await st(A); log.B = await st(B);
  console.log(JSON.stringify(log, null, 1)); console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await close(); process.exit(0);
})();
