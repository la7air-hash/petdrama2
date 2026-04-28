import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { loadGallery, type DramaDraft } from "@/lib/storage";
import { getStyle, normalizePetName } from "@/lib/drama";
import { downloadDataUrl } from "@/lib/render";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download } from "lucide-react";

function fileNameFor(item: DramaDraft) {
  const name = normalizePetName(item.petName).replace(/\s+/g, "-").toLowerCase() || "petdrama";
  return `petdrama-${name}.png`;
}

export default function Gallery() {
  const [items, setItems] = useState<DramaDraft[]>([]);
  const [active, setActive] = useState<DramaDraft | null>(null);

  useEffect(() => {
    setItems(loadGallery());
  }, []);

  const handleDownload = (item: DramaDraft, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = item.renderedDataUrl || item.imageDataUrl;
    if (!url) {
      toast.error("This creation has no saved file.");
      return;
    }
    downloadDataUrl(url, fileNameFor(item));
    toast.success("Downloaded!");
  };

  return (
    <PageShell>
      <section className="container py-10 md:py-16">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Your gallery</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              Your dramatic collection.
            </h1>
            <p className="mt-2 text-muted-foreground">
              Saved on this device. Tap any card to view & re-download.
            </p>
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
              const preview = item.renderedDataUrl || item.imageDataUrl;
              const hasFinal = !!item.renderedDataUrl;
              return (
                <StickerCard
                  key={i}
                  color={hasFinal ? "card" : s.color}
                  rotate={tilt}
                  shadow="lg"
                  className="p-3 hover:rotate-0 transition-transform cursor-pointer group"
                >
                  <button
                    type="button"
                    onClick={() => setActive(item)}
                    className="block w-full text-left"
                    aria-label={`Open ${normalizePetName(item.petName)} creation`}
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden border-[3px] border-foreground bg-foreground/5">
                      <img
                        src={preview}
                        alt={`${normalizePetName(item.petName)} as ${s.name}`}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </button>
                  <div className="mt-3 flex items-center justify-between gap-2 px-1">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider truncate">
                      {s.emoji} {normalizePetName(item.petName)} — {s.name}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => handleDownload(item, e)}
                      className="inline-flex items-center gap-1 rounded-full border-2 border-foreground bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-extrabold sticker-shadow-sm hover:-translate-y-0.5 transition-transform shrink-0"
                      aria-label="Download PNG"
                    >
                      <Download className="size-3" /> PNG
                    </button>
                  </div>
                </StickerCard>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg p-4 md:p-6">
          {active && (
            <>
              <DialogTitle className="font-display text-xl font-extrabold">
                {getStyle(active.styleId).emoji} {normalizePetName(active.petName)} —{" "}
                {getStyle(active.styleId).name}
              </DialogTitle>
              <DialogDescription className="sr-only">Saved creation preview and download.</DialogDescription>
              <div className="mt-2 rounded-2xl overflow-hidden border-2 border-foreground bg-foreground/5">
                <img
                  src={active.renderedDataUrl || active.imageDataUrl}
                  alt={`${normalizePetName(active.petName)} as ${getStyle(active.styleId).name}`}
                  className="w-full h-auto block"
                />
              </div>
              {active.drama?.quote && (
                <p className="mt-3 font-display font-extrabold text-base leading-snug">
                  "{active.drama.quote}"
                </p>
              )}
              <div className="mt-4 grid grid-cols-1 gap-2">
                <StickerButton variant="primary" onClick={() => handleDownload(active)}>
                  ⬇ Download PNG
                </StickerButton>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
