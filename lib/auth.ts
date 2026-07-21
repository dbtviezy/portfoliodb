import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE,
  authCookieOptions,
  createSessionToken,
  verifySessionToken,
  type AdminSession,
} from "@/lib/session";

export { AUTH_COOKIE, authCookieOptions, type AdminSession };

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export async function createToken(payload: AdminSession): Promise<string> {
  return createSessionToken(payload);
}

export async function verifyToken(token: string): Promise<AdminSession | null> {
  return verifySessionToken(token);
}

export async function getSessionFromCookies(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionFromRequest(request: NextRequest): Promise<AdminSession | null> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
