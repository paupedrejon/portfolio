import { NextRequest, NextResponse } from "next/server";
import { getFastAPIUrl } from "../utils";

async function proxy(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let chatId = searchParams.get("chatId") || searchParams.get("chat_id");
    let userId = searchParams.get("userId") || searchParams.get("user_id") || "default";

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      chatId = body.chatId || body.chat_id || chatId;
      userId = body.userId || body.user_id || userId;
    }

    if (!chatId) {
      return NextResponse.json({ success: false, error: "chatId requerido" }, { status: 400 });
    }

    const qs = new URLSearchParams({ chatId, userId });
    const response = await fetch(getFastAPIUrl(`/api/temporal-progress?${qs}`), {
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

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function POST(request: NextRequest) {
  return proxy(request);
}
