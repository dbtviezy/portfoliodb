import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  authCookieOptions,
  createToken,
} from "@/lib/auth";
import { findAdminForLogin } from "@/lib/bootstrap-admin";
import { assertProductionSecrets, mapLoginError } from "@/lib/login-errors";

export async function POST(request: Request) {
  const misconfigured = assertProductionSecrets();
  if (misconfigured) {
    return NextResponse.json(
      { error: misconfigured.error, code: misconfigured.code },
      { status: misconfigured.status }
    );
  }

  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const admin = await findAdminForLogin(email, password);
    if (!admin) {
      return NextResponse.json(
        { error: "Invalid credentials", code: "invalid_credentials" },
        { status: 401 }
      );
    }

    const token = await createToken({ adminId: admin.id, email: admin.email });
    const response = NextResponse.json({ ok: true, email: admin.email });
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return response;
  } catch (error) {
    console.error("Login error:", error);
    const mapped = mapLoginError(error);
    return NextResponse.json(
      { error: mapped.error, code: mapped.code },
      { status: mapped.status }
    );
  }
}
