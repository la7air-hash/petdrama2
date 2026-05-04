import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AccountPill } from "./AccountPill";

const NAV = [
  { to: "/create", label: "Create" },
  { to: "/gallery", label: "Gallery" },
  { to: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-extrabold tracking-tight">
            PET<span className="text-primary">DRAMA</span>
          </span>
          <span className="hidden sm:inline-block rounded-full border-2 border-foreground bg-highlight px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
            Beta
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-bold uppercase tracking-wide transition-colors hover:text-primary",
                  isActive && "text-primary underline decoration-4 decoration-highlight underline-offset-4",
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
          <div className="font-display text-3xl font-extrabold tracking-tight">
            PET<span className="text-primary">DRAMA</span>
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
