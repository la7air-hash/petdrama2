// Drama draft persistence between Create -> Result pages
import type { DramaStyleId, PetType, GeneratedDrama } from "./drama";

export interface DramaDraft {
  /** Stable unique identifier for this creation. Source of truth for upsert/delete. */
  creationId: string;
  /** Unique identifier for a saved gallery card. Generated at save time. */
  galleryId?: string;
  imageDataUrl: string;
  petName: string;
  petType: PetType;
  styleId: DramaStyleId;
  drama: GeneratedDrama;
  /** Used for sorting/display only — not for identity. */
  createdAt: number;
  /** Final rendered PNG data URL — source of truth for Gallery preview & re-download. */
  renderedDataUrl?: string;
  /** Optional AI-stylized version of the pet photo (raw image, not the card). */
  remixImageDataUrl?: string;
  /** Optional final rendered card built from the remix image. */
  remixRenderedDataUrl?: string;
  /** Last preview variant the user was viewing on Result. */
  variant?: "original" | "remix";
  /** True once this creation has been saved to the gallery. */
  savedToGallery?: boolean;
}

import { ownerKeySuffix } from "./draft-owner";

const LEGACY_KEY = "petdrama:current";
const LEGACY_GALLERY = "petdrama:gallery";
const draftKey = () => `petdrama:current:${ownerKeySuffix()}`;
const galleryKey = () => `petdrama:gallery:${ownerKeySuffix()}`;

/** Generate a stable, collision-resistant id for a new creation. */
export function newCreationId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Backfill creationId on legacy entries (older records only had createdAt). */
function ensureId<T extends { creationId?: string; createdAt?: number }>(d: T): T & { creationId: string } {
  if (d.creationId && typeof d.creationId === "string") return d as T & { creationId: string };
  const fallback = `legacy_${d.createdAt ?? Date.now()}`;
  return { ...d, creationId: fallback };
}

function ensureGalleryId<T extends { galleryId?: string; creationId?: string; createdAt?: number }>(d: T): T & { galleryId: string } {
  if (d.galleryId && typeof d.galleryId === "string") return d as T & { galleryId: string };
  // Legacy gallery records did not have a galleryId; make delete/key behavior stable.
  const fallback = d.creationId ? `legacy_gallery_${d.creationId}` : `legacy_gallery_${d.createdAt ?? Date.now()}`;
  return { ...d, galleryId: fallback };
}

export function getGalleryItemId(d: Pick<DramaDraft, "galleryId" | "creationId" | "createdAt">): string {
  return d.galleryId ?? `legacy_gallery_${d.creationId ?? d.createdAt}`;
}

export function saveDraft(draft: DramaDraft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ensureId(draft)));
  } catch {
    /* noop */
  }
}

export function loadDraft(): DramaDraft | null {
  try {
    // Prefer the persistent localStorage copy; fall back to sessionStorage for legacy.
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    if (!raw) return null;
    return ensureId(JSON.parse(raw) as DramaDraft);
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export function auditCreationAssets(label: string, draft: DramaDraft | null, galleryPayload: DramaDraft[] = []) {
  try {
    console.info("[PetDrama asset audit]", label, {
      activeCreationId: draft?.creationId ?? null,
      renderedDataUrlPresent: !!draft?.renderedDataUrl,
      remixRenderedDataUrlPresent: !!draft?.remixRenderedDataUrl,
      currentVisibleVariant: draft?.variant ?? "original",
      savedGalleryPayload: galleryPayload.map((item) => ({
        creationId: item.creationId,
        renderedDataUrlPresent: !!item.renderedDataUrl,
        remixRenderedDataUrlPresent: !!item.remixRenderedDataUrl,
        variant: item.variant ?? "original",
        savedToGallery: !!item.savedToGallery,
      })),
    });
  } catch {
    /* noop */
  }
}

/**
 * Slim a gallery item to only what the Gallery UI needs:
 * - renderedDataUrl (Original card)        — required for preview & download
 * - remixRenderedDataUrl (Remix card)      — required for remix preview & download
 * - drama text (quote, caption, hashtags)  — required for modal
 * Drops the raw upload (imageDataUrl) and the raw remix image (remixImageDataUrl)
 * once rendered cards exist, since localStorage has a ~5MB quota and base64
 * PNGs at 1080px are large.
 */
function slimForGallery(d: DramaDraft): DramaDraft {
  const hasOriginalRender = !!d.renderedDataUrl;
  const hasRemixRender = !!d.remixRenderedDataUrl;
  return {
    ...d,
    // Keep imageDataUrl only if we don't yet have a rendered card to fall back on.
    imageDataUrl: hasOriginalRender ? "" : d.imageDataUrl,
    // Keep remixImageDataUrl only if rendered remix card is missing.
    remixImageDataUrl: hasRemixRender ? undefined : d.remixImageDataUrl,
  };
}

export class GalleryQuotaError extends Error {
  constructor() {
    super("Gallery storage is full. Delete an older creation to free up space.");
    this.name = "GalleryQuotaError";
  }
}

function isQuotaError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  // Various browsers report quota errors differently.
  return (
    err.name === "QuotaExceededError" ||
    err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    /quota/i.test(err.message)
  );
}

export function saveToGallery(draft: DramaDraft): DramaDraft {
  const list = loadGallery();
  const incoming = slimForGallery({ ...ensureId(draft), galleryId: newCreationId() });
  const next = [incoming, ...list];

  try {
    localStorage.setItem(GALLERY, JSON.stringify(next));
    auditCreationAssets("save-to-gallery-storage", incoming, next);
    console.info("[PetDrama gallery write]", {
      galleryId: incoming.galleryId,
      creationId: incoming.creationId,
      items: next.length,
      hasOriginal: !!incoming.renderedDataUrl,
      hasRemixRender: !!incoming.remixRenderedDataUrl,
      bytes: JSON.stringify(next).length,
    });
    return incoming;
  } catch (err) {
    if (isQuotaError(err)) throw new GalleryQuotaError();
    console.error("[PetDrama gallery write error]", err);
    throw err;
  }
}

export function loadGallery(): DramaDraft[] {
  try {
    const raw = localStorage.getItem(GALLERY);
    if (!raw) return [];
    const list = (JSON.parse(raw) as DramaDraft[]).map((item) => ensureGalleryId(ensureId(item)));
    return list;
  } catch {
    return [];
  }
}

export function saveGallery(list: DramaDraft[]) {
  try {
    localStorage.setItem(GALLERY, JSON.stringify(list.map((item) => ensureGalleryId(ensureId(item)))));
  } catch (err) {
    if (isQuotaError(err)) throw new GalleryQuotaError();
    throw err;
  }
}

export function deleteFromGallery(galleryId: string): DramaDraft[] {
  const list = loadGallery().filter((d) => getGalleryItemId(d) !== galleryId);
  saveGallery(list);
  return list;
}
