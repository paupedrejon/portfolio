import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, user_id, input_tokens, output_tokens, cost, model } = body;

    if (!apiKey || !user_id || input_tokens === undefined || output_tokens === undefined || cost === undefined || !model) {
      return NextResponse.json(
        { success: false, error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    const fastapiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
    const response = await fetch(`${fastapiUrl}/api/save-stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey,
        user_id,
        input_tokens,
        output_tokens,
        cost,
        model,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error en save-stats:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error al guardar estadísticas" },
      { status: 500 }
    );
  }
}
