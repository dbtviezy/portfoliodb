"use client";

import { memo, useMemo, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useContent } from "@/components/ContentProvider";
import { guessChannelUrl } from "@/lib/contact-channels";

interface ContactProps {
  lang: "RU" | "EN";
}

function quietHeading(title1: string, lang: "RU" | "EN") {
  const t = title1.trim();
  if (!t) return lang === "RU" ? "Напишите" : "Write me";
  if (/get in touch|let'?s build|great together|hello$|давайте создадим|потрясающ|^say hello$/i.test(t)) {
    return lang === "RU" ? "Напишите" : "Write me";
  }
  return t;
}

function quietEyebrow(subtitle: string, lang: "RU" | "EN") {
  const t = subtitle.trim();
  if (!t || /get in touch|связаться/i.test(t)) {
    return lang === "RU" ? "Связь" : "Contact";
  }
  return t;
}

const Contact = memo(function Contact({ lang }: ContactProps) {
  const { content } = useContent();
  const t = content.contact;
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const eyebrow = quietEyebrow(t.subtitle ?? "", lang);
  const heading = quietHeading(t.title1 ?? "", lang);
  const blurb =
    t.button?.trim() && !/write me|^написать$/i.test(t.button.trim())
      ? t.button.trim()
      : lang === "RU"
        ? "Коротко о проекте — или просто hello."
        : "A short note about a project — or just hello.";

  const channels = useMemo(
    () => (t.channels ?? []).filter((c) => c.label.trim() && c.value.trim()),
    [t.channels]
  );
  const primaries = channels.filter((c) => c.group !== "social");
  const socials = channels.filter((c) => c.group === "social");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });

  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [28, 0]);

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative overflow-hidden"
      style={{
        paddingLeft: "var(--page-x)",
        paddingRight: "var(--page-x)",
        paddingTop: "calc(var(--section-y) * 0.9)",
        paddingBottom: "calc(var(--section-y) * 0.85 + var(--safe-bottom))",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_8%_20%,rgba(255,255,255,0.04),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent"
      />

      <motion.div
        style={{ y, opacity: 1 }}
        className="relative mx-auto w-full max-w-5xl 2xl:max-w-6xl"
      >
        <p className="mb-3 font-mono text-[10px] tracking-[0.28em] text-[var(--text-faint)] sm:text-[11px]">
          {eyebrow}
        </p>

        <h2 className="text-[clamp(1.65rem,4.5vw,2.35rem)] font-semibold tracking-tight text-[var(--text)]">
          {heading}
        </h2>

        <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[var(--text-faint)] sm:text-sm">
          {blurb}
        </p>

        {primaries.length > 0 ? (
          <ul className="mt-8 flex flex-col gap-5 sm:mt-9 sm:flex-row sm:flex-wrap sm:gap-x-14 sm:gap-y-5">
            {primaries.map((link) => {
              const href = link.url || guessChannelUrl(link.label, link.value);
              return (
                <li key={`${link.label}-${link.value}`}>
                  <a
                    href={href}
                    target={href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                    className="group inline-flex flex-col gap-1.5"
                  >
                    <span className="text-[10px] tracking-[0.2em] text-[var(--text-faint)] sm:text-[11px]">
                      {link.label}
                    </span>
                    <span className="border-b border-white/20 pb-0.5 text-[15px] text-[var(--text)] transition group-hover:border-white/45 sm:text-base">
                      {link.value}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}

        {socials.length > 0 ? (
          <>
            <div className="mt-10 h-px w-full max-w-md bg-gradient-to-r from-white/16 via-white/6 to-transparent sm:mt-11" />
            <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-2.5 sm:gap-x-8">
              {socials.map((link) => {
                const href = link.url || guessChannelUrl(link.label, link.value);
                return (
                  <li key={`${link.label}-${link.value}`}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-[var(--text-faint)] transition hover:text-[var(--text)] sm:text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </motion.div>
    </section>
  );
});

export default Contact;
