"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import WaveBackground from "@/components/WaveBackground";

export default function StudioTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/studio" || pathname.startsWith("/studio?");

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {isLogin && (
          <div className="absolute inset-0 opacity-90">
            <WaveBackground />
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background: isLogin
              ? "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(255,255,255,0.06), transparent 60%)"
              : "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,255,255,0.04), transparent 55%), linear-gradient(180deg, var(--bg-soft) 0%, var(--bg) 40%)",
          }}
        />
      </div>

      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 min-h-screen"
      >
        {children}
      </motion.div>
    </div>
  );
}
