import { NextResponse } from "next/server";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";
import { parseExternalVideo, providerLabel } from "@/lib/external-video";
import { storeImage } from "@/lib/storage";

export const runtime = "nodejs";

const FETCH_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  Referer: "https://rutube.ru/",
};

async function fetchImageBytes(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    redirect: "follow",
    cache: "no-store",
  });
  if (!response.ok) return null;
  const contentType = (response.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  if (!contentType.startsWith("image/")) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength < 256) return null;
  return { buffer, contentType };
}

async function rutubeThumbnailFromApi(id: string): Promise<string | null> {
  try {
    const response = await fetch(`https://rutube.ru/api/video/${id}/?format=json`, {
      headers: {
        ...FETCH_HEADERS,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { thumbnail_url?: string };
    return data.thumbnail_url?.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      videoUrl?: string;
      folder?: string;
    };
    const videoUrl = String(body.videoUrl ?? "").trim();
    const folder = String(body.folder ?? "projects").trim() || "projects";
    const external = parseExternalVideo(videoUrl);

    if (!external) {
      return NextResponse.json(
        {
          error:
            "Нужна ссылка Rutube / YouTube / Vimeo. Для загруженного MP4 используй «кадр из видео».",
        },
        { status: 400 }
      );
    }

    const candidates = [...external.thumbnailCandidates];
    if (external.provider === "rutube") {
      const fromApi = await rutubeThumbnailFromApi(external.id);
      if (fromApi) candidates.unshift(fromApi);
    }

    let downloaded: { buffer: Buffer; contentType: string } | null = null;
    for (const candidate of candidates) {
      downloaded = await fetchImageBytes(candidate);
      if (downloaded) break;
    }

    if (!downloaded) {
      return NextResponse.json(
        {
          error: `Не удалось скачать превью ${providerLabel(external.provider)}. Попробуй другое видео или загрузи фото вручную.`,
        },
        { status: 502 }
      );
    }

    const ext =
      downloaded.contentType.includes("png")
        ? "png"
        : downloaded.contentType.includes("webp")
          ? "webp"
          : "jpg";
    const file = new File(
      [new Uint8Array(downloaded.buffer)],
      `${external.provider}-cover-${external.id}.${ext}`,
      {
        type: downloaded.contentType || "image/jpeg",
        lastModified: Date.now(),
      }
    );

    const stored = await storeImage(file, folder);
    return NextResponse.json(
      {
        ...stored,
        provider: external.provider,
        videoId: external.id,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video cover failed";
    const status = /4\.5 MB|Только |Пустой файл|Blob Store/i.test(message) ? 400 : 500;
    console.error("Video cover error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
