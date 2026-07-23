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

  const setAsCover = (index: number) => {
    if (index <= 0 || index >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div>
        <StudioLabel>{label}</StudioLabel>
        <p className="mt-1 text-xs text-[var(--text-faint)]">
          Необязательно — можно без фото, если есть видео. На сайте фото
          листаются только в открытом проекте; здесь выбери лицевую (обложку).
        </p>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((url, index) => {
            const isCover = index === 0;
            return (
              <div
                key={`${url}-${index}`}
                className={`relative overflow-hidden rounded-[var(--radius-md)] border bg-[var(--bg-soft)] ${
                  isCover ? "border-[var(--text-muted)]" : "border-[var(--border)]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />

                {isCover ? (
                  <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white">
                    Лицевая
                  </span>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-1 bg-black/60 px-1.5 py-1.5">
                  {!isCover ? (
                    <button
                      type="button"
                      onClick={() => setAsCover(index)}
                      className="rounded bg-white/15 px-2 py-0.5 text-[10px] text-white transition hover:bg-white/25"
                    >
                      Сделать лицевой
                    </button>
                  ) : (
                    <span className="px-1 text-[10px] text-white/70">на карточке и в карусели</span>
                  )}
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => removeAt(index)}
                    className="ml-auto rounded px-1.5 text-[11px] text-white/85 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
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
          несколько файлов · JPEG / PNG / WebP
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
