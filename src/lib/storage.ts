// Drama draft persistence between Create -> Result pages
import type { DramaStyleId, PetType, GeneratedDrama } from "./drama";

export interface DramaDraft {
  /** Stable unique identifier for this creation. Source of truth for upsert/delete. */
  creationId: string;
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

const KEY = "petdrama:current";
const GALLERY = "petdrama:gallery";

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

export function saveToGallery(draft: DramaDraft): DramaDraft | null {
  try {
    const list = loadGallery();
    const incoming = ensureId(draft);
    // Upsert by creationId so re-saving the same creation never duplicates.
    const idx = list.findIndex((d) => d.creationId === incoming.creationId);
    if (idx >= 0) {
      const existing = list[idx];
      list[idx] = {
        ...existing,
        ...incoming,
        renderedDataUrl: incoming.renderedDataUrl ?? existing.renderedDataUrl,
        remixImageDataUrl: incoming.remixImageDataUrl ?? existing.remixImageDataUrl,
        remixRenderedDataUrl: incoming.remixRenderedDataUrl ?? existing.remixRenderedDataUrl,
        variant: incoming.variant ?? existing.variant,
      };
    } else {
      list.unshift(incoming);
    }
    localStorage.setItem(GALLERY, JSON.stringify(list.slice(0, 24)));
    auditCreationAssets("save-to-gallery-storage", incoming, list.slice(0, 24));
    return incoming;
  } catch {
    /* noop */
    return null;
  }
}

export function loadGallery(): DramaDraft[] {
  try {
    const raw = localStorage.getItem(GALLERY);
    if (!raw) return [];
    const list = (JSON.parse(raw) as DramaDraft[]).map(ensureId);
    return list;
  } catch {
    return [];
  }
}

export function saveGallery(list: DramaDraft[]) {
  try {
    localStorage.setItem(GALLERY, JSON.stringify(list.map(ensureId).slice(0, 24)));
  } catch {
    /* noop */
  }
}

export function deleteFromGallery(creationId: string): DramaDraft[] {
  const list = loadGallery().filter((d) => d.creationId !== creationId);
  saveGallery(list);
  return list;
}
