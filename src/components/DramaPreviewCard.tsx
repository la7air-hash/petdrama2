export interface DramaPreviewExample {
  img: string;
  name: string;
  style: string;
  quote: string;
  caption: string;
  accent: "teal" | "coral";
  rotate: number;
}

export function DramaPreviewCard({
  example,
  className,
  compact = false,
}: {
  example: DramaPreviewExample;
  className?: string;
  compact?: boolean;
}) {
  const accentClass =
    example.accent === "teal" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground";
  const underlineClass = example.accent === "teal" ? "bg-primary" : "bg-secondary";

  return (
    <article
      className={[
        "relative rounded-[1.5rem] border-2 border-foreground bg-[linear-gradient(135deg,#fbf4e4,#ffe9a8_55%,#cfefec)] p-3 text-foreground shadow-[8px_8px_0_rgba(35,57,63,0.12)] transition-transform hover:-translate-y-1",
        compact ? "scale-[0.92]" : "",
        className ?? "",
      ].join(" ")}
      style={{ transform: `rotate(${example.rotate}deg)` }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] opacity-60 [background-image:radial-gradient(rgba(35,57,63,0.10)_1px,transparent_1px)] [background-size:13px_13px]" />
      <div className="pointer-events-none absolute left-4 top-5 text-primary/25">🐾</div>
      <div className="pointer-events-none absolute right-5 top-6 text-secondary/30">✦</div>
      <div className="pointer-events-none absolute bottom-5 right-9 text-primary/30">✦</div>
      <div className="pointer-events-none absolute -right-2 top-8 size-12 rounded-full bg-secondary shadow-[0_8px_18px_rgba(35,57,63,0.18)]">
        <span className="absolute left-2 top-2 size-3 rounded-full bg-white/50" />
      </div>

      <div className="relative mx-auto mt-8 w-[78%] rounded-3xl border border-foreground/10 bg-white p-3 shadow-[0_12px_28px_rgba(35,57,63,0.16)] -rotate-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-foreground/15 bg-foreground/5">
          <img
            src={example.img}
            alt={`${example.name} - ${example.style}`}
            className="size-full object-cover"
            loading="lazy"
            width={520}
            height={390}
          />
          <div className="absolute inset-0 glossy pointer-events-none" />
        </div>
        <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-background px-4 py-2 text-[10px] font-extrabold uppercase shadow-lg ${accentClass}`}>
          {example.name.toUpperCase()} — {example.style.toUpperCase()}
        </div>
      </div>

      <div className={compact ? "px-2 pb-4 pt-7" : "px-3 pb-5 pt-8"}>
        <p className={compact ? "text-center font-display text-sm font-extrabold leading-tight" : "text-center font-display text-lg font-extrabold leading-tight"}>
          “{example.quote}”
        </p>
        <div className={`mx-auto mt-2 h-1.5 w-16 rounded-full ${underlineClass}`} />
        {!compact && (
          <div className="mx-auto mt-5 max-w-[90%] rounded-2xl border border-foreground/10 bg-white px-4 py-3 text-center text-sm font-semibold text-foreground/75 shadow-[0_6px_14px_rgba(35,57,63,0.12)]">
            {example.caption}
          </div>
        )}
      </div>

      <div className="relative flex items-center justify-between px-2 pb-1 text-[10px] font-extrabold">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-primary" />
          PetDrama
        </span>
        {!compact && <span className="rounded-full border-2 border-foreground bg-primary px-3 py-1 text-primary-foreground">WEBP</span>}
      </div>
    </article>
  );
}
