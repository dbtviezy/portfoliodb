"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ProjectItem } from "@/lib/content";
import { normalizeExternalUrl } from "@/lib/project-links";

type ProjectModalProps = {
  project: ProjectItem | null;
  lang: "RU" | "EN";
  onClose: () => void;
};

export default function ProjectModal({ project, lang, onClose }: ProjectModalProps) {
  useEffect(() => {
    if (!project) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [project, onClose]);

  const links = project?.links?.filter((link) => link.label && link.url) ?? [];
  const summary = project?.description?.trim() || "";
  const caseText = project?.detail?.trim() || "";
  const video = project?.video?.trim() || "";

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.25rem] border border-[var(--border)] bg-[var(--bg-panel)] shadow-[var(--shadow-panel)] sm:rounded-[var(--radius-xl)]"
          >
            <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-[var(--bg-soft)] sm:aspect-[16/9]">
              {video ? (
                <video
                  className="h-full w-full object-cover"
                  src={video}
                  poster={project.image}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.image}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-panel)] via-transparent to-transparent" />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 rounded-full border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-1.5 text-xs text-[var(--text-muted)] backdrop-blur transition hover:text-[var(--text)] sm:right-4 sm:top-4"
              >
                {lang === "RU" ? "Закрыть" : "Close"}
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mb-2 text-xs text-[var(--text-faint)]">
                    {project.category} · {project.year}
                  </p>
                  <h2
                    id="project-modal-title"
                    className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl md:text-3xl"
                  >
                    {project.title}
                  </h2>
                </div>
              </div>

              {summary ? (
                <p className="mb-4 text-sm leading-relaxed text-[var(--text-muted)] md:text-[15px]">
                  {summary}
                </p>
              ) : null}

              {caseText && caseText !== summary ? (
                <div className="mb-6">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    {lang === "RU" ? "Кейс" : "Case"}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-muted)] md:text-[15px]">
                    {caseText}
                  </p>
                </div>
              ) : (
                <div className="mb-6" />
              )}

              {links.length > 0 ? (
                <div>
                  <p className="mb-3 text-xs font-medium text-[var(--text-faint)]">
                    {lang === "RU" ? "Ссылки" : "Links"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {links.map((link) => (
                      <a
                        key={`${link.label}-${link.url}`}
                        href={normalizeExternalUrl(link.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3.5 py-2 text-sm text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]"
                      >
                        {link.label}
                        <span aria-hidden className="text-[var(--text-faint)]">
                          ↗
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-faint)]">
                  {lang === "RU"
                    ? "Ссылки на публикацию пока не добавлены."
                    : "No external links added yet."}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
