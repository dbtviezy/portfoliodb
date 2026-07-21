"use client";

import { memo } from "react";
import { useContent } from "@/components/ContentProvider";

interface SkillsProps {
  lang: "RU" | "EN";
}

const Skills = memo(function Skills({ lang }: SkillsProps) {
  const { content } = useContent();
  const t = content.skills;
  const skills = t.items;

  return (
    <section className="py-24 px-10 md:px-20 bg-[var(--bg)] border-t border-zinc-900">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h2 className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
            {t.title}
          </h2>
        </div>

        <div className="md:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center justify-center p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-xl transition-all duration-300 hover:border-zinc-500 hover:bg-zinc-900 group"
              >
                <span className="text-zinc-400 text-lg font-medium transition-colors duration-300 group-hover:text-white">
                  {skill}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default Skills;
