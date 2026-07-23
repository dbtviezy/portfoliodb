import { NextResponse } from "next/server";
import { toLangCode, type LangCode } from "@/lib/content";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";
import { ephemeralWriteError, isEphemeralDatabase } from "@/lib/db-mode";
import {
  translateAllProjectsToOtherLang,
  translatePortfolioToOtherLang,
  translateProjectToOtherLang,
} from "@/lib/translate-content";

type TranslateBody = {
  /** Language currently edited in Studio — source of truth in the cloud DB. */
  lang?: LangCode | "RU" | "EN";
  scope?: "portfolio" | "project" | "projects";
  projectId?: number;
};

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  if (isEphemeralDatabase()) {
    return NextResponse.json(
      { error: ephemeralWriteError(), code: "ephemeral_db" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as TranslateBody;
    const sourceLang = toLangCode(body.lang ?? "en");
    const scope = body.scope ?? "portfolio";

    if (scope === "portfolio") {
      const result = await translatePortfolioToOtherLang(sourceLang);
      return NextResponse.json({
        ok: true,
        scope,
        sourceLang,
        targetLang: result.targetLang,
        content: result.content,
        message:
          result.targetLang === "ru"
            ? "Тексты карточки переведены на RU и сохранены в облаке"
            : "Card texts translated to EN and saved to the cloud",
      });
    }

    if (scope === "project") {
      const projectId = Number(body.projectId);
      if (!Number.isFinite(projectId) || projectId <= 0) {
        return NextResponse.json({ error: "projectId required" }, { status: 400 });
      }
      const result = await translateProjectToOtherLang(projectId);
      return NextResponse.json({
        ok: true,
        scope,
        sourceLang,
        targetLang: result.targetLang,
        projectId: result.projectId,
        message:
          result.targetLang === "ru"
            ? "Проект переведён на RU и сохранён"
            : "Project translated to EN and saved",
      });
    }

    if (scope === "projects") {
      const result = await translateAllProjectsToOtherLang(sourceLang);
      return NextResponse.json({
        ok: true,
        scope,
        sourceLang,
        targetLang: result.targetLang,
        count: result.count,
        message:
          result.targetLang === "ru"
            ? `Переведено проектов на RU: ${result.count}`
            : `Translated projects to EN: ${result.count}`,
      });
    }

    return NextResponse.json({ error: "Unknown scope" }, { status: 400 });
  } catch (error) {
    console.error("Translate API error:", error);
    const message = error instanceof Error ? error.message : "Translate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
