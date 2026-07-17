import { NextRequest, NextResponse } from "next/server";
import { getFastAPIUrl } from "../../utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ chatId: string }> },
) {
  try {
    const { chatId } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";
    const apiKey = searchParams.get("apiKey") || "";

    const qs = new URLSearchParams({ userId, apiKey });
    const response = await fetch(
      getFastAPIUrl(`/api/concepts/${encodeURIComponent(chatId)}?${qs}`),
      { method: "GET", cache: "no-store" },
    );
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
