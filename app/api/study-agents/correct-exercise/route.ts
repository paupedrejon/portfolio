import { NextRequest, NextResponse } from "next/server";
import { getFastAPIUrl } from "../utils";
import { recordLlmUsage, resolveLlmAccess } from "@/lib/study-agents/llm-gateway";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiKey,
      exercise,
      studentAnswer,
      studentAnswerImage,
      userId,
      user_id,
      chatId,
      model,
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

    if (!exercise) {
      return NextResponse.json({ error: "Ejercicio requerido" }, { status: 400 });
    }

    if (!studentAnswer && !studentAnswerImage) {
      return NextResponse.json(
        { error: "Respuesta del estudiante requerida" },
        { status: 400 },
      );
    }

    const response = await fetch(getFastAPIUrl("/api/correct-exercise"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: access.apiKey || "default",
        exercise,
        student_answer: studentAnswer || "",
        student_answer_image: studentAnswerImage || null,
        user_id: uid,
        chat_id: chatId || null,
        model: model || access.preferredModel || null,
        provider_keys: access.providerKeys,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Error al corregir ejercicio" },
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
      correction: data.correction,
      progress_update: data.progress_update || null,
      exerciseId: data.exercise_id,
      points: data.points,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      mastery_updates: data.mastery_updates || [],
      plan: access.entitlements.plan,
    });
  } catch (error: unknown) {
    console.error("Error correcting exercise:", error);
    const message =
      error instanceof Error ? error.message : "Error al corregir ejercicio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
