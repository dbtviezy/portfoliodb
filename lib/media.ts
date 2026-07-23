/** Known placeholder portraits from early seeds / Unsplash demos */
const STOCK_PROFILE_PATTERNS = [
  "images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
];

export function isStockProfileImage(url: string | null | undefined): boolean {
  const value = (url ?? "").trim();
  if (!value) return true;
  return STOCK_PROFILE_PATTERNS.some((pattern) => value.includes(pattern));
}

export function isUsableProfileImage(url: string | null | undefined): boolean {
  const value = (url ?? "").trim();
  return Boolean(value) && !isStockProfileImage(value);
}
