/* ================================================================== ZOMBIES: the four survivors and their voices
   Pick one in the Zombies lobby. Each has their own voice (the computer's built-in text-to-speech: a different voice,
   pitch and speed each) and lines for the moments that matter, shown as subtitles too. Every perk gets a reaction to
   the smoking or the edible. In co-op you hear your teammates' lines in their voices (sent with your presence).
   They are written to grow into a story later: who they are and why they were in Blackwell the night it fell. */
const ZCHARS = [
  { id: 'doc', name: 'DOC', full: '"DOC" REYES', bio: 'Dr. Marcus Reyes · the hospital\'s best surgeon until the night he signed off on the trial', col: '#7ab8ff', voice: { want: ['david', 'guy', 'george', 'mark', 'male'], female: false, pitch: 0.75, rate: 0.92 } },
  { id: 'tank', name: 'TANK', full: 'TANYA "TANK" BRIGGS', bio: 'ex-army medic on the night shift · loud, fearless, hates paperwork', col: '#ff7a5a', voice: { want: ['zira', 'aria', 'susan', 'jenny', 'female'], female: true, pitch: 0.85, rate: 1.08 } },
  { id: 'smokes', name: 'SMOKES', full: 'LEROY "SMOKES" DAWSON', bio: 'the orderly who knows every back door · nothing rattles him, except running out', col: '#8fe07a', voice: { want: ['mark', 'ryan', 'james', 'david', 'male'], female: false, pitch: 0.6, rate: 0.82 } },
  { id: 'sparks', name: 'SPARKS', full: 'PENNY "SPARKS" HOLLOWAY', bio: 'contract electrician, came to fix the generators · jumpy, clever, talks when scared', col: '#ffd24a', voice: { want: ['hazel', 'sonia', 'libby', 'zira', 'female'], female: true, pitch: 1.35, rate: 1.15 } },
];
// lines: [character][moment] -> list. bowl / joint / edible are the perk reactions.
const ZLINES = {
  doc: {
    spawn: ['Blackwell General. I used to save lives here. Now I just want to save mine.', 'Wards closed, power out, staff... eating each other. Lovely shift.', 'If anyone needs a doctor, I am, technically, still on call.'],
    round: ['Here comes the next batch of patients.', 'They never cancel their appointments, do they.', 'Triage says: shoot them all.'],
    roundEnd: ['Clean. For now.', 'Breathe. Reload. They will be back.', 'Quiet. I hate quiet.'],
    door: ['More of my old hospital. Fewer of my old staff.', 'Open. Mind the blood, it was a good floor once.', 'Worth every point. Probably.'],
    box: ['Let us see what the box prescribes.', 'Second opinion from a mystery crate. Why not.'],
    upgrade: ['Now that is what I call a procedure.', 'Upgraded. Do not tell the ethics board.'],
    down: ['I am down! Somebody... scrub in!', 'Medic! And I mean a real one!'],
    revived: ['Thank you. Your bedside manner is terrible, but thank you.', 'Back on my feet. Do not make it a habit.'],
    reviving: ['Up you get. That is the free consultation.', 'You are fine. Mostly. Walk it off.'],
    streak: ['Another one for the morgue.', 'Time of death: now.', 'I am filling out a lot of certificates tonight.'],
    ammo: ['I am low on ammunition. And patience.', 'Running dry here.'],
    broke: ['I cannot afford that. Story of my residency.', 'Not enough points. Not enough anything.'],
    bowl: ['Medicinal. Strictly medicinal. Cough. Very medicinal.', 'I prescribed this to a patient once. He was very happy. So am I.', 'Oh, that is a stronger dose than the chart said.', 'My hands are steady. My mind is on a beach somewhere. Perfect for surgery.', 'Ten years of medical school and this is the best thing I have learned.'],
    joint: ['Doctor\'s orders. I am the doctor. I ordered it.', 'Pass the... no. Mine. Get your own.', 'Ah. That takes the edge off the end of the world.', 'If I die tonight, at least my blood pressure is perfect.', 'I used to tell patients not to smoke. Hypocrisy tastes wonderful.'],
    edible: ['A gummy bear. The most dangerous thing in this hospital, give it forty minutes.', 'Ate the whole thing. That was not the recommended dose. Fine.', 'Tastes like cherry and bad decisions.', 'I am going to be very relaxed in about an hour. Assuming I live an hour.', 'Childproof packaging. Zombie-proof stomach.'],
  },
  tank: {
    spawn: ['Alright, dead heads. Mama\'s on shift.', 'Twelve hour shift and now this. Somebody owes me overtime.', 'I did two tours. A hospital full of biters? Cute.'],
    round: ['Here they come! Line them up!', 'Come on then! Who wants a beating first?', 'Next wave! Do not let them touch you, they are disgusting!'],
    roundEnd: ['That is how it is done!', 'Round over! Hydrate, hustle, kill!', 'Ha! Too easy. Do not quote me.'],
    door: ['Door\'s open. Watch your corners!', 'Kicked it open. Okay, paid to open it. Same thing.', 'New room, new victims.'],
    box: ['Come on box, give mama something big.', 'If this is another pistol I am punching the box.'],
    upgrade: ['Oh, now we are talking. That is a big gun.', 'Upgraded and angry. Perfect combo.'],
    down: ['I am down! Get your butt over here!', 'Do not just stand there, pick me up!'],
    revived: ['Took you long enough!', 'Thanks. I owe you one. Do not get used to it.'],
    reviving: ['Up! Up! We are not done!', 'On your feet, soldier. Cry later.'],
    streak: ['Who is next? Anybody? Line up!', 'I could do this all night.', 'Stack them up! Bodies everywhere!'],
    ammo: ['I am almost dry! Cover me!', 'Need ammo! Now!'],
    broke: ['Broke again. Story of my life.', 'Not enough points. These prices are criminal.'],
    bowl: ['Whoo! Okay. Okay! That hit like a mortar round.', 'Big rip! Cough! Who packed this, a mule?', 'Army never had this in the med kit. Big mistake.', 'Lungs are on fire and I love it.', 'That bowl just gave me a promotion. Captain Couch.'],
    joint: ['Puff, puff, kill. That is the rule.', 'Ahh. Now I can hear colors. And zombies.', 'Rolled tighter than my last relationship.', 'Do not tell my sergeant. Do not tell my mother either.', 'Mm. I am relaxed and heavily armed. Fear me.'],
    edible: ['One gummy. Two gummies. I can count, I swear.', 'Down in one bite. That is how a soldier eats.', 'Tastes like strawberry and a very long night.', 'If I start talking to the vending machine, that is normal now.', 'They said start low and go slow. I said go big.'],
  },
  smokes: {
    spawn: ['Yeah... so this is happening. Cool. Cool cool cool.', 'I clocked in for the night shift. Did not expect this many patients.', 'Relax, everybody. I know where they keep the good stuff.'],
    round: ['Here they come, man. Stay mellow.', 'Ugh. They never take a break, do they?', 'Another round. Okay. Breathe, shoot, breathe.'],
    roundEnd: ['Nice. Everybody take five.', 'We did it. Somebody roll something.', 'Chill. We earned this.'],
    door: ['I had the key for that door once. Lost it. Long story.', 'Opened. Smells like the cafeteria. Not a compliment.', 'There it goes. Let us see what is behind door number two.'],
    box: ['Come on box, be nice to me.', 'Spin the box, man. The universe provides.'],
    upgrade: ['Whoa. That gun is glowing. I am not even that high.', 'Upgraded. That thing has a vibe now.'],
    down: ['Aw man, I am on the floor. This is my spot now.', 'Little help? I am kinda dying here.'],
    revived: ['Thanks, friend. I owe you a snack.', 'I am up. Barely. Thanks.'],
    reviving: ['Up you go. No naps on the job.', 'Come on, man, get up. It is not that kind of floor.'],
    streak: ['Wow. I am actually good at this.', 'Peace and love. And bullets.', 'They keep coming, I keep... yeah.'],
    ammo: ['I am almost out, man. Bad vibes.', 'Running on empty.'],
    broke: ['No points. I am broke in every way.', 'Can not afford it. Story of my paycheck.'],
    bowl: ['Ohhh yeah. That is the good stuff. That is the good good stuff.', 'Clean glass, fresh greens. I could cry, man.', 'Whoa. I can feel my eyelashes.', 'This is the first time tonight I feel normal.', 'Somebody hold my gun. Actually no, nobody touch my gun.'],
    joint: ['Mm. I rolled this one during orientation.', 'Now this, this is the employee benefit they promised.', 'Breathe in the good, shoot out the bad.', 'You know what, the zombies are kinda just misunderstood. Still shooting them.', 'Perfect. Now the hospital smells like a garden.'],
    edible: ['A gummy. My old friend. Hello, old friend.', 'This is gonna hit me in the middle of a round and I am okay with that.', 'Mm, tastes like childhood and bad decisions.', 'I should have eaten half. Nah. I should have eaten two.', 'Munchies incoming. Zombies better taste like pizza.'],
  },
  sparks: {
    spawn: ['Okay, okay, I just came to fix the generator! This is not in my contract!', 'Fun fact: hospitals are the worst place to be in an apocalypse. Ask me how I know!', 'Everybody stay calm! I am calm! This is calm!'],
    round: ['Oh no, oh no, here they come!', 'Another round! My heart cannot take this!', 'Why are there so many! Who invited them!'],
    roundEnd: ['We are alive! I think! Check me!', 'Round done! I need to sit down!', 'Okay! We did it! Again!'],
    door: ['Door open! Please be empty, please be empty!', 'Nice, a door! I love doors! Doors are great!', 'If anything jumps out, I am screaming. Fair warning.'],
    box: ['Come on, box! Give me something with a lot of bullets!', 'Gambling in a hospital during the apocalypse. Mom would be proud.'],
    upgrade: ['It is glowing purple! That is either awesome or radioactive!', 'Upgraded! I want to marry this gun!'],
    down: ['I am down! I am down! Help!', 'Ow ow ow! Somebody revive me!'],
    revived: ['Oh thank you thank you thank you!', 'You are my favorite person! Today!'],
    reviving: ['Up up up! Come on!', 'Got you! Do not die on me!'],
    streak: ['I am actually doing it! Look at me go!', 'Bang! Bang! Okay that is fun.', 'Is it weird that I am enjoying this?'],
    ammo: ['I am almost out of bullets! Is that bad? That is bad!', 'Ammo! I need ammo!'],
    broke: ['I can not afford that! I can not afford anything!', 'Not enough points! Typical!'],
    bowl: ['Cough! Cough! Oh wow, that is a lot! That is a lot!', 'Is it supposed to burn? It burns! Again please!', 'I have never done this before. That was a lie. I have done this a lot.', 'Oh, my brain just turned the lights off. In a good way!', 'Okay that was amazing and I can taste purple.'],
    joint: ['Whoa, it is crackling! Is it supposed to crackle?', 'Okay, okay, I feel much less like screaming now.', 'Electricity, weed, zombies. Best night of my life! Worst night of my life!', 'I am a professional! A professional what, I do not know!', 'Mm. Now the generators can wait.'],
    edible: ['It is so cute! Sorry, little bear! Chomp!', 'I ate a bear! Not a real one! A gummy one! Obviously!', 'Wait, how much was in that? Oh no. Oh yes.', 'If I start giggling at zombies, that is the gummy talking.', 'Delicious! Dangerous! Deliciously dangerous!'],
  },
};
const ZV = { voices: [], vmap: {}, last: {}, cd: {}, seq: 0, out: [], kills: 0, lowT: 0, sub: null, gap: 0, _off: false };
// on / off and the volume live in SETTINGS > AUDIO (S.zvoice, S.zvoiceVol); the old lobby switch is carried over once
Object.defineProperty(ZV, 'enabled', { get() { return !ZV._off && typeof S !== 'undefined' && S.zvoice !== false && (S.zvoiceVol === undefined || S.zvoiceVol > 0); }, set(v) { ZV._off = !v; } });
const zvVol = () => (typeof S !== 'undefined' && S.zvoiceVol !== undefined ? S.zvoiceVol : 70) / 100;
ZL.char = 'smokes'; try { const c = localStorage.getItem('ashfall.zchar'); if (ZCHARS.some(x => x.id === c)) ZL.char = c; if (localStorage.getItem('ashfall.zvoice') === 'off' && typeof S !== 'undefined') { S.zvoice = false; localStorage.removeItem('ashfall.zvoice'); try { saveSettings(); } catch (e) {} } } catch (e) {}
const zvChar = id => ZCHARS.find(c => c.id === id) || ZCHARS[0];

/* ---------- picking a computer voice for each survivor (different ones where the computer has them) */
function zvLoadVoices() {
  try { ZV.voices = (window.speechSynthesis && speechSynthesis.getVoices()) || []; } catch (e) { ZV.voices = []; }
  const used = new Set(); ZV.vmap = {};
  const en = ZV.voices.filter(v => /^en/i.test(v.lang || '')), pool = en.length ? en : ZV.voices;
  for (const c of ZCHARS) {
    const want = c.voice.want; let pick = null;
    for (const w of want) { pick = pool.find(v => v.name.toLowerCase().includes(w) && !used.has(v.name)); if (pick) break; }
    if (!pick) pick = pool.find(v => !used.has(v.name) && (c.voice.female ? /female|zira|aria|jenny|hazel|susan|sonia|libby|samantha|karen/i : /male|david|mark|guy|george|ryan|james|daniel|alex/i).test(v.name));
    if (!pick) pick = pool.find(v => !used.has(v.name)) || pool[0] || null;
    if (pick) used.add(pick.name); ZV.vmap[c.id] = pick;
  }
}
try { if (window.speechSynthesis) { zvLoadVoices(); speechSynthesis.onvoiceschanged = zvLoadVoices; } } catch (e) {}

/* ---------- saying a line */
function zvSpeak(charId, text, vol = 1) {
  const c = zvChar(charId);
  if (!ZV.enabled) return;
  try { if (window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)) return; } catch (e) {}   // never queue lines up behind each other
  zvSubtitle(c, text);
  try {
    if (!window.speechSynthesis) return;
    if (!ZV.voices.length) zvLoadVoices();
    const u = new SpeechSynthesisUtterance(text), v = ZV.vmap[c.id];
    if (v) u.voice = v; u.pitch = c.voice.pitch; u.rate = c.voice.rate; u.volume = clamp(vol * zvVol() * ((typeof S !== 'undefined' && S.master !== undefined ? S.master : 80) / 100), 0, 1);
    speechSynthesis.speak(u);
  } catch (e) {}
}
// a moment happened to me: maybe say something (cooldowns stop it getting chatty), and tell my teammates
const ZV_CD = { round: 90, roundEnd: 75, door: 30, box: 30, upgrade: 20, down: 15, revived: 15, reviving: 20, streak: 120, ammo: 90, broke: 45, spawn: 0, bowl: 0, joint: 0, edible: 0 };
// some moments always get their line (going down, perks, the upgrade); everything else waits for a quiet gap
const ZV_KEY = new Set(['down', 'revived', 'bowl', 'joint', 'edible', 'upgrade']), ZV_GAP = 25;
function zvSay(moment, chance = 1) {
  if (typeof M === 'undefined' || !M || M.mode !== 'zomb') return;
  if (!ZV.enabled || (typeof ZS !== 'undefined' && ZS.playing)) return;
  const now = performance.now() / 1000; if ((ZV.cd[moment] || 0) > now || Math.random() > chance) return;
  if (!ZV_KEY.has(moment) && now < ZV.gap) return;
  ZV.cd[moment] = now + (ZV_CD[moment] || 30); ZV.gap = now + ZV_GAP;
  const lines = (ZLINES[ZL.char] || {})[moment]; if (!lines || !lines.length) return;
  let i = (Math.random() * lines.length) | 0; if (lines.length > 1 && i === ZV.last[moment]) i = (i + 1) % lines.length; ZV.last[moment] = i;
  zvSpeak(ZL.char, lines[i]);
  ZV.seq++; ZV.out.push([moment, i, ZV.seq]); while (ZV.out.length > 4) ZV.out.shift();
}
// a teammate's line arrived (co-op): play it in their voice, a little quieter
function zvRemote(R) {
  const list = R.pr && Array.isArray(R.pr.vl) ? R.pr.vl : null; if (!list) return;
  if (R.seenVl === undefined) { R.seenVl = list.reduce((m, v) => Math.max(m, +v[2] || 0), 0); return; }
  for (const v of list) {
    if (!Array.isArray(v) || (+v[2] || 0) <= R.seenVl) continue; R.seenVl = +v[2] || 0;
    const ch = ZCHARS.some(c => c.id === R.pr.ch) ? R.pr.ch : 'doc', line = ((ZLINES[ch] || {})[v[0]] || [])[+v[1] | 0];
    const now = performance.now() / 1000; if (line && (ZV_KEY.has(v[0]) || now >= ZV.gap) && !(typeof ZS !== 'undefined' && ZS.playing)) { ZV.gap = now + ZV_GAP; zvSpeak(ch, line, 0.75); }
  }
}
function zvSubtitle(c, text) {
  let s = $('zSub');
  if (!s) { s = document.createElement('div'); s.id = 'zSub'; ($('hud') || document.body).appendChild(s); const st = document.createElement('style'); st.textContent = `#zSub{position:absolute;left:50%;bottom:150px;transform:translateX(-50%);max-width:min(760px,80vw);text-align:center;pointer-events:none;font:600 16px var(--font,system-ui);color:#f2ecdc;text-shadow:0 2px 6px #000,0 0 2px #000;transition:opacity .3s;opacity:0}#zSub b{letter-spacing:.14em;margin-right:8px}`; document.head.appendChild(st); }
  s.innerHTML = `<b style="color:${c.col}">${c.name}:</b>${text.replace(/[<&]/g, ch => ch === '<' ? '&lt;' : '&amp;')}`; s.style.opacity = 1;
  clearTimeout(s._t); s._t = setTimeout(() => { s.style.opacity = 0; }, 1800 + text.length * 55);
}
// every frame in zombies: low-ammo and kill-streak lines
function zvTick(dt) {
  if (!M || M.mode !== 'zomb' || G.state !== 'playing') return;
  const w = WEAPONS[G.cur]; if (w && w.ammo + w.reserve <= Math.max(3, w.magSize * 0.5) && w.reserve <= 0) zvSay('ammo', 0.4);
  if (G.kills >= ZV.kills + 25) { ZV.kills = G.kills; zvSay('streak', 0.4); }
}
