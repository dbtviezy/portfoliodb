import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toLangCode, type LangCode } from "@/lib/content";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";
import { serializeProjectLinks, type ProjectLink } from "@/lib/project-links";
import { ephemeralWriteError, isEphemeralDatabase } from "@/lib/db-mode";

type ProjectPayload = {
  lang?: LangCode;
  title?: string;
  category?: string;
  year?: string;
  description?: string;
  detail?: string;
  image?: string;
  video?: string;
  links?: ProjectLink[];
  featured?: boolean;
  order?: number;
};

function rejectEphemeralWrites() {
  if (!isEphemeralDatabase()) return null;
  return NextResponse.json(
    { error: ephemeralWriteError(), code: "ephemeral_db" },
    { status: 503 }
  );
}

function mapWriteError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (
    lower.includes("readonly") ||
    lower.includes("read-only") ||
    lower.includes("attempt to write")
  ) {
    return {
      error: ephemeralWriteError(),
      code: "ephemeral_db" as const,
      status: 503,
    };
  }
  if (lower.includes("record to update not found") || lower.includes("p2025")) {
    return {
      error: "Проект не найден в базе (возможно, временная БД пересоздалась). Обнови Studio и попробуй снова.",
      code: "not_found" as const,
      status: 404,
    };
  }
  console.error(fallback, error);
  return { error: fallback, code: "write_failed" as const, status: 500 };
}

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

  const blocked = rejectEphemeralWrites();
  if (blocked) return blocked;

  try {
    const body = (await request.json()) as ProjectPayload;
    const lang = toLangCode(body.lang ?? "en");

    if (!body.title || !body.category || !body.year || !body.description || !body.image) {
      return NextResponse.json({ error: "Заполни title, category, year, description и image" }, { status: 400 });
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
        video: body.video ?? "",
        links: serializeProjectLinks(body.links),
        featured: body.featured ?? false,
        order: body.order ?? count,
      },
    });

    if (body.image?.trim() || body.video?.trim()) {
      const otherLang = lang === "en" ? "ru" : "en";
      await prisma.project.updateMany({
        where: { lang: otherLang, order: project.order },
        data: {
          ...(body.image?.trim() ? { image: body.image } : {}),
          ...(body.video?.trim() ? { video: body.video } : {}),
        },
      });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    const mapped = mapWriteError(error, "Не удалось создать проект");
    return NextResponse.json(
      { error: mapped.error, code: mapped.code },
      { status: mapped.status }
    );
  }
}
