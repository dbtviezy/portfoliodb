import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/studio/dashboard")) {
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    if (!token || !verifyToken(token)) {
      const loginUrl = new URL("/studio", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/studio/dashboard/:path*"],
};
