"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ProjectItem } from "@/lib/content";
import { normalizeExternalUrl } from "@/lib/project-links";
import { resolveProjectGallery } from "@/lib/project-images";
import PhotoLightbox from "@/components/PhotoLightbox";
import FramedImage from "@/components/FramedImage";
import { ProjectVideo } from "@/components/ProjectVideo";

type ProjectModalProps = {
  project: ProjectItem | null;
  lang: "RU" | "EN";
  onClose: () => void;
};

export default function ProjectModal({ project, lang, onClose }: ProjectModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const gallery = useMemo(
    () => (project ? resolveProjectGallery(project.image, project.images ?? []) : []),
    [project]
  );

  useEffect(() => {
    setActiveIndex(0);
    setLightboxOpen(false);
  }, [project?.id, project?.image]);

  useEffect(() => {
    if (!project || lightboxOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (gallery.length < 2) return;
      if (event.key === "ArrowRight") {
        setActiveIndex((index) => (index + 1) % gallery.length);
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((index) => (index - 1 + gallery.length) % gallery.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [project, onClose, gallery.length, lightboxOpen]);

  const links = project?.links?.filter((link) => link.label && link.url) ?? [];
  const summary = project?.description?.trim() || "";
  const caseText = project?.detail?.trim() || "";
  const video = project?.video?.trim() || "";
  const completed = project?.completed !== false;
  const activeImage = gallery[activeIndex] || project?.image || "";
  const showVideo = Boolean(video && activeIndex === 0 && !lightboxOpen);

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
              {showVideo ? (
                <ProjectVideo
                  className="h-full w-full object-cover"
                  src={video}
                  poster={activeImage}
                  mode="modal"
                />
              ) : (
                <button
                  type="button"
                  className="group relative h-full w-full cursor-zoom-in overflow-hidden"
                  onClick={() => setLightboxOpen(true)}
                  aria-label={lang === "RU" ? "Открыть фото" : "Open photo"}
                >
                  <div className="h-full w-full transition duration-700 ease-out group-hover:scale-[1.04]">
                    <FramedImage
                      src={activeImage}
                      alt={project.title}
                      frame={activeIndex === 0 ? project.imageFrame : undefined}
                    />
                  </div>
                  <span className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] text-white/85 opacity-0 backdrop-blur transition group-hover:opacity-100 sm:bottom-4 sm:left-4">
                    {lang === "RU" ? "Увеличить" : "Enlarge"}
                  </span>
                </button>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-panel)] via-transparent to-transparent" />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-[2] rounded-full border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-1.5 text-xs text-[var(--text-muted)] backdrop-blur transition hover:text-[var(--text)] sm:right-4 sm:top-4"
              >
                {lang === "RU" ? "Закрыть" : "Close"}
              </button>

              {gallery.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() =>
                      setActiveIndex((index) => (index - 1 + gallery.length) % gallery.length)
                    }
                    className="absolute left-3 top-1/2 z-[2] -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--bg)]/75 px-2.5 py-1.5 text-sm text-[var(--text-muted)] backdrop-blur transition hover:text-[var(--text)]"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() => setActiveIndex((index) => (index + 1) % gallery.length)}
                    className="absolute right-3 top-1/2 z-[2] -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--bg)]/75 px-2.5 py-1.5 text-sm text-[var(--text-muted)] backdrop-blur transition hover:text-[var(--text)]"
                  >
                    →
                  </button>
                </>
              ) : null}

              {showVideo && activeImage ? (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="absolute bottom-3 right-3 z-[2] rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] text-white/85 backdrop-blur transition hover:bg-black/60 sm:bottom-4 sm:right-4"
                >
                  {lang === "RU" ? "Фото" : "Photo"}
                </button>
              ) : null}
            </div>

            <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mb-2 text-xs text-[var(--text-faint)]">
                    {project.category} · {project.year}
                    {gallery.length > 1 ? ` · ${gallery.length} photos` : ""}
                  </p>
                  <h2
                    id="project-modal-title"
                    className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl md:text-3xl"
                  >
                    {project.title}
                  </h2>
                </div>
                <span
                  className={`shrink-0 rounded-[var(--radius-sm)] border px-2.5 py-1 text-[11px] tracking-wide ${
                    completed
                      ? "border-[var(--border)] text-[var(--text-muted)]"
                      : "border-[var(--border-strong)] text-[var(--text)]"
                  }`}
                >
                  {completed
                    ? lang === "RU"
                      ? "Завершено"
                      : "Completed"
                    : lang === "RU"
                      ? "В работе"
                      : "In progress"}
                </span>
              </div>

              {gallery.length > 0 ? (
                <div className="mb-6 flex gap-2.5 overflow-x-auto pb-2 pt-1">
                  {gallery.map((url, index) => {
                    const active = index === activeIndex;
                    return (
                      <button
                        key={`${url}-thumb-${index}`}
                        type="button"
                        onClick={() => {
                          setActiveIndex(index);
                          setLightboxOpen(true);
                        }}
                        className={`group relative h-16 w-[5.5rem] shrink-0 overflow-hidden rounded-[var(--radius-md)] border transition duration-300 sm:h-[4.75rem] sm:w-28 ${
                          active
                            ? "z-[1] scale-110 border-[var(--text-muted)] shadow-[0_10px_28px_rgba(0,0,0,0.28)]"
                            : "border-[var(--border)] opacity-75 hover:z-[1] hover:scale-110 hover:opacity-100 hover:shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : null}

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

          <PhotoLightbox
            open={lightboxOpen}
            images={gallery}
            index={activeIndex}
            alt={project.title}
            lang={lang}
            onClose={() => setLightboxOpen(false)}
            onIndexChange={setActiveIndex}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
