import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, limit = 10 } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: 'course_id requerido' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(getFastAPIUrl('/api/get-course-ranking'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        course_id: courseId,
        limit,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al obtener ranking' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error getting course ranking:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener ranking';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

