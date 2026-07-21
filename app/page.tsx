"use client";

import { ContentProvider, useContent } from "@/components/ContentProvider";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export type Lang = "RU" | "EN";

function HomeContent() {
  const { lang } = useContent();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-20 relative">
      <Navbar lang={lang} />
      <Hero lang={lang} />
      <Projects lang={lang} />
      <About lang={lang} />
      <Skills lang={lang} />
      <Contact lang={lang} />
      <Footer lang={lang} />
      <LanguageSwitcher />
    </main>
  );
}

export default function Home() {
  return (
    <ContentProvider initialLang="EN">
      <HomeContent />
    </ContentProvider>
  );
}
