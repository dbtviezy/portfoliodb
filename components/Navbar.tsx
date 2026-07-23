"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContent } from "@/components/ContentProvider";

interface NavbarProps {
  lang: "RU" | "EN";
}

const Navbar = memo(function Navbar({ lang }: NavbarProps) {
  const { content } = useContent();
  const t = content.navbar;
  const pathname = usePathname();

  const triggerText = "db.tviezy";
  const targetText = "daniil bautin";
  const [displayText, setDisplayText] = useState(triggerText);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastY = useRef(0);
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
          if (index < state.iteration) return currentText[index];
          if (currentText[index] === " ") return " ";
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

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (y < 48) {
        setHidden(false);
      } else if (y > lastY.current + 6) {
        setHidden(true);
      } else if (y < lastY.current - 6) {
        setHidden(false);
      }
      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    {
      href: "/projects",
      label: lang === "RU" ? "Работы" : "Work",
      active: pathname.startsWith("/projects"),
    },
    {
      href: "/#bio",
      label: "Bio",
      active: false,
    },
    {
      href: "/#contact",
      label: lang === "RU" ? "Связь" : t.contact,
      active: false,
    },
  ];

  return (
    <header
      className={`pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3 transition-transform duration-300 ease-out sm:px-5 sm:pt-4 ${
        hidden ? "-translate-y-[120%]" : "translate-y-0"
      }`}
    >
      <nav
        className={`pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-3 rounded-full border px-3 py-2 transition-[background-color,border-color,box-shadow] duration-300 sm:px-4 sm:py-2.5 sm:backdrop-blur-xl ${
          scrolled
            ? "border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:bg-[var(--bg-elevated)]/90"
            : "border-white/[0.08] bg-[var(--bg)]/92 sm:border-white/[0.06] sm:bg-[var(--bg)]/50"
        }`}
      >
        <Link
          href="/"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex min-w-0 shrink items-center font-mono text-[10px] font-bold tracking-wider text-[var(--text-muted)] transition hover:text-[var(--text)] sm:text-xs"
          aria-label="Home"
        >
          <span className="whitespace-nowrap">$ {displayText}</span>
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {links.map((link) =>
            link.href.includes("#bio") ? (
              <a
                key={link.href}
                href="/#bio"
                onClick={(e) => {
                  if (pathname === "/") {
                    e.preventDefault();
                    window.location.hash = "bio";
                  }
                }}
                className={`rounded-full px-2.5 py-1.5 text-[10px] font-medium tracking-wide transition sm:px-3 sm:text-xs ${
                  link.active
                    ? "bg-white/[0.08] text-[var(--text)]"
                    : "text-[var(--text-faint)] hover:bg-white/[0.04] hover:text-[var(--text)]"
                }`}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-2.5 py-1.5 text-[10px] font-medium tracking-wide transition sm:px-3 sm:text-xs ${
                  link.active
                    ? "bg-white/[0.08] text-[var(--text)]"
                    : "text-[var(--text-faint)] hover:bg-white/[0.04] hover:text-[var(--text)]"
                }`}
              >
                {link.label}
              </Link>
            )
          )}
        </div>
      </nav>
    </header>
  );
});

export default Navbar;
