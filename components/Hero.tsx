"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import WaveBackground from "./WaveBackground";
import { useContent } from "@/components/ContentProvider";

interface HeroProps {
  lang: "RU" | "EN";
}

const ease = [0.22, 1, 0.36, 1] as const;

const Hero = memo(function Hero({ lang }: HeroProps) {
  const { content } = useContent();
  const name = lang === "RU" ? "Даниил Баутин" : "Daniil Bautin";
  const reduceMotion = useReducedMotion();

  const enter = (delay: number, y = 18) =>
    reduceMotion
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.72, ease, delay },
        };

  return (
    <section
      aria-label={lang === "RU" ? "Визитка" : "Calling card"}
      className="relative flex w-full items-center justify-center overflow-x-clip bg-transparent select-none"
      style={{ minHeight: "var(--hero-min)" }}
    >
      <WaveBackground />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_90%_70%_at_70%_15%,rgba(255,255,255,0.1),transparent_55%),radial-gradient(ellipse_70%_55%_at_8%_80%,rgba(130,145,185,0.09),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[22%] top-[-18%] z-[2] h-[55%] w-[70%] rounded-full bg-white/[0.045] blur-3xl animate-[heroGlow_16s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[18%] bottom-[-25%] z-[2] h-[50%] w-[60%] rounded-full bg-white/[0.03] blur-3xl animate-[heroGlowAlt_20s_ease-in-out_infinite]"
      />
      <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-b from-transparent via-transparent to-[var(--bg)]" />

      <div
        className="relative z-20 flex w-full items-center py-16 md:py-20"
        style={{ paddingLeft: "var(--page-x)", paddingRight: "var(--page-x)" }}
      >
        <div className="mx-auto w-full max-w-5xl 2xl:max-w-6xl">
          <div className="max-w-3xl">
            <motion.p
              {...enter(0.08, 10)}
              className="mb-4 font-mono text-[10px] tracking-[0.26em] text-[var(--text-faint)] sm:mb-5 sm:text-[11px] md:tracking-[0.32em]"
            >
              $ db.tviezy
            </motion.p>

            <motion.h1
              {...enter(0.18, 26)}
              className="whitespace-nowrap bg-gradient-to-br from-white via-[var(--text)] to-[var(--text-muted)] bg-clip-text text-[clamp(1.85rem,7.2vw,5.25rem)] font-semibold leading-none tracking-[-0.035em] text-transparent"
            >
              {name}
            </motion.h1>

            <motion.p
              {...enter(0.32, 12)}
              className="mt-4 max-w-xl text-[12px] leading-snug tracking-wide text-[var(--text-muted)] sm:mt-5 sm:text-sm sm:leading-relaxed md:text-[15px]"
            >
              {content.hero.text1 || "Motion · interface · visual systems"}
            </motion.p>

            <motion.div
              initial={reduceMotion ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0.4 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.9, delay: 0.4, ease }}
              className="mt-5 h-px w-14 origin-left bg-gradient-to-r from-white/50 via-white/22 to-transparent sm:mt-6 sm:w-20"
            />

            <motion.div
              {...enter(0.5, 10)}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-10 sm:gap-x-6"
            >
              <a
                href="#projects"
                className="inline-flex min-h-10 items-center gap-2 text-[11px] tracking-[0.16em] text-[var(--text)] transition hover:text-[var(--text-muted)] sm:text-xs sm:tracking-[0.18em]"
              >
                {content.hero.btn || (lang === "RU" ? "Работы" : "Work")}
                <span aria-hidden className="animate-[heroBounce_1.6s_ease-in-out_infinite]">
                  ↓
                </span>
              </a>
              <a
                href="#bio"
                className="inline-flex min-h-10 items-center text-[11px] tracking-[0.16em] text-[var(--text-faint)] transition hover:text-[var(--text)] sm:text-xs sm:tracking-[0.18em]"
              >
                Bio
              </a>
              <a
                href="#contact"
                className="inline-flex min-h-10 items-center text-[11px] tracking-[0.16em] text-[var(--text-faint)] transition hover:text-[var(--text)] sm:text-xs sm:tracking-[0.18em]"
              >
                {lang === "RU" ? "Связаться" : "Contact"}
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Hero;
