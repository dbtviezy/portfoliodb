import { NextResponse } from "next/server";
import { getPortfolioContent, toLangCode } from "@/lib/content";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = toLangCode(searchParams.get("lang") ?? "en");
    const content = await getPortfolioContent(lang);
    return NextResponse.json(content);
  } catch (error) {
    console.error("Content API error:", error);
    const message = error instanceof Error ? error.message : "Content not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
