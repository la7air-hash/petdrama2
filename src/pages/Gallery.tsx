import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { loadGallery, saveGallery, deleteFromGallery, type DramaDraft } from "@/lib/storage";
import { getStyle, normalizePetName } from "@/lib/drama";
import { downloadDataUrl } from "@/lib/render";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "original" | "remix";

function fileNameFor(item: DramaDraft, variant: Variant) {
  const name = normalizePetName(item.petName).replace(/\s+/g, "-").toLowerCase() || "petdrama";
  const tag = variant === "remix" ? "-remix" : "";
  return `petdrama-${name}${tag}.png`;
}

export default function Gallery() {
  const [items, setItems] = useState<DramaDraft[]>([]);
  const [active, setActive] = useState<DramaDraft | null>(null);
  const [activeVariant, setActiveVariant] = useState<Variant>("original");
  const [pendingDelete, setPendingDelete] = useState<DramaDraft | null>(null);

  useEffect(() => {
    setItems(loadGallery());
  }, []);

  const openItem = (item: DramaDraft) => {
    setActive(item);
    setActiveVariant("original");
  };

  const handleDownload = (item: DramaDraft, variant: Variant, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url =
      variant === "remix"
        ? item.remixRenderedDataUrl
        : item.renderedDataUrl || item.imageDataUrl;
    if (!url) {
      toast.error("This version isn't saved.");
      return;
    }
    downloadDataUrl(url, fileNameFor(item, variant));
    toast.success("Downloaded!");
  };

  const requestDelete = (item: DramaDraft, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPendingDelete(item);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const snapshot = loadGallery();
    const next = deleteFromGallery(pendingDelete.creationId);
    setItems(next);
    if (active && active.creationId === pendingDelete.creationId) setActive(null);
    setPendingDelete(null);
    toast.success("Creation deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          saveGallery(snapshot);
          setItems(snapshot);
        },
      },
    });
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
              Saved on this device. Tap any card to view, download or delete.
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
              const hasRemix = !!item.remixRenderedDataUrl;
              return (
                <StickerCard
                  key={item.createdAt ?? i}
                  color={hasFinal ? "card" : s.color}
                  rotate={tilt}
                  shadow="lg"
                  className="p-3 hover:rotate-0 transition-transform cursor-pointer group relative"
                >
                  <button
                    type="button"
                    onClick={(e) => requestDelete(item, e)}
                    className="absolute top-2 right-2 z-10 inline-flex items-center justify-center size-8 rounded-full border-2 border-foreground bg-background text-foreground sticker-shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    aria-label="Delete creation"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  {hasRemix && (
                    <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full border-2 border-foreground bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider sticker-shadow-sm">
                      ✨ Remix
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => openItem(item)}
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
                      onClick={(e) => handleDownload(item, "original", e)}
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
          {active && (() => {
            const itemHasRemix = !!active.remixRenderedDataUrl;
            const showRemix = activeVariant === "remix" && itemHasRemix;
            const previewUrl = showRemix
              ? active.remixRenderedDataUrl!
              : active.renderedDataUrl || active.imageDataUrl;
            return (
              <>
                <DialogTitle className="font-display text-xl font-extrabold">
                  {getStyle(active.styleId).emoji} {normalizePetName(active.petName)} —{" "}
                  {getStyle(active.styleId).name}
                </DialogTitle>
                <DialogDescription className="sr-only">Saved creation preview and download.</DialogDescription>

                {itemHasRemix && (
                  <div className="mt-3 inline-flex rounded-full border-2 border-foreground bg-background p-1 sticker-shadow-sm">
                    <button
                      type="button"
                      onClick={() => setActiveVariant("original")}
                      className={cn(
                        "px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-full transition-colors",
                        activeVariant === "original" ? "bg-foreground text-background" : "text-foreground/70",
                      )}
                    >
                      Original
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVariant("remix")}
                      className={cn(
                        "px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-full transition-colors",
                        activeVariant === "remix" ? "bg-primary text-primary-foreground" : "text-foreground/70",
                      )}
                    >
                      ✨ Remix
                    </button>
                  </div>
                )}

                <div className="mt-2 rounded-2xl overflow-hidden border-2 border-foreground bg-foreground/5">
                  <img
                    src={previewUrl}
                    alt={`${normalizePetName(active.petName)} as ${getStyle(active.styleId).name}${showRemix ? " (remix)" : ""}`}
                    className="w-full h-auto block"
                  />
                </div>
                {active.drama?.quote && (
                  <p className="mt-3 font-display font-extrabold text-base leading-snug">
                    "{active.drama.quote}"
                  </p>
                )}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                  <StickerButton
                    variant="primary"
                    onClick={() => handleDownload(active, showRemix ? "remix" : "original")}
                  >
                    ⬇ Download {showRemix ? "Remix" : "PNG"}
                  </StickerButton>
                  <StickerButton
                    variant="ghost"
                    onClick={() => requestDelete(active)}
                    className="!bg-destructive !text-destructive-foreground"
                  >
                    <Trash2 className="size-4" /> Delete
                  </StickerButton>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this creation?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && (
                <>
                  This will remove <strong>{normalizePetName(pendingDelete.petName)} —{" "}
                  {getStyle(pendingDelete.styleId).name}</strong> from your gallery. You can undo right after.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
