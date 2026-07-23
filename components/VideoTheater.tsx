"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  buildEmbedPlaybackUrl,
  isDirectVideoFileUrl,
  parseExternalVideo,
  providerLabel,
  videoPosterUrl,
} from "@/lib/external-video";

type VideoTheaterProps = {
  videos: string[];
  index: number;
  title: string;
  lang: "RU" | "EN";
  open: boolean;
  posterFallback?: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Full-viewport cinema player for project videos (Rutube / YouTube / MP4).
 * Opens from a user click so sound autoplay is allowed.
 */
export default function VideoTheater({
  videos,
  index,
  title,
  lang,
  open,
  posterFallback = "",
  onClose,
  onIndexChange,
}: VideoTheaterProps) {
  const safeIndex = videos.length
    ? ((index % videos.length) + videos.length) % videos.length
    : 0;
  const src = videos[safeIndex] || "";
  const external = useMemo(() => parseExternalVideo(src), [src]);
  const isFile = isDirectVideoFileUrl(src);
  const poster = videoPosterUrl(src) || posterFallback;

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
      if (videos.length < 2) return;
      if (event.key === "ArrowRight") {
        onIndexChange((safeIndex + 1) % videos.length);
      }
      if (event.key === "ArrowLeft") {
        onIndexChange((safeIndex - 1 + videos.length) % videos.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, onIndexChange, videos.length, safeIndex]);

  const label = external
    ? providerLabel(external.provider)
    : lang === "RU"
      ? "Видео"
      : "Video";

  return (
    <AnimatePresence>
      {open && src ? (
        <motion.div
          className="fixed inset-0 z-[150] flex flex-col bg-black/92 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0"
            onClick={onClose}
          />

          <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white/90">{title}</p>
              <p className="mt-0.5 text-[11px] text-white/45">
                {label}
                {videos.length > 1 ? ` · ${safeIndex + 1} / ${videos.length}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {external ? (
                <a
                  href={external.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  {lang === "RU" ? "Открыть на сайте" : "Open source"}
                </a>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                {lang === "RU" ? "Закрыть" : "Close"}
              </button>
            </div>
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-6 sm:pb-6">
            {videos.length > 1 ? (
              <button
                type="button"
                aria-label="Previous video"
                onClick={(event) => {
                  event.stopPropagation();
                  onIndexChange((safeIndex - 1 + videos.length) % videos.length);
                }}
                className="absolute left-2 z-20 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-white/80 backdrop-blur transition hover:text-white sm:left-4"
              >
                ←
              </button>
            ) : null}

            <motion.div
              key={`${src}-${safeIndex}`}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, ease }}
              className="relative w-full max-w-[min(1120px,96vw)] overflow-hidden rounded-[1rem] border border-white/10 bg-black shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative aspect-video w-full">
                {external ? (
                  <iframe
                    key={buildEmbedPlaybackUrl(external, { autoplay: true, muted: false })}
                    title={title}
                    src={buildEmbedPlaybackUrl(external, { autoplay: true, muted: false })}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : isFile ? (
                  <video
                    key={src}
                    className="absolute inset-0 h-full w-full bg-black object-contain"
                    src={src}
                    poster={poster || undefined}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-sm text-white/55">
                    {lang === "RU" ? "Не удалось открыть видео" : "Could not open video"}
                  </div>
                )}
              </div>
            </motion.div>

            {videos.length > 1 ? (
              <button
                type="button"
                aria-label="Next video"
                onClick={(event) => {
                  event.stopPropagation();
                  onIndexChange((safeIndex + 1) % videos.length);
                }}
                className="absolute right-2 z-20 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-white/80 backdrop-blur transition hover:text-white sm:right-4"
              >
                →
              </button>
            ) : null}
          </div>

          {videos.length > 1 ? (
            <div className="relative z-10 flex justify-center gap-2 overflow-x-auto px-4 pb-4 sm:pb-5">
              {videos.map((url, itemIndex) => {
                const thumb = videoPosterUrl(url) || posterFallback;
                const active = itemIndex === safeIndex;
                return (
                  <button
                    key={`${url}-thumb-${itemIndex}`}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onIndexChange(itemIndex);
                    }}
                    className={`relative h-14 w-24 shrink-0 overflow-hidden rounded-md border transition sm:h-16 sm:w-28 ${
                      active
                        ? "border-white/70 opacity-100"
                        : "border-white/15 opacity-55 hover:opacity-90"
                    }`}
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-white/5 text-[10px] text-white/50">
                        {itemIndex + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
