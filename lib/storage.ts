import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const ALLOWED_IMAGES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const ALLOWED_VIDEOS = new Set(["video/mp4", "video/webm", "video/quicktime"]);

/** Vercel serverless body limit ~4.5MB for server uploads */
export const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;

export function isAllowedImageType(type: string): boolean {
  return ALLOWED_IMAGES.has(type);
}

export function isAllowedVideoType(type: string): boolean {
  return ALLOWED_VIDEOS.has(type);
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
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };
  return map[file.type] ?? ".bin";
}

function buildFilename(file: File, folder: string): string {
  const id = randomBytes(8).toString("hex");
  const stamp = Date.now();
  const cleanFolder = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "uploads";
  return `${cleanFolder}/${stamp}-${id}${safeExt(file)}`;
}

export type StoredFile = {
  url: string;
  pathname: string;
  storage: "blob" | "local";
  kind: "image" | "video";
};

async function putFile(file: File, folder: string, kind: "image" | "video"): Promise<StoredFile> {
  if (file.size <= 0) throw new Error("Пустой файл");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Файл больше 4.5 MB — сожми или укороти ролик");
  }

  const pathname = buildFilename(file, folder);
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (token) {
    const blob = await put(pathname, file, {
      access: "public",
      token,
      addRandomSuffix: false,
      contentType: file.type || undefined,
    });
    return { url: blob.url, pathname: blob.pathname, storage: "blob", kind };
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

  return { url: `/${pathname}`, pathname, storage: "local", kind };
}

export async function storeImage(file: File, folder = "portfolio"): Promise<StoredFile> {
  if (!isAllowedImageType(file.type)) {
    throw new Error("Только изображения: JPEG, PNG, WebP, GIF, AVIF");
  }
  return putFile(file, folder, "image");
}

export async function storeVideo(file: File, folder = "projects"): Promise<StoredFile> {
  if (!isAllowedVideoType(file.type)) {
    throw new Error("Только видео: MP4 / WebM (короткий loop)");
  }
  return putFile(file, folder, "video");
}

/** @deprecated alias */
export type StoredImage = StoredFile;
