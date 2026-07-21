import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toLangCode, type LangCode } from "@/lib/content";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";
import { serializeProjectLinks, type ProjectLink } from "@/lib/project-links";

type ProjectPayload = {
  lang?: LangCode;
  title?: string;
  category?: string;
  year?: string;
  description?: string;
  detail?: string;
  image?: string;
  links?: ProjectLink[];
  featured?: boolean;
  order?: number;
};

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  const { searchParams } = new URL(request.url);
  const lang = toLangCode(searchParams.get("lang") ?? "en");

  const projects = await prisma.project.findMany({
    where: { lang },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  try {
    const body = (await request.json()) as ProjectPayload;
    const lang = toLangCode(body.lang ?? "en");

    if (!body.title || !body.category || !body.year || !body.description || !body.image) {
      return NextResponse.json({ error: "Missing required project fields" }, { status: 400 });
    }

    const count = await prisma.project.count({ where: { lang } });

    const project = await prisma.project.create({
      data: {
        lang,
        title: body.title,
        category: body.category,
        year: body.year,
        description: body.description,
        detail: body.detail ?? "",
        image: body.image,
        links: serializeProjectLinks(body.links),
        featured: body.featured ?? false,
        order: body.order ?? count,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
