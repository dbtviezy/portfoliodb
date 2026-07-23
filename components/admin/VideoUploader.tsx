"use client";

import { useCallback, useRef, useState } from "react";
import { StudioInput, StudioLabel } from "@/components/admin/studio-ui";

type VideoUploaderProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
};

/** Optional short loop for project cards / modal (MP4 / WebM, ≤4.5MB). */
export function VideoUploader({
  label,
  value,
  onChange,
  folder = "projects",
}: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadFile = useCallback(
    async (file: File) => {
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

        onChange(data.url);
      } catch {
        setError("Сеть: не удалось загрузить");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange]
  );

  const onFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      void uploadFile(file);
    },
    [uploadFile]
  );

  return (
    <div className="space-y-2">
      <StudioLabel>{label}</StudioLabel>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-[5.5rem] cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed px-4 py-4 text-center transition ${
          dragging
            ? "border-[var(--accent)] bg-[var(--accent)]/10"
            : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <p className="text-sm text-[var(--text)]">
          {uploading ? "Загрузка…" : value ? "Заменить видео" : "Перетащи короткое видео"}
        </p>
        <p className="mt-1 text-xs text-[var(--text-faint)]">
          MP4 / WebM · до 4.5 MB · или ссылка Rutube / YouTube ниже
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <StudioInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="или URL: rutube.ru/video/… / YouTube / прямой MP4"
      />
      {value ? (
        <button
          type="button"
          className="text-xs text-[var(--text-faint)] hover:text-[var(--text)] hover:underline"
          onClick={() => onChange("")}
        >
          Убрать видео
        </button>
      ) : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
