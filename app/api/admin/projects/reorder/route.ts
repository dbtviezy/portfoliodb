import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toLangCode } from "@/lib/content";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";
import { ephemeralWriteError, isEphemeralDatabase } from "@/lib/db-mode";

/** Body: { lang: "en"|"ru", orderedIds: number[] } */
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
    const body = await request.json();
    const lang = toLangCode(body.lang ?? "en");
    const orderedIds = Array.isArray(body.orderedIds)
      ? body.orderedIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isFinite(id))
      : [];

    if (orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
    }

    await prisma.$transaction(
      orderedIds.map((id: number, index: number) =>
        prisma.project.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    // Mirror order to the other language by previous order index pairing is fragile;
    // mirror by matching title when possible.
    const otherLang = lang === "en" ? "ru" : "en";
    const current = await prisma.project.findMany({
      where: { lang, id: { in: orderedIds } },
      select: { id: true, title: true, order: true },
    });
    for (const row of current) {
      await prisma.project.updateMany({
        where: { lang: otherLang, title: row.title },
        data: { order: row.order },
      });
    }

    const projects = await prisma.project.findMany({
      where: { lang },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Reorder failed", error);
    return NextResponse.json({ error: "Не удалось сохранить порядок" }, { status: 500 });
  }
}
