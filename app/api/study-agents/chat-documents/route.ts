import { NextRequest, NextResponse } from "next/server";
import { getFastAPIUrl } from "../utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const userId = searchParams.get("userId");
    const apiKey = searchParams.get("apiKey");

    if (!chatId || !userId || !apiKey) {
      return NextResponse.json(
        { error: "chatId, userId y apiKey son requeridos" },
        { status: 400 },
      );
    }

    const url = new URL(getFastAPIUrl(`/api/chat-documents/${encodeURIComponent(chatId)}`));
    url.searchParams.set("userId", userId);
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url.toString(), { method: "GET" });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: err.detail || "Error al listar documentos" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
