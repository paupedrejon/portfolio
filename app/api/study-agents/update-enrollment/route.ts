import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, updates } = body;

    if (!userId || !courseId || !updates) {
      return NextResponse.json(
        { error: 'user_id, course_id y updates requeridos' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(getFastAPIUrl('/api/update-enrollment'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        course_id: courseId,
        updates,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al actualizar inscripción' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error updating enrollment:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar inscripción';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

