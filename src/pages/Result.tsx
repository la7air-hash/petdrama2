import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { UpgradeModal, type UpgradeReason } from "@/components/UpgradeModal";
import { ProBadge } from "@/components/ProBadge";
import { useEntitlements } from "@/hooks/use-entitlements";
import { checkUsage } from "@/lib/usage";
import { generateDrama, getStyle, normalizePetName } from "@/lib/drama";
import { auditCreationAssets, loadDraft, loadGallery, saveDraft, saveToGallery, clearDraft, type DramaDraft } from "@/lib/storage";
import { renderDramaPng, downloadDataUrl } from "@/lib/render";
import { supabase } from "@/integrations/supabase/client";
import { saveGalleryItem, getCurrentUserId } from "@/lib/gallery-cloud";
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
  const { isPro, refresh: refreshEntitlements } = useEntitlements();
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason | null>(null);

  useEffect(() => {
    const current = loadDraft();
    if (!current) {
      navigate("/create", { replace: true });
      return;
    }
    // Look for a richer copy of the same creation in the gallery — if the
    // current draft lost remix fields somewhere, recover them from gallery.
    const galleryMatch = loadGallery().find((g) => g.creationId === current.creationId) ?? null;

    let source: "currentDraft" | "gallery" | "merged" = "currentDraft";
    let d: DramaDraft = current;
    if (galleryMatch) {
      const currentMissingRemix =
        !current.remixRenderedDataUrl && !current.remixImageDataUrl;
      const galleryHasRemix =
        !!galleryMatch.remixRenderedDataUrl || !!galleryMatch.remixImageDataUrl;
      if (currentMissingRemix && galleryHasRemix) {
        // Pure recovery from gallery for the missing remix bits.
        d = {
          ...current,
          renderedDataUrl: current.renderedDataUrl ?? galleryMatch.renderedDataUrl,
          remixImageDataUrl: galleryMatch.remixImageDataUrl,
          remixRenderedDataUrl: galleryMatch.remixRenderedDataUrl,
          variant: galleryMatch.variant ?? current.variant,
          savedToGallery: current.savedToGallery ?? galleryMatch.savedToGallery,
        };
        source = "merged";
        // Persist the recovered state so subsequent restores are clean.
        saveDraft(d);
      } else if (galleryHasRemix && !current.remixRenderedDataUrl && current.remixImageDataUrl) {
        // Edge case: have remix image but lost the rendered card.
        d = { ...current, remixRenderedDataUrl: galleryMatch.remixRenderedDataUrl };
        source = "merged";
        saveDraft(d);
      }
    }

    // Backward compat: ensure quoteOptions / captionOptions exist
    const needsRefresh =
      !d.drama.quoteOptions ||
      d.drama.quoteOptions.length === 0 ||
      !d.drama.captionOptions ||
      d.drama.captionOptions.length === 0;
    if (needsRefresh) {
      const fresh = generateDrama(d.styleId, d.petName, d.petType);
      d = {
        ...d,
        drama: {
          ...fresh,
          quote: d.drama.quote || fresh.quote,
          caption: d.drama.caption || fresh.caption,
        },
      };
      saveDraft(d);
    }
    // Restore previously cached renders so Continue to result uses the exact persisted assets.
    if (d.renderedDataUrl) setRenderUrl(d.renderedDataUrl);
    if (d.remixRenderedDataUrl) setRemixRenderUrl(d.remixRenderedDataUrl);
    // Default variant to remix when remix exists; only honor explicit "original" choice.
    const hasAnyRemix = !!(d.remixRenderedDataUrl || d.remixImageDataUrl);
    if (hasAnyRemix) {
      // If the persisted variant is remix OR unset, show remix. Only "original" forces original.
      if (d.variant !== "original") setVariant("remix");
    }

    console.info("[PetDrama restore source]", {
      creationId: d.creationId,
      source,
      hasOriginal: !!d.renderedDataUrl,
      hasRemixImage: !!d.remixImageDataUrl,
      hasRemixRender: !!d.remixRenderedDataUrl,
      variant: d.variant ?? (hasAnyRemix ? "remix" : "original"),
    });
    console.info("[PetDrama restore on Result]", {
      creationId: d.creationId,
      hasOriginal: !!d.renderedDataUrl,
      hasRemixImage: !!d.remixImageDataUrl,
      hasRemixRender: !!d.remixRenderedDataUrl,
      variant: d.variant ?? "original",
      savedToGallery: !!d.savedToGallery,
      quote: d.drama?.quote,
      caption: d.drama?.caption,
    });
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

  // Reconcile React state with localStorage. Storage is the source of truth
  // for assets — React state is the source of truth for the active variant
  // and any in-flight render URLs not yet persisted.
  const getLiveDraft = (baseDraft: DramaDraft): DramaDraft => {
    const stored = loadDraft();
    const sameStored = stored?.creationId === baseDraft.creationId ? stored : null;
    // Start from stored (most complete) when available, then layer baseDraft
    // (current React state for drama text, etc), then in-flight render URLs.
    const merged: DramaDraft = {
      ...(sameStored ?? {} as DramaDraft),
      ...baseDraft,
      // Asset URLs: prefer the freshest non-null value.
      renderedDataUrl:
        renderUrl ?? baseDraft.renderedDataUrl ?? sameStored?.renderedDataUrl,
      remixImageDataUrl:
        baseDraft.remixImageDataUrl ?? sameStored?.remixImageDataUrl,
      remixRenderedDataUrl:
        remixRenderUrl ?? baseDraft.remixRenderedDataUrl ?? sameStored?.remixRenderedDataUrl,
      variant,
      savedToGallery: baseDraft.savedToGallery ?? sameStored?.savedToGallery,
    };
    return merged;
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

  const onRegenerate = async () => {
    const gate = await checkUsage("regenerate");
    if (!gate.ok) {
      const err = gate.error;
      if (err === "anon_limit" || err === "daily_limit_reached" || err === "monthly_limit_reached" || err === "pro_only") {
        setUpgradeReason(err);
      } else {
        toast.error("Could not regenerate. Please try again.");
      }
      return;
    }
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
    refreshEntitlements();
  };

  const onDramaRemix = async () => {
    if (isRemixing) return;
    if (!isPro) { setUpgradeReason("pro_only"); return; }
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
        if (serverStatus === 403 && serverError === "pro_only") {
          setUpgradeReason("pro_only");
          return;
        }
        if (serverStatus === 402 && serverError === "monthly_limit_reached") {
          setUpgradeReason("monthly_limit_reached");
          return;
        }
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
        savedToGallery: false,
        variant: "remix",
      };
      saveDraft(updated);
      auditCreationAssets("result-remix-ready", updated);
      setDraft(updated);
      if (updated.renderedDataUrl && !renderUrl) setRenderUrl(updated.renderedDataUrl);
      if (renderedRemix) setRemixRenderUrl(renderedRemix);
      setVariant("remix");
      toast.success("Drama Remix ready ✨");
      refreshEntitlements();
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
      // Always ensure the original render exists.
      const finalOriginal =
        liveDraft.renderedDataUrl ??
        (await renderDramaPng({ ...common, imageDataUrl: liveDraft.imageDataUrl }));

      // If a remix image exists, the remix render MUST exist too — render it now if missing.
      let finalRemix: string | undefined = liveDraft.remixRenderedDataUrl ?? undefined;
      if (liveDraft.remixImageDataUrl && !finalRemix) {
        finalRemix = await renderDramaPng({
          ...common,
          imageDataUrl: liveDraft.remixImageDataUrl,
        });
      }

      // Hard requirement: when remix exists, both assets must be present before we mark saved.
      if (liveDraft.remixImageDataUrl && !finalRemix) {
        toast.error("Remix asset isn't ready yet — try again in a moment.");
        return;
      }

      // Cache renders locally so toggle/download use the same exact asset.
      setRenderUrl(finalOriginal);
      if (finalRemix) setRemixRenderUrl(finalRemix);

      // Build the canonical persisted creation. This single object is the
      // source of truth for: active draft, gallery card, gallery modal, downloads.
      const persisted: DramaDraft = {
        ...liveDraft,
        renderedDataUrl: finalOriginal,
        remixImageDataUrl: liveDraft.remixImageDataUrl,
        remixRenderedDataUrl: finalRemix ?? liveDraft.remixRenderedDataUrl,
        variant,
        savedToGallery: true,
      };

      // Verification log BEFORE writing — confirms both assets are in the payload.
      console.info("[PetDrama save payload]", {
        creationId: persisted.creationId,
        hasOriginal: !!persisted.renderedDataUrl,
        hasRemixImage: !!persisted.remixImageDataUrl,
        hasRemixRender: !!persisted.remixRenderedDataUrl,
        variant: persisted.variant,
      });
      if (persisted.remixImageDataUrl && !persisted.remixRenderedDataUrl) {
        toast.error("Remix render missing from save payload.");
        return;
      }

      saveDraft(persisted);

      // Auth-aware: logged in → cloud; anonymous → localStorage (existing behavior).
      const userId = await getCurrentUserId();
      if (userId) {
        try {
          await saveGalleryItem({
            draft: persisted,
            originalDataUrl: finalOriginal,
            remixDataUrl: finalRemix,
          });
          setDraft(persisted);
          toast.success(
            persisted.remixRenderedDataUrl
              ? "Original + Remix saved to your account gallery."
              : "Original saved to your account gallery.",
          );
        } catch (cloudErr: any) {
          console.error("[PetDrama cloud save error]", cloudErr);
          toast.error(cloudErr?.message || "Couldn't save to your gallery — please try again.");
        }
      } else {
        try {
          const stored = saveToGallery(persisted);
          setDraft(persisted);
          auditCreationAssets("result-save-to-gallery", persisted, [stored]);
          toast.success(
            persisted.remixRenderedDataUrl
              ? "Original + Remix saved to this device. Sign in to save permanently."
              : "Original saved to this device. Sign in to save permanently.",
          );
        } catch (saveErr: any) {
          console.error("[PetDrama save error]", saveErr);
          toast.error(saveErr?.message || "Couldn't save to gallery — please try again.");
        }
      }
    } catch (e) {
      console.error("[PetDrama save error]", e);
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
