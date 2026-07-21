"use client";

import { useContent } from "@/components/ContentProvider";

export default function LanguageSwitcher() {
  const { lang, setLang } = useContent();
  const inactiveLang = lang === "EN" ? "RU" : "EN";

  return (
    <div
      className="fixed z-[9999]"
      style={{
        right: "max(0.85rem, env(safe-area-inset-right))",
        bottom: "max(0.85rem, calc(0.85rem + var(--safe-bottom)))",
      }}
    >
      <div className="flex h-8 items-center gap-0.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]/95 p-0.5 shadow-lg backdrop-blur-md sm:h-9 sm:gap-1 sm:p-1">
        <button
          type="button"
          onClick={() => setLang(lang)}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-extrabold tracking-wider text-[var(--accent-fg)] sm:h-7 sm:w-7 sm:text-[10px]"
          aria-current="true"
        >
          {lang}
        </button>
        <button
          type="button"
          onClick={() => setLang(inactiveLang)}
          className="flex h-6 min-w-6 items-center justify-center px-1.5 text-[9px] font-extrabold tracking-wider text-[var(--text-faint)] transition hover:text-[var(--text)] sm:h-7 sm:min-w-7 sm:text-[10px]"
        >
          {inactiveLang}
        </button>
      </div>
    </div>
  );
}
