"use client";

import type { CSSProperties } from "react";
import {
  imageFrameStyle,
  type ImageFrame,
} from "@/lib/image-frame";

type FramedImageProps = {
  src: string;
  alt: string;
  frame?: Partial<ImageFrame> | null;
  className?: string;
  /** Extra transform layered after frame scale (e.g. hover zoom via CSS group). */
  style?: CSSProperties;
  draggable?: boolean;
  loading?: "lazy" | "eager";
};

/** Cover image that respects Studio framing (zoom + focus point). */
export default function FramedImage({
  src,
  alt,
  frame,
  className = "",
  style,
  draggable = false,
  loading,
}: FramedImageProps) {
  const framed = imageFrameStyle(frame);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      draggable={draggable}
      className={`h-full w-full object-cover will-change-transform ${className}`}
      style={{
        ...framed,
        ...style,
      }}
    />
  );
}
