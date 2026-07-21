import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";

export default function StudioLoginPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#111113] p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-3">Hidden access</p>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Studio</h1>
        <p className="text-sm text-zinc-400 mb-8">
          Войдите, чтобы редактировать портфолио. Эта страница не связана с публичным сайтом.
        </p>
        <Suspense fallback={<div className="text-zinc-500 text-sm">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
