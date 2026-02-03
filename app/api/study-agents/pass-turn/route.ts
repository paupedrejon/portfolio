import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

function getFastAPIUrl(path: string): string {
  return `${FASTAPI_URL}${path}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { game_id, user_id } = body;

    if (!game_id || !user_id) {
      return NextResponse.json(
        { error: 'game_id y user_id son requeridos' },
        { status: 400 }
      );
    }

    const response = await fetch(getFastAPIUrl('/api/study-agents/pass-turn'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_id,
        user_id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Error al pasar turno' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en pass-turn:', error);
    return NextResponse.json(
      { error: 'Error al pasar turno' },
      { status: 500 }
    );
  }
}


