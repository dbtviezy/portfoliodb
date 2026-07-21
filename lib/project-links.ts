export type ProjectLink = {
  label: string;
  url: string;
};

export function parseProjectLinks(raw: string | null | undefined): ProjectLink[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        label: String(item?.label ?? "").trim(),
        url: String(item?.url ?? "").trim(),
      }))
      .filter((item) => item.label && item.url);
  } catch {
    return [];
  }
}

export function serializeProjectLinks(links: ProjectLink[] | undefined | null): string {
  if (!links?.length) return "[]";
  return JSON.stringify(
    links
      .map((item) => ({
        label: item.label.trim(),
        url: item.url.trim(),
      }))
      .filter((item) => item.label && item.url)
  );
}

export function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
