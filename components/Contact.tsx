"use client";

import { useRef, memo, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useContent } from "@/components/ContentProvider";

interface ContactProps {
  lang: "RU" | "EN";
}

const Contact = memo(function Contact({ lang }: ContactProps) {
  const { content } = useContent();
  const t = content.contact;

  const connections = useMemo(
    () => [
      { name: "Email", value: t.email, url: `mailto:${t.email}` },
      { name: "Telegram", value: t.telegram, url: `https://t.me/${t.telegram.replace("@", "")}` },
      { name: "Behance", value: t.behance, url: `https://${t.behance}` },
      { name: "Dribbble", value: t.dribbble, url: `https://${t.dribbble}` },
    ],
    [t]
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  const opacity0 = useTransform(scrollYProgress, [0, 0.7, 0.91, 1], [0, 0, 1, 1]);
  const y0 = useTransform(scrollYProgress, [0, 0.7, 0.91, 1], [-60, -60, 0, 0]);
  const opacity1 = useTransform(scrollYProgress, [0, 0.76, 0.94, 1], [0, 0, 1, 1]);
  const y1 = useTransform(scrollYProgress, [0, 0.76, 0.94, 1], [-60, -60, 0, 0]);
  const opacity2 = useTransform(scrollYProgress, [0, 0.82, 0.97, 1], [0, 0, 1, 1]);
  const y2 = useTransform(scrollYProgress, [0, 0.82, 0.97, 1], [-60, -60, 0, 0]);
  const opacity3 = useTransform(scrollYProgress, [0, 0.88, 1.0, 1], [0, 0, 1, 1]);
  const y3 = useTransform(scrollYProgress, [0, 0.88, 1.0, 1], [-60, -60, 0, 0]);

  const cardAnimations = [
    { opacity: opacity0, y: y0 },
    { opacity: opacity1, y: y1 },
    { opacity: opacity2, y: y2 },
    { opacity: opacity3, y: y3 },
  ];

  return (
    <section
      id="contact"
      ref={containerRef}
      className="py-32 px-6 md:px-20 bg-[#0a0a0a] border-t border-zinc-900/50 flex flex-col items-center overflow-hidden"
    >
      <div className="w-full max-w-4xl text-center flex flex-col items-center relative">
        <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-6 block select-none">
          {t.subtitle}
        </span>

        <a href={`mailto:${t.email}`} className="group relative block mb-16 select-none z-10">
          <h2 className="text-4xl md:text-7xl font-bold tracking-tighter text-zinc-300 group-hover:text-white transition-colors duration-500 leading-tight">
            {t.title1} <br />
            <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors duration-500">
              {t.title2}
            </span>
          </h2>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-zinc-700 group-hover:w-full transition-all duration-500" />
        </a>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full mt-8 relative z-0">
          {connections.map((link, index) => {
            const { opacity, y } = cardAnimations[index];

            return (
              <motion.a
                href={link.url}
                key={index}
                target="_blank"
                rel="noopener noreferrer"
                whileHover="hover"
                style={{
                  opacity,
                  y,
                }}
                className="relative p-5 bg-[#111113] border border-zinc-900/80 rounded-2xl flex flex-col items-start text-left overflow-hidden cursor-pointer select-none group"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  variants={{
                    hover: { opacity: 1 },
                  }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-[#161619] z-0"
                />

                <span className="relative z-10 text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-2">
                  {link.name}
                </span>

                <div className="relative z-10 flex items-center gap-1.5 w-full justify-between">
                  <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
                    {link.value}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-3.5 h-3.5 text-zinc-600 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                    />
                  </svg>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default Contact;
