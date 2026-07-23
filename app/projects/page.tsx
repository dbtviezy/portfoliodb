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
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: Math.min(index * 0.06, 0.3), duration: 0.45 }}
      className="group block w-full cursor-pointer text-left"
    >
      <div className="mb-4 aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] sm:mb-5">
        <img
          src={project.image}
          alt={project.title}
          className="h-full w-full object-cover opacity-85 transition duration-700 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
        />
      </div>

      <div className="mb-1 flex items-start justify-between gap-3 sm:mb-1.5">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--text)] transition group-hover:text-[var(--text-muted)] sm:text-xl">
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

  const openProject = useCallback(
    (project: ProjectItem) => {
      setSelected(project);
      if (project.id) {
        router.replace(`/projects?id=${project.id}`, { scroll: false });
      }
    },
    [router]
  );

  const closeProject = useCallback(() => {
    setSelected(null);
    router.replace("/projects", { scroll: false });
  }, [router]);

  useEffect(() => {
    const id = Number(searchParams.get("id"));
    if (!id || Number.isNaN(id)) return;
    const match = projects.find((project) => project.id === id);
    if (match) setSelected(match);
  }, [searchParams, projects]);

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
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
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
