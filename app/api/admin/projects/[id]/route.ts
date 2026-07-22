import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";
import { serializeProjectLinks } from "@/lib/project-links";
import { ephemeralWriteError, isEphemeralDatabase } from "@/lib/db-mode";

type RouteContext = {
  params: Promise<{ id: string }>;
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
      error: "Проект не найден в базе. Обнови страницу Studio и открой проект снова.",
      code: "not_found" as const,
      status: 404,
    };
  }
  console.error(fallback, error);
  return { error: fallback, code: "write_failed" as const, status: 500 };
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  const blocked = rejectEphemeralWrites();
  if (blocked) return blocked;

  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "Некорректный id проекта" }, { status: 400 });
  }

  try {
    const body = await request.json();

    const data = {
      title: body.title,
      category: body.category,
      year: body.year,
      description: body.description,
      detail: body.detail ?? "",
      image: body.image,
      links: serializeProjectLinks(body.links),
      featured: body.featured,
      order: body.order,
    };

    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    const project = await prisma.project.update({
      where: { id: projectId },
      data: cleaned,
    });

    return NextResponse.json(project);
  } catch (error) {
    const mapped = mapWriteError(error, "Не удалось обновить проект");
    return NextResponse.json(
      { error: mapped.error, code: mapped.code },
      { status: mapped.status }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  const blocked = rejectEphemeralWrites();
  if (blocked) return blocked;

  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "Некорректный id проекта" }, { status: 400 });
  }

  try {
    await prisma.project.delete({ where: { id: projectId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const mapped = mapWriteError(error, "Не удалось удалить проект");
    return NextResponse.json(
      { error: mapped.error, code: mapped.code },
      { status: mapped.status }
    );
  }
}
