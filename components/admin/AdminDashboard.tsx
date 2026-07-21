"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PortfolioContent, ProjectItem } from "@/lib/content";

type AdminLang = "en" | "ru";

const tabs = [
  { id: "hero", label: "Hero" },
  { id: "about", label: "Bio" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
  { id: "labels", label: "Labels" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  const className =
    "w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-white outline-none focus:border-zinc-500";

  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">{label}</span>
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      )}
    </label>
  );
}

function ListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest text-zinc-500">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="text-xs text-zinc-300 hover:text-white"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[index] = e.target.value;
                onChange(next);
              }}
              className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-white outline-none focus:border-zinc-500"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="px-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const emptyProject: ProjectItem = {
  title: "",
  category: "",
  year: new Date().getFullYear().toString(),
  description: "",
  image: "",
  featured: false,
};

export default function AdminDashboard() {
  const router = useRouter();
  const [lang, setLang] = useState<AdminLang>("en");
  const [tab, setTab] = useState<TabId>("hero");
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, portfolioRes, projectsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/admin/portfolio?lang=${lang}`),
        fetch(`/api/admin/projects?lang=${lang}`),
      ]);

      if (!meRes.ok) {
        router.replace("/studio");
        return;
      }

      const me = await meRes.json();
      setEmail(me.email);

      if (portfolioRes.ok) {
        setContent(await portfolioRes.json());
      }

      if (projectsRes.ok) {
        setProjects(await projectsRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, [lang, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function savePortfolio(partial?: Partial<PortfolioContent>) {
    if (!content) return;
    setSaving(true);
    setMessage("");

    const payload = {
      lang,
      heroLocation: partial?.hero?.location ?? content.hero.location,
      heroText1: partial?.hero?.text1 ?? content.hero.text1,
      heroText2: partial?.hero?.text2 ?? content.hero.text2,
      heroDesc: partial?.hero?.desc ?? content.hero.desc,
      heroBtn: partial?.hero?.btn ?? content.hero.btn,
      aboutTitle: partial?.about?.title ?? content.about.title,
      aboutDesc1: partial?.about?.desc1 ?? content.about.desc1,
      aboutDesc2: partial?.about?.desc2 ?? content.about.desc2,
      aboutExpertise: partial?.about?.expertise ?? content.about.expertise,
      profileImage: partial?.about?.profileImage ?? content.about.profileImage,
      aboutStats1Value: partial?.about?.stats?.[0]?.value ?? content.about.stats[0].value,
      aboutStats1Label: partial?.about?.stats?.[0]?.label ?? content.about.stats[0].label,
      aboutStats2Value: partial?.about?.stats?.[1]?.value ?? content.about.stats[1].value,
      aboutStats2Label: partial?.about?.stats?.[1]?.label ?? content.about.stats[1].label,
      aboutStats3Value: partial?.about?.stats?.[2]?.value ?? content.about.stats[2].value,
      aboutStats3Label: partial?.about?.stats?.[2]?.label ?? content.about.stats[2].label,
      contactSubtitle: partial?.contact?.subtitle ?? content.contact.subtitle,
      contactTitle1: partial?.contact?.title1 ?? content.contact.title1,
      contactTitle2: partial?.contact?.title2 ?? content.contact.title2,
      contactBtn: partial?.contact?.button ?? content.contact.button,
      contactEmail: partial?.contact?.email ?? content.contact.email,
      contactTelegram: partial?.contact?.telegram ?? content.contact.telegram,
      contactBehance: partial?.contact?.behance ?? content.contact.behance,
      contactDribbble: partial?.contact?.dribbble ?? content.contact.dribbble,
      navbarProjects: partial?.navbar?.projects ?? content.navbar.projects,
      navbarContact: partial?.navbar?.contact ?? content.navbar.contact,
      skillsTitle: partial?.skills?.title ?? content.skills.title,
      projectsTitle: partial?.projects?.title ?? content.projects.title,
      projectsShowing: partial?.projects?.showing ?? content.projects.showing,
      projectsOf: partial?.projects?.of ?? content.projects.of,
      projectsViewAll: partial?.projects?.viewAll ?? content.projects.viewAll,
      projectsAllTitle: partial?.projects?.allTitle ?? content.projects.allTitle,
      skills: partial?.skills?.items ?? content.skills.items,
      expertiseItems: partial?.about?.expertiseItems ?? content.about.expertiseItems,
    };

    try {
      const response = await fetch("/api/admin/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Save failed");
      const updated = await response.json();
      setContent(updated);
      setMessage("Saved");
    } catch {
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/studio");
    router.refresh();
  }

  async function saveProject(project: ProjectItem) {
    setSaving(true);
    setMessage("");

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

      if (!response.ok) throw new Error("Project save failed");
      setEditingProject(null);
      setIsCreatingProject(false);
      await loadData();
      setMessage(isNew ? "Project created" : "Project updated");
    } catch {
      setMessage("Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(id: number) {
    if (!confirm("Delete this project?")) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      await loadData();
      setMessage("Project deleted");
    } catch {
      setMessage("Failed to delete project");
    } finally {
      setSaving(false);
    }
  }

  const currentProject = useMemo(
    () => (isCreatingProject ? emptyProject : editingProject),
    [editingProject, isCreatingProject]
  );

  if (loading || !content) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <p className="text-zinc-500">Loading studio...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-zinc-900 px-6 md:px-10 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Studio</p>
          <h1 className="text-2xl font-bold">Portfolio editor</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-zinc-800 p-1">
            {(["en", "ru"] as AdminLang[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase ${
                  lang === code ? "bg-white text-black" : "text-zinc-400"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
          <span className="text-xs text-zinc-500 hidden sm:inline">{email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-4 py-2 rounded-full text-sm border ${
                tab === item.id
                  ? "bg-white text-black border-white"
                  : "border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-[#111113] p-6 md:p-8 space-y-6">
          {tab === "hero" && (
            <>
              <Field label="Location" value={content.hero.location} onChange={(value) => setContent({ ...content, hero: { ...content.hero, location: value } })} />
              <Field label="Headline 1" value={content.hero.text1} onChange={(value) => setContent({ ...content, hero: { ...content.hero, text1: value } })} />
              <Field label="Headline 2" value={content.hero.text2} onChange={(value) => setContent({ ...content, hero: { ...content.hero, text2: value } })} />
              <Field label="Description" value={content.hero.desc} onChange={(value) => setContent({ ...content, hero: { ...content.hero, desc: value } })} multiline />
              <Field label="Button" value={content.hero.btn} onChange={(value) => setContent({ ...content, hero: { ...content.hero, btn: value } })} />
            </>
          )}

          {tab === "about" && (
            <>
              <Field label="Section title" value={content.about.title} onChange={(value) => setContent({ ...content, about: { ...content.about, title: value } })} />
              <Field label="Profile image URL" value={content.about.profileImage} onChange={(value) => setContent({ ...content, about: { ...content.about, profileImage: value } })} />
              <Field label="Bio paragraph 1" value={content.about.desc1} onChange={(value) => setContent({ ...content, about: { ...content.about, desc1: value } })} multiline />
              <Field label="Bio paragraph 2" value={content.about.desc2} onChange={(value) => setContent({ ...content, about: { ...content.about, desc2: value } })} multiline />
              <Field label="Expertise title" value={content.about.expertise} onChange={(value) => setContent({ ...content, about: { ...content.about, expertise: value } })} />
              <ListEditor label="Expertise items" items={content.about.expertiseItems} onChange={(items) => setContent({ ...content, about: { ...content.about, expertiseItems: items } })} />
              <div className="grid md:grid-cols-3 gap-4">
                {content.about.stats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <Field
                      label={`Stat ${index + 1} value`}
                      value={stat.value}
                      onChange={(value) => {
                        const stats = [...content.about.stats];
                        stats[index] = { ...stats[index], value };
                        setContent({ ...content, about: { ...content.about, stats } });
                      }}
                    />
                    <Field
                      label={`Stat ${index + 1} label`}
                      value={stat.label}
                      onChange={(value) => {
                        const stats = [...content.about.stats];
                        stats[index] = { ...stats[index], label: value };
                        setContent({ ...content, about: { ...content.about, stats } });
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "projects" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Projects ({projects.length})</h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingProject(true);
                    setEditingProject(null);
                  }}
                  className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold"
                >
                  Add project
                </button>
              </div>

              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-zinc-800 p-4"
                  >
                    <div>
                      <p className="font-semibold">{project.title}</p>
                      <p className="text-sm text-zinc-500">
                        {project.year} · {project.category}
                        {project.featured ? " · Featured" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(project);
                          setIsCreatingProject(false);
                        }}
                        className="px-3 py-2 rounded-xl border border-zinc-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => project.id && deleteProject(project.id)}
                        className="px-3 py-2 rounded-xl border border-red-900 text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {(isCreatingProject || editingProject) && currentProject && (
                <div className="rounded-2xl border border-zinc-700 p-5 space-y-4">
                  <h3 className="font-semibold">{isCreatingProject ? "New project" : "Edit project"}</h3>
                  <Field label="Title" value={currentProject.title} onChange={(value) => setEditingProject({ ...currentProject, title: value })} />
                  <Field label="Category" value={currentProject.category} onChange={(value) => setEditingProject({ ...currentProject, category: value })} />
                  <Field label="Year" value={currentProject.year} onChange={(value) => setEditingProject({ ...currentProject, year: value })} />
                  <Field label="Image URL" value={currentProject.image} onChange={(value) => setEditingProject({ ...currentProject, image: value })} />
                  <Field label="Description" value={currentProject.description} onChange={(value) => setEditingProject({ ...currentProject, description: value })} multiline />
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={currentProject.featured ?? false}
                      onChange={(e) => setEditingProject({ ...currentProject, featured: e.target.checked })}
                    />
                    Show on homepage (featured)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveProject(currentProject)}
                      className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold"
                    >
                      Save project
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject(null);
                        setIsCreatingProject(false);
                      }}
                      className="px-4 py-2 rounded-xl border border-zinc-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "skills" && (
            <>
              <Field label="Section title" value={content.skills.title} onChange={(value) => setContent({ ...content, skills: { ...content.skills, title: value } })} />
              <ListEditor label="Skills" items={content.skills.items} onChange={(items) => setContent({ ...content, skills: { ...content.skills, items } })} />
            </>
          )}

          {tab === "contact" && (
            <>
              <Field label="Subtitle" value={content.contact.subtitle} onChange={(value) => setContent({ ...content, contact: { ...content.contact, subtitle: value } })} />
              <Field label="Title line 1" value={content.contact.title1} onChange={(value) => setContent({ ...content, contact: { ...content.contact, title1: value } })} />
              <Field label="Title line 2" value={content.contact.title2} onChange={(value) => setContent({ ...content, contact: { ...content.contact, title2: value } })} />
              <Field label="Button" value={content.contact.button} onChange={(value) => setContent({ ...content, contact: { ...content.contact, button: value } })} />
              <Field label="Email" value={content.contact.email} onChange={(value) => setContent({ ...content, contact: { ...content.contact, email: value } })} />
              <Field label="Telegram" value={content.contact.telegram} onChange={(value) => setContent({ ...content, contact: { ...content.contact, telegram: value } })} />
              <Field label="Behance" value={content.contact.behance} onChange={(value) => setContent({ ...content, contact: { ...content.contact, behance: value } })} />
              <Field label="Dribbble" value={content.contact.dribbble} onChange={(value) => setContent({ ...content, contact: { ...content.contact, dribbble: value } })} />
            </>
          )}

          {tab === "labels" && (
            <>
              <Field label="Navbar: Projects" value={content.navbar.projects} onChange={(value) => setContent({ ...content, navbar: { ...content.navbar, projects: value } })} />
              <Field label="Navbar: Contact" value={content.navbar.contact} onChange={(value) => setContent({ ...content, navbar: { ...content.navbar, contact: value } })} />
              <Field label="Projects section title" value={content.projects.title} onChange={(value) => setContent({ ...content, projects: { ...content.projects, title: value } })} />
              <Field label="Projects: Showing" value={content.projects.showing} onChange={(value) => setContent({ ...content, projects: { ...content.projects, showing: value } })} />
              <Field label="Projects: of" value={content.projects.of} onChange={(value) => setContent({ ...content, projects: { ...content.projects, of: value } })} />
              <Field label="Projects: View all" value={content.projects.viewAll} onChange={(value) => setContent({ ...content, projects: { ...content.projects, viewAll: value } })} />
              <Field label="Projects: All page title" value={content.projects.allTitle} onChange={(value) => setContent({ ...content, projects: { ...content.projects, allTitle: value } })} />
            </>
          )}

          {tab !== "projects" && (
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => savePortfolio()}
                className="px-6 py-3 rounded-xl bg-white text-black font-semibold disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              {message && <span className="text-sm text-zinc-400">{message}</span>}
            </div>
          )}

          {tab === "projects" && message && <p className="text-sm text-zinc-400">{message}</p>}
        </div>
      </div>
    </main>
  );
}
