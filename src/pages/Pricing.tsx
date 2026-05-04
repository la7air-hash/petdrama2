import { Link } from "react-router-dom";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { toast } from "sonner";

const FREE = [
  "10 standard creations / month",
  "3 Drama Remix / month",
  "Basic drama styles",
  "Personal gallery",
  "Standard download + share links",
  '"Made with PetDrama" watermark',
];
const STANDARD = [
  "25 standard creations / month",
  "10 Drama Remix / month",
  "All drama styles unlocked",
  "No watermark · HD downloads",
  "Cloud gallery + share links",
];
const PRO = [
  "50 standard creations / month",
  "20 Drama Remix / month",
  "All drama styles unlocked",
  "No watermark · HD downloads",
  "Cloud gallery + share links",
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const stdPrice = annual ? "$39" : "$4.99";
  const stdPeriod = annual ? "/year" : "/month";
  const proPrice = annual ? "$79" : "$9.99";
  const proPeriod = annual ? "/year" : "/month";

  const onUpgradeClick = () => {
    toast("Checkout is coming soon — we're finalizing payments.");
  };

  return (
    <PageShell>
      <section className="container py-12 md:py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Pricing</p>
        <h1 className="mt-2 font-display text-5xl md:text-6xl font-extrabold tracking-tight text-balance">
          Simple, dramatic pricing.
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-muted-foreground text-lg">
          Start free. Upgrade when your pet's fame demands it.
        </p>

        <div className="mt-8 inline-flex rounded-full border-2 border-foreground bg-background p-1 sticker-shadow-sm">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-full transition-colors ${
              !annual ? "bg-foreground text-background" : "text-foreground/70"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-full transition-colors ${
              annual ? "bg-foreground text-background" : "text-foreground/70"
            }`}
          >
            Annual · save ~34%
          </button>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {/* FREE */}
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

          {/* STANDARD */}
          <StickerCard className="p-8 bg-secondary text-secondary-foreground">
            <p className="text-xs font-bold uppercase tracking-widest">Standard</p>
            <p className="mt-2 font-display text-6xl font-extrabold">
              {stdPrice}<span className="text-2xl font-bold">{stdPeriod}</span>
            </p>
            <p className="text-sm opacity-80">
              {annual ? "≈ $3.25/month · billed yearly" : "Cancel anytime."}
            </p>
            <ul className="mt-6 space-y-3 text-base">
              {STANDARD.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="font-bold">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <StickerButton variant="dark" className="w-full mt-8" onClick={onUpgradeClick}>
              Coming soon
            </StickerButton>
            <p className="mt-3 text-xs opacity-80">
              Checkout is coming soon — we're finalizing payments.
            </p>
          </StickerCard>

          {/* PRO */}
          <StickerCard className="p-8 bg-primary text-primary-foreground" shadow="lg">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest">Pro</p>
              <span className="rounded-full border-2 border-foreground bg-highlight text-highlight-foreground px-2 py-0.5 text-[10px] font-bold uppercase">
                Most popular
              </span>
            </div>
            <p className="mt-2 font-display text-6xl font-extrabold">
              {proPrice}<span className="text-2xl font-bold">{proPeriod}</span>
            </p>
            <p className="text-sm opacity-80">
              {annual ? "≈ $6.58/month · billed yearly" : "Cancel anytime."}
            </p>
            <ul className="mt-6 space-y-3 text-base">
              {PRO.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="text-highlight font-bold">★</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <StickerButton variant="dark" className="w-full mt-8" onClick={onUpgradeClick}>
              Coming soon
            </StickerButton>
            <p className="mt-3 text-xs opacity-80">
              Checkout is coming soon — we're finalizing payments.
            </p>
          </StickerCard>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground max-w-xl mx-auto">
          Quotas reset on a rolling 30-day window. One-time extra Drama Remix packs coming soon.
          PetDrama is for entertainment only — generated quotes are imaginary pet thoughts and do not
          represent real animal communication.
        </p>
      </section>
    </PageShell>
  );
}
