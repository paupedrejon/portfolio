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

    const response = await fetch(getFastAPIUrl('/api/claim-daily-credits'), {
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
        { error: data.detail || 'Error reclamando créditos' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error reclamando créditos diarios:', error);
    const message = error instanceof Error ? error.message : 'Error reclamando créditos';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

