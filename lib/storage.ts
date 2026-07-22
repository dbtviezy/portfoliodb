import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/** Vercel serverless body limit ~4.5MB for server uploads */
export const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;

export function isAllowedImageType(type: string): boolean {
  return ALLOWED.has(type);
}

function safeExt(file: File): string {
  const fromName = path.extname(file.name || "").toLowerCase().replace(/[^.a-z0-9]/g, "");
  if (fromName && fromName.length <= 5) return fromName;
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
  };
  return map[file.type] ?? ".bin";
}

function buildFilename(file: File, folder: string): string {
  const id = randomBytes(8).toString("hex");
  const stamp = Date.now();
  const cleanFolder = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "uploads";
  return `${cleanFolder}/${stamp}-${id}${safeExt(file)}`;
}

export type StoredImage = {
  url: string;
  pathname: string;
  storage: "blob" | "local";
};

/**
 * Store an image in Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
 * otherwise write to public/uploads (local / Node host with disk).
 */
export async function storeImage(file: File, folder = "portfolio"): Promise<StoredImage> {
  if (!isAllowedImageType(file.type)) {
    throw new Error("Только изображения: JPEG, PNG, WebP, GIF, AVIF");
  }
  if (file.size <= 0) {
    throw new Error("Пустой файл");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Файл больше 4.5 MB — сожми фото или уменьши размер");
  }

  const pathname = buildFilename(file, folder);
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (token) {
    const blob = await put(pathname, file, {
      access: "public",
      token,
      addRandomSuffix: false,
    });
    return { url: blob.url, pathname: blob.pathname, storage: "blob" };
  }

  if (process.env.VERCEL) {
    throw new Error(
      "На Vercel нужен Blob Store: Project → Storage → Create Blob, затем BLOB_READ_WRITE_TOKEN в Environment Variables и Redeploy."
    );
  }

  const diskPath = path.join(process.cwd(), "public", pathname);
  await mkdir(path.dirname(diskPath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  return { url: `/${pathname}`, pathname, storage: "local" };
}
