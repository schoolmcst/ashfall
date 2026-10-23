/* ================================================================== ZOMBIES STORY: "THE GREEN CURE" (seven chapters)
   Blackwell General ran a secret trial of a painkiller, LAZARUS-9. DOC signed off on it. SMOKES found the leftover
   boxes in the basement and sold the pills on the street as a party drug, NIGHTSHADE: "one pill and you never feel pain
   again". Everyone who took it died and got back up. TANK treated the first overdoses. SPARKS came to fix the
   generators that keep the lab freezers cold. The four have not turned because of the weed: it blocks the receptor
   NIGHTSHADE latches onto. That is why the perk machines keep you human.
   Chapters: 1 LIGHTS OUT (three fuses -> the fuse box) 2 HAROLD'S BADGE (the keycard on a body in the ER)
   3 BURN THE STASH (three NIGHTSHADE stashes) 4 PATIENT ZERO (a boss comes out; his blood) 5 THE PHARMACY (medical
   cannabis) 6 THE GREEN CURE (cook it for 60 seconds under attack) 7 EPILOGUE (and a truck that already left).
   Twelve tapes tell how it happened (the lobby journal keeps them); the four talk at every chapter and every few rounds.
   Co-op: everything picked up is shared through the host (qi -> qf), the host runs the boss and the cooking (qc). */
const ZS_ITEMS = [
  { id: 'f1', kind: 'fuse', name: 'GENERATOR FUSE', at: { x: -5.75, z: 31.75, y: 0 } },
  { id: 'f2', kind: 'fuse', name: 'GENERATOR FUSE', at: { x: 28, z: 6, y: 0 } },
  { id: 'f3', kind: 'fuse', name: 'GENERATOR FUSE', at: { x: -6, z: -8.5, y: 0 } },
  { id: 'card', kind: 'card', name: "HAROLD'S KEYCARD", at: { x: -16.2, z: 5.6, y: 0 }, needs: 'power' },
  { id: 'st1', kind: 'stash', name: 'NIGHTSHADE STASH', at: { x: 28, z: -4.7, y: 0.97 } },
  { id: 'st2', kind: 'stash', name: 'NIGHTSHADE STASH', at: { x: 20, z: 19, y: 4.2 } },
  { id: 'st3', kind: 'stash', name: 'NIGHTSHADE STASH', at: { x: -20, z: -19, y: 4.2 } },
  { id: 'jar', kind: 'jar', name: 'MEDICAL CANNABIS', at: { x: -24.6, z: -2.2, y: 0 }, needs: 'card' },
];
const ZS_FUSEBOX = { x: -9.62, z: -2.6, y: 0 };
const ZS_COOK = { x: -28, z: -5.5, y: 0, secs: 60, need: 9 };
const ZS_CHAPTERS = [
  { id: 'power', name: 'LIGHTS OUT', goal: 'find 3 generator fuses and put them in the fuse box in the atrium' },
  { id: 'card', name: "HAROLD'S BADGE", goal: "take Harold's keycard from his body in the ER" },
  { id: 'stash', name: 'BURN THE STASH', goal: 'burn the last 3 NIGHTSHADE stashes (the morgue, upstairs south, upstairs north)' },
  { id: 'blood', name: 'PATIENT ZERO', goal: 'kill Patient Zero and take his blood' },
  { id: 'jar', name: 'THE PHARMACY', goal: 'take the medical cannabis from the north lab' },
  { id: 'cure', name: 'THE GREEN CURE', goal: 'cook the cure at the chem station in the north lab and hold them off' },
  { id: 'end', name: 'EPILOGUE', goal: 'survive' },
];
// the scene that plays when each chapter starts (index = chapter just reached)
const ZS_SCENES = [
  [['sparks', 'Okay. Power first. The generator room is cooked, but the fuse box in the atrium still works if somebody finds me three fuses.'], ['tank', 'Fuses. In a hospital full of the dead. Great.'], ['smokes', 'I saw one in the lobby. Under a magazine. From nineteen ninety eight.']],
  [['sparks', 'Lights! We have lights! I am a genius! Somebody say I am a genius!'], ['doc', 'You are a genius. Now the lab door needs a keycard. Mine is gone.'], ['doc', 'Harold had one. My old boss. He was in the ER when it started. He is probably still in the ER.']],
  [['doc', 'Got it. Sorry, Harold. You were a terrible boss, but nobody deserves that.'], ['tank', 'Next: every last Nightshade pill in this building gets burned. No more customers.'], ['smokes', 'I hid three stashes. The morgue, and two upstairs. Do not look at me like that.']],
  [['smokes', 'That was the last stash. My entire business. Up in smoke. Not the good kind.'], ['sparks', 'Uh. Guys? Something big is coming up the stairs. Something purple.'], ['doc', 'That is Patient Zero. The first one Dawson ever sold to. His blood is the purest sample we will ever get. Kill him.']],
  [['tank', 'Patient Zero is down! Somebody grab his blood before it eats us!'], ['doc', 'Got the sample. Now the other half of the cure. The pharmacy keeps the medical cannabis in the north lab.'], ['smokes', 'Finally. A quest I was born for.']],
  [['smokes', 'One jar of pharmaceutical grade. Do not tell anybody I cried.'], ['doc', 'Blood, cannabis, a burner and sixty seconds. The chem station is in the north lab. Keep them off me.'], ['sparks', 'Sixty seconds. Easy. Totally easy. Why is everybody quiet.']],
];
const ZS_TAPES = [
  { at: { x: 0.6, z: 22.1, y: 1.12 }, title: 'TAPE 1 · THE TRIAL', lines: [['doc', 'Blackwell trial log. Lazarus nine, day thirty. Pain response in the test group: zero. Not reduced. Zero.'], ['doc', 'Two subjects stopped breathing last night. Both sat up an hour later. I signed the form that says this is fine.']] },
  { at: { x: -30, z: 13.4, y: 0 }, title: 'TAPE 2 · THE BASEMENT', lines: [['smokes', 'Okay, so. Basement. Forty boxes of purple pills nobody is counting. Label says Lazarus nine.'], ['smokes', 'I am calling them Nightshade. One pill and you never feel pain again. That is basically a slogan.'], ['smokes', 'Ten bucks a pop. This is a victimless crime.']] },
  { at: { x: 14, z: 8.4, y: 0 }, title: 'TAPE 3 · THE ER', lines: [['tank', 'Fifth overdose tonight. Same purple pills. No pulse on arrival, no pain response, and then he bit Gonzalez.'], ['tank', 'Somebody is selling these out of this building. When I find them, they are going to feel pain. I promise.']] },
  { at: { x: 30, z: -11.2, y: 0 }, title: 'TAPE 4 · THE GENERATORS', lines: [['sparks', 'Work order: lab freezer backup generators. Why does a hospital lab need six freezers on their own power? What is in there?'], ['sparks', 'Oh. Oh no. It is pills. It is a lot of pills. And something in the freezer is knocking.']] },
  { at: { x: 5, z: -30.5, y: 0 }, title: 'TAPE 5 · THE RECEPTOR', lines: [['doc', 'The bitten ones turn in minutes. Except Dawson. He was bitten twice and he is just... hungry.'], ['smokes', 'I told you, man. It is the weed. I have been high since orientation.'], ['doc', 'He is right. Cannabinoids block the receptor Lazarus binds to. God help me, the cure is in the pharmacy.']] },
  { at: { x: -5, z: 20, y: 4.2 }, title: 'TAPE 6 · THE PLAN', lines: [['tank', 'So the plan is: we get a keycard, we burn every last Nightshade stash, we raid the medical weed.'], ['sparks', 'And then Doc cooks a cure on a lab bench while a thousand dead people try to eat us. Great plan. Love it.'], ['doc', 'Sixty seconds on the burner. Keep them off me for sixty seconds.']] },
  { at: { x: -36, z: 25.5, y: 0 }, title: 'TAPE 7 · THE FIRST CUSTOMER', lines: [['smokes', 'First customer was a guy named Eddie. Nice guy. Said his back hurt. I said, Eddie, I have got just the thing.'], ['smokes', 'Eddie came back the next night. Did not say hello. Did not say anything. Just kind of... looked at my neck.'], ['smokes', 'I think Eddie is patient zero. I think I made patient zero. Wow.']] },
  { at: { x: 36, z: 25.5, y: 0 }, title: 'TAPE 8 · THE BOARD', lines: [['doc', 'Board meeting. Harold says the trial continues. Harold says the side effects are a public relations problem, not a medical one.'], ['doc', 'Harold has a truck coming Thursday for the remaining stock. Where is it going, Harold? He would not say.']] },
  { at: { x: 16, z: 25.5, y: 0 }, title: 'TAPE 9 · TANK AND GONZALEZ', lines: [['tank', 'Gonzalez turned at four in the morning. Eleven years on the same shift and I had to put him down with a fire extinguisher.'], ['tank', 'Whoever sold those pills. I am going to find them. And then I am going to find out what a pain response really looks like.'], ['smokes', 'For the record, I am leaving this tape here by accident.']] },
  { at: { x: -16, z: -25.5, y: 0 }, title: 'TAPE 10 · SPARKS IN THE DARK', lines: [['sparks', 'Day two. The lights in the north wing went out. I can hear them in the walls. I am recording this so somebody knows I was brave.'], ['sparks', 'I was not brave. I hid in a supply closet and ate a gummy I found in a lab coat. Things got much better after that.']] },
  { at: { x: 20, z: -19, y: 4.2 }, title: 'TAPE 11 · THE FREEZER', lines: [['doc', 'The lab freezers. I finally looked inside. Lazarus nine was not a painkiller. It was a resurrection compound. Harold knew.'], ['doc', 'The trial was never about pain. It was about soldiers who do not stop. And I signed every single form.']] },
  { at: { x: -20, z: 12, y: 4.2 }, title: 'TAPE 12 · THE TRUCK', lines: [['tank', 'Found the loading dock logs. Harold\'s truck left on Thursday. Twelve pallets of Lazarus nine.'], ['sparks', 'Twelve pallets? We burned three stashes. Where did twelve pallets go?'], ['doc', 'Somewhere with a lot of people. And a lot of pain.']] },
];
const ZS_INTRO = [
  ['doc', 'Blackwell General. I signed off on a drug trial here. Lazarus nine. It was supposed to end pain.'],
  ['smokes', 'And I, uh... sold the leftovers. On the street. As Nightshade. My bad.'],
  ['tank', 'Everyone who took it died and got back up. Now the whole hospital is full of them.'],
  ['sparks', 'And the only thing keeping us human is the weed. So. Smoke up, find the cure, and do not get bitten.'],
];
const ZS_END = [
  ['doc', 'It is done. The Green Cure. A cannabinoid that sticks to the receptor for good. Lazarus nine is finished.'],
  ['smokes', 'So we saved the world with weed. Put that on my resume.'],
  ['tank', 'We saved this building. There are still a few thousand of them out there. Lock and load.'],
  ['sparks', 'Can we at least celebrate first? I am celebrating. This is me celebrating.'],
  ['doc', 'Celebrate fast. Harold\'s truck left on Thursday with twelve pallets. The cure has to go wherever that truck went.'],
  ['smokes', 'Road trip. I call shotgun. And I am not driving.'],
];
// the four talk to each other every few rounds (whoever you play hears all four voices)
const ZS_ROUNDS = {
  2: [['tank', 'Round two and they are already this angry? What was in those pills, Smokes?'], ['smokes', 'Love, mostly. And whatever Lazarus is.']],
  4: [['sparks', 'Does anybody else hear the vending machine humming? I swear it hums louder when I am high.'], ['doc', 'That is the fluorescent lights, Penny.'], ['sparks', 'That is what the lights want you to think.']],
  6: [['doc', 'They are faster now. The compound keeps working on them even after death. It never stops.'], ['tank', 'Neither do I.']],
  8: [['smokes', 'If we live through this, I am going legit. Real dispensary. Clean hands.'], ['tank', 'If we live through this, I am arresting you myself.'], ['smokes', 'Fair.']],
  10: [['sparks', 'Round ten! Does anybody want to talk about feelings? I have a lot of feelings right now.'], ['doc', 'After the cure. Feelings after the cure.']],
  15: [['tank', 'Fifteen rounds. My arms hurt. My ears hurt. Even my hair hurts.'], ['smokes', 'You know what helps with that.'], ['tank', 'Do not say it.'], ['smokes', 'Weed.']],
};
// everything the story says on screen (swapped per map by zmapUse; these are the hospital's)
const ZS_TEXT = {
  title: 'THE GREEN CURE', place: 'BLACKWELL GENERAL · ZOMBIES', introSub: 'SEVEN CHAPTERS · TWELVE TAPES', introEm: 'a drug trial gone wrong · find the cure',
  needPower: 'THE BODY IS IN THE DARK · TURN THE POWER ON FIRST', needCard: 'LOCKED IN THE LAB CABINET · YOU NEED A KEYCARD', stashLocked: 'NIGHTSHADE STASH · YOU NEED A LIGHTER FROM... ACTUALLY, GET THE KEYCARD FIRST (CHAPTER 2)',
  stashVerb: 'BURN IT', panel: 'FUSE BOX', parts: 'FUSES', panelDo: 'PUT IN THE FUSES AND TURN THE POWER ON', powerOn: 'POWER IS ON', powerSub: 'the lab is open',
  partSub: 'the fuse box is in the atrium', stashSub: 'burned', jarSub: 'the other half of the cure', bloodSub: 'the purest sample there will ever be',
  station: 'CHEM STATION', cooking: 'COOKING THE GREEN CURE', cookDo: 'COOK THE GREEN CURE', cookStay: 'stay near the chem station', bar: 'THE GREEN CURE',
  boss: 'PATIENT ZERO', bossSub: 'the first one · kill him and take his blood', bossDown: 'PATIENT ZERO IS DOWN', bossDownSub: 'take his blood', drop: "PATIENT ZERO'S BLOOD",
  doneSub: 'story complete · every perk · upgraded gun · 5000 points', cont: 'TO BE CONTINUED', contSub: "Harold's truck · twelve pallets of Lazarus nine",
  dropLook: 'blood', keyDone: 'ashfall.zstory', keyTapes: 'ashfall.ztapes', bossScale: 1.45, bossHp: 3000,
};
const ZS = { flags: new Set(), mine: new Set(), objs: [], tapes: [], cook: -1, cookT: 0, done: false, heard: new Set(), chapter: -1, bossOut: false, boss: null, playing: false, said: new Set() };
function zsLoadTapes() { ZS.heard.clear(); try { for (const t of JSON.parse(localStorage.getItem(ZS_TEXT.keyTapes) || '[]')) ZS.heard.add(+t); } catch (e) {} }
zsLoadTapes();
const zsDoneEver = key => { try { return localStorage.getItem(key || ZS_TEXT.keyDone) === 'done'; } catch (e) { return false; } };
const zsHas = id => ZS.flags.has(id);
// story on or off for this game (the lobby's MODE row; in co-op the host's choice counts)
const zsWanted = () => (typeof ZC !== 'undefined' && ZC.on && !zcHost() && ZC.hostStory !== undefined) ? ZC.hostStory : ZL.story !== false;
const zsFuses = () => ['f1', 'f2', 'f3'].filter(zsHas).length, zsStashes = () => ['st1', 'st2', 'st3'].filter(zsHas).length;
// which chapter we are on, from what has happened
function zsChapterNow() { if (ZS.done) return 6; if (!zsHas('power')) return 0; if (!zsHas('card')) return 1; if (zsStashes() < 3) return 2; if (!zsHas('blood')) return 3; if (!zsHas('jar')) return 4; return 5; }

/* ---------- objects in the world */
function zsGlowMat(col, k = 1.4) { return new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: new THREE.Color(col), emissiveIntensity: k, roughness: 0.4 }); }
function zsMake(it) {
  const g = new THREE.Group(), s = it.at, add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  let col = 0x9a3cff; const K = it.look || it.kind;
  if (K === 'card') { const bag = new THREE.MeshStandardMaterial({ color: 0x1c1f22, roughness: 0.45 }); add(new THREE.BoxGeometry(0.55, 0.26, 1.5), bag, 0.55, 0.13, -0.2).rotation.y = 0.3; add(new THREE.BoxGeometry(0.03, 0.02, 1.5), new THREE.MeshStandardMaterial({ color: 0x8a8f94, metalness: 0.8 }), 0.55, 0.27, -0.2).rotation.y = 0.3; col = 0x5ab4ff; add(new THREE.BoxGeometry(0.09, 0.005, 0.055), zsGlowMat(col, 1.1), 0, 0.02, 0); add(new THREE.BoxGeometry(0.03, 0.006, 0.02), new THREE.MeshStandardMaterial({ color: 0xc8a030, metalness: 0.8 }), -0.025, 0.022, 0); }
  else if (K === 'stash') { for (let i = 0; i < 3; i++) { add(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0x5a1a8a, transparent: true, opacity: 0.8, emissive: new THREE.Color(0x7a2cff), emissiveIntensity: 0.6 }), -0.08 + i * 0.08, 0.05, (i % 2) * 0.05); add(new THREE.CylinderGeometry(0.037, 0.037, 0.025, 12), new THREE.MeshStandardMaterial({ color: 0xe8e8e8 }), -0.08 + i * 0.08, 0.11, (i % 2) * 0.05); } for (let i = 0; i < 6; i++) add(new THREE.SphereGeometry(0.012, 6, 4), zsGlowMat(0xb06cff, 1.2), (Math.random() - 0.5) * 0.3, 0.01, 0.1 + Math.random() * 0.1); }
  else if (K === 'jar') { col = 0x4adf5a; add(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0x8adf8a, transparent: true, opacity: 0.5, roughness: 0.05 }), 0, 0.11, 0); add(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 12), new THREE.MeshStandardMaterial({ color: 0x3e6a24, roughness: 1 }), 0, 0.08, 0); add(new THREE.CylinderGeometry(0.095, 0.095, 0.03, 16), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), 0, 0.235, 0); add(new THREE.BoxGeometry(0.12, 0.06, 0.005), new THREE.MeshStandardMaterial({ color: 0xffffff }), 0, 0.12, 0.091); }
  else if (K === 'fuse') { col = 0xffa030; add(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 12), new THREE.MeshStandardMaterial({ color: 0xe8e2d0, transparent: true, opacity: 0.7, roughness: 0.1 }), 0, 0.03, 0).rotation.z = Math.PI / 2; for (const x of [-0.09, 0.09]) add(new THREE.CylinderGeometry(0.033, 0.033, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0xc8a030, metalness: 0.9, roughness: 0.3 }), x, 0.03, 0).rotation.z = Math.PI / 2; add(new THREE.CylinderGeometry(0.005, 0.005, 0.15, 6), zsGlowMat(col, 1.5), 0, 0.03, 0).rotation.z = Math.PI / 2; }
  else if (K === 'tape') { col = 0xffc24a; add(new THREE.BoxGeometry(0.1, 0.015, 0.065), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), 0, 0.01, 0); add(new THREE.BoxGeometry(0.07, 0.016, 0.03), zsGlowMat(col, 0.9), 0, 0.012, 0); }
  else if (K === 'blood') { col = 0xd02040; add(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 10), new THREE.MeshStandardMaterial({ color: 0x9a0a1a, transparent: true, opacity: 0.85, emissive: new THREE.Color(0x6a0010), emissiveIntensity: 0.6 }), 0, 0.06, 0); add(new THREE.CylinderGeometry(0.022, 0.022, 0.025, 10), new THREE.MeshStandardMaterial({ color: 0x9a3cff }), 0, 0.13, 0); }
  else if (K === 'valve') { col = 0xff5a3a; const red = new THREE.MeshStandardMaterial({ color: 0xb02a1a, roughness: 0.5, metalness: 0.4 }); const t = add(new THREE.TorusGeometry(0.16, 0.025, 8, 20), red, 0, 0.03, 0); t.rotation.x = Math.PI / 2; for (let i = 0; i < 4; i++) { const sp = add(new THREE.BoxGeometry(0.3, 0.02, 0.02), red, 0, 0.03, 0); sp.rotation.y = i * Math.PI / 4; } add(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 10), new THREE.MeshStandardMaterial({ color: 0x8a8f94, metalness: 0.8 }), 0, 0.05, 0); add(new THREE.TorusGeometry(0.17, 0.006, 6, 20), zsGlowMat(col, 1.2), 0, 0.06, 0).rotation.x = Math.PI / 2; }
  else if (K === 'key') { const coat = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1 }); add(new THREE.BoxGeometry(0.5, 0.22, 1.6), coat, 0.6, 0.11, -0.3).rotation.y = 0.5; add(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: 0x8a9a7a, roughness: 1 }), 0.2, 0.12, 0.45); col = 0xffc24a; const brass = new THREE.MeshStandardMaterial({ color: 0xc8a030, metalness: 0.9, roughness: 0.3, emissive: new THREE.Color(0x4a3000), emissiveIntensity: 0.6 }); add(new THREE.TorusGeometry(0.035, 0.01, 6, 14), brass, -0.06, 0.012, 0).rotation.x = Math.PI / 2; add(new THREE.BoxGeometry(0.12, 0.012, 0.016), brass, 0.03, 0.012, 0); add(new THREE.BoxGeometry(0.016, 0.012, 0.04), brass, 0.08, 0.012, 0.02); }
  else if (K === 'pallet') { add(new THREE.BoxGeometry(1.2, 0.14, 1.0), new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 1 }), 0, 0.07, 0); for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(1.1, 0.42, 0.92), new THREE.MeshStandardMaterial({ color: 0x4a1a70, roughness: 0.4, emissive: new THREE.Color(0x3a0a6a), emissiveIntensity: 0.7, transparent: true, opacity: 0.92 }), 0, 0.36 + i * 0.44, 0); add(new THREE.BoxGeometry(0.5, 0.2, 0.01), new THREE.MeshStandardMaterial({ color: 0xffffff }), 0.2, 0.5, 0.47); }
  else if (K === 'formula') { col = 0x4adf5a; add(new THREE.BoxGeometry(0.3, 0.02, 0.22), new THREE.MeshStandardMaterial({ color: 0xd8ccaa, roughness: 1 }), 0, 0.01, 0); add(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0x8adf8a, transparent: true, opacity: 0.55, roughness: 0.05, emissive: new THREE.Color(0x2adf4a), emissiveIntensity: 0.8 }), 0.06, 0.11, 0.02); add(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 12), zsGlowMat(0x3aff5a, 1.4), 0.06, 0.08, 0.02); add(new THREE.CylinderGeometry(0.038, 0.038, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), 0.06, 0.22, 0.02); }
  else if (K === 'ledger') { col = 0xd8b060; add(new THREE.BoxGeometry(0.26, 0.05, 0.34), new THREE.MeshStandardMaterial({ color: 0x5a1a1a, roughness: 0.8 }), 0, 0.025, 0); add(new THREE.BoxGeometry(0.24, 0.04, 0.32), new THREE.MeshStandardMaterial({ color: 0xe8dcc0 }), 0.006, 0.026, 0); add(new THREE.BoxGeometry(0.1, 0.004, 0.04), zsGlowMat(col, 1.0), 0, 0.053, -0.1); }
  if (K === 'fuse' || K === 'tape' || K === 'valve') for (const m of g.children) { m.scale.multiplyScalar(2); m.position.multiplyScalar(2); }
  const beam = add(new THREE.CylinderGeometry(0.12, 0.25, 2.2, 10, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }), 0, 1.1, 0);
  const lt = new THREE.PointLight(col, 0.7, 3.5, 2); lt.position.y = 0.4; g.add(lt);
  g.position.set(s.x, s.y, s.z); scene.add(g); g.userData.beam = beam; return g;
}
function zsFuseBox() {
  const s = ZS_FUSEBOX, g = new THREE.Group(), metal = new THREE.MeshStandardMaterial({ color: 0x5a6068, metalness: 0.6, roughness: 0.45 }), add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(0.22, 0.9, 0.7), metal, 0, 1.45, 0); add(new THREE.BoxGeometry(0.02, 0.12, 0.4), new THREE.MeshStandardMaterial({ color: 0xe2b13a }), 0.12, 1.85, 0);
  const slots = []; for (let i = 0; i < 3; i++) { const m = add(new THREE.BoxGeometry(0.03, 0.06, 0.16), new THREE.MeshStandardMaterial({ color: 0x220000, emissive: new THREE.Color(0xff2a1a), emissiveIntensity: 1.2 }), 0.12, 1.25 + i * 0.16, 0); slots.push(m); }
  for (const z of [-0.2, 0.2]) add(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8), metal, 0.05, 0.7, z);
  g.position.set(s.x, s.y, s.z); scene.add(g); return { g, slots };
}
function zsStation() {
  const s = ZS_COOK, g = new THREE.Group(), steel = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.35 }), add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  add(new THREE.BoxGeometry(1.8, 0.9, 0.9), steel, 0, 0.45, 0); add(new THREE.BoxGeometry(1.85, 0.05, 0.95), new THREE.MeshStandardMaterial({ color: 0x1a1d20 }), 0, 0.92, 0);
  add(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 12), steel, -0.3, 0.98, 0);
  const flame = add(new THREE.ConeGeometry(0.05, 0.16, 10), new THREE.MeshBasicMaterial({ color: 0x4a9aff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }), -0.3, 1.1, 0); flame.visible = false;
  const flask = add(new THREE.SphereGeometry(0.11, 14, 10), new THREE.MeshStandardMaterial({ color: 0x3adf5a, transparent: true, opacity: 0.6, emissive: new THREE.Color(0x2adf4a), emissiveIntensity: 0.2 }), -0.3, 1.25, 0);
  add(new THREE.CylinderGeometry(0.025, 0.04, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0xcfe8cf, transparent: true, opacity: 0.6 }), -0.3, 1.42, 0);
  for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), new THREE.MeshStandardMaterial({ color: [0x9a3cff, 0x3adf5a, 0xe8822a, 0x3a8ee6][i], transparent: true, opacity: 0.8 }), 0.3 + i * 0.1, 1.02, -0.2);
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const cg = c.getContext('2d'); cg.fillStyle = '#081008'; cg.fillRect(0, 0, 256, 64); cg.fillStyle = '#5adf6a'; cg.font = 'bold 26px sans-serif'; cg.textAlign = 'center'; cg.fillText(ZS_TEXT.station, 128, 40);
  const st = new THREE.CanvasTexture(c); st.encoding = THREE.sRGBEncoding; add(new THREE.PlaneGeometry(0.9, 0.22), new THREE.MeshBasicMaterial({ map: st }), 0, 0.6, 0.456);
  const lt = new THREE.PointLight(0x3adf5a, 0.6, 5, 2); lt.position.set(0, 1.6, 0.4); g.add(lt);
  g.position.set(s.x, s.y, s.z); scene.add(g);
  const box = mkBox(s.x, s.z, 1.8, 0.9, 0.95, { y: s.y, walk: false }); boxes.push(box);
  return { g, box, flame, flask, lt, proxy: null };
}
function zsBuild() {
  zsClear();
  if (!zmapIs(curMap)) return;
  Object.assign(ZS, { cook: -1, cookT: 0, done: false, chapter: -1, bossOut: false, boss: null, bloodItem: null }); ZS.flags.clear(); ZS.mine.clear(); ZS.said.clear();
  ZS.off = !zsWanted(); if (ZS.off) return;
  ZS.objs = ZS_ITEMS.map(it => ({ it, g: zsMake(it) }));
  ZS.tapes = ZS_TAPES.map((t, i) => ({ t, i, g: zsMake({ kind: 'tape', at: t.at }) }));
  ZS.station = zsStation(); ZS.fusebox = zsFuseBox();
  zsHud(true);
}
function zsClear() {
  for (const o of ZS.objs.concat(ZS.tapes)) if (o.g) scene.remove(o.g);
  if (ZS.bloodItem && ZS.bloodItem.g) scene.remove(ZS.bloodItem.g); ZS.bloodItem = null;
  ZS.objs = []; ZS.tapes = [];
  if (ZS.station) { zdRemove(ZS.station); ZS.station = null; }
  if (ZS.fusebox) { scene.remove(ZS.fusebox.g); ZS.fusebox = null; }
  zsBar(false); zsHud(false);
}
function zsTaken(id) { const o = ZS.objs.find(o => o.it.id === id); if (o && o.g) { scene.remove(o.g); o.g = null; } if (id === 'blood' && ZS.bloodItem && ZS.bloodItem.g) { scene.remove(ZS.bloodItem.g); ZS.bloodItem.g = null; } }

/* ---------- prompts: pick up, listen, fuse box, cook */
function zsNear(at, r = 1.6) { return Math.hypot(P.x - at.x, P.z - at.z) < r && Math.abs((P.y || 0) - at.y) < 1.6; }
function zsPrompt(use) {
  if (G.state !== 'playing') return '';
  for (const o of ZS.objs) if (o.g && zsNear(o.it.at)) {
    if (o.it.needs && !zsHas(o.it.needs)) return o.it.needs === 'power' ? `${o.it.name} · ${ZS_TEXT.needPower}` : `${o.it.name} · ${ZS_TEXT.needCard}`;
    if (o.it.kind === 'stash' && !zsHas('card')) return ZS_TEXT.stashLocked;
    if (use) zsPick(o.it); return `${o.it.name} · PRESS ${actName('use')} TO ${o.it.kind === 'stash' ? ZS_TEXT.stashVerb : 'TAKE IT'}`;
  }
  if (ZS.bloodItem && ZS.bloodItem.g && zsNear(ZS.bloodItem.at)) { if (use) zsPick({ id: 'blood', kind: 'blood', name: ZS_TEXT.drop }); return `${ZS_TEXT.drop} · PRESS ${actName('use')} TO TAKE IT`; }
  for (const t of ZS.tapes) if (t.g && zsNear(t.t.at, 1.4)) { if (use) zsPlayTape(t); return `${t.t.title} · PRESS ${actName('use')} TO LISTEN`; }
  if (ZS.fusebox && zsNear(ZS_FUSEBOX, 1.9)) {
    if (zsHas('power')) return `${ZS_TEXT.panel} · ${ZS_TEXT.powerOn}`;
    const n = zsFuses(); if (n < 3) return `${ZS_TEXT.panel} · ${n} OF 3 ${ZS_TEXT.parts} · FIND THE REST`;
    if (use) zsPower(); return `${ZS_TEXT.panel} · PRESS ${actName('use')} TO ${ZS_TEXT.panelDo}`;
  }
  if (ZS.station && zsNear(ZS_COOK, 2.0)) {
    if (ZS.done || ZS.cook >= 1) return `${ZS_TEXT.bar} · DONE`;
    if (ZS.cook >= 0) return `${ZS_TEXT.cooking} · ${Math.round(ZS.cook * 100)}% · STAY CLOSE`;
    if (zsChapterNow() < 5) return `${ZS_TEXT.station} · NOT YET · CHAPTER ${zsChapterNow() + 1}: ${ZS_CHAPTERS[zsChapterNow()].goal.toUpperCase()}`;
    if (use) zsStartCookReq(); return `${ZS_TEXT.station} · PRESS ${actName('use')} TO ${ZS_TEXT.cookDo} (60 SECONDS · HOLD THEM OFF)`;
  }
  return '';
}
function zsFlag(id) { if (ZS.flags.has(id)) return false; ZS.flags.add(id); ZS.mine.add(id); zsTaken(id); return true; }
function zsPick(it) {
  if (!zsFlag(it.id)) return;
  try { sfx.pickup(); if (it.kind === 'stash') { sfx.explode(at(it.at.x, it.at.z, 10, it.at.y)); } } catch (e) {}
  if (it.kind === 'stash') try { explosionFx(new THREE.Vector3(it.at.x, it.at.y + 0.3, it.at.z), 0.4); } catch (e) {}
  const sub = it.kind === 'fuse' ? `${zsFuses()} of 3 · ${ZS_TEXT.partSub}` : it.kind === 'stash' ? `${ZS_TEXT.stashSub} · ${zsStashes()} of 3` : it.kind === 'jar' ? ZS_TEXT.jarSub : it.kind === 'blood' ? ZS_TEXT.bloodSub : '';
  showBanner(it.name, sub); zsLine(it.kind);
  zsCheckChapter();
}
function zsPower() { if (zsFuses() < 3) return; zsFlag('power'); try { tone(60, 1.2, 0.3, 'sawtooth', 120); burst(0.4, 2000, 0.2, 'highpass'); } catch (e) {} zsApplyPower(); showBanner(ZS_TEXT.powerOn, ZS_TEXT.powerSub); zsCheckChapter(); }
// the power: the flickering lights steady and the fuse box goes green
function zsApplyPower() {
  if (ZS.fusebox) for (const m of ZS.fusebox.slots) m.material.emissive.setHex(0x2adf4a);
  try { if (curMap === 'works') worksPower(); if (curMap === 'terminal9') airpPower(); zmapPowerPads(); } catch (e) {}
  if (curMap === 'blackwell' && typeof HOSP !== 'undefined' && HOSP.flick) for (const f of HOSP.flick) { f.l.intensity = f.i * 1.15; f.t = 1e9; f.on = true; }
}
const ZS_SAY = {
  doc: { fuse: 'A fuse. Sparks will be thrilled.', card: 'My keycard. Harold, you idiot.', stash: 'Burn it. Every last pill.', jar: 'Pharmaceutical grade. Do not tell the board.', blood: 'Patient Zero\'s blood. Careful. That vial is the whole outbreak.', cook: 'Burner is lit. Sixty seconds. Keep them off me!' },
  tank: { fuse: 'Got a fuse! Where do these even go?', card: 'Got the keycard. Doc, your lab better be worth it.', stash: 'Nightshade? Not anymore. Torch it.', jar: 'The good stuff. For medical reasons. Obviously.', blood: 'Got his blood. Somebody hand me a towel.', cook: 'Cooking! Everybody on me! Nobody touches that bench!' },
  smokes: { fuse: 'Fuse. Shiny. Like a tiny glowing joint.', card: 'Keycard. Huh. I used to just prop the door open.', stash: 'Aw, man. That is my old merchandise. Goodbye, retirement.', jar: 'Oh, hello, beautiful. I have dreamed of you.', blood: 'Eddie\'s blood. Sorry, Eddie. You were my best customer.', cook: 'Okay, okay, it is cooking. Smells like redemption.' },
  sparks: { fuse: 'Fuse! Yes! I love fuses! Fuses love me!', card: 'Keycard! Shiny! Okay, lab, here we come!', stash: 'Burn it, burn it, burn it!', jar: 'Is it weird that this is the most medical thing I have seen tonight?', blood: 'Ew ew ew. Okay. Got it. Ew.', cook: 'It is bubbling! Is it supposed to bubble? Hold them off!' },
};
function zsLine(k) { if (ZS.playing || Math.random() > 0.5) return; const t = (ZS_SAY[ZL.char] || {})[k]; if (t) zvSpeak(ZL.char, t); }
// a new chapter: scene, banner, objective; chapter 4 also brings out Patient Zero
function zsCheckChapter() {
  const c = zsChapterNow(); if (c === ZS.chapter) { zsHud(); return; }
  const first = ZS.chapter < 0; ZS.chapter = c; zsHud(true);
  if (first) return;
  setTimeout(() => showBanner(`CHAPTER ${c + 1} · ${ZS_CHAPTERS[c].name}`, ZS_CHAPTERS[c].goal), 1600);
  if (ZS_SCENES[c]) setTimeout(() => zsDialog(ZS_SCENES[c]), 3200);
  if (c === 3) setTimeout(zsBoss, 4500);
}
// Patient Zero: the first NIGHTSHADE customer, big, purple and very hard to kill (the host spawns him)
function zsBoss() {
  if (ZS.bossOut || (zcInGame() && !zcHost()) || zsHas('blood')) return; ZS.bossOut = true;
  const p = (typeof zombSpawnPoint === 'function' && zombSpawnPoint()) || { x: P.x + 10, z: P.z, y: P.y || 0 };
  const e = makeZombie(p.x, p.z, p.y || 0); zsMakeBoss(e);
  e.hp = e.maxHp = ZS_TEXT.bossHp + zombHp(Math.max(1, Z.round)) * 10; e.kind = 'run'; e.speed = 3.6;
  ZS.boss = e; showBanner(ZS_TEXT.boss, ZS_TEXT.bossSub);
  try { sfx.zscreech(at(p.x, p.z, 40, p.y)); sfx.zgroan(at(p.x, p.z, 40, p.y), false); } catch (err) {}
}
function zsMakeBoss(e) {
  e.boss = true; e.group.scale.setScalar(ZS_TEXT.bossScale); e.group.userData.scale = ZS_TEXT.bossScale;
  const purple = new Map(); e.group.traverse(o => { if (o.isMesh && !o.userData.hitbox) { const m = o.material; if (!purple.has(m)) { const c = (Array.isArray(m) ? m[0] : m).clone(); if (c.emissive) { c.emissive.setHex(0x5a10a0); c.emissiveIntensity = 0.7; } if (c.color) c.color.lerp(new THREE.Color(0x6a3a8a), 0.5); purple.set(m, c); } o.material = purple.get(m); } });
  const lt = new THREE.PointLight(0x9a3cff, 1.2, 6, 2); lt.position.y = 1.6; e.group.add(lt);
}
// the boss died (host): his blood drops where he fell
function zsBossDied(e) {
  ZS.boss = null; const g = e.group.position, ok = isFinite(g.x + g.z + g.y), p = ok ? g : (e.bossLast || P);
  zsDropBlood(p.x, p.z, groundAt(p.x, p.z, (p.y || 0) + 0.3));
  showBanner(ZS_TEXT.bossDown, ZS_TEXT.bossDownSub); try { sfx.streak(); } catch (err) {}
}
function zsDropBlood(x, z, y) { if (ZS.bloodItem || zsHas('blood')) return; ZS.bloodItem = { at: { x, z, y }, g: zsMake({ kind: 'blood', look: ZS_TEXT.dropLook, at: { x, z, y } }) }; }
function zsPlayTape(t) {
  if (ZS.playing) return;
  ZS.heard.add(t.i); try { localStorage.setItem(ZS_TEXT.keyTapes, JSON.stringify([...ZS.heard])); } catch (e) {}
  try { tone(1200, 0.05, 0.08, 'square'); burst(0.3, 3000, 0.04, 'highpass'); } catch (e) {}
  showBanner(t.t.title, `tape ${ZS.heard.size} of ${ZS_TAPES.length} found`);
  zsDialog(t.t.lines);
}
// a scene: lines in each survivor's voice, one after another, with subtitles
function zsDialog(lines, done) {
  if (ZS.playing) { setTimeout(() => zsDialog(lines, done), 1500); return; }
  ZS.playing = true; let i = 0;
  const next = () => {
    if (i >= lines.length) { ZS.playing = false; if (done) done(); return; }
    const [ch, text] = lines[i++], c = zvChar(ch); zvSubtitle(c, text);
    let fired = false; const go = () => { if (fired) return; fired = true; setTimeout(next, 250); };
    const ms = 1600 + text.length * 62;
    try {
      if (ZV.enabled && window.speechSynthesis) { const u = zvUtter(c, text, 1); u.onend = go; speechSynthesis.speak(u); setTimeout(go, ms * 1.6); }
      else setTimeout(go, ms);
    } catch (e) { setTimeout(go, ms); }
  };
  next();
}
// group talk every few rounds (called from the round start)
function zsRoundTalk(r) { try { zmapRound(r); } catch (e) {} if (ZS.off) return;
  if (ZS.scene0 && r >= 2) { ZS.scene0 = false; ZS.said.add(r); if (zsChapterNow() === 0) setTimeout(() => zsDialog(ZS_SCENES[0]), 3500); return; }   // the chapter 1 briefing waits for round 2
  const s = ZS_ROUNDS[r]; if (s && !ZS.said.has(r)) { ZS.said.add(r); setTimeout(() => zsDialog(s), 3500); } }
function zsStartCookReq() { if (zcInGame() && !zcHost()) zcEvent('cook', P); else zsStartCook(); }
function zsStartCook() {
  if (ZS.cook >= 0 || ZS.done || zsChapterNow() < 5) return;
  ZS.cook = 0; ZS.cookT = 0;
  showBanner(ZS_TEXT.cooking, `hold them off for 60 seconds · ${ZS_TEXT.cookStay}`); zsLine('cook');
  if (typeof Z !== 'undefined') { Z.toSpawn += 14; Z.active = true; Z.spawnT = 0.5; }
}
// every frame (the host runs the boss and the cooking; everyone draws)
function zsTick(dt) {
  if (ZS.off) return;
  for (const o of ZS.objs.concat(ZS.tapes, ZS.bloodItem ? [ZS.bloodItem] : [])) if (o.g) { o.g.rotation.y += dt * 1.2; o.g.userData.beam.material.opacity = 0.08 + Math.sin(NOW * 3) * 0.05; }
  if (ZS.boss && enemies.includes(ZS.boss)) { const g = ZS.boss.group.position; ZS.boss.bossLast = { x: g.x, z: g.z, y: g.y }; }
  if (ZS.boss && !enemies.includes(ZS.boss)) zsBossDied(ZS.boss);
  if (ZS.chapter === 3 && !ZS.bossOut && !zsHas('blood') && (!zcInGame() || zcHost()) && !ZS.bossLater) { ZS.bossLater = true; setTimeout(() => { ZS.bossLater = false; zsBoss(); }, 3000); }
  const st = ZS.station; if (!st) return;
  const cooking = ZS.cook >= 0 && ZS.cook < 1;
  st.flame.visible = cooking; st.flask.material.emissiveIntensity = cooking ? 0.6 + Math.sin(NOW * 8) * 0.3 : ZS.done ? 1.2 : 0.2;
  if (cooking && Math.random() < dt * 8) try { puff(ZS_COOK.x - 0.3, ZS_COOK.y + 1.5, ZS_COOK.z, { color: 0x9adf9a, size: 0.08, grow: 0.5, life: 1.2, vy: 0.5, op: 0.35 }); } catch (e) {}
  if (cooking && (!zcInGame() || zcHost())) {
    const near = (Math.hypot(P.x - ZS_COOK.x, P.z - ZS_COOK.z) < ZS_COOK.need && !ZC.down && !ZC.dead) || (zcInGame() && [...ZC.rem.values()].some(R => R.inGame && R.a && !R.dn && Math.hypot(R.x - ZS_COOK.x, R.z - ZS_COOK.z) < ZS_COOK.need));
    if (near) ZS.cookT += dt;
    ZS.cook = Math.min(1, ZS.cookT / ZS_COOK.secs);
    if (Math.random() < dt * 0.6 && Z.toSpawn < 4) Z.toSpawn += 2;
    if (ZS.cook >= 1) zsComplete();
  }
  zsBar(cooking);
}
function zsBar(on) {
  let b = $('zCook');
  if (!b) { b = document.createElement('div'); b.id = 'zCook'; b.innerHTML = '<span></span><i><s></s></i>'; ($('hud') || document.body).appendChild(b); const st = document.createElement('style'); st.textContent = `#zCook{position:absolute;left:50%;top:84px;transform:translateX(-50%);width:min(420px,70vw);text-align:center;pointer-events:none;font:800 12px var(--font,system-ui);letter-spacing:.2em;color:#9aff9a;text-shadow:0 1px 4px #000}#zCook i{display:block;height:8px;margin-top:6px;background:rgba(0,0,0,.6);border:1px solid rgba(154,255,154,.5)}#zCook s{display:block;height:100%;width:0;background:linear-gradient(90deg,#2adf4a,#9aff6a);box-shadow:0 0 10px #2adf4a}`; document.head.appendChild(st); }
  b.style.display = on ? '' : 'none'; if (on) b.querySelector('span').textContent = ZS_TEXT.bar; if (on) b.querySelector('s').style.width = Math.round(ZS.cook * 100) + '%';
}
// the objective line on screen (top left, under the minimap side)
function zsHud(force) {
  let h = $('zQuest');
  if (!h) { h = document.createElement('div'); h.id = 'zQuest'; ($('hud') || document.body).appendChild(h); const st = document.createElement('style'); st.textContent = `#zQuest{position:absolute;right:28px;top:200px;max-width:300px;text-align:right;pointer-events:none;font:700 12px var(--font,system-ui);letter-spacing:.12em;color:#dfe8d0;text-shadow:0 1px 4px #000;line-height:1.5}#zQuest b{display:block;color:#7adf6a;letter-spacing:.2em;font-size:11px}`; document.head.appendChild(st); }
  if (force === false || ZS.off) { h.innerHTML = ''; return; }
  const c = zsChapterNow(), ch = ZS_CHAPTERS[c];
  let extra = c === 0 ? ` (${zsFuses()}/3)` : c === 2 ? ` (${zsStashes()}/3)` : '';
  const html = typeof M !== 'undefined' && M && M.mode === 'zomb' ? `<b>${ZS_TEXT.title} · CHAPTER ${c + 1} OF 7</b>${ch.name} · ${ch.goal}${extra}` : '';
  if (force || h._h !== html) { h._h = html; h.innerHTML = html; }
}
function zsComplete() {
  if (ZS.done) return; ZS.done = true; ZS.cook = 1;
  try { localStorage.setItem(ZS_TEXT.keyDone, 'done'); } catch (e) {}
  showBanner(ZS_TEXT.title, ZS_TEXT.doneSub);
  try { sfx.streak(); } catch (e) {}
  for (const p of ZPERKS) ZP.have.add(p.id); zpApply(); zpHud(true);
  const w = WEAPONS[G.cur]; if (w && Z.up) { Z.up.add(w.def.id); zombEquip(G.cur); }
  G.points += 5000; zsCheckChapter(); try { zstStory(); setTimeout(() => zwwGive(curMap), 4000); } catch (e) {}   // the map's wonder weapon is the reward
  setTimeout(() => zsDialog(ZS_END, () => showBanner(ZS_TEXT.cont, ZS_TEXT.contSub)), 1500);
}
// co-op: the host merges what everyone picked up; clients follow the host's flags, boss blood and cooking
function zsFromHost(H) {
  let ch = false;
  if (Array.isArray(H.qf)) for (const id of H.qf) if (typeof id === 'string' && !ZS.flags.has(id)) { ZS.flags.add(id); zsTaken(id); if (id === 'power') zsApplyPower(); ch = true; }
  if (Array.isArray(H.qb) && !ZS.bloodItem && !zsHas('blood')) zsDropBlood(netNum(H.qb[0], -ARENA, ARENA), netNum(H.qb[1], -ARENA, ARENA), netNum(H.qb[2], -5, 20));
  if (typeof H.qc === 'number') { const was = ZS.cook; ZS.cook = H.qc; if (was < 0 && H.qc >= 0 && H.qc < 1) showBanner(ZS_TEXT.cooking, 'hold them off for 60 seconds'); if (H.qc >= 1 && !ZS.done) zsComplete(); }
  if (ch) zsCheckChapter();
}
function zsFromPeer(R) {
  let ch = false;
  if (Array.isArray(R.pr && R.pr.qi)) for (const id of R.pr.qi) if ((ZS_ITEMS.some(it => it.id === id) || id === 'power' || id === 'blood') && !ZS.flags.has(id)) { ZS.flags.add(id); zsTaken(id); if (id === 'power') zsApplyPower(); ch = true; }
  if (ch) zsCheckChapter();
}
// the intro, every game (any key or 6 seconds hides the title; the voices finish over gameplay)
function zsIntro() {
  if (ZS.off) { ZS.chapter = 0; return; }
  let o = $('zIntro'); if (!o) { o = document.createElement('div'); o.id = 'zIntro'; document.body.appendChild(o); const st = document.createElement('style'); st.textContent = `#zIntro{position:fixed;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,rgba(20,4,30,.75),rgba(0,0,0,.92));color:#e8e2d0;pointer-events:none;transition:opacity 1.2s;text-align:center}#zIntro b{font:900 54px Georgia,serif;letter-spacing:.12em;color:#7adf6a;text-shadow:0 0 30px rgba(90,223,106,.5)}#zIntro small{font:700 13px var(--font,system-ui);letter-spacing:.4em;margin-top:10px;color:#b06cff}#zIntro em{font:14px var(--font,system-ui);margin-top:26px;opacity:.6;font-style:normal;letter-spacing:.2em}`; document.head.appendChild(st); }
  o.innerHTML = `<small>${ZS_TEXT.place}</small><b>${ZS_TEXT.title}</b><small>${zsDoneEver() ? 'STORY COMPLETE · PLAY IT AGAIN' : ZS_TEXT.introSub}</small><em>${ZS_TEXT.introEm}</em>`;
  o.style.opacity = 1; o.style.display = '';
  const hide = () => { o.style.opacity = 0; setTimeout(() => { o.style.display = 'none'; }, 1300); removeEventListener('keydown', hide); };
  addEventListener('keydown', hide); setTimeout(hide, 6000);
  // the opening scene plays the first time you play this map; the chapter 1 briefing comes after round 1, not on top of it
  let first = false; try { first = !localStorage.getItem(ZS_TEXT.keyDone + '.intro'); localStorage.setItem(ZS_TEXT.keyDone + '.intro', '1'); } catch (e) {}
  ZS.scene0 = true;
  if (first) setTimeout(() => { try { if (M.mode === 'zomb') zsDialog(ZS_INTRO, () => zsCheckChapter()); } catch (e) {} }, 1200);
  ZS.chapter = -1; setTimeout(() => { if (ZS.chapter < 0) { ZS.chapter = 0; zsHud(true); } }, 1300);
}
