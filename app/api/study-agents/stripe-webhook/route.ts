import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

// Desactivar el body parser para recibir el payload raw de Stripe
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Obtener el payload raw y la firma de Stripe
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Reenviar el webhook al backend FastAPI con el body raw
    // El backend se encarga de verificar la firma y procesar el evento
    const response = await fetch(getFastAPIUrl('/api/stripe-webhook'), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain', // Enviar como texto plano para mantener el formato raw
        'stripe-signature': signature,
      },
      body: body, // Enviar el body raw tal cual
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error en webhook de Stripe:', data);
      return NextResponse.json(
        { error: data.detail || 'Error procesando webhook' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error procesando webhook de Stripe:', error);
    const message = error instanceof Error ? error.message : 'Error procesando webhook';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

