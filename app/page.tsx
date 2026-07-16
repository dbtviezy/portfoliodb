"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Contact from "@/components/Contact"; 
import Footer from "@/components/Footer";

export type Lang = "RU" | "EN";

export default function Home() {
  // 1. Установили дефолтное (сток) значение "EN"
  const [lang, setLang] = useState<Lang>("EN");
  const [isHovered, setIsHovered] = useState(false);

  const languages: Lang[] = ["EN", "RU"];
  // Неактивный язык, который прячется/показывается при ховере
  const inactiveLang = lang === "EN" ? "RU" : "EN";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-20 relative">
      
      <Navbar lang={lang} /> 
      
      <Hero lang={lang} />
      <Projects />
      <About lang={lang} />
      <Skills />
      <Contact lang={"RU"} />
      
      <Footer lang={lang} />

      {/* 
        ИНТЕРАКТИВНЫЙ ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА
      */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <motion.div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          layout
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 26
          }}
          // Убрали border, оставили чистый полупрозрачный темный фон с размытием
          className="flex items-center bg-[#111113]/90 rounded-full p-1 backdrop-blur-md shadow-2xl overflow-hidden cursor-pointer h-9"
        >
          {/* Активный (текущий) язык — виден всегда */}
          <motion.button
            layout
            onClick={() => setLang(lang)}
            className="w-7 h-7 text-[10px] font-extrabold tracking-wider rounded-full bg-zinc-100 text-[#0a0a0a] flex items-center justify-center transition-colors duration-250 select-none"
          >
            {lang}
          </motion.button>

          {/* Скрытый язык — выезжает справа при ховере */}
          <AnimatePresence>
            {isHovered && (
              <motion.button
                key={inactiveLang}
                initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                animate={{ width: 28, opacity: 1, marginLeft: 4 }}
                exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                onClick={() => {
                  setLang(inactiveLang);
                  setIsHovered(false); // Скрываем после клика
                }}
                className="h-7 text-[10px] font-extrabold tracking-wider text-zinc-500 hover:text-zinc-300 flex items-center justify-center select-none whitespace-nowrap"
              >
                {inactiveLang}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
    </main>
  );
}