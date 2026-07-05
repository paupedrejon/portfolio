import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { getAdminAnalyticsSummary } from "@/lib/analytics/store";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const summary = await getAdminAnalyticsSummary();
  return NextResponse.json({ ok: true, summary });
}
