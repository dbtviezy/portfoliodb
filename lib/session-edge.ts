import { jwtVerify } from "jose";

export const AUTH_COOKIE = "admin_token";

export type AdminSession = {
  adminId: number;
  email: string;
};

/** Shared by Edge middleware and Node route handlers — must stay identical. */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "dev-only-jwt-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const adminId = Number(payload.adminId);
    const email = String(payload.email ?? "");

    if (!adminId || !email) return null;

    return { adminId, email };
  } catch {
    return null;
  }
}
