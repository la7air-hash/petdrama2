import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AccountPill } from "./AccountPill";
import { LANGUAGES, useI18n, type LanguageCode } from "@/lib/i18n";
import logo from "@/assets/petdrama-logo.png";

const NAV = [
  { to: "/create", label: "nav.create" },
  { to: "/gallery", label: "nav.gallery" },
  { to: "/pricing", label: "nav.pricing" },
] as const;

export function SiteHeader() {
  const { language, setLanguage, t } = useI18n();

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="PetDrama home" className="flex items-center gap-2 group">
          <img
            src={logo}
            alt="PetDrama"
            className="h-10 w-auto transition-transform group-hover:-rotate-2 md:h-14"
            width={120}
            height={56}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-2 rounded-full bg-card px-2 py-1.5 sticker-shadow-sm">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "px-4 py-1.5 rounded-full text-sm font-bold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:text-primary",
                )
              }
            >
              {t(item.label)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="language-select">Language</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="max-w-[72px] rounded-full border-2 border-foreground bg-background px-2 py-2 text-xs font-extrabold uppercase sticker-shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>{item.short}</option>
            ))}
          </select>
          <div className="max-[420px]:hidden">
            <AccountPill />
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-24 border-t-2 border-foreground bg-foreground text-background">
      <div className="container grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PetDrama" className="h-12 w-auto" width={96} height={48} />
          </div>
          <p className="mt-3 max-w-sm text-sm text-background/70">
            {t("footer.body")}
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-highlight">App</h4>
          <ul className="space-y-2 text-sm text-background/80">
            <li><Link to="/create" className="hover:text-background">{t("nav.create")}</Link></li>
            <li><Link to="/gallery" className="hover:text-background">{t("nav.gallery")}</Link></li>
            <li><Link to="/pricing" className="hover:text-background">{t("nav.pricing")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-highlight">{t("footer.legal")}</h4>
          <ul className="space-y-2 text-sm text-background/80">
            <li><a href="#" className="hover:text-background">{t("footer.terms")}</a></li>
            <li><a href="#" className="hover:text-background">{t("footer.privacy")}</a></li>
            <li><a href="#" className="hover:text-background">{t("footer.contact")}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/15 py-5 text-center text-xs uppercase tracking-widest text-background/50">
        © {new Date().getFullYear()} PetDrama · {t("footer.made")}
      </div>
    </footer>
  );
}
