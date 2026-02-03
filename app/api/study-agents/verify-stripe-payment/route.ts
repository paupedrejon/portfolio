import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId } = body;

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: 'userId y sessionId son requeridos' },
        { status: 400 }
      );
    }

    const response = await fetch(getFastAPIUrl('/api/verify-stripe-payment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error verificando pago' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error verificando pago de Stripe:', error);
    const message = error instanceof Error ? error.message : 'Error verificando pago';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

