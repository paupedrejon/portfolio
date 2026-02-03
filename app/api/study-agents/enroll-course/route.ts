import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, examDate } = body;

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'user_id y course_id requeridos' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(getFastAPIUrl('/api/enroll-course'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        course_id: courseId,
        exam_date: examDate || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al inscribirse en el curso' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error enrolling in course:', error);
    const message = error instanceof Error ? error.message : 'Error al inscribirse en el curso';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

