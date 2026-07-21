import { NextResponse } from "next/server";
import { getSessionFromCookies, getSessionFromRequest, type AdminSession } from "@/lib/auth";
import type { NextRequest } from "next/server";

export async function requireAdminSession(): Promise<AdminSession | NextResponse> {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export function requireAdminFromRequest(request: NextRequest): AdminSession | NextResponse {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export function isUnauthorized(result: AdminSession | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
