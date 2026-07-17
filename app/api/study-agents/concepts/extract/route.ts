import { NextRequest, NextResponse } from "next/server";
import { getFastAPIUrl } from "../../utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(getFastAPIUrl("/api/concepts/extract"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: body.apiKey,
        chatId: body.chatId,
        userId: body.userId || "default",
        max_concepts: body.max_concepts ?? 25,
      }),
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
