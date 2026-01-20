import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, userId, apiKey, model } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL requerida" },
        { status: 400 }
      );
    }

    const response = await fetch(`${FASTAPI_URL}/api/process-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        user_id: userId,
        apiKey,
        model,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en process-url: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { success: false, error: "Error al procesar URL" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en process-url:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

