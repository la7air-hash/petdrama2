import { Link } from "react-router-dom";
import type { UsageSummary } from "@/hooks/use-entitlements";
import { cn } from "@/lib/utils";

interface Props {
  usage: UsageSummary | null;
  className?: string;
}

export function UsageMeter({ usage, className }: Props) {
  if (!usage) return null;

  if (usage.is_admin || usage.plan === "admin") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-highlight px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider", className)}>
        ★ Admin test mode
      </span>
    );
  }

  if (usage.plan === "anon") {
    const left = Math.max(0, usage.standard_limit - usage.standard_used);
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-background px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider", className)}>
        {left === 0 ? "Free creation used" : `${left} free creation`}{" "}
        <Link to="/login" className="underline decoration-2 underline-offset-2">Sign in</Link>
      </span>
    );
  }

  const stdLeft = Math.max(0, usage.standard_limit - usage.standard_used);
  const remixLeft = Math.max(0, usage.remix_limit - usage.remix_used);
  const planLabel = usage.plan === "pro" ? "★ Pro" : usage.plan === "standard" ? "Standard" : "Free";
  const bg = usage.plan === "pro" ? "bg-highlight" : "bg-background";

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5 rounded-full border-2 border-foreground px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider", bg, className)}>
      <span>{planLabel}</span>
      <span className="opacity-50">·</span>
      <span>Creations {stdLeft}/{usage.standard_limit}</span>
      <span className="opacity-50">·</span>
      <span>Remix {remixLeft}/{usage.remix_limit}</span>
    </span>
  );
}
