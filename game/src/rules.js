/* ================================================================== CUSTOM MATCH RULES (1.2.88)
   CUSTOM MATCH has a RULES section on top of mode, map, score and bots:
     HEALTH (50 / 100 / 200), MOVE SPEED (slow / normal / fast), LOW GRAVITY, BIG HEADS, HEALTH REGEN (on / off),
     SCORESTREAKS (on / off), GRENADES (on / off) and WEAPONS (your class, or everyone on PISTOLS, SHOTGUNS, SNIPERS
     or SMGs; the bots follow it too).
   They ride on the featured-mode twists (M.feat: lowgrav, bighead), so the weekly mode and custom rules share code. */
const RULE_WEAP = { pistols: ['pi', 'PISTOLS'], shotguns: ['sg', 'SHOTGUNS'], snipers: ['sr', 'SNIPERS'], smgs: ['smg', 'SMGS'] };
const rulesDefault = () => ({ hp: 100, speed: 1, lowgrav: false, bighead: false, regen: true, streaks: true, nades: true, weap: 'class' });
const rulesOn = () => !!(M && M.cfg && M.cfg.rules);
const ruleGet = k => rulesOn() ? M.cfg.rules[k] : rulesDefault()[k];
// at the match start (after featApply)
function rulesApply() {
  if (!rulesOn()) return; const R = M.cfg.rules;
  M.feat = Object.assign(M.feat || { name: 'CUSTOM RULES' }, { lowgrav: !!R.lowgrav, bighead: !!R.bighead });
  if (!M.cfg.hardcore && R.hp && R.hp !== 100) { M.maxHp = R.hp; G.maxHp = R.hp; G.health = R.hp; for (const e of enemies) if (e.pvp) { e.maxHp = R.hp; e.hp = R.hp; } }
}
const rulesSpeed = () => rulesOn() ? (+M.cfg.rules.speed || 1) : 1;
const rulesNoRegen = () => rulesOn() && M.cfg.rules.regen === false;
const rulesNoStreaks = () => rulesOn() && M.cfg.rules.streaks === false;
const rulesNoNades = () => rulesOn() && M.cfg.rules.nades === false;
// a gun from the rule's category: the same pick for a seed (so a bot keeps its gun)
function ruleGun(seed) { const W = RULE_WEAP[ruleGet('weap')]; if (!W) return null; const list = ARMORY.filter(d => d.cat === W[0] && !d.noBot && !d.secret); return list.length ? list[Math.abs(seed | 0) % list.length] : null; }
(() => { const old = equipClass; equipClass = function (cls, noCompile) {
  if (rulesOn() && cls && !cls.factory && !cls.ruled) { const g = ruleGun((NOW * 7) | 0); if (g) cls = Object.assign({}, cls, { p: g.id, s: g.cat === 'pi' ? (ARMORY.find(d => d.cat === 'pi' && d.id !== g.id) || g).id : cls.s, only: null, ruled: 1 }); }
  return old(cls, noCompile); }; })();
// the bots' guns (from botguns.js botGun, wrapped where it exists)
function rulesBotGun(e) { const g = ruleGun((e.name || '').length * 13 + (e.team | 0)); if (g) e.ruleGun = g.id; return g; }
function rulesRows(rows, R) {
  const seg = (name, hint, k, opts) => rows.push({ name, hint, t: 'seg', opts, get: () => R[k], set: v => { R[k] = v; } });
  const tog = (name, hint, k) => rows.push({ name, hint, t: 'toggle', get: () => !!R[k], set: v => { R[k] = v; } });
  rows.push({ head: 'RULES' });
  seg('HEALTH', 'Everyone starts with this much', 'hp', [[50, '50'], [100, '100'], [200, '200']]);
  seg('MOVE SPEED', '', 'speed', [[0.8, 'SLOW'], [1, 'NORMAL'], [1.3, 'FAST']]);
  seg('WEAPONS', 'Everyone, bots too', 'weap', [['class', 'YOUR CLASS'], ...Object.entries(RULE_WEAP).map(([k, v]) => [k, v[1]])]);
  tog('LOW GRAVITY', 'Moon jumps', 'lowgrav'); tog('BIG HEADS', 'Bigger heads on everyone', 'bighead');
  tog('HEALTH REGEN', 'Off = no healing back up', 'regen'); tog('SCORESTREAKS', '', 'streaks'); tog('GRENADES', '', 'nades');
}
(() => { const s = document.createElement('style'); s.textContent = `.cus-rules-h{margin:14px 0 4px;padding-top:8px;border-top:1px solid var(--line);font-size:11px;letter-spacing:.3em;color:var(--accent)}`; document.head.appendChild(s); })();
