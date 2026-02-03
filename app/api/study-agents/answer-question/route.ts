import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { game_id, user_id, answer_index } = body;

    if (!game_id || !user_id || answer_index === undefined) {
      return NextResponse.json(
        { error: 'game_id, user_id y answer_index son requeridos' },
        { status: 400 }
      );
    }

    const response = await fetch(getFastAPIUrl('/api/study-agents/answer-question'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_id,
        user_id,
        answer_index,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Error al responder pregunta' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en answer-question:', error);
    return NextResponse.json(
      { error: 'Error al responder pregunta' },
      { status: 500 }
    );
  }
}

