// Share helpers for gallery items.
import { supabase } from "@/integrations/supabase/client";

export interface ShareToggleResponse {
  slug: string;
  url: string;
  share_enabled: boolean;
}

export function getShareUrl(slug: string): string {
  return `${window.location.origin}/p/${slug}`;
}

export async function setShareEnabled(itemId: string, enabled: boolean): Promise<ShareToggleResponse> {
  const { data, error } = await supabase.functions.invoke("share-toggle", {
    body: { gallery_item_id: itemId, enabled },
  });
  if (error) throw error;
  if (!data?.slug) throw new Error("No slug returned");
  return data as ShareToggleResponse;
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

export function whatsappShareUrl(url: string, text?: string): string {
  const msg = text ? `${text} ${url}` : url;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export function facebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function xShareUrl(url: string, text?: string): string {
  const params = new URLSearchParams({ url });
  if (text) params.set("text", text);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/** Try Web Share API with file if supported, then URL, then return false. */
export async function nativeShare(opts: {
  url: string;
  title?: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
}): Promise<boolean> {
  if (typeof navigator === "undefined" || !("share" in navigator)) return false;
  // Try sharing the image file too if supported
  if (opts.fileUrl && "canShare" in navigator) {
    try {
      const res = await fetch(opts.fileUrl);
      const blob = await res.blob();
      const file = new File([blob], opts.fileName ?? "petdrama.webp", { type: blob.type || "image/webp" });
      // @ts-ignore canShare with files
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: opts.title,
          text: opts.text,
          url: opts.url,
        } as ShareData);
        return true;
      }
    } catch {
      /* fall through to URL share */
    }
  }
  try {
    await navigator.share({ title: opts.title, text: opts.text, url: opts.url });
    return true;
  } catch {
    return false;
  }
}
