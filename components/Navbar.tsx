"use client";

import { useState, useRef } from "react";
import Link from "next/link";
// 1. Импортируем словари
import ru from "@/locales/ru.json";
import en from "@/locales/en.json";

// 2. Объявляем пропсы для языка
interface NavbarProps {
  lang: "RU" | "EN";
}

// 3. ОДНО Единственное объявление функции Navbar
export default function Navbar({ lang }: NavbarProps) {
  const triggerText = "db.tviezy";
  const targetText = "daniil bautin";
  const [displayText, setDisplayText] = useState(triggerText);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Выбираем переводы из JSON
  const t = lang === "RU" ? ru.navbar : en.navbar;

  const letters = "abcdefghijklmnopqrstuvwxyz";

  const handleMouseEnter = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let iteration = 0;

    intervalRef.current = setInterval(() => {
      setDisplayText((prev) =>
        targetText
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return targetText[index];
            }
            if (targetText[index] === " ") {
              return " ";
            }
            return letters[Math.floor(Math.random() * 26)];
          })
          .join("")
      );

      if (iteration >= targetText.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      iteration += 1 / 3;
    }, 30);
  };

  const handleMouseLeave = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let iteration = 0;

    intervalRef.current = setInterval(() => {
      setDisplayText((prev) =>
        triggerText
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return triggerText[index];
            }
            if (triggerText[index] === " ") {
              return " ";
            }
            return letters[Math.floor(Math.random() * 26)];
          })
          .join("")
      );

      if (iteration >= triggerText.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      iteration += 1 / 3;
    }, 30);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-900/50 px-6 md:px-20 lg:px-32 h-20 flex justify-between items-center">
      {/* Твой анимированный логотип */}
      <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="font-mono text-xs md:text-sm text-zinc-400 font-bold tracking-wider cursor-pointer h-5 flex items-center min-w-[120px]"
      >
        $ {displayText}
      </div>
      
      {/* Локализованные ссылки */}
      <div className="flex gap-6 text-xs md:text-sm text-zinc-500 font-medium tracking-wide">
        <Link href="#projects" className="hover:text-zinc-200 transition-colors duration-200">
          {t.projects}
        </Link>
        <Link href="#contact" className="hover:text-zinc-200 transition-colors duration-200">
          {t.contact}
        </Link>
      </div>
    </nav>
  );
}