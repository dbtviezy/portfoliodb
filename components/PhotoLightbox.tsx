"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type PhotoLightboxProps = {
  images: string[];
  index: number;
  alt: string;
  lang: "RU" | "EN";
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function PhotoLightbox({
  images,
  index,
  alt,
  lang,
  open,
  onClose,
  onIndexChange,
}: PhotoLightboxProps) {
  const safeIndex = images.length ? ((index % images.length) + images.length) % images.length : 0;
  const src = images[safeIndex] || "";

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (images.length < 2) return;
      if (event.key === "ArrowRight") {
        onIndexChange((safeIndex + 1) % images.length);
      }
      if (event.key === "ArrowLeft") {
        onIndexChange((safeIndex - 1 + images.length) % images.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, onIndexChange, images.length, safeIndex]);

  return (
    <AnimatePresence>
      {open && src ? (
        <motion.div
          className="fixed inset-0 z-[140] flex flex-col bg-black/88 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-zoom-out"
            onClick={onClose}
          />

          <div className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-xs text-white/55">
              {images.length > 1
                ? `${safeIndex + 1} / ${images.length}`
                : lang === "RU"
                  ? "Просмотр"
                  : "View"}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              {lang === "RU" ? "Закрыть" : "Close"}
            </button>
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-10 pb-4 sm:px-14">
            {images.length > 1 ? (
              <button
                type="button"
                aria-label="Previous"
                onClick={(event) => {
                  event.stopPropagation();
                  onIndexChange((safeIndex - 1 + images.length) % images.length);
                }}
                className="absolute left-2 z-20 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-white/80 backdrop-blur transition hover:text-white sm:left-5"
              >
                ←
              </button>
            ) : null}

            <AnimatePresence mode="wait">
              <motion.img
                key={src}
                src={src}
                alt={alt}
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.04, y: -8 }}
                transition={{ duration: 0.32, ease }}
                className="max-h-[78vh] max-w-full cursor-default rounded-[var(--radius-md)] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:max-h-[82vh]"
                onClick={(event) => event.stopPropagation()}
                draggable={false}
              />
            </AnimatePresence>

            {images.length > 1 ? (
              <button
                type="button"
                aria-label="Next"
                onClick={(event) => {
                  event.stopPropagation();
                  onIndexChange((safeIndex + 1) % images.length);
                }}
                className="absolute right-2 z-20 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-white/80 backdrop-blur transition hover:text-white sm:right-5"
              >
                →
              </button>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="relative z-10 overflow-x-auto px-4 pb-5 sm:pb-6">
              <div className="flex w-max min-w-full justify-start gap-2 px-1 py-2 sm:justify-center">
                {images.map((url, thumbIndex) => {
                  const active = thumbIndex === safeIndex;
                  return (
                    <button
                      key={`${url}-lb-${thumbIndex}`}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onIndexChange(thumbIndex);
                      }}
                      className={`group relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-[var(--radius-sm)] border transition duration-300 sm:h-16 sm:w-24 ${
                        active
                          ? "border-white/70 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-1 ring-white/35"
                          : "border-white/20 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
