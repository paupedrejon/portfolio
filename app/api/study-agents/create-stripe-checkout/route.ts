import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount } = body;

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'user_id y amount requeridos' },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: 'El mínimo de recarga es 10€' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(getFastAPIUrl('/api/create-stripe-checkout'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        amount: parseFloat(amount),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al crear sesión de pago' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error creating Stripe checkout:', error);
    const message = error instanceof Error ? error.message : 'Error al crear sesión de pago';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}


