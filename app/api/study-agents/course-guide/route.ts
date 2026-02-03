import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, question, apiKey, model, userLevel } = body;

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'user_id y course_id requeridos' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key requerida' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(getFastAPIUrl('/api/course-guide'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        course_id: courseId,
        question: question || null,
        apiKey,
        model: model || null,
        user_level: userLevel || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al obtener guía del curso' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error getting course guide:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener guía del curso';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

