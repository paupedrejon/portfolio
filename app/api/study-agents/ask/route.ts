import { NextRequest, NextResponse } from "next/server";
import { getFastAPIUrl } from "../utils";
import { recordLlmUsage, resolveLlmAccess } from "@/lib/study-agents/llm-gateway";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiKey,
      question,
      userId = "default",
      model,
      chatId,
      topic,
      providerKeys,
      provider_keys,
      initial_form_data,
    } = body;

    if (!question) {
      return NextResponse.json({ error: "Pregunta requerida" }, { status: 400 });
    }

    const access = await resolveLlmAccess({
      userId: userId === "default" ? "" : userId,
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

    const response = await fetch(getFastAPIUrl("/api/ask-question"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: access.apiKey,
        question,
        user_id: userId,
        model: model || access.preferredModel || null,
        chat_id: chatId || null,
        topic: topic || null,
        provider_keys: access.providerKeys,
        initial_form_data: initial_form_data || null,
      }),
    });

    if (!response.ok) {
      const raw = await response.text();
      let detail: string = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = raw ? JSON.parse(raw) : null;
        if (typeof errorData?.detail === "string") {
          detail = errorData.detail;
        } else if (Array.isArray(errorData?.detail)) {
          detail = JSON.stringify(errorData.detail);
        } else if (typeof errorData?.error === "string") {
          detail = errorData.error;
        } else if (raw?.trim()) {
          detail = raw.trim().slice(0, 500);
        }
      } catch {
        if (raw?.trim()) detail = raw.trim().slice(0, 500);
      }
      const injectedGroq = Boolean(access.providerKeys?.groq);
      console.error("Error from FastAPI:", {
        status: response.status,
        detail,
        injectedGroq,
        plan: access.entitlements.plan,
        vercelHasGroq: Boolean(process.env.GROQ_API_KEY?.trim()),
        raw: raw?.slice(0, 500),
      });
      return NextResponse.json(
        {
          success: false,
          error: detail || "Error al procesar pregunta",
          debug: {
            plan: access.entitlements.plan,
            vercelInjectedGroq: injectedGroq,
            vercelHasGroqKey: Boolean(process.env.GROQ_API_KEY?.trim()),
          },
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    await recordLlmUsage({
      userId: userId === "default" ? null : userId,
      entitlements: access.entitlements,
      tokensIn: data.inputTokens || 0,
      tokensOut: data.outputTokens || 0,
    });

    return NextResponse.json({
      success: true,
      answer: data.answer,
      question: data.question,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      entitlements: access.entitlements,
      plan: access.entitlements.plan,
    });
  } catch (error: unknown) {
    console.error("Error asking question:", error);
    const message =
      error instanceof Error ? error.message : "Error al procesar pregunta";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
