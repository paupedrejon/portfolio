import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, chatId } = body;

    if (!userId || !chatId) {
      return NextResponse.json(
        { error: 'user_id y chat_id requeridos' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/get-chat-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        chat_id: chatId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al obtener progreso del chat' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      progress: data.progress || {},
    });
  } catch (error: unknown) {
    console.error('Error getting chat progress:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener progreso del chat';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

