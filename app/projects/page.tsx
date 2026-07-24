"use client";

import { Suspense, memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ProjectModal from "@/components/ProjectModal";
import BioModal from "@/components/BioModal";
import FramedImage from "@/components/FramedImage";
import { ContentProvider, useContent } from "@/components/ContentProvider";
import ContentGate from "@/components/ContentGate";
import type { ProjectItem } from "@/lib/content";

export type Lang = "RU" | "EN";

const ProjectCard = memo(function ProjectCard({
  project,
  index,
  lang,
  onOpen,
}: {
  project: ProjectItem;
  index: number;
  lang: Lang;
  onOpen: (project: ProjectItem) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(project)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.985 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: Math.min(index * 0.06, 0.3), duration: 0.45 }}
      className="group relative z-0 block w-full cursor-pointer text-left hover:z-10"
    >
      <div className="mb-4 aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_0_0_transparent] transition duration-500 group-hover:border-[var(--border-strong)] group-hover:shadow-[0_22px_50px_rgba(0,0,0,0.35)] sm:mb-5">
        <div className="h-full w-full opacity-85 transition duration-700 ease-out group-hover:opacity-100 sm:group-hover:scale-[1.04]">
          <FramedImage
            src={project.image}
            alt={project.title}
            frame={project.imageFrame}
          />
        </div>
      </div>

      <div className="mb-1 flex items-start justify-between gap-3 sm:mb-1.5">
        <h3 className="min-w-0 flex-1 break-words text-lg font-semibold tracking-tight text-[var(--text)] transition group-hover:text-[var(--text)] sm:text-xl">
          {project.title}
        </h3>
        <span className="shrink-0 font-mono text-xs text-[var(--text-faint)] sm:text-sm">{project.year}</span>
      </div>

      <p className="mb-1.5 text-[13px] text-[var(--text-muted)] sm:mb-2 sm:text-sm">
        {project.category}
        {project.completed === false
          ? lang === "RU"
            ? " · в работе"
            : " · in progress"
          : ""}
      </p>
      <p className="line-clamp-2 text-[13px] leading-relaxed text-[var(--text-faint)] sm:text-sm">
        {project.description}
      </p>
    </motion.button>
  );
});

function ProjectsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, content } = useContent();
  const projects = content.projects.allItems;
  const [selected, setSelected] = useState<ProjectItem | null>(null);
  const projectIdParam = searchParams.get("id");

  const clearProjectQuery = useCallback(() => {
    router.replace("/projects", { scroll: false });
  }, [router]);

  const openProject = useCallback(
    (project: ProjectItem) => {
      setSelected(project);
      if (project.id) {
        // Keep /projects in history so Back returns to the full grid.
        router.push(`/projects?id=${project.id}`, { scroll: false });
      }
    },
    [router]
  );

  const closeProject = useCallback(() => {
    setSelected(null);
    clearProjectQuery();
  }, [clearProjectQuery]);

  // Modal state follows the URL only — no id means the grid, never a leftover project.
  useEffect(() => {
    if (!projectIdParam) {
      setSelected(null);
      return;
    }

    const id = Number(projectIdParam);
    if (!Number.isFinite(id) || id <= 0) {
      setSelected(null);
      clearProjectQuery();
      return;
    }

    if (projects.length === 0) return;

    const match = projects.find((project) => project.id === id);
    if (match) {
      setSelected(match);
      return;
    }

    // Stale / other-language id: show the grid, don't fall back to the first card.
    setSelected(null);
    clearProjectQuery();
  }, [projectIdParam, projects, clearProjectQuery]);

  return (
    <main
      className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]"
      style={{ paddingTop: "4.5rem" }}
    >
      <Navbar lang={lang} />

      <section
        className="border-b border-[var(--border)]"
        style={{
          paddingLeft: "var(--page-x)",
          paddingRight: "var(--page-x)",
          paddingTop: "calc(var(--section-y) * 0.75)",
          paddingBottom: "calc(var(--section-y) * 0.75)",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <Link
            href="/#projects"
            className="mb-5 inline-flex min-h-10 items-center gap-2 text-[13px] text-[var(--text-faint)] transition hover:text-[var(--text)] sm:mb-8 sm:text-sm"
          >
            ← {lang === "RU" ? "На главную" : "Back home"}
          </Link>

          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end md:gap-6">
            <div>
              <h1 className="mb-2.5 text-[1.75rem] font-semibold tracking-tight sm:mb-4 sm:text-4xl md:text-5xl">
                {lang === "RU" ? "Работы" : "Work"}
              </h1>
              <p className="max-w-xl text-[13px] text-[var(--text-muted)] sm:text-base">
                {lang === "RU"
                  ? "Избранные и остальные проекты. Откройте карточку — там описание и ссылки."
                  : "Selected work and more. Open a piece for notes and links."}
              </p>
            </div>
            <p className="shrink-0 text-[13px] text-[var(--text-faint)] sm:text-sm">
              {projects.length} {lang === "RU" ? "проектов" : "projects"}
            </p>
          </div>
        </div>
      </section>

      <section
        style={{
          paddingLeft: "var(--page-x)",
          paddingRight: "var(--page-x)",
          paddingTop: "calc(var(--section-y) * 0.7)",
          paddingBottom: "calc(var(--section-y) + var(--safe-bottom))",
        }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-7 overflow-visible sm:grid-cols-2 sm:gap-10 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id ?? index}
              project={project}
              index={index}
              lang={lang}
              onOpen={openProject}
            />
          ))}
        </div>
      </section>

      <Footer lang={lang} />
      <LanguageSwitcher />
      <ProjectModal project={selected} lang={lang} onClose={closeProject} />
      <BioModal lang={lang} />
    </main>
  );
}

function ProjectsPageInner() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--bg)]" />}>
      <ProjectsPageContent />
    </Suspense>
  );
}

export default function ProjectsPage() {
  return (
    <ContentProvider initialLang="EN">
      <ContentGate>
        <ProjectsPageInner />
      </ContentGate>
    </ContentProvider>
  );
}
