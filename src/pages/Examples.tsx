import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { DramaPreviewCard, type DramaPreviewExample } from "@/components/DramaPreviewCard";
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
    rotate: -2,
  },
  {
    img: mafiaDog,
    name: "Don Biscotti",
    style: "Mafia Boss",
    quote: "It's not personal. It's just kibble.",
    caption: "Don Biscotti doesn't ask twice. Ask the couch.",
    accent: "teal",
    rotate: 2,
  },
  {
    img: dramaHamster,
    name: "Tiny Tito",
    style: "Tiny Villain",
    quote: "The plan? Knock everything off the table.",
    caption: "Tiny Tito woke up and chose chaos. Again.",
    accent: "coral",
    rotate: -1,
  },
  {
    img: jealousBird,
    name: "Captain Squawk",
    style: "Jealous Pet",
    quote: "Who is THAT in your phone?",
    caption: "Captain Squawk can read your screen and is judging.",
    accent: "teal",
    rotate: 2,
  },
];

export default function Examples() {
  const { t } = useI18n();

  return (
    <PageShell>
      <section className="container py-12 md:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">{t("examples.eyebrow")}</p>
          <h1 className="mt-2 font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            {t("examples.titleBefore")} <span className="text-primary">PetDrama</span> {t("examples.titleAfter")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("examples.subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/create">
              <StickerButton variant="primary">{t("home.cta")} →</StickerButton>
            </Link>
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          {EXAMPLES.map((example) => (
            <DramaPreviewCard key={`${example.name}-${example.style}`} example={example} />
          ))}
        </div>
      </section>

      <section className="container pb-24">
        <StickerCard color="highlight" className="p-10 md:p-14 text-center" shadow="lg">
          <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
            {t("examples.readyTitle")}
          </h2>
          <p className="mt-3 max-w-xl mx-auto font-medium">
            {t("examples.readyBody")}
          </p>
          <Link to="/create" className="inline-block mt-6">
            <StickerButton variant="primary" size="lg">{t("examples.start")} →</StickerButton>
          </Link>
        </StickerCard>
      </section>
    </PageShell>
  );
}
