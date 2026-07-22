import { NextResponse } from "next/server";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";
import { ephemeralWriteError, getDbMode, isEphemeralDatabase, isTursoConfigured } from "@/lib/db-mode";

/** Studio status: which database mode is active (no secrets). */
export async function GET() {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  const mode = getDbMode();
  const ephemeral = isEphemeralDatabase();

  return NextResponse.json({
    mode,
    durable: !ephemeral,
    turso: isTursoConfigured(),
    vercel: Boolean(process.env.VERCEL),
    message: ephemeral
      ? ephemeralWriteError()
      : mode === "turso"
        ? "Turso подключён — сохранения Studio пишутся в облачную БД и сразу видны на сайте."
        : "Локальный SQLite-файл — сохранения на диске, сайт читает ту же базу.",
  });
}
