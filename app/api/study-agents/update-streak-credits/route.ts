import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, course_id } = body;

    if (!user_id || !course_id) {
      return NextResponse.json(
        { error: 'user_id y course_id son requeridos' },
        { status: 400 }
      );
    }

    const response = await fetch(getFastAPIUrl('/api/update-streak-credits'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user_id,
        course_id: course_id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error actualizando racha y créditos' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error actualizando racha y créditos:', error);
    const message = error instanceof Error ? error.message : 'Error actualizando racha y créditos';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

