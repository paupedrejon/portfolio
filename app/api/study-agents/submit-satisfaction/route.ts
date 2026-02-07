import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, rating, comment } = body;

    if (!userId || !courseId || !rating) {
      return NextResponse.json(
        { error: 'user_id, course_id y rating requeridos' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'El rating debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(getFastAPIUrl('/api/submit-satisfaction'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        course_id: courseId,
        rating,
        comment: comment || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al enviar feedback' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error submitting satisfaction:', error);
    const message = error instanceof Error ? error.message : 'Error al enviar feedback';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

