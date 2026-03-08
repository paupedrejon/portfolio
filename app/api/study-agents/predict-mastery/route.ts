import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, user_id, topic } = body;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API key requerida" },
        { status: 400 }
      );
    }

    const response = await fetch(`${FASTAPI_URL}/api/predict-mastery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey,
        user_id: user_id || "default",
        topic: topic || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Error al predecir tiempo de dominio";

      if (response.status === 404) {
        errorMessage = "El endpoint no existe. Asegúrate de que el backend esté corriendo y actualizado.";
      } else if (response.status === 500) {
        errorMessage = "Error en el servidor. Verifica los logs del backend.";
      } else {
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.error || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
        }
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en predict-mastery:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
