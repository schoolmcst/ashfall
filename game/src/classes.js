/* ================================================================== loadout classes: primary, secondary, equipment, perk */
const EQUIP = {
  frag: { name: 'FRAG', desc: 'Bounces, then bursts after 2.2 s. Large blast.', count: 3, max: 5, fuse: 2.2, color: 0x3a4630 },
  semtex: { name: 'SEMTEX', desc: 'Sticks to walls, floors and enemies. Short 1.6 s fuse, smaller blast.', count: 2, max: 4, fuse: 1.6, sticky: true, color: 0x6b6a3a, glow: 0x30ff40 },
  stun: { name: 'STUN', desc: 'No damage. Enemies in the burst cannot aim or fire for a few seconds. Don’t look at it.', count: 3, max: 5, fuse: 1.4, color: 0x8a8f96 },
};
const PERKS = {
  none: { name: 'NONE', desc: 'No perk.' },
  scavenger: { name: 'SCAVENGER', desc: 'Ammo crates give twice the rounds and always a grenade.' },
  quick: { name: 'QUICK HANDS', desc: 'Reload 20% faster and swap weapons faster.' },
  light: { name: 'LIGHTWEIGHT', desc: 'Move 8% faster. No camera jolt on hard landings.' },
  steady: { name: 'STEADY AIM', desc: 'Hip-fire spread 28% tighter.' },
  tough: { name: 'TOUGHNESS', desc: 'Health starts regenerating after 3 s instead of 5.' },
};
const DEFAULT_CLASSES = [
  { name: 'ASSAULT', p: 'marc', s: 'sidearm', e: 'frag', k: 'scavenger' },
  { name: 'CLOSE QUARTERS', p: 'viper', s: 'stinger', e: 'stun', k: 'light' },
  { name: 'SUPPORT', p: 'anvil', s: 'hellfire', e: 'frag', k: 'tough' },
  { name: 'RECON', p: 'hawkeye', s: 'deadeye', e: 'semtex', k: 'steady' },
  { name: 'BREACHER', p: 'breacher', s: 'magnum', e: 'stun', k: 'quick' },
];
const CLASS_KEY = 'ashfall.classes.v1';
let CLASSES = DEFAULT_CLASSES.map(c => Object.assign({}, c)), ACTIVE_CLASS = 0, ATTS = {};
function loadClasses() {
  try {
    const o = JSON.parse(localStorage.getItem(CLASS_KEY) || 'null');
    if (o && Array.isArray(o.classes)) {
      CLASSES = DEFAULT_CLASSES.map((d, i) => { const c = Object.assign({}, d, o.classes[i] || {}); if (!ARM[c.p] || CATS[ARM[c.p].cat].slot !== 'primary') c.p = d.p; if (!ARM[c.s] || CATS[ARM[c.s].cat].slot !== 'secondary') c.s = d.s; if (!EQUIP[c.e]) c.e = d.e; if (!PERKS[c.k]) c.k = d.k; return c; });
      ACTIVE_CLASS = clamp(o.active | 0, 0, CLASSES.length - 1); ATTS = o.atts && typeof o.atts === 'object' ? o.atts : {};
      return;
    }
    // carry over attachments saved by the previous version (one set each for the rifle, shotgun and pistol)
    const old = JSON.parse(localStorage.getItem('ashfall.loadout.v1') || 'null');
    if (Array.isArray(old)) ['marc', 'breacher', 'sidearm'].forEach((id, i) => { if (old[i]) ATTS[id] = Object.assign({}, old[i]); });
  } catch (e) {}
}
function saveClasses() { try { localStorage.setItem(CLASS_KEY, JSON.stringify({ classes: CLASSES, active: ACTIVE_CLASS, atts: ATTS })); } catch (e) {} }
const activeClass = () => CLASSES[ACTIVE_CLASS] || CLASSES[0];
loadClasses();
