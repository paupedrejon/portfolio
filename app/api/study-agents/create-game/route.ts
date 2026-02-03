import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { course_id, user_id, max_players = 4, topic_filter } = body;

    if (!course_id || !user_id) {
      return NextResponse.json(
        { error: 'course_id y user_id son requeridos' },
        { status: 400 }
      );
    }

    const response = await fetch(getFastAPIUrl('/api/study-agents/create-game'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        course_id,
        user_id,
        max_players,
        topic_filter: topic_filter || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Error al crear partida' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en create-game:', error);
    return NextResponse.json(
      { error: 'Error al crear partida' },
      { status: 500 }
    );
  }
}

