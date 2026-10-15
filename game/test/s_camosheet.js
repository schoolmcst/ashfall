// every camo and skin on one sheet (pictures)
module.exports = async p => {
  const shots = process.env.SHOTS || '/tmp', snap = n => p.screenshot({ path: shots + '/' + n + '.png' });
  // a sheet of every camo and skin (pictures)
  await p.evaluate(() => { const A = window.__A, d = document.createElement('div'); d.id = 'sheet'; d.style.cssText = 'position:fixed;inset:0;z-index:999;background:#0b0c0d;overflow:auto;padding:12px;display:grid;grid-template-columns:repeat(12,1fr);gap:6px;font:9px Arial;color:#ddd;letter-spacing:.08em';
    d.innerHTML = A.COSM.filter(c => c.kind !== 'sticker').sort((a, b) => a.r - b.r).map(c => `<div style="border-bottom:3px solid ${A.RAR[c.r].col}"><img src="${A.cosmCanvas(c.id, 96).cc.toDataURL()}" style="width:100%;display:block"><div style="padding:2px 0">${c.name}</div></div>`).join(''); document.body.appendChild(d); });
  await p.waitForTimeout(500); await snap('sheet1');
  await p.evaluate(() => { const d = document.getElementById('sheet'); d.scrollTop = 720; }); await p.waitForTimeout(200); await snap('sheet2');
  await p.evaluate(() => { const d = document.getElementById('sheet'); d.scrollTop = 1440; }); await p.waitForTimeout(200); await snap('sheet3');
  await p.evaluate(() => document.getElementById('sheet').remove());
  return await p.evaluate(() => window.__A.COSM.length);
};
