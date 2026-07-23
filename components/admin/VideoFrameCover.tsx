"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StudioLabel } from "@/components/admin/studio-ui";

type VideoFrameCoverProps = {
  videoUrl: string;
  hasCover: boolean;
  folder?: string;
  onCover: (imageUrl: string) => void;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Grab a still from the project video and upload it as the cover photo
 * when no gallery images are set (or to replace the cover).
 */
export function VideoFrameCover({
  videoUrl,
  hasCover,
  folder = "projects",
  onCover,
}: VideoFrameCoverProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setReady(false);
    setDuration(0);
    setCurrent(0);
    setError("");
  }, [videoUrl]);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, time), video.duration || time);
  }, []);

  const captureAndUpload = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !ready) return;

    setBusy(true);
    setError("");
    try {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(video, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((result) => resolve(result), "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("Не удалось снять кадр");

      const file = new File([blob], `video-frame-${Date.now()}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      const body = new FormData();
      body.set("file", file);
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
        throw new Error(data.error ?? "Не удалось загрузить кадр");
      }
      onCover(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось взять кадр");
    } finally {
      setBusy(false);
    }
  }, [folder, onCover, ready]);

  if (!videoUrl.trim()) return null;

  return (
    <div
      className={`space-y-3 rounded-[var(--radius-md)] border p-3 sm:p-4 ${
        hasCover
          ? "border-[var(--border)] bg-[var(--bg-soft)]"
          : "border-[var(--accent)]/40 bg-[var(--accent)]/5"
      }`}
    >
      <div>
        <StudioLabel>Обложка из видео</StudioLabel>
        <p className="mt-1 text-xs text-[var(--text-faint)]">
          {hasCover
            ? "Можно заменить обложку кадром из loop — подвигай таймлайн и сними кадр."
            : "Фото ещё нет — выбери кадр из видео и поставь его на обложку."}
        </p>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-black/40">
        <video
          ref={videoRef}
          src={videoUrl}
          className="aspect-video w-full object-contain"
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            setDuration(video.duration || 0);
            setReady(true);
            // Prefer a frame slightly into the clip (not always black first frame).
            const start = Math.min(0.25, (video.duration || 1) * 0.05);
            video.currentTime = start;
            setCurrent(start);
          }}
          onSeeked={(event) => setCurrent(event.currentTarget.currentTime)}
          onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        />
      </div>

      <label className="block space-y-1.5">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Кадр</span>
          <span className="font-mono text-[var(--text-faint)]">
            {formatTime(current)} / {formatTime(duration)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.05}
          value={Math.min(current, duration || 0)}
          disabled={!ready || busy}
          onChange={(event) => seekTo(Number(event.target.value))}
          className="w-full accent-[var(--accent)]"
        />
      </label>

      <button
        type="button"
        disabled={!ready || busy}
        onClick={() => void captureAndUpload()}
        className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] transition hover:border-[var(--accent)] disabled:opacity-50"
      >
        {busy
          ? "Загрузка кадра…"
          : hasCover
            ? "Заменить обложку этим кадром"
            : "Поставить кадр на обложку"}
      </button>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
