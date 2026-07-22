"use client";

import { useCallback, useRef, useState } from "react";
import { StudioInput, StudioLabel } from "@/components/admin/studio-ui";

type ImageUploaderProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
};

export function ImageUploader({
  label,
  value,
  onChange,
  folder = "portfolio",
}: ImageUploaderProps) {
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

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body,
        });
        const data = (await response.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };

        if (!response.ok || !data.url) {
          setError(data.error ?? "Не удалось загрузить");
          return;
        }

        onChange(data.url);
      } catch {
        setError("Сеть: не удалось загрузить файл");
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
          onFiles(event.dataTransfer.files);
        }}
        className={`relative flex min-h-[9.5rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-dashed px-4 py-5 text-center transition ${
          dragging
            ? "border-[var(--accent)] bg-[var(--accent)]/10"
            : "border-[var(--border-strong)] bg-[var(--bg-soft)] hover:border-[var(--accent)]/60"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : null}

        <div className="relative z-[1] space-y-1">
          <p className="text-sm font-medium text-[var(--text)]">
            {uploading ? "Загрузка…" : "Перетащи фото сюда"}
          </p>
          <p className="text-xs text-[var(--text-faint)]">
            или кликни · JPEG / PNG / WebP · до 4.5 MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            onFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {value ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-16 w-16 shrink-0 rounded-[var(--radius-sm)] object-cover ring-1 ring-[var(--border)]"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <StudioInput
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="URL после загрузки"
              aria-label={`${label} URL`}
            />
            <button
              type="button"
              className="text-xs text-[var(--text-faint)] underline-offset-2 hover:text-[var(--text)] hover:underline"
              onClick={() => onChange("")}
            >
              Убрать фото
            </button>
          </div>
        </div>
      ) : (
        <StudioInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="или вставь URL вручную"
          aria-label={`${label} URL`}
        />
      )}

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
