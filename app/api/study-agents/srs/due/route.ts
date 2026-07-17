import { NextRequest, NextResponse } from "next/server";
import { getFastAPIUrl } from "../../utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const chatId = searchParams.get("chatId");
    const limit = searchParams.get("limit") || "40";
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId requerido" }, { status: 400 });
    }
    const qs = new URLSearchParams({ userId, limit });
    if (chatId) qs.set("chatId", chatId);
    const response = await fetch(getFastAPIUrl(`/api/srs/due?${qs}`), {
      method: "GET",
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || data.error || response.statusText },
        { status: response.status },
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
