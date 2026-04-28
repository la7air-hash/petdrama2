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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => {
              const s = getStyle(item.styleId);
              return (
                <StickerCard key={i} className="p-3 bg-background">
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-foreground">
                    <img src={item.imageDataUrl} alt={item.petName} className="size-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 glossy pointer-events-none" />
                    <span className="absolute top-3 left-3 rounded-lg border-2 border-foreground bg-background px-2 py-1 text-[10px] font-bold uppercase">
                      {s.emoji} {s.name}
                    </span>
                  </div>
                  <div className="px-2 pt-3 pb-1">
                    <p className="font-display font-extrabold text-lg leading-tight">"{item.drama.quote}"</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      — {item.petName}
                    </p>
                  </div>
                </StickerCard>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
