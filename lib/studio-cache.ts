import type { PortfolioContent, ProjectItem } from "@/lib/content";

type StudioLangCache = {
  content: PortfolioContent;
  projects: ProjectItem[];
  t: number;
};

const memory = new Map<string, StudioLangCache>();
const TTL_MS = 15 * 60 * 1000;

export function readStudioCache(lang: string): StudioLangCache | null {
  const entry = memory.get(lang);
  if (!entry) return null;
  if (Date.now() - entry.t > TTL_MS) {
    memory.delete(lang);
    return null;
  }
  return entry;
}

export function writeStudioCache(
  lang: string,
  content: PortfolioContent,
  projects: ProjectItem[]
) {
  memory.set(lang, { content, projects, t: Date.now() });
}

export function patchStudioProjects(lang: string, projects: ProjectItem[]) {
  const entry = memory.get(lang);
  if (!entry) return;
  memory.set(lang, { ...entry, projects, t: Date.now() });
}

export function patchStudioContent(lang: string, content: PortfolioContent) {
  const entry = memory.get(lang);
  if (!entry) return;
  memory.set(lang, { ...entry, content, t: Date.now() });
}
