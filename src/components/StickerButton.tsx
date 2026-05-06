import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "md" | "lg";
}

export const StickerButton = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-full border border-foreground/10 font-bold transition-all duration-200 sticker-shadow active:translate-y-[1px] active:shadow-none hover:-translate-y-[2px] hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      dark: "bg-foreground text-background",
      ghost: "bg-card text-foreground",
    };
    const sizes = {
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg md:text-xl",
    };
    return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
  },
);
StickerButton.displayName = "StickerButton";
