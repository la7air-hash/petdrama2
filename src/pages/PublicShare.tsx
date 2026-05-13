import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { StickerButton } from "@/components/StickerButton";
import { StickerCard } from "@/components/StickerCard";
import { supabase } from "@/integrations/supabase/client";
import { getStyle, normalizePetName, type DramaStyleId } from "@/lib/drama";
import { downloadUrlAsFile } from "@/lib/render";
import {
  copyToClipboard,
  facebookShareUrl,
  nativeShare,
  whatsappShareUrl,
  xShareUrl,
} from "@/lib/share";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Copy, Download, Facebook, Share2 } from "lucide-react";

interface PublicShareData {
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
}

type Variant = "original" | "remix";

export default function PublicShare() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [variant, setVariant] = useState<Variant>("original");

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
          setData(res as PublicShareData);
          setVariant((res as PublicShareData).variant === "remix" && (res as PublicShareData).remixUrl ? "remix" : "original");
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
  const hasRemix = !!data?.remixUrl;
  const showRemix = variant === "remix" && hasRemix;
  const previewUrl = data ? (showRemix ? data.remixUrl! : data.originalUrl!) : null;

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
      text: data.quote,
      fileUrl: previewUrl ?? undefined,
      fileName: `petdrama-${normalizePetName(data.petName).toLowerCase()}.webp`,
    });
    if (!ok) handleCopy();
  };

  const handleDownload = async () => {
    if (!data || !previewUrl) return;
    try {
      await downloadUrlAsFile(
        previewUrl,
        `petdrama-${normalizePetName(data.petName).toLowerCase()}${showRemix ? "-remix" : ""}.png`,
      );
      toast.success("Downloaded!");
    } catch {
      toast.error("Couldn't download.");
    }
  };

  if (loading) {
    return (
      <PageShell>
        <section className="container py-16 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Loading…
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
            <h1 className="font-display text-3xl font-extrabold">This drama isn't public.</h1>
            <p className="mt-2 text-muted-foreground">
              The link may have been removed, or the creator made it private.
            </p>
            <Link to="/create" className="inline-block mt-6">
              <StickerButton variant="primary">Create your own PetDrama →</StickerButton>
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
            Shared on PetDrama
          </p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-extrabold tracking-tight text-center">
            {style.emoji} {petName} — {data.petRole}
          </h1>

          {hasRemix && (
            <div className="flex justify-center mt-5">
              <div className="inline-flex rounded-full border-2 border-foreground bg-background p-1 sticker-shadow-sm">
                <button
                  type="button"
                  onClick={() => setVariant("original")}
                  className={cn(
                    "px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-full transition-colors",
                    variant === "original" ? "bg-foreground text-background" : "text-foreground/70",
                  )}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => setVariant("remix")}
                  className={cn(
                    "px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-full transition-colors",
                    variant === "remix" ? "bg-primary text-primary-foreground" : "text-foreground/70",
                  )}
                >
                  ✨ Remix
                </button>
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

          {data.quote && (
            <p className="mt-5 font-display font-extrabold text-xl leading-snug text-center">
              "{data.quote}"
            </p>
          )}
          {data.caption && (
            <p className="mt-3 text-muted-foreground text-center">{data.caption}</p>
          )}
          {data.hashtags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {data.hashtags.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center rounded-full border-2 border-foreground bg-background px-2.5 py-0.5 text-[11px] font-extrabold sticker-shadow-sm"
                >
                  #{h.replace(/^#/, "")}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={handleNative}
              className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-foreground bg-foreground text-background px-3 py-2 text-xs font-extrabold sticker-shadow-sm hover:-translate-y-0.5 transition-transform"
            >
              <Share2 className="size-3.5" /> Share
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-foreground bg-background px-3 py-2 text-xs font-extrabold sticker-shadow-sm hover:-translate-y-0.5 transition-transform"
            >
              <Copy className="size-3.5" /> Copy link
            </button>
            <a
              href={whatsappShareUrl(shareUrl, `${petName} the ${data.petRole} 🎭`)}
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
              <Download className="size-3.5" /> Download PNG
            </button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">Want one for your pet?</p>
            <Link to="/create" className="inline-block mt-3">
              <StickerButton variant="primary">Create your own PetDrama →</StickerButton>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
