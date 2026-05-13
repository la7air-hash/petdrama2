import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signOutAndClear } from "@/lib/auth-cleanup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";

function shortLabel(email: string | undefined | null): string {
  if (!email) return "Account";
  const local = email.split("@")[0] ?? email;
  return local.length > 16 ? `${local.slice(0, 14)}…` : local;
}

export function AccountPill() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <Link
        to="/create"
        className="inline-flex items-center rounded-full border-2 border-foreground bg-foreground px-3 py-2 text-sm font-bold text-background transition-transform hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground sm:px-4"
      >
        Create
      </Link>
    );
  }

  if (!session) {
    return (
      <>
        <Link
          to="/login"
          className="hidden sm:inline-flex items-center rounded-full border-2 border-foreground bg-background px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5"
        >
          Sign in
        </Link>
        <Link
          to="/create"
          className="inline-flex items-center rounded-full border-2 border-foreground bg-foreground px-3 py-2 text-sm font-bold text-background transition-transform hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground sm:px-4"
        >
          Create
        </Link>
      </>
    );
  }

  const email = session.user.email ?? "";
  const label = shortLabel(email);

  const handleSignOut = async () => {
    const { ok, error } = await signOutAndClear();
    if (!ok) {
      toast.error(error ? `Could not sign out: ${error}` : "Could not sign out. Please try again.");
      return;
    }
    toast.success("Signed out");
    navigate("/", { replace: true });
  };

  return (
    <>
      <Link
        to="/create"
        className="hidden sm:inline-flex items-center rounded-full border-2 border-foreground bg-foreground px-4 py-2 text-sm font-bold text-background transition-transform hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground"
      >
        Create
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-background px-3 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Open account menu"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-foreground bg-highlight text-foreground">
            <User className="h-3.5 w-3.5" />
          </span>
          <span className="max-w-[140px] truncate">{label}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 rounded-2xl border-2 border-foreground bg-background p-2 shadow-[6px_6px_0_0_hsl(var(--foreground))]"
        >
          <DropdownMenuLabel className="px-2 py-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Signed in as
            </div>
            <div className="truncate text-sm font-bold">{email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1 bg-foreground/15" />
          <DropdownMenuItem asChild className="rounded-xl font-semibold focus:bg-highlight">
            <Link to="/gallery">My Gallery</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-xl font-semibold focus:bg-highlight">
            <Link to="/account">Account</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 bg-foreground/15" />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              void handleSignOut();
            }}
            className="rounded-xl font-semibold text-primary focus:bg-primary focus:text-primary-foreground"
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
