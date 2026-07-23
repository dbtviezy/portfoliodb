"use client";

import { parseExternalVideo } from "@/lib/external-video";

type ProjectVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  /** Card hover loops vs modal hero */
  mode?: "card" | "modal";
  style?: React.CSSProperties;
};

/**
 * Plays uploaded MP4/WebM loops, or embeds Rutube/YouTube/Vimeo.
 * External hosts cannot be scrubbed as <video src> — use iframe embed.
 */
export function ProjectVideo({
  src,
  poster,
  className = "",
  mode = "modal",
  style,
}: ProjectVideoProps) {
  const url = src.trim();
  if (!url) return null;

  const external = parseExternalVideo(url);

  if (external) {
    // Cards keep the still cover; iframe autoplay on every card is too heavy.
    if (mode === "card") return null;

    const embedSrc =
      external.provider === "rutube"
        ? `${external.embedUrl}?autoplay=1&muted=1`
        : external.provider === "youtube"
          ? `${external.embedUrl}&autoplay=1&mute=1`
          : `${external.embedUrl}?autoplay=1&muted=1`;

    return (
      <iframe
        title="Project video"
        src={embedSrc}
        className={className || "h-full w-full border-0"}
        style={style}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <video
      className={className}
      src={url}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay
      style={style}
    />
  );
}
