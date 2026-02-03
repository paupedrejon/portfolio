import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, amount, bankAccount } = body;

    if (!creatorId || !amount || !bankAccount) {
      return NextResponse.json(
        { error: 'creator_id, amount y bank_account requeridos' },
        { status: 400 }
      );
    }

    if (amount < 5) {
      return NextResponse.json(
        { error: 'El mínimo de retiro es 5€' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(getFastAPIUrl('/api/request-withdrawal'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creator_id: creatorId,
        amount: parseFloat(amount),
        bank_account: bankAccount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al procesar retiro' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error requesting withdrawal:', error);
    const message = error instanceof Error ? error.message : 'Error al procesar retiro';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}


