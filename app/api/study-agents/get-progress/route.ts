import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id requerido' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(getFastAPIUrl('/api/get-progress'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al obtener progreso' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      progress: data.progress || {},
    });
  } catch (error: unknown) {
    console.error('Error getting progress:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener progreso';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

