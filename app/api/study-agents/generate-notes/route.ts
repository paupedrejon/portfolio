import { NextRequest, NextResponse } from "next/server";
import { getFastAPIUrl } from "../utils";
import { recordLlmUsage, resolveLlmAccess } from "@/lib/study-agents/llm-gateway";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiKey,
      topics,
      model,
      userId,
      conversationHistory,
      topic,
      providerKeys,
      provider_keys,
      chatId,
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

    try {
      const healthCheck = await fetch(getFastAPIUrl("/health"), {
        method: "GET",
      }).catch(() => null);

      if (!healthCheck || !healthCheck.ok) {
        return NextResponse.json(
          {
            error: `El backend FastAPI no está disponible. Por favor, inicia el servidor primero.`,
            hint: `Ejecuta en otra terminal: cd study_agents && python api/main.py`,
            url: process.env.FASTAPI_URL || "http://localhost:8000",
          },
          { status: 503 },
        );
      }
    } catch (healthError: unknown) {
      const details =
        healthError instanceof Error ? healthError.message : "Error desconocido";
      return NextResponse.json(
        {
          error: `No se pudo conectar al backend FastAPI`,
          hint: "Asegúrate de que FastAPI esté corriendo: cd study_agents && python api/main.py",
          details,
        },
        { status: 503 },
      );
    }

    const topicLooksLikeFile =
      typeof topic === "string" && /\.(pdf|png|jpe?g|webp)$/i.test(topic.trim());

    const response = await fetch(getFastAPIUrl("/api/generate-notes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: access.apiKey || "default",
        topics: topicLooksLikeFile ? null : topic ? [topic] : topics || null,
        model: model || access.preferredModel || null,
        user_id: userId || null,
        conversation_history: conversationHistory || null,
        topic: topicLooksLikeFile ? null : topic || null,
        chat_id: chatId || null,
        provider_keys: access.providerKeys,
      }),
    });

    if (response.status === 404) {
      return NextResponse.json(
        {
          error: `El endpoint /api/generate-notes no se encontró en FastAPI.`,
          hint: "Asegúrate de que el servidor FastAPI esté actualizado y corriendo.",
        },
        { status: 404 },
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Error al generar apuntes" },
        { status: response.status },
      );
    }

    await recordLlmUsage({ userId, entitlements: access.entitlements });

    return NextResponse.json({
      success: true,
      notes: data.notes,
      plan: access.entitlements.plan,
    });
  } catch (error: unknown) {
    console.error("Error generating notes:", error);
    const message =
      error instanceof Error ? error.message : "Error al generar apuntes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
