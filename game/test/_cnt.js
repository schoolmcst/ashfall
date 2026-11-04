module.exports = async p => {
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); window.__C = { du: [], ss: 0 }; const o = HTMLCanvasElement.prototype.toDataURL; HTMLCanvasElement.prototype.toDataURL = function () { window.__C.du.push([this.width + 'x' + this.height, (new Error().stack.split('\n')[2] || '').trim().slice(0, 80), Math.round(performance.now())]); return o.apply(this, arguments); };
    const r = window.__A.renderer, s = r.setSize.bind(r); r.setSize = function () { window.__C.ss++; return s.apply(null, arguments); }; window.__A.startMatch('tdm', { map: 'metro' }); });
  await p.waitForTimeout(4000); await p.evaluate(() => { window.__A.G.holdT = 0.01; window.__A.G.loadT = 0; });
  await p.waitForTimeout(15000);
  return p.evaluate(() => ({ n: window.__C.du.length, ss: window.__C.ss, first: window.__C.du.slice(0, 6), last: window.__C.du.slice(-4) }));
};
