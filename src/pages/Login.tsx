import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_REDIRECTS = ["/gallery", "/create", "/result", "/pricing", "/"];

function resolveIntendedPath(locationState: unknown, search: string): string {
  // 1) location.state.from (set by protected routes / save flows)
  const fromState =
    locationState && typeof locationState === "object" && "from" in (locationState as Record<string, unknown>)
      ? String((locationState as Record<string, unknown>).from ?? "")
      : "";
  // 2) ?redirect=
  const params = new URLSearchParams(search);
  const fromQuery = params.get("redirect") ?? "";
  // 3) sessionStorage breadcrumb (last non-login route)
  const fromSession =
    typeof window !== "undefined" ? sessionStorage.getItem("petdrama:lastRoute") ?? "" : "";

  for (const candidate of [fromState, fromQuery, fromSession]) {
    if (!candidate) continue;
    const path = candidate.startsWith("/") ? candidate : `/${candidate}`;
    if (ALLOWED_REDIRECTS.some((p) => path === p || path.startsWith(`${p}?`) || path.startsWith(`${p}/`))) {
      return path;
    }
  }
  return "/";
}

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const intended = resolveIntendedPath(location.state, location.search);

  // If already signed in, bounce to intended page
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) navigate(intended, { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate(intended, { replace: true });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [intended, navigate]);

  const handleGoogle = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    try {
      // Persist intended path so it survives the OAuth round-trip
      sessionStorage.setItem("petdrama:postLogin", intended);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login?redirect=${encodeURIComponent(intended)}`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) {
        const msg = String(error.message ?? "");
        const notConfigured = /not.*(configured|enabled)|provider.*disabled|unsupported.*provider|missing.*client/i.test(
          msg,
        );
        toast.error(
          notConfigured
            ? "Google sign-in isn't configured yet. Please try email & password, or contact support."
            : `Google sign-in failed: ${msg || "Unknown error"}`,
        );
        setGoogleBusy(false);
        return;
      }
      // The browser is leaving for Google; the auth listener above handles the return.
    } catch (e) {
      toast.error("Google sign-in is unavailable right now. Please use email & password.");
      setGoogleBusy(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Welcome back!");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + intended },
        });
        if (error) {
          // Friendlier message for duplicate accounts
          if (/already|registered|exists/i.test(error.message)) {
            toast.error("An account with this email already exists. Try signing in instead.");
            setMode("login");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Check your email to confirm your account.");
        }
      }
    } finally {
      setBusy(false);
    }
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
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-full py-2 text-sm font-bold uppercase transition-colors ${
                    mode === m ? "bg-foreground text-background" : "text-foreground"
                  }`}
                >
                  {m === "login" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            {/* Google sign-in (visible in both modes) */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleBusy}
              aria-label={mode === "login" ? "Sign in with Google" : "Sign up with Google"}
              className="w-full inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-foreground bg-card text-foreground font-bold px-6 py-3 sticker-shadow-sm transition-all duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 7.1 29.4 5 24 5 16.3 5 9.7 9.4 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.5 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.3 5.2C41 35.6 44 30.3 44 24c0-1.2-.1-2.3-.4-3.5z"
                />
              </svg>
              <span>{googleBusy ? "Connecting…" : "Continue with Google"}</span>
            </button>

            <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-foreground/20" />
              <span>or</span>
              <span className="h-px flex-1 bg-foreground/20" />
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
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border-2 border-foreground bg-card px-4 py-3 font-medium focus:outline-none focus:ring-4 focus:ring-primary/30"
                />
              </div>
              <div>
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="mt-2 w-full rounded-xl border-2 border-foreground bg-card px-4 py-3 font-medium focus:outline-none focus:ring-4 focus:ring-primary/30"
                />
              </div>
              <StickerButton type="submit" variant="primary" className="w-full mt-2" disabled={busy}>
                {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
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
