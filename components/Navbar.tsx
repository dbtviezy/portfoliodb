"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { useContent } from "@/components/ContentProvider";

interface NavbarProps {
  lang: "RU" | "EN";
}

const Navbar = memo(function Navbar({ lang }: NavbarProps) {
  const { content } = useContent();
  const t = content.navbar;

  const triggerText = "db.tviezy";
  const targetText = "daniil bautin";
  const [displayText, setDisplayText] = useState(triggerText);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ iteration: 0, isAnimating: false, isEntering: false });

  const letters = "abcdefghijklmnopqrstuvwxyz";

  const animate = useCallback(() => {
    const state = stateRef.current;
    const currentText = state.isEntering ? targetText : triggerText;

    if (state.iteration >= currentText.length) {
      state.isAnimating = false;
      return;
    }

    setDisplayText(
      currentText
        .split("")
        .map((letter, index) => {
          if (index < state.iteration) {
            return currentText[index];
          }
          if (currentText[index] === " ") {
            return " ";
          }
          return letters[Math.floor(Math.random() * 26)];
        })
        .join("")
    );

    state.iteration += 1 / 3;
    rafRef.current = requestAnimationFrame(animate);
  }, [letters, triggerText, targetText]);

  const handleMouseEnter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    stateRef.current = { iteration: 0, isAnimating: true, isEntering: true };
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    stateRef.current = { iteration: 0, isAnimating: true, isEntering: false };
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-900/50 px-6 md:px-20 lg:px-32 h-20 flex justify-between items-center">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="font-mono text-xs md:text-sm text-zinc-400 font-bold tracking-wider cursor-pointer h-5 flex items-center min-w-[120px]"
      >
        $ {displayText}
      </div>

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
});

export default Navbar;
