"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PortfolioContent } from "@/lib/content";
import { emptyPortfolioContent } from "@/lib/empty-content";
import { isUsableProfileImage } from "@/lib/media";
import {
  consumeContentBustFlag,
  hashContent,
  readCachedContent,
  subscribeContentBust,
  writeCachedContent,
} from "@/lib/content-cache";

export type Lang = "RU" | "EN";

const LANG_STORAGE_KEY = "dbtviezy-lang";

type ContentContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  content: PortfolioContent;
  loading: boolean;
  /** False until the first content response (DB/API) is applied. */
  ready: boolean;
  /** Soft refresh from network (uses cache when unchanged). */
  refresh: () => void;
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

function mergeProfileGuard(
  previous: PortfolioContent | null,
  next: PortfolioContent
): PortfolioContent {
  if (
    previous &&
    isUsableProfileImage(previous.about.profileImage) &&
    !isUsableProfileImage(next.about.profileImage)
  ) {
    return {
      ...next,
      about: { ...next.about, profileImage: previous.about.profileImage },
    };
  }
  return next;
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
  const [reloadTick, setReloadTick] = useState(0);
  const hashRef = useRef<string>("");

  useEffect(() => {
    const stored = readStoredLang(initialLang);
    setLangState(stored);
    // If Studio saved while this tab was away, drop stale cache before paint.
    consumeContentBustFlag();
    const cached = readCachedContent(stored);
    if (cached) {
      setContent(cached.data);
      hashRef.current = cached.hash;
      setReady(true);
      setLoading(false);
    }
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

  const setLang = useCallback((next: Lang) => {
    setLangState((prev) => {
      if (next === prev) return prev;
      const cached = readCachedContent(next);
      if (cached) {
        setContent(cached.data);
        hashRef.current = cached.hash;
        setReady(true);
        setLoading(false);
      } else {
        setLoading(true);
      }
      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    setReloadTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    async function loadContent() {
      const cached = readCachedContent(lang);
      if (cached) {
        setContent((previous) => previous ?? cached.data);
        if (!hashRef.current) hashRef.current = cached.hash;
        setReady(true);
      } else if (!content) {
        setLoading(true);
      }

      try {
        const response = await fetch(`/api/content?lang=${lang.toLowerCase()}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to load content");
        const data = (await response.json()) as PortfolioContent;
        if (cancelled) return;

        const nextHash = hashContent(data);
        if (nextHash === hashRef.current) {
          writeCachedContent(lang, data);
          setReady(true);
          setLoading(false);
          return;
        }

        setContent((previous) => {
          const merged = mergeProfileGuard(previous, data);
          hashRef.current = hashContent(merged);
          writeCachedContent(lang, merged);
          return merged;
        });
        setReady(true);
      } catch {
        if (cancelled) return;
        setContent((previous) => previous ?? emptyPortfolioContent(lang));
        setReady(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadContent();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- soft revalidate; content intentionally omitted
  }, [lang, hydrated, reloadTick]);

  useEffect(() => {
    if (!hydrated) return;

    const softRefresh = () => {
      // Always revalidate in background when the tab is shown again —
      // hash compare skips React updates if nothing changed.
      refresh();
    };

    const onFocus = () => {
      consumeContentBustFlag();
      softRefresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const unsubscribe = subscribeContentBust(() => {
      consumeContentBustFlag();
      softRefresh();
    });

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe();
    };
  }, [hydrated, refresh]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      content: content ?? emptyPortfolioContent(lang),
      loading,
      ready,
      refresh,
    }),
    [lang, setLang, content, loading, ready, refresh]
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}
