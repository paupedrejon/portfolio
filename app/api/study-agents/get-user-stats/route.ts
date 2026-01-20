import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    // Verificar que el body no esté vacío
    const text = await request.text();
    if (!text || text.trim() === '') {
      console.error('📊 [Next.js API] Error: Body vacío en get-user-stats');
      return NextResponse.json(
        { success: false, error: 'El body de la petición está vacío' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('📊 [Next.js API] Error al parsear JSON:', parseError);
      console.error('📊 [Next.js API] Text recibido:', text);
      return NextResponse.json(
        { success: false, error: 'JSON inválido en el body de la petición' },
        { status: 400 }
      );
    }

    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId requerido" },
        { status: 400 }
      );
    }

    const response = await fetch(`${FASTAPI_URL}/api/get-user-stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en get-user-stats: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { success: false, error: "Error al obtener estadísticas" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en get-user-stats:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

