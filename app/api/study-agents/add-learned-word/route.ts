import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Convertir userId (camelCase) a user_id (snake_case) para el backend
    const backendBody = {
      user_id: body.userId || body.user_id,
      language: body.language,
      word: body.word,
      translation: body.translation,
      source: body.source || "unknown",
      example: body.example,
      romanization: body.romanization,
    };
    
    const response = await fetch(`${FASTAPI_URL}/api/add-learned-word`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendBody),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || "Error al agregar palabra" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in add-learned-word route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

