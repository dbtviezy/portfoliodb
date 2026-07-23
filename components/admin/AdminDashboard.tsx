"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { PortfolioContent, ProjectItem } from "@/lib/content";
import { parseProjectLinks } from "@/lib/project-links";
import type { ContactChannel } from "@/lib/contact-channels";
import {
  channelsFromLegacy,
  legacyFieldsFromChannels,
  resolveContactChannels,
} from "@/lib/contact-channels";
import {
  StudioButton,
  StudioField,
  StudioInput,
  StudioLabel,
  StudioPanel,
} from "@/components/admin/studio-ui";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { GalleryUploader } from "@/components/admin/GalleryUploader";
import { ImageFrameEditor } from "@/components/admin/ImageFrameEditor";
import { VideosEditor } from "@/components/admin/VideosEditor";
import { VideoFrameCover } from "@/components/admin/VideoFrameCover";
import { ProjectCardImageDrop } from "@/components/admin/ProjectCardImageDrop";
import { StudioToast, type StudioToastState } from "@/components/admin/StudioToast";
import { resolveProjectGallery, syncCoverFromGallery } from "@/lib/project-images";
import { resolveProjectVideos, syncPrimaryFromVideos } from "@/lib/project-videos";
import { DEFAULT_IMAGE_FRAME, parseImageFrame } from "@/lib/image-frame";
import { bustPublicContentCache } from "@/lib/content-cache";
import {
  patchStudioContent,
  patchStudioProjects,
  readStudioCache,
  writeStudioCache,
} from "@/lib/studio-cache";

type AdminLang = "en" | "ru";

const tabs = [
  { id: "card", label: "Card" },
  { id: "projects", label: "Work" },
  { id: "contact", label: "Reach" },
  { id: "labels", label: "Labels" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const emptyProject: ProjectItem = {
  title: "",
  category: "",
  year: new Date().getFullYear().toString(),
  description: "",
  detail: "",
  image: "",
  images: [],
  imageFrame: { ...DEFAULT_IMAGE_FRAME },
  video: "",
  videos: [],
  links: [],
  featured: false,
  completed: true,
};

function normalizeAdminProject(raw: Record<string, unknown>): ProjectItem {
  const numericId = Number(raw.id);
  const gallery = resolveProjectGallery(String(raw.image ?? ""), raw.images);
  const videoList = resolveProjectVideos(String(raw.video ?? ""), raw.videos);
  return {
    id: Number.isFinite(numericId) && numericId > 0 ? numericId : undefined,
    title: String(raw.title ?? ""),
    category: String(raw.category ?? ""),
    year: String(raw.year ?? ""),
    description: String(raw.description ?? ""),
    detail: String(raw.detail ?? ""),
    image: gallery[0] || String(raw.image ?? ""),
    images: gallery,
    imageFrame: parseImageFrame(raw.imageFrame),
    video: videoList[0] || "",
    videos: videoList,
    featured: Boolean(raw.featured),
    completed: raw.completed !== false && raw.completed !== 0 && raw.completed !== "false",
    order: typeof raw.order === "number" ? raw.order : Number(raw.order) || 0,
    links: Array.isArray(raw.links)
      ? (raw.links as ProjectItem["links"])
      : parseProjectLinks(typeof raw.links === "string" ? raw.links : "[]"),
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [lang, setLang] = useState<AdminLang>("en");
  const [tab, setTab] = useState<TabId>("card");
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<StudioToastState>(null);
  const [email, setEmail] = useState("");
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [dbBanner, setDbBanner] = useState("");
  const [translating, setTranslating] = useState(false);

  const currentProject = editingProject;

  const showToast = useCallback((type: "ok" | "err", text: string) => {
    setToast({ type, text });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const loadData = useCallback(async (opts?: { soft?: boolean }) => {
    const soft = opts?.soft !== false;
    const cached = readStudioCache(lang);
    if (cached) {
      setContent(cached.content);
      setProjects(cached.projects);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setLoadError("");
    try {
      const [meRes, portfolioRes, projectsRes, dbRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/admin/portfolio?lang=${lang}`),
        fetch(`/api/admin/projects?lang=${lang}`),
        fetch("/api/admin/db-status"),
      ]);

      if (!meRes.ok) {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        router.replace("/studio");
        return;
      }

      const me = await meRes.json();
      setEmail(me.email);

      if (dbRes.ok) {
        const db = (await dbRes.json()) as { durable?: boolean; message?: string };
        setDbBanner(!db.durable && db.message ? db.message : "");
      } else {
        setDbBanner("");
      }

      let nextContent: PortfolioContent | null = null;
      let nextProjects: ProjectItem[] | null = null;

      if (portfolioRes.ok) {
        const data = (await portfolioRes.json()) as PortfolioContent;
        const channels = resolveContactChannels(data.contact.channels, data.contact);
        nextContent = {
          ...data,
          contact: { ...data.contact, channels },
        };
        setContent(nextContent);
      } else {
        const err = (await portfolioRes.json().catch(() => ({}))) as { error?: string };
        if (!cached && !soft) setContent(null);
        setLoadError(err.error || `Portfolio load failed (${portfolioRes.status})`);
      }

      if (projectsRes.ok) {
        const rows = await projectsRes.json();
        nextProjects = (rows as Record<string, unknown>[]).map(normalizeAdminProject);
        setProjects(nextProjects);
      } else if (portfolioRes.ok) {
        const err = (await projectsRes.json().catch(() => ({}))) as { error?: string };
        setLoadError(err.error || `Projects load failed (${projectsRes.status})`);
      }

      if (nextContent && nextProjects) {
        writeStudioCache(lang, nextContent, nextProjects);
      }
    } catch (error) {
      if (!cached) setContent(null);
      setLoadError(error instanceof Error ? error.message : "Failed to load studio");
    } finally {
      setLoading(false);
    }
  }, [lang, router]);

  useEffect(() => {
    const cached = readStudioCache(lang);
    if (cached) {
      setContent(cached.content);
      setProjects(cached.projects);
      setLoading(false);
    }
    void loadData({ soft: true });
  }, [loadData, lang]);

  const closeProjectEditor = useCallback(() => {
    setEditingProject(null);
    setIsCreatingProject(false);
  }, []);

  useEffect(() => {
    if (!editingProject && !isCreatingProject) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeProjectEditor();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editingProject, isCreatingProject, closeProjectEditor]);

  async function savePortfolio(): Promise<boolean> {
    if (!content) return false;
    setSaving(true);

    const channels = resolveContactChannels(content.contact.channels, content.contact);
    const legacy = legacyFieldsFromChannels(channels, content.contact);

    const payload = {
      lang,
      heroLocation: content.hero.location,
      heroText1: content.hero.text1,
      heroText2: content.hero.text2,
      heroDesc: content.hero.desc,
      heroBtn: content.hero.btn,
      aboutTitle: content.about.title,
      aboutDesc1: content.about.desc1,
      aboutDesc2: content.about.desc2,
      aboutExpertise: content.about.expertise,
      profileImage: content.about.profileImage,
      aboutStats1Value: content.about.stats[0].value,
      aboutStats1Label: content.about.stats[0].label,
      aboutStats2Value: content.about.stats[1].value,
      aboutStats2Label: content.about.stats[1].label,
      aboutStats3Value: content.about.stats[2].value,
      aboutStats3Label: content.about.stats[2].label,
      contactSubtitle: content.contact.subtitle,
      contactTitle1: content.contact.title1,
      contactTitle2: content.contact.title2,
      contactBtn: content.contact.button,
      contactChannels: channels,
      contactEmail: legacy.email,
      contactTelegram: legacy.telegram,
      contactBehance: legacy.behance,
      contactDribbble: legacy.dribbble,
      contactInstagram: legacy.instagram,
      navbarProjects: content.navbar.projects,
      navbarContact: content.navbar.contact,
      skillsTitle: content.skills.title,
      projectsTitle: content.projects.title,
      projectsShowing: content.projects.showing,
      projectsOf: content.projects.of,
      projectsViewAll: content.projects.viewAll,
      projectsAllTitle: content.projects.allTitle,
      skills: content.skills.items,
      expertiseItems: content.about.expertiseItems,
    };

    try {
      const response = await fetch("/api/admin/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        showToast("err", data.error ?? "Не удалось сохранить");
        return false;
      }
      const saved = (await response.json()) as PortfolioContent;
      const savedChannels = resolveContactChannels(saved.contact.channels, saved.contact);
      const next = {
        ...saved,
        contact: { ...saved.contact, channels: savedChannels },
      };
      setContent(next);
      patchStudioContent(lang, next);
      bustPublicContentCache();
      showToast("ok", "Сохранено — сайт обновится сам");
      return true;
    } catch {
      showToast("err", "Не удалось сохранить");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/studio");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  async function saveProject(project: ProjectItem): Promise<boolean> {
    setSaving(true);

    try {
      const isNew = !project.id;
      const response = await fetch(
        isNew ? "/api/admin/projects" : `/api/admin/projects/${project.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...project, lang }),
        }
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        showToast("err", data.error ?? "Не удалось сохранить проект");
        return false;
      }
      const saved = normalizeAdminProject(
        (await response.json()) as Record<string, unknown>
      );
      setProjects((rows) => {
        const next = isNew
          ? [...rows, saved]
          : rows.map((row) => (row.id === saved.id ? saved : row));
        patchStudioProjects(lang, next);
        return next;
      });
      setEditingProject(null);
      setIsCreatingProject(false);
      bustPublicContentCache();
      showToast("ok", isNew ? "Проект создан — сайт обновится сам" : "Проект обновлён — сайт обновится сам");
      return true;
    } catch {
      showToast("err", "Не удалось сохранить проект");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function translateCloud(scope: "portfolio" | "project" | "projects", projectId?: number) {
    setTranslating(true);
    try {
      if (scope === "portfolio") {
        const saved = await savePortfolio();
        if (!saved) return;
      } else if (scope === "project") {
        if (!editingProject) return;
        const isNew = !editingProject.id;
        const response = await fetch(
          isNew ? "/api/admin/projects" : `/api/admin/projects/${editingProject.id}`,
          {
            method: isNew ? "POST" : "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...editingProject, lang }),
          }
        );
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          showToast("err", data.error ?? "Сначала сохрани проект");
          return;
        }
        const saved = normalizeAdminProject(
          (await response.json()) as Record<string, unknown>
        );
        projectId = saved.id;
        setEditingProject(saved);
        setIsCreatingProject(false);
        setProjects((rows) => {
          const exists = rows.some((row) => row.id === saved.id);
          const next = exists
            ? rows.map((row) => (row.id === saved.id ? saved : row))
            : [...rows, saved];
          patchStudioProjects(lang, next);
          return next;
        });
      }

      const response = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, scope, projectId }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        showToast("err", data.error ?? "Не удалось перевести");
        return;
      }
      await loadData({ soft: true });
      bustPublicContentCache();
      showToast("ok", data.message ?? "Автоперевод RU↔EN сохранён в облаке");
    } catch {
      showToast("err", "Не удалось перевести");
    } finally {
      setTranslating(false);
    }
  }

  /** Quick image replace from Work list card (upload already done). */
  async function updateProjectImage(project: ProjectItem, imageUrl: string) {
    if (!project.id) return;
    setSaving(true);
    try {
      const rest = (project.images ?? []).filter((url) => url && url !== project.image);
      const media = syncCoverFromGallery([imageUrl, ...rest]);
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...project, ...media, lang }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        showToast("err", data.error ?? "Не удалось обновить фото");
        return;
      }
      setProjects((rows) => {
        const next = rows.map((row) =>
          row.id === project.id ? { ...row, image: media.image, images: media.images } : row
        );
        patchStudioProjects(lang, next);
        return next;
      });
      bustPublicContentCache();
      showToast("ok", "Фото проекта обновлено");
    } catch {
      showToast("err", "Не удалось обновить фото");
    } finally {
      setSaving(false);
    }
  }

  async function persistProjectOrder(next: ProjectItem[]) {
    setProjects(next);
    patchStudioProjects(lang, next);
    const orderedIds = next.map((p) => p.id).filter((id): id is number => typeof id === "number");
    if (orderedIds.length === 0) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/projects/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, orderedIds }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        showToast("err", data.error ?? "Не удалось сохранить порядок");
        await loadData({ soft: true });
        return;
      }
      const rows = await response.json();
      const normalized = (rows as Record<string, unknown>[]).map(normalizeAdminProject);
      setProjects(normalized);
      patchStudioProjects(lang, normalized);
      bustPublicContentCache();
      showToast("ok", "Порядок обновлён");
    } catch {
      showToast("err", "Не удалось сохранить порядок");
      await loadData({ soft: true });
    } finally {
      setSaving(false);
    }
  }

  function moveProject(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= projects.length || fromIndex === toIndex) return;
    const next = [...projects];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    void persistProjectOrder(next.map((p, order) => ({ ...p, order })));
  }

  async function deleteProject(id: number) {
    if (!confirm("Удалить этот проект?")) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        showToast("err", data.error ?? "Не удалось удалить проект");
        return;
      }
      setProjects((rows) => {
        const next = rows.filter((row) => row.id !== id);
        patchStudioProjects(lang, next);
        return next;
      });
      bustPublicContentCache();
      showToast("ok", "Проект удалён");
    } catch {
      showToast("err", "Не удалось удалить проект");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !content) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--text-faint)]">Loading studio...</p>
      </main>
    );
  }

  if (!content) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">Studio couldn&apos;t load content.</p>
        {loadError ? (
          <p className="max-w-md font-mono text-[11px] leading-relaxed text-[var(--text-faint)]">
            {loadError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void loadData({ soft: false })}
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] transition hover:bg-white/5"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-10">
          <div className="flex items-center gap-5">
            <div>
              <p className="text-xs text-[var(--text-faint)]">Studio</p>
              <h1 className="text-base font-semibold tracking-tight md:text-lg">Calling card</h1>
            </div>
            <Link
              href="/"
              className="hidden text-sm text-[var(--text-muted)] transition hover:text-[var(--text)] sm:inline"
            >
              View site →
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-0.5">
              {(["en", "ru"] as AdminLang[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`rounded-[calc(var(--radius-md)-2px)] px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                    lang === code
                      ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                      : "text-[var(--text-faint)] hover:text-[var(--text)]"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
            <span className="hidden text-xs text-[var(--text-faint)] md:inline">{email}</span>
            <Link
              href="/"
              className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text)] sm:hidden"
            >
              Site
            </Link>
            <StudioButton type="button" variant="subtle" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? "..." : "Logout"}
            </StudioButton>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
        {dbBanner && (
          <div
            role="status"
            className="mb-6 rounded-[var(--radius-md)] border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--text)]"
          >
            {dbBanner}
          </div>
        )}

        <div className="mb-6 flex gap-0.5 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-[calc(var(--radius-md)-2px)] px-3.5 py-2 text-sm transition ${
                tab === item.id
                  ? "bg-[var(--bg-elevated)] font-medium text-[var(--text)] shadow-sm"
                  : "text-[var(--text-faint)] hover:text-[var(--text-muted)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <StudioPanel className="space-y-5">
          {tab === "card" && (
            <>
              <p className="text-sm text-[var(--text-faint)]">
                Front of the calling card — name is fixed in UI; edit role, bio, and portrait.
              </p>
              <StudioField
                label="Role line"
                value={content.hero.text1}
                onChange={(value) =>
                  setContent({ ...content, hero: { ...content.hero, text1: value } })
                }
              />
              <ImageUploader
                label="Portrait photo (одна на EN и RU)"
                folder="portrait"
                value={content.about.profileImage}
                onChange={(value) =>
                  setContent({ ...content, about: { ...content.about, profileImage: value } })
                }
              />
              <StudioField
                label="Short bio (on card)"
                value={content.about.desc1}
                onChange={(value) =>
                  setContent({ ...content, about: { ...content.about, desc1: value } })
                }
                multiline
              />
              <StudioField
                label="CTA primary label"
                value={content.hero.btn}
                onChange={(value) =>
                  setContent({ ...content, hero: { ...content.hero, btn: value } })
                }
              />
            </>
          )}

          {tab === "projects" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Work · {projects.length}</h2>
                <div className="flex flex-wrap gap-2">
                  <StudioButton
                    type="button"
                    variant="subtle"
                    disabled={saving || translating || projects.length === 0}
                    onClick={() => void translateCloud("projects")}
                  >
                    {translating ? "…" : "Auto RU↔EN"}
                  </StudioButton>
                  <StudioButton
                    type="button"
                    onClick={() => {
                      setIsCreatingProject(true);
                      setEditingProject({ ...emptyProject });
                    }}
                  >
                    Add project
                  </StudioButton>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-[var(--text-faint)]">
                  На карточке — только лицевая. В Edit: галерея, кадр (масштаб/сдвиг) и статус.
                </p>
                {projects.map((project, index) => (
                  <div
                    key={project.id}
                    className="flex flex-col justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-4 md:flex-row md:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <ProjectCardImageDrop
                        image={project.image}
                        title={project.title || "project"}
                        disabled={saving}
                        onUploaded={(url) => updateProjectImage(project, url)}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{project.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                          {project.year} · {project.category}
                          {project.featured ? " · Featured" : ""}
                          {(project.videos?.length || project.video)
                            ? ` · ${(project.videos?.length || (project.video ? 1 : 0))} video`
                            : ""}
                          {(project.images?.length ?? 0) > 1
                            ? ` · ${project.images!.length} фото`
                            : ""}
                          {project.completed === false ? " · In progress" : " · Done"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <StudioButton
                        type="button"
                        variant="ghost"
                        disabled={saving || index === 0}
                        onClick={() => moveProject(index, index - 1)}
                        aria-label="Move up"
                      >
                        ↑
                      </StudioButton>
                      <StudioButton
                        type="button"
                        variant="ghost"
                        disabled={saving || index === projects.length - 1}
                        onClick={() => moveProject(index, index + 1)}
                        aria-label="Move down"
                      >
                        ↓
                      </StudioButton>
                      <StudioButton
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditingProject(project);
                          setIsCreatingProject(false);
                        }}
                      >
                        Edit
                      </StudioButton>
                      <StudioButton
                        type="button"
                        variant="danger"
                        onClick={() => project.id && deleteProject(project.id)}
                      >
                        Delete
                      </StudioButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "contact" && (
            <>
              <p className="text-sm text-[var(--text-faint)]">
                Short copy + any contacts you want. Empty rows are hidden on the site. Add Instagram / LinkedIn / whatever later — no code changes needed.
              </p>
              <StudioField
                label="Eyebrow"
                value={content.contact.subtitle}
                onChange={(value) =>
                  setContent({ ...content, contact: { ...content.contact, subtitle: value } })
                }
              />
              <StudioField
                label="Headline"
                value={content.contact.title1}
                onChange={(value) =>
                  setContent({ ...content, contact: { ...content.contact, title1: value } })
                }
              />
              <StudioField
                label="Short note"
                value={content.contact.button}
                onChange={(value) =>
                  setContent({ ...content, contact: { ...content.contact, button: value } })
                }
                multiline
              />

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <StudioLabel>Channels</StudioLabel>
                  <button
                    type="button"
                    onClick={() => {
                      const channels = [
                        ...(content.contact.channels?.length
                          ? content.contact.channels
                          : channelsFromLegacy(content.contact)),
                        { label: "", value: "", url: "", group: "primary" as const },
                      ];
                      setContent({ ...content, contact: { ...content.contact, channels } });
                    }}
                    className="text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--text)]"
                  >
                    + Add channel
                  </button>
                </div>
                <div className="space-y-3">
                  {(content.contact.channels?.length
                    ? content.contact.channels
                    : channelsFromLegacy(content.contact)
                  ).map((channel, index) => {
                    const list = content.contact.channels?.length
                      ? content.contact.channels
                      : channelsFromLegacy(content.contact);
                    const update = (patch: Partial<ContactChannel>) => {
                      const channels = list.map((item, i) =>
                        i === index ? { ...item, ...patch } : item
                      );
                      setContent({ ...content, contact: { ...content.contact, channels } });
                    };
                    return (
                      <div
                        key={index}
                        className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-3 sm:grid-cols-[0.9fr_1.1fr_1.2fr_auto_auto]"
                      >
                        <StudioInput
                          type="text"
                          placeholder="Label (Email, Telegram…)"
                          value={channel.label}
                          onChange={(e) => update({ label: e.target.value })}
                        />
                        <StudioInput
                          type="text"
                          placeholder="Display value"
                          value={channel.value}
                          onChange={(e) => update({ value: e.target.value })}
                        />
                        <StudioInput
                          type="text"
                          placeholder="URL (optional — auto if empty)"
                          value={channel.url}
                          onChange={(e) => update({ url: e.target.value })}
                        />
                        <select
                          value={channel.group}
                          onChange={(e) =>
                            update({
                              group: e.target.value === "social" ? "social" : "primary",
                            })
                          }
                          className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm text-[var(--text)] outline-none"
                        >
                          <option value="primary">Primary</option>
                          <option value="social">Social</option>
                        </select>
                        <StudioButton
                          type="button"
                          variant="danger"
                          onClick={() => {
                            const channels = list.filter((_, i) => i !== index);
                            setContent({
                              ...content,
                              contact: { ...content.contact, channels },
                            });
                          }}
                        >
                          ✕
                        </StudioButton>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === "labels" && (
            <>
              <StudioField
                label="Navbar: Work"
                value={content.navbar.projects}
                onChange={(value) =>
                  setContent({
                    ...content,
                    navbar: { ...content.navbar, projects: value },
                  })
                }
              />
              <StudioField
                label="Navbar: Contact"
                value={content.navbar.contact}
                onChange={(value) =>
                  setContent({
                    ...content,
                    navbar: { ...content.navbar, contact: value },
                  })
                }
              />
              <StudioField
                label="Work section title"
                value={content.projects.title}
                onChange={(value) =>
                  setContent({
                    ...content,
                    projects: { ...content.projects, title: value },
                  })
                }
              />
              <StudioField
                label="View all label"
                value={content.projects.viewAll}
                onChange={(value) =>
                  setContent({
                    ...content,
                    projects: { ...content.projects, viewAll: value },
                  })
                }
              />
              <StudioField
                label="/projects page title"
                value={content.projects.allTitle}
                onChange={(value) =>
                  setContent({
                    ...content,
                    projects: { ...content.projects, allTitle: value },
                  })
                }
              />
            </>
          )}

          {tab !== "projects" && (
            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-5">
              <StudioButton type="button" disabled={saving || translating} onClick={() => void savePortfolio()}>
                {saving ? "Saving..." : "Save changes"}
              </StudioButton>
              <StudioButton
                type="button"
                variant="subtle"
                disabled={saving || translating}
                onClick={() => void translateCloud("portfolio")}
              >
                {translating ? "Translating…" : "Save & auto RU↔EN"}
              </StudioButton>
            </div>
          )}
        </StudioPanel>
      </div>

      <StudioToast toast={toast} onDismiss={dismissToast} />

      <AnimatePresence>
        {(isCreatingProject || editingProject) && currentProject && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              onClick={closeProjectEditor}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-editor-title"
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.25rem] border border-[var(--border)] bg-[var(--bg-panel)] shadow-[var(--shadow-panel)] sm:rounded-[var(--radius-xl)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 md:px-6">
                <h3 id="project-editor-title" className="text-base font-semibold">
                  {isCreatingProject ? "New project" : "Edit project"}
                </h3>
                <StudioButton type="button" variant="subtle" onClick={closeProjectEditor}>
                  Close
                </StudioButton>
              </div>

              <div className="space-y-4 overflow-y-auto px-5 py-5 md:px-6">
                <StudioField label="Title" value={currentProject.title} onChange={(value) => setEditingProject({ ...currentProject, title: value })} />
                <StudioField label="Category" value={currentProject.category} onChange={(value) => setEditingProject({ ...currentProject, category: value })} />
                <StudioField label="Year" value={currentProject.year} onChange={(value) => setEditingProject({ ...currentProject, year: value })} />
                <GalleryUploader
                  label="Photos"
                  folder="projects"
                  images={currentProject.images?.length ? currentProject.images : currentProject.image ? [currentProject.image] : []}
                  onChange={(images) => {
                    const media = syncCoverFromGallery(images);
                    setEditingProject({
                      ...currentProject,
                      image: media.image,
                      images: media.images,
                    });
                  }}
                />
                <ImageFrameEditor
                  image={currentProject.image}
                  value={currentProject.imageFrame ?? DEFAULT_IMAGE_FRAME}
                  onChange={(imageFrame) =>
                    setEditingProject({ ...currentProject, imageFrame })
                  }
                />
                <VideosEditor
                  folder="projects"
                  videos={
                    currentProject.videos?.length
                      ? currentProject.videos
                      : currentProject.video
                        ? [currentProject.video]
                        : []
                  }
                  onChange={(videos) => {
                    const media = syncPrimaryFromVideos(videos);
                    setEditingProject({
                      ...currentProject,
                      video: media.video,
                      videos: media.videos,
                    });
                  }}
                />
                <VideoFrameCover
                  videoUrl={currentProject.video ?? ""}
                  videoUrls={
                    currentProject.videos?.length
                      ? currentProject.videos
                      : currentProject.video
                        ? [currentProject.video]
                        : []
                  }
                  hasCover={Boolean(currentProject.image?.trim())}
                  folder="projects"
                  onCover={(imageUrl) => {
                    const rest = (currentProject.images ?? []).filter(
                      (url) => url && url !== currentProject.image && url !== imageUrl
                    );
                    const media = syncCoverFromGallery([imageUrl, ...rest]);
                    setEditingProject({
                      ...currentProject,
                      image: media.image,
                      images: media.images,
                    });
                  }}
                />
                <StudioField label="Short description" value={currentProject.description} onChange={(value) => setEditingProject({ ...currentProject, description: value })} multiline />
                <StudioField
                  label="Case / detail (modal)"
                  value={currentProject.detail ?? ""}
                  onChange={(value) => setEditingProject({ ...currentProject, detail: value })}
                  multiline
                />

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <StudioLabel>Links (Behance, Live site, etc.)</StudioLabel>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProject({
                          ...currentProject,
                          links: [...(currentProject.links ?? []), { label: "", url: "" }],
                        })
                      }
                      className="text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--text)]"
                    >
                      + Add link
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(currentProject.links ?? []).map((link, index) => (
                      <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                        <StudioInput
                          type="text"
                          placeholder="Label"
                          value={link.label}
                          onChange={(e) => {
                            const links = [...(currentProject.links ?? [])];
                            links[index] = { ...links[index], label: e.target.value };
                            setEditingProject({ ...currentProject, links });
                          }}
                        />
                        <StudioInput
                          type="text"
                          placeholder="https://..."
                          value={link.url}
                          onChange={(e) => {
                            const links = [...(currentProject.links ?? [])];
                            links[index] = { ...links[index], url: e.target.value };
                            setEditingProject({ ...currentProject, links });
                          }}
                        />
                        <StudioButton
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setEditingProject({
                              ...currentProject,
                              links: (currentProject.links ?? []).filter((_, i) => i !== index),
                            })
                          }
                        >
                          ×
                        </StudioButton>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    checked={currentProject.completed !== false}
                    onChange={(e) =>
                      setEditingProject({ ...currentProject, completed: e.target.checked })
                    }
                    className="rounded border-[var(--border)]"
                  />
                  Работа закончена
                </label>

                <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    checked={currentProject.featured ?? false}
                    onChange={(e) =>
                      setEditingProject({ ...currentProject, featured: e.target.checked })
                    }
                    className="rounded border-[var(--border)]"
                  />
                  Show on homepage
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-5 py-4 md:px-6">
                <StudioButton
                  type="button"
                  disabled={saving || translating}
                  onClick={() => void saveProject(currentProject)}
                >
                  {saving ? "Saving..." : "Save project"}
                </StudioButton>
                <StudioButton
                  type="button"
                  variant="subtle"
                  disabled={saving || translating}
                  onClick={() => void translateCloud("project", currentProject.id)}
                >
                  {translating ? "Translating…" : "Save & auto RU↔EN"}
                </StudioButton>
                <StudioButton type="button" variant="ghost" onClick={closeProjectEditor}>
                  Cancel
                </StudioButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
