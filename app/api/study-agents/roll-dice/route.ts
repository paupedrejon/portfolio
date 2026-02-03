import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

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

    const response = await fetch(getFastAPIUrl('/api/study-agents/roll-dice'), {
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
        { error: errorData.detail || 'Error al lanzar dado' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en roll-dice:', error);
    return NextResponse.json(
      { error: 'Error al lanzar dado' },
      { status: 500 }
    );
  }
}

