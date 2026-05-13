import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { getGalleryItemId, loadGallery, saveGallery, deleteFromGallery, type DramaDraft } from "@/lib/storage";
import { getStyle, normalizePetName, type DramaStyleId, type PetType } from "@/lib/drama";
import { downloadUrlAsFile } from "@/lib/render";
import { supabase } from "@/integrations/supabase/client";
import { listMyGallery, deleteGalleryItem, type CloudGalleryItem } from "@/lib/gallery-cloud";
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
import { Copy, Download, Facebook, Share2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  copyToClipboard,
  facebookShareUrl,
  getShareUrl,
  nativeShare,
  setShareEnabled,
  whatsappShareUrl,
} from "@/lib/share";
import { useI18n } from "@/lib/i18n";

type Variant = "original" | "remix";

/** A single selectable image inside an item's modal. */
interface ItemVariant {
  key: string;
  label: string;
  url: string;
  quote: string;
  caption: string | null;
  hashtags: string[];
  kind: Variant;
}

/** Unified item shape used by the UI. Wraps either a cloud row or a local draft. */
interface UIItem {
  key: string;
  source: "cloud" | "local";
  petName: string;
  styleId: DramaStyleId;
  petType: PetType;
  quote: string;
  caption: string | null;
  hashtags: string[];
  originalUrl: string;
  remixUrl?: string; // legacy single-remix preview (latest)
  variant: Variant;
  variants: ItemVariant[]; // ordered: Original, Remix 1, Remix 2, …
  // Source refs for delete
  cloud?: CloudGalleryItem;
  local?: DramaDraft;
}

function fileNameFor(item: UIItem, label: string) {
  const name = normalizePetName(item.petName).replace(/\s+/g, "-").toLowerCase() || "petdrama";
  const slug = label.toLowerCase().replace(/\s+/g, "-");
  return `petdrama-${name}-${slug}.png`;
}

function cloudToUI(c: CloudGalleryItem): UIItem {
  const variants: ItemVariant[] = [
    {
      key: `original`,
      label: "Original",
      url: c.originalSignedUrl,
      quote: c.quote,
      caption: c.caption,
      hashtags: c.hashtags,
      kind: "original",
    },
  ];
  // Legacy single remix slot (older items) — show first if no variant rows.
  if (c.remixSignedUrl && c.remixes.length === 0) {
    variants.push({
      key: `legacy-remix`,
      label: "Remix",
      url: c.remixSignedUrl,
      quote: c.quote,
      caption: c.caption,
      hashtags: c.hashtags,
      kind: "remix",
    });
  }
  c.remixes.forEach((r, i) => {
    variants.push({
      key: `remix-${r.id}`,
      label: `Remix ${i + 1}`,
      url: r.signedUrl,
      quote: r.quote || c.quote,
      caption: r.caption ?? c.caption,
      hashtags: r.hashtags?.length ? r.hashtags : c.hashtags,
      kind: "remix",
    });
  });
  // Latest remix becomes the card preview.
  const latestRemix = variants.filter((v) => v.kind === "remix").slice(-1)[0];
  return {
    key: `cloud-${c.id}`,
    source: "cloud",
    petName: c.pet_name,
    styleId: c.style_id,
    petType: c.pet_type,
    quote: c.quote,
    caption: c.caption,
    hashtags: c.hashtags,
    originalUrl: c.originalSignedUrl,
    remixUrl: latestRemix?.url,
    variant: latestRemix ? "remix" : c.variant,
    variants,
    cloud: c,
  };
}

function localToUI(d: DramaDraft): UIItem {
  const original = d.renderedDataUrl || d.imageDataUrl;
  const variants: ItemVariant[] = [
    {
      key: "original",
      label: "Original",
      url: original,
      quote: d.drama.quote,
      caption: d.drama.caption ?? null,
      hashtags: d.drama.hashtags ?? [],
      kind: "original",
    },
  ];
  if (d.remixRenderedDataUrl) {
    variants.push({
      key: "local-remix",
      label: "Remix",
      url: d.remixRenderedDataUrl,
      quote: d.drama.quote,
      caption: d.drama.caption ?? null,
      hashtags: d.drama.hashtags ?? [],
      kind: "remix",
    });
  }
  return {
    key: `local-${getGalleryItemId(d)}`,
    source: "local",
    petName: d.petName,
    styleId: d.styleId,
    petType: d.petType,
    quote: d.drama.quote,
    caption: d.drama.caption ?? null,
    hashtags: d.drama.hashtags ?? [],
    originalUrl: original,
    remixUrl: d.remixRenderedDataUrl,
    variant: d.variant === "remix" && d.remixRenderedDataUrl ? "remix" : "original",
    variants,
    local: d,
  };
}

export default function Gallery() {
  const [items, setItems] = useState<UIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [active, setActive] = useState<UIItem | null>(null);
  const [activeVariantKey, setActiveVariantKey] = useState<string>("original");
  const [pendingDelete, setPendingDelete] = useState<UIItem | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const { t } = useI18n();
  // Per-cloud-item share state, keyed by cloud row id. Mirrors DB after toggle.
  const [shareState, setShareState] = useState<Record<string, { enabled: boolean; slug: string | null }>>({});

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setIsAuthed(!!user);
      if (user) {
        const cloud = await listMyGallery();
        setItems(cloud.map(cloudToUI));
        const s: Record<string, { enabled: boolean; slug: string | null }> = {};
        for (const c of cloud) {
          s[c.id] = { enabled: !!c.share_enabled, slug: c.public_share_slug ?? null };
        }
        setShareState(s);
      } else {
        const local = loadGallery();
        setItems(local.map(localToUI));
      }
    } catch (err) {
      console.error("[PetDrama gallery load]", err);
      toast.error("Couldn't load your gallery.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const hasShare = typeof (navigator as any).share === "function";
    const isTouch =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(pointer: coarse)").matches ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
    setCanNativeShare(hasShare && isTouch);
  }, []);

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openItem = (item: UIItem) => {
    setActive(item);
    // Default to latest remix variant if any, otherwise original.
    const latestRemix = [...item.variants].reverse().find((v) => v.kind === "remix");
    setActiveVariantKey(latestRemix?.key ?? "original");
  };

  const handleDownload = async (item: UIItem, variant: Variant, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = variant === "remix" ? item.remixUrl : item.originalUrl;
    if (!url) {
      toast.error("This version isn't saved.");
      return;
    }
    try {
      await downloadUrlAsFile(url, fileNameFor(item, variant));
      toast.success("Downloaded!");
    } catch {
      toast.error("Couldn't download — please try again.");
    }
  };

  const handleToggleShare = async (item: UIItem, enable: boolean) => {
    if (item.source !== "cloud" || !item.cloud) {
      toast.error("Sign in to share creations.");
      return;
    }
    setShareBusy(true);
    try {
      const res = await setShareEnabled(item.cloud.id, enable);
      setShareState((prev) => ({
        ...prev,
        [item.cloud!.id]: { enabled: res.share_enabled, slug: res.slug },
      }));
      if (enable && res.slug) {
        try {
          await copyToClipboard(getShareUrl(res.slug));
          toast.success("Public link created and copied!");
        } catch {
          toast.success("Public link created.");
        }
      } else {
        toast.success("Sharing disabled.");
      }
    } catch (err: any) {
      console.error("[PetDrama share toggle]", err);
      toast.error(err?.message || "Couldn't update sharing.");
    } finally {
      setShareBusy(false);
    }
  };

  const handleCopyShare = async (slug: string) => {
    try {
      await copyToClipboard(getShareUrl(slug));
      toast.success("Link copied!");
    } catch {
      toast.error("Couldn't copy.");
    }
  };

  const handleNativeShare = async (item: UIItem, slug: string) => {
    const url = getShareUrl(slug);
    const fileUrl = item.variant === "remix" && item.remixUrl ? item.remixUrl : item.originalUrl;
    const ok = await nativeShare({
      url,
      title: `${normalizePetName(item.petName)} — PetDrama`,
      text: item.quote,
      fileUrl,
      fileName: fileNameFor(item, item.variant).replace(/\.png$/, ".webp"),
    });
    if (!ok) handleCopyShare(slug);
  };
  const requestDelete = (item: UIItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPendingDelete(item);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    if (target.source === "cloud" && target.cloud) {
      try {
        await deleteGalleryItem(target.cloud);
        setItems((prev) => prev.filter((it) => it.key !== target.key));
        if (active?.key === target.key) setActive(null);
        toast.success("Creation deleted");
      } catch (err: any) {
        console.error("[PetDrama gallery delete]", err);
        toast.error(err?.message || "Couldn't delete — please try again.");
      }
    } else if (target.source === "local" && target.local) {
      const snapshot = loadGallery();
      const next = deleteFromGallery(getGalleryItemId(target.local));
      setItems(next.map(localToUI));
      if (active?.key === target.key) setActive(null);
      toast.success("Creation deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            saveGallery(snapshot);
            setItems(snapshot.map(localToUI));
          },
        },
      });
    }
  };

  return (
    <PageShell>
      <section className="container py-10 md:py-16">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">{t("gallery.eyebrow")}</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              {t("gallery.title")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isAuthed
                ? t("gallery.accountSaved")
                : t("gallery.localSaved")}
            </p>
          </div>
          <Link to="/create">
            <StickerButton variant="primary">{t("gallery.newDrama")}</StickerButton>
          </Link>
        </div>

        {!isAuthed && !loading && (
          <StickerCard className="p-4 mb-8 bg-highlight">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-bold">
                {t("gallery.localOnly")}
              </p>
              <Link to="/login">
                <StickerButton variant="dark">{t("gallery.signIn")}</StickerButton>
              </Link>
            </div>
          </StickerCard>
        )}

        {loading ? (
          <div className="text-center text-sm font-bold uppercase tracking-widest text-muted-foreground py-12">
            {t("gallery.loading")}
          </div>
        ) : items.length === 0 ? (
          <StickerCard className="p-12 text-center bg-background">
            <div className="text-5xl mb-3">🎭</div>
            <h2 className="font-display text-2xl font-extrabold">{t("gallery.emptyTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("gallery.emptyBody")}</p>
            <Link to="/create" className="inline-block mt-6">
              <StickerButton variant="primary">{t("gallery.create")} →</StickerButton>
            </Link>
          </StickerCard>
        ) : (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 pt-4">
            {items.map((item, i) => {
              const s = getStyle(item.styleId);
              const tilt = [-3, 2, -1.5, 3, -2.5, 1.5][i % 6];
              const hasRemix = !!item.remixUrl;
              const preview = item.variant === "remix" && hasRemix ? item.remixUrl! : item.originalUrl;
              return (
                <StickerCard
                  key={item.key}
                  color="card"
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
                      aria-label="Download"
                    >
                      <Download className="size-3" /> {item.source === "cloud" ? "WEBP" : "PNG"}
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
            const variants = active.variants;
            const selected = variants.find((v) => v.key === activeVariantKey) ?? variants[0];
            const previewUrl = selected.url;
            const showVariants = variants.length > 1;
            return (
              <>
                <DialogTitle className="font-display text-xl font-extrabold">
                  {getStyle(active.styleId).emoji} {normalizePetName(active.petName)} —{" "}
                  {getStyle(active.styleId).name}
                </DialogTitle>
                <DialogDescription className="sr-only">{t("gallery.savedPreview")}</DialogDescription>

                {showVariants && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {variants.map((v) => {
                      const isActive = v.key === selected.key;
                      const isRemix = v.kind === "remix";
                      return (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => setActiveVariantKey(v.key)}
                          className={cn(
                            "rounded-full border-2 border-foreground px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider sticker-shadow-sm transition-transform hover:-translate-y-0.5",
                            isActive
                              ? isRemix
                                ? "bg-primary text-primary-foreground"
                                : "bg-foreground text-background"
                              : "bg-background text-foreground/80",
                          )}
                        >
                          {isRemix ? "✨ " : ""}{v.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-2 rounded-2xl overflow-hidden border-2 border-foreground bg-foreground/5">
                  <img
                    src={previewUrl}
                    alt={`${normalizePetName(active.petName)} as ${getStyle(active.styleId).name} (${selected.label})`}
                    className="w-full h-auto block"
                  />
                </div>
                {selected.quote && (
                  <p className="mt-3 font-display font-extrabold text-base leading-snug">
                    "{selected.quote}"
                  </p>
                )}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                  <StickerButton
                    variant="primary"
                    onClick={async () => {
                      try {
                        await downloadUrlAsFile(selected.url, fileNameFor(active, selected.label));
                        toast.success("Downloaded!");
                      } catch {
                        toast.error("Couldn't download — please try again.");
                      }
                    }}
                  >
                    ⬇ Download {selected.label}
                  </StickerButton>
                  <StickerButton
                    variant="ghost"
                    onClick={() => requestDelete(active)}
                    className="!bg-destructive !text-destructive-foreground"
                  >
                    <Trash2 className="size-4" /> Delete
                  </StickerButton>
                </div>

                {active.source === "cloud" && active.cloud && (() => {
                  const st = shareState[active.cloud.id] ?? {
                    enabled: !!active.cloud.share_enabled,
                    slug: active.cloud.public_share_slug ?? null,
                  };
                  const shareUrl = st.slug ? getShareUrl(st.slug) : "";
                  return (
                    <div className="mt-5 pt-4 border-t-2 border-dashed border-foreground/20">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-wider">{t("gallery.sharePublic")}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {st.enabled
                              ? t("gallery.anyoneLink")
                              : t("gallery.private")}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={shareBusy}
                          onClick={() => handleToggleShare(active, !st.enabled)}
                          className={cn(
                            "inline-flex items-center justify-center rounded-full border-2 border-foreground px-3 py-1.5 text-[11px] font-extrabold sticker-shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50",
                            st.enabled ? "bg-primary text-primary-foreground" : "bg-background",
                          )}
                        >
                          {st.enabled ? t("gallery.sharingOn") : t("gallery.enableShare")}
                        </button>
                      </div>

                      {st.enabled && st.slug && (
                        <>
                          <div className="flex items-center gap-2">
                            <input
                              readOnly
                              value={shareUrl}
                              onFocus={(e) => e.currentTarget.select()}
                              className="flex-1 min-w-0 rounded-full border-2 border-foreground bg-background px-3 py-1.5 text-xs font-bold sticker-shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleCopyShare(st.slug!)}
                              className="inline-flex items-center gap-1 rounded-full border-2 border-foreground bg-foreground text-background px-3 py-1.5 text-[11px] font-extrabold sticker-shadow-sm"
                              aria-label="Copy link"
                            >
                              <Copy className="size-3" /> {t("gallery.copy")}
                            </button>
                          </div>

                          <div className={cn("mt-3 grid gap-2", canNativeShare ? "grid-cols-3" : "grid-cols-2")}>
                            <a
                              href={whatsappShareUrl(shareUrl, `${normalizePetName(active.petName)} the ${getStyle(active.styleId).name} 🎭`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-foreground bg-[#25D366] text-foreground px-3 py-2 text-[11px] font-extrabold sticker-shadow-sm hover:-translate-y-0.5 transition-transform"
                            >
                              WhatsApp
                            </a>
                            <a
                              href={facebookShareUrl(shareUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-foreground bg-[#1877F2] text-background px-3 py-2 text-[11px] font-extrabold sticker-shadow-sm hover:-translate-y-0.5 transition-transform"
                            >
                              <Facebook className="size-3" /> Facebook
                            </a>
                            {canNativeShare && (
                              <button
                                type="button"
                                onClick={() => handleNativeShare(active, st.slug!)}
                                className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-foreground bg-background px-3 py-2 text-[11px] font-extrabold sticker-shadow-sm hover:-translate-y-0.5 transition-transform"
                              >
                                <Share2 className="size-3" /> Share
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("gallery.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && (
                <>
                  {t("gallery.deleteBodyBefore")} <strong>{normalizePetName(pendingDelete.petName)} —{" "}
                  {getStyle(pendingDelete.styleId).name}</strong> {t("gallery.deleteBodyAfter")}
                  {pendingDelete.source === "local" && ` ${t("gallery.undoHint")}`}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("gallery.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("gallery.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
