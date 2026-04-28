import { useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { toast } from "sonner";

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(mode === "login" ? "Welcome back! (demo)" : "Account created (demo).");
  };

  return (
    <PageShell>
      <section className="container py-16 md:py-24">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Account</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              {mode === "login" ? "Welcome back." : "Join the drama."}
            </h1>
            <p className="mt-2 text-muted-foreground">Save your gallery, unlock Pro styles.</p>
          </div>

          <StickerCard className="p-6 md:p-8 bg-background" shadow="lg">
            <div className="flex p-1 rounded-full border-2 border-foreground bg-card mb-6">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-full py-2 text-sm font-bold uppercase transition-colors ${
                    mode === m ? "bg-foreground text-background" : "text-foreground"
                  }`}
                >
                  {m === "login" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border-2 border-foreground bg-card px-4 py-3 font-medium focus:outline-none focus:ring-4 focus:ring-primary/30"
                />
              </div>
              <div>
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-xl border-2 border-foreground bg-card px-4 py-3 font-medium focus:outline-none focus:ring-4 focus:ring-primary/30"
                />
              </div>
              <StickerButton type="submit" variant="primary" className="w-full mt-2">
                {mode === "login" ? "Sign in" : "Create account"}
              </StickerButton>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              By continuing, you agree this is for entertainment only.{" "}
              <Link to="/" className="underline decoration-primary decoration-2 underline-offset-2 font-bold">
                Back home
              </Link>
            </div>
          </StickerCard>
        </div>
      </section>
    </PageShell>
  );
}
