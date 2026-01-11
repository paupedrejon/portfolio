import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, topic, understandingScore } = body;

    if (!userId || !topic || understandingScore === undefined) {
      return NextResponse.json(
        { error: 'user_id, topic y understanding_score requeridos' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/update-chat-understanding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        topic: topic,
        understanding_score: understandingScore,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al actualizar comprensión del chat' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      progress_update: data.progress_update || {},
    });
  } catch (error: unknown) {
    console.error('Error updating chat understanding:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar comprensión del chat';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

