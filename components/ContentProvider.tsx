"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PortfolioContent } from "@/lib/content";
import ruFallback from "@/locales/ru.json";
import enFallback from "@/locales/en.json";

export type Lang = "RU" | "EN";

type ContentContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  content: PortfolioContent;
  loading: boolean;
};

const ContentContext = createContext<ContentContextValue | null>(null);

function fallbackContent(lang: Lang): PortfolioContent {
  const source = lang === "RU" ? ruFallback : enFallback;
  return {
    navbar: source.navbar,
    hero: source.hero,
    about: source.about,
    projects: source.projects,
    skills: source.skills,
    contact: {
      ...source.contact,
      email: "daniilbautin0@gmail.com",
      telegram: "@dbtviezy",
      behance: "behance.net/3606019f",
      dribbble: "dribbble.com/db-tviezy",
    },
  };
}

export function ContentProvider({
  children,
  initialLang = "EN",
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [content, setContent] = useState<PortfolioContent>(() => fallbackContent(initialLang));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      setLoading(true);
      try {
        const response = await fetch(`/api/content?lang=${lang.toLowerCase()}`);
        if (!response.ok) throw new Error("Failed to load content");
        const data = (await response.json()) as PortfolioContent;
        if (!cancelled) setContent(data);
      } catch {
        if (!cancelled) setContent(fallbackContent(lang));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadContent();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      content,
      loading,
    }),
    [lang, content, loading]
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useContent must be used within ContentProvider");
  }
  return context;
}
