import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, chatId, level, topic } = body;

    if (!userId || !chatId || level === undefined) {
      return NextResponse.json(
        { error: 'userId, chatId y level son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el nivel esté entre 0 y 10
    const levelNum = parseInt(level, 10);
    if (isNaN(levelNum) || levelNum < 0 || levelNum > 10) {
      return NextResponse.json(
        { error: 'El nivel debe ser un número entre 0 y 10' },
        { status: 400 }
      );
    }

    console.log('📊 [Next.js API] Estableciendo nivel:', {
      userId,
      chatId,
      level: levelNum,
      topic
    });

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/set-chat-level`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        chat_id: chatId,
        level: levelNum,
        topic: topic || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al establecer el nivel' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      result: data.result,
    });
  } catch (error: any) {
    console.error('Error setting chat level:', error);
    return NextResponse.json(
      { error: error.message || 'Error al establecer el nivel' },
      { status: 500 }
    );
  }
}


