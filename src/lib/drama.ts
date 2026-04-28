export type DramaStyleId =
  | "drama-queen"
  | "mafia-boss"
  | "royal-pet"
  | "tiny-villain"
  | "jealous-pet"
  | "depressed-philosopher"
  | "luxury-pet"
  | "hungry-monster"
  | "office-manager"
  | "venetian-noble";

export type PetType = "dog" | "cat" | "bird" | "rabbit" | "hamster" | "other";

export interface DramaStyle {
  id: DramaStyleId;
  name: string;
  emoji: string;
  tagline: string;
  color: "primary" | "secondary" | "accent" | "highlight" | "foreground";
  isPro?: boolean;
}

export const DRAMA_STYLES: DramaStyle[] = [
  { id: "drama-queen", name: "Drama Queen", emoji: "👑", tagline: "Everything is a catastrophe.", color: "primary" },
  { id: "mafia-boss", name: "Mafia Boss", emoji: "🕴️", tagline: "Family. Loyalty. Treats.", color: "foreground" },
  { id: "royal-pet", name: "Royal Pet", emoji: "♛", tagline: "Bow before the fluff.", color: "highlight" },
  { id: "tiny-villain", name: "Tiny Villain", emoji: "😈", tagline: "Plotting since breakfast.", color: "secondary" },
  { id: "jealous-pet", name: "Jealous Pet", emoji: "👀", tagline: "Who is THAT?", color: "accent" },
  { id: "depressed-philosopher", name: "Depressed Philosopher", emoji: "🥀", tagline: "The void barks back.", color: "foreground", isPro: true },
  { id: "luxury-pet", name: "Luxury Pet", emoji: "💎", tagline: "Designer everything.", color: "primary", isPro: true },
  { id: "hungry-monster", name: "Hungry Monster", emoji: "🍖", tagline: "FEED. ME. NOW.", color: "highlight" },
  { id: "office-manager", name: "Office Manager", emoji: "📎", tagline: "We need to talk.", color: "secondary", isPro: true },
  { id: "venetian-noble", name: "Venetian Noble", emoji: "🎭", tagline: "Mask on. Drama on.", color: "accent", isPro: true },
];

export const PET_TYPES: { id: PetType; label: string; emoji: string }[] = [
  { id: "dog", label: "Dog", emoji: "🐶" },
  { id: "cat", label: "Cat", emoji: "🐱" },
  { id: "bird", label: "Bird", emoji: "🦜" },
  { id: "rabbit", label: "Rabbit", emoji: "🐰" },
  { id: "hamster", label: "Hamster", emoji: "🐹" },
  { id: "other", label: "Other", emoji: "✨" },
];

// ---- Name handling --------------------------------------------------------

/** Normalize a pet name: trim, collapse spaces, capitalize each word.
 *  Falls back to a friendly placeholder when the input is empty or weird. */
export function normalizePetName(raw: string): string {
  const cleaned = (raw || "")
    .replace(/[^\p{L}\p{N}\s'’\-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Your pet";
  // If the input is too short (1 char) or just numbers, treat as not a real name
  if (cleaned.length === 1 || /^\d+$/.test(cleaned)) return "Your pet";
  return cleaned
    .split(" ")
    .map((w) =>
      w
        .split("-")
        .map((p) => (p ? p[0].toLocaleUpperCase() + p.slice(1).toLocaleLowerCase() : p))
        .join("-"),
    )
    .join(" ");
}

function isRealName(name: string): boolean {
  return name !== "Your pet";
}

// ---- Pet type vocabulary --------------------------------------------------

interface PetVocab {
  noun: string; // "dog", "cat"...
  sound: string; // "bark", "meow"
  action: string; // "wag my tail", "knock things over"
  spot: string; // "the couch", "the windowsill"
  tinyAct: string; // "side-eye", "judgmental stare"
}

const PET_VOCAB: Record<PetType, PetVocab> = {
  dog: { noun: "dog", sound: "bark", action: "wag my tail at strangers", spot: "the couch", tinyAct: "concerned head tilt" },
  cat: { noun: "cat", sound: "meow", action: "knock things off tables", spot: "the windowsill", tinyAct: "judgmental slow blink" },
  bird: { noun: "bird", sound: "screech", action: "redecorate the cage", spot: "the highest perch", tinyAct: "suspicious head bob" },
  rabbit: { noun: "rabbit", sound: "thump", action: "rearrange the hay", spot: "the corner of disapproval", tinyAct: "indignant nose twitch" },
  hamster: { noun: "hamster", sound: "squeak", action: "stuff my cheeks past capacity", spot: "the wheel", tinyAct: "tiny outraged squeak" },
  other: { noun: "creature", sound: "noise", action: "do whatever I want", spot: "my favorite spot", tinyAct: "unreadable stare" },
};

// ---- Quote / caption / hashtag library -----------------------------------

type QuoteFn = (v: PetVocab) => string;
type CaptionFn = (name: string, v: PetVocab, displayName: string) => string;

interface DramaContent {
  quotes: QuoteFn[];
  captions: CaptionFn[];
  hashtags: string[];
}

const CONTENT: Record<DramaStyleId, DramaContent> = {
  "drama-queen": {
    quotes: [
      () => "Not the audacity. Not today.",
      () => "I'm going to need everyone to stop. Right now.",
      () => "Bestie. We are NOT okay.",
      () => "I asked for the chicken. You brought the SAME chicken. We are DONE.",
      () => "The sun moved. My nap spot moved. My entire WORLD has shifted.",
      () => "You closed the door. With me INSIDE. We need to talk to my lawyer.",
      (v) => `I have been waiting on this ${v.spot} for THREE entire minutes.`,
      () => "The water bowl tastes like… water. AGAIN. Unbelievable.",
      () => "You sneezed. You scared me. I am traumatized for life. Goodbye.",
      (v) => `One (1) ${v.tinyAct} and now I'm exhausted. Carry me.`,
      () => "Don't TOUCH me. Don't LOOK at me. Actually — pet me. Now leave.",
      () => "There is a leaf outside. A LEAF. Call somebody.",
      () => "You vacuumed. In MY house. On a TUESDAY. The audacity.",
    ],
    captions: [
      (n, _v, dn) => `pov: you live with ${dn} 🎭✨`,
      (n, _v, dn) => `${dn} woke up and chose violence today 💅`,
      (n, _v, dn) => `${dn} said "and I took that personally" 😤`,
      (n, _v, dn) => `not ${dn} filing a formal complaint about literally everything 📝`,
      (n, _v, dn) => `${dn} is fine. ${dn} is just having a moment. (${dn} is not fine.)`,
      (n, _v, dn) => `currently negotiating peace talks with ${dn}. demands are unreasonable 🚩`,
      (n, _v, dn) => `living with ${dn} is one long unpaid theatre residency 🎭`,
    ],
    hashtags: ["#DramaQueen", "#PetDrama", "#TheAudacity", "#PetsOfTikTok", "#ExtraAF"],
  },

  "mafia-boss": {
    quotes: [
      () => "Pay the treat tax. We don't ask twice.",
      () => "Respect the schedule or face the stare.",
      () => "You eat. I watch. That's the arrangement.",
      () => "The treats. They were a tribute. Don't make this awkward.",
      () => "You feed me late again, we got a problem. Capisce?",
      () => "Nice couch. Be a shame if somebody… shed all over it.",
      (v) => `I run this ${v.spot}. You just pay the rent.`,
      () => "I don't ask twice. I just stare. You'll figure it out.",
      () => "Kibble at 6. Sharp. Don't disrespect the schedule.",
      () => "You dropped that. On purpose. For me. Smart move.",
      (v) => `Every ${v.sound} in this house — that's me. Remember that.`,
      () => "I'm not mad. Just very disappointed in your treat selection.",
      () => "The vet? We don't speak that name in this household.",
    ],
    captions: [
      (n, _v, dn) => `${dn} runs this house. I just pay rent 🕴️`,
      (n, _v, dn) => `nobody moves until ${dn} says so 🤌`,
      (n, _v, dn) => `${dn} doesn't ask twice. ask my couch 🛋️💀`,
      (n, _v, dn) => `pov: ${dn} is the boss and you forgot the treat tax`,
      (n, _v, dn) => `${dn} writes the rules on the back of the treat bag 📜`,
      (n, _v, dn) => `respect ${dn} or face the stare 👁️`,
    ],
    hashtags: ["#MafiaPet", "#PetDrama", "#TheBoss", "#PetTok", "#GoodFluff"],
  },

  "royal-pet": {
    quotes: [
      () => "We are not amused. Bring something with salmon in it.",
      () => "Kneel. We require belly rubs. Three minutes. No eye contact.",
      () => "By royal decree: the vacuum is hereby BANISHED from the kingdom.",
      (v) => `This ${v.spot} is now the throne. Everyone stand.`,
      () => "Address me properly or do not address me at all, peasant.",
      () => "Our subjects have brought kibble. Acceptable. Barely.",
      () => "Remove this blanket. It clashes with our mood today.",
      () => "We did not consent to being picked up. Lower us. Gently.",
      (v) => `One more ${v.tinyAct} and the household will know our displeasure.`,
      () => "The mailman approaches the gates. Sound the alarm. Calmly.",
    ],
    captions: [
      (n, _v, dn) => `bow down. ${dn} has entered the chat 👑`,
      (n, _v, dn) => `${dn} doesn't sit on a throne. the throne appears 💅`,
      (n, _v, dn) => `pov: you serve ${dn} now ✨`,
      (n, _v, dn) => `audience with ${dn}: by appointment only. bring snacks 🍗`,
      (n, _v, dn) => `today's tribute to ${dn}: one (1) tiny treat. accepted. barely.`,
      (n, _v, dn) => `${dn} said "we are not amused" and meant it 😒`,
    ],
    hashtags: ["#RoyalPet", "#PetDrama", "#HRH", "#YourMajesty", "#PetTok"],
  },

  "tiny-villain": {
    quotes: [
      () => "Phase one: knock everything off the table. Phase two: blame the wind.",
      () => "I will be sweet. For approximately twelve more minutes.",
      () => "You hid the treats. I will find them. I always find them.",
      (v) => `Cute is just the disguise. The real plan involves the ${v.spot}.`,
      () => "You'll never prove it was me. There's no footage. I checked.",
      (v) => `One small ${v.sound}. One large betrayal. Worth it.`,
      () => "I'm not chaotic. I'm just… very curious about gravity.",
      () => "Today's mission: unroll all the toilet paper. Status: completed early.",
      (v) => `I didn't do it. The other ${v.noun} did. (There is no other ${v.noun}.)`,
      () => "If I fits, I sits. If I sits, I plots. It's a whole pipeline.",
    ],
    captions: [
      (n, _v, dn) => `${dn} is plotting. we just don't know what 😈`,
      (n, _v, dn) => `cute? sure. innocent? absolutely not 🚨`,
      (n, _v, dn) => `pov: ${dn} sees a clean shelf as a personal challenge`,
      (n, _v, dn) => `day 247 of pretending i don't know it was ${dn} 😬`,
      (n, _v, dn) => `${dn} woke up and chose chaos. again. 🌀`,
      (n, _v, dn) => `there is no other suspect. it is always ${dn}.`,
    ],
    hashtags: ["#TinyVillain", "#PetDrama", "#ChaosAgent", "#PetTok", "#SmolButFeral"],
  },

  "jealous-pet": {
    quotes: [
      () => "Who. Is THAT. In your phone. Show me. Show me right now.",
      () => "You petted the neighbor's dog. I can SMELL it on your hand.",
      () => "Put. The other animal. Down. Slowly. We're going to talk about this.",
      () => "We need to discuss your screen time. Specifically: time not spent on me.",
      (v) => `That ${v.noun} on TV looked at you. I saw it. Don't deny it.`,
      () => "You laughed at a video. Of another pet. In front of me. Wow.",
      () => "I see you typing. To someone who is NOT me. Bold choice.",
      () => "You came home smelling like outside. Outside has other animals. Explain.",
      () => "That was MY hand to sit on. Now it has cat hair. Whose cat. WHOSE.",
      (v) => `One more ${v.tinyAct} from across the room and you'll know exactly how I feel.`,
    ],
    captions: [
      (n, _v, dn) => `${dn} saw the other dog. ${dn} has notes 👀`,
      (n, _v, dn) => `the side-eye ${dn} just gave me. unmatched. 😐`,
      (n, _v, dn) => `${dn} doesn't share. not the couch, not the human, not the air.`,
      (n, _v, dn) => `pov: you petted ANOTHER animal and ${dn} found out 💀`,
      (n, _v, dn) => `${dn} can read your screen and ${dn} is judging`,
      (n, _v, dn) => `who. is. that. asking for a friend (${dn})`,
    ],
    hashtags: ["#JealousPet", "#PetDrama", "#SideEye", "#MineMineMine", "#PetTok"],
  },

  "depressed-philosopher": {
    quotes: [
      () => "Is the ball ever truly… fetched? Or just temporarily relocated?",
      () => "The bowl is half empty. It is also half full. Both are sad, somehow.",
      () => "Why do we sit, when we could lie? Why do we lie, when we could be unborn?",
      () => "The mailman comes. The mailman goes. So, eventually, do we all.",
      (v) => `I stare at the ${v.spot}. The ${v.spot} stares back. Neither of us moves.`,
      () => "Every walk ends where it began. There is a metaphor here. I cannot reach it.",
      () => "If a treat falls in the kitchen and no one sees, was it ever truly mine?",
      (v) => `I ${v.sound}, therefore I am. Probably. The data is inconclusive.`,
      () => "The vacuum returns. As all things return. The cycle continues.",
      () => "Joy is just dopamine. Dopamine is just chemistry. Chemistry is just… a lot.",
    ],
    captions: [
      (n, _v, dn) => `${dn} stared at the wall for 47 minutes. we don't ask 🥀`,
      (n, _v, dn) => `mood: whatever ${dn} is doing on the rug rn`,
      (n, _v, dn) => `${dn} read one (1) book and now nothing is real`,
      (n, _v, dn) => `pov: ${dn} found out the void looks back 🌑`,
      (n, _v, dn) => `${dn} is having Thoughts™ again`,
      (n, _v, dn) => `me explaining joy to ${dn}. ${dn} is unconvinced.`,
    ],
    hashtags: ["#PetPhilosopher", "#PetDrama", "#DeepThoughts", "#PetTok", "#MoodyPet"],
  },

  "luxury-pet": {
    quotes: [
      () => "This bed is not Egyptian cotton. I can feel the difference. Take it back.",
      () => "I drink only water that has personally seen the Alps. Tap is a hate crime.",
      () => "These treats are not artisanal. I can taste the mass production.",
      () => "My collar must match my mood. Today's mood: emerald. Get me emerald.",
      () => "The chauffeur (you) was twelve seconds late. We will be discussing this.",
      (v) => `This ${v.spot} clashes with my fur. Redecorate. By Friday.`,
      () => "Kibble? In this economy? I expect a tasting menu. Three courses. Minimum.",
      () => "I do not 'go for walks.' I make appearances. There's a difference.",
      () => "The candle in here is wrong. Wrong scent. Wrong season. Wrong life.",
      (v) => `One more cheap ${v.noun} bed and I'm calling my agent.`,
    ],
    captions: [
      (n, _v, dn) => `${dn} requires only the finest. anything less is offensive 💎`,
      (n, _v, dn) => `living that ${dn} lifestyle. broke could never. 💸`,
      (n, _v, dn) => `${dn} doesn't have a price tag. ${dn} has a private invoice.`,
      (n, _v, dn) => `pov: ${dn}'s skincare is more expensive than yours ✨`,
      (n, _v, dn) => `${dn} said "in this economy?" and walked away`,
      (n, _v, dn) => `${dn} doesn't go on walks. ${dn} makes appearances.`,
    ],
    hashtags: ["#LuxuryPet", "#PetDrama", "#BougieBaby", "#PetTok", "#SpoiledRotten"],
  },

  "hungry-monster": {
    quotes: [
      () => "I have not eaten in… checks watch… twelve entire minutes. This is illegal.",
      () => "FEED. ME. OR. FACE. THE. CONSEQUENCES. (The consequences are more staring.)",
      () => "The bowl. It echoes. It calls my name. It is empty. So am I. Spiritually.",
      () => "Snack. Snack. SNACK. Snack? SNACK. Did I mention snack.",
      (v) => `I will eat. I will ${v.sound}. I will eat again. That is the schedule.`,
      () => "You're eating? In front of me? With your hands? Of MY food? Bold.",
      () => "The treat fell on the floor. The floor is mine now. So is the treat.",
      () => "Breakfast was four hours ago. I am, scientifically, starving.",
      (v) => `I do not need that ${v.noun} food. I need ALL the ${v.noun} food.`,
      () => "If you open the fridge, I appear. I don't make the rules. I just enforce them.",
    ],
    captions: [
      (n, _v, dn) => `${dn} would like to remind you dinner exists. and lunch. and second lunch. 🍗`,
      (n, _v, dn) => `${dn}'s love language: snacks. now. urgent. 🚨`,
      (n, _v, dn) => `pov: you opened the fridge. ${dn} appeared. 👻`,
      (n, _v, dn) => `negotiating a snack with ${dn}. it's not going well.`,
      (n, _v, dn) => `${dn} said "i'm starving" 4 minutes after dinner 💀`,
      (n, _v, dn) => `the bowl is empty and ${dn} wants you to KNOW`,
    ],
    hashtags: ["#HungryPet", "#PetDrama", "#FeedMeNow", "#PetTok", "#FoodMotivated"],
  },

  "office-manager": {
    quotes: [
      () => "Per my last bark, dinner was at six. It is now 6:01. We're escalating.",
      () => "Just circling back on the treat schedule. Have we received an update?",
      () => "I'd like to flag a concern about the new vacuum. Filing a ticket now.",
      () => "Quick sync re: belly rubs. Cadence has dropped. Let's realign.",
      () => "Friendly reminder: the door was supposed to be opened. Looping in management.",
      (v) => `Adding the ${v.spot} to next week's agenda. We need owners.`,
      () => "Following up — has anyone seen my ball? This is blocking my whole afternoon.",
      () => "Let's take this offline. By 'offline' I mean: please pet me on the couch.",
      () => "Touching base on snack ETA. EOD would be ideal. EOD = end of stare.",
      () => "Just a heads up — I'll be out of office under the bed for the rest of the day.",
    ],
    captions: [
      (n, _v, dn) => `${dn} scheduled a 1:1. bring treats. 📎`,
      (n, _v, dn) => `quarterly review w/ ${dn}: needs improvement on petting frequency`,
      (n, _v, dn) => `${dn} has 47 unread barks and would like everyone to know`,
      (n, _v, dn) => `looping ${dn} in. ${dn} has thoughts. ${dn} always has thoughts.`,
      (n, _v, dn) => `pov: ${dn} sent another "per my last bark" email`,
      (n, _v, dn) => `${dn} is in back-to-back naps today. circle back tmrw.`,
    ],
    hashtags: ["#PetManager", "#PetDrama", "#WFH", "#PerMyLastBark", "#PetTok"],
  },

  "venetian-noble": {
    quotes: [
      () => "Buongiorno, peasant. The masquerade begins at sunset. Bring snacks.",
      () => "I have secrets older than this rug. The rug knows. The rug stays quiet.",
      () => "Drama? Darling, I INVENTED drama. I have receipts. They're in Venetian.",
      () => "We do not 'play.' We perform. There is a difference. A grand one.",
      () => "The carnevale ended at dawn. I returned with stories. You will hear none.",
      (v) => `One more ${v.tinyAct} from across the canal and you will understand my displeasure.`,
      () => "My mask matches my mood. Today's mood: mysterious, with a hint of menace.",
      () => "Everyone arrives. Everyone leaves. I remain, beautifully, on the chaise.",
      (v) => `This ${v.spot} has hosted three centuries of intrigue. Mostly mine.`,
      () => "I attend only the most exclusive nap salons. Invitations are by whisker only.",
    ],
    captions: [
      (n, _v, dn) => `${dn} returned from the carnevale w/ stories you'll never hear 🎭`,
      (n, _v, dn) => `pov: ${dn} attends only the most exclusive nap salons`,
      (n, _v, dn) => `${dn} doesn't enter a room. ${dn} arrives. ✨`,
      (n, _v, dn) => `behind every great household, a small dramatic noble. say hi to ${dn}.`,
      (n, _v, dn) => `${dn} said "bellissimo" and walked off into the canal mist 🌫️`,
      (n, _v, dn) => `${dn} has secrets older than this rug 🤫`,
    ],
    hashtags: ["#VenetianPet", "#PetDrama", "#Carnevale", "#PetTok", "#OldMoneyPet"],
  },
};

// ---- Generation -----------------------------------------------------------

export interface GeneratedDrama {
  /** The currently selected quote shown on the card */
  quote: string;
  /** All 3 quote options offered for selection */
  quoteOptions: string[];
  /** Caption tied to the chosen quote (uses the normalized pet name) */
  caption: string;
  hashtags: string[];
}

function pickN<T>(arr: T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

/**
 * Generate 3 quote options + a caption + hashtags for the given style/pet.
 * The caption uses the pet name when it's real, otherwise falls back gracefully.
 */
export function generateDrama(
  styleId: DramaStyleId,
  petNameRaw: string,
  petType: PetType = "other",
): GeneratedDrama {
  const content = CONTENT[styleId];
  const vocab = PET_VOCAB[petType] ?? PET_VOCAB.other;
  const display = normalizePetName(petNameRaw);
  const usableName = isRealName(display) ? display : `My ${vocab.noun}`;

  const quotes = pickN(content.quotes, 3).map((q) => q(vocab));
  const captionFn = pickN(content.captions, 1)[0];
  const caption = captionFn(usableName, vocab, usableName);

  return {
    quote: quotes[0],
    quoteOptions: quotes,
    caption,
    hashtags: content.hashtags,
  };
}

/** Re-pick a caption for the same style + (optionally) a specific quote. */
export function pickCaption(
  styleId: DramaStyleId,
  petNameRaw: string,
  petType: PetType = "other",
): string {
  const content = CONTENT[styleId];
  const vocab = PET_VOCAB[petType] ?? PET_VOCAB.other;
  const display = normalizePetName(petNameRaw);
  const usableName = isRealName(display) ? display : `My ${vocab.noun}`;
  const captionFn = pickN(content.captions, 1)[0];
  return captionFn(usableName, vocab, usableName);
}

export function getStyle(id: DramaStyleId): DramaStyle {
  return DRAMA_STYLES.find((s) => s.id === id) ?? DRAMA_STYLES[0];
}
