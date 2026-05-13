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

export function telegramShareUrl(url: string, text?: string): string {
  const params = new URLSearchParams({ url });
  if (text) params.set("text", text);
  return `https://t.me/share/url?${params.toString()}`;
}

export function redditShareUrl(url: string, title?: string): string {
  const params = new URLSearchParams({ url });
  if (title) params.set("title", title);
  return `https://www.reddit.com/submit?${params.toString()}`;
}

export function pinterestShareUrl(url: string, media?: string, description?: string): string {
  const params = new URLSearchParams({ url });
  if (media) params.set("media", media);
  if (description) params.set("description", description);
  return `https://www.pinterest.com/pin/create/button/?${params.toString()}`;
}

export function linkedinShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export function threadsShareUrl(url: string, text?: string): string {
  const msg = text ? `${text} ${url}` : url;
  return `https://www.threads.net/intent/post?text=${encodeURIComponent(msg)}`;
}

export function emailShareUrl(url: string, subject?: string, body?: string): string {
  const params = new URLSearchParams({
    subject: subject ?? "PetDrama",
    body: body ? `${body}\n\n${url}` : url,
  });
  return `mailto:?${params.toString()}`;
}

export interface SocialShareLink {
  label: string;
  href: string;
  className: string;
}

export function buildSocialShareLinks(opts: {
  url: string;
  text: string;
  title?: string;
  mediaUrl?: string | null;
}): SocialShareLink[] {
  return [
    {
      label: "WhatsApp",
      href: whatsappShareUrl(opts.url, opts.text),
      className: "bg-[#25D366] text-foreground",
    },
    {
      label: "Facebook",
      href: facebookShareUrl(opts.url),
      className: "bg-[#1877F2] text-background",
    },
    {
      label: "X",
      href: xShareUrl(opts.url, opts.text),
      className: "bg-foreground text-background",
    },
    {
      label: "Telegram",
      href: telegramShareUrl(opts.url, opts.text),
      className: "bg-[#27A7E7] text-background",
    },
    {
      label: "Threads",
      href: threadsShareUrl(opts.url, opts.text),
      className: "bg-[#101010] text-background",
    },
    {
      label: "Reddit",
      href: redditShareUrl(opts.url, opts.title ?? opts.text),
      className: "bg-[#FF4500] text-background",
    },
    {
      label: "Pinterest",
      href: pinterestShareUrl(opts.url, opts.mediaUrl ?? undefined, opts.title ?? opts.text),
      className: "bg-[#E60023] text-background",
    },
    {
      label: "LinkedIn",
      href: linkedinShareUrl(opts.url),
      className: "bg-[#0A66C2] text-background",
    },
    {
      label: "Email",
      href: emailShareUrl(opts.url, opts.title, opts.text),
      className: "bg-background text-foreground",
    },
  ];
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
