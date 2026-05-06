import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const COLOR_MAP = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
  highlight: "bg-highlight text-highlight-foreground",
  foreground: "bg-foreground text-background",
  card: "bg-card text-card-foreground",
} as const;

export function StickerCard({
  children,
  color = "card",
  rotate = 0,
  className,
  shadow = "default",
}: {
  children: ReactNode;
  color?: keyof typeof COLOR_MAP;
  rotate?: number;
  className?: string;
  shadow?: "sm" | "default" | "lg";
}) {
  const shadowClass =
    shadow === "lg" ? "sticker-shadow-lg" : shadow === "sm" ? "sticker-shadow-sm" : "sticker-shadow";
  return (
    <div
      className={cn(
        "rounded-3xl border border-foreground/10 transition-transform duration-300",
        COLOR_MAP[color],
        shadowClass,
        className,
      )}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      {children}
    </div>
  );
}
