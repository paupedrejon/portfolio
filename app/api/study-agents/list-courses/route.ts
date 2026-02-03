import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, activeOnly = true } = body;

    // Llamar al backend FastAPI
    const response = await fetch(getFastAPIUrl('/api/list-courses'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creator_id: creatorId || null,
        active_only: activeOnly,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al listar cursos' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error listing courses:', error);
    const message = error instanceof Error ? error.message : 'Error al listar cursos';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

