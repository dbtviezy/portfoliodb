import { NextResponse } from "next/server";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";
import { MAX_UPLOAD_BYTES, storeImage } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") ?? "portfolio");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Нужен файл (field: file)" }, { status: 400 });
    }

    const stored = await storeImage(file, folder);
    return NextResponse.json(stored, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status =
      /4\.5 MB|Только изображения|Пустой файл|Blob Store/i.test(message) ? 400 : 500;
    console.error("Upload error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  return NextResponse.json({
    maxBytes: MAX_UPLOAD_BYTES,
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    vercel: Boolean(process.env.VERCEL),
  });
}
