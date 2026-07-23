"use client";

import { useCallback, useRef, useState } from "react";

type ProjectCardImageDropProps = {
  image: string;
  title: string;
  disabled?: boolean;
  onUploaded: (url: string) => Promise<void> | void;
};

/** Compact drag-and-drop zone on a Work list card. */
export function ProjectCardImageDrop({
  image,
  title,
  disabled,
  onUploaded,
}: ProjectCardImageDropProps) {
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
        body.set("folder", "projects");

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body,
        });
        const data = (await response.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };

        if (!response.ok || !data.url) {
          setError(data.error ?? "Ошибка");
          return;
        }

        await onUploaded(data.url);
      } catch {
        setError("Сеть");
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  const onFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file || disabled) return;
      void uploadFile(file);
    },
    [disabled, uploadFile]
  );

  return (
    <div className="shrink-0">
      <button
        type="button"
        disabled={disabled || uploading}
        title="Перетащи фото или кликни"
        aria-label={`Фото проекта ${title}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragging(false);
          onFiles(event.dataTransfer.files);
        }}
        className={`relative h-16 w-16 overflow-hidden rounded-[var(--radius-sm)] border border-dashed transition sm:h-[4.5rem] sm:w-[4.5rem] ${
          dragging
            ? "border-[var(--accent)] bg-[var(--accent)]/15"
            : "border-[var(--border-strong)] bg-[var(--bg-soft)] hover:border-[var(--accent)]/50"
        } ${uploading || disabled ? "opacity-60" : ""}`}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 text-center text-[9px] leading-tight text-[var(--text-faint)]">
            Drop
            <span className="opacity-70">photo</span>
          </span>
        )}
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[9px] font-medium text-white">
            …
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {error ? <p className="mt-1 max-w-16 text-[10px] text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
