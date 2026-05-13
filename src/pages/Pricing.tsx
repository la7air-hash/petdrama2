import { Link } from "react-router-dom";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const PLAN_COPY = {
  en: {
    freeName: "Free",
    standardName: "Standard",
    proName: "Pro",
    month: "/month",
    year: "/year",
    free: [
      "10 PetDrama cards / month",
      "3 Drama Remix / month",
      "Core styles to start fast",
      "Personal gallery",
      "Share links + standard downloads",
      '"Made with PetDrama" watermark',
    ],
    standard: [
      "25 PetDrama cards / month",
      "10 Drama Remix / month",
      "All drama styles unlocked",
      "HD downloads with no watermark",
      "Cloud gallery + public share links",
      "Perfect for regular social posting",
    ],
    pro: [
      "50 PetDrama cards / month",
      "20 Drama Remix / month",
      "All styles + early style drops",
      "HD downloads with no watermark",
      "Cloud gallery + public share links",
      "Best for creators, shops and pet brands",
    ],
    standardBlurb: "For pet parents who post often.",
    proBlurb: "For creators and small brands.",
    standardYear: "≈ $3.25/month · billed yearly",
    proYear: "≈ $6.58/month · billed yearly",
  },
  it: {
    freeName: "Gratis",
    standardName: "Standard",
    proName: "Pro",
    month: "/mese",
    year: "/anno",
    free: [
      "10 card PetDrama / mese",
      "3 Drama Remix / mese",
      "Stili essenziali per iniziare",
      "Galleria personale",
      "Link condivisibili + download standard",
      'Filigrana "Made with PetDrama"',
    ],
    standard: [
      "25 card PetDrama / mese",
      "10 Drama Remix / mese",
      "Tutti gli stili sbloccati",
      "Download HD senza filigrana",
      "Galleria cloud + link pubblici",
      "Perfetto per pubblicare spesso sui social",
    ],
    pro: [
      "50 card PetDrama / mese",
      "20 Drama Remix / mese",
      "Tutti gli stili + nuovi stili in anteprima",
      "Download HD senza filigrana",
      "Galleria cloud + link pubblici",
      "Ideale per creator, negozi e brand pet",
    ],
    standardBlurb: "Per chi pubblica spesso il proprio pet.",
    proBlurb: "Per creator e piccoli brand.",
    standardYear: "≈ $3.25/mese · fatturato annualmente",
    proYear: "≈ $6.58/mese · fatturato annualmente",
  },
  fr: {
    freeName: "Gratuit",
    standardName: "Standard",
    proName: "Pro",
    month: "/mois",
    year: "/an",
    free: [
      "10 cartes PetDrama / mois",
      "3 Drama Remix / mois",
      "Styles essentiels pour commencer",
      "Galerie personnelle",
      "Liens de partage + téléchargements standard",
      'Filigrane "Made with PetDrama"',
    ],
    standard: [
      "25 cartes PetDrama / mois",
      "10 Drama Remix / mois",
      "Tous les styles débloqués",
      "Téléchargements HD sans filigrane",
      "Galerie cloud + liens publics",
      "Parfait pour publier souvent sur les réseaux",
    ],
    pro: [
      "50 cartes PetDrama / mois",
      "20 Drama Remix / mois",
      "Tous les styles + nouveautés en avant-première",
      "Téléchargements HD sans filigrane",
      "Galerie cloud + liens publics",
      "Idéal pour créateurs, boutiques et marques pet",
    ],
    standardBlurb: "Pour publier souvent son animal.",
    proBlurb: "Pour créateurs et petites marques.",
    standardYear: "≈ $3.25/mois · facturé annuellement",
    proYear: "≈ $6.58/mois · facturé annuellement",
  },
  es: {
    freeName: "Gratis",
    standardName: "Standard",
    proName: "Pro",
    month: "/mes",
    year: "/año",
    free: [
      "10 tarjetas PetDrama / mes",
      "3 Drama Remix / mes",
      "Estilos básicos para empezar",
      "Galería personal",
      "Enlaces para compartir + descargas estándar",
      'Marca de agua "Made with PetDrama"',
    ],
    standard: [
      "25 tarjetas PetDrama / mes",
      "10 Drama Remix / mes",
      "Todos los estilos desbloqueados",
      "Descargas HD sin marca de agua",
      "Galería cloud + enlaces públicos",
      "Perfecto para publicar a menudo",
    ],
    pro: [
      "50 tarjetas PetDrama / mes",
      "20 Drama Remix / mes",
      "Todos los estilos + novedades anticipadas",
      "Descargas HD sin marca de agua",
      "Galería cloud + enlaces públicos",
      "Ideal para creadores, tiendas y marcas pet",
    ],
    standardBlurb: "Para quien publica a menudo.",
    proBlurb: "Para creadores y pequeñas marcas.",
    standardYear: "≈ $3.25/mes · facturado anualmente",
    proYear: "≈ $6.58/mes · facturado anualmente",
  },
} as const;

type PricingLanguage = keyof typeof PLAN_COPY;

export default function Pricing() {
  const { t, language } = useI18n();
  const [annual, setAnnual] = useState(false);
  const copy = PLAN_COPY[(language in PLAN_COPY ? language : "en") as PricingLanguage];
  const stdPrice = annual ? "$39" : "$4.99";
  const stdPeriod = annual ? copy.year : copy.month;
  const proPrice = annual ? "$79" : "$9.99";
  const proPeriod = annual ? copy.year : copy.month;

  const onUpgradeClick = () => {
    toast(t("pricing.checkout"));
  };

  return (
    <PageShell>
      <section className="container py-12 md:py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">{t("pricing.eyebrow")}</p>
        <h1 className="mt-2 font-display text-5xl md:text-6xl font-extrabold tracking-tight text-balance">
          {t("pricing.title")}
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-muted-foreground text-lg">
          {t("pricing.subtitle")}
        </p>

        <div className="mt-8 inline-flex rounded-full border-2 border-foreground bg-background p-1 sticker-shadow-sm">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-full transition-colors ${
              !annual ? "bg-foreground text-background" : "text-foreground/70"
            }`}
          >
            {t("pricing.monthly")}
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-full transition-colors ${
              annual ? "bg-foreground text-background" : "text-foreground/70"
            }`}
          >
            {t("pricing.annual")}
          </button>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {/* FREE */}
          <StickerCard className="p-6 md:p-7 bg-background flex flex-col h-full">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{copy.freeName}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-4xl md:text-5xl font-extrabold leading-none">$0</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t("pricing.forever")}</p>
            <ul className="mt-6 space-y-3 text-base flex-1">
              {copy.free.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/create" className="block mt-8">
              <StickerButton variant="ghost" className="w-full">{t("home.startFree")}</StickerButton>
            </Link>
          </StickerCard>

          {/* STANDARD */}
          <StickerCard className="p-6 md:p-7 bg-secondary text-secondary-foreground flex flex-col h-full">
            <p className="text-xs font-bold uppercase tracking-widest">{copy.standardName}</p>
            <div className="mt-2 flex items-baseline gap-1 flex-wrap">
              <span className="font-display text-4xl md:text-5xl font-extrabold leading-none">{stdPrice}</span>
              <span className="text-base md:text-lg font-bold opacity-80">{stdPeriod}</span>
            </div>
            <p className="mt-1 text-sm opacity-80">
              {annual ? copy.standardYear : copy.standardBlurb}
            </p>
            <ul className="mt-6 space-y-3 text-base flex-1">
              {copy.standard.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="font-bold">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <StickerButton variant="dark" className="w-full mt-8" onClick={onUpgradeClick}>
              {t("pricing.comingSoon")}
            </StickerButton>
            <p className="mt-3 text-xs opacity-80">
              {t("pricing.checkout")}
            </p>
          </StickerCard>

          {/* PRO */}
          <StickerCard className="p-6 md:p-7 bg-primary text-primary-foreground flex flex-col h-full" shadow="lg">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-widest">{copy.proName}</p>
              <span className="rounded-full border-2 border-foreground bg-highlight text-highlight-foreground px-2 py-0.5 text-[10px] font-bold uppercase whitespace-nowrap">
                {t("home.mostPopular")}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1 flex-wrap">
              <span className="font-display text-4xl md:text-5xl font-extrabold leading-none">{proPrice}</span>
              <span className="text-base md:text-lg font-bold opacity-80">{proPeriod}</span>
            </div>
            <p className="mt-1 text-sm opacity-80">
              {annual ? copy.proYear : copy.proBlurb}
            </p>
            <ul className="mt-6 space-y-3 text-base flex-1">
              {copy.pro.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="text-highlight font-bold">★</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <StickerButton variant="dark" className="w-full mt-8" onClick={onUpgradeClick}>
              {t("pricing.comingSoon")}
            </StickerButton>
            <p className="mt-3 text-xs opacity-80">
              {t("pricing.checkout")}
            </p>
          </StickerCard>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground max-w-xl mx-auto">
          {t("pricing.note")}
        </p>
      </section>
    </PageShell>
  );
}
