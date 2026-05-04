// Helpers to convert a rendered card data URL to a WEBP Blob and upload to
// the private `gallery` storage bucket.
import { supabase } from "@/integrations/supabase/client";

/** Convert a data URL (PNG from canvas) into a WEBP Blob at given quality. */
export async function dataUrlToWebpBlob(dataUrl: string, quality = 0.9): Promise<Blob> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/webp",
      quality,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Upload a Blob to the `gallery` bucket. Returns the storage key on success. */
export async function uploadToGallery(path: string, blob: Blob): Promise<string> {
  const { error } = await supabase.storage
    .from("gallery")
    .upload(path, blob, { contentType: "image/webp", upsert: true });
  if (error) throw error;
  return path;
}
