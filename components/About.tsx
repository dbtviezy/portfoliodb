"use client";

import { memo } from "react";
import { useContent } from "@/components/ContentProvider";

interface AboutProps {
  lang: "RU" | "EN";
}

const About = memo(function About({ lang }: AboutProps) {
  const { content } = useContent();
  const t = content.about;
  const stats = t.stats;

  return (
    <section className="py-24 px-10 md:px-20 bg-[#0a0a0a] border-t border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm font-semibold tracking-widest text-zinc-400 uppercase mb-16">
          {t.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          <div className="flex flex-col justify-center">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-800 group">
              <img
                src={
                  t.profileImage ||
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
                }
                alt="Profile"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center hover:bg-zinc-900 hover:border-zinc-700 transition-all"
                >
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-zinc-400 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-xl md:text-2xl text-zinc-200 leading-relaxed font-light mb-8">
              {t.desc1}
            </p>
            <p className="text-base md:text-lg text-zinc-400 leading-relaxed mb-8">
              {t.desc2}
            </p>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-widest text-zinc-300 uppercase mb-6">
                {t.expertise}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {t.expertiseItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800/30 hover:border-zinc-700 transition-all cursor-default"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default About;
