"use client";

import { memo } from "react";

interface FooterProps {
  lang: "RU" | "EN";
}

const Footer = memo(function Footer({ lang }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const name = lang === "RU" ? "Д. Баутин" : "D. Bautin";

  return (
    <footer
      className="w-full bg-[var(--bg)]"
      style={{
        paddingLeft: "var(--page-x)",
        paddingRight: "var(--page-x)",
        paddingBottom: "calc(1.75rem + var(--safe-bottom))",
      }}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 border-t border-transparent pt-6 2xl:max-w-6xl [border-image:linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)_1]">
        <p className="text-[11px] tracking-wide text-[var(--text-faint)] sm:text-xs">
          © {currentYear} {name}
        </p>
        <p className="font-mono text-[10px] tracking-[0.18em] text-[var(--text-faint)] sm:text-[11px]">
          $ db.tviezy
        </p>
      </div>
    </footer>
  );
});

export default Footer;
