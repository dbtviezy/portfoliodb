import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  const { id } = await context.params;
  const projectId = Number(id);

  if (Number.isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }

  try {
    const body = await request.json();

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: body.title,
        category: body.category,
        year: body.year,
        description: body.description,
        image: body.image,
        featured: body.featured,
        order: body.order,
      },
    });

    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  const { id } = await context.params;
  const projectId = Number(id);

  if (Number.isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }

  try {
    await prisma.project.delete({ where: { id: projectId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
