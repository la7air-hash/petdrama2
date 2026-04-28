import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "md" | "lg";
}

export const StickerButton = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-foreground font-bold transition-all duration-150 sticker-shadow active:translate-x-[3px] active:translate-y-[3px] active:shadow-none hover:-translate-x-[1px] hover:-translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      dark: "bg-foreground text-background",
      ghost: "bg-background text-foreground",
    };
    const sizes = {
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg md:text-xl",
    };
    return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
  },
);
StickerButton.displayName = "StickerButton";
