import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { admin_user_id } = body;

    if (!admin_user_id) {
      return NextResponse.json(
        { error: 'admin_user_id requerido' },
        { status: 400 }
      );
    }

    const response = await fetch(getFastAPIUrl('/api/admin-payments'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin_user_id: admin_user_id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error obteniendo pagos' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error obteniendo pagos de admin:', error);
    const message = error instanceof Error ? error.message : 'Error obteniendo pagos';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

