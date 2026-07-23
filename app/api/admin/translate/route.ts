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
  /** Studio tab language — where we read the source text from in the cloud. */
  lang?: LangCode | "RU" | "EN";
  scope?: "portfolio" | "project" | "projects";
  projectId?: number;
};

function pairMessage(sourceLang: LangCode, targetLang: LangCode, kind: string) {
  const from = sourceLang.toUpperCase();
  const to = targetLang.toUpperCase();
  if (targetLang === "ru") {
    return `${kind}: определили ${from} → перевели на ${to} и сохранили в облаке`;
  }
  return `${kind}: detected ${from} → translated to ${to} and saved to the cloud`;
}

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
    const studioLang = toLangCode(body.lang ?? "en");
    const scope = body.scope ?? "portfolio";

    if (scope === "portfolio") {
      const result = await translatePortfolioToOtherLang(studioLang);
      return NextResponse.json({
        ok: true,
        scope,
        studioLang,
        sourceLang: result.sourceLang,
        targetLang: result.targetLang,
        content: result.content,
        message: pairMessage(result.sourceLang, result.targetLang, "Карточка"),
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
        studioLang,
        sourceLang: result.sourceLang,
        targetLang: result.targetLang,
        projectId: result.projectId,
        message: pairMessage(result.sourceLang, result.targetLang, "Проект"),
      });
    }

    if (scope === "projects") {
      const result = await translateAllProjectsToOtherLang(studioLang);
      return NextResponse.json({
        ok: true,
        scope,
        studioLang,
        sourceLang: result.sourceLang,
        targetLang: result.targetLang,
        count: result.count,
        message:
          result.targetLang === "ru"
            ? `Проекты: авто RU↔EN, сохранено ${result.count}`
            : `Projects: auto RU↔EN, saved ${result.count}`,
      });
    }

    return NextResponse.json({ error: "Unknown scope" }, { status: 400 });
  } catch (error) {
    console.error("Translate API error:", error);
    const message = error instanceof Error ? error.message : "Translate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
