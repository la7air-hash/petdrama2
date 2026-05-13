import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { supabase } from "@/integrations/supabase/client";
import { getStyle, normalizePetName, type DramaStyleId } from "@/lib/drama";
import { downloadUrlAsFile } from "@/lib/render";
import { getAnonKey } from "@/lib/anon-id";
import {
  copyToClipboard,
  facebookShareUrl,
  nativeShare,
  whatsappShareUrl,
  xShareUrl,
} from "@/lib/share";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Copy, Download, Facebook, Share2, Trophy } from "lucide-react";

interface PublicRemixVariant {
  id: string;
  key: string;
  label: string;
  url: string | null;
  quote: string;
  caption: string | null;
  hashtags: string[];
}

interface PublicShareData {
  galleryItemId?: string;
  petName: string;
  petType: string;
  styleId: DramaStyleId;
  petRole: string;
  quote: string;
  caption: string | null;
  hashtags: string[];
  variant: "original" | "remix";
  originalUrl: string | null;
  remixUrl: string | null;
  remixes?: PublicRemixVariant[];
  voteCounts?: Record<string, number>;
  voteTotal?: number;
}

interface PublicVariant {
  key: string;
  label: string;
  kind: "original" | "remix";
  url: string | null;
  quote: string;
  caption: string | null;
  hashtags: string[];
}

export default function PublicShare() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [variantKey, setVariantKey] = useState("original");
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [voteTotal, setVoteTotal] = useState(0);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voteBusy, setVoteBusy] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const { data: res, error } = await supabase.functions.invoke("public-share", {
          body: { slug },
        });
        if (cancelled) return;
        if (error || !res || res.error) {
          setNotFound(true);
        } else {
          const payload = res as PublicShareData;
          const remixList = payload.remixes ?? [];
          const preferredRemix = remixList[remixList.length - 1]?.key ?? (payload.remixUrl ? "legacy-remix" : null);
          setData(payload);
          setVoteCounts(payload.voteCounts ?? {});
          setVoteTotal(payload.voteTotal ?? 0);
          setVariantKey(payload.variant === "remix" && preferredRemix ? preferredRemix : "original");
          try {
            setMyVote(localStorage.getItem(`petdrama:vote:${slug}`));
          } catch {
            setMyVote(null);
          }
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const variants: PublicVariant[] = data
    ? [
        {
          key: "original",
          label: t("public.original"),
          kind: "original",
          url: data.originalUrl,
          quote: data.quote,
          caption: data.caption,
          hashtags: data.hashtags,
        },
        ...((data.remixes?.length ?? 0) > 0
          ? data.remixes!.map((remix, index) => ({
              key: remix.key,
              label: remix.label || `Remix ${index + 1}`,
              kind: "remix" as const,
              url: remix.url,
              quote: remix.quote || data.quote,
              caption: remix.caption ?? data.caption,
              hashtags: remix.hashtags?.length ? remix.hashtags : data.hashtags,
            }))
          : data.remixUrl
            ? [
                {
                  key: "legacy-remix",
                  label: "Remix",
                  kind: "remix" as const,
                  url: data.remixUrl,
                  quote: data.quote,
                  caption: data.caption,
                  hashtags: data.hashtags,
                },
              ]
            : []),
      ]
    : [];
  const activeVariant = variants.find((v) => v.key === variantKey) ?? variants[0] ?? null;
  const hasRemix = variants.some((v) => v.kind === "remix");
  const previewUrl = activeVariant?.url ?? null;
  const activeQuote = activeVariant?.quote ?? data?.quote ?? "";
  const activeCaption = activeVariant?.caption ?? data?.caption ?? null;
  const activeHashtags = activeVariant?.hashtags ?? data?.hashtags ?? [];
  const canVote = variants.filter((v) => v.key !== "legacy-remix").length > 1;
  const activeFileSuffix = (activeVariant?.label ?? "card")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const handleCopy = async () => {
    try {
      await copyToClipboard(shareUrl);
      toast.success("Link copied!");
    } catch {
      toast.error("Couldn't copy.");
    }
  };

  const handleNative = async () => {
    if (!data) return;
    const ok = await nativeShare({
      url: shareUrl,
      title: `${normalizePetName(data.petName)} — PetDrama`,
      text: activeQuote,
      fileUrl: previewUrl ?? undefined,
      fileName: `petdrama-${normalizePetName(data.petName).toLowerCase()}-${activeFileSuffix}.webp`,
    });
    if (!ok) handleCopy();
  };

  const handleDownload = async () => {
    if (!data || !previewUrl) return;
    try {
      await downloadUrlAsFile(
        previewUrl,
        `petdrama-${normalizePetName(data.petName).toLowerCase()}${activeVariant?.kind === "remix" ? `-${activeFileSuffix}` : ""}.png`,
      );
      toast.success("Downloaded!");
    } catch {
      toast.error("Couldn't download.");
    }
  };

  const handleVote = async (key: string) => {
    if (!slug || !data || voteBusy || key === "legacy-remix") return;
    setVoteBusy(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("remix-vote", {
        body: {
          slug,
          variantKey: key,
          voterKey: getAnonKey(),
        },
      });
      if (error || !res || res.error) throw error ?? new Error(res?.error ?? "Vote failed");
      setVoteCounts(res.counts ?? {});
      setVoteTotal(res.total ?? 0);
      setMyVote(key);
      try {
        localStorage.setItem(`petdrama:vote:${slug}`, key);
      } catch {
        // Ignore private browsing/storage failures.
      }
      toast.success(t("public.voteSaved"));
    } catch (err) {
      console.error("[PetDrama vote]", err);
      toast.error(t("public.voteError"));
    } finally {
      setVoteBusy(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <section className="container py-16 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {t("public.loading")}
        </section>
      </PageShell>
    );
  }

  if (notFound || !data) {
    return (
      <PageShell>
        <section className="container py-16">
          <StickerCard className="p-12 text-center bg-background max-w-lg mx-auto">
            <div className="text-5xl mb-3">🎭</div>
            <h1 className="font-display text-3xl font-extrabold">{t("public.notPublicTitle")}</h1>
            <p className="mt-2 text-muted-foreground">
              {t("public.notPublicBody")}
            </p>
            <Link to="/create" className="inline-block mt-6">
              <StickerButton variant="primary">{t("public.createOwn")} →</StickerButton>
            </Link>
          </StickerCard>
        </section>
      </PageShell>
    );
  }

  const style = getStyle(data.styleId);
  const petName = normalizePetName(data.petName);

  return (
    <PageShell>
      <section className="container py-10 md:py-16">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground text-center">
            {t("public.sharedOn")}
          </p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold tracking-tight text-center">
            {style.emoji} {petName} — {data.petRole}
          </h1>

          {hasRemix && (
            <div className="flex justify-center mt-5">
              <div className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-2xl border-2 border-foreground bg-background p-1 sticker-shadow-sm">
                {variants.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setVariantKey(item.key)}
                    className={cn(
                      "px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-full transition-colors",
                      variantKey === item.key
                        ? item.kind === "remix"
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground text-background"
                        : "text-foreground/70",
                    )}
                  >
                    {item.kind === "remix" ? "✨ " : ""}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <StickerCard className="p-3 mt-6" rotate={-1}>
            <div className="rounded-2xl overflow-hidden border-2 border-foreground bg-foreground/5">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={`${petName} as ${data.petRole}`}
                  className="w-full h-auto block"
                />
              )}
            </div>
          </StickerCard>

          {activeQuote && (
            <p className="mt-5 font-display font-extrabold text-xl leading-snug text-center">
              "{activeQuote}"
            </p>
          )}
          {activeCaption && (
            <p className="mt-3 text-muted-foreground text-center">{activeCaption}</p>
          )}
          {activeHashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {activeHashtags.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center rounded-full border-2 border-foreground bg-background px-2.5 py-0.5 text-[11px] font-extrabold sticker-shadow-sm"
                >
                  #{h.replace(/^#/, "")}
                </span>
              ))}
            </div>
          )}

          {canVote && (
            <StickerCard className="mt-7 p-5 bg-card" rotate={1}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    {t("public.remixBattle")}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-extrabold">
                    {t("public.voteBody")}
                  </h2>
                </div>
                <div className="rounded-full border-2 border-foreground bg-primary p-2 text-primary-foreground sticker-shadow-sm">
                  <Trophy className="size-5" />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {variants.map((item) => {
                  const count = voteCounts[item.key] ?? 0;
                  const pct = voteTotal > 0 ? Math.round((count / voteTotal) * 100) : 0;
                  const selected = myVote === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleVote(item.key)}
                      disabled={voteBusy || item.key === "legacy-remix"}
                      className={cn(
                        "group relative w-full overflow-hidden rounded-2xl border-2 border-foreground bg-background p-3 text-left sticker-shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70",
                        selected && "bg-primary/15",
                      )}
                    >
                      <span
                        className="absolute inset-y-0 left-0 bg-primary/25 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="relative flex items-center justify-between gap-3">
                        <span>
                          <span className="font-display text-base font-extrabold">
                            {item.kind === "remix" ? "✨ " : ""}
                            {item.label}
                          </span>
                          <span className="ml-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {selected ? t("public.voted") : t("public.vote")}
                          </span>
                        </span>
                        <span className="text-sm font-extrabold">
                          {pct}% · {count} {t("public.votes")}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </StickerCard>
          )}

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={handleNative}
              className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-foreground bg-foreground text-background px-3 py-2 text-xs font-extrabold sticker-shadow-sm hover:-translate-y-0.5 transition-transform"
            >
              <Share2 className="size-3.5" /> {t("public.share")}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-foreground bg-background px-3 py-2 text-xs font-extrabold sticker-shadow-sm hover:-translate-y-0.5 transition-transform"
            >
              <Copy className="size-3.5" /> {t("public.copyLink")}
            </button>
            <a
              href={whatsappShareUrl(shareUrl, `${petName} the ${data.petRole}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-foreground bg-[#25D366] text-foreground px-3 py-2 text-xs font-extrabold sticker-shadow-sm hover:-translate-y-0.5 transition-transform"
            >
              WhatsApp
            </a>
            <a
              href={facebookShareUrl(shareUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-foreground bg-[#1877F2] text-background px-3 py-2 text-xs font-extrabold sticker-shadow-sm hover:-translate-y-0.5 transition-transform"
            >
              <Facebook className="size-3.5" /> Facebook
            </a>
            <a
              href={xShareUrl(shareUrl, `${petName} just got exposed on PetDrama.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border-2 border-foreground bg-foreground text-background px-3 py-2 text-xs font-extrabold sticker-shadow-sm hover:-translate-y-0.5 transition-transform"
            >
              X
            </a>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full inline-flex items-center justify-center gap-1 rounded-full border-2 border-foreground bg-primary text-primary-foreground px-3 py-2 text-xs font-extrabold sticker-shadow-sm hover:-translate-y-0.5 transition-transform"
            >
              <Download className="size-3.5" /> {t("public.downloadPng")}
            </button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">{t("public.wantOne")}</p>
            <Link to="/create" className="inline-block mt-3">
              <StickerButton variant="primary">{t("public.createOwn")} →</StickerButton>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
