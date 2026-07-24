"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useContent } from "@/components/ContentProvider";
import ProjectModal from "@/components/ProjectModal";
import FramedImage from "@/components/FramedImage";
import { ProjectVideo } from "@/components/ProjectVideo";
import type { ProjectItem } from "@/lib/content";

interface ProjectsProps {
  lang: "RU" | "EN";
}

const ease = [0.22, 1, 0.36, 1] as const;

const Projects = memo(function Projects({ lang }: ProjectsProps) {
  const { content } = useContent();
  const projects = content.projects.featured.length > 0 ? content.projects.featured : content.projects.allItems;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selected, setSelected] = useState<ProjectItem | null>(null);
  const touchX = useRef<number | null>(null);

  const count = projects.length;
  const active = count > 0 ? projects[index % count] : null;
  const prev = count > 1 ? projects[(index - 1 + count) % count] : null;
  const next = count > 1 ? projects[(index + 1) % count] : null;

  const goTo = useCallback(
    (targetIndex: number, dir: 1 | -1) => {
      if (count < 2) return;
      setDirection(dir);
      setIndex(((targetIndex % count) + count) % count);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  useEffect(() => {
    setIndex(0);
  }, [projects.length]);

  if (!active) return null;

  return (
    <section
      id="projects"
      className="relative z-20 overflow-x-clip pb-[calc(var(--section-y)*0.65)] pt-1 sm:pt-2"
      style={{ paddingLeft: "var(--page-x)", paddingRight: "var(--page-x)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(255,255,255,0.04),transparent)]"
      />
      <div className="relative mx-auto w-full max-w-5xl 2xl:max-w-6xl">
        <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
          <div className="min-w-0">
            <h2 className="text-[12px] font-medium tracking-[0.14em] text-[var(--text-faint)] sm:text-[13px]">
              {lang === "RU" ? "Работы" : "Work"}
            </h2>
            <p className="mt-0.5 text-[10px] text-[var(--text-faint)]/80 sm:text-[11px]">
              {index + 1} / {count}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={count < 2}
              aria-label={lang === "RU" ? "Предыдущий" : "Previous"}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)] disabled:opacity-30 sm:h-9 sm:w-9"
            >
              ←
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={count < 2}
              aria-label={lang === "RU" ? "Следующий" : "Next"}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)] disabled:opacity-30 sm:h-9 sm:w-9"
            >
              →
            </button>
            <Link
              href="/projects"
              prefetch
              className="relative z-30 ml-1 hidden min-h-9 items-center rounded-full border border-[var(--border)] px-3 text-[11px] text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)] sm:inline-flex"
              onClick={(event) => {
                // Never let the active carousel card steal this navigation.
                event.stopPropagation();
                setSelected(null);
              }}
            >
              {content.projects.viewAll || (lang === "RU" ? "Все работы" : "View all")}
            </Link>
          </div>
        </div>

        <div
          className="relative w-full touch-pan-y [perspective:1200px]"
          style={{ height: "var(--carousel-h)" }}
          onTouchStart={(e) => {
            touchX.current = e.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchX.current == null) return;
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) < 40) return;
            if (dx < 0) goNext();
            else goPrev();
          }}
        >
          {/* Previous — left, muted blur */}
          {prev && (
            <button
              type="button"
              onClick={goPrev}
              aria-label={lang === "RU" ? `Показать ${prev.title}` : `Show ${prev.title}`}
              className="absolute left-0 top-[10%] z-[1] h-[80%] w-[42%] cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] outline-none sm:w-[36%]"
            >
              <motion.div
                key={`prev-${prev.id ?? (index - 1 + count) % count}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 0.75, x: 0 }}
                transition={{ duration: 0.4, ease }}
                className="h-full w-full scale-95 grayscale blur-[3px] sm:blur-[5px]"
              >
                <FramedImage
                  src={prev.image}
                  alt=""
                  frame={prev.imageFrame}
                  loading="lazy"
                  draggable={false}
                />
              </motion.div>
            </button>
          )}

          {/* Next — right, muted blur */}
          {next && (
            <button
              type="button"
              onClick={goNext}
              aria-label={lang === "RU" ? `Показать ${next.title}` : `Show ${next.title}`}
              className="absolute right-0 top-[10%] z-[1] h-[80%] w-[42%] cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] outline-none sm:w-[36%]"
            >
              <motion.div
                key={`next-${next.id ?? (index + 1) % count}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 0.75, x: 0 }}
                transition={{ duration: 0.4, ease }}
                className="h-full w-full scale-95 grayscale blur-[3px] sm:blur-[5px]"
              >
                <FramedImage
                  src={next.image}
                  alt=""
                  frame={next.imageFrame}
                  loading="lazy"
                  draggable={false}
                />
              </motion.div>
            </button>
          )}

          {/* Active — front, color, 3D flip, opens modal */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.button
              key={`active-${active.id ?? index}`}
              type="button"
              custom={direction}
              onClick={() => setSelected(active)}
              initial={{
                opacity: 0,
                x: direction > 0 ? 56 : -56,
                rotateY: direction > 0 ? 16 : -16,
                filter: "blur(8px) grayscale(1)",
              }}
              animate={{
                opacity: 1,
                x: 0,
                rotateY: 0,
                filter: "blur(0px) grayscale(0)",
              }}
              exit={{
                opacity: 0,
                x: direction > 0 ? -64 : 64,
                rotateY: direction > 0 ? -24 : 24,
                filter: "blur(6px) grayscale(1)",
                transition: { duration: 0.32, ease },
              }}
              transition={{ duration: 0.45, ease }}
              className="group absolute left-[14%] top-0 z-10 h-full w-[72%] cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] text-left shadow-[var(--shadow-panel)] outline-none transition duration-500 [transform-style:preserve-3d] hover:z-20 hover:border-[var(--border-strong)] hover:shadow-[0_28px_60px_rgba(0,0,0,0.4)] focus-visible:ring-1 focus-visible:ring-white/30 sm:left-[21%] sm:w-[58%] sm:hover:scale-[1.02] md:left-[24%] md:w-[52%]"
            >
              <div className="h-full w-full transition duration-700 ease-out sm:group-hover:scale-[1.03]">
                <FramedImage
                  src={active.image}
                  alt={active.title}
                  frame={active.imageFrame}
                  draggable={false}
                />
              </div>
              {active.video ? (
                <ProjectVideo
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-100"
                  src={active.video}
                  poster={active.image}
                  mode="card"
                  style={{
                    objectPosition: `${active.imageFrame?.x ?? 50}% ${active.imageFrame?.y ?? 50}%`,
                  }}
                />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3.5 pb-3.5 pt-12 sm:p-4 sm:pt-16 md:p-5">
                <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-white sm:text-lg md:text-xl">
                  {active.title}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[10px] text-white/65 sm:text-xs">
                  {active.category} · {active.year}
                  {active.completed === false
                    ? lang === "RU"
                      ? " · в работе"
                      : " · in progress"
                    : ""}
                  {active.video || (active.videos && active.videos.length > 0)
                    ? " · motion"
                    : ""}
                </p>
              </div>
            </motion.button>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 sm:hidden">
          <p className="text-[11px] text-[var(--text-faint)]">
            {lang === "RU" ? "Свайп для листания" : "Swipe to browse"}
          </p>
          <Link
            href="/projects"
            prefetch
            className="relative z-30 inline-flex min-h-9 items-center rounded-full border border-[var(--border)] px-3 text-[11px] text-[var(--text-muted)]"
            onClick={(event) => {
              event.stopPropagation();
              setSelected(null);
            }}
          >
            {content.projects.viewAll || (lang === "RU" ? "Все работы" : "View all")}
          </Link>
        </div>
      </div>

      <ProjectModal project={selected} lang={lang} onClose={() => setSelected(null)} />
    </section>
  );
});

export default Projects;
