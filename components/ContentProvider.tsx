"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PortfolioContent } from "@/lib/content";
import { emptyPortfolioContent } from "@/lib/empty-content";
import { isUsableProfileImage } from "@/lib/media";

export type Lang = "RU" | "EN";

const LANG_STORAGE_KEY = "dbtviezy-lang";

type ContentContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  content: PortfolioContent;
  loading: boolean;
  /** False until the first content response (DB/API) is applied. */
  ready: boolean;
};

const ContentContext = createContext<ContentContextValue | null>(null);

function readStoredLang(fallback: Lang): Lang {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (raw === "RU" || raw === "EN") return raw;
  } catch {
    // ignore
  }
  return fallback;
}

export function ContentProvider({
  children,
  initialLang = "EN",
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLangState(readStoredLang(initialLang));
    setHydrated(true);
  }, [initialLang]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    document.documentElement.lang = lang === "RU" ? "ru" : "en";
  }, [lang, hydrated]);

  const setLang = (next: Lang) => setLangState(next);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    async function loadContent() {
      setLoading(true);
      try {
        const response = await fetch(`/api/content?lang=${lang.toLowerCase()}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to load content");
        const data = (await response.json()) as PortfolioContent;
        if (cancelled) return;

        setContent((previous) => {
          if (
            previous &&
            isUsableProfileImage(previous.about.profileImage) &&
            !isUsableProfileImage(data.about.profileImage)
          ) {
            return {
              ...data,
              about: { ...data.about, profileImage: previous.about.profileImage },
            };
          }
          return data;
        });
        setReady(true);
      } catch {
        if (cancelled) return;
        // Never fall back to locale Unsplash demos — keep previous cloud data or empty shell.
        setContent((previous) => previous ?? emptyPortfolioContent(lang));
        setReady(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadContent();
    return () => {
      cancelled = true;
    };
  }, [lang, hydrated]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      content: content ?? emptyPortfolioContent(lang),
      loading,
      ready,
    }),
    [lang, content, loading, ready]
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}
