import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import royalCat from "@/assets/example-royal-cat.jpg";
import mafiaDog from "@/assets/example-mafia-dog.jpg";
import dramaHamster from "@/assets/example-drama-hamster.jpg";
import jealousBird from "@/assets/example-jealous-bird.jpg";

interface ExampleItem {
  img: string;
  petType: string;
  name: string;
  style: string;
  styleEmoji: string;
  badgeColor: string;
  rotate: number;
  quote: string;
  caption: string;
  hashtags: string[];
  remixImg?: string;
  remixNote?: string;
}

const EXAMPLES: ExampleItem[] = [
  {
    img: royalCat,
    petType: "Cat",
    name: "Sir Whiskerton",
    style: "Royal Pet",
    styleEmoji: "♛",
    badgeColor: "bg-highlight",
    rotate: -2,
    quote: "Bring forth the salmon. NOW.",
    caption: "bow down. Sir Whiskerton has entered the chat 👑",
    hashtags: ["#RoyalPet", "#PetDrama", "#HRH", "#YourMajesty"],
    remixImg: jealousBird,
    remixNote: "Remix: Jealous Pet alt take",
  },
  {
    img: mafiaDog,
    petType: "Dog",
    name: "Don Biscotti",
    style: "Mafia Boss",
    styleEmoji: "🕴️",
    badgeColor: "bg-secondary text-secondary-foreground",
    rotate: 3,
    quote: "It's not personal. It's just kibble.",
    caption: "Don Biscotti runs this house. I just pay rent 🕴️",
    hashtags: ["#MafiaPet", "#PetDrama", "#TheBoss", "#GoodFluff"],
    remixImg: royalCat,
    remixNote: "Remix: Royal Pet alt take",
  },
  {
    img: dramaHamster,
    petType: "Hamster",
    name: "Tiny Tito",
    style: "Tiny Villain",
    styleEmoji: "😈",
    badgeColor: "bg-primary text-primary-foreground",
    rotate: -3,
    quote: "The plan? Knock everything off the table.",
    caption: "Tiny Tito is plotting. we just don't know what 😈",
    hashtags: ["#TinyVillain", "#PetDrama", "#ChaosAgent", "#SmolButFeral"],
  },
  {
    img: jealousBird,
    petType: "Bird",
    name: "Captain Squawk",
    style: "Jealous Pet",
    styleEmoji: "👀",
    badgeColor: "bg-accent",
    rotate: 2,
    quote: "Who is THAT in your phone?",
    caption: "Captain Squawk saw the other bird. Captain Squawk has notes 👀",
    hashtags: ["#JealousPet", "#PetDrama", "#SideEye", "#MineMineMine"],
  },
];

export default function Examples() {
  return (
    <PageShell>
      <section className="container py-12 md:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Examples</p>
          <h1 className="mt-2 font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            See what <span className="text-primary">PetDrama</span> can do.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A few sample PetDrama cards across pet types and drama styles. Each one comes with a quote, caption,
            hashtags — and an optional remix in a different style.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/create">
              <StickerButton variant="primary">Create your own PetDrama →</StickerButton>
            </Link>
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          {EXAMPLES.map((ex, i) => (
            <StickerCard key={i} className="p-4 bg-background" rotate={ex.rotate}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-foreground bg-foreground">
                  <img src={ex.img} alt={`${ex.name} - ${ex.style}`} className="size-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 glossy pointer-events-none" />
                  <span className={`absolute top-3 left-3 rounded-lg border-2 border-foreground px-2 py-1 text-[10px] font-bold uppercase ${ex.badgeColor}`}>
                    {ex.styleEmoji} {ex.style}
                  </span>
                  <span className="absolute bottom-3 left-3 rounded-lg border-2 border-foreground bg-background px-2 py-1 text-[10px] font-bold uppercase">
                    Original
                  </span>
                </div>
                {ex.remixImg ? (
                  <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-foreground bg-foreground">
                    <img src={ex.remixImg} alt={`${ex.name} remix`} className="size-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 glossy pointer-events-none" />
                    <span className="absolute top-3 left-3 rounded-lg border-2 border-foreground bg-primary text-primary-foreground px-2 py-1 text-[10px] font-bold uppercase">
                      Remix
                    </span>
                    {ex.remixNote && (
                      <span className="absolute bottom-3 left-3 rounded-lg border-2 border-foreground bg-background px-2 py-1 text-[10px] font-bold uppercase">
                        {ex.remixNote}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-foreground/40 bg-card flex items-center justify-center p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Add a Remix in a different style — one click on the result page
                    </p>
                  </div>
                )}
              </div>

              <div className="px-2 pt-4 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {ex.petType} · {ex.name}
                </p>
                <p className="mt-1 font-display font-extrabold text-xl leading-tight">"{ex.quote}"</p>
                <p className="mt-3 text-sm text-foreground/80">{ex.caption}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ex.hashtags.map((h) => (
                    <span
                      key={h}
                      className="rounded-full border-2 border-foreground bg-card px-2 py-0.5 text-[10px] font-bold"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </StickerCard>
          ))}
        </div>
      </section>

      <section className="container pb-24">
        <StickerCard color="highlight" className="p-10 md:p-14 text-center" shadow="lg">
          <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
            Ready to make your own?
          </h2>
          <p className="mt-3 max-w-xl mx-auto font-medium">
            Upload a photo, pick a drama style, and get a shareable PetDrama card in seconds.
          </p>
          <Link to="/create" className="inline-block mt-6">
            <StickerButton variant="primary" size="lg">Start creating →</StickerButton>
          </Link>
        </StickerCard>
      </section>
    </PageShell>
  );
}
