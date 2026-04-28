import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { DRAMA_STYLES } from "@/lib/drama";
import royalCat from "@/assets/example-royal-cat.jpg";
import mafiaDog from "@/assets/example-mafia-dog.jpg";
import dramaHamster from "@/assets/example-drama-hamster.jpg";
import jealousBird from "@/assets/example-jealous-bird.jpg";

const EXAMPLES = [
  {
    img: royalCat,
    name: "Sir Whiskerton",
    style: "Royal Pet",
    quote: "Bring forth the salmon. NOW.",
    color: "bg-highlight",
    rotate: -3,
  },
  {
    img: mafiaDog,
    name: "Don Biscotti",
    style: "Mafia Boss",
    quote: "It's not personal. It's just kibble.",
    color: "bg-secondary text-secondary-foreground",
    rotate: 4,
  },
  {
    img: dramaHamster,
    name: "Tiny Tito",
    style: "Tiny Villain",
    quote: "The plan? Knock everything off the table.",
    color: "bg-primary text-primary-foreground",
    rotate: -2,
  },
  {
    img: jealousBird,
    name: "Captain Squawk",
    style: "Jealous Pet",
    quote: "Who is THAT in your phone?",
    color: "bg-accent",
    rotate: 3,
  },
];

const STEPS = [
  {
    n: "1",
    color: "bg-highlight",
    title: "Upload a pet photo",
    body: "Drag in any photo. Front-facing works best for maximum drama.",
  },
  {
    n: "2",
    color: "bg-primary text-primary-foreground",
    title: "Pick a drama style",
    body: "Royal, Mafia, Tiny Villain, Office Manager — choose their character.",
  },
  {
    n: "3",
    color: "bg-secondary text-secondary-foreground",
    title: "Share the chaos",
    body: "Get a meme, caption & hashtags. Download a square PNG ready for the feed.",
  },
];

export default function Home() {
  return (
    <PageShell>
      {/* Marquee strip */}
      <div className="border-b-2 border-foreground bg-foreground py-2 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap text-background text-[11px] font-bold uppercase tracking-[0.25em]">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0 gap-10 px-10">
              <span>🎭 Imaginary pet thoughts</span>
              <span>· For entertainment only</span>
              <span>· Now starring: your dramatic floof</span>
              <span>· 10 dramatic styles</span>
              <span>· Free to try</span>
              <span>· No real animals were translated</span>
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" aria-hidden />
        <div className="container relative grid gap-12 py-12 md:py-20 lg:grid-cols-12 lg:gap-8 items-center">
          <div className="lg:col-span-6 z-10">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-accent px-4 py-1.5 sticker-shadow-sm -rotate-2 mb-6">
              <span className="text-base">🎭</span>
              <span className="text-xs font-bold uppercase tracking-widest">Dramatic pet captions</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[0.9] tracking-tight text-balance">
              Your pet.
              <br />
              Their <span className="text-primary">drama.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg md:text-xl font-medium text-muted-foreground leading-relaxed text-pretty">
              Upload a photo and turn your pet into a funny dramatic character in seconds. Get a meme, a caption, hashtags — ready to share.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/create">
                <StickerButton variant="primary" size="lg" className="w-full sm:w-auto">
                  Create Pet Drama →
                </StickerButton>
              </Link>
              <Link to="/gallery">
                <StickerButton variant="ghost" size="lg" className="w-full sm:w-auto">
                  See examples
                </StickerButton>
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                {EXAMPLES.slice(0, 4).map((ex, i) => (
                  <div
                    key={i}
                    className="size-11 rounded-full border-2 border-foreground bg-card overflow-hidden ring-4 ring-background"
                  >
                    <img src={ex.img} alt="" className="size-full object-cover" loading="lazy" width={44} height={44} />
                  </div>
                ))}
              </div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-tight leading-tight">
                12,842 pets exposed
                <br />
                <span className="font-medium text-muted-foreground normal-case tracking-normal">
                  this week alone — entertainment only ✨
                </span>
              </p>
            </div>
          </div>

          {/* Sticker collage */}
          <div className="relative h-[480px] sm:h-[560px] lg:col-span-6 lg:h-[620px]">
            <div className="absolute inset-4 rounded-[3rem] border-2 border-dashed border-foreground/25 bg-card/40" aria-hidden />

            <StickerCard
              color="highlight"
              rotate={6}
              className="absolute right-2 top-0 w-[60%] sm:w-72 p-3 animate-pop-in"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-foreground bg-foreground">
                <img src={royalCat} alt="Royal cat example" className="size-full object-cover" loading="lazy" width={400} height={400} />
                <div className="absolute inset-0 glossy pointer-events-none" />
                <span className="absolute bottom-3 left-3 rounded-lg border-2 border-foreground bg-background px-2 py-1 text-[10px] font-bold uppercase">
                  ♛ Royal Pet
                </span>
              </div>
              <p className="mt-2 px-1 font-display font-bold text-sm leading-tight">"Bring forth the salmon. NOW."</p>
            </StickerCard>

            <StickerCard
              color="card"
              rotate={-10}
              className="absolute left-0 top-24 w-[55%] sm:w-64 p-3 animate-pop-in"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border-2 border-foreground bg-foreground">
                <img src={mafiaDog} alt="Mafia dog example" className="size-full object-cover" loading="lazy" width={400} height={500} />
                <div className="absolute inset-0 glossy pointer-events-none" />
                <span className="absolute bottom-3 left-3 rounded-lg border-2 border-foreground bg-primary text-primary-foreground px-2 py-1 text-[10px] font-bold uppercase">
                  🕴️ Mafia Boss
                </span>
              </div>
              <p className="mt-2 px-1 font-display font-bold text-sm leading-tight">"Family. Loyalty. Treats."</p>
            </StickerCard>

            <StickerCard
              color="secondary"
              rotate={-3}
              className="absolute bottom-0 right-12 w-[70%] sm:w-80 p-3 animate-pop-in hidden sm:block"
            >
              <div className="relative aspect-video overflow-hidden rounded-2xl border-2 border-foreground bg-foreground">
                <img src={jealousBird} alt="Jealous bird example" className="size-full object-cover" loading="lazy" width={600} height={400} />
                <div className="absolute inset-0 glossy pointer-events-none" />
                <span className="absolute bottom-3 left-3 rounded-lg border-2 border-foreground bg-highlight text-highlight-foreground px-2 py-1 text-[10px] font-bold uppercase">
                  👀 Jealous
                </span>
              </div>
            </StickerCard>

            {/* peelable corner */}
            <div className="absolute -bottom-2 -right-2 size-20 rounded-tl-[2.5rem] border-2 border-foreground bg-highlight sticker-shadow flex items-center justify-center">
              <span className="font-display text-3xl font-extrabold">✦</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y-2 border-foreground bg-card">
        <div className="container py-16">
          <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">How it works</p>
              <h2 className="mt-2 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
                Three steps to chaos.
              </h2>
            </div>
            <Link to="/create" className="hidden md:inline-block">
              <StickerButton variant="dark">Start now →</StickerButton>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <StickerCard key={s.n} className="p-6 bg-background">
                <div className={`size-14 rounded-2xl border-2 border-foreground flex items-center justify-center font-display text-2xl font-extrabold ${s.color}`}>
                  {s.n}
                </div>
                <h3 className="mt-5 font-display text-2xl font-extrabold">{s.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{s.body}</p>
              </StickerCard>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section className="container py-20">
        <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Today's stars</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              Featured pet drama.
            </h2>
          </div>
          <Link to="/gallery" className="text-sm font-bold uppercase tracking-widest underline decoration-4 decoration-primary underline-offset-4">
            See full gallery →
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {EXAMPLES.map((ex, i) => (
            <StickerCard key={i} className="p-3 bg-background hover:-translate-y-1" rotate={i % 2 === 0 ? -1 : 1}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-2 border-foreground">
                <img src={ex.img} alt={`${ex.name} - ${ex.style}`} className="size-full object-cover" loading="lazy" width={500} height={625} />
                <div className="absolute inset-0 glossy pointer-events-none" />
                <span className={`absolute top-3 left-3 rounded-lg border-2 border-foreground px-2 py-1 text-[10px] font-bold uppercase ${ex.color}`}>
                  {ex.style}
                </span>
              </div>
              <div className="px-2 pt-3 pb-1">
                <p className="font-display font-extrabold text-lg leading-tight">"{ex.quote}"</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">— {ex.name}</p>
              </div>
            </StickerCard>
          ))}
        </div>
      </section>

      {/* STYLES PREVIEW */}
      <section className="border-y-2 border-foreground bg-foreground text-background">
        <div className="container py-20">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-highlight">10 dramatic styles</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl font-extrabold tracking-tight max-w-3xl">
            Pick your pet's <span className="text-primary">main character</span> energy.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {DRAMA_STYLES.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border-2 border-background/30 p-4 transition-colors hover:border-highlight hover:bg-background/5"
              >
                <div className="text-3xl">{s.emoji}</div>
                <p className="mt-2 font-display font-extrabold text-lg leading-tight">{s.name}</p>
                <p className="mt-1 text-xs text-background/60">{s.tagline}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="container py-20">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground text-center">Pricing</p>
        <h2 className="mt-2 text-center font-display text-4xl md:text-5xl font-extrabold tracking-tight">
          Free forever. Pro when you're ready.
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <StickerCard className="p-8 bg-background">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Free</p>
            <p className="mt-2 font-display text-5xl font-extrabold">$0</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ 3 creations per day</li>
              <li>✓ Basic drama styles</li>
              <li>✓ Small "Made with PetDrama" watermark</li>
            </ul>
            <Link to="/create" className="mt-8 block">
              <StickerButton variant="ghost" className="w-full">Start free</StickerButton>
            </Link>
          </StickerCard>
          <StickerCard className="p-8 bg-primary text-primary-foreground" shadow="lg">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest">Pro</p>
              <span className="rounded-full border-2 border-foreground bg-highlight text-highlight-foreground px-2 py-0.5 text-[10px] font-bold uppercase">
                Most popular
              </span>
            </div>
            <p className="mt-2 font-display text-5xl font-extrabold">$5<span className="text-2xl font-bold">/mo</span></p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ Unlimited creations</li>
              <li>✓ All drama styles unlocked</li>
              <li>✓ HD downloads, no watermark</li>
              <li>✓ Personal gallery</li>
            </ul>
            <Link to="/pricing" className="mt-8 block">
              <StickerButton variant="dark" className="w-full">Go Pro</StickerButton>
            </Link>
          </StickerCard>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container pb-24">
        <StickerCard color="highlight" className="p-10 md:p-16 text-center" shadow="lg">
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight text-balance">
            Ready to expose your pet?
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base md:text-lg font-medium">
            One photo. One style. One unforgettable post. (For entertainment only — we don't actually translate pets.)
          </p>
          <Link to="/create" className="inline-block mt-8">
            <StickerButton variant="primary" size="lg">Create Pet Drama →</StickerButton>
          </Link>
        </StickerCard>
      </section>
    </PageShell>
  );
}
