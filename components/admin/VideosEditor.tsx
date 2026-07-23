"use client";

import { useCallback, useRef, useState } from "react";
import { StudioInput, StudioLabel } from "@/components/admin/studio-ui";
import { parseExternalVideo, providerLabel } from "@/lib/external-video";

type VideosEditorProps = {
  videos: string[];
  onChange: (videos: string[]) => void;
  folder?: string;
};

function shortLabel(url: string, index: number) {
  const external = parseExternalVideo(url);
  if (external) return `${providerLabel(external.provider)} · ${external.id.slice(0, 8)}…`;
  try {
    const path = new URL(url).pathname.split("/").pop() || url;
    return path.length > 28 ? `${path.slice(0, 28)}…` : path;
  } catch {
    return url.trim() || `Video ${index + 1}`;
  }
}

/**
 * Multiple project videos: Rutube/YouTube/Vimeo links and/or uploaded MP4 loops.
 * First item is the primary card/modal hero video.
 */
export function VideosEditor({
  videos,
  onChange,
  folder = "projects",
}: VideosEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const addUrl = useCallback(
    (raw: string) => {
      const url = raw.trim();
      if (!url) return;
      if (videos.includes(url)) {
        setError("Эта ссылка уже добавлена");
        return;
      }
      setError("");
      onChange([...videos, url]);
      setDraft("");
    },
    [onChange, videos]
  );

  const uploadFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setUploading(true);
      setError("");
      try {
        const body = new FormData();
        body.set("file", file);
        body.set("folder", folder);
        body.set("kind", "video");

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body,
        });
        const data = (await response.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };
        if (!response.ok || !data.url) {
          setError(data.error ?? "Не удалось загрузить видео");
          return;
        }
        if (!videos.includes(data.url)) {
          onChange([...videos, data.url]);
        }
      } catch {
        setError("Сеть: не удалось загрузить");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange, videos]
  );

  const updateAt = (index: number, value: string) => {
    const next = [...videos];
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(videos.filter((_, i) => i !== index));
  };

  const moveToPrimary = (index: number) => {
    if (index <= 0) return;
    const next = [...videos];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <StudioLabel>Videos</StudioLabel>
        <p className="mt-1 text-xs text-[var(--text-faint)]">
          Можно несколько ссылок Rutube / YouTube / Vimeo или коротких MP4.
          Первое — основное (карточка / обложка в модалке).
        </p>
      </div>

      {videos.length > 0 ? (
        <ul className="space-y-2">
          {videos.map((url, index) => {
            const isPrimary = index === 0;
            return (
              <li
                key={`${url}-${index}`}
                className={`space-y-2 rounded-[var(--radius-md)] border p-3 ${
                  isPrimary
                    ? "border-[var(--accent)]/35 bg-[var(--accent)]/5"
                    : "border-[var(--border)] bg-[var(--bg-soft)]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-[var(--text-muted)]">
                    {isPrimary ? "Основное · " : `${index + 1}. `}
                    {shortLabel(url, index)}
                  </p>
                  <div className="flex items-center gap-2">
                    {!isPrimary ? (
                      <button
                        type="button"
                        onClick={() => moveToPrimary(index)}
                        className="text-xs text-[var(--text-faint)] hover:text-[var(--text)] hover:underline"
                      >
                        Сделать основным
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeAt(index)}
                      className="text-xs text-[var(--text-faint)] hover:text-[var(--danger)] hover:underline"
                    >
                      Убрать
                    </button>
                  </div>
                </div>
                <StudioInput
                  value={url}
                  onChange={(event) => updateAt(index, event.target.value)}
                  placeholder="https://rutube.ru/video/…"
                />
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <StudioInput
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addUrl(draft);
            }
          }}
          placeholder="Вставь ссылку Rutube / YouTube / Vimeo"
          className="sm:flex-1"
        />
        <button
          type="button"
          onClick={() => addUrl(draft)}
          className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] transition hover:border-[var(--accent)]"
        >
          + Добавить ссылку
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="text-xs text-[var(--text-faint)] hover:text-[var(--text)] hover:underline disabled:opacity-50"
        >
          {uploading ? "Загрузка MP4…" : "или загрузить короткий MP4 / WebM"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            void uploadFile(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
