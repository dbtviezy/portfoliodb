export type ExternalVideoProvider = "rutube" | "youtube" | "vimeo";

export type ExternalVideo = {
  provider: ExternalVideoProvider;
  id: string;
  /** Original page / share URL */
  sourceUrl: string;
  /** iframe / embed URL */
  embedUrl: string;
  /** Best-effort remote poster URL(s), first is preferred */
  thumbnailCandidates: string[];
};

const RUTUBE_ID =
  /(?:rutube\.ru\/(?:video|play\/embed|video\/embed|embed)\/|rutube\.ru\/shorts\/)([a-zA-Z0-9_-]{7,32})/i;
const YOUTUBE_ID =
  /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
const VIMEO_ID = /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d{6,12})/i;

/** Direct file / blob URLs we can scrub with <video>. */
export function isDirectVideoFileUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return false;
  if (parseExternalVideo(value)) return false;
  try {
    const parsed = new URL(value, "https://example.local");
    const path = parsed.pathname.toLowerCase();
    return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(path) || parsed.hostname.includes("blob.vercel-storage.com");
  } catch {
    return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(value);
  }
}

export function parseExternalVideo(raw: string): ExternalVideo | null {
  const sourceUrl = String(raw ?? "").trim();
  if (!sourceUrl) return null;

  const rutube = sourceUrl.match(RUTUBE_ID);
  if (rutube?.[1]) {
    const id = rutube[1];
    return {
      provider: "rutube",
      id,
      sourceUrl,
      embedUrl: `https://rutube.ru/play/embed/${id}`,
      thumbnailCandidates: [
        `https://i.rtimg.ru/vi/${id}/o/`,
        `https://i.rtimg.ru/vi/${id}/`,
        `https://rutube.ru/api/video/${id}/thumbnail/?redirect=1`,
      ],
    };
  }

  const youtube = sourceUrl.match(YOUTUBE_ID);
  if (youtube?.[1]) {
    const id = youtube[1];
    return {
      provider: "youtube",
      id,
      sourceUrl,
      embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
      thumbnailCandidates: [
        `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      ],
    };
  }

  const vimeo = sourceUrl.match(VIMEO_ID);
  if (vimeo?.[1]) {
    const id = vimeo[1];
    return {
      provider: "vimeo",
      id,
      sourceUrl,
      embedUrl: `https://player.vimeo.com/video/${id}`,
      thumbnailCandidates: [`https://vumbnail.com/${id}.jpg`],
    };
  }

  return null;
}

export function providerLabel(provider: ExternalVideoProvider): string {
  switch (provider) {
    case "rutube":
      return "Rutube";
    case "youtube":
      return "YouTube";
    case "vimeo":
      return "Vimeo";
  }
}
