/* ================================================================== armory: 32 weapons, their stats, sounds and parametric first-person models */
// Categories: ar assault rifle, smg, lmg, mr marksman, sr sniper, sg shotgun, pi pistol, la launcher.
const CATS = {
  ar: { name: 'ASSAULT RIFLES', short: 'AR', slot: 'primary' }, smg: { name: 'SUBMACHINE GUNS', short: 'SMG', slot: 'primary' },
  lmg: { name: 'LIGHT MACHINE GUNS', short: 'LMG', slot: 'primary' }, mr: { name: 'MARKSMAN RIFLES', short: 'DMR', slot: 'primary' },
  sr: { name: 'SNIPER RIFLES', short: 'SNIPER', slot: 'primary' }, sg: { name: 'SHOTGUNS', short: 'SHOTGUN', slot: 'primary' },
  pi: { name: 'PISTOLS', short: 'PISTOL', slot: 'secondary' }, la: { name: 'LAUNCHERS', short: 'LAUNCHER', slot: 'secondary' },
};
// gun sound recipe: crack (high-pass) + body (low-pass) + thump (sine sweep) [+ long tail]
const SND = {
  rifle: { hc: 5200, hg: 0.55, hd: 0.05, bc: 1800, bg: 0.55, bd: 0.2, tf: 140, tg: 0.5, td: 0.12 },
  akm: { hc: 4200, hg: 0.6, hd: 0.06, bc: 1500, bg: 0.65, bd: 0.24, tf: 115, tg: 0.6, td: 0.14 },
  battle: { hc: 3800, hg: 0.65, hd: 0.06, bc: 1300, bg: 0.75, bd: 0.3, tf: 95, tg: 0.7, td: 0.16 },
  carbine: { hc: 6000, hg: 0.5, hd: 0.045, bc: 2100, bg: 0.5, bd: 0.17, tf: 160, tg: 0.42, td: 0.1 },
  smg: { hc: 6400, hg: 0.42, hd: 0.035, bc: 2600, bg: 0.42, bd: 0.13, tf: 190, tg: 0.32, td: 0.08 },
  smg45: { hc: 5000, hg: 0.45, hd: 0.04, bc: 1900, bg: 0.5, bd: 0.16, tf: 130, tg: 0.42, td: 0.1 },
  lmg: { hc: 4400, hg: 0.6, hd: 0.06, bc: 1400, bg: 0.7, bd: 0.26, tf: 105, tg: 0.62, td: 0.15 },
  dmr: { hc: 3600, hg: 0.7, hd: 0.07, bc: 1200, bg: 0.8, bd: 0.36, tf: 90, tg: 0.75, td: 0.18, tl: 0.7 },
  sniper: { hc: 3000, hg: 0.8, hd: 0.08, bc: 900, bg: 0.95, bd: 0.5, tf: 70, tg: 0.95, td: 0.26, tl: 1.3 },
  fifty: { hc: 2400, hg: 0.9, hd: 0.1, bc: 700, bg: 1.1, bd: 0.6, tf: 52, tg: 1.1, td: 0.34, tl: 1.6 },
  shotgun: { hc: 4200, hg: 0.7, hd: 0.07, bc: 1100, bg: 1.0, bd: 0.45, tf: 80, tg: 0.8, td: 0.3 },
  autosg: { hc: 4600, hg: 0.6, hd: 0.06, bc: 1300, bg: 0.85, bd: 0.32, tf: 92, tg: 0.7, td: 0.2 },
  pistol: { hc: 5800, hg: 0.5, hd: 0.04, bc: 2600, bg: 0.4, bd: 0.14, tf: 210, tg: 0.3, td: 0.09 },
  mpistol: { hc: 6600, hg: 0.4, hd: 0.03, bc: 2900, bg: 0.36, bd: 0.11, tf: 230, tg: 0.26, td: 0.07 },
  magnum: { hc: 3600, hg: 0.75, hd: 0.06, bc: 1300, bg: 0.8, bd: 0.32, tf: 90, tg: 0.75, td: 0.18, tl: 0.6 },
  gl: { hc: 1400, hg: 0.4, hd: 0.06, bc: 500, bg: 0.7, bd: 0.18, tf: 120, tg: 0.7, td: 0.12 },
  rocket: { hc: 2400, hg: 0.5, hd: 0.2, bc: 700, bg: 0.9, bd: 0.8, tf: 60, tg: 0.7, td: 0.5, tl: 1.0 },
};
const CAT_BASE = {
  ar: { fallMin: 0.7, auto: true, head: 2.2, pellets: 1, range: 160, eff: 45, adsFov: 52, mag: 30, reload: 2.0, spread: 0.014, adsSpread: 0.0025, recoil: 0.011, move: 1, ads: 1, rum: [0.1, 0.4, 60] },
  smg: { fallMin: 0.6, auto: true, head: 1.8, pellets: 1, range: 110, eff: 22, adsFov: 56, mag: 30, reload: 1.8, spread: 0.011, adsSpread: 0.004, recoil: 0.008, move: 1.07, ads: 0.8, rum: [0.05, 0.3, 45] },
  lmg: { fallMin: 0.75, auto: true, head: 2.0, pellets: 1, range: 170, eff: 50, adsFov: 54, mag: 100, reload: 4.2, spread: 0.022, adsSpread: 0.003, recoil: 0.012, move: 0.9, ads: 1.35, rum: [0.2, 0.45, 70] },
  mr: { fallMin: 0.85, auto: false, head: 2.2, pellets: 1, range: 230, eff: 70, adsFov: 30, mag: 20, reload: 2.3, spread: 0.03, adsSpread: 0.0012, recoil: 0.025, move: 0.97, ads: 1.15, rum: [0.35, 0.5, 90] },
  sr: { fallMin: 1, auto: false, head: 2.6, pellets: 1, range: 320, eff: 120, adsFov: 12.5, mag: 5, reload: 3.0, spread: 0.06, adsSpread: 0.0004, recoil: 0.06, move: 0.92, ads: 1.4, rum: [0.7, 0.6, 160] },
  sg: { fallMin: 0.25, auto: false, head: 1.5, pellets: 9, range: 40, eff: 14, adsFov: 62, mag: 6, reload: 2.7, spread: 0.055, adsSpread: 0.038, recoil: 0.07, move: 1.0, ads: 0.95, rum: [0.8, 0.9, 160] },
  pi: { fallMin: 0.6, auto: false, head: 2.5, pellets: 1, range: 120, eff: 28, adsFov: 62, mag: 15, reload: 1.5, spread: 0.01, adsSpread: 0.003, recoil: 0.022, move: 1.08, ads: 0.7, rum: [0.1, 0.4, 60] },
  la: { fallMin: 1, auto: false, head: 1, pellets: 1, range: 200, eff: 200, adsFov: 58, mag: 1, reload: 3.2, spread: 0.01, adsSpread: 0.002, recoil: 0.05, move: 0.9, ads: 1.3, rum: [0.9, 0.7, 260] },
};
// v: viewmodel recipe (see buildProcGun). blender: use the Blender-modelled body.
const ARMORY_SRC = [
  // ---------- assault rifles
  { id: 'marc', cat: 'ar', name: 'M4A1', desc: '5.56 carbine. Balanced at every range, the safe pick.', dmg: 34, interval: 0.092, reserve: 120, reserveMax: 150, snd: 'rifle', blender: 'rifle', optic: 'reddot' },
  { id: 'kv47', cat: 'ar', name: 'AK-47', desc: '7.62×39. Hits hard and kicks hard. Rewards short bursts.', dmg: 41, head: 2.1, interval: 0.1, recoil: 0.016, spread: 0.016, reload: 2.2, reserve: 120, reserveMax: 150, snd: 'akm',
    v: { recLen: 0.3, recH: 0.072, hg: 'wood', hgLen: 0.25, bl: 0.2, stock: 'wood', mag: 'curved', body: 'metal', furn: 'wood', magM: 'metal', grip: 'wood' } },
  { id: 'vanguard', cat: 'ar', name: 'VANGUARD H', desc: '7.62 NATO battle rifle. 20 heavy rounds, long reach, slow and heavy.', dmg: 49, head: 2.0, interval: 0.125, mag: 20, eff: 60, recoil: 0.018, adsSpread: 0.002, reload: 2.3, move: 0.96, ads: 1.12, reserve: 80, reserveMax: 120, snd: 'battle',
    v: { recLen: 0.32, recH: 0.08, hg: 'quad', hgLen: 0.3, bl: 0.24, br: 0.013, stock: 'fixed', mag: 'straight', magSc: 0.8, magW: 0.04, body: 'tan', furn: 'tan', magM: 'poly' } },
  { id: 'talon', cat: 'ar', name: 'TALON BP', desc: '5.56 bullpup. Fast fire and light recoil in a compact frame. No stock to swap.', dmg: 30, interval: 0.077, recoil: 0.009, eff: 40, ads: 0.92, move: 1.02, reserve: 120, reserveMax: 150, snd: 'carbine', noSlots: ['stock'],
    v: { t: 'bullpup', recLen: 0.5, recZ0: 0.27, recH: 0.1, bl: 0.12, mag: 'straight', body: 'od', furn: 'od', magM: 'poly' } },
  { id: 'gale', cat: 'ar', name: 'M16A4', desc: 'Three-round burst 5.56. Lethal if all three land, punishing if they miss.', dmg: 38, head: 2.3, interval: 0.3, burst: 3, burstGap: 0.062, auto: false, recoil: 0.009, adsSpread: 0.002, eff: 52, reserve: 120, reserveMax: 150, snd: 'rifle',
    v: { recLen: 0.3, recH: 0.074, hg: 'slim', hgLen: 0.3, bl: 0.18, stock: 'tube', mag: 'straight', body: 'grey', furn: 'poly', magM: 'poly' } },
  { id: 'striker', cat: 'ar', name: 'MK18 CQBR', desc: 'Short-barrel 5.56 carbine. Quick to aim and move with, loses punch at range.', dmg: 31, interval: 0.083, eff: 32, ads: 0.86, move: 1.04, recoil: 0.012, reserve: 120, reserveMax: 150, snd: 'carbine',
    v: { recLen: 0.28, recH: 0.074, hg: 'quad', hgLen: 0.19, bl: 0.09, stock: 'tube', mag: 'straight', body: 'metal', furn: 'tan', magM: 'tan' } },
  { id: 'spectre', cat: 'ar', name: 'AS VAL', desc: 'Integrally suppressed 9×39 rifle. Silent and flashless; heavy subsonic rounds drop off sooner.', dmg: 36, mag: 20, interval: 0.09, eff: 34, stealth: true, spot: 0.65, recoil: 0.009, reserve: 80, reserveMax: 120, snd: 'rifle', noSlots: ['muzzle'],
    v: { recLen: 0.3, recH: 0.074, hg: 'slim', hgLen: 0.22, bl: 0.24, integral: 1, stock: 'fixed', mag: 'straight', body: 'metal', furn: 'poly', magM: 'poly' } },
  // ---------- submachine guns
  { id: 'viper', cat: 'smg', name: 'VIPER 9', desc: 'Classic roller-delayed 9 mm SMG. Accurate, controllable, dependable.', dmg: 26, interval: 0.075, reserve: 150, reserveMax: 180, snd: 'smg',
    v: { recLen: 0.27, recH: 0.068, hg: 'stub', hgLen: 0.13, bl: 0.05, br: 0.01, stock: 'tube', mag: 'curved', magSc: 0.85, magW: 0.028, body: 'metal', furn: 'poly', magM: 'metal', adsZ: -0.27 } },
  { id: 'wasp', cat: 'smg', name: 'WASP 10', desc: '.45 ACP at 1100 rounds a minute. Devastating up close, wild past ten metres.', dmg: 21, head: 1.6, interval: 0.055, mag: 30, recoil: 0.01, spread: 0.014, adsSpread: 0.006, eff: 16, reserve: 150, reserveMax: 180, snd: 'mpistol',
    v: { recLen: 0.28, recH: 0.08, recW: 0.06, hg: 'none', hgLen: 0.12, bl: 0.05, br: 0.01, stock: 'folded', mag: 'grip', body: 'grey', furn: 'poly', magM: 'metal', adsZ: -0.27 } },
  { id: 'kestrel', cat: 'smg', name: 'KESTREL 57', desc: '5.7 mm with a 50-round top magazine. Long sustained fire, slow reload. Bullpup, so no stock.', dmg: 22, interval: 0.067, mag: 50, reload: 2.6, recoil: 0.0075, reserve: 200, reserveMax: 250, snd: 'smg', noSlots: ['stock'],
    v: { t: 'bullpup', recLen: 0.46, recZ0: 0.24, recH: 0.1, recW: 0.068, bl: 0.05, br: 0.01, mag: 'top', body: 'tan', furn: 'poly', magM: 'poly', adsZ: -0.27 } },
  { id: 'bulwark', cat: 'smg', name: 'BULWARK 45', desc: 'Slow-firing .45 ACP. Hits like a rifle inside 20 metres.', dmg: 33, head: 1.9, interval: 0.092, mag: 25, recoil: 0.01, eff: 20, reserve: 125, reserveMax: 150, snd: 'smg45',
    v: { recLen: 0.3, recH: 0.1, hg: 'stub', hgLen: 0.12, bl: 0.06, br: 0.012, stock: 'skeleton', mag: 'straight', magSc: 0.85, body: 'grey', furn: 'poly', magM: 'poly', adsZ: -0.27 } },
  { id: 'hornet', cat: 'smg', name: 'HORNET PDW', desc: '4.6 mm personal defence weapon. Tiny, light, the fastest handling gun here.', dmg: 24, interval: 0.07, ads: 0.68, move: 1.1, recoil: 0.009, eff: 18, reserve: 150, reserveMax: 180, snd: 'smg',
    v: { recLen: 0.24, recH: 0.068, hg: 'quad', hgLen: 0.12, bl: 0.04, br: 0.01, stock: 'skeleton', mag: 'straight', magSc: 0.85, body: 'od', furn: 'od', magM: 'poly', adsZ: -0.27 } },
  { id: 'whisper', cat: 'smg', name: 'VIPER 9SD', desc: 'Integrally suppressed VIPER 9. Enemies struggle to find you, but the range is short.', dmg: 24, interval: 0.08, eff: 17, stealth: true, spot: 0.6, reserve: 150, reserveMax: 180, snd: 'smg', noSlots: ['muzzle'],
    v: { recLen: 0.27, recH: 0.068, hg: 'slim', hgLen: 0.12, bl: 0.2, br: 0.01, integral: 1, stock: 'tube', mag: 'curved', magSc: 0.85, magW: 0.028, body: 'metal', furn: 'poly', magM: 'metal', adsZ: -0.27 } },
  // ---------- light machine guns
  { id: 'anvil', cat: 'lmg', name: 'M249', desc: '5.56 belt-fed SAW. 100 rounds to lay down fire and keep it there. Very slow to reload.', dmg: 34, interval: 0.092, reserve: 200, reserveMax: 300, snd: 'lmg',
    v: { recLen: 0.34, recH: 0.085, hg: 'quad', hgLen: 0.3, bl: 0.22, br: 0.013, stock: 'fixed', mag: 'box', bipod: 1, feed: 1, body: 'metal', furn: 'poly', magM: 'od' } },
  { id: 'titan', cat: 'lmg', name: 'M240B', desc: '7.62 NATO general-purpose machine gun. Shreds armour, but it is a lot of gun to carry.', dmg: 45, head: 1.9, interval: 0.11, mag: 100, reload: 4.6, recoil: 0.015, eff: 58, move: 0.86, ads: 1.5, vsHeavy: 1.15, reserve: 200, reserveMax: 300, snd: 'battle',
    v: { recLen: 0.36, recH: 0.09, hg: 'shroud', hgLen: 0.3, bl: 0.26, br: 0.015, stock: 'fixed', mag: 'box', bipod: 1, feed: 1, body: 'metal', furn: 'tan', magM: 'tan' } },
  { id: 'hailstorm', cat: 'lmg', name: 'RPK', desc: '7.62×39 light machine gun with a 75-round drum. Handles like a heavy AK.', dmg: 38, interval: 0.1, mag: 75, recoil: 0.014, spread: 0.024, eff: 46, reload: 3.6, move: 0.92, ads: 1.25, reserve: 150, reserveMax: 225, snd: 'rifle',
    v: { recLen: 0.32, recH: 0.08, hg: 'shroud', hgLen: 0.28, bl: 0.2, br: 0.012, stock: 'skeleton', mag: 'drum', magSc: 1.25, body: 'grey', furn: 'poly', magM: 'metal' } },
  // ---------- marksman rifles
  { id: 'sentinel', cat: 'mr', name: 'M110', desc: '7.62 semi-auto marksman rifle with a 2.5× scope. Two hits drop most targets.', dmg: 62, interval: 0.2, reserve: 80, reserveMax: 120, snd: 'dmr', optic: 'scope25',
    v: { recLen: 0.31, recH: 0.076, hg: 'quad', hgLen: 0.34, bl: 0.22, br: 0.012, stock: 'fixed', mag: 'short', body: 'tan', furn: 'tan', magM: 'poly' } },
  { id: 'longhorn', cat: 'mr', name: 'LONGHORN 45-70', desc: '.45-70 lever action. Huge damage per shot on iron sights. You work for every round.', dmg: 82, head: 2.0, interval: 0.55, mag: 8, reload: 2.9, recoil: 0.034, adsFov: 50, adsSpread: 0.001, ads: 1.0, move: 1.0, reserve: 40, reserveMax: 64, snd: 'magnum', action: 'lever', optic: 'irons',
    v: { recLen: 0.24, recH: 0.07, hg: 'wood', hgLen: 0.24, bl: 0.32, br: 0.011, tubeMag: 1, stock: 'wood', mag: 'none', lever: 1, body: 'steel', furn: 'wood', magM: 'metal', grip: 'wood', noGrip: 1 } },
  { id: 'arbiter', cat: 'mr', name: 'MK14 EBR', desc: 'Fast-firing 7.62 marksman rifle with a 4× prism. Rewards quick follow-up shots.', dmg: 52, interval: 0.16, mag: 20, recoil: 0.021, reserve: 100, reserveMax: 140, snd: 'dmr', optic: 'acog4',
    v: { recLen: 0.31, recH: 0.078, hg: 'slim', hgLen: 0.32, bl: 0.24, br: 0.012, stock: 'fixed', mag: 'short', magSc: 1.15, body: 'metal', furn: 'od', magM: 'od' } },
  // ---------- sniper rifles
  { id: 'hawkeye', cat: 'sr', name: 'HAWKEYE 338', desc: '.338 bolt action. One shot to the chest is usually enough.', dmg: 125, interval: 1.15, reserve: 25, reserveMax: 40, snd: 'sniper', action: 'bolt', optic: 'scope6',
    v: { recLen: 0.3, recH: 0.062, round: 1, hg: 'forend', hgLen: 0.34, bl: 0.4, br: 0.012, stock: 'thumbhole', mag: 'short', magSc: 0.6, bolt: 1, body: 'metal', furn: 'od', magM: 'metal', adsZ: -0.2 } },
  { id: 'warden', cat: 'sr', name: 'WARDEN .50', desc: '.50 BMG semi-auto. Shrugs off armour. Heavy, loud, brutal recoil.', dmg: 150, head: 2.2, interval: 0.5, mag: 10, reload: 3.6, recoil: 0.085, vsHeavy: 1.5, move: 0.86, ads: 1.6, reserve: 30, reserveMax: 50, snd: 'fifty', optic: 'scope6',
    v: { recLen: 0.38, recH: 0.092, recW: 0.068, hg: 'quad', hgLen: 0.3, bl: 0.34, br: 0.017, brake: 1, stock: 'skeleton', mag: 'short', magW: 0.05, bipod: 1, body: 'grey', furn: 'poly', magM: 'metal', adsZ: -0.2 } },
  { id: 'wraith', cat: 'sr', name: 'WRAITH 308', desc: '.308 bolt action with a 3.5× scope. Light and snappy enough to quick-scope.', dmg: 100, interval: 0.9, ads: 1.1, move: 0.98, recoil: 0.05, reserve: 30, reserveMax: 45, snd: 'sniper', action: 'bolt', optic: 'scope35', adsFov: 21,
    v: { recLen: 0.28, recH: 0.06, round: 1, hg: 'forend', hgLen: 0.32, bl: 0.36, br: 0.011, stock: 'thumbhole', mag: 'short', magSc: 0.6, bolt: 1, body: 'metal', furn: 'tan', magM: 'metal', adsZ: -0.2 } },
  // ---------- shotguns
  { id: 'breacher', cat: 'sg', name: 'BREACHER 12', desc: '12-gauge pump action. Nine pellets, one decisive click.', dmg: 13, interval: 0.85, reserve: 30, reserveMax: 36, snd: 'shotgun', blender: 'shotgun', optic: 'bead', action: 'pump' },
  { id: 'rampart', cat: 'sg', name: 'RAMPART SA12', desc: '12-gauge semi-auto. Fire as fast as you pull, with a slightly wider spread.', dmg: 11, pellets: 8, interval: 0.26, mag: 7, spread: 0.06, recoil: 0.055, reload: 3.0, reserve: 40, reserveMax: 48, snd: 'autosg', optic: 'bead',
    v: { recLen: 0.3, recH: 0.08, hg: 'forend', hgLen: 0.24, bl: 0.28, br: 0.019, tubeMag: 1, stock: 'fixed', mag: 'none', body: 'metal', furn: 'poly', magM: 'poly', bead: 1 } },
  { id: 'coach', cat: 'sg', name: 'COACH GUN', desc: '12-gauge side-by-side double barrel. Two enormous shots, then a long reload.', dmg: 16, pellets: 10, interval: 0.18, mag: 2, reload: 2.2, spread: 0.06, recoil: 0.09, eff: 12, ads: 0.85, move: 1.03, reserve: 24, reserveMax: 30, snd: 'shotgun', optic: 'bead', noSlots: ['magazine', 'underbarrel'],
    v: { t: 'double' } },
  { id: 'mauler', cat: 'sg', name: 'MAULER 12', desc: 'Drum-fed full-auto 12 gauge. A wall of lead, briefly.', dmg: 9, pellets: 8, interval: 0.2, auto: true, mag: 20, spread: 0.065, recoil: 0.045, reload: 3.2, move: 0.95, ads: 1.1, reserve: 36, reserveMax: 48, snd: 'autosg', optic: 'bead',
    v: { recLen: 0.32, recH: 0.084, hg: 'quad', hgLen: 0.2, bl: 0.14, br: 0.02, stock: 'fixed', mag: 'drum', magSc: 1.05, body: 'poly', furn: 'poly', magM: 'metal', bead: 1 } },
  // ---------- pistols
  { id: 'sidearm', cat: 'pi', name: 'SERVICE 9', desc: '9 mm service pistol. Reliable, 17 rounds.', dmg: 30, interval: 0.15, mag: 17, reserve: 51, reserveMax: 85, snd: 'pistol', blender: 'pistol', optic: 'irons_p' },
  { id: 'magnum', cat: 'pi', name: 'REVOLVER 357', desc: '.357 Magnum six-shot revolver. Each round hits like a rifle.', dmg: 68, head: 2.2, interval: 0.4, mag: 6, reload: 2.4, recoil: 0.05, spread: 0.014, eff: 32, reserve: 30, reserveMax: 42, snd: 'magnum', optic: 'irons_p',
    v: { t: 'revolver' } },
  { id: 'stinger', cat: 'pi', name: 'STINGER 9A', desc: 'Full-auto 9 mm machine pistol. A panic button for when the primary runs dry.', dmg: 19, head: 1.8, interval: 0.06, auto: true, mag: 19, recoil: 0.012, spread: 0.016, adsSpread: 0.006, eff: 14, reserve: 80, reserveMax: 120, snd: 'mpistol', optic: 'irons_p',
    v: { t: 'pistol', sl: 0.18, sh: 0.04, ext: 1, comp: 1, slideM: 'grey', frameM: 'poly' } },
  { id: 'deadeye', cat: 'pi', name: 'DEADEYE 50', desc: '.50 AE semi-auto hand cannon. Seven rounds of serious recoil.', dmg: 58, head: 2.3, interval: 0.3, mag: 7, reload: 1.9, recoil: 0.045, spread: 0.014, eff: 30, move: 1.04, ads: 0.82, reserve: 35, reserveMax: 49, snd: 'magnum', optic: 'irons_p',
    v: { t: 'pistol', sl: 0.26, sh: 0.05, sw: 0.038, slideM: 'steel', frameM: 'steel' } },
  // ---------- launchers
  { id: 'thumper', cat: 'la', name: 'M32 MGL', desc: 'Six-shot 40 mm grenade launcher. Lobbed shells burst on impact.', dmg: 140, interval: 0.6, mag: 6, reload: 4.0, recoil: 0.04, reserve: 12, reserveMax: 18, snd: 'gl', proj: 'grenade', speed: 30, grav: 9, blast: 5.5, optic: 'irons_p', adsFov: 60,
    v: { t: 'thumper' } },
  { id: 'hellfire', cat: 'la', name: 'RPG-7', desc: 'Shoulder-fired rocket. Flat, fast and huge. One shot, then a long reload.', dmg: 190, interval: 1, mag: 1, reload: 3.4, recoil: 0.06, reserve: 4, reserveMax: 6, snd: 'rocket', proj: 'rocket', speed: 48, grav: 0, blast: 7.5, move: 0.86, ads: 1.4, optic: 'irons_p', adsFov: 55, noSlots: ['magazine'],
    v: { t: 'rocket' } },
];
// balance pass (1.2.0): close-range body-shot kill times line up by class; range and handling separate the guns
// Balance (100 health; chest x1.1, stomach x1, limbs x0.7-0.8; damage parts add at most +10%):
//   ARs and LMGs kill in 4 chest shots even with damage parts (battle rifle / burst rifle: 3, slower fire),
//   SMGs in 5 chest shots up close (Bulwark 4, Wasp 6) and fall off hard; pistols are backups: 5 chest shots (revolver 2, Deadeye 3)
const BALANCE = {
  marc: { dmg: 27, interval: 0.088 }, kv47: { dmg: 27.5, interval: 0.1, fallMin: 0.8, eff: 50 }, vanguard: { dmg: 40, interval: 0.133 }, talon: { dmg: 24, interval: 0.075 },
  gale: { dmg: 36 }, striker: { dmg: 25, interval: 0.081 }, spectre: { dmg: 26, interval: 0.086 },
  viper: { dmg: 20, interval: 0.066 }, wasp: { dmg: 16, interval: 0.055 }, kestrel: { dmg: 20, interval: 0.064 }, bulwark: { dmg: 27, interval: 0.092 }, hornet: { dmg: 20, interval: 0.068 }, whisper: { dmg: 19, interval: 0.075 },
  anvil: { dmg: 27, interval: 0.092 }, titan: { dmg: 27.5, interval: 0.107, fallMin: 0.8 }, hailstorm: { dmg: 27, interval: 0.092 },
  sentinel: { dmg: 40, interval: 0.2 }, arbiter: { dmg: 40, interval: 0.16 }, longhorn: { dmg: 80 },
  warden: { dmg: 92 },
  sidearm: { dmg: 20, head: 2.0, interval: 0.17, spread: 0.022, adsSpread: 0.0045, eff: 22, fallMin: 0.5 },
  magnum: { dmg: 46, head: 2.0, interval: 0.45, spread: 0.026, eff: 24, fallMin: 0.5 },
  stinger: { dmg: 14, head: 1.6, interval: 0.08, spread: 0.026, adsSpread: 0.008, eff: 12, fallMin: 0.5 },
  deadeye: { dmg: 40, head: 1.9, interval: 0.36, spread: 0.024, eff: 24, fallMin: 0.5, move: 1.02 },
};
// DAMAGE RANGE per gun: [max damage range in metres, damage left far away (reached at 2x that range)].
// By class: SMGs 14-22 m and drop to 55-60%, ARs 30-55 m / 70-80%, LMGs 44-58 m / 75-80%, marksman 60-75 m / 85%,
// snipers never drop, shotguns 9-14 m and fall to 25%, pistols 12-26 m / 50%.
const RANGES = {
  marc: [45, 0.7], kv47: [50, 0.8], vanguard: [60, 0.8], talon: [38, 0.7], gale: [55, 0.75], striker: [32, 0.7], spectre: [30, 0.65],
  viper: [20, 0.6], wasp: [14, 0.55], kestrel: [22, 0.6], bulwark: [18, 0.6], hornet: [17, 0.55], whisper: [16, 0.55],
  anvil: [48, 0.75], titan: [58, 0.8], hailstorm: [44, 0.75],
  sentinel: [70, 0.85], longhorn: [60, 0.85], arbiter: [65, 0.85],
  hawkeye: [120, 1], warden: [120, 1], wraith: [120, 1],
  breacher: [12, 0.25], rampart: [11, 0.25], coach: [9, 0.2], mauler: [14, 0.3],
  sidearm: [22, 0.5], magnum: [24, 0.5], stinger: [12, 0.5], deadeye: [26, 0.5],
};
// more kick: assault rifles +35%, SMGs +30%, LMGs +80% (they also climb more the longer you hold the trigger)
const RECOIL_MUL = { ar: 1.35, smg: 1.3, lmg: 1.8 };
const ARMORY = ARMORY_SRC.map(src => {
  const rg = RANGES[src.id], d = Object.assign({ move: 1, ads: 1 }, CAT_BASE[src.cat], src, BALANCE[src.id] || {}, rg ? { eff: rg[0], fallMin: rg[1] } : {});
  d.recoil *= RECOIL_MUL[d.cat] || 1;
  d.sfxP = SND[d.snd] || SND.rifle; d.base = d; d.magSize = d.mag;
  return Object.freeze(d);
});
const ARM = {}; ARMORY.forEach(d => { ARM[d.id] = d; });
const armoryBy = cat => ARMORY.filter(d => d.cat === cat);

/* ------------------------------------------------------------------ parametric first-person models */
function armoryMats() {
  if (VM.tan) return;
  const std = o => new THREE.MeshStandardMaterial(o);
  VM.tan = std({ color: C(0x857555), metalness: 0.08, roughness: 0.72 });
  VM.od = std({ color: C(0x434a33), metalness: 0.08, roughness: 0.72 });
  VM.grey = std({ color: C(0x4d5054), metalness: 0.6, roughness: 0.42, envMapIntensity: 1.2 });
  VM.rubber = std({ color: C(0x111214), metalness: 0, roughness: 0.9 });
  if (typeof addFresnelAll === 'function') { try { addFresnelAll({ a: VM.tan, b: VM.od, c: VM.grey }); } catch (e) {} }
}
const DOWN = new THREE.Vector3(0, -1, 0), UPV = new THREE.Vector3(0, 1, 0);
function pistolLeftHand() {
  return seg([
    Pt(Bx(0.05, 0.075, 0.06), VM.glove, -0.04, -0.062, 0.045), Pt(Bx(0.012, 0.022, 0.06), VM.glove, 0.0, -0.035, 0.03), Pt(Bx(0.012, 0.022, 0.06), VM.glove, 0.0, -0.058, 0.03), Pt(Bx(0.012, 0.02, 0.05), VM.glove, 0.0, -0.08, 0.03),
    Pt(Bx(0.018, 0.02, 0.07), VM.glove, -0.02, -0.01, -0.03, 0, 0, 0.1),
    tube([-0.045, -0.07, 0.07], [-0.15, -0.22, 0.46], 0.034, 0.05, VM.sleeve),
  ], 'handL');
}
// Long guns: receiver + handguard + barrel + stock + grip + magazine, with anchors for attachments.
function procRifle(def) {
  const s = Object.assign({ t: 'rifle', recLen: 0.3, recH: 0.075, recW: 0.058, recZ0: 0.03, hg: 'quad', hgLen: 0.3, hgW: 0.062, bl: 0.2, br: 0.011, stock: 'fixed', mag: 'straight', magSc: 1, magW: 0.033, body: 'metal', furn: 'poly', magM: 'poly', adsZ: -0.3 }, def.v);
  const m = k => VM[k] || VM.poly, B = m(s.body), F = m(s.furn), MG = m(s.magM), St = VM.steel, D = VM.poly, Gr = m(s.grip || s.furn);
  const g = new THREE.Group(), body = [], irons = [], bull = s.t === 'bullpup';
  const yC = 0.012, top = yC + s.recH / 2, z0 = s.recZ0, zF = z0 - s.recLen;
  // receiver
  if (s.round) { body.push(ZCyl(s.recH / 2, s.recLen, B, 0, yC, z0, 14)); body.push(Pt(Bx(s.recW * 0.85, 0.03, s.recLen * 0.9), B, 0, yC - s.recH * 0.35, z0 - s.recLen / 2)); }
  else body.push(Pt(Bx(s.recW, s.recH, s.recLen), B, 0, yC, z0 - s.recLen / 2));
  if (bull) {   // bullpup shell: tall body, cheek piece and butt are part of it
    body.push(Pt(Bx(s.recW + 0.008, 0.05, s.recLen * 0.72), F, 0, yC - s.recH / 2 - 0.02, z0 - s.recLen * 0.36));
    body.push(Pt(Bx(s.recW + 0.012, s.recH + 0.06, 0.03), VM.rubber, 0, yC - 0.02, z0 + 0.012));
    body.push(Pt(Bx(s.recW * 0.9, 0.02, s.recLen * 0.3), F, 0, top + 0.004, z0 - s.recLen * 0.18));
  } else {
    body.push(Pt(Bx(s.recW * 0.92, s.recH * 0.85, s.recLen * 0.62), B, 0, yC - s.recH * 0.62, z0 - 0.04 - s.recLen * 0.31));   // lower receiver
    body.push(Pt(Bx(0.022, 0.026, 0.05), B, s.recW / 2 + 0.008, yC + 0.008, z0 - s.recLen * 0.62));   // ejection port cover / charging handle
  }
  // top rail along the receiver (optics sit on it)
  const railY = top + (s.round ? 0.012 : 0.0065);
  if (s.round) { body.push(Pt(Bx(0.022, 0.012, s.recLen * 0.8), St, 0, top + 0.004, z0 - s.recLen * 0.5)); }
  else { body.push(Pt(Bx(0.026, 0.012, s.recLen * (bull ? 0.55 : 0.95)), St, 0, top, z0 - s.recLen * (bull ? 0.7 : 0.5))); for (let i = 0; i < 6; i++) body.push(Pt(Bx(0.028, 0.004, 0.008), D, 0, top + 0.006, z0 - s.recLen * (bull ? 0.45 : 0.1) - i * s.recLen * 0.08)); }
  if (s.feed) body.push(Pt(Bx(s.recW + 0.006, 0.02, s.recLen * 0.45), B, 0, top + 0.012, z0 - s.recLen * 0.62));
  // handguard
  const hgLen = bull ? 0 : s.hg === 'none' ? 0 : s.hgLen, zH = zF - hgLen, hy = yC - 0.008;
  if (!bull) {
    if (s.hg === 'quad') {
      body.push(Pt(Bx(s.hgW, 0.068, hgLen), F, 0, hy, zF - hgLen / 2));
      body.push(Pt(Bx(0.024, 0.01, hgLen), St, 0, hy + 0.038, zF - hgLen / 2));
      for (const sx of [-1, 1]) body.push(Pt(Bx(0.008, 0.016, hgLen * 0.85), St, sx * (s.hgW / 2 + 0.003), hy, zF - hgLen / 2));
    } else if (s.hg === 'slim') {
      body.push(ZCyl(0.031, hgLen, F, 0, hy, zF, 12));
      for (let i = 0; i < 4; i++) body.push(Pt(Bx(0.066, 0.012, 0.03), D, 0, hy, zF - hgLen * (0.15 + i * 0.22)));
      body.push(Pt(Bx(0.022, 0.01, hgLen), St, 0, hy + 0.032, zF - hgLen / 2));
    } else if (s.hg === 'wood') {
      body.push(Pt(Bx(0.056, 0.05, hgLen), F, 0, hy - 0.012, zF - hgLen / 2));
      body.push(ZCyl(0.015, hgLen * 0.85, s.tubeMag ? St : F, 0, hy + 0.028, zF, 10));
    } else if (s.hg === 'shroud') {
      body.push(ZCyl(0.034, hgLen, D, 0, yC, zF, 14));
      for (let i = 0; i < 5; i++) body.push(ZCyl(0.036, 0.012, St, 0, yC, zF - 0.02 - i * hgLen * 0.2, 14));
      body.push(Pt(Bx(0.05, 0.04, hgLen * 0.5), F, 0, yC - 0.04, zF - hgLen * 0.25));
    } else if (s.hg === 'stub') {
      body.push(Pt(Bx(0.056, 0.06, hgLen), F, 0, hy, zF - hgLen / 2));
    } else if (s.hg === 'forend') {   // bolt guns / shotguns: wooden or polymer fore-end under the barrel
      body.push(Pt(Bx(0.058, 0.05, hgLen), F, 0, yC - 0.022, zF - hgLen / 2));
      body.push(Pt(Bx(0.05, 0.02, hgLen * 0.9), F, 0, yC - 0.05, zF - hgLen * 0.45));
    }
  }
  if (s.tubeMag) body.push(ZCyl(0.014, hgLen + s.bl * 0.7, St, 0, yC - (s.hg === 'forend' ? 0.006 : 0.024), zF - 0.01, 10));
  // barrel
  const brlZ0 = bull ? zF : zH + (s.hg === 'shroud' || s.hg === 'none' ? 0 : 0.03), muzzle = (bull ? zF : zH) - s.bl;
  if (s.integral) body.push(ZCyl(s.br + 0.013, brlZ0 - muzzle, D, 0, yC, brlZ0, 16));
  else body.push(ZCyl(s.br, brlZ0 - muzzle, s.round || s.hg === 'forend' ? B : St, 0, yC, brlZ0, 10));
  if (!s.integral && s.bl > 0.04) body.push(ZCyl(s.br * 1.5, 0.045, B, 0, yC, muzzle + 0.045, 10));   // flash hider
  if (s.brake) { body.push(Pt(Bx(0.05, 0.03, 0.07), B, 0, yC, muzzle + 0.035)); }
  // irons: folding front post + rear aperture (hidden when an optic is mounted)
  const fz = bull ? zF + 0.03 : zH + 0.02;
  if (s.bead) irons.push(Pt(Sp(0.0045, 6, 5), VM.brass, 0, railY - 0.002, muzzle + 0.02));
  else {
    irons.push(Pt(Bx(0.024, 0.016, 0.02), B, 0, railY + 0.002, fz), Pt(Bx(0.005, 0.03, 0.006), B, 0, railY + 0.022, fz));
    irons.push(Pt(Bx(0.032, 0.024, 0.018), B, 0, railY + 0.008, z0 - (bull ? s.recLen * 0.45 : 0.03)), Pt(Bx(0.008, 0.016, 0.01), B, -0.009, railY + 0.026, z0 - (bull ? s.recLen * 0.45 : 0.03)), Pt(Bx(0.008, 0.016, 0.01), B, 0.009, railY + 0.026, z0 - (bull ? s.recLen * 0.45 : 0.03)));
  }
  // grip + trigger guard
  const gz = bull ? zF + s.recLen * 0.42 : z0 - 0.02;
  if (!s.noGrip) body.push(Pt(Bx(0.038, 0.1, 0.048), Gr, 0, yC - s.recH / 2 - 0.05 - (bull ? 0.035 : 0), gz, 0.36));
  else body.push(Pt(Bx(0.04, 0.08, 0.1), Gr, 0, yC - 0.05, z0 + 0.04, -0.4));
  body.push(Pt(Bx(0.01, 0.028, 0.075), B, 0, yC - s.recH / 2 - (bull ? 0.06 : 0.025), gz - 0.045));
  // stock
  const so = z0;
  if (!bull) {
    if (s.stock === 'fixed') { body.push(ZCyl(0.02, 0.12, B, 0, yC, so + 0.12)); body.push(Pt(Bx(0.048, 0.085, 0.18), F, 0, yC - 0.014, so + 0.16)); body.push(Pt(Bx(0.05, 0.1, 0.02), VM.rubber, 0, yC - 0.02, so + 0.255)); }
    else if (s.stock === 'skeleton') { body.push(Pt(Bx(0.012, 0.012, 0.22), B, 0, yC + 0.02, so + 0.11)); body.push(Pt(Bx(0.012, 0.012, 0.22), B, 0, yC - 0.045, so + 0.11, -0.12)); body.push(Pt(Bx(0.046, 0.1, 0.02), VM.rubber, 0, yC - 0.015, so + 0.22)); }
    else if (s.stock === 'wood') { body.push(Pt(Bx(0.046, 0.06, 0.12), F, 0, yC - 0.008, so + 0.06, 0.06)); body.push(Pt(Bx(0.05, 0.1, 0.16), F, 0, yC - 0.035, so + 0.18, 0.12)); body.push(Pt(Bx(0.052, 0.11, 0.015), VM.rubber, 0, yC - 0.045, so + 0.262, 0.12)); }
    else if (s.stock === 'tube') { body.push(ZCyl(0.015, 0.22, B, 0, yC + 0.004, so + 0.22)); body.push(Pt(Bx(0.012, 0.012, 0.2), B, 0, yC - 0.035, so + 0.1, -0.1)); body.push(Pt(Bx(0.044, 0.085, 0.022), VM.rubber, 0, yC - 0.015, so + 0.225)); }
    else if (s.stock === 'folded') { body.push(Pt(Bx(0.01, 0.03, 0.26), B, -s.recW / 2 - 0.008, yC - 0.01, so - 0.12)); body.push(Pt(Bx(0.012, 0.06, 0.02), B, -s.recW / 2 - 0.008, yC - 0.02, so - 0.25)); }
    else if (s.stock === 'thumbhole') { body.push(Pt(Bx(0.05, 0.05, 0.2), F, 0, yC - 0.002, so + 0.1)); body.push(Pt(Bx(0.05, 0.03, 0.16), F, 0, yC - 0.085, so + 0.14, 0.18)); body.push(Pt(Bx(0.052, 0.12, 0.06), F, 0, yC - 0.035, so + 0.21)); body.push(Pt(Bx(0.04, 0.02, 0.12), F, 0, yC + 0.034, so + 0.15)); body.push(Pt(Bx(0.054, 0.125, 0.018), VM.rubber, 0, yC - 0.035, so + 0.247)); }
  }
  if (s.bipod) for (const sx of [-1, 1]) body.push(Pt(Bx(0.008, 0.008, 0.2), St, sx * 0.012, hy - 0.04, zH + 0.08));
  g.add(seg(body, 'body'));
  const ironsG = seg(irons, 'irons'); g.add(ironsG);
  // magazine group (moves on reload)
  const magG = new THREE.Group(), mp = [];
  let magBase, magDir = DOWN;
  if (s.mag === 'top') { magBase = new THREE.Vector3(0, top + 0.004, zF + s.recLen * 0.55); magDir = UPV; mp.push(Pt(Bx(s.recW * 0.85, 0.022, s.recLen * 0.6), MG, 0, 0, 0)); mp.push(Pt(Bx(s.recW * 0.5, 0.004, s.recLen * 0.5), VM.brass, 0, 0.011, 0)); }
  else if (s.mag === 'grip') { magBase = new THREE.Vector3(0, yC - s.recH / 2 - 0.1, gz + 0.03); mp.push(Pt(Bx(0.03, 0.05, 0.04), MG, 0, -0.012, 0, 0.36)); mp.push(Pt(Bx(0.034, 0.012, 0.046), D, 0, -0.04, 0.008, 0.36)); }
  else if (s.mag !== 'none') {
    const mz = bull ? gz + 0.12 : z0 - s.recLen * 0.55;
    magBase = new THREE.Vector3(0, yC - s.recH / 2 - (bull ? 0.06 : 0.04) + 0.0, mz);
    const sc = s.magSc, w = s.magW;
    if (s.mag === 'straight') { mp.push(Pt(Bx(w, 0.12 * sc, 0.062), MG, 0, -0.06 * sc, -0.008 * sc, 0.12)); mp.push(Pt(Bx(w + 0.004, 0.014, 0.068), D, 0, -0.12 * sc, -0.016 * sc, 0.12)); }
    else if (s.mag === 'curved') { mp.push(Pt(Bx(w, 0.075 * sc, 0.064), MG, 0, -0.036 * sc, 0, 0.12)); mp.push(Pt(Bx(w, 0.08 * sc, 0.062), MG, 0, -0.105 * sc, -0.022 * sc, 0.42)); for (let i = 0; i < 3; i++) mp.push(Pt(Bx(w + 0.002, 0.004, 0.066), D, 0, -0.03 - i * 0.03 * sc, -0.004 * i, 0.12 + i * 0.12)); }
    else if (s.mag === 'short') { mp.push(Pt(Bx(w, 0.06 * sc, 0.07), MG, 0, -0.03 * sc, 0, 0.06)); mp.push(Pt(Bx(w + 0.004, 0.01, 0.074), D, 0, -0.06 * sc, -0.002, 0.06)); }
    else if (s.mag === 'box') { magBase.x = -0.012; mp.push(Pt(Bx(0.07, 0.1, 0.11), MG, -0.01, -0.05, 0)); mp.push(Pt(Bx(0.072, 0.012, 0.112), D, -0.01, -0.004, 0)); mp.push(Pt(Bx(0.02, 0.02, 0.05), VM.brass, 0.02, 0.01, 0)); }
    else if (s.mag === 'drum') { mp.push(Pt(Bx(w, 0.05, 0.06), MG, 0, -0.025, 0)); mp.push(Pt(Cy(0.06 * sc, 0.06 * sc, 0.06, 20), MG, 0, -0.06 - 0.055 * (sc - 1), 0.005, 0, 0, HALF)); mp.push(Pt(Cy(0.03, 0.03, 0.066, 12), D, 0, -0.06 - 0.055 * (sc - 1), 0.005, 0, 0, HALF)); }
  }
  if (mp.length) { magG.position.copy(magBase); magG.add(seg(mp, 'mag')); g.add(magG); }
  // hands
  const hlz = bull ? zF + s.recLen * 0.12 : s.hg === 'none' ? zF + 0.06 : zF - Math.min(hgLen * 0.5, 0.18);
  const handL = makeHandL(0, s.hg === 'shroud' ? yC - 0.018 : hy - (s.hg === 'forend' ? 0.02 : 0.004), hlz, 1); g.add(handL);
  g.add(makeHandR(0, yC - s.recH / 2 - (bull ? 0.083 : 0.048), gz + 0.015));
  // moving parts
  let bolt = null, lever = null;
  if (s.bolt) { bolt = new THREE.Group(); bolt.position.set(s.recW / 2, yC + 0.004, z0 - 0.06); bolt.add(seg([Pt(Cy(0.005, 0.005, 0.05, 6), St, 0.022, -0.004, 0, 0, 0, HALF), Pt(Sp(0.011, 8, 6), VM.poly, 0.048, -0.012, 0)], 'bolt')); g.add(bolt); }
  if (s.lever) { lever = new THREE.Group(); lever.position.set(0, yC - s.recH / 2, z0 - 0.04); lever.add(seg([Pt(Bx(0.008, 0.01, 0.1), St, 0, -0.012, 0.03), Pt(Bx(0.008, 0.05, 0.01), St, 0, -0.035, 0.085), Pt(Bx(0.008, 0.008, 0.06), St, 0, -0.06, 0.055)], 'lever')); g.add(lever); }
  const len = -muzzle, sightIr = s.bead ? railY + 0.004 : railY + 0.036;
  g.userData = {
    mag: mp.length ? magG : null, magBase: magBase ? magBase.clone() : null, magDir, handL, handLBase: handL.position.clone(), magReach: magBase ? clamp(magBase.z - hlz, 0.05, 0.4) : 0.08,
    len, sightY: sightIr, adsZ: s.adsZ, irons: ironsG, bolt, boltZ: bolt ? bolt.position.z : 0, lever,
    railY, opticZ: bull ? zF + s.recLen * 0.28 : z0 - s.recLen * 0.45, muzzleY: yC, barrelR: s.br + (s.integral ? 0.013 : 0), barrelBase: brlZ0 + 0.0,
    underY: s.hg === 'shroud' ? yC - 0.034 : hy - (s.hg === 'forend' ? 0.05 : 0.035), underZ: bull ? zF + 0.02 : zF - hgLen * 0.62, laser: [s.hgW / 2 + 0.012, hy, bull ? zF + 0.05 : zH + Math.min(0.12, hgLen * 0.4)],
    stockZ: z0, stockY: yC, bull, magStyle: s.mag, tube: !!s.tubeMag,
  };
  return g;
}
function procPistol(def) {
  const s = Object.assign({ sl: 0.2, sh: 0.042, sw: 0.032, slideM: 'metal', frameM: 'poly' }, def.v);
  const g = new THREE.Group(), SM = VM[s.slideM] || VM.metal, FM = VM[s.frameM] || VM.poly, St = VM.steel;
  const sy = 0.011 + s.sh / 2, top = sy + s.sh / 2;
  const slide = seg([Pt(Bx(s.sw, s.sh, s.sl), SM, 0, sy, 0.04 - s.sl / 2), Pt(Bx(s.sw + 0.002, 0.008, 0.02), St, 0, top - 0.003, 0.02), Pt(Bx(0.008, 0.014, 0.012), SM, 0, top + 0.006, 0.05 - s.sl), ZCyl(0.008, 0.03, St, 0, sy, 0.05 - s.sl)].concat(
    Array.from({ length: 5 }, (_, i) => Pt(Bx(s.sw + 0.002, s.sh * 0.6, 0.003), FM, 0, sy, 0.025 - i * 0.008))), 'slide');
  g.add(slide);
  const fr = [Pt(Bx(s.sw - 0.002, 0.03, s.sl * 0.92), FM, 0, -0.004, 0.04 - s.sl * 0.48), Pt(Bx(0.032, 0.095, 0.052), FM, 0, -0.062, 0.04, 0.2), Pt(Bx(0.01, 0.026, 0.07), FM, 0, -0.03, -0.045), Pt(Bx(0.008, 0.02, 0.01), St, 0, -0.022, -0.012), Pt(Bx(0.012, 0.02, 0.02), St, 0, top + 0.004, 0.035)];
  if (s.comp) fr.push(Pt(Bx(s.sw + 0.006, s.sh + 0.006, 0.04), FM, 0, sy, 0.02 - s.sl));
  g.add(seg(fr, 'frame'));
  const magG = new THREE.Group(); const mb = new THREE.Vector3(0, -0.108, 0.062); magG.position.copy(mb);
  magG.add(seg(s.ext ? [Pt(Bx(0.028, 0.11, 0.044), VM.metal, 0, -0.04, -0.002, 0.2), Pt(Bx(0.032, 0.012, 0.05), VM.poly, 0, -0.095, 0.01, 0.2)] : [Pt(Bx(0.034, 0.012, 0.056), VM.metal, 0, -0.002, 0, 0.2)], 'mag')); g.add(magG);
  g.add(makeHandR(0, -0.05, 0.04)); const handL = pistolLeftHand(); g.add(handL);
  g.userData = { slide, mag: magG, magBase: mb.clone(), magDir: DOWN, magReach: 0.04, handL, handLBase: handL.position.clone(), len: s.sl - 0.04 + (s.comp ? 0.02 : 0), sightY: top + 0.012, adsZ: -0.28, railY: top, opticZ: 0.0, muzzleY: sy, barrelR: 0.009, laser: [0, -0.03, -0.11], underY: -0.03, underZ: -0.1, pistol: true };
  return g;
}
function procRevolver() {
  const g = new THREE.Group(), M = VM.steel, Dk = VM.metal, W = VM.wood;
  g.add(seg([Pt(Bx(0.03, 0.05, 0.1), M, 0, 0.012, -0.01), Pt(Bx(0.026, 0.012, 0.13), M, 0, 0.05, -0.04), ZCyl(0.012, 0.18, M, 0, 0.036, -0.07, 12), Pt(Bx(0.018, 0.022, 0.17), M, 0, 0.022, -0.155),
    Pt(Bx(0.006, 0.014, 0.012), Dk, 0, 0.057, -0.235), Pt(Bx(0.012, 0.012, 0.012), Dk, 0, 0.058, 0.035), Pt(Bx(0.01, 0.02, 0.018), Dk, 0, 0.045, 0.05, -0.4),
    Pt(Bx(0.034, 0.1, 0.05), W, 0, -0.06, 0.055, 0.32), Pt(Bx(0.008, 0.02, 0.01), Dk, 0, -0.02, 0.0), Pt(Bx(0.01, 0.024, 0.06), M, 0, -0.026, -0.005)], 'frame'));
  const cyl = new THREE.Group(); cyl.position.set(0, 0.0, -0.025);
  const cp = [ZCyl(0.027, 0.055, Dk, 0, 0.024, 0.027, 14)]; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; cp.push(ZCyl(0.006, 0.056, VM.poly, Math.cos(a) * 0.018, 0.024 + Math.sin(a) * 0.018, 0.0275, 6)); }
  cyl.add(seg(cp, 'cyl')); g.add(cyl);
  g.add(makeHandR(0, -0.045, 0.05)); const handL = pistolLeftHand(); handL.position.z = 0.01; g.add(handL);
  g.userData = { cyl, handL, handLBase: handL.position.clone(), len: 0.24, sightY: 0.066, adsZ: -0.28, railY: 0.056, opticZ: -0.04, muzzleY: 0.036, barrelR: 0.012, laser: [0, -0.008, -0.13], underY: 0.01, underZ: -0.12, pistol: true, revolver: true };
  return g;
}
function procDouble() {
  const g = new THREE.Group(), M = VM.metal, W = VM.wood, St = VM.steel;
  g.add(seg([Pt(Bx(0.06, 0.06, 0.14), M, 0, 0.0, -0.02), Pt(Bx(0.04, 0.1, 0.05), W, 0, -0.06, 0.08, 0.38), Pt(Bx(0.012, 0.03, 0.075), M, 0, -0.045, 0.02),
    Pt(Bx(0.048, 0.07, 0.14), W, 0, -0.01, 0.13, 0.08), Pt(Bx(0.052, 0.1, 0.14), W, 0, -0.035, 0.24, 0.12), Pt(Bx(0.054, 0.11, 0.015), VM.rubber, 0, -0.045, 0.312, 0.12), Pt(Bx(0.012, 0.016, 0.02), St, 0, 0.034, 0.03)], 'body'));
  const brk = new THREE.Group(); brk.position.set(0, -0.012, -0.08);
  const bp = []; for (const sx of [-1, 1]) bp.push(ZCyl(0.016, 0.6, St, sx * 0.017, 0.032, 0.0, 12)); bp.push(Pt(Bx(0.012, 0.008, 0.6), St, 0, 0.052, -0.3), Pt(Sp(0.004, 6, 5), VM.brass, 0, 0.058, -0.59), Pt(Bx(0.056, 0.04, 0.24), W, 0, 0.0, -0.15));
  brk.add(seg(bp, 'barrels'));
  const hl = makeHandL(0, 0.006, -0.17, 1); brk.add(hl); g.add(brk);
  g.add(makeHandR(0, -0.065, 0.095));
  g.userData = { brk, len: 0.68, sightY: 0.074, adsZ: -0.31, railY: 0.07, opticZ: -0.06, muzzleY: 0.02, barrelR: 0.03, laser: [0.04, 0.0, -0.3], underY: -0.04, underZ: -0.25, double: true };
  return g;
}
function procThumper() {
  const g = new THREE.Group(), M = VM.metal, Pl = VM.poly, St = VM.steel, O = VM.od;
  g.add(seg([ZCyl(0.032, 0.36, M, 0, 0.02, -0.1, 16), ZCyl(0.036, 0.03, Pl, 0, 0.02, -0.43, 16), Pt(Bx(0.05, 0.05, 0.16), O, 0, -0.01, 0.04), Pt(Bx(0.04, 0.1, 0.05), Pl, 0, -0.07, 0.08, 0.36), Pt(Bx(0.01, 0.028, 0.07), M, 0, -0.04, 0.03),
    ZCyl(0.015, 0.2, St, 0, 0.0, 0.32), Pt(Bx(0.012, 0.012, 0.18), St, 0, -0.045, 0.2, -0.12), Pt(Bx(0.05, 0.1, 0.022), VM.rubber, 0, -0.02, 0.32), Pt(Bx(0.032, 0.11, 0.035), Pl, 0, -0.06, -0.27, 0.15),
    Pt(Bx(0.024, 0.012, 0.12), St, 0, 0.058, 0.0), Pt(Bx(0.006, 0.028, 0.006), M, 0, 0.068, -0.25), Pt(Bx(0.03, 0.022, 0.01), M, 0, 0.07, 0.04)], 'body'));
  const cyl = new THREE.Group(); cyl.position.set(0, -0.012, -0.03);
  const cp = [ZCyl(0.058, 0.13, O, 0, 0, 0.065, 16)]; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.5; cp.push(ZCyl(0.014, 0.135, VM.brass, Math.cos(a) * 0.036, Math.sin(a) * 0.036, 0.067, 8)); }
  cyl.add(seg(cp, 'cyl')); g.add(cyl);
  const handL = makeHandL(0, -0.03, -0.25, 1); g.add(handL); g.add(makeHandR(0, -0.07, 0.095));
  g.userData = { cyl, cylSpin: true, handL, handLBase: handL.position.clone(), magReach: 0.2, len: 0.46, sightY: 0.08, adsZ: -0.3, railY: 0.064, opticZ: 0, muzzleY: 0.02, barrelR: 0.032 };
  return g;
}
function procRocket() {
  const g = new THREE.Group(), O = VM.od, Pl = VM.poly, St = VM.steel;
  g.add(seg([ZCyl(0.05, 0.72, O, 0, 0.04, 0.16, 18), ZCyl(0.056, 0.05, Pl, 0, 0.04, 0.17, 18), ZCyl(0.056, 0.04, Pl, 0, 0.04, -0.52, 18), ZCyl(0.052, 0.06, Pl, 0, 0.04, -0.02, 18),
    Pt(Bx(0.036, 0.1, 0.05), Pl, 0, -0.05, 0.08, 0.3), Pt(Bx(0.034, 0.1, 0.04), Pl, 0, -0.05, -0.2, 0.15), Pt(Bx(0.01, 0.028, 0.06), St, 0, -0.03, 0.04),
    Pt(Bx(0.016, 0.03, 0.03), St, 0, 0.1, 0.1), Pt(Bx(0.012, 0.016, 0.01), St, -0.007, 0.12, 0.1), Pt(Bx(0.006, 0.03, 0.01), St, 0, 0.11, -0.3), Pt(Bx(0.02, 0.012, 0.06), St, 0, 0.094, -0.3)], 'body'));
  const rocket = seg([Pt(Cy(0.002, 0.04, 0.12, 14), O, 0, 0.04, -0.62, -HALF), ZCyl(0.04, 0.04, VM.tan, 0, 0.04, -0.54, 14)], 'rocket'); g.add(rocket);
  const handL = makeHandL(0, -0.0, -0.21, 1); g.add(handL); g.add(makeHandR(0, -0.045, 0.095));
  g.userData = { rocket, handL, handLBase: handL.position.clone(), magReach: 0.15, len: 0.68, sightY: 0.124, adsZ: -0.3, railY: 0.1, opticZ: -0.05, muzzleY: 0.04, barrelR: 0.05 };
  return g;
}
// the three Blender-modelled guns keep their models; add the anchors the attachment visuals need
const BLENDER_ANCH = {
  rifle: { railY: 0.056, opticZ: -0.1, muzzleY: 0.012, barrelR: 0.011, underY: -0.035, underZ: -0.5, laser: [0.04, 0.004, -0.5], stockZ: 0.1, stockY: 0.01, barrelBase: -0.56 },
  shotgun: { railY: 0.042, opticZ: -0.03, muzzleY: 0.018, barrelR: 0.019, underY: -0.06, underZ: -0.36, laser: [0.036, 0.0, -0.36], stockZ: 0.1, stockY: -0.02, barrelBase: -0.5, tube: true },
  pistol: { railY: 0.053, opticZ: 0.0, muzzleY: 0.032, barrelR: 0.008, underY: -0.03, underZ: -0.11, laser: [0, -0.03, -0.11], pistol: true, magBase: null },
};
let blenderGuns = null;
const gunCache = {};
// Blender-modelled realistic guns (hqdata.js): parts with pivots + anchors for hands, sights and attachments
const hasHQ = def => typeof HQDATA !== 'undefined' && !!HQDATA[def.id];
function hqPart(src) {
  const grp = new THREE.Group();
  for (const mk in src) {
    const d = unpackMesh(src[mk]), geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(d.p, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(d.n, 3));
    const uv = new Float32Array(d.p.length / 3 * 2);
    for (let i = 0, j = 0; i < d.p.length; i += 3, j += 2) { uv[j] = d.p[i + 2] * 4; uv[j + 1] = (d.p[i + 1] + d.p[i] * 0.5) * 4; }
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(new THREE.BufferAttribute(d.i, 1));
    const m = new THREE.Mesh(geo, VM[mk] || VM.metal); m.castShadow = true; m.receiveShadow = true; grp.add(m);
  }
  return grp;
}
function hqGun(def) {
  const H = HQDATA[def.id], A = H.anch, g = new THREE.Group(), parts = {};
  for (const part in H.parts) {
    const mesh = hqPart(H.parts[part]); mesh.name = part + '_mesh';
    if (part === 'body') { g.add(mesh); continue; }
    const holder = new THREE.Group(); holder.name = part; const p = H.pivots[part] || [0, 0, 0]; holder.position.set(p[0], p[1], p[2]); holder.add(mesh); g.add(holder); parts[part] = holder;
  }
  g.add(makeHandR(A.hand_r[0], A.hand_r[1], A.hand_r[2]));
  let handL = null;
  if (A.pistol) { handL = pistolLeftHand(); g.add(handL); }
  else if (A.hand_l) {
    handL = makeHandL(A.hand_l[0], A.hand_l[1], A.hand_l[2], 1);
    const carrier = parts.pump || parts.brk;   // the support hand rides the pump / break-open barrels
    if (carrier) { handL.position.sub(carrier.position); carrier.add(handL); handL = parts.brk ? null : handL; if (parts.pump) handL = null; }
    else g.add(handL);
  }
  const mag = parts.mag || null, md = A.magDir || [0, -1, 0];
  // long stocks would fill the screen at the hip: slide those guns forward a little
  const bb = new THREE.Box3().setFromObject(g.children[0]); const hipBack = Math.max(0, bb.max.z - 0.24);
  g.userData = Object.assign({}, A, {
    mag, magBase: mag ? mag.position.clone() : null, magDir: new THREE.Vector3(md[0], md[1], md[2]).normalize(), magReach: A.magReach || 0.15,
    handL, handLBase: handL ? handL.position.clone() : null, irons: parts.irons || null, slide: parts.slide || null, pump: parts.pump || null,
    bolt: parts.bolt || null, boltZ: parts.bolt ? parts.bolt.position.z : 0, lever: parts.lever || null, cyl: parts.cyl || null, cylSpin: !!A.cylSpin,
    brk: parts.brk || null, rocket: parts.rocket || null, magStyle: A.magStyle || 'straight', hq: true, hipBack,
  });
  return g;
}
function gunFor(def) { return gunCache[def.id] || (gunCache[def.id] = buildGunModel(def, false)); }
// fresh: a separate copy (the loadout preview) instead of the one held in first person
function buildGunModel(def, fresh) {
  armoryMats();
  let g;
  if (hasHQ(def)) g = hqGun(def);
  else if (def.blender) {
    let set = blenderGuns; if (fresh || !set) { set = buildGuns(); if (!fresh) blenderGuns = set; }
    g = set[{ rifle: 0, shotgun: 1, pistol: 2 }[def.blender]];
    Object.assign(g.userData, BLENDER_ANCH[def.blender]);
    if (g.userData.mag) { g.userData.magBase = g.userData.mag.position.clone(); g.userData.magDir = DOWN; g.userData.magReach = 0.27; }
  } else {
    const t = (def.v && def.v.t) || 'rifle';
    g = t === 'pistol' ? procPistol(def) : t === 'revolver' ? procRevolver(def) : t === 'double' ? procDouble(def) : t === 'thumper' ? procThumper(def) : t === 'rocket' ? procRocket(def) : procRifle(def);
  }
  g.name = 'gun_' + def.id; g.userData.def = def;
  const u = g.userData;
  const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  f.position.set(0, u.muzzleY !== undefined ? u.muzzleY : 0.014, -(u.len + 0.06)); f.scale.set(0.3, 0.3, 1); f.visible = false; g.add(f); u.flash = f;
  return g;
}
