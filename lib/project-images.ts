/** Gallery photos stored as JSON string in Project.images. */

export function parseProjectImages(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item ?? "").trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function serializeProjectImages(images: unknown): string {
  const list = Array.isArray(images)
    ? images.map((item) => String(item ?? "").trim()).filter(Boolean)
    : [];
  return JSON.stringify(list);
}

/**
 * Full gallery for UI: prefer images[], always include cover `image` first.
 */
export function resolveProjectGallery(image: string, images: unknown): string[] {
  const cover = String(image ?? "").trim();
  const extras = parseProjectImages(images);
  const list = extras.length > 0 ? extras : cover ? [cover] : [];
  if (cover && !list.includes(cover)) {
    return [cover, ...list];
  }
  return list;
}

/** Keep denormalized cover in sync with the first gallery photo. */
export function syncCoverFromGallery(images: string[]): {
  image: string;
  images: string[];
} {
  const list = images.map((item) => item.trim()).filter(Boolean);
  return {
    image: list[0] ?? "",
    images: list,
  };
}
