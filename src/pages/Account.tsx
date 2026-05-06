import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerCard } from "@/components/StickerCard";
import { StickerButton } from "@/components/StickerButton";
import { supabase } from "@/integrations/supabase/client";
import { signOutAndClear } from "@/lib/auth-cleanup";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

function providerLabel(user: User | null): string {
  if (!user) return "—";
  const ids = user.identities ?? [];
  if (ids.length === 0) return user.app_metadata?.provider ?? "Email";
  const names = Array.from(new Set(ids.map((i) => i.provider)));
  return names
    .map((n) => (n === "google" ? "Google" : n === "email" ? "Email" : n.charAt(0).toUpperCase() + n.slice(1)))
    .join(", ");
}

export default function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/login", { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/login", { replace: true });
        return;
      }
      setUser(data.session.user);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { ok, error } = await signOutAndClear();
    if (!ok) {
      toast.error(error ? `Could not sign out: ${error}` : "Could not sign out.");
      return;
    }
    navigate("/", { replace: true });
  };

  if (loading || !user) {
    return (
      <PageShell>
        <div className="container py-16 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Loading account…
        </div>
      </PageShell>
    );
  }

  const created = user.created_at ? new Date(user.created_at).toLocaleDateString() : "—";
  const confirmed = Boolean(user.email_confirmed_at || user.confirmed_at);

  return (
    <PageShell>
      <section className="container max-w-2xl py-12">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage your PetDrama account.</p>

        <StickerCard className="mt-8 p-6">
          <dl className="divide-y divide-foreground/10">
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</dt>
              <dd className="break-all font-semibold">{user.email ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Login provider</dt>
              <dd className="font-semibold">{providerLabel(user)}</dd>
            </div>
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</dt>
              <dd>
                <span
                  className={`inline-flex items-center rounded-full border-2 border-foreground px-2.5 py-0.5 text-xs font-bold ${
                    confirmed ? "bg-highlight" : "bg-muted"
                  }`}
                >
                  {confirmed ? "Active" : "Pending verification"}
                </span>
              </dd>
            </div>
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Member since</dt>
              <dd className="font-semibold">{created}</dd>
            </div>
          </dl>
        </StickerCard>

        <div className="mt-6 flex flex-wrap gap-3">
          <StickerButton onClick={() => navigate("/gallery")}>My Gallery</StickerButton>
          <StickerButton variant="ghost" onClick={handleSignOut}>
            Sign out
          </StickerButton>
        </div>
      </section>
    </PageShell>
  );
}
