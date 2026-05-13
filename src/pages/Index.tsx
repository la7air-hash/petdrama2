import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { DRAMA_STYLES } from "@/lib/drama";
import { useI18n } from "@/lib/i18n";
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
    caption: "Sir Whiskerton said we are not amused and meant it.",
    color: "bg-highlight",
    accent: "coral",
    rotate: -3,
  },
  {
    img: mafiaDog,
    name: "Don Biscotti",
    style: "Mafia Boss",
    quote: "It's not personal. It's just kibble.",
    caption: "Don Biscotti doesn't ask twice. Ask the couch.",
    color: "bg-secondary text-secondary-foreground",
    accent: "teal",
    rotate: 4,
  },
  {
    img: dramaHamster,
    name: "Tiny Tito",
    style: "Tiny Villain",
    quote: "The plan? Knock everything off the table.",
    caption: "Tiny Tito woke up and chose chaos. Again.",
    color: "bg-primary text-primary-foreground",
    accent: "coral",
    rotate: -2,
  },
  {
    img: jealousBird,
    name: "Captain Squawk",
    style: "Jealous Pet",
    quote: "Who is THAT in your phone?",
    caption: "Captain Squawk can read your screen and is judging.",
    color: "bg-accent",
    accent: "teal",
    rotate: 3,
  },
];

const STEPS = [
  {
    n: "1",
    color: "bg-highlight",
    title: "home.step1.title",
    body: "home.step1.body",
  },
  {
    n: "2",
    color: "bg-primary text-primary-foreground",
    title: "home.step2.title",
    body: "home.step2.body",
  },
  {
    n: "3",
    color: "bg-secondary text-secondary-foreground",
    title: "home.step3.title",
    body: "home.step3.body",
  },
];

const BENEFITS = [
  "home.benefit.noAccount",
  "home.benefit.square",
  "home.benefit.captions",
];

export default function Home() {
  const { t } = useI18n();

  return (
    <PageShell>
      {/* Marquee strip */}
      <div className="border-b-2 border-foreground bg-foreground py-2 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap text-background text-[11px] font-bold uppercase tracking-[0.25em]">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0 gap-10 px-10">
              <span>🎭 {t("home.marquee.thoughts")}</span>
              <span>· {t("home.marquee.entertainment")}</span>
              <span>· {t("home.marquee.starring")}</span>
              <span>· {t("home.marquee.styles")}</span>
              <span>· {t("home.marquee.free")}</span>
              <span>· {t("home.marquee.noReal")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden text-background border-b-2 border-foreground">
        {/* Cinematic gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(120% 80% at 90% 50%, hsl(320 100% 55% / 0.95) 0%, hsl(320 100% 45% / 0.7) 25%, transparent 60%), radial-gradient(90% 70% at 10% 30%, hsl(250 100% 35% / 0.9) 0%, transparent 60%), linear-gradient(135deg, hsl(240 60% 10%) 0%, hsl(260 70% 18%) 45%, hsl(320 90% 35%) 100%)",
          }}
        />
        {/* Subtle line accents */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.18] mix-blend-screen"
          aria-hidden
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, hsl(0 0% 100% / 0.6) 0 1px, transparent 1px 90px), repeating-linear-gradient(115deg, hsl(0 0% 100% / 0.35) 0 1px, transparent 1px 30px)",
            backgroundSize: "auto, auto",
            maskImage:
              "linear-gradient(115deg, transparent 0%, black 20%, black 80%, transparent 100%)",
          }}
        />
        {/* Dotted rounded frame accents */}
        <div className="pointer-events-none absolute inset-6 md:inset-10 rounded-[3rem] border border-dashed border-background/20" aria-hidden />
        <div className="pointer-events-none absolute inset-10 md:inset-16 rounded-[2.5rem] border border-dashed border-background/10" aria-hidden />
        {/* Soft dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(hsl(0 0% 100% / 0.25) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="container relative grid max-w-full gap-12 overflow-hidden py-12 md:py-20 lg:grid-cols-12 lg:gap-8 items-center">
          <div className="z-10 min-w-0 max-w-[calc(100vw-3rem)] lg:col-span-6 lg:max-w-none">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-accent px-4 py-1.5 sticker-shadow-sm -rotate-2 mb-6">
              <span className="text-base">🎭</span>
              <span className="text-xs font-bold uppercase tracking-widest">{t("home.eyebrow")}</span>
            </div>
            <h1 className="max-w-[22rem] font-display text-4xl sm:max-w-xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.02] tracking-normal text-balance">
              {t("home.title.before")} <span className="text-primary">{t("home.title.highlight")}</span> {t("home.title.after")}
            </h1>
            <p className="mt-6 max-w-[22rem] sm:max-w-xl text-lg md:text-xl font-medium text-background/85 leading-relaxed text-pretty [overflow-wrap:anywhere]">
              {t("home.subtitle")}
            </p>

            <div className="mt-8 flex max-w-[22rem] flex-col gap-4 sm:max-w-none sm:flex-row">
              <Link to="/create" className="block w-full sm:w-auto">
                <StickerButton variant="primary" size="lg" className="w-full sm:w-auto">
                  {t("home.cta")} →
                </StickerButton>
              </Link>
              <Link to="/examples" className="block w-full sm:w-auto">
                <StickerButton variant="ghost" size="lg" className="w-full sm:w-auto">
                  {t("home.examples")}
                </StickerButton>
              </Link>
            </div>

            <div className="mt-6 grid max-w-[22rem] gap-2 sm:max-w-2xl sm:grid-cols-3">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-2xl border-2 border-background/25 bg-background/10 px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-background backdrop-blur-sm"
                >
                  {t(benefit)}
                </div>
              ))}
            </div>

            <div className="mt-8 flex max-w-[22rem] items-center gap-4 sm:max-w-xl">
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
              <p className="text-xs sm:text-sm font-bold uppercase tracking-tight leading-tight text-background">
                {t("home.output")}
                <br />
                <span className="font-medium text-background/70 normal-case tracking-normal">
                  {t("home.outputSub")}
                </span>
              </p>
            </div>
          </div>

          {/* Sticker collage */}
          <div className="relative min-w-0 max-w-[calc(100vw-3rem)] h-[480px] sm:h-[560px] lg:col-span-6 lg:h-[620px] lg:max-w-none">
            <div className="absolute inset-4 rounded-[3rem] border-2 border-dashed border-foreground/25 bg-card/40" aria-hidden />

            <DramaPreviewCard
              example={EXAMPLES[0]}
              className="absolute right-0 top-0 w-[66%] sm:w-80 animate-pop-in"
              compact
            />

            <DramaPreviewCard
              example={EXAMPLES[1]}
              className="absolute left-0 top-28 w-[62%] sm:w-72 animate-pop-in"
              compact
            />

            <DramaPreviewCard
              example={EXAMPLES[3]}
              className="absolute bottom-0 right-8 hidden w-[72%] sm:block sm:w-88 animate-pop-in"
              compact
            />

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
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">{t("home.how")}</p>
              <h2 className="mt-2 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
                {t("home.stepsTitle")}
              </h2>
            </div>
            <Link to="/create" className="hidden md:inline-block">
              <StickerButton variant="dark">{t("home.startNow")} →</StickerButton>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <StickerCard key={s.n} className="p-6 bg-background">
                <div className={`size-14 rounded-2xl border-2 border-foreground flex items-center justify-center font-display text-2xl font-extrabold ${s.color}`}>
                  {s.n}
                </div>
                <h3 className="mt-5 font-display text-2xl font-extrabold">{t(s.title)}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{t(s.body)}</p>
              </StickerCard>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section className="container py-20">
        <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">{t("home.stars")}</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              {t("home.featured")}
            </h2>
          </div>
          <Link to="/gallery" className="text-sm font-bold uppercase tracking-widest underline decoration-4 decoration-primary underline-offset-4">
            {t("home.gallery")} →
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {EXAMPLES.map((ex, i) => (
            <DramaPreviewCard key={i} example={ex} />
          ))}
        </div>
      </section>

      {/* STYLES PREVIEW */}
      <section className="border-y-2 border-foreground bg-foreground text-background">
        <div className="container py-20">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-highlight">{t("home.stylesEyebrow")}</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl font-extrabold tracking-tight max-w-3xl">
            {t("home.stylesTitle")}
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
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground text-center">{t("home.pricingEyebrow")}</p>
        <h2 className="mt-2 text-center font-display text-4xl md:text-5xl font-extrabold tracking-tight">
          {t("home.pricingTitle")}
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <StickerCard className="p-8 bg-background">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("home.freePlan")}</p>
            <p className="mt-2 font-display text-5xl font-extrabold">$0</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ 10 creations / month</li>
              <li>✓ 3 Drama Remix / month</li>
              <li>✓ Basic drama styles</li>
              <li>✓ Small "Made with PetDrama" watermark</li>
            </ul>
            <Link to="/create" className="mt-8 block">
              <StickerButton variant="ghost" className="w-full">{t("home.startFree")}</StickerButton>
            </Link>
          </StickerCard>
          <StickerCard className="p-8 bg-primary text-primary-foreground" shadow="lg">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest">{t("home.proPlan")}</p>
              <span className="rounded-full border-2 border-foreground bg-highlight text-highlight-foreground px-2 py-0.5 text-[10px] font-bold uppercase">
                {t("home.mostPopular")}
              </span>
            </div>
            <p className="mt-2 font-display text-5xl font-extrabold">$9.99<span className="text-2xl font-bold">/mo</span></p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ 50 creations / month</li>
              <li>✓ 20 Drama Remix / month</li>
              <li>✓ All drama styles unlocked</li>
              <li>✓ HD downloads, no watermark</li>
            </ul>
            <Link to="/pricing" className="mt-8 block">
              <StickerButton variant="dark" className="w-full">{t("home.seePlans")}</StickerButton>
            </Link>
          </StickerCard>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container pb-24">
        <StickerCard color="highlight" className="p-10 md:p-16 text-center" shadow="lg">
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight text-balance">
            {t("home.finalTitle")}
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base md:text-lg font-medium">
            {t("home.finalBody")}
          </p>
          <Link to="/create" className="inline-block mt-8">
            <StickerButton variant="primary" size="lg">{t("home.cta")} →</StickerButton>
          </Link>
        </StickerCard>
      </section>
    </PageShell>
  );
}

function DramaPreviewCard({
  example,
  className,
  compact = false,
}: {
  example: (typeof EXAMPLES)[number];
  className?: string;
  compact?: boolean;
}) {
  const accentClass =
    example.accent === "teal" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground";
  const underlineClass = example.accent === "teal" ? "bg-primary" : "bg-secondary";

  return (
    <article
      className={[
        "relative rounded-[1.5rem] border-2 border-foreground bg-[linear-gradient(135deg,#fbf4e4,#ffe9a8_55%,#cfefec)] p-3 text-foreground shadow-[8px_8px_0_rgba(35,57,63,0.12)] transition-transform hover:-translate-y-1",
        compact ? "scale-[0.92]" : "",
        className ?? "",
      ].join(" ")}
      style={{ transform: `rotate(${example.rotate}deg)` }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] opacity-60 [background-image:radial-gradient(rgba(35,57,63,0.10)_1px,transparent_1px)] [background-size:13px_13px]" />
      <div className="pointer-events-none absolute left-4 top-5 text-primary/25">🐾</div>
      <div className="pointer-events-none absolute right-5 top-6 text-secondary/30">✦</div>
      <div className="pointer-events-none absolute bottom-5 right-9 text-primary/30">✦</div>
      <div className="pointer-events-none absolute -right-2 top-8 size-12 rounded-full bg-secondary shadow-[0_8px_18px_rgba(35,57,63,0.18)]">
        <span className="absolute left-2 top-2 size-3 rounded-full bg-white/50" />
      </div>

      <div className="relative mx-auto mt-8 w-[78%] rounded-3xl border border-foreground/10 bg-white p-3 shadow-[0_12px_28px_rgba(35,57,63,0.16)] -rotate-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-foreground/15 bg-foreground/5">
          <img
            src={example.img}
            alt={`${example.name} - ${example.style}`}
            className="size-full object-cover"
            loading="lazy"
            width={520}
            height={390}
          />
          <div className="absolute inset-0 glossy pointer-events-none" />
        </div>
        <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-background px-4 py-2 text-[10px] font-extrabold uppercase shadow-lg ${accentClass}`}>
          {example.name.toUpperCase()} — {example.style.toUpperCase()}
        </div>
      </div>

      <div className={compact ? "px-2 pb-4 pt-7" : "px-3 pb-5 pt-8"}>
        <p className={compact ? "text-center font-display text-sm font-extrabold leading-tight" : "text-center font-display text-lg font-extrabold leading-tight"}>
          “{example.quote}”
        </p>
        <div className={`mx-auto mt-2 h-1.5 w-16 rounded-full ${underlineClass}`} />
        {!compact && (
          <div className="mx-auto mt-5 max-w-[90%] rounded-2xl border border-foreground/10 bg-white px-4 py-3 text-center text-sm font-semibold text-foreground/75 shadow-[0_6px_14px_rgba(35,57,63,0.12)]">
            {example.caption}
          </div>
        )}
      </div>

      <div className="relative flex items-center justify-between px-2 pb-1 text-[10px] font-extrabold">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-primary" />
          PetDrama
        </span>
        {!compact && <span className="rounded-full border-2 border-foreground bg-primary px-3 py-1 text-primary-foreground">WEBP</span>}
      </div>
    </article>
  );
}
