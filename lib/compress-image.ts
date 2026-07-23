/** Client-side image compression before upload (keeps under Vercel 4.5MB body). */
export async function compressImageFile(
  file: File,
  options?: { maxEdge?: number; quality?: number; maxBytes?: number }
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const maxEdge = options?.maxEdge ?? 1920;
  const quality = options?.quality ?? 0.82;
  const maxBytes = options?.maxBytes ?? 3.5 * 1024 * 1024;

  if (file.size <= maxBytes && file.type === "image/webp") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), "image/webp", quality)
  );

  if (!blob || blob.size >= file.size) {
    return file;
  }

  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.webp`, { type: "image/webp", lastModified: Date.now() });
}
