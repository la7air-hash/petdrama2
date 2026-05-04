import { cn } from "@/lib/utils";

export function ProBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border-2 border-foreground bg-highlight text-highlight-foreground px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider", className)}>
      ★ Pro
    </span>
  );
}
