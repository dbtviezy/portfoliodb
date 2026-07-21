"use client";

import { memo } from "react";
import Link from "next/link";
import { useContent } from "@/components/ContentProvider";

interface ProjectsProps {
  lang: "RU" | "EN";
}

const Projects = memo(function Projects({ lang }: ProjectsProps) {
  const { content } = useContent();
  const t = content.projects;
  const projects = t.featured;

  return (
    <section id="projects" className="py-20 px-10 md:px-20 bg-[#0a0a0a]">
      <div className="flex justify-between items-baseline border-b border-zinc-800 pb-6 mb-12">
        <h2 className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
          {t.title}
        </h2>
        <span className="text-xs text-zinc-500">
          {t.showing} {projects.length} {t.of} {t.allItems.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {projects.map((project, index) => (
          <div key={project.id ?? index} className="group block cursor-pointer">
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

            <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
              {project.description}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Link
          href="/projects"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-500 bg-[#111113]/50 px-8 py-4 rounded-full transition-all duration-300 hover:bg-[#111113] flex items-center gap-2 group"
        >
          {t.viewAll}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
});

export default Projects;
