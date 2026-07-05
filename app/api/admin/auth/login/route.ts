import { NextResponse } from "next/server";
import {
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminLogin,
} from "@/lib/admin/auth";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "admin_not_configured",
        hint: "Define ADMIN_EMAIL y ADMIN_PASSWORD en .env.local",
      },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!verifyAdminLogin(email, password)) {
      return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
    }

    const token = createAdminSessionToken(email.trim().toLowerCase());
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminSessionCookieOptions(token));
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
