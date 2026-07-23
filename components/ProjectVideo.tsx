"use client";

import type { CSSProperties } from "react";
import { buildEmbedPlaybackUrl, parseExternalVideo } from "@/lib/external-video";

type ProjectVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  /** Card hover loops vs modal hero vs cinema theater */
  mode?: "card" | "modal" | "theater";
  style?: CSSProperties;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
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
  autoplay,
  muted,
  controls,
}: ProjectVideoProps) {
  const url = src.trim();
  if (!url) return null;

  const external = parseExternalVideo(url);

  if (external) {
    // Cards keep the still cover; iframe autoplay on every card is too heavy.
    if (mode === "card") return null;

    const wantAutoplay = autoplay ?? true;
    const wantMuted = muted ?? mode !== "theater";

    return (
      <iframe
        title="Project video"
        src={buildEmbedPlaybackUrl(external, {
          autoplay: wantAutoplay,
          muted: wantMuted,
        })}
        className={className || "h-full w-full border-0"}
        style={style}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  const fileAutoplay = autoplay ?? true;
  const fileMuted = muted ?? mode !== "theater";
  const fileControls = controls ?? mode === "theater";
  const fileLoop = mode !== "theater";

  return (
    <video
      className={className}
      src={url}
      poster={poster}
      muted={fileMuted}
      loop={fileLoop}
      playsInline
      autoPlay={fileAutoplay}
      controls={fileControls}
      style={style}
    />
  );
}
