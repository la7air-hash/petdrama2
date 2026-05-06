import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AccountPill } from "./AccountPill";
import logo from "@/assets/petdrama-logo.png";

const NAV = [
  { to: "/create", label: "Create" },
  { to: "/gallery", label: "Gallery" },
  { to: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex items-center justify-between py-3">
        <Link to="/" aria-label="PetDrama home" className="flex items-center gap-2 group">
          <img
            src={logo}
            alt="PetDrama"
            className="h-12 md:h-14 w-auto transition-transform group-hover:-rotate-2"
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
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <AccountPill />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-2 border-foreground bg-foreground text-background">
      <div className="container grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PetDrama" className="h-12 w-auto" width={96} height={48} />
          </div>
          <p className="mt-3 max-w-sm text-sm text-background/70">
            Imaginary pet thoughts for entertainment only. We do not actually translate animals — we just make them look unreasonably dramatic.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-highlight">App</h4>
          <ul className="space-y-2 text-sm text-background/80">
            <li><Link to="/create" className="hover:text-background">Create</Link></li>
            <li><Link to="/gallery" className="hover:text-background">Gallery</Link></li>
            <li><Link to="/pricing" className="hover:text-background">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-highlight">Legal</h4>
          <ul className="space-y-2 text-sm text-background/80">
            <li><a href="#" className="hover:text-background">Terms</a></li>
            <li><a href="#" className="hover:text-background">Privacy</a></li>
            <li><a href="#" className="hover:text-background">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/15 py-5 text-center text-xs uppercase tracking-widest text-background/50">
        © {new Date().getFullYear()} PetDrama · Made with love & dramatic side-eye
      </div>
    </footer>
  );
}
