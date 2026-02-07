import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${FASTAPI_URL}/api/regenerate-course-summaries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || "Error al regenerar resúmenes" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error en regenerate-course-summaries:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error desconocido" },
      { status: 500 }
    );
  }
}

