import { beforeEach, describe, expect, it } from "vitest";
import { deleteFromGallery, loadGallery, saveToGallery, type DramaDraft } from "@/lib/storage";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});

describe("gallery persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const makeDraft = (petName: string): DramaDraft => ({
    creationId: "reused-draft-id",
    imageDataUrl: "data:image/png;base64,raw",
    petName,
    petType: "dog",
    styleId: "drama-queen",
    drama: {
      quote: `${petName} quote`,
      caption: `${petName} caption`,
      hashtags: ["#PetDrama"],
      quoteOptions: [`${petName} quote`],
      captionOptions: [`${petName} caption`],
    },
    createdAt: Date.now(),
    renderedDataUrl: `data:image/png;base64,${petName}`,
    savedToGallery: true,
  });

  it("adds every save as a unique gallery item even when creationId is reused", () => {
    const a = saveToGallery(makeDraft("A"));
    const b = saveToGallery(makeDraft("B"));
    const c = saveToGallery(makeDraft("C"));

    const items = loadGallery();

    expect(items.map((item) => item.petName)).toEqual(["C", "B", "A"]);
    expect(new Set(items.map((item) => item.galleryId)).size).toBe(3);
    expect(a.galleryId).not.toBe(b.galleryId);
    expect(b.galleryId).not.toBe(c.galleryId);
  });

  it("deletes only the selected gallery item by galleryId", () => {
    saveToGallery(makeDraft("A"));
    const b = saveToGallery(makeDraft("B"));
    saveToGallery(makeDraft("C"));

    const next = deleteFromGallery(b.galleryId!);

    expect(next.map((item) => item.petName)).toEqual(["C", "A"]);
    expect(loadGallery().map((item) => item.petName)).toEqual(["C", "A"]);
  });
});
