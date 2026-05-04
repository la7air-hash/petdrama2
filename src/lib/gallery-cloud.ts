// Cloud-backed gallery for logged-in users.
// Metadata in `gallery_items`, images in private `gallery` storage bucket.
import { supabase } from "@/integrations/supabase/client";
import { dataUrlToWebpBlob, uploadToGallery } from "./upload";
import { getStyle, type DramaStyleId, type PetType } from "./drama";
import type { DramaDraft } from "./storage";

export interface CloudGalleryItem {
  id: string;
  user_id: string;
  creation_id: string;
  pet_name: string;
  pet_type: PetType;
  style_id: DramaStyleId;
  pet_role: string;
  quote: string;
  caption: string | null;
  hashtags: string[];
  original_image_path: string;
  remix_image_path: string | null;
  variant: "original" | "remix";
  created_at: string;
  public_share_slug: string | null;
  share_enabled: boolean;
  shared_at: string | null;
  /** Signed URLs computed at load time. */
  originalSignedUrl: string;
  remixSignedUrl?: string;
}

const SIGNED_URL_TTL = 60 * 60; // 1 hour

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function signUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("gallery")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}

export async function listMyGallery(): Promise<CloudGalleryItem[]> {
  const { data, error } = await supabase
    .from("gallery_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Omit<CloudGalleryItem, "originalSignedUrl" | "remixSignedUrl">[];
  const out: CloudGalleryItem[] = [];
  for (const row of rows) {
    try {
      const originalSignedUrl = await signUrl(row.original_image_path);
      const remixSignedUrl = row.remix_image_path
        ? await signUrl(row.remix_image_path).catch(() => undefined)
        : undefined;
      out.push({ ...row, originalSignedUrl, remixSignedUrl });
    } catch (err) {
      console.error("[PetDrama gallery sign]", row.id, err);
    }
  }
  return out;
}

export interface SaveCloudArgs {
  draft: DramaDraft;
  /** Final rendered original card as data URL (PNG from canvas). Required. */
  originalDataUrl: string;
  /** Final rendered remix card as data URL. Optional. */
  remixDataUrl?: string;
}

export async function saveGalleryItem(args: SaveCloudArgs): Promise<CloudGalleryItem> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("You must be signed in to save to your gallery.");

  const creationId = args.draft.creationId;

  // Look for an existing row for this creation so we UPSERT (one PetDrama = one card).
  const { data: existingRows, error: lookupErr } = await supabase
    .from("gallery_items")
    .select("*")
    .eq("user_id", userId)
    .eq("creation_id", creationId)
    .limit(1);
  if (lookupErr) throw lookupErr;
  const existing = existingRows?.[0] as { id: string } | undefined;

  // Reuse the existing row's id (and storage folder) so we overwrite the same files.
  const id = existing?.id ?? crypto.randomUUID();
  const folder = `${userId}/${id}`;
  const originalPath = `${folder}/original.webp`;

  const originalBlob = await dataUrlToWebpBlob(args.originalDataUrl);
  await uploadToGallery(originalPath, originalBlob);

  let remixPath: string | null = null;
  if (args.remixDataUrl) {
    remixPath = `${folder}/remix.webp`;
    const remixBlob = await dataUrlToWebpBlob(args.remixDataUrl);
    await uploadToGallery(remixPath, remixBlob);
  }

  const style = getStyle(args.draft.styleId);
  const row = {
    id,
    user_id: userId,
    creation_id: creationId,
    pet_name: args.draft.petName,
    pet_type: args.draft.petType,
    style_id: args.draft.styleId,
    pet_role: style.name,
    quote: args.draft.drama.quote,
    caption: args.draft.drama.caption ?? null,
    hashtags: args.draft.drama.hashtags ?? [],
    original_image_path: originalPath,
    remix_image_path: remixPath,
    variant: (args.draft.variant ?? (remixPath ? "remix" : "original")) as "original" | "remix",
  };

  const { data, error } = await supabase
    .from("gallery_items")
    .upsert(row, { onConflict: "user_id,creation_id" })
    .select()
    .single();
  if (error) {
    // Best effort: only remove files we just wrote when this was a brand-new insert.
    if (!existing) {
      await supabase.storage
        .from("gallery")
        .remove([originalPath, ...(remixPath ? [remixPath] : [])]);
    }
    throw error;
  }

  const originalSignedUrl = await signUrl(originalPath);
  const remixSignedUrl = remixPath ? await signUrl(remixPath).catch(() => undefined) : undefined;
  return { ...(data as any), originalSignedUrl, remixSignedUrl };
}

export async function deleteGalleryItem(item: Pick<CloudGalleryItem, "id" | "original_image_path" | "remix_image_path">): Promise<void> {
  const paths = [item.original_image_path];
  if (item.remix_image_path) paths.push(item.remix_image_path);
  const { error: storageErr } = await supabase.storage.from("gallery").remove(paths);
  if (storageErr) console.error("[PetDrama gallery delete storage]", storageErr);
  const { error } = await supabase.from("gallery_items").delete().eq("id", item.id);
  if (error) throw error;
}
