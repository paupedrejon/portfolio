import { NextRequest, NextResponse } from "next/server";
import { getFastAPIUrl } from "../utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiKey,
      topic,
      days = 7,
      minutes_per_day = 45,
      goal,
      model,
      userId,
      chatId,
    } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "API key requerida" }, { status: 400 });
    }
    if (!topic?.trim()) {
      return NextResponse.json({ error: "topic es obligatorio" }, { status: 400 });
    }

    const response = await fetch(getFastAPIUrl("/api/generate-study-plan"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        topic: topic.trim(),
        days,
        minutes_per_day,
        goal: goal || null,
        model: model || null,
        user_id: userId || "default",
        chat_id: chatId || null,
      }),
    });

    if (!response.ok) {
      let errorData: { detail?: string; error?: string };
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      return NextResponse.json(
        { success: false, error: errorData.detail || errorData.error || "Error al generar plan" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
