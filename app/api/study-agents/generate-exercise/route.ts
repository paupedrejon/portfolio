import { NextRequest, NextResponse } from "next/server";
import { getFastAPIUrl } from "../utils";
import { recordLlmUsage, resolveLlmAccess } from "@/lib/study-agents/llm-gateway";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiKey,
      difficulty = "medium",
      topics,
      exerciseType,
      constraints,
      model,
      conversationHistory,
      userId,
      user_id,
      chatId,
      chat_id,
      providerKeys,
      provider_keys,
    } = body;

    const uid = userId || user_id || null;
    const access = await resolveLlmAccess({
      userId: uid,
      apiKey,
      providerKeys: providerKeys || provider_keys,
    });

    if (!access.ok) {
      return NextResponse.json(
        {
          error: access.error,
          code: access.code,
          entitlements: access.entitlements,
        },
        { status: access.status },
      );
    }

    const response = await fetch(getFastAPIUrl("/api/generate-exercise"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: access.apiKey || "default",
        difficulty,
        topics: topics || null,
        exercise_type: exerciseType || null,
        constraints: constraints || null,
        model: model || access.preferredModel || null,
        conversation_history: conversationHistory || null,
        user_id: uid,
        chat_id: chatId || chat_id || null,
        provider_keys: access.providerKeys,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Error al generar ejercicio" },
        { status: response.status },
      );
    }

    await recordLlmUsage({
      userId: uid,
      entitlements: access.entitlements,
      tokensIn: data.inputTokens || 0,
      tokensOut: data.outputTokens || 0,
    });

    return NextResponse.json({
      success: true,
      exercise: data.exercise,
      exerciseId: data.exercise_id,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      adaptive: data.adaptive || null,
      plan: access.entitlements.plan,
    });
  } catch (error: unknown) {
    console.error("Error generating exercise:", error);
    const message =
      error instanceof Error ? error.message : "Error al generar ejercicio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
