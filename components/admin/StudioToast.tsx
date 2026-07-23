"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type StudioToastState = {
  type: "ok" | "err";
  text: string;
} | null;

type StudioToastProps = {
  toast: StudioToastState;
  onDismiss: () => void;
  /** Auto-hide delay in ms; 0 = sticky until next toast */
  durationMs?: number;
};

/** Floating overlay feedback for Studio saves / errors. */
export function StudioToast({
  toast,
  onDismiss,
  durationMs = 3200,
}: StudioToastProps) {
  useEffect(() => {
    if (!toast || durationMs <= 0) return;
    const id = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(id);
  }, [toast, durationMs, onDismiss]);

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto fixed bottom-5 left-1/2 z-[220] w-[min(26rem,calc(100vw-1.5rem))] -translate-x-1/2 sm:bottom-7"
        >
          <div
            className={`flex items-start gap-3 rounded-[var(--radius-lg)] border px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-md ${
              toast.type === "err"
                ? "border-red-500/35 bg-[var(--bg-panel)]/95 text-[var(--danger)]"
                : "border-[var(--border-strong)] bg-[var(--bg-panel)]/95 text-[var(--text)]"
            }`}
          >
            <span
              aria-hidden
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                toast.type === "err"
                  ? "bg-red-500/15 text-[var(--danger)]"
                  : "bg-[var(--accent)]/15 text-[var(--accent)]"
              }`}
            >
              {toast.type === "err" ? "!" : "✓"}
            </span>
            <p className="min-w-0 flex-1 text-sm leading-snug">{toast.text}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 text-xs text-[var(--text-faint)] transition hover:text-[var(--text)]"
            >
              ✕
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
