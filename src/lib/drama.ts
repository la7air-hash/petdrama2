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

interface DramaContent {
  quotes: string[];
  captions: string[];
  hashtags: string[][];
}

const CONTENT: Record<DramaStyleId, DramaContent> = {
  "drama-queen": {
    quotes: [
      "I cannot POSSIBLY eat from this bowl. It has been moved 2 inches.",
      "The audacity of this Tuesday.",
      "Nobody understands my pain. Nobody.",
      "I was BORN for the spotlight, not this couch.",
    ],
    captions: [
      "{name} would like to file a formal complaint about literally everything.",
      "Living with {name} is a one-pet stage production and I am the unpaid audience.",
    ],
    hashtags: [["#DramaQueen", "#PetDrama", "#TheAudacity", "#PetsOfInstagram", "#FurBaby"]],
  },
  "mafia-boss": {
    quotes: [
      "You come into MY house... on the day of my nap?",
      "It's not personal. It's just kibble.",
      "Pet me. Or else.",
      "The treats. They were a tribute.",
    ],
    captions: [
      "{name} runs this household. We just live here.",
      "Don't make {name} ask twice. Ever.",
    ],
    hashtags: [["#MafiaPet", "#PetDrama", "#TheBoss", "#FamigliaFirst", "#Goodfluff"]],
  },
  "royal-pet": {
    quotes: [
      "We are not amused.",
      "Bring forth the salmon. NOW.",
      "Kneel. We require belly rubs.",
      "By royal decree: the vacuum is banished.",
    ],
    captions: [
      "His/Her Royal Highness {name}, ruler of the living room.",
      "{name} has graciously accepted your tribute of one (1) tiny treat.",
    ],
    hashtags: [["#RoyalPet", "#PetDrama", "#HRH", "#Majesty", "#PetsOfTikTok"]],
  },
  "tiny-villain": {
    quotes: [
      "The plan? Phase one: knock everything off the table.",
      "I will be sweet. For now.",
      "You hid the treats. I will find them. I always do.",
      "Cute is just a disguise.",
    ],
    captions: [
      "{name} is plotting something. We just don't know what yet.",
      "Behind those eyes? Pure chaos. Documented.",
    ],
    hashtags: [["#TinyVillain", "#PetDrama", "#ChaosAgent", "#PlottingSince", "#Smol"]],
  },
  "jealous-pet": {
    quotes: [
      "Who is THAT in your phone?",
      "You petted the neighbor's dog. I smelled it.",
      "Put. The other pet. Down.",
      "We need to talk about your screen time.",
    ],
    captions: [
      "{name} has been monitoring your activity. Concerns will be raised.",
      "The side-eye {name} gives when I greet another animal is unmatched.",
    ],
    hashtags: [["#JealousPet", "#PetDrama", "#SideEye", "#Mine", "#PetTok"]],
  },
  "depressed-philosopher": {
    quotes: [
      "Is the ball... ever truly... fetched?",
      "The bowl is half empty. Always.",
      "Why do we sit, when we could lie?",
      "The mailman comes. The mailman goes. So do we all.",
    ],
    captions: [
      "{name} has been staring at the wall for 47 minutes. Contemplating.",
      "{name} read one philosophy book and now nothing brings them joy.",
    ],
    hashtags: [["#PetPhilosopher", "#PetDrama", "#DeepThoughts", "#Existential", "#MoodyPet"]],
  },
  "luxury-pet": {
    quotes: [
      "This bed is not Egyptian cotton. Take it back.",
      "I only drink water that has seen the alps.",
      "These treats are not artisanal. I can taste it.",
      "My collar must match my mood. Today: emerald.",
    ],
    captions: [
      "{name} requires only the finest. Anything less is offensive.",
      "Living that {name} lifestyle. We could never.",
    ],
    hashtags: [["#LuxuryPet", "#PetDrama", "#Bougie", "#PetCouture", "#Spoiled"]],
  },
  "hungry-monster": {
    quotes: [
      "I have not eaten in... checks watch... 12 minutes.",
      "FEED ME OR FACE THE CONSEQUENCES.",
      "The bowl. It calls to me.",
      "Snack. Snack. SNACK.",
    ],
    captions: [
      "{name} would like to remind you that dinner exists.",
      "{name}'s love language is treats. Specifically: more treats.",
    ],
    hashtags: [["#HungryPet", "#PetDrama", "#FeedMe", "#SnackAttack", "#FoodMotivated"]],
  },
  "office-manager": {
    quotes: [
      "Per my last bark...",
      "Let's circle back on the treat schedule.",
      "I'd like to flag a concern about the new vacuum.",
      "Just a friendly reminder: dinner is at 6.",
    ],
    captions: [
      "{name} has scheduled a 1:1 to discuss your performance as their human.",
      "Quarterly review with {name}: needs improvement on petting frequency.",
    ],
    hashtags: [["#PetManager", "#PetDrama", "#WorkFromHome", "#PerMyLastBark", "#HRDepartment"]],
  },
  "venetian-noble": {
    quotes: [
      "Buongiorno, peasant.",
      "The masquerade begins at sunset. Bring snacks.",
      "I have secrets older than this rug.",
      "Drama? Darling, I INVENTED it.",
    ],
    captions: [
      "{name} has returned from the carnevale with stories you'll never hear.",
      "{name} attends only the most exclusive nap salons.",
    ],
    hashtags: [["#VenetianPet", "#PetDrama", "#Carnevale", "#Bellissimo", "#OldMoney"]],
  },
};

export interface GeneratedDrama {
  quote: string;
  caption: string;
  hashtags: string[];
}

export function generateDrama(styleId: DramaStyleId, petName: string): GeneratedDrama {
  const content = CONTENT[styleId];
  const name = petName.trim() || "Your pet";
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  return {
    quote: pick(content.quotes),
    caption: pick(content.captions).split("{name}").join(name),
    hashtags: pick(content.hashtags),
  };
}

export function getStyle(id: DramaStyleId): DramaStyle {
  return DRAMA_STYLES.find((s) => s.id === id) ?? DRAMA_STYLES[0];
}
