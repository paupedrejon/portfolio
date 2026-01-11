import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, topic, scorePercentage, chatId } = body;

    if (!userId || !topic || scorePercentage === undefined) {
      return NextResponse.json(
        { error: 'user_id, topic y score_percentage requeridos' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    console.log(`📊 [Next.js] Llamando a FastAPI: ${FASTAPI_URL}/api/update-test-progress`);
    console.log(`📊 [Next.js] Datos: userId=${userId}, topic=${topic}, scorePercentage=${scorePercentage}, chatId=${chatId}`);
    
    const response = await fetch(`${FASTAPI_URL}/api/update-test-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        topic: topic,
        score_percentage: scorePercentage,
        chat_id: chatId || null,  // Pasar chat_id si está disponible
      }),
    });

    console.log(`📊 [Next.js] Respuesta de FastAPI: status=${response.status}, ok=${response.ok}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`📊 [Next.js] Error de FastAPI: ${errorText}`);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }
      return NextResponse.json(
        { error: errorData.detail || 'Error al actualizar progreso del test' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`📊 [Next.js] Datos recibidos de FastAPI:`, data);

    return NextResponse.json({
      success: true,
      progress_update: data.progress_update || {},
    });
  } catch (error: unknown) {
    console.error('Error updating test progress:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar progreso del test';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

