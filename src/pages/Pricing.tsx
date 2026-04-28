import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";

const FREE = [
  "3 creations per day",
  "Basic drama styles",
  "Standard resolution download",
  "Includes small watermark",
];
const PRO = [
  "Unlimited creations",
  "All 10 drama styles unlocked",
  "HD downloads, no watermark",
  "Personal gallery (cloud sync soon)",
  "Priority new styles",
];

export default function Pricing() {
  return (
    <PageShell>
      <section className="container py-12 md:py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Pricing</p>
        <h1 className="mt-2 font-display text-5xl md:text-6xl font-extrabold tracking-tight text-balance">
          Simple, dramatic pricing.
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-muted-foreground text-lg">
          Start free. Go Pro when your pet's fame demands it.
        </p>
      </section>

      <section className="container pb-24">
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <StickerCard className="p-8 bg-background">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Free</p>
            <p className="mt-2 font-display text-6xl font-extrabold">$0</p>
            <p className="text-sm text-muted-foreground">Forever free.</p>
            <ul className="mt-6 space-y-3 text-base">
              {FREE.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/create" className="block mt-8">
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
            <p className="mt-2 font-display text-6xl font-extrabold">
              $5<span className="text-2xl font-bold">/mo</span>
            </p>
            <p className="text-sm opacity-80">Cancel anytime.</p>
            <ul className="mt-6 space-y-3 text-base">
              {PRO.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="text-highlight font-bold">★</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/login" className="block mt-8">
              <StickerButton variant="dark" className="w-full">Go Pro</StickerButton>
            </Link>
          </StickerCard>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground max-w-xl mx-auto">
          PetDrama is for entertainment only. Generated quotes are imaginary pet thoughts and do not represent real animal communication.
        </p>
      </section>
    </PageShell>
  );
}
