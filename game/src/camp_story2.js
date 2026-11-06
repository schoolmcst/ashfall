/* ================================================================== CAMPAIGN CHAPTER TWO: SECOND HARVEST (1.2.86)
   After BAYVIEW (zombies chapter seven): the cure is in the air, Greenline is gone, but VANTAGE's last commander,
   COLONEL RAKE, took the last bus inland with the last crate of Nightshade seeds. June and the survivors start the
   co-op again at an old farm (THE TRIM HOUSE), meet a contact at the SKATE PARK, and catch Rake at BAYVIEW's
   helipad before he flies the seeds out. Three missions after LIGHTS OUT. */
CAMP_PLAN.push('NEW ROOTS', 'THE MEETUP', 'LAST BUS OUT');
CCHARS.push({ id: 'driver', name: 'DEX · THE DRIVER', col: '#5ac8ff', voice: { want: ['mark', 'david', 'tom', 'male'], female: false, pitch: 0.95, rate: 1.05 } });

/* ---------- 13 · NEW ROOTS (THE TRIM HOUSE) */
CAMP_MISSIONS.push({
  id: 'c2m1', title: 'NEW ROOTS', map: 'trimhouse', place: 'CHAPTER TWO · THE TRIM HOUSE', when: 'ONE MONTH LATER · 09:10',
  brief: 'The cure worked. The towns are waking up. June and the crew have a new farm to start the Green Coast Collective again: an old trim house nobody wanted. Somebody wanted it.',
  tasks: ['PLANT THE CLONES', 'HOLD THE GREENHOUSE', 'SAVE THE WATER', 'CLEAR THE YARD', 'LIEUTENANT VOSK'],
  start: { x: 0, z: 24, y: 0, yaw: 0 }, allies: ['tank', 'sparks'], loadout: { p: 'marc', s: 'sidearm', e: 'frag', n: 2 },
  tins: [{ x: -26, z: -24 }, { x: 26, z: 24 }, { x: -22, z: 6 }],
  squads: {
    n1: { alert: true, pts: [{ x: -6, z: -24 }, { x: 0, z: -25 }, { x: 6, z: -24, kind: 'smg' }] },
    n2: { alert: true, pts: [{ x: -16, z: -22 }, { x: -12, z: -24, kind: 'shotgun' }, { x: 14, z: -22 }, { x: 18, z: -24, kind: 'smg' }] },
    n3: { alert: true, pts: [{ x: -2, z: -25, kind: 'heavy' }, { x: 4, z: -25 }, { x: -22, z: -18, kind: 'smg' }, { x: 22, z: -18 }] },
    barn: { pts: [{ x: -20, z: -4, look: 0, path: [[-20, -4], [-16, -4], [-16, 4], [-20, 4]] }, { x: -16, z: 5, look: Math.PI }, { x: -21, z: 2, look: Math.PI / 2 }] },
    yard: { alert: true, pts: [{ x: 19, z: 6 }, { x: 25, z: -4, kind: 'sniper' }, { x: 18, z: -14, kind: 'shotgun' }, { x: 14, z: 12 }] },
    vosk: { alert: true, pts: [{ x: 20, z: -18, kind: 'heavy', boss: true, name: 'LIEUTENANT VOSK', hp: 1600, gun: 'titan', scale: 1.15 }, { x: 16, z: -20, kind: 'smg' }, { x: 24, z: -20, kind: 'shotgun' }] },
  },
  steps: [
    { type: 'talk', goal: 'THE NEW FARM', secs: 1, say: [['tank', 'Glass house, a barn, a yard. Nobody has touched it in years.'], ['june', 'Mara would have loved it. We start over. Right here.'], ['sparks', 'I brought clones! Twelve little plants! I named all of them!']] },
    { type: 'go', goal: 'GO INTO THE GREENHOUSE', at: { x: 0, z: 0, r: 4 }, say: [['june', 'Grow tables still good. Lights still work. We can do this.']] },
    { type: 'multi', goal: 'PLANT THE CLONES', verb: 'PLANT THE CLONES', secs: 1.6, prop: 'box', spots: [{ x: -4, z: -1.6 }, { x: 0, z: 1.6 }, { x: 4, z: -1.6 }],
      after: [['sparks', 'Planted! Grow, babies, grow!']] },
    { type: 'talk', goal: 'LISTEN', secs: 1, say: [['radio', 'All VANTAGE units. Colonel Rake wants that farm. Nobody grows anything there. Move in.'], ['tank', 'VANTAGE. I thought we were done with VANTAGE.'], ['june', 'Not quite. Hold the glass house!']] },
    { type: 'hold', goal: 'HOLD THE GREENHOUSE', at: { x: 0, z: 0, r: 10 }, secs: 90, cp: true,
      waves: [{ t: 2, sq: 'n1' }, { t: 28, sq: 'n2' }, { t: 58, sq: 'n3' }],
      say: [['tank', 'They are coming from the north gate. Glass will not stop bullets for long. Keep moving.']], after: [['sparks', 'They ran away! And the water tastes funny! Purple funny!'], ['june', 'They put something in the barn tank. Nightshade. They are poisoning the water.']] },
    { type: 'use', goal: 'SHUT OFF THE POISONED TANK IN THE BARN', verb: 'SHUT THE VALVE', secs: 3, prop: 'panel', at: { x: -18.5, z: 6.5, r: 1.8 }, spawn: ['barn'], quiet: true, onAlarm: ['yard'], cp: true,
      say: [['tank', 'Barn. They left men inside. Quiet if you can.']], after: [['june', 'Valve shut. The clones are safe.']] },
    { type: 'clear', goal: 'CLEAR THE LOADING YARD', spawn: ['yard'], squads: ['yard', 'barn'], cp: true, say: [['radio', 'The barn is lost. Fall back to the yard.']] },
    { type: 'boss', goal: 'TAKE DOWN LIEUTENANT VOSK', spawn: ['vosk'], squads: ['vosk'], cp: true,
      say: [['radio', 'This is Vosk. You burned Greenline. You will not grow a single leaf.'], ['june', 'Watch me.']] },
  ],
  end: [['tank', 'Vosk had orders on him. From Colonel Rake. A meeting at the skate park downtown.'], ['june', 'Rake. The one who took the last bus inland.'], ['sparks', 'We should go to the skate park! I have always wanted to go to a skate park!']],
});

/* ---------- 14 · THE MEETUP (SKATE PARK) */
CAMP_MISSIONS.push({
  id: 'c2m2', title: 'THE MEETUP', map: 'skatepark', place: 'CHAPTER TWO · SKATE PARK', when: 'TWO DAYS LATER · 19:30',
  brief: 'Vosk was meeting someone at the skate park: HAROLD\'s old driver, who knows where Rake took the seeds. Get to him before VANTAGE does, and get him out.',
  tasks: ['MEET THE DRIVER', 'THE AMBUSH', 'GET HIM TO THE SHACK', 'HOLD THE SHACK', 'THE COURIER'],
  start: { x: 0, z: 22, y: 0, yaw: 0 }, allies: ['smokes', 'doc', 'driver'], loadout: { p: 'striker', s: 'sidearm', e: 'frag', n: 2 },
  tins: [{ x: -23, z: -23 }, { x: 23, z: -22 }, { x: 17, z: 2.5 }],
  squads: {
    amb1: { alert: true, pts: [{ x: -8, z: -20 }, { x: 0, z: -22, kind: 'smg' }, { x: 8, z: -20 }] },
    amb2: { alert: true, pts: [{ x: 22, z: -6 }, { x: 22, z: 6, kind: 'shotgun' }, { x: 17, z: -8 }] },
    sh1: { alert: true, pts: [{ x: -22, z: -18 }, { x: -12, z: -20, kind: 'smg' }, { x: -4, z: -14 }] },
    sh2: { alert: true, pts: [{ x: -22, z: 18 }, { x: -12, z: 20, kind: 'shotgun' }, { x: -4, z: 14 }] },
    sh3: { alert: true, pts: [{ x: 6, z: -4, kind: 'heavy' }, { x: 6, z: 4 }, { x: -2, z: -10, kind: 'smg' }, { x: -2, z: 10 }] },
    courier: { alert: true, pts: [{ x: 10, z: -18, kind: 'heavy', boss: true, name: 'THE COURIER', hp: 1700, gun: 'hailstorm', scale: 1.12 }, { x: 6, z: -20, kind: 'smg' }, { x: 14, z: -20, kind: 'smg' }] },
  },
  steps: [
    { type: 'talk', goal: 'THE SKATE PARK', secs: 1, say: [['smokes', 'I used to skate here, man. Before the back. Before everything.'], ['doc', 'The driver said the funbox in the middle. Eight o\'clock.']] },
    { type: 'go', goal: 'GO TO THE FUNBOX', at: { x: 0, z: 8.5, r: 3 }, say: [['driver', '...you are not Vosk. Good. Vosk is the reason I am hiding.'], ['june', 'You drove for Harold Voss. Where did Rake take the seeds?']] },
    { type: 'talk', goal: 'LISTEN', secs: 1, say: [['driver', 'Not here. They followed me. Look. Look at the fence.'], ['radio', 'Target located. Take the driver. Nobody else leaves.']] },
    { type: 'clear', goal: 'SURVIVE THE AMBUSH', spawn: ['amb1', 'amb2'], squads: ['amb1', 'amb2'], cp: true, say: [['doc', 'Behind the funbox! Use the ramps!']] },
    { type: 'escort', goal: 'GET THE DRIVER TO THE SNACK SHACK', who: 'driver', hp: 700, lead: 10, cp: true,
      path: [[0, 4.5], [-6, 4.5], [-11, 3.5], [-14.8, 0], [-17, 0]],
      say: [['driver', 'The snack shack. It has a back door and a radio.']], after: [['driver', 'I can call it in from here. Give me ninety seconds.']] },
    { type: 'defend', goal: 'HOLD THE SHACK WHILE HE RADIOS', obj: { x: -17, z: 0, hp: 100, name: 'THE DRIVER', r: 8, dps: 1.4 }, secs: 90, cp: true,
      waves: [{ t: 2, sq: 'sh1' }, { t: 30, sq: 'sh2' }, { t: 60, sq: 'sh3' }],
      say: [['smokes', 'Graffiti walls, man. Good cover. Stay behind them.']], after: [['driver', 'Done. Rake is at Bayview. The helipad on the Greenline tower. He flies the seeds out at dawn.']] },
    { type: 'boss', goal: 'TAKE DOWN THE COURIER', spawn: ['courier'], squads: ['courier'], cp: true,
      say: [['radio', 'This is the Courier. The colonel sends his regards. And his bill.'], ['doc', 'Big one by the restrooms! Spread out!']] },
  ],
  end: [['driver', 'Bayview. The tower. Dawn. That is all I know.'], ['june', 'Then we go back to Bayview. One more time.'], ['smokes', 'I liked Bayview, man. It had pancakes.']],
});

/* ---------- 15 · LAST BUS OUT (BAYVIEW) */
CAMP_MISSIONS.push({
  id: 'c2m3', title: 'LAST BUS OUT', map: 'bayview', place: 'CHAPTER TWO · BAYVIEW', when: 'DAWN',
  brief: 'Colonel Rake has the last crate of Nightshade seeds and a helicopter on top of the Greenline tower. If those seeds leave Bayview, it all starts again. It ends here.',
  tasks: ['THE HARBOUR', 'THE TIMETABLE', 'THE PLAZA', 'THE SEEDS', 'THE HELICOPTER', 'COLONEL RAKE'],
  start: { x: 2, z: 34, y: 0, yaw: 0 }, allies: ['tank', 'doc', 'smokes', 'sparks'], loadout: { p: 'marc', s: 'sidearm', e: 'frag', n: 3 },
  tins: [{ x: -20, z: 37 }, { x: 22.5, z: 15.5 }, { x: -4, z: -40 }],
  squads: {
    lob: { alert: true, pts: [{ x: 4, z: 22 }, { x: -6, z: 16, kind: 'smg' }, { x: 7, z: 14 }] },
    plz1: { alert: true, pts: [{ x: -5, z: -2 }, { x: 5, z: -4, kind: 'smg' }, { x: -6, z: -14 }, { x: 6, z: -14, kind: 'shotgun' }] },
    plz2: { alert: true, pts: [{ x: -16, z: -14, kind: 'heavy' }, { x: 16, z: -10 }, { x: 0, z: -22, kind: 'sniper' }] },
    lab: { alert: true, pts: [{ x: -14, z: -12 }, { x: -17, z: -4, kind: 'smg' }, { x: -12, z: -22 }] },
    h1: { alert: true, pts: [{ x: -10, z: -26 }, { x: 0, z: -28, kind: 'smg' }, { x: 10, z: -26 }] },
    h2: { alert: true, pts: [{ x: -12, z: -36 }, { x: -8, z: -30, kind: 'shotgun' }, { x: 4, z: -32 }, { x: 14, z: -30, kind: 'smg' }] },
    h3: { alert: true, pts: [{ x: 0, z: -30, kind: 'heavy' }, { x: -14, z: -30 }, { x: 14, z: -28 }] },
    rake: { alert: true, pts: [{ x: 0, z: -24, kind: 'officer', boss: true, name: 'COLONEL RAKE', hp: 2200, gun: 'deadeye', scale: 1.1 }, { x: -6, z: -22, kind: 'heavy' }, { x: 6, z: -22, kind: 'heavy' }] },
  },
  steps: [
    { type: 'talk', goal: 'BACK TO BAYVIEW', secs: 1, say: [['sparks', 'Bayview! It is so quiet now! Nobody is chasing us!'], ['tank', 'Yet.'], ['doc', 'The tower. Rake is on the roof. The seeds are with him or close by.']] },
    { type: 'clear', goal: 'FIGHT INTO THE GREENLINE LOBBY', spawn: ['lob'], squads: ['lob'], cp: true, say: [['radio', 'Movement at the harbour. All units, the lobby.']] },
    { type: 'use', goal: 'READ THE BUS TIMETABLE', verb: 'READ IT', secs: 1.5, at: { x: -2, z: 8.5, r: 2.2 },
      say: [['june', 'The bus stop. Rake took the last bus inland. Then he came back. Why come back?']], after: [['doc', 'Somebody wrote on it. LAB. Seeds in the lab. He left them where they were made.']] },
    { type: 'clear', goal: 'TAKE THE PLAZA', spawn: ['plz1', 'plz2'], squads: ['plz1', 'plz2'], cp: true, say: [['smokes', 'The fountain, man! Use the fountain!']] },
    { type: 'carry', goal: 'CARRY THE SEED CRATE FROM THE LAB TO THE HELIPAD', item: 'THE LAST SEEDS', at: { x: -16, z: -9, r: 1.8 }, to: { x: 8, z: -31, r: 3 }, spawn: ['lab', 'h1'], cp: true,
      say: [['tank', 'Grab it. We burn it where Rake can watch.']], after: [['june', 'Here. On his own helipad.']] },
    { type: 'defend', goal: 'HOLD THE HELIPAD WHILE THE SEEDS BURN', obj: { x: 8, z: -31, hp: 100, name: 'THE FIRE', r: 9, dps: 1.6 }, secs: 75, cp: true,
      waves: [{ t: 2, sq: 'h2' }, { t: 35, sq: 'h3' }],
      say: [['sparks', 'Fire! Big fire! The best fire! Keep them off it!']], after: [['radio', 'This is Colonel Rake. You have burned the last of it. Then I will take it out of your hides.']] },
    { type: 'boss', goal: 'TAKE DOWN COLONEL RAKE', spawn: ['rake'], squads: ['rake'], cp: true,
      say: [['june', 'It is over, Rake. No seeds. No Greenline. No VANTAGE.'], ['radio', 'It is never over, Miss Alvarez. Not while people want something to make the pain stop.'], ['doc', 'They have a cure now. They have us.']] },
  ],
  end: [['june', 'Rake is down. The seeds are ash. The helicopter can stay where it is.'], ['tank', 'So what now?'], ['june', 'Now we grow. The Trim House. The co-op. Like Mara wanted.'], ['smokes', 'Second harvest, man. Better than the first.'], ['sparks', 'I will name every plant!']],
});
