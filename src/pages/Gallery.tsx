import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { loadGallery, type DramaDraft } from "@/lib/storage";
import { getStyle } from "@/lib/drama";

export default function Gallery() {
  const [items, setItems] = useState<DramaDraft[]>([]);
  useEffect(() => {
    setItems(loadGallery());
  }, []);

  return (
    <PageShell>
      <section className="container py-10 md:py-16">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Your gallery</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              Your dramatic collection.
            </h1>
            <p className="mt-2 text-muted-foreground">Saved on this device. Free plan keeps your last 24.</p>
          </div>
          <Link to="/create">
            <StickerButton variant="primary">+ New drama</StickerButton>
          </Link>
        </div>

        {items.length === 0 ? (
          <StickerCard className="p-12 text-center bg-background">
            <div className="text-5xl mb-3">🎭</div>
            <h2 className="font-display text-2xl font-extrabold">No drama yet.</h2>
            <p className="mt-2 text-muted-foreground">Generate your first masterpiece — it'll appear here.</p>
            <Link to="/create" className="inline-block mt-6">
              <StickerButton variant="primary">Create Pet Drama →</StickerButton>
            </Link>
          </StickerCard>
        ) : (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 pt-4">
            {items.map((item, i) => {
              const s = getStyle(item.styleId);
              const tilt = [-3, 2, -1.5, 3, -2.5, 1.5][i % 6];
              const frameColor = s.color;
              return (
                <StickerCard
                  key={i}
                  color={frameColor}
                  rotate={tilt}
                  shadow="lg"
                  className="p-4 hover:rotate-0 transition-transform"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-[3px] border-foreground">
                    <img src={item.imageDataUrl} alt={item.petName} className="size-full object-cover" loading="lazy" />
                  </div>
                  <div className="relative -mt-4 flex justify-center">
                    <span className="rounded-full border-2 border-foreground bg-foreground text-background px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider sticker-shadow-sm">
                      {s.emoji} {item.petName.toUpperCase()} — {s.name}
                    </span>
                  </div>
                  <p className="px-1 pt-4 pb-1 font-display font-extrabold text-base leading-snug">
                    "{item.drama.quote}"
                  </p>
                </StickerCard>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
