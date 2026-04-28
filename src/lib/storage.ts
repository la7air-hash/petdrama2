// Drama draft persistence between Create -> Result pages
import type { DramaStyleId, PetType, GeneratedDrama } from "./drama";

export interface DramaDraft {
  imageDataUrl: string;
  petName: string;
  petType: PetType;
  styleId: DramaStyleId;
  drama: GeneratedDrama;
  createdAt: number;
  /** Final rendered PNG data URL — source of truth for Gallery preview & re-download. */
  renderedDataUrl?: string;
}

const KEY = "petdrama:current";
const GALLERY = "petdrama:gallery";

export function saveDraft(draft: DramaDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* noop */
  }
}

export function loadDraft(): DramaDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DramaDraft) : null;
  } catch {
    return null;
  }
}

export function saveToGallery(draft: DramaDraft) {
  try {
    const list = loadGallery();
    list.unshift(draft);
    localStorage.setItem(GALLERY, JSON.stringify(list.slice(0, 24)));
  } catch {
    /* noop */
  }
}

export function loadGallery(): DramaDraft[] {
  try {
    const raw = localStorage.getItem(GALLERY);
    return raw ? (JSON.parse(raw) as DramaDraft[]) : [];
  } catch {
    return [];
  }
}
