import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/session-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/studio/dashboard")) {
    // Cookie presence only — JWT verify belongs in Node (/api/auth/me,
    // requireAdminSession). Edge verify can reject Node-signed tokens and
    // loop /studio ↔ /studio/dashboard.
    const token = request.cookies.get(AUTH_COOKIE)?.value;

    if (!token) {
      const loginUrl = new URL("/studio", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/studio/dashboard", "/studio/dashboard/:path*"],
};
