import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { DramaPreviewCard, type DramaPreviewExample } from "@/components/DramaPreviewCard";
import { DRAMA_STYLES } from "@/lib/drama";
import { useI18n } from "@/lib/i18n";
import royalCat from "@/assets/example-royal-cat.jpg";
import mafiaDog from "@/assets/example-mafia-dog.jpg";
import dramaHamster from "@/assets/example-drama-hamster.jpg";
import jealousBird from "@/assets/example-jealous-bird.jpg";

const EXAMPLES: DramaPreviewExample[] = [
  {
    img: royalCat,
    name: "Sir Whiskerton",
    style: "Royal Pet",
    quote: "Bring forth the salmon. NOW.",
    caption: "Sir Whiskerton said we are not amused and meant it.",
    accent: "coral",
    rotate: -3,
  },
  {
    img: mafiaDog,
    name: "Don Biscotti",
    style: "Mafia Boss",
    quote: "It's not personal. It's just kibble.",
    caption: "Don Biscotti doesn't ask twice. Ask the couch.",
    accent: "teal",
    rotate: 4,
  },
  {
    img: dramaHamster,
    name: "Tiny Tito",
    style: "Tiny Villain",
    quote: "The plan? Knock everything off the table.",
    caption: "Tiny Tito woke up and chose chaos. Again.",
    accent: "coral",
    rotate: -2,
  },
  {
    img: jealousBird,
    name: "Captain Squawk",
    style: "Jealous Pet",
    quote: "Who is THAT in your phone?",
    caption: "Captain Squawk can read your screen and is judging.",
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

const INTRO_VIDEO_SRC = "/PetDrama_logo_animated_02.mp4";
const INTRO_SEEN_KEY = "petdrama:intro-seen";

export default function Home() {
  const { t } = useI18n();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("intro") === "0") return;
      if (sessionStorage.getItem(INTRO_SEEN_KEY)) return;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      setShowIntro(true);
    } catch {
      setShowIntro(false);
    }
  }, []);

  const closeIntro = () => {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* noop */
    }
    setShowIntro(false);
  };

  return (
    <PageShell>
      {showIntro && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#fff7e9]">
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={closeIntro}
            onError={closeIntro}
          >
            <source src={INTRO_VIDEO_SRC} type="video/mp4" />
          </video>
          <button
            type="button"
            onClick={closeIntro}
            className="absolute right-5 top-5 rounded-full border-2 border-foreground bg-background px-4 py-2 text-xs font-extrabold uppercase tracking-widest sticker-shadow-sm transition-transform hover:-translate-y-0.5"
          >
            {t("intro.skip")}
          </button>
        </div>
      )}

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
      <section className="relative isolate overflow-hidden border-b-2 border-foreground bg-[#fff7e9] text-foreground">
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          aria-hidden
          style={{
            background:
              "linear-gradient(115deg, #fff7e9 0%, #fff1c9 38%, #d8f6f2 70%, #ffe2d7 100%)",
          }}
        />
        <div
          className="absolute inset-0 -z-10 pointer-events-none opacity-60"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(120deg, transparent 0 42%, rgba(55,197,191,0.28) 42% 48%, transparent 48% 100%), linear-gradient(145deg, transparent 0 58%, rgba(241,112,94,0.20) 58% 64%, transparent 64% 100%)",
          }}
        />
        <div
          className="absolute inset-0 -z-10 pointer-events-none opacity-35"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(rgba(35,57,63,0.15) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="pointer-events-none absolute inset-4 -z-10 rounded-[2rem] border border-dashed border-foreground/15 md:inset-8 md:rounded-[3rem]" aria-hidden />

        <div className="container relative max-w-full min-h-[calc(100svh-6rem)] overflow-hidden py-12 md:py-20">
          <div className="relative z-10 max-w-[21rem] sm:max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-background/85 px-4 py-1.5 sticker-shadow-sm backdrop-blur">
              <span className="size-2.5 rounded-full bg-primary" />
              <span className="size-2.5 rounded-full bg-secondary" />
              <span className="size-2.5 rounded-full bg-highlight" />
              <span className="text-xs font-bold uppercase tracking-widest">{t("home.eyebrow")}</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold leading-[1.04] tracking-normal [overflow-wrap:anywhere] sm:text-7xl sm:text-balance lg:text-8xl">
              {t("home.title.before")} <span className="text-primary drop-shadow-[0_4px_0_rgba(35,57,63,0.12)]">{t("home.title.highlight")}</span> {t("home.title.after")}
            </h1>
            <p className="mt-6 max-w-[21rem] text-base font-semibold leading-relaxed text-foreground/75 text-pretty [overflow-wrap:anywhere] sm:max-w-2xl md:text-xl">
              {t("home.subtitle")}
            </p>

            <div className="mt-8 flex max-w-[21rem] flex-col gap-4 sm:max-w-none sm:flex-row">
              <Link to="/create" className="block w-full sm:w-auto">
                <StickerButton variant="primary" size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground">
                  {t("home.cta")} →
                </StickerButton>
              </Link>
              <Link to="/examples" className="block w-full sm:w-auto">
                <StickerButton variant="ghost" size="lg" className="w-full sm:w-auto bg-background/90">
                  {t("home.examples")}
                </StickerButton>
              </Link>
            </div>

            <div className="mt-7 grid max-w-[21rem] gap-2 sm:max-w-none sm:grid-cols-3">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-2xl border-2 border-foreground/15 bg-background/75 px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-foreground shadow-[0_10px_25px_rgba(35,57,63,0.08)] backdrop-blur"
                >
                  {t(benefit)}
                </div>
              ))}
            </div>

            <div className="mt-8 flex max-w-[21rem] items-center gap-4">
              <div className="flex -space-x-3">
                {EXAMPLES.slice(0, 4).map((ex, i) => (
                  <div
                    key={i}
                    className="size-12 overflow-hidden rounded-full border-2 border-foreground bg-card ring-4 ring-background"
                  >
                    <img src={ex.img} alt="" className="size-full object-cover" loading="lazy" width={44} height={44} />
                  </div>
                ))}
              </div>
              <p className="min-w-0 max-w-xs text-xs font-bold uppercase leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-sm">
                {t("home.output")}
                <br />
                <span className="font-medium normal-case tracking-normal text-foreground/60">
                  {t("home.outputSub")}
                </span>
              </p>
            </div>
          </div>

          <div className="pointer-events-none relative z-0 mt-12 h-[470px] md:mt-0 lg:absolute lg:inset-y-10 lg:right-0 lg:w-[54%]">
            <div className="absolute right-4 top-6 hidden rounded-full border-2 border-foreground bg-highlight px-5 py-2 text-xs font-extrabold uppercase tracking-widest shadow-[6px_6px_0_rgba(35,57,63,0.12)] md:block">
              PetDrama Studio
            </div>
            <DramaPreviewCard example={EXAMPLES[1]} className="absolute right-2 top-12 w-[76%] max-w-[390px] animate-pop-in md:right-12" compact />
            <DramaPreviewCard example={EXAMPLES[0]} className="absolute left-1 top-36 w-[72%] max-w-[360px] animate-pop-in md:left-8" compact />
            <DramaPreviewCard example={EXAMPLES[3]} className="absolute bottom-4 right-8 hidden w-[70%] max-w-[380px] animate-pop-in md:block" compact />
            <div className="absolute bottom-6 left-8 flex items-center gap-2 rounded-[1.5rem] border-2 border-foreground bg-secondary px-5 py-3 shadow-[8px_8px_0_rgba(35,57,63,0.12)]">
              <span className="size-3 rounded-full bg-primary" />
              <span className="size-3 rounded-full bg-highlight" />
              <span className="size-3 rounded-full bg-background" />
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

        <div className="mt-10 grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
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
          <StickerCard className="p-8 bg-secondary text-secondary-foreground">
            <p className="text-xs font-bold uppercase tracking-widest">Standard</p>
            <p className="mt-2 font-display text-5xl font-extrabold">$4.99<span className="text-2xl font-bold">/mo</span></p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ 25 creations / month</li>
              <li>✓ 10 Drama Remix / month</li>
              <li>✓ All drama styles unlocked</li>
              <li>✓ HD downloads, no watermark</li>
            </ul>
            <Link to="/pricing" className="mt-8 block">
              <StickerButton variant="dark" className="w-full">{t("home.seePlans")}</StickerButton>
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
