import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, chatId, title, messages, metadata } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id requerido' },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages debe ser un array' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/save-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        chat_id: chatId || null,
        title: title || null,
        messages,
        metadata: metadata || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al guardar conversación' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error saving chat:', error);
    const message = error instanceof Error ? error.message : 'Error al guardar conversación';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

