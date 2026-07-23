"use client";

import { memo } from "react";
import { useContent } from "@/components/ContentProvider";

interface AboutProps {
  lang: "RU" | "EN";
}

const About = memo(function About({ lang }: AboutProps) {
  const { content } = useContent();
  const about = content.about;
  const skills = content.skills;

  return (
    <section
      id="about"
      className="relative"
      style={{
        paddingLeft: "var(--page-x)",
        paddingRight: "var(--page-x)",
        paddingTop: "var(--section-y)",
        paddingBottom: "var(--section-y)",
      }}
    >
      <div className="mx-auto w-full max-w-5xl 2xl:max-w-6xl">
        <div className="grid grid-cols-1 items-start gap-7 sm:gap-9 md:grid-cols-[0.85fr_1.15fr] md:gap-12 lg:gap-16">
          <div className="mx-auto w-full max-w-[280px] sm:max-w-sm md:mx-0 md:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)]">
              {about.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={about.profileImage}
                  alt={lang === "RU" ? "Портрет" : "Portrait"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.06),transparent_55%)]">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--text-faint)]">
                    $ db.tviezy
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
              {about.stats.map((stat, idx) => (
                <div key={idx} className="text-left">
                  <div className="text-base font-semibold tracking-tight text-[var(--text)] sm:text-xl md:text-2xl">
                    {stat.value}
                  </div>
                  <div className="mt-0.5 text-[9px] leading-snug text-[var(--text-faint)] sm:mt-1 sm:text-[11px]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:pt-1">
            <p className="mb-2.5 text-xs text-[var(--text-faint)] sm:mb-3 sm:text-sm">{about.title}</p>
            <p className="text-[17px] font-light leading-relaxed text-[var(--text)] sm:text-xl md:text-2xl">
              {about.desc1}
            </p>
            <p className="mt-3.5 text-[13px] leading-relaxed text-[var(--text-muted)] sm:mt-5 sm:text-sm md:text-[15px]">
              {about.desc2}
            </p>

            <div className="mt-7 sm:mt-10">
              <p className="mb-2.5 text-xs text-[var(--text-faint)] sm:mb-3 sm:text-sm">{about.expertise}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2">
                {about.expertiseItems.map((item) => (
                  <span key={item} className="text-[13px] text-[var(--text-muted)] sm:text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-7 border-t border-[var(--border)] pt-5 sm:mt-10 sm:pt-8">
              <p className="mb-2.5 text-xs text-[var(--text-faint)] sm:mb-3 sm:text-sm">{skills.title}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2">
                {skills.items.map((skill) => (
                  <span key={skill} className="text-[13px] text-[var(--text)] sm:text-sm">
                    {skill}
                  </span>
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
