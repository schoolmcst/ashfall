module.exports = async p => p.evaluate(() => { const A = window.__A, fr = []; for (let t = 0; t <= 600; t += 2) fr.push([t, [0, 10, 10, 0, 1]]);
  const R = { name: 'TEAM DEATHMATCH', map: 'metro', len: 60, date: Date.now(), ents: [{ n: 'YOU', r: 0, me: 1 }], frames: fr, score: [], obj: [],
    feed: [[100, '<b>YOU</b> x a'], [300, '<span>B</span> x c'], [320, '<b>YOU</b> x b'], [360, '<b>YOU</b> x c'], [390, '<b>YOU</b> x d'], [550, '<b>YOU</b> x e']] };
  const n0 = A.RP_LIB.clips.length, best = A.rpAutoClip(R); return { best, added: A.RP_LIB.clips.length - n0, name: A.RP_LIB.clips[0] && A.RP_LIB.clips[0].clip, len: A.RP_LIB.clips[0] && A.RP_LIB.clips[0].len }; });
