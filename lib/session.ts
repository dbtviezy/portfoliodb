import { SignJWT } from "jose";
import {
  AUTH_COOKIE,
  getJwtSecret,
  verifySessionToken,
  type AdminSession,
} from "@/lib/session-edge";

export { AUTH_COOKIE, verifySessionToken, type AdminSession };

export async function createSessionToken(payload: AdminSession): Promise<string> {
  return new SignJWT({
    adminId: payload.adminId,
    email: payload.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export function authCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
