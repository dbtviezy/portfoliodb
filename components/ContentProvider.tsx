"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PortfolioContent } from "@/lib/content";
import { channelsFromLegacy } from "@/lib/contact-channels";
import { isUsableProfileImage } from "@/lib/media";
import ruFallback from "@/locales/ru.json";
import enFallback from "@/locales/en.json";

export type Lang = "RU" | "EN";

type ContentContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  content: PortfolioContent;
  loading: boolean;
  /** False until the first content response (DB/API) is applied. */
  ready: boolean;
};

const ContentContext = createContext<ContentContextValue | null>(null);

function fallbackContent(lang: Lang): PortfolioContent {
  const source = lang === "RU" ? ruFallback : enFallback;
  const mapProjects = (items: typeof source.projects.allItems) =>
    items.map((item) => ({
      ...item,
      detail: "",
      links: [] as { label: string; url: string }[],
    }));

  const email = "daniilbautin0@gmail.com";
  const telegram = "@dbtviezy";
  const behance = "behance.net/3606019f";
  const dribbble = "dribbble.com/db-tviezy";

  return {
    navbar: source.navbar,
    hero: source.hero,
    about: {
      ...source.about,
      // Never paint stock Unsplash while waiting / as last resort empty.
      profileImage: isUsableProfileImage(source.about.profileImage)
        ? source.about.profileImage
        : "",
    },
    projects: {
      ...source.projects,
      featured: mapProjects(source.projects.featured),
      allItems: mapProjects(source.projects.allItems),
    },
    skills: source.skills,
    contact: {
      ...source.contact,
      email,
      telegram,
      behance,
      dribbble,
      instagram: "",
      channels: channelsFromLegacy({ email, telegram, behance, dribbble, instagram: "" }),
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
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
          // Keep a real portrait if the other language still has stock/empty.
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
        setContent((previous) => previous ?? fallbackContent(lang));
        setReady(true);
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
      content: content ?? fallbackContent(lang),
      loading,
      ready,
    }),
    [lang, content, loading, ready]
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
