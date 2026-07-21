"use client";

import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";
import { StudioPanel } from "@/components/admin/studio-ui";

export default function StudioLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="absolute left-6 top-6 z-20 md:left-10 md:top-8">
        <Link
          href="/"
          className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text)]"
        >
          ← Portfolio
        </Link>
      </div>

      <StudioPanel className="relative z-10 w-full max-w-[400px]">
        <p className="mb-2 text-xs font-medium tracking-wide text-[var(--text-faint)]">
          Studio
        </p>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[var(--text)]">
          Sign in
        </h1>
        <p className="mb-7 text-sm leading-relaxed text-[var(--text-muted)]">
          Кабинет для редактирования портфолио.
        </p>
        <Suspense fallback={<div className="text-sm text-[var(--text-faint)]">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </StudioPanel>
    </main>
  );
}
