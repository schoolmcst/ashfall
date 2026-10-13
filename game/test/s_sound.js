// recorded sounds decode and every sound path runs without errors
module.exports = async p => {
  await p.mouse.click(640, 360);
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => Object.keys(window.__A.SMP).length >= 17, null, { timeout: 15000 }).catch(() => {});
  return p.evaluate(async () => {
    const A = window.__A, n = Object.keys(A.SMP).length, errs = [];
    const calls = [() => { for (const w of A.ARMORY) A.sfx.gun(w.sfxP); }, () => A.sfx.suppressed(false), () => A.sfx.enemy({ vol: 0.8, pan: 0, delay: 0 }), () => A.sfx.enemy({ vol: 0.1, pan: 0.5, delay: 0.1 }),
      () => A.sfx.explode({ vol: 0.9, pan: 0, delay: 0 }), () => A.sfx.explode({ vol: 0.1, pan: 0, delay: 0 }), () => A.sfx.reload(), () => A.sfx.click(), () => A.sfx.rack(),
      () => A.sfx.ereload({ vol: 0.5, pan: 0, delay: 0 }), () => A.sfx.casing({ vol: 0.5, pan: 0, delay: 0 }), () => A.sfx.step(1), () => A.sfx.estep({ vol: 0.5, pan: 0, delay: 0 })];
    for (const c of calls) try { c(); } catch (e) { errs.push(String(e)); }
    A.applySetting && A.applySetting('realSnd', false); try { A.sfx.gun(A.ARMORY[0].sfxP); A.sfx.reload(); } catch (e) { errs.push('off ' + e); }
    A.applySetting && A.applySetting('realSnd', true);
    const mapped = A.ARMORY.filter(w => w.sfxP.__s).length;
    return { decoded: n, keys: Object.keys(A.SMP), mapped, total: A.ARMORY.length, errs };
  });
};
