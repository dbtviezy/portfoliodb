"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function StudioLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-[11px] font-medium text-[var(--text-muted)]">
      {children}
    </span>
  );
}

export function StudioInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--border-strong)] focus:bg-[var(--bg-soft)] disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

export function StudioTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-y rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--border-strong)] focus:bg-[var(--bg-soft)] disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

export function StudioField({
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
  return (
    <label className="block">
      <StudioLabel>{label}</StudioLabel>
      {multiline ? (
        <StudioTextarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <StudioInput type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function StudioButton({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "subtle";
}) {
  const styles = {
    primary:
      "bg-[var(--accent)] text-[var(--accent-fg)] hover:brightness-95",
    ghost:
      "border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]",
    danger:
      "border border-[var(--border)] text-[var(--danger)] hover:bg-red-500/10",
    subtle:
      "text-[var(--text-muted)] hover:text-[var(--text)]",
  }[variant];

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 ${styles} ${className}`}
    />
  );
}

export function StudioPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-panel)] p-6 shadow-[var(--shadow-panel)] md:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export function StudioListEditor({
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
      <div className="mb-3 flex items-center justify-between">
        <StudioLabel>{label}</StudioLabel>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--text)]"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <StudioInput
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[index] = e.target.value;
                onChange(next);
              }}
            />
            <StudioButton
              type="button"
              variant="ghost"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="px-3"
              aria-label="Remove"
            >
              ×
            </StudioButton>
          </div>
        ))}
      </div>
    </div>
  );
}
