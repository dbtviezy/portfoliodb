"use client";

import { useContent } from "@/components/ContentProvider";
import SiteLoader from "@/components/SiteLoader";

/** Renders children only after first content fetch from storage/API. */
export default function ContentGate({ children }: { children: React.ReactNode }) {
  const { ready } = useContent();
  if (!ready) return <SiteLoader />;
  return <>{children}</>;
}
