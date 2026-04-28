import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { generateDrama, getStyle, normalizePetName } from "@/lib/drama";
import { auditCreationAssets, loadDraft, saveDraft, saveToGallery, clearDraft, type DramaDraft } from "@/lib/storage";
import { renderDramaPng, downloadDataUrl } from "@/lib/render";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Variant = "original" | "remix";

export default function Result() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<DramaDraft | null>(null);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [remixRenderUrl, setRemixRenderUrl] = useState<string | null>(null);
  const [variant, setVariant] = useState<Variant>("original");
  const [isRemixing, setIsRemixing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPro] = useState(false); // mocked

  useEffect(() => {
    const d = loadDraft();
    if (!d) {
      navigate("/create", { replace: true });
      return;
    }
    // Backward compat: ensure quoteOptions / captionOptions exist
    const needsRefresh =
      !d.drama.quoteOptions ||
      d.drama.quoteOptions.length === 0 ||
      !d.drama.captionOptions ||
      d.drama.captionOptions.length === 0;
    if (needsRefresh) {
      const fresh = generateDrama(d.styleId, d.petName, d.petType);
      d.drama = {
        ...fresh,
        quote: d.drama.quote || fresh.quote,
        caption: d.drama.caption || fresh.caption,
      };
      saveDraft(d);
    }
    // Restore previously cached renders so Continue to result uses the exact persisted assets.
    if (d.renderedDataUrl) setRenderUrl(d.renderedDataUrl);
    if (d.remixRenderedDataUrl) setRemixRenderUrl(d.remixRenderedDataUrl);
    // Restore last-viewed variant (default original; only honor remix if a remix asset exists).
    if (d.variant === "remix" && (d.remixRenderedDataUrl || d.remixImageDataUrl)) setVariant("remix");
    auditCreationAssets("result-restore", d);
    setDraft(d);
  }, [navigate]);

  // Render the ORIGINAL card whenever quote/caption/photo changes.
  // Skip if renderUrl is already populated (restored from draft or pre-cached).
  useEffect(() => {
    if (!draft) return;
    if (renderUrl) return;
    let cancelled = false;
    renderDramaPng({
      imageDataUrl: draft.imageDataUrl,
      petName: normalizePetName(draft.petName),
      styleId: draft.styleId,
      quote: draft.drama.quote,
      caption: draft.drama.caption,
      watermark: !isPro,
      size: 1080,
    })
      .then((url) => {
        if (cancelled) return;
        setRenderUrl(url);
        // Persist into draft so navigating away/back keeps the same asset.
        const latest = loadDraft();
        if (latest && latest.creationId === draft.creationId) {
          saveDraft({ ...latest, renderedDataUrl: url });
        }
      })
      .catch(() => toast.error("Could not render preview."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, isPro]);

  // Render the REMIX card whenever the remix image or quote/caption changes.
  // Skip if remixRenderUrl is already populated (restored from draft or pre-rendered).
  useEffect(() => {
    if (!draft?.remixImageDataUrl) {
      if (!draft?.remixRenderedDataUrl) setRemixRenderUrl(null);
      return;
    }
    if (remixRenderUrl) return;
    let cancelled = false;
    renderDramaPng({
      imageDataUrl: draft.remixImageDataUrl,
      petName: normalizePetName(draft.petName),
      styleId: draft.styleId,
      quote: draft.drama.quote,
      caption: draft.drama.caption,
      watermark: !isPro,
      size: 1080,
    })
      .then((url) => {
        if (cancelled) return;
        setRemixRenderUrl(url);
        const latest = loadDraft();
        if (latest && latest.creationId === draft.creationId) {
          saveDraft({ ...latest, remixRenderedDataUrl: url, variant: latest.variant ?? draft.variant ?? "remix" });
        }
      })
      .catch(() => toast.error("Could not render remix preview."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, isPro]);

  const style = useMemo(() => (draft ? getStyle(draft.styleId) : null), [draft]);
  const displayName = useMemo(() => (draft ? normalizePetName(draft.petName) : ""), [draft]);

  const getLiveDraft = (baseDraft: DramaDraft): DramaDraft => {
    const latest = loadDraft();
    const sameLatest = latest?.creationId === baseDraft.creationId ? latest : null;
    return {
      ...baseDraft,
      renderedDataUrl: renderUrl ?? baseDraft.renderedDataUrl ?? sameLatest?.renderedDataUrl,
      remixImageDataUrl: baseDraft.remixImageDataUrl ?? sameLatest?.remixImageDataUrl,
      remixRenderedDataUrl: remixRenderUrl ?? baseDraft.remixRenderedDataUrl ?? sameLatest?.remixRenderedDataUrl,
      variant,
    };
  };

  if (!draft || !style) return null;

  const activeRenderUrl =
    variant === "remix"
      ? remixRenderUrl ?? draft.remixRenderedDataUrl ?? null
      : renderUrl ?? draft.renderedDataUrl ?? null;
  const hasRemix = !!(remixRenderUrl || draft.remixRenderedDataUrl || draft.remixImageDataUrl);

  // Persist a variant change so returning to Create -> Continue restores it.
  const switchVariant = (v: Variant) => {
    if (v === "remix" && !hasRemix) return;
    setVariant(v);
    if (draft && draft.variant !== v) {
      const liveDraft = getLiveDraft(draft);
      const updated = {
        ...liveDraft,
        variant: v,
      };
      saveDraft(updated);
      auditCreationAssets("result-switch-variant", updated);
      setDraft(updated);
    }
  };

  const onSelectQuote = (q: string) => {
    if (q === draft.drama.quote) return;
    const updated: DramaDraft = {
      ...draft,
      drama: { ...draft.drama, quote: q },
      // Cached renders are now stale — drop them from the persisted draft too.
      renderedDataUrl: undefined,
      remixRenderedDataUrl: undefined,
    };
    saveDraft(updated);
    setDraft(updated);
    setRenderUrl(null);
    setRemixRenderUrl(null);
  };

  const onSelectCaption = (c: string) => {
    if (c === draft.drama.caption) return;
    const updated: DramaDraft = {
      ...draft,
      drama: { ...draft.drama, caption: c },
      renderedDataUrl: undefined,
      remixRenderedDataUrl: undefined,
    };
    saveDraft(updated);
    setDraft(updated);
    setRenderUrl(null);
    setRemixRenderUrl(null);
  };

  const onDownload = () => {
    if (!activeRenderUrl) return;
    const tag = variant === "remix" ? "-remix" : "";
    downloadDataUrl(
      activeRenderUrl,
      `petdrama-${displayName.replace(/\s+/g, "-").toLowerCase()}${tag}.png`,
    );
    toast.success("Downloaded! Now post it 😎");
  };

  const onCopyCaption = async () => {
    const text = `${draft.drama.caption}\n\n${draft.drama.hashtags.join(" ")}`;
    await navigator.clipboard.writeText(text);
    toast.success("Caption copied to clipboard.");
  };

  const onRegenerate = () => {
    const next = generateDrama(draft.styleId, draft.petName, draft.petType);
    const updated: DramaDraft = {
      ...draft,
      drama: next,
      createdAt: Date.now(),
      renderedDataUrl: undefined,
      remixRenderedDataUrl: undefined,
    };
    saveDraft(updated);
    setDraft(updated);
    setRenderUrl(null);
    setRemixRenderUrl(null);
  };

  const onDramaRemix = async () => {
    if (isRemixing) return;
    setIsRemixing(true);
    try {
      const { data, error } = await supabase.functions.invoke("drama-remix", {
        body: {
          imageDataUrl: draft.imageDataUrl,
          styleId: draft.styleId,
          petType: draft.petType,
        },
      });

      // Try to read structured error from the function response body
      let serverError: string | undefined;
      let serverStatus: number | undefined;
      if (error) {
        serverStatus = (error as any)?.context?.status;
        try {
          const body = await (error as any)?.context?.response?.clone?.().json?.();
          serverError = body?.error;
        } catch {
          /* ignore */
        }
      }

      const remixUrl = (data as { imageDataUrl?: string })?.imageDataUrl;

      if (!remixUrl) {
        const msg =
          serverStatus === 429
            ? "AI is busy. Please try again in a moment."
            : serverStatus === 402
            ? "AI credits exhausted. Add credits to continue."
            : serverError || (data as any)?.error || "Drama Remix failed. Please try again.";
        toast.error(msg);
        return; // keep original card; do NOT throw
      }

      // Pre-render the remix card so the preview swap is instant.
      let renderedRemix: string | null = null;
      try {
        renderedRemix = await renderDramaPng({
          imageDataUrl: remixUrl,
          petName: normalizePetName(draft.petName),
          styleId: draft.styleId,
          quote: draft.drama.quote,
          caption: draft.drama.caption,
          watermark: !isPro,
          size: 1080,
        });
      } catch {
        /* fall back to effect-based render */
      }

      const liveDraft = getLiveDraft(draft);
      const updated: DramaDraft = {
        ...liveDraft,
        remixImageDataUrl: remixUrl,
        remixRenderedDataUrl: renderedRemix ?? liveDraft.remixRenderedDataUrl,
        variant: "remix",
      };
      saveDraft(updated);
      auditCreationAssets("result-remix-ready", updated);
      setDraft(updated);
      if (updated.renderedDataUrl && !renderUrl) setRenderUrl(updated.renderedDataUrl);
      if (renderedRemix) setRemixRenderUrl(renderedRemix);
      setVariant("remix");
      toast.success("Drama Remix ready ✨");
    } catch (e: any) {
      console.error("Drama Remix error:", e);
      toast.error("Drama Remix failed. Please try again.");
    } finally {
      setIsRemixing(false);
    }
  };

  const onSaveToGallery = async () => {
    if (isSaving) return; // prevent double-click duplicate saves
    setIsSaving(true);
    try {
      const liveDraft = getLiveDraft(draft);
      const common = {
        petName: normalizePetName(liveDraft.petName),
        styleId: liveDraft.styleId,
        quote: liveDraft.drama.quote,
        caption: liveDraft.drama.caption,
        watermark: !isPro,
        size: 1080 as const,
      };
      // Ensure the original render exists & matches current quote/caption.
      const finalOriginal =
        liveDraft.renderedDataUrl ??
        (await renderDramaPng({ ...common, imageDataUrl: liveDraft.imageDataUrl }));
      // Ensure remix render exists if a remix image is present.
      let finalRemix: string | undefined = liveDraft.remixRenderedDataUrl ?? undefined;
      if (liveDraft.remixImageDataUrl && !finalRemix) {
        finalRemix = await renderDramaPng({
          ...common,
          imageDataUrl: liveDraft.remixImageDataUrl,
        });
      }
      // Cache them locally so toggle/download use the exact same asset.
      if (!renderUrl) setRenderUrl(finalOriginal);
      if (finalRemix && !remixRenderUrl) setRemixRenderUrl(finalRemix);

      // Persist renders + saved flag into the active draft so navigating
      // away (Gallery / Create) and back keeps the same exact assets.
      const persisted: DramaDraft = {
        ...liveDraft,
        renderedDataUrl: finalOriginal,
        remixRenderedDataUrl: finalRemix ?? liveDraft.remixRenderedDataUrl,
        variant,
        savedToGallery: true,
      };
      saveDraft(persisted);
      setDraft(persisted);

      saveToGallery(persisted);
      auditCreationAssets("result-save-to-gallery", persisted, [persisted]);
      toast.success("Saved to your gallery.");
    } catch {
      toast.error("Couldn't save — please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageShell>
      <section className="container pt-16 md:pt-24 pb-10 md:pb-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Result</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              Meet <span className="text-primary">{displayName}</span>, {style.name.toLowerCase()}.
            </h1>
          </div>
          <StickerButton
            variant="ghost"
            onClick={() => {
              clearDraft();
              navigate("/create");
            }}
          >
            ← New drama
          </StickerButton>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Preview */}
          <div className="lg:col-span-7 space-y-3">
            {/* Variant toggle */}
            {hasRemix && (
              <div className="inline-flex rounded-full border-2 border-foreground bg-background p-1 sticker-shadow-sm">
                <button
                  type="button"
                  onClick={() => switchVariant("original")}
                  className={cn(
                    "px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-full transition-colors",
                    variant === "original" ? "bg-foreground text-background" : "text-foreground/70",
                  )}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => switchVariant("remix")}
                  className={cn(
                    "px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-full transition-colors",
                    variant === "remix" ? "bg-primary text-primary-foreground" : "text-foreground/70",
                  )}
                >
                  ✨ Remix
                </button>
              </div>
            )}

            <StickerCard className="p-3 md:p-4 bg-background" shadow="lg">
              <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-foreground bg-foreground/5">
                {activeRenderUrl ? (
                  <img
                    src={activeRenderUrl}
                    alt={`${displayName} as ${style.name}${variant === "remix" ? " (remix)" : ""}`}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                    <div className="text-center">
                      <div className="text-4xl inline-block">🎭</div>
                      <p className="mt-3 font-bold">
                        {variant === "remix" ? "Rendering remix…" : "Rendering your masterpiece…"}
                      </p>
                    </div>
                  </div>
                )}
                {isRemixing && (
                  <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-4xl animate-pulse">✨</div>
                      <p className="mt-3 font-extrabold">Cooking up the Drama Remix…</p>
                      <p className="mt-1 text-xs text-muted-foreground">Usually 5–15 seconds</p>
                    </div>
                  </div>
                )}
              </div>
            </StickerCard>

            {/* Drama Remix CTA — only when no remix yet */}
            {!hasRemix && (
              <div className="rounded-2xl border-2 border-dashed border-foreground/30 p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-display font-extrabold text-base">✨ Drama Remix</p>
                  <p className="text-xs text-muted-foreground">
                    Stylize the photo to match {style.name}. Same pet, new vibe.
                  </p>
                </div>
                <StickerButton variant="primary" onClick={onDramaRemix} disabled={isRemixing}>
                  {isRemixing ? "Remixing…" : "✨ Drama Remix"}
                </StickerButton>
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quote picker */}
            <StickerCard className="p-5 md:p-6 bg-highlight">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">Pick your quote</p>
                <button
                  onClick={onRegenerate}
                  className="text-xs font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 hover:opacity-70"
                >
                  🔄 New batch
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {draft.drama.quoteOptions.map((q, i) => {
                  const active = q === draft.drama.quote;
                  return (
                    <button
                      key={i}
                      onClick={() => onSelectQuote(q)}
                      className={cn(
                        "w-full text-left rounded-2xl border-2 border-foreground p-4 transition-all",
                        active
                          ? "bg-foreground text-background sticker-shadow-sm translate-x-[-1px] translate-y-[-1px]"
                          : "bg-background hover:-translate-y-0.5",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-foreground text-[11px] font-extrabold",
                            active ? "bg-primary text-primary-foreground" : "bg-card",
                          )}
                        >
                          {active ? "✓" : i + 1}
                        </span>
                        <p className="font-display text-base md:text-lg font-extrabold leading-snug">
                          “{q}”
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </StickerCard>

            <StickerCard className="p-5 md:p-6 bg-background">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pick your caption</p>
              <div className="mt-3 space-y-2.5">
                {draft.drama.captionOptions.map((c, i) => {
                  const active = c === draft.drama.caption;
                  return (
                    <button
                      key={i}
                      onClick={() => onSelectCaption(c)}
                      className={cn(
                        "w-full text-left rounded-2xl border-2 border-foreground p-3.5 transition-all",
                        active
                          ? "bg-primary text-primary-foreground sticker-shadow-sm translate-x-[-1px] translate-y-[-1px]"
                          : "bg-card hover:-translate-y-0.5",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-foreground text-[10px] font-extrabold",
                            active ? "bg-foreground text-background" : "bg-background",
                          )}
                        >
                          {active ? "✓" : i + 1}
                        </span>
                        <p className="text-sm md:text-base leading-snug font-medium">{c}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {draft.drama.hashtags.map((h) => (
                  <span key={h} className="rounded-full border-2 border-foreground bg-card px-3 py-1 text-xs font-bold">
                    {h}
                  </span>
                ))}
              </div>
            </StickerCard>

            <div className="grid grid-cols-2 gap-3">
              <StickerButton variant="primary" onClick={onDownload} disabled={!activeRenderUrl}>
                ⬇ Download {variant === "remix" ? "Remix" : "PNG"}
              </StickerButton>
              <StickerButton variant="secondary" onClick={onCopyCaption}>
                📋 Copy caption
              </StickerButton>
              {hasRemix ? (
                <StickerButton variant="ghost" onClick={onDramaRemix} disabled={isRemixing}>
                  {isRemixing ? "Remixing…" : "✨ Re-remix"}
                </StickerButton>
              ) : (
                <StickerButton variant="ghost" onClick={onRegenerate}>
                  🔄 Generate again
                </StickerButton>
              )}
              <StickerButton variant="dark" onClick={onSaveToGallery} disabled={isSaving}>
                {isSaving ? "Saving…" : "✦ Save to gallery"}
              </StickerButton>
            </div>

            {!isPro && (
              <div className="rounded-2xl border-2 border-dashed border-foreground/30 p-4 text-sm">
                <p>
                  <span className="font-bold">Free plan:</span> includes a small "Made with PetDrama" watermark.{" "}
                  <Link to="/pricing" className="font-bold underline decoration-primary decoration-4 underline-offset-2">
                    Upgrade to remove it
                  </Link>
                  .
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Imaginary pet thoughts · For entertainment only · We do not actually translate animals.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
