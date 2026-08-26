import { NextRequest, NextResponse } from "next/server";
import { getFastAPIUrl } from "../utils";
import { recordLlmUsage, resolveLlmAccess } from "@/lib/study-agents/llm-gateway";

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
      providerKeys,
      provider_keys,
    } = body;

    if (!topic?.trim()) {
      return NextResponse.json({ error: "topic es obligatorio" }, { status: 400 });
    }

    const access = await resolveLlmAccess({
      userId,
      apiKey,
      providerKeys: providerKeys || provider_keys,
    });

    if (!access.ok) {
      return NextResponse.json(
        {
          success: false,
          error: access.error,
          code: access.code,
          entitlements: access.entitlements,
        },
        { status: access.status },
      );
    }

    const response = await fetch(getFastAPIUrl("/api/generate-study-plan"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: access.apiKey || "default",
        topic: topic.trim(),
        days,
        minutes_per_day,
        goal: goal || null,
        model: model || access.preferredModel || null,
        user_id: userId || "default",
        chat_id: chatId || null,
        provider_keys: access.providerKeys,
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
        {
          success: false,
          error: errorData.detail || errorData.error || "Error al generar plan",
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    await recordLlmUsage({
      userId,
      entitlements: access.entitlements,
      tokensIn: data.inputTokens || 0,
      tokensOut: data.outputTokens || 0,
    });

    return NextResponse.json({ success: true, ...data, plan: data.plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
