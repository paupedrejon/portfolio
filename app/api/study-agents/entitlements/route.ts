import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStudyAgentsEntitlements } from "@/lib/study-agents/entitlements";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const qUser = request.nextUrl.searchParams.get("userId");
    const userId = session?.user?.id || qUser || "";

    if (!userId) {
      return NextResponse.json(
        { error: "Inicia sesión para ver tu plan." },
        { status: 401 },
      );
    }

    // Evitar que un cliente pida el plan de otro usuario si hay sesión
    if (session?.user?.id && qUser && qUser !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const entitlements = await getStudyAgentsEntitlements(userId);
    return NextResponse.json({ success: true, entitlements });
  } catch (e) {
    console.error("[entitlements]", e);
    return NextResponse.json(
      { error: "No se pudo cargar el plan." },
      { status: 500 },
    );
  }
}
