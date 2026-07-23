import type { PortfolioContent } from "@/lib/content";

type CacheEntry = {
  hash: string;
  data: PortfolioContent;
  t: number;
};

const memory = new Map<string, CacheEntry>();
const TTL_MS = 12 * 60 * 1000;
const STORAGE_PREFIX = "dbtviezy-content-v1:";
/** localStorage — shared across tabs (Studio → public site). */
const BUST_KEY = "dbtviezy-content-bust";
const CHANNEL_NAME = "dbtviezy-content";

/** Tiny FNV-1a style hash — enough to detect content changes, not crypto. */
export function hashContent(data: unknown): string {
  const raw = JSON.stringify(data);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function storageKey(lang: string) {
  return `${STORAGE_PREFIX}${lang.toLowerCase()}`;
}

function readSession(lang: string): CacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(lang));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed?.hash || !parsed?.data || typeof parsed.t !== "number") return null;
    if (Date.now() - parsed.t > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(lang: string, entry: CacheEntry) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey(lang), JSON.stringify(entry));
  } catch {
    // Quota / private mode — memory cache still helps.
  }
}

function clearSessionContent() {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(window.sessionStorage)) {
      if (key.startsWith(STORAGE_PREFIX)) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
}

/** Instant paint from RAM or sessionStorage (same tab / soft navigations). */
export function readCachedContent(lang: string): CacheEntry | null {
  const key = lang.toLowerCase();
  const mem = memory.get(key);
  if (mem && Date.now() - mem.t <= TTL_MS) return mem;
  const session = readSession(key);
  if (session) {
    memory.set(key, session);
    return session;
  }
  return null;
}

export function writeCachedContent(lang: string, data: PortfolioContent) {
  const entry: CacheEntry = {
    hash: hashContent(data),
    data,
    t: Date.now(),
  };
  const key = lang.toLowerCase();
  memory.set(key, entry);
  writeSession(key, entry);
  return entry.hash;
}

/**
 * Call after Studio saves. Clears this tab's cache and signals other tabs
 * via localStorage + BroadcastChannel so the public site soft-refetches
 * without a hard reload.
 */
export function bustPublicContentCache() {
  memory.clear();
  clearSessionContent();
  if (typeof window === "undefined") return;

  const stamp = String(Date.now());
  try {
    window.localStorage.setItem(BUST_KEY, stamp);
  } catch {
    // ignore
  }

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "bust", t: stamp });
    channel.close();
  } catch {
    // BroadcastChannel unsupported — storage event still covers other tabs.
  }
}

/** True if Studio (or another tab) asked for a refresh since last consume. */
export function consumeContentBustFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(BUST_KEY);
    if (!raw) return false;
    window.localStorage.removeItem(BUST_KEY);
    memory.clear();
    clearSessionContent();
    return true;
  } catch {
    return false;
  }
}

export function subscribeContentBust(onBust: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event?.data?.type === "bust") {
        memory.clear();
        clearSessionContent();
        onBust();
      }
    };
  } catch {
    channel = null;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === BUST_KEY && event.newValue) {
      memory.clear();
      clearSessionContent();
      onBust();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
    try {
      channel?.close();
    } catch {
      // ignore
    }
  };
}
