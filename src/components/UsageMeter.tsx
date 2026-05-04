import { Link } from "react-router-dom";
import type { UsageSummary } from "@/hooks/use-entitlements";
import { cn } from "@/lib/utils";

interface Props {
  usage: UsageSummary | null;
  className?: string;
}

export function UsageMeter({ usage, className }: Props) {
  if (!usage) return null;
  if (usage.plan === "anon") {
    const left = Math.max(0, usage.daily_limit - usage.used_today);
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-background px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider", className)}>
        {left === 0 ? "Free creation used" : `${left} free creation`}{" "}
        <Link to="/login" className="underline decoration-2 underline-offset-2">Sign in</Link>
      </span>
    );
  }
  if (usage.plan === "pro") {
    const left = Math.max(0, usage.monthly_limit - usage.used_month);
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-highlight px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider", className)}>
        ★ Pro · {left} / {usage.monthly_limit} this month
      </span>
    );
  }
  const left = Math.max(0, usage.daily_limit - usage.used_today);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-background px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider", className)}>
      {left} / {usage.daily_limit} free today
    </span>
  );
}
