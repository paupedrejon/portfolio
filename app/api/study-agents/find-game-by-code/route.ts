import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

function getFastAPIUrl(path: string): string {
  return `${FASTAPI_URL}${path}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invite_code, user_id } = body;

    if (!invite_code || !user_id) {
      return NextResponse.json(
        { error: 'Código de invitación y user_id son requeridos' },
        { status: 400 }
      );
    }

    const response = await fetch(getFastAPIUrl('/api/study-agents/find-game-by-code'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invite_code,
        user_id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al buscar partida por código' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en find-game-by-code:', error);
    return NextResponse.json(
      { error: 'Error al buscar partida por código' },
      { status: 500 }
    );
  }
}


