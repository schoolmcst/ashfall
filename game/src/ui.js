/* ================================================================== UI: screens, settings, input, loop, boot */
const SCREENS = ['menu', 'settings', 'howto', 'credits', 'pause', 'over', 'bench', 'loadout', 'lobby', 'custom', 'career', 'results', 'plobby', 'streaks', 'modes', 'playlist', 'classpick', 'leaderboard', 'replay', 'locker', 'rewards', 'bpass'];
let curScreen = null, returnScreen = 'menu';
function showScreen(id) {
  curScreen = id; if (id === 'menu') try { renderMenuCard(); } catch (e) {}
  for (const s of SCREENS) $(s).classList.toggle('hide', s !== id);
  $('hud').classList.toggle('hide', !(G.state === 'playing' || G.state === 'paused' || G.state === 'dead' || G.state === 'respawning' || G.state === 'spectate' || G.state === 'deathcam' || G.state === 'zdown' || G.state === 'zspec'));
  if (id) setTimeout(() => { const f = focusables(); if (f.length && !f.includes(document.activeElement)) { try { f[0].focus(); } catch (e) {} } }, 0);
}
function lockPointer() { try { const r = renderer.domElement.requestPointerLock && renderer.domElement.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }

/* ------------------------------------------------------------------ settings UI */
const pct = v => v + '%';
const SCHEMA = {
  ACCOUNT: [
    { t: 'text', name: 'CALLSIGN', hint: 'Your name in online matches and on the scoreboard (14 letters max)' },
    { t: 'info', name: 'FRIEND CODE', hint: 'Give this to friends: they add it in the lobby and press JOIN to join your party', val: () => MYCODE },
  ],
  VIDEO: [
    { t: 'head', name: 'YOUR HARDWARE' },
    { t: 'info', small: true, name: 'GRAPHICS CARD', hint: () => 'AUTO picks ' + AUTO_TIER.toUpperCase() + ' for this card', val: () => gpuShort() },
    { t: 'info', small: true, name: 'DISPLAY', hint: () => HW.hzN ? 'Refresh rate measured while the menu is open' : 'Measuring refresh rate…', val: () => dispInfo() },
    { t: 'info', small: true, name: 'LIMITS', hint: 'The highest settings this computer supports', val: () => `TEXTURES ${HW.maxTex} · FILTERING ${MAXANIS}× · ${HW.cores ? HW.cores + ' CPU THREADS' : 'CPU ?'}${HW.mem ? ' · ' + HW.mem + ' GB+' : ''}` },
    { t: 'action', name: 'BENCHMARK', hint: 'A 25 second fly-through that measures your frame rate with the current settings', label: 'RUN BENCHMARK', act: 'bench' },
    { t: 'head', name: 'PRESET' },
    { k: 'quality', t: 'seg', name: 'GRAPHICS PRESET', hint: 'Sets everything below at once. Change any detail setting and this shows CUSTOM', opts: [['auto', 'AUTO'], ['low', 'LOW'], ['medium', 'MEDIUM'], ['high', 'HIGH'], ['ultra', 'ULTRA'], ['custom', 'CUSTOM']] },
    { t: 'head', name: 'DISPLAY' },
    { k: 'fpsCap', t: 'seg', name: 'FRAME RATE LIMIT', hint: () => 'DISPLAY runs at your monitor\u2019s refresh rate (' + HW.hz + ' Hz). A lower limit saves power and heat', opts: [[0, 'DISPLAY'], [30, '30'], [60, '60'], [90, '90'], [120, '120'], [144, '144'], [165, '165'], [240, '240']] },
    { k: 'renderScale', t: 'range', name: 'RENDER SCALE', hint: 'Below 100% runs faster. Above 100% renders extra pixels and shrinks them down (supersampling): much sharper, needs a strong graphics card', min: 50, max: 200, step: 5, fmt: pct },
    { k: 'dynRes', t: 'toggle', name: 'DYNAMIC RESOLUTION', hint: 'Lowers the render scale for a moment when the frame rate drops below your limit' },
    { k: 'aa', t: 'seg', name: 'ANTI-ALIASING', hint: 'Smooths jagged edges (4× MSAA). Applies on next launch', opts: [['off', 'OFF'], ['msaa', 'MSAA']] },
    { k: 'gpuPref', t: 'seg', name: 'GRAPHICS CARD TO USE', hint: 'Laptops with two GPUs: HIGH PERFORMANCE uses the gaming card. Applies on next launch', opts: [['high', 'HIGH PERFORMANCE'], ['low', 'POWER SAVING']] },
    { k: 'fov', t: 'range', name: 'FIELD OF VIEW', min: 60, max: 110, step: 1, fmt: v => v + '°' },
    { k: 'brightness', t: 'range', name: 'BRIGHTNESS', min: 60, max: 150, step: 5, fmt: pct },
    { t: 'head', name: 'QUALITY' },
    { k: 'shadows', t: 'seg', name: 'SHADOW QUALITY', hint: () => 'Sharper, longer shadows. EXTREME uses an 8K shadow map' + (HW.maxTex < 8192 ? ' (not supported by this card)' : ''), opts: () => [['off', 'OFF'], ['low', 'LOW'], ['medium', 'MEDIUM'], ['high', 'HIGH'], ['ultra', 'ULTRA'], ...(HW.maxTex >= 8192 ? [['extreme', 'EXTREME']] : [])] },
    { k: 'shadowDist', t: 'range', name: 'SHADOW DISTANCE', hint: 'How far from you shadows are drawn, and soldiers cast shadows. Longer is softer and slower', min: 50, max: 200, step: 10, fmt: pct },
    { k: 'anis', t: 'seg', name: 'TEXTURE FILTERING', hint: 'Keeps the ground and walls sharp at an angle (anisotropic)', opts: () => [[1, '1×'], [2, '2×'], [4, '4×'], [8, '8×'], [16, '16×']].filter(o => o[0] <= Math.max(1, MAXANIS)) },
    { k: 'texQ', t: 'seg', name: 'TEXTURE QUALITY', hint: 'Detail of the built-in textures. Applies on next launch', opts: [['low', 'LOW'], ['high', 'HIGH']] },
    { k: 'realTex', t: 'toggle', name: 'SCANNED TEXTURES', hint: 'Photo-scanned ground, brick, concrete, wood and metal from Poly Haven (CC0), downloaded once. Applies on next launch' },
    { k: 'gunShader', t: 'toggle', name: 'CUSTOM GUN SHADER', hint: 'Physically based GGX shader on weapon metal. Turn off if guns look wrong' },
    { k: 'sheen', t: 'range', name: 'SURFACE SHEEN', hint: 'Fresnel glint on metal and wet surfaces at grazing angles', min: 0, max: 150, step: 10, fmt: pct },
    { t: 'head', name: 'EFFECTS' },
    { k: 'fxQ', t: 'seg', name: 'EFFECTS QUALITY', hint: 'Sparks, debris, dust and smoke from shots and explosions', opts: [['low', 'LOW'], ['medium', 'MEDIUM'], ['high', 'HIGH'], ['ultra', 'ULTRA']] },
    { k: 'grass', t: 'range', name: 'GRASS DENSITY', min: 0, max: 100, step: 5, fmt: pct },
    { k: 'grain', t: 'toggle', name: 'FILM GRAIN' },
    { k: 'bob', t: 'toggle', name: 'VIEW BOBBING' },
    { k: 'shake', t: 'range', name: 'SCREEN SHAKE', min: 0, max: 150, step: 10, fmt: pct },
    { k: 'showFps', t: 'toggle', name: 'SHOW FPS' },
  ],
  AUDIO: [
    { k: 'master', t: 'range', name: 'MASTER VOLUME', min: 0, max: 100, step: 5, fmt: pct },
    { k: 'realSnd', t: 'toggle', name: 'RECORDED SOUNDS', hint: 'Real recorded gunshots, reloads, footsteps and explosions (CC0). Off = the older synthesised sounds' },
    { k: 'sfx', t: 'range', name: 'EFFECTS VOLUME', min: 0, max: 100, step: 5, fmt: pct },
    { k: 'music', t: 'range', name: 'MUSIC VOLUME', hint: 'Menu and lobby music', min: 0, max: 100, step: 5, fmt: pct },
    { k: 'ambience', t: 'range', name: 'AMBIENCE VOLUME', hint: 'Wind and distant artillery', min: 0, max: 100, step: 5, fmt: pct },
  ],
  CONTROLS: [
    { k: 'sens', t: 'range', name: 'MOUSE SENSITIVITY', min: 20, max: 300, step: 5, fmt: pct },
    { k: 'adsSens', t: 'range', name: 'ADS SENSITIVITY · IRONS / 1×', hint: 'Iron sights, red dots, holos, reflex', min: 10, max: 150, step: 5, fmt: pct },
    { k: 'adsSens2', t: 'range', name: 'ADS SENSITIVITY · 2.5× – 3.5×', hint: 'Combat scope, scout scope', min: 10, max: 150, step: 5, fmt: pct },
    { k: 'adsSens4', t: 'range', name: 'ADS SENSITIVITY · 4×', hint: 'Battle scope', min: 10, max: 150, step: 5, fmt: pct },
    { k: 'adsSens6', t: 'range', name: 'ADS SENSITIVITY · 6× – 10×', hint: 'Sniper scopes', min: 10, max: 150, step: 5, fmt: pct },
    { k: 'invertY', t: 'toggle', name: 'INVERT MOUSE Y' },
    { k: 'toggleAds', t: 'toggle', name: 'TOGGLE AIM', hint: 'Press right mouse once to aim, again to stop' },
  ],
  KEYBINDS: [
    { a: 'fwd', t: 'bind', name: 'MOVE FORWARD' }, { a: 'back', t: 'bind', name: 'MOVE BACK' }, { a: 'left', t: 'bind', name: 'MOVE LEFT' }, { a: 'right', t: 'bind', name: 'MOVE RIGHT' },
    { a: 'jump', t: 'bind', name: 'JUMP' }, { a: 'crouch', t: 'bind', name: 'CROUCH' }, { a: 'sprint', t: 'bind', name: 'SPRINT' },
    { a: 'reload', t: 'bind', name: 'RELOAD' }, { a: 'melee', t: 'bind', name: 'MELEE' }, { a: 'grenade', t: 'bind', name: 'THROW EQUIPMENT' }, { a: 'use', t: 'bind', name: 'USE (PLANT / DEFUSE)' },
    { a: 'swap', t: 'bind', name: 'SWITCH WEAPON' }, { a: 'prim', t: 'bind', name: 'PRIMARY WEAPON' }, { a: 'sec', t: 'bind', name: 'SECONDARY WEAPON' }, { a: 'inspect', t: 'bind', name: 'INSPECT WEAPON' }, { a: 'board', t: 'bind', name: 'SCOREBOARD' }, { a: 'streak', t: 'bind', name: 'USE SCORESTREAK' },
  ],
  BUTTONS: [
    { t: 'action', name: '‹ BACK TO CONTROLLER SETTINGS', label: 'BACK', act: 'pad-back' },
    ...['jump:JUMP', 'crouch:CROUCH / SLIDE', 'reload:RELOAD / USE', 'swap:SWITCH WEAPON', 'grenade:THROW GRENADE', 'melee:MELEE', 'sprint:SPRINT', 'streak:USE SCORESTREAK', 'inspect:INSPECT WEAPON', 'board:SCOREBOARD'].map(x => { const [a, n] = x.split(':'); return { a, t: 'padbind', name: n }; }),
  ],
  CONTROLLER: [
    { t: 'action', name: 'BUTTON LAYOUT', hint: 'Change which controller button does what', label: 'EDIT CONTROLLER BUTTONS', act: 'pad-binds' },
    { k: 'padSens', t: 'range', name: 'LOOK SENSITIVITY', min: 40, max: 250, step: 5, fmt: pct },
    { k: 'padAdsSens', t: 'range', name: 'ADS SENSITIVITY · IRONS / 1×', hint: 'Iron sights, red dots, holos, reflex', min: 10, max: 150, step: 5, fmt: pct },
    { k: 'padAdsSens2', t: 'range', name: 'ADS SENSITIVITY · 2.5× – 3.5×', min: 10, max: 150, step: 5, fmt: pct },
    { k: 'padAdsSens4', t: 'range', name: 'ADS SENSITIVITY · 4×', min: 10, max: 150, step: 5, fmt: pct },
    { k: 'padAdsSens6', t: 'range', name: 'ADS SENSITIVITY · 6× – 10×', min: 10, max: 150, step: 5, fmt: pct },
    { k: 'padCurve', t: 'seg', name: 'RESPONSE CURVE', hint: 'Dynamic: precise near the centre, fast at full tilt. Linear: stick position = turn speed', opts: [['dynamic', 'DYNAMIC'], ['standard', 'STANDARD'], ['linear', 'LINEAR']] },
    { k: 'padAccel', t: 'range', name: 'TURN BOOST', hint: 'Extra turn speed when the stick is held at full tilt', min: 0, max: 100, step: 5, fmt: pct },
    { k: 'padSmooth', t: 'range', name: 'LOOK SMOOTHING', hint: 'Evens out jittery input. Higher feels heavier', min: 0, max: 100, step: 5, fmt: pct },
    { k: 'padAssist', t: 'seg', name: 'AIM ASSIST', hint: 'Slowdown near targets, follows them as you move, and a gentle snap when you aim', opts: [['off', 'OFF'], ['low', 'LOW'], ['standard', 'STANDARD'], ['strong', 'STRONG']] },
    { k: 'padDeadzone', t: 'range', name: 'INNER DEADZONE', hint: 'Raise this if the view drifts', min: 2, max: 40, step: 1, fmt: pct },
    { k: 'padOuterDz', t: 'range', name: 'OUTER DEADZONE', hint: 'Stick travel that counts as full tilt', min: 70, max: 100, step: 1, fmt: pct },
    { k: 'padDrift', t: 'toggle', name: 'DRIFT CORRECTION', hint: 'Learns a worn stick\u2019s resting position and cancels it out' },
    { k: 'padInvertY', t: 'toggle', name: 'INVERT LOOK Y' },
    { k: 'padSprint', t: 'seg', name: 'SPRINT', hint: 'Auto sprints when the left stick is pushed fully forward', opts: [['toggle', 'TOGGLE'], ['hold', 'HOLD'], ['auto', 'AUTO']] },
    { k: 'padCrouch', t: 'seg', name: 'CROUCH', opts: [['toggle', 'TOGGLE'], ['hold', 'HOLD']] },
    { k: 'padTrigger', t: 'range', name: 'TRIGGER THRESHOLD', hint: 'How far to pull RT / LT before it counts', min: 5, max: 80, step: 5, fmt: pct },
    { k: 'padVibration', t: 'toggle', name: 'VIBRATION' },
    { k: 'padRumble', t: 'range', name: 'VIBRATION STRENGTH', min: 0, max: 150, step: 10, fmt: pct },
  ],
  GAMEPLAY: [
    { k: 'difficulty', t: 'seg', name: 'DIFFICULTY', hint: 'Changes enemy health, damage, accuracy and numbers', opts: [['recruit', 'RECRUIT'], ['regular', 'REGULAR'], ['veteran', 'VETERAN']] },
    { k: 'crosshair', t: 'seg', name: 'CROSSHAIR', opts: [['cross', 'CROSS'], ['dot', 'DOT'], ['none', 'NONE']] },
    { k: 'crosshairColor', t: 'seg', name: 'CROSSHAIR COLOUR', opts: [['white', 'WHITE'], ['green', 'GREEN'], ['yellow', 'YELLOW'], ['red', 'RED'], ['cyan', 'CYAN']] },
    { k: 'ragdoll', t: 'toggle', name: 'RAGDOLL PHYSICS', hint: 'Bodies fall and tumble with physics instead of a canned animation' },
    { k: 'deathCam', t: 'toggle', name: 'DEATH CAM', hint: 'Slow-motion shot of whoever killed you before the K.I.A. screen' },
    { k: 'hitMarkers', t: 'toggle', name: 'HIT MARKERS' },
    { k: 'dmgIndicator', t: 'toggle', name: 'DAMAGE DIRECTION INDICATOR' },
    { k: 'radar', t: 'toggle', name: 'RADAR' },
  ],
};
let curTab = 'VIDEO';
const VIDEO_KEYS = new Set(['quality', 'renderScale', 'dynRes', 'shadows', 'shadowDist', 'anis', 'grass', 'fxQ', 'fov', 'brightness', 'sheen', 'gunShader', 'grain', 'showFps', 'radar', 'crosshair', 'crosshairColor']);
// changing one of these by hand turns the preset into CUSTOM
const DETAIL_KEYS = new Set(['renderScale', 'shadows', 'shadowDist', 'anis', 'grass', 'fxQ', 'texQ', 'grain']);
const gpuShort = () => { let n = String(GPU_NAME || 'UNKNOWN'); const m = /^ANGLE \((.*)\)$/.exec(n); if (m) { const p = m[1].split(/,\s*(?![^()]*\))/); n = p.length > 1 ? p[1] : p[0]; }
  return n.replace(/^ANGLE Metal Renderer:\s*/i, '').replace(/\s*\(0x[0-9a-f]+\)/ig, '').replace(/\s*Direct3D.*$|\s*vs_\d.*$|\s*OpenGL.*$/i, '').trim().toUpperCase().slice(0, 48); };
const dispInfo = () => { const d = window.devicePixelRatio || 1; return `${Math.round(screen.width * d)}×${Math.round(screen.height * d)} · ${HW.hz} HZ`; };
function applySetting(k) {
  if (k === 'quality') { if (S.quality !== 'custom') applyPreset(qKey()); renderSettings(); }
  else if (DETAIL_KEYS.has(k) && S.quality !== 'custom') { S.quality = 'custom'; const seg = document.querySelector('#setBody .seg[data-k="quality"]'); if (seg) [...seg.children].forEach(c => c.classList.toggle('on', c.dataset.v === 'custom')); }
  if (VIDEO_KEYS.has(k)) applyVideoSettings();
  if (k === 'master' || k === 'sfx' || k === 'ambience') applyAudioSettings();
  if (k === 'difficulty') updateDiffUI();
  saveSettings(); sfx.ui();
}
function buildTabs() {
  const t = $('tabs'); t.innerHTML = '';
  for (const name of Object.keys(SCHEMA)) {
    if (name === 'BUTTONS') continue;   // opened from the CONTROLLER tab
    const b = document.createElement('button'); b.className = 'tab' + ((name === curTab || (name === 'CONTROLLER' && curTab === 'BUTTONS')) ? ' on' : ''); b.textContent = name;
    b.onclick = () => { curTab = name; buildTabs(); renderSettings(); sfx.ui(); };
    t.appendChild(b);
  }
}
function renderSettings() {
  const body = $('setBody'); body.innerHTML = '';
  for (const it of SCHEMA[curTab]) {
    if (it.t === 'head') { const h = document.createElement('div'); h.className = 'sethead'; h.textContent = it.name; body.appendChild(h); continue; }
    const row = document.createElement('div'); row.className = 'setrow';
    const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = it.name;
    const hint = typeof it.hint === 'function' ? it.hint() : it.hint;
    if (hint) { const h = document.createElement('span'); h.className = 'hint'; h.textContent = hint; nm.appendChild(h); }
    const ctl = document.createElement('div'); ctl.className = 'ctl';
    if (it.t === 'action') { const b = document.createElement('button'); b.className = 'bindbtn'; b.textContent = it.label; b.onclick = () => { sfx.ui(); actions(it.act); }; ctl.appendChild(b); }
    else if (it.t === 'padbind') {
      const b = document.createElement('button'); b.className = 'bindbtn'; b.textContent = PAD_NAMES[pb(it.a)] || ('BUTTON ' + pb(it.a));
      b.onclick = () => { b.textContent = 'PRESS A CONTROLLER BUTTON…'; b.classList.add('wait'); padCapture = btn => { const cur = pb(it.a), map = Object.assign({}, PAD_DEFAULT, S.padBinds || {}); for (const k in map) if (map[k] === btn && k !== it.a) map[k] = cur; map[it.a] = btn; S.padBinds = map; saveSettings(); renderSettings(); }; };
      ctl.appendChild(b);
    } else if (it.t === 'info') { const v = document.createElement('span'); v.className = 'num' + (it.small ? ' hwv' : ''); if (!it.small) { v.style.letterSpacing = '.3em'; v.style.fontSize = '18px'; } v.textContent = it.val(); ctl.appendChild(v); }
    else if (it.t === 'text') {
      const i = document.createElement('input'); i.className = 'set-text'; i.maxLength = 14; i.value = NET.nick; i.spellcheck = false; i.autocomplete = 'off';
      i.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') i.blur(); }; i.onkeyup = e => e.stopPropagation();
      i.oninput = () => { NET.nick = cleanNick(i.value); try { localStorage.setItem(NICK_KEY, NET.nick); } catch (e) {} };
      i.onblur = () => { i.value = NET.nick; };
      ctl.appendChild(i);
    } else if (it.t === 'range') {
      const r = document.createElement('input'); r.type = 'range'; r.min = it.min; r.max = it.max; r.step = it.step; r.value = S[it.k];
      const n = document.createElement('span'); n.className = 'num'; n.textContent = it.fmt(S[it.k]);
      r.oninput = () => { S[it.k] = +r.value; n.textContent = it.fmt(S[it.k]); applySetting(it.k); };
      ctl.append(r, n);
    } else if (it.t === 'toggle') {
      const sw = document.createElement('div'); sw.className = 'sw' + (S[it.k] ? ' on' : ''); sw.tabIndex = 0; sw.setAttribute('role', 'switch');
      sw.onclick = () => { S[it.k] = !S[it.k]; sw.classList.toggle('on', S[it.k]); applySetting(it.k); };
      sw.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sw.click(); } };
      ctl.appendChild(sw);
    } else if (it.t === 'bind') {
      const b = document.createElement('button'); b.className = 'bindbtn'; b.textContent = keyName(bind(it.a));
      b.onclick = () => {
        b.textContent = 'PRESS A KEY (ESC TO CANCEL)'; b.classList.add('wait');
        bindCapture = code => {
          S.binds = Object.assign({}, DEFAULT_BINDS, S.binds || {});
          const other = Object.keys(S.binds).find(k => k !== it.a && S.binds[k] === code);   // that key was used elsewhere: swap them
          if (other) S.binds[other] = S.binds[it.a];
          S.binds[it.a] = code; saveSettings(); sfx.ui(); renderSettings();
        };
      };
      ctl.appendChild(b);
    } else {
      const seg = document.createElement('div'); seg.className = 'seg'; seg.dataset.k = it.k;
      for (const [val, label] of (typeof it.opts === 'function' ? it.opts() : it.opts)) { const b = document.createElement('button'); b.textContent = label; b.dataset.v = val; b.className = S[it.k] === val ? 'on' : ''; b.onclick = () => { S[it.k] = val; applySetting(it.k); if (it.k !== 'quality') [...seg.children].forEach(c => c.classList.toggle('on', c === b)); }; seg.appendChild(b); }
      ctl.appendChild(seg);
    }
    row.append(nm, ctl); body.appendChild(row);
  }
}
function updateClassUI() { const v = $('classVal'); if (v) v.textContent = activeClass().name; }
function cycleClass(d) { ACTIVE_CLASS = (ACTIVE_CLASS + d + CLASSES.length) % CLASSES.length; saveClasses(); updateClassUI(); sfx.ui(); if (curScreen === 'lobby') { renderLobby(); focusFirst('.cod-class [data-act="class' + (d > 0 ? '+' : '-') + '"]'); } }
let statsReturn = 'lobby', cusReturn = 'menu';
function updateDiffUI() { $('diffVal').textContent = diff().name; }
function cycleDiff(d) { const ks = Object.keys(DIFFS); S.difficulty = ks[(ks.indexOf(S.difficulty) + d + ks.length) % ks.length]; updateDiffUI(); saveSettings(); sfx.ui(); if (curTab === 'GAMEPLAY') renderSettings(); if (curScreen === 'lobby') renderLobby('.cod-row [data-act="diff' + (d > 0 ? '+' : '-') + '"]'); }

function actions(act) {
  if (/^(qc-|lqc-|pz-|vc-|vm-|lob-send$)/.test(act) && typeof commsAct === 'function' && commsAct(act)) return;
  if (/^(bp-|bpass$)/.test(act) && typeof bpAct === 'function' && bpAct(act)) return;
  if (/^(lk-|rw-|locker$|rewards$)/.test(act) && typeof lockerAct === 'function' && lockerAct(act)) return;
  if (typeof zombAct === 'function' && zombAct(act)) return;
  switch (act) {
    case 'deploy': case 'play': toLobby(); break;
    case 'nav-play': showScreen('menu'); break;
    case 'quit': try { window.close(); } catch (e) {} break;
    case 'go-mp': if (MODES[LOBBY.mode].online || LOBBY.mode === 'surv') LOBBY.mode = LOBBY.lastOff && LOBBY.lastOff !== 'surv' ? LOBBY.lastOff : 'tdm'; saveLobby(); toLobby(); focusFirst('.cod-go'); break;
    case 'go-on': if (!MODES[LOBBY.mode].online) LOBBY.mode = LOBBY.lastOn || 'otdm'; saveLobby(); toLobby(); focusFirst('.cod-go'); break;
    case 'go-surv': LOBBY.mode = 'surv'; saveLobby(); startMatch('surv', { map: LOBBY.map }); break;
    case 'modes': openModes(); break;
    case 'mode-': lobbyTab(-1); break;
    case 'mode+': lobbyTab(1); break;
    case 'modes-back': renderLobby(); showScreen('lobby'); focusFirst('.cod-go'); break;
    case 'lob-start': if (NET.app && MODES[LOBBY.mode].online) quickPlay(); else startMatch(LOBBY.mode); break;
    case 'playlist': openPlaylist(); break;
    case 'pl-back': renderLobby('.cod-go'); showScreen('lobby'); focusFirst('.cod-go'); break;
    case 'lobby-back': showScreen('menu'); break;
    case 'custom': cusReturn = curScreen === 'lobby' ? 'lobby' : 'menu'; renderCustom(); showScreen('custom'); break;
    case 'cus-back': if (cusReturn === 'lobby') renderLobby(); showScreen(cusReturn); break;
    case 'cus-start': startCustom(); break;
    case 'stats': statsReturn = curScreen || 'lobby'; statOnline = !!(MODES[LOBBY.mode] && MODES[LOBBY.mode].online); renderStats(); showScreen('career'); break;
    case 'stats-back': if (statsReturn === 'lobby') renderLobby(); showScreen(statsReturn); break;
    case 'res-again': restartMatch(); break;
    case 'res-lobby': toLobby(); break;
    case 'pl-start': privStart(); break;
    case 'streaks': openStreaks(curScreen || 'menu'); break;
    case 'cp-edit': openLoadout('classpick'); break;
    case 'lb-back': renderLobby(); showScreen('lobby'); break;
    case 'pad-binds': curTab = 'BUTTONS'; buildTabs(); renderSettings(); focusFirst('#setBody .bindbtn'); break;
    case 'pad-back': curTab = 'CONTROLLER'; buildTabs(); renderSettings(); focusFirst('#setBody .bindbtn'); break;
    case 'cp-ready': showScreen(null); lockPointer(); break;
    case 'stk-back': if (stkReturn === 'lobby') renderLobby(); showScreen(stkReturn); break;
    case 'pl-leave': QP.busy = false; toLobby(); break;
    case 'res-stats': statsReturn = 'results'; statOnline = !!(M && M.online); renderStats(); showScreen('career'); break;
    case 'replay': sfx.ui(); openReplay(); break;
    case 'settings': returnScreen = curScreen || 'menu'; showScreen('settings'); break;
    case 'settings-back': showScreen(returnScreen); break;
    case 'bench': startBench(); break;
    case 'loadout': openLoadout(curScreen || 'menu'); break;
    case 'lo-back': updateClassUI(); if (returnScreen === 'lobby') renderLobby(); if (returnScreen === 'classpick') { cpPick(ACTIVE_CLASS); if (!(G.holdT > 0)) { showScreen(null); lockPointer(); break; } openClassPick(); break; } showScreen(returnScreen); break;
    case 'lo-reset': resetLoadoutWeapon(); break;
    case 'howto': returnScreen = curScreen || 'menu'; showScreen('howto'); break;
    case 'howto-back': showScreen(returnScreen); break;
    case 'credits': returnScreen = curScreen || 'menu'; showScreen('credits'); break;
    case 'credits-back': showScreen(returnScreen); break;
    case 'reset-settings': if (curTab === 'KEYBINDS') S.binds = {}; if (curTab === 'BUTTONS') S.padBinds = null; for (const it of SCHEMA[curTab]) if (it.k) S[it.k] = DEFAULTS[it.k]; if (curTab === 'VIDEO') applyPreset(qKey()); applyVideoSettings(); applyAudioSettings(); updateDiffUI(); saveSettings(); renderSettings(); break;
    case 'resume': resumeGame(); break;
    case 'restart': restartMatch(); break;
    case 'tomenu': toMenu(); break;
    case 'map-': cycleMap(-1); break;
    case 'map+': cycleMap(1); break;
    case 'class-': cycleClass(-1); break;
    case 'class+': cycleClass(1); break;
    case 'diff-': cycleDiff(-1); break;
    case 'diff+': cycleDiff(1); break;
  }
}
document.addEventListener('click', e => {
  initAudio();
  const b = e.target.closest ? e.target.closest('[data-act]') : null;
  if (b) { sfx.ui(); actions(b.getAttribute('data-act')); }
});
function goBack() {
  if (typeof oskIsOpen === 'function' && oskIsOpen()) { oskClose(); return; }
  if (curScreen === 'loadout') { updateClassUI(); if (returnScreen === 'lobby') renderLobby(); showScreen(returnScreen); }
  else if (curScreen === 'lobby') showScreen('menu');
  else if (curScreen === 'custom') actions('cus-back');
  else if (curScreen === 'career') actions('stats-back');
  else if (curScreen === 'streaks') actions('stk-back');
  else if (curScreen === 'modes') actions('modes-back');
  else if (curScreen === 'leaderboard') actions('lb-back');
  else if (curScreen === 'replay') closeReplay();
  else if (curScreen === 'playlist') actions('pl-back');
  else if (curScreen === 'results') toLobby();
  else if (curScreen === 'bpass') bpBack();
  else if (curScreen === 'locker' || curScreen === 'rewards') { if (BOXV.ov) { if (BOXV.ov.classList.contains('done')) boxClose(); } else if ($('boxSee')) lockerAct('rw-see-close'); else lockerBack(); }
  else if (curScreen === 'settings' && curTab === 'BUTTONS') actions('pad-back');
  else if (curScreen === 'settings' || curScreen === 'howto' || curScreen === 'credits') showScreen(returnScreen);
  else if (curScreen === 'pause') resumeGame();
}

/* ------------------------------------------------------------------ keyboard / pointer focus navigation in menus */
// everything the controller / arrow keys can move between: the open popup if there is one (update notes, on-screen
// keyboard, Homecoming splash), else the current screen, plus a friend-request toast if one is showing
const NAV_SEL = 'button, .sw, input[type=range], input[type=text], input:not([type])';
function navModal() { return document.querySelector('#oskBox, #hcSplash:not(.out), .app-notes, #boxOv, #boxSee'); }
function focusables() {
  const vis = x => !x.disabled && x.tabIndex !== -1 && x.getClientRects().length > 0 && getComputedStyle(x).visibility !== 'hidden';
  const modal = navModal(); if (modal) return [...modal.querySelectorAll(NAV_SEL)].filter(vis);
  const root = curScreen ? $(curScreen) : null; if (!root) return [];
  const list = [...root.querySelectorAll(NAV_SEL)];
  for (const t of document.querySelectorAll('.fr-toast')) list.push(...t.querySelectorAll('button'));
  return list.filter(vis);
}
function moveFocus(d) {
  const f = focusables(); if (!f.length) return;
  let i = f.indexOf(document.activeElement); i = i < 0 ? 0 : (i + d + f.length) % f.length;
  try { f[i].focus(); } catch (e) {} sfx.ui();
}
function adjustFocused(d) {
  const a = document.activeElement; if (!a) return;
  if (a.type === 'range') { a.value = +a.value + d * (+a.step || 1); a.dispatchEvent(new Event('input')); }
  else if (a.classList && a.classList.contains('sw')) a.click();
  else if (a.parentElement && a.parentElement.classList.contains('seg')) { const sib = d > 0 ? a.nextElementSibling : a.previousElementSibling; if (sib) { sib.click(); sib.focus(); } }
  else if (a.getAttribute && a.getAttribute('data-act') === 'diff-') { cycleDiff(d); }
  else if (a.getAttribute && /^diff/.test(a.getAttribute('data-act') || '')) cycleDiff(d);
  else if (a.getAttribute && /^class/.test(a.getAttribute('data-act') || '')) cycleClass(d);
}

/* ------------------------------------------------------------------ input */
// aiming sensitivity follows the magnification of the sight in use
function padAdsMul() { const w = WEAPONS[G.cur], o = (w && w.overlay) || 0; return (o >= 6 ? S.padAdsSens6 : o >= 4 ? S.padAdsSens4 : o >= 2 ? S.padAdsSens2 : S.padAdsSens) / 100; }
function adsSensMul() { const w = WEAPONS[G.cur], o = (w && w.overlay) || 0; return (o >= 6 ? S.adsSens6 : o >= 4 ? S.adsSens4 : o >= 2 ? S.adsSens2 : S.adsSens) / 100; }
let bindCapture = null, padCapture = null;   // Settings > KEYBINDS: waiting for the key to assign
addEventListener('keydown', e => {
  if (bindCapture) { e.preventDefault(); const f = bindCapture; bindCapture = null; if (e.code !== 'Escape') f(e.code); else renderSettings(); return; }
  if (typeof chatKey === 'function' && chatKey(e)) return;   // typing in the chat box
  if (e.target && e.target.id === 'pzChatIn') { if (e.code === 'Enter') { e.preventDefault(); commsAct('pz-send'); } else if (e.code === 'Escape') e.target.blur(); return; }
  if (e.target && e.target.id === 'lobChatIn') { if (e.code === 'Enter') { e.preventDefault(); chatSend(e.target.value, 'party'); e.target.value = ''; } return; }
  if (e.code === 'KeyV' && !e.repeat && !(e.target && e.target.tagName === 'INPUT')) VOICE.ptt = true;
  if ((e.code === 'Enter' || e.code === 'NumpadEnter') && G.state === 'playing' && !curScreen) { e.preventDefault(); chatOpen(); return; }
  keys[e.code] = true;
  if (G.state === 'deathcam') { if (G.dc && G.dc.t > 0.6 && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) finishDeath(); return; }
  if ((G.state === 'respawning' || G.state === 'spectate' || G.state === 'zdown' || G.state === 'zspec') && e.code === 'Escape') { pauseGame(); return; }
  if (G.state === 'spectate' && (e.code === 'Space' || e.code === 'Enter')) { G.specNext = true; return; }
  if (e.code === 'Tab' || e.code === bind('board')) e.preventDefault();
  if (curScreen === 'classpick' && /^Digit[1-5]$/.test(e.code)) { cpPick(+e.code.slice(5) - 1); return; }
  if (G.state !== 'playing') {
    if (!curScreen) return;
    if (curScreen === 'replay') {
      if (e.code === 'Space') { e.preventDefault(); rpToggle(); return; }
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { e.preventDefault(); rpSeekBy(e.code === 'ArrowLeft' ? -5 : 5); return; }
    }
    if (curScreen === 'lobby' && e.code === 'KeyQ' && !(document.activeElement && document.activeElement.tagName === 'INPUT')) { openPlaylist(); return; }
    if (e.code === 'ArrowDown') { moveFocus(1); e.preventDefault(); }
    else if (e.code === 'ArrowUp') { moveFocus(-1); e.preventDefault(); }
    else if (e.code === 'ArrowRight' && document.activeElement && (document.activeElement.classList.contains('cod-go') || document.activeElement.type === 'range' || (document.activeElement.parentElement && document.activeElement.parentElement.classList.contains('seg')))) { adjustFocused(1); e.preventDefault(); }
    else if (e.code === 'ArrowLeft' && document.activeElement && (document.activeElement.classList.contains('cod-go') || document.activeElement.type === 'range' || (document.activeElement.parentElement && document.activeElement.parentElement.classList.contains('seg')))) { adjustFocused(-1); e.preventDefault(); }
    else if (e.code === 'Escape') goBack();
    return;
  }
  if (e.code === 'Escape') { pauseGame(); return; }
  const c = e.code;
  if (c === bind('reload')) startReload();
  if (c === bind('inspect') && !G.reloading && !(G.inspectT > 0)) G.inspectT = 2.6;
  if (c === bind('grenade') && !e.repeat) nadeHold(true);
  if (c === bind('melee')) melee();
  if (c === bind('streak')) stkUse();
  if (c === bind('prim')) switchWeapon(0);
  if (c === bind('sec')) switchWeapon(1);
  if (c === bind('swap')) cycleWeapon(1);
  if (c === 'Space' || c.startsWith('Arrow') || c === 'Tab' || c === bind('jump')) e.preventDefault();
});
addEventListener('keyup', e => { if (e.code === 'KeyV') VOICE.ptt = false; if (CHAT.open) return; keys[e.code] = false; if (e.code === bind('grenade')) nadeHold(false); });
addEventListener('blur', () => { if (G.bench || G.look) return; for (const k in keys) keys[k] = false; mouseDown = false; if (!S.toggleAds) mouseAds = false; pad.crouch = false; pauseGame(); });
addEventListener('mousedown', e => {
  if (G.state === 'deathcam') { if (G.dc && G.dc.t > 0.6) finishDeath(); return; }
  if (G.state === 'spectate') { G.specNext = true; return; }
  if (G.state !== 'playing') return;
  if (!document.pointerLockElement && !curScreen && !G.look) { lockPointer(); return; }
  if (e.button === 0) { mouseDown = true; clickQueued = true; }
  if (e.button === 2) mouseAds = S.toggleAds ? !mouseAds : true;
});
addEventListener('mouseup', e => { if (e.button === 0) mouseDown = false; if (e.button === 2 && !S.toggleAds) mouseAds = false; });
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('wheel', e => { if (G.state === 'playing') cycleWeapon(e.deltaY > 0 ? 1 : -1); });
addEventListener('mousemove', e => {
  if ((G.state !== 'playing' && G.state !== 'zdown') || document.pointerLockElement !== renderer.domElement) return;
  const sens = 0.0022 * S.sens / 100 * lerp(1, adsSensMul(), G.ads);
  P.yaw -= e.movementX * sens; P.pitch = clamp(P.pitch - e.movementY * sens * (S.invertY ? -1 : 1), -1.5, 1.5);
});
document.addEventListener('pointerlockerror', () => showMsg('MOUSE CAPTURE BLOCKED · USE ARROW KEYS TO LOOK'));
let hadLock = false;
document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement === renderer.domElement) { hadLock = true; return; } const was = hadLock; hadLock = false; if (was && (G.state === 'playing' || G.state === 'respawning' || G.state === 'spectate') && !G.bench && !G.look) pauseGame(); });

/* ------------------------------------------------------------------ gamepad */
// Sticks: radial deadzone with an outer saturation ring, plus slow auto-calibration of a drifting centre.
// Look: response curve, full-tilt turn boost, light smoothing, separate ADS sensitivity, and aim assist
// (slowdown + friction near targets, rotational follow while moving, a gentle snap when you aim down sights).
let prevBtn = [], padBlocked = false;
const padCal = { l: [0, 0], r: [0, 0], lq: [0, 0, 0], rq: [0, 0, 0] };
const nav = { dir: '', t: 0, n: 0 };
function learnCentre(raw, cal, q, dt) {
  // a stick resting still near (not at) the centre for over 1.5 s is drift: slowly learn that as the new centre
  const m = Math.hypot(raw[0], raw[1]), moved = Math.hypot(raw[0] - q[0], raw[1] - q[1]);
  q[0] = raw[0]; q[1] = raw[1];
  if (m < 0.26 && moved < 0.006) q[2] += dt; else q[2] = 0;
  if (q[2] > 1.5) { const k = Math.min(1, dt * 0.8); cal[0] = clamp(lerp(cal[0], raw[0], k), -0.25, 0.25); cal[1] = clamp(lerp(cal[1], raw[1], k), -0.25, 0.25); }
}
function stick(x, y, cal) {
  if (cal && S.padDrift) { x -= cal[0]; y -= cal[1]; }
  const dz = S.padDeadzone / 100, outer = Math.max(dz + 0.05, S.padOuterDz / 100), m = Math.hypot(x, y);
  if (m < dz) return [0, 0, 0];
  const k = clamp((m - dz) / (outer - dz), 0, 1); return [x / m * k, y / m * k, k];
}
function lookCurve(m) {
  if (S.padCurve === 'linear') return m;
  if (S.padCurve === 'standard') return Math.pow(m, 1.8);
  return 0.3 * m + 0.7 * Math.pow(m, 2.6);   // dynamic: fine near the centre, fast at the edge
}
function padNavDir(mx, my, down) {
  if (down(12) || my < -0.55 && Math.abs(my) >= Math.abs(mx)) return 'up';
  if (down(13) || my > 0.55 && Math.abs(my) >= Math.abs(mx)) return 'down';
  if (down(14) || mx < -0.55) return 'left';
  if (down(15) || mx > 0.55) return 'right';
  return '';
}
function pollPad(dt) {
  if (G.look) return;   // test views ignore controllers
  let list = [];
  if (!padBlocked) { try { list = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { padBlocked = true; } }
  let gp = null; for (const g of list) { if (g && g.connected) { gp = g; break; } }
  if (!gp) {
    if (pad.on) { pad.on = false; showMsg('CONTROLLER DISCONNECTED'); }
    pad.gp = null; pad.mx = pad.my = pad.lx = pad.ly = 0; pad.fire = pad.ads = pad.jump = pad.sprint = pad.crouch = false; prevBtn = []; return;
  }
  if (!pad.on) { pad.on = true; showMsg('CONTROLLER CONNECTED'); }
  pad.gp = gp;
  const down = i => !!(gp.buttons[i] && gp.buttons[i].pressed), val = i => (gp.buttons[i] ? gp.buttons[i].value : 0), press = i => down(i) && !prevBtn[i];
  const rawL = [gp.axes[0] || 0, gp.axes[1] || 0], rawR = [gp.axes[2] || 0, gp.axes[3] || 0];
  if (S.padDrift) { learnCentre(rawL, padCal.l, padCal.lq, dt); learnCentre(rawR, padCal.r, padCal.rq, dt); }
  const [mx, my, mm] = stick(rawL[0], rawL[1], padCal.l), [lx, ly, lm] = stick(rawR[0], rawR[1], padCal.r);
  pad.mx = mx; pad.my = my; pad.mm = mm; pad.lx = lx; pad.ly = ly; pad.lm = lm;
  if (padCapture) { for (let i = 0; i < gp.buttons.length; i++) if (press(i) && i !== 9) { const f = padCapture; padCapture = null; f(i); break; } prevBtn = gp.buttons.map(b => b.pressed); return; }
  // a screen open over a running match (the class pick before it starts) is a menu: the pad drives it, not the soldier
  const playing = G.state === 'playing' && !curScreen;
  if (gp.buttons.some(b => b.pressed) || Math.hypot(rawL[0], rawL[1]) > 0.4 || Math.hypot(rawR[0], rawR[1]) > 0.4) inputMode('pad');
  if (G.state === 'deathcam') { if ((press(0) || press(9)) && G.dc && G.dc.t > 0.6) finishDeath(); prevBtn = gp.buttons.map(b => b.pressed); return; }
  if (press(9)) { if (playing || G.state === 'respawning' || G.state === 'spectate' || G.state === 'zdown' || G.state === 'zspec') pauseGame(); else if (G.state === 'paused') resumeGame(); else if (curScreen === 'lobby') actions('lob-start'); else if (curScreen === 'menu') toLobby(); else if (G.state === 'dead') restartMatch(); }
  pad.board = down(pb('board')); pad.use = playing && down(pb('reload'));
  if (G.state === 'spectate' && press(0)) G.specNext = true;
  // analog triggers with a little hysteresis so a half-pull doesn't chatter
  const thr = S.padTrigger / 100, rt = Math.max(val(7), down(7) && !gp.buttons[7].value ? 1 : 0), lt = Math.max(val(6), down(6) && !gp.buttons[6].value ? 1 : 0);
  const fireNow = playing && (pad.fire ? rt > thr - 0.06 : rt > thr);
  if (fireNow && !pad.fire) clickQueued = true;
  pad.fire = fireNow;
  const adsNow = playing && (pad.ads ? lt > thr - 0.06 : lt > thr);
  if (adsNow && !pad.ads) startAdsSnap();
  pad.ads = adsNow; pad.jump = playing && down(pb('jump'));
  if (playing) {
    if (S.padCrouch === 'hold') pad.crouch = down(pb('crouch')); else if (press(pb('crouch'))) pad.crouch = !pad.crouch;
    if (press(pb('reload')) && !G.interactTxt) startReload();
    if (press(pb('swap'))) cycleWeapon(1);
    VOICE.ptt = down(14);   // push to talk: D-pad left
    if (press(pb('grenade'))) nadeHold(true); else if (!down(pb('grenade')) && prevBtn[pb('grenade')]) nadeHold(false);
    if (press(pb('inspect')) && !G.reloading && !(G.inspectT > 0)) G.inspectT = 2.6;
    if (press(pb('melee'))) melee();
    if (press(pb('streak'))) stkUse();
    const fwdPush = -my;
    const sb = pb('sprint');
    if (S.padSprint === 'hold') pad.sprint = down(sb);
    else if (S.padSprint === 'auto') { pad.autoT = fwdPush > 0.85 && mm > 0.92 ? (pad.autoT || 0) + dt : 0; pad.sprint = pad.autoT > 0.22 || (pad.sprint && fwdPush > 0.6) || press(sb) || (pad.sprint && down(sb)); }
    else if (press(sb)) pad.sprint = !pad.sprint;
    if (pad.sprint && (pad.crouch && press(pb('crouch')))) pad.sprint = false;
  } else {
    pad.crouch = false;
    if (curScreen || navModal()) menuPad(dt, mx, my, ly, press, down);
  }
  if (!playing || (S.padSprint !== 'hold' && Math.hypot(mx, my) < 0.3)) pad.sprint = false;
  prevBtn = gp.buttons.map(b => b.pressed);
}
// menus: hold a direction to repeat (accelerating), bumpers change tabs, right stick scrolls, Y resets
function menuPad(dt, mx, my, ry, press, down) {
  const d = padNavDir(mx, my, down);
  if (d || press(0) || press(1)) document.body.classList.add('padnav');
  if (typeof oskPad === 'function' && oskPad(press)) { if (d !== nav.dir) { nav.dir = d; if (d) spatialFocus(d); } return; }
  const modal = navModal();
  if (modal && modal.id !== 'hcSplash') {   // update notes: A on OK, B closes
    if (d !== nav.dir) { nav.dir = d; if (d) spatialFocus(d); }
    if (press(0) || press(1)) { const a = document.activeElement, f = focusables(); (f.includes(a) ? a : f[0] || { click() {} }).click(); }
    return;
  }
  if (d !== nav.dir) { nav.dir = d; nav.n = 0; if (d) { menuMove(d); nav.t = 0.34; } }
  else if (d) { nav.t -= dt; if (nav.t <= 0) { menuMove(d); nav.n++; nav.t = Math.max(0.045, 0.1 - nav.n * 0.005); } }
  if (press(3) && curScreen === 'lobby') { openPlaylist(); return; }
  if (curScreen === 'replay') { if (press(2)) rpToggle(); if (press(4) || press(5)) rpSeekBy(press(4) ? -5 : 5); if (press(1)) goBack(); if (press(0)) { const a = document.activeElement; if (a && a.click && focusables().includes(a)) a.click(); } return; }
  if (press(0)) { const a = document.activeElement; if (a && focusables().includes(a)) { if (a.tagName === 'INPUT' && a.type !== 'range') oskOpen(a); else if (a.click) a.click(); } else { const f = focusables(); if (f[0]) f[0].focus(); } }
  if (press(1)) goBack();
  if (press(4) || press(5)) menuTab(press(4) ? -1 : 1);
  if (press(3)) { if (curScreen === 'loadout') actions('lo-reset'); else if (curScreen === 'settings') actions('reset-settings'); }
  if (Math.abs(ry) > 0.05) { let el = document.activeElement; while (el && el !== document.body && !(el.scrollHeight > el.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(el).overflowY))) el = el.parentElement; if (el && el !== document.body) el.scrollTop += ry * 900 * dt; }
}
function menuTab(d) {
  if (curScreen === 'loadout') loadoutTab(d);
  else if (curScreen === 'lobby') {}
  else if (curScreen === 'career') statsTab(d);
  else if (curScreen === 'settings') { const ks = Object.keys(SCHEMA).filter(k => k !== 'BUTTONS'); curTab = ks[(ks.indexOf(curTab) + d + ks.length) % ks.length]; buildTabs(); renderSettings(); sfx.ui(); setTimeout(() => { const t = $('tabs').querySelector('.on'); if (t) t.focus(); }, 0); }
  else if (curScreen === 'menu') cycleClass(d);
}
function menuMove(d) {
  const a = document.activeElement, adjustable = a && ((a.classList && a.classList.contains('cod-go')) || a.type === 'range' || (a.classList && a.classList.contains('sw')) || (a.parentElement && a.parentElement.classList.contains('seg')) || /^(diff|class)/.test((a.getAttribute && a.getAttribute('data-act')) || ''));
  if ((d === 'left' || d === 'right') && curScreen === 'replay' && a && a.id === 'rpSeek') { rpSeekBy(d === 'right' ? 5 : -5); return; }
  if ((d === 'left' || d === 'right') && adjustable && curScreen !== 'loadout') { adjustFocused(d === 'right' ? 1 : -1); return; }
  spatialFocus(d);
}
// move focus to the nearest control in a direction (falls back to list order at the ends)
function spatialFocus(d) {
  const f = focusables(); if (!f.length) return;
  const a = document.activeElement; if (!f.includes(a)) { try { f[0].focus(); } catch (e) {} return; }
  const r0 = a.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
  const dx = d === 'left' ? -1 : d === 'right' ? 1 : 0, dy = d === 'up' ? -1 : d === 'down' ? 1 : 0;
  let best = null, bs = 1e9;
  for (const el of f) {
    if (el === a) continue;
    const r = el.getBoundingClientRect(); if (!r.width && !r.height) continue;
    // distance from the edge of the current control, so long rows and short chips both behave
    const ex = clamp(cx, r.left, r.right), ey = clamp(cy, r.top, r.bottom);
    const vx = (dx ? (dx > 0 ? r.left - r0.right : r0.left - r.right) * dx : ex - cx), vy = (dy ? (dy > 0 ? r.top - r0.bottom : r0.top - r.bottom) * dy : ey - cy);
    const along = dx ? vx * dx : vy * dy, across = dx ? Math.abs((r.top + r.height / 2) - cy) : Math.abs((r.left + r.width / 2) - cx);
    if (along < -2) continue;
    const s = Math.max(0, along) + across * (dx ? 1.2 : 0.6);
    if (s < bs) { bs = s; best = el; }
  }
  if (!best && dy) { const i = f.indexOf(a); best = f[(i + dy + f.length) % f.length]; }
  if (best) { try { best.focus(); best.scrollIntoView && best.scrollIntoView({ block: 'nearest' }); } catch (e) {} sfx.ui(); }
}

/* ---------- aim assist */
const AA = { off: null, low: { fr: 0.72, cone: 0.05, rot: 0.25, snap: 0 }, standard: { fr: 0.55, cone: 0.075, rot: 0.5, snap: 0.55 }, strong: { fr: 0.45, cone: 0.1, rot: 0.7, snap: 0.9 } };
const _toE = new THREE.Vector3(), _fw = new THREE.Vector3(), _aaR = new THREE.Raycaster();
let aaT = null, aaLosT = 0, aaLos = false, aaYaw = 0, aaPitch = 0, aaHad = false;
function aimPoint(e, out) { const sc = (e.rig.root.userData.scale || 1); return out.set(e.group.position.x, (e.crouchK ? 1.25 - e.crouchK * 0.35 : 1.25) * sc, e.group.position.z); }
// nearest enemy to the crosshair inside the cone (angle in radians), visible, within 50 m
function aaPick(cone) {
  _fw.set(0, 0, -1).applyQuaternion(camera.quaternion);
  let best = null, ba = cone;
  for (const e of enemies) {
    if (isFriend(e)) continue;
    aimPoint(e, _toE).sub(camera.position); const d = _toE.length(); if (d > 50 || d < 1) continue;
    const ang = Math.acos(clamp(_toE.normalize().dot(_fw), -1, 1)) * Math.min(1, 0.35 + d / 25);   // a bit more forgiving close up
    if (ang < ba) { ba = ang; best = e; }
  }
  if (best !== aaT) { aaT = best; aaLosT = 0; aaHad = false; }
  if (aaT && (aaLosT -= 1 / 60) <= 0) { aaLosT = 0.1; aimPoint(aaT, _toE); const dist = _toE.distanceTo(camera.position); _aaR.set(camera.position, _toE.sub(camera.position).normalize()); _aaR.far = dist - 0.6; aaLos = _aaR.intersectObjects(wallMeshes, false).length === 0; }
  return aaT && aaLos ? aaT : null;
}
function bearingTo(e) { aimPoint(e, _toE).sub(camera.position); return [Math.atan2(-_toE.x, -_toE.z), Math.atan2(_toE.y, Math.hypot(_toE.x, _toE.z))]; }
function startAdsSnap() {
  const L = AA[S.padAssist]; if (!L || !L.snap || !pad.on) return;
  const e = aaPick(L.cone * 1.4); if (e) G.snap = { e, t: 0.16, k: L.snap };
}
function applyPadLook(dt) {
  if (!pad.on) return;
  const L = AA[S.padAssist], target = L && G.state === 'playing' ? aaPick(L.cone) : null;
  // stick -> angular velocity
  const m = pad.lm || 0, out = m > 0 ? lookCurve(m) / m : 0;
  if (m > 0.93) pad.turnT = (pad.turnT || 0) + dt; else pad.turnT = Math.max(0, (pad.turnT || 0) - dt * 5);
  const boost = 1 + (S.padAccel / 100) * 0.9 * smooth(0.12, 0.45, pad.turnT) * (1 - G.ads);
  let k = lerp(1, padAdsMul(), G.ads) * S.padSens / 100;
  if (target) k *= lerp(L.fr, 1, clamp(Math.acos(clamp(_toE.copy(aimPoint(target, _toE)).sub(camera.position).normalize().dot(_fw.set(0, 0, -1).applyQuaternion(camera.quaternion)), -1, 1)) / L.cone, 0, 1) * 0.6);
  const tvx = -pad.lx * out * 3.6 * k * boost, tvy = -pad.ly * out * 2.7 * k * (S.padInvertY ? -1 : 1);
  const tau = S.padSmooth / 100 * 0.07, a = tau > 0 ? 1 - Math.exp(-dt / tau) : 1;
  pad.vx = lerp(pad.vx || 0, tvx, a); pad.vy = lerp(pad.vy || 0, tvy, a);
  if (Math.abs(pad.vx) < 1e-4 && !tvx) pad.vx = 0; if (Math.abs(pad.vy) < 1e-4 && !tvy) pad.vy = 0;
  P.yaw += pad.vx * dt; P.pitch = clamp(P.pitch + pad.vy * dt, -1.5, 1.5);
  // rotational assist: while you move or aim, follow part of the target's drift across the screen
  if (target) {
    const [by, bp] = bearingTo(target);
    if (aaHad && (pad.mm > 0.1 || m > 0.05)) { let dy = by - aaYaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; P.yaw += clamp(dy, -0.05, 0.05) * L.rot; P.pitch = clamp(P.pitch + clamp(bp - aaPitch, -0.03, 0.03) * L.rot * 0.6, -1.5, 1.5); }
    aaYaw = by; aaPitch = bp; aaHad = true;
  } else aaHad = false;
  // ADS snap: ease toward the target for a fraction of a second
  if (G.snap) {
    const s = G.snap; s.t -= dt;
    if (s.t <= 0 || !enemies.includes(s.e) || !G.adsOn) G.snap = null;
    else { const [by, bp] = bearingTo(s.e); let dy = by - P.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; const f = clamp(dt * 14, 0, 1) * s.k; P.yaw += dy * f; P.pitch = clamp(P.pitch + (bp - P.pitch) * f, -1.5, 1.5); }
  }
}

/* ------------------------------------------------------------------ main loop */
let last = performance.now(), ready = false, fpsAcc = 0, fpsN = 0;
function menuCamera() {
  const V = MENU_VIEW, a = NOW * 0.07, r = V.r || 12.5, by = V.by || 0;
  camera.position.set(V.x + Math.cos(a) * r - 1, by + (V.y || 2.1) + Math.sin(NOW * 0.25) * 0.25, V.z + Math.sin(a) * r * 0.8);
  _fw.set(-Math.sin(a), 0, Math.cos(a)); // sideways, so the soldiers sit right of the menu text
  camera.lookAt(_toE.set(V.x, by + 1.3, V.z).addScaledVector(_fw, 1.8));
  if (camera.fov !== 52) { camera.fov = 52; camera.updateProjectionMatrix(); }
}
function tick(dt) {
  pollPad(dt);
  try { rpTick(dt); } catch (e) {}
  if (G.holdT > 0 && M && !G.bench && G.state !== 'over' && G.state !== 'plobby') updateHold(dt);
  skyMat.uniforms.time.value += dt; sky.position.copy(camera.position);
  updateGrain(dt); updateAmbience(NOW); updateFires(dt, NOW); if (typeof hospFlicker === 'function') hospFlicker(dt); if (typeof audioTick === 'function') audioTick(dt); if (typeof zpTick === 'function' && M && M.mode === 'zomb') zpTick(dt);
  fpsAcc += dt; fpsN++; if (fpsAcc >= 0.5) { if (S.showFps) $('fps').textContent = Math.round(fpsN / fpsAcc) + ' FPS' + (S.dynRes && DR.scale < 0.999 ? `  ·  RES ${Math.round(DR.scale * 100)}%` : ''); fpsAcc = 0; fpsN = 0; }
  if (G.state === 'playing') {
    G.time += dt;
    G.adsOn = mouseAds || pad.ads;
    applyPadLook(dt);
    const lkx = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0), lky = (keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0);
    if (lkx || lky) { const k = lerp(1, adsSensMul(), G.ads) * S.sens / 100; P.yaw += lkx * 2.4 * k * dt; P.pitch = clamp(P.pitch + lky * 1.7 * k * dt, -1.5, 1.5); }
    const { moving, sprint } = updatePlayer(dt);
    G.fireT -= dt; if (G.swapT > 0) G.swapT -= dt;
    const w = WEAPONS[G.cur];
    if (G.reloading) { G.reloadT -= dt; if (G.reloadT <= 0) finishReload(); }
    const want = (w.auto ? isFiring() : clickQueued) && !(G.holdT > 0);
    if (want && !sprint && !G.reloading && G.swapT <= 0 && G.fireT <= 0 && G.state === 'playing' && G.time - (G.sprintEnd || -9) > (perk('endure') ? 0.09 : 0.15)) {
      if (w.ammo > 0) shoot(moving); else { sfx.click(); G.fireT = 0.25; startReload(); }
    }
    else if (G.burstLeft > 0 && G.fireT <= 0 && !G.reloading && G.swapT <= 0 && w.ammo > 0 && G.state === 'playing') shoot(moving);
    clickQueued = false;
    if (w.ammo === 0 && !G.reloading && w.reserve > 0 && G.swapT <= 0 && G.fireT <= 0) startReload();
    const used = inMatch() ? playerInteract(dt, kb('use') || pad.use) : false;
    if (inMatch()) { updateBots(dt); updateMatch(dt); } else if (M.mode === 'zomb') { updateNav(P.x, P.z); updateZombies(dt); } else { updateNav(P.x, P.z); updateWaves(dt); updateEnemies(dt); }
    updateGrenades(dt); updatePickups(dt); updateHud();
  } else if (G.state === 'menu') { menuCamera(); updateMenuSoldiers(dt); }
  else if (M.mode === 'zomb' && typeof ZC !== 'undefined' && ZC.on && ZC.inGame && (G.state === 'paused' || G.state === 'zdown' || G.state === 'zspec')) { try { zcBackTick(dt); } catch (err) { reportError(err); } }
  else if (G.state === 'paused' && M.online) {   // online the match carries on behind the pause menu (bots, rounds, gravity)
    P.vy -= 22 * dt; P.y += P.vy * dt; const gy = groundAt(P.x, P.z, P.y); if (P.y <= gy) { P.y = gy; P.vy = 0; }
    updateBots(dt); updateMatch(dt); updateGrenades(dt); updateHud();
  }
  else if (G.state === 'plobby' && M.online && NET.priv) privTick(dt);
  else if (G.state === 'over' && inMatch()) { tickIntermission(dt); if (M.online) { P.vy -= 22 * dt; P.y += P.vy * dt; const gy = groundAt(P.x, P.z, P.y); if (P.y <= gy) { P.y = gy; P.vy = 0; } } }
  else if (G.state === 'respawning' || G.state === 'spectate') {
    if (G.state === 'respawning' && G.dc) { G.dc.t += dt; aimDeathCam(dt, Math.min(G.dc.t / G.dc.dur, 1)); }
    updateBots(dt); updateMatch(dt); updateGrenades(dt); updateHud();
  }
  else if (G.state === 'deathcam' && inMatch()) { updateDeathCam(dt); updateBots(dt); updateMatch(dt); updateGrenades(dt); }
  else if (G.state === 'dead' && G.dcHold) { if (G.dc) { G.dc.t += dt; aimDeathCam(dt, Math.min(G.dc.t / G.dc.dur, 1)); } }
  else if (G.state === 'dead') { P.pitch = lerp(P.pitch, -0.35, dt * 2); camera.rotation.set(P.pitch, P.yaw, lerp(camera.rotation.z, 0.5, dt * 2)); camera.position.y = lerp(camera.position.y, 0.5, dt * 3); }
  else if (G.state === 'deathcam') { const w = dt * 0.32; updateDeathCam(dt); updateEnemies(w); updateGrenades(w); }
  if (M.online) { try { netTick(dt); } catch (err) { reportError(err); } }
  if (inMatch() && G.state !== 'over' && G.state !== 'menu' && G.state !== 'plobby') { try { updateStreaks(dt); } catch (err) { reportError(err); } }
  const wdt = G.state === 'deathcam' && !inMatch() ? dt * 0.32 : dt;
  tickStats(dt); setScoreboard(kb('board') || pad.board);
  try { updatePolish(dt); } catch (err) { reportError(err); }
  updateDying(wdt); updateFx(wdt);
}
// online, a minimised or hidden window keeps running the match (browsers stop animation frames when hidden,
// which would freeze the host's bots and rounds): a worker timer drives the game logic at 20 Hz until it is visible
try {
  const bgW = new Worker(URL.createObjectURL(new Blob(['let t=null;onmessage=e=>{clearInterval(t);t=null;if(e.data)t=setInterval(()=>postMessage(0),50)}'], { type: 'text/javascript' })));
  let bgLast = performance.now();
  bgW.onmessage = () => { if (!document.hidden || !(M.online || (typeof ZC !== 'undefined' && ZC.on && ZC.inGame)) || !ready) return; const now = performance.now(), dt = Math.min(0.1, (now - bgLast) / 1000); bgLast = now; NOW += dt; try { tick(dt); } catch (e) {} };
  const bgSync = () => { bgLast = performance.now(); bgW.postMessage(document.hidden && M && (M.online || (typeof ZC !== 'undefined' && ZC.on && ZC.inGame)) ? 1 : 0); };
  document.addEventListener('visibilitychange', bgSync); setInterval(bgSync, 3000);
} catch (e) {}
function renderFrame() {
  const showVm = viewmodel && (G.state === 'playing' || G.state === 'paused') && !G.scoped;
  if (viewmodel) viewmodel.visible = !!showVm;
  const wob = typeof ZP !== 'undefined' && ZP.wobT > 0, crz = camera.rotation.z, cpy = camera.position.y; if (wob) zpWobble();
  renderer.clear(); renderer.render(scene, camera);
  if (wob) { camera.rotation.z = crz; camera.position.y = cpy; }
  if (showVm) { updateGunShader(); renderer.clearDepth(); renderer.render(vmScene, vmCamera); }
}
// FRAME RATE LIMIT: skip display refreshes until the next frame is due (the display's own rate is the ceiling)
let lastRaf = 0, capDue = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const rafDt = (now - lastRaf) / 1000; lastRaf = now;
  if (curScreen && G.state !== 'playing') try { sampleHz(rafDt); } catch (e) {}
  if (S.fpsCap > 0 && !G.bench && !G.noRender) {
    const step = 1000 / S.fpsCap;
    if (now < capDue - 1.5) return;                      // not due yet (1.5 ms slack so 60 on a 60 Hz screen never skips)
    capDue += step; if (capDue < now - step) capDue = now + step;   // steady cadence; after a stall start fresh (no burst)
  }
  const raw = (now - last) / 1000, dt = Math.min(raw, 0.05); last = now; NOW += dt;
  try { updateDynRes(raw); } catch (e) { reportError(e); }
  if (ready && G.bench) { try { benchPre(raw); } catch (e) { reportError(e); } }
  if (ready && G.look && G.state === 'playing') { Object.assign(P, G.look, { vx: 0, vz: 0 }); mouseDown = false; G.health = 100; if (G.lookAds) mouseAds = true; }
  if (ready) { try { tick(dt); } catch (e) { reportError(e); } try { realTexTick(); } catch (e) { reportError(e); } try { cosmTick(dt); } catch (e) {} }
  if (!G.noRender) { try { renderFrame(); updatePreview(dt); } catch (e) { reportError(e); } }   // noRender: logic-only test runs
  if (G.bench) { try { benchPost(); } catch (e) { reportError(e); } }
}

/* ------------------------------------------------------------------ boot: build the world in small steps so the loading bar can paint */
const BOOT = [
  ['BUILDING TEXTURES', () => { buildTextures(); try { realTexStart(); } catch (e) {} }],
  ['PREPARING MATERIALS', () => { buildMaterials(); buildViewmodelMaterials(); addFresnelAll(MAT); addFresnelAll(VM); buildMapMaterials(); }],
  ['BUILDING THE MAP', () => loadMap(DEFAULT_MAP)],
  ['EQUIPPING SOLDIERS', () => { buildSoldierTemplates(); addFresnelAll(SOLD.mats); addFresnelAll(SOLD.skinMats); setupViewmodel(); initAttachments(); }],
  ['LOADING EFFECTS', buildFx],
  ['LIGHTING THE SKY', () => { buildEnvironment(); applyVideoSettings(); applyAudioSettings(); }],
];
function bootStep(i) {
  if (i >= BOOT.length) {
    setLoad(1, 'READY'); ready = true; G.state = 'menu';
    if (typeof location !== 'undefined' && /^#bench/.test(location.hash || '')) setTimeout(() => { if (G.state === 'menu') startBench(); }, 600);
    // #look: a quiet still view of cover and concrete (no enemies) for checking materials
    if (typeof location !== 'undefined' && /^#look/.test(location.hash || '')) setTimeout(() => {
      clearMenuSoldiers(); resetGame(); G.state = 'playing'; G.breakT = 1e9; showScreen(null);
      G.look = { x: -3.5, z: 10.5, yaw: 0.05, pitch: -0.18 };
      // #lookatt / #lookscope: show a demo attachment set (not saved)
      try { Storage.prototype.setItem = function () {}; } catch (e) {}
      const gm = /^#lookgun=(\w+)(?:,(\w+))?/.exec(location.hash);
      if (/^#lookatt/.test(location.hash)) { ATTS.marc = { optic: 'holo', muzzle: 'suppressor', underbarrel: 'laser', magazine: 'drum', barrel: 'long', stock: 'tacstock' }; equipClass({ p: 'marc', s: 'sidearm', e: 'frag', k: 'none' }); }
      if (/^#lookscope/.test(location.hash)) { ATTS.marc = { optic: 'acog4', muzzle: 'brake', underbarrel: 'vgrip' }; equipClass({ p: 'marc', s: 'sidearm', e: 'frag', k: 'none' }); G.lookAds = true; }
      if (gm && ARM[gm[1]]) { const d = ARM[gm[1]], pri = CATS[d.cat].slot === 'primary'; equipClass({ p: pri ? d.id : 'marc', s: pri ? 'sidearm' : d.id, e: 'frag', k: 'none' }); if (!pri) switchWeapon(1); G.swapT = 0; if (gm[2] === 'ads') G.lookAds = true; }
    }, 600);
    spawnMenuSoldiers(); updateDiffUI(); updateClassUI(); updateBestUI(); buildTabs(); renderSettings(); showScreen('menu');
    $('loading').classList.add('hide'); return;
  }
  setLoad(i / BOOT.length, BOOT[i][0]);
  setTimeout(() => { try { BOOT[i][1](); } catch (e) { reportError(e); return; } bootStep(i + 1); }, 30);
}
requestAnimationFrame(frame);
bootStep(0);

// test hook: open the page with #debug to expose a few internals for play-testing
try { if (location.hash === '#debug') window.__A = { sfx, AUD, audioMap, get listener() { return listener; }, get atFn() { return at; }, get actx() { return actx; }, get pickups() { return pickups; }, netShot, zcDrop, ZV, ZCHARS, ZLINES, zvSay, zvSpeak, zpTick, zpStartAnim, ZP, ZPERKS, zpBuy, zpNear, zombGunMul, zombHp, zombStagger, zombEquip, get MYCODE() { return MYCODE; }, partyJoin, partyMembers, partyWaiting, PARTY, zuNear, zombCrateTick, ZD, ZDOORS, zdOpen, zdBuy, zuBuy, zdSpawnPts, ZC, zcJoin, zcLeave, zcHostStart, zcInGame, zcDown, zcHost, zombTargets, Z, ZL, zombAct, zombBuyBox, zombBuyAmmo, openZLobby, makeZombie, botLoadout, botGunVisual, botApplyGun, withAtts, botRandomAtts, grindKill, grindCheck, grindRow, grindBadge, GRIND_IDS, grindStat, CHAT, chatAdd, chatSend, chatOpen, chatClose, VOICE, commsAct, renderPauseSide, pauseGame, nadeStep, nadeHold, nadeLaunch, mkBox, get boxesArr() { return boxes; }, rebuildBoxGrid, inputMode, PASS, BPV, bpTier, bpGain, bpSync, bpReward, bpSetPremium, openBattlePass, gunPic, THUMB, secretPairs, get PRIME_POOL() { return PRIME_POOL; }, forceBox(id, gun) { BOX_FORCE = { it: COS[id], gun: gun || null }; }, playSecretReveal, get SECRET_VID() { return SECRET_VID; }, PROG, COSM, COS, RAR, BOXES, BOX_POOL, cosmCanvas, swatchUrl, boxContents, rollBox, ownsFor, LK, renderLocker, progMatchXP, openLocker, openRewards, lockerAct, openBox, claimDaily, applyCamo, camoFor, applySticker, stickerFor, lvlInfo, XP_AT, saveProg, BOXV, HW, DR, FX, sun, SHADOWQ, applyPreset, renderSettings, buildTabs, getGrass: () => grassMesh && [grassMesh.count, grassMax], G, P, S, enemies, dying, camera, startGame, spawnEnemy, damageEnemy, hurtPlayer, throwGrenade, explode, applySetting, equipClass, ARMORY, ARM, ATTS, CLASSES, EQUIP, PERKS, ATT, applyLoadout, switchWeapon, computeStats, prosCons, attFor, slotsFor, stockFor, relMods, openLoadout, makeEnemy, shoot, startReload, pad, keys, grenadesInFlight, renderFrame, get W() { return WEAPONS; }, get gunObjs() { return gunObjs; }, selectClass, actions, pollPad, get navBlocked() { return navBlocked; }, NN, startMatch, get M() { return M; }, PV, LOBBY, NET, toLobby, toMenu, LAYOUT, setScoreboard, buildGunModel, attachVisuals, renderer, scene, SMP, sfx, REALTEX, get STATSOBJ() { return STATS; }, get STATSON() { return STATS_ON; }, startMatchStats, statKillAt, statDeath, finishMatchStats, commitPartialStats, leaveGame, loadMap, MAPS, MAP_ORDER, get curMap() { return curMap; }, flowField, nodeOf, gridClear, lvN, lvH, lvS, NL, NN, boxes, buildSpawns, get MAP_BUILD_MS() { return MAP_BUILD_MS; }, MAT, TEX, STATS: () => STATS, get curScreen() { return curScreen; }, renderPlobby, actions, hurtPlayer, STK, stkAdd, stkUse, get STK_SEL() { return STK_SEL; }, hqAtt, ironEye, get vmCamera() { return vmCamera; }, HQDATA: typeof HQDATA !== "undefined" ? HQDATA : null, endMatch, nextMatch, respawnPlayer, setActive(i) { ACTIVE_CLASS = i; }, get REC() { return REC; }, get RPLAST() { return RPLAST; }, openReplay, RV, get BRAIN() { return BRAIN; }, brainLevel, brainSummary, hcShow, oskOpen, oskKey, stunBlast, stkSeen, perkOnKill, MUS, initAudio, musRender }; } catch (e) {}
// self-running visual test (only in builds that set window.ASHFALL_AUTOTEST): menu, combat, ragdolls, grenade, death cam
if (window.ASHFALL_AUTOTEST) {
  try { Storage.prototype.setItem = function () {}; } catch (e) {}
  const T0 = performance.now(), past = s => performance.now() - T0 > s * 1000;
  const tag = document.createElement('div'); tag.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99;font:12px monospace;color:#ff0;background:rgba(0,0,0,.5);padding:2px 6px'; document.body.appendChild(tag);
  let phase = 0, test = [];
  const put = (d, lat) => { const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); return [P.x + fx * d + rx * lat, P.z + fz * d + rz * lat]; };
  const spawnAt = (type, d, lat) => { const [x, z] = put(d, lat); const e = makeEnemy(type, x, z); e.group.rotation.y = Math.atan2(P.x - x, P.z - z); e.cd = 99; enemies.push(e); return e; };
  setInterval(() => {
    tag.textContent = 'AUTOTEST ' + ['menu', 'deployed', 'enemies', 'shots', 'grenade', 'death cam'][phase] + '  t=' + ((performance.now() - T0) / 1000).toFixed(1) + 's  state=' + G.state + '  ragdolls=' + dying.filter(d => d.rd).length;
    if (!ready) return;
    if (phase >= 1 && phase < 5 && G.state === 'playing') G.health = 1e6;
    if (phase === 0 && past(7)) { phase = 1; startGame(); }
    else if (phase === 1 && past(9)) { phase = 2; for (const e of enemies.slice()) { scene.remove(e.group); enemies.splice(enemies.indexOf(e), 1); } test = [spawnAt('rifleman', 7, -1.6), spawnAt('heavy', 8, 0.6), spawnAt('scout', 10, 2.4), spawnAt('rifleman', 11, -0.4)]; }
    else if (phase === 2 && past(15)) { phase = 3; const f = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)); if (enemies.includes(test[0])) damageEnemy(test[0], 1e5, false, f); if (enemies.includes(test[1])) damageEnemy(test[1], 1e5, true, f); }
    else if (phase === 3 && past(18)) { phase = 4; const a = test[2].group.position, b = test[3].group.position; explode(new THREE.Vector3((a.x + b.x) / 2, 0.4, (a.z + b.z) / 2)); }
    else if (phase === 4 && past(25)) { phase = 5; const k = spawnAt('heavy', 9, 1.5); G.killer = k; G.health = 1; hurtPlayer(5, k.group.position.x, k.group.position.z); }
  }, 100);
}
