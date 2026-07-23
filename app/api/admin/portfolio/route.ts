import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortfolioContent, toLangCode, type LangCode } from "@/lib/content";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";
import {
  legacyFieldsFromChannels,
  parseContactChannels,
  resolveContactChannels,
  serializeContactChannels,
  type ContactChannel,
} from "@/lib/contact-channels";
import { ephemeralWriteError, isEphemeralDatabase } from "@/lib/db-mode";

type PortfolioPayload = {
  lang?: LangCode;
  heroLocation?: string;
  heroText1?: string;
  heroText2?: string;
  heroDesc?: string;
  heroBtn?: string;
  aboutTitle?: string;
  aboutDesc1?: string;
  aboutDesc2?: string;
  aboutExpertise?: string;
  profileImage?: string;
  aboutStats1Label?: string;
  aboutStats1Value?: string;
  aboutStats2Label?: string;
  aboutStats2Value?: string;
  aboutStats3Label?: string;
  aboutStats3Value?: string;
  contactSubtitle?: string;
  contactTitle1?: string;
  contactTitle2?: string;
  contactBtn?: string;
  contactEmail?: string;
  contactTelegram?: string;
  contactBehance?: string;
  contactDribbble?: string;
  contactInstagram?: string;
  contactChannels?: ContactChannel[] | string;
  navbarProjects?: string;
  navbarContact?: string;
  skillsTitle?: string;
  projectsTitle?: string;
  projectsShowing?: string;
  projectsOf?: string;
  projectsViewAll?: string;
  projectsAllTitle?: string;
  skills?: string[];
  expertiseItems?: string[];
};

async function syncListItems(
  lang: LangCode,
  model: "skill" | "expertise",
  items: string[]
) {
  if (model === "skill") {
    await prisma.skill.deleteMany({ where: { lang } });
    const cleaned = items.map((name) => name.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    await prisma.skill.createMany({
      data: cleaned.map((name, index) => ({
        lang,
        name,
        order: index,
      })),
    });
    return;
  }

  await prisma.expertiseItem.deleteMany({ where: { lang } });
  const cleaned = items.map((name) => name.trim()).filter(Boolean);
  if (cleaned.length === 0) return;
  await prisma.expertiseItem.createMany({
    data: cleaned.map((name, index) => ({
      lang,
      name,
      order: index,
    })),
  });
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  const { searchParams } = new URL(request.url);
  const lang = toLangCode(searchParams.get("lang") ?? "en");

  try {
    const content = await getPortfolioContent(lang);
    return NextResponse.json(content);
  } catch {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  if (isEphemeralDatabase()) {
    return NextResponse.json(
      { error: ephemeralWriteError(), code: "ephemeral_db" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as PortfolioPayload;
    const lang = toLangCode(body.lang ?? "en");

    const current = await prisma.portfolio.findFirst({ where: { lang } });
    const existingLegacy = {
      email: current?.contactEmail ?? "",
      telegram: current?.contactTelegram ?? "",
      behance: current?.contactBehance ?? "",
      dribbble: current?.contactDribbble ?? "",
      instagram: current?.contactInstagram ?? "",
    };
    const bodyLegacy = {
      email: body.contactEmail ?? existingLegacy.email,
      telegram: body.contactTelegram ?? existingLegacy.telegram,
      behance: body.contactBehance ?? existingLegacy.behance,
      dribbble: body.contactDribbble ?? existingLegacy.dribbble,
      instagram: body.contactInstagram ?? existingLegacy.instagram,
    };

    let contactChannelsValue: string | undefined;
    let syncedLegacy = bodyLegacy;
    if (body.contactChannels !== undefined) {
      const incoming =
        typeof body.contactChannels === "string"
          ? parseContactChannels(body.contactChannels)
          : body.contactChannels;
      const resolved = resolveContactChannels(incoming, {
        ...existingLegacy,
        ...bodyLegacy,
      });
      contactChannelsValue = serializeContactChannels(resolved);
      syncedLegacy = legacyFieldsFromChannels(resolved, {
        ...existingLegacy,
        ...bodyLegacy,
      });
    }

    const data = {
      heroLocation: body.heroLocation,
      heroText1: body.heroText1,
      heroText2: body.heroText2,
      heroDesc: body.heroDesc,
      heroBtn: body.heroBtn,
      aboutTitle: body.aboutTitle,
      aboutDesc1: body.aboutDesc1,
      aboutDesc2: body.aboutDesc2,
      aboutExpertise: body.aboutExpertise,
      profileImage: body.profileImage,
      aboutStats1Label: body.aboutStats1Label,
      aboutStats1Value: body.aboutStats1Value,
      aboutStats2Label: body.aboutStats2Label,
      aboutStats2Value: body.aboutStats2Value,
      aboutStats3Label: body.aboutStats3Label,
      aboutStats3Value: body.aboutStats3Value,
      contactSubtitle: body.contactSubtitle,
      contactTitle1: body.contactTitle1,
      contactTitle2: body.contactTitle2,
      contactBtn: body.contactBtn,
      contactEmail: syncedLegacy.email,
      contactTelegram: syncedLegacy.telegram,
      contactBehance: syncedLegacy.behance,
      contactDribbble: syncedLegacy.dribbble,
      contactInstagram: syncedLegacy.instagram,
      contactChannels: contactChannelsValue,
      navbarProjects: body.navbarProjects,
      navbarContact: body.navbarContact,
      skillsTitle: body.skillsTitle,
      projectsTitle: body.projectsTitle,
      projectsShowing: body.projectsShowing,
      projectsOf: body.projectsOf,
      projectsViewAll: body.projectsViewAll,
      projectsAllTitle: body.projectsAllTitle,
    };

    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    if (current) {
      await prisma.portfolio.update({
        where: { id: current.id },
        data: cleaned,
      });
    } else {
      await prisma.portfolio.create({
        data: { lang, ...cleaned },
      });
    }

    // Portrait is shared across EN/RU — keep both rows in sync.
    if (typeof body.profileImage === "string") {
      const otherLang = lang === "en" ? "ru" : "en";
      await prisma.portfolio.updateMany({
        where: { lang: otherLang },
        data: { profileImage: body.profileImage },
      });
    }

    if (body.skills) {
      await syncListItems(lang, "skill", body.skills);
    }

    if (body.expertiseItems) {
      await syncListItems(lang, "expertise", body.expertiseItems);
    }

    const content = await getPortfolioContent(lang);
    return NextResponse.json(content);
  } catch (error) {
    console.error("Failed to save portfolio", error);
    return NextResponse.json({ error: "Не удалось сохранить карточку", code: "write_failed" }, { status: 500 });
  }
}
