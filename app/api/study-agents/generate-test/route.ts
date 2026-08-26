import { NextRequest, NextResponse } from "next/server";
import { getFastAPIUrl } from "../utils";
import { recordLlmUsage, resolveLlmAccess } from "@/lib/study-agents/llm-gateway";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiKey,
      difficulty = "medium",
      numQuestions = 5,
      topics,
      constraints,
      model,
      conversation_history,
      userId,
      chatId,
      providerKeys,
      provider_keys,
    } = body;

    const access = await resolveLlmAccess({
      userId,
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

    const response = await fetch(getFastAPIUrl("/api/generate-test"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: access.apiKey || "default",
        difficulty,
        num_questions: numQuestions,
        topics: topics || null,
        constraints: constraints || null,
        model: model || access.preferredModel || null,
        conversation_history: conversation_history || null,
        user_id: userId || null,
        chat_id: chatId || null,
        provider_keys: access.providerKeys,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Error al generar test" },
        { status: response.status },
      );
    }

    await recordLlmUsage({
      userId,
      entitlements: access.entitlements,
      tokensIn: data.inputTokens || 0,
      tokensOut: data.outputTokens || 0,
    });

    return NextResponse.json({
      success: true,
      test: data.test,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      plan: access.entitlements.plan,
    });
  } catch (error: unknown) {
    console.error("Error generating test:", error);
    const message =
      error instanceof Error ? error.message : "Error al generar test";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
