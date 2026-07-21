"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ContentProvider, useContent } from "@/components/ContentProvider";
import type { ProjectItem } from "@/lib/content";

export type Lang = "RU" | "EN";

const ProjectCard = memo(function ProjectCard({
  project,
  index,
}: {
  project: ProjectItem;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group block cursor-pointer"
    >
      <div className="overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/50 aspect-[16/10] mb-6">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
        />
      </div>

      <div className="flex justify-between items-start mb-2">
        <h3 className="text-2xl font-semibold text-white tracking-tight group-hover:text-zinc-300 transition-colors">
          {project.title}
        </h3>
        <span className="text-sm text-zinc-500 font-mono">{project.year}</span>
      </div>

      <p className="text-sm text-zinc-400 mb-2">{project.category}</p>

      <p className="text-sm text-zinc-500 leading-relaxed max-w-md">{project.description}</p>
    </motion.div>
  );
});

function ProjectsPageContent() {
  const { lang, content } = useContent();
  const projects = content.projects.allItems;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-20 relative">
      <Navbar lang={lang} />

      <section className="py-20 px-10 md:px-20 bg-[#0a0a0a] border-b border-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/#projects"
            className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-6 flex items-center gap-2 hover:text-zinc-300 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {lang === "RU" ? "Назад" : "Back"}
          </Link>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6">
            {content.projects.allTitle}
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl">
            {lang === "RU"
              ? "Полный каталог всех моих работ, включая успешные проекты и экспериментальные разработки."
              : "Complete collection of all my work, including successful projects and experimental designs."}
          </p>
        </div>
      </section>

      <section className="py-20 px-10 md:px-20 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <span className="text-sm text-zinc-500">
              {lang === "RU" ? "Всего проектов" : "Total projects"}: {projects.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <ProjectCard key={project.id ?? index} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>

      <Footer lang={lang} />
      <LanguageSwitcher />
    </main>
  );
}

export default function ProjectsPage() {
  return (
    <ContentProvider initialLang="EN">
      <ProjectsPageContent />
    </ContentProvider>
  );
}
