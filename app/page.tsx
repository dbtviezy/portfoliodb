"use client";

import { ContentProvider, useContent } from "@/components/ContentProvider";
import ContentGate from "@/components/ContentGate";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BioModal from "@/components/BioModal";

export type Lang = "RU" | "EN";

function HomeContent() {
  const { lang } = useContent();

  return (
    <main className="relative min-h-screen bg-transparent text-[var(--text)]">
      <Navbar lang={lang} />
      <Hero lang={lang} />
      <Projects lang={lang} />
      <Contact lang={lang} />
      <Footer lang={lang} />
      <LanguageSwitcher />
      <BioModal lang={lang} />
    </main>
  );
}

export default function Home() {
  return (
    <ContentProvider initialLang="EN">
      <ContentGate>
        <HomeContent />
      </ContentGate>
    </ContentProvider>
  );
}
