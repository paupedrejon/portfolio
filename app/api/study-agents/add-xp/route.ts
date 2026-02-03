import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, xpAmount } = body;

    if (!userId || !courseId || xpAmount === undefined) {
      return NextResponse.json(
        { error: 'user_id, course_id y xp_amount requeridos' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(getFastAPIUrl('/api/add-xp'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        course_id: courseId,
        xp_amount: xpAmount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al añadir XP' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error adding XP:', error);
    const message = error instanceof Error ? error.message : 'Error al añadir XP';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

