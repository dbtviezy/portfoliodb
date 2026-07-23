"use client";

import { StudioLabel } from "@/components/admin/studio-ui";
import {
  clampFrame,
  imageFrameStyle,
  type ImageFrame,
} from "@/lib/image-frame";

type ImageFrameEditorProps = {
  image: string;
  value: ImageFrame;
  onChange: (frame: ImageFrame) => void;
};

export function ImageFrameEditor({ image, value, onChange }: ImageFrameEditorProps) {
  const frame = clampFrame(value);
  const style = imageFrameStyle(frame);

  if (!image) {
    return (
      <p className="text-xs text-[var(--text-faint)]">
        Сначала добавь лицевое фото — потом можно подвинуть кадр.
      </p>
    );
  }

  const set = (patch: Partial<ImageFrame>) => onChange(clampFrame({ ...frame, ...patch }));

  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 sm:p-4">
      <div>
        <StudioLabel>Кадр на сайте (лицевая)</StudioLabel>
        <p className="mt-1 text-xs text-[var(--text-faint)]">
          Кадр влияет на карточки и карусель (обрезка). В открытом проекте фото
          показывается целиком — без этого зума.
        </p>
      </div>

      <div className="relative mx-auto aspect-[16/10] w-full max-w-md overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover will-change-transform"
          style={style}
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.35),transparent_45%)]" />
        <span className="absolute bottom-2 left-2 rounded bg-black/55 px-2 py-0.5 text-[10px] text-white/85">
          Preview
        </span>
      </div>

      <label className="block space-y-1.5">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Масштаб</span>
          <span className="font-mono text-[var(--text-faint)]">{frame.zoom.toFixed(2)}×</span>
        </div>
        <input
          type="range"
          min={1}
          max={2.5}
          step={0.01}
          value={frame.zoom}
          onChange={(event) => set({ zoom: Number(event.target.value) })}
          className="w-full accent-[var(--accent)]"
        />
      </label>

      <label className="block space-y-1.5">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Горизонталь</span>
          <span className="font-mono text-[var(--text-faint)]">{Math.round(frame.x)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={frame.x}
          onChange={(event) => set({ x: Number(event.target.value) })}
          className="w-full accent-[var(--accent)]"
        />
      </label>

      <label className="block space-y-1.5">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Вертикаль (выше / ниже)</span>
          <span className="font-mono text-[var(--text-faint)]">{Math.round(frame.y)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={frame.y}
          onChange={(event) => set({ y: Number(event.target.value) })}
          className="w-full accent-[var(--accent)]"
        />
      </label>

      <button
        type="button"
        onClick={() => onChange(clampFrame({ zoom: 1, x: 50, y: 50 }))}
        className="text-xs text-[var(--text-faint)] underline-offset-2 hover:text-[var(--text)] hover:underline"
      >
        Сбросить кадр
      </button>
    </div>
  );
}
