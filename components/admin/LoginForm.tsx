"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StudioButton, StudioInput, StudioLabel } from "@/components/admin/studio-ui";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(
          data.error === "Invalid credentials"
            ? "Неверный email или пароль"
            : (data.error ?? "Login failed")
        );
        setLoading(false);
        return;
      }

      const next = searchParams.get("next") ?? "/studio/dashboard";
      // Full navigation so the Set-Cookie from login is always sent on the
      // next document request (avoids App Router soft-nav + refresh races).
      const target = next.startsWith("/") && !next.startsWith("//") ? next : "/studio/dashboard";
      window.location.assign(target);
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <StudioLabel>Email</StudioLabel>
        <StudioInput
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          autoComplete="username"
        />
      </div>

      <div>
        <StudioLabel>Password</StudioLabel>
        <StudioInput
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          autoComplete="current-password"
        />
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <StudioButton type="submit" disabled={loading} className="w-full py-3">
        {loading ? "Signing in..." : "Sign in"}
      </StudioButton>
    </form>
  );
}
