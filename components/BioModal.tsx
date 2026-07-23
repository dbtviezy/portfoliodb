"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useContent } from "@/components/ContentProvider";

type BioModalProps = {
  lang: "RU" | "EN";
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function BioModal({ lang }: BioModalProps) {
  const { content } = useContent();
  const [open, setOpen] = useState(false);

  const name = lang === "RU" ? "Даниил Баутин" : "Daniil Bautin";
  const portrait = content.about.profileImage.trim();
  const role = content.hero.text1 || "Motion · interface · visual systems";
  const bio1 = content.about.desc1;
  const bio2 = content.about.desc2;

  const close = useCallback(() => {
    setOpen(false);
    if (typeof window === "undefined") return;
    if (window.location.hash === "#bio") {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  useEffect(() => {
    const sync = () => setOpen(window.location.hash === "#bio");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-stretch justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            aria-label={lang === "RU" ? "Закрыть" : "Close"}
            className="absolute inset-0 bg-[var(--bg)] sm:bg-[var(--bg)]/70 sm:backdrop-blur-md"
            onClick={close}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bio-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.32, ease }}
            className="relative z-10 flex h-full max-h-[100dvh] w-full max-w-3xl flex-col sm:h-auto sm:max-h-[88vh] sm:overflow-hidden sm:rounded-[1.25rem]"
          >
            <div className="relative flex min-h-0 flex-1 flex-col bg-[var(--bg)] sm:bg-[var(--bg-panel)]">
              <button
                type="button"
                onClick={close}
                className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 text-xs tracking-wide text-[var(--text-faint)] transition hover:text-[var(--text)] sm:right-6 sm:top-5"
              >
                {lang === "RU" ? "Закрыть" : "Close"}
              </button>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="flex min-h-full flex-col gap-8 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(3.25rem,calc(env(safe-area-inset-top)+2.5rem))] sm:gap-10 sm:pb-12 sm:pt-10 md:min-h-[min(88vh,560px)] md:flex-row md:gap-14 md:p-0">
                  {/* Desktop: flush left, top, bottom — gap only before text */}
                  <div className="mx-auto w-[70%] max-w-[280px] shrink-0 px-5 sm:px-8 md:mx-0 md:w-[min(40%,300px)] md:max-w-[300px] md:self-stretch md:px-0">
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--bg-elevated)] md:h-full md:aspect-auto">
                      {portrait ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={portrait}
                          alt={name}
                          className="h-full w-full object-cover object-center"
                          draggable={false}
                        />
                      ) : (
                        <div className="flex h-full min-h-[220px] w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.08),transparent_55%)]">
                          <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--text-faint)]">
                            $ db.tviezy
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col px-5 sm:px-8 md:justify-center md:px-0 md:py-12 md:pr-10">
                    <p className="mb-3 font-mono text-[10px] tracking-[0.24em] text-[var(--text-faint)]">
                      $ db.tviezy
                    </p>
                    <h2
                      id="bio-title"
                      className="text-[clamp(1.75rem,4vw,2.35rem)] font-semibold tracking-tight text-[var(--text)]"
                    >
                      {name}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{role}</p>
                    <div className="mt-5 h-px w-12 bg-gradient-to-r from-white/40 to-transparent" />
                    <p className="mt-5 text-[14px] leading-relaxed text-[var(--text-muted)] sm:text-[15px]">
                      {bio1}
                    </p>
                    {bio2 ? (
                      <p className="mt-4 text-[13px] leading-relaxed text-[var(--text-faint)] sm:text-sm">
                        {bio2}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
