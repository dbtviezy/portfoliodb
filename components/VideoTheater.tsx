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
 * Bottom-sheet style player: large stage + side playlist on desktop.
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
          className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.3, ease }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[1.35rem] border border-[var(--border)] bg-[var(--bg-panel)] shadow-[var(--shadow-panel)] sm:rounded-[1.25rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text)]" title={title}>
                  {title}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
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
                    className="rounded-[var(--radius-md)] border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-muted)] transition hover:text-[var(--text)]"
                  >
                    {lang === "RU" ? "На Rutube/YT" : "Source"}
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-[var(--radius-md)] border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-muted)] transition hover:text-[var(--text)]"
                >
                  {lang === "RU" ? "Закрыть" : "Close"}
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_15rem]">
              <div className="relative bg-black">
                <div className="relative aspect-video w-full lg:aspect-auto lg:min-h-[min(68vh,640px)]">
                  {external ? (
                    <iframe
                      key={buildEmbedPlaybackUrl(external, {
                        autoplay: true,
                        muted: false,
                      })}
                      title={title}
                      src={buildEmbedPlaybackUrl(external, {
                        autoplay: true,
                        muted: false,
                      })}
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
                      preload="metadata"
                    />
                  ) : (
                    <div className="flex h-full min-h-[12rem] items-center justify-center px-6 text-sm text-white/55">
                      {lang === "RU" ? "Не удалось открыть видео" : "Could not open video"}
                    </div>
                  )}
                </div>

                {videos.length > 1 ? (
                  <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-black/40 px-3 py-2 lg:hidden">
                    <button
                      type="button"
                      aria-label="Previous"
                      onClick={() =>
                        onIndexChange((safeIndex - 1 + videos.length) % videos.length)
                      }
                      className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-sm text-white/85"
                    >
                      ←
                    </button>
                    <span className="text-[11px] text-white/55">
                      {safeIndex + 1} / {videos.length}
                    </span>
                    <button
                      type="button"
                      aria-label="Next"
                      onClick={() => onIndexChange((safeIndex + 1) % videos.length)}
                      className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-sm text-white/85"
                    >
                      →
                    </button>
                  </div>
                ) : null}
              </div>

              {videos.length > 1 ? (
                <aside className="max-h-[30vh] overflow-y-auto border-t border-[var(--border)] bg-[var(--bg-soft)] p-3 lg:max-h-none lg:border-l lg:border-t-0">
                  <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    {lang === "RU" ? "Плейлист" : "Playlist"}
                  </p>
                  <ul className="space-y-2">
                    {videos.map((url, itemIndex) => {
                      const thumb = videoPosterUrl(url) || posterFallback;
                      const parsed = parseExternalVideo(url);
                      const itemLabel = parsed
                        ? providerLabel(parsed.provider)
                        : lang === "RU"
                          ? "Файл"
                          : "File";
                      const active = itemIndex === safeIndex;
                      return (
                        <li key={`${url}-pl-${itemIndex}`}>
                          <button
                            type="button"
                            onClick={() => onIndexChange(itemIndex)}
                            className={`flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border p-2 text-left transition ${
                              active
                                ? "border-[var(--border-strong)] bg-[var(--bg-elevated)]"
                                : "border-transparent hover:border-[var(--border)] hover:bg-[var(--bg)]"
                            }`}
                          >
                            <span className="relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-black/30">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[10px] text-[var(--text-faint)]">
                                  {itemIndex + 1}
                                </span>
                              )}
                              {active ? (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-[10px] text-white">
                                  ▶
                                </span>
                              ) : null}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-medium text-[var(--text)]">
                                {itemIndex + 1}. {itemLabel}
                              </span>
                              <span className="block text-[10px] text-[var(--text-faint)]">
                                {active
                                  ? lang === "RU"
                                    ? "Сейчас"
                                    : "Now playing"
                                  : lang === "RU"
                                    ? "Смотреть"
                                    : "Play"}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </aside>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
