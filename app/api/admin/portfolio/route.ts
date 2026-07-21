import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortfolioContent, toLangCode, type LangCode } from "@/lib/content";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";

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
  const table = model === "skill" ? prisma.skill : prisma.expertiseItem;

  await table.deleteMany({ where: { lang } });
  if (items.length === 0) return;

  await table.createMany({
    data: items.map((name, index) => ({
      lang,
      name: name.trim(),
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

  try {
    const body = (await request.json()) as PortfolioPayload;
    const lang = toLangCode(body.lang ?? "en");

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
      contactEmail: body.contactEmail,
      contactTelegram: body.contactTelegram,
      contactBehance: body.contactBehance,
      contactDribbble: body.contactDribbble,
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

    await prisma.portfolio.upsert({
      where: { lang },
      create: { lang, ...cleaned },
      update: cleaned,
    });

    if (body.skills) {
      await syncListItems(lang, "skill", body.skills);
    }

    if (body.expertiseItems) {
      await syncListItems(lang, "expertise", body.expertiseItems);
    }

    const content = await getPortfolioContent(lang);
    return NextResponse.json(content);
  } catch {
    return NextResponse.json({ error: "Failed to save portfolio" }, { status: 500 });
  }
}
