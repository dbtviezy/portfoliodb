/** Project videos stored as JSON string in Project.videos; first also mirrored in `video`. */

export function parseProjectVideos(raw: unknown): string[] {
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

export function serializeProjectVideos(videos: unknown): string {
  const list = Array.isArray(videos)
    ? videos.map((item) => String(item ?? "").trim()).filter(Boolean)
    : [];
  return JSON.stringify(list);
}

/**
 * Full video list for UI: prefer videos[], always include primary `video` first.
 */
export function resolveProjectVideos(video: string, videos: unknown): string[] {
  const primary = String(video ?? "").trim();
  const extras = parseProjectVideos(videos);
  const list = extras.length > 0 ? extras : primary ? [primary] : [];
  if (primary && !list.includes(primary)) {
    return [primary, ...list];
  }
  return list;
}

/** Keep denormalized primary video in sync with the first list entry. */
export function syncPrimaryFromVideos(videos: string[]): {
  video: string;
  videos: string[];
} {
  const list = videos.map((item) => item.trim()).filter(Boolean);
  return {
    video: list[0] ?? "",
    videos: list,
  };
}
