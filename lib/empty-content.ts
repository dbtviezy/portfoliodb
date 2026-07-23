import type { PortfolioContent } from "@/lib/content";
import { channelsFromLegacy } from "@/lib/contact-channels";

/** Empty shell — never pull demo locales/Unsplash into the public site. */
export function emptyPortfolioContent(lang: "en" | "ru" | "EN" | "RU" = "en"): PortfolioContent {
  const isRu = String(lang).toLowerCase() === "ru";
  return {
    navbar: {
      projects: isRu ? "Проекты" : "Projects",
      contact: isRu ? "Контакты" : "Contact",
    },
    hero: {
      location: "",
      text1: "",
      text2: "",
      desc: "",
      btn: isRu ? "Работы" : "Work",
    },
    about: {
      title: isRu ? "Обо мне" : "About",
      profileImage: "",
      desc1: "",
      desc2: "",
      expertise: "",
      expertiseItems: [],
      stats: [
        { value: "", label: "" },
        { value: "", label: "" },
        { value: "", label: "" },
      ],
    },
    projects: {
      title: isRu ? "Работы" : "Work",
      showing: isRu ? "Показано" : "Showing",
      of: isRu ? "из" : "of",
      viewAll: isRu ? "Все работы" : "View all",
      allTitle: isRu ? "Все работы" : "All work",
      featured: [],
      allItems: [],
    },
    skills: {
      title: isRu ? "Навыки" : "Skills",
      items: [],
    },
    contact: {
      subtitle: "",
      title1: "",
      title2: "",
      button: isRu ? "Написать" : "Write",
      channels: [],
      email: "",
      telegram: "",
      behance: "",
      dribbble: "",
      instagram: "",
    },
  };
}

export function emptyPortfolioWithContacts(
  lang: "en" | "ru",
  contacts: {
    email?: string;
    telegram?: string;
    behance?: string;
    dribbble?: string;
    instagram?: string;
  } = {}
): PortfolioContent {
  const base = emptyPortfolioContent(lang);
  const email = contacts.email ?? "";
  const telegram = contacts.telegram ?? "";
  const behance = contacts.behance ?? "";
  const dribbble = contacts.dribbble ?? "";
  const instagram = contacts.instagram ?? "";
  return {
    ...base,
    contact: {
      ...base.contact,
      email,
      telegram,
      behance,
      dribbble,
      instagram,
      channels: channelsFromLegacy({ email, telegram, behance, dribbble, instagram }),
    },
  };
}
