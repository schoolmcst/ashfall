// custom rules, the cup, touch, languages, squad voice, clip files, zombies types/trials/custom, breeding
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  const go = async (m, cfg) => { await p.evaluate(([m, cfg]) => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { window.__A.leaveGame(); } catch (e) {} window.__A.G.noRender = true; window.__A.startMatch(m, cfg); }, [m, cfg]); await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(2500); };
  // custom rules
  await go('tdm', { map: 'random', custom: true, rules: { hp: 200, speed: 1.3, lowgrav: true, bighead: false, regen: false, streaks: false, nades: false, weap: 'snipers' } });
  r.rules = await p.evaluate(() => { const A = window.__A; return { on: A.rulesOn(), maxHp: A.M.maxHp, gHp: A.G.maxHp, speed: A.rulesSpeed(), grav: !!(A.M.feat && A.M.feat.lowgrav), cat: A.W[0] && A.W[0].def.cat, botHp: (A.enemies.find(e => e.pvp) || {}).maxHp }; });
  // the cup
  r.tour = await p.evaluate(() => { const A = window.__A; try { A.leaveGame(); } catch (e) {} const T = A.tourNew(['ALICE', 'BOB']); return { n: T.bracket[0].length, you: T.bracket[0].includes('YOU'), friends: T.bracket[0].includes('ALICE') }; });
  await p.evaluate(() => { window.__A.G.noRender = true; window.__A.tourPlay(); }); await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(2500);
  r.tourMatch = await p.evaluate(() => { const A = window.__A; const opp = A.M.entries.find(e => !e.isPlayer); const out = { mode: A.M.mode, n: A.M.entries.length, opp: opp && opp.name, tour: !!A.M.cfg.tour }; A.endMatch(A.M.me); const T = A.tourGet(); out.round = T.round; out.semi = (T.bracket[1] || []).length; return out; });
  await p.waitForTimeout(600);
  await p.evaluate(() => window.__A.openTour()); await p.waitForTimeout(300); await p.screenshot({ path: SH + '/cup.png' }); await p.evaluate(() => document.getElementById('tourOv').remove());
  // touch + language
  r.touch = await p.evaluate(() => { const A = window.__A; A.touchBuild(); return document.querySelectorAll('#touchUi .tc-b').length; });
  r.lang = await p.evaluate(() => { const A = window.__A; try { A.leaveGame(); } catch (e) {} A.showScreen('menu'); A.S.lang = 'es'; A.langApply(); const t = [...document.querySelectorAll('#menu .cod-tab')].map(b => b.textContent.trim()).slice(0, 4); return t; });
  await p.waitForTimeout(400); await p.screenshot({ path: SH + '/lang_es.png' });
  r.langBack = await p.evaluate(() => { const A = window.__A; A.S.lang = 'en'; A.langApply(); return [...document.querySelectorAll('#menu .cod-tab')].map(b => b.textContent.trim()).slice(0, 2); });
  // clip file round trip
  r.clip = await p.evaluate(async () => { const A = window.__A, c = { name: 'TEST', map: 'blackwell', len: 3, frames: [[0], [10], [20]], feed: [], score: [] }; const b = await A.clipBytes(c); const back = await A.clipParse(b.buffer); const n0 = A.RP_LIB.clips.length; await A.clipImport(b.buffer); return { bytes: b.length, frames: back.frames.length, added: A.RP_LIB.clips.length - n0 }; });
  // zombies: types and trials, custom
  await p.evaluate(() => { const Z = window.__A.ZCUS_GET(); Object.assign(Z, { on: true, start: 10, pts: 10000, hp: 2, speed: 'run', specials: true, strays: false, pups: true }); });
  await go('zomb', { map: 'random' });
  r.zcus = await p.evaluate(() => { const A = window.__A; return { round: A.Z.round, pts: A.G.points, custom: A.Z.custom }; });
  r.ztypes = await p.evaluate(() => { const A = window.__A, out = {}; const z = A.enemies.filter(e => e.zombie); if (!z.length) return 'none'; for (const [i, k] of ['scream', 'spit', 'brute'].entries()) { const e = z[i % z.length]; const hp = e.maxHp; A.zs2Make(e, k); out[k] = +(e.maxHp / hp).toFixed(2); } return out; });
  r.trial = await p.evaluate(() => { const A = window.__A; A.zs2TrialStart(6); const t = A.ZS2.trial; return t ? { id: t.T.id, need: t.need, hud: !!document.getElementById('zTrial') } : null; });
  await p.evaluate(() => { const Z = window.__A.ZCUS_GET(); Z.on = false; });
  // breeding
  r.breed = await p.evaluate(() => { const A = window.__A; try { A.leaveGame(); } catch (e) {} const g = A.GROW_GET(); g.done.og = 1; g.done.blue = 1; g.seeds.og = 2; g.seeds.blue = 2; g.breed = null; const ok = A.breedStart('og', 'blue'); g.breed.t -= 3 * 3600e3; const out = A.breedCollect(); return { ok, got: out && out.id, seeds: g.seeds.ogblue, strain: !!A.STRAIN.ogblue, hybrids: A.HYBRIDS.length }; });
  await p.evaluate(() => { window.__A.showScreen('menu'); document.querySelector('[data-act="growop"]').click(); }); await p.waitForTimeout(600); await p.screenshot({ path: SH + '/breed.png' });
  return r;
};
