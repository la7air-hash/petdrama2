import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { generateDrama, getStyle } from "@/lib/drama";
import { loadDraft, saveDraft, saveToGallery, type DramaDraft } from "@/lib/storage";
import { renderDramaPng, downloadDataUrl } from "@/lib/render";
import { toast } from "sonner";

export default function Result() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<DramaDraft | null>(null);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [isPro] = useState(false); // mocked

  useEffect(() => {
    const d = loadDraft();
    if (!d) {
      navigate("/create", { replace: true });
      return;
    }
    setDraft(d);
  }, [navigate]);

  useEffect(() => {
    if (!draft) return;
    let cancelled = false;
    renderDramaPng({
      imageDataUrl: draft.imageDataUrl,
      petName: draft.petName,
      styleId: draft.styleId,
      quote: draft.drama.quote,
      watermark: !isPro,
      size: 1080,
    })
      .then((url) => {
        if (!cancelled) setRenderUrl(url);
      })
      .catch(() => toast.error("Could not render preview."));
    return () => {
      cancelled = true;
    };
  }, [draft, isPro]);

  if (!draft) return null;

  const style = getStyle(draft.styleId);

  const onDownload = () => {
    if (!renderUrl) return;
    downloadDataUrl(renderUrl, `petdrama-${draft.petName.replace(/\s+/g, "-").toLowerCase()}.png`);
    toast.success("Downloaded! Now post it 😎");
  };

  const onCopyCaption = async () => {
    const text = `${draft.drama.caption}\n\n${draft.drama.hashtags.join(" ")}`;
    await navigator.clipboard.writeText(text);
    toast.success("Caption copied to clipboard.");
  };

  const onRegenerate = () => {
    const next = generateDrama(draft.styleId, draft.petName);
    const updated: DramaDraft = { ...draft, drama: next, createdAt: Date.now() };
    saveDraft(updated);
    setDraft(updated);
    setRenderUrl(null);
  };

  const onSaveToGallery = () => {
    saveToGallery(draft);
    toast.success("Saved to your gallery.");
  };

  return (
    <PageShell>
      <section className="container py-10 md:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Result</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              Meet <span className="text-primary">{draft.petName}</span>, {style.name.toLowerCase()}.
            </h1>
          </div>
          <Link to="/create">
            <StickerButton variant="ghost">← New drama</StickerButton>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Preview */}
          <div className="lg:col-span-7">
            <StickerCard className="p-3 md:p-4 bg-background" shadow="lg">
              <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-foreground bg-foreground/5">
                {renderUrl ? (
                  <img src={renderUrl} alt={`${draft.petName} as ${style.name}`} className="size-full object-cover" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                    <div className="text-center">
                      <div className="text-4xl animate-wiggle inline-block">🎭</div>
                      <p className="mt-3 font-bold">Rendering your masterpiece…</p>
                    </div>
                  </div>
                )}
              </div>
            </StickerCard>
          </div>

          {/* Side panel */}
          <div className="lg:col-span-5 space-y-6">
            <StickerCard className="p-6 bg-highlight">
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">The dramatic quote</p>
              <p className="mt-3 font-display text-2xl md:text-3xl font-extrabold leading-tight">
                "{draft.drama.quote}"
              </p>
            </StickerCard>

            <StickerCard className="p-6 bg-background">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Social caption</p>
              <p className="mt-2 text-base md:text-lg leading-relaxed">{draft.drama.caption}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {draft.drama.hashtags.map((h) => (
                  <span key={h} className="rounded-full border-2 border-foreground bg-card px-3 py-1 text-xs font-bold">
                    {h}
                  </span>
                ))}
              </div>
            </StickerCard>

            <div className="grid grid-cols-2 gap-3">
              <StickerButton variant="primary" onClick={onDownload} disabled={!renderUrl}>
                ⬇ Download PNG
              </StickerButton>
              <StickerButton variant="secondary" onClick={onCopyCaption}>
                📋 Copy caption
              </StickerButton>
              <StickerButton variant="ghost" onClick={onRegenerate}>
                🔄 Generate again
              </StickerButton>
              <StickerButton variant="dark" onClick={onSaveToGallery}>
                ✦ Save to gallery
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
