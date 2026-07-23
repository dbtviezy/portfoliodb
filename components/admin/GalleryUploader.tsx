"use client";

import { useCallback, useRef, useState } from "react";
import { StudioLabel } from "@/components/admin/studio-ui";
import { compressImageFile } from "@/lib/compress-image";

type GalleryUploaderProps = {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
};

export function GalleryUploader({
  label,
  images,
  onChange,
  folder = "projects",
}: GalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadFiles = useCallback(
    async (fileList: FileList | null) => {
      const files = Array.from(fileList ?? []).filter((file) =>
        file.type.startsWith("image/")
      );
      if (files.length === 0) return;

      setUploading(true);
      setError("");
      const uploaded: string[] = [];

      try {
        for (const file of files) {
          const prepared = await compressImageFile(file);
          const body = new FormData();
          body.set("file", prepared);
          body.set("folder", folder);
          body.set("kind", "image");

          const response = await fetch("/api/admin/upload", {
            method: "POST",
            body,
          });
          const data = (await response.json().catch(() => ({}))) as {
            url?: string;
            error?: string;
          };

          if (!response.ok || !data.url) {
            setError(data.error ?? "Не удалось загрузить одно из фото");
            continue;
          }
          uploaded.push(data.url);
        }

        if (uploaded.length > 0) {
          onChange([...images, ...uploaded]);
        }
      } catch {
        setError("Сеть: не удалось загрузить файлы");
      } finally {
        setUploading(false);
      }
    },
    [folder, images, onChange]
  );

  const move = (index: number, delta: number) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <StudioLabel>{label}</StudioLabel>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-1.5 py-1">
                <span className="text-[10px] text-white/80">
                  {index === 0 ? "Обложка" : `#${index + 1}`}
                </span>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    aria-label="Move left"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded px-1.5 text-[11px] text-white/85 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label="Move right"
                    disabled={index === images.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded px-1.5 text-[11px] text-white/85 disabled:opacity-30"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => removeAt(index)}
                    className="rounded px-1.5 text-[11px] text-white/85 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void uploadFiles(event.dataTransfer.files);
        }}
        className={`flex min-h-[5.5rem] cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed px-4 py-4 text-center transition ${
          dragging
            ? "border-[var(--accent)] bg-[var(--accent)]/10"
            : "border-[var(--border-strong)] bg-[var(--bg-soft)] hover:border-[var(--accent)]/60"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <p className="text-sm font-medium text-[var(--text)]">
          {uploading ? "Загрузка…" : "Добавить фото"}
        </p>
        <p className="mt-1 text-xs text-[var(--text-faint)]">
          несколько файлов · JPEG / PNG / WebP · первое = обложка
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            void uploadFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
