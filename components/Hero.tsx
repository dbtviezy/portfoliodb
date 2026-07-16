"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WaveBackground from "./WaveBackground"; 

// Импортируем словари через абсолютные пути из корня проекта
// Импортируем словари через относительный путь (выходим из components/ в корень проекта)
import ru from "@/locales/ru.json";
import en from "@/locales/en.json";

interface HeroProps {
  lang: "RU" | "EN";
}

export default function Hero({ lang }: HeroProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Выбираем нужный словарь на лету
  const t = lang === "RU" ? ru.hero : en.hero;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.03,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.02,
        staggerDirection: -1,
      },
    },
  };

  const letterVariants = {
    hidden: { 
      opacity: 0, 
      filter: "blur(12px)",
      y: 10 
    },
    visible: { 
      opacity: 1, 
      filter: "blur(0px)",
      y: 0,
      transition: {
        duration: 0.3,
        // as any предотвращает ошибку типизации TypeScript при сборке
        ease: [0.215, 0.610, 0.355, 1.0] as any, 
      }
    },
    exit: { 
      opacity: 0, 
      filter: "blur(10px)",
      y: -10, 
      transition: {
        duration: 0.2,
        ease: [0.42, 0, 1, 1] as any
      }
    },
  };

  const renderLetters = (text: string) => {
    return text.split("").map((char, index) => (
      <motion.span
        key={`${char}-${index}`}
        variants={letterVariants}
        className="inline-block"
        style={{ display: char === " " ? "inline" : "inline-block" }}
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ));
  };

  return (
    <section className="min-h-screen w-full flex flex-col justify-start items-start pt-32 md:pt-48 relative overflow-hidden select-none bg-[#0a0a0a]">
      <WaveBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-10" />
      
      {/* Идеальная сетка по нашему стандарту */}
      <div className="z-20 relative w-full px-8 md:px-32 flex flex-col items-start">
        
        <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-6 block">
          {t.location}
        </span>

        <div 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="cursor-pointer py-4 grid grid-cols-1 grid-rows-1 w-full"
        >
          <AnimatePresence mode="wait">
            {!isHovered ? (
              <motion.h1
                key={`text1-${lang}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="col-start-1 row-start-1 text-5xl md:text-8xl font-extrabold tracking-tighter text-zinc-200 hover:text-white leading-none font-sans"
              >
                {renderLetters(t.text1)}
              </motion.h1>
            ) : (
              <motion.h1
                key={`text2-${lang}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="col-start-1 row-start-1 text-5xl md:text-8xl font-extrabold tracking-tighter text-zinc-200 hover:text-white leading-none font-sans"
              >
                {renderLetters(t.text2)}
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-sm md:text-base text-zinc-500 max-w-lg leading-relaxed">
          {t.desc}
        </p>

        <div className="mt-12">
          <a 
            href="#projects" 
            className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-500 bg-[#111113]/50 px-6 py-3.5 rounded-full transition-all duration-300"
          >
            {t.btn}
          </a>
        </div>

      </div>
    </section>
  );
}