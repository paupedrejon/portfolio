import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || body.user_id;
    const language = body.language;

    if (!userId || !language) {
      return NextResponse.json(
        { error: "userId y language son requeridos" },
        { status: 400 }
      );
    }

    const response = await fetch(`${FASTAPI_URL}/api/get-learned-words`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        language: language,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Error al obtener palabras aprendidas" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      words: data.words,
    });
  } catch (error: any) {
    console.error("Error getting learned words:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener palabras aprendidas" },
      { status: 500 }
    );
  }
}
