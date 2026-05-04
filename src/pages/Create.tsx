import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { DRAMA_STYLES, PET_TYPES, generateDrama, type DramaStyleId, type PetType } from "@/lib/drama";
import { saveDraft, loadDraft, clearDraft, newCreationId } from "@/lib/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Create() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState<PetType>("dog");
  const [styleId, setStyleId] = useState<DramaStyleId>("drama-queen");
  const [dragOver, setDragOver] = useState(false);
  const [generating, setGenerating] = useState(false);
  // Track the active draft so re-saving with the same inputs reuses creationId
  // (no duplicate gallery items) but explicit "Start over" mints a fresh one.
  const [activeCreationId, setActiveCreationId] = useState<string | null>(null);
  // True if the restored draft was already saved to the gallery — in that case
  // any new Generate must mint a fresh creationId so we never overwrite the
  // gallery item the user already saved.
  const [activeSavedToGallery, setActiveSavedToGallery] = useState(false);
  const [restored, setRestored] = useState(false);
  // True when the restored draft already contains a generated result that the
  // user can jump back into without regenerating.
  const [hasGeneratedResult, setHasGeneratedResult] = useState(false);
  // Snapshot of inputs at restore-time. If current inputs diverge, the existing
  // result is considered outdated and we prompt the user before regenerating.
  const [restoredSnapshot, setRestoredSnapshot] = useState<
    { imageDataUrl: string; petName: string; petType: PetType; styleId: DramaStyleId } | null
  >(null);

  // Restore the previous draft (if any) on mount so navigating away and back
  // doesn't lose the user's work — including the full generated result.
  useEffect(() => {
    const d = loadDraft();
    if (d) {
      setImageDataUrl(d.imageDataUrl);
      setPetName(d.petName);
      setPetType(d.petType);
      setStyleId(d.styleId);
      setActiveCreationId(d.creationId);
      setActiveSavedToGallery(!!d.savedToGallery);
      setRestored(true);
      // A draft is only saved once the user has generated, so any restored
      // draft has a result we can continue to.
      setHasGeneratedResult(true);
      setRestoredSnapshot({
        imageDataUrl: d.imageDataUrl,
        petName: d.petName,
        petType: d.petType,
        styleId: d.styleId,
      });
    }
  }, []);

  // Inputs differ from the snapshot taken when we restored → result is stale.
  const isOutdated =
    hasGeneratedResult &&
    !!restoredSnapshot &&
    (restoredSnapshot.imageDataUrl !== imageDataUrl ||
      restoredSnapshot.petName !== petName ||
      restoredSnapshot.petType !== petType ||
      restoredSnapshot.styleId !== styleId);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, etc).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImageDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const canGenerate = !!imageDataUrl && petName.trim().length > 0;

  const onStartOver = () => {
    clearDraft();
    setImageDataUrl(null);
    setPetName("");
    setPetType("dog");
    setStyleId("drama-queen");
    setActiveCreationId(null);
    setRestored(false);
    setHasGeneratedResult(false);
    setRestoredSnapshot(null);
    toast.success("Started a fresh drama.");
  };

  const onContinueToResult = () => navigate("/result");

  const onGenerate = () => {
    if (!canGenerate || !imageDataUrl) return;
    // Outdated → confirm before discarding the existing result.
    if (isOutdated) {
      const ok = window.confirm(
        "You changed something since the last drama. Generate a new one? Your previous result will be replaced.",
      );
      if (!ok) return;
    }
    setGenerating(true);
    setTimeout(() => {
      const drama = generateDrama(styleId, petName, petType);
      // Reuse the active creationId so the same draft updates in place;
      // a brand-new draft (after Start over) gets a fresh id.
      const creationId = activeCreationId ?? newCreationId();
      saveDraft({
        creationId,
        imageDataUrl,
        petName: petName.trim(),
        petType,
        styleId,
        drama,
        createdAt: Date.now(),
      });
      setActiveCreationId(creationId);
      navigate("/result");
    }, 600);
  };

  return (
    <PageShell>
      <section className="container py-10 md:py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Step 1 · 2 · 3</p>
            <h1 className="mt-2 font-display text-4xl md:text-6xl font-extrabold tracking-tight">
              Create your pet's drama.
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground text-lg">
              Upload a photo, name them, pick a vibe. We'll generate imaginary pet thoughts in seconds — entertainment only.
            </p>
            {restored && !isOutdated && (
              <p className="mt-2 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-highlight px-3 py-1 text-xs font-extrabold uppercase tracking-wider sticker-shadow-sm">
                ✦ Continuing your last drama
              </p>
            )}
            {restored && isOutdated && (
              <p className="mt-2 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-secondary text-secondary-foreground px-3 py-1 text-xs font-extrabold uppercase tracking-wider sticker-shadow-sm">
                ⚠ Inputs changed · result is outdated
              </p>
            )}
          </div>
          {(restored || imageDataUrl || petName) && (
            <StickerButton variant="ghost" onClick={onStartOver}>
              ↺ Start over
            </StickerButton>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Upload */}
          <div className="lg:col-span-5">
            <SectionHeader n="1" title="Upload a pet photo" color="bg-highlight" />
            <StickerCard className="mt-4 p-3 bg-background">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative aspect-square rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-colors",
                  dragOver ? "border-primary bg-primary/5" : "border-foreground/40 bg-card",
                )}
              >
                {imageDataUrl ? (
                  <>
                    <img src={imageDataUrl} alt="Your pet" className="size-full object-cover" />
                    <div className="absolute inset-0 glossy pointer-events-none" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageDataUrl(null);
                      }}
                      className="absolute top-3 right-3 rounded-full border-2 border-foreground bg-background px-3 py-1 text-xs font-bold uppercase sticker-shadow-sm"
                    >
                      Change
                    </button>
                  </>
                ) : (
                  <div className="text-center px-6">
                    <div className="text-5xl mb-3">📸</div>
                    <p className="font-display font-extrabold text-xl">Drop a photo here</p>
                    <p className="mt-1 text-sm text-muted-foreground">or click to browse · JPG / PNG · up to 8MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </div>
            </StickerCard>
          </div>

          {/* Pet info + style */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <SectionHeader n="2" title="Tell us about your pet" color="bg-primary text-primary-foreground" />
              <StickerCard className="mt-4 p-6 bg-background space-y-5">
                <div>
                  <label htmlFor="petName" className="text-xs font-bold uppercase tracking-widest">Pet name</label>
                  <input
                    id="petName"
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="e.g. Sir Whiskerton"
                    maxLength={28}
                    className="mt-2 w-full rounded-xl border-2 border-foreground bg-card px-4 py-3 font-medium focus:outline-none focus:ring-4 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest">Pet type</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PET_TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setPetType(t.id)}
                        className={cn(
                          "rounded-full border-2 border-foreground px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5",
                          petType === t.id ? "bg-foreground text-background sticker-shadow-sm" : "bg-card",
                        )}
                      >
                        <span className="mr-1">{t.emoji}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </StickerCard>
            </div>

            <div>
              <SectionHeader n="3" title="Pick a drama style" color="bg-secondary text-secondary-foreground" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {DRAMA_STYLES.map((s) => {
                  const active = styleId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStyleId(s.id)}
                      className={cn(
                        "group relative text-left rounded-2xl border-2 border-foreground p-4 transition-all",
                        active
                          ? "bg-foreground text-background sticker-shadow translate-x-[-1px] translate-y-[-1px]"
                          : "bg-background hover:-translate-y-0.5 hover:sticker-shadow-sm",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-2xl">{s.emoji}</div>
                          <p className="mt-1 font-display font-extrabold text-lg leading-tight">{s.name}</p>
                          <p className={cn("text-xs mt-0.5", active ? "text-background/70" : "text-muted-foreground")}>
                            {s.tagline}
                          </p>
                        </div>
                        {s.isPro && (
                          <span className="rounded-full border-2 border-foreground bg-highlight text-highlight-foreground px-2 py-0.5 text-[10px] font-bold uppercase">
                            Pro
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky generate bar */}
        <div className="sticky bottom-4 mt-12 z-30">
          <StickerCard className="p-4 md:p-5 bg-background flex flex-col sm:flex-row items-center justify-between gap-4" shadow="lg">
            <div className="text-sm">
              <p className="font-display font-extrabold text-lg leading-tight">
                {hasGeneratedResult && !isOutdated
                  ? "Your drama is ready."
                  : isOutdated
                  ? "Inputs changed — regenerate to apply."
                  : canGenerate
                  ? "Ready to make some chaos."
                  : "Add a photo + name to continue."}
              </p>
              <p className="text-muted-foreground text-xs">
                Imaginary pet thoughts · For entertainment only
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {hasGeneratedResult && (
                <StickerButton
                  variant={isOutdated ? "ghost" : "primary"}
                  size="lg"
                  onClick={onContinueToResult}
                  className="w-full sm:w-auto"
                >
                  → Continue to result
                </StickerButton>
              )}
              <StickerButton
                variant={hasGeneratedResult && !isOutdated ? "ghost" : "primary"}
                size="lg"
                disabled={!canGenerate || generating}
                onClick={onGenerate}
                className="w-full sm:w-auto"
              >
                {generating
                  ? "Generating drama…"
                  : hasGeneratedResult
                  ? isOutdated
                    ? "🔄 Regenerate"
                    : "🔄 New drama with same inputs"
                  : "Generate Pet Drama →"}
              </StickerButton>
            </div>
          </StickerCard>
        </div>
      </section>
    </PageShell>
  );
}

function SectionHeader({ n, title, color }: { n: string; title: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("size-9 rounded-xl border-2 border-foreground flex items-center justify-center font-display text-lg font-extrabold sticker-shadow-sm", color)}>
        {n}
      </span>
      <h2 className="font-display text-xl md:text-2xl font-extrabold">{title}</h2>
    </div>
  );
}
