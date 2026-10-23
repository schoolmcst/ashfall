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
// lines: [character][moment] -> list. bowl / joint / edible are the perk reactions. (The story's own lines live in
// zstory.js / zmaps.js and are not these.) Adult, and they talk about getting high a lot.
const ZLINES = {
  doc: {
    spawn: ['I have a medical degree, a shotgun and a prescription for my own weed. Let us begin.', 'Eight years of medical school and I end up as a very well educated stoner with a gun.', 'If I die tonight, cremate me and roll me into a joint. It is what I would have wanted.'],
    round: ['More patients. None of them have insurance.', 'Here they come. I am too high for this and not nearly high enough.', 'Triage protocol: shoot the ugly ones first. They are all ugly.', 'Another wave. I should have stayed home and smoked in the bath.'],
    roundEnd: ['Clear. I prescribe a bowl for everyone.', 'Round over. My heart rate is terrible and my high is gone. Unacceptable.', 'Breathe. Hydrate. Reload. Smoke. In that order. Actually, smoke first.'],
    door: ['That door cost more than my malpractice insurance.', 'Open. If there is a dispensary in there, I call dibs.', 'Paid for a door. I used to pay for the good stuff with that kind of money.'],
    box: ['Mystery crate. The pharmacy of the apocalypse.', 'Come on, box. Give me something stronger than what I smoked this morning.', 'Gambling while high. My two favorite medical conditions.'],
    upgrade: ['Now that is a controlled substance.', 'Upgraded. It glows like a blacklight poster in a dorm room.'],
    down: ['I am down! Somebody pass me a joint and a defibrillator!', 'Medic! A real one! Not a guy who just watches videos about edibles!'],
    revived: ['Thank you. Your technique is awful, but I am too stoned to file a complaint.', 'Back up. I saw my whole life flash before my eyes. Most of it was smoking.'],
    reviving: ['Up you get. That consultation is free. The weed is not.', 'You are fine. Walk it off. Smoke it off.'],
    streak: ['Time of death: right now. And right now. And right now.', 'I am signing a lot of death certificates tonight. Mostly with my gun.', 'Look at that. I am a better shot when I am baked.'],
    ammo: ['I am almost out of bullets. And weed. One of those is a real emergency.', 'Running dry. Like my mouth. Somebody find water and ammo.'],
    broke: ['Cannot afford it. I spent my whole residency salary on weed. No regrets.', 'Not enough points. Story of every doctor I know.'],
    bowl: ['Medicinal. Strictly medicinal. Cough. Extremely medicinal.', 'Oh, that is a much stronger dose than the chart said.', 'My hands are steady and my mind is in Jamaica. Perfect for surgery.', 'Eight years of medical school and this bowl is the best thing I have learned.', 'I would write this on a prescription pad if I could still feel my fingers.'],
    joint: ['Doctor\'s orders. I am the doctor. I ordered it.', 'Pass the... no. Mine. Get your own.', 'I used to tell patients not to smoke. Hypocrisy tastes wonderful.', 'Ah. That takes the edge off the end of the world.', 'If I die tonight, at least my blood pressure is perfect.'],
    edible: ['A gummy. The most dangerous thing in this building, give it forty minutes.', 'Ate the whole thing. That is not the recommended dose. That is a lifestyle.', 'Tastes like cherry and an unbelievable amount of THC.', 'I will be extremely relaxed in about an hour. Assuming I live an hour.', 'Childproof packaging. Not doctor proof.'],
  },
  tank: {
    spawn: ['Alright, dead heads. Mama brought guns and a fat sack. Let us party.', 'Two tours in the desert, and the scariest thing I ever saw was a dry week. This is nothing.', 'Somebody owes me overtime, hazard pay and a quarter ounce.'],
    round: ['Here they come! Line them up and let me light them up!', 'Come on then! I did not get this high to die sober!', 'Next wave! Do not let them touch you, they smell worse than a frat house bong!', 'Round start! Lock, load, and somebody pack a bowl for after!'],
    roundEnd: ['That is how it is done! Somebody roll a victory joint!', 'Round over! Hydrate, medicate, annihilate!', 'Too easy. I was barely even buzzed for that one.'],
    door: ['Door\'s open. If it smells like weed in there, that is me.', 'Paid to open a door. Back home I paid a guy named Sticky and he opened doors for free.', 'New room! New targets! New places to hide my stash!'],
    box: ['Come on, box, give mama something big and loud.', 'If this is another pistol I am smoking the box.', 'Box, I am high and heavily armed. Do not test me.'],
    upgrade: ['Oh, now we are talking. That gun hits harder than my dealer\'s homegrown.', 'Upgraded and baked. The most dangerous combination in the army.'],
    down: ['I am down! Get over here before my high wears off!', 'Do not just stand there gawking, pick me up! I have a joint to finish!'],
    revived: ['Took you long enough! I almost sobered up down there!', 'Thanks. I owe you one. One hit. Not the whole thing.'],
    reviving: ['Up! Up! You do not get to die before you smoke with me!', 'On your feet, soldier. Cry later. Get high later. Shoot now.'],
    streak: ['Who is next? Anybody? I am high and on a roll!', 'Stack them up! I could do this all night with a bong and a rifle!', 'I have not had this much fun since the base found my grow tent.'],
    ammo: ['I am almost dry! Like my stash! Cover me!', 'Need ammo now! And a lighter! Priorities!'],
    broke: ['Broke again. Every point I get goes up in smoke. Literally.', 'Not enough points. These prices are worse than the dispensary downtown.'],
    bowl: ['Whoo! Okay. Okay! That hit like a mortar round.', 'Big rip! Cough! Who packed this, a mule with a grudge?', 'The army never had this in the med kit. Huge mistake.', 'Lungs are on fire and I love it.', 'That bowl just gave me a promotion. Captain Couch, reporting for duty.'],
    joint: ['Puff, puff, kill. That is the rule.', 'Ahh. Now I can hear colors. And zombies. Mostly zombies.', 'Rolled tighter than my last relationship.', 'Do not tell my sergeant. Do not tell my mother either.', 'I am relaxed and heavily armed. Fear me.'],
    edible: ['One gummy. Two gummies. I can count, I swear.', 'Down in one bite. That is how a soldier eats an edible.', 'Tastes like strawberry and a very long night.', 'If I start talking to the vending machine, that is normal now.', 'They said start low and go slow. I said go big or go to the morgue.'],
  },
  smokes: {
    spawn: ['Yeah... so this is happening. Good thing I pre-rolled for the apocalypse.', 'I clocked in high. I will clock out higher. If I clock out.', 'Relax, everybody. I know where every stash in this building is. Every single one.'],
    round: ['Here they come, man. Stay mellow. Stay medicated.', 'Ugh. They never take a smoke break, do they?', 'Another round. Okay. Inhale, shoot, exhale.', 'Here they come. I am way too high to be this scared. Or way too scared to be this high.'],
    roundEnd: ['Nice. Everybody take five. And by five I mean hits.', 'We did it. Somebody roll something fat.', 'Chill. We earned this. Pass it left.'],
    door: ['I sold pills behind that door once. Long story. Do not ask.', 'Opened. Smells like hot garbage and somebody\'s old bong water.', 'There it goes. Door number two. Hopefully it is a dispensary.'],
    box: ['Come on, box. Be nice to me. I am fragile right now.', 'Spin the box, man. The universe provides. The universe is a dealer.', 'If this box gives me a rocket launcher I am naming my next strain after it.'],
    upgrade: ['Whoa. That gun is glowing. I am not even that high. Okay, I am that high.', 'Upgraded. That thing has a vibe now. A purple vibe.'],
    down: ['Aw, man. I am on the floor. Honestly, this is a great spot to lie down.', 'Little help? I am kinda dying here. Also I dropped my lighter.'],
    revived: ['Thanks, friend. I owe you a snack. And a joint. Mostly the joint.', 'I am up. Barely. That floor was comfy, though.'],
    reviving: ['Up you go. No naps on the job. Naps are for after the smoke.', 'Come on, man, get up. It is not that kind of floor.'],
    streak: ['Wow. I am actually good at this. Weed is a performance enhancer. Write that down.', 'Peace, love and hollow points.', 'They keep coming, I keep... yeah. Whoa. Yeah.'],
    ammo: ['I am almost out, man. Bad vibes. Really bad vibes.', 'Running on empty. Gun and stash. Both.'],
    broke: ['No points. I am broke in every way, man. Spiritually too.', 'Cannot afford it. Every dollar I ever had went up in smoke.'],
    bowl: ['Ohhh yeah. That is the good stuff. That is the good good stuff.', 'Clean glass, fresh greens. I could cry, man.', 'Whoa. I can feel my eyelashes.', 'This is the first time tonight I feel normal.', 'Somebody hold my gun. Actually, no. Nobody touch my gun.'],
    joint: ['Mm. I rolled this one during orientation.', 'Now this is the employee benefit they promised.', 'Breathe in the good, shoot out the bad.', 'You know what? The zombies are kinda just misunderstood. Still shooting them.', 'Perfect. Now the whole place smells like a garden.'],
    edible: ['A gummy. My old friend. Hello, old friend.', 'This is gonna hit me in the middle of a round and I am okay with that.', 'Mm. Tastes like childhood and bad decisions.', 'I should have eaten half. Nah. I should have eaten two.', 'Munchies incoming. Zombies better taste like pizza.'],
  },
  sparks: {
    spawn: ['I came to fix a generator and I am leaving with a drug problem. This is fine!', 'Fun fact: being high in an apocalypse is worse than being sober in an apocalypse. Ask me how I know!', 'Everybody stay calm! I am calm! I ate two gummies in the van! This is calm!'],
    round: ['Oh no, oh no, here they come! And my edible just kicked in!', 'Another round! My heart cannot take this! My lungs neither!', 'Why are there so many? Did somebody tell them there is free weed?', 'Here they come! I am too high to count them! There are a lot!'],
    roundEnd: ['We are alive! I think! Somebody check my pulse and my stash!', 'Round done! I need to sit down and eat an entire pizza!', 'We did it! Again! I am rewarding myself with a big fat bowl!'],
    door: ['Door open! Please be empty, please be empty, please be snacks!', 'I love doors! Doors are great! Especially when I am this high!', 'If anything jumps out, I am screaming. Fair warning. Very high warning.'],
    box: ['Come on, box! Give me something with a lot of bullets!', 'Gambling while high in a drug factory during the apocalypse. Mom would be so proud.', 'Box! Box! Box! I am so high I am chanting at furniture!'],
    upgrade: ['It is glowing purple! That is either awesome or radioactive! Either way I am licking it! No I am not!', 'Upgraded! I want to marry this gun! Is that the weed talking? Yes!'],
    down: ['I am down! I am down! And I am way too high for this!', 'Ow ow ow! Somebody revive me! I can see sounds!'],
    revived: ['Oh, thank you thank you thank you! I love you! That is the weed! Partly!', 'You are my favorite person! Today! While I am this high!'],
    reviving: ['Up up up! Come on! We still have snacks to find!', 'Got you! Do not die on me! Who would I smoke with?'],
    streak: ['I am actually doing it! Look at me go! High as a kite and twice as deadly!', 'Bang! Bang! Okay, that is fun. Is that weird? That is weird.', 'I am on fire! Not literally! Okay, a little, the joint fell!'],
    ammo: ['I am almost out of bullets! Is that bad? That is bad!', 'Ammo! I need ammo! And a lighter! And maybe a hug!'],
    broke: ['I cannot afford that! I spent everything on gummies! Every time!', 'Not enough points! Typical! Just like payday!'],
    bowl: ['Cough! Cough! Oh wow, that is a lot! That is a lot!', 'Is it supposed to burn? It burns! Again, please!', 'I have never done this before. That was a lie. I have done this a lot.', 'Oh, my brain just turned the lights off. In a good way!', 'Okay, that was amazing, and I can taste purple.'],
    joint: ['Whoa, it is crackling! Is it supposed to crackle?', 'Okay, okay, I feel much less like screaming now.', 'Electricity, weed, zombies. Best night of my life! Worst night of my life!', 'I am a professional! A professional what, I do not know!', 'Mm. The generators can wait.'],
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
