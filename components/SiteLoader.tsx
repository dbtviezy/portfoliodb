"use client";

import { useContent } from "@/components/ContentProvider";

/** Full-viewport minimal loader until portfolio content arrives from the DB. */
export default function SiteLoader() {
  const { lang } = useContent();
  const label = lang === "RU" ? "Загрузка" : "Loading";

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--bg)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(255,255,255,0.05),transparent_70%)]"
      />
      <p className="relative text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--text-faint)]">
        $ db.tviezy
      </p>
      <div className="relative mt-8 h-px w-24 overflow-hidden rounded-full bg-[var(--border)]">
        <span className="site-loader-bar absolute inset-y-0 left-0 w-1/2 bg-[var(--text-muted)]" />
      </div>
      <p className="relative mt-5 text-xs text-[var(--text-faint)]">{label}</p>
    </div>
  );
}
