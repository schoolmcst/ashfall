/* ================================================================== loadout classes: primary, secondary, equipment, perk */
const EQUIP = {
  frag: { name: 'FRAG', desc: 'Bounces, then bursts after 2.2 s. Large blast.', count: 3, max: 5, fuse: 2.2, color: 0x3a4630 },
  semtex: { name: 'SEMTEX', desc: 'Sticks to walls, floors and enemies. Short 1.6 s fuse, smaller blast.', count: 2, max: 4, fuse: 1.6, sticky: true, color: 0x6b6a3a, glow: 0x30ff40 },
  stun: { name: 'STUN', desc: 'No damage. Enemies in the burst cannot aim or fire for a few seconds. Don’t look at it.', count: 3, max: 5, fuse: 1.4, color: 0x8a8f96 },
};
// three perk slots per class, one from each tier (blue / red / yellow, like CoD)
// three perk slots per class, one from each tier (CoD-style perks, some renamed). Every one is wired into the game.
const PERKS = {
  // PERK 1 (blue)
  scavenger: { t: 1, name: 'SCAVENGER', desc: 'Ammo crates give twice the rounds and always a grenade. Kills top up 1 magazine of reserve ammo.' },
  light: { t: 1, name: 'LIGHTWEIGHT', desc: 'Move 7% faster. No camera jolt on hard landings.' },
  flak: { t: 1, name: 'BLAST VEST', desc: 'Take 35% less damage from grenades, rockets, mortars and barrels.' },
  ghost: { t: 1, name: 'SHADOW', desc: 'Bots take 30% longer to lock on to you once they see you.' },
  endure: { t: 1, name: 'ENDURANCE', desc: 'Sprint 6% faster and recover from a sprint 40% quicker (shoot sooner after sprinting).' },
  // PERK 2 (red)
  quick: { t: 2, name: 'QUICK HANDS', desc: 'Reload 20% faster.' },
  amped: { t: 2, name: 'AMPED', desc: 'Swap weapons 35% faster and aim down sights 12% faster.' },
  hard: { t: 2, name: 'HARDWIRED', desc: 'Scorestreak points come in 20% faster.' },
  steady: { t: 2, name: 'STEADY AIM', desc: 'Hip-fire spread 25% tighter.' },
  prowl: { t: 2, name: 'PROWLER', desc: 'Move 35% faster while aiming down sights.' },
  // PERK 3 (green)
  tough: { t: 3, name: 'RECOVERY', desc: 'Health starts coming back after 3 s instead of 5.' },
  dead: { t: 3, name: 'DEAD SILENCE', desc: 'Your footsteps are silent for online players and much quieter for you.' },
  aware: { t: 3, name: 'AWARENESS', desc: 'Enemy footsteps are louder and heard from 70% further away.' },
  mask: { t: 3, name: 'TACTICAL MASK', desc: 'Stun flashes are 65% weaker and explosions barely shake your view.' },
  iron: { t: 3, name: 'IRON SKIN', desc: 'Getting shot knocks your aim 70% less.' },
};
const PERK_KEYS = ['k', 'k2', 'k3'], PERK_DEF = { 1: 'scavenger', 2: 'quick', 3: 'tough' };
const perksOf = c => PERK_KEYS.map(k => c[k]).filter(k => PERKS[k]);
const DEFAULT_CLASSES = [
  { name: 'ASSAULT', p: 'marc', s: 'sidearm', e: 'frag', k: 'scavenger', k2: 'quick', k3: 'tough' },
  { name: 'CLOSE QUARTERS', p: 'viper', s: 'stinger', e: 'stun', k: 'light', k2: 'amped', k3: 'dead' },
  { name: 'SUPPORT', p: 'anvil', s: 'hellfire', e: 'frag', k: 'flak', k2: 'hard', k3: 'iron' },
  { name: 'RECON', p: 'hawkeye', s: 'deadeye', e: 'semtex', k: 'ghost', k2: 'steady', k3: 'aware' },
  { name: 'BREACHER', p: 'breacher', s: 'magnum', e: 'stun', k: 'endure', k2: 'prowl', k3: 'mask' },
];
// saves from before 3 slots had one perk in 'k': keep it in its own tier's slot
function fixPerks(c, d) {
  const old = c.k;
  for (let t = 1; t <= 3; t++) { const key = PERK_KEYS[t - 1]; if (!PERKS[c[key]] || PERKS[c[key]].t !== t) c[key] = d[key]; }
  if (PERKS[old] && PERKS[old].t !== 1) c[PERK_KEYS[PERKS[old].t - 1]] = old;
  return c;
}
const CLASS_KEY = 'ashfall.classes.v1';
let CLASSES = DEFAULT_CLASSES.map(c => Object.assign({}, c)), ACTIVE_CLASS = 0, ATTS = {};
function loadClasses() {
  try {
    const o = JSON.parse(localStorage.getItem(CLASS_KEY) || 'null');
    if (o && Array.isArray(o.classes)) {
      CLASSES = DEFAULT_CLASSES.map((d, i) => { const c = Object.assign({}, d, o.classes[i] || {}); if (!ARM[c.p] || CATS[ARM[c.p].cat].slot !== 'primary') c.p = d.p; if (!ARM[c.s] || CATS[ARM[c.s].cat].slot !== 'secondary') c.s = d.s; if (!EQUIP[c.e]) c.e = d.e; return fixPerks(c, d); });
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
