// Season 2 HARVEST: countdown, the switch on Jan 1, keeping Season 1, the new pass, a sheet of every new item: SHOTS=dir node run.js s_season2.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const shot = async (n, ms = 700) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms); await p.screenshot({ path: path.join(out, 's2_' + n + '.png'), timeout: 120000 }); };
  await p.evaluate(() => { const s = document.getElementById('hcSplash'); if (s) s.remove(); const A = window.__A; A.PROG.bp = { s: 1, xp: 0, cf: 0, cp: 0, prem: false }; delete A.PROG.bpSwitched; delete A.PROG.bpHist; });
  // Dec 25: still season 1, countdown
  r.dec25 = await p.evaluate(() => { const A = window.__A; A.BPT.fake = '2026-12-25T12:00:00'; A.bpUseSeason(); A.bpGain(30 * 2500 + 10); A.showScreen('menu'); A.bpStrip(); return { season: A.PASS.season, tier: A.bpTier(), strip: (document.getElementById('bpStrip') || {}).textContent, s1owned: A.COSM.filter(c => c.bp === 1 && A.PROG.owned[c.id]).length }; });
  await shot('countdown');
  // Jan 1: season 2
  r.jan1 = await p.evaluate(() => { const A = window.__A; A.BPT.fake = '2027-01-01T09:00:00'; A.bpUseSeason(); A.bpStrip(); return { season: A.PASS.season, name: A.PASS.name, tier: A.bpTier(), bp: A.PROG.bp, hist: A.PROG.bpHist, sw: A.PROG.bpSwitched, s1owned: A.COSM.filter(c => c.bp === 1 && A.PROG.owned[c.id]).length, s2items: A.COSM.filter(c => c.bp === 2).length, strip: (document.getElementById('bpStrip') || {}).textContent }; });
  await p.evaluate(() => window.__A.bpSeasonPopup());
  await shot('popup');
  await p.evaluate(() => document.querySelector('[data-bpsw="go"]').click());
  await p.waitForTimeout(800);
  await shot('pass_tier1');
  // play to tier 100
  r.t100 = await p.evaluate(() => { const A = window.__A; const g = A.bpGain(100 * 2500); return { tier: A.bpTier(), master: !!A.PROG.owned['bp2_reaper_s_harvest'] || Object.keys(A.PROG.owned).filter(k => /^bp2_reaper/.test(k)), s2owned: A.COSM.filter(c => c.bp === 2 && A.PROG.owned[c.id]).length }; });
  await p.evaluate(() => { const A = window.__A; A.openBattlePass(); });
  await p.waitForTimeout(800);
  await shot('pass_tier100');
  // back in time: never back to season 1
  r.clockBack = await p.evaluate(() => { const A = window.__A; A.BPT.fake = '2026-12-30T12:00:00'; A.bpUseSeason(); const s = A.PASS.season; A.BPT.fake = null; A.bpUseSeason(); return { seasonAfterClockBack: s, nowSeason: A.PASS.season }; });
  // a sheet of every Season 2 item
  r.sheet = await p.evaluate(() => {
    const A = window.__A, list = A.COSM.filter(c => c.bp === 2).sort((a, b) => (a.track > b.track ? 1 : -1) || a.tier - b.tier);
    const cols = 12, W = 96, H = 118, cv = document.createElement('canvas'); cv.width = cols * W; cv.height = Math.ceil(list.length / cols) * H; const g = cv.getContext('2d'); g.fillStyle = '#0c0e10'; g.fillRect(0, 0, cv.width, cv.height);
    return Promise.all(list.map((c, i) => new Promise(res => { const im = new Image(); im.onload = () => { const x = (i % cols) * W, y = Math.floor(i / cols) * H; g.drawImage(im, x + 12, y + 6, 72, 72); g.fillStyle = c.track === 'f' ? '#9adf5a' : '#e0b44a'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText((c.track === 'f' ? 'FREE ' : 'T') + c.tier, x + W / 2, y + 90); g.fillStyle = '#fff'; g.fillText(c.name.slice(0, 16), x + W / 2, y + 103); res(); }; im.onerror = () => res(); im.src = A.swatchUrl(c.id); }))).then(() => { window.__sheet = cv.toDataURL('image/png'); return list.length; });
  });
  const data = await p.evaluate(() => window.__sheet);
  require('fs').writeFileSync(path.join(out, 's2_sheet.png'), Buffer.from(data.split(',')[1], 'base64'));
  return r;
};
