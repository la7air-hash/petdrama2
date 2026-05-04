// Cloud-backed gallery for logged-in users.
// Metadata in `gallery_items`, images in private `gallery` storage bucket.
import { supabase } from "@/integrations/supabase/client";
import { dataUrlToWebpBlob, uploadToGallery } from "./upload";
import { getStyle, type DramaStyleId, type PetType } from "./drama";
import type { DramaDraft } from "./storage";

export interface RemixVariant {
  id: string;
  gallery_item_id: string;
  image_path: string;
  caption: string | null;
  quote: string;
  hashtags: string[];
  created_at: string;
  signedUrl: string;
}

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
  /** All remix variants for this item, oldest → newest. Empty if none. */
  remixes: RemixVariant[];
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
  const rows = (data ?? []) as Omit<CloudGalleryItem, "originalSignedUrl" | "remixSignedUrl" | "remixes">[];

  // Batch-fetch all remix variants for these items.
  const ids = rows.map((r) => r.id);
  let remixRows: any[] = [];
  if (ids.length > 0) {
    const { data: rData, error: rErr } = await supabase
      .from("gallery_remixes")
      .select("*")
      .in("gallery_item_id", ids)
      .order("created_at", { ascending: true });
    if (rErr) console.error("[PetDrama remix list]", rErr);
    remixRows = rData ?? [];
  }
  const remixById = new Map<string, RemixVariant[]>();
  for (const r of remixRows) {
    const list = remixById.get(r.gallery_item_id) ?? [];
    try {
      const signedUrl = await signUrl(r.image_path);
      list.push({
        id: r.id,
        gallery_item_id: r.gallery_item_id,
        image_path: r.image_path,
        caption: r.caption,
        quote: r.quote,
        hashtags: r.hashtags ?? [],
        created_at: r.created_at,
        signedUrl,
      });
      remixById.set(r.gallery_item_id, list);
    } catch (err) {
      console.error("[PetDrama remix sign]", r.id, err);
    }
  }

  const out: CloudGalleryItem[] = [];
  for (const row of rows) {
    try {
      const originalSignedUrl = await signUrl(row.original_image_path);
      const remixSignedUrl = row.remix_image_path
        ? await signUrl(row.remix_image_path).catch(() => undefined)
        : undefined;
      out.push({
        ...row,
        originalSignedUrl,
        remixSignedUrl,
        remixes: remixById.get(row.id) ?? [],
      });
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
  /** Final rendered remix card as data URL. Optional — saved as a remix variant. */
  remixDataUrl?: string;
}

export async function saveGalleryItem(args: SaveCloudArgs): Promise<CloudGalleryItem> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("You must be signed in to save to your gallery.");

  const creationId = args.draft.creationId;

  const { data: existingRows, error: lookupErr } = await supabase
    .from("gallery_items")
    .select("*")
    .eq("user_id", userId)
    .eq("creation_id", creationId)
    .limit(1);
  if (lookupErr) throw lookupErr;
  const existing = existingRows?.[0] as { id: string } | undefined;

  const id = existing?.id ?? crypto.randomUUID();
  const folder = `${userId}/${id}`;
  const originalPath = `${folder}/original.webp`;

  const originalBlob = await dataUrlToWebpBlob(args.originalDataUrl);
  await uploadToGallery(originalPath, originalBlob);

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
    // Keep the legacy single-remix slot null on new saves; we now append into gallery_remixes.
    remix_image_path: existing ? undefined : null,
    variant: (args.draft.variant ?? (args.remixDataUrl ? "remix" : "original")) as "original" | "remix",
  };

  const { data, error } = await supabase
    .from("gallery_items")
    .upsert(row, { onConflict: "user_id,creation_id" })
    .select()
    .single();
  if (error) {
    if (!existing) {
      await supabase.storage.from("gallery").remove([originalPath]);
    }
    throw error;
  }

  // If a remix data URL was provided, append it as a NEW variant (never overwrite).
  if (args.remixDataUrl) {
    try {
      await addRemixVariant({
        galleryItemId: id,
        userId,
        dataUrl: args.remixDataUrl,
        quote: args.draft.drama.quote,
        caption: args.draft.drama.caption ?? null,
        hashtags: args.draft.drama.hashtags ?? [],
      });
    } catch (err) {
      console.error("[PetDrama remix variant save]", err);
    }
  }

  const originalSignedUrl = await signUrl(originalPath);
  const remixSignedUrl = (data as any).remix_image_path
    ? await signUrl((data as any).remix_image_path).catch(() => undefined)
    : undefined;

  // Re-fetch variants so the returned item is complete.
  const { data: variantRows } = await supabase
    .from("gallery_remixes")
    .select("*")
    .eq("gallery_item_id", id)
    .order("created_at", { ascending: true });
  const remixes: RemixVariant[] = [];
  for (const r of variantRows ?? []) {
    try {
      const signedUrl = await signUrl((r as any).image_path);
      remixes.push({
        id: (r as any).id,
        gallery_item_id: (r as any).gallery_item_id,
        image_path: (r as any).image_path,
        caption: (r as any).caption,
        quote: (r as any).quote,
        hashtags: (r as any).hashtags ?? [],
        created_at: (r as any).created_at,
        signedUrl,
      });
    } catch { /* skip */ }
  }

  return { ...(data as any), originalSignedUrl, remixSignedUrl, remixes };
}

export interface AddRemixArgs {
  galleryItemId: string;
  userId: string;
  dataUrl: string;
  quote: string;
  caption: string | null;
  hashtags: string[];
}

/** Append a new remix variant. Never overwrites previous remixes. */
export async function addRemixVariant(args: AddRemixArgs): Promise<RemixVariant> {
  const remixId = crypto.randomUUID();
  const path = `${args.userId}/${args.galleryItemId}/remix-${remixId}.webp`;
  const blob = await dataUrlToWebpBlob(args.dataUrl);
  await uploadToGallery(path, blob);

  const { data, error } = await supabase
    .from("gallery_remixes")
    .insert({
      id: remixId,
      gallery_item_id: args.galleryItemId,
      user_id: args.userId,
      image_path: path,
      caption: args.caption,
      quote: args.quote,
      hashtags: args.hashtags,
    })
    .select()
    .single();
  if (error) {
    await supabase.storage.from("gallery").remove([path]).catch(() => {});
    throw error;
  }
  const signedUrl = await signUrl(path);
  return {
    id: (data as any).id,
    gallery_item_id: (data as any).gallery_item_id,
    image_path: (data as any).image_path,
    caption: (data as any).caption,
    quote: (data as any).quote,
    hashtags: (data as any).hashtags ?? [],
    created_at: (data as any).created_at,
    signedUrl,
  };
}

export async function deleteGalleryItem(item: Pick<CloudGalleryItem, "id" | "original_image_path" | "remix_image_path">): Promise<void> {
  // List & remove every file under this item's folder so all remix variants get cleaned up.
  // We can't easily recover the user_id from the item, so derive folder from the original path.
  const folder = item.original_image_path.split("/").slice(0, 2).join("/"); // "<user_id>/<item_id>"
  try {
    const { data: files } = await supabase.storage.from("gallery").list(folder);
    const paths = (files ?? []).map((f) => `${folder}/${f.name}`);
    if (paths.length > 0) {
      const { error: storageErr } = await supabase.storage.from("gallery").remove(paths);
      if (storageErr) console.error("[PetDrama gallery delete storage]", storageErr);
    }
  } catch (err) {
    console.error("[PetDrama gallery delete list]", err);
  }
  // FK ON DELETE CASCADE removes gallery_remixes rows automatically.
  const { error } = await supabase.from("gallery_items").delete().eq("id", item.id);
  if (error) throw error;
}
