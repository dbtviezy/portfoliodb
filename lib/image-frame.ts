export type ImageFrame = {
  /** Cover zoom, 1 = fit, up to ~2.5 = closer crop */
  zoom: number;
  /** Horizontal focus 0–100 (object-position / transform-origin) */
  x: number;
  /** Vertical focus 0–100 */
  y: number;
};

export const DEFAULT_IMAGE_FRAME: ImageFrame = {
  zoom: 1,
  x: 50,
  y: 50,
};

export function clampFrame(frame: Partial<ImageFrame> | null | undefined): ImageFrame {
  const zoom = Number(frame?.zoom);
  const x = Number(frame?.x);
  const y = Number(frame?.y);
  return {
    zoom: Number.isFinite(zoom) ? Math.min(2.5, Math.max(1, zoom)) : 1,
    x: Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 50,
    y: Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : 50,
  };
}

export function parseImageFrame(raw: unknown): ImageFrame {
  if (!raw) return { ...DEFAULT_IMAGE_FRAME };
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return clampFrame(raw as Partial<ImageFrame>);
  }
  if (typeof raw !== "string" || !raw.trim()) return { ...DEFAULT_IMAGE_FRAME };
  try {
    return clampFrame(JSON.parse(raw) as Partial<ImageFrame>);
  } catch {
    return { ...DEFAULT_IMAGE_FRAME };
  }
}

export function serializeImageFrame(frame: Partial<ImageFrame> | null | undefined): string {
  return JSON.stringify(clampFrame(frame));
}

/** Inline styles for a cover `<img>` inside an overflow-hidden frame. */
export function imageFrameStyle(frame: Partial<ImageFrame> | null | undefined): {
  objectPosition: string;
  transform: string;
  transformOrigin: string;
} {
  const { zoom, x, y } = clampFrame(frame);
  return {
    objectPosition: `${x}% ${y}%`,
    transform: `scale(${zoom})`,
    transformOrigin: `${x}% ${y}%`,
  };
}
